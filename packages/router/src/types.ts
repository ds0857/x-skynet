export interface ModelConfig {
  id: string; // e.g. "qwen3-max", "claude-3-5-haiku"
  provider: 'dashscope' | 'anthropic' | 'openai';
  costPer1kTokens: number;
  maxContextTokens: number;
  capabilities: ModelCapability[];
  priority: number; // lower = preferred
}

export type ModelCapability = 'reasoning' | 'coding' | 'writing' | 'research' | 'fast';

export interface RoutingRequest {
  task: string;
  requiredCapabilities?: ModelCapability[];
  maxCostPer1kTokens?: number;
  preferFast?: boolean;
}

export interface RoutingResult {
  selectedModel: ModelConfig;
  reason: string;
  fallbacks: ModelConfig[];
}
