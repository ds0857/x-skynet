/**
 * DagViewer.tsx
 * Core component that converts a list of Steps into a Mermaid flowchart
 * and renders it inside the browser using mermaid.js.
 *
 * Usage:
 *   <DagViewer steps={mission.steps} title={mission.title} />
 */

import React, { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';
import type { Step, StepStatus } from './types';

// ── Mermaid initialised once per module ─────────────────────────────────────
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#1e293b',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#475569',
    lineColor: '#94a3b8',
    secondaryColor: '#0f172a',
    tertiaryColor: '#0f172a',
  },
  flowchart: { curve: 'basis', useMaxWidth: true },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map execution status → Mermaid node style class */
const statusClass = (status: StepStatus): string => {
  switch (status) {
    case 'succeeded': return 'cls-succeeded';
    case 'running':   return 'cls-running';
    case 'failed':    return 'cls-failed';
    case 'skipped':   return 'cls-skipped';
    default:          return 'cls-queued';
  }
};

/** Sanitise a step title for inclusion inside Mermaid node labels */
const sanitise = (s: string): string =>
  s.replace(/["\n\r]/g, ' ').replace(/[<>{}|]/g, (c) => `#${c.charCodeAt(0)};`);

/**
 * Build a Mermaid `flowchart TD` definition from a steps array.
 *
 * Node shape encodes meaning:
 *   queued   → rectangle  [ ]
 *   running  → stadium    ([ ])
 *   succeeded→ rounded    ( )
 *   failed   → hexagon    {{ }}
 *   skipped  → trapezoid  [/ /]
 */
function buildMermaidDef(steps: Step[]): string {
  const lines: string[] = ['flowchart TD'];

  // Node definitions
  for (const step of steps) {
    const label = `${sanitise(step.title)}<br/><small>${step.assigned_to}</small>`;
    let node: string;
    switch (step.status) {
      case 'succeeded': node = `${step.id}("${label}")`; break;
      case 'running':   node = `${step.id}(["${label}"])`; break;
      case 'failed':    node = `${step.id}{{"${label}"}}`; break;
      case 'skipped':   node = `${step.id}[/"${label}"/]`; break;
      default:          node = `${step.id}["${label}"]`; break;
    }
    lines.push(`  ${node}:::${statusClass(step.status)}`);
  }

  // Edges
  for (const step of steps) {
    for (const dep of step.depends_on) {
      lines.push(`  ${dep} --> ${step.id}`);
    }
  }

  // Class definitions (inline CSS colours)
  lines.push('  classDef cls-queued    fill:#334155,stroke:#64748b,color:#f1f5f9');
  lines.push('  classDef cls-running   fill:#1d4ed8,stroke:#3b82f6,color:#eff6ff');
  lines.push('  classDef cls-succeeded fill:#15803d,stroke:#22c55e,color:#f0fdf4');
  lines.push('  classDef cls-failed    fill:#b91c1c,stroke:#ef4444,color:#fef2f2');
  lines.push('  classDef cls-skipped   fill:#4b5563,stroke:#9ca3af,color:#f9fafb,stroke-dasharray:4');

  return lines.join('\n');
}

// ── Component ────────────────────────────────────────────────────────────────

export interface DagViewerProps {
  /** Steps from a Mission object */
  steps: Step[];
  /** Optional chart title displayed above the diagram */
  title?: string;
}

const DagViewer: React.FC<DagViewerProps> = ({ steps, title }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, '');   // valid HTML id

  useEffect(() => {
    if (!diagramRef.current) return;

    const def = buildMermaidDef(steps);

    // Reset any previously rendered content so Mermaid re-renders cleanly
    diagramRef.current.removeAttribute('data-processed');
    diagramRef.current.innerHTML = def;

    mermaid
      .run({ nodes: [diagramRef.current] })
      .catch((err) => {
        console.error('[DagViewer] Mermaid render error:', err);
        if (diagramRef.current) {
          diagramRef.current.innerHTML =
            `<pre style="color:red">Render error:\n${err}</pre>`;
        }
      });
  }, [steps, uid]);

  return (
    <div className="dag-viewer-wrapper">
      {title && <h3 className="dag-viewer-title">{title}</h3>}
      <div
        ref={diagramRef}
        className="dag-viewer-diagram mermaid"
        id={`dag-${uid}`}
      />
      <DagLegend />
    </div>
  );
};

// ── Legend ───────────────────────────────────────────────────────────────────

const LEGEND: { status: StepStatus; label: string; color: string }[] = [
  { status: 'queued',    label: 'Queued',    color: '#334155' },
  { status: 'running',   label: 'Running',   color: '#1d4ed8' },
  { status: 'succeeded', label: 'Succeeded', color: '#15803d' },
  { status: 'failed',    label: 'Failed',    color: '#b91c1c' },
  { status: 'skipped',   label: 'Skipped',   color: '#4b5563' },
];

const DagLegend: React.FC = () => (
  <div className="dag-legend">
    {LEGEND.map(({ status, label, color }) => (
      <span key={status} className="dag-legend-item">
        <span className="dag-legend-swatch" style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);

export default DagViewer;
