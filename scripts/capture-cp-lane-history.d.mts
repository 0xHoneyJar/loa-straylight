// Type surface for tests. Runtime source of truth: capture-cp-lane-history.mjs
//
// Importing this module is side-effect-free: `main()` runs only when the script
// is invoked directly, so a test may import the pure helpers without any
// network access or file writes.

/**
 * The wall clock pinned when the committed lane-history evidence was first
 * captured, recorded in each baseline as provenance. It is NOT a reconstruction
 * input — `reconstructLane` takes no clock and reads every event's admission
 * time from the authenticated comment `created_at`.
 */
export declare const FIXTURE_REPLAY_NOW: string;

/** Rebuild a comment/issue body from captured payloads, in fixed marker order. */
export declare function renderCapturedBody(payloads: Record<string, unknown>): string;

/** Turn a captured lane fixture into `reconstructLane` input. */
export declare function fixtureToInput(fixture: any): {
  issue_body: string;
  comments: Array<{
    id: number;
    user: string;
    created_at: string;
    updated_at: string;
    body: string;
  }>;
};
