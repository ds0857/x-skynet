/**
 * AgentDaemon — persistent agent process with heartbeat loop and graceful shutdown.
 *
 * @example
 * ```typescript
 * const daemon = new AgentDaemon({ agentId: 'my-agent', dashboardUrl: 'https://...', apiKey: 'xxx' });
 * await daemon.start();
 * ```
 */

export interface AgentDaemonConfig {
  /** Unique identifier for this agent. */
  agentId: string;
  /** Interval between heartbeats in milliseconds. Default: 30 000. */
  heartbeatIntervalMs?: number;
  /** Base URL of the X-Skynet dashboard (e.g. https://dashboard.example.com). */
  dashboardUrl?: string;
  /** API key sent as `x-heartbeat-key` header. */
  apiKey?: string;
  /** Plugin package names to load on start. */
  plugins?: string[];
}

type DaemonEvent = 'heartbeat' | 'error' | 'stop';

type EventHandler = (...args: unknown[]) => void;

/**
 * Runs an agent as a persistent daemon with periodic heartbeats.
 */
export class AgentDaemon {
  private readonly config: Required<AgentDaemonConfig>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private readonly listeners = new Map<DaemonEvent, EventHandler[]>();

  constructor(config: AgentDaemonConfig) {
    this.config = {
      agentId: config.agentId,
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? 30_000,
      dashboardUrl: config.dashboardUrl ?? '',
      apiKey: config.apiKey ?? '',
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
    const list = this.listeners.get(event) ?? [];
    for (const handler of list) {
      try {
        handler(...args);
      } catch {
        // swallow handler errors — daemon must stay alive
      }
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Start the daemon: load plugins, send an initial heartbeat, then begin
   * the periodic heartbeat loop and register OS signal handlers.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Load plugins (best-effort dynamic import)
    for (const pkg of this.config.plugins) {
      try {
        await import(pkg);
      } catch (err) {
        this.emit('error', new Error(`Failed to load plugin "${pkg}": ${String(err)}`));
      }
    }

    // Initial heartbeat
    await this.sendHeartbeat().catch((err) => this.emit('error', err));

    // Periodic heartbeat
    this.timer = setInterval(async () => {
      await this.sendHeartbeat().catch((err) => this.emit('error', err));
    }, this.config.heartbeatIntervalMs);

    // Graceful shutdown on OS signals
    const shutdown = (): void => {
      this.stop().catch(() => undefined);
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }

  /**
   * Stop the daemon: clear the heartbeat timer and emit the 'stop' event.
   */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.emit('stop');
  }

  // ── Heartbeat ──────────────────────────────────────────────────────────────

  /**
   * POST a heartbeat to `<dashboardUrl>/api/ops/agents/<agentId>/heartbeat`.
   * No-ops silently if `dashboardUrl` is not configured.
   */
  async sendHeartbeat(): Promise<void> {
    if (!this.config.dashboardUrl) return;

    const url = `${this.config.dashboardUrl}/api/ops/agents/${this.config.agentId}/heartbeat`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      headers['x-heartbeat-key'] = this.config.apiKey;
    }

    const body = JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() });

    const res = await fetch(url, { method: 'POST', headers, body });

    if (!res.ok) {
      throw new Error(`Heartbeat failed: ${res.status} ${res.statusText}`);
    }

    this.emit('heartbeat', { agentId: this.config.agentId, timestamp: new Date().toISOString() });
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get isRunning(): boolean {
    return this.running;
  }

  get agentId(): string {
    return this.config.agentId;
  }
}
