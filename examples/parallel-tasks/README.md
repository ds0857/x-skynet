# Parallel Tasks Example

This example illustrates distributing multiple independent Steps concurrently and then joining their results.

Status: Preview in Phase 2. The runnable example will land incrementally.

## Try it today (repo root)

Install and sanity check your environment:

```bash
pnpm i
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

## Planned command shape (once runnable)

```bash
xskynet agents run parallel-tasks --input fanout.json --log-level info
```

## See also

- ../../docs/cli-reference.md
- ../../docs/cli-agents.md
