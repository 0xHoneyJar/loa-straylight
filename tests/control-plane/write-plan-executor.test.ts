// Control Plane v1 — shared write-plan validator/executor
// (lib/write-plan.mjs + bin/execute-write-plan.mjs).
//
// The executor exit-code contract is authoritative (final accepted
// addendum): exit 2 is possible ONLY during validation/preflight and
// guarantees zero `gh` launches; execution begins immediately before the
// first validated operation; after that, EVERY launch/transport/fatal
// failure exits 4 — including a launch failure on the first operation and
// a launch failure for a warning-only label operation. Warning-only
// semantics apply exclusively to a non-zero gh API RESULT on the
// hard-coded derived-label kinds.
//
// Every gh process is a PATH-prepended mock (the round-9 extraction-
// harness pattern): a per-test shell script that records argv + stdin and
// whose behavior (exit code, self-destruction, on-disk races) is embedded
// in the generated script. Exit-2 cases assert the recorded launch count
// is ZERO.

import { describe, it, expect } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  symlinkSync,
  existsSync,
  readdirSync,
  mkdirSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  validatePlan,
  validateOperationBody,
  checkConstructedPath,
  hasFullLineDedupe,
  isWarningOnlyKind,
  isStateAdvancingKind,
  warningDedupeKey,
  warningBodyFor,
  OPERATION_KINDS,
} from "../../.straylight/lib/write-plan.mjs";
import {
  makeEvent,
  planAuthority,
  authorityResponses,
  MAIN_SHA,
  COMMITTED_POLICY_TEXT,
  COMMITTED_POLICY_DIGEST,
} from "./_fixtures.js";

const EXECUTOR = ".straylight/bin/execute-write-plan.mjs";
const REPO = "0xHoneyJar/loa-straylight";
const NONCE = "12345-1";

// A utilities-only PATH entry (cat/printf/rm/sh links) so a test can run
// the executor with the mock dir + utils ONLY on PATH: when the mock gh
// deletes itself, there is genuinely no gh anywhere on PATH and the next
// spawn is a real LAUNCH failure — never a fall-through to the system gh.
const UTILS = mkdtempSync(join(tmpdir(), "cp-utils-"));
for (const util of ["cat", "printf", "rm", "sh", "wc"]) {
  const resolved = execFileSync("which", [util], { encoding: "utf8" }).trim();
  symlinkSync(resolved, join(UTILS, util));
}

const sha256 = (bytes: string | Buffer) =>
  "sha256:" + createHash("sha256").update(bytes).digest("hex");

function makeRoot() {
  return mkdtempSync(join(tmpdir(), "cp-executor-"));
}

function writeBody(root: string, name: string, content: string) {
  writeFileSync(join(root, name), content);
  return sha256(content);
}

function makePlan(root: string, operations: Record<string, any>[], overrides: Record<string, any> = {}) {
  const plan = {
    schema: "straylight.write-plan.v1",
    plan_id: `${NONCE}-test`,
    nonce: NONCE,
    repository: REPO,
    // The H-02 write-authority binding. It is REQUIRED on every plan, so the
    // default is the one that matches the mock's authority responses; a test
    // that stales it passes an override.
    authority: planAuthority(),
    operations,
    ...overrides,
  };
  const path = join(root, "plan.json");
  writeFileSync(path, JSON.stringify(plan, null, 2));
  return path;
}

// The mock directory is derived from the root, so a test can reference the
// mock's own response files inside the `extra` shell logic it passes in —
// that is how a mid-plan authority change (a freeze merged between operation 1
// and operation 2) is staged without any real GitHub state.
const ghMockDir = (root: string) => join(root, "gh-mock");

