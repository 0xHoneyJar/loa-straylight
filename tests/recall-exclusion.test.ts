// Acceptance: revoked / private / out-of-scope assertions are EXCLUDED from
// recall packs (not silently included, not just labeled).

import { beforeEach, describe, expect, it } from 'vitest';
import {
  EstateStore,
  executeRecall,
  type AssertionStatus,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildRecallRequest,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';

function makeStore(): EstateStore {
  return new EstateStore({ actor: loadActor(), estate: loadEstate(), keyring: loadKeyring() });
}

describe('governed recall excludes revoked / private / out-of-scope material', () => {
  let store: EstateStore;

  beforeEach(() => {
    store = makeStore();

    // Public-safe active observation that SHOULD be in a public recall pack.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'observation',
        body: { text: 'Demo agent prefers concise public answers.' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );

    // Active preference, also public.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'preference',
        body: { text: 'Public Discord answers must exclude revoked identity claims.' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );

    // Revoked reflection — must be excluded.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'revoked',
        assertion_class: 'reflection',
        body: { text: 'Bob is suspicious.' },
        privacy_scope: 'tenant',
        risk_level: 'medium',
        signer: SIGNERS.operator,
      }),
    );

    // Forgotten-from-recall claim — must be excluded.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'forgotten_from_recall',
        assertion_class: 'claim',
        body: { text: 'The agent once promised X.' },
        privacy_scope: 'tenant',
        risk_level: 'medium',
        signer: SIGNERS.operator,
      }),
    );

    // Sealed identity — privileged frame only.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'sealed',
        assertion_class: 'identity',
        body: { attribute: 'true_name', value: 'redacted' },
        privacy_scope: 'sealed',
        risk_level: 'critical',
        signer: SIGNERS.reviewer,
      }),
    );

    // Private relationship note — excluded in public frame.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'relationship',
        body: { subject: 'user:bob', relation: 'has_unresolved_dispute_with_admin' },
        privacy_scope: 'actor_private',
        risk_level: 'medium',
        signer: SIGNERS.operator,
      }),
    );

    // Out-of-scope class: action_trace, not requested by the public-discord recall below.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'action_trace',
        body: { action: 'sent message', detail: 'ok' },
        privacy_scope: 'tenant',
        risk_level: 'low',
        signer: SIGNERS.runtime,
      }),
    );
  });

  it('public_discord recall excludes revoked / forgotten / sealed / actor_private', () => {
    const req = buildRecallRequest({
      task: 'answer user question in public discord',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      // Include `relationship` and `reflection` in the requested set so the
      // privacy + status filters get exercised (otherwise they'd be excluded
      // earlier by class scope and the test wouldn't prove privacy enforcement).
      requested_classes: ['observation', 'preference', 'relationship', 'reflection', 'claim', 'identity'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      mark_statuses: ['contested', 'demoted'],
      signer: SIGNERS.operator,
    });

    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(true);
    expect(out.pack).toBeDefined();
    const pack = out.pack!;

    const allIncludedIds = pack.included.map((i) => i.assertion_id);
    expect(allIncludedIds.length).toBeGreaterThan(0);

    // Statuses that must never appear in `included`:
    const forbiddenStatuses: AssertionStatus[] = ['revoked', 'forgotten_from_recall', 'sealed'];
    for (const item of pack.included) {
      expect(forbiddenStatuses).not.toContain(item.status);
    }

    // Reasons must record exclusion for each.
    const reasons = pack.excluded_summary.map((s) => s.reason);
    expect(reasons).toEqual(expect.arrayContaining([
      'status_revoked',
      'status_forgotten_from_recall',
      'status_sealed',
      'privacy_actor_private_in_public_frame',
    ]));

    // class_not_requested must surface for action_trace (which is not in requested_classes).
    expect(reasons.some((r) => r.startsWith('class_not_requested:action_trace'))).toBe(true);
  });

  it('audit_review frame may surface revoked assertions (with their status preserved)', () => {
    const req = buildRecallRequest({
      task: 'audit why agent ignored a claim',
      environment_frame: 'audit_review',
      risk_profile: 'high',
      requested_classes: ['observation', 'preference', 'claim', 'reflection', 'identity', 'relationship'],
      include_statuses: ['active', 'contested', 'demoted', 'revoked', 'forgotten_from_recall'],
      mark_statuses: ['contested', 'demoted', 'revoked', 'forgotten_from_recall'],
      include_receipt_detail: 'debug',
      signer: SIGNERS.reviewer,
    });

    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(true);
    const pack = out.pack!;
    // Marked items must include the revoked / forgotten ones (audit frame surfaces them, never as 'usable').
    const markedStatuses = pack.marked.map((m) => m.status);
    expect(markedStatuses).toEqual(expect.arrayContaining(['revoked', 'forgotten_from_recall']));
    // No marked item is presented as `usable`.
    for (const m of pack.marked) {
      expect(m.use_instruction).not.toBe('usable');
    }
  });

  it('class scope filter excludes assertions whose class was not requested', () => {
    const req = buildRecallRequest({
      task: 'observation-only recall',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      requested_classes: ['observation'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      signer: SIGNERS.operator,
    });
    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(true);
    const pack = out.pack!;
    for (const item of pack.included) {
      expect(item.assertion_class).toBe('observation');
    }
    expect(pack.excluded_summary.some((s) => s.reason.startsWith('class_not_requested:'))).toBe(true);
  });
});
