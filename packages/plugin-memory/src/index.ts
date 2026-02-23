/**
 * @xskynet/plugin-memory — Public API
 *
 * Usage:
 *   import { createMemoryPlugin } from '@xskynet/plugin-memory';
 *
 *   const plugin = createMemoryPlugin({ storagePath: '.xskynet/memory.json' });
 *   runtime.registerPlugin(plugin);
 */

import type { XSkynetPlugin } from '@xskynet/contracts';
import { MemoryExecutor } from './executor.js';
import type { MemoryConfig } from './types.js';

export { MemoryExecutor } from './executor.js';
export { FileStore } from './store.js';
export type { MemoryStore } from './store.js';
export type {
  MemoryEntry,
  MemoryQuery,
  MemoryConfig,
  MemoryOperation,
  MemoryStoreFile,
} from './types.js';

/**
 * Factory that builds an {@link XSkynetPlugin} registering the `memory` executor.
 *
 * @param config  Optional storage configuration.  Defaults to
 *                `.xskynet/memory.json` relative to the current working directory.
 *
 * @example
 * ```ts
 * import { createMemoryPlugin } from '@xskynet/plugin-memory';
 *
 * const plugin = createMemoryPlugin({
 *   storagePath: '.xskynet/my-agent-memory.json',
 *   prettyPrint: true,
 * });
 *
 * // Register with the X-Skynet runtime
 * runtime.registerPlugin(plugin);
 * ```
 */
export function createMemoryPlugin(config?: MemoryConfig): XSkynetPlugin {
  const executor = new MemoryExecutor(config);

  return {
    name: '@xskynet/plugin-memory',
    version: '0.1.0',
    description: 'Persistent agent memory plugin for X-Skynet — JSON file backend with set/get/delete/list/search operations',
    capabilities: ['memory'],
    executors: [executor],
    memoryProviders: [
      {
        read: (key: string) => executor.getStore().get(key).then(e => e?.value ?? null),
        write: (key: string, value: unknown) => executor.getStore().set(key, value).then(() => undefined),
        delete: (key: string) => executor.getStore().delete(key).then(() => undefined),
      },
    ],
  };
}

/** Default singleton plugin (uses default config). */
export const memoryPlugin = createMemoryPlugin();
export default memoryPlugin;
