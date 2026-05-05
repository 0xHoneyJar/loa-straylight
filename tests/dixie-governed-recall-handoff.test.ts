// Phase 12 conformance — Dixie governed-recall / BFF handoff packet.
//
// Pins:
//   * the three Dixie handoff documents under docs/handoffs/ exist
//   * the recall-mapping table references all required recall / BFF
//     surfaces
//   * the issue handoff includes an explicit non-goals section
//   * the boundary doc says Dixie must not treat generic retrieval as
//     governed recall
//   * the boundary doc says Dixie must not bypass recall receipts
//   * the boundary doc says Dixie must not expose private estate
//     material in public contexts
//   * every Dixie fixture is parseable JSON
//   * every Dixie fixture contains case_name, expected_allowed,
//     reason, input, expected_output
//   * the helper script does not import from .loa, .claude, loa-dixie,
//     or any sibling repo
//
// These pins prove the handoff packet is internally consistent and
// does not silently introduce cross-repo coupling. They are NOT a
// substitute for any future loa-dixie BFF / inspection test pack;
// they only validate the in-repo handoff prep.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const HANDOFF_DIR = resolve(ROOT, 'docs/handoffs');
const ISSUE_DOC = resolve(HANDOFF_DIR, 'dixie-governed-recall-issue.md');
const BOUNDARY_DOC = resolve(HANDOFF_DIR, 'dixie-governed-recall-boundary.md');
const MAPPING_DOC = resolve(HANDOFF_DIR, 'dixie-recall-mapping.md');
const HELPER_SCRIPT = resolve(ROOT, 'scripts/export-dixie-governed-recall-fixtures.ts');
const FIXTURE_DIR = resolve(ROOT, 'fixtures/dixie-governed-recall');

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

const REQUIRED_RECALL_SURFACES = [
  'recall_request',
  'recall_pack_generation',
  'recall_receipt',
  'excluded_assertion_reason_display',
  'provenance_inspection',
  'audit_chain_lookup',
  'actor_estate_summary',
  'assertion_status_inspection',
  'challenge_revocation_awareness',
  'forgotten_from_recall_handling',
  'public_private_environment_frame_handling',
  'high_risk_recall_handling',
  'cross_tenant_recall_prevention',
] as const;

const REQUIRED_FIXTURES = [
  'recall-request-public-discord.json',
  'recall-response-with-receipt.json',
  'denied-private-assertion-public-context.json',
  'denied-cross-tenant-recall.json',
  'revoked-assertion-excluded.json',
  'forgotten-assertion-excluded-but-auditable.json',
  'contested-assertion-marked.json',
  'provenance-inspection-response.json',
  'audit-chain-lookup-response.json',
  'estate-summary-response.json',
] as const;

describe('dixie handoff — handoff documents exist', () => {
  it('docs/handoffs/ directory exists', () => {
    expect(existsSync(HANDOFF_DIR)).toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['boundary doc', BOUNDARY_DOC],
    ['recall mapping', MAPPING_DOC],
  ])('%s document exists', (_label, path) => {
    expect(existsSync(path), `${path} should exist`).toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['boundary doc', BOUNDARY_DOC],
    ['recall mapping', MAPPING_DOC],
  ])('%s document is non-trivial (>1KB)', (_label, path) => {
    expect(read(path).length).toBeGreaterThan(1024);
  });
});

