// Type surface for tests/tooling. Runtime source of truth: policy-transition.mjs
export declare const POLICY_SCHEMA_V1: "straylight.automation-policy.v1";
export declare const POLICY_SCHEMA_V2: "straylight.automation-policy.v2";
/**
 * Transition evidence. REQUIRED when the candidate appends an admission epoch;
 * ignored on the genesis and live-only paths.
 */
export interface PolicyTransitionContext {
  /** The repository this append is for, asserted independently of the evidence. */
  repository: string;
  /**
   * The full 40-hex commit SHA of the frozen main this append is authorized
   * against, asserted independently of the evidence and required to equal the
   * frontier's `frozen_main_sha` (Codex H-02).
   */
  expected_frozen_main_sha: string;
  /** A durable event frontier — see durable-frontier.mjs. */
  frontier: unknown;
}
export type PolicyTransitionResult =
  | {
      ok: true;
      /**
       * `v1-to-v2` the one-time genesis migration; `v2-live` a change to live
       * fields only (kill switch, mode, prohibitions) with the admission history
       * canonically unchanged; `v2-append` an admission history that grows, gated
       * by the frozen frontier cutover.
       */
      kind: "v1-to-v2" | "v2-live" | "v2-append";
      previous_epochs: number;
      candidate_epochs: number;
      /** epoch_ids present in the candidate beyond the preserved prefix. */
      appended: string[];
      /** The frontier evidence relied on; null when none was consulted. */
      frontier: {
        repository: string;
        frozen_main_sha: string;
        captured_at: string;
        quiescence_checked_at: string;
        write_capable_workflows: string[];
        lanes: number;
        events: number;
        max_event_created_at: string;
        appended_governs_from: string;
      } | null;
    }
  | { ok: false; errors: string[] };
/**
 * Validate a policy CHANGE: the previous committed policy's entire admission
 * history must remain a canonical prefix of the candidate's (v2→v2), or the
 * candidate must be a single genesis epoch transcribing v1's admission fields
 * without alteration (v1→v2). An APPEND additionally requires the frozen
 * frontier cutover — enabled: false on BOTH sides, exactly one new epoch, a
 * caller-named frozen main SHA the evidence agrees with, and a valid durable
 * event frontier (quiescent, with no write-capable run in flight) whose global
 * maximum the new boundary is strictly after. Independent of the runtime
 * accepted-epoch lock: it takes the previous
 * policy as input and never consults the lock table. Pure — the evidence is an
 * explicit argument, never fetched.
 */
export declare function validatePolicyTransition(
  previous: unknown,
  candidate: unknown,
  context?: PolicyTransitionContext | null
): PolicyTransitionResult;
