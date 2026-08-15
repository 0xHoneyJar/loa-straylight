#!/usr/bin/env node
// Straylight Control Plane v1 — bootstrap planner (Phase 49P lane).
//
//   node plan-bootstrap-write.mjs \
//     --pages-1 <issue-pages> --pages-2 <issue-pages> \
//     --labels <label-pages> \
//     --base-sha <40-hex> --request-root <dir> \
//     --source-main-sha-file <file> \
//     --repository <owner/repo> --nonce <run-id>-<attempt> [--policy <file>]
//
// Plans AT MOST ONE lane creation (plus the cp-lane label definition if
// missing). TWO-READ STABLE ENUMERATION (J1): --pages-1 and --pages-2 are
// two COMPLETE, independently fetched enumerations; their canonical
// lane→issue mappings (lanes, duplicates, unreadable markers) must be
// EQUAL, else exit 2 — creation must never proceed on an enumeration the
// world moved under. The precondition is then the universal lane-ABSENCE
// proof (lane-target.mjs assertLaneAbsent) over BOTH stable reads:
//
//   exit 0 — absence proven in both reads; plan.json + body files written
//   exit 3 — the lane exists exactly once in both reads (valid no-op;
//            nothing written)
//   exit 2 — ANY ambiguity: an enumeration difference between reads,
//            duplicate lane IDs anywhere, unreadable marker-bearing
//            bodies, malformed pages, malformed label evidence, invalid
//            base SHA (fail closed; nothing written)
//
// The genesis lane record embedded in the plan body must satisfy the
// SAME validator the reducer uses — a genesis this planner authors is
// re-validated by write-plan.mjs (embedded-genesis check) and again by
// every future reconstruction.
//
// WRITE-AUTHORITY BINDING (H-02): the plan carries `authority:
// {source_main_sha, policy_digest}`. --source-main-sha[-file] names the commit
// this planning ran at; the digest is of the accepted committed policy loaded
// here. Both are re-established from GitHub by the executor before the lane is
// created, so a creation planned under `enabled: true` cannot happen after a
// freeze is merged. No network I/O; no GitHub writes.

import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseIssuePages, parseLabelPages } from "../lib/evidence.mjs";
import { assertLaneAbsent, scanLanes } from "../lib/lane-target.mjs";
import { validateLane } from "../lib/validate.mjs";
import { loadProtocolPolicy } from "../lib/policy-source.mjs";
import { buildWriteAuthority, resolveSourceMainSha } from "../lib/write-authority.mjs";
import { renderPayload, MARKERS } from "../lib/markers.mjs";
import { WRITE_PLAN_SCHEMA } from "../lib/write-plan.mjs";
import { payloadDigest } from "../lib/canonical.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const LANE_ID = "lane-phase-49p";
const SHA_RE = /^[0-9a-f]{40}$/;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function fail(reason, detail) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...(detail ? { detail } : {}) }) + "\n");
  process.exit(2);
}

const pages1Path = arg("--pages-1");
const pages2Path = arg("--pages-2");
const labelsPath = arg("--labels");
const requestRoot = arg("--request-root");
const repository = arg("--repository");
const nonce = arg("--nonce");
for (const [name, v] of [["--pages-1", pages1Path], ["--pages-2", pages2Path], ["--labels", labelsPath], ["--request-root", requestRoot], ["--repository", repository], ["--nonce", nonce]]) {
  if (v === null) fail("usage", `${name} is required`);
}
// The base SHA arrives either literally (--base-sha, tests) or as a file
// the workflow materialized from origin/main (--base-sha-file) — the
// planner reads and validates it itself so bash never substitutes
// derived content into an argument (J3).
let baseSha = arg("--base-sha");
const baseShaFile = arg("--base-sha-file");
if (baseSha === null && baseShaFile === null) fail("usage", "--base-sha or --base-sha-file is required");
if (baseSha !== null && baseShaFile !== null) fail("usage", "--base-sha and --base-sha-file are mutually exclusive");
if (baseShaFile !== null) {
  try {
    baseSha = readFileSync(resolve(baseShaFile), "utf8").trim();
  } catch (e) {
    fail("base-sha-unreadable", String(e?.message ?? e));
  }
}
if (!SHA_RE.test(baseSha)) fail("base-sha-invalid", "base SHA must be 40 lowercase hex");

