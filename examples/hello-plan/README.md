# X-Skynet Hello Plan Example

This is the simplest example of using the X-Skynet agent framework. It demonstrates how to define and execute a single-task plan that makes an HTTP request.

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

This installs the required dependencies:
- `@xskynet/core` - The core runtime engine
- `@xskynet/plugin-http` - HTTP plugin for making web requests

## Usage

Run the example:

```bash
npm start
# or
npx ts-node index.ts
```

## Expected Output

```
Plan structure: {
  "id": "hello-plan-001",
  "title": "Hello X-Skynet",
  "status": "ready",
  "context": {
    "correlationId": "example-001",
    "variables": {
      "greeting": "Hello from X-Skynet!"
    }
  },
  "tasks": [
    {
      "id": "task-fetch",
      "kind": "http",
      "status": "queued",
      "steps": [
        {
          "id": "step-get",
          "kind": "http",
          "status": "pending",
          "retry": {
            "maxAttempts": 3,
            "backoff": "exponential"
          },
          "artifacts": [],
          "meta": {
            "url": "https://httpbin.org/json",
            "method": "GET"
          }
        }
      ]
    }
  ]
}

✅ X-Skynet Hello Plan ready to execute!
Install @xskynet/core and @xskynet/plugin-http to run this plan.
```

## What This Example Shows

1. **Plan Structure**: How to define a plan with metadata, context, and tasks
2. **Task Definition**: Creating an HTTP task with retry configuration
3. **Type Safety**: Using TypeScript for compile-time validation

## Next Steps

- Explore more examples in the `examples/` directory
- Read the [full documentation](https://xskynet.dev)
- Join our [Discord community](https://discord.gg/xskynet)

## License

Apache-2.0 © X-Skynet Team
