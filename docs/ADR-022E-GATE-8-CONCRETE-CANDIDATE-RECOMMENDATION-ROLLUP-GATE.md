# Phase 49I — ADR-022E Gate #8 Concrete-Candidate Recommendation Rollup / Next-Lane Routing Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49I (File 7 of 7)** — docs-only **rollup / next-lane routing** gate for the canonical-store
> concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / rollup only.** This file **summarizes Phase 49I Files 1–6**, preserves the blocked state, and
> records the selected next lane — recording **`CONCRETE_CANDIDATE_RECOMMENDATION_ROLLUP_RECORDED`**. It runs no new
> lane: it ranks no candidate beyond File 1, accepts no candidate, selects no host, proposes no adapter, and authorizes
> no implementation. The only change on this branch is **seven** new Markdown files under `docs/`. No source, test,
> runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`,
> `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049I` — following the live Phase 48 / 49 convention. It records a **rollup**: a summary of the
six Phase 49I files, the preserved blocked state, and the selected next lane. It accepts no candidate, selects no host,
proposes no adapter, and authorizes no implementation. The immediate predecessor is **Phase 49I File 6**
([`./ADR-022E-GATE-8-CANDIDATE-ACCEPTANCE-ADAPTER-AUTHORITY-SEPARATION-GATE.md`](./ADR-022E-GATE-8-CANDIDATE-ACCEPTANCE-ADAPTER-AUTHORITY-SEPARATION-GATE.md)).

This is **File 7 of 7** in Phase 49I.

---

## 1. Rollup of Phase 49I Files 1–6

| File | Title | Result recorded | Reference |
|------|-------|-----------------|-----------|
| 1 | Concrete-candidate ranking gate | **`CONCRETE_CANDIDATE_RANKING_RECORDED`** — a docs-only decision-preparation ranking using only the allowed criteria. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md:166` |
| 2 | Concrete-candidate recommendation packet (Railway PostgreSQL) | **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — `Railway PostgreSQL` preferred for recommendation request; packet is not acceptance. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| 3 | Concrete-candidate classification register | **`CONCRETE_CANDIDATE_CLASSIFICATION_REGISTER_RECORDED`** — five candidates classified with non-final statuses. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-CLASSIFICATION-REGISTER.md:110` |
| 4 | Preferred-candidate residual blockers gate | **`PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`** — eleven residual blockers recorded as required next gates. | `docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:89` |
| 5 | Preferred-candidate sibling-owner evidence request gate | **`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`** — request shape narrowed to `Railway PostgreSQL`; no sibling PR authorized. | `docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-GATE.md:139` |
| 6 | Candidate acceptance / adapter authority separation gate | **`CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`** — six distinct later gates kept separate. | `docs/ADR-022E-GATE-8-CANDIDATE-ACCEPTANCE-ADAPTER-AUTHORITY-SEPARATION-GATE.md:108` |

> The rollup restates the six recorded results. It advances, satisfies, discharges, resolves, starts, or closes none
> of them; it runs no new lane.

### 1.1 Ranking summary (per File 1)

The File 1 decision-preparation ranking placed the five candidates as follows (the authoritative ordered list lives in
File 1 §5; this is a rank-by-rank summary):

| Rank | Candidate | File 3 status (non-final) |
|------|-----------|---------------------------|
| First | `Railway PostgreSQL` | `PREFERRED_FOR_RECOMMENDATION_REQUEST` |
| Second | `Supabase Postgres` | `HELD_FOR_RESIDUAL_GAP` |
| Third | `Neon Postgres` | `HELD_FOR_RESIDUAL_GAP` |
| Fourth | `PostgreSQL` | `NOT_PREFERRED_AT_CURRENT_GRAIN` |
| Fifth | `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` | `NOT_PREFERRED_AT_CURRENT_GRAIN` |

`Railway PostgreSQL` is the **preferred candidate for recommendation request** only — not accepted, not selected as
production database, not selected as host, and not authorized for adapter / implementation.

### 1.2 Recommendation packet summary (per File 2)

The recommendation packet for `Railway PostgreSQL` rests only on the allowed criteria and the Phase 49F / 49G evidence
posture (engine fit; deployment-provider shape; a dependency-preserving recommendation conditioned on later
sibling-owner / adapter / acceptance authority; no-leak posture). The packet is **not** acceptance.

### 1.3 Residual blockers summary (per File 4)

`Railway PostgreSQL` remains blocked by eleven required next gates: Finn gate #9 owner evidence; Dixie gate #10 owner
evidence; adapter proposal authority; implementation authority; production wiring authority; candidate acceptance
authority; gate #8 satisfaction authority; D.1(ii) resolution; D.1 satisfaction; D.2 start; MVP-2 closure. These are
required next gates, not failures of the recommendation packet.

### 1.4 Authority separation summary (per File 6)

The recommendation feeds six distinct later gates kept separate — sibling-owner evidence request / response; candidate
acceptance authority; adapter proposal authority; implementation authority; production wiring authority; gate #8
satisfaction review. Phase 49I does not collapse them; a recommendation implies none of them.

---

## 2. Preserved blocked state

This rollup preserves every held / open state unchanged:

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
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **No production database is selected**; **no production adapter is proposed**; **no implementation is authorized**.

---

## 3. Rollup decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_RECOMMENDATION_ROLLUP_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_RECOMMENDATION_ROLLUP_RECORDED`** — Phase 49I Files 1–6 recorded the ranking, the
   recommendation packet, the classification register, the residual blockers, the sibling-owner evidence request
   shape, and the authority separation; this file rolls them up (§1), preserves the blocked state (§2), and selects
   the next lane (§4). The rollup is recorded above.
