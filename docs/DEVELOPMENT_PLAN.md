# X-Skynet Development Plan v0.1

Status: Draft
Owner: Mute (Deputy GM)
Last Updated: 2026-02-23

This is the public-facing mirror of the living plan in shared/.

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

### P1-04 — Repo hygiene & scripts

- Estimate: 0.5–1.0 day
- Acceptance:
  - [ ] `pnpm i` (Node 20.11+) ok
  - [ ] `pnpm typecheck` ok across workspaces
  - [ ] `pnpm lint` ok at root
  - [ ] `pnpm test` ok with coverage
  - [ ] Pre-commit (husky + lint-staged) runs clean

### P1-06 — Quickstart + README

- Estimate: 0.5 day
- Acceptance:
  - [ ] Quickstart leads to a running demo/CLI in ~15 minutes
  - [ ] README reflects current layout and scripts

### P1-07 — Basic tests scaffold

- Estimate: 0.5 day
- Acceptance:
  - [ ] Vitest configured with coverage
  - [ ] Example test passes locally and in CI

### P1-08 — CI skeleton

- Estimate: 0.5–1.0 day
- Acceptance:
  - [ ] GitHub Actions workflow (install → typecheck → lint → test)
  - [ ] Coverage artifact and (optional) Codecov badge

## Milestones

- M1: Repo Ready (end of Phase 1)
- M2: Contracts & Minimal Engine (mid Phase 2)
- M3: CLI & Essential Plugins (end Phase 3)
- M4: Reliability & Docs (end Phase 4)

See shared/DEVELOPMENT_PLAN.md for the authoritative, editable version.
