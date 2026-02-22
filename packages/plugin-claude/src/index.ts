import type { XSkynetPlugin } from '@xskynet/contracts'
import type { ClaudeConfig } from './types.js'
import { ClaudeExecutor } from './executor.js'

export { ClaudeConfig } from './types.js'
export { ClaudeExecutor } from './executor.js'

export function createClaudePlugin(config: ClaudeConfig): XSkynetPlugin {
  return {
    name: '@xskynet/plugin-claude',
    version: '0.1.0',
    description: 'Claude AI executor for X-Skynet',
    capabilities: ['llm.chat', 'llm.complete'],
    executors: [new ClaudeExecutor(config)],
  }
}
