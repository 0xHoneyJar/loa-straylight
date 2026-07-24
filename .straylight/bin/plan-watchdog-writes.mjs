#!/usr/bin/env node
// Straylight Control Plane v1 — final dual-collection watchdog planner.
//
//   node plan-watchdog-writes.mjs \
//     --collection-a <dirA> --collection-b <dirB> \
//     --ledger-a <fileA> --ledger-b <fileB> \
//     --request-root <dir> --repository <owner/repo> \
//     --nonce <run-id>-<attempt> --now <iso> [--policy <file>]
//
// Trusts NOTHING derived earlier: both collections are independently
// re-verified from raw bytes (ledger reparse, digest re-verification,
// evidence.mjs reparse, fresh reconstruction, slot re-derivation vs
// manifest claims), canonically projected, and compared — any
// planning-relevant difference exits 2 with its specific ab-* refusal
// code. Only a provably stable world plans writes, keyed by issue
// number, deduped by exact full-line identity, with at most one
// state-advancing event per issue per plan.
//
// Exit 0 = plan.json + body files written under --request-root.
// Exit 3 = valid empty sweep (nothing to post).
// Exit 2 = refusal (fail closed; zero writes; nothing written).
//
// This planner performs NO network I/O and NO GitHub writes; files are
// byte containers reached through ledger paths with realpath containment
// and verified by digest, never identity authority.

import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseStrict } from "../lib/strict-json.mjs";
import { planWatchdogWrites } from "../lib/watchdog-plan.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function fail(reason, detail) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...(detail ? { detail } : {}) }) + "\n");
  process.exit(2);
}

const dirA = arg("--collection-a");
const dirB = arg("--collection-b");
const ledgerA = arg("--ledger-a");
const ledgerB = arg("--ledger-b");
const requestRoot = arg("--request-root");
const repository = arg("--repository");
const nonce = arg("--nonce");
const now = arg("--now");
for (const [name, v] of [["--collection-a", dirA], ["--collection-b", dirB], ["--ledger-a", ledgerA], ["--ledger-b", ledgerB], ["--request-root", requestRoot], ["--repository", repository], ["--nonce", nonce], ["--now", now]]) {
  if (v === null) fail("usage", `${name} is required`);
}

function containedReader(dir) {
  let realDir;
  try {
    realDir = realpathSync(resolve(dir));
  } catch (e) {
    fail("collection-dir-invalid", String(e?.message ?? e));
  }
  return (relPath) => {
    const full = join(realDir, relPath);
    let real;
    try {
      real = realpathSync(full);
    } catch {
      return null;
    }
    if (real !== realDir && !real.startsWith(realDir + "/")) {
      fail("resource-outside-collection", relPath);
    }
    try {
      return readFileSync(real);
    } catch {
      return null;
    }
  };
}

function loadPolicy() {
  const policyPath = arg("--policy") ?? resolve(here, "..", "automation-policy.json");
  let text;
  try {
    text = readFileSync(policyPath, "utf8");
  } catch (e) {
    fail("policy-unreadable", String(e?.message ?? e));
  }
  const parsed = parseStrict(text);
  if (!parsed.ok) fail("policy-unreadable", `strict JSON parse failed: ${parsed.reason}`);
  return parsed.value;
}

function readText(path, label) {
  try {
    return readFileSync(resolve(path), "utf8");
  } catch (e) {
    fail(`${label}-unreadable`, String(e?.message ?? e));
  }
}

const readA = containedReader(dirA);
const readB = containedReader(dirB);
const manifestA = readA("manifest.json");
const manifestB = readB("manifest.json");
if (manifestA === null) fail("manifest-unreadable", "collection A");
if (manifestB === null) fail("manifest-unreadable", "collection B");

const result = planWatchdogWrites({
  collections: {
    A: { ledgerText: readText(ledgerA, "ledger-a"), manifestText: manifestA.toString("utf8"), readFile: readA },
    B: { ledgerText: readText(ledgerB, "ledger-b"), manifestText: manifestB.toString("utf8"), readFile: readB },
  },
  nonce,
  repository,
  policy: loadPolicy(),
  now,
});
if (!result.ok) fail(result.reason, result.detail);

if (result.empty) {
  process.stdout.write(JSON.stringify({ ok: true, empty: true, projection_digest: result.projection_digest }) + "\n");
  process.exit(3);
}

let realRoot;
try {
  realRoot = realpathSync(resolve(requestRoot));
} catch (e) {
  fail("request-root-invalid", String(e?.message ?? e));
}
for (const body of result.bodies) {
  writeFileSync(join(realRoot, body.name), body.content);
}
writeFileSync(join(realRoot, "plan.json"), JSON.stringify(result.plan, null, 2) + "\n");
process.stdout.write(JSON.stringify({
  ok: true,
  empty: false,
  operations: result.plan.operations.length,
  projection_digest: result.projection_digest,
}) + "\n");
process.exit(0);
