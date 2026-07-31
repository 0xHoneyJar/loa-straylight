// Phase 50A — concurrency and isolation.
//
// ADR-049Q §13.1(h); P-12. The JSONL adapter records "Multi-process safety:
// NOT GUARANTEED. The MVP assumes a single writer"
// (`src/straylight/storage/jsonl.ts:15`-`:20`). P-12 forbids inheriting that
// as an assumption: single-writer-equivalent ordering must be RE-ESTABLISHED
// on the new host, and proven, without altering P-3 semantics.
//
// Every test here runs GENUINELY CONCURRENT operations (started together, not
// awaited in sequence) and then proves the durable outcome:
//
//   * no lost update — every accepted operation is present;
//   * no duplicate append position — positions stay a dense sequence;
//   * no chain fork — one child per chain tail, chain verifies;
//   * no silent drop — a refused operation FAILED LOUDLY, it did not vanish;
//   * different estates never contend and never leak into each other.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { EstateStore, type StorageAdapter } from '../../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../../fixtures/index.js';
import {
  PostgresEstateHost,
  PostgresIntegrityError,
} from '../../src/straylight/storage/postgres/index.js';
import {
  openScratchDatabase,
  phase50aEnabled,
  phase50aGateReport,
  requireReachable,
  sourceHost,
  type ScratchDatabase,
} from './_support.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
/** Absolute specifier the child process imports the store from. */
const HOST_MODULE = resolve(ROOT, 'src/straylight/storage/postgres/index.ts');

const NOW = '2026-05-05T12:00:00Z';
const ESTATE_ID = loadEstate().estate_id;
const OTHER_ESTATE_ID = 'estate:phase-50a-second';
/** The estate the child process holds in the cross-process lock regressions. */
const HELD_ESTATE_ID = ESTATE_ID;
/** How long the child holds its synchronous callback. */
const HOLD_MS = 4_000;
/**
 * The unrelated estate's statement timeout. Deliberately far below `HOLD_MS`:
 * under the defect the ledger's ACCESS EXCLUSIVE lock outlasted this and the
 * unrelated estate failed with `transaction_aborted`.
 */
const SHORT_STATEMENT_TIMEOUT_MS = 500;
/**
 * The bound for "reached its callback promptly". Well under both `HOLD_MS` (so
 * the assertion cannot be satisfied by the hold simply ending) and generous
 * enough that a loaded runner does not make it flaky.
 */
const PROMPT_MS = 1_500;

phase50aGateReport('postgres-concurrency');

const maybe = phase50aEnabled() ? describe : describe.skip;

