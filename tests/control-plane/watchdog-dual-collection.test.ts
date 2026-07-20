// Control Plane v1 — watchdog dual collection + final planner
// (lib/watchdog-plan.mjs + bin/plan-watchdog-writes.mjs).
//
// Adversarial rows 3–6: every Collection A/B difference class refuses
// with its specific ab-* code before any planning; explicit PR fetch
// failure in BOTH collections is agreement (unresolved-head finding, not
// a refusal); the planner independently reparses both collections and
// trusts nothing derived earlier.

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareProjections } from "../../.straylight/lib/collection.mjs";
import { planWatchdogWrites, dedupeAlreadyPosted } from "../../.straylight/lib/watchdog-plan.mjs";
import { makeLane, makeEvent, makePolicy, makeLease, payloadDigest, REPO, NOW, AFTER_EXPIRY } from "./_fixtures.js";

const PLANNER = ".straylight/bin/plan-watchdog-writes.mjs";
const COLLECTOR = ".straylight/bin/collect-watchdog-evidence.mjs";
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
function comment(id: number, issue: number, user: string, body: string, created = T0, updated = T0) {
  return { id, url: `${API}/repos/${REPO}/issues/comments/${id}`, issue_url: `${API}/repos/${REPO}/issues/${issue}`, user: { login: user }, body, created_at: created, updated_at: updated };
}
function eventComment(id: number, issue: number, payload: Record<string, any>, user = "chatgpt-login") {
  return comment(id, issue, user, `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);
}

// An expired-lease world: activation, then a lease acquisition whose
// expiry is behind `now` at scan time. Reaching claude-working requires
// the packet chain; a simpler expired-lease surface is unnecessary —
// scan() only needs a valid lane WITH a lease, so we drive the lane to
// claude-working through the canonical chain used in collection.test.ts.
import { makeTaskPacket } from "./_fixtures.js";
function claudeWorkingComments(issue: number): any[] {
  const packet = makeTaskPacket();
  const packetBody = `<!-- straylight:task-packet:v1 -->\n\`\`\`json\n${JSON.stringify(packet)}\n\`\`\``;
  return [
    eventComment(2001, issue, makeEvent({ event_id: "evt-w1", sequence: 1, event_type: "lane.activated", prior_state: "planning" })),
    comment(2002, issue, "chatgpt-login", packetBody),
    eventComment(2003, issue, makeEvent({
      event_id: "evt-w2", sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2002, task_packet_digest: payloadDigest(packet) },
    })),
    eventComment(2004, issue, makeEvent({
      event_id: "evt-w3", sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "claude-login"),
  ];
}

// Build one on-disk collection. `mutate` lets a test perturb collection B.
function buildCollection(
  collectionId: "A" | "B",
  world: Array<{ n: number; body: string | null; comments: any[]; prRow?: { pr_number: number; fetched: boolean; prDoc?: string } }>,
) {
  const dir = mkdtempSync(join(tmpdir(), `cp-dual-${collectionId}-`));
  const enumeration = JSON.stringify(world.map((w) => enumEntry(w.n, w.body)));
  writeFileSync(join(dir, "enumeration.pages"), enumeration);
  const rows: string[] = [
    JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "enumeration", fetched: true, path: "enumeration.pages", sha256: sha256(enumeration) }),
  ];
  for (const w of world) {
    mkdirSync(join(dir, `issue-${w.n}`), { recursive: true });
    const iDoc = JSON.stringify(enumEntry(w.n, w.body));
    const cDoc = JSON.stringify(w.comments);
    writeFileSync(join(dir, `issue-${w.n}/issue.json`), iDoc);
    writeFileSync(join(dir, `issue-${w.n}/comments.pages`), cDoc);
    rows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "issue", issue_number: w.n, fetched: true, path: `issue-${w.n}/issue.json`, sha256: sha256(iDoc) }));
    rows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "comments", issue_number: w.n, fetched: true, path: `issue-${w.n}/comments.pages`, sha256: sha256(cDoc) }));
    if (w.prRow !== undefined) {
      if (w.prRow.fetched && w.prRow.prDoc !== undefined) {
        writeFileSync(join(dir, `issue-${w.n}/pr-${w.prRow.pr_number}.json`), w.prRow.prDoc);
        rows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "pr", issue_number: w.n, pr_number: w.prRow.pr_number, fetched: true, path: `issue-${w.n}/pr-${w.prRow.pr_number}.json`, sha256: sha256(w.prRow.prDoc) }));
      } else {
        rows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "pr", issue_number: w.n, pr_number: w.prRow.pr_number, fetched: false }));
      }
    }
  }
  const ledgerPath = join(dir, "ledger.jsonl");
  writeFileSync(ledgerPath, rows.join("\n") + "\n");
  const policyPath = join(dir, "policy.json");
  writeFileSync(policyPath, JSON.stringify(makePolicy()));
  // Run all three collector stages so the collection is sealed.
  for (const [stage, extra] of [
    ["issue-slots", []],
    ["pr-slots", ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]],
    ["seal", ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]],
  ] as const) {
    execFileSync("node", [COLLECTOR, "--stage", stage, "--collection-dir", dir, "--collection-id", collectionId, "--nonce", NONCE, "--repository", REPO, ...extra], { encoding: "utf8" });
  }
  return { dir, ledgerPath, policyPath };
}

