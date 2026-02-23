import { describe, it, expect, beforeEach } from '@jest/globals';
import { PluginRegistry } from '../registry.js';
import type { XSkynetPlugin, ExecutionContext, ToolResult } from '../types.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function makePlugin(name: string, toolNames: string[] = []): XSkynetPlugin {
  return {
    name,
    version: '1.0.0',
    tools: toolNames.map((toolName) => ({
      name: toolName,
      description: `Mock tool: ${toolName}`,
      parameters: {},
      execute: async (_params: Record<string, unknown>, _ctx: ExecutionContext): Promise<ToolResult> => ({
        success: true,
        data: { toolName },
      }),
    })),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  // 1. register + get
  it('registers a plugin and retrieves it by name', () => {
    const plugin = makePlugin('my-plugin');
    registry.register(plugin);

    expect(registry.has('my-plugin')).toBe(true);
    expect(registry.get('my-plugin')).toBe(plugin);
  });

  // 2. duplicate registration throws
  it('throws when registering a plugin with a duplicate name', () => {
    const plugin = makePlugin('dup-plugin');
    registry.register(plugin);

    expect(() => registry.register(makePlugin('dup-plugin'))).toThrow(
      'Plugin "dup-plugin" is already registered',
    );
  });

  // 3. unregister
  it('unregisters a plugin and returns false for has() afterwards', () => {
    registry.register(makePlugin('to-remove'));
    expect(registry.unregister('to-remove')).toBe(true);
    expect(registry.has('to-remove')).toBe(false);
    expect(registry.unregister('to-remove')).toBe(false); // already gone
  });

  // 4. list
  it('lists all registered plugins', () => {
    registry.register(makePlugin('a'));
    registry.register(makePlugin('b'));
    registry.register(makePlugin('c'));

    const names = registry.list().map((p) => p.name).sort();
    expect(names).toEqual(['a', 'b', 'c']);
  });

  // 5. findTool — found
  it('finds a tool by name across all plugins', () => {
    registry.register(makePlugin('plugin-x', ['tool-alpha', 'tool-beta']));
    registry.register(makePlugin('plugin-y', ['tool-gamma']));

    const result = registry.findTool('tool-beta');
    expect(result).toBeDefined();
    expect(result!.tool.name).toBe('tool-beta');
    expect(result!.plugin.name).toBe('plugin-x');
  });

  // 6. findTool — not found
  it('returns undefined when looking for a non-existent tool', () => {
    registry.register(makePlugin('plugin-z', ['existing-tool']));
    expect(registry.findTool('ghost-tool')).toBeUndefined();
  });

  // 7. allTools
  it('returns all tools from all plugins', () => {
    registry.register(makePlugin('p1', ['t1', 't2']));
    registry.register(makePlugin('p2', ['t3']));

    const toolNames = registry.allTools().map((t) => t.name).sort();
    expect(toolNames).toEqual(['t1', 't2', 't3']);
  });

  // 8. clear
  it('clears all plugins', () => {
    registry.register(makePlugin('x'));
    registry.register(makePlugin('y'));
    registry.clear();

    expect(registry.list()).toHaveLength(0);
  });

  // 9. get returns undefined for unknown plugin
  it('returns undefined for an unknown plugin name', () => {
    expect(registry.get('does-not-exist')).toBeUndefined();
  });
});
