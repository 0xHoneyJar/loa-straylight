// Phase 50A R3 — THE ENVELOPE: the proof path contains no interpreter.
//
// Authority: coordinator task packet comment 5169022573.
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
  it('every import specifier is a node: builtin', () => {
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
    expect(new Set(specifiers)).toEqual(
      new Set(['node:child_process', 'node:crypto', 'node:fs', 'node:path', 'node:url']),
    );
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
      'SCHEDULE',
      'IDENTITY_PROBE',
      'REFUSAL',
      'runFixedProof',
      'renderReport',
      'renderReceipts',
      'digestOfFile',
    ]) {
      expect(dts, `declarations must cover ${name}`).toContain(name);
    }
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
