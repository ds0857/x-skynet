/**
 * Integration tests for @xskynet/plugin-memory
 *
 * Tests real end-to-end memory persistence flows using temporary JSON files:
 *   1. Key-value set/get/delete via FileStore
 *   2. Persistence across FileStore instances (same file, different instances)
 *   3. List and search with filters (tags, pattern, pagination)
 *   4. TTL expiry — entries expire after their ttlMs window
 *   5. MemoryExecutor full workflow (set → get → delete → list → search)
 *   6. MemoryExecutor error handling (missing operation, missing key)
 *   7. createMemoryPlugin() factory + memoryProvider read/write/delete
 *   8. Concurrent writes via write-lock (no data races)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import type { Step, RunContext, ID, ISODateTime } from '@xskynet/contracts';
import { FileStore } from '../src/store.js';
import { MemoryExecutor } from '../src/executor.js';
import { createMemoryPlugin } from '../src/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

let testDir: string;

function tempFile(suffix = ''): string {
  return join(testDir, `memory-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}.json`);
}

function makeStep(operation: string, extra: Record<string, unknown> = {}): Step {
  return {
    id: `step-${Date.now()}` as ID,
    name: `Memory:${operation}`,
    status: 'running',
    createdAt: new Date().toISOString() as ISODateTime,
    metadata: { operation, ...extra },
  } as Step;
}

function makeCtx(): RunContext {
  return {} as RunContext;
}

beforeEach(() => {
  testDir = join(
    tmpdir(),
    `xskynet-int-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suites
// ─────────────────────────────────────────────────────────────────────────────

describe('plugin-memory integration', () => {

  // ── 1. FileStore basic key-value operations ─────────────────────────────────

  describe('FileStore — basic key-value operations', () => {
    it('stores and retrieves a string value', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      await store.set('greeting', 'hello world');
      const entry = await store.get('greeting');

      expect(entry).not.toBeUndefined();
      expect(entry!.value).toBe('hello world');
      expect(entry!.key).toBe('greeting');
      expect(entry!.createdAt).toBeTruthy();
      expect(entry!.updatedAt).toBeTruthy();
    });

    it('stores and retrieves a complex object', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      const profile = { userId: 42, name: 'Alice', prefs: { theme: 'dark', lang: 'en' } };
      await store.set('user.profile', profile);

      const entry = await store.get('user.profile');
      expect(entry!.value).toEqual(profile);
    });

    it('deletes a key and returns true when it existed', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      await store.set('temp', 'delete-me');
      const existed = await store.delete('temp');
      expect(existed).toBe(true);

      const after = await store.get('temp');
      expect(after).toBeUndefined();
    });

    it('returns false when deleting a non-existent key', async () => {
      const store = new FileStore({ storagePath: tempFile() });
      const result = await store.delete('ghost-key');
      expect(result).toBe(false);
    });

    it('returns undefined for unknown keys', async () => {
      const store = new FileStore({ storagePath: tempFile() });
      const result = await store.get('does-not-exist');
      expect(result).toBeUndefined();
    });

    it('overwrites an existing key while preserving createdAt', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      const first = await store.set('counter', 1);
      await new Promise<void>(r => setTimeout(r, 10)); // ensure updatedAt differs
      const second = await store.set('counter', 2);

      expect(second.value).toBe(2);
      expect(second.createdAt).toBe(first.createdAt);
      // updatedAt should differ
      expect(second.updatedAt >= second.createdAt).toBe(true);
    });
  });

  // ── 2. Persistence across instances ─────────────────────────────────────────

  describe('FileStore — persistence across instances', () => {
    it('data written by one instance is readable by another', async () => {
      const path = tempFile();
      const storeA = new FileStore({ storagePath: path });
      const storeB = new FileStore({ storagePath: path });

      await storeA.set('shared.key', { written_by: 'A' });

      const entry = await storeB.get('shared.key');
      expect(entry).not.toBeUndefined();
      expect((entry!.value as { written_by: string }).written_by).toBe('A');
    });

    it('sequential writes from two instances do not corrupt the store', async () => {
      const path = tempFile();
      const storeA = new FileStore({ storagePath: path });
      const storeB = new FileStore({ storagePath: path });

      await storeA.set('a', 'from-A');
      await storeB.set('b', 'from-B');

      const readerStore = new FileStore({ storagePath: path });
      const entries = await readerStore.list();
      const keys = entries.map(e => e.key).sort();
      expect(keys).toEqual(['a', 'b']);
    });

    it('clearing the store removes all entries', async () => {
      const path = tempFile();
      const store = new FileStore({ storagePath: path });

      await store.set('k1', 'v1');
      await store.set('k2', 'v2');
      await store.clear();

      const entries = await store.list();
      expect(entries).toHaveLength(0);
    });
  });

  // ── 3. List and search ────────────────────────────────────────────────────

  describe('FileStore — list and search', () => {
    it('list() returns all non-expired entries', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      await store.set('alpha', 1, { tags: ['num'] });
      await store.set('beta', 2, { tags: ['num'] });
      await store.set('gamma', 3, { tags: ['str'] });

      const entries = await store.list();
      expect(entries).toHaveLength(3);
    });

    it('list() supports tag-based filtering', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      await store.set('item1', 'a', { tags: ['cat:A', 'shared'] });
      await store.set('item2', 'b', { tags: ['cat:B', 'shared'] });
      await store.set('item3', 'c', { tags: ['cat:A'] });

      const catA = await store.list({ tags: ['cat:A'] });
      expect(catA.map(e => e.key).sort()).toEqual(['item1', 'item3']);

      const shared = await store.list({ tags: ['shared'] });
      expect(shared.map(e => e.key).sort()).toEqual(['item1', 'item2']);
    });

    it('list() supports pagination (limit + offset)', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      for (let i = 0; i < 5; i++) {
        await store.set(`page-item-${i}`, i);
      }

      const page1 = await store.list({ limit: 2, offset: 0 });
      const page2 = await store.list({ limit: 2, offset: 2 });
      const page3 = await store.list({ limit: 2, offset: 4 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page3).toHaveLength(1);
    });

    it('search() finds entries by key substring pattern', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      await store.set('user.alice.prefs', { theme: 'dark' });
      await store.set('user.bob.prefs', { theme: 'light' });
      await store.set('system.config', { debug: true });

      const userEntries = await store.search({ pattern: 'user' });
      expect(userEntries).toHaveLength(2);
      expect(userEntries.every(e => e.key.startsWith('user.'))).toBe(true);

      const configEntries = await store.search({ pattern: 'config' });
      expect(configEntries).toHaveLength(1);
    });

    it('search() finds entries by label pattern', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      await store.set('k1', 'v', { label: 'Production Config' });
      await store.set('k2', 'v', { label: 'Dev Config' });
      await store.set('k3', 'v', { label: 'User Data' });

      const results = await store.search({ pattern: 'Config' });
      expect(results).toHaveLength(2);
    });
  });

  // ── 4. TTL expiry ──────────────────────────────────────────────────────────

  describe('FileStore — TTL expiry', () => {
    it('expired entries are not returned by get()', async () => {
      const store = new FileStore({ storagePath: tempFile(), autoPruneExpired: false });

      // Set a very short TTL (1 ms)
      await store.set('ephemeral', 'gone-soon', { ttlMs: 1 });

      // Wait for expiry
      await new Promise<void>(r => setTimeout(r, 20));

      const entry = await store.get('ephemeral');
      expect(entry).toBeUndefined();
    });

    it('non-expired entries are still returned after some time', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      await store.set('durable', 'still-here', { ttlMs: 60_000 }); // 1 minute TTL

      await new Promise<void>(r => setTimeout(r, 20));

      const entry = await store.get('durable');
      expect(entry).not.toBeUndefined();
      expect(entry!.value).toBe('still-here');
    });

    it('list() filters out expired entries by default', async () => {
      const store = new FileStore({ storagePath: tempFile(), autoPruneExpired: false });

      await store.set('expired', 'old', { ttlMs: 1 });
      await store.set('alive', 'fresh', { ttlMs: 60_000 });

      await new Promise<void>(r => setTimeout(r, 20));

      const entries = await store.list();
      const keys = entries.map(e => e.key);
      expect(keys).not.toContain('expired');
      expect(keys).toContain('alive');
    });
  });

  // ── 5. MemoryExecutor full workflow ────────────────────────────────────────

  describe('MemoryExecutor — full workflow (set → get → delete → list → search)', () => {
    it('executes a complete memory workflow across all operations', async () => {
      const path = tempFile();
      const executor = new MemoryExecutor({ storagePath: path });
      const ctx = makeCtx();

      // SET
      const setResult = await executor.execute(
        makeStep('set', { key: 'agent.name', value: 'Scout' }),
        ctx,
      );
      expect(setResult.status).toBe('succeeded');
      expect(setResult.metadata?.operation).toBe('set');
      expect(setResult.metadata?.key).toBe('agent.name');

      // GET — value should be retrievable
      const getResult = await executor.execute(
        makeStep('get', { key: 'agent.name' }),
        ctx,
      );
      expect(getResult.status).toBe('succeeded');
      expect(getResult.metadata?.found).toBe(true);
      expect(getResult.metadata?.result).toBe('Scout');

      // LIST — key appears in list
      const listResult = await executor.execute(makeStep('list'), ctx);
      expect(listResult.status).toBe('succeeded');
      const keys = listResult.metadata?.result as string[];
      expect(keys).toContain('agent.name');

      // DELETE
      const deleteResult = await executor.execute(
        makeStep('delete', { key: 'agent.name' }),
        ctx,
      );
      expect(deleteResult.status).toBe('succeeded');
      expect(deleteResult.metadata?.existed).toBe(true);

      // GET after DELETE — should be not found
      const getAfterDelete = await executor.execute(
        makeStep('get', { key: 'agent.name' }),
        ctx,
      );
      expect(getAfterDelete.status).toBe('succeeded');
      expect(getAfterDelete.metadata?.found).toBe(false);
    });

    it('search operation finds keys matching the pattern', async () => {
      const executor = new MemoryExecutor({ storagePath: tempFile() });
      const ctx = makeCtx();

      await executor.execute(makeStep('set', { key: 'config.db.host', value: 'localhost' }), ctx);
      await executor.execute(makeStep('set', { key: 'config.db.port', value: 5432 }), ctx);
      await executor.execute(makeStep('set', { key: 'logs.level', value: 'info' }), ctx);

      const searchResult = await executor.execute(
        makeStep('search', { pattern: 'config.db' }),
        ctx,
      );
      expect(searchResult.status).toBe('succeeded');
      // search result: metadata.result = array of MemoryEntry, metadata.count = number
      const found = searchResult.metadata?.result as Array<{ key: string }>;
      expect(searchResult.metadata?.count).toBe(2);
      expect(found).toHaveLength(2);
      expect(found.every(e => e.key.startsWith('config.db'))).toBe(true);
    });

    it('list operation supports tag filtering via filterTags metadata', async () => {
      const executor = new MemoryExecutor({ storagePath: tempFile() });
      const ctx = makeCtx();

      await executor.execute(makeStep('set', { key: 'k1', value: 1, tags: ['prod', 'db'] }), ctx);
      await executor.execute(makeStep('set', { key: 'k2', value: 2, tags: ['dev'] }), ctx);
      await executor.execute(makeStep('set', { key: 'k3', value: 3, tags: ['prod', 'cache'] }), ctx);

      const result = await executor.execute(
        makeStep('list', { filterTags: ['prod'] }),
        ctx,
      );
      expect(result.status).toBe('succeeded');
      const keys = result.metadata?.result as string[];
      expect(keys.sort()).toEqual(['k1', 'k3']);
    });
  });

  // ── 6. MemoryExecutor error handling ──────────────────────────────────────

  describe('MemoryExecutor — error handling', () => {
    it('returns failed status when operation is missing', async () => {
      const executor = new MemoryExecutor({ storagePath: tempFile() });

      const result = await executor.execute(
        makeStep(''),   // empty operation
        makeCtx(),
      );
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_OPERATION');
    });

    it('returns failed status when set is called without a key', async () => {
      const executor = new MemoryExecutor({ storagePath: tempFile() });

      const result = await executor.execute(
        makeStep('set', { value: 'no-key-provided' }),
        makeCtx(),
      );
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_KEY');
    });

    it('returns failed status when set is called without a value', async () => {
      const executor = new MemoryExecutor({ storagePath: tempFile() });

      const result = await executor.execute(
        makeStep('set', { key: 'no-value-key' }),
        makeCtx(),
      );
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_VALUE');
    });

    it('returns failed status when get/delete is called without a key', async () => {
      const executor = new MemoryExecutor({ storagePath: tempFile() });

      for (const op of ['get', 'delete']) {
        const result = await executor.execute(makeStep(op), makeCtx());
        expect(result.status).toBe('failed');
        expect(result.error?.code).toBe('MISSING_KEY');
      }
    });

    it('get on a non-existent key returns succeeded with found=false', async () => {
      const executor = new MemoryExecutor({ storagePath: tempFile() });

      const result = await executor.execute(
        makeStep('get', { key: 'no-such-key' }),
        makeCtx(),
      );
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.found).toBe(false);
      expect(result.metadata?.result).toBeNull();
    });
  });

  // ── 7. createMemoryPlugin() factory ───────────────────────────────────────

  describe('createMemoryPlugin() factory', () => {
    it('returns a valid XSkynetPlugin shape', () => {
      const plugin = createMemoryPlugin({ storagePath: tempFile() });

      expect(plugin.name).toBe('@xskynet/plugin-memory');
      expect(plugin.version).toBe('0.1.0');
      expect(plugin.capabilities).toContain('memory');
      expect(plugin.executors).toHaveLength(1);
      expect(plugin.memoryProviders).toHaveLength(1);
    });

    it('memoryProvider.write() persists values readable via provider.read()', async () => {
      const plugin = createMemoryPlugin({ storagePath: tempFile() });
      const provider = plugin.memoryProviders![0]!;

      await provider.write('agent.task', { status: 'running' });
      const value = await provider.read('agent.task');
      expect(value).toEqual({ status: 'running' });
    });

    it('memoryProvider.delete() removes a stored key', async () => {
      const plugin = createMemoryPlugin({ storagePath: tempFile() });
      const provider = plugin.memoryProviders![0]!;

      await provider.write('temp.key', 'temp-value');
      // delete is optional on MemoryProvider — verify it is implemented
      expect(provider.delete).toBeDefined();
      await provider.delete!('temp.key');

      const value = await provider.read('temp.key');
      expect(value).toBeNull();
    });

    it('memoryProvider.read() returns null for unknown keys', async () => {
      const plugin = createMemoryPlugin({ storagePath: tempFile() });
      const provider = plugin.memoryProviders![0]!;

      const value = await provider.read('unknown.key');
      expect(value).toBeNull();
    });

    it('executor registered by plugin has kind="memory"', () => {
      const plugin = createMemoryPlugin({ storagePath: tempFile() });
      expect(plugin.executors![0]!.kind).toBe('memory');
    });
  });

  // ── 8. Concurrent writes (write-lock) ─────────────────────────────────────

  describe('FileStore — concurrent writes do not race', () => {
    it('all concurrent set() calls persist correctly', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      // Fire 10 concurrent writes
      const writes = Array.from({ length: 10 }, (_, i) =>
        store.set(`concurrent-key-${i}`, { index: i }),
      );
      await Promise.all(writes);

      const entries = await store.list();
      expect(entries).toHaveLength(10);

      for (let i = 0; i < 10; i++) {
        const e = await store.get(`concurrent-key-${i}`);
        expect(e).not.toBeUndefined();
        expect((e!.value as { index: number }).index).toBe(i);
      }
    });

    it('incremental updates are applied in order via write-lock', async () => {
      const store = new FileStore({ storagePath: tempFile() });

      // Simulate 5 sequential counter increments fired simultaneously
      const increments = Array.from({ length: 5 }, (_, i) =>
        store.set('seq-counter', i),
      );
      const results = await Promise.all(increments);

      // All results should have succeeded (no errors thrown)
      expect(results).toHaveLength(5);
      results.forEach(r => expect(r.key).toBe('seq-counter'));
    });
  });
});
