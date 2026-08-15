// Control Plane v2 — H-02: A COMMITTED FREEZE WAS NOT A DURABLE-WRITE FENCE.
//
// THE DEFECT. A workflow run can BEGIN before `enabled: false` is merged and
// FINISH after. It gates on the policy at start, reconstructs state, authors a
// write plan, and only then executes. Nothing in that sequence re-asked whether
// the authority it planned under was still the authority, and the write executor
// loaded no policy at all — so a plan authored while automation was permitted
// could still post comments, add labels, and delete labels minutes or hours after
// the freeze had become the committed state of main. Codex demonstrated it: a
// local stale plan executed a label deletion successfully with `enabled: false`
// staged. H-01 closed the policy-TRANSITION layer. It did not close this one.
//
// THE REPAIR INVARIANT.
//
//   A durable GitHub mutation may execute only while BOTH hold:
//     1. the exact repository revision whose policy authorized the write plan is
//        STILL the current committed authority, AND
//     2. the accepted policy committed AT that revision still permits autonomous
//        writes (`enabled === true`).
//
//   Historical evidence that the plan was valid earlier is NOT present write
//   authority. This mirrors the existing doctrine: authorization continuity must
//   itself be authorized.
//
// So every write plan now carries a REQUIRED closed `authority: {source_main_sha,
// policy_digest}` derived mechanically from the planning checkout, and the
// executor re-establishes both from GitHub — read-only, independently of the local
// tree, immediately before EVERY mutation and never once per plan.
//
// WHERE THE H-02 ENUMERATION LIVES.
//   H2-T1  executor reaches the mutation when authority is current ....... here
//   H2-T2  main moved to a frozen revision ⇒ zero mutation attempts ...... here
//   H2-T3  forged source_main_sha, stale policy digest ⇒ refuse .......... here
//   H2-T4  plan correctly bound to a frozen revision ⇒ refuse ........... here
//   H2-T5  a stale plan does not revive when automation is re-enabled ... here
//   H2-T6  authority changes mid-plan ⇒ operation 2 is not attempted .... here
//   H2-T7  frontier capture with a QUEUED write-capable run ⇒ refuse .... here (CLI)
//                                            and frozen-frontier-transition.test.ts (library)
//   H2-T8  ...with an IN_PROGRESS run ⇒ refuse ......................... here (CLI)
//                                            and frozen-frontier-transition.test.ts (library)
//   H2-T9  zero active runs at the exact frozen main ⇒ accept ........... here
//   H2-T10 main moves during verification ⇒ refuse ...................... here
//   H2-T11 the CLI's named previous frozen SHA must equal the evidence's
//          frozen_main_sha .......................... frozen-frontier-transition.test.ts
//   H2-T12 every plan producer emits the authority object ............... here
//
// EVERY `gh` PROCESS IN THIS FILE IS A MOCK. A PATH-prepended shell script serves
// canned read responses and records mutation argv; no test in this file performs,
// or is capable of performing, a real GitHub write. The read responses are built
// by the same _fixtures helper the executor suite uses, so the response SHAPE has
// one definition.
//
// NOTHING HERE CHANGES THE COMMITTED POLICY. The frozen and variant policy texts
// are derived in-memory from the real committed file by asserted single-occurrence
// substitutions; the file on disk is read and never written.

import { describe, it, expect } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  chmodSync,
  existsSync,
  cpSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { validatePlan } from "../../.straylight/lib/write-plan.mjs";
import {
  AUTHORITY_KEYS,
  COMMITTED_POLICY_REPO_PATH,
  EXPECTED_DEFAULT_BRANCH,
  MAIN_REF,
  MAIN_SHA_RE,
  authorityShapeErrors,
  authorityStillCurrent,
  buildWriteAuthority,
  committedPolicyReadPath,
  decodeCommittedFile,
  mainRefReadPath,
  policyAuthorityDigest,
  readMainRefSha,
  readRepositoryDefaultBranch,
  repositoryMetadataReadPath,
  resolveSourceMainSha,
} from "../../.straylight/lib/write-authority.mjs";
import {
  FROZEN_MAIN_SHA_RE,
  QUIESCENCE_SCHEMA,
  TERMINAL_RUN_STATUS,
  WRITE_EXECUTOR_ENTRYPOINT,
  executableYaml,
  parseWorkflowRunPages,
  runIsActive,
  validateFrozenQuiescence,
  writeCapableWorkflows,
} from "../../.straylight/lib/frozen-quiescence.mjs";
import {
  COMMITTED_POLICY_DIGEST,
  COMMITTED_POLICY_TEXT,
  MAIN_SHA,
  authorityResponses,
  planAuthority,
  workflowDirectoryResponse,
  workflowFileResponse,
} from "./_fixtures.js";

const REPO = "0xHoneyJar/loa-straylight";
const NONCE = "12345-1";
const EXECUTOR = ".straylight/bin/execute-write-plan.mjs";
const POLICY_GATE = ".straylight/bin/policy-gate.mjs";
const QUIESCENCE_CLI = "scripts/verify-frozen-quiescence.mjs";
const LIVE_QUIESCENCE_LIB = ".straylight/lib/live-quiescence.mjs";
const WORKFLOW_DIR = ".github/workflows";

// The four states of the cutover procedure, as commits. Synthetic 40-hex: what
// the executor compares is the SHA GitHub reports against the SHA the plan
// names, and both arrive as data, so no commit in this repository need exist.
//
//   A  automation enabled — the revision a plan is authored at
//   B  the freeze commit (enabled: false)
//   C  the append-while-frozen commit (two epochs)
//   D  the re-enable commit — admission-identical to A
//   E  the same revision a plan names, but committing a DIFFERENT policy
const SHA_A = MAIN_SHA;
const SHA_B = "2b1c4e6a8f0d3b5c7e9a1f2d4b6c8e0a2f4d6b8c";
const SHA_C = "3c2d5f7b9a1e4c6d8f0b2a4c6e8d0f2b4a6c8e0d";
const SHA_D = "4d3e6a8c0b2f5d7e9a1c3f5b7d9e1a3c5f7b9d1e";
const SHA_E = "5e4f7b9d1c3a6f8b0d2e4a6c8f0b2d4e6a8c0f2b";

// ---------------------------------------------------------------------------
// Policy texts, derived from the REAL committed file
//
// They have to be derived from it: the executor accepts committed policy bytes
// through acceptCommittedPolicyText, which applies the production accepted-epoch
// digest locks, so no synthetic policy can stand in. Each substitution asserts
// its target occurs exactly once, so every other byte — including the accepted
// epoch-001 block and its lock-bearing content — is preserved verbatim.
// ---------------------------------------------------------------------------

function substituteOnce(text: string, from: string, to: string): string {
  expect(text.split(from).length - 1, `${from}: must occur exactly once in the committed policy`).toBe(1);
  return text.split(from).join(to);
}

/** State B / C / freeze: the committed policy with the kill switch engaged. */
const FROZEN_POLICY_TEXT = substituteOnce(COMMITTED_POLICY_TEXT, '"enabled": true', '"enabled": false');

/**
 * A DIFFERENT accepted policy that still permits writes: one LIVE operational
 * field changed. Admission fields, the accepted epoch, and the required
 * projection are untouched, so it validates and satisfies the epoch lock — but
 * its canonical digest differs, which is what makes it the fixture for "same
 * revision, not the policy that authorized this plan".
 */
const VARIANT_POLICY_TEXT = substituteOnce(
  COMMITTED_POLICY_TEXT,
  '"stuck_lane_threshold_hours": 72',
  '"stuck_lane_threshold_hours": 71',
);

const digestOfPolicyText = (text: string): string => {
  const parsed = parseStrict(text);
  expect(parsed.ok, "policy text must parse strictly").toBe(true);
  return policyAuthorityDigest((parsed as any).value);
};

const DIGEST_A = COMMITTED_POLICY_DIGEST;
const DIGEST_B = digestOfPolicyText(FROZEN_POLICY_TEXT);
const DIGEST_E = digestOfPolicyText(VARIANT_POLICY_TEXT);

/**
 * STATE C: the append-while-frozen policy. Under the REAL accepted-epoch locks a
 * two-epoch history is not an acceptable policy at all — the lock table holds one
 * entry — so the executor refuses it as `policy-invalid` before any authority
 * comparison happens. That is fail-closed either way, and worth asserting rather
 * than papering over: the C step of the four-transition procedure is the one that
 * also requires appending a lock in protocol code.
 */
const STATE_C_POLICY_TEXT = (() => {
  const parsed = parseStrict(FROZEN_POLICY_TEXT);
  const policy = structuredClone((parsed as any).value);
  const appended = structuredClone(policy.admission_history[0]);
  appended.epoch_id = "epoch-002";
  appended.governs_from = "2026-08-20T00:00:00Z";
  appended.lease_duration_minutes = 2880;
  appended.provenance = {
    attributed_to: "test-fixture",
    reference: "hypothetical successor epoch; NOT committed, NOT locked",
  };
  policy.admission_history.push(appended);
  policy.lease_duration_minutes = 2880;
  return JSON.stringify(policy, null, 2) + "\n";
})();

// ---------------------------------------------------------------------------
// Harness: plans, bodies, the mock gh, and the three CLIs
// ---------------------------------------------------------------------------

const sha256 = (bytes: string | Buffer) => "sha256:" + createHash("sha256").update(bytes).digest("hex");

const makeRoot = () => mkdtempSync(join(tmpdir(), "cp-authority-"));

function writeBody(root: string, name: string, content: string) {
  writeFileSync(join(root, name), content);
  return sha256(content);
}

