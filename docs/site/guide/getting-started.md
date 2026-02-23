# Getting Started

This guide walks you through installing X-Skynet, creating a project, and running your first agent — in about 15 minutes.

## Prerequisites

| Requirement | Minimum version |
|-------------|----------------|
| Node.js | ≥ 20.0.0 |
| pnpm (recommended) | ≥ 9.0.0 |
| TypeScript | ≥ 5.3.0 |

You don't need a cloud account or any external services to follow this guide.

---

## Installation

### Option A — CLI (recommended)

Install the `xskynet` CLI globally:

```bash
npm install -g @xskynet/cli
# or
pnpm add -g @xskynet/cli
```

Verify the installation:

```bash
xskynet --version
# → 0.1.0
```

### Option B — Library only

If you want to use X-Skynet as a library inside an existing project:

```bash
pnpm add @xskynet/core @xskynet/contracts
# Add plugins as needed:
pnpm add @xskynet/plugin-shell
pnpm add @xskynet/plugin-http
```

---

## Create your first project

```bash
# Scaffold a new agent project
xskynet init my-first-agent
cd my-first-agent
```

This creates the following structure:

```
my-first-agent/
├── package.json
├── tsconfig.json
├── xskynet.config.ts     ← runtime configuration
└── src/
    └── agent.ts          ← your agent entry point
```

Install dependencies:

```bash
pnpm install
```

---

## Hello World agent

Open `src/agent.ts`. The scaffolded template looks like this:

```typescript
import { XSkynetRuntime } from '@xskynet/core'
import { shellPlugin } from '@xskynet/plugin-shell'

// 1. Create the runtime
const runtime = new XSkynetRuntime()

// 2. Register plugins
runtime.use(shellPlugin)

// 3. Subscribe to events (optional but recommended)
runtime.on('plan.succeeded', (e) => {
  console.log('✅ Plan completed:', e.aggregateId)
})
runtime.on('step.failed', (e) => {
  console.error('❌ Step failed:', e.payload?.error)
})

// 4. Define and execute a plan
const result = await runtime.execute({
  id: 'plan-hello-001' as any,
  title: 'Hello World',
  status: 'draft',
  createdAt: new Date().toISOString() as any,
  tasks: [
    {
      id: 'task-001' as any,
      name: 'Say hello',
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

console.log('Status:', result.status)
// → Status: succeeded
```

### Run it

```bash
xskynet run src/agent.ts
# ✔ Agent exit 0
# Status: succeeded
```

---

## Parallel tasks

X-Skynet automatically detects and parallelises independent tasks. Tasks without a `dependsOn` array run concurrently:

```typescript
const result = await runtime.execute({
  id: 'plan-parallel' as any,
  title: 'Parallel Tasks Demo',
  status: 'draft',
  createdAt: new Date().toISOString() as any,
  tasks: [
    {
      id: 'task-fetch' as any,
      name: 'Fetch data',
      status: 'idle',
      createdAt: new Date().toISOString() as any,
      steps: [
        {
          id: 'step-fetch' as any,
          name: 'curl -s https://api.example.com/data',
          status: 'idle',
          createdAt: new Date().toISOString() as any,
          tags: ['kind:shell'],
        },
      ],
    },
    {
      id: 'task-preprocess' as any,
      name: 'Pre-process local cache',
      status: 'idle',
      createdAt: new Date().toISOString() as any,
      steps: [
        {
          id: 'step-preprocess' as any,
          name: 'node scripts/preprocess.js',
          status: 'idle',
          createdAt: new Date().toISOString() as any,
          tags: ['kind:shell'],
        },
      ],
    },
    {
      id: 'task-merge' as any,
      name: 'Merge results',
      status: 'idle',
      createdAt: new Date().toISOString() as any,
      // Runs only after both fetch and preprocess complete
      dependsOn: ['task-fetch' as any, 'task-preprocess' as any],
      steps: [
        {
          id: 'step-merge' as any,
          name: 'node scripts/merge.js',
          status: 'idle',
          createdAt: new Date().toISOString() as any,
          tags: ['kind:shell'],
        },
      ],
    },
  ],
})
```

---

## Observing events

Every execution emits domain events that you can subscribe to:

| Event | Fired when |
|-------|-----------|
| `plan.started` | Plan execution begins |
| `plan.succeeded` | All tasks completed successfully |
| `plan.failed` | Any task failed (and the plan is halted) |
| `task.started` | A task begins running |
| `task.succeeded` | All steps in a task succeed |
| `task.failed` | A step in a task fails |
| `step.started` | A step begins running |
| `step.succeeded` | A step completes successfully |
| `step.failed` | A step exits with an error |

```typescript
// Subscribe to all step events
runtime.on('step.succeeded', (e) => {
  console.log(`Step ${e.aggregateId} succeeded`)
})
```

Events are persisted by default to `.xskynet/events.jsonl` for later inspection and replay.

---

## What's next?

- [Core Concepts](/guide/concepts) — understand Plans, Tasks, Steps, and the event model
- [Configuration](/guide/configuration) — customise the runtime with `xskynet.config.ts`
- [API Reference](/api/core) — full TypeScript API documentation
