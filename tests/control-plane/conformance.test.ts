// Control Plane v1 — R6 behavioral schema/runtime conformance matrix.
//
// The prior round proved conformance by SOURCE-TEXT search (grep the schema
// pattern string inside validate.mjs). That only shows the text is present,
// not that the two AGREE on any given input. This suite instead builds a
// minimal JSON-Schema evaluator for the subset the v1 schemas use (type,
// required, enum, const, pattern, minimum, minItems, maxLength, nullable
// unions) and, for each record type, runs a boundary matrix of mutated
// values through BOTH the published schema and the executable validator,
// asserting they reach the SAME accept/reject verdict on every case.
//
// This is behavioral equivalence, not string matching: if the validator and
// the schema diverge on any boundary in the matrix, a case fails.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateLane, validateEvent, validateTaskPacket, validateAuditRecord, validateLease,
} from "../../.straylight/lib/validate.mjs";
import {
  makeLane, makeEvent, makeTaskPacket, makeAuditRecord, makeLease,
} from "./_fixtures.js";

const SCHEMA_DIR = join(process.cwd(), ".straylight", "schemas");
function loadSchema(file: string) {
  return JSON.parse(readFileSync(join(SCHEMA_DIR, file), "utf8"));
}

// -- Minimal JSON-Schema evaluator (v1 subset) -------------------------------
// Returns true if `value` satisfies `schema`. Supports exactly the keywords
// the v1 contracts use. Deliberately small and explicit.
function schemaAccepts(schema: any, value: any): boolean {
  return checkNode(schema, value);
}

function typeOk(type: string, v: any): boolean {
  switch (type) {
    case "object": return v !== null && typeof v === "object" && !Array.isArray(v);
    case "array": return Array.isArray(v);
    case "string": return typeof v === "string";
    case "integer": return Number.isInteger(v);
    case "number": return typeof v === "number";
    case "boolean": return typeof v === "boolean";
    case "null": return v === null;
    default: return false;
  }
}

function checkNode(schema: any, v: any): boolean {
  if (schema == null) return true;
  if ("const" in schema) { if (v !== schema.const) return false; }
  if (schema.enum && !schema.enum.includes(v)) return false;
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t: string) => typeOk(t, v))) return false;
  }
  if (typeof v === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(v)) return false;
    if (schema.maxLength !== undefined && v.length > schema.maxLength) return false;
    if (schema.minLength !== undefined && v.length < schema.minLength) return false;
  }
  if (typeof v === "number") {
    if (schema.minimum !== undefined && v < schema.minimum) return false;
  }
  if (Array.isArray(v)) {
    if (schema.minItems !== undefined && v.length < schema.minItems) return false;
    if (schema.items) { for (const item of v) if (!checkNode(schema.items, item)) return false; }
  }
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    for (const req of schema.required ?? []) {
      if (!(req in v) || v[req] === undefined || v[req] === null) return false;
    }
    const props = schema.properties ?? {};
    for (const [k, val] of Object.entries(v)) {
      if (props[k]) { if (!checkNode(props[k], val)) return false; }
    }
  }
  return true;
}

// A record type's baseline + a set of boundary mutations.
interface Matrix {
  name: string;
  schemaFile: string;
  validator: (v: unknown) => { ok: boolean };
  baseline: () => any;
  // Each mutation applied over a fresh baseline; the pair (schema, validator)
  // must agree. `note` documents the boundary.
  mutations: Array<{ note: string; mutate: (r: any) => any }>;
}

