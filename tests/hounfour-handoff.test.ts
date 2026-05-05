// Phase 9 conformance — Hounfour extraction handoff packet.
//
// Pins:
//   * the three handoff documents under docs/handoffs/ exist
//   * the extraction mapping table references all core Straylight
//     primitives (Actor, ActorEstate, Assertion, Keyring,
//     SignatureEnvelope, EstateTransition, Challenge, Revocation,
//     ForgetRecord, RecallRequest, RecallPack, RecallReceipt,
//     AuditEvent, CommitmentRoot, PolicyDecision)
//   * the issue handoff explicitly mentions class validation vs
//     policy validation
//   * the issue handoff includes an explicit non-goals section
//   * the PR checklist forbids Hounfour runtime enforcement,
//     storage ownership, and recall execution ownership
//   * the conformance fixture names referenced in the docs all
//     exist on disk
//   * the helper script does not import from .loa, .claude,
//     loa-hounfour, or any sibling repo
//
// These pins prove the handoff packet is internally consistent and
// does not silently introduce cross-repo coupling. They are NOT a
// substitute for any future loa-hounfour conformance check; they
// only validate the in-repo handoff prep.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const HANDOFF_DIR = resolve(ROOT, 'docs/handoffs');
const ISSUE_DOC = resolve(HANDOFF_DIR, 'hounfour-schema-extraction-issue.md');
const PR_CHECKLIST_DOC = resolve(HANDOFF_DIR, 'hounfour-schema-extraction-pr-checklist.md');
const MAPPING_DOC = resolve(HANDOFF_DIR, 'hounfour-extraction-mapping.md');
const HELPER_SCRIPT = resolve(ROOT, 'scripts/print-hounfour-handoff-summary.ts');

const SCHEMA_CANDIDATE_DIR = resolve(ROOT, 'fixtures/schema-candidates');
const HOUNFOUR_CONFORMANCE_DIR = resolve(ROOT, 'fixtures/hounfour-conformance');

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

const CORE_PRIMITIVES = [
  'Actor',
  'ActorEstate',
  'Assertion',
  'Keyring',
  'SignatureEnvelope',
  'EstateTransition',
  'Challenge',
  'Revocation',
  'ForgetRecord',
  'RecallRequest',
  'RecallPack',
  'RecallReceipt',
  'AuditEvent',
  'CommitmentRoot',
  'PolicyDecision',
] as const;

describe('hounfour handoff — handoff documents exist', () => {
  it('docs/handoffs/ directory exists', () => {
    expect(existsSync(HANDOFF_DIR), 'docs/handoffs/ should exist').toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['PR checklist', PR_CHECKLIST_DOC],
    ['extraction mapping', MAPPING_DOC],
  ])('%s document exists', (_label, path) => {
    expect(existsSync(path), `${path} should exist`).toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['PR checklist', PR_CHECKLIST_DOC],
    ['extraction mapping', MAPPING_DOC],
  ])('%s document is non-trivial (>1KB)', (_label, path) => {
    const content = read(path);
    expect(content.length, `${path} should be substantive`).toBeGreaterThan(1024);
  });
});

describe('hounfour handoff — mapping table references all core primitives', () => {
  it('mapping document references every core primitive', () => {
    const src = read(MAPPING_DOC);
    for (const name of CORE_PRIMITIVES) {
      // Use a word-boundary check so e.g. "ActorEstate" doesn't satisfy "Actor".
      const pattern = new RegExp(`\\b${name}\\b`);
      expect(pattern.test(src), `mapping should reference ${name}`).toBe(true);
    }
  });

  it('mapping document declares a Straylight primitive column', () => {
    const src = read(MAPPING_DOC);
    expect(/Straylight primitive/.test(src)).toBe(true);
  });

  it('mapping document declares the five classification values', () => {
    const src = read(MAPPING_DOC);
    for (const c of [
      'move_to_hounfour',
      'shared_contract',
      'stay_in_straylight',
      'runtime_only',
      'fixture_only',
    ]) {
      expect(src.includes(c), `mapping should mention classification ${c}`).toBe(true);
    }
  });

  it('mapping document declares the four validation layers', () => {
    const src = read(MAPPING_DOC);
    for (const layer of [
      'class_validation',
      'policy_validation',
      'audit_validation',
      'keyring_validation',
    ]) {
      expect(src.includes(layer), `mapping should mention layer ${layer}`).toBe(true);
    }
  });

  it('mapping document references the proposed Hounfour schema name format', () => {
    const src = read(MAPPING_DOC);
    expect(/straylight\.[a-z_]+\.v0/.test(src), 'mapping should use straylight.<type>.v0 ids').toBe(
      true,
    );
  });

  it('mapping document references the conformance fixture column', () => {
    const src = read(MAPPING_DOC);
    expect(/Conformance fixture/.test(src)).toBe(true);
  });
});

