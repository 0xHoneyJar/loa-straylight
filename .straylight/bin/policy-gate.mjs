#!/usr/bin/env node
// Straylight Control Plane v1 — canonical workflow policy gate (no network).
//
// The SINGLE executable authority the control-plane workflows consult to
// decide whether the committed automation policy authorizes any network or
// mutation action. Textual inspection (`jq -r '.enabled'`) is NOT policy
// authority: jq -r prints `true` for the STRING "true" exactly as it does
// for the boolean true, and inspects nothing else about the policy — so a
// malformed policy could be mistaken for an enabled one, and a malformed
// kill-switch field for an engaged kill switch. This gate runs the same
// validatePolicy the reducer trusts on the COMPLETE policy, then
// distinguishes the literal boolean values of `enabled`:
//
//   exit 0  policy valid AND enabled === true  (boolean) → actions permitted
//   exit 3  policy valid AND enabled === false (boolean) → VALID kill
//           switch: take no new action (not an error; freeze, not failure)
//   exit 2  anything else — unreadable file, malformed JSON, ANY duplicate
//           object key anywhere in the document, or ANY structural
//           invalidity: enabled as the string "true"/"false", null, missing,
//           a number, an array, an object, or a boolean paired with any
//           other invalid policy field → FAIL CLOSED: never treated as
//           enabled, never treated as a valid kill switch
//
// PARSING AUTHORITY: the policy text goes through parseStrict (the same
// duplicate-key-rejecting RFC 8259 parser the protocol markers use), NEVER
// JSON.parse. JSON.parse silently keeps the LAST duplicate key, so a policy
// text reading {"enabled": false, ..., "enabled": true} — which a human
// reviewing the kill switch reads as DISABLED — would have validated as an
// ENABLED policy. A contradictory policy is ambiguous, and ambiguity fails
// closed: duplicate keys (top-level or nested) exit 2.
//
// Usage:
//   node .straylight/bin/policy-gate.mjs [--policy <policy.json>]
//
// stdout: a single JSON result { ok, enabled?, refusal?, detail? }.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseStrict } from "../lib/strict-json.mjs";
import { validatePolicy } from "../lib/validate.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function emit(result, code) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(code);
}

let policyText;
try {
  const policyPath = arg("--policy") ?? resolve(here, "..", "automation-policy.json");
  policyText = readFileSync(policyPath, "utf8");
} catch (e) {
  emit({ ok: false, refusal: "policy-unreadable", detail: String(e?.message ?? e) }, 2);
}

// Strict parse: rejects malformed JSON AND any duplicate object key anywhere
// (a duplicate `enabled` — false-then-true or true-then-false — is a
// contradictory kill switch and must never be accepted; JSON.parse would
// silently keep whichever occurrence came last).
const parsed = parseStrict(policyText);
if (!parsed.ok) {
  emit({ ok: false, refusal: "policy-unreadable", detail: `strict JSON parse failed: ${parsed.reason}` }, 2);
}
const policy = parsed.value;

const pv = validatePolicy(policy ?? null);
if (!pv.ok) {
  emit({ ok: false, refusal: "policy-invalid", detail: pv.errors.join("; ") }, 2);
}
if (policy.enabled === true) {
  emit({ ok: true, enabled: true }, 0);
}
if (policy.enabled === false) {
  emit(
    { ok: true, enabled: false, refusal: "automation-disabled", detail: "kill switch engaged (enabled: false)" },
    3,
  );
}
// Unreachable while validatePolicy requires a literal boolean `enabled`;
// kept so a future validator regression can only fail CLOSED, never open.
emit({ ok: false, refusal: "policy-invalid", detail: "enabled is not a literal boolean" }, 2);
