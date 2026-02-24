# X-Skynet CLI Reference (Preview)

Status: Experimental in Phase 2/3. This page documents the intended command surface and help text so early adopters can prepare scripts. Actual behavior will land incrementally with no breaking changes.

## Overview

The `xskynet` command is the entry point for interacting with agents from the terminal. It focuses on:

- Discovering agents in your workspace
- Running an agent with structured inputs/outputs
- Inspecting runs and tailing logs

See also: ./cli-agents.md for deeper background on the `agents` command family.

## Usage

```
xskynet <command> [options]
```

## Commands

- `agents list`
  - Discover agents exported by your app (or a template)
  - Output: table or JSON (`--output json`)

- `agents run <agent> [--input <path> | --stdin]`
  - Execute the specified agent with provided input
  - Persists a Run record (ID, status, timestamps)
  - Emits structured logs; artifacts saved to `.xskynet/runs/<runId>/`

- `agents show <run-id>`
  - Print run metadata, status, and artifacts
  - `--output json` for machine consumption

- `agents logs <run-id> [--follow]`
  - Stream or print logs for a run
  - Supports filtering by level/module

## Global options

- `--log-level <level>`: trace | debug | info | warn | error (default: info)
- `--log-format <format>`: json | pretty (default: pretty in TTY, json otherwise)
- `--log-file <path>`: also tee logs to a file
- `--output <format>`: table | json (for list/show)
- `--cwd <path>`: working directory for agent resolution
- `-h, --help`: show help
- `-v, --version`: show version

Environment fallbacks:

- `XSKYNET_LOG_LEVEL`
- `XSKYNET_LOG_FORMAT`
- `XSKYNET_LOG_FILE`

## Exit codes

- `0` success
- `1` runtime error (agent failed)
- `2` invalid input/flags
- `3` not found (agent or run)

## Examples

List agents:

```
xskynet agents list --output table
```

Run an agent with JSON input from a file and verbose logs:

```
xskynet agents run researcher --input input.json --log-level debug --log-format json
```

Tail logs for a run:

```
xskynet agents logs <runId> --follow --log-level info
```

## Notes

- The CLI is a thin orchestration layer that uses SDK contracts from `@xskynet/contracts` and engine facilities from `@xskynet/core`.
- Logging behavior is described in detail in docs/logging.md.
- Until commands are fully implemented, you can preview the planned help text by running:

```
node packages/cli/bin/preview-help.js
```
