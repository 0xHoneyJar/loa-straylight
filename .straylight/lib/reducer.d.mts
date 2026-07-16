// Type surface for tests/tooling. Runtime source of truth: reducer.mjs
export type Lane = Record<string, any>;
export type CpEvent = Record<string, any>;
export type Policy = Record<string, any>;
export interface ReduceContext {
  now?: string;
  event_observed_at?: string;
  pr_head_sha?: string;
  task_packet?: Record<string, any>;
  audit_record?: Record<string, any>;
}
export type ReduceDecision =
  | { ok: true; lane: Lane; effects: Array<{ type: string; value: string }>; note: string }
  | { ok: false; refusal: string; detail: string; lane: Lane; escalate: boolean };
export declare function reduce(
  lane: Lane,
  event: CpEvent,
  policy: Policy,
  context?: ReduceContext
): ReduceDecision;
