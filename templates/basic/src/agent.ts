/*
  Minimal X-Skynet agent example.
  Concepts shown:
  - Define an agent with a simple tool
  - Run a single task and print the result

  Replace the imports below with the actual SDK packages once available in this repo.
*/

// These imports reflect intended API shape and may be updated once SDK stabilizes
import { Agent } from '@xskynet/sdk-js';
import { defineTool } from '@xskynet/core';

// Define a trivial tool
const echo = defineTool({
  name: 'echo',
  description: 'Echo back the input',
  async execute(input: { text: string }) {
    return { text: input.text };
  }
});

async function main() {
  const agent = new Agent({
    name: 'basic-agent',
    tools: [echo]
  });

  const result = await agent.run({
    goal: 'Say hello',
    input: { text: 'Hello from X-Skynet!' }
  });

  console.log('Result:', result);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
