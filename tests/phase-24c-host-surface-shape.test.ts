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
    { label: '@0xhoneyjar/loa-hounfour', pattern: /['"]@0xhoneyjar\/loa-hounfour['"]/ },
    { label: 'hounfour-alias', pattern: /['"][^'"]*\bhounfour-alias[^'"]*['"]/ },
  ];

  const hostFiles = readdirSync(HOST_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => resolve(HOST_DIR, f));

  it('host directory contains at least the 10 approved files', () => {
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
