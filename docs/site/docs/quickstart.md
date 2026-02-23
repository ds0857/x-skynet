# Quick Start

Get from zero to a running AI agent in **under 5 minutes**. No API keys required.

## Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org))
- **pnpm** ≥ 8 (`npm install -g pnpm`)

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/ds0857/x-skynet.git
cd x-skynet
```

⏱ *~30 seconds*

---

## Step 2 — Install Dependencies

```bash
pnpm install
```

This installs all workspace packages in one shot using pnpm's lockfile.

⏱ *~60 seconds*

---

## Step 3 — Build

```bash
pnpm build
```

Compiles TypeScript → JavaScript for all packages (core, CLI, plugins, examples).

⏱ *~30 seconds*

---

## Step 4 — Run Hello World

```bash
xskynet run examples/hello-world/demo.yaml
```

You should see:

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

⏱ *~5 seconds*

---

## Step 5 — Run the Research Agent Demo

```bash
xskynet run examples/research-agent/demo.yaml
```

This runs a full 4-task, 8-step research pipeline that simulates:
- Web search + academic paper lookup
- Framework scoring across 5 dimensions
- Markdown report generation

```
✔ Workflow "Research Agent Demo" completed successfully ✓
  ✓ Initialize Research Session
  ✓ Search and Gather Sources
  ✓ Analyze and Score Findings
  ✓ Write and Publish Report
```

⏱ *~10 seconds*

---

## What's Next?

| Goal                        | Resource                                              |
|-----------------------------|-------------------------------------------------------|
| Understand core concepts    | [Core Concepts](../guide/concepts)                   |
| Build your own workflow     | [Configuration Guide](../guide/configuration)        |
| Use a real LLM              | [Claude Plugin](../guide/plugins/claude)             |
| Browse full examples        | [`examples/`](https://github.com/ds0857/x-skynet/tree/main/examples) |
| See the Demo walkthrough    | [Demo Guide](./demo)                                 |

---

## Troubleshooting

### `xskynet: command not found`

The CLI binary isn't on your PATH. Run:

```bash
# From the repo root:
pnpm build
node packages/cli/dist/index.js run examples/hello-world/demo.yaml
```

Or link it globally:

```bash
cd packages/cli && npm link
```

### Build errors

Make sure Node.js ≥ 18 is active:

```bash
node --version   # should print v18.x or higher
pnpm --version   # should print 8.x or higher
```

### Workflow YAML parse errors

Avoid `*` and `&` characters in inline `command:` strings — they have special
meaning in YAML. Use `printf` or multi-character alternatives instead.
