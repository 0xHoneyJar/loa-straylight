// Phase 50A — canonical migrations: apply, idempotency, rollback, re-apply.
//
// ADR-049Q §13.1(b), (f); P-2, P-9.
//
// The rollback path is exercised BEFORE the re-apply, which is the ordering
// P-9 requires ("rollback exists before either is attempted"): the test proves
// the down path works on a real database rather than asserting that a file
// exists.

import { beforeAll, describe, expect, it } from 'vitest';

import {
  MIGRATIONS_DIR,
  SHIPPED_SCHEMA_VERSIONS,
  appliedVersions,
  readMigrationSql,
} from '../../src/straylight/storage/postgres/index.js';
import { EstateStore, type StorageAdapter } from '../../src/straylight/index.js';
import { SIGNERS, buildCandidate, loadActor, loadEstate, loadKeyring } from '../../fixtures/index.js';
import {
  openUnmigratedDatabase,
  phase50aEnabled,
  phase50aGateReport,
  requireReachable,
  sourceHost,
} from './_support.js';

const NOW = '2026-05-05T12:00:00Z';
const ESTATE_ID = loadEstate().estate_id;

phase50aGateReport('postgres-migrations');

const maybe = phase50aEnabled() ? describe : describe.skip;

maybe('Phase 50A migrations — apply, idempotency, rollback, re-apply', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('migrating an EMPTY database applies every shipped version and reaches the current schema', async () => {
    const db = await openUnmigratedDatabase(sourceHost(), 'migrate-empty');
    try {
      const before = await db.host.withClient(appliedVersions);
      expect(before).toEqual([]);

      const applied = await db.host.migrate();
      expect(applied).toEqual([...SHIPPED_SCHEMA_VERSIONS]);

      const after = await db.host.withClient(appliedVersions);
      expect(after).toEqual([...SHIPPED_SCHEMA_VERSIONS]);

      // The schema is usable: a full flow commits.
      const written = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const out = newStore(storage).admit(observation('post-migrate'), NOW);
        return out.ok;
      });
      expect(written.value).toBe(true);
      expect(written.committed).toBe(true);
    } finally {
      await db.dispose();
    }
  });

  it('repeating migrate is idempotent: no version re-applies and no data changes', async () => {
    const db = await openUnmigratedDatabase(sourceHost(), 'migrate-idempotent');
    try {
      const first = await db.host.migrate();
      expect(first).toEqual([...SHIPPED_SCHEMA_VERSIONS]);

      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('survives re-migrate'), NOW);
      });

      // Repeat twice more — both must be no-ops.
      expect(await db.host.migrate()).toEqual([]);
      expect(await db.host.migrate()).toEqual([]);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        assertions: storage.listAssertions(ESTATE_ID).length,
        audit: storage.listAuditEvents(ESTATE_ID).length,
        chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
      }));
      expect(read.value).toEqual({ assertions: 1, audit: 1, chainOk: true });
    } finally {
      await db.dispose();
    }
  });

  it('rollback removes the schema and its ledger row, then re-apply succeeds and the store works again', async () => {
    const db = await openUnmigratedDatabase(sourceHost(), 'migrate-rollback');
    try {
      await db.host.migrate();
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('pre-rollback'), NOW);
      });

      // Roll back. This is DESTRUCTIVE by design (the runbook requires an
      // export first for any database holding estate data) and is exercised
      // here in a scratch database only.
      const rolledBack = await db.host.rollback('0001');
      expect(rolledBack).toBe(true);

      // The ledger no longer claims the version, and the tables are gone.
      expect(await db.host.withClient(appliedVersions)).toEqual([]);
      const tables = await db.host.withClient(async (client) => {
        const r = await client.query<{ table_name: string }>(
          `SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' ORDER BY table_name`,
        );
        return r.rows.map((x) => x.table_name);
      });
      expect(tables).toEqual(['straylight_schema_migrations']);

      // With the schema absent, the store fails closed rather than serving.
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => storage.getEstate(ESTATE_ID)),
      ).rejects.toMatchObject({ reason: 'schema_version_mismatch' });

      // Re-apply from the rolled-back state. This is the case that would break
      // if the ledger table were owned by the migration file instead of the
      // runner.
      expect(await db.host.migrate()).toEqual([...SHIPPED_SCHEMA_VERSIONS]);
      const rewritten = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const out = newStore(storage).admit(observation('post-rollback'), NOW);
        return {
          ok: out.ok,
          chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });
      expect(rewritten.value.ok).toBe(true);
      expect(rewritten.value.chainOk).toBe(true);
      expect(rewritten.committed).toBe(true);
    } finally {
      await db.dispose();
    }
  });

  it('rolling back a version that is not applied is a no-op, not an error', async () => {
    const db = await openUnmigratedDatabase(sourceHost(), 'rollback-noop');
    try {
      expect(await db.host.rollback('0001')).toBe(false);
    } finally {
      await db.dispose();
    }
  });

  it('a failed migration rolls back atomically and claims no version', async () => {
    const db = await openUnmigratedDatabase(sourceHost(), 'migrate-fails');
    try {
      // Occupy one of the names 0001 creates, so applying it raises partway.
      await db.host.withClient(async (client) => {
        await client.query('CREATE TABLE actors (placeholder text)');
      });
      await expect(db.host.migrate()).rejects.toMatchObject({
        reason: 'transaction_aborted',
      });
      // No ledger claim, and the partial DDL was rolled back: the tables 0001
      // would have created before reaching `actors` are absent.
      expect(await db.host.withClient(appliedVersions)).toEqual([]);
      const tables = await db.host.withClient(async (client) => {
        const r = await client.query<{ table_name: string }>(
          `SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' ORDER BY table_name`,
        );
        return r.rows.map((x) => x.table_name);
      });
      expect(tables).toEqual(['actors', 'straylight_schema_migrations']);
    } finally {
      await db.dispose();
    }
  });
});

