# X-Skynet

Open-source AI agent orchestration framework — 15 minutes to your first running agent

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/ts-TypeScript-3178c6)](https://www.typescriptlang.org/)
[![codecov](https://codecov.io/gh/ds0857/x-skynet/branch/main/graph/badge.svg)](https://codecov.io/gh/ds0857/x-skynet)

## Why X-Skynet

- Developer velocity: plugin-first architecture with strict, shared contracts so teams can ship fast with confidence
- Multi-backend: run agents on your preferred LLM providers with a unified plan/task interface
- Production ready: fully typed SDK contracts and an engine designed for observability and reproducibility

## Quick Start

See docs/Quickstart.md.

## Monorepo structure

- apps/
  - demo/ — minimal demo using @xskynet/core
- packages/
  - contracts/ — core domain contracts
  - core/ — engine/core helpers (currently minimal)
  - cli/ — CLI skeleton
  - plugin-claude/, plugin-http/, plugin-shell/ — plugin packages (skeletons)
  - tsconfig/ — shared tsconfig presets
  - eslint-config/ — shared ESLint config
  - prettier-config/ — shared Prettier config
  - viewer/ — DAG run viewer (vite)
- docs/
- examples/

## Scripts

- pnpm dev — build core then run demo
- pnpm lint — lint repository
- pnpm typecheck — project-wide typecheck
- pnpm test — run unit tests with coverage

## Contributing

Please see CONTRIBUTING.md (to be added).
