// Control Plane v1 — direct regressions for the Codex ninth-round
// findings. One describe() block per finding; each reproduces the
// reported failure shape against the patched code.
//
//  I1  lane DISCOVERY depended on the derived cp-lane label: bootstrap
//      enumerated `issues?labels=cp-lane&state=all` and the watchdog
//      `issues?labels=cp-lane&state=open`, so removing (or never having
//      synced) the label let bootstrap create a DUPLICATE lane and made
//      an existing lane VANISH from recovery. Discovery is now
//      label-independent: both workflows enumerate ALL issues across all
//      pages and identify lane issues ONLY through the canonical marker
//      parser (the shared lane-scan.mjs adapter, --pages mode), which
//      flattens the raw --paginate page stream, excludes pull requests,
//      and fails closed (exit 2) on any read/flatten/parse problem.
//      cp-lane remains a derived convenience projection, never discovery
//      authority.
//
//  I2  a marker-bearing issue whose lane could not be reconstructed was
//      silently `continue`d past by the watchdog sweep — a malformed
//      genesis made the lane disappear as though it did not exist.
//      Unreadable and reconstruction-failed lane issues are now fed to
//      the scanner as validation-failing stubs, producing its supported
//      explicit `escalate-malformed-lane` finding mapped to the issue;
//      bootstrap continues to abort while any marker-bearing body is
//      unprovable.
//
//  I3  reads that GUARD writes ran as `gh api | grep -q` pipelines (or
//      `|| true`-swallowed calls): an API failure mid-stream — or grep
//      exiting on first match and SIGPIPE-ing gh — was indistinguishable
//      from "not found" and fell through to a duplicate write. The five
//      guarded reads (reducer confirmation dedupe, reducer result dedupe,
//      watchdog recovery dedupe, merge-guard result dedupe, reducer
//      current-label read) now materialize every page to a local file,
//      verify the API exit status, validate the JSON shape, and decide
//      found / not-found / error on the LOCAL file via jq exit codes
//      (0 / 1 / >1) — read or parse failure aborts the job and is never
//      converted into "not yet posted" or "no labels".

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scan } from "../../.straylight/lib/watchdog.mjs";
import { makeLane, makePolicy, NOW } from "./_fixtures.js";

const LANE_SCAN = ".straylight/bin/lane-scan.mjs";
const BOOTSTRAP = ".github/workflows/straylight-bootstrap.yml";
const WATCHDOG = ".github/workflows/straylight-watchdog.yml";
const REDUCER = ".github/workflows/straylight-reducer.yml";
const MERGE_GUARD = ".github/workflows/straylight-merge-guard.yml";

const tmp = mkdtempSync(join(tmpdir(), "cp-round9-"));
let n = 0;

function laneBody(overrides: Record<string, any> = {}, pretty = false) {
  const lane = makeLane(overrides);
  return `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(lane, null, pretty ? 2 : 0)}\n\`\`\``;
}

// Run lane-scan against a RAW page stream (the concatenated one-array-per-
// page output of `gh api --paginate`), exactly as the workflows feed it.
function scanPages(pagesText: string, mode: string[] = ["--lane-id", "lane-phase-49p"]) {
  const file = join(tmp, `pages-${n++}.json`);
  writeFileSync(file, pagesText);
  try {
    const stdout = execFileSync("node", [LANE_SCAN, "--pages", file, ...mode], { encoding: "utf8" });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    return { status: e.status ?? -1, out: e.stdout ? JSON.parse(e.stdout) : null };
  }
}

function pages(...pageArrays: unknown[][]) {
  // gh api --paginate concatenates page documents with no separator.
  return pageArrays.map((p) => JSON.stringify(p)).join("");
}

// Extract one named step's body from a workflow.
function step(src: string, name: string): string {
  const at = src.indexOf(`- name: ${name}`);
  expect(at, name).toBeGreaterThan(-1);
  const next = src.indexOf("- name:", at + 10);
  return src.slice(at, next === -1 ? undefined : next);
}

