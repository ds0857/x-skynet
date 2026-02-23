/**
 * dag.ts — Core type definitions for X-Skynet DAG Run Viewer (P2-07)
 * Aligned with packages/core types.
 */

export type NodeStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type NodeType = 'task' | 'agent' | 'trigger';
export type DAGRunStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface DAGNode {
  id: string;
  label: string;
  status: NodeStatus;
  type: NodeType;
}

export interface Edge {
  from: string;
  to: string;
}

export interface DAGRun {
  id: string;
  name: string;
  status: DAGRunStatus;
  nodes: DAGNode[];
  edges: Edge[];
  startedAt?: string;
  completedAt?: string;
}

/** Colour palette for each status */
export const STATUS_COLORS: Record<NodeStatus, string> = {
  queued:    '#334155',
  running:   '#1d4ed8',
  succeeded: '#15803d',
  failed:    '#b91c1c',
};

export const STATUS_BORDER_COLORS: Record<NodeStatus, string> = {
  queued:    '#64748b',
  running:   '#3b82f6',
  succeeded: '#22c55e',
  failed:    '#ef4444',
};