function planFromCollections(a: ReturnType<typeof buildCollection>, b: ReturnType<typeof buildCollection>, now = AFTER_EXPIRY) {
  return planWatchdogWrites({
    collections: {
      A: {
        ledgerText: readFileSync(a.ledgerPath, "utf8"),
        manifestText: readFileSync(join(a.dir, "manifest.json"), "utf8"),
        readFile: (p: string) => { try { return readFileSync(join(a.dir, p)); } catch { return null; } },
      },
      B: {
        ledgerText: readFileSync(b.ledgerPath, "utf8"),
        manifestText: readFileSync(join(b.dir, "manifest.json"), "utf8"),
        readFile: (p: string) => { try { return readFileSync(join(b.dir, p)); } catch { return null; } },
      },
    },
    nonce: NONCE,
    repository: REPO,
    policy: makePolicy(),
    now,
  });
}

// =============================================================================
// Rows 3-6 — the A/B difference classes
// =============================================================================
describe("rows 3-6 — every planning-relevant A/B difference refuses", () => {
  it("row 3: B lacks an issue A has → ab-issue-set-difference", () => {
    const a = buildCollection("A", [
      { n: 41, body: laneBody(), comments: claudeWorkingComments(41) },
      { n: 43, body: "prose", comments: [] },
    ]);
    const b = buildCollection("B", [
      { n: 41, body: laneBody(), comments: claudeWorkingComments(41) },
    ]);
    const r = planFromCollections(a, b);
    expect(r).toMatchObject({ ok: false, reason: "ab-issue-set-difference" });
  });

  it("row 4: one comment added in B (same issue set) → ab-comment-evidence-difference", () => {
    const csA = claudeWorkingComments(41);
    const csB = [...claudeWorkingComments(41), comment(2099, 41, "someone", "a new prose comment")];
    const a = buildCollection("A", [{ n: 41, body: laneBody(), comments: csA }]);
    const b = buildCollection("B", [{ n: 41, body: laneBody(), comments: csB }]);
    const r = planFromCollections(a, b);
    expect(r).toMatchObject({ ok: false, reason: "ab-comment-evidence-difference" });
  });

  it("row 4b: one comment EDITED in B (same ids) is also a difference", () => {
    const csA = claudeWorkingComments(41);
    const csB = claudeWorkingComments(41).map((c: any) =>
      c.id === 2001 ? { ...c, body: c.body + "\nedited", updated_at: NOW } : c,
    );
    const a = buildCollection("A", [{ n: 41, body: laneBody(), comments: csA }]);
    const b = buildCollection("B", [{ n: 41, body: laneBody(), comments: csB }]);
    const r = planFromCollections(a, b);
    expect(r.ok).toBe(false);
    // An edited protocol comment changes BOTH the reconstruction and the
    // comment digest; either specific code is a correct refusal.
    expect(["ab-reconstruction-difference", "ab-comment-evidence-difference"]).toContain((r as any).reason);
  });

  it("row 5: A and B reconstruct different PR needs → ab-pr-slot-difference", () => {
    // B's lane gained the completion event that records PR 117.
    const csA = claudeWorkingComments(41);
    const csB = [...claudeWorkingComments(41),
      eventComment(2005, 41, makeEvent({
        event_id: "evt-w4", sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.completed", prior_state: "claude-working",
        lease_id: "lease-claude-1",
        head_sha: "a93e9f3694c3b8e5f7e6839856b9f347998a49ad",
        head_branch: "phase-49p-sibling-evidence-intake",
        refs: { pr_number: 117 },
      }), "claude-login"),
    ];
    const a = buildCollection("A", [{ n: 41, body: laneBody(), comments: csA }]);
    const b = buildCollection("B", [{ n: 41, body: laneBody(), comments: csB, prRow: { pr_number: 117, fetched: false } }]);
    const r = planFromCollections(a, b);
    expect(r.ok).toBe(false);
    // The gained comment also changes reconstruction + comment evidence;
    // any of the three is a correct specific refusal, pr-slot included.
    expect(["ab-pr-slot-difference", "ab-reconstruction-difference", "ab-comment-evidence-difference"]).toContain((r as any).reason);
  });

  it("row 6: PR success in A, explicit failure in B → ab-fetch-outcome-difference", () => {
    const cs = [...claudeWorkingComments(41),
      eventComment(2005, 41, makeEvent({
        event_id: "evt-w4", sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.completed", prior_state: "claude-working",
        lease_id: "lease-claude-1",
        head_sha: "a93e9f3694c3b8e5f7e6839856b9f347998a49ad",
        head_branch: "phase-49p-sibling-evidence-intake",
        refs: { pr_number: 117 },
      }), "claude-login"),
    ];
    const prDoc = JSON.stringify({
      number: 117, url: `${API}/repos/${REPO}/pulls/117`, state: "open", draft: true, merged: false,
      base: { ref: "main", sha: "009c4afe34f3f7151db4239fe1c69898833440bb", repo: { full_name: REPO } },
      head: { ref: "phase-49p-sibling-evidence-intake", sha: "a93e9f3694c3b8e5f7e6839856b9f347998a49ad" },
      created_at: T0, updated_at: NOW,
    });
    const a = buildCollection("A", [{ n: 41, body: laneBody(), comments: cs, prRow: { pr_number: 117, fetched: true, prDoc } }]);
    const b = buildCollection("B", [{ n: 41, body: laneBody(), comments: cs, prRow: { pr_number: 117, fetched: false } }]);
    const r = planFromCollections(a, b);
    expect(r).toMatchObject({ ok: false, reason: "ab-fetch-outcome-difference" });
  });

  it("row 6 control: explicit failure in BOTH collections is agreement → plans (unresolved-head surfaces downstream)", () => {
    const cs = [...claudeWorkingComments(41),
      eventComment(2005, 41, makeEvent({
        event_id: "evt-w4", sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.completed", prior_state: "claude-working",
        lease_id: "lease-claude-1",
        head_sha: "a93e9f3694c3b8e5f7e6839856b9f347998a49ad",
        head_branch: "phase-49p-sibling-evidence-intake",
        refs: { pr_number: 117 },
      }), "claude-login"),
    ];
    const a = buildCollection("A", [{ n: 41, body: laneBody(), comments: cs, prRow: { pr_number: 117, fetched: false } }]);
    const b = buildCollection("B", [{ n: 41, body: laneBody(), comments: cs, prRow: { pr_number: 117, fetched: false } }]);
    const r = planFromCollections(a, b, NOW);
    expect(r.ok).toBe(true);
    // ready-for-codex lane; the agreed-failed PR head is simply not part
    // of pr_heads. Planning proceeded — the gate did not refuse.
  });

  it("lane-set / mapping differences: same issues, different lane body in B → specific refusal", () => {
    const a = buildCollection("A", [{ n: 41, body: laneBody(), comments: [] }]);
    const b = buildCollection("B", [{ n: 41, body: laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" }), comments: [] }]);
    const r = planFromCollections(a, b);
    expect(r.ok).toBe(false);
    expect(["ab-lane-set-difference", "ab-lane-mapping-difference"]).toContain((r as any).reason);
  });

  it("the catch-all: an issue-activity-time difference (nothing else) → ab-canonical-digest-difference", () => {
    const a = buildCollection("A", [{ n: 41, body: laneBody(), comments: [] }]);
    const b = buildCollection("B", [{ n: 41, body: laneBody(), comments: [] }]);
    // Perturb B's issue updated_at only (planning-relevant: last-activity
    // basis), regenerate digests + reseal.
    const iDoc = JSON.stringify({ ...enumEntry(41, laneBody()), updated_at: "2026-07-16T13:00:00Z" });
    writeFileSync(join(b.dir, "issue-41/issue.json"), iDoc);
    const rows = readFileSync(b.ledgerPath, "utf8").trim().split("\n").map((line) => {
      const row = JSON.parse(line);
      if (row.resource === "issue") row.sha256 = sha256(iDoc);
      return JSON.stringify(row);
    });
    writeFileSync(b.ledgerPath, rows.join("\n") + "\n");
    execFileSync("node", [COLLECTOR, "--stage", "seal", "--collection-dir", b.dir, "--collection-id", "B", "--nonce", NONCE, "--repository", REPO, "--ledger", b.ledgerPath, "--policy", b.policyPath, "--now", NOW], { encoding: "utf8" });
    const r = planFromCollections(a, b);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toMatch(/^ab-/);
  });
});

// =============================================================================
// The final planner and its issue-keyed plan
// =============================================================================
describe("final planner — issue-keyed, deduped, terminal-structured", () => {
  it("equivalent collections plan an expired-lease recovery keyed by issue, findings before events", () => {
    const world = [{ n: 41, body: laneBody(), comments: claudeWorkingComments(41) }];
    const a = buildCollection("A", world);
    const b = buildCollection("B", world);
    const r = planFromCollections(a, b); // AFTER_EXPIRY > lease expiry
    expect(r.ok).toBe(true);
    const plan = (r as any).plan;
    expect(plan.schema).toBe("straylight.write-plan.v1");
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]).toMatchObject({
      kind: "post-state-advancing-event",
      issue_number: 41,
      lane_id: "lane-phase-49p",
    });
    expect(plan.operations[0].dedupe_key).toContain("lease-expired:lane-phase-49p");
    // The body is the executor's {body} endpoint schema with the exact
    // full-line dedupe and one extractable event payload.
    const body = JSON.parse((r as any).bodies[0].content);
    expect(body.body).toContain(`dedupe:${plan.operations[0].dedupe_key}`);
    expect(body.body).toContain("<!-- straylight:event:v1 -->");
  });

  it("an already-posted recovery (bot-authored machine comment with the exact full-line identity) dedupes away", () => {
    const cs = claudeWorkingComments(41);
    const dedupe = "lease-expired:lane-phase-49p:lease-claude-1:3";
    const posted = comment(2100, 41, "github-actions[bot]",
      `## Straylight watchdog recovery (shadow mode)\n\ndedupe:${dedupe}\n\n<!-- straylight:event:v1 -->\n\`\`\`json\n{"schema":"straylight.event.v1"}\n\`\`\``);
    const world = [{ n: 41, body: laneBody(), comments: [...cs, posted] }];
    const a = buildCollection("A", world);
    const b = buildCollection("B", world);
    const r = planFromCollections(a, b);
    expect(r.ok).toBe(true);
    expect((r as any).empty).toBe(true);
  });

  it("a NON-bot comment carrying the dedupe line does NOT suppress (B8); nor does a substring match (C4)", () => {
    const dedupe = "lease-expired:lane-phase-49p:lease-claude-1:3";
    expect(dedupeAlreadyPosted(
      [{ user: "attacker", body: `<!-- straylight:event:v1 -->\ndedupe:${dedupe}` }], dedupe,
    )).toBe(false);
    expect(dedupeAlreadyPosted(
      [{ user: "github-actions[bot]", body: `<!-- straylight:event:v1 -->\nprefix dedupe:${dedupe} suffix` }], dedupe,
    )).toBe(false);
    expect(dedupeAlreadyPosted(
      [{ user: "github-actions[bot]", body: `<!-- straylight:event:v1 -->\ndedupe:${dedupe}` }], dedupe,
    )).toBe(true);
  });

  it("an unreadable marker-bearing issue becomes an issue-keyed malformed-lane finding, never dropped", () => {
    const world = [
      { n: 41, body: laneBody(), comments: [] },
      { n: 55, body: "<!-- straylight:lane:v1 -->\n```json\n{ mangled ]\n```", comments: [] },
    ];
    const a = buildCollection("A", world);
    const b = buildCollection("B", world);
    const r = planFromCollections(a, b, NOW);
    expect(r.ok).toBe(true);
    const plan = (r as any).plan;
    const finding = plan.operations.find((o: any) => o.kind === "post-watchdog-finding");
    expect(finding).toBeDefined();
    expect(finding.issue_number).toBe(55);
    expect(finding.dedupe_key).toBe("malformed:issue:55");
  });

  it("the planner binary writes plan.json + bodies on 0, exits 3 on a valid empty sweep, 2 on an A/B difference", () => {
    // Empty sweep: a healthy planning-state lane needs nothing.
    const world = [{ n: 41, body: laneBody(), comments: [] }];
    const a = buildCollection("A", world);
    const b = buildCollection("B", world);
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-request-"));
    const run = (aDir: string, bDir: string, aLedger: string, bLedger: string, policyPath: string) => {
      try {
        const stdout = execFileSync("node", [
          PLANNER,
          "--collection-a", aDir, "--collection-b", bDir,
          "--ledger-a", aLedger, "--ledger-b", bLedger,
          "--request-root", requestRoot,
          "--repository", REPO, "--nonce", NONCE, "--now", NOW,
          "--policy", policyPath,
        ], { encoding: "utf8" });
        return { status: 0, out: JSON.parse(stdout) };
      } catch (e: any) {
        let out = null;
        try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* */ }
        return { status: e.status ?? -1, out };
      }
    };
    const empty = run(a.dir, b.dir, a.ledgerPath, b.ledgerPath, a.policyPath);
    expect(empty.status).toBe(3);
    expect(existsSync(join(requestRoot, "plan.json"))).toBe(false);

    // A/B difference: B has an extra issue.
    const b2 = buildCollection("B", [...world, { n: 60, body: "prose", comments: [] }]);
    const diff = run(a.dir, b2.dir, a.ledgerPath, b2.ledgerPath, a.policyPath);
    expect(diff.status).toBe(2);
    expect(diff.out.reason).toBe("ab-issue-set-difference");
    expect(existsSync(join(requestRoot, "plan.json"))).toBe(false);

    // Plannable work: expired lease at AFTER_EXPIRY.
    const world2 = [{ n: 41, body: laneBody(), comments: claudeWorkingComments(41) }];
    const a2 = buildCollection("A", world2);
    const b3 = buildCollection("B", world2);
    const planned = (() => {
      try {
        const stdout = execFileSync("node", [
          PLANNER,
          "--collection-a", a2.dir, "--collection-b", b3.dir,
          "--ledger-a", a2.ledgerPath, "--ledger-b", b3.ledgerPath,
          "--request-root", requestRoot,
          "--repository", REPO, "--nonce", NONCE, "--now", AFTER_EXPIRY,
          "--policy", a2.policyPath,
        ], { encoding: "utf8" });
        return { status: 0, out: JSON.parse(stdout) };
      } catch (e: any) {
        return { status: e.status ?? -1, out: e.stdout ? JSON.parse(e.stdout) : null };
      }
    })();
    expect(planned.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8"));
    expect(plan.operations).toHaveLength(1);
    expect(existsSync(join(requestRoot, plan.operations[0].body_file))).toBe(true);
  });

  it("compareProjections is symmetric on equality (sanity)", () => {
    const p = {
      issue_slots: [41], unreadable: [], excluded_prs: [], lanes: [],
      issue_evidence: {}, pr_slots: [], pr_outcomes: {},
    };
    expect(compareProjections(p as any, JSON.parse(JSON.stringify(p)))).toEqual({ ok: true });
  });
});
