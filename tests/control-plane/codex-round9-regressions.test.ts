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

  it("both route the RAW page stream through the shared canonical adapter (lane-scan.mjs --pages)", () => {
    expect(bootstrap).toMatch(/node \.straylight\/bin\/lane-scan\.mjs --pages \/tmp\/issue-pages\.json --lane-id lane-phase-49p/);
    expect(watchdog).toMatch(/node \.straylight\/bin\/lane-scan\.mjs --pages \/tmp\/issue-pages\.json --all-lanes/);
    // No workflow-side jq flattening of the page stream survives: the
    // adapter owns flattening and fails closed on malformed pages.
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
    expect(bootstrap).toMatch(/- name: Ensure cp-lane label exists/);
    const reducer = readFileSync(REDUCER, "utf8");
    expect(reducer).toMatch(/Sync derived labels/);
    // The reducer's per-issue trigger condition may reference the label
    // (an event-routing convenience) but no ENUMERATION does.
    for (const wf of [bootstrap, watchdog]) {
      expect(wf).not.toMatch(/issues\?[^"]*labels=cp-lane/);
    }
  });

  it("the shared adapter stays dependency-free, no-network, and routes through the canonical marker parser", () => {
    const src = readFileSync(LANE_SCAN, "utf8");
    const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1] ?? "");
    expect(imports.length).toBeGreaterThan(0);
    expect(imports.every((s) => s.startsWith("node:") || s === "../lib/markers.mjs")).toBe(true);
    expect(src).not.toMatch(/fetch\(|https?:\/\/api\.github\.com/);
    expect(src).toMatch(/extractPayload\(body, MARKERS\.lane\)/);
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
    const s = step(bootstrap, "Idempotency check — existing Phase 49P lane");
    expect(s).toMatch(/UNREADABLE=\$\(jq -r '\.unreadable \| length' \/tmp\/lane-scan\.json\)/);
    expect(s).toMatch(/refusing to bootstrap until they are resolved/);
    expect(s).toMatch(/unparseable lane payload[\s\S]{0,200}exit 1/);
  });

  it("the watchdog feeds UNREADABLE issues to the scanner as stubs mapped to their issue (never dropped)", () => {
    const s = step(watchdog, "Reconstruct all lanes and scan");
    // Stub construction with a synthetic per-issue lane id and the issue
    // number as event_sequence (unique dedupe key per issue). Malformed-
    // but-parseable lanes get their own synthetic id too, so a parsed
    // lane_id colliding with a healthy lane can never post the finding on
    // the wrong issue. Both ids deliberately violate the canonical
    // lane-id pattern, so no REAL lane can ever collide with them.
    expect(s).toMatch(/SYN="unreadable-issue-\$\{N\}"/);
    expect(s).toMatch(/SYN="malformed-issue-\$\{N\}"/);
    for (const syn of ["unreadable-issue-6", "malformed-issue-8"]) {
      expect(syn).not.toMatch(/^lane-[a-z0-9][a-z0-9-]{1,62}$/);
    }
    expect(s).toMatch(/\.lanes \+= \[\{lane_id: \$id, event_sequence: \$n\}\]/);
    expect(s).toMatch(/surfacing as a malformed-lane finding/);
    // The issue mapping is written in every branch: unreadable stub,
    // healthy lane, malformed synthetic.
    const mapWrites = s.match(/>> \/tmp\/lane-issues\.tsv/g) ?? [];
    expect(mapWrites.length).toBeGreaterThanOrEqual(3);
  });

  it("a FAILED reconstruction (or ok !== true) is fed to the scanner as a malformed-lane stub, never `continue`d past", () => {
    const s = step(watchdog, "Reconstruct all lanes and scan");
    // The old silent-skip constructs are gone.
    expect(s).not.toMatch(/reduce-issue\.mjs --input \/tmp\/reduce-input\.json > \/tmp\/lane\.json \|\| continue/);
    expect(s).not.toMatch(/jq -e '\(\.ok == true\) and \(\.frozen == false\)' \/tmp\/lane\.json >\/dev\/null \|\| continue/);
    // The authoritative branch requires literal ok:true AND frozen:false…
    expect(s).toMatch(/jq -e '\(\.ok == true\) and \(\.frozen == false\)' \/tmp\/lane\.json/);
    // …and the else branch surfaces the lane as a finding stub.
    expect(s).toMatch(/failed reconstruction; surfacing as a malformed-lane finding/);
    // A frozen-but-ok reconstruction under an enabled gate is a policy
    // inconsistency: the sweep aborts BEFORE any recovery writes.
    expect(s).toMatch(/reconstructed frozen under an enabled policy gate; aborting sweep before any recovery writes/);
    expect(s).toMatch(/policy unreadable during reconstruction; aborting sweep/);
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
    const s = step(watchdog, "Post deduped recovery events");
    expect(s).not.toMatch(/no issue for \$\{LANE_ID\}; skipping/);
    expect(s).toMatch(/no issue mapping for \$\{LANE_ID\}; failing the sweep[\s\S]{0,120}exit 1/);
  });

  it("discovery-extraction integrity is cross-checked before the sweep uses it (no silent truncation)", () => {
    const s = step(watchdog, "Reconstruct all lanes and scan");
    expect(s).toMatch(/lane list extraction count mismatch; aborting sweep/);
    expect(s).toMatch(/unreadable list extraction count mismatch; aborting sweep/);
    expect(s).toMatch(/unreadable entry without an issue number; aborting sweep/);
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

  // The five guarded reads, by the step that performs them.
  const GUARDED = [
    [reducer, "Confirm eligibility with durable live PR metadata", "confirmation dedupe"],
    [reducer, "Post reducer result (idempotent per event_sequence)", "result dedupe"],
    [watchdog, "Post deduped recovery events", "recovery dedupe"],
    [mergeGuard, "Post shadow result", "result dedupe"],
  ] as const;

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

  it("each dedupe read materializes ALL pages to a file, verifies the exit status, and aborts on failure", () => {
    for (const [src, stepName] of GUARDED) {
      const s = step(src, stepName);
      expect(s, stepName).toMatch(/if ! gh api --paginate "repos\/\$\{REPO\}\/issues\/\$\{(ISSUE_NUMBER|ISSUE)\}\/comments" > \/tmp\/dedupe-pages\.json; then/);
      expect(s, stepName).toMatch(/NOT treating as 'not yet posted'/);
      expect(s, stepName).toMatch(/exit 1/);
    }
  });

  it("each dedupe read validates the page shape before searching, and searches ONLY the local file", () => {
    for (const [src, stepName] of GUARDED) {
      const s = step(src, stepName);
      expect(s, stepName).toMatch(/jq -s -e 'map\(type == "array"\) \| all' \/tmp\/dedupe-pages\.json/);
      expect(s, stepName).toMatch(/dedupe pages malformed|comment pages malformed/);
      // found/not-found decided by jq exit code on the local bodies file.
      expect(s, stepName).toMatch(/jq -e --arg d "dedupe:\$\{DEDUPE\}" 'any\(\.\[\]; contains\(\$d\)\)' \/tmp\/dedupe-bodies\.json/);
      expect(s, stepName).toMatch(/FOUND=\$\?/);
      // exit 0 → skip; exit 1 → valid no-match falls through to post;
      // anything else → abort. All three arms present.
      expect(s, stepName).toMatch(/"\$FOUND" -eq 0/);
      expect(s, stepName).toMatch(/"\$FOUND" -ne 1[\s\S]{0,240}exit 1/);
    }
  });

  it("bot-author + machine-marker restriction and pagination are preserved on every dedupe read", () => {
    for (const [src, stepName, marker] of [
      [reducer, "Confirm eligibility with durable live PR metadata", "straylight:event:v1"],
      [reducer, "Post reducer result (idempotent per event_sequence)", "straylight:reducer-result:v1"],
      [watchdog, "Post deduped recovery events", "straylight:(event|watchdog-result):v1"],
      [mergeGuard, "Post shadow result", "straylight:merge-guard-result:v1"],
    ] as const) {
      const s = step(src, stepName);
      expect(s, stepName).toMatch(/select\(\.user\.login == "github-actions\[bot\]"\)/);
      expect(s, stepName).toContain(marker);
      expect(s, stepName).toMatch(/gh api --paginate/);
    }
  });

  it("the reducer current-label read is materialized, shape-validated, and aborts before any label write", () => {
    const s = step(reducer, "Sync derived labels");
    expect(s).toMatch(/if ! gh api --paginate "repos\/\$\{REPO\}\/issues\/\$\{ISSUE_NUMBER\}\/labels" > \/tmp\/label-pages\.json; then/);
    expect(s).toMatch(/NOT treating as 'no labels'/);
    expect(s).toMatch(/jq -s -e 'map\(type == "array"\) \| all' \/tmp\/label-pages\.json/);
    // The old fail-open constructs are gone: no || true on the read, no
    // process substitution swallowing the status, no grep filtering the
    // API stream.
    expect(s).not.toMatch(/mapfile -t HAVE < <\(gh api/);
    expect(s).not.toMatch(/-q '\.\[\]\.name' \| grep/);
    expect(s).not.toMatch(/\/labels"[^\n]*\|\|\s*true/);
    // Membership checks run against local files.
    expect(s).toMatch(/grep -qxF -- "\$l" \/tmp\/want-labels\.txt/);
    expect(s).toMatch(/grep -qxF -- "\$l" \/tmp\/have-labels\.txt/);
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

  it("the watchdog PR-head read records failure as UNRESOLVED (fail-closed finding), never as 'no PR'", () => {
    const s = step(watchdog, "Reconstruct all lanes and scan");
    expect(s).not.toMatch(/-q '\.head\.sha' 2>\/dev\/null \|\| true/);
    expect(s).toMatch(/if gh api "repos\/\$\{REPO\}\/pulls\/\$\{PRNUM\}" > \/tmp\/pr\.json 2>\/dev\/null; then/);
    expect(s).toMatch(/pr_head_unresolved \+= \[\$pr\]/);
  });

  it("valid no-match behavior is preserved: the post call follows the dedupe check in every guarded step", () => {
    for (const [src, stepName] of GUARDED) {
      const s = step(src, stepName);
      const dedupe = s.indexOf("/tmp/dedupe-bodies.json");
      const post = s.indexOf('gh api -X POST');
      expect(dedupe, stepName).toBeGreaterThan(-1);
      expect(post, stepName).toBeGreaterThan(dedupe);
    }
  });
});
