/**
 * RunList.tsx — Sidebar list of DAGRun entries (P2-07)
 *
 * Displays a scrollable list of DAGRun objects.  Clicking a row calls
 * `onSelect(run.id)` so the parent can swap the active DAG diagram.
 */

import React from 'react';
import type { DAGRun } from '../types/dag';
import StatusBadge from './StatusBadge';

export interface RunListProps {
  runs: DAGRun[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const RunList: React.FC<RunListProps> = ({ runs, selectedId, onSelect }) => {
  return (
    <nav
      style={{
        width: '240px',
        minWidth: '200px',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '12px 16px 8px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#475569',
          textTransform: 'uppercase',
          borderBottom: '1px solid #1e293b',
        }}
      >
        DAG Runs
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
        {runs.map((run) => {
          const isActive = run.id === selectedId;
          const nodeCount = run.nodes.length;
          const edgeCount = run.edges.length;
          const startLabel = run.startedAt
            ? new Date(run.startedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          return (
            <li
              key={run.id}
              onClick={() => onSelect(run.id)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #1e293b',
                background: isActive ? '#1e293b' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLLIElement).style.background = '#172033';
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLLIElement).style.background = 'transparent';
              }}
            >
              {/* Run name */}
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isActive ? '#f1f5f9' : '#cbd5e1',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {run.name}
              </div>

              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <StatusBadge status={run.status} size="sm" />
                <span style={{ fontSize: '10px', color: '#475569' }}>
                  {nodeCount} node{nodeCount !== 1 ? 's' : ''}
                  {' · '}
                  {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Timestamp */}
              {startLabel && (
                <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px' }}>
                  Started {startLabel}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default RunList;
