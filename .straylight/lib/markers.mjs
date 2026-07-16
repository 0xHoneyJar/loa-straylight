// Straylight Control Plane v1 — machine-payload extraction (pure).
//
// A machine-readable payload is embedded in issue/PR bodies and comments as:
//
//   <!-- straylight:<kind>:v1 -->
//   ```json
//   { ... }
//   ```
//
// Comment content is UNTRUSTED input. This module never evaluates it,
// never interpolates it into shell, and fails closed on ambiguity:
// zero markers → no payload; more than one marker of the requested kind
// in one body → reject (an attacker must not be able to smuggle a second
// payload past a parser that "takes the first/last one"). JSON bodies are
// parsed with the strict parser (`strict-json.mjs`), which rejects
// duplicate object keys — the built-in JSON.parse silently keeps the last
// duplicate, letting a payload a human reads as `"verdict":"REJECT"` reduce
// as `"verdict":"ACCEPT"`.

import { parseStrict } from "./strict-json.mjs";

export const MARKERS = Object.freeze({
  lane: "straylight:lane:v1",
  event: "straylight:event:v1",
  taskPacket: "straylight:task-packet:v1",
  audit: "straylight:audit:v1",
  reducerResult: "straylight:reducer-result:v1",
  watchdogResult: "straylight:watchdog-result:v1",
  mergeGuardResult: "straylight:merge-guard-result:v1",
});

const MARKER_RE = /<!--\s*(straylight:[a-z-]+:v\d+)\s*-->/g;
const FENCE_OPEN = "```json";
const FENCE_CLOSE = "```";
const MAX_PAYLOAD_BYTES = 65536;

// Extract the single payload of `marker` from `body`.
// Returns { ok: true, value } or { ok: false, reason }.
export function extractPayload(body, marker) {
  if (typeof body !== "string" || typeof marker !== "string") {
    return { ok: false, reason: "invalid-input" };
  }
  const occurrences = [];
  for (const m of body.matchAll(MARKER_RE)) {
    if (m[1] === marker) occurrences.push(m.index + m[0].length);
  }
  if (occurrences.length === 0) {
    return { ok: false, reason: "no-payload" };
  }
  if (occurrences.length > 1) {
    return { ok: false, reason: "ambiguous-multiple-payloads" };
  }
  const start = occurrences[0];
  const fenceStart = body.indexOf(FENCE_OPEN, start);
  if (fenceStart === -1) {
    return { ok: false, reason: "missing-json-fence" };
  }
  // Only whitespace may sit between the marker and its fence; otherwise a
  // marker could bind to a fence in unrelated later prose.
  if (body.slice(start, fenceStart).trim() !== "") {
    return { ok: false, reason: "marker-fence-separated" };
  }
  const jsonStart = fenceStart + FENCE_OPEN.length;
  const fenceEnd = body.indexOf(FENCE_CLOSE, jsonStart);
  if (fenceEnd === -1) {
    return { ok: false, reason: "unterminated-json-fence" };
  }
  const raw = body.slice(jsonStart, fenceEnd);
  if (Buffer.byteLength(raw, "utf8") > MAX_PAYLOAD_BYTES) {
    return { ok: false, reason: "payload-too-large" };
  }
  const parsed = parseStrict(raw);
  if (!parsed.ok) {
    // Duplicate object keys surface as `duplicate-object-key`; everything
    // else is generic malformed JSON. Both fail closed.
    return {
      ok: false,
      reason: parsed.reason === "duplicate-object-key"
        ? "ambiguous-duplicate-key"
        : "malformed-json",
    };
  }
  const value = parsed.value;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "payload-not-object" };
  }
  return { ok: true, value };
}

// Render a payload block. Inverse of extractPayload for well-formed input.
export function renderPayload(marker, value) {
  return `<!-- ${marker} -->\n${FENCE_OPEN}\n${JSON.stringify(value, null, 2)}\n${FENCE_CLOSE}`;
}

// True when the body contains any straylight marker of the given kind
// (used for cheap has-a-payload checks without full parsing).
export function hasMarker(body, marker) {
  if (typeof body !== "string") return false;
  for (const m of body.matchAll(MARKER_RE)) {
    if (m[1] === marker) return true;
  }
  return false;
}
