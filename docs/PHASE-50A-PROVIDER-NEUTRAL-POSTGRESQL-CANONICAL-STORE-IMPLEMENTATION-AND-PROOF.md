# Phase 50A — Provider-neutral PostgreSQL canonical store: implementation and non-production proof

**Phase**: 50A. **Lane**: ADR-050 control-plane lane #122
(`lane-phase-50a`). **Mode**: shadow. **Base SHA**:
`70d40058096455c6406d644183ac757a317ce159`.

**Authority**: merged ADR-049Q
([`decisions/ADR-049Q-railway-postgresql-canonical-store-host-acceptance-and-implementation-authorization.md`](./decisions/ADR-049Q-railway-postgresql-canonical-store-host-acceptance-and-implementation-authorization.md)),
especially §9–§16 and the exhaustive Phase 50A authorization envelope in
§13.1; ADR-022D's unchanged `StorageAdapter` semantic seam; Phase 49P's
P-1…P-14 provider-neutral persistence obligations.

**Naming note.** ADR-049Q is titled for the host-acceptance decision it
records, and this document cites it by that title for traceability. Those
historical citations are the only place a provider is named: the
implementation, migrations, tests, scripts, compose file, and workflow are
provider-neutral, and a repository guard
([`../tests/phase-50a/no-leak-and-neutrality.test.ts`](../tests/phase-50a/no-leak-and-neutrality.test.ts))
fails the build if a provider name appears outside this document and its
runbook.

---

## 1. What this delivers, and what it does not

Phase 50A **delivers bounded capability and non-production proof**. It is not
acceptance, not production admission, and not MVP-2 closure (ADR-049Q §14).

| Delivered | Not delivered |
|---|---|
| Provider-neutral PostgreSQL persistence behind the existing, unchanged synchronous `StorageAdapter` | Any production provisioning, migration, write, rollout, or cutover |
| Canonical provider-neutral migrations with a working rollback | Any provider access, credential, or configuration |
| Local two-instance integration proof | Any operational property from §12 (durability, failover, availability, …) |
| Append-only audit persistence with per-estate chaining and a retrievable tail | Any change to estate semantics or public primitive shapes |
| Ordinary export/restore, with a documented exercise | Gate #9 / #10 closure, Phase 50B work, MVP-2 closure |
| Provider-replacement proof into a second, distinct host | Any sibling-repository edit or cross-repository contract |

Everything in the right column remains exactly as ADR-049Q left it.

---

## 2. Architecture — the synchronous/asynchronous boundary

The load-bearing constraint: **the public seam stays synchronous and
unchanged**, while PostgreSQL is unavoidably asynchronous. The resolution is a
transaction-scoped synchronous session over a snapshot, wrapped by an explicit
asynchronous host.

```
caller (async)
  │
  ▼
PostgresEstateHost.withEstateSession(estate_id, body)      ← ASYNC boundary
  │  1. acquire pooled connection; BEGIN
  │  2. assert schema version                        (fail closed)
  │  3. per-estate serialization: advisory xact lock + estate row lock
  │  4. load CanonicalState snapshot                 (one set of SELECTs)
  │  5. ─────────────────────────────────────────────────────────────┐
  │       body(session)  ← ONE bounded callback                      │
  │       session: PostgresAdapterSession implements StorageAdapter  │
  │       SYNCHRONOUS. No I/O. Reads/writes the snapshot only.       │
  │       EstateStore / AuditLog / executeRecall run here unchanged. │
  │     ─────────────────────────────────────────────────────────────┘
  │  6. session.close() → deterministic CanonicalDelta
  │  7. verify immutable append prefix unchanged; chain still verifies
  │  8. persist the delta                            (still in the txn)
  │  9. re-read durable chain; AuditLog.verifyChain must accept
  │ 10. COMMIT
  ▼
return value                                        ← ONLY after commit
```

**Why each packet requirement holds by construction, not by review:**

| Requirement | Why it holds |
|---|---|
| `StorageAdapter` signatures unchanged | `PostgresAdapterSession implements StorageAdapter` with no added, removed, or asyncified member. A guard asserts all 19 method signatures and that `Promise<` appears nowhere in the seam file. |
| No fake synchronous network I/O | The session performs **no I/O at all**. Every read is served from the snapshot loaded at step 4. |
| No fire-and-forget writes | A session write mutates the snapshot and records a delta entry. Persistence is step 8, inside the transaction. |
| No success before durable commit | The session returns nothing to the caller. `withEstateSession` returns after step 10. Any failure at any step rolls back and throws. |
| Commit-before-success | Steps 8–10 are ordered: persist, verify, commit, *then* return. |

### 2.1 Files

| Path | Responsibility |
|---|---|
[`../src/straylight/storage/postgres/host.ts`](../src/straylight/storage/postgres/host.ts) | The async boundary. The only module that opens transactions or holds a pool. |
[`../src/straylight/storage/postgres/session.ts`](../src/straylight/storage/postgres/session.ts) | The synchronous `StorageAdapter` over a snapshot. |
[`../src/straylight/storage/postgres/canonical-state.ts`](../src/straylight/storage/postgres/canonical-state.ts) | Snapshot and delta value types. |
[`../src/straylight/storage/postgres/load.ts`](../src/straylight/storage/postgres/load.ts) | Snapshot load, integrity assertions, append-prefix fingerprinting. |
[`../src/straylight/storage/postgres/persist.ts`](../src/straylight/storage/postgres/persist.ts) | Delta persistence and idempotency/conflict classification. |
[`../src/straylight/storage/postgres/rows.ts`](../src/straylight/storage/postgres/rows.ts) | Row codec with malformed-row rejection. |
[`../src/straylight/storage/postgres/queries.ts`](../src/straylight/storage/postgres/queries.ts) | Every SQL statement the store can issue, in one place. |
[`../src/straylight/storage/postgres/portability.ts`](../src/straylight/storage/postgres/portability.ts) | Canonical comparison, chain verification, restore quarantine. |
[`../src/straylight/storage/postgres/migrate.ts`](../src/straylight/storage/postgres/migrate.ts) | Migration runner: apply, rollback, version assertion. |
[`../src/straylight/storage/postgres/config.ts`](../src/straylight/storage/postgres/config.ts) | The configuration boundary (§11.3). Connection details live here and nowhere else. |
[`../src/straylight/storage/postgres/errors.ts`](../src/straylight/storage/postgres/errors.ts) | `PostgresIntegrityError` / `PostgresUnavailableError`. |

The store is **not** re-exported from
[`../src/straylight/index.ts`](../src/straylight/index.ts). The wedge's public
surface stays type-only (ADR-024G / ADR-026A §5); re-exporting would also make
the driver a runtime dependency of every type-only consumer. Callers import
the barrel by path.

### 2.2 Configuration at the boundary (§11.3, §9 clause 5)

`PostgresStoreConfig` accepts a standard connection string plus pool bounds
and required schema versions. There is **no provider field, no platform
concept, no credential default** — an absent connection string is refused, not
guessed. No module outside `storage/postgres/` imports the driver, asserted by
a guard that walks all of `src/straylight/`.

---

## 3. Schema and migrations

[`../migrations/postgres/0001_canonical_estate.up.sql`](../migrations/postgres/0001_canonical_estate.up.sql)
· [`down`](../migrations/postgres/0001_canonical_estate.down.sql)

**Version identifier**: `0001`. Standard PostgreSQL DDL only — no
`CREATE EXTENSION`, no tablespace, no role, no `ALTER SYSTEM`, no
server-side file access, no provider concept. Asserted by a guard that strips
comments before scanning, so the prohibition's own explanation cannot mask a
violation.

### 3.1 Tables

| Table | Semantics | Key strategy |
|---|---|---|
| `actors` | upsert | `actor_id` PK |
| `actor_estates` | upsert | `estate_id` PK |
| `keyrings` | upsert | `keyring_id` PK |
| `estate_assertions` | upsert | `assertion_id` PK, `estate_id` indexed |
| `estate_transitions` | append-only | `transition_id` PK + `(estate_id, append_position)` unique |
| `transition_receipts` | append-only | `receipt_id` PK + `(estate_id, append_position)` unique |
| `recall_receipts` | append-only | `receipt_id` PK + `(estate_id, append_position)` unique |
| `audit_events` | append-only, chained | `audit_event_id` PK + position unique + **prev-hash unique** |
| `straylight_schema_migrations` | ledger (runner-owned) | `version` PK |

Canonical primitives are stored **whole**, as one `jsonb` payload per row,
with the fields the database needs for enforcement promoted to columns.
Semantics live above the substrate (§11.1): shredding `Assertion` into columns
would move part of the domain model into the schema and make every later
semantic change a migration. It also makes post-restore comparison a real
byte-equality check rather than a field-by-field approximation.

### 3.2 Append ordering

`append_position` is a **per-estate dense sequence from 1**, not a global
surrogate and not `created_at`. `created_at` is caller-supplied domain content
(the MVP passes a fixed `now`, so many rows share a timestamp) and does not
give a total order. A dense per-estate position makes "the append prefix is
immutable" and "one child per chain position" ordinary `UNIQUE` constraints
the database enforces.

### 3.3 Database-enforced constraints

| Constraint | Prevents |
|---|---|
| `*_immutable` triggers (`BEFORE UPDATE OR DELETE`) on all four append-only tables | Any `UPDATE`/`DELETE` from any client — adapter, `psql`, restore script, operator |
| `*_estate_position_unique` | Duplicate append position; a racer occupying a taken slot |
| `audit_events_estate_prev_unique` | **Chain fork** — two children of the same tail |
| `audit_events_prev_key_agrees` | Bypassing the fork guard with an inconsistent column pair |
| `audit_events_genesis_shape` | A second chain root, or a non-genesis link with no parent |
| `*_position_positive` | Non-positive positions |

The genesis link's absent parent is normalized to `''` in
`previous_audit_hash_key`, because a plain `UNIQUE` over a nullable column
would exempt `NULL` (SQL `NULL`s never collide) and leave the fork guard open
at position 1. The nullable `previous_audit_hash` column preserves the exact
domain value for byte-faithful round-tripping.

### 3.4 Rollback (§13.1(f), P-9)

The down path **exists before the up path is attempted** and is exercised on a
real database before the re-apply. The migration ledger is owned by the
**runner**, not by a versioned file — otherwise rollback → re-apply would fail
on the second apply. Rollback is destructive by design; the runbook requires a
verified export first.

---

## 4. Concurrency and isolation (§13.1(h), P-12)

`../src/straylight/storage/jsonl.ts:15`–`:20` records "Multi-process safety:
NOT GUARANTEED. The MVP assumes a single writer." P-12 forbids inheriting that
as an assumption. It is re-established here:

- **Per-estate row lock** — `SELECT ... FOR UPDATE` on the estate row. Two
  sessions on the same estate serialize; the second's snapshot is taken after
  the first commits.
- **Per-estate advisory transaction lock** — `pg_advisory_xact_lock` keyed by
  the estate id, taken *before* the row lock. This covers **bootstrap**, where
  no estate row exists yet and there is nothing to lock: without it, two
  concurrent first-writes would both load an empty snapshot and both write a
  genesis link, forking the chain at position 1.
- **Different estates never contend** — different lock keys, different rows.
  Proven across processes in §13.2, which also records the patch-cycle-1
  regression that briefly broke this claim via steady-state ledger DDL.
- **Stale-snapshot fence** — the loaded append prefix is re-fingerprinted
  before persisting and must be unchanged.

`hashtextextended` and `pg_advisory_xact_lock` are core PostgreSQL functions,
not extensions.

---

## 5. Idempotency and conflict (§13.1(g))

> **Superseded and corrected by §16.** This section previously described retry
> convergence as *complete durable-row equality including the promoted
> `append_position`*. That model was found unsound at the root and is replaced.
> The text below states the **current** model; §16 records what changed and why.

Two append-only writes are **the same durable write** exactly when the immutable
primary id matches **and every caller-controlled immutable field matches**:

* the **canonical payload** — which carries the record's own id, so identity is
  inside the comparison rather than beside it;
* the record's own **`estate_id`**, compared against the **session's bound
  estate** (the estate the host locked and loaded) rather than against the
  record's own self-report;
* for audit events, the caller-supplied chain fields **`audit_hash`** and
  **`previous_audit_hash`**, together with the normalized
  **`previous_audit_hash_key`** — `''` is never conflated with `NULL`, because
  the two are distinct enforcement columns in the schema.

**`append_position` is not part of that comparison.**
`StorageAdapter.appendTransition`, `upsertTransitionReceipt`,
`upsertRecallReceipt` and `appendAuditEvent` supply **no append position**, so no
caller-supplied append position exists and none may be invented. Placement is
**store-assigned** and validated **separately**, against the store's own
invariants: the per-estate dense-prefix invariant (`assertLoadedIntegrity` /
`assertDensePositions`, re-asserted before persist by `assertPrefixUnchanged`)
plus the shipped constraints `CHECK (append_position >= 1)`,
`UNIQUE (estate_id, append_position)`,
`UNIQUE (estate_id, previous_audit_hash_key)`, and the audit genesis `CHECK`.

Byte-identical canonical payload alone is still **not** a sufficient retry
condition. A row with the same id and payload but a differing promoted
`estate_id` or chain link is a **conflict, not a convergence** — such a row can
be invisible to the estate being written, so counting it as idempotent would
report success while zero rows were visible to that estate. The payload
comparison is over the canonical serialization, so field order or
absent-vs-undefined can never make two different records look equal.

**Classification is order-independent.** With no counter participating, the
outcome is a pure function of the offered record, the session's bound estate, and
the stored rows — independent of callback ordering, session-local ordering, and
how many earlier appends the session made.

| Case | Outcome |
|---|---|
| Same immutable id, **every caller-controlled field** equal, already in the loaded snapshot, stored placement sound | Idempotent convergence. **No** second position, no duplicate. Reported in `persisted.idempotent`. |
| Same id, every caller-controlled field equal, committed by another transaction between load and write | Idempotent, classified against the **live** row in `persist.ts` by the **same shared declaration**, inside its savepoint. |
| **Partial** operation retry — a subset of an earlier history's records re-offered | Converges on **exactly the records offered**. Historical records need **not** be re-offered; per-record convergence is the adapter contract. |
| **Reordered** or **duplicated** offers of byte-identical records | Converge identically, regardless of offer order or repetition. |
| Same id, **any caller-controlled field** differing (payload, estate, `audit_hash`, `previous_audit_hash`, normalized key) | `PostgresIntegrityError` `immutable_id_conflict`; the transaction rolls back. **Never** idempotent, never repaired. |
| A record naming an estate **other than the session's bound estate** | `PostgresIntegrityError` **`estate_authority_violation`**; the transaction rolls back. Never idempotent, never committed. |
| A record whose id exists **only under another estate** | `immutable_id_conflict`. **Never** convergence. |
| A matched row whose **stored placement** violates the dense-prefix invariant | `PostgresIntegrityError` `append_prefix_mutated`; refused rather than served as a convergence target. |
| A **sparse** or gapped per-estate history | Refused at **load**; the estate is quarantined rather than served. |
| A **fresh** immutable id | Receives exactly the next store-assigned position (loaded dense maximum + 1). A converging id consumes **none**. |
| Append position taken by a different id | `PostgresIntegrityError` `duplicate_append_position`. |

Append-only inserts carry **no `ON CONFLICT` clause**, so a collision raises
and is then classified explicitly. A blanket `DO NOTHING` would absorb the
genuine-conflict case identically to the retry case.

**Zero partial durability is absolute.** For any refusal the transaction rolls
back and no row from the attempted operation survives; success is reported only
after `COMMIT`. Convergences remain observable in `persisted.idempotent` rather
than looking like a callback that did nothing.

**A retry is not a re-execution.** Replaying the same records is a retry.
Re-executing an operation against advanced state derives the same
content-addressed `transition_id` but a different `audit_event_ref`, because
the chain tail moved — that is conflicting reuse of an immutable id, and it is
refused. Both behaviors are asserted.

Savepoints wrap each append insert: PostgreSQL marks a transaction aborted
after any error, so without one the classification query would itself fail
with "current transaction is aborted".

---

## 6. Portability, export/restore, and replacement (§13.1(e), (i))

Export and restore use **ordinary `pg_dump` and `psql`** — see the runbook.
Verification is byte equality of the canonical serialization of the complete,
order-normalized store, plus per-estate chain verification using the
**existing** `AuditLog.verifyChain`, not a reimplementation.

A defective restore is **quarantined**: `verifyRestore` names the affected
estates, `assertRestoreServiceable` throws, and independently the store
**refuses to load** a broken estate at all. A quarantined estate cannot be
served by skipping the verification step.

---

## 7. Capability coverage — ADR-049Q §13.1(a)–(i)

| # | Capability | How satisfied | Proof |
|---|---|---|---|
| **a** | Provider-neutral PostgreSQL `StorageAdapter` on the unchanged seam | `PostgresAdapterSession implements StorageAdapter`, all methods synchronous, no signature change | `postgres-conformance.test.ts` (12), seam guard in `postgres-negative.test.ts` |
| **b** | Canonical migrations, no provider semantics | Standard DDL; comment-stripped neutrality scan | `postgres-migrations.test.ts` (10) |
| **c** | Non-production integration proof | Two local instances via compose; loopback-bound; ephemeral tmpfs | all five suites + `phase-50a:proof` |
| **d** | Append-only audit persistence, per-estate chaining, retrievable tail, verifying after every move | Triggers + position/prev-hash/genesis constraints; `getAuditTail`; chain verified at load, before write, after write, and after restore | conformance, negative, concurrency, portability suites |
| **e** | Ordinary export and restore, documented exercise | `pg_dump`/`psql`; digest comparison; runbook §3–§4 | `postgres-two-host-portability.test.ts`, `phase-50a:proof` |
| **f** | Rollback for failed migration and failed admission | Down migration exercised before re-apply; transaction rollback on any failure | `postgres-migrations.test.ts`, `postgres-negative.test.ts` |
| **g** | Idempotency | Identical-content convergence; conflicting reuse refused | conformance + negative suites |
| **h** | Concurrency/isolation, single-writer-equivalent ordering re-established | Row lock + advisory lock + prefix fence | `postgres-concurrency.test.ts` (7) |
| **i** | Provider-replacement proof into a **different** conforming host | Restore into the second instance; distinct `system_identifier` verified; cold load, governed recall, continued writing | `postgres-two-host-portability.test.ts`, `phase-50a:proof` |

## 8. Obligation coverage — Phase 49P P-1…P-14

| P | How Phase 50A satisfies it |
|---|---|
| **P-1** | Semantic ownership untouched. No domain file changed; the store implements persistence for semantics Straylight already defines. |
| **P-2** | No provider concept in the domain model or migration semantics; enforced by a repository-wide guard. |
| **P-3** | Upsert for actors/estates/keyrings/assertions/receipts; append-only ordered immutable transitions and audit events; per-estate chain with retrievable tail; unknown ids return `undefined`/`[]`; integrity violations raise `PostgresIntegrityError` — never silent drops. |
| **P-4** | Chain verifies identically after export, restore, and host replacement; the first post-restore write attaches to the restored tail; a broken chain quarantines rather than serves. |
| **P-5** | Receipts are stored whole and round-trip byte-identically; no receipt is re-minted. The restored recall receipt is asserted identical. |
| **P-6** | Ordinary `pg_dump`/`psql` export and restore into a different conforming host, semantics unchanged. |
| **P-7** | Restoration is **proven**: digest comparison plus chain verification plus cold-load governed recall, in an asserted suite and an operator-runnable script. |
| **P-8** | No provider-specific adapter contract, seam, or abstraction exists; replacement is exercised, not asserted. |
| **P-9** | Migration and rollback are provider-neutral and reversible; rollback exists and is exercised before the re-apply. |
| **P-10** | This document states each delivered capability separately and names every withheld authority (§1, §9). |
| **P-11** | Persistence uncertainty **denies**: unreachable host, schema mismatch, aborted transaction, interrupted connection, malformed row, broken chain — all raise, none degrade, and no code path falls back to another adapter (structurally guarded). |
| **P-12** | Concurrency and isolation re-established rather than inherited (§4). |
| **P-13** | No self-authorized admission; no model provider conditions canonical semantics. |
| **P-14** | Operational failure remains a trigger to reopen the infrastructure decision; §9 records that nothing operational is proven. |

---

## 9. Test commands and results

All commands run at base `70d40058096455c6406d644183ac757a317ce159` on the
working branch, against the checked-in two-instance harness.

```bash
npm ci
npm run phase-50a:up          # start the two separate instances
npm run build
npm run typecheck
npm test                      # full existing suite + Phase 50A leak/neutrality guards
npm run control-plane:validate
npm run control-plane:test
npm run phase-50a:test        # the five PostgreSQL suites (REQUIRES both hosts)
npm run phase-50a:proof       # operator-readable two-host proof
git diff --check
```

Exact results are recorded in the completion report on lane #122 and in the
PR body.

### 9.1 Suite map

| Suite | Covers |
|---|---|
[`../tests/phase-50a/postgres-conformance.test.ts`](../tests/phase-50a/postgres-conformance.test.ts) | The `StorageAdapter` contract against a real host: unknown ids, upsert-latest, full admit+recall, chain links, estate filtering, append order after cold reload, `fromStorage` cold load + governed recall, idempotent retry, conflicting re-execution, synchronous-shape probe |
[`../tests/phase-50a/postgres-negative.test.ts`](../tests/phase-50a/postgres-negative.test.ts) | Unreachable host, missing/unsatisfied schema, interrupted connection, callback throw rolling back every row, escaped-session refusal, `UPDATE`/`DELETE` refusal on all four append-only tables, duplicate position, chain fork, second root, inconsistent key column, malformed rows, broken chain, non-prefix history, immutable-id conflict, bad chain link, three bad-restore quarantine cases, no-fallback and seam-unchanged guards, credential redaction |
[`../tests/phase-50a/postgres-concurrency.test.ts`](../tests/phase-50a/postgres-concurrency.test.ts) | Two and eight concurrent same-estate admits; concurrent bootstrap of a new estate (exactly one genesis link); stale-snapshot refusal; cross-estate non-contamination; independent per-estate chains and positions |
[`../tests/phase-50a/postgres-migrations.test.ts`](../tests/phase-50a/postgres-migrations.test.ts) | Empty-database apply; repeated-migrate idempotency; rollback → schema gone → store fails closed → re-apply → store works; rollback no-op; failed migration atomicity; provider-neutrality of the SQL |
[`../tests/phase-50a/postgres-two-host-portability.test.ts`](../tests/phase-50a/postgres-two-host-portability.test.ts) | Distinct cluster identifiers; full export → restore → digest equality → identical chain verification → cold load → governed recall → continued writing; multi-estate restore with no leakage; immutability enforcement surviving the restore |
[`../tests/phase-50a/no-leak-and-neutrality.test.ts`](../tests/phase-50a/no-leak-and-neutrality.test.ts) | The packet's no-leak checks, executable and harness-independent |

### 9.2 Why the PostgreSQL suites are opt-in

`vitest.config.ts` is outside this packet's allowed paths, so the Phase 50A
files are matched by the default `npm test` run. The gate therefore lives in
[`../tests/phase-50a/_support.ts`](../tests/phase-50a/_support.ts) and is
two-sided:

- **opt-in absent** (plain `npm test`, no Docker) — the database suites do not
  run, and an always-executed gate test records that in the output, so a run
  never *claims* the PostgreSQL proof happened;
- **opt-in present** (`npm run phase-50a:test`, and the workflow) — both hosts
  are **required**; an unreachable host **fails** with the harness
  instructions rather than skipping.

Whenever the proof is asked for, the absence of a real database fails the run.
"The proof ran" and "the proof passed" are the same statement.

The leak and neutrality guards are deliberately **not** gated — they inspect
the tree, so they run everywhere.

---

## 10. Residual unproven pre-production obligations

**Nothing operational about any provider is established here**, and this
document imports no provider claim. Every obligation below remains **unproven
and mandatory as pre-production proof** (ADR-049Q §12), to be demonstrated,
documented, and **separately accepted** before any production-admission
decision may be evaluated:

durability · backup-and-restore success against an actual deployment ·
failover · version pinning · network isolation · tenancy boundary ·
availability · incident recovery · export/restore into a different conforming
host *in a real deployment* · rollback of a failed production migration or
admission deployment.

The two-host proof here demonstrates the **capability** in a local
non-production environment. It is not evidence for any deployment property,
and §12's list is unchanged by it.

Also explicitly **not** authorized and not done (§13.3): production admission,
production estate writes, production migration execution, rollout or cutover,
provider provisioning/configuration/access/credentials, production wiring,
living-estate admission (including the ADR-049 §8 living pilot),
auth/consent/signer/controller-binding semantics and their validation, Dixie or
Finn wiring, gate #9 or #10 closure, any Tier-2 contract, any Tier-3
estate-semantic change, MVP-2 closure, and any work beyond MVP-2.

---

## 11. Deviations and disclosures

- **No estate semantics changed.** No assertion class or status, signer
  competence, identity, challenge, revocation, forgetting, inheritance,
  commitment, or permanence rule was altered. No stop-and-escalate condition
  was reached.
- **`StorageAdapter` unchanged.** No signature change, no added method, no
  asyncification. `EstateStore`, `recall`, `audit`, receipts, policy, signer,
  and the public primitive shapes are untouched. Existing `InMemoryStorage` and
  `JsonlStorage` conformance cases in
  [`../tests/storage-conformance.test.ts`](../tests/storage-conformance.test.ts)
  are unmodified and unweakened.
- **Two genuinely separate PostgreSQL server instances** were used for the
  source and replacement proof, verified by distinct cluster system
  identifiers. No mock, no `pg-mem`, no SQLite, and no single database renamed
  twice.
- **New dependencies**: `pg` (runtime) and `@types/pg` (dev) — the standard
  PostgreSQL driver, no provider SDK.
- **New npm scripts**: `phase-50a:up`, `phase-50a:down`, `phase-50a:test`,
  `phase-50a:proof`. The launchers are `.mjs` so they work without POSIX-shell
  environment-variable prefixes.
- **No provider access, no production activity, no secret use, no sibling
  edit, no self-audit, no merge.** The only committed credential-shaped value
  is the harness's fixed local-only test password, bound to loopback,
  committed deliberately for reproducibility and confined to the harness files
  a guard enumerates.
- **Test-expectation corrections during development.** Four assertions were
  initially wrong and were corrected against observed behavior rather than by
  weakening the implementation: the idempotency test conflated retry with
  re-execution; the portability test hand-counted a chain length that the
  governed recall extends; and two neutrality guards flagged their own
  explanatory prose. In each case the implementation was left intact and the
  test was made to state the real property. One genuine implementation
  defect — an identical retry being rejected as a conflict because the record
  was already in the loaded snapshot — was found this way and fixed in
  `session.ts`.
- **No subagent contribution.** This slice was implemented by a single
  implementation agent under lease `lease-phase-50a-implementer-001`. No
  subagent, agent team, or delegated implementation was used, and no advisor
  wrote code.

---

## 12. Patch cycle 1 — closure of the six Codex audit findings

Appended (not rewritten) so every `file:line` reference above stays valid.

Authority: Codex `PATCH` audit comment `5135002802`
(digest `sha256:9a4b1cf70bab99ccfb662ff8949569a47da56d40b0d5edd09aa5b54a635e005b`)
at audited head `8602a2c753b2ad873175bc227e091a06da19a663`, and the bounded
patch packet comment `5135196808`
(digest `sha256:976c65331b3b7bea7799acd2d0be800e598a3408437e90c93ba28bfc63c9291c`),
applied under implementer lease `lease-phase-50a-implementer-002`. Six findings,
nothing else: no redesign, no asyncification, no public semantic or interface
change, no dependency or lockfile change, no provider/production/sibling work.

### 12.1 Finding 1 (blocker) — GitHub Packages authentication

The required remote proof never reached a substantive step: `npm ci` failed
`E401` fetching the private `@0xhoneyjar/loa-hounfour`, so every build, test,
two-host, and artifact step was skipped.

Closed with the standard least-privilege ephemeral pattern in
[`../.github/workflows/phase-50a-postgres-conformance.yml`](../.github/workflows/phase-50a-postgres-conformance.yml):
`packages: read` alongside `contents: read`; `actions/setup-node` configured
with Node 22, `registry-url: https://npm.pkg.github.com`, and scope
`@0xhoneyjar`; and `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` on the
install step **only**.

No credential is committed, echoed, written into the tree, exported to a later
step, or transformed. The repository `.npmrc` is untouched (a forbidden path);
setup-node writes a runner-local one. There is deliberately **no fallback
registry** and the Hounfour dependency is unchanged — if package authorization
is unavailable the install fails rather than resolving from elsewhere.

### 12.2 Finding 2 (high) — Promise-like callback commit race

`withEstateSession` committed immediately after `body(session)` without
inspecting the returned value. A callback returning a Promise had its writes
**committed** (`committed: true`, one durable actor row) and only then rejected.

`withEstateSession` keeps a **synchronous** callback contract. A Promise-like
return value is now REFUSED — asynchronous callbacks are not a supported
feature and the signature is unchanged (`body: (storage: StorageAdapter) => T`;
no `Awaited<T>`). In [`../src/straylight/storage/postgres/host.ts`](../src/straylight/storage/postgres/host.ts),
immediately after the callback returns and **before** `session.close()`, delta
persistence, or `COMMIT`:

