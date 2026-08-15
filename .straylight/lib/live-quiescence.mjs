// Straylight Control Plane v2 — PROVING FROZEN-WRITE QUIESCENCE, live.
//
// WHY THIS FILE EXISTS (Codex quiescence-provenance, HIGH)
//
// frozen-quiescence.mjs judges a quiescence DOCUMENT. That is a validator, and a
// validator's honest answer is "this document is well-formed and internally
// admissible" — never "the world was quiescent". The distinction stopped being
// academic the moment two tools shared the document: the verifier PRODUCED it by
// looking at GitHub, and the frontier capture CONSUMED it by validating it. So a
// hand-written file that satisfied the shape rules — correct frozen SHA, correct
// workflow list, `active_write_runs: []`, plausible instant — was accepted by a
// capture running against a main whose committed policy still said
// `enabled: true`. "This document says quiescence was proven" had become a
// substitute for "quiescence was actually proven".
//
// THE RULE THIS MODULE ENCODES
//
//   A durable frontier is admissible only if the capture operation ITSELF proves
//   the quiescence conditions it relies on, against GitHub, at the exact frozen
//   revision. A caller-supplied document is evidence to compare and report, and
//   nothing more. It can cause a REFUSAL; it can never cause an acceptance.
//
// So the live proof lives HERE, in one place, and both the verifier CLI and the
// frontier capture run the same code against the same API. Two implementations of
// "is it quiescent" would drift, and the one that drifted would be the one an
// operator happened to run.
//
// WHAT THE PROOF ESTABLISHES, in order, all read-only:
//
//   1. The repository answers to its own name and main is still its default
//      branch. A default-branch switch is an authority move.
//   2. Current main is EXACTLY the frozen revision the caller named.
//   3. The policy committed AT THAT COMMIT — fetched from GitHub, never from the
//      local tree — parses strictly, passes the FULL accepted-policy validation
//      including the accepted-epoch locks, and has `enabled === false`.
//   4. The write-capable workflow set is derived from the workflow bytes AT THAT
//      COMMIT: the directory listing at `?ref=<sha>` and every `.yml`/`.yaml`
//      file inside it, each bound to the blob id the listing reported. Never the
//      local checkout, never the current branch, never two commits mixed.
//   5. A complete duplicate-free scan of every run of every workflow in that set.
//   6. Main is still the frozen revision.
//   7. A SECOND complete independent scan.
//   8. Zero active runs across both. Only the literal terminal status counts as
//      finished; anything else, including a status GitHub adds tomorrow, is
//      active.
//   9. Main is still the frozen revision.
//  10. The evidence document, stamped after step 9 so it never claims to cover a
//      moment the reads had not reached.
//
// PURE OF I/O. No network, no clock, no filesystem, no process spawning in this
// module: the caller injects `read` (a read-only GET returning raw stdout) and
// `now` (an instant stamp). That is what lets the frontier capture run the same
// proof without either tool owning the algorithm, and what lets the whole thing
// be tested against a mock transport. Parsing and judgement are delegated to the
// pure validators (frozen-quiescence.mjs, write-authority.mjs, policy-source.mjs).
//
// WHAT IT CANNOT PROVE. Not a transactional snapshot. GitHub can create a run the
// instant after the last page is read — while frozen, a comment on any lane still
// triggers the reducer, which then refuses to write but is nonetheless a live
// write-capable run. Hence two scans, three main-identity checks, and a caller
// (the capture) that runs the WHOLE proof again after its own reads. Nor does
// anything here cancel a run: cancelling mid-plan is its own hazard, and the
// decision belongs to the operator.

import { parseSingleDocument } from "./evidence.mjs";
import {
  buildFrozenQuiescence,
  parseWorkflowRunPages,
  writeCapableWorkflows,
} from "./frozen-quiescence.mjs";
import { acceptCommittedPolicyText } from "./policy-source.mjs";
import { parseStrict } from "./strict-json.mjs";
import { parseIsoInstant } from "./validate.mjs";
import {
  COMMITTED_POLICY_REPO_PATH,
  committedPolicyReadPath,
  decodeCommittedFile,
  decodeCommittedWorkflowFile,
  MAIN_SHA_RE,
  mainRefReadPath,
  readMainRefSha,
  readRepositoryDefaultBranch,
  readWorkflowDirectory,
  repositoryMetadataReadPath,
  workflowDirectoryReadPath,
  workflowFileReadPath,
  workflowRunsReadPath,
} from "./write-authority.mjs";

