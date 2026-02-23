/**
 * Plugin E2E Tests — P2-08
 *
 * Tests plugin registration, lookup, and execution through the XSkynetRuntime.
 * Covers the shell plugin, plugin registry, and the extension lifecycle.
 */

import path from 'node:path';
import { XSkynetRuntime } from '../../packages/core/src/runtime';
import { PluginRegistry } from '../../packages/core/src/plugin-registry';
import { createShellPlugin, ShellExecutor } from '../../packages/plugin-shell/src/index';
import type {
  Plan,
  Step,
  RunContext,
  XSkynetPlugin,
  StepExecutor,
  StepResult,
} from '@xskynet/contracts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId(s: string): any {
  return s as any;
}

function nowIso(): any {
  return new Date().toISOString() as any;
}

function makeStep(overrides?: Partial<Step>): Step {
  return {
    id: makeId('step-plugin-001'),
    name: 'echo plugin-test',
    status: 'idle',
    createdAt: nowIso(),
    tags: ['kind:shell'],
    ...overrides,
  };
}

function makeCtx(): RunContext {
  return {
    runId: makeId('run-plugin-001'),
    planId: makeId('plan-plugin-001'),
    env: 'test',
  };
}

function makePlanWithStep(step: Partial<Step>): Plan {
  return {
    id: makeId('plan-plugin-e2e'),
    title: 'Plugin E2E Plan',
    status: 'draft',
    createdAt: nowIso(),
    tasks: [
      {
        id: makeId('task-plugin-001'),
        name: 'Plugin Test Task',
        status: 'idle',
        createdAt: nowIso(),
        steps: [makeStep(step)],
      },
    ],
  };
}

// ─── Custom Test Plugin ───────────────────────────────────────────────────────

/** A simple in-memory "echo" executor for testing plugin interface compliance */
class EchoExecutor implements StepExecutor {
  readonly kind = 'echo';
  readonly calls: Array<{ step: Step; ctx: RunContext }> = [];

  async execute(step: Step, ctx: RunContext): Promise<StepResult> {
    this.calls.push({ step, ctx });
    return {
      status: 'succeeded',
      output: {
        id: makeId('art-echo-001'),
        kind: 'model_output',
        mime: 'text/plain',
        createdAt: nowIso(),
      },
      metadata: { echoed: step.name },
    };
  }
}

class FailingExecutor implements StepExecutor {
  readonly kind = 'always-fail';

