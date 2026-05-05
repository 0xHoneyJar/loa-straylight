// Phase 15 conformance — cross-repo handoff index, implementation
// order, and no-go sequence.
//
// Pins:
//   * cross-repo handoff index exists
//   * all four filed sibling-repo issue URLs are present in the index
//   * implementation order lists Hounfour BEFORE Finn BEFORE Dixie
//     BEFORE Freeside
//   * no-go sequence says sibling implementation PRs require teammate
//     review before merge
//   * docs/handoffs/README.md references the new cross-repo docs
//   * the optional helper script (if present) does not import from
//     .loa, .claude, or any sibling repo
//
// These pins prove the Phase 15 coordination artifact is internally
// consistent and does not silently introduce cross-repo coupling.
// They are NOT a substitute for any future sibling-repo PR review;
// they only validate the in-repo coordination prep.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const HANDOFF_DIR = resolve(ROOT, 'docs/handoffs');
const INDEX_DOC = resolve(HANDOFF_DIR, 'cross-repo-handoff-index.md');
const ORDER_DOC = resolve(HANDOFF_DIR, 'cross-repo-implementation-order.md');
const NO_GO_DOC = resolve(HANDOFF_DIR, 'cross-repo-no-go-sequence.md');
const HANDOFF_README = resolve(HANDOFF_DIR, 'README.md');
const HELPER_SCRIPT = resolve(ROOT, 'scripts/print-cross-repo-handoff-index.ts');

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

const ISSUE_URLS = [
  'https://github.com/0xHoneyJar/loa-hounfour/issues/70',
  'https://github.com/0xHoneyJar/loa-finn/issues/159',
  'https://github.com/0xHoneyJar/loa-dixie/issues/92',
  'https://github.com/0xHoneyJar/loa-freeside/issues/203',
] as const;

const SIBLING_HANDOFF_DOCS = [
  'hounfour-schema-extraction-issue.md',
  'hounfour-schema-extraction-pr-checklist.md',
  'hounfour-extraction-mapping.md',
  'finn-runtime-enforcement-issue.md',
  'finn-runtime-boundary.md',
  'finn-enforcement-mapping.md',
  'dixie-governed-recall-issue.md',
  'dixie-governed-recall-boundary.md',
  'dixie-recall-mapping.md',
  'freeside-community-surface-issue.md',
  'freeside-community-surface-boundary.md',
  'freeside-surface-mapping.md',
] as const;

const SIBLING_FIXTURE_DIRS = [
  'fixtures/hounfour-conformance',
  'fixtures/schema-candidates',
  'fixtures/finn-runtime-enforcement',
  'fixtures/dixie-governed-recall',
  'fixtures/freeside-community-surface',
] as const;

describe('phase 15 — cross-repo handoff index exists', () => {
  it('cross-repo handoff index document exists', () => {
    expect(existsSync(INDEX_DOC), `${INDEX_DOC} should exist`).toBe(true);
  });

  it('cross-repo handoff index document is non-trivial (>1KB)', () => {
    expect(read(INDEX_DOC).length).toBeGreaterThan(1024);
  });

  it('cross-repo handoff index references each filed sibling-repo issue URL', () => {
    const src = read(INDEX_DOC);
    for (const url of ISSUE_URLS) {
      expect(src.includes(url), `index should reference ${url}`).toBe(true);
    }
  });

  it('cross-repo handoff index links to every per-packet handoff doc', () => {
    const src = read(INDEX_DOC);
    for (const docName of SIBLING_HANDOFF_DOCS) {
      expect(
        src.includes(docName),
        `index should reference handoff doc ${docName}`,
      ).toBe(true);
    }
  });

  it('cross-repo handoff index links to every per-packet fixture directory', () => {
    const src = read(INDEX_DOC);
    for (const dir of SIBLING_FIXTURE_DIRS) {
      expect(
        src.includes(dir),
        `index should reference fixture directory ${dir}`,
      ).toBe(true);
    }
  });

  it('cross-repo handoff index states sibling-repo PRs require teammate review before merge', () => {
    const src = read(INDEX_DOC);
    expect(
      /sibling[- ]repo PRs require teammate review before merge/i.test(src),
      'index must clearly state sibling-repo PRs require teammate review before merge',
    ).toBe(true);
  });

  it('cross-repo handoff index does not claim cross-repo integration is complete', () => {
    const src = read(INDEX_DOC);
    expect(/integration complete/i.test(src)).toBe(false);
    expect(/(integrates|integrated) with @loa\/(hounfour|finn|dixie|freeside)/i.test(src)).toBe(
      false,
    );
  });
});

