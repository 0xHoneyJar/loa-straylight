// Type surface for tests/tooling. Runtime source of truth: watchdog.mjs
//
// WatchdogAction is a DISCRIMINATED UNION on `type` (round 11 J8):
// healthy-lane actions — post-event and the unverifiable-head/activity
// findings — are derived from a validateLane-passed lane and REQUIRE its
// lane_id; ONLY the escalate-malformed-lane finding (unreadable or
// unreconstructable evidence, keyed by the trusted issue number) may
// omit it. A "healthy post-event without a lane_id" is a compile error,
// matching the runtime, which always writes lane.lane_id onto those
// actions.

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

export interface WatchdogMalformedLaneFinding extends WatchdogActionBase {
  type: "escalate-malformed-lane";
  /**
   * Present ONLY when the caller derived a lane identity from READABLE
   * evidence (a failed reconstruction whose enumeration still scanned).
   * An unreadable / unreconstructable finding is keyed by the trusted
   * issue number alone and carries NO lane_id — the watchdog never
   * fabricates a synthetic lane identity (round 10 J8 / round 11 J8).
   */
  lane_id?: string;
  event_type?: never;
  event_id?: never;
  sequence?: never;
  prior_state?: never;
  requested_state?: never;
  head_sha?: never;
}

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
