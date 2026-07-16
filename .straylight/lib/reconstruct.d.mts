// Type surface for tests/tooling. Runtime source of truth: reconstruct.mjs
export interface ReconstructInput {
  issue_body: string;
  comments: Array<{ id: number; user: string; body: string; created_at?: string; updated_at?: string }>;
  policy: Record<string, any>;
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
   * True when the kill switch is engaged (policy.enabled !== true) or the
   * policy is unusable. History is replayed faithfully (freeze, not rewind);
   * consumers must take no NEW action while frozen. Undefined only on the
   * early error returns before replay.
   */
  frozen?: boolean;
}
export declare function reconstructLane(input: ReconstructInput): ReconstructResult;
export declare function deriveLabels(lane: Record<string, any>): string[];
