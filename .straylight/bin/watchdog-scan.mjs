#!/usr/bin/env node
// Straylight Control Plane v1 — watchdog CLI (thin adapter, no network).
//
// Usage:
//   node .straylight/bin/watchdog-scan.mjs --input <file.json> [--policy <policy.json>]
//
// input.json = { lanes: [<reduced lane>...], context: { now?, pr_heads?, last_activity? } }
//
// Prints { ok, actions } — each action carries a deterministic dedupe_key;
// the calling workflow must skip any action whose dedupe_key already
// appears in the lane's comment stream (idempotency).

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scan } from "../lib/watchdog.mjs";

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
  process.stdout.write(JSON.stringify({ ok: false, refusal: "input-unreadable", detail: String(e?.message ?? e), actions: [] }) + "\n");
  process.exit(2);
}
try {
  const policyPath = arg("--policy") ?? resolve(here, "..", "automation-policy.json");
  policy = JSON.parse(readFileSync(policyPath, "utf8"));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, refusal: "policy-unreadable", detail: String(e?.message ?? e), actions: [] }) + "\n");
  process.exit(2);
}

const result = scan(input.lanes ?? [], policy, { now: new Date().toISOString(), ...(input.context ?? {}) });
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.ok ? 0 : 2);
