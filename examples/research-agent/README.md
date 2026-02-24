# Research Agent Example

This example demonstrates a research‑oriented agent that:

- Decomposes a goal into parallelizable tasks
- Uses StepExecutors provided by plugins (e.g., web fetch, LLM calls)
- Aggregates artifacts and emits DomainEvents for observability

Status: Preview in Phase 2. The runnable agent will land incrementally.

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
xskynet agents run research-agent --input topic.json --log-level debug --output json
```

## See also

- ../../docs/cli-reference.md
- ../../docs/cli-agents.md