function findingOp(opId: string, root: string, issue = 41, dedupe = `finding:${opId}`) {
  const body = JSON.stringify({
    body:
      `## machine result\n\ndedupe:${dedupe}\n\n<!-- straylight:watchdog-result:v1 -->\n` +
      "```json\n" + JSON.stringify({ finding: opId }) + "\n```",
  });
  const digest = writeBody(root, `${opId}.json`, body);
  return {
    op_id: opId,
    kind: "post-watchdog-finding",
    issue_number: issue,
    dedupe_key: dedupe,
    body_file: `${opId}.json`,
    body_sha256: digest,
  };
}

function makePlan(root: string, operations: Record<string, any>[], overrides: Record<string, any> = {}) {
  const plan = {
    schema: "straylight.write-plan.v1",
    plan_id: `${NONCE}-test`,
    nonce: NONCE,
    repository: REPO,
    authority: planAuthority(),
    operations,
    ...overrides,
  };
  const path = join(root, "plan.json");
  writeFileSync(path, JSON.stringify(plan, null, 2));
  return path;
}

/** One Actions run as the API reports it. */
const apiRun = (id: number, workflow: string, status: string, created_at = "2026-08-14T11:50:00Z") => ({
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

type GhOpts = {
  /** The SHA the main-ref read reports. */
  mainSha?: string;
  /** If set, the SHA reported once more than `swapAfterRefReads` ref reads have been served. */
  nextMainSha?: string;
  swapAfterRefReads?: number;
  /** main SHA → the policy text committed AT that SHA. A missing SHA is a failed read. */
  policies?: Record<string, string>;
  defaultBranch?: string;
  /** workflow file name (not path) → its run page stream. Missing means zero runs. */
  runs?: Record<string, string>;
  /**
   * commit SHA → the workflow files committed AT that SHA. The write-capable set
   * is derived from these bytes fetched at `?ref=<sha>`, never from the local
   * checkout, so the mock has to serve a workflow TREE and not just a policy.
   * Defaults to this repository's real workflow files at every requested SHA.
   */
  workflowsAt?: Record<string, Array<{ name: string; text: string }>>;
};

/**
 * This repository's real workflow files, read once. The default tree the mock
 * serves: H2-T9 asserts the derivation reproduces the actual write-capable set,
 * which is only meaningful if the bytes are the actual bytes.
 */
const REAL_WORKFLOW_FILES = readdirSync(WORKFLOW_DIR)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .sort()
  .map((name) => ({ name, text: readFileSync(join(WORKFLOW_DIR, name), "utf8") }));

/**
 * ONE mock serving both read-only consumers: the executor's per-operation
 * authority probes (`gh api <path>`) and the quiescence CLI's scans (`gh api
 * --paginate <path>`). The request path is the LAST argv element in both shapes.
 *
 * Reads are dispatched on the path, so the committed-policy response is keyed by
 * the `?ref=<sha>` the executor itself asked for — a moved main automatically
 * yields that revision's policy rather than requiring a second staged swap.
 *
 * Writes (`gh api -X ...`) are recorded and always succeed. A test that expects a
 * refusal asserts the write log is EMPTY, which is the whole point: an executor
 * that wrote anyway would be caught by the recording, not by the mock refusing.
 */
function makeGh(root: string, opts: GhOpts = {}) {
  const dir = join(root, "gh-mock");
  mkdirSync(dir, { recursive: true });
  const mainSha = opts.mainSha ?? SHA_A;
  writeFileSync(
    join(dir, "read-metadata.json"),
    authorityResponses({ default_branch: opts.defaultBranch ?? "main" }).metadata,
  );
  writeFileSync(join(dir, "read-ref.json"), authorityResponses({ main_sha: mainSha }).ref);
  if (opts.nextMainSha !== undefined) {
    writeFileSync(join(dir, "next-ref.json"), authorityResponses({ main_sha: opts.nextMainSha }).ref);
  }
  const policies = opts.policies ?? { [SHA_A]: COMMITTED_POLICY_TEXT };
  for (const [sha, text] of Object.entries(policies)) {
    writeFileSync(join(dir, `contents-${sha}.json`), authorityResponses({ policy_text: text }).contents);
  }
  // The workflow tree at every SHA that has a policy (plus any explicit
  // override), so a read at `?ref=<sha>` finds a listing wherever a policy
  // exists — the two are properties of the same commit.
  const trees: Record<string, Array<{ name: string; text: string }>> = {};
  for (const sha of Object.keys(policies)) trees[sha] = REAL_WORKFLOW_FILES;
  for (const [sha, files] of Object.entries(opts.workflowsAt ?? {})) trees[sha] = files;
  for (const [sha, files] of Object.entries(trees)) {
    writeFileSync(join(dir, `workflows-dir-${sha}.json`), workflowDirectoryResponse(files));
    for (const file of files) {
      writeFileSync(join(dir, `workflow-${sha}-${file.name}.json`), workflowFileResponse(file.name, file.text));
    }
  }
  for (const [file, pages] of Object.entries(opts.runs ?? {})) {
    writeFileSync(join(dir, `runs-${file}.json`), pages);
  }
  const script = `#!/bin/sh
DIR='${dir}'
if [ "$2" != "-X" ]; then
  { printf 'READ:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "$DIR/reads.log"
  TARGET=""
  for a in "$@"; do TARGET="$a"; done
  case "$TARGET" in
    */git/ref/heads/main)
      RN=$(cat "$DIR/refcount" 2>/dev/null || echo 0)
      RN=$((RN+1))
      printf '%s' "$RN" > "$DIR/refcount"
      if [ -f "$DIR/next-ref.json" ] && [ "$RN" -gt ${opts.swapAfterRefReads ?? 999999} ]; then
        cat "$DIR/next-ref.json"
      else
        cat "$DIR/read-ref.json"
      fi
      ;;
    */contents/.github/workflows/*)
      SHA=\${TARGET##*ref=}
      REST=\${TARGET#*/contents/.github/workflows/}
      WF=\${REST%%\\?*}
      if [ -f "$DIR/workflow-$SHA-$WF.json" ]; then
        cat "$DIR/workflow-$SHA-$WF.json"
      else
        printf 'no workflow fixture %s at %s\\n' "$WF" "$SHA" >&2
        exit 1
      fi
      ;;
    */contents/.github/workflows*)
      SHA=\${TARGET##*ref=}
      if [ -f "$DIR/workflows-dir-$SHA.json" ]; then
        cat "$DIR/workflows-dir-$SHA.json"
      else
        printf 'no workflow tree fixture at %s\\n' "$SHA" >&2
        exit 1
      fi
      ;;
    */contents/*)
      SHA=\${TARGET##*ref=}
      if [ -f "$DIR/contents-$SHA.json" ]; then
        cat "$DIR/contents-$SHA.json"
      else
        printf 'no committed policy fixture at %s\\n' "$SHA" >&2
        exit 1
      fi
      ;;
    */actions/workflows/*)
      REST=\${TARGET#*/actions/workflows/}
      WF=\${REST%%/runs*}
      if [ -f "$DIR/runs-$WF.json" ]; then
        cat "$DIR/runs-$WF.json"
      else
        printf '{"total_count":0,"workflow_runs":[]}\\n'
      fi
      ;;
    *)
      cat "$DIR/read-metadata.json"
      ;;
  esac
  exit 0
fi
N=$(cat "$DIR/count" 2>/dev/null || echo 0)
N=$((N+1))
printf '%s' "$N" > "$DIR/count"
{ printf 'ARGV:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "$DIR/writes.log"
cat > "$DIR/gh-stdin-$N"
exit 0
`;
  writeFileSync(join(dir, "gh"), script);
  chmodSync(join(dir, "gh"), 0o755);
  const lines = (path: string) =>
    existsSync(path) ? readFileSync(path, "utf8").trim().split("\n").filter(Boolean) : [];
  return {
    dir,
    writes: () => lines(join(dir, "writes.log")),
    reads: () => lines(join(dir, "reads.log")),
    stdinOf: (n: number) => readFileSync(join(dir, `gh-stdin-${n}`), "utf8"),
  };
}

function runExecutor(root: string, planPath: string, ghDir: string, executor = EXECUTOR) {
  const argv = [
    executor,
    "--plan", planPath,
    "--request-root", root,
    "--repository", REPO,
    "--nonce", NONCE,
  ];
  const env = {
    PATH: `${ghDir}:${process.env.PATH}`,
    HOME: process.env.HOME ?? "/tmp",
    GH_TOKEN: "test-token",
  };
  try {
    return { status: 0, out: JSON.parse(execFileSync(process.execPath, argv, { encoding: "utf8", env })) };
  } catch (e: any) {
    let out: any = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* non-JSON */ }
    return { status: e.status ?? -1, out };
  }
}

function runQuiescence(ghDir: string, args: string[]) {
  const env = { ...process.env, PATH: `${ghDir}:${process.env.PATH}` };
  const parse = (stdout: string) => {
    try { return JSON.parse(stdout); } catch { return { raw: stdout }; }
  };
  try {
    const stdout = execFileSync(process.execPath, [QUIESCENCE_CLI, ...args], {
      encoding: "utf8",
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, out: parse(stdout) };
  } catch (e: any) {
    return { status: e.status ?? -1, out: parse(typeof e.stdout === "string" ? e.stdout : "") };
  }
}

function runPolicyGate(policyPath: string) {
  try {
    const stdout = execFileSync(process.execPath, [POLICY_GATE, "--policy", policyPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    let out: any = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* non-JSON */ }
    return { status: e.status ?? -1, out };
  }
}

// Staged-tree harness: run the REAL executor out of a copied .straylight, with
// asserted single-occurrence source mutations applied to it. Same discipline as
// the H-01 harness: a mutation target must be unambiguous AND must be executable
// text, so a comment that merely NAMES a safeguard can never be what is edited.
type Mutation = { file: string; from: string; to: string };

function stageStraylight(mutations: Mutation[] = []): string {
  const root = mkdtempSync(join(tmpdir(), "cp-authority-stage-"));
  const sl = join(root, ".straylight");
  mkdirSync(sl);
  for (const dir of ["lib", "bin", "schemas"]) {
    cpSync(join(".straylight", dir), join(sl, dir), { recursive: true });
  }
  // Copied so the staged tree is a faithful .straylight even though the executor
  // never reads the local policy — its authority comes from GitHub alone.
  cpSync(".straylight/automation-policy.json", join(sl, "automation-policy.json"));
  for (const m of mutations) {
    const path = join(sl, m.file);
    const src = readFileSync(path, "utf8");
    const code = src.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(src.split(m.from).length - 1, `${m.file}: mutation target must occur exactly once`).toBe(1);
    expect(code.split(m.from).length - 1, `${m.file}: mutation target must be executable text`).toBe(1);
    const next = src.split(m.from).join(m.to);
    expect(next, `${m.file}: mutation must change the source`).not.toBe(src);
    writeFileSync(path, next);
  }
  return sl;
}

/**
 * One authority scenario: the plan's binding, what GitHub currently reports, and
 * the refusal the real build must produce. Reused verbatim by the mutation
 * harness, so a mutant is judged against the same inputs as the real build.
 */
type ScenarioKey =
  | "H2-T2"
  | "H2-T3"
  | "H2-T4"
  | "H2-T5"
  | "same-revision-different-policy"
  | "state-C";

type Scenario = {
  label: string;
  authority: Record<string, any>;
  mainSha: string;
  policies: Record<string, string>;
  refusal: string;
  detail?: RegExp;
};

const SCENARIOS: Record<ScenarioKey, Scenario> = {
  "H2-T2": {
    label: "main moved to the freeze commit",
    authority: planAuthority({ source_main_sha: SHA_A, policy_digest: DIGEST_A }),
    mainSha: SHA_B,
    policies: { [SHA_B]: FROZEN_POLICY_TEXT },
    refusal: "authority-main-moved",
    detail: /the revision that authorized this plan is no longer the committed authority/,
  },
  "H2-T3": {
    label: "forged source_main_sha, stale policy digest",
    authority: planAuthority({ source_main_sha: SHA_B, policy_digest: DIGEST_A }),
    mainSha: SHA_B,
    policies: { [SHA_B]: FROZEN_POLICY_TEXT },
    refusal: "authority-policy-digest-mismatch",
    detail: /but the policy committed at .* digests to /,
  },
  "H2-T4": {
    label: "correctly bound to the freeze commit",
    authority: planAuthority({ source_main_sha: SHA_B, policy_digest: DIGEST_B }),
    mainSha: SHA_B,
    policies: { [SHA_B]: FROZEN_POLICY_TEXT },
    refusal: "authority-policy-disabled",
    detail: /does not permit autonomous writes \(enabled is not the boolean true\)/,
  },
  "H2-T5": {
    label: "a stale plan after automation was re-enabled",
    authority: planAuthority({ source_main_sha: SHA_A, policy_digest: DIGEST_A }),
    mainSha: SHA_D,
    // Admission-identical to state A: the policy is once again EXACTLY the one
    // that authorized the plan, and the plan still must not revive.
    policies: { [SHA_D]: COMMITTED_POLICY_TEXT },
    refusal: "authority-main-moved",
    detail: new RegExp(`plan was authorized at main ${SHA_A} but current main is ${SHA_D}`),
  },
  "same-revision-different-policy": {
    label: "the named revision commits a different policy",
    authority: planAuthority({ source_main_sha: SHA_E, policy_digest: DIGEST_A }),
    mainSha: SHA_E,
    policies: { [SHA_E]: VARIANT_POLICY_TEXT },
    refusal: "authority-policy-digest-mismatch",
    detail: new RegExp(`digests to ${DIGEST_E}`),
  },
  "state-C": {
    label: "the append-while-frozen revision is not an acceptable policy at all",
    authority: planAuthority({ source_main_sha: SHA_A, policy_digest: DIGEST_A }),
    mainSha: SHA_C,
    policies: { [SHA_C]: STATE_C_POLICY_TEXT },
    refusal: "policy-invalid",
    detail: /accepted epoch lock/,
  },
};

function runScenario(s: Scenario, executor = EXECUTOR) {
  const root = makeRoot();
  const gh = makeGh(root, { mainSha: s.mainSha, policies: s.policies });
  const planPath = makePlan(root, [findingOp("op-1", root)], { authority: s.authority });
  return { gh, r: runExecutor(root, planPath, gh.dir, executor) };
}

// =============================================================================
// The plan-side binding: required, closed, and mechanically derived
// =============================================================================
describe("the write-plan authority binding", () => {
  it("is REQUIRED on every plan — no legacy plan shape can execute without it", () => {
    const root = makeRoot();
    const base = {
      schema: "straylight.write-plan.v1",
      plan_id: `${NONCE}-t`,
      nonce: NONCE,
      repository: REPO,
      operations: [findingOp("op-1", root)],
    };
    const r = validatePlan(base, { repository: REPO, nonce: NONCE });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e: any) => e.code === "authority-missing")).toBe(true);
      expect(r.errors.map((e: any) => e.detail).join("; ")).toMatch(
        /no plan may execute without its write-authority binding/,
      );
    }
  });

  it("is CLOSED: exactly source_main_sha and policy_digest, both well-formed", () => {
    expect(AUTHORITY_KEYS).toEqual(["source_main_sha", "policy_digest"]);
    const rows: Array<[string, any, string, RegExp]> = [
      ["not an object", "main", "authority-missing", /must be an object naming/],
      ["null", null, "authority-missing", /must be an object naming/],
      ["an array", [], "authority-missing", /must be an object naming/],
      ["an unknown key", { ...planAuthority(), note: "x" }, "unknown-field", /plan\.authority\.note/],
      ["a branch name", planAuthority({ source_main_sha: "main" }), "authority-invalid", /never a branch name/],
      ["an abbreviated SHA", planAuthority({ source_main_sha: SHA_A.slice(0, 7) }), "authority-invalid", /40-hex/],
      ["an uppercased SHA", planAuthority({ source_main_sha: SHA_A.toUpperCase() }), "authority-invalid", /40-hex/],
      ["a bare digest", planAuthority({ policy_digest: DIGEST_A.slice(7) }), "authority-invalid", /sha256:<64 hex>/],
      ["a missing digest", { source_main_sha: SHA_A }, "authority-invalid", /policy_digest/],
    ];
    for (const [label, authority, code, pattern] of rows) {
      const errors = authorityShapeErrors(authority);
      expect(errors.length, label).toBeGreaterThan(0);
      expect(errors.map((e: any) => e.code), label).toContain(code);
      expect(errors.map((e: any) => e.detail).join("; "), label).toMatch(pattern);
    }
    expect(authorityShapeErrors(planAuthority())).toEqual([]);
  });

  it("binds a MEANING, not bytes: the digest is over the parsed policy", () => {
    const parsed: any = parseStrict(COMMITTED_POLICY_TEXT);
    const reserialized = JSON.stringify(parsed.value);
    expect(reserialized).not.toBe(COMMITTED_POLICY_TEXT); // different bytes...
    expect(digestOfPolicyText(reserialized)).toBe(DIGEST_A); // ...same authority
    // And a substantive change moves it.
    expect(DIGEST_B).not.toBe(DIGEST_A);
    expect(DIGEST_E).not.toBe(DIGEST_A);
  });

  it("buildWriteAuthority refuses a branch name or a missing policy", () => {
    expect(buildWriteAuthority({ source_main_sha: SHA_A, policy: { enabled: true } }).ok).toBe(true);
    for (const bad of ["main", SHA_A.toUpperCase(), SHA_A.slice(0, 7), "", null]) {
      const r: any = buildWriteAuthority({ source_main_sha: bad as any, policy: { enabled: true } });
      expect(r.ok, String(bad)).toBe(false);
      expect(r.reason).toBe("source-main-sha-invalid");
    }
    const noPolicy: any = buildWriteAuthority({ source_main_sha: SHA_A, policy: null });
    expect(noPolicy.ok).toBe(false);
    expect(noPolicy.reason).toBe("authority-policy-missing");
  });

  it("resolveSourceMainSha takes the SHA through a FILE the callee validates (J3)", () => {
    const root = makeRoot();
    const path = join(root, "source-main-sha");
    writeFileSync(path, `${SHA_A}\n`);
    expect(resolveSourceMainSha({ literal: null, filePath: path })).toEqual({ ok: true, sha: SHA_A });
    expect(resolveSourceMainSha({ literal: SHA_A, filePath: null })).toEqual({ ok: true, sha: SHA_A });

    // Exactly one form. Neither is a usage refusal; both is a usage refusal.
    const neither: any = resolveSourceMainSha({ literal: null, filePath: null });
    expect(neither.ok).toBe(false);
    expect(neither.reason).toBe("usage");
    expect(neither.detail).toBe("--source-main-sha or --source-main-sha-file is required");
    const both: any = resolveSourceMainSha({ literal: SHA_A, filePath: path });
    expect(both.ok).toBe(false);
    expect(both.detail).toMatch(/mutually exclusive/);

    const missing: any = resolveSourceMainSha({ literal: null, filePath: join(root, "absent") });
    expect(missing.ok).toBe(false);
    expect(missing.reason).toBe("source-main-sha-unreadable");

    // The callee validates the FILE CONTENT, so a workflow that materialized
    // something else cannot smuggle it through.
    writeFileSync(path, "main\n");
    const branch: any = resolveSourceMainSha({ literal: null, filePath: path });
    expect(branch.ok).toBe(false);
    expect(branch.reason).toBe("source-main-sha-invalid");
  });

  it("the frozen-revision SHA shape is the SAME shape everywhere it appears", () => {
    // frozen-quiescence.mjs re-declares the pattern deliberately (it must stay
    // free of any filesystem-touching import). This pin is what keeps the two
    // declarations from drifting.
    expect(FROZEN_MAIN_SHA_RE.source).toBe(MAIN_SHA_RE.source);
    expect(FROZEN_MAIN_SHA_RE.flags).toBe(MAIN_SHA_RE.flags);
  });
});

