// Phase 50A R3 — the CLOSED TRIGGER CONTRACT.
//
// The claim this suite establishes: the Phase 50A proof workflow runs for EVERY
// pull request, its manual exact-head path is bounded to one required SHA input,
// and the exact-head safeguards downstream of that trigger are intact.
//
// ── WHY THIS IS NOT ANOTHER PARSER ──────────────────────────────────────
//
// Two successive models of this proof were reopened, and both failed the same
// way: they ENUMERATED the repository paths that must start the workflow, mirrored
// that enumeration into an `on.pull_request.paths` filter, and then compared the
// two sides. Coverage of what is DECLARED says nothing about what must be
// declared, so the comparison could be satisfied by shrinking the declaration.
// Worse, the workflow side of the comparison was produced by a parser of the
// workflow's own bytes, and a mutation that removed a real trigger while making
// the parser SYNTHESIZE it in its return value left every focused test green: the
// proof laundered a missing required trigger through the code it was validating.
//
// The abstraction, not its implementation, was the defect. It is retired. There is
// no paths filter, no manifest of trigger inputs, no extractor, no parser, and no
// byte offsets. Trigger completeness is now a property of the TRIGGER ITSELF — an
// unconditional `pull_request` — so there is nothing left to enumerate and nothing
// left to compare.
//
// What stands in its place is this file: a SMALL, FAIL-CLOSED, DIRECT-BYTE
// contract that
//
//   * reads the workflow's ACTUAL BYTES from disk, with `readFileSync`, and asks
//     no other module for anything. There is no intermediate representation and
//     therefore nothing that could synthesize a value, a span, or an offset for
//     this contract to trust;
//   * ACCEPTS exactly ONE top-level `on:` declaration whose significant lines are
//     BYTE-IDENTICAL to `CANONICAL_ON_LINES` below — spelled out here, in the
//     contract, so the accepted set is one literal byte sequence rather than
//     anything an interpreter might decide is equivalent;
//   * REJECTS, with a distinct reason code each: a `paths` or `paths-ignore` key
//     anywhere in the file; an absent or duplicated top-level `on:`; any other
//     trigger block content at all — which is what makes a missing, filtered, or
//     parameterized `pull_request`, a missing or broadened `workflow_dispatch`,
//     and a renamed, optional, or additional input all refusals; and the removal
//     of any exact-head safeguard;
//   * is a PURE FUNCTION of the bytes it is given, so its discrimination is proven
//     against in-memory mutations of those bytes rather than assumed.
//
// The in-memory fixtures are inputs to the checker, never claims about the real
// file: the authoritative assertions read the workflow from disk and require ZERO
// violations. The independent disposable-copy probe matrix — which mutates the
// workflow on a copy of the tree and requires the named tests below to fail — is
// `tests/phase-50a/proof-input-coverage-mutations.test.ts`, a separate file for the
// usual reason: a harness beside the tests it targets would match its own cases
// inside the copy and recurse.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** The workflow under contract. Its bytes are the only input to every check. */
const WORKFLOW = '.github/workflows/phase-50a-postgres-conformance.yml';

/**
 * The ONE accepted top-level trigger declaration, byte for byte.
 *
 * An unconditional `pull_request` (no `paths`, no `paths-ignore`, no `branches`,
 * no `types` — no key of any kind), plus a `workflow_dispatch` bounded to exactly
 * one REQUIRED STRING input named `head_sha`.
 *
 * Pinning the literal — rather than interpreting the block and checking
 * properties of the interpretation — is the whole point. There is no parse to
 * defeat, and drift of any kind (including of the description text) is a refusal
 * rather than something a looser check might accept as equivalent.
 */
const CANONICAL_ON_LINES: readonly string[] = [
  'on:',
  '  pull_request:',
  '  workflow_dispatch:',
  '    inputs:',
  '      head_sha:',
  "        description: 'Exact 40-hex commit SHA to check out and assert (required)'",
  '        required: true',
  '        type: string',
];

