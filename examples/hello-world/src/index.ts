/*
  Hello World example:
  - Create an agent
  - Execute a single step
  - Print the result

  This example uses the intended API shape. Adjust imports if SDK paths differ.
*/
import { Agent } from '@xskynet/sdk-js';
import { defineTool } from '@xskynet/core';

const echo = defineTool({
  name: 'echo',
  description: 'Echo back the input',
  async execute(input: { text: string }) {
    return { text: input.text };
  }
});

async function main() {
  const agent = new Agent({ name: 'hello-agent', tools: [echo] });

  const result = await agent.run({ goal: 'Say hello', input: { text: 'Hello, world!' } });
  console.log('Result:', result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