2. **It is *not* a held result** — a held result would apply only if the rollup could not be recorded. The six results
   are recorded, so the rollup is recorded.
3. **It is *not* a patch-required result** — the rollup is unambiguous and bounded: it summarizes, preserves, and
   routes; it runs no new lane.

> **Rollup-recorded ≠ candidate accepted ≠ candidate finally rejected ≠ candidate eliminated ≠ host selected ≠
> production database selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_RECOMMENDATION_ROLLUP_RECORDED` is the result of *this rollup gate only*. It accepts no
> candidate, finally rejects no candidate, eliminates no candidate, selects no host, selects no production database,
> proposes no adapter, authorizes no implementation, and satisfies no gate. **Gate #8 remains OPEN / HELD.**

---

## 4. Selected next lane

> **Selected next lane: a docs-only preferred-candidate sibling-owner evidence request authorization / preparation
> gate** — gate G-1 of the File 6 authority separation, carrying the Phase 49H File 4 requirement
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md:134`) and continuing the File 5
> request-preparation shape for `Railway PostgreSQL`.

That next lane **still cannot open sibling PRs unless separately authorized**
(`docs/handoffs/cross-repo-handoff-index.md:28`), and accepts / selects / proposes / implements / wires / closes
nothing. Any follow-on PR title must carry its phase label, e.g. `Phase 49J: preferred-candidate sibling-owner
evidence request authorization / preparation` *(docs-only)*.

---

## 5. Explicit non-authorization list

Phase 49I — across all seven files — does **not** authorize any of the following. Each remains a separate later
authority that has not been requested, granted, or exercised:

