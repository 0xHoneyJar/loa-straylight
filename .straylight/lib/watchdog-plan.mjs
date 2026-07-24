// Straylight Control Plane v1 — final watchdog planning (pure).
//
// planWatchdogWrites consumes TWO complete, independently collected and
// sealed evidence collections (rev. 3 §3). It trusts NOTHING derived
// earlier — not stage outputs, not manifests, not filenames, not either
// collection's reconstruction:
//
//   Step 1 — independent per-collection re-verification
//            (collection.mjs verifyAndProjectCollection: ledger reparse,
//            digest re-verification, evidence.mjs reparse of every raw
//            file, fresh reconstruction, slot re-derivation vs manifest
//            claims, PR reparse with binding).
//   Step 2 — canonical planning projection per collection.
//   Step 3 — the equivalence gate: ANY planning-relevant difference
//            refuses with its specific ab-* code (compareProjections).
//   Step 4 — only after both collections are independently valid and
//            canonically equivalent does the scan run, keyed by issue
//            number (C8), with dedupe proofs derived from the compared
//            comment evidence, emitting one straylight.write-plan.v1.
//
// Structural discipline (§10): at most one state-advancing event per
// issue per plan, positioned after any findings for that issue.
//
// Returns { ok: true, plan, empty } (empty=true → the caller uses exit 3),
// or { ok: false, reason, detail? } (→ exit 2, zero writes).

import { verifyAndProjectCollection, compareProjections } from "./collection.mjs";
import { scan } from "./watchdog.mjs";
import { hasFullLineDedupe, WRITE_PLAN_SCHEMA } from "./write-plan.mjs";
import { renderPayload, MARKERS } from "./markers.mjs";
import { payloadDigest } from "./canonical.mjs";
import { createHash } from "node:crypto";

const BOT = "github-actions[bot]";

function bad(reason, detail) {
  return detail === undefined ? { ok: false, reason } : { ok: false, reason, detail };
}

export function sha256OfText(text) {
  return "sha256:" + createHash("sha256").update(text, "utf8").digest("hex");
}

// A dedupe identity is "already posted" ONLY when a BOT-authored comment
// carrying a straylight machine marker contains the exact full line —
// scanning all authors would let any actor suppress a recovery forever
// (B8), and substring matching is never identity (C4).
export function dedupeAlreadyPosted(comments, dedupeKey) {
  return comments.some(
    (c) =>
      c.user === BOT &&
      (c.body.includes(`<!-- ${MARKERS.event} -->`) || c.body.includes(`<!-- ${MARKERS.watchdogResult} -->`)) &&
      hasFullLineDedupe(c.body, dedupeKey),
  );
}

// Build the comment document (the executor's {body} endpoint schema) for
// a watchdog action, returning { name, content, sha256 } for the plan.
function buildEventBody(action, now) {
  const event = {
    schema: "straylight.event.v1",
    event_id: action.event_id,
    lane_id: action.lane_id,
    sequence: action.sequence,
    actor_role: "system",
    github_actor: BOT,
    event_type: action.event_type,
    prior_state: action.prior_state,
    reason: action.detail,
    occurred_at: now,
  };
  if (action.requested_state !== undefined) event.requested_state = action.requested_state;
  if (action.head_sha !== undefined) event.head_sha = action.head_sha;
  const body = [
    "## Straylight watchdog recovery (shadow mode)",
    "",
    `dedupe:${action.dedupe_key}`,
    "",
    renderPayload(MARKERS.event, event),
  ].join("\n");
  return JSON.stringify({ body });
}

function buildFindingBody(action, now) {
  const finding = { ...action, observed_at: now };
  const body = [
    "## Straylight watchdog finding (shadow mode)",
    "",
    `dedupe:${action.dedupe_key}`,
    "",
    renderPayload(MARKERS.watchdogResult, finding),
  ].join("\n");
  return JSON.stringify({ body });
}

