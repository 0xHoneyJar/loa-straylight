// Control Plane v1 — direct regressions for the Codex thirteenth-round
// findings. One describe() block per finding; each reproduces the
// reported failure shape against the patched code.
//
//  J1  the fixed-read guard ran over RAW workflow text while the
//      mutation checker normalized quoted words, so executable derived
//      reads that dodge every write/pipe/substitution rule slipped both
//      guards: `g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`,
//      `command gh api …`, and `env gh api …` passed 190/190. The
//      checker now decomposes every normalized logical line into the
//      EFFECTIVE simple commands bash would run — quote-aware separator
//      split, substitution bodies recursed, per-word quote stripping,
//      command/env/exec/nohup/builtin wrappers and assignment prefixes
//      unwrapped — and categorically refuses ANY effective gh invocation
//      (gh-api-derived) unless it is the EXACT fail-closed guarded fixed
//      read. The fixed-read boundary test asserts over the same
//      normalized surface, never raw text.
//
//  J2  watchdog.d.mts declared the malformed-finding keys as unrestricted
//      number/string, so `issue_number: 0` and a lane-only finding keyed
//      by the arbitrary string `"unreadable-issue-42"` type-checked. The
//      keys are now runtime-validated BRANDED types — PositiveIssueNumber
//      and ValidLaneId — whose only constructors are asPositiveIssueNumber
//      / asValidLaneId (null on invalid input, fail closed); the
//      lane-keyed variant additionally declares issue_number?: never, and
//      the runtime routes every raw key through the same validators
//      before constructing an action.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { scan, asPositiveIssueNumber, asValidLaneId } from "../../.straylight/lib/watchdog.mjs";
import type {
  WatchdogAction,
  WatchdogMalformedLaneFinding,
  WatchdogMalformedIssueKeyedFinding,
  WatchdogMalformedLaneKeyedFinding,
  PositiveIssueNumber,
  ValidLaneId,
} from "../../.straylight/lib/watchdog.mjs";
import { makePolicy, NOW } from "./_fixtures.js";

const WORKFLOWS = [
  ".github/workflows/straylight-bootstrap.yml",
  ".github/workflows/straylight-merge-guard.yml",
  ".github/workflows/straylight-reducer.yml",
  ".github/workflows/straylight-watchdog.yml",
] as const;

// The checker surface under test lives in workflow-mutation.test.ts;
// dynamic import inside each test (the round-12 pattern) keeps that
// file's own describe blocks from re-registering here.
const checker = () => import("./workflow-mutation.test.js");

