// Control Plane v1 — the LEASE-HISTORY PROJECTION returned by reconstructLane
// (`used_lease_ids`).
//
// R3 says a lease id may be consumed at most once across a lane's whole
// history. The authority for that already exists and already lives in exactly
// one place: reconstructLane accumulates the lease id of every APPLIED
// `*.lease_acquired` event and hands THAT ONE Set to the reducer as
// `context.used_lease_ids`, which is what the reducer refuses
// `lease-id-reused` against. What was missing was only the reading — so a
// consumer of the pinned readonly reconstruction interface could ask "has this
// candidate lease id already been consumed?" without parsing comments, parsing
// event bodies, inferring dispositions, or reimplementing the rule locally.
//
// The contract under test:
//
//   used_lease_ids = a FROZEN COPY of that same accumulator, in replay order
//   applied acquisitions       → present
//   refused acquisitions       → absent (reducer-refused AND pre-reduce-refused)
//   released/expired/requeued  → STILL present, even with lane.lease null
//   implementer + auditor      → one shared namespace
//   consumer mutation          → cannot reach the reducer's live history
//
// The load-bearing claim is the LAST one plus P4: reducer refusal and this
// projection must remain two readings of ONE fact. If they could diverge, the
// projection would be a second, competing lease-history resolver wearing
// reconstruction's authority — which is precisely what a consumer that
// re-derived history locally would already have.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { MARKERS, renderPayload } from "../../.straylight/lib/markers.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket,
  payloadDigest, NOW, LEASE_EXPIRY, AFTER_EXPIRY, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const policy = makePolicy();

// A lease granted at AFTER_EXPIRY (17:00) must expire after its own grant and
// within the epoch's 240m window: 20:00 satisfies both.
const POST_REQUEUE_EXPIRY = "2026-07-16T20:00:00Z";
// Beyond AFTER_EXPIRY + 240m — a real calendar instant, so the refusal below is
// semantic (lease-expiry-unbounded), not a format complaint.
const UNBOUNDED_EXPIRY = "2026-07-17T23:00:00Z";

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

function run(comments: any[], overrides: Record<string, any> = {}) {
  return reconstructLane({
    issue_body: genesisBody(),
    comments,
    policy,
    context: { now: NOW },
    ...overrides,
  });
}

/**
 * An implementer acquisition, ready-for-claude → claude-working. `event_id` is
 * optional (makeEvent mints a unique one otherwise) and exists only so the P4
 * counterfactual pair can build two histories that differ in ONE named field.
 */
function acquireImplementer(
  id: number,
  { sequence, lease_id, lease_expires_at = LEASE_EXPIRY, created_at = NOW, user = "claude-login", event_id }:
  { sequence: number; lease_id: string; lease_expires_at?: string; created_at?: string; user?: string; event_id?: string },
) {
  return comment(id, user, MARKERS.event, makeEvent({
    sequence, actor_role: "implementer", github_actor: "claude-login",
    event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
    lease_id, lease_expires_at,
    ...(event_id ? { event_id } : {}),
  }), { created_at });
}

// =============================================================================
// THE ONE DURABLE STREAM.
//
// Comment ids 1..14, one lane, replayed as a whole or truncated with .slice().
// It walks a full lease life: grant → release → grant → expiry → requeue →
// three refused acquisitions (unbounded expiry, reused id, forged identity) →
// grant → completion → auditor grant. Every id below is named by the fixture,
// so the expectations are fixture-level facts, not a second consumption rule
// re-implemented in the test.
// =============================================================================
const PACKET = makeTaskPacket();

