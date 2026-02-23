import { describe, it, expect, beforeEach } from '@jest/globals';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  getMockAgents,
  getMockRuns,
  getMockTasks,
  handleAgents,
  handleRuns,
  handleTasks,
  handleRequest,
} from '../api.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockReq(url = '/', method = 'GET'): Partial<IncomingMessage> {
  return { url, method };
}

interface MockRes {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  writeHead: (code: number, headers?: Record<string, string>) => void;
  end: (data?: string) => void;
}

function makeMockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(code, headers = {}) {
      this.statusCode = code;
      Object.assign(this.headers, headers);
    },
    end(data = '') {
      this.body = data;
    },
  };
  return res;
}

// ── Mock data unit tests ──────────────────────────────────────────────────────

describe('getMockAgents', () => {
  it('returns a non-empty array of agents', () => {
    const agents = getMockAgents();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it('each agent has id, status, and lastHeartbeat fields', () => {
    const agents = getMockAgents();
    for (const agent of agents) {
      expect(typeof agent.id).toBe('string');
      expect(['healthy', 'degraded', 'offline']).toContain(agent.status);
      expect(typeof agent.lastHeartbeat).toBe('string');
      // Validate ISO 8601
      expect(isNaN(Date.parse(agent.lastHeartbeat))).toBe(false);
    }
  });
});

describe('getMockRuns', () => {
  it('returns exactly 10 runs', () => {
    const runs = getMockRuns();
    expect(runs).toHaveLength(10);
  });

  it('each run has id, status, steps, and startedAt fields', () => {
    const runs = getMockRuns();
    for (const run of runs) {
      expect(typeof run.id).toBe('string');
      expect(['success', 'running', 'failed', 'pending']).toContain(run.status);
      expect(typeof run.steps).toBe('number');
      expect(run.steps).toBeGreaterThanOrEqual(1);
      expect(isNaN(Date.parse(run.startedAt))).toBe(false);
    }
  });
});

describe('getMockTasks', () => {
  it('returns a non-empty array of tasks', () => {
    const tasks = getMockTasks();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('each task has id, title, assignee, and status fields', () => {
    const tasks = getMockTasks();
    for (const task of tasks) {
      expect(typeof task.id).toBe('string');
      expect(typeof task.title).toBe('string');
      expect(typeof task.assignee).toBe('string');
      expect(['pending', 'in-progress', 'done', 'failed']).toContain(task.status);
    }
  });
});

// ── Handler tests ─────────────────────────────────────────────────────────────

describe('handleAgents', () => {
  let res: MockRes;

  beforeEach(() => { res = makeMockRes(); });

  it('responds with 200 and JSON content-type', async () => {
    await handleAgents(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('body is a valid JSON array', async () => {
    await handleAgents(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
  });
});

describe('handleRuns', () => {
  let res: MockRes;

  beforeEach(() => { res = makeMockRes(); });

  it('responds with 200 and JSON content-type', async () => {
    await handleRuns(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('body is a valid JSON array with 10 entries', async () => {
    await handleRuns(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(10);
  });
});

describe('handleTasks', () => {
  let res: MockRes;

  beforeEach(() => { res = makeMockRes(); });

  it('responds with 200 and JSON content-type', async () => {
    await handleTasks(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('body is a valid JSON array', async () => {
    await handleTasks(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
  });
});

// ── Router tests ──────────────────────────────────────────────────────────────

describe('handleRequest router', () => {
  it('routes GET /api/agents to agents data', async () => {
    const req = makeMockReq('/api/agents');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('status');
  });

  it('routes GET /api/runs to runs data', async () => {
    const req = makeMockReq('/api/runs');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(10);
  });

  it('routes GET /api/tasks to tasks data', async () => {
    const req = makeMockReq('/api/tasks');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it('returns 404 for unknown routes', async () => {
    const req = makeMockReq('/unknown-route');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(404);
  });

  it('returns 405 for non-GET methods', async () => {
    const req = makeMockReq('/api/agents', 'POST');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(405);
  });

  it('CORS header is present on API responses', async () => {
    const req = makeMockReq('/api/agents');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
