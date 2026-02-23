import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Orchestrator } from '../orchestrator.js';

describe('Orchestrator', () => {
  let stateDir: string;
  let orchestrator: Orchestrator;

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orchestrator-test-'));
    orchestrator = new Orchestrator({ stateDir });
  });

  afterEach(async () => {
    await fs.rm(stateDir, { recursive: true, force: true });
  });

  it('submitTask should add task to queue', async () => {
    const id = await orchestrator.submitTask({
      type: 'test-task',
      payload: { key: 'value' },
      maxRetries: 0,
    });

    expect(id).toMatch(/^task-/);

    const queue = await orchestrator.readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(id);
    expect(queue[0].type).toBe('test-task');
    expect(queue[0].payload).toEqual({ key: 'value' });
    expect(queue[0].retries).toBe(0);
  });

  it('submitTask should append multiple tasks to queue', async () => {
    await orchestrator.submitTask({ type: 'task-a', payload: {}, maxRetries: 0 });
    await orchestrator.submitTask({ type: 'task-b', payload: {}, maxRetries: 0 });

    const queue = await orchestrator.readQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('task-a');
    expect(queue[1].type).toBe('task-b');
  });

  it('processQueue should execute task and write result file', async () => {
    const id = await orchestrator.submitTask({
      type: 'compute',
      payload: { x: 42 },
      maxRetries: 0,
    });

    await orchestrator.processQueue();

    // Queue should be empty
    const queue = await orchestrator.readQueue();
    expect(queue).toHaveLength(0);

    // Result file should exist
    const resultFile = path.join(stateDir, 'runs', `${id}.json`);
    const raw = await fs.readFile(resultFile, 'utf-8');
    const result = JSON.parse(raw);
    expect(result.taskId).toBe(id);
    expect(result.success).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('processQueue emits task:complete event', async () => {
    await orchestrator.submitTask({ type: 'ping', payload: {}, maxRetries: 0 });

    const completedResults: unknown[] = [];
    orchestrator.on('task:complete', (r) => completedResults.push(r));

    await orchestrator.processQueue();

    expect(completedResults).toHaveLength(1);
  });

  it('processQueue emits queue:empty when no tasks', async () => {
    let emitted = false;
    orchestrator.on('queue:empty', () => { emitted = true; });

    await orchestrator.processQueue();

    expect(emitted).toBe(true);
  });

  it('failed task with retries remaining should be re-queued', async () => {
    class FailingOrchestrator extends Orchestrator {
      protected async executeTask(): Promise<unknown> {
        throw new Error('simulated failure');
      }
    }

    const failOrch = new FailingOrchestrator({ stateDir });
    await failOrch.submitTask({ type: 'fail-task', payload: {}, maxRetries: 2 });

    await failOrch.processQueue();

    const queue = await failOrch.readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].retries).toBe(1);
  });
});
