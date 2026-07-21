#!/usr/bin/env node
// Straylight Control Plane v1 — the single shared READ executor.
//
// The ONLY production code path that performs DERIVED GitHub reads — a
// derived read is one whose target was computed from evidence (a lane's
// recorded PR number, a collection's issue slots, a PR's head SHA). Bash
// fetches only FIXED urls; every derived fetch flows through a closed
// `straylight.read-plan.v1` document authored by a checked-in planner or
// collector binary and executed here:
//
//   node .straylight/bin/execute-read-plan.mjs \
//     --plan <plan-root>/read-plan.json --plan-root <dir> \
//     --repository <owner/repo> --nonce <run-id>-<attempt> \
//     --ledger <file> \
//     [--root <collection-dir>]              # collection-scope plans
//     [--gather-1 <dir> --gather-2 <dir>]    # gathers-scope plans
//
// SECURITY POSTURE (mirrors execute-write-plan.mjs):
//   - the plan is CONTAINED: its parent directory must realpath to
//     exactly the realpath'd --plan-root and its name must be a single
//     safe path component; O_NOFOLLOW, regular file, read exactly once;
//   - the plan can express NO method, path, URL, host, header, or file
//     name: the read-kind registry (lib/read-plan.mjs) constructs every
//     GET request and every target file, and the constructed path is
//     guard-checked again here (defense in depth);
//   - every request is spawnSync("gh", argv, { shell: false }) with a
//     FIXED argv — ["api", PATH] or ["api", "--paginate", PATH]. No -X
//     flag exists anywhere in this executor: a read plan is structurally
//     unable to smuggle a write;
//   - the head SHA for check/status evidence is derived INSIDE this
//     executor from the just-fetched PR bytes via evidence.mjs parsePr
//     with full repository + PR-number binding — never by shell;
//   - ledger rows are written ONLY here (and the collector's enumeration
//     row): strict single-line JSON via appendFileSync. Bash never
//     appends a ledger row.
//
// FAILURE SEMANTICS (kind-derived, hard-coded in the registry):
//   - issue/comment fetches are FATAL: failure exits 4 with NO ledger
//     representation — the job fails outright (collection contract);
//   - PR/check/status fetches are DURABLE FACTS: failure appends an
//     explicit {fetched:false} row — never filename absence — and
//     execution continues.
//
// Exit 0 = plan executed (non-fatal failures recorded as rows).
// Exit 2 = validation refusal; ZERO gh launches, zero rows written.
// Exit 4 = execution began and a fatal failure occurred.

import {
  openSync, fstatSync, readFileSync, closeSync, realpathSync, constants,
  writeFileSync, appendFileSync, mkdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { parseStrict } from "../lib/strict-json.mjs";
import { validateReadPlan, checkConstructedReadPath, READ_KINDS, slotFileName } from "../lib/read-plan.mjs";
import { parsePr } from "../lib/evidence.mjs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function emit(result, code) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(code);
}

function refuse(code, detail) {
  emit({ ok: false, phase: "validation", refusal: code, detail }, 2);
}

const sha256 = (bytes) => "sha256:" + createHash("sha256").update(bytes).digest("hex");

// =============================================================================
// VALIDATION PHASE — any failure exits 2; zero gh launches; zero rows.
// =============================================================================

const planPath = arg("--plan");
const planRoot = arg("--plan-root");
const repository = arg("--repository");
const nonce = arg("--nonce");
const ledgerPath = arg("--ledger");
if (planPath === null || planRoot === null || repository === null || nonce === null || ledgerPath === null) {
  refuse("usage", "required: --plan <file> --plan-root <dir> --repository <owner/repo> --nonce <id>-<attempt> --ledger <file>");
}

let realPlanRoot;
try {
  realPlanRoot = realpathSync(planRoot);
} catch (e) {
  refuse("plan-root-invalid", String(e?.message ?? e));
}
const planName = basename(planPath);
if (!/^[A-Za-z0-9._-]+$/.test(planName)) {
  refuse("plan-outside-plan-root", "plan file name is not a single safe path component");
}
let realPlanDir;
try {
  realPlanDir = realpathSync(dirname(planPath));
} catch (e) {
  refuse("plan-outside-plan-root", `plan directory unresolvable: ${String(e?.message ?? e)}`);
}
if (realPlanDir !== realPlanRoot) {
  refuse("plan-outside-plan-root", "plan file does not live directly under --plan-root");
}

