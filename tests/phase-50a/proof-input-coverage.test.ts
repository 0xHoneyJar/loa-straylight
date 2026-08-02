// Phase 50A R3 — the CLOSED COVERAGE MODEL.
//
// The claim this suite establishes: every repository path whose content can change
// the Phase 50A proof's verdict can also START the workflow that runs that proof.
// If it could not, a pull request touching such a path would flip the proof's
// conclusions without the proof ever running, making the required remote proof
// bypassable — and live repository state has no branch protection, no ruleset, and
// no other pre-merge workflow that would run the suites instead.
//
// ── WHAT REPLACED WHAT ──────────────────────────────────────────────────
//
// The rejected model declared the input set inside the no-leak suite's own source
// (marked comment blocks) and EXTRACTED it from there to compare against the
// workflow. Three independent mutations survived it:
//
//   (a) DELETING a declared input left every focused test green — `uncovered == []`
//       is satisfied MORE EASILY by a smaller declaration. "Everything declared is
//       covered" says nothing about what must be declared.
//   (b) TRUNCATING the extractor (`slice(1)`) left everything green — a shorter
//       set still had full coverage.
//   (c) REPLACING the extractor so it SYNTHESIZED a path the workflow no longer
//       declared left everything green. The proof laundered a missing required
//       trigger through the extractor it was validating.
//
// The closed model removes the extractor entirely:
//
//   * the input set is CHECKED-IN DATA — `tests/phase-50a/proof-input-manifest.json`
//     — and the no-leak suite READS ITS INPUTS FROM it rather than restating them,
//     so there is ONE declaration and nothing to extract;
//   * the workflow side is a BOUNDED SEMANTIC PARSE of the workflow's own raw
//     bytes (`scripts/phase-50a/workflow-trigger-parser.mjs`), structural rather
//     than fixed-offset, which fails closed on every malformation;
//   * the comparison is MANIFEST against PARSED WORKFLOW. Neither side is derived
//     from the other, so neither can launder a defect in the other;
//   * the required set of uncovered manifest roots is EMPTY. There is NO exception
//     mechanism of any kind — not a renamed one, not an empty one — so there is
//     nothing to append a new exception to;
//   * every path is returned WITH the byte offset it was read from, so a parser
//     that invented one could not produce matching bytes. Provenance is verified
//     here rather than trusted.
//
// The independent probe/mutation matrix over this model is in
// `proof-input-coverage-mutations.test.ts` — a separate file for the same reason
// as the R2 matrix: its harness runs vitest against a mutated copy with
// `-t <name>`, and a harness beside the tests it targets would match its own cases
// inside the copy and recurse.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  MANIFEST_PATH,
  REPO_ROOT,
  WORKFLOW_PATH,
  filterCovers,
  manifestTrackedFiles,
  readManifest,
  trackedFilesUnder,
  uncoveredRoots,
} from '../../scripts/phase-50a/proof-input-manifest.mjs';
import { parseWorkflowTriggers } from '../../scripts/phase-50a/workflow-trigger-parser.mjs';

/** The workflow's raw bytes — the only input to the workflow side. */
function workflowBytes(): string {
  return readFileSync(resolve(REPO_ROOT, WORKFLOW_PATH), 'utf8');
}

/** The parsed trigger declaration, required to parse. */
function parsedTriggers() {
  const parsed = parseWorkflowTriggers(workflowBytes());
  if (!parsed.ok) {
    throw new Error(`the workflow trigger block must parse: ${parsed.reason} — ${parsed.detail}`);
  }
  return parsed;
}

/** The declared `pull_request.paths` filters, values only. */
function triggerFilters(): string[] {
  return parsedTriggers().pullRequestPaths.map((p) => p.value);
}

// ── the coverage claim ──────────────────────────────────────────────────

