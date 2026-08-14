// Straylight Control Plane v2 — ACCEPTED ADMISSION EPOCH LOCKS.
//
// WHY THIS FILE EXISTS
//
// Admission policy (authorized_corridor, actor_allowlist, maximum_patch_cycles,
// lease_duration_minutes) decides whether a DURABLE PAST event was admissible.
// Replaying history through today's values makes history a function of a
// mutable file: raising lease_duration_minutes from 240 to 2880 retroactively
// turns lane-phase-50a comment 5257177236 from REFUSED (lease-expiry-unbounded)
// into ACCEPTED, silently rewriting a lane's past. Versioning admission policy
// into temporal epochs fixes WHICH values apply to a past event — but on its
// own it does not fix WHAT those values are, because the epoch is still a
// mutable object in a mutable JSON file. Editing epoch 1's
// lease_duration_minutes rewrites the same history the epoch was introduced to
// protect. Moving mutable historical authority into a mutable array is not
// sufficient.
//
// So the CONTENT of every already-accepted epoch is pinned here, in executable
// protocol code, OUTSIDE the mutable policy representation. The digest covers
// the COMPLETE canonical epoch object — its id, its temporal boundary, all four
// admission fields, and its provenance metadata — so no part of an accepted
// epoch can be altered without breaking the lock.
//
//   policy edited, lock unchanged        -> FAIL CLOSED (digest mismatch)
//   epoch appended, no lock appended     -> FAIL CLOSED (length/id mismatch)
//   lock changed, policy unchanged       -> FAIL CLOSED (digest mismatch)
//   epoch deleted / reordered / replaced -> FAIL CLOSED (id/index/length)
//
// A digest stored NEXT TO the epoch inside automation-policy.json would be
// worthless: whoever can edit the epoch can recompute that digest in the same
// edit. The lock has force only because it lives somewhere the policy edit
// does not reach.
//
// THREAT BOUNDARY — STATED HONESTLY
//
// This does not make code immutable. An operator (or anyone with write access)
// can change this file, and there is no cryptographic public anchor, no
// external notary, and no signature here. What it does is change the CLASS of
// change required to rewrite accepted history: no longer a data edit to a
// config file, but a modification of executable protocol code, which lands in
// the repository as a reviewable diff and must pass review and audit against an
// exact head SHA. Rewriting an accepted epoch stops being an ordinary policy
// action and becomes a protocol-code change that has to be argued for on the
// record. That is the whole claim; nothing stronger is asserted.
//
// APPENDING AN EPOCH (the ONLY legitimate change to accepted history)
//
// Being LAST IN THE ARRAY is not the same as being prospective. An epoch
// appended at the end whose `governs_from` points back into time that already
// has events in it is a clean append with an untouched prefix and valid locks —
// and it still re-judges recorded history. So the append runs as the FROZEN
// FRONTIER CUTOVER: three separate merges, evidence captured under the freeze.
// The normative version is .straylight/README.md § "Admission policy history";
// the rules are in .straylight/lib/policy-transition.mjs.
//
//   1. Merge a LIVE-ONLY transition setting `enabled: false`, and confirm the
//      freeze is the committed state on main.
//   2. Capture the durable event frontier read-only, under that freeze:
//      `node scripts/capture-durable-frontier.mjs --out /tmp/frontier.json`.
//   3. APPEND the new epoch to `admission_history` in automation-policy.json,
//      with a `governs_from` strictly after the previous epoch's AND strictly
//      after the frontier's `max_event_created_at`. Keep `enabled: false`.
//   4. APPEND its lock entry below (its digest is `payloadDigest(epoch)`).
//   5. Update the top-level projection to deep-equal the new final epoch.
//   6. Run `node .straylight/bin/policy-transition-check.mjs` against the
//      previous committed policy, WITH `--frontier` and `--repository`: the
//      whole previous history must remain a canonical prefix of the new one,
//      and the new boundary must clear the frontier. One epoch per transition.
//   7. Audit at an exact SHA, then merge the append WHILE STILL FROZEN. Any
//      lane event posted since step 2 makes the evidence stale — recapture.
//   8. Merge a SEPARATE live-only transition restoring `enabled: true`.
//
// Never edit an existing entry to "fix" a digest mismatch. A mismatch means the
// policy no longer says what was accepted; the answer is to restore the policy,
// not to re-point the lock.

import { payloadDigest } from "./canonical.mjs";

// The canonical content digest of a COMPLETE admission epoch object. Uses the
// protocol's existing canonicalization + digest primitive (RFC-8785-style
// canonical JSON, .straylight/lib/canonical.mjs) — the same function that pins
// task packets and audit records — so there is exactly one canonicalizer in
// the protocol and no second, drifting implementation to disagree with it.
export function admissionEpochDigest(epoch) {
  return payloadDigest(epoch);
}

