// Type surface for tests/tooling. Runtime source of truth: evidence.mjs
//
// Shared raw-evidence parser: N1 global uniqueness (issue numbers, comment
// IDs, check-run IDs, combined-status IDs unique across the complete
// paginated response), N2 exact-equality target binding (repository /
// issue / PR / exact commit SHA — never substring), N5 timestamp
// chronology (strict parsed instants; updated_at >= created_at). A
// zero-byte stream is invalid; one parsed `[]` page is valid empty
// evidence. Every failure is { ok: false, reason, detail? } — fail closed.

export interface EvidenceFailure {
  ok: false;
  reason: string;
  detail?: string;
}

export type EvidenceResult<T> = ({ ok: true } & T) | EvidenceFailure;

export interface IssueEntry {
  number: number;
  body: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommentEntry {
  id: number;
  user: string;
  body: string;
  created_at: string;
  updated_at: string;
}

/** The ten-field normalized live-PR record (validatePrMetadata shape). */
export interface PrRecord {
  fetch_ok: true;
  repository: string;
  pr_number: number;
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
  base_branch: string;
  base_sha: string;
  head_branch: string;
  head_sha: string;
}

/** Raw --paginate stream → strict-parsed page documents (fail closed). */
export declare function parsePageStream(
  text: string
): EvidenceResult<{ pages: unknown[] }>;

/** Single-document response → strict-parsed top-level object. */
export declare function parseSingleDocument(
  text: string
): EvidenceResult<{ value: Record<string, unknown> }>;

export declare function parseIssuePages(
  text: string,
  options?: { repository?: string | null; requireTimestamps?: boolean }
): EvidenceResult<{ issues: IssueEntry[]; excluded_prs: number[] }>;

export declare function parseIssue(
  text: string,
  expectation: { repository: string; issue_number: number }
): EvidenceResult<{ issue: Required<IssueEntry> }>;

export declare function parseCommentPages(
  text: string,
  expectation: { repository: string; issue_number: number }
): EvidenceResult<{ comments: CommentEntry[] }>;

export declare function parsePr(
  text: string,
  expectation: { repository: string; pr_number: number }
): EvidenceResult<{ pr: PrRecord }>;

export declare function parseLabelPages(
  text: string,
  expectation: { repository: string }
): EvidenceResult<{ labels: string[] }>;

/** One validated check run, identity-complete (round 11 J2). */
export interface CheckRunRecord {
  id: number;
  name: string;
  conclusion: string | null;
  head_sha: string;
}

/** One validated combined-status entry, identity-complete (round 11 J2). */
export interface CommitStatusRecord {
  id: number;
  context: string;
  state: string;
}

export declare function parseCheckRunPages(
  text: string,
  expectation: { repository: string; sha: string }
): EvidenceResult<{
  check_runs_total: number;
  check_run_conclusions: string[];
  /** The COMPLETE validated record set, sorted by id — evidence equality
   *  compares these records, never the aggregates alone. */
  check_runs: CheckRunRecord[];
}>;

export declare function parseCombinedStatus(
  text: string,
  expectation: { repository: string; sha: string }
): EvidenceResult<{
  commit_statuses_total: number;
  commit_status_state: string;
  /** The COMPLETE validated entry set, sorted by id. */
  commit_statuses: CommitStatusRecord[];
}>;
