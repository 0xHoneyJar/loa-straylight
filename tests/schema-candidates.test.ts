// Phase 6 conformance — schema candidate fixtures.
//
// Pins:
//   * fixtures/schema-candidates/*.json are parseable JSON
//   * each fixture carries the required high-level fields for its type
//   * the public API still exports the symbols the helper uses to build
//     the fixtures (regression guard against accidental barrel removal)
//   * class-validation examples stay separate from policy-decision examples
//   * schema-candidate sources do not import from .loa, .claude, or any
//     sibling repo (no premature cross-repo coupling)
//
// These are NOT a Hounfour conformance suite. They check that the local
// pre-extraction prep stays internally consistent.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import * as straylight from '../src/straylight/index.js';
import {
  buildCandidates,
  listCandidateFiles,
  DEFAULT_OUT_DIR,
  type SchemaCandidateBundle,
} from '../scripts/export-schema-candidates.lib.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const FIXTURE_DIR = DEFAULT_OUT_DIR;

const EXPECTED_FIXTURES = [
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
];

function readJson(name: string): Record<string, unknown> {
  const p = resolve(FIXTURE_DIR, name);
  return JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;
}

describe('schema candidates — fixture presence and parseability', () => {
  it('contains every expected fixture file', () => {
    const present = new Set(readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json')));
    for (const f of EXPECTED_FIXTURES) {
      expect(present.has(f), `missing fixture: ${f}`).toBe(true);
    }
  });

  it('each fixture parses as JSON', () => {
    for (const f of EXPECTED_FIXTURES) {
      expect(() => readJson(f), `not valid JSON: ${f}`).not.toThrow();
    }
  });
});

describe('schema candidates — required high-level fields per type', () => {
  it('actor.json carries identity fields', () => {
    const a = readJson('actor.json');
    for (const k of [
      'actor_id',
      'actor_type',
      'estate_id',
      'keyring_id',
      'status',
      'controller_refs',
      'schema_version',
      'created_at',
      'updated_at',
    ]) {
      expect(a, `actor missing ${k}`).toHaveProperty(k);
    }
  });

  it('estate.json carries estate fields', () => {
    const e = readJson('estate.json');
    for (const k of [
      'estate_id',
      'actor_id',
      'schema_version',
      'status',
      'assertion_index_ref',
      'keyring_id',
      'policy_id',
      'audit_log_ref',
      'created_at',
      'updated_at',
    ]) {
      expect(e, `estate missing ${k}`).toHaveProperty(k);
    }
  });

  it('keyring.json carries keyring fields and at least one rule', () => {
    const k = readJson('keyring.json');
    for (const f of [
      'keyring_id',
      'actor_id',
      'estate_id',
      'version',
      'signer_entries',
      'competence_rules',
      'revoked_key_refs',
      'created_at',
      'updated_at',
    ]) {
      expect(k, `keyring missing ${f}`).toHaveProperty(f);
    }
    expect(Array.isArray(k.signer_entries)).toBe(true);
    expect((k.signer_entries as unknown[]).length).toBeGreaterThan(0);
    expect(Array.isArray(k.competence_rules)).toBe(true);
    expect((k.competence_rules as unknown[]).length).toBeGreaterThan(0);
  });

  it.each([
    'assertion-observation.json',
    'assertion-reflection-contested.json',
    'assertion-revoked.json',
  ])('%s carries assertion fields', (name) => {
    const a = readJson(name);
    for (const k of [
      'assertion_id',
      'estate_id',
      'actor_id',
      'assertion_class',
      'status',
      'body',
      'body_hash',
      'schema_version',
      'provenance',
      'signatures',
      'created_at',
      'updated_at',
    ]) {
      expect(a, `${name} missing ${k}`).toHaveProperty(k);
    }
    expect(a.signatures, `${name} signatures empty`).not.toEqual([]);
  });

  it('assertion fixtures expose the expected statuses', () => {
    expect(readJson('assertion-observation.json').status).toBe('active');
    expect(readJson('assertion-reflection-contested.json').status).toBe('contested');
    expect(readJson('assertion-revoked.json').status).toBe('revoked');
  });

  it('recall-request-public-discord.json carries request fields', () => {
    const r = readJson('recall-request-public-discord.json');
    for (const k of [
      'recall_request_id',
      'actor_id',
      'estate_id',
      'requested_by',
      'task',
      'environment_frame',
      'risk_profile',
      'include_receipt_detail',
      'signature',
      'created_at',
    ]) {
      expect(r, `recall-request missing ${k}`).toHaveProperty(k);
    }
    expect(r.environment_frame).toBe('public_discord');
  });

  it('recall-pack-public-discord.json carries pack fields', () => {
    const p = readJson('recall-pack-public-discord.json');
    for (const k of [
      'recall_pack_id',
      'recall_request_id',
      'actor_id',
      'estate_id',
      'included',
      'marked',
      'redacted',
      'excluded_summary',
      'policy_decision',
      'receipt_id',
      'pack_hash',
      'created_at',
    ]) {
      expect(p, `recall-pack missing ${k}`).toHaveProperty(k);
    }
  });

  it('recall-receipt-public-discord.json carries receipt fields', () => {
    const r = readJson('recall-receipt-public-discord.json');
    for (const k of [
      'receipt_id',
      'recall_request_id',
      'recall_pack_id',
      'actor_id',
      'estate_id',
      'filters_applied',
      'included_assertion_ids',
      'marked_assertion_ids',
      'redacted_count',
      'excluded_counts_by_reason',
      'policy_decision_ref',
      'requester_signature_ref',
      'pack_hash',
      'receipt_hash',
      'created_at',
      'detail_level',
    ]) {
      expect(r, `recall-receipt missing ${k}`).toHaveProperty(k);
    }
  });

  it('audit-event-transition.json carries audit-event fields', () => {
    const e = readJson('audit-event-transition.json');
    for (const k of [
      'audit_event_id',
      'event_type',
      'actor_id',
      'estate_id',
      'signer_refs',
      'audit_hash',
      'created_at',
    ]) {
      expect(e, `audit-event missing ${k}`).toHaveProperty(k);
    }
    expect(typeof e.audit_hash).toBe('string');
    expect((e.audit_hash as string).startsWith('sha256:')).toBe(true);
  });

  it('policy-decision-denied.json carries decision fields and is denied', () => {
    const d = readJson('policy-decision-denied.json');
    for (const k of [
      'decision',
      'policy_id',
      'policy_version',
      'signer_competence_result',
      'reasons',
      'decided_at',
    ]) {
      expect(d, `policy-decision missing ${k}`).toHaveProperty(k);
    }
    expect(d.decision).toBe('deny');
    const sc = d.signer_competence_result as Record<string, unknown>;
    expect(sc.allowed).toBe(false);
  });

  it('commitment-root.json carries commitment fields', () => {
    const c = readJson('commitment-root.json');
    for (const k of [
      'commitment_id',
      'actor_id',
      'estate_id',
      'commitment_type',
      'root_hash',
      'included_refs',
      'schema_version',
      'created_by',
      'signature',
      'created_at',
    ]) {
      expect(c, `commitment missing ${k}`).toHaveProperty(k);
    }
    expect(typeof c.root_hash).toBe('string');
    expect((c.root_hash as string).startsWith('sha256:')).toBe(true);
  });
});

describe('schema candidates — public API still exports what the helper uses', () => {
  it('exports the helpers buildCandidates relies on', () => {
    // Behavior surface
    expect(typeof straylight.EstateStore).toBe('function');
    expect(typeof straylight.executeRecall).toBe('function');
    expect(typeof straylight.computeCommitmentRoot).toBe('function');
    expect(typeof straylight.policyForAdmitAssertion).toBe('function');
    expect(typeof straylight.validateCandidateAssertion).toBe('function');
    expect(typeof straylight.devSign).toBe('function');
    // Storage surface
    expect(typeof straylight.InMemoryStorage).toBe('function');
  });

  it('buildCandidates() runs deterministically and returns every candidate type', () => {
    const a = buildCandidates();
    const b = buildCandidates();

    // Basic structural integrity
    expect(a.actor.actor_id).toBe(b.actor.actor_id);
    expect(a.estate.estate_id).toBe(b.estate.estate_id);
    expect(a.keyring.keyring_id).toBe(b.keyring.keyring_id);

    // Determinism on content-addressed IDs
    expect(a.observation.assertion_id).toBe(b.observation.assertion_id);
    expect(a.recallPack.pack_hash).toBe(b.recallPack.pack_hash);
    expect(a.recallReceipt.receipt_hash).toBe(b.recallReceipt.receipt_hash);
    expect(a.commitmentRoot.root_hash).toBe(b.commitmentRoot.root_hash);

    // Storyline pins
    expect(a.observation.status).toBe('active');
    expect(a.reflectionContested.status).toBe('contested');
    expect(a.revoked.status).toBe('revoked');
    expect(a.policyDecisionDenied.decision).toBe('deny');
  });

  it('listCandidateFiles() covers all expected fixtures', () => {
    const bundle: SchemaCandidateBundle = buildCandidates();
    const filenames = listCandidateFiles(bundle).map((f) => f.filename).sort();
    expect(filenames).toEqual([...EXPECTED_FIXTURES].sort());
  });
});

describe('schema candidates — class-validation examples stay separate from policy-decision examples', () => {
  it('assertion fixtures do not embed a top-level policy_decision', () => {
    for (const f of [
      'assertion-observation.json',
      'assertion-reflection-contested.json',
      'assertion-revoked.json',
    ]) {
      const a = readJson(f);
      expect(a, `${f} should not carry policy_decision`).not.toHaveProperty('policy_decision');
      expect(a, `${f} should not carry decision`).not.toHaveProperty('decision');
    }
  });

  it('policy-decision-denied.json does not look like an assertion', () => {
    const d = readJson('policy-decision-denied.json');
    for (const k of ['assertion_id', 'body', 'body_hash', 'assertion_class', 'provenance']) {
      expect(d, `policy-decision must not carry ${k}`).not.toHaveProperty(k);
    }
  });

  it('recall-request-public-discord.json carries no decision/competence fields itself', () => {
    // The request is a class-validation candidate; the decision is produced
    // by the policy engine and lives in the pack, not the request.
    const r = readJson('recall-request-public-discord.json');
    expect(r).not.toHaveProperty('policy_decision');
    expect(r).not.toHaveProperty('signer_competence_result');
    expect(r).not.toHaveProperty('decision');
  });
});

describe('schema candidates — no sibling repo / framework imports', () => {
  // Phase 6 must not introduce cross-repo coupling. The helper sources MUST
  // import only from the wedge's public barrel and the fixture builders.
  const SCRIPT_FILES = [
    resolve(ROOT, 'scripts/export-schema-candidates.ts'),
    resolve(ROOT, 'scripts/export-schema-candidates.lib.ts'),
  ];

  const FORBIDDEN_PATTERNS: { name: string; pattern: RegExp }[] = [
    { name: '.loa/', pattern: /from\s+['"][^'"]*\.loa\b/ },
    { name: '.claude/', pattern: /from\s+['"][^'"]*\.claude\b/ },
    { name: 'loa-hounfour', pattern: /from\s+['"][^'"]*loa-hounfour/ },
    { name: 'loa-finn', pattern: /from\s+['"][^'"]*loa-finn/ },
    { name: 'loa-dixie', pattern: /from\s+['"][^'"]*loa-dixie/ },
    { name: 'loa-freeside', pattern: /from\s+['"][^'"]*loa-freeside/ },
    { name: '@loa/hounfour', pattern: /from\s+['"]@loa\/hounfour/ },
    { name: '@loa/finn', pattern: /from\s+['"]@loa\/finn/ },
    { name: '@loa/dixie', pattern: /from\s+['"]@loa\/dixie/ },
    { name: '@loa/freeside', pattern: /from\s+['"]@loa\/freeside/ },
  ];

  it.each(SCRIPT_FILES)('%s contains no forbidden imports', (file) => {
    const src = readFileSync(file, 'utf8');
    for (const { name, pattern } of FORBIDDEN_PATTERNS) {
      expect(pattern.test(src), `${file} imports from forbidden source: ${name}`).toBe(false);
    }
  });

  it('docs/schema-candidates/*.md do not declare cross-repo runtime imports', () => {
    // Soft guard: the docs may *mention* loa-hounfour as the future home,
    // but must not contain TypeScript import statements that reach into
    // sibling repos. (Inventory tables explicitly point only at in-repo
    // source files.)
    const docFiles = [
      resolve(ROOT, 'docs/schema-candidates/README.md'),
      resolve(ROOT, 'docs/schema-candidates/hounfour-schema-extraction-prep.md'),
      resolve(ROOT, 'docs/schema-candidates/class-vs-policy-boundary.md'),
    ];
    for (const f of docFiles) {
      const src = readFileSync(f, 'utf8');
      // Should not contain ts import lines reaching sibling repos.
      expect(/^\s*import\s+[^;]*from\s+['"][^'"]*loa-hounfour/m.test(src)).toBe(false);
      expect(/^\s*import\s+[^;]*from\s+['"]@loa\/hounfour/m.test(src)).toBe(false);
    }
  });
});
