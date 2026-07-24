#!/usr/bin/env node
// Straylight Control Plane v1 — protocol self-validation (no network).
//
// Ran by `npm run control-plane:validate`. Verifies, fail-closed:
//   1. automation-policy.json parses and satisfies validatePolicy
//      (shadow mode, auto_merge=false, corridor present, allowlist present);
//   2. every schema file under .straylight/schemas/ is well-formed JSON with
//      the expected $id / title / const invariants;
//   3. the state machine is closed (every event target and NEXT_ACTOR key is
//      a known state; terminal states have no outgoing non-wildcard events);
//   4. marker round-trip (renderPayload → extractPayload) is the identity.
//
// Exit 0 = all checks pass. Exit 1 = any failure (printed to stderr).

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePolicy } from "../lib/validate.mjs";
import { STATES, EVENT_TYPES, NEXT_ACTOR, TERMINAL_STATES } from "../lib/state-machine.mjs";
import { MARKERS, renderPayload, extractPayload } from "../lib/markers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const failures = [];

// 1. Policy.
try {
  const policy = JSON.parse(readFileSync(join(root, "automation-policy.json"), "utf8"));
  const pv = validatePolicy(policy);
  if (!pv.ok) failures.push(...pv.errors.map((e) => `policy: ${e}`));
  if (policy.mode !== "shadow") failures.push("policy: mode must be shadow in v1");
  if (policy.auto_merge !== false) failures.push("policy: auto_merge must be false in v1");
} catch (e) {
  failures.push(`policy: unreadable (${e?.message ?? e})`);
}

// 2. Schemas.
const expectedSchemas = {
  "lane-v1.schema.json": "straylight.lane.v1",
  "event-v1.schema.json": "straylight.event.v1",
  "task-packet-v1.schema.json": "straylight.task-packet.v1",
  "audit-v1.schema.json": "straylight.audit.v1",
};
let schemaFiles = [];
try {
  schemaFiles = readdirSync(join(root, "schemas")).filter((f) => f.endsWith(".json"));
} catch (e) {
  failures.push(`schemas: directory unreadable (${e?.message ?? e})`);
}
for (const [file, constName] of Object.entries(expectedSchemas)) {
  if (!schemaFiles.includes(file)) {
    failures.push(`schemas: missing ${file}`);
    continue;
  }
  try {
    const schema = JSON.parse(readFileSync(join(root, "schemas", file), "utf8"));
    if (schema?.properties?.schema?.const !== constName) {
      failures.push(`schemas/${file}: properties.schema.const must be ${constName}`);
    }
    if (typeof schema.$id !== "string" || !schema.$id.includes(file)) {
      failures.push(`schemas/${file}: $id must reference the file name`);
    }
  } catch (e) {
    failures.push(`schemas/${file}: unreadable (${e?.message ?? e})`);
  }
}
// v1 hard invariants encoded in the published contract itself.
try {
  const laneSchema = JSON.parse(readFileSync(join(root, "schemas", "lane-v1.schema.json"), "utf8"));
  if (laneSchema.properties.mode.const !== "shadow") failures.push("lane schema: mode const must be shadow");
  if (laneSchema.properties.auto_merge_allowed.const !== false) failures.push("lane schema: auto_merge_allowed const must be false");
  const auditSchema = JSON.parse(readFileSync(join(root, "schemas", "audit-v1.schema.json"), "utf8"));
  if (auditSchema.properties.audit_committed_in_pr.const !== false) failures.push("audit schema: audit_committed_in_pr const must be false");
  const packetSchema = JSON.parse(readFileSync(join(root, "schemas", "task-packet-v1.schema.json"), "utf8"));
  if (packetSchema.properties.merge_forbidden.const !== true) failures.push("task-packet schema: merge_forbidden const must be true");
} catch { /* already reported above */ }

// 3. State machine closure.
for (const [type, spec] of Object.entries(EVENT_TYPES)) {
  if (spec.from !== "*") {
    for (const s of spec.from) {
      if (!STATES.includes(s)) failures.push(`state-machine: ${type} from unknown state ${s}`);
    }
    for (const s of spec.from) {
      if (TERMINAL_STATES.includes(s)) failures.push(`state-machine: ${type} escapes terminal state ${s}`);
    }
  }
  if (spec.to !== null && !STATES.includes(spec.to)) {
    failures.push(`state-machine: ${type} targets unknown state ${spec.to}`);
  }
}
for (const s of STATES) {
  if (!(s in NEXT_ACTOR)) failures.push(`state-machine: no next actor for ${s}`);
}

// 4. Marker round-trip.
const sample = { schema: "straylight.event.v1", probe: "round-trip" };
const rendered = renderPayload(MARKERS.event, sample);
const back = extractPayload(rendered, MARKERS.event);
if (!back.ok || JSON.stringify(back.value) !== JSON.stringify(sample)) {
  failures.push("markers: render/extract round-trip failed");
}
const doubled = extractPayload(rendered + "\n" + rendered, MARKERS.event);
if (doubled.ok || doubled.reason !== "ambiguous-multiple-payloads") {
  failures.push("markers: duplicate payloads must be rejected as ambiguous");
}

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`\ncontrol-plane:validate — ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("control-plane:validate — all checks passed (policy, schemas, state machine, markers)");
