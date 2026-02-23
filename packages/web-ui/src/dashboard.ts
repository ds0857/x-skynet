/**
 * dashboard.ts — WebSocket push server for real-time updates.
 *
 * Uses a simple hand-rolled WebSocket implementation on top of Node.js
 * built-in `http` so we have zero runtime dependencies.
 */

import type { IncomingMessage } from 'http';
import { createHash } from 'crypto';
import type { Duplex } from 'stream';
import { getMockAgents, getMockRuns, getMockTasks } from './api.js';

const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/** Encode a single text frame (opcode 0x1). */
function encodeTextFrame(text: string): Buffer {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header: Buffer;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text opcode
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    // For simplicity only handle up to 32-bit payload length
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(len, 6);
  }
  return Buffer.concat([header, payload]);
}

/** Send a ping frame. */
function sendPing(socket: Duplex): void {
  const ping = Buffer.alloc(2);
  ping[0] = 0x89; // FIN + ping
  ping[1] = 0;
  socket.write(ping);
}

export interface DashboardSnapshot {
  type: 'snapshot';
  agents: ReturnType<typeof getMockAgents>;
  runs: ReturnType<typeof getMockRuns>;
  tasks: ReturnType<typeof getMockTasks>;
  ts: string;
}

function buildSnapshot(): DashboardSnapshot {
  return {
    type: 'snapshot',
    agents: getMockAgents(),
    runs: getMockRuns(),
    tasks: getMockTasks(),
    ts: new Date().toISOString(),
  };
}

const clients = new Set<Duplex>();

/** Broadcast a snapshot to all connected WebSocket clients. */
export function broadcast(): void {
  if (clients.size === 0) return;
  const frame = encodeTextFrame(JSON.stringify(buildSnapshot()));
  for (const socket of clients) {
    try {
      socket.write(frame);
    } catch {
      clients.delete(socket);
    }
  }
}

/**
 * Perform the WebSocket upgrade handshake and register the socket.
 * Call this from the HTTP server's `upgrade` event handler.
 */
export function handleUpgrade(req: IncomingMessage, socket: Duplex, _head: Buffer): void {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = createHash('sha1')
    .update(key + WS_MAGIC)
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  clients.add(socket);

  // Send initial snapshot immediately
  try {
    socket.write(encodeTextFrame(JSON.stringify(buildSnapshot())));
  } catch { /* ignore */ }

  socket.on('error', () => clients.delete(socket));
  socket.on('close', () => clients.delete(socket));
  socket.on('end', () => clients.delete(socket));

  // Keepalive ping every 25 s
  const pingTimer = setInterval(() => {
    if (socket.destroyed) {
      clearInterval(pingTimer);
      clients.delete(socket);
    } else {
      sendPing(socket);
    }
  }, 25_000);
  pingTimer.unref();
}

/** Start auto-broadcasting a snapshot every `intervalMs` milliseconds. */
export function startBroadcastLoop(intervalMs = 5_000): NodeJS.Timeout {
  const timer = setInterval(broadcast, intervalMs);
  timer.unref();
  return timer;
}
