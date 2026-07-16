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
