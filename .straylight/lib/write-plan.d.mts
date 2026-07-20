// Type surface for tests/tooling. Runtime source of truth: write-plan.mjs
//
// The closed straylight.write-plan.v1 contract: operation-kind allowlist
// with fixed method/path templates (plans express NO method/path/URL/
// endpoint and NO best_effort — unknown fields refuse everywhere);
// kind-derived fatality (warning-only exclusively for the hard-coded
// derived-label kinds); structural terminal barriers (at most one
// state-advancing operation per issue, nothing after it); the cp-paused
// warning-before-removal dependency as a validated structural field; and
// per-kind endpoint body-content binding over the exact retained bytes.

export declare const WRITE_PLAN_SCHEMA: "straylight.write-plan.v1";
export declare const REPOSITORY_ALLOWLIST: readonly string[];
export declare const NONCE_RE: RegExp;

export type OperationKind =
  | "post-state-advancing-event"
  | "post-reducer-result"
  | "post-watchdog-finding"
  | "post-merge-guard-result"
  | "post-cp-paused-warning"
  | "add-derived-label"
  | "remove-derived-label"
  | "remove-derived-cp-paused-after-warning"
  | "create-lane-issue"
  | "create-label-definition";

export interface OperationKindSpec {
  method: "POST" | "DELETE";
  path: (op: Record<string, unknown>, repo: string) => string;
  body: boolean;
  /** Non-zero gh API result aborts the plan (executor exit 4). */
  fatal: boolean;
  /** Terminal for its issue within a plan (§10). */
  state_advancing: boolean;
  fields: readonly string[];
}

export declare const OPERATION_KINDS: Readonly<Record<OperationKind, OperationKindSpec>>;

export declare function isDerivedLabel(label: unknown): boolean;
export declare function isWarningOnlyKind(kind: string): boolean;
export declare function isStateAdvancingKind(kind: string): boolean;

/** Canonical cp-paused warning identity: `cp-paused-warning:<lane>:<issue>`. */
export declare function warningDedupeKey(laneId: string, issueNumber: number): string;
/** The fixed state-neutral warning body template (byte-exact contract). */
export declare function warningBodyFor(laneId: string, issueNumber: number): string;

export interface PlanError {
  code: string;
  detail: string;
}

export interface ValidatedOperation extends Record<string, unknown> {
  op_id: string;
  kind: OperationKind;
  method: "POST" | "DELETE";
  path: string;
  body_required: boolean;
  fatal: boolean;
  state_advancing: boolean;
}

export declare function checkConstructedPath(path: string): PlanError | null;

export declare function validatePlan(
  plan: unknown,
  expectation: { repository: string; nonce: string }
): { ok: true; operations: ValidatedOperation[] } | { ok: false; errors: PlanError[] };

/** True when text contains a line that is EXACTLY `dedupe:<key>` (C4). */
export declare function hasFullLineDedupe(text: string, key: string): boolean;

export declare function validateOperationBody(
  op: Record<string, unknown>,
  text: string
): { ok: true } | { ok: false; errors: PlanError[] };
