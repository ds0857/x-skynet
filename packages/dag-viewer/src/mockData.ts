// mockData.ts — Example DAG missions for development / demo

import type { Mission } from './types';

/**
 * A linear pipeline: scout researches → quill writes → observer reviews.
 */
export const linearMission: Mission = {
  id: 'mission-linear-001',
  title: 'Market Research Report',
  proposed_by: 'nova',
  created_at: '2026-02-23T00:00:00Z',
  steps: [
    {
      id: 'step-1',
      title: 'Research competitors',
      assigned_to: 'scout',
      status: 'succeeded',
      depends_on: [],
      result: 'Found 12 relevant competitors across 3 verticals.',
    },
    {
      id: 'step-2',
      title: 'Write research report',
      assigned_to: 'quill',
      status: 'running',
      depends_on: ['step-1'],
    },
    {
      id: 'step-3',
      title: 'QA review',
      assigned_to: 'observer',
      status: 'queued',
      depends_on: ['step-2'],
    },
  ],
};

/**
 * A fan-out / fan-in DAG:
 *   step-1 → step-2a, step-2b (parallel) → step-3 (join)
 */
export const parallelMission: Mission = {
  id: 'mission-parallel-002',
  title: 'Parallel Data Pipeline',
  proposed_by: 'minion',
  created_at: '2026-02-23T01:00:00Z',
  steps: [
    {
      id: 'step-1',
      title: 'Ingest raw data',
      assigned_to: 'scout',
      status: 'succeeded',
      depends_on: [],
    },
    {
      id: 'step-2a',
      title: 'Analyse sentiment',
      assigned_to: 'sage',
      status: 'succeeded',
      depends_on: ['step-1'],
    },
    {
      id: 'step-2b',
      title: 'Summarise key events',
      assigned_to: 'quill',
      status: 'running',
      depends_on: ['step-1'],
    },
    {
      id: 'step-3',
      title: 'Merge & publish report',
      assigned_to: 'minion',
      status: 'queued',
      depends_on: ['step-2a', 'step-2b'],
    },
  ],
};

/**
 * A mission with a failed step that blocks downstream work.
 */
export const failedMission: Mission = {
  id: 'mission-failed-003',
  title: 'Social Media Campaign',
  proposed_by: 'nova',
  created_at: '2026-02-23T02:00:00Z',
  steps: [
    {
      id: 'step-1',
      title: 'Draft copy',
      assigned_to: 'quill',
      status: 'succeeded',
      depends_on: [],
    },
    {
      id: 'step-2',
      title: 'Compliance check',
      assigned_to: 'observer',
      status: 'failed',
      depends_on: ['step-1'],
      result: 'ERROR: Prohibited keyword detected.',
    },
    {
      id: 'step-3',
      title: 'Schedule posts',
      assigned_to: 'xalt',
      status: 'skipped',
      depends_on: ['step-2'],
    },
  ],
};

export const allMissions: Mission[] = [
  linearMission,
  parallelMission,
  failedMission,
];
