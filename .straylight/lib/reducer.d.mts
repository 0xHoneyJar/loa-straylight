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
  /**
   * REQUIRED. The authenticated GitHub comment created_at of the event being
   * reduced. Selects the admission epoch, sets the lease grant instant, and
   * decides whether a completion was timely. There is deliberately NO `now`
   * fallback: the reducer's own run clock is not authority over any question
   * about a past event. Omitting it refuses with `event-time-unavailable`.
   */
  event_observed_at: string;
  /** Authenticated GitHub login of the event's comment (binds lease holder). */
  comment_author?: string;
  /** Lease ids already consumed earlier in lane history (reuse is refused). */
  used_lease_ids?: Set<string> | string[];
  task_packet?: Record<string, any>;
  task_packet_source?: { comment_id: number; author: string };
  audit_record?: Record<string, any>;
  audit_source?: { comment_id: number; author: string };
}
export type ReduceDecision =
  | { ok: true; lane: Lane; effects: Array<{ type: string; value: string }>; note: string }
  | { ok: false; refusal: string; detail: string; lane: Lane; escalate: boolean };
/**
 * DETERMINISM INVARIANT: reduce() consults no transient live signal. Live PR
 * facts enter the protocol only as the durable pr_metadata field of a
 * system.eligibility_confirmed event, re-validated on every replay.
 */
export declare function reduce(
  lane: Lane,
  event: CpEvent,
  policy: Policy,
  context?: ReduceContext
): ReduceDecision;
