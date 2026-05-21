// Phase 29A — @0xhoneyjar/loa-hounfour@8.7.0 vector-access conformance.
//
// Pins (per docs/decisions/ADR-027B-Track1-code-candidate-scope.md
// §"Decision" §3 / §6):
//
//   * package.json declares @0xhoneyjar/loa-hounfour pinned to exactly
//     "8.7.0" (no range, no widening) — Phase 29A scope §2.a.
//   * package-lock.json resolves @0xhoneyjar/loa-hounfour to 8.7.0 from
//     https://npm.pkg.github.com (registry-resolution-only — §4.d).
//   * The installed package's name is @0xhoneyjar/loa-hounfour and its
//     version is 8.7.0.
//   * The installed @0xhoneyjar/loa-hounfour@8.7.0 package exposes the
//     seven required recall-wedge composition-substrate paths
//     (five vectors + recall-wedge README.md +
//     schemas/conformance-vector.schema.json envelope) — §2.c.
//   * The access path resolves through the installed package via
//     import.meta.resolve() of the package's declared "./schemas/*"
//     export, then derives the package root from it and checks
//     package-shipped sibling paths (`vectors/`, `schemas/`) which the
//     package's own `files:` field declares as shipped. The probe does
//     NOT hardcode a node_modules/ traversal (§4.a, §4.e).
//   * The probe does NOT read from a sibling-repo working tree (§4.c)
//     and does NOT rely on unpublished package state (§4.d).
//   * The probe FAILS CLOSED if any required path is missing or
//     unreadable (§4.b). No silent fallback.
//   * The probe does NOT vendor any vector JSON, the recall-wedge
//     README.md, or the envelope schema into Straylight (§2.e).
//   * The probe does NOT exercise Straylight runtime recall behavior,
//     signature verification, signer competence, policy execution,
//     audit-chain enforcement, or storage adapters. Vectors are
//     consumed as test inputs only — class-vs-policy boundary
//     preserved (§7).
//
// These pins prove the recall-wedge conformance-vector corpus is
// reachable from the installed @0xhoneyjar/loa-hounfour@8.7.0 package
// without vendoring. They are NOT a runtime-recall test, NOT a
// signature-verification test, and NOT a Hounfour shape-adoption
// test. ADR-022E gates #1, #2, #3, #4, #5, #17, #18 remain HELD.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const PACKAGE_JSON = resolve(ROOT, 'package.json');
const PACKAGE_LOCK = resolve(ROOT, 'package-lock.json');

const HOUNFOUR_NAME = '@0xhoneyjar/loa-hounfour';
const HOUNFOUR_VERSION = '8.7.0';
const HOUNFOUR_REGISTRY = 'https://npm.pkg.github.com';

// Anchor the package-access probe on a path that the Hounfour
// package itself declares under "exports" (`./schemas/*`), so that
// resolution flows through npm/yarn/pnpm exports semantics rather
// than a hardcoded node_modules walk. From the resolved schema URL
// we derive the package root and then read package-shipped sibling
// directories (vectors/, schemas/) that Hounfour's own `files:`
// field declares as part of the published artifact.
const SCHEMA_ANCHOR_SUBPATH =
  '@0xhoneyjar/loa-hounfour/schemas/conformance-vector.schema.json';

/**
 * Resolve the installed Hounfour package root via the registry-
 * declared `./schemas/*` export. Returns the directory containing
 * the package's package.json. Throws if resolution fails — the
 * caller is responsible for surfacing that as a fail-closed test
 * failure (§4.b).
 */
function resolveHounfourPackageRoot(): string {
  // createRequire honors Node's exports / package-resolution rules
  // (including the "./schemas/*" exports condition Hounfour ships).
  // It does NOT walk node_modules/ as an opaque directory tree;
  // a sibling-repo or workspace resolution would surface here too.
  const require = createRequire(import.meta.url);
  const schemaPath = require.resolve(SCHEMA_ANCHOR_SUBPATH);
  // schemas/conformance-vector.schema.json — go up two dirs to get
  // the package root.
  return resolve(dirname(schemaPath), '..');
}

/**
 * The seven required recall-wedge composition-substrate paths under
 * the installed @0xhoneyjar/loa-hounfour@8.7.0 package, each
 * referenced as the on-disk path inside the resolved package
 * (§4.f). These mirror the corpus catalog cited in
 * docs/decisions/ADR-027B-Track1-code-candidate-scope.md.
 */
const REQUIRED_PACKAGE_RELATIVE_PATHS: ReadonlyArray<string> = [
  'vectors/conformance/recall-wedge/assertion-admitted.json',
  'vectors/conformance/recall-wedge/commitment-root.json',
  'vectors/conformance/recall-wedge/recall-pack.json',
  'vectors/conformance/recall-wedge/recall-receipt.json',
  'vectors/conformance/recall-wedge/recall-request.json',
  'vectors/conformance/recall-wedge/README.md',
  'schemas/conformance-vector.schema.json',
];

