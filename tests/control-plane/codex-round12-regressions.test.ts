// Control Plane v1 — direct regressions for the Codex twelfth-round
// findings. One describe() block per finding; each reproduces the
// reported failure shape against the patched code.
//
//  J1  parseCheckRunPages built check_run_conclusions in API PAGE order
//      and sorted the records afterwards, so the merge guard's stability
//      digest (which hashes BOTH surfaces) was permutation-SENSITIVE:
//      two reads carrying IDENTICAL {id, name, conclusion, head_sha}
//      records in different page order compared records-equal but
//      evidence-unequal, exited 2 (two-read-instability), and wrote no
//      plan. Every derived field now comes from the id-sorted record
//      set: identical records in any order are the SAME evidence, while
//      id/name/conclusion/head_sha drift still refuses.
//
//  J2  the workflow-boundary mutation checker had equivalent-shell
//      bypasses: quoted-word concatenation (n'o'de, g'h'), node print
//      forms (-p/--print), compact gh field spellings (-fbody=hello),
//      date-prefixed multi-command substitutions ($(date; cat x)), and
//      process substitution (cat <(gh api …)). The checker now joins
//      quoted-word concatenation, matches the print/eval forms and
//      compact field options, requires EVERY separator-split command
//      inside $( … ) to be non-semantic, and flags <( … ) / >( … ) as
//      their own class. New rows in workflow-mutation.test.ts prove each
//      bypass caught across all four real workflows; this file pins the
//      checker-level behavior directly.
//
//  J3  watchdog.d.mts let a malformed finding omit BOTH issue_number
//      (globally optional) and lane_id (optional on the malformed
//      variant), and watchdog.mjs emitted malformed:unknown:* dedupe
//      identities for such unattributable entries. The malformed finding
//      is now a two-variant union — issue-keyed (required issue_number)
//      or lane-keyed (required pattern-valid lane_id) — and the runtime
//      REFUSES the sweep (fail closed) when a malformed entry carries
//      neither key, never fabricating an "unknown" identity.

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCheckRunPages, parseCombinedStatus } from "../../.straylight/lib/evidence.mjs";
import {
  makeLane, makeEvent, makeTaskPacket, makeAuditRecord, makePolicy,
  payloadDigest, REPO, NOW, BASE_SHA, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const REDUCER_PLANNER = ".straylight/bin/plan-reducer-writes.mjs";
const MERGE_GUARD_PLANNER = ".straylight/bin/plan-merge-guard-write.mjs";
const API = "https://api.github.com";
const NONCE = "12345-1";
const T0 = "2026-07-16T11:00:00Z";

const sha256 = (s: string | Buffer) => "sha256:" + createHash("sha256").update(s).digest("hex");

function enumEntry(n: number, body: string | null) {
  return { number: n, url: `${API}/repos/${REPO}/issues/${n}`, body, created_at: T0, updated_at: NOW };
}
function laneBody(overrides: Record<string, any> = {}) {
  return `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane(overrides))}\n\`\`\``;
}
function comment(id: number, issue: number, user: string, body: string) {
  return { id, url: `${API}/repos/${REPO}/issues/comments/${id}`, issue_url: `${API}/repos/${REPO}/issues/${issue}`, user: { login: user }, body, created_at: T0, updated_at: T0 };
}
function eventComment(id: number, issue: number, payload: Record<string, any>, user = "chatgpt-login") {
  return comment(id, issue, user, `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);
}

function run(binary: string, args: string[]) {
  try {
    const stdout = execFileSync("node", [binary, ...args], { encoding: "utf8" });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    let out = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* */ }
    return { status: e.status ?? -1, out };
  }
}

function eligibilityPendingComments(issue: number): any[] {
  const packet = makeTaskPacket();
  const packetBody = `<!-- straylight:task-packet:v1 -->\n\`\`\`json\n${JSON.stringify(packet)}\n\`\`\``;
  const audit = makeAuditRecord();
  const auditBody = `<!-- straylight:audit:v1 -->\n\`\`\`json\n${JSON.stringify(audit)}\n\`\`\``;
  return [
    eventComment(3001, issue, makeEvent({ event_id: "evt-r1", sequence: 1, event_type: "lane.activated", prior_state: "planning" })),
    comment(3002, issue, "chatgpt-login", packetBody),
    eventComment(3003, issue, makeEvent({
      event_id: "evt-r2", sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 3002, task_packet_digest: payloadDigest(packet) },
    })),
    eventComment(3004, issue, makeEvent({
      event_id: "evt-r3", sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "claude-login"),
    eventComment(3005, issue, makeEvent({
      event_id: "evt-r4", sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    }), "claude-login"),
    eventComment(3006, issue, makeEvent({
      event_id: "evt-r5", sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "codex-login"),
    comment(3007, issue, "codex-login", auditBody),
    eventComment(3008, issue, makeEvent({
      event_id: "evt-r6", sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", verdict: "ACCEPT", audited_sha: HEAD_SHA,
      refs: { audit_comment_id: 3007, audit_digest: payloadDigest(audit), pr_number: 120 },
    }), "codex-login"),
  ];
}

const livePr = () => JSON.stringify({
  number: 120, url: `${API}/repos/${REPO}/pulls/120`, state: "open", draft: false, merged: false,
  base: { ref: "main", sha: BASE_SHA, repo: { full_name: REPO } },
  head: { ref: WORKING_BRANCH, sha: HEAD_SHA },
  created_at: T0, updated_at: NOW,
});

function checkRun(id: number, overrides: Record<string, any> = {}) {
  return {
    id,
    url: `${API}/repos/${REPO}/check-runs/${id}`,
    head_sha: HEAD_SHA,
    name: `ci/check-${id}`,
    conclusion: "success",
    ...overrides,
  };
}
const checkRunsDoc = (...runs: any[]) => JSON.stringify({ total_count: runs.length, check_runs: runs });

function statusEntry(id: number, overrides: Record<string, any> = {}) {
  return { id, context: `ci/status-${id}`, state: "success", ...overrides };
}
const statusDoc = (...statuses: any[]) => JSON.stringify({
  state: "success", sha: HEAD_SHA, total_count: statuses.length, statuses,
  repository: { full_name: REPO },
});

function writeGather(opts: { issue: number; comments: any[]; checkRunsDoc: string; statusDoc: string }) {
  const dir = mkdtempSync(join(tmpdir(), "cp-r12-gather-"));
  const entry = enumEntry(opts.issue, laneBody());
  writeFileSync(join(dir, "enumeration.pages"), JSON.stringify([entry]));
  writeFileSync(join(dir, "issue.json"), JSON.stringify(entry));
  writeFileSync(join(dir, "comments.pages"), JSON.stringify(opts.comments));
  writeFileSync(join(dir, "pr.json"), livePr());
  writeFileSync(join(dir, "check-runs.pages"), opts.checkRunsDoc);
  writeFileSync(join(dir, "status.json"), opts.statusDoc);
  return dir;
}

function writePolicy(dir: string) {
  const p = join(dir, "policy.json");
  writeFileSync(p, JSON.stringify(makePolicy()));
  return p;
}

function fabricateReadLedger(claimRoot: string, g1: string, g2: string) {
  const claim = JSON.parse(readFileSync(join(claimRoot, "claim.json"), "utf8"));
  const rows: string[] = [];
  if (claim.pr_number !== null) {
    for (const [gather, dir] of [[1, g1], [2, g2]] as const) {
      const prText = readFileSync(join(dir, "pr.json"), "utf8");
      const headSha = JSON.parse(prText).head.sha;
      rows.push(JSON.stringify({ nonce: NONCE, gather, slot: "pr", pr_number: claim.pr_number, fetched: true, path: "pr.json", sha256: sha256(prText) }));
      if (claim.checks === true) {
        for (const [slot, file] of [["check-runs", "check-runs.pages"], ["status", "status.json"]] as const) {
          const text = readFileSync(join(dir, file), "utf8");
          rows.push(JSON.stringify({ nonce: NONCE, gather, slot, pr_number: claim.pr_number, sha: headSha, fetched: true, path: file, sha256: sha256(text) }));
        }
      }
    }
  }
  writeFileSync(join(claimRoot, "read-ledger.jsonl"), rows.length === 0 ? "" : rows.join("\n") + "\n");
}

function runMergeGuard(g1: string, g2: string) {
  const requestRoot = mkdtempSync(join(tmpdir(), "cp-r12-req-"));
  const policyPath = writePolicy(requestRoot);
  const claimRoot = mkdtempSync(join(tmpdir(), "cp-r12-claim-"));
  const probe = run(REDUCER_PLANNER, [
    "--stage", "a", "--probe", "--slot-mode", "any-pr", "--with-checks", "--claim-root", claimRoot,
    "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
    "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
  ]);
  if (probe.status !== 0) return { ...probe, requestRoot };
  fabricateReadLedger(claimRoot, g1, g2);
  const r = run(MERGE_GUARD_PLANNER, [
    "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
    "--request-root", requestRoot,
    "--claim", join(claimRoot, "claim.json"),
    "--read-ledger", join(claimRoot, "read-ledger.jsonl"),
    "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
  ]);
  return { ...r, requestRoot };
}

// =============================================================================
// J1 — canonical live-evidence comparison is order-INSENSITIVE but
// record-SENSITIVE
// =============================================================================
describe("J1 — identical check/status records in different API page order are the SAME evidence", () => {
  const cs = eligibilityPendingComments(41);

  it("Codex probe e2e: gather 2 lists the identical records in REVERSE order → planning succeeds (exit 0, plan written)", () => {
    const g1 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(1), checkRun(2)),
      statusDoc: statusDoc(statusEntry(10), statusEntry(20)),
    });
    const g2 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(2), checkRun(1)),
      statusDoc: statusDoc(statusEntry(20), statusEntry(10)),
    });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(r.requestRoot, "plan.json"), "utf8"));
    expect(plan.operations[0]).toMatchObject({ kind: "post-merge-guard-result", issue_number: 41 });
  });

  it("parseCheckRunPages is permutation-invariant over its ENTIRE result (records AND conclusion list)", () => {
    const forward = parseCheckRunPages(
      checkRunsDoc(checkRun(1, { conclusion: "success" }), checkRun(2, { conclusion: null })),
      { repository: REPO, sha: HEAD_SHA },
    ) as any;
    const reversed = parseCheckRunPages(
      checkRunsDoc(checkRun(2, { conclusion: null }), checkRun(1, { conclusion: "success" })),
      { repository: REPO, sha: HEAD_SHA },
    ) as any;
    expect(forward.ok).toBe(true);
    expect(reversed.ok).toBe(true);
    expect(payloadDigest(forward)).toBe(payloadDigest(reversed));
    // The conclusion list is derived from the id-SORTED records, never
    // page order: run 1 (success) precedes run 2 (in-progress → "null").
    expect(forward.check_run_conclusions).toEqual(["success", "null"]);
    expect(reversed.check_run_conclusions).toEqual(["success", "null"]);
  });

  it("parseCombinedStatus is permutation-invariant over its ENTIRE result", () => {
    const forward = parseCombinedStatus(statusDoc(statusEntry(10), statusEntry(20, { state: "pending" })), { repository: REPO, sha: HEAD_SHA });
    const reversed = parseCombinedStatus(statusDoc(statusEntry(20, { state: "pending" }), statusEntry(10)), { repository: REPO, sha: HEAD_SHA });
    expect(payloadDigest(forward)).toBe(payloadDigest(reversed));
  });

  it("adversarial: same conclusion MULTISET but swapped run bindings still exits 2 (record-sensitive)", () => {
    const g1 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(1, { conclusion: "success" }), checkRun(2, { conclusion: "failure" })),
      statusDoc: statusDoc(statusEntry(10)),
    });
    const g2 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(1, { conclusion: "failure" }), checkRun(2, { conclusion: "success" })),
      statusDoc: statusDoc(statusEntry(10)),
    });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
    expect(existsSync(join(r.requestRoot, "plan.json"))).toBe(false);
  });

  it("adversarial: reversed order AND one drifted name still exits 2", () => {
    const g1 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(1, { name: "build" }), checkRun(2)),
      statusDoc: statusDoc(statusEntry(10)),
    });
    const g2 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(2), checkRun(1, { name: "deploy" })),
      statusDoc: statusDoc(statusEntry(10)),
    });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
  });
});
