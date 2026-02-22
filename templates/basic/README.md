# X-Skynet Basic Template

A minimal template to bootstrap an agent using the X-Skynet framework.

## Quick Start (5 steps)

1) Install deps

   pnpm install

2) Build

   pnpm --filter @xskynet/template-basic build

3) Configure (optional)

   Edit templates/basic/xskynet.config.ts

4) Run in dev

   pnpm --filter @xskynet/template-basic dev

5) Expect output

   Result: { text: 'Hello from X-Skynet!' }

## Files
- package.json — template package using @xskynet packages
- src/agent.ts — minimal agent example
- xskynet.config.ts — configuration template with comments
- tsconfig.json
