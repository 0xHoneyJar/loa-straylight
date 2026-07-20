// Type surface for tests/tooling. Runtime source of truth: lane-target.mjs
//
// Universal lane-target authority (N3): every lane-addressed write proves,
// from same-execution evidence, that its lane_id maps to exactly one issue.
// Duplicate valid lane IDs refuse for every writer (C1); unreadable
// marker-bearing bodies block both targeting and absence proofs.

export declare const LANE_ID_RE: RegExp;

export interface ScannedLane {
  number: number;
  lane_id: string;
}

export interface LaneDuplicate {
  lane_id: string;
  numbers: number[];
}

export interface UnreadableLane {
  number: number;
  reason: string;
}

export interface ScanLanesResult {
  ok: true;
  lanes: ScannedLane[];
  duplicates: LaneDuplicate[];
  unreadable: UnreadableLane[];
}

export interface LaneTargetFailure {
  ok: false;
  reason: string;
  detail?: string;
  numbers?: number[];
}

export declare function scanLanes(
  issues: Array<{ number: number; body: string | null }>
): ScanLanesResult | LaneTargetFailure;

export declare function assertUniqueLaneTarget(
  issues: Array<{ number: number; body: string | null }>,
  lane_id: string,
  options?: { expected_issue?: number | null }
): { ok: true; issue_number: number } | LaneTargetFailure;

export declare function assertLaneAbsent(
  issues: Array<{ number: number; body: string | null }>,
  lane_id: string
):
  | { ok: true; absent: true }
  | { ok: true; absent: false; numbers: number[] }
  | LaneTargetFailure;
