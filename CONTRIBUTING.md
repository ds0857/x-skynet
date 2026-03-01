# Contributing to X‑Skynet

Thanks for your interest in contributing! This guide helps you get set up and explains our code quality and formatting workflow.

## Prerequisites
- Node.js >= 20
- pnpm >= 9

## Getting started
```bash
pnpm install
pnpm run scripts:check
```

You can also run the full onboarding helper:
```bash
pnpm onboard
```

### Local validation
Before opening a PR, run the consolidated check:
```bash
pnpm run scripts:check
# Internally runs format:check, build, typecheck, lint (non-blocking), test:coverage
```

## Code style and formatting
We use Prettier for code formatting and ESLint for static analysis.

- Check formatting (CI fail‑fast):
```bash
pnpm format:check
```

- Write formatting fixes:
```bash
pnpm format:write
```

- Lint (non‑blocking in CI):
```bash
pnpm lint
# or
pnpm lint:fix
```

### Pre‑commit hook
We use Husky + lint‑staged to keep diffs clean. On commit, staged files are auto‑formatted and lint‑fixed:
```json
{
  "*.{js,ts,tsx,jsx,json,md,mdx,yml,yaml,cjs,mjs}": [
    "pnpm exec prettier --write",
    "pnpm exec eslint --fix --max-warnings=0"
  ]
}
```

If you don’t have pnpm installed, the hook will skip gracefully.

### ESLint + Prettier compatibility
We include eslint-config-prettier to disable formatting rules that might conflict with Prettier. If you see any rule conflicts, prefer deferring to Prettier and adjust the ESLint config in the relevant package to extend `"prettier"`.

## CI
Our CI (see .github/workflows/ci.yml) validates contributions with:

- Prettier format check (fail‑fast)
- Build + TypeScript typecheck
- ESLint (non‑blocking)
- Jest tests with coverage (artifact + Codecov on push) and JUnit XML (jest-junit) for CI analysis
- Node.js version matrix across Ubuntu and Windows (20, 22). Codecov uploads only from ubuntu+node20 on push.
- macOS sanity job to catch OS-specific issues
- E2E smoke tests per example (hello‑world, research‑agent) run as separate jobs and upload logs as artifacts

### Running the E2E smoke locally
After building the CLI, you can replicate the CI steps locally:
```bash
# Build all packages
pnpm -r build

# Hello World example
node packages/cli/dist/index.js run examples/hello-world/demo.yaml

# Research Agent example
node packages/cli/dist/index.js run examples/research-agent/demo.yaml
```

If any command exits non‑zero, the corresponding CI job will fail.

### CI artifacts and troubleshooting
- Unit tests: JUnit XML saved under `junit/` via `jest-junit`, uploaded as artifact `junit-unit-*`
- Coverage: HTML + lcov under `coverage/`, uploaded as `coverage-report-*`, and sent to Codecov on ubuntu+node20
- E2E: Logs (stdout/tee) archived and uploaded; download artifacts from the run summary when investigating failures
- Caching: We cache pnpm store across runs to speed up installation. If you suspect a cache issue, re-run without cache or modify the cache key.

## Pull Requests
- Ensure `pnpm format:check` passes locally before opening a PR
- CI runs: format check (fail‑fast), build, typecheck, lint, tests
- Keep commits scoped and conventional when possible (Commitlint is configured)

## Running tests
```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

Thanks again for contributing and making X‑Skynet better!