// Phase 17B / Phase 18 / Phase 21A conformance -- Hounfour v8.6.x
// shadow integration.
//
// These tests pin the working-tree contract under the Phase 21A
// v8.6 consumer-side intake:
//
//   * package.json declares the dependency with the user-authorized
//     range (^8.6.0) and the hounfour:shadow-inspect npm script.
//   * The installed Hounfour package resolves inside the 8.6.x
//     line. Tests do not hard-pin 8.6.0 -- any 8.6.<patch> within
//     ^8.6.0 is acceptable.
//   * The 15 originally-net-new v8.5.0 schemas (delta #12) remain
//     present in v8.6.x (strict-additive on v8.5.2) and each
//     schema's $id matches /loa-hounfour/8.6.\d+/.
//   * The Challenge schema family ships in v8.6.0 (delta #7
//     resolved at the schema-byte surface). Challenge runtime
//     semantics remain deferred at the Straylight wedge boundary.
//   * EstateTransition remains absent at runtime (delta #8); the
//     deferral is honored by the actually-shipped v8.6.x surface,
//     not just by docs.
//   * The Phase 17B alias module
//     (src/straylight/hounfour-alias.ts) imports only from named
//     subpaths (delta #9), aliases AgentIdentity as Actor (delta
//     #10), and does not import or re-export Challenge or
//     EstateTransition (deltas #7 / #8) -- Challenge stays out of
//     the alias surface even after it ships, because runtime
//     wiring is not in Phase 21A scope.
//   * Boundary preservation: src/straylight/index.ts does NOT
//     import from @0xhoneyjar/loa-hounfour and does NOT re-export
//     the alias module. Runtime / source integration remains
//     blocked.
//   * The inspector library is pure and does not import from
//     @0xhoneyjar/loa-hounfour at the JS module boundary.
//
// These pins prove the wedge stays internally consistent against
// the actually-installed Hounfour v8.6.x package and does not
// silently flip the wedge's public surface or breach the
// EstateTransition deferral.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  DEFERRED_SCHEMA_PATTERNS,
  DISPOSITION_TABLE,
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

  it('package.json pins the user-authorized range ^8.6.0 (not a tighter rewrite)', () => {
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

describe('phase 17B -- installed Hounfour package resolves inside the 8.6.x line', () => {
  it('node_modules/@0xhoneyjar/loa-hounfour/package.json exists', () => {
    expect(existsSync(HOUNFOUR_PACKAGE_JSON)).toBe(true);
  });

  it('installed package name is @0xhoneyjar/loa-hounfour', () => {
    const pkg = JSON.parse(read(HOUNFOUR_PACKAGE_JSON)) as {
      name?: string;
    };
    expect(pkg.name).toBe(HOUNFOUR_PACKAGE_NAME);
  });

  it('installed package version matches 8.6.<patch>', () => {
    const pkg = JSON.parse(read(HOUNFOUR_PACKAGE_JSON)) as {
      version?: string;
    };
    expect(pkg.version).toMatch(/^8\.6\.\d+$/);
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
    expect(report.resolvedPackage.version).toMatch(/^8\.6\.\d+$/);
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

  it('report covers every originally-net-new v8.5.0 schema (delta #12; still required in v8.6.x)', () => {
    expect(report.netNewSchemas.length).toBe(
      NET_NEW_V850_SCHEMAS.length,
    );
  });

  it('report covers every deferred-schema pattern (delta #8 only under v8.6.x)', () => {
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

describe('phase 21A -- 15 originally-net-new v8.5.0 schemas (delta #12) remain present in v8.6.x and carry an 8.6.x $id', () => {
  const report = inspect();

  it.each(NET_NEW_V850_SCHEMAS)(
    'originally-net-new schema %s is present in v8.6.x',
    (stem) => {
      const c = report.netNewSchemas.find((s) => s.stem === stem);
      expect(c, `report should include ${stem}`).toBeDefined();
      expect(c?.present, `${stem} must ship`).toBe(true);
    },
  );

  it.each(NET_NEW_V850_SCHEMAS)(
    'originally-net-new schema %s declares a $id under /loa-hounfour/8.6.\\d+/',
    (stem) => {
      const c = report.netNewSchemas.find((s) => s.stem === stem);
      expect(c?.present).toBe(true);
      expect(c?.$id).toBeTypeOf('string');
      expect(ID_VERSION_REGEX.test(c?.$id ?? '')).toBe(true);
      expect(c?.$idMatchesV85x).toBe(true);
    },
  );
});

describe('phase 21A -- EstateTransition deferral honored at runtime (delta #8); Challenge no longer in DEFERRED_SCHEMA_PATTERNS because it ships in v8.6.0 (delta #7 resolved)', () => {
  const report = inspect();

  it('DEFERRED_SCHEMA_PATTERNS contains exactly one pattern (estate-transition only)', () => {
    expect(DEFERRED_SCHEMA_PATTERNS.length).toBe(1);
    expect(DEFERRED_SCHEMA_PATTERNS[0]?.toString()).toMatch(/estate-transition/i);
  });

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
    const deferralBlockers = report.blockers.filter((b) =>
      /challenge|estate-transition/i.test(b),
    );
    expect(deferralBlockers).toEqual([]);
  });
});

describe('phase 21A -- inspector blockers list is empty under v8.6.x intake (no Hounfour-side blockers from this run)', () => {
  // Phase 21A is not authorized to file blockers; if the inspector
  // surfaces one, the test fails so the user sees it before the
  // findings doc gets updated. Discrepancies short of blockers
  // (e.g. DISCOVERY_NOTE for audit-event) live in `notes` instead.
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

// ----------------------------------------------------------------
// Phase 18 -- boundary-hardening pins.
//
// Phase 18 hardens the v8.6.x boundary by:
//
//   * formally classifying audit-event-transition.json as
//     DISCOVERY_NOTE (never MISSING, never blocker),
//   * recording safeCanonicalize as a structured deferredSubpaths
//     entry with gate `no-confirmed-subpath`,
//   * recording Challenge / EstateTransition as structured
//     cycleFiveDeferrals entries (mirroring the existing schema
//     absence checks),
//   * exporting a static DISPOSITION_TABLE that pins the six
//     classifier dispositions.
//
// These pins are additive; the Phase 17B describe blocks above
// continue to enforce the original contract.

describe('phase 18 -- DISPOSITION_TABLE pins the six classifier dispositions', () => {
  it('exports the table with six entries', () => {
    expect(DISPOSITION_TABLE.length).toBe(6);
  });

  it('covers MATCH, EXTEND, FOLD, MISSING, DEFERRED, DISCOVERY_NOTE in any order', () => {
    const seen = new Set(DISPOSITION_TABLE.map((d) => d.disposition));
    for (const expected of [
      'MATCH',
      'EXTEND',
      'FOLD',
      'MISSING',
      'DEFERRED',
      'DISCOVERY_NOTE',
    ] as const) {
      expect(seen.has(expected), `missing disposition: ${expected}`).toBe(
        true,
      );
    }
  });

  it('does not retain the dead Phase 17B value NAME_DRIFT', () => {
    const seen = new Set(DISPOSITION_TABLE.map((d) => d.disposition));
    expect(
      (seen as Set<string>).has('NAME_DRIFT'),
      'NAME_DRIFT was renamed to DISCOVERY_NOTE in Phase 18',
    ).toBe(false);
  });

  it('declares every entry as non-blocker (Phase 18 informational classifier surface)', () => {
    for (const entry of DISPOSITION_TABLE) {
      expect(
        entry.isBlocker,
        `${entry.disposition} must not be marked as a blocker on the classifier surface`,
      ).toBe(false);
    }
  });

  it('every entry carries a non-empty description', () => {
    for (const entry of DISPOSITION_TABLE) {
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(16);
    }
  });
});

describe('phase 18 -- audit-event-transition is classified as DISCOVERY_NOTE (not MISSING, not blocker)', () => {
  const report = inspect();

  const auditMapping = STRAYLIGHT_CANDIDATES.find(
    (c) => c.straylightCandidate === 'audit-event-transition.json',
  );
  const auditResult = report.candidates.find(
    (c) => c.straylightCandidate === 'audit-event-transition.json',
  );

  it('the row exists in STRAYLIGHT_CANDIDATES', () => {
    expect(auditMapping).toBeDefined();
  });

  it('the row is flagged with discoveryNote: true (Phase 18 classifier opt-in)', () => {
    expect(auditMapping?.discoveryNote).toBe(true);
  });

  it('the row has expected stem `audit-event` (Phase 16 disposition preserved)', () => {
    expect(auditMapping?.expectedHounfourSchema).toBe('audit-event');
  });

  it('the inspector observed disposition is DISCOVERY_NOTE', () => {
    expect(auditResult).toBeDefined();
    expect(auditResult?.observedDisposition).toBe('DISCOVERY_NOTE');
  });

  it('the inspector observed disposition is NOT MISSING (Phase 18 reclassification)', () => {
    expect(auditResult?.observedDisposition).not.toBe('MISSING');
  });

  it('audit-event-transition does not appear in report.blockers', () => {
    const auditBlockers = report.blockers.filter((b) =>
      /audit-event/i.test(b),
    );
    expect(auditBlockers).toEqual([]);
  });

  it('audit-event-transition surfaces in report.notes as a DISCOVERY_NOTE entry', () => {
    const discoveryNotes = report.notes.filter(
      (n) =>
        /audit-event-transition/i.test(n) && /DISCOVERY_NOTE/.test(n),
    );
    expect(discoveryNotes.length).toBeGreaterThan(0);
  });

  it('summarizeReport prints DISCOVERY_NOTE for the audit-event row', () => {
    const out = summarizeReport(report);
    expect(/\[DISCOVERY_NOTE\s*\]\s+audit-event-transition/.test(out)).toBe(
      true,
    );
  });
});

describe('phase 18 -- safeCanonicalize subpath stays deferred with gate `no-confirmed-subpath`', () => {
  const report = inspect();

  it('report.deferredSubpaths contains a safeCanonicalize entry', () => {
    const entry = report.deferredSubpaths.find(
      (d) => d.symbol === 'safeCanonicalize',
    );
    expect(entry, 'safeCanonicalize entry expected').toBeDefined();
  });

  it('the safeCanonicalize entry uses gate `no-confirmed-subpath`', () => {
    const entry = report.deferredSubpaths.find(
      (d) => d.symbol === 'safeCanonicalize',
    );
    expect(entry?.gate).toBe('no-confirmed-subpath');
  });

  it('the safeCanonicalize entry records the canonicalize / utilities subpaths as not-exported', () => {
    const entry = report.deferredSubpaths.find(
      (d) => d.symbol === 'safeCanonicalize',
    );
    expect(entry?.notExportedSubpaths).toContain(
      '@0xhoneyjar/loa-hounfour/canonicalize',
    );
    expect(entry?.notExportedSubpaths).toContain(
      '@0xhoneyjar/loa-hounfour/utilities',
    );
  });

  it('installed Hounfour package.json exports map ships no ./canonicalize or ./utilities subpath', () => {
    const pkg = JSON.parse(read(HOUNFOUR_PACKAGE_JSON)) as {
      exports?: Record<string, unknown>;
    };
    const exportsMap = pkg.exports ?? {};
    expect(
      Object.prototype.hasOwnProperty.call(exportsMap, './canonicalize'),
    ).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(exportsMap, './utilities'),
    ).toBe(false);
  });

  it('alias module does NOT import safeCanonicalize from any subpath', () => {
    const aliasSrc = readFileSync(ALIAS_MODULE, 'utf8');
    expect(
      /^\s*import[^;]*\bsafeCanonicalize\b/m.test(aliasSrc),
    ).toBe(false);
  });

  it('deferredSurfaceDecisions free-text mirrors the structured deferredSubpaths entry', () => {
    const joined = report.deferredSurfaceDecisions.join('\n');
    expect(/safeCanonicalize/.test(joined)).toBe(true);
    expect(/no-confirmed-subpath/.test(joined)).toBe(true);
  });
});

describe('phase 21A -- Challenge ships in Hounfour v8.6.0 (delta #7 resolved); EstateTransition remains deferred (delta #8)', () => {
  const report = inspect();

  it('report.cycleFiveDeferrals contains exactly two entries: Challenge and EstateTransition', () => {
    expect(report.cycleFiveDeferrals.length).toBe(2);
    const names = report.cycleFiveDeferrals.map((e) => e.name).sort();
    expect(names).toEqual(['Challenge', 'EstateTransition']);
  });

  it.each(['Challenge', 'EstateTransition'] as const)(
    '%s entry records its cycle-005 / v8.6.0 queue target',
    (name) => {
      const entry = report.cycleFiveDeferrals.find(
        (e) => e.name === name,
      );
      expect(entry?.deferredUntil).toBe('8.6.0');
    },
  );

  it('Challenge has shipped in v8.6.x (shipsInV85x: true)', () => {
    const entry = report.cycleFiveDeferrals.find(
      (e) => e.name === 'Challenge',
    );
    expect(entry?.shipsInV85x).toBe(true);
  });

  it('EstateTransition has not shipped in v8.6.x (shipsInV85x: false)', () => {
    const entry = report.cycleFiveDeferrals.find(
      (e) => e.name === 'EstateTransition',
    );
    expect(entry?.shipsInV85x).toBe(false);
  });

  it('the alias module imports neither Challenge nor EstateTransition from any subpath (Phase 21A keeps runtime wiring deferred even though Challenge schemas ship)', () => {
    const aliasSrc = readFileSync(ALIAS_MODULE, 'utf8');
    expect(
      /^\s*import[^;]*\bChallenge\b[^;]*from/m.test(aliasSrc),
    ).toBe(false);
    expect(
      /^\s*import[^;]*\bEstateTransition\b[^;]*from/m.test(aliasSrc),
    ).toBe(false);
  });

  it('neither Challenge nor EstateTransition surfaces a blocker (Challenge ships but is not in DEFERRED_SCHEMA_PATTERNS; EstateTransition is in DEFERRED_SCHEMA_PATTERNS but does not ship)', () => {
    const cycleFiveBlockers = report.blockers.filter((b) =>
      /challenge|estate-transition/i.test(b),
    );
    expect(cycleFiveBlockers).toEqual([]);
  });

  it('the structured cycleFiveDeferrals view stays in sync with the schema directory for EstateTransition', () => {
    // EstateTransition is the surviving member of
    // DEFERRED_SCHEMA_PATTERNS, so its shipsInV85x flag must agree
    // with the deferredSchemas absence sweep.
    const estateShips =
      report.cycleFiveDeferrals.find((e) => e.name === 'EstateTransition')
        ?.shipsInV85x ?? true;

    const estateSchemaPasses = report.deferredSchemas.find((d) =>
      /estate-transition/i.test(d.pattern),
    )?.pass;

    // schema-pass: TRUE when no matching schema files (deferral
    // honored). cycleFive-shipsInV85x: TRUE when the schema ships.
    // They must be opposites.
    expect(estateShips).toBe(!estateSchemaPasses);
  });
});

describe('phase 18 -- alias module is unchanged at the boundary (Challenge / EstateTransition / safeCanonicalize all out)', () => {
  const aliasSrc = readFileSync(ALIAS_MODULE, 'utf8');

  it.each(['Challenge', 'EstateTransition', 'safeCanonicalize'] as const)(
    'alias module does not import %s from any module',
    (symbol) => {
      const pattern = new RegExp(
        `^\\s*import[^;]*\\b${symbol}\\b[^;]*from`,
        'm',
      );
      expect(pattern.test(aliasSrc)).toBe(false);
    },
  );

  it.each(['Challenge', 'EstateTransition', 'safeCanonicalize'] as const)(
    'alias module does not export %s',
    (symbol) => {
      const pattern = new RegExp(
        `^\\s*export[^;]*\\b${symbol}\\b`,
        'm',
      );
      expect(pattern.test(aliasSrc)).toBe(false);
    },
  );
});

describe('phase 18 -- inspector report shape carries the new structured fields without breaking existing surface', () => {
  const report = inspect();

  it('deferredSubpaths is an array', () => {
    expect(Array.isArray(report.deferredSubpaths)).toBe(true);
  });

  it('cycleFiveDeferrals is an array', () => {
    expect(Array.isArray(report.cycleFiveDeferrals)).toBe(true);
  });

  it('every candidate observedDisposition value is a member of the DISPOSITION_TABLE keys', () => {
    const allowed = new Set(DISPOSITION_TABLE.map((d) => d.disposition));
    for (const c of report.candidates) {
      expect(
        allowed.has(c.observedDisposition),
        `unexpected disposition: ${c.observedDisposition}`,
      ).toBe(true);
    }
  });

  it('at least one candidate is observed as DISCOVERY_NOTE (audit-event-transition)', () => {
    const discoveryRows = report.candidates.filter(
      (c) => c.observedDisposition === 'DISCOVERY_NOTE',
    );
    expect(discoveryRows.length).toBeGreaterThanOrEqual(1);
  });

  it('blockers list remains empty under Phase 21A v8.6.x intake', () => {
    expect(
      report.blockers,
      `unexpected blockers:\n${report.blockers.join('\n')}`,
    ).toEqual([]);
  });
});
