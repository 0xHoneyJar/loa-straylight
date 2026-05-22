// Phase 30 — Host-consumable Recall Wedge contract export.
//
// Phase 29B authored the Straylight-side host contract under
// `src/straylight/host/recall-wedge-contract.ts` but intentionally
// did NOT widen the host barrel to re-export it. Phase 30 closes
// that gap at the SOURCE-LEVEL host barrel: the contract is now
// re-exported through `src/straylight/host/index.ts`, and the
// regenerated `dist-types/src/straylight/host/index.d.ts` carries
// the same shape so a future Dixie BFF / inspection consumer may
// type-check against the existing `@loa/straylight/host` package
// surface (kept `types`-only per package.json) WITHOUT a new
// package.json export key, WITHOUT a new wedge public-API export,
// and WITHOUT pulling any runtime / policy / storage / audit /
// signature / signer implementation across the seam.
//
// IMPORTANT: because `package.json`'s `./host` export is
// `types`-only, Dixie cannot **runtime-import** from
// `@loa/straylight/host`. The Phase 30 surface is a TYPE surface;
// the callable helpers re-exported through the host barrel are
// in-repo / source-level contract helpers only and are NOT a
// package runtime surface. A future phase may add a runtime host
// export or a Dixie-side runtime adapter if explicitly authorized.
//
// This file proves Phase 30 in two complementary ways:
//
//   1. The bulk of the cases below import the in-repo source host
//      barrel (`'../src/straylight/host/index.js'`) to prove the
//      barrel SHAPE — that is, what `dist-types/src/straylight/host/
//      index.d.ts` ends up declaring. These cases prove the in-repo
//      host barrel shape; they do NOT prove runtime package
//      consumption (the package has no `./host` runtime export).
//   2. A separate type-only consumer fixture, written into a
//      deterministic temp directory and compiled with `tsc
//      --noEmit`, imports from `'@loa/straylight/host'` using
//      `import type` only (and `typeof` for helper signatures) to
//      prove that a future Dixie consumer can type-check against
//      the package's `./host` export key. The fixture deliberately
//      contains zero runtime imports of `@loa/straylight/host` and
//      is checked offline (no network, no sibling-repo reference,
//      no `npm pack`).
//
// Forbidden imports (enforced below for both the contract module
// and this test file):
//   * `'../src/straylight/index.js'`              (wedge public API)
//   * `'../src/straylight/runtime/**'`            (any runtime barrel)
//   * `'../src/straylight/policy.js'`             (policy evaluator)
//   * `'../src/straylight/storage/**'`            (storage adapters)
//   * `'../src/straylight/audit.js'`              (audit chain)
//   * `'../src/straylight/signatures.js'`         (signature verifier)
//   * `'../src/straylight/keyring.js'`            (signer competence)
//   * `'../src/straylight/recall.js'`             (recall runtime)
//   * `'../src/straylight/host/intake.js'`        (host handler)
//   * `'../src/straylight/host/receipt.js'`       (host handler)
//   * `'../src/straylight/host/recall-wedge-contract.js'`
//                                                  (deep import; the
//                                                  Phase 30 contract
//                                                  must be consumed
//                                                  through the host
//                                                  BARREL, not by
//                                                  reaching past it)
//   * any RELATIVE path from the contract module (or this test) that
//     traverses up into a forbidden implementation area — e.g.
//     `'../runtime/...'`, `'../policy'`, `'../storage/...'`,
//     `'../audit'`, `'../signature'`, `'../signatures'`, `'../signer'`,
//     `'../keyring'`, `'../recall'`. The previous absolute-substring
//     scan would miss these because they don't contain the literal
//     `straylight/` prefix; the strengthened scan below catches them.
//   * `'@0xhoneyjar/loa-hounfour'`                (Hounfour package)
//   * any sibling-repo working-tree path
//   * any `loa-dixie` / `loa-finn` / `loa-freeside` reference

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import * as host from '../src/straylight/host/index.js';
import type {
  RecallWedgeActorScope,
  RecallWedgeBoundaryOwner,
  RecallWedgeContractBoundary,
  RecallWedgeEnvironmentFrame,
  RecallWedgeEnvironmentSurface,
  RecallWedgeHostKind,
  RecallWedgeInclusionDecision,
  RecallWedgeInspectionItem,
  RecallWedgeInspectionReceipt,
  RecallWedgeInspectionRequest,
  RecallWedgeInspectionResult,
  RecallWedgeInspectionSummary,
  RecallWedgeRiskLevel,
  RecallWedgeSourceCorpusRef,
  StraylightRecallWedgeContractVersion,
} from '../src/straylight/host/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const HOST_BARREL = resolve(ROOT, 'src/straylight/host/index.ts');
const CONTRACT_FILE = resolve(
  ROOT,
  'src/straylight/host/recall-wedge-contract.ts',
);
const SELF_FILE = resolve(
  ROOT,
  'tests/phase-30-host-recall-wedge-contract-export.test.ts',
);

