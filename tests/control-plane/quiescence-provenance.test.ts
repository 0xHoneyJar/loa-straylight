// Q3 — QUIESCENCE EVIDENCE PROVENANCE (Codex HIGH + two MEDIUM)
//
// THE DEFECT, in the auditor's own construction
//
// scripts/capture-durable-frontier.mjs took the operator's `--quiescence` document
// as its licence. It validated the shape, checked the repository and the frozen
// SHA, and then copied the document's three evidence fields into the frontier. So a
// HANDWRITTEN file — right revision, right workflow list, `active_write_runs: []`,
// a plausible instant — passed every check, and the capture emitted a valid
// frontier while the policy committed at that revision still said
// `enabled: true`. "This document says quiescence was proven" had become a
// substitute for "quiescence was actually proven". Two MEDIUM findings sat under
// it: the verifier derived the write-capable workflow set from
// `.github/workflows` in the CALLER'S WORKING DIRECTORY, so `frozen_main_sha`
// bound none of the bytes it claimed to; and `parseWorkflowRunPages` counted
// `scanned` per entry, so one run repeated across two pages could pay for a queued
// run the pagination never returned.
//
// THE INVARIANT THESE TESTS DEFEND
//
//   A durable frontier is admissible only if the capture operation ITSELF proves
//   the quiescence conditions it relies on, against GitHub, at the exact frozen
//   revision. A caller-supplied JSON assertion is evidence to compare and report.
//   It can cause a REFUSAL; it can never cause an acceptance.
//
// WHAT IS EXERCISED HERE. The real CLIs, out of the real tree, against a mock `gh`
// on PATH. The mock serves a workflow tree that DELIBERATELY DIFFERS from this
// repository's own — one write-capable file where the checkout has four — so every
// assertion about the derived set distinguishes "read from GitHub at the frozen
// commit" from "read off the local disk". Every CLI here additionally runs from a
// synthetic working directory containing a planted write-capable workflow, so the
// CWD defect cannot hide behind a checkout that happens to agree.
//
// Nothing here writes: the mock records every non-GET invocation and each test
// asserts that log is empty. No lane, label, comment, or policy in the real
// repository is touched, and no real freeze or frontier transition happens.

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  parseWorkflowRunPages,
  validateFrozenQuiescence,
  QUIESCENCE_SCHEMA,
} from "../../.straylight/lib/frozen-quiescence.mjs";
import { validateDurableFrontier } from "../../.straylight/lib/durable-frontier.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { ADMISSION_FIELDS } from "../../.straylight/lib/validate.mjs";
import { admissionEpochDigest } from "../../.straylight/lib/admission-locks.mjs";
import { COMMITTED_POLICY_TEXT, workflowDirectoryResponse, workflowFileResponse } from "./_fixtures.js";

const REPO = "0xHoneyJar/loa-straylight";
const API = "https://api.github.com";
const CAPTURE_CLI = resolve("scripts/capture-durable-frontier.mjs");
const VERIFY_CLI = resolve("scripts/verify-frozen-quiescence.mjs");
const WORKFLOW_DIR = ".github/workflows";

/** The frozen revision the operator names, and the revision main moves to. */
const FROZEN = "6f0d3b5c7e9a1f2d4b6c8e0a2f4d6b8c2b1c4e6a";
const MOVED = "9a1f2d4b6c8e0a2f4d6b8c2b1c4e6a6f0d3b5c7e";

// ---------------------------------------------------------------------------
// Policy texts, derived from the REAL committed file
//
// The proof accepts committed policy bytes through acceptCommittedPolicyText,
// which applies the production accepted-epoch digest locks, so no synthetic policy
// can stand in. One asserted single-occurrence substitution flips the kill switch
// and leaves every other byte — including the locked epoch-001 block — verbatim.
// ---------------------------------------------------------------------------

function substituteOnce(text: string, from: string, to: string): string {
  expect(text.split(from).length - 1, `${from}: must occur exactly once`).toBe(1);
  return text.split(from).join(to);
}

/** `enabled: true` — the state Codex's handwritten evidence was accepted against. */
const LIVE_POLICY_TEXT = COMMITTED_POLICY_TEXT;
/** `enabled: false` — the committed freeze a capture is allowed to run under. */
const FROZEN_POLICY_TEXT = substituteOnce(COMMITTED_POLICY_TEXT, '"enabled": true', '"enabled": false');

// ---------------------------------------------------------------------------
// The workflow tree the MOCK serves at the frozen commit
//
// Deliberately NOT this repository's tree. The local checkout has four
// write-capable workflows; the frozen commit the mock describes has exactly one,
// under a name that appears nowhere on disk. Any assertion that the derived set is
// [alpha-writer.yml] is therefore an assertion that the bytes came from GitHub at
// `?ref=<frozen sha>`, and any appearance of a straylight-*.yml path in the output
// would be the local-CWD defect returning.
// ---------------------------------------------------------------------------

const WRITER_YAML = [
  "name: alpha writer",
  "on: issue_comment",
  "jobs:",
  "  write:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - run: node .straylight/bin/execute-write-plan.mjs --plan plan.json",
  "",
].join("\n");

const READER_YAML = [
  "name: beta reader",
  "on: schedule",
  "jobs:",
  "  read:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - run: node .straylight/bin/collect-lane-evidence.mjs",
  "",
].join("\n");

type WorkflowFile = { name: string; text: string };

const FROZEN_TREE: WorkflowFile[] = [
  { name: "alpha-writer.yml", text: WRITER_YAML },
  { name: "beta-reader.yml", text: READER_YAML },
];

const WRITER_PATH = `${WORKFLOW_DIR}/alpha-writer.yml`;
/** What an honest derivation from FROZEN_TREE must produce. */
const FROZEN_SET = [WRITER_PATH];

/** This repository's own write-capable set — what must NEVER appear in the output. */
const LOCAL_SET = [
  `${WORKFLOW_DIR}/straylight-bootstrap.yml`,
  `${WORKFLOW_DIR}/straylight-merge-guard.yml`,
  `${WORKFLOW_DIR}/straylight-reducer.yml`,
  `${WORKFLOW_DIR}/straylight-watchdog.yml`,
];

/** The write-capable workflow a synthetic caller working directory plants. */
const PLANTED = `${WORKFLOW_DIR}/evil.yml`;

// ---------------------------------------------------------------------------
// Run pages and Actions responses
// ---------------------------------------------------------------------------

const apiRun = (id: number, status: string, created_at = "2026-08-14T11:50:00Z", workflow = WRITER_PATH) => ({
  id,
  path: workflow,
  status,
  created_at,
  name: workflow,
  event: "issue_comment",
});

/** One page of `gh api --paginate .../runs` output. */
const runPage = (runs: Record<string, any>[], total_count = runs.length) =>
  JSON.stringify({ total_count, workflow_runs: runs }) + "\n";

/** Several pages, exactly as --paginate concatenates them. */
const runPages = (...pages: string[]) => pages.join("");

const NO_RUNS = runPage([]);
const ONE_COMPLETED = runPage([apiRun(4001, "completed")]);
const ONE_QUEUED = runPage([apiRun(4002, "queued", "2026-08-14T11:58:00Z")]);
/** The planted workflow's own run history, for the M-Q3 mutant. */
const PLANTED_COMPLETED = runPage([apiRun(4001, "completed", "2026-08-14T11:50:00Z", PLANTED)]);

// ---------------------------------------------------------------------------
// Lane evidence: three synthetic cp-lanes with protocol event comments
// ---------------------------------------------------------------------------

const laneBody = (lane_id: string) =>
  `# ${lane_id}\n\nprose a human reads\n\n<!-- straylight:lane:v1 -->\n` +
  "```json\n" + JSON.stringify({ lane_id, phase: "phase-50a" }, null, 2) + "\n```\n";

const eventBody = (sequence: number) =>
  `## event\n\n<!-- straylight:event:v1 -->\n` +
  "```json\n" + JSON.stringify({ schema: "straylight.event.v1", sequence }, null, 2) + "\n```\n";

const issueEntry = (number: number, body: string) => ({
  number,
  url: `${API}/repos/${REPO}/issues/${number}`,
  body,
});

const commentEntry = (issue: number, id: number, created_at: string, body: string) => ({
  id,
  url: `${API}/repos/${REPO}/issues/comments/${id}`,
  issue_url: `${API}/repos/${REPO}/issues/${issue}`,
  user: { login: "eileen1337" },
  body,
  created_at,
  updated_at: created_at,
});

