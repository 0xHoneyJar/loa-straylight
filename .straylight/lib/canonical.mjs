// Straylight Control Plane v1 — canonical JSON + content digest (pure).
//
// Referenced artifacts (task packets, audit records) are bound to their
// SOURCE comment by a content digest so that editing the comment body after
// it is referenced changes the digest and breaks the binding. The digest is
// computed over a canonical serialization (RFC-8785-style: object keys sorted
// recursively, no insignificant whitespace) so semantically-identical
// payloads produce the same digest regardless of key order or spacing.
//
// node:crypto is a Node built-in (not an external dependency) and performs no
// network I/O — the no-network invariant (no fetch / api.github.com) holds.

import { createHash } from "node:crypto";

// Deterministic serialization: recursively sort object keys; arrays keep
// order; primitives serialize as JSON. Rejects nothing — callers pass values
// already parsed by the strict parser (which has rejected duplicate keys).
export function canonicalize(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    // NULL-PROTOTYPE accumulator: on a plain `{}` the key "__proto__" hits
    // the Object.prototype accessor, so assignment would REWIRE the
    // accumulator's prototype instead of creating an own property — the key
    // silently vanishes from the canonical output, and two payloads
    // differing only by an own "__proto__" property would collide on the
    // SAME digest (an undetectable artifact mutation). With no prototype
    // there is no accessor: every key, "__proto__" included, becomes an
    // ordinary own property, serializes, and changes the digest.
    const out = Object.create(null);
    for (const k of Object.keys(value).sort()) {
      out[k] = sortKeys(value[k]);
    }
    return out;
  }
  return value;
}

// Content digest of a parsed payload: "sha256:<hex>". Stable across key order
// and whitespace, so it identifies the SEMANTIC content of a comment payload.
export function payloadDigest(value) {
  return "sha256:" + createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}
