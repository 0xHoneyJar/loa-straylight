// Phase 17B conformance -- Hounfour v8.5.x shadow integration.
//
// These tests pin the Phase 17B working-tree contract:
//
//   * package.json declares the dependency with the user-authorized
//     range (^8.5.0) and the hounfour:shadow-inspect npm script.
//   * The installed Hounfour package resolves inside the 8.5.x
//     line. Tests do not hard-pin 8.5.0 -- any 8.5.<patch> within
//     ^8.5.0 is acceptable.
//   * The 15 net-new v8.5.0 schemas (delta #12) ship in v8.5.x and
//     each schema's $id matches /loa-hounfour/8.5.\d+/.
//   * Challenge and EstateTransition schemas are absent at runtime
//     (deltas #7 / #8); the deferral is honored by the actually-
//     shipped surface, not just by docs.
//   * The Phase 17B alias module
//     (src/straylight/hounfour-alias.ts) imports only from named
//     subpaths (delta #9), aliases AgentIdentity as Actor (delta
//     #10), and does not import or re-export Challenge or
//     EstateTransition (deltas #7 / #8).
//   * Boundary preservation: src/straylight/index.ts does NOT
//     import from @0xhoneyjar/loa-hounfour and does NOT re-export
//     the alias module. Runtime / source integration remains
//     blocked.
//   * The inspector library is pure and does not import from
//     @0xhoneyjar/loa-hounfour at the JS module boundary.
//
// These pins prove Phase 17B is internally consistent against the
// actually-installed Hounfour v8.5.x package and does not silently
// flip the wedge's public surface or breach the Challenge /
// EstateTransition deferral.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  DEFERRED_SCHEMA_PATTERNS,
  HOUNFOUR_PACKAGE_NAME,
  ID_VERSION_REGEX,
  INTENDED_DEPENDENCY_RANGE,
  NET_NEW_V850_SCHEMAS,
  STRAYLIGHT_CANDIDATES,
  inspect,
  summarizeReport,
} from '../scripts/inspect-hounfour-shadow.lib.js';

// Type-only import to exercise the alias module typecheck.
import type {
  Actor,
  CapabilityScope,
} from '../src/straylight/hounfour-alias.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const PACKAGE_JSON = resolve(ROOT, 'package.json');
const ALIAS_MODULE = resolve(ROOT, 'src/straylight/hounfour-alias.ts');
const INDEX_MODULE = resolve(ROOT, 'src/straylight/index.ts');
const INSPECTOR_LIB = resolve(
  ROOT,
  'scripts/inspect-hounfour-shadow.lib.ts',
);
const INSPECTOR_CLI = resolve(
  ROOT,
  'scripts/inspect-hounfour-shadow.ts',
);
const HOUNFOUR_PACKAGE_JSON = resolve(
  ROOT,
  'node_modules/@0xhoneyjar/loa-hounfour/package.json',
);

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

describe('phase 17B -- package.json declares Hounfour dependency and shadow-inspect script', () => {
  it('package.json declares @0xhoneyjar/loa-hounfour as a runtime dependency', () => {
    const pkg = JSON.parse(read(PACKAGE_JSON)) as PackageJson;
    expect(pkg.dependencies, 'dependencies block').toBeDefined();
    expect(pkg.dependencies?.[HOUNFOUR_PACKAGE_NAME]).toBeDefined();
  });

  it('package.json pins the user-authorized range ^8.5.0 (not a tighter rewrite)', () => {
    const pkg = JSON.parse(read(PACKAGE_JSON)) as PackageJson;
    expect(pkg.dependencies?.[HOUNFOUR_PACKAGE_NAME]).toBe(
      INTENDED_DEPENDENCY_RANGE,
    );
  });

  it('package.json declares the hounfour:shadow-inspect npm script', () => {
    const pkg = JSON.parse(read(PACKAGE_JSON)) as PackageJson;
    expect(pkg.scripts?.['hounfour:shadow-inspect']).toBeDefined();
    expect(pkg.scripts?.['hounfour:shadow-inspect']).toContain(
      'inspect-hounfour-shadow.ts',
    );
  });
});

