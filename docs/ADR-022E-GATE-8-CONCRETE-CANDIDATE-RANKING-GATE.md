# Phase 49I — ADR-022E Gate #8 Concrete-Candidate Ranking Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49I (File 1 of 7)** — docs-only **concrete-candidate ranking** gate for the canonical-store
> concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / decision-preparation ranking only.** Phase 49H File 5 recorded
> **`CONCRETE_CANDIDATE_RECOMMENDATION_LANE_AUTHORIZED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md:115`), authorizing exactly this
> later docs-only ranking / recommendation-preparation lane, bounded by the Phase 49H File 2 ranking authorization
> boundary (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md:132`). This file **runs the
> ranking step of that lane**: it records a **docs-only decision-preparation ranking** of the five candidates using
> **only** the allowed criteria, and records **`CONCRETE_CANDIDATE_RANKING_RECORDED`**. The ranking is **not**
> acceptance, **not** final rejection, **not** host selection, **not** production-database selection, **not** adapter
> proposal, **not** implementation, **not** production wiring, and **not** gate #8 satisfaction. The only change on
> this branch is **seven** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration,
> auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo
> path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049I` — following the live Phase 48 / 49 convention. It records a **docs-only
decision-preparation ranking**: an ordering of the five candidates for recommendation readiness, drawn only from the
allowed criteria. It accepts no candidate, rejects no candidate, selects no host, selects no production database,
proposes no adapter, and authorizes no implementation. The immediate predecessor is **Phase 49H File 5**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md)).

This is **File 1 of 7** in Phase 49I.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49H File 5 — recommendation-lane authorization** | Recorded **`CONCRETE_CANDIDATE_RECOMMENDATION_LANE_AUTHORIZED`** — authorizes this later docs-only ranking / recommendation-preparation lane; permits ranking by allowed criteria, classification, preferred-candidate identification, recommendation-packet preparation, and routing. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md:115` |
| **Phase 49H File 2 — ranking authorization boundary** | Recorded **`CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED`** — the allowed ranking criteria and the forbidden ranking inputs. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md:132` |
| **Phase 49G File 2 — residual-gap matrix** | Recorded **`CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`** — five candidates × `P-1 … P-11`, residual-gap labels only; the evidence basis this ranking draws on. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165` |
| **Phase 49F File 7 — packet rollup** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`** — five `PARTIAL` candidate evidence packets; the per-candidate evidence basis. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md:113` |
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — the five candidates, all "shortlisted (held)". | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. This gate records a decision-preparation ranking; it accepts, rejects, selects, proposes, and
> implements nothing.

---

## 2. What this ranking is — and is not

This file records a **docs-only decision-preparation ranking**: an ordering of the five candidates by recommendation
readiness at the current evidence grain, per the lane authorized in Phase 49H File 5
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md:115`) and bounded by Phase 49H
File 2 (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md:132`). It is exactly that and
nothing more:

- it **is** a docs-only decision-preparation ordering for recommendation readiness;
- it **is not** acceptance of any candidate;
- it **is not** final rejection of any candidate;
- it **is not** host selection;
- it **is not** production-database selection;
- it **is not** adapter proposal;
- it **is not** implementation;
- it **is not** production wiring;
- it **is not** gate #8 satisfaction.

> **Ranked ≠ accepted ≠ selected ≠ proposed ≠ implemented ≠ satisfied.** A position in this ordering is a
> decision-preparation reading only. The ranking removes no candidate from consideration and admits no candidate to
> any later authority.

---

## 3. Ranking criteria used (allowed only)

This ranking draws **only** on the twelve allowed criteria recorded in Phase 49H File 2 §3
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md:132`), each grounded in the Phase 49F
/ Phase 49G evidence and residual-gap posture
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165`):

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

No criterion outside this list was used.

---

## 4. Ranking inputs NOT used (forbidden)

Per Phase 49H File 2 §4
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md:132`), none of the following was
introduced, gathered, or relied on at any ranking grain — consistent with the no-leak enumerated forbidden-surface
list (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`):

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

---

## 5. The recorded ranking

The five candidates, as named in Phase 49D File 1
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`), are placed in the following
**decision-preparation ranking order** for recommendation readiness, using only the §3 criteria:

1. `Railway PostgreSQL`
2. `Supabase Postgres`
3. `Neon Postgres`
4. `PostgreSQL`
5. `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`

The first-ranked candidate, `Railway PostgreSQL`, is the **preferred candidate for recommendation request** only;
it is not accepted, not selected as production database, not selected as host, and not authorized for
adapter / implementation. The recommendation packet is prepared separately in File 2.

