# Core Concepts

X-Skynet is built around four first-class concepts: **Plans**, **Tasks**, **Steps**, and **Events**. Understanding these will let you model any workflow — from a single shell command to a distributed multi-agent pipeline.

---

## The Execution Hierarchy

```
Plan
└── Task[]          ← parallel-capable, dependency-aware
    └── Step[]      ← sequential within a task
        └── StepResult (via Plugin Executor)
```

Each level has its own lifecycle, status field, and event emissions.

---

## Plan

A **Plan** is the top-level container for a workflow. It describes an _outcome_ (the `title`) and owns a DAG of Tasks.

```typescript
interface Plan {
  id: ID
  title: string
  status: 'draft' | 'approved' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  tasks: Task[]
  constraints?: {
    budgetUSD?: number
    maxLatencyMs?: number
    maxParallelism?: number
  }
  createdAt: ISODateTime
}
```

**Key properties:**

- `status` starts as `'draft'` and transitions to `'running'` → `'succeeded'` or `'failed'`.
- `tasks` is an array of Tasks that may reference each other via `dependsOn`.
- `constraints` (optional) let you express budget or latency caps (enforcement is plugin-specific).

### Creating a Plan

```typescript
const plan: Plan = {
  id: 'plan-research-001' as any,
  title: 'Research competitive landscape',
  status: 'draft',
  createdAt: new Date().toISOString() as any,
  tasks: [ /* ... */ ],
}
```

---

## Task

A **Task** represents a concrete objective within a Plan. Tasks are the unit of parallel execution — tasks without mutual dependencies run concurrently.

```typescript
interface Task {
  id: ID
  name: string
  status: 'idle' | 'running' | 'blocked' | 'succeeded' | 'failed' | 'cancelled'
  steps: Step[]
  dependsOn?: ID[]   // IDs of other tasks that must complete first
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: ISODateTime
}
```

**Key properties:**

- `dependsOn` declares upstream task IDs. X-Skynet performs a topological sort and runs independent tasks in parallel batches.
- `steps` are executed **sequentially** within a task. If a step fails, the task is marked `'failed'` immediately.
- A failed task causes the whole Plan to stop (fail-fast by default).

### DAG Example

```typescript
tasks: [
  { id: 'A', dependsOn: [] },      // no deps — runs in batch 1
  { id: 'B', dependsOn: [] },      // no deps — runs in batch 1 (parallel with A)
  { id: 'C', dependsOn: ['A'] },   // waits for A — runs in batch 2
  { id: 'D', dependsOn: ['A', 'B'] }, // waits for A and B — runs in batch 3
]
```

The executor resolves this into batches:

| Batch | Tasks | Runs |
|-------|-------|------|
| 1 | A, B | in parallel |
| 2 | C | sequential (waits batch 1) |
| 3 | D | sequential (waits batch 2) |

---

## Step

A **Step** is the atomic unit of work. Each step is executed by exactly one **plugin executor**, identified by the `kind:*` tag.

```typescript
interface Step {
  id: ID
  name: string           // for shell plugin: the command to run
  status: StepStatus
  tags?: string[]        // 'kind:shell' | 'kind:http' | 'kind:claude' | …
  input?: Artifact | null
  outputs?: Artifact[]
  metadata?: Record<string, unknown>  // executor-specific config
  createdAt: ISODateTime
}
```

**Key properties:**

- `tags` must contain exactly one `kind:*` tag matching a registered executor.
- `name` is interpreted by the executor (for `plugin-shell` it's the shell command).
- `metadata` passes executor-specific config (e.g. `{ cwd, timeout, env }` for the shell plugin).
- Steps within a task run **sequentially** in array order.

### Step with metadata

```typescript
{
  id: 'step-build' as any,
  name: 'pnpm run build',
  status: 'idle',
  createdAt: new Date().toISOString() as any,
  tags: ['kind:shell'],
  metadata: {
    cwd: '/workspace/my-app',
    timeout: 120000,   // 2 minutes
    env: { NODE_ENV: 'production' },
  },
}
```

---

## Plugin Executors

Every Step is dispatched to a **plugin executor** — a class implementing `StepExecutor`:

```typescript
interface StepExecutor {
  readonly kind: string                              // matches the 'kind:*' tag
  execute(step: Step, ctx: RunContext): Promise<StepResult>
}
```

Built-in executors:

| Package | `kind` | Description |
|---------|--------|-------------|
| `@xskynet/plugin-shell` | `shell` | Run shell commands |
| `@xskynet/plugin-http` | `http` | HTTP requests |
| `@xskynet/plugin-claude` | `claude` | Anthropic Claude API calls |

### Writing a custom executor

```typescript
import type { StepExecutor, Step, RunContext, StepResult } from '@xskynet/contracts'

class MyDatabaseExecutor implements StepExecutor {
  readonly kind = 'db-query'

  async execute(step: Step, ctx: RunContext): Promise<StepResult> {
    const query = step.name
    const result = await db.query(query)
    return {
      status: 'succeeded',
      metadata: { rows: result.rows },
    }
  }
}

// Register in runtime
runtime.use({
  name: 'db-plugin',
  version: '1.0.0',
  executors: [new MyDatabaseExecutor()],
})
```

---

## Domain Events

Every execution emits **typed domain events** via the `EventBus`. Events are:

1. Dispatched to in-memory subscribers immediately
2. Persisted to `.xskynet/events.jsonl` (NDJSON format)
3. Replayable for auditing and debugging

```typescript
interface DomainEvent {
  id: ID
  type: string          // 'plan.started', 'step.failed', etc.
  occurredAt: ISODateTime
  aggregateId?: ID      // plan / task / step ID
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
}
```

### Subscribing

```typescript
// Subscribe by exact type
runtime.on('plan.succeeded', (e) => { /* … */ })

// Subscribe to multiple types (via EventBus directly)
bus.subscribe({ type: ['step.started', 'step.succeeded'] }, (e) => { /* … */ })

// Filter by aggregateId
bus.subscribe({ aggregateId: 'task-001' as any }, (e) => { /* … */ })
```

### Replay

```typescript
import { EventBus, FileEventStore } from '@xskynet/core'

const store = new FileEventStore('.xskynet/events.jsonl')
const bus = new EventBus({ store })

// Replay all persisted events to current subscribers
const count = bus.replay()
console.log(`Replayed ${count} events`)
```

---

## RunContext

`RunContext` carries execution metadata available to every executor:

```typescript
interface RunContext {
  runId: ID
  planId: ID
  env?: 'dev' | 'staging' | 'prod' | string
  user?: { id?: string; role?: string }
  llm?: { provider?: string; model?: string }
  bag?: Record<string, unknown>  // arbitrary context bag
}
```

Pass context when calling `runtime.execute()`:

```typescript
await runtime.execute(plan, {
  env: 'production',
  user: { id: 'user-42', role: 'admin' },
  bag: { correlationId: 'req-abc-123' },
})
```

---

## Summary

| Concept | Role | Parallelism |
|---------|------|-------------|
| Plan | Top-level goal / container | — |
| Task | Concrete objective; owns steps | **Parallel** (independent tasks) |
| Step | Atomic work unit; dispatched to a plugin | Sequential within task |
| Event | Observability record | Emitted async |
| Executor | Plugin handler for a step `kind` | Pluggable |
