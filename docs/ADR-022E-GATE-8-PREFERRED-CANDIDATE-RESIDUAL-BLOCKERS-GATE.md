# Phase 49I — ADR-022E Gate #8 Preferred-Candidate Residual Blockers Gate (Railway PostgreSQL)

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49I (File 4 of 7)** — docs-only **preferred-candidate residual blockers** gate for the
> canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / blocker-record only.** Phase 49I File 2 recorded
> **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137`). This file **records the residual blockers**
> that still stand between `Railway PostgreSQL` (the preferred candidate for recommendation request) and any later
> acceptance, and records **`PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`**. These blockers **are not failures of
> the recommendation packet**; they are **required next gates**. The only change on this branch is **seven** new
> Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema,
> config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049I` — following the live Phase 48 / 49 convention. It records the **residual blockers** on the
preferred candidate. It clears no blocker, accepts no candidate, selects no host, proposes no adapter, and authorizes
no implementation. The immediate predecessor is **Phase 49I File 2**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md)).

This is **File 4 of 7** in Phase 49I.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49I File 2 — recommendation packet** | Recorded **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — `Railway PostgreSQL` preferred for recommendation request; packet is not acceptance. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| **Phase 49H File 4 — sibling-owner evidence requirement** | Recorded **`SIBLING_OWNER_EVIDENCE_REQUIREMENT_RECORDED`** — Finn (gate #9) / Dixie (gate #10) evidence required before acceptance. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md:134` |
| **Phase 48N — sibling evidence intake** | Gate #9 / gate #10 evidence results `PARTIAL_RECORDED`; both gates remain held. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `:161` |
| **ADR-048B — host ownership routing** | S2 canonical-store physical host UNSELECTED, owner "none"; gate #9 Finn lane; gate #10 Dixie lane. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`; `:253`; `:254` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. This gate records blockers; it clears none.

---

## 2. The residual blockers are required next gates, not packet failures

The recommendation packet for `Railway PostgreSQL` (File 2) was prepared **despite** open blockers, not by clearing
them. Each blocker below is a **required next gate** — a separate later authority that must act before `Railway
PostgreSQL` could be accepted. A blocker is **not** a defect in the recommendation packet; it is the structure that
keeps acceptance, adapter proposal, implementation, and gate satisfaction as separate later authorities.

> **Blocker recorded ≠ blocker cleared ≠ packet failed.** Recording a blocker preserves the dependency; it does not
> discharge it, and it does not weaken the recommendation packet. The packet is a request basis; the blockers are the
> later gates that request must pass through.

---

## 3. The residual blockers (Railway PostgreSQL)

`Railway PostgreSQL` remains blocked by **all** of the following. None is cleared here:

| # | Residual blocker | Why it blocks / authority | Reference |
|---|------------------|---------------------------|-----------|
| B-1 | **Finn gate #9 owner evidence** | Finn owner evidence (runtime / evidence posture relative to the recommended candidate class; no semantic ownership creep into Finn; no-leak; runtime interoperability; candidate-specific residual gaps) is required before acceptance; gate #9 held `PARTIAL_RECORDED`. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159` |
| B-2 | **Dixie gate #10 owner evidence** | Dixie owner evidence (boundary / evidence posture relative to the recommended candidate class; no semantic ownership creep into Dixie; no-leak; boundary interoperability; candidate-specific residual gaps) is required before acceptance; gate #10 held `PARTIAL_RECORDED`. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| B-3 | **Adapter proposal authority** | The `M5` production-adapter-proposal shape is a separate later authority; no adapter is proposed. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352` |
| B-4 | **Implementation authority** | The `StorageAdapter` swap-in seam is unchanged; no implementation is authorized. | `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` |
| B-5 | **Production wiring authority** | Production wiring is a separate later authority; none is authorized. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352` |
| B-6 | **Candidate acceptance authority** | Acceptance of `Railway PostgreSQL` is a separate later candidate acceptance authority response; the packet is not acceptance. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| B-7 | **Gate #8 satisfaction authority** | Gate #8 satisfaction requires a separate ADR proposing the production adapter and preserving the ADR-022D invariants; gate #8 remains HELD. | `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` |
| B-8 | **D.1(ii) resolution** | The canonical-store physical-host dependency D.1(ii) remains unresolved. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163` |
| B-9 | **D.1 satisfaction** | D.1 is not satisfied (conjunct (ii) unresolved). | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165` |
| B-10 | **D.2 start** | D.2 is not started (downstream of full D.1). | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167` |
| B-11 | **MVP-2 closure** | MVP-2 remains open. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168` |

> Each blocker is a required next gate, recorded as open. This file resolves, discharges, satisfies, starts, or
> closes none of them.

---

## 4. This file records blockers only; it clears none

To be unambiguous: this file **records** the residual blockers on `Railway PostgreSQL` and **clears none**. It states
that the blockers are required next gates rather than packet failures (§2) and enumerates them (§3). It accepts no
candidate, selects no host, selects no production database, proposes no adapter, authorizes no implementation,
authorizes no production wiring, resolves no dependency, and satisfies no gate.

---

## 5. Blocker decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`**:

1. **It is `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`** — Phase 49I File 2 prepared the recommendation packet
   without clearing any blocker; this file records the eleven residual blockers (§3) as required next gates (§2). The
   blockers are recorded above.
2. **It is *not* a held result** — a held result would apply only if the blockers could not be recorded. They are
   recorded, so the blockers are recorded.
3. **It is *not* a patch-required result** — the record is unambiguous and bounded: each blocker is named, attributed
   to a later authority, and left open.

> **Blockers-recorded ≠ blockers cleared ≠ candidate accepted ≠ host selected ≠ adapter proposed ≠ implementation
> authorized ≠ D.1(ii) resolved ≠ gate #8 satisfaction.** Recording `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`
> is the result of *this blocker gate only*. It clears no blocker, accepts no candidate, selects no host, proposes no
> adapter, authorizes no implementation, resolves no dependency, and satisfies no gate. **Gate #8 remains
> OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: a docs-only preferred-candidate sibling-owner evidence request authorization / preparation
> gate** — carrying the Phase 49H File 4 requirement
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md:134`). It addresses blockers
> B-1 (Finn gate #9) and B-2 (Dixie gate #10) as a request-preparation shape only; it opens no sibling PR unless
> separately authorized, and accepts / selects / proposes / implements / wires / closes nothing.

Any follow-on PR title must carry its phase label, e.g. `Phase 49J: preferred-candidate sibling-owner evidence
request authorization / preparation` *(docs-only)*.

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
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **No production database is selected**; **no production adapter is proposed**; **no implementation is authorized**.

---

## 8. Preserved non-claims

Each item below is preserved as a **negation**. This residual blockers gate:

- **records** the residual blockers but **clears none**;
- **does not accept** `Railway PostgreSQL` — acceptance is blocker B-6, a separate later authority;
- **does not request, supply, or claim** Finn / Dixie owner evidence — B-1 / B-2 remain open;
- **does not resolve** D.1(ii), satisfy D.1, start D.2, or close MVP-2 — B-8 … B-11 remain open;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **authorizes no sibling-repo PR** (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, implementation plan, or deployment
  plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Recording residual blockers is not clearing any
> blocker, accepting any candidate, requesting any sibling evidence, resolving any dependency, selecting any host,
> proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49I (File 4 of 7) — gate #8 preferred-candidate residual blockers gate (Railway PostgreSQL) (docs-only) |
| **Predecessor** | Phase 49I File 2 — recorded `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED` |
| **Decision result** | **`PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`** — eleven residual blockers recorded as required next gates; not held (the blockers are recordable); not patch-required (the record is unambiguous) |
| **Residual blockers** | B-1 Finn gate #9; B-2 Dixie gate #10; B-3 adapter proposal authority; B-4 implementation authority; B-5 production wiring authority; B-6 candidate acceptance authority; B-7 gate #8 satisfaction authority; B-8 D.1(ii) resolution; B-9 D.1 satisfaction; B-10 D.2 start; B-11 MVP-2 closure |
| **Blockers ≠ packet failures** | each blocker is a required next gate, not a defect in the recommendation packet |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no adapter proposed; no implementation authorized |
| **Selected next lane** | docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate |
| **Scope of this PR** | exactly seven new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Seven-file change.** The branch adds exactly the seven Phase 49I files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Blockers recorded, none cleared.** §3 enumerates the eleven blockers; §2 frames them as required next gates;
      §4 confirms this file clears none.
- [ ] **Result conservative and explained.** §5 records `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`; not held,
      not patch-required.
- [ ] **No overclaim.** No candidate accepted; no host selected; no production database selected; no adapter proposed;
      no implementation authorized; no dependency resolved — each appears only inside a negation (§8).
- [ ] **No product leak.** No external URL, credential, connection string, port, account / project identifier, region,
      topology, endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49I File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md) — recorded
  `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED` (`:137`). **Entry baseline / predecessor.**
- [Phase 49H File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md) — recorded
  `SIBLING_OWNER_EVIDENCE_REQUIREMENT_RECORDED` (`:134`); Finn / Dixie evidence required before acceptance.
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — gate #9 / #10 evidence
  `PARTIAL_RECORDED` (`:159`, `:161`); the held-state rows (`:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`); gate #9 Finn lane (`:253`); gate #10 Dixie lane (`:254`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49I File 4. Docs-only gate #8 preferred-candidate residual blockers gate for `Railway PostgreSQL`. It
records `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`: eleven residual blockers stand between the preferred
candidate and any later acceptance — Finn gate #9 owner evidence; Dixie gate #10 owner evidence; adapter proposal
authority; implementation authority; production wiring authority; candidate acceptance authority; gate #8 satisfaction
authority; D.1(ii) resolution; D.1 satisfaction; D.2 start; and MVP-2 closure. These blockers are required next gates,
not failures of the recommendation packet. This file clears no blocker, accepts no candidate, selects no host,
proposes no adapter, authorizes no implementation, resolves no dependency, and satisfies no gate. The selected next
lane is a docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate. Gate #8
remains OPEN / HELD. No commit, no push, no PR.*
