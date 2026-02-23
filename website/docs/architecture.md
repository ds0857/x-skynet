---
id: architecture
title: Architecture
sidebar_label: Architecture
---

# X-Skynet Architecture

This document describes the internal architecture of X-Skynet, the relationships between packages, and the key design decisions that shape the framework.

---

## Repository Structure

X-Skynet is a **pnpm monorepo** containing multiple packages under a single repository:

```
x-skynet/
├── packages/
│   ├── core/                    # @x-skynet/core
│   │   ├── src/
│   │   │   ├── agent.ts         # Agent class & lifecycle
│   │   │   ├── runtime.ts       # Runtime orchestrator
│   │   │   ├── message-bus.ts   # Inter-agent messaging
│   │   │   ├── plugin-registry.ts
│   │   │   ├── task-scheduler.ts
│   │   │   └── memory/          # Memory subsystem
│   │   └── package.json
│   │
│   ├── cli/                     # @x-skynet/cli
│   │   ├── src/
│   │   │   ├── commands/        # CLI commands (init, run, list...)
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                   # @x-skynet/types
│   │   ├── src/
│   │   │   ├── agent.types.ts
│   │   │   ├── plugin.types.ts
│   │   │   ├── message.types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── plugins/
│       ├── openai/              # @x-skynet/plugin-openai
│       ├── anthropic/           # @x-skynet/plugin-anthropic
│       ├── qwen/                # @x-skynet/plugin-qwen
│       └── memory/              # @x-skynet/plugin-memory
│
├── templates/                   # Project templates for `x-skynet init`
├── examples/                    # Runnable example projects
├── docs/                        # Internal developer notes
├── website/                     # This Docusaurus site
├── pnpm-workspace.yaml
└── package.json
```

---

## Core Package (`@x-skynet/core`)

The core package is the foundation of the framework. It provides:

### Agent Lifecycle

```
Agent Created → Configured → Registered → Ready → Running → Done
                                           ↑              |
                                           └──── Retry ───┘
```

An `Agent` instance encapsulates:
- **Identity**: name, description, model selection
- **System prompt**: base instructions
- **Plugin list**: ordered list of capability plugins
- **Memory**: optional persistent memory adapter
- **Hooks**: `onMessage`, `onError`, `onComplete`

### Runtime

The `Runtime` is the central orchestrator:

```typescript
class Runtime {
  agents: Map<string, Agent>;
  bus: MessageBus;
  registry: PluginRegistry;

  async send(message: AgentMessage): Promise<AgentResponse>;
  async pipeline(steps: PipelineStep[]): Promise<PipelineResult>;
  async broadcast(message: string): Promise<AgentResponse[]>;
}
```

The runtime:
1. Receives incoming messages
2. Routes them to the appropriate agent
3. Executes the agent's plugin chain
4. Calls the LLM provider plugin
5. Returns the response

### Message Bus

The `MessageBus` handles inter-agent communication:

| Mode | Description |
|---|---|
| `sequential` | Agents process messages one at a time |
| `parallel` | Agents run concurrently |
| `pipeline` | Output of one agent feeds the next |
| `broadcast` | Message sent to all registered agents |

### Plugin Registry

The `PluginRegistry` manages installed plugins:

```typescript
class PluginRegistry {
  register(plugin: XSkynetPlugin): void;
  get(id: string): XSkynetPlugin | undefined;
  list(): XSkynetPlugin[];
  has(id: string): boolean;
}
```

---

## CLI Package (`@x-skynet/cli`)

The CLI wraps the core for developer ergonomics. It provides:

| Command | Description |
|---|---|
| `x-skynet init <name>` | Scaffold a new agent project |
| `x-skynet run <file>` | Run an agent definition file |
| `x-skynet list` | List registered agents in current project |
| `x-skynet inspect <agent>` | Show agent config and plugin chain |
| `x-skynet build` | Bundle agent project for deployment |

The CLI reads configuration from `x-skynet.config.ts` (or `.js`, `.json`) at the project root.

---

## Types Package (`@x-skynet/types`)

Shared TypeScript types used across all packages. Key interfaces:

```typescript
// Core agent config
interface AgentConfig {
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  plugins?: XSkynetPlugin[];
  memory?: MemoryAdapter;
  maxRetries?: number;
  timeout?: number;
}

// Plugin interface (see Plugin Development guide)
interface XSkynetPlugin {
  id: string;
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  execute(input: PluginInput): Promise<PluginOutput>;
  teardown?(): Promise<void>;
}

// Message format
interface AgentMessage {
  id: string;
  from?: string;
  to: string;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
```

---

## Plugin System

Plugins are the extension points of X-Skynet. They follow a **middleware-style** execution model:

```
Message Input
     ↓
[Plugin 1: Auth/Rate Limit]
     ↓
[Plugin 2: Memory Retrieval]
     ↓
[Plugin 3: Tool Execution]
     ↓
[Plugin 4: LLM Provider]   ← required
     ↓
[Plugin 5: Output Transform]
     ↓
Response Output
```

Each plugin receives the current `PluginInput` and can:
- Pass through unchanged
- Augment the input (e.g., add context)
- Short-circuit and return a result immediately
- Transform the output

---

## Data Flow

```
User/Caller
    │
    │ AgentMessage
    ▼
Runtime.send()
    │
    ├─► MessageBus (routing)
    │       │
    │       ▼
    │   Agent.process()
    │       │
    │       ▼
    │   PluginChain.execute()
    │       │
    │       ├─► MemoryPlugin (load context)
    │       ├─► ToolPlugin (execute tools)
    │       ├─► LLMProviderPlugin (call model)
    │       └─► PostProcessPlugin (format output)
    │       │
    │       ▼
    │   AgentResponse
    │
    ▼
Caller receives AgentResponse
```

---

## Design Principles

1. **Composability over configuration** — Build complex behavior by chaining simple plugins
2. **Provider agnostic** — No vendor lock-in; swap LLM providers by swapping plugins
3. **Type safety first** — All interfaces are TypeScript-typed end to end
4. **Minimal core, rich ecosystem** — Keep the core small; everything else is a plugin
5. **Observable by default** — Events emitted at every lifecycle stage for observability