describe('phase 17B -- installed Hounfour package resolves inside the 8.5.x line', () => {
  it('node_modules/@0xhoneyjar/loa-hounfour/package.json exists', () => {
    expect(existsSync(HOUNFOUR_PACKAGE_JSON)).toBe(true);
  });

  it('installed package name is @0xhoneyjar/loa-hounfour', () => {
    const pkg = JSON.parse(read(HOUNFOUR_PACKAGE_JSON)) as {
      name?: string;
    };
    expect(pkg.name).toBe(HOUNFOUR_PACKAGE_NAME);
  });

  it('installed package version matches 8.5.<patch>', () => {
    const pkg = JSON.parse(read(HOUNFOUR_PACKAGE_JSON)) as {
      version?: string;
    };
    expect(pkg.version).toMatch(/^8\.5\.\d+$/);
  });
});

describe('phase 17B -- inspector reports a structurally valid shadow report', () => {
  const report = inspect();

  it('report records the intended dependency range', () => {
    expect(report.intendedDependencyRange).toBe(
      INTENDED_DEPENDENCY_RANGE,
    );
  });

  it('report records the resolved package metadata', () => {
    expect(report.resolvedPackage.exists).toBe(true);
    expect(report.resolvedPackage.name).toBe(HOUNFOUR_PACKAGE_NAME);
    expect(report.resolvedPackage.version).toMatch(/^8\.5\.\d+$/);
  });

  it('report covers every Straylight schema candidate', () => {
    expect(report.candidates.length).toBe(
      STRAYLIGHT_CANDIDATES.length,
    );
    for (const c of report.candidates) {
      expect(c.straylightCandidate).toBeTypeOf('string');
      expect(c.observedDisposition).toBeTypeOf('string');
    }
  });

  it('report covers every net-new v8.5.0 schema (delta #12)', () => {
    expect(report.netNewSchemas.length).toBe(
      NET_NEW_V850_SCHEMAS.length,
    );
  });

  it('report covers every deferred-schema pattern (deltas #7 / #8)', () => {
    expect(report.deferredSchemas.length).toBe(
      DEFERRED_SCHEMA_PATTERNS.length,
    );
  });

  it('report records the safeCanonicalize subpath deferral', () => {
    const joined = report.deferredSurfaceDecisions.join('\n');
    expect(/safeCanonicalize/.test(joined)).toBe(true);
    expect(/deferred/i.test(joined)).toBe(true);
  });

  it('summarizeReport produces a non-empty string', () => {
    const out = summarizeReport(report);
    expect(out.length).toBeGreaterThan(64);
    expect(out.includes('Phase 17B')).toBe(true);
  });
});

describe('phase 17B -- 15 net-new v8.5.0 schemas (delta #12) ship and carry an 8.5.x $id', () => {
  const report = inspect();

  it.each(NET_NEW_V850_SCHEMAS)(
    'net-new schema %s is present in v8.5.x',
    (stem) => {
      const c = report.netNewSchemas.find((s) => s.stem === stem);
      expect(c, `report should include ${stem}`).toBeDefined();
      expect(c?.present, `${stem} must ship`).toBe(true);
    },
  );

  it.each(NET_NEW_V850_SCHEMAS)(
    'net-new schema %s declares a $id under /loa-hounfour/8.5.\\d+/',
    (stem) => {
      const c = report.netNewSchemas.find((s) => s.stem === stem);
      expect(c?.present).toBe(true);
      expect(c?.$id).toBeTypeOf('string');
      expect(ID_VERSION_REGEX.test(c?.$id ?? '')).toBe(true);
      expect(c?.$idMatchesV85x).toBe(true);
    },
  );
});

