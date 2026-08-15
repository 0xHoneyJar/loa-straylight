#!/usr/bin/env node
// Capture the DURABLE EVENT FRONTIER of the control plane, read-only.
//
// WHAT THIS IS FOR
//
// Appending an admission epoch is only safe if the new epoch's `governs_from`
// lies strictly after every protocol event that already exists — otherwise the
// append silently re-judges recorded history (see
// .straylight/lib/durable-frontier.mjs). This tool produces the evidence that
// says where history ended: every cp-lane, its last protocol event, that event's
// AUTHENTICATED GitHub created_at, and how many protocol events the lane holds.
//
// It does NOT authorize anything. It produces a document for operator review and
// exact-SHA audit, which .straylight/bin/policy-transition-check.mjs then
// consumes as `--frontier`.
//
// PROCEDURE. Capture only AFTER a live-only transition setting `enabled: false`
// is the committed state of main. The transition guard enforces the freeze
// ordering; capturing while automation can still write, or while a run authored
// under `enabled: true` is still in flight, would produce evidence that is stale
// the moment it is written.
//
// THE CAPTURE PROVES ITS OWN QUIESCENCE (Codex quiescence-provenance, HIGH)
//
// It used to take the operator's quiescence document as the licence: validate its
// shape, check that it named the right repository and revision, and then copy its
// three evidence fields into the frontier. That made a FILE the authority. A
// hand-written document — correct frozen SHA, correct workflow list,
// `active_write_runs: []`, plausible instant — passed every check while the policy
// committed at that revision still said `enabled: true`, and the capture emitted a
// perfectly valid frontier. "This document says quiescence was proven" had become
// a substitute for "quiescence was actually proven".
//
// So the capture now runs the live proof ITSELF — the same
// .straylight/lib/live-quiescence.mjs § proveFrozenQuiescence that
// scripts/verify-frozen-quiescence.mjs runs, against GitHub, at the exact frozen
// revision — TWICE: once before the lane reads and once after them. Each proof
// re-establishes the repository's default branch, that main IS the frozen
// revision, that the policy committed AT that revision is an accepted policy with
// `enabled === false`, the write-capable workflow set derived from the workflow
// bytes COMMITTED AT THAT COMMIT (never the local checkout), and two complete
// duplicate-free scans showing no run in flight. The frontier carries the SECOND
// proof's evidence, so what it records is what was still true after the last lane
// comment had been read.
//
// `--quiescence` IS NOW OPTIONAL, AND IS A RECEIPT. If supplied it is validated
// and compared against the fresh proof, and a disagreement — different
// repository, different revision, different write-capable set, or an instant
// later than the proof itself — REFUSES the capture. Agreement grants nothing:
// none of its fields reach the frontier. A hand-written file can never cause this
// tool to accept; it can only cause it to refuse.
//
// AUTHENTICATED TIME ONLY. Every time in the output is a GitHub-recorded
// `created_at`. Actor-supplied `occurred_at` inside an event payload is not
// authority and is never read here. Prior reducer-result / watchdog-result
// comments are not authority either: they carry no protocol marker and are inert.
//
// EVENTS ARE THE ADMISSION UNIT. `straylight:event:v1` comments are what the
// reducer ADMITS, each judged under the epoch governing its own created_at. Task
// packets and audit records are referenced artifacts, adjudicated at the time of
// the event that references them, so the bound that matters is the event
// frontier. A packet posted after the last event does not move it; the event that
// later references that packet is a NEW event and is judged under whichever epoch
// then governs it.
//
// DISCOVERY. Lanes are discovered the way the rest of the control plane discovers
// them: by the canonical `straylight:lane:v1` marker parser (lane-target.mjs
// scanLanes) over an issue enumeration parsed by evidence.mjs. Two enumerations
// are fetched and UNIONED — the plain `state=all` enumeration and the
// `labels=cp-lane` enumeration — because the label is a derived convenience
// projection and never discovery authority (ADR-050 §1.1), while the union also
// cross-checks one enumeration's pagination against the other's.
//
// FAIL CLOSED. Any unreadable lane genesis, any duplicated lane_id, any
// ambiguous or malformed protocol payload, and any enumeration the evidence
// parser refuses aborts the capture. A frontier that quietly omitted material
// would be worse than no frontier at all: it would bound the append too early
// and license exactly the backdating it exists to prevent.
//
// WHAT IT STILL CANNOT PROVE. Not a transactional snapshot: GitHub offers no
// point-in-time read across issues, workflow runs, and commits, so what two
// proofs bracketing the lane reads establish is stability, not atomicity. Nor can
// it prove that GitHub returned everything, or that nobody writes a lane comment
// after the last proof. `operator:eileen` is the control-plane authority and must
// not write lane events during a cutover; if one is posted anyway, this evidence
// is stale — recapture, and move the candidate boundary if necessary.
//
// Usage:
//   node scripts/capture-durable-frontier.mjs \
//     --frozen-main-sha <40-hex> \
//     [--quiescence <file>] [--repo 0xHoneyJar/loa-straylight] [--out <path>]
//
// Writes deterministic JSON (lanes sorted by issue number) to stdout, or to
// --out. Read-only: GET only. Nothing is posted, edited, labelled, or merged.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MARKERS, extractPayload } from "../.straylight/lib/markers.mjs";
import { parseIssuePages, parseCommentPages } from "../.straylight/lib/evidence.mjs";
import { scanLanes } from "../.straylight/lib/lane-target.mjs";
import { buildDurableFrontier } from "../.straylight/lib/durable-frontier.mjs";
import { validateFrozenQuiescence } from "../.straylight/lib/frozen-quiescence.mjs";
import { proveFrozenQuiescence, receiptAgreesWithProof } from "../.straylight/lib/live-quiescence.mjs";
import { parseStrict } from "../.straylight/lib/strict-json.mjs";
import { MAIN_SHA_RE } from "../.straylight/lib/write-authority.mjs";
import { parseIsoInstant } from "../.straylight/lib/validate.mjs";

