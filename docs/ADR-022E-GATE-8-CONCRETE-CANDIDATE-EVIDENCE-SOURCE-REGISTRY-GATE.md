# Phase 49F — ADR-022E Gate #8 Concrete-Candidate Evidence Source-Registry Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49F (File 1 of 7)** — docs-only **evidence source-registry** gate for the canonical-store
> concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / source-registry only.** Phase 49E File 2 recorded
> **`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md:106`): a later docs-only PR may
> gather `P-1 … P-11` evidence for the five Phase 49D candidates, within the Phase 49E File 3 grain
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md:140`). This file **records the evidence
> source registry** that the Phase 49F evidence packets (Files 2–7) draw from, as
> **`CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`**. It **registers sources; it gathers no decision.** It
> ranks **no** candidate, accepts **no** candidate, selects **no** concrete physical host, selects **no** production
> database, proposes **no** production adapter, and authorizes **no** implementation. The only change on this branch
> is **seven** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration,
> auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo
> path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049F` — following the live convention for the Phase 48 / 49 family. It records a bounded
**evidence source registry**: it enumerates the public/provider-documentation sources the Phase 49F candidate
evidence packets may draw from, the candidate each source supports, its permitted and forbidden evidence use, and a
no-leak self-check per source. The immediate predecessor is **Phase 49E**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md)),
which recorded `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`.

This is **File 1 of 7** in Phase 49F. Read alongside Files 2–6 (the five per-candidate evidence packets) and File 7
(the evidence packet rollup): this file fixes the *source inventory* every packet cites; the packets fix the
*per-candidate evidence*; the rollup fixes the *aggregate status*.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — the five candidates this lane gathers evidence for. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Phase 49E File 1 — evidence-authorization response** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`** — EAQ-1 a later PR may gather evidence; EAQ-2 public/provider-documentation plus repo-local architecture evidence with the forbidden-detail list binding; EAQ-3 all five in parallel, ranking and acceptance each separate; EAQ-4 sibling-owner evidence after gathering / before acceptance; EAQ-5 adapter separate; EAQ-6 implementation separate. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:171` |
| **Phase 49E File 2 — evidence-lane authorization** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`** — authorized the later evidence lane and fixed its scope. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md:106` |
| **Phase 49E File 3 — evidence-grain boundary** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`** — fixed the allowed grain (public/provider-documentation plus repo-local architecture) and the forbidden-detail list. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md:140` |
| **Phase 49E File 5 — sibling-owner evidence timing** | Recorded **`SIBLING_OWNER_EVIDENCE_TIMING_RECORDED`** — sibling-owner evidence not required before docs-only gathering; required before acceptance / gate #8 satisfaction. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md:89` |
| **Phase 49E File 6 — evidence-to-decision separation** | Recorded **`EVIDENCE_TO_DECISION_SEPARATION_RECORDED`** — evidence gathering, evidence result, ranking, acceptance, host selection, adapter proposal, implementation, and production wiring are each a separate later gate. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**; semantic owner `loa-straylight`. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 49E's authorization, scope, grain boundary, sibling timing, and separation ladder
> are the entry baseline; this gate registers the sources the packets draw from — and goes no further.

### 1.1 The five candidates these sources support (restated, not changed)

The Phase 49F evidence packets cover exactly the five Phase 49D candidates
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`), all "shortlisted (held)":

1. **`PostgreSQL`** — database engine (`:123`).
2. **`Railway PostgreSQL`** — deployment provider (managed-service option) (`:124`).
3. **`Supabase Postgres`** — deployment provider (managed-service option) (`:125`).
4. **`Neon Postgres`** — deployment provider (managed-service option) (`:126`).
5. **`Self-hosted PostgreSQL on future Straylight-controlled infrastructure`** — self-hosted option (`:127`).

### 1.2 The `P-1 … P-11` areas the sources map to (restated, not changed)

Every piece of evidence in Files 2–6 maps to one of the `P-1 … P-11` areas defined at
`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`: P-1 candidate identity /
ownership; P-2 durability; P-3 tenant / actor / estate isolation; P-4 migration / schema ownership; P-5 runtime
writer boundary; P-6 read / recall boundary; P-7 audit / receipt persistence; P-8 failure / rollback / recovery;
P-9 permission / auth / signer authority; P-10 no-leak / public-private projection; P-11 test / evidence shape.

---

## 2. Documentation URLs are evidence-source URLs, not deployment endpoints

The URLs registered below are **evidence-source URLs** — they point at publicly available *documentation pages*
describing a provider's or engine's capabilities at descriptive grain. They are **not** deployment endpoints,
**not** connection targets, and **not** host URLs in the forbidden sense
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md` §3;
`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`). A documentation URL describes a
capability; it does not connect to, configure, or wire any substrate. No connection string, host endpoint, port,
account / project identifier, region, topology, or credential is registered here or in any Phase 49F packet.

