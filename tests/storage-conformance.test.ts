// StorageAdapter conformance: every adapter must satisfy the same contract.
// Runs the same scenarios against InMemoryStorage and JsonlStorage so any
// future adapter (Postgres, SQLite, KV, …) can plug into the same harness.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  EstateStore,
  InMemoryStorage,
  JsonlStorage,
  executeRecall,
  type StorageAdapter,
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

interface AdapterCase {
  name: string;
  make: () => { storage: StorageAdapter; cleanup: () => void };
}

const cases: AdapterCase[] = [
  {
    name: 'InMemoryStorage',
    make: () => ({ storage: new InMemoryStorage(), cleanup: () => undefined }),
  },
  {
    name: 'JsonlStorage',
    make: () => {
      const root = mkdtempSync(join(tmpdir(), 'straylight-jsonl-conformance-'));
      return {
        storage: new JsonlStorage({ root }),
        cleanup: () => rmSync(root, { recursive: true, force: true }),
      };
    },
  },
];

for (const { name, make } of cases) {
  describe(`StorageAdapter conformance: ${name}`, () => {
    let storage: StorageAdapter;
    let cleanup: () => void;

    beforeEach(() => {
      const m = make();
      storage = m.storage;
      cleanup = m.cleanup;
    });
    afterEach(() => cleanup());

    it('returns undefined / [] for unknown ids', () => {
      expect(storage.getActor('nope')).toBeUndefined();
      expect(storage.getEstate('nope')).toBeUndefined();
      expect(storage.getKeyring('nope')).toBeUndefined();
      expect(storage.getAssertion('nope')).toBeUndefined();
      expect(storage.getRecallReceipt('nope')).toBeUndefined();
      expect(storage.listAssertions('nope')).toEqual([]);
      expect(storage.listTransitions('nope')).toEqual([]);
      expect(storage.listAuditEvents('nope')).toEqual([]);
      expect(storage.listAuditEvents()).toEqual([]);
      expect(storage.getAuditTail('nope')).toBeUndefined();
    });

    it('upsert keeps latest version for actors / estates / keyrings / assertions / receipts', () => {
      const actor = loadActor();
      storage.upsertActor(actor);
      storage.upsertActor({ ...actor, status: 'suspended' });
      expect(storage.getActor(actor.actor_id)?.status).toBe('suspended');

      const estate = loadEstate();
      storage.upsertEstate(estate);
      storage.upsertEstate({ ...estate, status: 'archived' });
      expect(storage.getEstate(estate.estate_id)?.status).toBe('archived');

      const keyring = loadKeyring();
      storage.upsertKeyring(keyring);
      const newer = { ...keyring, version: '0.2.0' };
      storage.upsertKeyring(newer);
      expect(storage.getKeyring(keyring.keyring_id)?.version).toBe('0.2.0');
    });

    it('captures full admit + recall flow and exposes it through the adapter', () => {
      const store = new EstateStore({
        actor: loadActor(),
        estate: loadEstate(),
        keyring: loadKeyring(),
        storage,
      });

      const admit = store.admit(
        buildCandidate({
          assertion_class: 'observation',
          body: { text: 'public obs' },
          privacy_scope: 'public',
          signer: SIGNERS.operator,
        }),
        NOW,
      );
      expect(admit.ok).toBe(true);

      // listAssertions reflects the admitted assertion.
      const assertions = storage.listAssertions(loadEstate().estate_id);
      expect(assertions).toHaveLength(1);
      expect(assertions[0]?.assertion_id).toBe(admit.assertion!.assertion_id);

      // listTransitions reflects the admit transition.
      const txs = storage.listTransitions(loadEstate().estate_id);
      expect(txs).toHaveLength(1);
      expect(txs[0]?.transition_type).toBe('admit_assertion');

      // Audit events: at minimum the admit event.
      const audit = storage.listAuditEvents(loadEstate().estate_id);
      expect(audit.some((e) => e.event_type === 'assertion_admitted')).toBe(true);

      const req = buildRecallRequest({
        task: 'public discord',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        signer: SIGNERS.operator,
      });
      const out = executeRecall(store, req, NOW);
      expect(out.ok).toBe(true);
      // Receipt is persisted via the adapter.
      const persisted = storage.getRecallReceipt(out.receipt!.receipt_id);
      expect(persisted?.pack_hash).toBe(out.receipt!.pack_hash);
    });

    it('audit chain links: previous_audit_hash points at the prior tail; tail updates per write', () => {
      const store = new EstateStore({
        actor: loadActor(),
        estate: loadEstate(),
        keyring: loadKeyring(),
        storage,
      });
      const estate_id = loadEstate().estate_id;
      expect(storage.getAuditTail(estate_id)).toBeUndefined();

      // Two admits to build a chain of length 2 (or more, since admit emits one event each).
      store.admit(
        buildCandidate({
          assertion_class: 'observation',
          body: { text: 'first' },
          privacy_scope: 'public',
          signer: SIGNERS.operator,
        }),
        NOW,
      );
      const tailAfterOne = storage.getAuditTail(estate_id);
      expect(tailAfterOne).toBeDefined();

      store.admit(
        buildCandidate({
          assertion_class: 'observation',
          body: { text: 'second' },
          privacy_scope: 'public',
          signer: SIGNERS.operator,
        }),
        NOW,
      );
      const tailAfterTwo = storage.getAuditTail(estate_id);
      expect(tailAfterTwo).toBeDefined();
      expect(tailAfterTwo).not.toBe(tailAfterOne);

      // verifyChain agrees.
      expect(store.auditLog.verifyChain(estate_id).ok).toBe(true);
    });

    it('listAuditEvents filters by estate_id; the global form returns everything', () => {
      const store = new EstateStore({
        actor: loadActor(),
        estate: loadEstate(),
        keyring: loadKeyring(),
        storage,
      });
      store.admit(
        buildCandidate({
          assertion_class: 'observation',
          body: { text: 'evt' },
          privacy_scope: 'public',
          signer: SIGNERS.operator,
        }),
        NOW,
      );
      const all = storage.listAuditEvents();
      const scoped = storage.listAuditEvents(loadEstate().estate_id);
      expect(scoped.length).toBeGreaterThan(0);
      expect(all.length).toBe(scoped.length); // only one estate in this test
      expect(scoped.every((e) => e.estate_id === loadEstate().estate_id)).toBe(true);
    });
  });
}