maybe('Phase 50A concurrency — same-estate operations serialize', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('two concurrent same-estate admits both land, with no lost update, duplicate position, or fork', async () => {
    const db = await openScratchDatabase(sourceHost(), 'concurrent-admits');
    try {
      // Bootstrap the estate row so both racers contend on the SAME row lock.
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage);
      });

      // Started together: the second `withEstateSession` begins before the
      // first resolves, so they genuinely overlap and the store — not the test
      // — must impose an order.
      const [a, b] = await Promise.all([
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          const out = newStore(storage).admit(observation('racer A'), NOW);
          return out.assertion!.assertion_id;
        }),
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          const out = newStore(storage).admit(observation('racer B'), NOW);
          return out.assertion!.assertion_id;
        }),
      ]);
      expect(a.committed).toBe(true);
      expect(b.committed).toBe(true);
      expect(a.value).not.toBe(b.value);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        return {
          assertionIds: storage.listAssertions(ESTATE_ID).map((x) => x.assertion_id).sort(),
          transitions: storage.listTransitions(ESTATE_ID).length,
          receipts: storage.listTransitionReceipts(ESTATE_ID).length,
          audit: storage.listAuditEvents(ESTATE_ID),
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });

      // No lost update: BOTH admits are durable.
      expect(read.value.assertionIds).toEqual([a.value, b.value].sort());
      expect(read.value.transitions).toBe(2);
      expect(read.value.receipts).toBe(2);
      // Single-writer-equivalent ordering: the chain is a straight line of
      // exactly two links, each pointing at its predecessor.
      expect(read.value.audit).toHaveLength(2);
      expect(read.value.audit[0]?.previous_audit_hash).toBeUndefined();
      expect(read.value.audit[1]?.previous_audit_hash).toBe(read.value.audit[0]?.audit_hash);
      expect(read.value.chainOk).toBe(true);

      // No duplicate append position anywhere.
      await expectDensePositions(db, ESTATE_ID, {
        estate_transitions: 2,
        transition_receipts: 2,
        audit_events: 2,
      });
    } finally {
      await db.dispose();
    }
  });

  it('eight concurrent same-estate admits produce a dense, forkless chain of eight', async () => {
    const db = await openScratchDatabase(sourceHost(), 'concurrent-eight');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage);
      });

      const count = 8;
      const results = await Promise.all(
        Array.from({ length: count }, (_unused, i) =>
          db.host.withEstateSession(ESTATE_ID, (storage) => {
            const out = newStore(storage).admit(observation(`racer ${i}`), NOW);
            return out.assertion!.assertion_id;
          }),
        ),
      );
      // Every operation committed; none was silently dropped.
      expect(results).toHaveLength(count);
      for (const r of results) expect(r.committed).toBe(true);
      const ids = new Set(results.map((r) => r.value));
      expect(ids.size).toBe(count);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        const audit = storage.listAuditEvents(ESTATE_ID);
        return {
          assertions: storage.listAssertions(ESTATE_ID).length,
          transitions: storage.listTransitions(ESTATE_ID).length,
          audit,
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
          parents: audit.map((e) => e.previous_audit_hash ?? null),
        };
      });
      expect(read.value.assertions).toBe(count);
      expect(read.value.transitions).toBe(count);
      expect(read.value.audit).toHaveLength(count);
      expect(read.value.chainOk).toBe(true);
      // No fork: every parent link is distinct, and the chain is a line.
      expect(new Set(read.value.parents).size).toBe(count);
      for (let i = 1; i < read.value.audit.length; i++) {
        expect(read.value.audit[i]?.previous_audit_hash).toBe(
          read.value.audit[i - 1]?.audit_hash,
        );
      }

      await expectDensePositions(db, ESTATE_ID, {
        estate_transitions: count,
        transition_receipts: count,
        audit_events: count,
      });
    } finally {
      await db.dispose();
    }
  });

  it('concurrent bootstrap of the SAME new estate serializes (advisory lock, no estate row yet)', async () => {
    const db = await openScratchDatabase(sourceHost(), 'concurrent-bootstrap');
    try {
      // No estate row exists, so there is nothing to lock FOR UPDATE. The
      // advisory lock is what serializes these; without it both would load an
      // empty snapshot and both would write a genesis audit link, forking the
      // chain at position 1.
      const results = await Promise.all(
        Array.from({ length: 4 }, (_unused, i) =>
          db.host.withEstateSession(ESTATE_ID, (storage) => {
            const out = newStore(storage).admit(observation(`bootstrap ${i}`), NOW);
            return out.assertion!.assertion_id;
          }),
        ),
      );
      for (const r of results) expect(r.committed).toBe(true);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        const audit = storage.listAuditEvents(ESTATE_ID);
        return {
          audit: audit.length,
          genesisLinks: audit.filter((e) => e.previous_audit_hash === undefined).length,
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });
      expect(read.value.audit).toBe(4);
      // EXACTLY ONE genesis link. Two would be the fork the advisory lock
      // exists to prevent.
      expect(read.value.genesisLinks).toBe(1);
      expect(read.value.chainOk).toBe(true);
    } finally {
      await db.dispose();
    }
  });

  it('a stale snapshot cannot append onto a moved prefix: it fails loudly, never silently', async () => {
    const db = await openScratchDatabase(sourceHost(), 'stale-prefix');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('first'), NOW);
      });

      // Capture a transition built against the CURRENT tail, then advance the
      // chain, then try to write the stale record. Its previous_audit_hash no
      // longer matches the tail, so it must be refused rather than appended in
      // a way that silently forks or overwrites.
      const stale = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const events = storage.listAuditEvents(ESTATE_ID);
        return events[events.length - 1]!;
      });

      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('second'), NOW);
      });

      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          storage.appendAuditEvent({
            ...stale.value,
            audit_event_id: 'aud_stale_child',
            audit_hash: 'sha256:stale-child',
            previous_audit_hash: stale.value.audit_hash,
          });
        }),
      ).rejects.toBeInstanceOf(PostgresIntegrityError);

      // The refusal was loud AND left the store exactly as it was.
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        return {
          audit: storage.listAuditEvents(ESTATE_ID).length,
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });
      expect(read.value.audit).toBe(2);
      expect(read.value.chainOk).toBe(true);
    } finally {
      await db.dispose();
    }
  });
});

