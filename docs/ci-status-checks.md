# CI status checks and Codecov coverage gates

This document explains the status checks we enforce on pull requests and how our Codecov coverage gates work. It also shows how to enable the required checks in GitHub branch protection and how to troubleshoot common issues.

> Scope: Repository `ds0857/x-skynet` (pnpm monorepo, Node.js 20). CI defined in `.github/workflows/ci.yml`. Coverage uploaded to Codecov using OIDC (`codecov/codecov-action@v4`).

## Required status checks for PRs

Branch protection should require specific checks to pass before merging. The exact names shown in GitHub can vary slightly (matrix labels, flags). When adding checks, type "codecov" in the selector to see all relevant entries and pick the ones listed below.

Recommended required checks (global + per-package components):

- CI job(s)
  - build-test (Node 20.x) – our main CI job that runs lint, typecheck, tests, and uploads coverage
- Docs lint
  - Docs Lint / docs-lint – runs pnpm run lint:docs on docs/.github/tooling changes
- Codecov checks
  - Global checks
    - codecov/patch – validates coverage on changed lines in the PR
    - codecov/project – protects overall project coverage from regressing beyond allowed threshold
    - If flag-specific checks appear (e.g., `codecov/patch/node-20.x`, `codecov/project/node-20.x`), select those as well
  - Component checks (per package; appear after first run with codecov.yml components)
    - codecov/components/pkg-core/patch
    - codecov/components/pkg-core/project
    - codecov/components/pkg-cli/patch
    - codecov/components/pkg-cli/project
    - ... similarly for other packages under packages/\*

Optional but recommended repository setting:

- Require branches to be up to date before merging (ensures PR head includes latest base branch changes)

## Codecov configuration (coverage gates)

We configure Codecov gates in `codecov.yml`:

```yaml
coverage:
  status:
    project:
      default:
        target: auto
        threshold: 2%
    patch:
      default:
        target: 80%
        threshold: 1%
        only_pulls: true
```

Key points:

- Project gate: `target: auto` follows the current baseline coverage; merges fail if overall coverage drops by > 2%.
- Patch gate: requires at least 80% coverage on changed lines for PRs, with a 1% threshold to absorb minor noise.
- Flags: We also define a `node-20.x` flag so per-flag checks may show up (useful for matrix builds). Missing flags are carried forward to stabilize statuses.

Flag settings excerpt:

```yaml
flag_management:
  default_rules:
    carryforward: true
  individual_flags:
    - name: "node-20.x"
      carryforward: true
```

## Enabling required checks in GitHub

1. Go to: GitHub → Settings → Branches → Branch protection rules → Edit (or Add rule for `main`).
2. Enable “Require status checks to pass before merging”.
3. Click “Search for checks” and add the following:
   - `build-test` (or the job label shown for Node 20.x)
   - `codecov/patch`
   - `codecov/project`
   - Any flag-specific Codecov checks if present (e.g., `/node-20.x`).
4. (Optional) Enable “Require branches to be up to date before merging”.
5. Save changes.

Screenshots (placeholders):

- [ ] Screenshot: Branch protection → Require status checks to pass → selected checks
- [ ] Screenshot: Codecov checks as seen in a PR (Checks tab)

## CI overview

Our CI workflow (`.github/workflows/ci.yml`) runs on Ubuntu with Node 20.x and performs:

- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test with coverage: `pnpm test` (outputs `coverage/lcov.info`)
- Upload coverage to Codecov via OIDC using `codecov/codecov-action@v4`

The upload step is marked `if: always()` and uses `fail_ci_if_error: false` to avoid masking test failures with upload errors. Codecov still reports PR status checks based on the uploaded report.

## Local development

- Run tests with coverage: `pnpm test`
- If you add new code, add or update tests to keep patch coverage ≥ 80%.
- If CI reports a patch coverage shortfall:
  - Add tests for uncovered lines in the PR
  - If lines are intentionally untestable, consider refactoring to isolate them or mark them with `/* istanbul ignore next */` sparingly

## Troubleshooting

- Codecov status check missing in PR:
  - Confirm CI produced `coverage/lcov.info` and the upload step ran
  - Check Codecov dashboard for the commit to see processing results
- “Project coverage decreased” failure:
  - Add or adjust tests to bring overall coverage back within the 2% threshold
  - Consider splitting large refactors into smaller PRs with tests
- Matrix or flag-related flakiness:
  - Ensure flags are consistent across jobs; `carryforward: true` reduces transient failures

## References

- Repository Codecov dashboard: https://app.codecov.io/gh/ds0857/x-skynet
- Codecov YAML reference: https://docs.codecov.com/docs/codecovyml-reference
- GitHub branch protection rules: https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/using-branch-protection-rules

---

Change log

- 2026-02-23: Initial draft documenting required checks and coverage gates; placeholders added for screenshots.
