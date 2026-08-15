// Straylight Control Plane v2 — WRITE AUTHORITY BINDING (pure).
//
// WHY THIS FILE EXISTS (Codex H-02)
//
// A workflow run can BEGIN before a freeze is merged and FINISH after it. It
// gates on the policy at start, reconstructs state, authors a write plan, and
// only then executes. Nothing in that sequence re-asked whether the authority
// it planned under was still the authority, and the executor reloaded no
// policy of its own — so a plan authored while `enabled: true` was the
// committed state could still perform durable GitHub mutations minutes after
// `enabled: false` had been merged. A committed freeze was a PLANNING fence,
// never a DURABLE-WRITE fence.
//
// THE RULE THIS MODULE ENCODES
//
//   A durable GitHub mutation may execute only while BOTH hold:
//     1. the exact repository revision whose policy authorized the write plan
//        is STILL the current committed main, AND
//     2. the accepted policy committed AT that revision still permits
//        autonomous writes (`enabled === true`).
//
//   Historical evidence that the plan was valid earlier is NOT present write
//   authority. A plan is a proposal bound to a revision, not a licence.
//
// Every write plan therefore carries the closed `authority` object below,
// naming the exact commit the plan was produced at and the canonical digest of
// the accepted policy that governed the planning. The executor re-establishes
// BOTH from GitHub, read-only, immediately before EVERY mutation, and refuses
// on any mismatch (bin/execute-write-plan.mjs).
//
// Binding to a COMMIT, not to a policy document alone, is deliberate: the
// policy file has no repository identity of its own, so "the same policy
// bytes" could be true on a branch, in a fork, or at an abandoned revision.
// The commit is what makes "still current" a question GitHub can answer.
//
// WHAT THIS DOES NOT CLAIM. GitHub offers no compare-and-write on issue
// comments, so a microscopic window remains between the last read that proved
// authority and the mutation that follows it. The window is bounded by two API
// round trips per operation and is documented, not papered over — see
// bin/execute-write-plan.mjs § "residual TOCTOU".
//
// No network and no process spawning anywhere in this module. Every decision
// function is pure; the ONE exception is resolveSourceMainSha, which reads the
// single small file a workflow materialized from its own checkout (J3 — see its
// comment). The executor owns process launch and hands the raw parsed responses
// to the parsers here.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { payloadDigest } from "./canonical.mjs";

// The full immutable commit SHA of a checkout. A branch NAME is never
// acceptable: "main" is a moving target, and the whole point is to name the
// revision that cannot move.
export const MAIN_SHA_RE = /^[0-9a-f]{40}$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

// The closed authority object. Two fields, both required, nothing else.
export const AUTHORITY_KEYS = Object.freeze(["source_main_sha", "policy_digest"]);

// The compiled-in identity of the authority branch and of the committed policy
// document. Neither is caller-supplied: a plan cannot name a different branch,
// and the executor cannot be pointed at a different file.
export const EXPECTED_DEFAULT_BRANCH = "main";
export const MAIN_REF = "refs/heads/main";
export const COMMITTED_POLICY_REPO_PATH = ".straylight/automation-policy.json";

// The canonical content digest of a policy, via the protocol's single
// canonicalizer (RFC-8785-style canonical JSON — lib/canonical.mjs), the same
// primitive that pins task packets, audit records, and accepted admission
// epochs. Digesting the PARSED value means key order and whitespace in the
// file are irrelevant: what is bound is the policy's meaning.
export function policyAuthorityDigest(policy) {
  return payloadDigest(policy);
}

