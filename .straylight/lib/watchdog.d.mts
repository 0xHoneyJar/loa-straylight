// Type surface for tests/tooling. Runtime source of truth: watchdog.mjs
export interface WatchdogAction {
  /** "post-event" | "escalate-malformed-lane" | "flag-unverifiable-head" | "flag-unverifiable-activity". */
  type: string;
  /**
   * ISSUE-KEYED ACTION CONTRACT (C8): present whenever the lane entry
   * carried the issue number it was reconstructed from. Callers key
   * posting and dedupe by it — never by a first-match lane-id → issue
   * mapping, which could post a finding on the wrong issue when a parsed
   * lane_id collides with a healthy lane elsewhere.
   */
  issue_number?: number;
  /**
   * Present ONLY when derived from readable evidence. An unreadable /
   * unreconstructable finding is keyed by the trusted issue number alone
   * and carries NO lane_id — the watchdog never fabricates a synthetic
   * lane identity (round 10 J8).
   */
  lane_id?: string;
  dedupe_key: string;
  detail: string;
  event_type?: string;
  /**
   * Deterministic, collision-resistant event id for post-event actions:
   * "evt-" + sha256(dedupe_key) truncated to 48 hex chars. Hashing the FULL
   * dedupe key (complete lane id + recovery key) guarantees two distinct
   * long lane ids / recovery keys can never share an event id.
   */
  event_id?: string;
  sequence?: number;
  prior_state?: string;
  requested_state?: string;
  head_sha?: string;
}
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
