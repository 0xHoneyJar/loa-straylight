# Phase 49I — ADR-022E Gate #8 Candidate Acceptance / Adapter Authority Separation Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49I (File 6 of 7)** — docs-only **candidate acceptance / adapter authority separation** gate for
> the canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / authority-separation record only.** Phase 49I File 2 recorded
> **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137`). This file **records that the recommendation
> does not collapse the later authorities** — sibling-owner evidence, candidate acceptance, adapter proposal,
> implementation, production wiring, and gate #8 satisfaction each remain a **separate** later gate — and records
> **`CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`**. The only change on this branch is **seven** new
> Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema,
> config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049I` — following the live Phase 48 / 49 convention. It records an **authority separation**: the
later gates the recommendation must each pass through, kept distinct. It collapses no gate, accepts no candidate,
proposes no adapter, and authorizes no implementation. The immediate predecessor is **Phase 49I File 2**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md)).
It carries forward the Phase 49E File 6 evidence-to-decision separation
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md)).

This is **File 6 of 7** in Phase 49I.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49I File 2 — recommendation packet** | Recorded **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — the packet is not acceptance. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| **Phase 49I File 4 — residual blockers** | Recorded **`PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`** — the open blockers, each a required next gate. | `docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:89` |
| **Phase 49E File 6 — evidence-to-decision separation** | Recorded **`EVIDENCE_TO_DECISION_SEPARATION_RECORDED`** — ranking, acceptance, host selection, adapter proposal, and implementation are each a separate later gate. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111` |
| **ADR-048C — adapter-proposal shape** | The `M5` production-adapter-proposal shape is a distinct authority. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352` |
| **ADR-022D — StorageAdapter seam** | The `StorageAdapter` swap-in seam is unchanged. | `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. This gate records an authority separation; it collapses none.

---

## 2. The later gates, kept separate

The recommendation packet (File 2) feeds a **sequence of distinct later authorities**. Phase 49I records that these
remain **separate** — the recommendation does not collapse them into one another. Each is its own request / response,
in this order of dependency:

| Gate | Later authority | What it decides | Reference |
|------|-----------------|-----------------|-----------|
| G-1 | **Sibling-owner evidence request / response** | Whether Finn (gate #9) and Dixie (gate #10) owner evidence is requested and supplied for the recommended candidate class. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`; `:254` |
| G-2 | **Candidate acceptance authority request / response** | Whether the recommended candidate is accepted. The recommendation packet is not acceptance. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| G-3 | **Adapter proposal authority request / response** | Whether a production adapter is proposed (the `M5` shape). | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352` |
| G-4 | **Implementation authority request / response** | Whether implementation is authorized (the `StorageAdapter` seam). | `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` |
| G-5 | **Production wiring authority request / response** | Whether production wiring is authorized. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352` |
| G-6 | **Gate #8 satisfaction review** | Whether gate #8 is satisfied (separate ADR proposing the production adapter, preserving the ADR-022D invariants). | `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` |

> Each row is a distinct later gate. Phase 49I exercises none of them; it records only that they are separate.

---

## 3. Phase 49I does not collapse these gates

Phase 49I **does not collapse** G-1 … G-6 into one another, and **does not** let any earlier step stand in for a later
one:

- the **ranking** (File 1) does not stand in for acceptance (G-2);
- the **recommendation packet** (File 2) does not stand in for acceptance (G-2), adapter proposal (G-3),
  implementation (G-4), production wiring (G-5), or gate #8 satisfaction (G-6);
- the **sibling-owner evidence request preparation** (File 5) does not stand in for the sibling-owner evidence
  request / response itself (G-1), nor for acceptance (G-2).

> A recommendation is the **entry** to G-1, not a shortcut past G-2 … G-6. Each later authority is requested and
> answered on its own.

---

## 4. Recommendation does not imply adapter proposal, implementation, acceptance, or production wiring

To be explicit: recording a recommendation for `Railway PostgreSQL` **does not imply**:

- **acceptance** of `Railway PostgreSQL` (G-2) — the packet is not acceptance
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137`);
- **adapter proposal** (G-3) — no `M5`-shape adapter is proposed
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **implementation** (G-4) — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **production wiring** (G-5) — none is authorized;
- **gate #8 satisfaction** (G-6) — gate #8 remains HELD
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

---

## 5. This file separates the authorities; it exercises none

To be unambiguous: this file **records** the separation of the later authorities and **exercises none of them**. It
lists the six distinct later gates (§2), records that Phase 49I does not collapse them (§3), and records that the
recommendation implies none of acceptance / adapter proposal / implementation / production wiring / gate satisfaction
(§4). It accepts no candidate, proposes no adapter, authorizes no implementation, authorizes no production wiring, and
satisfies no gate.

---

## 6. Separation decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`**:

1. **It is `CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`** — Phase 49E File 6 established that ranking,
   acceptance, host selection, adapter proposal, and implementation are each a separate later gate; this file records
   the full separation for the recommendation that File 2 prepared (§2), that Phase 49I does not collapse it (§3), and
   that the recommendation implies none of the later authorities (§4). The separation is recorded above.
