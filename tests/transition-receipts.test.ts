// Acceptance: every transition (admit / challenge / revoke / forget — and
// every denial of those) emits a structured TransitionReceipt that is
// persisted via the storage adapter and links back to its audit event.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  type TransitionReceipt,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';

function makeStore(): EstateStore {
  return new EstateStore({ actor: loadActor(), estate: loadEstate(), keyring: loadKeyring() });
}

describe('TransitionReceipt is emitted for every transition + denial', () => {
  it('admission emits an admission receipt with stable hash and references the audit event', () => {
    const store = makeStore();
    const out = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'public obs' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(true);
    expect(out.receipt.kind).toBe('admission');
    expect(out.receipt.decision).toBe('allow');
    expect(out.receipt.transition_id).toBe(out.transition.transition_id);
    expect(out.receipt.audit_event_ref).toBe(out.audit_event_id);
    expect(out.receipt.target_refs).toEqual([out.assertion!.assertion_id]);
    expect(out.receipt.signer_refs).toEqual(['operator:eileen']);
    expect(out.receipt.receipt_hash.startsWith('sha256:')).toBe(true);

    // Persisted via storage and looked up by id.
    const persisted = store.storage.getTransitionReceipt(out.receipt.receipt_id);
    expect(persisted).toBeDefined();
    expect(persisted!.receipt_hash).toBe(out.receipt.receipt_hash);
  });

  it('denied admission emits a denied receipt with reasons and the rejected signer set', () => {
    const store = makeStore();
    const out = store.admit(
      buildCandidate({
        assertion_class: 'identity',
        body: { attribute: 'role', value: 'agent' },
        risk_level: 'high',
        signer: SIGNERS.runtime, // runtime is forbidden from admitting identity
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.receipt.kind).toBe('denied');
    expect(out.receipt.decision).toBe('deny');
    expect(out.receipt.reasons.length).toBeGreaterThan(0);
    expect(out.receipt.signer_refs).toEqual(['runtime:finn']);
    expect(out.receipt.audit_event_ref).toBe(out.audit_event_id);
    // metadata records the attempted transition shape so operators can pivot
    // on it without re-reading the audit log.
    expect(out.receipt.metadata?.['transition_type']).toBe('admit_assertion');
  });

  it('challenge / revoke / forget each emit their own receipt kind', () => {
    const store = makeStore();
    const seed = store.admit(
      buildCandidate({
        assertion_class: 'reflection',
        body: { text: 'doubtful reflection' },
        privacy_scope: 'tenant',
        signer: SIGNERS.runtime,
      }),
      NOW,
    );
    expect(seed.ok).toBe(true);

    const challenge = store.challenge({
      target_assertion_id: seed.assertion!.assertion_id,
      challenge: {
        challenge_type: 'unsupported',
        requested_effect: 'mark_contested',
        evidence_refs: [],
        explanation: 'no evidence',
        signatures: [
          buildCandidate({
            assertion_class: 'challenge',
            body: { target: seed.assertion!.assertion_id },
            signer: SIGNERS.reviewer,
          }).signatures[0]!,
        ],
      },
      now: NOW,
    });
    expect(challenge.ok).toBe(true);
    expect(challenge.receipt.kind).toBe('challenge');
    expect(challenge.receipt.decision).toBe('allow');
    expect(challenge.receipt.metadata?.['new_status']).toBe('contested');

    // Admit a second assertion to revoke directly.
    const revokable = store.admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'soon-to-be-revoked' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(revokable.ok).toBe(true);

    const revoke = store.revoke({
      target_assertion_id: revokable.assertion!.assertion_id,
      revocation: {
        reason: 'superseded by direct decision',
        signatures: [
          buildCandidate({
            assertion_class: 'revocation',
            body: { target: revokable.assertion!.assertion_id },
            signer: SIGNERS.reviewer,
          }).signatures[0]!,
        ],
      },
      now: NOW,
    });
    expect(revoke.ok).toBe(true);
    expect(revoke.receipt.kind).toBe('revocation');
    expect(revoke.receipt.decision).toBe('allow');
    expect(revoke.updated_target?.status).toBe('revoked');

    // Forget a third assertion.
    const forgettable = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'will be forgotten from recall' },
        privacy_scope: 'tenant',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    const forget = store.forget({
      target_assertion_id: forgettable.assertion!.assertion_id,
      reason: 'operator request',
      signatures: [
        buildCandidate({
          assertion_class: 'observation',
          body: { text: 'forget request' },
          signer: SIGNERS.reviewer,
        }).signatures[0]!,
      ],
      now: NOW,
    });
    expect(forget.ok).toBe(true);
    expect(forget.receipt.kind).toBe('forget');
    expect(forget.updated_target?.status).toBe('forgotten_from_recall');

    // listTransitionReceipts surfaces all four receipts.
    const listed = store.listTransitionReceipts();
    const kinds = listed.map((r: TransitionReceipt) => r.kind).sort();
    expect(kinds).toEqual(['admission', 'admission', 'admission', 'challenge', 'forget', 'revocation']);
  });
});
