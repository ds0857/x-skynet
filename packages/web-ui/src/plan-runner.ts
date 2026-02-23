/**
 * plan-runner.ts
 *
 * Bridges the HTTP API layer to the XSkynetRuntime execution engine.
 * Handles plan submission, execution, result persistence, and retrieval.
 *
 * This is the key integration point that connects:
 *   HTTP client (SDK) → PlanRunner → XSkynetRuntime → Plugins → Results
 */

import type { IncomingMessage, ServerResponse } from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { XSkynetRuntime, AcceptanceGate } from '@xskynet/core';
import { shellPlugin } from '@xskynet/plugin-shell';
import type { Plan, PlanStatus } from '@xskynet/contracts';
import { json } from './api.js';

// ── Storage ───────────────────────────────────────────────────────────────────

const STATE_DIR = path.join(os.homedir(), '.xskynet');
const PLANS_DIR = path.join(STATE_DIR, 'plans');

async function ensureDirs(): Promise<void> {
  await fs.mkdir(PLANS_DIR, { recursive: true });
}

/** Persist a plan result to ~/.xskynet/plans/{id}.json */
async function savePlanResult(planId: string, result: PlanExecutionResult): Promise<void> {
  await ensureDirs();
  await fs.writeFile(
    path.join(PLANS_DIR, `${planId}.json`),
    JSON.stringify(result, null, 2),
  );
}

/** Read a stored plan result. Returns null if not found. */
async function loadPlanResult(planId: string): Promise<PlanExecutionResult | null> {
  try {
    const raw = await fs.readFile(path.join(PLANS_DIR, `${planId}.json`), 'utf-8');
    return JSON.parse(raw) as PlanExecutionResult;
  } catch {
    return null;
  }
}

/** List recent plan results (newest first, up to limit). */
async function listPlanResults(limit = 20): Promise<PlanExecutionResult[]> {
  try {
    await ensureDirs();
    const files = await fs.readdir(PLANS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json')).slice(-limit);
    const results: PlanExecutionResult[] = [];
    for (const f of jsonFiles) {
      try {
        const raw = await fs.readFile(path.join(PLANS_DIR, f), 'utf-8');
        results.push(JSON.parse(raw) as PlanExecutionResult);
      } catch { /* skip corrupt */ }
    }
    return results.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  } catch {
    return [];
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanExecutionResult {
  planId: string;
  status: PlanStatus;
  tasks: Plan['tasks'];
  error?: Plan['error'];
  submittedAt: string;
  completedAt: string;
  durationMs: number;
  accepted: boolean;
  acceptanceDetails: Record<string, unknown>;
}

// ── Execution ─────────────────────────────────────────────────────────────────

/**
 * Execute a Plan using XSkynetRuntime with shell plugin.
 * Runs AcceptanceGate after execution to validate overall result.
 * Persists the result for later retrieval.
 */
async function executeAndStore(plan: Plan): Promise<PlanExecutionResult> {
  const submittedAt = new Date().toISOString();
  const startMs = Date.now();

  // Build runtime — always includes shell; extend via plan.metadata.plugins in future
  const runtime = new XSkynetRuntime();
  runtime.use(shellPlugin);

  // Execute the plan
  const execResult = await runtime.execute(plan);

  // Run AcceptanceGate on the overall result
  const gate = new AcceptanceGate();
  const acceptance = await gate.verify(
    {
      success: execResult.status === 'succeeded',
      output: execResult.tasks,
      error: execResult.error?.message,
    },
    // Acceptance criteria can be extended via plan.metadata.acceptance in future
  );

  const result: PlanExecutionResult = {
    planId: plan.id,
    status: execResult.status,
    tasks: execResult.tasks,
    error: execResult.error,
    submittedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startMs,
    accepted: acceptance.passed,
    acceptanceDetails: acceptance.details,
  };

  await savePlanResult(plan.id, result);
  return result;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

/** Read the full request body as a UTF-8 string. */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

// ── Route handlers ─────────────────────────────────────────────────────────────

/**
 * POST /api/plans
 * Body: Plan (JSON, matching @xskynet/contracts Plan type)
 * Returns: PlanExecutionResult
 */
export async function handleCreatePlan(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let plan: Plan;
  try {
    const body = await readBody(req);
    plan = JSON.parse(body) as Plan;
    if (!plan.id || !Array.isArray(plan.tasks)) {
      json(res, { error: 'Invalid plan: missing id or tasks array' }, 400);
      return;
    }
  } catch {
    json(res, { error: 'Invalid JSON body' }, 400);
    return;
  }

  try {
    const result = await executeAndStore(plan);
    json(res, result, result.status === 'succeeded' ? 200 : 422);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    json(res, { error: `Execution failed: ${msg}` }, 500);
  }
}

/**
 * GET /api/plans
 * Returns: PlanExecutionResult[] (most recent 20)
 */
export async function handleListPlans(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const results = await listPlanResults(20);
  json(res, results);
}

/**
 * GET /api/plans/:id
 * Returns: PlanExecutionResult or 404
 */
export async function handleGetPlan(planId: string, _req: IncomingMessage, res: ServerResponse): Promise<void> {
  const result = await loadPlanResult(planId);
  if (!result) {
    json(res, { error: `Plan not found: ${planId}` }, 404);
    return;
  }
  json(res, result);
}
