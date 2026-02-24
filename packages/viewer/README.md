# @xskynet/viewer — DAG Run Viewer

A lightweight web viewer to visualize agent task DAG runs. Renders nodes and edges with status colors using Mermaid.js.

## Features

- Load JSON run data (local example or via `?data=` URL)
- Render DAG with status colors
- Hover tooltips showing task name, status, duration, and optional summary

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install deps

From monorepo root:

```
pnpm i
```

### Dev server

From monorepo root:

```
pnpm --filter @xskynet/viewer dev
```

Then open http://localhost:5173

### Loading custom data

- Put a JSON file somewhere reachable (local static hosting or github raw)
- Append `?data=<url>` to the viewer URL, e.g.:

```
http://localhost:5173/?data=https://raw.githubusercontent.com/ds0857/x-skynet/main/examples/example-run.json
```

### Example JSON schema

```
{
  "runId": "abc-123",
  "nodes": [
    { "id": "scout", "name": "Scout", "status": "success", "duration": 45000 },
    { "id": "quill", "name": "Quill", "status": "success", "duration": 120000 }
  ],
  "edges": [
    { "from": "scout", "to": "quill", "label": "research-data" }
  ]
}
```

## Notes

- Status colors: green=success, red=failed, yellow=running, gray=pending
- Mermaid securityLevel is set to `loose` to enable tooltips; do not pass untrusted HTML in summaries.
