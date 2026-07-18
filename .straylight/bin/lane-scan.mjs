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
// --pages consumes the RAW output of
//   gh api --paginate "repos/<repo>/issues?state=...&per_page=100"
// i.e. one JSON array per page, concatenated. Flattening, page
// well-formedness, and pull-request exclusion all happen HERE and FAIL
// CLOSED: a malformed page, a non-array page, junk between pages, a
// non-object entry, or an entry without a positive integer `number`
// exits 2 — an enumeration/flattening problem must never read as
// "no lanes". --input (or stdin) accepts a pre-flattened
// [{ number, body }, ...] array (the legacy contract).
//
// DISCOVERY IS LABEL-INDEPENDENT: lane issues are identified ONLY through
// the canonical protocol parser (markers.mjs → strict-json.mjs). The
// cp-lane label is a derived convenience projection, NEVER discovery
// authority (ADR-050 §1.1: labels are reduced state) — a missing or
// removed label must not hide a lane from the watchdog and must not
// permit bootstrap to create a duplicate. Substring matching over the
// raw body is exactly what the parser path replaced: it was whitespace-
// sensitive, so a compact-but-valid genesis payload
// ({"lane_id":"lane-phase-49p"}) would have been missed. Anything the
// reducer would parse as a lane genesis is found here, byte-formatting
// notwithstanding.
//
// The GitHub issues listing includes pull requests. Anything carrying a
// `pull_request` key is excluded (reported under `excluded_prs`) so a PR
// body embedding a lane-like payload can never masquerade as a lane issue.
//
// FAIL CLOSED on ambiguity: an issue whose body carries the lane marker
// but whose payload cannot be parsed (or parses without a string lane_id)
// is reported under `unreadable`, NOT silently skipped — bootstrap must
// refuse while any lane-marker body is unprovable (an unreadable genesis
// could BE the existing lane in mangled form), and the watchdog must
// surface it as an explicit malformed-lane finding.
//
// Output (single JSON object on stdout):
//   --lane-id:   { ok, lane_id, matches: [n...], unreadable: [{number, reason}], excluded_prs: [n...] }
//   --all-lanes: { ok, lanes: [{number, lane_id}...], unreadable: [{number, reason}], excluded_prs: [n...] }
// Exit 0 = scan completed; exit 2 = unusable input (fail closed).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MARKERS, extractPayload, hasMarker } from "../lib/markers.mjs";

// Canonical lane-id contract (lane-v1.schema.json `lane_id` pattern). A
// marker-bearing body whose lane_id does NOT satisfy it is UNREADABLE, not
// a clean miss: "lane-phase-49p " (trailing space) must refuse bootstrap
// rather than read as "some other lane", and a crafted lane_id carrying
// tab/newline must never reach a caller's line-oriented issue mapping.
const LANE_ID_RE = /^lane-[a-z0-9][a-z0-9-]{1,62}$/;

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

// Split the concatenated top-level JSON documents `gh api --paginate`
// emits (one array per page). Tracks string/escape state so brackets
// inside strings never confuse a document boundary; anything at top level
// other than whitespace between documents is junk (fail closed). Returns
// null on ANY imbalance or parse failure — the caller must treat that as
// an enumeration failure, never as an empty page set.
function parseConcatenatedJson(text) {
  const docs = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      if (depth === 0) return null; // bare top-level string is junk
      inString = true;
      continue;
    }
    if (c === "[" || c === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (c === "]" || c === "}") {
      depth -= 1;
      if (depth < 0) return null;
      if (depth === 0) {
        docs.push(text.slice(start, i + 1));
        start = -1;
      }
      continue;
    }
    if (depth === 0 && !/\s/.test(c)) return null; // junk between documents
  }
  if (depth !== 0 || inString) return null;
  try {
    return docs.map((d) => JSON.parse(d));
  } catch {
    return null;
  }
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
const excludedPrs = [];
if (pagesPath !== null) {
  let text;
  try {
    text = readFileSync(resolve(pagesPath), "utf8");
  } catch (e) {
    fail("pages unreadable: " + String(e?.message ?? e));
  }
  const pages = parseConcatenatedJson(text);
  if (pages === null || pages.length === 0) {
    fail("pages malformed: expected one well-formed JSON array per gh --paginate page");
  }
  issues = [];
  for (const page of pages) {
    if (!Array.isArray(page)) {
      fail("pages malformed: a page is not an array");
    }
    for (const item of page) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        fail("pages malformed: an issue entry is not an object");
      }
      if (!Number.isInteger(item.number) || item.number < 1) {
        fail("pages malformed: an issue entry lacks a positive integer number");
      }
      if (Object.prototype.hasOwnProperty.call(item, "pull_request")) {
        excludedPrs.push(item.number); // PRs are never lane issues
        continue;
      }
      if (item.body !== undefined && item.body !== null && typeof item.body !== "string") {
        fail(`pages malformed: issue #${item.number} body is neither string nor null`);
      }
      issues.push({ number: item.number, body: typeof item.body === "string" ? item.body : "" });
    }
  }
} else {
  try {
    issues = JSON.parse(inputPath !== null ? readFileSync(resolve(inputPath), "utf8") : readFileSync(0, "utf8"));
  } catch (e) {
    fail("input unreadable: " + String(e?.message ?? e));
  }
  if (!Array.isArray(issues)) {
    fail("input is not an array of issues");
  }
  // Even pre-flattened input must never treat a pull request as a lane
  // issue: entries carrying a pull_request key are excluded here too.
  issues = issues.filter((item) => {
    if (item !== null && typeof item === "object" && !Array.isArray(item) &&
        Object.prototype.hasOwnProperty.call(item, "pull_request")) {
      if (Number.isInteger(item.number)) excludedPrs.push(item.number);
      return false;
    }
    return true;
  });
}

const matches = [];
const lanes = [];
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
  if (!LANE_ID_RE.test(parsed.value.lane_id)) {
    unreadable.push({ number, reason: "lane-id-malformed" });
    continue;
  }
  if (allLanes) {
    lanes.push({ number, lane_id: parsed.value.lane_id });
  } else if (parsed.value.lane_id === laneId) {
    matches.push(number);
  }
}

const result = allLanes
  ? { ok: true, lanes, unreadable, excluded_prs: excludedPrs }
  : { ok: true, lane_id: laneId, matches, unreadable, excluded_prs: excludedPrs };
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(0);