describe('dixie handoff — recall mapping references all required surfaces', () => {
  it('mapping document references every required recall / BFF surface', () => {
    const src = read(MAPPING_DOC);
    for (const surface of REQUIRED_RECALL_SURFACES) {
      expect(src.includes(surface), `mapping should reference ${surface}`).toBe(true);
    }
  });

  it('mapping document declares the required column headers', () => {
    const src = read(MAPPING_DOC);
    for (const header of [
      'Straylight primitive / operation',
      'Current Straylight local source',
      'Future Dixie BFF / API / service surface',
      'Required input',
      'Required output',
      'Fail-closed condition',
      'Receipt / provenance requirement',
      'Related Hounfour schema candidate',
      'Related Finn enforcement point',
      'Notes',
    ]) {
      expect(src.includes(header), `mapping should include column: ${header}`).toBe(true);
    }
  });

  it('mapping document references at least one Hounfour schema id', () => {
    const src = read(MAPPING_DOC);
    expect(/straylight\.[a-z_]+\.v0/.test(src)).toBe(true);
  });

  it('mapping document references at least one Finn enforcement point', () => {
    const src = read(MAPPING_DOC);
    // The mapping rows cite Finn enforcement points by name.
    expect(/finn-enforcement-mapping\.md/.test(src)).toBe(true);
  });
});

describe('dixie handoff — issue handoff includes explicit non-goals', () => {
  it('issue handoff includes an explicit non-goals section', () => {
    const src = read(ISSUE_DOC);
    expect(/##\s+Explicit non-goals/i.test(src)).toBe(true);
  });

  it('issue handoff non-goals forbid Dixie defining canonical schema', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Dixie MUST NOT.*(canonical|schema|define.*shape|schema authority)/is.test(src),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid Dixie performing runtime policy enforcement', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Dixie MUST NOT.*(runtime policy enforcement|bypass(es)? Finn|policy enforcement that bypasses)/is.test(
        src,
      ),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid generic retrieval as governed recall', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Dixie MUST NOT.*(generic retrieval|retrieval is governed recall|RAG)/is.test(src),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid recall without receipt', () => {
    const src = read(ISSUE_DOC);
    expect(/Dixie MUST NOT.*recall without receipt|No recall without receipt/is.test(src)).toBe(
      true,
    );
  });

  it('issue handoff non-goals forbid leaking private estate material', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Dixie MUST NOT.*(actor_private|private estate|sealed)/is.test(src),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid reverse imports', () => {
    const src = read(ISSUE_DOC);
    expect(/(reverse imports|MUST NOT publish a package)/i.test(src)).toBe(true);
  });

  it('issue handoff is framed as a handoff, not completed integration', () => {
    const src = read(ISSUE_DOC);
    expect(
      /handoff packet|not Dixie integration|handoff prep|pre-integration|filing the issue is not part/i.test(
        src,
      ),
    ).toBe(true);
  });
});

describe('dixie handoff — boundary doc pins recall / privacy / receipt rules', () => {
  it('boundary doc says Dixie must not define canonical schema semantics', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Dixie must not define canonical schema semantics/i.test(src)).toBe(true);
  });

  it('boundary doc says Dixie must not perform runtime policy enforcement that bypasses Finn / the wedge', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Dixie must not perform runtime policy enforcement that bypasses Finn/i.test(src),
    ).toBe(true);
  });

  it('boundary doc says Dixie must not treat generic retrieval as governed recall', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Dixie must not treat generic retrieval as governed recall/i.test(src)).toBe(true);
  });

  it('boundary doc says Dixie must not bypass recall receipts', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Dixie must not bypass recall receipts/i.test(src)).toBe(true);
  });

  it('boundary doc says Dixie must not expose private estate material in public contexts', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Dixie must not expose private estate material in public or unauthorized contexts/i.test(src),
    ).toBe(true);
  });

  it('boundary doc says Dixie must not treat challenged / revoked / forgotten assertions as ordinary active context', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Dixie must not treat challenged \/ revoked \/ forgotten assertions as ordinary active context/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('boundary doc says Dixie must not turn model summaries into canonical estate truth', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Dixie must not turn model summaries into canonical estate truth/i.test(src)).toBe(
      true,
    );
  });

  it('boundary doc says Dixie must fail closed on privacy / receipt failure', () => {
    const src = read(BOUNDARY_DOC);
    expect(/fail[- ]closed/i.test(src), 'boundary doc must mention fail-closed').toBe(true);
    expect(/recall/i.test(src), 'boundary doc must reference recall').toBe(true);
    expect(/receipt/i.test(src), 'boundary doc must reference receipt').toBe(true);
  });

  it('boundary doc references the wedge as the primitive lane owner', () => {
    const src = read(BOUNDARY_DOC);
    expect(/loa-straylight.*permanently|primitive lane.*loa-straylight/is.test(src)).toBe(true);
  });
});

