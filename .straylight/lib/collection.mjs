// Straylight Control Plane v1 — watchdog evidence collection (pure).
//
// The staged dual-collection design (rev. 3 §1–§3): the watchdog gathers
// TWO complete, independently collected evidence sets (Collection A,
// Collection B). Each collection advances S0→S6 through a state machine
// in which every derivation stage consumes ONLY evidence already fetched
// in THAT collection:
//
//   S1→S2 issue-slots — strict parse of the raw enumeration ONLY; unique
//         issue numbers; the output schema HAS NO PR FIELD, so
//         enumeration-only evidence is structurally unable to emit PR
//         slots.
//   S3→S4 pr-slots    — reparse the raw enumeration + every raw issue/
//         comment file via evidence.mjs; reconstruct every lane SOLELY to
//         derive which PR numbers planning requires; emit unique
//         {issue_number, pr_number} slots.
//   S5→S6 seal        — re-derive issue slots AND PR slots from raw bytes
//         again; verify every ledger claim against its file's actual
//         digest and against the seal's own derivation; a manifest can
//         never claim a slot its own raw evidence does not independently
//         produce.
//
// This module owns the derivations, seal validation, per-collection
// re-verification, canonical planning projection, and A/B comparison.
// It performs NO file I/O and NO network: callers (the collector binary
// and the final planner) hand it decoded bytes; files are byte
// containers, never identity authority — identity comes from ledger
// digest verification and evidence.mjs binding, never from names.

import { createHash } from "node:crypto";
import { parseStrict } from "./strict-json.mjs";
import { canonicalize, payloadDigest } from "./canonical.mjs";
import { parseIssuePages, parseIssue, parseCommentPages, parsePr } from "./evidence.mjs";
import { scanLanes } from "./lane-target.mjs";
import { reconstructLane } from "./reconstruct.mjs";

export const ISSUE_SLOTS_SCHEMA = "straylight.collection-issue-slots.v1";
export const PR_SLOTS_SCHEMA = "straylight.collection-pr-slots.v1";
export const MANIFEST_SCHEMA = "straylight.collection-manifest.v1";

export const COLLECTION_IDS = Object.freeze(["A", "B"]);
const NONCE_RE = /^[1-9][0-9]*-[1-9][0-9]*$/;
const RESOURCES = Object.freeze(["enumeration", "issue", "comments", "pr"]);
const PATH_RE = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)?$/; // ≤1 separator, no traversal
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

