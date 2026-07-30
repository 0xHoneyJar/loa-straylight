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
- **Stale-snapshot fence** — the loaded append prefix is re-fingerprinted
  before persisting and must be unchanged.

`hashtextextended` and `pg_advisory_xact_lock` are core PostgreSQL functions,
not extensions.

---

## 5. Idempotency and conflict (§13.1(g))

Retry converges **only** on byte-identical canonical content. The comparison
is over the canonical serialization, so field order or absent-vs-undefined can
never make two different records look equal.

| Case | Outcome |
|---|---|
| Same immutable id, identical canonical payload, already in the loaded snapshot | Idempotent skip. No second position, no duplicate. Reported in `persisted.idempotent`. |
| Same immutable id, identical payload, committed by another transaction between load and write | Idempotent, classified against the live row in `persist.ts`. |
| Same immutable id, **different** canonical payload | `PostgresIntegrityError` `immutable_id_conflict`; the transaction rolls back. |
| Append position taken by a different id | `PostgresIntegrityError` `duplicate_append_position`. |

Append-only inserts carry **no `ON CONFLICT` clause**, so a collision raises
and is then classified explicitly. A blanket `DO NOTHING` would absorb the
genuine-conflict case identically to the retry case.

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

1. the value is inspected (`isThenable` — a callable `then`, read once, so a
   native Promise and any hostile thenable are both caught);
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

### 12.7 Regression adequacy

Each implementation fix was reverted in isolation to confirm the new tests
actually catch the original defect: removing the thenable refusal fails 6
Finding-2 regressions; reverting to payload-only comparison fails 5 Finding-3
regressions; removing checksum verification fails 5 Finding-4 regressions. The
artifact verifier was likewise proven non-vacuous — an injected untracked
PostgreSQL declaration makes it exit 1 naming C2 and C3, and a tracked one makes
the prune refuse rather than delete.

### 12.8 Scope

Patch-only changed paths (14), all inside `allowed_paths`, zero forbidden-path
changes: the workflow; `package.json` (scripts only — `dependencies`,
`devDependencies`, `engines`, `files`, `exports`, `types`, and `version` are
byte-identical); `scripts/phase-50a/prune-internal-postgres-types.{mjs,d.mts}`;
`scripts/phase-50a/verify-generated-artifact.mjs`;
`src/straylight/storage/postgres/{errors,host,index,migrate,persist,queries}.ts`;
and three new `tests/phase-50a/` suites. Plus this document and the runbook.

`StorageAdapter` remains synchronous (no `Promise` in the seam) and the error
reasons are purely additive. Nothing in §10's residual unproven pre-production
obligations is discharged by this patch, and it authorizes no acceptance, gate
disposition, Phase 50B work, MVP-2 claim, audit, or merge.
