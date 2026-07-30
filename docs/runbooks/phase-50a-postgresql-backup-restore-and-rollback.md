# Runbook — PostgreSQL canonical store: backup, restore, and rollback

**Status**: non-production operator runbook. Phase 50A
(ADR-049Q §13.1(e), (f), (i); P-4, P-6, P-7, P-9).

**Scope limit, read first.** Every procedure below is authorized for
**local / development / operator-grade** databases only. Phase 50A
"touches no production estate, executes no production migration, performs
no production write, and uses no production credential"
(`../decisions/ADR-049Q-railway-postgresql-canonical-store-host-acceptance-and-implementation-authorization.md`
§13.2). Running these procedures against a production deployment, a
provider-hosted database, or a living estate is **outside the authorization**
and requires its own operator decision (§13.3).

The commands are **ordinary PostgreSQL client tooling** — `pg_dump`, `psql`,
`pg_restore`. That is deliberate: §11.4 requires canonical estate state to be
exportable "in an ordinary, provider-neutral PostgreSQL form", and a bespoke
export format would prove only that the bespoke format round-trips.

---

## 0. Vocabulary

| Term | Meaning here |
|---|---|
| **storage host** | A PostgreSQL server instance. Provider-neutral term (§11.2). |
| **source host** | The instance currently holding canonical estate state. |
| **replacement host** | A *different* conforming instance you restore into. |
| **canonical state** | The complete content of the nine canonical tables. |
| **chain** | A per-estate `audit_events` hash chain (`../../src/straylight/audit.ts`). |
| **quarantine** | Refusing a restored estate from normal service after a failed verification. |

---

## 1. The local proof harness

Two separate instances, defined by `../../docker-compose.phase-50a.yml`:

| Role | Container | Port | Database |
|---|---|---|---|
| source | `straylight-phase-50a-source` | `127.0.0.1:55432` | `straylight_source` |
| replacement | `straylight-phase-50a-replacement` | `127.0.0.1:55433` | `straylight_replacement` |

```bash
npm run phase-50a:up      # start both, wait for health
npm run phase-50a:test    # the asserted suites (requires both)
npm run phase-50a:proof   # the operator-readable two-host proof
npm run phase-50a:down    # stop both and discard volumes
```

The harness user is `straylight_proof` and the password is a **fixed
local-only value committed on purpose** so the proof is reproducible without
any credential handling. It is bound to loopback and grants nothing anywhere
else. Never point it at a real deployment.

**These are two genuinely separate servers, not one server with two
databases.** The proof verifies this mechanically by comparing
`pg_control_system().system_identifier`, which differs between separately
initialized clusters:

```bash
docker exec straylight-phase-50a-source \
  psql -tA -U straylight_proof -d straylight_source \
  -c 'SELECT system_identifier FROM pg_control_system()'
docker exec straylight-phase-50a-replacement \
  psql -tA -U straylight_proof -d straylight_replacement \
  -c 'SELECT system_identifier FROM pg_control_system()'
```

Equal identifiers mean the harness is misconfigured and the
replacement-host proof is invalid — the proof script refuses in that case
rather than reporting a pass.

---

## 2. Migration

The canonical migrations live in `../../migrations/postgres/`. They are
applied by the runner in `../../src/straylight/storage/postgres/migrate.ts`,
never by hand:

```ts
const host = new PostgresEstateHost({ connectionString: '<connection string>' });
await host.migrate();   // applies every unapplied version, in order
```

Properties you can rely on:

- **Idempotent.** `migrate()` returns the list of versions it applied.
  Running it again returns `[]` and changes nothing.
- **Atomic per version.** Each version's DDL and its ledger row commit in one
  transaction. A migration that fails partway leaves the previous version in
  place with no ledger claim — never a half-applied schema that reports
  success.
- **Fail-closed on mismatch.** If a required version is not applied, every
  store operation raises `PostgresUnavailableError`
  (`reason: 'schema_version_mismatch'`). The store denies rather than serving
  a partial schema.

The ledger table `straylight_schema_migrations` is owned by the **runner**,
not by a versioned file, so the rollback → re-apply cycle in §4 works.

---

## 3. Backup (export)

### 3.1 The exercise

```bash
docker exec straylight-phase-50a-source \
  pg_dump --no-owner --no-privileges \
          -U straylight_proof -d straylight_source \
  > /tmp/straylight-source.sql
```

Operating the tools directly (no container) is the identical command:

```bash
pg_dump --no-owner --no-privileges \
        -d 'postgresql://<user>:<password>@<host>:<port>/<database>' \
  > straylight-source.sql
```

`--no-owner --no-privileges` keeps the dump portable across hosts whose role
names differ — which is exactly the provider-replacement case (P-6, P-8).

### 3.2 What the dump contains

A plain-SQL file carrying the schema **and** the data, including the
`BEFORE UPDATE OR DELETE` triggers that enforce append-only history. The
restored host therefore enforces immutability exactly as the source did; the
Phase 50A suite asserts this rather than assuming it.

### 3.3 Verify before you rely on it