const STREAM = [
  // 1..3 — activation and the coordinator packet that establishes the working
  // branch (an implementer lease is refused without a valid bound packet).
  comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 })),
  comment(2, "chatgpt-login", MARKERS.taskPacket, PACKET),
  comment(3, "chatgpt-login", MARKERS.event, makeEvent({
    sequence: 2, event_type: "coordinator.task_packet_posted",
    prior_state: "ready-for-coordinator",
    refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(PACKET) },
  })),
  // 4 — APPLIED grant #1.
  acquireImplementer(4, { sequence: 3, lease_id: "lease-claude-1" }),
  // 5 — voluntary release: the lane loses its lease, history does not.
  comment(5, "claude-login", MARKERS.event, makeEvent({
    sequence: 4, actor_role: "implementer", github_actor: "claude-login",
    event_type: "implementer.lease_released", prior_state: "claude-working",
    lease_id: "lease-claude-1",
  })),
  // 6 — APPLIED grant #2 (a NEW id: the released one may never come back).
  acquireImplementer(6, { sequence: 5, lease_id: "lease-claude-2" }),
  // 7 — expiry, observed after the recorded expiry instant.
  comment(7, "github-actions[bot]", MARKERS.event, makeEvent({
    sequence: 6, actor_role: "system", github_actor: "github-actions[bot]",
    event_type: "system.lease_expired", prior_state: "claude-working",
  }), { created_at: AFTER_EXPIRY }),
  // 8 — watchdog requeue back to the implementer queue.
  comment(8, "github-actions[bot]", MARKERS.event, makeEvent({
    sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
    event_type: "system.requeued", prior_state: "lease-expired",
    requested_state: "ready-for-claude",
  }), { created_at: AFTER_EXPIRY }),
  // 9 — REDUCER-REFUSED acquisition: the refusal happens INSIDE the reducer's
  // lease_acquired case, one check away from the accumulator. Its id must not
  // enter — an unadmitted claim burns nothing.
  acquireImplementer(9, {
    sequence: 8, lease_id: "lease-claude-unbounded",
    lease_expires_at: UNBOUNDED_EXPIRY, created_at: AFTER_EXPIRY,
  }),
  // 10 — REDUCER-REFUSED acquisition reusing grant #1's id (P4).
  acquireImplementer(10, {
    sequence: 8, lease_id: "lease-claude-1",
    lease_expires_at: POST_REQUEUE_EXPIRY, created_at: AFTER_EXPIRY,
  }),
  // 11 — PRE-REDUCE-REFUSED acquisition: a stranger's comment claiming to be
  // the implementer. It dies at identity binding, before reduce() is called at
  // all, so nothing about it is admitted — including its lease id.
  acquireImplementer(11, {
    sequence: 8, lease_id: "lease-stranger",
    lease_expires_at: POST_REQUEUE_EXPIRY, created_at: AFTER_EXPIRY,
    user: "some-stranger",
  }),
  // 12 — APPLIED grant #3, after the three refusals changed nothing.
  acquireImplementer(12, {
    sequence: 8, lease_id: "lease-claude-3",
    lease_expires_at: POST_REQUEUE_EXPIRY, created_at: AFTER_EXPIRY,
  }),
  // 13 — implementation completed under grant #3.
  comment(13, "claude-login", MARKERS.event, makeEvent({
    sequence: 9, actor_role: "implementer", github_actor: "claude-login",
    event_type: "implementer.completed", prior_state: "claude-working",
    lease_id: "lease-claude-3", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
    refs: { pr_number: 120 },
  }), { created_at: AFTER_EXPIRY }),
  // 14 — APPLIED AUDITOR grant: the other role, the SAME history.
  comment(14, "codex-login", MARKERS.event, makeEvent({
    sequence: 10, actor_role: "auditor", github_actor: "codex-login",
    event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
    lease_id: "lease-codex-1", lease_expires_at: POST_REQUEUE_EXPIRY,
  }), { created_at: AFTER_EXPIRY }),
];

/** Every APPLIED acquisition in STREAM, in the order the replay applied them. */
const APPLIED_LEASE_IDS = ["lease-claude-1", "lease-claude-2", "lease-claude-3", "lease-codex-1"];
/** Every acquisition in STREAM that was refused, by either route. */
const REFUSED_LEASE_IDS = ["lease-claude-unbounded", "lease-stranger"];

/** Through the release (5), through the expiry (7), through the requeue (8). */
const THROUGH_RELEASE = STREAM.slice(0, 5);
const THROUGH_EXPIRY = STREAM.slice(0, 7);
const THROUGH_REQUEUE = STREAM.slice(0, 8);

function statusOf(out: any, comment_id: number) {
  return out.dispositions.find((d: any) => d.comment_id === comment_id);
}

