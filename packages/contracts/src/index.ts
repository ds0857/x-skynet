/**
 * RFC-0002: X-Skynet Contracts — Core domain types for Plan/Task/Step/Artifact/RunContext and state machine
 */

// Unique identifiers
export type ID = string & { readonly __brand: 'id' }
export type ISODateTime = string & { readonly __brand: 'isodatetime' }

// Artifact represents any IO (prompt, model output, file, url, etc.)
export interface Artifact {
  id: ID
  kind: 'prompt' | 'model_output' | 'file' | 'url' | 'log' | 'metric' | 'event'
  mime?: string
  name?: string
  uri?: string // for file/url kinds
  bytes?: number
  sha256?: string
  createdAt: ISODateTime
  metadata?: Record<string, unknown>
}

// Step is the smallest execution unit within a Task
export interface StepBase {
  id: ID
  name: string
  description?: string
  createdAt: ISODateTime
  updatedAt?: ISODateTime
  tags?: string[]
}

export type StepStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export interface Step extends StepBase {
  status: StepStatus
  startedAt?: ISODateTime
  endedAt?: ISODateTime
  input?: Artifact | null
  outputs?: Artifact[]
  error?: {
    message: string
    code?: string
    details?: unknown
  } | null
  // Parent-child linkage for nested steps
  parentId?: ID
  children?: ID[]
  // Structured logs or trace ids
  traceId?: string
  spanId?: string
  // Execution stats
  stats?: {
    tokensInput?: number
    tokensOutput?: number
    costUSD?: number
    latencyMs?: number
    retries?: number
  }
  metadata?: Record<string, unknown>
}

// Task groups a set of Steps toward a concrete objective
export interface TaskBase {
  id: ID
  name: string
  description?: string
  owner?: string
  createdAt: ISODateTime
  updatedAt?: ISODateTime
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  labels?: string[]
}

export type TaskStatus =
  | 'idle'
  | 'running'
  | 'blocked'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export interface Task extends TaskBase {
  status: TaskStatus
  startedAt?: ISODateTime
  endedAt?: ISODateTime
  // DAG of steps (allowing fan-out/fan-in)
  steps: Step[]
  // Dependencies on other tasks
  dependsOn?: ID[]
  artifacts?: Artifact[]
  error?: {
    message: string
    code?: string
    details?: unknown
  } | null
  stats?: {
    tokensInput?: number
    tokensOutput?: number
    costUSD?: number
    latencyMs?: number
    retries?: number
  }
  metadata?: Record<string, unknown>
}

// Plan is a tree/DAG of Tasks targeting an outcome
export interface PlanBase {
  id: ID
  title: string
  createdAt: ISODateTime
  updatedAt?: ISODateTime
  owner?: string
  tags?: string[]
}

export type PlanStatus = 'draft' | 'approved' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export interface Plan extends PlanBase {
  status: PlanStatus
  tasks: Task[]
  // Plan-level artifacts and constraints
  artifacts?: Artifact[]
  constraints?: {
    budgetUSD?: number
    maxLatencyMs?: number
    maxParallelism?: number
  }
  error?: {
    message: string
    code?: string
    details?: unknown
  } | null
  stats?: {
    tokensInput?: number
    tokensOutput?: number
    costUSD?: number
    latencyMs?: number
    retries?: number
  }
  metadata?: Record<string, unknown>
}

// Run context captures environment details available during execution
export interface RunContext {
  runId: ID
  planId: ID
  rootTaskId?: ID
  user?: {
    id?: string
    role?: 'user' | 'admin' | 'service'
  }
  env?: 'dev' | 'staging' | 'prod' | string
  // LLM/Tool backends and limits
  llm?: {
    provider?: string
    model?: string
    promptCache?: boolean
  }
  tools?: Record<string, unknown>
  // Observability hooks
  tracing?: {
    traceId?: string
    parentSpanId?: string
  }
  // Arbitrary context bag
  bag?: Record<string, unknown>
}

