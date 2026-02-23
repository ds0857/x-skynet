/**
 * DagGraph.tsx — Core DAG rendering component using Mermaid.js (P2-07)
 *
 * Accepts a `DAGRun` and renders a colour-coded directed graph where:
 *   queued    → grey rectangle
 *   running   → blue stadium  (animated border via classDef)
 *   succeeded → green rounded
 *   failed    → red hexagon
 *
 * Node shape also encodes the `type` field:
 *   trigger → parallelogram
 *   agent   → stadium
 *   task    → rectangle / rounded / hexagon (per status)
 */

import React, { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';
import type { DAGRun, DAGNode, NodeStatus, NodeType } from '../types/dag';
import { computeLayout } from '../utils/layout';

// ── Initialise Mermaid once ──────────────────────────────────────────────────
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#1e293b',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#475569',
    lineColor:   '#94a3b8',
    secondaryColor: '#0f172a',
    tertiaryColor:  '#0f172a',
  },
  flowchart: { curve: 'basis', useMaxWidth: true },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safe label for Mermaid node strings */
const sanitise = (s: string): string =>
  s.replace(/["\n\r]/g, ' ').replace(/[<>{}|]/g, (c) => `#${c.charCodeAt(0)};`);

/** Map status → Mermaid classDef name */
const statusClass = (status: NodeStatus): string =>
  ({
    queued:    'clsQueued',
    running:   'clsRunning',
    succeeded: 'clsSucceeded',
    failed:    'clsFailed',
  })[status];

/**
 * Choose Mermaid node shape based on (type × status):
 *   trigger              → parallelogram [/ /]
 *   agent, running       → stadium        ([ ])
 *   agent, succeeded     → rounded        ( )
 *   task, succeeded      → rounded        ( )
 *   task/agent, failed   → hexagon        {{ }}
 *   default              → rectangle      [ ]
 */
function nodeShape(id: string, label: string, type: NodeType, status: NodeStatus): string {
  const l = sanitise(label);
  if (type === 'trigger') return `${id}[/"${l}"/]`;
  if (status === 'failed') return `${id}{{"${l}"}}`;
  if (status === 'succeeded') return `${id}("${l}")`;
  if (status === 'running')  return `${id}(["${l}"])`;
  return `${id}["${l}"]`;
}

/** Build a complete Mermaid `flowchart TD` definition from a DAGRun */
function buildDefinition(run: DAGRun): string {
  const lines: string[] = ['flowchart TD'];

  // Use layout util to get topological order
  let orderedNodes: DAGNode[];
  try {
    orderedNodes = computeLayout(run.nodes, run.edges);
  } catch {
    // Fallback: use nodes as-is (cycle or empty)
    orderedNodes = run.nodes;
  }

  // Node declarations
  for (const node of orderedNodes) {
    const shape = nodeShape(node.id, node.label, node.type, node.status);
    lines.push(`  ${shape}:::${statusClass(node.status)}`);
  }

  // Edge declarations
  for (const edge of run.edges) {
    lines.push(`  ${edge.from} --> ${edge.to}`);
  }

  // Class styles
  lines.push('  classDef clsQueued    fill:#334155,stroke:#64748b,color:#f1f5f9');
  lines.push('  classDef clsRunning   fill:#1d4ed8,stroke:#3b82f6,color:#eff6ff,stroke-width:2px');
  lines.push('  classDef clsSucceeded fill:#15803d,stroke:#22c55e,color:#f0fdf4');
  lines.push('  classDef clsFailed    fill:#b91c1c,stroke:#ef4444,color:#fef2f2');

  return lines.join('\n');
}

// ── Component ────────────────────────────────────────────────────────────────

export interface DagGraphProps {
  run: DAGRun;
  /** Optional additional CSS class for the wrapper div */
  className?: string;
}

const DagGraph: React.FC<DagGraphProps> = ({ run, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, 'x');   // valid HTML id chars only

  useEffect(() => {
    if (!ref.current) return;

    const def = buildDefinition(run);

    // Reset so Mermaid re-renders on prop change
    ref.current.removeAttribute('data-processed');
    ref.current.innerHTML = def;

    mermaid.run({ nodes: [ref.current] }).catch((err) => {
      console.error('[DagGraph] render error:', err);
      if (ref.current) {
        ref.current.innerHTML = `<pre style="color:#ef4444;padding:12px">Render error:\n${String(err)}</pre>`;
      }
    });
  }, [run, uid]);

  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '16px',
        minHeight: '200px',
      }}
      className={className}
    >
      {/* Diagram container — Mermaid requires class="mermaid" */}
      <div ref={ref} id={`dag-${uid}`} className="mermaid" />

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid #1e293b',
        }}
      >
        {(
          [
            { status: 'queued',    color: '#334155', label: 'Queued'    },
            { status: 'running',   color: '#1d4ed8', label: 'Running'   },
            { status: 'succeeded', color: '#15803d', label: 'Succeeded' },
            { status: 'failed',    color: '#b91c1c', label: 'Failed'    },
          ] as { status: NodeStatus; color: string; label: string }[]
        ).map(({ status, color, label }) => (
          <span
            key={status}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: '#94a3b8',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: color,
                display: 'inline-block',
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DagGraph;