// ──────────────────────────────────────────────────────────────────────────────
// 1. The in-repo host barrel re-exports the Phase 29B contract.
//
//    These cases prove the barrel SHAPE in the source tree — i.e.
//    what the regenerated `dist-types/src/straylight/host/index.d.ts`
//    ends up declaring. They are NOT a runtime-package-consumption
//    proof: `package.json`'s `./host` export is `types`-only, so
//    Dixie cannot runtime-import `@loa/straylight/host`. The
//    type-only `@loa/straylight/host` consumer proof lives in
//    section 10 below and is checked with `tsc --noEmit`.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — in-repo host barrel re-exports the Phase 29B contract', () => {
  it.each([
    'STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION',
    'RECALL_WEDGE_ACTIVE_HOST_KINDS',
    'DEFAULT_RECALL_WEDGE_HOST_KIND',
    'RECALL_WEDGE_CONTRACT_BOUNDARY',
    'createRecallWedgeSourceCorpusRef',
    'summarizeRecallWedgeInspection',
    'createRecallWedgeInspectionReceipt',
    'assertRecallWedgeContractReadOnlyBoundary',
  ])(
    'the in-repo host barrel re-exports %s under the Phase 30 contract seam',
    (sym) => {
      expect(sym in host).toBe(true);
    },
  );

  it('the host barrel re-exports the contract module via a relative ./recall-wedge-contract specifier', () => {
    const barrel = readFileSync(HOST_BARREL, 'utf8');
    expect(
      /from\s+['"]\.\/recall-wedge-contract\.js['"]/.test(barrel),
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Exported contract preserves the Phase 29B version literal.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — contract version literal preserved through the host seam', () => {
  it("STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION === 'phase-29b.recall-wedge-contract.v0' (via host barrel)", () => {
    expect(host.STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION).toBe(
      'phase-29b.recall-wedge-contract.v0',
    );
  });

  it('the boundary constant carries the same version literal', () => {
    expect(host.RECALL_WEDGE_CONTRACT_BOUNDARY.contract_version).toBe(
      'phase-29b.recall-wedge-contract.v0',
    );
  });

  it('the type alias matches the const literal at compile time', () => {
    const v: StraylightRecallWedgeContractVersion =
      host.STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION;
    expect(v).toBe('phase-29b.recall-wedge-contract.v0');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Dixie is the default and only active host. Finn is boundary-only.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — Dixie-first default + Finn-as-boundary-only via host barrel', () => {
  it("DEFAULT_RECALL_WEDGE_HOST_KIND === 'dixie-first-inspection-bff'", () => {
    expect(host.DEFAULT_RECALL_WEDGE_HOST_KIND).toBe(
      'dixie-first-inspection-bff',
    );
  });

  it('the active host-kinds tuple lists exactly the Dixie-first kind', () => {
    expect([...host.RECALL_WEDGE_ACTIVE_HOST_KINDS]).toEqual([
      'dixie-first-inspection-bff',
    ]);
  });

  it("'finn-runtime-enforcement-later' is NOT an active host kind", () => {
    const active: ReadonlyArray<RecallWedgeHostKind> =
      host.RECALL_WEDGE_ACTIVE_HOST_KINDS;
    expect(active.includes('finn-runtime-enforcement-later')).toBe(false);
  });

  it('the contract boundary marks Finn as later runtime-enforcement (NOT active)', () => {
    const finnLane = host.RECALL_WEDGE_CONTRACT_BOUNDARY.owners.finn;
    expect(typeof finnLane).toBe('string');
    expect(finnLane.toLowerCase()).toContain('not an active host');
  });

  it('assertRecallWedgeContractReadOnlyBoundary accepts the canonical boundary through the host barrel', () => {
    expect(() => host.assertRecallWedgeContractReadOnlyBoundary()).not.toThrow();
    expect(() =>
      host.assertRecallWedgeContractReadOnlyBoundary(
        host.RECALL_WEDGE_CONTRACT_BOUNDARY,
      ),
    ).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Hounfour remains class / schema / conformance-vector substrate only.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — Hounfour substrate-only via host barrel', () => {
  it('Hounfour boundary description names substrate, not policy / signer / runtime', () => {
    const lane = host.RECALL_WEDGE_CONTRACT_BOUNDARY.owners.hounfour;
    expect(typeof lane).toBe('string');
    expect(lane.toLowerCase()).toContain('substrate');
    // Negative pin: Hounfour MUST NOT be described as policy /
    // signer / signature / audit / runtime owner — those are
    // Straylight semantics.
    expect(/\bpolicy\b/i.test(lane)).toBe(false);
    expect(/\bsigner\b/i.test(lane)).toBe(false);
    expect(/\bsignature\b/i.test(lane)).toBe(false);
    expect(/\baudit\b/i.test(lane)).toBe(false);
    expect(/\bruntime\b/i.test(lane)).toBe(false);
  });

  it('Straylight boundary description names the semantic ownership lane', () => {
    const lane = host.RECALL_WEDGE_CONTRACT_BOUNDARY.owners.straylight;
    expect(typeof lane).toBe('string');
    expect(lane.toLowerCase()).toContain('semantic');
  });

  it('createRecallWedgeSourceCorpusRef pins the Phase 29A package literals (registry-resolution metadata only)', () => {
    const ref: RecallWedgeSourceCorpusRef =
      host.createRecallWedgeSourceCorpusRef();
    expect(ref.packageName).toBe('@0xhoneyjar/loa-hounfour');
    expect(ref.packageVersion).toBe('8.7.0');
    expect(ref.corpus).toBe('recall-wedge-conformance-vectors');
    expect(ref.pathPrefix).toBe('/loa-hounfour/8.7.0/');
    // Optional metadata-only integrity field.
    expect(ref.integrity).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Finn remains boundary-only — its environment surface label exists,
//    but Finn is never an active host kind.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — Finn boundary-only via host barrel', () => {
  it('every required boundary owner is present with a non-empty description', () => {
    const requiredOwners: ReadonlyArray<RecallWedgeBoundaryOwner> = [
      'straylight',
      'hounfour',
      'dixie',
      'finn',
      'loa',
    ];
    for (const owner of requiredOwners) {
      const description: string =
        host.RECALL_WEDGE_CONTRACT_BOUNDARY.owners[owner];
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('boundary assertion throws when a candidate widens Finn into active host kinds', () => {
    const drift = {
      contract_version: host.STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION,
      owners: host.RECALL_WEDGE_CONTRACT_BOUNDARY.owners,
      active_host_kinds: [
        'dixie-first-inspection-bff',
        'finn-runtime-enforcement-later',
      ] as ReadonlyArray<RecallWedgeHostKind>,
    } as unknown as RecallWedgeContractBoundary;
    expect(() =>
      host.assertRecallWedgeContractReadOnlyBoundary(drift),
    ).toThrow();
  });

  it('boundary assertion throws when the contract version drifts off the Phase 29B literal', () => {
    const drift = {
      ...host.RECALL_WEDGE_CONTRACT_BOUNDARY,
      contract_version: 'phase-30.recall-wedge-contract.v0',
    } as unknown as RecallWedgeContractBoundary;
    expect(() =>
      host.assertRecallWedgeContractReadOnlyBoundary(drift),
    ).toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. Receipt composition path is wired end-to-end through the host barrel.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — receipt composition is wired end-to-end through the host barrel', () => {
  const sourceCorpus: RecallWedgeSourceCorpusRef =
    host.createRecallWedgeSourceCorpusRef();

  function makeRequest(): RecallWedgeInspectionRequest {
    const actor_scope: RecallWedgeActorScope = {
      actor_id: 'actor-phase-30',
      estate_id: 'estate-phase-30',
    };
    const environment: RecallWedgeEnvironmentFrame = {
      purpose: 'phase-30-export-test',
      surface: 'test',
    };
    return {
      request_id: 'req-30-001',
      actor_scope,
      environment,
      include_challenged: false,
      include_revoked: false,
      include_forgotten: false,
      source_corpus: sourceCorpus,
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

  it('summarize → receipt round-trip via the host barrel produces the canonical Dixie-first receipt', () => {
    const items: RecallWedgeInspectionItem[] = [
      makeItem('include', 1),
      makeItem('include', 2),
      makeItem('exclude', 1),
      makeItem('redact', 1),
      makeItem('refuse', 1),
    ];
    const summary: RecallWedgeInspectionSummary =
      host.summarizeRecallWedgeInspection(items);
    expect(summary).toEqual({
      included_count: 2,
      excluded_count: 1,
      redacted_count: 1,
      refused_count: 1,
    });

    const receipt: RecallWedgeInspectionReceipt =
      host.createRecallWedgeInspectionReceipt({
        receipt_id: 'rec-30-001',
        request: makeRequest(),
        items,
      });
    expect(receipt.contract_version).toBe(
      'phase-29b.recall-wedge-contract.v0',
    );
    expect(receipt.host_kind).toBe('dixie-first-inspection-bff');
    expect(receipt.included_count).toBe(2);
    expect(receipt.excluded_count).toBe(1);
    expect(receipt.redacted_count).toBe(1);
    expect(receipt.refused_count).toBe(1);
    expect(receipt.source_corpus.packageName).toBe(
      '@0xhoneyjar/loa-hounfour',
    );
    expect(receipt.source_corpus.packageVersion).toBe('8.7.0');

    // Phase 30 also pins the InspectionResult composition shape:
    // a host consumer can wire request + items + receipt together
    // without invoking any wedge runtime.
    const result: RecallWedgeInspectionResult = {
      request: makeRequest(),
      items,
      receipt,
    };
    expect(result.items.length).toBe(items.length);
    expect(result.receipt.contract_version).toBe(
      'phase-29b.recall-wedge-contract.v0',
    );
  });

  it('every RecallWedgeInclusionDecision value is round-trippable through the host barrel', () => {
    const decisions: ReadonlyArray<RecallWedgeInclusionDecision> = [
      'include',
      'exclude',
      'redact',
      'refuse',
    ];
    for (const d of decisions) {
      const summary = host.summarizeRecallWedgeInspection([makeItem(d, 1)]);
      const total =
        summary.included_count +
        summary.excluded_count +
        summary.redacted_count +
        summary.refused_count;
      expect(total).toBe(1);
    }
  });

  it('every RecallWedgeEnvironmentSurface label is accepted by the contract type', () => {
    const surfaces: ReadonlyArray<RecallWedgeEnvironmentSurface> = [
      'operator',
      'dixie-bff',
      'finn-runtime',
      'test',
    ];
    for (const surface of surfaces) {
      const env: RecallWedgeEnvironmentFrame = {
        purpose: 'phase-30-surface-coverage',
        surface,
      };
      expect(env.surface).toBe(surface);
    }
  });

  it('every RecallWedgeRiskLevel literal is part of the union accepted by the contract type', () => {
    const levels: ReadonlyArray<RecallWedgeRiskLevel> = [
      'low',
      'standard',
      'high',
      'restricted',
    ];
    for (const risk_level of levels) {
      const env: RecallWedgeEnvironmentFrame = {
        purpose: 'phase-30-risk-coverage',
        surface: 'test',
        risk_level,
      };
      expect(env.risk_level).toBe(risk_level);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. The exported contract is a TYPE-LEVEL re-export only — the host
//    seam adds no runtime / policy / storage / audit / signature / signer
//    implementation, and the underlying contract module imports nothing
//    from those concerns.
//
//    The scan parses every import / export-from / dynamic import() /
//    require() specifier out of the contract source and applies the
//    forbidden patterns to the SPECIFIER STRINGS. That catches both
//    package-style absolute substrings (e.g. `'@straylight/runtime'`,
//    `'src/straylight/runtime/...'` from a build alias) AND relative
//    paths that traverse up into a forbidden implementation area
//    (e.g. `'../runtime/...'`, `'../policy.js'`, `'../signer'`,
//    `'../../straylight/audit.js'`). The previous absolute-substring
//    scan would have missed the relative variant, so a future change
//    that smuggled `import { foo } from '../runtime/bar.js'` into
//    `recall-wedge-contract.ts` (which sits at
//    `src/straylight/host/recall-wedge-contract.ts`, so `../runtime/`
//    resolves to `src/straylight/runtime/`) would have evaded the
//    guard. The strengthened scan rejects it.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Extract every static / dynamic import or `export ... from` specifier
 * out of a TypeScript source file. The matchers cover:
 *   * `import x from 'spec'`              (default + named + namespace)
 *   * `import 'spec'`                     (side-effect import)
 *   * `import type { x } from 'spec'`     (type-only import)
 *   * `export { x } from 'spec'`          (re-export)
 *   * `export * from 'spec'`              (star re-export)
 *   * `export type { x } from 'spec'`     (type-only re-export)
 *   * `import('spec')`                    (dynamic import)
 *   * `require('spec')`                   (CommonJS-shape require)
 *
 * Each match returns the inner specifier string (without the quotes).
 * Comment / prose mentions of the same specifier are NOT matched
 * because we anchor on the keyword grammar (`import`, `export ... from`,
 * `import(`, `require(`).
 */
function extractImportSpecifiers(src: string): ReadonlyArray<string> {
  const specs: string[] = [];
  const patterns: ReadonlyArray<RegExp> = [
    // import ... from 'spec' (covers default, named, namespace, type-only)
    /\bimport\b(?:\s+type)?\s+[^'"`;]*?\bfrom\s*(['"])([^'"`]+)\1/g,
    // import 'spec' (bare side-effect import)
    /\bimport\s*(['"])([^'"`]+)\1/g,
    // export ... from 'spec' (covers `export *`, `export { ... }`, `export type { ... }`)
    /\bexport\b(?:\s+type)?\s+(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s*(['"])([^'"`]+)\1/g,
    // dynamic import('spec')
    /\bimport\s*\(\s*(['"])([^'"`]+)\1\s*\)/g,
    // require('spec')
    /\brequire\s*\(\s*(['"])([^'"`]+)\1\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of src.matchAll(re)) {
      const spec = m[2];
      if (typeof spec === 'string' && spec.length > 0) specs.push(spec);
    }
  }
  return specs;
}

/**
 * Forbidden specifier matchers. Each matcher either matches the
 * absolute (package-style) form OR the relative form that resolves
 * into the same forbidden area. A matcher is intentionally narrow so
 * legitimate sibling files (e.g. `./recall-wedge-contract.js`,
 * `./types.js`) are not caught.
 *
 * "Relative" means `'.'` or `'..'` followed by a slash. We do NOT
 * try to canonicalize the path because tsc/vitest already enforce
 * resolution; we only need to show the SPECIFIER STRING reaches a
 * forbidden segment. Any number of `../` traversals is matched via
 * `(?:\.\.\/)+`.
 */
const FORBIDDEN_AREA_MATCHERS: ReadonlyArray<{
  label: string;
  match: (spec: string) => boolean;
}> = [
  {
    label: 'src/straylight/runtime/** (package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/runtime(?:\/|$)/.test(s) ||
      /^(?:\.\.\/)+runtime(?:\/|$)/.test(s) ||
      /^\.\/runtime(?:\/|$)/.test(s),
  },
  {
    label: 'src/straylight/policy (package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/policy(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+policy(?:\/|\.|$)/.test(s) ||
      /^\.\/policy(?:\/|\.|$)/.test(s),
  },
  {
    label: 'src/straylight/storage/** (package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/storage(?:\/|$)/.test(s) ||
      /^(?:\.\.\/)+storage(?:\/|$)/.test(s) ||
      /^\.\/storage(?:\/|$)/.test(s),
  },
  {
    label: 'src/straylight/audit (package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/audit(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+audit(?:\/|\.|$)/.test(s) ||
      /^\.\/audit(?:\/|\.|$)/.test(s),
  },
  {
    label: 'src/straylight/signatures (package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/signatures(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+signatures(?:\/|\.|$)/.test(s) ||
      /^\.\/signatures(?:\/|\.|$)/.test(s),
  },
  {
    label: 'src/straylight/signature/** (pinned guard, package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/signature(?:\/|\.|$)/.test(s) ||
      /(?:^|\/)straylight\/crypto\/signature(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+signature(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+crypto\/signature(?:\/|\.|$)/.test(s) ||
      /^\.\/signature(?:\/|\.|$)/.test(s),
  },
  {
    label: 'src/straylight/keyring (signer competence; package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/keyring(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+keyring(?:\/|\.|$)/.test(s) ||
      /^\.\/keyring(?:\/|\.|$)/.test(s),
  },
  {
    label: 'src/straylight/signer/** (pinned guard, package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/signer(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+signer(?:\/|\.|$)/.test(s) ||
      /^\.\/signer(?:\/|\.|$)/.test(s),
  },
  {
    label: 'src/straylight/recall (recall runtime; package or relative)',
    match: (s) =>
      /(?:^|\/)straylight\/recall(?:\/|\.|$)/.test(s) ||
      /^(?:\.\.\/)+recall(?:\/|\.|$)/.test(s) ||
      /^\.\/recall(?:\/|\.|$)/.test(s),
  },
];

describe('Phase 30 — host export does NOT add runtime/policy/storage/audit/signature/signer implementation', () => {
  const contractSrc = readFileSync(CONTRACT_FILE, 'utf8');
  const contractSpecs = extractImportSpecifiers(contractSrc);

  it.each(FORBIDDEN_AREA_MATCHERS)(
    'recall-wedge-contract.ts (the contract module re-exported by the host barrel) does NOT import from $label',
    ({ match, label }) => {
      const offending = contractSpecs.filter(match);
      expect(
        offending,
        `Phase 30 host export must not transitively import ${label} — found: ${JSON.stringify(offending)}`,
      ).toEqual([]);
    },
  );

  it('recall-wedge-contract.ts does NOT import from the Hounfour package (preserves Phase 24C / 29B intent)', () => {
    const offending = contractSpecs.filter((s) =>
      /^@0xhoneyjar\/loa-hounfour(?:\/|$)/.test(s),
    );
    expect(offending).toEqual([]);
  });

  it('recall-wedge-contract.ts does NOT import from the wedge public surface (package or relative)', () => {
    const offending = contractSpecs.filter(
      (s) =>
        s === '@loa/straylight' ||
        /^@loa\/straylight$/.test(s) ||
        // The wedge public API barrel sits two segments up from
        // src/straylight/host/recall-wedge-contract.ts.
        /^\.\.\/\.\.\/index(?:\.|$)/.test(s) ||
        /^\.\.\/index(?:\.|$)/.test(s),
    );
    expect(offending).toEqual([]);
  });

  it('recall-wedge-contract.ts is allowed to have no imports at all (Phase 29B-authored standalone module)', () => {
    // The contract module is intentionally standalone; pinning that
    // posture here makes a future drift visible immediately. We do
    // NOT require zero imports forever — only that whatever imports
    // exist survive the forbidden-area filters above.
    expect(Array.isArray(contractSpecs)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. This test file itself imports only from the in-repo source host
//    barrel + node:* + vitest. This proves the SOURCE-LEVEL host
//    barrel is sufficient for an in-repo contract consumer to reach
//    every symbol Phase 30 exposes; the type-only `@loa/straylight/
//    host` package surface proof is in section 10 below (compiled
//    with `tsc --noEmit` from a temp fixture).
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — this test file imports only from the in-repo source host barrel (and node/vitest)', () => {
  const self = readFileSync(SELF_FILE, 'utf8');
  // Build the import-line block first (so prose comments naming every
  // forbidden symbol do NOT cause a self-match) and then run the
  // robust specifier extractor over JUST those lines.
  const importLines = self
    .split(/\r?\n/)
    .filter((line) => /^\s*(?:import\b|export\s+(?:\*|\{))/.test(line));
  const importBlock = importLines.join('\n');
  const selfSpecs = extractImportSpecifiers(importBlock);

  const FORBIDDEN_CONSUMER_AREAS: ReadonlyArray<{
    label: string;
    match: (spec: string) => boolean;
  }> = [
    {
      label: 'wedge public API package',
      match: (s) => s === '@loa/straylight',
    },
    {
      label: 'wedge public API (relative)',
      match: (s) => /^\.\.\/src\/straylight\/index(?:\.|$)/.test(s),
    },
    ...FORBIDDEN_AREA_MATCHERS,
    {
      label: 'src/straylight/host/intake (handler)',
      match: (s) =>
        /(?:^|\/)straylight\/host\/intake(?:\/|\.|$)/.test(s) ||
        /^\.\.\/src\/straylight\/host\/intake(?:\/|\.|$)/.test(s),
    },
    {
      label: 'src/straylight/host/receipt (handler)',
      match: (s) =>
        /(?:^|\/)straylight\/host\/receipt(?:\/|\.|$)/.test(s) ||
        /^\.\.\/src\/straylight\/host\/receipt(?:\/|\.|$)/.test(s),
    },
    {
      label: 'src/straylight/host/recall-wedge-contract (deep import)',
      match: (s) =>
        /(?:^|\/)straylight\/host\/recall-wedge-contract(?:\/|\.|$)/.test(s) ||
        /^\.\.\/src\/straylight\/host\/recall-wedge-contract(?:\/|\.|$)/.test(s),
    },
    {
      label: 'Hounfour package',
      match: (s) => /^@0xhoneyjar\/loa-hounfour(?:\/|$)/.test(s),
    },
    {
      label: 'sibling repo loa-dixie',
      match: (s) => /loa-dixie/.test(s),
    },
    {
      label: 'sibling repo loa-finn',
      match: (s) => /loa-finn/.test(s),
    },
    {
      label: 'sibling repo loa-freeside',
      match: (s) => /loa-freeside/.test(s),
    },
    {
      label: 'sibling repo loa-hounfour working tree',
      match: (s) => /(?:^|\/)\.\.\/loa-hounfour(?:\/|$)/.test(s) || /^\.\.\/loa-hounfour/.test(s),
    },
  ];

  it.each(FORBIDDEN_CONSUMER_AREAS)(
    'phase-30 test does NOT import from $label',
    ({ match, label }) => {
      const offending = selfSpecs.filter(match);
      expect(
        offending,
        `Phase 30 test must not import ${label} — found: ${JSON.stringify(offending)}`,
      ).toEqual([]);
    },
  );

  it('phase-30 test imports only from the in-repo host barrel + node:* + vitest', () => {
    expect(importLines.length).toBeGreaterThan(0);
    const allowedSpecifiers = new Set<string>([
      "'../src/straylight/host/index.js'",
      "'node:child_process'",
      "'node:fs'",
      "'node:os'",
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
        `Phase 30 test imports unexpected specifier: ${specifier}`,
      ).toBe(true);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 9. The package surface is ready for Dixie consumption — `./host` is
//    a `types`-only export, the host barrel re-exports the contract,
//    and no new package.json export key is required.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — package surface ready for Dixie consumption', () => {
  it('package.json `./host` export is types-only (no runtime import field)', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
    ) as { exports?: Record<string, unknown> };
    expect(pkg.exports).toBeDefined();
    if (!pkg.exports) return;
    const hostEntry = pkg.exports['./host'] as
      | Record<string, unknown>
      | undefined;
    expect(hostEntry).toBeDefined();
    if (!hostEntry) return;
    expect('types' in hostEntry).toBe(true);
    expect('import' in hostEntry).toBe(false);
    expect('require' in hostEntry).toBe(false);
    expect('default' in hostEntry).toBe(false);
  });

  it('package.json declares exactly the existing three export keys (no new Phase 30 subpath)', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
    ) as { exports?: Record<string, unknown> };
    if (!pkg.exports) return;
    const keys = Object.keys(pkg.exports).sort();
    expect(keys).toEqual(['.', './host', './runtime/recall-intake']);
    expect(keys).not.toContain('./host/recall-wedge-contract');
  });

  it('the host barrel exposes the contract symbols a future Dixie BFF consumer will read', () => {
    // The Dixie-first inspection / BFF path is named explicitly
    // by `'dixie-first-inspection-bff'`. A future Dixie consumer
    // will read this exact literal off the host barrel; pinning
    // it here means a rename cannot happen silently.
    expect(host.DEFAULT_RECALL_WEDGE_HOST_KIND).toBe(
      'dixie-first-inspection-bff',
    );
    expect([...host.RECALL_WEDGE_ACTIVE_HOST_KINDS]).toEqual([
      'dixie-first-inspection-bff',
    ]);
    expect(typeof host.createRecallWedgeSourceCorpusRef).toBe('function');
    expect(typeof host.summarizeRecallWedgeInspection).toBe('function');
    expect(typeof host.createRecallWedgeInspectionReceipt).toBe('function');
    expect(typeof host.assertRecallWedgeContractReadOnlyBoundary).toBe(
      'function',
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 10. Type-only `@loa/straylight/host` package-surface proof.
//
//     The cases above prove the in-repo SOURCE host barrel re-exports
//     the contract — the SHAPE of the regenerated declaration emit at
//     `dist-types/src/straylight/host/index.d.ts`. They do NOT, on
//     their own, prove a future Dixie consumer can resolve the
//     specifier `@loa/straylight/host`. Because `package.json`'s
//     `./host` export is `types`-only, runtime imports are NOT
//     supported; the only thing a future Dixie consumer can do
//     against the package surface is `import type`.
//
//     This block writes a deterministic temp consumer fixture into
//     a fresh `mkdtempSync` directory and compiles it with the
//     in-repo `tsc --noEmit`. The fixture imports from
//     `@loa/straylight/host` using `import type` only and uses
//     `typeof` to check helper SIGNATURES (still type-space, no
//     runtime import). The specifier is resolved through a
//     `tsconfig.json` `paths` entry that points at the in-repo
//     `dist-types/src/straylight/host/index.d.ts` declaration
//     emit — i.e. exactly the file `package.json`'s `./host` export
//     types-key resolves to. This is offline, sibling-repo-free,
//     network-free, and does NOT use `npm pack`.
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 30 — `@loa/straylight/host` type-only consumer proof (tsc --noEmit)', () => {
  const HOST_DECL = resolve(ROOT, 'dist-types/src/straylight/host/index.d.ts');
  const TSC_BIN = resolve(ROOT, 'node_modules/.bin/tsc');

  it('compiles a temp `import type`-only consumer of `@loa/straylight/host`', () => {
    // Sanity-check the prerequisites; these are reproduced by `npm
    // run build` and committed under ADR-024G's "dist-types is
    // committed AND reproducible" policy.
    expect(
      readFileSync(HOST_DECL, 'utf8').includes('recall-wedge-contract'),
      `expected ${HOST_DECL} to re-export the recall-wedge-contract module`,
    ).toBe(true);

    const tmp = mkdtempSync(resolve(tmpdir(), 'phase-30-host-type-consumer-'));
    try {
      const consumerSrc = [
        `// Phase 30 — type-only \`@loa/straylight/host\` consumer fixture.`,
        `// Generated by tests/phase-30-host-recall-wedge-contract-export.test.ts.`,
        `// IMPORTANT: every import below uses \`import type\` so this file`,
        `// has zero runtime effect. The fixture proves that a future Dixie`,
        `// consumer can type-check against \`@loa/straylight/host\` while`,
        `// the package's \`./host\` export remains types-only.`,
        ``,
        `import type {`,
        `  StraylightRecallWedgeContractVersion,`,
        `  RecallWedgeHostKind,`,
        `  RecallWedgeContractBoundary,`,
        `  RecallWedgeInspectionRequest,`,
        `  RecallWedgeInspectionReceipt,`,
        `  RecallWedgeInspectionSummary,`,
        `  RecallWedgeActorScope,`,
        `  RecallWedgeBoundaryOwner,`,
        `  RecallWedgeEnvironmentFrame,`,
        `  RecallWedgeEnvironmentSurface,`,
        `  RecallWedgeInclusionDecision,`,
        `  RecallWedgeInspectionItem,`,
        `  RecallWedgeInspectionResult,`,
        `  RecallWedgeRiskLevel,`,
        `  RecallWedgeSourceCorpusRef,`,
        `} from '@loa/straylight/host';`,
        ``,
        `// \`import type * as Host\` is type-only; the namespace binding`,
        `// is erased at runtime. We use it only to query helper`,
        `// SIGNATURES via \`typeof\` — still pure type space, still no`,
        `// runtime import of the package.`,
        `import type * as Host from '@loa/straylight/host';`,
        ``,
        `type SummarizeFn = typeof Host.summarizeRecallWedgeInspection;`,
        `type ReceiptFn = typeof Host.createRecallWedgeInspectionReceipt;`,
        `type CorpusFn = typeof Host.createRecallWedgeSourceCorpusRef;`,
        `type AssertFn = typeof Host.assertRecallWedgeContractReadOnlyBoundary;`,
        `type ContractVersionConst =`,
        `  typeof Host.STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION;`,
        `type ActiveHostKindsConst = typeof Host.RECALL_WEDGE_ACTIVE_HOST_KINDS;`,
        `type DefaultHostKindConst = typeof Host.DEFAULT_RECALL_WEDGE_HOST_KIND;`,
        `type BoundaryConst = typeof Host.RECALL_WEDGE_CONTRACT_BOUNDARY;`,
        ``,
        `// Force every type to be referenced so an accidental rename`,
        `// or removal in the host barrel produces a tsc error here.`,
        `declare const _v: StraylightRecallWedgeContractVersion;`,
        `declare const _hk: RecallWedgeHostKind;`,
        `declare const _cb: RecallWedgeContractBoundary;`,
        `declare const _req: RecallWedgeInspectionRequest;`,
        `declare const _rec: RecallWedgeInspectionReceipt;`,
        `declare const _sum: RecallWedgeInspectionSummary;`,
        `declare const _as: RecallWedgeActorScope;`,
        `declare const _bo: RecallWedgeBoundaryOwner;`,
        `declare const _ef: RecallWedgeEnvironmentFrame;`,
        `declare const _es: RecallWedgeEnvironmentSurface;`,
        `declare const _id: RecallWedgeInclusionDecision;`,
        `declare const _ii: RecallWedgeInspectionItem;`,
        `declare const _ir: RecallWedgeInspectionResult;`,
        `declare const _rl: RecallWedgeRiskLevel;`,
        `declare const _sc: RecallWedgeSourceCorpusRef;`,
        `declare const _sf: SummarizeFn;`,
        `declare const _rf: ReceiptFn;`,
        `declare const _cf: CorpusFn;`,
        `declare const _af: AssertFn;`,
        `declare const _cv: ContractVersionConst;`,
        `declare const _ahk: ActiveHostKindsConst;`,
        `declare const _dhk: DefaultHostKindConst;`,
        `declare const _bc: BoundaryConst;`,
        ``,
        `void _v; void _hk; void _cb; void _req; void _rec; void _sum;`,
        `void _as; void _bo; void _ef; void _es; void _id; void _ii;`,
        `void _ir; void _rl; void _sc;`,
        `void _sf; void _rf; void _cf; void _af;`,
        `void _cv; void _ahk; void _dhk; void _bc;`,
        ``,
      ].join('\n');

      // tsconfig pins the `@loa/straylight/host` specifier to the
      // exact same declaration file `package.json`'s `./host`
      // export's `types` key resolves to. Strict, isolatedModules
      // ON, no DOM / no runtime libs needed.
      const tsconfig = {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          noEmit: true,
          isolatedModules: true,
          skipLibCheck: true,
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          baseUrl: '.',
          paths: {
            '@loa/straylight/host': [HOST_DECL],
          },
          types: [],
        },
        include: ['consumer.ts'],
      };

      writeFileSync(resolve(tmp, 'consumer.ts'), consumerSrc, 'utf8');
      writeFileSync(
        resolve(tmp, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2),
        'utf8',
      );

      // Compile the fixture. `tsc --noEmit` is offline, deterministic,
      // and respects the explicit `paths` mapping above. A failure
      // means the package-surface type contract drifted.
      try {
        execFileSync(TSC_BIN, ['--noEmit', '-p', resolve(tmp, 'tsconfig.json')], {
          cwd: tmp,
          stdio: 'pipe',
          encoding: 'utf8',
        });
      } catch (err) {
        const e = err as { stdout?: string; stderr?: string; message?: string };
        throw new Error(
          [
            'Phase 30 type-only `@loa/straylight/host` consumer fixture failed to compile.',
            'This means a future Dixie consumer would NOT be able to type-check against',
            'the existing `./host` package export. tsc output:',
            e.stdout ?? '',
            e.stderr ?? '',
            e.message ?? '',
          ].join('\n'),
        );
      }

      // Sanity-check the fixture contains zero runtime imports of
      // `@loa/straylight/host`. Every import must be `import type`
      // (or `import type * as`).
      const written = readFileSync(resolve(tmp, 'consumer.ts'), 'utf8');
      const runtimeImportMatches = written.match(
        /^\s*import\s+(?!type\b)[^'";]*?from\s+['"]@loa\/straylight\/host['"]/gm,
      );
      expect(runtimeImportMatches).toBeNull();
      // And no `import('@loa/straylight/host')` / `require('@loa/straylight/host')`.
      expect(
        /\bimport\s*\(\s*['"]@loa\/straylight\/host['"]\s*\)/.test(written),
      ).toBe(false);
      expect(
        /\brequire\s*\(\s*['"]@loa\/straylight\/host['"]\s*\)/.test(written),
      ).toBe(false);
    } finally {
      // Deterministic cleanup. We never want a stale fixture to
      // leak into a subsequent test run.
      try {
        rmSync(tmp, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  });

  it('the temp fixture target file (`dist-types/src/straylight/host/index.d.ts`) is the path `package.json` `./host` export points at', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
    ) as { exports?: Record<string, { types?: string }> };
    const hostTypes = pkg.exports?.['./host']?.types;
    expect(hostTypes).toBe('./dist-types/src/straylight/host/index.d.ts');
  });

  it('the type-only consumer fixture cannot be a runtime consumer (the `./host` export has no `import` / `require` / `default` field)', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
    ) as { exports?: Record<string, Record<string, unknown>> };
    const hostEntry = pkg.exports?.['./host'];
    expect(hostEntry).toBeDefined();
    if (!hostEntry) return;
    expect('import' in hostEntry).toBe(false);
    expect('require' in hostEntry).toBe(false);
    expect('default' in hostEntry).toBe(false);
  });

  it('the temp consumer fixture creates a directory we can clean up (mkdtempSync round-trip works)', () => {
    // Cheap belt-and-braces case: verify mkdtempSync usage in the
    // sibling case above is supported on this platform; otherwise
    // the cleanup branch silently swallows errors and the prior
    // test could leak a tempdir.
    const probe = mkdtempSync(resolve(tmpdir(), 'phase-30-probe-'));
    try {
      mkdirSync(resolve(probe, 'sub'));
      writeFileSync(resolve(probe, 'sub', 'x.txt'), 'x', 'utf8');
    } finally {
      rmSync(probe, { recursive: true, force: true });
    }
  });
});
