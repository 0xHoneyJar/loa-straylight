// Control Plane v1 — direct regressions for the Codex tenth-round
// findings. One describe() block per finding; each reproduces the
// reported failure shape against the patched code.
//
//  J1  lane identity was not stable across reads: bootstrap enumerated
//      once, and the reducer/merge-guard compared projections omitted the
//      enumeration, validating the lane target against read 2 only — a
//      duplicate lane in read 1 with a unique lane in read 2 planned.
//      Both planners now include the canonical lane→issue mapping of BOTH
//      reads in the compared projection and prove the lane target on both;
//      bootstrap consumes two independent enumerations and requires
//      canonical equality before proving absence in both.
//
//  J2  probe results were not rebound by final planning: bash extracted
//      probe output with jq and the final planners received no fetch-slot
//      claim, so an extra (even malformed) PR file was silently ignored.
//      Probes now emit a closed fetch-slot claim bound to the evidence
//      digests; final planners independently rederive the slots from both
//      raw reads, require derived(1) = derived(2) = claim, verify the
//      read ledger, and refuse missing/extra/mismatched evidence.
//
//  J3  the workflow boundary was shell-authoritative (inline Node,
//      authority jq, || true, jq/while routing) and the structural tests
//      checked only narrow patterns with an empty GUARDED matrix. Routing
//      and ledger writing moved into fixed Node entry points (the read
//      executor); workflow-mutation.test.ts holds the executable
//      mutation matrix.
//
//  J4  a forged cp-paused warning proof authorized removal: any bot
//      comment CONTAINING the dedupe line suppressed the warning and
//      authorized the removal. The planner now requires a bot comment
//      whose body BYTE-EXACTLY equals the canonical state-neutral warning.
//
//  J5  executor plans could escape the request root: the plan path was
//      opened without containment. The executor now requires the plan's
//      parent directory to realpath to exactly the request root and the
//      name to be a single safe component — refusal is exit 2 with zero
//      gh launches.
//
//  J6  watchdog collection binding was incomplete: fetched issue genesis
//      identity was never matched to the enumeration's lane identity, and
//      extra (unenumerated) issue/comment ledger resources were accepted.
//      reconstructCollectionLanes now requires the fetched-body lane scan
//      to equal the enumeration's; seal and verify require EXACTLY the
//      derived resource set.
//
//  J7  PR fetch outcomes aliased across issues (keyed by PR number only):
//      A = {41:117 success, 42:117 failure}, B = {both failure} compared
//      EQUAL. Outcomes are now keyed by {issue_number, pr_number} and the
//      comparison walks the UNION of both key sets.
//
//  J8  the watchdog fabricated synthetic `unreadable-issue-N` lane IDs
//      for unreadable findings. Unreadable findings are now keyed by the
//      trusted issue number alone, with no fabricated lane identity.

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync, symlinkSync, chmodSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { warningBodyFor, warningDedupeKey } from "../../.straylight/lib/write-plan.mjs";
import { scan } from "../../.straylight/lib/watchdog.mjs";
import {
  reconstructCollectionLanes, deriveIssueSlots, sealCollection, sha256OfBytes,
} from "../../.straylight/lib/collection.mjs";
import { planWatchdogWrites } from "../../.straylight/lib/watchdog-plan.mjs";
import { makeLane, makeEvent, makeTaskPacket, makePolicy, payloadDigest, REPO, NOW, HEAD_SHA, WORKING_BRANCH } from "./_fixtures.js";

const REDUCER_PLANNER = ".straylight/bin/plan-reducer-writes.mjs";
const EXECUTOR = ".straylight/bin/execute-write-plan.mjs";
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

function writeGather(opts: { issue: number; body: string; comments: any[]; labels?: string[] }) {
  const dir = mkdtempSync(join(tmpdir(), "cp-r10-gather-"));
  const entry = enumEntry(opts.issue, opts.body);
  writeFileSync(join(dir, "enumeration.pages"), JSON.stringify([entry]));
  writeFileSync(join(dir, "issue.json"), JSON.stringify(entry));
  writeFileSync(join(dir, "comments.pages"), JSON.stringify(opts.comments));
  if (opts.labels !== undefined) {
    writeFileSync(join(dir, "labels.pages"), JSON.stringify(
      opts.labels.map((name, i) => ({ id: i + 1, name, url: `${API}/repos/${REPO}/labels/${encodeURIComponent(name)}` })),
    ));
  }
  return dir;
}

