# Dependency Hygiene Policy

This document defines how we manage dependencies across the x-skynet monorepo. Goals:

- Security first: fast response to vulnerabilities
- Predictability: reproducible installs via pinned versions and a committed lockfile
- Low churn: scheduled updates and grouped non-majors to reduce PR noise
- Automation: Renovate bot opens and maintains dependency PRs

## Package manager

- pnpm v9 with a single top-level lockfile (pnpm-lock.yaml)
- Node.js 20.x in CI and development

## Version pinning strategy

- We pin exact versions for all dependencies (rangeStrategy: "pin").
- This ensures fully reproducible builds and simplifies rollback.
- For libraries that publish frequent types or tooling updates, Renovate may automerge safe non-major updates per rules below.

## Renovate configuration

- Config file: `renovate.json` in repo root.
- Base preset: `config:recommended` with semantic commit messages.
- Schedule: non-urgent updates run "before 6am on Monday" (UTC).
- Grouping: non-major updates are grouped to reduce PR noise.
- pnpm-specific post-update: `pnpmDedupe` to keep the graph minimal.
- Labels: PRs labeled `dependencies` for filtering.

### Automerge policy

- Dev tooling (devDependencies): minor/patch/pin/digest updates may automerge on green CI.
- Runtime dependencies (dependencies): no automerge except patch-level is allowed to be considered; we still prefer manual review for runtime changes.
- Major updates: never automerged; always reviewed and tested manually.

### Security updates

- GitHub-native security alerts are surfaced; Renovate `vulnerabilityAlerts` is enabled to open PRs quickly.
- Emergency updates (actively exploited CVEs) can be merged outside the normal window after CI passes.
- We use `pnpm.overrides` in package.json for critical sub-dependency patches when upstream has not yet released (document rationale in PR body and follow up to remove override).

## Lockfile policy

- `pnpm-lock.yaml` is committed and must be kept in sync with package.json changes.
- CI enforces lockfile correctness with `pnpm install --frozen-lockfile` and a no-diff check after install.
- Any change to dependencies without a corresponding lockfile update will fail CI.

## Weekly upgrade window

- Renovate will open PRs prior to Monday 06:00 UTC. Triage and merge during business hours on Monday.
- Outside the window, updates are generally deferred unless they are security/emergency.

## Commit message and PR conventions

- Title: `chore(deps): ...`
- Body: include notable changelogs, breaking changes, and testing notes.
- Link to upstream releases when available.

## Local development guidance

- Always run `pnpm install` from the repo root. Do not edit lockfile manually.
- If you add or remove a dependency, commit both the package.json change and the resulting lockfile change in the same commit/PR.

## FAQ

- Why pin? Strict pinning avoids surprise breakage from transitive updates and improves reproducibility.
- Won’t we miss important fixes? Renovate runs weekly (and immediately for security) and groups updates to keep the workload manageable.
