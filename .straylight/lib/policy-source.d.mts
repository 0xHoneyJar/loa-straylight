// Type surface for tests/tooling. Runtime source of truth: policy-source.mjs
/**
 * Read + strict-parse + validate a policy file, choosing the validator by the
 * bytes' RESOLVED REAL PATH:
 *
 *   the committed .straylight/automation-policy.json -> `acceptPolicy`
 *     (structural validation PLUS the full accepted-epoch digest lock)
 *   any other path (an explicit --policy override)   -> `validatePolicy`
 *     (structural validation only; a caller-supplied hypothetical)
 *
 * `accepted` records which branch ran, so a caller can report truthfully
 * whether the accepted-epoch lock was applied to the policy it is using.
 */
export declare function loadProtocolPolicy(opts: {
  committedPath: string;
  overridePath?: string | null;
}):
  | { ok: true; value: any; path: string; accepted: boolean }
  | { ok: false; refusal: "policy-unreadable" | "policy-invalid"; detail: string };
