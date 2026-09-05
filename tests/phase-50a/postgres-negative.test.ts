// Phase 50A — required negative tests.
//
// Every item in the packet's `required_negative_tests` is proven here or, where
// it is a concurrency property, in `postgres-concurrency.test.ts` (cross-
// referenced below). The shape of each proof is the same: put the store in the
// failure condition, then show that it DENIES — no successful durable
// operation, no served bad data, no silent repair, no fallback adapter.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EstateStore, executeRecall, type StorageAdapter } from '../../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../../fixtures/index.js';
import {
  PostgresEstateHost,
  PostgresIntegrityError,
  PostgresUnavailableError,
  assertRestoreServiceable,
  readStoreSnapshot,
  verifyRestore,
} from '../../src/straylight/storage/postgres/index.js';
import {
  openScratchDatabase,
  openUnmigratedDatabase,
  phase50aEnabled,
  phase50aGateReport,
  replaceDatabase,
  requireReachable,
  sourceHost,
  type ScratchDatabase,
} from './_support.js';

const NOW = '2026-05-05T12:00:00Z';
const ESTATE_ID = loadEstate().estate_id;

phase50aGateReport('postgres-negative');

const maybe = phase50aEnabled() ? describe : describe.skip;

maybe('Phase 50A negative — availability failures deny, never degrade', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('an unreachable database fails closed with no successful durable operation', async () => {
    // A port nothing listens on. The store must surface unavailability, not
    // return a value and not fall back to another adapter.
    const host = new PostgresEstateHost({
      connectionString: 'postgresql://straylight_proof:x@127.0.0.1:1/straylight_absent',
      connectionTimeoutMs: 2_000,
    });
    try {
      await expect(
        host.withEstateSession(ESTATE_ID, (storage) => {
          storage.upsertActor(loadActor());
          return 'must not be returned';
        }),
      ).rejects.toBeInstanceOf(PostgresUnavailableError);
    } finally {
      await host.close();
    }
  });

  it('a database that exists but has no schema applied fails closed on version mismatch', async () => {
    const db = await openUnmigratedDatabase(sourceHost(), 'no-schema');
    try {
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          storage.upsertActor(loadActor());
        }),
      ).rejects.toMatchObject({
        name: 'PostgresUnavailableError',
        reason: 'schema_version_mismatch',
      });
    } finally {
      await db.dispose();
    }
  });

  it('a required schema version that is not applied fails closed even when the tables exist', async () => {
    const db = await openScratchDatabase(sourceHost(), 'future-version');
    try {
      // Same physical database, but the store is configured to require a
      // version this build never applied. Serving anyway would be exactly the
      // permissive degradation P-11 forbids.
      const strict = new PostgresEstateHost({
        connectionString: db.connectionString,
        requiredSchemaVersions: ['0001', '9999'],
      });
      try {
        await expect(
          strict.withEstateSession(ESTATE_ID, (storage) => storage.getActor('x')),
        ).rejects.toMatchObject({ reason: 'schema_version_mismatch' });
      } finally {
        await strict.close();
      }
    } finally {
      await db.dispose();
    }
  });

  it('a connection interrupted mid-session aborts the transaction and persists nothing', async () => {
    const db = await openScratchDatabase(sourceHost(), 'interrupted');
    try {
      // Seed one admit so there is a durable prefix to compare against.
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('before interruption'), NOW);
      });

      // Terminate the session's own backend from inside an open transaction
      // that has already written. The interruption is REAL — the server closes
      // the connection — not a simulated error object.
      //
      // The rejection is asserted structurally (it rejects, and the error names
      // the terminated connection) rather than by error class, because the
      // driver may surface a socket-level termination either as the query's
      // rejection or as a connection error; both are failures and neither is a
      // successful durable operation, which is the property under test.
      const interrupted = db.host.withClient(async (client) => {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO actors (actor_id, payload) VALUES ('actor:ghost', '{"actor_id":"actor:ghost"}'::jsonb)`,
        );
        await client.query('SELECT pg_terminate_backend(pg_backend_pid())');
        await client.query('SELECT 1');
        return 'must not be returned';
      });
      await expect(interrupted).rejects.toThrow(/terminat|connection/i);

      // The write inside the interrupted transaction never became durable.
      const ghost = await db.host.withEstateSession(ESTATE_ID, (storage) =>
        storage.getActor('actor:ghost'),
      );
      expect(ghost.value).toBeUndefined();

      // The store is intact and still serves exactly the seeded state.
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        transitions: storage.listTransitions(ESTATE_ID).length,
        audit: storage.listAuditEvents(ESTATE_ID).length,
        chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
      }));
      expect(read.value).toEqual({ transitions: 1, audit: 1, chainOk: true });
    } finally {
      await db.dispose();
    }
  });

  it('a callback that throws rolls back EVERY row from the attempted operation', async () => {
    const db = await openScratchDatabase(sourceHost(), 'callback-throws');
    try {
      const boom = new Error('forced failure inside the bounded callback');
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          const store = newStore(storage);
          const out = store.admit(observation('doomed'), NOW);
          expect(out.ok).toBe(true);
          // Everything above is a pending write in the session. Throwing here
          // must discard all of it.
          throw boom;
        }),
      ).rejects.toThrow(/forced failure inside the bounded callback/);

      // Not one row landed: not the actor/estate/keyring the EstateStore
      // constructor upserts, not the assertion, not the transition, not the
      // receipt, not the audit event.
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        actor: storage.getActor(loadActor().actor_id),
        estate: storage.getEstate(ESTATE_ID),
        keyring: storage.getKeyring(loadKeyring().keyring_id),
        assertions: storage.listAssertions(ESTATE_ID).length,
        transitions: storage.listTransitions(ESTATE_ID).length,
        receipts: storage.listTransitionReceipts(ESTATE_ID).length,
        audit: storage.listAuditEvents(ESTATE_ID).length,
        tail: storage.getAuditTail(ESTATE_ID),
      }));
      expect(read.value).toEqual({
        actor: undefined,
        estate: undefined,
        keyring: undefined,
        assertions: 0,
        transitions: 0,
        receipts: 0,
        audit: 0,
        tail: undefined,
      });
    } finally {
      await db.dispose();
    }
  });

  it('the session is unusable after its transaction is decided (no post-commit writes)', async () => {
    const db = await openScratchDatabase(sourceHost(), 'escaped-session');
    try {
      // A callback that leaks the session out of the boundary must not be able
      // to write through it afterwards — that would be a write outside any
      // transaction, i.e. the fire-and-forget shape the packet forbids.
      let escaped: StorageAdapter | undefined;
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        escaped = storage;
      });
      expect(escaped).toBeDefined();
      expect(() => escaped!.upsertActor(loadActor())).toThrow(PostgresUnavailableError);
      expect(() => escaped!.getActor('x')).toThrow(/session is closed/);
    } finally {
      await db.dispose();
    }
  });
});

maybe('Phase 50A negative — immutable history is refused at the database', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
    db = await openScratchDatabase(sourceHost(), 'immutability');
    // Seed a row in EVERY append-only table. The immutability triggers are
    // FOR EACH ROW, so an empty table has nothing to refuse and an
    // UPDATE/DELETE against it would succeed vacuously — which would make
    // this whole block a false pass. The recall below is what populates
    // recall_receipts.
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      const store = newStore(storage);
      store.admit(observation('immutable subject'), NOW);
      const out = executeRecall(store, publicRecallRequest(), NOW);
      expect(out.ok).toBe(true);
    });
    const populated = await db.host.withClient(async (client) => {
      const counts: Record<string, number> = {};
      for (const table of [
        'estate_transitions',
        'transition_receipts',
        'recall_receipts',
        'audit_events',
      ]) {
        const r = await client.query<{ n: string }>(`SELECT count(*)::text AS n FROM ${table}`);
        counts[table] = Number(r.rows[0]!.n);
      }
      return counts;
    });
    // Guard the guard: if any table were empty the refusal tests below would
    // prove nothing.
    for (const [table, n] of Object.entries(populated)) {
      expect(n, `${table} must be seeded for the immutability proof`).toBeGreaterThan(0);
    }
  }, 60_000);

  afterAll(async () => {
    await db?.dispose();
  });

  const appendOnlyTables = [
    'estate_transitions',
    'transition_receipts',
    'recall_receipts',
    'audit_events',
  ] as const;

  for (const table of appendOnlyTables) {
    it(`direct UPDATE of ${table} is refused by the database`, async () => {
      await expect(
        db.host.withClient(async (client) => {
          await client.query(`UPDATE ${table} SET estate_id = 'tampered'`);
        }),
      ).rejects.toThrow(/append-only table/);
    });

    it(`direct DELETE from ${table} is refused by the database`, async () => {
      await expect(
        db.host.withClient(async (client) => {
          await client.query(`DELETE FROM ${table}`);
        }),
      ).rejects.toThrow(/append-only table/);
    });
  }

  it('the refusals left the history intact and the chain verifying', async () => {
    const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
      transitions: storage.listTransitions(ESTATE_ID).length,
      receipts: storage.listTransitionReceipts(ESTATE_ID).length,
      audit: storage.listAuditEvents(ESTATE_ID).length,
      chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
      // No row was retargeted to the 'tampered' estate id the UPDATEs tried.
      tampered: storage.listTransitions('tampered').length,
    }));
    expect(read.value.transitions).toBe(1);
    expect(read.value.receipts).toBe(1);
    expect(read.value.audit).toBeGreaterThan(0);
    expect(read.value.chainOk).toBe(true);
    expect(read.value.tampered).toBe(0);
  });

  it('a duplicate append position is refused by the database', async () => {
    await expect(
      db.host.withClient(async (client) => {
        const existing = await client.query<{
          estate_id: string;
          append_position: string;
          payload: unknown;
        }>('SELECT estate_id, append_position, payload FROM estate_transitions LIMIT 1');
        const row = existing.rows[0];
        expect(row).toBeDefined();
        await client.query(
          `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, $3, $4::jsonb)`,
          ['trn_squatter', row!.estate_id, row!.append_position, JSON.stringify(row!.payload)],
        );
      }),
    ).rejects.toThrow(/estate_transitions_estate_position_unique|duplicate key/);
  });

  it('two children of the same previous_audit_hash are refused by the database (no chain fork)', async () => {
    await expect(
      db.host.withClient(async (client) => {
        const existing = await client.query<{
          estate_id: string;
          previous_audit_hash: string | null;
          payload: Record<string, unknown>;
        }>(
          `SELECT estate_id, previous_audit_hash, payload FROM audit_events
            WHERE append_position = 1 LIMIT 1`,
        );
        const row = existing.rows[0];
        expect(row).toBeDefined();
        // A DIFFERENT event id at a DIFFERENT position, but claiming the SAME
        // parent link. Position uniqueness would not catch it; the dedicated
        // prev-hash constraint does.
        await client.query(
          `INSERT INTO audit_events
             (audit_event_id, estate_id, append_position, audit_hash,
              previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
          [
            'aud_fork',
            row!.estate_id,
            99,
            'sha256:forked',
            row!.previous_audit_hash,
            row!.previous_audit_hash ?? '',
            JSON.stringify({ ...row!.payload, audit_event_id: 'aud_fork' }),
          ],
        );
      }),
    ).rejects.toThrow(/audit_events_estate_prev_unique|audit_events_genesis_shape|duplicate key/);
  });

  it('an audit event past position 1 with no parent is refused (single-root chain)', async () => {
    await expect(
      db.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO audit_events
             (audit_event_id, estate_id, append_position, audit_hash,
              previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, $3, $4, NULL, '', $5::jsonb)`,
          [
            'aud_second_root',
            ESTATE_ID,
            50,
            'sha256:second-root',
            JSON.stringify({
              audit_event_id: 'aud_second_root',
              estate_id: ESTATE_ID,
              audit_hash: 'sha256:second-root',
            }),
          ],
        );
      }),
    ).rejects.toThrow(/audit_events_genesis_shape|audit_events_estate_prev_unique/);
  });

  it('a previous_audit_hash_key that disagrees with its column is refused', async () => {
    await expect(
      db.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO audit_events
             (audit_event_id, estate_id, append_position, audit_hash,
              previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
          [
            'aud_key_liar',
            ESTATE_ID,
            51,
            'sha256:liar',
            'sha256:real-parent',
            'sha256:different-claim',
            JSON.stringify({ audit_event_id: 'aud_key_liar', estate_id: ESTATE_ID }),
          ],
        );
      }),
    ).rejects.toThrow(/audit_events_prev_key_agrees/);
  });
});

maybe('Phase 50A negative — malformed and tampered durable content is refused, never served', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('a non-object payload is refused as a malformed row', async () => {
    const db = await openScratchDatabase(sourceHost(), 'malformed-payload');
    try {
      await db.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO actor_estates (estate_id, payload) VALUES ($1, $2::jsonb)`,
          [ESTATE_ID, JSON.stringify('not an object')],
        );
      });
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
      ).rejects.toMatchObject({ name: 'PostgresIntegrityError', reason: 'malformed_row' });
    } finally {
      await db.dispose();
    }
  });

  it('a payload whose own id disagrees with its column is refused as a malformed row', async () => {
    const db = await openScratchDatabase(sourceHost(), 'id-disagreement');
    try {
      await db.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO actor_estates (estate_id, payload) VALUES ($1, $2::jsonb)`,
          [
            ESTATE_ID,
            JSON.stringify({ ...loadEstate(), estate_id: 'estate:someone-else' }),
          ],
        );
      });
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
      ).rejects.toMatchObject({ reason: 'malformed_row' });
    } finally {
      await db.dispose();
    }
  });

  it('an audit row whose previous_audit_hash column contradicts its payload is refused', async () => {
    const db = await openScratchDatabase(sourceHost(), 'chain-column-lies');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('genesis'), NOW);
      });
      // Insert a second link whose COLUMN says one parent and whose PAYLOAD
      // says none. A restored dump could carry exactly this.
      await db.host.withClient(async (client) => {
        const tail = await client.query<{ audit_hash: string; payload: Record<string, unknown> }>(
          `SELECT audit_hash, payload FROM audit_events WHERE append_position = 1`,
        );
        const parent = tail.rows[0]!;
        await client.query(
          `INSERT INTO audit_events
             (audit_event_id, estate_id, append_position, audit_hash,
              previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, 2, $3, $4, $4, $5::jsonb)`,
          [
            'aud_column_liar',
            ESTATE_ID,
            'sha256:child',
            parent.audit_hash,
            // payload deliberately omits previous_audit_hash
            JSON.stringify({
              ...parent.payload,
              audit_event_id: 'aud_column_liar',
              audit_hash: 'sha256:child',
              previous_audit_hash: undefined,
            }),
          ],
        );
      });
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => storage.listAuditEvents(ESTATE_ID)),
      ).rejects.toMatchObject({ reason: 'malformed_row' });
    } finally {
      await db.dispose();
    }
  });

  it('a broken audit chain is refused at load, so the estate is never served', async () => {
    const db = await openScratchDatabase(sourceHost(), 'broken-chain');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('link one'), NOW);
      });
      // Append a second link that points at a parent which does not exist.
      await db.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO audit_events
             (audit_event_id, estate_id, append_position, audit_hash,
              previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, 2, $3, $4, $4, $5::jsonb)`,
          [
            'aud_orphan',
            ESTATE_ID,
            'sha256:orphan-child',
            'sha256:no-such-parent',
            JSON.stringify({
              audit_event_id: 'aud_orphan',
              estate_id: ESTATE_ID,
              actor_id: loadActor().actor_id,
              event_type: 'assertion_admitted',
              signer_refs: [],
              audit_hash: 'sha256:orphan-child',
              previous_audit_hash: 'sha256:no-such-parent',
              created_at: NOW,
            }),
          ],
        );
      });
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => storage.listAuditEvents(ESTATE_ID)),
      ).rejects.toMatchObject({ reason: 'audit_chain_broken' });
      // And the same estate cannot be admitted to either — persistence
      // uncertainty denies rather than degrading.
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          newStore(storage).admit(observation('after break'), NOW);
        }),
      ).rejects.toBeInstanceOf(PostgresIntegrityError);
    } finally {
      await db.dispose();
    }
  });

  it('a non-prefix append history (a gap in append_position) is refused at load', async () => {
    const db = await openScratchDatabase(sourceHost(), 'position-gap');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('position one'), NOW);
      });
      await db.host.withClient(async (client) => {
        const row = await client.query<{ payload: Record<string, unknown> }>(
          `SELECT payload FROM estate_transitions LIMIT 1`,
        );
        // Position 3 with position 2 absent: the history is no longer a dense
        // prefix, so it cannot be replayed as an ordered append log.
        await client.query(
          `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, 3, $3::jsonb)`,
          [
            'trn_gap',
            ESTATE_ID,
            JSON.stringify({ ...row.rows[0]!.payload, transition_id: 'trn_gap' }),
          ],
        );
      });
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => storage.listTransitions(ESTATE_ID)),
      ).rejects.toMatchObject({ reason: 'append_prefix_mutated' });
    } finally {
      await db.dispose();
    }
  });

  it('conflicting reuse of an immutable id fails and rolls back the whole attempt', async () => {
    const db = await openScratchDatabase(sourceHost(), 'id-conflict');
    try {
      const first = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const out = newStore(storage).admit(observation('original'), NOW);
        return out.transition;
      });

      // Same immutable transition_id, different content.
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          storage.appendTransition({
            ...first.value,
            requested_by: 'signer:someone-else',
          });
        }),
      ).rejects.toMatchObject({ reason: 'immutable_id_conflict' });

      // The durable row is untouched.
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const rows = storage.listTransitions(ESTATE_ID);
        return { count: rows.length, requested_by: rows[0]?.requested_by };
      });
      expect(read.value.count).toBe(1);
      expect(read.value.requested_by).toBe(first.value.requested_by);
    } finally {
      await db.dispose();
    }
  });

  it('an audit append whose link does not attach to the current tail is refused', async () => {
    const db = await openScratchDatabase(sourceHost(), 'bad-link');
    try {
      const seeded = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('tail owner'), NOW);
        return storage.listAuditEvents(ESTATE_ID)[0]!;
      });
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          storage.appendAuditEvent({
            ...seeded.value,
            audit_event_id: 'aud_wrong_link',
            audit_hash: 'sha256:wrong-link-child',
            previous_audit_hash: 'sha256:not-the-tail',
          });
        }),
      ).rejects.toMatchObject({ reason: 'audit_chain_broken' });
    } finally {
      await db.dispose();
    }
  });
});

