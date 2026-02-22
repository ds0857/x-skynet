import type { Step, StepResult, RunContext, StepExecutor } from '@xskynet/contracts';

export interface HttpStepConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export class HttpExecutor implements StepExecutor {
  readonly kind = 'http';

  async execute(step: Step, ctx: RunContext): Promise<StepResult> {
    const config = step.metadata as HttpStepConfig;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout ?? 30000);

    try {
      const response = await fetch(config.url, {
        method: config.method ?? 'GET',
        headers: { 'Content-Type': 'application/json', ...config.headers },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      const data = await response.text();

      return {
        status: response.ok ? 'succeeded' : 'failed',
        output: {
          id: crypto.randomUUID() as any,
          kind: 'model_output',
          mime: 'text/plain',
          createdAt: new Date().toISOString() as any,
        },
        metadata: {
          statusCode: response.status,
          headers: Object.fromEntries(response.headers),
          body: data,
        },
      };
    } catch (error) {
      return {
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'HTTP_REQUEST_FAILED',
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