// Shape rules for plan.authority. Returns [] or {code, detail} rows in the
// write-plan error shape so validatePlan can splice them in directly.
export function authorityShapeErrors(authority) {
  const errors = [];
  if (authority === null || typeof authority !== "object" || Array.isArray(authority)) {
    return [{
      code: "authority-missing",
      detail: "plan.authority must be an object naming {source_main_sha, policy_digest} — " +
        "no plan may execute without its write-authority binding",
    }];
  }
  for (const key of Object.keys(authority)) {
    if (!AUTHORITY_KEYS.includes(key)) {
      errors.push({ code: "unknown-field", detail: `plan.authority.${key}` });
    }
  }
  if (typeof authority.source_main_sha !== "string" || !MAIN_SHA_RE.test(authority.source_main_sha)) {
    errors.push({
      code: "authority-invalid",
      detail: "plan.authority.source_main_sha must be a full 40-hex commit SHA (never a branch name)",
    });
  }
  if (typeof authority.policy_digest !== "string" || !DIGEST_RE.test(authority.policy_digest)) {
    errors.push({
      code: "authority-invalid",
      detail: "plan.authority.policy_digest must be sha256:<64 hex>",
    });
  }
  return errors;
}

// Build the binding a planner embeds. `source_main_sha` must already have been
// derived MECHANICALLY from the checkout the planning ran in (the workflow
// writes `git rev-parse HEAD` to a file and the planner reads and validates
// that file itself — bash never substitutes derived content into an argument);
// `policy` is the exact accepted policy object the planner loaded and reasoned
// under, not a description of it.
export function buildWriteAuthority({ source_main_sha, policy }) {
  if (typeof source_main_sha !== "string" || !MAIN_SHA_RE.test(source_main_sha)) {
    return {
      ok: false,
      reason: "source-main-sha-invalid",
      detail: "source main SHA must be 40 lowercase hex derived from the checkout",
    };
  }
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    return { ok: false, reason: "authority-policy-missing", detail: "no policy object to bind" };
  }
  return {
    ok: true,
    authority: { source_main_sha, policy_digest: policyAuthorityDigest(policy) },
  };
}

// Resolve the planning checkout's commit SHA for every write-plan producer.
// ONE implementation, four callers (reducer, watchdog, merge guard, bootstrap):
// this value decides whether a durable mutation may happen at all, and four
// hand-copied argument readers is four chances for one of them to drift.
//
// The SHA arrives either literally (--source-main-sha, tests) or as a file the
// workflow materialized with `git rev-parse HEAD` (--source-main-sha-file). The
// file form exists so bash never substitutes derived content into an argument
// (J3): the callee reads the file and validates the bytes itself. Exactly one
// form is required — a producer with no source SHA cannot plan a write.
export function resolveSourceMainSha({ literal, filePath }) {
  if (literal === null && filePath === null) {
    return { ok: false, reason: "usage", detail: "--source-main-sha or --source-main-sha-file is required" };
  }
  if (literal !== null && filePath !== null) {
    return { ok: false, reason: "usage", detail: "--source-main-sha and --source-main-sha-file are mutually exclusive" };
  }
  let sha = literal;
  if (filePath !== null) {
    try {
      sha = readFileSync(resolve(filePath), "utf8").trim();
    } catch (e) {
      return { ok: false, reason: "source-main-sha-unreadable", detail: String(e?.message ?? e) };
    }
  }
  if (typeof sha !== "string" || !MAIN_SHA_RE.test(sha)) {
    return { ok: false, reason: "source-main-sha-invalid", detail: "source main SHA must be 40 lowercase hex" };
  }
  return { ok: true, sha };
}