function bad(reason, detail) {
  return detail === undefined ? { ok: false, reason } : { ok: false, reason, detail };
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function sha256OfBytes(bytes) {
  return "sha256:" + createHash("sha256").update(bytes).digest("hex");
}

function checkIdentity({ collection_id, nonce }) {
  if (!COLLECTION_IDS.includes(collection_id)) return bad("collection-id-invalid");
  if (typeof nonce !== "string" || !NONCE_RE.test(nonce)) return bad("nonce-invalid");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// S1→S2: issue slots from the raw enumeration ONLY
// ---------------------------------------------------------------------------

// The output schema deliberately contains NO PR field of any kind: an
// enumeration-only stage is structurally unable to emit PR slots
// (adversarial rows 1–2). Returns the stage document or a refusal.
export function deriveIssueSlots(enumerationBytes, { collection_id, nonce, repository }) {
  const id = checkIdentity({ collection_id, nonce });
  if (!id.ok) return id;
  const text = enumerationBytes.toString("utf8");
  const parsed = parseIssuePages(text, { repository, requireTimestamps: true });
  if (!parsed.ok) return parsed;
  const slots = parsed.issues.map((i) => i.number).sort((a, b) => a - b);
  return {
    ok: true,
    document: {
      schema: ISSUE_SLOTS_SCHEMA,
      collection_id,
      nonce,
      enumeration_sha256: sha256OfBytes(enumerationBytes),
      issue_slots: slots,
    },
  };
}

// Strict-validate a persisted issue-slots stage document. Any PR-shaped
// key — or ANY key outside the closed schema — refuses.
export function validateIssueSlotsDocument(doc) {
  if (!isPlainObject(doc)) return bad("stage-document-invalid", "not an object");
  const KEYS = ["schema", "collection_id", "nonce", "enumeration_sha256", "issue_slots"];
  for (const key of Object.keys(doc)) {
    if (!KEYS.includes(key)) return bad("stage-document-unknown-field", key);
  }
  if (doc.schema !== ISSUE_SLOTS_SCHEMA) return bad("stage-document-invalid", "schema mismatch");
  const id = checkIdentity(doc);
  if (!id.ok) return id;
  if (typeof doc.enumeration_sha256 !== "string" || !DIGEST_RE.test(doc.enumeration_sha256)) {
    return bad("stage-document-invalid", "enumeration_sha256 malformed");
  }
  if (!Array.isArray(doc.issue_slots)) return bad("stage-document-invalid", "issue_slots not an array");
  const seen = new Set();
  let prev = 0;
  for (const n of doc.issue_slots) {
    if (!Number.isInteger(n) || n < 1) return bad("stage-document-invalid", "issue slot not a positive integer");
    if (seen.has(n)) return bad("stage-document-invalid", `duplicate issue slot ${n}`);
    if (n <= prev) return bad("stage-document-invalid", "issue_slots not sorted ascending");
    seen.add(n);
    prev = n;
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Lane reconstruction from raw per-issue evidence (shared by S3→S4 and the
// final planner's independent re-derivation)
// ---------------------------------------------------------------------------

// Reconstruct the collection world from the RAW enumeration + per-issue
// raw bytes. `issueEvidence` maps issue_number → { issueBytes,
// commentBytes } (decoded buffers of the raw single-issue fetch and the
// raw comment page stream). EVERY enumerated (non-PR) issue slot requires
// its complete issue/comment evidence — the S2→S3 fetch transition covers
// every slot, and dedupe proofs for findings on non-lane issues (e.g. a
// malformed genesis) need that issue's comment stream. A missing or
// unparseable raw file is a refusal — PR slots are derivable ONLY after
// the complete issue/comment evidence for that same collection exists.
export function reconstructCollectionLanes(enumerationBytes, issueEvidence, { repository, policy, now }) {
  const enumParsed = parseIssuePages(enumerationBytes.toString("utf8"), { repository, requireTimestamps: true });
  if (!enumParsed.ok) return enumParsed;
  const scanned = scanLanes(enumParsed.issues);
  if (!scanned.ok) return bad("lane-scan-failed", scanned.reason);

  const laneIdsSeen = new Map();
  for (const { number, lane_id } of scanned.lanes) {
    const list = laneIdsSeen.get(lane_id) ?? [];
    list.push(number);
    laneIdsSeen.set(lane_id, list);
  }
  // Duplicate valid lane IDs refuse for every writer (C1) — a sweep over
  // an ambiguous lane set must not plan anything.
  for (const [lane_id, numbers] of laneIdsSeen) {
    if (numbers.length > 1) {
      return bad("duplicate-lane-id", `${lane_id}: issues #${numbers.join(", #")}`);
    }
  }

  // Parse issue + comment evidence for EVERY slot.
  const issueRecords = new Map();
  for (const { number } of enumParsed.issues) {
    const evidence = issueEvidence.get(number);
    if (evidence === undefined || evidence.issueBytes === undefined || evidence.commentBytes === undefined) {
      return bad("missing-issue-evidence", `issue #${number}: raw issue/comment evidence not fetched in this collection`);
    }
    const issueParsed = parseIssue(evidence.issueBytes.toString("utf8"), { repository, issue_number: number });
    if (!issueParsed.ok) return bad("issue-evidence-invalid", `issue #${number}: ${issueParsed.reason}`);
    const commentsParsed = parseCommentPages(evidence.commentBytes.toString("utf8"), { repository, issue_number: number });
    if (!commentsParsed.ok) return bad("comment-evidence-invalid", `issue #${number}: ${commentsParsed.reason}`);
    issueRecords.set(number, { issue: issueParsed.issue, comments: commentsParsed.comments });
  }

  // ENUMERATION↔FETCH IDENTITY BINDING (F6): the lane identity derived
  // from every FETCHED issue body must equal the identity the ENUMERATION
  // derived for the same issue number — the lane→issue mapping and the
  // unreadable set alike. A marker-bearing body that changed between the
  // enumeration fetch and the per-issue fetch (different lane_id, marker
  // added or removed, readable turned unreadable) refuses the collection:
  // reconstruction must never run under an identity the enumeration did
  // not independently derive.
  const fetchedScan = scanLanes(
    [...issueRecords.entries()]
      .map(([number, record]) => ({ number, body: record.issue.body ?? "" }))
      .sort((a, b) => a.number - b.number),
  );
  if (!fetchedScan.ok) return bad("lane-scan-failed", fetchedScan.reason);
  const mappingOf = (s) => JSON.stringify(s.lanes.map((l) => [l.number, l.lane_id]).sort((a, b) => a[0] - b[0]));
  const unreadableOf = (s) => JSON.stringify(s.unreadable.map((u) => u.number).sort((a, b) => a - b));
  if (mappingOf(fetchedScan) !== mappingOf(scanned) || unreadableOf(fetchedScan) !== unreadableOf(scanned)) {
    return bad(
      "enumeration-fetch-identity-mismatch",
      "lane identity derived from fetched issue bodies does not equal the enumeration's derivation",
    );
  }

  const lanes = [];
  for (const { number, lane_id } of scanned.lanes) {
    const record = issueRecords.get(number);
    const result = reconstructLane({
      issue_body: record.issue.body ?? "",
      comments: record.comments,
      policy,
      context: { now },
    });
    lanes.push({
      issue_number: number,
      lane_id,
      issue: record.issue,
      comments: record.comments,
      reconstruction: result,
    });
  }
  return {
    ok: true,
    lanes,
    issues: enumParsed.issues,
    issueRecords,
    unreadable: scanned.unreadable,
    excluded_prs: enumParsed.excluded_prs,
  };
}

// ---------------------------------------------------------------------------
// S3→S4: PR slots — derivable only after issue/comment evidence exists
// ---------------------------------------------------------------------------

export function derivePrSlots(enumerationBytes, issueEvidence, { collection_id, nonce, repository, policy, now }) {
  const id = checkIdentity({ collection_id, nonce });
  if (!id.ok) return id;
  const world = reconstructCollectionLanes(enumerationBytes, issueEvidence, { repository, policy, now });
  if (!world.ok) return world;
  const slots = [];
  for (const lane of world.lanes) {
    const rec = lane.reconstruction;
    if (rec.ok && rec.lane !== null && Number.isInteger(rec.lane.pr_number) && rec.lane.pr_number >= 1) {
      slots.push({ issue_number: lane.issue_number, pr_number: rec.lane.pr_number });
    }
  }
  slots.sort((a, b) => a.issue_number - b.issue_number);
  // Unique by issue_number: one reconstructed lane per issue (duplicates
  // already refused), so a collision here is impossible by construction —
  // checked anyway so a regression fails closed.
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].issue_number === slots[i - 1].issue_number) {
      return bad("pr-slot-duplicate", `issue #${slots[i].issue_number}`);
    }
  }
  return {
    ok: true,
    document: {
      schema: PR_SLOTS_SCHEMA,
      collection_id,
      nonce,
      enumeration_sha256: sha256OfBytes(enumerationBytes),
      pr_slots: slots,
    },
  };
}

// ---------------------------------------------------------------------------
// Ledger validation (bash-appended JSONL, one row per fetch attempt)
// ---------------------------------------------------------------------------

// A failed PR fetch is a DURABLE LEDGER FACT ({fetched:false}, no path, no
// digest), never filename absence. Issue/comment/enumeration fetch failure
// has no ledger representation because it fails the job outright.
export function parseLedger(text, { collection_id, nonce }) {
  const id = checkIdentity({ collection_id, nonce });
  if (!id.ok) return id;
  if (typeof text !== "string" || text.trim().length === 0) {
    return bad("ledger-empty", "a collection without ledger rows is not evidence");
  }
  const rows = [];
  const seenIdentity = new Set();
  for (const line of text.split("\n")) {
    if (line.trim().length === 0) continue;
    const parsed = parseStrict(line);
    if (!parsed.ok) return bad("ledger-row-malformed", parsed.reason);
    const row = parsed.value;
    if (!isPlainObject(row)) return bad("ledger-row-malformed", "row is not an object");
    const KEYS = ["nonce", "collection_id", "resource", "issue_number", "pr_number", "fetched", "path", "sha256"];
    for (const key of Object.keys(row)) {
      if (!KEYS.includes(key)) return bad("ledger-row-unknown-field", key);
    }
    if (row.nonce !== nonce) return bad("ledger-nonce-mismatch");
    if (row.collection_id !== collection_id) return bad("ledger-collection-mismatch");
    if (!RESOURCES.includes(row.resource)) return bad("ledger-resource-invalid", String(row.resource));
    if (row.resource === "enumeration") {
      if (row.issue_number !== undefined || row.pr_number !== undefined) {
        return bad("ledger-row-malformed", "enumeration row carries an issue/pr number");
      }
    } else if (!Number.isInteger(row.issue_number) || row.issue_number < 1) {
      return bad("ledger-row-malformed", `${row.resource} row lacks a positive issue_number`);
    }
    if (row.resource === "pr") {
      if (!Number.isInteger(row.pr_number) || row.pr_number < 1) {
        return bad("ledger-row-malformed", "pr row lacks a positive pr_number");
      }
    } else if (row.pr_number !== undefined) {
      return bad("ledger-row-malformed", `${row.resource} row carries a pr_number`);
    }
    if (typeof row.fetched !== "boolean") return bad("ledger-row-malformed", "fetched not a boolean");
    if (row.fetched === false && row.resource !== "pr") {
      return bad("ledger-row-malformed", "fetched:false is only legal for pr rows");
    }
    if (row.fetched === true) {
      if (typeof row.path !== "string" || !PATH_RE.test(row.path)) {
        return bad("ledger-row-malformed", "fetched:true row lacks a safe relative path");
      }
      if (typeof row.sha256 !== "string" || !DIGEST_RE.test(row.sha256)) {
        return bad("ledger-row-malformed", "fetched:true row lacks a sha256 digest");
      }
    } else if (row.path !== undefined || row.sha256 !== undefined) {
      return bad("ledger-row-malformed", "fetched:false row carries a path or digest");
    }
    const identity = `${row.resource}:${row.issue_number ?? ""}:${row.pr_number ?? ""}`;
    if (seenIdentity.has(identity)) return bad("ledger-duplicate-resource", identity);
    seenIdentity.add(identity);
    rows.push(row);
  }
  if (rows.length === 0) return bad("ledger-empty");
  const enums = rows.filter((r) => r.resource === "enumeration");
  if (enums.length !== 1 || enums[0].fetched !== true) {
    return bad("ledger-enumeration-invalid", "exactly one fetched enumeration row is required");
  }
  return { ok: true, rows };
}

// EXACT RESOURCE SET (F6): the ledger must contain EXACTLY one issue row
// and EXACTLY one comments row per enumerated slot — no row for an issue
// the enumeration did not derive (an unenumerated resource is smuggled
// evidence, not surplus), and none missing (parseLedger's duplicate-
// identity refusal already guarantees "at most one", so equality of the
// sets gives exactly-one). PR-row exactness is checked against the
// re-derived PR slots by the callers.
function checkExactIssueResources(rows, issueSlots) {
  const slotSet = new Set(issueSlots);
  for (const resource of ["issue", "comments"]) {
    const numbers = rows.filter((r) => r.resource === resource).map((r) => r.issue_number);
    for (const n of numbers) {
      if (!slotSet.has(n)) {
        return bad("ledger-unenumerated-resource", `${resource} row for issue #${n} has no enumerated slot`);
      }
    }
    if (numbers.length !== issueSlots.length) {
      const have = new Set(numbers);
      const missing = issueSlots.filter((n) => !have.has(n));
      return bad("ledger-resource-missing", `${resource} row(s) missing for issue #${missing.join(", #")}`);
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// S5→S6: seal — the manifest can never claim what raw bytes don't derive
// ---------------------------------------------------------------------------

// `readFile(path)` is a caller-supplied CONTAINED reader: the collector
// binary resolves it under the collection directory with realpath
// containment and returns the raw bytes or null. Seal validation:
//   - ledger parses and matches identity;
//   - every fetched:true row's file exists and hashes to its claim;
//   - the enumeration digest matches the enumeration row;
//   - issue slots and PR slots re-derived from raw bytes equal what the
//     stage documents claim (claims rule);
//   - every discovered lane has exactly its issue+comments rows, and
//     every PR slot has exactly one pr row (fetched true or false).
export function sealCollection({
  ledgerText,
  readFile,
  collection_id,
  nonce,
  repository,
  policy,
  now,
  issueSlotsDocument,
  prSlotsDocument,
}) {
  const ledger = parseLedger(ledgerText, { collection_id, nonce });
  if (!ledger.ok) return ledger;
  const rows = ledger.rows;

  // Verify every fetched:true claim against the actual bytes.
  const bytesByRow = new Map();
  for (const row of rows) {
    if (row.fetched !== true) continue;
    const bytes = readFile(row.path);
    if (bytes === null || bytes === undefined) {
      return bad("ledger-file-missing", row.path);
    }
    const digest = sha256OfBytes(bytes);
    if (digest !== row.sha256) {
      return bad("ledger-digest-mismatch", `${row.path}: file hashes ${digest}, ledger claims ${row.sha256}`);
    }
    bytesByRow.set(row, bytes);
  }

  const enumRow = rows.find((r) => r.resource === "enumeration");
  const enumerationBytes = bytesByRow.get(enumRow);

  // Validate the persisted stage documents (closed schemas) and their
  // binding to THIS enumeration.
  const issueDocCheck = validateIssueSlotsDocument(issueSlotsDocument);
  if (!issueDocCheck.ok) return issueDocCheck;
  if (issueSlotsDocument.collection_id !== collection_id || issueSlotsDocument.nonce !== nonce) {
    return bad("stage-document-identity-mismatch", "issue-slots document belongs to another collection/run");
  }
  if (issueSlotsDocument.enumeration_sha256 !== sha256OfBytes(enumerationBytes)) {
    return bad("stage-document-enumeration-mismatch", "issue-slots document was derived from different enumeration bytes");
  }

  // Re-derive issue slots from raw bytes and compare to the claim.
  const reIssue = deriveIssueSlots(enumerationBytes, { collection_id, nonce, repository });
  if (!reIssue.ok) return reIssue;
  if (JSON.stringify(reIssue.document.issue_slots) !== JSON.stringify(issueSlotsDocument.issue_slots)) {
    return bad("claims-rule-violation", "issue_slots claim does not equal the seal's own derivation");
  }

  // EXACTLY one issue row and one comments row per re-derived slot; a row
  // for an unenumerated issue refuses (F6).
  const exact = checkExactIssueResources(rows, reIssue.document.issue_slots);
  if (!exact.ok) return exact;

  // Assemble per-issue evidence from ledger rows for lane reconstruction.
  const issueEvidence = new Map();
  for (const row of rows) {
    if (row.resource === "issue") {
      const entry = issueEvidence.get(row.issue_number) ?? {};
      entry.issueBytes = bytesByRow.get(row);
      issueEvidence.set(row.issue_number, entry);
    } else if (row.resource === "comments") {
      const entry = issueEvidence.get(row.issue_number) ?? {};
      entry.commentBytes = bytesByRow.get(row);
      issueEvidence.set(row.issue_number, entry);
    }
  }

  // Re-derive PR slots and compare to the claim.
  const rePr = derivePrSlots(enumerationBytes, issueEvidence, { collection_id, nonce, repository, policy, now });
  if (!rePr.ok) return rePr;
  if (prSlotsDocument !== undefined) {
    if (!isPlainObject(prSlotsDocument) || prSlotsDocument.schema !== PR_SLOTS_SCHEMA ||
        prSlotsDocument.collection_id !== collection_id || prSlotsDocument.nonce !== nonce) {
      return bad("stage-document-identity-mismatch", "pr-slots document invalid or belongs to another collection/run");
    }
    if (JSON.stringify(prSlotsDocument.pr_slots) !== JSON.stringify(rePr.document.pr_slots)) {
      return bad("claims-rule-violation", "pr_slots claim does not equal the seal's own derivation");
    }
  }

  // Every PR slot must have EXACTLY ONE pr ledger row (fetched true or
  // false — failure is a durable fact); no pr row may exist for a slot
  // the raw evidence does not derive.
  const prRows = rows.filter((r) => r.resource === "pr");
  const slotKey = (s) => `${s.issue_number}:${s.pr_number}`;
  const slotSet = new Set(rePr.document.pr_slots.map(slotKey));
  for (const row of prRows) {
    const key = `${row.issue_number}:${row.pr_number}`;
    if (!slotSet.has(key)) {
      return bad("ledger-underived-pr-row", `pr row ${key} has no slot derived from raw evidence`);
    }
  }
  for (const slot of rePr.document.pr_slots) {
    const matching = prRows.filter((r) => r.issue_number === slot.issue_number && r.pr_number === slot.pr_number);
    if (matching.length !== 1) {
      return bad("ledger-pr-slot-unaccounted", `slot ${slotKey(slot)} has ${matching.length} pr row(s), expected exactly 1`);
    }
  }

  // The manifest is the sealed record: identity, enumeration digest,
  // re-derived slots, and the complete resource list.
  const manifest = {
    schema: MANIFEST_SCHEMA,
    collection_id,
    nonce,
    enumeration_sha256: sha256OfBytes(enumerationBytes),
    issue_slots: reIssue.document.issue_slots,
    pr_slots: rePr.document.pr_slots,
    resources: rows.map((row) => {
      const r = { resource: row.resource, fetched: row.fetched };
      if (row.issue_number !== undefined) r.issue_number = row.issue_number;
      if (row.pr_number !== undefined) r.pr_number = row.pr_number;
      if (row.fetched === true) {
        r.path = row.path;
        r.sha256 = row.sha256;
      }
      return r;
    }),
  };
  return { ok: true, manifest };
}

// ---------------------------------------------------------------------------
// Final-planner per-collection re-verification + canonical projection (§3)
// ---------------------------------------------------------------------------

// Step 1+2 for one collection: trust NOTHING derived earlier — reparse the
// ledger, re-verify every digest, reparse all raw evidence via
// evidence.mjs, reconstruct every lane again, re-derive both slot sets,
// compare them to the manifest's claims, reparse every fetched PR file,
// and build the canonical planning projection from these derivations only.
export function verifyAndProjectCollection({
  ledgerText,
  manifestText,
  readFile,
  collection_id,
  nonce,
  repository,
  policy,
  now,
}) {
  const ledger = parseLedger(ledgerText, { collection_id, nonce });
  if (!ledger.ok) return ledger;
  const rows = ledger.rows;

  const manifestParsed = parseStrict(manifestText ?? "");
  if (!manifestParsed.ok) return bad("manifest-malformed", manifestParsed.reason);
  const manifest = manifestParsed.value;
  if (!isPlainObject(manifest) || manifest.schema !== MANIFEST_SCHEMA) {
    return bad("manifest-malformed", "schema mismatch");
  }
  if (manifest.collection_id !== collection_id || manifest.nonce !== nonce) {
    return bad("manifest-identity-mismatch");
  }

  // Digest re-verification of every fetched resource.
  const bytesByRow = new Map();
  for (const row of rows) {
    if (row.fetched !== true) continue;
    const bytes = readFile(row.path);
    if (bytes === null || bytes === undefined) return bad("ledger-file-missing", row.path);
    const digest = sha256OfBytes(bytes);
    if (digest !== row.sha256) return bad("ledger-digest-mismatch", row.path);
    bytesByRow.set(row, bytes);
  }
  const enumRow = rows.find((r) => r.resource === "enumeration");
  const enumerationBytes = bytesByRow.get(enumRow);
  if (manifest.enumeration_sha256 !== sha256OfBytes(enumerationBytes)) {
    return bad("manifest-enumeration-mismatch");
  }

  // Independent full re-derivation (issue slots, lanes, PR slots).
  const issueEvidence = new Map();
  for (const row of rows) {
    if (row.resource === "issue") {
      const entry = issueEvidence.get(row.issue_number) ?? {};
      entry.issueBytes = bytesByRow.get(row);
      issueEvidence.set(row.issue_number, entry);
    } else if (row.resource === "comments") {
      const entry = issueEvidence.get(row.issue_number) ?? {};
      entry.commentBytes = bytesByRow.get(row);
      issueEvidence.set(row.issue_number, entry);
    }
  }
  const world = reconstructCollectionLanes(enumerationBytes, issueEvidence, { repository, policy, now });
  if (!world.ok) return world;

  const issueSlots = world.issues.map((i) => i.number).sort((a, b) => a - b);
  if (JSON.stringify(issueSlots) !== JSON.stringify(manifest.issue_slots)) {
    return bad("manifest-claims-mismatch", "issue_slots");
  }

  // EXACTLY one issue row and one comments row per independently
  // re-derived slot; a row for an unenumerated issue refuses (F6).
  const exact = checkExactIssueResources(rows, issueSlots);
  if (!exact.ok) return exact;
  const prSlots = [];
  for (const lane of world.lanes) {
    const rec = lane.reconstruction;
    if (rec.ok && rec.lane !== null && Number.isInteger(rec.lane.pr_number) && rec.lane.pr_number >= 1) {
      prSlots.push({ issue_number: lane.issue_number, pr_number: rec.lane.pr_number });
    }
  }
  prSlots.sort((a, b) => a.issue_number - b.issue_number);
  if (JSON.stringify(prSlots) !== JSON.stringify(manifest.pr_slots)) {
    return bad("manifest-claims-mismatch", "pr_slots");
  }

  // PR evidence: every slot has exactly one pr row; fetched:true rows
  // reparse with repo + PR-number binding; fetched:false rows are accepted
  // ONLY as explicit failure records. Outcomes are keyed by the COMPOUND
  // {issue_number, pr_number} slot identity (F7): two lanes recording the
  // same PR each carry their OWN fetch outcome — keying by PR number alone
  // would let the last-processed slot silently overwrite the first and
  // hide an asymmetric success/failure from the A/B gate.
  const prOutcomes = {};
  const prRows = rows.filter((r) => r.resource === "pr");
  for (const slot of prSlots) {
    const matching = prRows.filter((r) => r.issue_number === slot.issue_number && r.pr_number === slot.pr_number);
    if (matching.length !== 1) {
      return bad("pr-evidence-unaccounted", `slot ${slot.issue_number}:${slot.pr_number}`);
    }
    const row = matching[0];
    const key = `${slot.issue_number}:${slot.pr_number}`;
    if (row.fetched === true) {
      const parsed = parsePr(bytesByRow.get(row).toString("utf8"), { repository, pr_number: slot.pr_number });
      if (!parsed.ok) return bad("pr-evidence-invalid", `PR #${slot.pr_number}: ${parsed.reason}`);
      prOutcomes[key] = { metadata: parsed.pr, head_sha: parsed.pr.head_sha };
    } else {
      prOutcomes[key] = { failed: true };
    }
  }
  for (const row of prRows) {
    if (!prSlots.some((s) => s.issue_number === row.issue_number && s.pr_number === row.pr_number)) {
      return bad("ledger-underived-pr-row", `${row.issue_number}:${row.pr_number}`);
    }
  }

  // Canonical planning projection — every planning-relevant field, built
  // from the planner's own step-1 derivations only.
  const laneProjections = [];
  for (const lane of world.lanes) {
    const rec = lane.reconstruction;
    const reconstructed = rec.ok && rec.lane !== null
      ? {
          lane_id: rec.lane.lane_id,
          state: rec.lane.state,
          next_actor: rec.lane.next_actor,
          event_sequence: rec.lane.event_sequence,
          pr_number: rec.lane.pr_number ?? null,
          pr_head_sha: rec.lane.pr_head_sha ?? null,
          audited_sha: rec.lane.audited_sha ?? null,
          verdict: rec.lane.verdict ?? null,
          patch_cycle: rec.lane.patch_cycle,
          operator_pause: rec.lane.operator_pause,
          lease: rec.lane.lease === null || rec.lane.lease === undefined
            ? null
            : { lease_id: rec.lane.lease.lease_id, holder_login: rec.lane.lease.holder_login, expires_at: rec.lane.lease.expires_at, actor_role: rec.lane.lease.actor_role },
          last_lease_role: rec.lane.last_lease_role ?? null,
          frozen: rec.frozen === true,
        }
      : { failed: true, refusal: rec.refusal ?? "reconstruction-failed" };
    laneProjections.push({
      issue_number: lane.issue_number,
      lane_id: lane.lane_id,
      reconstructed,
      // Per-issue comment-evidence digest over the reconstruction profile
      // in ID order — a new, deleted, or edited comment between
      // collections is a difference.
      comment_evidence_digest: payloadDigest(
        lane.comments
          .slice()
          .sort((a, b) => a.id - b.id)
          .map((c) => ({ id: c.id, user: c.user, body: c.body, created_at: c.created_at, updated_at: c.updated_at })),
      ),
      // The last-activity basis the scan rules consume.
      issue_updated_at: lane.issue.updated_at,
    });
  }
  laneProjections.sort((a, b) => a.issue_number - b.issue_number);

  // Per-issue evidence digests for EVERY enumerated slot (lane or not):
  // dedupe proofs for findings on non-lane issues (e.g. a malformed
  // genesis) are planning-relevant, so their comment streams must be part
  // of the A/B equivalence surface too.
  const issueEvidenceDigests = {};
  for (const [number, record] of world.issueRecords) {
    issueEvidenceDigests[String(number)] = {
      comment_evidence_digest: payloadDigest(
        record.comments
          .slice()
          .sort((a, b) => a.id - b.id)
          .map((c) => ({ id: c.id, user: c.user, body: c.body, created_at: c.created_at, updated_at: c.updated_at })),
      ),
      updated_at: record.issue.updated_at,
    };
  }

  const projection = {
    issue_slots: issueSlots,
    unreadable: world.unreadable.slice().sort((a, b) => a.number - b.number),
    excluded_prs: world.excluded_prs.slice().sort((a, b) => a - b),
    lanes: laneProjections,
    issue_evidence: issueEvidenceDigests,
    pr_slots: prSlots,
    pr_outcomes: prOutcomes,
  };
  return {
    ok: true,
    projection,
    projection_digest: payloadDigest(projection),
    world,
  };
}

// ---------------------------------------------------------------------------
// Step 3: the A/B equivalence gate — any difference refuses with a
// specific code; ab-canonical-digest-difference is the catch-all.
// ---------------------------------------------------------------------------

export function compareProjections(a, b) {
  const canon = (v) => canonicalize(v);
  if (canon(a.issue_slots) !== canon(b.issue_slots)) {
    return bad("ab-issue-set-difference");
  }
  const laneSet = (p) => p.lanes.map((l) => l.lane_id).sort();
  if (canon(laneSet(a)) !== canon(laneSet(b))) {
    return bad("ab-lane-set-difference");
  }
  const laneMap = (p) => p.lanes.map((l) => ({ issue_number: l.issue_number, lane_id: l.lane_id }));
  if (canon(laneMap(a)) !== canon(laneMap(b))) {
    return bad("ab-lane-mapping-difference");
  }
  for (let i = 0; i < a.lanes.length; i++) {
    const la = a.lanes[i];
    const lb = b.lanes[i];
    if (canon(la.reconstructed) !== canon(lb.reconstructed)) {
      return bad("ab-reconstruction-difference", `lane ${la.lane_id}`);
    }
    if (la.comment_evidence_digest !== lb.comment_evidence_digest) {
      return bad("ab-comment-evidence-difference", `lane ${la.lane_id}`);
    }
  }
  if (canon(a.pr_slots) !== canon(b.pr_slots)) {
    return bad("ab-pr-slot-difference");
  }
  // Outcomes are keyed by compound {issue}:{pr} slot identity (F7);
  // iterate the UNION of both key sets so a key present on only one side
  // is a difference, never silently skipped.
  for (const key of new Set([...Object.keys(a.pr_outcomes), ...Object.keys(b.pr_outcomes)])) {
    const oa = a.pr_outcomes[key];
    const ob = b.pr_outcomes[key];
    if (oa === undefined || ob === undefined) {
      return bad("ab-fetch-outcome-difference", `slot ${key}`);
    }
    if ((oa.failed === true) !== (ob.failed === true)) {
      return bad("ab-fetch-outcome-difference", `slot ${key}`);
    }
    if (oa.failed !== true && ob.failed !== true) {
      if (oa.head_sha !== ob.head_sha) return bad("ab-head-sha-difference", `slot ${key}`);
      if (canon(oa.metadata) !== canon(ob.metadata)) return bad("ab-pr-metadata-difference", `slot ${key}`);
    }
  }
  // Catch-all over the complete projection: anything the specific gates
  // did not name (issue activity time, unreadable set, excluded PRs…).
  if (payloadDigest(a) !== payloadDigest(b)) {
    return bad("ab-canonical-digest-difference");
  }
  return { ok: true };
}
