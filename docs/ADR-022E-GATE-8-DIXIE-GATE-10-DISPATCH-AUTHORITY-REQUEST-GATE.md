# Phase 49K — ADR-022E Gate #8 Dixie Gate #10 Dispatch Authority Request Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49K (File 3 of 5)** — docs-only **Dixie gate #10 dispatch authority request** gate for the
> canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / authority-request text only.** Phase 49K File 1 recorded
> **`SIBLING_EVIDENCE_DISPATCH_AUTHORITY_REQUEST_PREPARED`**
> (`docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-AUTHORITY-REQUEST-GATE.md:128`), preparing the docs-only authority
> request asking *whether* sibling evidence lanes may later be dispatched / opened. This file **prepares the
> Dixie-specific dispatch authority request**, and records **`DIXIE_GATE_10_DISPATCH_AUTHORITY_REQUEST_PREPARED`**. It
> asks *whether* a later Dixie evidence lane may be opened for gate #10 on the `Railway PostgreSQL` preferred-candidate
> path. This is an **authority request only**: dispatch is not authorized, no Dixie lane is opened, no Dixie PR is opened
> or authorized, no Dixie evidence is supplied or claimed, and `loa-dixie` is not touched. The only change on this branch
> is **five** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration,
> auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path
> is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049K` — following the live Phase 48 / 49 convention. It prepares a **dispatch authority request**
addressed, in shape, to the operator: a docs-only question asking *whether* the Phase 49J Dixie (gate #10) request
packet lane may later be dispatched / opened. It supplies no Dixie evidence, opens no Dixie lane, opens no Dixie PR,
edits no sibling repo, accepts no candidate, selects no host, proposes no adapter, and authorizes no implementation. The
immediate predecessor is **Phase 49K File 1**
([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-AUTHORITY-REQUEST-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-AUTHORITY-REQUEST-GATE.md)).
It refers to the Phase 49J File 3 Dixie request packet
([`./ADR-022E-GATE-8-DIXIE-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md`](./ADR-022E-GATE-8-DIXIE-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md))
and preserves its request-only topics.

This is **File 3 of 5** in Phase 49K.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49K File 1 — dispatch authority request** | Recorded **`SIBLING_EVIDENCE_DISPATCH_AUTHORITY_REQUEST_PREPARED`** — docs-only authority request asking whether sibling evidence lanes may later be opened. | `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-AUTHORITY-REQUEST-GATE.md:128` |
| **Phase 49J File 3 — Dixie request packet** | Recorded **`DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED`** — the Dixie gate #10 evidence request packet text for `Railway PostgreSQL`; request-only. | `docs/ADR-022E-GATE-8-DIXIE-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md:124` |
| **Phase 49I File 2 — recommendation packet** | Recorded **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — `Railway PostgreSQL` preferred for recommendation request only. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| **Gate #10 — Dixie-boundary evidence lane (ADR-048B)** | `loa-dixie` route-side ingress / control-plane boundary lane; broad boundary HELD; the Dixie owner explicitly ACCEPTS. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254` |
| **Gate #10 held state (Phase 48N)** | Gate #10 remains HELD with `PARTIAL_RECORDED`. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Straylight canonical-store boundary ownership (ADR-048B)** | S2 canonical-store physical host UNSELECTED, owner "none"; Straylight is the semantic owner of the canonical-store boundary. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156` |
| **Cross-repo handoff rule** | No sibling-repo PR may merge without teammate review. | `docs/handoffs/cross-repo-handoff-index.md:28` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this request. The table is a status
> restatement only. This request asks a question; it supplies no evidence and opens no lane.

---

## 2. This is an authority request only

