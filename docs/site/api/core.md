# @xskynet/core API Reference

The `@xskynet/core` package provides the runtime engine, executor, event system, and plugin registry.

## Installation

```bash
pnpm add @xskynet/core @xskynet/contracts
```

---

## XSkynetRuntime

The main entry point. Manages plugin registration, event subscriptions, and plan execution.

```typescript
import { XSkynetRuntime } from '@xskynet/core'
```

### Constructor

```typescript
new XSkynetRuntime()
```

Creates a new runtime instance. Each instance is isolated — it has its own plugin registry and event bus.

---

### `runtime.use(plugin)`

Registers a plugin with the runtime.

**Signature:**
```typescript
use(plugin: XSkynetPlugin): this
```

**Parameters:**
- `plugin` — An `XSkynetPlugin` object (name, version, executors, …)

**Returns:** `this` (chainable)

**Example:**
```typescript
import { shellPlugin } from '@xskynet/plugin-shell'
import { httpPlugin } from '@xskynet/plugin-http'

const runtime = new XSkynetRuntime()
  .use(shellPlugin)
  .use(httpPlugin)
```

---

### `runtime.on(event, handler)`

Subscribes to domain events emitted during plan execution.

**Signature:**
```typescript
on(event: string, handler: (e: DomainEvent) => void): () => void
```

**Parameters:**
- `event` — Event type string (e.g. `'plan.succeeded'`, `'step.failed'`)
- `handler` — Callback function

**Returns:** Unsubscribe function

**Example:**
```typescript
const unsub = runtime.on('plan.failed', (e) => {
  console.error('Plan failed:', e.aggregateId, e.payload)
})

// Later:
unsub() // stop listening
```

**Standard event types:**

| Event type | Emitted when |
|-----------|-------------|
| `plan.started` | `runtime.execute()` is called |
| `plan.succeeded` | All tasks completed successfully |
| `plan.failed` | A task failed or an exception was thrown |
| `task.started` | A task begins |
| `task.succeeded` | All steps in a task succeeded |
| `task.failed` | A step in a task failed |
| `step.started` | A step begins execution |
| `step.succeeded` | A step returned `status: 'succeeded'` |
| `step.failed` | A step returned `status: 'failed'` or threw |

---

### `runtime.execute(plan, ctx?)`

Executes a Plan and returns the final result.

**Signature:**
```typescript
execute(
  plan: Plan,
  ctx?: Partial<RunContext>
): Promise<{
  status: PlanStatus
  tasks: Task[]
  error?: Plan['error']
}>
```

