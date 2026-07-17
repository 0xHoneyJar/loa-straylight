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
export declare function evaluate(
  lane: Record<string, any> | null,
  policy: Record<string, any> | null,
  context?: {
    pr_head_sha?: string;
    checks?: MergeGuardChecks;
    /** Live PR state ("open" | "closed"); anything but "open" fails closed. */
    pr_state?: string;
    /** Live PR draft flag; anything but the OBSERVED boolean false fails closed (unknown is never defaulted). */
    pr_draft?: boolean;
    /** Live PR merged flag; anything but the OBSERVED boolean false fails closed (unknown is never defaulted). */
    pr_merged?: boolean;
    /** Live PR base branch; must equal lane.base_branch or fails closed (retarget). */
    pr_base_ref?: string;
  }
): MergeGuardResult;
