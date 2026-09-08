// Control Plane v1 — the CURRENT-TASK-PACKET PROJECTION returned by
// reconstructLane (`task_packet` / `task_packet_source`).
//
// The projection is not a resolver. reconstructLane already binds the current
// packet internally (R2 artifact binding + the reducer's digest pinning) and
// feeds it to the reducer; these tests pin that the RETURNED value is that same
// established binding and nothing else. The contract under test:
//
//   task_packet        = the packet value THIS replay bound for the most recent
//                        coordinator packet event the reducer ACCEPTED
//   task_packet_source = that binding's provenance (durable comment id +
//                        authenticated author)
//   both null          = no coordinator-approved packet was ever established
//
// The adversarial half matters most: a packet comment that merely EXISTS, or an
// event that was REFUSED for any reason, must never surface here — otherwise the
// projection would be a second, divergent packet resolver wearing
// reconstruction's authority.

import { describe, it, expect } from "vitest";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { MARKERS, renderPayload } from "../../.straylight/lib/markers.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord,
  payloadDigest, NOW, LEASE_EXPIRY, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const policy = makePolicy();
const EDITED_AT = "2026-07-16T13:00:00Z";
// A STRUCTURALLY VALID canonical digest that is not the digest of any packet
// posted in this file. The refusals below must therefore be semantic
// (digest-mismatch), not a payload-format complaint.
const WRONG_DIGEST = payloadDigest({ decoy: "not a task packet" });

function comment(
  id: number,
  user: string,
  marker: string,
  payload: any,
  extra: Record<string, any> = {},
) {
  return { id, user, body: `note\n\n${renderPayload(marker, payload)}`, created_at: NOW, ...extra };
}

