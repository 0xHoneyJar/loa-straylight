// Straylight Control Plane v2 — loading the protocol's policy from disk.
//
// ONE place decides which validator a policy read from a file must satisfy,
// because the answer depends on WHERE the bytes came from and getting it wrong
// in one script would be enough to reopen the history-rewrite path:
//
//   the protocol's OWN committed .straylight/automation-policy.json
//       -> acceptPolicy: structural validation PLUS the full accepted-epoch
//          lock. This file claims to be the real admission history, so it must
//          BE the accepted history — every accepted epoch, at its index,
//          byte-for-byte identical to ACCEPTED_ADMISSION_EPOCH_LOCKS.
//
//   any OTHER path (an explicit --policy override)
//       -> validatePolicy: structural validation only. Such a policy is a
//          caller-supplied hypothetical (the test suite writes them to temp
//          dirs), and it is not, and does not claim to be, protocol history.
//          Demanding that it equal the accepted history would make the flag
//          useless without protecting anything.
//
// The discrimination is made on the RESOLVED REAL PATH, not on whether the
// --policy flag was present, so `--policy .straylight/automation-policy.json`
// (or a symlink to it) takes the accepting branch: if you are reading the
// committed policy, the lock applies however you spelled the path.
//
// No production workflow passes --policy. Adding one would itself be a change
// to executable protocol code, reviewable against an exact head SHA — which is
// exactly the class boundary the accepted-epoch lock exists to enforce, not a
// hole in it.
//
// Strict parsing everywhere: parseStrict rejects malformed JSON AND duplicate
// object keys anywhere in the document. A policy with two `enabled` fields is a
// contradictory kill switch, and JSON.parse would silently keep the last one.

import { readFileSync, realpathSync } from "node:fs";
import { parseStrict } from "./strict-json.mjs";
import { validatePolicy, acceptPolicy } from "./validate.mjs";

// True when `path` and `committedPath` name the same real file. Resolution
// failures (either side missing) mean "not the committed file"; the caller
// still gets structural validation, and a missing committed file is reported by
// the read below rather than guessed at here.
function isCommittedPolicy(path, committedPath) {
  try {
    return realpathSync(path) === realpathSync(committedPath);
  } catch {
    return false;
  }
}

// Read + parse + validate a policy file.
//
//   committedPath  the protocol's own automation-policy.json (required)
//   overridePath   an explicit --policy value, or null
//
// Returns { ok: true, value, path, accepted } — `accepted` records whether the
// full accepted-epoch lock was applied — or { ok: false, refusal, detail },
// with `refusal` one of "policy-unreadable" / "policy-invalid" so each caller
// can map it onto its own established failure output.
export function loadProtocolPolicy({ committedPath, overridePath = null }) {
  const path = overridePath ?? committedPath;
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    return { ok: false, refusal: "policy-unreadable", detail: String(e?.message ?? e) };
  }
  const parsed = parseStrict(text);
  if (!parsed.ok) {
    return { ok: false, refusal: "policy-unreadable", detail: `strict JSON parse failed: ${parsed.reason}` };
  }
  const accepted = isCommittedPolicy(path, committedPath);
  const check = accepted ? acceptPolicy(parsed.value) : validatePolicy(parsed.value);
  if (!check.ok) {
    return { ok: false, refusal: "policy-invalid", detail: check.errors.join("; ") };
  }
  return { ok: true, value: parsed.value, path, accepted };
}

// The same accepting decision for bytes that did NOT come from this checkout's
// filesystem: the committed automation-policy.json as fetched read-only from a
// named commit (the executor's write-time authority re-check — H-02). Those
// bytes ARE the protocol's committed policy at that revision, so they take the
// ACCEPTING branch — structural validation plus the full accepted-epoch digest
// lock — exactly as the on-disk committed file does. Keeping this decision here
// rather than in the caller preserves the invariant that one module decides
// which validator committed policy bytes must satisfy.
//
// `source` is a human-readable provenance label for the refusal detail only; it
// grants nothing. There is deliberately no non-accepting variant: any caller
// that has committed policy bytes is claiming protocol history.
export function acceptCommittedPolicyText(text, { source }) {
  if (typeof text !== "string") {
    return { ok: false, refusal: "policy-unreadable", detail: `${source}: policy bytes are not text` };
  }
  const parsed = parseStrict(text);
  if (!parsed.ok) {
    return { ok: false, refusal: "policy-unreadable", detail: `${source}: strict JSON parse failed: ${parsed.reason}` };
  }
  const check = acceptPolicy(parsed.value);
  if (!check.ok) {
    return { ok: false, refusal: "policy-invalid", detail: `${source}: ${check.errors.join("; ")}` };
  }
  return { ok: true, value: parsed.value, source, accepted: true };
}
