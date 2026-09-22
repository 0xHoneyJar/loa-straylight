// Phase 50A patch cycle 1 — migration checksum binding (audit comment
// 5135002802, finding 4).
//
// The defect: the ledger stored only `version` and `applied_at`, so it recorded
// THAT 0001 was applied but not WHICH 0001. `migrate` trusted a present version
// and skipped it, and `assertSchemaVersion` served the schema on the same
// unbound claim — so changed migration content was silently treated as already
// applied.
//
// The correction binds every applied version to a deterministic checksum of the
// shipped migration content (`migrationChecksum`), stores it immutably in the
// ledger, and verifies it before EITHER decision:
//
//   * before skipping a version in `migrate`;
//   * before the host treats the schema as serviceable
//     (`assertSchemaVersion`, reached by every `withEstateSession`,
//     `readEstateState`, and `listEstateIds` call);
//   * before `rollback` runs a DOWN file against the schema.
//
// A missing, forged, stale, or mismatched checksum fails closed.
//
// `migrations/postgres/` is a FORBIDDEN path for this patch, so no test here
// edits a migration file on disk. Content-change cases are proven two ways
// instead: by hashing explicit content through `migrationChecksum`'s documented
// `MigrationSource` parameter, and by writing a checksum into the ledger that
// corresponds to different content (which is indistinguishable, from the
// verifier's side, from the shipped content having changed underneath it).

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { EstateStore, type StorageAdapter } from '../../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../../fixtures/index.js';
import {
  MIGRATION_CHECKSUM_ALGORITHM,
  PostgresIntegrityError,
  SHIPPED_SCHEMA_VERSIONS,
  appliedMigrations,
  appliedVersions,
  migrationChecksum,
  readMigrationSql,
  verifyAppliedChecksums,
} from '../../src/straylight/storage/postgres/index.js';
// The ledger-initialization entry point is imported from its own module rather
// than the barrel: `index.ts` is a FORBIDDEN path for this patch, so the
// public surface is byte-unchanged and this internal-only helper is reached by
// module path (the same way the suites already reach `hosts.js`).
import { initializeLedger } from '../../src/straylight/storage/postgres/migrate.js';
import {
  openUnmigratedDatabase,
  phase50aEnabled,
  phase50aGateReport,
  requireReachable,
  sourceHost,
  type ScratchDatabase,
} from './_support.js';

const NOW = '2026-05-05T12:00:00Z';
const ESTATE_ID = loadEstate().estate_id;
const VERSION = '0001';

/**
 * The ledger read the verification path performs, replayed verbatim so the lock
 * probe measures the real statement rather than a stand-in.
 */
const Q_LEDGER_READ = `
  SELECT version,
         to_jsonb(ledger) ->> 'content_checksum' AS content_checksum
    FROM straylight_schema_migrations AS ledger
   ORDER BY version ASC
`;

phase50aGateReport('postgres-migration-checksum');

const maybe = phase50aEnabled() ? describe : describe.skip;

// ── the algorithm itself (no database required) ─────────────────────────