> **Distinction (load-bearing).** "Evidence-source URL" = a documentation page cited as descriptive capability
> evidence. "Deployment endpoint" = a connection / host / wiring target. Phase 49F uses the former and forbids the
> latter. A reviewer who finds a connection-style URL in any Phase 49F file must refuse it as a forbidden-detail
> leak.

---

## 3. Evidence source registry

Each source is registered with: the **candidate(s) it supports**, its **permitted evidence use**, its **forbidden
use**, and a **no-leak self-check**. All permitted uses are at **descriptive public-doc / engine grain only**; none
authorizes a deployment fact, a ranking, an acceptance, a host selection, an adapter proposal, or an
implementation.

### 3.1 `PG-SOURCE-1` — PostgreSQL official

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://www.postgresql.org/about/`
- **Candidate(s) supported**: `PostgreSQL` (File 2); also the **engine basis** inherited by
  `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` (File 6) via `SELFHOST-SOURCE-1`.
- **Permitted evidence use** (engine grain): PostgreSQL identity as an open-source object-relational database
  system; SQL support; reliability / data-integrity / architecture claims; WAL, replication, PITR, access-control,
  and row-level-security feature *presence*.
- **Forbidden use**: do not treat engine-level feature presence as a hosted physical deployment decision; do not
  treat it as managed-service durability, as Straylight production isolation, as runtime writer boundary, as audit
  persistence, or as operational recovery; do not derive a host, an adapter, or an implementation from it.
- **No-leak self-check**: engine documentation carries no Straylight connection string, host, port, account /
  project identifier, region, topology, or credential — none is copied here or into Files 2 / 6.

### 3.2 `RAILWAY-SOURCE-1` — Railway PostgreSQL database

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://docs.railway.com/databases/postgresql`
- **Candidate(s) supported**: `Railway PostgreSQL` (File 3).
- **Permitted evidence use** (public-doc grain): the Railway PostgreSQL database template can provision and connect
  to PostgreSQL; a Railway Postgres service runs in a Railway project; Railway encourages backups and observability
  for production environments.