This file is a **dispatch authority request**: it records, in Straylight, a docs-only question — *whether* a later Dixie
evidence lane may be opened for gate #10 on the `Railway PostgreSQL` preferred-candidate path. The Dixie evidence request
packet was prepared in Phase 49J File 3
(`docs/ADR-022E-GATE-8-DIXIE-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md:124`); this file asks *whether* that
prepared lane may later be dispatched / opened, through the gate #10 acceptance path, which requires the Dixie owner to
explicitly ACCEPT (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`). It asks nothing of
Dixie now and answers nothing now.

> **Dispatch authority request prepared ≠ dispatch authorized ≠ Dixie lane opened ≠ Dixie PR opened ≠ Dixie evidence
> supplied ≠ candidate accepted.** Preparing the Dixie dispatch authority request text in Straylight is not granting
> dispatch authority, not opening any Dixie lane, not authorizing a Dixie PR, and not authorizing a Dixie PR by itself.
> No Dixie-side artifact exists or is referenced as existing.

---

## 3. What the Dixie dispatch authority request asks

The Dixie dispatch authority request asks the operator — **as a question**, not as a Straylight grant — *whether* a later
Dixie evidence lane may be opened for gate #10 on the `Railway PostgreSQL` preferred-candidate path. It refers to the
Phase 49J File 3 Dixie request packet and **preserves that packet's request-only topics** — carried forward unchanged as
the topics that lane would later cover:

1. **Boundary / evidence posture relative to `Railway PostgreSQL` as the recommended candidate class** — the Dixie
   owner's boundary / evidence posture with respect to the recommended candidate class.
2. **No semantic ownership creep into Dixie** — confirmation that adopting the recommended candidate class introduces no
   canonical-store *semantic* ownership into Dixie; Dixie remains a non-canonical participant surface.
3. **Preservation of Straylight as semantic owner of the canonical-store boundary** — confirmation that Straylight
   remains the semantic owner of the canonical-store boundary
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
4. **No-leak posture** — that any Dixie-side evidence is supplied at the public-doc grain, introducing no forbidden
   surface (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
5. **Boundary interoperability posture** — the Dixie owner's boundary interoperability posture relative to the
   recommended candidate class.
6. **Railway-specific residual gaps affecting the Dixie boundary** — any residual gaps specific to the recommended
   candidate class that bear on the Dixie boundary.
7. **What Dixie can prove, cannot prove, or must defer** — an explicit statement of what the Dixie owner can prove now,
   cannot prove, or must defer.
8. **Whether any Dixie-side artifact is needed before candidate acceptance authority can be requested** — whether the
   Dixie owner identifies any Dixie-side artifact required before a candidate acceptance authority request could be made.

Gate #10 remains held with `PARTIAL_RECORDED`
(`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`). **The question is whether the lane may
later be opened — no dispatch is authorized, no Dixie lane is opened, no Dixie PR is opened, and no Dixie evidence is
requested (dispatched), supplied, or claimed supplied here.** The topics above are carried-forward request topics only;
they would be asked of the Dixie owner *if and when* the lane is later opened by an explicit operator decision; they
assert nothing about Dixie now, and they require no implementation.

---

## 4. What this dispatch authority request is not

This Dixie dispatch authority request, by itself and by Phase 49K:

- **does not authorize dispatch** and **does not authorize a Dixie PR by itself** — it asks *whether* the Dixie lane may
  later be opened (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not open** any Dixie lane or **open / authorize** any Dixie PR — no `loa-dixie` pull request is requested,
  opened, or authorized;
- **does not supply, and does not claim, any Dixie owner evidence** — no answer to §3 exists or is asserted;
- **does not edit `loa-dixie`** or reference any uncreated Dixie-side file as if it exists — `loa-dixie` is untouched;
- **does not request implementation** — the §3 topics are evidence questions, not implementation work; the
  `StorageAdapter` seam is unchanged (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **does not accept** `Railway PostgreSQL`, **select** any host, **select** any production database, **propose** any
  adapter, or **authorize** any production wiring.

---

## 5. This file prepares the Dixie dispatch authority request; it authorizes nothing

To be unambiguous: this file **prepares** the Dixie gate #10 dispatch authority request text for `Railway PostgreSQL`
and **authorizes nothing**. It records what the request asks (§3) and what it is not (§4). It grants no dispatch
authority, opens no Dixie lane, authorizes no Dixie PR, supplies no Dixie evidence, claims none supplied, edits no
sibling repo, accepts no candidate, selects no host, selects no production database, proposes no adapter, authorizes no
implementation, and authorizes no production wiring.

---

## 6. Request decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`DIXIE_GATE_10_DISPATCH_AUTHORITY_REQUEST_PREPARED`**:

1. **It is `DIXIE_GATE_10_DISPATCH_AUTHORITY_REQUEST_PREPARED`** — Phase 49K File 1 prepared the parent dispatch
   authority request; this file prepares the Dixie-specific dispatch authority request text for `Railway PostgreSQL` (§3)
   and states what it is not (§4). The request is prepared above. It asks *whether* a later Dixie evidence lane may be
   opened — it does not grant dispatch, open a Dixie lane, or authorize a Dixie PR by itself.
2. **It is *not* a held result** — a held result would apply only if the request could not be prepared (for example, if
   no Dixie packet or parent authority request existed). Both exist, so the request is prepared.
3. **It is *not* a patch-required result** — the request is unambiguous and bounded: one question (whether the Dixie lane
   may later be opened), eight carried-forward Dixie-owner topics, authority-request text only, no Dixie PR, no Dixie
   evidence supplied.

> **Dixie-dispatch-request-prepared ≠ dispatch authorized ≠ Dixie lane opened ≠ Dixie PR opened ≠ Dixie evidence
> supplied ≠ candidate accepted ≠ host selected ≠ production database selected ≠ adapter proposed ≠ implementation
> authorized ≠ gate #8 / #10 satisfaction.** Recording `DIXIE_GATE_10_DISPATCH_AUTHORITY_REQUEST_PREPARED` is the result
> of *this request gate only*. It grants no dispatch authority, opens no Dixie lane, authorizes no Dixie PR, supplies no
> Dixie evidence, edits no sibling repo, accepts no candidate, selects no host, selects no production database, proposes
> no adapter, authorizes no implementation, and satisfies no gate. **Gate #8 remains OPEN / HELD; gate #10 remains HELD
> with `PARTIAL_RECORDED`.**

---

## 7. Selected next lane

> **Selected next lane: an operator decision on sibling evidence dispatch** — the operator decision may **authorize
> Finn-only evidence PR dispatch**, **authorize Dixie-only evidence PR dispatch**, **authorize Finn + Dixie evidence PR
> dispatch**, **hold dispatch**, **request a patch / split**, or **reject dispatch**
> (`docs/handoffs/cross-repo-handoff-index.md:28`). **Phase 49K performs none of these choices**; it only prepares the
> Dixie dispatch authority request and routes to that decision. The rollup is recorded in Phase 49K File 5
> ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-AUTHORITY-REQUEST-ROLLUP-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-AUTHORITY-REQUEST-ROLLUP-GATE.md)).

Any follow-on PR title must carry its phase label, e.g. `Phase 49L: operator decision on sibling evidence dispatch`
*(docs-only unless that decision authorizes otherwise)*.

---

## 8. Preserved blocked state

This request preserves every held / open state unchanged:

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
- **`Railway PostgreSQL` remains preferred only for recommendation request**
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137`);
- **The concrete canonical-store physical host remains unselected** — owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **No production database is selected**; **no production adapter is proposed**; **no implementation is authorized**;
  **sibling PRs remain unauthorized and unopened** (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 9. Preserved non-claims

Each item below is preserved as a **negation**. This Dixie gate #10 dispatch authority request:

- **prepares** the Dixie dispatch authority request but **grants no dispatch authority** — it only asks whether the Dixie
  lane may later be opened;
- **does not authorize a Dixie PR by itself** (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not open** any Dixie lane or **open / authorize** any Dixie PR;
- **does not supply or claim** any Dixie owner evidence — none is supplied;
- **does not edit** `loa-dixie` or reference any uncreated Dixie-side file as if it exists;
- **does not request implementation** — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **does not accept** `Railway PostgreSQL` — it stays preferred for recommendation request only
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137`);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no production wiring**;
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, implementation plan, or deployment
  plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change.

> Every notion above appears in this document only inside a negation. Preparing a Dixie gate #10 dispatch authority
> request is not granting dispatch authority, opening any Dixie lane, opening any Dixie PR, authorizing any Dixie PR by
> itself, supplying any Dixie evidence, editing any sibling repo, accepting any candidate, selecting any host, selecting
> any production database, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49K (File 3 of 5) — gate #8 Dixie gate #10 dispatch authority request gate (docs-only) |
| **Predecessor** | Phase 49K File 1 — recorded `SIBLING_EVIDENCE_DISPATCH_AUTHORITY_REQUEST_PREPARED`; refers to Phase 49J File 3 Dixie packet |
| **Decision result** | **`DIXIE_GATE_10_DISPATCH_AUTHORITY_REQUEST_PREPARED`** — Dixie gate #10 dispatch authority request text prepared; not held (the request is preparable); not patch-required (the request is unambiguous) |
| **Question asked** | whether a later Dixie evidence lane may be opened for gate #10 on the `Railway PostgreSQL` preferred-candidate path |
| **Carried-forward Dixie topics** | (1) boundary / evidence posture vs Railway PostgreSQL as recommended candidate class; (2) no semantic ownership creep into Dixie; (3) preservation of Straylight as semantic owner of the canonical-store boundary; (4) no-leak posture; (5) boundary interoperability posture; (6) Railway-specific residual gaps affecting the Dixie boundary; (7) what Dixie can prove, cannot prove, or must defer; (8) whether any Dixie-side artifact is needed before candidate acceptance authority can be requested |
| **Request-only** | dispatch authority request text only; no dispatch authorized; no Dixie lane opened; no Dixie PR opened or authorized; no Dixie evidence supplied or claimed; `loa-dixie` untouched; no implementation requested |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no adapter proposed; no implementation authorized |
| **Selected next lane** | operator decision on sibling evidence dispatch (Finn-only / Dixie-only / Finn + Dixie dispatch; hold; patch / split; or reject) — Phase 49K performs none of these |
| **Scope of this PR** | exactly five new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Five-file change.** The branch adds exactly the five Phase 49K files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, `docs/decisions/`, schema, migration, SQL, or any sibling
      repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Authority request only.** §2 / §3 prepare the Dixie dispatch authority request; §4 / §5 confirm no dispatch
      granted, no Dixie PR, no evidence supplied, no implementation requested.
- [ ] **No sibling-file fabrication.** No `loa-dixie` file is edited or referenced as if it exists.
- [ ] **Result conservative and explained.** §6 records `DIXIE_GATE_10_DISPATCH_AUTHORITY_REQUEST_PREPARED`; not held,
      not patch-required.
- [ ] **No overclaim.** No dispatch authorized; no Dixie lane opened; no Dixie PR opened or authorized; no Dixie evidence
      supplied; no candidate accepted; no host selected; no production database selected; no adapter proposed; no
      implementation authorized — each appears only inside a negation (§9).
- [ ] **No product leak.** No external URL, credential, connection string, port, account / project identifier, region,
      topology, endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49K File 1](./ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-AUTHORITY-REQUEST-GATE.md) — recorded
  `SIBLING_EVIDENCE_DISPATCH_AUTHORITY_REQUEST_PREPARED` (`:128`). **Entry baseline / predecessor.**
- [Phase 49J File 3](./ADR-022E-GATE-8-DIXIE-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md) — recorded
  `DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED` (`:124`); the Dixie (gate #10) request packet and topics.
- [Phase 49I File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md) — recorded
  `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED` (`:137`); the preferred candidate.
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`); the gate #10 Dixie-boundary evidence lane, Dixie owner ACCEPTS (`:254`). Read read-only; **not
  modified**.
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — gate #9 / #10 evidence
  `PARTIAL_RECORDED` (`:159`, `:161`); the held-state rows (`:163`, `:165`, `:167`, `:168`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49K File 3. Docs-only gate #8 Dixie gate #10 dispatch authority request gate. It records
`DIXIE_GATE_10_DISPATCH_AUTHORITY_REQUEST_PREPARED`: a docs-only authority request asking *whether* a later Dixie
evidence lane may be opened for gate #10 on the `Railway PostgreSQL` preferred-candidate path. It refers to the
Phase 49J File 3 Dixie request packet and preserves its request-only topics — boundary / evidence posture relative to
`Railway PostgreSQL` as the recommended candidate class, no semantic ownership creep into Dixie, preservation of
Straylight as semantic owner of the canonical-store boundary, no-leak posture, boundary interoperability posture,
Railway-specific residual gaps affecting the Dixie boundary, what Dixie can prove / cannot prove / must defer, and
whether any Dixie-side artifact is needed before candidate acceptance authority can be requested. This is a dispatch
authority request only: dispatch is not authorized, no Dixie lane is opened, no Dixie PR is opened or authorized by
itself, no Dixie evidence is supplied or claimed, and `loa-dixie` is untouched. This file accepts no candidate, selects
no host, selects no production database, proposes no adapter, and authorizes no implementation. Gate #8 remains OPEN /
HELD; gate #10 remains HELD with `PARTIAL_RECORDED`. No commit, no push, no PR.*
