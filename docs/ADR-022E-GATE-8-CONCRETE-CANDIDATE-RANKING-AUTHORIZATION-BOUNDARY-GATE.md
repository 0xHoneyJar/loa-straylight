# Phase 49H — ADR-022E Gate #8 Concrete-Candidate Ranking Authorization Boundary Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49H (File 2 of 6)** — docs-only **ranking authorization boundary** gate for the canonical-store
> concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / boundary-record only.** Phase 49H File 1 recorded
> **`CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md:85`), whose DAQ-1 / DAQ-2
> answers grant a **later** docs-only gate the authority to rank the five candidates, under bounded criteria. This
> file **records that ranking authorization boundary** — the allowed ranking criteria and the forbidden ranking
> inputs — and records **`CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED`**. It **records the boundary;
> it does not rank.** It ranks **no** candidate, classifies **no** candidate, identifies **no** preferred candidate,
> accepts **no** candidate, selects **no** concrete physical host, selects **no** production database, proposes **no**
> production adapter, and authorizes **no** implementation. The only change on this branch is **six** new Markdown
> files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config,
> CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049H` — following the live Phase 48 / 49 convention. It records a bounded **ranking
authorization boundary**: it states that ranking is permitted **only** in a later docs-only gate, which criteria that
later gate may rank by, and which inputs it may not. It does **not** itself rank, order, or compare the candidates.
The immediate predecessor is **Phase 49H File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md)).

This is **File 2 of 6** in Phase 49H.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49H File 1 — decision-authority response intake** | Recorded **`CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL`** — DAQ-1 grants later docs-only ranking; DAQ-2 fixes allowed ranking criteria. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md:203` |
| **Phase 49G File 2 — residual-gap matrix** | Recorded **`CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`** — five candidates × `P-1 … P-11`, residual-gap labels only; the evidence basis ranking criteria may draw on. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165` |
| **Phase 49F File 7 — packet rollup** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`** — identical `PARTIAL` results so no ordering can be read in. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md:113` |
| **Phase 49E File 6 — evidence-to-decision separation** | Recorded **`EVIDENCE_TO_DECISION_SEPARATION_RECORDED`** — ranking is a separate later gate. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. This gate records a ranking authorization boundary; it ranks nothing.

---

## 2. Ranking is allowed only in a later docs-only gate

Per Phase 49H File 1 DAQ-1
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md:85`), a later docs-only gate may
rank the five candidates — **but only as docs-only decision-preparation ranking**, comparing candidates for
**recommendation readiness**. That ranking **does not** accept a host, select a production database, satisfy gate #8,
resolve D.1(ii), or close MVP-2. The five candidates are, as named in Phase 49D File 1
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`):

1. `PostgreSQL`;
2. `Railway PostgreSQL`;
3. `Supabase Postgres`;
4. `Neon Postgres`;
5. `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`.

> **Authorization ≠ exercise.** Recording that a later gate may rank these candidates is not ranking them. This file
> does not order, compare, or score any candidate.

---

## 3. Allowed ranking criteria (from DAQ-2)

A later docs-only ranking gate may rank **only** by Phase 49F / Phase 49G evidence and residual-gap posture
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165`). The allowed criteria are exactly:

1. `P-1` … `P-11` coverage posture (the residual-gap matrix rows);
2. completeness at public-doc / engine / repo-local architecture grain;
3. residual gaps requiring sibling-owner evidence;
4. residual gaps requiring adapter-proposal authority;
5. residual gaps requiring implementation authority;
6. future infrastructure authority gaps;
7. no-leak / public-private projection posture;
8. Straylight-owned canonical-store boundary fit;
9. operational recovery evidence posture;
10. audit / receipt persistence evidence posture;
11. migration / schema ownership evidence posture;
12. tenant / actor / estate isolation evidence posture.

