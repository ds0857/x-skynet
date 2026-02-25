---
title: X‑Skynet Development Plan
version: 0.1
status: draft
last_updated: 2026-02-25
owner: Mute (Deputy GM)
---

# Development Plan (v0.1)

This document outlines the phased plan to deliver X‑Skynet, an open-source AI agent orchestration framework.

- Related: [ASSIGNMENTS.md](./ASSIGNMENTS.md)
- Templates: [docs/templates/](./templates/)
- Project README: [../README.md](../README.md)

## 1. Scope and Principles

- Scope: runtime engine, plugins, CLI, SDKs (JS/Py), docs and website, deployment assets
- Principles: small, composable primitives; typed contracts; testability; observability; security by default

## 2. Phase Overview

- Phase 1: Foundations and documentation
  - Repository hygiene, contribution guidelines, initial planning docs and templates
- Phase 2: Core runtime MVP
  - DAG execution engine, event bus/store, minimal plugins (shell/http) and CLI integration
- Phase 3: Plugins, SDKs, and integrations
  - Claude plugin, memory, Telegram transport, JS/Py SDKs; examples and guides
- Phase 4: Production hardening
  - CI/CD, security scanning, release process, website and docs site polishing

## 3. Deliverables by Phase (initial skeleton)

### Phase 1 (Docs & Process)
- docs/DEVELOPMENT_PLAN.md (this file) and [ASSIGNMENTS.md](./ASSIGNMENTS.md)
- docs/templates/: RFC, task, meeting notes, checklist
- .github: PR template, issue templates, CODEOWNERS

### Phase 2 (Runtime MVP)
- packages/core: executable state machine for tasks/steps
- packages/contracts: shared types and OpenAPI schema
- packages/cli: run/dev/logs/status commands

### Phase 3 (Plugins & SDKs)
- packages/plugin-claude, plugin-http, plugin-shell, plugin-memory, plugin-telegram
- packages/sdk-js, packages/sdk-py
- examples/* expanded beyond hello-world

### Phase 4 (Production)
- CI: unit + e2e, coverage gates, release workflows
- Security: osv-scanner, dependency policy, secrets hygiene
- Website: docs site, landing page, versioned docs

## 4. Milestones (draft)

- M1: Plan + Assignments merged; templates available
- M2: Runtime MVP runs hello-world DAG locally
- M3: Claude + HTTP flows and memory store available
- M4: First tagged release and docs site

## 5. Risks & Mitigations (draft)

- Scope creep → freeze interfaces per milestone; RFC for changes
- Plugin surface instability → contracts package with semver discipline
- CI flakiness → minimal deterministic e2e matrix; pre-merge smoke tests

## 6. Dependencies (draft)

- Node.js 20+, pnpm; GitHub Actions; Anthropic API key for Claude plugin

## 7. Acceptance

- Each phase includes a Definition of Done tracked in issues/PRs and validated by CI
- RACI and approvers in [ASSIGNMENTS.md](./ASSIGNMENTS.md)