// =============================================================================
// P1 — APPLIED ACQUISITIONS ARE PROJECTED (both roles, one namespace).
// =============================================================================
describe("P1 — every applied lease acquisition appears in used_lease_ids", () => {
  it("projects all four applied grants, in replay order, and nothing else", () => {
    const out = run(STREAM);
    expect(out.ok).toBe(true);
    // The four acquisitions this stream applied, and the two it refused.
    for (const id of [4, 6, 12, 14]) expect(statusOf(out, id)?.status, `comment ${id}`).toBe("applied");
    for (const id of [9, 10, 11]) expect(statusOf(out, id)?.status, `comment ${id}`).toBe("refused");
    expect(out.used_lease_ids).toEqual(APPLIED_LEASE_IDS);
  });

  it("implementer and auditor lease ids share one historical namespace", () => {
    const out = run(STREAM);
    // The final lease is the AUDITOR's; three implementer ids and one auditor
    // id sit in the same projected history, undistinguished by role.
    expect(out.lane?.state).toBe("codex-working");
    expect(out.lane?.lease?.actor_role).toBe("auditor");
    expect(out.lane?.lease?.lease_id).toBe("lease-codex-1");
    expect(out.used_lease_ids).toContain("lease-codex-1");
    expect(out.used_lease_ids?.filter((id) => id.startsWith("lease-claude-"))).toEqual([
      "lease-claude-1", "lease-claude-2", "lease-claude-3",
    ]);
  });

  it("insertion order is ascending durable comment order, not the caller's order", () => {
    // Fed in reverse, reconstruction still replays by ascending comment id, so
    // the projection is identical — the order is the replay's, not the caller's.
    const forward = run(STREAM);
    const reversed = run([...STREAM].reverse());
    expect(reversed.used_lease_ids).toEqual(forward.used_lease_ids);
    expect(reversed.used_lease_ids).toEqual(APPLIED_LEASE_IDS);
  });

  it("replay order is preserved even when it disagrees with a lexical sort", () => {
    // Two grants whose ids sort the OTHER way round. The projection reports the
    // order history actually consumed them in; no independent sort is applied.
    const out = run([
      ...STREAM.slice(0, 3),
      acquireImplementer(4, { sequence: 3, lease_id: "lease-zulu" }),
      comment(5, "claude-login", MARKERS.event, makeEvent({
        sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_released", prior_state: "claude-working",
        lease_id: "lease-zulu",
      })),
      acquireImplementer(6, { sequence: 5, lease_id: "lease-alpha" }),
    ]);
    expect(out.used_lease_ids).toEqual(["lease-zulu", "lease-alpha"]);
    expect(out.used_lease_ids).not.toEqual(["lease-alpha", "lease-zulu"]);
  });

  it("a lane with no acquisitions projects an empty (still frozen) history", () => {
    const out = run(STREAM.slice(0, 3));
    expect(out.lane?.state).toBe("ready-for-claude");
    expect(out.used_lease_ids).toEqual([]);
    expect(Object.isFrozen(out.used_lease_ids)).toBe(true);
  });

  it("is absent on the pre-replay error returns, exactly like the packet projection", () => {
    // Nothing was replayed, so there is no history to read — the field is
    // undefined rather than a misleading empty history.
    const out = reconstructLane({
      issue_body: "# Lane\n\nno payload here",
      comments: STREAM,
      policy,
      context: { now: NOW },
    });
    expect(out.ok).toBe(false);
    expect(out.refusal).toBe("genesis-unreadable");
    expect(out.used_lease_ids).toBeUndefined();
    expect(out.task_packet).toBeUndefined();
  });
});