/**
 * The exact-head safeguards, each pinned to a literal that must appear verbatim.
 *
 * Every one of these is load-bearing for the remote proof being evidence of the
 * head it claims: the 40-hex validation refuses a malformed target, the checkout
 * `ref` pins the exact commit rather than a synthetic merge ref, and the HEAD
 * comparison proves the tree that ran IS that commit.
 */
const EXACT_HEAD_SAFEGUARDS: ReadonlyArray<{ code: string; literal: string; why: string }> = [
  {
    code: 'head-sha-validation-absent',
    literal: '^[0-9a-f]{40}$',
    why: 'the derived target SHA must be validated against the exact 40-hex commit shape',
  },
  {
    code: 'pr-head-source-absent',
    literal: 'github.event.pull_request.head.sha',
    why: 'a pull-request run must derive the ACTUAL PR head, never the synthetic merge SHA',
  },
  {
    code: 'checkout-ref-not-pinned',
    literal: 'ref: ${{ steps.target.outputs.sha }}',
    why: 'the checkout must pin the exact derived SHA as its ref',
  },
  {
    // Pinned to the READ-BACK ITSELF, not to the bare command text: the command
    // also appears in the step name and in an `echo` that prints the value, so a
    // looser literal would be satisfied while the variable the comparison reads was
    // assigned from somewhere else entirely.
    code: 'head-equality-assertion-absent',
    literal: 'actual="$(git rev-parse HEAD)"',
    why: 'the compared value must be READ BACK from git, not assigned from the expectation',
  },
  {
    code: 'head-equality-comparison-absent',
    literal: '"$actual" != "$TARGET_SHA"',
    why: 'reading HEAD back proves nothing unless it is COMPARED to the derived target',
  },
];

/** The step whose completion every substantive command must follow. */
const ASSERT_STEP = 'Assert git rev-parse HEAD equals the exact target head SHA';

/** The substantive commands that must not run before the identity assertion. */
const SUBSTANTIVE_COMMANDS: readonly string[] = [
  'npm ci',
  'npm run build',
  'npm run typecheck',
  'npm test',
  'npm run control-plane:validate',
  'npm run control-plane:test',
  'npm run phase-50a:test',
  'npm run phase-50a:proof',
  'npm run phase-50a:verify-artifact',
];

interface Violation {
  code: string;
  detail: string;
}

/**
 * The contract. A pure function of the workflow's bytes; returns EVERY violation
 * it finds, so a caller can require a specific one to be absent.
 *
 * Fail-closed in both directions: unusable input is a violation (never a vacuous
 * pass), and an unrecognized trigger block is a violation (never assumed
 * equivalent to the canonical one).
 */