describe('hounfour handoff — issue handoff mentions class vs policy validation', () => {
  it('issue handoff mentions class validation vs policy validation', () => {
    const src = read(ISSUE_DOC);
    expect(/class validation/i.test(src)).toBe(true);
    expect(/policy validation/i.test(src)).toBe(true);
  });

  it('issue handoff dedicates a section to the class-vs-policy boundary', () => {
    const src = read(ISSUE_DOC);
    expect(/class[\s_]validation\s+vs\s+policy[\s_]validation/i.test(src)).toBe(true);
  });

  it('issue handoff names all four "no-go" conflations', () => {
    const src = read(ISSUE_DOC);
    expect(/valid JSON.+authoriz/i.test(src), 'mentions valid JSON / authorized action').toBe(
      true,
    );
    expect(/valid signature.+competen/i.test(src), 'mentions valid signature / competence').toBe(
      true,
    );
    expect(
      /(structurally valid|valid recall request).+(allowed|automatically)/i.test(src),
      'mentions valid request / allowed recall',
    ).toBe(true);
    expect(
      /(valid assertion|structurally valid assertion).+(active truth|automatically active)/i.test(
        src,
      ),
      'mentions valid assertion / active truth',
    ).toBe(true);
  });

  it('issue handoff links to docs/schema-candidates/class-vs-policy-boundary.md', () => {
    const src = read(ISSUE_DOC);
    expect(src.includes('class-vs-policy-boundary.md')).toBe(true);
  });
});

describe('hounfour handoff — issue handoff has explicit non-goals', () => {
  it('issue handoff includes an explicit non-goals section', () => {
    const src = read(ISSUE_DOC);
    expect(/##\s+Explicit non-goals/i.test(src), 'issue must have an Explicit non-goals heading').toBe(
      true,
    );
  });

  it('issue handoff non-goals forbid Hounfour producing a PolicyDecision', () => {
    const src = read(ISSUE_DOC);
    // Specific load-bearing non-goal: the PolicyDecision *engine* stays
    // in loa-straylight permanently.
    expect(/Hounfour MUST NOT.*(produce.*PolicyDecision|policy decisions)/is.test(src)).toBe(
      true,
    );
  });

  it('issue handoff non-goals forbid signer competence evaluation in Hounfour', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Hounfour MUST NOT.*evaluateCompetence|No signer competence evaluation/is.test(src),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid audit-chain code in Hounfour', () => {
    const src = read(ISSUE_DOC);
    expect(/Hounfour MUST NOT.*audit|No audit-chain code/is.test(src)).toBe(true);
  });

  it('issue handoff non-goals forbid reverse imports', () => {
    const src = read(ISSUE_DOC);
    expect(/(reverse imports|MUST NOT import from.*loa-straylight)/i.test(src)).toBe(true);
  });

  it('issue handoff non-goals forbid Discord / Freeside / Finn / Dixie integration', () => {
    const src = read(ISSUE_DOC);
    expect(/Discord/i.test(src)).toBe(true);
    expect(/Freeside/i.test(src)).toBe(true);
    expect(/Finn/i.test(src)).toBe(true);
    expect(/Dixie/i.test(src)).toBe(true);
  });

  it('issue handoff is clearly framed as a handoff, not completed integration', () => {
    const src = read(ISSUE_DOC);
    // Either phrasing acceptable, but at least one must pin "handoff prep" /
    // "not Hounfour integration".
    expect(
      /handoff packet|not Hounfour integration|not.*part of Phase 9|pre-extraction/i.test(src),
    ).toBe(true);
  });
});

