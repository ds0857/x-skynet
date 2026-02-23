# @x-skynet/dag-viewer

**P2-07** — Lightweight DAG Run Viewer for X-Skynet mission graphs.

Visualises task execution DAGs with real-time status colours using **React + Vite + Mermaid.js**.

## Features

- 🔷 Directed acyclic graph rendered via Mermaid.js
- 🟢 Node colours encode status: **queued** (grey) · **running** (blue) · **succeeded** (green) · **failed** (red)
- 📋 Sidebar run list — click to switch between DAG runs
- 📊 Node detail table below the diagram
- ⚡ Vite dev server with HMR

## Structure

```
src/
├── App.tsx                    # Root layout (header + sidebar + main panel)
├── main.tsx                   # React DOM entry point
├── components/
│   ├── DagGraph.tsx           # Core: Mermaid.js DAG renderer
│   ├── RunList.tsx            # Sidebar: clickable run list
│   └── StatusBadge.tsx        # Pill badge: queued / running / succeeded / failed
├── types/
│   └── dag.ts                 # DAGRun, DAGNode, Edge type definitions
└── utils/
    └── layout.ts              # Topological sort + depth/rank layout helpers
```

## Data Types

```typescript
interface DAGRun {
  id: string
  name: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  nodes: DAGNode[]
  edges: Edge[]
  startedAt?: string
  completedAt?: string
}

interface DAGNode {
  id: string
  label: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  type: 'task' | 'agent' | 'trigger'
}

interface Edge {
  from: string
  to: string
}
```

## Dev

```bash
pnpm install
pnpm --filter @x-skynet/dag-viewer dev
```

Open http://localhost:5173

## Build

```bash
pnpm --filter @x-skynet/dag-viewer build
```

## Production Integration

Replace `DEMO_RUNS` in `App.tsx` with data fetched from Supabase or the X-Skynet API:

```typescript
const { data } = await supabase.from('dag_runs').select('*, nodes(*), edges(*)')
```
