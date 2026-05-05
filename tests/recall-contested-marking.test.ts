// Acceptance: contested assertions are MARKED, never silently treated as
// active truth. The recall pack must surface them in the `marked` slot with
// a non-usable `use_instruction`, and the receipt must list them as marked.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  executeRecall,
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

describe('contested assertions are marked, not silently active', () => {
  function makeStore(): EstateStore {
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: loadKeyring(),
    });

    // Three preferences:
    //   * one active (must end up in `included` as `usable`)
    //   * one contested (must end up in `marked` as `mark_as_contested`)
    //   * one demoted (must end up in `marked` as `use_as_background_only` when mark_statuses requested)

    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'preference',
        body: { text: 'Prefer concise answers.' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
    );

    store.seedAssertion(
      buildSeededAssertion({
        status: 'contested',
        assertion_class: 'preference',
        body: { text: 'Prefer formal tone.' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
    );

    store.seedAssertion(
      buildSeededAssertion({
        status: 'demoted',
        assertion_class: 'preference',
        body: { text: 'Old preference about emoji usage.' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
    );

    return store;
  }

  it('public_discord recall marks contested + demoted with non-usable instructions', () => {
    const store = makeStore();
    const req = buildRecallRequest({
      task: 'public discord answer',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['preference'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      mark_statuses: ['contested', 'demoted'],
      signer: SIGNERS.operator,
    });
    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(true);
    const pack = out.pack!;

    expect(pack.included).toHaveLength(1);
    expect(pack.included[0]?.use_instruction).toBe('usable');
    expect(pack.included[0]?.status).toBe('active');

    // Marked must contain both contested and demoted preferences.
    const markedStatuses = pack.marked.map((m) => m.status).sort();
    expect(markedStatuses).toEqual(['contested', 'demoted']);

    const contestedItem = pack.marked.find((m) => m.status === 'contested');
    const demotedItem = pack.marked.find((m) => m.status === 'demoted');
    expect(contestedItem?.use_instruction).toBe('mark_as_contested');
    expect(demotedItem?.use_instruction).toBe('use_as_background_only');

    // No marked item is `usable`.
    for (const m of pack.marked) {
      expect(m.use_instruction).not.toBe('usable');
    }

    // Receipt records the marked IDs.
    const receipt = out.receipt!;
    expect(receipt.marked_assertion_ids.sort()).toEqual(pack.marked.map((m) => m.assertion_id).sort());
    expect(receipt.included_assertion_ids).toEqual(pack.included.map((i) => i.assertion_id));
  });

  it('omitting demoted from mark_statuses excludes it (does NOT silently include)', () => {
    const store = makeStore();
    const req = buildRecallRequest({
      task: 'strict-only recall',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      requested_classes: ['preference'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      // mark_statuses intentionally omitted: demoted should be excluded, not included.
      signer: SIGNERS.operator,
    });
    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(true);
    const pack = out.pack!;

    // contested is still always marked (never silently included).
    expect(pack.marked.some((m) => m.status === 'contested')).toBe(true);
    // demoted is excluded when mark_statuses doesn't include it.
    expect(pack.marked.some((m) => m.status === 'demoted')).toBe(false);
    expect(pack.included.some((i) => i.status === 'demoted')).toBe(false);
    expect(pack.excluded_summary.map((s) => s.reason)).toContain('status_demoted');
  });
});
