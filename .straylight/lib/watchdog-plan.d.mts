// Type surface for tests/tooling. Runtime source of truth: watchdog-plan.mjs
//
// Final dual-collection watchdog planning: independent per-collection
// re-verification (trusting nothing derived earlier), canonical A/B
// comparison (any planning-relevant difference refuses with its ab-*
// code), then issue-keyed planning (C8) with dedupe proofs from the
// compared comment evidence and at most one state-advancing event per
// issue per plan, positioned after that issue's findings (§10).

export interface WatchdogPlanFailure {
  ok: false;
  reason: string;
  detail?: string;
}

export interface PlanBodyFile {
  /** Single safe path component under the request root. */
  name: string;
  /** The exact bytes the executor will hash, validate, and retain. */
  content: string;
}

export interface WatchdogPlanResult {
  ok: true;
  /** True → nothing to post; the caller uses exit 3 (valid empty sweep). */
  empty: boolean;
  plan: Record<string, unknown>;
  bodies: PlanBodyFile[];
  projection_digest: string;
}

export declare function sha256OfText(text: string): string;

/**
 * True only when a github-actions[bot]-authored comment carrying a
 * straylight machine marker contains the EXACT full-line dedupe identity.
 */
export declare function dedupeAlreadyPosted(
  comments: Array<{ user: string; body: string }>,
  dedupeKey: string
): boolean;

export declare function planWatchdogWrites(options: {
  collections: {
    A: { ledgerText: string; manifestText: string; readFile: (p: string) => Buffer | null };
    B: { ledgerText: string; manifestText: string; readFile: (p: string) => Buffer | null };
  };
  nonce: string;
  repository: string;
  policy: unknown;
  now: string;
  /** Exact commit the sweep ran at; half the plan's H-02 authority binding. */
  source_main_sha: string;
}): WatchdogPlanResult | WatchdogPlanFailure;
