# X-Skynet Quickstart (15 minutes)

This guide gets you to a running demo in ~15 minutes.

## Prerequisites

- Node.js 20.11+
- Corepack enabled (`corepack enable`)

## 1) Install

```
pnpm i
```

## 2) Build core and run demo

```
pnpm dev
```

This will build `@xskynet/core` and start `apps/demo` using tsx.

## 3) Lint, typecheck, and test

```
pnpm lint
pnpm typecheck
pnpm test
```

## 4) Explore

- Contracts live in `packages/contracts`
- Core library in `packages/core`
- CLI placeholder in `packages/cli`

## Notes

- CI runs lint/typecheck/test on Node 20
- Changesets configured for versioning (see .changeset/)
