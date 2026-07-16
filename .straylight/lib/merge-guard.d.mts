// Type surface for tests/tooling. Runtime source of truth: merge-guard.mjs
export interface MergeGuardResult {
  shadow: true;
  eligible: boolean;
  action: "report-only";
  reasons: string[];
  note: string;
}
export declare function evaluate(
  lane: Record<string, any> | null,
  policy: Record<string, any> | null,
  context?: { pr_head_sha?: string; required_checks_passed?: boolean }
): MergeGuardResult;
