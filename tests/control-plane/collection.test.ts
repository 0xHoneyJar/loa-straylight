// Control Plane v1 — dual-collection evidence chain
// (lib/collection.mjs + bin/collect-watchdog-evidence.mjs).
//
// Adversarial rows 1–2 (staged collection: enumeration-only evidence is
// structurally unable to emit PR slots; PR slots are underivable without
// issue/comment evidence), seal validation (the claims rule: a manifest
// can never claim a slot its own raw evidence does not independently
// derive), ledger discipline (explicit fetched:false PR facts), and
// realpath containment.

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  deriveIssueSlots,
  derivePrSlots,
  validateIssueSlotsDocument,
  parseLedger,
  sealCollection,
  sha256OfBytes,
  ISSUE_SLOTS_SCHEMA,
  PR_SLOTS_SCHEMA,
} from "../../.straylight/lib/collection.mjs";
import { makeLane, makeEvent, makePolicy, makeTaskPacket, payloadDigest, REPO, NOW } from "./_fixtures.js";

const COLLECTOR = ".straylight/bin/collect-watchdog-evidence.mjs";
const API = "https://api.github.com";
const NONCE = "12345-1";
const T0 = "2026-07-16T11:00:00Z";

const sha256 = (s: string | Buffer) => "sha256:" + createHash("sha256").update(s).digest("hex");

// --- world builders ----------------------------------------------------------

function enumEntry(n: number, body: string | null, overrides: Record<string, any> = {}) {
  return {
    number: n,
    url: `${API}/repos/${REPO}/issues/${n}`,
    body,
    created_at: T0,
    updated_at: NOW,
    ...overrides,
  };
}

function laneBody(overrides: Record<string, any> = {}) {
  return `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane(overrides))}\n\`\`\``;
}

function issueDoc(n: number, body: string | null) {
  return JSON.stringify(enumEntry(n, body));
}

function comment(id: number, issue: number, user: string, body: string) {
  return {
    id,
    url: `${API}/repos/${REPO}/issues/comments/${id}`,
    issue_url: `${API}/repos/${REPO}/issues/${issue}`,
    user: { login: user },
    body,
    created_at: T0,
    updated_at: T0,
  };
}

