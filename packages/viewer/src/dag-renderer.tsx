import React, { useEffect, useMemo, useRef } from "react";
import mermaid from "mermaid";

export type RunNode = {
  id: string;
  name: string;
  status: "success" | "failed" | "running" | "pending";
  duration?: number; // ms
  summary?: string;
};

export type RunEdge = {
  from: string;
  to: string;
  label?: string;
};

export type RunData = {
  runId: string;
  nodes: RunNode[];
  edges: RunEdge[];
};

// Status colors
const statusStyles: Record<RunNode["status"], { fill: string; stroke: string }> = {
  success: { fill: "#E6F4EA", stroke: "#34A853" },
  failed: { fill: "#FCE8E6", stroke: "#EA4335" },
  running: { fill: "#FFF8E1", stroke: "#F9AB00" },
  pending: { fill: "#ECEFF1", stroke: "#90A4AE" },
};

function ms(ms?: number) {
  if (!ms && ms !== 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

function escape(text: string) {
  return text.replace(/[<>|]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "|": "\\|" })[c]!);
}

function buildMermaid(data: RunData) {
  // Direction TB for top-bottom
  const lines: string[] = ["flowchart TB"];

  // Node definitions with styling and tooltips
  for (const n of data.nodes) {
    const style = statusStyles[n.status];
    const tooltip = `${n.name}\\nstatus: ${n.status}\\nduration: ${ms(n.duration)}${n.summary ? `\\n${escape(n.summary)}` : ""}`;
    lines.push(`${n.id}([${escape(n.name)}]):::${n.status}`);
    lines.push(`click ${n.id} call callback "${tooltip}"`);
  }

  // Edges
  for (const e of data.edges) {
    const label = e.label ? `|${escape(e.label)}|` : "";
    lines.push(`${e.from} -->${label} ${e.to}`);
  }

  // Class defs for statuses
  lines.push("classDef success fill:#E6F4EA,stroke:#34A853,stroke-width:2px;");
  lines.push("classDef failed fill:#FCE8E6,stroke:#EA4335,stroke-width:2px;");
  lines.push("classDef running fill:#FFF8E1,stroke:#F9AB00,stroke-width:2px;");
  lines.push("classDef pending fill:#ECEFF1,stroke:#90A4AE,stroke-width:2px;");

  return lines.join("\n");
}

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

export default function DagRenderer({ data }: { data: RunData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgId = useMemo(() => `dag-${data.runId}`, [data.runId]);
  const def = useMemo(() => buildMermaid(data), [data]);

  useEffect(() => {
    let active = true;
    async function render() {
      if (!containerRef.current) return;
      try {
        const { svg } = await mermaid.render(svgId, def);
        if (!active) return;
        containerRef.current.innerHTML = svg;
      } catch (e) {
        containerRef.current.innerHTML = `<pre style="color:red">${String(e)}</pre>`;
      }
    }
    render();
    return () => {
      active = false;
    };
  }, [svgId, def]);

  return <div ref={containerRef} />;
}
