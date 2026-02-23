import type { ModelConfig, RoutingRequest, RoutingResult } from './types.js';
import { DEFAULT_MODELS } from './models.js';

export class RouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RouterError';
  }
}

export class ModelRouter {
  private readonly models: ModelConfig[];

  constructor(models: ModelConfig[] = DEFAULT_MODELS) {
    this.models = [...models];
  }

  /**
   * Score a model for a given request.
   * Higher score = better fit.
   */
  score(model: ModelConfig, request: RoutingRequest): number {
    let score = 0;

    // Capability match: +10 per required capability present
    const required = request.requiredCapabilities ?? [];
    for (const cap of required) {
      if (model.capabilities.includes(cap)) {
        score += 10;
      }
    }

    // Prefer fast models if requested
    if (request.preferFast && model.capabilities.includes('fast')) {
      score += 5;
    }

    // Cost efficiency bonus: cheaper models score higher
    // Normalise to a 0-5 range (models beyond $0.005 get 0)
    const maxCost = 0.005;
    score += Math.max(0, (1 - model.costPer1kTokens / maxCost) * 5);

    // Priority tie-breaker: lower priority number = small bonus
    score += Math.max(0, 1 - model.priority * 0.01);

    return score;
  }

  /**
   * Filter models that satisfy hard constraints (cost, required capabilities).
   */
  private filter(request: RoutingRequest): ModelConfig[] {
    return this.models.filter((model) => {
      // Hard cost constraint
      if (
        request.maxCostPer1kTokens !== undefined &&
        model.costPer1kTokens > request.maxCostPer1kTokens
      ) {
        return false;
      }

      // Hard capability constraint: ALL required capabilities must be present
      const required = request.requiredCapabilities ?? [];
      for (const cap of required) {
        if (!model.capabilities.includes(cap)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Select the best model for a request, with ordered fallbacks.
   */
  select(request: RoutingRequest): RoutingResult {
    const candidates = this.filter(request);

    if (candidates.length === 0) {
      throw new RouterError(
        `No models satisfy the routing constraints (capabilities: [${(request.requiredCapabilities ?? []).join(', ')}], maxCost: ${request.maxCostPer1kTokens ?? 'unlimited'})`,
      );
    }

    // Sort by descending score, then ascending priority as tie-breaker
    const ranked = candidates
      .map((model) => ({ model, score: this.score(model, request) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.model.priority - b.model.priority;
      });

    const [best, ...rest] = ranked;

    const reasonParts: string[] = [`Selected "${best.model.id}" (score=${best.score.toFixed(2)})`];
    if (request.requiredCapabilities?.length) {
      reasonParts.push(`capabilities match: [${request.requiredCapabilities.join(', ')}]`);
    }
    if (request.maxCostPer1kTokens !== undefined) {
      reasonParts.push(`cost ≤ $${request.maxCostPer1kTokens}/1k tokens`);
    }
    if (request.preferFast) {
      reasonParts.push('preferFast=true');
    }

    return {
      selectedModel: best.model,
      reason: reasonParts.join('; '),
      fallbacks: rest.map((r) => r.model),
    };
  }

  /**
   * Convenience: return the next best model after the given one (fallback scenario).
   */
  fallback(failed: ModelConfig, request: RoutingRequest): ModelConfig | null {
    const result = this.select(request);
    const candidates = [result.selectedModel, ...result.fallbacks].filter(
      (m) => m.id !== failed.id,
    );
    return candidates[0] ?? null;
  }
}