2. **It is *not* a held result** — a held result would apply only if the separation could not be stated. It is
   recorded, so the separation is recorded.
3. **It is *not* a patch-required result** — the separation is unambiguous and bounded: six distinct later gates, none
   collapsed, none exercised.

> **Separation-recorded ≠ candidate accepted ≠ adapter proposed ≠ implementation authorized ≠ production wiring
> authorized ≠ gate #8 satisfaction.** Recording `CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED` is the
> result of *this separation gate only*. It accepts no candidate, proposes no adapter, authorizes no implementation,
> authorizes no production wiring, and satisfies no gate. **Gate #8 remains OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: a docs-only preferred-candidate sibling-owner evidence request authorization / preparation
> gate** — gate G-1 in the separation above, addressed as request preparation only. It opens no sibling PR unless
> separately authorized, and accepts / selects / proposes / implements / wires / closes nothing.

Any follow-on PR title must carry its phase label, e.g. `Phase 49J: preferred-candidate sibling-owner evidence
request authorization / preparation` *(docs-only)*.

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
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **No production database is selected**; **no production adapter is proposed**; **no implementation is authorized**.

---

## 9. Preserved non-claims

Each item below is preserved as a **negation**. This authority-separation gate:

- **records** the separation of the later authorities but **exercises none**;
- **does not collapse** G-1 … G-6 into one another;
- **does not accept** any candidate — acceptance is G-2, a separate later authority;
- **does not propose** any production adapter — adapter proposal is G-3; the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — implementation is G-4; the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **authorizes no production wiring** — production wiring is G-5;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **authorizes no sibling-repo PR** (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 satisfaction is G-6; nor gate #9 / #10, nor D.1(ii), nor
  D.1, nor D.2, nor MVP-2;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, implementation plan, or deployment
  plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change.

> Every notion above appears in this document only inside a negation. Recording an authority separation is not
> collapsing any gate, accepting any candidate, proposing any adapter, authorizing any implementation, authorizing any
> production wiring, satisfying any gate, or selecting any host.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49I (File 6 of 7) — gate #8 candidate acceptance / adapter authority separation gate (docs-only) |
| **Predecessor** | Phase 49I File 2 — recorded `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`; carries forward Phase 49E File 6 |
| **Decision result** | **`CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`** — six distinct later gates recorded as separate; not held (the separation is statable); not patch-required (the separation is unambiguous) |
| **Separate later gates** | G-1 sibling-owner evidence request / response; G-2 candidate acceptance authority; G-3 adapter proposal authority; G-4 implementation authority; G-5 production wiring authority; G-6 gate #8 satisfaction review |
| **Not collapsed** | Phase 49I does not collapse G-1 … G-6; recommendation implies none of acceptance / adapter proposal / implementation / production wiring |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no adapter proposed; no implementation authorized |
| **Selected next lane** | docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate (G-1) |
| **Scope of this PR** | exactly seven new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Seven-file change.** The branch adds exactly the seven Phase 49I files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Separation recorded, none exercised.** §2 lists the six later gates; §3 records they are not collapsed; §4
      records the recommendation implies none of them; §5 confirms this file exercises none.
- [ ] **Result conservative and explained.** §6 records `CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`;
      not held, not patch-required.
- [ ] **No overclaim.** No candidate accepted; no adapter proposed; no implementation authorized; no production
      wiring authorized; no host selected — each appears only inside a negation (§9).
- [ ] **No product leak.** No external URL, credential, connection string, port, account / project identifier, region,
      topology, endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49I File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md) — recorded
  `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED` (`:137`). **Entry baseline / predecessor.**
- [Phase 49I File 4](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md) — recorded
  `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED` (`:89`); the open blockers as required next gates.
- [Phase 49E File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md) — recorded
  `EVIDENCE_TO_DECISION_SEPARATION_RECORDED` (`:111`); ranking / acceptance / host selection / adapter proposal /
  implementation each a separate later gate.
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

*End of Phase 49I File 6. Docs-only gate #8 candidate acceptance / adapter authority separation gate. It records
`CANDIDATE_ACCEPTANCE_ADAPTER_AUTHORITY_SEPARATION_RECORDED`: the recommendation feeds six distinct later gates —
G-1 sibling-owner evidence request / response; G-2 candidate acceptance authority request / response; G-3 adapter
proposal authority request / response; G-4 implementation authority request / response; G-5 production wiring
authority request / response; G-6 gate #8 satisfaction review. Phase 49I does not collapse these gates, and recording
a recommendation does not imply acceptance, adapter proposal, implementation, or production wiring. This file accepts
no candidate, proposes no adapter, authorizes no implementation, authorizes no production wiring, selects no host, and
satisfies no gate. The selected next lane is a docs-only preferred-candidate sibling-owner evidence request
authorization / preparation gate (G-1). Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