// =============================================================================
// I1 — discovery is label-independent, canonical, paginated, PR-excluding.
// =============================================================================
describe("I1 — lane discovery never depends on the derived cp-lane label", () => {
  const bootstrap = readFileSync(BOOTSTRAP, "utf8");
  const watchdog = readFileSync(WATCHDOG, "utf8");

  it("bootstrap enumerates ALL issues (open AND closed) with no label filter", () => {
    expect(bootstrap).toMatch(/gh api --paginate "repos\/\$\{REPO\}\/issues\?state=all&per_page=100"/);
    expect(bootstrap).not.toMatch(/issues\?[^"]*labels=/);
  });

  it("watchdog enumerates ALL open issues with no label filter", () => {
    expect(watchdog).toMatch(/gh api --paginate "repos\/\$\{REPO\}\/issues\?state=open&per_page=100"/);
    expect(watchdog).not.toMatch(/issues\?[^"]*labels=/);
  });

  it("both route the RAW page stream through the shared canonical parsers (planner/collector), never jq", () => {
    // Workflow-boundary redesign: bootstrap's detection lives in
    // plan-bootstrap-write.mjs; the watchdog's lives in
    // collect-watchdog-evidence.mjs — both consume the raw --paginate
    // stream through evidence.mjs + lane-target.mjs (strict parse, N1
    // uniqueness, PR exclusion, canonical marker parsing), all
    // fail-closed and proven executably in planner-adversarial /
    // collection / dual-collection suites.
    expect(bootstrap).toMatch(/node \.straylight\/bin\/plan-bootstrap-write\.mjs/);
    expect(bootstrap).toMatch(/--pages \/tmp\/issue-pages\.json/);
    expect(watchdog).toMatch(/node \.straylight\/bin\/collect-watchdog-evidence\.mjs --stage issue-slots/);
    // No workflow-side jq flattening of the page stream survives: the
    // shared parsers own flattening and fail closed on malformed pages.
    expect(bootstrap).not.toMatch(/jq -s '\[\.\[\]\[\] \| \{number/);
    expect(watchdog).not.toMatch(/-q '\.\[\]\.number'/);
  });

  it("the adapter finds a genesis with NO label information at all (labels are not even input)", () => {
    const r = scanPages(pages([{ number: 41, body: laneBody() }]));
    expect(r.status).toBe(0);
    expect(r.out.matches).toEqual([41]);
    // The scanner's contract has no label field anywhere.
    const src = readFileSync(LANE_SCAN, "utf8");
    const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(code).not.toMatch(/label/i);
  });

  it("--all-lanes lists every marker-bearing lane across MULTIPLE pages (unlabeled lanes cannot hide)", () => {
    const r = scanPages(
      pages(
        [{ number: 1, body: laneBody() }, { number: 2, body: "prose only" }],
        [{ number: 101, body: laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" }) }],
      ),
      ["--all-lanes"],
    );
    expect(r.status).toBe(0);
    expect(r.out.lanes).toEqual([
      { number: 1, lane_id: "lane-phase-49p" },
      { number: 101, lane_id: "lane-phase-49q" },
    ]);
  });

  it("bootstrap finds an existing Phase 49P genesis on a LATER page (duplicate still blocked)", () => {
    const r = scanPages(pages(
      [{ number: 1, body: "no lane here" }],
      [{ number: 202, body: laneBody() }],
    ));
    expect(r.out.matches).toEqual([202]);
  });

  it("pull requests with lane-like bodies are EXCLUDED (issues listing includes PRs)", () => {
    const r = scanPages(pages([
      { number: 7, body: laneBody(), pull_request: { url: "x" } },
      { number: 8, body: laneBody() },
    ]));
    expect(r.out.matches).toEqual([8]);
    expect(r.out.excluded_prs).toEqual([7]);
    // The legacy pre-flattened --input path excludes PRs too.
    const inputFile = join(tmp, `input-${n++}.json`);
    writeFileSync(inputFile, JSON.stringify([
      { number: 9, body: laneBody(), pull_request: { url: "x" } },
    ]));
    const legacy = JSON.parse(execFileSync("node", [LANE_SCAN, "--input", inputFile, "--lane-id", "lane-phase-49p"], { encoding: "utf8" }));
    expect(legacy.matches).toEqual([]);
    expect(legacy.excluded_prs).toEqual([9]);
  });

  it("compact AND pretty lane markers are found canonically via --pages", () => {
    const r = scanPages(pages(
      [{ number: 11, body: laneBody({}, false) }],
      [{ number: 12, body: `# heading\n\n${laneBody({}, true)}` }],
    ));
    expect(r.out.matches).toEqual([11, 12]);
    expect(r.out.unreadable).toEqual([]);
  });

  it("enumeration/flattening FAILS CLOSED: malformed page, junk between pages, non-array page, number-less entry", () => {
    // truncated JSON page
    expect(scanPages('[{"number": 1, "body": "x"}').status).toBe(2);
    // junk between two well-formed pages
    expect(scanPages('[]garbage[]').status).toBe(2);
    // a page that is an object, not an array
    expect(scanPages('{"message": "API rate limit exceeded"}').status).toBe(2);
    // an entry with no number
    expect(scanPages(pages([{ body: laneBody() }])).status).toBe(2);
    // an entry with a non-string non-null body
    expect(scanPages(pages([{ number: 3, body: 42 }])).status).toBe(2);
    // empty page stream (zero documents) is an enumeration failure, not zero lanes
    expect(scanPages("").status).toBe(2);
    // none of these ever print ok:true
    for (const bad of ['[{"number": 1', "[]junk[]", '{"a":1}']) {
      expect(scanPages(bad).out?.ok).not.toBe(true);
    }
  });

  it("cp-lane remains a derived convenience: bootstrap still creates it; reducer still syncs it; nothing discovers by it", () => {
    // Bootstrap's cp-lane creation now flows through the planner: label
    // evidence is fetched and the create-label-definition operation is
    // planned only when provably missing (proven executably in
    // planner-adversarial.test.ts). The workflow fetches label evidence
    // for that decision.
    expect(bootstrap).toMatch(/repos\/\$\{REPO\}\/labels\?per_page=100/);
    expect(bootstrap).toMatch(/--labels \/tmp\/label-pages\.json/);
    // The reducer still syncs derived labels — now as Stage B planner
    // output (deriveLabels projection vs parsed label evidence).
    const reducer = readFileSync(REDUCER, "utf8");
    expect(reducer).toMatch(/plan-reducer-writes\.mjs --stage b/);
    expect(reducer).toMatch(/labels\.pages/);
    // The reducer's per-issue trigger condition may reference the label
    // (an event-routing convenience) but no ENUMERATION does.
    for (const wf of [bootstrap, watchdog]) {
      expect(wf).not.toMatch(/issues\?[^"]*labels=cp-lane/);
    }
  });

  it("the shared adapter stays dependency-free, no-network, and routes through the canonical marker parser", () => {
    // The adapter delegates to the shared in-repo authorities (evidence.mjs
    // for the raw page stream, lane-target.mjs for genesis identification);
    // only node: built-ins and .straylight/lib modules may be imported.
    const src = readFileSync(LANE_SCAN, "utf8");
    const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1] ?? "");
    expect(imports.length).toBeGreaterThan(0);
    expect(imports.every((s) => s.startsWith("node:") || s.startsWith("../lib/"))).toBe(true);
    expect(src).not.toMatch(/fetch\(|https?:\/\/api\.github\.com/);
    // The canonical marker parser remains the ONLY genesis identification
    // path: the lane-target authority the adapter delegates to routes
    // through extractPayload(…, MARKERS.lane) — proven executably below by
    // a compact-but-valid genesis (whitespace-independent) and a
    // marker-bearing-but-unreadable body (fail closed, never a clean miss).
    const laneTarget = readFileSync(".straylight/lib/lane-target.mjs", "utf8");
    expect(laneTarget).toMatch(/extractPayload\(body, MARKERS\.lane\)/);
    const compact = scanPages(pages([{ number: 3, body: laneBody() }]));
    expect(compact.out.matches).toEqual([3]);
    const mangled = scanPages(pages([{ number: 4, body: "<!-- straylight:lane:v1 -->\n```json\n{ bad ]\n```" }]));
    expect(mangled.out.matches).toEqual([]);
    expect(mangled.out.unreadable).toEqual([{ number: 4, reason: "malformed-json" }]);
  });

  it("duplicate valid lane IDs are surfaced by the adapter for every writer to refuse (C1)", () => {
    // Two issues both parsing as genesis for the same lane_id make every
    // lane-addressed write ambiguous. The adapter reports the collision in
    // both modes; writers (bootstrap included) must refuse on it.
    const dup = scanPages(pages(
      [{ number: 21, body: laneBody() }],
      [{ number: 22, body: laneBody() }],
    ));
    expect(dup.status).toBe(0);
    expect(dup.out.matches).toEqual([21, 22]);
    expect(dup.out.duplicates).toEqual([{ lane_id: "lane-phase-49p", numbers: [21, 22] }]);
    const all = scanPages(pages([
      { number: 21, body: laneBody() },
      { number: 22, body: laneBody() },
    ]), ["--all-lanes"]);
    expect(all.out.duplicates).toEqual([{ lane_id: "lane-phase-49p", numbers: [21, 22] }]);
  });
});

// =============================================================================
// I2 — malformed lanes cannot disappear.
// =============================================================================
describe("I2 — a malformed / unreadable marker-bearing lane is visible, never skipped", () => {
  const bootstrap = readFileSync(BOOTSTRAP, "utf8");
  const watchdog = readFileSync(WATCHDOG, "utf8");

  it("an unparseable marker-bearing body is reported unreadable (with the issue number) — --pages path", () => {
    const r = scanPages(pages([
      { number: 13, body: "<!-- straylight:lane:v1 -->\n```json\n{ not json ]\n```" },
      { number: 14, body: laneBody() },
    ]));
    expect(r.status).toBe(0);
    expect(r.out.matches).toEqual([14]);
    expect(r.out.unreadable).toEqual([{ number: 13, reason: "malformed-json" }]);
  });

  it("a marker payload whose lane_id violates the canonical pattern is unreadable, not a clean miss", () => {
    const r = scanPages(pages([
      { number: 15, body: `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify({ lane_id: "lane-phase-49p " })}\n\`\`\`` },
      { number: 16, body: `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify({ lane_id: 42 })}\n\`\`\`` },
    ]));
    expect(r.out.matches).toEqual([]);
    expect(r.out.unreadable).toEqual([
      { number: 15, reason: "lane-id-malformed" },
      { number: 16, reason: "lane-id-missing" },
    ]);
  });

  it("bootstrap ABORTS while any marker-bearing body is unprovable (an unreadable genesis could BE the lane)", () => {
    // EXECUTABLE proof (replacing the retired YAML source pin): the
    // bootstrap planner exits 2 with lane-target-unreadable when any
    // marker-bearing body cannot be parsed — the absence proof is blocked
    // because the unreadable genesis could BE the lane in mangled form.
    const dir = mkdtempSync(join(tmpdir(), "cp-r9-boot-"));
    writeFileSync(join(dir, "pages.json"), JSON.stringify([{
      number: 9,
      url: "https://api.github.com/repos/0xHoneyJar/loa-straylight/issues/9",
      body: "<!-- straylight:lane:v1 -->\n```json\n{ not json ]\n```",
      created_at: "2026-07-16T11:00:00Z", updated_at: "2026-07-16T12:00:00Z",
    }]));
    writeFileSync(join(dir, "labels.json"), "[]");
    let status = 0, out: any = null;
    try {
      execFileSync("node", [
        ".straylight/bin/plan-bootstrap-write.mjs",
        "--pages", join(dir, "pages.json"), "--labels", join(dir, "labels.json"),
        "--base-sha", "009c4afe34f3f7151db4239fe1c69898833440bb",
        "--request-root", dir, "--repository", "0xHoneyJar/loa-straylight",
        "--nonce", "12345-1",
      ], { encoding: "utf8" });
    } catch (e: any) {
      status = e.status ?? -1;
      out = e.stdout ? JSON.parse(e.stdout) : null;
    }
    expect(status).toBe(2);
    expect(out.reason).toBe("lane-target-unreadable");
    // And the workflow fails the job on every planner refusal.
    expect(bootstrap).toMatch(/planner refused \(exit \$\{PLAN\}\); failing closed/);
  });

  it("the watchdog feeds UNREADABLE issues to the planner as issue-keyed stubs (never dropped)", () => {
    // Workflow-boundary redesign: unreadable marker-bearing issues are
    // surfaced by watchdog-plan.mjs as validation-failing stubs KEYED BY
    // ISSUE NUMBER (C8) — the finding identity is the issue itself
    // (malformed:issue:<n>), so no synthetic lane identity exists to
    // collide or mis-map. Proven executably in
    // watchdog-dual-collection.test.ts ("an unreadable marker-bearing
    // issue becomes an issue-keyed malformed-lane finding").
    const plan = readFileSync(".straylight/lib/watchdog-plan.mjs", "utf8");
    expect(plan).toMatch(/for \(const u of world\.unreadable\)/);
    expect(plan).toMatch(/issue_number: u\.number/);
    const wd = readFileSync(".straylight/lib/watchdog.mjs", "utf8");
    expect(wd).toMatch(/malformed:issue:\$\{issueNumber\}/);
  });

  it("a FAILED reconstruction is fed to the planner as an issue-keyed malformed-lane stub, never `continue`d past", () => {
    const plan = readFileSync(".straylight/lib/watchdog-plan.mjs", "utf8");
    // The failed-reconstruction branch pushes a validation-failing stub
    // keyed to its issue; the scan turns it into escalate-malformed-lane.
    expect(plan).toMatch(/Failed reconstruction: a validation-failing stub/);
    // A frozen-but-ok reconstruction under an enabled gate is a policy
    // inconsistency: the sweep refuses BEFORE any recovery writes.
    expect(plan).toMatch(/frozen-under-enabled-policy/);
    // No silent-continue construct survives in the workflow.
    expect(watchdog).not.toMatch(/\|\| continue/);
  });

  it("the scanner turns exactly such stubs into explicit escalate-malformed-lane findings with per-issue dedupe keys", () => {
    const out = scan(
      [
        { lane_id: "unreadable-issue-42", event_sequence: 42 },
        { lane_id: "malformed-issue-17", event_sequence: 17 },
      ],
      makePolicy(),
      { now: NOW },
    );
    expect(out.ok).toBe(true);
    const findings = out.actions.filter((a: any) => a.type === "escalate-malformed-lane");
    expect(findings).toHaveLength(2);
    expect(findings[0]?.dedupe_key).toBe("malformed:unreadable-issue-42:42");
    expect(findings[1]?.dedupe_key).toBe("malformed:malformed-issue-17:17");
  });

  it("a finding whose lane has no issue mapping FAILS the sweep instead of being skipped", () => {
    // The issue-keyed contract (C8) made the mapping structural: every
    // scan action carries the issue_number of the lane entry it came
    // from, and the planner REFUSES an action it cannot key
    // (action-issue-unkeyed / action-issue-unknown) — a finding can never
    // be dropped silently.
    const plan = readFileSync(".straylight/lib/watchdog-plan.mjs", "utf8");
    expect(plan).toMatch(/action-issue-unkeyed/);
    expect(plan).toMatch(/action-issue-unknown/);
    expect(watchdog).not.toMatch(/no issue for \$\{LANE_ID\}; skipping/);
  });

  it("discovery-extraction integrity is cross-checked before the sweep uses it (no silent truncation)", () => {
    // The seal stage's claims rule replaced the bash count cross-checks:
    // issue_slots and pr_slots in the manifest must equal what the seal
    // itself re-derives from raw bytes, and the final planner re-derives
    // them AGAIN — a truncated or padded slot list refuses
    // (claims-rule-violation / manifest-claims-mismatch), proven
    // executably in collection.test.ts.
    const collection = readFileSync(".straylight/lib/collection.mjs", "utf8");
    expect(collection).toMatch(/claims-rule-violation/);
    expect(collection).toMatch(/manifest-claims-mismatch/);
  });
});

// =============================================================================
// I3 — every read that guards a write fails closed.
// =============================================================================
describe("I3 — guarded reads: materialized, shape-validated, never pipeline-ambiguous", () => {
  const reducer = readFileSync(REDUCER, "utf8");
  const watchdog = readFileSync(WATCHDOG, "utf8");
  const mergeGuard = readFileSync(MERGE_GUARD, "utf8");
  const ALL = [
    [REDUCER, reducer],
    [WATCHDOG, watchdog],
    [MERGE_GUARD, mergeGuard],
    [BOOTSTRAP, readFileSync(BOOTSTRAP, "utf8")],
  ] as const;

  // All four workflows are converted to the gather → plan → execute
  // boundary: dedupe guarantees live in planner code, proven executably
  // in planner-adversarial.test.ts / watchdog-dual-collection.test.ts.
  const GUARDED: ReadonlyArray<readonly [string, string, string]> = [];

  it("converted workflows own dedupe in the planner: reducer + merge-guard read ALL comment pages and dedupe on parsed evidence", () => {
    // Planners derive dedupe proofs from the complete parsed comment
    // stream (bot-author + machine-marker + exact full-line identity),
    // proven executably in planner-adversarial ("already posted … →
    // exit 3" for the confirmation, the result, and the guard verdict).
    // The workflows' only comment reads are the materialized paginated
    // fetches feeding the planners, and their only write path is the
    // shared executor.
    for (const [wf, name] of [[mergeGuard, "merge-guard"], [reducer, "reducer"]] as const) {
      expect(wf, name).toMatch(/gh api --paginate "repos\/\$\{REPO\}\/issues\/\$\{ISSUE_NUMBER\}\/comments"/);
      expect(wf, name).toMatch(/node \.straylight\/bin\/execute-write-plan\.mjs/);
      // Comments may EXPLAIN the ban; executable lines may not contain it.
      const code = wf.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
      expect(code, name).not.toMatch(/gh api -X POST/);
    }
    expect(mergeGuard).toMatch(/node \.straylight\/bin\/plan-merge-guard-write\.mjs/);
    expect(reducer).toMatch(/node \.straylight\/bin\/plan-reducer-writes\.mjs/);
    for (const p of [".straylight/bin/plan-merge-guard-write.mjs", ".straylight/bin/plan-reducer-writes.mjs"]) {
      const planner = readFileSync(p, "utf8");
      expect(planner, p).toMatch(/hasFullLineDedupe/);
      expect(planner, p).toMatch(/github-actions\[bot\]/);
    }
  });

  it("no `gh api | grep` pipeline survives anywhere in the four control-plane workflows", () => {
    for (const [f, src] of ALL) {
      // Comments may EXPLAIN why the pipeline is banned; executable lines
      // may not contain it.
      const code = src.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
      expect(code, f).not.toMatch(/gh api[^\n]*\|\s*grep/);
      // Nor may a gh api read continue on a following line into grep.
      expect(code, f).not.toMatch(/gh api[^\n]*\\\n[^\n]*\\?\n?\s*\|\s*grep/);
    }
  });

  it("no `|| true` on any paginated (authority-bearing) read", () => {
    for (const [f, src] of ALL) {
      for (const line of src.split("\n").filter((l) => l.includes("gh api --paginate"))) {
        expect(line, `${f}: ${line}`).not.toMatch(/\|\|\s*true/);
      }
    }
  });

  it("every evidence fetch that guards a write materializes to a file, verifies the exit status, and aborts on failure", () => {
    // The materialized-read discipline survives the conversion: every
    // gather step checks the gh exit status explicitly and aborts loudly
    // — a failed read is never converted into "not yet posted", "no
    // labels", or "zero lanes".
    for (const [f, src] of ALL) {
      const code = src.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
      expect(code, f).toMatch(/if ! gh api --paginate/);
      expect(src, f).toMatch(/NOT treating as/);
    }
  });

  it("dedupe decisions happen over parsed local evidence in planner code — no workflow-side dedupe search remains", () => {
    for (const [f, src] of ALL) {
      const code = src.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
      expect(code, f).not.toMatch(/dedupe-pages\.json|dedupe-bodies\.json/);
      expect(code, f).not.toMatch(/grep -qF "dedupe:/);
    }
  });

  it("bot-author + machine-marker restriction is preserved on every dedupe decision (planner authority)", () => {
    // The restriction lives in the planners (bot author + the machine
    // marker + exact full-line identity over PARSED comment evidence),
    // proven executably in planner-adversarial and
    // watchdog-dual-collection (attacker comments / substring matches
    // never suppress).
    const mergeGuardPlanner = readFileSync(".straylight/bin/plan-merge-guard-write.mjs", "utf8");
    expect(mergeGuardPlanner).toMatch(/MARKERS\.mergeGuardResult/);
    expect(mergeGuardPlanner).toMatch(/c\.user === BOT/);
    const reducerPlanner = readFileSync(".straylight/bin/plan-reducer-writes.mjs", "utf8");
    expect(reducerPlanner).toMatch(/MARKERS\.event/);
    expect(reducerPlanner).toMatch(/MARKERS\.reducerResult/);
    expect(reducerPlanner).toMatch(/c\.user === BOT/);
    const watchdogPlan = readFileSync(".straylight/lib/watchdog-plan.mjs", "utf8");
    expect(watchdogPlan).toMatch(/MARKERS\.event/);
    expect(watchdogPlan).toMatch(/MARKERS\.watchdogResult/);
    expect(watchdogPlan).toMatch(/c\.user === BOT/);
  });

  it("the reducer current-label read is materialized, shape-validated, and aborts before any label write", () => {
    // Workflow-boundary redesign: the label read GUARDS Stage B's label
    // writes. The workflow materializes it to a file and aborts loudly on
    // a failed read (never 'no labels'); the SHAPE validation and
    // membership logic moved into parseLabelPages (evidence.mjs — N1
    // uniqueness, exact-prefix repository binding, zero-byte-invalid,
    // proven executably) consumed by plan-reducer-writes.mjs --stage b.
    const s = step(reducer, "Stage B — gather fresh evidence twice (raw bytes to files)");
    expect(s).toMatch(/if ! gh api --paginate "repos\/\$\{REPO\}\/issues\/\$\{ISSUE_NUMBER\}\/labels" > "\$\{DIR\}\/labels\.pages"; then/);
    expect(s).toMatch(/NOT treating as 'no labels'/);
    // The old fail-open constructs are gone: no || true on the read, no
    // process substitution swallowing the status, no grep filtering the
    // API stream, no bash membership logic at all.
    expect(reducer).not.toMatch(/mapfile -t HAVE < <\(gh api/);
    expect(reducer).not.toMatch(/-q '\.\[\]\.name' \| grep/);
    expect(reducer).not.toMatch(/labels\.pages"[^\n]*\|\|\s*true/);
    const planner = readFileSync(".straylight/bin/plan-reducer-writes.mjs", "utf8");
    expect(planner).toMatch(/parseLabelPages/);
    expect(planner).toMatch(/deriveLabels\(lane\)/);
  });

  it("jq 'any' exit-code semantics actually distinguish found / not-found / error (executable proof)", () => {
    const bodies = join(tmp, "bodies.json");
    writeFileSync(bodies, JSON.stringify(["## result\n\ndedupe:reducer-result:7:ready-for-merge\n"]));
    const run = (file: string, needle: string) => {
      try {
        execFileSync("jq", ["-e", "--arg", "d", needle, "any(.[]; contains($d))", file], { encoding: "utf8" });
        return 0;
      } catch (e: any) {
        return e.status ?? -1;
      }
    };
    expect(run(bodies, "dedupe:reducer-result:7:ready-for-merge")).toBe(0); // found → skip
    expect(run(bodies, "dedupe:reducer-result:8:ready-for-merge")).toBe(1); // valid no-match → post
    const malformed = join(tmp, "malformed.json");
    writeFileSync(malformed, "{ not json ]");
    const err = run(malformed, "anything");
    expect(err).not.toBe(0); // parse error is an ERROR…
    expect(err).not.toBe(1); // …never a valid "not found"
  });

  it("a failed watchdog PR fetch is a DURABLE explicit failure record, never 'no PR'", () => {
    // Workflow-boundary redesign: a failed PR fetch writes an explicit
    // {fetched:false} ledger row — a durable fact, never filename
    // absence (S4→S5); the final planner turns agreed failure into the
    // unresolved-head fail-closed path (pr_head_unresolved), proven
    // executably in watchdog-dual-collection.test.ts (row 6 + control).
    const s = step(watchdog, "Collect evidence (Collection A, then Collection B)");
    expect(s).toMatch(/if gh api "repos\/\$\{REPO\}\/pulls\/\$\{P\}" > "\$\{DIR\}\/issue-\$\{N\}\/pr-\$\{P\}\.json" 2>\/dev\/null; then/);
    expect(s).toMatch(/fetched: false/);
    const plan = readFileSync(".straylight/lib/watchdog-plan.mjs", "utf8");
    expect(plan).toMatch(/pr_head_unresolved\.push/);
  });

  it("valid no-match behavior is preserved: planning (which embeds the dedupe proof) precedes each single executor invocation", () => {
    const planStep = mergeGuard.indexOf("Plan shadow result (planner authority)");
    const execStep = mergeGuard.indexOf("Execute write plan (single shared executor)");
    expect(planStep).toBeGreaterThan(-1);
    expect(execStep).toBeGreaterThan(planStep);
    const planA = reducer.indexOf("Stage A — plan eligibility confirmation");
    const execA = reducer.indexOf("Stage A — execute write plan");
    const planB = reducer.indexOf("Stage B — plan projections and publication");
    const execB = reducer.indexOf("Stage B — execute write plan");
    expect(planA).toBeGreaterThan(-1);
    expect(execA).toBeGreaterThan(planA);
    expect(planB).toBeGreaterThan(execA); // Stage B starts only after Stage A's execution
    expect(execB).toBeGreaterThan(planB);
    const wdPlan = watchdog.indexOf("Plan watchdog writes (dual-collection planner authority)");
    const wdExec = watchdog.indexOf("Execute write plan (single shared executor)");
    expect(wdPlan).toBeGreaterThan(-1);
    expect(wdExec).toBeGreaterThan(wdPlan);
  });
});
