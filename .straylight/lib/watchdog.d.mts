// Type surface for tests/tooling. Runtime source of truth: watchdog.mjs
//
// WatchdogAction is a DISCRIMINATED UNION on `type` (round 11 J8):
// healthy-lane actions — post-event and the unverifiable-head/activity
// findings — are derived from a validateLane-passed lane and REQUIRE its
// lane_id; ONLY the escalate-malformed-lane finding (unreadable or
// unreconstructable evidence) may omit it — and that finding is itself
// a two-variant union (round 12 J3): ISSUE-KEYED (required trusted
// issue_number; lane_id present only when a pattern-valid identity was
// separately derived) or LANE-KEYED (required pattern-valid lane_id).
// No action type-checks with BOTH issue_number and lane_id absent,
// matching the runtime, which fails the sweep closed on an
// unattributable malformed entry rather than fabricating an "unknown"
// finding identity.

interface WatchdogActionBase {
  /**
   * ISSUE-KEYED ACTION CONTRACT (C8): present whenever the lane entry
   * carried the issue number it was reconstructed from. Callers key
   * posting and dedupe by it — never by a first-match lane-id → issue
   * mapping, which could post a finding on the wrong issue when a parsed
   * lane_id collides with a healthy lane elsewhere.
   */
  issue_number?: number;
  dedupe_key: string;
  detail: string;
}

export interface WatchdogPostEventAction extends WatchdogActionBase {
  type: "post-event";
  /** REQUIRED: a recovery event exists only for a validated lane. */
  lane_id: string;
  event_type: string;
  /**
   * Deterministic, collision-resistant event id: "evt-" +
   * sha256(dedupe_key) truncated to 48 hex chars. Hashing the FULL
   * dedupe key (complete lane id + recovery key) guarantees two distinct
   * long lane ids / recovery keys can never share an event id.
   */
  event_id: string;
  sequence: number;
  prior_state: string;
  requested_state?: string;
  head_sha?: string;
}

export interface WatchdogUnverifiableFinding extends WatchdogActionBase {
  type: "flag-unverifiable-head" | "flag-unverifiable-activity";
  /** REQUIRED: these findings exist only for a validated lane. */
  lane_id: string;
  event_type?: never;
  event_id?: never;
  sequence?: never;
  prior_state?: never;
  requested_state?: never;
  head_sha?: never;
}

export interface WatchdogMalformedIssueKeyedFinding extends WatchdogActionBase {
  type: "escalate-malformed-lane";
  /**
   * REQUIRED: the trusted issue number the malformed entry was scanned
   * from — the finding identity (dedupe `malformed:issue:N`).
   */
  issue_number: number;
  /**
   * Present ONLY when the caller derived a PATTERN-VALID lane identity
   * from READABLE evidence (a failed reconstruction whose enumeration
   * still scanned). The watchdog never fabricates or relays an
   * arbitrary string as identity (round 10 J8 / round 11 J8).
   */
  lane_id?: string;
  event_type?: never;
  event_id?: never;
  sequence?: never;
  prior_state?: never;
  requested_state?: never;
  head_sha?: never;
}

export interface WatchdogMalformedLaneKeyedFinding extends WatchdogActionBase {
  type: "escalate-malformed-lane";
  /**
   * REQUIRED: a pattern-valid lane identity derived from readable
   * evidence — the finding identity when no trusted issue number
   * exists (dedupe `malformed:<lane_id>:<sequence>`).
   */
  lane_id: string;
  event_type?: never;
  event_id?: never;
  sequence?: never;
  prior_state?: never;
  requested_state?: never;
  head_sha?: never;
}

/**
 * Round 12 J3: every malformed finding is EXACTLY one of issue-keyed
 * or lane-keyed — an action with neither issue_number nor lane_id is a
 * compile error, and the runtime refuses the sweep (fail closed) on
 * such input instead of emitting a `malformed:unknown:*` identity.
 */
export type WatchdogMalformedLaneFinding =
  | WatchdogMalformedIssueKeyedFinding
  | WatchdogMalformedLaneKeyedFinding;

export type WatchdogAction =
  | WatchdogPostEventAction
  | WatchdogUnverifiableFinding
  | WatchdogMalformedLaneFinding;

export interface ScanResult {
  ok: boolean;
  refusal?: string;
  detail?: string;
  actions: WatchdogAction[];
}
export declare function recoveryEventId(dedupeKey: string): string;
export declare function scan(
  lanes: Array<Record<string, any>>,
  policy: Record<string, any>,
  context?: {
    now?: string;
    pr_heads?: Record<string, string>;
    pr_head_unresolved?: Array<string | number>;
    last_activity?: Record<string, string>;
  }
): ScanResult;
