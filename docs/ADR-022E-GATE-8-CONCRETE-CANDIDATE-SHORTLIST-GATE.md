# Phase 49D — ADR-022E Gate #8 Concrete-Candidate Shortlist Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49D (File 1 of 6)** — docs-only **concrete-candidate shortlist** gate for the canonical-store
> substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / shortlist-record only.** Phase 49C File 2 recorded
> **`CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md:112`), authorizing a *later* docs-only
> lane to name and compare concrete candidates within the EQ-2 categories. This file **exercises that bounded
> authorization**: it copies the Phase 49C File 5 shortlist packet template
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md:227`), names concrete candidates **only at
> the EQ-2 grain** (database engine; deployment provider; managed-service vs self-hosted option), records their
> shortlist fields, and records **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`**. It **prepares a shortlist; it accepts
> no host.** It selects **no** concrete physical host, selects **no** production database, accepts **no** candidate,
> proposes **no** production adapter, and authorizes **no** implementation. It introduces **none** of the EQ-2
> forbidden details (account identifiers; project identifiers; credentials; connection strings; ports; regions;
> topology; production wiring; implementation details). The only change on this branch is **six** new Markdown files
> under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI,
> generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049D` — following the live convention for the Phase 48 / 49 family. It records a bounded
**concrete-candidate shortlist** at exactly the grain Phase 49C authorized: candidates are named **within EQ-2
categories** only — never as a leaked deployment fact, never as a selected host, never as an accepted candidate.
The immediate predecessor is **Phase 49C File 2**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md)),
which recorded `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`; it copies and fills the Phase 49C File 5
shortlist packet template
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md)).

This is **File 1 of 6** in Phase 49D. The companions are:

2. **The candidate comparison matrix**
   ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md))
   — compares the shortlisted candidates across the `P-1 … P-11` expected-evidence areas and the operational axes,
   and records `CONCRETE_CANDIDATE_COMPARISON_RECORDED`. It accepts **no** candidate.
3. **The exclusion / hold rationale**
   ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md))
   — records which candidates are held (none excluded) and why, and records
   `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`. It rejects **no** candidate prematurely.
4. **The sibling-evidence posture**
   ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md))
   — records the per-candidate Finn / Dixie / Hounfour posture inherited from Phase 49C File 4, and records
   `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`. It requests **no** sibling evidence.
5. **The adapter / implementation posture**
   ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-ADAPTER-IMPLEMENTATION-POSTURE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-ADAPTER-IMPLEMENTATION-POSTURE.md))
   — records that naming each candidate proposes no adapter and authorizes no implementation, inheriting Phase 49C
   File 3, and records `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED`.
6. **The evidence-authorization request gate**
   ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md))
   — frames the bounded questions (EAQ-1 … EAQ-6) asking whether a *later* PR may gather `P-1 … P-11` evidence
   against the shortlisted candidates, and records `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`. It
   gathers **no** evidence.

---

## 1. Source context (Phase 49C, restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49C File 1 — exact-grain authority response** | Recorded **`EXACT_GRAIN_AUTHORITY_PARTIAL`** — EQ-1 yes (a later docs-only PR may name concrete candidates); EQ-2 six allowed categories with the forbidden-detail list; EQ-3 compare but no acceptance without a separate gate; EQ-4 evidence across `P-1 … P-11` plus sibling posture and no-leak; EQ-5 adapter separate; EQ-6 implementation separate. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:208`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:124`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:132` |
| **Phase 49C File 2 — naming authorization** | Recorded **`CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`** — a later docs-only shortlist lane may name and compare concrete candidates within the EQ-2 categories. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md:112` |
| **Phase 49C File 3 — adapter / implementation separation** | Recorded **`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`** — adapter proposal and implementation each remain separate later authorities; naming a candidate implies neither. | `docs/ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md:129` |
| **Phase 49C File 4 — sibling-evidence request preparation** | Recorded **`SIBLING_EVIDENCE_REQUEST_PREPARED`** — Finn / Dixie / Hounfour request lanes are prepared but not authorized. | `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md:113` |
| **Phase 49C File 5 — shortlist packet template** | The bounded template / checklist this file copies and fills; its classification placeholder `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` is selected here as *this* PR's File 1 result. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md:227` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**; semantic owner `loa-straylight`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 49C File 2's `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST` is the entry
> baseline; this gate exercises that bounded naming authorization to prepare a shortlist — and goes no further.

---

## 2. Exact-grain authority response summary (restated from Phase 49C File 1)

The shortlist below is named strictly inside the bounds Phase 49C File 1 recorded; none is re-framed:

- **EQ-1** — a later docs-only PR **may** name concrete product / vendor / engine / deployment-provider candidates
  (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:124`). This is the PR.
- **EQ-2** — candidates may be named within **database engine; deployment provider; managed-service vs self-hosted
  option; storage substrate role; credential-boundary role; evidence-shape role**, and **must not** introduce
  account identifiers; project identifiers; credentials; connection strings; ports; regions; topology; production
  wiring; implementation details (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:132`;
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
- **EQ-3** — a later PR may **compare** multiple candidates but **must not accept** a final host without a separate
  acceptance gate (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`).
- **EQ-4** — before any named candidate can be accepted, evidence must show across `P-1 … P-11`
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`) plus the sibling-evidence
  posture and a no-leak self-check (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:161`).
- **EQ-5 / EQ-6** — adapter proposal and implementation each remain a separate, later request
  (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183`;
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191`).

---

## 3. Candidate naming authorization summary (restated from Phase 49C File 2)

- **Naming authorization in effect** — `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md:112`).
- **Naming-grain bound** — each candidate is named only within an EQ-2 category; no forbidden detail is introduced.
- **Comparison allowed** — multiple candidates may be compared (EQ-3); **no** final-host acceptance occurs here.

> The candidates below are all members of the **same** EQ-2 categories the authority fixed. Naming them is the
> exercise of the recorded authorization, not an extension of it. The estate owner is unchanged: every candidate is
> evaluated under `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`, and ownership does not follow location
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`;
> `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`;
> `docs/decisions/ADR-020A-straylight-semantic-owner.md:45`).

---

## 4. Candidate shortlist table

One row per concrete candidate, named **only** within an EQ-2 category. Each candidate is a *role / engine /
operational-option* name — never a leaked deployment fact. The `StorageAdapter` swap-in seam already names
PostgreSQL as the future production substrate at the engine grain
(`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`;
`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:80`), so the engine candidate is grounded prior art,
not a new commitment.

| # | Candidate display name | EQ-2 category membership | Estate-owner boundary | No-leak posture | Sibling-evidence posture | Adapter / implementation separation | Shortlist disposition |
|---|------------------------|--------------------------|-----------------------|-----------------|--------------------------|-------------------------------------|-----------------------|
| C-1 | **PostgreSQL** | database engine | `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` | forbidden details absent | Finn / Dixie held `PARTIAL_RECORDED`; Hounfour out of scope unless schema implicated | proposes no adapter; authorizes no implementation | **shortlisted (held)** |
| C-2 | **Railway PostgreSQL** | deployment provider (managed-service option) | `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` | forbidden details absent | Finn / Dixie held `PARTIAL_RECORDED`; Hounfour out of scope unless schema implicated | proposes no adapter; authorizes no implementation | **shortlisted (held)** |
| C-3 | **Supabase Postgres** | deployment provider (managed-service option) | `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` | forbidden details absent | Finn / Dixie held `PARTIAL_RECORDED`; Hounfour out of scope unless schema implicated | proposes no adapter; authorizes no implementation | **shortlisted (held)** |
| C-4 | **Neon Postgres** | deployment provider (managed-service option) | `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` | forbidden details absent | Finn / Dixie held `PARTIAL_RECORDED`; Hounfour out of scope unless schema implicated | proposes no adapter; authorizes no implementation | **shortlisted (held)** |
| C-5 | **Self-hosted PostgreSQL on future Straylight-controlled infrastructure** | managed-service vs self-hosted option (self-hosted) | `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` | forbidden details absent | Finn / Dixie held `PARTIAL_RECORDED`; Hounfour out of scope unless schema implicated | proposes no adapter; authorizes no implementation | **shortlisted (held)** |

> **All five rows carry the disposition "shortlisted (held)."** Shortlisting is not selection and not acceptance:
> each candidate is recorded as a *named, comparable option* whose final-host acceptance remains gated behind a
> separate acceptance gate (EQ-3, `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`). The
> canonical-store physical host remains **UNSELECTED**
> (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

---

## 5. Per-candidate fields

For each candidate the template fields are filled at the EQ-2 grain only. The `P-1 … P-11` entries name the
*expected* evidence area each candidate would later have to discharge — this shortlist produces **no** evidence
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).

### 5.1 C-1 — PostgreSQL (database engine)

- **Category membership** — database engine; the durable-store engine kind already named as the future production
  substrate behind the `StorageAdapter` seam (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:80`).
- **Estate-owner boundary** — `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; ownership does not follow the
  engine choice (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`).
- **No-leak posture** — no account identifier, project identifier, credential, connection string, port, region,
  topology, production wiring, or implementation detail is introduced
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
- **Expected evidence areas** — `P-1 … P-11` apply as an *engine-level* expectation (durability, isolation,
  migration/schema ownership, audit/receipt persistence, recovery, no-leak projection, test/evidence shape).
- **Adapter / implementation separation** — naming the engine proposes no production adapter (EQ-5) and authorizes
  no implementation (EQ-6); the gate-#8 `M5` shape remains a separate, later lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

### 5.2 C-2 / C-3 / C-4 — Railway PostgreSQL, Supabase Postgres, Neon Postgres (deployment providers)

- **Category membership** — deployment provider (managed-service option): each names *where / how* a PostgreSQL
  engine could be operated as a managed service, at the provider grain only.
- **Estate-owner boundary** — `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; selecting a managed provider
  would not move semantic ownership off `loa-straylight`
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`;
  `docs/decisions/ADR-020A-straylight-semantic-owner.md:45`).
- **No-leak posture** — provider names are recorded as *operational options*; no account / project identifier,
  credential, connection string, port, region, topology, or production wiring is introduced.
- **Expected evidence areas** — `P-1 … P-11` apply as a *provider-level* expectation (durability SLAs, isolation,
  migration ownership, audit-chain persistence, recovery, no-leak projection) the provider would have to support.
- **Adapter / implementation separation** — naming a provider proposes no adapter and authorizes no
  implementation; no provider is wired, configured, or selected.

### 5.3 C-5 — Self-hosted PostgreSQL on future Straylight-controlled infrastructure (self-hosted option)

- **Category membership** — managed-service vs self-hosted option (self-hosted axis): the operational-ownership
  alternative to C-2 / C-3 / C-4, named at the option grain only.
- **Estate-owner boundary** — `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`.
- **No-leak posture** — recorded as an operational option; no host, topology, port, region, or wiring is
  introduced.
- **Expected evidence areas** — `P-1 … P-11` apply as a *self-hosted* expectation (operational durability,
  isolation, backup/recovery ownership, audit-chain persistence, no-leak projection).
- **Adapter / implementation separation** — proposes no adapter; authorizes no implementation.

---

## 6. Shortlist decision and rationale

The result is recorded against the permitted results for this gate (the Phase 49C File 5 classification
placeholders), and the conservative-but-accurate result is **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`**:

1. **It is `CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — a coherent shortlist of five named candidates, each within an
   EQ-2 category, is prepared for later evidence / acceptance lanes; the naming authorization (File 2) is exercised
   exactly within its bound, and the shortlist carries the no-leak posture, the sibling-evidence posture, and the
   adapter / implementation separation forward (§4, §5; companion Files 2–6).
2. **It is *not* `CONCRETE_CANDIDATE_SHORTLIST_PARTIAL`** — a partial result would apply if the shortlist were only
   partly formed or a required field could not be filled within the bound. Every candidate's EQ-2 fields are filled
   and the categories are coherent, so the shortlist is prepared, not partial.
3. **It is *not* `CONCRETE_CANDIDATE_SHORTLIST_REJECTED`** — a rejected result would apply if no candidate could be
   coherently shortlisted within the bound. Five candidates were named within the EQ-2 categories, so it is not
   rejected.
4. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_SHORTLIST_AMBIGUOUS`** — a patch result would apply if the
   shortlist could not be recorded without amendment. The shortlist is unambiguous and bounded: candidates named
   only within EQ-2 categories, forbidden details absent, comparison permitted, acceptance withheld. No patch is
   required.

> **Shortlist-prepared ≠ candidate selected ≠ candidate accepted ≠ host selected ≠ adapter proposed ≠
> implementation authorized ≠ gate #8 satisfaction.** Recording `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` is the
> result of *this shortlist gate only*. It names and compares candidates and nothing more — it selects no host,
> selects no production database, accepts no candidate, proposes no adapter, and authorizes no implementation.
> **Gate #8 remains OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: a docs-only concrete-candidate evidence-authorization request.** Because a coherent
> shortlist is prepared, the next docs-only step (File 6 of this PR, and a still-later evidence lane beyond it) asks
> whether a *later* PR may gather `P-1 … P-11` evidence against the shortlisted candidates — it must not accept a
> final host, propose an adapter, or implement.

- **File 6 reference** (the evidence-authorization request gate):
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md)
  — frames EAQ-1 … EAQ-6 and records `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`.
- That later evidence lane **gathers `P-1 … P-11` evidence**; it does **not** select a concrete host, does **not**
  select a production database, does **not** accept a candidate, does **not** propose a production adapter, and
  does **not** authorize implementation.

Any follow-on PR title must carry its phase label, e.g. `Phase 49E: concrete-candidate evidence` *(docs-only)*.

---

## 8. Preserved blocked state

This gate preserves every held/open state unchanged:

- **Gate #8** remains **`OPEN / HELD`** — not discharged; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **Gate #9** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **Gate #10** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`);
- **D.1(ii)** remains **unresolved**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`);
- **D.1 is not satisfied** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165`);
- **D.2 is not started** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167`);
- **MVP-2 remains open** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168`);
- **The concrete canonical-store physical host remains unselected** — owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

