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
npm run phase-50a:proof   # the operator-readable two-host proof — DESTRUCTIVE,
                          # these two DISPOSABLE instances only (see below)
npm run phase-50a:down    # stop both and discard volumes
```

`phase-50a:proof` is **destructive**: it drops the `public` schema on both
instances, re-migrates the source, re-seeds it, and restores over the
replacement. That is safe **only** because these two instances are disposable —
ephemeral, holding no estate anyone relies on. The proof supports **no host
override**: the fixed descriptors in `scripts/phase-50a/hosts.ts` are the only
targets it accepts, and any other target is refused before a connection is
opened. To verify an estate you actually care about, use the non-destructive
verifier in §4.3 instead.

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

### 4.3 Verify — this step is not optional, and it destroys nothing

Verify the estate you just restored with the **non-destructive** verifier. It
reads both estates and compares them; it issues no `DROP`, no `TRUNCATE`, no
`DELETE`, no reseed and no schema-emptying statement, so the data being verified
survives the verification:

```bash
npx vite-node scripts/phase-50a/verify-existing-restore.ts \
  --source postgresql://<user>:<password>@<host>:<port>/<database> \
  --target postgresql://<user>:<password>@<host>:<port>/<database>
```

With both flags omitted it verifies the two fixed disposable harness instances.
Exit status **is** the verdict: `0` the estates agree and every per-estate chain
verifies; `1` a **mismatch** or a broken chain — go to §4.4; `2` the check could
not be performed (unreachable host, bad argument), which is **not** a verdict
about the estates.

It compares the **canonical content digest** of both stores and verifies every
per-estate chain with the same `AuditLog.verifyChain` the source uses.
Programmatically, the same read-only comparison:

```ts
const sourceSnapshot = await sourceHost.withClient(readStoreSnapshot);
const targetSnapshot = await replacementHost.withClient(readStoreSnapshot);
assertRestoreServiceable(sourceSnapshot, targetSnapshot);  // throws on any defect
```

> **Do not run `npm run phase-50a:proof` to verify a restore you care about.**
> That proof is **destructive by design**: it drops the `public` schema on *both*
> hosts, re-migrates the source, re-seeds it with its own synthetic flow, and
> restores over the replacement. It is the reproducible **disposable-harness**
> exercise (§1) and nothing else — pointed at a just-restored estate it would
> erase exactly the data you were checking. Erasing data is never a way to
> verify it.

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
| Operation aborted | `PostgresUnavailableError` `transaction_aborted` | Transient. Retry; a retry converges only when the COMPLETE durable row matches — payload equality is not sufficient (§7). |
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

Retrying an operation whose commit outcome was uncertain is safe **only when the
complete immutable durable row matches** — not merely when the canonical payload
does. Every **caller-controlled** column must be identical:

- the **immutable id** (the row's primary identity);
- the promoted **`estate_id`**;
- the promoted **`audit_hash`** and **`previous_audit_hash`**, and the
  normalized **`previous_audit_hash_key`**;
- the **canonical payload**.

`append_position` is **not** in that comparison, and must not be added to it. It
is **store-assigned**: `appendTransition`, `upsertTransitionReceipt`,
`upsertRecallReceipt` and `appendAuditEvent` supply no append position, so no
caller-supplied position exists to compare against and none may be invented. Its
placement is **validated separately**, against the store's own invariants — the
per-estate dense-prefix invariant and the shipped database constraints — never
against a caller claim. The authoritative set is `CALLER_CONTROLLED_COLUMNS` in
`src/straylight/storage/postgres/rows.ts`, from which `append_position` is
deliberately absent; a test pins that absence, so re-adding it fails.

Given that:

- every caller-controlled column identical, already durable → converges on the
  existing row, creates no duplicate, takes no second append position;
- **any** caller-controlled column different under the same immutable id →
  refused (`immutable_id_conflict`) and rolled back.

**Payload equality alone is not a safe retry condition.** A row carrying the same
id and the same canonical payload but a different promoted `estate_id` or chain
link is a *different durable row*: it is not visible to the estate the operation
was writing, so accepting it as an idempotent convergence would report success for
a write that produced no visible row. Do not reason "same payload, therefore a safe
retry" — compare every caller-controlled column, and treat a mismatch in one as the
conflict it is. A differing `append_position` is **not** such a mismatch: comparing
a store-assigned position against a caller-side ordinal falsely refuses a
byte-identical replay of an independently committed operation, which is the defect
the shipped classifier exists to avoid.

Note also the distinction the suites make explicit: replaying the *same records*
is a retry, while *re-executing* an operation against advanced state derives a
different chain link and is therefore conflicting reuse, not a retry. The store
refuses the latter rather than papering over it.

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

---

## 9. Migration checksum binding (patch cycle 1)

Appended so the `file:line` references above stay valid. Operator-relevant
change from Phase 50A patch cycle 1 (Codex audit comment `5135002802`,
finding 4).

The migration ledger (`straylight_schema_migrations`, runner-owned) now binds
each applied version to a deterministic checksum of the shipped migration
content, in a `content_checksum` column. A `BEFORE UPDATE` trigger refuses any
in-place rewrite of a recorded checksum, and the binding is written in the same
transaction as the migration DDL — so a migration that fails partway leaves
neither the schema change, the version claim, nor the checksum.

### 9.1 What you will see

```bash
psql "$STRAYLIGHT_PG_URL" -c \
  'SELECT version, content_checksum, applied_at FROM straylight_schema_migrations ORDER BY version'
