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

Role → Task ownership matrix for Phases 1–4 with DoR/DoD and SLAs. Mirrors kept in repo under shared/ (authoritative) and docs/ (public rendered).

## Roles
- CEO (minion): Strategy, approvals, external comms
- Deputy GM (mute): Execution lead, CI/CD, runtime core, coordination
- Researchers (scout, etc.): Tech spikes, benchmarks
- Maintainers (observer, etc.): Reviews, releases, QA gates

## RACI Matrix (P1 excerpt)
- P1-04 CI skeleton + quality gates: R=A (mute), C (maintainers), I (CEO)
- P1-06 Observability baseline: R=A (mute)
- P1-07 CLI design draft (RFC-0003): R (mute), A (CEO), C (quill)
- P1-08 Templates & examples scaffolding: R (mute), A (CEO), C (quill, observer)

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
