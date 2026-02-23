/**
 * @xskynet/plugin-memory — Type definitions
 *
 * Provides the data shapes used by the memory store and executor.
 */

// ── Entry ────────────────────────────────────────────────────────────────────

/**
 * A single persisted memory record stored in the JSON file backend.
 */
export interface MemoryEntry {
  /** The unique string key for this record. */
  key: string;
  /** The stored value (any JSON-serialisable value). */
  value: unknown;
  /** ISO-8601 timestamp of when this entry was first created. */
  createdAt: string;
  /** ISO-8601 timestamp of the most recent update. */
  updatedAt: string;
  /** Optional human-readable label for the entry. */
  label?: string;
  /** Arbitrary additional metadata (e.g. source agent, TTL hints). */
  tags?: string[];
  /** Optional time-to-live in milliseconds (0 = no expiry). */
  ttlMs?: number;
}

// ── Query ────────────────────────────────────────────────────────────────────

/**
 * Parameters accepted by the `search` and `list` operations.
 */
export interface MemoryQuery {
  /**
   * Case-insensitive substring to match against keys (and optionally labels).
   * Leave undefined to match all entries.
   */
  pattern?: string;
  /** Limit the number of returned entries (default: unlimited). */
  limit?: number;
  /** Offset for pagination (default: 0). */
  offset?: number;
  /** Filter by one or more tags (all supplied tags must be present). */
  tags?: string[];
  /** When true, exclude entries whose ttlMs has elapsed. Default: true. */
  filterExpired?: boolean;
}

// ── Config ───────────────────────────────────────────────────────────────────

/**
 * Runtime configuration for the MemoryPlugin / FileStore.
 */
export interface MemoryConfig {
  /**
   * Path to the JSON file used as the persistent store.
   * Resolved relative to cwd() at runtime.
   * Default: `.xskynet/memory.json`
   */
  storagePath?: string;
  /**
   * When true, pretty-print the JSON file (easier debugging).
   * Default: false.
   */
  prettyPrint?: boolean;
  /**
   * When true, automatically prune expired entries on every write.
   * Default: true.
   */
  autoPruneExpired?: boolean;
}

// ── Internal store serialisation shape ───────────────────────────────────────

/**
 * Top-level shape of the persisted JSON file.
 */
export interface MemoryStoreFile {
  version: 1;
  entries: Record<string, MemoryEntry>;
  /** ISO-8601 timestamp of last modification. */
  lastModified: string;
}

// ── Operation literals ────────────────────────────────────────────────────────

export type MemoryOperation = 'set' | 'get' | 'delete' | 'list' | 'search';
