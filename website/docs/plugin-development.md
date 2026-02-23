---
id: plugin-development
title: Plugin Development
sidebar_label: Plugin Development
---

# Plugin Development Guide

Plugins are the primary extension mechanism in X-Skynet. They allow you to add new capabilities to agents — from integrating new LLM providers to adding tool execution, memory, rate limiting, output transformation, and more.

---

## Plugin Interface

Every X-Skynet plugin implements the `XSkynetPlugin` interface from `@x-skynet/types`:

```typescript
import type { PluginContext, PluginInput, PluginOutput } from '@x-skynet/types';

interface XSkynetPlugin {
  /** Unique identifier for this plugin, e.g. "my-company/weather-tool" */
  id: string;

  /** Human-readable plugin name */
  name: string;

  /** SemVer version string */
  version: string;

  /**
   * Called once when the plugin is registered with the Runtime.
   * Use this to validate configuration, set up connections, etc.
   */
  initialize(context: PluginContext): Promise<void>;

  /**
   * Called on every agent invocation. This is the main execution hook.
   * You can read/modify input and output here.
   */
  execute(input: PluginInput): Promise<PluginOutput>;

  /**
   * Optional: called when the Runtime shuts down.
   * Use this to close connections, flush buffers, etc.
   */
  teardown?(): Promise<void>;
}
```

### Supporting Types

```typescript
interface PluginContext {
  /** The runtime instance */
  runtime: Runtime;
  /** Plugin-specific configuration passed by the user */
  config: Record<string, unknown>;
  /** Logger scoped to this plugin */
  logger: Logger;
}

interface PluginInput {
  /** The original user message */
  message: AgentMessage;
  /** Accumulated conversation history */
  history: AgentMessage[];
  /** Shared state that plugins can read/write */
  state: PluginState;
  /** Call the next plugin in the chain */
  next(): Promise<PluginOutput>;
}

interface PluginOutput {
  /** The final response content */
  content: string;
  /** Optional metadata to attach to the response */
  metadata?: Record<string, unknown>;
  /** Whether to stop processing further plugins */
  stop?: boolean;
}

interface PluginState {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
}
```

---

## Plugin Execution Model

Plugins in an agent's plugin list execute in a **middleware chain**:

```
Input Message
     ↓
Plugin[0].execute(input) → calls input.next()
     ↓
Plugin[1].execute(input) → calls input.next()
     ↓
Plugin[2].execute(input) → calls input.next()
     ↓
Plugin[n].execute(input) → (must return output; typically the LLM call)
     ↓
Output bubbles back up through the chain
```

Each plugin **must** either:
1. Call `input.next()` and return the result (passthrough/augmentation)
2. Return a `PluginOutput` directly without calling `next()` (short-circuit)

---

## Creating Your First Plugin

### Step 1: Scaffold the Package

```bash
mkdir x-skynet-plugin-weather
cd x-skynet-plugin-weather
npm init -y
npm install @x-skynet/types
npm install -D typescript @types/node
npx tsc --init
```

### Step 2: Write the Plugin

```typescript
// src/weather-plugin.ts
import type {
  XSkynetPlugin,
  PluginContext,
  PluginInput,
  PluginOutput,
} from '@x-skynet/types';

interface WeatherPluginConfig {
  apiKey: string;
  units?: 'metric' | 'imperial';
}

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  city: string;
}

async function fetchWeather(
  city: string,
  config: WeatherPluginConfig,
): Promise<WeatherData> {
  const units = config.units ?? 'metric';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${config.apiKey}&units=${units}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    temperature: data.main.temp,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    city: data.name,
  };
}

export class WeatherPlugin implements XSkynetPlugin {
  readonly id = 'weather-plugin/openweathermap';
  readonly name = 'Weather Plugin';
  readonly version = '1.0.0';

  private config!: WeatherPluginConfig;
  private logger!: PluginContext['logger'];

  async initialize(context: PluginContext): Promise<void> {
    const config = context.config as WeatherPluginConfig;

    if (!config.apiKey) {
      throw new Error('WeatherPlugin: apiKey is required in plugin config');
    }

    this.config = config;
    this.logger = context.logger;
    this.logger.info('WeatherPlugin initialized');
  }

  async execute(input: PluginInput): Promise<PluginOutput> {
    const { message, state } = input;

    // Check if the message is asking about weather
    const weatherMatch = message.content.match(
      /weather (?:in|at|for) ([a-zA-Z\s]+)/i,
    );

    if (weatherMatch) {
      const city = weatherMatch[1].trim();
      this.logger.debug(`Fetching weather for city: ${city}`);

      try {
        const weather = await fetchWeather(city, this.config);

        // Inject weather data into shared state so the LLM plugin can use it
        state.set('weatherContext', {
          city: weather.city,
          temperature: weather.temperature,
          description: weather.description,
          humidity: weather.humidity,
          units: this.config.units ?? 'metric',
        });

        this.logger.debug(`Weather fetched successfully for ${weather.city}`);
      } catch (err) {
        this.logger.warn(`Failed to fetch weather: ${(err as Error).message}`);
        // Don't block the chain; let the LLM handle it gracefully
      }
    }

    // Always pass through to the next plugin
    return input.next();
  }

  async teardown(): Promise<void> {
    this.logger.info('WeatherPlugin tearing down');
  }
}
```

### Step 3: Register and Use the Plugin

```typescript
// my-agent/src/index.ts
import { Agent, createRuntime } from '@x-skynet/core';
import { WeatherPlugin } from 'x-skynet-plugin-weather';

const weatherPlugin = new WeatherPlugin();

const agent = new Agent({
  name: 'weather-assistant',
  model: 'gpt-4o',
  systemPrompt: `You are a helpful weather assistant. 