describe('phase 15 — cross-repo implementation order doc exists and orders correctly', () => {
  it('implementation order doc exists', () => {
    expect(existsSync(ORDER_DOC), `${ORDER_DOC} should exist`).toBe(true);
  });

  it('implementation order doc is non-trivial (>1KB)', () => {
    expect(read(ORDER_DOC).length).toBeGreaterThan(1024);
  });

  it('implementation order doc lists Hounfour before Finn before Dixie before Freeside', () => {
    const src = read(ORDER_DOC);
    const idxHounfour = src.indexOf('Hounfour');
    const idxFinn = src.indexOf('Finn');
    const idxDixie = src.indexOf('Dixie');
    const idxFreeside = src.indexOf('Freeside');
    expect(idxHounfour, 'Hounfour must appear in implementation order').toBeGreaterThanOrEqual(0);
    expect(idxFinn, 'Finn must appear in implementation order').toBeGreaterThanOrEqual(0);
    expect(idxDixie, 'Dixie must appear in implementation order').toBeGreaterThanOrEqual(0);
    expect(idxFreeside, 'Freeside must appear in implementation order').toBeGreaterThanOrEqual(0);
    expect(idxHounfour).toBeLessThan(idxFinn);
    expect(idxFinn).toBeLessThan(idxDixie);
    expect(idxDixie).toBeLessThan(idxFreeside);
  });

  it('implementation order doc explains why Freeside should not go first', () => {
    const src = read(ORDER_DOC);
    expect(
      /Freeside (must|MUST) go last|why Freeside.*not go first|Freeside (is|goes) last|If Freeside goes first/i.test(
        src,
      ),
      'order doc must explain why Freeside cannot go first',
    ).toBe(true);
  });

  it('implementation order doc references parallel-safe and parallel-unsafe work', () => {
    const src = read(ORDER_DOC);
    expect(/parallel/i.test(src), 'order doc must discuss parallelism').toBe(true);
  });

  it('implementation order doc references the cross-repo handoff index and no-go sequence', () => {
    const src = read(ORDER_DOC);
    expect(/cross-repo-handoff-index\.md/.test(src)).toBe(true);
    expect(/cross-repo-no-go-sequence\.md/.test(src)).toBe(true);
  });
});

