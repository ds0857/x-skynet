/**
 * plugin-memory public API tests (index.ts)
 */

import { describe, it, expect } from '@jest/globals';
import {
  createMemoryPlugin,
  memoryPlugin,
  MemoryExecutor,
  FileStore,
} from '../index.js';

describe('createMemoryPlugin()', () => {
  it('returns a plugin with the correct name', () => {
    const plugin = createMemoryPlugin();
    expect(plugin.name).toBe('@xskynet/plugin-memory');
  });

  it('returns a plugin with version 0.1.0', () => {
    const plugin = createMemoryPlugin();
    expect(plugin.version).toBe('0.1.0');
  });

  it('includes a "memory" capability', () => {
    const plugin = createMemoryPlugin();
    expect(plugin.capabilities).toContain('memory');
  });

  it('registers exactly one executor', () => {
    const plugin = createMemoryPlugin();
    expect(plugin.executors).toHaveLength(1);
    expect(plugin.executors![0]!.kind).toBe('memory');
  });

  it('executor is a MemoryExecutor instance', () => {
    const plugin = createMemoryPlugin();
    expect(plugin.executors![0]).toBeInstanceOf(MemoryExecutor);
  });

  it('registers exactly one memoryProvider', () => {
    const plugin = createMemoryPlugin();
    expect(plugin.memoryProviders).toHaveLength(1);
  });

  it('memoryProvider.read returns stored value', async () => {
    const plugin = createMemoryPlugin({ storagePath: `/tmp/test-plugin-idx-${Date.now()}.json` });
    const provider = plugin.memoryProviders![0]!;
    const exec = plugin.executors![0] as MemoryExecutor;
    await exec.getStore().set('some-key', 'some-value');
    const val = await provider.read('some-key');
    expect(val).toBe('some-value');
  });

  it('memoryProvider.read returns null for missing key', async () => {
    const plugin = createMemoryPlugin({ storagePath: `/tmp/test-plugin-idx2-${Date.now()}.json` });
    const provider = plugin.memoryProviders![0]!;
    const val = await provider.read('nonexistent');
    expect(val).toBeNull();
  });

  it('memoryProvider.write persists a value', async () => {
    const plugin = createMemoryPlugin({ storagePath: `/tmp/test-plugin-idx3-${Date.now()}.json` });
    const provider = plugin.memoryProviders![0]!;
    await provider.write('k', 42);
    const val = await provider.read('k');
    expect(val).toBe(42);
  });

  it('memoryProvider.delete removes a value', async () => {
    const plugin = createMemoryPlugin({ storagePath: `/tmp/test-plugin-idx4-${Date.now()}.json` });
    const provider = plugin.memoryProviders![0]!;
    await provider.write('to-del', 'val');
    await provider.delete!('to-del');
    const val = await provider.read('to-del');
    expect(val).toBeNull();
  });

  it('accepts custom storagePath config', () => {
    const plugin = createMemoryPlugin({ storagePath: '/tmp/custom-path.json' });
    expect(plugin.name).toBe('@xskynet/plugin-memory');
  });

  it('accepts prettyPrint config', () => {
    const plugin = createMemoryPlugin({ prettyPrint: true });
    expect(plugin.name).toBe('@xskynet/plugin-memory');
  });
});

describe('memoryPlugin singleton', () => {
  it('is a valid XSkynetPlugin (contracts shape)', () => {
    expect(memoryPlugin.name).toBe('@xskynet/plugin-memory');
    expect(memoryPlugin.version).toBeDefined();
  });

  it('is the default export', async () => {
    const mod = await import('../index.js');
    expect(mod.default).toBe(memoryPlugin);
  });
});

describe('re-exports', () => {
  it('exports MemoryExecutor class', () => {
    expect(typeof MemoryExecutor).toBe('function');
  });

  it('exports FileStore class', () => {
    expect(typeof FileStore).toBe('function');
  });
});