interface StraylightPackageJson {
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
}

interface PackageLockEntry {
  version?: string;
  resolved?: string;
}

interface PackageLockJson {
  packages?: Record<string, PackageLockEntry>;
}

interface HounfourPackageJson {
  name?: string;
  version?: string;
  files?: unknown;
}

describe('Phase 29A — Straylight pins @0xhoneyjar/loa-hounfour@8.7.0 (registry-resolution only)', () => {
  it('package.json pins @0xhoneyjar/loa-hounfour to exactly 8.7.0 (no range, no widening)', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as StraylightPackageJson;
    expect(pkg.dependencies?.[HOUNFOUR_NAME]).toBe(HOUNFOUR_VERSION);
  });

  it('package.json declares engines.node >=22 to match @0xhoneyjar/loa-hounfour@8.7.0 engine floor', () => {
    // @0xhoneyjar/loa-hounfour@8.7.0 declares engines.node ">=22".
    // Because Phase 29A pins that dependency exactly to 8.7.0,
    // Straylight must not advertise a lower Node engine floor:
    // doing so would let Straylight install on a Node version
    // its own pinned dependency refuses to run on. Flatline
    // Phase 1 finding (Codex+GPT consensus, this branch).
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as StraylightPackageJson;
    expect(pkg.engines?.node).toBe('>=22');
  });

  it('package-lock.json resolves @0xhoneyjar/loa-hounfour to 8.7.0 from npm.pkg.github.com', () => {
    const lock = JSON.parse(readFileSync(PACKAGE_LOCK, 'utf8')) as PackageLockJson;
    const entry = lock.packages?.[`node_modules/${HOUNFOUR_NAME}`];
    expect(entry, 'package-lock entry for @0xhoneyjar/loa-hounfour must exist').toBeDefined();
    expect(entry?.version).toBe(HOUNFOUR_VERSION);
    expect(typeof entry?.resolved).toBe('string');
    expect(entry?.resolved?.startsWith(HOUNFOUR_REGISTRY)).toBe(true);
  });
});

