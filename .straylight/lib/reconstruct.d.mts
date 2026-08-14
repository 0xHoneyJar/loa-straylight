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
}
export declare function reconstructLane(input: ReconstructInput): ReconstructResult;
export declare function deriveLabels(lane: Record<string, any>): string[];