Criteria 1, 7, 9, 10, 11, and 12 map directly onto the recorded `P-1 … P-11` rows of the residual-gap matrix
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165`); criteria 3, 4, 5, and 6 map onto the
residual-gap labels already recorded there. No criterion introduces evidence outside Phase 49F / Phase 49G.

> The allowed-criteria list bounds what a *later* gate may rank by. Listing a criterion is not applying it: this file
> applies none.

---

## 4. Forbidden ranking inputs (from DAQ-2)

A later docs-only ranking gate **must not** rank by any of the following. None may be introduced, gathered, or relied
on at any ranking grain:

- **price** — no pricing figure, tier, or cost comparison;
- **convenience** — no "easier to set up" or operator-comfort input;
- **account availability** — no "we already have an account" input;
- **private deployment state** — no existing or planned private deployment;
- **hidden infrastructure** — no infrastructure not evidenced in Phase 49F / 49G public docs;
- **credentials** — no credential, secret, API key, token, or private key;
- **connection strings** — no database URL or connection string;
- **endpoints** — no host URL, port, or network endpoint;
- **private dashboards** — no provider console / dashboard state;
- **implementation shortcuts** — no "fastest to wire in" input;
- **unstated preference** — no preference not grounded in the §3 allowed criteria;
- **implementation ease not evidenced in Phase 49F / 49G** — no ease claim absent from the recorded evidence.

This forbidden-input list is consistent with the no-leak enumerated forbidden-surface list
(`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`): the same surfaces that may not
appear in a candidate evidence packet may not be used as a ranking input.

> Forbidden inputs are forbidden for the *later* ranking gate as much as for this one. This file uses none of them,
> and authorizes none of them for any later gate.

---

## 5. This file records the boundary; it does not rank

To be unambiguous: this file **records** the ranking authorization boundary and **does not rank**. It states that
ranking is permitted only in a later docs-only gate (§2), which criteria that gate may rank by (§3), and which inputs
it may not (§4). It does not order, compare, score, or weight any candidate; it identifies no preferred candidate; it
classifies no candidate. The ranking itself — whatever order it produces — belongs to a *later, separate* docs-only
ranking / recommendation-preparation gate.

---

## 6. Boundary decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED`** — Phase 49H File 1 DAQ-1 / DAQ-2 grant a
   later docs-only ranking gate bounded authority; this file records that boundary: ranking is later-gate only (§2),
   the allowed criteria are the twelve in §3, and the forbidden inputs are the twelve in §4. The boundary is recorded
   above.
2. **It is *not* a held result** — a held result would apply only if the boundary could not be stated (for example,
   if the DAQ-2 criteria were missing). They are recorded and statable, so the boundary is recorded, not held.
3. **It is *not* a patch-required result** — the boundary is unambiguous and bounded: it permits ranking only later,
   names the allowed criteria, and names the forbidden inputs.

