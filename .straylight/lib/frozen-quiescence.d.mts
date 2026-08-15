// Type surface for tests/tooling. Runtime source of truth: frozen-quiescence.mjs
//
// Frozen-write quiescence: the closed set of workflows that can reach the write
// executor, and the evidence that none of their runs was in flight when a durable
// event frontier was captured under a committed freeze.

export declare const QUIESCENCE_SCHEMA: "straylight.frozen-write-quiescence.v1";
export declare const WRITE_EXECUTOR_ENTRYPOINT: "execute-write-plan.mjs";
export declare const TERMINAL_RUN_STATUS: "completed";
/** The frozen revision's shape. Pinned by a test to write-authority's MAIN_SHA_RE. */
export declare const FROZEN_MAIN_SHA_RE: RegExp;
export declare const QUIESCENCE_KEYS: readonly string[];
export declare const FRONTIER_QUIESCENCE_KEYS: readonly string[];
export declare const FRONTIER_EVIDENCE_KEY_MAP: {
  readonly frozen_main_sha: "frozen_main_sha";
  readonly checked_at: "quiescence_checked_at";
  readonly write_capable_workflows: "write_capable_workflows";
  readonly active_write_runs: "active_write_runs";
};

export interface ActiveWriteRun {
  workflow: string;
  run_id: number;
  status: string;
  created_at: string;
}

export interface FrozenQuiescence {
  schema: string;
  repository: string;
  frozen_main_sha: string;
  checked_at: string;
  write_capable_workflows: string[];
  active_write_runs: ActiveWriteRun[];
}

/** Blank YAML comments so only the bytes that RUN are scanned. */
export declare function executableYaml(text: string): string;

/** Derive the closed write-capable workflow set from workflow file contents. */
export declare function writeCapableWorkflows(
  files: unknown
): { ok: true; workflows: string[] } | { ok: false; reason: string; detail: string };

/** Only the literal terminal Actions status is terminal. */
export declare function runIsActive(status: unknown): boolean;

export declare function parseWorkflowRunPages(
  text: unknown,
  opts: { workflow_path: string }
): { ok: true; scanned: number; active: ActiveWriteRun[] } | { ok: false; reason: string; detail: string };

/** Shared rules for the four evidence fields, in either document's key naming. */
export declare function quiescenceEvidenceErrors(
  doc: Record<string, unknown>,
  opts: {
    at: string;
    keys: {
      frozen_main_sha: string;
      checked_at: string;
      write_capable_workflows: string;
      active_write_runs: string;
    };
  }
): string[];

export interface QuiescenceValue {
  repository: string;
  frozen_main_sha: string;
  checked_at: string;
  write_capable_workflows: string[];
  active_write_runs: ActiveWriteRun[];
}

export declare function validateFrozenQuiescence(
  doc: unknown
): { ok: true; value: QuiescenceValue } | { ok: false; errors: string[] };

export declare function buildFrozenQuiescence(input: {
  repository: string;
  frozen_main_sha: string;
  checked_at: string;
  write_capable_workflows: string[];
  active_write_runs: ActiveWriteRun[];
}):
  | { ok: true; document: FrozenQuiescence; value: QuiescenceValue }
  | { ok: false; errors: string[]; document: Record<string, unknown> };