// The commit THIS PLANNING ran at (H-02) — deliberately a separate argument
// from --base-sha. The base SHA is lane content (the revision the lane's work
// branches from, which the operator may pin); the source main SHA is the
// revision whose committed policy authorized this plan. Conflating them would
// let a lane's chosen base silently stand in for present write authority.
const resolvedSourceSha = resolveSourceMainSha({
  literal: arg("--source-main-sha"),
  filePath: arg("--source-main-sha-file"),
});
if (!resolvedSourceSha.ok) fail(resolvedSourceSha.reason, resolvedSourceSha.detail);

// The bootstrap planner reads the policy for ONE reason: to digest the exact
// accepted policy that authorized this plan. It consumes no admission field —
// the genesis lane's corridor is lane content, pinned by its own test. The
// accepted-epoch digest lock applies because this is the committed file.
const loadedPolicy = loadProtocolPolicy({
  committedPath: resolve(here, "..", "automation-policy.json"),
  overridePath: arg("--policy"),
});
if (!loadedPolicy.ok) fail(loadedPolicy.refusal, loadedPolicy.detail);
const authorityBuilt = buildWriteAuthority({
  source_main_sha: resolvedSourceSha.sha,
  policy: loadedPolicy.value,
});
if (!authorityBuilt.ok) fail(authorityBuilt.reason, authorityBuilt.detail);

// BOTH enumerations through the shared evidence parser: strict parse, N1
// uniqueness, N2 binding, PR exclusion, zero-byte-invalid — fail closed.
function parseEnumeration(path, label) {
  let text;
  try {
    text = readFileSync(resolve(path), "utf8");
  } catch (e) {
    fail("pages-unreadable", `${label}: ${String(e?.message ?? e)}`);
  }
  const enumerated = parseIssuePages(text, { repository });
  if (!enumerated.ok) fail(enumerated.reason, `${label}: ${enumerated.detail ?? ""}`);
  return enumerated;
}
const enum1 = parseEnumeration(pages1Path, "read 1");
const enum2 = parseEnumeration(pages2Path, "read 2");

// TWO-READ STABLE ENUMERATION (J1): the canonical lane identity of both
// independent reads must be EQUAL — the lane→issue mapping, the
// duplicate set, AND the unreadable set. A lane appearing, vanishing,
// moving, duplicating, or turning unreadable between reads means the
// world moved mid-enumeration; creating against either read is unsafe.
function identityProjection(enumerated, label) {
  const scanned = scanLanes(enumerated.issues);
  if (!scanned.ok) fail("lane-scan-failed", `${label}: ${scanned.reason}`);
  return {
    lane_mapping: scanned.lanes.map((l) => ({ issue_number: l.number, lane_id: l.lane_id })),
    lane_duplicates: scanned.duplicates,
    lane_unreadable: scanned.unreadable.map((u) => u.number).sort((a, b) => a - b),
  };
}
if (payloadDigest(identityProjection(enum1, "read 1")) !== payloadDigest(identityProjection(enum2, "read 2"))) {
  fail("two-read-instability", "canonical lane identity differs between the two enumerations; retry");
}

// The universal lane-ABSENCE proof, IN BOTH STABLE READS: duplicates
// anywhere or unreadable marker-bearing bodies refuse; an existing
// unique lane is a valid no-op. Creation proceeds ONLY when the lane is
// absent in read 1 AND read 2.
let absence = null;
for (const [label, enumerated] of [["read 1", enum1], ["read 2", enum2]]) {
  const a = assertLaneAbsent(enumerated.issues, LANE_ID);
  if (!a.ok) fail(a.reason, `${label}: ${a.detail ?? ""}`);
  absence = a;
}
if (absence.absent === false) {
  process.stdout.write(JSON.stringify({ ok: true, exists: true, numbers: absence.numbers }) + "\n");
  process.exit(3);
}

