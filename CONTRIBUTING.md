# Contributing to X‑Skynet

Thanks for your interest in contributing! This document explains our PR labeling and CI gates, including how to work with coverage thresholds and our hardened workflow configuration.

## Pull Request automation

We use GitHub Actions to automatically label PRs by both code area and size. Labels help reviewers route, prioritize, and understand change impact quickly.

### 1) Path‑based auto‑labels (scope:\*)

Workflow: `.github/workflows/labeler.yml` (actions/labeler@v5)

- Trigger: `pull_request_target` on opened/synchronize/reopened
- Permissions: `contents: read`, `pull-requests: write`
- Config: `.github/labeler.yml`
- Behavior: Adds `scope:*` labels based on changed files

Common mappings (see full list in `.github/labeler.yml`):

- `scope:contracts` → `packages/contracts/**`
- `scope:core` → `src/core/**`
- `scope:agents` → `src/agents/**`
- `scope:skills` → `src/skills/**`
- `scope:channels` → `src/channels/**`
- `scope:apps` → `apps/**`
- `scope:docs` → `docs/**`, `README.md`
- `scope:tests` → `tests/**`
- `scope:ci` → `.github/workflows/**`
- `scope:repo` → repo configs (eslint/prettier/tsconfig/etc.)

To add or change mappings, edit `.github/labeler.yml` (v5 syntax) and open a PR.

### 2) Size auto‑labels (size:\*)

Workflow: `.github/workflows/size-label.yml` (pascalgn/size-label-action@v0.5.5)

- Trigger: `pull_request_target` on opened/synchronize/reopened
- Permissions: `contents: read`, `pull-requests: write`
- Thresholds:
  - `size:XS` — up to 10 changed lines
  - `size:S` — 11–50
  - `size:M` — 51–200
  - `size:L` — 201–500
  - `size:XL` — 501+
- Notes:
  - We exclude some non-code churn from the size calculation (e.g., lockfiles, docs). Adjust the `IGNORED` env in the workflow if needed.
  - Labels are named `size:*` to align with our catalog.

### 3) Label catalog and sync

Manifest: `.github/labels.yml`

Workflow: `.github/workflows/sync-labels.yml` (micnncim/action-label-syncer@v1)

- When labels.yml changes on `main`, or when triggered manually, the workflow will create/update labels.
- Set `prune: true` to remove labels not in the manifest (current setting).
- You can also run the workflow via the "Actions" tab → "Sync repository labels" → "Run workflow".

Label families we use:

- `type:*` — feature, bug, docs, chore, test, refactor, ci
- `scope:*` — areas of the codebase (see above)
- `semver:*` — major, minor, patch
- `status:*` — ready, in-progress, blocked, needs-info
- `priority:*` — P0/P1/P2/P3
- `size:*` — XS/S/M/L/XL (applied automatically)

### Security notes

- Both workflows use `pull_request_target` and do not check out the PR head. They operate with the base repository context and least-privilege token scopes.
- Path labeler reads config from the default branch; contributors cannot change label mappings from a forked PR.

### Proposing label changes

1. Update `.github/labels.yml` (add/edit label entries).
2. If needed, update `.github/labeler.yml` to map paths to new `scope:*` labels.
3. Open a PR. After merge, labels will be synced automatically on `main` (or a maintainer can run the sync workflow manually).

## Test coverage and Codecov

We require tests with coverage and enforce Codecov gates on pull requests:

- Project coverage gate: target: auto with a 2% threshold. Prevents overall coverage from regressing significantly.
- Patch coverage gate: target: 80% with a 1% threshold, only on pull requests. Ensures changed lines are reasonably tested.
- Per-package coverage via Codecov Components: Each package under packages/\* is tracked as its own component. Codecov creates status checks per component (e.g., codecov/components/pkg-core/project and codecov/components/pkg-core/patch) in addition to the global codecov/project and codecov/patch checks. These appear automatically once Codecov processes a commit with the component definitions from codecov.yml.

Local workflow:

- Run tests with coverage: pnpm test (Vitest v8). This generates coverage/lcov.info.
- Aim to keep patch coverage ≥ 80% on your changes; add tests for new logic.
- If some lines are intentionally hard to test, consider refactoring to isolate them or use /_ istanbul ignore next _/ sparingly.

CI notes:

- CI uploads coverage to Codecov via OIDC (codecov/codecov-action@v4). We tag uploads with a node-20.x flag for matrix stability. Components are derived from file paths and do not require separate uploads.
- Required checks typically include: build-test, codecov/patch, codecov/project, and where present, component checks like codecov/components/pkg-\*/{project,patch}.

### Questions

Open an issue with the `type:docs` label or ask in the discussion forum if you need help with the automation.

### CI hardening quick reference

- Actions pinned by SHA: checkout, setup-node, pnpm/action-setup, upload-artifact, labeler, size-label-action, action-label-syncer.
- Node cache: cache: pnpm + cache-dependency-path: pnpm-lock.yaml
- Coverage gates: Vitest thresholds (hard fail) + Codecov project/patch gates (regression guard)
- Adjust thresholds: edit vitest.config.ts and/or codecov.yml via PR with justification.