// =============================================================================
// The read-only endpoints and their parsers
// =============================================================================
describe("the write-time authority reads", () => {
  it("construct exactly three paths, all of them repository reads", () => {
    expect(repositoryMetadataReadPath(REPO)).toEqual({ ok: true, path: `repos/${REPO}` });
    expect(mainRefReadPath(REPO)).toEqual({ ok: true, path: `repos/${REPO}/git/ref/heads/main` });
    expect(committedPolicyReadPath(REPO, SHA_A)).toEqual({
      ok: true,
      path: `repos/${REPO}/contents/${COMMITTED_POLICY_REPO_PATH}?ref=${SHA_A}`,
    });
    // `?ref=<exact commit>` is what makes this a read of HISTORY rather than of a
    // moving branch — the whole point of pinning authority to a revision.
    expect((committedPolicyReadPath(REPO, SHA_A) as any).path).toContain(`?ref=${SHA_A}`);
    expect(EXPECTED_DEFAULT_BRANCH).toBe("main");
    expect(MAIN_REF).toBe("refs/heads/main");
  });

  it("refuse a repository that is not <owner>/<name>", () => {
    for (const bad of ["", "owner", "owner/name/extra", "../../etc", "owner/name?x=1", null]) {
      for (const build of [repositoryMetadataReadPath, mainRefReadPath]) {
        const r: any = build(bad as any);
        expect(r.ok, `${build.name}(${JSON.stringify(bad)})`).toBe(false);
        expect(r.reason).toBe("authority-read-path-invalid");
      }
    }
    const notASha: any = committedPolicyReadPath(REPO, "main");
    expect(notASha.ok).toBe(false);
    expect(notASha.detail).toMatch(/40 lowercase hex/);
  });

  it("fail closed on any response the protocol cannot read", () => {
    const responses = authorityResponses();
    const meta = JSON.parse(responses.metadata);
    expect(readRepositoryDefaultBranch(meta, { repository: REPO })).toEqual({ ok: true, default_branch: "main" });
    const branchOf = (doc: unknown): any => readRepositoryDefaultBranch(doc, { repository: REPO });
    expect(branchOf({ ...meta, full_name: "other/repo" }).reason).toBe("repository-metadata-unreadable");
    // A default-branch switch is an authority MOVE and must not pass silently.
    expect(branchOf({ ...meta, default_branch: "master" }).reason).toBe("default-branch-moved");

    const ref = JSON.parse(responses.ref);
    expect(readMainRefSha(ref)).toEqual({ ok: true, sha: SHA_A });
    for (const mutate of [
      (r: any) => ({ ...r, ref: "refs/heads/other" }),
      (r: any) => ({ ...r, object: null }),
      (r: any) => ({ ...r, object: { type: "tag", sha: SHA_A } }),
      (r: any) => ({ ...r, object: { type: "commit", sha: "main" } }),
      () => "not an object",
    ]) {
      expect(readMainRefSha(mutate(ref) as any).ok).toBe(false);
      expect((readMainRefSha(mutate(ref) as any) as any).reason).toBe("main-ref-unreadable");
    }

    const contents = JSON.parse(responses.contents);
    const decoded: any = decodeCommittedFile(contents, { expected_path: COMMITTED_POLICY_REPO_PATH });
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe(COMMITTED_POLICY_TEXT);
    for (const mutate of [
      (c: any) => ({ ...c, type: "dir" }),
      (c: any) => ({ ...c, path: ".straylight/other.json" }),
      (c: any) => ({ ...c, encoding: "utf8" }),
      (c: any) => ({ ...c, content: "not base64!!" }),
      (c: any) => ({ ...c, size: 1 }),
    ]) {
      const r: any = decodeCommittedFile(mutate(contents), { expected_path: COMMITTED_POLICY_REPO_PATH });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe("committed-file-unreadable");
    }
  });

  it("authorityStillCurrent orders its refusals revision → policy → consent", () => {
    const parsed: any = parseStrict(COMMITTED_POLICY_TEXT);
    const policy = parsed.value;
    const authority = planAuthority();
    expect(authorityStillCurrent({ authority, current_main_sha: SHA_A, current_policy: policy })).toEqual({ ok: true });
    expect(authorityStillCurrent({ authority, current_main_sha: "main", current_policy: policy }))
      .toMatchObject({ ok: false, refusal: "authority-main-unreadable" });
    expect(authorityStillCurrent({ authority, current_main_sha: SHA_B, current_policy: policy }))
      .toMatchObject({ ok: false, refusal: "authority-main-moved" });
    expect(authorityStillCurrent({ authority, current_main_sha: SHA_A, current_policy: null }))
      .toMatchObject({ ok: false, refusal: "authority-policy-unreadable" });
    expect(authorityStillCurrent({
      authority,
      current_main_sha: SHA_A,
      current_policy: (parseStrict(VARIANT_POLICY_TEXT) as any).value,
    })).toMatchObject({ ok: false, refusal: "authority-policy-digest-mismatch" });
    // LITERAL BOOLEAN, like the policy gate: "true", 1, and {} are not consent.
    for (const enabled of [false, "true", 1, {}, null, undefined]) {
      const other = structuredClone(policy);
      other.enabled = enabled;
      expect(authorityStillCurrent({
        authority: planAuthority({ policy_digest: policyAuthorityDigest(other) }),
        current_main_sha: SHA_A,
        current_policy: other,
      }), JSON.stringify(enabled)).toMatchObject({ ok: false, refusal: "authority-policy-disabled" });
    }
  });
});