// The main entry. `collections` = { A: {ledgerText, manifestText, readFile},
//                                   B: {…} }.
export function planWatchdogWrites({ collections, nonce, repository, policy, now }) {
  // Step 1+2: independent verification + projection, per collection.
  const projections = {};
  for (const id of ["A", "B"]) {
    const c = collections?.[id];
    if (c === undefined) return bad("collection-missing", id);
    const verified = verifyAndProjectCollection({
      ledgerText: c.ledgerText,
      manifestText: c.manifestText,
      readFile: c.readFile,
      collection_id: id,
      nonce,
      repository,
      policy,
      now,
    });
    if (!verified.ok) {
      return bad(verified.reason, `collection ${id}: ${verified.detail ?? ""}`);
    }
    projections[id] = verified;
  }

  // Step 3: the equivalence gate. ANY difference exits 2.
  const equal = compareProjections(projections.A.projection, projections.B.projection);
  if (!equal.ok) return equal;

  // Step 4: plan from the (now provably stable) reconstruction — use
  // collection A's verified world (B is canonically equal).
  const world = projections.A.world;
  const projection = projections.A.projection;

  // Assemble scan input, ISSUE-KEYED (C8): every lane entry carries the
  // issue it was reconstructed from; unreadable marker-bearing issues are
  // fed as validation-failing stubs so they surface as explicit
  // malformed-lane findings on their own issue, never dropped.
  const scanLanesInput = [];
  const context = { now, pr_heads: {}, pr_head_unresolved: [], last_activity: {} };
  for (const lane of world.lanes) {
    const rec = lane.reconstruction;
    if (rec.ok && rec.lane !== null && rec.frozen !== true) {
      scanLanesInput.push({ ...rec.lane, issue_number: lane.issue_number });
      context.last_activity[rec.lane.lane_id] = lane.issue.updated_at;
      if (Number.isInteger(rec.lane.pr_number)) {
        // Outcomes are keyed by the compound {issue}:{pr} slot identity
        // (F7): THIS lane's outcome is the one fetched FOR this issue.
        const outcome = projection.pr_outcomes[`${lane.issue_number}:${rec.lane.pr_number}`];
        const prKey = String(rec.lane.pr_number);
        if (outcome !== undefined && outcome.failed !== true) {
          if (prKey in context.pr_heads && context.pr_heads[prKey] !== outcome.head_sha) {
            // Two issues resolved the SAME PR to different heads inside
            // one stable A/B world — physically impossible for honest
            // evidence; refuse rather than let either lane scan against
            // the other's head.
            return bad("pr-head-conflict", `PR #${prKey} resolved to different heads across issues`);
          }
          if (context.pr_head_unresolved.includes(prKey)) {
            return bad("pr-head-conflict", `PR #${prKey} resolved for one issue but failed for another`);
          }
          context.pr_heads[prKey] = outcome.head_sha;
        } else if (outcome !== undefined) {
          // The explicit both-collections fetch failure: unresolved head,
          // fail-closed finding (pr_head_unresolved), never "no PR".
          if (prKey in context.pr_heads) {
            return bad("pr-head-conflict", `PR #${prKey} resolved for one issue but failed for another`);
          }
          context.pr_head_unresolved.push(prKey);
        }
      }
    } else if (rec.ok && rec.frozen === true) {
      // The policy gate proved the committed policy valid + enabled in
      // this same run; a frozen reconstruction contradicts it.
      return bad("frozen-under-enabled-policy", `issue #${lane.issue_number}`);
    } else {
      // Failed reconstruction: a validation-failing stub keyed to its
      // issue. The scan turns it into escalate-malformed-lane.
      scanLanesInput.push({
        issue_number: lane.issue_number,
        lane_id: lane.lane_id,
        event_sequence: lane.issue_number,
      });
    }
  }
  for (const u of world.unreadable) {
    // An unreadable marker-bearing issue has NO provable lane identity —
    // the finding is keyed by the trusted issue number ALONE; fabricating
    // a synthetic lane_id would put an untrusted identity into the
    // durable finding record (F8).
    scanLanesInput.push({
      issue_number: u.number,
      event_sequence: u.number,
    });
  }

  const scanned = scan(scanLanesInput, policy, context);
  if (!scanned.ok) return bad(scanned.refusal ?? "scan-failed", scanned.detail);

  // Dedupe proofs from the COMPARED comment evidence: an action whose
  // exact full-line identity already exists in a bot-authored machine
  // comment on its issue is already posted.
  const operations = [];
  const bodies = [];
  let opCounter = 0;
  const stateAdvancedIssues = new Set();
  // Findings first, state-advancing last, per issue (§10): partition.
  const findings = scanned.actions.filter((a) => a.type !== "post-event");
  const events = scanned.actions.filter((a) => a.type === "post-event");

  for (const action of [...findings, ...events]) {
    if (!Number.isInteger(action.issue_number)) {
      // An action the planner cannot key to an issue must never be
      // dropped silently — refuse the sweep.
      return bad("action-issue-unkeyed", action.dedupe_key);
    }
    const record = world.issueRecords.get(action.issue_number);
    if (record === undefined) return bad("action-issue-unknown", String(action.issue_number));
    if (dedupeAlreadyPosted(record.comments, action.dedupe_key)) continue;

    if (action.type === "post-event") {
      // At most ONE state-advancing event per issue per plan.
      if (stateAdvancedIssues.has(action.issue_number)) continue;
      stateAdvancedIssues.add(action.issue_number);
      opCounter += 1;
      const opId = `op-${opCounter}`;
      const content = buildEventBody(action, now);
      bodies.push({ name: `${opId}.json`, content });
      operations.push({
        op_id: opId,
        kind: "post-state-advancing-event",
        issue_number: action.issue_number,
        lane_id: action.lane_id,
        dedupe_key: action.dedupe_key,
        body_file: `${opId}.json`,
        body_sha256: sha256OfText(content),
      });
    } else {
      opCounter += 1;
      const opId = `op-${opCounter}`;
      const content = buildFindingBody(action, now);
      bodies.push({ name: `${opId}.json`, content });
      operations.push({
        op_id: opId,
        kind: "post-watchdog-finding",
        issue_number: action.issue_number,
        dedupe_key: action.dedupe_key,
        body_file: `${opId}.json`,
        body_sha256: sha256OfText(content),
      });
    }
  }

  const plan = {
    schema: WRITE_PLAN_SCHEMA,
    plan_id: `${nonce}-watchdog`,
    nonce,
    repository,
    operations,
  };
  return {
    ok: true,
    empty: operations.length === 0,
    plan,
    bodies,
    projection_digest: payloadDigest(projection),
  };
}
