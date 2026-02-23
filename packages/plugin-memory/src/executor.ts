/**
 * @xskynet/plugin-memory — MemoryExecutor
 *
 * Registers the `kind: memory` step executor.  The concrete operation is
 * selected at runtime via `step.metadata.operation`.
 *
 * Supported operations
 * ─────────────────────
 *   set     — Persist key=value in the memory store.
 *   get     — Read a key and expose the value in the step result.
 *   delete  — Remove a key from the store.
 *   list    — Return all (non-expired) keys, with optional pagination.
 *   search  — Fuzzy-search entries by key or label substring.
 *
 * Step metadata shape
 * ────────────────────
 *   operation : MemoryOperation   (required)
 *   key       : string            (required for set / get / delete)
 *   value     : unknown           (required for set)
 *   label     : string            (optional, set only)
 *   tags      : string[]          (optional, set only)
 *   ttlMs     : number            (optional, set only — 0 = no expiry)
 *   pattern   : string            (optional, search / list)
 *   limit     : number            (optional, search / list)
 *   offset    : number            (optional, search / list)
 *   filterTags: string[]          (optional, search / list)
 */

import type { Step, StepResult, RunContext, StepExecutor } from '@xskynet/contracts';
import type { MemoryOperation, MemoryQuery } from './types.js';
import type { MemoryStore } from './store.js';
import { FileStore } from './store.js';
import type { MemoryConfig } from './types.js';

// ── Internal metadata shape ──────────────────────────────────────────────────

interface MemoryStepMeta {
  operation: MemoryOperation;
  key?: string;
  value?: unknown;
  label?: string;
  tags?: string[];
  ttlMs?: number;
  pattern?: string;
  limit?: number;
  offset?: number;
  filterTags?: string[];
  filterExpired?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeArtifact(content: unknown) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: crypto.randomUUID() as any,
    kind: 'model_output' as const,
    mime: 'application/json',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: new Date().toISOString() as any,
    metadata: { content },
  };
}

function successResult(data: unknown, meta?: Record<string, unknown>): StepResult {
  return {
    status: 'succeeded',
    output: makeArtifact(data),
    metadata: { result: data, ...meta },
  };
}

function failureResult(message: string, code = 'MEMORY_ERROR'): StepResult {
  return {
    status: 'failed',
    error: { message, code },
  };
}

function extractMeta(step: Step): MemoryStepMeta {
  return (step.metadata ?? {}) as unknown as MemoryStepMeta;
}

// ── MemoryExecutor ────────────────────────────────────────────────────────────

/**
 * StepExecutor that exposes agent memory operations as first-class workflow
 * steps.  Uses a {@link MemoryStore} (default: {@link FileStore}) as the
 * persistent backend.
 *
 * @example
 * ```yaml
 * steps:
 *   - id: remember-user
 *     name: Store user preference
 *     kind: memory
 *     metadata:
 *       operation: set
 *       key: user.theme
 *       value: dark
 *
 *   - id: recall-user
 *     name: Retrieve user preference
 *     kind: memory
 *     metadata:
 *       operation: get
 *       key: user.theme
 * ```
 */
export class MemoryExecutor implements StepExecutor {
  readonly kind = 'memory';

  private readonly store: MemoryStore;

  constructor(config?: MemoryConfig, store?: MemoryStore) {
    this.store = store ?? new FileStore(config);
  }

  // ── StepExecutor.execute ─────────────────────────────────────────────────