function refuse(reason, detail) {
  return { ok: false, reason, detail };
}

// The injected transport, checked rather than trusted: a reader that throws, or
// that returns something other than text, must not read as an empty response.
function fetchText(read, pathResult, { paginate = false } = {}) {
  if (!pathResult.ok) return refuse(pathResult.reason, pathResult.detail);
  if (typeof read !== "function") return refuse("usage", "a read-only GET function is required");
  let out;
  try {
    out = read(pathResult.path, { paginate });
  } catch (e) {
    return refuse("read-failed", `GET ${pathResult.path}: ${String(e?.message ?? e)}`);
  }
  if (out === null || typeof out !== "object" || out.ok !== true || typeof out.text !== "string") {
    return refuse("read-failed", `GET ${pathResult.path}: ${String(out?.detail ?? "no response text")}`);
  }
  return { ok: true, text: out.text, path: pathResult.path };
}

function readObject(read, pathResult, reason) {
  const got = fetchText(read, pathResult);
  if (!got.ok) return got;
  const parsed = parseSingleDocument(got.text);
  if (!parsed.ok) return refuse(reason, `${got.path}: ${parsed.reason} (${parsed.detail ?? ""})`);
  return { ok: true, value: parsed.value };
}

/**
 * The exact commit main points at right now. Shared so that every
 * main-identity check in the cutover — the proof's three, and the capture's
 * around its own lane reads — is the same read and the same parser.
 */
export function readCurrentMainSha({ repository, read }) {
  const got = readObject(read, mainRefReadPath(repository), "main-ref-unreadable");
  if (!got.ok) return got;
  const sha = readMainRefSha(got.value);
  if (!sha.ok) return refuse(sha.reason, sha.detail);
  return { ok: true, sha: sha.sha };
}

/**
 * Main must BE the frozen revision. `at` names the moment in the diagnostic, so
 * a refusal says which read the movement was detected between.
 */
export function requireFrozenMain({ repository, frozen_main_sha, read, at }) {
  const current = readCurrentMainSha({ repository, read });
  if (!current.ok) return current;
  if (current.sha !== frozen_main_sha) {
    return refuse(
      "main-moved",
      `${at}: current main is ${current.sha}, not the frozen ${frozen_main_sha} — the freeze this operation runs ` +
        "under is not the committed state of main; re-verify quiescence at the new revision and start again",
    );
  }
  return { ok: true, sha: current.sha };
}

/**
 * The accepted policy committed AT an exact commit, fetched from GitHub. Returns
 * the parsed accepted policy; the caller decides what `enabled` must be.
 */
export function readCommittedPolicyAt({ repository, commit_sha, read }) {
  const got = readObject(read, committedPolicyReadPath(repository, commit_sha), "committed-policy-unreadable");
  if (!got.ok) return got;
  const decoded = decodeCommittedFile(got.value, { expected_path: COMMITTED_POLICY_REPO_PATH });
  if (!decoded.ok) return refuse(decoded.reason, decoded.detail);
  const accepted = acceptCommittedPolicyText(decoded.text, {
    source: `${repository}@${commit_sha}:${COMMITTED_POLICY_REPO_PATH}`,
  });
  if (!accepted.ok) return refuse(accepted.refusal, accepted.detail);
  return { ok: true, policy: accepted.value };
}

/**
 * Derive the write-capable workflow set from the workflow bytes committed AT an
 * exact commit.
 *
 * The listing and every file are fetched at the SAME `?ref=<sha>`, and each
 * file's response is bound to the blob id the listing reported — so the bytes the
 * derivation reads are the bytes that commit contains, and a set cannot be
 * assembled from two revisions. Nothing local is consulted: the process's working
 * directory has no bearing on the answer.
 */
