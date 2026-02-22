# Plugin Development Guide

## Introduction

Plugins extend X-Skynet's capabilities by implementing the `StepExecutor` interface to handle specific types of tasks. This guide explains how to create, implement, and publish plugins for X-Skynet.

## Understanding StepExecutor Interface

The `StepExecutor` interface is the core contract that all plugins must implement. It defines how plugins execute specific step kinds within tasks.

```typescript
interface StepExecutor<TConfig = any> {
  /**
   * Returns the step kind(s) this executor handles
   */
  getStepKinds(): string[];

  /**
   * Validates the configuration for this executor
   */
  validateConfig(config: TConfig): Promise<boolean>;

  /**
   * Executes a step and returns the result
   */
  execute(step: Step, context: ExecutionContext, config: TConfig): Promise<StepResult>;
}
```

## Creating a Simple Echo Plugin

Here's a complete example of a minimal echo plugin that returns the input as output:

### 1. Project Setup

First, create a new npm package for your plugin:

```bash
mkdir xskynet-plugin-echo
cd xskynet-plugin-echo
npm init -y
npm install @xskynet/core
npm install -D typescript @types/node
```

### 2. Implement the Echo Plugin

Create the main plugin file `src/index.ts`:

```typescript
import { StepExecutor, Step, ExecutionContext, StepResult } from '@xskynet/core';

export interface EchoPluginConfig {
  prefix?: string;
}

export class EchoStepExecutor implements StepExecutor<EchoPluginConfig> {
  constructor(private config: EchoPluginConfig = {}) {}

  getStepKinds(): string[] {
    return ['echo'];
  }

  async validateConfig(config: EchoPluginConfig): Promise<boolean> {
    // Basic validation - check if prefix is a string if provided
    if (config.prefix !== undefined && typeof config.prefix !== 'string') {
      throw new Error('EchoPluginConfig.prefix must be a string');
    }
    return true;
  }

  async execute(step: Step, context: ExecutionContext, config: EchoPluginConfig): Promise<StepResult> {
    try {
      const { message } = step.params || {};

      if (!message) {
        throw new Error('Echo step requires a "message" parameter');
      }

      const prefix = config.prefix || '';
      const output = `${prefix}${message}`;

      return {
        success: true,
        output: { echoed: output },
        metadata: {
          executionTime: Date.now(),
          stepKind: step.kind
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: {}
      };
    }
  }
}

export function createEchoPlugin(config: EchoPluginConfig = {}) {
  return {
    name: 'echo-plugin',
    version: '1.0.0',
    executors: [new EchoStepExecutor(config)]
  };
}
```

### 3. Define TypeScript Types

Create a `types.d.ts` file for better type support:

```typescript
declare module '@xskynet/core' {
  interface Step {
    kind: string;
    params?: Record<string, any>;
  }
}
```

### 4. Package Configuration

Update your `package.json`:

```json
{
  "name": "@xskynet/plugin-echo",
  "version": "1.0.0",
  "description": "Echo plugin for X-Skynet",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "keywords": [
    "xskynet",
    "plugin",
    "echo"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "@xskynet/core": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0"
  }
}
```

### 5. TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Using Your Plugin

Once your plugin is published, users can incorporate it into their X-Skynet runtime:

```typescript
import { XSkynetRuntime } from '@xskynet/core';
import { createEchoPlugin } from '@xskynet/plugin-echo';

const runtime = new XSkynetRuntime();

// Initialize the plugin with optional configuration
const echoPlugin = createEchoPlugin({
  prefix: '[ECHO] '
});

runtime.use(encodePlugin);

// Create a plan that uses the echo step
const plan = {
  id: 'echo-test-plan',
  title: 'Echo Test',
  status: 'ready',
  context: {},
  tasks: [{
    id: 'echo-task',
    kind: 'echo',
    status: 'queued',
    params: {
      message: 'Hello, X-Skynet!'
    },
    steps: [{
      id: 'echo-step-1',
      kind: 'echo',
      params: {
        message: 'This is an echo step'
      }
    }]
  }]
};

const result = await runtime.execute(plan);
console.log(result); // Will output with the configured prefix
```

## Publishing Your Plugin

To publish your plugin to npm:

1. Build your plugin:
   ```bash
   npm run build
   ```

2. Log in to npm:
   ```bash
   npm login
   ```

3. Publish your package:
   ```bash
   npm publish
   ```

## Best Practices

1. **Error Handling**: Always wrap execution in try-catch blocks and return appropriate error responses
2. **Validation**: Validate configuration in `validateConfig()` to catch issues early
3. **Async Operations**: Handle asynchronous operations properly in the `execute()` method
4. **Metadata**: Include relevant metadata in step results for debugging and monitoring
5. **Documentation**: Document your plugin's configuration options and step parameters
6. **Testing**: Write comprehensive tests for your plugin logic

## Advanced Topics

### Multiple Step Kinds
A single plugin can handle multiple step kinds by returning multiple values in `getStepKinds()`:

```typescript
getStepKinds(): string[] {
  return ['echo', 'repeat', 'transform'];
}
```

### Plugin Dependencies
If your plugin depends on other plugins, you can validate their presence:

```typescript
async validateConfig(config: MyPluginConfig, runtime: XSkynetRuntime): Promise<boolean> {
  // Check if required plugins are registered
  const registeredPlugins = runtime.getRegisteredPlugins();
  if (!registeredPlugins.some(p => p.name === 'required-plugin')) {
    throw new Error('Required plugin not registered');
  }
  return true;
}
```

With this guide, you can create powerful plugins that extend X-Skynet's capabilities while maintaining compatibility with the core architecture.