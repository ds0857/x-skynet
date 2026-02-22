# X-Skynet

Open-source AI company orchestration framework, the evolved version of OpenClaw.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## Features
- Multi-backend agent runtime (Anthropic, OpenAI, local)
- Pluggable skills and channels
- Mission/step orchestration and scheduling
- Observability: events, logs, metrics
- Extensible SDK with batteries-included templates

## Architecture
- Core: task graph, scheduler, state
- Agents: role-specific workers with tools
- Skills: reusable capabilities
- Channels: web, chat, CLI
- Storage: files + adapters
- Policies: safety and governance

## Quick Start
1. Clone the repo
2. Install dependencies
3. Run the demo

## Roadmap
- v0.1: project skeleton
- v0.2: runners and schedulers
- v0.3: UI console
- v1.0: stable APIs
