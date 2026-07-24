// Straylight Control Plane v1 — pure shadow merge-guard logic.
//
// evaluate(lane, policy, context) -> { eligible, reasons, shadow: true }
//
// Computes and REPORTS merge eligibility. It contains no merge call,
// returns no instruction to merge, and its result is advisory-only by
// construction: the only consumer effect defined for it is posting a
// shadow-mode comment. Control Plane v1 has no code path that merges.
//
// Live-PR policy (single normalized record, fail closed on everything):
// the caller supplies context.pr_metadata — the COMPLETE normalized live
// PR metadata object (the same validatePrMetadata shape the reducer
// workflow embeds in system.eligibility_confirmed events): fetch_ok,
// repository, pr_number, state, draft, merged, base_branch, base_sha,
// head_branch, head_sha. Eligibility requires EVERY field to correspond
// exactly with the lane and the audited target: a missing record, a
// failed fetch, a structurally invalid record, or ANY non-corresponding
// field (wrong repository, wrong PR number, non-open, merged, draft,
// retargeted base branch, moved base SHA, wrong head branch, head off
// the audited SHA) is ineligible. Loose single-field context (a bare
// pr_head_sha or pr_state) is never accepted — partial evidence is
// unknown, and unknown fails closed.
//
// Check-status policy (single, coherent authority): the reducer's
// ready-for-merge state asserts ONLY that an ACCEPT audit was recorded and
// durably confirmed against live PR metadata — live CI status is NOT part
// of event-sourced replay and never enters the reducer. This module is the
// SOLE authority on required-check status, and it evaluates RAW evidence,
// failing closed on every unknown:
//   - the caller supplies EVERY check run's conclusion across ALL pages
//     (checks.check_run_conclusions) plus the API's total_count
//     (checks.check_runs_total); a conclusion list whose length differs
//     from total_count means a page was dropped → fail closed;
//   - >= 1 check run observed AND every conclusion is success/neutral/
//     skipped (a null/pending/failed conclusion is non-passing), AND
//   - the legacy combined commit status is "success" or absent (0 statuses).
// A pre-cooked boolean is never accepted (that let the workflow fail
// OPEN by reporting "no checks configured" as "checks passed").

import { validatePolicy, validateLane, validatePrMetadata } from "./validate.mjs";

const PASSING_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);

export function evaluate(lane, policy, context = {}) {
  const reasons = [];
  const pol = validatePolicy(policy ?? null);
  if (!pol.ok) {
    return verdictOf(false, [`policy invalid: ${pol.errors.join("; ")}`]);
  }
  if (policy.enabled !== true) {
    return verdictOf(false, ["automation disabled (kill switch)"]);
  }
  const lv = validateLane(lane ?? null);
  if (!lv.ok) {
    return verdictOf(false, [`lane invalid: ${lv.errors.join("; ")}`]);
  }
  if (lane.operator_pause === true) reasons.push("operator pause is set");
  if (lane.state !== "ready-for-merge") reasons.push(`lane state is ${lane.state}, not ready-for-merge`);
  if (lane.verdict !== "ACCEPT") reasons.push(`verdict is ${lane.verdict ?? "absent"}, not ACCEPT`);
  if (!lane.audited_sha) reasons.push("no audited SHA recorded");
  if (lane.pr_number == null) reasons.push("lane has no recorded PR number (fail closed)");
  if (lane.working_branch == null) reasons.push("lane has no established working branch (fail closed)");

  // Complete normalized live PR metadata — every field must correspond
  // exactly with the lane and the audited target (the same field-by-field
  // discipline the reducer applies to system.eligibility_confirmed).
  const meta = context.pr_metadata ?? null;
  if (meta === null) {
    reasons.push("live PR metadata unavailable (fail closed)");
  } else {
    const mv = validatePrMetadata(meta);
    if (!mv.ok) {
      reasons.push(`live PR metadata invalid: ${mv.errors.join("; ")} (fail closed)`);
    } else if (meta.fetch_ok !== true) {
      reasons.push("live PR fetch failed (fetch_ok is not true; fail closed)");
    } else {
      if (meta.repository !== lane.repository) {
        reasons.push(`live PR repository ${meta.repository} != lane repository ${lane.repository}`);
      }
      if (lane.pr_number == null || meta.pr_number !== lane.pr_number) {
        reasons.push(`live PR #${meta.pr_number} != lane PR #${lane.pr_number ?? "none"}`);
      }
      if (meta.state !== "open") {
        reasons.push(`live PR state is ${meta.state}, not open`);
      }
      // draft/merged are OBSERVED booleans by validatePrMetadata (an adapter
      // that lost the fields cannot default them; the record fails
      // validation above instead). Eligibility requires the observed false.
      if (meta.merged !== false) {
        reasons.push("live PR is merged; a merged PR has no merge eligibility");
      }
      if (meta.draft !== false) {
        reasons.push("live PR is a draft; a draft PR is not ready to merge");
      }
      if (meta.base_branch !== lane.base_branch) {
        reasons.push(`PR retargeted: live base branch ${meta.base_branch} != lane base_branch ${lane.base_branch}`);
      }
      if (meta.base_sha !== lane.base_sha) {
        reasons.push(`live PR base sha ${meta.base_sha} != lane base_sha ${lane.base_sha}`);
      }
      if (lane.working_branch == null || meta.head_branch !== lane.working_branch) {
        reasons.push(`live PR head branch ${meta.head_branch} != lane working_branch ${lane.working_branch ?? "none"}`);
      }
      if (!lane.audited_sha || meta.head_sha !== lane.audited_sha) {
        reasons.push(`live PR head ${meta.head_sha} != audited SHA ${lane.audited_sha ?? "none"}`);
      }
    }
  }
  // Raw-evidence required-check gate (fail closed on any unknown). The
  // caller supplies the FULL per-run conclusion list gathered across every
  // page, plus the API total; a missing/partial `checks` object, a dropped
  // page (list shorter or longer than the total), zero check runs, any
  // non-passing conclusion, or a non-success legacy commit status all yield
  // ineligible.
  const c = context.checks ?? null;
  const conclusions = Array.isArray(c?.check_run_conclusions) ? c.check_run_conclusions : null;
  const checksOk =
    c !== null &&
    typeof c === "object" &&
    conclusions !== null &&
    Number.isInteger(c.check_runs_total) &&
    Number.isInteger(c.commit_statuses_total) &&
    c.check_runs_total > 0 &&
    conclusions.length === c.check_runs_total &&
    conclusions.every((x) => typeof x === "string" && PASSING_CONCLUSIONS.has(x)) &&
    (c.commit_statuses_total === 0 || c.commit_status_state === "success");
  if (!checksOk) {
    reasons.push(
      "required checks not confirmed passing: need >=1 check run, a complete " +
        "all-pages conclusion list matching the API total, every conclusion " +
        "success/neutral/skipped, and legacy combined status success-or-absent (fail closed)",
    );
  }
  if (policy.auto_merge !== false) {
    // validatePolicy already rejects auto_merge=true; belt-and-braces.
    reasons.push("policy auto_merge is not false");
  }
  return verdictOf(reasons.length === 0, reasons);
}

function verdictOf(eligible, reasons) {
  return {
    shadow: true,
    eligible,
    action: "report-only", // constant: v1 defines no other action
    reasons,
    note:
      "Shadow mode: this result records merge ELIGIBILITY only. " +
      "Control Plane v1 cannot merge; merging remains an exclusive operator action.",
  };
}
