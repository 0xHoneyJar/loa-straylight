// Phase 50A R3 — THE ENVELOPE: the proof path contains no interpreter.
//
// Authority: coordinator task packet comment 5184357042 (packet digest
// sha256:012433fec0b46ef7fdaea0444165fb986c086145507c3da38c7b352958b4fd25),
// posted by event 5184414449 at lane sequence 60. The sequence-54 audit
// recorded that this header still named superseded packet 5169022573; it now
// names the packet actually in force.
//
// The sequence-41 REJECT was not caused by a bug inside a recognizer; it was
// caused by there BEING a recognizer. Every version of the trigger proof had
// unsupported forms, and each reopened audit found another one. So the
// correction's central claim is negative: the proof path contains no mechanism
// that could have unsupported forms.
//
// This suite is that claim, made executable. It asserts over the executor's RAW
// source text — with NO comment stripping, deliberately.
//
// WHY RAW TEXT IS THE RIGHT CHOICE HERE, AND WAS THE WRONG CHOICE THERE. The
// rejected checker scanned comment-blanked text to prove a safeguard was
// PRESENT; blanking was load-bearing there, because a comment restating a
// literal would satisfy a presence check after the real safeguard was deleted
// (and blanking only whole-line comments is exactly how it was defeated). This
// suite proves constructs are ABSENT. For an absence check the bias runs the
// safe way: a mention inside a comment can only make the test FAIL on clean
// code — it can never hide a real construct. So there is no stripping step to
// be defeated, and the executor's own prose is written to avoid the forbidden
// spellings rather than relying on being excused for them.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const EXECUTOR_REL = 'scripts/phase-50a/fixed-proof-executor.mjs';
const EXECUTOR_ABS = resolve(ROOT, EXECUTOR_REL);
const DECLARATIONS_ABS = resolve(ROOT, 'scripts/phase-50a/fixed-proof-executor.d.mts');
const WRAPPER_ABS = resolve(ROOT, '.github/workflows/phase-50a-postgres-conformance.yml');

function executorSource(): string {
  return readFileSync(EXECUTOR_ABS, 'utf8');
}

// ── 1. No interpreter of any kind ──────────────────────────────────────

