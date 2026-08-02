// Type declarations for `workflow-trigger-parser.mjs`.
//
// The module is plain ESM JavaScript so the proof suites can consume it without a
// build step. Same convention as `proof-input-manifest.d.mts`.

/** One recovered scalar, with the byte offset it was read from. */
export interface ParsedPath {
  /** The path exactly as declared — always a substring of the input bytes. */
  value: string;
  /** Byte offset of the line the scalar came from, so provenance is verifiable. */
  offset: number;
}

export interface ParsedTriggers {
  ok: true;
  /** `on.pull_request.paths`, in declaration order, each with its byte offset. */
  pullRequestPaths: ParsedPath[];
  /** `on.workflow_dispatch`: present, plus any declared input names. */
  workflowDispatch: { present: true; inputs: string[] };
}

export interface ParseFailure {
  ok: false;
  /** A stable machine-readable reason. */
  reason: string;
  /** Human-readable detail. Never caller-supplied content beyond the document. */
  detail: string;
}

/**
 * Parse `on.pull_request.paths` and `on.workflow_dispatch` from a workflow's raw
 * bytes, by BOUNDED STRUCTURAL analysis rather than a fixed text offset.
 *
 * FAILS CLOSED on an absent block, an unterminated block, an unexpected dedent, a
 * nested key where a scalar was required, an unrecognized list-item shape, a
 * duplicate key, a tab-indented line, an empty document, or an oversized one — it
 * never returns a narrower or wider set silently.
 */
export declare function parseWorkflowTriggers(text: string): ParsedTriggers | ParseFailure;
