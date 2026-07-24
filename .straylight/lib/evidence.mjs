// Straylight Control Plane v1 — shared raw-evidence parser (pure, no network).
//
// Every byte of GitHub evidence a control-plane writer consumes flows
// through this module before anything derives from it. It enforces, fail
// closed, the workflow-boundary evidence invariants:
//
//   N1 — GLOBAL UNIQUENESS: issue numbers, comment IDs, check-run IDs and
//        combined-status IDs must be unique across the COMPLETE paginated
//        response. A duplicate is refused even when totals stay consistent —
//        a duplicated passing check-run must never compensate for an
//        omitted failing one.
//   N2 — TARGET BINDING: every object proves it belongs to the expected
//        repository / issue / PR / exact commit SHA by EXACT full-string
//        equality against a URL (or field) constructed from the validated
//        expectation. Substring matching is never used: a crafted
//        `evil.example/api.github.com/...` or `<repo>-evil` URL can never
//        pass an exact-equality check.
//   N5 — TIMESTAMP CHRONOLOGY: where a profile requires the
//        created_at/updated_at pair, both must be strict valid UTC calendar
//        instants (parseIsoInstant — no lexical comparison) satisfying
//        updated_at >= created_at. Malformed, missing-where-required, or
//        reversed chronology is refused; nothing is silently normalized.
//
// Stream discipline: a raw `gh api --paginate` stream is one JSON document
// per page, concatenated. A ZERO-BYTE (or whitespace-only) stream is
// INVALID — a failed fetch must never read as empty evidence. One parsed
// `[]` page IS valid empty evidence. Junk between documents, truncation,
// imbalance, or a page of the wrong shape refuses the whole stream.
//
// Parsing authority: every document goes through parseStrict
// (strict-json.mjs), which rejects duplicate object keys anywhere — the
// built-in JSON.parse keeps the last duplicate, a payload-smuggling
// surface this module must not inherit.
//
// Profiles are operation-specific minimums (C3): each parser validates
// exactly the fields its consumers derive from, and nothing else.
// Every function returns { ok: true, ... } or { ok: false, reason, detail? }.

import { parseStrict } from "./strict-json.mjs";
import { parseIsoInstant } from "./validate.mjs";

const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const API_ROOT = "https://api.github.com";

// Combined-status entry states are the complete GitHub vocabulary; the
// top-level rollup state is the complete rollup vocabulary. Anything else
// is unknown evidence and unknown fails closed.
const STATUS_ENTRY_STATES = new Set(["error", "failure", "pending", "success"]);
const COMBINED_STATES = new Set(["success", "failure", "pending"]);

function bad(reason, detail) {
  return detail === undefined ? { ok: false, reason } : { ok: false, reason, detail };
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// Stream splitting (raw --paginate byte stream → strict-parsed documents)
// ---------------------------------------------------------------------------

// Split the concatenated top-level JSON documents `gh api --paginate`
// emits. Tracks string/escape state so brackets inside strings never
// confuse a document boundary; anything at top level other than whitespace
// between documents is junk (fail closed). Returns the raw document
// substrings or null on ANY imbalance — the caller must treat null as a
// stream failure, never as an empty page set.
function splitTopLevelDocuments(text) {
  const docs = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      if (depth === 0) return null; // bare top-level string is junk
      inString = true;
      continue;
    }
    if (c === "[" || c === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (c === "]" || c === "}") {
      depth -= 1;
      if (depth < 0) return null;
      if (depth === 0) {
        docs.push(text.slice(start, i + 1));
        start = -1;
      }
      continue;
    }
    if (depth === 0 && !/\s/.test(c)) return null; // junk between documents
  }
  if (depth !== 0 || inString) return null;
  return docs;
}

// Parse a raw multi-page stream into strict-parsed page documents.
// A zero-byte / whitespace-only stream is INVALID (a failed fetch is not
// empty evidence); duplicate keys anywhere refuse the stream.
export function parsePageStream(text) {
  if (typeof text !== "string") return bad("stream-malformed", "not a string");
  if (text.trim().length === 0) return bad("empty-stream", "zero-byte response stream is not evidence");
  const raw = splitTopLevelDocuments(text);
  if (raw === null || raw.length === 0) {
    return bad("stream-malformed", "expected one well-formed JSON document per page");
  }
  const pages = [];
  for (const doc of raw) {
    const parsed = parseStrict(doc);
    if (!parsed.ok) return bad("document-malformed", `strict JSON parse failed: ${parsed.reason}`);
    pages.push(parsed.value);
  }
  return { ok: true, pages };
}

