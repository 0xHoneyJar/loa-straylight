#!/usr/bin/env node
// Straylight Control Plane v1 — staged watchdog collection driver.
//
// Owns every DERIVATION transition of the per-collection state machine
// (rev. 3 §1.1); bash owns every FETCH transition. Run once per stage per
// collection:
//
//   node collect-watchdog-evidence.mjs --stage issue-slots \
//     --collection-dir <dir> --collection-id A|B --nonce <id>-<attempt> \
//     --repository <owner/repo>
//       → writes <dir>/issue-slots.json (strict schema: NO PR field —
//         enumeration-only input structurally cannot emit PR slots)
//
//   node collect-watchdog-evidence.mjs --stage pr-slots \
//     --collection-dir <dir> --ledger <file> --collection-id … --nonce … \
//     --repository … [--policy <file>] --now <iso>
//       → reparses the RAW enumeration + every raw issue/comment file via
//         evidence.mjs, reconstructs every lane SOLELY to derive which PR
//         numbers planning requires, writes <dir>/pr-slots.json
//
//   node collect-watchdog-evidence.mjs --stage seal \
//     --collection-dir <dir> --ledger <file> --collection-id … --nonce … \
//     --repository … [--policy <file>] --now <iso>
//       → re-derives issue AND PR slots from raw bytes again, verifies
//         every ledger claim against its file's actual digest and against
//         its own derivation, writes <dir>/manifest.json. Exit 2 if the
//         ledger/stage documents claim anything the raw evidence does not
//         independently derive.
//
// Files are byte containers only: every path this driver reads is either
// a fixed stage-document name inside the collection directory or a
// ledger-claimed relative path resolved with realpath containment under
// the collection directory (a path escaping it exits 2). Identity comes
// from ledger digest verification, never from names.
//
// Exit 0 = stage completed and its document written. Exit 2 = refusal
// (fail closed; nothing written). This driver performs NO network I/O
// and NO GitHub writes.

import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseStrict } from "../lib/strict-json.mjs";
import {
  deriveIssueSlots,
  derivePrSlots,
  sealCollection,
  validateIssueSlotsDocument,
  parseLedger,
  COLLECTION_IDS,
} from "../lib/collection.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function fail(reason, detail) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...(detail ? { detail } : {}) }) + "\n");
  process.exit(2);
}

const stage = arg("--stage");
const collectionDir = arg("--collection-dir");
const collectionId = arg("--collection-id");
const nonce = arg("--nonce");
const repository = arg("--repository");

if (!["issue-slots", "pr-slots", "seal"].includes(stage ?? "")) {
  fail("usage", "--stage must be issue-slots | pr-slots | seal");
}
if (collectionDir === null) fail("usage", "--collection-dir is required");
if (!COLLECTION_IDS.includes(collectionId ?? "")) fail("usage", "--collection-id must be A or B");
if (nonce === null) fail("usage", "--nonce is required");
if (repository === null) fail("usage", "--repository is required");

let realDir;
try {
  realDir = realpathSync(resolve(collectionDir));
} catch (e) {
  fail("collection-dir-invalid", String(e?.message ?? e));
}

// Contained read: ledger-claimed relative paths resolve under the
// collection directory ONLY. Returns bytes or null (missing file).
function readContained(relPath) {
  const full = join(realDir, relPath);
  let real;
  try {
    real = realpathSync(full);
  } catch {
    return null;
  }
  if (real !== realDir && !real.startsWith(realDir + "/")) {
    // Escaping the collection directory is a refusal, not a missing file.
    fail("resource-outside-collection", relPath);
  }
  try {
    return readFileSync(real);
  } catch {
    return null;
  }
}