function eventComment(id: number, issue: number, payload: Record<string, any>, user = "chatgpt-login") {
  return comment(id, issue, user,
    `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);
}

// A comment stream that advances lane-phase-49p to claude-working with a
// recorded PR: activation → packet(+event) → lease → completion is not
// needed; the simplest PR-bearing state is via implementer.completed.
// Simpler: activate → packet posted → lease → completed(head+pr).
function prBearingComments(issue: number): any[] {
  const packet = makeTaskPacket();
  const packetBody = `<!-- straylight:task-packet:v1 -->\n\`\`\`json\n${JSON.stringify(packet)}\n\`\`\``;
  return [
    eventComment(1001, issue, makeEvent({ event_id: "evt-a1", sequence: 1, event_type: "lane.activated", prior_state: "planning" })),
    comment(1002, issue, "chatgpt-login", packetBody),
    eventComment(1003, issue, makeEvent({
      event_id: "evt-a2", sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 1002, task_packet_digest: payloadDigest(packet) },
    })),
    eventComment(1004, issue, makeEvent({
      event_id: "evt-a3", sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      // Bounded by the observed grant time (comment created_at = T0 11:00Z)
      // + policy lease_duration_minutes (240): expiry must be ≤ 15:00Z.
      lease_id: "lease-claude-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "claude-login"),
    eventComment(1005, issue, makeEvent({
      event_id: "evt-a4", sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1",
      head_sha: "a93e9f3694c3b8e5f7e6839856b9f347998a49ad",
      head_branch: "phase-49p-sibling-evidence-intake",
      refs: { pr_number: 117 },
    }), "claude-login"),
  ];
}

function commentsDoc(comments: any[]) {
  return JSON.stringify(comments);
}

// Build a complete on-disk collection directory + ledger for the collector
// binary. `world` = [{ issue, laneBody?, comments, pr? }]. In production
// the enumeration ledger row is appended by the collector's issue-slots
// stage (the collector and the read executor are the ONLY ledger
// writers); tests that RUN that stage pass enumRow:false so the collector
// appends it, while tests that call sealCollection directly keep the
// default and get the complete ledger from the fixture.
function buildCollection(opts: {
  world: Array<{ n: number; body: string | null; comments?: any[]; prRow?: { pr_number: number; fetched: boolean; prDoc?: string } }>;
  collectionId?: string;
  enumRow?: boolean;
}) {
  const dir = mkdtempSync(join(tmpdir(), "cp-collection-"));
  const collectionId = opts.collectionId ?? "A";
  const enumeration = JSON.stringify(opts.world.map((w) => enumEntry(w.n, w.body)));
  writeFileSync(join(dir, "enumeration.pages"), enumeration);
  const ledgerRows: string[] = (opts.enumRow ?? true)
    ? [JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "enumeration", fetched: true, path: "enumeration.pages", sha256: sha256(enumeration) })]
    : [];
  for (const w of opts.world) {
    if (w.comments === undefined) continue; // enumeration-only entry (no lane)
    mkdirSync(join(dir, `issue-${w.n}`), { recursive: true });
    const iDoc = issueDoc(w.n, w.body);
    const cDoc = commentsDoc(w.comments);
    writeFileSync(join(dir, `issue-${w.n}/issue.json`), iDoc);
    writeFileSync(join(dir, `issue-${w.n}/comments.pages`), cDoc);
    ledgerRows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "issue", issue_number: w.n, fetched: true, path: `issue-${w.n}/issue.json`, sha256: sha256(iDoc) }));
    ledgerRows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "comments", issue_number: w.n, fetched: true, path: `issue-${w.n}/comments.pages`, sha256: sha256(cDoc) }));
    if (w.prRow !== undefined) {
      if (w.prRow.fetched && w.prRow.prDoc !== undefined) {
        writeFileSync(join(dir, `issue-${w.n}/pr-${w.prRow.pr_number}.json`), w.prRow.prDoc);
        ledgerRows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "pr", issue_number: w.n, pr_number: w.prRow.pr_number, fetched: true, path: `issue-${w.n}/pr-${w.prRow.pr_number}.json`, sha256: sha256(w.prRow.prDoc) }));
      } else {
        ledgerRows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "pr", issue_number: w.n, pr_number: w.prRow.pr_number, fetched: false }));
      }
    }
  }
  const ledgerPath = join(dir, "ledger.jsonl");
  writeFileSync(ledgerPath, ledgerRows.join("\n") + "\n");
  return { dir, ledgerPath, collectionId };
}

function writePolicy(dir: string) {
  const p = join(dir, "policy.json");
  writeFileSync(p, JSON.stringify(makePolicy()));
  return p;
}

function runCollector(stage: string, dir: string, extra: string[] = [], collectionId = "A") {
  try {
    const stdout = execFileSync("node", [
      COLLECTOR, "--stage", stage,
      "--collection-dir", dir,
      "--collection-id", collectionId,
      "--nonce", NONCE,
      "--repository", REPO,
      ...extra,
    ], { encoding: "utf8" });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    let out = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* not JSON */ }
    return { status: e.status ?? -1, out };
  }
}

