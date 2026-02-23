# CLI: agents subcommand (preview)

Status: Experimental in Phase 2. This document captures the intended UX and flags so early adopters can prepare scripts and tooling. Implementation will land incrementally.

## Overview

The `xskynet agents` family of commands is the primary CLI surface for:
- Listing available agents in your app
- Running an agent with an input and capturing outputs
- Inspecting runs and tailing logs

Target design goals:
- One-liner to run any agent in your workspace
- Deterministic runs with reproducible inputs/outputs
- First-class, structured logs with run/task/step correlation IDs

## Commands (planned)

- `xskynet agents list`
  - Discover agents exported by your app (or a template)
  - Output: table or JSON (`--output json`)

- `xskynet agents run <agent-name> [--input <path>|--stdin]`
  - Execute the specified agent with provided input
  - Persists a Run record (ID, status, timestamps)
  - Emits structured logs; artifacts saved to `.xskynet/runs/<runId>/`

- `xskynet agents show <run-id>`
  - Print run metadata, status, and artifacts
  - `--output json` for machine consumption

- `xskynet agents logs <run-id> [--follow]`
  - Stream or print logs for a run
  - Supports filtering by level/module

## Common flags

- `--log-level <level>`: trace | debug | info | warn | error (default: info)
- `--log-format <format>`: json | pretty (default: pretty in TTY, json otherwise)
- `--log-file <path>`: also tee logs to a file
- `--output <format>`: table | json (for list/show)
- `--cwd <path>`: working directory for agent resolution

Environment variables (fallbacks):
- `XSKYNET_LOG_LEVEL`
- `XSKYNET_LOG_FORMAT`
- `XSKYNET_LOG_FILE`

## Examples

List agents:

```bash
xskynet agents list --output table
```

Run an agent with JSON input from a file and verbose logs:

```bash
xskynet agents run researcher --input input.json --log-level debug --log-format json
```

Tail logs for a run:

```bash
xskynet agents logs <runId> --follow --log-level info
```

## Exit codes
- 0: success
- 1: runtime error (agent failed)
- 2: invalid input/flags
- 3: not found (agent or run)

## Notes
- The CLI is a thin orchestration layer that uses SDK contracts from `@xskynet/contracts` and engine facilities from `@xskynet/core`.
- Logging behavior is described in detail in docs/logging.md.