// Parse a single-document response (issue / PR / combined-status fetch).
// Exactly one strict-parsed top-level object; anything else refuses.
export function parseSingleDocument(text) {
  if (typeof text !== "string") return bad("stream-malformed", "not a string");
  if (text.trim().length === 0) return bad("empty-stream", "zero-byte response stream is not evidence");
  const parsed = parseStrict(text);
  if (!parsed.ok) return bad("document-malformed", `strict JSON parse failed: ${parsed.reason}`);
  if (!isPlainObject(parsed.value)) return bad("document-not-object");
  return { ok: true, value: parsed.value };
}

// ---------------------------------------------------------------------------
// Shared field checks
// ---------------------------------------------------------------------------

// N5 — require a strict-instant created_at/updated_at pair with
// updated_at >= created_at. `where` names the entry for the detail string.
function checkTimestampPair(entry, where) {
  for (const key of ["created_at", "updated_at"]) {
    if (typeof entry[key] !== "string") {
      return bad("timestamp-invalid", `${where}: ${key} missing or not a string`);
    }
  }
  const c = parseIsoInstant(entry.created_at);
  const u = parseIsoInstant(entry.updated_at);
  if (c === null) return bad("timestamp-invalid", `${where}: created_at is not a strict UTC instant`);
  if (u === null) return bad("timestamp-invalid", `${where}: updated_at is not a strict UTC instant`);
  if (u < c) return bad("timestamp-chronology", `${where}: updated_at precedes created_at`);
  return { ok: true };
}

// Validate the caller's EXPECTATION values before they are used to build
// exact-equality binding strings — a malformed expectation must never
// silently weaken a binding check.
function checkExpectedRepository(repository) {
  if (typeof repository !== "string" || !REPO_RE.test(repository)) {
    return bad("expectation-invalid", "expected repository malformed");
  }
  return { ok: true };
}

function checkExpectedNumber(n, name) {
  if (!Number.isInteger(n) || n < 1) {
    return bad("expectation-invalid", `expected ${name} must be a positive integer`);
  }
  return { ok: true };
}

