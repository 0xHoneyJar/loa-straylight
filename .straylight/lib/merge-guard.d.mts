// Type surface for tests/tooling. Runtime source of truth: merge-guard.mjs
export interface MergeGuardResult {
  shadow: true;
  eligible: boolean;
  action: "report-only";
  reasons: string[];
  note: string;
}
export interface MergeGuardChecks {
  /** total_count reported by the check-runs API for the head SHA. */
  check_runs_total: number;
  /**
   * EVERY check run's conclusion, aggregated across ALL pages
   * ("success" | "neutral" | "skipped" | "failure" | "cancelled" |
   * "timed_out" | "action_required" | "stale" | "null" for in-progress).
   * A list whose length differs from check_runs_total means a page was
   * dropped and the guard fails closed.
   */
  check_run_conclusions: string[];
  /** Total legacy combined commit statuses on the head SHA. */
  commit_statuses_total: number;
  /** Combined legacy status state: "success" | "pending" | "failure" | "error". */
  commit_status_state: string;
}
/**
 * The COMPLETE normalized live PR metadata record (validatePrMetadata
 * shape — the same record the reducer workflow embeds durably in
 * system.eligibility_confirmed events). The guard fails closed unless the
 * record is present, structurally valid, fetch_ok:true, and EVERY field
 * corresponds exactly with the lane and the audited target.
 */
export interface MergeGuardPrMetadata {
  fetch_ok: boolean;
  repository?: string;
  pr_number?: number;
  state?: string;
  draft?: boolean;
  merged?: boolean;
  base_branch?: string;
  base_sha?: string;
  head_branch?: string;
  head_sha?: string;
}
export declare function evaluate(
  lane: Record<string, any> | null,
  policy: Record<string, any> | null,
  context?: {
    /**
     * Complete normalized live PR metadata. Absent, structurally invalid,
     * fetch-failed, or ANY field not corresponding exactly with the lane
     * and audited target → ineligible (fail closed). Loose single-field
     * context (a bare pr_head_sha / pr_state / pr_draft…) is never
     * accepted in its place.
     */
    pr_metadata?: MergeGuardPrMetadata;
    checks?: MergeGuardChecks;
  }
): MergeGuardResult;