function writePolicyFile() {
  const dir = mkdtempSync(join(tmpdir(), "cp-r10-policy-"));
  const p = join(dir, "policy.json");
  writeFileSync(p, JSON.stringify(makePolicy()));
  return p;
}

function runNode(binary: string, args: string[], env?: Record<string, string>) {
  try {
    const stdout = execFileSync("node", [binary, ...args], { encoding: "utf8", env: env ?? process.env });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    let out = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* */ }
    return { status: e.status ?? -1, out };
  }
}

// =============================================================================
// J4 — cp-paused warning proof must be BYTE-EXACT canonical content
// =============================================================================
describe("J4 — a forged bot comment carrying the dedupe line is never a warning proof", () => {
  const policyPath = writePolicyFile();
  const stageB = (comments: any[]) => {
    const g1 = writeGather({ issue: 41, body: laneBody(), comments, labels: ["cp-lane", "cp-paused"] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments, labels: ["cp-lane", "cp-paused"] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-r10-req-"));
    const r = runNode(REDUCER_PLANNER, [
      "--stage", "b", "--gather-1", g1, "--gather-2", g2,
      "--issue-number", "41", "--request-root", requestRoot,
      "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    const plan = r.status === 0 ? JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8")) : null;
    return { r, plan };
  };
  const wDedupe = warningDedupeKey("lane-phase-49p", 41);

  it("Codex repro: an unrelated bot comment CONTAINING the dedupe line does not suppress the warning or authorize removal", () => {
    const forged = comment(4100, 41, "github-actions[bot]",
      `## Some unrelated machine output\n\ndedupe:${wDedupe}\n\n<!-- straylight:watchdog-result:v1 -->\n\`\`\`json\n{"x":1}\n\`\`\``);
    const { r, plan } = stageB([forged]);
    expect(r.status).toBe(0);
    const warning = plan.operations.find((o: any) => o.kind === "post-cp-paused-warning");
    const removal = plan.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(warning).toBeDefined(); // the warning is POSTED, not presumed
    expect(removal.warning_op_id).toBe(warning.op_id);
    expect(removal.warning_proof).toBeUndefined();
  });

  it("a one-byte-different warning body is not a proof either", () => {
    const oneOff = comment(4101, 41, "github-actions[bot]", warningBodyFor("lane-phase-49p", 41) + " ");
    const { r, plan } = stageB([oneOff]);
    expect(r.status).toBe(0);
    expect(plan.operations.some((o: any) => o.kind === "post-cp-paused-warning")).toBe(true);
  });

  it("a NON-bot comment with the byte-exact canonical body is not a proof (author restriction)", () => {
    const attacker = comment(4102, 41, "attacker", warningBodyFor("lane-phase-49p", 41));
    const { r, plan } = stageB([attacker]);
    expect(r.status).toBe(0);
    expect(plan.operations.some((o: any) => o.kind === "post-cp-paused-warning")).toBe(true);
  });

  it("control: the byte-exact canonical bot warning IS the proof (removal retries without re-posting)", () => {
    const canonical = comment(4103, 41, "github-actions[bot]", warningBodyFor("lane-phase-49p", 41));
    const { r, plan } = stageB([canonical]);
    expect(r.status).toBe(0);
    expect(plan.operations.some((o: any) => o.kind === "post-cp-paused-warning")).toBe(false);
    const removal = plan.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(removal.warning_proof).toEqual({ comment_id: 4103, dedupe_key: wDedupe });
  });
});

// =============================================================================
// J5 — the write executor refuses any plan outside the request root
// =============================================================================
describe("J5 — execute-write-plan realpath-contains the plan beneath --request-root", () => {
  function ghMock() {
    const dir = mkdtempSync(join(tmpdir(), "cp-r10-gh-"));
    const log = join(dir, "launches.log");
    writeFileSync(join(dir, "gh"), `#!/bin/sh\n{ printf 'ARGV:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "${log}"\ncat > /dev/null\nexit 0\n`);
    chmodSync(join(dir, "gh"), 0o755);
    return { dir, log };
  }
  function validPlanDoc() {
    const content = JSON.stringify({ body: `## finding\n\ndedupe:k-1\n\n<!-- straylight:watchdog-result:v1 -->\n\`\`\`json\n{"a":1}\n\`\`\`` });
    return {
      content,
      plan: {
        schema: "straylight.write-plan.v1",
        plan_id: `${NONCE}-watchdog`,
        nonce: NONCE,
        repository: REPO,
        operations: [{
          op_id: "op-1", kind: "post-watchdog-finding", issue_number: 41,
          dedupe_key: "k-1", body_file: "op-1.json", body_sha256: sha256(content),
        }],
      },
    };
  }
  function runExecutor(planArg: string, root: string, gh: { dir: string; log: string }) {
    try {
      const stdout = execFileSync(process.execPath, [
        EXECUTOR, "--plan", planArg, "--request-root", root, "--repository", REPO, "--nonce", NONCE,
      ], { encoding: "utf8", env: { PATH: `${gh.dir}:${process.env.PATH}`, HOME: process.env.HOME ?? "/tmp", GH_TOKEN: "t" } });
      return { status: 0, out: JSON.parse(stdout) };
    } catch (e: any) {
      let out = null;
      try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* */ }
      return { status: e.status ?? -1, out };
    }
  }

  it("Codex repro: a VALID plan outside the request root exits 2 with ZERO gh launches", () => {
    const root = mkdtempSync(join(tmpdir(), "cp-r10-root-"));
    const outside = mkdtempSync(join(tmpdir(), "cp-r10-outside-"));
    const { content, plan } = validPlanDoc();
    writeFileSync(join(root, "op-1.json"), content); // bodies inside the root
    writeFileSync(join(outside, "plan.json"), JSON.stringify(plan)); // plan OUTSIDE
    const gh = ghMock();
    const r = runExecutor(join(outside, "plan.json"), root, gh);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("plan-outside-request-root");
    expect(existsSync(gh.log)).toBe(false); // zero launches
  });

  it("a traversal plan path (root/../…) is refused", () => {
    const parent = mkdtempSync(join(tmpdir(), "cp-r10-tp-"));
    const root = join(parent, "root");
    const evil = join(parent, "evil");
    mkdirSync(root);
    mkdirSync(evil);
    const { content, plan } = validPlanDoc();
    writeFileSync(join(root, "op-1.json"), content);
    writeFileSync(join(evil, "plan.json"), JSON.stringify(plan));
    const gh = ghMock();
    const r = runExecutor(join(root, "..", "evil", "plan.json"), root, gh);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("plan-outside-request-root");
    expect(existsSync(gh.log)).toBe(false);
  });

  it("a plan reached through a SYMLINKED directory under the root is refused", () => {
    const root = mkdtempSync(join(tmpdir(), "cp-r10-sl-"));
    const outside = mkdtempSync(join(tmpdir(), "cp-r10-slo-"));
    const { content, plan } = validPlanDoc();
    writeFileSync(join(root, "op-1.json"), content);
    writeFileSync(join(outside, "plan.json"), JSON.stringify(plan));
    symlinkSync(outside, join(root, "sub"));
    const gh = ghMock();
    const r = runExecutor(join(root, "sub", "plan.json"), root, gh);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("plan-outside-request-root");
    expect(existsSync(gh.log)).toBe(false);
  });

  it("a SYMLINK at the plan's final component is refused (O_NOFOLLOW), zero launches", () => {
    const root = mkdtempSync(join(tmpdir(), "cp-r10-nf-"));
    const outside = mkdtempSync(join(tmpdir(), "cp-r10-nfo-"));
    const { content, plan } = validPlanDoc();
    writeFileSync(join(root, "op-1.json"), content);
    writeFileSync(join(outside, "real-plan.json"), JSON.stringify(plan));
    symlinkSync(join(outside, "real-plan.json"), join(root, "plan.json"));
    const gh = ghMock();
    const r = runExecutor(join(root, "plan.json"), root, gh);
    expect(r.status).toBe(2);
    expect(existsSync(gh.log)).toBe(false);
  });

  it("control: the same plan INSIDE the request root executes", () => {
    const root = mkdtempSync(join(tmpdir(), "cp-r10-ok-"));
    const { content, plan } = validPlanDoc();
    writeFileSync(join(root, "op-1.json"), content);
    writeFileSync(join(root, "plan.json"), JSON.stringify(plan));
    const gh = ghMock();
    const r = runExecutor(join(root, "plan.json"), root, gh);
    expect(r.status).toBe(0);
    expect(readFileSync(gh.log, "utf8")).toContain(`ARGV: api -X POST repos/${REPO}/issues/41/comments`);
  });
});

// =============================================================================
// J6 — collection binding: enumeration↔fetched identity + exact resource set
// =============================================================================
describe("J6 — fetched issue genesis identity must equal the enumeration's; ledger resources are exact", () => {
  const identityOpts = { repository: REPO, policy: makePolicy(), now: NOW };
  const buf = (v: unknown) => Buffer.from(JSON.stringify(v));
  const evidence = (issueDoc: unknown, comments: unknown[] = []) =>
    ({ issueBytes: buf(issueDoc), commentBytes: buf(comments) });

  it("Codex repro: the fetched issue body carries a DIFFERENT lane_id than the enumeration derived → refuse", () => {
    const enumBytes = buf([enumEntry(41, laneBody())]);
    const swapped = { ...enumEntry(41, laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" })) };
    const r = reconstructCollectionLanes(enumBytes, new Map([[41, evidence(swapped)]]), identityOpts);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("enumeration-fetch-identity-mismatch");
  });

  it("the fetched body LOST the lane marker the enumeration saw → refuse", () => {
    const enumBytes = buf([enumEntry(41, laneBody())]);
    const prose = { ...enumEntry(41, "just prose now") };
    const r = reconstructCollectionLanes(enumBytes, new Map([[41, evidence(prose)]]), identityOpts);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("enumeration-fetch-identity-mismatch");
  });

  it("a readable enumeration genesis fetched as an UNREADABLE body → refuse (unreadable sets must agree)", () => {
    const enumBytes = buf([enumEntry(41, laneBody())]);
    const mangled = { ...enumEntry(41, "<!-- straylight:lane:v1 -->\n```json\n{ mangled ]\n```") };
    const r = reconstructCollectionLanes(enumBytes, new Map([[41, evidence(mangled)]]), identityOpts);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("enumeration-fetch-identity-mismatch");
  });

  it("control: identical enumeration and fetched bodies reconstruct", () => {
    const enumBytes = buf([enumEntry(41, laneBody())]);
    const r = reconstructCollectionLanes(enumBytes, new Map([[41, evidence(enumEntry(41, laneBody()))]]), identityOpts);
    expect(r.ok).toBe(true);
    expect((r as any).lanes).toHaveLength(1);
  });

  it("Codex repro: an UNENUMERATED issue-999 ledger resource refuses the seal", () => {
    const enumeration = JSON.stringify([enumEntry(41, "prose")]);
    const issueDoc = JSON.stringify(enumEntry(41, "prose"));
    const commentsDoc = "[]";
    const extraBytes = "smuggled evidence";
    const files: Record<string, string> = {
      "enumeration.pages": enumeration,
      "issue-41/issue.json": issueDoc,
      "issue-41/comments.pages": commentsDoc,
      "issue-999/issue.json": extraBytes,
      "issue-999/comments.pages": extraBytes,
    };
    const rows = [
      { nonce: NONCE, collection_id: "A", resource: "enumeration", fetched: true, path: "enumeration.pages", sha256: sha256(enumeration) },
      { nonce: NONCE, collection_id: "A", resource: "issue", issue_number: 41, fetched: true, path: "issue-41/issue.json", sha256: sha256(issueDoc) },
      { nonce: NONCE, collection_id: "A", resource: "comments", issue_number: 41, fetched: true, path: "issue-41/comments.pages", sha256: sha256(commentsDoc) },
      { nonce: NONCE, collection_id: "A", resource: "issue", issue_number: 999, fetched: true, path: "issue-999/issue.json", sha256: sha256(extraBytes) },
      { nonce: NONCE, collection_id: "A", resource: "comments", issue_number: 999, fetched: true, path: "issue-999/comments.pages", sha256: sha256(extraBytes) },
    ];
    const issueSlots = deriveIssueSlots(Buffer.from(enumeration), { collection_id: "A", nonce: NONCE, repository: REPO });
    expect(issueSlots.ok).toBe(true);
    const sealed = sealCollection({
      ledgerText: rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
      readFile: (p: string) => { const v = files[p]; return v === undefined ? null : Buffer.from(v); },
      collection_id: "A", nonce: NONCE, repository: REPO, policy: makePolicy(), now: NOW,
      issueSlotsDocument: (issueSlots as any).document,
    });
    expect(sealed.ok).toBe(false);
    expect((sealed as any).reason).toBe("ledger-unenumerated-resource");
    expect((sealed as any).detail).toContain("999");
  });

  it("a MISSING comments row for an enumerated slot refuses the seal (exactly-one, not at-most-one)", () => {
    const enumeration = JSON.stringify([enumEntry(41, "prose")]);
    const issueDoc = JSON.stringify(enumEntry(41, "prose"));
    const files: Record<string, string> = {
      "enumeration.pages": enumeration,
      "issue-41/issue.json": issueDoc,
    };
    const rows = [
      { nonce: NONCE, collection_id: "A", resource: "enumeration", fetched: true, path: "enumeration.pages", sha256: sha256(enumeration) },
      { nonce: NONCE, collection_id: "A", resource: "issue", issue_number: 41, fetched: true, path: "issue-41/issue.json", sha256: sha256(issueDoc) },
    ];
    const issueSlots = deriveIssueSlots(Buffer.from(enumeration), { collection_id: "A", nonce: NONCE, repository: REPO });
    const sealed = sealCollection({
      ledgerText: rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
      readFile: (p: string) => { const v = files[p]; return v === undefined ? null : Buffer.from(v); },
      collection_id: "A", nonce: NONCE, repository: REPO, policy: makePolicy(), now: NOW,
      issueSlotsDocument: (issueSlots as any).document,
    });
    expect(sealed.ok).toBe(false);
    expect((sealed as any).reason).toBe("ledger-resource-missing");
  });

  it("sha256OfBytes and the exact-resource guard are the seal AND verify authorities (source pin)", () => {
    const collection = readFileSync(".straylight/lib/collection.mjs", "utf8");
    expect(collection).toMatch(/enumeration-fetch-identity-mismatch/);
    expect(collection).toMatch(/ledger-unenumerated-resource/);
    expect(collection).toMatch(/ledger-resource-missing/);
    // Both consumers (seal + verify) run the exact check, besides the
    // definition itself.
    expect(collection.match(/const exact = checkExactIssueResources\(rows,/g)?.length).toBe(2);
    expect(typeof sha256OfBytes(Buffer.from("x"))).toBe("string");
  });
});

// =============================================================================
// J7 — PR fetch outcomes are keyed {issue_number, pr_number}, never PR alone
// =============================================================================
describe("J7 — asymmetric per-issue outcomes for ONE PR can never alias into agreement", () => {
  const COLLECTOR = ".straylight/bin/collect-watchdog-evidence.mjs";

  function prLaneComments(issue: number, laneId: string, pr: number): any[] {
    const packet = makeTaskPacket({ lane_id: laneId });
    return [
      comment(5001, issue, "chatgpt-login",
        `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(makeEvent({ event_id: `evt-${laneId}-1`, lane_id: laneId, sequence: 1, event_type: "lane.activated", prior_state: "planning" }))}\n\`\`\``),
      comment(5002, issue, "chatgpt-login",
        `<!-- straylight:task-packet:v1 -->\n\`\`\`json\n${JSON.stringify(packet)}\n\`\`\``),
      comment(5003, issue, "chatgpt-login",
        `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(makeEvent({ event_id: `evt-${laneId}-2`, lane_id: laneId, sequence: 2, event_type: "coordinator.task_packet_posted", prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 5002, task_packet_digest: payloadDigest(packet) } }))}\n\`\`\``),
      comment(5004, issue, "claude-login",
        `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(makeEvent({ event_id: `evt-${laneId}-3`, lane_id: laneId, sequence: 3, actor_role: "implementer", github_actor: "claude-login", event_type: "implementer.lease_acquired", prior_state: "ready-for-claude", lease_id: `lease-${laneId}`, lease_expires_at: "2026-07-16T14:00:00Z" }))}\n\`\`\``),
      comment(5005, issue, "claude-login",
        `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(makeEvent({ event_id: `evt-${laneId}-4`, lane_id: laneId, sequence: 4, actor_role: "implementer", github_actor: "claude-login", event_type: "implementer.completed", prior_state: "claude-working", lease_id: `lease-${laneId}`, head_sha: HEAD_SHA, head_branch: WORKING_BRANCH, refs: { pr_number: pr } }))}\n\`\`\``),
    ];
  }

  const prDoc117 = (draft = false) => JSON.stringify({
    number: 117, url: `${API}/repos/${REPO}/pulls/117`, state: "open", draft, merged: false,
    base: { ref: "main", sha: "009c4afe34f3f7151db4239fe1c69898833440bb", repo: { full_name: REPO } },
    head: { ref: WORKING_BRANCH, sha: HEAD_SHA },
    created_at: T0, updated_at: NOW,
  });

  // Two lanes, both recording PR 117; per-issue fetch outcomes vary.
  function buildCollection(
    collectionId: "A" | "B",
    outcomes: { i41: { fetched: boolean; prDoc?: string }; i42: { fetched: boolean; prDoc?: string } },
  ) {
    const dir = mkdtempSync(join(tmpdir(), `cp-r10-dual-${collectionId}-`));
    const world = [
      { n: 41, body: laneBody(), comments: prLaneComments(41, "lane-phase-49p", 117), prRow: outcomes.i41 },
      { n: 42, body: laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" }), comments: prLaneComments(42, "lane-phase-49q", 117), prRow: outcomes.i42 },
    ];
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
      if (w.prRow.fetched && w.prRow.prDoc !== undefined) {
        writeFileSync(join(dir, `issue-${w.n}/pr-117.json`), w.prRow.prDoc);
        rows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "pr", issue_number: w.n, pr_number: 117, fetched: true, path: `issue-${w.n}/pr-117.json`, sha256: sha256(w.prRow.prDoc) }));
      } else {
        rows.push(JSON.stringify({ nonce: NONCE, collection_id: collectionId, resource: "pr", issue_number: w.n, pr_number: 117, fetched: false }));
      }
    }
    const ledgerPath = join(dir, "ledger.jsonl");
    writeFileSync(ledgerPath, rows.join("\n") + "\n");
    const policyPath = join(dir, "policy.json");
    writeFileSync(policyPath, JSON.stringify(makePolicy()));
    for (const [stage, extra] of [
      ["issue-slots", []],
      ["pr-slots", ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]],
      ["seal", ["--ledger", ledgerPath, "--policy", policyPath, "--now", NOW]],
    ] as const) {
      execFileSync("node", [COLLECTOR, "--stage", stage, "--collection-dir", dir, "--collection-id", collectionId, "--nonce", NONCE, "--repository", REPO, ...extra], { encoding: "utf8" });
    }
    return { dir, ledgerPath };
  }

  function planAB(a: ReturnType<typeof buildCollection>, b: ReturnType<typeof buildCollection>) {
    return planWatchdogWrites({
      collections: {
        A: { ledgerText: readFileSync(a.ledgerPath, "utf8"), manifestText: readFileSync(join(a.dir, "manifest.json"), "utf8"), readFile: (p: string) => { try { return readFileSync(join(a.dir, p)); } catch { return null; } } },
        B: { ledgerText: readFileSync(b.ledgerPath, "utf8"), manifestText: readFileSync(join(b.dir, "manifest.json"), "utf8"), readFile: (p: string) => { try { return readFileSync(join(b.dir, p)); } catch { return null; } } },
      },
      nonce: NONCE, repository: REPO, policy: makePolicy(), now: NOW,
    });
  }

  it("Codex probe: A={41:117 success, 42:117 failure}, B={both failures} → refuses, never {ok:true}", () => {
    const a = buildCollection("A", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: false } });
    const b = buildCollection("B", { i41: { fetched: false }, i42: { fetched: false } });
    const r = planAB(a, b);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("ab-fetch-outcome-difference");
    expect((r as any).detail).toContain("41:117");
  });

  it("inverse probe: A={both failures}, B={41:117 success, 42:117 failure} → same refusal (union of keys)", () => {
    const a = buildCollection("A", { i41: { fetched: false }, i42: { fetched: false } });
    const b = buildCollection("B", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: false } });
    const r = planAB(a, b);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("ab-fetch-outcome-difference");
  });

  it("metadata probe: both succeed everywhere but B's 42:117 fetch returned different PR metadata → slot-keyed refusal", () => {
    const a = buildCollection("A", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: true, prDoc: prDoc117() } });
    const b = buildCollection("B", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: true, prDoc: prDoc117(true) } });
    const r = planAB(a, b);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("ab-pr-metadata-difference");
    expect((r as any).detail).toContain("42:117");
  });

  it("a stable world where ONE PR resolved for one issue but failed for another refuses at planning (pr-head-conflict)", () => {
    const a = buildCollection("A", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: false } });
    const b = buildCollection("B", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: false } });
    const r = planAB(a, b);
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("pr-head-conflict");
  });

  it("control: consistent success for both slots in both collections plans", () => {
    const a = buildCollection("A", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: true, prDoc: prDoc117() } });
    const b = buildCollection("B", { i41: { fetched: true, prDoc: prDoc117() }, i42: { fetched: true, prDoc: prDoc117() } });
    const r = planAB(a, b);
    expect(r.ok).toBe(true);
  });
});