function checkExpectedSha(sha) {
  if (typeof sha !== "string" || !SHA_RE.test(sha)) {
    return bad("expectation-invalid", "expected sha must be 40 lowercase hex");
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Issue enumeration (repos/{repo}/issues?... --paginate)
// ---------------------------------------------------------------------------

// Profile options:
//   repository        — when set, EVERY entry must bind by exact URL
//                       equality to this repository (N2).
//   requireTimestamps — when true, EVERY entry must carry a valid
//                       chronological created_at/updated_at pair (N5).
// N1 (globally unique issue numbers, pull requests included — they share
// the number space) is enforced unconditionally.
//
// Returns { ok, issues: [{number, body, created_at?, updated_at?}...],
//           excluded_prs: [number...] } — pull requests are never issues,
// but their numbers still participate in uniqueness.
export function parseIssuePages(text, { repository = null, requireTimestamps = false } = {}) {
  if (repository !== null) {
    const r = checkExpectedRepository(repository);
    if (!r.ok) return r;
  }
  const stream = parsePageStream(text);
  if (!stream.ok) return stream;
  const issues = [];
  const excludedPrs = [];
  const seen = new Set();
  for (const page of stream.pages) {
    if (!Array.isArray(page)) return bad("page-not-array", "an enumeration page is not an array");
    for (const item of page) {
      if (!isPlainObject(item)) return bad("entry-not-object", "an issue entry is not an object");
      if (!Number.isInteger(item.number) || item.number < 1) {
        return bad("issue-number-invalid", "an issue entry lacks a positive integer number");
      }
      if (seen.has(item.number)) {
        return bad("duplicate-issue-number", `issue #${item.number} appears more than once in the enumeration`);
      }
      seen.add(item.number);
      if (repository !== null) {
        const expected = `${API_ROOT}/repos/${repository}/issues/${item.number}`;
        if (item.url !== expected) {
          return bad("binding-url-mismatch", `issue #${item.number}: url does not equal ${expected}`);
        }
      }
      if (requireTimestamps) {
        const t = checkTimestampPair(item, `issue #${item.number}`);
        if (!t.ok) return t;
      }
      if (Object.prototype.hasOwnProperty.call(item, "pull_request")) {
        excludedPrs.push(item.number); // PRs are never lane issues
        continue;
      }
      if (item.body !== undefined && item.body !== null && typeof item.body !== "string") {
        return bad("body-invalid", `issue #${item.number}: body is neither string nor null`);
      }
      const entry = {
        number: item.number,
        body: typeof item.body === "string" ? item.body : null,
      };
      if (requireTimestamps) {
        entry.created_at = item.created_at;
        entry.updated_at = item.updated_at;
      }
      issues.push(entry);
    }
  }
  return { ok: true, issues, excluded_prs: excludedPrs };
}

// ---------------------------------------------------------------------------
// Single issue fetch (repos/{repo}/issues/{n})
// ---------------------------------------------------------------------------

// Binds to the exact repository AND issue number; refuses pull requests
// (a PR fetched through the issues endpoint is never a lane issue); always
// requires the chronological timestamp pair — issue updated_at is the
// last-activity basis the watchdog scan rules consume.
export function parseIssue(text, { repository, issue_number }) {
  const r = checkExpectedRepository(repository);
  if (!r.ok) return r;
  const n = checkExpectedNumber(issue_number, "issue_number");
  if (!n.ok) return n;
  const doc = parseSingleDocument(text);
  if (!doc.ok) return doc;
  const issue = doc.value;
  if (issue.number !== issue_number) {
    return bad("binding-issue-mismatch", `fetched issue #${issue.number} != expected #${issue_number}`);
  }
  const expected = `${API_ROOT}/repos/${repository}/issues/${issue_number}`;
  if (issue.url !== expected) {
    return bad("binding-url-mismatch", `issue #${issue_number}: url does not equal ${expected}`);
  }
  if (Object.prototype.hasOwnProperty.call(issue, "pull_request")) {
    return bad("issue-is-pull-request", `#${issue_number} is a pull request, not an issue`);
  }
  if (issue.body !== undefined && issue.body !== null && typeof issue.body !== "string") {
    return bad("body-invalid", `issue #${issue_number}: body is neither string nor null`);
  }
  const t = checkTimestampPair(issue, `issue #${issue_number}`);
  if (!t.ok) return t;
  return {
    ok: true,
    issue: {
      number: issue.number,
      body: typeof issue.body === "string" ? issue.body : null,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    },
  };
}

// ---------------------------------------------------------------------------
// Comment pages (repos/{repo}/issues/{n}/comments --paginate)
// ---------------------------------------------------------------------------

// N1: comment IDs globally unique across the complete stream. N2: every
// comment binds by exact URL equality both to its own ID and — through
// issue_url — to the exact issue it claims to belong to (identical bytes
// filed under another issue fail here). N5: chronological pair required on
// every entry; an EDITED comment (updated_at > created_at) is valid
// evidence — edit semantics belong to reconstruction, chronology here only
// refuses the impossible. The authenticated author login is required: it
// is the identity reconstruction binds events to.
export function parseCommentPages(text, { repository, issue_number }) {
  const r = checkExpectedRepository(repository);
  if (!r.ok) return r;
  const n = checkExpectedNumber(issue_number, "issue_number");
  if (!n.ok) return n;
  const stream = parsePageStream(text);
  if (!stream.ok) return stream;
  const comments = [];
  const seen = new Set();
  const expectedIssueUrl = `${API_ROOT}/repos/${repository}/issues/${issue_number}`;
  for (const page of stream.pages) {
    if (!Array.isArray(page)) return bad("page-not-array", "a comment page is not an array");
    for (const item of page) {
      if (!isPlainObject(item)) return bad("entry-not-object", "a comment entry is not an object");
      if (!Number.isInteger(item.id) || item.id < 1) {
        return bad("comment-id-invalid", "a comment entry lacks a positive integer id");
      }
      if (seen.has(item.id)) {
        return bad("duplicate-comment-id", `comment ${item.id} appears more than once`);
      }
      seen.add(item.id);
      const expectedUrl = `${API_ROOT}/repos/${repository}/issues/comments/${item.id}`;
      if (item.url !== expectedUrl) {
        return bad("binding-url-mismatch", `comment ${item.id}: url does not equal ${expectedUrl}`);
      }
      if (item.issue_url !== expectedIssueUrl) {
        return bad("binding-issue-mismatch", `comment ${item.id}: issue_url does not equal ${expectedIssueUrl}`);
      }
      if (!isPlainObject(item.user) || typeof item.user.login !== "string" || item.user.login.length === 0) {
        return bad("comment-user-invalid", `comment ${item.id}: missing authenticated author login`);
      }
      if (typeof item.body !== "string") {
        return bad("comment-body-invalid", `comment ${item.id}: body is not a string`);
      }
      const t = checkTimestampPair(item, `comment ${item.id}`);
      if (!t.ok) return t;
      comments.push({
        id: item.id,
        user: item.user.login,
        body: item.body,
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    }
  }
  return { ok: true, comments };
}

// ---------------------------------------------------------------------------
// Pull request fetch (repos/{repo}/pulls/{n})
// ---------------------------------------------------------------------------

// Produces the SAME ten-field normalized record validatePrMetadata accepts
// and the reducer embeds durably in system.eligibility_confirmed events.
// Every field must be OBSERVED with its exact type — draft/merged as
// literal booleans, never defaulted; the head/base SHAs as 40-hex — and
// the object must bind by exact URL equality to the expected repository
// and PR number, with base.repo.full_name agreeing (defense in depth).
export function parsePr(text, { repository, pr_number }) {
  const r = checkExpectedRepository(repository);
  if (!r.ok) return r;
  const n = checkExpectedNumber(pr_number, "pr_number");
  if (!n.ok) return n;
  const doc = parseSingleDocument(text);
  if (!doc.ok) return doc;
  const p = doc.value;
  if (p.number !== pr_number) {
    return bad("binding-pr-mismatch", `fetched PR #${p.number} != expected #${pr_number}`);
  }
  const expected = `${API_ROOT}/repos/${repository}/pulls/${pr_number}`;
  if (p.url !== expected) {
    return bad("binding-url-mismatch", `PR #${pr_number}: url does not equal ${expected}`);
  }
  if (typeof p.state !== "string" || (p.state !== "open" && p.state !== "closed")) {
    return bad("pr-invalid", `PR #${pr_number}: state is not open|closed`);
  }
  if (typeof p.draft !== "boolean") return bad("pr-invalid", `PR #${pr_number}: draft is not a literal boolean`);
  if (typeof p.merged !== "boolean") return bad("pr-invalid", `PR #${pr_number}: merged is not a literal boolean`);
  if (!isPlainObject(p.base) || !isPlainObject(p.head)) {
    return bad("pr-invalid", `PR #${pr_number}: base/head missing`);
  }
  if (!isPlainObject(p.base.repo) || p.base.repo.full_name !== repository) {
    return bad("binding-repository-mismatch", `PR #${pr_number}: base.repo.full_name does not equal ${repository}`);
  }
  if (typeof p.base.ref !== "string" || p.base.ref.length === 0) {
    return bad("pr-invalid", `PR #${pr_number}: base.ref is not a non-empty string`);
  }
  if (typeof p.base.sha !== "string" || !SHA_RE.test(p.base.sha)) {
    return bad("pr-invalid", `PR #${pr_number}: base.sha is not 40-hex`);
  }
  if (typeof p.head.ref !== "string" || p.head.ref.length === 0) {
    return bad("pr-invalid", `PR #${pr_number}: head.ref is not a non-empty string`);
  }
  if (typeof p.head.sha !== "string" || !SHA_RE.test(p.head.sha)) {
    return bad("pr-invalid", `PR #${pr_number}: head.sha is not 40-hex`);
  }
  const t = checkTimestampPair(p, `PR #${pr_number}`);
  if (!t.ok) return t;
  return {
    ok: true,
    pr: {
      fetch_ok: true,
      repository,
      pr_number: p.number,
      state: p.state,
      draft: p.draft,
      merged: p.merged,
      base_branch: p.base.ref,
      base_sha: p.base.sha,
      head_branch: p.head.ref,
      head_sha: p.head.sha,
    },
  };
}

// ---------------------------------------------------------------------------
// Check-run pages (repos/{repo}/commits/{sha}/check-runs --paginate)
// ---------------------------------------------------------------------------

// Pages are objects: { total_count, check_runs: [...] }. Every page must
// claim the SAME total_count; the aggregated run list across ALL pages
// must match it exactly (a dropped page fails closed). N1: check-run IDs
// globally unique — a duplicated passing run never compensates for an
// omitted failing one. N2: every run binds to the exact repository (by
// exact URL equality on its own ID) and to the exact expected head SHA.
//
// The COMPLETE validated per-run record set is preserved (round 11 J2):
// `check_runs` carries every run's {id, name, conclusion, head_sha}
// sorted by id, so two evidence reads whose aggregates agree but whose
// run identities differ (different run IDs, different names, permuted
// conclusions) canonically compare UNEQUAL — aggregate equality is never
// evidence equality.
export function parseCheckRunPages(text, { repository, sha }) {
  const r = checkExpectedRepository(repository);
  if (!r.ok) return r;
  const s = checkExpectedSha(sha);
  if (!s.ok) return s;
  const stream = parsePageStream(text);
  if (!stream.ok) return stream;
  let total = null;
  const runs = [];
  const seen = new Set();
  for (const page of stream.pages) {
    if (!isPlainObject(page)) return bad("page-not-object", "a check-run page is not an object");
    if (!Number.isInteger(page.total_count) || page.total_count < 0) {
      return bad("check-run-invalid", "a check-run page lacks an integer total_count");
    }
    if (total === null) total = page.total_count;
    else if (page.total_count !== total) {
      return bad("check-run-total-mismatch", `pages disagree on total_count (${total} vs ${page.total_count})`);
    }
    if (!Array.isArray(page.check_runs)) {
      return bad("check-run-invalid", "a check-run page lacks a check_runs array");
    }
    for (const run of page.check_runs) {
      if (!isPlainObject(run)) return bad("check-run-invalid", "a check-run entry is not an object");
      if (!Number.isInteger(run.id) || run.id < 1) {
        return bad("check-run-invalid", "a check-run entry lacks a positive integer id");
      }
      if (seen.has(run.id)) {
        return bad("duplicate-check-run-id", `check run ${run.id} appears more than once`);
      }
      seen.add(run.id);
      const expectedUrl = `${API_ROOT}/repos/${repository}/check-runs/${run.id}`;
      if (run.url !== expectedUrl) {
        return bad("binding-url-mismatch", `check run ${run.id}: url does not equal ${expectedUrl}`);
      }
      if (run.head_sha !== sha) {
        return bad("binding-sha-mismatch", `check run ${run.id}: head_sha does not equal expected ${sha}`);
      }
      if (typeof run.name !== "string" || run.name.length === 0) {
        return bad("check-run-invalid", `check run ${run.id}: name is not a non-empty string`);
      }
      if (run.conclusion !== null && typeof run.conclusion !== "string") {
        return bad("check-run-invalid", `check run ${run.id}: conclusion is neither string nor null`);
      }
      runs.push({ id: run.id, name: run.name, conclusion: run.conclusion, head_sha: run.head_sha });
    }
  }
  if (runs.length !== total) {
    return bad("check-run-count-mismatch", `aggregated ${runs.length} run(s) but total_count is ${total} (dropped or duplicated page)`);
  }
  // Canonical order: EVERY derived field comes from the id-sorted record
  // set, never from API page order (round 12 J1). Two reads carrying
  // identical records in different page order are the SAME evidence —
  // the merge guard's stability digest must be permutation-invariant —
  // while any id/name/conclusion/head_sha drift still differs.
  runs.sort((a, b) => a.id - b.id);
  // In-progress runs have conclusion null → recorded as the string
  // "null" (non-passing), matching the merge-guard evidence contract.
  const conclusions = runs.map((r) => (r.conclusion === null ? "null" : r.conclusion));
  return { ok: true, check_runs_total: total, check_run_conclusions: conclusions, check_runs: runs };
}

// ---------------------------------------------------------------------------
// Label pages (repos/{repo}/issues/{n}/labels or repos/{repo}/labels)
// ---------------------------------------------------------------------------

// N1: label IDs and names unique across the complete stream. N2: every
// label binds to the expected repository by strict EXACT-PREFIX URL
// parsing — the remainder after the fixed prefix must decode to exactly
// the label's own name (GitHub encodes some bytes in the url field;
// exact-prefix + decode-identity accepts both encodings while refusing
// any foreign repository). The consumed profile is the name set.
export function parseLabelPages(text, { repository }) {
  const r = checkExpectedRepository(repository);
  if (!r.ok) return r;
  const stream = parsePageStream(text);
  if (!stream.ok) return stream;
  const names = [];
  const seenIds = new Set();
  const seenNames = new Set();
  const prefix = `${API_ROOT}/repos/${repository}/labels/`;
  for (const page of stream.pages) {
    if (!Array.isArray(page)) return bad("page-not-array", "a label page is not an array");
    for (const item of page) {
      if (!isPlainObject(item)) return bad("entry-not-object", "a label entry is not an object");
      if (!Number.isInteger(item.id) || item.id < 1) {
        return bad("label-invalid", "a label entry lacks a positive integer id");
      }
      if (seenIds.has(item.id)) return bad("duplicate-label-id", `label ${item.id} appears more than once`);
      seenIds.add(item.id);
      if (typeof item.name !== "string" || item.name.length === 0) {
        return bad("label-invalid", `label ${item.id}: name is not a non-empty string`);
      }
      if (seenNames.has(item.name)) return bad("duplicate-label-name", item.name);
      seenNames.add(item.name);
      if (typeof item.url !== "string" || !item.url.startsWith(prefix)) {
        return bad("binding-url-mismatch", `label ${JSON.stringify(item.name)}: url does not begin with ${prefix}`);
      }
      let decoded;
      try {
        decoded = decodeURIComponent(item.url.slice(prefix.length));
      } catch {
        return bad("binding-url-mismatch", `label ${JSON.stringify(item.name)}: url remainder does not decode`);
      }
      if (decoded !== item.name) {
        return bad("binding-url-mismatch", `label ${JSON.stringify(item.name)}: url remainder does not equal the label name`);
      }
      names.push(item.name);
    }
  }
  return { ok: true, labels: names };
}

// ---------------------------------------------------------------------------
// Combined commit status (repos/{repo}/commits/{sha}/status)
// ---------------------------------------------------------------------------

// Combined-status integrity: when total_count is consumed, statuses must
// be an array whose every entry carries a positive integer id (globally
// unique), a non-empty string context, and a valid string state;
// statuses.length must equal total_count exactly; the response sha must
// equal the expected exact commit SHA; the response repository must equal
// the expected repository. Any mismatch refuses the evidence.
//
// The COMPLETE validated entry set is preserved (round 11 J2):
// `commit_statuses` carries every entry's {id, context, state} sorted by
// id, so two evidence reads whose rollup state and count agree but whose
// entry identities differ canonically compare UNEQUAL.
export function parseCombinedStatus(text, { repository, sha }) {
  const r = checkExpectedRepository(repository);
  if (!r.ok) return r;
  const s = checkExpectedSha(sha);
  if (!s.ok) return s;
  const doc = parseSingleDocument(text);
  if (!doc.ok) return doc;
  const v = doc.value;
  if (typeof v.state !== "string" || !COMBINED_STATES.has(v.state)) {
    return bad("combined-status-state-invalid", `combined state is not one of ${[...COMBINED_STATES].join("|")}`);
  }
  if (!Number.isInteger(v.total_count) || v.total_count < 0) {
    return bad("combined-status-invalid", "total_count is not a non-negative integer");
  }
  if (!Array.isArray(v.statuses)) {
    return bad("combined-status-statuses-not-array", "statuses is not an array");
  }
  const seen = new Set();
  for (const st of v.statuses) {
    if (!isPlainObject(st)) return bad("combined-status-entry-invalid", "a status entry is not an object");
    if (!Number.isInteger(st.id) || st.id < 1) {
      return bad("combined-status-entry-invalid", "a status entry lacks a positive integer id");
    }
    if (seen.has(st.id)) {
      return bad("duplicate-status-id", `status ${st.id} appears more than once`);
    }
    seen.add(st.id);
    if (typeof st.context !== "string" || st.context.length === 0) {
      return bad("combined-status-entry-invalid", `status ${st.id}: context is not a non-empty string`);
    }
    if (typeof st.state !== "string" || !STATUS_ENTRY_STATES.has(st.state)) {
      return bad("combined-status-entry-invalid", `status ${st.id}: state is not one of ${[...STATUS_ENTRY_STATES].join("|")}`);
    }
  }
  if (v.statuses.length !== v.total_count) {
    return bad("combined-status-count-mismatch", `statuses.length ${v.statuses.length} != total_count ${v.total_count}`);
  }
  if (v.sha !== sha) {
    return bad("binding-sha-mismatch", `combined status sha does not equal expected ${sha}`);
  }
  if (!isPlainObject(v.repository) || v.repository.full_name !== repository) {
    return bad("binding-repository-mismatch", `combined status repository does not equal ${repository}`);
  }
  const entries = v.statuses
    .map((st) => ({ id: st.id, context: st.context, state: st.state }))
    .sort((a, b) => a.id - b.id);
  return { ok: true, commit_statuses_total: v.total_count, commit_status_state: v.state, commit_statuses: entries };
}
