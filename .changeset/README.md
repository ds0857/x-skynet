# Changesets

This repo uses Changesets to manage versioning and releases.

- Run `pnpm exec changeset` to create a changeset
- Run `pnpm exec changeset status` to see pending releases
- CI will publish from `main` using `.github/workflows/release-changesets.yml`