describe('Phase 50A R3 — the manifest is the single declaration and it is fully covered', () => {
  it('the manifest is non-empty and every declared root resolves to at least one real tracked file', () => {
    const manifest = readManifest();
    expect(manifest.roots.length, 'the manifest must not be vacuous').toBeGreaterThan(5);
    for (const root of manifest.roots) {
      // `trackedFilesUnder` THROWS when a root resolves to nothing, so a typo'd or
      // stale root cannot silently contribute an empty set.
      const files = trackedFilesUnder(root.path, root.kind);
      expect(files.length, `${root.path} must cover at least one tracked file`).toBeGreaterThan(0);
      expect(root.why.trim().length, `${root.path} must record WHY it is an input`).toBeGreaterThan(
        0,
      );
    }
  });

  it('every real tracked file under a declared root is INSIDE the manifest coverage', () => {
    // The direction that stops a declared root being narrowed while files remain
    // under it: a root's own tracked files must all be covered, so replacing
    // `src/straylight` with `src/straylight/storage/postgres` fails.
    const manifest = readManifest();
    const covered = new Set(manifestTrackedFiles());
    for (const root of manifest.roots) {
      for (const file of trackedFilesUnder(root.path, root.kind)) {
        expect(covered.has(file), `${file} lies under ${root.path} and must be covered`).toBe(true);
      }
    }
    expect(covered.size, 'the covered set must be substantial').toBeGreaterThan(40);
  });

  it('THE CLAIM: the set of manifest roots NOT covered by the parsed workflow triggers is EMPTY', () => {
    const manifest = readManifest();
    const filters = triggerFilters();
    expect(filters.length, 'the workflow must declare trigger filters').toBeGreaterThan(5);

    const uncovered = uncoveredRoots(manifest.roots, filters);

    // EMPTY. Not "an accepted set", not a subset check. `[]` is the only shape
    // that cannot be widened by appending a new exception — which is exactly how
    // the previous accepted-gap list made the remote proof bypassable.
    expect(
      uncovered,
      'every manifest root must be able to START the workflow; the uncovered set must be empty',
    ).toEqual([]);

    // Anti-vacuity: an EMPTY manifest would also produce an empty uncovered set,
    // and would do so for entirely the wrong reason. The comparison must have
    // examined a real, non-trivial set on both sides.
    expect(manifest.roots.length).toBeGreaterThan(5);
    expect(manifestTrackedFiles().length).toBeGreaterThan(40);

    // And no catch-all filter is the reason coverage holds.
    expect(filters).not.toContain('**');
    expect(filters).not.toContain('*');
    expect(filters).not.toContain('**/*');

    // Every root is individually covered, so the aggregate cannot pass while a
    // specific load-bearing root is stranded.
    for (const root of manifest.roots) {
      expect(
        uncoveredRoots([root], filters),
        `manifest root ${root.path} must trigger the workflow`,
      ).toEqual([]);
    }
  });

  it('EVERY tracked file the manifest covers is individually able to start the workflow', () => {
    // The file-level form of the same claim. A root could in principle be
    // "covered" while some file beneath it was not, if a filter shape were
    // narrower than the root; this rules that out file by file.
    const filters = triggerFilters();
    const uncoveredFiles = manifestTrackedFiles().filter(
      (file) => !filters.some((f) => filterCovers(f, file)),
    );
    expect(uncoveredFiles, 'no manifest-covered file may be unable to start the workflow').toEqual(
      [],
    );
  });

  it('SELF-TRIGGER: the manifest and every proof file that consumes it are trigger inputs', () => {
    // A change to the coverage model must not be able to merge without running the
    // proof. Asserted mechanically against the PARSED trigger set.
    const filters = triggerFilters();
    for (const path of [
      MANIFEST_PATH,
      'scripts/phase-50a/proof-input-manifest.mjs',
      'scripts/phase-50a/workflow-trigger-parser.mjs',
      'tests/phase-50a/proof-input-coverage.test.ts',
      'tests/phase-50a/proof-input-coverage-mutations.test.ts',
      'tests/phase-50a/no-leak-and-neutrality.test.ts',
      WORKFLOW_PATH,
    ]) {
      expect(
        filters.some((f) => filterCovers(f, path)),
        `${path} must itself be a workflow trigger input`,
      ).toBe(true);
      // And it must be manifest-covered, so it is also SCANNED, not merely
      // watched.
      expect(manifestTrackedFiles(), `${path} must be manifest-covered`).toContain(path);
    }
  });

  it('NO EXCEPTION MECHANISM of any kind exists in the coverage model', () => {
    // Behavioural first, because a rename defeated the previous name-based guard:
    // plant a genuinely uncovered root and require the comparison to REPORT it.
    // Any mechanism that absorbs exceptions — a list, a set, a predicate, a
    // rename — makes this fail, because an absorbed root would not be reported.
    const filters = triggerFilters();
    const planted = { path: 'src-uncovered-probe', kind: 'file' as const, why: 'probe' };
    expect(filterCovers('src/straylight/**', planted.path)).toBe(false);
    // Compared directly (not through `uncoveredRoots`, which resolves tracked
    // files) because the probe is deliberately not a real path.
    expect(
      filters.some((f) => filterCovers(f, planted.path)),
      'the planted probe must be genuinely uncovered',
    ).toBe(false);

    // Stripping a real root's coverage must report exactly that root.
    const manifest = readManifest();
    for (const root of manifest.roots) {
      const covering = filters.filter((f) => filterCovers(f, root.path));
      expect(covering.length, `${root.path} must be covered by at least one filter`).toBeGreaterThan(
        0,
      );
      const without = filters.filter((f) => !covering.includes(f));
      expect(
        uncoveredRoots([root], without),
        `stripping coverage for ${root.path} must REPORT it as uncovered`,
      ).toEqual([root.path]);
    }

    // Structural backstop, WIDENED from the previous five-identifier list to any
    // exception-shaped declaration in the MODEL's own files — the manifest, its
    // consumer, and the parser. A supplement to the behavioural check above, not
    // the whole defence.
    //
    // The TEST files are deliberately not scanned this way. A test that proves an
    // exception mechanism is absent must be able to name what it is looking for,
    // and scanning this file's own identifiers would flag the very check below.
    // The behavioural assertions above are what cover the test side, and they do
    // not care what a filter is called or where it lives.
    for (const file of [
      'scripts/phase-50a/proof-input-manifest.mjs',
      'scripts/phase-50a/workflow-trigger-parser.mjs',
    ]) {
      const text = readFileSync(resolve(REPO_ROOT, file), 'utf8');
      const suspicious = [
        ...text.matchAll(/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=/gm),
      ]
        .map((m) => m[1]!)
        .filter((name) =>
          /(?:KNOWN|ACCEPTED|ALLOWED|TOLERATED|IGNORED|SKIP|EXEMPT|WAIVED|DEBT|EXCLUDE|EXCEPTION|GAP)/i.test(
            name,
          ),
        );
      expect(
        suspicious,
        `${file}: no accepted-gap / exception-shaped constant may be declared`,
      ).toEqual([]);
    }

    // And the manifest DATA declares no exception-shaped key, at either level —
    // checked over the parsed JSON's own keys, so this is a property of the data
    // rather than of any source text.
    const manifestJson = JSON.parse(readFileSync(resolve(REPO_ROOT, MANIFEST_PATH), 'utf8')) as {
      roots: Record<string, unknown>[];
    } & Record<string, unknown>;
    const exceptionShaped = (key: string): boolean =>
      /(?:known|accepted|allowed|tolerated|ignored|skip|exempt|waived|debt|exclude|exception|gap)/i.test(
        key,
      );
    expect(
      Object.keys(manifestJson).filter(exceptionShaped),
      'the manifest must declare no exception-shaped top-level key',
    ).toEqual([]);
    for (const root of manifestJson.roots) {
      expect(
        Object.keys(root).filter(exceptionShaped),
        'no manifest root may carry an exception-shaped key',
      ).toEqual([]);
    }
  });

  it('NO EXTRACTOR-DERIVED AUTHORITY: neither side of the comparison is read from the other', () => {
    // The rejected model's decisive defect. The manifest is DATA read from its own
    // file; the workflow set is PARSED from the workflow's bytes. Prove the two
    // sources are distinct files and that neither reader consults the other's
    // source.
    expect(MANIFEST_PATH).not.toBe(WORKFLOW_PATH);

    const consumer = readFileSync(
      resolve(REPO_ROOT, 'scripts/phase-50a/proof-input-manifest.mjs'),
      'utf8',
    );
    const parser = readFileSync(
      resolve(REPO_ROOT, 'scripts/phase-50a/workflow-trigger-parser.mjs'),
      'utf8',
    );

    // The manifest consumer must never read the workflow.
    expect(consumer, 'the manifest consumer must not read the workflow').not.toContain(
      'phase-50a-postgres-conformance.yml"',
    );
    expect(
      /readFileSync\([^)]*WORKFLOW_PATH/.test(consumer),
      'the manifest consumer must not read the workflow file',
    ).toBe(false);

    // The parser must be PURE over its argument: it takes the bytes and returns a
    // result. No filesystem, no child process, no network — a parser that could
    // read the manifest could derive its answer from the artifact it validates.
    //
    // Checked over the parser's IMPORT STATEMENTS, which is where such a capability
    // would have to enter an ESM module. Comments are excluded by construction:
    // this looks for `import` lines only, so the parser can still document what it
    // deliberately does not do.
    const parserImports = [...parser.matchAll(/^\s*import\s.*$/gm)].map((m) => m[0]);
    expect(parserImports, 'the parser must import nothing at all').toEqual([]);
    // And no dynamic capability acquisition either.
    expect(
      /\brequire\s*\(|\bimport\s*\(|process\.(?:env|argv|cwd)|globalThis\.fetch|\bfetch\s*\(/.test(
        parser,
      ),
      'the parser must not acquire filesystem, process, or network capability dynamically',
    ).toBe(false);
    // `Buffer` is the one global it uses, for byte-length bounds — not a
    // capability, and asserted explicitly so its presence is intentional.
    expect(parser).toContain('Buffer.byteLength');
  });

  it('PROVENANCE: every parsed path is a real substring of the workflow bytes at its offset', () => {
    // A parser that SYNTHESIZED a path — the mutation that defeated the rejected
    // suite — could not also produce a byte offset at which those bytes occur.
    // This verifies the provenance rather than trusting the parser.
    const text = workflowBytes();
    const bytes = Buffer.from(text, 'utf8');
    const parsed = parsedTriggers();
    expect(parsed.pullRequestPaths.length).toBeGreaterThan(5);
    for (const { value, offset } of parsed.pullRequestPaths) {
      expect(offset, `offset for ${value} must be within the document`).toBeLessThan(bytes.length);
      // The line at that offset must contain the value verbatim.
      const lineEnd = bytes.indexOf(0x0a, offset);
      const line = bytes
        .subarray(offset, lineEnd === -1 ? bytes.length : lineEnd)
        .toString('utf8');
      expect(line, `the bytes at offset ${offset} must contain ${value}`).toContain(value);
      // And the value must genuinely occur in the document.
      expect(text.includes(value)).toBe(true);
    }
  });
});

// ── the bounded parser's own contract ───────────────────────────────────

describe('Phase 50A R3 — the bounded workflow parser recovers the real declaration', () => {
  it('recovers on.pull_request.paths and on.workflow_dispatch from the CHECKED-IN workflow', () => {
    const parsed = parsedTriggers();
    // The real declaration, recovered structurally.
    expect(parsed.pullRequestPaths.map((p) => p.value)).toContain('src/straylight/**');
    expect(parsed.pullRequestPaths.map((p) => p.value)).toContain('tests/phase-50a/**');
    expect(parsed.pullRequestPaths.map((p) => p.value)).toContain(WORKFLOW_PATH);
    // `workflow_dispatch` is present and BOUNDED: exactly the one exact-head input.
    expect(parsed.workflowDispatch.present).toBe(true);
    expect(parsed.workflowDispatch.inputs).toEqual(['head_sha']);
  });

  it('the parser is not fixed-offset: it still parses when the block MOVES within the document', () => {
    // The rejected approach keyed off `indexOf('    paths:\n')`. Prepending
    // comments shifts every offset; a structural parse is unaffected.
    const shifted = `# a leading comment\n# and another\n\n${workflowBytes()}`;
    const parsed = parseWorkflowTriggers(shifted);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.pullRequestPaths.map((p) => p.value)).toEqual(triggerFilters());
    }
  });

  it('accepts the three scalar quoting variants, and reports each verbatim', () => {
    const doc = [
      'on:',
      '  pull_request:',
      '    paths:',
      "      - 'single/**'",
      '      - "double/**"',
      '      - plain/**',
      '  workflow_dispatch:',
    ].join('\n');
    const parsed = parseWorkflowTriggers(doc);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.pullRequestPaths.map((p) => p.value)).toEqual([
        'single/**',
        'double/**',
        'plain/**',
      ]);
      expect(parsed.workflowDispatch).toEqual({ present: true, inputs: [] });
    }
  });

  it('tolerates interleaved comments and blank lines WITHOUT letting them terminate the block', () => {
    const doc = [
      'on:',
      '  pull_request:',
      '    paths:',
      "      - 'a/**'",
      '      # an explanatory note between entries',
      '',
      "      - 'b/**'",
      '  workflow_dispatch:',
    ].join('\n');
    const parsed = parseWorkflowTriggers(doc);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.pullRequestPaths.map((p) => p.value)).toEqual(['a/**', 'b/**']);
    }
  });

  it('terminates the block at a real dedent, so a later `paths:` elsewhere is not absorbed', () => {
    const doc = [
      'on:',
      '  pull_request:',
      '    paths:',
      "      - 'a/**'",
      '  workflow_dispatch:',
      'jobs:',
      '  build:',
      '    paths:',
      "      - 'not-a-trigger/**'",
    ].join('\n');
    const parsed = parseWorkflowTriggers(doc);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(
        parsed.pullRequestPaths.map((p) => p.value),
        'a `paths:` under jobs must not be absorbed into the trigger set',
      ).toEqual(['a/**']);
    }
  });

  // ── negative tests: each FAILS CLOSED rather than returning a narrower
  //    or wider set ─────────────────────────────────────────────────────

  const NEGATIVE: ReadonlyArray<{ name: string; doc: string; reason: RegExp }> = [
    {
      name: 'an absent `on:` block',
      doc: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n',
      reason: /key-absent/,
    },
    {
      name: 'an absent pull_request trigger',
      doc: 'on:\n  push:\n    branches:\n      - main\n  workflow_dispatch:\n',
      reason: /pull-request-trigger-absent/,
    },
    {
      name: 'an absent paths block',
      doc: 'on:\n  pull_request:\n    branches:\n      - main\n  workflow_dispatch:\n',
      reason: /paths-block-absent/,
    },
    {
      name: 'an EMPTY paths block',
      doc: 'on:\n  pull_request:\n    paths:\n  workflow_dispatch:\n',
      reason: /paths-block-(?:empty|absent)/,
    },
    {
      name: 'an absent workflow_dispatch trigger',
      doc: "on:\n  pull_request:\n    paths:\n      - 'a/**'\n",
      reason: /workflow-dispatch-absent/,
    },
    {
      name: 'a WRONG-INDENTATION sequence item',
      doc: "on:\n  pull_request:\n    paths:\n      - 'a/**'\n        - 'b/**'\n  workflow_dispatch:\n",
      reason: /unexpected-sequence-indent|not-a-sequence-item/,
    },
    {
      name: 'a NESTED KEY where a scalar item was required',
      doc: "on:\n  pull_request:\n    paths:\n      - name: 'a/**'\n  workflow_dispatch:\n",
      reason: /not-a-plain-scalar|not-a-sequence-item/,
    },
    {
      name: 'an UNTERMINATED quoted scalar',
      doc: "on:\n  pull_request:\n    paths:\n      - 'a/**\n  workflow_dispatch:\n",
      reason: /unterminated-quote/,
    },
    {
      name: 'an EMPTY sequence item',
      doc: "on:\n  pull_request:\n    paths:\n      - 'a/**'\n      -\n  workflow_dispatch:\n",
      reason: /empty-scalar/,
    },
    {
      name: 'a MALFORMED list item (no dash)',
      doc: "on:\n  pull_request:\n    paths:\n      'a/**'\n  workflow_dispatch:\n",
      reason: /not-a-sequence-item|unparseable-key/,
    },
    {
      name: 'a FLOW sequence rather than a block sequence',
      doc: "on:\n  pull_request:\n    paths: ['a/**', 'b/**']\n  workflow_dispatch:\n",
      reason: /paths-not-a-block-sequence/,
    },
    {
      name: 'a DUPLICATE `on:` key',
      doc:
        "on:\n  pull_request:\n    paths:\n      - 'a/**'\n  workflow_dispatch:\n" +
        "on:\n  pull_request:\n    paths:\n      - 'b/**'\n",
      reason: /key-duplicated/,
    },
    {
      name: 'a DUPLICATE `paths:` key',
      doc:
        "on:\n  pull_request:\n    paths:\n      - 'a/**'\n    paths:\n      - 'b/**'\n" +
        '  workflow_dispatch:\n',
      reason: /key-duplicated/,
    },
    {
      name: 'TAB indentation',
      doc: "on:\n\tpull_request:\n\t\tpaths:\n\t\t\t- 'a/**'\n",
      reason: /tab-indentation/,
    },
    { name: 'an EMPTY document', doc: '', reason: /input-empty/ },
    {
      name: 'a document that is not text',
      doc: undefined as unknown as string,
      reason: /input-not-text/,
    },
  ];

  for (const testCase of NEGATIVE) {
    it(`FAILS CLOSED on ${testCase.name}`, () => {
      const parsed = parseWorkflowTriggers(testCase.doc);
      expect(parsed.ok, `${testCase.name} must not parse`).toBe(false);
      if (!parsed.ok) {
        expect(parsed.reason, `${testCase.name} must report the intended reason`).toMatch(
          testCase.reason,
        );
      }
    });
  }

  it('a failure NEVER yields a usable path set — there is no partial result', () => {
    // The disposition that matters: a caller cannot obtain a narrower set from a
    // malformed document, because a failure carries no paths at all.
    const parsed = parseWorkflowTriggers('on:\n  pull_request:\n    branches:\n      - main\n');
    expect(parsed.ok).toBe(false);
    expect('pullRequestPaths' in parsed).toBe(false);
  });
});

