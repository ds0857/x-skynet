# @x-skynet/plugin-interface

Standardized plugin interface for the **X-Skynet** agent framework.  
Third-party developers use this package to author tools and adapters that integrate seamlessly with any X-Skynet agent.

---

## Installation

```bash
pnpm add @x-skynet/plugin-interface
```

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| `XSkynetPlugin` | Root plugin contract — name, version, tools list, optional lifecycle hooks |
| `ToolDefinition` | A callable unit of work exposed by the plugin |
| `PluginRegistry` | In-memory store of all loaded plugins |
| `PluginLoader` | Dynamic `import()` + validation + registration in one step |

---

## Quick Start — writing a plugin

```typescript
import type { XSkynetPlugin, PluginContext, ExecutionContext, ToolResult } from '@x-skynet/plugin-interface';

const myPlugin: XSkynetPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  tools: [
    {
      name: 'greet',
      description: 'Returns a greeting message',
      parameters: {
        name: { type: 'string', description: 'Person to greet', required: true },
      },
      async execute(params: Record<string, unknown>, _ctx: ExecutionContext): Promise<ToolResult> {
        return { success: true, data: `Hello, ${params['name']}!` };
      },
    },
  ],
  async onLoad(ctx: PluginContext): Promise<void> {
    ctx.logger.info(`[my-plugin] loaded for agent ${ctx.agentId}`);
  },
};

export default myPlugin;
```

---

## Loading plugins at runtime

```typescript
import { PluginLoader, PluginRegistry } from '@x-skynet/plugin-interface';

const registry = new PluginRegistry();
const loader   = new PluginLoader(registry);

const context = {
  agentId: 'agent-42',
  config:  {},
  logger:  { info: console.log, error: console.error },
};

await loader.load('./plugins/my-plugin.js', context);

// Invoke a tool
const { tool } = registry.findTool('greet')!;
const result = await tool.execute({ name: 'World' }, { ...context, runId: 'run-1' });
console.log(result.data); // "Hello, World!"
```

---

## API Reference

### `PluginRegistry`

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(plugin: XSkynetPlugin) => void` | Register a plugin; throws on duplicate name |
| `unregister` | `(name: string) => boolean` | Remove plugin; returns `false` if not found |
| `get` | `(name: string) => XSkynetPlugin \| undefined` | Lookup by name |
| `has` | `(name: string) => boolean` | Check existence |
| `list` | `() => XSkynetPlugin[]` | All registered plugins |
| `findTool` | `(toolName: string) => { tool, plugin } \| undefined` | Cross-plugin tool search |
| `allTools` | `() => ToolDefinition[]` | Flat list of every tool |
| `clear` | `() => void` | Remove all plugins |

### `PluginLoader`

| Method | Signature | Description |
|--------|-----------|-------------|
| `load` | `(specifier, context) => Promise<XSkynetPlugin>` | Import, validate, call `onLoad`, register |
| `unload` | `(name) => Promise<void>` | Call `onUnload`, unregister |

---

## License

Apache-2.0
