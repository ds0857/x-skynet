# Release Readiness Checklist v0.1

Status: Draft
Owner: QA (observer) • Approver: Deputy GM (Mute)

This document defines Phase 1 exit criteria and evidence placeholders for Go/No-Go.

## Scope

- Phase 1 — Bootstrap & Foundations (Week 1)
- Repo hygiene, monorepo wiring, CI skeleton, docs seed

## Acceptance Gates (Go/No-Go)

1. Install & Build

- [ ] pnpm i completes without error
  - Evidence: CI log link (build job)
- [ ] pnpm -r build succeeds across workspace
  - Evidence: CI artifact and job link

2. Type Safety

- [ ] pnpm typecheck passes at root and all packages
  - Threshold: 0 TypeScript errors
  - Evidence: CI job link

3. Lint & Format

- [ ] eslint . --ext .ts,.tsx returns exit code 0
  - Threshold: 0 errors (warnings allowed ≤ 10)
  - Evidence: CI job link
- [ ] prettier --check returns exit code 0
  - Evidence: CI job link

4. Tests & Coverage

- [ ] pnpm test passes (vitest)
  - Threshold: 0 failed tests
  - Evidence: CI job link
- [ ] Coverage >= 40% statements for Phase 1 baseline
  - Evidence: Codecov report link

5. CI Pipeline

- [ ] GitHub Actions workflow runs on PR with jobs: install, typecheck, lint, test, coverage upload
  - Evidence: Workflow file path + latest successful run link

6. Docs

- [ ] README contains Quickstart and badges placeholders
  - Evidence: PR diff link
- [ ] docs/Quickstart.md present and up to date
  - Evidence: PR diff link
- [ ] Docs gatekeeping in place (PR template, CODEOWNERS, Docs Lint workflow wired)
  - Evidence: .github/PULL_REQUEST_TEMPLATE.md, .github/CODEOWNERS, .github/workflows/docs-lint.yml

7. Repo Hygiene

- [ ] pnpm workspace configured with TS project references
  - Evidence: tsconfig.base.json and packages/\*/tsconfig.json references
- [ ] Commit conventions enforced (commitlint + husky)
  - Evidence: config files + passing commit example link
- [ ] Prettier, ESLint, EditorConfig present
  - Evidence: config files present

8. Issue Templates

- [ ] .github/ISSUE_TEMPLATE contains: release-readiness.yml, go-no-go.yml, post-release-review.yml
  - Evidence: file paths

## Decision Record

- Go/No-Go DRI: Deputy GM (Mute)
- Decision date: YYYY-MM-DD
- Outcome: Go | No-Go
- Rationale: ...

## Evidence Links (fill during PR)

- CI: <link to latest workflow run on this PR>
- Codecov: https://app.codecov.io/gh/ds0857/x-skynet
- Workflow file: .github/workflows/ci.yml
- Docs Lint workflow: .github/workflows/docs-lint.yml (runs on docs/.github changes)
- Example passing commit: <link>
- PR: https://github.com/ds0857/x-skynet/pull/12
