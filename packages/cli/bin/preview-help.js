#!/usr/bin/env node

const help = `
X-Skynet CLI (experimental)

Usage:
  xskynet <command> [options]

Commands:
  agents list                        List available agents
  agents run <agent> [--input <path> | --stdin]
                                     Run an agent with input
  agents show <run-id>               Show run metadata
  agents logs <run-id> [--follow]    Tail run logs

Global options:
  --log-level <level>    trace|debug|info|warn|error (default: info)
  --log-format <format>  json|pretty (default: pretty in TTY, json otherwise)
  --log-file <path>      Also tee logs to a file
  --output <format>      table|json (for list/show)
  --cwd <path>           Working directory for agent resolution
  -h, --help             Show help
  -v, --version          Show version

Environment (fallbacks):
  XSKYNET_LOG_LEVEL
  XSKYNET_LOG_FORMAT
  XSKYNET_LOG_FILE

Exit codes:
  0  success
  1  runtime error (agent failed)
  2  invalid input/flags
  3  not found (agent or run)

Notes:
  This is a preview of the planned CLI UX. Behavior will land incrementally.
`;

console.log(help);