// THE WRITE-TIME CHECK. `current_main_sha` and `current_policy` must have been
// established independently of the local checkout — the local tree is what the
// stale run already believes, so trusting it would prove nothing.
//
// Order matters for diagnosis, not for safety: revision identity first (a
// moved main invalidates everything downstream), then the policy that revision
// commits, then whether that policy permits writes at all.
export function authorityStillCurrent({ authority, current_main_sha, current_policy }) {
  const shape = authorityShapeErrors(authority);
  if (shape.length > 0) {
    return { ok: false, refusal: shape[0].code, detail: shape.map((e) => e.detail).join("; ") };
  }
  if (typeof current_main_sha !== "string" || !MAIN_SHA_RE.test(current_main_sha)) {
    return {
      ok: false,
      refusal: "authority-main-unreadable",
      detail: "current main SHA was not established as a 40-hex commit",
    };
  }
  if (current_main_sha !== authority.source_main_sha) {
    return {
      ok: false,
      refusal: "authority-main-moved",
      detail: `plan was authorized at main ${authority.source_main_sha} but current main is ${current_main_sha} — ` +
        "the revision that authorized this plan is no longer the committed authority",
    };
  }
  if (current_policy === null || typeof current_policy !== "object" || Array.isArray(current_policy)) {
    return {
      ok: false,
      refusal: "authority-policy-unreadable",
      detail: "no accepted policy object was established at the current main SHA",
    };
  }
  const currentDigest = policyAuthorityDigest(current_policy);
  if (currentDigest !== authority.policy_digest) {
    return {
      ok: false,
      refusal: "authority-policy-digest-mismatch",
      detail: `plan was authorized under policy ${authority.policy_digest} but the policy committed at ` +
        `${current_main_sha} digests to ${currentDigest}`,
    };
  }
  // LITERAL BOOLEAN, like the policy gate: "true", 1, and {} are not consent.
  if (current_policy.enabled !== true) {
    return {
      ok: false,
      refusal: "authority-policy-disabled",
      detail: "the accepted policy committed at the current main SHA does not permit autonomous writes " +
        "(enabled is not the boolean true)",
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// The read-only endpoints, constructed HERE.
//
// Same discipline as the write-plan kind registry: the executor expresses no
// path, method, host, or URL of its own. It asks this module for a path and
// issues a GET. Nothing caller-supplied reaches a path except a repository that
// matched the shape below (and, at the executor, the write-plan repository
// allowlist), a SHA that already matched MAIN_SHA_RE, and a workflow path that
// already matched WORKFLOW_FILE_PATH_RE. Every path is fixed apart from those
// validated components: no caller supplies a host, a ref, or a path fragment.
// ---------------------------------------------------------------------------

const REPOSITORY_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

function repoPrefix(repository) {
  if (typeof repository !== "string" || !REPOSITORY_RE.test(repository)) return null;
  return `repos/${repository}`;
}

function pathRefusal(detail) {
  return { ok: false, reason: "authority-read-path-invalid", detail };
}

export function repositoryMetadataReadPath(repository) {
  const prefix = repoPrefix(repository);
  if (prefix === null) return pathRefusal("repository is not <owner>/<name>");
  return { ok: true, path: prefix };
}

export function mainRefReadPath(repository) {
  const prefix = repoPrefix(repository);
  if (prefix === null) return pathRefusal("repository is not <owner>/<name>");
  return { ok: true, path: `${prefix}/git/ref/heads/${EXPECTED_DEFAULT_BRANCH}` };
}

// The committed policy AT AN EXACT COMMIT. `?ref=<40-hex>` is what makes this a
// read of history rather than of a moving branch — the whole point of pinning
// authority to a revision.
export function committedPolicyReadPath(repository, main_sha) {
  const prefix = repoPrefix(repository);
  if (prefix === null) return pathRefusal("repository is not <owner>/<name>");
  if (typeof main_sha !== "string" || !MAIN_SHA_RE.test(main_sha)) {
    return pathRefusal("commit SHA is not 40 lowercase hex");
  }
  return { ok: true, path: `${prefix}/contents/${COMMITTED_POLICY_REPO_PATH}?ref=${main_sha}` };
}

// ---------------------------------------------------------------------------
// The workflow tree AT AN EXACT COMMIT (Codex quiescence-provenance, MEDIUM).
//
// The write-capable workflow set is derived by scanning workflow bytes. Which
// bytes is the whole question. Reading them from the local checkout binds the
// derivation to whatever tree the process happens to be running in — a feature
// branch, a synthetic directory, a fabricated `.github/workflows` planted by the
// caller — so `frozen_main_sha` named a revision the workflow set did not come
// from. These paths make the frozen commit the source: `?ref=<40-hex>` on both
// the directory listing and every file inside it, so the set is a fact about
// that commit and nothing else can supply it.
// ---------------------------------------------------------------------------

export const WORKFLOW_DIR_REPO_PATH = ".github/workflows";

// A workflow file as GitHub reports it and as the repository stores it. Declared
// here rather than imported from frozen-quiescence.mjs for the same reason
// MAIN_SHA_RE is declared there as FROZEN_MAIN_SHA_RE: neither module may depend
// on the other. A test pins the two source strings together.
const WORKFLOW_FILE_PATH_RE = /^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/;

// GitHub's contents API returns at most 1000 entries for a directory and
// TRUNCATES SILENTLY past that. A truncated listing cannot prove it enumerated
// every workflow, and an unenumerated workflow is an unscanned write path.
const CONTENTS_DIRECTORY_LIMIT = 1000;

// GET repos/{owner}/{repo}/contents/.github/workflows?ref=<sha> — the workflow
// directory as it exists at that exact commit.
export function workflowDirectoryReadPath(repository, commit_sha) {
  const prefix = repoPrefix(repository);
  if (prefix === null) return pathRefusal("repository is not <owner>/<name>");
  if (typeof commit_sha !== "string" || !MAIN_SHA_RE.test(commit_sha)) {
    return pathRefusal("commit SHA is not 40 lowercase hex");
  }
  return { ok: true, path: `${prefix}/contents/${WORKFLOW_DIR_REPO_PATH}?ref=${commit_sha}` };
}

// GET repos/{owner}/{repo}/contents/.github/workflows/<file>?ref=<sha> — one
// workflow's bytes at that exact commit. The path must be one this module's own
// shape accepts, so a listing entry cannot walk out of the workflow directory.
export function workflowFileReadPath(repository, commit_sha, workflow_path) {
  const prefix = repoPrefix(repository);
  if (prefix === null) return pathRefusal("repository is not <owner>/<name>");
  if (typeof commit_sha !== "string" || !MAIN_SHA_RE.test(commit_sha)) {
    return pathRefusal("commit SHA is not 40 lowercase hex");
  }
  if (typeof workflow_path !== "string" || !WORKFLOW_FILE_PATH_RE.test(workflow_path)) {
    return pathRefusal(`workflow path ${JSON.stringify(workflow_path ?? null)} is not ${WORKFLOW_DIR_REPO_PATH}/<file>.yml`);
  }
  return { ok: true, path: `${prefix}/contents/${workflow_path}?ref=${commit_sha}` };
}

// GET repos/{owner}/{repo}/actions/workflows/<file>/runs — run history is a
// property of the repository, not of a commit, so this path carries no ref.
export function workflowRunsReadPath(repository, workflow_path) {
  const prefix = repoPrefix(repository);
  if (prefix === null) return pathRefusal("repository is not <owner>/<name>");
  if (typeof workflow_path !== "string" || !WORKFLOW_FILE_PATH_RE.test(workflow_path)) {
    return pathRefusal(`workflow path ${JSON.stringify(workflow_path ?? null)} is not ${WORKFLOW_DIR_REPO_PATH}/<file>.yml`);
  }
  const file = workflow_path.slice(WORKFLOW_DIR_REPO_PATH.length + 1);
  return { ok: true, path: `${prefix}/actions/workflows/${file}/runs?per_page=100` };
}

// ---------------------------------------------------------------------------
// Read-only response parsers (pure over an ALREADY strict-parsed response).
// Each one refuses rather than guessing: a response the protocol cannot read
// is not evidence that authority is current.
// ---------------------------------------------------------------------------

// GET repos/{owner}/{repo} — used only to confirm that the branch the
// protocol treats as authority is still this repository's default branch. A
// default-branch switch is an authority move and must not pass silently.
export function readRepositoryDefaultBranch(value, { repository }) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "repository-metadata-unreadable", detail: "response is not a JSON object" };
  }
  if (value.full_name !== repository) {
    return {
      ok: false,
      reason: "repository-metadata-unreadable",
      detail: `response full_name ${JSON.stringify(value.full_name ?? null)} is not ${repository}`,
    };
  }
  if (value.default_branch !== EXPECTED_DEFAULT_BRANCH) {
    return {
      ok: false,
      reason: "default-branch-moved",
      detail: `default branch is ${JSON.stringify(value.default_branch ?? null)}, not ${EXPECTED_DEFAULT_BRANCH}`,
    };
  }
  return { ok: true, default_branch: EXPECTED_DEFAULT_BRANCH };
}