  async execute(_step: Step, _ctx: RunContext): Promise<StepResult> {
    return {
      status: 'failed',
      error: { message: 'Intentional failure from FailingExecutor', code: 'INTENTIONAL_FAIL' },
    };
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Plugin E2E', () => {
  // ── Test 1: PluginRegistry ───────────────────────────────────────────────────
  describe('PluginRegistry', () => {
    it('registers and retrieves executors by kind', () => {
      const registry = new PluginRegistry();
      const shell = createShellPlugin();
      registry.register(shell);

      const executor = registry.getExecutor('shell');
      expect(executor).toBeDefined();
      expect(executor!.kind).toBe('shell');
    });

    it('returns undefined for unknown executor kinds', () => {
      const registry = new PluginRegistry();
      expect(registry.getExecutor('nonexistent-kind')).toBeUndefined();
    });

    it('supports multiple plugins with different executor kinds', () => {
      const registry = new PluginRegistry();
      const echo = new EchoExecutor();
      const fail = new FailingExecutor();

      const pluginA: XSkynetPlugin = { name: 'plugin-echo', version: '1.0.0', executors: [echo] };
      const pluginB: XSkynetPlugin = { name: 'plugin-fail', version: '1.0.0', executors: [fail] };

      registry.register(pluginA);
      registry.register(pluginB);

      expect(registry.getExecutor('echo')).toBe(echo);
      expect(registry.getExecutor('always-fail')).toBe(fail);
      expect(registry.listPlugins()).toHaveLength(2);
    });

    it('later plugin overwrites executor of same kind', () => {
      const registry = new PluginRegistry();
      const echo1 = new EchoExecutor();
      const echo2 = new EchoExecutor();

      registry.register({ name: 'p1', version: '1.0.0', executors: [echo1] });
      registry.register({ name: 'p2', version: '1.0.0', executors: [echo2] });

      // Last registered wins
      expect(registry.getExecutor('echo')).toBe(echo2);
    });
  });

  // ── Test 2: Shell Plugin ────────────────────────────────────────────────────
  describe('Shell Plugin execution', () => {
    it('executes a shell command and captures stdout', async () => {
      const executor = new ShellExecutor();
      const step = makeStep({ name: 'echo hello-plugin' });
      const ctx = makeCtx();

      const result = await executor.execute(step, ctx);

      expect(result.status).toBe('succeeded');
      expect(result.metadata).toBeDefined();
      expect((result.metadata as any).stdout).toContain('hello-plugin');
    }, 10000);

    it('reports failure for a non-zero exit command', async () => {
      const executor = new ShellExecutor();
      const step = makeStep({ name: 'sh -c "exit 42"' });
      const ctx = makeCtx();

      const result = await executor.execute(step, ctx);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('SHELL_EXECUTION_FAILED');
    }, 10000);

    it('respects timeout in step metadata', async () => {
      const executor = new ShellExecutor();
      const step = makeStep({
        name: 'sleep 60',
        // 100 ms timeout — sleep 60 should fail
        metadata: { timeout: 100 },
      });
      const ctx = makeCtx();

      const start = Date.now();
      const result = await executor.execute(step, ctx);
      const elapsed = Date.now() - start;

      expect(result.status).toBe('failed');
      // Should complete well within 5 s (not wait the full 60 s)
      expect(elapsed).toBeLessThan(5000);
    }, 10000);
  });

  // ── Test 3: Runtime + custom plugin ─────────────────────────────────────────
  describe('Runtime with custom plugin', () => {
    it('routes step execution to registered plugin executor by kind tag', async () => {
      const echoExec = new EchoExecutor();
      const plugin: XSkynetPlugin = { name: 'test-echo-plugin', version: '0.1.0', executors: [echoExec] };

      const runtime = new XSkynetRuntime();
      runtime.use(plugin);

      const plan = makePlanWithStep({ name: 'custom-echo-test', tags: ['kind:echo'] });
      const result = await runtime.execute(plan, { env: 'test' });

      expect(result.status).toBe('succeeded');
      expect(echoExec.calls).toHaveLength(1);
      expect(echoExec.calls[0].step.name).toBe('custom-echo-test');
    }, 10000);

    it('returns failed status when no executor registered for step kind', async () => {
      const runtime = new XSkynetRuntime();
      // No plugin registered

      const plan = makePlanWithStep({ tags: ['kind:missing-executor'] });
      const result = await runtime.execute(plan, { env: 'test' });

      expect(result.status).toBe('failed');
      const failedStep = result.tasks[0].steps[0];
      expect(failedStep.status).toBe('failed');
      expect(failedStep.error?.message).toMatch(/missing-executor/i);
    }, 10000);

    it('chains multiple plugins — each handles its own step kind', async () => {
      const echoExec = new EchoExecutor();
      const echoPlugin: XSkynetPlugin = { name: 'echo-plugin', version: '0.1.0', executors: [echoExec] };

      const runtime = new XSkynetRuntime();
      runtime.use(echoPlugin);
      runtime.use(createShellPlugin());

      const plan: Plan = {
        id: makeId('plan-multi-plugin'),
        title: 'Multi-plugin Plan',
        status: 'draft',
        createdAt: nowIso(),
        tasks: [
          {
            id: makeId('task-echo-step'),
            name: 'Echo Task',
            status: 'idle',
            createdAt: nowIso(),
            steps: [makeStep({ id: makeId('step-e-1'), name: 'echo-via-plugin', tags: ['kind:echo'] })],
          },
          {
            id: makeId('task-shell-step'),
            name: 'Shell Task',
            status: 'idle',
            createdAt: nowIso(),
            steps: [makeStep({ id: makeId('step-s-1'), name: 'echo hello-shell', tags: ['kind:shell'] })],
          },
        ],
      };

      const result = await runtime.execute(plan, { env: 'test' });

      expect(result.status).toBe('succeeded');
      expect(result.tasks).toHaveLength(2);
      for (const task of result.tasks) {
        expect(task.status).toBe('succeeded');
      }

      // echo executor was called for the echo task
      expect(echoExec.calls).toHaveLength(1);
      expect(echoExec.calls[0].step.name).toBe('echo-via-plugin');
    }, 15000);
  });
});
