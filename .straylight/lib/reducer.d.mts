// Type surface for tests/tooling. Runtime source of truth: reducer.mjs
export type Lane = Record<string, any>;
export type CpEvent = Record<string, any>;
export type Policy = Record<string, any>;
export interface PrMetadata {
  fetch_ok: boolean;
  repository?: string;
  pr_number?: number;
  state?: "open" | "closed";
  draft?: boolean;
  merged?: boolean;
  base_branch?: string;
  base_sha?: string;
  head_branch?: string;
  head_sha?: string;
}
export interface ReduceContext {
  now?: string;
  event_observed_at?: string;
  /** Legacy live head SHA; superseded by pr_metadata for authoritative binding. */
  pr_head_sha?: string;
  /** Authoritative live PR object at the audit frontier (R1). */
  pr_metadata?: PrMetadata | Record<string, any>;
  /** Authenticated GitHub login of the event's comment (binds lease holder). */
  comment_author?: string;
  /** Lease ids already consumed earlier in lane history (reuse is refused). */
  used_lease_ids?: Set<string> | string[];
  task_packet?: Record<string, any>;
  task_packet_digest?: string;
  task_packet_source?: { comment_id: number; author: string };
  audit_record?: Record<string, any>;
  audit_digest?: string;
  audit_source?: { comment_id: number; author: string };
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