describe('phase 17B -- Challenge and EstateTransition deferral honored at runtime (deltas #7 / #8)', () => {
  const report = inspect();

  it.each(DEFERRED_SCHEMA_PATTERNS.map((p) => p.toString()))(
    'deferred-pattern %s does not match any shipped schema',
    (patternStr) => {
      const c = report.deferredSchemas.find(
        (d) => d.pattern === patternStr,
      );
      expect(c).toBeDefined();
      expect(c?.matchingFiles).toEqual([]);
      expect(c?.pass).toBe(true);
    },
  );

  it('inspector raises no blocker for deferred schemas', () => {
    const challengeBlockers = report.blockers.filter((b) =>
      /challenge|estate-transition/i.test(b),
    );
    expect(challengeBlockers).toEqual([]);
  });
});

describe('phase 17B -- inspector blockers list is empty (no Hounfour-side blockers from this run)', () => {
  // Phase 17B is not authorized to file blockers; if the inspector
  // surfaces one, the test fails so the user sees it before the
  // findings doc gets updated. Discrepancies short of blockers
  // (e.g. NAME_DRIFT for audit-event) live in `notes` instead.
  it('report.blockers is empty', () => {
    const report = inspect();
    expect(
      report.blockers,
      `unexpected blockers:\n${report.blockers.join('\n')}`,
    ).toEqual([]);
  });
});

