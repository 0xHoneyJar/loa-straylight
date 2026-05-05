// Phase 8 conformance — Hounfour conformance vectors.
//
// Pins:
//   * fixtures/hounfour-conformance/*.json are parseable JSON
//   * every vector carries case_name, expected_valid, validation_layer,
//     reason, subject, payload
//   * vectors named "valid-*" have expected_valid true; vectors named
//     "invalid-*" have expected_valid false
//   * class_validation vectors stay separate from policy_validation
//     vectors (no field collapse)
//   * policy_validation vectors do not pretend to be structural schemas
//     (no assertion-shape fields)
//   * keyring competence vectors are not treated as signature validity
//     alone (signature_self_consistent is true even when competence
//     fails)
//   * the audit-tamper vector fails for the documented audit-chain
//     reason, not for class-shape reasons
//   * fixtures/helpers do not import from .loa, .claude, loa-hounfour,
//     or any sibling repo
//
// These are NOT the Hounfour conformance suite. They are the local
// pre-Hounfour vectors that a later loa-hounfour PR can consume as
// test inputs. See docs/schema-candidates/hounfour-conformance-vectors.md.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const FIXTURE_DIR = resolve(ROOT, 'fixtures', 'hounfour-conformance');

const EXPECTED_VECTORS = [
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

const VALIDATION_LAYERS = new Set([
  'class_validation',
  'policy_validation',
  'audit_validation',
  'keyring_validation',
]);

interface ConformanceVector {
  case_name: string;
  expected_valid: boolean;
  validation_layer: string;
  reason: string;
  subject: string;
  payload: unknown;
}

function readVector(name: string): ConformanceVector {
  const p = resolve(FIXTURE_DIR, name);
  return JSON.parse(readFileSync(p, 'utf8')) as ConformanceVector;
}

describe('hounfour conformance — fixture presence and parseability', () => {
  it('contains every expected vector file', () => {
    const present = new Set(readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json')));
    for (const f of EXPECTED_VECTORS) {
      expect(present.has(f), `missing vector: ${f}`).toBe(true);
    }
  });

  it('contains no unexpected vector files', () => {
    const present = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json'));
    const expected = new Set(EXPECTED_VECTORS);
    for (const f of present) {
      expect(expected.has(f), `unexpected vector file: ${f}`).toBe(true);
    }
  });

  it('each vector parses as JSON', () => {
    for (const f of EXPECTED_VECTORS) {
      expect(() => readVector(f), `not valid JSON: ${f}`).not.toThrow();
    }
  });
});

describe('hounfour conformance — required envelope fields', () => {
  it.each(EXPECTED_VECTORS)('%s carries the conformance envelope', (name) => {
    const v = readVector(name) as unknown as Record<string, unknown>;
    for (const k of [
      'case_name',
      'expected_valid',
      'validation_layer',
      'reason',
      'subject',
      'payload',
    ]) {
      expect(v, `${name} missing ${k}`).toHaveProperty(k);
    }
    expect(typeof v.case_name).toBe('string');
    expect((v.case_name as string).length).toBeGreaterThan(0);
    expect(typeof v.expected_valid).toBe('boolean');
    expect(typeof v.validation_layer).toBe('string');
    expect(VALIDATION_LAYERS.has(v.validation_layer as string)).toBe(true);
    expect(typeof v.reason).toBe('string');
    expect((v.reason as string).length).toBeGreaterThan(0);
    expect(typeof v.subject).toBe('string');
    expect(v.payload).toBeTypeOf('object');
    expect(v.payload).not.toBeNull();
  });

  it('every case_name is unique across vectors', () => {
    const names = EXPECTED_VECTORS.map((f) => readVector(f).case_name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('hounfour conformance — name/expected_valid agreement', () => {
  it.each(EXPECTED_VECTORS.filter((f) => f.startsWith('valid-')))(
    '%s declares expected_valid: true',
    (name) => {
      expect(readVector(name).expected_valid, `${name} should be expected_valid: true`).toBe(true);
    },
  );

  it.each(EXPECTED_VECTORS.filter((f) => f.startsWith('invalid-')))(
    '%s declares expected_valid: false',
    (name) => {
      expect(readVector(name).expected_valid, `${name} should be expected_valid: false`).toBe(false);
    },
  );

  it('policy-decision-allowed carries decision: allow and is expected_valid: true', () => {
    const v = readVector('policy-decision-allowed.json');
    expect(v.expected_valid).toBe(true);
    expect(v.validation_layer).toBe('policy_validation');
    const p = v.payload as Record<string, unknown>;
    expect(p.decision).toBe('allow');
  });

  it('policy-decision-denied carries decision: deny and is expected_valid: false', () => {
    const v = readVector('policy-decision-denied.json');
    expect(v.expected_valid).toBe(false);
    expect(v.validation_layer).toBe('policy_validation');
    const p = v.payload as Record<string, unknown>;
    expect(p.decision).toBe('deny');
  });

  it('keyring-signer-competent declares allowed: true and is expected_valid: true', () => {
    const v = readVector('keyring-signer-competent.json');
    expect(v.expected_valid).toBe(true);
    expect(v.validation_layer).toBe('keyring_validation');
    const p = v.payload as Record<string, unknown>;
    const result = p.signer_competence_result as Record<string, unknown>;
    expect(result.allowed).toBe(true);
  });

  it('keyring-signer-incompetent declares allowed: false and is expected_valid: false', () => {
    const v = readVector('keyring-signer-incompetent.json');
    expect(v.expected_valid).toBe(false);
    expect(v.validation_layer).toBe('keyring_validation');
    const p = v.payload as Record<string, unknown>;
    const result = p.signer_competence_result as Record<string, unknown>;
    expect(result.allowed).toBe(false);
  });
});

describe('hounfour conformance — class_validation stays separate from policy_validation', () => {
  // Class-validation vectors describe structural shape only. Policy-validation
  // vectors describe runtime authorization. The two lanes must not collapse:
  // a class vector cannot smuggle policy fields, and a policy vector cannot
  // smuggle assertion shape.
  const CLASS_VECTORS = [
    'valid-assertion.json',
    'invalid-assertion-unknown-class.json',
    'valid-recall-request.json',
    'invalid-recall-request-missing-actor-id.json',
    'valid-recall-receipt.json',
    'invalid-recall-receipt-missing-receipt-hash.json',
  ];

  const POLICY_VECTORS = [
    'policy-decision-allowed.json',
    'policy-decision-denied.json',
  ];

  it.each(CLASS_VECTORS)('%s declares validation_layer: class_validation', (name) => {
    expect(readVector(name).validation_layer).toBe('class_validation');
  });

  it.each(POLICY_VECTORS)('%s declares validation_layer: policy_validation', (name) => {
    expect(readVector(name).validation_layer).toBe('policy_validation');
  });

  it.each(CLASS_VECTORS)(
    '%s payload does not embed a top-level policy decision',
    (name) => {
      const v = readVector(name);
      const p = v.payload as Record<string, unknown>;
      // Class-validation vectors describe structural shape; they MUST NOT
      // carry a decision on their face.
      expect(p, `${name} payload must not carry top-level decision`).not.toHaveProperty('decision');
      // The recall-pack-style nested policy_decision is also not part of a
      // class-validation candidate (assertion / recall request / receipt).
      expect(p, `${name} payload must not carry policy_decision`).not.toHaveProperty(
        'policy_decision',
      );
    },
  );

  it.each(POLICY_VECTORS)(
    '%s payload does not pretend to be a structural schema',
    (name) => {
      const v = readVector(name);
      const p = v.payload as Record<string, unknown>;
      // PolicyDecision-shaped payload only. No assertion-shape fields and no
      // recall-request-shape fields. This pins "policy_validation vectors do
      // not pretend to be structural schemas."
      for (const k of [
        'assertion_id',
        'assertion_class',
        'body',
        'body_hash',
        'provenance',
        'recall_request_id',
        'recall_pack_id',
        'pack_hash',
        'receipt_hash',
        'audit_hash',
        'previous_audit_hash',
      ]) {
        expect(p, `${name} payload must not carry ${k}`).not.toHaveProperty(k);
      }
      // PolicyDecision must carry a decision.
      expect(p).toHaveProperty('decision');
    },
  );
});

describe('hounfour conformance — keyring competence is not signature validity alone', () => {
  // The wedge separates two gates: (1) is the signature envelope itself
  // self-consistent? (2) is the signer competent for this transition under
  // the keyring? A vector that fails (2) but passes (1) proves the gates
  // are independent. Hounfour MUST NOT treat a valid signature as a
  // competent signer.
  const KEYRING_VECTORS = [
    'keyring-signer-competent.json',
    'keyring-signer-incompetent.json',
  ];

  it.each(KEYRING_VECTORS)('%s declares validation_layer: keyring_validation', (name) => {
    expect(readVector(name).validation_layer).toBe('keyring_validation');
  });

  it.each(KEYRING_VECTORS)(
    '%s payload carries a self-consistent signature envelope and a separate competence result',
    (name) => {
      const v = readVector(name);
      const p = v.payload as Record<string, unknown>;
      // Both keyring vectors must surface the two gates as distinct fields.
      expect(p, `${name} payload must carry signature_envelope`).toHaveProperty('signature_envelope');
      expect(p, `${name} payload must carry signer_competence_result`).toHaveProperty(
        'signer_competence_result',
      );
      expect(p, `${name} payload must carry signature_self_consistent`).toHaveProperty(
        'signature_self_consistent',
      );
      // Signature self-consistency is independent of competence outcome:
      // the structurally valid signature is true on BOTH the competent and
      // the incompetent vector.
      expect(p.signature_self_consistent, `${name} signature must be self-consistent`).toBe(true);
    },
  );

  it('the incompetent vector pins: structurally valid signature does NOT imply signer competence', () => {
    const v = readVector('keyring-signer-incompetent.json');
    expect(v.expected_valid).toBe(false);
    const p = v.payload as Record<string, unknown>;
    expect(p.signature_self_consistent).toBe(true);
    const result = p.signer_competence_result as Record<string, unknown>;
    expect(result.allowed).toBe(false);
    // The reason must be a competence reason, not a signature-shape reason.
    const reason = (result.reason ?? '') as string;
    expect(
      /role|competent|forbidden|quorum|review|status|unknown_signer/.test(reason),
      `incompetence reason should be a competence reason, got: ${reason}`,
    ).toBe(true);
  });
});

describe('hounfour conformance — audit-tamper vector fails for the documented reason', () => {
  it('valid-audit-event payload is structurally consistent', () => {
    const v = readVector('valid-audit-event.json');
    expect(v.expected_valid).toBe(true);
    expect(v.validation_layer).toBe('audit_validation');
    const p = v.payload as Record<string, unknown>;
    expect(typeof p.audit_hash).toBe('string');
    expect((p.audit_hash as string).startsWith('sha256:')).toBe(true);
    expect((p.audit_hash as string).length).toBeGreaterThan('sha256:'.length + 32);
  });

  it('invalid-audit-event-tampered-hash declares audit_validation, not class_validation', () => {
    const v = readVector('invalid-audit-event-tampered-hash.json');
    expect(v.validation_layer).toBe('audit_validation');
    expect(v.validation_layer).not.toBe('class_validation');
  });

  it('invalid-audit-event-tampered-hash payload is structurally complete (only the hash is wrong)', () => {
    // The tamper vector specifically isolates the audit-chain failure from
    // any class-shape failure. The shape must remain complete; the digest
    // is the only field that does not recompute.
    const v = readVector('invalid-audit-event-tampered-hash.json');
    const p = v.payload as Record<string, unknown>;
    for (const k of [
      'audit_event_id',
      'event_type',
      'actor_id',
      'estate_id',
      'signer_refs',
      'audit_hash',
      'created_at',
    ]) {
      expect(p, `tampered audit event missing ${k}`).toHaveProperty(k);
    }
    expect(typeof p.audit_hash).toBe('string');
    expect((p.audit_hash as string).startsWith('sha256:')).toBe(true);
  });

  it('the tamper vector reason mentions the audit chain or hash recomputation', () => {
    const v = readVector('invalid-audit-event-tampered-hash.json');
    expect(/audit|hash|chain|verifyChain|recompute|integrity/i.test(v.reason)).toBe(true);
  });

  it('the tamper vector audit_hash differs from the valid vector audit_hash', () => {
    const valid = readVector('valid-audit-event.json').payload as Record<string, unknown>;
    const tampered = readVector('invalid-audit-event-tampered-hash.json').payload as Record<
      string,
      unknown
    >;
    expect(tampered.audit_hash).not.toBe(valid.audit_hash);
  });
});

describe('hounfour conformance — assertion / request / receipt subjects are correctly tagged', () => {
  it('assertion vectors declare subject: assertion', () => {
    expect(readVector('valid-assertion.json').subject).toBe('assertion');
    expect(readVector('invalid-assertion-unknown-class.json').subject).toBe('assertion');
  });

  it('recall-request vectors declare subject: recall_request', () => {
    expect(readVector('valid-recall-request.json').subject).toBe('recall_request');
    expect(readVector('invalid-recall-request-missing-actor-id.json').subject).toBe(
      'recall_request',
    );
  });

  it('recall-receipt vectors declare subject: recall_receipt', () => {
    expect(readVector('valid-recall-receipt.json').subject).toBe('recall_receipt');
    expect(readVector('invalid-recall-receipt-missing-receipt-hash.json').subject).toBe(
      'recall_receipt',
    );
  });

  it('audit-event vectors declare subject: audit_event', () => {
    expect(readVector('valid-audit-event.json').subject).toBe('audit_event');
    expect(readVector('invalid-audit-event-tampered-hash.json').subject).toBe('audit_event');
  });

  it('policy-decision vectors declare subject: policy_decision', () => {
    expect(readVector('policy-decision-allowed.json').subject).toBe('policy_decision');
    expect(readVector('policy-decision-denied.json').subject).toBe('policy_decision');
  });

  it('keyring vectors declare subject: signer_competence', () => {
    expect(readVector('keyring-signer-competent.json').subject).toBe('signer_competence');
    expect(readVector('keyring-signer-incompetent.json').subject).toBe('signer_competence');
  });

  it('invalid-assertion-unknown-class payload carries a non-enum assertion_class', () => {
    const v = readVector('invalid-assertion-unknown-class.json');
    const p = v.payload as Record<string, unknown>;
    expect(p).toHaveProperty('assertion_class');
    // 'observation' is the canonical valid case; this vector must NOT use it.
    expect(p.assertion_class).not.toBe('observation');
  });

  it('invalid-recall-request-missing-actor-id payload omits actor_id entirely', () => {
    const v = readVector('invalid-recall-request-missing-actor-id.json');
    const p = v.payload as Record<string, unknown>;
    expect(p).not.toHaveProperty('actor_id');
    // Other required structural fields should still be present so the
    // reason really is "missing actor_id" and not "missing several fields".
    expect(p).toHaveProperty('estate_id');
    expect(p).toHaveProperty('task');
  });

  it('invalid-recall-receipt-missing-receipt-hash payload omits receipt_hash entirely', () => {
    const v = readVector('invalid-recall-receipt-missing-receipt-hash.json');
    const p = v.payload as Record<string, unknown>;
    expect(p).not.toHaveProperty('receipt_hash');
    // Pack hash is a separate field; it should still be present so the
    // failure isolates to receipt_hash specifically.
    expect(p).toHaveProperty('pack_hash');
  });
});

describe('hounfour conformance — no sibling repo / framework imports', () => {
  // Phase 8 must not introduce cross-repo coupling. The export helper and
  // this test file MUST NOT import from .loa, .claude, loa-hounfour, or any
  // sibling repo.
  const FILES = [
    resolve(ROOT, 'scripts/export-hounfour-conformance.ts'),
    resolve(ROOT, 'tests/hounfour-conformance.test.ts'),
  ];

  const FORBIDDEN_PATTERNS: { name: string; pattern: RegExp }[] = [
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

  it.each(FILES)('%s contains no forbidden imports', (file) => {
    const src = readFileSync(file, 'utf8');
    for (const { name, pattern } of FORBIDDEN_PATTERNS) {
      expect(pattern.test(src), `${file} imports from forbidden source: ${name}`).toBe(false);
    }
  });

  it('every conformance vector JSON file is import-free (pure data)', () => {
    // JSON cannot carry imports, but pin the assumption explicitly so a
    // future change that swaps to JS modules cannot silently smuggle one.
    for (const f of EXPECTED_VECTORS) {
      const src = readFileSync(resolve(FIXTURE_DIR, f), 'utf8');
      expect(/\bimport\b/.test(src), `${f} unexpectedly contains an import keyword`).toBe(false);
      expect(/\brequire\s*\(/.test(src), `${f} unexpectedly contains a require call`).toBe(false);
    }
  });

  it('the docs/schema-candidates/hounfour-conformance-vectors.md does not declare cross-repo runtime imports', () => {
    const docFile = resolve(ROOT, 'docs/schema-candidates/hounfour-conformance-vectors.md');
    const src = readFileSync(docFile, 'utf8');
    expect(/^\s*import\s+[^;]*from\s+['"][^'"]*loa-hounfour/m.test(src)).toBe(false);
    expect(/^\s*import\s+[^;]*from\s+['"]@loa\/hounfour/m.test(src)).toBe(false);
  });
});

describe('hounfour conformance — vectors are not claimed as canonical Hounfour schemas', () => {
  it('the export helper carries a clear non-canonical disclaimer', () => {
    const src = readFileSync(resolve(ROOT, 'scripts/export-hounfour-conformance.ts'), 'utf8');
    // Either phrasing is acceptable; both pin "not canonical Hounfour".
    expect(/NOT canonical Hounfour|not canonical Hounfour/i.test(src)).toBe(true);
  });

  it('the conformance-vectors doc carries a clear non-canonical disclaimer', () => {
    const src = readFileSync(
      resolve(ROOT, 'docs/schema-candidates/hounfour-conformance-vectors.md'),
      'utf8',
    );
    expect(/not canonical|not the canonical|not official/i.test(src)).toBe(true);
  });
});
