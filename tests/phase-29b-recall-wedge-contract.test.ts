// Phase 29B — Straylight Recall Wedge host contract (Dixie-first MVP).
//
// Pins (per docs/decisions/ADR-029B-dixie-first-recall-wedge-contract.md
// and docs/handoffs/phase-29b-dixie-first-recall-wedge-contract.md):
//
//   * The Phase 29B contract version literal is exactly
//     "phase-29b.recall-wedge-contract.v0".
//   * The contract's source-corpus reference points at the installed
//     @0xhoneyjar/loa-hounfour@8.7.0 package (Phase 29A pin), not at
//     a sibling-repo working tree, not at vendored Straylight
//     fixtures, and not at any other version.
//   * The Phase 29A registry-shipped recall-wedge corpus (five
//     vectors + recall-wedge README + conformance-vector envelope
//     schema) is reachable from the installed package. The Phase 29B
//     contract carries the metadata that names the corpus; this test
//     file independently re-proves the corpus is present (without
//     vendoring) so the Phase 29B contract has substrate to reference.
//   * No Hounfour vector JSON, recall-wedge README, or envelope
//     schema is vendored under fixtures/ in Straylight.
//   * Contract helpers (createRecallWedgeSourceCorpusRef,
//     summarizeRecallWedgeInspection, createRecallWedgeInspectionReceipt,
//     assertRecallWedgeContractReadOnlyBoundary) are pure and produce
//     the documented include/exclude/redact/refuse counts.
//   * The default Dixie-first host kind is
//     "dixie-first-inspection-bff".
//   * Finn appears only as a boundary marker
//     ("finn-runtime-enforcement-later"), never as an active host
//     kind under Phase 29B.
//   * The contract source file does NOT import Straylight runtime,
//     policy, storage, audit, crypto/signature, or signer modules.
//   * This test file does NOT import Straylight runtime recall
//     behavior, policy evaluator, signature verifier, signer
//     competence, storage adapter, or audit-chain execution.
//
// Phase 29B is type/contract/test only. It does not implement an
// endpoint, does not modify package exports, does not vendor any
// Hounfour artifact, does not run policy, signature verification,
// or audit-chain enforcement.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RECALL_WEDGE_HOST_KIND,
  RECALL_WEDGE_ACTIVE_HOST_KINDS,
  RECALL_WEDGE_CONTRACT_BOUNDARY,
  STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION,
  assertRecallWedgeContractReadOnlyBoundary,
  createRecallWedgeInspectionReceipt,
  createRecallWedgeSourceCorpusRef,
  summarizeRecallWedgeInspection,
} from '../src/straylight/host/recall-wedge-contract.js';
import type {
  RecallWedgeBoundaryOwner,
  RecallWedgeHostKind,
  RecallWedgeInclusionDecision,
  RecallWedgeInspectionItem,
  RecallWedgeInspectionRequest,
  RecallWedgeSourceCorpusRef,
  StraylightRecallWedgeContractVersion,
} from '../src/straylight/host/recall-wedge-contract.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CONTRACT_FILE = resolve(
  ROOT,
  'src/straylight/host/recall-wedge-contract.ts',
);
const SELF_FILE = resolve(
  ROOT,
  'tests/phase-29b-recall-wedge-contract.test.ts',
);

const HOUNFOUR_NAME = '@0xhoneyjar/loa-hounfour';
const HOUNFOUR_VERSION = '8.7.0';

// Same anchor used by the Phase 29A vector-access test: resolve via
// the package's own declared exports condition rather than a
// hardcoded node_modules walk.
const SCHEMA_ANCHOR_SUBPATH =
  '@0xhoneyjar/loa-hounfour/schemas/conformance-vector.schema.json';

function resolveHounfourPackageRoot(): string {
  const require = createRequire(import.meta.url);
  const schemaPath = require.resolve(SCHEMA_ANCHOR_SUBPATH);
  return resolve(dirname(schemaPath), '..');
}