// A per-test gh mock with TWO branches.
//
// READ branch (`gh api <path>`, no -X): the executor's read-only write-time
// authority probes, added by Codex H-02 — three per operation. They answer from
// response files on disk, are logged separately, are NOT counted as launches,
// and do NOT run the caller-supplied behavior. That separation is load-bearing:
// a test whose mock self-destructs or dies must arm that behavior against the
// MUTATION, not against a preflight GET, or the executor would refuse at
// validation and the execution-phase contract would never be exercised.
//
// WRITE branch (`gh api -X <METHOD> ...`): records argv (one line per call) and
// stdin (gh-stdin-<n>), then runs `extra` with $N (call number) available.
// Records are written BEFORE behavior runs so even a failing call is counted.
function makeGhMock(
  root: string,
  extra = "",
  opts: {
    authority?: Parameters<typeof authorityResponses>[0];
    /** Shell run at the top of the READ branch (e.g. `exit 1` to fail probes). */
    readBehavior?: string;
    /**
     * Self-delete once this many READS have been served — the only way to make
     * the next MUTATION a genuine ENOENT launch failure while every authority
     * probe before it succeeded. Three reads = one operation's full probe.
     */
    deleteAfterReads?: number;
  } = {},
) {
  const dir = ghMockDir(root);
  mkdirSync(dir);
  const log = join(dir, "launches.log");
  const readLog = join(dir, "reads.log");
  const count = join(dir, "count");
  const responses = authorityResponses(opts.authority ?? {});
  writeFileSync(join(dir, "read-metadata.json"), responses.metadata);
  writeFileSync(join(dir, "read-ref.json"), responses.ref);
  writeFileSync(join(dir, "read-contents.json"), responses.contents);
  const script = `#!/bin/sh
if [ "$2" != "-X" ]; then
  { printf 'READ:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "${readLog}"
  ${opts.readBehavior ?? ""}
${
  typeof opts.deleteAfterReads === "number"
    ? `  if [ "$(wc -l < "${readLog}")" -ge ${opts.deleteAfterReads} ]; then rm -f "$0"; fi`
    : ""
}
  case "$2" in
    */git/ref/heads/main) cat "${dir}/read-ref.json" ;;
    */contents/*) cat "${dir}/read-contents.json" ;;
    *) cat "${dir}/read-metadata.json" ;;
  esac
  exit 0
fi
N=$(cat "${count}" 2>/dev/null || echo 0)
N=$((N+1))
printf '%s' "$N" > "${count}"
{ printf 'ARGV:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "${log}"
cat > "${dir}/gh-stdin-$N"
${extra}
exit 0
`;
  writeFileSync(join(dir, "gh"), script);
  chmodSync(join(dir, "gh"), 0o755);
  const lines = (path: string) =>
    existsSync(path) ? readFileSync(path, "utf8").trim().split("\n").filter(Boolean) : [];
  return {
    dir,
    launches: () => lines(log),
    reads: () => lines(readLog),
    stdinOf: (n: number) => readFileSync(join(dir, `gh-stdin-${n}`), "utf8"),
  };
}

function runExecutor(
  root: string,
  planPath: string,
  ghDir: string | null,
  args: Record<string, string> = {},
  opts: { isolated?: boolean } = {},
) {
  const argv = [
    EXECUTOR,
    "--plan", args.plan ?? planPath,
    "--request-root", args.requestRoot ?? root,
    "--repository", args.repository ?? REPO,
    "--nonce", args.nonce ?? NONCE,
  ];
  // isolated: the mock dir + shell utils are the ENTIRE PATH — no system
  // gh can be found if the mock disappears mid-plan.
  const path = ghDir === null
    ? UTILS
    : opts.isolated
      ? `${ghDir}:${UTILS}`
      : `${ghDir}:${process.env.PATH}`;
  try {
    const stdout = execFileSync(process.execPath, argv, {
      encoding: "utf8",
      env: { PATH: path, HOME: process.env.HOME ?? "/tmp", GH_TOKEN: "test-token" },
    });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    let out = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* non-JSON */ }
    return { status: e.status ?? -1, out };
  }
}

// --- canonical bodies -------------------------------------------------------

