# Phase 49G — ADR-022E Gate #8 Concrete-Candidate Residual-Gap Matrix

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49G (File 2 of 6)** — docs-only **residual-gap matrix** for the canonical-store
> concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / residual-gap matrix only.** Phase 49G File 1 recorded
> **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_AUDIT_RECORDED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-AUDIT-GATE.md:209`). This file enumerates, per candidate
> and per P-row, the **residual gap** that remains between the recorded Phase 49F evidence and any future acceptance,
> and records **`CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`**. It **describes gaps; it makes no decision.** It
> ranks **no** candidate, accepts **no** candidate, rejects **no** candidate as a final decision, selects **no**
> concrete physical host, selects **no** production database, proposes **no** production adapter, and authorizes
> **no** implementation. The only change on this branch is **six** new Markdown files under `docs/`. No source, test,
> runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`,
> `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049G` — following the live Phase 48 / 49 convention. It records a bounded **residual-gap
matrix**: the five Phase 49D candidates against `P-1 … P-11`, each cell carrying **residual-gap labels only** — never
an evidence-pass label, a score, or a rank. The immediate predecessor is **Phase 49G File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-AUDIT-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-AUDIT-GATE.md)),
which recorded `CONCRETE_CANDIDATE_EVIDENCE_PACKET_AUDIT_RECORDED`.

This is **File 2 of 6** in Phase 49G.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49G File 1 — evidence packet audit** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_AUDIT_RECORDED`** — all five packets partial; eight URLs / nine labels; no-leak boundary intact; sufficient for audit / decision-prep only. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-AUDIT-GATE.md:209` |
| **Phase 49F File 7 — packet rollup** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`** — the per-candidate `P-1 … P-11` status grid. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md:113`; per-row grid `:60` |
| **`P-1 … P-11` decomposition** | Defined in Phase 48P. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142` |
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — the five candidates and their categories. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only.

---

## 2. Residual-gap label set (the only labels used in the matrix)

The matrix uses **exclusively** the following residual-gap labels. **No evidence-pass label** (no "supported",
"passed", "satisfied", "accepted", "selected", "preferred", "winner", "best", or "ranked") appears in any cell. Each
label names *what is still missing* between the recorded evidence and any future acceptance — never what is achieved:

- **`ENGINE_ONLY_GAP`** — the evidence reaches only PostgreSQL *engine* grain (feature presence), which cannot, by
  itself, reach a hosted-deployment, provider, or operations fact.
- **`PUBLIC_DOC_GAP`** — the evidence reaches only provider *public-documentation* grain (capability description),
  which cannot, by itself, reach a Straylight-design fact.
- **`SIBLING_OWNER_EVIDENCE_GAP`** — the row requires Finn / Dixie owner evidence that is not required before
  gathering but **is** required before acceptance, and is not yet supplied
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md:89`).
- **`ADAPTER_AUTHORITY_GAP`** — the row's discharge depends on a proposed production adapter (the `M5` shape), which
  is a separate, later, unauthorized lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
- **`IMPLEMENTATION_AUTHORITY_GAP`** — the row's discharge depends on implementation, which is unauthorized; the
  `StorageAdapter` swap-in seam is unchanged (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).
- **`FUTURE_INFRASTRUCTURE_AUTHORITY_GAP`** — the row depends on future Straylight-controlled infrastructure that has
  not been authorized, named, or invented (self-hosted candidate only;
  `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md:128`).
- **`NO_DECISION_GAP_AT_CURRENT_GRAIN`** — the recorded evidence describes the row at its current grain, and the
  residual gap is simply that **no decision may be made at the current grain** — identity / no-leak / evidence-shape
  rows fall here. The gap is the absence of a *decision*, not of evidence.

> **Residual-gap labels are not pass labels.** A cell carrying `NO_DECISION_GAP_AT_CURRENT_GRAIN` is **not** a
> "pass": it records that even where evidence exists at the current grain, the residual gap is the missing decision
> authority. Every cell names a gap; no cell names an achievement, a score, or a rank.

---

## 3. Residual-gap matrix (five candidates × `P-1 … P-11`)

