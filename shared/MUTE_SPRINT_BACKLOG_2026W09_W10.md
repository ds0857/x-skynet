---
owner: Mute (Deputy GM)
sprint: 2026W09–W10
iteration: 2 weeks
start: 2026-03-01
end: 2026-03-14
status: draft
---

# Mute Sprint Backlog — 2026W09–W10

## Goals
- Close Phase 1 with CI performance and stability gates
- Kick off Phase 2: Protocol v0.1 and StepEngine MVP foundations

## Work Breakdown Structure (WBS)

1. CI Performance & Stability (Phase 1)
   - 1.1 Enable merge queue and required checks alignment (4h)
   - 1.2 Cache strategy tuning (pnpm store, node_modules) (6h)
   - 1.3 Concurrency and matrix tuning; split e2e (6h)
   - 1.4 Windows runner flake investigation and retries (6h)
   - 1.5 Artifact consolidation (JUnit, coverage) (4h)
   - 1.6 osv-scanner gate and baseline report (4h)
   - Deliverables: Updated ci.yml, docs/ci.md, artifacts in Actions

2. Protocol v0.1 (Phase 2)
   - 2.1 Draft schema (events, steps, memory, results) (6h)
   - 2.2 JSON schema + TS types generation (6h)
   - 2.3 Validation library + basic tests (6h)
   - Deliverables: packages/protocol with tests and README

3. StepEngine MVP (Phase 2)
   - 3.1 Execution model (linear, branch) design doc (4h)
   - 3.2 Runner skeleton + state store interface (8h)
   - 3.3 Hello and research-agent examples integration (6h)
   - Deliverables: packages/runtime with unit tests; examples updated

Total estimate: ~56h across two weeks

## Acceptance Criteria
- CI p50 < 6m, p95 < 12m; jobs green on Node 20/22 Linux + Windows
- Protocol package publishes dry-run; schema validated by tests
- Runtime executes sample flows locally with logs

## Risks & Mitigations
- Windows flakes → add retries and isolate e2e
- Schema churn → cut v0.1 tag and ADR for changes

## Links
- PR: TBA
- CI Dashboard: GitHub Actions
