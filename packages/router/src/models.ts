import type { ModelConfig } from './types.js';

/**
 * Default model registry for X-Skynet routing.
 * priority: lower number = preferred when scores are equal.
 */
export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'qwen3-max',
    provider: 'dashscope',
    costPer1kTokens: 0.004, // $0.004 / 1k tokens (input)
    maxContextTokens: 32768,
    capabilities: ['reasoning', 'coding', 'writing', 'research'],
    priority: 1,
  },
  {
    id: 'qwen3-max-2026-01-23',
    provider: 'dashscope',
    costPer1kTokens: 0.004,
    maxContextTokens: 32768,
    capabilities: ['reasoning', 'coding', 'writing', 'research'],
    priority: 2,
  },
  {
    id: 'qwen3.5-plus',
    provider: 'dashscope',
    costPer1kTokens: 0.0008,
    maxContextTokens: 131072,
    capabilities: ['reasoning', 'coding', 'writing', 'fast'],
    priority: 3,
  },
  {
    id: 'qwen3-coder-plus',
    provider: 'dashscope',
    costPer1kTokens: 0.0012,
    maxContextTokens: 131072,
    capabilities: ['coding', 'reasoning'],
    priority: 4,
  },
  {
    id: 'claude-3-5-haiku',
    provider: 'anthropic',
    costPer1kTokens: 0.001,
    maxContextTokens: 200000,
    capabilities: ['writing', 'coding', 'fast', 'research'],
    priority: 5,
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    costPer1kTokens: 0.003,
    maxContextTokens: 200000,
    capabilities: ['reasoning', 'coding', 'writing', 'research'],
    priority: 6,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    costPer1kTokens: 0.00015,
    maxContextTokens: 128000,
    capabilities: ['writing', 'fast', 'coding'],
    priority: 7,
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    costPer1kTokens: 0.005,
    maxContextTokens: 128000,
    capabilities: ['reasoning', 'coding', 'writing', 'research'],
    priority: 8,
  },
];