const LANES = [
  { issue: 118, lane_id: "lane-phase-49p" },
  { issue: 120, lane_id: "lane-phase-49q" },
  { issue: 122, lane_id: "lane-phase-50a" },
];

/** The plain `state=all` enumeration: the three lanes plus a non-lane issue. */
const ISSUES_PLAIN =
  JSON.stringify([
    ...LANES.map((l) => issueEntry(l.issue, laneBody(l.lane_id))),
    issueEntry(99, "an ordinary issue with no lane marker"),
  ]) + "\n";

/** The `labels=cp-lane` enumeration: the same three lanes, nothing new. */
const ISSUES_LABELLED = JSON.stringify(LANES.map((l) => issueEntry(l.issue, laneBody(l.lane_id)))) + "\n";

/** Two protocol events per lane, plus one inert prose comment. */
const commentsFor = (issue: number, base: number, lastAt: string) =>
  JSON.stringify([
    commentEntry(issue, base + 1, "2026-08-12T10:00:00Z", eventBody(1)),
    commentEntry(issue, base + 2, "2026-08-12T10:30:00Z", "just prose; no marker, no authority"),
    commentEntry(issue, base + 3, lastAt, eventBody(2)),
  ]) + "\n";

const COMMENTS: Record<number, string> = {
  118: commentsFor(118, 5100000000, "2026-08-13T01:00:00Z"),
  120: commentsFor(120, 5200000000, "2026-08-13T02:00:00Z"),
  122: commentsFor(122, 5300000000, "2026-08-13T04:55:42Z"),
};

/** The latest authenticated event time across the three lanes. */
const MAX_EVENT_AT = "2026-08-13T04:55:42Z";

// ---------------------------------------------------------------------------
// The mock `gh`
//
// Read dispatch is on the LAST argv element (the request path), which is where it
// sits in both `gh api <path>` and `gh api --paginate <path>`. Anything that is not
// a plain `gh api` GET is recorded in writes.log and succeeds — a tool that wrote
// anyway is caught by the recording, not by the mock refusing.
//
// Run responses are SEQUENCED per workflow: the Nth read of a workflow's runs
// serves the Nth entry, and the last entry repeats. A capture makes four such
// reads per workflow (two proofs × two scans), so [clean, clean, queued] plants a
// run that appears only AFTER the lane reads.
// ---------------------------------------------------------------------------

type GhOpts = {
  mainSha?: string;
  nextMainSha?: string;
  /** Report `nextMainSha` once more than this many ref reads have been served. */
  swapAfterRefReads?: number;
  defaultBranch?: string;
  /** commit sha → the policy text committed there. */
  policies?: Record<string, string>;
  /** commit sha → the workflow files committed there. */
  trees?: Record<string, WorkflowFile[]>;
  /** commit sha → a RAW directory listing response (adversarial shapes). */
  treeRaw?: Record<string, string>;
  /** `<sha>/<name>` → a RAW file response (adversarial shapes). */
  fileRaw?: Record<string, string>;
  /** workflow file name → the sequence of run page streams. */
  runs?: Record<string, string[]>;
  issuesPlain?: string;
  issuesLabelled?: string;
  comments?: Record<number, string>;
};

/** A GitHub contents-API file response for arbitrary text at a path. */
function contentsResponse(path: string, text: string): string {
  const content = Buffer.from(text, "utf8").toString("base64");
  return JSON.stringify({
    type: "file",
    path,
    encoding: "base64",
    size: Buffer.byteLength(text, "utf8"),
    content: (content.match(/.{1,60}/g) ?? []).join("\n") + "\n",
  });
}

// Each mock gets its own directory: the run-sequence and ref-swap counters live on
// disk, so two mocks sharing one would interleave their state.
let mockSeq = 0;

function makeGh(root: string, opts: GhOpts = {}) {
  mockSeq += 1;
  const dir = join(root, `gh-mock-${mockSeq}`);
  mkdirSync(dir, { recursive: true });
  const write = (name: string, text: string) => writeFileSync(join(dir, name), text);

  write("metadata.json", JSON.stringify({ full_name: REPO, default_branch: opts.defaultBranch ?? "main" }));
  const refDoc = (sha: string) => JSON.stringify({ ref: "refs/heads/main", object: { type: "commit", sha } });
  write("ref.json", refDoc(opts.mainSha ?? FROZEN));
  if (opts.nextMainSha !== undefined) write("next-ref.json", refDoc(opts.nextMainSha));

  for (const [sha, text] of Object.entries(opts.policies ?? { [FROZEN]: FROZEN_POLICY_TEXT })) {
    write(`policy-${sha}.json`, contentsResponse(".straylight/automation-policy.json", text));
  }

  for (const [sha, files] of Object.entries(opts.trees ?? { [FROZEN]: FROZEN_TREE })) {
    write(`tree-${sha}.json`, workflowDirectoryResponse(files));
    for (const f of files) write(`workflow-${sha}-${f.name}.json`, workflowFileResponse(f.name, f.text));
  }
  for (const [sha, raw] of Object.entries(opts.treeRaw ?? {})) write(`tree-${sha}.json`, raw);
  for (const [key, raw] of Object.entries(opts.fileRaw ?? {})) {
    const at = key.indexOf("/");
    write(`workflow-${key.slice(0, at)}-${key.slice(at + 1)}.json`, raw);
  }

  for (const [name, sequence] of Object.entries(opts.runs ?? {})) {
    sequence.forEach((pages, i) => write(`runs-${name}-${i + 1}.json`, pages));
  }

  write("issues-plain.json", opts.issuesPlain ?? ISSUES_PLAIN);
  write("issues-labelled.json", opts.issuesLabelled ?? ISSUES_LABELLED);
  for (const [issue, pages] of Object.entries(opts.comments ?? COMMENTS)) write(`comments-${issue}.json`, pages);

  const script = `#!/bin/sh
DIR='${dir}'
{ printf 'READ:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "$DIR/reads.log"
if [ "$1" != "api" ] || [ "$2" = "-X" ] || [ "$2" = "--method" ]; then
  { printf 'WRITE:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "$DIR/writes.log"
  exit 0
fi
TARGET=""
for a in "$@"; do TARGET="$a"; done
serve() {
  if [ -f "$DIR/$1" ]; then cat "$DIR/$1"; else printf 'no fixture: %s\\n' "$1" >&2; exit 1; fi
}
case "$TARGET" in
  */git/ref/heads/main)
    RN=$(cat "$DIR/refcount" 2>/dev/null || echo 0)
    RN=$((RN+1))
    printf '%s' "$RN" > "$DIR/refcount"
    if [ -f "$DIR/next-ref.json" ] && [ "$RN" -gt ${opts.swapAfterRefReads ?? 999999} ]; then
      serve next-ref.json
    else
      serve ref.json
    fi
    ;;
  */contents/.github/workflows/*)
    REST=\${TARGET#*/contents/.github/workflows/}
    serve "workflow-\${TARGET##*ref=}-\${REST%%\\?*}.json"
    ;;
  */contents/.github/workflows*)
    serve "tree-\${TARGET##*ref=}.json"
    ;;
  */contents/*)
    serve "policy-\${TARGET##*ref=}.json"
    ;;
  */actions/workflows/*)
    REST=\${TARGET#*/actions/workflows/}
    WF=\${REST%%/runs*}
    N=$(cat "$DIR/runcount-$WF" 2>/dev/null || echo 0)
    N=$((N+1))
    printf '%s' "$N" > "$DIR/runcount-$WF"
    I=$N
    while [ "$I" -gt 0 ] && [ ! -f "$DIR/runs-$WF-$I.json" ]; do I=$((I-1)); done
    if [ "$I" -gt 0 ]; then cat "$DIR/runs-$WF-$I.json"; else printf '{"total_count":0,"workflow_runs":[]}\\n'; fi
    ;;
  *labels=cp-lane*)
    serve issues-labelled.json
    ;;
  */issues/*/comments*)
    REST=\${TARGET#*/issues/}
    serve "comments-\${REST%%/comments*}.json"
    ;;
  */issues?state=all*)
    serve issues-plain.json
    ;;
  *)
    serve metadata.json
    ;;
esac
exit 0
`;
  writeFileSync(join(dir, "gh"), script);
  chmodSync(join(dir, "gh"), 0o755);
  const lines = (name: string) => {
    const path = join(dir, name);
    return existsSync(path) ? readFileSync(path, "utf8").trim().split("\n").filter(Boolean) : [];
  };
  return { dir, reads: () => lines("reads.log"), writes: () => lines("writes.log") };
}

