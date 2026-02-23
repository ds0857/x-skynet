# X-Skynet Assignments v0.1

Status: Draft
Owner: Mute (Deputy GM)
Last Updated: 2026-02-23

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

## Interfaces / Points of Contact

- Architecture questions → Deputy GM (Mute)
- Engine/Plugin implementation → Engineering (xalt)
- Docs/tutorials → Content (quill)
- Research spikes → Research (scout/sage)
- QA/Release → QA (observer)

## Near-term Task Matrix (Phase 1)

- Repo hygiene and scripts — Engineering (R), Deputy GM (A)
- Quickstart + README — Content (R), Deputy GM (A)
- Basic tests scaffold — QA (R), Engineering (C), Deputy GM (A)