When weather data is available in your context, use it to give accurate answers.`,
  plugins: [
    weatherPlugin,
    // LLM provider plugin must come after tool plugins
    openaiPlugin,
  ],
});

const runtime = createRuntime({
  agents: [agent],
  pluginConfig: {
    // Config keyed by plugin id
    'weather-plugin/openweathermap': {
      apiKey: process.env.OPENWEATHER_API_KEY!,
      units: 'metric',
    },
  },
});

const response = await runtime.send({
  to: 'weather-assistant',
  content: 'What is the weather in Tokyo?',
});
```

---

## Advanced Plugin Patterns

### Short-Circuit Plugin (Cache)

```typescript
export class CachePlugin implements XSkynetPlugin {
  id = 'cache-plugin';
  name = 'Response Cache';
  version = '1.0.0';

  private cache = new Map<string, { response: PluginOutput; expires: number }>();
  private ttlMs: number;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  async initialize(_context: PluginContext): Promise<void> {}

  async execute(input: PluginInput): Promise<PluginOutput> {
    const cacheKey = this.hashMessage(input.message.content);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      // Short-circuit: return cached result without calling next()
      return {
        ...cached.response,
        metadata: { ...cached.response.metadata, fromCache: true },
      };
    }

    // Call the rest of the plugin chain
    const output = await input.next();

    // Cache the result
    this.cache.set(cacheKey, {
      response: output,
      expires: Date.now() + this.ttlMs,
    });

    return output;
  }

  private hashMessage(content: string): string {
    // Simple hash — use a proper hash function in production
    return Buffer.from(content).toString('base64');
  }
}
```

### Output Transform Plugin

```typescript
export class JsonOutputPlugin implements XSkynetPlugin {
  id = 'json-output-plugin';
  name = 'JSON Output Enforcer';
  version = '1.0.0';

  async initialize(_context: PluginContext): Promise<void> {}

  async execute(input: PluginInput): Promise<PluginOutput> {
    // Augment the message to request JSON output
    const augmentedInput: PluginInput = {
      ...input,
      message: {
        ...input.message,
        content: `${input.message.content}\n\nRespond ONLY with valid JSON.`,
      },
    };

    const output = await augmentedInput.next();

    // Parse and re-serialize to validate JSON
    try {
      const parsed = JSON.parse(output.content);
      return {
        ...output,
        content: JSON.stringify(parsed, null, 2),
        metadata: { ...output.metadata, isJson: true },
      };
    } catch {
      // LLM didn't return valid JSON — return as-is with a flag
      return {
        ...output,
        metadata: { ...output.metadata, isJson: false, jsonError: true },
      };
    }
  }
}
```

### State-Sharing Between Plugins

```typescript
// Plugin A: sets state
async execute(input: PluginInput): Promise<PluginOutput> {
  const documents = await this.searchDocuments(input.message.content);
  input.state.set('retrievedDocuments', documents);
  return input.next();
}

// Plugin B: reads state set by Plugin A
async execute(input: PluginInput): Promise<PluginOutput> {
  const docs = input.state.get<Document[]>('retrievedDocuments') ?? [];

  // Inject docs into the message as context
  const context = docs.map(d => `[${d.title}]\n${d.content}`).join('\n\n---\n\n');
  const augmentedMessage = {
    ...input.message,
    content: `Context:\n${context}\n\nQuestion: ${input.message.content}`,
  };

  return input.next();
}
```

---

## Publishing Your Plugin

### Package Naming Convention

Use the prefix `x-skynet-plugin-` for discoverable community plugins:

```
x-skynet-plugin-weather
x-skynet-plugin-redis-memory
x-skynet-plugin-langfuse-tracing
```

### package.json Keywords

```json
{
  "name": "x-skynet-plugin-weather",
  "version": "1.0.0",
  "keywords": ["x-skynet", "x-skynet-plugin", "weather", "llm"],
  "peerDependencies": {
    "@x-skynet/types": "^1.0.0"
  }
}
```

### README Template

Your plugin README should include:
1. What the plugin does
2. Installation instructions
3. Configuration options (typed)
4. Usage example
5. Supported X-Skynet versions

---

## Plugin Testing

```typescript
import { WeatherPlugin } from '../src/weather-plugin';
import { createMockPluginContext, createMockPluginInput } from '@x-skynet/testing';

describe('WeatherPlugin', () => {
  let plugin: WeatherPlugin;

  beforeEach(async () => {
    plugin = new WeatherPlugin();
    const ctx = createMockPluginContext({
      config: { apiKey: 'test-key', units: 'metric' },
    });
    await plugin.initialize(ctx);
  });

  it('should inject weather data into state when message mentions a city', async () => {
    const input = createMockPluginInput({
      message: { content: 'What is the weather in Paris?' },
    });

    // Mock the fetch call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        main: { temp: 18, humidity: 65 },
        weather: [{ description: 'partly cloudy' }],
        name: 'Paris',
      }),
    });

    await plugin.execute(input);

    expect(input.state.get('weatherContext')).toMatchObject({
      city: 'Paris',
      temperature: 18,
    });
    expect(input.next).toHaveBeenCalledOnce();
  });
});
```

---

## Official Plugin Examples

| Plugin | Source | Description |
|---|---|---|
| `@x-skynet/plugin-openai` | [GitHub](https://github.com/ds0857/x-skynet) | OpenAI GPT provider |
| `@x-skynet/plugin-anthropic` | [GitHub](https://github.com/ds0857/x-skynet) | Anthropic Claude provider |
| `@x-skynet/plugin-memory` | [GitHub](https://github.com/ds0857/x-skynet) | Persistent memory adapters |

Study the source of these official plugins as reference implementations.