```

Each applied row carries a value of the form
`straylight-migration-sha256-v1:<64 hex chars>`. The algorithm identifier is
part of the value, so a future algorithm change is a visible mismatch rather
than a silent reinterpretation of an old digest.

### 9.2 When it refuses, and why that is correct

The checksum is verified **before** any decision that treats a version as
applied: before `migrate` skips it, before the host serves the schema (every
session, state read, and estate listing), and before `rollback` runs a DOWN
file. Verification failure surfaces as `PostgresIntegrityError`:

| Reason | Meaning |
|---|---|
| `migration_checksum_missing` | the ledger claims the version is applied but records no checksum — typically a ledger written before this binding existed. Never backfilled: an unbound claim is not evidence. |
| `migration_checksum_mismatch` | the recorded checksum does not equal the hash of the migration content that ships now. Forged, stale, or the file changed. The runner does not and cannot tell which side moved. |

Either way the store **denies** rather than serving a schema it cannot prove
came from the shipped migration. `rollback` also refuses, deliberately: running
the current DOWN file against a schema applied from different content could
drop or half-drop objects it does not describe.

### 9.3 Operator response

**There is no executable repair route inside Phase 50A's authorized semantics.**
Read that plainly before the steps below, because an earlier revision of this
section directed export → rollback → re-apply (§5.2) — **a route that cannot
execute**. `rollback` verifies the recorded checksum *before* it will run a DOWN
file (`verifyAppliedChecksums`, §9.2), so on a mismatch it refuses, exactly as
designed. Directing an operator at a command guaranteed to refuse is worse than
directing them nowhere: it reads as a remedy and delivers a dead end.

So the response is **fail-closed quarantine and escalation**:

1. **Quarantine the database.** Do not put it into service and do not migrate it.
   The store already refuses to serve it — every session, state read and estate
   listing raises `PostgresIntegrityError` — and that refusal is correct. Leave it
   refusing.
2. **Do not** hand-edit the ledger to make the error go away. That reinstates
   exactly the unbound claim this binding exists to prevent, and it is the one
   action that turns a detected problem into an undetectable one.
3. **Do not** run `rollback` expecting repair. It will refuse on the same
   mismatch (§9.2). The refusal is the safeguard, not a bug to work around.
4. **Take an export first** (§3) if the database holds any estate data. Capture
   the evidence before anything else is attempted; a plain-SQL dump is readable
   even when the schema binding is not provable.
5. **Establish which side moved** — compare the deployed migration files against
   the revision the schema was applied from. The checksum covers both the up and
   the down file, so a changed rollback file is also a mismatch. Record both
   checksums (`recorded` and `shipped`, both in the error message) verbatim.
6. **Escalate with that evidence.** Which side moved decides the remedy, and the
   remedy is a decision with an owner, not a command in a runbook:
   - **shipped content drifted** — restore the correct migration content at the
     revision the schema was applied from, then re-verify. The database was
     never wrong.
   - **the database's schema is stale or unprovable** — that needs an authorized
     migration path, which Phase 50A does not have and this runbook does not
     grant. Escalate; do not improvise one.

Verification of an existing estate stays available throughout, and it is
non-destructive: §4.3's verifier reads and compares without erasing, so a
quarantined estate can be inspected without being destroyed.

Every step here is a non-production procedure in Phase 50A. Nothing in this
section authorizes a production migration or a production rollback, and §8's
unproven pre-production obligations are unchanged.
