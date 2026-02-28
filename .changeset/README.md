# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing across the pnpm monorepo.

- For any PR that modifies code in packages, run `pnpm changeset` and commit the generated `.md` file under `.changeset/`.
- Docs/tests/CI-only changes do not require a changeset.

See the top-level RELEASE.md for the full policy.
