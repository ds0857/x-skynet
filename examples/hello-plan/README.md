# Hello Plan (Example)

Status: Preview in Phase 2. This example will ship as a runnable agent soon. Use the steps below to verify your environment today and preview the CLI.

## Prerequisites

- Node.js 20.11+
- Corepack enabled (`corepack enable`)

## Run today (repo root)

Install dependencies:

```bash
pnpm i
```

Run the demo app (sanity check):

```bash
pnpm dev
```

Expected output (trimmed):

```text
Hello, X-Skynet Developer!
```

Preview the CLI help (one‑liner):

```bash
node packages/cli/bin/preview-help.js
```

Expected output (snippet):

```text
X-Skynet CLI (experimental)

Usage:
  xskynet <command> [options]
```

## Planned command shape (when this example lands)

```bash
xskynet agents run hello-plan --input input.json --log-level info
```

## See also

- ../../docs/cli-reference.md
- ../../docs/cli-agents.md
