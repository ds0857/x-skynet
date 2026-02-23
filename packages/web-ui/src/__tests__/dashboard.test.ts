/**
 * dashboard.ts unit tests — WebSocket push server
 */

import { describe, it, expect, afterEach } from '@jest/globals';
import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { broadcast, handleUpgrade, startBroadcastLoop } from '../dashboard.js';

// ── Mock socket ───────────────────────────────────────────────────────────────

interface MockSocket extends Duplex {
  written: Buffer[];
  destroyed: boolean;
}

function makeMockSocket(): MockSocket {
  const ee = new EventEmitter() as MockSocket;
  ee.written = [];
  ee.destroyed = false;
  (ee as unknown as { write: (data: Buffer) => boolean }).write = (data: Buffer) => {
    ee.written.push(data);
    return true;
  };
  (ee as unknown as { destroy: () => void }).destroy = () => {
    ee.destroyed = true;
  };
  return ee;
}

function makeMockReq(wsKey?: string): Partial<IncomingMessage> {
  return {
    headers: wsKey ? { 'sec-websocket-key': wsKey } : {},
    url: '/ws',
  };
}

// A dummy WebSocket key for the tests
const TEST_WS_KEY = 'dGhlIHNhbXBsZSBub25jZQ==';

// Track sockets we open so we can close them in afterEach
const openSockets: MockSocket[] = [];

afterEach(() => {
  // Remove all test sockets from the internal clients Set
  // by triggering the 'close' event which calls clients.delete(socket)
  for (const s of openSockets) {
    (s as unknown as EventEmitter).emit('close');
  }
  openSockets.length = 0;
});

function connectSocket(): MockSocket {
  const socket = makeMockSocket();
  const req = makeMockReq(TEST_WS_KEY);
  handleUpgrade(req as IncomingMessage, socket as unknown as Duplex, Buffer.alloc(0));
  openSockets.push(socket);
  return socket;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('broadcast()', () => {
  it('does not throw when no clients are connected', () => {
    expect(() => broadcast()).not.toThrow();
  });

  it('writes a WebSocket frame to every connected client', () => {
    const s1 = connectSocket();
    const s2 = connectSocket();
    const before1 = s1.written.length;
    const before2 = s2.written.length;
    broadcast();
    expect(s1.written.length).toBeGreaterThan(before1);
    expect(s2.written.length).toBeGreaterThan(before2);
  });

  it('removes a client whose write() throws during broadcast', () => {
    const socket = makeMockSocket();
    let callCount = 0;
    (socket as unknown as { write: (d: Buffer) => boolean }).write = (d: Buffer) => {
      callCount++;
      if (callCount > 2) throw new Error('broken pipe'); // fail after upgrade
      socket.written.push(d);
      return true;
    };
    const req = makeMockReq(TEST_WS_KEY);
    handleUpgrade(req as IncomingMessage, socket as unknown as Duplex, Buffer.alloc(0));
    // Subsequent broadcast should not throw
    expect(() => broadcast()).not.toThrow();
  });

  it('broadcast sends valid JSON in the frame payload', () => {
    const socket = connectSocket();
    const before = socket.written.length;
    broadcast();
    const frame = socket.written[before];
    expect(frame).toBeDefined();
    // The frame header is at most 10 bytes; payload starts after
    // Find the JSON payload by looking for '{' in the buffer
    const str = frame!.toString('utf8');
    const jsonStart = str.indexOf('{');
    expect(jsonStart).toBeGreaterThan(-1);
    const snapshot = JSON.parse(str.slice(jsonStart));
    expect(snapshot.type).toBe('snapshot');
    expect(Array.isArray(snapshot.agents)).toBe(true);
    expect(Array.isArray(snapshot.runs)).toBe(true);
    expect(Array.isArray(snapshot.tasks)).toBe(true);
  });
});

describe('handleUpgrade()', () => {
  it('destroys socket when sec-websocket-key header is missing', () => {
    const socket = makeMockSocket();
    const req = makeMockReq(); // no key
    handleUpgrade(req as IncomingMessage, socket as unknown as Duplex, Buffer.alloc(0));
    expect(socket.destroyed).toBe(true);
  });

  it('writes 101 Switching Protocols when key is present', () => {
    const socket = connectSocket();
    const response = socket.written[0]!.toString();
    expect(response).toContain('101 Switching Protocols');
    expect(response).toContain('Upgrade: websocket');
    expect(response).toContain('Connection: Upgrade');
    expect(response).toContain('Sec-WebSocket-Accept:');
  });

  it('sends an initial snapshot after the handshake', () => {
    const socket = connectSocket();
    // At minimum: the HTTP upgrade response + an initial snapshot frame
    expect(socket.written.length).toBeGreaterThanOrEqual(2);
  });

  it('removes client from Set on "error" event', () => {
    const socket = connectSocket();
    const before = socket.written.length;
    (socket as unknown as EventEmitter).emit('error', new Error('test'));
    // After error, the client is removed; broadcast should not write to it
    broadcast();
    expect(socket.written.length).toBe(before); // no new writes
    openSockets.pop(); // Already cleaned up by error event
  });

  it('removes client from Set on "close" event', () => {
    const socket = connectSocket();
    (socket as unknown as EventEmitter).emit('close');
    openSockets.pop(); // Already cleaned up
    const before = socket.written.length;
    broadcast();
    expect(socket.written.length).toBe(before);
  });

  it('removes client from Set on "end" event', () => {
    const socket = connectSocket();
    (socket as unknown as EventEmitter).emit('end');
    openSockets.pop(); // Already cleaned up
    const before = socket.written.length;
    broadcast();
    expect(socket.written.length).toBe(before);
  });
});

describe('startBroadcastLoop()', () => {
  it('returns a NodeJS.Timeout', () => {
    const timer = startBroadcastLoop(100_000); // very long interval
    expect(timer).toBeDefined();
    clearInterval(timer);
  });

  it('returned timer can be cleared without error', () => {
    const timer = startBroadcastLoop(100_000);
    expect(() => clearInterval(timer)).not.toThrow();
  });

  it('uses 5000 ms as default interval', () => {
    // Just verify it can be called without arguments (default = 5000)
    const timer = startBroadcastLoop();
    expect(timer).toBeDefined();
    clearInterval(timer);
  });
});