// =============================================================================
// Row 1 — enumeration-only evidence structurally cannot emit PR slots
// =============================================================================
describe("row 1 — issue-slots stage: schema has no PR field at all", () => {
  it("the derived document matches the closed schema exactly and carries only issue numbers", () => {
    const enumeration = Buffer.from(JSON.stringify([
      enumEntry(41, laneBody()),
      enumEntry(43, "prose"),
    ]));
    const r = deriveIssueSlots(enumeration, { collection_id: "A", nonce: NONCE, repository: REPO });
    expect(r.ok).toBe(true);
    const doc = (r as any).document;
    expect(Object.keys(doc).sort()).toEqual(
      ["schema", "collection_id", "nonce", "enumeration_sha256", "issue_slots"].sort(),
    );
    expect(doc.schema).toBe(ISSUE_SLOTS_SCHEMA);
    expect(doc.issue_slots).toEqual([41, 43]);
    expect(JSON.stringify(doc)).not.toMatch(/pr_slots|pr_number/);
  });

  it("a hand-built stage file with an injected pr_slots key refuses downstream (strict closed schema)", () => {
    const forged = {
      schema: ISSUE_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE,
      enumeration_sha256: sha256("x"), issue_slots: [41],
      pr_slots: [{ issue_number: 41, pr_number: 117 }],
    };
    const r = validateIssueSlotsDocument(forged);
    expect(r).toMatchObject({ ok: false, reason: "stage-document-unknown-field", detail: "pr_slots" });
  });

  it("unsorted or duplicated issue slots refuse", () => {
    const base = { schema: ISSUE_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE, enumeration_sha256: sha256("x") };
    expect(validateIssueSlotsDocument({ ...base, issue_slots: [43, 41] }).ok).toBe(false);
    expect(validateIssueSlotsDocument({ ...base, issue_slots: [41, 41] }).ok).toBe(false);
  });

  it("collector binary: --stage issue-slots writes only the closed document + appends the enumeration ledger row (executable)", () => {
    const { dir, ledgerPath } = buildCollection({ world: [{ n: 41, body: laneBody(), comments: [] }], enumRow: false });
    const r = runCollector("issue-slots", dir, ["--ledger", ledgerPath]);
    expect(r.status).toBe(0);
    const doc = JSON.parse(execFileSync("cat", [join(dir, "issue-slots.json")], { encoding: "utf8" }));
    expect(doc.schema).toBe(ISSUE_SLOTS_SCHEMA);
    expect(doc.issue_slots).toEqual([41]);
    expect(JSON.stringify(doc)).not.toMatch(/pr_/);
    // The collector appended the enumeration row itself (J3: bash never
    // composes a ledger row) and wrote the closed read plan for S2→S3.
    const enumRows = execFileSync("cat", [ledgerPath], { encoding: "utf8" })
      .trim().split("\n").map((l) => JSON.parse(l)).filter((r2) => r2.resource === "enumeration");
    expect(enumRows).toHaveLength(1);
    expect(enumRows[0]?.fetched).toBe(true);
    const readPlan = JSON.parse(execFileSync("cat", [join(dir, "read-plan-issues.json")], { encoding: "utf8" }));
    expect(readPlan.schema).toBe("straylight.read-plan.v1");
    expect(readPlan.reads).toEqual([{ kind: "issue-comments", issue_number: 41 }]);
  });
});

