#!/usr/bin/env node
// Straylight Control Plane v1 — shadow merge-guard CLI (thin adapter).
//
// Usage:
//   node .straylight/bin/merge-guard-check.mjs --input <file.json> [--policy <policy.json>]
//
// input.json = { lane: <reduced lane>, context: { pr_metadata?, checks? } }
// pr_metadata = the COMPLETE normalized live PR record (validatePrMetadata
//   shape): { fetch_ok, repository, pr_number, state, draft, merged,
//   base_branch, base_sha, head_branch, head_sha } — the pure module fails
//   closed unless every field corresponds exactly with the lane and the
//   audited target; loose single-field context is never accepted.
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
import { loadProtocolPolicy } from "../lib/policy-source.mjs";

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
// Strict parse + validation, with the accepted-epoch digest lock applied
// because the default path IS the protocol's committed policy.
{
  const loaded = loadProtocolPolicy({
    committedPath: resolve(here, "..", "automation-policy.json"),
    overridePath: arg("--policy"),
  });
  if (!loaded.ok) {
    process.stdout.write(JSON.stringify({ shadow: true, eligible: false, action: "report-only", reasons: [`policy ${loaded.refusal}: ${loaded.detail}`] }) + "\n");
    process.exit(2);
  }
  policy = loaded.value;
}

const result = evaluate(input.lane ?? null, policy, input.context ?? {});
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(0);
