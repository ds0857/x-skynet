# @x-skynet/router

Intelligent multi-model LLM routing layer for X-Skynet. Automatically selects the optimal model based on task type, required capabilities, and cost constraints.

## Features

- **Capability-based routing** — match models by `reasoning`, `coding`, `writing`, `research`, `fast`
- **Cost filtering** — enforce a hard `maxCostPer1kTokens` budget
- **Fallback chain** — every `RoutingResult` includes ranked fallback models
- **Extensible** — pass any custom `ModelConfig[]` to override the default registry

## Installation

```bash
pnpm add @x-skynet/router
```

## Quick Start

```typescript
import { ModelRouter } from '@x-skynet/router';

const router = new ModelRouter();

const result = router.select({
  task: 'Write a detailed research report on LLMs',
  requiredCapabilities: ['research', 'writing'],
  maxCostPer1kTokens: 0.005,
});

console.log(result.selectedModel.id); // e.g. "qwen3-max"
console.log(result.reason);           // human-readable explanation
console.log(result.fallbacks);        // ordered fallback models
```

## API

### `ModelRouter`

```typescript
class ModelRouter {
  constructor(models?: ModelConfig[]);   // defaults to DEFAULT_MODELS
  select(request: RoutingRequest): RoutingResult;
  score(model: ModelConfig, request: RoutingRequest): number;
  fallback(failed: ModelConfig, request: RoutingRequest): ModelConfig | null;
}
```

### Types

```typescript
interface ModelConfig {
  id: string;
  provider: 'dashscope' | 'anthropic' | 'openai';
  costPer1kTokens: number;
  maxContextTokens: number;
  capabilities: ModelCapability[];
  priority: number; // lower = preferred
}

type ModelCapability = 'reasoning' | 'coding' | 'writing' | 'research' | 'fast';

interface RoutingRequest {
  task: string;
  requiredCapabilities?: ModelCapability[];
  maxCostPer1kTokens?: number;
  preferFast?: boolean;
}

interface RoutingResult {
  selectedModel: ModelConfig;
  reason: string;
  fallbacks: ModelConfig[];
}
```

## Default Models

| Model | Provider | Cost/1k | Capabilities |
|-------|----------|---------|--------------|
| qwen3-max | dashscope | $0.004 | reasoning, coding, writing, research |
| qwen3.5-plus | dashscope | $0.0008 | reasoning, coding, writing, fast |
| qwen3-coder-plus | dashscope | $0.0012 | coding, reasoning |
| claude-3-5-haiku | anthropic | $0.001 | writing, coding, fast, research |
| claude-3-5-sonnet | anthropic | $0.003 | reasoning, coding, writing, research |
| gpt-4o-mini | openai | $0.00015 | writing, fast, coding |
| gpt-4o | openai | $0.005 | reasoning, coding, writing, research |

## License

Apache-2.0
