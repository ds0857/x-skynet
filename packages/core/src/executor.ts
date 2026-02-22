import { Artifact, DomainEvent, Plan, PlanStatus, RunContext, Step, StepResult, StepStatus, Task, TaskStatus } from '@xskynet/contracts'
import { PluginNotFoundError, DependencyCycleError } from './errors'
import { PluginRegistry } from './plugin-registry'

function nowIso(): string {
  return new Date().toISOString()
}

export class PlanExecutor {
  constructor(private plugins: PluginRegistry, private emit: (e: DomainEvent) => void) {}

  async execute(plan: Plan, ctx: RunContext): Promise<{ status: PlanStatus; tasks: Task[]; artifacts?: Artifact[]; error?: Plan['error'] }> {
    const orderedBatches = this.resolveDependencies(plan.tasks)
    const resultsTasks: Task[] = []

    for (const batch of orderedBatches) {
      // Execute tasks in batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (task) => {
          const res = await this.executeTask(task, ctx)
          return res
        })
      )
      resultsTasks.push(...batchResults)
      // If any task failed and plan does not allow continue, mark plan failed and stop further batches
      const anyFailed = batchResults.some((t) => t.status === 'failed')
      if (anyFailed) {
        return { status: 'failed', tasks: resultsTasks, error: { message: 'Task failed' } }
      }
    }

    return { status: 'succeeded', tasks: resultsTasks }
  }

  private async executeTask(task: Task, ctx: RunContext): Promise<Task> {
    const startedAt = nowIso()
    const updatedTask: Task = { ...task, status: 'running', startedAt }
    this.emit({ id: `${task.id}-start` as any, type: 'task.started', occurredAt: startedAt as any, aggregateId: task.id, payload: { taskId: task.id } })

    const stepResults: Step[] = []
    for (const step of task.steps) {
      const res = await this.executeStep(step, ctx)
      stepResults.push(res)
      if (res.status === 'failed') {
        const endedAt = nowIso()
        const failedTask: Task = { ...updatedTask, steps: stepResults, status: 'failed', endedAt, error: res.error ?? { message: 'Step failed' } }
        this.emit({ id: `${task.id}-failed` as any, type: 'task.failed', occurredAt: endedAt as any, aggregateId: task.id, payload: { taskId: task.id } })
        return failedTask
      }
    }

    const endedAt = nowIso()
    const succeededTask: Task = { ...updatedTask, steps: stepResults, status: 'succeeded', endedAt }
    this.emit({ id: `${task.id}-succeeded` as any, type: 'task.succeeded', occurredAt: endedAt as any, aggregateId: task.id, payload: { taskId: task.id } })
    return succeededTask
  }

  private async executeStep(step: Step, ctx: RunContext): Promise<Step> {
    const startedAt = nowIso()
    let updated: Step = { ...step, status: 'running', startedAt }
    this.emit({ id: `${step.id}-start` as any, type: 'step.started', occurredAt: startedAt as any, aggregateId: step.id, payload: { stepId: step.id } })

    const exec = this.plugins.getExecutor(step.tags?.find((t) => t.startsWith('kind:'))?.slice(5) ?? '')
    if (!exec) {
      const error = new PluginNotFoundError(step.tags?.find((t) => t.startsWith('kind:'))?.slice(5) ?? 'unknown')
      const endedAt = nowIso()
      updated = { ...updated, status: 'failed', endedAt, error: { message: error.message, code: error.code, details: error.details } }
      this.emit({ id: `${step.id}-failed` as any, type: 'step.failed', occurredAt: endedAt as any, aggregateId: step.id, payload: { stepId: step.id, error: error.message } })
      return updated
    }

    try {
      const result: StepResult = await exec.execute(updated, ctx)
      const endedAt = nowIso()
      updated = { ...updated, status: result.status as StepStatus, endedAt, outputs: result.outputs, error: result.error ?? null }
      const evtType = result.status === 'succeeded' ? 'step.succeeded' : result.status === 'failed' ? 'step.failed' : 'step.completed'
      this.emit({ id: `${step.id}-${result.status}` as any, type: evtType, occurredAt: endedAt as any, aggregateId: step.id, payload: { stepId: step.id } })
      return updated
    } catch (e: any) {
      const endedAt = nowIso()
      updated = { ...updated, status: 'failed', endedAt, error: { message: e?.message ?? 'Unknown error' } }
      this.emit({ id: `${step.id}-failed` as any, type: 'step.failed', occurredAt: endedAt as any, aggregateId: step.id, payload: { stepId: step.id, error: e?.message } })
      return updated
    }
  }

  // Topological sort to determine execution batches based on dependsOn relationships among tasks
  // Returns an array of batches; tasks in the same batch can run in parallel
  private resolveDependencies(tasks: Task[]): Task[][] {
    const idToTask = new Map<string, Task>()
    for (const t of tasks) idToTask.set(t.id, t)

    const inDegree = new Map<string, number>()
    const graph = new Map<string, Set<string>>()

    for (const t of tasks) {
      inDegree.set(t.id, 0)
      graph.set(t.id, new Set())
    }

    for (const t of tasks) {
      const deps = t.dependsOn ?? []
      for (const d of deps) {
        if (!graph.has(d)) graph.set(d, new Set())
        graph.get(d)!.add(t.id)
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1)
      }
    }

    const queue: string[] = []
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id)
    }

    const batches: Task[][] = []
    const processed = new Set<string>()

    while (queue.length > 0) {
      const currentBatchIds = [...queue]
      queue.length = 0

      const batchTasks: Task[] = []
      for (const id of currentBatchIds) {
        processed.add(id)
        batchTasks.push(idToTask.get(id)!)
      }
      batches.push(batchTasks)

      for (const id of currentBatchIds) {
        for (const neighbor of graph.get(id) ?? []) {
          inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) - 1)
          if ((inDegree.get(neighbor) ?? 0) === 0) queue.push(neighbor)
        }
      }
    }

    // Detect cycles: if processed size < tasks length, there's a cycle
    if (processed.size < tasks.length) {
      // Find nodes with in-degree > 0 as cycle members
      const cycle = tasks.filter((t) => (inDegree.get(t.id) ?? 0) > 0).map((t) => t.id)
      throw new DependencyCycleError(cycle as any)
    }

    return batches
  }
}
