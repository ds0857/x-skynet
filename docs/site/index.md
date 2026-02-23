---
layout: home

hero:
  name: "X-Skynet"
  text: "AI Agent Orchestration"
  tagline: "From zero to your first running agent in 15 minutes. Open-source, plugin-first, TypeScript-native."
  image:
    src: /logo.svg
    alt: X-Skynet
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: Core Concepts
      link: /guide/concepts
    - theme: alt
      text: View on GitHub
      link: https://github.com/ds0857/x-skynet

features:
  - icon: 🚀
    title: 15-Minute Quickstart
    details: Install the CLI, scaffold a project, and run your first AI agent — all in under 15 minutes. No boilerplate, no cloud account required.

  - icon: 🔌
    title: Plugin-First Architecture
    details: Every capability (shell, HTTP, LLM calls) is a plugin. Swap, extend, or build your own executor with a single TypeScript interface.

  - icon: 🕸️
    title: DAG-Based Task Execution
    details: Model complex workflows as Directed Acyclic Graphs. X-Skynet resolves dependencies, parallelises independent tasks, and handles failures gracefully.

  - icon: 📡
    title: Event-Driven Observability
    details: Every plan, task, and step emits structured domain events. Persist them to disk, replay for debugging, or stream to any observability backend.

  - icon: 🛡️
    title: TypeScript-Native Contracts
    details: Full end-to-end type safety from Plan → Task → Step. Zero magic, zero runtime surprises.

  - icon: 🌐
    title: Multi-Agent Ready
    details: Run agents locally during development, promote them to distributed environments. Same codebase, same contracts.
---

## What is X-Skynet?

**X-Skynet** is an open-source AI agent orchestration framework built for TypeScript developers. It gives you the primitives to:

- Define **Plans** as DAGs of Tasks and Steps
- Execute Steps with any **plugin executor** (shell, HTTP, Claude, or your own)
- Track execution state with a **type-safe event system**
- Replay and audit every decision your agents make

Whether you're building a research pipeline, a code-review bot, or a multi-step reasoning system, X-Skynet gives you a solid, observable foundation.

---

## Quick Start

```bash
# 1. Install the CLI globally
npm install -g @xskynet/cli

# 2. Scaffold a new agent project
xskynet init my-agent
cd my-agent

# 3. Run the example agent
xskynet run src/agent.ts
```

That's it. Your first agent is running.

---

## Hello World Plan

```typescript
// src/agent.ts
import { XSkynetRuntime } from '@xskynet/core'
import { shellPlugin } from '@xskynet/plugin-shell'

const runtime = new XSkynetRuntime()
runtime.use(shellPlugin)

// Listen to events
runtime.on('plan.succeeded', (e) => console.log('✅ Plan succeeded:', e))
runtime.on('step.failed', (e) => console.error('❌ Step failed:', e))

// Define a simple plan
const result = await runtime.execute({
  id: 'plan-hello-001' as any,
  title: 'Hello X-Skynet',
  status: 'draft',
  createdAt: new Date().toISOString() as any,
  tasks: [
    {
      id: 'task-001' as any,
      name: 'Greet the world',
      status: 'idle',
      createdAt: new Date().toISOString() as any,
      steps: [
        {
          id: 'step-001' as any,
          name: 'echo "Hello, X-Skynet! 🚀"',
          status: 'idle',
          createdAt: new Date().toISOString() as any,
          tags: ['kind:shell'],
        },
      ],
    },
  ],
})

console.log('Final status:', result.status)
// → Final status: succeeded
```

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                      XSkynetRuntime                      │
│                                                          │
│   ┌────────────┐   ┌─────────────┐   ┌───────────────┐  │
│   │  Plan DAG  │──▶│ PlanExecutor│──▶│  EventBus     │  │
│   └────────────┘   └──────┬──────┘   └───────┬───────┘  │
│                           │                  │           │
│                    ┌──────▼──────┐   ┌───────▼───────┐  │
│                    │PluginRegistry   │  EventStore   │  │
│                    └──────┬──────┘   └───────────────┘  │
│                           │                              │
│              ┌────────────┼──────────────┐               │
│              ▼            ▼              ▼               │
│         ShellPlugin   HttpPlugin   ClaudePlugin          │
└─────────────────────────────────────────────────────────┘
```

**Key packages:**

| Package | Role |
|---------|------|
| `@xskynet/contracts` | Shared TypeScript types (Plan, Task, Step, Artifact …) |
| `@xskynet/core` | Runtime engine, executor, event bus + store |
| `@xskynet/cli` | Developer CLI (`xskynet init`, `run`, `status`, `logs`) |
| `@xskynet/plugin-shell` | Execute shell commands as Steps |
| `@xskynet/plugin-http` | HTTP requests as Steps |
| `@xskynet/plugin-claude` | Anthropic Claude calls as Steps |

---

## Community & Support

- 📖 [Documentation](https://x-skynet.dev) — you're here!
- 💬 [GitHub Discussions](https://github.com/ds0857/x-skynet/discussions)
- 🐛 [Issue Tracker](https://github.com/ds0857/x-skynet/issues)
- 🚀 [Roadmap](https://github.com/ds0857/x-skynet/projects)

---

*X-Skynet is Apache 2.0 licensed. Contributions welcome.*