// ACCEPTED epochs, in history order. Index i pins admission_history[i].
//
// An epoch appears here once it has governed real durable events. Every entry
// is frozen so a module that imports the table cannot mutate it at runtime.
export const ACCEPTED_ADMISSION_EPOCH_LOCKS = Object.freeze([
  Object.freeze({
    epoch_id: "epoch-001",
    // Transcribes the four admission fields of automation-policy.v1 exactly as
    // committed at main 5625c5be425c71fce90a22e81d123b42ed104538, governing
    // from the authenticated created_at of the earliest durable protocol event
    // in the repository (2026-07-25T20:49:00Z, issue #118 comment 5080520742).
    digest: "sha256:0b0e84ea6ff3c60b71770785954cc99cfdf85c26e2ce2f9bec3380b943a1f5cc",
  }),
]);

const LOCKED_EPOCH_IDS = Object.freeze(
  new Set(ACCEPTED_ADMISSION_EPOCH_LOCKS.map((l) => l.epoch_id)),
);

// True when `history` presents any epoch id that this build has accepted.
// Such a history is claiming to BE (part of) the accepted history, so the full
// lock applies to it — see pinnedEpochLockErrors.
export function historyClaimsAcceptedEpoch(history) {
  return Array.isArray(history) &&
    history.some((e) => e !== null && typeof e === "object" && LOCKED_EPOCH_IDS.has(e.epoch_id));
}

// THE FULL LOCK. `history` must be exactly the accepted history: same length,
// same epoch ids at the same indices, and each epoch's complete canonical
// content equal to its pinned digest. Returns [] or a list of errors.
//
// Call this at every boundary where the protocol accepts the REAL committed
// policy as authority — see acceptPolicy in validate.mjs. Structural validity
// is the caller's precondition; malformed epochs are reported as digest/id
// mismatches rather than crashing.
export function acceptedEpochLockErrors(history) {
  const errors = [];
  if (!Array.isArray(history)) {
    return ["admission_history: not an array (cannot be checked against the accepted epoch locks)"];
  }
  if (history.length !== ACCEPTED_ADMISSION_EPOCH_LOCKS.length) {
    errors.push(
      `admission_history: ${history.length} epoch(s) but ${ACCEPTED_ADMISSION_EPOCH_LOCKS.length} accepted epoch lock(s) — ` +
        "an epoch was added without appending its lock, or an accepted epoch was deleted",
    );
  }
  ACCEPTED_ADMISSION_EPOCH_LOCKS.forEach((lock, i) => {
    const epoch = history[i];
    if (epoch === undefined) {
      errors.push(`admission_history[${i}]: missing; accepted epoch ${lock.epoch_id} is not present`);
      return;
    }
    if (epoch === null || typeof epoch !== "object" || Array.isArray(epoch)) {
      errors.push(`admission_history[${i}]: not an object; accepted epoch ${lock.epoch_id} cannot be verified`);
      return;
    }
    if (epoch.epoch_id !== lock.epoch_id) {
      errors.push(
        `admission_history[${i}].epoch_id: ${JSON.stringify(epoch.epoch_id)} but accepted epoch at index ${i} is ${lock.epoch_id} ` +
          "— accepted epochs may not be reordered, renamed, or replaced",
      );
      return;
    }
    const actual = admissionEpochDigest(epoch);
    if (actual !== lock.digest) {
      errors.push(
        `admission_history[${i}] (${lock.epoch_id}): content digest ${actual} does not match the accepted lock ${lock.digest} ` +
          "— an accepted admission epoch was edited; historical admission policy is immutable",
      );
    }
  });
  return errors;
}

// THE RUNTIME BINDING applied by validatePolicy to EVERY policy it validates.
//
// validatePolicy is a pure structural validator over an arbitrary candidate
// policy — the reducer's test suite validates hypothetical policies through it,
// and a policy-transition check validates a candidate that is not yet the
// committed one. It therefore cannot demand that every policy it ever sees BE
// the accepted history. What it can demand, unconditionally, is this:
//
//   a policy that presents ANY accepted epoch id must present the accepted
//   history in full — every accepted epoch, at its index, byte-for-byte.
//
// That is what closes the rewrite path. Every edit to the committed policy's
// accepted epochs — changing a field, a boundary, or provenance; deleting,
// reordering, or inserting before one; renaming one while keeping the rest —
// leaves at least one accepted id present, so the full lock engages and the
// policy fails closed inside validatePolicy, and therefore inside reduce().
//
// The one shape this cannot catch is a history that presents NO accepted id at
// all (wholesale erasure of the accepted history and substitution of an
// entirely new one). validatePolicy cannot distinguish that from a legitimate
// hypothetical policy by content alone — the difference is PROVENANCE, not
// shape. It is caught where provenance is known instead, by two independent
// mechanisms: acceptPolicy (the full lock, applied wherever the protocol loads
// the real committed automation-policy.json — enforced for every loader by
// tests/control-plane/admission-epochs.test.ts), and the append-only policy
// transition guard, which compares a candidate against the previous committed
// policy and refuses any history that is not a prefix-preserving extension.
export function pinnedEpochLockErrors(history) {
  if (!historyClaimsAcceptedEpoch(history)) return [];
  return acceptedEpochLockErrors(history);
}
