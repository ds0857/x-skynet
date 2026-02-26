# X-Skynet Monorepo Architecture (P1-04)

This document captures the baseline monorepo architecture and the 15‑minute onboarding path. It reflects the current repo state and the agreed P1-04 improvements.

## Goals
- Clear workspace layout for core, CLI, plugins, and app demos
- Standard toolchain: Node 20+, pnpm 9+, TypeScript 5+
- Unified lint/format/test hooks and CI gates
- Documented quick start path (“15 minutes to first agent”)
- Release strategy based on Conventional Commits + Changesets

## Repository layout
- apps/
  - demo/ — demo app to validate wiring and showcase minimal usage
- packages/
  - core/ — runtime engine (library)
  - cli/ — command-line interface
  - protocol/, plugins/*, sdk-*/ etc — additional libraries/plugins
- examples/ — small runnable examples (hello-world, hello-plan, etc.)
- templates/ — boilerplates for scaffolding
- docs/ — documentation (docs/site powered by VitePress)
- .github/workflows — CI, security and release pipelines

pnpm workspace globs:
- packages/*
- examples/*
- templates/*
- apps/* (added in P1-04)

## Toolchain
- Node: >= 20 (CI uses actions/setup-node@v4 node-version: '20')
- pnpm: 9 (packageManager: pnpm@9, CI installs pnpm@9)
- TypeScript: ^5 (root and packages)

Additions in P1-04:
- Root package.json now declares engines.node
- pnpm-workspace.yaml includes apps/*

## TypeScript configuration
- Base config: tsconfig.base.json (ESNext, Bundler resolution; strict, dts, sourcemaps)
- Tests: tsconfig.test.json extends base, sets paths to local packages
- Package-level configs (e.g., packages/core/tsconfig.json) may use NodeNext for library output

Guidance:
- Libraries (published): prefer module: NodeNext, moduleResolution: NodeNext; target ES2020+; declaration: true
- Apps: extend base, set rootDir src, outDir dist

## Linting & formatting
- ESLint (repository root .eslintrc.cjs): TS/JS/React rules + Prettier interoperability
- Prettier (.prettierrc): opinionated formatting
- lint-staged: runs prettier and eslint on staged files

Scripts (root):
- lint, lint:fix, format, format:write, typecheck

## Testing
- Current: Jest + ts-jest (ESM preset), coverage thresholds and lcov/html export
- CI runs test:coverage and uploads artifacts + Codecov

Plan (P2 candidate): Evaluate migration to Vitest for faster TS/ESM testing. Keep Jest for P1 to avoid churn.

## Git hooks
- Husky hooks:
  - commit-msg: commitlint (Conventional Commits)
  - pre-commit: typecheck + lint (excludes heavy UI) + jest
  - pre-push: jest workspace

Hooks gracefully no-op when pnpm is not installed (local safety).

## CI (GitHub Actions)
- ci.yml: Node 20 + pnpm cache; install, build, typecheck, lint, tests with coverage; upload artifact; Codecov upload on push
- changeset-check.yml: enforces changeset presence when packages/** changed
- security.yml: OSV scanner + CodeQL (build for analysis)
- release.yml: tag-driven publish to npm with pnpm -r publish and GitHub release notes
- deploy-docs.yml: build and publish docs/site to GitHub Pages

Potential P2 improvements:
- Add changesets/action for automatic “Version Packages” PRs on main
- Matrix CI for Node LTSes if needed (still targeting Node 20 for dev)

## Release strategy
- Conventional Commits enforced by commitlint
- Changesets governs version bumps and changelog entries
- Tag-based publication (vX.Y.Z) triggers release workflow (npm publish + GH Release). Optionally add changesets/action in P2 for automated version PRs.

## 15-minute onboarding
Prerequisites:
- Node 20+
- pnpm 9+ (corepack enable; corepack prepare pnpm@9 --activate)

Steps:
1) Clone and install
   - git clone https://github.com/ds0857/x-skynet
   - cd x-skynet
   - pnpm install
2) Run typecheck, lint, and tests
   - pnpm typecheck
   - pnpm lint
   - pnpm test
3) Try the CLI (dev mode)
   - pnpm --filter @xskynet/cli dev
4) Run an example
   - pnpm --filter @xskynet/example-hello-world dev
5) (Optional) Run demo app
   - pnpm --filter @xskynet/app-demo dev

If any step fails, see CI status or open an issue.

## PR checklist (this PR)
- [x] Add apps/* to workspace globs
- [x] Seed apps/demo with minimal runnable app
- [x] Add ARCHITECTURE.md documenting layout, toolchain, CI, releases, and onboarding
- [x] Declare engines.node >=20 at repo root

## Follow-ups (Phase 2)
- Evaluate Vitest migration path; keep Jest for P1
- Add changesets/action to create automated Version Packages PRs
- Consider .nvmrc and/or Volta pinning for local Node reproducibility
- Expand apps/demo to showcase a real agent flow using @xskynet/core