// =============================================================================
// P2 — HISTORICAL PERSISTENCE: consumed is permanent, held is not.
// =============================================================================
describe("P2 — released, expired and requeued lease ids remain consumed", () => {
  it("after a voluntary release the lane holds no lease and the id remains", () => {
    const out = run(THROUGH_RELEASE);
    expect(statusOf(out, 5)?.status).toBe("applied");
    expect(out.lane?.state).toBe("ready-for-claude");
    expect(out.lane?.lease).toBeNull();
    expect(out.used_lease_ids).toEqual(["lease-claude-1"]);
  });

  it("after expiry the lane holds no lease and both ids remain", () => {
    const out = run(THROUGH_EXPIRY);
    expect(statusOf(out, 7)?.status).toBe("applied");
    expect(out.lane?.state).toBe("lease-expired");
    expect(out.lane?.lease).toBeNull();
    expect(out.lane?.last_lease_role).toBe("implementer");
    expect(out.used_lease_ids).toEqual(["lease-claude-1", "lease-claude-2"]);
  });

  it("after requeue the lane is ready to work again, with both ids still spent", () => {
    // This is the exact state a returning worker reads: no lease to inherit,
    // and a history saying which ids it may never claim.
    const out = run(THROUGH_REQUEUE);
    expect(statusOf(out, 8)?.status).toBe("applied");
    expect(out.lane?.state).toBe("ready-for-claude");
    expect(out.lane?.lease).toBeNull();
    expect(out.used_lease_ids).toEqual(["lease-claude-1", "lease-claude-2"]);
  });

  it("no lease-clearing transition ever shrinks the history", () => {
    // Monotonic across the whole stream: each prefix's history is a prefix of
    // the next, through release, expiry, requeue and three refusals.
    const histories = [3, 5, 7, 8, 14].map((n) => [...(run(STREAM.slice(0, n)).used_lease_ids ?? [])]);
    histories.reduce((earlier, later) => {
      expect(later.slice(0, earlier.length)).toEqual(earlier);
      expect(later.length).toBeGreaterThanOrEqual(earlier.length);
      return later;
    });
    expect(histories.at(-1)).toEqual(APPLIED_LEASE_IDS);
  });
});

// =============================================================================
// P3 — REFUSED ACQUISITIONS ARE EXCLUDED (both refusal routes).
// =============================================================================
describe("P3 — a refused acquisition consumes nothing", () => {
  it("a REDUCER-refused acquisition (lease-expiry-unbounded) is absent", () => {
    const out = run(STREAM);
    expect(statusOf(out, 9)).toMatchObject({ status: "refused", refusal: "lease-expiry-unbounded" });
    expect(out.used_lease_ids).not.toContain("lease-claude-unbounded");
  });

  it("a PRE-REDUCE-refused acquisition (forged identity) is absent", () => {
    // reduce() is never called for comment 11: identity binding refuses it in
    // reconstruction itself. A projection built by scanning event bodies for
    // lease ids would have admitted a stranger's claim here.
    const out = run(STREAM);
    expect(statusOf(out, 11)).toMatchObject({ status: "refused", refusal: "actor-identity-mismatch" });
    expect(out.used_lease_ids).not.toContain("lease-stranger");
  });

  it("no refused id appears anywhere in the projected history", () => {
    const out = run(STREAM);
    for (const id of REFUSED_LEASE_IDS) expect(out.used_lease_ids, id).not.toContain(id);
    expect(out.used_lease_ids).toHaveLength(APPLIED_LEASE_IDS.length);
  });

  it("an INVALID policy replays nothing, so it consumes nothing", () => {
    // Invalid policy authorizes NOTHING: every protocol comment is refused
    // before any handling, so no acquisition is ever applied.
    const out = reconstructLane({
      issue_body: genesisBody(),
      comments: STREAM,
      policy: makePolicy({ enabled: "false" }),
      context: { now: NOW },
    });
    expect(out.frozen).toBe(true);
    expect(out.dispositions.every((d: any) => d.refusal === "policy-invalid")).toBe(true);
    expect(out.used_lease_ids).toEqual([]);
  });

  it("caller-supplied context can never inject lease history", () => {
    // input.context is accepted and ignored. A caller pre-seeding consumed ids
    // must not be able to manufacture (or launder) a lease history.
    const out = run(THROUGH_REQUEUE, {
      context: { now: NOW, used_lease_ids: ["lease-injected", "lease-claude-9"] },
    });
    expect(out.used_lease_ids).toEqual(["lease-claude-1", "lease-claude-2"]);
  });
});

