// Type surface for tests/tooling. Runtime source of truth: reconstruct.mjs
export interface ReconstructInput {
  issue_body: string;
  comments: Array<{ id: number; user: string; body: string; created_at?: string; updated_at?: string }>;
  policy: Record<string, any>;
  /**
   * ACCEPTED AND IGNORED. Reconstruction is a pure function of the durable
   * content and takes NO wall clock: each event's authoritative time is the
   * authenticated comment.created_at, and the reducer context is built from
   * the durable comment alone, so nothing here can supply or override an
   * observation time. Live PR facts likewise reach the protocol only as
   * durable fields of system.eligibility_confirmed events.
   */
  context?: Record<string, any>;
}
export interface Disposition {
  comment_id: number;
  status: "applied" | "refused";
  refusal?: string;
  detail?: string;
}
/**
 * Provenance of the current task packet: the durable comment the packet was
 * bound from, and that comment's AUTHENTICATED author. Produced by
 * reconstruction's own artifact binding — never supplied by a caller.
 */
export interface TaskPacketSource {
  comment_id: number;
  author: string;
}
export interface ReconstructResult {
  ok: boolean;
  refusal?: string;
  detail?: string;
  lane: Record<string, any> | null;
  dispositions: Disposition[];
  labels: string[];
  /**
   * True whenever the policy did not validate as enabled (boolean true).
   * Two distinct causes, with distinct semantics:
   *
   * - STRUCTURALLY VALID policy with the boolean kill switch engaged
   *   (enabled === false): history is replayed faithfully under a
   *   validated replay-only copy (freeze, not rewind). The frozen
   *   projection is a faithful reading of the durable record, but it
   *   authorizes NO new workflow action.
   *
   * - INVALID policy (enabled as a string / null / number / array /
   *   object / missing, or any other structural failure): FAIL CLOSED.
   *   Nothing is replayed as authoritative — every protocol comment is
   *   refused as policy-invalid before ANY handling (including
   *   edited-comment routing) can change lane state, the lane stays at
   *   its genesis state and event sequence, and the result authorizes no
   *   reconstruction-side state change and no workflow mutation.
   *
   * Undefined only on the early error returns before replay.
   */
  frozen?: boolean;
  /**
   * The lane's CURRENT task packet, as ESTABLISHED BY THIS REPLAY.
   *
   * This is a projection of the packet binding reconstruction already
   * performed, not a second resolver: it is the exact packet value the replay
   * bound from the durable stream and handed to the reducer for the most recent
   * coordinator packet event the reducer ACCEPTED
   * (`coordinator.task_packet_posted` or `coordinator.patch_packet_posted`) —
   * the same value that governed every downstream event in the same replay. A
   * later applied patch packet supersedes an earlier initial one.
   *
   * `null` when no coordinator-approved packet has been established. A packet
   * comment that merely EXISTS never appears here: an event that was refused
   * for any reason (malformed, wrong lane, forward/foreign reference,
   * digest-mismatched, wrong author, edited comment, out of turn, invalid
   * policy) does not move the projection, and the field carries no
   * caller-provided context.
   *
   * NO NEW AUTHORITY. Reading the packet does not authorize implementation,
   * lease acquisition, or any Git/GitHub write; it does not change lane state
   * or task-scope semantics, and it is not a continuation grant.
   *
   * Undefined only on the early error returns before replay.
   */
  task_packet?: Record<string, any> | null;
  /**
   * Provenance of `task_packet`: the binding produced by the SAME replay
   * (durable comment id + authenticated author). `null` exactly when
   * `task_packet` is null — the two always move together.
   *
   * Undefined only on the early error returns before replay.
   */
  task_packet_source?: TaskPacketSource | null;
  /**
   * Every lease id this lane has ALREADY CONSUMED, in replay order.
   *
   * The same authoritative fact the reducer decides `lease-id-reused` against:
   * reconstruction accumulates the lease id of each APPLIED `*.lease_acquired`
   * event and passes that one accumulator to the reducer as
   * `context.used_lease_ids`; this is a frozen copy of it taken at the return
   * boundary. There is no second accumulator, no second scan of the comment
   * stream, and no local re-derivation of the consumption rule — a consumer
   * decides whether a candidate lease id is fresh by testing membership here.
   *
   * Consumption is PERMANENT and role-shared: a released, expired, or requeued
   * lease id remains present (so a stale worker cannot re-match a fresh lease)
   * even when `lane.lease` is null, and implementer and auditor ids occupy one
   * namespace. A refused acquisition — refused by the reducer, or refused
   * before reduction (forged identity, edited comment, invalid policy,
   * unreadable payload, missing observation time) — never appears. Order is the
   * ascending durable comment order the replay used; it is not sorted.
   *
   * FROZEN COPY. Mutating it cannot affect the reducer's live history or a
   * later reconstruction's refusal. Reading it confers NO authority: it grants
   * no lease and changes no lane state, lease validity, or lease-ID policy.
   *
   * Undefined only on the early error returns before replay.
   */
  used_lease_ids?: readonly string[];
}
export declare function reconstructLane(input: ReconstructInput): ReconstructResult;
export declare function deriveLabels(lane: Record<string, any>): string[];
