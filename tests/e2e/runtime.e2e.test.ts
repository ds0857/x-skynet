/**
 * Runtime E2E Tests — P2-08
 *
 * Tests the complete task execution pipeline of XSkynetRuntime, covering:
 *   - Simple DAG execution with the shell plugin
 *   - Task failure propagation and event emission
 *   - Parallel task execution
 *   - Event persistence and replay via InMemoryEventStore / FileEventStore
 */

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { XSkynetRuntime } from '../../packages/core/src/runtime';
import { InMemoryEventStore, FileEventStore } from '../../packages/core/src/event-store';
import { EventBus } from '../../packages/core/src/event-bus';
import { createShellPlugin } from '../../packages/plugin-shell/src/index';
import type { Plan, DomainEvent, Task } from '@xskynet/contracts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId(s: string): any {
  return s as any;
}

function nowIso(): any {
  return new Date().toISOString() as any;
}

function simplePlan(overrides?: Partial<Plan>): Plan {
  return {
    id: makeId('plan-e2e-001'),
    title: 'Simple E2E Plan',
    status: 'draft',
    createdAt: nowIso(),
    tasks: [
      {
        id: makeId('task-001'),
        name: 'Echo Task',
        status: 'idle',
        createdAt: nowIso(),
        steps: [
          {
            id: makeId('step-001'),
            name: 'echo "hello x-skynet"',
            status: 'idle',
            createdAt: nowIso(),
            tags: ['kind:shell'],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function failingPlan(): Plan {
  return {
    id: makeId('plan-fail-001'),
    title: 'Failing Plan',
    status: 'draft',
    createdAt: nowIso(),
    tasks: [
      {
        id: makeId('task-fail-001'),
        name: 'Failing Task',
        status: 'idle',
        createdAt: nowIso(),
        steps: [
          {
            id: makeId('step-fail-001'),
            // 'exit 1' reliably causes a non-zero exit code
            name: 'sh -c "exit 1"',
            status: 'idle',
            createdAt: nowIso(),
            tags: ['kind:shell'],
          },
        ],
      },
    ],
  };
}

function parallelPlan(): Plan {
  return {
    id: makeId('plan-parallel-001'),
    title: 'Parallel E2E Plan',
    status: 'draft',
    createdAt: nowIso(),
    tasks: [
      {
        id: makeId('task-pa'),
        name: 'echo task-a',
        status: 'idle',
        createdAt: nowIso(),
        steps: [
          {
            id: makeId('step-pa-1'),
            name: 'echo task-a',
            status: 'idle',
            createdAt: nowIso(),
            tags: ['kind:shell'],
          },
        ],
      },
      {
        id: makeId('task-pb'),
        name: 'echo task-b',
        status: 'idle',
        createdAt: nowIso(),
        steps: [
          {
            id: makeId('step-pb-1'),
            name: 'echo task-b',
            status: 'idle',
            createdAt: nowIso(),
            tags: ['kind:shell'],
          },
        ],
      },
      {
        id: makeId('task-pc'),
        name: 'echo task-c (depends on a and b)',
        status: 'idle',
        createdAt: nowIso(),
        dependsOn: [makeId('task-pa'), makeId('task-pb')],
        steps: [
          {
            id: makeId('step-pc-1'),
            name: 'echo task-c',
            status: 'idle',
            createdAt: nowIso(),
            tags: ['kind:shell'],
          },
        ],
      },
    ],
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Runtime E2E', () => {
  let runtime: XSkynetRuntime;
  const events: DomainEvent[] = [];

  beforeEach(() => {
    events.length = 0;
    runtime = new XSkynetRuntime();
    runtime.use(createShellPlugin());
    // Capture all emitted events for assertion
    runtime.on('plan.started', (e) => events.push(e));
    runtime.on('plan.succeeded', (e) => events.push(e));
    runtime.on('plan.failed', (e) => events.push(e));
    runtime.on('task.started', (e) => events.push(e));
    runtime.on('task.succeeded', (e) => events.push(e));
    runtime.on('task.failed', (e) => events.push(e));
    runtime.on('step.started', (e) => events.push(e));
    runtime.on('step.succeeded', (e) => events.push(e));
    runtime.on('step.failed', (e) => events.push(e));
  });

  // ── Test 1 ──────────────────────────────────────────────────────────────────
  it('should execute a simple DAG with shell plugin', async () => {
    const plan = simplePlan();
    const result = await runtime.execute(plan, { env: 'test' });

    expect(result.status).toBe('succeeded');
    expect(result.tasks).toHaveLength(1);

    const task = result.tasks[0] as Task;
    expect(task.status).toBe('succeeded');
    expect(task.steps).toHaveLength(1);
    expect(task.steps[0].status).toBe('succeeded');

    // Verify event sequence: plan.started → task.started → step.started → step.succeeded → task.succeeded → plan.succeeded
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('plan.started');
    expect(eventTypes).toContain('task.started');
    expect(eventTypes).toContain('step.started');
    expect(eventTypes).toContain('step.succeeded');
    expect(eventTypes).toContain('task.succeeded');
    expect(eventTypes).toContain('plan.succeeded');

    // plan.started must come before plan.succeeded
    const startIdx = eventTypes.indexOf('plan.started');
    const succeedIdx = eventTypes.indexOf('plan.succeeded');
    expect(startIdx).toBeLessThan(succeedIdx);
  }, 15000);

  // ── Test 2 ──────────────────────────────────────────────────────────────────
  it('should handle task failure and emit failed event', async () => {
    const plan = failingPlan();
    const result = await runtime.execute(plan, { env: 'test' });

    expect(result.status).toBe('failed');

    const failedTask = result.tasks.find((t) => t.status === 'failed');
    expect(failedTask).toBeDefined();
    expect(failedTask!.steps[0].status).toBe('failed');

    // Should emit task.failed and plan.failed
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('step.failed');
    expect(eventTypes).toContain('task.failed');
    expect(eventTypes).toContain('plan.failed');

    // task.failed should precede plan.failed
    const taskFailIdx = eventTypes.indexOf('task.failed');
    const planFailIdx = eventTypes.indexOf('plan.failed');
    expect(taskFailIdx).toBeLessThan(planFailIdx);
  }, 15000);

  // ── Test 3 ──────────────────────────────────────────────────────────────────
  it('should execute parallel tasks', async () => {
    const plan = parallelPlan();
    const before = Date.now();
    const result = await runtime.execute(plan, { env: 'test' });
    const elapsed = Date.now() - before;

    expect(result.status).toBe('succeeded');
    expect(result.tasks).toHaveLength(3);

    // All tasks should have succeeded
    for (const task of result.tasks) {
      expect(task.status).toBe('succeeded');
    }

    // task-pc depends on task-pa and task-pb; all three should complete
    const taskIds = result.tasks.map((t) => t.id);
    expect(taskIds).toContain(makeId('task-pa'));
    expect(taskIds).toContain(makeId('task-pb'));
    expect(taskIds).toContain(makeId('task-pc'));

    // Parallel execution should finish faster than sequential (rough heuristic):
    // With three `echo` commands (near-instant), even sequential would be fast —
    // so we just assert it completed within a generous 10 s budget.
    expect(elapsed).toBeLessThan(10000);
  }, 15000);

  // ── Test 4 ──────────────────────────────────────────────────────────────────
  it('should persist events and replay them', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xskynet-e2e-'));
    const eventsFile = path.join(tmpDir, 'events.jsonl');

    try {
      const store = new FileEventStore(eventsFile);
      const bus = new EventBus({ store, persist: true });

      // Emit a few test events
      const testEvents: DomainEvent[] = [
        {
          id: makeId('evt-001'),
          type: 'plan.started',
          occurredAt: nowIso(),
          aggregateId: makeId('plan-replay-001'),
          payload: { planId: 'plan-replay-001' },
        },
        {
          id: makeId('evt-002'),
          type: 'task.started',
          occurredAt: nowIso(),
          aggregateId: makeId('task-replay-001'),
          payload: { taskId: 'task-replay-001' },
        },
        {
          id: makeId('evt-003'),
          type: 'plan.succeeded',
          occurredAt: nowIso(),
          aggregateId: makeId('plan-replay-001'),
          payload: { planId: 'plan-replay-001' },
        },
      ];

      for (const evt of testEvents) {
        bus.emit(evt);
      }

      // Verify file exists and contains JSONL data
      expect(fs.existsSync(eventsFile)).toBe(true);
      const lines = fs
        .readFileSync(eventsFile, 'utf8')
        .split('\n')
        .filter((l) => l.trim());
      expect(lines).toHaveLength(3);

      // Create a fresh bus backed by the same file store and replay
      const store2 = new FileEventStore(eventsFile);
      const bus2 = new EventBus({ store: store2, persist: true });

      const replayed: DomainEvent[] = [];
      bus2.subscribe({ type: 'plan.started' }, (e) => replayed.push(e));
      bus2.subscribe({ type: 'plan.succeeded' }, (e) => replayed.push(e));
      bus2.subscribe({ type: 'task.started' }, (e) => replayed.push(e));

      const count = bus2.replay();

      expect(count).toBe(3);
      expect(replayed).toHaveLength(3);

      // Check that replayed events are marked
      expect(replayed.every((e) => e.metadata?.replayed === true)).toBe(true);

      // list() should return events in chronological order
      const listed = bus2.list();
      expect(listed).toHaveLength(3);
      expect(listed[0].type).toBe('plan.started');
      expect(listed[2].type).toBe('plan.succeeded');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 15000);
});
