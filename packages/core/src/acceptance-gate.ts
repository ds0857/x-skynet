import * as fs from 'fs/promises';

export interface AcceptanceCriteria {
  requiredFiles?: string[];
  maxErrors?: number;
  customCheck?: (result: AcceptableTaskResult) => boolean | Promise<boolean>;
}

export interface AcceptableTaskResult {
  success: boolean;
  output: unknown;
  error?: string;
}

export interface AcceptanceResult {
  passed: boolean;
  reason: string;
  details: Record<string, unknown>;
}

export class AcceptanceGate {
  async verify(
    taskResult: AcceptableTaskResult,
    criteria: AcceptanceCriteria = {},
  ): Promise<AcceptanceResult> {
    const details: Record<string, unknown> = {};

    if (!taskResult.success && (criteria.maxErrors ?? 0) === 0) {
      return {
        passed: false,
        reason: `Task failed: ${taskResult.error ?? 'unknown error'}`,
        details,
      };
    }

    if (criteria.requiredFiles && criteria.requiredFiles.length > 0) {
      const missing: string[] = [];
      for (const file of criteria.requiredFiles) {
        try {
          await fs.access(file);
        } catch {
          missing.push(file);
        }
      }
      details['missingFiles'] = missing;
      if (missing.length > 0) {
        return {
          passed: false,
          reason: `Missing required files: ${missing.join(', ')}`,
          details,
        };
      }
    }

    if (criteria.customCheck) {
      const ok = await Promise.resolve(criteria.customCheck(taskResult));
      details['customCheck'] = ok;
      if (!ok) {
        return { passed: false, reason: 'Custom acceptance check failed', details };
      }
    }

    return { passed: true, reason: 'All acceptance criteria met', details };
  }
}
