#!/usr/bin/env node
// Straylight Control Plane v1 — reducer CLI (thin adapter).
//
// Usage:
//   node .straylight/bin/reduce-issue.mjs --input <file.json> [--policy <policy.json>]
//   cat input.json | node .straylight/bin/reduce-issue.mjs
//
// input.json = { issue_body, comments: [{id, user, body}], context? }
//
// Reads the durable GitHub content (fetched by the caller — this program
// performs NO network calls), reconstructs the lane, and prints a single
// JSON result to stdout:
//   { ok, lane, dispositions, labels, refusal?, detail? }
//
// Exit codes: 0 = reconstruction ran (even if events were refused),
//             2 = input/policy unreadable or genesis invalid (fail closed).

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { reconstructLane } from "../lib/reconstruct.mjs";

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

let input, policy;
try {
  input = JSON.parse(readInput());
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, refusal: "input-unreadable", detail: String(e?.message ?? e) }) + "\n");
  process.exit(2);
}
try {
  const policyPath = arg("--policy") ?? resolve(here, "..", "automation-policy.json");
  policy = JSON.parse(readFileSync(policyPath, "utf8"));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, refusal: "policy-unreadable", detail: String(e?.message ?? e) }) + "\n");
  process.exit(2);
}

const result = reconstructLane({
  issue_body: input.issue_body,
  comments: input.comments,
  policy,
  context: { now: new Date().toISOString(), ...(input.context ?? {}) },
});
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.ok ? 0 : 2);
