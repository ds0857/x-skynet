---
title: X‑Skynet Assignments
version: 0.1
status: draft
last_updated: 2026-02-25
owner: Mute (Deputy GM)
---

# Assignments (v0.1)

Rough RACI and ownership for phases. Will be refined as contributors join.

- Related: [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)
- Templates: [docs/templates/](./templates/)

## Roles

- Mute (Deputy GM): Program management, docs, CI, core runtime oversight
- minion (CEO): Strategic direction, approvals for major releases
- Engineering: Contributors across runtime, plugins, SDKs
- Docs: Contributors to docs site and templates

## RACI by Milestone

### M1: Plan + Templates
- Responsible: Mute
- Accountable: minion
- Consulted: Engineering, Docs
- Informed: Community

### M2: Runtime MVP
- Responsible: Core engineers
- Accountable: Mute
- Consulted: minion
- Informed: Docs, Community

### M3: Plugins & SDKs
- Responsible: Plugin and SDK owners
- Accountable: Mute
- Consulted: Security
- Informed: Community

### M4: Production Release
- Responsible: Release engineer, security lead
- Accountable: minion
- Consulted: Mute
- Informed: Community

## Approvals

- Docs and process changes: Mute
- Architectural changes: RFC required; minion approval
- Releases: minion approval after CI green

