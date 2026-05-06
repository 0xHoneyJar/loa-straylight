// Phase 16 conformance — Hounfour response intake / adaptation delta /
// rc shadow-integration readiness checklist.
//
// Pins:
//   * response intake doc exists.
//   * adaptation delta doc mentions ^8.5.0 and ^8.5.0-rc.1.
//   * adaptation delta doc mentions bare PascalCase $id naming.
//   * adaptation delta doc mentions CapabilityScope harmonization.
//   * adaptation delta doc mentions ForgetRecord 4-variant model.
//   * adaptation delta doc mentions safeCanonicalize, NFC, RFC 8785,
//     and 100 KB cap.
//   * checklist says not to flip imports before rc.1.
//   * checklist says Challenge and EstateTransition stay local until
//     cycle-005.
//   * cross-repo index records Hounfour as accepted-with-adaptation
//     (not only pending).
//   * helper script (if present) does not import from .loa, .claude,
//     loa-hounfour, or sibling repos.
//
// These pins prove the Phase 16 response-intake / readiness packet
// is internally consistent and does not silently introduce cross-
// repo coupling. They are NOT a substitute for any future Hounfour
// integration review; they only validate the in-repo readiness
// prep.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const HANDOFF_DIR = resolve(ROOT, 'docs/handoffs');
const INTAKE_DOC = resolve(HANDOFF_DIR, 'hounfour-response-intake.md');
const DELTA_DOC = resolve(HANDOFF_DIR, 'hounfour-adaptation-delta.md');
const CHECKLIST_DOC = resolve(
  HANDOFF_DIR,
  'hounfour-rc-shadow-integration-checklist.md',
);
const INDEX_DOC = resolve(HANDOFF_DIR, 'cross-repo-handoff-index.md');
const ORDER_DOC = resolve(
  HANDOFF_DIR,
  'cross-repo-implementation-order.md',
);
const HANDOFF_README = resolve(HANDOFF_DIR, 'README.md');
const HELPER_SCRIPT = resolve(
  ROOT,
  'scripts/print-hounfour-rc-readiness.ts',
);

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

/**
 * Collapse markdown blockquote line-wraps and bold markers so a
 * regex can match a phrase that the source split across two lines.
 * Used for "is not Hounfour integration"-style checks where the
 * blockquote inserts "\n> " between words.
 */
function normalize(src: string): string {
  return src.replace(/\n>\s*/g, ' ').replace(/\*+/g, '');
}

describe('phase 16 — Hounfour response intake doc exists and pins disposition', () => {
  it('response intake doc exists', () => {
    expect(existsSync(INTAKE_DOC), `${INTAKE_DOC} should exist`).toBe(
      true,
    );
  });

  it('response intake doc is non-trivial (>1KB)', () => {
    expect(read(INTAKE_DOC).length).toBeGreaterThan(1024);
  });

  it('response intake doc records 9 REUSE / 4 EXTEND / ~21 ADD-NEW / 6 DEFER / 1 FOLD', () => {
    const src = read(INTAKE_DOC);
    expect(/REUSE\s*\|?\s*\|?\s*9\b|9\s+REUSE/.test(src)).toBe(true);
    expect(/EXTEND\s*\|?\s*\|?\s*4\b|4\s+EXTEND/.test(src)).toBe(true);
    expect(/ADD-NEW\s*\|?\s*\|?\s*~?21\b|~?21\s+ADD-NEW/.test(src)).toBe(true);
    expect(/DEFER\s*\|?\s*\|?\s*6\b|6\s+DEFER/.test(src)).toBe(true);
    expect(/FOLD/.test(src)).toBe(true);
    expect(/CandidateAssertion/.test(src)).toBe(true);
  });

  it('response intake doc says accepted-with-adaptation, not direct import', () => {
    const src = read(INTAKE_DOC);
    expect(/accepted-with-adaptation/i.test(src)).toBe(true);
    expect(/not (a )?direct import/i.test(src)).toBe(true);
  });

  it('response intake doc links back to loa-hounfour issue #70', () => {
    const src = read(INTAKE_DOC);
    expect(
      src.includes(
        'https://github.com/0xHoneyJar/loa-hounfour/issues/70',
      ),
    ).toBe(true);
  });

  it('response intake doc declares Phase 16 status / framing', () => {
    const src = read(INTAKE_DOC);
    expect(/Phase 16/.test(src)).toBe(true);
  });
});

