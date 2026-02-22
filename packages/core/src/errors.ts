export class XSkynetError extends Error {
  code?: string
  details?: unknown
  constructor(message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'XSkynetError'
    this.code = code
    this.details = details
  }
}

export class PluginNotFoundError extends XSkynetError {
  constructor(kind: string) {
    super(`No executor registered for kind: ${kind}`, 'PLUGIN_NOT_FOUND', { kind })
    this.name = 'PluginNotFoundError'
  }
}

export class DependencyCycleError extends XSkynetError {
  constructor(cycle: string[]) {
    super(`Dependency cycle detected: ${cycle.join(' -> ')}`, 'DEPENDENCY_CYCLE', { cycle })
    this.name = 'DependencyCycleError'
  }
}

export class ExecutionAbortedError extends XSkynetError {
  constructor(reason?: string) {
    super(`Execution aborted${reason ? `: ${reason}` : ''}`, 'EXECUTION_ABORTED', { reason })
    this.name = 'ExecutionAbortedError'
  }
}
