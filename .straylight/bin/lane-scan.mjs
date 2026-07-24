#!/usr/bin/env node
// Straylight Control Plane v1 — canonical lane enumeration + genesis scan
// (shared adapter: dependency-free, no network).
//
// Usage:
//   node .straylight/bin/lane-scan.mjs --pages <pages.json> --lane-id <id>
//   node .straylight/bin/lane-scan.mjs --pages <pages.json> --all-lanes
//   node .straylight/bin/lane-scan.mjs --input <issues.json> --lane-id <id>
//   cat issues.json | node .straylight/bin/lane-scan.mjs --lane-id <id>
//
// THIN ADAPTER over the two shared authorities:
//   evidence.mjs    — parses the RAW `gh api --paginate` page stream
//                     (--pages): flattening, page well-formedness, strict
//                     duplicate-key-rejecting JSON, N1 issue-number
//                     uniqueness, and pull-request exclusion all happen
//                     there and FAIL CLOSED — a malformed page, junk
//                     between pages, a duplicated issue number, or a
//                     zero-byte stream exits 2, never "no lanes".
//   lane-target.mjs — the universal lane-target authority: lane issues are
//                     identified ONLY through the canonical protocol parser
//                     (markers.mjs → strict-json.mjs). The cp-lane label is
//                     a derived convenience projection, NEVER discovery
//                     authority (ADR-050 §1.1); substring matching over raw
//                     bodies was retired for whitespace sensitivity.
//
// --input (or stdin) accepts a pre-flattened [{ number, body }, ...] array
// (the legacy contract); entries carrying a pull_request key are excluded
// there too, and are reported under `excluded_prs` in both modes — a PR
// body embedding a lane-like payload can never masquerade as a lane issue.
//
// FAIL CLOSED on ambiguity: an issue whose body carries the lane marker
// but whose payload cannot be parsed (or parses without a canonical
// lane_id) is reported under `unreadable`, NOT silently skipped — an
// unreadable genesis could BE the existing lane in mangled form; bootstrap
// must refuse while any lane-marker body is unprovable, and the watchdog
// must surface it as an explicit malformed-lane finding.
//
// Output (single JSON object on stdout):
//   --lane-id:   { ok, lane_id, matches: [n...], duplicates, unreadable: [{number, reason}], excluded_prs: [n...] }
//   --all-lanes: { ok, lanes: [{number, lane_id}...], duplicates, unreadable: [{number, reason}], excluded_prs: [n...] }
// `duplicates` lists every lane_id claimed by MORE THAN ONE issue
// ([{ lane_id, numbers }...]) — the C1 ambiguity every writer must refuse.
// Exit 0 = scan completed; exit 2 = unusable input (fail closed).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseStrict } from "../lib/strict-json.mjs";
import { parseIssuePages } from "../lib/evidence.mjs";
import { scanLanes } from "../lib/lane-target.mjs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function flag(name) {
  return process.argv.includes(name);
}

function fail(reason) {
  process.stdout.write(JSON.stringify({ ok: false, reason }) + "\n");
  process.exit(2);
}

const laneId = arg("--lane-id");
const allLanes = flag("--all-lanes");
if (allLanes && laneId !== null) {
  fail("choose exactly one of --lane-id or --all-lanes");
}
if (!allLanes && (typeof laneId !== "string" || laneId.length === 0)) {
  fail("missing --lane-id (or pass --all-lanes)");
}

const pagesPath = arg("--pages");
const inputPath = arg("--input");
if (pagesPath !== null && inputPath !== null) {
  fail("choose exactly one of --pages or --input");
}

let issues;
let excludedPrs;
if (pagesPath !== null) {
  let text;
  try {
    text = readFileSync(resolve(pagesPath), "utf8");
  } catch (e) {
    fail("pages unreadable: " + String(e?.message ?? e));
  }
  // The shared evidence parser owns the raw page stream: strict parsing,
  // page shape, duplicate issue numbers, PR exclusion — all fail closed.
  const parsed = parseIssuePages(text);
  if (!parsed.ok) {
    fail(`pages malformed: ${parsed.reason}${parsed.detail ? ` (${parsed.detail})` : ""}`);
  }
  issues = parsed.issues;
  excludedPrs = parsed.excluded_prs;
} else {
  let raw;
  try {
    raw = inputPath !== null ? readFileSync(resolve(inputPath), "utf8") : readFileSync(0, "utf8");
  } catch (e) {
    fail("input unreadable: " + String(e?.message ?? e));
  }
  const parsed = parseStrict(raw);
  if (!parsed.ok) {
    fail("input unreadable: strict JSON parse failed: " + parsed.reason);
  }
  if (!Array.isArray(parsed.value)) {
    fail("input is not an array of issues");
  }
  // Even pre-flattened input must never treat a pull request as a lane
  // issue: entries carrying a pull_request key are excluded here too.
  excludedPrs = [];
  issues = parsed.value.filter((item) => {
    if (item !== null && typeof item === "object" && !Array.isArray(item) &&
        Object.prototype.hasOwnProperty.call(item, "pull_request")) {
      if (Number.isInteger(item.number)) excludedPrs.push(item.number);
      return false;
    }
    return true;
  });
}

// The universal lane-target authority owns genesis identification: the
// canonical marker parser, the canonical lane-id pattern, unreadable
// surfacing, and duplicate detection.
const scanned = scanLanes(issues);
if (!scanned.ok) {
  fail(`scan failed: ${scanned.reason}`);
}

const result = allLanes
  ? {
      ok: true,
      lanes: scanned.lanes,
      duplicates: scanned.duplicates,
      unreadable: scanned.unreadable,
      excluded_prs: excludedPrs,
    }
  : {
      ok: true,
      lane_id: laneId,
      matches: scanned.lanes.filter((l) => l.lane_id === laneId).map((l) => l.number),
      duplicates: scanned.duplicates,
      unreadable: scanned.unreadable,
      excluded_prs: excludedPrs,
    };
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(0);
