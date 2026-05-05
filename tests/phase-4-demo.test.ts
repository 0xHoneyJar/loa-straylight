// Phase 4 acceptance test — exercises the demo flow programmatically.
//
// Mirrors what `npm run demo:recall` prints to stdout; the CLI script and
// this test share the same `runDemo` implementation in scripts/demo-recall-wedge.lib.ts.

import { describe, expect, it } from 'vitest';
import { runDemo } from '../scripts/demo-recall-wedge.lib.js';

describe('phase-4 demo: governed recall over a signed actor estate', () => {
  it('produces an audit-clean RecallPack + RecallReceipt with the expected exclusions', () => {
    const result = runDemo({ silent: true });

    // ── public_discord pack ───────────────────────────────────────────────────
    const publicIncludedIds = result.publicPack.included.map((i) => i.assertion_id);
    const publicMarkedIds = result.publicPack.marked.map((i) => i.assertion_id);

    // active, public assertions should land in `included` and ONLY in included.
    expect(publicIncludedIds.length).toBeGreaterThanOrEqual(2);
    for (const item of result.publicPack.included) {
      expect(item.use_instruction).toBe('usable');
    }

    // No item that is marked may carry `usable`.
    for (const item of result.publicPack.marked) {
      expect(item.use_instruction).not.toBe('usable');
    }

    // Revoked + forgotten + actor_private must be excluded from the public pack.
    expect(publicIncludedIds).not.toContain(result.revokedAssertion.assertion_id);
    expect(publicIncludedIds).not.toContain(result.forgottenAssertion.assertion_id);
    expect(publicMarkedIds).not.toContain(result.revokedAssertion.assertion_id);
    expect(publicMarkedIds).not.toContain(result.forgottenAssertion.assertion_id);

    // Contested assertion must NOT be in `included` (= silently promoted to
    // active truth). It may legitimately be redacted in a public frame because
    // its privacy_scope is `tenant`.
    expect(publicIncludedIds).not.toContain(result.contestedAssertion.assertion_id);

    // ── exclusion reasons surfaced ────────────────────────────────────────────
    const excludedReasonNames = result.excludedReasons.map((e) => e.reason);
    expect(excludedReasonNames).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
        'privacy_actor_private_in_public_frame',
      ]),
    );

    // ── RecallReceipt structure ───────────────────────────────────────────────
    expect(result.publicReceipt.recall_pack_id).toBe(result.publicPack.recall_pack_id);
    expect(result.publicReceipt.pack_hash).toBe(result.publicPack.pack_hash);
    expect(result.publicReceipt.receipt_hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(result.publicReceipt.included_assertion_ids).toEqual(publicIncludedIds);

    // ── linkage was captured ──────────────────────────────────────────────────
    expect(result.linkedAssertion.linked_assertion_refs?.length ?? 0).toBeGreaterThan(0);

    // ── audit-review surfaces revoked + forgotten as `marked`, never `included`
    const auditMarkedIds = result.auditPack.marked.map((m) => m.assertion_id);
    const auditIncludedIds = result.auditPack.included.map((m) => m.assertion_id);
    expect(auditMarkedIds).toContain(result.revokedAssertion.assertion_id);
    expect(auditMarkedIds).toContain(result.forgottenAssertion.assertion_id);
    expect(auditMarkedIds).toContain(result.contestedAssertion.assertion_id);
    expect(auditIncludedIds).not.toContain(result.revokedAssertion.assertion_id);
    expect(auditIncludedIds).not.toContain(result.forgottenAssertion.assertion_id);

    // ── revoked + forgotten remain auditable ──────────────────────────────────
    const eventsByAssertion = (id: string) =>
      result.auditEvents
        .filter((e) => (e.assertion_refs ?? []).includes(id))
        .map((e) => e.event_type);

    expect(eventsByAssertion(result.revokedAssertion.assertion_id)).toEqual(
      expect.arrayContaining(['assertion_admitted', 'assertion_revoked']),
    );
    expect(eventsByAssertion(result.forgottenAssertion.assertion_id)).toEqual(
      expect.arrayContaining(['assertion_admitted', 'assertion_forgotten_from_recall']),
    );
    expect(eventsByAssertion(result.contestedAssertion.assertion_id)).toEqual(
      expect.arrayContaining(['assertion_admitted', 'assertion_challenged']),
    );

    // ── audit chain ───────────────────────────────────────────────────────────
    expect(result.auditChainOk).toBe(true);

    // recall_pack_emitted audit event for the public pack must exist.
    const recallEvents = result.auditEvents.filter((e) => e.event_type === 'recall_pack_emitted');
    expect(recallEvents.length).toBeGreaterThanOrEqual(2); // public + audit
  });
});