- **host acceptance** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **production database selection** — none is selected;
- **adapter proposal** — the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **implementation** — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **production wiring**;
- **sibling PR authorization** (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **candidate acceptance** — the recommendation packet is not acceptance;
- **final rejection or permanent elimination** of any candidate — all five remain in consideration
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`);
- **gate #8 satisfaction** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **gate #9 / #10 satisfaction** — both remain `PARTIAL_RECORDED`
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `:161`);
- **D.1(ii) resolution** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`);
- **D.1 satisfaction** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165`);
- **D.2 start** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167`);
- **MVP-2 closure** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168`).

---

## 6. Preserved non-claims

Each item below is preserved as a **negation**. This rollup gate:

- **summarizes** Files 1–6 but **runs no new lane**;
- **does not accept** any candidate — acceptance is a separate later authority;
- **does not finally reject** any candidate — File 3 classifications are non-final;
- **does not permanently eliminate** any candidate — all five remain in consideration
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`);
- **does not clear** any residual blocker — File 4 blockers remain open;
- **does not request, supply, or claim** any sibling-owner evidence — File 5 is request preparation only;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **authorizes no sibling-repo PR** (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, implementation plan, or deployment
  plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Rolling up Files 1–6 is not accepting any
> candidate, finally rejecting any candidate, eliminating any candidate, clearing any blocker, requesting any sibling
> evidence, selecting any host, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 7. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49I (File 7 of 7) — gate #8 concrete-candidate recommendation rollup / next-lane routing gate (docs-only) |
| **Predecessor** | Phase 49I File 6 — recorded `CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`; rolls up Files 1–6 |
| **Decision result** | **`CONCRETE_CANDIDATE_RECOMMENDATION_ROLLUP_RECORDED`** — Files 1–6 summarized, blocked state preserved, next lane selected; not held (the rollup is recordable); not patch-required (the rollup is unambiguous) |
| **Files rolled up** | 1 `CONCRETE_CANDIDATE_RANKING_RECORDED`; 2 `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`; 3 `CONCRETE_CANDIDATE_CLASSIFICATION_REGISTER_RECORDED`; 4 `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`; 5 `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`; 6 `CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED` |
| **Preferred candidate** | `Railway PostgreSQL` — preferred for recommendation request only; not accepted, not selected, not authorized for adapter / implementation |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no adapter proposed; no implementation authorized |
| **Selected next lane** | docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate; cannot open sibling PRs unless separately authorized |
| **Scope of this PR** | exactly seven new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 8. Audit checklist

- [ ] **Seven-file change.** The branch adds exactly the seven Phase 49I files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §2 keeps gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved; D.1 not
      satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Rollup only.** §1 summarizes the six Phase 49I results; §1.1–§1.4 summarize ranking, packet, blockers, and
      separation; this file runs no new lane.
- [ ] **Next lane + non-authorization.** §4 selects the next lane and notes it cannot open sibling PRs unless
      separately authorized; §5 records the explicit non-authorization list.
- [ ] **Result conservative and explained.** §3 records `CONCRETE_CANDIDATE_RECOMMENDATION_ROLLUP_RECORDED`; not held,
      not patch-required.
- [ ] **No overclaim.** No candidate accepted, finally rejected, or eliminated; no host selected; no production
      database selected; no adapter proposed; no implementation authorized — each appears only inside a negation (§6).
- [ ] **No product leak.** No external URL, credential, connection string, port, account / project identifier, region,
      topology, endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 9. Source references

- [Phase 49I File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md) — `CONCRETE_CANDIDATE_RANKING_RECORDED`
  (`:166`).
- [Phase 49I File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md) —
  `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED` (`:137`).
- [Phase 49I File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-CLASSIFICATION-REGISTER.md) —
  `CONCRETE_CANDIDATE_CLASSIFICATION_REGISTER_RECORDED` (`:110`).
- [Phase 49I File 4](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md) —
  `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED` (`:89`).
- [Phase 49I File 5](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-GATE.md) —
  `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED` (`:139`).
- [Phase 49I File 6](./ADR-022E-GATE-8-CANDIDATE-ACCEPTANCE-ADAPTER-AUTHORITY-SEPARATION-GATE.md) —
  `CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED` (`:108`). **Entry baseline / predecessor.**
- [Phase 49H File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md) — the
  sibling-owner evidence requirement (`:134`).
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — the five candidates "shortlisted
  (held)" (`:189`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows (`:159`,
  `:161`, `:163`, `:165`, `:167`, `:168`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49I File 7. Docs-only gate #8 concrete-candidate recommendation rollup / next-lane routing gate. It
records `CONCRETE_CANDIDATE_RECOMMENDATION_ROLLUP_RECORDED`: a rollup of Phase 49I Files 1–6 —
`CONCRETE_CANDIDATE_RANKING_RECORDED`, `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`,
`CONCRETE_CANDIDATE_CLASSIFICATION_REGISTER_RECORDED`, `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`,
`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`, and
`CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`. `Railway PostgreSQL` is the preferred candidate for
recommendation request only. The blocked state is preserved: gate #8 OPEN / HELD; gates #9 / #10 PARTIAL_RECORDED;
D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host selected; no production database selected;
no adapter proposed; no implementation authorized. The selected next lane is a docs-only preferred-candidate
sibling-owner evidence request authorization / preparation gate, which still cannot open sibling PRs unless separately
authorized. This file accepts no candidate, finally rejects no candidate, eliminates no candidate, selects no host,
proposes no adapter, and authorizes no implementation. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
