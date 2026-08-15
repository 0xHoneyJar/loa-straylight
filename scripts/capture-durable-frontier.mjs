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
// is the committed state AND frozen-write quiescence has been verified at that
// exact revision (scripts/verify-frozen-quiescence.mjs). The transition guard
// enforces the freeze ordering; capturing while automation can still write, or
// while a run authored under `enabled: true` is still in flight, would produce
// evidence that is stale the moment it is written.
//
// BOUND TO THE FROZEN REVISION (Codex H-02). --frozen-main-sha and --quiescence
// are REQUIRED. The frozen SHA is named explicitly — never resolved here — and
// must equal both the quiescence evidence's frozen_main_sha and the live main ref
// before AND after the lane reads. So a frontier can no longer be captured while
// main is moving, and the document itself records which revision it describes
// rather than leaving that in a procedure someone remembers to follow. The
// quiescence document is re-validated here (its own validator refuses one that
// records any write-capable run still in flight), and the four evidence fields
// travel into the frontier for the transition guard to check again.
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
// WHAT IT STILL CANNOT PROVE. That GitHub returned everything, and that nobody
// writes a lane comment after the capture. `operator:eileen` is the control-plane
// authority and must not write lane events during a cutover; if one is posted
// anyway, this evidence is stale — recapture, and move the candidate boundary if
// necessary.
//
// Usage:
//   node scripts/capture-durable-frontier.mjs \
//     --frozen-main-sha <40-hex> --quiescence <file> \
//     [--repo 0xHoneyJar/loa-straylight] [--out <path>]
//
// Writes deterministic JSON (lanes sorted by issue number) to stdout, or to
// --out. Read-only: GET only. Nothing is posted, edited, labelled, or merged.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MARKERS, extractPayload } from "../.straylight/lib/markers.mjs";
import { parseIssuePages, parseCommentPages, parseSingleDocument } from "../.straylight/lib/evidence.mjs";
import { scanLanes } from "../.straylight/lib/lane-target.mjs";
import { buildDurableFrontier } from "../.straylight/lib/durable-frontier.mjs";
import { validateFrozenQuiescence } from "../.straylight/lib/frozen-quiescence.mjs";
import { parseStrict } from "../.straylight/lib/strict-json.mjs";
import { MAIN_SHA_RE, mainRefReadPath, readMainRefSha } from "../.straylight/lib/write-authority.mjs";
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
 * quiescence evidence the capture ran under.
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

// Raw `gh api` stdout, handed to the evidence parsers UNPARSED: they own
// page-stream splitting, exact-URL binding, and duplicate detection. Single
// documents (the main ref) are fetched WITHOUT --paginate so the parser sees one
// document rather than a one-page stream.
function ghText(path, { paginate = true } = {}) {
  const argv = paginate ? ["api", "--paginate", path] : ["api", path];
  try {
    return execFileSync("gh", argv, {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (e) {
    die(`GET ${path} failed: ${String(e?.message ?? e)}`);
  }
}

function enumerateIssues(repo, query, label) {
  const parsed = parseIssuePages(ghText(`repos/${repo}/issues?${query}`), { repository: repo });
  if (!parsed.ok) die(`${label} enumeration unusable: ${parsed.reason} (${parsed.detail ?? ""})`);
  return parsed.issues;
}

// The exact commit main points at right now, via the read paths the protocol
// constructs for itself (write-authority.mjs). Read-only.
function currentMainSha(repo) {
  const parsed = parseSingleDocument(ghText(mainRefPath(repo), { paginate: false }));
  if (!parsed.ok) die(`main ref unreadable: ${parsed.reason} (${parsed.detail ?? ""})`);
  const read = readMainRefSha(parsed.value);
  if (!read.ok) die(`main ref unreadable: ${read.reason} — ${read.detail}`);
  return read.sha;
}

function mainRefPath(repo) {
  const built = mainRefReadPath(repo);
  if (!built.ok) die(`${built.reason}: ${built.detail}`);
  return built.path;
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

  // The quiescence evidence that licenses this capture. Re-validated here rather
  // than trusted: its own validator refuses a document recording any
  // write-capable run still in flight.
  const quiescencePath = arg("--quiescence");
  if (quiescencePath === null) {
    die(
      "--quiescence <file> is required — the output of scripts/verify-frozen-quiescence.mjs, proving no " +
        "write-capable run was in flight at the frozen revision",
    );
  }
  let quiescenceText;
  try {
    quiescenceText = readFileSync(quiescencePath, "utf8");
  } catch (e) {
    die(`--quiescence unreadable: ${String(e?.message ?? e)}`);
  }
  const quiescenceParsed = parseStrict(quiescenceText);
  if (!quiescenceParsed.ok) die(`--quiescence: strict JSON parse failed: ${quiescenceParsed.reason}`);
  const quiescence = validateFrozenQuiescence(quiescenceParsed.value);
  if (!quiescence.ok) die(`--quiescence refused by its own validator: ${JSON.stringify(quiescence.errors, null, 2)}`);
  if (quiescence.value.repository !== repo) {
    die(`--quiescence describes ${quiescence.value.repository}, not ${repo}`);
  }
  if (quiescence.value.frozen_main_sha !== frozenMainSha) {
    die(
      `--quiescence was gathered at main ${quiescence.value.frozen_main_sha} but --frozen-main-sha is ` +
        `${frozenMainSha}; the evidence describes a different revision`,
    );
  }

  // Main must BE the frozen revision before the lane reads begin...
  const mainBefore = currentMainSha(repo);
  if (mainBefore !== frozenMainSha) {
    die(
      `current main is ${mainBefore}, not the frozen ${frozenMainSha} — the freeze this capture claims to run ` +
        "under is not the committed state; re-verify quiescence at the current revision and recapture",
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

  // ...and must STILL be the frozen revision after them. A merge landing between
  // the enumeration and the last lane read would mean the reads spanned two
  // different repository states, one of which may not have been frozen at all.
  const mainAfter = currentMainSha(repo);
  if (mainAfter !== frozenMainSha) {
    die(
      `main moved from ${frozenMainSha} to ${mainAfter} during the capture — the lane reads span two repository ` +
        "states; re-verify quiescence at the new revision and recapture",
    );
  }

  // The capture instant is recorded AFTER every read completes, so it never
  // claims to cover a moment the reads had not yet reached.
  const captured_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const built = frontierFromCapture({
    repository: repo,
    frozen_main_sha: frozenMainSha,
    captured_at,
    quiescence_checked_at: quiescence.value.checked_at,
    write_capable_workflows: quiescence.value.write_capable_workflows,
    active_write_runs: quiescence.value.active_write_runs,
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
      `main ${frozenMainSha}, quiescent at ${quiescence.value.checked_at})\n`,
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
