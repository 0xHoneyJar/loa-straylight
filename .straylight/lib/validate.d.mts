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
 * Strict UTC calendar instant → epoch millis, or null if impossible/malformed.
 * At most MILLISECOND (3-digit) fractional precision: a finer fraction is
 * rejected (null), never rounded, so distinct instants cannot collapse.
 * Every four-digit year 0000–9999 is a distinct instant: the instant is
 * constructed via setUTCFullYear with a full calendar round-trip, never
 * Date.UTC (whose legacy remapping collapses years 0–99 onto 1900–1999).
 */
export declare function parseIsoInstant(s: unknown): number | null;
