// Phase 20B — Recall Wedge local-scaffold pin.
//
// LOCAL SEMANTICS, NOT RUNTIME-WIRED. Phase 20B only.
//
// This file pins the six ADR-020D receipt categories on the existing
// `executeRecall` pipeline inside loa-straylight, plus the load-bearing
// "structural validity is not authorization" invariant. It is the local
// scaffold artifact for the Phase 20B branch
// (`phase-20b-recall-wedge-local-scaffold`); it is not the full Recall
// Wedge, not governed recall in Finn / Dixie / Freeside runtime, and not
// a Hounfour schema rewrite.
//
// The six categories per ADR-020D §4 are:
//   1. included            — passed all filters; surfaced as `usable`.
//   2. excluded            — filtered by status / class / privacy / risk;
//                            reason recorded in `excluded_summary`.
//   3. redacted            — surfaced under `RedactionSummary`
//                            (e.g. tenant scope in a public frame).
//   4. challenged (marked) — surfaced under `marked`, never as `usable`.
//   5. revoked             — filtered by `dispositionFor()` regardless of
//                            caller intent (and surfaced only as marked
//                            non-usable in `audit_review`).
//   6. blocked-by-policy   — `transition_denied` audit event; recall
//                            short-circuits with no pack and no receipt.
//
// The structural-validity pin proves that a class-valid `RecallRequest`
// (i.e. `validateRecallRequest` returns valid) is still denied if local
// policy rejects the signer / competence — class validation is shape,
// never authorization.
//
// This pin is purely additive. It does not modify any `src/` file, does
// not wire Finn / Dixie / Freeside runtime, does not add a Dixie endpoint,
// does not implement Challenge or EstateTransition, does not import any
// unexported Hounfour internal, does not add a `safeCanonicalize`
// subpath, does not change the wedge's public surface in
// `src/straylight/index.ts`, and does not change `package.json`. Only
// this test file and three docs are touched by Phase 20B.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  executeRecall,
  validateRecallRequest,
  type Keyring,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildRecallRequest,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-07T12:00:00Z';

function makeStore(opts: { keyring?: Keyring } = {}): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: opts.keyring ?? loadKeyring(),
  });
}