// =============================================================================
// P4 — ONE AUTHORITATIVE FACT DRIVES BOTH THE REDUCER AND THE PROJECTION.
// =============================================================================
describe("P4 — reducer refusal and projection read the same reconstruction-owned history", () => {
  it("the reused id is refused lease-id-reused and projected exactly once", () => {
    const out = run(STREAM);
    // Comment 4 established the id; comment 10 tried to claim it again after
    // release, expiry and requeue had all intervened.
    expect(statusOf(out, 4)?.status).toBe("applied");
    expect(statusOf(out, 10)).toMatchObject({
      status: "refused",
      refusal: "lease-id-reused",
      detail: "lease_id lease-claude-1 was already used in this lane",
    });
    expect(out.used_lease_ids?.filter((id) => id === "lease-claude-1")).toHaveLength(1);
  });

  // ---------------------------------------------------------------------------
  // THE COUNTERFACTUAL PAIR — TWO VALID HISTORIES.
  //
  // The causal claim is: PRIOR AUTHORITATIVE CONSUMPTION of candidate id X is
  // what makes a later, otherwise-valid acquisition of X refuse
  // `lease-id-reused`. Proving that needs two histories that are each valid all
  // the way to the candidate event, so the candidate is actually adjudicated
  // against lease history in both.
  //
  // Deleting an establishing grant from a finished history does NOT do this:
  // every later event keeps its original sequence, so replay refuses
  // stale-sequence from the hole onwards and the candidate never reaches the
  // reuse check at all. A test built that way passes because
  // stale-sequence != lease-id-reused, which is a statement about two refusal
  // codes, not about lease history.
  //
  // So both histories are built by ONE builder whose only parameter is which
  // lease id the earlier applied grant consumed. Same six durable comments, same
  // sequences 1..5, same authors, same observation times, same expiries, same
  // bound coordinator packet, same event ids — and literally the SAME candidate
  // comment object in both. The lane entering the candidate event is therefore
  // identical (asserted below); the ONLY thing that differs is the projected
  // lease history.
  // ---------------------------------------------------------------------------
  const CANDIDATE_ID = "lease-candidate";
  const OTHER_ID = "lease-other";

  /** The one candidate acquisition, judged against both histories. */
  const CANDIDATE_ACQUISITION = acquireImplementer(6, {
    sequence: 5, lease_id: CANDIDATE_ID, event_id: "evt-p4-candidate",
  });

  /** Activation, coordinator packet, an APPLIED grant of `priorLeaseId`, its
   *  voluntary release, then the candidate acquisition of CANDIDATE_ID. */
  function historyWithPriorGrantOf(priorLeaseId: string) {
    return [
      // 1..3 — the same activation and packet prelude the stream uses.
      ...STREAM.slice(0, 3),
      // 4 — the earlier APPLIED acquisition. The ONE varying fact.
      acquireImplementer(4, { sequence: 3, lease_id: priorLeaseId, event_id: "evt-p4-prior-grant" }),
      // 5 — released, so the lane holds no lease when the candidate arrives and
      // `lease-already-held` cannot be what decides it.
      comment(5, "claude-login", MARKERS.event, makeEvent({
        event_id: "evt-p4-prior-release",
        sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_released", prior_state: "claude-working",
        lease_id: priorLeaseId,
      })),
      // 6 — the candidate.
      CANDIDATE_ACQUISITION,
    ];
  }

  /** HISTORY A — the candidate id WAS consumed by the earlier applied grant. */
  const CONSUMED_HISTORY = historyWithPriorGrantOf(CANDIDATE_ID);
  /** HISTORY B — identical, except the earlier grant consumed a different id. */
  const FRESH_HISTORY = historyWithPriorGrantOf(OTHER_ID);

  /** Every refused disposition, for the "nothing else was refused" checks. */
  function refusals(out: any) {
    return out.dispositions.filter((d: any) => d.status === "refused");
  }

  it("HISTORY A is valid up to the candidate: no stale-sequence, nothing else refused", () => {
    const out = run(CONSUMED_HISTORY);
    expect(out.ok).toBe(true);
    // Comment 2 is the packet artifact (no event); 1, 3, 4 and 5 are events and
    // every one of them applied, so the lane reaches the candidate legally.
    for (const id of [1, 3, 4, 5]) expect(statusOf(out, id)?.status, `comment ${id}`).toBe("applied");
    expect(refusals(out).map((d: any) => d.comment_id)).toEqual([6]);
    expect(out.dispositions.some((d: any) => d.refusal === "stale-sequence")).toBe(false);
  });

  it("HISTORY A refuses the candidate exactly lease-id-reused, having reached the reuse check", () => {
    const out = run(CONSUMED_HISTORY);
    // The earlier grant consumed the id …
    expect(statusOf(out, 4)?.status).toBe("applied");
    // … and the same id, proposed again by an otherwise-valid acquisition, is
    // refused by the reducer's historical-consumption rule itself — a refusal
    // only reachable INSIDE the lease_acquired case, after sequencing,
    // prior-state, lane-lease and identity checks have all passed.
    expect(statusOf(out, 6)).toMatchObject({
      status: "refused",
      refusal: "lease-id-reused",
      detail: `lease_id ${CANDIDATE_ID} was already used in this lane`,
    });
    expect(statusOf(out, 6)?.refusal).not.toBe("stale-sequence");
    // Consumed once, by the one acquisition that was applied.
    expect(out.used_lease_ids?.filter((id) => id === CANDIDATE_ID)).toHaveLength(1);
    expect(out.used_lease_ids).toEqual([CANDIDATE_ID]);
  });

  it("HISTORY B is equally valid and APPLIES the very same candidate acquisition", () => {
    const out = run(FRESH_HISTORY);
    expect(out.ok).toBe(true);
    // Valid sequencing throughout, and no refusal anywhere: the candidate is not
    // rescued by a repair, it is simply legal.
    expect(refusals(out)).toEqual([]);
    expect(out.dispositions.some((d: any) => d.refusal === "stale-sequence")).toBe(false);
    expect(statusOf(out, 6)?.status).toBe("applied");
    expect(statusOf(out, 6)?.refusal).toBeUndefined();
    // The candidate now holds the lane's lease, and its id is in the history the
    // next reader gets.
    expect(out.lane?.state).toBe("claude-working");
    expect(out.lane?.lease?.lease_id).toBe(CANDIDATE_ID);
    expect(out.used_lease_ids).toEqual([OTHER_ID, CANDIDATE_ID]);
  });

  it("the deciding fact is prior consumption of the candidate id, nothing else", () => {
    // ONE durable candidate event, not two lookalikes.
    expect(CONSUMED_HISTORY.at(-1)).toBe(FRESH_HISTORY.at(-1));
    expect(CONSUMED_HISTORY).toHaveLength(FRESH_HISTORY.length);

    // The lane the candidate is reduced against is IDENTICAL in both histories:
    // same state, same event_sequence, same attempt, same (null) lease, same
    // last_transition. So no sequence, state, actor, expiry or policy difference
    // is available to explain the two outcomes.
    const beforeConsumed = run(CONSUMED_HISTORY.slice(0, 5));
    const beforeFresh = run(FRESH_HISTORY.slice(0, 5));
    expect(beforeFresh.lane).toEqual(beforeConsumed.lane);
    expect(beforeConsumed.lane?.state).toBe("ready-for-claude");
    expect(beforeConsumed.lane?.lease).toBeNull();
    expect(beforeConsumed.lane?.event_sequence).toBe(4);
    expect(beforeFresh.dispositions).toEqual(beforeConsumed.dispositions);

    // The one difference at that point is the projected lease history: the
    // candidate id is consumed in A and fresh in B.
    expect(beforeConsumed.used_lease_ids).toEqual([CANDIDATE_ID]);
    expect(beforeFresh.used_lease_ids).toEqual([OTHER_ID]);
    expect(beforeFresh.used_lease_ids).not.toContain(CANDIDATE_ID);

    // And that difference alone flips the candidate's disposition, in the
    // direction the projection predicts. Two readings of ONE fact; a second,
    // competing lease-history resolver could disagree here, and this is where it
    // would show.
    const consumed = run(CONSUMED_HISTORY);
    const fresh = run(FRESH_HISTORY);
    expect(statusOf(consumed, 6)?.refusal).toBe("lease-id-reused");
    expect(statusOf(fresh, 6)?.refusal).not.toBe("lease-id-reused");
    expect(statusOf(fresh, 6)?.status).toBe("applied");
    // In each history the candidate id is consumed exactly once, and by the one
    // acquisition of it that APPLIED — comment 4 in A, comment 6 in B. A's
    // refused acquisition of the same id added nothing to the history it was
    // refused against.
    expect(consumed.used_lease_ids?.filter((id) => id === CANDIDATE_ID)).toHaveLength(1);
    expect(fresh.used_lease_ids?.filter((id) => id === CANDIDATE_ID)).toHaveLength(1);
    expect(statusOf(consumed, 4)?.status).toBe("applied");
    expect(statusOf(fresh, 6)?.status).toBe("applied");
  });

  it("the refusal is decided against history, not against the lane's current lease", () => {
    const out = run(STREAM);
    // At comment 10 the lane held NO lease at all (requeued), and the id being
    // claimed belonged to a lease released four events earlier. Only the
    // historical set can refuse this, which is the set being projected.
    expect(run(THROUGH_REQUEUE).lane?.lease).toBeNull();
    expect(statusOf(out, 10)?.refusal).toBe("lease-id-reused");
    expect(out.lane?.lease?.lease_id).not.toBe("lease-claude-1");
    expect(out.used_lease_ids).toContain("lease-claude-1");
  });

  it("is deterministic: two reconstructions project identical history", () => {
    const a = run(STREAM);
    const b = run(STREAM);
    expect(a.used_lease_ids).toEqual(b.used_lease_ids);
  });
});

