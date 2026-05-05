// Phase 10 conformance — Finn runtime-enforcement handoff packet.
//
// Pins:
//   * the three Finn handoff documents under docs/handoffs/ exist
//   * the enforcement-mapping table references all required transitions
//   * the issue handoff includes an explicit non-goals section
//   * the boundary doc says Finn must not own canonical schema semantics
//   * the boundary doc says Finn must fail closed on signer / policy
//     failure
//   * every Finn fixture is parseable JSON
//   * every Finn fixture contains case_name, expected_allowed, reason,
//     input, expected_output
//   * the helper script does not import from .loa, .claude, loa-finn,
//     or any sibling repo
//
// These pins prove the handoff packet is internally consistent and does
// not silently introduce cross-repo coupling. They are NOT a substitute
// for any future loa-finn runtime-enforcement test pack; they only
// validate the in-repo handoff prep.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const HANDOFF_DIR = resolve(ROOT, 'docs/handoffs');
const ISSUE_DOC = resolve(HANDOFF_DIR, 'finn-runtime-enforcement-issue.md');
const BOUNDARY_DOC = resolve(HANDOFF_DIR, 'finn-runtime-boundary.md');
const MAPPING_DOC = resolve(HANDOFF_DIR, 'finn-enforcement-mapping.md');
const HELPER_SCRIPT = resolve(ROOT, 'scripts/export-finn-enforcement-fixtures.ts');
const FIXTURE_DIR = resolve(ROOT, 'fixtures/finn-runtime-enforcement');

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

const REQUIRED_TRANSITIONS = [
  'create_estate',
  'admit_assertion',
  'classify_assertion',
  'link_assertions',
  'challenge_assertion',
  'demote_assertion',
  'revoke_assertion',
  'forget_assertion_from_recall',
  'recall_request',
  'recall_pack_generation',
  'recall_receipt_emission',
  'audit_chain_verification',
  'commitment_root_generation',
] as const;

const REQUIRED_FIXTURES = [
  'allowed-transition.json',
  'denied-transition-unknown-signer.json',
  'denied-transition-incompetent-signer.json',
  'denied-recall-private-to-public.json',
  'denied-recall-revoked-assertion.json',
  'allowed-recall-contested-marked.json',
  'audit-receipt-required.json',
  'audit-chain-tamper-detected.json',
  'commitment-root-changed.json',
] as const;

describe('finn handoff — handoff documents exist', () => {
  it('docs/handoffs/ directory exists', () => {
    expect(existsSync(HANDOFF_DIR)).toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['boundary doc', BOUNDARY_DOC],
    ['enforcement mapping', MAPPING_DOC],
  ])('%s document exists', (_label, path) => {
    expect(existsSync(path), `${path} should exist`).toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['boundary doc', BOUNDARY_DOC],
    ['enforcement mapping', MAPPING_DOC],
  ])('%s document is non-trivial (>1KB)', (_label, path) => {
    expect(read(path).length).toBeGreaterThan(1024);
  });
});

describe('finn handoff — enforcement mapping references all required transitions', () => {
  it('mapping document references every required transition / primitive', () => {
    const src = read(MAPPING_DOC);
    for (const t of REQUIRED_TRANSITIONS) {
      expect(src.includes(t), `mapping should reference ${t}`).toBe(true);
    }
  });

  it('mapping document declares the required column headers', () => {
    const src = read(MAPPING_DOC);
    for (const header of [
      'Straylight transition',
      'Current Straylight local source',
      'Future Finn enforcement point',
      'Required input',
      'Required output',
      'Fail-closed condition',
      'Audit / receipt requirement',
      'Related Hounfour schema candidate',
      'Notes',
    ]) {
      expect(src.includes(header), `mapping should include column: ${header}`).toBe(true);
    }
  });

  it('mapping document references at least one Hounfour schema id', () => {
    const src = read(MAPPING_DOC);
    expect(/straylight\.[a-z_]+\.v0/.test(src)).toBe(true);
  });
});

