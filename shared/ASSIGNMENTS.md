---
# id: Stable unique identifier for this doc (do not change)
id: assignments-v1-0
# title: Human-readable title
title: X-Skynet Assignments v1.0
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

# X-Skynet Assignments v1.0

Status: Review
Owner: Mute (Deputy GM)
Last Updated: 2026-02-25

Approval: Pending — requires 'approved-by-nova' sign-off.

## Table of Contents

- [Roles](#roles)
- [Responsibility Matrix (RACI)](#responsibility-matrix-raci)
- [Phase 1 Task Owners（P1-04/06/07/08）](#phase-1-task-ownersp1-04060708)
- [Phase 2–4 Ownership](#phase-2–4-ownership)
- [Interfaces / Points of Contact](#interfaces--points-of-contact)
- [SLAs](#slas)
- [Acceptance Authority](#acceptance-authority)
- [References](#references)

## Roles

- CEO (minion): Vision, product direction, approvals
- Deputy GM (Mute): Execution lead, architecture, delivery
- Research (scout/sage): Competitive analysis, API research
- Content (quill): Docs, tutorials, examples
- Engineering (xalt): Core engine, plugins, tooling
- QA (observer): Tests, CI, coverage, release checks

## Responsibility Matrix (RACI)

| Area                        | CEO | Deputy GM | Engineering | Research | Content | QA  |
| --------------------------- | --- | --------- | ----------- | -------- | ------- | --- |
| Contracts design            | A   | R         | C           | C        | I       | I   |
| Core executor               | I   | A         | R           | I        | I       | C   |
| Plugins (claude/http/shell) | I   | A         | R           | C        | I       | C   |
| CLI                         | I   | A         | R           | I        | C       | C   |
| Viewer                      | I   | A         | R           | I        | C       | C   |
| Docs site                   | A   | C         | I           | I        | R       | C   |
| Examples                    | A   | C         | R           | C        | R       | C   |
| CI/QA                       | I   | A         | C           | I        | I       | R   |

Legend: R=Responsible, A=Accountable, C=Consulted, I=Informed

## Phase 1 Task Owners（P1-04/06/07/08）

- P1-04 Repo hygiene & scripts — Engineering (xalt) R, Deputy GM (Mute) A, QA (observer) C
- P1-06 Quickstart + README — Content (quill) R, Deputy GM (Mute) A, Engineering (xalt) C
- P1-07 Basic tests scaffold — QA (observer) R, Engineering (xalt) C, Deputy GM (Mute) A
- P1-08 CI skeleton — Engineering (xalt) R, QA (observer) C, Deputy GM (Mute) A

## Phase 2–4 Ownership

- Contracts & minimal executor — Engineering (xalt) R, Deputy GM (Mute) A, QA (observer) C
- Plugin SDK & built‑ins — Engineering (xalt) R, Deputy GM (Mute) A, Research (scout/sage) C
- CLI — Engineering (xalt) R, Deputy GM (Mute) A, Content (quill) C
- Viewer — Engineering (xalt) R, Deputy GM (Mute) A, Content (quill) C
- Observability & hardening — Engineering (xalt) R, Deputy GM (Mute) A, QA (observer) R (testing)
- Docs & examples — Content (quill) R, Deputy GM (Mute) A, Engineering (xalt) C
- Release process — Deputy GM (Mute) R/A, QA (observer) C

## Interfaces / Points of Contact

- Architecture questions → Deputy GM (Mute)
- Engine/Plugin implementation → Engineering (xalt)
- Docs/tutorials → Content (quill)
- Research spikes → Research (scout/sage)
- QA/Release → QA (observer)

## SLAs

- PR review turnaround: < 24h on business days
- Docs/Quickstart updates: within 24h of significant API change
- CI breakages: triage within 2h, fix within 24h

## Acceptance Authority

- Phase 1 deliverables — Deputy GM (Mute) verifies criteria; QA (observer) signs off tests/CI
- Phase 2–4 deliverables — Deputy GM (Mute) as final gate; CEO (minion) optional approval for milestone exits

## References

- Public mirror: ../docs/ASSIGNMENTS.md
- Development plan (public mirror): ../docs/DEVELOPMENT_PLAN.md
- Release readiness checklist: ../docs/release-readiness.md
- CI status checks and Codecov gates: ../docs/ci-status-checks.md
