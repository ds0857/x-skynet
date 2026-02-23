/**
 * Unit tests for AgentDaemon.
 *
 * Uses jest fake timers to control the heartbeat interval and a global
 * `fetch` mock to intercept HTTP requests without hitting the network.
 */

import { AgentDaemon, AgentDaemonConfig } from '../agent-daemon.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFetch(ok = true, status = 200): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Internal Server Error',
  });
}

function makeConfig(overrides: Partial<AgentDaemonConfig> = {}): AgentDaemonConfig {
  return {
    agentId: 'test-agent',
    dashboardUrl: 'https://dashboard.example.com',
    heartbeatKey: 'test-key',
    heartbeatIntervalMs: 1_000,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AgentDaemon', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    jest.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // 1 ─────────────────────────────────────────────────────────────────────────
  it('constructs with default values', () => {
    const daemon = new AgentDaemon({ agentId: 'my-agent' });
    expect(daemon.agentId).toBe('my-agent');
    expect(daemon.isRunning).toBe(false);
  });

  // 2 ─────────────────────────────────────────────────────────────────────────
  it('sends an initial heartbeat on start and emits the heartbeat event', async () => {
    const mockFetch = makeFetch();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const daemon = new AgentDaemon(makeConfig());

    const heartbeatEvents: unknown[] = [];
    daemon.on('heartbeat', (info) => heartbeatEvents.push(info));

    await daemon.start();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://dashboard.example.com/api/ops/agents/test-agent/heartbeat',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(heartbeatEvents).toHaveLength(1);

    await daemon.stop();
  });

  // 3 ─────────────────────────────────────────────────────────────────────────
  it('sends repeated heartbeats on interval', async () => {
    const mockFetch = makeFetch();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const daemon = new AgentDaemon(makeConfig({ heartbeatIntervalMs: 1_000 }));
    await daemon.start();

    // Advance two full intervals
    await jest.advanceTimersByTimeAsync(2_100);

    // initial + 2 interval ticks = 3 total
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(3);

    await daemon.stop();
  });

  // 4 ─────────────────────────────────────────────────────────────────────────
  it('emits error event when heartbeat HTTP call fails', async () => {
    const mockFetch = makeFetch(false, 500);
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const daemon = new AgentDaemon(makeConfig());

    const errors: unknown[] = [];
    daemon.on('error', (err) => errors.push(err));

    await daemon.start();

    expect(errors).toHaveLength(1);
    expect(String(errors[0])).toMatch(/500/);

    await daemon.stop();
  });

  // 5 ─────────────────────────────────────────────────────────────────────────
  it('emits stop event and clears the interval on stop()', async () => {
    const mockFetch = makeFetch();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const daemon = new AgentDaemon(makeConfig({ heartbeatIntervalMs: 1_000 }));

    const stopEvents: unknown[] = [];
    daemon.on('stop', () => stopEvents.push(true));

    await daemon.start();
    expect(daemon.isRunning).toBe(true);

    await daemon.stop();
    expect(daemon.isRunning).toBe(false);
    expect(stopEvents).toHaveLength(1);

    // After stop, advancing time should NOT trigger more fetch calls
    const callsBeforeAdvance = mockFetch.mock.calls.length;
    await jest.advanceTimersByTimeAsync(5_000);
    expect(mockFetch.mock.calls.length).toBe(callsBeforeAdvance);
  });

  // 6 ─────────────────────────────────────────────────────────────────────────
  it('skips the HTTP call when dashboardUrl is not set', async () => {
    const mockFetch = makeFetch();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const daemon = new AgentDaemon({ agentId: 'no-url-agent' });
    await daemon.start();

    expect(mockFetch).not.toHaveBeenCalled();

    await daemon.stop();
  });

  // 7 ─────────────────────────────────────────────────────────────────────────
  it('does not re-start if already running', async () => {
    const mockFetch = makeFetch();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const daemon = new AgentDaemon(makeConfig());
    await daemon.start();
    const callsAfterFirstStart = mockFetch.mock.calls.length;

    // Second start should be a no-op
    await daemon.start();
    expect(mockFetch.mock.calls.length).toBe(callsAfterFirstStart);

    await daemon.stop();
  });
});