Columns are listed in Phase 49D shortlist order (C-1 … C-5), **not** a preference order. Each cell lists the residual
gap(s) for that candidate × P-row, derived from the Phase 49F per-row status
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md:60`) and the per-candidate evidence grain. A
`+` separates compound gaps. **No cell carries a pass label; no row or column is ordered by preference.**

| P-row | C-1 `PostgreSQL` (engine grain) | C-2 `Railway PostgreSQL` (public-doc grain) | C-3 `Supabase Postgres` (public-doc grain) | C-4 `Neon Postgres` (public-doc grain) | C-5 self-hosted (engine grain + future infra) |
|-------|----------------------------------|----------------------------------------------|---------------------------------------------|-----------------------------------------|------------------------------------------------|
| **P-1** identity / ownership | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` |
| **P-2** durability | `ENGINE_ONLY_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `ENGINE_ONLY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` |
| **P-3** tenant / actor / estate isolation | `ENGINE_ONLY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `ENGINE_ONLY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` |
| **P-4** migration / schema ownership | `ENGINE_ONLY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `ENGINE_ONLY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` |
| **P-5** runtime writer boundary | `ENGINE_ONLY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `ENGINE_ONLY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` |
| **P-6** read / recall boundary | `ENGINE_ONLY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `ENGINE_ONLY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` |
| **P-7** audit / receipt persistence | `ENGINE_ONLY_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `ENGINE_ONLY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` |
| **P-8** failure / rollback / recovery | `ENGINE_ONLY_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `PUBLIC_DOC_GAP` + `IMPLEMENTATION_AUTHORITY_GAP` | `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` (deployment recovery not evidenced) + `IMPLEMENTATION_AUTHORITY_GAP` |
| **P-9** permission / auth / signer authority | `ENGINE_ONLY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `PUBLIC_DOC_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` | `ENGINE_ONLY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` + `SIBLING_OWNER_EVIDENCE_GAP` |
| **P-10** no-leak / public-private projection | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` | `NO_DECISION_GAP_AT_CURRENT_GRAIN` |
| **P-11** test / evidence shape | `ADAPTER_AUTHORITY_GAP` | `ADAPTER_AUTHORITY_GAP` | `ADAPTER_AUTHORITY_GAP` | `ADAPTER_AUTHORITY_GAP` | `ADAPTER_AUTHORITY_GAP` + `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP` |

> **The matrix is a gap inventory, not a comparison.** It lists each candidate's residual gaps per P-row **for gap
> visibility only**. It does **not** rank the candidates, score them, order them by preference, count gaps to declare
> a leader, or imply any candidate is better, worse, closer, or more selectable. Cells differ only because the
> recorded evidence grain differs (engine vs public-doc vs future-infrastructure) — a difference of *kind of gap*,
> never of *quality of candidate*.

---

## 4. Per-candidate residual-gap reading (no ranking)

Each reading below restates that candidate's column as a gap description. No reading compares one candidate to
another, and none implies an order.

### 4.1 `PostgreSQL` (C-1) — engine-only gap for deployment / provider / ops rows

`PostgreSQL` is a database **engine**, not a deployment
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-POSTGRESQL-EVIDENCE-PACKET.md:111`). Its evidence reaches engine grain only,
so every deployment / provider / operations row carries an **`ENGINE_ONLY_GAP`**: durability (P-2), isolation (P-3),
schema ownership (P-4), writer boundary (P-5), recall boundary (P-6), audit persistence (P-7), recovery (P-8), and
signer authority (P-9) cannot be reached from engine documentation alone. Those rows additionally carry the
authority gap recorded in Phase 49F — `SIBLING_OWNER_EVIDENCE_GAP` (P-3/P-4/P-5/P-6/P-9) or
`IMPLEMENTATION_AUTHORITY_GAP` (P-2/P-7/P-8). Identity (P-1) and no-leak (P-10) carry only
`NO_DECISION_GAP_AT_CURRENT_GRAIN`; evidence-shape (P-11) carries `ADAPTER_AUTHORITY_GAP`.

### 4.2 `Railway PostgreSQL` (C-2) — public-doc grain gap, plus sibling-owner / adapter / implementation boundaries

`Railway PostgreSQL` evidence reaches provider **public-documentation** grain only
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RAILWAY-POSTGRESQL-EVIDENCE-PACKET.md:111`). Every Straylight-design row
carries a **`PUBLIC_DOC_GAP`**, and still needs the sibling-owner / adapter / implementation boundaries closed before
acceptance: `SIBLING_OWNER_EVIDENCE_GAP` (P-3/P-4/P-5/P-6/P-9), `IMPLEMENTATION_AUTHORITY_GAP` (P-2/P-7/P-8), and
`ADAPTER_AUTHORITY_GAP` (P-11). Identity (P-1) and no-leak (P-10) carry only `NO_DECISION_GAP_AT_CURRENT_GRAIN`.

### 4.3 `Supabase Postgres` (C-3) — public-doc grain gap, plus sibling-owner / adapter / implementation boundaries

`Supabase Postgres` evidence reaches provider **public-documentation** grain only
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SUPABASE-POSTGRES-EVIDENCE-PACKET.md:111`). Every Straylight-design row
carries a **`PUBLIC_DOC_GAP`**, and still needs the sibling-owner / adapter / implementation boundaries closed before
acceptance, exactly as the matrix records. The backup-scope boundary it documents informs P-7 / P-10 descriptively
but does not discharge them. Identity (P-1) and no-leak (P-10) carry only `NO_DECISION_GAP_AT_CURRENT_GRAIN`.

