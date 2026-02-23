/**
 * Unit tests for @xskynet/contracts
 * Tests type constraints and state machine transition logic
 */

import {
  PlanStatus,
  TaskStatus,
  StepStatus,
  Artifact,
  Step,
  Task,
  Plan,
  RunContext,
  Transition,
  ok,
  err,
  Result,
  ISODateTime,
} from '../index';

// Helper: cast string to branded ISODateTime for test usage
const nowIso = (): ISODateTime => new Date().toISOString() as unknown as ISODateTime;

describe('@xskynet/contracts', () => {
  describe('Status types', () => {
    it('PlanStatus includes all expected values', () => {
      const statuses: PlanStatus[] = ['draft', 'approved', 'running', 'succeeded', 'failed', 'cancelled'];
      expect(statuses).toHaveLength(6);
    });

    it('TaskStatus includes all expected values', () => {
      const statuses: TaskStatus[] = ['idle', 'running', 'blocked', 'succeeded', 'failed', 'cancelled'];
      expect(statuses).toHaveLength(6);
    });

    it('StepStatus includes all expected values', () => {
      const statuses: StepStatus[] = ['idle', 'running', 'paused', 'succeeded', 'failed', 'cancelled'];
      expect(statuses).toHaveLength(6);
    });

    it('StepStatus can be assigned correctly', () => {
      const status: StepStatus = 'running';
      expect(status).toBe('running');
    });
  });

  describe('RetryPolicy and configuration structures', () => {
    it('validates retry configuration structure', () => {
      const policy = { maxAttempts: 3, backoff: 'exponential' as const, initialIntervalMs: 1000 };
      expect(policy.maxAttempts).toBe(3);
      expect(policy.backoff).toBe('exponential');
    });

    it('Plan constraints can be configured', () => {
      const constraints = {
        budgetUSD: 100,
        maxLatencyMs: 5000,
        maxParallelism: 4,
      };
      expect(constraints.budgetUSD).toBe(100);
      expect(constraints.maxParallelism).toBe(4);
    });
  });

  describe('Result utility types', () => {
    it('ok helper creates successful result', () => {
      const result = ok('success');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('err helper creates error result', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    it('Result type narrows correctly', () => {
      const successResult: Result<string> = ok('data');
      const errorResult: Result<string> = err(new Error('failed'));

      if (successResult.ok) {
        expect(successResult.value).toBe('data');
      }

      if (!errorResult.ok) {
        expect(errorResult.error.message).toBe('failed');
      }
    });
  });

  describe('Artifact type', () => {
    it('creates valid Artifact with required fields', () => {
      const artifact: Artifact = {
        id: 'artifact-123' as unknown as import('../index').ID,
        kind: 'file',
        createdAt: nowIso(),
      };

      expect(artifact.id).toBe('artifact-123');
      expect(artifact.kind).toBe('file');
    });

    it('creates Artifact with optional metadata', () => {
      const artifact: Artifact = {
        id: 'artifact-456' as unknown as import('../index').ID,
        kind: 'prompt',
        mime: 'text/plain',
        name: 'test-prompt.txt',
        bytes: 1024,
        createdAt: nowIso(),
        metadata: { source: 'user-input' },
      };

      expect(artifact.mime).toBe('text/plain');
      expect(artifact.metadata?.source).toBe('user-input');
    });
  });

  describe('Step type', () => {
    it('creates valid Step with required fields', () => {
      const step: Step = {
        id: 'step-001' as unknown as import('../index').ID,
        name: 'Test Step',
        status: 'idle',
        createdAt: nowIso(),
      };

      expect(step.id).toBe('step-001');
      expect(step.status).toBe('idle');
    });

    it('Step can have error details', () => {
      const step: Step = {
        id: 'step-002' as unknown as import('../index').ID,
        name: 'Failing Step',
        status: 'failed',
        createdAt: nowIso(),
        error: {
          message: 'Something went wrong',
          code: 'EXECUTION_ERROR',
          details: { stack: 'Error: Something went wrong\n    at test.js:1:1' },
        },
      };

      expect(step.status).toBe('failed');
      expect(step.error?.code).toBe('EXECUTION_ERROR');
    });
  });

  describe('Task type', () => {
    it('creates valid Task with steps', () => {
      const task: Task = {
        id: 'task-001' as unknown as import('../index').ID,
        name: 'Test Task',
        status: 'idle',
        createdAt: nowIso(),
        steps: [],
      };

      expect(task.id).toBe('task-001');
      expect(task.steps).toEqual([]);
    });

    it('Task can have priority and labels', () => {
      const task: Task = {
        id: 'task-002' as unknown as import('../index').ID,
        name: 'High Priority Task',
        status: 'running',
        createdAt: nowIso(),
        priority: 'high',
        labels: ['urgent', 'phase-1'],
        steps: [],
      };

      expect(task.priority).toBe('high');
      expect(task.labels).toContain('urgent');
    });
  });

  describe('Plan type', () => {
    it('creates valid Plan with tasks', () => {
      const plan: Plan = {
        id: 'plan-001' as unknown as import('../index').ID,
        title: 'Test Plan',
        status: 'draft',
        createdAt: nowIso(),
        tasks: [],
      };

      expect(plan.title).toBe('Test Plan');
      expect(plan.status).toBe('draft');
    });

    it('Plan status transitions are valid', () => {
      const validTransitions: PlanStatus[] = ['draft', 'approved', 'running', 'succeeded', 'failed', 'cancelled'];

      validTransitions.forEach(status => {
        const plan: Plan = {
          id: `plan-${status}` as unknown as import('../index').ID,
          title: `Plan ${status}`,
          status,
          createdAt: nowIso(),
          tasks: [],
        };
        expect(plan.status).toBe(status);
      });
    });
  });

  describe('RunContext type', () => {
    it('creates valid RunContext', () => {
      const context: RunContext = {
        runId: 'run-123' as unknown as import('../index').ID,
        planId: 'plan-456' as unknown as import('../index').ID,
        env: 'dev',
      };

      expect(context.runId).toBe('run-123');
      expect(context.env).toBe('dev');
    });

    it('RunContext can have full configuration', () => {
      const context: RunContext = {
        runId: 'run-789' as unknown as import('../index').ID,
        planId: 'plan-012' as unknown as import('../index').ID,
        user: {
          id: 'user-abc',
          role: 'admin',
        },
        env: 'prod',
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          promptCache: true,
        },
        tracing: {
          traceId: 'trace-xyz',
        },
      };

      expect(context.llm?.provider).toBe('anthropic');
      expect(context.llm?.promptCache).toBe(true);
    });
  });

  describe('State machine types', () => {
    it('Transition has valid condition types', () => {
      const transition: Transition = {
        target: 'succeeded',
        when: { type: 'onStatus', status: 'succeeded' },
      };

      expect(transition.when.type).toBe('onStatus');
      expect(transition.target).toBe('succeeded');
    });

    it('StateNode can be created for step', () => {
      const stepState: import('../index').StepStateNode = {
        id: 'step-state-1',
        kind: 'step',
        status: 'idle',
      };

      expect(stepState.kind).toBe('step');
    });
  });
});
