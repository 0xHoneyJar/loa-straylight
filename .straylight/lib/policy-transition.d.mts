// Type surface for tests/tooling. Runtime source of truth: policy-transition.mjs
export declare const POLICY_SCHEMA_V1: "straylight.automation-policy.v1";
export declare const POLICY_SCHEMA_V2: "straylight.automation-policy.v2";
export type PolicyTransitionResult =
  | {
      ok: true;
      /** v1→v2 migration, or an append onto an existing v2 history. */
      kind: "v1-to-v2" | "v2-append";
      previous_epochs: number;
      candidate_epochs: number;
      /** epoch_ids present in the candidate beyond the preserved prefix. */
      appended: string[];
    }
  | { ok: false; errors: string[] };
/**
 * Validate a policy CHANGE: the previous committed policy's entire admission
 * history must remain a canonical prefix of the candidate's (v2→v2), or the
 * candidate must be a single genesis epoch transcribing v1's admission fields
 * without alteration (v1→v2). Independent of the runtime accepted-epoch lock:
 * it takes the previous policy as input and never consults the lock table.
 */
export declare function validatePolicyTransition(
  previous: unknown,
  candidate: unknown
): PolicyTransitionResult;
