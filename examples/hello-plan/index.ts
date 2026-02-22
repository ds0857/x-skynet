/**
 * X-Skynet Hello Plan Example
 *
 * This example shows the simplest possible X-Skynet usage:
 * a single-task plan that makes an HTTP request.
 *
 * Run: npx ts-node index.ts
 */

// Note: In production, import from installed packages
// import { XSkynetRuntime } from '@xskynet/core';
// import { createHttpPlugin } from '@xskynet/plugin-http';

// For this example, we'll simulate the runtime behavior
const plan = {
  id: 'hello-plan-001',
  title: 'Hello X-Skynet',
  status: 'ready' as const,
  context: {
    correlationId: 'example-001',
    variables: { greeting: 'Hello from X-Skynet!' },
  },
  tasks: [
    {
      id: 'task-fetch',
      kind: 'http',
      status: 'queued' as const,
      steps: [
        {
          id: 'step-get',
          kind: 'http',
          status: 'pending' as const,
          retry: { maxAttempts: 3, backoff: 'exponential' as const },
          artifacts: [],
          meta: {
            url: 'https://httpbin.org/json',
            method: 'GET',
          },
        }
      ],
    }
  ],
};

console.log('Plan structure:', JSON.stringify(plan, null, 2));
console.log('\n✅ X-Skynet Hello Plan ready to execute!');
console.log('Install @xskynet/core and @xskynet/plugin-http to run this plan.');