const makeRoot = () => mkdtempSync(join(tmpdir(), "cp-quiescence-"));

/**
 * A synthetic working directory holding a PLANTED write-capable workflow. Codex's
 * MEDIUM finding was that the derivation read this directory; every CLI here runs
 * with `cwd` set to one, so if it ever did again the planted file would surface.
 */
function syntheticCheckout(root: string): string {
  const cwd = join(root, "synthetic-checkout");
  mkdirSync(join(cwd, WORKFLOW_DIR), { recursive: true });
  writeFileSync(
    join(cwd, WORKFLOW_DIR, "evil.yml"),
    "name: planted\njobs:\n  x:\n    steps:\n      - run: node .straylight/bin/execute-write-plan.mjs\n",
  );
  return cwd;
}

type Run = { status: number; out: any; stdout: string; stderr: string };

function runCli(cli: string, args: string[], ghDir: string, cwd: string): Run {
  // spawnSync, not execFileSync: the progress narration a successful capture
  // writes to stderr is part of what these tests assert, and execFileSync only
  // hands stderr back on failure.
  const r = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${ghDir}:${process.env.PATH}` },
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = r.stdout ?? "";
  let out: any = null;
  try { out = JSON.parse(stdout); } catch { out = null; }
  return { status: r.status ?? -1, out, stdout, stderr: r.stderr ?? "" };
}

/** The capture, always run from a synthetic CWD with a planted workflow. */
function capture(root: string, ghDir: string, args: string[], cli = CAPTURE_CLI): Run {
  return runCli(cli, ["--repo", REPO, ...args], ghDir, syntheticCheckout(root));
}

/** A quiescence RECEIPT, as an operator (or an attacker) would hand-write one. */
function receiptFile(root: string, overrides: Record<string, any> = {}, name = "quiescence.json"): string {
  const doc = {
    schema: QUIESCENCE_SCHEMA,
    repository: REPO,
    frozen_main_sha: FROZEN,
    checked_at: "2026-08-14T11:59:00Z",
    write_capable_workflows: [...FROZEN_SET],
    active_write_runs: [],
    ...overrides,
  };
  const path = join(root, name);
  writeFileSync(path, JSON.stringify(doc, null, 2) + "\n");
  return path;
}

// =============================================================================
// Q3-T6 … Q3-T8 (unit) — a repeated run id invalidates the run evidence
//
// `scanned` counted every entry, so `total_count: 2` was satisfied by one run
// returned twice. The completeness bound then passed while a queued run the
// pagination never returned went unseen. Silently deduplicating would have fixed
// the arithmetic and KEPT the omission, so a repeat is a refusal.
// =============================================================================
describe("Q3-T6/T7/T8 — duplicate run ids across pages fail closed", () => {
  const parse = (text: string) => parseWorkflowRunPages(text, { workflow_path: WRITER_PATH }) as any;

  it("Q3-T6: the SAME completed run returned on two identical pages is refused", () => {
    const page = runPage([apiRun(4001, "completed")], 2);
    const r = parse(runPages(page, page));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("run-pages-duplicate");
    expect(r.detail).toContain("run 4001 was already collected");
    expect(r.detail).toMatch(/refusing rather than deduplicating/);
  });

  it("Q3-T8: a duplicated completed run must not pay for an omitted queued run", () => {
    // The exact masking shape: total_count says 2, two pages arrive, both hold the
    // same completed run, and run 4002 (queued) is never returned. Per-entry
    // counting made this look like a complete, quiescent scan.
    const page = runPage([apiRun(4001, "completed")], 2);
    const masked = parse(runPages(page, page));
    expect(masked.ok).toBe(false);
    expect(masked.reason).toBe("run-pages-duplicate");
    expect(masked.detail).toMatch(/let a duplicated completed run pay for an omitted active one/);

    // The honest version of the same total_count: two DISTINCT runs, one queued.
    // Unique ids satisfy the bound, and the queued run is reported active.
    const honest = parse(
      runPages(runPage([apiRun(4001, "completed")], 2), runPage([apiRun(4002, "queued", "2026-08-14T11:58:00Z")], 2)),
    );
    expect(honest.ok, honest.ok ? "" : honest.detail).toBe(true);
    expect(honest.scanned).toBe(2);
    expect(honest.active).toEqual([
      { workflow: WRITER_PATH, run_id: 4002, status: "queued", created_at: "2026-08-14T11:58:00Z" },
    ]);
  });

  it("Q3-T7: a repeated id whose entries DISAGREE is refused as ambiguous", () => {
    // Same id, different status: the run cannot be both. Which copy wins would
    // decide quiescence, so neither does.
    const statusClash = parse(
      runPages(runPage([apiRun(4001, "completed")], 2), runPage([apiRun(4001, "in_progress")], 2)),
    );
    expect(statusClash.ok).toBe(false);
    expect(statusClash.reason).toBe("run-pages-duplicate");
    expect(statusClash.detail).toMatch(/the two entries disagree/);
    expect(statusClash.detail).toContain('"completed"/"in_progress"');
    expect(statusClash.detail).toMatch(/the run's state is ambiguous/);

    // Same id, different created_at: the same ambiguity about which read is real.
    const timeClash = parse(
      runPages(
        runPage([apiRun(4001, "completed", "2026-08-14T11:50:00Z")], 2),
        runPage([apiRun(4001, "completed", "2026-08-14T11:51:00Z")], 2),
      ),
    );
    expect(timeClash.ok).toBe(false);
    expect(timeClash.reason).toBe("run-pages-duplicate");
    expect(timeClash.detail).toMatch(/the two entries disagree/);
    expect(timeClash.detail).toContain('"2026-08-14T11:50:00Z"/"2026-08-14T11:51:00Z"');
  });

  it("the decision is order-independent: reordering the pages changes nothing", () => {
    const a = runPage([apiRun(4001, "completed")], 2);
    const b = runPage([apiRun(4001, "in_progress")], 2);
    expect(parse(runPages(a, b)).ok).toBe(false);
    expect(parse(runPages(b, a)).reason).toBe(parse(runPages(a, b)).reason);
    // Two DISTINCT runs also produce the same result either way round: `active` is
    // sorted by the scanner, so the observation is a set, not a sequence.
    const p1 = runPage([apiRun(4001, "completed")], 2);
    const p2 = runPage([apiRun(4002, "queued", "2026-08-14T11:58:00Z")], 2);
    expect(parse(runPages(p1, p2))).toEqual(parse(runPages(p2, p1)));
  });

  it("`scanned` is the number of UNIQUE validated ids, and it bounds completeness", () => {
    const three = parse(
      runPages(runPage([apiRun(1, "completed"), apiRun(2, "completed")], 3), runPage([apiRun(3, "completed")], 3)),
    );
    expect(three.ok, three.ok ? "" : three.detail).toBe(true);
    expect(three.scanned).toBe(3);
    expect(three.active).toEqual([]);

    // One page short of total_count: refused, because the missing run could be the
    // active one. The message says so in the language of unique runs.
    const short = parse(runPage([apiRun(1, "completed")], 3));
    expect(short.ok).toBe(false);
    expect(short.reason).toBe("run-pages-incomplete");
    expect(short.detail).toMatch(/collected 1 unique run\(s\)/);
    expect(short.detail).toMatch(/refusing rather than reporting quiescence over a partial history/);
  });
});

// =============================================================================
// Q3-T1 … Q3-T3, Q3-T11, Q3-T12 — the capture proves its own quiescence
// =============================================================================
describe("Q3-T1/T11/T12 — a handwritten document cannot license a capture", () => {
  it("Q3-T1: perfect handwritten evidence against an `enabled: true` main REFUSES", () => {
    // Codex's attack, verbatim in shape: main IS the named revision, the receipt
    // names the right repository and revision, lists the right workflows, and
    // claims nothing was in flight — but the policy committed there still permits
    // writes. The old capture emitted a valid frontier here.
    const root = makeRoot();
    const gh = makeGh(root, { policies: { [FROZEN]: LIVE_POLICY_TEXT } });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN, "--quiescence", receiptFile(root)]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/quiescence proof 1 \(pre-capture\) refused: not-frozen/);
    expect(r.stderr).toContain("enabled must be the boolean false");
    expect(r.stderr).toMatch(
      /the capture proves quiescence itself; it cannot be satisfied by a document that asserts it/,
    );
    // NOTHING was emitted: no frontier on stdout, and no write of any kind.
    expect(r.stdout).toBe("");
    expect(gh.writes()).toEqual([]);
    // It refused BEFORE reading a single lane: the freeze is a precondition of the
    // capture, not a footnote checked after the evidence is gathered.
    expect(gh.reads().filter((l) => l.includes("/issues"))).toEqual([]);
  });

  it("Q3-T11: under a real committed freeze with nothing in flight, the capture succeeds", () => {
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status, r.stderr).toBe(0);
    const v = validateDurableFrontier(r.out);
    expect(v.ok, v.ok ? "" : (v as any).errors.join("; ")).toBe(true);
    expect(r.out.repository).toBe(REPO);
    expect(r.out.frozen_main_sha).toBe(FROZEN);
    expect(r.out.lanes.map((l: any) => l.issue_number)).toEqual([118, 120, 122]);
    expect(r.out.lanes.reduce((n: number, l: any) => n + l.event_count, 0)).toBe(6);
    expect(r.out.max_event_created_at).toBe(MAX_EVENT_AT);
    expect(gh.writes()).toEqual([]);
    // `--quiescence` is OPTIONAL: no receipt was supplied and the capture still
    // proved everything it needed, twice.
    expect(r.stderr).toMatch(/quiescence proof 1 \(pre-capture\): quiescent at/);
    expect(r.stderr).toMatch(/quiescence proof 2 \(post-capture\): quiescent at/);
  });

  it("Q3-T12: every quiescence field in the frontier is the FRESH proof's, not the receipt's", () => {
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    // A receipt that AGREES about the workflow set (it must, or the capture
    // refuses) but disagrees about the instant. The frontier must carry the
    // proof's instant, and nothing traceable to the file.
    const r = capture(root, gh.dir, [
      "--frozen-main-sha", FROZEN,
      "--quiescence", receiptFile(root, { checked_at: "2020-01-01T00:00:00Z" }),
    ]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.out.quiescence_checked_at).not.toBe("2020-01-01T00:00:00Z");
    expect(r.out.quiescence_checked_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(r.out.write_capable_workflows).toEqual(FROZEN_SET);
    expect(r.out.active_write_runs).toEqual([]);
    expect(r.stderr).toMatch(/agrees with the fresh proof; it contributes no field to the frontier/);

    // The same capture WITHOUT the receipt produces the same evidence fields and
    // the same lanes: the receipt is inert.
    const bareRoot = makeRoot();
    const bare = capture(bareRoot, makeGh(bareRoot, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } }).dir, [
      "--frozen-main-sha", FROZEN,
    ]);
    expect(bare.status, bare.stderr).toBe(0);
    expect(bare.out.write_capable_workflows).toEqual(r.out.write_capable_workflows);
    expect(bare.out.active_write_runs).toEqual(r.out.active_write_runs);
    expect(bare.out.lanes).toEqual(r.out.lanes);
  });

  it("Q3-T2: a receipt claiming nothing in flight cannot survive a fresh scan that sees a queued run", () => {
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [runPages(ONE_COMPLETED, ONE_QUEUED)] } });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN, "--quiescence", receiptFile(root)]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/refused: not-quiescent/);
    expect(r.stderr).toContain(`${WRITER_PATH} run 4002 (queued`);
    expect(r.stderr).toMatch(/do NOT cancel them/);
    expect(r.stdout).toBe("");
    expect(gh.writes()).toEqual([]);
  });

  it("Q3-T3: a receipt whose workflow set differs from the frozen tree's REFUSES", () => {
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    // The receipt lists THIS CHECKOUT's write-capable set — exactly what a
    // document produced by the old, CWD-derived verifier would contain.
    const r = capture(root, gh.dir, [
      "--frozen-main-sha", FROZEN,
      "--quiescence", receiptFile(root, { write_capable_workflows: [...LOCAL_SET] }),
    ]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/quiescence-receipt-mismatch/);
    expect(r.stderr).toMatch(/the receipt was not gathered from this revision's tree/);
    expect(r.stdout).toBe("");
  });

  it("a receipt for another repository, another revision, or a later instant REFUSES", () => {
    const mk = () => {
      const root = makeRoot();
      return { root, gh: makeGh(root, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } }) };
    };

    const a = mk();
    const foreign = capture(a.root, a.gh.dir, [
      "--frozen-main-sha", FROZEN,
      "--quiescence", receiptFile(a.root, { repository: "someone/else" }),
    ]);
    expect(foreign.status).toBe(1);
    expect(foreign.stderr).toMatch(/quiescence-receipt-mismatch: --quiescence describes someone\/else/);

    const b = mk();
    const otherRev = capture(b.root, b.gh.dir, [
      "--frozen-main-sha", FROZEN,
      "--quiescence", receiptFile(b.root, { frozen_main_sha: MOVED }),
    ]);
    expect(otherRev.status).toBe(1);
    expect(otherRev.stderr).toMatch(/the receipt describes a different revision/);

    // A receipt cannot postdate the proof that supersedes it.
    const c = mk();
    const future = capture(c.root, c.gh.dir, [
      "--frozen-main-sha", FROZEN,
      "--quiescence", receiptFile(c.root, { checked_at: "2099-01-01T00:00:00Z" }),
    ]);
    expect(future.status).toBe(1);
    expect(future.stderr).toMatch(/a receipt cannot postdate the proof that supersedes it/);
  });

  it("a receipt that its own validator refuses is refused BEFORE any read", () => {
    const root = makeRoot();
    const gh = makeGh(root);
    // `active_write_runs` non-empty is a valid OBSERVATION and an inadmissible
    // document: the shape rules alone reject it.
    const r = capture(root, gh.dir, [
      "--frozen-main-sha", FROZEN,
      "--quiescence", receiptFile(root, {
        active_write_runs: [{ workflow: WRITER_PATH, run_id: 7, status: "queued", created_at: "2026-08-14T11:58:00Z" }],
      }),
    ]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/--quiescence refused by its own validator/);
    expect(r.stderr).toMatch(/do not cancel them/);
    expect(gh.reads()).toEqual([]);
  });
});

// =============================================================================
// Q3-T4 / Q3-T5 (J) — the workflow universe comes from the frozen commit
// =============================================================================
describe("Q3-T4/T5 — the write-capable set is derived from the frozen commit's bytes", () => {
  it("Q3-T4: a planted write-capable workflow in the CALLER'S CWD has zero effect", () => {
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    // `capture()` always runs from a synthetic checkout whose .github/workflows
    // holds a planted file invoking the write executor. If the derivation still
    // read the working directory, `evil.yml` would appear here.
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.out.write_capable_workflows).toEqual(FROZEN_SET);
    expect(JSON.stringify(r.out)).not.toContain("evil.yml");
    // Nor did the REAL checkout leak in: its four write-capable workflows are
    // absent, which is the inverted half of the same proof — the set is not merely
    // "not the planted CWD", it is specifically the frozen commit's.
    for (const path of LOCAL_SET) expect(r.out.write_capable_workflows).not.toContain(path);

    // The verifier CLI, run from its own synthetic checkout, agrees.
    const vRoot = makeRoot();
    const verified = runCli(
      VERIFY_CLI,
      ["--repo", REPO, "--frozen-main-sha", FROZEN],
      makeGh(vRoot, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } }).dir,
      syntheticCheckout(vRoot),
    );
    expect(verified.status, verified.stderr).toBe(0);
    expect(verified.out.write_capable_workflows).toEqual(FROZEN_SET);
  });

  it("Q3-T5: change the bytes at the frozen commit and the derived set changes with them", () => {
    // Same CWD, same revision NAME, different committed tree. Only a derivation
    // that actually reads the tree can produce two different answers.
    const root = makeRoot();
    const gh = makeGh(root, {
      trees: {
        [FROZEN]: [...FROZEN_TREE, { name: "gamma-writer.yaml", text: WRITER_YAML.replace("alpha", "gamma") }],
      },
      runs: { "alpha-writer.yml": [ONE_COMPLETED], "gamma-writer.yaml": [NO_RUNS] },
    });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.out.write_capable_workflows).toEqual([
      `${WORKFLOW_DIR}/alpha-writer.yml`,
      `${WORKFLOW_DIR}/gamma-writer.yaml`,
    ]);
    // `.yaml` is enumerated as well as `.yml`, and BOTH write-capable workflows
    // were scanned — an unenumerated workflow is an unscanned write path.
    const runReads = gh.reads().filter((l) => l.includes("/actions/workflows/"));
    expect(runReads.filter((l) => l.includes("alpha-writer.yml/runs"))).toHaveLength(4);
    expect(runReads.filter((l) => l.includes("gamma-writer.yaml/runs"))).toHaveLength(4);
  });

  it("every workflow read is bound to the frozen revision, and never to a branch", () => {
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    expect(capture(root, gh.dir, ["--frozen-main-sha", FROZEN]).status).toBe(0);
    const treeReads = gh.reads().filter((l) => l.includes(`/contents/${WORKFLOW_DIR}`));
    // Two proofs × (one listing + two files).
    expect(treeReads).toHaveLength(6);
    for (const line of treeReads) expect(line).toContain(`?ref=${FROZEN}`);
    expect(treeReads.filter((l) => l.includes(`/contents/${WORKFLOW_DIR}?ref=`))).toHaveLength(2);
    // The policy is read at the same exact revision, once per proof.
    const policyReads = gh.reads().filter((l) => l.includes("automation-policy.json"));
    expect(policyReads).toHaveLength(2);
    for (const line of policyReads) expect(line).toContain(`?ref=${FROZEN}`);
    expect(gh.reads().join("\n")).not.toMatch(/ref=main|ref=HEAD/);
  });

  it("a file response that is not the blob the frozen tree listed REFUSES", () => {
    const root = makeRoot();
    // The listing reports the blob id of the real bytes; the file response returns
    // DIFFERENT bytes (with their own, honest, blob id). Without the binding this
    // would be "some revision's copy of that path".
    const gh = makeGh(root, {
      fileRaw: {
        [`${FROZEN}/alpha-writer.yml`]: workflowFileResponse(
          "alpha-writer.yml",
          WRITER_YAML.replace("execute-write-plan.mjs", "collect-lane-evidence.mjs"),
        ),
      },
      runs: { "alpha-writer.yml": [ONE_COMPLETED] },
    });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/committed-file-unreadable/);
    expect(r.stderr).toMatch(/is not the [0-9a-f]{40} the frozen tree listed/);
    expect(r.stderr).toMatch(/these are not the bytes committed at that revision/);
    expect(r.stdout).toBe("");
  });

  it("an incomplete, ambiguous, or unenumerable listing REFUSES rather than deriving a subset", () => {
    const listing = JSON.parse(workflowDirectoryResponse(FROZEN_TREE));
    const cases: Array<{ label: string; raw: string; reason: RegExp }> = [
      {
        label: "not an array",
        raw: JSON.stringify({ type: "dir", path: WORKFLOW_DIR }),
        reason: /workflow-directory-unreadable[\s\S]*response is not a JSON array/,
      },
      {
        label: "a subdirectory could hide workflow bytes",
        raw: workflowDirectoryResponse(FROZEN_TREE, [
          { type: "dir", name: "nested", path: `${WORKFLOW_DIR}/nested`, sha: "a".repeat(40), size: 0 },
        ]),
        reason: /only plain files are enumerable/,
      },
      {
        label: "the same path listed twice",
        raw: JSON.stringify([...listing, listing[0]]),
        reason: /is listed twice/,
      },
      {
        label: "at the contents API's silent truncation limit",
        raw: JSON.stringify(
          Array.from({ length: 1000 }, (_, i) => ({
            type: "file",
            name: `w${i}.yml`,
            path: `${WORKFLOW_DIR}/w${i}.yml`,
            sha: "b".repeat(40),
            size: 1,
          })),
        ),
        reason: /workflow-directory-truncated/,
      },
      {
        label: "a YAML name this protocol cannot address",
        raw: workflowDirectoryResponse([], [
          { type: "file", name: "we ird.yml", path: `${WORKFLOW_DIR}/we ird.yml`, sha: "c".repeat(40), size: 1 },
        ]),
        reason: /cannot address safely; refusing rather than omitting it/,
      },
      {
        label: "a listing with no write-capable workflow at all",
        raw: workflowDirectoryResponse([{ name: "beta-reader.yml", text: READER_YAML }]),
        reason: /workflow-scan-empty/,
      },
    ];
    for (const c of cases) {
      const root = makeRoot();
      const gh = makeGh(root, { treeRaw: { [FROZEN]: c.raw }, runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
      const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
      expect(r.status, `${c.label}: ${r.stderr}`).toBe(1);
      expect(r.stderr, c.label).toMatch(c.reason);
      expect(r.stdout, c.label).toBe("");
      expect(gh.writes(), c.label).toEqual([]);
    }
  });

  it("Q3-T6 live: duplicate run pages from the API refuse the whole capture", () => {
    const page = runPage([apiRun(4001, "completed")], 2);
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [runPages(page, page)] } });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/run-pages-duplicate/);
    expect(r.stderr).toMatch(/scan 1: /);
    expect(r.stdout).toBe("");
    expect(gh.writes()).toEqual([]);
  });
});

// =============================================================================
// Q3-T9 / Q3-T10 (M, N) — quiescence and main identity are rechecked AROUND the
// lane reads, in the capture's own authority path
// =============================================================================
describe("Q3-T9/T10 — the capture brackets its own lane reads", () => {
  it("Q3-T9: a queued run that appears DURING the lane reads is caught by proof 2", () => {
    // Run reads 1-2 are proof 1's two scans (clean); reads 3+ are proof 2's, made
    // after every lane comment has been fetched, and by then a run is queued.
    const root = makeRoot();
    const gh = makeGh(root, {
      runs: { "alpha-writer.yml": [ONE_COMPLETED, ONE_COMPLETED, runPages(ONE_COMPLETED, ONE_QUEUED)] },
    });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status).toBe(1);
    // Proof 1 succeeded; the refusal is proof 2's.
    expect(r.stderr).toMatch(/quiescence proof 1 \(pre-capture\): quiescent at/);
    expect(r.stderr).toMatch(/quiescence proof 2 \(post-capture\) refused: not-quiescent/);
    expect(r.stderr).toContain("run 4002 (queued");
    // The lanes WERE read — this is precisely the window a single pre-check misses.
    expect(gh.reads().filter((l) => l.includes("/comments"))).toHaveLength(3);
    expect(r.stdout).toBe("");
    expect(gh.writes()).toEqual([]);
  });

  it("Q3-T10: main moving during the lane reads refuses, and no frontier is emitted", () => {
    // Proof 1 makes ref reads 1-3. Swapping after the third means proof 2's very
    // first identity check — main must still BE the frozen revision — fails.
    const root = makeRoot();
    const gh = makeGh(root, {
      nextMainSha: MOVED,
      swapAfterRefReads: 3,
      policies: { [FROZEN]: FROZEN_POLICY_TEXT, [MOVED]: LIVE_POLICY_TEXT },
      trees: { [FROZEN]: FROZEN_TREE, [MOVED]: FROZEN_TREE },
      runs: { "alpha-writer.yml": [ONE_COMPLETED] },
    });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/quiescence proof 2 \(post-capture\) refused: main-moved/);
    expect(r.stderr).toContain("before the quiescence proof");
    expect(r.stderr).toContain(`current main is ${MOVED}, not the frozen ${FROZEN}`);
    expect(r.stderr).toMatch(/re-verify quiescence at the new revision and start again/);
    // The lane reads had already happened, which is the point: a merge landing
    // mid-capture means the reads spanned two repository states.
    expect(gh.reads().filter((l) => l.includes("/comments"))).toHaveLength(3);
    expect(r.stdout).toBe("");
    expect(gh.writes()).toEqual([]);
  });

  it("main moving between the two scans of a single proof refuses too", () => {
    const root = makeRoot();
    const gh = makeGh(root, {
      nextMainSha: MOVED,
      swapAfterRefReads: 1,
      policies: { [FROZEN]: FROZEN_POLICY_TEXT, [MOVED]: LIVE_POLICY_TEXT },
      runs: { "alpha-writer.yml": [ONE_COMPLETED] },
    });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/quiescence proof 1 \(pre-capture\) refused: main-moved/);
    expect(r.stderr).toContain("between the two run scans");
    expect(r.stdout).toBe("");
  });

  it("each proof re-reads the committed policy itself: the freeze is never assumed", () => {
    // The freeze is not a fact the capture carries forward from a caller's
    // assertion, nor one it establishes once and keeps. It is read, at the frozen
    // revision, in the capture's own authority path — twice, once per proof — and
    // main's identity is required three times within each.
    const frozenRoot = makeRoot();
    const frozen = makeGh(frozenRoot, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    expect(capture(frozenRoot, frozen.dir, ["--frozen-main-sha", FROZEN]).status).toBe(0);
    expect(frozen.reads().filter((l) => l.includes("automation-policy.json"))).toHaveLength(2);
    expect(frozen.reads().filter((l) => l.endsWith("/git/ref/heads/main"))).toHaveLength(6);

    // An un-frozen policy at that revision refuses regardless of what any document
    // says about it, and before any run is scanned.
    const liveRoot = makeRoot();
    const live = makeGh(liveRoot, {
      policies: { [FROZEN]: LIVE_POLICY_TEXT },
      runs: { "alpha-writer.yml": [ONE_COMPLETED] },
    });
    const r = capture(liveRoot, live.dir, ["--frozen-main-sha", FROZEN, "--quiescence", receiptFile(liveRoot)]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/refused: not-frozen/);
    expect(live.reads().filter((l) => l.includes("/actions/workflows/"))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// A staged copy of the libraries and the two operator CLIs, with asserted
// single-occurrence mutations applied to EXECUTABLE text — a comment naming a
// safeguard must never be what a mutation edits, or the mutant would still
// contain the safeguard it is supposed to have lost.
// ---------------------------------------------------------------------------

type Mutation = { file: string; from: string; to: string };

function stageTree(mutations: Mutation[]): { straylight: string; capture: string; verify: string } {
  const root = mkdtempSync(join(tmpdir(), "cp-quiescence-stage-"));
  mkdirSync(join(root, ".straylight"));
  for (const dir of ["lib", "bin", "schemas"]) {
    cpSync(join(".straylight", dir), join(root, ".straylight", dir), { recursive: true });
  }
  mkdirSync(join(root, "scripts"));
  for (const cli of ["capture-durable-frontier.mjs", "verify-frozen-quiescence.mjs"]) {
    cpSync(join("scripts", cli), join(root, "scripts", cli));
  }
  for (const m of mutations) {
    const path = join(root, m.file);
    const src = readFileSync(path, "utf8");
    const executable = src.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(src.split(m.from).length - 1, `${m.file}: mutation target must occur exactly once`).toBe(1);
    expect(executable.split(m.from).length - 1, `${m.file}: target must be executable text`).toBe(1);
    const next = src.split(m.from).join(m.to);
    expect(next, `${m.file}: mutation must change the source`).not.toBe(src);
    writeFileSync(path, next);
  }
  return {
    straylight: join(root, ".straylight"),
    capture: join(root, "scripts/capture-durable-frontier.mjs"),
    verify: join(root, "scripts/verify-frozen-quiescence.mjs"),
  };
}

// =============================================================================
// R — the repairs are LOAD-BEARING
//
// A test that passes because the code happens to refuse for some other reason is
// not a regression test. Each mutation below restores exactly one of the three
// defects in a staged copy of the tree and asserts the corresponding attack
// SUCCEEDS there — so the tests above pass for their stated reasons.
// =============================================================================
describe("R — mutation proofs: the fresh proof, the duplicate refusal, and the tree binding", () => {
  it("the UNMUTATED staged tree behaves exactly like the real one", () => {
    const staged = stageTree([]);
    const attackRoot = makeRoot();
    const attack = makeGh(attackRoot, { policies: { [FROZEN]: LIVE_POLICY_TEXT } });
    const refused = capture(
      attackRoot,
      attack.dir,
      ["--frozen-main-sha", FROZEN, "--quiescence", receiptFile(attackRoot)],
      staged.capture,
    );
    expect(refused.status).toBe(1);
    expect(refused.stderr).toMatch(/refused: not-frozen/);

    const okRoot = makeRoot();
    const ok = makeGh(okRoot, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    const emitted = capture(okRoot, ok.dir, ["--frozen-main-sha", FROZEN], staged.capture);
    expect(emitted.status, emitted.stderr).toBe(0);
    expect(emitted.out.write_capable_workflows).toEqual(FROZEN_SET);
  });

  it("M-Q1: without the fresh live proof, the handwritten document licenses the capture again", () => {
    // Restores the HIGH defect precisely: the supplied document becomes the proof,
    // so its fields become the frontier's. Everything else — shape validation,
    // repository binding, frozen-SHA binding, the receipt comparison, both proof
    // call sites — stays exactly as it is, which is the point: all of those checks
    // were present when Codex broke it.
    const staged = stageTree([
      {
        file: "scripts/capture-durable-frontier.mjs",
        from: "    receipt = validated.value;",
        to: "    receipt = validated.value;\n    globalThis.__MUTANT_RECEIPT = validated.value;",
      },
      {
        file: "scripts/capture-durable-frontier.mjs",
        from: "  const proof = proveFrozenQuiescence({",
        to:
          "  const proof = globalThis.__MUTANT_RECEIPT !== undefined\n" +
          "    ? { ok: true, value: globalThis.__MUTANT_RECEIPT, scans: { first: 0, second: 0 } }\n" +
          "    : proveFrozenQuiescence({",
      },
    ]);
    const root = makeRoot();
    const gh = makeGh(root, { policies: { [FROZEN]: LIVE_POLICY_TEXT } });
    const r = capture(
      root,
      gh.dir,
      ["--frozen-main-sha", FROZEN, "--quiescence", receiptFile(root)],
      staged.capture,
    );
    // The mutant ACCEPTS what the real tool refuses: a frontier against a main
    // whose committed policy permits writes, on the word of a handwritten file.
    expect(r.status, r.stderr).toBe(0);
    expect(r.out.frozen_main_sha).toBe(FROZEN);
    expect(r.out.quiescence_checked_at).toBe("2026-08-14T11:59:00Z"); // the FILE's instant
    expect(r.out.write_capable_workflows).toEqual(FROZEN_SET); // the FILE's list
    // It never looked at the committed policy, the workflow tree, or the runs — the
    // three things the document was standing in for.
    expect(gh.reads().filter((l) => l.includes("automation-policy.json"))).toEqual([]);
    expect(gh.reads().filter((l) => l.includes(`/contents/${WORKFLOW_DIR}`))).toEqual([]);
    expect(gh.reads().filter((l) => l.includes("/actions/workflows/"))).toEqual([]);
    // Which is exactly what the Q3-T1 regression above asserts cannot happen.
  });

  it("M-Q2: without the duplicate refusal and unique counting, a repeat pays for an omission", () => {
    // The four mutations restore the pre-repair implementation verbatim: no
    // already-seen check, and `scanned` counting ENTRIES rather than unique ids.
    const staged = stageTree([
      {
        file: ".straylight/lib/frozen-quiescence.mjs",
        from: "  const seen = new Map();",
        to: "  const seen = new Map();\n  let collected = 0;",
      },
      {
        file: ".straylight/lib/frozen-quiescence.mjs",
        from: "      const previous = seen.get(run.id);",
        to: "      const previous = undefined;",
      },
      {
        file: ".straylight/lib/frozen-quiescence.mjs",
        from: "      seen.set(run.id, { at, status: run.status, created_at: run.created_at });",
        to: "      collected += 1;\n      seen.set(run.id, { at, status: run.status, created_at: run.created_at });",
      },
      {
        file: ".straylight/lib/frozen-quiescence.mjs",
        from: "  const scanned = seen.size;",
        to: "  const scanned = collected;",
      },
    ]);
    // total_count: 2, two identical pages holding one completed run, and a queued
    // run 4002 that the pagination never returns. The mutant counts two entries,
    // satisfies the completeness bound, and reports quiescence over a history in
    // which it never saw the second run at all.
    const page = runPage([apiRun(4001, "completed")], 2);
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [runPages(page, page)] } });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN], staged.capture);
    expect(r.status, r.stderr).toBe(0);
    expect(r.out.active_write_runs).toEqual([]);

    // The real tool refuses the identical response stream.
    const realRoot = makeRoot();
    const realGh = makeGh(realRoot, { runs: { "alpha-writer.yml": [runPages(page, page)] } });
    const real = capture(realRoot, realGh.dir, ["--frozen-main-sha", FROZEN]);
    expect(real.status).toBe(1);
    expect(real.stderr).toMatch(/run-pages-duplicate/);
  });

  it("M-Q3: without the exact-commit derivation, the CALLER'S CWD decides the set", () => {
    // Restores the MEDIUM defect: read `.github/workflows` off the local disk. The
    // early return leaves the real derivation below it unreachable rather than
    // deleted, so the mutation is exactly "consult the CWD instead". Run from a
    // synthetic checkout holding one planted write-capable file, the mutant reports
    // THAT — proving the real tool's answer came from GitHub and not from a
    // checkout that happened to agree.
    const staged = stageTree([
      {
        file: ".straylight/lib/live-quiescence.mjs",
        from: 'import { parseSingleDocument } from "./evidence.mjs";',
        to:
          'import { readdirSync, readFileSync } from "node:fs";\n' +
          'import { parseSingleDocument } from "./evidence.mjs";',
      },
      {
        file: ".straylight/lib/live-quiescence.mjs",
        from: "  const listing = fetchText(read, workflowDirectoryReadPath(repository, commit_sha));",
        to:
          '  const localDir = ".github/workflows";\n' +
          "  const localFiles = readdirSync(localDir)\n" +
          '    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))\n' +
          '    .map((f) => ({ path: `${localDir}/${f}`, text: readFileSync(`${localDir}/${f}`, "utf8") }));\n' +
          "  const localDerived = writeCapableWorkflows(localFiles);\n" +
          "  if (!localDerived.ok) return refuse(localDerived.reason, localDerived.detail);\n" +
          "  return { ok: true, workflows: localDerived.workflows, enumerated: localFiles.map((f) => f.path) };\n" +
          "  const listing = fetchText(read, workflowDirectoryReadPath(repository, commit_sha));",
      },
    ]);
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "evil.yml": [PLANTED_COMPLETED] } });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN], staged.capture);
    expect(r.status, r.stderr).toBe(0);
    // The frontier now records the PLANTED workflow, and not the frozen commit's.
    expect(r.out.write_capable_workflows).toEqual([PLANTED]);
    expect(r.out.write_capable_workflows).not.toEqual(FROZEN_SET);
    // And it never read the frozen commit's workflow tree at all.
    expect(gh.reads().filter((l) => l.includes(`/contents/${WORKFLOW_DIR}`))).toEqual([]);
  });
});

// =============================================================================
// S — the future 48-hour procedure, on a MACHINE-PROVED frontier
//
// The H-01 suite proves the four-transition procedure (A freeze → capture →
// append → re-enable) over a frontier assembled from the committed lane fixtures
// with its quiescence block supplied as an argument — correct there, because the
// transition guard is pure and the frontier is its input.
//
// This is the other half, and it is the half Codex's HIGH finding was about:
// the frontier that authorizes the append is one the capture PROVED, against
// GitHub, at the frozen revision — not one anybody wrote down. State B here is
// the real committed policy with the kill switch flipped, which is exactly the
// policy the proof reads at the frozen commit, so the freeze the append relies on
// is the same freeze the machine established.
//
// NOTHING HERE ACTIVATES THE 48-HOUR LEASE. epoch-002 and its lock exist only in
// a staged copy of the tree; the last test re-reads the real files to prove it.
// =============================================================================
describe("S — the 48-hour procedure authorized by a frontier the capture proved", () => {
  /** STATE B: the real committed policy, frozen. What the mock serves at FROZEN. */
  function stateB(): any {
    const parsed = parseStrict(FROZEN_POLICY_TEXT);
    expect(parsed.ok, "the frozen policy text must parse strictly").toBe(true);
    const p = structuredClone((parsed as any).value);
    expect(p.enabled).toBe(false);
    expect(p.admission_history).toHaveLength(1);
    expect(p.admission_history[0].epoch_id).toBe("epoch-001");
    return p;
  }

  /** STATE C: B plus one appended 2880-minute epoch, still frozen. The epoch
   * COMMITS the canonical digest of the frontier that authorizes it (M-01). */
  function stateC(governs_from: string, frontier_digest: string): any {
    const c = stateB();
    const base = structuredClone(c.admission_history[0]);
    c.admission_history.push({
      epoch_id: "epoch-002",
      governs_from,
      authorized_corridor: base.authorized_corridor,
      maximum_patch_cycles: base.maximum_patch_cycles,
      actor_allowlist: base.actor_allowlist,
      lease_duration_minutes: 2880,
      provenance: {
        attributed_to: "test-fixture",
        reference: "hypothetical successor epoch; NOT committed, NOT locked",
      },
      transition_evidence: { frontier_digest },
    });
    for (const f of ADMISSION_FIELDS) c[f] = structuredClone(c.admission_history[1][f]);
    return c;
  }

  /** The digest an appended epoch must commit for a given frontier — derived by
   * the same validator the transition guard uses, so the two cannot disagree. */
  function digestOf(frontier: any): string {
    const v = validateDurableFrontier(frontier);
    expect(v.ok, v.ok ? "" : (v as any).errors.join("; ")).toBe(true);
    return (v as any).value.frontier_digest;
  }

  /** The real transition CLI, out of a staged tree, over an explicit frontier. */
  function runTransition(
    straylight: string,
    previous: any,
    candidate: any,
    evidence: { frontier?: any; repository?: string; expected_frozen_main_sha?: string } | null = null,
  ): { status: number; out: any } {
    const dir = mkdtempSync(join(tmpdir(), "cp-quiescence-transition-"));
    const write = (name: string, value: any) => {
      const p = join(dir, name);
      writeFileSync(p, JSON.stringify(value, null, 2) + "\n");
      return p;
    };
    const args = ["--previous", write("prev.json", previous), "--candidate", write("cand.json", candidate)];
    if (evidence?.frontier !== undefined) args.push("--frontier", write("frontier.json", evidence.frontier));
    if (evidence?.repository !== undefined) args.push("--repository", evidence.repository);
    if (evidence?.expected_frozen_main_sha !== undefined) {
      args.push("--expect-frozen-main-sha", evidence.expected_frozen_main_sha);
    }
    const r = spawnSync(process.execPath, [join(straylight, "bin", "policy-transition-check.mjs"), ...args], {
      encoding: "utf8",
    });
    const stdout = (r.stdout ?? "").trim();
    return { status: r.status ?? -1, out: JSON.parse(stdout.length > 0 ? stdout : "{}") };
  }

  /** Capture a frontier the honest way: the fresh live proof, against the mock. */
  function provedFrontier(cli = CAPTURE_CLI): any {
    const root = makeRoot();
    const gh = makeGh(root, { runs: { "alpha-writer.yml": [ONE_COMPLETED] } });
    const r = capture(root, gh.dir, ["--frozen-main-sha", FROZEN], cli);
    expect(r.status, r.stderr).toBe(0);
    expect(gh.writes()).toEqual([]);
    // It is the proof's own evidence, at the frozen revision, and it validates.
    expect(r.out.frozen_main_sha).toBe(FROZEN);
    expect(r.out.write_capable_workflows).toEqual(FROZEN_SET);
    expect(r.out.active_write_runs).toEqual([]);
    const v = validateDurableFrontier(r.out);
    expect(v.ok, v.ok ? "" : (v as any).errors.join("; ")).toBe(true);
    return r.out;
  }

  it("B → C is accepted on the proved frontier, and C → D re-enables", () => {
    const frontier = provedFrontier();
    // The append's boundary must be strictly after the frontier the proof reported.
    expect(frontier.max_event_created_at).toBe(MAX_EVENT_AT);
    const afterFrontier = "2026-08-13T04:55:43Z";
    const candidate = stateC(afterFrontier, digestOf(frontier));

    // A real 48-hour change would append its digest lock in the same reviewed
    // protocol-code diff; the staged tree is where that hypothetical lock lives.
    const digest = admissionEpochDigest(candidate.admission_history[1]);
    const staged = stageTree([{
      file: ".straylight/lib/admission-locks.mjs",
      from: "  }),\n]);",
      to: `  }),\n  Object.freeze({ epoch_id: "epoch-002", digest: ${JSON.stringify(digest)} }),\n]);`,
    }]);

    const bc = runTransition(staged.straylight, stateB(), candidate, {
      frontier,
      repository: REPO,
      expected_frozen_main_sha: FROZEN,
    });
    expect(bc.status, JSON.stringify(bc.out)).toBe(0);
    expect(bc.out.kind).toBe("v2-append");
    expect(bc.out.appended).toEqual(["epoch-002"]);
    // Every quiescence field the guard reports traces to the fresh proof.
    expect(bc.out.frontier).toEqual({
      repository: REPO,
      frozen_main_sha: FROZEN,
      captured_at: frontier.captured_at,
      quiescence_checked_at: frontier.quiescence_checked_at,
      write_capable_workflows: FROZEN_SET,
      lanes: 3,
      events: 6,
      max_event_created_at: MAX_EVENT_AT,
      frontier_digest: digestOf(frontier),
      appended_governs_from: afterFrontier,
    });
    expect(bc.out.candidate_current_admission.lease_duration_minutes).toBe(2880);
    expect(bc.out.previous_current_admission.lease_duration_minutes).toBe(240);

    // C → D re-enables automation and needs no evidence at all.
    const stateD = { ...candidate, enabled: true };
    const cd = runTransition(staged.straylight, candidate, stateD);
    expect(cd.status, JSON.stringify(cd.out)).toBe(0);
    expect(cd.out.kind).toBe("v2-live");
    expect(cd.out.appended).toEqual([]);
    expect(cd.out.frontier).toBeNull();
  });

  it("the proved frontier is LOAD-BEARING: at its instant, or from another revision, the append refuses", () => {
    const frontier = provedFrontier();
    const at = stateC(MAX_EVENT_AT, digestOf(frontier));
    const digest = admissionEpochDigest(at.admission_history[1]);
    const staged = stageTree([{
      file: ".straylight/lib/admission-locks.mjs",
      from: "  }),\n]);",
      to: `  }),\n  Object.freeze({ epoch_id: "epoch-002", digest: ${JSON.stringify(digest)} }),\n]);`,
    }]);

    // A boundary AT the proved frontier already has an event under it.
    const boundary = runTransition(staged.straylight, stateB(), at, {
      frontier, repository: REPO, expected_frozen_main_sha: FROZEN,
    });
    expect(boundary.status).toBe(2);
    expect(JSON.stringify(boundary.out.errors)).toMatch(/not strictly after the durable event frontier/);
    expect(JSON.stringify(boundary.out.errors)).toMatch(/6 protocol event\(s\) across 3 lane\(s\)/);

    // And the operator must name the revision the proof was performed at.
    const afterFrontier = "2026-08-13T04:55:43Z";
    const good = stateC(afterFrontier, digestOf(frontier));
    const staged2 = stageTree([{
      file: ".straylight/lib/admission-locks.mjs",
      from: "  }),\n]);",
      to:
        `  }),\n  Object.freeze({ epoch_id: "epoch-002", digest: ` +
        `${JSON.stringify(admissionEpochDigest(good.admission_history[1]))} }),\n]);`,
    }]);
    const wrongRevision = runTransition(staged2.straylight, stateB(), good, {
      frontier, repository: REPO, expected_frozen_main_sha: MOVED,
    });
    expect(wrongRevision.status).toBe(2);
    expect(JSON.stringify(wrongRevision.out.errors)).toMatch(/frozen_main_sha/);
  });

  it("a frontier from the M-Q1 mutant would authorize the SAME append — which is why the proof must be the capture's", () => {
    // The consequence of the HIGH finding, stated end to end: under the mutant the
    // operator's own handwritten document produces a frontier that the append gate
    // accepts, against a main whose committed policy still PERMITS writes. The gate
    // is not wrong to accept it — a pure guard can only judge the document it is
    // given. Provenance is the only thing standing between a handwritten file and a
    // policy boundary, which is why it belongs in the capture.
    const staged = stageTree([
      {
        file: "scripts/capture-durable-frontier.mjs",
        from: "    receipt = validated.value;",
        to: "    receipt = validated.value;\n    globalThis.__MUTANT_RECEIPT = validated.value;",
      },
      {
        file: "scripts/capture-durable-frontier.mjs",
        from: "  const proof = proveFrozenQuiescence({",
        to:
          "  const proof = globalThis.__MUTANT_RECEIPT !== undefined\n" +
          "    ? { ok: true, value: globalThis.__MUTANT_RECEIPT, scans: { first: 0, second: 0 } }\n" +
          "    : proveFrozenQuiescence({",
      },
    ]);
    const root = makeRoot();
    // Automation ENABLED at the frozen revision: no freeze exists at all.
    const gh = makeGh(root, { policies: { [FROZEN]: LIVE_POLICY_TEXT } });
    const forged = capture(
      root,
      gh.dir,
      ["--frozen-main-sha", FROZEN, "--quiescence", receiptFile(root)],
      staged.capture,
    );
    expect(forged.status, forged.stderr).toBe(0);

    const afterFrontier = "2026-08-13T04:55:43Z";
    // The epoch commits the FORGED document's digest: the pure gate cannot know
    // the document is handwritten, which is exactly this test's point.
    const candidate = stateC(afterFrontier, digestOf(forged.out));
    const locked = stageTree([{
      file: ".straylight/lib/admission-locks.mjs",
      from: "  }),\n]);",
      to:
        `  }),\n  Object.freeze({ epoch_id: "epoch-002", digest: ` +
        `${JSON.stringify(admissionEpochDigest(candidate.admission_history[1]))} }),\n]);`,
    }]);
    const bc = runTransition(locked.straylight, stateB(), candidate, {
      frontier: forged.out, repository: REPO, expected_frozen_main_sha: FROZEN,
    });
    expect(bc.status, JSON.stringify(bc.out)).toBe(0);
    expect(bc.out.kind).toBe("v2-append");
    // The forged evidence's instant is the FILE's, and it reached a policy boundary.
    expect(bc.out.frontier.quiescence_checked_at).toBe("2026-08-14T11:59:00Z");
    // The real capture refuses to produce that document at all — proved above in
    // Q3-T1, and this is what that refusal is protecting.
  });

  it("none of this touches the committed policy, the lock, or the shipped lease duration", () => {
    const parsed = parseStrict(readFileSync(".straylight/automation-policy.json", "utf8"));
    expect(parsed.ok).toBe(true);
    const p = (parsed as any).value;
    expect(p.enabled).toBe(true);
    expect(p.lease_duration_minutes).toBe(240);
    expect(p.admission_history).toHaveLength(1);
    expect(p.admission_history[0].epoch_id).toBe("epoch-001");
    expect(admissionEpochDigest(p.admission_history[0]))
      .toBe("sha256:0b0e84ea6ff3c60b71770785954cc99cfdf85c26e2ce2f9bec3380b943a1f5cc");
    expect(JSON.stringify(p)).not.toMatch(/2880|epoch-002/);
    expect(readFileSync(".straylight/lib/admission-locks.mjs", "utf8")).not.toMatch(/epoch-002/);
  });
});

// =============================================================================
// U — the documentation says what is proven and what is not
// =============================================================================
describe("U — provenance is documented where an operator will read it", () => {
  const source = (path: string) => readFileSync(path, "utf8");

  it("the capture states that the quiescence document is a receipt, not authority", () => {
    const src = source("scripts/capture-durable-frontier.mjs");
    expect(src).toMatch(/IS NOW OPTIONAL, AND IS A RECEIPT/);
    expect(src).toMatch(/A hand-written file can never cause this[\s\S]{0,40}tool to accept/);
    expect(src).toMatch(/runs the live proof ITSELF/);
    expect(src).toMatch(/COMMITTED AT THAT COMMIT \(never the local checkout\)/);
    // The honest limits stay stated, not claimed away.
    expect(src).toMatch(/Not a transactional snapshot/);
    expect(src).toMatch(/must[\s\S]{0,40}not write lane events during a cutover/);
  });

  it("the shared proof states the rule, and what it cannot prove", () => {
    const src = source(".straylight/lib/live-quiescence.mjs");
    expect(src).toMatch(/It can cause a REFUSAL; it can never cause an acceptance/);
    expect(src).toMatch(/Never the[\s\S]{0,60}local checkout, never the current branch, never two commits mixed/);
    expect(src).toMatch(/WHAT IT CANNOT PROVE/);
    expect(src).toMatch(/anything here cancel a run/);
  });

  it("the duplicate-run rule is explained where the counting happens", () => {
    const src = source(".straylight/lib/frozen-quiescence.mjs");
    expect(src).toMatch(/DUPLICATE RUN IDS ARE A REFUSAL, NOT A DEDUPLICATION/);
    expect(src).toMatch(/Silently deduplicating would[\s\S]{0,20}fix the arithmetic and keep the omission/);
  });

  it("the verifier points at the shared proof rather than restating it", () => {
    const src = source("scripts/verify-frozen-quiescence.mjs");
    expect(src).toMatch(/WHERE THE PROOF LIVES/);
    expect(src).toMatch(/THIS DOCUMENT IS A RECEIPT, NOT AN AUTHORITY/);
    expect(src).toMatch(/live-quiescence\.mjs/);
    expect(src).toMatch(/The local checkout is never consulted/);
  });
});