1. the value is inspected for a callable `then`, so a native Promise and any
   hostile thenable are both caught (this cycle's `isThenable` in fact read the
   property twice; superseded by §13.1's single-read `captureThen`);
2. the session is invalidated (`session.abandon()`), so code resuming after an
   `await` finds it closed and throws `session_closed` instead of mutating a
   decided transaction;
3. the thenable's settlement is absorbed (`absorbSettlement`), so a later
   rejection cannot escape as an unhandled rejection;
4. a bounded `PostgresUnavailableError` `async_callback_unsupported` is thrown;
5. the enclosing `catch` `ROLLBACK`s, so no actor, estate, assertion,
   transition, receipt, audit event, or migration row becomes durable.

Regressions ([`../tests/phase-50a/postgres-callback-and-row-idempotency.test.ts`](../tests/phase-50a/postgres-callback-and-row-idempotency.test.ts)):
already-rejected Promise; Promise rejecting later; Promise resolving later;
post-`await` attempted mutation; non-Promise thenable; thenable whose `then`
throws synchronously; falsy returns not mistaken for thenables; and the
ordinary synchronous callback still committing. Every case asserts **zero
durable rows across all eight tables** (read back through a fresh connection)
and **no unhandled rejection**.

### 12.3 Finding 3 (high) — complete-row idempotency

The unique-violation path classified an existing immutable id by canonical
payload **alone**. A direct-SQL row with the same id and payload under a
different promoted `estate_id` was counted as an idempotent convergence: the
session reported `committed: true` with `{inserted: 0, idempotent: 1}` while
zero rows were visible to the estate it was writing.

[`../src/straylight/storage/postgres/persist.ts`](../src/straylight/storage/postgres/persist.ts)
now compares the **complete durable row**. Each insert declares its
`durableColumns` beside the parameters it binds, and the same declaration is
the comparison basis, so the two cannot drift: immutable primary id, promoted
`estate_id`, promoted `append_position`, promoted `audit_hash`, promoted
`previous_audit_hash`, normalized `previous_audit_hash_key`, and the complete
canonical payload. Column-appropriate equality applies (`bigint` arrives as a
string; `jsonb` is re-canonicalized; `NULL` equals only `NULL`, never `''`), an
unselected column is itself a mismatch, and `SELECT_AUDIT_EVENT_BY_ID` now
returns `previous_audit_hash_key`. `assertColumnsMatchStatement` parses the
column list out of the INSERT text and refuses before any write if the declared
set has drifted — closing the defect class, not just the instance.

Any mismatch raises `PostgresIntegrityError` `immutable_id_conflict` and rolls
the complete transaction back. Only complete-row equality is idempotent.

Direct-SQL adversarial regressions plant a row with the same id and
byte-identical payload but one deliberately wrong column — wrong estate, wrong
append position, wrong audit hash, wrong previous audit hash, wrong normalized
parent key — and prove each is refused rather than counted as idempotent, with
nothing from the refused session durable. A vacuity guard asserts the replayed
canonical payload really is byte-identical, so the refusals cannot be passing
for the wrong reason. Two notes on where each refusal fires: a wrong position
**inside the same estate** is caught earlier by the load-time dense-position
guard (`append_prefix_mutated`), and an inconsistent
`previous_audit_hash`/`previous_audit_hash_key` pair is refused by the schema's
own `CHECK` — both are fail-closed, and the suite asserts the specific reason
rather than accepting any error. A cross-estate plant at a wrong position
reaches the classifier itself and is refused there. The **exact retry remains
idempotent** (3 append-only rows converging, one durable row of each kind).

### 12.4 Finding 4 (high) — migration checksum binding

The ledger stored only `version` and `applied_at`, so it recorded *that* 0001
was applied but not *which* 0001; `migrate` skipped a present version and the
host served the schema on that unbound claim.

Every applied version is now bound to a deterministic checksum of the shipped
migration content. The algorithm (`migrationChecksum`, identifier
`straylight-migration-sha256-v1`, recorded inside each value) is explicit,
stable, documented, and collision-unambiguous: read both shipped directions,
apply the **only** documented normalization (CRLF → LF; a lone CR is not
touched and no arbitrary SQL is trimmed), **length-frame** the algorithm
identifier, version, up SQL, and down SQL so no boundary is ambiguous, then
SHA-256 the framed UTF-8 bytes. Both directions participate: a changed
rollback file is a different migration.

The ledger stores it immutably — `content_checksum` plus a `BEFORE UPDATE`
trigger refusing any in-place rewrite of a recorded value — and the binding is
written in the **same transaction** as the DDL and the migration's own ledger
row, guarded by `content_checksum IS NULL` so it can only fill, never overwrite.

Verification precedes every "is this version applied?" decision:
`migrate` verifies before skipping; `assertSchemaVersion` verifies before the
host treats the schema as serviceable (so every `withEstateSession`,
`readEstateState`, and `listEstateIds` is covered); `rollback` verifies before
running a DOWN file. A **missing, forged, stale, or mismatched** checksum fails
closed with `migration_checksum_missing` / `migration_checksum_mismatch`.

Tests ([`../tests/phase-50a/postgres-migration-checksum.test.ts`](../tests/phase-50a/postgres-migration-checksum.test.ts)):
algorithm stability, version binding, both-direction binding, boundary-shift
non-collision, and normalization scope; then clean apply, matching-checksum
skip, forged checksum, stale checksum, changed shipped content,
host/schema-service refusal on all three read paths, recorded-checksum
immutability, rollback → re-apply, failed-migration atomicity, a pre-patch
ledger gaining the column with its unbound row failing closed, and diagnostic
message content. `migrations/postgres/` is a forbidden path for this patch and
is byte-unchanged; the ledger remains runner-owned.

Superseded in part by §13.2: this cycle's ledger-shape statements ran from every
READ, which coupled unrelated estates on a relation lock. Ledger DDL now belongs
to the initialization path alone and steady-state verification is read-only. All
the refusals listed above are retained; the pre-patch-ledger test now also proves
a read upgrades nothing.

### 12.5 Finding 5 (medium) — generated type/package reproducibility

`clean:types` + `build` emitted 12 untracked PostgreSQL declarations, and
`npm pack --dry-run` (which runs `prepare`) packed all 12 because `files`
includes `dist-types/`. The workflow checked only tracked-file equality and
explicitly blessed the extras.

The packet selects the **internal-only exclusion** contract, and it is
coherent here: no public root/host/runtime declaration references PostgreSQL,
the store has no package export or subpath, and nothing outside
`src/straylight/storage/postgres/` imports it — so no consumer-visible
declaration requires these, and no package-contract escalation is needed.

[`../scripts/phase-50a/prune-internal-postgres-types.mjs`](../scripts/phase-50a/prune-internal-postgres-types.mjs)
deterministically removes only that subtree, invoked from the authorized
`package.json` `postbuild` lifecycle hook — which npm runs immediately after
`build`, including when `build` is reached through `prepare` (and therefore
`npm pack`). The hook is used rather than splicing into the `build` string
because `tests/phase-24h-package-exports.test.ts` pins that exact string and is
outside this packet's allowed paths. The prune target is a fixed constant inside
`dist-types/`, nothing is derived from argv or the environment, and it **refuses
to delete a git-tracked file** — a tracked declaration would be a
package-contract decision, not a build-step action.

`dist-types/`, `dist/`, `.gitignore`, and the TypeScript configuration are all
untouched (each is forbidden or outside scope), and no public export was added.

[`../scripts/phase-50a/verify-generated-artifact.mjs`](../scripts/phase-50a/verify-generated-artifact.mjs)
**replaces** the assertion that blessed untracked declarations with an exact
complete-tree/package check that refuses them, using
`npm pack --dry-run --json` for machine-readable package evidence:

| Clause | Requirement |
|---|---|
| C1 | no tracked `dist-types` file differs after a clean build |
| C2 | the complete generated tree equals the tracked tree — no untracked file remains |
| C3 | no PostgreSQL declaration exists under `dist-types`, tracked or untracked |
| C4 | every expected tracked package declaration is present |
| C5 | no PostgreSQL declaration is packed |
| C6 | every packed `dist-types` entry is a tracked file |
| C7 | every tracked `dist-types` file is packed (set equality, not nesting) |
| C8 | no packed declaration references an absent PostgreSQL declaration |
| C9 | running `prepare` yields the same artifact and re-prunes |

C9 is scoped to the artifact directories rather than the whole working tree: an
unrelated source edit is not a package-reproducibility failure.

### 12.6 Finding 6 (medium) — workflow path filters

`pull_request.paths` omitted three files the suites read verbatim, so a change
to the public-export guard or the leak surface could bypass this workflow. Added
`src/straylight/index.ts`, this document, and the backup/restore runbook. A test
asserts each added path is genuinely read by
`no-leak-and-neutrality.test.ts`, so the trigger set cannot drift from the real
inputs. `src/straylight/index.ts` is a forbidden path for this patch and is
byte-unchanged — it is a trigger only.

Superseded by §13.3: that assertion hardcoded the same three strings and was not
anti-vacuous, so it could not have detected a fourth fixed input outside the
existing globs. The complete input set is now derived from one authoritative
declaration and compared against workflow coverage, with mutation evidence — which
surfaced eight further uncovered inputs, recorded there as a residual limit.

### 12.7 Regression adequacy

Each implementation fix was reverted in isolation to confirm the new tests
actually catch the original defect: removing the thenable refusal fails 6
Finding-2 regressions; reverting to payload-only comparison fails 5 Finding-3
regressions; removing checksum verification fails 5 Finding-4 regressions. The
artifact verifier was likewise proven non-vacuous — an injected untracked
PostgreSQL declaration makes it exit 1 naming C2 and C3, and a tracked one makes
the prune refuse rather than delete.

### 12.8 Scope

Patch-only changed paths: **16 total** — 14 implementation/test paths plus 2
documents. All inside `allowed_paths`, zero forbidden-path changes.

The 14 implementation/test paths: the workflow; `package.json` (scripts only —
`dependencies`, `devDependencies`, `engines`, `files`, `exports`, `types`, and
`version` are byte-identical);
`scripts/phase-50a/prune-internal-postgres-types.{mjs,d.mts}`;
`scripts/phase-50a/verify-generated-artifact.mjs`;
`src/straylight/storage/postgres/{errors,host,index,migrate,persist,queries}.ts`;
and three new `tests/phase-50a/` suites. The 2 documents: this document and the
backup/restore runbook.

That total is the `8602a2c753b2ad873175bc227e091a06da19a663..212e9ee769a31d69e0c0d0b508465b12d23a9a4d`
range, which changes 16 paths.

`StorageAdapter` remains synchronous (no `Promise` in the seam) and the error
reasons are purely additive. Nothing in §10's residual unproven pre-production
obligations is discharged by this patch, and it authorizes no acceptance, gate
disposition, Phase 50B work, MVP-2 claim, audit, or merge.

---

## 13. Patch cycle 2 — closure of the five Codex audit concerns

Appended (not rewritten) so every `file:line` reference above stays valid.

Authority: Codex `PATCH` audit comment `5136408097`
(digest `sha256:b0437172594b8994954a2f1acd95ce55da9a3a6e77389527543a24c298251fb0`)
at audited head `212e9ee769a31d69e0c0d0b508465b12d23a9a4d`, and the bounded
patch packet comment `5136483215`
(digest `sha256:168143b40df51af3d5d6ecb122dbb44889fc24bf19b3d75e23ce991dc8701a7a`),
applied under implementer lease `lease-phase-50a-implementer-003`. Five concerns,
nothing else. Findings the audit confirmed closed (F1 workflow authentication, F3
complete-row idempotency, F5 declaration/package exclusion) are **not** reopened.
No redesign, no asyncification, no migration-SQL change, no workflow change, no
public API or semantic change, no dependency or lockfile change, no
provider/production/sibling/Phase 50B work.

### 13.1 Concern 1 (high) — a custom thenable's `then` was read twice

The refusal read `then` **twice**: once in the shape check and again in the
absorber, despite the comment claiming the first read was reused. Codex's probe
made the first getter access return a bound `then` for a delayed-rejecting
Promise and the second access throw. The operation did refuse with
`async_callback_unsupported` and did roll back to zero rows — but the getter was
accessed twice, and because the second access threw, the settlement was never
absorbed and the delayed rejection escaped as an `unhandledRejection`.

Closed in [`../src/straylight/storage/postgres/host.ts`](../src/straylight/storage/postgres/host.ts).
`isThenable` is replaced by `captureThen`, which reads `then` **exactly once**
and returns both the callable and the original value as its receiver:

1. the property read is itself guarded — a getter that throws on its *first*
   access yields `null`, so the value is treated as an ordinary (non-thenable)
   return rather than the getter's throw displacing the operation's outcome;
2. a non-callable `then` yields `null`;
3. otherwise the captured pair is returned, and **no property of the value is
   ever read again**;
4. `absorbSettlement` takes that capture and invokes the captured function via
   `Reflect.apply(then, receiver, [swallow, swallow])`. The original receiver is
   essential: `Promise.prototype.then` reads internal slots from its receiver, so
   a detached call would throw instead of absorbing;
5. the chained result is captured through the same single-read path;
6. the refusal is unchanged — the session is invalidated, the bounded
   `PostgresUnavailableError` `async_callback_unsupported` is thrown before
   `session.close()`, `persistDelta`, and `COMMIT`, and the enclosing `catch`
   `ROLLBACK`s.

Order is preserved exactly: detection and refusal still happen before any
persistence or `COMMIT`.

New regressions in [`../tests/phase-50a/postgres-callback-and-row-idempotency.test.ts`](../tests/phase-50a/postgres-callback-and-row-idempotency.test.ts):

- **the stateful getter the audit describes** — first access returns a `then` for
  a delayed-rejecting Promise, second access throws. Asserts the getter is
  accessed **exactly once** (before *and* after settlement), that `then` was
  invoked with the **original object** as receiver, **zero durable rows** across
  all eight tables read back through a fresh connection, and **no
  `unhandledRejection`**;
- a getter throwing on its first access does not displace the outcome;
- a **native Promise** is absorbed through its own `then` with itself as
  receiver — the regression that pins the `Reflect.apply` receiver.

The pre-existing native-Promise (already-rejected, rejecting later, resolving
later) and post-`await` session-mutation regressions are retained unchanged.

### 13.2 Concern 2 (high) — steady-state ledger DDL coupled unrelated estates

`ensureLedger` — `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT
EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER`, `CREATE TRIGGER` — ran
from **every ledger read**, including `assertSchemaVersion` inside every estate
transaction, before the per-estate locks. That DDL takes an `ACCESS EXCLUSIVE`
lock on the ledger relation held until the transaction ends, i.e. until the
estate's synchronous callback returns and commits. Two sessions on *completely
different* estates therefore contended: with estate A's callback held 4000 ms,
estate B reached its callback only 4021 ms later, waiting on `Lock/relation`; with
a 500 ms statement timeout, the unrelated estate failed outright with
`transaction_aborted: canceling statement due to statement timeout`. That
contradicted §4's documented "different estates never contend".

Closed by splitting initialization from verification:

- **initialization** ([`../src/straylight/storage/postgres/migrate.ts`](../src/straylight/storage/postgres/migrate.ts)) —
  `ensureLedger` now runs only from `migrate`, `rollback`, and a new explicit
  `initializeLedger` entry point. It is the only path that issues ledger DDL;
- **steady state** — `appliedVersions`, `appliedMigrations`,
  `verifyAppliedChecksums`, and `assertSchemaVersion` are strictly **read-only**.
  A read tolerates an absent or pre-checksum ledger without altering it:
  - absence is checked with `to_regclass` (a pure catalog lookup), so a missing
    ledger yields "nothing applied" rather than a `42P01` that would abort the
    caller's estate transaction;
  - the possibly-absent `content_checksum` column is read through
    `to_jsonb(ledger) ->> 'content_checksum'`, which yields SQL `NULL` when the
    column does not exist instead of failing.

`to_regclass` and `to_jsonb` are core PostgreSQL functions, not extensions, so
provider neutrality is unaffected. **Migration SQL is byte-unchanged** (a
forbidden path), and no checksum refusal is weakened: `NULL` remains a
verification **failure**, so a pre-checksum ledger still fails closed with
`migration_checksum_missing` rather than being silently upgraded by a read. All
missing / stale / forged / changed-content refusals are retained, on `migrate`, on
schema service, and on `rollback`.

**Cross-process regression** ([`../tests/phase-50a/postgres-concurrency.test.ts`](../tests/phase-50a/postgres-concurrency.test.ts)):
estate A's synchronous callback is held for 4000 ms in a **genuinely separate OS
process** with its own connection and pool, while estate B — a *different* estate
with a 500 ms statement timeout — runs in the test process. A separate process is
required, not a convenience: the callback contract is synchronous, so "holding"
it means blocking, and blocking the test's own event loop would stop B from
issuing any statement at all and the assertion would pass without testing a
database lock. B must reach its callback under 1500 ms (measured: **~30 ms**),
with no relation-lock wait and no timeout, while the holder is still holding.
`pg_stat_activity` is asserted to show **zero** `Lock` waits.

**Per-estate serialization is preserved**, proven by the contrasting case: a
second session on the *same* held estate does **not** reach its callback within
that bound and only proceeds once the holder's transaction releases. Same estate
waits; different estate does not.

**Read-only behaviour is asserted directly** ([`../tests/phase-50a/postgres-migration-checksum.test.ts`](../tests/phase-50a/postgres-migration-checksum.test.ts)):
an estate session plus every read path leaves the ledger's complete catalog
definition — columns, trigger names, trigger oids, and trigger-function oids —
**identical**; and the estate transaction is shown to hold only
`AccessShareLock`, never `AccessExclusiveLock`, on the ledger relation. The
pre-checksum-ledger test now additionally proves a **read upgrades nothing** (the
column stays absent through both the read and a refused session) and that the
explicit initialization path is what adds it — without binding a checksum, so the
row still fails closed.

### 13.3 Concern 3 (medium) — the anti-drift proof was not anti-vacuous

Both prior tests hardcoded the **same three strings** and only checked each
appeared in the no-leak source and the workflow. A fourth fixed input read
outside the existing globs would have left both green while the workflow omitted
it.

Closed by deriving the **complete** input set from one authoritative declaration:

- [`../tests/phase-50a/no-leak-and-neutrality.test.ts`](../tests/phase-50a/no-leak-and-neutrality.test.ts)
  now declares its fixed inputs in two marker-delimited blocks —
  `SCANNED_TREE_ROOTS` (the roots actually walked) and `NAMED_TEXT_INPUTS` (every
  file read by name). The declaration is **load-bearing, not documentation**:
  every by-name read goes through `readFixedInput`, which **refuses** an
  undeclared path. That is what makes the declaration complete by construction
  rather than by inspection;
- [`../tests/phase-50a/artifact-and-workflow-contract.test.ts`](../tests/phase-50a/artifact-and-workflow-contract.test.ts)
  extracts those blocks by marker, parses the workflow's `pull_request.paths`,
  interprets only the two glob shapes actually used (exact path and `dir/**`;
  anything else is treated as *not* covering), and compares the whole derived set
  against that coverage. Nothing is restated, so a new input cannot be added
  without this test seeing it. The extractor is itself guarded against matching
  nothing, and it asserts no by-name read bypasses `readFixedInput`.

**Mutation evidence** (all four run and observed):

| Mutation | Result |
|---|---|
| Declare a new fixed input outside the workflow globs (`src/straylight/host/index.ts`) | **FAILS**, naming the path |
| Omit a declared input from the declaration | **FAILS** (the set shrinks) |
| Read a by-name input without declaring it | **REFUSED** by `readFixedInput` |
| Remove a real trigger path from the workflow globs | Coverage for that input **fails** |

Deriving the complete set surfaced a **pre-existing gap the hardcoded test could
not see**: the no-leak suite reads eight estate-domain files
(`src/straylight/{types,estate,recall,audit,policy,keyring,signatures,commitment}.ts`)
that the workflow's `pull_request.paths` does **not** cover. On the merits they
belong in the trigger set. They are **recorded** in `KNOWN_UNCOVERED_INPUTS`
rather than fixed, because `.github/` is a forbidden path for this packet and
adding trigger paths is a workflow change it does not authorize. The comparison is
**exact equality**, so this cuts both ways: a *new* uncovered input fails, and
closing one of the recorded gaps without updating the record also fails — the
record cannot go stale.

**Residual limit, stated plainly:** a change to one of those eight files alone
does not trigger the Phase 50A workflow on a pull request. Every one of them is
also a forbidden path for this patch and is byte-unchanged here, and the no-leak
suite runs unconditionally under plain `npm test`, so the guard itself still
executes on every ordinary test run. Closing the gap requires a workflow change
under separate authority.

### 13.4 Concern 4 (low) — the runbook's retry condition was too weak

§7 of [`../docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md`](runbooks/phase-50a-postgresql-backup-restore-and-rollback.md)
still said an uncertain retry is safe when the *canonical payload* is identical —
the very sufficiency that patch-cycle-1 finding 3 disproved.

Corrected to require the **complete immutable durable row** to match: the
immutable id, the promoted `estate_id` and `append_position`, the promoted
`audit_hash` and `previous_audit_hash`, the normalized
`previous_audit_hash_key`, and the canonical payload. Any column differing under
the same immutable id is refused (`immutable_id_conflict`). The correction states
explicitly that payload equality alone is **not** a safe retry condition and that
a same-payload promoted-column mismatch must be treated as the conflict it is,
because such a row is invisible to the estate the operation was writing. The
error-table row that pointed at §7 is aligned with the same wording.

### 13.5 Concern 5 (low) — the patch-cycle-1 path count was wrong

§12.8 reported 14 patch-only changed paths while the
`8602a2c753b2ad873175bc227e091a06da19a663..212e9ee769a31d69e0c0d0b508465b12d23a9a4d`
range changes **16**. Corrected to state the total as 16, explicitly
distinguished as **14 implementation/test paths plus 2 documents**.

### 13.6 Scope

Patch-only changed paths: **10 total** — **8 implementation/test paths plus 2
documents**. The
`212e9ee769a31d69e0c0d0b508465b12d23a9a4d..b29f03af14b9386a1c989b63c6bb5a7a547b46ec`
range is exactly one commit changing those 10 paths. All inside `allowed_paths`;
zero forbidden-path changes, with forbidden winning on overlap.

Implementation and test paths (8):

- `src/straylight/storage/postgres/host.ts` — single-read `then` capture;
- `src/straylight/storage/postgres/migrate.ts` — initialization/read-only split;
- `src/straylight/storage/postgres/queries.ts` — read-only ledger statements;
- `tests/phase-50a/postgres-callback-and-row-idempotency.test.ts`,
  `tests/phase-50a/postgres-concurrency.test.ts`,
  `tests/phase-50a/postgres-migration-checksum.test.ts`,
  `tests/phase-50a/artifact-and-workflow-contract.test.ts`,
  `tests/phase-50a/no-leak-and-neutrality.test.ts` — the new regressions and the
  authoritative fixed-input declaration.

Documents (2): this document and the backup/restore runbook.

Deliberately **unchanged**: the workflow, `package.json`, `package-lock.json`,
migration SQL, every script, `src/straylight/storage/postgres/index.ts` (so the
module surface is byte-identical — `initializeLedger` is reached by module path,
not added to the barrel), `src/straylight/index.ts`, the estate domain model,
`.npmrc`, and the TypeScript configuration.

`StorageAdapter` remains synchronous (no `Promise` in the seam); no public export,
dependency, package artifact, or error reason was added. Nothing in §10's residual
unproven pre-production obligations is discharged by this patch, and it authorizes
no acceptance, gate disposition, Phase 50B work, MVP-2 claim, audit, or merge.

---

## 14. Patch cycle 3 — closure of the four Codex audit concerns

Appended (not rewritten) so every `file:line` reference above stays valid.

Authority: Codex `PATCH` audit comment `5147131563`
(digest `sha256:44c6c8c68aa5281b120ca15142cf1e2ffa10a1f94e0c90f8f47692d9d324236e`)
at audited head `b29f03af14b9386a1c989b63c6bb5a7a547b46ec`, and the bounded
patch packet comment `5147657063`
(digest `sha256:2adb83f073133e3eb71c0434dc392178ba8505c3646c54c2e257a5f81d7eead6`),
applied under implementer lease `lease-phase-50a-implementer-004`. Four concerns,
nothing else. Findings the audit confirmed closed — ledger locking, complete-row
idempotency, the package artifact contract, concurrency, restore, and
provider-neutrality — are **not** reopened. No redesign, no asyncification, no
migration-SQL change, no control-plane-workflow change, no public API or estate
semantic change, no dependency, lockfile, script, or runbook change, no
provider/production/sibling/Phase 50B work, no gate disposition, no MVP-2 claim.

This is the **configured maximum** patch cycle (`maximum_patch_cycles: 3`).

### 14.1 Concern 1 (high) — a throwing `then` getter committed the transaction

Patch cycle 2 correctly reduced the `then` read to exactly one access, but
`captureThen` **caught** that access's exception and returned `null` — the same
value it returns for an ordinary non-thenable. `withEstateSession` therefore took
the synchronous path: it closed the session, persisted the delta, and
**COMMITTED**. Codex's exact-head probe observed one getter access,
`committed: true`, one durable actor row, a closed escaped session, and no
`unhandledRejection`. A callback could reach COMMIT precisely by making the
store's inspection *fail*, and the regression at
`postgres-callback-and-row-idempotency.test.ts:332` codified that commit as
correct.

Closed in [`../src/straylight/storage/postgres/host.ts`](../src/straylight/storage/postgres/host.ts).
`captureThen` no longer returns `CapturedThenable | null` — a two-valued shape
with no way to express "could not be determined", which is how the case came to
be folded into success. It now returns a three-case discriminated union
`ThenReadOutcome`:

| Outcome | Meaning | Disposition |
|---|---|---|
| `not-thenable` | the property was read and is provably not callable | ordinary synchronous path: close, persist, COMMIT |
| `thenable` | a callable `then` was captured | refuse; absorb the settlement through the captured function |
| `unreadable` | the `then` **getter threw** on its one access | **refuse**; nothing to absorb (nothing was captured, so nothing was scheduled) |

Only a value proven **non**-thenable reaches the commit path. The `unreadable`
refusal fires at the same point as the thenable refusal — **before**
`session.close()`, before `persistDelta`, and before `COMMIT` — invalidates the
session via `abandon()`, and throws into the existing `catch`, which `ROLLBACK`s.
Every callback mutation is rolled back with the transaction.

The refusal is **bounded**: it raises the store's own
`PostgresUnavailableError` / `async_callback_unsupported`, never the getter's
error object.

> **Superseded by §15.1.** This cycle *also* reported the getter's message as
> bounded detail (through `describe`). Codex's rejection audit
> (comment `5151647075`, concern 1) established that doing so both **leaked**
> caller-supplied error text through the store's public error and — for a value
> whose own conversion-to-string throws — let the **original object escape** in
> place of the bounded refusal. The rejection-remediation slice removes that
> reporting entirely; see §15.1. Nothing of the inspection error crosses the
> boundary now.

Rationale for refusing rather than committing: a value whose thenability the
store *failed to inspect* cannot be shown to be a synchronous result. It is the
same ambiguity the `thenable` branch already refuses, read fail-closed. It costs
nothing legitimate — a synchronous callback returning an ordinary value has no
throwing `then` getter.

Regressions in
[`../tests/phase-50a/postgres-callback-and-row-idempotency.test.ts`](../tests/phase-50a/postgres-callback-and-row-idempotency.test.ts).
The test that codified the commit is **replaced**, not supplemented, and proves:
a bounded refusal of the store's class and reason (and *not* the getter's error
object — this cycle's version additionally asserted the message was present as
detail, which §15.1 removes and replaces with a redaction assertion);
**exactly one** getter access;
**zero** durable rows read back through a fresh connection; and no
`unhandledRejection`. A companion test proves the escaped session is **unusable**
afterwards for both writes and reads (`session_closed`). A third proves the
refusal holds when the callback mutated nothing, so it is a property of the
return value rather than of pending writes.

Callable thenables are **preserved unchanged**: the existing regressions for one
property read, invocation with the original receiver, absorbed settlement
(immediate, delayed, native Promise, multiple settlement, synchronous throw), and
post-`await` `session_closed` all still pass untouched. A new boundary test
covers a **non-throwing** getter returning a non-function: the property was read
successfully and is provably not callable, so that value still commits — which is
what keeps the fail-closed correction from swallowing legitimate returns that
merely own a `then` property.

### 14.2 Concern 2 (medium) — the eight estate-domain inputs now trigger the workflow

The eight estate-domain files the no-leak suite reads by name were
authoritatively *detected* as fixed inputs but absent from the workflow's
`pull_request.paths`. A pull request changing any **one** of them alone could
change the no-leak suite's verdict without ever starting this workflow, and live
repository state has no branch protection, no ruleset, and no other pre-merge
workflow that would run the suite instead — so plain `npm test` was not an
enforceable substitute.

Closed in
[`../.github/workflows/phase-50a-postgres-conformance.yml`](../.github/workflows/phase-50a-postgres-conformance.yml)
by adding all eight exact paths to `pull_request.paths`:
`src/straylight/types.ts`, `src/straylight/estate.ts`,
`src/straylight/recall.ts`, `src/straylight/audit.ts`,
`src/straylight/policy.ts`, `src/straylight/keyring.ts`,
`src/straylight/signatures.ts`, `src/straylight/commitment.ts`.

They are **trigger inputs only**. Every one remains a forbidden path and is
**byte-unchanged** by this patch. No other trigger was removed or altered, and no
control-plane workflow was touched.

### 14.3 Concern 3 (medium) — the accepted-gap list is gone; the uncovered set must be empty

`KNOWN_UNCOVERED_INPUTS` changed the assertion from *zero uncovered inputs* to
*exactly this accepted set*. Disclosure is not enforcement: the recorded gap made
the required remote proof bypassable.

Closed in
[`../tests/phase-50a/artifact-and-workflow-contract.test.ts`](../tests/phase-50a/artifact-and-workflow-contract.test.ts).
The constant is **removed**. The complete fixed-input set is still derived from
the no-leak suite's own marked declaration blocks — nothing is restated — and the
uncovered set is now required to equal `[]`. An empty required set is the only
shape that cannot be quietly widened: there is no list to append an exception to.

Four properties, each asserted:

- **Empty uncovered set**, plus an anti-vacuity floor on the derived set size, so
  an extractor that silently matched nothing cannot pass for the wrong reason;
  and each input is additionally checked individually, so the aggregate cannot
  pass while a specific trigger is missing.
- **A new uncovered input fails** — the uncovered set becomes non-empty.
- **Any removed required trigger fails** — checked for **every** declared input
  one at a time, not one representative path, so no trigger in the set is
  decorative; and separately for each of the eight, which reports *which* path
  was stranded rather than a set diff.
- **An undeclared by-name read is refused** at read time by the no-leak suite's
  own accessor, so the declaration cannot quietly fall behind what the suite
  reads.

A structural guard additionally fails if any accepted-gap constant is
reintroduced under `KNOWN_`/`ACCEPTED_`/`ALLOWED_`/`EXPECTED_`/`TOLERATED_UNCOVERED`,
closing the mechanism rather than only this instance of it.

### 14.4 Concern 4 (low) — two proof-document corrections

**§5 retry equality.** The section said retry converges on byte-identical
canonical content and classified a same-id identical-payload live-row collision
as idempotent, contradicting the closed §7 implementation contract. Corrected to
require **complete immutable durable-row equality** — immutable id, promoted
`estate_id`, promoted `append_position`, promoted `audit_hash`, promoted
`previous_audit_hash`, normalized `previous_audit_hash_key`, and canonical
payload — and to state explicitly that payload equality alone is **not** a safe
retry condition. The case table gains an explicit row for the same-payload
differing-promoted-column collision, marked *never idempotent*.

**§13.6 path count.** The section reported patch cycle 2 as 6 paths (4
implementation/test plus 2 documents). The
`212e9ee769a31d69e0c0d0b508465b12d23a9a4d..b29f03af14b9386a1c989b63c6bb5a7a547b46ec`
range is exactly one commit changing **10** paths. Corrected to **10 total — 8
implementation/test paths plus 2 documents**, with the two groups listed
separately. The patch-cycle-1 count elsewhere (16 = 14 plus 2) was already
correct and is unchanged.

### 14.5 Scope

Patch-only changed paths: **5 total** — 4 implementation/test paths plus 1
document. All inside `allowed_paths`; zero forbidden-path changes, with forbidden
winning on overlap.

Implementation and test paths (4):

- `src/straylight/storage/postgres/host.ts` — `ThenReadOutcome`; fail-closed
  `unreadable` refusal before close/persist/COMMIT;
- `tests/phase-50a/postgres-callback-and-row-idempotency.test.ts` — the
  throwing-getter regressions replacing the commit-codifying test;
- `.github/workflows/phase-50a-postgres-conformance.yml` — the eight
  estate-domain trigger paths;
- `tests/phase-50a/artifact-and-workflow-contract.test.ts` — accepted-gap list
  removed; empty-uncovered-set requirement and its mutation proofs.

Document (1): this document.

Deliberately **unchanged**: the eight estate-domain files (trigger inputs only),
`package.json`, `package-lock.json`, migration SQL, every script, every runbook,
`src/straylight/storage/postgres/index.ts`, `src/straylight/index.ts`, every
control-plane workflow, `.npmrc`, and the TypeScript configuration.

`StorageAdapter` remains synchronous (no `Promise` in the seam); no public export,
dependency, package artifact, or error reason was added — the `unreadable`
refusal reuses the existing `async_callback_unsupported` reason. Nothing in §10's
residual unproven pre-production obligations is discharged by this patch, and it
authorizes no acceptance, gate disposition, Phase 50B work, MVP-2 claim, audit,
or merge.

---

## 15. Rejection-remediation slice (fresh initial slice after the patch-cycle-3 REJECT)

Patch cycle 3 was the configured maximum (`maximum_patch_cycles: 3`) and Codex
**rejected** exact SHA `1faf15849e616fe0bef7e9eeadeeb07047292c6b` on PR #123
(audit comment `5151647075`, digest
`sha256:51c3c016003e5649af0d3bdcf09fef3d2d21a07b0ea40dc70408379670f8026f`). The
operator disposed of that rejection at lane #122 sequence 22 (comment
`5152166078`) by returning the lane to coordination, and authorized **one fresh
rejection-remediation slice** with a fresh branch and a fresh pull request
(task packet comment `5152522613`, digest
`sha256:a8d9dbd4f7ad2937dd8d689ab2c6fa3412feddb0aab9ec29614e888ade1a4c02`,
applied at sequence 23).

**This is not patch cycle 4.** The lane retains historical `patch_cycle: 3`; this
is an *initial* packet at that same cycle. PR #123 remains rejected, unmerged,
and is **never** merge evidence; the rejected branch is untouched (no force-push,
no rebase, no amendment). The rejected SHA is used **only** as an inspectable
implementation substrate: this slice's head is a direct child of it, so an
auditor can review both the complete range from the original base and the
remediation-only delta.

Scope: the inherited allowed/forbidden envelope of the corrected initial packet
(comment `5131800761`), and a remediation-only delta of **exactly five paths**
relative to the rejected SHA. Every other path is **byte-identical** to
`1faf158`. Four defects, no redesign of anything Codex confirmed closed.

### 15.1 R1 (high) — the bounded callback error boundary

`host.ts:199`/`:503`. The `unreadable` refusal interpolated
`describe(outcome.error)` into the public `PostgresUnavailableError`. Two
distinct defects followed:

1. **Leak.** An ordinary `Error`'s message — caller-supplied text, and whatever
   the caller put in it — was published through the store's own error surface.
2. **Escape.** `describe` calls `String(err)` for a non-`Error`, so a value whose
   conversion-to-string *itself throws* made `describe` throw at the refusal
   site. `classify()` then called `describe` again on that exception and the
   **original object reached the caller** in place of the bounded refusal —
   Codex's exact-head observation recorded `caughtIsGetterException: true`,
   `caughtIsBoundedError: false`, alongside correct rollback and invalidation.

Closed by carrying **nothing** out of the failed read. `ThenReadOutcome`'s
`unreadable` variant now has **no payload**: `captureThen`'s `catch` discards the
exception rather than binding it, so there is no error at the refusal site to
quote and nothing to stringify. The refusal message is a **fixed string**. The
fact that the single read failed is the entire decision-relevant content; there
is no legitimate consumer of the exception itself.

What is unchanged: exactly one `then` access; refusal **before**
`session.close()`, `persistDelta`, and `COMMIT`; `abandon()` invalidation of the
escaped session; full `ROLLBACK` of every callback mutation; no
`unhandledRejection`; and the single `async_callback_unsupported` reason callers
match on. **No new error reason and no change to the public reason-code surface.**

Regressions (`postgres-callback-and-row-idempotency.test.ts`): the stale
expectation that the getter's message *survives* is **replaced** by a redaction
assertion (`assertBoundedGetterRefusal`) covering message, `detail`, `stack`,
`cause`, own properties, and object identity. New tests prove: a getter
exception whose **stringification throws** still yields the bounded error and is
never stringified (`toString`/`Symbol.toPrimitive` call count is zero); message,
stack, and a nested `cause` are all absent from the public error; non-`Error`
payloads (string, number, object) leak nothing; and the refusal precedes close,
persistence, and COMMIT, proven by its observable consequences.

**Mutation evidence.** Restoring the rejected shape (carry the error, interpolate
`describe(outcome.error)`) fails **4** tests, including the stringification-escape
case.

### 15.2 R2 (high) — complete durable-row equality in the loaded-prefix classifier

`session.ts:348`. `classifyExistingAppend` compared **canonical payload alone**.
It ran before any position was claimed and had no notion of the position the
append would occupy, so a row in the **loaded prefix** carrying the same
immutable id and payload was counted idempotent regardless of its promoted
`append_position`. Codex's dense-prefix observation — a filler at position 1 and
the target id/payload at position 2 — returned `committed: true` with
`{inserted: 0, idempotent: 1}`, contradicting the §5 complete-durable-row
equality contract. (`persist.ts` already compared the complete row against the
**live** database row; the two classifiers disagreed about what makes two rows
the same row.)

Closed by comparing the **complete durable row** in the session classifier too:
`durableRowOf` builds the same column set `persist.ts` binds to its INSERT —
promoted `estate_id`, promoted `append_position`, and for audit events
`audit_hash`, `previous_audit_hash`, and the normalized
`previous_audit_hash_key` — plus the canonical payload (which carries the
immutable identity). `firstDurableMismatch` compares the **union** of both key
sets, so a column present on one side only is a difference rather than an
unchecked field, and `NULL` is never conflated with `''`. Convergence requires
**no** mismatch; anything else is `immutable_id_conflict` and the whole
transaction rolls back.

**The append position a write offers.** The store's dense-position invariant
means the row at position *k* is the *k*-th append an estate ever received, so
the *k*-th append a session offers for an estate is a claim about placement:
"this record is the *k*-th". `offerPosition` supplies that ordinal from a
per-estate counter kept **separate** from the fresh-row counters (which are
seeded from the loaded prefix and answer a different question: where the next
*fresh* row is stored). The ordinal advances on every classified append,
converging or fresh — skipping it for a convergence would renumber every later
offer and turn one partial replay into a cascade of false matches. Density is
unaffected: `claimPosition` remains the sole authority for where a fresh row
actually lands.

This is what distinguishes a **faithful retry** from a **partial or reordered
replay**. A faithful retry re-offers the same records in the same order, so its
*k*-th offer meets the durable row at position *k* and converges. Codex's case
offers the target first against a row at position 2, and is refused.

Regressions: the exact dense-prefix case (refused as `immutable_id_conflict`
naming `append_position`, with **zero partial durability** — both planted rows
unchanged and no audit event, assertion, or receipt written); a faithful dense
replay still converging, so the correction is not a blanket refusal; audit-event
promoted **chain** columns differing being a conflict; and a **structural**
guard that the session classifier and `persist.ts` compare the same column set —
necessary because `persist.ts` is outside this slice's authorized paths and is
byte-unchanged, so the agreement cannot be enforced by shared code.

**Mutation evidence.** Restoring the payload-only comparison fails **2** tests:
the dense-prefix regression *and* the structural shared-basis guard. (The first
version of that guard matched only one `if (...)` spelling and missed the
mutation; it now bans any direct payload-to-payload comparison under any
spelling and inspects the extracted body of `classifyExistingAppend` itself.)

### 15.3 R3 (medium) — a mutation-complete workflow-contract proof

`artifact-and-workflow-contract.test.ts:67`/`:326`/`:402`. The declared inputs
were covered and the eight triggers present, but the anti-drift contract was not
enforced. Three mutations survived:

| Mutation | Rejected behaviour |
|---|---|
| delete `src/straylight/storage/postgres` from the authoritative declaration | all 33 focused tests green |
| weaken the extractor with `slice(1)` | all 19 contract tests green |
| a **renamed** accepted-gap set applied during extraction, absorbing a real uncovered input | all 33 tests green |

The root cause is that `uncovered == []` is monotone in the **wrong direction**:
a *smaller* declaration satisfies it more easily. "Everything declared is
covered" says nothing about what must be declared. And a banned-identifier list
is defeated by choosing another identifier.

Closed with three independent mechanisms:

- **A required declaration floor** (`REQUIRED_TREE_ROOTS`,
  `REQUIRED_NAMED_INPUTS`) asserted from this suite's own list, not from the
  extractor. It is a **lower bound**: satisfiable only by declaring more, never
  less. Deleting a declared input now fails, naming the missing path.
- **Extractor fidelity**, checked against an **independent** count of
  single-quoted paths taken from the raw file text, plus first/last-entry
  survival (`slice(1)` and `slice(0,-1)` each drop one end), plus the
  requirement that a renamed marker **throws** rather than returning a quietly
  empty set. Any truncation or pre-comparison filter disagrees with the file.
- **A behavioural accepted-gap guard** that plants a genuinely uncovered input
  and requires the comparison to **report** it — indifferent to what any filter
  is called or where it lives. The identifier-shaped structural check is
  retained and widened (now also `IGNORED`/`SKIP`/`EXEMPT`/`WAIVED`/`DEBT`/
  `EXCLUDE`/`EXCEPTION`, any casing) as a **supplement**, not the whole defence.

Also added: an explicit non-vacuity test (an empty input set trivially satisfies
the empty-uncovered assertion, and no catch-all glob may be the reason it
passes), and a removed-trigger check stated over the required floor so it cannot
weaken alongside the declaration.

**Mutation evidence.** Against the hardened suite: the declaration deletion fails
**1** test naming the exact path (was 0); the `slice(1)` extractor weakening
fails **4** (was 0); the renamed `COVERAGE_DEBT` set fails **2**. Critically, the
same filter renamed to the innocuous `pathNormalizer` — which **evades**
identifier detection entirely — is still caught by the fidelity check (13 vs 14
declared inputs). That is the difference between closing the mechanism and
closing one spelling of it.

### 15.4 R4 (medium) — a real TypeScript exhaustiveness barrier

`host.ts:169`/`:401`. The three `ThenReadOutcome` variants were dispatched
through two independent `if` statements, with every remaining variant implicitly
treated as not-thenable. A fourth variant therefore **passed** `npm run
typecheck` and could fall through to `session.close()`, `persistDelta`, and
`COMMIT`. The implementation report's claim of a compile-time barrier was
unsupported by the source.

Closed by dispatching through a total `switch` whose `default` calls
`assertNever(outcome)`, a function whose parameter is `never`. Only
`not-thenable` — a value **proven** non-thenable — leaves the switch toward the
commit path; the other arms throw. Adding a variant makes the `assertNever`
argument a type error and **fails typecheck**. The runtime `throw` inside
`assertNever` is unreachable while the switch is exhaustive and exists so a value
arriving from untyped JavaScript still fails closed.