function readOnceNoFollow(path, label) {
  let fd;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (e) {
    if (e && e.code === "ELOOP") refuse("plan-not-regular-file", `${label}: symlink refused (O_NOFOLLOW)`);
    refuse("plan-unreadable", `${label}: ${String(e?.message ?? e)}`);
  }
  try {
    if (!fstatSync(fd).isFile()) refuse("plan-not-regular-file", `${label}: not a regular file`);
    return readFileSync(fd);
  } catch (e) {
    refuse("plan-unreadable", `${label}: ${String(e?.message ?? e)}`);
  } finally {
    try { closeSync(fd); } catch { /* fd already invalidated */ }
  }
}

const planBytes = readOnceNoFollow(join(realPlanRoot, planName), "read-plan");
const planParsed = parseStrict(planBytes.toString("utf8"));
if (!planParsed.ok) refuse("plan-malformed", `strict JSON parse failed: ${planParsed.reason}`);
const validated = validateReadPlan(planParsed.value, { repository, nonce });
if (!validated.ok) {
  const first = validated.errors[0];
  emit({ ok: false, phase: "validation", refusal: first.code, detail: first.detail, errors: validated.errors }, 2);
}
const { reads, scope, collection_id } = validated;

// Scope-specific target roots.
let realRoot = null;      // collection scope
let realGathers = null;   // gathers scope: [dir1, dir2]
if (scope === "collection") {
  const root = arg("--root");
  if (root === null) refuse("usage", "--root <collection-dir> is required for collection-scope plans");
  try {
    realRoot = realpathSync(root);
  } catch (e) {
    refuse("root-invalid", String(e?.message ?? e));
  }
} else if (scope === "gathers") {
  const g1 = arg("--gather-1");
  const g2 = arg("--gather-2");
  if (g1 === null || g2 === null) refuse("usage", "--gather-1 and --gather-2 are required for gathers-scope plans");
  try {
    realGathers = [realpathSync(g1), realpathSync(g2)];
  } catch (e) {
    refuse("gather-invalid", String(e?.message ?? e));
  }
}
// An empty plan (no reads) has no scope: nothing to execute.

// Ledger parent must exist (the ledger file itself may not yet).
try {
  realpathSync(dirname(ledgerPath));
} catch (e) {
  refuse("ledger-invalid", String(e?.message ?? e));
}

// Construct + guard EVERY request path in the validation phase so a
// malformed target can never be discovered mid-execution.
const requests = [];
for (const read of reads) {
  if (read.kind === "issue-comments") {
    requests.push({ read, paths: [
      { key: "issue", paginate: false, path: `repos/${repository}/issues/${read.issue_number}` },
      { key: "comments", paginate: true, path: `repos/${repository}/issues/${read.issue_number}/comments` },
    ]});
  } else if (read.kind === "pr") {
    requests.push({ read, paths: [
      { key: "pr", paginate: false, path: `repos/${repository}/pulls/${read.pr_number}` },
    ]});
  } else {
    // pr-into-gathers / pr-with-checks-into-gathers: the PR path now;
    // check/status paths are constructed AFTER the bound head SHA is
    // derived from the fetched PR bytes (guard-checked again then).
    requests.push({ read, paths: [
      { key: "pr", paginate: false, path: `repos/${repository}/pulls/${read.pr_number}` },
    ]});
  }
}
for (const req of requests) {
  for (const p of req.paths) {
    const bad = checkConstructedReadPath(p.path);
    if (bad !== null) refuse(bad.code, bad.detail);
  }
}

// =============================================================================
// EXECUTION PHASE — begins now. No condition below may exit 2.
// =============================================================================

const childEnv = {};
for (const key of ["PATH", "HOME", "GH_TOKEN"]) {
  if (typeof process.env[key] === "string") childEnv[key] = process.env[key];
}

const results = [];

// The ledger exists from the moment execution begins — an empty ledger is
// a valid record of "zero derived fetches attempted" (a claim with no
// slots), distinct from a missing one. Validation refusals never reach
// this line, so exit 2 still guarantees zero rows AND no ledger creation.
appendFileSync(ledgerPath, "");

function failExecution(refusal, detail) {
  emit({ ok: false, phase: "execution", refusal, detail, results }, 4);
}

// One GET. Returns { ok: true, bytes } or { ok: false }. A spawn error
// (gh unlaunchable) is ALWAYS fatal — no trustworthy result exists.
function ghGet(path, paginate) {
  const argv = paginate ? ["api", "--paginate", path] : ["api", path];
  const res = spawnSync("gh", argv, { shell: false, env: childEnv, maxBuffer: 256 * 1024 * 1024 });
  if (res.error) failExecution("gh-launch-failed", `${path}: ${String(res.error?.message ?? res.error)}`);
  if (typeof res.status !== "number") failExecution("gh-launch-failed", `${path}: gh terminated without an exit status`);
  if (res.status !== 0) return { ok: false };
  return { ok: true, bytes: res.stdout };
}

function appendRow(row) {
  appendFileSync(ledgerPath, JSON.stringify(row) + "\n");
}