maybe('Phase 50A isolation — different estates do not contend or leak', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('concurrent operations on different estates do not cross-contaminate state', async () => {
    const db = await openScratchDatabase(sourceHost(), 'cross-estate');
    try {
      const [a, b] = await Promise.all([
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          const out = newStore(storage).admit(observation('estate one'), NOW);
          return out.assertion!.assertion_id;
        }),
        db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => {
          const out = newOtherStore(storage).admit(otherObservation('estate two'), NOW);
          return out.assertion!.assertion_id;
        }),
      ]);
      expect(a.committed).toBe(true);
      expect(b.committed).toBe(true);

      // Each estate sees ONLY its own rows — the snapshot is estate-scoped, so
      // even the global `listAuditEvents()` form cannot reach across.
      const first = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        assertions: storage.listAssertions(ESTATE_ID).map((x) => x.assertion_id),
        foreignAssertions: storage.listAssertions(OTHER_ESTATE_ID),
        audit: storage.listAuditEvents(ESTATE_ID).length,
        globalAudit: storage.listAuditEvents().length,
        foreignEstate: storage.getEstate(OTHER_ESTATE_ID),
      }));
      expect(first.value.assertions).toEqual([a.value]);
      expect(first.value.foreignAssertions).toEqual([]);
      expect(first.value.audit).toBe(1);
      expect(first.value.globalAudit).toBe(1);
      expect(first.value.foreignEstate).toBeUndefined();

      const second = await db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => ({
        assertions: storage.listAssertions(OTHER_ESTATE_ID).map((x) => x.assertion_id),
        foreignAssertions: storage.listAssertions(ESTATE_ID),
        audit: storage.listAuditEvents(OTHER_ESTATE_ID).length,
        globalAudit: storage.listAuditEvents().length,
        foreignEstate: storage.getEstate(ESTATE_ID),
      }));
      expect(second.value.assertions).toEqual([b.value]);
      expect(second.value.foreignAssertions).toEqual([]);
      expect(second.value.audit).toBe(1);
      expect(second.value.globalAudit).toBe(1);
      expect(second.value.foreignEstate).toBeUndefined();
    } finally {
      await db.dispose();
    }
  });

  // ── patch cycle 2, finding 2 — no cross-estate relation-lock coupling ──
  //
  // The defect Codex found by direct probe: `assertSchemaVersion` ran ledger
  // DDL (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT
  // EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP`/`CREATE TRIGGER`) inside every
  // estate transaction, BEFORE the per-estate locks. DDL takes an ACCESS
  // EXCLUSIVE lock on the ledger relation that is held until the transaction
  // ends — i.e. until the estate's synchronous callback returns and the
  // transaction commits. Two sessions on COMPLETELY DIFFERENT estates therefore
  // contended on the ledger: with estate A's callback held for 4000 ms, estate
  // B waited on `Lock/relation` and, with a short statement timeout, failed
  // outright with `transaction_aborted: canceling statement due to statement
  // timeout`.
  //
  // The correction moves all ledger DDL to the migration/initialization path and
  // makes steady-state verification strictly read-only.
  //
  // ── why this test uses a CHILD PROCESS ─────────────────────────────────
  //
  // `withEstateSession`'s callback is SYNCHRONOUS by contract, and holding it
  // open means blocking. In ONE process that blocks the event loop, so the
  // second session could not even issue its first statement and the test would
  // pass for the wrong reason — it would prove nothing about database locks. So
  // estate A is held in a genuinely separate OS process with its own connection,
  // and estate B runs here. That is also exactly the shape of the auditor's
  // reproduction.
  it('an unrelated estate reaches its callback promptly while another estate holds one (cross-process)', async () => {
    const db = await openScratchDatabase(sourceHost(), 'cross-estate-locks');
    const holder = holdEstateInChildProcess(db.connectionString, HELD_ESTATE_ID, HOLD_MS);
    try {
      // Wait until the child is genuinely INSIDE its callback — so its estate
      // transaction is open and, under the defect, its ledger DDL lock is held.
      await holder.callbackEntered;

      // Estate B: a DIFFERENT estate, its own connection, and a SHORT statement
      // timeout. Under the defect this timed out at ~500 ms; correct behaviour
      // reaches the callback immediately.
      const strict = new PostgresEstateHost({
        connectionString: db.connectionString,
        statementTimeoutMs: SHORT_STATEMENT_TIMEOUT_MS,
      });
      let enteredAfterMs = -1;
      try {
        const started = Date.now();
        const out = await strict.withEstateSession(OTHER_ESTATE_ID, (storage) => {
          enteredAfterMs = Date.now() - started;
          return newOtherStore(storage).admit(otherObservation('unblocked'), NOW).ok;
        });
        expect(out.value).toBe(true);
        expect(out.committed).toBe(true);
      } finally {
        await strict.close();
      }

      // Reached its callback PROMPTLY: no relation-lock wait, no timeout. The
      // bound is far below the hold, so this cannot pass by the hold expiring —
      // and it is generous enough not to be flaky on a loaded runner.
      expect(enteredAfterMs).toBeGreaterThanOrEqual(0);
      expect(enteredAfterMs).toBeLessThan(PROMPT_MS);

      // The holder was still holding while B committed, so B genuinely
      // overlapped it rather than following it.
      expect(await holder.stillHolding()).toBe(true);

      // No `Lock/relation` wait was recorded for the ledger at any point.
      const waits = await db.host.withClient(async (client) => {
        const r = await client.query<{ n: string }>(
          `SELECT count(*)::text AS n FROM pg_stat_activity
            WHERE wait_event_type = 'Lock' AND datname = current_database()`,
        );
        return Number(r.rows[0]?.n ?? '-1');
      });
      expect(waits).toBe(0);

      // The holder still completes successfully — B did not disturb it.
      const held = await holder.result;
      expect(held.committed, held.output).toBe(true);
    } finally {
      await holder.dispose();
      await db.dispose();
    }
  }, 60_000);

  it('per-estate serialization is PRESERVED: same-estate sessions still queue behind each other', async () => {
    // The finding-2 correction must not have loosened same-estate ordering into
    // the cross-estate concurrency it enabled. Estate A is held in a child
    // process; a second session on THAT SAME estate must NOT reach its callback
    // while the hold lasts.
    const db = await openScratchDatabase(sourceHost(), 'same-estate-serialize');
    const holder = holdEstateInChildProcess(db.connectionString, HELD_ESTATE_ID, HOLD_MS);
    try {
      await holder.callbackEntered;

      const started = Date.now();
      const out = await db.host.withEstateSession(HELD_ESTATE_ID, () => Date.now() - started);
      const enteredAfterMs = out.value;

      // It DID eventually run (no deadlock, no silent drop) but only after the
      // holder's transaction released the estate — so the per-estate mutex is
      // intact. The wait is asserted against `PROMPT_MS`, the same bound the
      // cross-estate test requires an UNRELATED estate to stay under: same
      // estate waits, different estate does not. That contrast is the point.
      expect(out.committed).toBe(true);
      expect(enteredAfterMs).toBeGreaterThan(PROMPT_MS);

      const held = await holder.result;
      expect(held.committed, held.output).toBe(true);
    } finally {
      await holder.dispose();
      await db.dispose();
    }
  }, 60_000);

  it('each estate keeps its OWN independent chain and append positions', async () => {
    const db = await openScratchDatabase(sourceHost(), 'independent-chains');
    try {
      // Interleave writes across two estates so their positions would collide
      // if positions were global rather than per-estate.
      for (let i = 0; i < 3; i++) {
        await Promise.all([
          db.host.withEstateSession(ESTATE_ID, (storage) => {
            newStore(storage).admit(observation(`one-${i}`), NOW);
          }),
          db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => {
            newOtherStore(storage).admit(otherObservation(`two-${i}`), NOW);
          }),
        ]);
      }

      for (const estate of [ESTATE_ID, OTHER_ESTATE_ID]) {
        const read = await db.host.withEstateSession(estate, (storage) => {
          const store = EstateStore.fromStorage(storage, estate)!;
          return {
            audit: storage.listAuditEvents(estate).length,
            chainOk: store.auditLog.verifyChain(estate).ok,
          };
        });
        expect(read.value.audit, `${estate} audit length`).toBe(3);
        expect(read.value.chainOk, `${estate} chain`).toBe(true);
        // Both estates independently start at position 1 and run to 3.
        await expectDensePositions(db, estate, {
          estate_transitions: 3,
          transition_receipts: 3,
          audit_events: 3,
        });
      }
    } finally {
      await db.dispose();
    }
  });
});