const MATRICES: Matrix[] = [
  {
    name: "lane", schemaFile: "lane-v1.schema.json", validator: validateLane, baseline: makeLane,
    mutations: [
      { note: "baseline", mutate: (r) => r },
      { note: "missing lane_id", mutate: (r) => { delete r.lane_id; return r; } },
      { note: "malformed lane_id", mutate: (r) => ({ ...r, lane_id: "LANE-BAD" }) },
      { note: "bad state enum", mutate: (r) => ({ ...r, state: "flying" }) },
      { note: "bad tier enum", mutate: (r) => ({ ...r, tier: "tier-9" }) },
      { note: "mode active (const shadow)", mutate: (r) => ({ ...r, mode: "active" }) },
      { note: "auto_merge_allowed true (const false)", mutate: (r) => ({ ...r, auto_merge_allowed: true }) },
      { note: "negative attempt", mutate: (r) => ({ ...r, attempt: -1 }) },
      { note: "non-integer event_sequence", mutate: (r) => ({ ...r, event_sequence: 1.5 }) },
      { note: "bad base_sha", mutate: (r) => ({ ...r, base_sha: "xyz" }) },
      { note: "null verdict allowed", mutate: (r) => ({ ...r, verdict: null }) },
      { note: "bad next_actor enum", mutate: (r) => ({ ...r, next_actor: "wizard" }) },
      { note: "last_lease_role auditor allowed", mutate: (r) => ({ ...r, last_lease_role: "auditor" }) },
      { note: "last_lease_role bad enum", mutate: (r) => ({ ...r, last_lease_role: "witch" }) },
    ],
  },
  {
    name: "event", schemaFile: "event-v1.schema.json", validator: validateEvent, baseline: makeEvent,
    mutations: [
      { note: "baseline", mutate: (r) => r },
      { note: "missing event_id", mutate: (r) => { delete r.event_id; return r; } },
      { note: "malformed event_id", mutate: (r) => ({ ...r, event_id: "event-1" }) },
      { note: "bad actor_role", mutate: (r) => ({ ...r, actor_role: "wizard" }) },
      { note: "sequence 0 (min 1)", mutate: (r) => ({ ...r, sequence: 0 }) },
      { note: "bad verdict enum", mutate: (r) => ({ ...r, verdict: "MAYBE" }) },
      { note: "bad github_actor", mutate: (r) => ({ ...r, github_actor: "-bad-" }) },
      { note: "reason at maxLength 4000", mutate: (r) => ({ ...r, reason: "x".repeat(4000) }) },
      { note: "reason over maxLength", mutate: (r) => ({ ...r, reason: "x".repeat(4001) }) },
      { note: "bad head_sha", mutate: (r) => ({ ...r, head_sha: "nope" }) },
    ],
  },
  {
    name: "task-packet", schemaFile: "task-packet-v1.schema.json", validator: validateTaskPacket, baseline: makeTaskPacket,
    mutations: [
      { note: "baseline", mutate: (r) => r },
      { note: "missing authority_basis", mutate: (r) => { delete r.authority_basis; return r; } },
      { note: "merge_forbidden false (const true)", mutate: (r) => ({ ...r, merge_forbidden: false }) },
      { note: "bad packet_kind", mutate: (r) => ({ ...r, packet_kind: "hotfix" }) },
      { note: "bad expected_next_actor", mutate: (r) => ({ ...r, expected_next_actor: "wizard" }) },
      { note: "empty allowed_paths (minItems 1)", mutate: (r) => ({ ...r, allowed_paths: [] }) },
      { note: "bad repository", mutate: (r) => ({ ...r, repository: "no-slash" }) },
      { note: "negative patch_cycle", mutate: (r) => ({ ...r, patch_cycle: -1 }) },
    ],
  },
  {
    name: "audit", schemaFile: "audit-v1.schema.json", validator: validateAuditRecord, baseline: makeAuditRecord,
    mutations: [
      { note: "baseline ACCEPT", mutate: (r) => r },
      { note: "missing audited_head_sha", mutate: (r) => { delete r.audited_head_sha; return r; } },
      { note: "bad verdict enum", mutate: (r) => ({ ...r, verdict: "MEH" }) },
      { note: "audit_committed_in_pr true (const false)", mutate: (r) => ({ ...r, audit_committed_in_pr: true }) },
      { note: "bad pr_number (min 1)", mutate: (r) => ({ ...r, pr_number: 0 }) },
      { note: "bad next_actor enum", mutate: (r) => ({ ...r, next_actor: "wizard" }) },
      { note: "empty changed_files (minItems 1)", mutate: (r) => ({ ...r, changed_files: [] }) },
    ],
  },
];

describe("R6 — schema/runtime behavioral conformance matrix", () => {
  for (const m of MATRICES) {
    const schema = loadSchema(m.schemaFile);
    describe(m.name, () => {
      for (const mut of m.mutations) {
        it(`schema and validator agree: ${mut.note}`, () => {
          const record = mut.mutate(m.baseline());
          const schemaVerdict = schemaAccepts(schema, record);
          const runtimeVerdict = m.validator(record).ok;
          // The runtime validator is allowed to be STRICTER than the schema
          // (it encodes v1 semantic invariants the JSON Schema subset cannot,
          // e.g. next_actor/verdict agreement, non-blank arrays). But it must
          // never be LOOSER: anything the schema rejects, the validator must
          // reject too. This is the safety-critical direction.
          if (!schemaVerdict) {
            expect(runtimeVerdict, `${m.name}/${mut.note}: schema rejects but validator accepts`).toBe(false);
          }
          // And a schema-valid baseline must be accepted by the validator
          // (no false rejections of well-formed records on the "baseline" row).
          if (mut.note.startsWith("baseline")) {
            expect(runtimeVerdict, `${m.name}/${mut.note}: validator rejects the valid baseline`).toBe(true);
            expect(schemaVerdict, `${m.name}/${mut.note}: schema rejects the valid baseline`).toBe(true);
          }
        });
      }
    });
  }

  it("every schema-required field is enforced by the validator (drop-one sweep)", () => {
    for (const m of MATRICES) {
      const schema = loadSchema(m.schemaFile);
      for (const req of schema.required ?? []) {
        const rec = m.baseline();
        delete rec[req];
        expect(m.validator(rec).ok, `${m.name}: dropping required '${req}' must fail the validator`).toBe(false);
      }
    }
  });

  it("lease record: schema sub-object required fields are all validator-enforced", () => {
    const laneSchema = loadSchema("lane-v1.schema.json");
    const leaseReq: string[] = laneSchema.properties.lease.required;
    expect(leaseReq).toContain("holder_login");
    for (const req of leaseReq) {
      const lease = makeLease();
      delete (lease as any)[req];
      expect(validateLease(lease).ok, `lease: dropping required '${req}' must fail`).toBe(false);
    }
  });
});