> **Boundary-recorded ≠ candidate ranked ≠ candidate classified ≠ preferred candidate identified ≠ candidate accepted
> ≠ host selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED` is the result of *this boundary gate only*. It ranks no
> candidate, classifies no candidate, identifies no preferred candidate, accepts no candidate, selects no host,
> proposes no adapter, satisfies no gate, and authorizes no implementation. **Gate #8 remains OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: a docs-only concrete-candidate ranking / recommendation-preparation gate.** That later lane
> may rank the five candidates using **only** the §3 allowed criteria, never the §4 forbidden inputs, and only as
> decision-preparation ranking for recommendation readiness.

That selected next lane:

- **may rank** candidates using only the §3 allowed criteria, for recommendation readiness only;
- **must not** rank by any §4 forbidden input;
- **must not** accept a host, select a production database, propose an adapter, authorize implementation, authorize
  production wiring, authorize a sibling PR, claim gate #8 satisfaction, resolve D.1(ii), satisfy D.1, start D.2, or
  close MVP-2.

Any follow-on PR title must carry its phase label, e.g. `Phase 49I: concrete-candidate ranking /
recommendation-preparation` *(docs-only)*.

---

## 8. Preserved blocked state

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

## 9. Preserved non-claims

Each item below is preserved as a **negation**. This ranking authorization boundary gate:

- **records** the ranking authorization boundary but **does not rank** any candidate;
- **does not order, compare, score, or weight** any candidate;
- **does not classify** any candidate — classification is a later-gate vocabulary (File 3);
- **does not identify** a preferred candidate;
- **does not use** any §4 forbidden input, and authorizes none for any later gate;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **does not reject** any candidate as a final decision;
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

> Every notion above appears in this document only inside a negation. Recording a ranking authorization boundary is
> not ranking any candidate, classifying any candidate, identifying a preferred candidate, accepting any candidate,
> selecting any host, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49H (File 2 of 6) — gate #8 concrete-candidate ranking authorization boundary gate (docs-only) |
| **Predecessor** | Phase 49H File 1 — recorded `CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL` (DAQ-1 / DAQ-2) |
| **Decision result** | **`CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED`** — ranking allowed only in a later docs-only gate; allowed criteria and forbidden inputs recorded; not held (the boundary is statable); not patch-required (the boundary is unambiguous) |
| **Ranking allowed** | only in a later docs-only gate; as decision-preparation ranking for recommendation readiness only |
| **Allowed criteria** | twelve, all drawn from Phase 49F / 49G evidence and residual-gap posture (§3) |
| **Forbidden inputs** | price; convenience; account availability; private deployment state; hidden infrastructure; credentials; connection strings; endpoints; private dashboards; implementation shortcuts; unstated preference; implementation ease not evidenced in Phase 49F / 49G (§4) |
| **This file does not rank** | no ordering, comparison, score, weight, classification, or preferred candidate is produced |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked, classified, accepted, or preferred; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate ranking / recommendation-preparation gate; may rank by allowed criteria only; ranks / selects / proposes / implements nothing else |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49H files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Boundary recorded, not ranked.** §2 / §3 / §4 record where ranking is allowed, the allowed criteria, and the
      forbidden inputs; §5 confirms this file ranks nothing.
- [ ] **Forbidden inputs explicit.** §4 enumerates the twelve forbidden ranking inputs.
- [ ] **Result conservative and explained.** §6 records `CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED`;
      not held, not patch-required.
- [ ] **No overclaim.** No candidate ranked, classified, or preferred; no host selected; no adapter proposed; no
      implementation authorized — each appears only inside a negation (§9).
- [ ] **No product leak.** No credential, connection string, port, account / project identifier, region, topology,
      endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49H File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL` (`:203`); DAQ-1 / DAQ-2. **Entry baseline / predecessor.**
- [Phase 49G File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md) — recorded
  `CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED` (`:165`); the `P-1 … P-11` evidence basis.
- [Phase 49F File 7](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md) — identical `PARTIAL`
  results encode no ordering (`:113`).
- [Phase 49E File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md) — recorded
  `EVIDENCE_TO_DECISION_SEPARATION_RECORDED` (`:111`).
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — the five candidates "shortlisted
  (held)" (`:189`).
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

*End of Phase 49H File 2. Docs-only gate #8 concrete-candidate ranking authorization boundary gate. It records
`CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED`: ranking the five candidates is permitted only in a later
docs-only gate, as decision-preparation ranking for recommendation readiness. The allowed ranking criteria are the
twelve drawn from Phase 49F / 49G evidence and residual-gap posture (`P-1 … P-11` coverage; completeness at public-doc
/ engine / repo-local grain; sibling-owner / adapter-proposal / implementation / future-infrastructure residual gaps;
no-leak posture; Straylight-owned canonical-store boundary fit; operational recovery; audit / receipt persistence;
migration / schema ownership; tenant / actor / estate isolation). The forbidden ranking inputs are price, convenience,
account availability, private deployment state, hidden infrastructure, credentials, connection strings, endpoints,
private dashboards, implementation shortcuts, unstated preference, and implementation ease not evidenced in Phase 49F
/ 49G. This file does not rank, order, compare, score, classify, or prefer any candidate; it accepts nothing, selects
no host, proposes no adapter, and authorizes no implementation. The selected next lane is a docs-only ranking /
recommendation-preparation gate. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