// GET repos/{owner}/{repo}/git/ref/heads/main — the exact commit main points
// at right now.
export function readMainRefSha(value, { expected_ref = MAIN_REF } = {}) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "main-ref-unreadable", detail: "response is not a JSON object" };
  }
  if (value.ref !== expected_ref) {
    return {
      ok: false,
      reason: "main-ref-unreadable",
      detail: `response ref ${JSON.stringify(value.ref ?? null)} is not ${expected_ref}`,
    };
  }
  const object = value.object;
  if (object === null || typeof object !== "object" || Array.isArray(object)) {
    return { ok: false, reason: "main-ref-unreadable", detail: "response carries no object" };
  }
  if (object.type !== "commit") {
    return {
      ok: false,
      reason: "main-ref-unreadable",
      detail: `${expected_ref} points at ${JSON.stringify(object.type ?? null)}, not a commit`,
    };
  }
  if (typeof object.sha !== "string" || !MAIN_SHA_RE.test(object.sha)) {
    return { ok: false, reason: "main-ref-unreadable", detail: "object.sha is not a 40-hex commit SHA" };
  }
  return { ok: true, sha: object.sha };
}

// Canonical base64 only: GitHub wraps the contents payload at 60 columns, so
// newlines are stripped, but nothing else is tolerated. Re-encoding the
// decoded bytes must reproduce the payload exactly — a non-canonical encoding
// (embedded whitespace, alternate alphabet, bogus padding) decodes to
// SOMETHING under Buffer's lenient parser, and "something" is not evidence.
function decodeCanonicalBase64(content) {
  if (typeof content !== "string") return null;
  const compact = content.replace(/\n/g, "").replace(/\r/g, "");
  if (compact.length === 0 || compact.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) return null;
  const bytes = Buffer.from(compact, "base64");
  if (bytes.toString("base64") !== compact) return null;
  return bytes;
}

