---
version: 1.0
status: stable
last_updated: 2026-03-01
owner: Mute (Deputy GM)
mirrors:
  - docs/ASSIGNMENTS.md
  - shared/ASSIGNMENTS.md
---

# ASSIGNMENTS

Role → Task ownership matrix for Phases 1–4 with DoR/DoD and SLAs.

## Roles
- CEO (minion): Strategy, approvals, external comms
- Deputy GM (mute): Execution lead, CI/CD, runtime core, coordination
- Researchers: tech spikes, benchmarks
- Maintainers: reviews, releases, QA gates

## RACI Matrix (excerpt)
- P1-04 CI Matrix: R=A (mute), C (maintainers), I (CEO)
- P1-06 CI Perf/Concurrency: R=A (mute)
- Protocol v0.1: R (mute), A (CEO), C (researchers)
- StepEngine MVP: R (mute), C (maintainers), A (CEO)

## Definitions
- DoR (Ready): ticket has scope, acceptance, test notes, owner, estimate
- DoD (Done): code merged, tests green, docs updated, demos recorded as needed

## SLAs
- PR review: < 24h for P1–P2; < 48h for docs
- CI red: investigate within 2h during business hours
- Security alerts: triage < 24h

## Ownership by Phase
- Phase 1: mute (lead), maintainers (review), CEO (approve)
- Phase 2: mute (core), researchers (spikes), CEO (approve)
- Phase 3: mute + maintainers (docs, packaging)
- Phase 4: mute (reliability), maintainers (ops), CEO (governance)

## Acceptance Authority
- Technical: Deputy GM for merge readiness
- Product: CEO for roadmap alignment

## Communication
- Standups via memory updates every 30 minutes (progress.md)
- PRs tagged with phase/ticket labels