// Label evidence: the cp-lane definition is created only when provably
// missing; malformed label evidence refuses (never "no labels").
let labelsText;
try {
  labelsText = readFileSync(resolve(labelsPath), "utf8");
} catch (e) {
  fail("labels-unreadable", String(e?.message ?? e));
}
const labels = parseLabelPages(labelsText, { repository });
if (!labels.ok) fail(labels.reason, labels.detail);
const cpLaneLabelExists = labels.labels.includes("cp-lane");

// The genesis lane record — must satisfy the reducer's own validator.
const lane = {
  schema: "straylight.lane.v1",
  lane_id: LANE_ID,
  phase: "phase-49p",
  authorized_corridor: ["phase-49p", "phase-49q", "phase-50a", "phase-50b"],
  repository,
  base_branch: "main",
  base_sha: baseSha,
  tier: "tier-1",
  authority_bearing: false,
  state: "planning",
  next_actor: "coordinator",
  working_branch: null,
  pr_number: null,
  pr_head_sha: null,
  audited_sha: null,
  verdict: null,
  attempt: 0,
  patch_cycle: 0,
  mode: "shadow",
  auto_merge_allowed: false,
  operator_pause: false,
  operator_required_reason: null,
  lease: null,
  event_sequence: 0,
  last_transition: null,
};
const lv = validateLane(lane);
if (!lv.ok) fail("genesis-invalid", lv.errors.join("; "));

const issueBody = [
  "# Control-plane lane: Phase 49P — sibling evidence intake (shadow)",
  "",
  `Coordinated under [ADR-050](https://github.com/${repository}/blob/main/docs/decisions/ADR-050-autonomous-execution-control-plane.md).`,
  `Protocol: [.straylight/README.md](https://github.com/${repository}/blob/main/.straylight/README.md).`,
  "",
  "This issue is the durable lane record. The genesis lane payload is below;",
  "all subsequent protocol actions are append-only event comments. Labels are",
  "derived state. **Shadow mode: nothing merges automatically.**",
  "",
  "This lane COORDINATES Phase 49P (ADR-049 §10 step 3 — PR A, sibling",
  "evidence intake). Creating this issue does not implement Phase 49P,",
  "does not open its PR, and does not advance any ADR-022E gate.",
  "",
  renderPayload(MARKERS.lane, lane),
].join("\n");

const sha256 = (text) => "sha256:" + createHash("sha256").update(text, "utf8").digest("hex");

const operations = [];
const bodies = [];
let opCounter = 0;
if (!cpLaneLabelExists) {
  opCounter += 1;
  const content = JSON.stringify({
    name: "cp-lane",
    color: "1d76db",
    description: "Straylight control-plane lane (ADR-050)",
  });
  bodies.push({ name: `op-${opCounter}.json`, content });
  operations.push({
    op_id: `op-${opCounter}`,
    kind: "create-label-definition",
    body_file: `op-${opCounter}.json`,
    body_sha256: sha256(content),
  });
}
opCounter += 1;
const laneContent = JSON.stringify({
  title: "CP lane: Phase 49P — sibling evidence intake (shadow)",
  body: issueBody,
  labels: ["cp-lane"],
});
bodies.push({ name: `op-${opCounter}.json`, content: laneContent });
operations.push({
  op_id: `op-${opCounter}`,
  kind: "create-lane-issue",
  lane_id: LANE_ID,
  body_file: `op-${opCounter}.json`,
  body_sha256: sha256(laneContent),
});

let realRoot;
try {
  realRoot = realpathSync(resolve(requestRoot));
} catch (e) {
  fail("request-root-invalid", String(e?.message ?? e));
}
for (const body of bodies) {
  writeFileSync(join(realRoot, body.name), body.content);
}
const plan = {
  schema: WRITE_PLAN_SCHEMA,
  plan_id: `${nonce}-bootstrap`,
  nonce,
  repository,
  authority: authorityBuilt.authority,
  operations,
};
writeFileSync(join(realRoot, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: true, exists: false, operations: operations.length, label_planned: !cpLaneLabelExists }) + "\n");
process.exit(0);
