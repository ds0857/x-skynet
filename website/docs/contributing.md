---
id: contributing
title: Contributing Guide
sidebar_label: Contributing
---

# Contributing to X-Skynet

Thank you for your interest in contributing to X-Skynet! This guide explains how to get involved, from reporting bugs to submitting pull requests.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](https://github.com/ds0857/x-skynet/blob/main/CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for everyone.

---

## Ways to Contribute

- 🐛 **Report bugs** — Open a GitHub issue with detailed reproduction steps
- 💡 **Suggest features** — Use the [RFC process](./rfc-process) for major features
- 📝 **Improve docs** — Fix typos, add examples, clarify explanations
- 🔧 **Submit code** — Bug fixes, features, and performance improvements
- 🧪 **Write tests** — Increase test coverage for existing functionality
- 🌍 **Translations** — Help translate docs to other languages

---

## Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.0.0 |
| pnpm | ≥ 8.0.0 |
| Git | ≥ 2.30 |

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/x-skynet.git
cd x-skynet

# Add upstream remote
git remote add upstream https://github.com/ds0857/x-skynet.git
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build All Packages

```bash
pnpm build
```

### 4. Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for a specific package
pnpm --filter @x-skynet/core test
```

---

## Contribution Workflow

### Step 1: Create a Branch

Always branch from `main`. Use a descriptive branch name:

```bash
git checkout main
git pull upstream main
git checkout -b feat/add-streaming-memory-plugin
```

Branch naming conventions:

| Prefix | When to use |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code refactoring without feature change |
| `test/` | Adding or updating tests |
| `chore/` | Build process, tooling, dependencies |
| `perf/` | Performance improvement |

### Step 2: Make Your Changes

- Write your code following the [code style guidelines](#code-style)
- Add or update tests for any functionality you change
- Update relevant documentation in `website/docs/`
- Keep commits small and focused on a single concern

### Step 3: Commit

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**

```bash
git commit -m "feat(core): add streaming support to MessageBus"
git commit -m "fix(plugin-openai): handle rate limit 429 with exponential backoff"
git commit -m "docs(website): add plugin development tutorial"
git commit -m "test(core): add unit tests for PluginRegistry"
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`

### Step 4: Push and Open a PR

```bash
git push origin feat/add-streaming-memory-plugin
```

Then open a Pull Request on GitHub from your fork to `ds0857/x-skynet:main`.

**PR checklist:**
- [ ] Title follows Conventional Commits format
- [ ] Description explains **what** and **why**
- [ ] Tests added or updated
- [ ] Docs updated if applicable
- [ ] All CI checks pass
- [ ] No unrelated changes included

### Step 5: Code Review

- At least **1 maintainer approval** is required to merge
- Address review comments by pushing new commits (don't force-push during review)
- Once approved, a maintainer will squash-merge your PR

---

## Code Style

### TypeScript

```typescript
// ✅ Good — explicit types, clear naming
async function executePlugin(
  plugin: XSkynetPlugin,
  input: PluginInput,
): Promise<PluginOutput> {
  const result = await plugin.execute(input);
  return result;
}

// ❌ Bad — implicit any, unclear naming
async function run(p: any, i: any) {
  return await p.exec(i);
}
```

**Rules:**
- Strict TypeScript (`strict: true`)
- No `any` types without justification (comment required)
- Prefer `interface` over `type` for object shapes
- Use `readonly` for properties that shouldn't be mutated
- Export types explicitly

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `pluginRegistry` |
| Functions | `camelCase` | `executePlugin()` |
| Classes | `PascalCase` | `PluginRegistry` |
| Interfaces | `PascalCase` | `XSkynetPlugin` |
| Enum values | `UPPER_SNAKE` | `MessageType.DIRECT` |
| Constants | `UPPER_SNAKE` | `DEFAULT_TIMEOUT` |
| Files | `kebab-case` | `plugin-registry.ts` |

### Formatting

We use **Prettier** and **ESLint**. Run before committing:

```bash
pnpm lint        # Check for lint errors
pnpm lint:fix    # Auto-fix lint issues
pnpm format      # Format code with Prettier
```

Or install the pre-commit hook:

```bash
pnpm prepare     # Installs Husky pre-commit hooks
```

### Testing Standards

```typescript
import { PluginRegistry } from '../src/plugin-registry';
import { createMockPlugin } from './helpers';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register()', () => {
    it('should register a plugin by id', () => {
      const plugin = createMockPlugin({ id: 'test-plugin' });
      registry.register(plugin);
      expect(registry.has('test-plugin')).toBe(true);
    });

    it('should throw if plugin id already exists', () => {
      const plugin = createMockPlugin({ id: 'duplicate' });
      registry.register(plugin);
      expect(() => registry.register(plugin)).toThrow(/already registered/);
    });
  });
});
```

- Test file naming: `<module>.test.ts`
- Use `describe` blocks for grouping
- Test both happy paths and edge cases
- Mock external dependencies
- Aim for ≥ 80% coverage on new code

---

## Reporting Bugs

When filing a bug report, please include:

1. **X-Skynet version** (`x-skynet --version`)
2. **Node.js version** (`node --version`)
3. **OS and version**
4. **Minimal reproduction** — the smallest code that shows the bug
5. **Expected behavior**
6. **Actual behavior** (include error messages and stack traces)

Use the [Bug Report template](https://github.com/ds0857/x-skynet/issues/new?template=bug_report.md) on GitHub.

---

## Release Process

X-Skynet follows [Semantic Versioning](https://semver.org/). Releases are automated via CI:

1. Maintainer runs `pnpm changeset` to describe the change
2. Changesets accumulate on `main`
3. When ready to release, maintainers merge the "Version Packages" PR
4. CI publishes to npm and creates a GitHub Release

---

## Getting Help

- **GitHub Discussions** — Questions, ideas, show & tell
- **Issues** — Bug reports and confirmed feature requests
- **Discord** — (coming soon)

We appreciate every contribution, no matter how small! 🙏