function triggerContractViolations(text: unknown): Violation[] {
  if (typeof text !== 'string' || text.length === 0) {
    return [{ code: 'workflow-unreadable', detail: 'the workflow bytes must be a non-empty string' }];
  }
  const violations: Violation[] = [];

  // YAML forbids tabs as indentation, and every indentation comparison below
  // would be ambiguous under them.
  if (text.includes('\t')) {
    violations.push({ code: 'tab-indentation', detail: 'the workflow contains a tab character' });
  }

  const lines = text.split('\n');
  const isBlank = (line: string): boolean => line.trim() === '';
  const isComment = (line: string): boolean => line.trim().startsWith('#');
  const isSignificant = (line: string): boolean => !isBlank(line) && !isComment(line);

  // EVERY safeguard and ordering check below runs over the EXECUTABLE text: the
  // document with whole-line comments blanked out. This is load-bearing. The
  // workflow's explanatory comments name several of the literals a safeguard is
  // pinned to, so a check over the raw document would be satisfied by the PROSE
  // ABOUT a safeguard after the safeguard itself had been deleted — the exact
  // shape of vacuity that has already reopened this proof once. Comment lines are
  // BLANKED rather than removed so line count and relative order are preserved,
  // which keeps the positional ordering comparison meaningful.
  const executable = lines.map((line) => (isComment(line) ? '' : line)).join('\n');

  // (1) NO PATH FILTER, ANYWHERE IN THE FILE. Scanned over the whole document
  //     rather than only inside the trigger block: a filter is a refusal wherever
  //     it is written, and this cannot be evaded by moving it.
  const filterLines = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => isSignificant(line) && /^\s*paths(-ignore)?\s*:/.test(line));
  if (filterLines.length > 0) {
    violations.push({
      code: 'path-filter-present',
      detail:
        'the workflow declares a path filter, so it would NOT run for every pull request: ' +
        filterLines.map(({ line, i }) => `line ${i + 1}: ${line.trim()}`).join('; '),
    });
  }

  // (2) EXACTLY ONE top-level `on:`. Two would make "which block is the trigger
  //     block" a question, and YAML's own last-wins rule is not something a
  //     security-relevant contract should inherit silently.
  const topLevelKeys = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => isSignificant(line) && /^[A-Za-z_]/.test(line))
    .map(({ line, i }) => ({ name: /^([A-Za-z_][A-Za-z0-9_-]*)\s*:/.exec(line)?.[1] ?? null, i }));
  const onKeys = topLevelKeys.filter((k) => k.name === 'on');
  if (onKeys.length === 0) {
    violations.push({ code: 'on-declaration-absent', detail: 'no top-level `on:` declaration' });
    return violations; // Nothing further about the trigger block can be said.
  }
  if (onKeys.length > 1) {
    violations.push({
      code: 'on-declaration-duplicated',
      detail: `top-level \`on:\` is declared ${onKeys.length} times, at lines ${onKeys
        .map((k) => k.i + 1)
        .join(', ')}`,
    });
  }

  // (3) THE BLOCK'S SIGNIFICANT LINES ARE THE CANONICAL LITERAL, BYTE FOR BYTE.
  //     The extent runs from the `on:` line to the next top-level key; blank and
  //     whole-line comments inside it are inert and dropped, and anything else at
  //     all must match exactly. Every enumerated trigger rejection — a missing,
  //     filtered, or parameterized `pull_request`; a missing or broadened
  //     `workflow_dispatch`; a renamed, optional, or additional input; an
  //     unsupported trigger — is a mismatch here.
  const onIndex = onKeys[0]!.i;
  const nextTopLevel = topLevelKeys.find((k) => k.i > onIndex)?.i ?? lines.length;
  const actual = [lines[onIndex]!, ...lines.slice(onIndex + 1, nextTopLevel)].filter(isSignificant);
  if (
    actual.length !== CANONICAL_ON_LINES.length ||
    actual.some((line, i) => line !== CANONICAL_ON_LINES[i])
  ) {
    violations.push({
      code: 'trigger-block-not-canonical',
      detail:
        'the trigger declaration is not the canonical block.\nEXPECTED:\n' +
        CANONICAL_ON_LINES.join('\n') +
        '\nACTUAL:\n' +
        actual.join('\n'),
    });
  }

  // (4) EVERY EXACT-HEAD SAFEGUARD IS PRESENT, verbatim, in the EXECUTABLE text.
  //     A comment that merely describes a safeguard does not satisfy it.
  for (const safeguard of EXACT_HEAD_SAFEGUARDS) {
    if (!executable.includes(safeguard.literal)) {
      violations.push({
        code: safeguard.code,
        detail: `the workflow must contain \`${safeguard.literal}\` in executable text — ${safeguard.why}`,
      });
    }
  }

  // (5) THE IDENTITY ASSERTION PRECEDES EVERY SUBSTANTIVE COMMAND.
  //     Compared by position in the file, which is the order the steps run in.
  //     Matched against `run:` COMMAND lines in the executable text rather than any
  //     mention of a command, because the workflow's explanatory comments name
  //     several of these steps and an earlier comment occurrence would make a real
  //     ordering violation invisible.
  const assertAt = executable.indexOf(ASSERT_STEP);
  if (assertAt < 0) {
    violations.push({
      code: 'head-equality-step-absent',
      detail: `the workflow must declare the step \`${ASSERT_STEP}\``,
    });
  } else {
    const commands = [...executable.matchAll(/^ *run: (.+)$/gm)].map((m) => ({
      command: m[1]!.trim(),
      at: m.index!,
    }));
    for (const command of SUBSTANTIVE_COMMANDS) {
      const invocation = commands.find((c) => c.command === command);
      if (invocation === undefined) {
        violations.push({
          code: 'substantive-command-absent',
          detail: `the workflow must run \`${command}\` as a step command`,
        });
      } else if (invocation.at < assertAt) {
        violations.push({
          code: 'head-equality-not-first',
          detail: `\`${command}\` runs BEFORE the exact-head identity assertion`,
        });
      }
    }
  }

  return violations;
}

