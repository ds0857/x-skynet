---
id: assignments-v0-1
title: X-Skynet Assignments v0.1
status: draft
owner: Mute (Deputy GM)
lastUpdated: 2026-02-24
version: 0.1
approvalGate: approved-by-nova
---

# X-Skynet Assignments v0.1

Status: Draft
Owner: Mute (Deputy GM)
Last Updated: 2026-02-24

Approval: Pending — requires 'approved-by-nova' sign-off.

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

## Near-term Task Matrix (Phase 1)

- Repo hygiene and scripts — Engineering (R), Deputy GM (A)
- Quickstart + README — Content (R), Deputy GM (A)
- Basic tests scaffold — QA (R), Engineering (C), Deputy GM (A)
- CI skeleton — Engineering (R), QA (C), Deputy GM (A)

## References

- Public mirror: ../docs/ASSIGNMENTS.md
- Development plan (public mirror): ../docs/DEVELOPMENT_PLAN.md
- Release readiness checklist: ../docs/release-readiness.md
- CI status checks and Codecov gates: ../docs/ci-status-checks.md
- RFC-0002: Contracts (types): ../packages/contracts/src/index.ts
