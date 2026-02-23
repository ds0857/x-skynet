import { describe, it, expect } from '@jest/globals';
import { ModelRouter, RouterError } from '../router.js';
import { DEFAULT_MODELS } from '../models.js';
import type { ModelConfig } from '../types.js';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function makeModel(overrides: Partial<ModelConfig> & { id: string }): ModelConfig {
  return {
    provider: 'openai',
    costPer1kTokens: 0.001,
    maxContextTokens: 8192,
    capabilities: [],
    priority: 99,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────
// Test suites
// ────────────────────────────────────────────────────────────

describe('ModelRouter — capability matching', () => {
  it('selects a model that has ALL required capabilities', () => {
    const router = new ModelRouter();
    const result = router.select({
      task: 'write a poem',
      requiredCapabilities: ['writing'],
    });
    expect(result.selectedModel.capabilities).toContain('writing');
  });

  it('selects the most capable model when multiple capabilities required', () => {
    const router = new ModelRouter();
    const result = router.select({
      task: 'reason and code',
      requiredCapabilities: ['reasoning', 'coding'],
    });
    expect(result.selectedModel.capabilities).toContain('reasoning');
    expect(result.selectedModel.capabilities).toContain('coding');
  });

  it('throws RouterError when no model satisfies required capabilities', () => {
    const router = new ModelRouter([
      makeModel({ id: 'cheap-model', capabilities: ['writing'] }),
    ]);
    expect(() =>
      router.select({ task: 'impossible', requiredCapabilities: ['coding', 'fast'] }),
    ).toThrow(RouterError);
  });
});

describe('ModelRouter — cost filtering', () => {
  it('excludes models that exceed maxCostPer1kTokens', () => {
    const router = new ModelRouter();
    const budget = 0.001; // filters out expensive models
    const result = router.select({
      task: 'simple task',
      maxCostPer1kTokens: budget,
    });
    expect(result.selectedModel.costPer1kTokens).toBeLessThanOrEqual(budget);
  });

  it('throws RouterError when budget is too low for any model', () => {
    const router = new ModelRouter();
    expect(() =>
      router.select({ task: 'impossible budget', maxCostPer1kTokens: 0.00001 }),
    ).toThrow(RouterError);
  });

  it('all fallbacks also respect the cost constraint', () => {
    const router = new ModelRouter();
    const budget = 0.002;
    const result = router.select({
      task: 'affordable task',
      maxCostPer1kTokens: budget,
    });
    for (const fb of result.fallbacks) {
      expect(fb.costPer1kTokens).toBeLessThanOrEqual(budget);
    }
  });
});

describe('ModelRouter — preferFast', () => {
  it('prefers a fast model when preferFast=true', () => {
    const fast = makeModel({ id: 'fast-model', capabilities: ['fast'], priority: 1 });
    const slow = makeModel({ id: 'slow-model', capabilities: ['reasoning'], priority: 2 });
    const router = new ModelRouter([fast, slow]);
    const result = router.select({ task: 'quick reply', preferFast: true });
    expect(result.selectedModel.id).toBe('fast-model');
  });

  it('includes reason text that mentions preferFast', () => {
    const router = new ModelRouter();
    const result = router.select({ task: 'quick reply', preferFast: true });
    expect(result.reason).toContain('preferFast');
  });
});

describe('ModelRouter — fallback logic', () => {
  it('returns ordered fallbacks after selected model', () => {
    const router = new ModelRouter();
    const result = router.select({ task: 'general task' });
    expect(Array.isArray(result.fallbacks)).toBe(true);
    // fallbacks should not include the selected model
    const ids = result.fallbacks.map((m) => m.id);
    expect(ids).not.toContain(result.selectedModel.id);
  });

  it('fallback() returns next best model excluding the failed one', () => {
    const router = new ModelRouter();
    const first = router.select({ task: 'general task' });
    const next = router.fallback(first.selectedModel, { task: 'general task' });
    expect(next).not.toBeNull();
    expect(next!.id).not.toBe(first.selectedModel.id);
  });

  it('fallback() returns null when only one model available', () => {
    const only = makeModel({ id: 'only-model', capabilities: [] });
    const router = new ModelRouter([only]);
    const result = router.select({ task: 'any task' });
    const next = router.fallback(result.selectedModel, { task: 'any task' });
    expect(next).toBeNull();
  });
});

describe('ModelRouter — scoring', () => {
  it('gives higher score to a model with more matching capabilities', () => {
    const router = new ModelRouter();
    const [capable, basic] = [
      makeModel({ id: 'capable', capabilities: ['reasoning', 'coding', 'writing'] }),
      makeModel({ id: 'basic', capabilities: ['writing'] }),
    ];
    const req = {
      task: 'test',
      requiredCapabilities: ['reasoning', 'coding', 'writing'] as const,
    };
    // capable matches all 3; basic matches only 1
    const scoreCapable = router.score(capable, { ...req, requiredCapabilities: ['reasoning', 'coding', 'writing'] });
    const scoreBasic = router.score(basic, { ...req, requiredCapabilities: ['reasoning', 'coding', 'writing'] });
    expect(scoreCapable).toBeGreaterThan(scoreBasic);
  });
});

describe('ModelRouter — DEFAULT_MODELS coverage', () => {
  it('default registry contains expected provider models', () => {
    const providers = new Set(DEFAULT_MODELS.map((m) => m.provider));
    expect(providers.has('dashscope')).toBe(true);
    expect(providers.has('anthropic')).toBe(true);
    expect(providers.has('openai')).toBe(true);
  });

  it('default registry includes qwen3-max and claude-3-5-haiku', () => {
    const ids = DEFAULT_MODELS.map((m) => m.id);
    expect(ids).toContain('qwen3-max');
    expect(ids).toContain('claude-3-5-haiku');
  });
});
