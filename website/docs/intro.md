---
id: intro
title: Introduction to X-Skynet
sidebar_label: Introduction
slug: /intro
---

# X-Skynet

**X-Skynet** is an open-source multi-agent AI framework designed for building, orchestrating, and deploying intelligent agent systems at scale. It provides a composable, plugin-based architecture that makes it easy to connect language models, tools, memory systems, and external services into autonomous workflows.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Multi-agent orchestration** | Coordinate multiple specialized agents concurrently |
| **Plugin architecture** | Extend capabilities via a clean, typed plugin interface |
| **Provider agnostic** | Works with OpenAI, Anthropic Claude, Qwen, Ollama, and more |
| **TypeScript-first** | Full type safety from agent config to runtime outputs |
| **CLI toolchain** | Scaffold, run, and inspect agents from the terminal |
| **Template system** | Reusable prompt and workflow templates |
| **Persistent memory** | Built-in memory adapters (in-memory, file, vector DB) |
| **Streaming support** | Real-time streaming responses from LLM providers |

---

## 🏗 Architecture Overview

X-Skynet is a monorepo organized into focused packages:

```
x-skynet/
├── packages/
│   ├── core/          # Agent runtime, task scheduler, message bus
│   ├── cli/           # Command-line interface (x-skynet CLI)
│   ├── plugins/       # Official plugin collection
│   │   ├── openai/    # OpenAI provider plugin
│   │   ├── anthropic/ # Anthropic Claude plugin
│   │   └── memory/    # Memory adapter plugins
│   └── types/         # Shared TypeScript type definitions
├── templates/         # Starter templates for new agent projects
├── examples/          # Example agent implementations
└── website/           # This documentation site
```

The **core** package is the heart of X-Skynet — it defines the agent lifecycle, message routing, and plugin registry. The **CLI** wraps the core for developer ergonomics. **Plugins** extend the core with specific capabilities.

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (or npm ≥ 10)

### Installation

```bash
npm install -g @xskynet/cli
```

Or use `pnpm`:

```bash
pnpm add -g x-skynet
```

### Create Your First Agent

```bash
# Scaffold a new agent project
x-skynet init my-agent
cd my-agent

# Install dependencies
pnpm install

# Configure your LLM provider
cp .env.example .env
# Edit .env and set OPENAI_API_KEY or ANTHROPIC_API_KEY

# Run the agent
pnpm start
```

### Minimal Agent Definition

```typescript
import { Agent, createRuntime } from '@x-skynet/core';

const agent = new Agent({
  name: 'assistant',
  description: 'A helpful AI assistant',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful assistant.',
  plugins: [],
});

const runtime = createRuntime({ agents: [agent] });

const response = await runtime.send({
  to: 'assistant',
  content: 'Hello! What can you help me with?',
});

console.log(response.content);
```

### Multi-Agent Example

```typescript
import { Agent, createRuntime, MessageBus } from '@x-skynet/core';

const researcher = new Agent({
  name: 'researcher',
  model: 'gpt-4o',
  systemPrompt: 'You research topics thoroughly and provide factual summaries.',
});

const writer = new Agent({
  name: 'writer',
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: 'You write clear, engaging content based on research.',
});

const runtime = createRuntime({
  agents: [researcher, writer],
  bus: new MessageBus({ mode: 'sequential' }),
});

// Researcher gathers information, then passes to writer
const result = await runtime.pipeline([
  { agent: 'researcher', input: 'Latest advances in quantum computing 2025' },
  { agent: 'writer', input: '{{previous.output}}' },
]);
```

---

## 📦 Package Overview

| Package | NPM | Description |
|---|---|---|
| `@x-skynet/core` | `npm i @x-skynet/core` | Core agent runtime |
| `@x-skynet/cli` | `npm i -g @x-skynet/cli` | CLI toolchain |
| `@x-skynet/types` | `npm i @x-skynet/types` | Shared type definitions |
| `@x-skynet/plugin-openai` | `npm i @x-skynet/plugin-openai` | OpenAI integration |
| `@x-skynet/plugin-anthropic` | `npm i @x-skynet/plugin-anthropic` | Anthropic Claude integration |
| `@x-skynet/plugin-memory` | `npm i @x-skynet/plugin-memory` | Memory adapters |

---

## 🗺 Next Steps

- Read the [Architecture docs](./architecture) to understand package relationships
- Follow the [Plugin Development guide](./plugin-development) to extend X-Skynet
- Check out the [Contributing guide](./contributing) to help improve the project
- Learn about the [RFC Process](./rfc-process) for proposing new features
