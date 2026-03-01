# Runtime & Docs Consistency Checklist

This checklist helps keep docs, CI, and runtime behavior aligned across platforms.

- Node.js versions: 20 (min), 22 (optional matrix)
- pnpm: v9.x required (monorepo)
- OS coverage:
  - Ubuntu: full matrix (lint, typecheck, build, unit, E2E)
  - macOS: sanity (build + typecheck)
  - Windows: sanity (build + typecheck)
  - WSL: optional self-hosted smoke (hello-world)
- CI cache: pnpm store cached via actions/cache with lockfile key
- Artifacts: JUnit + coverage uploaded per unit job; E2E logs archived
- Codecov: upload on push for ubuntu+node20 only
- Quickstart in README uses `node packages/cli/dist/index.js` to avoid global link flakiness on Windows; `xskynet` bin is optional

To verify locally:

```bash
node -v  # >=20
pnpm -v  # 9.x
pnpm install --frozen-lockfile
pnpm -r build && pnpm typecheck && pnpm test:coverage
node packages/cli/dist/index.js run examples/hello-world/demo.yaml
```