export function deriveWriteCapableWorkflowsAt({ repository, commit_sha, read }) {
  const listing = fetchText(read, workflowDirectoryReadPath(repository, commit_sha));
  if (!listing.ok) return listing;
  const parsed = parseStrict(listing.text);
  if (!parsed.ok) {
    return refuse("workflow-directory-unreadable", `${listing.path}: strict JSON parse failed: ${parsed.reason}`);
  }
  const dir = readWorkflowDirectory(parsed.value);
  if (!dir.ok) return refuse(dir.reason, dir.detail);
  const files = [];
  for (const entry of dir.entries) {
    const got = readObject(read, workflowFileReadPath(repository, commit_sha, entry.path), "committed-file-unreadable");
    if (!got.ok) return got;
    const decoded = decodeCommittedWorkflowFile(got.value, { expected_path: entry.path, expected_sha: entry.sha });
    if (!decoded.ok) return refuse(decoded.reason, decoded.detail);
    files.push({ path: entry.path, text: decoded.text });
  }
  const derived = writeCapableWorkflows(files);
  if (!derived.ok) return refuse(derived.reason, derived.detail);
  return { ok: true, workflows: derived.workflows, enumerated: dir.entries.map((e) => e.path) };
}

/**
 * One complete pass over every write-capable workflow's run history. A repeated
 * run id anywhere in a workflow's pages is a refusal, not a deduplication
 * (parseWorkflowRunPages) — a duplicated completed run would otherwise pay for an
 * omitted active one.
 */
export function scanWriteCapableRuns({ repository, workflows, read, label }) {
  const active = [];
  let scanned = 0;
  for (const workflow of workflows) {
    const got = fetchText(read, workflowRunsReadPath(repository, workflow), { paginate: true });
    if (!got.ok) return got;
    const parsed = parseWorkflowRunPages(got.text, { workflow_path: workflow });
    if (!parsed.ok) return refuse(parsed.reason, `${label}: ${parsed.detail}`);
    scanned += parsed.scanned;
    active.push(...parsed.active);
  }
  active.sort((a, b) => a.run_id - b.run_id);
  return { ok: true, scanned, active };
}

/** The refusal detail for a non-quiescent observation. Never cancels anything. */
export function reportActiveRuns(label, active) {
  return (
    `${label}: ${active.length} write-capable run(s) not in the terminal status — ` +
    active.map((r) => `${r.workflow} run ${r.run_id} (${r.status}, created ${r.created_at})`).join("; ") +
    ". Wait for them to finish and re-verify; do NOT cancel them."
  );
}

/**
 * THE LIVE PROOF. Performs steps 1-10 of the header against GitHub via the
 * injected read-only transport, and returns the quiescence evidence it PROVED —
 * not evidence it was handed.
 *
 *   repository        "<owner>/<name>"
 *   frozen_main_sha   the 40-hex revision, named explicitly by the operator
 *   read(path, opts)  read-only GET -> { ok: true, text } | { ok: false, detail }
 *   now()             -> a UTC instant string, called after the last read
 *   note(message)     optional progress reporter (stderr in the CLIs)
 *
 * Returns { ok: true, document, value, scans } or { ok: false, reason, detail }.
 */
