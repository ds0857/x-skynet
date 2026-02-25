# Security Scanning

This repository uses GitHub Actions to run supply-chain and static analysis security checks.

## Workflows

- `.github/workflows/security.yml`
  - OSV-Scanner (via `google/osv-scanner-action` reusable workflow) scans dependency manifests and lockfiles.
    - Configured to use `osv-scanner.toml` for ignores.
    - Runs on schedule (Mondays 08:00 UTC), on push to `main`, and on pull requests to `main`.
  - Dependency Review (GitHub native) runs on pull requests to prevent introducing known vulnerable dependencies.
    - Uses `actions/dependency-review-action@v4` with `fail-on-severity: high`.
  - CodeQL static analysis runs to detect common security issues in TypeScript/JavaScript.

## Local reproduction

- OSV-Scanner: install locally and run `osv-scanner -r . --config=osv-scanner.toml`.
- Dependency Review: only runs in GitHub on PRs; you can inspect PR checks.
- CodeQL: runs in GitHub; local runs require the CodeQL CLI.

## Policy

- High and Critical severity vulnerabilities must not be introduced via PRs.
- Any ignored vulnerabilities in `osv-scanner.toml` must include a justification and be reviewed quarterly.

## References

- OSV-Scanner action docs: https://google.github.io/osv-scanner/github-action/
- Dependency Review Action: https://github.com/actions/dependency-review-action
- CodeQL Action: https://github.com/github/codeql-action
