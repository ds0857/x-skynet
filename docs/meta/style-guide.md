---
# Style Guide for shared/ docs v0.1
status: draft
owner: Mute (Deputy GM)
lastUpdated: 2026-02-24
scope: shared/
---

Purpose

- Define frontmatter and ID conventions for documents under shared/
- Keep prose concise and consistent with repo tone

Frontmatter schema (YAML)

- id: stable identifier (kebab-case). Example: plan-v0-1
- title: short, human-readable title
- status: draft | active | deprecated
- owner: role or person
- lastUpdated: ISO date (YYYY-MM-DD)
- version: semver or doc version label (optional)

## Example frontmatter

id: development-plan-v0-1
title: X-Skynet Development Plan v0.1
status: draft
owner: Mute (Deputy GM)
lastUpdated: 2026-02-23
version: 0.1

---

Document IDs

- Use kebab-case
- End with version label when applicable (e.g., -v0-1)
- Prefer stable IDs that won’t change across minor edits

Headings and tone

- H1 once per file, matches title
- Short sentences, active voice
- Use bilingual notes sparingly; prefer English with inline Chinese only when needed

Links

- Relative links within repo
- Validate paths in PR review

Changelog block (optional)

- Add a “Changelog” section at end when material changes occur
- Use reverse chronological entries with date and summary

File locations

- Policy and shared process docs live under shared/
- Meta docs explaining standards live under docs/meta/

Acceptance checklist for new/updated shared docs

- Has required frontmatter
- Uses correct ID
- Title matches H1
- Links validated
- Updated lastUpdated date
