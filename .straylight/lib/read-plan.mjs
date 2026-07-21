// Straylight Control Plane v1 — read-plan + fetch-slot-claim contracts (pure).
//
// The workflow boundary's READ half (rev. 3 §11, round-10 J2/J3): every
// DERIVED fetch — one whose target was computed from evidence (a lane's
// recorded PR number, a PR's head SHA, a collection's issue slots) — is
// expressed as a closed `straylight.read-plan.v1` document authored by a
// planner/collector binary and executed by the single shared read
// executor (bin/execute-read-plan.mjs). Bash never routes on evidence:
// it fetches FIXED urls to files, switches on validated exit codes, and
// invokes the checked-in Node entry points.
//
// This module owns:
//   - the CLOSED read-plan schema: unknown fields refuse everywhere; the
//     plan can express NO method, path, URL, host, header, or filename —
//     the read-kind registry constructs every GET request and every
//     target file name;
//   - the read-kind allowlist. Kinds are GET-only by construction: the
//     executor never passes -X at all, so a plan cannot smuggle a write;
//   - kind-derived fatality: an issue/comment/enumeration-class fetch
//     failure fails the job (it has NO ledger representation — the
//     collection contract); a PR/check/status fetch failure is a DURABLE
//     ledger fact ({fetched:false}), never filename absence;
//   - the `straylight.fetch-slot-claim.v1` contract: the probe's ONLY
//     output. A claim names the slots the probe derived (which PR, and
//     whether check/status evidence is required) and digest-binds itself
//     to the exact base evidence bytes it derived them from. The claim is
//     NEVER write authority: final planners independently rederive the
//     slots from both raw reads and require derived(read 1) =
//     derived(read 2) = claim, refusing on any difference;
//   - the gather read-ledger contract: one strict row per derived fetch
//     attempt, written ONLY by the read executor, keyed {gather, slot},
//     with the fixed per-slot file name and the content digest.
//
// Pure validation only — no file I/O, no network, no process spawning.

import { parseStrict } from "./strict-json.mjs";
import { REPOSITORY_ALLOWLIST, NONCE_RE } from "./write-plan.mjs";

export const READ_PLAN_SCHEMA = "straylight.read-plan.v1";
export const FETCH_SLOT_CLAIM_SCHEMA = "straylight.fetch-slot-claim.v1";

const LANE_ID_RE = /^lane-[a-z0-9][a-z0-9-]{1,62}$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const MAX_READS = 1024;
const MAX_ISSUE_NUMBER = 1_000_000_000;

function err(code, detail) {
  return { code, detail };
}

