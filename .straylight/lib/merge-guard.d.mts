// Type surface for tests/tooling. Runtime source of truth: merge-guard.mjs
export interface MergeGuardResult {
  shadow: true;
  eligible: boolean;
  action: "report-only";
  reasons: string[];
  note: string;
}
export interface MergeGuardChecks {
  /** Total modern check runs observed on the head SHA. */
  check_runs_total: number;
  /** Check runs whose conclusion is not success/neutral/skipped. */
  check_runs_failing: number;
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
    /** Live PR draft flag; anything but false fails closed (draft not mergeable). */
    pr_draft?: boolean;
    /** Live PR base branch; must equal lane.base_branch or fails closed (retarget). */
    pr_base_ref?: string;
  }
): MergeGuardResult;
