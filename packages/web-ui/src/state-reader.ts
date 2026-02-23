import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface AgentRecord {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  lastHeartbeat?: string;
  model?: string;
  role?: string;
}

export interface AgentState {
  agents: AgentRecord[];
  updatedAt: string;
}

export interface RunRecord {
  taskId: string;
  success: boolean;
  output: unknown;
  error?: string;
  completedAt: string;
  durationMs: number;
}

export interface QueueRecord {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  retries: number;
  createdAt: string;
}

const STATE_DIR = path.join(os.homedir(), '.xskynet');

export async function readAgentState(): Promise<AgentState> {
  try {
    const raw = await fs.readFile(path.join(STATE_DIR, 'state.json'), 'utf-8');
    return JSON.parse(raw) as AgentState;
  } catch {
    return { agents: [], updatedAt: new Date().toISOString() };
  }
}

export async function writeAgentState(state: AgentState): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  await fs.writeFile(path.join(STATE_DIR, 'state.json'), JSON.stringify(state, null, 2));
}

export async function readRuns(limit = 20): Promise<RunRecord[]> {
  const runsDir = path.join(STATE_DIR, 'runs');
  try {
    const files = await fs.readdir(runsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).slice(-limit);
    const runs: RunRecord[] = [];
    for (const f of jsonFiles) {
      try {
        const raw = await fs.readFile(path.join(runsDir, f), 'utf-8');
        runs.push(JSON.parse(raw) as RunRecord);
      } catch { /* skip */ }
    }
    return runs.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  } catch {
    return [];
  }
}

export async function readQueue(): Promise<QueueRecord[]> {
  try {
    const raw = await fs.readFile(path.join(STATE_DIR, 'queue.json'), 'utf-8');
    return JSON.parse(raw) as QueueRecord[];
  } catch {
    return [];
  }
}