function readRequired(relPath, label) {
  const bytes = readContained(relPath);
  if (bytes === null) fail(`${label}-unreadable`, relPath);
  return bytes;
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

function requireNow() {
  const now = arg("--now");
  if (now === null) fail("usage", "--now <iso-instant> is required for this stage");
  return now;
}

const identity = { collection_id: collectionId, nonce, repository };

if (stage === "issue-slots") {
  // S1→S2: strict parse of the raw enumeration ONLY. The output schema
  // has no PR field — nothing else is even read.
  const enumerationBytes = readRequired("enumeration.pages", "enumeration");
  const derived = deriveIssueSlots(enumerationBytes, identity);
  if (!derived.ok) fail(derived.reason, derived.detail);
  writeFileSync(join(realDir, "issue-slots.json"), JSON.stringify(derived.document, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ ok: true, stage, issue_slots: derived.document.issue_slots }) + "\n");
  process.exit(0);
}

if (stage === "pr-slots") {
  // S3→S4: PR slots are derivable ONLY after the complete issue/comment
  // evidence for THIS collection exists on disk. The ledger names the raw
  // files; a slot without its evidence is a refusal (missing-issue-evidence).
  const ledgerPath = arg("--ledger");
  if (ledgerPath === null) fail("usage", "--ledger is required for pr-slots");
  const ledgerText = readFileSync(resolve(ledgerPath), "utf8");
  const policy = loadPolicy();
  const now = requireNow();

  // Sanity: the persisted issue-slots document must exist, validate, and
  // bind to this enumeration — the stage chain is explicit, not implied.
  const enumerationBytes = readRequired("enumeration.pages", "enumeration");
  const issueSlotsParsed = parseStrict(readRequired("issue-slots.json", "issue-slots").toString("utf8"));
  if (!issueSlotsParsed.ok) fail("stage-document-malformed", issueSlotsParsed.reason);
  const docCheck = validateIssueSlotsDocument(issueSlotsParsed.value);
  if (!docCheck.ok) fail(docCheck.reason, docCheck.detail);

  // Assemble per-issue evidence from the LEDGER (durable fetch facts).
  const ledger = parseLedger(ledgerText, { collection_id: collectionId, nonce });
  if (!ledger.ok) fail(ledger.reason, ledger.detail);
  const issueEvidence = new Map();
  for (const row of ledger.rows) {
    if (row.resource === "issue") {
      const entry = issueEvidence.get(row.issue_number) ?? {};
      entry.issueBytes = readRequired(row.path, "issue-evidence");
      issueEvidence.set(row.issue_number, entry);
    } else if (row.resource === "comments") {
      const entry = issueEvidence.get(row.issue_number) ?? {};
      entry.commentBytes = readRequired(row.path, "comment-evidence");
      issueEvidence.set(row.issue_number, entry);
    }
  }
  const derived = derivePrSlots(enumerationBytes, issueEvidence, { ...identity, policy, now });
  if (!derived.ok) fail(derived.reason, derived.detail);
  writeFileSync(join(realDir, "pr-slots.json"), JSON.stringify(derived.document, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ ok: true, stage, pr_slots: derived.document.pr_slots }) + "\n");
  process.exit(0);
}

// stage === "seal" — S5→S6.
const ledgerPath = arg("--ledger");
if (ledgerPath === null) fail("usage", "--ledger is required for seal");
const ledgerText = readFileSync(resolve(ledgerPath), "utf8");
const policy = loadPolicy();
const now = requireNow();

const issueSlotsParsed = parseStrict(readRequired("issue-slots.json", "issue-slots").toString("utf8"));
if (!issueSlotsParsed.ok) fail("stage-document-malformed", issueSlotsParsed.reason);
const prSlotsParsed = parseStrict(readRequired("pr-slots.json", "pr-slots").toString("utf8"));
if (!prSlotsParsed.ok) fail("stage-document-malformed", prSlotsParsed.reason);

const sealed = sealCollection({
  ledgerText,
  readFile: readContained,
  collection_id: collectionId,
  nonce,
  repository,
  policy,
  now,
  issueSlotsDocument: issueSlotsParsed.value,
  prSlotsDocument: prSlotsParsed.value,
});
if (!sealed.ok) fail(sealed.reason, sealed.detail);
writeFileSync(join(realDir, "manifest.json"), JSON.stringify(sealed.manifest, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: true, stage, manifest: { issue_slots: sealed.manifest.issue_slots, pr_slots: sealed.manifest.pr_slots } }) + "\n");
process.exit(0);
