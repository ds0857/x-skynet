/*
  Research Agent example simulating a real X-Skynet use case.

  What it does:
  - Defines a simple research plan with 3 subtasks
  - Each subtask uses an HTTP fetch tool to gather data
  - Aggregates the findings into a concise summary

  Note: This demonstrates the intended flow and API; adjust imports to match current SDK.
*/
import { Agent } from '@xskynet/sdk-js';
import { defineTool } from '@xskynet/core';

// A mocked HTTP fetch tool; replace with @xskynet/plugin-http when available
const httpGet = defineTool({
  name: 'http.get',
  description: 'Fetch a URL and return text',
  async execute(input: { url: string }) {
    // In real usage, call the plugin's fetch. Here we simulate.
    const res = await fetch(input.url);
    const text = await res.text();
    return { text };
  }
});

async function main() {
  const agent = new Agent({ name: 'research-agent', tools: [httpGet] });

  const plan = [
    { id: 't1', topic: 'Project X-Skynet overview', url: 'https://example.com' },
    { id: 't2', topic: 'Agent frameworks comparison', url: 'https://example.com' },
    { id: 't3', topic: 'Plugin architecture patterns', url: 'https://example.com' },
  ];

  const results: Array<{ id: string; topic: string; snippet: string }> = [];

  for (const step of plan) {
    const output = await agent.run({
      goal: `Research: ${step.topic}`,
      input: { url: step.url },
      tool: 'http.get'
    });

    // Truncate the fetched text to a short snippet for demo
    const text = (output.text ?? '').slice(0, 120).replace(/\s+/g, ' ');
    results.push({ id: step.id, topic: step.topic, snippet: text });
  }

  const summary = results.map(r => `- ${r.topic}: ${r.snippet}`).join('\n');
  console.log('Research Summary:\n' + summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