describe('Phase 50A R3 envelope — the executor contains no interpreter', () => {
  // Each entry names a construct whose ABSENCE is the correction's claim, and
  // the reason it is forbidden. A single table so a reader can see the whole
  // envelope at once.
  const forbidden: Array<{ what: string; needles: string[]; why: string }> = [
    {
      what: 'a markup parser or markup library',
      needles: ['yaml', 'YAML', 'js-yaml', 'safeLoad', 'parseDocument'],
      why: 'parsing the workflow is what had unsupported forms; the wrapper is only ever hashed',
    },
    {
      what: 'a line-oriented scanner over workflow text',
      needles: ["split('\\n')", 'split("\\n")', '.split(/\\r?\\n/)', 'readLines'],
      why: 'a line model is a content recognizer, and every one of them had a form it did not model',
    },
    {
      what: 'comment stripping or blanking',
      needles: ['isComment', 'stripComment', 'blankComment', 'startsWith(\'#\')', 'startsWith("#")'],
      why: 'the rejected checker blanked whole-line comments only; inline comments then satisfied deleted safeguards',
    },
    {
      what: 'positional or line/column provenance',
      needles: ['lineNumber', 'columnOf', 'charIndex', 'byteOffset', '.index!'],
      why: 'offsets were the second rejected model: they were never bound to a real declaration',
    },
    {
      what: 'a shell parser or command-word splitter',
      needles: ['splitWords', 'tokenizeCommand', 'shellSplit', 'commandWords', 'parseCommand'],
      why: 'commands are fixed argv arrays; nothing ever needs to be split back apart',
    },
    {
      what: 'dynamic code evaluation',
      needles: ['eval(', 'new Function', 'vm.runIn', 'Function('],
      why: 'the schedule must be committed data, not constructed behavior',
    },
    {
      what: 'dynamic module or command loading',
      needles: ['await import(', 'require(', 'createRequire', 'import(/*'],
      why: 'behavior must not be acquirable at runtime — the executor runs before npm ci',
    },
    {
      what: 'a shell launch',
      needles: ['shell: true', 'shell:true', 'execSync', 'child_process.exec', 'exec('],
      why: 'a shell would reinterpret arguments; every launch is shell:false with an argv array',
    },
    {
      what: 'configuration loading',
      needles: ['JSON.parse(readFileSync', 'loadConfig', 'readConfig', 'dotenv'],
      why: 'the schedule and the pinned digest must not be overridable by a file',
    },
  ];

  for (const { what, needles, why } of forbidden) {
    it(`contains no ${what} — ${why}`, () => {
      const src = executorSource();
      for (const needle of needles) {
        expect(src, `${what}: found ${JSON.stringify(needle)}`).not.toContain(needle);
      }
    });
  }

  it('SPAWNSYNC IS GONE from the production launch path', () => {
    // THE SEQUENCE-54 BLOCKER, asserted as an absence. The synchronous primitive
    // cannot express whole-tree containment: its own bound terminates the DIRECT
    // child only, which is how six real descendants survived into runner
    // cleanup. It is REPLACED, not wrapped — so it must appear nowhere, not as a
    // primary mechanism, not as a fallback, and not as an injectable default.
    const src = executorSource();
    expect(src, 'no synchronous launch primitive').not.toContain('spawnSync');
    expect(src, 'no synchronous launch import').not.toContain('execFileSync');
    // The asynchronous primitive is imported under an explicit local alias, and
    // it is the ONLY default the launch seam can fall back to.
    expect(src).toContain('import { spawn as nodeSpawn } from "node:child_process";');
    expect(
      [...src.matchAll(/spawn = nodeSpawn/g)],
      'the async primitive is the only injection default',
    ).toHaveLength(2);
  });

  it('every launch creates its OWN process group, and no bound is delegated', () => {
    const src = executorSource();
    // `detached` is what makes one group id name the whole tree; without it the
    // descendants land in the parent's group and cannot be signalled separately.
    expect(src).toContain('detached: true');
    // THE BOUND IS NOT DELEGATED. A `timeout` option on the launch would reach
    // the direct child alone — the exact defect being replaced — so the module
    // owns the clock instead.
    expect(src, 'no delegated bound option').not.toMatch(/^\s+timeout: entry\.timeout_ms,$/m);
    expect(src, 'the module owns the clock').toContain('setTimeout(() => {');
    // Termination and the liveness probe both address the GROUP, by negative pid.
    expect(src).toContain('process.kill(-pgid, sig)');
    expect(src).toContain('process.kill(-pgid, 0)');
  });

  it('containment is VERIFIED before anything is reported, and fails closed', () => {
    const src = executorSource();
    // Escalation exists and is uncatchable.
    expect(src).toContain('"SIGKILL"');
    expect(src).toContain('"SIGTERM"');
    // Reaping is OBSERVED from the child's own exit, never inferred from time.
    expect(src).toContain('reaped = true;');
    // The absence probe fails closed: only a definite "no such process group"
    // proves absence, so an unknown error reports "still present".
    expect(src).toContain('if (e && e.code === "ESRCH") return false;');
    expect(src).toContain('return true;');
    // SIX distinct outcome classes, each with its own refusal code.
    for (const field of [
      'spawnFailed',
      'terminationFailed',
      'containmentFailed',
      'timedOut',
      'signalled',
      'failed',
    ]) {
      expect(src, `the ${field} class exists`).toContain(field);
    }
    expect(src).toContain('commandTerminationFailed');
    expect(src).toContain('commandContainmentUnverified');
  });

  it('reads the wrapper as RAW BYTES and only hashes them', () => {
    const src = executorSource();
    // readFileSync WITHOUT an encoding → a Buffer. The digest is taken over
    // those bytes before any decoding.
    expect(src).toContain('readFileSync(resolve(repoRoot, WRAPPER_PATH))');
    expect(src).toContain('createHash("sha256").update(wrapperBytes)');
    // The wrapper's bytes are never decoded to text anywhere in the executor.
    expect(src).not.toContain('wrapperBytes.toString');
    // Exactly one comparison decides wrapper authorization.
    const comparisons = [...src.matchAll(/wrapperDigest !== EXPECTED_WRAPPER_DIGEST/g)];
    expect(comparisons, 'exactly one wrapper authorization comparison').toHaveLength(1);
  });

  it('the only workflow fact used for authorization is the raw-byte digest', () => {
    const src = executorSource();
    // No substring/regex recognition of workflow CONTENT. The only regex in the
    // file is the anchored 40-hex SHA shape, which is about the SHA, not the
    // workflow.
    const regexLiterals = [...src.matchAll(/= \/(.+?)\/[gimsuy]*;/g)].map((m) => m[1]);
    expect(regexLiterals).toEqual(['^[0-9a-f]{40}$']);
  });
});

// ── 2. Builtins only ───────────────────────────────────────────────────