// GET repos/{owner}/{repo}/contents/<path>?ref=<sha> — the file as committed
// AT that exact revision. The response must describe the file the caller
// asked for; a response about some other path is refused rather than read.
export function decodeCommittedFile(value, { expected_path }) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "committed-file-unreadable", detail: "response is not a JSON object" };
  }
  if (value.type !== "file") {
    return {
      ok: false,
      reason: "committed-file-unreadable",
      detail: `response type ${JSON.stringify(value.type ?? null)} is not "file"`,
    };
  }
  if (value.path !== expected_path) {
    return {
      ok: false,
      reason: "committed-file-unreadable",
      detail: `response path ${JSON.stringify(value.path ?? null)} is not ${expected_path}`,
    };
  }
  if (value.encoding !== "base64") {
    return {
      ok: false,
      reason: "committed-file-unreadable",
      detail: `response encoding ${JSON.stringify(value.encoding ?? null)} is not base64`,
    };
  }
  const bytes = decodeCanonicalBase64(value.content);
  if (bytes === null) {
    return { ok: false, reason: "committed-file-unreadable", detail: "content is not canonical base64" };
  }
  if (Number.isInteger(value.size) && value.size !== bytes.length) {
    return {
      ok: false,
      reason: "committed-file-unreadable",
      detail: `declared size ${value.size} does not match ${bytes.length} decoded bytes`,
    };
  }
  return { ok: true, text: bytes.toString("utf8"), bytes };
}

