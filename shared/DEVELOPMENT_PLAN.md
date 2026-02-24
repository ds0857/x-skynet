---
# id: Stable unique identifier for this doc (do not change)
id: development-plan-v0-1
# title: Human-readable title
title: X-Skynet Development Plan v0.1
# status: draft | review | approved
status: draft
# owner: Primary accountable owner
owner: Mute (Deputy GM)
# lastUpdated: YYYY-MM-DD
lastUpdated: 2026-02-24
# version: Document version, not product
version: 0.1
# approvalGate: Required label/gate before merging updates
approvalGate: approved-by-nova
---

# X-Skynet Development Plan v0.1

Status: Draft
Owner: Mute (Deputy GM)
Last Updated: 2026-02-24

Approval: Pending — requires 'approved-by-nova' sign-off.

## Table of Contents

- [Phase Overview](#phase-overview)
- [Phase 1 Detailed Tasks (P1-04/06/07/08)](#phase-1-detailed-tasks-p1-04060708)
- [Milestones & Deliverables](#milestones--deliverables)
- [Timeline (tentative)](#timeline-tentative)
- [Risks & Mitigations](#risks--mitigations)
- [Tracking](#tracking)
- [References](#references)
- [TODOs](#todos)
- [Templates](#templates)

## Phase Overview

- Phase 1 — Bootstrap & Foundations (Week 1)
  - Repo hygiene, monorepo wiring, CI skeleton, docs seed
- Phase 2 — Core Engine & Contracts (Weeks 2-3)
  - Stable task/plan contracts, minimal executor, plugin API
- Phase 3 — CLI, Plugins, and Viewer (Weeks 3-4)
  - CLI UX, built-in plugins (claude/http/shell), run viewer
- Phase 4 — Reliability, Docs, and Examples (Weeks 4-5)
  - Observability, test coverage, examples, release process

## Phase 1 Detailed Tasks (P1-04/06/07/08)

Below are the Phase 1 tasks with scope, estimates, and acceptance criteria.

### P1-04 — Repo hygiene & scripts（仓库卫生与脚本）

- Scope（范围）
  - Root scripts for build, typecheck, lint, test, dev
  - Enforce Node.js engine (>=20.11), Volta pin
  - Prettier, ESLint wiring; shared config packages
  - Husky + lint-staged pre-commit hooks
- Estimate（预估）: 0.5–1.0 day
- Acceptance（验收标准）
  - [ ] `pnpm i` succeeds on Node 20.11+
  - [ ] `pnpm typecheck` passes across workspaces
  - [ ] `pnpm lint` passes at repo root
  - [ ] `pnpm test` runs and produces coverage report
  - [ ] Pre-commit runs lint-staged (no failing hooks)

### P1-06 — Quickstart + README（快速开始与首页文档）

- Scope（范围）
  - docs/Quickstart.md: 15-min path to first running agent
  - README: repository structure, scripts, contribution pointers
  - Ensure demo and CLI notes are discoverable
- Estimate（预估）: 0.5 day
- Acceptance（验收标准）
  - [ ] Following Quickstart yields a running demo or CLI action
  - [ ] README reflects current monorepo layout and scripts
  - [ ] Links to CONTRIBUTING and examples are valid

### P1-07 — Basic tests scaffold（基础测试脚手架）

- Scope（范围）
  - Vitest configured; coverage via @vitest/coverage-v8
  - At least one example unit test under tests/
  - Test runner wired in root `pnpm test`
- Estimate（预估）: 0.5 day
- Acceptance（验收标准）
  - [ ] `pnpm test` exits 0 and prints coverage summary
  - [ ] Example test passes in CI and locally

### P1-08 — CI skeleton（CI 骨架）

- Scope（范围）
  - GitHub Actions workflow for PRs and main
  - Jobs: install → typecheck → lint → test (+ coverage upload)
  - Optional: Codecov upload and status badge
- Estimate（预估）: 0.5–1.0 day
- Acceptance（验收标准）
  - [ ] CI runs on push/PR to default branch
  - [ ] All jobs pass with current codebase
  - [ ] Coverage artifact uploaded; badge visible in README (optional)

## Milestones & Deliverables

1. M1: Repo Ready (end of Phase 1)
   - Deliverables: pnpm monorepo configured, scripts passing, CI skeleton, Quickstart
   - Acceptance: `pnpm i && pnpm typecheck && pnpm test` succeeds locally and in CI

2. M2: Contracts & Minimal Engine (mid Phase 2)
   - Deliverables: @xskynet/contracts (Plan/Task/Step types); @xskynet/core minimal executor; example demo
   - Acceptance: A sample plan with 3 steps runs deterministically; unit tests cover state transitions

3. M3: CLI & Essential Plugins (end Phase 3)
   - Deliverables: @xskynet/cli (`xsk plan run`, `xsk task list`); plugins (claude/http/shell); viewer app renders DAG + logs
   - Acceptance: Run a plan via CLI using plugins; viewer shows run graph and logs

4. M4: Reliability & Docs (end Phase 4)
   - Deliverables: Tracing hooks, structured logs, retry policy, idempotency; examples; docs site
   - Acceptance: > 80% statement coverage across core and contracts; examples run end-to-end

## Timeline (tentative)

- Week 1: Phase 1 (P1-04/06/07/08)
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

## Templates

### Task Template (example)

```
### <PHASE>-<ID> — <Title>（中文标题）

- Scope（范围）
  - <bullet points>
- Estimate（预估）: <days>
- Acceptance（验收标准）
  - [ ] <checkbox criteria>
```

### Milestone Template

```
- M<id>: <Milestone Name>
  - Deliverables: <list>
  - Acceptance: <acceptance summary>
```

## References

- Public mirror: ../docs/DEVELOPMENT_PLAN.md
- Assignments (public mirror): ../docs/ASSIGNMENTS.md
- Release readiness checklist: ../docs/release-readiness.md
- CI status checks and Codecov gates: ../docs/ci-status-checks.md
- RFC-0002: Contracts (types): ../packages/contracts/src/index.ts

## TODOs

- [ ] Phase 2 breakdown: contracts package structure and versioning strategy
- [ ] Define plugin lifecycle hooks and error handling semantics
- [ ] Add CI matrix for OS/Node versions
- [ ] Mirror to docs/ on release via script