**Parameters:**
- `plan` — A `Plan` object (see [Contracts](#contracts))
- `ctx` — Optional partial `RunContext` (merged with auto-generated defaults)

**Returns:** Promise resolving to the plan result with final `status` and mutated `tasks`.

**Example:**
```typescript
const result = await runtime.execute(plan, { env: 'production' })

if (result.status === 'succeeded') {
  console.log('All done!')
} else {
  console.error('Failed:', result.error?.message)
}
```

---

## PlanExecutor

Lower-level executor used internally by `XSkynetRuntime`. You can instantiate it directly if you need finer control.

```typescript
import { PlanExecutor } from '@xskynet/core'
```

### Constructor

```typescript
new PlanExecutor(
  plugins: PluginRegistry,
  emit: (event: DomainEvent) => void
)
```

### `executor.execute(plan, ctx)`

```typescript
execute(
  plan: Plan,
  ctx: RunContext
): Promise<{
  status: PlanStatus
  tasks: Task[]
  error?: Plan['error']
}>
```

Executes the plan. Task dependencies are resolved via topological sort; independent tasks run in parallel batches.

**Throws** `DependencyCycleError` if the task dependency graph contains a cycle.

---

## EventBus

Manages in-memory event subscriptions and delegates to an `EventStore` for persistence.

```typescript
import { EventBus } from '@xskynet/core'
```

### Constructor

```typescript
new EventBus(opts?: EventBusOptions)
```

```typescript
interface EventBusOptions {
  store?: EventStore       // defaults to FileEventStore
  persist?: boolean        // default: true
  filePath?: string        // path for FileEventStore (default: .xskynet/events.jsonl)
  maxHistory?: number      // in-memory cache size (default: 1000)
}
```

### `bus.emit(event)`

Persists and dispatches a domain event to all matching subscribers.

```typescript
emit(event: DomainEvent): void
```

### `bus.on(typeOrFilter, handler)`

Subscribes to events. Alias: `bus.subscribe(filter, handler)`.

```typescript
on(
  typeOrFilter: string | SubscriptionFilter,
  handler: (e: DomainEvent) => void
): () => void
```

```typescript
interface SubscriptionFilter {
  type?: string | string[]
  aggregateId?: ID
  source?: string | string[]
}
```

### `bus.replay(options?)`

Replays persisted events from the store to current subscribers. Replayed events are marked with `metadata.replayed = true`.

```typescript
replay(options?: ListOptions & { asOfNow?: boolean }): number
// Returns the number of events replayed
```

### `bus.list(options?)`

Queries the event store directly (no dispatch).

```typescript
list(options?: ListOptions): DomainEvent[]
```

```typescript
interface ListOptions {
  since?: ISODateTime
  until?: ISODateTime
  filter?: EventFilter
  limit?: number
}
```

### `bus.history(limit?)`

Returns recent events from the in-memory ring buffer (not from disk).

```typescript
history(limit?: number): DomainEvent[]
```

---

## EventStore

Interface for event persistence backends.

```typescript
interface EventStore {
  append(event: DomainEvent): void
  list(options?: ListOptions): DomainEvent[]
}
```

### InMemoryEventStore

Events are stored in memory only. Useful for testing.

```typescript
import { InMemoryEventStore } from '@xskynet/core'

const store = new InMemoryEventStore()
const bus = new EventBus({ store, persist: true })
```

### FileEventStore

Events are appended to a NDJSON (`.jsonl`) file.

```typescript
import { FileEventStore } from '@xskynet/core'

const store = new FileEventStore('/path/to/events.jsonl')
```

```typescript
new FileEventStore(filePath?: string)
```

If `filePath` is omitted, defaults to `<cwd>/.xskynet/events.jsonl`. The directory is created automatically.

---

## PluginRegistry

Manages executor registration and lookup.

```typescript
import { PluginRegistry } from '@xskynet/core'
```

### `registry.register(plugin)`

```typescript
register(plugin: XSkynetPlugin): void
```

Registers all executors from the plugin. Later registrations override earlier ones with the same `kind`.

### `registry.getExecutor(kind)`

```typescript
getExecutor(kind: string): StepExecutor | undefined
```

Returns the executor for a given `kind` string, or `undefined` if none is registered.

### `registry.listPlugins()`

```typescript
listPlugins(): XSkynetPlugin[]
```

Returns all registered plugins in registration order.

---

## Errors

```typescript
import { PluginNotFoundError, DependencyCycleError } from '@xskynet/core'
```

### `PluginNotFoundError`

Thrown (and captured) when a Step has a `kind:*` tag with no matching executor.

```typescript
class PluginNotFoundError extends Error {
  readonly code = 'PLUGIN_NOT_FOUND'
  readonly kind: string
  readonly details: { kind: string }
}
```

### `DependencyCycleError`

Thrown by `PlanExecutor` when task `dependsOn` references form a cycle.

```typescript
class DependencyCycleError extends Error {
  readonly code = 'DEPENDENCY_CYCLE'
  readonly cycle: ID[]
}
```

---

## Contracts

Full contract types are in `@xskynet/contracts`. Core types used by `@xskynet/core`:

| Type | Description |
|------|-------------|
| `Plan` | Top-level workflow container |
| `Task` | Unit of parallel execution |
| `Step` | Atomic work unit dispatched to a plugin |
| `StepResult` | Return value from an executor |
| `Artifact` | Typed I/O (file, URL, model output …) |
| `DomainEvent` | Typed event emitted during execution |
| `RunContext` | Execution metadata passed to every executor |
| `XSkynetPlugin` | Plugin registration interface |
| `StepExecutor` | Interface every executor must implement |

See [`@xskynet/contracts` source](https://github.com/ds0857/x-skynet/blob/main/packages/contracts/src/index.ts) for the full definitions.