// ── the manifest reader's own fail-closed contract ──────────────────────

describe('Phase 50A R3 — the manifest reader fails closed on every defect', () => {
  const BAD: ReadonlyArray<{ name: string; path: string; reason: RegExp }> = [
    {
      name: 'a MISSING manifest',
      path: 'tests/phase-50a/no-such-manifest.json',
      reason: /missing or unreadable/,
    },
  ];

  for (const testCase of BAD) {
    it(`refuses ${testCase.name}`, () => {
      expect(() => readManifest(testCase.path)).toThrow(testCase.reason);
    });
  }

  it('refuses an EMPTY, MALFORMED, or VACUOUS manifest (written to a temp path)', async () => {
    const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = mkdtempSync(join(tmpdir(), 'p50a-manifest-'));
    try {
      const cases: ReadonlyArray<{ name: string; body: string; reason: RegExp }> = [
        { name: 'empty file', body: '', reason: /is empty/ },
        { name: 'whitespace only', body: '   \n\n', reason: /is empty/ },
        { name: 'malformed JSON', body: '{ "version": 1, roots: }', reason: /malformed JSON/ },
        { name: 'not an object', body: '[]', reason: /must be a JSON object/ },
        { name: 'wrong version', body: '{"version":2,"roots":[]}', reason: /unsupported version/ },
        { name: 'no roots array', body: '{"version":1}', reason: /must declare a `roots` array/ },
        { name: 'VACUOUS (no roots)', body: '{"version":1,"roots":[]}', reason: /declares no roots/ },
        {
          name: 'a root that is not an object',
          body: '{"version":1,"roots":["src"]}',
          reason: /every root must be an object/,
        },
        {
          name: 'an empty root path',
          body: '{"version":1,"roots":[{"path":"","kind":"tree","why":"x"}]}',
          reason: /non-empty string/,
        },
        {
          name: 'an absolute root path',
          body: '{"version":1,"roots":[{"path":"/etc","kind":"tree","why":"x"}]}',
          reason: /clean relative path/,
        },
        {
          name: 'a traversing root path',
          body: '{"version":1,"roots":[{"path":"../sibling","kind":"tree","why":"x"}]}',
          reason: /clean relative path/,
        },
        {
          name: 'an unknown kind',
          body: '{"version":1,"roots":[{"path":"src","kind":"glob","why":"x"}]}',
          reason: /unknown kind/,
        },
        {
          name: 'a root with no rationale',
          body: '{"version":1,"roots":[{"path":"src","kind":"tree","why":"  "}]}',
          reason: /must record WHY/,
        },
        {
          name: 'a DUPLICATE root',
          body:
            '{"version":1,"roots":[{"path":"src","kind":"tree","why":"x"},' +
            '{"path":"src","kind":"tree","why":"y"}]}',
          reason: /declared twice/,
        },
      ];
      for (const testCase of cases) {
        const file = join(dir, 'manifest.json');
        writeFileSync(file, testCase.body);
        expect(() => readManifest(file), `${testCase.name} must be refused`).toThrow(
          testCase.reason,
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a declared root that resolves to NO tracked file', () => {
    expect(() => trackedFilesUnder('src/straylight/no-such-root-probe', 'tree')).toThrow(
      /resolves to NO tracked file/,
    );
  });

  it('the filter interpreter treats an UNRECOGNIZED glob shape as NOT covering', () => {
    // The direction that fails closed: an unrecognized shape must never be assumed
    // to cover something.
    expect(filterCovers('src/straylight/**', 'src/straylight/index.ts')).toBe(true);
    expect(filterCovers('src/straylight/**', 'src/straylight')).toBe(true);
    expect(filterCovers('src/straylight/**', 'src/straylightish/x.ts')).toBe(false);
    expect(filterCovers('package.json', 'package.json')).toBe(true);
    expect(filterCovers('package.json', 'package-lock.json')).toBe(false);
    // A shape this proof does not interpret.
    expect(filterCovers('src/**/*.ts', 'src/straylight/index.ts')).toBe(false);
    expect(filterCovers('src/straylight/*', 'src/straylight/index.ts')).toBe(false);
  });
});