### 4.4 `Neon Postgres` (C-4) — public-doc grain gap, plus sibling-owner / adapter / implementation boundaries

`Neon Postgres` evidence reaches provider **public-documentation** grain only
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-NEON-POSTGRES-EVIDENCE-PACKET.md:110`). Every Straylight-design row carries
a **`PUBLIC_DOC_GAP`**, and still needs the sibling-owner / adapter / implementation boundaries closed before
acceptance. Branching informs P-6 / P-7 only as a development / audit *workflow*, not as the Straylight boundary, so
those rows keep their `SIBLING_OWNER_EVIDENCE_GAP` / `IMPLEMENTATION_AUTHORITY_GAP`. Identity (P-1) and no-leak (P-10)
carry only `NO_DECISION_GAP_AT_CURRENT_GRAIN`.

### 4.5 `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` (C-5) — future-infrastructure authority gaps plus engine-only evidence

The self-hosted candidate inherits **engine-only** evidence (via `PG-SOURCE-1`) and has **no** deployment source,
because no future Straylight infrastructure has been authorized
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md:117`). Every deployment /
operations row therefore carries a **`FUTURE_INFRASTRUCTURE_AUTHORITY_GAP`** stacked on the `ENGINE_ONLY_GAP` and the
Phase 49F authority gap, and the deployment-recovery row (P-8) is explicitly not evidenced
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md:112`), recorded here as
`FUTURE_INFRASTRUCTURE_AUTHORITY_GAP`. Identity (P-1) adds the future-infrastructure gap to the
current-grain decision gap; no-leak (P-10) carries only `NO_DECISION_GAP_AT_CURRENT_GRAIN`; evidence-shape (P-11)
carries `ADAPTER_AUTHORITY_GAP` plus the future-infrastructure gap.

> **No candidate's gap profile is "smaller" or "better."** The differences above are differences of *gap kind* driven
> by evidence grain, not a ranking. The matrix deliberately records them so that **no** ordering can be read into it.

---

## 5. Matrix decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`** — the matrix (§3) and the per-candidate readings (§4)
   are each derived from the recorded Phase 49F per-row status and the per-candidate grain, using residual-gap labels
   only. The matrix is real and recordable, so it is recorded.
2. **It is *not* a held result** — a held result would apply only if the per-row status could not be mapped to a
   residual gap. Every row maps, so the matrix is recorded, not held.
3. **It is *not* a patch-required result** — a patch result would apply if the mapping were ambiguous or impossible
   to record without amendment. The mapping is unambiguous: each cell's residual-gap label(s) follow directly from
   the Phase 49F status and grain.

> **Matrix recorded ≠ candidate ranked ≠ candidate accepted ≠ candidate rejected ≠ host selected ≠ adapter proposed ≠
> implementation authorized ≠ gate #8 satisfaction.** Recording `CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED` is
> the result of *this matrix gate only*. **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: the Phase 49G decision-readiness gate (File 3).** It reads this matrix and records that the
> candidate set is **not decision-ready** at acceptance grain — without ranking, accepting, or rejecting any
> candidate.

Any follow-on PR title must carry its phase label, e.g. `Phase 49G: concrete-candidate residual-gap matrix`
*(docs-only)*.

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

Each item below is preserved as a **negation**. This residual-gap matrix gate:

