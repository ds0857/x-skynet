# @x-skynet/dag-viewer

> **P2-07** — DAG Run Viewer · React + [Mermaid.js](https://mermaid.js.org/)

Visualise X-Skynet mission execution graphs directly in the browser.
Each mission step becomes a node; dependency edges connect them into a directed acyclic graph (DAG).
Node shapes and colours reflect real-time execution status.

---

## Screenshot

```
╔══════════════════════════════╗
║  ✦ X-Skynet  DAG Run Viewer  ║
╠══════════╦═══════════════════╣
║ Missions ║ DAG: Market Research Report
║ ─────────║ ┌──────────────────┐
║ Market   ║ │ step-1 (scout) ✓ │
║ Parallel ║ └────────┬─────────┘
║ Campaign ║          ▼
╚══════════║  ( step-2: quill ⟳ )
           ║          ▼
           ║  [ step-3: observer ▭ ]
           ╚══════════════════════════
```

---

## Node shapes by status

| Status    | Mermaid shape   | Meaning                     |
|-----------|-----------------|-----------------------------|
| queued    | `[ ]` rectangle | Waiting for dependencies    |
| running   | `([ ])` stadium | Currently executing         |
| succeeded | `( )` rounded   | Completed successfully      |
| failed    | `{{ }}` hexagon | Terminated with error       |
| skipped   | `[/ /]` trap.   | Bypassed (upstream failure) |

---

## Quick start

```bash
cd packages/dag-viewer
npm install
npm run dev          # http://localhost:5173
npm run build        # → dist/
```

---

## Usage

```tsx
import DagViewer from './DagViewer';
import type { Step } from './types';

const steps: Step[] = [
  { id: 'a', title: 'Scrape', assigned_to: 'scout',  status: 'succeeded', depends_on: [] },
  { id: 'b', title: 'Write',  assigned_to: 'quill',  status: 'running',   depends_on: ['a'] },
  { id: 'c', title: 'Review', assigned_to: 'observer', status: 'queued', depends_on: ['b'] },
];

<DagViewer steps={steps} title="My pipeline" />
```

### Props

| Prop    | Type     | Required | Description                             |
|---------|----------|----------|-----------------------------------------|
| `steps` | `Step[]` | ✅        | Array of steps with dependency info     |
| `title` | `string` | ✗        | Optional chart heading shown above graph|

---

## Data types

```ts
// types.ts
interface Step {
  id: string;           // unique, used in depends_on references
  title: string;
  assigned_to: string;  // agent name
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped';
  depends_on: string[]; // IDs of upstream steps
  result?: string;      // optional output summary
}
```

---

## Integrating with Supabase

Replace `allMissions` mock data with a live query:

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data: missions } = await supabase
  .from('missions')
  .select('*, steps(*)')
  .order('created_at', { ascending: false });
```

---

## Tech stack

| Tool         | Version  | Purpose                        |
|--------------|----------|--------------------------------|
| React        | 18       | UI framework                   |
| Mermaid.js   | 10       | DAG diagram rendering (SVG)    |
| Vite         | 5        | Dev server + bundler           |
| TypeScript   | 5        | Type safety                    |

---

*Part of the [X-Skynet](https://github.com/ds0857/x-skynet) project. Phase 2, task P2-07.*
