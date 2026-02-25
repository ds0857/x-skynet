# Continuous Integration (CI)

This repository uses GitHub Actions to run quality checks on every push to `main` and `dev`, and on pull requests targeting `main`.

CI checks include:

- Setup: Node.js 20 and pnpm 9
- Install: `pnpm install --frozen-lockfile` with caching
- Build: `pnpm run build`
- Typecheck: `pnpm run typecheck`
- Lint: `pnpm run lint` (non-blocking for now; will be enforced later)
- Tests: `pnpm run test:coverage` with Jest
- Coverage Artifacts: Upload the `coverage/` folder as a build artifact
- Coverage Upload: Upload `coverage/lcov.info` to Codecov (requires CODECOV_TOKEN secret)

## Secrets

- CODECOV_TOKEN: Add this repository secret to enable Codecov uploads on push events.

## File Locations

- Workflow: `.github/workflows/ci.yml`

## Roadmap

- Enforce lint to fail the build once rules are stabilized
- Add security scanning (OSV, dependency review) and e2e test jobs