describe('dixie handoff — fixtures are parseable and well-formed', () => {
  it('all required Dixie fixtures exist on disk', () => {
    const present = new Set(readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json')));
    for (const f of REQUIRED_FIXTURES) {
      expect(present.has(f), `missing Dixie fixture: ${f}`).toBe(true);
    }
  });

  it.each(REQUIRED_FIXTURES)('%s parses as JSON', (filename) => {
    const path = resolve(FIXTURE_DIR, filename);
    const raw = read(path);
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it.each(REQUIRED_FIXTURES)(
    '%s contains case_name, expected_allowed, reason, input, expected_output',
    (filename) => {
      const path = resolve(FIXTURE_DIR, filename);
      const obj = JSON.parse(read(path)) as Record<string, unknown>;
      expect(typeof obj.case_name).toBe('string');
      expect((obj.case_name as string).length).toBeGreaterThan(0);
      expect(typeof obj.expected_allowed).toBe('boolean');
      expect(typeof obj.reason).toBe('string');
      expect((obj.reason as string).length).toBeGreaterThan(0);
      expect(obj.input).toBeDefined();
      expect(obj.expected_output).toBeDefined();
    },
  );

  it.each(REQUIRED_FIXTURES)('%s reason is non-trivial (>40 chars)', (filename) => {
    const path = resolve(FIXTURE_DIR, filename);
    const obj = JSON.parse(read(path)) as Record<string, unknown>;
    expect((obj.reason as string).length).toBeGreaterThan(40);
  });

  it('every fixture filename mentioned in the issue handoff exists', () => {
    const src = read(ISSUE_DOC);
    for (const f of REQUIRED_FIXTURES) {
      if (src.includes(f)) {
        expect(existsSync(resolve(FIXTURE_DIR, f)), `${f} mentioned but missing on disk`).toBe(
          true,
        );
      }
    }
    for (const f of REQUIRED_FIXTURES) {
      expect(src.includes(f), `issue handoff should reference ${f}`).toBe(true);
    }
  });
});

describe('dixie handoff — helper script and tests have no forbidden imports', () => {
  // Phase 12 must not introduce cross-repo coupling. The helper script,
  // this test file, and all three handoff documents MUST NOT import (or
  // suggest importing) from .loa, .claude, loa-dixie, or any sibling
  // repo.
  const FORBIDDEN_IMPORT_PATTERNS: { name: string; pattern: RegExp }[] = [
    { name: '.loa/', pattern: /from\s+['"][^'"]*\.loa\b/ },
    { name: '.claude/', pattern: /from\s+['"][^'"]*\.claude\b/ },
    { name: 'loa-dixie', pattern: /from\s+['"][^'"]*loa-dixie/ },
    { name: 'loa-finn', pattern: /from\s+['"][^'"]*loa-finn/ },
    { name: 'loa-hounfour', pattern: /from\s+['"][^'"]*loa-hounfour/ },
    { name: 'loa-freeside', pattern: /from\s+['"][^'"]*loa-freeside/ },
    { name: 'loa-eval', pattern: /from\s+['"][^'"]*loa-eval/ },
    { name: '@loa/dixie', pattern: /from\s+['"]@loa\/dixie/ },
    { name: '@loa/finn', pattern: /from\s+['"]@loa\/finn/ },
    { name: '@loa/hounfour', pattern: /from\s+['"]@loa\/hounfour/ },
    { name: '@loa/freeside', pattern: /from\s+['"]@loa\/freeside/ },
    { name: '@loa/eval', pattern: /from\s+['"]@loa\/eval/ },
  ];

  const CODE_FILES = [
    HELPER_SCRIPT,
    resolve(ROOT, 'tests/dixie-governed-recall-handoff.test.ts'),
  ];

  it.each(CODE_FILES)('%s contains no forbidden imports', (file) => {
    const src = read(file);
    for (const { name, pattern } of FORBIDDEN_IMPORT_PATTERNS) {
      expect(pattern.test(src), `${file} imports from forbidden source: ${name}`).toBe(false);
    }
  });

  it('helper script imports only from node:* builtins or local repo files', () => {
    const src = read(HELPER_SCRIPT);
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1] ?? '');
    expect(matches.length, 'helper should declare at least one import').toBeGreaterThan(0);
    for (const spec of matches) {
      const isNodeBuiltin = spec.startsWith('node:');
      const isLocalRelative = spec.startsWith('./') || spec.startsWith('../');
      expect(
        isNodeBuiltin || isLocalRelative,
        `helper script imports must be node:* or relative; got: ${spec}`,
      ).toBe(true);
    }
  });

  it('helper script does not import from sibling repo packages', () => {
    const src = read(HELPER_SCRIPT);
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1] ?? '');
    for (const spec of matches) {
      expect(/^@loa\//.test(spec), `helper imports from @loa/ scope: ${spec}`).toBe(false);
      expect(/^loa-/.test(spec), `helper imports from loa- prefix: ${spec}`).toBe(false);
    }
  });

  it('helper script does not claim Dixie integration is complete', () => {
    const src = read(HELPER_SCRIPT);
    expect(
      /handoff prep, not Dixie integration|not Dixie integration|out of scope for Phase 12|not official Dixie fixtures/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('handoff docs do not declare cross-repo runtime imports', () => {
    for (const doc of [ISSUE_DOC, BOUNDARY_DOC, MAPPING_DOC]) {
      const src = read(doc);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/dixie/m.test(src),
        `${doc} declares a runtime import from @loa/dixie`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/finn/m.test(src),
        `${doc} declares a runtime import from @loa/finn`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/hounfour/m.test(src),
        `${doc} declares a runtime import from @loa/hounfour`,
      ).toBe(false);
    }
  });
});

describe('dixie handoff — npm script wiring and packet self-description', () => {
  it('package.json declares the dixie:recall script', () => {
    const pkg = JSON.parse(read(resolve(ROOT, 'package.json'))) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts?.['dixie:recall']).toBeDefined();
    expect(pkg.scripts?.['dixie:recall']).toContain('export-dixie-governed-recall-fixtures.ts');
  });

  it('top-level README mentions the Phase 12 Dixie handoff packet', () => {
    const src = read(resolve(ROOT, 'README.md'));
    expect(/Phase 12/.test(src)).toBe(true);
    expect(
      /dixie:recall|dixie-governed-recall|Dixie governed recall/i.test(src),
    ).toBe(true);
  });

  it('top-level README does not claim Dixie integration is complete', () => {
    const src = read(resolve(ROOT, 'README.md'));
    expect(/Dixie integration complete/i.test(src)).toBe(false);
    expect(/integrates with Dixie/i.test(src)).toBe(false);
    expect(/depends on @loa\/dixie/i.test(src)).toBe(false);
  });

  it('handoff index README lists the Dixie governed recall packet', () => {
    const src = read(resolve(HANDOFF_DIR, 'README.md'));
    expect(/Dixie governed recall/i.test(src)).toBe(true);
    expect(/dixie-governed-recall-issue\.md/.test(src)).toBe(true);
    expect(/dixie-governed-recall-boundary\.md/.test(src)).toBe(true);
    expect(/dixie-recall-mapping\.md/.test(src)).toBe(true);
  });

  it('handoff index README still lists the Hounfour and Finn packets', () => {
    const src = read(resolve(HANDOFF_DIR, 'README.md'));
    expect(/Hounfour schema extraction/i.test(src)).toBe(true);
    expect(/Finn runtime enforcement/i.test(src)).toBe(true);
  });
});