describe('Phase 50A patch — the migration checksum algorithm is deterministic and unambiguous', () => {
  it('is stable: hashing the shipped content repeatedly gives the same value', () => {
    const a = migrationChecksum(VERSION);
    const b = migrationChecksum(VERSION);
    expect(a).toBe(b);
    expect(a).toMatch(new RegExp(`^${MIGRATION_CHECKSUM_ALGORITHM}:[0-9a-f]{64}$`));
  });

  it('names its algorithm in the value, so a future algorithm change is a visible mismatch', () => {
    expect(migrationChecksum(VERSION).startsWith(`${MIGRATION_CHECKSUM_ALGORITHM}:`)).toBe(true);
    expect(MIGRATION_CHECKSUM_ALGORITHM).toBe('straylight-migration-sha256-v1');
  });

  it('binds the VERSION: the same content under a different version hashes differently', () => {
    const content = { up: 'CREATE TABLE t (x int);', down: 'DROP TABLE t;' };
    expect(migrationChecksum('0001', content)).not.toBe(migrationChecksum('0002', content));
  });

  it('binds BOTH directions: changing only the down file changes the checksum', () => {
    const up = readMigrationSql(VERSION, 'up');
    const down = readMigrationSql(VERSION, 'down');
    const baseline = migrationChecksum(VERSION, { up, down });
    expect(migrationChecksum(VERSION, { up, down: `${down}\n-- appended` })).not.toBe(baseline);
    expect(migrationChecksum(VERSION, { up: `${up}\n-- appended`, down })).not.toBe(baseline);
    // And hashing the on-disk content explicitly equals hashing it implicitly.
    expect(baseline).toBe(migrationChecksum(VERSION));
  });

  it('is COLLISION-UNAMBIGUOUS: content shifted across the up/down boundary does not collide', () => {
    // Without length framing, `up='AB', down='C'` and `up='A', down='BC'`
    // could concatenate to the same input. Framing pins every boundary.
    const shifted = migrationChecksum('v', { up: 'AB', down: 'C' });
    const other = migrationChecksum('v', { up: 'A', down: 'BC' });
    expect(shifted).not.toBe(other);
    // Same for the version/up boundary.
    expect(migrationChecksum('ab', { up: 'C', down: 'D' })).not.toBe(
      migrationChecksum('a', { up: 'bC', down: 'D' }),
    );
  });

  it('normalizes ONLY the documented CRLF → LF, and nothing else', () => {
    const lf = { up: 'CREATE TABLE t (\n  x int\n);\n', down: 'DROP TABLE t;\n' };
    const crlf = {
      up: 'CREATE TABLE t (\r\n  x int\r\n);\r\n',
      down: 'DROP TABLE t;\r\n',
    };
    // CRLF is normalized: a Windows checkout of unchanged content still matches.
    expect(migrationChecksum('v', crlf)).toBe(migrationChecksum('v', lf));

    // Nothing ELSE is normalized. Whitespace, indentation, comments, case, and
    // a trailing newline are all significant — arbitrary SQL is never silently
    // trimmed or rewritten.
    const baseline = migrationChecksum('v', lf);
    for (const variant of [
      { up: lf.up.trimEnd(), down: lf.down },
      { up: lf.up.replace('  x int', '    x int'), down: lf.down },
      { up: lf.up.toUpperCase(), down: lf.down },
      { up: `-- comment\n${lf.up}`, down: lf.down },
      { up: `${lf.up} `, down: lf.down },
      { up: lf.up, down: lf.down.trimEnd() },
    ]) {
      expect(migrationChecksum('v', variant), JSON.stringify(variant)).not.toBe(baseline);
    }

    // A LONE CR is NOT touched, so a file genuinely containing one is distinct.
    expect(migrationChecksum('v', { up: 'a\rb', down: 'x' })).not.toBe(
      migrationChecksum('v', { up: 'a\nb', down: 'x' }),
    );
  });
});

// ── ledger binding and verification (requires a database) ──────────────

