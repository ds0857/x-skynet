# Demo Scenarios

Hands-on demonstrations that show what X-Skynet can do — no external APIs needed.

## Overview

X-Skynet ships with two runnable demos:

| Demo              | Tasks | Steps | Time  | API needed? |
|-------------------|-------|-------|-------|-------------|
| Hello World       | 2     | 3     | < 5s  | No          |
| Research Agent    | 4     | 8     | < 15s | No          |

---

## Demo 1 — Hello World

**File**: `examples/hello-world/demo.yaml`

The simplest workflow: one `echo` step and one `shell` step chained together.

```bash
xskynet run examples/hello-world/demo.yaml
```

### What it demonstrates

- The `echo` executor (zero dependencies, just prints)
- The `shell` executor (runs any shell command)
- Task `dependsOn` for sequential execution
- Live progress spinner and step summary

### Output

```
Hello, World from X-Skynet! 🚀
Workflow ran at: Mon Feb 23 04:21:37 AM UTC 2026
v22.22.0

✔ Workflow "Hello World" completed successfully ✓
  ✓ Greet
      · Hello, World!
  ✓ System Info
      · Show date and time
      · Show Node.js version
```

---

## Demo 2 — Research Agent

**File**: `examples/research-agent/demo.yaml`

A full research pipeline simulating how a real AI agent would approach a
multi-step research task: gathering sources, analyzing data, and writing a report.

```bash
xskynet run examples/research-agent/demo.yaml
```

### Pipeline Architecture

```
┌───────────────────────────────────────────────────────┐
│                  Research Agent Pipeline               │
│                                                        │
│  Task 1: Initialize                                    │
│    step-banner     → Print framework banner            │
│    step-init-log   → Log session timestamps            │
│         │                                              │
│         ▼                                              │
│  Task 2: Search                                        │
│    step-search-web    → Simulate web search (4 hits)   │
│    step-search-papers → Simulate arxiv search (2 hits) │
│         │                                              │
│         ▼                                              │
│  Task 3: Analyze                                       │
│    step-score     → Score 4 frameworks × 5 dimensions  │
│    step-insights  → Extract 4 key findings             │
│         │                                              │
│         ▼                                              │
│  Task 4: Report                                        │
│    step-write-report   → Write markdown to /tmp/       │
│    step-display-report → Print full report to terminal │
└───────────────────────────────────────────────────────┘
```

### What it demonstrates

| Feature                   | How it's shown                             |
|---------------------------|--------------------------------------------|
| Multi-task orchestration  | 4 tasks with linear `dependsOn` chain      |
| Shell executor            | All 8 steps use `kind: shell`              |
| Real-time stdout          | Output streams live as each step runs      |
| File I/O                  | Report written to `/tmp/xskynet-research-report.md` |
| Meaningful business logic | Framework scoring, insight extraction      |
| Pipeline summary          | Final task/step pass/fail table            |

### Sample Output (abridged)

```
╔══════════════════════════════════════════════════════╗
║       X-Skynet Research Agent  v0.1.0               ║
║       Powered by X-Skynet Workflow Runtime            ║
╚══════════════════════════════════════════════════════╝

  Topic  : Open-Source AI Agent Frameworks in 2026
  Mode   : Autonomous Research Pipeline

[04:21:37] Research session initialized

[ TOOL: web_search ] query: open source AI agent frameworks 2026

  [1] X-Skynet    — Containerized AI agents, 15-min setup  | Stars: 2.4k
  [2] AutoGen     — Multi-agent conversation framework      | Stars: 34k
  [3] CrewAI      — Role-playing autonomous AI agents       | Stars: 22k
  [4] LangGraph   — Stateful multi-actor applications       | Stars: 9k

[ TOOL: analyze ] Scoring 4 frameworks across 5 dimensions

  Framework       Setup  Perf   DX   Scale  OSS   TOTAL
  ---------------------------------------------------
  X-Skynet          25    18    19    17     15    94/100
  AutoGen           18    19    16    19     15    87/100

[ TOOL: extract_insights ] Reasoning over scored matrix

  Key Findings:
  1. Container-native design cuts agent cold-start time by ~60%
  2. TypeScript SDKs reduce onboarding friction by 40% vs Python

==========================================================
  RESEARCH COMPLETE - FINAL REPORT
==========================================================

  4 tasks completed  |  8 steps executed  |  0 errors

✔ Workflow "Research Agent Demo" completed successfully ✓
```

---

## Building Your Own Demo

Copy the research-agent template and modify it:

```bash
cp -r examples/research-agent examples/my-agent
# Edit demo.yaml, change tasks/steps/commands
xskynet run examples/my-agent/demo.yaml
```

### Anatomy of a Workflow YAML

```yaml
version: "1.0"
name: My Agent

tasks:
  - id: task-first
    name: First Task
    steps:
      - id: step-a
        name: Do Something
        kind: shell                        # or "echo"
        command: "echo 'Hello from step A'"

  - id: task-second
    name: Second Task
    dependsOn: [task-first]               # run after task-first
    steps:
      - id: step-b
        name: Print Message
        kind: echo
        metadata:
          message: "Step B complete!"
```

### Available Executors

| Kind    | Plugin           | Description                          |
|---------|------------------|--------------------------------------|
| `echo`  | plugin-shell     | Print a message (no shell needed)    |
| `shell` | plugin-shell     | Run any shell command                |
| `http`  | plugin-http      | Make HTTP requests                   |
| `claude`| plugin-claude    | Call Claude via API                  |

---

## Next Steps

- [Quick Start](./quickstart) — set up X-Skynet in 5 steps
- [Core Concepts](../guide/concepts) — understand tasks, steps, and plugins
- [Configuration](../guide/configuration) — full YAML reference
- [GitHub Examples](https://github.com/ds0857/x-skynet/tree/main/examples) — browse all examples
