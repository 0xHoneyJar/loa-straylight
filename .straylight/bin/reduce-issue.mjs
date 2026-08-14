#!/usr/bin/env node
// Straylight Control Plane v1 — reducer CLI (thin adapter).
//
// Usage:
//   node .straylight/bin/reduce-issue.mjs --input <file.json> [--policy <policy.json>]
//   cat input.json | node .straylight/bin/reduce-issue.mjs
//
// input.json = { issue_body, comments: [{id, user, body, created_at, updated_at}] }
//
// Reads the durable GitHub content (fetched by the caller — this program
// performs NO network calls), reconstructs the lane, and prints a single
// JSON result to stdout:
//   { ok, lane, dispositions, labels, refusal?, detail? }
//
// This adapter supplies NO clock. Each event is admitted at its authenticated
// comment.created_at; a comment without one is refused, never re-timed from the
// run's wall clock. An `input.context` is neither read nor forwarded.
//
// Exit codes: 0 = reconstruction ran (even if events were refused),
//             2 = input/policy unreadable, policy invalid, or genesis invalid
//                 (fail closed).

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { reconstructLane } from "../lib/reconstruct.mjs";
import { loadProtocolPolicy } from "../lib/policy-source.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function readInput() {
  const path = arg("--input");
  if (path) return readFileSync(resolve(path), "utf8");
  return readFileSync(0, "utf8");
}

let input;
try {
  input = JSON.parse(readInput());
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, refusal: "input-unreadable", detail: String(e?.message ?? e) }) + "\n");
  process.exit(2);
}
// Strict parse + validation, with the accepted-epoch digest lock applied
// because the default path IS the protocol's committed policy.
const loaded = loadProtocolPolicy({
  committedPath: resolve(here, "..", "automation-policy.json"),
  overridePath: arg("--policy"),
});
if (!loaded.ok) {
  process.stdout.write(JSON.stringify({ ok: false, refusal: loaded.refusal, detail: loaded.detail }) + "\n");
  process.exit(2);
}

// No wall clock is passed, and none is available to pass: every event's
// admission time is the authenticated comment.created_at that reconstruction
// reads from the durable record itself.
const result = reconstructLane({
  issue_body: input.issue_body,
  comments: input.comments,
  policy: loaded.value,
});
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.ok ? 0 : 2);