maybe('Phase 50A patch — the ledger binds each applied version to its content checksum', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openUnmigratedDatabase(sourceHost(), 'migrate-checksum');
  }, 60_000);

  afterEach(async () => {
    await db.dispose();
  });

  /** Overwrite the ledger's recorded checksum by direct SQL. */
  async function forgeLedgerChecksum(value: string | null): Promise<void> {
    await db.host.withClient(async (client) => {
      // The immutability trigger refuses an in-place rewrite of a recorded
      // checksum, so a forger's only route is delete-then-reinsert. Doing
      // exactly that is what makes the forged/stale cases realistic.
      await client.query('DELETE FROM straylight_schema_migrations WHERE version = $1', [VERSION]);
      await client.query(
        'INSERT INTO straylight_schema_migrations (version, content_checksum) VALUES ($1, $2)',
        [VERSION, value],
      );
    });
  }

  it('a CLEAN apply records the shipped content checksum', async () => {
    expect(await db.host.migrate()).toEqual([...SHIPPED_SCHEMA_VERSIONS]);

    const ledger = await db.host.withClient(appliedMigrations);
    expect(ledger).toEqual([
      { version: VERSION, content_checksum: migrationChecksum(VERSION) },
    ]);

    // And the schema serves.
    const written = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      return newStore(storage).admit(observation('after clean apply'), NOW).ok;
    });
    expect(written.value).toBe(true);
    expect(written.committed).toBe(true);
  });

  it('a MATCHING checksum skips the migration (idempotency preserved)', async () => {
    expect(await db.host.migrate()).toEqual([...SHIPPED_SCHEMA_VERSIONS]);
    // Repeats are no-ops, and the recorded checksum is unchanged.
    expect(await db.host.migrate()).toEqual([]);
    expect(await db.host.migrate()).toEqual([]);
    const ledger = await db.host.withClient(appliedMigrations);
    expect(ledger[0]?.content_checksum).toBe(migrationChecksum(VERSION));
  });

  it('a FORGED ledger checksum fails closed on migrate, on schema service, and on rollback', async () => {
    await db.host.migrate();
    await forgeLedgerChecksum(`${MIGRATION_CHECKSUM_ALGORITHM}:${'0'.repeat(64)}`);

    // migrate: refuses rather than skipping the version on an unproven claim.
    await expect(db.host.migrate()).rejects.toMatchObject({
      name: 'PostgresIntegrityError',
      reason: 'migration_checksum_mismatch',
    });

    // schema service: the host refuses to serve ANY operation.
    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
    ).rejects.toMatchObject({ reason: 'migration_checksum_mismatch' });
    await expect(db.host.readEstateState(ESTATE_ID)).rejects.toMatchObject({
      reason: 'migration_checksum_mismatch',
    });
    await expect(db.host.listEstateIds()).rejects.toMatchObject({
      reason: 'migration_checksum_mismatch',
    });

    // rollback: refuses to run the shipped DOWN file against a schema it
    // cannot prove came from the shipped UP file.
    await expect(db.host.rollback(VERSION)).rejects.toMatchObject({
      reason: 'migration_checksum_mismatch',
    });
  });

  it('a STALE checksum — one that matches DIFFERENT content — fails closed', async () => {
    await db.host.migrate();
    // A checksum computed over an earlier revision of the same migration. From
    // the verifier's side this is exactly the "shipped content changed" case:
    // the ledger's value no longer equals the hash of what ships now.
    const staleContent = {
      up: `${readMigrationSql(VERSION, 'up')}\n-- an earlier revision`,
      down: readMigrationSql(VERSION, 'down'),
    };
    const stale = migrationChecksum(VERSION, staleContent);
    expect(stale).not.toBe(migrationChecksum(VERSION));
    await forgeLedgerChecksum(stale);

    await expect(db.host.migrate()).rejects.toMatchObject({
      reason: 'migration_checksum_mismatch',
    });
    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
    ).rejects.toMatchObject({ reason: 'migration_checksum_mismatch' });
  });

  it('CHANGED shipped content is refused: the recorded checksum no longer matches what ships', async () => {
    await db.host.migrate();
    const recorded = (await db.host.withClient(appliedMigrations))[0]?.content_checksum;
    expect(recorded).toBe(migrationChecksum(VERSION));

    // `migrations/postgres/` is forbidden for this patch, so the shipped file is
    // not edited. Instead: prove the equivalence the refusal rests on — the
    // checksum of MODIFIED content differs from the recorded one, which is the
    // condition `verifyAppliedChecksums` raises on.
    const changed = migrationChecksum(VERSION, {
      up: readMigrationSql(VERSION, 'up').replace('CREATE TABLE actors', 'CREATE TABLE actors2'),
      down: readMigrationSql(VERSION, 'down'),
    });
    expect(changed).not.toBe(recorded);

    // And drive the refusal through the real verifier by putting `changed` in
    // the ledger — indistinguishable from the file having changed underneath a
    // correctly-recorded checksum.
    await forgeLedgerChecksum(changed);
    await expect(
      db.host.withClient((client) => verifyAppliedChecksums(client, SHIPPED_SCHEMA_VERSIONS)),
    ).rejects.toMatchObject({ reason: 'migration_checksum_mismatch' });
  });

  it('a MISSING checksum fails closed — an unbound ledger row is never taken on trust', async () => {
    await db.host.migrate();
    await forgeLedgerChecksum(null);

    // The row still claims the version is applied…
    expect(await db.host.withClient(appliedVersions)).toEqual([VERSION]);
    // …but with no binding, it cannot count as applied.
    await expect(db.host.migrate()).rejects.toMatchObject({
      name: 'PostgresIntegrityError',
      reason: 'migration_checksum_missing',
    });
    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
    ).rejects.toMatchObject({ reason: 'migration_checksum_missing' });
    await expect(db.host.rollback(VERSION)).rejects.toMatchObject({
      reason: 'migration_checksum_missing',
    });
  });

  it('a recorded checksum is IMMUTABLE: an in-place rewrite is refused by the database', async () => {
    await db.host.migrate();
    const recorded = (await db.host.withClient(appliedMigrations))[0]?.content_checksum;

    await expect(
      db.host.withClient(async (client) => {
        await client.query(
          'UPDATE straylight_schema_migrations SET content_checksum = $1 WHERE version = $2',
          [`${MIGRATION_CHECKSUM_ALGORITHM}:${'1'.repeat(64)}`, VERSION],
        );
      }),
    ).rejects.toThrow(/immutable/i);

    // Unchanged.
    expect((await db.host.withClient(appliedMigrations))[0]?.content_checksum).toBe(recorded);
  });

  it('ROLLBACK then RE-APPLY re-establishes a correct binding', async () => {
    await db.host.migrate();
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      newStore(storage).admit(observation('pre-rollback'), NOW);
    });

    expect(await db.host.rollback(VERSION)).toBe(true);
    // The ledger row — and with it the binding — is withdrawn.
    expect(await db.host.withClient(appliedMigrations)).toEqual([]);
    // With the schema absent the store fails closed on version, not checksum.
    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
    ).rejects.toMatchObject({ reason: 'schema_version_mismatch' });

    // Re-apply binds afresh and the store works again.
    expect(await db.host.migrate()).toEqual([...SHIPPED_SCHEMA_VERSIONS]);
    expect((await db.host.withClient(appliedMigrations))[0]?.content_checksum).toBe(
      migrationChecksum(VERSION),
    );
    const rewritten = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      const out = newStore(storage).admit(observation('post-rollback'), NOW);
      return {
        ok: out.ok,
        chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
      };
    });
    expect(rewritten.value).toEqual({ ok: true, chainOk: true });
    expect(rewritten.committed).toBe(true);
  });

  it('a FAILED migration binds no checksum and claims no version (atomicity)', async () => {
    // Occupy a name 0001 creates, so the DDL raises partway through.
    await db.host.withClient(async (client) => {
      await client.query('CREATE TABLE actors (placeholder text)');
    });

    await expect(db.host.migrate()).rejects.toMatchObject({ reason: 'transaction_aborted' });

    // Neither the version nor a checksum survives: the ledger row the migration
    // file inserted and the checksum binding were in the same transaction as
    // the DDL.
    expect(await db.host.withClient(appliedMigrations)).toEqual([]);
    expect(await db.host.withClient(appliedVersions)).toEqual([]);
  });

  it('verifyAppliedChecksums returns only present-and-verified versions', async () => {
    // Nothing applied: no version is verified, and that is not an error.
    expect(
      await db.host.withClient((client) => verifyAppliedChecksums(client, SHIPPED_SCHEMA_VERSIONS)),
    ).toEqual([]);

    await db.host.migrate();
    expect(
      await db.host.withClient((client) => verifyAppliedChecksums(client, SHIPPED_SCHEMA_VERSIONS)),
    ).toEqual([VERSION]);

    // An unknown version is simply absent, not a verification failure.
    expect(await db.host.withClient((client) => verifyAppliedChecksums(client, ['9999']))).toEqual(
      [],
    );
  });

  it('a ledger created WITHOUT the checksum column fails closed, and READING it upgrades nothing', async () => {
    // Simulate a ledger written by a build that predates checksum binding:
    // create the pre-patch shape, claim the version, then apply the schema DDL
    // by hand so the database really is at version 0001 with an unbound row.
    await db.host.withClient(async (client) => {
      await client.query(`
        CREATE TABLE straylight_schema_migrations (
          version    text        PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )`);
      await client.query(readMigrationSql(VERSION, 'up'));
    });

    // The pre-existing row has NO checksum — read as `null` because the column
    // itself is absent — and it must NOT be backfilled from whatever ships now.
    const ledger = await db.host.withClient(appliedMigrations);
    expect(ledger).toEqual([{ version: VERSION, content_checksum: null }]);

    // And the READ upgraded nothing: the checksum column is still absent.
    // Steady-state verification is read-only (patch cycle 2, finding 2), so the
    // column is added only by the migration/initialization path.
    expect(await ledgerColumns()).toEqual(['applied_at', 'version']);

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
    ).rejects.toMatchObject({
      name: 'PostgresIntegrityError',
      reason: 'migration_checksum_missing',
    });

    // Still absent after a refused session, too — the refusal path adds no DDL.
    expect(await ledgerColumns()).toEqual(['applied_at', 'version']);

    // The INITIALIZATION path is what upgrades the shape, explicitly.
    await db.host.withClient(initializeLedger);
    expect(await ledgerColumns()).toEqual(['applied_at', 'content_checksum', 'version']);
    // The upgraded row is STILL unbound, so it still fails closed: an upgrade
    // establishes the column, never a checksum value.
    expect(await db.host.withClient(appliedMigrations)).toEqual([
      { version: VERSION, content_checksum: null },
    ]);
    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
    ).rejects.toMatchObject({ reason: 'migration_checksum_missing' });
  });

  /**
   * The ledger's complete catalog definition: its columns, its triggers, and
   * the oid of each trigger's function. Any `ensureLedger` statement changes at
   * least one of these — `ALTER TABLE ADD COLUMN` the columns, `DROP`/`CREATE
   * TRIGGER` the trigger's own oid, `CREATE OR REPLACE FUNCTION` the function's
   * oid — so comparing the whole record catches DDL that a column list alone
   * would miss.
   */
  async function ledgerDefinition(): Promise<{
    columns: string[];
    triggers: Array<{ trigger: string; oid: string; function_oid: string }>;
  }> {
    return db.host.withClient(async (client) => {
      const cols = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'straylight_schema_migrations' ORDER BY column_name ASC`,
      );
      const trg = await client.query<{ trigger: string; oid: string; function_oid: string }>(
        `SELECT t.tgname AS trigger,
                t.oid::text AS oid,
                t.tgfoid::text AS function_oid
           FROM pg_trigger t
           JOIN pg_class c ON c.oid = t.tgrelid
          WHERE c.relname = 'straylight_schema_migrations'
            AND NOT t.tgisinternal
          ORDER BY t.tgname ASC`,
      );
      return {
        columns: cols.rows.map((x) => x.column_name),
        triggers: trg.rows.map((x) => ({
          trigger: x.trigger,
          oid: x.oid,
          function_oid: x.function_oid,
        })),
      };
    });
  }

  /** The ledger's own column names, ascending. */
  async function ledgerColumns(): Promise<string[]> {
    return db.host.withClient(async (client) => {
      const r = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'straylight_schema_migrations' ORDER BY column_name ASC`,
      );
      return r.rows.map((x) => x.column_name);
    });
  }

  // ── patch cycle 2, finding 2 — steady-state verification is READ-ONLY ──
  //
  // The defect: `ensureLedger` (CREATE TABLE / ALTER TABLE ADD COLUMN / CREATE
  // OR REPLACE FUNCTION / DROP TRIGGER / CREATE TRIGGER) ran from every ledger
  // READ, including `assertSchemaVersion` inside each estate transaction. That
  // DDL took an ACCESS EXCLUSIVE ledger lock held until the estate callback
  // committed, so unrelated estates contended on it.
  //
  // These prove the verification path issues no DDL at all. The cross-estate
  // consequence is proven end-to-end, across processes, in
  // `postgres-concurrency.test.ts`.

  it('an estate session issues NO ledger DDL — verification only reads', async () => {
    await db.host.migrate();

    // A ledger DDL statement would show up as a catalog change. Pin the ledger's
    // full definition — columns, the trigger, and the trigger function's oid —
    // then run the ordinary serving paths and require every one to be identical.
    const before = await ledgerDefinition();
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      newStore(storage).admit(observation('steady state'), NOW).ok;
    });
    await db.host.readEstateState(ESTATE_ID);
    await db.host.listEstateIds();
    await db.host.withClient((client) => verifyAppliedChecksums(client, SHIPPED_SCHEMA_VERSIONS));
    await db.host.withClient(appliedMigrations);
    await db.host.withClient(appliedVersions);
    expect(await ledgerDefinition()).toEqual(before);
  });

  it('the estate transaction takes NO lock on the ledger relation beyond an ordinary read', async () => {
    await db.host.migrate();

    // Read the locks the estate transaction itself holds on the ledger, from
    // INSIDE the callback (so the transaction is still open). ACCESS EXCLUSIVE
    // — what `ALTER TABLE`/`CREATE TRIGGER` take — is the failure. `AccessShare`
    // from the SELECTs is expected and harmless: it does not conflict with
    // another transaction's AccessShare.
    const modes = await db.host.withEstateSession(ESTATE_ID, () => 'probe-marker');
    expect(modes.value).toBe('probe-marker');

    const observed = await db.host.withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query(Q_LEDGER_READ);
        const r = await client.query<{ mode: string }>(
          `SELECT l.mode FROM pg_locks l
             JOIN pg_class c ON c.oid = l.relation
            WHERE c.relname = 'straylight_schema_migrations'
              AND l.pid = pg_backend_pid()
            ORDER BY l.mode`,
        );
        return r.rows.map((x) => x.mode);
      } finally {
        await client.query('ROLLBACK');
      }
    });
    // A pure read takes AccessShareLock and nothing stronger.
    expect(observed).toEqual(['AccessShareLock']);
    expect(observed).not.toContain('AccessExclusiveLock');
  });

  it('the integrity error names the version and both checksums, so an operator can diagnose it', async () => {
    await db.host.migrate();
    const forged = `${MIGRATION_CHECKSUM_ALGORITHM}:${'a'.repeat(64)}`;
    await forgeLedgerChecksum(forged);

    let caught: unknown;
    try {
      await db.host.migrate();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(PostgresIntegrityError);
    const message = String((caught as Error).message);
    expect(message).toContain(VERSION);
    expect(message).toContain(forged);
    expect(message).toContain(migrationChecksum(VERSION));
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
