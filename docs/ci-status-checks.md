# CI Coverage & Status Checks

This document explains the required status checks on `main`, how Codecov is configured, how to reproduce coverage locally, and how to troubleshoot common issues.

## Required checks on `main`

Branch protection enforces these checks before merging to `main`:

- CI / build-test (20.x)
- codecov/project — overall coverage gate
- codecov/patch — changed-lines (patch) coverage gate

If any of these fail, the PR cannot be merged until the issue is resolved.

## Codecov configuration (codecov.yml)

Key points:

- Project coverage gate uses `target: auto` with a 2% regression threshold.
- Patch coverage gate requires `target: 80%` on changed lines.
- Per-flag example gates are included for the CI flag `node-20.x` so you can scope checks to specific uploads when we expand the matrix.
- Carryforward is enabled so missing flags don’t fail a run when using a build matrix.

See `./codecov.yml` for the exact configuration.

## CI upload and flags

The GitHub Actions workflow uploads coverage using Codecov Action v4 with OIDC (no token needed for public repos):

```
- name: Upload coverage to Codecov via OIDC
  if: always()
  uses: codecov/codecov-action@v4
  with:
    use_oidc: true
    files: coverage/lcov.info
    flags: node-${{ matrix.node-version }}
    fail_ci_if_error: false
```

For the current matrix, the flag is `node-20.x`. In Codecov’s UI and the PR’s Checks tab, you should see the flag appear under Codecov details.

## Reproducing locally

1. Install dependencies and run tests with coverage:

```
pnpm install
pnpm test
```

2. Inspect the generated report at `coverage/lcov.info`.

3. Optional: to preview what Codecov would upload, verify the file exists and is non-empty:

```
ls -lh coverage/lcov.info
```

Note: Local uploads to Codecov are not required; CI handles official uploads.

## Troubleshooting

- Missing Codecov checks on PRs:
  - Ensure the workflow step uses `codecov/codecov-action@v4` with `use_oidc: true`.
  - Confirm that `coverage/lcov.info` exists after tests.
  - For private repos, set `CODECOV_TOKEN` as a repository secret and omit `use_oidc`, or keep OIDC if the app is installed and properly authorized.
- Flags not showing:
  - Verify the `flags:` input is set (e.g., `node-20.x`).
  - With carryforward enabled, previous flag results may be used when a flag is missing, but the first successful upload must include the flag to establish it.
- Patch status failing while project passes:
  - Patch gates are stricter; add tests for changed lines or reduce uncovered additions.
- YAML not applying:
  - Confirm the file is named `codecov.yml` at the repo root.
  - Check the Codecov UI settings to ensure repo-level YAML isn’t being overridden.

## Adjusting branch protection (GitHub UI)

Settings → Branches → Branch protection rules → Edit `main`:

- Require a pull request before merging: enabled (recommended)
- Require status checks to pass before merging: enabled
- Select required checks:
  - `CI / build-test (20.x)`
  - `codecov/project`
  - `codecov/patch`
- Require branches to be up to date before merging: optional (recommended)
- Include administrators: optional

Save changes.
