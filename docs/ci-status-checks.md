# Required status checks for `main`

Enable GitHub branch protection on `main` with these required checks:

Required status checks:
- CI / Build, Lint & Test (from .github/workflows/ci.yml)
- Security Scan (from .github/workflows/security.yml)
  - CodeQL (javascript-typescript)
  - Dependency Review (pull_request only)
  - OSV Dependency Vulnerability Scan
- Lockfile integrity (from .github/workflows/lockfile-check.yml)
- codecov/project (from codecov.yml)
- codecov/patch (from codecov.yml)

Additional settings recommended:
- Require branches to be up to date before merging
- Require pull request reviews before merging (at least 1)
- Dismiss stale pull request approvals when new commits are pushed
- Require signed commits (optional)

Notes:
- CODECOV_TOKEN must be set as a repository secret for Codecov uploads on push events.
- Jest coverage thresholds are enforced in jest.config.js (Lines/Funcs/Stmts 80%, Branches 50%).

How to enable:
1) Settings → Branches → Add branch protection rule
2) Branch name pattern: main
3) Check “Require a pull request before merging” and set reviewers
4) Check “Require status checks to pass before merging” and add checks above
5) Check “Require branches to be up to date before merging”
6) Save changes

Troubleshooting:
- If `codecov/*` checks don’t appear, verify CI uploaded coverage/lcov.info and CODECOV_TOKEN is present; check the Codecov Action logs in CI run.
- If CI “Lint” fails on dag-viewer due to missing eslint deps, current repo uses no-op lint scripts for packages without ESLint configured.
