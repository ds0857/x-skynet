# Contributing

We use ESLint + Prettier across the monorepo. Before opening a PR, please run:

```
pnpm install
pnpm run format:write
pnpm run lint:fix
pnpm run typecheck
pnpm run test
```

Pre-commit hooks will format and lint changed files via lint-staged.