describe('Phase 50A R3 envelope — the executor depends on Node builtins alone', () => {
  it('the import set is EXACTLY the packet-enumerated set', () => {
    const src = executorSource();
    const specifiers = [...src.matchAll(/^import\s+[^'"]*from\s+["']([^"']+)["'];?$/gm)].map(
      (m) => m[1]!,
    );
    expect(specifiers.length, 'the executor imports something').toBeGreaterThan(0);
    for (const spec of specifiers) {
      expect(spec, `${spec} must be a node: builtin`).toMatch(/^node:/);
    }
    // This is what lets `npm ci` be the FIRST entry of the schedule rather than
    // a precondition of running the executor at all.
    //
    // THE SET BELOW IS THE PACKET'S, transcribed from
    // `fixed_executor_contract.permitted_imports` in coordinator packet comment
    // 5178032683 — NOT a set observed from the executor and copied here. The
    // sequence-46 audit reopened exactly that: the previous version of this
    // assertion had been widened to admit `node:url` because the executor
    // imported it, which proves local self-consistency instead of conformance
    // to the authorized dependency contract. A test that amends the enumerated
    // set to match the code cannot detect the code exceeding the set.
    expect(new Set(specifiers)).toEqual(
      new Set(['node:child_process', 'node:crypto', 'node:fs', 'node:path']),
    );
  });

  it('no path-conversion builtin survives — the module locates itself natively', () => {
    // The packet's four-specifier set is only reachable because the module's own
    // directory and file path come from Node 22's `import.meta` rather than from
    // a URL conversion. Asserted by absence AND by presence, so removing the
    // import without adopting the replacement fails here rather than silently.
    const src = executorSource();
    expect(src, 'node:url must be gone').not.toContain('node:url');
    expect(src, 'fileURLToPath must be gone').not.toContain('fileURLToPath');
    expect(src).toContain('import.meta.dirname');
    expect(src).toContain('import.meta.filename');
  });

  it('the executor runs with no node_modules present', () => {
    // Proven structurally above; asserted here as intent so a future reader
    // knows the ordering constraint is deliberate and load-bearing.
    const src = executorSource();
    expect(src).toContain('BEFORE `npm ci`');
    expect(src).not.toContain("from 'vitest'");
  });

  it('the declarations file exists and describes the same seam', () => {
    const dts = readFileSync(DECLARATIONS_ABS, 'utf8');
    for (const name of [
      'EXPECTED_WRAPPER_DIGEST',
      'EXPECTED_HEAD_ENV',
      'NPM_TOKEN_INGRESS_ENV',
      'NPM_TOKEN_CHILD_ENV',
      'AUTHENTICATED_ENTRY_LABEL',
      'SCHEDULE',
      'IDENTITY_PROBE',
      'REFUSAL',
      'childEnv',
      'runFixedProof',
      'renderReport',
      'renderReceipts',
      'digestOfFile',
    ]) {
      expect(dts, `declarations must cover ${name}`).toContain(name);
    }
  });
});

// ── 2b. One credential path, and no way around it ──────────────────────
//
// STRUCTURAL companion to the behavioural proofs in
// `tests/phase-50a/fixed-proof-executor.test.ts`, which drive the PRODUCTION
// seam and assert over the real options objects. These assertions establish the
// weaker but independent claim that there is only ONE construction site to
// audit in the first place — a second one would make the behavioural proof's
// coverage of "every child" unverifiable by inspection.

describe('Phase 50A R3 envelope — exactly one child environment is ever constructed', () => {
  it('only childEnv assigns an env option, and only realRun calls the spawn seam', () => {
    const src = executorSource();
    // Exactly one function builds a child environment...
    expect([...src.matchAll(/export function childEnv\(/g)], 'one constructor').toHaveLength(1);
    // ...exactly one call site consumes it as a spawn option...
    expect([...src.matchAll(/env: childEnv\(/g)], 'one env assignment').toHaveLength(1);
    // ...and no other `env:` option is passed to any launch.
    const envOptions = [...src.matchAll(/^\s+env: (.*)$/gm)].map((m) => m[1]!.trim());
    expect(envOptions).toEqual(['childEnv(entry, token, baseEnv),']);
    // The spawn seam is called exactly once in the whole file.
    expect([...src.matchAll(/\bspawn\(entry\.file\b/g)], 'one spawn call').toHaveLength(1);
  });

  it('both token names are SKIPPED BY NAME before either value is read', () => {
    // CHANGED SHAPE, AND WHY. This previously asserted a copy-then-delete
    // construction. The sequence-54 audit proved that shape re-read BOTH
    // credential properties on every one of the thirteen constructions, because
    // the copy happened first — so the "read once" claim was false even though
    // the spawn boundary was safe. The constructor now enumerates NAMES and
    // skips the two credential names BEFORE reading any value, and this
    // assertion pins that shape instead.
    const src = executorSource();
    const skipIngress = src.indexOf('if (name === NPM_TOKEN_INGRESS_ENV) continue;');
    const skipChild = src.indexOf('if (name === NPM_TOKEN_CHILD_ENV) continue;');
    const copy = src.indexOf('env[name] = baseEnv[name];');
    const setChild = src.indexOf('env[NPM_TOKEN_CHILD_ENV] = token;');
    expect(skipIngress, 'the ingress name is skipped').toBeGreaterThan(-1);
    expect(skipChild, 'the registry name is skipped').toBeGreaterThan(-1);
    expect(copy, 'every other name is forwarded').toBeGreaterThan(-1);
    expect(setChild, 'the registry name is set').toBeGreaterThan(-1);
    // ORDER IS LOAD-BEARING: both skips precede the value read, so neither
    // credential property is ever read while building a child...
    expect(skipIngress).toBeLessThan(copy);
    expect(skipChild).toBeLessThan(copy);
    // ...and both precede the single conditional set, so that set is the only
    // way either name can be present in a child at all.
    expect(skipIngress).toBeLessThan(setChild);
    expect(skipChild).toBeLessThan(setChild);
    // NO WHOLESALE COPY of the source environment anywhere: that construct is
    // precisely what made the previous read-once claim false.
    expect(src, 'no spread of the source environment').not.toContain('{ ...baseEnv }');
    expect(src, 'no copy-then-remove of the ingress').not.toContain('delete env[NPM_TOKEN_INGRESS_ENV]');
    expect(src, 'no copy-then-remove of the registry name').not.toContain('delete env[NPM_TOKEN_CHILD_ENV]');
    // The set is guarded by the authenticated LABEL, not by an argv or index guess.
    expect(src).toContain('if (entry.label === AUTHENTICATED_ENTRY_LABEL) {');
    // And it is the ONLY assignment of the registry name anywhere in the file.
    expect(
      [...src.matchAll(/env\[NPM_TOKEN_CHILD_ENV\] =/g)],
      'exactly one registry-name assignment',
    ).toHaveLength(1);
  });

  it('the ingress has ONE lexical read site, and no published text interpolates a token', () => {
    // SCOPE OF THIS ASSERTION, STATED HONESTLY. A source-text count CANNOT see a
    // property read performed by a spread or by `Object.assign`, which is exactly
    // how the previous slice's "read once" claim survived while being false
    // (sequence-54: fourteen real reads observed). So this assertion no longer
    // carries that claim. It establishes only the weaker structural fact that
    // there is ONE lexical read site to audit.
    //
    // THE CLAIM ITSELF is proven at RUNTIME, by counting real property accesses
    // against the production seam, in
    // `tests/phase-50a/fixed-proof-executor.test.ts` — see "RUNTIME credential
    // access counts", which also demonstrates that a spread-based constructor
    // fails that proof.
    const src = executorSource();
    expect(
      [...src.matchAll(/env\[NPM_TOKEN_INGRESS_ENV\]/g)],
      'one lexical ingress read site',
    ).toHaveLength(1);
    // The captured binding never reaches a template literal or a receipt field.
    expect(src, 'no token interpolation').not.toContain('${token}');
    expect(src, 'no token interpolation').not.toContain('${ingress}');
    expect(src, 'the receipt carries no environment').not.toMatch(/env:\s*(?:env|token|ingress)\b/);
  });
});

// ── 3. The wrapper delegates, and holds no schedule ────────────────────

describe('Phase 50A R3 envelope — the workflow carries no proof logic', () => {
  it('the wrapper invokes only the fixed executor and declares no other command', () => {
    const text = readFileSync(WRAPPER_ABS, 'utf8');
    const runs = [...text.matchAll(/^\s*run:\s*(.*)$/gm)].map((m) => m[1]!.trim());
    expect(runs).toEqual([`node ${EXECUTOR_REL}`]);
    // No inline script body: a block scalar under `run:` is exactly how the
    // rejected checker's ordering model was defeated.
    expect(text, 'no block-scalar run body').not.toContain('run: |');
    expect(text, 'no folded run body').not.toContain('run: >');
  });

  it('the wrapper enumerates no proof command of its own', () => {
    const text = readFileSync(WRAPPER_ABS, 'utf8');
    // The proof commands live in the executor's committed schedule. Their
    // absence from the workflow is what makes the YAML uninteresting to a
    // mutation: there is nothing in it to reorder or hide.
    for (const command of [
      'npm run build',
      'npm run typecheck',
      'npm run control-plane:validate',
      'npm run control-plane:test',
      'npm run phase-50a:test',
      'npm run phase-50a:proof',
      'npm run phase-50a:verify-artifact',
      'git diff --check',
      'docker exec',
    ]) {
      expect(text, `the workflow must not run \`${command}\` itself`).not.toContain(command);
    }
  });
});
