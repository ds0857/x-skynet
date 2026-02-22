# X-Skynet

Open-source AI agent orchestration framework — 15 minutes to your first running agent

[![CI](https://github.com/ds0857/x-skynet/actions/workflows/ci.yml/badge.svg)](https://github.com/ds0857/x-skynet/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/ts-TypeScript-3178c6)](https://www.typescriptlang.org/)

## Quick Start (5 steps)

1) Clone and install

   git clone https://github.com/ds0857/x-skynet.git
   cd x-skynet
   pnpm install

2) Explore the basic template

   See templates/basic — a minimal agent with config and comments

3) Run Hello World example

   pnpm --filter @xskynet/example-hello-world build
   pnpm --filter @xskynet/example-hello-world start

4) Run Research Agent example

   pnpm --filter @xskynet/example-research-agent build
   pnpm --filter @xskynet/example-research-agent start

5) Customize your agent

   Edit templates/basic/src/agent.ts and xskynet.config.ts, then iterate

## Features
- Plugin-first architecture with strict contracts (@xskynet/contracts)
- Engine and SDKs designed for observability and reproducibility
- Unified plan/task interface across LLM providers
- TypeScript-first developer experience
- Examples and templates to get productive fast

## Examples
- examples/hello-world — minimal agent run loop
- examples/research-agent — multi-step research flow with aggregation

## Templates
- templates/basic — starter template using @xskynet packages

## Contributing
Please see CONTRIBUTING.md (to be added).
