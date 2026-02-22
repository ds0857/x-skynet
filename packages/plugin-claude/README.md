# @xskynet/plugin-claude

Claude AI executor plugin for X-Skynet.

## Features

- Execute steps using Anthropic's Claude models
- Support for official Anthropic API and compatible providers (e.g., DashScope)
- Configurable model selection and base URL
- Token usage tracking and cost estimation
- Full TypeScript support

## Installation

```bash
pnpm add @xskynet/plugin-claude
```

## Usage

```typescript
import { createClaudePlugin } from '@xskynet/plugin-claude'

const plugin = createClaudePlugin({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  // Optional: use DashScope or other compatible providers
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'claude-3-5-sonnet-20241022',
})
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **required** | Anthropic API key or compatible provider key |
| `baseURL` | `string` | `https://api.anthropic.com` | API endpoint URL (supports DashScope, etc.) |
| `model` | `string` | `claude-3-5-sonnet-20241022` | Claude model to use |

## Capabilities

- `llm.chat` - Conversational chat with Claude
- `llm.complete` - Text completion with Claude

## Supported Providers

- **Anthropic** (official) - `baseURL: 'https://api.anthropic.com'`
- **DashScope** (Alibaba) - `baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'`

## License

Apache-2.0
