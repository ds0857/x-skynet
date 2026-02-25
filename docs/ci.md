# Continuous Integration (CI)

This repository uses GitHub Actions to run quality checks on every push to `main` and `dev`, and on pull requests targeting `main`.

CI checks include:

- Setup: Node.js 20 and pnpm 9
- Install: `pnpm install --frozen-lockfile` with caching
- Build: `pnpm run build`
- Typecheck: `pnpm run typecheck`
- Lint: `pnpm run lint` (enforced; CI fails on lint errors)
- Tests: `pnpm run test:coverage` with Jest (see coverage thresholds below)
- Coverage Artifacts: Upload the `coverage/` folder as a build artifact
- Coverage Upload: Upload `coverage/lcov.info` to Codecov (requires CODECOV_TOKEN secret)
- Codecov flags & components: per-package flags in ci-matrix.yml; component gates in codecov.yml

### Coverage thresholds

Jest enforces global coverage thresholds in `jest.config.js`:
- Lines: 80%
- Functions: 80%
- Statements: 80%
- Branches: 50% (lower due to defensive error-handling paths)

Additionally, Codecov gating is configured in `codecov.yml`:
- Project: target 80% (1% threshold tolerance)
- Patch: target 90% (no tolerance)

## Secrets

- CODECOV_TOKEN: Add this repository secret to enable Codecov uploads on push events.

## File Locations

- Workflow (full run): `.github/workflows/ci.yml`
- Workflow (affected matrix): `.github/workflows/ci-matrix.yml`
- Codecov config: `codecov.yml`

## Affected matrix workflow

The matrix workflow only builds/tests packages that changed vs the base commit.

Triggers:
- pull_request → targets main
- push → branches matching dev, ci/*, feat/*, chore/*

What it does per changed package (derived under packages/):
- pnpm --filter "<pkg-name>" run build | typecheck | lint (if present)
- Jest scoped to that package directory with coverage
- Uploads coverage artifact and uploads to Codecov with a flag corresponding to the package group (e.g. core, cli, sdk-js, contracts, router, web-ui, plugins)

Maintenance notes:
- When adding a new package, update `codecov.yml` component paths and optionally add a flag mapping case in `ci-matrix.yml` detect step.
- Ensure CODECOV_TOKEN repository secret exists for push events. PRs from the same repo use OIDC.
- If no packages change, the workflow falls back to `packages/core` to keep coverage checks active.
- You can tweak Jest path scoping via `--collectCoverageFrom` in `ci-matrix.yml`.

Examples:
- Build a single package locally: `pnpm --filter @xskynet/core run build`
- Run tests for a package: `pnpm exec jest packages/core --coverage`

## Roadmap

- Enforce lint to fail the build once rules are stabilized
- Add security scanning (OSV, dependency review) and e2e test jobs