- **Forbidden use**: do not copy connection-variable **names or values**, service names, project identifiers, or
  any wiring into committed docs; connection-variable surfaces are described only as a *category* ("a managed
  Postgres service exposes connection variables"), never reproduced; no deployment endpoint.
- **No-leak self-check**: the connection-variable surface the page mentions is recorded as a category name only,
  with no variable name, value, endpoint, port, or credential copied into File 3.

### 3.3 `RAILWAY-SOURCE-2` — Railway volume backups

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://docs.railway.com/volumes/backups`
- **Candidate(s) supported**: `Railway PostgreSQL` (File 3).
- **Permitted evidence use** (public-doc grain): Railway volume backups support data recovery for content stored in
  volumes; backups can be manually created / restored and scheduled daily / weekly / monthly; restore creates /
  replaces volume posture through staged review; volume-backup limitations / caveats may be recorded at descriptive
  grain.
- **Forbidden use**: do not copy commands, schedule-configuration values, volume identifiers, or restore wiring; do
  not present backup capability as an accepted recovery design for Straylight.
- **No-leak self-check**: backup capability is recorded as descriptive posture only — no command, identifier,
  endpoint, or credential is copied into File 3.

### 3.4 `RAILWAY-SOURCE-3` — Railway point-in-time recovery

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://docs.railway.com/volumes/point-in-time-recovery`
- **Candidate(s) supported**: `Railway PostgreSQL` (File 3).
- **Permitted evidence use** (public-doc grain): Railway PITR can restore a Postgres service to a timestamp within
  an archive retention window; PITR uses WAL archiving and base backups; restore provisions a new Postgres service
  beside the source and does not touch the source service; limitations may be recorded at descriptive grain.
- **Forbidden use**: do not copy concrete env-var names, bucket credentials, commands, target timestamps, service
  names, or deployment wiring.
- **No-leak self-check**: PITR capability is recorded as descriptive posture only — no env-var name, bucket
  credential, command, target timestamp, endpoint, or wiring is copied into File 3.

### 3.5 `SUPABASE-SOURCE-1` — Supabase database overview

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://supabase.com/docs/guides/database/overview`
- **Candidate(s) supported**: `Supabase Postgres` (File 4).
- **Permitted evidence use** (public-doc grain): every Supabase project has a full Postgres database; that database
  is the foundation for Auth, Storage, Realtime, and Edge Functions; Supabase manages daily database backups and
  offers point-in-time recovery on paid plans; Storage API objects are separate from database backup scope.
- **Forbidden use**: do not copy API token examples, project-ref examples, curl commands, endpoint strings, or
  pricing details; "paid plans" is referenced as a *plan-tier posture* only, with no price figure.
- **No-leak self-check**: capability and plan-tier posture are recorded descriptively — no token, project-ref, curl
  command, endpoint, price, or credential is copied into File 4.

### 3.6 `SUPABASE-SOURCE-2` — Supabase platform backups

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://supabase.com/docs/guides/platform/backups`
- **Candidate(s) supported**: `Supabase Postgres` (File 4).
- **Permitted evidence use** (public-doc grain): Supabase automatically backs up Pro, Team, and Enterprise projects
  daily; backup retention differs by plan; daily backups do not store custom-role passwords; database backups do
  not include Storage API objects; PITR allows chosen-point restoration with finer granularity than daily backups
  and has plan / add-on requirements; restoration can involve project downtime.
- **Forbidden use**: do not copy API token examples, project-ref examples, curl commands, endpoint strings, or
  pricing figures; plan tiers and add-on *requirements* are referenced as posture only.
- **No-leak self-check**: backup / PITR posture and the Storage-API backup boundary are recorded descriptively — no
  token, project-ref, curl command, endpoint, price, or credential is copied into File 4.

### 3.7 `NEON-SOURCE-1` — Neon introduction

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://neon.com/docs/introduction`
- **Candidate(s) supported**: `Neon Postgres` (File 5).
- **Permitted evidence use** (public-doc grain): Neon is serverless Postgres; Neon documents autoscaling,
  branching, instant restore, and related features — used as candidate identity / capability evidence only, not as
  acceptance.
- **Forbidden use**: do not present capability presence as acceptance, ranking, host selection, or an adapter; no
  endpoint, project identifier, or wiring.
- **No-leak self-check**: identity / capability presence is recorded descriptively — no endpoint, project
  identifier, command, or credential is copied into File 5.

### 3.8 `NEON-SOURCE-2` — Neon branching

- **Evidence-source URL** (documentation, not a deployment endpoint): `https://neon.com/docs/guides/branching-intro`
- **Candidate(s) supported**: `Neon Postgres` (File 5).
- **Permitted evidence use** (public-doc grain): Neon branching supports development workflows; branches can be used
  to test potentially destructive or performance-impacting queries before production; Neon documents data recovery
  and audits via restoring a branch to history / point-in-time branches.
- **Forbidden use**: do not copy commands, project identifiers, endpoint names, or integration / deployment steps.
- **No-leak self-check**: branching / recovery capability is recorded descriptively — no command, project
  identifier, endpoint, or step is copied into File 5.

### 3.9 `SELFHOST-SOURCE-1` — Self-hosted PostgreSQL on future Straylight-controlled infrastructure

- **Source basis** (no distinct deployment URL): the same PostgreSQL **engine** evidence as `PG-SOURCE-1`. No
  concrete deployment provider, account, topology, region, credential, host, adapter, production infrastructure, or
  operational owner has been authorized yet.
- **Candidate(s) supported**: `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` (File 6).
- **Permitted evidence use**: engine-level PostgreSQL evidence (via `PG-SOURCE-1`) may be carried forward at engine
  grain.
- **Forbidden use**: deployment / operations evidence must remain `NOT_EVIDENCED` or held; future-infrastructure
  authority is required before this candidate can be accepted; do not invent a provider, account, region, topology,
  host, or operational owner.
- **No-leak self-check**: only engine-grain evidence is inherited; no provider, account, region, topology, host,
  endpoint, credential, or operational owner is named in File 6.

### 3.10 Source-registry summary table

| Source label | Evidence-source URL (documentation, not a deployment endpoint) | Candidate(s) supported | Grain |
|--------------|----------------------------------------------------------------|------------------------|-------|
| `PG-SOURCE-1` | `https://www.postgresql.org/about/` | `PostgreSQL` (File 2); engine basis for File 6 | engine |
| `RAILWAY-SOURCE-1` | `https://docs.railway.com/databases/postgresql` | `Railway PostgreSQL` (File 3) | public-doc |
| `RAILWAY-SOURCE-2` | `https://docs.railway.com/volumes/backups` | `Railway PostgreSQL` (File 3) | public-doc |
| `RAILWAY-SOURCE-3` | `https://docs.railway.com/volumes/point-in-time-recovery` | `Railway PostgreSQL` (File 3) | public-doc |
| `SUPABASE-SOURCE-1` | `https://supabase.com/docs/guides/database/overview` | `Supabase Postgres` (File 4) | public-doc |
| `SUPABASE-SOURCE-2` | `https://supabase.com/docs/guides/platform/backups` | `Supabase Postgres` (File 4) | public-doc |
| `NEON-SOURCE-1` | `https://neon.com/docs/introduction` | `Neon Postgres` (File 5) | public-doc |
| `NEON-SOURCE-2` | `https://neon.com/docs/guides/branching-intro` | `Neon Postgres` (File 5) | public-doc |
| `SELFHOST-SOURCE-1` | *(no distinct URL — engine basis = `PG-SOURCE-1`)* | `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` (File 6) | engine basis only |

---

## 4. Forbidden-detail self-check (whole registry)

This file — and every Phase 49F file that cites it — introduces **none** of the following (each must remain
absent, per `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md` §3 and
`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`):

- [x] no credentials, credential values, secrets, API keys, tokens, or private keys
- [x] no connection strings, host URLs (as deployment endpoints), ports, or endpoints
- [x] no account identifiers, project identifiers, regions, or topology
- [x] no production wiring, deployment steps, commands, or implementation details
- [x] no pricing figures (plan-tier posture referenced descriptively only, with no price)
- [x] no host / product selection and no production database selection
- [x] no production-adapter proposal (the gate-#8 `M5` shape — reserved for a separate, later lane)

> The documentation URLs above are the **only** URLs in Phase 49F, and they are evidence-source URLs, not
> deployment endpoints (§2). No other external source is browsed or cited.

---

## 5. Registry decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`** — the source inventory (§3), the candidate
   mapping, the permitted / forbidden use per source, and the per-source no-leak self-check are all formable and
   recorded within the Phase 49E File 3 grain. The registry is real, so it is recorded.
2. **It is *not* a held result** — a held result would apply only if the sources could not be enumerated or mapped.
   They are enumerated and mapped, so the registry is recorded, not held.
3. **It is *not* a patch-required result** — a patch result would apply if the registry were ambiguous, internally
   inconsistent, or impossible to record without amendment. The inventory is unambiguous and bounded: nine source
   labels, each mapped to its candidate(s), each with permitted / forbidden use and a no-leak self-check.

> **Registry recorded ≠ evidence gathered ≠ candidate ranked ≠ candidate accepted ≠ host selected ≠ adapter
> proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED` is the result of *this source-registry gate only*. **Gate
> #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: the Phase 49F per-candidate evidence packets and rollup (Files 2–7).** Each packet draws
> only on the sources registered here, at the registered grain, mapped to `P-1 … P-11`, and classifies its own
> evidence as `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`. None ranks, accepts, selects a host, proposes an
> adapter, or implements.

- **File 2** — [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-POSTGRESQL-EVIDENCE-PACKET.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-POSTGRESQL-EVIDENCE-PACKET.md) — uses `PG-SOURCE-1`.
- **File 3** — [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RAILWAY-POSTGRESQL-EVIDENCE-PACKET.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RAILWAY-POSTGRESQL-EVIDENCE-PACKET.md) — uses `RAILWAY-SOURCE-1/2/3`.
- **File 4** — [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SUPABASE-POSTGRES-EVIDENCE-PACKET.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SUPABASE-POSTGRES-EVIDENCE-PACKET.md) — uses `SUPABASE-SOURCE-1/2`.
- **File 5** — [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NEON-POSTGRES-EVIDENCE-PACKET.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NEON-POSTGRES-EVIDENCE-PACKET.md) — uses `NEON-SOURCE-1/2`.
- **File 6** — [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md) — uses `SELFHOST-SOURCE-1` (engine basis = `PG-SOURCE-1`).
- **File 7** — [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md) — rollup of Files 2–6.

Any follow-on PR title must carry its phase label, e.g. `Phase 49F: concrete-candidate evidence packets` *(docs-only)*.

---

## 7. Preserved blocked state

This gate preserves every held / open state unchanged:

- **Gate #8** remains **`OPEN / HELD`** — not discharged; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **Gate #9** remains held with **`PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **Gate #10** remains held with **`PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`);
- **D.1(ii)** remains **unresolved**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`);
- **D.1 is not satisfied** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165`);
- **D.2 is not started** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167`);
- **MVP-2 remains open** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168`);
- **The concrete canonical-store physical host remains unselected** — owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