describe('hounfour handoff — PR checklist forbids Hounfour runtime / storage / recall ownership', () => {
  it('PR checklist forbids Hounfour runtime enforcement', () => {
    const src = read(PR_CHECKLIST_DOC);
    // Section heading existence is the load-bearing pin.
    expect(/No runtime enforcement added/i.test(src)).toBe(true);
    // Plus at least one specific forbidden symbol from the wedge runtime.
    expect(/PolicyDecision/.test(src)).toBe(true);
    expect(/EstateTransition|EstateStore/.test(src)).toBe(true);
  });

  it('PR checklist forbids Hounfour signer competence runtime decisions', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/No signer competence runtime decisions/i.test(src)).toBe(true);
    expect(/evaluateCompetence/.test(src)).toBe(true);
    expect(/verifyEnvelopeSelfConsistency|verifyDevSignature/.test(src)).toBe(true);
  });

  it('PR checklist forbids Hounfour storage ownership and recall execution ownership', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/No storage or recall execution ownership/i.test(src)).toBe(true);
    expect(/StorageAdapter|InMemoryStorage|JsonlStorage/.test(src)).toBe(true);
    expect(/executeRecall/.test(src)).toBe(true);
  });

  it('PR checklist explicitly states Hounfour MUST NOT produce a PolicyDecision', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/MUST NOT.*(produce|production).*PolicyDecision/is.test(src)).toBe(true);
  });

  it('PR checklist forbids onchain anchor adapters in Hounfour', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/No onchain anchor adapter|onchain.*reserved future work/is.test(src)).toBe(true);
  });

  it('PR checklist forbids Discord / Freeside / Finn / Dixie integration in Hounfour', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/Discord/i.test(src)).toBe(true);
    expect(/Freeside/i.test(src)).toBe(true);
    expect(/Finn/i.test(src)).toBe(true);
    expect(/Dixie/i.test(src)).toBe(true);
  });

  it('PR checklist includes a backwards-compatibility section', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/Backwards compatibility/i.test(src)).toBe(true);
  });

  it('PR checklist includes a review checklist section', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/Review checklist/i.test(src)).toBe(true);
  });

  it('PR checklist references the test list pinned by H17', () => {
    const src = read(PR_CHECKLIST_DOC);
    expect(/H17/.test(src)).toBe(true);
    // Spot-check one specific wedge test that must stay green after the
    // future swap.
    expect(/tests\/class-vs-policy-validation\.test\.ts/.test(src)).toBe(true);
  });
});

describe('hounfour handoff — conformance fixture names referenced in docs exist', () => {
  // Every conformance fixture filename mentioned in the issue or mapping
  // doc must actually exist on disk under fixtures/hounfour-conformance/.
  // This guards against drift where the doc says "valid-assertion.json"
  // but the fixture has been renamed or removed.
  const REQUIRED_CONFORMANCE_FIXTURES = [
    'valid-assertion.json',
    'invalid-assertion-unknown-class.json',
    'valid-recall-request.json',
    'invalid-recall-request-missing-actor-id.json',
    'valid-recall-receipt.json',
    'invalid-recall-receipt-missing-receipt-hash.json',
    'valid-audit-event.json',
    'invalid-audit-event-tampered-hash.json',
    'policy-decision-allowed.json',
    'policy-decision-denied.json',
    'keyring-signer-competent.json',
    'keyring-signer-incompetent.json',
  ];

  it('every required conformance fixture exists on disk', () => {
    const present = new Set(
      readdirSync(HOUNFOUR_CONFORMANCE_DIR).filter((f) => f.endsWith('.json')),
    );
    for (const f of REQUIRED_CONFORMANCE_FIXTURES) {
      expect(present.has(f), `missing conformance fixture: ${f}`).toBe(true);
    }
  });

  it('every conformance fixture mentioned in the issue handoff exists', () => {
    const src = read(ISSUE_DOC);
    for (const f of REQUIRED_CONFORMANCE_FIXTURES) {
      if (src.includes(f)) {
        const onDisk = resolve(HOUNFOUR_CONFORMANCE_DIR, f);
        expect(existsSync(onDisk), `${f} mentioned in issue but missing on disk`).toBe(true);
      }
    }
    // The issue handoff must reference at least the canonical 12 vectors.
    for (const f of REQUIRED_CONFORMANCE_FIXTURES) {
      expect(src.includes(f), `issue handoff should reference ${f}`).toBe(true);
    }
  });

  it('every conformance fixture mentioned in the mapping doc exists', () => {
    const src = read(MAPPING_DOC);
    for (const f of REQUIRED_CONFORMANCE_FIXTURES) {
      if (src.includes(f)) {
        const onDisk = resolve(HOUNFOUR_CONFORMANCE_DIR, f);
        expect(existsSync(onDisk), `${f} mentioned in mapping but missing on disk`).toBe(true);
      }
    }
  });

  it('every Phase 6 schema-candidate fixture mentioned in the mapping doc exists', () => {
    const src = read(MAPPING_DOC);
    const present = new Set(readdirSync(SCHEMA_CANDIDATE_DIR).filter((f) => f.endsWith('.json')));
    // Spot-check a handful of Phase 6 fixtures that appear in the mapping
    // table; if any one is referenced, it must exist.
    for (const f of [
      'actor.json',
      'estate.json',
      'keyring.json',
      'assertion-observation.json',
      'assertion-reflection-contested.json',
      'assertion-revoked.json',
      'recall-request-public-discord.json',
      'recall-pack-public-discord.json',
      'recall-receipt-public-discord.json',
      'audit-event-transition.json',
      'policy-decision-denied.json',
      'commitment-root.json',
    ]) {
      if (src.includes(f)) {
        expect(
          present.has(f),
          `${f} mentioned in mapping but missing in fixtures/schema-candidates/`,
        ).toBe(true);
      }
    }
  });
});

