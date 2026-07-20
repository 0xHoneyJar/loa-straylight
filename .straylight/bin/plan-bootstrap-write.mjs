#!/usr/bin/env node
// Straylight Control Plane v1 — bootstrap planner (Phase 49P lane).
//
//   node plan-bootstrap-write.mjs \
//     --pages <issue-pages> --labels <label-pages> \
//     --base-sha <40-hex> --request-root <dir> \
//     --repository <owner/repo> --nonce <run-id>-<attempt> [--policy <file>]
//
// Plans AT MOST ONE lane creation (plus the cp-lane label definition if
// missing). The precondition is the universal lane-ABSENCE proof
// (lane-target.mjs assertLaneAbsent) over the complete enumeration:
//
//   exit 0 — absence proven; plan.json + body files written
//   exit 3 — the lane exists exactly once (valid no-op; nothing written)
//   exit 2 — ANY ambiguity: duplicate lane IDs anywhere, unreadable
//            marker-bearing bodies, malformed pages, malformed label
//            evidence, invalid base SHA (fail closed; nothing written)
//
// The genesis lane record embedded in the plan body must satisfy the
// SAME validator the reducer uses — a genesis this planner authors is
// re-validated by write-plan.mjs (embedded-genesis check) and again by
// every future reconstruction. No network I/O; no GitHub writes.

import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { parseIssuePages, parseLabelPages } from "../lib/evidence.mjs";
import { assertLaneAbsent } from "../lib/lane-target.mjs";
import { validateLane } from "../lib/validate.mjs";
import { renderPayload, MARKERS } from "../lib/markers.mjs";
import { WRITE_PLAN_SCHEMA } from "../lib/write-plan.mjs";

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

const pagesPath = arg("--pages");
const labelsPath = arg("--labels");
const baseSha = arg("--base-sha");
const requestRoot = arg("--request-root");
const repository = arg("--repository");
const nonce = arg("--nonce");
for (const [name, v] of [["--pages", pagesPath], ["--labels", labelsPath], ["--base-sha", baseSha], ["--request-root", requestRoot], ["--repository", repository], ["--nonce", nonce]]) {
  if (v === null) fail("usage", `${name} is required`);
}
if (!SHA_RE.test(baseSha)) fail("base-sha-invalid", "base SHA must be 40 lowercase hex");

// Enumeration through the shared evidence parser: strict parse, N1
// uniqueness, N2 binding, PR exclusion, zero-byte-invalid — fail closed.
let pagesText;
try {
  pagesText = readFileSync(resolve(pagesPath), "utf8");
} catch (e) {
  fail("pages-unreadable", String(e?.message ?? e));
}
const enumerated = parseIssuePages(pagesText, { repository });
if (!enumerated.ok) fail(enumerated.reason, enumerated.detail);

// The universal lane-ABSENCE proof: duplicates anywhere or unreadable
// marker-bearing bodies refuse; an existing unique lane is a valid no-op.
const absence = assertLaneAbsent(enumerated.issues, LANE_ID);
if (!absence.ok) fail(absence.reason, absence.detail);
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
  operations,
};
writeFileSync(join(realRoot, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: true, exists: false, operations: operations.length, label_planned: !cpLaneLabelExists }) + "\n");
process.exit(0);
