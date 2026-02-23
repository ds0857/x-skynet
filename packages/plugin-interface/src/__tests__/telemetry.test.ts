/**
 * Unit tests for the Telemetry class.
 *
 * Because TELEMETRY_ENABLED is a module-level variable (initialised from the
 * environment at import time), we control the enabled/disabled state through
 * the `optOut()` / `_optIn()` helpers rather than reloading the module each
 * time.
 *
 * Network isolation: instead of mocking `global.fetch` (which doesn't
 * reliably intercept ESM-scoped calls), we replace `Telemetry._fetchImpl`
 * with a jest.fn() for tests that need to assert on outgoing requests.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Telemetry } from '../telemetry.js';

// ── Default no-op fetch mock (prevents real network calls) ────────────────
const noopFetch = jest.fn(async (_url: string, _init: RequestInit): Promise<Response> => {
  return new Response('{}', { status: 200 });
});

// ── Helpers ───────────────────────────────────────────────────────────────

function resetTelemetry() {
  Telemetry._optIn();
  Telemetry._clearQueue();
  Telemetry._fetchImpl = noopFetch;
  noopFetch.mockClear();
}

// ── Suite ─────────────────────────────────────────────────────────────────

describe('Telemetry', () => {
  beforeEach(() => {
    resetTelemetry();
  });

  afterEach(async () => {
    resetTelemetry();
    jest.restoreAllMocks();
    // Drain any setImmediate callbacks scheduled by track() so that Jest
    // can exit cleanly without open async handles.
    await new Promise<void>((res) => setImmediate(res));
  });

  // ── isEnabled ─────────────────────────────────────────────────────────

  describe('isEnabled()', () => {
    it('returns true when telemetry has not been opted out', () => {
      expect(Telemetry.isEnabled()).toBe(true);
    });

    it('returns false after optOut()', () => {
      Telemetry.optOut();
      expect(Telemetry.isEnabled()).toBe(false);
    });

    it('returns true again after _optIn()', () => {
      Telemetry.optOut();
      Telemetry._optIn();
      expect(Telemetry.isEnabled()).toBe(true);
    });
  });

  // ── track() ───────────────────────────────────────────────────────────

  describe('track()', () => {
    it('enqueues an event when enabled', () => {
      Telemetry.track({ type: 'plugin_load', pluginId: 'my-plugin' });
      expect(Telemetry._queueLength()).toBe(1);
    });

    it('does NOT enqueue when telemetry is disabled via optOut()', () => {
      Telemetry.optOut();
      Telemetry.track({ type: 'plugin_load', pluginId: 'should-not-appear' });
      expect(Telemetry._queueLength()).toBe(0);
    });

    it('does NOT enqueue when XSKYNET_NO_TELEMETRY env is simulated (optOut)', () => {
      // We simulate the env-var path via optOut(); the module-level flag
      // is set at load time, but optOut() reflects the same observable contract.
      Telemetry.optOut();
      Telemetry.track({ type: 'plugin_unload' });
      Telemetry.track({ type: 'plan_run' });
      expect(Telemetry._queueLength()).toBe(0);
    });

    it('enqueues multiple events', () => {
      Telemetry.track({ type: 'plugin_load', pluginId: 'a' });
      Telemetry.track({ type: 'plan_run' });
      Telemetry.track({ type: 'plan_complete', durationMs: 42 });
      expect(Telemetry._queueLength()).toBe(3);
    });
  });

  // ── event format ─────────────────────────────────────────────────────

  describe('event format', () => {
    it('includes sdkVersion, nodeVersion, os, and timestamp after track()', async () => {
      const captured: unknown[] = [];
      Telemetry._fetchImpl = jest.fn(async (_url: string, init: RequestInit): Promise<Response> => {
        const body = JSON.parse(init.body as string) as { events: unknown[] };
        captured.push(...body.events);
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plugin_load', pluginId: 'test-plugin' });
      await Telemetry.flush();

      expect(captured.length).toBeGreaterThanOrEqual(1);
      const evt = captured[0] as Record<string, unknown>;
      expect(typeof evt['sdkVersion']).toBe('string');
      expect(typeof evt['nodeVersion']).toBe('string');
      expect(typeof evt['os']).toBe('string');
      expect(typeof evt['timestamp']).toBe('string');
    });

    it('captured event has correct type and pluginId fields', async () => {
      const captured: unknown[] = [];
      Telemetry._fetchImpl = jest.fn(async (_url: string, init: RequestInit): Promise<Response> => {
        const body = JSON.parse(init.body as string) as { events: unknown[] };
        captured.push(...body.events);
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plugin_unload', pluginId: 'p1' });
      await Telemetry.flush();

      expect(captured.length).toBeGreaterThanOrEqual(1);
      const evt = captured[0] as Record<string, unknown>;
      expect(evt['type']).toBe('plugin_unload');
      expect(evt['pluginId']).toBe('p1');
      expect(typeof evt['sdkVersion']).toBe('string');
      expect(typeof evt['nodeVersion']).toBe('string');
      expect(typeof evt['os']).toBe('string');
      expect(typeof evt['timestamp']).toBe('string');
    });

    it('timestamp is a valid ISO 8601 string', async () => {
      const captured: Record<string, unknown>[] = [];
      Telemetry._fetchImpl = jest.fn(async (_url: string, init: RequestInit): Promise<Response> => {
        const body = JSON.parse(init.body as string) as { events: Record<string, unknown>[] };
        captured.push(...body.events);
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plan_complete', durationMs: 100 });
      await Telemetry.flush();

      expect(captured.length).toBeGreaterThan(0);
      const ts = captured[0]['timestamp'] as string;
      expect(typeof ts).toBe('string');
      expect(new Date(ts).toISOString()).toBe(ts);
    });

    it('nodeVersion matches process.version', async () => {
      const captured: Record<string, unknown>[] = [];
      Telemetry._fetchImpl = jest.fn(async (_url: string, init: RequestInit): Promise<Response> => {
        const body = JSON.parse(init.body as string) as { events: Record<string, unknown>[] };
        captured.push(...body.events);
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plan_fail', errorCode: 'TIMEOUT' });
      await Telemetry.flush();

      expect(captured.length).toBeGreaterThan(0);
      expect(captured[0]['nodeVersion']).toBe(process.version);
    });

    it('optional fields (pluginId, durationMs, errorCode) are present when provided', async () => {
      const captured: Record<string, unknown>[] = [];
      Telemetry._fetchImpl = jest.fn(async (_url: string, init: RequestInit): Promise<Response> => {
        const body = JSON.parse(init.body as string) as { events: Record<string, unknown>[] };
        captured.push(...body.events);
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plugin_error', pluginId: 'bad-plugin', durationMs: 10, errorCode: 'ERR_INIT' });
      await Telemetry.flush();

      expect(captured.length).toBeGreaterThan(0);
      expect(captured[0]['pluginId']).toBe('bad-plugin');
      expect(captured[0]['durationMs']).toBe(10);
      expect(captured[0]['errorCode']).toBe('ERR_INIT');
    });
  });

  // ── flush() ───────────────────────────────────────────────────────────

  describe('flush()', () => {
    it('does nothing when telemetry is disabled', async () => {
      Telemetry.optOut();
      await Telemetry.flush();
      expect(noopFetch).not.toHaveBeenCalled();
    });

    it('does nothing when the queue is empty', async () => {
      expect(Telemetry._queueLength()).toBe(0);
      await Telemetry.flush();
      expect(noopFetch).not.toHaveBeenCalled();
    });

    it('sends a POST request with the queued events', async () => {
      const bodies: string[] = [];
      Telemetry._fetchImpl = jest.fn(async (_url: string, init: RequestInit): Promise<Response> => {
        bodies.push(init.body as string);
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plugin_load', pluginId: 'my-plugin' });
      await Telemetry.flush();

      expect(bodies.length).toBe(1);
      const payload = JSON.parse(bodies[0]) as { events: unknown[] };
      expect(Array.isArray(payload.events)).toBe(true);
      expect(payload.events.length).toBeGreaterThan(0);
    });

    it('clears the queue after a successful flush', async () => {
      Telemetry.track({ type: 'plugin_load', pluginId: 'x' });
      expect(Telemetry._queueLength()).toBe(1);

      await Telemetry.flush();
      expect(Telemetry._queueLength()).toBe(0);
    });

    it('clears the queue even when the fetch throws (fail-silent)', async () => {
      Telemetry._fetchImpl = jest.fn(async (): Promise<Response> => {
        throw new Error('Network error');
      });

      Telemetry.track({ type: 'plugin_error', errorCode: 'NET' });
      // Should not throw.
      await expect(Telemetry.flush()).resolves.toBeUndefined();
      expect(Telemetry._queueLength()).toBe(0);
    });

    it('does not double-flush while already flushing', async () => {
      let resolveFirst!: () => void;
      let fetchCallCount = 0;

      Telemetry._fetchImpl = jest.fn(async (): Promise<Response> => {
        fetchCallCount++;
        await new Promise<void>((res) => {
          resolveFirst = res;
        });
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plugin_load', pluginId: 'concurrent' });

      const p1 = Telemetry.flush(); // starts flushing, sets _flushing = true

      // Spin a microtask tick so the mock has started executing and
      // resolveFirst has been assigned.
      await Promise.resolve();

      const p2 = Telemetry.flush(); // should be a no-op because _flushing = true

      resolveFirst();
      await Promise.all([p1, p2]);

      expect(fetchCallCount).toBe(1);
    });

    it('sends a POST with Content-Type: application/json', async () => {
      let capturedHeaders: HeadersInit | undefined;
      Telemetry._fetchImpl = jest.fn(async (_url: string, init: RequestInit): Promise<Response> => {
        capturedHeaders = init.headers;
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plan_run' });
      await Telemetry.flush();

      expect(capturedHeaders).toBeDefined();
      expect((capturedHeaders as Record<string, string>)['Content-Type']).toBe('application/json');
    });

    it('posts to the telemetry endpoint URL', async () => {
      const urls: string[] = [];
      Telemetry._fetchImpl = jest.fn(async (url: string): Promise<Response> => {
        urls.push(url);
        return new Response('{}', { status: 200 });
      });

      Telemetry.track({ type: 'plan_run' });
      await Telemetry.flush();

      expect(urls.length).toBe(1);
      expect(urls[0]).toContain('telemetry.x-skynet.dev');
    });
  });

  // ── optOut() ──────────────────────────────────────────────────────────

  describe('optOut()', () => {
    it('disables telemetry in-process', () => {
      Telemetry.optOut();
      expect(Telemetry.isEnabled()).toBe(false);
    });

    it('drains any previously queued events on optOut()', () => {
      Telemetry.track({ type: 'plugin_load' });
      expect(Telemetry._queueLength()).toBe(1);
      Telemetry.optOut();
      expect(Telemetry._queueLength()).toBe(0);
    });

    it('subsequent track() calls after optOut() are ignored', () => {
      Telemetry.optOut();
      Telemetry.track({ type: 'plugin_load' });
      Telemetry.track({ type: 'plan_run' });
      expect(Telemetry._queueLength()).toBe(0);
    });
  });

  // ── env-var code path ─────────────────────────────────────────────────

  describe('XSKYNET_NO_TELEMETRY env var', () => {
    it('isEnabled() returns false when disabled via optOut (mirrors env-var behaviour)', () => {
      Telemetry.optOut();
      expect(Telemetry.isEnabled()).toBe(false);
    });

    it('track() is a no-op when disabled (XSKYNET_NO_TELEMETRY=1 contract)', () => {
      Telemetry.optOut();
      Telemetry.track({ type: 'plugin_load' });
      expect(Telemetry._queueLength()).toBe(0);
    });

    it('flush() does not call fetch when disabled (XSKYNET_NO_TELEMETRY=1 contract)', async () => {
      Telemetry.optOut();
      await Telemetry.flush();
      expect(noopFetch).not.toHaveBeenCalled();
    });

    it('module initialises with telemetry enabled in the test environment', () => {
      // The test runner does not set XSKYNET_NO_TELEMETRY=1, so after _optIn
      // (called in beforeEach) the module is in the enabled state.
      expect(Telemetry.isEnabled()).toBe(true);
    });
  });
});