// =============================================================================
// H2-T1 … H2-T6 — the executor, against a mock gh only
// =============================================================================
describe("H2-T1 … H2-T6 — the executor re-establishes authority before every mutation", () => {
  it("H2-T1: authority is current ⇒ the mutation is reached, after exactly three GETs", () => {
    const root = makeRoot();
    const gh = makeGh(root, { mainSha: SHA_A, policies: { [SHA_A]: COMMITTED_POLICY_TEXT } });
    const op = findingOp("op-1", root);
    const bodyBytes = readFileSync(join(root, "op-1.json"), "utf8");
    const r = runExecutor(root, makePlan(root, [op]), gh.dir);
    expect(r.status).toBe(0);
    expect(r.out.phase).toBe("execution");
    // The three probes, in order, all GETs: no -X anywhere in a read argv.
    expect(gh.reads()).toEqual([
      `READ: api repos/${REPO}`,
      `READ: api repos/${REPO}/git/ref/heads/main`,
      `READ: api repos/${REPO}/contents/${COMMITTED_POLICY_REPO_PATH}?ref=${SHA_A}`,
    ]);
    expect(gh.reads().join("\n")).not.toMatch(/ -X | --method /);
    expect(gh.writes()).toEqual([`ARGV: api -X POST repos/${REPO}/issues/41/comments --input -`]);
    expect(gh.stdinOf(1)).toBe(bodyBytes);
  });

  it("H2-T2: main moved to a merged freeze ⇒ ZERO mutation attempts, exit 2", () => {
    const { gh, r } = runScenario(SCENARIOS["H2-T2"]);
    expect(r.status).toBe(2);
    expect(r.out.phase).toBe("validation");
    expect(r.out.refusal).toBe("authority-main-moved");
    expect(r.out.detail).toMatch(SCENARIOS["H2-T2"].detail!);
    expect(r.out.detail).toContain("op-1");
    expect(gh.writes()).toEqual([]);
    expect(existsSync(join(gh.dir, "gh-stdin-1"))).toBe(false);
    // Exit 2 guarantees no WRITE was attempted. It does not claim no gh ran —
    // the probes are GETs, and saying otherwise would be false.
    expect(gh.reads()).toHaveLength(3);
  });

  it("H2-T3: a forged source_main_sha with a stale policy digest ⇒ digest mismatch, zero writes", () => {
    const { gh, r } = runScenario(SCENARIOS["H2-T3"]);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("authority-policy-digest-mismatch");
    expect(r.out.detail).toMatch(SCENARIOS["H2-T3"].detail!);
    // Naming the new revision gets the forger past the revision check and no
    // further: the digest is computed HERE, from the bytes committed there.
    expect(r.out.detail).toContain(DIGEST_A);
    expect(r.out.detail).toContain(DIGEST_B);
    expect(gh.writes()).toEqual([]);
  });

  it("H2-T4: a plan correctly bound to the frozen revision ⇒ policy-disabled, zero writes", () => {
    const { gh, r } = runScenario(SCENARIOS["H2-T4"]);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("authority-policy-disabled");
    expect(r.out.detail).toMatch(SCENARIOS["H2-T4"].detail!);
    expect(gh.writes()).toEqual([]);
  });

  it("H2-T5: a stale plan does NOT revive after automation is re-enabled", () => {
    const s = SCENARIOS["H2-T5"];
    // The policy committed at D is byte-for-byte the policy that authorized the
    // plan, so the ONLY thing standing between the stale plan and a write is the
    // revision binding.
    expect(digestOfPolicyText(s.policies[SHA_D]!)).toBe(DIGEST_A);
    const { gh, r } = runScenario(s);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("authority-main-moved");
    expect(r.out.detail).toMatch(s.detail!);
    expect(gh.writes()).toEqual([]);
  });

  it("H2-T5 (continued): the same plan is refused under B, C and D — Section D", () => {
    // The four-transition procedure, walked with ONE plan authored at A.
    const stale = planAuthority({ source_main_sha: SHA_A, policy_digest: DIGEST_A });
    const steps: Array<readonly [string, string, string, string]> = [
      ["B (freeze)", SHA_B, FROZEN_POLICY_TEXT, "authority-main-moved"],
      // C is the append-while-frozen commit. Under the REAL accepted-epoch locks
      // a two-epoch history is not an acceptable policy at all, so the executor
      // refuses at acceptance — BEFORE the authority comparison. Fail-closed
      // either way; recorded honestly rather than dressed up as an authority
      // refusal it is not.
      ["C (append while frozen)", SHA_C, STATE_C_POLICY_TEXT, "policy-invalid"],
      ["D (re-enabled)", SHA_D, COMMITTED_POLICY_TEXT, "authority-main-moved"],
    ];
    for (const [label, mainSha, policy, refusal] of steps) {
      const { gh, r } = runScenario({
        label,
        authority: stale,
        mainSha,
        policies: { [mainSha]: policy },
        refusal,
      });
      expect(r.status, label).toBe(2);
      expect(r.out.refusal, label).toBe(refusal);
      expect(gh.writes(), label).toEqual([]);
    }
  });

  it("H2-T6: authority changes after operation 1 ⇒ operation 2 is never attempted, exit 4", () => {
    const root = makeRoot();
    const op1 = findingOp("op-1", root, 41, "finding:op-1");
    const op2 = findingOp("op-2", root, 42, "finding:op-2");
    const op1Bytes = readFileSync(join(root, "op-1.json"), "utf8");
    // The freeze is merged between the two operations: the FIRST ref read still
    // reports A, every later one reports B, and the policy response follows the
    // ?ref= the executor itself asks for.
    const gh = makeGh(root, {
      mainSha: SHA_A,
      nextMainSha: SHA_B,
      swapAfterRefReads: 1,
      policies: { [SHA_A]: COMMITTED_POLICY_TEXT, [SHA_B]: FROZEN_POLICY_TEXT },
    });
    const r = runExecutor(root, makePlan(root, [op1, op2]), gh.dir);
    expect(r.status).toBe(4); // execution began ⇒ never exit 2
    expect(r.out.phase).toBe("execution");
    expect(r.out.refusal).toBe("authority-main-moved");
    expect(r.out.detail).toContain("op-2");
    expect(r.out.results).toEqual([{ op_id: "op-1", kind: "post-watchdog-finding", status: "ok" }]);
    // Operation 1 landed and is not rolled back; operation 2 never launched.
    expect(gh.writes()).toEqual([`ARGV: api -X POST repos/${REPO}/issues/41/comments --input -`]);
    expect(gh.stdinOf(1)).toBe(op1Bytes);
    expect(existsSync(join(gh.dir, "gh-stdin-2"))).toBe(false);
    // Six reads: three per operation. The check is per MUTATION, not per plan.
    expect(gh.reads()).toHaveLength(6);
  });

  it("the probes are per operation, not once at executor startup", () => {
    const root = makeRoot();
    const gh = makeGh(root, { mainSha: SHA_A, policies: { [SHA_A]: COMMITTED_POLICY_TEXT } });
    const ops = [
      findingOp("op-1", root, 41, "finding:op-1"),
      findingOp("op-2", root, 42, "finding:op-2"),
      findingOp("op-3", root, 43, "finding:op-3"),
    ];
    const r = runExecutor(root, makePlan(root, ops), gh.dir);
    expect(r.status).toBe(0);
    expect(gh.writes()).toHaveLength(3);
    expect(gh.reads()).toHaveLength(9);
  });

  it("a probe that cannot be answered is a refusal, not an assumption of authority", () => {
    const root = makeRoot();
    // The committed policy at the reported main is missing from the fixture set,
    // so the third GET fails. Nothing about that is evidence that authority holds.
    const gh = makeGh(root, { mainSha: SHA_A, policies: { [SHA_B]: COMMITTED_POLICY_TEXT } });
    const r = runExecutor(root, makePlan(root, [findingOp("op-1", root)]), gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("authority-read-failed");
    expect(r.out.detail).toMatch(/committed policy/);
    expect(gh.writes()).toEqual([]);
  });

  it("a default-branch switch is an authority move, not a curiosity", () => {
    const root = makeRoot();
    const gh = makeGh(root, {
      mainSha: SHA_A,
      policies: { [SHA_A]: COMMITTED_POLICY_TEXT },
      defaultBranch: "master",
    });
    const r = runExecutor(root, makePlan(root, [findingOp("op-1", root)]), gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("default-branch-moved");
    expect(gh.writes()).toEqual([]);
    expect(gh.reads()).toHaveLength(1); // refused at the FIRST probe
  });

  it("an authority refusal is never warning-only, even for a derived label", () => {
    // Labels are projections that reconverge, so a non-zero API RESULT on them is
    // warning-only. A label is still a durable GitHub write, so an AUTHORITY
    // refusal on one is fatal.
    const root = makeRoot();
    const gh = makeGh(root, { mainSha: SHA_B, policies: { [SHA_B]: FROZEN_POLICY_TEXT } });
    const op = { op_id: "op-1", kind: "remove-derived-label", issue_number: 41, label: "cp-merged" };
    const r = runExecutor(root, makePlan(root, [op]), gh.dir);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("authority-main-moved");
    expect(gh.writes()).toEqual([]);
  });
});

// =============================================================================
// Section H — a post-freeze run cannot write, proven twice independently
// =============================================================================
describe("a run that reaches the executor after a freeze cannot write", () => {
  it("the PLANNING gate refuses the frozen policy (exit 3) and admits the live one (exit 0)", () => {
    const root = makeRoot();
    const frozen = join(root, "frozen-policy.json");
    writeFileSync(frozen, FROZEN_POLICY_TEXT);
    const live = join(root, "live-policy.json");
    writeFileSync(live, COMMITTED_POLICY_TEXT);

    const denied = runPolicyGate(frozen);
    expect(denied.status).toBe(3); // a VALID kill switch: freeze, not failure
    expect(denied.out).toMatchObject({ ok: true, enabled: false, refusal: "automation-disabled" });

    const allowed = runPolicyGate(live);
    expect(allowed.status).toBe(0);
    expect(allowed.out).toEqual({ ok: true, enabled: true });
  });

  it("...and the EXECUTOR refuses the same freeze on its own, having consulted no gate", () => {
    const { gh, r } = runScenario(SCENARIOS["H2-T4"]);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("authority-policy-disabled");
    expect(gh.writes()).toEqual([]);
    // The two halves are independent: the executor loads the policy itself, from
    // GitHub, at the exact revision — it does not read the gate's verdict, the
    // local checkout, or an environment variable.
    const code = readFileSync(EXECUTOR, "utf8").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(code).not.toMatch(/policy-gate|POLICY_GATE|automation-policy\.json"/);
    expect(code).toMatch(/acceptCommittedPolicyText/);
  });
});

// =============================================================================
// The mutation harness — every authority comparison is load-bearing
// =============================================================================
describe("mutation harness — removing any part of the write-time check lets a stale plan write", () => {
  const MUTANTS: Array<{ label: string; mutations: Mutation[]; unlocks: ScenarioKey[] }> = [
    {
      label: "M1 the per-operation authority call is removed (the H-02 defect itself)",
      mutations: [{
        file: "bin/execute-write-plan.mjs",
        from: "requireCurrentAuthority(op);",
        to: "void op;",
      }],
      unlocks: ["H2-T2", "H2-T4"],
    },
    {
      label: "M2 the revision comparison is removed",
      mutations: [{
        file: "lib/write-authority.mjs",
        from: "if (current_main_sha !== authority.source_main_sha) {",
        to: "if (false) {",
      }],
      unlocks: ["H2-T5"],
    },
    {
      label: "M3 the enabled === true comparison is removed",
      mutations: [{
        file: "lib/write-authority.mjs",
        from: "if (current_policy.enabled !== true) {",
        to: "if (false) {",
      }],
      unlocks: ["H2-T4"],
    },
    {
      label: "M4 the policy digest comparison is removed",
      mutations: [{
        file: "lib/write-authority.mjs",
        from: "if (currentDigest !== authority.policy_digest) {",
        to: "if (false) {",
      }],
      unlocks: ["same-revision-different-policy"],
    },
  ];

  const GUARDED: ScenarioKey[] = ["H2-T2", "H2-T3", "H2-T4", "H2-T5", "same-revision-different-policy"];

  it("the unmutated STAGED build refuses every guarded scenario with zero writes", () => {
    const sl = stageStraylight();
    const executor = join(sl, "bin", "execute-write-plan.mjs");
    for (const key of GUARDED) {
      const s = SCENARIOS[key];
      const { gh, r } = runScenario(s, executor);
      expect(r.status, key).toBe(2);
      expect(r.out.refusal, key).toBe(s.refusal);
      expect(gh.writes(), key).toEqual([]);
    }
  });

  it("each mutant WRITES where the real build refuses", () => {
    for (const m of MUTANTS) {
      const sl = stageStraylight(m.mutations);
      const executor = join(sl, "bin", "execute-write-plan.mjs");
      for (const key of m.unlocks) {
        const { gh, r } = runScenario(SCENARIOS[key], executor);
        expect(r.status, `${m.label} / ${key}`).toBe(0);
        expect(gh.writes(), `${m.label} / ${key}`).toEqual([
          `ARGV: api -X POST repos/${REPO}/issues/41/comments --input -`,
        ]);
      }
    }
  });

  it("M1 is precisely the finding Codex demonstrated: a stale plan mutating past a merged freeze", () => {
    const sl = stageStraylight(MUTANTS[0]!.mutations);
    const executor = join(sl, "bin", "execute-write-plan.mjs");
    // A plan authored while enabled: true, executing while enabled: false is the
    // committed state of main. The mutant performs the durable write and reports
    // success; the real build refuses before the first mutation.
    const { gh: mutantGh, r: mutant } = runScenario(SCENARIOS["H2-T2"], executor);
    expect(mutant.status).toBe(0);
    expect(mutantGh.writes()).toHaveLength(1);
    expect(mutantGh.reads()).toHaveLength(0); // it does not even ask
    const { gh: realGh, r: real } = runScenario(SCENARIOS["H2-T2"]);
    expect(real.status).toBe(2);
    expect(realGh.writes()).toEqual([]);
  });
});

// =============================================================================
// Section E — the write-capable set is DERIVED, never listed
// =============================================================================
describe("the closed write-capable workflow set", () => {
  const workflowFiles = () =>
    readdirSync(WORKFLOW_DIR)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .sort()
      .map((f) => ({ path: `${WORKFLOW_DIR}/${f}`, text: readFileSync(join(WORKFLOW_DIR, f), "utf8") }));

  it("derived from THIS repository's workflow files, is exactly the four control-plane workflows", () => {
    const derived: any = writeCapableWorkflows(workflowFiles());
    expect(derived.ok, derived.ok ? "" : derived.detail).toBe(true);
    expect(derived.workflows).toEqual([
      ".github/workflows/straylight-bootstrap.yml",
      ".github/workflows/straylight-merge-guard.yml",
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
    ]);
    // Every derived member really does invoke the ONE durable-write code path,
    // in executable YAML.
    for (const path of derived.workflows) {
      expect(executableYaml(readFileSync(path, "utf8"))).toContain(WRITE_EXECUTOR_ENTRYPOINT);
    }
    // And the repository has other workflows, so this is a filter, not a listing.
    expect(workflowFiles().length).toBeGreaterThan(derived.workflows.length);
  });

  it("scans only the bytes that RUN: a commented invocation neither adds nor keeps a workflow", () => {
    // Blanked from the `#` onward, byte offsets otherwise untouched — including
    // the space the comment was separated by.
    expect(executableYaml("run: a # trailing comment")).toBe("run: a ");
    expect(executableYaml("# whole line")).toBe("");
    expect(executableYaml('run: echo "a # b"')).toBe('run: echo "a # b"');
    expect(executableYaml("run: echo a#b")).toBe("run: echo a#b");

    // A workflow that merely NAMES the executor in prose is AMBIGUOUS: either an
    // invocation was deleted without its comment, or a comment is standing in
    // for one. Both make the set non-derivable, so both refuse.
    const prose: any = writeCapableWorkflows([
      { path: ".github/workflows/a.yml", text: `run: node .straylight/bin/${WRITE_EXECUTOR_ENTRYPOINT}\n` },
      { path: ".github/workflows/b.yml", text: `# we used to call ${WRITE_EXECUTOR_ENTRYPOINT} here\nrun: true\n` },
    ]);
    expect(prose.ok).toBe(false);
    expect(prose.reason).toBe("workflow-scan-ambiguous");
    expect(prose.detail).toMatch(/only in comments/);
  });

  it("refuses an EMPTY derivation — a broken scan would report perfect quiescence over nothing", () => {
    const empty: any = writeCapableWorkflows([{ path: ".github/workflows/a.yml", text: "run: true\n" }]);
    expect(empty.ok).toBe(false);
    expect(empty.reason).toBe("workflow-scan-empty");
    expect(empty.detail).toMatch(/the scan is broken, not that nothing can write/);
  });

  it("refuses malformed input rather than scanning part of it", () => {
    for (const files of [
      null,
      "x",
      [{ path: ".github/workflows/a.yml" }],
      [{ path: 12, text: "" }],
      [{ path: "scripts/a.yml", text: "" }],
      [{ path: ".github/workflows/a.txt", text: "" }],
    ]) {
      const r: any = writeCapableWorkflows(files as any);
      expect(r.ok, JSON.stringify(files)).toBe(false);
      expect(r.reason).toBe("workflow-scan-failed");
    }
  });

  it("treats ONLY the literal terminal status as terminal", () => {
    expect(TERMINAL_RUN_STATUS).toBe("completed");
    expect(runIsActive("completed")).toBe(false);
    for (const status of [
      "queued", "in_progress", "waiting", "requested", "pending", "action_required",
      "COMPLETED", "completed ", "", "something_github_adds_tomorrow", null, undefined,
    ]) {
      expect(runIsActive(status as any), JSON.stringify(status)).toBe(true);
    }
  });

  it("binds every run page to the workflow that was asked about", () => {
    const wf = ".github/workflows/straylight-reducer.yml";
    const ok: any = parseWorkflowRunPages(runPage([apiRun(7, wf, "completed"), apiRun(9, wf, "queued")]), {
      workflow_path: wf,
    });
    expect(ok.ok).toBe(true);
    expect(ok.scanned).toBe(2);
    expect(ok.active).toEqual([{ workflow: wf, run_id: 9, status: "queued", created_at: "2026-08-14T11:50:00Z" }]);

    // Active runs come back in ascending id order however the API listed them.
    const unsorted: any = parseWorkflowRunPages(
      runPage([apiRun(30, wf, "queued"), apiRun(10, wf, "in_progress"), apiRun(20, wf, "waiting")]),
      { workflow_path: wf },
    );
    expect(unsorted.active.map((r: any) => r.run_id)).toEqual([10, 20, 30]);

    const foreign: any = parseWorkflowRunPages(runPage([apiRun(7, ".github/workflows/straylight-watchdog.yml", "queued")]), {
      workflow_path: wf,
    });
    expect(foreign.ok).toBe(false);
    expect(foreign.reason).toBe("run-pages-unusable");
    expect(foreign.detail).toMatch(/describes a different workflow/);

    // Pages LOST during pagination would hide active runs.
    const lost: any = parseWorkflowRunPages(runPage([apiRun(7, wf, "completed")], 9), { workflow_path: wf });
    expect(lost.ok).toBe(false);
    expect(lost.reason).toBe("run-pages-incomplete");
    expect(lost.detail).toMatch(/refusing rather than reporting quiescence over a partial history/);

    for (const [label, text] of [
      ["empty stream", ""],
      ["not JSON", "{"],
      ["no total_count", JSON.stringify({ workflow_runs: [] })],
      ["runs not an array", JSON.stringify({ total_count: 0, workflow_runs: {} })],
      ["run without an id", JSON.stringify({ total_count: 1, workflow_runs: [{ path: wf, status: "queued", created_at: "2026-08-14T11:50:00Z" }] })],
      ["run without a status", JSON.stringify({ total_count: 1, workflow_runs: [{ id: 1, path: wf, created_at: "2026-08-14T11:50:00Z" }] })],
      ["run with a loose created_at", JSON.stringify({ total_count: 1, workflow_runs: [{ id: 1, path: wf, status: "queued", created_at: "2026-08-14 11:50" }] })],
    ] as Array<[string, string]>) {
      const r: any = parseWorkflowRunPages(text, { workflow_path: wf });
      expect(r.ok, label).toBe(false);
      expect(r.reason, label).toBe("run-pages-unusable");
    }
    expect((parseWorkflowRunPages(runPage([]), { workflow_path: "reducer" }) as any).reason).toBe("run-pages-unusable");
  });

  it("a document recording a run still in flight is inadmissible, and says not to cancel it", () => {
    const doc = {
      schema: QUIESCENCE_SCHEMA,
      repository: REPO,
      frozen_main_sha: SHA_B,
      checked_at: "2026-08-14T11:59:00Z",
      write_capable_workflows: [".github/workflows/straylight-reducer.yml"],
      active_write_runs: [{
        workflow: ".github/workflows/straylight-reducer.yml",
        run_id: 42424242,
        status: "in_progress",
        created_at: "2026-08-14T11:58:00Z",
      }],
    };
    const v: any = validateFrozenQuiescence(doc);
    expect(v.ok).toBe(false);
    expect(v.errors.join("; ")).toMatch(/1 write-capable run\(s\) were still in flight/);
    expect(v.errors.join("; ")).toMatch(/do not cancel them/);
    // With nothing in flight the same document is admissible.
    expect(validateFrozenQuiescence({ ...doc, active_write_runs: [] }).ok).toBe(true);
  });
});

// =============================================================================
// H2-T7 … H2-T10 — the read-only quiescence CLI
// =============================================================================
describe("H2-T7 … H2-T10 — verify-frozen-quiescence, read-only against a mock gh", () => {
  const frozenAt = (sha: string) => ({ mainSha: sha, policies: { [sha]: FROZEN_POLICY_TEXT } });
  const REDUCER = "straylight-reducer.yml";

  it("H2-T9: exact frozen main, committed freeze, nothing in flight ⇒ accepted", () => {
    const root = makeRoot();
    const gh = makeGh(root, frozenAt(SHA_B));
    const r = runQuiescence(gh.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]);
    expect(r.status).toBe(0);
    const v: any = validateFrozenQuiescence(r.out);
    expect(v.ok, v.ok ? "" : v.errors.join("; ")).toBe(true);
    expect(r.out.schema).toBe(QUIESCENCE_SCHEMA);
    expect(r.out.repository).toBe(REPO);
    expect(r.out.frozen_main_sha).toBe(SHA_B);
    expect(r.out.active_write_runs).toEqual([]);
    expect(r.out.checked_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    // The recorded set is the one DERIVED from this repository's own workflows —
    // fetched from the FROZEN COMMIT, not read off the local checkout.
    expect(r.out.write_capable_workflows).toEqual([
      ".github/workflows/straylight-bootstrap.yml",
      ".github/workflows/straylight-merge-guard.yml",
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
    ]);
    // Read-only: not one mutation was issued.
    expect(gh.writes()).toEqual([]);
    expect(gh.reads().join("\n")).not.toMatch(/ -X /);
    // Two complete independent scans, plus three main-identity reads.
    const runReads = gh.reads().filter((l) => l.includes("/actions/workflows/"));
    expect(runReads).toHaveLength(8);
    expect(gh.reads().filter((l) => l.endsWith("/git/ref/heads/main"))).toHaveLength(3);
    // The workflow universe came from the frozen commit's tree: the directory
    // listing and EVERY file were read at `?ref=<frozen sha>`.
    const treeReads = gh.reads().filter((l) => l.includes("/contents/.github/workflows"));
    expect(treeReads).toHaveLength(1 + REAL_WORKFLOW_FILES.length);
    for (const line of treeReads) expect(line).toContain(`?ref=${SHA_B}`);
    expect(treeReads.filter((l) => l.includes(`/contents/${WORKFLOW_DIR}?ref=`))).toHaveLength(1);

    // --out writes the same document to a file instead of stdout.
    const outPath = join(root, "quiescence.json");
    const written = runQuiescence(gh.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B, "--out", outPath]);
    expect(written.status).toBe(0);
    const onDisk = JSON.parse(readFileSync(outPath, "utf8"));
    expect(validateFrozenQuiescence(onDisk).ok).toBe(true);
    expect(onDisk.write_capable_workflows).toEqual(r.out.write_capable_workflows);
  });

  it("H2-T7: a QUEUED write-capable run ⇒ REFUSE, naming the run, without cancelling it", () => {
    const root = makeRoot();
    const gh = makeGh(root, {
      ...frozenAt(SHA_B),
      runs: { [REDUCER]: runPage([apiRun(90210, `${WORKFLOW_DIR}/${REDUCER}`, "queued")]) },
    });
    const r = runQuiescence(gh.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("not-quiescent");
    expect(r.out.detail).toContain(`${WORKFLOW_DIR}/${REDUCER}`);
    expect(r.out.detail).toContain("run 90210");
    expect(r.out.detail).toContain("queued");
    expect(r.out.detail).toMatch(/do NOT cancel them/);
    expect(gh.writes()).toEqual([]);
  });

  it("H2-T8: an IN_PROGRESS run ⇒ REFUSE; and so does a status nobody has seen before", () => {
    for (const status of ["in_progress", "waiting", "requested", "pending", "something_new"]) {
      const root = makeRoot();
      const gh = makeGh(root, {
        ...frozenAt(SHA_B),
        runs: { [REDUCER]: runPage([apiRun(7, `${WORKFLOW_DIR}/${REDUCER}`, status)]) },
      });
      const r = runQuiescence(gh.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]);
      expect(r.status, status).toBe(2);
      expect(r.out.reason, status).toBe("not-quiescent");
      expect(r.out.detail, status).toContain(status);
      expect(gh.writes(), status).toEqual([]);
    }
    // ...and a run that has REACHED the terminal status is not in flight.
    const root = makeRoot();
    const gh = makeGh(root, {
      ...frozenAt(SHA_B),
      runs: { [REDUCER]: runPage([apiRun(7, `${WORKFLOW_DIR}/${REDUCER}`, "completed")]) },
    });
    expect(runQuiescence(gh.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]).status).toBe(0);
  });

  it("H2-T10: main moving during verification ⇒ REFUSE, at either checkpoint", () => {
    // swapAfterRefReads=1: the check BETWEEN the two scans sees the move.
    const betweenRoot = makeRoot();
    const between = makeGh(betweenRoot, {
      ...frozenAt(SHA_B),
      nextMainSha: SHA_D,
      swapAfterRefReads: 1,
      policies: { [SHA_B]: FROZEN_POLICY_TEXT, [SHA_D]: COMMITTED_POLICY_TEXT },
    });
    const r1 = runQuiescence(between.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]);
    expect(r1.status).toBe(2);
    expect(r1.out.reason).toBe("main-moved");
    expect(r1.out.detail).toContain("between the two run scans");
    expect(r1.out.detail).toContain(`current main is ${SHA_D}, not the frozen ${SHA_B}`);
    expect(between.writes()).toEqual([]);

    // swapAfterRefReads=2: both scans complete and the FINAL identity check,
    // immediately before the document is emitted, sees the move.
    const finalRoot = makeRoot();
    const atEnd = makeGh(finalRoot, {
      ...frozenAt(SHA_B),
      nextMainSha: SHA_D,
      swapAfterRefReads: 2,
      policies: { [SHA_B]: FROZEN_POLICY_TEXT, [SHA_D]: COMMITTED_POLICY_TEXT },
    });
    const r2 = runQuiescence(atEnd.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]);
    expect(r2.status).toBe(2);
    expect(r2.out.reason).toBe("main-moved");
    expect(atEnd.reads().filter((l) => l.includes("/actions/workflows/"))).toHaveLength(8);
    expect(atEnd.writes()).toEqual([]);
  });

  it("the frozen revision must be named EXPLICITLY, and must be a commit", () => {
    const root = makeRoot();
    const gh = makeGh(root, frozenAt(SHA_B));
    const noRepo = runQuiescence(gh.dir, ["--frozen-main-sha", SHA_B]);
    expect(noRepo.status).toBe(2);
    expect(noRepo.out).toMatchObject({ ok: false, reason: "usage" });

    const noSha = runQuiescence(gh.dir, ["--repo", REPO]);
    expect(noSha.status).toBe(2);
    expect(noSha.out.reason).toBe("usage");
    expect(noSha.out.detail).toMatch(/name the frozen revision explicitly/);

    for (const bad of ["main", SHA_B.toUpperCase(), SHA_B.slice(0, 7), "HEAD"]) {
      const r = runQuiescence(gh.dir, ["--repo", REPO, "--frozen-main-sha", bad]);
      expect(r.status, bad).toBe(2);
      expect(r.out.reason, bad).toBe("frozen-main-sha-invalid");
    }
    // Refused before ANY read: the tool never guesses which revision is meant.
    expect(gh.reads()).toEqual([]);
  });

  it("refuses when the named revision is not current main, or is not frozen", () => {
    const movedRoot = makeRoot();
    const moved = makeGh(movedRoot, { mainSha: SHA_D, policies: { [SHA_D]: COMMITTED_POLICY_TEXT } });
    const r1 = runQuiescence(moved.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]);
    expect(r1.status).toBe(2);
    expect(r1.out.reason).toBe("main-moved");
    expect(r1.out.detail).toMatch(/not the committed state of main/);

    // Current main IS the named revision, but the policy there still permits
    // writes. Quiescence is only meaningful under a committed freeze.
    const liveRoot = makeRoot();
    const live = makeGh(liveRoot, { mainSha: SHA_A, policies: { [SHA_A]: COMMITTED_POLICY_TEXT } });
    const r2 = runQuiescence(live.dir, ["--repo", REPO, "--frozen-main-sha", SHA_A]);
    expect(r2.status).toBe(2);
    expect(r2.out.reason).toBe("not-frozen");
    expect(r2.out.detail).toMatch(/enabled must be the boolean false/);
    expect(live.writes()).toEqual([]);

    // A policy that does not pass the full accepted-policy validation is not a
    // freeze either, however its kill switch reads.
    const brokenRoot = makeRoot();
    const broken = makeGh(brokenRoot, { mainSha: SHA_C, policies: { [SHA_C]: STATE_C_POLICY_TEXT } });
    const r3 = runQuiescence(broken.dir, ["--repo", REPO, "--frozen-main-sha", SHA_C]);
    expect(r3.status).toBe(2);
    expect(r3.out.reason).toBe("policy-invalid");

    // And a default-branch switch refuses before the freeze is even examined.
    const branchRoot = makeRoot();
    const branch = makeGh(branchRoot, { ...frozenAt(SHA_B), defaultBranch: "master" });
    const r4 = runQuiescence(branch.dir, ["--repo", REPO, "--frozen-main-sha", SHA_B]);
    expect(r4.status).toBe(2);
    expect(r4.out.reason).toBe("default-branch-moved");
  });

  it("is GET-only by construction, and cancels nothing", () => {
    const src = readFileSync(QUIESCENCE_CLI, "utf8");
    const code = src.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(code).toMatch(/const argv = paginate \? \["api", "--paginate", path\] : \["api", path\];/);
    expect(code).not.toMatch(/--method|-X\b|"POST"|"PATCH"|"PUT"|"DELETE"/);
    expect(code).not.toMatch(/\brun\s+cancel\b|\/runs\/[^"'\s]*\/cancel|gh pr |gh issue /);
    expect(src).toMatch(/NEVER cancels a run/);
    // Importing must not fetch.
    expect(code).toMatch(/if \(invokedDirectly\(\)\) main\(\);/);
    // The proof itself lives in the shared library, and so does the refusal that
    // tells the operator not to cancel what it found. "cancel" DOES appear there
    // — in that sentence. What must not appear anywhere is a cancellation being
    // ISSUED, and the library cannot issue one: it has no transport of its own.
    const lib = readFileSync(LIVE_QUIESCENCE_LIB, "utf8");
    const libCode = lib.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(libCode).toMatch(/do NOT cancel them/);
    expect(libCode).not.toMatch(/--method|-X\b|"POST"|"PATCH"|"PUT"|"DELETE"/);
    expect(libCode).not.toMatch(/\brun\s+cancel\b|\/runs\/[^"'\s]*\/cancel|gh pr |gh issue /);
    // Every path it asks for is built by write-authority's read-path builders,
    // and the only verb it ever passes to the injected transport is a read.
    expect(libCode).not.toMatch(/execFileSync|spawnSync|fetch\(/);
  });
});

// =============================================================================
// H2-T12 — every plan producer names the revision that authorized it
// =============================================================================
describe("H2-T12 — no plan can be produced without its authority binding", () => {
  const PRODUCERS = [
    ".straylight/bin/plan-bootstrap-write.mjs",
    ".straylight/bin/plan-merge-guard-write.mjs",
    ".straylight/bin/plan-reducer-writes.mjs",
    ".straylight/lib/watchdog-plan.mjs",
  ];
  const ENTRYPOINTS = [
    ".straylight/bin/plan-bootstrap-write.mjs",
    ".straylight/bin/plan-merge-guard-write.mjs",
    ".straylight/bin/plan-reducer-writes.mjs",
    ".straylight/bin/plan-watchdog-writes.mjs",
  ];
  const code = (path: string) =>
    readFileSync(path, "utf8").split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");

  it("the producer set is DERIVED from the source, not listed here", () => {
    const derived = [".straylight/bin", ".straylight/lib"]
      .flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith(".mjs")).map((f) => `${dir}/${f}`))
      .filter((path) => code(path).includes("schema: WRITE_PLAN_SCHEMA"))
      .sort();
    expect(derived).toEqual([...PRODUCERS].sort());
  });

  it("EVERY plan literal in EVERY producer carries an authority binding", () => {
    for (const path of PRODUCERS) {
      const c = code(path);
      const literals = c.split("schema: WRITE_PLAN_SCHEMA").length - 1;
      const bindings = (c.match(/^\s+authority[,:]/gm) ?? []).length;
      expect(literals, path).toBeGreaterThan(0);
      expect(bindings, path).toBe(literals);
    }
  });

  it("every producer entry point resolves the source SHA through the ONE shared resolver", () => {
    for (const path of ENTRYPOINTS) {
      const c = code(path);
      expect(c.split("resolveSourceMainSha(").length - 1, path).toBe(1);
      expect(c, path).toMatch(/--source-main-sha-file/);
    }
  });

  it("and REFUSES to plan at all when the run cannot name its own revision", () => {
    // Every other required argument is supplied; only the source SHA is missing.
    // The paths deliberately do not exist: the refusal must come BEFORE any
    // evidence is read, so a run that cannot name its revision never even looks.
    const absent = "/nonexistent/cp-authority-fixture";
    const invocations: Array<[string, string[]]> = [
      [".straylight/bin/plan-bootstrap-write.mjs", [
        "--pages-1", absent, "--pages-2", absent, "--labels", absent,
        "--request-root", absent, "--repository", REPO, "--nonce", NONCE, "--base-sha", SHA_A,
      ]],
      [".straylight/bin/plan-merge-guard-write.mjs", [
        "--gather-1", absent, "--gather-2", absent, "--issue-number", "122",
        "--request-root", absent, "--repository", REPO, "--nonce", NONCE,
        "--now", "2026-08-14T12:00:00Z", "--claim", absent, "--read-ledger", absent,
      ]],
      [".straylight/bin/plan-reducer-writes.mjs", [
        "--stage", "a", "--gather-1", absent, "--gather-2", absent, "--issue-number", "122",
        "--repository", REPO, "--nonce", NONCE, "--now", "2026-08-14T12:00:00Z",
      ]],
      [".straylight/bin/plan-watchdog-writes.mjs", [
        "--collection-a", absent, "--collection-b", absent, "--ledger-a", absent, "--ledger-b", absent,
        "--request-root", absent, "--repository", REPO, "--nonce", NONCE, "--now", "2026-08-14T12:00:00Z",
      ]],
    ];
    for (const [cli, args] of invocations) {
      let status = 0;
      let stdout = "";
      try {
        stdout = execFileSync(process.execPath, [cli, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      } catch (e: any) {
        status = e.status ?? -1;
        stdout = typeof e.stdout === "string" ? e.stdout : "";
      }
      expect(status, cli).toBe(2);
      expect(JSON.parse(stdout.trim()), cli).toEqual({
        ok: false,
        reason: "usage",
        detail: "--source-main-sha or --source-main-sha-file is required",
      });
    }
  });

  it("every workflow planner invocation passes the SHA its own checkout materialized", () => {
    const files = readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith(".yml")).sort();
    let invocations = 0;
    for (const file of files) {
      const raw = readFileSync(join(WORKFLOW_DIR, file), "utf8");
      // Join shell line continuations so one invocation is one string, then read
      // only the bytes that run.
      const joined = executableYaml(raw).replace(/\\\n\s*/g, " ");
      for (const invocation of joined.match(/node \.straylight\/bin\/plan-[a-z-]+\.mjs[^\n]*/g) ?? []) {
        invocations += 1;
        expect(invocation, `${file}: ${invocation.slice(0, 60)}`)
          .toContain('--source-main-sha-file "${{ steps.revision.outputs.sha_file }}"');
      }
      if (invocations > 0 && raw.includes("plan-")) continue;
    }
    // Bootstrap 1, merge guard 2 (its reducer probe + its own planner), reducer 3,
    // watchdog 1.
    expect(invocations).toBe(7);

    // And the value is DERIVED from the checkout, in a file the planner reads and
    // validates itself (J3) — bash never substitutes it into an argument.
    for (const file of [
      "straylight-bootstrap.yml", "straylight-merge-guard.yml",
      "straylight-reducer.yml", "straylight-watchdog.yml",
    ]) {
      const c = executableYaml(readFileSync(join(WORKFLOW_DIR, file), "utf8"));
      expect(c, file).toMatch(/git rev-parse HEAD > "\$\{SHA_DIR\}\/source-main-sha"/);
      expect(c, file).toMatch(/echo "sha_file=\$\{SHA_DIR\}\/source-main-sha" >> "\$GITHUB_OUTPUT"/);
    }
  });
});

// =============================================================================
// What this does NOT claim
// =============================================================================
describe("the residual window is documented, not claimed away", () => {
  it("the executor states plainly that GitHub offers no compare-and-write", () => {
    const src = readFileSync(EXECUTOR, "utf8");
    expect(src).toMatch(/RESIDUAL TOCTOU/);
    expect(src).toMatch(/GitHub offers no compare-and-write/);
    expect(src).toMatch(/This is NOT an atomic\s+\/\/\s+compare-and-write/);
    // The honest scope: what is closed is the H-02 case, not the microsecond.
    expect(src).toMatch(/a plan continuing to write minutes or hours after a freeze became/);
    expect(src).not.toMatch(/atomically|guarantees no write can/);
  });

  it("the quiescence tool states plainly that two scans are not a snapshot", () => {
    const src = readFileSync(QUIESCENCE_CLI, "utf8");
    expect(src).toMatch(/Not a transactional snapshot/);
    expect(src).toMatch(/strong evidence, not an atomic guarantee/);
  });

  it("the pure libraries stay pure: no clock, no network, no process, no policy file", () => {
    for (const path of [".straylight/lib/frozen-quiescence.mjs"]) {
      const src = readFileSync(path, "utf8");
      expect(src).not.toMatch(/readFileSync|new Date|Date\.now|process\.env|execFileSync|spawnSync|fetch\(/);
      const imports = (src.match(/^import .*$/gm) ?? []).join("\n");
      expect(imports).toBe(
        'import { parsePageStream } from "./evidence.mjs";\n' +
          'import { parseIsoInstant, REPO_RE } from "./validate.mjs";',
      );
    }
    // write-authority.mjs reads exactly ONE file — the small SHA file a workflow
    // materialized from its own checkout — and nothing else.
    const authority = readFileSync(".straylight/lib/write-authority.mjs", "utf8");
    expect(authority).not.toMatch(/new Date|Date\.now|process\.env|execFileSync|spawnSync|fetch\(/);
    expect((authority.match(/readFileSync\(/g) ?? [])).toHaveLength(1);
    expect(authority).toMatch(/readFileSync\(resolve\(filePath\), "utf8"\)\.trim\(\)/);

    // live-quiescence.mjs performs the LIVE proof, yet owns no I/O: the transport
    // and the clock are injected by the CLI. That is what lets the same bounded
    // algorithm serve the verifier and the frontier capture without either one
    // being able to substitute a document for a look at the world.
    const live = readFileSync(LIVE_QUIESCENCE_LIB, "utf8");
    expect(live).not.toMatch(/readFileSync|new Date|Date\.now|process\.env|execFileSync|spawnSync|fetch\(/);
    expect(live).toMatch(/export function proveFrozenQuiescence\(\{ repository, frozen_main_sha, read, now,/);
  });
});
