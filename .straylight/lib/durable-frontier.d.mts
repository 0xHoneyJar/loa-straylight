// Type surface for tests/tooling. Runtime source of truth: durable-frontier.mjs
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
  captured_at: string;
  lanes: DurableFrontierLane[];
  /** Legibility aid; always recomputed from `lanes`, never trusted. */
  max_event_created_at: string | null;
}

export interface DurableFrontierBound {
  repository: string;
  captured_at: string;
  lane_count: number;
  event_count: number;
  /** Derived global maximum authenticated event time. */
  max_event_created_at: string;
  max_millis: number;
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
  captured_at: unknown;
  lanes: unknown;
}): DurableFrontierBuildResult;