const REQUIRED_PACKAGE_RELATIVE_PATHS: ReadonlyArray<string> = [
  'vectors/conformance/recall-wedge/recall-request.json',
  'vectors/conformance/recall-wedge/recall-pack.json',
  'vectors/conformance/recall-wedge/recall-receipt.json',
  'vectors/conformance/recall-wedge/assertion-admitted.json',
  'vectors/conformance/recall-wedge/commitment-root.json',
  'schemas/conformance-vector.schema.json',
];

describe('Phase 29B — contract version literal is exact', () => {
  it("STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION === 'phase-29b.recall-wedge-contract.v0'", () => {
    expect(STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION).toBe(
      'phase-29b.recall-wedge-contract.v0',
    );
  });

  it('exposed contract-version type is the same literal', () => {
    // Compile-time equivalence: the type alias resolves to the
    // const literal. We assert the value at runtime; the type is
    // checked by `npm run typecheck`.
    const v: StraylightRecallWedgeContractVersion =
      STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION;
    expect(v).toBe('phase-29b.recall-wedge-contract.v0');
  });
});

describe('Phase 29B — source corpus points at @0xhoneyjar/loa-hounfour@8.7.0 (registry-resolution only)', () => {
  it('createRecallWedgeSourceCorpusRef() pins the installed Phase 29A package', () => {
    const ref = createRecallWedgeSourceCorpusRef();
    expect(ref.packageName).toBe(HOUNFOUR_NAME);
    expect(ref.packageVersion).toBe(HOUNFOUR_VERSION);
    expect(ref.corpus).toBe('recall-wedge-conformance-vectors');
    expect(ref.pathPrefix).toBe('/loa-hounfour/8.7.0/');
    expect(ref.integrity).toBeUndefined();
  });

  it('integrity, when supplied, is preserved as metadata only (no enforcement)', () => {
    const ref = createRecallWedgeSourceCorpusRef({
      integrity: 'sha512-phase-29b-metadata-only',
    });
    expect(ref.integrity).toBe('sha512-phase-29b-metadata-only');
  });

  it('the contract does not point at a sibling-repo working tree', () => {
    const ref: RecallWedgeSourceCorpusRef = createRecallWedgeSourceCorpusRef();
    expect(ref.packageName.startsWith('../')).toBe(false);
    expect(ref.packageName.includes('/loa-dev/')).toBe(false);
    // The package path-prefix names the published $id space and the
    // tarball-relative path; it is NOT a sibling-repo working-tree
    // path.
    expect(ref.pathPrefix).toBe('/loa-hounfour/8.7.0/');
  });
});

