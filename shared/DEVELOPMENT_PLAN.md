---
version: 1.0
status: stable
last_updated: 2026-03-01
owner: Mute (Deputy GM)
mirrors:
  - docs/DEVELOPMENT_PLAN.md
  - shared/DEVELOPMENT_PLAN.md
---

# DEVELOPMENT_PLAN

Authoritative execution plan for X‑Skynet. Phases 1→4 with milestones, dependencies, risks, Definition of Done, and timeline. Mirrors kept in repo under shared/ (authoritative) and docs/ (public rendered).

## Phase Overview
- Phase 1: Foundations and CI/CD hardening
- Phase 2: Runtime Core (StepEngine, Protocol, Plugins)
- Phase 3: Productization (UX, packaging, deployments)
- Phase 4: Scale and Reliability (HA, observability, governance)

## Phase 1 — Foundations (current)
Milestones (aligned with Whitepaper P1-01 → P1-08):
- P1-01: RFC-0001 — Project goals and scope documented
- P1-02: RFC-0002 — Core interface contracts (TypeScript types) published and referenced by templates/examples
- P1-03: Monorepo initialization (pnpm workspaces, TS configs, baseline tooling)
- P1-04: CI/CD skeleton + quality gates (lint, typecheck, unit tests, coverage, commitlint, changesets)
- P1-05: Security baseline (osv-scanner, dependency review gates)
- P1-06: Observability baseline (structured logging + OpenTelemetry scaffolding)
- P1-07: CLI design draft (RFC-0003) and CLI package skeleton
- P1-08: Templates & examples scaffolding (one‑click runnable, minimal tests)

Dependencies:
- pnpm and Node versions aligned; workspace hoisting stable
- GitHub Actions permissions and rulesets configured

Risks:
- Long CI latency → dev friction
- Flaky e2e on Windows runners
- Cache poisoning across branches

Definition of Done (Phase):
- All P1 tickets closed; CI time p50 < 6m, p95 < 12m
- Main is protected: required checks, merge queue enabled
- Baseline packages publish dry-run succeeds

Target Timeline:
- Start: 2026-02-20
- End: 2026-03-05

## Phase 2 — Runtime Core
Milestones:
- Protocol schema v0.1 finalized (events, steps, memory)
- StepEngine MVP executes linear and branching flows
- Plugins: memory, telegram, webfetch adapters with tests
- Persistence abstraction (file → sqlite) behind interface

Dependencies:
- Phase 1 protections and CI stability

Risks:
- Schema churn breaking early plugins
- Cross-process concurrency bugs

DoD:
- 80% unit coverage on core; integration tests green
- Example apps: hello, research-agent run end-to-end

Timeline: 2026-03-06 → 2026-03-28

## Phase 3 — Productization
Milestones:
- CLI UX pass; init, run, inspect commands
- Website docs: guides, API refs, tutorials
- Packaging: versioning strategy, release pipelines

Risks/Deps:
- Docs drift vs code; mitigate with doc tests

DoD:
- One-click quickstart validated on macOS/Windows/Linux

Timeline: 2026-03-29 → 2026-04-15

## Phase 4 — Scale & Reliability
Milestones:
- Observability: structured logs, metrics, traces
- HA runner mode; graceful shutdown
- Governance: CODEOWNERS, review matrix, security policy

DoD:
- Chaos tests pass; SLOs defined (availability, latency)

Timeline: 2026-04-16 → 2026-05-15

## Cross-Cutting Items
- Coding standards and consistency: docs/CONSISTENCY.md
- Contribution process: CONTRIBUTING.md

## Appendices
- Related: docs/contracts-overview.md, docs/runtime-stepengine-cas.md, CONTRIBUTING.md
