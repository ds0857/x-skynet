# X-Skynet Quickstart (15 minutes)

This guide gets you to a running demo in ~15 minutes.

## Prerequisites

- Node.js 20.11+
- Corepack enabled (`corepack enable`)

All commands run from the repo root unless noted.

## 1) Install

```bash
pnpm i
```

## 2) Run the demo

```bash
pnpm dev
```

This builds `@xskynet/core` and starts `apps/demo`.

Expected output (trimmed):

```text
Hello, X-Skynet Developer!
```

## 3) Preview CLI help (one‑liner)

Until the CLI is fully wired, you can preview the planned help text:

```bash
node packages/cli/bin/preview-help.js
```

Expected output (snippet):

```text
X-Skynet CLI (experimental)

Usage:
  xskynet <command> [options]
```

See the full command surface and options in:

- [CLI reference](./cli-reference.md)
- [CLI: agents design](./cli-agents.md)

## 4) Lint, typecheck, and test

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Example success snippets (will vary by environment):

```text
# typecheck
Found 0 errors. Watching for file changes.

# test (vitest)
Test Files  1 passed
Tests       1 passed
```

## 5) Explore

- Contracts: `packages/contracts`
- Core library: `packages/core`
- CLI (preview): `packages/cli`

Additional docs:

- [CLI reference](./cli-reference.md)
- [CLI: agents design](./cli-agents.md)
- [Logging](./logging.md)
