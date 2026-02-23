import type { XSkynetPlugin, PluginContext } from './types.js';
import { PluginRegistry } from './registry.js';

/**
 * PluginLoader is responsible for dynamically importing plugin modules,
 * validating them, calling lifecycle hooks, and registering them into
 * a PluginRegistry.
 *
 * ## Design Decision — Field Naming: `tools` (not `executors`)
 *
 * The canonical field name for a plugin's callable units is **`tools`**, as
 * defined in the `XSkynetPlugin` interface in `types.ts`.  We deliberately
 * avoid the alternative name `executors` that appeared in early drafts of
 * the interface, for the following reasons:
 *
 *   1. **Alignment with LLM tooling conventions** — Major AI frameworks
 *      (OpenAI function-calling, Anthropic tool-use, LangChain tools) all
 *      use the term "tool".  Using the same name reduces cognitive friction
 *      for contributors and consumers.
 *
 *   2. **Single source of truth** — `XSkynetPlugin.tools` is the only
 *      field that PluginRegistry iterates over (`findTool`, `allTools`).
 *      Keeping one name avoids silent bugs where code reading `.executors`
 *      gets `undefined` from a plugin object that only has `.tools`.
 *
 *   3. **Consistency across the codebase** — Both `registry.ts` and this
 *      file reference `plugin.tools` exclusively.  Any future code that
 *      references `executors` should be treated as a bug.
 */
export class PluginLoader {
  private registry: PluginRegistry;

  constructor(registry?: PluginRegistry) {
    this.registry = registry ?? new PluginRegistry();
  }

  get pluginRegistry(): PluginRegistry {
    return this.registry;
  }

  /**
   * Dynamically import a plugin from the given module specifier.
   * The module must export either a default export or a named export `plugin`
   * that conforms to XSkynetPlugin.
   *
   * @param specifier - A module path or package name resolvable by the runtime.
   * @param context   - PluginContext passed to onLoad (if defined).
   */
  async load(specifier: string, context: PluginContext): Promise<XSkynetPlugin> {
    let mod: Record<string, unknown>;
    try {
      mod = await import(specifier) as Record<string, unknown>;
    } catch (err) {
      throw new Error(`Failed to import plugin "${specifier}": ${(err as Error).message}`);
    }

    const plugin = (mod['default'] ?? mod['plugin']) as XSkynetPlugin | undefined;

    if (!plugin) {
      throw new Error(
        `Plugin module "${specifier}" must export a default or named "plugin" export`,
      );
    }

    this.validate(plugin, specifier);

    if (typeof plugin.onLoad === 'function') {
      await plugin.onLoad(context);
    }

    this.registry.register(plugin);
    return plugin;
  }

  /**
   * Unload a previously loaded plugin: call onUnload, then remove from registry.
   */
  async unload(name: string): Promise<void> {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" is not loaded`);
    }

    if (typeof plugin.onUnload === 'function') {
      await plugin.onUnload();
    }

    this.registry.unregister(name);
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private validate(plugin: XSkynetPlugin, specifier: string): void {
    if (typeof plugin.name !== 'string' || !plugin.name) {
      throw new Error(`Plugin from "${specifier}" must have a non-empty string "name"`);
    }
    if (typeof plugin.version !== 'string' || !plugin.version) {
      throw new Error(`Plugin "${plugin.name}" must have a non-empty string "version"`);
    }
    if (!Array.isArray(plugin.tools)) {
      throw new Error(`Plugin "${plugin.name}" must expose a "tools" array`);
    }
    for (const tool of plugin.tools) {
      if (typeof tool.name !== 'string' || !tool.name) {
        throw new Error(`Every tool in plugin "${plugin.name}" must have a non-empty "name"`);
      }
      if (typeof tool.execute !== 'function') {
        throw new Error(`Tool "${tool.name}" in plugin "${plugin.name}" must have an "execute" function`);
      }
    }
  }
}