---

## 8. Preserved non-claims

Each item below is preserved as a **negation**. This evidence source-registry gate:

- **does not gather** any `P-1 … P-11` evidence — it registers the sources the packets gather against;
- **does not rank** any candidate — ranking is a separate candidate decision gate;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later separate request, the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` swap-in seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR — no sibling-repo PR may merge without teammate review
  (`docs/handoffs/cross-repo-handoff-index.md:28`).

> Every notion above appears in this document only inside a negation. Registering evidence sources is not gathering
> any evidence, ranking any candidate, accepting any candidate, selecting any host, selecting any production
> database, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49F (File 1 of 7) — gate #8 concrete-candidate evidence source-registry gate (docs-only) |
| **Predecessor** | Phase 49E File 2 — recorded `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED` |
| **Decision result** | **`CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`** — nine source labels enumerated, mapped to candidates, with permitted / forbidden use and a no-leak self-check each; not held (the inventory is formable and recorded); not patch-required (the inventory is unambiguous and bounded) |
| **Sources registered** | `PG-SOURCE-1`; `RAILWAY-SOURCE-1/2/3`; `SUPABASE-SOURCE-1/2`; `NEON-SOURCE-1/2`; `SELFHOST-SOURCE-1` (engine basis = `PG-SOURCE-1`) |
| **Candidates** | `PostgreSQL`; `Railway PostgreSQL`; `Supabase Postgres`; `Neon Postgres`; `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked or accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | the Phase 49F per-candidate evidence packets and rollup (Files 2–7), each drawing only on these sources at the registered grain |
| **Scope of this PR** | exactly seven new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Seven-file change.** The branch adds exactly the seven Phase 49F files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Registry recorded, not executed.** §3 enumerates the sources; no evidence is gathered here.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`; not
      held, not patch-required.
- [ ] **URLs are evidence-source URLs.** §2 fixes the distinction; only the eight documentation URLs and nine source labels appear; no
      deployment endpoint, connection string, or port.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, host selection, a ranked / accepted candidate, a
      proposed production adapter, or implementation — each appears only inside a negation (§8).
- [ ] **No product leak.** No credential, connection string, port, account / project identifier, region, topology,
      endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49E File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED` (`:106`). **Entry baseline / predecessor.**
