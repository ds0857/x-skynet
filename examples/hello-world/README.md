# Hello World Example

The simplest possible X-Skynet workflow — a great starting point to verify your
installation and understand the YAML workflow format.

## What It Does

Runs two tasks in sequence:
1. **Greet** — prints "Hello, World!" using the `echo` executor
2. **System Info** — shows the current date and Node.js version using the `shell` executor

## Quick Start

```bash
# From the repo root:

# 1. Install dependencies
pnpm install

# 2. Build all packages
pnpm build

# 3. Run the workflow
xskynet run examples/hello-world/demo.yaml
```

## Expected Output

```
╔══════════════════════════════════════════════╗
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

## The Workflow File

```yaml
# examples/hello-world/demo.yaml
version: "1.0"
name: Hello World

tasks:
  - id: task-greet
    name: Greet
    steps:
      - id: step-echo
        name: Hello, World!
        kind: echo
        metadata:
          message: "Hello, World from X-Skynet! 🚀"

  - id: task-info
    name: System Info
    dependsOn:
      - task-greet
    steps:
      - id: step-date
        name: Show date and time
        kind: shell
        command: "echo \"Workflow ran at: $(date)\""

      - id: step-node
        name: Show Node.js version
        kind: shell
        command: "node --version"
```

## Key Concepts

| Concept         | Example                          | Description                         |
|-----------------|----------------------------------|-------------------------------------|
| `kind: echo`    | `step-echo`                      | Print a message, zero dependencies  |
| `kind: shell`   | `step-date`, `step-node`         | Run any shell command               |
| `dependsOn`     | `task-info` depends on `task-greet` | Declare task execution order    |
| `metadata`      | `message: "Hello, World!"`       | Pass config to the executor         |

## Running via TypeScript SDK

You can also run programmatically:

```typescript
import { XSkynetRuntime } from '@xskynet/core';
import { shellPlugin } from '@xskynet/plugin-shell';

const runtime = new XSkynetRuntime();
runtime.use(shellPlugin);

const result = await runtime.execute({
  id: 'hello-plan',
  name: 'Hello World',
  tasks: [
    {
      id: 'task-greet',
      name: 'Greet',
      status: 'pending',
      steps: [
        {
          id: 'step-echo',
          name: 'Hello, World!',
          kind: 'echo',
          status: 'pending',
          metadata: { message: 'Hello, World from X-Skynet! 🚀' },
        },
      ],
    },
  ],
});

console.log(result.status); // "succeeded"
```

```bash
# Run the TypeScript version
pnpm --filter @xskynet/example-hello-world start
```

## Next Steps

Once hello-world runs, try the [Research Agent Demo](../research-agent/) for a
more complete example showing dependency chains, shell tooling, and report
generation.

## Troubleshooting

| Issue                        | Solution                                          |
|------------------------------|---------------------------------------------------|
| `xskynet: command not found` | Run `pnpm build` first; then `npm link` the CLI   |
| `Module not found`           | Make sure you ran `pnpm install` at the repo root |
| Build errors                 | Node.js ≥ 20 and pnpm ≥ 9 are required           |
