# X-Skynet Architecture Overview

## Core Components

X-Skynet follows a modular architecture with clear separation of concerns across four main layers:

### Core Layer
The Core layer provides the foundational runtime and orchestration capabilities:
- **XSkynetRuntime**: Main runtime engine that manages plans, tasks, and execution flows
- **Plan Manager**: Handles plan lifecycle (creation, validation, execution, monitoring)
- **Task Orchestrator**: Coordinates task execution and dependencies
- **Context Manager**: Maintains execution context across tasks and steps

### Contracts Layer
The Contracts layer defines the interfaces and data structures that ensure consistency across the system:
- **Plan Interface**: Defines the structure for execution plans
- **Task Interface**: Specifies task definitions and execution parameters
- **Step Interface**: Outlines step-level operations within tasks
- **Plugin Interface**: Standardizes plugin contracts for extensibility
- **Event Interface**: Defines the event system for runtime communication

### Plugin Layer
The Plugin layer enables extensibility and integration with external services:
- **Plugin Registry**: Manages plugin lifecycle and discovery
- **Plugin Interface**: Standard contract for all plugins
- **StepExecutor Interface**: Defines how plugins execute specific step types
- **Service Adapters**: Connect to external services (Claude, OpenAI, databases, etc.)

### SDK Layer
The SDK layer provides developer-friendly abstractions and utilities:
- **Plan Builders**: Simplified APIs for creating plans
- **Configuration Utilities**: Helper functions for setting up runtime configurations
- **Monitoring Tools**: Built-in observability and logging utilities
- **Testing Framework**: Utilities for testing plans and plugins

## Plugin Mechanism

Plugins in X-Skynet follow a modular design pattern:

1. **Registration**: Plugins register themselves with the runtime using `runtime.use(plugin)`
2. **Capability Declaration**: Plugins declare the step kinds they can handle
3. **Execution**: When a task requires a specific step kind, the runtime routes it to the appropriate plugin
4. **Result Processing**: Plugins return results back to the runtime for further processing

## Event Flow

The event flow in X-Skynet follows this sequence:

1. **Plan Submission**: A plan is submitted to the XSkynetRuntime
2. **Validation**: The runtime validates the plan structure and dependencies
3. **Task Scheduling**: Tasks are scheduled based on their dependencies and priority
4. **Step Execution**: For each task, steps are executed through registered plugins
5. **Context Updates**: Execution context is updated after each step
6. **Result Aggregation**: Task results are aggregated as they complete
7. **Plan Completion**: When all tasks complete, the plan result is returned

This architecture enables X-Skynet to be highly extensible while maintaining consistent execution semantics across diverse plugin implementations.