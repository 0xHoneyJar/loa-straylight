// Type surface for tests. Runtime source of truth: capture-durable-frontier.mjs
//
// Importing this module is side-effect-free: `main()` runs only when the script
// is invoked directly, so a test may import the pure helpers without any network
// access or file writes.

import type { DurableFrontierBuildResult, DurableFrontierLane } from "../.straylight/lib/durable-frontier.d.mts";
import type { ActiveWriteRun } from "../.straylight/lib/frozen-quiescence.d.mts";

/** A captured lane comment stream, as `parseCommentPages` returns it. */
export interface CapturedLaneComments {
  issue_number: number;
  lane_id: string;
  comments: Array<{ id: number; user: string; created_at: string; updated_at: string; body: string }>;
}

/**
 * Reduce one lane's comments to its frontier entry. PURE: no network, no clock.
 * An ambiguous or unreadable event comment is a refusal, never an omission.
 */
export declare function laneFrontierEntry(lane: {
  issue_number: number;
  lane_id: string;
  comments: unknown;
}): { ok: true; entry: DurableFrontierLane } | { ok: false; reason: string };

/**
 * Assemble a frontier from already-captured lane comment streams and the
 * frozen-write quiescence evidence the capture ran under. PURE.
 */
export declare function frontierFromCapture(input: {
  repository: string;
  frozen_main_sha: string;
  captured_at: string;
  quiescence_checked_at: string;
  write_capable_workflows: string[];
  active_write_runs: ActiveWriteRun[];
  lanes: CapturedLaneComments[];
}): DurableFrontierBuildResult;
