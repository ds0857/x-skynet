# CI Status Checks Guidance

To protect `main` with required status checks using GitHub Actions workflow defined in `.github/workflows/ci.yml`, follow these steps:

1) Navigate to: Settings → Branches → Branch protection rules → Add rule
2) Configure:
   - Branch name pattern: `main`
   - Require a pull request before merging: enabled
   - Require status checks to pass before merging: enabled
   - Search and select the following checks:
     - `CI / build-test (20.x)`
   - Require branches to be up to date before merging: optional (recommended once repo traffic increases)
   - Include administrators: optional
3) Save changes.

Coverage reports:
- CI uploads the `coverage` directory as an artifact.
- If you set repository secret `CODECOV_TOKEN`, the workflow will upload `coverage/lcov.info` to Codecov on branch pushes.

Notes:
- Workflow runs on push to `main` and on pull requests targeting `main`.
- Node version matrix can be expanded later (e.g., `[18.x, 20.x, 22.x]`).
- pnpm is installed via Corepack and cache is enabled through `actions/setup-node` with `cache: 'pnpm'`.