describe('phase 15 — cross-repo no-go sequence doc exists and pins required rules', () => {
  it('no-go sequence doc exists', () => {
    expect(existsSync(NO_GO_DOC), `${NO_GO_DOC} should exist`).toBe(true);
  });

  it('no-go sequence doc is non-trivial (>1KB)', () => {
    expect(read(NO_GO_DOC).length).toBeGreaterThan(1024);
  });

  it('no-go sequence says sibling implementation PRs require teammate review before merge', () => {
    const src = read(NO_GO_DOC);
    expect(
      /sibling[- ]repo PRs require teammate review before merge/i.test(src) ||
        /Do not merge sibling implementation PRs without teammate review/i.test(src),
      'no-go sequence must require teammate review before merge of sibling implementation PRs',
    ).toBe(true);
  });

  it('no-go sequence forbids wiring Finn before Hounfour schema contracts are reviewed or stubbed', () => {
    const src = read(NO_GO_DOC);
    expect(
      /Do not wire Finn before Hounfour schema contracts are reviewed or explicitly stubbed/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('no-go sequence forbids exposing Dixie BFF recall as generic retrieval', () => {
    const src = read(NO_GO_DOC);
    expect(/Do not expose Dixie BFF recall as generic retrieval/i.test(src)).toBe(true);
  });

  it('no-go sequence forbids exposing Freeside community / bot surfaces before Dixie / Finn settle or are mocked', () => {
    const src = read(NO_GO_DOC);
    expect(
      /Do not expose Freeside (bot \/ community|community \/ bot|bot|community) surfaces before Dixie \/ Finn boundaries are settled or explicitly mocked/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('no-go sequence forbids sibling repos redefining Straylight primitive semantics independently', () => {
    const src = read(NO_GO_DOC);
    expect(
      /Do not let any sibling repo redefine Straylight primitive semantics independently/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('no-go sequence forbids treating local Straylight fixtures as canonical production contracts until extracted/reviewed', () => {
    const src = read(NO_GO_DOC);
    expect(
      /Do not treat local Straylight fixtures as canonical production contracts until extracted\/reviewed/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('no-go sequence references the cross-repo handoff index and implementation order', () => {
    const src = read(NO_GO_DOC);
    expect(/cross-repo-handoff-index\.md/.test(src)).toBe(true);
    expect(/cross-repo-implementation-order\.md/.test(src)).toBe(true);
  });
});

describe('phase 15 — docs/handoffs/README.md references the new docs', () => {
  it('handoff index README references the cross-repo handoff index', () => {
    const src = read(HANDOFF_README);
    expect(/cross-repo-handoff-index\.md/.test(src)).toBe(true);
  });

  it('handoff index README references the cross-repo implementation order', () => {
    const src = read(HANDOFF_README);
    expect(/cross-repo-implementation-order\.md/.test(src)).toBe(true);
  });

  it('handoff index README references the cross-repo no-go sequence', () => {
    const src = read(HANDOFF_README);
    expect(/cross-repo-no-go-sequence\.md/.test(src)).toBe(true);
  });

  it('handoff index README still lists the four per-packet handoffs (Hounfour, Finn, Dixie, Freeside)', () => {
    const src = read(HANDOFF_README);
    expect(/Hounfour schema extraction/i.test(src)).toBe(true);
    expect(/Finn runtime enforcement/i.test(src)).toBe(true);
    expect(/Dixie governed recall/i.test(src)).toBe(true);
    expect(/Freeside community/i.test(src)).toBe(true);
  });
});

describe('phase 15 — coordination docs declare no cross-repo runtime imports', () => {
  it.each([INDEX_DOC, ORDER_DOC, NO_GO_DOC])(
    '%s does not declare a runtime import from a sibling-repo package',
    (doc) => {
      const src = read(doc);
      expect(/^\s*import\s+[^;]*from\s+['"]@loa\/hounfour/m.test(src)).toBe(false);
      expect(/^\s*import\s+[^;]*from\s+['"]@loa\/finn/m.test(src)).toBe(false);
      expect(/^\s*import\s+[^;]*from\s+['"]@loa\/dixie/m.test(src)).toBe(false);
      expect(/^\s*import\s+[^;]*from\s+['"]@loa\/freeside/m.test(src)).toBe(false);
    },
  );

  it.each([INDEX_DOC, ORDER_DOC, NO_GO_DOC])(
    '%s makes clear this is coordination/index only, not cross-repo implementation',
    (doc) => {
      const src = read(doc);
      expect(
        /coordination artifact|coordination only|not cross-repo implementation|in-repo (only|index)/i.test(
          src,
        ),
        `${doc} must say this is coordination/index only`,
      ).toBe(true);
    },
  );
});

describe('phase 15 — optional helper script has no forbidden imports and no GitHub API calls', () => {
  // The helper script is optional. If it is not present, skip the
  // forbidden-import / no-network checks. If it is present, every
  // pin below must hold.
  const HELPER_PRESENT = existsSync(HELPER_SCRIPT);

  const FORBIDDEN_IMPORT_PATTERNS: { name: string; pattern: RegExp }[] = [
    { name: '.loa/', pattern: /from\s+['"][^'"]*\.loa\b/ },
    { name: '.claude/', pattern: /from\s+['"][^'"]*\.claude\b/ },
    { name: 'loa-hounfour', pattern: /from\s+['"][^'"]*loa-hounfour/ },
    { name: 'loa-finn', pattern: /from\s+['"][^'"]*loa-finn/ },
    { name: 'loa-dixie', pattern: /from\s+['"][^'"]*loa-dixie/ },
    { name: 'loa-freeside', pattern: /from\s+['"][^'"]*loa-freeside/ },
    { name: 'loa-eval', pattern: /from\s+['"][^'"]*loa-eval/ },
    { name: '@loa/hounfour', pattern: /from\s+['"]@loa\/hounfour/ },
    { name: '@loa/finn', pattern: /from\s+['"]@loa\/finn/ },
    { name: '@loa/dixie', pattern: /from\s+['"]@loa\/dixie/ },
    { name: '@loa/freeside', pattern: /from\s+['"]@loa\/freeside/ },
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
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1] ?? '');
    expect(
      matches.length,
      'helper script must declare at least one import',
    ).toBeGreaterThan(0);
    for (const spec of matches) {
      const isNodeBuiltin = spec.startsWith('node:');
      const isLocalRelative = spec.startsWith('./') || spec.startsWith('../');
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
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1] ?? '');
    for (const spec of matches) {
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
    expect(/api\.github\.com/i.test(src), 'helper must not call api.github.com').toBe(false);
    expect(/fetch\s*\(/.test(src), 'helper must not call fetch()').toBe(false);
    expect(
      /from\s+['"](?:node:)?https?\b/.test(src) || /from\s+['"](?:node:)?http\b/.test(src),
      'helper must not import node:http or node:https',
    ).toBe(false);
    expect(/octokit/i.test(src), 'helper must not import @octokit/*').toBe(false);
    expect(/gh\s+(?:api|issue|pr)\b/i.test(src), 'helper must not shell out to gh').toBe(false);
  });

  it('helper script (if present) prints all four sibling-repo issue URLs as data', () => {
    if (!HELPER_PRESENT) return;
    const src = read(HELPER_SCRIPT);
    for (const url of ISSUE_URLS) {
      expect(src.includes(url), `helper must include ${url}`).toBe(true);
    }
  });

  it('package.json declares the handoffs:index script when the helper script is present', () => {
    if (!HELPER_PRESENT) return;
    const pkg = JSON.parse(read(resolve(ROOT, 'package.json'))) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts?.['handoffs:index']).toBeDefined();
    expect(pkg.scripts?.['handoffs:index']).toContain(
      'print-cross-repo-handoff-index.ts',
    );
  });
});

describe('phase 15 — coordination docs reference each other and prior packets', () => {
  it('cross-repo handoff index references the implementation order doc', () => {
    const src = read(INDEX_DOC);
    expect(/cross-repo-implementation-order\.md/.test(src)).toBe(true);
  });

  it('cross-repo handoff index references the no-go sequence doc', () => {
    const src = read(INDEX_DOC);
    expect(/cross-repo-no-go-sequence\.md/.test(src)).toBe(true);
  });

  it('cross-repo handoff index references the handoffs README', () => {
    const src = read(INDEX_DOC);
    expect(/docs\/handoffs\/README\.md|\.\/README\.md/.test(src)).toBe(true);
  });
});
