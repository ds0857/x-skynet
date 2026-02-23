import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import type { Plan } from '@xskynet/contracts';
import type { XSkynetRuntime } from './runtime.js';

export interface QueuedTask {
  id: string;
  /** Task type: 'plan' routes to XSkynetRuntime.execute(), all others echo the payload. */
  type: string;
  payload: Record<string, unknown>;
  retries: number;
  maxRetries: number;
  createdAt: string;
}

/** Result record persisted to ~/.xskynet/runs/{taskId}.json */
export interface OrchestratorRun {
  taskId: string;
  success: boolean;
  output: unknown;
  error?: string;
  completedAt: string;
  durationMs: number;
}

export interface OrchestratorConfig {
  stateDir?: string;
  pollIntervalMs?: number;
  maxConcurrent?: number;
  /**
   * Optional XSkynetRuntime instance.
   * When provided, tasks with type='plan' are routed to runtime.execute().
   */
  runtime?: XSkynetRuntime;
}

export class Orchestrator extends EventEmitter {
  private readonly stateDir: string;
  private readonly pollIntervalMs: number;
  private readonly maxConcurrent: number;
  private readonly runtime: XSkynetRuntime | undefined;
  private running = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private activeCount = 0;

  constructor(config: OrchestratorConfig = {}) {
    super();
    this.stateDir = config.stateDir ?? path.join(os.homedir(), '.xskynet');
    this.pollIntervalMs = config.pollIntervalMs ?? 2000;
    this.maxConcurrent = config.maxConcurrent ?? 1;
    this.runtime = config.runtime;
  }

  get queueFile(): string {
    return path.join(this.stateDir, 'queue.json');
  }

  get runsDir(): string {
    return path.join(this.stateDir, 'runs');
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    await this.ensureDirs();
    this.pollTimer = setInterval(() => void this.processQueue(), this.pollIntervalMs);
    this.emit('start');
  }

  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.emit('stop');
  }

  async submitTask(task: Omit<QueuedTask, 'id' | 'retries' | 'createdAt'>): Promise<string> {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const queued: QueuedTask = { ...task, id, retries: 0, createdAt: new Date().toISOString() };
    const queue = await this.readQueue();
    queue.push(queued);
    await this.writeQueue(queue);
    return id;
  }

  async processQueue(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent) return;
    const queue = await this.readQueue();
    if (queue.length === 0) {
      this.emit('queue:empty');
      return;
    }
    const task = queue.shift()!;
    await this.writeQueue(queue);
    this.activeCount++;
    this.emit('task:start', task);
    const startMs = Date.now();
    try {
      const output = await this.executeTask(task);
      const result: OrchestratorRun = {
        taskId: task.id,
        success: true,
        output,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
      };
      await this.writeResult(result);
      this.emit('task:complete', result);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      if (task.retries < task.maxRetries) {
        task.retries++;
        const retryQueue = await this.readQueue();
        retryQueue.unshift(task);
        await this.writeQueue(retryQueue);
        this.emit('task:retry', task);
      } else {
        const result: OrchestratorRun = {
          taskId: task.id,
          success: false,
          output: null,
          error,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startMs,
        };
        await this.writeResult(result);
        this.emit('task:failed', result);
      }
    } finally {
      this.activeCount--;
    }
  }

  /**
   * Execute a single task.
   * - If type is 'plan' and a runtime is configured, delegates to XSkynetRuntime.execute().
   * - Otherwise echoes the payload (override in subclasses for custom behaviour).
   */
  protected async executeTask(task: QueuedTask): Promise<unknown> {
    if (task.type === 'plan' && this.runtime) {
      // Payload is expected to be a serialised Plan from @xskynet/contracts
      return this.runtime.execute(task.payload as unknown as Plan);
    }
    // Default: echo payload — override this method for custom execution logic
    return { type: task.type, payload: task.payload, executedAt: new Date().toISOString() };
  }

  async readQueue(): Promise<QueuedTask[]> {
    try {
      const raw = await fs.readFile(this.queueFile, 'utf-8');
      return JSON.parse(raw) as QueuedTask[];
    } catch {
      return [];
    }
  }

  async writeQueue(queue: QueuedTask[]): Promise<void> {
    await fs.mkdir(this.stateDir, { recursive: true });
    await fs.writeFile(this.queueFile, JSON.stringify(queue, null, 2));
  }

  async writeResult(result: OrchestratorRun): Promise<void> {
    await fs.mkdir(this.runsDir, { recursive: true });
    const file = path.join(this.runsDir, `${result.taskId}.json`);
    await fs.writeFile(file, JSON.stringify(result, null, 2));
  }

  private async ensureDirs(): Promise<void> {
    await fs.mkdir(this.stateDir, { recursive: true });
    await fs.mkdir(this.runsDir, { recursive: true });
  }
}