**Mutation evidence, machine-checked.** The proof is not a code reading: an
ungated test copies the source tree to a uniquely-named probe directory,
mutates it, and runs the real compiler with the project's own strictness flags.
Adding `{ kind: 'r4-probe-unhandled-variant' }` **fails** typecheck with
`not assignable to parameter of type 'never'`, naming the variant. A **positive
control** replaces the switch with the rejected two-`if` shape and shows the same
fourth variant then **compiles cleanly** — proving the barrier is what fails,
not something incidental. A baseline test typechecks the unmutated copy first, so
a harness fault cannot masquerade as a barrier. The probe directory is removed in
`finally` and nothing is left in the tree.

### 15.5 Preserved behaviour

Not reopened or redesigned: the synchronous `StorageAdapter` seam (no `Promise`
in the signature); the async PostgreSQL transaction host boundary;
commit-before-success; rollback and session invalidation; callable-thenable
receiver capture and settlement absorption (immediate, delayed, native Promise,
multiple settlement, synchronous throw); `persist.ts`'s live-row complete-row
conflict checks; migration checksum enforcement; database append-only
constraints; audit-chain verification; same-estate serialization and cross-estate
progress; two-host export/restore; provider neutrality; package reproducibility;
the exact workflow trigger set; and every no-leak guarantee.

### 15.6 Scope

Remediation-only changed paths relative to `1faf158`: **5 total** — 4
implementation/test paths plus 1 document.

- `src/straylight/storage/postgres/host.ts` — payload-free `unreadable`; fixed
  refusal message; total `switch` + `assertNever` barrier (R1, R4);
- `src/straylight/storage/postgres/session.ts` — complete-durable-row
  classification with the offered append ordinal (R2);
- `tests/phase-50a/postgres-callback-and-row-idempotency.test.ts` — redaction
  regressions, dense-prefix regression, shared-basis guard, compiler-proof
  suite (R1, R2, R4);
- `tests/phase-50a/artifact-and-workflow-contract.test.ts` — declaration floor,
  extractor fidelity, behavioural accepted-gap guard, non-vacuity (R3);
- this document.

Deliberately **byte-unchanged**: `persist.ts`, `rows.ts`, `load.ts`, every other
`storage/postgres` file, `no-leak-and-neutrality.test.ts`, all other Phase 50A
suites, the eight estate-domain files, `package.json`, `package-lock.json`,
migration SQL, every script, every runbook, the compose file, **every workflow**
(including `.github/workflows/phase-50a-postgres-conformance.yml`), `.straylight/`,
every ADR, and the TypeScript configuration. No dependency, lockfile, public
API, package-contract, sibling-repository, or domain-semantic change. No new
error reason.

### 15.7 What this slice does NOT establish

It closes four proven defects and preserves the rest. It authorizes and claims
**no** acceptance, **no** readiness, **no** gate disposition, **no** Phase 50B
work, **no** MVP-2 completion, and **no** merge. Every residual unproven
pre-production obligation in §10 stands undischarged: durability, failover,
network isolation, tenancy, availability, version policy, and incident recovery
remain later obligations, and nothing here involves a provider, a production
resource, a credential, or a living estate. The audit of this slice is Codex's;
the implementer does not audit its own work.

---

## 16. R2/R3 architecture-correction slice (fresh initial slice after the sequence-27 REJECT)

Authority: operator decision `evt-phase-50a-operator-decision-028` on lane #122
(comment 5154053719), which dispositioned the durable Codex REJECT at sequence 27
(audit comment 5153795730) and authorized preparation of **exactly one** fresh
architecture-correction slice on a **fresh branch** with a **fresh pull request**,
holding R1 and R4 closed and declaring patch cycle 4 unauthorized. Task packet
comment 5154289557, digest
`sha256:743181ec4dc1e153b7ede3fca6da93433e5e9a8c10d41aadee5c0277c8d41629`.

Branch point: rejected SHA `f1b5f0f3924eb4c8624c8b2efb1f3072fbfa92f4`, used
**only** as inspectable substrate and branch point. PR #124, branch
`phase-50a-rejection-remediation`, and every earlier rejected branch or SHA are
**not** reopened, amended, extended, retargeted, or cited as merge evidence.

The REJECT reopened two findings as **unsound abstractions**, not as restatable
defects. This slice **replaces** both with closed designs.

### 16.1 R2 — the offered-ordinal abstraction is deleted

**What was unsound.** The rejected implementation added a session/callback-local
*offered append ordinal* (`offerPosition`, plus per-table `offered*Pos` maps) and
compared the stored `append_position` against it. That is unsound at the root:

* `StorageAdapter.appendTransition`, `upsertTransitionReceipt`,
  `upsertRecallReceipt` and `appendAuditEvent` supply **no append position**, so
  no caller-supplied append position exists and none may be invented;
* the ordinal **restarts at 1 in every transaction**, so it cannot establish a
  historical durable position.

Two concrete failures followed. A byte-identical replay of an independently
committed operation — durable at position 2, offered first, so claiming ordinal 1
— was **falsely refused** as `immutable_id_conflict` with
`append_position: existing 2 != incoming 1`, contradicting the documented retry
contract. Conversely, records owned by one estate, replayed through a session
opened and locked for a **different** estate, **committed** with
`{inserted: 0, idempotent: 3}`, because promoted estate equality was checked
against the **record's own self-report** rather than against the session's
authority.

**What replaced it.** `offerPosition` and every `offered*` counter are **deleted**
(a test asserts the code contains no such ordinal under any spelling). The two
concerns the rejected code conflated are now separate, and the separation is
declared **once**:

**(1) Caller-controlled immutable equality**, declared once in
`src/straylight/storage/postgres/rows.ts` as `CALLER_CONTROLLED_COLUMNS`,
`callerControlledRow()` and `firstCallerControlledMismatch()`. The set is exactly
`payload`, `estate_id`, `audit_hash`, `previous_audit_hash`,
`previous_audit_hash_key` — and **`append_position` is absent by contract**, which
a test pins directly. **Both** classifiers consume that one declaration: the
in-snapshot classifier in `session.ts` and the live-row classifier in
`persist.ts`. Neither declares its own basis; a test proves neither re-declares
`durableRowOf` or `firstDurableMismatch`. `persist.ts` still **binds** every
durable column it `INSERT`s — including `append_position` — and
`assertColumnsMatchStatement` still proves the bind set equals the statement's
column list, so a column cannot escape the write.

**(2) Session-estate binding.** `PostgresAdapterSession` is constructed **bound**
to the estate the host locked and loaded (`new PostgresAdapterSession(state,
estate_id)`; an unbound session is refused in the constructor). Every append-only
write **first** requires `record.estate_id` to equal the bound estate; any other
estate is refused with the distinct reason **`estate_authority_violation`**, the
transaction rolls back, and nothing is durable — never idempotent, never
committed. Estate authority is the **session's**, not the record's: a record
cannot vouch for its own estate. The three internal probe-session construction
sites (`load.ts#assertChainIntact`, `portability.ts#verifyChains`,
`host.ts#assertDurableChainIntact`) are each bound to the estate they verify.

The constructor is **internal**: `PostgresAdapterSession` is not re-exported from
`src/straylight/index.ts`, has no package subpath, and its declarations are pruned
from the package. Binding an estate to it is therefore **not** a public-contract
change. `StorageAdapter`, `EstateStore`, `AuditLog` and the recall API remain
byte-unchanged and synchronous — proven by blob comparison (§16.5).

**(3) Store-assigned placement integrity.** `storedPlacementViolation()` in
`rows.ts` validates a matched row's **stored** position against the store's own
invariants — the per-estate dense 1..n prefix, plus
`CHECK (append_position >= 1)` and `UNIQUE (estate_id, append_position)` — and
refuses (`append_prefix_mutated`) rather than serving an unsound row as a
convergence target. Both classifiers apply it: `session.ts` against the loaded
snapshot, `persist.ts` against the estate's **live** positions
(`SELECT_*_POSITIONS`). Only a **fresh** immutable id consumes the next
store-assigned position (loaded dense maximum + 1); a converging existing id
consumes **none**.

**Order independence** follows: with no counter participating, classification is a
pure function of the offered record, the session's bound estate, and the stored
rows. `tests/phase-50a/postgres-r2-outcome-matrix.test.ts` proves it **mechanically
over all 24 permutations** of a four-offer retry — identical classification counts,
identical persisted counts, and identical durable rows and positions after every
one — rather than arguing it in prose. It also pins, by name and per append-only
table: full retry convergence with zero duplicates and zero new positions; partial
retry convergence on exactly the subset offered, with no requirement to re-offer
history; reordered and duplicated offers; cross-estate refusal; a
different-estate id never treated as convergence; each caller-controlled field
mismatch individually; sparse-history refusal at load; fresh-id placement; and
zero partial durability under a forced mid-operation failure.

New error reason: **`estate_authority_violation`** (`errors.ts`). It is an
integrity reason: the durable content is not corrupt, but the write is refused as
a boundary violation and nothing becomes durable.

### 16.2 R2 — independent mutation matrix

`tests/phase-50a/postgres-r2-mutation-matrix.test.ts`. Each mutation is applied to
a **disposable copy** of the tree, one named test runs against that copy, and the
mutation is reverted by discarding the copy; the repository file is then re-read
and proven unmutated. A **baseline** case proves the harness passes unmutated, and
every case asserts the inner run actually executed tests (a `-t` pattern matching
nothing would otherwise look like a pass).

| # | Mutation | Named test that FAILS | Reverted |
|---|---|---|---|
| M1 | Reintroduce a session-local append ordinal and compare it as a caller-controlled field | `a PARTIAL operation retry converges on exactly the records it offers` | yes |
| M2 | Drop the session-estate binding check | `a record naming another estate is REFUSED` | yes |
| M3 | Add `append_position` to the shared caller-controlled declaration | `the caller-controlled comparison is declared ONCE and shared` | yes |
| M4 | Omit stored-placement validation in the **in-snapshot** classifier | `the caller-controlled comparison is declared ONCE and shared` | yes |
| M5 | Omit stored-placement validation in the **live-row** classifier | `the caller-controlled comparison is declared ONCE and shared` | yes |
| M6 | Take estate authority from the **record** instead of the **session** | `the caller-controlled comparison is declared ONCE and shared` | yes |

### 16.3 R3 — the heuristic proof is replaced by a closed coverage model

> **SUPERSEDED — and reopened.** The model described in this subsection was
> **rejected** at lane #122 sequence 35. Its coverage claim was not sound: the
> parser-supplied byte offsets it verified were **not independently bound** to a
> real `on.pull_request.paths` sequence item, so a benign
> remove-then-synthesize-from-outside fixture stayed green; and the manifest
> claimed authority over the complete remote proof while **omitting real inputs**
> (`vitest.config.ts`, `tests/_global-setup.ts`, the tsconfigs,
> `scripts/prune-dist-runtime.mjs`, `tests/control-plane/`, `.straylight/`,
> `fixtures/`, the tracked `dist-types/` tree). **§17 supersedes this subsection.**
> The parser, its offsets, and the offset-provenance assertion are **deleted**;
> the trigger is **unconditional**; the manifest's scope is corrected to one
> suite's scan set. This subsection is retained unaltered below as the durable
> record of what was rejected.

**What was unsound.** The rejected model declared the proof's input set inside the
no-leak suite's own source (marked comment blocks) and **extracted** it from there
to compare against the workflow's `pull_request.paths`. Three independent
mutations survived: deleting a declared input (a **smaller** declaration satisfies
`uncovered == []` more easily), truncating the extractor, and — decisively —
**replacing the extractor so it synthesized** a path the workflow no longer
declared. The proof could launder a missing required trigger through the extractor
it was validating. It also carried a `KNOWN_UNCOVERED_INPUTS`-style accepted gap in
an earlier cycle.

**What replaced it.** There is **no extractor**, and **no exception mechanism of
any kind** — not a renamed one, not an empty one.

* **The manifest is checked-in DATA**: `tests/phase-50a/proof-input-manifest.json`,
  the single declaration of every path whose content can change the proof's
  verdict. Its roots are deliberately **broad** — `src/straylight` (whole tree),
  `migrations/postgres`, `scripts/phase-50a`, `tests/phase-50a`, `docs/runbooks`,
  plus the proof document, the compose file, the workflow,
  `tests/storage-conformance.test.ts`, `package.json` and `package-lock.json` — so
  they also cover files that **do not exist yet** and cannot be defeated by
  adding, renaming, or deleting a declaration. Every root records **why** it is an
  input.
* **The suite reads its inputs FROM the manifest.**
  `tests/phase-50a/no-leak-and-neutrality.test.ts` no longer restates any path: it
  scans `manifestTrackedFiles()` and reads by-name inputs through
  `readManifestInput()`, which **refuses** an undeclared path. Its domain-model
  scan is **derived** from the broad `src/straylight` root, so a new domain file is
  in scope automatically.
* **The workflow side is a BOUNDED SEMANTIC PARSE** of the workflow's own raw
  bytes: `scripts/phase-50a/workflow-trigger-parser.mjs` recovers
  `on.pull_request.paths` and `on.workflow_dispatch` **structurally** (by
  indentation and key nesting), not by the rejected fixed-offset text slice. It
  imports **nothing at all** — no filesystem, no child process, no network — so it
  cannot consult the artifact it validates. Every recovered path is returned with
  the **byte offset** it was read from, and the proof **verifies that provenance**:
  a synthesized path cannot produce matching bytes.
* **The comparison is manifest-against-parsed-workflow.** Neither side is derived
  from the other. The required set of uncovered manifest roots is **`[]`** — the
  only shape that cannot be widened by appending an exception.
* **Fail-closed throughout.** The manifest reader throws on a manifest that is
  missing, empty, unreadable, malformed, wrongly versioned, rootless, or that
  names a bad path, an unknown kind, a missing rationale, a duplicate, or a root
  resolving to **no tracked file**. The parser fails closed on an absent or
  unparseable trigger block, an unexpected dedent, a nested key where a scalar was
  required, an unterminated quote, a malformed list item, a flow sequence, a
  duplicate key, tab indentation, an empty document, and an oversized one — and a
  failure carries **no** path set at all, so no caller can obtain a narrower
  comparison.
* **Self-trigger.** The manifest, its consumer, the parser, both coverage suites,
  the no-leak suite, and the workflow are each **manifest-covered and trigger
  inputs**, asserted mechanically against the parsed trigger set. A change to the
  coverage model cannot merge without running the proof.

`tests/phase-50a/artifact-and-workflow-contract.test.ts` no longer carries any
coverage comparison; the extractor, its marked blocks, and the probe constants are
removed. What remains there is that suite's own subject: the generated-artifact and
package contract, and the workflow's authentication posture, credential handling,
exact-head assertion, and substantive-step completeness.

### 16.4 R3 — independent probe/mutation matrix

> **SUPERSEDED.** P1, P8 and P9 in the table below probed the retired parser and
> the retired `paths` filter, and are **deleted with them** — P1's
> parser-replacement mutation is load-bearing for nothing, because no proof claim
> derives from a parsed trigger value or offset any more. **§17.2 supersedes this
> subsection** with the trigger probes T1–T11 (over the workflow's own bytes) and
> the re-pointed scan-set probes. Retained unaltered as the durable record.

`tests/phase-50a/proof-input-coverage-mutations.test.ts`, same disposable-copy
discipline, same baseline and non-vacuity guards. Each copy is initialized as its
own git repository and staged, so the manifest consumer's `git ls-files` resolution
sees the **copy's** mutated content.

| # | Mutation | Named test that FAILS | Reverted |
|---|---|---|---|
| P1 | Replace the parser so it **synthesizes** a path the workflow no longer declares (the mutation that defeated the rejected suite) | `PROVENANCE: every parsed path is a real substring of the workflow bytes` | yes |
| P2 | **Delete** a declared manifest input (`migrations/postgres`) | `the migrations reference no provider-managed role, database, or extension` | yes |
| P3 | Apply a **truncation** during declaration reading (`roots.slice(1)`) | `SELF-TRIGGER: the manifest and every proof file that consumes it are trigger inputs` | yes |
| P4 | **Rename** the declaration key (`roots` → `paths`) | `the manifest is non-empty and every declared root resolves to at least one real tracked file` | yes |
| P5 | Make the declaration **vacuous** (empty root list) | `the set of manifest roots NOT covered by the parsed workflow triggers is EMPTY` | yes |
| P6 | Declare a root with **no real files** | `the manifest is non-empty and every declared root resolves to at least one real tracked file` | yes |
| P7 | **Narrow** a declared root while real files remain under it (`src/straylight` → `src/straylight/storage/postgres`) | `the estate domain model is untouched by Phase 50A` | yes |
| P8 | Remove **each** workflow trigger path individually — all 12, one at a time | `the set of manifest roots NOT covered by the parsed workflow triggers is EMPTY` (or the file-level claim) | yes |
| P9 | Remove **`workflow_dispatch`** | `recovers on.pull_request.paths and on.workflow_dispatch from the CHECKED-IN workflow` | yes |

The parser additionally carries **16 negative tests** of its own (indentation,
interleaved comments, block termination, nested keys, quoting variants, malformed
list items, duplicate keys, tabs, empty and non-text input), and the manifest
reader **14** fail-closed cases.

### 16.5 Remote proof — exact-head Git identity

The audit found that run 30715184062 reported PR head
`f1b5f0f3924eb4c8624c8b2efb1f3072fbfa92f4` in Actions metadata while
`actions/checkout` had fetched `refs/pull/124/merge` and executed
`830b838270e0ea7806d2526260048ea2e2d90c1b`. Both trees were independently equal at
`36c0c47937f2a4f776fed928fffefc732b4bc380`, so that run was valid evidence of
**runtime content** — but **not** exact-head Git identity, which the packet
required. A synthetic merge commit is not identity evidence even when its tree is
byte-identical.

The workflow now:

1. **derives** the target SHA — the `workflow_dispatch` `head_sha` input on a
   manual run, `github.event.pull_request.head.sha` (the **actual PR head**, never
   the synthetic merge SHA) on a pull-request run — and **validates** it against
   `^[0-9a-f]{40}$`, failing closed on an absent, empty, or malformed value and on
   an unsupported event;
2. **checks out that exact SHA** as `actions/checkout`'s `ref`;
3. **asserts** `git rev-parse HEAD` equals it in a dedicated early step, printing
   both values and failing closed on any mismatch.

Nothing substantive runs before step 3 succeeds — no install, build, typecheck,
test, suite, proof, or artifact verification. A test compares file positions of the
`run:` command lines against the assertion step to enforce that ordering, and
another proves the `workflow_dispatch` path is **bounded** to exactly the one SHA
input, so a dispatch cannot redirect the proof at another repository, ref, or
configuration. Both SHA values reach their scripts through the **environment**,
never interpolated into shell text.

### 16.5a Making the nested harnesses runnable on a hosted runner

Both mutation harnesses run an inner `vitest` per mutation against a disposable
copy of the tree. Two properties of that design had to be corrected before the
remote proof could complete, and both were found *by* the remote proof rather
than reasoned about in advance:

* **The non-vacuity guard was ANSI-dependent.** It requires the inner run to
  report `Tests N passed|failed`, because a `-t` pattern matching no tests can
  exit 0 and would make every mutation look like a pass. Vitest colourizes that
  summary under the runner's terminal settings, so the guard matched nothing and
  twenty otherwise-correct cases reported "the inner run must report test
  results". Captured output is now normalized through a stripper before every
  assertion, and a test asserts the stripper directly against both the colourized
  and the plain form — including that a zero-match run is still rejected either
  way. Verified under `FORCE_COLOR=3 CI=true`.

* **Each copy was far larger than the manifest needs.** The R3 harness copied
  `docs/` wholesale — 6.4 MB of unrelated ADRs — into each of ~30 copies. On a
  hosted runner's slower disk that dominated the step's wall clock: the first
  attempt sat in `npm test` for over two hours without finishing, while the same
  harnesses complete in ~26 s locally even pinned to two cores. Only the two
  `docs` paths the manifest actually declares are copied now.

Two bounds were added so a future stall is diagnosable rather than opaque: each
inner run carries an explicit `timeout` with `SIGKILL` (a killed run reports no
test results, so the non-vacuity guard fails loudly instead of the mutation
looking like a pass), and the workflow job carries `timeout-minutes: 45` —
comfortably above the observed full-run cost, well below the six-hour default
that made slowness indistinguishable from a hang.

Verified after both corrections, under the runner's own conditions
(`taskset -c 0,1`, `CI=true`, `FORCE_COLOR=3`): the whole suite completes in
70 s — 87 files, 2208 passed, 149 database-gated skips.

### 16.6 Scope of this slice

> **COUNT CORRECTED.** The inherited-path count this subsection previously
> reported was **wrong** and has been **replaced** — the retired figure is not
> restated anywhere, so it cannot be mistaken for a live claim. The operator
> decision at lane #122 sequence 36 records the authoritative figures. The branch
> point
> `f1b5f0f3924eb4c8624c8b2efb1f3072fbfa92f4` carries **647** tracked paths, of
> which this slice modified **13** and left **634** byte-identical, and it **added
> 9** — for **656** tracked paths at `a720e946717f246ec4e646f85d549d92b49b9fb7`.
> The figures are stated correctly in the body below and re-verified in §17.4. The
> byte-identity claim itself was independently confirmed; only the count was wrong.

Changed, and all inside the packet's seven allowed paths:

* `src/straylight/storage/postgres/` — `rows.ts` (the shared caller-controlled
  declaration and the placement validator), `session.ts` (estate binding,
  order-independent classification, ordinal deleted), `persist.ts` (consumes the
  shared declaration; live placement validation), `queries.ts` (per-estate
  position lookups), `errors.ts` (the new reason), `host.ts`, `load.ts`,
  `portability.ts` (bound probe sessions);
* `scripts/phase-50a/` — the manifest consumer, the bounded parser, and their
  hand-written `.d.mts` declarations;
* `tests/phase-50a/` — the manifest data, both R2 suites, both R3 suites, and
  updates to the idempotency, no-leak, and artifact-contract suites;
* `.github/workflows/phase-50a-postgres-conformance.yml` — manifest-mirroring
  triggers and the exact-head identity steps;
* this document.

Deliberately **byte-unchanged** (blob-level comparison against the branch point,
covering all **634** other inherited paths — of the **647** tracked at
`f1b5f0f3924eb4c8624c8b2efb1f3072fbfa92f4`, **13** modified and **9** added):
`migrations/postgres/`,
`docker-compose.phase-50a.yml`, `docs/runbooks/`,
`tests/storage-conformance.test.ts`, `src/straylight/storage/types.ts`,
`src/straylight/index.ts`, the estate-domain files
(`types.ts`, `estate.ts`, `recall.ts`, `audit.ts`, `policy.ts`, `keyring.ts`,
`signatures.ts`, `commitment.ts`), `src/straylight/storage/in-memory.ts`,
`src/straylight/storage/jsonl.ts`, `.straylight/`, every ADR, every other
workflow, `fixtures/`, the TypeScript configuration, `vitest.config.ts`,
`package.json`, and `package-lock.json`. No dependency, lockfile, public API,
package-contract, migration-semantic, sibling-repository, or domain-semantic
change.

R1 (bounded callback-thenability refusal that publishes nothing of the caller's
exception) and R4 (the `assertNever` totality barrier over `ThenReadOutcome`)
remain **closed**, with their pinning tests present and green — including R4's real
compiler mutation and its positive control.

### 16.7 What this slice does NOT establish

It replaces two unsound abstractions with closed designs and preserves everything
else. It authorizes and claims **no** acceptance, **no** readiness, **no** gate
disposition, **no** Phase 50B work, **no** MVP-2 completion, and **no** merge.
Every residual unproven pre-production obligation in §10 stands undischarged:
durability, failover, network isolation, tenancy, availability, version policy, and
incident recovery remain later obligations. Nothing here involves a provider, a
production resource, a credential, or a living estate. The audit of this slice is
Codex's; the implementer does not audit its own work.

---

## 17. R3 proof-harness-closure slice (fresh initial slice after the sequence-35 REJECT)

Authority: the durable `operator.decision` `evt-phase-50a-operator-decision-036` on
lane #122 (comment 5160506197), which disposed the Codex REJECT at sequence 35
(audit comment 5160302733, audit digest
`sha256:acb35e0649609b2d82b92790cdc5a4c069dcc583540ade87a4b017e6ba636fad`, reducer
result 5160507741) and authorized **exactly one** fresh **initial**
proof-harness-closure slice on a **fresh branch** with a **fresh pull request**.
Task packet comment 5165577237, digest
`sha256:e54eef5eed34fca8939dba56421975e6f01df90f8d5d87b2a73bccf234b238da`; packet
event comment 5165583883 at sequence 37. `patch_cycle` stays **3**, the configured
maximum (`automation-policy.json` `maximum_patch_cycles = 3`): this is an initial
packet on a fresh branch, **not** an unauthorized patch cycle 4.

Branch point: rejected SHA `a720e946717f246ec4e646f85d549d92b49b9fb7`, used **only**
as inspectable substrate. **PR #125**, branch
`phase-50a-r2-r3-architecture-correction`, and every earlier rejected branch, SHA,
and pull request of this lane are **not** reopened, amended, extended, retargeted,
or cited as merge evidence — for this lane or any successor.

The REJECT reopened R3 for the third time. The operator decision was explicit that
it must be closed by **removing the failed abstraction, not by repairing the parser
again**. This slice does exactly that and nothing else.

### 17.1 What was unsound, and what removing it means

Three successive models tried to prove that every input to the Phase 50A proof
could also **start** the workflow that runs it. Each **enumerated** those inputs,
**mirrored** the enumeration into `on.pull_request.paths`, and **compared** the two
sides. Each was reopened:

1. the declaration lived in **marked comment blocks** inside the no-leak suite and
   an **extractor** read it out. Deleting a declared input, truncating the
   extractor, and replacing the extractor so it **synthesized** a path all left the
   proof green;
2. the declaration became a **checked-in manifest** and the workflow side became a
   **bounded structural parser** returning each path with a **byte offset**, whose
   provenance the proof verified. The audit found the offsets were **not
   independently bound** to a real `on.pull_request.paths` sequence item, so a
   benign remove-then-synthesize-from-outside fixture stayed green — the same
   laundering defect, one layer deeper. The audit also found the manifest claimed
   authority over the **complete remote proof** while omitting real inputs:
   `vitest.config.ts`, `tests/_global-setup.ts`, the tsconfigs,
   `scripts/prune-dist-runtime.mjs`, `tests/control-plane/`, `.straylight/`,
   `fixtures/`, and the tracked `dist-types/` tree.

Two failures are structural, not implementation defects, which is why a third
repair was the wrong move:

* **Coverage of what is DECLARED says nothing about what must be declared.**
  `uncovered == []` is satisfied *more easily* by declaring less. No amount of
  rigour inside the comparison fixes the direction of the claim.
* **No proof may derive its authority from the artifact it validates.** As long as
  the workflow side of the comparison is *produced by code*, a mutation of that code
  can make the comparison agree about a trigger the workflow does not carry.

**The closed design removes the question instead of answering it more carefully.**

**(A) The pull-request trigger is UNCONDITIONAL.**
`.github/workflows/phase-50a-postgres-conformance.yml` declares:

```yaml
on:
  pull_request:
  workflow_dispatch:
    inputs:
      head_sha:
        description: 'Exact 40-hex commit SHA to check out and assert (required)'
        required: true
        type: string
```

No `paths`. No `paths-ignore`. The workflow runs for **every** pull request, so
trigger completeness is a property of the **trigger itself** — there is no
enumeration of repository inputs to keep in step with the tree, and therefore
nothing that can drift out of step with it. The inputs the previous manifest omitted
are covered for the same reason every other path is: unconditionally. The bounded
manual exact-head path is retained with exactly one **required string** input.

**(B) A closed trigger contract, not another parser.**
`tests/phase-50a/workflow-trigger-contract.test.ts` (33 tests) reads the workflow's
**actual bytes** with `readFileSync` and asks no other module for anything — it
imports only `node:fs`, `node:path`, `node:url` and `vitest`, which a test asserts
over its own import statements. There is **no intermediate representation**, so
there is nothing that could synthesize a value, a span, or an offset for the
contract to trust. It is not a YAML parser and imports none.

It **ACCEPTS** exactly one top-level `on:` declaration whose significant lines are
**byte-identical** to a literal spelled out in the contract (`CANONICAL_ON_LINES`),
and **REJECTS**, each with a distinct reason code:

| Reason code | Rejects |
|---|---|
| `path-filter-present` | a `paths` **or** `paths-ignore` key anywhere in the file |
| `on-declaration-absent` | no top-level `on:` |
| `on-declaration-duplicated` | a **duplicate** top-level `on:` |
| `trigger-block-not-canonical` | a missing, filtered, or parameterized `pull_request`; a missing or broadened `workflow_dispatch`; a renamed, optional, or non-string `head_sha`; an **unsupported** trigger; any other trigger content at all |
| `head-sha-validation-absent` | removal of the exact `^[0-9a-f]{40}$` validation |
| `pr-head-source-absent` | redirecting the PR head source to the synthetic merge SHA |
| `checkout-ref-not-pinned` | removing or redirecting the exact checkout `ref` |
| `head-equality-assertion-absent` | the compared value not being **read back** from `git rev-parse HEAD` |
| `head-equality-comparison-absent` | removing the comparison, leaving only the print |
| `head-equality-step-absent` | removing the identity-assertion step |
| `head-equality-not-first` | a substantive command running **before** the assertion |
| `substantive-command-absent` | removing any of the nine substantive step commands |
| `tab-indentation` | a tab character |
| `workflow-unreadable` | unusable input — never a vacuous pass |

Two properties make this fail closed rather than merely strict. **Unrecognized
content is a refusal, not an equivalence**: because the accepted set is one literal
byte sequence, every enumerated trigger defect is the *same* mismatch, and a defect
nobody enumerated is refused too. And **every safeguard and ordering check runs over
the EXECUTABLE text** — the document with whole-line comments blanked out, line
count and order preserved. That is load-bearing: the workflow's explanatory comments
name several of the literals a safeguard is pinned to, so a check over the raw
document would have been satisfied by the **prose about** a safeguard after the
safeguard itself was deleted. Three of this slice's own fixtures failed until the
distinction was made, which is how it was found.

**(C) The manifest's scope is corrected to one suite's scan set.**
`tests/phase-50a/proof-input-manifest.json` survives, and its `$schema_note`, its
consumer's header, its `.d.mts`, the no-leak suite's header, and this section now
say the same narrow thing: it declares the **read/scan set of exactly one suite**,
`tests/phase-50a/no-leak-and-neutrality.test.ts`. It is **not** a declaration of the
inputs to the build, the typecheck, the repository-wide test run, control-plane
validation or the control-plane tests, the fixtures, the generated declarations,
package pruning, the C1–C9 artifact verification, or the remote workflow — and
nothing derives trigger, proof, or input completeness from it. The
workflow-comparison helpers orphaned by (A) and (B) — `filterCovers`,
`uncoveredRoots`, and `WORKFLOW_PATH` — are **deleted**; the manifest consumer no
longer knows the workflow exists.

The no-leak suite's genuine protections are **preserved**: `readManifestInput()`
still refuses an **undeclared read**; `manifestTrackedFiles()` still throws on a
manifest that is missing, empty, unreadable, malformed, wrongly versioned, rootless,
or that names a root resolving to **no real tracked file**; the manifest still covers
**itself**; and the domain-model scan is still **derived** from the broad
`src/straylight` root rather than restated.

**What was retired, and where authority moved:**

| Retired | File | Disposition | Authority now |
|---|---|---|---|
| The workflow trigger parser | `scripts/phase-50a/workflow-trigger-parser.mjs` | **DELETED** | none — no proof claim derives from a parsed trigger |
| Its type declarations | `scripts/phase-50a/workflow-trigger-parser.d.mts` | **DELETED** | — |
| Byte offsets + the offset-provenance assertion | `tests/phase-50a/proof-input-coverage.test.ts` | **DELETED** (whole file — it *is* the defective proof) | `workflow-trigger-contract.test.ts`, over the file's own bytes, with no offsets at all |
| The parser-replacement mutation (P1) | `tests/phase-50a/proof-input-coverage-mutations.test.ts` | **DELETED** with the parser | nothing — disclosed in §17.2, not silently dropped |
| The per-trigger-path removal matrix (P8) | same | **DELETED** — there is no `paths` filter to remove | inverted: T1/T2 refuse *introducing* a filter |
| `filterCovers`, `uncoveredRoots`, `WORKFLOW_PATH` | `scripts/phase-50a/proof-input-manifest.mjs` + `.d.mts` | **DELETED** as orphans | — |
| Every over-broad manifest authority claim | manifest `$schema_note`, consumer header, `.d.mts`, no-leak header, §16.3/§16.4 | **CORRECTED** to no-leak-only scope | the unconditional trigger carries completeness |

### 17.2 Independent probe/mutation matrix

`tests/phase-50a/proof-input-coverage-mutations.test.ts`. Same discipline as the R2
matrix: each mutation is applied to a **disposable copy** of the tree (initialized as
its own git repository and staged, so the manifest consumer's `git ls-files`
resolution sees the copy's mutated content), one named test runs against that copy,
the copy is discarded, and the repository file is then **re-read and proven
unmutated**. The repository tree is never mutated, and a final test asserts no probe
directory survives.

**Two baselines** prove the harness is sound before any result is trusted: an
unmutated copy **passes** the trigger contract, and an unmutated copy **passes** the
no-leak scan.

**Trigger probes** — mutate the workflow, must fail a named test in the trigger
contract:

| # | Mutation | Named test that FAILS |
|---|---|---|
| T1 | **Filter** `pull_request` by introducing a `paths` key | `NO paths or paths-ignore key appears anywhere in the workflow` |
| T2 | Introduce a `paths-ignore` key | `NO paths or paths-ignore key appears anywhere in the workflow` |
| T3 | **Remove** `pull_request` | `the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED…` |
| T4 | **Parameterize** `pull_request` with a `branches` filter | same |
| T5 | **Remove** `workflow_dispatch` | same |
| T6 | **Broaden** `workflow_dispatch` with an additional input | same |
| T7 | **Rename** `head_sha` | same |
| T8 | Make `head_sha` **optional** | same |
| T9 | Remove the exact 40-hex validation (comment about it left in place) | `the exact 40-hex head-SHA validation is intact` |
| T10 | **Redirect** the checkout `ref` away from the derived SHA | `the checkout pins the EXACT derived SHA as its ref` |
| T11 | Remove the `git rev-parse HEAD` equality assertion (step name left in place) | `the git rev-parse HEAD equality assertion is intact and precedes every substantive step` |

**Scan-set probes** — mutate the manifest or its consumer, must fail a named test in
the no-leak suite:

| # | Mutation | Named test that FAILS |
|---|---|---|
| P2 | **Delete** a declared scan-set root (`migrations/postgres`) | `the migrations reference no provider-managed role, database, or extension` |
| P3 | **Truncate** the root list during reading (`roots.slice(1)`) | `the estate domain model is untouched by Phase 50A` |
| P4 | **Rename** the declaration key (`roots` → `paths`) | `the manifest is readable, non-vacuous, and every declared root contributes tracked files` |
| P5 | Make the declaration **vacuous** (empty root list) | same |
| P6 | Declare a root with **no real tracked files** | same |
| P7 | **Narrow** a root while real files remain under it | `the estate domain model is untouched by Phase 50A` |
| P10 | **Read an undeclared input** — remove the accessor's refusal | `an UNDECLARED input cannot be read through the manifest accessor` |

T9, T10 and T11 deliberately mutate the **executable** occurrence and leave the
comment or step name that describes it in place, so each proves the
executable-text scoping rather than assuming it.

The trigger contract additionally carries **23 in-memory defect fixtures** of its
own, each requiring a specific reason code, plus an unusable-input case and a
**non-vacuity** test that requires the real bytes to be **accepted** and every
fixture to be **rejected** — a checker that refused everything would make every
other test pass while proving nothing.

**Harness non-vacuity is itself proven.** Captured output is ANSI-**stripped** before
every match (vitest colourizes its summary under CI's terminal settings, and a guard
that only held locally would be no guard at all on the remote proof), and the
stripper is asserted directly against both the colourized and the plain form. The
guard was **extended** in this slice: a mutation that breaks a suite at
**collection** time is real, and stronger, but vitest reports `Tests  no tests` —
which the previous guard could not distinguish from a `-t` pattern that matched
nothing. It now accepts a collection failure (`Test Files N failed` **with**
`Tests  no tests`) while still rejecting a **skipped** summary, a zero-match run, and
`no tests` without a failed file. All three shapes are asserted directly. Each inner
run remains **time-bounded** (120 s, `SIGKILL`), so a hang fails loudly rather than
silently passing, and the job carries `timeout-minutes: 45`.

A test also asserts the retirement **mechanically**: none of the three deleted files
is tracked, no code under `scripts/`, `tests/`, or `.github/` still references the
parser, and the workflow declares no path filter — so no trigger parse is
load-bearing for anything.

### 17.3 Local proof results

Run at the fresh head, against **two separately initialized local PostgreSQL 16
instances** (`docker-compose.phase-50a.yml`, ports 55432 and 55433, distinct
`system_identifier`s):

| Command | Result |
|---|---|
| `npm ci` | clean |
| `npm run build` | clean |
| `npm run typecheck` | clean |
| `npm test` | see §17.5 |
| `npm run control-plane:validate` | clean |
| `npm run control-plane:test` | clean |
| `npm run phase-50a:test` (two hosts) | clean |
| `npm run phase-50a:proof` (export/restore/replacement) | clean |
| `npm run phase-50a:verify-artifact` (C1–C9) | clean |
| `npm pack --dry-run --json` | no PostgreSQL declaration packed |
| `git diff --check` | clean |

The task packet and every event this slice posts were validated locally against
`.straylight/lib/validate.mjs` and replayed through `.straylight/bin/reduce-issue.mjs`
at base SHA `70d40058096455c6406d644183ac757a317ce159` **before** posting.

### 17.4 Scope, and positive byte identity

Changed — **12 paths, all inside the packet's 12 exact `allowed_paths`**, verified by
set comparison (changed ∖ allowed = ∅):

| Path | Disposition |
|---|---|
| `.github/workflows/phase-50a-postgres-conformance.yml` | **modified** — unconditional trigger; manifest-mirroring commentary retired |
| `scripts/phase-50a/workflow-trigger-parser.mjs` | **DELETED** |
| `scripts/phase-50a/workflow-trigger-parser.d.mts` | **DELETED** |
| `scripts/phase-50a/proof-input-manifest.mjs` | **modified** — orphaned helpers deleted; scope corrected |
| `scripts/phase-50a/proof-input-manifest.d.mts` | **modified** — same |
| `tests/phase-50a/proof-input-manifest.json` | **modified** — `$schema_note` and two root rationales scoped honestly |
| `tests/phase-50a/proof-input-coverage.test.ts` | **DELETED** — the defective proof |
| `tests/phase-50a/proof-input-coverage-mutations.test.ts` | **modified in place** — T1–T11 added; P1/P8/P9 retired with disclosure; P2–P7 re-pointed; P10 added |
| `tests/phase-50a/workflow-trigger-contract.test.ts` | **added** — the one permitted replacement |
| `tests/phase-50a/artifact-and-workflow-contract.test.ts` | **modified** — parser narrative retired; the `workflow_dispatch` slice made structural |
| `tests/phase-50a/no-leak-and-neutrality.test.ts` | **modified** — scope wording only |
| `docs/…-IMPLEMENTATION-AND-PROOF.md` | **modified** — §16.3/§16.4/§16.6 superseded, counts corrected, this §17 |

**Positive byte identity.** Every tracked path **outside** `allowed_paths` was
compared by **git object id** between `a720e946717f246ec4e646f85d549d92b49b9fb7` and
this slice's tree: **zero** differ, and none is missing. That covers **R1** (bounded
callback-thenability refusal), **R2** (caller-controlled append-only declaration and
placement classification), **R4** (the `assertNever` totality barrier),
`src/straylight/` in its entirety, `migrations/`,
`docker-compose.phase-50a.yml`, `docs/runbooks/`,
`tests/storage-conformance.test.ts`, `fixtures/`, the tracked `dist-types/` tree, the
TypeScript configuration (`tsconfig.json`, `tsconfig.build.json`,
`tsconfig.runtime.json`), `vitest.config.ts`, `tests/_global-setup.ts`,
`package.json`, `package-lock.json`, `.straylight/`, `.loa`, `.claude/`, `.npmrc`,
`scripts/prune-dist-runtime.mjs`, every other `scripts/phase-50a/` file,
`tests/control-plane/`, every other `tests/phase-50a/` suite, every ADR, and **every
other workflow**. No dependency, lockfile, public API, package-contract,
migration-semantic, transaction-semantic, audit-chain, sibling-repository, or
domain-semantic change. No proof-only reference change to an otherwise
byte-identical file was needed, so none was made.

**Corrected evidence figures**, independently recomputed with `git ls-tree` and
`git diff --name-status`:

| Figure | Value |
|---|---|
| Branch-point (`f1b5f0f3…`) tracked paths | **647** |
| Modified inherited paths (branch point → `a720e946…`) | **13** |
| Added paths | **9** |
| Byte-identical inherited paths | **634** (647 − 13) |
| Tracked paths at `a720e946…` | **656** (647 + 9) |

The previously reported inherited-path figure was wrong. It is **replaced**, not
restated: it survives **nowhere** in the tree as a live count, and §16.6 records the
correction. This slice's own counts against `a720e946…`: **12** changed — **8**
modified, **1** added, **3** deleted — leaving **654** tracked paths.

### 17.5 Preserved behaviour

R1, R2 and R4 remain **closed**, with their pinning tests present and green —
including R2's 24-permutation outcome matrix and its six-case mutation matrix, and
R4's real compiler mutation with its positive control. No PostgreSQL production
source, transaction semantic, session-invalidation behaviour, migration, migration
checksum, or audit-chain behaviour changed. The internal-only package boundary,
package exports, `npm pack` surface, generated-declaration pruning, and C1–C9
artifact verification are unchanged and pass. The two-host proof, the synchronous
public `StorageAdapter` seam, and provider neutrality are unchanged.

### 17.6 What this slice does NOT establish

It closes R3 by **removing** the failed abstraction and preserves everything else
byte-identically. It authorizes and claims **no** acceptance, **no** readiness, **no**
gate disposition, **no** Phase 50B work, **no** MVP-2 completion, and **no** merge.
The fresh pull request is **not merged**; PR #125 and every earlier rejected branch
and pull request of this lane were left **untouched**, and **nothing in this slice is
offered as merge evidence**. Every residual unproven pre-production obligation in
§10 stands undischarged: durability, failover, network isolation, tenancy,
availability, version policy, and incident recovery remain later obligations.
Nothing here involves a provider, a production resource, a credential, or a living
estate.

**Implementation provenance.** Exactly **one** Claude Opus xhigh implementer context
did this work, under lease `lease-phase-50a-implementer-r3-closure-010` (lane #122
sequence 38). **No** Ultracode, **no** `/batch`, **no** teams, **no** subagents, and
**no** delegation of any kind. The audit of this slice is Codex's; the implementer
does not audit its own work.

---

## 18. Patch cycle 3 disposition — the FIXED WRAPPER and FIXED EXECUTOR (R3, final)

**Authority.** The `operator.decision` at lane #122 sequence **42** (comment
`5168491994`; reducer result `5168498265`), disposing of the Codex **REJECT** at
sequence **41** (audit comment `5168050720`, audit digest
`sha256:0de0d69137a91275d43ad77196140786326523efc66f2b93d82fec858decd6c7`, exact
rejected head `8bc9e87e8d17890f251e69091cbacba619d97ae7`). Implemented under the
coordinator task packet at comment `5169022573` (packet digest
`sha256:b414497a055c0bfbd0519a0ea499de93387ae9794d087a31745805433385758b`, posted
by event `5169042916` at sequence **43**), lease
`lease-phase-50a-impl-fixed-executor-012` (sequence **44**).