// Seed one assertion per ADR-020D category (plus one out-of-scope class)
// so a single recall pass can exercise all six dispositions on the
// existing pipeline.
function seedMixedEstate(store: EstateStore): void {
  // Active, public observation — canonical "included" candidate.
  store.seedAssertion(
    buildSeededAssertion({
      status: 'active',
      assertion_class: 'observation',
      body: { text: 'phase-20b-included: public observation' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
  );

  // Active, tenant-scoped observation — canonical "redacted" candidate
  // when the recall frame is public_*.
  store.seedAssertion(
    buildSeededAssertion({
      status: 'active',
      assertion_class: 'observation',
      body: { text: 'phase-20b-redacted: tenant observation' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
  );

  // Active, actor_private relationship — must be excluded in public frame.
  store.seedAssertion(
    buildSeededAssertion({
      status: 'active',
      assertion_class: 'relationship',
      body: { subject: 'user:bob', relation: 'phase-20b-private-note' },
      privacy_scope: 'actor_private',
      risk_level: 'medium',
      signer: SIGNERS.operator,
    }),
  );

  // Revoked preference — must be excluded outside `audit_review`.
  store.seedAssertion(
    buildSeededAssertion({
      status: 'revoked',
      assertion_class: 'preference',
      body: { text: 'phase-20b-revoked: revoked preference' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
  );

  // Forgotten-from-recall claim — must be excluded outside `audit_review`.
  store.seedAssertion(
    buildSeededAssertion({
      status: 'forgotten_from_recall',
      assertion_class: 'claim',
      body: { text: 'phase-20b-forgotten: forgotten claim' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
  );

  // Contested preference — must be marked, never `usable`.
  store.seedAssertion(
    buildSeededAssertion({
      status: 'contested',
      assertion_class: 'preference',
      body: { text: 'phase-20b-challenged: contested preference' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
  );

  // Out-of-scope class (action_trace) — excluded by class scope filter
  // when the request's `requested_classes` does not include it.
  store.seedAssertion(
    buildSeededAssertion({
      status: 'active',
      assertion_class: 'action_trace',
      body: { action: 'phase-20b-out-of-scope', detail: 'ok' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.runtime,
    }),
  );
}

describe('phase 20B — local scaffold: ADR-020D receipt categories on existing pipeline', () => {
  describe('category 1 — included: active in-scope material is surfaced as `usable`', () => {
    it('an active public observation in an in-scope class is included with use_instruction=usable', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b included',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
        signer: SIGNERS.operator,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);
      const pack = out.pack!;

      const includedSummaries = pack.included.map((i) => i.summary);
      expect(includedSummaries).toContain('phase-20b-included: public observation');

      // Every included item is `usable` and active — ADR-020D §4 invariant.
      for (const item of pack.included) {
        expect(item.use_instruction).toBe('usable');
        expect(item.status).toBe('active');
      }

      // Receipt records the included assertion ids at standard detail level.
      expect(out.receipt!.included_assertion_ids.length).toBeGreaterThan(0);
      expect(out.receipt!.included_assertion_ids).toEqual(
        pack.included.map((i) => i.assertion_id),
      );
    });
  });

  describe('category 2 — excluded: revoked / forgotten / private / out-of-scope are excluded with named reasons', () => {
    it('public_discord recall records named exclusion reasons for revoked / forgotten / actor_private / class_not_requested', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b excluded',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation', 'preference', 'relationship', 'claim'],
        // Do NOT set exclude_statuses — exercise the dispositionFor()
        // fallthrough that filters revoked / forgotten outside audit_review.
        signer: SIGNERS.operator,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);

      const reasons = out.pack!.excluded_summary.map((s) => s.reason);
      // Revoked preference (status path):
      expect(reasons).toContain('status_revoked');
      // Forgotten-from-recall claim (status path):
      expect(reasons).toContain('status_forgotten_from_recall');
      // Actor-private relationship in public frame:
      expect(reasons).toContain('privacy_actor_private_in_public_frame');
      // Out-of-scope class (action_trace not in requested_classes):
      expect(reasons.some((r) => r.startsWith('class_not_requested:action_trace'))).toBe(true);

      // Receipt's excluded_counts_by_reason mirrors pack.excluded_summary.
      const receiptReasons = Object.keys(out.receipt!.excluded_counts_by_reason);
      expect(receiptReasons).toEqual(expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
        'privacy_actor_private_in_public_frame',
      ]));
    });
  });

  describe('category 3 — redacted: tenant-scope material in a public frame appears in RedactionSummary', () => {
    it('public_discord recall over a tenant-scope active observation produces a redacted entry, not an included one', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b redacted',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
        signer: SIGNERS.operator,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);
      const pack = out.pack!;

      // Redacted summary records the tenant-in-public reason.
      const redactedReasons = pack.redacted.map((r) => r.reason);
      expect(redactedReasons).toContain('privacy_tenant_in_public_frame');

      // The tenant-scoped observation is NOT in `included`.
      const includedSummaries = pack.included.map((i) => i.summary);
      expect(includedSummaries).not.toContain('phase-20b-redacted: tenant observation');

      // Receipt's redacted_count aggregates the redacted entries' counts.
      const totalRedacted = pack.redacted.reduce((acc, r) => acc + r.count, 0);
      expect(out.receipt!.redacted_count).toBe(totalRedacted);
      expect(totalRedacted).toBeGreaterThan(0);
    });
  });

  describe('category 4 — challenged: contested assertions are marked, never `usable`', () => {
    it('contested preference is surfaced under `marked` with mark_as_contested', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b challenged',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        requested_classes: ['preference'],
        exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
        mark_statuses: ['contested'],
        signer: SIGNERS.operator,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);
      const pack = out.pack!;

      const contestedItem = pack.marked.find((m) => m.status === 'contested');
      expect(contestedItem).toBeDefined();
      expect(contestedItem!.use_instruction).toBe('mark_as_contested');

      // ADR-020D §4 invariant: no marked item is `usable`.
      for (const m of pack.marked) {
        expect(m.use_instruction).not.toBe('usable');
      }

      // Receipt lists the marked assertion id.
      expect(out.receipt!.marked_assertion_ids).toContain(contestedItem!.assertion_id);
    });
  });

  describe('category 5 — revoked: filtered regardless of caller intent', () => {
    it('public_discord recall does not include revoked assertions, even when the caller does not pre-exclude them', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b revoked',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['preference'],
        // Caller intent: do NOT pre-exclude `revoked`. The wedge must still
        // exclude it under non-audit frames per dispositionFor().
        signer: SIGNERS.operator,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);

      for (const item of out.pack!.included) {
        expect(item.status).not.toBe('revoked');
      }
      expect(out.pack!.excluded_summary.map((s) => s.reason)).toContain('status_revoked');
    });

    it('audit_review frame surfaces revoked assertions only under `marked` with non-usable instruction', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b revoked audit',
        environment_frame: 'audit_review',
        risk_profile: 'high',
        requested_classes: ['preference'],
        include_statuses: ['active', 'revoked'],
        mark_statuses: ['revoked'],
        include_receipt_detail: 'debug',
        signer: SIGNERS.reviewer,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);

      const revokedMarked = out.pack!.marked.find((m) => m.status === 'revoked');
      expect(revokedMarked).toBeDefined();
      expect(revokedMarked!.use_instruction).not.toBe('usable');

      // Even in `audit_review`, revoked is never in `included` as usable.
      for (const item of out.pack!.included) {
        expect(item.status).not.toBe('revoked');
      }
    });
  });

  describe('category 6 — blocked-by-policy: transition_denied audit event; no pack and no receipt', () => {
    it('a class-valid recall request is denied when no recall competence rule is loaded', () => {
      const baseKeyring = loadKeyring();
      const noRecallKeyring: Keyring = {
        ...baseKeyring,
        competence_rules: baseKeyring.competence_rules.filter(
          (r) => r.transition_type !== 'recall_estate_context',
        ),
      };
      const store = makeStore({ keyring: noRecallKeyring });
      seedMixedEstate(store);

      const req = buildRecallRequest({
        task: 'phase-20b blocked-by-policy',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        requested_classes: ['observation'],
        signer: SIGNERS.operator,
      });

      // Class validation passes — request shape is fine …
      const cv = validateRecallRequest(req);
      expect(cv.valid).toBe(true);

      // … but policy denies because no recall_estate_context rule is loaded.
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(false);
      expect(out.pack).toBeUndefined();
      expect(out.receipt).toBeUndefined();
      expect(out.policy_decision.decision).toBe('deny');
      expect(out.policy_decision.reasons).toContain('policy_unavailable_for_transition');

      // Audit log explains the block — `transition_denied` row with
      // payload.kind === 'recall_denied' (recall.ts recordRecallDeny).
      const events = store.auditLog.list();
      const denied = events.find((e) => {
        if (e.event_type !== 'transition_denied') return false;
        const payload = e.payload as Record<string, unknown> | undefined;
        return payload?.['kind'] === 'recall_denied';
      });
      expect(denied).toBeDefined();
    });
  });

  describe('structural-validity pin — class validation is shape, never authorization', () => {
    it('a class-valid request from an off-keyring signer is denied (signature shape ≠ permission)', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b structural-validity pin',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        requested_classes: ['observation'],
        signer: SIGNERS.unknown,
      });

      // Class validation passes — request shape is fine.
      const cv = validateRecallRequest(req);
      expect(cv.valid).toBe(true);

      // Policy still denies because the signer is not on the keyring.
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(false);
      expect(out.pack).toBeUndefined();
      expect(out.policy_decision.decision).toBe('deny');
      const reasonsBlob = out.policy_decision.reasons.join(' ');
      expect(/unknown_signer/.test(reasonsBlob)).toBe(true);

      // Audit chain records the denial.
      const events = store.auditLog.list();
      expect(events.some((e) => e.event_type === 'transition_denied')).toBe(true);
    });
  });

  describe('receipt-or-audit pin — every recall explains included AND excluded material', () => {
    it('successful recall: receipt + audit row carry both the included ids and the excluded reasons', () => {
      const store = makeStore();
      seedMixedEstate(store);
      const req = buildRecallRequest({
        task: 'phase-20b receipt completeness',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation', 'preference'],
        exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
        mark_statuses: ['contested'],
        include_receipt_detail: 'standard',
        signer: SIGNERS.operator,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);

      // Receipt explains included material.
      expect(out.receipt!.included_assertion_ids.length).toBeGreaterThan(0);
      // Receipt explains excluded material via reason counts.
      expect(Object.keys(out.receipt!.excluded_counts_by_reason).length).toBeGreaterThan(0);
      // Receipt explains marked material.
      expect(out.receipt!.marked_assertion_ids.length).toBeGreaterThan(0);

      // Audit row mirrors the same counts.
      const recallEvent = store.auditLog
        .list()
        .find((e) => e.event_type === 'recall_pack_emitted');
      expect(recallEvent).toBeDefined();
      const payload = recallEvent!.payload as Record<string, unknown>;
      expect(payload['included_count']).toBe(out.pack!.included.length);
      expect(payload['marked_count']).toBe(out.pack!.marked.length);
      expect(Array.isArray(payload['excluded_summary'])).toBe(true);
    });
  });
});
