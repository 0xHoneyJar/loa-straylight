#!/usr/bin/env node
// Verify FROZEN-WRITE QUIESCENCE of the control plane, read-only.
//
// WHAT THIS IS FOR (Codex H-02)
//
// Before a durable event frontier is captured, the operator needs a mechanical
// answer to one question:
//
//   "The freeze is the committed state of main, and NO write-capable workflow
//    run is still in flight."
//
// Merging `enabled: false` alone does not establish that. A run that started
// before the freeze landed is still executing, and it is holding a write plan
// that was authored while automation was permitted. The executor now refuses
// such a plan at write time (.straylight/lib/write-authority.mjs), which is the
// safety property; this tool establishes the separate, weaker, operator-facing
// fact that nothing was in flight — so a frontier captured next says where
// history ended rather than where it happened to be mid-flight.
//
// WHERE THE PROOF LIVES (Codex quiescence-provenance). Not here. The bounded
// live algorithm is .straylight/lib/live-quiescence.mjs § proveFrozenQuiescence,
// and scripts/capture-durable-frontier.mjs runs the SAME function rather than
// trusting this tool's output. This file is a transport and a report: it turns
// `gh api` into a read-only GET, supplies the clock, and prints. Every decision
// belongs to the library, so the two operator tools cannot drift into disagreeing
// about what quiescence means.
//
// THIS DOCUMENT IS A RECEIPT, NOT AN AUTHORITY. Its value is that an operator and
// an auditor can read what was observed, at which revision, at which instant.
// Nothing downstream treats it as a licence: the frontier capture re-establishes
// every one of these facts itself, and will refuse a capture whose fresh proof
// disagrees with a receipt it was handed. A hand-written file cannot make a
// capture succeed.
//
// WHAT IT CHECKS, in order, all read-only (see the library header for the
// authoritative list):
//
//   1. --frozen-main-sha is supplied EXPLICITLY. The tool never guesses which
//      revision the operator means to freeze at; a tool that resolved "main"
//      itself would happily verify quiescence at a revision the operator has
//      not seen.
//   2. The repository's default branch is still main.
//   3. Current main is EXACTLY the supplied frozen SHA.
//   4. The policy committed AT that SHA parses strictly, passes the FULL
//      accepted-policy validation (including the accepted-epoch locks), and has
//      enabled === false. A malformed policy is not a freeze.
//   5. The CLOSED SET of write-capable workflows is derived MECHANICALLY from the
//      workflow bytes COMMITTED AT THAT EXACT SHA — the `?ref=<sha>` directory
//      listing plus every file in it, each bound to the blob id the listing
//      reported. The local checkout is never consulted: deriving the set from
//      `.github/workflows` on disk bound it to whatever tree the process ran in,
//      so `frozen_main_sha` named a revision the workflow set had not come from.
//   6. Every run of every workflow in that set is in the terminal Actions status.
//      Any other state — queued, in_progress, waiting, requested, pending, or
//      anything GitHub adds tomorrow — counts as ACTIVE. A run id repeated across
//      pages is refused rather than deduplicated: repeated pages would let a
//      duplicated completed run pay for an omitted active one.
//   7. Main has still not moved, and a SECOND complete independent scan agrees.
//
// A refusal names the run ids and workflow identities that are still live. This
// tool NEVER cancels a run: cancelling mid-plan is its own hazard, and the
// decision belongs to the operator.
//
// WHAT IT CANNOT PROVE. Not a transactional snapshot. GitHub can create a run
// the instant after the last page is read — while frozen, a comment on any lane
// still triggers the reducer, which then takes no action but is nonetheless a
// live write-capable run. Hence the two independent scans (the same stability
// fence the protocol uses for evidence elsewhere) and the RE-VERIFY step in the
// cutover order documented in .straylight/lib/admission-locks.mjs. Two agreeing
// scans plus an unmoved main is strong evidence, not an atomic guarantee.
//
// Usage:
//   node scripts/verify-frozen-quiescence.mjs \
//     --repo <owner/name> --frozen-main-sha <40-hex> [--out <path>]
//
// Exit 0 = quiescent; the document is written to stdout (or --out) and may be
// handed to scripts/capture-durable-frontier.mjs as the OPTIONAL `--quiescence`
// receipt.
// Exit 2 = refused (not frozen, main moved, runs in flight, evidence unusable).
// GET only. Nothing is posted, edited, cancelled, labelled, or merged.

import { execFileSync } from "node:child_process";
import { writeFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { proveFrozenQuiescence } from "../.straylight/lib/live-quiescence.mjs";

function refuse(reason, detail) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...(detail ? { detail } : {}) }, null, 2) + "\n");
  process.exit(2);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

// Read-only GET, and the ONLY thing this file contributes to the proof. Every
// path is constructed by the library from validated components; this tool builds
// no host, no ref, no path, and no method. A failed read is returned as a
// refusal rather than thrown, so the library reports it as read-failed instead of
// an empty response being mistaken for an empty history.
function ghGet(path, { paginate = false } = {}) {
  const argv = paginate ? ["api", "--paginate", path] : ["api", path];
  try {
    return { ok: true, text: execFileSync("gh", argv, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }) };
  } catch (e) {
    return { ok: false, detail: String(e?.message ?? e) };
  }
}

function main() {
  const repository = arg("--repo");
  const frozenMainSha = arg("--frozen-main-sha");
  const outPath = arg("--out");
  if (repository === null) refuse("usage", "--repo <owner/name> is required");
  // EXPLICIT, never resolved for the operator: this is the revision the whole
  // cutover is bound to.
  if (frozenMainSha === null) {
    refuse("usage", "--frozen-main-sha <40-hex> is required — name the frozen revision explicitly");
  }

  const proof = proveFrozenQuiescence({
    repository,
    frozen_main_sha: frozenMainSha,
    read: ghGet,
    // Recorded by the library AFTER both scans and the final identity check, so
    // it never claims to cover a moment the reads had not reached.
    now: () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    note: (message) => process.stderr.write(`${message}\n`),
  });
  if (!proof.ok) refuse(proof.reason, proof.detail);

  const text = JSON.stringify(proof.document, null, 2) + "\n";
  if (outPath === null) process.stdout.write(text);
  else {
    writeFileSync(outPath, text);
    process.stdout.write(`wrote ${outPath}\n`);
  }
  process.stderr.write(
    `quiescent at ${proof.value.checked_at}: main ${frozenMainSha} is frozen (enabled: false) and ` +
      `${proof.scans.first}/${proof.scans.second} run(s) observed across two scans are all terminal\n`,
  );
}

// Run ONLY as a CLI. Importing must not fetch.
function invokedDirectly() {
  if (typeof process.argv[1] !== "string") return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) main();