// =============================================================================
// J8 — no synthetic lane identity anywhere
// =============================================================================
describe("J8 — unreadable findings are keyed by trusted issue number, never a fabricated lane_id", () => {
  it("the watchdog planner no longer fabricates unreadable-issue-N lane IDs", () => {
    const plan = readFileSync(".straylight/lib/watchdog-plan.mjs", "utf8");
    expect(plan).not.toMatch(/unreadable-issue-/);
  });

  it("scan() emits an issue-keyed malformed finding WITHOUT a lane_id for a stub that has none", () => {
    const out = scan(
      [{ issue_number: 55, event_sequence: 55 }],
      makePolicy(),
      { now: NOW },
    );
    expect(out.ok).toBe(true);
    const findings = out.actions.filter((a: any) => a.type === "escalate-malformed-lane");
    expect(findings).toHaveLength(1);
    expect(findings[0]?.issue_number).toBe(55);
    expect(findings[0]?.dedupe_key).toBe("malformed:issue:55");
    expect(findings[0]?.lane_id).toBeUndefined(); // no fabricated identity
  });

  it("scan() still carries a lane_id when the caller derived one from readable evidence", () => {
    const out = scan(
      [{ issue_number: 56, lane_id: "lane-phase-49p", event_sequence: 3 }],
      makePolicy(),
      { now: NOW },
    );
    expect(out.ok).toBe(true);
    const findings = out.actions.filter((a: any) => a.type === "escalate-malformed-lane");
    expect(findings).toHaveLength(1);
    expect(findings[0]?.lane_id).toBe("lane-phase-49p");
    expect(findings[0]?.dedupe_key).toBe("malformed:issue:56");
  });
});
