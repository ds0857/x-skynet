/**
 * index.ts — HTTP server entry point for the X-Skynet Web UI.
 *
 * Uses only Node.js built-in modules (http, crypto, fs, path).
 * Start: node dist/index.js  (or: tsx src/index.ts)
 */

import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { handleRequest, setStaticDir } from './api.js';
import { handleUpgrade, startBroadcastLoop } from './dashboard.js';

// Resolve static dir relative to this file (works after build too)
const __dirname = dirname(fileURLToPath(import.meta.url));
setStaticDir(join(__dirname, 'static'));

const PORT = Number(process.env.PORT ?? 3900);

const server = createServer(handleRequest);

// WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    handleUpgrade(req, socket as import('stream').Duplex, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`[web-ui] HTTP server listening on http://localhost:${PORT}`);
  console.log(`[web-ui] WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

// Push real-time snapshots every 5 s
startBroadcastLoop(5_000);

export { server };