// =============================================================================
// P5 — THE RETURNED PROJECTION IS IMMUTABLE AND DETACHED.
// =============================================================================
describe("P5 — a consumer cannot mutate the reducer's lease history", () => {
  it("the returned array is frozen", () => {
    expect(Object.isFrozen(run(STREAM).used_lease_ids)).toBe(true);
  });

  it("every mutation attempt throws and leaves the projection intact", () => {
    const out = run(STREAM);
    const history = out.used_lease_ids as string[];
    expect(() => history.push("lease-injected")).toThrow(TypeError);
    expect(() => history.pop()).toThrow(TypeError);
    expect(() => { (history as any)[0] = "lease-swapped"; }).toThrow(TypeError);
    expect(history).toEqual(APPLIED_LEASE_IDS);
  });

  it("a mutation attempt cannot alter a later reconstruction or its reuse refusal", () => {
    const first = run(STREAM);
    try { (first.used_lease_ids as string[]).push("lease-injected"); } catch { /* frozen */ }
    try { delete (first.used_lease_ids as any)[0]; } catch { /* frozen */ }

    const second = run(STREAM);
    expect(second.used_lease_ids).toEqual(APPLIED_LEASE_IDS);
    expect(second.used_lease_ids).not.toContain("lease-injected");
    // The reducer's own decision is untouched: the reuse is still refused, and
    // the id whose entry a consumer tried to delete is still consumed.
    expect(statusOf(second, 10)?.refusal).toBe("lease-id-reused");
    expect(second.used_lease_ids).toContain("lease-claude-1");
  });

  it("each reconstruction returns its OWN copy, never a shared live object", () => {
    const a = run(STREAM);
    const b = run(STREAM);
    expect(a.used_lease_ids).not.toBe(b.used_lease_ids);
    expect(a.used_lease_ids).toEqual(b.used_lease_ids);
    // An array, not the live Set: a Set would hand out mutable protocol state.
    expect(Array.isArray(a.used_lease_ids)).toBe(true);
  });

  it("adding the projection changes no other part of the result", () => {
    // Same durable input, same governed outputs: lane, lease, dispositions and
    // labels are what they were before the projection existed.
    const out = run(STREAM);
    expect(out.lane?.state).toBe("codex-working");
    expect(out.lane?.event_sequence).toBe(10);
    expect(out.lane?.attempt).toBe(3);
    expect(out.lane?.lease?.holder_login).toBe("codex-login");
    expect(out.labels).toEqual(["cp-lane", "cp-state:codex-working", "cp-next:auditor"]);
    // Thirteen event comments (comment 2 is an artifact, not a transition):
    // seven applied, the three refused acquisitions, then three applied.
    expect(out.dispositions.map((d: any) => d.status)).toEqual([
      "applied", "applied", "applied", "applied", "applied", "applied", "applied",
      "refused", "refused", "refused", "applied", "applied", "applied",
    ]);
  });
});

