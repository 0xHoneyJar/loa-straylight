# Phase 49J — ADR-022E Gate #8 Dixie Gate #10 Railway PostgreSQL Evidence Request Packet

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49J (File 3 of 6)** — docs-only **Dixie gate #10 evidence request packet** for the preferred
> candidate `Railway PostgreSQL`, in the canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E
> gate #8).
> **Status**: **docs / request-packet text only.** Phase 49J File 1 recorded
> **`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_AUTHORIZED`**
> (`docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-AUTHORIZATION-GATE.md:129`), authorizing the
> preparation, in Straylight, of docs-only sibling-owner evidence request packets for `Railway PostgreSQL`. This file
> **prepares the request packet text for `loa-dixie` gate #10 only**, and records
> **`DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED`**. This is a **request packet only**: no Dixie evidence
> is supplied or claimed supplied, no Dixie PR is opened or authorized, and `loa-dixie` is not touched. The only change
> on this branch is **six** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration,
> auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path
> is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049J` — following the live Phase 48 / 49 convention. It prepares a **request packet** addressed,
in shape, to the `loa-dixie` owner via the gate #10 acceptance path. It supplies no Dixie evidence, opens no Dixie PR,
edits no sibling repo, accepts no candidate, selects no host, proposes no adapter, and authorizes no implementation. The
immediate predecessor is **Phase 49J File 1**
([`./ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-AUTHORIZATION-GATE.md)).
It narrows the Phase 49I File 5 Dixie (gate #10) request shape
([`./ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-GATE.md`](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-GATE.md)).

This is **File 3 of 6** in Phase 49J.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49J File 1 — request authorization** | Recorded **`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_AUTHORIZED`** — docs-only request-packet preparation in Straylight authorized for `Railway PostgreSQL`. | `docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-AUTHORIZATION-GATE.md:129` |
| **Phase 49I File 5 — sibling-owner evidence request preparation** | Recorded **`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`** — the Dixie (gate #10) request shape for `Railway PostgreSQL`. | `docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-GATE.md:139` |
| **Phase 49I File 2 — recommendation packet** | Recorded **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — `Railway PostgreSQL` preferred for recommendation request. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| **Gate #10 — Dixie boundary-evidence lane (ADR-048B)** | `loa-dixie` route-side ingress / control-plane boundary lane; the Dixie owner explicitly ACCEPTS; gate #10 HELD (broad). | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254` |
| **Gate #10 held state (Phase 48N)** | Gate #10 remains HELD with `PARTIAL_RECORDED`. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Straylight canonical-store boundary ownership (ADR-048B)** | S2 canonical-store physical host UNSELECTED, owner "none"; Straylight is the semantic owner of the canonical-store boundary. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156` |
| **Cross-repo handoff rule** | No sibling-repo PR may merge without teammate review. | `docs/handoffs/cross-repo-handoff-index.md:28` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this packet. The table is a status
> restatement only. This packet is request text; it supplies no evidence and opens no lane.

---

## 2. This is a request packet only

This file is a **request packet**: it records what a later, separately-authorized and separately-dispatched
sibling-owner evidence request to the `loa-dixie` owner — through the gate #10 acceptance path, which requires the Dixie
owner to explicitly ACCEPT (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`) — would
ask, for `Railway PostgreSQL` as the recommended candidate class. It asks nothing now and answers nothing now.

> **Request packet prepared ≠ request dispatched ≠ Dixie PR opened ≠ Dixie evidence supplied ≠ candidate accepted.**
> Preparing the Dixie request packet text in Straylight is not sending it, not opening a Dixie lane, and not authorizing
> a Dixie PR. No Dixie-side artifact exists or is referenced as existing.

---

## 3. Dixie (gate #10) — owner evidence requested

For `Railway PostgreSQL` as the recommended candidate class, the request packet would ask the `loa-dixie` owner to
provide owner evidence addressing the following — **as questions to the Dixie owner**, not as Straylight assertions
about Dixie:

1. **Boundary / evidence posture relative to `Railway PostgreSQL` as the recommended candidate class** — the Dixie
   owner's boundary / evidence posture with respect to the recommended candidate class.
2. **No semantic ownership creep into Dixie** — confirmation that adopting the recommended candidate class introduces
   no canonical-store *semantic* ownership into Dixie; Dixie remains a route-side / control-plane participant surface.
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
   Dixie owner identifies any Dixie-side artifact required before a candidate acceptance authority request could be
   made.

Gate #10 remains held with `PARTIAL_RECORDED`
(`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`). **No such evidence is requested
(dispatched), supplied, or claimed supplied here.** The items above are request topics only; they ask the Dixie owner —
they assert nothing about Dixie, and they require no implementation.

---

## 4. What this packet is not

This request packet, by itself and by Phase 49J:

- **does not supply, and does not claim, any Dixie owner evidence** — no answer to §3 exists or is asserted;
- **does not authorize or open a Dixie PR** — no `loa-dixie` pull request is requested, opened, or authorized
  (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not edit or reference uncreated sibling files as if they exist** — `loa-dixie` is untouched and no Dixie-side
  artifact is referenced as existing;
- **does not request implementation** — the §3 topics are evidence questions, not implementation work; the
  `StorageAdapter` seam is unchanged (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **does not accept** `Railway PostgreSQL`, **select** any host, **select** any production database, **propose** any
  adapter, or **authorize** any production wiring.

---

## 5. This file prepares the Dixie request packet; it requests nothing

To be unambiguous: this file **prepares** the Dixie gate #10 evidence request packet text for `Railway PostgreSQL` and
**requests nothing** (dispatches nothing). It records the request topics (§3) and what the packet is not (§4). It
supplies no Dixie evidence, claims none supplied, opens no Dixie lane, authorizes no Dixie PR, edits no sibling repo,
accepts no candidate, selects no host, selects no production database, proposes no adapter, authorizes no
implementation, and authorizes no production wiring.

---

## 6. Packet decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED`**:

1. **It is `DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED`** — Phase 49J File 1 authorized docs-only
   request packet preparation; this file prepares the Dixie gate #10 request packet text for `Railway PostgreSQL` (§3)
   and states what it is not (§4). The packet is prepared above.
2. **It is *not* a held result** — a held result would apply only if the packet could not be prepared (for example, if
   no preferred candidate or authorization existed). Both exist, so the packet is prepared.
3. **It is *not* a patch-required result** — the packet is unambiguous and bounded: eight Dixie-owner evidence topics,
   request text only, no Dixie PR, no Dixie evidence supplied.

> **Dixie-request-prepared ≠ Dixie request dispatched ≠ Dixie PR opened ≠ Dixie evidence supplied ≠ candidate accepted ≠
> host selected ≠ production database selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8 / #10
> satisfaction.** Recording `DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED` is the result of *this packet
> gate only*. It supplies no Dixie evidence, opens no Dixie lane, authorizes no Dixie PR, edits no sibling repo, accepts
> no candidate, selects no host, selects no production database, proposes no adapter, authorizes no implementation, and
> satisfies no gate. **Gate #8 remains OPEN / HELD; gate #10 remains HELD with `PARTIAL_RECORDED`.**

---

## 7. Selected next lane

> **Selected next lane: a docs-only sibling evidence dispatch authority request gate** — or equivalent bounded
> dispatch-authorization lane. That lane asks **whether to open sibling evidence lanes / sibling PRs** (including any
> Dixie lane); it does **not** itself open them unless explicitly authorized by that later gate
> (`docs/handoffs/cross-repo-handoff-index.md:28`). The dispatch / PR-opening separation is recorded in Phase 49J
> File 5 ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-PR-SEPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-DISPATCH-PR-SEPARATION-GATE.md)).

Any follow-on PR title must carry its phase label, e.g. `Phase 49K: sibling evidence dispatch authority request`
*(docs-only)*.

---

## 8. Preserved blocked state

This packet preserves every held / open state unchanged:

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

Each item below is preserved as a **negation**. This Dixie gate #10 request packet:

- **prepares** the Dixie request packet text but **requests (dispatches) no Dixie evidence**;
- **does not supply or claim** any Dixie owner evidence — none is supplied;
- **does not authorize or open** any Dixie PR (`docs/handoffs/cross-repo-handoff-index.md:28`);
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

> Every notion above appears in this document only inside a negation. Preparing a Dixie gate #10 request packet is not
> dispatching it, supplying any Dixie evidence, opening any Dixie PR, editing any sibling repo, accepting any candidate,
> selecting any host, selecting any production database, proposing any adapter, satisfying any gate, or authorizing any
> implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49J (File 3 of 6) — gate #8 Dixie gate #10 Railway PostgreSQL evidence request packet (docs-only) |
| **Predecessor** | Phase 49J File 1 — recorded `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_AUTHORIZED`; narrows Phase 49I File 5 Dixie shape |
| **Decision result** | **`DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED`** — Dixie gate #10 request packet text prepared; not held (the packet is preparable); not patch-required (the packet is unambiguous) |
| **Dixie (gate #10) request topics** | (1) boundary / evidence posture vs Railway PostgreSQL as recommended candidate class; (2) no semantic ownership creep into Dixie; (3) preservation of Straylight as semantic owner of the canonical-store boundary; (4) no-leak posture; (5) boundary interoperability posture; (6) Railway-specific residual gaps affecting the Dixie boundary; (7) what Dixie can prove, cannot prove, or must defer; (8) whether any Dixie-side artifact is needed before candidate acceptance authority can be requested |
| **Request-only** | request packet text only; no Dixie evidence supplied or claimed; no Dixie PR opened or authorized; `loa-dixie` untouched; no implementation requested |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no adapter proposed; no implementation authorized |
| **Selected next lane** | docs-only sibling evidence dispatch authority request gate (asks whether to open sibling evidence lanes; does not itself open them unless explicitly authorized) |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49J files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Request packet only.** §2 / §3 prepare the Dixie gate #10 request topics; §4 / §5 confirm no evidence supplied,
      no Dixie PR, no implementation requested.
- [ ] **No sibling-file fabrication.** No `loa-dixie` file is edited or referenced as if it exists.
- [ ] **Result conservative and explained.** §6 records `DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED`;
      not held, not patch-required.
- [ ] **No overclaim.** No Dixie evidence supplied; no Dixie PR authorized; no candidate accepted; no host selected; no
      production database selected; no adapter proposed; no implementation authorized — each appears only inside a
      negation (§9).
- [ ] **No product leak.** No external URL, credential, connection string, port, account / project identifier, region,
      topology, endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49J File 1](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-AUTHORIZATION-GATE.md) —
  recorded `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_AUTHORIZED` (`:129`). **Entry baseline / predecessor.**
- [Phase 49I File 5](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-GATE.md) — recorded
  `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED` (`:139`); the Dixie (gate #10) request shape.
- [Phase 49I File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md) — recorded
  `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED` (`:137`); the preferred candidate.
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`); the gate #10 Dixie boundary-evidence lane, Dixie owner ACCEPTS (`:254`).
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

*End of Phase 49J File 3. Docs-only gate #8 Dixie gate #10 Railway PostgreSQL evidence request packet. It records
`DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_REQUEST_PREPARED`: a request packet for the `loa-dixie` owner via the
gate #10 acceptance path, asking for owner evidence on boundary / evidence posture relative to `Railway PostgreSQL` as
the recommended candidate class, no semantic ownership creep into Dixie, preservation of Straylight as semantic owner of
the canonical-store boundary, no-leak posture, boundary interoperability posture, Railway-specific residual gaps
affecting the Dixie boundary, what Dixie can prove / cannot prove / must defer, and whether any Dixie-side artifact is
needed before candidate acceptance authority can be requested. This is a request packet only: no Dixie evidence is
supplied or claimed, no Dixie PR is opened or authorized, `loa-dixie` is untouched, and no implementation is requested.
This file accepts no candidate, selects no host, selects no production database, proposes no adapter, and authorizes no
implementation. Gate #8 remains OPEN / HELD; gate #10 remains HELD with `PARTIAL_RECORDED`. No commit, no push, no PR.*
