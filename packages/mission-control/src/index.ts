import type { Step, RunContext, StepExecutor, StepResult } from "@xskynet/contracts";

export interface MissionControlOptions {
  executors?: Record<string, StepExecutor>;
}

export class MissionControl {
  private executors: Record<string, StepExecutor>;
  constructor(opts: MissionControlOptions = {}) {
    this.executors = opts.executors ?? {};
  }

  register(executor: StepExecutor) {
    this.executors[executor.kind] = executor;
  }

  // Minimal run API (no scheduling yet)
  async runStep(kind: string, step: Step, ctx: RunContext): Promise<StepResult> {
    const exec = this.executors[kind];
    if (!exec) throw new Error(`No executor registered for kind: ${kind}`);
    return exec.execute(step, ctx);
  }
}

export type { Step, RunContext, StepExecutor, StepResult } from "@xskynet/contracts";
