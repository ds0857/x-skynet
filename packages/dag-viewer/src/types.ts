// types.ts — X-Skynet DAG Viewer type definitions

export type StepStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export interface Step {
  /** Unique step identifier, e.g. "step-1" */
  id: string;
  /** Human-readable title */
  title: string;
  /** Agent assigned to execute this step */
  assigned_to: string;
  /** Current execution status */
  status: StepStatus;
  /**
   * IDs of steps that must complete before this step can start.
   * Empty array = root node (no dependencies).
   */
  depends_on: string[];
  /** Optional result summary written back by the worker */
  result?: string;
}

export interface Mission {
  /** Mission UUID or slug */
  id: string;
  /** Mission title */
  title: string;
  /** Who proposed this mission */
  proposed_by: string;
  /** ISO timestamp when mission was created */
  created_at: string;
  /** Ordered (or partially-ordered) list of steps */
  steps: Step[];
}