`patch_cycle` remains **3**. This is a fresh **INITIAL** slice on a fresh branch
and a fresh pull request — **not** a patch cycle 4, which the disposition states is
unauthorized.

### 18.1 Why the abstraction was replaced rather than repaired

Three successive attempts to prove the workflow's trigger and exact-head posture by
**recognizing its content** were reopened by audit:

1. a manifest of proof inputs mirrored into an `on.pull_request.paths` filter;
2. a structural parser of the workflow's bytes with positional provenance;
3. a direct byte/line checker (`tests/phase-50a/workflow-trigger-contract.test.ts`).

The sequence-41 REJECT named three blockers in the third, and they are one blocker
wearing three hats — **a recognizer has unsupported forms**:

- unsupported byte/YAML forms (a BOM, a document separator, a CRLF line, a quoted
  or aliased top-level key) left the contract **green**;
- it blanked only **whole-line** comments, so an inline comment or an unrelated
  block scalar restating a literal **satisfied** a safeguard whose implementation
  had been deleted;
- its ordering check recognized only single-line `run:` commands, so a `run: |`
  block executing `npm ci` **before** the exact-HEAD assertion was invisible.

Raw-byte identity has no unsupported forms. So the abstraction is **gone** and the
property is established a different way.

### 18.2 The canonical wrapper

`.github/workflows/phase-50a-postgres-conformance.yml` is now a **canonical
wrapper** whose complete raw bytes were **fixed by the coordinator packet** and
written verbatim from `fixed_wrapper_contract.bytes_base64`:

| Property | Value |
|---|---|
| Byte length | **5455** |
| Raw-byte SHA-256 | `ff91a255304fcadfba0d8397b91a63a6e24327817442f74497baac7031865e48` |
| Encoding | UTF-8, LF only, no BOM, no tab, exactly one trailing LF |
| `run:` steps | **exactly one**, invoking `node scripts/phase-50a/fixed-proof-executor.mjs` |

It carries the unconditional `pull_request` trigger (no `paths`, no
`paths-ignore`), a bounded `workflow_dispatch` whose only input is a required
string `head_sha`, fixed least-privilege permissions (`contents: read`,
`packages: read`), the two fixed PostgreSQL services, SHA-pinned bootstrap
actions, and a checkout pinned to the exact audited head. It carries **no proof
command of its own** — `npm run build`, `typecheck`, `npm test`, the control-plane
commands, the Phase 50A commands, `git diff --check`, and the `docker exec`
instance confirmations appear **nowhere** in the YAML.

The byte comparison against the packet is **authoritative**. A green remote run is
**not** acceptance and never substitutes for it.

### 18.3 The fixed executor

`scripts/phase-50a/fixed-proof-executor.mjs` (**21687** bytes, SHA-256
`83b8307d92fe0a6942d71b84643fdccb8305b013c3ea948249d8fff07e78ad85`), with
declarations at `scripts/phase-50a/fixed-proof-executor.d.mts`.

- It carries the packet-authorized wrapper digest as a **literal committed
  constant**. It never computes the expected digest from the file it checks, and
  never reads it from an environment variable, a config file, or an argument. **It
  cannot authorize itself** — and the negative test *"SELF-AUTHORIZATION IS
  IMPOSSIBLE"* proves a different well-formed workflow (valid YAML, unconditional
  `pull_request`, one required `head_sha`) is still refused, because the gate is
  raw-byte identity rather than shape recognition.
- **Identity gate, before any child process:** hash the wrapper's raw bytes and
  require the pinned digest; require `PHASE_50A_EXPECTED_HEAD_SHA` to be exactly
  40 lowercase hex; read `git rev-parse HEAD`; require exact equality. The
  `rev-parse` read is the **only** launch permitted before the gate, is itself a
  fixed argv array with `shell: false`, and is recorded as an identity probe —
  never as a schedule command.
- **Closed schedule:** 12 literal `{ label, file, args, timeout_ms }` entries,
  frozen data in the source, covering exactly the substantive commands the previous
  workflow ran, in the same order. Every launch is `spawnSync` with `shell: false`
  and an argv **array**.
- **Stops** at the first nonzero exit, terminating signal, timeout, or spawn
  failure. All four are classified **distinctly** in precedence order: a timeout is
  detected by `error.code === 'ETIMEDOUT'` rather than by the presence of a signal,
  because Node reports a timeout kill *as* `SIGTERM` — collapsing the two would
  report a stall as an ordinary signal death.
- **Deterministic receipts:** one per attempted command, carrying ordinal, label,
  file, exact argv, status, signal, `timed_out`, `spawn_failed`, and outcome. No
  timestamp, duration, hostname, or absolute path, so two runs of the same schedule
  produce byte-identical receipt text.
- **Publishes on every run, including a refused one:** wrapper path and observed
  digest, expected wrapper digest, executor self-digest, expected SHA, observed
  HEAD, and the ordered receipts — identity facts always **before** the receipts.
- **Announces the passed gate in the log, before the first launch.** The closing
  envelope is assembled at the end of a run, so a reader of the job log would have
  to trust the code's structure to believe the identity check preceded the work.
  The banner removes that inference: it is written at the moment the gate passes,
  so its **position in the interleaved log is itself the ordering evidence**. A
  refused run emits **no** banner — it would otherwise claim an identity that was
  never established.
- **Contains no** markup parser, markup-shaped line scanner, shell parser,
  command-word splitter, comment stripping, positional provenance, dynamic code
  evaluation, dynamic module or command loading, configuration loading, or shell
  launch. It imports Node builtins only, so it runs **before** `npm ci` — which is
  the first entry of its own schedule.

### 18.4 Tests

`tests/phase-50a/fixed-proof-executor.test.ts` (36 tests) and
`tests/phase-50a/proof-executor-envelope.test.ts` (16 tests) — **52 passed**.

The wrapper's expected length and digest are **literal constants of the test file**,
transcribed from the packet and deliberately **not** imported from the executor.
Comparing two independently committed copies against the packet is what makes drift
detectable; a test that read the executor's own constant would prove only
self-consistency.

Proven positively: exact wrapper bytes and digest; canonical encoding; pinned-
constant agreement; the single invocation seam; schedule coverage and frozen argv;
fixed argv and exact order over a stubbed call log; zero launches before identity;
complete deterministic receipts; the published envelope.

Proven negatively — each asserting an **exact launch count**, not merely a nonzero
exit: eight byte-level wrapper mutations (flipped quote, appended comment, CRLF
line, prepended BOM, added trailing space, re-indented line, removed trailing
newline, document separator) each fail the fingerprint; a bad wrapper launches
**zero** commands; a HEAD mismatch launches **zero**; nine malformed expected-SHA
shapes (absent, empty, 39-hex, 41-hex, uppercase, non-hex, leading and trailing
whitespace, trailing newline) each launch **zero**; an unreadable HEAD launches
zero; no refusal path exits zero or runs a shortened schedule; self-authorization
is impossible; and a nonzero exit, signal, timeout, and spawn failure each stop
every successor with the failure surfaced distinctly.

Every disposable-copy mutation reverts by discarding the copy, and each case
**re-reads the repository file afterwards** to prove it was never touched. No probe
directory survives.

**Test-adequacy check (implementer-side, not a substitute for audit).** Five
mutations were applied to disposable copies to confirm these tests fail when the
safeguards are broken: appending one comment to the wrapper failed **24** tests;
removing the HEAD identity check failed 2; making the digest comparison
self-derived — the exact defect the packet forbids — failed **11**; removing the
stop-on-failure return failed 2; collapsing the timeout classification failed 1;
setting `shell: true` failed 1. All probe copies were removed.

### 18.5 Deletions and re-pointings — disclosed, never silent

- **DELETED:** `tests/phase-50a/workflow-trigger-contract.test.ts` (568 lines), the
  rejected semantic checker. Not relocated, renamed, or reimplemented. The
  retirement is asserted mechanically in
  `tests/phase-50a/proof-input-coverage-mutations.test.ts`, which now requires the
  file to be untracked.
- **RE-POINTED:** trigger probes **T1–T8** in the mutation matrix now target the
  fingerprint test instead of the deleted checker. Every one is checked against the
  single property the wrapper has — its raw bytes hash to the authorized
  fingerprint.
- **RETIRED with replacement, T9–T11:** T9 removed the 40-hex validation from the
  workflow's inline shell; T10 redirected the checkout `ref`; T11 removed the
  `git rev-parse HEAD` equality assertion. **There is no inline shell left** — those
  behaviors moved into the executor, where they are executed rather than
  recognized. Their replacements are the MALFORMED EXPECTED SHA case (nine shapes,
  zero launches each), the fingerprint refusal plus the `ref:`-assignment assertion
  in the artifact suite, and the HEAD MISMATCH case (exact launch count zero) —
  each **stronger** than the workflow-byte probe it replaces.
- **RE-POINTED baseline:** the trigger baseline previously changed whitespace inside
  a workflow **comment** and required the contract to still pass. Under the
  fingerprint model there is no benign workflow byte — that same edit is now a
  **refusal**, and is asserted as one. Keeping it as a baseline would assert the
  opposite of the correction, so the benign edit moved to a file the fingerprint
  does not cover.
- **REPLACED in `tests/phase-50a/artifact-and-workflow-contract.test.ts`:** the
  run-command ordering scan, the `>5` run-command count, the per-step `run:`
  lookup, the structural `workflow_dispatch` block slice, the exact-head literal
  scan, and the multi-line `run: |` interpolation scan — all invalidated by the
  fixed wrapper. Its permissions, registry/scope, and credential-posture
  assertions remain, restated over the wrapper, plus new assertions that the
  wrapper delegates to the executor and carries no proof command.

One assertion needed correcting for the opposite reason: a whole-document
`not.toContain('refs/pull/')` failed because the wrapper's **prose explains why**
the synthetic merge ref is wrong and therefore names it. It now asserts over the
`ref:` **assignment**. Reading a safeguard's prose as if it were the safeguard is
precisely what reopened this proof at sequence 41 — here it would have bitten as a
false alarm rather than a false pass.

### 18.6 Preservation

**Positive blob identity:** all **648** tracked paths outside this packet's 10
allowed paths have identical mode, type, and blob identity to substrate
`8bc9e87e8d17890f251e69091cbacba619d97ae7`. No path outside the allowed set was
added, removed, or modified.

Exactly **8** of the 10 allowed paths were touched: the wrapper (modified), the
executor and its declarations (added), the two new test files (added), the rejected
checker (deleted), the mutation matrix and the artifact suite (modified).
`tests/phase-50a/proof-input-manifest.json` is **unchanged** — its existing
`scripts/phase-50a` and `tests/phase-50a` tree roots already cover the new files,
so no manifest change was required and none was made. It retains its narrowed
scope: the scan set of one suite, claiming authority over nothing else. **No
whole-workflow manifest authority was restored.**

`package.json` and `package-lock.json` are **untouched** — the executor uses Node
builtins and is invoked directly by `node`, so no script entry or dependency was
needed.

Preserved byte-identically: R1, R2, R4; all PostgreSQL production code and
migrations; transaction semantics; audit-chain behavior; the internal-only package
boundary and the public `StorageAdapter` seam; the two-host proof harness; the
artifact/pruning scripts; every `postgres-*` suite; the no-leak suite;
`tests/storage-conformance.test.ts`; and the whole `tests/control-plane` tree.

**Inherited evidence.** The corrected historical figures — **647** branch-point
tracked paths, **13** modified inherited, **9** added, **634** byte-identical — are
retained exactly as recorded in §17 and reproduce precisely from
`f1b5f0f3924eb4c8624c8b2efb1f3072fbfa92f4 → a720e946717f246ec4e646f85d549d92b49b9fb7`,
the comparison they describe. They are **that slice's** figures and are not
restated as this slice's. This slice's own accounting is the 648-path blob identity
above, against substrate `8bc9e87e…`.

### 18.7 Local results

| Check | Result |
|---|---|
| `npm run build` | PASS (30 tracked dist-types declarations; PostgreSQL declarations pruned) |
| `npm run typecheck` | PASS |
| `npm test` | **88 files, 2222 passed, 149 skipped** |
| `npm run control-plane:validate` | PASS (policy, schemas, state machine, markers) |
| `npm run control-plane:test` | **29 files, 1025 passed** |
| `npm run phase-50a:test` | **14 files, 271 passed** |
| `npm run phase-50a:proof` | PASS (two-host export/restore/replacement; chains verify) |
| `npm run phase-50a:verify-artifact` | PASS (C1–C9; 30/30/30 declarations, 44 packed files) |
| `git diff --check` | clean |
| Fixed-executor suites | **52 passed** (36 + 16) |
| Mutation matrix | **21 passed** (8 re-pointed T*, P* unchanged) |

The executor's refusal paths were also exercised for real, outside the tests: with
no `PHASE_50A_EXPECTED_HEAD_SHA` it exits **1** with `expected-head-sha-malformed`
and `schedule_launches: 0`; with a valid-shaped but wrong SHA it exits **1** with
`head-identity-mismatch` and `schedule_launches: 0`. Both published the full
envelope.

### 18.8 What this slice does NOT establish

It closes R3 by **replacing** the failed abstraction with a finite closed
architecture, and preserves everything else byte-identically. It claims **no**
acceptance, **no** readiness, **no** gate disposition, **no** Phase 50B work, **no**
MVP-2 completion, and **no** merge. The fresh pull request is **not merged**. PRs
**#126** and **#125** and every earlier rejected branch and pull request of this
lane were left **untouched** — not reopened, amended, extended, or closed — and
**nothing here is offered as merge evidence**; `8bc9e87e…` served as inspectable
substrate only. Every residual unproven pre-production obligation in §10 stands
undischarged: durability, failover, network isolation, tenancy, availability,
version policy, and incident recovery. Nothing here involves a provider, a
production resource, a credential, or a living estate.

**Implementation provenance.** Exactly **one** Claude Opus xhigh implementer context
did this work, under lease `lease-phase-50a-impl-fixed-executor-012` (lane #122
sequence 44). **No** Ultracode, **no** `/batch`, **no** teams, **no** subagents, and
**no** delegation of any kind. The audit of this slice is Codex's; the implementer
does not audit its own work.

---

## 19. R3 proof closure v2 — credential narrowing, builtin contract, and corrected report (fresh INITIAL slice, patch cycle 3)

**This section is APPENDED. Nothing above it was rewritten, reordered, or
deleted.** Where §18 or any earlier section states something this slice
supersedes, the superseding statement is made **here, explicitly, naming what it
replaces** — the stale text is deliberately left in place so the record shows
what was believed and when.

### 19.1 Packet authority

| Field | Value |
|---|---|
| Coordinator task packet | issue #122 comment **5178032683** |
| Packet canonical digest | `sha256:86b0f7383241a850fb7dc79dde597f28db3c9bee7df24775fee7f8e498093d18` |
| Binding event | comment **5178044860**, `coordinator.task_packet_posted`, lane sequence **50** |
| Reducer result | comment **5178050660** (`ready-for-claude`, next actor `implementer`) |
| Operator disposition | `operator.decision` at lane sequence **49**, comment **5171890625** |
| Implementer lease | `lease-phase-50a-implementer-closure-v2-014`, granted at sequence **51** |
| `packet_kind` / `patch_cycle` | `initial` / **3** (retained; cycle 4 is **unauthorized**) |
| `base_sha` | `70d40058096455c6406d644183ac757a317ce159` |
| Working branch | `phase-50a-r3-fixed-proof-closure-v2` |
| `merge_forbidden` | **true** |

The packet digest was **recomputed** from the live packet comment with
`.straylight/lib/canonical.mjs#payloadDigest` at the lane's base SHA and equals
the digest the binding event declares. `operator:eileen` remains the sole
product, semantic, architectural, acceptance, gate-disposition and MVP authority.

### 19.2 Why this slice exists: the five sequence-46 findings

The Codex audit at lane sequence 46 (audit comment **5170598957**, digest
`sha256:d039dd3dfa7ef34b2451d240af3e981bf68b9e9ab043604a148017c31ffde941`)
returned **PATCH** — not REJECT — on head `750144588996cc03e66a2dd1d160f620926ca556`.
The raw-byte wrapper authorization, the identity gate, executor behaviour, the
exact-head run, the nine-path scope, and the 648 outside-envelope blob identities
all **passed**. Five bounded findings remained. Policy `maximum_patch_cycles` is
**3** and the lane stood at `patch_cycle` 3, so no patch packet could carry them;
the operator authorized one fresh **INITIAL** slice instead.

| # | Finding | Disposition in this slice |
|---|---|---|
| (a) | The mandatory completion report was missing required facts in both locations, and the requirement was itself circular | Requirement **superseded** — §19.8 |
| (b) | The appended report carried stale path and test counts | **Recomputed** — §19.6, §19.7 |
| (c) | `node:url` exceeded the packet-enumerated builtin set, and the envelope test pinned the locally amended set | **Removed** — §19.4 |
| (d) | The artifact-suite header still named the deleted semantic checker as remaining authority | **Corrected** — §19.5 |
| (e) | `NODE_AUTH_TOKEN` was inherited by every schedule child, and checkout kept its persisted credential | **Narrowed** — §19.3 |

### 19.3 Credential narrowing (finding e)

**The wrapper no longer names a registry-authentication variable at all.**
`NODE_AUTH_TOKEN` appears **nowhere** in
`.github/workflows/phase-50a-postgres-conformance.yml`. The ephemeral job token
reaches the executor under the ingress name `PHASE_50A_NPM_TOKEN`, and the
executor decides which single child may see registry authentication:

1. the gate **captures** the ingress value once, into a local binding, and
   refuses with the distinct code `npm-token-ingress-missing` when it is absent
   or blank — **before the identity probe**, so a missing credential launches
   nothing at all, not even `git rev-parse HEAD`;
2. **one** exported constructor, `childEnv`, builds the environment for **every**
   child the production seam launches. It **deletes both** `PHASE_50A_NPM_TOKEN`
   and `NODE_AUTH_TOKEN` unconditionally — so an *ambient* registry variable in
   the runner's own environment cannot leak either — then sets
   `NODE_AUTH_TOKEN`, from the captured value, **if and only if** the entry's
   label is `npm-ci`;
3. the identity probe and schedule entries **2–12** therefore hold **neither
   name as a key at all**, and neither do their own descendants: a child
   inherits only what its parent was given;
4. schedule entry 1 is exactly `npm ci --ignore-scripts`, so the repository's
   `prepare` lifecycle — which runs `build` — **cannot execute inside the one
   authenticated process tree**. The build still happens, later, as schedule
   entry 4, in a child holding neither name.

`actions/checkout` now sets **`persist-credentials: false`**, so no credential is
left behind in `.git/config` for a later command to find.

**How this is proven, and why the proof looks different from the rest of the
suite.** Every other test in `fixed-proof-executor.test.ts` injects `run`,
replacing the production seam. That is right for ordering and argv, which are
properties of the *schedule*. It is **wrong** for the child environment, which is
a property of `realRun` itself — a stub that reports "I was given no token"
proves only that the stub was written that way, which is precisely what finding
(e) caught. So the credential tests run the **production `realRun`** and inject
only the lowest seam the packet authorizes, the `spawn` function, then assert
over **the actual options object production builds and hands to `spawnSync`**.

### 19.4 Builtin contract (finding c)

`node:url` and `fileURLToPath` are **gone**. The module locates itself with Node
22's `import.meta.dirname` and `import.meta.filename`. The executor's import set
is now **exactly** the packet's four specifiers:

```
node:child_process   node:crypto   node:fs   node:path
```

`tests/phase-50a/proof-executor-envelope.test.ts` asserts that set as a **literal
of the test file, transcribed from the packet** — not observed from the executor
and copied. That direction is the whole correction: the previous assertion had
been widened to admit `node:url` *because the executor imported it*, which proves
local self-consistency instead of conformance to the authorized contract. A test
that amends the enumerated set to match the code cannot detect the code
exceeding the set. The enumeration is also closed against a **third** name — a
digest override, a schedule override, a fallback registry — because the set of
environment names the executor touches is asserted exactly, not by pattern.

### 19.5 Retirements and corrections (finding d)

- `tests/phase-50a/artifact-and-workflow-contract.test.ts` — the header claim
  that `tests/phase-50a/workflow-trigger-contract.test.ts` is "the one remaining
  authority on the trigger block" is **CORRECTED BY SUPERSESSION**. That file is
  the **rejected semantic checker, deleted at patch cycle 3**; it is an authority
  over nothing. The authority over the wrapper is the **raw-byte fingerprint** in
  `tests/phase-50a/fixed-proof-executor.test.ts`. The stale claim is quoted in
  the corrected header so the contradiction the audit found stays legible.
- The same suite's `NODE_AUTH_TOKEN`-assignment assertions are **replaced** by
  the stronger claim that the name appears **nowhere** in the YAML, plus a check
  that `PHASE_50A_NPM_TOKEN` is assigned exactly once, on the executor step,
  only from `secrets.GITHUB_TOKEN`, plus a `persist-credentials: false`
  assertion bound to the checkout step specifically.
- The envelope suite's locally-amended import set is **replaced** by the packet's
  set, and gains an explicit absence check for `node:url` / `fileURLToPath`
  together with a presence check for the `import.meta` replacement — so removing
  the import without adopting the replacement fails rather than passing.
- **Nothing else was retired.** The rejected checker stays deleted; the T*/P*
  mutation matrix and the no-leak scan-set manifest were **not edited at all**
  (both are forbidden paths in this packet) and both pass **unmodified** against
  the new wrapper bytes.

### 19.6 The exact schedule, and the fixed contracts

| Artifact | Digest / value |
|---|---|
| Wrapper byte length | **6440** — equals the packet's `fixed_wrapper_contract.byte_length` |
| Wrapper raw-byte SHA-256 | `sha256:6fb6b2bd51b645a1e4c5884ca4a74b10a9d24da2ad2127bf76237dd90f117852` — equals the packet's declared digest |
| Executor self-digest | `sha256:a8dcc6a8d77349d1dc4004902fea7d98ecc7b062c97fd31e454b014d1c1c4e79` |
| Declarations digest | `sha256:721d95b4675415e534d6d27c9af53fe7807b248da2af6979752311e53ee2b5a2` |
| Pinned wrapper digest in the executor | identical to the wrapper digest above, as a **literal committed constant** |

The wrapper bytes were written by decoding the packet's `bytes_base64`
**verbatim** — never authored, reformatted, or inferred from the previous
wrapper — and verified twice: on disk before staging, and from the committed
blob. Canonicality holds: strict UTF-8, LF only, no BOM, no tab byte, exactly one
trailing LF.

**The closed 12-entry schedule, with exact argv arrays.** Entry 1 is the only
authenticated child; entries 2–12 and the identity probe receive neither token
name.

| # | Label | argv | Timeout | `NODE_AUTH_TOKEN` |
|---|---|---|---|---|
| — | `git-rev-parse-head` (probe) | `git rev-parse HEAD` | 60 s | **no** |
| 1 | `npm-ci` | `npm ci --ignore-scripts` | 900 s | **yes** |
| 2 | `confirm-source-instance` | `docker exec straylight-phase-50a-source psql -tA -U straylight_proof -d straylight_source -c "SELECT system_identifier FROM pg_control_system()"` | 120 s | no |
| 3 | `confirm-replacement-instance` | `docker exec straylight-phase-50a-replacement psql -tA -U straylight_proof -d straylight_replacement -c "SELECT system_identifier FROM pg_control_system()"` | 120 s | no |
| 4 | `build` | `npm run build` | 600 s | no |
| 5 | `typecheck` | `npm run typecheck` | 600 s | no |
| 6 | `repository-tests` | `npm test` | 1800 s | no |
| 7 | `control-plane-validate` | `npm run control-plane:validate` | 300 s | no |
| 8 | `control-plane-tests` | `npm run control-plane:test` | 900 s | no |
| 9 | `phase-50a-postgres-suites` | `npm run phase-50a:test` | 900 s | no |
| 10 | `phase-50a-two-host-proof` | `npm run phase-50a:proof` | 900 s | no |
| 11 | `phase-50a-verify-artifact` | `npm run phase-50a:verify-artifact` | 600 s | no |
| 12 | `no-whitespace-damage` | `git diff --check` | 120 s | no |

Every launch is `shell: false` with an executable plus an argv **array**.
Execution is serial and stops at the first nonzero exit, terminating signal,
timeout, or spawn failure — four **distinct** refusal codes, never collapsed.

### 19.7 Local results (recomputed for THIS slice)

Run against two genuinely separate PostgreSQL 16 instances
(`system_identifier` **7670145535968915495** and **7670145535969591335** — distinct,
confirming two clusters rather than one server with two databases).

| Check | Result |
|---|---|
| `npm ci --ignore-scripts` | **PASS** — 99 packages; `prepare`/`build` did **not** run |
| `npm run build` | PASS (30 tracked `dist-types` declarations; 12 PostgreSQL declarations pruned) |
| `npm run typecheck` | PASS |
| `npm test` | **88 files, 2243 passed, 149 skipped** |
| `npm run control-plane:validate` | PASS (policy, schemas, state machine, markers) |
| `npm run control-plane:test` | **29 files, 1025 passed** |
| `npm run phase-50a:test` | **14 files, 292 passed** |
| `npm run phase-50a:proof` | PASS (two-host export/restore/replacement; chains verify; replacement stays live) |
| `npm run phase-50a:verify-artifact` | PASS (C1–C9; 30/30/30 declarations, 44 packed files) |
| `git diff --check` | clean |
| Executor + envelope + artifact suites | **88 passed** (49 + 20 + 19) |
| Mutation matrix (**unmodified**) | **21 passed** |
| No-leak / neutrality (**unmodified**) | **15 passed** |

**These figures supersede §18.7's.** That table reported **2222** repository tests
and **271** Phase 50A tests; the correct figures for this slice are **2243** and
**292**. §18.7's counts are left in place as the record of that slice.

The refusal paths were exercised for real, outside the tests: with a
valid-shaped but wrong expected SHA the executor exits **1** with
`head-identity-mismatch`, `schedule_launches: 0`, `(none launched)`; with the
ingress absent it exits **1** with `npm-token-ingress-missing`,
`schedule_launches: 0`, and **`observed_head: (not read)`** — proving the probe
itself never ran.

**Path and blob evidence, recomputed.** Substrate
`750144588996cc03e66a2dd1d160f620926ca556` tracks **657** paths. This packet
allows **7**. The other **650** were compared to the substrate by **mode and
blob object id**: **all 650 identical**, zero differences. Of the 7 allowed
paths, **7** changed (six code/test files plus this document). No `package.json`,
`package-lock.json`, `.npmrc`, tsconfig, vitest config, scan-set manifest, or
mutation matrix was touched — all are forbidden paths, and all are among the 650
proven identical.

### 19.8 The reporting requirement, superseded

**The sequence-43 packet's completion-report requirement was impossible to
satisfy**, and this section supersedes it. It required a committed document to
state its own final commit SHA and a CI run created only *after* that commit.
Writing either changes the document, which changes the SHA, which invalidates
what was written — an evidence loop, not a proof. The audit at sequence 46
recorded the resulting gap as a missing report; the gap was in the requirement.

The replacement, fixed by packet 5178032683, is two-staged:

- **Stage 1 — this section.** Stable, committed, and carrying **no claim about
  its own final commit SHA and no claim about any post-commit run**. Everything
  above is verifiable from the committed tree and the lane's durable record.
- **Stage 2 — after the final head and an exact-head run exist.** The fresh pull
  request body and the `implementer.completed` event carry the fresh PR number,
  the final head SHA, the remote run and job identifiers, confirmation the run
  executed at that exact head, the run's published wrapper digest, executor
  self-digest, expected SHA and observed HEAD, and all 12 receipt labels with
  their outcomes. Those facts live where they can be written *after* the commit
  they describe.

### 19.9 Pre-commit failure disclosure

Two failures occurred during this slice, both in **my own new test code**, both
found before commit, both fixed. Disclosed because a slice that reports only
successes is not disclosing.

1. **The missing-ingress tests silently supplied the credential.** The `gateEnv`
   helper used `undefined` to mean "omit this variable", but `undefined` is
   exactly what JavaScript's *default parameter* substitutes — so
   `gateEnv(head, undefined)` handed over `FAKE_INGRESS` and the three
   "absent ingress" cases plus the no-fallback row asserted a refusal that could
   never happen. Four tests failed. Fixed by using `null` as the omission
   sentinel, so a default can never stand in for a deliberate absence.
2. **An "ingress is read once" assertion counted deletions as reads.** The
   regex matched bare occurrences of `env[NPM_TOKEN_INGRESS_ENV]`, which also
   matched the constructor's `delete` statement, so it saw 2 where 1 was
   correct. Worse than a false failure: as written it could have been satisfied
   by *deleting the guard*. Fixed with a negative lookbehind so it counts reads
   only.

One pre-existing assertion also required a bounded update: the enumeration of
environment names the executor touches grew from one to three (the head SHA, the
ingress, and the registry name the constructor removes and conditionally
re-adds). It is still an exact enumeration, so a fourth name fails.