maybe('Phase 50A migrations — provider neutrality of the canonical SQL', () => {
  it('the migration files exist for every shipped version, up and down', () => {
    for (const version of SHIPPED_SCHEMA_VERSIONS) {
      expect(readMigrationSql(version, 'up').length).toBeGreaterThan(0);
      expect(readMigrationSql(version, 'down').length).toBeGreaterThan(0);
    }
    expect(MIGRATIONS_DIR).toMatch(/migrations[/\\]postgres$/);
  });

  it('no migration uses a provider extension or a non-core feature', () => {
    for (const version of SHIPPED_SCHEMA_VERSIONS) {
      for (const direction of ['up', 'down'] as const) {
        // Strip `--` comments before scanning. The comments deliberately NAME
        // the forbidden constructs to explain the prohibition, so scanning raw
        // text would flag the explanation rather than any executable SQL.
        const sql = stripSqlComments(readMigrationSql(version, direction));
        const where = `${version}.${direction}`;
        // A provider-specific extension, role, or tablespace would make the
        // schema non-portable (P-2, §11.2, §11.6).
        expect(/CREATE\s+EXTENSION/i.test(sql), `${where}: CREATE EXTENSION`).toBe(false);
        expect(/CREATE\s+TABLESPACE/i.test(sql), `${where}: CREATE TABLESPACE`).toBe(false);
        expect(/CREATE\s+(ROLE|USER)/i.test(sql), `${where}: CREATE ROLE/USER`).toBe(false);
        expect(/ALTER\s+SYSTEM/i.test(sql), `${where}: ALTER SYSTEM`).toBe(false);
        expect(
          /pg_read_server_files|COPY\s+.*\s+FROM\s+PROGRAM/i.test(sql),
          `${where}: server-side file/program access`,
        ).toBe(false);
        // And no provider, platform, or deployment name appears in executable
        // DDL — §11.6's "no provider-specific adapter contract" rule applied to
        // the schema itself. The forbidden names are assembled from fragments so
        // this file does not itself contain them; the repository-wide guard is
        // `tests/phase-50a/no-leak-and-neutrality.test.ts`.
        for (const forbidden of [['rail', 'way'].join(''), ['her', 'oku'].join('')]) {
          expect(
            new RegExp(forbidden, 'i').test(sql),
            `${where}: provider name in DDL`,
          ).toBe(false);
        }
      }
    }
  });

  it('the comment-stripping guard itself works (so the check above cannot pass vacuously)', () => {
    // If `stripSqlComments` ever returned '' or dropped real SQL, every
    // assertion above would pass for the wrong reason.
    expect(stripSqlComments('-- CREATE EXTENSION foo\nCREATE TABLE t (x int);')).toBe(
      '\nCREATE TABLE t (x int);',
    );
    expect(stripSqlComments("SELECT '-- not a comment';")).toBe("SELECT '-- not a comment';");
    for (const version of SHIPPED_SCHEMA_VERSIONS) {
      const stripped = stripSqlComments(readMigrationSql(version, 'up'));
      expect(stripped).toContain('CREATE TABLE');
      expect(stripped).toContain('audit_events');
    }
  });

  it('the shipped version list matches the files on disk exactly', async () => {
    const { readdirSync } = await import('node:fs');
    const present = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    // Two files (up + down) per shipped version, and nothing else.
    expect(present).toHaveLength(SHIPPED_SCHEMA_VERSIONS.length * 2);
    for (const version of SHIPPED_SCHEMA_VERSIONS) {
      expect(present.some((f) => f.startsWith(`${version}_`) && f.endsWith('.up.sql'))).toBe(true);
      expect(present.some((f) => f.startsWith(`${version}_`) && f.endsWith('.down.sql'))).toBe(
        true,
      );
    }
  });
});

// ── helpers ─────────────────────────────────────────────────────────────

/**
 * Remove `--` line comments, leaving string literals intact. Quote-aware so a
 * `--` inside a literal is not mistaken for a comment start.
 */
function stripSqlComments(sql: string): string {
  let out = '';
  let inSingle = false;
  let inDollar = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]!;
    if (!inSingle && !inDollar && ch === '$' && sql.startsWith('$$', i)) {
      inDollar = true;
      out += '$$';
      i += 1;
      continue;
    }
    if (inDollar && ch === '$' && sql.startsWith('$$', i)) {
      inDollar = false;
      out += '$$';
      i += 1;
      continue;
    }
    if (!inDollar && ch === "'") {
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (!inSingle && !inDollar && ch === '-' && sql[i + 1] === '-') {
      const nextNewline = sql.indexOf('\n', i);
      if (nextNewline === -1) break;
      i = nextNewline - 1;
      continue;
    }
    out += ch;
  }
  return out;
}

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
