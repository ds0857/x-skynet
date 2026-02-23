/**
 * FileStore unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm, writeFile, mkdir } from 'node:fs/promises';
import { FileStore } from '../store.js';

// ── Setup ────────────────────────────────────────────────────────────────────

let testDir: string;
let store: FileStore;

beforeEach(() => {
  testDir = join(
    tmpdir(),
    `xskynet-store-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  store = new FileStore({ storagePath: join(testDir, 'memory.json') });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FileStore', () => {
  // ── set() ───────────────────────────────────────────────────────────────────

  describe('set()', () => {
    it('stores a primitive value and returns the entry', async () => {
      const entry = await store.set('key1', 'hello');
      expect(entry.key).toBe('key1');
      expect(entry.value).toBe('hello');
      expect(typeof entry.createdAt).toBe('string');
      expect(typeof entry.updatedAt).toBe('string');
    });

    it('stores a complex object', async () => {
      const value = { foo: 'bar', num: 42, arr: [1, 2, 3] };
      const entry = await store.set('complex', value);
      expect(entry.value).toEqual(value);
    });

    it('stores optional label', async () => {
      const entry = await store.set('k', 'v', { label: 'My Label' });
      expect(entry.label).toBe('My Label');
    });

    it('stores optional tags', async () => {
      const entry = await store.set('k', 'v', { tags: ['tag1', 'tag2'] });
      expect(entry.tags).toEqual(['tag1', 'tag2']);
    });

    it('stores optional ttlMs', async () => {
      const entry = await store.set('k', 'v', { ttlMs: 60000 });
      expect(entry.ttlMs).toBe(60000);
    });

    it('overwrites an existing key', async () => {
      await store.set('key', 'original');
      const updated = await store.set('key', 'updated');
      expect(updated.value).toBe('updated');
    });

    it('preserves createdAt on overwrite', async () => {
      const first = await store.set('key', 'v1');
      await new Promise((r) => setTimeout(r, 10));
      const second = await store.set('key', 'v2');
      expect(second.createdAt).toBe(first.createdAt);
    });

    it('updates updatedAt on overwrite', async () => {
      const first = await store.set('key', 'v1');
      await new Promise((r) => setTimeout(r, 10));
      const second = await store.set('key', 'v2');
      expect(second.updatedAt).not.toBe(first.updatedAt);
    });

    it('serialises and persists to disk (retrievable after new instance)', async () => {
      await store.set('persisted', 42);
      const store2 = new FileStore({ storagePath: join(testDir, 'memory.json') });
      const entry = await store2.get('persisted');
      expect(entry).toBeDefined();
      expect(entry!.value).toBe(42);
    });

    it('pretty prints when prettyPrint=true', async () => {
      const ps = new FileStore({
        storagePath: join(testDir, 'pretty.json'),
        prettyPrint: true,
      });
      const entry = await ps.set('k', 'v');
      expect(entry.key).toBe('k');
    });

    it('runs concurrent set() calls safely (write lock)', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        store.set(`key-${i}`, i),
      );
      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      // All entries should be readable
      for (let i = 0; i < 5; i++) {
        const e = await store.get(`key-${i}`);
        expect(e).toBeDefined();
      }
    });
  });

  // ── get() ───────────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('retrieves a stored entry', async () => {
      await store.set('k', 99);
      const entry = await store.get('k');
      expect(entry).toBeDefined();
      expect(entry!.value).toBe(99);
    });

    it('returns undefined for a missing key', async () => {
      const entry = await store.get('nonexistent');
      expect(entry).toBeUndefined();
    });

    it('returns undefined for an expired entry', async () => {
      await store.set('expiring', 'val', { ttlMs: 1 });
      await new Promise((r) => setTimeout(r, 20));
      const entry = await store.get('expiring');
      expect(entry).toBeUndefined();
    });

    it('returns entry for a non-expired entry with ttlMs set', async () => {
      await store.set('future', 'val', { ttlMs: 60_000 });
      const entry = await store.get('future');
      expect(entry).toBeDefined();
      expect(entry!.value).toBe('val');
    });

    it('returns undefined when store file does not exist yet', async () => {
      const fresh = new FileStore({ storagePath: join(testDir, 'fresh.json') });
      const entry = await fresh.get('key');
      expect(entry).toBeUndefined();
    });
  });

  // ── delete() ────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('deletes an existing key and returns true', async () => {
      await store.set('to-delete', 'val');
      const result = await store.delete('to-delete');
      expect(result).toBe(true);
    });

    it('returns false when key does not exist', async () => {
      const result = await store.delete('ghost');
      expect(result).toBe(false);
    });

    it('deleted entry is no longer retrievable', async () => {
      await store.set('key', 'val');
      await store.delete('key');
      expect(await store.get('key')).toBeUndefined();
    });
  });

  // ── list() ──────────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('returns all non-expired entries', async () => {
      await store.set('a', 1);
      await store.set('b', 2);
      await store.set('c', 3);
      const entries = await store.list();
      expect(entries).toHaveLength(3);
    });

    it('returns empty array from empty store', async () => {
      const entries = await store.list();
      expect(entries).toHaveLength(0);
    });

    it('filters by tags', async () => {
      await store.set('t1', 1, { tags: ['alpha', 'beta'] });
      await store.set('t2', 2, { tags: ['alpha'] });
      await store.set('t3', 3, { tags: ['gamma'] });
      const entries = await store.list({ tags: ['alpha'] });
      const keys = entries.map((e) => e.key).sort();
      expect(keys).toEqual(['t1', 't2']);
    });

    it('filters by pattern (key substring)', async () => {
      await store.set('foo-alpha', 1);
      await store.set('foo-beta', 2);
      await store.set('bar', 3);
      const entries = await store.list({ pattern: 'foo' });
      expect(entries).toHaveLength(2);
    });

    it('filters by label pattern', async () => {
      await store.set('k1', 'v', { label: 'User Preference' });
      await store.set('k2', 'v', { label: 'System Config' });
      const entries = await store.list({ pattern: 'preference' });
      expect(entries).toHaveLength(1);
      expect(entries[0]!.key).toBe('k1');
    });

    it('applies limit', async () => {
      for (let i = 0; i < 5; i++) await store.set(`k${i}`, i);
      const entries = await store.list({ limit: 2 });
      expect(entries).toHaveLength(2);
    });

    it('applies offset', async () => {
      for (let i = 0; i < 5; i++) await store.set(`k${i}`, i);
      const all = await store.list();
      const paged = await store.list({ offset: 3 });
      expect(paged).toHaveLength(all.length - 3);
    });

    it('excludes expired entries (filterExpired defaults to true)', async () => {
      const s = new FileStore({
        storagePath: join(testDir, 'mem-expire.json'),
        autoPruneExpired: false,
      });
      await s.set('live', 'v', { ttlMs: 60_000 });
      await s.set('will-expire', 'v', { ttlMs: 1 });
      await new Promise((r) => setTimeout(r, 20));
      const entries = await s.list();
      expect(entries.find((e) => e.key === 'will-expire')).toBeUndefined();
      expect(entries.find((e) => e.key === 'live')).toBeDefined();
    });

    it('includes expired entries when filterExpired=false', async () => {
      const s = new FileStore({
        storagePath: join(testDir, 'mem-nofilter.json'),
        autoPruneExpired: false,
      });
      await s.set('will-expire', 'v', { ttlMs: 1 });
      await new Promise((r) => setTimeout(r, 20));
      const entries = await s.list({ filterExpired: false });
      expect(entries.find((e) => e.key === 'will-expire')).toBeDefined();
    });

    it('returns entries with no ttlMs (ttlMs <= 0 is not expired)', async () => {
      await store.set('permanent', 'v', { ttlMs: 0 });
      const entries = await store.list();
      expect(entries.find((e) => e.key === 'permanent')).toBeDefined();
    });
  });

  // ── search() ────────────────────────────────────────────────────────────────

  describe('search()', () => {
    it('returns matching entries by key pattern', async () => {
      await store.set('user.theme', 'dark');
      await store.set('user.lang', 'en');
      await store.set('system.version', '1.0');
      const results = await store.search({ pattern: 'user' });
      expect(results).toHaveLength(2);
    });

    it('returns matching entries by label pattern', async () => {
      await store.set('key1', 'val', { label: 'User Theme Preference' });
      await store.set('key2', 'val', { label: 'System Config' });
      const results = await store.search({ pattern: 'theme' });
      expect(results).toHaveLength(1);
    });

    it('returns all entries when no pattern', async () => {
      await store.set('a', 1);
      await store.set('b', 2);
      const results = await store.search({});
      expect(results).toHaveLength(2);
    });

    it('returns empty array when nothing matches', async () => {
      await store.set('key', 'val');
      const results = await store.search({ pattern: 'zzz-no-match-xyz' });
      expect(results).toHaveLength(0);
    });
  });

  // ── clear() ─────────────────────────────────────────────────────────────────

  describe('clear()', () => {
    it('removes all entries', async () => {
      await store.set('x', 1);
      await store.set('y', 2);
      await store.clear();
      const entries = await store.list();
      expect(entries).toHaveLength(0);
    });

    it('clears an empty store without error', async () => {
      await expect(store.clear()).resolves.toBeUndefined();
    });
  });

  // ── autoPruneExpired ────────────────────────────────────────────────────────

  describe('autoPruneExpired', () => {
    it('prunes expired entries on set() when autoPruneExpired=true', async () => {
      const s = new FileStore({
        storagePath: join(testDir, 'mem-prune.json'),
        autoPruneExpired: true,
      });
      await s.set('will-expire', 'v', { ttlMs: 1 });
      await new Promise((r) => setTimeout(r, 20));
      // Trigger another set to cause pruning
      await s.set('trigger', 'v');
      // Expired entry should be gone (pruned during write lock)
      const entries = await s.list({ filterExpired: false });
      expect(entries.find((e) => e.key === 'will-expire')).toBeUndefined();
    });
  });

  // ── corrupt file handling ────────────────────────────────────────────────────

  describe('corrupt file handling', () => {
    it('starts fresh when JSON file is corrupt', async () => {
      await mkdir(testDir, { recursive: true });
      const corruptPath = join(testDir, 'corrupt.json');
      await writeFile(corruptPath, 'THIS IS NOT JSON', 'utf-8');
      const s = new FileStore({ storagePath: corruptPath });
      const entries = await s.list();
      expect(entries).toHaveLength(0);
    });
  });
});
