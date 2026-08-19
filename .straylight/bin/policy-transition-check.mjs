#!/usr/bin/env node
// Straylight Control Plane v2 — policy transition check (no network).
//
// Proves that a proposed automation policy EXTENDS the previously committed one
// instead of rewriting it: append-only admission history, and (for the one-time
// v1→v2 migration) a genesis epoch that transcribes v1's admission fields
// without altering them. See .straylight/lib/policy-transition.mjs for the rules
// and for why this check is deliberately independent of the runtime
// accepted-epoch lock.
//
// This program is an executable AUDIT GATE run by the operator's policy-change
// procedure. Nothing in the repository invokes it automatically on a push, and it
// asserts no repository settings; a candidate policy becomes an authorized
// transition only through the operator's exact-SHA review.
//
// Usage:
//   git show <base-sha>:.straylight/automation-policy.json > /tmp/prev.json
//   node .straylight/bin/policy-transition-check.mjs \
//     --previous /tmp/prev.json --candidate .straylight/automation-policy.json
//
// Appending an admission epoch additionally requires the frozen frontier
// cutover — the previous committed policy already disabled, the candidate still
// disabled, and evidence of where the durable event stream ended:
//   node .straylight/bin/policy-transition-check.mjs \
//     --previous /tmp/prev.json --candidate .straylight/automation-policy.json \
//     --frontier /tmp/frontier.json --repository 0xHoneyJar/loa-straylight \
//     --expect-frozen-main-sha <40-hex>
// Capture the frontier read-only with scripts/capture-durable-frontier.mjs while
// automation is frozen AND quiescent (scripts/verify-frozen-quiescence.mjs).
// --repository and --expect-frozen-main-sha are both required with --frontier and
// both must match the evidence: naming them separately is what stops a frontier
// captured elsewhere, or against a different revision, from standing in for this
// repository's history at this freeze (Codex H-02).
//
// The appended epoch must also COMMIT the canonical digest of the frontier
// supplied here, in `transition_evidence.frontier_digest` — the value
// scripts/capture-durable-frontier.mjs prints after a successful capture. This
// program recomputes that digest over the file passed to --frontier and refuses a
// mismatch, so a stale or trimmed capture cannot stand in for the reviewed one
// (Codex M-01). There is deliberately NO flag to supply, weaken, or override the
// expected digest: the only place it may be stated is the candidate policy, where
// the exact-SHA review sees it.
//
// Both policy paths are REQUIRED and neither defaults: the previous policy has to
// be named explicitly, because "the policy as committed before this change" is a
// fact about the repository history that this program cannot infer. It performs
// no git, network, or subprocess calls of its own.
//
// stdout: a single JSON result.
//   exit 0  the transition is an append (or a live-only change, or a
//           value-preserving v1→v2 migration)
//   exit 2  unreadable input, or the transition rewrites accepted history

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseStrict } from "../lib/strict-json.mjs";
import { validatePolicyTransition } from "../lib/policy-transition.mjs";
import { ADMISSION_FIELDS } from "../lib/validate.mjs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function emit(result, code) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(code);
}

// Strict parse: duplicate keys are ambiguity, and an ambiguous policy must
// never be compared as though its meaning were settled.
function load(label, path) {
  let text;
  try {
    text = readFileSync(resolve(path), "utf8");
  } catch (e) {
    emit({ ok: false, refusal: `${label}-unreadable`, detail: String(e?.message ?? e) }, 2);
  }
  const parsed = parseStrict(text);
  if (!parsed.ok) {
    emit({ ok: false, refusal: `${label}-unreadable`, detail: `strict JSON parse failed: ${parsed.reason}` }, 2);
  }
  return parsed.value;
}

const previousPath = arg("--previous");
const candidatePath = arg("--candidate");
if (previousPath === null || candidatePath === null) {
  emit({ ok: false, refusal: "usage", detail: "--previous <file> and --candidate <file> are both required" }, 2);
}

const previous = load("previous", previousPath);
const candidate = load("candidate", candidatePath);

// Transition evidence, when supplied. Absent evidence is NOT defaulted: the
// library refuses an append that has none, and that refusal is the point.
const frontierPath = arg("--frontier");
const repository = arg("--repository");
const expectedFrozenMainSha = arg("--expect-frozen-main-sha");
if (frontierPath !== null && repository === null) {
  emit(
    {
      ok: false,
      refusal: "usage",
      detail: "--repository <owner/name> is required with --frontier: the append must name its repository",
    },
    2,
  );
}
// The frozen revision is named by the OPERATOR'S COMMAND, not read out of the
// evidence: an append authorized against a SHA the operator never typed is an
// append authorized against whatever the capture happened to see.
if (frontierPath !== null && expectedFrozenMainSha === null) {
  emit(
    {
      ok: false,
      refusal: "usage",
      detail:
        "--expect-frozen-main-sha <40-hex> is required with --frontier: the append must name the frozen main " +
        "commit it is authorized against, and the frontier must have been captured against exactly that revision",
    },
    2,
  );
}
const context =
  frontierPath === null
    ? null
    : {
        repository,
        expected_frozen_main_sha: expectedFrozenMainSha,
        frontier: load("frontier", frontierPath),
      };

const verdict = validatePolicyTransition(previous, candidate, context);
if (!verdict.ok) {
  emit({ ok: false, refusal: "transition-forbidden", errors: verdict.errors }, 2);
}

// Report the admission values on both sides so the output is itself the
// value-preserving evidence, not a claim about it.
const admissionOf = (obj) => {
  const out = {};
  for (const field of ADMISSION_FIELDS) out[field] = obj?.[field];
  return out;
};
const history = candidate.admission_history;
emit(
  {
    ok: true,
    kind: verdict.kind,
    previous_epochs: verdict.previous_epochs,
    candidate_epochs: verdict.candidate_epochs,
    appended: verdict.appended,
    // null on the genesis and live-only paths: no admission decision moves there,
    // so no frontier is required and none was consulted.
    frontier: verdict.frontier,
    previous_current_admission: admissionOf(
      verdict.kind === "v1-to-v2" ? previous : previous.admission_history[previous.admission_history.length - 1],
    ),
    candidate_current_admission: admissionOf(history[history.length - 1]),
    genesis_epoch: { epoch_id: history[0].epoch_id, governs_from: history[0].governs_from },
  },
  0,
);