describe('phase 16 — Hounfour adaptation delta doc pins required deltas', () => {
  it('adaptation delta doc exists', () => {
    expect(existsSync(DELTA_DOC), `${DELTA_DOC} should exist`).toBe(
      true,
    );
  });

  it('adaptation delta doc is non-trivial (>1KB)', () => {
    expect(read(DELTA_DOC).length).toBeGreaterThan(1024);
  });

  it('adaptation delta doc mentions ^8.5.0 and ^8.5.0-rc.1', () => {
    const src = read(DELTA_DOC);
    expect(src.includes('^8.5.0')).toBe(true);
    expect(src.includes('^8.5.0-rc.1')).toBe(true);
  });

  it('adaptation delta doc says the package version target is not 0.1.x', () => {
    const src = read(DELTA_DOC);
    expect(/0\.1\.x/.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions bare PascalCase $id naming', () => {
    const src = read(DELTA_DOC);
    expect(/bare\s+PascalCase\s+`?\$id`?/i.test(src)).toBe(true);
    expect(/straylight\.<type>\.v0/.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions CapabilityScope harmonization', () => {
    const src = read(DELTA_DOC);
    expect(/CapabilityScope/.test(src)).toBe(true);
    expect(/harmoni[sz]ation|harmoni[sz]e[d]?/i.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions ForgetRecord 4-variant model', () => {
    const src = read(DELTA_DOC);
    expect(/ForgetRecord/.test(src)).toBe(true);
    expect(/4[- ]variant/i.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions safeCanonicalize, NFC, RFC 8785, and 100 KB cap', () => {
    const src = read(DELTA_DOC);
    expect(/safeCanonicalize/.test(src)).toBe(true);
    expect(/\bNFC\b/.test(src)).toBe(true);
    expect(/RFC\s*8785/i.test(src)).toBe(true);
    expect(/100\s*KB/i.test(src)).toBe(true);
    expect(/cap/i.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions Challenge and EstateTransition deferral to cycle-005', () => {
    const src = read(DELTA_DOC);
    expect(/Challenge/.test(src)).toBe(true);
    expect(/EstateTransition/.test(src)).toBe(true);
    expect(/cycle-005/.test(src)).toBe(true);
    expect(/defer/i.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions subpath import discipline', () => {
    const src = read(DELTA_DOC);
    expect(/subpath/i.test(src)).toBe(true);
    expect(/import/i.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions cross-version transitive risk through AgentIdentity', () => {
    const src = read(DELTA_DOC);
    expect(/AgentIdentity/.test(src)).toBe(true);
    expect(/cross[- ]version|transitive/i.test(src)).toBe(true);
  });

  it('adaptation delta doc mentions constraint-ID collapse risk', () => {
    const src = read(DELTA_DOC);
    expect(/constraint[- ]ID/i.test(src)).toBe(true);
    expect(/collapse/i.test(src)).toBe(true);
  });

  it('adaptation delta doc says it is not Hounfour integration', () => {
    const src = normalize(read(DELTA_DOC));
    expect(/\bnot\W*Hounfour\W*integration\b/i.test(src)).toBe(true);
  });
});

describe('phase 16 — rc shadow-integration checklist pins required rules', () => {
  it('checklist doc exists', () => {
    expect(
      existsSync(CHECKLIST_DOC),
      `${CHECKLIST_DOC} should exist`,
    ).toBe(true);
  });

  it('checklist doc is non-trivial (>1KB)', () => {
    expect(read(CHECKLIST_DOC).length).toBeGreaterThan(1024);
  });

  it('checklist says wait for the PR-A2.1 reuse-audit doc', () => {
    const src = read(CHECKLIST_DOC);
    expect(/PR-?A?2\.1/i.test(src)).toBe(true);
    expect(/reuse[- ]audit/i.test(src)).toBe(true);
    expect(/wait/i.test(src)).toBe(true);
  });

  it('checklist says wait for the v8.5.0-rc.1 tag', () => {
    const src = read(CHECKLIST_DOC);
    expect(src.includes('v8.5.0-rc.1')).toBe(true);
    expect(/wait for (the )?v8\.5\.0-rc\.1 tag/i.test(src)).toBe(true);
  });

  it('checklist says do not flip imports before rc.1', () => {
    const src = read(CHECKLIST_DOC);
    // Must say imports do not flip on main / before rc.1, regardless of
    // exact phrasing, but must include rc.1.
    expect(src.includes('rc.1')).toBe(true);
    expect(
      /must\s+not\s+flip[^.]*main|not\s+flip[^.]*main[- ]branch|never\s+on\s+`?main`?/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('checklist pins the test-branch-only constraint on the rc pin', () => {
    const src = read(CHECKLIST_DOC);
    expect(/test branch only|on the test branch/i.test(src)).toBe(
      true,
    );
  });

  it('checklist says Challenge and EstateTransition stay local until cycle-005', () => {
    const src = read(CHECKLIST_DOC);
    expect(/Challenge/.test(src)).toBe(true);
    expect(/EstateTransition/.test(src)).toBe(true);
    expect(/local|stays? local/i.test(src)).toBe(true);
    expect(/cycle-005/.test(src)).toBe(true);
  });

  it('checklist says map Hounfour imports / subpaths', () => {
    const src = read(CHECKLIST_DOC);
    expect(/map Hounfour imports|subpath/i.test(src)).toBe(true);
  });

  it('checklist says alias AgentIdentity as Actor if needed', () => {
    const src = read(CHECKLIST_DOC);
    expect(/Alias\s+`?AgentIdentity`?\s+as\s+`?Actor`?/i.test(src)).toBe(true);
  });

  it('checklist says test schema candidates against Hounfour validators', () => {
    const src = read(CHECKLIST_DOC);
    expect(/schema[- ]candidate/i.test(src)).toBe(true);
    expect(/Hounfour validators/i.test(src)).toBe(true);
  });

  it('checklist says test conformance vectors', () => {
    const src = read(CHECKLIST_DOC);
    expect(/conformance vectors/i.test(src)).toBe(true);
  });

  it('checklist says test canonical hash determinism', () => {
    const src = read(CHECKLIST_DOC);
    expect(/canonical hash determinism/i.test(src)).toBe(true);
  });

  it('checklist says test 100 KB safeCanonicalize cap behavior', () => {
    const src = read(CHECKLIST_DOC);
    expect(/100\s*KB/i.test(src)).toBe(true);
    expect(/safeCanonicalize/.test(src)).toBe(true);
    expect(/cap/i.test(src)).toBe(true);
    expect(/fail[- ]closed|fail closed/i.test(src)).toBe(true);
  });

  it('checklist says file blockers before final tag', () => {
    const src = read(CHECKLIST_DOC);
    expect(/File blockers before/i.test(src)).toBe(true);
    expect(/final tag|stable tag|v8\.5\.0 stable/i.test(src)).toBe(
      true,
    );
  });

  it('checklist says it is not Hounfour integration', () => {
    const src = normalize(read(CHECKLIST_DOC));
    expect(/\bnot\W*Hounfour\W*integration\b/i.test(src)).toBe(true);
  });
});

describe('phase 16 — cross-repo handoff index records accepted-with-adaptation', () => {
  it('cross-repo index records Hounfour as accepted-with-adaptation', () => {
    const src = read(INDEX_DOC);
    expect(/accepted-with-adaptation/i.test(src)).toBe(true);
  });

  it('cross-repo index records Hounfour as pending v8.5.0-rc.1', () => {
    const src = read(INDEX_DOC);
    expect(src.includes('v8.5.0-rc.1')).toBe(true);
    expect(/pending/i.test(src)).toBe(true);
  });

  it('cross-repo index does not treat Hounfour as merely pending (status documented)', () => {
    const src = read(INDEX_DOC);
    // Index must include both the response-status framing and a
    // pointer to the Phase 16 packet, not just the bare issue URL.
    expect(/Response status/i.test(src)).toBe(true);
    expect(/hounfour-response-intake\.md/.test(src)).toBe(true);
    expect(/hounfour-adaptation-delta\.md/.test(src)).toBe(true);
    expect(
      /hounfour-rc-shadow-integration-checklist\.md/.test(src),
    ).toBe(true);
  });

  it('cross-repo index does not claim Hounfour integration is complete', () => {
    const src = read(INDEX_DOC);
    expect(/Hounfour integration is complete/i.test(src)).toBe(false);
    expect(/Hounfour integration complete/i.test(src)).toBe(false);
    expect(
      /(integrates|integrated) with @0xhoneyjar\/loa-hounfour/i.test(
        src,
      ),
    ).toBe(false);
  });
});

describe('phase 16 — implementation order doc reflects rc.1 wait condition', () => {
  it('implementation order doc references v8.5.0-rc.1', () => {
    const src = read(ORDER_DOC);
    expect(src.includes('v8.5.0-rc.1')).toBe(true);
  });

  it('implementation order doc says Straylight should not flip imports until rc.1', () => {
    const src = read(ORDER_DOC);
    expect(/should not flip|must not flip/i.test(src)).toBe(true);
    expect(/rc\.1/.test(src)).toBe(true);
  });

  it('implementation order doc says Hounfour extraction is in cycle-004', () => {
    const src = read(ORDER_DOC);
    expect(/cycle-004/.test(src)).toBe(true);
  });

  it('implementation order doc says downstream lanes still wait for stable contracts or explicit mocks', () => {
    const src = read(ORDER_DOC);
    expect(
      /stable schema contracts or explicit mocks|stable Hounfour line|written-stub/i.test(
        src,
      ),
    ).toBe(true);
  });
});

describe('phase 16 — handoff README references the new docs', () => {
  it('handoff README references the response intake doc', () => {
    const src = read(HANDOFF_README);
    expect(/hounfour-response-intake\.md/.test(src)).toBe(true);
  });

  it('handoff README references the adaptation delta doc', () => {
    const src = read(HANDOFF_README);
    expect(/hounfour-adaptation-delta\.md/.test(src)).toBe(true);
  });

  it('handoff README references the rc shadow-integration checklist doc', () => {
    const src = read(HANDOFF_README);
    expect(/hounfour-rc-shadow-integration-checklist\.md/.test(src)).toBe(
      true,
    );
  });

  it('handoff README declares Phase 16 explicitly', () => {
    const src = read(HANDOFF_README);
    expect(/Phase 16/.test(src)).toBe(true);
  });
});

describe('phase 16 — Phase 16 docs declare no cross-repo runtime imports', () => {
  it.each([INTAKE_DOC, DELTA_DOC, CHECKLIST_DOC])(
    '%s does not declare a runtime import from a sibling-repo package',
    (doc) => {
      const src = read(doc);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@0xhoneyjar\/loa-hounfour/m.test(
          src,
        ),
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/hounfour/m.test(src),
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/finn/m.test(src),
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/dixie/m.test(src),
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/freeside/m.test(src),
      ).toBe(false);
    },
  );

  it.each([INTAKE_DOC, DELTA_DOC, CHECKLIST_DOC])(
    '%s makes clear this is response-intake / readiness only, not Hounfour integration',
    (doc) => {
      const src = read(doc);
      expect(
        /not Hounfour integration|readiness (artifact|checklist|only)|response intake|response-intake/i.test(
          src,
        ),
        `${doc} must say this is readiness / intake only`,
      ).toBe(true);
    },
  );
});

describe('phase 16 — optional helper script has no forbidden imports and no GitHub API calls', () => {
  // The helper script is optional. If it is not present, skip the
  // forbidden-import / no-network checks. If it is present, every
  // pin below must hold.
  const HELPER_PRESENT = existsSync(HELPER_SCRIPT);

  const FORBIDDEN_IMPORT_PATTERNS: { name: string; pattern: RegExp }[] =
    [
      { name: '.loa/', pattern: /from\s+['"][^'"]*\.loa\b/ },
      { name: '.claude/', pattern: /from\s+['"][^'"]*\.claude\b/ },
      {
        name: 'loa-hounfour',
        pattern: /from\s+['"][^'"]*loa-hounfour/,
      },
      { name: 'loa-finn', pattern: /from\s+['"][^'"]*loa-finn/ },
      { name: 'loa-dixie', pattern: /from\s+['"][^'"]*loa-dixie/ },
      {
        name: 'loa-freeside',
        pattern: /from\s+['"][^'"]*loa-freeside/,
      },
      { name: 'loa-eval', pattern: /from\s+['"][^'"]*loa-eval/ },
      {
        name: '@0xhoneyjar/loa-hounfour',
        pattern: /from\s+['"]@0xhoneyjar\/loa-hounfour/,
      },
      {
        name: '@loa/hounfour',
        pattern: /from\s+['"]@loa\/hounfour/,
      },
      { name: '@loa/finn', pattern: /from\s+['"]@loa\/finn/ },
      { name: '@loa/dixie', pattern: /from\s+['"]@loa\/dixie/ },
      {
        name: '@loa/freeside',
        pattern: /from\s+['"]@loa\/freeside/,
      },
      { name: '@loa/eval', pattern: /from\s+['"]@loa\/eval/ },
    ];

  it('helper script (if present) contains no forbidden imports', () => {
    if (!HELPER_PRESENT) return;
    const src = read(HELPER_SCRIPT);
    for (const { name, pattern } of FORBIDDEN_IMPORT_PATTERNS) {
      expect(
        pattern.test(src),
        `helper script imports from forbidden source: ${name}`,
      ).toBe(false);
    }
  });

  it('helper script (if present) imports only from node:* builtins or local repo files', () => {
    if (!HELPER_PRESENT) return;
    const src = read(HELPER_SCRIPT);
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(
      src.matchAll(importPattern),
      (m) => m[1] ?? '',
    );
    expect(
      matches.length,
      'helper script must declare at least one import',
    ).toBeGreaterThan(0);
    for (const spec of matches) {
      const isNodeBuiltin = spec.startsWith('node:');
      const isLocalRelative =
        spec.startsWith('./') || spec.startsWith('../');
      expect(
        isNodeBuiltin || isLocalRelative,
        `helper script imports must be node:* or relative; got: ${spec}`,
      ).toBe(true);
    }
  });

  it('helper script (if present) does not import from sibling-repo package scopes', () => {
    if (!HELPER_PRESENT) return;
    const src = read(HELPER_SCRIPT);
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(
      src.matchAll(importPattern),
      (m) => m[1] ?? '',
    );
    for (const spec of matches) {
      expect(
        /^@0xhoneyjar\//.test(spec),
        `helper imports from @0xhoneyjar/ scope: ${spec}`,
      ).toBe(false);
      expect(
        /^@loa\//.test(spec),
        `helper imports from @loa/ scope: ${spec}`,
      ).toBe(false);
      expect(
        /^loa-/.test(spec),
        `helper imports from loa- prefix: ${spec}`,
      ).toBe(false);
    }
  });

  it('helper script (if present) does not call any GitHub API or make network requests', () => {
    if (!HELPER_PRESENT) return;
    const src = read(HELPER_SCRIPT);
    expect(
      /api\.github\.com/i.test(src),
      'helper must not call api.github.com',
    ).toBe(false);
    expect(/fetch\s*\(/.test(src), 'helper must not call fetch()').toBe(
      false,
    );
    expect(
      /from\s+['"](?:node:)?https?\b/.test(src) ||
        /from\s+['"](?:node:)?http\b/.test(src),
      'helper must not import node:http or node:https',
    ).toBe(false);
    expect(
      /octokit/i.test(src),
      'helper must not import @octokit/*',
    ).toBe(false);
    expect(
      /gh\s+(?:api|issue|pr)\b/i.test(src),
      'helper must not shell out to gh',
    ).toBe(false);
  });

  it('helper script (if present) prints the Hounfour issue URL and the readiness doc paths', () => {
    if (!HELPER_PRESENT) return;
    const src = read(HELPER_SCRIPT);
    expect(
      src.includes(
        'https://github.com/0xHoneyJar/loa-hounfour/issues/70',
      ),
    ).toBe(true);
    expect(
      src.includes('docs/handoffs/hounfour-response-intake.md'),
    ).toBe(true);
    expect(
      src.includes('docs/handoffs/hounfour-adaptation-delta.md'),
    ).toBe(true);
    expect(
      src.includes(
        'docs/handoffs/hounfour-rc-shadow-integration-checklist.md',
      ),
    ).toBe(true);
  });

  it('package.json declares the hounfour:rc-readiness script when the helper script is present', () => {
    if (!HELPER_PRESENT) return;
    const pkg = JSON.parse(read(resolve(ROOT, 'package.json'))) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts?.['hounfour:rc-readiness']).toBeDefined();
    expect(pkg.scripts?.['hounfour:rc-readiness']).toContain(
      'print-hounfour-rc-readiness.ts',
    );
  });
});