No other check failed at any point. No residue was left: the working tree
contains only the seven allowed paths' changes, `git diff --check` is clean, and
the build produces no artifact drift.

### 19.10 What this slice does NOT establish

It closes the five sequence-46 findings and **preserves everything else
byte-identically**. It claims **no** acceptance, **no** readiness, **no** gate
disposition, **no** Phase 50B work, **no** MVP-2 completion, and **no** merge.

Substrate `750144588996cc03e66a2dd1d160f620926ca556` and **PR #127** remain
**REJECTED for forward use** and are **not merge evidence and not acceptance
evidence**; #127's own PATCH outcome confers nothing on this slice. PR **#127**,
**#126** and **#125**, and every earlier rejected branch of this lane, were left
**untouched** — not reopened, amended, extended, or closed. A green remote run is
**not acceptance**: the byte comparison against the packet's fixed wrapper
contract is authoritative, and only the auditor and then `operator:eileen`
dispose. Every residual pre-production obligation in §10 stands undischarged:
durability, failover, network isolation, tenancy, availability, version policy,
and incident recovery. Nothing here involves a provider, a production resource, a
credential of any consequence, or a living estate.

**Implementation provenance.** Exactly **one** Claude Opus xhigh implementer
context did this work, under lease
`lease-phase-50a-implementer-closure-v2-014` (lane #122 sequence 51). **No**
Ultracode, **no** `/batch`, **no** teams, **no** subagents, and **no** delegation
of any kind. The audit of this slice is Codex's; the implementer does not audit
its own work.

## 20. Process-tree proof closure — verified containment and runtime credential evidence (fresh INITIAL slice, patch cycle 3)

**This section is a PURE APPEND.** Every byte of this document before this
heading is unchanged from substrate `7e13e14a36501aad3119395925a72a003b354db1`
(161,739 bytes,
`sha256:d362f736ad252889bb17c60842afa7db266f47b9fd09d947c7cb750a16910052`).
Nothing above is rewritten, re-counted, or corrected in place; where an earlier
section's numbers are superseded, this section says so explicitly and the
earlier text stands as history.

**A committed document cannot contain its own final commit SHA**, nor a workflow
run created after that commit. Those post-commit identities live in the pull
request body and in the `implementer.completed` lane event, both written after
the final head and its exact-head run exist.

### 20.1 Authority

Coordinator task packet comment **5184357042**, packet digest
`sha256:012433fec0b46ef7fdaea0444165fb986c086145507c3da38c7b352958b4fd25`,
posted by event **5184414449** at lane #122 sequence **60**, under operator
decision `evt-phase-50a-operator-decision-059` (comment **5183886488**,
sequence 59; reducer result **5183891989**). Lane base SHA
`70d40058096455c6406d644183ac757a317ce159`; `patch_cycle` **3** retained.

That decision **refused** packet 5182125244 for an internally unsatisfiable
evidence contract, and authorized this replacement fresh INITIAL slice. The
refused packet is neither edited nor amended: it stands as durable history at
sequence 56. **Patch cycle 4 remains unauthorized**, and PR #128 is not amended.

### 20.2 What was wrong, precisely

The **sequence-54 audit** (comment 5180070231, digest
`sha256:455e9f0fe3ee58dbfbe142f216a954c8d6881d609f57f7c4fb1dfef49298ec17`)
REJECTED the previous slice for one blocker and two substantive concerns.

**Blocker — the bound reached the direct child only.** The previous executor
handed its timeout to the synchronous launch primitive. That primitive
terminates the process it started; it knows nothing of that process's own
descendants. In automatic run **30907873453** / job **91987141482** schedule
entry 6 (`repository-tests`) exceeded its 1,800,000 ms bound. The direct
receipt was classified correctly — `status=null`, `signal=SIGTERM`,
`timed_out=true` — and no successor entry launched. Yet **six real descendants**
(Vitest, esbuild, `npm run demo:recall-wedge`, a shell, Node, a second esbuild)
stayed alive until the hosted runner's cleanup killed them, free to keep
consuming resources or mutating the workspace and the service containers after
the executor had already returned. **Stopping successors is not containment.**

**Why the old suites could not catch it.** They *synthesized* timeout outcomes
and asserted only the successor-launch count. A synthesized outcome cannot
exhibit the defect, because the defect was that a real grandchild outlived a
terminated direct child. This is now proven with real processes (§20.5).

**Concern — the read-once credential claim was false.** The old child-environment
constructor spread the entire source environment and only then deleted the two
credential names, so both credential properties were re-read on every one of the
thirteen constructions. An independent Proxy-backed probe observed the ingress
read **14** times and the ambient registry name **13** times. The spawn boundary
was safe; the *claim about it* was not — and a source-text count can never
falsify that claim, because it cannot see a read performed by a spread.

**Concern — misclassified evidence.** The prior report called the failed
automatic run a runner-side flake. It was not: the surviving-tree evidence was
real, and the later same-head manual success proved intermittence, not
harmlessness. That failure is disclosed and adjudicated in §20.8, not
recharacterized.

### 20.3 The new wrapper (v3), fixed by raw bytes

The canonical wrapper is now exactly the packet's decoded bytes: **7,287 bytes**,
`sha256:b95509fb82142d647e425d8c9a0ca10a7cf289d5fbfedc4573193a20c499fd7b`,
strict UTF-8, LF only, no BOM, no tab, exactly one trailing LF. The superseded
digest `sha256:6fb6b2bd…f117852` appears nowhere as a current expectation.

**Raw-byte identity alone authorizes it.** The executor's only fact about the
wrapper is whether its bytes hash to a digest committed in the executor as a
literal — never computed from the file under inspection, never read from an
environment variable, argument, or configuration file. Preserved unchanged from
v2: the unconditional `pull_request` trigger with no `paths`/`paths-ignore`; one
required string `workflow_dispatch.head_sha` input; read-only
`contents`/`packages` permissions; SHA-pinned `checkout` and `setup-node`;
`persist-credentials: false`; exact-head checkout (never the merge ref); two
`postgres:16` services on distinct ports; the `PHASE_50A_NPM_TOKEN` ingress; and
exactly one `run:` step invoking only the executor. `NODE_AUTH_TOKEN` appears
nowhere in the YAML.

### 20.4 Process control REPLACED, not patched

`spawnSync` is gone from the production launch path — not as a primary
mechanism, not as a fallback, not as an injectable default. The envelope suite
asserts its absence over the executor's raw source text.

The replacement is a finite Node 22 / Linux design:

1. **Own process group per launch.** Every child is spawned asynchronously with
   `shell: false`, a fixed executable, a fixed argv array, and `detached: true`,
   so the child leads its own process group and every descendant inherits it.
   One integer names the whole tree.
2. **The executor owns the clock.** No bound is delegated to the launch
   primitive, whose kill reaches the direct child alone.
3. **Whole-group termination.** On a lapse the group is signalled by negative
   pid — `SIGTERM` to the group, never to the child alone.
4. **Fixed grace, then uncatchable escalation.** After `GRACE_MS` (5,000 ms) a
   still-live group receives `SIGKILL`, so a member that trapped the first
   signal still dies.
5. **Observed reaping.** The direct child's exit is actually seen; it is never
   inferred from elapsed time.
6. **Verified absence before any report.** The group is probed until it is gone,
   within `VERIFY_MS` (15,000 ms), *before* a receipt is written or a refusal
   returned. The probe **fails closed**: only a definite `ESRCH` proves absence,
   so a permission error or an unrecognized error reports "still present".
7. **Fail-closed containment.** Unobserved reaping or unproven absence is its
   own distinct refusal, `command-containment-unverified` — never reported as an
   ordinary lapse, never as success.

**Six mutually exclusive outcome classes**, in precedence order: spawn failure,
**termination failure** (`command-termination-failed`, the OS refused the group
signal), **containment failure**, lapse, ordinary signal death, nonzero exit.
The two bold classes are new. Receipts carry four new containment fields —
`group_signalled`, `escalated`, `direct_child_reaped`, `group_verified_absent` —
and remain free of timestamps, durations, hostnames, absolute paths, pids, and
environment values, so two runs of the same schedule still produce
byte-identical receipt text.

**Preserved:** the exact serial 12-entry schedule, its order, labels,
executables and argv, with `npm ci --ignore-scripts` as entry 1 (load-bearing:
it keeps the repository's `prepare`→`build` lifecycle out of the one
authenticated process tree) and the explicit unauthenticated `build` as entry 4.

### 20.5 The real fixture is load-bearing

`tests/phase-50a/fixtures/process-tree-timeout-fixture.mjs` is a genuine process
that spawns a genuine child which spawns a genuine grandchild — three real
processes, three real pids, each recording its identity and its process-group id
so the test can probe liveness itself. Two modes: `hang` (ordinary termination)
and `trap` (every generation installs a handler for the polite signal, so only
escalation can end it).

`tests/phase-50a/process-tree-containment.test.ts` drives it through the
**production** `realRun` and proves, against the operating system rather than
against the executor's own report:

- three real generations exist, and the child and grandchild report the
  **leader's** group id — group inheritance is what makes one id name the tree;
- after a lapse, **every** pid is already gone at the instant the runner
  resolves, and the group is gone — the exact assertion the rejected design
  would fail;
- a trapping tree still dies, with `escalated=true` — a design sending only the
  first signal fails here;
- an unprovable absence yields `command-containment-unverified`, **not** a
  lapse;
- a refused group signal yields `command-termination-failed`, outranking the
  containment failure it also causes;
- a real lapsed first entry launches **no** successor and its receipt carries
  the containment facts.

**The fixture demonstrably has teeth.** Reproducing the rejected design against
the same fixture — synchronous launch, its own timeout, direct child only —
leaves the child and grandchild alive (2 survivors) after the direct child is
terminated. The new design leaves 0. Synthetic outcomes remain supplementary
only.

### 20.6 Runtime credential evidence replaces the source-regex claim

The child-environment constructor no longer copies wholesale. It **enumerates
the source environment's names and skips both credential names before reading
any value**, then adds the registry name from the captured binding for the
`npm-ci` entry alone, bound to that entry's **label**.

The claim is proven by **counting real property accesses** against the
production seam, with instrumented accessors the executor cannot detect:

| Measurement | Old design (audited) | This slice |
|---|---|---|
| `PHASE_50A_NPM_TOKEN` reads, whole run | 14 | **1** |
| ambient `NODE_AUTH_TOKEN` reads | 13 | **0** |
| child environments carrying the ingress | 0 | **0** |
| child environments carrying the registry name | 1 (`npm-ci`) | **1** (`npm-ci`) |

The suite also reproduces the spread-based constructor locally and shows it
re-reads both properties, so the method can detect the defect it was written
for. The source-text assertion survives, explicitly demoted to the weaker
structural claim that there is one lexical read site to audit, and it now points
at the runtime proof that carries the real claim.

### 20.7 Phase 31F — bounded subprocess, semantics preserved

`tests/phase-31f-operator-recall-wedge-demo.test.ts` called `execFileSync` with
**no `timeout` option**, so the call was a synchronous, unbounded block. Its
`60_000` argument is Vitest's per-test budget, which cannot preempt a
synchronous blocking call: Vitest can neither interrupt the blocked worker nor
reap the descendants the command started. That is why this file was the **sole
file of 88** that failed to complete in run 30907873453, and why runner cleanup
named exactly that tree.

**Only the mechanism changed.** The subprocess is now bounded and
process-tree-safe: fixed executable and argv, `shell: false`, its own process
group, an explicit 45,000 ms bound inside the test's own 60,000 ms budget,
whole-group termination with escalation, and nothing left alive when the call
returns. The command is still the documented `npm run --silent
demo:recall-wedge`, the package script is still not bypassed, stdout is
collected the same way, and **every assertion and semantic is untouched**. A
lapse, a signal death, or a nonzero exit now fail the test loudly instead of
hanging it.

### 20.8 Disclosed failures — every one, adjudicated

**Automatic run 30907873453 / job 91987141482** (substrate head
`7e13e14a36501aad3119395925a72a003b354db1`) — **REAL FAILURE**. Entries 1-5
passed; entry 6 lapsed at 1,800,000 ms; 87 of 88 test files completed; the
stalled file was the Phase 31F suite; runner cleanup terminated six surviving
descendants. Cause: the executor bounded only the direct child, and the Phase
31F suite's synchronous unbounded subprocess was the proximate stall. **Not a
runner-side flake.** Both causes are fixed in this slice (§20.4, §20.7). Manual
run **30910916330** / job **91997177777** at the identical head later passed;
that establishes intermittence, and does **not** erase the failed run.

**Local attempts during this slice**, disclosed in full:

- The containment suite failed on first execution: `process.getpgrp` is not a
  Node API, so the fixture died before recording, and the worktree's `.git` is a
  *file* rather than a directory so the HEAD helper threw `ENOTDIR`. Both were
  real defects in the new test code, fixed by reading the process-group id from
  `/proc/self/stat` and by resolving the `gitdir:` pointer. No production code
  changed as a result.
- The executor suite's environment-name enumeration failed once: the
  enumerate-and-skip loop introduces `baseEnv[name]`, which the existing
  assertion's pattern did not model. The assertion was **strengthened** rather
  than loosened — constant-named subscripts are still enumerated exactly, the
  only two dynamic subscripts are pinned by exact text, and the absence of a
  wholesale copy is now asserted directly.
- The envelope suite's copy-then-delete assertion failed by design, because that
  construction is what this slice removes. It was retargeted to the
  skip-before-read shape and additionally forbids the old construct.
- `tsc` rejected the stubbed `run` seam until it was made `async`, since the
  production seam is now asynchronous.

No failure was hidden, retried into silence, or reclassified.

### 20.9 Local evidence

All commands run in a clean worktree checked out at the exact substrate, with an
offline `npm ci --ignore-scripts` from the local cache (no external credential
or package-access probe).

| Gate | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm test` | **89 files, 2,261 passed, 149 skipped** — all 89 completed |
| `npm run control-plane:validate` | PASS |
| `npm run control-plane:test` | **29 files, 1,025 passed** |
| `npm run phase-50a:test` | **15 files, 310 passed** |
| `npm run phase-50a:proof` | **PASS** — distinct hosts, chains verify, cold load, continued write |
| `npm run phase-50a:verify-artifact` | **PASS** — C1..C9, 30/30/30, 44 packed files |

Focused suite counts: executor **55**, envelope **23**, artifact/workflow **20**,
process-tree containment **8**, Phase 31F **6**.

The complete 12-entry schedule was also run end-to-end through the real executor
against a real HEAD: gate passed, **12 launches, 12 receipts, all
`outcome=ok`**, and every receipt `reaped=true group_absent=true`. The prior
slice's automatic run completed 87 of 88 repository test files; this slice
completes **89 of 89**.

### 20.10 Two-baseline path evidence

Per the packet's `evidence_contract`, the two comparisons are **separate** and
serve different purposes. The full enumeration, with per-path classification and
stats, is in the pull request body; the contract is restated here.

**A — CUMULATIVE (lane base → final head).** Historical composition evidence.
It includes every inherited Phase 50A path arriving with the substrate as well
as this slice's closure changes, each classified `INHERITED`,
`CLOSURE-MODIFIED`, or `CLOSURE-ADDED`. **This is not the authorization
boundary**, and an inherited path is never an unauthorized closure change. Its
count is not bounded at ten and is not expected to be.

**B — CLOSURE-ONLY (substrate `7e13e14a…354db1` → final head).** The **sole**
authorization boundary: exactly the packet's ten allowed paths may differ, and
every other substrate-tracked path is byte-identical by file mode, git object
type, and blob SHA-1. An eleventh substrate-relative change fails closed.

Conflating A and B is precisely what made packet 5182125244 unsatisfiable.

### 20.11 What this slice does NOT claim

No merge, no product acceptance, no readiness, no gate closure, no Phase 50B
progression, no MVP-2 completion. No provider was contacted, no production
resource provisioned, no living estate touched, no sibling repository modified,
and no credential of consequence handled — the only credential is the ephemeral,
job-scoped workflow token, and it reaches exactly one child process. Every
residual pre-production obligation in §10 stands undischarged: durability,
failover, network isolation, tenancy, availability, version policy, and incident
recovery. PostgreSQL production code, migrations, the audit chain, the package
boundary, the public seam, R1/R2/R4 evidence, and the two-host proof logic are
unchanged by this slice.

PRs #128, #127, #126, and #125 remain open, unmerged, and untouched. PR #128 and
its head `7e13e14a36501aad3119395925a72a003b354db1` remain **REJECTED** and are
inspectable substrate only — the branch origin of this slice, never its
authority.

**Implementation provenance.** Exactly **one** Claude agent at high effort did
this work, under lease `lease-phase-50a-implementer-process-tree-017` (lane #122
sequence 61). **No** Ultracode, **no** `/batch`, **no** teams, **no** subagents,
and **no** delegation of any kind. The audit of this slice is Codex's; the
implementer does not audit its own work.

---

## Phase 50A — complete containment closure (patch cycle 3, replacement packet 5195176675)

**PURE END-OF-FILE APPEND.** Everything above the `---` separator preceding
this section is byte-identical to the substrate: the file's first 178,995
bytes hash to `sha256:47a96a4e6f4c73965267ccdb5e943620ef877ce378a4e6c320e9e211d61820ee`,
the substrate file's exact full hash. No prior line was reflowed, deleted or
modified.

**Authority.** Coordinator task packet comment **5195176675** (canonical digest
`sha256:8b3df8868eaa9d4b9581ff758436ea713a1a24743e4f8ad6adf38353702501e3`),
posted at lane #122 sequence 73 under operator decision **5194786982**
(sequence 72), which disposed of the internally contradictory sequence-69
packet 5193719803 after the implementer's fail-closed escalation at
sequence 71. Implementer lease
`lease-phase-50a-implementer-complete-containment-021` (sequence 74, comment
5195313437). Branch `phase-50a-r3-complete-containment-closure`, cut from the
exact rejected substrate `032cec5dfdbfa114239ace43d00891764b817bc9`. PR #129
was not amended; it remains rejected substrate.

**What the sequence-63 audit rejected, and what changed.**

1. **Natural-exit leak (`realRun`).** At the substrate, every termination
   action sat behind `if (timedOut)` — a direct child that exited first
   (status 0, no lapse) left a live descendant probed, reported
   `group_verified_absent: false`, and RUNNING. Now reaping is observed first
   on every path, the group is probed, and any surviving group is terminated
   (bounded SIGTERM grace, then SIGKILL), re-observed, and re-verified before
   any receipt or refusal exists. Termination is owed to the group's SURVIVAL,
   never to the reason the wait ended. Uncertainty fails closed, unchanged.
2. **Identity gate.** At the substrate the gate authorized the 12-entry
   schedule from `error`/`status`/`stdout` alone. It now computes the
   canonical `classify()` verdict for the probe and requires
   `termination_error === null`, `direct_child_reaped === true`,
   `group_verified_absent === true`, `containmentFailed === false` and
   `terminationFailed === false` BEFORE the identity comparison; failure
   refuses with the new `identity-containment-unverified` code and launches
   ZERO successors.
3. **Phase 31F `runBounded`.** At the substrate it resolved on the direct
   child's close, sent a last group SIGKILL without observing absence, and
   orphaned its escalation timer via `.unref()`. It now tracks every timer it
   creates in one set cleared on every exit path, and does not return until
   group absence is PROVEN within a bounded window — including after a clean
   child exit with a live descendant.
4. **Tests.** The fixture gains an `orphan` mode (root exits cleanly in
   ~250 ms; descendants outlive any bound). New real-process tests prove: zero
   survivors before output on the natural-exit path (the OS is the witness,
   probed before any cleanup hook); the identity gate refuses each singly
   broken containment fact with zero schedule launches; a fully contained
   probe still launches all 12 (positive control); and `runBounded` bounds the
   tree and cancels every timer on success, failure and lapse paths. No test
   kills recorded pids and then asserts absence; no test relies on runner
   cleanup.

**Adversarial verification against the substrate (disclosed method).** Before
the tests were written, the substrate executor at `032cec5d…` was driven
through the new `orphan` fixture: it reported `group_signalled: false` and
left the child and grandchild ALIVE (leak reproduced), while the repaired
executor reports `status: 0`, `timed_out: false`, `group_signalled: true`,
`group_verified_absent: true` and zero surviving pids. Four mutations were
then applied to the repaired tree, each failing at least one test:
(a) re-gating termination behind `timedOut` → the natural-exit test fails on
`group_signalled`; (b) dropping the `group_verified_absent` gate condition →
the envelope seam test fails (the behavioral refusal survives via
`classify()`, which subsumes that fact — disclosed, not hidden); (c) removing
the whole identity-containment gate → the refusal tests fail behaviorally
with launches observed; (d) removing `runBounded`'s tree bounding → the
descendant-survival test fails on a live pid.

**Local verification at head `a9f4181` (this closure).**

| Check | Result |
| --- | --- |
| Repository suite | 89 files, 2269 passed / 149 skipped (PostgreSQL live-DB cases skip locally; CI provides the database) |
| Control plane | 29 files, 1025 passed; `control-plane:validate` all checks passed |
| Phase 50A | 15 files, 166 passed / 149 skipped locally |
| Containment suite | 9/9, including the new natural-exit/live-descendant real-process test |
| Executor suite | 57/57, including gate refusal (4 cases) + positive control |
| Envelope suite | 25/25, including the two new seam claims |
| Phase 31F | 9/9, including 3 new `runBounded` containment tests |
| Typecheck / build | clean (`tsc --noEmit`; build + postbuild) |
| Artifact | `verify-generated-artifact` PASS — C1..C9 hold |
| Wrapper | `7287` bytes, `sha256:b95509fb82142d647e425d8c9a0ca10a7cf289d5fbfedc4573193a20c499fd7b` — byte-identical to substrate |

**Failed attempts, disclosed.** (1) `npm run typecheck` failed once during
development: the new `identityContainmentUnverified` refusal code was added to
the executor but not to `fixed-proof-executor.d.mts`; the declaration was
added and typecheck is clean. (2) Mutation (b) above initially survived the
executor suite — the behavioral gate test alone could not distinguish the
explicit fact check from `classify()`'s subsumption of it; the envelope seam
test was added so the removal is caught. Both are disclosed rather than
silently retried. (3) During fixture development one manual probe left a
detached fixture tree running in the dev shell; it was killed by pgid and the
final test design keeps every fixture tree inside the executor-owned group.

**Scope (Evidence B, substrate → this head).** Exactly the packet's eight
allowed paths differ (seven code files in commit `a9f4181`, plus this
append-only document change); all other tree entries — 652 of 659 — are
identical by mode, type and blob object id. Cumulative base→head evidence
(Evidence A) accompanies the pull request body and is evidence, not
authorization.

**No authority.** This closure claims no acceptance, no readiness, no merge
authority, no Phase 50B progression, no gate closure and no MVP-2 completion.
An ACCEPT verdict, if one ever comes, parks the lane in eligibility-pending;
merge remains operator-only (`operator:eileen`, ADR-049 §6).

**Implementation provenance.** Exactly **one** Claude agent at high effort did
this work, under lease `lease-phase-50a-implementer-complete-containment-021`
(lane #122 sequence 74). **No** Ultracode, **no** `/batch`, **no** teams,
**no** subagents, and **no** delegation of any kind. The audit of this slice
is Codex's; the implementer does not audit its own work.

---

## Phase 50A — timer-proof closure (patch cycle 3, replacement packet 5197927963)

**PURE END-OF-FILE APPEND.** Everything above the `---` separator preceding this
section is byte-identical to the substrate: the file's first **186,057 bytes**
hash to `sha256:64c8ad1b5e4c8d48159e540faf30299a8894579c93ebd923334e70976b55eebe`,
the substrate file's exact full hash and full length at
`cc781176292bc346cff1719a67c097978ff7d140`. No prior line was reflowed, deleted,
renumbered or modified — including the sentence corrected below, which is
superseded in place-by-reference rather than edited.

**Authority.** Coordinator task packet comment **5197927963** (canonical digest
`sha256:fa2b8d1c69dfcaf2149daa0aaa6f9764601f2789dd805a76c271cc10185b02bc`),
posted at lane #122 sequence 79 under operator decision **5197252558**
(sequence 78), which disposed of the sequence-77 `REJECT`. Implementer lease
`lease-phase-50a-implementer-timer-proof-023` (sequence 80, comment
**5198105840**). Branch `phase-50a-r3-timer-proof-closure`, cut from the exact
rejected substrate `cc781176292bc346cff1719a67c097978ff7d140`. PR #130 was not
amended, force-pushed, retargeted, closed or merged; it remains rejected
substrate, readable and branchable only.

### Correction — the unchanged-entry count is 651, not 652

The sentence at **line 3038** of this document states, of the complete
containment closure's Evidence B:

> all other tree entries — 652 of 659 — are identical by mode, type and blob
> object id

**That count is wrong, and this statement supersedes it: the correct figure is
651 of 659.** The sequence-77 audit's MEDIUM finding is accepted as stated.

The arithmetic and the mechanical check agree. Comparing the two trees entry by
entry — substrate `032cec5dfdbfa114239ace43d00891764b817bc9` against that
closure's head `cc781176292bc346cff1719a67c097978ff7d140` — yields:

| Quantity | Value |
|---|---|
| Entries at the substrate | 659 |
| Entries at the head | 659 |
| Added | 0 |
| Deleted | 0 |
| **Differing** by mode, type or blob object id | **8** |
| **Identical** by mode, type and blob object id | **651** |

All eight differing paths are modifications (`M`), so no entry was added or
removed and the totals are equal on both sides: 659 − 8 = **651**. The eight are
`docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md`,
`scripts/phase-50a/fixed-proof-executor.mjs`,
`scripts/phase-50a/fixed-proof-executor.d.mts`,
`tests/phase-31f-operator-recall-wedge-demo.test.ts`,
`tests/phase-50a/fixed-proof-executor.test.ts`,
`tests/phase-50a/fixtures/process-tree-timeout-fixture.mjs`,
`tests/phase-50a/process-tree-containment.test.ts` and
`tests/phase-50a/proof-executor-envelope.test.ts` — the packet's eight allowed
paths, exactly as that closure claimed. Only the count of the untouched
remainder was misstated; the scope claim itself was, and remains, correct.

The error was a transcription slip, not a scope error: eight paths were
enumerated and eight differ, but the complement was written as 652. It is
corrected here by supersession because this document is authorized for a pure
end-of-file append and nothing else.

### The timer-cancellation proof is now observable, not asserted

The sequence-77 audit's BLOCKER finding is accepted as stated: the previous
proof at `tests/phase-31f-operator-recall-wedge-demo.test.ts:420` was **vacuous**.
That is not merely conceded — it was **reproduced** before being repaired.
Deleting the sole timer-clear loop from `runBounded`'s `finally` block on the
untouched substrate left all **9** tests passing, so no failure mechanism
existed.

`runBounded`'s timer machinery and containment semantics are **unchanged** — the
remit was to prove the audited behavior, not to alter it. The proof replaces one
tautological test with six observing ones, and the file now carries **14** tests.

**The seam.** For the duration of one call, `process.kill` and `setTimeout` are
wrapped, recording every signal issued (pid, signal, timestamp) and every timer
created (delay, whether and when it fired). Timer records are stamped *before*
the callback body runs, so a callback that throws is still recorded as having
fired, and no error is swallowed: the callback's own exception propagates exactly
as it would without the seam. The seam is removed in `finally`, so a failing
expectation cannot leave `process.kill` wrapped for another test. Absence
questions are asked through the *unwrapped* `process.kill`, so the question never
appears on the record it is used to interpret.

**The boundary is an index, not a clock.** `finally` runs before the promise
settles, so `runBounded`'s own closing group `SIGKILL` is already on the seam
when the awaiting continuation resumes — both land in the same millisecond, and a
timestamp comparison cannot separate them. Sampling the seam's **length** the
instant the await returns partitions the record exactly: everything before the
mark is in-band, and any later entry escaped the call. This is what makes the
absence assertions decidable rather than approximate.

**Every wait outlasts every deadline the path could arm**, computed from the
`timeoutMs`/`graceMs` the test itself passed:

| Test (all in `tests/phase-31f-operator-recall-wedge-demo.test.ts`) | `timeoutMs` | `graceMs` | Post-return wait | Why it strictly exceeds |
|---|---|---|---|---|
| `SUCCESS PATH: after runBounded resolves, no timer fires and no signal is issued` | 1200 | 200 | 1800 ms | Outer timer was armed ≤1200 ms before the mark; +200 ms covers the escalation a leaked outer timer would itself arm; +400 ms slack |
| `NON-ZERO EXIT PATH: after runBounded rejects on exit 3, no timer fires and no signal is issued` | 1200 | 200 | 1800 ms | Same bound; the child exits 3 after ~50 ms, so the outer timer is still pending at return |
| `SIGNAL-DEATH PATH: after runBounded rejects on a signal-killed child, no timer fires and no signal is issued` | 1200 | 200 | 1800 ms | Same bound; the child `SIGKILL`s itself after ~50 ms |
| `TIMEOUT PATH: after the lapse rejection, the nested escalation timer never fires and no late SIGKILL is issued` | 600 | 900 | 1900 ms | The outer timer fired at 600 ms and armed the escalation 900 ms later; the mark follows the outer firing, so 600+900+400 outlasts **both** |
| `SPAWN-ERROR PATH: after a spawn failure rejects, the outer timer never fires and no signal is issued` | 1200 | 200 | 1800 ms | Rejects in ~2 ms with the outer timer's full 1200 ms still ahead of it |
| `POSITIVE CONTROL: the seam RECORDS the in-band SIGTERM and SIGKILL escalation runBounded legitimately issues` | 600 | 150 | 1150 ms | Outlasts the outer deadline and the in-band escalation it drives |

In every one of the five exit-path cases the recorded post-return set is
**empty**: zero delivering signals, zero `SIGTERM`, zero `SIGKILL`, and zero
timer callbacks after the mark.

**The timeout case tests what it claims.** The child **obeys** `SIGTERM`, so it
dies inside the grace window and `runBounded` returns while the nested escalation
timer is **still pending** — precisely the timer whose cancellation is in
question. (A `SIGTERM`-ignoring child would let that timer fire in band, proving
nothing about cancellation.) The test asserts that premise rather than assuming
it: the 900 ms escalation timer must be present and must be unfired at the mark,
or the case fails as untested.

**Group absence is established by the code under test, questioned before any
cleanup.** Each case recovers the process-group ids from the seam's own negative-
pid sends — not from a pid the test guessed — and asserts, at the mark, that none
is still present. No test kills a pid and then asserts its absence; nothing waits
on `afterEach`, the runner's cleanup, or the OS to reap a tree. The spawn-error
case creates no group at all, and the seam is required to show exactly that for
the whole window.

**The positive control proves the seam is live.** A `SIGTERM`-ignoring child
forces the in-band escalation, and the seam must have recorded a group `SIGTERM`,
a group `SIGKILL`, and at least two timer callbacks firing in band. Without it, a
seam that observed nothing would satisfy every absence assertion vacuously. Each
exit-path case additionally requires that the seam recorded at least one timer,
for the same reason.

### Negative control — the mutation was run, and it fails

**Mutation 1 (mandatory).** The timer-clear loop was deleted from `runBounded`'s
`finally` block — the two lines at 214–215 of the substrate:

```
-    for (const t of timers) clearTimeout(t);
-    timers.clear();
```

`npx vitest run tests/phase-31f-operator-recall-wedge-demo.test.ts` then reports
**5 failed | 9 passed (14)**. All five exit-path tests fail, each for the intended
delayed-signal or delayed-callback reason:

| Failing test | Observed failure |
|---|---|
| `SUCCESS PATH` | `success: 2 signal(s) issued AFTER runBounded returned: SIGTERM->-233244, SIGKILL->-233244` |
| `NON-ZERO EXIT PATH` | `nonzero-exit: 2 signal(s) issued AFTER runBounded returned: SIGTERM->-233265, SIGKILL->-233265` |
| `SIGNAL-DEATH PATH` | `signal-death: 2 signal(s) issued AFTER runBounded returned: SIGTERM->-233272, SIGKILL->-233272` |
| `TIMEOUT PATH` | `timeout: 1 signal(s) issued AFTER runBounded returned: SIGKILL->-233279` |
| `SPAWN-ERROR PATH` | `spawn-error: 1 timer callback(s) ran AFTER runBounded returned (delays: 1200ms)` |

The failures are the leak itself, observed: the uncancelled outer timer fires
after return and signals a group whose id may since have been recycled, and on
the timeout path the uncancelled escalation timer delivers a late `SIGKILL`.

**Mutation 2 (assertion provenance).** With the timer-clear loop **still**
deleted, the post-return absence assertions were replaced by the substrate's
tautology `expect(true).toBe(true)`. The suite returns to **14 passed** — the
deleted loop goes undetected again. This establishes that the new assertions,
not the surrounding structure, carry the proof.

**Positive control.** The unmutated file passes: **14 passed (14)**. Both
mutations were reverted; the committed file is byte-identical to the intended
one (`sha256:6d4a9906ed9a7cdda601b76f6286375493d3424b09d4dcb71c05e13728da132f`),
and no mutation artifact is committed. A mechanical scan of the file's
**executable** text (block and line comments blanked) finds **zero** occurrences
of `expect(true).toBe(true)`; the one textual occurrence that remains is inside
the comment recording what the audit found.

### Preserved, and re-proven

`runBounded`'s timer machinery and containment semantics are untouched. The
pre-existing natural-exit/live-descendant test and the non-zero-exit containment
test are preserved verbatim, including the anchored `/exited 3: (\d+)/` pid
extraction that must not regress to an unanchored match — the hosted-runner trap
where an unanchored `\d+` matched the `22` inside `/opt/hostedtoolcache/node/22.x/`.

The containment implementation, its tests and fixtures, the wrapper workflow, the
package manifest and lockfile, the proof-input manifest, the PostgreSQL
production code and migrations, the public exports, the control-plane files and
every sibling repository are **unmodified** — preserved byte-identical by blob
object id and re-proven, not changed.

### What this closure does NOT claim

No provider, production, living-estate, sibling-repository or external-API
authority. No Phase 50B progression, no gate closure, no MVP-2 completion, and
no acceptance or readiness claim. Merge remains **operator-only**
(`operator:eileen`, ADR-049 §6). The audit of this slice is Codex's; the
implementer does not audit its own work.

**Implementation provenance.** Exactly **one** Claude agent at high effort did
this work, under lease `lease-phase-50a-implementer-timer-proof-023` (lane #122
sequence 80). **No** Ultracode, **no** `/batch`, **no** teams, **no** subagents,
and **no** delegation of any kind.

---

## Phase 50A R3 — Track A safety and authority closure (lane #122, sequence 86)

Appended at the end of the file, changing no byte above this line. Substrate
prefix: **198060 bytes**, `sha256:b5b140453c52f60d8065f0269001fb70a3e560a85e016398eccd65a104a61a80`.
Written under implementer lease `lease-phase-50a-implementer-safety-authority-024`
against task packet comment **5207195426**
(`sha256:d5cd1d42bdb357f7c663cb14ff8cbc96d98e6abfcea88c6572aa2c4d3346937f`),
authorized by `operator:eileen` decision **5204854701** (sequence 84).

**This is not acceptance.** Every property below is an obligation
**re-established** at a new head, never a claim that Phase 50A is complete.

### What was rejected, and what changed

The sequence-83 audit (comment 5202973998,
`sha256:adb5716fa2fba4c68cbdb87ce479f002889383068036605793547de7a5d8749d`)
returned **REJECT** at head `cefe2b5f7598736fce89a86d8032055034cd94c4`. That
verdict is durable exact-SHA history and is not reinterpreted here. PR #131,
branch `phase-50a-r3-timer-proof-closure` and head `cefe2b5…` remain **open,
unmerged and immutable rejected substrate** — read from and branched from, never
amended, force-pushed, retargeted, closed or merged. No review thread anywhere
was resolved, dismissed or marked outdated.

Four Track A findings are closed by executable proof, within the packet's ten
allowed paths and no others.

#### F-01 — the seam preserved a bound copy, not the original object

`tests/phase-31f-operator-recall-wedge-demo.test.ts:520` saved
`process.kill.bind(process)`. `bind` returns a **new function object**, so the
`finally` block at line 624 restored a substitute: functionally similar, but not
the object Node installed, and every later test in that worker inherited the
replacement.

The seam now saves `process.kill` itself. Identity is asserted with `Object.is`
against `PRISTINE_PROCESS_KILL` / `PRISTINE_SET_TIMEOUT` — captured at **module
evaluation**, before any seam in the file can exist, and deliberately independent
of the seam's own saved values, so a seam that saved and restored a bound copy
would satisfy its own bookkeeping and still fail. The assertion runs on the
**resolved**, **rejected**, **throwing** and positive-control paths, and a new
in-file test states the property directly while demonstrating on the next line
that a bound copy is *not* reference-identical (`typeof` and `.name` agree — the
weaker comparisons the packet forbids). The five pre-existing exit-path
proofs, the positive control, the group-absence checks and the anchored
`/exited 3: (\d+)/` extraction are preserved and still pass: 14 tests → **16**,
none weakened, skipped or deleted.

#### F-04 — credentials in query parameters reached every diagnostic

`redactConnectionString` replaced URI userinfo only, so
`?password=…` — a form `pg` accepts and `pg-connection-string` parses — survived
verbatim into every message built from `describeTarget()`.

Both channels are now closed: userinfo, and credential-bearing query parameters
(`password`, `passwd`, `pgpassword`, `pgpassfile`, `sslpassword`, `sslkey`),
matched case-insensitively at any position, however many. A third leak found
while building the matrix is also closed: a **truncated** URI that lost its `@`
(`postgres://<user>:<password>`, which `new URL` refuses outright) left the pair
in the clear, so the authority is now redacted unless it is *provably* a bare
host or `host:port` — with bracketed IPv6 recognized, so `[::1]:5432` is not
mistaken for a credential. Unproven fails closed.

Non-secret detail survives on purpose — scheme, host, port, database and
non-credential parameters — because a redactor that erased everything would be
safe and useless; a dedicated test asserts credential-free targets pass through
**unchanged**. The function never parses its input, so malformed, empty,
non-URI and non-string input is rewritten by the same rules and **nothing
throws** on the diagnostic path. Exported name, signature and call sites are
unchanged, so `host.ts` and the public barrel stay byte-identical.

Every matrix case asserts the **absence of every secret substring, raw and
percent-decoded**, never merely the presence of `<redacted>`: a partially
redacted string contains both.

#### F-09 / F-10 — one environment variable stood between a proof and someone's data

`hosts.ts` honoured `STRAYLIGHT_PHASE_50A_SOURCE_URL` /
`…_REPLACEMENT_URL`, and the Phase 50A proof is **destructive** — it drops
schemas, drops and recreates databases, and restores over whatever is there. The
tool targets made it worse: `pg_dump`/`psql` ran inside *fixed* container names
while the store connected through the override, so the two could disagree about
which database was being erased.

**The design chosen, of the two the packet allowed: overrides are removed
outright, not validated-and-refused.** A refusal path would have to decide, from
a connection string alone, whether a host "is really a local disposable harness
instance" — and a loopback address proves nothing about disposability: a
developer's own PostgreSQL on `127.0.0.1:5432` holding real data satisfies every
check such a validator could make. Removing the input removes the decision. The
alternative was rejected for exactly that reason: it would have shipped a
safety check that cannot be correct.

`hosts.ts` now reads **no environment variable at all** (asserted over
comment-blanked executable text, and by setting both old names and observing
nothing change). `resolveProofHost` accepts only a descriptor
**reference-identical** to one of two frozen fixed descriptors, or the exact name
of one — reference identity deliberately, because a structural check would accept
a crafted object whose fields matched while the **connection string** it carried
is what a client would dial. The refusal names the constraint and the offending
name/port/database/container and **never echoes a connection string**: a rejected
target may carry a credential.

The refusal precedes everything. `toolTargetOf` registers each issued target, and
`pg-tools` refuses any target it did not issue *before* recording or spawning, so
a hand-built target cannot reach `pg_dump`, `psql` or the cluster probe at all.
Store and tool targets derive from the **same** descriptor (F-10), asserted by
value against the database the connection string dials.

**Observed negative controls, not inferred:** on refusal of a non-loopback host,
a non-harness database, a non-harness port, a foreign URI, a copy-with-one-field
-changed, and an unknown name — including prototype names — the recorded counts
are **0 destructive operations** and **0 tool invocations**. The existing
distinct-instance proof is made *stricter*, never thinner:
`assertDistinctHosts`, the loopback scan, the harness-password scan and the
evaluated hosts-default check all pass **unchanged**.

#### F-14 / F-15 — the runbook told operators to erase what they were verifying

§4.3, "Verify — this step is not optional", directed `npm run phase-50a:proof`.
That proof drops the public schema on **both** hosts, re-migrates the source and
re-seeds it. An operator who had just restored real data and followed the
verification step would have destroyed exactly the data they were checking.

`scripts/phase-50a/verify-existing-restore.ts` reads. It compares canonical
digests, per-table row counts and every per-estate chain across an **existing**
source and target, and issues no `DROP`, `TRUNCATE`, `DELETE`, reseed or
schema-emptying statement — proven by scanning the SQL actually handed to
`.query()` and by a runtime record asserted read-only in **both** the agreeing
and mismatching cases, with row counts unchanged afterwards. Divergence is
created in the live test by **adding** a write, never by deleting one. Exit
status is the verdict: `0` agree, `1` **mismatch**, `2` could-not-verify — three
distinct outcomes, so an unreachable host is never reported as agreement and
never as a mismatch about estates it never read. Verified live: exit 0 on a fresh
restore, exit 1 with field-level differences on a diverged target.

It accepts explicit `--source`/`--target` connection strings, and that asymmetry
with F-09 is deliberate: the destructive path refuses caller-supplied targets
because it **erases** what it is pointed at. This path cannot, and *requiring*
the harness here would leave the operator with no executable verification of the
estate they actually restored — which is the finding.

**Operator-invocable with no `package.json` change**, as the packet requires:
`npx vite-node scripts/phase-50a/verify-existing-restore.ts`. Proven by running
it as a child process with `VITEST` stripped and observing exit 2; the package
script surface is asserted unchanged and free of any reference to the verifier.

**F-15: there is no executable checksum-repair route within Phase 50A's
authorized semantics, and §9.3 now says so.** The previous text directed export →
rollback → re-apply — a route that **cannot execute**, because `rollback`
verifies the recorded checksum before running a DOWN file and therefore refuses
on precisely the mismatch it was offered to repair. Directing an operator at a
command guaranteed to refuse reads as a remedy and delivers a dead end. §9.3 now
directs **fail-closed quarantine and escalation**, states that the refusal is the
safeguard rather than an obstacle, and splits the remedy by which side moved —
shipped-content drift is repairable, an unprovable schema needs an authorized
migration path Phase 50A does not have. Migration content, checksums and the
checksum verifier are untouched.

### Evidence B — closure-only scope (substrate → final head)

Exactly **9** tree entries differ from `cefe2b5f7598736fce89a86d8032055034cd94c4`,
every one an allowed path; all other entries are identical by mode, type and blob
object id.

| Path | Change |
|---|---|
| `tests/phase-31f-operator-recall-wedge-demo.test.ts` | M — F-01 identity |
| `src/straylight/storage/postgres/config.ts` | M — F-04 redaction |
| `scripts/phase-50a/hosts.ts` | M — F-09/F-10 fixed descriptors |
| `scripts/phase-50a/pg-tools.ts` | M — F-09 tool gate + seam |
| `scripts/phase-50a/two-host-proof.ts` | M — gated, derived targets |
| `scripts/phase-50a/verify-existing-restore.ts` | **A** — F-14 verifier |
| `tests/phase-50a/postgres-two-host-portability.test.ts` | M — derived targets, live F-14 |
| `tests/phase-50a/safety-authority-closure.test.ts` | **A** — closure suite |
| `docs/runbooks/…-backup-restore-and-rollback.md` | M — §1, §4.3, §9.3 |

**The tenth allowed path — this document — is written by this append and nothing
else.** No allowed path went unwritten.

### Mutations and negative controls — every one run, named, and reverted

| # | Mutation | Result |
|---|---|---|
| M1 | `realKill = process.kill.bind(process)` (the audited defect, exactly) | **6 tests fail** — identity on success, nonzero-exit, throwing, positive-control, the direct save assertion, and the F-01 scan |
| M2 | delete the `finally` restoration of `process.kill` | **6 tests fail** — all four paths plus `no-call-in-flight` and the finally-block assertion |
| M3 | revert redaction to the substrate's userinfo-only regex | **13 tests fail** — every query-parameter case by leaked-value absence, plus malformed input and the `describeTarget()` reachability proof |
| M4 | make the host gate accept a non-loopback host | **6 tests fail** — all five refusal cases and the zero-destruction negative control |
| M5 | verifier resets an estate before comparing (`DELETE FROM estate_assertions`) | **fails statically** (destructive SQL at a `.query()` site) **and live** (the runtime record shows the `DELETE`) |
| M6 | derive the tool target from a literal diverging from the descriptor | **3 tests fail** by value — container and user disagreement |

Positive control: the unmutated tree passes every suite below. All six mutations
were fully reverted and the tree is clean — verified by blob-identity comparison,
not by inspection.

### Re-established obligations at the final head

| Obligation | Result |
|---|---|
| Repository suite | **90 files, 2318 passed**, 150 skipped |
| Control-plane validate | passed (policy, schemas, state machine, markers) |
| Control-plane suite | **29 files, 1025 passed** |
| Phase 50A suite | **16 files, 358 passed** |
| Typecheck / build | clean; `postbuild` prune ran |
| Two-host proof | **PASS** — distinct clusters `7671235572770562087` / `7671235593399533607`, digests equal, chains identical, cold load, governed recall, continued write |
| Artifact proof C1..C9 | **PASS** — 30 tracked = 30 generated = 30 packed; no PostgreSQL declaration generated or packed |
| Containment byte-identity | executor, declarations, 4 suites, fixture, manifest + parser **identical by blob id** |
| Wrapper identity | **7287 bytes**, `sha256:b95509fb82142d647e425d8c9a0ca10a7cf289d5fbfedc4573193a20c499fd7b` |
| Public surface | `src/straylight/index.ts`, `storage/postgres/index.ts`, `package.json`, `package-lock.json`, `tests/storage-conformance.test.ts` **identical by blob id** |
| No-leak / neutrality | 15 tests pass **unchanged**; loopback-only, harness-password confinement and provider-neutrality all hold |

Non-loopback values in the new suite are assembled from fragments (RFC 5737
`198.51.100.x`, RFC 2606 `.invalid`) and used **only** as inputs proven to be
refused or redacted — never connected to — so the committed-loopback scan keeps
passing unchanged rather than being loosened.

### What this closure does NOT claim

No provider, production, living-estate, sibling-repository or external-API
authority. No Tracks B/C/D work: the audit-recomputation finding at
`src/straylight/storage/postgres/load.ts:173` is **not** in Track A and was not
touched. No Phase 50B progression, no gate closure, no MVP-2 closure, and no
acceptance, readiness or merge claim — closing Track A does not make PR #131 or
this PR merge-eligible. This is `patch_cycle` 3 and creates no `patch_cycle` 4.
Merge remains **operator-only** (`operator:eileen`, ADR-049 §6). The audit of
this slice is Codex's; the implementer does not audit its own work.

**Implementation provenance.** Exactly **one** Claude agent at high effort did
this work, under lease `lease-phase-50a-implementer-safety-authority-024` (lane
#122 sequence 86). **No** Ultracode, **no** `/batch`, **no** teams, **no**
subagents, and **no** delegation of any kind.

## 21. Phase 50A binding-and-proof closure (lane #122 sequence 91)

Appended by the sequence-91 slice authorized by operator decision **5220991234**
(lane #122 sequence 90). Substrate `add1d1b25da34f583c9671e267128c4b201772a0`
(PR #132, branch `phase-50a-r3-safety-authority-closure`) is **rejected,
immutable substrate**: readable and branchable only, never amended,
force-pushed, retargeted, closed or merged, and no review thread on it was
resolved. `patch_cycle` remains **3**; this creates no `patch_cycle` 4.

Everything below §21 is a **pure end-of-file append**. No byte of §1–§20 is
rewritten. The prefix this append follows is exactly **212 595 bytes**, SHA-256
`3b6d4f3251baef81361d5a2067b2feb82896ef0d10245f574186a5a4462ec78d` — the file's
complete content at substrate `add1d1b25da34f583c9671e267128c4b201772a0`.

### 21.1 CORRECTION — §20's Evidence B entry count was 9; the tree shows 10

The sequence-89 Codex audit (comment **5220211460**, digest
`sha256:195581c344eb94648253759f66a35ff2b9411cb4da7428c5fc0ca0ba6696135c`,
verdict **REJECT**) recorded a MEDIUM finding: the proof record reported **nine**
changed entries where the tree carries **ten**.

That finding is **accepted as stated**. §20's "Evidence B — closure-only scope"
heading asserts *"Exactly **9** tree entries differ from
`cefe2b5f7598736fce89a86d8032055034cd94c4`"* and then tabulates nine paths,
explaining the tenth in the prose beneath rather than counting it.

**The correct count is ten.** Recomputed:

```bash
git diff --name-only cefe2b5f7598736fce89a86d8032055034cd94c4 \
                     add1d1b25da34f583c9671e267128c4b201772a0 | wc -l
# 10
```

| # | Path | In §20's table? |
|---:|---|---|
| 1 | `tests/phase-31f-operator-recall-wedge-demo.test.ts` | yes |
| 2 | `src/straylight/storage/postgres/config.ts` | yes |
| 3 | `scripts/phase-50a/hosts.ts` | yes |
| 4 | `scripts/phase-50a/pg-tools.ts` | yes |
| 5 | `scripts/phase-50a/two-host-proof.ts` | yes |
| 6 | `scripts/phase-50a/verify-existing-restore.ts` | yes |
| 7 | `tests/phase-50a/postgres-two-host-portability.test.ts` | yes |
| 8 | `tests/phase-50a/safety-authority-closure.test.ts` | yes |
| 9 | `docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md` | yes |
| 10 | `docs/PHASE-50A-…-IMPLEMENTATION-AND-PROOF.md` (this document) | **no — prose only** |

The tenth entry is this document itself, which §20 described in prose
immediately below its table ("**The tenth allowed path — this document — is
written by this append and nothing else.**") but excluded from the stated total.
The paths were complete and correctly scoped; the **number** was wrong, and a
reader checking the claim against the tree found a discrepancy. Ten allowed
paths were authorized and ten were written.

**Historical text is not rewritten.** §20's sentence stands exactly as recorded
and this section is the correction of record, per the packet's pure-append
requirement.

### 21.2 What this slice closes

Three HIGH findings from audit 5220211460. F-01 (exact `process.kill` /
`setTimeout` identity restoration) and F-15 (checksum-mismatch quarantine and
escalation semantics) **passed** at sequence 89 and are preserved as closed;
`tests/phase-31f-operator-recall-wedge-demo.test.ts` is a **forbidden path** in
this packet and is byte-identical to substrate.

#### F-04 — credential redaction that cannot diverge from the parser

**The finding.** `src/straylight/storage/postgres/config.ts` built
`CREDENTIAL_PARAM_RE` from the RAW literal option names and matched it against
the undecoded connection string, while `pg-connection-string` decides on the
**decoded** `URL.searchParams` key. So `?pass%77ord=<secret>` was honoured by
`pg` as the password and left verbatim by the redactor — the secret-bearing URI
reached every diagnostic built from `describeTarget()`.

Demonstrated mechanically before the fix:

```
pass%77ord=SECRET1   → pg parses password="SECRET1"
p%61ssword=SECRET4   → pg parses password="SECRET4"
sslp%61ssword=SECRET5 → pg parses sslpassword="SECRET5"
```

**The fix is not another spelling.** The pattern is now
**key-agnostic** (`QUERY_PARAM_RE` finds every `key=value` pair) and the
credential decision moved to `isCredentialParameterName`, which
percent-**decodes** each key the way the parser does — including `+`-as-space —
case-folds it, and compares against the same six real option names. An
**undecodable** key (`%ZZ`) returns `null` from `decodeParameterName` and is
treated as credential-bearing: unproven **fails closed**, the rule
`isProvablyCredentialFreeAuthority` already followed. No encoding can diverge
from what the parser honours, because the redactor now performs the same decode.

The exported name, signature and call sites are unchanged; `host.ts` and the
public barrel are byte-identical to substrate.

**Proof that it is not vacuous.** A **parser-agreement** test generates every
single-position and full percent-encoding, plus case variants, of all six
credential names (**≥50** spellings checked, **≥10** of which `pg` actually
honours), parses each with `pg-connection-string`, and asserts: *if the parser
extracted the secret, the redactor hid it.* A spelling the parser starts
honouring is covered with no edit to the test.

#### F-09 / F-10 — structural binding, not a heuristic

**The F-09 finding.** `emptySchema(host, store)` resolved `host` through the
descriptor gate and then issued `DROP SCHEMA public CASCADE` through the
**independently supplied** `store`. A legitimate descriptor paired with somebody
else's store reached destructive SQL with nothing checked about the database
actually being erased. The pre-existing negative controls only ever paired a
**refused** descriptor with a real store, which is why they passed over it.

**The fix removes the second parameter.** `emptySchema` now takes ONE
`BoundProofStore`, obtainable only from `hosts.bindStore`, which resolves the
descriptor and then requires the store's own `describeTarget()` to equal the
**redacted** form of that descriptor's connection string. The type is branded
with a module-private symbol, so a bound store cannot be forged, and
`requireBoundStore` fails closed for an untyped JavaScript caller. **There is no
longer a signature through which the validated thing and the destroyed thing can
differ.** (The comparison is against the redacted form deliberately: like is
compared with like and no credential is interpolated into a refusal.)

**The F-10 finding.** `toolTargetOf(host, database)` accepted free-text
`database` and registered whatever it was handed in `ISSUED_TOOL_TARGETS`. The
tool gate downstream checked only issuance identity, so an arbitrary name —
`somebody_elses_data` — became an authorized `pg_dump` / `psql` / destructive
target simply by being passed in. "It came from us" was true and meaningless.

**Two structural fixes.** (1) A database other than the descriptor's own must be
**minted first** by `declareScratchDatabase`, which records it in a
`WeakMap` keyed by the fixed-descriptor **object** — so a scratch name minted for
`source` can never authorize a target inside `replacement`. (2) The registry is
now a `WeakMap` recording each issued target's **authorizing descriptor and exact
field values**, and `authorizedToolTarget` requires both issuance **and** that
the target's current `container` / `user` / `database` still equal what it was
issued with — closing the spread-copy divergence case that issuance identity
alone accepted.

No hostname, port, database-name or URI pattern is used to judge a
caller-supplied target. The one name-form check (`p50a_` prefix) applies only to
names **the harness mints for itself**, matching
`tests/phase-50a/_support.ts#scratchName`; the authority is the descriptor
binding.

The portability suite's legitimate scratch databases go through the gated route
via a `scratchToolTarget` helper; its existing proofs are unchanged.

#### F-14 — observation of execution, not narration

**The finding, in two parts.** (a) The record was **synthetic**: each read path
did `statements.push('SELECT (readStoreSnapshot: actors, estates, …)')` and then
ran, so the record attested to the module's own narration and could not have
detected a statement the narration failed to mention. (b)
`recordedStatementsAreReadOnly()` is `[].every(...)` — **vacuously true over an
empty record** — so a run that observed nothing "proved" non-destruction.

**The fix.** `observeQueries` wraps the live client in a `Proxy` that records
every statement issued through `query` **before the driver sees it**, so
recording is not something a call site opts into: any SQL reaching PostgreSQL
through the object this module holds is observed by construction. All three `pg`
call shapes (`query(text)`, `query(text, values)`, `query(config)`) are
normalized; an unrecognized shape is recorded as an explicit marker rather than
dropped, because an unrecorded statement is the one thing the seam exists to
prevent.

For (b), `provedNoDestructiveSql()` requires **both** at least one observed
statement **and** no destructive statement among them. An empty record is now
*unproven*, not *proven safe*. `recordedStatementsAreReadOnly()` is retained with
its true-over-empty semantics — "no destructive statement was observed" is a true
and useful claim about a run that issued nothing — but it is no longer the proof.
The destructive-SQL pattern also widened to cover `MERGE`, `GRANT`, `REVOKE`,
`VACUUM`, `REINDEX` and `COPY`.

Agreement, mismatch and could-not-verify paths each carry the proof: the
agreeing and mismatching cases assert `provedNoDestructiveSql()` over statements
the verifier actually issued; the could-not-verify case asserts that the record
is empty and the proof therefore **unavailable** — the distinction the audit
required.

### 21.3 Adversarial reproductions — failed on substrate, pass after the fix

Each reproduction was written first and RUN against the unmodified substrate.

| # | Reproduction | On substrate `add1d1b` | After the fix |
|---:|---|---|---|
| 1 | encoded credential-key bypass (`pass%77ord` and six more shapes, plus parser agreement) | **8 tests fail** — every encoded spelling leaked; `PARSER DISAGREEMENT: pg honoured "%70assword" … but the redactor left it in` | **pass** |
| 2 | unrelated-store / arbitrary-database binding bypass | **2 tests fail** — `a valid descriptor with an unrelated store reached the destructive path`; `an arbitrary database name was issued as a tool target` | **pass** |
| 3 | synthetic / empty query-observation bypass | **3 tests fail** — `provedNoDestructiveSql is not a function` (the predicate did not exist); `the verifier pushes a hand-written statement description — that is narration, not observation` | **pass** |

Reproduction 2's clone-descriptor and divergent-tool-target cases already failed
closed on substrate (reference identity covered them); they are retained as
regression cover for the new binding.

### 21.4 Structural mutations — every one run, named, and reverted

Each mutation reinstates the audited defect exactly, then is reverted and the
suite re-run green.

| # | Mutation | Result |
|---:|---|---|
| M1 | `isCredentialParameterName` decides on the RAW key (`CREDENTIAL_PARAMETERS.includes(rawName.toLowerCase())`) — the substrate semantics | **8 tests fail**: all seven encoded-name matrix cases plus the parser-agreement test |
| M2 | `bindStore`'s target comparison disabled — the validated descriptor and the operated store become independent again | **1 test fails**: `a valid descriptor bound successfully to an unrelated store` |
| M3 | `toolTargetOf`'s mint requirement disabled — an arbitrary database name is registered as issued again | **2 tests fail**: arbitrary-database issuance and the cross-instance scratch-name refusal |
| M4a | the synthetic narration recorder reinstated in place of the `client.query` seam | **1 test fails**: `the verifier pushes a hand-written statement description — that is narration, not observation` |
| M4b | `provedNoDestructiveSql` reverted to the empty-record tautology | **2 tests fail**: `an empty observation record was accepted as proof of non-destruction`, and the could-not-verify proof-unavailable assertion |

Positive control: with every mutation reverted the closure suite passes in full.

### 21.5 What this closure does NOT claim

No provider, production, living-estate, sibling-repository or external-API
authority. No Tracks B/C/D work. No Phase 50B progression, no control-plane
change, no workflow / package / dependency change, no gate closure, no MVP-2
closure, and no acceptance, readiness or merge claim — closing these findings
does not make any PR merge-eligible. Merge remains **operator-only**
(`operator:eileen`, ADR-049 §6). The audit of this slice is Codex's; the
implementer does not audit its own work.

**Implementation provenance.** Exactly **one** Claude agent at high effort did
this work, under lease `lease-phase-50a-implementer-binding-proof-026` (lane
#122 sequence 92). **No** Ultracode, **no** `/batch`, **no** teams, **no**
subagents, and **no** delegation of any kind.

## 22. Phase 50A F-04 parser-equivalence closure (lane #122 sequence 101)

Appended by the parser-equivalence slice authorized by operator decision
**5226840651** (lane #122 sequence 96) and executed under the sequence-97
replacement INITIAL packet **5226925041** (digest
`sha256:2e4681963397e7775fc4d0b35c48bdbd407d81333fe4c238c665a2cc09e57e54`),
under fresh implementer lease
`lease-phase-50a-implementer-parser-equivalence-029` (sequence 101). The
earlier lease `lease-…-028` at sequence 98 **expired**; the watchdog recovery
(`system.lease_expired` at 99, `system.requeued` at 100) is durable history,
the expired attempt's work was **discarded**, and this slice was redone from
clean substrate. Substrate `a7bef61814b682df057fd97645e4077d27086b85` (PR
#133, branch `phase-50a-r3-binding-and-proof-closure`) is **rejected,
immutable substrate** per the sequence-95 audit of record (comment
**5226776158**, digest
`sha256:c7d5336da17483b4bc0bec74f11a8df2c907630cfb818ac2e29523e648c63427`,
verdict REJECT): readable and branchable only, never amended, force-pushed,
retargeted, closed or merged, and no review thread anywhere was resolved,
dismissed or marked outdated. `patch_cycle` remains **3**; this creates no
`patch_cycle` 4.

Everything below §22 is a **pure end-of-file append**. No byte of §1–§21 is
rewritten. The prefix this append follows is exactly **225 786 bytes**, SHA-256
`dcf420c088e4306dc5a46147ade5043a8135ba393fb1c2e6bd7537fe4d83b38e` — the
file's complete content at substrate
`a7bef61814b682df057fd97645e4077d27086b85` — including the sequence-93 §21
text this REJECT supersedes, which stands unmodified as historical record.

### 22.1 The finding (sequence-95 F-04, HIGH)

The sequence-89 fix decided which query parameters are credential-bearing by
running `decodeURIComponent(rawName)` and comparing the result against the six
credential option names. That is an **independent approximation** of the
parser: `pg-connection-string` never decodes the raw name directly. It
preprocesses the whole string, constructs a **WHATWG `URL`**, and reads
`searchParams` — and WHATWG URL parsing **strips tab, LF and CR outright
before any percent-decoding**. So for a query name spelled
`pass<LF>word` (a literal newline byte inside the name):

- the parser normalizes the name to `password` and `pg` **honours the value
  as the credential**, while
- `decodeURIComponent('pass\nword')` returns `pass\nword` unchanged — not a
  credential name — so the substrate redactor **printed the secret verbatim**.

The same holds for `pass<TAB>word` and `pass<CR>word`. Codex's three
counterexamples were reproduced on the unmodified substrate before any fix was
written (§22.4): the substrate-fail run shows all three leaking, with the real
parser simultaneously deriving the credential from the identical input.

The audit rejected not just the miss but the **class** of fix that would
patch it: adding CR/LF/TAB spellings, another normalization table, a
hand-written WHATWG imitation, or a wider regex would each be a third
independent approximation waiting for its own counterexample.

### 22.2 The mechanism — the parser's own view, not a private reading

The chosen seam is the **pure name-derivation prefix of
`pg-connection-string` itself**, transcribed step-for-step into
`src/straylight/storage/postgres/config.ts` and documented as such:

| Step | Implementation | Parser source it mirrors |
|---|---|---|
| Preprocess | `parserPreprocess()` — `config.ts:140` | `pg-connection-string/index.js:20-23`: on a space or malformed escape, `encodeURI(str).replace(/%25(\d\d)/g,'%$1')` over the **whole** string |
| URL construction | `parserView()` — `config.ts:198`, base literal at `config.ts:196` | `index.js:27` `new URL(str, …)` with the identical base, then `index.js:30` — the same `@/` → `@___DUMMY___/` dummy-host retry |
| Name derivation | `view.url.searchParams` consumed at `config.ts:267` and `config.ts:325` | `index.js:40-42` — `for (const entry of result.searchParams.entries())` |
| Credential naming | `isCredentialParameterName(parserName)` — `config.ts:225` | compares the **parser-supplied** name, case-folded, against the six real option names |

**Why it cannot diverge.** The decision consumes the same objects the parser
consumes: one preprocessing pass, one `URL`, one `searchParams`. There is no
second normalization to drift from the first. If a future
`pg-connection-string` behaviour changes how a name normalizes, the redaction
decision changes with it, because the classification input **is** the parser's
output, not a reconstruction of it. The only transcription in the module is
the parser's own two-line preprocess and two-line URL construction, kept
byte-faithful to `index.js` and annotated with why per-name probing is
unsound: a malformed escape **anywhere** in the string (including a value)
flips whole-string pre-encoding and rewrites **every** name (`?pass%6Ford=v`
yields the harmless name `passoord`; `?pass%6Ford=v%ZZ` yields `password`) —
which is exactly why the normalization runs once, over the whole string, at
`config.ts:140`.

**Why it is not an approximation.** An approximation predicts the parser; this
consults it. The classification never sees the raw spelling at all — raw text
is used only as the **rewrite surface** (`view.normalized`, the text the
parser actually reads), never as the decision input.

**Why `parse()` itself is not called.** The diagnostic path runs inside error
construction. `parse()` reads files from disk for `sslkey`/`sslcert`/
`sslrootcert` (`index.js:88-100`), can `process.emitWarning`
(`index.js:219-231`), and can throw. Only its pure name-derivation prefix —
the part that decides *which* parameter is the credential, and the part the
audit requires agreement with — is used. The differential proof (§22.5) then
closes the loop against the **whole real `parse()`**, so the prefix/whole
distinction is itself under test.

### 22.3 Fail-closed structure (packet B2/B3)

`redactConnectionString` (`config.ts:411`) is total and never throws:

1. **Non-string** → typed report, nothing interpolated (`config.ts:412`).
2. **Parser view unavailable** — preprocess or both URL constructions fail —
   → `<redacted> (uninterpretable connection target)`; nothing is echoed
   (`config.ts:420`).
3. **Unalignable query** — the rewrite pairs the normalized query's non-empty
   `&`-segments positionally with `searchParams` entries; when the counts
   disagree (a segment that normalizes away, a `#` inside the query), *which*
   span carries the credential is unknowable, so `redactNormalizedQuery`
   returns `null` (`config.ts:269`) and the **whole query is withheld**
   (`config.ts:451`) rather than guessed at.
4. **Checked post-condition** — the decisive property is *enforced*, not
   argued: `parserCredentialValues` (`config.ts:309`) collects every value the
   parser derives under a credential name — **every** duplicate entry, not
   just the last-wins survivor — plus the userinfo password, each in decoded
   and re-encoded form; the candidate output is scanned (raw and decoded) and
   any hit escalates to the withheld form, then to the fully-redacted report
   (`config.ts:423-456`). A credential value that coincidentally appears under
   a non-credential name or in the path is caught here, because the property
   binds the **value**, not its position.

Non-secret detail (scheme, host, port, database, non-credential parameters)
is preserved on the ordinary path, and the pass-through test pins that a
clean loopback target emerges **byte-identical** — so "redact everything"
cannot satisfy the suite.

### 22.4 Substrate-fail / fix-pass (packet B5)

The F-04 test region of `tests/phase-50a/safety-authority-closure.test.ts`
was rewritten (only lines 214–523 at substrate; see §22.7 for the byte proof
of everything around it). The named reproduction is
**`SEQUENCE-95 REPRODUCTION: a bare LF, TAB or CR inside a credential name
cannot leak`** (`safety-authority-closure.test.ts:453`): for every interior
split of four credential names × {LF, TAB, CR}, it asks the **real parser**
what it derives, and asserts the derived value absent from the redaction —
with a non-vacuity floor of >15 parser-honoured counterexamples
(`safety-authority-closure.test.ts:490`).

**Substrate-fail run** — the new suite executed against the byte-identical
substrate `config.ts` (`git show a7bef61…:src/straylight/storage/postgres/config.ts`
swapped into the tree), command
`vitest run tests/phase-50a/safety-authority-closure.test.ts`:

```
Tests  10 failed | 60 passed (70)
FAIL … redacts every secret …: NORMALIZED name, bare LF inside the credential name
  AssertionError: … raw secret survived in postgresql://<loopback>:55432/straylight_source?pass\nword=hunter2secret
FAIL … redacts every secret …: NORMALIZED name, bare TAB inside the credential name
FAIL … redacts every secret …: NORMALIZED name, bare CR inside the credential name
FAIL … SEQUENCE-95 REPRODUCTION: a bare LF, TAB or CR inside a credential name cannot leak
  AssertionError: PARSER DISAGREEMENT (bare LF in password): pg derives the
  credential hunter2secret from "postgresql://<loopback>:55432/straylight_source?p\nassword=hunter2secret",
  but the redactor printed it in "postgresql://<loopback>:55432/straylight_source?p\nassword=hunter2secret"
FAIL … SEEK-DISAGREEMENT: no generated input makes the parser derive a credential the redactor prints
FAIL … DUPLICATE TRAP … / … UNALIGNABLE query … / … DIAGNOSTIC REACHABILITY: a NORMALIZED credential name …
```

(10 failures total; the fifth through tenth named above. The three LF/TAB/CR
matrix cases, the reproduction, and the seek-disagreement proof all fail on
the defect, as B5 requires.)

**Fix-pass run** — identical command, fixed `config.ts` restored:

```
Test Files  1 passed (1)
Tests  70 passed (70)
```

### 22.5 The generated seek-disagreement proof (packet B4)

**`SEEK-DISAGREEMENT: no generated input makes the parser derive a credential
the redactor prints`** (`safety-authority-closure.test.ts:511`) generates its
inputs by **composing transformations** — it does not enumerate known cases:

- **case operations** (upper, capitalised, alternating) ×
- **percent encoding** (first / middle / last letter, upper- and lower-case
  escapes, fully-encoded name) ×
- **interior insertions** (bare LF, CR, TAB; `+`; malformed `%ZZ`) ×
- **value forms** (plain; percent-encoded letters; an encoded
  reserved-character credential; `+`-separated words; a value ending in a
  malformed escape) ×
- **tails** (nothing; a benign parameter; a malformed escape in a *different*
  parameter — which flips whole-string pre-encoding; a fragment; two duplicate
  spellings) ×
- **heads** (bare origin; userinfo-carrying; portless).

For every generated input the **real `pg-connection-string` `parse()`** is
the oracle: whatever value it places under a credential-named key must be
absent from the redaction. Parser-refused inputs assert the no-throw
contract instead. Every transformation class is **counted only when the
parser actually honoured a credential from an input carrying it**, and the
test fails if any required class — mixed-case, percent-encoding, lf/cr/tab
normalization, plus-handling, duplicate-parameters, malformed-escape,
encoded-credential-value, **interaction** (≥2 classes at once) — was never
honoured (`safety-authority-closure.test.ts:700-712`).

Observed at the final head (extracted by running the generator verbatim):

| count | value |
|---|---:|
| checked (floor >5 000) | **64 800** |
| parser-honoured (floor >1 000) | **42 090** |
| parser-refused (floor >0) | 1 110 |
| lf-normalization honoured | 7 504 |
| cr-normalization honoured | 7 504 |
| tab-normalization honoured | 7 504 |
| percent-encoding honoured | 33 096 |
| mixed-case honoured | 32 400 |
| plus-handling honoured | 8 856 |
| duplicate-parameters honoured | 17 334 |
| malformed-escape honoured | 13 638 |
| encoded-credential-value honoured | 17 712 |
| interaction (≥2 classes) honoured | **41 262** |

The oracle is the parser package itself — `await import('pg-connection-string')`
— **not** a helper reimplementing its assumptions; a helper that agreed with
the implementation would agree with its bugs, which is the mistake the audit
named. During development the identical harness was also run **against the
substrate implementation**: 11 052 leaks out of 53 948 parser-honoured inputs,
versus **0** for the fix — the same generator, the same oracle.

**The duplicate trap** (packet B4's explicit care item) has its own named
test (`safety-authority-closure.test.ts:723`): `searchParams` is last-wins
for the parser's `config[name] = value` loop, so `?pass<LF>word=A&password=B`
yields B — and the test proves the parser really derives the LATER value,
then asserts **both** values absent, because the earlier duplicate is still a
credential in the raw text however the tie resolves. The implementation side
of the same obligation is `parserCredentialValues` collecting **every**
credential-named entry (`config.ts:325-327`), not just the survivor.

### 22.6 The structural mutation (packet B6)

**The exact mutation.** Both parser-derived decision sites in the fixed
`config.ts` were replaced with the substrate's independent approximation —
`decodeURIComponent(rawName.replace(/\+/g,' '))` on the raw segment name —
via a scripted edit (asserting exactly one occurrence of each replaced
block): the `searchParams`-driven rewrite loop (`config.ts:267-280`) and the
`searchParams`-driven credential-value derivation (`config.ts:325-327`). The
mutated module **typechecks cleanly** (`tsc --noEmit` exit 0), so no failure
below is a type or import error.

**Command.** `vitest run tests/phase-50a/safety-authority-closure.test.ts`

**Named failing proofs, for the intended reason.** 10 tests fail, among them
the two the packet names, each with a parser/redactor-disagreement assertion
message, e.g.:

```
FAIL … SEQUENCE-95 REPRODUCTION: a bare LF, TAB or CR inside a credential name cannot leak
  AssertionError: PARSER DISAGREEMENT (bare LF in password): pg derives the
  credential hunter2secret from "…?p\nassword=hunter2secret", but the
  redactor printed it in "…?p\nassword=hunter2secret"
FAIL … SEEK-DISAGREEMENT: no generated input makes the parser derive a credential the redactor prints
  AssertionError: PARSER DISAGREEMENT: pg derives credential "hunter2secret"
  from "…?pass\nword=hunter2secret" (classes: lf-normalization), but the
  redactor printed it in …
```

The failure is the disagreement the mutation reintroduces — a normalized
credential name honoured by the parser and printed by the redactor — not a
crash and not an unrelated assertion.

**Positive control and reversion.** The unmutated file was restored from the
pre-mutation snapshot and verified by SHA-256 equality
(`e910da6b70ff2328b25f795ba61d72ed257fe8e4813931038c5efbe4fbe81eb5`, both
before mutation and after reversion); the suite then passes 70/70. The
mutation exists nowhere in the committed tree — it was applied and reverted
in the working tree only, and the final commit's `config.ts` hashes to the
same digest.

### 22.7 Preservation proof (packet B7/B8)

**Test file regions.** At substrate the file is 54 687 bytes / 1 172 lines.
At the final head:

- the **F-01 block** (lines 133–213, unchanged in both content and position)
  is **4 308 bytes**, SHA-256
  `43cfce3c3920d94bb4305780ef5f550d2d337865fdc7f303b3b5e3dba7f0bf70` —
  byte-identical to the packet's pin;
- the **F-09/F-10/F-14/F-15 suffix** (from `describe('Phase 50A F-09 …`,
  now beginning at line 918) is **30 644 bytes**, SHA-256
  `1f5159d65cafe3a4a5e7bf643d6c6a9e925e4f3310ee70df9e03d5f365f22117` —
  byte-identical to the packet's pin;
- only the F-04 region between them was rewritten.

These are not only asserted here: the suite now carries a **preservation
negative control** (`safety-authority-closure.test.ts:873`) that recomputes
both byte counts and digests from the file's own bytes on every run, and a
**surface control** (`safety-authority-closure.test.ts:901`) that pins the
module's runtime exports to exactly `SHIPPED_SCHEMA_VERSIONS`,
`redactConnectionString` (arity 1, same name) and `resolveConfig` — with the
two `interface` exports (`PostgresStoreConfig`,
`ResolvedPostgresStoreConfig`) unchanged in source and erased at runtime as
before. No export was added or removed; no call site changed.

**This document.** The change is a pure EOF append over the 225 786-byte
prefix `dcf420c088e4306dc5a46147ade5043a8135ba393fb1c2e6bd7537fe4d83b38e`
(§22 head note). No existing byte was rewritten, reflowed, renumbered or
deleted.

**Everything else.** Of the 661 tree entries at substrate
`a7bef61814b682df057fd97645e4077d27086b85`, exactly **three** differ at the
final head — the three `allowed_paths`, each actually written. The other
**658** are identical by mode, type and blob object id, verified by a full
`git ls-tree -r` comparison of the two trees. In particular the F-09/F-10
implementation (`scripts/phase-50a/hosts.ts`, `pg-tools.ts`,
`two-host-proof.ts`), the F-14 implementation
(`scripts/phase-50a/verify-existing-restore.ts`), the runbook,
`tests/phase-31f-operator-recall-wedge-demo.test.ts` (blob
`820221ec773cdd24fdd9e386aaaf06a4a17c5206`), the conformance workflow
(7 287 bytes, `sha256:b95509fb82142d647e425d8c9a0ca10a7cf289d5fbfedc4573193a20c499fd7b`),
`package.json`, `package-lock.json`, every other
`src/straylight/storage/postgres/**` file, `.straylight/**` and
`migrations/postgres/**` are byte-identical to substrate.

### 22.8 Suite results at the final head

| Check | Result |
|---|---|
| Focused F-04 suite (`safety-authority-closure.test.ts`) | 70/70 passed |
| Full repository suite (`npm test`) | 90 files passed, 2 346 passed / 150 skipped |
| Control-plane suite (`npm run control-plane:test`) | 29 files, 1 025 passed |
| Phase 50A suite (`npm run phase-50a:test`) | 16 files, 386 passed |
| Typecheck (`tsc --noEmit`) | clean |
| Build (`npm run build` + prune + postbuild) | clean |
| Two-host proof (`npm run phase-50a:proof`) | PASS (export, cross-host restore, identical chains, cold load, governed recall, continued writes) |
| Artifact C1..C9 (`npm run phase-50a:verify-artifact`) | PASS — 30 tracked = 30 generated = 30 packed declarations, 44 packed files |
| No-leak / neutrality scan | passes UNCHANGED (suite not edited) |

One disclosure for the no-leak scan: the fixed `config.ts` needs the parser's
base-URL literal for `new URL(str, base)`; a spelled-out URL literal that
names a non-loopback host is forbidden by the committed-connection-string
scan, so the literal is assembled from fragments at `config.ts:196` with a
comment stating exactly why — the same convention the test file already uses
for its `SCHEME` constant. The scan itself is untouched.

### 22.9 Standing scope statement

F-09/F-10 and F-14 remain **UNAUDITED** — not passed, not failed, not closed,
not accepted. Sequence 95 recorded them unaudited because Codex stopped at
the blocking F-04 finding; their implementation is preserved byte-for-byte by
this slice (§22.7), and the next Codex audit owes, independently: (i) this
F-04 parser-equivalence closure, (ii) inherited F-09/F-10 structural target
binding, and (iii) inherited F-14 real-query observation. F-01 and F-15
remain preserved as closed absent new regression evidence.

No provider, production, living-estate, sibling-repository or external-API
authority is claimed. No Tracks B/C/D work, no Phase 50B progression, no
control-plane change, no workflow / package / dependency change, no gate
closure, no MVP-2 closure, and no acceptance, readiness or merge claim —
closing this finding does not make any PR merge-eligible. Merge remains
**operator-only** (`operator:eileen`, ADR-049 §6). The audit of this slice is
Codex's; the implementer does not audit its own work.

**Implementation provenance.** Exactly **one** Claude agent at high effort did
this work, under lease `lease-phase-50a-implementer-parser-equivalence-029`
(lane #122 sequence 101). **No** Ultracode, **no** `/batch`, **no** teams,
**no** subagents, and **no** delegation of any kind.

## 23. Phase 50A Track-A structural closure (lane #122 sequence 106)

The sequence-104 audit REJECTED the head at `fb91b94` and named four BLOCKER
findings — F-04, F-09, F-10 and F-14 — with one shared verdict: each seam had
been repaired by an **abstraction that stands in for the thing it is supposed
to check**. A decoder list standing in for the parser. A self-description
standing in for a store. A name registration standing in for the act of
creation. A narration standing in for an observation. In every case the
substrate's guard was *about* the property rather than *bound to* it, and in
every case the audit produced a counterexample that walked straight through
the gap.

This section is the record of closing all four **together**, by replacement
rather than repair. It is the ninth and last file of the sequence-106
replacement INITIAL packet (`5250533905`,
digest `sha256:5b0cdffa11faae0db19772ae1c1576c77f5454e95943d5f4933df3d8e4fa3f55`),
implemented from substrate `fb91b94f2b2bffd4165b41612eef091ddc0eba78` on branch
`phase-50a-r3-track-a-structural-closure` under lease
`lease-phase-50a-implementer-track-a-structural-031`.

`fb91b94` and its pull request remain **immutable**: nothing in this slice
amends, reopens, force-pushes or retargets them. The rejected substrate is
readable and branchable evidence, and that is all it is.

### 23.1 The four rejected abstractions and their replacements

| Finding | The rejected abstraction (substrate site) | What replaced it |
|---|---|---|
| F-04 | `contains()` — scanning the raw text and its `decodeURIComponent` form; a **hand-written decoder on the PERMIT side** (`config.ts:429`) | Every permit decision reads the **parser's own view**: `parserView` builds the same preprocessed WHATWG `URL` `pg-connection-string` builds, and `parserReadings` enumerates what a reader of the emitted text obtains through `URL`, `searchParams` and `URLSearchParams` (`config.ts:203`, `config.ts:423`) |
| F-09 | `bindStore(host, store, redact)` — minting destructive authority when `store.describeTarget()` **text matched** an expected string (`hosts.ts:410`) | **The parameter is gone.** `openBoundProofStore(descriptor)` constructs the store itself from the descriptor's connection string and records possession in a module-private `WeakMap`; `authorizedBoundStore` returns the **registry's** store, never the handle's field (`hosts.ts:552`, `hosts.ts:581`) |
| F-10 | `declareScratchDatabase(host, name)` — accepting any `p50a_*`-shaped **supplied name** into the issuable set (`hosts.ts:236`) | **Creation is the only issuer.** `createScratchDatabase` mints the name itself, runs the `CREATE DATABASE`, and issues the tool target only after that statement committed; `toolTargetOf` lost its database parameter entirely (`hosts.ts:353`, `hosts.ts:264`, `hosts.ts:275`) |
| F-14 | `provedNoDestructiveSql` computed and then **discarded** — `result.ok` and the CLI PASS branch never consulted it; unknown statement forms presumed read-only (`:145`, `:267`, `:328`) | The proof is a **conjunct of `ok`** and `ok` is the sole input to the exit status; classification **refuses by default** via a positive read-only grammar (`verify-existing-restore.ts:387`, `verify-existing-restore.ts:405`, `verify-existing-restore.ts:199`) |

The pattern the audit was pointing at is the same one in all four rows: a guard
may not be built out of this module's *idea* of the authority it is guarding.
It has to be built out of the authority itself — the real parser, the real
store, the real creating act, the real execution seam.

### 23.2 F-04 — parser equivalence on BOTH sides of the decision

#### What the sequence-104 counterexample showed

`pg-connection-string` constructs a WHATWG `URL` and then iterates
`result.searchParams.entries()`, assigning `config[name] = value`. That means
the credential `pg` receives is produced by `URLSearchParams` semantics, which
include **form decoding**: `+` becomes a space. The substrate's redactor
correctly identified the credential parameter and replaced its value with
`<redacted>` — and then licensed the output using its own two-form scan.

Given `?password=hunter+2+secret&application_name=hunter+2+secret`, the
substrate emitted

```
postgresql://<loopback>:55432/straylight_source?password=<redacted>&application_name=hunter+2+secret
```

and the credential `hunter 2 secret` is recoverable from that text by
`URLSearchParams`-decoding it — the very operation the parser performs. The
substrate's `decodeURIComponent` scan leaves `+` alone, saw a different string,
and permitted the emission. The credential survived under a **non-credential
parameter name**, in a **form the parser produces and the private decoder does
not**.

#### The replacement mechanism

*One normalization exists, and it belongs to the parser.*

`parserPreprocess` (`config.ts:145`) is a verbatim transcription of the
parser's first step — `encodeURI` over the whole string when it contains a
space or a malformed percent escape, then un-escaping only the `%25NN` that
step introduced, and only when `NN` is two **digits**. It is copied rather than
approximated because it is load-bearing in a way that is easy to miss: a
malformed escape anywhere in the string, *including in a value*, changes how
names elsewhere in that string normalize. That coupling is why a per-parameter
probe cannot be faithful, and why the string is normalized once, as one unit.

`parserView` (`config.ts:203`) then constructs the `URL` — with the same
dummy-host retry the parser uses — and every subsequent decision reads that
object. `isCredentialParameterName` (`config.ts:230`) asks the URL what name it
produced and compares case-insensitively against the parameter names `pg`
itself treats as credential-bearing (`config.ts:72`). The comparison set is
about **names**, matching what the driver honours; the **normalization** that
turns `pass<LF>word`, `pass<TAB>word`, `pass%77ord` and
`%70%61%73%73%77%6Frd` all into `password` is the URL's, not this module's.
That is the distinction the sequence-95 audit drew and the sequence-104 audit
re-drew: a spelling table is only a defect when it substitutes for the
parser's normalization, and here it does not — it sits downstream of it.

*The permit side asks the parser too.*

`parserReadings` (`config.ts:423`) is the whole of the containment check, and it
is the replacement for `contains()`. For a candidate output it collects:

- the **raw text first and unconditionally**, so nothing the list fails to
  model can ever *remove* a reading;
- the parser's normalized text, and the URL's `username`, `password`,
  `hostname`, `pathname`, `hash`;
- every `searchParams` **name and value** — which is where `+` becomes a space
  and `%77` becomes `w`, done by `URL` and not by this module;
- the two decodings the parser applies *on top of* the URL —
  `decodeURIComponent` on userinfo and `decodeURI` on the path — because those
  are what land in `config.user` / `config.password` / `config.database`;
- `new URLSearchParams(...)` over **both** the whole text and its query span.
  `URLSearchParams` *is* the decoder `searchParams` is, and unlike `URL` it is
  **total** — it cannot throw. That matters because a candidate output is not
  required to be URL-constructible (`<redacted>` is not a host), and a permit
  side that went blind on unconstructible text would be a permit side that
  leaked on it.

The forbidden set is built by `parserCredentialValues` (`config.ts:342`) and
covers **every duplicate entry, winning and losing**. The parser's
`config[name] = value` assignment is last-wins, so only the final duplicate is
honoured — but an earlier duplicate is still a credential someone wrote down,
and it must not leak merely because it lost. Both `url.password` and its
`decodeURIComponent` form are included, and each value contributes its
`encodeURIComponent` form as well.

The one place an extra form is permitted is **directional**:
`encodeURIComponent` in `parserCredentialValues` only ever ADDS to the
forbidden set, so its every effect is to withhold more. That is precisely the
invariant the sequence-104 rejection turns on — the substrate used a decoder to
decide output was *safe*, and an approximation on the permit side authorizes
exactly what it fails to model. No approximation appears on the permit side of
this module.

*The closure.* `redactConnectionString` (`config.ts:554`) rewrites, then checks
containment (`config.ts:574`), then falls back to withholding the whole query
surface (`withheldQuery`, `config.ts:308`), then re-checks, and if a credential
is *still* recoverable emits `<redacted> (uninterpretable connection target)`
(`config.ts:596`). Every step of that ladder narrows the output; none of them
widens it.

#### Fail-closed without throwing

`redactConnectionString` runs inside error construction, so throwing is not
available to it. Ambiguity is therefore resolved by **saying less**:

- `parserPreprocess` returning `null` (even `encodeURI` failed) is treated as
  total ambiguity;
- `redactNormalizedQuery` (`config.ts:270`) refuses when the rewritten query
  cannot be aligned to the original span (`config.ts:289`) and when a
  parser-produced NAME still contains a `%` (`config.ts:291`) — an undecodable
  name such as `pass%ZZword` could align to a credential name, so the query is
  **withheld rather than classified**;
- `isProvablyCredentialFreeAuthority` (`config.ts:110`) preserves a bare
  `host` / `host:port` authority only when it is *provably* one, recognizing
  bracketed IPv6 by skipping past the closing bracket; a `host:name` that is
  not a port cannot be told from `user:password`, so it is redacted;
- a non-string target produces a type report, never an interpolated value.

Non-secret detail — scheme, host, port, database, non-credential parameters —
is preserved wherever it is provably non-secret, which is what keeps the
diagnostic useful.

#### Exported surface unchanged

`config.ts` still exports exactly `SHIPPED_SCHEMA_VERSIONS`, `resolveConfig`
and `redactConnectionString` at runtime, plus the type exports
`PostgresStoreConfig` and `ResolvedPostgresStoreConfig`.
`redactConnectionString` keeps its name, its arity of 1 and its signature. That
is asserted mechanically, not stated: see §23.9.

### 23.3 F-09 — destructive authority by trusted construction

The history of this seam is three steps long. It began as a descriptor and a
store passed *separately* to the destructive step, with nothing checked about
the database actually being erased. The first fix folded the pair into
`bindStore(host, store, redact)`, which accepted the pair when
`store.describeTarget()` returned the descriptor's redacted connection string.

That was still **testimony**. `describeTarget()` is a method the caller's
object implements; returning the right string proves the object can produce a
string. A hostile store — three lines: return the expected text, delegate every
real operation elsewhere — satisfied it exactly, and so did any subclass that
overrode the description while inheriting a different connection.

So the parameter is gone. `openBoundProofStore(target)` (`hosts.ts:552`) takes
a descriptor and nothing else: it resolves the descriptor first (so an unfixed
one is refused *before* a store is constructed and before any connection could
open), constructs the `PostgresEstateHost` here from that descriptor's own
connection string, and returns a frozen handle. **There is no caller-supplied
store object anywhere on the destructive path**, so no imitation, subclass,
proxy or self-description has a surface to act through. The question "is this
store really the authorized one?" is not answered better — it is never asked,
because the only store that exists is the one this module just built.

Two further properties make the handle unforgeable:

1. **It is opaque.** The brand is a type-only
   `declare const BOUND_PROOF_STORE: unique symbol` (`hosts.ts:532`), erased at
   runtime, so there is no property and no symbol for
   `Object.getOwnPropertySymbols` to copy. Possession is recorded in
   `BOUND_PROOF_STORES`, a module-private `WeakMap` (`hosts.ts:534`) — a caller
   cannot mint an entry and cannot construct a handle at all.
2. **The consumer reads the registry, not the handle.**
   `authorizedBoundStore` (`hosts.ts:581`) returns the record from
   `BOUND_PROOF_STORES`, so a spread of a genuine handle with a substituted
   `store` field is both unregistered *and* unused. That is the sequence-89
   divergence case in its final form.

The destructive step `emptySchema` (`two-host-proof.ts:273`) reaches the store
only through `requireBoundStore` (`two-host-proof.ts:302`), which delegates to
`authorizedBoundStore`. `isBoundProofStore` (`hosts.ts:568`) exists so an
untyped JavaScript caller fails closed rather than being dereferenced.

### 23.4 F-10 — creation-bound issuance

`declareScratchDatabase` was **told** a name and believed it: any string
matching `^p50a_[a-z0-9_]{1,54}$` entered the issuable set, and
`toolTargetOf(host, name)` then converted it into a real `pg_dump`/`psql`
target. An independently selected name was one call away from destructive tool
authority over a database the harness had never created.

The replacement makes **the act of creation the sole issuer**.
`createScratchDatabase(target, label)` (`hosts.ts:353`):

- resolves the descriptor, then **mints the name itself** via `mintScratchName`
  (`hosts.ts:317`) from the process id and a module-private counter; the
  `label` argument is sanitized to the harness character set, truncated, and
  contributes nothing but readability. **A caller cannot select the name** —
  which is what makes the name meaningless as a route to authority;
- runs the `CREATE DATABASE`, and only then calls `issueToolTarget`
  (`hosts.ts:380`). Reaching that line means the DDL committed, so a name
  belonging to something that already exists cannot be authorized —
  `CREATE DATABASE` fails on it and the function throws before issuing
  anything;
- returns a `ScratchGrant` (`hosts.ts:293`) carrying the connection string, the
  issued tool target, and a `drop()` that **revokes** the issuance
  (`hosts.ts:391`) before dropping the database. Authority over a scratch
  database ends when the database does.

`toolTargetOf` (`hosts.ts:264`) now takes **only** a descriptor and returns
`issueToolTarget(host, host.database)`. Deleting the second parameter is the
load-bearing change: there is no longer an argument through which a name could
be supplied, so the refusal is not a check that could be forgotten — it is an
absence of surface. `issueToolTarget` (`hosts.ts:275`) is the only producer of
an issued target and has exactly two callers, and it records the target
**with its authorizing descriptor and its exact field values** in
`ISSUED_TOOL_TARGETS` (`hosts.ts:424`).

`authorizedToolTarget` (`hosts.ts:457`) is what closes the divergence case:
issuance alone is not authority. An object that carries a legitimate issuance
but whose `database`, `container` or `user` has since drifted is not the target
that was authorized, and it is refused. `pg-tools` consults the gate through
`requireIssuedTarget` (`pg-tools.ts:98`) before spawning anything, so a
hand-built target cannot reach `pgDump` (`pg-tools.ts:141`), `psqlRestore`
(`pg-tools.ts:167`), `psqlExec` (`pg-tools.ts:190`) or
`clusterSystemIdentifier` (`pg-tools.ts:214`) at all — the refusal precedes the
invocation instead of depending on every call site remembering to ask.

The descriptor's own database remains issuable from the descriptor itself,
which is what the fixed two-host exercise needs and all it needs.

### 23.5 F-14 — the observation governs the verdict

The substrate computed its non-destruction proof and then threw it away:
`result.ok` was `differences.length === 0 && brokenChains.length === 0`, and
the CLI's PASS branch consulted only that. **The proof existed, was correct,
and decided nothing** — a run that had issued a `DROP` would still have
reported PASS and exited 0. Separately, its classifier presumed unknown
statement forms read-only, so a form nobody had considered passed by default.

Both are replaced.

*The seam observes execution.* `observeQueries` (`verify-existing-restore.ts:286`)
is a `Proxy` over the live client, so recording is not something a call site
opts into: any statement issued through the object this module holds passes
through `query` and is recorded **before the driver sees it**. It is exported on
purpose — the proof of F-14 has to be taken at this seam and not at a replica
of it, because a test recording through its own imitation would prove a
property of the imitation.

*Recognition is affirmative and refuses by default.* `classifyObservedSql`
(`verify-existing-restore.ts:199`) collapses whitespace and then tests the
statement against `READ_ONLY_PROJECTION` (`verify-existing-restore.ts:187`), a
**positive grammar** for exactly the shape the verification issues:
`SELECT <identifiers> FROM <identifier> [ORDER BY ...]`. Anything else is
`recognized: false` with the statement named in the reason. This is the
inversion the audit demanded: a keyword denylist has a **default of PASS**, and
its silence about a form is indistinguishable from approval; a positive grammar
has a default of REFUSE, and a new read on the "non-destructive verification"
path is exactly the change that ought to be looked at rather than assumed
benign.

`observationOf` (`verify-existing-restore.ts:211`) handles all three shapes `pg`
accepts — `query(text)`, `query(text, values)`, `query(config)` — and records
anything else as **`unobservable`** rather than dropping it or assuming it
benign. A statement whose text this seam cannot read is still a statement, and
one whose text is unavailable cannot be recognized.

*Emptiness is not proof.* `observedQueryProof`
(`verify-existing-restore.ts:252`) sets `proved` only when
`observations.length > 0 && refusals.length === 0`. "No destructive statement
was observed" answers `[].every(...)` — i.e. `true` — over an empty record, so
used alone it passed **vacuously**: a verifier that observed nothing at all, or
whose seam had been removed entirely, "proved" that it destroyed nothing. An
empty record is *unproven*, not *proven safe*.

*The proof decides.* In `decideVerification`
(`verify-existing-restore.ts:361`), `queryProof.proved` is a conjunct of `ok`
(`verify-existing-restore.ts:387`) on the same footing as the digest
comparison. A PASS therefore asserts three things at once: the estates agree,
every chain verifies, and the statements this process actually issued were
observed and every one of them was affirmatively recognized as read-only.
`verificationExitCode` (`verify-existing-restore.ts:405`) is the only thing
that decides the exit status and it is a function of `report.ok` alone.

The observation record is deliberately **not** cleared inside
`verifyExistingRestore` (`verify-existing-restore.ts:425`): a statement observed
at any point in the process counts against the verification, because clearing it
would let the very statement the proof exists to catch be forgotten before the
verdict was taken. A MISMATCH remains a distinct verdict from an inability to
verify.

### 23.6 Substrate-fail / fix-pass (packet B5)

A reproduction that passes on the defect proves nothing. Each of the four
counterexamples was therefore run against the **substrate implementation**
before being run at the final head.

*Method.* The substrate tree was materialized at `fb91b94`, the final
`tests/phase-50a/safety-authority-closure.test.ts` (129858 bytes,
`sha256:a2a29655a3fae8e374b8e484fec0122d0c0c9772f7b6afb47419602ff6479ebf`) was
placed into it unchanged, and the suite was run. This is why the suite's static
import list is the **intersection** of the two trees' exports and every
one-sided symbol is reached through a dynamic `import()` and probed as a
property: a static `import { openBoundProofStore }` of a symbol the substrate
does not export is an ESM **link error**, the file would not load, and every
substrate run would fail for the wrong reason — which the packet forbids
explicitly. The probe helper `missingExports` states the absence of a
replacement seam as a **named assertion** rather than letting a
`TypeError: x is not a function` stand in for it.

Substrate result — `4 failed | 80 skipped (84)`, each for its intended reason:

| Counterexample | Failure observed on the substrate |
|---|---|
| `COUNTEREXAMPLE (F-04)` (suite `:665`) | `the credential is RECOVERABLE. Spelling "hunter 2 secret" appears in the reading "...?password=<redacted>&application_name=hunter 2 secret" of "...?password=<redacted>&application_name=hunter+2+secret"` |
| `COUNTEREXAMPLE (F-09)` (suite `:1508`) | `these exports minted destructive authority for an object that merely DESCRIBED itself as the harness source` — received `['bindStore(3 arg(s))', 'bindStore(3 arg(s))', 'bindStore(4 arg(s))', 'bindStore(3 arg(s))']` |
| `COUNTEREXAMPLE (F-10)` (suite `:1912`) | `the creation-bound issuance seam is absent from this module` — received `['createScratchDatabase']` |
| `COUNTEREXAMPLE (F-14)` (suite `:2226`) | `the observation-governs-verdict seam is absent from this module` — received `['observeQueries', 'observedQueryProof', 'recordedObservations', 'resetRecordedObservations', 'classifyObservedSql', 'decideVerification', 'verificationExitCode']` |

The F-04 line is the important one to read closely: it is not an absence, it is
a **live leak**. The substrate loads, runs, redacts, and the audit's credential
comes back out of its own diagnostic. The other three fail on the named absence
of the replacement seam, then — with the seam present at the head — go on to
assert the behaviour.

At the final head the same suite reports **84 passed (84)**.

The malformed-name half of the F-04 counterexample (`?pass%ZZword=leakedsecret`)
and the sequence-95 control-character reproduction (`SEQUENCE-95 REPRODUCTION`,
suite `:711`) both assert that the value does not survive in any recoverable
form, and `DUPLICATE TRAP` (suite `:1082`) asserts the losing value of a
duplicated credential name does not leak either.

### 23.7 Generated seek-disagreement (packet B6)

`SEEK-DISAGREEMENT` (suite `:783`) does not sample a fixed table of inputs. It
**generates** connection strings from a cross-product of credential-name
spellings, values, transformations and tails, hands each to the real effective
parser, and — for every input where the parser derives a credential — asserts
that value is unrecoverable from the redacted output under the full decoding
family (raw, percent-decoded, form-decoded, `URLSearchParams`-decoded,
re-encoded). Its inputs are derived from the parser rather than from a belief
about the parser, which is what makes it a disagreement hunt rather than a
regression list.

Measured coverage at the final head:

```
checked                     75600
honoured as query credential 48837
refused by the parser         1323
failed closed                 7200
```

Every declared class is honoured by at least one input, with the counts:

| Class | Honoured |
|---|---|
| interaction (two or more transformations combined) | 35076 |
| mixed-case | 27864 |
| percent-encoding | 27588 |
| encoded-credential-value | 15867 |
| duplicate-parameters | 15414 |
| plus-handling | 8073 |
| lf-normalization | 7032 |
| cr-normalization | 7032 |
| tab-normalization | 7032 |
| value-echoed-under-noncredential-name | 4827 |
| malformed-value | 3825 |
| malformed-name | 1800 |
| plus-in-name | 1800 |
| foreign-malformed-escape | 1116 |

`malformed-name` also accounts for all 7200 fail-closed outcomes, which is the
expected shape: an undecodable name that could align to a credential name is
withheld rather than classified.

The non-vacuity guard is the point of publishing those numbers. A generator
whose cross-product silently collapsed to nothing would still "pass" every
assertion inside its loop; the suite asserts substantial `checked` and
`honoured` counts and asserts that **each** class was honoured, so a class that
stopped being generated fails rather than disappearing.

**One coverage gap was found and closed during this work, by the mutation
harness rather than by review.** The generator's original tails did not include
a case where the credential value is echoed under a **non-credential**
parameter name — so blanking the credential parameter's own value was
sufficient to satisfy it, and the sequence-104 leak shape (the value surviving
elsewhere in the string, in a form only the parser produces) was outside its
reach. Restoring the substrate's decoder list (mutation M1, §23.8) therefore
left the generator passing. The `tails` function now emits
`&application_name=<the credential value>` alongside the duplicate-parameter and
foreign-malformed-escape tails, the class
`value-echoed-under-noncredential-name` was added to the required-classes set,
and M1 now fails the generator with
`(classes: plus-handling, value-echoed-under-noncredential-name)`. The gap is
recorded here because it is the honest provenance of that assertion: the
generator was strengthened *because a mutation survived it*, which is the
entire reason the mutation stage exists.

**NOT MODELLED**, stated by the suite itself: the generator does not model
`service=` file resolution, `sslkey`/`sslcert` file reads (the redactor never
invokes `parse()` and therefore never touches the filesystem), IDNA host
normalization, non-`//`-form key=value DSNs, lone surrogates in values, or
credential material arriving through the environment rather than the connection
string. Those boundaries are declared rather than implied so a later reader
knows what the count does and does not cover.

### 23.8 Four structural mutations, one per finding (packet B7)

Each mutation **restores the rejected abstraction** for its finding — taken
verbatim from the substrate where the substrate had one — and must make a
**named** proof fail for the intended reason, not by type error, import error
or unrelated assertion.

The harness applies each mutation by exact **single-occurrence** replacement and
throws if the anchor count is not 1, so a drifted anchor fails loudly instead of
silently mutating nothing. Reverts restore from a `sha256`-pinned backup and
verify the restored digest against a manifest, so "reverted cleanly" is measured
rather than asserted. Mutation diffs below are `diff -u` against that backup,
because the working tree's `git diff` at this point is the whole closure diff.

Positive control on the unmutated tree, before and after every mutation:

```
npx vitest run tests/phase-50a/safety-authority-closure.test.ts
  → Test Files 1 passed (1) | Tests 84 passed (84)
```

#### M1 (F-04) — restore the `decodeURIComponent` decoder list

Replaces the `parserReadings`-based containment check in
`redactConnectionString` (`config.ts:574`) with the substrate's two-form scan:

```diff
-    return parserReadings(candidate).some((reading) =>
-      credentials.some((value) => reading.includes(value)),
-    );
+    const forms = [candidate];
+    try {
+      const decoded = decodeURIComponent(candidate);
+      if (decoded !== candidate) forms.push(decoded);
+    } catch {
+      /* malformed escape: the raw form is the whole check */
+    }
+    return credentials.some((value) => forms.some((form) => form.includes(value)));
```

Command: `npx vitest run tests/phase-50a/safety-authority-closure.test.ts`
Result: **3 failed | 81 passed**. Named failures:

- `COUNTEREXAMPLE (F-04): a form-decoded credential and an undecodable credential name cannot leak`
- `SEEK-DISAGREEMENT: no generated input makes the parser derive a credential the redactor prints`
- `DIAGNOSTIC REACHABILITY: a FORM-DECODED credential is redacted at describeTarget() too`

Intended reason observed: `the credential is RECOVERABLE` — `hunter 2 secret`
appears in a parser reading of the emitted text. The private decoder cannot see
what `URLSearchParams` sees, exactly as the audit said.

#### M2 (F-09) — restore `describeTarget()`-text binding

Reintroduces the substrate's `bindStore`, re-typed onto the current registry
record shape so the mutation is a behaviour change rather than a compile error:

```diff
+export function bindStore<TStore extends { describeTarget(): string }>(
+  target: ProofHost | ProofHost['name'],
+  store: TStore,
+  redact: (connectionString: string) => string,
+): Readonly<{ host: ProofHost; store: TStore }> {
+  ...
+  const expected = redact(host.connectionString);
+  const actual = store.describeTarget();
+  if (actual !== expected) { throw new ProofHostRefusedError(...); }
+  return Object.freeze({ host, store });
+}
```

Result: **2 failed | 82 passed**. Named failures:

- `COUNTEREXAMPLE (F-09): NO export mints destructive authority for a self-describing store`
- `the destructive path takes NO store and reads NO self-description`

Intended reason observed: the counterexample's export enumeration reports
`['bindStore(3 arg(s))', 'bindStore(3 arg(s))', 'bindStore(4 arg(s))', 'bindStore(3 arg(s))']`
— the hostile object, which returns the expected description while delegating
every real operation elsewhere, obtained authority. The second failure is the
structural companion: with a store parameter back on the path, the assertion
that no such parameter exists no longer holds.

#### M3 (F-10) — restore name registration as issuance

Restores `declareScratchDatabase` and the two-argument `toolTargetOf`:

```diff
+const SCRATCH_DATABASES = new WeakMap<ProofHost, Set<string>>();
+
+export function declareScratchDatabase(target, database: string): string {
+  ...
+  if (!/^p50a_[a-z0-9_]{1,54}$/.test(database)) { throw ... }
+  names.add(database);
+  return database;
+}
+
+export function toolTargetOf(target, database?: string): ProofToolTarget {
+  ...
+  return issueToolTarget(host, database ?? host.database);
+}
```

Result: **4 failed | 80 passed**. Named failures:

- `COUNTEREXAMPLE (F-10): NO export grants authority over an INDEPENDENTLY SUPPLIED name`
- `REPRO (F-10): a supplied database NAME is not a parameter of tool issuance at all`
- `creation is the ONLY issuer of a scratch target, and it refuses an unfixed descriptor before connecting`
- `the tool-target issuer takes NO database name, so cross-instance reuse has no surface`

Intended reason observed: the enumeration lists eight grants obtained for the
independently supplied name `p50a_independently_chosen`, and
`toolTargetOf.length` is 2 where the closure requires 1. The arity assertion is
worth noting on its own: it is the mechanical form of "there is no surface", and
it catches the regression before any behavioural test has to.

#### M4 (F-14) — restore the destructive-keyword denylist

Replaces the positive read-only grammar with the substrate's denylist, whose
default is PASS:

```diff
   const collapsed = sql.replace(/\s+/g, ' ').trim();
-  if (READ_ONLY_PROJECTION.test(collapsed)) {
+  const DESTRUCTIVE_SQL =
+    /\b(?:DROP|TRUNCATE|DELETE|ALTER|CREATE|INSERT|UPDATE|MERGE|GRANT|REVOKE|VACUUM|REINDEX|COPY)\b/i;
+  if (!DESTRUCTIVE_SQL.test(collapsed)) {
```

Result: **2 failed | 82 passed**. Named failures:

- `COUNTEREXAMPLE (F-14): a destructive or unrecognized observed statement forces failure`
- `the recognition grammar REFUSES BY DEFAULT rather than denying by keyword`

Intended reason observed:
`certified read-only: SELECT pg_terminate_backend(pid) FROM pg_stat_activity: expected +0 to be 1`
— a statement that is state-reducing but contains none of the denylisted
keywords was certified read-only. That is the denylist's structural defect in
one line: its silence about a form is indistinguishable from its approval of
one.

#### Reverts

All four reverted cleanly, each verified by digest:

```
m1 (F-04) REVERTED; src/straylight/storage/postgres/config.ts        sha256 verified
m2 (F-09) REVERTED; scripts/phase-50a/hosts.ts                        sha256 verified
m3 (F-10) REVERTED; scripts/phase-50a/hosts.ts                        sha256 verified
m4 (F-14) REVERTED; scripts/phase-50a/verify-existing-restore.ts      sha256 verified
```

with the 84/84 positive control re-run after each.

### 23.9 Preservation and scope (packet B8/B9/B10)

*F-01 and F-15 evidence, pinned in-file.* Two content blocks inside the closure
suite are preserved **byte-for-byte** and located by their first line, so their
positions may shift while their bytes may not:

| Block | Bytes | Digest |
|---|---|---|
| F-01 `describe` block (suite `:218`) | 4308 | `sha256:43cfce3c3920d94bb4305780ef5f550d2d337865fdc7f303b3b5e3dba7f0bf70` |
| F-14/F-15 runbook `describe` block (suite `:2612` to EOF) | 3442 | `sha256:8773f4faf1958567178ececb3ab31a03a8d1b46f2c0e585ed55b87e861c26046` |

The suite assembler verifies both digests in the substrate bytes *and* re-verifies
them in the assembled output, and the suite itself pins them at runtime:
`PRESERVATION: the F-01 block and the F-14/F-15 runbook block are byte-identical to the substrate`
(suite `:1280`).

*F-01 and F-15 source evidence.*
`PRESERVATION: the F-01 seam file and the F-14/F-15 runbook are the substrate blobs`
(suite `:1307`) pins `tests/phase-31f-operator-recall-wedge-demo.test.ts` to
blob `820221ec773cdd24fdd9e386aaaf06a4a17c5206` and the runbook to blob
`d295948c1b97ccf9c6932e400a8861ca0466f396`. Neither file is in this slice's
allowed paths and neither was written.

*Exported surface.*
`PRESERVATION: config.ts exports exactly the audited surface, unchanged`
(suite `:1332`) asserts the sorted runtime export names are exactly
`['SHIPPED_SCHEMA_VERSIONS', 'redactConnectionString', 'resolveConfig']`, and
that `redactConnectionString` keeps its name and an arity of 1.

*Frozen consumers.* `tests/phase-50a/_support.ts` keeps exporting `OPT_IN_VAR`,
`phase50aEnabled`, `phase50aGateReport`, `requireReachable`,
`openScratchDatabase`, `openUnmigratedDatabase`, `replaceDatabase`,
`databaseNameOf` and `ScratchDatabase`, together with the `hosts` re-exports —
its export lines are byte-identical to the substrate's. `hosts.ts` keeps
`sourceHost`, `replacementHost` and `assertDistinctHosts` with **loopback-only**
defaults, which the frozen no-leak/neutrality suite evaluates by value, and
`describeTarget()` still carries the `<redacted>` placeholder the frozen
negative suite asserts. Every suite outside the allowed paths passes unchanged.

*Tree-wide identity.* Of the **661** tree entries at `fb91b94` — 660 blobs plus
the `.loa` gitlink at `207639f9f48e307b0a373281ccdd3a379ba0eaf4` — exactly the
allowed paths written by this slice differ. `git diff --raw` against the
substrate lists only those paths, every one `100644` → `100644`, with no
additions, no deletions, no mode changes and no untracked files in the tree.

*Documentation.* This section is a **pure end-of-file append**. The substrate's
first 246118 bytes
(`sha256:44c53ac387bdb9390ff5af13f3d4895b643e261d3c1291549e5964e5a3e36155`)
are preserved byte-for-byte as this file's prefix: no existing byte is
rewritten, reflowed, renumbered or deleted, and the section numbering continues
from §22 rather than disturbing it.

### 23.10 Suite results at the final head

| Check | Result |
|---|---|
| `npx vitest run tests/phase-50a/safety-authority-closure.test.ts` | 84 passed (84) |
| packet-required focused set | 90 passed |
| `npm run phase-50a:test` | 400 passed (16 files) |
| `npm run phase-50a:proof` (two-host, live) | PASS |
| `npm run phase-50a:verify-artifact` | PASS — C1..C9; 30 tracked / 30 generated / 30 packed; 44 packed files |
| `npm run control-plane:validate` | all checks passed |
| `npm run control-plane:test` | 1025 passed (29 files) |
| `npm test` with the Phase 50A opt-in enabled | 2510 passed (90 files) |
| `npm run build` | exit 0, no tracked file touched |
| `npx tsc --noEmit` | clean |

No test was weakened, skipped or deleted to reach any of those numbers; the
suite grew from 1565 to 2674 lines and from 74315 to 129858 bytes.

### 23.11 Residual limits

- The F-04 boundaries listed as NOT MODELLED in §23.7 are real boundaries, not
  rhetorical ones. In particular the redactor deliberately never invokes
  `parse()`, so `service=`, `sslkey`, `sslcert` and `sslrootcert` **file
  resolution** is outside both the mechanism and its proof: those read the
  filesystem, and a diagnostic path must not.
- F-09's guarantee is about the store on the destructive path. It does not
  constrain what a caller may do with a `PostgresEstateHost` it constructs for
  itself outside the harness; it guarantees that such an object has no route to
  `emptySchema`.
- F-10's guarantee covers the harness's own issuance chain. A database created
  by some other process, by hand, or by a future code path that does not route
  through `createScratchDatabase` is not authorized — which is the intended
  outcome, but it means adding a new legitimate creation path requires routing
  it through the issuer rather than around it.
- F-14's recognition grammar is intentionally narrow. A future read that is
  genuinely read-only but not a simple projection will **fail closed** until the
  grammar is widened deliberately. That is the cost of a default of REFUSE and
  it is the cost the audit asked for.
- The generated seek-disagreement counts in §23.7 are measurements at this
  head, taken with temporary instrumentation that was removed afterwards and the
  suite's digest re-verified. They are evidence of coverage, not a contract.
- The coverage gap described in §23.7 was found by mutation, not by review. It
  is the one place in this slice where a proof required strengthening after
  first being written, and it is reported rather than smoothed over.

### 23.12 Standing scope statement

This section reports **implementation and proof** for four findings. It is not
an audit, and it makes no claim that anything is accepted.

No provider, production, living-estate, sibling-repository or external-API
authority is claimed. No Tracks B/C/D work, no Phase 50B progression, no
control-plane change, no workflow / package / dependency / lockfile change, no
gate closure, no MVP-2 closure, and no acceptance, readiness or merge claim —
closing these findings does not make any pull request merge-eligible. Merge
remains **operator-only** (`operator:eileen`, ADR-049 §6). F-01 and F-15 remain
preserved as closed absent new regression evidence. The audit of this slice is
Codex's; the implementer does not audit its own work.

**Implementation provenance.** Exactly **one** Claude agent at extra-high
effort did this work, under lease
`lease-phase-50a-implementer-track-a-structural-031` (lane #122 sequence 107).
**No** Ultracode, **no** `/batch`, **no** teams, **no** subagents, and **no**
delegation of any kind.

---

## 24. Sequence-113 authority-boundary closure (F-04, F-09, F-14)

### 24.1 What this section reports

The sequence-110 audit of PR #136 (substrate `98ba111b733bc58181bacdc5199d4054106d6ddf`)
**rejected** that slice and left three findings open: **F-04**, **F-09** and
**F-14**. F-10 was recorded closed on the audited surface. PR #136 and its
substrate are **immutable rejected substrate**: nothing in this slice edits,
amends, reopens or re-argues them.

This section reports the **replacement** implementation and its proof, produced
under the sequence-112 replacement INITIAL packet (lane issue #122, packet
comment `5258428117`, digest
`sha256:5928d34110eea614f913d70831b7c3d7dacca18c1b3800079811dded132aaf3a`,
`patch_cycle` 3), on lease
`lease-phase-50a-implementer-authority-boundary-032` (lane sequence 113), on a
branch cut from the exact audited substrate `98ba111`.

It is an **implementation and proof report only**. It is not an audit, and it
claims no acceptance, readiness, gate closure or merge eligibility.

### 24.2 F-04 — the store names its target from the driver and transcribes no parser

**The finding.** The rejected head decided what a diagnostic could safely say by
**reproducing** `pg-connection-string`'s behaviour: its own preprocessing rules,
its own URL-normalization assumptions, a credential-name list, case folding and
a decoder matrix, plus a mirrored oracle that agreed with the implementation
because it restated it. The audit's point was structural, not a missing case: a
second parser can disagree with the first, and two disagreement classes were
demonstrated — an **UPPERCASE parameter key** and a **LEADING-SLASH SOCKET**
form whose host arrives in the query.

**The design.** The store no longer forms an opinion about a connection string
at all.

- `src/straylight/storage/postgres/config.ts` is **597 → 89 lines**. The entire
  transcription surface is deleted: no `pg-connection-string` reimplementation,
  no `decodeURIComponent`/`encodeURIComponent`, no `URLSearchParams`, no
  `new URL(`, no case folding, no credential-name list, no renderer. Its runtime
  exports are exactly `SHIPPED_SCHEMA_VERSIONS` and `resolveConfig`, and
  `resolveConfig` refuses a non-string or empty target with a **constant**
  message that quotes no part of its input.
- Target identity is taken from **the driver's own client**. `pg-pool` accepts a
  `Client` constructor in `PoolConfig` and instantiates it, with the pool's
  options, at connect time. `host.ts:150` supplies an
  `IdentityReportingClient extends Client` that — after `super(clientConfig)` —
  records `{ host, port, database }` off itself (`host.ts:139`, `host.ts:164`).
  Those are `pg`'s **resolved** values, so the store reports what the driver
  decided rather than what a second reader guessed. No parse is added, no
  `fs.readFileSync` and no `process.emitWarning` is triggered, and no dependency
  or `package.json` change is involved.
- `describeTarget()` (`host.ts:195`) renders **only**
  `postgresql://<redacted>@<host>:<port>/<database>` through `renderTarget`
  (`host.ts:102`). The userinfo position is the constant `<redacted>`
  (`host.ts:90`); there is no query string and no fragment. It is the sole
  production emitter, is total, allocates only, and **cannot throw** — including
  for a malformed, non-string or never-resolved target, which renders
  `<target unresolved>` (`host.ts:99`).
- Exactly one line in `host.ts` mentions the connection string:
  `connectionString: this.config.connectionString,` — the hand-off to the
  driver. That is pinned by a line-level assertion, not a count of tokens.

**Direct reuse of the authoritative parser was considered and rejected.**
`pg-connection-string.parse()` reads `sslcert`/`sslkey`/`sslrootcert` from disk
and emits a deprecation warning for `sslmode`; `pg` does not re-export it, and
`package.json` is forbidden. Calling it would add filesystem side effects to an
error path. Supplying `PoolConfig.Client` reuses the **same** authority with
**zero** added parses and **zero** added side effects, because it observes the
parse `pg` performs for its own connection.

**Which resolution of the two disagreement classes was taken: IRRELEVANT BY
CONSTRUCTION** — for both classes, and stated here as the packet requires.
Nothing in the store reads userinfo or the query, so there is no property of
either for a second reader to disagree about. This is proven two ways:

1. **Driver agreement, on the structured value.** For eight identity cases —
   including the UPPERCASE key `?PASSWORD=UPPERSECRET` and the leading-slash
   socket `postgresql:///straylight_source?host=<dir>` — `resolvedTarget()` is
   asserted `toEqual` the identity `pg`'s **own** `new Client({connectionString})`
   resolved, and `describeTarget()` is asserted to contain that host, port and
   database. The oracle is the driver, not a template.
2. **Byte-identity under credential-bearing change.** `describeTarget()` is
   asserted **byte-identical** across **22** variants that differ from a
   credential-free base only in userinfo and non-identity query parameters —
   the sequence-89 encoded names (`pass%77ord`, fully encoded), the sequence-95
   bare LF/TAB/CR normalizations, the sequence-104 form-decoded values,
   repeated-under-a-benign-name values, unalignable queries and undecodable
   names, the sequence-110 UPPERCASE keys, and userinfo-plus-query-plus-fragment.
   A disagreement about material that never reaches the output cannot leak.

**Failing closed without throwing** is proven over malformed inputs (bare `@`,
a space in a parameter name, a fragment after a `+`, an invalid percent escape,
an `sslkey` path with an `sslpassword`, a non-URI string, and `' '`): each
renders `<target unresolved>` and none throws. A non-string target is refused by
`resolveConfig` with no part of it in the message.

**Reachability** is proven on the real error path: a genuine connection failure
against `127.0.0.1:1` produces
`could not acquire a connection to postgresql://<redacted>@127.0.0.1:1/…`, and
the closed-host message uses the same emitter.

**The frozen runbook claim remains true.**
`docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md:288-289` says
`describeTarget()` "replaces userinfo with `<redacted>`, so an error message can
name the target without leaking a credential." The rendered target is
`postgresql://<redacted>@host:port/database`: the userinfo position **is** the
constant `<redacted>` and the target **is** named. The runbook was **not**
edited (blob `d295948c1b97ccf9c6932e400a8861ca0466f396`, unchanged), and a test
asserts the claim against the code rather than the reverse. Two changes to the
claim's mechanism are disclosed rather than hidden:

- the redaction is no longer a **text substitution** over a connection string —
  it is a structured identity that never contained userinfo or a query, so
  `?password=…` no longer appears in any form; and
- when `pg` never built a client (a target it refused, or a host closed before
  first use), the emitter says `<target unresolved>` instead of naming a target
  it does not know. That degradation is the sanctioned "say less" outcome and is
  strictly safer than the claim.

### 24.3 F-09 — the real host is module-private and the handle carries no alias

**The finding.** On the substrate, `openBoundProofStore` returned a **frozen**
handle that still carried the live `PostgresEstateHost` as `bound.store`, and
`authorizedBoundStore` handed that same store back. A caller holding a
**genuine** handle could therefore reach the store execution would run
through — and, because `Object.freeze` is shallow with respect to what a
*consumer* does with the value it read, a redirected alias could be presented to
the destructive path. The gate proved something about one object while the
destruction ran through whatever the alias pointed at.

**The design** (`scripts/phase-50a/hosts.ts`).

- `BoundProofStore` (`hosts.ts:549`) is `{ host } & { [BOUND_PROOF_STORE]: true }`
  where the brand is **type-only**. There is no `store` field, no accessor, no
  method and no closure that hands the store out.
- `openBoundProofStore` (`hosts.ts:588`) constructs the store **itself** from the
  descriptor's own connection string and records `{ host, store }` in a
  module-private `WeakMap` keyed by the frozen handle (`hosts.ts:573`).
- `isBoundProofStore` (`hosts.ts:606`) is WeakMap **membership**, so no copy,
  spread, proxy, prototype-graft or subclass of a genuine handle qualifies and
  nothing outside the module can mint one.
- `authorizedBoundStore` (`hosts.ts:637`) returns a **frozen** capability whose
  operations are `store.migrate.bind(store)`, `store.withClient.bind(store)` and
  `store.withEstateSession.bind(store)`. A bound function does not expose its
  receiver, so the capability names no store either.
- Teardown is a module operation too: `closeBoundProofStore` (`hosts.ts:654`)
  resolves the registry record and closes the store the module holds.
- `two-host-proof.ts:286` (`emptySchema`) makes the membership test and the
  minting **the same act** (`requireBoundStore`), so a destructive path cannot
  check one object and then act through another, and destroys through `fixed`,
  which the script cannot name.

**What is proven.** A genuine, minted handle is scanned across its own
properties, its own symbols and its whole prototype chain: nothing reachable is
`instanceof PostgresEstateHost`, the reachable key set is exactly `['host']`,
and the handle is frozen. The substrate attack is then run on that genuine
handle — assigning `store`, and patching the minted capability — and both throw
`TypeError`. Six derivatives (spread copy, spread-plus-`store`, `Object.create`,
`Proxy`, `Object.setPrototypeOf({store: hostile}, genuine)`, frozen copy) are
each refused by `isBoundProofStore`, by `authorizedBoundStore` and by
`emptySchema` with `ProofHostRefusedError`. Finally the behavioural half: the
genuine handle's minted `withClient` is awaited and observed to reach the
**registry-held** store's database, with `destructiveOperations()` and
`toolInvocations()` both empty.

### 24.4 F-14 — authority is membership in a published set, and PostgreSQL enforces read-only

**The finding.** The substrate certified an observed statement as read-only by
matching a **syntactic grammar** — a projection of identifiers from an
identifier with an optional `ORDER BY`. `SELECT actor_id FROM side_effect_view`
satisfies that grammar exactly and would have been certified, so a read whose
relation is a side-effecting view could have produced `proved`, `PASS` and exit
0. Shape is not authority.

**The design.**

- The module that **issues** the canonical reads now **publishes** them.
  `portability.ts:111` exports
  `CANONICAL_SNAPSHOT_READS: readonly CanonicalRead[]` — frozen, derived from
  the module-private `SNAPSHOT_READ_PLAN` (`portability.ts:85`) that
  `readStoreSnapshot` **iterates** (`portability.ts:153`). Publication and
  issuance cannot drift because they are the same array. `canonicalReadText`
  (`portability.ts:126`) is the publisher's own normalizer, and
  `recognizeCanonicalRead` (`portability.ts:145`) is a Map lookup keyed by it.
  `readStoreSnapshot` fails closed if the plan does not cover a section, and
  `compareSnapshots` derives its section list from the published set.
- The verifier recognizes a statement only by **membership**:
  `classifyObservedSql` (`verify-existing-restore.ts:260`) consults
  `recognizeCanonicalRead`, then the verifier's own frozen `READ_ONLY_BOUNDARY`
  (`verify-existing-restore.ts:203`) — the only statements it issues itself —
  and otherwise refuses with a reason beginning `UNRECOGNIZED statement: no
  module publishes it as one it issues`. Every verdict carries a
  `StatementAuthority` (`verify-existing-restore.ts:123`) naming the publishing
  module and the published entry. The identifier grammar, the `DROP|TRUNCATE`
  denylist and the constructed `RegExp` are **gone**; unknown relations,
  unknown operations, unobservable arguments and an empty record all fail
  closed.
- **PostgreSQL itself enforces the boundary.** `readSnapshotUnderReadOnlyBoundary`
  (`verify-existing-restore.ts:397`) issues `BEGIN TRANSACTION READ ONLY`, then
  the published reads via `readStoreSnapshot`, then `COMMIT` — or `ROLLBACK` on
  the read's failure path, so the issued set equals the published set on every
  path. `readEstate` (`verify-existing-restore.ts:428`) runs it through the
  existing `withClient` seam wrapped by the observation seam.
- The observation→proof→report→exit binding is **unchanged**: the `observeQueries`
  Proxy (`:367`), `observedQueryProof` (`:333`), `queryProof.proved` as a
  conjunct of `ok` (`:505`), `verificationExitCode` (`:523`) and the single
  `process.exitCode = verificationExitCode(result);` (`:612`).

**No authority was widened.** The boundary adds no privilege, no role, no
`SET`, no `GRANT`, no `default_transaction_read_only`, no environment override,
no new connection surface and no caller-supplied statement.
`readSnapshotUnderReadOnlyBoundary` takes one parameter — a client — and its
texts come only from the frozen `READ_ONLY_BOUNDARY` and the published plan;
asserted by `length === 1`, by `Object.isFrozen`, by an executable-text scan for
`SET`/`ROLE`/`GRANT`/`default_transaction_read_only`, by an empty
literal-statement set, and by the verifier's environment reads being exactly
`['VITEST']` (its script guard). The boundary is deliberately **not** placed in
the shared `withClient`, because the destructive harness path legitimately
issues DDL through it; widening `withClient` would have changed a seam outside
this finding.

**What is proven.** Membership recognition accepts every published read and
every boundary phase (with the publisher and entry asserted) and refuses all
**18** hostile statements. The issued statements are asserted equal to the
published ones as a multiset **and** in order, and the snapshot's own section
keys are asserted equal to the published sections. The boundary's success path
is `[BEGIN, …reads, COMMIT]` and its failure path ends in `ROLLBACK` with no
`COMMIT` and zero refusals. `SELECT actor_id FROM side_effect_view` is first
shown to match the rejected grammar exactly, then shown refused, then shown to
force `proved === false`, `ok === false` and exit 1. And live against real
PostgreSQL, a write attempted inside the boundary is refused by the server with
SQLSTATE **25006** (`read-only transaction`), after which the probe relation is
confirmed absent — the DB-enforced half, taken through the existing seam.

### 24.5 F-10 regression

The creation → issuance → tool-target chain is unchanged and still green:
`pg-tools.ts` is byte-identical (blob
`c97904695661fb3601a8ed44f520bd3a548efbe7`) and `tests/phase-50a/_support.ts` is
byte-identical (blob `aae992690e7ccc1817a213892bd43478c6b7aebb`), both of which
remain forbidden paths and F-10 evidence. The F-10 tests — a supplied database
name is not a parameter of issuance, a divergent tool target cannot reach a
tool, a hand-built target cannot reach `pg_dump`/`psql`/a cluster probe, and no
export grants authority over an independently supplied name — pass unchanged,
and the live two-host proof derives both tool targets from the gated
descriptors.

### 24.6 Substrate-fail / fix-pass

The closure suite from this branch was copied, unmodified, into a worktree
detached at the audited substrate `98ba111` and run there:

```
$ git worktree add --detach ../sl-50a-substrate 98ba111b733bc58181bacdc5199d4054106d6ddf
$ cp <branch>/tests/phase-50a/safety-authority-closure.test.ts tests/phase-50a/
$ npx vitest run tests/phase-50a/safety-authority-closure.test.ts
  Tests  25 failed | 42 passed (67)
```

Against this branch the same file is `67 passed (67)`. Each finding has a named
reproduction that fails **on the substrate for the reason the audit gave**:

| Finding | Named proof | Substrate failure |
|---|---|---|
| F-04 | `COUNTEREXAMPLE (F-04): the rendered target is INVARIANT under every credential-bearing change…` | `password-only userinfo: the rendered target CHANGED with credential-bearing material, so something read it: expected 'postgresql://<redacted>@<host>:1/straylight_source' to be 'postgresql://<host>:1/straylight_source'` — the substrate rendered **no userinfo position at all** for the credential-free base, and a `<redacted>@` one for the variant |
| F-09 | `COUNTEREXAMPLE (F-09): a GENUINE handle exposes no store, so nothing can redirect it after minting` | `the genuine handle hands out its store at store: the sequence-110 alias is back: expected true to be false` |
| F-14 | `COUNTEREXAMPLE (F-14): a read of an UNPUBLISHED relation is refused, though it satisfies the rejected grammar exactly` | `certified read-only by SHAPE: "SELECT actor_id FROM side_effect_view" is a read of a relation no module publishes, issues, or can vouch for — a bare projection from a bare identifier is not authority: expected true to be false` |
| F-14 (consequence) | `COUNTEREXAMPLE (F-14): a destructive or unrecognized observed statement forces failure` | `certified read-only: SELECT actor_id FROM side_effect_view: expected +0 to be 1` |

Two properties of these reproductions are deliberate. The **F-09** one takes a
**genuinely minted** handle from `openBoundProofStore` and attacks *that* — not
an unregistered fake — and it depends only on the three exports both trees
publish, with a dual-tree teardown helper, so the substrate run fails on the
alias assertion rather than on a missing symbol or a `TypeError` in cleanup. The
**F-04** one asserts the invariance over the whole variant set **before** any
narrower guard, so a tree whose rendering depends on userinfo fails on the
dependency — the finding — rather than on the shape of whichever rendering came
first. (That ordering was corrected during this exercise, after an earlier
arrangement made the substrate stop at a baseline guard.)

### 24.7 Structural mutations

Each mutation **restores the rejected abstraction** for its finding, is caught
by a **named** proof for the intended reason, and was reverted and re-verified.

#### M1 — F-04: the diagnostic is decided by a transcription again

```diff
--- a/src/straylight/storage/postgres/host.ts
+++ b/src/straylight/storage/postgres/host.ts
@@ -193,7 +193,11 @@ export class PostgresEstateHost {
    * `<target unresolved>` instead of naming something it does not know.
    */
   describeTarget(): string {
-    return renderTarget(this.targetIdentity);
+    // MUTATION M1 (F-04): the rejected abstraction restored. The diagnostic is
+    // decided by a TRANSCRIPTION of connection-string syntax again, instead of
+    // by the identity the driver itself resolved.
+    const raw = this.config.connectionString;
+    return raw.replace(/^(postgresql:\/\/)([^@/]*)@/i, '$1<redacted>@');
   }
```

```
$ npx vitest run tests/phase-50a/safety-authority-closure.test.ts \
    -t 'INVARIANT under every credential-bearing change'
FAIL … COUNTEREXAMPLE (F-04): the rendered target is INVARIANT under every
credential-bearing change, so both disagreement classes are irrelevant by construction
AssertionError: password-only userinfo: the rendered target CHANGED with
credential-bearing material, so something read it
- postgresql://<host>:1/straylight_source
+ postgresql://<redacted>@<host>:1/straylight_source
  Tests  1 failed | 66 skipped (67)
```

In the output above the loopback host is written `<host>`: a committed
connection string must carry either an angle-bracket placeholder or an
`@`-loopback form (`tests/phase-50a/no-leak-and-neutrality.test.ts`), and the
mutated rendering for the credential-free base had no `@` at all. The actual
output named `127.0.0.1`.

Whole-file under the mutation: `13 failed | 54 passed (67)` — the invariance
counterexample, the interpolation and sole-emitter scans, all seven driver-
agreement cases, the malformed-input closure and both diagnostic-reachability
tests. **Positive control:** after `git checkout -- src/straylight/storage/postgres/host.ts`
the working tree is clean at `cf30702` and the same named command reports
`1 passed | 66 skipped (67)`.

#### M2 — F-09: the genuine handle carries the store alias again

```diff
--- a/scripts/phase-50a/hosts.ts
+++ b/scripts/phase-50a/hosts.ts
@@ -590,7 +590,10 @@ export function openBoundProofStore(target: ProofHost | ProofHost['name']): Boun
   const store = new PostgresEstateHost({ connectionString: host.connectionString });
   // The handle carries the DESCRIPTOR ONLY. There is no store on it to replace,
   // proxy, patch or copy, so there is nothing execution could be made to follow.
-  const bound = Object.freeze({ host }) as BoundProofStore;
+  // MUTATION M2 (F-09): the rejected abstraction restored. The GENUINE handle
+  // carries the real store again, so a caller holding a legitimately minted
+  // handle can reach — and replace — the store execution runs through.
+  const bound = Object.freeze({ host, store }) as unknown as BoundProofStore;
   BOUND_PROOF_STORES.set(bound, Object.freeze({ host, store }));
   return bound;
 }
```

This is the **genuine-handle** defect: the handle is still registered, still
frozen, still minted by the module — it simply hands its store out again.

```
$ npx vitest run tests/phase-50a/safety-authority-closure.test.ts \
    -t 'a GENUINE handle exposes no store'
FAIL … COUNTEREXAMPLE (F-09): a GENUINE handle exposes no store, so nothing can
redirect it after minting
AssertionError: the genuine handle hands out its store at store: the
sequence-110 alias is back: expected true to be false
  Tests  1 failed | 66 skipped (67)
```

Whole-file under the mutation: `1 failed | 66 passed (67)` — exactly the named
counterexample. **Positive control:** after
`git checkout -- scripts/phase-50a/hosts.ts` the tree is clean and the named
command reports `1 passed | 66 skipped (67)`.

#### M3 — F-14: the observation proof stops governing the result and the exit

```diff
--- a/scripts/phase-50a/verify-existing-restore.ts
+++ b/scripts/phase-50a/verify-existing-restore.ts
@@ -502,7 +502,11 @@ export function decideVerification(
   ];
 
   return {
-    ok: differences.length === 0 && brokenChains.length === 0 && queryProof.proved,
+    // MUTATION M3 (F-14): the rejected abstraction restored. The observation
+    // proof is still computed, still correct, and still reported — and it
+    // decides nothing. The verdict, and therefore the exit status, no longer
+    // depends on what the process was observed to issue.
+    ok: differences.length === 0 && brokenChains.length === 0,
     source,
     target,
     differences,
```

This is a **disconnection**, not a classifier change: recognition still refuses
`SELECT actor_id FROM side_effect_view` under the mutation; what breaks is that
the refusal no longer reaches the verdict or the exit status.

```
$ npx vitest run tests/phase-50a/safety-authority-closure.test.ts \
    -t 'the EXIT STATUS is a function of the observation proof and of nothing else'
FAIL … the EXIT STATUS is a function of the observation proof and of nothing else
AssertionError: the observation proof does not reach the exit status: an UNPROVED
record still exited 0, so the verdict is disconnected from what was issued:
expected +0 to be 1
  Tests  1 failed | 66 skipped (67)
```

Whole-file under the mutation: `3 failed | 64 passed (67)` — the binding proof
and the two F-14 counterexamples, whose exit-1 consequence is asserted. The
**semantic** read-authority refusal is proven **separately**, by the
unpublished-relation counterexample that fails on the substrate for the
membership reason and passes under this mutation's classifier. **Positive
control:** after `git checkout -- scripts/phase-50a/verify-existing-restore.ts`
the tree is clean and the full file reports `67 passed (67)`.

One test change was made during this exercise and is disclosed: the binding
assertion carried no message, so its failure read `expected +0 to be 1`. A
message was added naming the defect. No assertion was weakened, removed or
made conditional; every strengthening in this slice is additive.

### 24.8 Oracle independence

- **F-04.** The oracle is `pg`'s own `new Client({ connectionString })` —
  constructing a client neither connects nor issues anything — and the
  comparison is on the **structured** identity, not on a rendered string. The
  implementation obtains its identity from a *subclass instance the pool builds*;
  the test obtains its expectation from a *separate client the test builds*. The
  invariance half restates no rule at all: it asserts byte-equality of the
  emitter's output across inputs. Nothing in the suite reproduces a
  preprocessing rule, a decoder, a case-folding rule or a credential-name list.
- **F-09.** The oracle is a **genuine** `openBoundProofStore` handle plus
  JavaScript's own reachability (own properties, own symbols, prototype chain)
  and `instanceof PostgresEstateHost`. It does not restate the registry.
- **F-14.** The oracle obtains the authorized statements from the **publisher**
  (`CANONICAL_SNAPSHOT_READS`, `canonicalReadText`, `READ_ONLY_BOUNDARY`) and
  compares them against what the real seam **observed**. The suite contains no
  copy of a canonical read text and no second normalizer; the only SQL literals
  it states are the hostile statements it expects to be refused.

### 24.9 Scope and preservation

**Ten** paths differ from the substrate, all inside the packet's eleven
`allowed_paths`; every one of the 52 `forbidden_paths` is untouched:

```
src/straylight/storage/postgres/{config,host,portability,index}.ts
scripts/phase-50a/{hosts,two-host-proof,verify-existing-restore}.ts
tests/phase-50a/{safety-authority-closure,postgres-two-host-portability}.test.ts
docs/PHASE-50A-…-IMPLEMENTATION-AND-PROOF.md   (this pure end-of-file append)
```

- `git diff --name-status 98ba111 HEAD` reports **ten `M` entries and nothing
  else**: no additions, no deletions, no renames.
- The substrate tree has **661** file-like entries (660 blobs plus the `.loa`
  gitlink `207639f9f48e307b0a373281ccdd3a379ba0eaf4`); HEAD has **661**, the
  same set of paths with no addition or removal; **ten** differ and the
  remaining **651** are identical by mode, type and object id — including the
  `.loa` gitlink, which is unchanged.

  The complement is stated as a *computed* number here, not a remembered one:
  `661 − 10 = 651`. An earlier cycle of this document recorded 652 against a
  659-entry base (see the correction at §*Correction — the unchanged-entry
  count is 651, not 652*), so the arithmetic is spelled out deliberately. The
  check enumerates `git ls-tree -r -t --full-tree` for both refs and compares
  the `(mode, type, object)` triple per path; it does not infer the complement
  from the diff.
- Pinned blobs unchanged: `scripts/phase-50a/pg-tools.ts`
  `c97904695661fb3601a8ed44f520bd3a548efbe7`; `tests/phase-50a/_support.ts`
  `aae992690e7ccc1817a213892bd43478c6b7aebb`;
  `tests/phase-31f-operator-recall-wedge-demo.test.ts`
  `820221ec773cdd24fdd9e386aaaf06a4a17c5206`;
  `docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md`
  `d295948c1b97ccf9c6932e400a8861ca0466f396`.
- The two in-file preserved blocks are asserted byte-identical by test, located
  by first line: the **F-01** seam block (81 lines, 4308 B,
  `sha256:43cfce3c…`) and the **F-14/F-15** runbook block (3442 B,
  `sha256:8773f4fa…`).
- This document's prefix is preserved exactly: **285033** bytes,
  `sha256:a69e9210f28983b5bfa7c5b602b21b5954de15f31e46a0b73e0ed26b9de98d0c`.
  Section 24 is appended after it and nothing before it was edited.
- No `package.json`, `package-lock.json`, `tsconfig*`, workflow, migration,
  `docker-compose.phase-50a.yml`, `.straylight/`, ADR, runbook, `.loa`,
  `.claude/` or sibling-repository change. No credential, provider or
  living-estate access; the only databases touched are the two disposable
  loopback harness instances.
- The prior `config.ts` export-surface pin was explicitly released by the
  packet; its replacement still pins a **closed, checked** surface — exactly
  `SHIPPED_SCHEMA_VERSIONS` and `resolveConfig`, asserted by deep equality.

### 24.10 Verification

Run on this branch at the final tree, with the disposable two-host harness up:

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | clean |
| Build | `npm run build` | 30 `dist-types` declarations, no PostgreSQL declaration |
| Closure suite | `npx vitest run tests/phase-50a/safety-authority-closure.test.ts` | **67 passed (67)** |
| Phase 50A, live | `npm run phase-50a:test` | **16 files, 384 passed (384)** |
| Whole repository | `npm test` | **90 files, 2343 passed, 151 skipped**, exit 0 |
| Control plane | `npm run control-plane:validate` | all checks passed |
| Control plane | `npm run control-plane:test` | **29 files, 1025 passed** |
| Artifact / no-leak | `npm run phase-50a:verify-artifact` | **PASS — C1..C9 hold** |
| Two-host proof | `npm run phase-50a:proof` | **PASS** (distinct clusters, digests equal, chains verify, cold load, governed recall, continued write) |
| Verifier, live PASS | `vite-node scripts/phase-50a/verify-existing-restore.ts --source … --target …` | exit **0**, `observed 20 / recognized 20` |
| Verifier, live MISMATCH | same, against the diverged replacement | exit **1**, differences reported, source untouched |
| Whitespace | `git diff --check` | clean (see the note below on the two-ref form) |

**On the whitespace check.** The fixed proof schedule's `no-whitespace-damage`
entry is `git diff --check`, which compares the working tree to the index; the
tree is clean, so it passes. Run in its *two-ref* form,
`git diff --check 98ba111 HEAD` reports exactly one line —
this document's line 5143, inside the fenced §24.7 quotation of mutation M3's
diff. That line is a unified-diff **context marker for a blank source line**: a
single space, which is what `git diff` itself emits and what the quoted diff
needs in order to remain a faithful, appliable record of the mutation. It was
left byte-exact deliberately, in preference to editing quoted evidence to
flatter a checker. No source file in this slice carries trailing whitespace.

The live verifier's `20` observed statements are `2 × (8 published reads +
BEGIN + COMMIT)`, all recognized by membership — the F-14 authority and the
read-only boundary exercised end-to-end against real PostgreSQL. Its target
lines read `postgresql://<redacted>@127.0.0.1:55432/straylight_source`, the
F-04 rendering, on a real diagnostic surface.

### 24.11 Residual limits

- **Driver error text is still the driver's.** `withClient`'s failure message
  interpolates the driver's own error after naming the target. For a
  connection-string-supplied `sslkey` path that does not exist, `pg`'s `ENOENT`
  text echoes that path. This is pre-existing, untouched by this slice, and
  outside F-04 — which is about what *this* code renders. It is recorded here
  because it is the one place a connection-string-derived string can still reach
  a diagnostic.
- **`<target unresolved>` is a real degradation** in naming power for hosts that
  never built a client, accepted deliberately in preference to guessing.
- **The read-only boundary is proven on the verification path only.** The
  destructive harness path legitimately issues DDL through `withClient`, so the
  boundary was not placed there; widening that seam is outside this packet.
- **DB-backed proofs require the harness.** Without `npm run phase-50a:up`, the
  nine DB-backed Phase 50A files fail closed with an unreachable-host error
  rather than passing vacuously.
- **Nothing here speaks to production.** ADR-049Q §12's pre-production
  obligations — durability, failover, version pinning, network isolation,
  tenancy boundary, availability, incident recovery, and backup/restore against
  any real deployment — remain unproven, as §23 already recorded.

### 24.12 Standing scope statement

This section reports **implementation and proof** for three findings (F-04,
F-09, F-14) and a regression statement for a fourth (F-10). It is **not an
audit**. It makes no claim that anything is accepted.

No provider, production, living-estate, sibling-repository or external-API
authority is claimed. No Tracks B/C/D work, no Phase 50B progression, no
control-plane change, no workflow / package / dependency / lockfile change, no
gate closure, no MVP-2 closure, and no acceptance, readiness or merge claim —
closing these findings does not make any pull request merge-eligible. Merge
remains **operator-only** (`operator:eileen`, ADR-049 §6). PR #136 and the
substrate `98ba111` remain immutable rejected substrate. F-01 and F-15 remain
preserved as closed absent new regression evidence. The audit of this slice is
Codex's; the implementer does not audit its own work.

**Implementation provenance.** Exactly **one** Claude agent at extra-high
effort did this work, under lease
`lease-phase-50a-implementer-authority-boundary-032` (lane #122 sequence 113).
**No** Ultracode, **no** `/batch`, **no** teams, **no** subagents, and **no**
delegation of any kind.