function commentBody(marker: string, payload: Record<string, any>, dedupe: string) {
  return JSON.stringify({
    body: `## machine result\n\ndedupe:${dedupe}\n\n<!-- ${marker} -->\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
  });
}

function stateAdvancingEvent(overrides: Record<string, any> = {}) {
  return makeEvent({
    actor_role: "system",
    github_actor: "github-actions[bot]",
    event_type: "system.lease_expired",
    prior_state: "claude-working",
    sequence: 4,
    ...overrides,
  });
}

function findingOp(opId: string, root: string, issue = 41, dedupe = `finding:${opId}`) {
  const body = commentBody("straylight:watchdog-result:v1", { finding: opId }, dedupe);
  const digest = writeBody(root, `${opId}.json`, body);
  return {
    op_id: opId, kind: "post-watchdog-finding", issue_number: issue,
    dedupe_key: dedupe, body_file: `${opId}.json`, body_sha256: digest,
  };
}

function eventOp(opId: string, root: string, issue = 41, overrides: Record<string, any> = {}) {
  const dedupe = `lease-expired:lane-phase-49p:lease-claude-1:3`;
  const body = commentBody("straylight:event:v1", stateAdvancingEvent(), dedupe);
  const digest = writeBody(root, `${opId}.json`, body);
  return {
    op_id: opId, kind: "post-state-advancing-event", issue_number: issue,
    lane_id: "lane-phase-49p", dedupe_key: dedupe,
    body_file: `${opId}.json`, body_sha256: digest, ...overrides,
  };
}

function labelAddOp(opId: string, root: string, label = "cp-state:ready-for-codex", issue = 41) {
  const body = JSON.stringify({ labels: [label] });
  const digest = writeBody(root, `${opId}.json`, body);
  return {
    op_id: opId, kind: "add-derived-label", issue_number: issue,
    label, body_file: `${opId}.json`, body_sha256: digest,
  };
}

function warningOp(opId: string, root: string, issue = 41, laneId = "lane-phase-49p") {
  const body = JSON.stringify({ body: warningBodyFor(laneId, issue) });
  const digest = writeBody(root, `${opId}.json`, body);
  return {
    op_id: opId, kind: "post-cp-paused-warning", issue_number: issue, lane_id: laneId,
    dedupe_key: warningDedupeKey(laneId, issue), body_file: `${opId}.json`, body_sha256: digest,
  };
}

// =============================================================================
// Pure validator rows
// =============================================================================
describe("write-plan validator — closed schema and structural rules", () => {
  it("row 14: best_effort is not expressible on any operation (unknown-field, kind-derived fatality)", () => {
    const root = makeRoot();
    const op = { ...findingOp("op-1", root), best_effort: true };
    const r = validatePlan(
      { schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(), operations: [op] },
      { repository: REPO, nonce: NONCE },
    );
    expect(r.ok).toBe(false);
    expect((r as any).errors.map((e: any) => e.code)).toContain("unknown-field");
  });

  it("no method/path/url/host/endpoint/repository is expressible on an operation", () => {
    const root = makeRoot();
    for (const field of ["method", "path", "url", "host", "endpoint", "repository"]) {
      const op = { ...findingOp("op-1", root), [field]: "anything" };
      const r = validatePlan(
        { schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(), operations: [op] },
        { repository: REPO, nonce: NONCE },
      );
      expect(r.ok, field).toBe(false);
      expect((r as any).errors.map((e: any) => e.code), field).toContain("unknown-field");
    }
  });

  it("row 17/18: terminal barrier — nothing after an issue's state-advancing op; never two of them", () => {
    const root = makeRoot();
    const after = validatePlan(
      {
        schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(),
        operations: [eventOp("op-1", root), findingOp("op-2", root, 41)],
      },
      { repository: REPO, nonce: NONCE },
    );
    expect(after.ok).toBe(false);
    expect((after as any).errors.map((e: any) => e.code)).toContain("terminal-barrier-violation");

    const root2 = makeRoot();
    const twice = validatePlan(
      {
        schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(),
        operations: [eventOp("op-1", root2), { ...eventOp("op-2", root2), body_file: "op-2.json" }],
      },
      { repository: REPO, nonce: NONCE },
    );
    expect(twice.ok).toBe(false);
    expect((twice as any).errors.map((e: any) => e.code)).toContain("duplicate-state-advancing-event");
  });

  it("a state-advancing op in LAST position for its issue, findings first, is valid", () => {
    const root = makeRoot();
    const r = validatePlan(
      {
        schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(),
        operations: [findingOp("op-1", root, 41), eventOp("op-2", root, 41), findingOp("op-3", root, 99, "finding:other-issue")],
      },
      { repository: REPO, nonce: NONCE },
    );
    expect(r.ok).toBe(true);
  });

  it("row 16b: a plain remove-derived-label may never name cp-paused (or cp-lane)", () => {
    for (const label of ["cp-paused", "cp-lane"]) {
      const r = validatePlan(
        {
          schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(),
          operations: [{ op_id: "op-1", kind: "remove-derived-label", issue_number: 41, label }],
        },
        { repository: REPO, nonce: NONCE },
      );
      expect(r.ok, label).toBe(false);
      expect((r as any).errors.map((e: any) => e.code), label).toContain("cp-paused-requires-warning-gate");
    }
  });

  it("warning gate: exactly one of warning_op_id / warning_proof; the reference must be an earlier same-issue same-lane warning", () => {
    const root = makeRoot();
    const w = warningOp("op-1", root);
    const removal = {
      op_id: "op-2", kind: "remove-derived-cp-paused-after-warning",
      issue_number: 41, lane_id: "lane-phase-49p", warning_op_id: "op-1",
    };
    const valid = validatePlan(
      { schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(), operations: [w, removal] },
      { repository: REPO, nonce: NONCE },
    );
    expect(valid.ok).toBe(true);

    for (const bad of [
      { ...removal, warning_proof: { comment_id: 5, dedupe_key: warningDedupeKey("lane-phase-49p", 41) } }, // both
      { op_id: "op-2", kind: "remove-derived-cp-paused-after-warning", issue_number: 41, lane_id: "lane-phase-49p" }, // neither
      { ...removal, warning_op_id: "op-9" }, // not an earlier op
    ]) {
      const r = validatePlan(
        { schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(), operations: [w, bad] },
        { repository: REPO, nonce: NONCE },
      );
      expect(r.ok).toBe(false);
      expect((r as any).errors.map((e: any) => e.code)).toContain("warning-gate-invalid");
    }

    // Ordering is structural, not positional: a removal BEFORE its warning refuses.
    const root2 = makeRoot();
    const w2 = warningOp("op-2", root2);
    const r = validatePlan(
      {
        schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(),
        operations: [{ ...removal, warning_op_id: "op-2" }, w2],
      },
      { repository: REPO, nonce: NONCE },
    );
    expect(r.ok).toBe(false);
  });

  it("warning_proof must carry the CANONICAL identity for this lane/issue", () => {
    const bad = validatePlan(
      {
        schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(),
        operations: [{
          op_id: "op-1", kind: "remove-derived-cp-paused-after-warning",
          issue_number: 41, lane_id: "lane-phase-49p",
          warning_proof: { comment_id: 5, dedupe_key: "cp-paused-warning:lane-phase-49p:99" },
        }],
      },
      { repository: REPO, nonce: NONCE },
    );
    expect(bad.ok).toBe(false);
    expect((bad as any).errors.map((e: any) => e.code)).toContain("warning-gate-invalid");
  });

  it("row 8: crafted fields refuse at field validation; the constructed-path guard is defense in depth", () => {
    const cases: Array<[Record<string, any>, string]> = [
      [{ op_id: "op-1", kind: "add-derived-label", issue_number: 41, label: "https://evil.example/x", body_file: "b.json", body_sha256: sha256("x") }, "operation-invalid"],
      [{ op_id: "op-1", kind: "remove-derived-label", issue_number: -1, label: "cp-merged" }, "operation-invalid"],
      [{ op_id: "op-1", kind: "post-state-advancing-event", issue_number: 41, lane_id: "lane-../../evil", dedupe_key: "d", body_file: "b.json", body_sha256: sha256("x") }, "operation-invalid"],
    ];
    for (const [op, code] of cases) {
      const r = validatePlan(
        { schema: "straylight.write-plan.v1", plan_id: `${NONCE}-t`, nonce: NONCE, repository: REPO, authority: planAuthority(), operations: [op] },
        { repository: REPO, nonce: NONCE },
      );
      expect(r.ok, JSON.stringify(op)).toBe(false);
      expect((r as any).errors.map((e: any) => e.code), JSON.stringify(op)).toContain(code);
    }
    // The guard itself: :// , .. , ?, whitespace, wrong prefix can never survive.
    for (const bad of [
      "repos/evil/repo/issues/1/comments",
      "repos/0xHoneyJar/loa-straylight/../evil",
      "repos/0xHoneyJar/loa-straylight/issues/1?x=1",
      "https://evil.example/repos/0xHoneyJar/loa-straylight/issues",
      "repos/0xHoneyJar/loa-straylight/issues/1 comments",
    ]) {
      expect(checkConstructedPath(bad), bad).not.toBeNull();
    }
    expect(checkConstructedPath("repos/0xHoneyJar/loa-straylight/issues/41/comments")).toBeNull();
    expect(checkConstructedPath("repos/0xHoneyJar/loa-straylight/labels")).toBeNull();
  });

  it("nonce discipline: plan.nonce must equal --nonce and both must be run-shaped", () => {
    const root = makeRoot();
    const op = findingOp("op-1", root);
    const mismatch = validatePlan(
      { schema: "straylight.write-plan.v1", plan_id: "99999-2-t", nonce: "99999-2", repository: REPO, authority: planAuthority(), operations: [op] },
      { repository: REPO, nonce: NONCE },
    );
    expect(mismatch.ok).toBe(false);
    expect((mismatch as any).errors.map((e: any) => e.code)).toContain("nonce-mismatch");
    for (const badNonce of ["abc", "12345", "0-1", "12345-", "-1", "12345-1-1"]) {
      const r = validatePlan(
        { schema: "straylight.write-plan.v1", plan_id: `${badNonce}-t`, nonce: badNonce, repository: REPO, authority: planAuthority(), operations: [op] },
        { repository: REPO, nonce: badNonce },
      );
      expect(r.ok, badNonce).toBe(false);
      expect((r as any).errors.map((e: any) => e.code), badNonce).toContain("nonce-invalid");
    }
  });

  it("kind-derived classes are hard-coded: warning-only = derived-label ops; state-advancing = the event kind", () => {
    expect(isWarningOnlyKind("add-derived-label")).toBe(true);
    expect(isWarningOnlyKind("remove-derived-label")).toBe(true);
    expect(isWarningOnlyKind("remove-derived-cp-paused-after-warning")).toBe(true);
    for (const kind of [
      "post-state-advancing-event", "post-reducer-result", "post-watchdog-finding",
      "post-merge-guard-result", "post-cp-paused-warning", "create-lane-issue", "create-label-definition",
    ]) {
      expect(isWarningOnlyKind(kind), kind).toBe(false);
    }
    expect(isStateAdvancingKind("post-state-advancing-event")).toBe(true);
    expect(Object.entries(OPERATION_KINDS).filter(([, s]) => (s as any).state_advancing).map(([k]) => k))
      .toEqual(["post-state-advancing-event"]);
  });
});

// =============================================================================
// Body endpoint contracts (row 13)
// =============================================================================
describe("body endpoint contracts — content binding over the exact bytes", () => {
  const findingOpShape = { op_id: "op-1", kind: "post-watchdog-finding", issue_number: 41, dedupe_key: "k1" };

  it("full-line dedupe identity: exact line match, never substring containment", () => {
    expect(hasFullLineDedupe("a\ndedupe:k1\nb", "k1")).toBe(true);
    expect(hasFullLineDedupe("prefix dedupe:k1\n", "k1")).toBe(false);
    expect(hasFullLineDedupe("dedupe:k1-and-more\n", "k1")).toBe(false);
    expect(hasFullLineDedupe("dedupe:k1", "k1")).toBe(true);
  });

  it("wrong marker / missing dedupe / unknown fields refuse a result body", () => {
    const wrongMarker = commentBody("straylight:reducer-result:v1", { x: 1 }, "k1");
    expect(validateOperationBody(findingOpShape, wrongMarker).ok).toBe(false);
    const noDedupe = JSON.stringify({ body: "<!-- straylight:watchdog-result:v1 -->\n```json\n{\"x\":1}\n```" });
    expect(validateOperationBody(findingOpShape, noDedupe).ok).toBe(false);
    const extraField = JSON.stringify({ body: "dedupe:k1", assignees: ["evil"] });
    expect(validateOperationBody(findingOpShape, extraField).ok).toBe(false);
  });

  it("a non-advancing result body carrying a straylight:event:v1 marker refuses (no smuggled state advancement)", () => {
    const smuggled = JSON.stringify({
      body: `dedupe:k1\n\n<!-- straylight:watchdog-result:v1 -->\n\`\`\`json\n{"x":1}\n\`\`\`\n<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(stateAdvancingEvent())}\n\`\`\``,
    });
    const r = validateOperationBody(findingOpShape, smuggled);
    expect(r.ok).toBe(false);
  });

  it("a state-advancing body must embed a VALID event whose lane_id matches the op and whose actor is the system bot", () => {
    const op = { op_id: "op-1", kind: "post-state-advancing-event", issue_number: 41, lane_id: "lane-phase-49p", dedupe_key: "k1" };
    const good = commentBody("straylight:event:v1", stateAdvancingEvent(), "k1");
    expect(validateOperationBody(op, good).ok).toBe(true);

    const wrongLane = commentBody("straylight:event:v1", stateAdvancingEvent({ lane_id: "lane-phase-49q" }), "k1");
    expect(validateOperationBody(op, wrongLane).ok).toBe(false);

    const wrongActor = commentBody("straylight:event:v1", stateAdvancingEvent({ actor_role: "operator", github_actor: "eileen1337" }), "k1");
    expect(validateOperationBody(op, wrongActor).ok).toBe(false);

    const invalidEvent = commentBody("straylight:event:v1", { schema: "straylight.event.v1" }, "k1");
    expect(validateOperationBody(op, invalidEvent).ok).toBe(false);
  });

  it("add-derived-label body must be EXACTLY the op's single validated label", () => {
    const op = { op_id: "op-1", kind: "add-derived-label", issue_number: 41, label: "cp-merged" };
    expect(validateOperationBody(op, JSON.stringify({ labels: ["cp-merged"] })).ok).toBe(true);
    expect(validateOperationBody(op, JSON.stringify({ labels: ["cp-merged", "cp-paused"] })).ok).toBe(false);
    expect(validateOperationBody(op, JSON.stringify({ labels: ["cp-paused"] })).ok).toBe(false);
    expect(validateOperationBody(op, JSON.stringify({ labels: [] })).ok).toBe(false);
  });

  it("the cp-paused warning body is the byte-exact state-neutral template", () => {
    const op = {
      op_id: "op-1", kind: "post-cp-paused-warning", issue_number: 41,
      lane_id: "lane-phase-49p", dedupe_key: warningDedupeKey("lane-phase-49p", 41),
    };
    const exact = JSON.stringify({ body: warningBodyFor("lane-phase-49p", 41) });
    expect(validateOperationBody(op, exact).ok).toBe(true);
    const tampered = JSON.stringify({ body: warningBodyFor("lane-phase-49p", 41) + "\nextra" });
    expect(validateOperationBody(op, tampered).ok).toBe(false);
    // State-neutral wording contract: derived projections, no manual-add claim.
    const text = warningBodyFor("lane-phase-49p", 41);
    expect(text).toMatch(/derived projection/);
    expect(text).toMatch(/no longer supports/);
    expect(text).not.toMatch(/added by hand|manually added/i);
    expect(hasFullLineDedupe(text, warningDedupeKey("lane-phase-49p", 41))).toBe(true);
  });

  it("duplicate JSON keys in a body refuse (strict parse, never JSON.parse)", () => {
    const r = validateOperationBody(findingOpShape, '{"body": "dedupe:k1", "body": "other"}');
    expect(r.ok).toBe(false);
  });
});