// State machine definitions
export type StateNodeKind = 'plan' | 'task' | 'step'

export type TransitionCondition =
  | { type: 'onStatus'; status: StepStatus | TaskStatus | PlanStatus }
  | { type: 'onAllChildren'; status: Exclude<StepStatus, 'running' | 'idle'> }
  | { type: 'onAnyChild'; status: Exclude<StepStatus, 'running' | 'idle'> }
  | { type: 'onTimeoutMs'; timeout: number }
  | { type: 'onError' }

export interface Transition {
  target: string // state id
  when: TransitionCondition
  actions?: string[] // action ids
}

export interface StateNodeBase {
  id: string
  kind: StateNodeKind
  entryActions?: string[]
  exitActions?: string[]
  transitions?: Transition[]
}

export interface StepStateNode extends StateNodeBase {
  kind: 'step'
  status: StepStatus
}

export interface TaskStateNode extends StateNodeBase {
  kind: 'task'
  status: TaskStatus
  children?: StepStateNode[]
}

export interface PlanStateNode extends StateNodeBase {
  kind: 'plan'
  status: PlanStatus
  children?: TaskStateNode[]
}

export type StateNode = StepStateNode | TaskStateNode | PlanStateNode

export interface StateMachine {
  id: string
  root: StateNode
  actions?: Record<string, (ctx: RunContext, event?: unknown) => Promise<void> | void>
}

// Utility result type for engine operations
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// Narrow helpers
export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const err = <E = Error>(error: E): Result<never, E> => ({ ok: false, error })

// End of RFC-0002 contracts

// ────────────────────────────────────────────────────────────────
// WorkflowDefinition — YAML-friendly schema for xskynet run
// ────────────────────────────────────────────────────────────────

/** A single step inside a workflow task (YAML schema). */
export interface WorkflowStep {
  /** Unique id within the workflow (required). */
  id: string
  /** Human-readable label; also used as the shell command for kind=shell. */
  name: string
  /** Executor kind — matches a registered StepExecutor.kind (e.g. "shell", "echo"). */
  kind: string
  description?: string
  /** Shell command to execute (used by kind=shell). Falls back to `name` if omitted. */
  command?: string
  /** Environment variables forwarded to the command. */
  env?: Record<string, string>
  /** Additional metadata passed to the executor. */
  metadata?: Record<string, unknown>
}

/** A logical unit grouping one or more steps (YAML schema). */
export interface WorkflowTask {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  /** Task ids this task depends on (determines execution order). */
  dependsOn?: string[]
}

/** Top-level YAML structure for a workflow file. */
export interface WorkflowDefinition {
  /** Schema version — currently "1.0". */
  version: '1.0' | string
  /** Workflow name displayed in CLI output. */
  name: string
  description?: string
  tasks: WorkflowTask[]
}

// Community plugin interfaces (plugin-first architecture)
// Minimal domain definitions referenced by plugin contracts
export interface StepResult {
  status: Exclude<StepStatus, 'running' | 'idle'>
  output?: Artifact | null
  outputs?: Artifact[]
  error?: {
    message: string
    code?: string
    details?: unknown
  } | null
  stats?: Step['stats']
  metadata?: Record<string, unknown>
}

export interface DomainEvent {
  id: ID
  type: string
  occurredAt: ISODateTime
  aggregateId?: ID
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

// 插件接口（社区扩展点）
export interface StepExecutor {
  readonly kind: string
  execute(step: Step, ctx: RunContext): Promise<StepResult>
}

export interface MemoryProvider {
  read(key: string): Promise<unknown>
  write(key: string, value: unknown): Promise<void>
  delete?(key: string): Promise<void>
}

export interface Transport {
  emit(event: DomainEvent): Promise<void>
  subscribe(handler: (event: DomainEvent) => void): () => void
}

export interface XSkynetPlugin {
  capabilities?: string[]
  description?: string
  name: string
  version: string
  executors?: StepExecutor[]
  memoryProviders?: MemoryProvider[]
  transports?: Transport[]
}