try {
  for (const { read, paths } of requests) {
    const spec = READ_KINDS[read.kind];

    if (read.kind === "issue-comments") {
      // FATAL: failure has no ledger representation; the job fails.
      const dir = join(realRoot, `issue-${read.issue_number}`);
      mkdirSync(dir, { recursive: true });
      for (const p of paths) {
        const got = ghGet(p.path, p.paginate);
        if (!got.ok) {
          failExecution("fatal-read-failed", `${read.kind} issue #${read.issue_number}: GET ${p.path} failed`);
        }
        const fileName = p.key === "issue" ? "issue.json" : "comments.pages";
        const relPath = `issue-${read.issue_number}/${fileName}`;
        writeFileSync(join(realRoot, relPath), got.bytes);
        appendRow({
          nonce, collection_id,
          resource: p.key === "issue" ? "issue" : "comments",
          issue_number: read.issue_number,
          fetched: true, path: relPath, sha256: sha256(got.bytes),
        });
        results.push({ kind: read.kind, path: relPath, status: "ok" });
      }
      continue;
    }

    if (read.kind === "pr") {
      // DURABLE FACT: failure is an explicit {fetched:false} row.
      const got = ghGet(paths[0].path, false);
      const relPath = `issue-${read.issue_number}/pr-${read.pr_number}.json`;
      if (got.ok) {
        mkdirSync(join(realRoot, `issue-${read.issue_number}`), { recursive: true });
        writeFileSync(join(realRoot, relPath), got.bytes);
        appendRow({
          nonce, collection_id, resource: "pr",
          issue_number: read.issue_number, pr_number: read.pr_number,
          fetched: true, path: relPath, sha256: sha256(got.bytes),
        });
        results.push({ kind: read.kind, path: relPath, status: "ok" });
      } else {
        appendRow({
          nonce, collection_id, resource: "pr",
          issue_number: read.issue_number, pr_number: read.pr_number,
          fetched: false,
        });
        results.push({ kind: read.kind, path: relPath, status: "fetch-failed (durable row)" });
      }
      continue;
    }

    // pr-into-gathers / pr-with-checks-into-gathers: one attempt per gather.
    const withChecks = read.kind === "pr-with-checks-into-gathers";
    for (const gather of [1, 2]) {
      const dir = realGathers[gather - 1];
      const prGot = ghGet(paths[0].path, false);
      let headSha = null;
      if (prGot.ok) {
        writeFileSync(join(dir, slotFileName("pr")), prGot.bytes);
        appendRow({
          nonce, gather, slot: "pr", pr_number: read.pr_number,
          fetched: true, path: slotFileName("pr"), sha256: sha256(prGot.bytes),
        });
        results.push({ kind: read.kind, gather, slot: "pr", status: "ok" });
        if (withChecks) {
          // The bound head derivation: evidence.mjs, never shell.
          const parsed = parsePr(prGot.bytes.toString("utf8"), { repository, pr_number: read.pr_number });
          if (parsed.ok) headSha = parsed.pr.head_sha;
        }
      } else {
        appendRow({ nonce, gather, slot: "pr", pr_number: read.pr_number, fetched: false });
        results.push({ kind: read.kind, gather, slot: "pr", status: "fetch-failed (durable row)" });
      }

      if (!withChecks) continue;
      for (const [slot, paginate, mk] of [
        ["check-runs", true, (sha) => `repos/${repository}/commits/${sha}/check-runs`],
        ["status", false, (sha) => `repos/${repository}/commits/${sha}/status`],
      ]) {
        if (headSha === null) {
          // No bound head → checks are unfetchable: explicit failure rows.
          appendRow({ nonce, gather, slot, pr_number: read.pr_number, fetched: false });
          results.push({ kind: read.kind, gather, slot, status: "unfetchable (no bound head)" });
          continue;
        }
        const path = mk(headSha);
        const bad = checkConstructedReadPath(path);
        if (bad !== null) failExecution(bad.code, bad.detail); // defense in depth
        const got = ghGet(path, paginate);
        if (got.ok) {
          writeFileSync(join(dir, slotFileName(slot)), got.bytes);
          appendRow({
            nonce, gather, slot, pr_number: read.pr_number, sha: headSha,
            fetched: true, path: slotFileName(slot), sha256: sha256(got.bytes),
          });
          results.push({ kind: read.kind, gather, slot, status: "ok" });
        } else {
          appendRow({ nonce, gather, slot, pr_number: read.pr_number, fetched: false });
          results.push({ kind: read.kind, gather, slot, status: "fetch-failed (durable row)" });
        }
      }
    }
  }
} catch (e) {
  failExecution("execution-exception", String(e?.message ?? e));
}

emit({ ok: true, phase: "execution", results }, 0);