// =============================================================================
// J1 — effective-command decomposition closes the wrapper/quoted-word
// derived-read class
// =============================================================================
describe("J1 — every effective gh invocation is judged over normalized commands, never raw text", () => {
  it("the three Codex bypass payloads are each flagged gh-api-derived by the checker directly", async () => {
    const { checkWorkflowBoundary } = await checker();
    for (const payload of [
      `g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `command g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `env g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`,
    ]) {
      const rules = checkWorkflowBoundary(payload).map((v) => v.rule);
      expect(rules, payload).toContain("gh-api-derived");
    }
  });

  it("the CLASS is closed, not the examples: every wrapper/quoting/indirection spelling of a derived read resolves to its effective command", async () => {
    const { checkWorkflowBoundary } = await checker();
    for (const payload of [
      `gh api "repos/x/y/pulls/1" > /tmp/pr.json`,             // direct, unguarded — no pipe, no -X, no field flag
      `g"h" api "repos/x/y/pulls/1" > /tmp/pr.json`,           // double-quoted word split
      `'g'"h" api "repos/x/y/pulls/1" > /tmp/pr.json`,         // mixed-quote word assembly
      `command gh api "repos/x/y/pulls/1" > /tmp/pr.json`,     // command wrapper, unquoted
      `command -p gh api "repos/x/y/pulls/1" > /tmp/pr.json`,  // command wrapper with option
      `env gh api "repos/x/y/pulls/1" > /tmp/pr.json`,         // env wrapper, bare
      `env TOKEN=x gh api "repos/x/y/pulls/1" > /tmp/pr.json`, // env with assignment
      `env -i GH_TOKEN=x gh api "repos/x/y/pulls/1" > /tmp/pr.json`, // env with option AND assignment
      `env - gh api "repos/x/y/pulls/1" > /tmp/pr.json`,       // env clear-environment spelling
      `exec gh api "repos/x/y/pulls/1" > /tmp/pr.json`,        // exec wrapper
      `nohup gh api "repos/x/y/pulls/1" > /tmp/pr.json`,       // nohup wrapper
      `GH_PAGER= gh api "repos/x/y/pulls/1" > /tmp/pr.json`,   // bare assignment prefix
      `A=1 B=2 gh api "repos/x/y/pulls/1" > /tmp/pr.json`,     // stacked assignment prefixes
      `command env TOKEN=x g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`, // stacked wrappers + quoted word
      `true; gh api "repos/x/y/pulls/1" > /tmp/pr.json`,       // after ; separator
      `true && gh api "repos/x/y/pulls/1" > /tmp/pr.json`,     // after && separator
      `gh api "repos/x/y/pulls/1" > /tmp/pr.json &`,           // backgrounded (& separator)
      `HEAD=$(gh api "repos/x/y/pulls/1")`,                    // inside $( … )
      `HEAD=$(env gh api "repos/x/y/pulls/1")`,                // wrapped inside $( … )
      "HEAD=`gh api \"repos/x/y/pulls/1\"`",                   // inside backticks
      `cat <(gh api "repos/x/y/pulls/1")`,                     // inside <( … )
      `tee >(gh api "repos/x/y/pulls/1") < x`,                 // inside >( … )
      `gh pr view 120 --json headRefOid > /tmp/head.json`,     // ANY gh subcommand, not only api
    ]) {
      const rules = checkWorkflowBoundary(payload).map((v) => v.rule);
      expect(rules, payload).toContain("gh-api-derived");
    }
  });

  it("the guarded FIXED reads the workflows actually use stay clean under the categorical rule", async () => {
    const { checkWorkflowBoundary } = await checker();
    for (const clean of [
      `if ! gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then`,
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; then`,
      `if ! gh api --paginate "repos/\${REPO}/issues/\${ISSUE_NUMBER}/comments" > "\${DIR}/comments.pages"; then`,
      `if ! gh api --paginate "repos/\${REPO}/labels?per_page=100" > /tmp/label-pages.json; then`,
    ]) {
      expect(checkWorkflowBoundary(clean), clean).toEqual([]);
    }
  });

  it("the permitted shape is EXACT: guard, api, fixed url, one fixed target — weaken any element and the read is refused", async () => {
    const { checkWorkflowBoundary } = await checker();
    for (const nearMiss of [
      // fixed shape, no fail-closed guard
      `gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"`,
      // guarded but derived pulls url
      `if ! gh api "repos/\${REPO}/pulls/120" > "\${DIR}/pr.json"; then`,
      // guarded but the url is built from a NON-fixed variable
      `if ! gh api "repos/\${REPO}/issues/\${TARGET}" > "\${DIR}/issue.json"; then`,
      // guarded fixed url but the redirect target uses a non-fixed variable
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${OUTDIR}/issue.json"; then`,
      // guarded fixed url but trailing words after the target
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json" 2>/dev/null; then`,
      // guarded fixed url but no redirect at all (output to the pipe/tty)
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}"; then`,
      // guarded fixed url but a non-api subcommand
      `if ! gh issue view "\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; then`,
      // guarded fixed shape but wrapped — the guard must see gh itself
      `if ! env gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; then`,
    ]) {
      const rules = checkWorkflowBoundary(nearMiss).map((v) => v.rule);
      expect(rules, nearMiss).toContain("gh-api-derived");
    }
  });

  it("collectEffectiveGhInvocations resolves wrappers and quoting: the invocation list is spelling-independent", async () => {
    const { collectEffectiveGhInvocations } = await checker();
    const direct = collectEffectiveGhInvocations(`gh api "repos/x/y/pulls/1" > /tmp/pr.json`);
    const quoted = collectEffectiveGhInvocations(`g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`);
    const wrapped = collectEffectiveGhInvocations(`env TOKEN=x command g"h" api "repos/x/y/pulls/1" > /tmp/pr.json`);
    expect(direct).toHaveLength(1);
    expect(quoted).toHaveLength(1);
    expect(wrapped).toHaveLength(1);
    expect(direct[0]?.words).toEqual(quoted[0]?.words);
    expect(direct[0]?.words).toEqual(wrapped[0]?.words);
    expect(wrapped[0]?.wrapped).toBe(true);
    expect(direct[0]?.permitted).toBe(false);
    // And a substituted invocation is visible with its context recorded.
    const sub = collectEffectiveGhInvocations(`HEAD=$(gh api "repos/x/y/pulls/1")`);
    expect(sub).toHaveLength(1);
    expect(sub[0]?.inSubstitution).toBe(true);
    expect(sub[0]?.permitted).toBe(false);
  });

  it("across all four REAL workflows every effective gh invocation is a permitted guarded fixed read (the clean direction of the class)", async () => {
    const { collectEffectiveGhInvocations } = await checker();
    for (const f of WORKFLOWS) {
      const invocations = collectEffectiveGhInvocations(readFileSync(f, "utf8"));
      expect(invocations.length, f).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv.permitted, `${f}:${inv.line}: ${inv.words.join(" ")}`).toBe(true);
      }
    }
  });
});

