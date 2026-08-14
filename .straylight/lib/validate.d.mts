// Type surface for tests/tooling. Runtime source of truth: validate.mjs
export type ValidationResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: string[] };
export declare function validateLease(v: unknown): ValidationResult;
export declare function validateLane(v: unknown): ValidationResult;
export declare function validateEvent(v: unknown): ValidationResult;
export declare function validateTaskPacket(v: unknown): ValidationResult;
export declare function validateAuditRecord(v: unknown): ValidationResult;
export declare function validatePolicy(v: unknown): ValidationResult;
export declare function validatePrMetadata(v: unknown): ValidationResult;
/**
 * The four replay-sensitive admission fields, canonical order. Any policy
 * change to these re-adjudicates history unless it is added as a new epoch.
 */
export declare const ADMISSION_FIELDS: readonly [
  "actor_allowlist",
  "authorized_corridor",
  "lease_duration_minutes",
  "maximum_patch_cycles",
];
export type AdmissionPolicy = {
  actor_allowlist: Record<string, string[]>;
  authorized_corridor: string[];
  lease_duration_minutes: number;
  maximum_patch_cycles: number;
};
export type AdmissionSelection =
  | { ok: true; epoch_id: string; effective_from: string; admission: AdmissionPolicy }
  | { ok: false; reason: string };
/**
 * Resolve the ONE admission epoch governing an event observed at `atMillis`
 * (authenticated GitHub comment time, epoch millis). Fails closed: no clock,
 * no fallback to the top-level projection, no "newest epoch wins" default.
 */
export declare function admissionPolicyFor(policy: unknown, atMillis: unknown): AdmissionSelection;
/**
 * Strict UTC calendar instant → epoch millis, or null if impossible/malformed.
 * At most MILLISECOND (3-digit) fractional precision: a finer fraction is
 * rejected (null), never rounded, so distinct instants cannot collapse.
 * Every four-digit year 0000–9999 is a distinct instant: the instant is
 * constructed via setUTCFullYear with a full calendar round-trip, never
 * Date.UTC (whose legacy remapping collapses years 0–99 onto 1900–1999).
 */
export declare function parseIsoInstant(s: unknown): number | null;
