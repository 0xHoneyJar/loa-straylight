// Acceptance: the `forget` transition flips an assertion to
// `forgotten_from_recall`, emits a forget receipt + audit event, and the
// assertion is excluded from ordinary recall while remaining accessible via
// the audit_review frame.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  executeRecall,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';

describe('forget transition', () => {
  it('forgets an assertion: ordinary recall excludes; audit_review surfaces with non-usable instruction', () => {
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: loadKeyring(),
    });

    const admit = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'about to be forgotten from recall' },
        privacy_scope: 'tenant',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(admit.ok).toBe(true);

    const forget = store.forget({
      target_assertion_id: admit.assertion!.assertion_id,
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
    expect(forget.updated_target?.status).toBe('forgotten_from_recall');
    expect(forget.receipt.kind).toBe('forget');

    // Audit event was emitted.
    const auditEvents = store.auditLog.list();
    expect(auditEvents.some((e) => e.event_type === 'assertion_forgotten_from_recall')).toBe(true);

    // Ordinary recall: excluded.
    const ordinary = executeRecall(
      store,
      buildRecallRequest({
        task: 'ordinary recall',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        requested_classes: ['observation'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(ordinary.ok).toBe(true);
    expect(ordinary.pack!.included.find((i) => i.assertion_id === admit.assertion!.assertion_id)).toBeUndefined();
    expect(ordinary.pack!.excluded_summary.map((s) => s.reason)).toContain('status_forgotten_from_recall');

    // Audit-review recall: surfaces in `marked` (never `usable`).
    const audit = executeRecall(
      store,
      buildRecallRequest({
        task: 'audit review',
        environment_frame: 'audit_review',
        risk_profile: 'high',
        requested_classes: ['observation'],
        include_statuses: ['active', 'forgotten_from_recall'],
        mark_statuses: ['forgotten_from_recall'],
        include_receipt_detail: 'debug',
        signer: SIGNERS.reviewer,
      }),
      NOW,
    );
    expect(audit.ok).toBe(true);
    const markedItem = audit.pack!.marked.find((m) => m.assertion_id === admit.assertion!.assertion_id);
    expect(markedItem).toBeDefined();
    expect(markedItem!.use_instruction).not.toBe('usable');
  });

  it('denied forget: signer not on keyring → no status change, denied receipt emitted', () => {
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: loadKeyring(),
    });
    const admit = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'cannot be forgotten by stranger' },
        privacy_scope: 'tenant',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    const forget = store.forget({
      target_assertion_id: admit.assertion!.assertion_id,
      reason: 'unauthorized attempt',
      signatures: [
        buildCandidate({
          assertion_class: 'observation',
          body: { text: 'unauthorized' },
          signer: SIGNERS.unknown,
        }).signatures[0]!,
      ],
      now: NOW,
    });
    expect(forget.ok).toBe(false);
    expect(forget.receipt.kind).toBe('denied');
    expect(forget.receipt.metadata?.['transition_type']).toBe('forget_assertion_from_recall');
    // Target's status unchanged.
    expect(store.getAssertion(admit.assertion!.assertion_id)?.status).toBe('active');
  });
});
