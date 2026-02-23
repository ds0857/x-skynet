---
id: rfc-process
title: RFC Process
sidebar_label: RFC Process
---

# RFC (Request for Comments) Process

The X-Skynet RFC process provides a consistent and transparent way for contributors to propose substantial changes to the framework. RFCs are the primary mechanism for community participation in the design of X-Skynet's future.

---

## What Requires an RFC?

**RFCs are required for:**
- New public APIs in `@x-skynet/core` or `@x-skynet/types`
- Breaking changes to existing public APIs
- New first-party plugins (`@x-skynet/plugin-*`)
- Changes to the plugin interface (`XSkynetPlugin`)
- Major changes to the CLI interface or config format
- Architectural changes that affect multiple packages
- New language or runtime support

**RFCs are NOT required for:**
- Bug fixes (use a regular PR)
- Documentation improvements
- Performance optimizations that don't change APIs
- Minor refactors within a single package
- Adding tests
- Dependency updates

**Not sure?** Open a GitHub Discussion and ask. Maintainers will guide you.

---

## RFC Lifecycle

```
[Idea] → [Draft RFC] → [Open PR] → [Discussion] → [Final Comment Period] → [Accepted/Rejected] → [Implementation]
```

| Stage | Description | Duration |
|---|---|---|
| **Draft** | Author writes the RFC document | As needed |
| **Open** | PR opened; community discusses | ≥ 2 weeks |
| **FCP** | Final Comment Period; last call for objections | 7 days |
| **Accepted** | RFC merged; implementation may begin | — |
| **Rejected** | RFC closed with explanation | — |
| **Implemented** | Feature shipped; RFC marked complete | — |

---

## How to Submit an RFC

### Step 1: Discuss Your Idea First

Before writing a full RFC, open a [GitHub Discussion](https://github.com/ds0857/x-skynet/discussions) to:
- Validate that the problem is real and worth solving
- Get early feedback on your proposed approach
- Avoid writing a detailed RFC for a clearly out-of-scope idea

### Step 2: Fork and Create the RFC File

```bash
git checkout -b rfc/my-feature-name
```

Copy the RFC template:

```bash
cp rfcs/0000-template.md rfcs/0000-my-feature-name.md
```

RFCs are numbered sequentially. Use `0000` until your PR is merged, then a maintainer assigns the final number.

### Step 3: Fill in the Template

Write your RFC following the template structure below. Be thorough — vague RFCs will be asked to clarify before discussion proceeds.

### Step 4: Open a Pull Request

```bash
git add rfcs/0000-my-feature-name.md
git commit -m "rfc: add RFC for my feature name"
git push origin rfc/my-feature-name
```

Open a PR titled: `RFC: <short description of feature>`

Tag the PR with the `rfc` label. Maintainers will review and engage.

### Step 5: Engage with Discussion

- Respond to comments and questions
- Update the RFC document as the discussion evolves (all changes are visible in git history)
- Explicitly call out any concerns you believe are unresolved

### Step 6: Final Comment Period (FCP)

When the RFC reaches rough consensus, a maintainer will mark it as **FCP**. This is a 7-day window for any final objections.

At the end of FCP, the RFC is either:
- **Accepted** and merged into `rfcs/`
- **Rejected** with a written explanation

### Step 7: Implementation

Once accepted:
- Open a tracking issue linking to the RFC
- Implement in a branch following the [Contributing guide](./contributing)
- Reference the RFC number in commits: `feat(core): implement RFC-0042 streaming memory`

---

## RFC Template

```markdown
---
rfc: 0000
title: Your Feature Title
author: Your Name (@your-github-handle)
status: Draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# RFC-0000: Your Feature Title

## Summary

One paragraph explanation of the feature.

## Motivation

Why are we doing this? What problem does it solve?
What use cases does it enable?
What is the expected outcome?

## Detailed Design

This is the bulk of the RFC. Explain the design in enough detail for
someone familiar with X-Skynet to understand it.

Include:
- New API interfaces (TypeScript types/interfaces)
- Changes to existing APIs
- Runtime behavior
- Error handling
- Configuration options

### API Changes

```typescript
// New interface
interface NewInterface {
  field: string;
}

// Modified interface
interface ExistingInterface {
  existingField: string;
  newField?: string; // NEW
}
```

### Configuration

If this RFC introduces new config options:

```typescript
// x-skynet.config.ts
export default {
  newFeature: {
    enabled: true,
    option: 'value',
  },
};
```

### Migration Guide

If this is a breaking change, provide a step-by-step migration guide.

## Drawbacks

Why should we *not* do this? Are there trade-offs?

## Alternatives

What other approaches were considered, and why were they rejected?

## Unresolved Questions

List any open questions that need to be resolved:

1. Should this feature be opt-in or opt-out by default?
2. How does this interact with the existing memory system?

## Implementation Plan

High-level steps for implementation:

1. Add new types to `@x-skynet/types`
2. Implement core logic in `@x-skynet/core`
3. Update CLI if needed
4. Add tests
5. Update documentation

Estimated effort: Small / Medium / Large
```

---

## RFC Principles

### For Authors

- **Be concrete** — Vague proposals don't drive productive discussion
- **Address trade-offs honestly** — Acknowledge drawbacks and alternatives
- **Start small** — Prefer incremental RFCs over sweeping changes
- **Stay engaged** — Abandoned RFCs will be closed after 30 days of inactivity

### For Reviewers

- **Be constructive** — Critique ideas, not people
- **Focus on "what problem does this solve"** — Not "I don't like this"
- **Suggest alternatives** when objecting
- **Declare conflicts of interest**

### For Maintainers

- Provide feedback within **2 weeks** of RFC opening
- Explain rejections clearly and thoroughly
- Prioritize RFCs from frequent contributors
- Keep FCP announcements pinned during the 7-day window

---

## Accepted RFCs

| RFC | Title | Status |
|---|---|---|
| RFC-0001 | Plugin Interface v1 | Implemented |
| RFC-0002 | Multi-agent Message Bus | Implemented |
| RFC-0003 | Streaming LLM Response Support | In Progress |

---

## Inspiration

X-Skynet's RFC process is inspired by the processes used by [Rust](https://github.com/rust-lang/rfcs), [Ember.js](https://github.com/emberjs/rfcs), and [React](https://github.com/reactjs/rfcs).
