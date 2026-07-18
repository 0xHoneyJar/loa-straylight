// Control Plane v1 — direct regressions for the Codex PATCH findings
// (fifth round, E1–E2). One describe() per finding; each test reproduces
// the reported failure shape against the patched code.
//
//  E1  strict timestamp parsing must not inherit Date.UTC's legacy
//      two-digit-year remapping: years 0000–0099 were silently mapped onto
//      1900–1999, so 0099-01-01 and 1999-01-01 collapsed to the SAME epoch
//      instant and strict ordering broke across the remapped range. The
//      instant is now constructed via setUTCFullYear with a full calendar
//      round-trip; every four-digit year the published schema pattern
//      accepts is a distinct, correctly ordered instant.
//  E2  canonical JSON must preserve an own "__proto__" property: the plain
//      `{}` accumulator's prototype accessor swallowed the key, so two
//      payloads differing only by an own "__proto__" property produced the
//      SAME canonical JSON and SAME digest — an undetectable artifact
//      mutation. The accumulator is now null-prototype; the key serializes,
//      the digest changes, and no prototype is ever mutated.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { renderPayload, extractPayload, MARKERS } from "../../.straylight/lib/markers.mjs";
import { parseIsoInstant, validateLease, validateEvent } from "../../.straylight/lib/validate.mjs";
import { canonicalize, payloadDigest } from "../../.straylight/lib/canonical.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord, makeLease,
  laneCodexWorking,
  NOW, LEASE_EXPIRY, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const policy = makePolicy();
const ctx = { now: NOW };

// The published timestamp pattern, read from the schema it is normative in.
function schemaTimestampPattern(): RegExp {
  const event = JSON.parse(readFileSync(".straylight/schemas/event-v1.schema.json", "utf8"));
  return new RegExp(event.properties.occurred_at.pattern);
}

// A structural copy of `value` carrying an OWN, enumerable "__proto__" data
// property (what the strict parser produces for a payload authored with that
// key). A plain object-literal spread cannot express this — `__proto__` in a
// literal is the prototype slot — so it is defined explicitly.
function withOwnProto(value: Record<string, any>, protoVal: any = { smuggled: true }) {
  const copy = JSON.parse(JSON.stringify(value));
  Object.defineProperty(copy, "__proto__", {
    value: protoVal, writable: true, enumerable: true, configurable: true,
  });
  return copy;
}