- [Phase 49E File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md) —
  recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` (`:171`); EAQ-2 grain (`:123`).
- [Phase 49E File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED` (`:140`); the forbidden-detail list (§3).
- [Phase 49E File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md) — the evidence packet
  template Files 2–6 fill.
- [Phase 49E File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md) — recorded
  `SIBLING_OWNER_EVIDENCE_TIMING_RECORDED` (`:89`).
- [Phase 49E File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md) — recorded
  `EVIDENCE_TO_DECISION_SEPARATION_RECORDED` (`:111`).
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`); named the five candidates (`:123`–`:127`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49F File 1. Docs-only gate #8 concrete-candidate evidence source-registry gate. It records
`CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`: nine source labels (`PG-SOURCE-1`; `RAILWAY-SOURCE-1/2/3`;
`SUPABASE-SOURCE-1/2`; `NEON-SOURCE-1/2`; `SELFHOST-SOURCE-1`), each mapped to its candidate(s), with permitted /
forbidden evidence use and a no-leak self-check. Documentation URLs are evidence-source URLs, not deployment
endpoints. It gathers no evidence, ranks no candidate, accepts no candidate, selects no host, selects no production
database, proposes no production adapter, and authorizes no implementation. The selected next lane is the Phase 49F
per-candidate evidence packets and rollup (Files 2–7). No commit, no push, no PR.*
