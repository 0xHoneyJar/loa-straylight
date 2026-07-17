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
 */
export declare function parseIsoInstant(s: unknown): number | null;
