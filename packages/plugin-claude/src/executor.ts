import Anthropic from '@anthropic-ai/sdk'
import type { Step, StepResult, RunContext, StepExecutor, Artifact } from '@xskynet/contracts'
import type { ClaudeConfig } from './types.js'

export class ClaudeExecutor implements StepExecutor {
  readonly kind = 'claude'
  private client: Anthropic

  constructor(private config: ClaudeConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })
  }

  async execute(step: Step, ctx: RunContext): Promise<StepResult> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model ?? 'claude-3-5-sonnet-20241022',
        max_tokens: (step.metadata?.maxTokens as number) ?? 4096,
        messages: [{ role: 'user', content: step.description ?? '' }],
        system: ctx.bag?.systemPrompt as string,
      })

      const outputText = response.content.find((c) => c.type === 'text')?.text ?? ''

      // Create output artifact
      const outputArtifact: Artifact = {
        id: `${step.id}-output` as any,
        kind: 'model_output',
        name: `claude-response-${step.id}`,
        createdAt: new Date().toISOString() as any,
        metadata: {
          model: response.model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }

      return {
        status: 'succeeded',
        output: outputArtifact,
        stats: {
          tokensInput: response.usage.input_tokens,
          tokensOutput: response.usage.output_tokens,
          costUSD: undefined,
        },
        metadata: {
          model: response.model,
          id: response.id,
          stopReason: response.stop_reason,
        },
      }
    } catch (error) {
      return {
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'CLAUSE_EXECUTION_ERROR',
          details: error,
        },
      }
    }
  }
}
