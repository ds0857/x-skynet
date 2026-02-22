# X‑Skynet Plugin Template

This template shows how to build a first‑class plugin for the X‑Skynet platform under the plugin‑first architecture.

Goals:
- Encapsulate new capabilities behind stable contracts
- Publish as a separate package under the `@xskynet/*` namespace
- Let the core load your plugin at runtime without forking the repo

## Contracts you implement

Plugins can provide any (or all) of the following contracts exported by `@xskynet/contracts`:

- StepExecutor: execute an atomic Step and return a structured StepResult
- MemoryProvider: simple key/value read‑write storage interface
- Transport: event bus hook for emitting/subscribing DomainEvents

See the contract definitions:

TypeScript example:

import type {
  Artifact,
  RunContext,
  Step,
  StepResult,
  XSkynetPlugin,
  StepExecutor,
  MemoryProvider,
  Transport,
} from '@xskynet/contracts'

class EchoExecutor implements StepExecutor {
  readonly kind = 'example/echo'
  async execute(step: Step, ctx: RunContext): Promise<StepResult> {
    const text = (step.input?.name ?? 'hello') + ''
    const output: Artifact = {
      id: 'artifact-echo-1' as any,
      kind: 'log',
      name: 'echo',
      createdAt: new Date().toISOString() as any,
      metadata: { text }
    }
    return { status: 'succeeded', output }
  }
}

const plugin: XSkynetPlugin = {
  name: '@xskynet/example-plugin',
  version: '0.1.0',
  executors: [new EchoExecutor()],
  memoryProviders: [],
  transports: []
}

export default plugin

## Package layout

my-plugin/
- package.json            // name, version, build scripts
- src/index.ts            // export default XSkynetPlugin
- src/executors/*.ts      // StepExecutor implementations
- src/memory/*.ts         // MemoryProvider implementations
- src/transports/*.ts     // Transport implementations
- tsconfig.json

## Scaffolding a new plugin

1. Create a new workspace package under `packages/` (recommended name: `@xskynet/plugin-<area>`)
   - Example: `packages/plugin-websearch/`
2. Add a `package.json` with:
   - name: `@xskynet/plugin-websearch`
   - main/types: `dist/index.js` and `dist/index.d.ts`
   - scripts: `build`, `typecheck`
   - dependency: `@xskynet/contracts: workspace:*`
3. Implement your plugin in `src/` and export `default` as `XSkynetPlugin`
4. Build: `pnpm -w -F @xskynet/plugin-websearch build`
5. Use from apps by importing your package or dynamic‑loading from disk

## Testing locally

- Unit tests: test each executor with representative Step inputs
- Contract tests: ensure `execute()` always resolves and never throws uncaught errors
- Type tests: `pnpm -w -F @xskynet/plugin-websearch typecheck`

## Distribution

- Prefer Apache‑2.0 license (consistent with repo)
- Publish to npm with `npm publish --access public`
- Document all executors (their `kind` strings and accepted inputs)

## Design notes

- Keep Step I/O strictly typed via `Artifact`
- Avoid tight coupling with core runtime; favor small contracts
- Multiple plugins can register executors with the same `kind` as long as resolution is deterministic in the loader
