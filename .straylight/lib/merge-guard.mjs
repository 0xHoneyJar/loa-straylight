// Straylight Control Plane v1 — pure shadow merge-guard logic.
//
// evaluate(lane, policy, context) -> { eligible, reasons, shadow: true }
//
// Computes and REPORTS merge eligibility. It contains no merge call,
// returns no instruction to merge, and its result is advisory-only by
// construction: the only consumer effect defined for it is posting a
// shadow-mode comment. Control Plane v1 has no code path that merges.

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
  if (context.required_checks_passed !== true) {
    reasons.push("required status checks not confirmed passing (fail closed)");
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
