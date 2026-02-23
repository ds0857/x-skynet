/**
 * StatusBadge.tsx — Coloured pill badge for DAGRun / Node status (P2-07)
 */

import React from 'react';
import type { NodeStatus } from '../types/dag';

const COLOR_MAP: Record<NodeStatus, { bg: string; border: string; text: string }> = {
  queued:    { bg: '#1e293b', border: '#64748b', text: '#94a3b8' },
  running:   { bg: '#1e3a8a', border: '#3b82f6', text: '#bfdbfe' },
  succeeded: { bg: '#14532d', border: '#22c55e', text: '#bbf7d0' },
  failed:    { bg: '#7f1d1d', border: '#ef4444', text: '#fecaca' },
};

const LABEL_MAP: Record<NodeStatus, string> = {
  queued:    'QUEUED',
  running:   'RUNNING',
  succeeded: 'DONE',
  failed:    'FAILED',
};

export interface StatusBadgeProps {
  status: NodeStatus;
  /** Show a pulsing dot for running status */
  animated?: boolean;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  animated = true,
  size = 'sm',
}) => {
  const { bg, border, text } = COLOR_MAP[status];
  const fontSize = size === 'sm' ? '10px' : '12px';
  const padding  = size === 'sm' ? '2px 7px' : '3px 10px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        borderRadius: '999px',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.05em',
        padding,
        whiteSpace: 'nowrap',
        fontFamily: 'monospace',
      }}
    >
      {animated && status === 'running' && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#3b82f6',
            display: 'inline-block',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      )}
      {LABEL_MAP[status]}
    </span>
  );
};

export default StatusBadge;