const EVENT_MARKER_RE = /<!--\s*straylight:event:v1\s*-->/g;

function die(msg) {
  process.stderr.write(`capture-durable-frontier: ${msg}\n`);
  process.exit(1);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

/**
 * Reduce one lane's comments to its frontier entry.
 *
 * PURE: no network, no clock. Exported so the capture logic is testable offline
 * against fixture comment streams instead of only against the live API.
 *
 * Returns { ok: true, entry } or { ok: false, reason } — an ambiguous or
 * unreadable event comment is a refusal, never an omission.
 */
export function laneFrontierEntry({ issue_number, lane_id, comments }) {
  if (!Array.isArray(comments)) return { ok: false, reason: "comments-not-array" };
  let count = 0;
  let lastId = null;
  let lastCreatedAt = null;
  let lastMillis = null;
  for (const c of comments) {
    const body = typeof c?.body === "string" ? c.body : "";
    const occurrences = body.match(EVENT_MARKER_RE)?.length ?? 0;
    if (occurrences === 0) continue;
    if (occurrences > 1) {
      return { ok: false, reason: `comment ${c?.id}: straylight:event:v1 appears ${occurrences} times (ambiguous)` };
    }
    const payload = extractPayload(body, MARKERS.event);
    if (!payload.ok) {
      return { ok: false, reason: `comment ${c?.id}: event marker present but payload unreadable (${payload.reason})` };
    }
    if (!Number.isInteger(c.id) || c.id < 1) return { ok: false, reason: `an event comment lacks a positive integer id` };
    const millis = parseIsoInstant(c.created_at);
    if (millis === null) {
      return { ok: false, reason: `comment ${c.id}: created_at ${JSON.stringify(c.created_at)} is not a UTC instant` };
    }
    count += 1;
    // The LATEST authenticated time wins, not the last in enumeration order:
    // the frontier is a bound on time, and enumeration order is not a promise.
    //
    // TIES (Codex low). GitHub's created_at has one-second resolution, so two
    // events on one lane can share it exactly. Time alone therefore does not
    // totally order the candidates, and "keep the first seen" made the recorded
    // last_event_comment_id a function of ENUMERATION ORDER — two captures of
    // identical history could disagree on the id while agreeing on the bound.
    // The greater comment id breaks the tie: comment ids are monotonically
    // increasing per repository, so among events sharing a second the greatest
    // id is the one GitHub accepted last. This changes no authority — the epoch
    // boundary is still governed by TIME (last_event_created_at and the derived
    // max), and both tied candidates carry the same time — it only makes the
    // recorded identity deterministic.
    if (lastMillis === null || millis > lastMillis || (millis === lastMillis && c.id > lastId)) {
      lastMillis = millis;
      lastCreatedAt = c.created_at;
      lastId = c.id;
    }
  }
  return {
    ok: true,
    entry: {
      issue_number,
      lane_id,
      last_event_comment_id: count === 0 ? null : lastId,
      last_event_created_at: count === 0 ? null : lastCreatedAt,
      event_count: count,
    },
  };
}

/**
 * Assemble the frontier from already-captured lane comment streams and the
 * quiescence evidence THIS CAPTURE PROVED (never a caller-supplied document).
 * PURE. Returns the buildDurableFrontier result, or { ok: false, errors }.
 */
export function frontierFromCapture({
  repository,
  frozen_main_sha,
  captured_at,
  quiescence_checked_at,
  write_capable_workflows,
  active_write_runs,
  lanes,
}) {
  if (!Array.isArray(lanes)) return { ok: false, errors: ["lanes: not an array"] };
  const entries = [];
  const errors = [];
  for (const lane of lanes) {
    const built = laneFrontierEntry(lane);
    if (!built.ok) errors.push(`issue #${lane?.issue_number}: ${built.reason}`);
    else entries.push(built.entry);
  }
  if (errors.length > 0) return { ok: false, errors };
  return buildDurableFrontier({
    repository,
    frozen_main_sha,
    captured_at,
    quiescence_checked_at,
    write_capable_workflows,
    active_write_runs,
    lanes: entries,
  });
}

// Read-only GET. The quiescence proof's paths are constructed by
// write-authority.mjs from validated components; the lane paths are built from an
// issue number the evidence parser already validated. This tool expresses no
// host and no method.
function ghGet(path, { paginate = false } = {}) {
  const argv = paginate ? ["api", "--paginate", path] : ["api", path];
  try {
    return { ok: true, text: execFileSync("gh", argv, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }) };
  } catch (e) {
    return { ok: false, detail: String(e?.message ?? e) };
  }
}

