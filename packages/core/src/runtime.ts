import { DomainEvent, Plan, PlanStatus, RunContext, XSkynetPlugin } from '@xskynet/contracts'
import { EventBus } from './event-bus'
import { PluginRegistry } from './plugin-registry'
import { PlanExecutor } from './executor'

export class XSkynetRuntime {
  private plugins = new PluginRegistry()
  private eventBus = new EventBus()

  use(plugin: XSkynetPlugin): this {
    this.plugins.register(plugin)
    return this
  }

  on(event: string, handler: (e: DomainEvent) => void): () => void {
    return this.eventBus.on(event, handler)
  }

  async execute(plan: Plan, ctx?: Partial<RunContext>): Promise<{ status: PlanStatus; tasks: Plan['tasks']; error?: Plan['error'] }> {
    const exec = new PlanExecutor(this.plugins, (e) => this.eventBus.emit(e))
    const runCtx: RunContext = {
      runId: (ctx?.runId ?? (Math.random().toString(36).slice(2) as any)) as any,
      planId: plan.id,
      ...ctx,
    } as RunContext

    this.eventBus.emit({ id: `${plan.id}-start` as any, type: 'plan.started', occurredAt: new Date().toISOString() as any, aggregateId: plan.id })
    try {
      const res = await exec.execute(plan, runCtx)
      this.eventBus.emit({ id: `${plan.id}-${res.status}` as any, type: res.status === 'succeeded' ? 'plan.succeeded' : 'plan.failed', occurredAt: new Date().toISOString() as any, aggregateId: plan.id })
      return res
    } catch (e: any) {
      this.eventBus.emit({ id: `${plan.id}-failed` as any, type: 'plan.failed', occurredAt: new Date().toISOString() as any, aggregateId: plan.id, payload: { error: e?.message } })
      return { status: 'failed', tasks: plan.tasks, error: { message: e?.message ?? 'Unknown error' } }
    }
  }
}