// =============================================================================
// P6 — THE PROJECTION ALONE ANSWERS THE CONSUMER'S FRESHNESS QUESTION.
// =============================================================================
describe("P6 — a consumer decides lease-id freshness from the result alone", () => {
  /**
   * The WHOLE consumer. It reads one field of the reconstruction result: no
   * comment parsing, no event-body parsing, no disposition inference, no
   * knowledge of release/expiry/requeue semantics.
   */
  function alreadyConsumed(result: any, candidate: string): boolean {
    const history = result.used_lease_ids;
    if (!Array.isArray(history)) throw new Error("reconstruction exposed no lease history");
    return history.includes(candidate);
  }

  it("answers correctly for consumed and fresh candidates", () => {
    const out = run(STREAM);
    for (const id of APPLIED_LEASE_IDS) expect(alreadyConsumed(out, id), id).toBe(true);
    for (const id of REFUSED_LEASE_IDS) expect(alreadyConsumed(out, id), id).toBe(false);
    expect(alreadyConsumed(out, "lease-claude-9")).toBe(false);
  });

  it("its verdict predicts the reducer's: fresh applies, consumed is refused", () => {
    // The consumer reads a lane that is ready for it to work (requeued, no
    // lease held), picks an id its own check calls fresh, and posts. Then the
    // same check calls another id consumed, and posting that one is refused.
    const before = run(THROUGH_REQUEUE);
    expect(before.lane?.state).toBe("ready-for-claude");
    expect(before.lane?.lease).toBeNull();

    const fresh = "lease-claude-4";
    const consumed = "lease-claude-2";
    expect(alreadyConsumed(before, fresh)).toBe(false);
    expect(alreadyConsumed(before, consumed)).toBe(true);

    const acquireFresh = run([...THROUGH_REQUEUE, acquireImplementer(20, {
      sequence: 8, lease_id: fresh, lease_expires_at: POST_REQUEUE_EXPIRY, created_at: AFTER_EXPIRY,
    })]);
    expect(statusOf(acquireFresh, 20)?.status).toBe("applied");
    expect(acquireFresh.lane?.lease?.lease_id).toBe(fresh);
    // And the freshly consumed id is now in the history the next consumer reads.
    expect(acquireFresh.used_lease_ids).toEqual([...APPLIED_LEASE_IDS.slice(0, 2), fresh]);

    const acquireConsumed = run([...THROUGH_REQUEUE, acquireImplementer(20, {
      sequence: 8, lease_id: consumed, lease_expires_at: POST_REQUEUE_EXPIRY, created_at: AFTER_EXPIRY,
    })]);
    expect(statusOf(acquireConsumed, 20)).toMatchObject({
      status: "refused", refusal: "lease-id-reused",
    });
    expect(acquireConsumed.lane?.lease).toBeNull();
  });
});

