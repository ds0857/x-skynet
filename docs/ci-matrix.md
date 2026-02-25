# CI Matrix (Affected Packages)

This workflow runs package-scoped jobs only for packages changed in the branch/PR.

- Detects changed package directories under `packages/` vs base (PR base or origin/main)
- Builds, typechecks, lints, and runs Jest for each affected package
- Uploads coverage with a Codecov `flag` matching the package group (e.g., `core`, `cli`, `sdk-js`, `contracts`, `router`, `web-ui`, `plugins`)
- Emits artifacts per job

Workflow file: `.github/workflows/ci-matrix.yml`

Notes:
- Fallback to `packages/core` if no package change is detected to ensure at least one job (keeps coverage checks alive)
- Flags map to Codecov components configured in `codecov.yml`
- You can extend the flag mapping cases in the detect job
- Requires `CODECOV_TOKEN` secret for push events (PRs use OIDC)
