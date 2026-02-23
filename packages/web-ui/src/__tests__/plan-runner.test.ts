import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { handleRequest } from '../api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockReq(url: string, method: string, body?: string): Partial<IncomingMessage> {
  const req: Partial<IncomingMessage> & { _body: string } = {
    url,
    method,
    _body: body ?? '',
    on(event: string, handler: (...args: unknown[]) => void) {
      if (event === 'data' && this._body) handler(Buffer.from(this._body));
      if (event === 'end') handler();
      return this as unknown as IncomingMessage;
    },
  } as Partial<IncomingMessage> & { _body: string };
  return req;
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
    writeHead(code, headers = {}) { this.statusCode = code; Object.assign(this.headers, headers); },
    end(data = '') { this.body = data; },
  };
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/plans', () => {
  it('returns 400 when body is not valid JSON', async () => {
    const req = makeMockReq('/api/plans', 'POST', 'not-json');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error');
  });

  it('returns 400 when plan is missing id', async () => {
    const req = makeMockReq('/api/plans', 'POST', JSON.stringify({ tasks: [] }));
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when plan is missing tasks', async () => {
    const req = makeMockReq('/api/plans', 'POST', JSON.stringify({ id: 'p1' }));
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(400);
  });

  it('executes a minimal plan and returns PlanExecutionResult', async () => {
    const plan = {
      id: `test-plan-${Date.now()}`,
      title: 'Test Plan',
      status: 'draft',
      createdAt: new Date().toISOString(),
      tasks: [
        {
          id: 'task-1',
          name: 'echo task',
          status: 'idle',
          createdAt: new Date().toISOString(),
          steps: [
            {
              id: 'step-1',
              name: 'echo hello',
              status: 'idle',
              createdAt: new Date().toISOString(),
              tags: ['kind:echo'],
              metadata: { message: 'hello from test' },
            },
          ],
        },
      ],
    };

    const req = makeMockReq('/api/plans', 'POST', JSON.stringify(plan));
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result).toHaveProperty('planId', plan.id);
    expect(result).toHaveProperty('status', 'succeeded');
    expect(result).toHaveProperty('accepted', true);
    expect(result).toHaveProperty('durationMs');
    expect(typeof result.durationMs).toBe('number');
  });
});

describe('GET /api/plans', () => {
  it('returns an array', async () => {
    const req = makeMockReq('/api/plans', 'GET');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(JSON.parse(res.body))).toBe(true);
  });
});

describe('GET /api/plans/:id', () => {
  it('returns 404 for unknown plan', async () => {
    const req = makeMockReq('/api/plans/nonexistent-plan-xyz', 'GET');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(404);
  });

  it('returns stored plan after execution', async () => {
    // First submit a plan
    const planId = `stored-plan-${Date.now()}`;
    const plan = {
      id: planId,
      title: 'Stored Plan',
      status: 'draft',
      createdAt: new Date().toISOString(),
      tasks: [
        {
          id: 'task-s1',
          name: 'echo task',
          status: 'idle',
          createdAt: new Date().toISOString(),
          steps: [
            {
              id: 'step-s1',
              name: 'echo storage test',
              status: 'idle',
              createdAt: new Date().toISOString(),
              tags: ['kind:echo'],
              metadata: { message: 'storage test' },
            },
          ],
        },
      ],
    };

    const postReq = makeMockReq('/api/plans', 'POST', JSON.stringify(plan));
    const postRes = makeMockRes();
    await handleRequest(postReq as IncomingMessage, postRes as unknown as ServerResponse);
    expect(postRes.statusCode).toBe(200);

    // Then retrieve it
    const getReq = makeMockReq(`/api/plans/${planId}`, 'GET');
    const getRes = makeMockRes();
    await handleRequest(getReq as IncomingMessage, getRes as unknown as ServerResponse);
    expect(getRes.statusCode).toBe(200);
    const stored = JSON.parse(getRes.body);
    expect(stored.planId).toBe(planId);
    expect(stored.status).toBe('succeeded');
  });
});

describe('plan route method validation', () => {
  it('returns 405 for DELETE /api/plans', async () => {
    const req = makeMockReq('/api/plans', 'DELETE');
    const res = makeMockRes();
    await handleRequest(req as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(405);
  });
});
