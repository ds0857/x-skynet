# Release and Versioning Guide

This document explains how X-Skynet publishes packages and manages versions in the pnpm monorepo.

Audience:
- Contributors: how to include a changeset in your PR
- Maintainers: how to cut a release and publish to npm

---

## TL;DR

- We use Changesets + Semantic Versioning.
- Any PR that changes code in packages must include a changeset. CI will fail if code changes are present without a `.changeset/*.md` file.
- Docs/tests/CI-only changes do not require a changeset.
- Maintainers release on demand by batching changesets, bumping versions, and pushing a meta tag `vX.Y.Z` to trigger the release workflow.

---

## Versioning Strategy

- We follow Semantic Versioning per package: MAJOR.MINOR.PATCH
  - fix: patch (bug fixes, internal changes that don’t break APIs)
  - feat: minor (backward-compatible features)
  - breaking change: major (documented in the changeset body)
- The repository is a multi-package workspace. Each package can version independently.
- We use Changesets to record intent-to-release as short markdown files stored in `.changeset/`.
- Conventional Commits are encouraged, but the actual published versions are determined by the accumulated changesets.

When a PR changes code in any of these locations, include a changeset:
- `packages/**`, `src/**`, `templates/**`, `deploy/**`, `examples/**`, `website/src/**`, `website/plugins/**`

Changes that typically do NOT require a changeset:
- Documentation only (`website/docs/**`, `README.md`, `docs/**`)
- Tests only (`**/*.test.ts`), CI (`.github/**`), repo meta files

---

## Contributor Workflow: Adding a Changeset

1) Install deps (first time only)

```bash
pnpm install
```

2) Add a changeset describing your change

```bash
pnpm changeset
```

Follow the prompts:
- Select affected packages
- Choose the bump type (patch/minor/major)
- Write a short description (this becomes part of the changelog)

This command creates a file like `.changeset/awesome-change.md` and should be committed in your PR.

---

## Maintainer Workflow: Cutting a Release

We release on demand. A release is a two-step process:

1) Prepare versions and changelogs

```bash
# On the main branch with all approved changes merged
pnpm install
pnpm changeset version
# Review the generated version bumps and changelog entries
git add -A
git commit -m "chore(release): version packages via changesets"
```

2) Push and trigger the Release workflow

We use a meta tag `vX.Y.Z` to trigger `.github/workflows/release.yml`.
As a convention, align `vX.Y.Z` with the version of `@xskynet/core` (or the most prominent package) for easier tracking.

```bash
git push origin main
# Create and push the release tag
export CORE_VERSION=$(node -p "require('./packages/core/package.json').version")
git tag "v$CORE_VERSION"
git push origin "v$CORE_VERSION"
```

The Release workflow will:
- Build and publish all public packages to npm
- Create a GitHub Release with notes

Note: The workflow expects versions to already be updated in `package.json` files (done by `pnpm changeset version`).

---

## Pre-releases (alpha/beta/rc)

Use Changesets pre mode to create prereleases:

```bash
pnpm changeset pre enter alpha
# make and add changesets as usual
pnpm changeset version
# publish from prerelease versions when ready
pnpm -r publish --tag next --access public
# exit pre mode when moving back to stable
pnpm changeset pre exit
```

Tag the meta release accordingly, e.g. `v1.2.0-alpha.0`, and push the tag to trigger CI.

---

## FAQs

- Q: Why is CI failing saying “code changes detected but no changeset found”?
  A: Your PR modifies code paths that require a release note. Run `pnpm changeset` and commit the generated file.

- Q: Do docs-only PRs need changesets?
  A: No. The gate is skipped for docs/tests/CI-only changes.

- Q: Who can cut a release?
  A: Maintainers with publish permission to npm and tag rights on GitHub.
