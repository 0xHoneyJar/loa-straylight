// Type surface for tests/tooling. Runtime source of truth: canonical.mjs
/**
 * Deterministic serialization: object keys sorted recursively, no whitespace.
 * Own "__proto__" properties are preserved (null-prototype accumulator), so
 * payloads differing only by that key canonicalize — and digest — differently.
 */
export declare function canonicalize(value: unknown): string;
/** Content digest "sha256:<hex>" over the canonical serialization. */
export declare function payloadDigest(value: unknown): string;