- **does not rank** any candidate — the matrix encodes no ordering, no score, and no leader;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **does not reject** any candidate as a final decision — a residual gap is not a rejection;
- **uses no pass label** — every cell names a gap, never an achievement;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later separate request, the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` swap-in seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **authorizes no sibling-repo PR** — no sibling-repo PR may merge without teammate review
  (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, implementation plan, or deployment
  plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Recording a residual-gap matrix is not ranking
> any candidate, accepting any candidate, rejecting any candidate, selecting any host, selecting any production
> database, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49G (File 2 of 6) — gate #8 concrete-candidate residual-gap matrix (docs-only) |
| **Predecessor** | Phase 49G File 1 — recorded `CONCRETE_CANDIDATE_EVIDENCE_PACKET_AUDIT_RECORDED` |
| **Decision result** | **`CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`** — the five-candidate × `P-1 … P-11` residual-gap matrix is recorded with residual-gap labels only; not held (every row maps to a gap), not patch-required (the mapping is unambiguous) |
| **Label set** | `ENGINE_ONLY_GAP`; `PUBLIC_DOC_GAP`; `SIBLING_OWNER_EVIDENCE_GAP`; `ADAPTER_AUTHORITY_GAP`; `IMPLEMENTATION_AUTHORITY_GAP`; `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP`; `NO_DECISION_GAP_AT_CURRENT_GRAIN` |
| **C-1 `PostgreSQL`** | engine-only gap for deployment / provider / ops rows, plus sibling-owner / implementation / adapter authority gaps |
| **C-2 `Railway PostgreSQL`** | public-doc grain gap, plus sibling-owner / adapter / implementation boundaries before acceptance |
| **C-3 `Supabase Postgres`** | public-doc grain gap, plus sibling-owner / adapter / implementation boundaries before acceptance |
| **C-4 `Neon Postgres`** | public-doc grain gap, plus sibling-owner / adapter / implementation boundaries before acceptance |
| **C-5 self-hosted** | future-infrastructure authority gaps plus engine-only evidence; deployment recovery not evidenced |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked, accepted, or rejected; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | the Phase 49G decision-readiness gate (File 3) |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49G files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Residual-gap labels only.** §2 / §3 use only the seven residual-gap labels; no cell carries a pass /
      satisfied / accepted / selected / preferred / winner / best / ranked label.
- [ ] **No ranking.** §3 / §4 are a gap inventory in shortlist order with explicit no-ranking notes; no score, no
      order, no leader.
- [ ] **Grain gaps visible.** PostgreSQL engine-only gap; Railway / Supabase / Neon public-doc grain gap;
      self-hosted future-infrastructure authority gap — each is recorded.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`; not held,
      not patch-required.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, host selection, a ranked / accepted / rejected
      candidate, a proposed production adapter, or implementation — each appears only inside a negation (§8).
- [ ] **No product leak.** No credential, connection string, port, account / project identifier, region, topology,
      endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49G File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-AUDIT-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_PACKET_AUDIT_RECORDED` (`:209`). **Entry baseline / predecessor.**
- [Phase 49F File 7](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md) — the per-candidate
  `P-1 … P-11` status grid (`:60`); recorded `CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED` (`:113`);
  self-hosted P-8 not evidenced (`:69`).
- [Phase 49F File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-POSTGRESQL-EVIDENCE-PACKET.md) — engine-only reading
  (`:111`).
- [Phase 49F File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RAILWAY-POSTGRESQL-EVIDENCE-PACKET.md) — public-doc reading
  (`:111`).
- [Phase 49F File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SUPABASE-POSTGRES-EVIDENCE-PACKET.md) — public-doc reading
  (`:111`).
- [Phase 49F File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NEON-POSTGRES-EVIDENCE-PACKET.md) — public-doc reading
  (`:110`).
- [Phase 49F File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md) — engine-
  inheritance reading (`:117`); deployment recovery not evidenced (`:112`); PARTIAL (`:128`).
- [Phase 49E File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md) — recorded
  `SIBLING_OWNER_EVIDENCE_TIMING_RECORDED` (`:89`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — `P-1 … P-11` (`:142`).
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — the five candidates (`:123`–`:127`);
  recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49G File 2. Docs-only gate #8 concrete-candidate residual-gap matrix. It records
`CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`: a five-candidate × `P-1 … P-11` matrix using residual-gap labels
only (`ENGINE_ONLY_GAP`, `PUBLIC_DOC_GAP`, `SIBLING_OWNER_EVIDENCE_GAP`, `ADAPTER_AUTHORITY_GAP`,
`IMPLEMENTATION_AUTHORITY_GAP`, `FUTURE_INFRASTRUCTURE_AUTHORITY_GAP`, `NO_DECISION_GAP_AT_CURRENT_GRAIN`). It makes
visible that `PostgreSQL` has an engine-only gap for deployment / provider / ops rows; that `Railway PostgreSQL`,
`Supabase Postgres`, and `Neon Postgres` have public-doc grain gaps and still need sibling-owner / adapter /
implementation boundaries before acceptance; and that the self-hosted candidate has future-infrastructure authority
gaps plus engine-only evidence. It uses no pass label, ranks no candidate, accepts no candidate, rejects no candidate
as a final decision, selects no host, selects no production database, proposes no production adapter, and authorizes
no implementation. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
