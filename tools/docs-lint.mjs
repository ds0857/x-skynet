#!/usr/bin/env node
/**
 * Placeholder docs lint script.
 * Currently returns exit code 0 but prints TODO guidance.
 * Future: enforce frontmatter presence and required keys for files under docs/.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

async function main() {
  const repoRoot = new URL('..', import.meta.url).pathname
  const docsDir = path.join(repoRoot, 'docs')
  let message = 'Docs Lint: OK (placeholder)\n'
  try {
    const stat = await fs.stat(docsDir)
    if (!stat.isDirectory()) throw new Error('docs path is not a directory')
    message += 'TODO: enforce frontmatter (title, owner, last_reviewed) for changed docs files.\n'
  } catch (e) {
    message += 'Note: docs/ directory not found.\n'
  }
  process.stdout.write(message)
  // Exit successfully for now
  process.exit(0)
}

main().catch((err) => {
  console.error('Docs Lint crashed:', err)
  // Still exit 0 to not block CI during bootstrap
  process.exit(0)
})