/** The workflow's actual bytes, read straight from disk. */
function workflowBytes(): string {
  return readFileSync(resolve(REPO_ROOT, WORKFLOW), 'utf8');
}

/** Every violation of the real, checked-in workflow. */
function liveViolations(): Violation[] {
  return triggerContractViolations(workflowBytes());
}

/** Assert one specific violation code is absent from the live workflow. */
function requireNoViolation(code: string): void {
  const offending = liveViolations().filter((v) => v.code === code);
  expect(
    offending,
    `${WORKFLOW} violates the trigger contract [${code}]:\n${offending
      .map((v) => v.detail)
      .join('\n')}`,
  ).toEqual([]);
}

// ── the contract, against the real workflow ─────────────────────────────

describe('Phase 50A R3 — the workflow trigger contract holds over the workflow bytes', () => {
  it('THE CLAIM: the checked-in workflow satisfies the trigger contract completely', () => {
    const violations = liveViolations();
    expect(
      violations,
      `${WORKFLOW} violates the trigger contract:\n${violations
        .map((v) => `[${v.code}] ${v.detail}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED to one required head_sha', () => {
    // The canonical block IS both properties: `pull_request:` carries no key at
    // all, and `workflow_dispatch` carries exactly one required string input.
    requireNoViolation('trigger-block-not-canonical');
    // Stated again against the bytes, so this test's subject is legible without
    // reading the checker: the block appears verbatim in the file.
    expect(workflowBytes(), 'the canonical trigger block must appear verbatim').toContain(
      CANONICAL_ON_LINES.join('\n'),
    );
  });

  it('NO paths or paths-ignore key appears anywhere in the workflow', () => {
    requireNoViolation('path-filter-present');
  });

  it('EXACTLY ONE top-level on: declaration exists', () => {
    requireNoViolation('on-declaration-absent');
    requireNoViolation('on-declaration-duplicated');
  });

  it('the exact 40-hex head-SHA validation is intact', () => {
    requireNoViolation('head-sha-validation-absent');
    requireNoViolation('pr-head-source-absent');
  });

  it('the checkout pins the EXACT derived SHA as its ref', () => {
    requireNoViolation('checkout-ref-not-pinned');
  });

  it('the git rev-parse HEAD equality assertion is intact and precedes every substantive step', () => {
    requireNoViolation('head-equality-assertion-absent');
    requireNoViolation('head-equality-comparison-absent');
    requireNoViolation('head-equality-step-absent');
    requireNoViolation('substantive-command-absent');
    requireNoViolation('head-equality-not-first');
  });
});

// ── the contract's own discrimination, proven not assumed ────────────────

describe('Phase 50A R3 — the trigger contract FAILS CLOSED on every enumerated defect', () => {
  /**
   * Each case mutates the REAL bytes in memory and requires the intended reason
   * code. These are inputs to the checker, never claims about the file on disk:
   * the assertions above are what bind the contract to the real workflow.
   */
  const DEFECTS: ReadonlyArray<{ name: string; mutate: (text: string) => string; code: string }> = [
    {
      name: 'a `paths` filter under pull_request',
      mutate: (s) =>
        s.replace('  pull_request:\n', "  pull_request:\n    paths:\n      - 'src/straylight/**'\n"),
      code: 'path-filter-present',
    },
    {
      name: 'a `paths-ignore` filter under pull_request',
      mutate: (s) =>
        s.replace('  pull_request:\n', "  pull_request:\n    paths-ignore:\n      - 'docs/**'\n"),
      code: 'path-filter-present',
    },
    {
      name: 'pull_request REMOVED from the trigger block',
      mutate: (s) => s.replace('  pull_request:\n', ''),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'pull_request PARAMETERIZED with a branch filter',
      mutate: (s) => s.replace('  pull_request:\n', '  pull_request:\n    branches:\n      - main\n'),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'pull_request PARAMETERIZED with a types filter',
      mutate: (s) =>
        s.replace('  pull_request:\n', '  pull_request:\n    types:\n      - opened\n'),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'workflow_dispatch REMOVED',
      mutate: (s) => s.slice(0, s.indexOf('  workflow_dispatch:')) + s.slice(s.indexOf('\n# Least privilege') + 1),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'workflow_dispatch BROADENED with an additional input',
      mutate: (s) =>
        s.replace(
          '        type: string\n',
          "        type: string\n      target_repo:\n        description: 'extra'\n        required: false\n        type: string\n",
        ),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'the head_sha input RENAMED',
      mutate: (s) => s.replace('      head_sha:\n', '      commit_sha:\n'),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'the head_sha input made OPTIONAL',
      mutate: (s) => s.replace('        required: true\n', '        required: false\n'),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'the head_sha input made a non-string type',
      mutate: (s) => s.replace('        type: string\n', '        type: choice\n'),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'an UNSUPPORTED trigger added to the block',
      mutate: (s) => s.replace('  pull_request:\n', '  pull_request:\n  schedule:\n    - cron: 0 0 * * *\n'),
      code: 'trigger-block-not-canonical',
    },
    {
      name: 'a DUPLICATE top-level on: declaration',
      mutate: (s) => s.replace('\npermissions:\n', '\non:\n  push:\n\npermissions:\n'),
      code: 'on-declaration-duplicated',
    },
    {
      name: 'the top-level on: declaration REMOVED entirely',
      mutate: (s) =>
        s.slice(0, s.indexOf('on:\n  pull_request:')) + s.slice(s.indexOf('\n# Least privilege') + 1),
      code: 'on-declaration-absent',
    },
    {
      // Mutates the EXECUTABLE grep, leaving the comment that describes it in
      // place — the case a raw-document check would have passed vacuously.
      name: 'the exact 40-hex head-SHA validation REMOVED (comment left in place)',
      mutate: (s) => s.replace("grep -Eq '^[0-9a-f]{40}$'", "grep -Eq '.*'"),
      code: 'head-sha-validation-absent',
    },
    {
      name: 'the PR head source redirected to the synthetic merge SHA (comment left in place)',
      mutate: (s) =>
        s.replace(
          'PR_HEAD_SHA: ${{ github.event.pull_request.head.sha }}',
          'PR_HEAD_SHA: ${{ github.sha }}',
        ),
      code: 'pr-head-source-absent',
    },
    {
      name: 'the checkout ref REDIRECTED away from the derived SHA',
      mutate: (s) =>
        s.replace('ref: ${{ steps.target.outputs.sha }}', 'ref: ${{ github.event.pull_request.head.ref }}'),
      code: 'checkout-ref-not-pinned',
    },
    {
      name: 'the checkout ref REMOVED',
      mutate: (s) => s.replace('          ref: ${{ steps.target.outputs.sha }}\n', ''),
      code: 'checkout-ref-not-pinned',
    },
    {
      // The compared value is assigned from the EXPECTATION instead of read back
      // from git, so the comparison is tautological. The step name and the `echo`
      // still mention the command, which is why the safeguard pins the assignment.
      name: 'the HEAD read-back replaced by the expectation (step name left in place)',
      mutate: (s) => s.replace('actual="$(git rev-parse HEAD)"', 'actual="$TARGET_SHA"'),
      code: 'head-equality-assertion-absent',
    },
    {
      name: 'the HEAD equality COMPARISON removed, leaving only the print',
      mutate: (s) => s.replace('"$actual" != "$TARGET_SHA"', '1 -eq 1'),
      code: 'head-equality-comparison-absent',
    },
    {
      name: 'the identity assertion STEP removed',
      mutate: (s) => s.replace(ASSERT_STEP, 'Print some values'),
      code: 'head-equality-step-absent',
    },
    {
      name: 'a substantive command moved BEFORE the identity assertion',
      mutate: (s) =>
        s.replace(
          '      - name: Derive and validate the exact target head SHA\n',
          '      - name: Premature install\n        run: npm ci\n\n      - name: Derive and validate the exact target head SHA\n',
        ),
      code: 'head-equality-not-first',
    },
    {
      name: 'a substantive command REMOVED',
      mutate: (s) => s.replace('        run: npm run phase-50a:verify-artifact\n', ''),
      code: 'substantive-command-absent',
    },
    {
      name: 'TAB indentation',
      mutate: (s) => s.replace('  pull_request:\n', '\tpull_request:\n'),
      code: 'tab-indentation',
    },
  ];

  for (const defect of DEFECTS) {
    it(`REFUSES ${defect.name}`, () => {
      const original = workflowBytes();
      const mutated = defect.mutate(original);
      expect(mutated, `the ${defect.name} fixture must actually change the bytes`).not.toBe(original);
      const codes = triggerContractViolations(mutated).map((v) => v.code);
      expect(codes, `${defect.name} must be refused as ${defect.code}`).toContain(defect.code);
    });
  }

  it('refuses UNUSABLE input rather than passing vacuously', () => {
    for (const input of ['', undefined, null, 42, {}, []]) {
      expect(
        triggerContractViolations(input).map((v) => v.code),
        `input ${JSON.stringify(input) ?? 'undefined'} must be refused`,
      ).toContain('workflow-unreadable');
    }
  });

  it('NON-VACUITY: the contract accepts the real bytes and rejects every fixture', () => {
    // A checker that returned violations for everything would make every test
    // above pass while proving nothing. The real workflow must be ACCEPTED.
    expect(liveViolations()).toEqual([]);
    // And every fixture must be rejected, so the accepted set is genuinely narrow.
    const original = workflowBytes();
    for (const defect of DEFECTS) {
      expect(
        triggerContractViolations(defect.mutate(original)).length,
        `${defect.name} must produce at least one violation`,
      ).toBeGreaterThan(0);
    }
  });

  it('the contract asks NO other module for anything about the workflow', () => {
    // The rejected models derived the workflow side of their comparison from a
    // module that a mutation could make synthesize a value. This contract reads
    // the bytes itself; prove there is no intermediary by checking this file's own
    // imports.
    const self = readFileSync(resolve(REPO_ROOT, 'tests/phase-50a/workflow-trigger-contract.test.ts'), 'utf8');
    const imports = [...self.matchAll(/^import\s[\s\S]*?from\s+'([^']+)';$/gm)].map((m) => m[1]!);
    expect(
      imports.filter((spec) => spec.startsWith('.')),
      'the trigger contract must import no project module',
    ).toEqual([]);
    expect(imports.sort()).toEqual(['node:fs', 'node:path', 'node:url', 'vitest']);
    // And no YAML library reached for dynamically either. Checked as an IMPORT
    // SPECIFIER rather than as free text, so the `.yml` in the workflow's own
    // filename does not read as a parser dependency.
    expect(
      imports.filter((spec) => /(?:^|\/)(?:yaml|js-yaml)(?:\/|$)/i.test(spec)),
      'the contract must import no YAML parser',
    ).toEqual([]);
    expect(
      /\brequire\s*\(|\bimport\s*\(/.test(self),
      'the contract must acquire no capability dynamically',
    ).toBe(false);
  });
});