  async execute(step: Step, _ctx: RunContext): Promise<StepResult> {
    const meta = extractMeta(step);

    if (!meta.operation) {
      return failureResult(
        "Missing required metadata field 'operation'. " +
        "Valid values: set | get | delete | list | search",
        'MISSING_OPERATION',
      );
    }

    try {
      switch (meta.operation) {
        case 'set':    return await this._handleSet(meta);
        case 'get':    return await this._handleGet(meta);
        case 'delete': return await this._handleDelete(meta);
        case 'list':   return await this._handleList(meta);
        case 'search': return await this._handleSearch(meta);
        default: {
          const op: never = meta.operation;
          return failureResult(`Unknown operation: ${op as string}`, 'UNKNOWN_OPERATION');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return failureResult(`Memory operation failed: ${message}`, 'STORE_ERROR');
    }
  }

  // ── Operation handlers ────────────────────────────────────────────────────

  /**
   * `set` — Persist a key/value pair.
   *
   * Required metadata: key, value
   * Optional metadata: label, tags, ttlMs
   */
  private async _handleSet(meta: MemoryStepMeta): Promise<StepResult> {
    if (meta.key === undefined || meta.key === '') {
      return failureResult("Operation 'set' requires metadata.key", 'MISSING_KEY');
    }
    if (meta.value === undefined) {
      return failureResult("Operation 'set' requires metadata.value", 'MISSING_VALUE');
    }

    const entry = await this.store.set(meta.key, meta.value, {
      label: meta.label,
      tags: meta.tags,
      ttlMs: meta.ttlMs,
    });

    return successResult(entry, {
      operation: 'set',
      key: meta.key,
    });
  }

  /**
   * `get` — Retrieve a single entry by key.
   *
   * Required metadata: key
   * Returns undefined in metadata.result when the key is not found.
   */
  private async _handleGet(meta: MemoryStepMeta): Promise<StepResult> {
    if (meta.key === undefined || meta.key === '') {
      return failureResult("Operation 'get' requires metadata.key", 'MISSING_KEY');
    }

    const entry = await this.store.get(meta.key);

    if (!entry) {
      // Treat a missing key as a non-fatal succeeded step so workflows can
      // branch on the null result without failing the whole DAG.
      return {
        status: 'succeeded',
        output: makeArtifact(null),
        metadata: { operation: 'get', key: meta.key, result: null, found: false },
      };
    }

    return successResult(entry.value, {
      operation: 'get',
      key: meta.key,
      entry,
      found: true,
    });
  }

  /**
   * `delete` — Remove an entry from the store.
   *
   * Required metadata: key
   */
  private async _handleDelete(meta: MemoryStepMeta): Promise<StepResult> {
    if (meta.key === undefined || meta.key === '') {
      return failureResult("Operation 'delete' requires metadata.key", 'MISSING_KEY');
    }

    const existed = await this.store.delete(meta.key);
    return successResult({ deleted: existed }, {
      operation: 'delete',
      key: meta.key,
      existed,
    });
  }

  /**
   * `list` — Return all stored keys (with optional pagination / tag filter).
   *
   * Optional metadata: limit, offset, filterTags, filterExpired
   */
  private async _handleList(meta: MemoryStepMeta): Promise<StepResult> {
    const query: MemoryQuery = {
      limit: meta.limit,
      offset: meta.offset,
      tags: meta.filterTags,
      filterExpired: meta.filterExpired,
    };

    const entries = await this.store.list(query);
    const keys = entries.map(e => e.key);

    return successResult(keys, {
      operation: 'list',
      count: keys.length,
      entries,
    });
  }

  /**
   * `search` — Fuzzy-search entries by key/label substring.
   *
   * Optional metadata: pattern, limit, offset, filterTags, filterExpired
   */
  private async _handleSearch(meta: MemoryStepMeta): Promise<StepResult> {
    const query: MemoryQuery = {
      pattern: meta.pattern,
      limit: meta.limit,
      offset: meta.offset,
      tags: meta.filterTags,
      filterExpired: meta.filterExpired,
    };

    const entries = await this.store.search(query);

    return successResult(entries, {
      operation: 'search',
      pattern: meta.pattern ?? '',
      count: entries.length,
    });
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  /**
   * Expose the underlying store so callers can perform bulk operations
   * (e.g. clear, custom migrations) outside of the step execution flow.
   */
  getStore(): MemoryStore {
    return this.store;
  }
}