describe('phase 17B -- alias module honors subpath import discipline (deltas #3 / #9 / #10)', () => {
  it('alias module exists', () => {
    expect(existsSync(ALIAS_MODULE)).toBe(true);
  });

  const aliasSrc = readFileSync(ALIAS_MODULE, 'utf8');

  it('alias module imports only from named Hounfour subpaths (never the package root)', () => {
    // Match real ESM import statements only -- not `from '...'`
    // strings that may appear inside comments. Anchored to the
    // start of a line, requires the `import` keyword, accepts
    // optional `type` modifier and any specifier shape up to
    // `from`.
    const importPattern =
      /^\s*import\b[^;]*?from\s+['"]([^'"]+)['"]/gm;
    const matches = Array.from(
      aliasSrc.matchAll(importPattern),
      (m) => m[1] ?? '',
    );
    expect(
      matches.length,
      'alias module must declare at least one import',
    ).toBeGreaterThan(0);
    for (const spec of matches) {
      if (spec === '@0xhoneyjar/loa-hounfour') {
        throw new Error(
          `alias module imports the package root '@0xhoneyjar/loa-hounfour' (delta #9 forbids this)`,
        );
      }
      if (spec.startsWith('@0xhoneyjar/loa-hounfour/')) {
        // Confirmed named subpath -- acceptable.
        continue;
      }
      // Other imports must be node:* builtins or relative.
      expect(
        spec.startsWith('node:') ||
          spec.startsWith('./') ||
          spec.startsWith('../'),
        `alias module imports must be node:*, relative, or @0xhoneyjar/loa-hounfour/<subpath>; got: ${spec}`,
      ).toBe(true);
    }
  });

  it('alias module aliases AgentIdentity as Actor (delta #10)', () => {
    expect(/\bAgentIdentity\b/.test(aliasSrc)).toBe(true);
    expect(/export\s+type\s+Actor\s*=/.test(aliasSrc)).toBe(true);
  });

  it('alias module re-exports CapabilityScope (delta #4)', () => {
    expect(/CapabilityScope/.test(aliasSrc)).toBe(true);
  });

  it('alias module does NOT import or re-export Challenge (delta #7)', () => {
    expect(
      /\bChallenge\b/.test(aliasSrc.replace(/Challenge stays local|Challenge\.|\Challenge`/g, '')) ===
        false ||
        /from\s+['"][^'"]*['"][^;]*\bChallenge\b/.test(aliasSrc) ===
          false,
    ).toBe(true);
    // Stronger: there is no `import ... Challenge ... from` line.
    expect(
      /^\s*import[^;]*\bChallenge\b[^;]*from/m.test(aliasSrc),
    ).toBe(false);
    expect(
      /^\s*export[^;]*\bChallenge\b/m.test(aliasSrc),
    ).toBe(false);
  });

  it('alias module does NOT import or re-export EstateTransition (delta #8)', () => {
    expect(
      /^\s*import[^;]*\bEstateTransition\b[^;]*from/m.test(aliasSrc),
    ).toBe(false);
    expect(
      /^\s*export[^;]*\bEstateTransition\b/m.test(aliasSrc),
    ).toBe(false);
  });

  it('alias module does NOT import safeCanonicalize (Phase 17B defers subpath selection)', () => {
    expect(
      /^\s*import[^;]*\bsafeCanonicalize\b/m.test(aliasSrc),
    ).toBe(false);
  });

  it('alias module type imports compile (Actor and CapabilityScope resolve)', () => {
    // Compile-time pin: the imports at the top of this test file
    // would fail typecheck if the alias module's named exports did
    // not resolve. The runtime expression below pins the symbols
    // are referenced (preventing dead-code elision from masking a
    // typecheck regression in CI).
    const _actorTypeIsReferenced: Actor | undefined = undefined;
    const _scopeTypeIsReferenced: CapabilityScope | undefined =
      undefined;
    expect(_actorTypeIsReferenced).toBeUndefined();
    expect(_scopeTypeIsReferenced).toBeUndefined();
  });
});

describe('phase 17B -- boundary preservation: src/straylight/index.ts is unchanged at the Hounfour boundary', () => {
  it('src/straylight/index.ts exists', () => {
    expect(existsSync(INDEX_MODULE)).toBe(true);
  });

  const indexSrc = readFileSync(INDEX_MODULE, 'utf8');

  it('src/straylight/index.ts does NOT import from @0xhoneyjar/loa-hounfour', () => {
    expect(
      /from\s+['"]@0xhoneyjar\/loa-hounfour/.test(indexSrc),
    ).toBe(false);
  });

  it('src/straylight/index.ts does NOT re-export the alias module', () => {
    expect(/hounfour-alias/.test(indexSrc)).toBe(false);
  });

  it('src/straylight/index.ts does NOT mention Hounfour names that would only come from the package', () => {
    // AgentIdentity is a Hounfour name; if it surfaces in the
    // public index, the boundary has leaked. (The wedge's local
    // type is `Actor`, not `AgentIdentity`.)
    expect(/\bAgentIdentity\b/.test(indexSrc)).toBe(false);
  });
});

describe('phase 17B -- inspector files preserve subpath discipline themselves', () => {
  const libSrc = readFileSync(INSPECTOR_LIB, 'utf8');
  const cliSrc = readFileSync(INSPECTOR_CLI, 'utf8');

  it('inspector lib does NOT import from @0xhoneyjar/loa-hounfour at the JS boundary', () => {
    expect(
      /from\s+['"]@0xhoneyjar\/loa-hounfour/.test(libSrc),
    ).toBe(false);
  });

  it('inspector CLI does NOT import from @0xhoneyjar/loa-hounfour at the JS boundary', () => {
    expect(
      /from\s+['"]@0xhoneyjar\/loa-hounfour/.test(cliSrc),
    ).toBe(false);
  });

  it('inspector files do not import from sibling repos or framework internals', () => {
    for (const src of [libSrc, cliSrc]) {
      expect(/from\s+['"][^'"]*loa-finn/.test(src)).toBe(false);
      expect(/from\s+['"][^'"]*loa-dixie/.test(src)).toBe(false);
      expect(/from\s+['"][^'"]*loa-freeside/.test(src)).toBe(false);
      expect(/from\s+['"][^'"]*\.loa\b/.test(src)).toBe(false);
      expect(/from\s+['"][^'"]*\.claude\b/.test(src)).toBe(false);
    }
  });

  it('inspector files do not call any GitHub API or make network requests', () => {
    for (const src of [libSrc, cliSrc]) {
      expect(/api\.github\.com/i.test(src)).toBe(false);
      expect(/fetch\s*\(/.test(src)).toBe(false);
      expect(/from\s+['"](?:node:)?https?\b/.test(src)).toBe(false);
      expect(/octokit/i.test(src)).toBe(false);
    }
  });
});