// GET repos/{owner}/{repo}/contents/.github/workflows?ref=<sha> — a DIRECTORY
// listing, so the response is a JSON array rather than an object.
//
// Fails closed on everything that would make the enumeration incomplete or
// ambiguous, because an unenumerated workflow is an unscanned write path:
// a non-array response, a listing at the API's truncation limit, an entry that
// is not a plain file (a subdirectory could hide files this enumeration would
// never see), a path outside the workflow directory, a name that ends in .yml
// but that this module's shape does not accept, a missing blob sha, or the same
// path twice. Non-YAML entries are not workflows and are skipped.
//
// Returns { ok: true, entries: [{ path, sha }] } sorted by path. The blob sha
// travels with each entry so the later per-file read can be bound to the exact
// object the frozen tree listed.
export function readWorkflowDirectory(value, { expected_dir = WORKFLOW_DIR_REPO_PATH } = {}) {
  const refuse = (detail) => ({ ok: false, reason: "workflow-directory-unreadable", detail });
  if (!Array.isArray(value)) {
    return refuse(`${expected_dir}: response is not a JSON array — a directory listing was expected`);
  }
  if (value.length >= CONTENTS_DIRECTORY_LIMIT) {
    return {
      ok: false,
      reason: "workflow-directory-truncated",
      detail: `${expected_dir}: ${value.length} entries meets the contents API's ${CONTENTS_DIRECTORY_LIMIT}-entry ` +
        "limit, past which listings truncate silently; the enumeration cannot be proven complete",
    };
  }
  const entries = [];
  const seen = new Set();
  for (const [i, entry] of value.entries()) {
    const at = `${expected_dir}[${i}]`;
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return refuse(`${at}: not an object`);
    if (entry.type !== "file") {
      return refuse(
        `${at}: type ${JSON.stringify(entry.type ?? null)} is not "file" — only plain files are enumerable, and a ` +
          "non-file entry could hide workflow bytes this listing would never report",
      );
    }
    if (typeof entry.path !== "string" || !entry.path.startsWith(`${expected_dir}/`) ||
        entry.path.slice(expected_dir.length + 1).includes("/")) {
      return refuse(`${at}: path ${JSON.stringify(entry.path ?? null)} is not a direct child of ${expected_dir}`);
    }
    const yaml = entry.path.endsWith(".yml") || entry.path.endsWith(".yaml");
    if (yaml && !WORKFLOW_FILE_PATH_RE.test(entry.path)) {
      return refuse(
        `${at}: path ${JSON.stringify(entry.path)} is a YAML workflow whose name this protocol cannot address ` +
          "safely; refusing rather than omitting it from the derivation",
      );
    }
    if (!yaml) continue;
    // Git object ids share the 40-hex shape MAIN_SHA_RE describes.
    if (typeof entry.sha !== "string" || !MAIN_SHA_RE.test(entry.sha)) {
      return refuse(`${at}: sha ${JSON.stringify(entry.sha ?? null)} is not a 40-hex blob id`);
    }
    if (seen.has(entry.path)) return refuse(`${at}: ${entry.path} is listed twice`);
    seen.add(entry.path);
    entries.push({ path: entry.path, sha: entry.sha });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { ok: true, entries };
}

// One workflow's committed bytes, bound to the blob the frozen tree listed.
// `expected_sha` is REQUIRED: without it the response could be any revision's
// copy of that path, and "the bytes at the frozen commit" would be an assumption
// rather than a check.
export function decodeCommittedWorkflowFile(value, { expected_path, expected_sha }) {
  if (typeof expected_sha !== "string" || !MAIN_SHA_RE.test(expected_sha)) {
    return {
      ok: false,
      reason: "committed-file-unreadable",
      detail: `${expected_path}: no 40-hex blob sha to bind the response to`,
    };
  }
  const decoded = decodeCommittedFile(value, { expected_path });
  if (!decoded.ok) return decoded;
  const sha = value.sha;
  if (typeof sha !== "string" || sha !== expected_sha) {
    return {
      ok: false,
      reason: "committed-file-unreadable",
      detail: `${expected_path}: response blob sha ${JSON.stringify(sha ?? null)} is not the ${expected_sha} the ` +
        "frozen tree listed — these are not the bytes committed at that revision",
    };
  }
  return decoded;
}
