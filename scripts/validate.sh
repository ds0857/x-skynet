#!/usr/bin/env bash
set -euo pipefail

# Root validation script for X-Skynet monorepo
# - Installs dependencies
# - Lints
# - Typechecks
# - Builds
# - Runs tests

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found in PATH. Please install pnpm 9+" >&2
  exit 1
fi

printf "\n==> Installing dependencies (pnpm i)\n"
pnpm install --frozen-lockfile

printf "\n==> Linting (eslint)\n"
pnpm lint

printf "\n==> Type checking (tsc)\n"
pnpm typecheck

printf "\n==> Building packages\n"
pnpm build

printf "\n==> Running tests\n"
pnpm test

printf "\n✔ Validation successful\n"