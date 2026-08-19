// Type surface for tests/tooling. Runtime source of truth: durable-frontier.mjs
import type { ActiveWriteRun } from "./frozen-quiescence.mjs";

export declare const FRONTIER_SCHEMA: "straylight.durable-event-frontier.v1";

/** One cp-lane as observed by a read-only capture. */
export interface DurableFrontierLane {
  issue_number: number;
  lane_id: string;
  /** null iff event_count is 0. */
  last_event_comment_id: number | null;
  /** Authenticated GitHub created_at; null iff event_count is 0. */
  last_event_created_at: string | null;
  event_count: number;
}

export interface DurableFrontier {
  schema: "straylight.durable-event-frontier.v1";
  repository: string;
  /** The frozen main the capture was gathered against (full 40-hex commit). */
  frozen_main_sha: string;
  captured_at: string;
  /** When frozen-write quiescence was verified; must not be after captured_at. */
  quiescence_checked_at: string;
  /** Closed set of workflows able to reach the write executor; sorted. */
  write_capable_workflows: string[];
  /** Must be empty for an admissible append frontier. */
  active_write_runs: ActiveWriteRun[];
  lanes: DurableFrontierLane[];
  /** Legibility aid; always recomputed from `lanes`, never trusted. */
  max_event_created_at: string | null;
}

export interface DurableFrontierBound {
  repository: string;
  frozen_main_sha: string;
  captured_at: string;
  quiescence_checked_at: string;
  write_capable_workflows: string[];
  lane_count: number;
  event_count: number;
  /** Derived global maximum authenticated event time. */
  max_event_created_at: string;
  max_millis: number;
  /**
   * Canonical content digest of the whole supplied document, `sha256:<64 hex>`.
   * The frontier's identity: derived, never stored in the file. An appended
   * admission epoch commits this value.
   */
  frontier_digest: string;
}

export type DurableFrontierResult =
  | { ok: true; value: DurableFrontierBound }
  | { ok: false; errors: string[] };

/**
 * Validate a supplied frontier and report the bound derived from its lane
 * entries. Pure: no files, no clock, no network. Cannot prove that lane
 * discovery was complete — that is provenance supplied at authorization time.
 */
export declare function validateDurableFrontier(frontier: unknown): DurableFrontierResult;

export type DurableFrontierBuildResult =
  | { ok: true; frontier: DurableFrontier; value: DurableFrontierBound }
  | { ok: false; errors: string[] };

/**
 * Assemble a frontier from captured lane entries, deriving the global maximum
 * mechanically and validating the result before returning it.
 */
export declare function buildDurableFrontier(input: {
  repository: unknown;
  frozen_main_sha: unknown;
  captured_at: unknown;
  quiescence_checked_at: unknown;
  write_capable_workflows: unknown;
  active_write_runs: unknown;
  lanes: unknown;
}): DurableFrontierBuildResult;