// =============================================================================
// E1 — no Date.UTC two-digit-year remapping in strict timestamp parsing.
// Original defect: Date.UTC(99, ...) means 1999, not 0099 — accepted years
// 0000–0099 were remapped onto 1900–1999, collapsing distinct instants and
// mis-ordering any comparison that crossed the remapped range.
// =============================================================================
describe("E1 — timestamp years 0000–0099 are not remapped onto 1900–1999", () => {
  it("years 0099 and 1999 parse to DISTINCT, correctly ordered instants", () => {
    const y0099 = parseIsoInstant("0099-01-01T00:00:00Z")!;
    const y1999 = parseIsoInstant("1999-01-01T00:00:00Z")!;
    expect(y0099).not.toBe(y1999); // the original collapse
    expect(y0099).toBeLessThan(y1999);
    // Both agree with the host's own full-year ISO parser.
    expect(y0099).toBe(Date.parse("0099-01-01T00:00:00Z"));
    expect(y1999).toBe(Date.parse("1999-01-01T00:00:00Z"));
    // The same holds at the other edge of the remapped range.
    expect(parseIsoInstant("0000-06-15T12:00:00Z")).toBe(Date.parse("0000-06-15T12:00:00Z"));
    expect(parseIsoInstant("0000-06-15T12:00:00Z")).not.toBe(parseIsoInstant("1900-06-15T12:00:00Z"));
  });

  it("the boundary years of the published pattern round-trip exactly", () => {
    for (const [s, iso] of [
      ["0000-01-01T00:00:00Z", "0000-01-01T00:00:00.000Z"],
      ["0001-01-01T00:00:00Z", "0001-01-01T00:00:00.000Z"],
      ["0099-12-31T23:59:59.999Z", "0099-12-31T23:59:59.999Z"],
      ["0100-01-01T00:00:00Z", "0100-01-01T00:00:00.000Z"],
      ["9999-12-31T23:59:59.999Z", "9999-12-31T23:59:59.999Z"],
    ] as const) {
      const ms = parseIsoInstant(s);
      expect(ms, s).not.toBeNull();
      expect(new Date(ms!).toISOString(), s).toBe(iso);
      // The canonical rendering parses back to the same instant.
      expect(parseIsoInstant(iso), s).toBe(ms);
    }
  });

  it("every year across the accepted range parses to the host-parser instant, strictly increasing", () => {
    const years: number[] = [0, 1, 99, 100, 400, 1899, 1900, 1969, 1970, 2026, 9999];
    for (let y = 137; y < 10000; y += 137) years.push(y);
    years.sort((a, b) => a - b);
    let prev = -Infinity;
    for (const y of years) {
      const s = `${String(y).padStart(4, "0")}-03-01T12:34:56.789Z`;
      const ms = parseIsoInstant(s);
      expect(ms, s).toBe(Date.parse(s));
      expect(ms!, s).toBeGreaterThan(prev);
      prev = ms!;
    }
  });

  it("year shapes outside the published schema pattern are rejected by BOTH schema and validator", () => {
    const pattern = schemaTimestampPattern();
    for (const s of [
      "99-01-01T00:00:00Z", // two-digit year (the remapping-prone shape)
      "999-01-01T00:00:00Z", // three-digit year
      "12026-01-01T00:00:00Z", // five-digit year
      "-0001-01-01T00:00:00Z", // negative year
      "+2026-01-01T00:00:00Z", // expanded-year sign
    ]) {
      expect(pattern.test(s), s).toBe(false);
      expect(parseIsoInstant(s), s).toBeNull();
    }
    // And the accepted set matches the other way: four-digit years the
    // schema pattern admits are accepted by the executable validator.
    for (const s of ["0000-01-01T00:00:00Z", "0099-01-01T00:00:00Z", "9999-12-31T23:59:59.999Z"]) {
      expect(pattern.test(s), s).toBe(true);
      expect(parseIsoInstant(s), s).not.toBeNull();
    }
  });

  it("calendar validity still holds inside the formerly remapped range", () => {
    expect(parseIsoInstant("0099-02-29T00:00:00Z")).toBeNull(); // 0099 is not a leap year
    expect(parseIsoInstant("0100-02-29T00:00:00Z")).toBeNull(); // century, not ÷400
    expect(parseIsoInstant("0096-02-29T00:00:00Z")).toBe(Date.parse("0096-02-29T00:00:00Z"));
    expect(parseIsoInstant("0000-02-29T00:00:00Z")).toBe(Date.parse("0000-02-29T00:00:00Z")); // ÷400 leap
    // Sub-millisecond precision remains rejected (D3 unchanged).
    expect(parseIsoInstant("0099-01-01T00:00:00.0001Z")).toBeNull();
  });

  it("executable validator path: lease ordering across the formerly collapsed years is now correct", () => {
    // acquired 0099 → expires 1999 is a VALID (if absurd) ordering; under the
    // remapping both collapsed to the same instant and it was refused as
    // "not after".
    const spanning = validateLease(makeLease({
      acquired_at: "0099-01-01T00:00:00Z",
      expires_at: "1999-01-01T00:00:00Z",
    }));
    expect(spanning.ok).toBe(true);
    // acquired 1999 → expires 0099 is REVERSED; under the remapping the 0099
    // expiry read as 1999-12-31-ish and the lease looked valid.
    const reversed = validateLease(makeLease({
      acquired_at: "1999-01-01T00:00:00Z",
      expires_at: "0099-12-31T23:59:59Z",
    }));
    expect(reversed.ok).toBe(false);
    if (!reversed.ok) expect(reversed.errors.join("; ")).toContain("expires_at: not after acquired_at");
  });

  it("an event timestamped in a formerly remapped year is structurally valid", () => {
    expect(validateEvent(makeEvent({ occurred_at: "0099-01-01T00:00:00Z" })).ok).toBe(true);
  });

  it("the validator source constructs instants without Date.UTC (remapping source pinned out)", () => {
    const src = readFileSync(".straylight/lib/validate.mjs", "utf8");
    expect(src).not.toMatch(/Date\.UTC\s*\(/);
    expect(src).toContain("setUTCFullYear");
  });
});

// =============================================================================
// E2 — canonical JSON preserves an own "__proto__" property.
// Original defect: sortKeys accumulated into a plain `{}`, whose inherited
// Object.prototype "__proto__" accessor swallowed the assignment — the key
// vanished from the canonical output, so a payload smuggling an own
// "__proto__" property digested IDENTICALLY to the clean payload and the
// digest-pinning replay check could not detect the mutation.
// =============================================================================
describe("E2 — canonicalization preserves own __proto__ keys; digests distinguish them", () => {
  it("an own __proto__ key survives canonicalization (exact canonical form)", () => {
    const dirty = withOwnProto({ b: 2, a: 1 }, { x: 1 });
    expect(canonicalize(dirty)).toBe('{"__proto__":{"x":1},"a":1,"b":2}');
  });

  it("a NESTED own __proto__ key survives too", () => {
    const nested = { outer: withOwnProto({ z: 3 }, { x: 1 }), list: [withOwnProto({ q: 4 }, 7)] };
    expect(canonicalize(nested)).toBe('{"list":[{"__proto__":7,"q":4}],"outer":{"__proto__":{"x":1},"z":3}}');
  });

  it("canonicalization mutates NO prototype", () => {
    const dirty = withOwnProto({ a: 1 }, { polluted: true });
    canonicalize(dirty);
    payloadDigest(dirty);
    expect(({} as any).polluted).toBeUndefined(); // Object.prototype untouched
    expect(([] as any).polluted).toBeUndefined(); // Array.prototype untouched
    expect(Object.getPrototypeOf(dirty)).toBe(Object.prototype); // input untouched
    expect(canonicalize({})).toBe("{}"); // and ordinary output is unchanged
  });

  it("payloads differing ONLY by an own __proto__ key produce different canonical JSON and digests", () => {
    const cleanPacket = makeTaskPacket();
    const dirtyPacket = withOwnProto(cleanPacket);
    expect(canonicalize(dirtyPacket)).not.toBe(canonicalize(cleanPacket));
    expect(payloadDigest(dirtyPacket)).not.toBe(payloadDigest(cleanPacket));
    const cleanAudit = makeAuditRecord();
    const dirtyAudit = withOwnProto(cleanAudit);
    expect(canonicalize(dirtyAudit)).not.toBe(canonicalize(cleanAudit));
    expect(payloadDigest(dirtyAudit)).not.toBe(payloadDigest(cleanAudit));
  });

  it("the digest is deterministic through the full post-and-parse round trip", () => {
    // What a poster digests locally must equal what a replayer digests after
    // renderPayload → GitHub comment body → extractPayload (strict parser,
    // which preserves the own __proto__ property via defineProperty).
    const dirty = withOwnProto(makeTaskPacket());
    const back = extractPayload(renderPayload(MARKERS.taskPacket, dirty), MARKERS.taskPacket);
    expect(back.ok).toBe(true);
    if (back.ok) {
      expect(Object.getOwnPropertyNames(back.value)).toContain("__proto__");
      expect(payloadDigest(back.value)).toBe(payloadDigest(dirty));
    }
  });

  it("reducer: packet digest verification DETECTS a smuggled own __proto__ (and binds when declared)", () => {
    const clean = makeTaskPacket();
    const dirty = withOwnProto(clean);
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const packetEvent = (digest: string) => makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2, task_packet_digest: digest },
    });
    // The event declared the CLEAN packet's digest; the bound comment now
    // carries the __proto__-bearing variant → mutation detected.
    const tampered = reduce(lane, packetEvent(payloadDigest(clean)), policy, { ...ctx, task_packet: dirty });
    expect(tampered.ok).toBe(false);
    if (!tampered.ok) expect(tampered.refusal).toBe("task-packet-digest-mismatch");
    // Control: a declaration matching the actual (dirty) content binds — the
    // digest pins exact content, in both directions.
    const bound = reduce(lane, packetEvent(payloadDigest(dirty)), policy, { ...ctx, task_packet: dirty });
    expect(bound.ok).toBe(true);
  });

  it("reducer: audit digest verification detects the same difference", () => {
    const clean = makeAuditRecord();
    const dirty = withOwnProto(clean);
    const out = reduce(laneCodexWorking(), makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
      refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(clean) },
    }), policy, { ...ctx, audit_record: dirty });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-digest-mismatch");
  });

  it("reconstruction: a packet comment smuggling an own __proto__ breaks its digest binding during replay", () => {
    const clean = makeTaskPacket();
    const dirty = withOwnProto(clean);
    const comments = [
      { id: 1, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 1 })), created_at: NOW },
      // The posted packet carries the own __proto__ property...
      { id: 2, user: "chatgpt-login", body: renderPayload(MARKERS.taskPacket, dirty), created_at: NOW },
      // ...but the durable event declared the digest of the CLEAN packet.
      { id: 3, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator",
        refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(clean) },
      })), created_at: NOW },
    ];
    const out = reconstructLane({
      issue_body: `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`,
      comments, policy, context: { now: NOW },
    });
    const refused = out.dispositions.find((d) => d.comment_id === 3);
    expect(refused?.status).toBe("refused");
    expect(refused?.refusal).toBe("task-packet-digest-mismatch");
    expect(out.lane?.state).toBe("ready-for-coordinator"); // packet never bound
  });

  it("reconstruction: an audit comment smuggling an own __proto__ breaks its digest binding during replay", () => {
    const packet = makeTaskPacket();
    const cleanAudit = makeAuditRecord();
    const dirtyAudit = withOwnProto(cleanAudit);
    const comments = [
      { id: 1, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 1 })), created_at: NOW },
      { id: 2, user: "chatgpt-login", body: renderPayload(MARKERS.taskPacket, packet), created_at: NOW },
      { id: 3, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator",
        refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
      })), created_at: NOW },
      { id: 4, user: "claude-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
      })), created_at: NOW },
      { id: 5, user: "claude-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.completed", prior_state: "claude-working",
        lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
        refs: { pr_number: 120 },
      })), created_at: NOW },
      { id: 6, user: "codex-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 5, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
        lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
      })), created_at: NOW },
      // The posted audit record carries the own __proto__ property...
      { id: 7, user: "codex-login", body: renderPayload(MARKERS.audit, dirtyAudit), created_at: NOW },
      // ...but the durable completion event declared the CLEAN digest.
      { id: 8, user: "codex-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(cleanAudit) },
      })), created_at: NOW },
    ];
    const out = reconstructLane({
      issue_body: `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`,
      comments, policy, context: { now: NOW },
    });
    const refused = out.dispositions.find((d) => d.comment_id === 8);
    expect(refused?.status).toBe("refused");
    expect(refused?.refusal).toBe("audit-digest-mismatch");
    expect(out.lane?.state).toBe("codex-working"); // the ACCEPT never applied
    expect(out.lane?.verdict).toBeNull();
  });

  it("the canonicalization source accumulates into a null-prototype object (defect source pinned out)", () => {
    const src = readFileSync(".straylight/lib/canonical.mjs", "utf8");
    expect(src).toContain("Object.create(null)");
    expect(src).not.toMatch(/const out = \{\};/);
  });
});
