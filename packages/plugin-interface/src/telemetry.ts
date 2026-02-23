/**
 * Optional anonymous telemetry for @x-skynet/plugin-interface.
 *
 * Telemetry is enabled by default and can be disabled by setting the
 * environment variable XSKYNET_NO_TELEMETRY=1 before the process starts.
 *
 * No personally-identifiable information is collected. Only structural events
 * (plugin load/unload, plan lifecycle) with OS / runtime metadata are sent.
 *
 * Endpoint: Cloudflare Worker (to be wired up in a future release).
 */

import * as os from 'os';

// Mutable flag so optOut() can disable in-process without needing the env var.
let _enabled: boolean = process.env.XSKYNET_NO_TELEMETRY !== '1';

const ENDPOINT = 'https://telemetry.x-skynet.dev/v1/events';
const SDK_VERSION = '0.1.0';
const FLUSH_TIMEOUT_MS = 5_000;

/** Shape of a single telemetry event sent to the endpoint. */
export interface TelemetryEvent {
  type:
    | 'plugin_load'
    | 'plugin_unload'
    | 'plugin_error'
    | 'plan_run'
    | 'plan_complete'
    | 'plan_fail';
  pluginId?: string;
  durationMs?: number;
  errorCode?: string;
  sdkVersion: string;
  nodeVersion: string;
  os: string;
  timestamp: string;
}

/** Minimal partial event accepted by {@link Telemetry.track}. */
export type TelemetryInput = Omit<
  TelemetryEvent,
  'sdkVersion' | 'nodeVersion' | 'os' | 'timestamp'
>;

/**
 * Static telemetry helper.  All methods are fire-and-forget safe — they never
 * throw and never block the calling code.
 */
export class Telemetry {
  /** Internal event queue, drained by {@link flush}. */
  private static _queue: TelemetryEvent[] = [];
  private static _flushing = false;

  /**
   * Replaceable fetch implementation.  Override in tests to intercept
   * outgoing HTTP calls without relying on global.fetch mocks.
   *
   * @internal
   */
  static _fetchImpl: (url: string, init: RequestInit) => Promise<Response> = (
    url,
    init,
  ) => fetch(url, init);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Enqueue a telemetry event.  Does nothing when telemetry is disabled.
   * Automatically schedules a flush via `setImmediate` (non-blocking).
   */
  static track(event: TelemetryInput): void {
    if (!_enabled) return;

    const full: TelemetryEvent = {
      ...event,
      sdkVersion: SDK_VERSION,
      nodeVersion: process.version,
      os: `${os.platform()}-${os.arch()}`,
      timestamp: new Date().toISOString(),
    };

    this._queue.push(full);

    // Non-blocking flush — schedule after current call-stack unwinds.
    if (typeof setImmediate !== 'undefined') {
      setImmediate(() => { void Telemetry.flush(); });
    } else {
      setTimeout(() => { void Telemetry.flush(); }, 0);
    }
  }

  /**
   * Flush all queued events to the telemetry endpoint.
   * Silently swallows any network or timeout errors.
   */
  static async flush(): Promise<void> {
    if (!_enabled || this._queue.length === 0 || this._flushing) return;

    this._flushing = true;
    const batch = this._queue.splice(0);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FLUSH_TIMEOUT_MS);

      await Telemetry._fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        signal: controller.signal,
      });

      clearTimeout(timer);
    } catch {
      // Silently discard — telemetry must never affect the host application.
    } finally {
      this._flushing = false;
    }
  }

  /** Returns true when telemetry is currently enabled. */
  static isEnabled(): boolean {
    return _enabled;
  }

  /**
   * Opt out of telemetry for the duration of this process.
   * This is **not** persisted — to permanently opt out set
   * `XSKYNET_NO_TELEMETRY=1` in the environment.
   */
  static optOut(): void {
    _enabled = false;
    // Discard any queued events.
    this._queue.splice(0);
  }

  /**
   * Re-enable telemetry (reverses a previous {@link optOut} call).
   * Useful mainly in tests.
   *
   * @internal
   */
  static _optIn(): void {
    _enabled = true;
  }

  /**
   * Expose the queue length for testing.
   *
   * @internal
   */
  static _queueLength(): number {
    return this._queue.length;
  }

  /**
   * Drain the queue without sending.  For use in tests only.
   *
   * @internal
   */
  static _clearQueue(): void {
    this._queue.splice(0);
  }
}