describe('finn handoff — issue handoff includes explicit non-goals', () => {
  it('issue handoff includes an explicit non-goals section', () => {
    const src = read(ISSUE_DOC);
    expect(/##\s+Explicit non-goals/i.test(src)).toBe(true);
  });

  it('issue handoff non-goals forbid Finn defining canonical schema semantics', () => {
    const src = read(ISSUE_DOC);
    expect(/Finn MUST NOT.*(canonical schema|define.*shape|schema authority)/is.test(src)).toBe(
      true,
    );
  });

  it('issue handoff non-goals forbid model-output-as-authority', () => {
    const src = read(ISSUE_DOC);
    expect(/Finn MUST NOT.*model output|No model-output-as-authority/is.test(src)).toBe(true);
  });

  it('issue handoff non-goals forbid skipping policy or competence', () => {
    const src = read(ISSUE_DOC);
    expect(/Finn MUST NOT.*(skip|short-circuit|bypass).*policy/is.test(src)).toBe(true);
    expect(/Finn MUST NOT.*(short-circuit|bypass).*evaluateCompetence/is.test(src)).toBe(true);
  });

  it('issue handoff non-goals forbid recall without receipt', () => {
    const src = read(ISSUE_DOC);
    expect(/Finn MUST NOT.*recall without receipt|No recall without receipt/is.test(src)).toBe(
      true,
    );
  });

  it('issue handoff non-goals forbid reverse imports', () => {
    const src = read(ISSUE_DOC);
    expect(/(reverse imports|MUST NOT publish a package)/i.test(src)).toBe(true);
  });

  it('issue handoff is framed as a handoff, not completed integration', () => {
    const src = read(ISSUE_DOC);
    expect(
      /handoff packet|not Finn integration|handoff prep|pre-integration|filing the issue is not part/i.test(
        src,
      ),
    ).toBe(true);
  });
});

describe('finn handoff — boundary doc pins canonical schema and fail-closed rules', () => {
  it('boundary doc says Finn must not own canonical schema semantics', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Finn must not define canonical schema semantics/i.test(src)).toBe(true);
  });

  it('boundary doc says Finn must not treat model output as authority', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Finn must not treat model output as authority/i.test(src)).toBe(true);
  });

  it('boundary doc says Finn must not treat valid JSON as authorized transition', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Finn must not treat valid JSON as authorized transition/i.test(src)).toBe(true);
  });

  it('boundary doc says Finn must not bypass keyring / signer competence', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Finn must not bypass keyring \/ signer competence/i.test(src)).toBe(true);
  });

  it('boundary doc says Finn must not perform recall without receipt', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Finn must not perform recall without receipt/i.test(src)).toBe(true);
  });

  it('boundary doc says Finn must not execute action / commitment without policy', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Finn must not execute action \/ commitment transitions without policy validation/i.test(src),
    ).toBe(true);
  });

  it('boundary doc says Finn must fail closed on signer / policy failure', () => {
    const src = read(BOUNDARY_DOC);
    // Be lenient with phrasing — the doc must convey fail-closed semantics
    // for both the signer-competence and policy-evaluation lanes.
    expect(/fail[- ]closed/i.test(src), 'boundary doc must mention fail-closed').toBe(true);
    expect(/signer/i.test(src), 'boundary doc must reference signer').toBe(true);
    expect(/policy/i.test(src), 'boundary doc must reference policy').toBe(true);
  });

  it('boundary doc references the wedge as the primitive lane owner', () => {
    const src = read(BOUNDARY_DOC);
    expect(/loa-straylight.*permanently|primitive lane.*loa-straylight/is.test(src)).toBe(true);
  });
});

