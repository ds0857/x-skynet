/**
 * @xskynet/plugin-memory — FileStore implementation
 *
 * Provides a JSON-file-backed persistent store for agent memory.
 * A simple promise-chaining write-lock ensures serialised writes
 * without any native OS locks or external dependencies.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type {
  MemoryEntry,
  MemoryQuery,
  MemoryConfig,
  MemoryStoreFile,
} from './types.js';

// ── Interface ────────────────────────────────────────────────────────────────

/**
 * Abstract interface satisfied by any memory backend.
 * FileStore is the default implementation.
 */
export interface MemoryStore {
  /** Persist (or overwrite) an entry under `key`. */
  set(key: string, value: unknown, opts?: Partial<Pick<MemoryEntry, 'label' | 'tags' | 'ttlMs'>>): Promise<MemoryEntry>;
  /** Retrieve a single entry by exact key. Returns undefined if not found. */
  get(key: string): Promise<MemoryEntry | undefined>;
  /** Remove an entry. Returns true if it existed. */
  delete(key: string): Promise<boolean>;
  /** Return all non-expired entries, optionally filtered. */
  list(query?: MemoryQuery): Promise<MemoryEntry[]>;
  /** Fuzzy-search entries by key / label. Wraps list() with pattern filtering. */
  search(query: MemoryQuery): Promise<MemoryEntry[]>;
  /** Permanently delete all entries. */
  clear(): Promise<void>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_STORAGE_PATH = '.xskynet/memory.json';

function now(): string {
  return new Date().toISOString();
}

function isExpired(entry: MemoryEntry): boolean {
  if (!entry.ttlMs || entry.ttlMs <= 0) return false;
  const expiresAt = new Date(entry.updatedAt).getTime() + entry.ttlMs;
  return Date.now() > expiresAt;
}

function entryMatchesQuery(entry: MemoryEntry, query: MemoryQuery): boolean {
  // Expiry filter (default: on)
  const filterExpired = query.filterExpired !== false;
  if (filterExpired && isExpired(entry)) return false;

  // Tag filter — all supplied tags must be present
  if (query.tags && query.tags.length > 0) {
    const entryTags = entry.tags ?? [];
    if (!query.tags.every(t => entryTags.includes(t))) return false;
  }

  // Pattern filter (substring match on key + optional label)
  if (query.pattern) {
    const pat = query.pattern.toLowerCase();
    const inKey = entry.key.toLowerCase().includes(pat);
    const inLabel = entry.label ? entry.label.toLowerCase().includes(pat) : false;
    if (!inKey && !inLabel) return false;
  }

  return true;
}

// ── FileStore ────────────────────────────────────────────────────────────────

/**
 * A lightweight, JSON-file-backed MemoryStore.
 *
 * **Thread safety**: All mutating operations are serialised through a
 * promise chain (`this._writeLock`), so concurrent async calls from
 * within a single process will never race on the file.
 */
export class FileStore implements MemoryStore {
  private readonly storagePath: string;
  private readonly prettyPrint: boolean;
  private readonly autoPruneExpired: boolean;

  /** Serialises all writes — new mutations are enqueued behind this promise. */
  private _writeLock: Promise<void> = Promise.resolve();

  constructor(config: MemoryConfig = {}) {
    this.storagePath = resolve(config.storagePath ?? DEFAULT_STORAGE_PATH);
    this.prettyPrint = config.prettyPrint ?? false;
    this.autoPruneExpired = config.autoPruneExpired ?? true;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async ensureDir(): Promise<void> {
    const dir = dirname(this.storagePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  private async readFile(): Promise<MemoryStoreFile> {
    if (!existsSync(this.storagePath)) {
      return { version: 1, entries: {}, lastModified: now() };
    }
    try {
      const raw = await readFile(this.storagePath, 'utf-8');
      const parsed = JSON.parse(raw) as MemoryStoreFile;
      // Migrate older format if needed
      if (!parsed.entries) parsed.entries = {};
      if (parsed.version !== 1) parsed.version = 1;
      return parsed;
    } catch {
      // Corrupt file — start fresh
      return { version: 1, entries: {}, lastModified: now() };
    }
  }

  private async writeFileSafe(data: MemoryStoreFile): Promise<void> {
    await this.ensureDir();
    data.lastModified = now();
    const serialised = this.prettyPrint
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    await writeFile(this.storagePath, serialised, 'utf-8');
  }

  /**
   * Acquire the write lock and execute `fn` inside it.
   * All mutations must go through this to maintain ordering.
   */
  private withLock<T>(fn: () => Promise<T>): Promise<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const result = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this._writeLock = this._writeLock.then(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
    return result;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async set(
    key: string,
    value: unknown,
    opts: Partial<Pick<MemoryEntry, 'label' | 'tags' | 'ttlMs'>> = {},
  ): Promise<MemoryEntry> {
    return this.withLock(async () => {
      const store = await this.readFile();
      const existing = store.entries[key];
      const entry: MemoryEntry = {
        key,
        value,
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
        ...(opts.label !== undefined && { label: opts.label }),
        ...(opts.tags !== undefined && { tags: opts.tags }),
        ...(opts.ttlMs !== undefined && { ttlMs: opts.ttlMs }),
      };
      store.entries[key] = entry;
      if (this.autoPruneExpired) this._pruneExpired(store);
      await this.writeFileSafe(store);
      return entry;
    });
  }

  async get(key: string): Promise<MemoryEntry | undefined> {
    const store = await this.readFile();
    const entry = store.entries[key];
    if (!entry) return undefined;
    if (isExpired(entry)) return undefined;
    return entry;
  }

  async delete(key: string): Promise<boolean> {
    return this.withLock(async () => {
      const store = await this.readFile();
      if (!store.entries[key]) return false;
      delete store.entries[key];
      await this.writeFileSafe(store);
      return true;
    });
  }

  async list(query: MemoryQuery = {}): Promise<MemoryEntry[]> {
    const store = await this.readFile();
    let entries = Object.values(store.entries).filter(e => entryMatchesQuery(e, query));
    // Pagination
    const offset = query.offset ?? 0;
    entries = entries.slice(offset);
    if (query.limit !== undefined && query.limit > 0) {
      entries = entries.slice(0, query.limit);
    }
    return entries;
  }

  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    // search() is list() with pattern required — same underlying implementation
    return this.list(query);
  }

  async clear(): Promise<void> {
    return this.withLock(async () => {
      const empty: MemoryStoreFile = { version: 1, entries: {}, lastModified: now() };
      await this.writeFileSafe(empty);
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _pruneExpired(store: MemoryStoreFile): void {
    for (const key of Object.keys(store.entries)) {
      if (isExpired(store.entries[key]!)) {
        delete store.entries[key];
      }
    }
  }
}
