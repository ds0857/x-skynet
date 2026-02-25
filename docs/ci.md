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

- Workflow: `.github/workflows/ci.yml`

## Roadmap

- Enforce lint to fail the build once rules are stabilized
- Add security scanning (OSV, dependency review) and e2e test jobs