describe('Phase 29B — Phase 29A corpus is reachable from the installed package (no vendoring)', () => {
  it('the installed package metadata still reports name + version under the 8.7.0 pin', () => {
    const pkgRoot = resolveHounfourPackageRoot();
    expect(existsSync(pkgRoot)).toBe(true);
    expect(statSync(pkgRoot).isDirectory()).toBe(true);
    const pkgJsonPath = resolve(pkgRoot, 'package.json');
    expect(existsSync(pkgJsonPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as {
      name?: string;
      version?: string;
    };
    expect(pkg.name).toBe(HOUNFOUR_NAME);
    expect(pkg.version).toBe(HOUNFOUR_VERSION);
  });

  it.each(REQUIRED_PACKAGE_RELATIVE_PATHS)(
    'package/%s is present and readable inside the resolved 8.7.0 package',
    (relativePath) => {
      const pkgRoot = resolveHounfourPackageRoot();
      const absPath = resolve(pkgRoot, relativePath);
      expect(
        existsSync(absPath),
        `Phase 29B contract substrate missing: ${HOUNFOUR_NAME}@${HOUNFOUR_VERSION}/${relativePath}`,
      ).toBe(true);
      expect(statSync(absPath).isFile()).toBe(true);
      const text = readFileSync(absPath, 'utf8');
      expect(text.length).toBeGreaterThan(0);
    },
  );

  it('package/vectors/conformance/recall-wedge/README.md is present (recall-wedge corpus README)', () => {
    const pkgRoot = resolveHounfourPackageRoot();
    const readme = resolve(
      pkgRoot,
      'vectors/conformance/recall-wedge/README.md',
    );
    expect(existsSync(readme)).toBe(true);
    expect(statSync(readme).isFile()).toBe(true);
  });

  it('the Phase 29B test file resolves Hounfour through package-manager resolution, not a sibling-repo path', () => {
    const self = readFileSync(SELF_FILE, 'utf8');
    const FORBIDDEN_SIBLING_PATTERNS = [
      /['"]\.\.\/loa-hounfour/,
      /['"]\.\.\/loa-finn/,
      /['"]\.\.\/loa-dixie/,
      /['"]\.\.\/loa-freeside/,
    ];
    for (const pattern of FORBIDDEN_SIBLING_PATTERNS) {
      expect(
        pattern.test(self),
        `Phase 29B test must not reference sibling-repo paths: matched ${pattern}`,
      ).toBe(false);
    }
  });
});

describe('Phase 29B — no Hounfour vector JSON is vendored under fixtures/', () => {
  const FORBIDDEN_VENDORED_PATHS: ReadonlyArray<string> = [
    'fixtures/hounfour-recall-wedge/recall-request.json',
    'fixtures/hounfour-recall-wedge/recall-pack.json',
    'fixtures/hounfour-recall-wedge/recall-receipt.json',
    'fixtures/hounfour-recall-wedge/assertion-admitted.json',
    'fixtures/hounfour-recall-wedge/commitment-root.json',
    'fixtures/hounfour-recall-wedge/README.md',
    'fixtures/hounfour-recall-wedge/conformance-vector.schema.json',
    'fixtures/phase-29b-recall-wedge-contract/recall-request.json',
    'fixtures/phase-29b-recall-wedge-contract/recall-pack.json',
    'fixtures/phase-29b-recall-wedge-contract/recall-receipt.json',
  ];

  it.each(FORBIDDEN_VENDORED_PATHS)(
    'Straylight tree does NOT vendor %s',
    (relativePath) => {
      expect(existsSync(resolve(ROOT, relativePath))).toBe(false);
    },
  );
});

describe('Phase 29B — contract helpers produce correct receipt summary', () => {
  const sourceCorpus: RecallWedgeSourceCorpusRef =
    createRecallWedgeSourceCorpusRef();

  function makeRequest(
    overrides: Partial<RecallWedgeInspectionRequest> = {},
  ): RecallWedgeInspectionRequest {
    return {
      request_id: 'req-29b-001',
      actor_scope: {
        actor_id: 'actor-test',
        estate_id: 'estate-test',
      },
      environment: { purpose: 'phase-29b-test', surface: 'test' },
      include_challenged: false,
      include_revoked: false,
      include_forgotten: false,
      source_corpus: sourceCorpus,
      ...overrides,
    };
  }

  function makeItem(
    decision: RecallWedgeInclusionDecision,
    n: number,
  ): RecallWedgeInspectionItem {
    return {
      vector_id: `vec-${decision}-${n}`,
      decision,
      reason: `${decision}-reason-${n}`,
      source_ref: sourceCorpus,
    };
  }

  it('summarizeRecallWedgeInspection counts each decision exactly once per item', () => {
    const items: RecallWedgeInspectionItem[] = [
      makeItem('include', 1),
      makeItem('include', 2),
      makeItem('include', 3),
      makeItem('exclude', 1),
      makeItem('exclude', 2),
      makeItem('redact', 1),
      makeItem('refuse', 1),
      makeItem('refuse', 2),
      makeItem('refuse', 3),
    ];
    const summary = summarizeRecallWedgeInspection(items);
    expect(summary.included_count).toBe(3);
    expect(summary.excluded_count).toBe(2);
    expect(summary.redacted_count).toBe(1);
    expect(summary.refused_count).toBe(3);
    const total =
      summary.included_count +
      summary.excluded_count +
      summary.redacted_count +
      summary.refused_count;
    expect(total).toBe(items.length);
  });

  it('summarizeRecallWedgeInspection of an empty list returns all-zero counts', () => {
    const summary = summarizeRecallWedgeInspection([]);
    expect(summary).toEqual({
      included_count: 0,
      excluded_count: 0,
      redacted_count: 0,
      refused_count: 0,
    });
  });

  it('createRecallWedgeInspectionReceipt aggregates counts and pins contract metadata', () => {
    const request = makeRequest();
    const items: RecallWedgeInspectionItem[] = [
      makeItem('include', 1),
      makeItem('include', 2),
      makeItem('exclude', 1),
      makeItem('redact', 1),
      makeItem('refuse', 1),
    ];
    const receipt = createRecallWedgeInspectionReceipt({
      receipt_id: 'rec-29b-001',
      request,
      items,
      generated_at: '2026-05-21T00:00:00.000Z',
    });
    expect(receipt.receipt_id).toBe('rec-29b-001');
    expect(receipt.request_id).toBe(request.request_id);
    expect(receipt.contract_version).toBe(
      'phase-29b.recall-wedge-contract.v0',
    );
    expect(receipt.host_kind).toBe('dixie-first-inspection-bff');
    expect(receipt.included_count).toBe(2);
    expect(receipt.excluded_count).toBe(1);
    expect(receipt.redacted_count).toBe(1);
    expect(receipt.refused_count).toBe(1);
    expect(receipt.source_corpus).toEqual(sourceCorpus);
    expect(receipt.generated_at).toBe('2026-05-21T00:00:00.000Z');
    expect(receipt.boundary_summary.length).toBeGreaterThan(0);
  });

  it('createRecallWedgeInspectionReceipt accepts the boundary-marker host kind without making it active', () => {
    const request = makeRequest();
    const receipt = createRecallWedgeInspectionReceipt({
      receipt_id: 'rec-29b-finn-marker',
      request,
      items: [],
      host_kind: 'finn-runtime-enforcement-later',
    });
    // The receipt may *describe* the Finn boundary, but Finn is not
    // an active host under Phase 29B. The active-host-kinds tuple
    // is the canonical authority on what is active.
    expect(receipt.host_kind).toBe('finn-runtime-enforcement-later');
    expect(
      (RECALL_WEDGE_ACTIVE_HOST_KINDS as ReadonlyArray<RecallWedgeHostKind>).includes(
        'finn-runtime-enforcement-later',
      ),
    ).toBe(false);
  });
});

describe('Phase 29B — Dixie-first default host + Finn-as-boundary-only', () => {
  it("DEFAULT_RECALL_WEDGE_HOST_KIND === 'dixie-first-inspection-bff'", () => {
    expect(DEFAULT_RECALL_WEDGE_HOST_KIND).toBe('dixie-first-inspection-bff');
  });

  it('the active host-kinds tuple lists exactly the Dixie-first kind', () => {
    expect([...RECALL_WEDGE_ACTIVE_HOST_KINDS]).toEqual([
      'dixie-first-inspection-bff',
    ]);
  });

  it("'finn-runtime-enforcement-later' is NOT an active host kind under Phase 29B", () => {
    const active: ReadonlyArray<RecallWedgeHostKind> =
      RECALL_WEDGE_ACTIVE_HOST_KINDS;
    expect(active.includes('finn-runtime-enforcement-later')).toBe(false);
  });

  it('the contract boundary names every required owner', () => {
    const requiredOwners: ReadonlyArray<RecallWedgeBoundaryOwner> = [
      'straylight',
      'hounfour',
      'dixie',
      'finn',
      'loa',
    ];
    for (const owner of requiredOwners) {
      const description = RECALL_WEDGE_CONTRACT_BOUNDARY.owners[owner];
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('assertRecallWedgeContractReadOnlyBoundary accepts the canonical boundary', () => {
    expect(() =>
      assertRecallWedgeContractReadOnlyBoundary(),
    ).not.toThrow();
    expect(() =>
      assertRecallWedgeContractReadOnlyBoundary(
        RECALL_WEDGE_CONTRACT_BOUNDARY,
      ),
    ).not.toThrow();
  });
});

describe('Phase 29B — contract source file does NOT import forbidden runtime modules', () => {
  // The Phase 29B contract is type-only / pure-helper. It must NOT
  // pull in Straylight runtime, policy, storage, audit, crypto, or
  // signer modules — even via a relative path.
  const FORBIDDEN_IMPORT_PATTERNS: ReadonlyArray<{
    label: string;
    pattern: RegExp;
  }> = [
    {
      label: 'src/straylight/runtime',
      pattern: /from\s+['"][^'"]*\bstraylight\/runtime\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/policy',
      pattern: /from\s+['"][^'"]*\bstraylight\/policy\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/storage',
      pattern: /from\s+['"][^'"]*\bstraylight\/storage\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/audit',
      pattern: /from\s+['"][^'"]*\bstraylight\/audit\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/crypto/signature',
      pattern: /from\s+['"][^'"]*\bstraylight\/crypto\/signature\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/signer',
      pattern: /from\s+['"][^'"]*\bstraylight\/signer\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/signatures',
      pattern: /from\s+['"][^'"]*\bstraylight\/signatures\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/keyring',
      pattern: /from\s+['"][^'"]*\bstraylight\/keyring\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/recall',
      pattern: /from\s+['"][^'"]*\bstraylight\/recall\.?(?:js|ts)?\b[^'"]*['"]/,
    },
  ];

  const contractSrc = readFileSync(CONTRACT_FILE, 'utf8');

  it.each(FORBIDDEN_IMPORT_PATTERNS)(
    'recall-wedge-contract.ts does NOT import from $label',
    ({ pattern, label }) => {
      expect(
        pattern.test(contractSrc),
        `Phase 29B contract must not import ${label}`,
      ).toBe(false);
    },
  );

  it('recall-wedge-contract.ts does NOT import from the Hounfour package', () => {
    // Match only real import statements (top-of-line `import …` or
    // `from '…'` at the import-clause position, plus dynamic
    // `import('…')`), not prose mentions of the package name in
    // documentation comments.
    const importLines = contractSrc
      .split(/\r?\n/)
      .filter((line) => /^\s*(?:import\b|export\s+(?:\*|\{))/.test(line));
    for (const line of importLines) {
      expect(
        /['"]@0xhoneyjar\/loa-hounfour(?:\/[^'"]*)?['"]/.test(line),
        `recall-wedge-contract.ts must not import from the Hounfour package: ${line}`,
      ).toBe(false);
    }
    // Also forbid dynamic-import expressions anywhere in the file.
    expect(
      /import\s*\(\s*['"]@0xhoneyjar\/loa-hounfour(?:\/[^'"]*)?['"]\s*\)/.test(
        contractSrc,
      ),
    ).toBe(false);
  });

  it('recall-wedge-contract.ts does NOT import from the wedge public surface', () => {
    expect(/from\s+['"]@loa\/straylight['"]/.test(contractSrc)).toBe(false);
    expect(/from\s+['"]\.\.\/index\.js['"]/.test(contractSrc)).toBe(false);
  });
});

describe('Phase 29B — this test file does NOT import Straylight runtime / policy / storage / audit / signer behavior', () => {
  const self = readFileSync(SELF_FILE, 'utf8');

  const FORBIDDEN_IMPORT_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
    { label: 'wedge public API', pattern: /from\s+['"]@loa\/straylight['"]/ },
    {
      label: 'src/straylight/runtime',
      pattern: /from\s+['"][^'"]*\bstraylight\/runtime\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/policy',
      pattern: /from\s+['"][^'"]*\bstraylight\/policy\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/storage',
      pattern: /from\s+['"][^'"]*\bstraylight\/storage\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/audit',
      pattern: /from\s+['"][^'"]*\bstraylight\/audit\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/crypto/signature',
      pattern: /from\s+['"][^'"]*\bstraylight\/crypto\/signature\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/signer',
      pattern: /from\s+['"][^'"]*\bstraylight\/signer\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/signatures',
      pattern: /from\s+['"][^'"]*\bstraylight\/signatures\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/keyring',
      pattern: /from\s+['"][^'"]*\bstraylight\/keyring\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/recall.ts',
      pattern: /from\s+['"][^'"]*\bstraylight\/recall\.?(?:js|ts)?['"]/,
    },
    {
      label: 'src/straylight/host/intake (handler)',
      pattern: /from\s+['"][^'"]*\bstraylight\/host\/intake\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/host/receipt (handler)',
      pattern: /from\s+['"][^'"]*\bstraylight\/host\/receipt\b[^'"]*['"]/,
    },
    {
      label: 'src/straylight/host/index (barrel)',
      pattern: /from\s+['"][^'"]*\bstraylight\/host\/index\b[^'"]*['"]/,
    },
  ];

  it.each(FORBIDDEN_IMPORT_PATTERNS)(
    'phase-29b test does NOT import from $label',
    ({ pattern, label }) => {
      expect(
        pattern.test(self),
        `Phase 29B test must not import ${label}`,
      ).toBe(false);
    },
  );

  it('phase-29b test imports only from the new recall-wedge-contract module + node:* + vitest', () => {
    const importLines = self
      .split(/\r?\n/)
      .filter((line) => /^\s*import\b/.test(line));
    expect(importLines.length).toBeGreaterThan(0);
    const allowedSpecifiers = new Set<string>([
      "'../src/straylight/host/recall-wedge-contract.js'",
      "'node:fs'",
      "'node:module'",
      "'node:path'",
      "'node:url'",
      "'vitest'",
    ]);
    for (const line of importLines) {
      const match = line.match(/from\s+(['"][^'"]+['"])/);
      if (!match) continue;
      const specifier = match[1];
      expect(
        allowedSpecifiers.has(specifier ?? ''),
        `Phase 29B test imports unexpected specifier: ${specifier}`,
      ).toBe(true);
    }
  });
});

describe('Phase 29B — package export posture', () => {
  // Phase 29B authorizes the contract module under the existing
  // ./host export ONLY if that path is required by an existing repo
  // convention. It is not. The repo's host barrel
  // (src/straylight/host/index.ts) is intentionally NOT re-exported
  // through the wedge public API, and the Phase 29B contract module
  // does NOT add a new package.json export. This test pins that
  // posture so future changes are explicit.
  it('package.json declares the existing three exports keys without adding a Phase 29B-specific subpath', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
    ) as { exports?: Record<string, unknown> };
    expect(pkg.exports).toBeDefined();
    if (!pkg.exports) return;
    const keys = Object.keys(pkg.exports).sort();
    expect(keys).toEqual(['.', './host', './runtime/recall-intake']);
    // Phase 29B did not add ./host/recall-wedge-contract or any
    // similar subpath; the contract is in-tree only.
    expect(keys).not.toContain('./host/recall-wedge-contract');
  });

  it('the host barrel does NOT re-export the Phase 29B contract module (kept import-by-path)', () => {
    const barrel = readFileSync(
      resolve(ROOT, 'src/straylight/host/index.ts'),
      'utf8',
    );
    expect(/recall-wedge-contract/.test(barrel)).toBe(false);
  });
});
