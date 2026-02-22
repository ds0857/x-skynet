# API Reference

## XSkynetRuntime

The `XSkynetRuntime` class is the core execution engine for X-Skynet plans.

### Constructor
```typescript
new XSkynetRuntime(config?: RuntimeConfig)
```

Creates a new instance of the X-Skynet runtime with optional configuration.

**Parameters:**
- `config` (optional): Configuration object for the runtime
  - `logger` (optional): Custom logger implementation
  - `contextStorage` (optional): Storage mechanism for execution context
  - `monitoring` (optional): Monitoring and metrics configuration

### Methods

#### `use(plugin: Plugin)`
Registers a plugin with the runtime.

**Parameters:**
- `plugin`: The plugin to register with the runtime

**Returns:** The runtime instance for chaining.

#### `execute(plan: Plan)`
Executes a plan and returns the result.

**Parameters:**
- `plan`: The plan object to execute

**Returns:** Promise resolving to the execution result.

#### `registerEventHandler(eventType: string, handler: EventHandler)`
Registers an event handler for specific event types.

**Parameters:**
- `eventType`: The type of event to listen for
- `handler`: Function to handle the event

#### `getRegisteredPlugins()`
Returns a list of currently registered plugins.

**Returns:** Array of registered plugin objects.

#### `getExecutionContext(planId: string)`
Retrieves the execution context for a specific plan.

**Parameters:**
- `planId`: ID of the plan to get context for

**Returns:** Execution context object or null if not found.

## Plan Structure

A Plan represents a complete execution workflow in X-Skynet.

### Fields

- `id` (string): Unique identifier for the plan
- `title` (string): Human-readable title of the plan
- `status` (string): Current status ('ready', 'executing', 'completed', 'failed', 'cancelled')
- `context` (object): Initial execution context data
- `tasks` (Task[]): Array of tasks to execute as part of this plan
- `createdAt` (Date): Timestamp when the plan was created
- `updatedAt` (Date): Timestamp when the plan was last updated
- `configuration` (object, optional): Additional configuration for plan execution

## Task Structure

A Task is a single unit of work within a plan that contains one or more steps.

### Fields

- `id` (string): Unique identifier for the task
- `kind` (string): Type of task (determines which plugin handles it)
- `status` (string): Current status ('queued', 'executing', 'completed', 'failed', 'skipped')
- `title` (string, optional): Human-readable title for the task
- `params` (object, optional): Parameters passed to the task
- `steps` (Step[]): Array of steps to execute in sequence
- `dependsOn` (string[], optional): IDs of tasks this task depends on
- `timeout` (number, optional): Maximum execution time in milliseconds
- `retryCount` (number, optional): Number of retry attempts allowed

## Step Structure

A Step is an atomic operation within a task.

### Fields

- `id` (string): Unique identifier for the step
- `kind` (string): Type of step (corresponds to a registered StepExecutor)
- `status` (string): Current status ('pending', 'executing', 'completed', 'failed')
- `params` (object, optional): Parameters for the step execution
- `inputs` (object, optional): Input data for the step
- `outputs` (object, optional): Output mapping from previous steps
- `condition` (string, optional): Conditional expression to determine if step executes
- `onError` (object, optional): Error handling configuration
- `metadata` (object, optional): Additional metadata for the step

## Plugin Interface

Plugins provide functionality to the X-Skynet runtime by implementing specific interfaces.

### Plugin Object Structure

- `name` (string): Unique name for the plugin
- `version` (string): Version of the plugin
- `executors` (StepExecutor[]): Array of step executors provided by the plugin
- `init` (function, optional): Initialization function called when plugin is registered
- `cleanup` (function, optional): Cleanup function called when runtime shuts down

## StepExecutor Interface

The StepExecutor interface defines how plugins execute specific step kinds.

### Methods

#### `getStepKinds(): string[]`
Returns an array of step kinds that this executor can handle.

#### `validateConfig(config: any): Promise<boolean>`
Validates the configuration for this executor.

**Parameters:**
- `config`: Configuration object to validate

**Returns:** Promise resolving to true if valid.

#### `execute(step: Step, context: ExecutionContext, config: any): Promise<StepResult>`
Executes a step and returns the result.

**Parameters:**
- `step`: The step to execute
- `context`: The current execution context
- `config`: Executor-specific configuration

**Returns:** Promise resolving to a StepResult object.

## StepResult Object

The result returned by a StepExecutor after executing a step.

### Fields

- `success` (boolean): Whether the step executed successfully
- `output` (object): Output data from the step execution
- `error` (string, optional): Error message if the step failed
- `metadata` (object, optional): Additional metadata about the execution
- `nextStep` (string, optional): ID of the next step to execute (for conditional flows)

## Events

The runtime emits various events during execution that can be listened to.

### Event Types

- `'plan.started'`: Emitted when a plan begins execution
- `'plan.completed'`: Emitted when a plan completes successfully
- `'plan.failed'`: Emitted when a plan fails
- `'task.queued'`: Emitted when a task is queued for execution
- `'task.started'`: Emitted when a task begins execution
- `'task.completed'`: Emitted when a task completes
- `'task.failed'`: Emitted when a task fails
- `'step.started'`: Emitted when a step begins execution
- `'step.completed'`: Emitted when a step completes
- `'step.failed'`: Emitted when a step fails