function bad(reason, detail) {
  return detail === undefined ? { ok: false, reason } : { ok: false, reason, detail };
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function validNumber(n) {
  return Number.isInteger(n) && n >= 1 && n <= MAX_ISSUE_NUMBER;
}

// ---------------------------------------------------------------------------
// Read-kind registry (the complete allowlist)
// ---------------------------------------------------------------------------
//
// scope "collection": targets live under one collection root (--root);
//   ledger rows use the watchdog collection format (collection.mjs
//   parseLedger) so the seal/verify stages consume them unchanged.
// scope "gathers": the read runs ONCE PER GATHER (1 and 2) so both
//   stability-fence reads carry their own live evidence; ledger rows use
//   the gather read-ledger format below.
// fatal: a gh failure aborts the executor (exit 4). Non-fatal failures
//   are durable {fetched:false} rows and the executor continues.

export const READ_KINDS = Object.freeze({
  // Watchdog S2→S3: issue + comments for one enumerated slot.
  "issue-comments": Object.freeze({
    scope: "collection",
    fatal: true,
    fields: Object.freeze(["issue_number"]),
  }),
  // Watchdog S4→S5: one PR fetch attempt for a derived compound slot.
  "pr": Object.freeze({
    scope: "collection",
    fatal: false,
    fields: Object.freeze(["issue_number", "pr_number"]),
  }),
  // Reducer Stage A: the live PR, fetched into BOTH gathers.
  "pr-into-gathers": Object.freeze({
    scope: "gathers",
    fatal: false,
    fields: Object.freeze(["pr_number"]),
  }),
  // Merge guard: the live PR plus its head's check-runs and combined
  // status, fetched into BOTH gathers. The head SHA is derived INSIDE the
  // executor from the just-fetched PR bytes via evidence.mjs — never by
  // shell.
  "pr-with-checks-into-gathers": Object.freeze({
    scope: "gathers",
    fatal: false,
    fields: Object.freeze(["pr_number"]),
  }),
});

const PLAN_KEYS = Object.freeze(["schema", "plan_id", "nonce", "repository", "collection_id", "reads"]);

// Validate a parsed read-plan document. Returns { ok: true, reads, scope,
// collection_id } or { ok: false, errors }.
export function validateReadPlan(plan, { repository, nonce } = {}) {
  const errors = [];
  if (!isPlainObject(plan)) {
    return { ok: false, errors: [err("plan-not-object", "read-plan document is not a JSON object")] };
  }
  for (const key of Object.keys(plan)) {
    if (!PLAN_KEYS.includes(key)) errors.push(err("unknown-field", `plan.${key}`));
  }
  if (plan.schema !== READ_PLAN_SCHEMA) {
    errors.push(err("schema-mismatch", `plan.schema must be ${READ_PLAN_SCHEMA}`));
  }
  if (typeof plan.repository !== "string" || !REPOSITORY_ALLOWLIST.includes(plan.repository)) {
    errors.push(err("repository-not-allowlisted", `plan.repository ${JSON.stringify(plan.repository ?? null)}`));
  } else if (plan.repository !== repository) {
    errors.push(err("repository-argv-mismatch", "plan.repository does not equal the executor's --repository"));
  }
  if (typeof nonce !== "string" || !NONCE_RE.test(nonce)) {
    errors.push(err("nonce-invalid", "--nonce must be two positive decimal integers separated by '-'"));
  }
  if (typeof plan.nonce !== "string" || !NONCE_RE.test(plan.nonce)) {
    errors.push(err("nonce-invalid", "plan.nonce malformed"));
  } else if (plan.nonce !== nonce) {
    errors.push(err("nonce-mismatch", "plan.nonce does not equal --nonce (stale-plan replay refused)"));
  }
  if (typeof plan.plan_id !== "string" || !/^[A-Za-z0-9-]{1,120}$/.test(plan.plan_id) ||
      (typeof plan.nonce === "string" && !plan.plan_id.startsWith(`${plan.nonce}-`))) {
    errors.push(err("plan-id-invalid", "plan_id must be '<nonce>-<name>'"));
  }
  if (!Array.isArray(plan.reads)) {
    errors.push(err("reads-invalid", "reads is not an array"));
    return { ok: false, errors };
  }
  if (plan.reads.length > MAX_READS) {
    errors.push(err("reads-invalid", `more than ${MAX_READS} reads`));
  }

  let scope = null;
  const seen = new Set();
  plan.reads.forEach((read, i) => {
    const where = `reads[${i}]`;
    if (!isPlainObject(read)) {
      errors.push(err("read-invalid", `${where}: not an object`));
      return;
    }
    const spec = READ_KINDS[read.kind];
    if (spec === undefined) {
      errors.push(err("kind-not-allowlisted", `${where}: kind ${JSON.stringify(read.kind ?? null)}`));
      return;
    }
    for (const key of Object.keys(read)) {
      if (key === "kind") continue;
      if (!spec.fields.includes(key)) {
        errors.push(err("unknown-field", `${where}.${key} is not expressible on kind ${read.kind}`));
      }
    }
    for (const field of spec.fields) {
      if (!validNumber(read[field])) {
        errors.push(err("read-invalid", `${where}: ${field} must be a positive integer within GitHub bounds`));
      }
    }
    if (scope === null) scope = spec.scope;
    else if (scope !== spec.scope) {
      errors.push(err("read-invalid", `${where}: mixed collection/gathers scopes in one plan`));
    }
    const identity = `${read.kind}:${read.issue_number ?? ""}:${read.pr_number ?? ""}`;
    if (seen.has(identity)) {
      errors.push(err("duplicate-read", `${where}: ${identity}`));
      return;
    }
    seen.add(identity);
  });

  if (scope === "collection") {
    if (plan.collection_id !== "A" && plan.collection_id !== "B") {
      errors.push(err("collection-id-invalid", "collection-scope plans require collection_id A|B"));
    }
  } else if (scope === "gathers") {
    if (plan.collection_id !== undefined) {
      errors.push(err("unknown-field", "plan.collection_id is not expressible on gathers-scope plans"));
    }
  } else if (plan.collection_id !== undefined && plan.collection_id !== "A" && plan.collection_id !== "B") {
    // An EMPTY plan (zero reads) may still carry its author's collection
    // identity; anything other than A|B refuses.
    errors.push(err("collection-id-invalid", "collection_id must be A or B"));
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, reads: plan.reads, scope, collection_id: plan.collection_id };
}

// Defense-in-depth guard over a CONSTRUCTED GET path (mirrors
// write-plan.mjs checkConstructedPath, with the read-only resource set).
export function checkConstructedReadPath(path) {
  if (typeof path !== "string" || path.length === 0 || path.length > 512) {
    return err("constructed-path-invalid", "path empty or oversized");
  }
  if (!/^repos\/0xHoneyJar\/loa-straylight\/(issues|pulls|commits)(\/|\?|$)/.test(path)) {
    return err("constructed-path-invalid", `path escapes the fixed repository prefix: ${path.slice(0, 120)}`);
  }
  if (/:\/\//.test(path) || path.includes("..") || path.includes("#") ||
      /[\s]/.test(path) || /[\x00-\x1f\x7f]/.test(path)) {
    return err("constructed-path-invalid", "path carries URL/traversal/fragment/whitespace/control bytes");
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fetch-slot claim (the probe's ONLY output; never write authority)
// ---------------------------------------------------------------------------

const CLAIM_KEYS = Object.freeze(["schema", "nonce", "repository", "issue_number", "lane_id", "state", "pr_number", "checks", "sources"]);
const SOURCE_KEYS = Object.freeze(["enumeration_sha256", "issue_sha256", "comments_sha256"]);

function checkSources(sources, where) {
  if (!isPlainObject(sources)) return bad("claim-invalid", `${where} is not an object`);
  for (const key of Object.keys(sources)) {
    if (!SOURCE_KEYS.includes(key)) return bad("claim-invalid", `${where}.${key} unknown`);
  }
  for (const key of SOURCE_KEYS) {
    if (typeof sources[key] !== "string" || !DIGEST_RE.test(sources[key])) {
      return bad("claim-invalid", `${where}.${key} must be sha256:<64 hex>`);
    }
  }
  return { ok: true };
}

// Strict-validate a fetch-slot claim against the expected identity.
export function parseClaim(text, { repository, nonce, issue_number } = {}) {
  const parsed = parseStrict(text ?? "");
  if (!parsed.ok) return bad("claim-malformed", parsed.reason);
  const claim = parsed.value;
  if (!isPlainObject(claim)) return bad("claim-malformed", "not an object");
  for (const key of Object.keys(claim)) {
    if (!CLAIM_KEYS.includes(key)) return bad("claim-invalid", `claim.${key} unknown`);
  }
  if (claim.schema !== FETCH_SLOT_CLAIM_SCHEMA) return bad("claim-invalid", "schema mismatch");
  if (claim.nonce !== nonce) return bad("claim-identity-mismatch", "nonce");
  if (claim.repository !== repository) return bad("claim-identity-mismatch", "repository");
  if (claim.issue_number !== issue_number) return bad("claim-identity-mismatch", "issue_number");
  if (typeof claim.lane_id !== "string" || !LANE_ID_RE.test(claim.lane_id)) {
    return bad("claim-invalid", "lane_id malformed");
  }
  if (typeof claim.state !== "string" || claim.state.length === 0 || claim.state.length > 64) {
    return bad("claim-invalid", "state malformed");
  }
  if (claim.pr_number !== null && !validNumber(claim.pr_number)) {
    return bad("claim-invalid", "pr_number must be null or a positive integer");
  }
  if (typeof claim.checks !== "boolean") return bad("claim-invalid", "checks must be a literal boolean");
  if (claim.checks === true && claim.pr_number === null) {
    return bad("claim-invalid", "checks cannot be claimed without a PR slot");
  }
  if (!isPlainObject(claim.sources) ||
      Object.keys(claim.sources).some((k) => k !== "gather_1" && k !== "gather_2")) {
    return bad("claim-invalid", "sources must be {gather_1, gather_2}");
  }
  for (const g of ["gather_1", "gather_2"]) {
    const s = checkSources(claim.sources[g], `sources.${g}`);
    if (!s.ok) return s;
  }
  return { ok: true, claim };
}

// ---------------------------------------------------------------------------
// Gather read-ledger (written ONLY by the read executor)
// ---------------------------------------------------------------------------

const SLOT_FILE = Object.freeze({
  "pr": "pr.json",
  "check-runs": "check-runs.pages",
  "status": "status.json",
});

export function slotFileName(slot) {
  return SLOT_FILE[slot];
}

const ROW_KEYS = Object.freeze(["nonce", "gather", "slot", "pr_number", "sha", "fetched", "path", "sha256"]);

// Parse the gather read-ledger. An EMPTY ledger is valid (a claim with no
// slots attempts no derived fetches). Returns { ok: true, rows } or a
// refusal.
export function parseReadLedger(text, { nonce } = {}) {
  if (typeof text !== "string") return bad("read-ledger-malformed", "not a string");
  const rows = [];
  const seen = new Set();
  for (const line of text.split("\n")) {
    if (line.trim().length === 0) continue;
    const parsed = parseStrict(line);
    if (!parsed.ok) return bad("read-ledger-row-malformed", parsed.reason);
    const row = parsed.value;
    if (!isPlainObject(row)) return bad("read-ledger-row-malformed", "row is not an object");
    for (const key of Object.keys(row)) {
      if (!ROW_KEYS.includes(key)) return bad("read-ledger-row-unknown-field", key);
    }
    if (row.nonce !== nonce) return bad("read-ledger-nonce-mismatch");
    if (row.gather !== 1 && row.gather !== 2) return bad("read-ledger-row-malformed", "gather must be 1 or 2");
    if (!(row.slot in SLOT_FILE)) return bad("read-ledger-row-malformed", `slot ${String(row.slot)}`);
    if (!validNumber(row.pr_number)) return bad("read-ledger-row-malformed", "pr_number invalid");
    if (typeof row.fetched !== "boolean") return bad("read-ledger-row-malformed", "fetched not a boolean");
    if (row.slot === "check-runs" || row.slot === "status") {
      if (row.fetched === true && (typeof row.sha !== "string" || !SHA_RE.test(row.sha))) {
        return bad("read-ledger-row-malformed", `${row.slot} fetched:true row lacks the bound head sha`);
      }
      if (row.fetched === false && row.sha !== undefined) {
        return bad("read-ledger-row-malformed", "fetched:false row carries a sha");
      }
    } else if (row.sha !== undefined) {
      return bad("read-ledger-row-malformed", "pr row carries a sha");
    }
    if (row.fetched === true) {
      if (row.path !== SLOT_FILE[row.slot]) {
        return bad("read-ledger-row-malformed", `fetched:true ${row.slot} row must name ${SLOT_FILE[row.slot]}`);
      }
      if (typeof row.sha256 !== "string" || !DIGEST_RE.test(row.sha256)) {
        return bad("read-ledger-row-malformed", "fetched:true row lacks a sha256 digest");
      }
    } else if (row.path !== undefined || row.sha256 !== undefined) {
      return bad("read-ledger-row-malformed", "fetched:false row carries a path or digest");
    }
    const identity = `${row.gather}:${row.slot}`;
    if (seen.has(identity)) return bad("read-ledger-duplicate-row", identity);
    seen.add(identity);
    rows.push(row);
  }
  return { ok: true, rows };
}

// Require the ledger to contain EXACTLY the rows the claim's slots demand:
// pr rows for both gathers when a PR slot is claimed; check-runs + status
// rows for both gathers when checks are claimed; NOTHING otherwise —
// missing, extra, or wrong-PR rows all refuse.
export function checkLedgerAgainstClaim(rows, claim) {
  const expected = [];
  if (claim.pr_number !== null) {
    for (const gather of [1, 2]) expected.push({ gather, slot: "pr" });
    if (claim.checks === true) {
      for (const gather of [1, 2]) {
        expected.push({ gather, slot: "check-runs" });
        expected.push({ gather, slot: "status" });
      }
    }
  }
  const want = new Set(expected.map((e) => `${e.gather}:${e.slot}`));
  for (const row of rows) {
    const key = `${row.gather}:${row.slot}`;
    if (!want.has(key)) return bad("read-ledger-unclaimed-row", key);
    if (row.pr_number !== claim.pr_number) {
      return bad("read-ledger-slot-mismatch", `${key}: pr #${row.pr_number} != claimed #${claim.pr_number}`);
    }
  }
  if (rows.length !== expected.length) {
    return bad("read-ledger-slot-missing", `${rows.length} row(s), expected ${expected.length}`);
  }
  return { ok: true };
}
