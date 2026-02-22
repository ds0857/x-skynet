# Research Agent Example

This example simulates a multi-step research workflow similar to real X-Skynet use cases.

## Flow
- Define a 3-step research plan (topics + URLs)
- For each step, fetch content via an HTTP tool
- Aggregate short snippets into a final summary

## Run

1) Install deps at repo root

   pnpm install

2) Build

   pnpm --filter @xskynet/example-research-agent build

3) Run

   pnpm --filter @xskynet/example-research-agent start

## Output

Research Summary:
- Project X-Skynet overview: <snippet>
- Agent frameworks comparison: <snippet>
- Plugin architecture patterns: <snippet>
