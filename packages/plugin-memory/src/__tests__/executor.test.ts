/**
 * MemoryExecutor unit tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MemoryExecutor } from '../executor.js';
import type { MemoryStore } from '../store.js';
import type { MemoryEntry, MemoryQuery } from '../types.js';
import type { Step, RunContext, ID, ISODateTime } from '@xskynet/contracts';

// ── Mock MemoryStore ──────────────────────────────────────────────────────────

function makeEntry(key: string, value: unknown, opts: Partial<MemoryEntry> = {}): MemoryEntry {
  const now = new Date().toISOString();
  return { key, value, createdAt: now, updatedAt: now, ...opts };
}

class MockMemoryStore implements MemoryStore {
  private map = new Map<string, MemoryEntry>();

  async set(
    key: string,
    value: unknown,
    opts: Partial<Pick<MemoryEntry, 'label' | 'tags' | 'ttlMs'>> = {},
  ): Promise<MemoryEntry> {
    const entry = makeEntry(key, value, opts);
    this.map.set(key, entry);
    return entry;
  }

  async get(key: string): Promise<MemoryEntry | undefined> {
    return this.map.get(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.map.delete(key);
  }

  async list(_query?: MemoryQuery): Promise<MemoryEntry[]> {
    return Array.from(this.map.values());
  }

  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    return this.list(query);
  }

  async clear(): Promise<void> {
    this.map.clear();
  }

  /** Expose internal map for test assertions */
  get size(): number {
    return this.map.size;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStep(
  operation: string | undefined,
  extra: Record<string, unknown> = {},
): Step {
  return {
    id: 'step-id' as ID,
    name: 'Test Step',
    status: 'running',
    createdAt: new Date().toISOString() as ISODateTime,
    metadata: operation !== undefined ? { operation, ...extra } : extra,
  } as Step;
}

function makeCtx(): RunContext {
  return {} as RunContext;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('MemoryExecutor', () => {
  let executor: MemoryExecutor;
  let mockStore: MockMemoryStore;

  beforeEach(() => {
    mockStore = new MockMemoryStore();
    executor = new MemoryExecutor(undefined, mockStore);
  });

  // ── metadata ────────────────────────────────────────────────────────────────

  describe('kind', () => {
    it('has kind = "memory"', () => {
      expect(executor.kind).toBe('memory');
    });
  });

  describe('getStore()', () => {
    it('returns the underlying store', () => {
      expect(executor.getStore()).toBe(mockStore);
    });
  });

  // ── missing operation ────────────────────────────────────────────────────────

  describe('missing operation', () => {
    it('returns MISSING_OPERATION when operation field is absent', async () => {
      const step = makeStep(undefined);
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_OPERATION');
    });

    it('returns MISSING_OPERATION when operation is empty string', async () => {
      const step = makeStep('');
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_OPERATION');
    });
  });

  // ── set ─────────────────────────────────────────────────────────────────────

  describe('set operation', () => {
    it('stores a value successfully', async () => {
      const step = makeStep('set', { key: 'user.theme', value: 'dark' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.operation).toBe('set');
      expect(result.metadata?.key).toBe('user.theme');
    });

    it('fails when key is missing', async () => {
      const step = makeStep('set', { value: 'dark' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_KEY');
    });

    it('fails when key is an empty string', async () => {
      const step = makeStep('set', { key: '', value: 'dark' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_KEY');
    });

    it('fails when value is missing', async () => {
      const step = makeStep('set', { key: 'key1' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_VALUE');
    });

    it('passes label to store', async () => {
      const step = makeStep('set', { key: 'k', value: 'v', label: 'My Label' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('passes tags to store', async () => {
      const step = makeStep('set', { key: 'k', value: 'v', tags: ['t1', 't2'] });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('passes ttlMs to store', async () => {
      const step = makeStep('set', { key: 'k', value: 'v', ttlMs: 1000 });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('result metadata includes the stored entry', async () => {
      const step = makeStep('set', { key: 'some-key', value: 42 });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      // The output artifact should wrap the entry
      expect(result.output).toBeDefined();
    });
  });

  // ── get ─────────────────────────────────────────────────────────────────────

  describe('get operation', () => {
    it('retrieves an existing value', async () => {
      await mockStore.set('user.lang', 'en');
      const step = makeStep('get', { key: 'user.lang' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.found).toBe(true);
      expect(result.metadata?.result).toBe('en');
    });

    it('returns succeeded with found=false for missing key', async () => {
      const step = makeStep('get', { key: 'nonexistent' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.found).toBe(false);
      expect(result.metadata?.result).toBeNull();
    });

    it('fails when key is missing', async () => {
      const step = makeStep('get');
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_KEY');
    });

    it('fails when key is an empty string', async () => {
      const step = makeStep('get', { key: '' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_KEY');
    });

    it('includes the entry in metadata when found', async () => {
      await mockStore.set('data-key', { payload: true });
      const step = makeStep('get', { key: 'data-key' });
      const result = await executor.execute(step, makeCtx());
      expect(result.metadata?.entry).toBeDefined();
      expect((result.metadata!.entry as MemoryEntry).key).toBe('data-key');
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────────

  describe('delete operation', () => {
    it('deletes an existing key (existed=true)', async () => {
      await mockStore.set('to-remove', 'val');
      const step = makeStep('delete', { key: 'to-remove' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.existed).toBe(true);
    });

    it('succeeds for nonexistent key (existed=false)', async () => {
      const step = makeStep('delete', { key: 'ghost' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.existed).toBe(false);
    });

    it('fails when key is missing', async () => {
      const step = makeStep('delete');
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_KEY');
    });

    it('fails when key is an empty string', async () => {
      const step = makeStep('delete', { key: '' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('MISSING_KEY');
    });

    it('result metadata reflects deletion', async () => {
      await mockStore.set('x', 1);
      const step = makeStep('delete', { key: 'x' });
      const result = await executor.execute(step, makeCtx());
      expect(result.metadata?.operation).toBe('delete');
      expect(result.metadata?.key).toBe('x');
    });
  });

  // ── list ─────────────────────────────────────────────────────────────────────

  describe('list operation', () => {
    it('returns keys of all stored entries', async () => {
      await mockStore.set('a', 1);
      await mockStore.set('b', 2);
      const step = makeStep('list');
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.operation).toBe('list');
      expect((result.metadata?.result as string[]).sort()).toEqual(['a', 'b']);
    });

    it('returns empty list when store is empty', async () => {
      const step = makeStep('list');
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.count).toBe(0);
    });

    it('passes limit to store', async () => {
      const step = makeStep('list', { limit: 5 });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('passes offset to store', async () => {
      const step = makeStep('list', { offset: 2 });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('passes filterTags to store', async () => {
      const step = makeStep('list', { filterTags: ['tag1'] });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('passes filterExpired to store', async () => {
      const step = makeStep('list', { filterExpired: false });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('metadata includes entries array', async () => {
      await mockStore.set('key', 'val');
      const step = makeStep('list');
      const result = await executor.execute(step, makeCtx());
      expect(Array.isArray(result.metadata?.entries)).toBe(true);
    });
  });

  // ── search ───────────────────────────────────────────────────────────────────

  describe('search operation', () => {
    it('searches entries and returns them', async () => {
      await mockStore.set('user.theme', 'dark');
      await mockStore.set('user.lang', 'en');
      await mockStore.set('system.ver', '1.0');
      const step = makeStep('search', { pattern: 'user' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.operation).toBe('search');
      expect(result.metadata?.pattern).toBe('user');
    });

    it('returns succeeded with count=0 when nothing matches', async () => {
      const step = makeStep('search', { pattern: 'zzz-no-match' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.count).toBe(0);
    });

    it('passes pattern to store', async () => {
      const step = makeStep('search', { pattern: 'abc' });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('passes limit, offset, filterTags, filterExpired', async () => {
      const step = makeStep('search', {
        pattern: 'x',
        limit: 10,
        offset: 0,
        filterTags: ['t1'],
        filterExpired: false,
      });
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
    });

    it('defaults pattern to empty string in metadata when not provided', async () => {
      const step = makeStep('search');
      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');
      expect(result.metadata?.pattern).toBe('');
    });

    it('result output contains entry objects', async () => {
      await mockStore.set('found', 'val');
      const step = makeStep('search', {});
      const result = await executor.execute(step, makeCtx());
      expect(result.output).toBeDefined();
    });
  });

  // ── STORE_ERROR ──────────────────────────────────────────────────────────────

  describe('store error handling', () => {
    it('returns STORE_ERROR when store.set() throws', async () => {
      const errorStore: MemoryStore = {
        set: async () => { throw new Error('disk full'); },
        get: async () => undefined,
        delete: async () => false,
        list: async () => [],
        search: async () => [],
        clear: async () => {},
      };
      const e = new MemoryExecutor(undefined, errorStore);
      const result = await e.execute(makeStep('set', { key: 'k', value: 'v' }), makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('STORE_ERROR');
      expect(result.error?.message).toContain('disk full');
    });

    it('returns STORE_ERROR when store.get() throws', async () => {
      const errorStore: MemoryStore = {
        set: async () => makeEntry('k', 'v'),
        get: async () => { throw new Error('read error'); },
        delete: async () => false,
        list: async () => [],
        search: async () => [],
        clear: async () => {},
      };
      const e = new MemoryExecutor(undefined, errorStore);
      const result = await e.execute(makeStep('get', { key: 'k' }), makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('STORE_ERROR');
    });

    it('returns STORE_ERROR when store.delete() throws', async () => {
      const errorStore: MemoryStore = {
        set: async () => makeEntry('k', 'v'),
        get: async () => undefined,
        delete: async () => { throw new Error('delete error'); },
        list: async () => [],
        search: async () => [],
        clear: async () => {},
      };
      const e = new MemoryExecutor(undefined, errorStore);
      const result = await e.execute(makeStep('delete', { key: 'k' }), makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('STORE_ERROR');
    });

    it('returns STORE_ERROR when store.list() throws', async () => {
      const errorStore: MemoryStore = {
        set: async () => makeEntry('k', 'v'),
        get: async () => undefined,
        delete: async () => false,
        list: async () => { throw new Error('list error'); },
        search: async () => [],
        clear: async () => {},
      };
      const e = new MemoryExecutor(undefined, errorStore);
      const result = await e.execute(makeStep('list'), makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('STORE_ERROR');
    });

    it('returns STORE_ERROR when store.search() throws', async () => {
      const errorStore: MemoryStore = {
        set: async () => makeEntry('k', 'v'),
        get: async () => undefined,
        delete: async () => false,
        list: async () => [],
        search: async () => { throw new Error('search error'); },
        clear: async () => {},
      };
      const e = new MemoryExecutor(undefined, errorStore);
      const result = await e.execute(makeStep('search', { pattern: 'x' }), makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('STORE_ERROR');
    });

    it('wraps non-Error throws in STORE_ERROR', async () => {
      const errorStore: MemoryStore = {
        set: async () => { throw 'string error'; },
        get: async () => undefined,
        delete: async () => false,
        list: async () => [],
        search: async () => [],
        clear: async () => {},
      };
      const e = new MemoryExecutor(undefined, errorStore);
      const result = await e.execute(makeStep('set', { key: 'k', value: 'v' }), makeCtx());
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('STORE_ERROR');
    });
  });

  // ── default FileStore construction ───────────────────────────────────────────

  describe('default FileStore construction', () => {
    it('creates a FileStore when no store is provided', () => {
      const e = new MemoryExecutor({ storagePath: '/tmp/test-mem-executor-default.json' });
      expect(e.getStore()).toBeDefined();
      expect(e.kind).toBe('memory');
    });
  });
});