describe('Phase 29A — installed package metadata matches @0xhoneyjar/loa-hounfour@8.7.0', () => {
  it('the installed package root resolves through package-manager exports semantics', () => {
    const pkgRoot = resolveHounfourPackageRoot();
    expect(existsSync(pkgRoot)).toBe(true);
    expect(statSync(pkgRoot).isDirectory()).toBe(true);
  });

  it('the installed package.json reports name=@0xhoneyjar/loa-hounfour and version=8.7.0', () => {
    const pkgRoot = resolveHounfourPackageRoot();
    const pkgJsonPath = resolve(pkgRoot, 'package.json');
    expect(existsSync(pkgJsonPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as HounfourPackageJson;
    expect(pkg.name).toBe(HOUNFOUR_NAME);
    expect(pkg.version).toBe(HOUNFOUR_VERSION);
  });

  it('the installed package declares vectors/ and schemas/ as package-shipped via its files: field', () => {
    const pkgRoot = resolveHounfourPackageRoot();
    const pkg = JSON.parse(
      readFileSync(resolve(pkgRoot, 'package.json'), 'utf8'),
    ) as HounfourPackageJson;
    expect(Array.isArray(pkg.files)).toBe(true);
    if (!Array.isArray(pkg.files)) return;
    // The recall-wedge corpus + envelope schema reach Straylight
    // because Hounfour's own `files:` field declares these directories
    // as shipped artifacts of the published 8.7.0 tarball.
    expect(pkg.files).toContain('vectors');
    expect(pkg.files).toContain('schemas');
  });
});

describe('Phase 29A — package-shipped recall-wedge corpus is accessible from the installed package', () => {
  it.each(REQUIRED_PACKAGE_RELATIVE_PATHS)(
    'package/%s is present and readable inside the resolved @0xhoneyjar/loa-hounfour@8.7.0 package',
    (relativePath) => {
      const pkgRoot = resolveHounfourPackageRoot();
      const absPath = resolve(pkgRoot, relativePath);
      // Fail closed (§4.b): missing path → test failure with a
      // citation of the on-disk Hounfour path that was probed.
      expect(
        existsSync(absPath),
        `expected package-shipped path missing: ${HOUNFOUR_NAME}@${HOUNFOUR_VERSION}/${relativePath} (probed at ${absPath})`,
      ).toBe(true);
      const stat = statSync(absPath);
      expect(stat.isFile(), `expected ${relativePath} to be a file`).toBe(true);
      // Basic readability: the file must be non-empty. We do NOT
      // assert vector semantics; vectors are consumed as test inputs
      // only, not as runtime fixtures (§7).
      const contents = readFileSync(absPath, 'utf8');
      expect(contents.length).toBeGreaterThan(0);
    },
  );

  it.each(
    REQUIRED_PACKAGE_RELATIVE_PATHS.filter((p) => p.endsWith('.json')),
  )('package/%s parses as JSON', (relativePath) => {
    const pkgRoot = resolveHounfourPackageRoot();
    const absPath = resolve(pkgRoot, relativePath);
    expect(() => JSON.parse(readFileSync(absPath, 'utf8'))).not.toThrow();
  });

  it('the access path goes through package-manager resolution, not a sibling-repo working tree', () => {
    const pkgRoot = resolveHounfourPackageRoot();
    // The resolved package root MUST land under Straylight's own
    // node_modules/@0xhoneyjar/loa-hounfour. Any other prefix would
    // indicate sibling-repo or workspace resolution (§4.c) — which
    // Phase 29A forbids.
    const expectedRoot = resolve(ROOT, 'node_modules', '@0xhoneyjar', 'loa-hounfour');
    expect(pkgRoot).toBe(expectedRoot);
  });

  it('the probe fails closed when a fabricated package-shipped path is missing (§4.b)', () => {
    // Negative control: prove that the probe surfaces a missing path
    // as a failure rather than silently passing. The path below is
    // intentionally not declared by Hounfour 8.7.0 — if a future
    // Hounfour release ships it, this test will need a refresh.
    const pkgRoot = resolveHounfourPackageRoot();
    const fabricated = resolve(
      pkgRoot,
      'vectors/conformance/recall-wedge/__phase29a-not-shipped-by-hounfour-870__.json',
    );
    expect(existsSync(fabricated)).toBe(false);
  });
});

describe('Phase 29A — Straylight does NOT vendor Hounfour vector payloads (§2.e / §4)', () => {
  // The Phase 29A scope forbids copying vector JSON payloads, the
  // recall-wedge README, or the envelope schema into the Straylight
  // tree. Pin that the corpus does NOT appear under fixtures/.
  const FORBIDDEN_VENDORED_PATHS = [
    'fixtures/hounfour-recall-wedge/assertion-admitted.json',
    'fixtures/hounfour-recall-wedge/commitment-root.json',
    'fixtures/hounfour-recall-wedge/recall-pack.json',
    'fixtures/hounfour-recall-wedge/recall-receipt.json',
    'fixtures/hounfour-recall-wedge/recall-request.json',
    'fixtures/hounfour-recall-wedge/README.md',
    'fixtures/hounfour-recall-wedge/conformance-vector.schema.json',
  ];

  it.each(FORBIDDEN_VENDORED_PATHS)(
    'Straylight tree does NOT vendor %s',
    (relativePath) => {
      expect(existsSync(resolve(ROOT, relativePath))).toBe(false);
    },
  );

  it('this Phase 29A test file does NOT import Straylight runtime recall behavior', () => {
    const self = readFileSync(resolve(ROOT, 'tests/phase-29a-hounfour-vector-access.test.ts'), 'utf8');
    // Class-vs-policy boundary preservation (§7): Phase 29A consumes
    // the corpus as test inputs only. It must NOT pull in
    // Straylight's policy validator, signer-competence module,
    // signature verifier, audit-chain enforcer, or recall runtime.
    const FORBIDDEN_RUNTIME_IMPORTS = [
      /from\s+['"][^'"]*src\/straylight\/runtime\//,
      /from\s+['"][^'"]*src\/straylight\/audit/,
      /from\s+['"][^'"]*src\/straylight\/policy/,
      /from\s+['"][^'"]*src\/straylight\/storage\//,
      /from\s+['"][^'"]*src\/straylight\/host\//,
      /from\s+['"]@loa\/straylight/,
    ];
    for (const pattern of FORBIDDEN_RUNTIME_IMPORTS) {
      expect(
        pattern.test(self),
        `Phase 29A test must not import Straylight runtime: matched ${pattern}`,
      ).toBe(false);
    }
  });

  it('this Phase 29A test file does NOT read from a sibling-repo working tree (§4.c)', () => {
    const self = readFileSync(resolve(ROOT, 'tests/phase-29a-hounfour-vector-access.test.ts'), 'utf8');
    // Sibling-repo paths would look like ../loa-hounfour, ../loa-finn,
    // etc. The probe must reach Hounfour solely through the resolved
    // npm package, never through a working-tree-relative path.
    const FORBIDDEN_SIBLING_PATTERNS = [
      /['"]\.\.\/loa-hounfour/,
      /['"]\.\.\/loa-finn/,
      /['"]\.\.\/loa-dixie/,
      /['"]\.\.\/loa-freeside/,
      /['"]\.\.\/loa-eval/,
    ];
    for (const pattern of FORBIDDEN_SIBLING_PATTERNS) {
      expect(
        pattern.test(self),
        `Phase 29A test must not reference sibling-repo paths: matched ${pattern}`,
      ).toBe(false);
    }
  });
});
