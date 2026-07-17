#!/usr/bin/env node
// Straylight Control Plane v1 — shadow merge-guard CLI (thin adapter).
//
// Usage:
//   node .straylight/bin/merge-guard-check.mjs --input <file.json> [--policy <policy.json>]
//
// input.json = { lane: <reduced lane>, context: { pr_head_sha?, pr_state?,
//   pr_draft?, pr_merged?, pr_base_ref?, checks? } }
// checks = { check_runs_total, check_run_conclusions[] (ALL pages),
//   commit_statuses_total, commit_status_state } — raw evidence only; the
// pure module fails closed on anything missing, partial, or unknown.
//
// Prints the shadow eligibility verdict. THIS PROGRAM CANNOT MERGE:
// it performs no network calls and its output is a report object whose
// only defined consumer effect is a shadow-mode PR/issue comment.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate } from "../lib/merge-guard.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

let input, policy;
try {
  const path = arg("--input");
  input = JSON.parse(path ? readFileSync(resolve(path), "utf8") : readFileSync(0, "utf8"));
} catch (e) {
  process.stdout.write(JSON.stringify({ shadow: true, eligible: false, action: "report-only", reasons: ["input unreadable: " + String(e?.message ?? e)] }) + "\n");
  process.exit(2);
}
try {
  const policyPath = arg("--policy") ?? resolve(here, "..", "automation-policy.json");
  policy = JSON.parse(readFileSync(policyPath, "utf8"));
} catch (e) {
  process.stdout.write(JSON.stringify({ shadow: true, eligible: false, action: "report-only", reasons: ["policy unreadable: " + String(e?.message ?? e)] }) + "\n");
  process.exit(2);
}

const result = evaluate(input.lane ?? null, policy, input.context ?? {});
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(0);