function genesisBody() {
  return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`;
}

// lane.activated — planning → ready-for-coordinator. Every stream starts here.
function activation() {
  return comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 }));
}

/**
 * The initial packet: artifact comment 2, packet event comment 3.
 * `eventOverrides` / `refsOverrides` let a test break exactly one binding rule
 * while leaving everything else valid.
 */
function initialPacketPair(
  packet: Record<string, any> = makeTaskPacket(),
  {
    packetCommentId = 2,
    eventCommentId = 3,
    packetAuthor = "chatgpt-login",
    packetCommentExtra = {},
    refsOverrides = {},
  }: {
    packetCommentId?: number;
    eventCommentId?: number;
    packetAuthor?: string;
    packetCommentExtra?: Record<string, any>;
    refsOverrides?: Record<string, any>;
  } = {},
) {
  return [
    comment(packetCommentId, packetAuthor, MARKERS.taskPacket, packet, packetCommentExtra),
    comment(eventCommentId, "chatgpt-login", MARKERS.event, makeEvent({
      sequence: 2,
      event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: {
        task_packet_comment_id: packetCommentId,
        task_packet_digest: payloadDigest(packet),
        ...refsOverrides,
      },
    })),
  ];
}

/**
 * Activation + an APPLIED initial packet, then the implement/audit round that
 * ends in patch-required (audit verdict PATCH) — the state a patch packet
 * legitimately applies from. Comment ids 1..8.
 */
function streamThroughPatchRequired(initialPacket: Record<string, any>) {
  const audit = makeAuditRecord({
    verdict: "PATCH",
    concerns: [{ severity: "high", location: "docs/decisions/PHASE-49P-INTAKE.md:12", description: "scope drift" }],
  });
  return [
    activation(),
    ...initialPacketPair(initialPacket),
    comment(4, "claude-login", MARKERS.event, makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
    })),
    comment(5, "claude-login", MARKERS.event, makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    })),
    comment(6, "codex-login", MARKERS.event, makeEvent({
      sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
    })),
    comment(7, "codex-login", MARKERS.audit, audit),
    comment(8, "codex-login", MARKERS.event, makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "PATCH",
      refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(audit) },
    })),
  ];
}

/** A patch packet pair (artifact 9, event 10) posted from patch-required. */
function patchPacketPair(
  packet: Record<string, any>,
  { refsOverrides = {} }: { refsOverrides?: Record<string, any> } = {},
) {
  return [
    comment(9, "chatgpt-login", MARKERS.taskPacket, packet),
    comment(10, "chatgpt-login", MARKERS.event, makeEvent({
      sequence: 7, event_type: "coordinator.patch_packet_posted",
      prior_state: "patch-required",
      refs: {
        task_packet_comment_id: 9,
        task_packet_digest: payloadDigest(packet),
        ...refsOverrides,
      },
    })),
  ];
}

function run(comments: any[], overrides: Record<string, any> = {}) {
  return reconstructLane({
    issue_body: genesisBody(),
    comments,
    policy,
    context: { now: NOW },
    ...overrides,
  });
}

/** Every refusal path shares one assertion: nothing became current. */
function expectNoEstablishedPacket(out: any) {
  expect(out.ok).toBe(true);
  expect(out.task_packet).toBeNull();
  expect(out.task_packet_source).toBeNull();
}

// =============================================================================
// 1. NO ESTABLISHED PACKET → explicit typed absence.
// =============================================================================
describe("no coordinator-approved packet has been established", () => {
  it("an empty comment stream projects null/null", () => {
    expectNoEstablishedPacket(run([]));
  });

  it("an activated lane with no packet event yet projects null/null", () => {
    const out = run([activation()]);
    expect(out.lane?.state).toBe("ready-for-coordinator");
    expectNoEstablishedPacket(out);
  });

  it("a well-formed packet COMMENT that no event ever referenced projects null/null", () => {
    // The packet is syntactically perfect and coordinator-authored. It is still
    // not current: no coordinator event named it, so nothing approved it. A
    // projection built by scanning for the latest packet comment would fail here.
    const out = run([
      activation(),
      comment(2, "chatgpt-login", MARKERS.taskPacket, makeTaskPacket()),
    ]);
    expect(out.lane?.state).toBe("ready-for-coordinator");
    expect(out.dispositions.find((d) => d.comment_id === 2)).toBeUndefined();
    expectNoEstablishedPacket(out);
  });

  it("caller-supplied context can never become the projection", () => {
    // input.context is accepted and ignored (reconstruction takes no wall clock
    // and no caller state). A caller pre-seeding a packet must not be able to
    // manufacture an established one.
    const out = run([activation()], {
      context: {
        now: NOW,
        task_packet: makeTaskPacket({ allowed_paths: ["/"], forbidden_paths: [] }),
        task_packet_source: { comment_id: 999, author: "attacker" },
      },
    });
    expectNoEstablishedPacket(out);
  });

  it("the early genesis refusals expose no packet (nothing was replayed)", () => {
    const out = reconstructLane({
      issue_body: "# Lane\n\nno payload here",
      comments: initialPacketPair(),
      policy,
      context: { now: NOW },
    });
    expect(out.ok).toBe(false);
    expect(out.refusal).toBe("genesis-unreadable");
    expect(out.task_packet ?? null).toBeNull();
    expect(out.task_packet_source ?? null).toBeNull();
  });
});

// =============================================================================
// 2. APPLIED INITIAL PACKET → the exact packet bound during that replay.
// =============================================================================
describe("an applied coordinator.task_packet_posted establishes the projection", () => {
  it("returns the exact packet value and its provenance", () => {
    const packet = makeTaskPacket();
    const out = run([activation(), ...initialPacketPair(packet)]);

    expect(out.dispositions.find((d) => d.comment_id === 3)?.status).toBe("applied");
    expect(out.lane?.state).toBe("ready-for-claude");
    // The exact packet — deep-equal to what the coordinator posted, not a
    // re-parse of some other comment.
    expect(out.task_packet).toEqual(packet);
    // Provenance is the binding reconstruction performed: the durable artifact
    // comment and its AUTHENTICATED author.
    expect(out.task_packet_source).toEqual({ comment_id: 2, author: "chatgpt-login" });
  });

  it("the projected packet still satisfies the digest the event declared", () => {
    // The proof that this is the BOUND packet and not a lookalike: the digest
    // the durable event pinned must match the projected content.
    const packet = makeTaskPacket();
    const comments = [activation(), ...initialPacketPair(packet)];
    const out = run(comments);
    expect(payloadDigest(out.task_packet)).toBe(payloadDigest(packet));
  });

  it("is deterministic: two reconstructions project identical packet + provenance", () => {
    const comments = [activation(), ...initialPacketPair(makeTaskPacket())];
    const a = run(comments);
    const b = run(comments);
    expect(a.task_packet).toEqual(b.task_packet);
    expect(a.task_packet_source).toEqual(b.task_packet_source);
  });

  it("survives the kill switch: a frozen replay still reads the established packet", () => {
    // enabled === false freezes forward action but replays history faithfully,
    // so the projection is a faithful reading too — it just authorizes nothing.
    const out = reconstructLane({
      issue_body: genesisBody(),
      comments: [activation(), ...initialPacketPair(makeTaskPacket())],
      policy: makePolicy({ enabled: false }),
      context: { now: NOW },
    });
    expect(out.frozen).toBe(true);
    expect(out.task_packet_source).toEqual({ comment_id: 2, author: "chatgpt-login" });
  });

  it("an INVALID policy establishes nothing, however valid the packet comment is", () => {
    // Invalid policy authorizes NOTHING: every protocol comment is refused
    // before any handling, so the packet event never applies.
    const out = reconstructLane({
      issue_body: genesisBody(),
      comments: [activation(), ...initialPacketPair(makeTaskPacket())],
      policy: makePolicy({ enabled: "false" }),
      context: { now: NOW },
    });
    expect(out.frozen).toBe(true);
    expect(out.dispositions.every((d) => d.refusal === "policy-invalid")).toBe(true);
    expectNoEstablishedPacket(out);
  });
});

// =============================================================================
// 3. APPLIED PATCH PACKET → the projection follows it.
// =============================================================================
describe("a later applied coordinator.patch_packet_posted supersedes the initial packet", () => {
  it("projects the patch packet, not the initial one", () => {
    const initial = makeTaskPacket();
    const patch = makeTaskPacket({
      packet_kind: "patch",
      patch_cycle: 1,
      capability_success_condition: "Address the audit concern in docs/",
    });
    const out = run([...streamThroughPatchRequired(initial), ...patchPacketPair(patch)]);

    expect(out.dispositions.find((d) => d.comment_id === 10)?.status).toBe("applied");
    expect(out.lane?.state).toBe("ready-for-claude");
    expect(out.lane?.patch_cycle).toBe(1);

    expect(out.task_packet).toEqual(patch);
    expect(out.task_packet).not.toEqual(initial);
    expect(out.task_packet_source).toEqual({ comment_id: 9, author: "chatgpt-login" });
  });

  it("before the patch packet applies, the same stream still projects the initial packet", () => {
    // The projection tracks the packet state at the END of the replay that
    // produced the returned lane — nothing more, nothing less.
    const initial = makeTaskPacket();
    const out = run(streamThroughPatchRequired(initial));
    expect(out.lane?.state).toBe("patch-required");
    expect(out.task_packet).toEqual(initial);
    expect(out.task_packet_source).toEqual({ comment_id: 2, author: "chatgpt-login" });
  });

  it("a REFUSED patch packet leaves the established initial packet in place", () => {
    // A refused supersession must neither become current nor erase what was
    // legitimately established.
    const initial = makeTaskPacket();
    const patch = makeTaskPacket({ packet_kind: "patch", patch_cycle: 1 });
    const out = run([
      ...streamThroughPatchRequired(initial),
      // Declared digest does not match the posted patch packet.
      ...patchPacketPair(patch, { refsOverrides: { task_packet_digest: WRONG_DIGEST } }),
    ]);
    expect(out.dispositions.find((d) => d.comment_id === 10)?.refusal)
      .toBe("task-packet-digest-mismatch");
    expect(out.lane?.state).toBe("patch-required");
    expect(out.task_packet).toEqual(initial);
    expect(out.task_packet_source).toEqual({ comment_id: 2, author: "chatgpt-login" });
  });
});

// =============================================================================
// 4. REFUSED PACKET EVENTS never become the current packet.
//
// One case per refusal family named by the contract. In every one the packet
// COMMENT exists and (except where the point is malformation) parses fine — the
// projection must still be empty, because approval, not existence, is what makes
// a packet current.
// =============================================================================
describe("a refused packet event never becomes the current packet", () => {
  it("MALFORMED packet: task-packet-invalid establishes nothing", () => {
    const broken = { schema: "straylight.task-packet.v1", lane_id: "lane-phase-49p" };
    const out = run([activation(), ...initialPacketPair(broken)]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal).toBe("task-packet-invalid");
    expect(out.lane?.state).toBe("ready-for-coordinator");
    expectNoEstablishedPacket(out);
  });

  it("FOREIGN packet: a packet for another lane establishes nothing", () => {
    const foreign = makeTaskPacket({ lane_id: "lane-phase-49q" });
    const out = run([activation(), ...initialPacketPair(foreign)]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal).toBe("task-packet-wrong-lane");
    expectNoEstablishedPacket(out);
  });

  it("FOREIGN packet: a packet naming another repository establishes nothing", () => {
    const foreign = makeTaskPacket({ repository: "attacker/other-repo" });
    const out = run([activation(), ...initialPacketPair(foreign)]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal)
      .toBe("task-packet-wrong-repository");
    expectNoEstablishedPacket(out);
  });

  it("FUTURE packet: a forward reference (packet comment after the event) establishes nothing", () => {
    // Comment 4 is a valid packet, but comment 3's event cannot reach forward to
    // it — a later comment may never retroactively validate an earlier event.
    const packet = makeTaskPacket();
    const out = run([
      activation(),
      ...initialPacketPair(packet, { packetCommentId: 4, eventCommentId: 3 }),
    ]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal).toBe("task-packet-invalid");
    expectNoEstablishedPacket(out);
  });

  it("DIGEST-MISMATCHED packet: the declared digest not matching the bound content establishes nothing", () => {
    const packet = makeTaskPacket();
    const out = run([
      activation(),
      ...initialPacketPair(packet, { refsOverrides: { task_packet_digest: WRONG_DIGEST } }),
    ]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal)
      .toBe("task-packet-digest-mismatch");
    expectNoEstablishedPacket(out);
  });

  it("DIGEST-MISSING packet: an event declaring no digest establishes nothing", () => {
    const packet = makeTaskPacket();
    const out = run([
      activation(),
      ...initialPacketPair(packet, { refsOverrides: { task_packet_digest: undefined } }),
    ]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal)
      .toBe("task-packet-digest-missing");
    expectNoEstablishedPacket(out);
  });

  it("WRONG-AUTHOR packet: an implementer-authored packet merely NAMED by a coordinator event establishes nothing", () => {
    // The pre-posted wide-scope packet attack: claude-login posts a packet
    // granting itself the whole tree, and a coordinator event names it. Same-author
    // binding refuses it, so it never becomes current.
    const wideScope = makeTaskPacket({ allowed_paths: ["/"], forbidden_paths: [] });
    const out = run([
      activation(),
      ...initialPacketPair(wideScope, { packetAuthor: "claude-login" }),
    ]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal).toBe("task-packet-invalid");
    expectNoEstablishedPacket(out);
  });

  it("FORGED packet event: a stranger's packet event establishes nothing", () => {
    const packet = makeTaskPacket();
    const comments = [
      activation(),
      comment(2, "chatgpt-login", MARKERS.taskPacket, packet),
      comment(3, "some-stranger", MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator",
        refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
      })),
    ];
    const out = run(comments);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.refusal)
      .toBe("actor-identity-mismatch");
    expectNoEstablishedPacket(out);
  });

  it("EDITED packet comment: an escalated lane still projects no packet", () => {
    // The packet comment was mutated after posting → R5 routes the lane to
    // operator-required. The lane changed; the projection did not.
    const packet = makeTaskPacket();
    const out = run([
      activation(),
      ...initialPacketPair(packet, { packetCommentExtra: { updated_at: EDITED_AT } }),
    ]);
    expect(out.dispositions.find((d) => d.comment_id === 2)?.refusal)
      .toBe("protocol-comment-edited");
    expect(out.lane?.state).toBe("operator-required");
    expectNoEstablishedPacket(out);
  });

  it("MISSING packet comment: a dangling reference establishes nothing", () => {
    const out = run([
      activation(),
      comment(3, "chatgpt-login", MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator",
        refs: { task_packet_comment_id: 12345, task_packet_digest: WRONG_DIGEST },
      })),
    ]);
    expect(out.dispositions.find((d) => d.comment_id === 3)?.status).toBe("refused");
    expectNoEstablishedPacket(out);
  });

  it("OUT-OF-TURN packet event: a packet posted before the lane was activated establishes nothing", () => {
    // Valid packet, valid author, valid digest — but the lane is still in
    // planning, so the event is refused. Approval is stateful, not syntactic.
    const out = run(initialPacketPair(makeTaskPacket(), { packetCommentId: 1, eventCommentId: 2 }));
    expect(out.dispositions.find((d) => d.comment_id === 2)?.status).toBe("refused");
    expect(out.lane?.state).toBe("planning");
    expectNoEstablishedPacket(out);
  });
});

// =============================================================================
// 5. REPLAY AUTHORITY + NO NEW AUTHORITY.
// =============================================================================
describe("the projection is a reconstruction reading, not a grant", () => {
  it("derives from the same replay that produced the returned lane", () => {
    // The applied packet ESTABLISHED lane.working_branch from its own
    // target_branch. If the projection came from a separate scan it could
    // disagree with the lane it is returned alongside; it cannot.
    const packet = makeTaskPacket();
    const out = run([activation(), ...initialPacketPair(packet)]);
    expect(out.task_packet?.target_branch).toBe(out.lane?.working_branch);
    expect(out.task_packet?.lane_id).toBe(out.lane?.lane_id);
    expect(out.task_packet?.base_sha).toBe(out.lane?.base_sha);
    expect(out.task_packet?.patch_cycle).toBe(out.lane?.patch_cycle);
  });

  it("adding the projection changes no other part of the result", () => {
    // Same durable input, same governed outputs: the lane, dispositions and
    // labels are what they were before the projection existed. It confers no
    // lease, no state change, and no write authority.
    const out = run([activation(), ...initialPacketPair(makeTaskPacket())]);
    expect(out.lane?.state).toBe("ready-for-claude");
    expect(out.lane?.lease).toBeNull();
    expect(out.lane?.event_sequence).toBe(2);
    expect(out.labels).toEqual(["cp-lane", "cp-state:ready-for-claude", "cp-next:implementer"]);
    expect(out.dispositions.map((d) => d.status)).toEqual(["applied", "applied"]);
  });

  it("the packet is still current after a non-packet event advances the lane", () => {
    // Downstream events validate AGAINST the current packet; they neither
    // re-establish nor clear it. The projection tracks exactly that state.
    const packet = makeTaskPacket();
    const out = run([
      activation(),
      ...initialPacketPair(packet),
      comment(4, "claude-login", MARKERS.event, makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
      })),
    ]);
    expect(out.lane?.state).toBe("claude-working");
    expect(out.task_packet).toEqual(packet);
    expect(out.task_packet_source).toEqual({ comment_id: 2, author: "chatgpt-login" });
  });
});
