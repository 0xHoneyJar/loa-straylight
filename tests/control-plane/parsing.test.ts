// Control Plane v1 — marker/payload parsing and structural validation.
// Covers required tests: valid lane parsing, malformed lane rejection,
// valid event parsing, ambiguous multiple-event rejection.

import { describe, it, expect } from "vitest";
import { MARKERS, extractPayload, renderPayload, hasMarker } from "../../.straylight/lib/markers.mjs";
import { validateLane, validateEvent, validatePolicy } from "../../.straylight/lib/validate.mjs";
import { makeLane, makeEvent, makePolicy } from "./_fixtures.js";

describe("marker payload extraction", () => {
  it("extracts a single well-formed payload (valid lane parsing)", () => {
    const lane = makeLane();
    const body = `# Lane issue\n\nprose above\n\n${renderPayload(MARKERS.lane, lane)}\n\nprose below`;
    const out = extractPayload(body, MARKERS.lane);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.value.lane_id).toBe("lane-phase-49p");
  });

  it("rejects two payloads of the same kind as ambiguous", () => {
    const lane = makeLane();
    const body = renderPayload(MARKERS.lane, lane) + "\n\n" + renderPayload(MARKERS.lane, makeLane({ state: "ready-for-merge" }));
    const out = extractPayload(body, MARKERS.lane);
    expect(out).toEqual({ ok: false, reason: "ambiguous-multiple-payloads" });
  });

  it("rejects two event payloads in one comment (ambiguous multiple-event)", () => {
    const body = renderPayload(MARKERS.event, makeEvent()) + "\n" + renderPayload(MARKERS.event, makeEvent());
    const out = extractPayload(body, MARKERS.event);
    expect(out).toEqual({ ok: false, reason: "ambiguous-multiple-payloads" });
  });

  it("does not confuse different marker kinds in one body", () => {
    const body = renderPayload(MARKERS.taskPacket, { schema: "straylight.task-packet.v1" }) +
      "\n\n" + renderPayload(MARKERS.event, makeEvent());
    expect(extractPayload(body, MARKERS.event).ok).toBe(true);
    expect(extractPayload(body, MARKERS.taskPacket).ok).toBe(true);
  });

  it("rejects malformed JSON, non-objects, and unterminated fences", () => {
    expect(extractPayload(`<!-- ${MARKERS.event} -->\n\`\`\`json\n{nope\n\`\`\``, MARKERS.event))
      .toEqual({ ok: false, reason: "malformed-json" });
    expect(extractPayload(`<!-- ${MARKERS.event} -->\n\`\`\`json\n[1,2]\n\`\`\``, MARKERS.event))
      .toEqual({ ok: false, reason: "payload-not-object" });
    expect(extractPayload(`<!-- ${MARKERS.event} -->\n\`\`\`json\n{"a":1}`, MARKERS.event))
      .toEqual({ ok: false, reason: "unterminated-json-fence" });
  });

  it("rejects a marker separated from its fence by prose (no payload smuggling)", () => {
    const body = `<!-- ${MARKERS.event} -->\nsome prose\n\`\`\`json\n{"a":1}\n\`\`\``;
    expect(extractPayload(body, MARKERS.event)).toEqual({ ok: false, reason: "marker-fence-separated" });
  });

  it("returns no-payload for absent markers and never evaluates content", () => {
    expect(extractPayload("just prose, even with ```json\n{}\n``` inside", MARKERS.event))
      .toEqual({ ok: false, reason: "no-payload" });
    expect(hasMarker("prose", MARKERS.event)).toBe(false);
  });

  it("rejects oversized payloads", () => {
    const big = { schema: "straylight.event.v1", filler: "x".repeat(70000) };
    const out = extractPayload(renderPayload(MARKERS.event, big), MARKERS.event);
    expect(out).toEqual({ ok: false, reason: "payload-too-large" });
  });
});

describe("structural validation", () => {
  it("accepts a valid lane", () => {
    expect(validateLane(makeLane()).ok).toBe(true);
  });

  it("rejects malformed lanes field-by-field (malformed lane rejection)", () => {
    expect(validateLane(null).ok).toBe(false);
    expect(validateLane({}).ok).toBe(false);
    expect(validateLane(makeLane({ lane_id: "BAD ID!" })).ok).toBe(false);
    expect(validateLane(makeLane({ base_sha: "shortsha" })).ok).toBe(false);
    expect(validateLane(makeLane({ state: "quantum" })).ok).toBe(false);
    expect(validateLane(makeLane({ event_sequence: -1 })).ok).toBe(false);
    expect(validateLane(makeLane({ tier: "tier-9" })).ok).toBe(false);
  });

  it("rejects a lane claiming active mode or auto-merge (v1 invariants)", () => {
    const active = validateLane(makeLane({ mode: "active" }));
    expect(active.ok).toBe(false);
    if (!active.ok) expect(active.errors.join(" ")).toContain("active");
    const auto = validateLane(makeLane({ auto_merge_allowed: true }));
    expect(auto.ok).toBe(false);
  });

  it("rejects a lane whose phase escapes its own corridor", () => {
    expect(validateLane(makeLane({ phase: "phase-51z" })).ok).toBe(false);
  });

  it("accepts a valid event and rejects malformed events", () => {
    expect(validateEvent(makeEvent()).ok).toBe(true);
    expect(validateEvent(makeEvent({ sequence: 0 })).ok).toBe(false);
    expect(validateEvent(makeEvent({ actor_role: "supreme-leader" })).ok).toBe(false);
    expect(validateEvent(makeEvent({ github_actor: "bad login!!" })).ok).toBe(false);
    expect(validateEvent(makeEvent({ occurred_at: "yesterday" })).ok).toBe(false);
    expect(validateEvent(makeEvent({ event_type: "rm -rf /" })).ok).toBe(false);
  });

  it("accepts the committed policy shape and rejects flipped guardrails", () => {
    expect(validatePolicy(makePolicy()).ok).toBe(true);
    expect(validatePolicy(makePolicy({ auto_merge: true })).ok).toBe(false);
    expect(validatePolicy(makePolicy({ mode: "active" })).ok).toBe(false);
    expect(validatePolicy(makePolicy({ automatic_sibling_repo_edits: true })).ok).toBe(false);
    expect(validatePolicy(makePolicy({ actor_allowlist: undefined })).ok).toBe(false);
  });
});