### 5.1 Ranking rationale (per position)

| Rank | Candidate | Rationale (allowed criteria only) |
|------|-----------|-----------------------------------|
| 1 | `Railway PostgreSQL` | Ranks first because, at the current evidence grain, it combines PostgreSQL engine fit (criteria 1, 8) with a managed deployment-provider candidate shape addressing the deployment / operational-ownership grain (criteria 2, 9), while keeping the recommendation **dependent** on later sibling-owner evidence (criterion 3), adapter-proposal authority (criterion 4), and candidate acceptance authority. It is the preferred candidate for recommendation request only. |
| 2 | `Supabase Postgres` | Ranks second because it is a viable managed Postgres candidate (criteria 1, 8), but carries stronger platform-boundary coupling / product-surface residuals (criteria 2, 7, 12) to resolve before recommendation. |
| 3 | `Neon Postgres` | Ranks third because it is a viable managed / serverless Postgres candidate (criteria 1, 8), but has serverless / branching / recovery semantics (criteria 9, 11) that need deeper candidate-specific boundary evidence before recommendation. |
| 4 | `PostgreSQL` | Ranks fourth because it is an **engine-only** candidate (criterion 1) that cannot itself provide the deployment-provider / operational-ownership posture (criteria 2, 9) without a paired provider. |
| 5 | `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` | Ranks fifth because the **future infrastructure authority** / operational-ownership / topology / recovery authority is absent at the current grain (criteria 6, 9) — the candidate cannot be evidenced at the deployment grain today. |

> The rationale cites only the §3 allowed criteria and the Phase 49F / 49G evidence posture. No §4 forbidden input
> appears. A rank reflects recommendation readiness at the current grain only; it does not accept, reject, select,
> propose, or implement.

---

## 6. This file ranks only; it does not decide

To be unambiguous: this file records a **decision-preparation ranking** and **decides nothing further**. The ranking
order (§5) and rationale (§5.1) are a reading of recommendation readiness at the current grain. They accept no
candidate, reject no candidate, eliminate no candidate, select no host, select no production database, propose no
adapter, authorize no implementation, authorize no production wiring, and satisfy no gate. Preparing the
recommendation packet for `Railway PostgreSQL` (File 2), classifying all five candidates (File 3), recording its
residual blockers (File 4), and preparing its sibling-owner evidence request (File 5) are the remaining
Phase 49I steps; acceptance, selection, proposal, implementation, and gate satisfaction each remain separate **later**
authorities (File 6).

---

## 7. Ranking decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_RANKING_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_RANKING_RECORDED`** — Phase 49H File 5 authorized this ranking lane and Phase 49H
   File 2 bounded it; this file records the decision-preparation ranking order (§5) and its rationale (§5.1), using
   only the §3 allowed criteria and none of the §4 forbidden inputs. The ranking is recorded above.
2. **It is *not* a held result** — a held result would apply only if the ranking could not be recorded (for example,
   if the allowed criteria or the evidence basis were missing). Both are recorded, so the ranking is recorded.
3. **It is *not* a patch-required result** — the ranking is unambiguous and bounded: it orders by recommendation
   readiness at the current grain, accepts / rejects / selects / proposes / implements nothing, and satisfies no gate.

> **Ranking-recorded ≠ candidate accepted ≠ candidate finally rejected ≠ candidate eliminated ≠ host selected ≠
> production database selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_RANKING_RECORDED` is the result of *this ranking gate only*. It accepts no candidate, finally
> rejects no candidate, selects no host, selects no production database, proposes no adapter, authorizes no
> implementation, and satisfies no gate. **Gate #8 remains OPEN / HELD.**

---

## 8. Selected next lane

> **Selected next lane: a docs-only preferred-candidate sibling-owner evidence request authorization / preparation
> gate** — a bounded sibling-owner evidence request lane carrying the Phase 49H File 4 requirement
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md:134`). That next lane prepares
> a sibling-owner evidence request for `Railway PostgreSQL`; it opens no sibling PR unless separately authorized,
> and accepts / selects / proposes / implements / wires / closes nothing.

Any follow-on PR title must carry its phase label, e.g. `Phase 49J: preferred-candidate sibling-owner evidence
request authorization / preparation` *(docs-only)*.

---

## 9. Preserved blocked state

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
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **No production database is selected**; **no production adapter is proposed**; **no implementation is authorized**.

---

## 10. Preserved non-claims