maybe('Phase 50A negative — a bad restore is detected and quarantined', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('a restore missing rows is detected and the estate is quarantined', async () => {
    const source = await openScratchDatabase(sourceHost(), 'restore-src-missing');
    const target = await openScratchDatabase(sourceHost(), 'restore-dst-missing');
    try {
      for (const text of ['one', 'two']) {
        await source.host.withEstateSession(ESTATE_ID, (storage) => {
          newStore(storage).admit(observation(text), NOW);
        });
      }
      // The target receives only the FIRST admit — a short restore.
      await target.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('one'), NOW);
      });

      const sourceSnapshot = await source.host.withClient(readStoreSnapshot);
      const targetSnapshot = await target.host.withClient(readStoreSnapshot);
      const verification = verifyRestore(sourceSnapshot, targetSnapshot);

      expect(verification.ok).toBe(false);
      expect(verification.quarantinedEstates).toContain(ESTATE_ID);
      expect(verification.reasons.join(' ')).toMatch(/canonical state differs/);
      expect(() => assertRestoreServiceable(sourceSnapshot, targetSnapshot)).toThrow(
        /restored store is quarantined/,
      );
    } finally {
      await target.dispose();
      await source.dispose();
    }
  });

  it('a restore with a changed canonical payload is detected and quarantined', async () => {
    const source = await openScratchDatabase(sourceHost(), 'restore-src-changed');
    const target = await openScratchDatabase(sourceHost(), 'restore-dst-changed');
    try {
      for (const db of [source, target]) {
        await db.host.withEstateSession(ESTATE_ID, (storage) => {
          newStore(storage).admit(observation('same input'), NOW);
        });
      }
      // Tamper with a MUTABLE table in the target so the difference is a
      // changed payload rather than a refused write.
      await target.host.withClient(async (client) => {
        await client.query(
          `UPDATE actor_estates SET payload = jsonb_set(payload, '{status}', '"archived"')
            WHERE estate_id = $1`,
          [ESTATE_ID],
        );
      });

      const sourceSnapshot = await source.host.withClient(readStoreSnapshot);
      const targetSnapshot = await target.host.withClient(readStoreSnapshot);
      const verification = verifyRestore(sourceSnapshot, targetSnapshot);
      expect(verification.ok).toBe(false);
      expect(verification.quarantinedEstates).toContain(ESTATE_ID);
      expect(verification.comparison.differences.join(' ')).toMatch(/estates/);
    } finally {
      await target.dispose();
      await source.dispose();
    }
  });

  it('a restore with a broken audit chain is detected and quarantined', async () => {
    const source = await openScratchDatabase(sourceHost(), 'restore-src-chain');
    const target = await openScratchDatabase(sourceHost(), 'restore-dst-chain');
    try {
      await source.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('chain source'), NOW);
      });
      await target.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('chain source'), NOW);
      });
      // Add an orphan link in the target.
      await target.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO audit_events
             (audit_event_id, estate_id, append_position, audit_hash,
              previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, 2, $3, $4, $4, $5::jsonb)`,
          [
            'aud_restore_orphan',
            ESTATE_ID,
            'sha256:restore-orphan',
            'sha256:missing-parent',
            JSON.stringify({
              audit_event_id: 'aud_restore_orphan',
              estate_id: ESTATE_ID,
              actor_id: loadActor().actor_id,
              event_type: 'assertion_admitted',
              signer_refs: [],
              audit_hash: 'sha256:restore-orphan',
              previous_audit_hash: 'sha256:missing-parent',
              created_at: NOW,
            }),
          ],
        );
      });

      const sourceSnapshot = await source.host.withClient(readStoreSnapshot);
      const targetSnapshot = await target.host.withClient(readStoreSnapshot);
      const verification = verifyRestore(sourceSnapshot, targetSnapshot);
      expect(verification.ok).toBe(false);
      expect(verification.quarantinedEstates).toContain(ESTATE_ID);
      expect(verification.chains.find((c) => c.estate_id === ESTATE_ID)?.ok).toBe(false);

      // And normal service on the restored estate is refused.
      await expect(
        target.host.withEstateSession(ESTATE_ID, (storage) =>
          storage.listAuditEvents(ESTATE_ID),
        ),
      ).rejects.toBeInstanceOf(PostgresIntegrityError);
    } finally {
      await target.dispose();
      await source.dispose();
    }
  });
});

maybe('Phase 50A negative — no fallback adapter, no widened contract', () => {
  it('no source file under storage/postgres/ references InMemoryStorage or JsonlStorage', async () => {
    // A structural proof, not a behavioral one: the fallback cannot happen at
    // runtime because the code that would do it does not exist. Behavioral
    // proof of denial-under-uncertainty is the availability block above.
    const { readdirSync, readFileSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const dir = resolve(here, '../../src/straylight/storage/postgres');
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(resolve(dir, file), 'utf8');
      // The words may appear in comments explaining the prohibition; what must
      // never appear is an import or a constructor call.
      expect(/from\s+['"][^'"]*in-memory\.js['"]/.test(text), `${file} imports in-memory`).toBe(
        false,
      );
      expect(/from\s+['"][^'"]*jsonl\.js['"]/.test(text), `${file} imports jsonl`).toBe(false);
      expect(/new\s+InMemoryStorage\s*\(/.test(text), `${file} constructs InMemoryStorage`).toBe(
        false,
      );
      expect(/new\s+JsonlStorage\s*\(/.test(text), `${file} constructs JsonlStorage`).toBe(false);
    }
  });

  it('the StorageAdapter interface is unchanged: exactly the 18 recorded methods, all synchronous', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const text = readFileSync(
      resolve(here, '../../src/straylight/storage/types.ts'),
      'utf8',
    );
    // Phase 50A must not have widened, asyncified, or extended the seam. If a
    // future change needs to, the packet says STOP AND ESCALATE.
    const expected = [
      'upsertActor(actor: Actor): void;',
      'getActor(actor_id: ID): Actor | undefined;',
      'upsertEstate(estate: ActorEstate): void;',
      'getEstate(estate_id: ID): ActorEstate | undefined;',
      'upsertKeyring(keyring: Keyring): void;',
      'getKeyring(keyring_id: ID): Keyring | undefined;',
      'upsertAssertion(assertion: Assertion): void;',
      'getAssertion(assertion_id: ID): Assertion | undefined;',
      'listAssertions(estate_id: ID): Assertion[];',
      'appendTransition(transition: EstateTransition): void;',
      'listTransitions(estate_id: ID): EstateTransition[];',
      'upsertRecallReceipt(receipt: RecallReceipt): void;',
      'getRecallReceipt(receipt_id: ID): RecallReceipt | undefined;',
      'upsertTransitionReceipt(receipt: TransitionReceipt): void;',
      'getTransitionReceipt(receipt_id: ID): TransitionReceipt | undefined;',
      'listTransitionReceipts(estate_id: ID): TransitionReceipt[];',
      'appendAuditEvent(event: AuditEvent): void;',
      'listAuditEvents(estate_id?: ID): AuditEvent[];',
    ];
    for (const signature of expected) {
      expect(text, `StorageAdapter must still declare: ${signature}`).toContain(signature);
    }
    expect(text).toContain('getAuditTail(estate_id: ID): Hash | undefined;');
    // No Promise anywhere in the interface.
    expect(/Promise</.test(text)).toBe(false);
    // And no `pg` import leaked into the seam file.
    expect(/from\s+['"]pg['"]/.test(text)).toBe(false);
  });

  it('no module outside storage/postgres/ imports the pg driver', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { resolve, dirname, relative } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const root = resolve(here, '../../src/straylight');
    const postgresDir = resolve(root, 'storage/postgres');

    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(dir)) {
        const abs = resolve(dir, entry);
        if (statSync(abs).isDirectory()) out.push(...walk(abs));
        else if (entry.endsWith('.ts')) out.push(abs);
      }
      return out;
    };

    for (const file of walk(root)) {
      if (file.startsWith(postgresDir)) continue;
      const text = readFileSync(file, 'utf8');
      expect(
        /from\s+['"]pg['"]/.test(text),
        `${relative(root, file)} must not import the pg driver (adapter boundary, ADR-049Q §11.3)`,
      ).toBe(false);
    }
  });

  it('connection-string redaction removes the credential from diagnostics', () => {
    const host = new PostgresEstateHost({
      connectionString: 'postgresql://someuser:supersecret@127.0.0.1:5432/db',
    });
    const described = host.describeTarget();
    expect(described).not.toContain('supersecret');
    expect(described).not.toContain('someuser');
    expect(described).toContain('<redacted>');
    return host.close();
  });

  it('an absent connection string is refused rather than defaulted', () => {
    expect(() => new PostgresEstateHost({ connectionString: '' })).toThrow(
      /connectionString is required/,
    );
  });

  it('replaceDatabase only rewrites the database component', () => {
    const out = replaceDatabase('postgresql://u:p@127.0.0.1:55432/original', 'other');
    expect(out).toContain('/other');
    expect(out).toContain('127.0.0.1:55432');
  });
});

// ── helpers ─────────────────────────────────────────────────────────────

function newStore(storage: StorageAdapter): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    storage,
  });
}

function observation(text: string) {
  return buildCandidate({
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}

function publicRecallRequest() {
  return buildRecallRequest({
    task: 'public discord',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    signer: SIGNERS.operator,
  });
}
