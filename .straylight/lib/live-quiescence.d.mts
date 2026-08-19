// Type surface for tests/tooling. Runtime source of truth: live-quiescence.mjs
//
// The LIVE quiescence proof: the bounded read-only algorithm that establishes,
// against GitHub, that a named revision is the committed state of main, that the
// policy committed there freezes automation, which workflows at that exact commit
// can reach the write executor, and that none of their runs is in flight.
//
// frozen-quiescence.mjs judges a DOCUMENT; this module produces one by looking.
// Both the verifier CLI and the frontier capture run this same function, so a
// caller-supplied document can never stand in for the proof.

import type { FrozenQuiescence, QuiescenceValue } from "./frozen-quiescence.d.mts";

/** The injected read-only transport. Never throws into the library's logic. */
export type ReadOnlyGet = (
  path: string,
  opts: { paginate: boolean }
) => { ok: true; text: string } | { ok: false; detail?: string };

export type LiveRefusal = { ok: false; reason: string; detail: string };

/** The exact commit main points at right now. */
export declare function readCurrentMainSha(input: {
  repository: string;
  read: ReadOnlyGet;
}): { ok: true; sha: string } | LiveRefusal;

/** Main must BE the frozen revision; `at` names the moment in the diagnostic. */
export declare function requireFrozenMain(input: {
  repository: string;
  frozen_main_sha: string;
  read: ReadOnlyGet;
  at: string;
}): { ok: true; sha: string } | LiveRefusal;

/** The accepted policy committed AT an exact commit, fetched from GitHub. */
export declare function readCommittedPolicyAt(input: {
  repository: string;
  commit_sha: string;
  read: ReadOnlyGet;
}): { ok: true; policy: Record<string, unknown> } | LiveRefusal;

/**
 * The write-capable set derived from the workflow bytes committed AT an exact
 * commit — listing and files at the same `?ref=<sha>`, each file bound to the
 * blob id the listing reported. Never reads the local checkout.
 */
export declare function deriveWriteCapableWorkflowsAt(input: {
  repository: string;
  commit_sha: string;
  read: ReadOnlyGet;
}): { ok: true; workflows: string[]; enumerated: string[] } | LiveRefusal;

/** One complete duplicate-free pass over every write-capable workflow's runs. */
export declare function scanWriteCapableRuns(input: {
  repository: string;
  workflows: string[];
  read: ReadOnlyGet;
  label: string;
}): { ok: true; scanned: number; active: FrozenQuiescence["active_write_runs"] } | LiveRefusal;

/** The refusal detail for a non-quiescent observation. Never cancels anything. */
export declare function reportActiveRuns(
  label: string,
  active: FrozenQuiescence["active_write_runs"]
): string;

/** THE LIVE PROOF. Steps 1-10 of the module header, all read-only. */
export declare function proveFrozenQuiescence(input: {
  repository: string;
  frozen_main_sha: string;
  read: ReadOnlyGet;
  now: () => string;
  note?: (message: string) => void;
}):
  | { ok: true; document: FrozenQuiescence; value: QuiescenceValue; scans: { first: number; second: number } }
  | LiveRefusal;

/**
 * Compare an operator RECEIPT against a proof the operation performed itself.
 * Agreement grants nothing; disagreement is a refusal.
 */
export declare function receiptAgreesWithProof(
  receipt: QuiescenceValue,
  proof: QuiescenceValue,
  opts: { repository: string; frozen_main_sha: string }
): { ok: true } | LiveRefusal;
