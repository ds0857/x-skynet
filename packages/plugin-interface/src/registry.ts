import type { XSkynetPlugin, ToolDefinition } from './types.js';
import { Telemetry } from './telemetry.js';

/**
 * PluginRegistry manages the lifecycle of loaded plugins and provides
 * fast lookup by plugin name or tool name.
 */
export class PluginRegistry {
  private plugins: Map<string, XSkynetPlugin> = new Map();

  /**
   * Register a plugin. Throws if a plugin with the same name is already registered.
   */
  register(plugin: XSkynetPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    this.plugins.set(plugin.name, plugin);
    Telemetry.track({ type: 'plugin_load', pluginId: plugin.name });
  }

  /**
   * Unregister a plugin by name. Returns true if it was found and removed.
   */
  unregister(name: string): boolean {
    const removed = this.plugins.delete(name);
    if (removed) {
      Telemetry.track({ type: 'plugin_unload', pluginId: name });
    }
    return removed;
  }

  /**
   * Retrieve a plugin by name. Returns undefined if not found.
   */
  get(name: string): XSkynetPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check whether a plugin is registered.
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Return all registered plugins as an array.
   */
  list(): XSkynetPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Find a tool by name across all registered plugins.
   * Returns the ToolDefinition and the owning plugin, or undefined.
   */
  findTool(toolName: string): { tool: ToolDefinition; plugin: XSkynetPlugin } | undefined {
    for (const plugin of this.plugins.values()) {
      const tool = plugin.tools.find((t) => t.name === toolName);
      if (tool) {
        return { tool, plugin };
      }
    }
    return undefined;
  }

  /**
   * Return every registered tool across all plugins.
   */
  allTools(): ToolDefinition[] {
    return this.list().flatMap((p) => p.tools);
  }

  /**
   * Remove all plugins from the registry.
   */
  clear(): void {
    this.plugins.clear();
  }
}
