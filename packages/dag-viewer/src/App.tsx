/**
 * App.tsx — X-Skynet DAG Run Viewer root component (P2-07)
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  Header (brand + version)                        │
 *   ├──────────────┬───────────────────────────────────┤
 *   │  RunList     │  DagGraph + node detail table     │
 *   │  (sidebar)   │  (main panel)                     │
 *   └──────────────┴───────────────────────────────────┘
 *
 * Data source: `DEMO_RUNS` mock array below.
 * In production, replace with data fetched from Supabase or a REST API.
 */

import React, { useState } from 'react';
import DagGraph from './components/DagGraph';
import RunList from './components/RunList';
import StatusBadge from './components/StatusBadge';
import type { DAGRun } from './types/dag';

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_RUNS: DAGRun[] = [
  {
    id: 'run-001',
    name: 'Market Research Pipeline',
    status: 'running',
    startedAt: '2026-02-23T03:00:00Z',
    nodes: [
      { id: 'n1', label: 'Ingest sources',    status: 'succeeded', type: 'trigger' },
      { id: 'n2', label: 'Scout web',          status: 'succeeded', type: 'agent'   },
      { id: 'n3', label: 'Write report',       status: 'running',   type: 'agent'   },
      { id: 'n4', label: 'QA review',          status: 'queued',    type: 'task'    },
      { id: 'n5', label: 'Publish',            status: 'queued',    type: 'task'    },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' },
    ],
  },
  {
    id: 'run-002',
    name: 'Parallel Data Pipeline',
    status: 'running',
    startedAt: '2026-02-23T04:00:00Z',
    nodes: [
      { id: 'n1', label: 'Raw data ingest', status: 'succeeded', type: 'trigger' },
      { id: 'n2', label: 'Sentiment analysis', status: 'succeeded', type: 'agent' },
      { id: 'n3', label: 'Event summary',    status: 'running',   type: 'agent'   },
      { id: 'n4', label: 'Merge & publish',  status: 'queued',    type: 'task'    },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n1', to: 'n3' },
      { from: 'n2', to: 'n4' },
      { from: 'n3', to: 'n4' },
    ],
  },
  {
    id: 'run-003',
    name: 'Social Media Campaign',
    status: 'failed',
    startedAt: '2026-02-23T02:00:00Z',
    completedAt: '2026-02-23T02:45:00Z',
    nodes: [
      { id: 'n1', label: 'Draft copy',        status: 'succeeded', type: 'agent'   },
      { id: 'n2', label: 'Compliance check',  status: 'failed',    type: 'task'    },
      { id: 'n3', label: 'Schedule posts',    status: 'queued',    type: 'task'    },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
    ],
  },
  {
    id: 'run-004',
    name: 'Full Deployment Flow',
    status: 'succeeded',
    startedAt: '2026-02-23T01:00:00Z',
    completedAt: '2026-02-23T01:30:00Z',
    nodes: [
      { id: 'n1', label: 'Trigger CI',        status: 'succeeded', type: 'trigger' },
      { id: 'n2', label: 'Build image',        status: 'succeeded', type: 'task'    },
      { id: 'n3', label: 'Run tests',          status: 'succeeded', type: 'task'    },
      { id: 'n4', label: 'Deploy staging',     status: 'succeeded', type: 'task'    },
      { id: 'n5', label: 'Smoke test',         status: 'succeeded', type: 'agent'   },
      { id: 'n6', label: 'Deploy production',  status: 'succeeded', type: 'task'    },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n1', to: 'n3' },
      { from: 'n2', to: 'n4' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' },
      { from: 'n5', to: 'n6' },
    ],
  },
];

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(DEMO_RUNS[0].id);
  const run = DEMO_RUNS.find((r) => r.id === selectedId) ?? DEMO_RUNS[0];

  const duration =
    run.startedAt && run.completedAt
      ? Math.round(
          (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000,
        ) + 's'
      : run.startedAt
      ? 'in progress'
      : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#020617',
        color: '#f1f5f9',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: '52px',
          borderBottom: '1px solid #1e293b',
          background: '#0a0f1e',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>✦</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>
            X-Skynet
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#475569',
              borderLeft: '1px solid #334155',
              paddingLeft: '10px',
            }}
          >
            DAG Run Viewer
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace' }}>
          v0.1.0 · P2-07
        </span>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <RunList
          runs={DEMO_RUNS}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Main panel */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Run header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#f1f5f9',
              }}
            >
              {run.name}
            </h2>
            <StatusBadge status={run.status} size="md" />
            {duration && (
              <span style={{ fontSize: '12px', color: '#475569' }}>
                ⏱ {duration}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              fontSize: '12px',
              color: '#64748b',
            }}
          >
            {run.startedAt && (
              <span>
                Started:{' '}
                <strong style={{ color: '#94a3b8' }}>
                  {new Date(run.startedAt).toLocaleString()}
                </strong>
              </span>
            )}
            <span>
              Nodes: <strong style={{ color: '#94a3b8' }}>{run.nodes.length}</strong>
            </span>
            <span>
              Edges: <strong style={{ color: '#94a3b8' }}>{run.edges.length}</strong>
            </span>
          </div>

          {/* DAG Graph */}
          <DagGraph run={run} />

          {/* Node table */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#475569',
                textTransform: 'uppercase',
                borderBottom: '1px solid #1e293b',
              }}
            >
              Nodes
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #1e293b',
                    color: '#64748b',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                  }}
                >
                  {['ID', 'Label', 'Type', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {run.nodes.map((node, i) => (
                  <tr
                    key={node.id}
                    style={{
                      borderBottom:
                        i < run.nodes.length - 1 ? '1px solid #1e293b' : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '9px 16px',
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        fontSize: '12px',
                      }}
                    >
                      {node.id}
                    </td>
                    <td style={{ padding: '9px 16px', color: '#e2e8f0' }}>
                      {node.label}
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        color: '#64748b',
                        fontSize: '12px',
                        fontStyle: 'italic',
                      }}
                    >
                      {node.type}
                    </td>
                    <td style={{ padding: '9px 16px' }}>
                      <StatusBadge status={node.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