An unverified backup is not a backup (P-7: "restoration is proven before
reliance, not assumed"). Always restore into a scratch database and compare
canonical state — §4 and §5.

---

## 4. Restore into a replacement host

### 4.1 The target must be EMPTY

The dump carries the schema. Pre-migrating the target makes the restore
collide with the objects it is creating, and hides whether the export is
self-sufficient. A real replacement host is a fresh database, so use one:

```bash
docker exec straylight-phase-50a-replacement \
  psql -U straylight_proof -d postgres \
  -c 'DROP DATABASE IF EXISTS straylight_replacement WITH (FORCE)'
docker exec straylight-phase-50a-replacement \
  psql -U straylight_proof -d postgres \
  -c 'CREATE DATABASE straylight_replacement'
```

### 4.2 Restore

```bash
docker exec -i straylight-phase-50a-replacement \
  psql --set ON_ERROR_STOP=1 \
       -U straylight_proof -d straylight_replacement \
  < /tmp/straylight-source.sql
```

`ON_ERROR_STOP=1` is **mandatory**. Without it `psql` continues past errors
and produces a partially restored database that looks like a success.

### 4.3 Verify — this step is not optional

```bash
npm run phase-50a:proof
```

The proof compares the **canonical content digest** of both stores and
verifies every per-estate chain on the replacement with the same
`AuditLog.verifyChain` the source uses. Programmatically:

```ts
const sourceSnapshot = await sourceHost.withClient(readStoreSnapshot);
const targetSnapshot = await replacementHost.withClient(readStoreSnapshot);
assertRestoreServiceable(sourceSnapshot, targetSnapshot);  // throws on any defect
```

### 4.4 Quarantine on failure

`verifyRestore` returns `{ ok, quarantinedEstates, reasons }`, and
`assertRestoreServiceable` throws `PostgresIntegrityError`
(`reason: 'restore_verification_failed'`). If either reports a defect:

1. **Do not put the restored host into service.** A broken chain quarantines
   rather than serves (P-4).
2. Record `reasons` and `quarantinedEstates` verbatim.
3. Keep the source host untouched — it is still authoritative.
4. Re-take the dump and restore again. If the second attempt fails the same
   way, the defect is in the source or the export, not the restore: stop and
   escalate.

Independently of the comparison, the store **refuses to load** a broken
estate: `listAuditEvents`, `listTransitions`, and any session on that estate
raise `PostgresIntegrityError`. A quarantined estate cannot be served by
skipping the verification step.

---

## 5. Rollback

Two different things are called rollback. Keep them apart.

### 5.1 Transaction rollback (automatic, always available)

Every store operation runs inside one transaction that commits **before**
success is returned. A failure anywhere — callback exception, integrity
violation, lost connection, aborted transaction — rolls the whole attempt
back. There is no partial write and no operation reported successful without a
completed commit. Nothing to run; this is the store's normal behavior.

### 5.2 Migration rollback (deliberate, destructive)

```ts
await host.rollback('0001');   // true if withdrawn, false if it was not applied
```

**This drops the canonical tables and discards their rows.**

Order of operations, without exception:

1. **Export first** (§3) if the database holds any estate state you care
   about.
2. **Verify the export** by restoring it into a scratch database (§4).
3. Only then run `rollback`.
4. Re-apply with `migrate()` when ready. The re-apply is proven to work from
   the rolled-back state.

`rollback` on a version that is not applied is a no-op returning `false`, not
an error — so a retried rollback is safe.

### 5.3 Failed-admission rollback

An admission that fails needs no procedure: §5.1 already discarded it. To
confirm, read the estate back and verify the chain:

```ts
await host.withEstateSession(estateId, (storage) => {
  const store = EstateStore.fromStorage(storage, estateId);
  return store?.auditLog.verifyChain(estateId);
});
```

---

## 6. Diagnostics

| Symptom | Error | Action |
|---|---|---|
| Store refuses every operation | `PostgresUnavailableError` `schema_version_mismatch` | Run `migrate()`. |
| Store cannot connect | `PostgresUnavailableError` `connection_failed` | Check the host is up and the connection string targets it. Never fall back to another adapter. |
| Operation aborted | `PostgresUnavailableError` `transaction_aborted` | Transient. Retry; an identical retry is idempotent (§7). |
| Estate will not load | `PostgresIntegrityError` `audit_chain_broken` | Quarantine. Restore from a verified backup (§4). |
| Estate will not load | `PostgresIntegrityError` `append_prefix_mutated` | History is not a dense prefix — rows were added or removed out of band. Quarantine and restore. |
| Write refused | `PostgresIntegrityError` `immutable_id_conflict` | An immutable id was reused for different content. Investigate the caller; do not force the write. |
| Row refused | `PostgresIntegrityError` `malformed_row` | Durable content contradicts the canonical contract. Quarantine and restore. |
| `UPDATE`/`DELETE` refused | `... on append-only table ... is refused (immutable history)` | Working as designed. Append-only history is never mutated. |

Connection strings in diagnostics are redacted — `describeTarget()` replaces
userinfo with `<redacted>`, so an error message can name the target without
leaking a credential.

---

## 7. Idempotency

Retrying an operation whose commit outcome was uncertain is safe **when the
canonical payload is identical**:

- identical content, already durable → converges on the existing rows, creates
  no duplicate, takes no second append position;
- **different** content under the same immutable id → refused
  (`immutable_id_conflict`) and rolled back.

Note the distinction the suites make explicit: replaying the *same records* is
a retry, while *re-executing* an operation against advanced state derives a
different chain link and is therefore conflicting reuse, not a retry. The
store refuses the latter rather than papering over it.

---

## 8. What this runbook does NOT establish

Every item below is **unproven and mandatory as pre-production proof**
(ADR-049Q §12). Nothing here substitutes for any of them, and no procedure
above may be read as evidence for one:

durability · failover · version pinning · network isolation · tenancy
boundary · availability · incident recovery · backup-and-restore success
against an actual deployment · rollback of a failed production migration or
admission deployment.

Each must be demonstrated, documented, and **separately accepted** before any
production-admission decision may be evaluated.