Each item below is preserved as a **negation**. This ranking gate:

- **records** a decision-preparation ranking but **accepts no candidate**;
- **does not finally reject** any candidate — a low rank is not rejection;
- **does not permanently eliminate** any candidate — all five remain in consideration
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`);
- **does not use** any §4 forbidden input;
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

> Every notion above appears in this document only inside a negation. Recording a decision-preparation ranking is not
> accepting any candidate, finally rejecting any candidate, eliminating any candidate, selecting any host, selecting
> any production database, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 11. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49I (File 1 of 7) — gate #8 concrete-candidate ranking gate (docs-only) |
| **Predecessor** | Phase 49H File 5 — recorded `CONCRETE_CANDIDATE_RECOMMENDATION_LANE_AUTHORIZED`; bounded by Phase 49H File 2 |
| **Decision result** | **`CONCRETE_CANDIDATE_RANKING_RECORDED`** — a docs-only decision-preparation ranking recorded; not held (the ranking is recordable); not patch-required (the ranking is unambiguous) |
| **Ranking order** | 1. `Railway PostgreSQL`; 2. `Supabase Postgres`; 3. `Neon Postgres`; 4. `PostgreSQL`; 5. `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` |
| **Criteria used** | the twelve allowed criteria (§3), all drawn from Phase 49F / 49G evidence and residual-gap posture |
| **Inputs not used** | price; convenience; account availability; private deployment state; hidden infrastructure; credentials; connection strings; endpoints; private dashboards; implementation shortcuts; unstated preference; implementation ease not evidenced in Phase 49F / 49G (§4) |
| **This file does not decide** | accepts no candidate; finally rejects no candidate; eliminates no candidate; selects no host; selects no production database; proposes no adapter; authorizes no implementation; satisfies no gate |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no adapter proposed; no implementation authorized |
| **Selected next lane** | docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate |
| **Scope of this PR** | exactly seven new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 12. Audit checklist

- [ ] **Seven-file change.** The branch adds exactly the seven Phase 49I files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §9 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Ranking recorded, not decided.** §5 records the order; §5.1 the rationale; §6 confirms this file decides
      nothing further.
- [ ] **Allowed criteria only.** §3 lists the twelve allowed criteria used; §4 lists the forbidden inputs not used.
- [ ] **Result conservative and explained.** §7 records `CONCRETE_CANDIDATE_RANKING_RECORDED`; not held, not
      patch-required.
- [ ] **No overclaim.** No candidate accepted, finally rejected, or eliminated; no host selected; no production
      database selected; no adapter proposed; no implementation authorized — each appears only inside a negation
      (§10). No "best" / "winner" language; "preferred" appears only in "preferred candidate for recommendation
      request".
- [ ] **No product leak.** No credential, connection string, port, account / project identifier, region, topology,
      endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 13. Source references

- [Phase 49H File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md) — recorded
  `CONCRETE_CANDIDATE_RECOMMENDATION_LANE_AUTHORIZED` (`:115`); authorizes this ranking lane. **Entry baseline /
  predecessor.**
- [Phase 49H File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md) — recorded
  `CONCRETE_CANDIDATE_RANKING_AUTHORIZATION_BOUNDARY_RECORDED` (`:132`); the allowed criteria and forbidden inputs.
- [Phase 49G File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md) — recorded
  `CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED` (`:165`); the `P-1 … P-11` evidence basis.
- [Phase 49F File 7](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED` (`:113`); the per-candidate evidence basis.
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

*End of Phase 49I File 1. Docs-only gate #8 concrete-candidate ranking gate. It records
`CONCRETE_CANDIDATE_RANKING_RECORDED`: a docs-only decision-preparation ranking of the five candidates for
recommendation readiness, using only the allowed criteria — 1. `Railway PostgreSQL`; 2. `Supabase Postgres`;
3. `Neon Postgres`; 4. `PostgreSQL`; 5. `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`.
`Railway PostgreSQL` is the preferred candidate for recommendation request only. The ranking uses none of the
forbidden inputs (price, convenience, account availability, private deployment state, hidden infrastructure,
credentials, connection strings, endpoints, private dashboards, implementation shortcuts, unstated preference, or
implementation ease not evidenced in Phase 49F / 49G). This file accepts no candidate, finally rejects no candidate,
eliminates no candidate, selects no host, selects no production database, proposes no adapter, and authorizes no
implementation. The selected next lane is a docs-only preferred-candidate sibling-owner evidence request
authorization / preparation gate. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
