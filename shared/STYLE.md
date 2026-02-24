---
id: shared-style-v0-1
title: shared/ Docs Style v0.1
status: draft
owner: Mute (Deputy GM)
lastUpdated: 2026-02-24
version: 0.1
---

# shared/ Docs Style v0.1

This doc defines frontmatter and ID conventions for files under shared/.

## Frontmatter

Required YAML keys:

- id — kebab-case stable identifier (e.g., development-plan-v0-1)
- title — short title, matches H1
- status — draft | active | deprecated
- owner — role/person
- lastUpdated — YYYY-MM-DD
- version — optional label (0.1, 1.0, etc.)

## IDs

- kebab-case
- Append version label for versioned docs: -v0-1, -v1-0
- Prefer stability; do not change IDs for minor text edits

## Headings & tone

- One H1 per file; match title
- Concise, active voice
- English first; add Chinese inline when helpful

## Links

- Use relative paths within repo
- Validate links in PR review

## File placement

- Standards live here (shared/)
- Meta explanations live in docs/meta/

## Changelog (optional)

Maintain at end of file if material changes occur.

## Checklist

- Frontmatter present and valid
- ID formatted correctly
- Title equals H1
- Links checked
- lastUpdated set to today when updating