// =============================================================================
// SOURCE INVARIANT (secondary): ONE accumulator, written in ONE place.
//
// Not the semantic proof — the behaviour above is. This only pins the shape the
// operator authorized: the projection must keep reading the reducer's own
// accumulator rather than growing a second one that could drift.
// =============================================================================
describe("the projection reads one accumulator, written in exactly one place", () => {
  // Blank comments so the scan reads what the file DOES, not what it says about
  // itself (same approach as lane-history-golden.test.ts).
  function executableText(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((l) => (l.trim().startsWith("//") ? "" : l.replace(/^([^"'`/]*)\/\/.*$/, "$1")))
      .join("\n");
  }

  const code = executableText(readFileSync(".straylight/lib/reconstruct.mjs", "utf8"));

  it("declares the accumulator once and adds to it once", () => {
    expect(code.match(/const usedLeaseIds = new Set\(\)/g) ?? []).toHaveLength(1);
    expect(code.match(/usedLeaseIds\.add\(/g) ?? []).toHaveLength(1);
  });

  it("hands the SAME accumulator to the reducer and to the projection", () => {
    expect(code.match(/used_lease_ids: usedLeaseIds,/g) ?? []).toHaveLength(1);
    expect(code.match(/used_lease_ids: Object\.freeze\(\[\.\.\.usedLeaseIds\]\)/g) ?? []).toHaveLength(1);
  });
});
