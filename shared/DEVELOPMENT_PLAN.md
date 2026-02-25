---
# id: Stable unique identifier for this doc (do not change)
id: development-plan-v0-1
# title: Human-readable title
title: X-Skynet Development Plan v1.0
# status: draft | review | approved
status: review
# owner: Primary accountable owner
owner: Mute (Deputy GM)
# lastUpdated: YYYY-MM-DD
lastUpdated: 2026-02-25
# version: Document version, not product
version: 1.0
# approvalGate: Required label/gate before merging updates
approvalGate: approved-by-nova
---

# X-Skynet Development Plan v1.0

Status: Review
Owner: Mute (Deputy GM)
Last Updated: 2026-02-25

Approval: Pending — requires 'approved-by-nova' sign-off.

## Table of Contents

- [Phase Overview](#phase-overview)
- [Phase 1 Detailed Tasks (P1-04/06/07/08)](#phase-1-detailed-tasks-p1-04060708)
- [Phase 2 Detailed Tasks](#phase-2-detailed-tasks)
- [Phase 3 Detailed Tasks](#phase-3-detailed-tasks)
- [Phase 4 Detailed Tasks](#phase-4-detailed-tasks)
- [Milestones & Deliverables](#milestones--deliverables)
- [Dependencies & Assumptions](#dependencies--assumptions)
- [Risks & Mitigations](#risks--mitigations)
- [Timeline (tentative)](#timeline-tentative)
- [Tracking](#tracking)
- [References](#references)

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
  - Enforce Node.js engine (>=20.11)
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
  - docs/Quickstart.md: 15‑min path to first running agent
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

## Phase 2 Detailed Tasks

### P2-01 — Contracts v1（计划/任务/步骤 类型契约）

- Scope
  - Define stable Typescript types: Plan, Task, Step, Run, Status, Result
  - Document state transitions and invariants (DAG, success/failure semantics)
  - Export from `@xskynet/contracts`
- Acceptance
  - [ ] Public types exported with TSD tests (tsd/ or dtslint‑style)
  - [ ] State transition diagram checked into docs (ASCII or mermaid)
  - [ ] Versioned: mark experimental where needed; semver noted

### P2-02 — Minimal executor（最小执行器）

- Scope
  - Deterministic DAG walker with serial + simple parallel lanes
  - Step lifecycle: prepare → execute → finalize
  - Cancellation, timeout, and basic retry loop
- Acceptance
  - [ ] Run a 3‑step demo plan from examples/
  - [ ] Unit tests cover success, failure, cancel paths
  - [ ] Structured logs (level, ts, runId, stepId)

### P2-03 — Plugin SDK & registry（插件 SDK 与注册表）

- Scope
  - Plugin interface: `init(ctx)`, `execute(step, ctx)`, hooks
  - Context contract: IO, logging, secrets, cancellation token
  - In‑process registry for resolving plugin by name
- Acceptance
  - [ ] Example plugins load via name (shell/http mock)
  - [ ] SDK documented in docs/cli-agents.md (or new SDK page)
  - [ ] Type tests validate plugin contracts

### P2-04 — Error model & retry semantics（错误模型与重试）

- Scope
  - Error taxonomy: retriable, fatal, user, infra
  - Backoff policy (exponential + jitter), max attempts, idempotency notes
  - Surface to CLI and logs with structured fields
- Acceptance
  - [ ] Unit tests for retryable vs fatal branches
  - [ ] Docs contain guidance for plugin authors

### P2-05 — Run persistence (MVP)（运行持久化）

- Scope
  - In‑memory store with JSON snapshot export/import
  - Interface abstracted for future adapters (FS/DB)
- Acceptance
  - [ ] CLI can export/import a run snapshot
  - [ ] Tests verify snapshot round‑trip

## Phase 3 Detailed Tasks

### P3-01 — CLI MVP（命令行工具）

- Scope
  - `@xskynet/cli` with commands: `xsk plan run`, `xsk task list`, `xsk run inspect`
  - Config discovery, workspace awareness, colored logs
- Acceptance
  - [ ] Run demo plan via CLI
  - [ ] Help output and examples present

### P3-02 — Built‑in plugins（内置插件）

- Scope
  - `shell` plugin: spawn commands with timeouts
  - `http` plugin: fetch/POST with json, headers, retries
  - `claude` plugin: adapter skeleton with provider‑agnostic interface
- Acceptance
  - [ ] Example plan uses at least two plugins
  - [ ] Unit tests for each plugin happy path and failure path

### P3-03 — Run Viewer（运行可视化）

- Scope
  - Minimal TUI or web viewer to render DAG and step logs
  - Link from CLI to open viewer
- Acceptance
  - [ ] Viewer renders DAG from snapshot
  - [ ] Works locally across platforms (macOS/Linux; Windows best‑effort)

## Phase 4 Detailed Tasks

### P4-01 — Observability & hardening（可观测性与加固）

- Scope
  - Tracing hooks and correlation IDs
  - Structured logs, redaction rules for secrets
  - Retry, idempotency, and cancellation verified in stress tests
- Acceptance
  - [ ] > 80% statement coverage across core and contracts
  - [ ] Load test shows stable behavior with 50 concurrent steps

### P4-02 — Docs & examples（文档与示例）

- Scope
  - Expand docs site; end‑to‑end examples under examples/
  - Contributor guide updates; release checklist
- Acceptance
  - [ ] Quickstart runs green against v1 engine/CLI
  - [ ] Examples pass in CI

### P4-03 — Release process（发布流程）

- Scope
  - Release‑it config, changelog, tags, semver policy
  - Codecov gates enforced; branch protections updated
- Acceptance
  - [ ] Dry‑run release works end‑to‑end
  - [ ] PR template and CI checks in place

## Milestones & Deliverables

1. M1: Repo Ready (end of Phase 1)
   - Deliverables: pnpm monorepo configured, scripts passing, CI skeleton, Quickstart
   - Acceptance: `pnpm i && pnpm typecheck && pnpm test` succeeds locally and in CI

2. M2: Contracts & Minimal Engine (mid Phase 2)
   - Deliverables: `@xskynet/contracts` types; `@xskynet/core` minimal executor; example demo; plugin SDK v1
   - Acceptance: A sample plan with 3 steps runs deterministically; unit tests cover state transitions

3. M3: CLI & Essential Plugins (end Phase 3)
   - Deliverables: `@xskynet/cli` commands; plugins (claude/http/shell); viewer renders DAG + logs
   - Acceptance: Run a plan via CLI using plugins; viewer shows run graph and logs

4. M4: Reliability & Docs (end Phase 4)
   - Deliverables: Tracing hooks, structured logs, retry policy, idempotency; examples; docs site and release scripts
   - Acceptance: > 80% statement coverage across core and contracts; examples run end‑to‑end

## Dependencies & Assumptions

- Tooling: Node 20.11+, pnpm 9.x, GitHub Actions runners (ubuntu‑latest)
- Secrets management: Local env for dev; GH OIDC/Secrets for CI (no plaintext tokens in repo)
- External services: Optional Codecov for coverage; LLM providers behind adapter; network egress in CI
- OS targets: macOS/Linux primary; Windows best‑effort for CLI and shell plugin

## Risks & Mitigations

- Scope creep
  - Mitigation: Track via issues/milestones; gate merges behind milestones
- API churn across packages
  - Mitigation: Version contracts; mark experimental; document breaking changes
- Cross‑package build/test complexity
  - Mitigation: Enforce TypeScript project references; CI matrix; cache pnpm store
- Provider limits and rate‑limits (LLM/http)
  - Mitigation: Backoff policies; test with stub/mocks; offline fixtures
- Security (token leakage in logs)
  - Mitigation: Redaction rules; secret fields in context; review logging

## Timeline (tentative)

- Week 1: Phase 1 (P1‑04/06/07/08)
- Weeks 2‑3: Phase 2
- Weeks 3‑4: Phase 3
- Weeks 4‑5: Phase 4

## Tracking

- Issues and milestones in GitHub
- CI via GitHub Actions

## References

- Public mirror: ../docs/DEVELOPMENT_PLAN.md
- Assignments (public mirror): ../docs/ASSIGNMENTS.md
- Release readiness checklist: ../docs/release-readiness.md
- CI status checks and Codecov gates: ../docs/ci-status-checks.md
- CLI agents design: ../docs/cli-agents.md
- Contracts package (placeholder): ../packages/contracts/