// Raw `gh api` stdout, handed to the evidence parsers UNPARSED: they own
// page-stream splitting, exact-URL binding, and duplicate detection.
function ghText(path, { paginate = true } = {}) {
  const got = ghGet(path, { paginate });
  if (!got.ok) die(`GET ${path} failed: ${got.detail}`);
  return got.text;
}

function enumerateIssues(repo, query, label) {
  const parsed = parseIssuePages(ghText(`repos/${repo}/issues?${query}`), { repository: repo });
  if (!parsed.ok) die(`${label} enumeration unusable: ${parsed.reason} (${parsed.detail ?? ""})`);
  return parsed.issues;
}

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

// The live proof, run by this tool against GitHub. `label` names which of the two
// passes a refusal came from.
function prove(repo, frozenMainSha, label) {
  const proof = proveFrozenQuiescence({
    repository: repo,
    frozen_main_sha: frozenMainSha,
    read: ghGet,
    now,
    note: (message) => process.stderr.write(`${label}: ${message}\n`),
  });
  if (!proof.ok) {
    die(
      `${label} refused: ${proof.reason} — ${proof.detail}\n` +
        "  the capture proves quiescence itself; it cannot be satisfied by a document that asserts it",
    );
  }
  process.stderr.write(
    `${label}: quiescent at ${proof.value.checked_at} (main ${frozenMainSha} frozen, ` +
      `${proof.scans.first}/${proof.scans.second} run(s) all terminal)\n`,
  );
  return proof;
}

