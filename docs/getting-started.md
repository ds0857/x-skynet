# Getting Started with X-Skynet

## Prerequisites
- Node.js >= 20
- pnpm >= 9

## Installation
```bash
npm install @xskynet/core @xskynet/plugin-claude
```

## Your First Agent Plan
```typescript
import { XSkynetRuntime } from '@xskynet/core';
import { createClaudePlugin } from '@xskynet/plugin-claude';

const runtime = new XSkynetRuntime();
runtime.use(createClaudePlugin({ apiKey: process.env.ANTHROPIC_API_KEY! }));

const plan = {
  id: 'my-first-plan',
  title: 'Hello X-Skynet',
  status: 'ready',
  context: {},
  tasks: [{
    id: 'task-1',
    kind: 'claude',
    status: 'queued',
    prompt: 'Say hello and explain what X-Skynet is in one sentence.',
    steps: [],
  }],
};

const result = await runtime.execute(plan);
console.log(result);
```

## Next Steps
- [Building your first plugin](./plugin-guide.md)
- [Plan & Task reference](./api-reference.md)
- [Architecture overview](./architecture.md)