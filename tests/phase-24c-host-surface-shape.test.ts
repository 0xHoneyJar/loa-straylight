// Phase 24C — host-surface shape pin.
//
// Pins the public shape of the Phase 24C Dixie recall-host scaffold:
//   * the six surface handlers (and their dep types) are exported from the
//     local host barrel at src/straylight/host/index.ts;
//   * NONE of the host exports leak through the wedge's stable public API
//     surface at src/straylight/index.ts (per Phase 24C adjustment §2);
//   * the host source files do not import from any forbidden symbol — no
//     loa-dixie / loa-finn / loa-freeside, no Hounfour package, no
//     hounfour-alias module.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import * as host from '../src/straylight/host/index.js';
import * as wedge from '../src/straylight/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const HOST_DIR = resolve(ROOT, 'src/straylight/host');

// Phase 29B note: the Hounfour-package guard is tightened from a
// bare-string match to an import-syntax match. The Phase 29B
// recall-wedge-contract module legitimately names
// `'@0xhoneyjar/loa-hounfour'` as type-only metadata
// (`packageName: '@0xhoneyjar/loa-hounfour'`); it does NOT import
// from the package. The Phase 24C intent — no Hounfour import at
// the host surface — is preserved verbatim. The pattern matches
// real import syntax only:
//   * `from '@0xhoneyjar/loa-hounfour(/subpath)?'` (static
//     named, default, type-only, and `export … from` re-exports);
//   * `import '@0xhoneyjar/loa-hounfour(/subpath)?'` (side-effect
//     import);
//   * `import('@0xhoneyjar/loa-hounfour(/subpath)?')` (dynamic
//     import);
//   * `require('@0xhoneyjar/loa-hounfour(/subpath)?')` (CJS
//     interop, included for completeness).
// A trailing `(/subpath)?` permits any subpath after the package
// name so subpath imports are caught alongside root imports.
const HOUNFOUR_IMPORT_PATTERN =
  /(?:\bfrom\s+|\bimport\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]@0xhoneyjar\/loa-hounfour(?:\/[^'"]*)?['"]/;

describe('phase-24c host barrel — exports the six surfaces + helpers', () => {
  it.each([
    'handleRecallIntake',
    'handleReceiptRetrieval',
    'handleExclusionDisplay',
    'handleProvenanceWalk',
    'handleAuditChainLookup',
    'handleEstateSummary',
    'checkSameTenant',
    'createInMemoryIntakeDenyLog',
  ])('exports %s', (sym) => {
    expect(sym in host).toBe(true);
    expect(typeof (host as Record<string, unknown>)[sym]).toBe('function');
  });
});

describe('phase-24c host — NOT re-exported through wedge public API', () => {
  it.each([
    'handleRecallIntake',
    'handleReceiptRetrieval',
    'handleExclusionDisplay',
    'handleProvenanceWalk',
    'handleAuditChainLookup',
    'handleEstateSummary',
    'createInMemoryIntakeDenyLog',
  ])('wedge public surface does NOT re-export %s', (sym) => {
    expect(sym in wedge).toBe(false);
  });
});

describe('phase-24c host — wedge public-API contents preserved', () => {
  it('all 11 wedge sections are still re-exported (regression pin)', () => {
    // A handful of representative names from each grouping in the wedge's
    // stable public API surface — see src/straylight/index.ts header
    // sections 1..11. The host barrel must not shadow or remove any of
    // these.
    const expected = [
      'canonicalize',
      'contentId',
      'devSign',
      'validateRecallRequest',
      'evaluateCompetence',
      'policyForRecallRequest',
      'dispositionFor',
      'AuditLog',
      'EstateStore',
      'executeRecall',
      'computeCommitmentRoot',
      'InMemoryStorage',
      'JsonlStorage',
    ];
    for (const sym of expected) {
      expect(sym in wedge).toBe(true);
    }
  });
});

describe('phase-24c host — no forbidden imports anywhere under src/straylight/host', () => {
  const FORBIDDEN_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
    { label: 'loa-dixie', pattern: /['"]loa-dixie['"]/ },
    { label: 'loa-finn', pattern: /['"]loa-finn['"]/ },
    { label: 'loa-freeside', pattern: /['"]loa-freeside['"]/ },
    { label: '@0xhoneyjar/loa-hounfour (import)', pattern: HOUNFOUR_IMPORT_PATTERN },
    { label: 'hounfour-alias', pattern: /['"][^'"]*\bhounfour-alias[^'"]*['"]/ },
  ];

  const hostFiles = readdirSync(HOST_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => resolve(HOST_DIR, f));

  it('host directory contains at least the 11 approved files (Phase 24C + Phase 29B)', () => {
    const names = readdirSync(HOST_DIR).filter((f) => f.endsWith('.ts')).sort();
    expect(names).toEqual(
      [
        'audit-lookup.ts',
        'estate-summary.ts',
        'exclusion.ts',
        'index.ts',
        'intake-log.ts',
        'intake.ts',
        'provenance.ts',
        'receipt.ts',
        'recall-wedge-contract.ts',
        'tenancy.ts',
        'types.ts',
      ].sort(),
    );
  });

  for (const file of hostFiles) {
    it(`${file.split('/').pop()} has no forbidden imports`, () => {
      const text = readFileSync(file, 'utf8');
      for (const { label, pattern } of FORBIDDEN_PATTERNS) {
        expect(
          pattern.test(text),
          `${file.split('/').pop()} must not reference ${label}`,
        ).toBe(false);
      }
    });
  }
});

describe('phase-24c host — Hounfour import-guard regex behavior (Phase 29B tightening)', () => {
  // The guard MUST allow naming the package as type-only metadata
  // (the Phase 29B recall-wedge-contract.ts case) and MUST reject
  // every real import / require form against the package root
  // AND any subpath under it. These cases pin the behavior of
  // `HOUNFOUR_IMPORT_PATTERN` so future drift is visible.

  const ALLOWED_NON_IMPORT_FORMS: ReadonlyArray<string> = [
    // Type-only metadata literal as it appears in
    // src/straylight/host/recall-wedge-contract.ts.
    "const HOUNFOUR_PACKAGE_NAME_LITERAL = '@0xhoneyjar/loa-hounfour' as const;",
    "packageName: '@0xhoneyjar/loa-hounfour',",
    "// reference to '@0xhoneyjar/loa-hounfour' in a comment",
    '// reference to "@0xhoneyjar/loa-hounfour" in a comment',
    "const note = 'see @0xhoneyjar/loa-hounfour for substrate';",
  ];

  const FORBIDDEN_ROOT_IMPORT_FORMS: ReadonlyArray<string> = [
    "import '@0xhoneyjar/loa-hounfour';",
    'import "@0xhoneyjar/loa-hounfour";',
    "import x from '@0xhoneyjar/loa-hounfour';",
    "import { x } from '@0xhoneyjar/loa-hounfour';",
    "import * as h from '@0xhoneyjar/loa-hounfour';",
    "import type { T } from '@0xhoneyjar/loa-hounfour';",
    "export { x } from '@0xhoneyjar/loa-hounfour';",
    "export * from '@0xhoneyjar/loa-hounfour';",
    "const m = await import('@0xhoneyjar/loa-hounfour');",
    'const m = await import("@0xhoneyjar/loa-hounfour");',
    "const m = require('@0xhoneyjar/loa-hounfour');",
  ];

  const FORBIDDEN_SUBPATH_IMPORT_FORMS: ReadonlyArray<string> = [
    "import '@0xhoneyjar/loa-hounfour/foo';",
    'import "@0xhoneyjar/loa-hounfour/schemas/x";',
    "import x from '@0xhoneyjar/loa-hounfour/core';",
    "import { x } from '@0xhoneyjar/loa-hounfour/core';",
    "import * as h from '@0xhoneyjar/loa-hounfour/schemas/conformance-vector.schema.json';",
    "import type { T } from '@0xhoneyjar/loa-hounfour/types';",
    "export { x } from '@0xhoneyjar/loa-hounfour/foo';",
    "export * from '@0xhoneyjar/loa-hounfour/bar/baz';",
    "const m = await import('@0xhoneyjar/loa-hounfour/foo');",
    "const m = require('@0xhoneyjar/loa-hounfour/core');",
  ];

  it.each(ALLOWED_NON_IMPORT_FORMS)(
    'metadata literal / comment / string is allowed: %s',
    (line) => {
      expect(HOUNFOUR_IMPORT_PATTERN.test(line)).toBe(false);
    },
  );

  it.each(FORBIDDEN_ROOT_IMPORT_FORMS)(
    'forbids root import form: %s',
    (line) => {
      expect(HOUNFOUR_IMPORT_PATTERN.test(line)).toBe(true);
    },
  );

  it.each(FORBIDDEN_SUBPATH_IMPORT_FORMS)(
    'forbids subpath import form: %s',
    (line) => {
      expect(HOUNFOUR_IMPORT_PATTERN.test(line)).toBe(true);
    },
  );

  it('the recall-wedge-contract.ts metadata literal is allowed by the guard (live-source check)', () => {
    const text = readFileSync(
      resolve(HOST_DIR, 'recall-wedge-contract.ts'),
      'utf8',
    );
    // The literal `'@0xhoneyjar/loa-hounfour'` MUST be present as
    // type-only metadata. The guard MUST NOT match because the
    // file imports nothing from the package.
    expect(text).toMatch(/'@0xhoneyjar\/loa-hounfour'/);
    expect(HOUNFOUR_IMPORT_PATTERN.test(text)).toBe(false);
  });
});

describe('phase-24c host — wedge does not depend on host', () => {
  it('src/straylight/index.ts does not import from ./host/', () => {
    const wedgeIndex = readFileSync(resolve(ROOT, 'src/straylight/index.ts'), 'utf8');
    expect(/from\s+['"]\.\/host\//.test(wedgeIndex)).toBe(false);
  });

  it('every existing wedge module source file does not import from ./host/', () => {
    const wedgeDir = resolve(ROOT, 'src/straylight');
    const entries = readdirSync(wedgeDir).filter((f) => f.endsWith('.ts'));
    for (const name of entries) {
      const text = readFileSync(resolve(wedgeDir, name), 'utf8');
      expect(/from\s+['"]\.\/host\//.test(text), `${name} must not import ./host/`).toBe(false);
    }
  });

  it('host barrel exists', () => {
    expect(existsSync(resolve(HOST_DIR, 'index.ts'))).toBe(true);
  });
});
