/**
 * Additional api.ts tests — static file handlers and setStaticDir
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import type { IncomingMessage, ServerResponse } from 'http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import {
  setStaticDir,
  handleStatic,
  handleStaticJs,
  handleRequest,
  json,
} from '../api.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

interface MockRes {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  writeHead(code: number, headers?: Record<string, string>): void;
  end(data?: string): void;
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

function makeMockReq(url = '/', method = 'GET'): Partial<IncomingMessage> {
  return { url, method };
}

// ── Static directory fixture ───────────────────────────────────────────────────

let staticDir: string;

beforeAll(async () => {
  staticDir = join(tmpdir(), `xskynet-web-static-${Date.now()}`);
  await mkdir(staticDir, { recursive: true });
  await writeFile(join(staticDir, 'index.html'), '<html><body>X-Skynet</body></html>', 'utf8');
  await writeFile(join(staticDir, 'app.js'), 'console.log("app");', 'utf8');
});

afterAll(async () => {
  await rm(staticDir, { recursive: true, force: true });
  // Reset static dir to empty to avoid polluting other tests
  setStaticDir('');
});

// ── json() helper ─────────────────────────────────────────────────────────────

describe('json()', () => {
  it('sets status 200 by default', () => {
    const res = makeMockRes();
    json(res as unknown as ServerResponse, { ok: true });
    expect(res.statusCode).toBe(200);
  });

  it('sets Content-Type: application/json', () => {
    const res = makeMockRes();
    json(res as unknown as ServerResponse, {});
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('sets CORS header', () => {
    const res = makeMockRes();
    json(res as unknown as ServerResponse, {});
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('serialises the body', () => {
    const res = makeMockRes();
    json(res as unknown as ServerResponse, { x: 42 });
    expect(JSON.parse(res.body)).toEqual({ x: 42 });
  });

  it('accepts a custom status code', () => {
    const res = makeMockRes();
    json(res as unknown as ServerResponse, { error: 'Not Found' }, 404);
    expect(res.statusCode).toBe(404);
  });
});

// ── handleStatic() ────────────────────────────────────────────────────────────

describe('handleStatic()', () => {
  it('returns 503 when staticDir is not configured', () => {
    setStaticDir('');
    const res = makeMockRes();
    handleStatic(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(503);
  });

  it('returns 200 and HTML when staticDir is configured', () => {
    setStaticDir(staticDir);
    const res = makeMockRes();
    handleStatic(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/html');
    expect(res.body).toContain('X-Skynet');
  });

  it('returns 500 when index.html does not exist', () => {
    setStaticDir(join(tmpdir(), 'nonexistent-dir-xyz'));
    const res = makeMockRes();
    handleStatic(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(500);
    setStaticDir(staticDir); // restore
  });
});

// ── handleStaticJs() ──────────────────────────────────────────────────────────

describe('handleStaticJs()', () => {
  it('returns 503 when staticDir is not configured', () => {
    setStaticDir('');
    const res = makeMockRes();
    handleStaticJs(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(503);
  });

  it('returns 200 and JS content-type when staticDir is configured', () => {
    setStaticDir(staticDir);
    const res = makeMockRes();
    handleStaticJs(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('application/javascript');
  });

  it('returns 500 when app.js does not exist', () => {
    setStaticDir(join(tmpdir(), 'nonexistent-dir-xyz'));
    const res = makeMockRes();
    handleStaticJs(makeMockReq() as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(500);
    setStaticDir(staticDir); // restore
  });
});

// ── handleRequest routing for static pages ────────────────────────────────────

describe('handleRequest — static routes', () => {
  beforeAll(() => {
    setStaticDir(staticDir);
  });

  it('routes GET / to handleStatic', () => {
    const res = makeMockRes();
    handleRequest(makeMockReq('/') as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/html');
  });

  it('routes GET /index.html to handleStatic', () => {
    const res = makeMockRes();
    handleRequest(makeMockReq('/index.html') as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
  });

  it('routes GET /app.js to handleStaticJs', () => {
    const res = makeMockRes();
    handleRequest(makeMockReq('/app.js') as IncomingMessage, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('application/javascript');
  });

  it('handles null url gracefully (defaults to /)', () => {
    const res = makeMockRes();
    const req = { url: undefined, method: 'GET' } as unknown as IncomingMessage;
    // url defaults to '/' in handleRequest — should call handleStatic
    handleRequest(req, res as unknown as ServerResponse);
    expect([200, 500, 503]).toContain(res.statusCode);
  });

  it('handles null method gracefully (defaults to GET)', () => {
    const res = makeMockRes();
    const req = { url: '/api/agents', method: undefined } as unknown as IncomingMessage;
    handleRequest(req, res as unknown as ServerResponse);
    expect(res.statusCode).toBe(200);
  });
});
