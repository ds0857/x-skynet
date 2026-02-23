# Research Agent Demo

An end-to-end example showing how X-Skynet orchestrates a multi-step AI research
pipeline — without any external API calls. All steps run locally using the
built-in `shell` and `echo` executors.

## What This Demo Does

```
┌─────────────────────────────────────────────────────────┐
│              Research Agent Pipeline                     │
│                                                          │
│  [Task 1]          [Task 2]           [Task 3]          │
│  Initialize   →   Search &      →    Analyze &          │
│  Session          Gather Sources      Score             │
│                        │                   │            │
│                        └─────────┬─────────┘           │
│                                  ▼                      │
│                             [Task 4]                    │
│                           Write Report                  │
└─────────────────────────────────────────────────────────┘
```

**4 tasks, 8 steps, zero external dependencies.**

The agent simulates:
1. **Initialize** — set up session context, log environment
2. **Search** — parallel web search + academic paper lookup
3. **Analyze** — score frameworks across 5 dimensions, extract insights
4. **Report** — generate a markdown report, display summary

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/ds0857/x-skynet.git
cd x-skynet

# 2. Install dependencies
pnpm install

# 3. Build
pnpm build

# 4. Run the demo
xskynet run examples/research-agent/demo.yaml
```

> **No API keys needed.** Everything runs locally via shell commands.

## Prerequisites

| Tool     | Version  | Check                   |
|----------|----------|-------------------------|
| Node.js  | ≥ 18     | `node --version`        |
| pnpm     | ≥ 8      | `pnpm --version`        |

## Expected Output

Running the demo produces output like this:

```
╔══════════════════════════════════════════════════════╗
║       X-Skynet Research Agent  v0.1.0               ║
║       Powered by X-Skynet Workflow Runtime            ║
╚══════════════════════════════════════════════════════╝

  Topic  : Open-Source AI Agent Frameworks in 2026
  Mode   : Autonomous Research Pipeline
  Engine : x-skynet/core + plugin-shell

[04:21:37] Research session initialized
[04:21:37] Context window: ready
[04:21:37] Tool registry: search, analyze, write

[ TOOL: web_search ] query: open source AI agent frameworks 2026

  [1] X-Skynet    — Containerized AI agents, 15-min setup  | Stars: 2.4k | Apache-2.0 | TypeScript
  [2] AutoGen     — Multi-agent conversation framework      | Stars: 34k  | MIT        | Python
  [3] CrewAI      — Role-playing autonomous AI agents       | Stars: 22k  | MIT        | Python
  [4] LangGraph   — Stateful multi-actor applications       | Stars: 9k   | MIT        | Python

  => Found 4 relevant sources. Proceeding to analysis...

[ TOOL: analyze ] Scoring 4 frameworks across 5 dimensions

  Framework       Setup  Perf   DX   Scale  OSS   TOTAL
  ---------------------------------------------------
  X-Skynet          25    18    19    17     15    94/100
  AutoGen           18    19    16    19     15    87/100
  CrewAI            20    16    18    15     15    84/100
  LangGraph         15    20    14    20     15    84/100

[ TOOL: extract_insights ] Reasoning over scored matrix

  Key Findings:
  1. Container-native design cuts agent cold-start time by ~60%
  2. TypeScript SDKs reduce onboarding friction by 40% vs Python
  3. YAML workflow definitions reduce configuration errors by 3x
  4. Plugin architecture enables zero-code LLM provider swapping

==========================================================
  RESEARCH COMPLETE - FINAL REPORT
==========================================================

# Research Report: AI Agent Frameworks 2026
...
  4 tasks completed  |  8 steps executed  |  0 errors
  Pipeline: Init -> Search -> Analyze -> Report  DONE

✔ Workflow "Research Agent Demo" completed successfully ✓
  ✓ Initialize Research Session
      · Print Research Banner
      · Log Session Start
  ✓ Search and Gather Sources
      · Web Search
      · Academic Paper Search
  ✓ Analyze and Score Findings
      · Score Frameworks
      · Extract Key Insights
  ✓ Write and Publish Report
      · Generate Markdown Report
      · Display Final Report
```

## Generated Report

The final task writes a markdown report to `/tmp/xskynet-research-report.md`:

```markdown
# Research Report: AI Agent Frameworks 2026

## Framework Comparison

Framework  | Score | Standout Feature
-----------|-------|----------------------------------
X-Skynet   |  94   | YAML-first, container-native, 15min setup
AutoGen    |  87   | Multi-agent conversations
CrewAI     |  84   | Role-playing agent personas
LangGraph  |  84   | Stateful graph execution
```

## How It Works

### Workflow File: `demo.yaml`

The entire pipeline is defined in a single YAML file:

```yaml
version: "1.0"
name: Research Agent Demo

tasks:
  - id: task-init
    name: Initialize Research Session
    steps:
      - id: step-banner
        kind: shell
        command: "printf '...'"

  - id: task-search
    dependsOn: [task-init]      # ← dependency declaration
    steps:
      - id: step-search-web
        kind: shell
        command: "echo '[ TOOL: web_search ]...'"

  - id: task-analyze
    dependsOn: [task-search]
    steps:
      - id: step-score
        kind: shell
        command: "..."

  - id: task-report
    dependsOn: [task-analyze]
    steps:
      - id: step-write-report
        kind: shell
        command: "..."
```

### Key Concepts Demonstrated

| Concept              | Where                                 |
|----------------------|---------------------------------------|
| Sequential tasks     | `dependsOn` chains all 4 tasks        |
| Shell executor       | `kind: shell` — runs any shell command|
| Echo executor        | `kind: echo` with `metadata.message` |
| Real-time output     | stdout streams live as steps execute  |
| Structured results   | Final summary shows pass/fail per step|

## Extending the Demo

To use a real LLM (Claude, GPT-4, etc.), swap any `kind: shell` step for
`kind: claude` using the `@xskynet/plugin-claude` plugin:

```yaml
- id: step-real-analysis
  kind: claude
  metadata:
    prompt: "Analyze these search results: ..."
    model: claude-opus-4-5
```

## Troubleshooting

| Issue                     | Solution                                      |
|---------------------------|-----------------------------------------------|
| `xskynet: command not found` | Run `pnpm build` first, then `pnpm link --global` |
| `YAML parse error`        | Check for special chars (`*`, `&`) in commands |
| Build errors              | Ensure Node.js ≥ 18 and pnpm ≥ 8 are installed |
