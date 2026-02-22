import type { Step, StepResult, RunContext, StepExecutor, XSkynetPlugin } from '@xskynet/contracts';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ShellStepConfig {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export class ShellExecutor implements StepExecutor {
  readonly kind = 'shell';

  async execute(step: Step, ctx: RunContext): Promise<StepResult> {
    const cmd = step.name ?? '';
    const meta = step.metadata as ShellStepConfig | undefined;
    const timeout = meta?.timeout ?? 30000;
    const cwd = meta?.cwd ?? '/tmp';

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout,
        cwd,
        env: meta?.env,
      });

      return {
        status: 'succeeded',
        output: {
          id: crypto.randomUUID() as any,
          kind: 'model_output',
          mime: 'text/plain',
          createdAt: new Date().toISOString() as any,
        },
        metadata: {
          stdout,
          stderr,
        },
      };
    } catch (error) {
      return {
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SHELL_EXECUTION_FAILED',
        },
      };
    }
  }
}

export function createShellPlugin(): XSkynetPlugin {
  return {
    name: '@xskynet/plugin-shell',
    version: '0.1.0',
    description: 'Shell command executor for X-Skynet',
    executors: [new ShellExecutor()],
  };
}

export const shellPlugin = createShellPlugin();
export default shellPlugin;