function main() {
  const repo = arg("--repo", "0xHoneyJar/loa-straylight");
  const outPath = arg("--out");

  // THE FROZEN REVISION, named explicitly (H-02). Never resolved here: a tool
  // that picked its own revision would capture against whatever main happened to
  // be, which is exactly the ambiguity the binding exists to remove.
  const frozenMainSha = arg("--frozen-main-sha");
  if (frozenMainSha === null) {
    die("--frozen-main-sha <40-hex> is required — name the frozen revision this capture describes");
  }
  if (!MAIN_SHA_RE.test(frozenMainSha)) {
    die("--frozen-main-sha must be a full 40-hex commit SHA (never a branch name)");
  }

  // The OPTIONAL operator receipt. Validated, compared, reported — never trusted.
  // It cannot license this capture; it can only contradict it.
  const quiescencePath = arg("--quiescence");
  let receipt = null;
  if (quiescencePath !== null) {
    let quiescenceText;
    try {
      quiescenceText = readFileSync(quiescencePath, "utf8");
    } catch (e) {
      die(`--quiescence unreadable: ${String(e?.message ?? e)}`);
    }
    const parsed = parseStrict(quiescenceText);
    if (!parsed.ok) die(`--quiescence: strict JSON parse failed: ${parsed.reason}`);
    const validated = validateFrozenQuiescence(parsed.value);
    if (!validated.ok) die(`--quiescence refused by its own validator: ${JSON.stringify(validated.errors, null, 2)}`);
    receipt = validated.value;
  }

  // PROOF 1, before any lane read: default branch, main IS the frozen revision,
  // the policy committed there is accepted and frozen, the write-capable set from
  // that commit's workflow bytes, two duplicate-free run scans, nothing in
  // flight, main still frozen.
  const first = prove(repo, frozenMainSha, "quiescence proof 1 (pre-capture)");

  // The receipt is checked against what was just PROVED. Agreement adds no
  // authority; disagreement means the operator holds evidence about a different
  // state of the world, and that must not pass silently.
  if (receipt !== null) {
    const agrees = receiptAgreesWithProof(receipt, first.value, {
      repository: repo,
      frozen_main_sha: frozenMainSha,
    });
    if (!agrees.ok) die(`${agrees.reason}: ${agrees.detail}`);
    process.stderr.write(
      `--quiescence receipt (checked ${receipt.checked_at}) agrees with the fresh proof; it contributes no field ` +
        "to the frontier\n",
    );
  }

  // Dual enumeration, unioned by issue number. A number appearing in both must
  // present the same body: two different bodies for one issue is ambiguity about
  // what the lane genesis says, and ambiguity is refused.
  const plain = enumerateIssues(repo, "state=all&per_page=100", "plain");
  const labelled = enumerateIssues(repo, "state=all&per_page=100&labels=cp-lane", "cp-lane label");
  const union = new Map();
  for (const [source, issues] of [
    ["plain", plain],
    ["cp-lane", labelled],
  ]) {
    for (const issue of issues) {
      const prior = union.get(issue.number);
      if (prior === undefined) {
        union.set(issue.number, issue);
        continue;
      }
      if (prior.body !== issue.body) {
        die(`issue #${issue.number}: the ${source} enumeration returned a different body than the first; refusing`);
      }
    }
  }

  const scan = scanLanes([...union.values()]);
  if (!scan.ok) die(`lane scan unusable: ${scan.reason}`);
  if (scan.unreadable.length > 0) {
    die(
      `lane genesis unreadable, so lane discovery cannot be proven complete: ` +
        `${JSON.stringify(scan.unreadable)}`,
    );
  }
  if (scan.duplicates.length > 0) {
    die(`duplicate lane_id across issues: ${JSON.stringify(scan.duplicates)}`);
  }
  if (scan.lanes.length === 0) die("no cp-lane discovered; refusing to emit a frontier that bounds nothing");

  process.stderr.write(
    `discovered ${scan.lanes.length} lane(s) from ${plain.length} plain + ${labelled.length} cp-lane-labelled ` +
      `issue entries (${union.size} unioned)\n`,
  );

  const lanes = scan.lanes.map((lane) => {
    const parsed = parseCommentPages(ghText(`repos/${repo}/issues/${lane.number}/comments?per_page=100`), {
      repository: repo,
      issue_number: lane.number,
    });
    if (!parsed.ok) die(`issue #${lane.number} comments unusable: ${parsed.reason} (${parsed.detail ?? ""})`);
    return { issue_number: lane.number, lane_id: lane.lane_id, comments: parsed.comments };
  });

  // PROOF 2, after every lane read. It RE-ESTABLISHES the whole thing rather than
  // re-checking one field: the freeze could have been reverted, main could have
  // moved, a reducer run could have been triggered by a comment posted during the
  // reads. Its first act is to require that main is still the frozen revision, so
  // a merge landing between the enumeration and the last lane read — which would
  // mean the reads spanned two repository states — refuses here.
  const second = prove(repo, frozenMainSha, "quiescence proof 2 (post-capture)");

  // Two honest derivations from one commit's workflow bytes must agree, and the
  // second proof cannot predate the first.
  const a = first.value.write_capable_workflows;
  const b = second.value.write_capable_workflows;
  if (a.length !== b.length || a.some((path, i) => path !== b[i])) {
    die(
      `the write-capable set derived at ${frozenMainSha} changed during the capture ([${a.join(", ")}] then ` +
        `[${b.join(", ")}]) — the two proofs did not read the same tree; recapture`,
    );
  }
  if (parseIsoInstant(second.value.checked_at) < parseIsoInstant(first.value.checked_at)) {
    die(
      `the post-capture proof is stamped ${second.value.checked_at}, before the pre-capture proof at ` +
        `${first.value.checked_at} — the clock moved backwards; recapture`,
    );
  }

  // The capture instant is recorded AFTER every read completes, so it never
  // claims to cover a moment the reads had not yet reached. The frontier carries
  // the SECOND proof's evidence: what was still true once the last lane comment
  // had been read.
  const captured_at = now();
  const built = frontierFromCapture({
    repository: repo,
    frozen_main_sha: frozenMainSha,
    captured_at,
    quiescence_checked_at: second.value.checked_at,
    write_capable_workflows: second.value.write_capable_workflows,
    active_write_runs: second.value.active_write_runs,
    lanes,
  });
  if (!built.ok) die(`frontier refused by its own validator: ${JSON.stringify(built.errors, null, 2)}`);

  const text = JSON.stringify(built.frontier, null, 2) + "\n";
  if (outPath === null) {
    process.stdout.write(text);
  } else {
    writeFileSync(outPath, text);
    process.stdout.write(`wrote ${outPath}\n`);
  }
  process.stderr.write(
    `frontier: ${built.value.event_count} protocol event(s) across ${built.value.lane_count} lane(s); ` +
      `latest authenticated event ${built.value.max_event_created_at} (captured ${captured_at} against frozen ` +
      `main ${frozenMainSha}, quiescence proved here at ${second.value.checked_at})\n`,
  );
}

// Run ONLY as a CLI. Tests import the pure core; importing must not fetch.
function invokedDirectly() {
  if (typeof process.argv[1] !== "string") return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) main();
