# X-Skynet Development Plan v0.1

Status: Draft
Owner: Mute (Deputy GM)
Last Updated: 2026-02-23

## Phase Overview

- Phase 1 — Bootstrap & Foundations (Week 1)
  - Repo hygiene, monorepo wiring, CI skeleton, docs seed
- Phase 2 — Core Engine & Contracts (Weeks 2-3)
  - Stable task/plan contracts, minimal executor, plugin API
- Phase 3 — CLI, Plugins, and Viewer (Weeks 3-4)
  - CLI UX, built-in plugins (claude/http/shell), run viewer
- Phase 4 — Reliability, Docs, and Examples (Weeks 4-5)
  - Observability, test coverage, examples, release process

## Milestones & Deliverables

1. M1: Repo Ready (end of Phase 1)

- Deliverables:
  - pnpm monorepo configured with TS project references
  - Lint, format, typecheck scripts passing
  - CI: lint + test + typecheck on PR; codecov upload
  - Docs: Quickstart, contribution guide skeleton
- Acceptance:
  - `pnpm i && pnpm typecheck && pnpm test` succeeds locally and in CI

2. M2: Contracts & Minimal Engine (mid Phase 2)

- Deliverables:
  - @xskynet/contracts: Plan, Task, Step types with clear state model
  - @xskynet/core: Minimal executor that can run a simple plan
  - Example in apps/demo showing plan execution
- Acceptance:
  - A sample plan with 3 steps runs deterministically; unit tests cover state transitions

3. M3: CLI & Essential Plugins (end Phase 3)

- Deliverables:
  - @xskynet/cli: `xsk plan run`, `xsk task list` basic commands
  - Plugins: claude, http, shell with typed interfaces
  - Viewer app renders DAG and step logs
- Acceptance:
  - Run a plan via CLI using plugins; viewer shows the run graph and logs

4. M4: Reliability & Docs (end Phase 4)

- Deliverables:
  - Tracing hooks, structured logs, retry policy, idempotency keys
  - Examples: multi-agent workflow, web-crawl workflow
  - Docs site pages: Architecture, Contracts, Plugins, CLI, Viewer
- Acceptance:
  - > 80% statement coverage across core and contracts; examples run end-to-end

## Timeline (tentative)

- Week 1: Phase 1
- Weeks 2-3: Phase 2
- Weeks 3-4: Phase 3
- Weeks 4-5: Phase 4

## Risks & Mitigations

- Scope creep: track via issues and PRs; milestone gates
- API churn: version contracts and mark experimental symbols
- Cross-package builds: enforce references and CI matrix

## Tracking

- Issues and milestones in GitHub
- CI via GitHub Actions (to be added)
