#!/usr/bin/env node
// Straylight Control Plane v1 — lane genesis scan (thin adapter, no network).
//
// Usage:
//   node .straylight/bin/lane-scan.mjs --input <issues.json> --lane-id <lane-id>
//
// issues.json = [{ number, body }, ...]  (every cp-lane issue, ALL pages,
// open AND closed — fetched by the caller; this program performs no
// network I/O).
//
// Decides, through the CANONICAL protocol parser (markers.mjs →
// strict-json.mjs), which issues carry a genesis lane record whose
// lane_id equals --lane-id. Substring matching over the raw body is
// exactly what this replaces: it was whitespace-sensitive (compact valid
// JSON like {"lane_id":"lane-phase-49p"} carries no ": " separator and
// was missed → duplicate lane). The parser is the same code path the
// reducer trusts, so anything the reducer would treat as a lane genesis
// is found here, byte-formatting notwithstanding.
//
// FAIL CLOSED on ambiguity: an issue whose body carries the lane marker
// but whose payload cannot be parsed (or parses without a string lane_id)
// is reported under `unreadable`, NOT silently skipped — the caller must
// refuse to bootstrap while any lane-marker body is unprovable, because
// an unreadable genesis could BE the existing lane in mangled form.
//
// Output: { ok, lane_id, matches: [issue numbers], unreadable: [{number,
// reason}] } on stdout. Exit 0 = scan completed; exit 2 = unusable input.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MARKERS, extractPayload, hasMarker } from "../lib/markers.mjs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

const laneId = arg("--lane-id");
if (typeof laneId !== "string" || laneId.length === 0) {
  process.stdout.write(JSON.stringify({ ok: false, reason: "missing --lane-id" }) + "\n");
  process.exit(2);
}

let issues;
try {
  const path = arg("--input");
  issues = JSON.parse(path ? readFileSync(resolve(path), "utf8") : readFileSync(0, "utf8"));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, reason: "input unreadable: " + String(e?.message ?? e) }) + "\n");
  process.exit(2);
}
if (!Array.isArray(issues)) {
  process.stdout.write(JSON.stringify({ ok: false, reason: "input is not an array of issues" }) + "\n");
  process.exit(2);
}

const matches = [];
const unreadable = [];
for (const issue of issues) {
  const number = Number.isInteger(issue?.number) ? issue.number : null;
  const body = typeof issue?.body === "string" ? issue.body : "";
  if (!hasMarker(body, MARKERS.lane)) continue; // not a lane record at all
  const parsed = extractPayload(body, MARKERS.lane);
  if (!parsed.ok) {
    unreadable.push({ number, reason: parsed.reason });
    continue;
  }
  if (typeof parsed.value.lane_id !== "string") {
    unreadable.push({ number, reason: "lane-id-missing" });
    continue;
  }
  if (parsed.value.lane_id === laneId) matches.push(number);
}

process.stdout.write(JSON.stringify({ ok: true, lane_id: laneId, matches, unreadable }, null, 2) + "\n");
process.exit(0);