// =============================================================================
// Executor — validation phase (exit 2 ⇒ ZERO gh launches)
// =============================================================================
describe("executor validation phase — exit 2 guarantees zero gh launches", () => {
  it("row 7: wrong plan repository (and argv mismatch) exit 2 with zero spawns", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const planPath = makePlan(root, [findingOp("op-1", root)], { repository: "evil/repo" });
    const r = runExecutor(root, planPath, gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("repository-not-allowlisted");
    expect(gh.launches()).toHaveLength(0);

    const root2 = makeRoot();
    const gh2 = makeGhMock(root2);
    const planPath2 = makePlan(root2, [findingOp("op-1", root2)]);
    const r2 = runExecutor(root2, planPath2, gh2.dir, { repository: "0xHoneyJar/other-repo" });
    expect(r2.status).toBe(2);
    // The compiled-in allowlist and the argv cross-check both bind.
    expect(["repository-argv-mismatch", "repository-not-allowlisted"]).toContain(r2.out.refusal);
    expect(gh2.launches()).toHaveLength(0);
  });

  it("row 9: a symlinked body file exits 2 (O_NOFOLLOW), zero spawns", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const op = findingOp("op-1", root);
    const realBody = readFileSync(join(root, "op-1.json"), "utf8");
    writeFileSync(join(root, "elsewhere.json"), realBody);
    // Replace the body with a symlink to a byte-identical file: content
    // matches, digest matches — the OPEN must still refuse.
    execFileSync("rm", [join(root, "op-1.json")]);
    symlinkSync(join(root, "elsewhere.json"), join(root, "op-1.json"));
    const planPath = makePlan(root, [op]);
    const r = runExecutor(root, planPath, gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("body-not-regular-file");
    expect(gh.launches()).toHaveLength(0);
  });

  it("rows 10/11: replaced body or wrong plan digest exits 2 (body-digest-mismatch), zero spawns", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const op = findingOp("op-1", root);
    writeFileSync(join(root, "op-1.json"), commentBody("straylight:watchdog-result:v1", { swapped: true }, "finding:op-1"));
    const planPath = makePlan(root, [op]);
    const r = runExecutor(root, planPath, gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("body-digest-mismatch");
    expect(gh.launches()).toHaveLength(0);

    const root2 = makeRoot();
    const gh2 = makeGhMock(root2);
    const op2 = { ...findingOp("op-1", root2), body_sha256: sha256("not the real bytes") };
    const r2 = runExecutor(root2, makePlan(root2, [op2]), gh2.dir);
    expect(r2.status).toBe(2);
    expect(r2.out.refusal).toBe("body-digest-mismatch");
    expect(gh2.launches()).toHaveLength(0);
  });

  it("row 13: endpoint-schema violations exit 2 before any request", () => {
    // Wrong marker for the kind.
    const root = makeRoot();
    const gh = makeGhMock(root);
    const body = commentBody("straylight:event:v1", stateAdvancingEvent(), "k1");
    const digest = writeBody(root, "op-1.json", body);
    const op = { op_id: "op-1", kind: "post-reducer-result", issue_number: 41, dedupe_key: "k1", body_file: "op-1.json", body_sha256: digest };
    const r = runExecutor(root, makePlan(root, [op]), gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("body-endpoint-schema");
    expect(gh.launches()).toHaveLength(0);

    // DELETE kind with a body_file is an unknown field.
    const root2 = makeRoot();
    const gh2 = makeGhMock(root2);
    const del = { op_id: "op-1", kind: "remove-derived-label", issue_number: 41, label: "cp-merged", body_file: "x.json", body_sha256: sha256("x") };
    const r2 = runExecutor(root2, makePlan(root2, [del]), gh2.dir);
    expect(r2.status).toBe(2);
    expect(r2.out.refusal).toBe("unknown-field");
    expect(gh2.launches()).toHaveLength(0);
  });

  it("row 14 (executable): best_effort on an operation exits 2 with zero spawns", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const op = { ...findingOp("op-1", root), best_effort: true };
    const r = runExecutor(root, makePlan(root, [op]), gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("unknown-field");
    expect(gh.launches()).toHaveLength(0);
  });

  it("rows 17/18 (executable): terminal-barrier and duplicate-advancing plans exit 2 with zero spawns", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const r = runExecutor(root, makePlan(root, [eventOp("op-1", root), findingOp("op-2", root, 41)]), gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("terminal-barrier-violation");
    expect(gh.launches()).toHaveLength(0);
  });

  it("PREFLIGHT-FAILURE CONTROL: a valid two-op plan with ONE invalid op exits 2 and launches NOTHING — not even the valid op", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const valid = findingOp("op-1", root);
    const invalid = { ...findingOp("op-2", root, 42, "finding:op-2"), best_effort: true };
    const r = runExecutor(root, makePlan(root, [valid, invalid]), gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.phase).toBe("validation");
    expect(gh.launches()).toHaveLength(0);
    expect(existsSync(join(gh.dir, "gh-stdin-1"))).toBe(false);
  });
});