describe('hounfour handoff — helper script and tests have no forbidden imports', () => {
  // Phase 9 must not introduce cross-repo coupling. The helper script,
  // this test file, and all three handoff documents MUST NOT import (or
  // suggest importing) from .loa, .claude, loa-hounfour, or any sibling
  // repo.
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

  const CODE_FILES = [HELPER_SCRIPT, resolve(ROOT, 'tests/hounfour-handoff.test.ts')];

  it.each(CODE_FILES)('%s contains no forbidden imports', (file) => {
    const src = read(file);
    for (const { name, pattern } of FORBIDDEN_IMPORT_PATTERNS) {
      expect(pattern.test(src), `${file} imports from forbidden source: ${name}`).toBe(false);
    }
  });

  it('helper script imports only from node:* builtins', () => {
    const src = read(HELPER_SCRIPT);
    // Find every import-from clause; require each one to start with "node:".
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1]);
    expect(matches.length, 'helper should declare at least one import').toBeGreaterThan(0);
    for (const spec of matches) {
      expect(
        (spec ?? '').startsWith('node:'),
        `helper script should only import from node:* builtins; got: ${spec}`,
      ).toBe(true);
    }
  });

  it('helper script does not edit sibling repos (no fs writes outside the repo)', () => {
    const src = read(HELPER_SCRIPT);
    // The helper is read-only: no writeFileSync, mkdirSync, rmSync, etc.
    for (const symbol of ['writeFileSync', 'mkdirSync', 'rmSync', 'unlinkSync', 'rename']) {
      expect(src.includes(symbol), `helper should not use ${symbol}`).toBe(false);
    }
  });

  it('helper script does not claim Hounfour integration is complete', () => {
    const src = read(HELPER_SCRIPT);
    // Either phrasing acceptable; at least one must pin handoff-not-integration.
    expect(
      /handoff packet, not Hounfour integration|not Hounfour integration|out of scope for Phase 9/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('handoff docs do not declare cross-repo runtime imports', () => {
    for (const doc of [ISSUE_DOC, PR_CHECKLIST_DOC, MAPPING_DOC]) {
      const src = read(doc);
      // Forbid concrete `from '...'` import lines that name a sibling repo.
      // (Code blocks that *describe* a future Hounfour import are fine; we
      // forbid only declarations that look like wedge-side imports.)
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/finn/m.test(src),
        `${doc} declares a runtime import from @loa/finn`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/dixie/m.test(src),
        `${doc} declares a runtime import from @loa/dixie`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/freeside/m.test(src),
        `${doc} declares a runtime import from @loa/freeside`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/eval/m.test(src),
        `${doc} declares a runtime import from @loa/eval`,
      ).toBe(false);
    }
  });
});

describe('hounfour handoff — npm script wiring and packet self-description', () => {
  it('package.json declares the hounfour:handoff script', () => {
    const pkg = JSON.parse(read(resolve(ROOT, 'package.json'))) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts?.['hounfour:handoff']).toBeDefined();
    expect(pkg.scripts?.['hounfour:handoff']).toContain('print-hounfour-handoff-summary.ts');
  });

  it('helper script references each handoff document by relative path', () => {
    const src = read(HELPER_SCRIPT);
    expect(src.includes('docs/handoffs/hounfour-schema-extraction-issue.md')).toBe(true);
    expect(src.includes('docs/handoffs/hounfour-schema-extraction-pr-checklist.md')).toBe(true);
    expect(src.includes('docs/handoffs/hounfour-extraction-mapping.md')).toBe(true);
  });

  it('schema-candidates README mentions Phase 9', () => {
    const src = read(resolve(ROOT, 'docs/schema-candidates/README.md'));
    expect(/Phase 9/.test(src)).toBe(true);
    expect(src.includes('docs/handoffs/') || src.includes('../handoffs/')).toBe(true);
  });

  it('top-level README mentions the Phase 9 handoff packet', () => {
    const src = read(resolve(ROOT, 'README.md'));
    expect(/Phase 9/.test(src)).toBe(true);
    expect(/hounfour:handoff|docs\/handoffs\//.test(src)).toBe(true);
  });

  it('top-level README does not claim Hounfour integration is complete', () => {
    const src = read(resolve(ROOT, 'README.md'));
    // Catch the most likely overstatements.
    expect(/Hounfour integration complete/i.test(src)).toBe(false);
    expect(/integrates with Hounfour/i.test(src)).toBe(false);
    expect(/depends on @loa\/hounfour/i.test(src)).toBe(false);
  });
});