// ── helpers ─────────────────────────────────────────────────────────────

/**
 * Run ONE estate session in a separate OS process and hold its synchronous
 * callback open for `holdMs`.
 *
 * A separate process is required, not a convenience: the callback contract is
 * synchronous, so "holding" it means blocking, and blocking the test's own event
 * loop would stop the second session from issuing any statement at all — the
 * assertion would then pass without testing a database lock. The child gets its
 * own connection and its own pool, so the only thing the two sessions can
 * possibly share is server-side locking, which is exactly what is under test.
 *
 * The child prints one line when it ENTERS the callback and one when it
 * finishes, so the parent can synchronize on the hold actually being in effect
 * rather than on a sleep.
 */
function holdEstateInChildProcess(
  connectionString: string,
  estate_id: string,
  holdMs: number,
): EstateHolder {
  const dir = mkdtempSync(join(tmpdir(), 'p50a-hold-'));
  const script = join(dir, 'hold-estate.ts');
  // The child imports the store by absolute path and takes every parameter from
  // its environment, so no value is interpolated into the source it runs.
  writeFileSync(
    script,
    [
      `import { PostgresEstateHost } from ${JSON.stringify(HOST_MODULE)};`,
      'const host = new PostgresEstateHost({',
      "  connectionString: process.env['P50A_CONN'],",
      // No statement timeout in the holder: the hold itself must not be cut
      // short by one, or the test would measure the timeout, not the lock.
      '  statementTimeoutMs: 0,',
      '});',
      'try {',
      "  const out = await host.withEstateSession(process.env['P50A_ESTATE'], () => {",
      "    process.stdout.write('CALLBACK_ENTERED\\n');",
      "    const until = Date.now() + Number(process.env['P50A_HOLD_MS']);",
      '    while (Date.now() < until) { /* hold the transaction open */ }',
      "    return 'held';",
      '  });',
      "  process.stdout.write(`DONE committed=${out.committed}\\n`);",
      '} catch (err) {',
      '  process.stdout.write(`FAILED ${err && err.message}\\n`);',
      '  process.exitCode = 1;',
      '} finally {',
      '  await host.close();',
      '}',
      '',
    ].join('\n'),
  );

  const child = spawn('npx', ['vite-node', script], {
    cwd: ROOT,
    env: {
      ...process.env,
      P50A_CONN: connectionString,
      P50A_ESTATE: estate_id,
      P50A_HOLD_MS: String(holdMs),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  let output = '';
  let entered = false;
  let finished = false;
  let signalEntered: () => void;
  const callbackEntered = new Promise<void>((resolve, reject) => {
    signalEntered = resolve;
    // A child that dies before entering its callback must fail the test loudly
    // rather than leave the parent awaiting forever.
    child.on('exit', () => {
      if (!entered) reject(new Error(`holder exited before entering its callback:\n${output}`));
    });
    child.on('error', (err) => reject(err));
  });
  const collect = (chunk: Buffer): void => {
    output += chunk.toString();
    if (!entered && output.includes('CALLBACK_ENTERED')) {
      entered = true;
      signalEntered();
    }
  };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);

  const result = new Promise<{ committed: boolean; output: string }>((resolve) => {
    child.on('exit', () => {
      finished = true;
      resolve({ committed: /DONE committed=true/.test(output), output });
    });
  });

  return {
    callbackEntered,
    result,
    stillHolding: async () => entered && !finished,
    dispose: async () => {
      if (!finished) child.kill('SIGKILL');
      await result.catch(() => undefined);
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

interface EstateHolder {
  /** Resolves once the child is genuinely inside its synchronous callback. */
  callbackEntered: Promise<void>;
  /** Resolves when the child exits, with its commit outcome and full output. */
  result: Promise<{ committed: boolean; output: string }>;
  /** True while the child has entered its callback and has not yet exited. */
  stillHolding: () => Promise<boolean>;
  dispose: () => Promise<void>;
}

/**
 * Assert each named table holds exactly `expected` rows for the estate, at
 * positions 1..expected with no gap and no duplicate. Reads the raw columns,
 * so it checks the DURABLE positions rather than the adapter's view of them.
 */
async function expectDensePositions(
  db: ScratchDatabase,
  estate_id: string,
  expected: Record<string, number>,
): Promise<void> {
  const observed = await db.host.withClient(async (client) => {
    const out: Record<string, number[]> = {};
    for (const table of Object.keys(expected)) {
      const r = await client.query<{ append_position: string }>(
        `SELECT append_position FROM ${table} WHERE estate_id = $1 ORDER BY append_position ASC`,
        [estate_id],
      );
      out[table] = r.rows.map((row) => Number(row.append_position));
    }
    return out;
  });
  for (const [table, count] of Object.entries(expected)) {
    const positions = observed[table] ?? [];
    expect(positions, `${table} positions for ${estate_id}`).toEqual(
      Array.from({ length: count }, (_unused, i) => i + 1),
    );
  }
}

function newStore(storage: StorageAdapter): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    storage,
  });
}

/**
 * A second, genuinely distinct estate. Only the estate/actor/keyring identity
 * changes — no semantics are altered, so the isolation proof compares like
 * with like.
 */
function newOtherStore(storage: StorageAdapter): EstateStore {
  const actor = { ...loadActor(), actor_id: 'actor:phase-50a-second', estate_id: OTHER_ESTATE_ID, keyring_id: 'keyring:phase-50a-second' };
  const keyring = { ...loadKeyring(), keyring_id: 'keyring:phase-50a-second', actor_id: actor.actor_id, estate_id: OTHER_ESTATE_ID };
  const estate = {
    ...loadEstate(),
    estate_id: OTHER_ESTATE_ID,
    actor_id: actor.actor_id,
    keyring_id: keyring.keyring_id,
  };
  return new EstateStore({ actor, estate, keyring, storage });
}

function observation(text: string) {
  return buildCandidate({
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}

function otherObservation(text: string) {
  return buildCandidate({
    estate_id: OTHER_ESTATE_ID,
    actor_id: 'actor:phase-50a-second',
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}
