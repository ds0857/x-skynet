/**
 * AgentDaemon — persistent agent process with heartbeat reporting,
 * task queue polling, and graceful shutdown.
 *
 * @example
 * ```typescript
 * const daemon = new AgentDaemon({
 *   agentId: 'my-agent',
 *   dashboardUrl: 'https://dashboard.example.com',
 *   heartbeatKey: 'secret-key',
 * });
 * await daemon.start();
 * ```
 */

export interface AgentDaemonConfig {
  /** Unique identifier for this agent. */
  agentId: string;
  /** Base URL of the X-Skynet dashboard (e.g. https://dashboard.example.com). */
  dashboardUrl: string;
  /** API key sent as `x-heartbeat-key` header. */
  heartbeatKey: string;
  /** Interval between heartbeats in milliseconds. Default: 60 000. */
  heartbeatIntervalMs?: number;
  /** Interval between task-queue polls in milliseconds. Default: 5 000. */
  pollIntervalMs?: number;
  /** Plugin package names to load on start. */
  plugins?: string[];
}

export interface HeartbeatPayload {
  status: 'healthy' | 'degraded' | 'offline';
  timestamp: string;
  agentId: string;
}

export interface AgentTask {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
  status: 'pending' | 'running' | 'done' | 'failed';
}

type DaemonEvent = 'heartbeat' | 'task' | 'error' | 'stop';
type EventHandler = (...args: unknown[]) => void;

/**
 * Runs an agent as a persistent daemon with periodic heartbeats and
 * task queue polling.
 */
export class AgentDaemon {
  private readonly cfg: Required<AgentDaemonConfig>;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private readonly listeners = new Map<DaemonEvent, EventHandler[]>();

  constructor(config: AgentDaemonConfig) {
    this.cfg = {
      agentId: config.agentId,
      dashboardUrl: config.dashboardUrl,
      heartbeatKey: config.heartbeatKey,
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? 60_000,
      pollIntervalMs: config.pollIntervalMs ?? 5_000,
      plugins: config.plugins ?? [],
    };
  }

  // ── Event emitter ──────────────────────────────────────────────────────────

  on(event: DaemonEvent, handler: EventHandler): this {
    const list = this.listeners.get(event) ?? [];
    list.push(handler);
    this.listeners.set(event, list);
    return this;
  }

  private emit(event: DaemonEvent, ...args: unknown[]): void {
    for (const handler of this.listeners.get(event) ?? []) {
      try { handler(...args); } catch { /* keep daemon alive */ }
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Start the daemon: load plugins, send an initial heartbeat, begin the
   * periodic heartbeat loop, begin task-queue polling, and register OS
   * signal handlers for graceful shutdown.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Load plugins (best-effort dynamic import)
    for (const pkg of this.cfg.plugins) {
      try {
        await import(pkg);
      } catch (err) {
        this.emit('error', new Error(`Failed to load plugin "${pkg}": ${String(err)}`));
      }
    }

    // Initial heartbeat
    await this.heartbeat().catch((err) => this.emit('error', err));

    // Periodic heartbeat every heartbeatIntervalMs (default 60 s)
    this.heartbeatTimer = setInterval(async () => {
      await this.heartbeat().catch((err) => this.emit('error', err));
    }, this.cfg.heartbeatIntervalMs);

    // Poll task queue every pollIntervalMs (default 5 s)
    this.pollTimer = setInterval(async () => {
      await this.pollTasks().catch((err) => this.emit('error', err));
    }, this.cfg.pollIntervalMs);

    // Register OS signal handlers for graceful shutdown
    const shutdown = (): void => { this.stop().catch(() => undefined); };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }

  /**
   * Graceful shutdown: stop timers and emit the 'stop' event.
   */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.emit('stop');
  }

  // ── Heartbeat ──────────────────────────────────────────────────────────────

  /**
   * POST a heartbeat to `<dashboardUrl>/api/ops/agents/<agentId>/heartbeat`.
   * Throws on non-2xx response so the caller can emit an error event.
   */
  async heartbeat(): Promise<void> {
    const url = `${this.cfg.dashboardUrl}/api/ops/agents/${this.cfg.agentId}/heartbeat`;
    const payload: HeartbeatPayload = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agentId: this.cfg.agentId,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-heartbeat-key': this.cfg.heartbeatKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Heartbeat failed: HTTP ${res.status} ${res.statusText}`);
    }

    this.emit('heartbeat', payload);
  }

  // ── Task queue polling ─────────────────────────────────────────────────────

  /**
   * Poll `<dashboardUrl>/api/ops/agents/<agentId>/tasks?status=pending` and
   * process each pending task by invoking the task handler endpoint.
   *
   * Each task is acknowledged via PATCH `/api/ops/tasks/<taskId>` with
   * `{ status: 'running' }` before execution and updated to `done` or
   * `failed` afterwards.
   */
  async pollTasks(): Promise<void> {
    const listUrl =
      `${this.cfg.dashboardUrl}/api/ops/agents/${this.cfg.agentId}/tasks?status=pending`;

    const res = await fetch(listUrl, {
      headers: { 'x-heartbeat-key': this.cfg.heartbeatKey },
    });

    if (!res.ok) {
      throw new Error(`pollTasks list failed: HTTP ${res.status}`);
    }

    const tasks: AgentTask[] = await res.json() as AgentTask[];

    for (const task of tasks) {
      await this.processTask(task);
    }
  }

  private async processTask(task: AgentTask): Promise<void> {
    const baseUrl = `${this.cfg.dashboardUrl}/api/ops/tasks/${task.id}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-heartbeat-key': this.cfg.heartbeatKey,
    };

    // Mark as running
    await fetch(baseUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'running' }),
    }).catch(() => undefined);

    this.emit('task', task);

    try {
      // Delegate actual execution to subscribers; mark done when complete
      await fetch(baseUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'done', completedAt: new Date().toISOString() }),
      });
    } catch (err) {
      await fetch(baseUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'failed', error: String(err) }),
      }).catch(() => undefined);
      this.emit('error', err);
    }
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get isRunning(): boolean {
    return this.running;
  }

  get agentId(): string {
    return this.cfg.agentId;
  }
}
