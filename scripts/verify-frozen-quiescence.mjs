#!/usr/bin/env node
// Verify FROZEN-WRITE QUIESCENCE of the control plane, read-only.
//
// WHAT THIS IS FOR (Codex H-02)
//
// Before a durable event frontier is captured, the operator needs a mechanical
// answer to one question:
//
//   "The freeze is the committed state of main, and NO write-capable workflow
//    run is still in flight."
//
// Merging `enabled: false` alone does not establish that. A run that started
// before the freeze landed is still executing, and it is holding a write plan
// that was authored while automation was permitted. The executor now refuses
// such a plan at write time (.straylight/lib/write-authority.mjs), which is the
// safety property; this tool establishes the separate, weaker, operator-facing
// fact that nothing was in flight — so a frontier captured next says where
// history ended rather than where it happened to be mid-flight.
//
// WHAT IT CHECKS, in order, all read-only:
//
//   1. --frozen-main-sha is supplied EXPLICITLY. The tool never guesses which
//      revision the operator means to freeze at; a tool that resolved "main"
//      itself would happily verify quiescence at a revision the operator has
//      not seen.
//   2. The repository's default branch is still main.
//   3. Current main is EXACTLY the supplied frozen SHA.
//   4. The policy committed AT that SHA parses strictly, passes the FULL
//      accepted-policy validation (including the accepted-epoch locks), and has
//      enabled === false. A malformed policy is not a freeze.
//   5. The CLOSED SET of write-capable workflows is derived MECHANICALLY from
//      the checkout's own .github/workflows (files invoking the write executor).
//   6. Every run of every workflow in that set is in the terminal Actions
//      status. Any other state — queued, in_progress, waiting, requested,
//      pending, or anything GitHub adds tomorrow — counts as ACTIVE.
//   7. Main has still not moved, and a SECOND complete independent scan agrees.
//
// A refusal names the run ids and workflow identities that are still live. This
// tool NEVER cancels a run: cancelling mid-plan is its own hazard, and the
// decision belongs to the operator.
//
// WHAT IT CANNOT PROVE. Not a transactional snapshot. GitHub can create a run
// the instant after the last page is read — while frozen, a comment on any lane
// still triggers the reducer, which then takes no action but is nonetheless a
// live write-capable run. Hence the two independent scans (the same stability
// fence the protocol uses for evidence elsewhere) and the RE-VERIFY step in the
// cutover order documented in .straylight/lib/admission-locks.mjs. Two agreeing
// scans plus an unmoved main is strong evidence, not an atomic guarantee.
//
// Usage:
//   node scripts/verify-frozen-quiescence.mjs \
//     --repo <owner/name> --frozen-main-sha <40-hex> [--out <path>]
//
// Exit 0 = quiescent; the document is written to stdout (or --out) and is the
// `--quiescence` input to scripts/capture-durable-frontier.mjs.
// Exit 2 = refused (not frozen, main moved, runs in flight, evidence unusable).
// GET only. Nothing is posted, edited, cancelled, labelled, or merged.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSingleDocument } from "../.straylight/lib/evidence.mjs";
import { acceptCommittedPolicyText } from "../.straylight/lib/policy-source.mjs";
import {
  COMMITTED_POLICY_REPO_PATH,
  committedPolicyReadPath,
  decodeCommittedFile,
  MAIN_SHA_RE,
  mainRefReadPath,
  readMainRefSha,
  readRepositoryDefaultBranch,
  repositoryMetadataReadPath,
} from "../.straylight/lib/write-authority.mjs";
import {
  buildFrozenQuiescence,
  parseWorkflowRunPages,
  writeCapableWorkflows,
} from "../.straylight/lib/frozen-quiescence.mjs";

const WORKFLOW_DIR = ".github/workflows";

function refuse(reason, detail) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...(detail ? { detail } : {}) }, null, 2) + "\n");
  process.exit(2);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

