/**
 * PluginLoader unit tests
 *
 * Fixture .ts files live in __fixtures__/. We reference them using .js
 * extensions (e.g. './__tests__/__fixtures__/valid-plugin.js') because:
 *   - Jest's moduleNameMapper strips .js → resolves to .ts at runtime
 *   - The specifier is relative to loader.ts (packages/plugin-interface/src/)
 *   - So './__tests__/__fixtures__/foo.js' → 'packages/plugin-interface/src/__tests__/__fixtures__/foo.ts'
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PluginLoader } from '../loader.js';
import { PluginRegistry } from '../registry.js';
import type { PluginContext } from '../types.js';

// Specifiers relative to loader.ts's location (packages/plugin-interface/src/)
function fx(name: string): string {
  return `./__tests__/__fixtures__/${name}.js`;
}

function makeCtx(): PluginContext {
  return {
    agentId: 'test-agent',
    config: {},
    logger: { info: () => {}, error: () => {} },
  };
}

describe('PluginLoader', () => {
  let loader: PluginLoader;

  beforeEach(() => {
    loader = new PluginLoader();
    (globalThis as Record<string, unknown>).__hookPluginOnLoadCount = 0;
    (globalThis as Record<string, unknown>).__hookPluginOnUnloadCount = 0;
    (globalThis as Record<string, unknown>).__hookPluginLastCtx = null;
  });

  // ── constructor ──────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates a new PluginRegistry when none is provided', () => {
      expect(loader.pluginRegistry).toBeInstanceOf(PluginRegistry);
    });

    it('uses the provided PluginRegistry', () => {
      const registry = new PluginRegistry();
      const l = new PluginLoader(registry);
      expect(l.pluginRegistry).toBe(registry);
    });
  });

  // ── load() — named export ────────────────────────────────────────────────────

  describe('load() — named "plugin" export', () => {
    it('loads a plugin and returns it', async () => {
      const plugin = await loader.load(fx('valid-plugin'), makeCtx());
      expect(plugin.name).toBe('valid-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(Array.isArray(plugin.tools)).toBe(true);
    });

    it('registers the plugin in the registry', async () => {
      await loader.load(fx('valid-plugin'), makeCtx());
      expect(loader.pluginRegistry.has('valid-plugin')).toBe(true);
    });

    it('returned plugin is the registered instance', async () => {
      const plugin = await loader.load(fx('valid-plugin'), makeCtx());
      expect(loader.pluginRegistry.get('valid-plugin')).toBe(plugin);
    });
  });

  // ── load() — default export ──────────────────────────────────────────────────

  describe('load() — default export', () => {
    it('loads a plugin with a default export', async () => {
      const plugin = await loader.load(fx('valid-plugin-default'), makeCtx());
      expect(plugin.name).toBe('default-export-plugin');
    });

    it('registers the plugin in the registry', async () => {
      await loader.load(fx('valid-plugin-default'), makeCtx());
      expect(loader.pluginRegistry.has('default-export-plugin')).toBe(true);
    });
  });

  // ── load() — lifecycle hooks ─────────────────────────────────────────────────

  describe('load() — lifecycle hooks', () => {
    it('calls onLoad with the provided context', async () => {
      const ctx = makeCtx();
      await loader.load(fx('plugin-with-hooks'), ctx);
      const g = globalThis as Record<string, unknown>;
      expect(g.__hookPluginOnLoadCount).toBe(1);
      expect(g.__hookPluginLastCtx).toBe(ctx);
    });
  });

  // ── load() — import failure ──────────────────────────────────────────────────

  describe('load() — import failures', () => {
    it('throws "Failed to import plugin" for a nonexistent module', async () => {
      await expect(
        loader.load('./__tests__/__fixtures__/nonexistent-xyz.js', makeCtx()),
      ).rejects.toThrow('Failed to import plugin');
    });
  });

  // ── load() — validation errors ───────────────────────────────────────────────

  describe('load() — validation errors', () => {
    it('throws when module has no default or "plugin" export', async () => {
      await expect(loader.load(fx('no-export'), makeCtx())).rejects.toThrow(
        'must export a default or named "plugin" export',
      );
    });

    it('throws when plugin has no name field', async () => {
      await expect(loader.load(fx('plugin-no-name'), makeCtx())).rejects.toThrow(
        'must have a non-empty string "name"',
      );
    });

    it('throws when plugin name is empty string', async () => {
      await expect(loader.load(fx('plugin-empty-name'), makeCtx())).rejects.toThrow(
        'must have a non-empty string "name"',
      );
    });

    it('throws when plugin has no version', async () => {
      await expect(loader.load(fx('plugin-no-version'), makeCtx())).rejects.toThrow(
        'must have a non-empty string "version"',
      );
    });

    it('throws when plugin has no tools property', async () => {
      await expect(loader.load(fx('plugin-no-tools'), makeCtx())).rejects.toThrow(
        'must expose a "tools" array',
      );
    });

    it('throws when plugin.tools is not an array', async () => {
      await expect(
        loader.load(fx('plugin-tools-not-array'), makeCtx()),
      ).rejects.toThrow('must expose a "tools" array');
    });

    it('throws when a tool has an empty name', async () => {
      await expect(
        loader.load(fx('plugin-tool-no-name'), makeCtx()),
      ).rejects.toThrow('must have a non-empty "name"');
    });

    it('throws when a tool has no execute function', async () => {
      await expect(
        loader.load(fx('plugin-tool-no-execute'), makeCtx()),
      ).rejects.toThrow('must have an "execute" function');
    });
  });

  // ── unload() ─────────────────────────────────────────────────────────────────

  describe('unload()', () => {
    it('removes the plugin from the registry', async () => {
      await loader.load(fx('valid-plugin'), makeCtx());
      await loader.unload('valid-plugin');
      expect(loader.pluginRegistry.has('valid-plugin')).toBe(false);
    });

    it('calls onUnload when the plugin has the hook', async () => {
      const l2 = new PluginLoader();
      await l2.load(fx('plugin-with-hooks'), makeCtx());
      await l2.unload('hooks-plugin');
      const g = globalThis as Record<string, unknown>;
      expect(g.__hookPluginOnUnloadCount as number).toBeGreaterThanOrEqual(1);
    });

    it('completes without error when plugin has no onUnload hook', async () => {
      const l2 = new PluginLoader();
      await l2.load(fx('valid-plugin'), makeCtx());
      await expect(l2.unload('valid-plugin')).resolves.toBeUndefined();
    });

    it('throws when the plugin is not loaded', async () => {
      await expect(loader.unload('not-loaded')).rejects.toThrow(
        'Plugin "not-loaded" is not loaded',
      );
    });
  });
});