describe('finn handoff — fixtures are parseable and well-formed', () => {
  it('all required Finn fixtures exist on disk', () => {
    const present = new Set(readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json')));
    for (const f of REQUIRED_FIXTURES) {
      expect(present.has(f), `missing Finn fixture: ${f}`).toBe(true);
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

describe('finn handoff — helper script and tests have no forbidden imports', () => {
  // Phase 10 must not introduce cross-repo coupling. The helper script,
  // this test file, and all three handoff documents MUST NOT import (or
  // suggest importing) from .loa, .claude, loa-finn, or any sibling repo.
  const FORBIDDEN_IMPORT_PATTERNS: { name: string; pattern: RegExp }[] = [
    { name: '.loa/', pattern: /from\s+['"][^'"]*\.loa\b/ },
    { name: '.claude/', pattern: /from\s+['"][^'"]*\.claude\b/ },
    { name: 'loa-finn', pattern: /from\s+['"][^'"]*loa-finn/ },
    { name: 'loa-hounfour', pattern: /from\s+['"][^'"]*loa-hounfour/ },
    { name: 'loa-dixie', pattern: /from\s+['"][^'"]*loa-dixie/ },
    { name: 'loa-freeside', pattern: /from\s+['"][^'"]*loa-freeside/ },
    { name: 'loa-eval', pattern: /from\s+['"][^'"]*loa-eval/ },
    { name: '@loa/finn', pattern: /from\s+['"]@loa\/finn/ },
    { name: '@loa/hounfour', pattern: /from\s+['"]@loa\/hounfour/ },
    { name: '@loa/dixie', pattern: /from\s+['"]@loa\/dixie/ },
    { name: '@loa/freeside', pattern: /from\s+['"]@loa\/freeside/ },
    { name: '@loa/eval', pattern: /from\s+['"]@loa\/eval/ },
  ];

  const CODE_FILES = [HELPER_SCRIPT, resolve(ROOT, 'tests/finn-runtime-handoff.test.ts')];

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
    // Specifically forbid any bare-package imports that could resolve to
    // sibling-repo material. Local relative imports inside loa-straylight
    // are fine.
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1] ?? '');
    for (const spec of matches) {
      // Reject bare specifiers that look like Loa siblings.
      expect(/^@loa\//.test(spec), `helper imports from @loa/ scope: ${spec}`).toBe(false);
      expect(/^loa-/.test(spec), `helper imports from loa- prefix: ${spec}`).toBe(false);
    }
  });

  it('helper script does not claim Finn integration is complete', () => {
    const src = read(HELPER_SCRIPT);
    expect(
      /handoff prep, not Finn integration|not Finn integration|out of scope for Phase 10|not official Finn fixtures/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('handoff docs do not declare cross-repo runtime imports', () => {
    for (const doc of [ISSUE_DOC, BOUNDARY_DOC, MAPPING_DOC]) {
      const src = read(doc);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/finn/m.test(src),
        `${doc} declares a runtime import from @loa/finn`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/dixie/m.test(src),
        `${doc} declares a runtime import from @loa/dixie`,
      ).toBe(false);
    }
  });
});

describe('finn handoff — npm script wiring and packet self-description', () => {
  it('package.json declares the finn:enforcement script', () => {
    const pkg = JSON.parse(read(resolve(ROOT, 'package.json'))) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts?.['finn:enforcement']).toBeDefined();
    expect(pkg.scripts?.['finn:enforcement']).toContain('export-finn-enforcement-fixtures.ts');
  });

  it('top-level README mentions the Phase 10 Finn handoff packet', () => {
    const src = read(resolve(ROOT, 'README.md'));
    expect(/Phase 10/.test(src)).toBe(true);
    expect(/finn:enforcement|finn-runtime-enforcement|Finn runtime enforcement/i.test(src)).toBe(
      true,
    );
  });

  it('top-level README does not claim Finn integration is complete', () => {
    const src = read(resolve(ROOT, 'README.md'));
    expect(/Finn integration complete/i.test(src)).toBe(false);
    expect(/integrates with Finn/i.test(src)).toBe(false);
    expect(/depends on @loa\/finn/i.test(src)).toBe(false);
  });
});