// =============================================================================
// Row 2 — PR slots are underivable without issue/comment evidence
// =============================================================================
describe("row 2 — pr-slots stage requires complete same-collection issue/comment evidence", () => {
  it("derivePrSlots refuses when a discovered lane's raw evidence is missing", () => {
    const enumeration = Buffer.from(JSON.stringify([enumEntry(41, laneBody())]));
    const r = derivePrSlots(enumeration, new Map(), { collection_id: "A", nonce: NONCE, repository: REPO, policy: makePolicy(), now: NOW });
    expect(r).toMatchObject({ ok: false, reason: "missing-issue-evidence" });
  });

  it("collector binary: --stage pr-slots exits 2 when the ledger names no evidence for a lane slot (executable)", () => {
    const { dir, ledgerPath } = buildCollection({ world: [{ n: 41, body: laneBody(), comments: [] }], enumRow: false });
    runCollector("issue-slots", dir, ["--ledger", ledgerPath]);
    // Strip the issue/comment rows: the ledger claims only the enumeration.
    const rows = execFileSync("cat", [ledgerPath], { encoding: "utf8" })
      .trim().split("\n").filter((l) => JSON.parse(l).resource === "enumeration");
    writeFileSync(ledgerPath, rows.join("\n") + "\n");
    const policyPath = writePolicy(dir);
    const r = runCollector("pr-slots", dir, ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("missing-issue-evidence");
  });

  it("PR slots derive ONLY through reconstruction: a lane whose durable record names a PR emits its slot", () => {
    const cs = prBearingComments(41);
    const issueEvidence = new Map([[41, {
      issueBytes: Buffer.from(issueDoc(41, laneBody())),
      commentBytes: Buffer.from(commentsDoc(cs)),
    }]]);
    const enumeration = Buffer.from(JSON.stringify([enumEntry(41, laneBody())]));
    const r = derivePrSlots(enumeration, issueEvidence, { collection_id: "A", nonce: NONCE, repository: REPO, policy: makePolicy(), now: NOW });
    expect(r.ok).toBe(true);
    expect((r as any).document.schema).toBe(PR_SLOTS_SCHEMA);
    expect((r as any).document.pr_slots).toEqual([{ issue_number: 41, pr_number: 117 }]);
  });

  it("a PR-less lane emits no slot; a duplicate lane_id refuses the whole derivation (C1)", () => {
    const noPr = new Map([[41, {
      issueBytes: Buffer.from(issueDoc(41, laneBody())),
      commentBytes: Buffer.from(commentsDoc([])),
    }]]);
    const enumeration = Buffer.from(JSON.stringify([enumEntry(41, laneBody())]));
    const r = derivePrSlots(enumeration, noPr, { collection_id: "A", nonce: NONCE, repository: REPO, policy: makePolicy(), now: NOW });
    expect(r.ok).toBe(true);
    expect((r as any).document.pr_slots).toEqual([]);

    const dupEnumeration = Buffer.from(JSON.stringify([enumEntry(41, laneBody()), enumEntry(42, laneBody())]));
    const dup = derivePrSlots(dupEnumeration, noPr, { collection_id: "A", nonce: NONCE, repository: REPO, policy: makePolicy(), now: NOW });
    expect(dup).toMatchObject({ ok: false, reason: "duplicate-lane-id" });
  });
});

// =============================================================================
// Ledger discipline
// =============================================================================
describe("ledger — explicit durable fetch facts", () => {
  const row = (over: Record<string, any> = {}) => JSON.stringify({
    nonce: NONCE, collection_id: "A", resource: "enumeration", fetched: true,
    path: "enumeration.pages", sha256: sha256("x"), ...over,
  });

  it("a failed PR fetch is a fetched:false row with NO path and NO digest", () => {
    const good = [
      row(),
      JSON.stringify({ nonce: NONCE, collection_id: "A", resource: "pr", issue_number: 41, pr_number: 117, fetched: false }),
    ].join("\n");
    expect(parseLedger(good, { collection_id: "A", nonce: NONCE }).ok).toBe(true);

    const withPath = [
      row(),
      JSON.stringify({ nonce: NONCE, collection_id: "A", resource: "pr", issue_number: 41, pr_number: 117, fetched: false, path: "x.json" }),
    ].join("\n");
    expect(parseLedger(withPath, { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-row-malformed" });
  });

  it("fetched:false is only legal for pr rows — issue/comment/enumeration failures fail the job, not the ledger", () => {
    const bad = [
      row(),
      JSON.stringify({ nonce: NONCE, collection_id: "A", resource: "issue", issue_number: 41, fetched: false }),
    ].join("\n");
    expect(parseLedger(bad, { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-row-malformed" });
  });

  it("nonce/collection mismatches, duplicate resource identities, and junk rows refuse", () => {
    expect(parseLedger(row({ nonce: "99999-9" }), { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-nonce-mismatch" });
    expect(parseLedger(row({ collection_id: "B" }), { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-collection-mismatch" });
    const dup = [row(), row()].join("\n");
    expect(parseLedger(dup, { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-duplicate-resource" });
    expect(parseLedger("not json", { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-row-malformed" });
    expect(parseLedger("", { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-empty" });
  });

  it("path traversal in a ledger row refuses at parse (no separators beyond one level, no ..)", () => {
    const bad = [
      row(),
      JSON.stringify({ nonce: NONCE, collection_id: "A", resource: "issue", issue_number: 41, fetched: true, path: "../../etc/passwd", sha256: sha256("x") }),
    ].join("\n");
    expect(parseLedger(bad, { collection_id: "A", nonce: NONCE })).toMatchObject({ ok: false, reason: "ledger-row-malformed" });
  });
});

// =============================================================================
// Seal — the claims rule
// =============================================================================
describe("seal — a manifest can never claim what raw evidence does not derive", () => {
  function sealArgs(dir: string, ledgerPath: string, issueSlotsDoc: any, prSlotsDoc: any) {
    return {
      ledgerText: execFileSync("cat", [ledgerPath], { encoding: "utf8" }),
      readFile: (p: string) => {
        try { return execFileSync("cat", [join(dir, p)]); } catch { return null; }
      },
      collection_id: "A", nonce: NONCE, repository: REPO,
      policy: makePolicy(), now: NOW,
      issueSlotsDocument: issueSlotsDoc, prSlotsDocument: prSlotsDoc,
    };
  }

  it("a coherent collection seals; the manifest re-derives both slot sets", () => {
    const cs = prBearingComments(41);
    const prJson = JSON.stringify({
      number: 117, url: `${API}/repos/${REPO}/pulls/117`, state: "open", draft: true, merged: false,
      base: { ref: "main", sha: "009c4afe34f3f7151db4239fe1c69898833440bb", repo: { full_name: REPO } },
      head: { ref: "phase-49p-sibling-evidence-intake", sha: "a93e9f3694c3b8e5f7e6839856b9f347998a49ad" },
      created_at: T0, updated_at: NOW,
    });
    const { dir, ledgerPath } = buildCollection({
      world: [{ n: 41, body: laneBody(), comments: cs, prRow: { pr_number: 117, fetched: true, prDoc: prJson } }],
      enumRow: false,
    });
    const policyPath = writePolicy(dir);
    expect(runCollector("issue-slots", dir, ["--ledger", ledgerPath]).status).toBe(0);
    expect(runCollector("pr-slots", dir, ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]).status).toBe(0);
    const sealed = runCollector("seal", dir, ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]);
    expect(sealed.status).toBe(0);
    expect(sealed.out.manifest).toMatchObject({
      issue_slots: [41],
      pr_slots: [{ issue_number: 41, pr_number: 117 }],
    });
  });

  it("an issue-slots claim the raw enumeration does not derive refuses (claims-rule-violation)", () => {
    const { dir, ledgerPath } = buildCollection({ world: [{ n: 41, body: laneBody(), comments: [] }] });
    const enumeration = execFileSync("cat", [join(dir, "enumeration.pages")]);
    const forged = {
      schema: ISSUE_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE,
      enumeration_sha256: sha256OfBytes(enumeration),
      issue_slots: [41, 999], // 999 is not in the enumeration
    };
    const r = sealCollection(sealArgs(dir, ledgerPath, forged, undefined));
    expect(r).toMatchObject({ ok: false, reason: "claims-rule-violation" });
  });

  it("a pr-slots claim reconstruction does not derive refuses", () => {
    const { dir, ledgerPath } = buildCollection({ world: [{ n: 41, body: laneBody(), comments: [] }] });
    const enumeration = execFileSync("cat", [join(dir, "enumeration.pages")]);
    const issueSlots = {
      schema: ISSUE_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE,
      enumeration_sha256: sha256OfBytes(enumeration), issue_slots: [41],
    };
    const forgedPr = {
      schema: PR_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE,
      enumeration_sha256: sha256OfBytes(enumeration),
      pr_slots: [{ issue_number: 41, pr_number: 117 }], // the lane never recorded a PR
    };
    const r = sealCollection(sealArgs(dir, ledgerPath, issueSlots, forgedPr));
    expect(r).toMatchObject({ ok: false, reason: "claims-rule-violation" });
  });

  it("a ledger row whose file is missing or hashes differently refuses", () => {
    const { dir, ledgerPath } = buildCollection({ world: [{ n: 41, body: laneBody(), comments: [] }] });
    const enumeration = execFileSync("cat", [join(dir, "enumeration.pages")]);
    const issueSlots = {
      schema: ISSUE_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE,
      enumeration_sha256: sha256OfBytes(enumeration), issue_slots: [41],
    };
    // Tamper with the issue file after the ledger recorded its digest.
    writeFileSync(join(dir, "issue-41/issue.json"), issueDoc(41, "tampered"));
    const r = sealCollection(sealArgs(dir, ledgerPath, issueSlots, undefined));
    expect(r).toMatchObject({ ok: false, reason: "ledger-digest-mismatch" });
  });

  it("a pr ledger row with no slot derived from raw evidence refuses (ledger-underived-pr-row)", () => {
    const { dir, ledgerPath } = buildCollection({
      world: [{ n: 41, body: laneBody(), comments: [], prRow: { pr_number: 117, fetched: false } }],
    });
    const enumeration = execFileSync("cat", [join(dir, "enumeration.pages")]);
    const issueSlots = {
      schema: ISSUE_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE,
      enumeration_sha256: sha256OfBytes(enumeration), issue_slots: [41],
    };
    // The lane has NO recorded PR, but the ledger carries a pr row.
    const r = sealCollection(sealArgs(dir, ledgerPath, issueSlots, undefined));
    expect(r).toMatchObject({ ok: false, reason: "ledger-underived-pr-row" });
  });

  it("a derived PR slot with NO pr ledger row refuses (fetch neither succeeded nor failed explicitly)", () => {
    const cs = prBearingComments(41);
    const { dir, ledgerPath } = buildCollection({
      world: [{ n: 41, body: laneBody(), comments: cs }], // no prRow at all
    });
    const enumeration = execFileSync("cat", [join(dir, "enumeration.pages")]);
    const issueSlots = {
      schema: ISSUE_SLOTS_SCHEMA, collection_id: "A", nonce: NONCE,
      enumeration_sha256: sha256OfBytes(enumeration), issue_slots: [41],
    };
    const r = sealCollection(sealArgs(dir, ledgerPath, issueSlots, undefined));
    expect(r).toMatchObject({ ok: false, reason: "ledger-pr-slot-unaccounted" });
  });

  it("collector binary: a resource path escaping the collection directory exits 2 (realpath containment)", () => {
    const { dir, ledgerPath } = buildCollection({ world: [{ n: 41, body: laneBody(), comments: [] }], enumRow: false });
    runCollector("issue-slots", dir, ["--ledger", ledgerPath]);
    const policyPath = writePolicy(dir);
    // Symlink the issue file out of the collection dir, keeping its digest
    // valid — containment must refuse regardless.
    const outside = mkdtempSync(join(tmpdir(), "cp-outside-"));
    const iDoc = issueDoc(41, laneBody());
    writeFileSync(join(outside, "issue.json"), iDoc);
    execFileSync("rm", [join(dir, "issue-41/issue.json")]);
    symlinkSync(join(outside, "issue.json"), join(dir, "issue-41/issue.json"));
    const r = runCollector("pr-slots", dir, ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("resource-outside-collection");
  });
});
