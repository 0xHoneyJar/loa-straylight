// Type surface for tests/tooling. Runtime source of truth: strict-json.mjs
export type StrictParseResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: string };

/**
 * RFC 8259 JSON parse that additionally rejects duplicate object keys
 * anywhere in the document (returns reason "duplicate-object-key").
 * Never evaluates input; no dependency on the host JSON implementation.
 */
export declare function parseStrict(text: string): StrictParseResult;
