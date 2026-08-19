// Type surface for tests/tooling. Runtime source of truth: validate.mjs
export type ValidationResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: string[] };
export declare function validateLease(v: unknown): ValidationResult;
export declare function validateLane(v: unknown): ValidationResult;
export declare function validateEvent(v: unknown): ValidationResult;
export declare function validateTaskPacket(v: unknown): ValidationResult;
export declare function validateAuditRecord(v: unknown): ValidationResult;
/**
 * Structural validation of a CANDIDATE policy. Applies the accepted-epoch
 * digest lock to any history that presents an accepted epoch id (see
 * pinnedEpochLockErrors in admission-locks.mjs), but does not require an
 * arbitrary candidate to BE the accepted history.
 */
export declare function validatePolicy(v: unknown): ValidationResult;
/**
 * validatePolicy PLUS the unconditional accepted-epoch lock. Every loader of
 * the real committed .straylight/automation-policy.json must go through this,
 * so an edited, deleted, reordered, or wholesale-substituted accepted epoch
 * fails closed at the boundary where the policy claims real authority.
 */
export declare function acceptPolicy(v: unknown): ValidationResult;
/**
 * Resolve the admission epoch governing `atMillis`. Fails closed on its own
 * contract: a non-array/empty history, a malformed epoch, duplicate epoch ids,
 * non-strictly-ascending or invalid boundaries, or an instant before the
 * earliest epoch all produce errors. Structural selection only — production
 * reduce() runs validatePolicy (including the epoch locks) first.
 */
export declare function admissionPolicyFor(
  policy: unknown,
  atMillis: unknown
):
  | { ok: true; index: number; epoch_id: string; governs_from: string; admission: AdmissionPolicy }
  | { ok: false; errors: string[] };
export interface AdmissionPolicy {
  authorized_corridor: string[];
  actor_allowlist: Record<string, string[]>;
  maximum_patch_cycles: number;
  lease_duration_minutes: number;
}
/**
 * Structural errors of a whole admission_history: non-array, empty, malformed
 * epoch, duplicate epoch id, or non-strictly-ascending boundary. [] when sound.
 */
export declare function admissionHistoryErrors(history: unknown): string[];
/** The four replay-sensitive admission fields, canonical order. Frozen. */
export declare const ADMISSION_FIELDS: readonly [
  "authorized_corridor",
  "actor_allowlist",
  "maximum_patch_cycles",
  "lease_duration_minutes",
];
/** The closed actor-role set; any other allowlist key is a policy error. */
export declare const ACTOR_ROLES: readonly string[];
/**
 * A canonical payload digest, `sha256:<64 lowercase hex>`. The shape of an
 * appended epoch's `transition_evidence.frontier_digest`.
 */
export declare const FRONTIER_DIGEST_RE: RegExp;
export declare function validatePrMetadata(v: unknown): ValidationResult;
/**
 * Strict UTC calendar instant → epoch millis, or null if impossible/malformed.
 * At most MILLISECOND (3-digit) fractional precision: a finer fraction is
 * rejected (null), never rounded, so distinct instants cannot collapse.
 * Every four-digit year 0000–9999 is a distinct instant: the instant is
 * constructed via setUTCFullYear with a full calendar round-trip, never
 * Date.UTC (whose legacy remapping collapses years 0–99 onto 1900–1999).
 */
export declare function parseIsoInstant(s: unknown): number | null;
/** The one canonical "owner/name" repository pattern. */
export declare const REPO_RE: RegExp;
