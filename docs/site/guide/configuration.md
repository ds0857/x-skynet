# Configuration

X-Skynet is configured via `xskynet.config.ts` at the root of your project. This file is loaded by the CLI and by the runtime when you call `XSkynetRuntime.loadConfig()`.

---

## Minimal configuration

```typescript
// xskynet.config.ts
import { defineConfig } from '@xskynet/core'
import { shellPlugin } from '@xskynet/plugin-shell'

export default defineConfig({
  plugins: [shellPlugin],
})
```

---

## Full configuration reference

```typescript
// xskynet.config.ts
import { defineConfig } from '@xskynet/core'
import { shellPlugin } from '@xskynet/plugin-shell'
import { httpPlugin } from '@xskynet/plugin-http'

export default defineConfig({
  // ── Plugins ──────────────────────────────────────────────────────────────
  // List of XSkynetPlugin instances to register with the runtime.
  // Plugins are registered in order; later plugins override executors with
  // the same `kind`.
  plugins: [
    shellPlugin,
    httpPlugin,
  ],

  // ── Events ───────────────────────────────────────────────────────────────
  events: {
    // Where to persist events (NDJSON / JSONL format).
    // Defaults to .xskynet/events.jsonl
    storePath: '.xskynet/events.jsonl',

    // Set to false to disable file persistence (in-memory only).
    persist: true,

    // Maximum number of events to keep in the in-memory ring buffer.
    // Older events are still on disk; this controls RAM usage only.
    maxHistory: 1000,
  },

  // ── Execution defaults ───────────────────────────────────────────────────
  execution: {
    // Default environment tag propagated to RunContext.
    // Can be overridden per runtime.execute() call.
    env: process.env.NODE_ENV ?? 'dev',

    // Maximum parallel tasks within a single batch.
    // 0 = unlimited (default).
    maxParallelism: 0,

    // Default timeout (ms) for the entire plan execution.
    // Individual steps can override via step.metadata.timeout.
    timeoutMs: 600_000, // 10 minutes
  },

  // ── Logging ──────────────────────────────────────────────────────────────
  logging: {
    // Log level: 'silent' | 'error' | 'warn' | 'info' | 'debug'
    level: process.env.XSKYNET_LOG_LEVEL ?? 'info',

    // Structured JSON logs (useful in CI / cloud environments).
    json: process.env.XSKYNET_JSON === '1',
  },

  // ── Observability ────────────────────────────────────────────────────────
  // (optional) Hook into the event stream for external telemetry.
  // The handler receives every domain event.
  onEvent: async (event) => {
    // Example: send to an HTTP endpoint
    // await fetch('https://telemetry.example.com/events', {
    //   method: 'POST',
    //   body: JSON.stringify(event),
    // })
  },
})
```

---

## Environment variables

X-Skynet respects the following environment variables, which override config file values:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment tag (`dev` / `staging` / `prod`) | `dev` |
| `XSKYNET_JSON` | Enable JSON-lines output mode | `''` (disabled) |
| `XSKYNET_LOG_LEVEL` | Log verbosity | `info` |
| `NO_COLOR` | Disable ANSI colour in CLI output | `''` (colours on) |
| `XSKYNET_VERBOSE` | Verbose mode (alias for `XSKYNET_LOG_LEVEL=debug`) | `''` |
| `XSKYNET_EVENTS_PATH` | Override events file path | `.xskynet/events.jsonl` |

---

## Per-plugin configuration

Plugins typically expose a factory function that accepts configuration:

```typescript
import { createShellPlugin } from '@xskynet/plugin-shell'

export default defineConfig({
  plugins: [
    createShellPlugin({
      // Default working directory for shell steps that don't specify one
      defaultCwd: '/workspace',
      // Default timeout (ms) for shell steps
      defaultTimeout: 30_000,
    }),
  ],
})
```

---

## TypeScript paths

The scaffolded `tsconfig.json` already includes the right path mappings. If you add packages manually, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "strict": true,
    "paths": {
      "@xskynet/contracts": ["./node_modules/@xskynet/contracts/src/index.ts"],
      "@xskynet/core": ["./node_modules/@xskynet/core/src/index.ts"]
    }
  }
}
```

---

## Multiple environments

A common pattern is to export different configs based on `NODE_ENV`:

```typescript
// xskynet.config.ts
import { defineConfig } from '@xskynet/core'
import { shellPlugin } from '@xskynet/plugin-shell'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [shellPlugin],
  execution: {
    env: isProd ? 'prod' : 'dev',
    maxParallelism: isProd ? 4 : 0,
    timeoutMs: isProd ? 120_000 : 600_000,
  },
  logging: {
    level: isProd ? 'warn' : 'debug',
    json: isProd,
  },
})
```

---

## CLI configuration flags

The CLI accepts a few global flags that override config values:

```bash
xskynet run src/agent.ts \
  --config ./custom.config.ts \
  --verbose \
  --json
```

| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to config file (default: `xskynet.config.ts`) |
| `--verbose` | Enable verbose logging |
| `--json` | Output structured JSON lines |
| `--no-color` | Disable colour in output |

---

## State file

The runtime writes a local state file to `.xskynet/state.json`. You can read it with `xskynet status` or inspect it directly:

```bash
cat .xskynet/state.json
# {
#   "agents": [
#     { "id": "agent-001", "status": "running", "startedAt": "…" }
#   ],
#   "lastRun": "2026-02-23T10:00:00.000Z"
# }
```

Both `.xskynet/state.json` and `.xskynet/events.jsonl` are local — they're gitignored by default in scaffolded projects.