// =============================================================================
// J2 — branded, runtime-validated watchdog finding keys
// =============================================================================
describe("J2 — PositiveIssueNumber / ValidLaneId are constructor-only branded types", () => {
  it("COMPILER PROBE: the Codex payloads no longer type-check — issue_number: 0 and a lane-only arbitrary string are compile errors", () => {
    const zeroIssue: WatchdogMalformedIssueKeyedFinding = {
      type: "escalate-malformed-lane",
      // @ts-expect-error — a raw 0 is not a PositiveIssueNumber; only asPositiveIssueNumber constructs one
      issue_number: 0,
      dedupe_key: "malformed:issue:0",
      detail: "x",
    };
    const laneOnlyArbitrary: WatchdogMalformedLaneKeyedFinding = {
      type: "escalate-malformed-lane",
      // @ts-expect-error — a raw string is not a ValidLaneId; "unreadable-issue-42" cannot be spelled into the key
      lane_id: "unreadable-issue-42",
      dedupe_key: "malformed:unreadable-issue-42:42",
      detail: "x",
    };
    expect([zeroIssue, laneOnlyArbitrary].length).toBe(2);
  });

  it("COMPILER PROBE: negative, fractional, and pattern-valid-but-raw spellings are equally impossible", () => {
    const negative: WatchdogMalformedIssueKeyedFinding = {
      type: "escalate-malformed-lane",
      // @ts-expect-error — a raw negative literal is not a PositiveIssueNumber
      issue_number: -1,
      dedupe_key: "malformed:issue:-1",
      detail: "x",
    };
    const fractional: WatchdogMalformedIssueKeyedFinding = {
      type: "escalate-malformed-lane",
      // @ts-expect-error — a raw non-integer literal is not a PositiveIssueNumber
      issue_number: 1.5,
      dedupe_key: "malformed:issue:1.5",
      detail: "x",
    };
    // Even a string that WOULD pass the pattern must flow through the
    // validator — the brand is proof of validation, not of spelling.
    const rawButPatternValid: WatchdogMalformedLaneKeyedFinding = {
      type: "escalate-malformed-lane",
      // @ts-expect-error — raw strings never carry the ValidLaneId brand
      lane_id: "lane-phase-49q",
      dedupe_key: "malformed:lane-phase-49q:3",
      detail: "x",
    };
    // And a healthy action's lane_id is equally brand-guarded.
    const healthyRaw: WatchdogAction = {
      type: "flag-unverifiable-head",
      // @ts-expect-error — healthy findings require a ValidLaneId, not a raw string
      lane_id: "lane-phase-49p",
      dedupe_key: "head-unverifiable:x",
      detail: "x",
    };
    expect([negative, fractional, rawButPatternValid, healthyRaw].length).toBe(4);
  });

  it("COMPILER PROBE: the lane-keyed variant statically excludes issue_number (issue_number?: never)", () => {
    const laneKeyedWithIssue: WatchdogMalformedLaneKeyedFinding = {
      type: "escalate-malformed-lane",
      lane_id: asValidLaneId("lane-phase-49q")!,
      // @ts-expect-error — a lane-keyed finding carrying an issue number would be the issue-keyed variant
      issue_number: asPositiveIssueNumber(42)!,
      dedupe_key: "malformed:lane-phase-49q:3",
      detail: "x",
    };
    expect(laneKeyedWithIssue).toBeDefined();
  });

  it("COMPILER PROBE: the valid constructor-built spellings type-check (both variants; round-12 union preserved)", () => {
    const issueKeyed: WatchdogMalformedLaneFinding = {
      type: "escalate-malformed-lane",
      issue_number: asPositiveIssueNumber(42)!,
      dedupe_key: "malformed:issue:42",
      detail: "x",
    };
    const laneKeyed: WatchdogMalformedLaneFinding = {
      type: "escalate-malformed-lane",
      lane_id: asValidLaneId("lane-phase-49q")!,
      dedupe_key: "malformed:lane-phase-49q:3",
      detail: "x",
    };
    // @ts-expect-error — neither key remains a compile error (round-12 J3 preserved under the brands)
    const neither: WatchdogMalformedLaneFinding = {
      type: "escalate-malformed-lane",
      dedupe_key: "malformed:unknown:7",
      detail: "x",
    };
    // The branded values ARE the primitives at runtime.
    const n: PositiveIssueNumber = asPositiveIssueNumber(42)!;
    const l: ValidLaneId = asValidLaneId("lane-phase-49q")!;
    expect(n).toBe(42);
    expect(l).toBe("lane-phase-49q");
    expect([issueKeyed, laneKeyed, neither].length).toBe(3);
  });

  it("RUNTIME: the validators fail closed on every invalid input class", () => {
    expect(asPositiveIssueNumber(0)).toBeNull();
    expect(asPositiveIssueNumber(-1)).toBeNull();
    expect(asPositiveIssueNumber(1.5)).toBeNull();
    expect(asPositiveIssueNumber(Number.NaN)).toBeNull();
    expect(asPositiveIssueNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(asPositiveIssueNumber(2 ** 53)).toBeNull(); // unsafe integer
    expect(asPositiveIssueNumber("42")).toBeNull();    // numeric string is not a number
    expect(asPositiveIssueNumber(null)).toBeNull();
    expect(asPositiveIssueNumber(undefined)).toBeNull();
    expect(asPositiveIssueNumber(42)).toBe(42);
    expect(asPositiveIssueNumber(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);

    expect(asValidLaneId("unreadable-issue-42")).toBeNull();
    expect(asValidLaneId("lane-")).toBeNull();
    expect(asValidLaneId("lane-UPPER")).toBeNull();
    expect(asValidLaneId("lane-" + "a".repeat(64))).toBeNull(); // over the 63-char budget
    expect(asValidLaneId(42)).toBeNull();
    expect(asValidLaneId(null)).toBeNull();
    expect(asValidLaneId("lane-phase-49q")).toBe("lane-phase-49q");
  });

  it("RUNTIME: an issue_number of 0 on a malformed entry is NOT a key — with no lane_id the sweep refuses (zero actions, no dedupe identity)", () => {
    const out = scan([{ issue_number: 0, event_sequence: 7 }], makePolicy(), { now: NOW });
    expect(out.ok).toBe(false);
    expect(out.refusal).toBe("malformed-lane-unattributable");
    expect(out.actions).toEqual([]);
  });

  it("RUNTIME: negative and non-integer issue numbers are equally not keys", () => {
    for (const bad of [-1, 1.5, Number.NaN, "42"]) {
      const out = scan([{ issue_number: bad, event_sequence: 7 }], makePolicy(), { now: NOW });
      expect(out.ok, String(bad)).toBe(false);
      expect(out.refusal).toBe("malformed-lane-unattributable");
      expect(out.actions).toEqual([]);
    }
  });

  it("RUNTIME: issue_number 0 alongside an arbitrary-string lane_id still refuses (neither raw value validates)", () => {
    const out = scan(
      [{ issue_number: 0, lane_id: "unreadable-issue-42", event_sequence: 42 }],
      makePolicy(),
      { now: NOW },
    );
    expect(out.ok).toBe(false);
    expect(out.refusal).toBe("malformed-lane-unattributable");
    expect(out.actions).toEqual([]);
  });

  it("RUNTIME: valid issue-keyed and valid lane-keyed malformed entries still yield their findings (rounds 9-12 preserved)", () => {
    const out = scan(
      [
        { issue_number: 42, event_sequence: 42 },
        { lane_id: "lane-phase-49q", event_sequence: 3 },
      ],
      makePolicy(),
      { now: NOW },
    );
    expect(out.ok).toBe(true);
    const keys = out.actions.map((a) => a.dedupe_key);
    expect(keys).toEqual(["malformed:issue:42", "malformed:lane-phase-49q:3"]);
    expect((out.actions[1] as any).issue_number).toBeUndefined();
  });

  it("the runtime constructs keys exclusively through the exported validators (no parallel ad-hoc checks remain)", () => {
    const src = readFileSync(".straylight/lib/watchdog.mjs", "utf8");
    expect(src).toMatch(/asPositiveIssueNumber\(entry\?\.issue_number\)/);
    expect(src).toMatch(/asValidLaneId\(lane\?\.lane_id\)/);
    // The pre-round-13 inline spellings are gone from scan's key paths.
    expect(src).not.toMatch(/Number\.isInteger\(entry/);
    expect(src).not.toMatch(/LANE_ID_RE\.test\(lane\.lane_id\)/);
  });
});
