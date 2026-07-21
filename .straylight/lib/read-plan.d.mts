// Type surface for tests/tooling. Runtime source of truth: read-plan.mjs
//
// The workflow boundary's READ half: closed read-plan documents (the
// read-kind registry constructs every GET and every target file name — a
// plan can express no method, path, URL, or filename), the probe's
// fetch-slot-claim contract (digest-bound to the exact base evidence,
// never write authority), and the gather read-ledger the read executor
// alone writes.

export declare const READ_PLAN_SCHEMA: "straylight.read-plan.v1";
export declare const FETCH_SLOT_CLAIM_SCHEMA: "straylight.fetch-slot-claim.v1";

export interface ReadPlanFailure {
  ok: false;
  reason: string;
  detail?: string;
}

export interface ReadKindSpec {
  scope: "collection" | "gathers";
  /** Fatal reads abort the executor (exit 4) with NO ledger row; non-fatal
   *  failures are durable {fetched:false} rows. */
  fatal: boolean;
  fields: readonly string[];
}

export declare const READ_KINDS: Readonly<Record<string, ReadKindSpec>>;

export interface ReadPlanRead {
  kind: string;
  issue_number?: number;
  pr_number?: number;
}

export declare function validateReadPlan(
  plan: unknown,
  expectations: { repository: string; nonce: string }
):
  | { ok: true; reads: ReadPlanRead[]; scope: "collection" | "gathers" | null; collection_id?: "A" | "B" }
  | { ok: false; errors: Array<{ code: string; detail?: string }> };

export declare function checkConstructedReadPath(
  path: string
): { code: string; detail?: string } | null;

export interface FetchSlotClaim {
  schema: typeof FETCH_SLOT_CLAIM_SCHEMA;
  nonce: string;
  repository: string;
  issue_number: number;
  lane_id: string;
  state: string;
  pr_number: number | null;
  checks: boolean;
  sources: {
    gather_1: { enumeration_sha256: string; issue_sha256: string; comments_sha256: string };
    gather_2: { enumeration_sha256: string; issue_sha256: string; comments_sha256: string };
  };
}

export declare function parseClaim(
  text: string,
  expectations: { repository: string; nonce: string; issue_number: number }
): { ok: true; claim: FetchSlotClaim } | ReadPlanFailure;

export declare function slotFileName(slot: "pr" | "check-runs" | "status"): string;

export interface ReadLedgerRow {
  nonce: string;
  gather: 1 | 2;
  slot: "pr" | "check-runs" | "status";
  pr_number: number;
  /** check-runs/status rows carry the bound head sha when fetched. */
  sha?: string;
  fetched: boolean;
  path?: string;
  sha256?: string;
}

export declare function parseReadLedger(
  text: string,
  expectations: { nonce: string }
): { ok: true; rows: ReadLedgerRow[] } | ReadPlanFailure;

export declare function checkLedgerAgainstClaim(
  rows: ReadLedgerRow[],
  claim: FetchSlotClaim
): { ok: true } | ReadPlanFailure;
