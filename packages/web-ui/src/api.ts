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

/**
 * Development fallback data — returned only when no real state file exists.
 * Uses generic names so framework users don't see project-internal agent names.
 * @internal
 */
export function getMockAgents(): Agent[] {
  return [
    { id: 'agent-1', status: 'healthy',  lastHeartbeat: new Date(Date.now() -  30_000).toISOString() },
    { id: 'agent-2', status: 'healthy',  lastHeartbeat: new Date(Date.now() -  45_000).toISOString() },
    { id: 'agent-3', status: 'degraded', lastHeartbeat: new Date(Date.now() - 300_000).toISOString() },
  ];
}

/** @internal */
export function getMockRuns(): Run[] {
  const statuses: Run['status'][] = ['success', 'success', 'failed', 'running', 'success'];
  return statuses.map((status, i) => ({
    id: `run-${String(i + 1).padStart(3, '0')}`,
    status,
    steps: (i % 5) + 2,
    startedAt: new Date(Date.now() - i * 600_000).toISOString(),
  }));
}

/** @internal */
export function getMockTasks(): Task[] {
  return [
    { id: 'T-001', title: 'Example task A', assignee: 'agent-1', status: 'in-progress' },
    { id: 'T-002', title: 'Example task B', assignee: 'agent-2', status: 'pending'     },
    { id: 'T-003', title: 'Example task C', assignee: 'agent-3', status: 'done'        },
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
    // Normalise AgentRecord → Agent: ensure lastHeartbeat is always a string
    const agents: Agent[] = state.agents.map(a => ({
      id: a.id,
      status: a.status,
      lastHeartbeat: a.lastHeartbeat ?? new Date().toISOString(),
    }));
    json(res, agents);
  } else {
    json(res, getMockAgents());
  }
}

export async function handleRuns(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const runs = await readRuns();
  if (runs.length > 0) {
    // Normalise RunRecord → Run shape
    const mapped: Run[] = runs.map(r => ({
      id: r.taskId,
      status: r.success ? 'success' : 'failed',
      steps: 1,
      startedAt: r.completedAt,
    } as Run));
    json(res, mapped);
  } else {
    json(res, getMockRuns());
  }
}

export async function handleTasks(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const queue = await readQueue();
  if (queue.length > 0) {
    // Normalise QueueRecord → Task shape
    const tasks: Task[] = queue.map(q => ({
      id: q.id,
      title: q.type,
      assignee: 'system',
      status: 'pending',
    }));
    json(res, tasks);
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
