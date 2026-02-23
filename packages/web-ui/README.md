# @x-skynet/web-ui

Lightweight real-time monitoring dashboard for X-Skynet.  
No React, no bundler — just TypeScript, Node.js built-in `http`, and vanilla JS on the frontend.

## Features

| Feature | Details |
|---|---|
| **Agent status cards** | Displays each agent with a green/yellow/red status dot |
| **Recent DAG runs** | Table of the last 10 runs with status badges |
| **Task queue** | Live task queue with assignee and status |
| **WebSocket push** | Server pushes snapshots every 5 seconds |
| **REST API** | `GET /api/agents`, `/api/runs`, `/api/tasks` |
| **Zero deps** | Only Node.js built-ins at runtime |

## Quick Start

```bash
# Development (no build step)
pnpm --filter @x-skynet/web-ui dev

# Build
pnpm --filter @x-skynet/web-ui build

# Production
node packages/web-ui/dist/index.js
```

Open [http://localhost:3900](http://localhost:3900).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3900` | HTTP server port |

## API

### `GET /api/agents`

```json
[
  { "id": "minion", "status": "healthy", "lastHeartbeat": "2026-02-23T12:00:00Z" },
  ...
]
```

### `GET /api/runs`

```json
[
  { "id": "run-001", "status": "success", "steps": 5, "startedAt": "2026-02-23T12:00:00Z" },
  ...
]
```

### `GET /api/tasks`

```json
[
  { "id": "T-001", "title": "...", "assignee": "nova", "status": "in-progress" },
  ...
]
```

### WebSocket `/ws`

Connect to receive real-time JSON snapshots:

```json
{
  "type": "snapshot",
  "agents": [...],
  "runs": [...],
  "tasks": [...],
  "ts": "2026-02-23T12:00:00Z"
}
```

## Testing

```bash
pnpm test --testPathPattern=web-ui
```

## Architecture

```
src/
├── index.ts      # HTTP server (built-in http)
├── dashboard.ts  # WebSocket upgrade handler + broadcast loop
├── api.ts        # REST route handlers + mock data
└── static/
    ├── index.html  # Single-page dashboard
    └── app.js      # WebSocket client + DOM rendering
```
