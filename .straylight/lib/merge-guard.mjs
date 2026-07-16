// Straylight Control Plane v1 — pure shadow merge-guard logic.
//
// evaluate(lane, policy, context) -> { eligible, reasons, shadow: true }
//
// Computes and REPORTS merge eligibility. It contains no merge call,
// returns no instruction to merge, and its result is advisory-only by
// construction: the only consumer effect defined for it is posting a
// shadow-mode comment. Control Plane v1 has no code path that merges.
//
// Check-status policy (single, coherent authority): the reducer's
// ready-for-merge state asserts ONLY that an ACCEPT audit was recorded —
// live CI status is NOT part of event-sourced replay and never enters the
// reducer. This module is the SOLE authority on required-check status, and
// it evaluates RAW evidence, failing closed on every unknown:
//   - >= 1 check run observed AND zero non-passing check runs, AND
//   - the legacy combined commit status is "success" or absent (0 statuses).
// A pre-cooked boolean is no longer accepted (that let the workflow fail
// OPEN by reporting "no checks configured" as "checks passed").

import { validatePolicy, validateLane } from "./validate.mjs";

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
  const currentHead = context.pr_head_sha ?? null;
  if (!currentHead) {
    reasons.push("current PR head SHA unavailable (fail closed)");
  } else if (lane.audited_sha && currentHead !== lane.audited_sha) {
    reasons.push(`PR head ${currentHead} != audited SHA ${lane.audited_sha}`);
  }
  // PR liveness: a closed/merged/retargeted PR invalidates eligibility. Fail
  // closed on unknown — if the workflow could not report the PR's open state
  // or its base, we cannot confirm the audited target still exists as an open
  // PR against the lane's base branch.
  if (context.pr_state !== "open") {
    reasons.push(`PR state is ${context.pr_state ?? "unknown"}, not open (fail closed)`);
  }
  if (typeof context.pr_base_ref !== "string") {
    reasons.push("PR base branch unavailable (fail closed)");
  } else if (context.pr_base_ref !== lane.base_branch) {
    reasons.push(`PR retargeted: base ${context.pr_base_ref} != lane base_branch ${lane.base_branch}`);
  }
  // Raw-evidence required-check gate (fail closed on any unknown). The
  // caller supplies observed counts; a missing/partial `checks` object, zero
  // check runs, any non-passing check run, or a non-success legacy commit
  // status all yield ineligible.
  const c = context.checks ?? null;
  const checksOk =
    c !== null &&
    typeof c === "object" &&
    Number.isInteger(c.check_runs_total) &&
    Number.isInteger(c.check_runs_failing) &&
    Number.isInteger(c.commit_statuses_total) &&
    c.check_runs_total > 0 &&
    c.check_runs_failing === 0 &&
    (c.commit_statuses_total === 0 || c.commit_status_state === "success");
  if (!checksOk) {
    reasons.push(
      "required checks not confirmed passing: need >=1 check run, 0 failing, " +
        "and legacy combined status success-or-absent (fail closed)",
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
