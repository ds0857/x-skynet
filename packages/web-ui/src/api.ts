import type { IncomingMessage, ServerResponse } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  readAgentState,
  readRuns,
  readQueue,
} from './state-reader.js';

// Static directory — set by index.ts before first request
let _staticDir = '';

/** Configure where static files are served from. */
export function setStaticDir(dir: string): void {
  _staticDir = dir;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  status: 'healthy' | 'degraded' | 'offline';
  lastHeartbeat: string;
}

export interface Run {
  id: string;
  status: 'success' | 'running' | 'failed' | 'pending';
  steps: number;
  startedAt: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'pending' | 'in-progress' | 'done' | 'failed';
}

export function getMockAgents(): Agent[] {
  return [
    { id: 'minion',   status: 'healthy',  lastHeartbeat: new Date(Date.now() -  30_000).toISOString() },
    { id: 'sage',     status: 'healthy',  lastHeartbeat: new Date(Date.now() -  45_000).toISOString() },
    { id: 'scout',    status: 'degraded', lastHeartbeat: new Date(Date.now() - 300_000).toISOString() },
    { id: 'quill',    status: 'healthy',  lastHeartbeat: new Date(Date.now() -  60_000).toISOString() },
    { id: 'xalt',     status: 'offline',  lastHeartbeat: new Date(Date.now() - 900_000).toISOString() },
    { id: 'observer', status: 'healthy',  lastHeartbeat: new Date(Date.now() -  20_000).toISOString() },
  ];
}

export function getMockRuns(): Run[] {
  const statuses: Run['status'][] = [
    'success', 'success', 'failed', 'running', 'success',
    'pending', 'success', 'failed', 'success', 'success',
  ];
  return statuses.map((status, i) => ({
    id: `run-${String(i + 1).padStart(3, '0')}`,
    status,
    steps: (i % 7) + 2,
    startedAt: new Date(Date.now() - i * 600_000).toISOString(),
  }));
}

export function getMockTasks(): Task[] {
  return [
    { id: 'T-001', title: 'Implement P4-03 Web UI',      assignee: 'nova',     status: 'in-progress' },
    { id: 'T-002', title: 'Fix DAG cycle detection',     assignee: 'minion',   status: 'done'        },
    { id: 'T-003', title: 'Write SDK docs',              assignee: 'quill',    status: 'pending'     },
    { id: 'T-004', title: 'Add Telegram plugin tests',   assignee: 'observer', status: 'pending'     },
    { id: 'T-005', title: 'Plugin interface refactor',   assignee: 'sage',     status: 'done'        },
    { id: 'T-006', title: 'Memory plugin research',      assignee: 'scout',    status: 'failed'      },
  ];
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function json(res: ServerResponse, data: unknown, status = 200): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function handleAgents(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const state = await readAgentState();
  if (state.agents.length > 0) {
    json(res, state.agents);
  } else {
    json(res, getMockAgents());
  }
}

export async function handleRuns(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const runs = await readRuns();
  if (runs.length > 0) {
    json(res, runs);
  } else {
    json(res, getMockRuns());
  }
}

export async function handleTasks(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const queue = await readQueue();
  if (queue.length > 0) {
    json(res, queue);
  } else {
    json(res, getMockTasks());
  }
}

export function handleStatic(_req: IncomingMessage, res: ServerResponse): void {
  if (!_staticDir) {
    res.writeHead(503);
    res.end('Static directory not configured');
    return;
  }
  try {
    const html = readFileSync(join(_staticDir, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

export function handleStaticJs(_req: IncomingMessage, res: ServerResponse): void {
  if (!_staticDir) {
    res.writeHead(503);
    res.end('Static directory not configured');
    return;
  }
  try {
    const js = readFileSync(join(_staticDir, 'app.js'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(js);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

// ── Main router ───────────────────────────────────────────────────────────────

export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  if (method !== 'GET') {
    json(res, { error: 'Method Not Allowed' }, 405);
    return;
  }

  switch (url) {
    case '/':
    case '/index.html':
      handleStatic(req, res);
      break;
    case '/app.js':
      handleStaticJs(req, res);
      break;
    case '/api/agents':
      await handleAgents(req, res);
      break;
    case '/api/runs':
      await handleRuns(req, res);
      break;
    case '/api/tasks':
      await handleTasks(req, res);
      break;
    default:
      json(res, { error: 'Not Found' }, 404);
  }
}
