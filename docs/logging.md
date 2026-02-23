# Logging and Run Correlation (preview)

This document describes the logging model used by the CLI and runtime to provide high‑signal, queryable traces of agent activity.

## Goals
- Human‑readable by default, structured when needed
- Correlate logs across Run → Task → Step
- Support real‑time tailing and post‑hoc analysis

## Log levels
- trace: very noisy internal events
- debug: development diagnostics
- info: normal operational messages
- warn: unexpected but non‑fatal
- error: failures and user‑visible errors

## Formats
- pretty: colorized, aligned columns, for terminals
- json: newline‑delimited JSON objects, each with a consistent schema

## Core fields (JSON)
- timestamp (ISO‑8601)
- level (trace|debug|info|warn|error)
- module (string)
- runId (string)
- taskId (string | optional)
- stepId (string | optional)
- message (string)
- data (object | optional)

## Emission points
- CLI command handlers (argument parsing, validation, I/O)
- Engine events (domain events from @xskynet/core)
- Plugin executors (plugin‑specific diagnostics)

## Configuration
Configured via flags or env vars:
- --log-level / XSKYNET_LOG_LEVEL
- --log-format / XSKYNET_LOG_FORMAT
- --log-file / XSKYNET_LOG_FILE

When --log-file is set, logs are tee’d to the specified path and stdout. JSON format is recommended when shipping to log collectors.

## Storage
- Each run writes an index under `.xskynet/runs/<runId>/`
- `logs.ndjson` contains the structured log stream
- Artifacts and metadata live alongside logs for reproducibility

## Tailing
The CLI will support `xskynet agents logs <runId> --follow` which:
- Subscribes to the run’s event bus
- Formats and prints incoming log records
- Supports level filtering to reduce noise

## Future work
- Source maps and linkable errors for better DX
- OpenTelemetry exporter
- Per‑module verbosity controls