---

## 9. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
concrete-candidate shortlist gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **selects no concrete candidate** — shortlisting names and compares; selection is a later, separate transition;
- **accepts no candidate** — acceptance requires a separate acceptance gate (EQ-3);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — naming PostgreSQL / a provider / a self-hosted option is not selecting one;
- **proposes no production adapter** — adapter proposal remains a later, separate request (EQ-5);
- **authorizes no implementation** of any kind — implementation remains a later, separate request (EQ-6);
- **introduces no forbidden detail** — no account identifier, project identifier, credential, connection string,
  port, region, topology, production wiring, or implementation detail appears
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Preparing a concrete-candidate shortlist is
> not selecting any candidate, accepting any candidate, selecting any host, selecting any production database,
> proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49D (File 1 of 6) — gate #8 concrete-candidate shortlist gate (docs-only) |
| **Predecessor** | Phase 49C File 2 — recorded `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`; this file exercises that bounded authorization |
| **Decision result** | **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — five candidates named within EQ-2 categories and prepared for later evidence / acceptance lanes; not `CONCRETE_CANDIDATE_SHORTLIST_PARTIAL` (every field filled), not `CONCRETE_CANDIDATE_SHORTLIST_REJECTED` (candidates were namable), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_SHORTLIST_AMBIGUOUS` (shortlist unambiguous and bounded) |
| **Shortlisted candidates** | C-1 PostgreSQL (database engine); C-2 Railway PostgreSQL, C-3 Supabase Postgres, C-4 Neon Postgres (deployment providers / managed-service options); C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure (self-hosted option) — all "shortlisted (held)" |
| **Naming-grain bound** | each candidate named only within an EQ-2 category; forbidden details absent |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate evidence-authorization request (File 6, then a still-later evidence lane) that must not accept a host, propose an adapter, or implement |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49D files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Authorization exercised within bound.** §2–§5 name candidates only within the EQ-2 categories; no forbidden
      detail appears; comparison is permitted, acceptance withheld.
- [ ] **Result conservative and explained.** §6 records `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` and explains why it
      is not PARTIAL, not REJECTED, and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §7 selects the docs-only evidence-authorization request lane that must not accept a
      host, propose an adapter, or implement.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, production-database selection, a selected / accepted candidate, a
      proposed production adapter, or implementation — each appears only inside a negation (§8, §9).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      container / orchestration detail, or production wiring appears; candidates are named at engine / provider /
      operational-option grain only.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49C File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md) — recorded
  `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST` (`:112`). **Entry baseline / predecessor.**
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `EXACT_GRAIN_AUTHORITY_PARTIAL` (`:208`); EQ-1 (`:124`), EQ-2 (`:132`), EQ-3 (`:152`), EQ-4 (`:161`),
  EQ-5 (`:183`), EQ-6 (`:191`).
- [Phase 49C File 3](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md) — recorded
  `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` (`:129`).
- [Phase 49C File 4](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md) — recorded
  `SIBLING_EVIDENCE_REQUEST_PREPARED` (`:113`).
- [Phase 49C File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md) — the shortlist packet
  template this file copies and fills; classification placeholder `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:227`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`); the accepted UQ-2 candidate-naming grain (`:139`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — named the candidate at
  substrate-class grain (`:108`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`);
  the future-Postgres substrate naming (`:80`); the Phase-5 hardening invariants (`:111`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49D File 1. Docs-only gate #8 concrete-candidate shortlist gate. It exercises the Phase 49C File 2
naming authorization (`CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`) by copying the Phase 49C File 5
shortlist packet template and naming five concrete candidates strictly within the EQ-2 categories — PostgreSQL
(database engine); Railway PostgreSQL, Supabase Postgres, Neon Postgres (deployment providers / managed-service
options); Self-hosted PostgreSQL on future Straylight-controlled infrastructure (self-hosted option) — each evaluated under
`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`, with account identifiers, project identifiers, credentials,
connection strings, ports, regions, topology, production wiring, and implementation details all kept absent. It
records the per-candidate no-leak posture, sibling-evidence posture, and adapter / implementation separation, and
records `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (not `_PARTIAL`, not `_REJECTED`, not
`PATCH_REQUIRED_CONCRETE_CANDIDATE_SHORTLIST_AMBIGUOUS`). It selects no host, selects no production database,
accepts no candidate, proposes no production adapter, and authorizes no implementation. The selected next lane is a
docs-only concrete-candidate evidence-authorization request. No commit, no push, no PR.*
