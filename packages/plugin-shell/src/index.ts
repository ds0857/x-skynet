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
    const meta = step.metadata as (ShellStepConfig & { command?: string }) | undefined;
    // Prefer explicit `command` field, fallback to step name
    const cmd = meta?.command ?? step.name ?? '';
    const timeout = meta?.timeout ?? 30000;
    const cwd = meta?.cwd ?? process.cwd();

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout,
        cwd,
        env: meta?.env,
      });

      // Stream output to console so users see results in real time
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);

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

/**
 * EchoExecutor — kind="echo"
 * Prints `step.metadata.message` (or `step.name`) to stdout. Zero dependencies.
 */
export class EchoExecutor implements StepExecutor {
  readonly kind = 'echo';

  async execute(step: Step, _ctx: RunContext): Promise<StepResult> {
    const meta = step.metadata as { message?: string } | undefined;
    const message = meta?.message ?? step.name ?? '';
    process.stdout.write(message + '\n');
    return {
      status: 'succeeded',
      metadata: { message },
    };
  }
}

export function createShellPlugin(): XSkynetPlugin {
  return {
    name: '@xskynet/plugin-shell',
    version: '0.1.0',
    description: 'Shell command executor for X-Skynet',
    executors: [new ShellExecutor(), new EchoExecutor()],
  };
}

export const shellPlugin = createShellPlugin();
export default shellPlugin;
