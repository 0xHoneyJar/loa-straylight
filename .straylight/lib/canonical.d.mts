// Type surface for tests/tooling. Runtime source of truth: canonical.mjs
/** Deterministic serialization: object keys sorted recursively, no whitespace. */
export declare function canonicalize(value: unknown): string;
/** Content digest "sha256:<hex>" over the canonical serialization. */
export declare function payloadDigest(value: unknown): string;