export function proveFrozenQuiescence({ repository, frozen_main_sha, read, now, note = () => {} }) {
  if (typeof frozen_main_sha !== "string" || !MAIN_SHA_RE.test(frozen_main_sha)) {
    return refuse("frozen-main-sha-invalid", "the frozen revision must be a full 40-hex commit SHA (never a branch name)");
  }
  if (typeof now !== "function") return refuse("usage", "a clock function is required");

  // 1. The repository answers to its own name and main is still its default branch.
  const meta = readObject(read, repositoryMetadataReadPath(repository), "repository-metadata-unreadable");
  if (!meta.ok) return meta;
  const branch = readRepositoryDefaultBranch(meta.value, { repository });
  if (!branch.ok) return refuse(branch.reason, branch.detail);

  // 2. Current main is EXACTLY the frozen revision.
  const before = requireFrozenMain({ repository, frozen_main_sha, read, at: "before the quiescence proof" });
  if (!before.ok) return before;

  // 3. The policy committed AT that revision is an accepted policy AND frozen.
  const committed = readCommittedPolicyAt({ repository, commit_sha: frozen_main_sha, read });
  if (!committed.ok) return committed;
  if (committed.policy.enabled !== false) {
    return refuse(
      "not-frozen",
      `the policy committed at ${frozen_main_sha} has enabled ${JSON.stringify(committed.policy.enabled)} — ` +
        "quiescence is only meaningful under a committed freeze (enabled must be the boolean false)",
    );
  }

  // 4. The closed write-capable set, from the workflow bytes AT that commit.
  const derived = deriveWriteCapableWorkflowsAt({ repository, commit_sha: frozen_main_sha, read });
  if (!derived.ok) return derived;
  note(
    `write-capable workflows at ${frozen_main_sha}: ${derived.workflows.join(", ")} ` +
      `(from ${derived.enumerated.length} workflow file(s) committed at that revision)`,
  );

  // 5 + 6 + 7. Two complete independent scans with a main-identity check between.
  const first = scanWriteCapableRuns({ repository, workflows: derived.workflows, read, label: "scan 1" });
  if (!first.ok) return first;
  note(`scan 1: ${first.scanned} run(s); ${first.active.length} still in flight`);
  const between = requireFrozenMain({ repository, frozen_main_sha, read, at: "between the two run scans" });
  if (!between.ok) return between;
  const second = scanWriteCapableRuns({ repository, workflows: derived.workflows, read, label: "scan 2" });
  if (!second.ok) return second;
  note(`scan 2: ${second.scanned} run(s); ${second.active.length} still in flight`);

  // 8. Zero active runs across BOTH scans.
  if (first.active.length > 0 || second.active.length > 0) {
    const firstHas = first.active.length > 0;
    return refuse("not-quiescent", reportActiveRuns(firstHas ? "scan 1" : "scan 2", firstHas ? first.active : second.active));
  }

  // 9. Main is STILL the frozen revision.
  const after = requireFrozenMain({ repository, frozen_main_sha, read, at: "after the two run scans" });
  if (!after.ok) return after;

  // 10. Stamped after the last read, and validated: a caller cannot receive a
  // document this protocol would refuse.
  const checked_at = now();
  if (parseIsoInstant(checked_at) === null) {
    return refuse("quiescence-invalid", `the clock returned ${JSON.stringify(checked_at)}, not a UTC instant`);
  }
  const built = buildFrozenQuiescence({
    repository,
    frozen_main_sha,
    checked_at,
    write_capable_workflows: derived.workflows,
    active_write_runs: [],
  });
  if (!built.ok) return refuse("quiescence-invalid", built.errors.join("; "));
  return {
    ok: true,
    document: built.document,
    value: built.value,
    scans: { first: first.scanned, second: second.scanned },
  };
}

/**
 * Compare a caller-supplied quiescence RECEIPT against a proof this operation
 * performed itself.
 *
 * The asymmetry is the point. Agreement grants nothing — the fresh proof already
 * established everything the frontier will carry, and the receipt's fields are
 * never copied anywhere. Disagreement is a refusal, because two honest
 * observations of one frozen revision should not differ: a receipt naming a
 * different repository, a different revision, a different write-capable set, or
 * an instant LATER than the proof that supersedes it means the operator is
 * holding evidence about some other state of the world, and proceeding would
 * leave that unexplained.
 */
export function receiptAgreesWithProof(receipt, proof, { repository, frozen_main_sha }) {
  if (receipt.repository !== repository) {
    return refuse("quiescence-receipt-mismatch", `--quiescence describes ${receipt.repository}, not ${repository}`);
  }
  if (receipt.frozen_main_sha !== frozen_main_sha) {
    return refuse(
      "quiescence-receipt-mismatch",
      `--quiescence was gathered at main ${receipt.frozen_main_sha} but the frozen revision is ${frozen_main_sha}; ` +
        "the receipt describes a different revision",
    );
  }
  const a = receipt.write_capable_workflows;
  const b = proof.write_capable_workflows;
  if (a.length !== b.length || a.some((path, i) => path !== b[i])) {
    return refuse(
      "quiescence-receipt-mismatch",
      `--quiescence records the write-capable set [${a.join(", ")}] but the set derived from the workflow bytes ` +
        `committed at ${frozen_main_sha} is [${b.join(", ")}] — the receipt was not gathered from this revision's tree`,
    );
  }
  const receiptAt = parseIsoInstant(receipt.checked_at);
  const proofAt = parseIsoInstant(proof.checked_at);
  if (receiptAt === null || proofAt === null || receiptAt > proofAt) {
    return refuse(
      "quiescence-receipt-mismatch",
      `--quiescence claims to have been checked at ${receipt.checked_at}, which is not before the fresh proof at ` +
        `${proof.checked_at} — a receipt cannot postdate the proof that supersedes it`,
    );
  }
  return { ok: true };
}