// =============================================================================
// Executor — execution phase (exit 0 / exit 4; never exit 2)
// =============================================================================
describe("executor execution phase — fixed argv, retained bytes, exit 4 on any launch/fatal failure", () => {
  it("a valid plan executes with the FIXED argv shape and stdin carrying the exact validated bytes", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const op = findingOp("op-1", root);
    const originalBytes = readFileSync(join(root, "op-1.json"), "utf8");
    const r = runExecutor(root, makePlan(root, [op]), gh.dir);
    expect(r.status).toBe(0);
    expect(r.out).toMatchObject({ ok: true, phase: "execution" });
    expect(gh.launches()).toEqual([
      `ARGV: api -X POST repos/${REPO}/issues/41/comments --input -`,
    ]);
    expect(gh.stdinOf(1)).toBe(originalBytes);
  });

  it("bodyless DELETE uses the fixed no-input argv", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const op = { op_id: "op-1", kind: "remove-derived-label", issue_number: 41, label: "cp-state:ready-for-codex" };
    const r = runExecutor(root, makePlan(root, [op]), gh.dir);
    expect(r.status).toBe(0);
    expect(gh.launches()).toEqual([
      `ARGV: api -X DELETE repos/${REPO}/issues/41/labels/cp-state%3Aready-for-codex`,
    ]);
  });

  it("row 12: stdin carries the RETAINED validated bytes despite an on-disk race after validation", () => {
    const root = makeRoot();
    const op1 = findingOp("op-1", root, 41, "finding:op-1");
    const op2 = findingOp("op-2", root, 42, "finding:op-2");
    const op2Original = readFileSync(join(root, "op-2.json"), "utf8");
    // The mock's first call REWRITES op-2's body on disk between op-1's
    // request and op-2's request — after validation retained the bytes.
    const gh = makeGhMock(root, `if [ "$N" = "1" ]; then printf 'RACED JUNK' > "${join(root, "op-2.json")}"; fi`);
    const r = runExecutor(root, makePlan(root, [op1, op2]), gh.dir);
    expect(r.status).toBe(0);
    expect(readFileSync(join(root, "op-2.json"), "utf8")).toBe("RACED JUNK"); // the race really happened
    expect(gh.stdinOf(2)).toBe(op2Original); // …and never reached the request
  });

  it("row 15: a failing warning post exits 4 AT the warning; the cp-paused DELETE is never spawned", () => {
    const root = makeRoot();
    const w = warningOp("op-1", root);
    const removal = {
      op_id: "op-2", kind: "remove-derived-cp-paused-after-warning",
      issue_number: 41, lane_id: "lane-phase-49p", warning_op_id: "op-1",
    };
    const gh = makeGhMock(root, `if [ "$N" = "1" ]; then exit 1; fi`);
    const r = runExecutor(root, makePlan(root, [w, removal]), gh.dir);
    expect(r.status).toBe(4);
    expect(r.out.refusal).toBe("fatal-operation-failed");
    expect(gh.launches()).toHaveLength(1); // only the warning POST; no DELETE
    expect(gh.launches()[0]).toContain("POST");
  });

  it("row 16: an already-present warning (warning_proof) lets the removal retry WITHOUT a second warning post", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const removal = {
      op_id: "op-1", kind: "remove-derived-cp-paused-after-warning",
      issue_number: 41, lane_id: "lane-phase-49p",
      warning_proof: { comment_id: 987654, dedupe_key: warningDedupeKey("lane-phase-49p", 41) },
    };
    const r = runExecutor(root, makePlan(root, [removal]), gh.dir);
    expect(r.status).toBe(0);
    expect(gh.launches()).toEqual([
      `ARGV: api -X DELETE repos/${REPO}/issues/41/labels/cp-paused`,
    ]);
  });

  it("warning-only API failure: a non-zero gh RESULT on a derived-label op logs, continues, exits 0", () => {
    const root = makeRoot();
    // Label op fails (exit 1) but the later fatal finding still runs.
    const label = labelAddOp("op-1", root);
    const finding = findingOp("op-2", root, 42, "finding:op-2");
    const gh = makeGhMock(root, `if [ "$N" = "1" ]; then exit 1; fi`);
    const r = runExecutor(root, makePlan(root, [label, finding]), gh.dir);
    expect(r.status).toBe(0);
    expect(gh.launches()).toHaveLength(2);
    expect(r.out.results).toEqual([
      { op_id: "op-1", kind: "add-derived-label", status: "warning-failed", gh_status: 1 },
      { op_id: "op-2", kind: "post-watchdog-finding", status: "ok" },
    ]);
  });

  it("a non-zero gh RESULT on a fatal kind exits 4 immediately; no later operation runs", () => {
    const root = makeRoot();
    const f1 = findingOp("op-1", root, 41, "finding:op-1");
    const f2 = findingOp("op-2", root, 42, "finding:op-2");
    const gh = makeGhMock(root, `if [ "$N" = "1" ]; then exit 1; fi`);
    const r = runExecutor(root, makePlan(root, [f1, f2]), gh.dir);
    expect(r.status).toBe(4);
    expect(gh.launches()).toHaveLength(1);
  });

  it("PARTIAL EXECUTION (accepted addendum): op 1 succeeds and is recorded; LAUNCHING op 2 fails; exit 4; nothing later runs", () => {
    const root = makeRoot();
    const f1 = findingOp("op-1", root, 41, "finding:op-1");
    const f2 = findingOp("op-2", root, 42, "finding:op-2");
    const f3 = findingOp("op-3", root, 43, "finding:op-3");
    const f1Bytes = readFileSync(join(root, "op-1.json"), "utf8");
    // The mock deletes ITSELF after write call 1: op-2's next spawn fails
    // (ENOENT) — a LAUNCH failure, not an API failure. PATH is ISOLATED to the
    // mock dir + bare utilities so no system gh can absorb the second launch.
    const gh = makeGhMock(root, `rm -f "$0"`);
    const r = runExecutor(root, makePlan(root, [f1, f2, f3]), gh.dir, {}, { isolated: true });
    expect(r.status).toBe(4); // execution began ⇒ never exit 2
    expect(r.out.phase).toBe("execution");
    // Since H-02, op-2's first spawn is its read-only AUTHORITY PROBE rather
    // than its mutation, so the vanished gh is detected one syscall earlier and
    // reported as `authority-read-failed`. Still exit 4, still phase execution:
    // op-1 may already have landed, so nothing here may exit 2.
    expect(r.out.refusal).toBe("authority-read-failed");
    expect(r.out.detail).toContain("op-2");
    // Operation one remains recorded and is not rolled back.
    expect(gh.launches()).toEqual([
      `ARGV: api -X POST repos/${REPO}/issues/41/comments --input -`,
    ]);
    expect(gh.stdinOf(1)).toBe(f1Bytes);
    expect(r.out.results).toEqual([{ op_id: "op-1", kind: "post-watchdog-finding", status: "ok" }]);
    // No operation after the failed second was attempted (no third launch).
    expect(existsSync(join(gh.dir, "gh-stdin-2"))).toBe(false);
    expect(existsSync(join(gh.dir, "gh-stdin-3"))).toBe(false);
  });

  it("inability to launch gh on the FIRST MUTATION is exit 4, never exit 2 — execution had begun", () => {
    const root = makeRoot();
    // Authority is fully established for op-1 (all three probes answered), and
    // the mock then removes itself, so the very next spawn — the mutation — is a
    // genuine ENOENT. This is the boundary the two-phase contract turns on: the
    // read-only probes are preflight, the mutation attempt is not.
    const gh = makeGhMock(root, "", { deleteAfterReads: 3 });
    const planPath = makePlan(root, [findingOp("op-1", root)]);
    const r = runExecutor(root, planPath, gh.dir, {}, { isolated: true });
    expect(r.status).toBe(4);
    expect(r.out.phase).toBe("execution");
    expect(r.out.refusal).toBe("gh-launch-failed");
    expect(gh.reads()).toHaveLength(3);
    expect(gh.launches()).toHaveLength(0); // the mutation never got off the ground
  });

  it("inability to launch gh for a WARNING-ONLY label operation is still exit 4 — no trustworthy result exists", () => {
    const root = makeRoot();
    const op = { op_id: "op-1", kind: "remove-derived-label", issue_number: 41, label: "cp-merged" };
    const gh = makeGhMock(root, "", { deleteAfterReads: 3 });
    const r = runExecutor(root, makePlan(root, [op]), gh.dir, {}, { isolated: true });
    expect(r.status).toBe(4);
    expect(r.out.phase).toBe("execution");
    expect(r.out.refusal).toBe("gh-launch-failed");
  });

  it("an empty validated plan executes nothing — and probes no authority, because there is nothing to authorize", () => {
    const root = makeRoot();
    const gh = makeGhMock(root);
    const r = runExecutor(root, makePlan(root, []), gh.dir);
    expect(r.status).toBe(0);
    expect(gh.launches()).toHaveLength(0);
    expect(gh.reads()).toHaveLength(0);
  });
});

// =============================================================================
// Executor security posture (source-level, executable where possible)
// =============================================================================
describe("executor security posture", () => {
  const src = readFileSync(EXECUTOR, "utf8");

  it("spawns only the literal name 'gh' with shell:false; no shell, eval, exec-string, or interpolation", () => {
    expect(src).toMatch(/spawnSync\("gh", argv, \{/);
    expect(src).toMatch(/shell: false/);
    const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(code).not.toMatch(/\beval\(|execSync|exec\(|spawn\(|shell: true/);
    expect(code).not.toMatch(/fetch\(|https?:\/\/api\.github\.com/);
  });

  it("passes a minimal environment: exactly PATH, HOME, GH_TOKEN", () => {
    expect(src).toMatch(/\["PATH", "HOME", "GH_TOKEN"\]/);
  });

  it("opens plan and bodies with O_NOFOLLOW and reads exactly once from the descriptor", () => {
    expect(src).toMatch(/O_RDONLY \| constants\.O_NOFOLLOW/);
    expect(src).toMatch(/fstatSync\(fd\)\.isFile\(\)/);
    expect(src).toMatch(/readFileSync\(fd\)/);
  });
});