// Read-only GET. The paths come from write-authority.mjs / are built from a
// workflow path that already matched the workflow-path shape; this tool
// constructs no host and no method.
function ghGet(path, { paginate = false } = {}) {
  const argv = paginate ? ["api", "--paginate", path] : ["api", path];
  try {
    return execFileSync("gh", argv, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    refuse("read-failed", `GET ${path}: ${String(e?.message ?? e)}`);
  }
}

function requirePath(result) {
  if (!result.ok) refuse(result.reason, result.detail);
  return result.path;
}

function currentMainSha(repository) {
  const parsed = parseSingleDocument(ghGet(requirePath(mainRefReadPath(repository))));
  if (!parsed.ok) refuse("main-ref-unreadable", `${parsed.reason}: ${parsed.detail ?? ""}`);
  const read = readMainRefSha(parsed.value);
  if (!read.ok) refuse(read.reason, read.detail);
  return read.sha;
}

// One complete pass over every write-capable workflow's run history.
function scanRuns(repository, workflows, label) {
  const active = [];
  let scanned = 0;
  for (const workflow of workflows) {
    const file = workflow.slice(`${WORKFLOW_DIR}/`.length);
    const text = ghGet(`repos/${repository}/actions/workflows/${file}/runs?per_page=100`, { paginate: true });
    const parsed = parseWorkflowRunPages(text, { workflow_path: workflow });
    if (!parsed.ok) refuse(parsed.reason, `${label}: ${parsed.detail}`);
    scanned += parsed.scanned;
    active.push(...parsed.active);
  }
  active.sort((a, b) => a.run_id - b.run_id);
  process.stderr.write(
    `${label}: ${scanned} run(s) across ${workflows.length} write-capable workflow(s); ` +
      `${active.length} still in flight\n`,
  );
  return { scanned, active };
}

function reportActive(label, active) {
  return (
    `${label}: ${active.length} write-capable run(s) not in the terminal status — ` +
    active.map((r) => `${r.workflow} run ${r.run_id} (${r.status}, created ${r.created_at})`).join("; ") +
    ". Wait for them to finish and re-verify; do NOT cancel them."
  );
}

function main() {
  const repository = arg("--repo");
  const frozenMainSha = arg("--frozen-main-sha");
  const outPath = arg("--out");
  if (repository === null) refuse("usage", "--repo <owner/name> is required");
  // EXPLICIT, never resolved for the operator: this is the revision the whole
  // cutover is bound to.
  if (frozenMainSha === null) {
    refuse("usage", "--frozen-main-sha <40-hex> is required — name the frozen revision explicitly");
  }
  if (!MAIN_SHA_RE.test(frozenMainSha)) {
    refuse("frozen-main-sha-invalid", "--frozen-main-sha must be a full 40-hex commit SHA (never a branch name)");
  }

  // 2. The branch the protocol treats as authority is still the default branch.
  const meta = parseSingleDocument(ghGet(requirePath(repositoryMetadataReadPath(repository))));
  if (!meta.ok) refuse("repository-metadata-unreadable", `${meta.reason}: ${meta.detail ?? ""}`);
  const branch = readRepositoryDefaultBranch(meta.value, { repository });
  if (!branch.ok) refuse(branch.reason, branch.detail);

  // 3. Current main is EXACTLY the frozen revision.
  const before = currentMainSha(repository);
  if (before !== frozenMainSha) {
    refuse(
      "main-moved",
      `current main is ${before} but --frozen-main-sha is ${frozenMainSha} — the freeze under verification is ` +
        "not the committed state of main",
    );
  }

  // 4. The policy committed AT that revision is an accepted policy AND frozen.
  const contents = parseSingleDocument(
    ghGet(requirePath(committedPolicyReadPath(repository, frozenMainSha))),
  );
  if (!contents.ok) refuse("committed-policy-unreadable", `${contents.reason}: ${contents.detail ?? ""}`);
  const decoded = decodeCommittedFile(contents.value, { expected_path: COMMITTED_POLICY_REPO_PATH });
  if (!decoded.ok) refuse(decoded.reason, decoded.detail);
  const accepted = acceptCommittedPolicyText(decoded.text, {
    source: `${repository}@${frozenMainSha}:${COMMITTED_POLICY_REPO_PATH}`,
  });
  if (!accepted.ok) refuse(accepted.refusal, accepted.detail);
  if (accepted.value.enabled !== false) {
    refuse(
      "not-frozen",
      `the policy committed at ${frozenMainSha} has enabled ${JSON.stringify(accepted.value.enabled)} — ` +
        "quiescence is only meaningful under a committed freeze (enabled must be the boolean false)",
    );
  }

  // 5. The CLOSED SET, derived from the checkout's own workflow files.
  let files;
  try {
    files = readdirSync(WORKFLOW_DIR)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .sort()
      .map((f) => ({ path: `${WORKFLOW_DIR}/${f}`, text: readFileSync(join(WORKFLOW_DIR, f), "utf8") }));
  } catch (e) {
    refuse("workflow-scan-failed", String(e?.message ?? e));
  }
  const derived = writeCapableWorkflows(files);
  if (!derived.ok) refuse(derived.reason, derived.detail);
  process.stderr.write(`write-capable workflows: ${derived.workflows.join(", ")}\n`);

  // 6 + 7. Two complete independent scans with a main-identity check between
  // them. A run created between the scans appears in the second one; a run that
  // both starts and finishes between them does not, which is why the cutover
  // re-verifies after the capture rather than trusting this instant.
  const first = scanRuns(repository, derived.workflows, "scan 1");
  const between = currentMainSha(repository);
  if (between !== frozenMainSha) {
    refuse("main-moved", `main moved to ${between} during verification — re-run against the new frozen revision`);
  }
  const second = scanRuns(repository, derived.workflows, "scan 2");

  if (first.active.length > 0 || second.active.length > 0) {
    const active = first.active.length > 0 ? first.active : second.active;
    refuse("not-quiescent", reportActive(first.active.length > 0 ? "scan 1" : "scan 2", active));
  }

  const after = currentMainSha(repository);
  if (after !== frozenMainSha) {
    refuse("main-moved", `main moved to ${after} during verification — re-run against the new frozen revision`);
  }

  // Recorded AFTER both scans and the final identity check, so it never claims
  // to cover a moment the reads had not reached.
  const checked_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const built = buildFrozenQuiescence({
    repository,
    frozen_main_sha: frozenMainSha,
    checked_at,
    write_capable_workflows: derived.workflows,
    active_write_runs: [],
  });
  if (!built.ok) refuse("quiescence-invalid", JSON.stringify(built.errors));

  const text = JSON.stringify(built.document, null, 2) + "\n";
  if (outPath === null) process.stdout.write(text);
  else {
    writeFileSync(outPath, text);
    process.stdout.write(`wrote ${outPath}\n`);
  }
  process.stderr.write(
    `quiescent at ${checked_at}: main ${frozenMainSha} is frozen (enabled: false) and ` +
      `${first.scanned}/${second.scanned} run(s) observed across two scans are all terminal\n`,
  );
}

// Run ONLY as a CLI. Importing must not fetch.
function invokedDirectly() {
  if (typeof process.argv[1] !== "string") return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) main();
