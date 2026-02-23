/**
 * workflow-loader.ts
 * Loads a YAML workflow file and converts it into a Plan
 * that can be executed by XSkynetRuntime.
 */
import fs from 'node:fs';
import yaml from 'js-yaml';
import type { Plan, Task, Step, WorkflowDefinition } from '@xskynet/contracts';

type ID = string & { readonly __brand: 'id' };
type ISODateTime = string & { readonly __brand: 'isodatetime' };

function makeId(s: string): ID {
  return s as ID;
}
function nowIso(): ISODateTime {
  return new Date().toISOString() as unknown as ISODateTime;
}

/**
 * Parse a YAML file into a WorkflowDefinition.
 */
export function loadWorkflowFile(filePath: string): WorkflowDefinition {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw) as WorkflowDefinition;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid workflow file: ${filePath}`);
  }
  if (!parsed.name) {
    throw new Error(`Workflow must have a "name" field.`);
  }
  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error(`Workflow must have at least one task.`);
  }

  return parsed;
}

/**
 * Convert a WorkflowDefinition to a Plan for the core runtime.
 */
export function workflowToPlan(wf: WorkflowDefinition): Plan {
  const createdAt = nowIso();
  const planId = makeId(`plan-${Date.now()}`);

  const tasks: Task[] = wf.tasks.map((wt) => {
    const taskId = makeId(wt.id);

    const steps: Step[] = (wt.steps ?? []).map((ws) => {
      const stepId = makeId(ws.id);
      return {
        id: stepId,
        name: ws.name,
        description: ws.description,
        status: 'idle',
        createdAt,
        // Executor is resolved by 'kind:xxx' tag
        tags: [`kind:${ws.kind}`],
        metadata: {
          ...(ws.command ? { command: ws.command } : {}),
          ...(ws.env ? { env: ws.env } : {}),
          ...(ws.metadata ?? {}),
        },
      } satisfies Step;
    });

    return {
      id: taskId,
      name: wt.name,
      description: wt.description,
      status: 'idle',
      createdAt,
      steps,
      dependsOn: wt.dependsOn?.map(makeId),
    } satisfies Task;
  });

  return {
    id: planId,
    title: wf.name,
    status: 'draft',
    createdAt,
    tasks,
  } satisfies Plan;
}
