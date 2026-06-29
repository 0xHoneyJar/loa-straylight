# Phase 49E — ADR-022E Gate #8 Concrete-Candidate Evidence-to-Decision Separation Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49E (File 6 of 6)** — docs-only **evidence-to-decision separation** gate for the
> canonical-store concrete-candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / separation-record only.** Phase 49E File 1 recorded
> **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`** and answered EAQ-5 / EAQ-6: evidence authorization does
> not include adapter-proposal permission or implementation authorization — each remains a later separate request
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:150-158`). This file
> **records the separation ladder** as **`EVIDENCE_TO_DECISION_SEPARATION_RECORDED`** — it fixes that evidence
> gathering, evidence result, ranking, acceptance, host selection, adapter proposal, implementation, and production
> wiring are each a separately-gated transition. It **records separation; it crosses none of these transitions.**
> It ranks **no** candidate, accepts **no** candidate, selects **no** host, proposes **no** production adapter, and
> authorizes **no** implementation. The only change on this branch is **six** new Markdown files under `docs/`. No
> source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated,
> `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049E` — following the live convention for the Phase 48 / 49 family. It records a bounded
**separation ladder**: it fixes that each transition from evidence to decision requires its own gate / authority;
it crosses none of them. The immediate predecessor is **Phase 49E File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md)),
which recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`.

This is **File 6 of 6** in Phase 49E.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49C File 1 — adapter / implementation separation (EQ-5 / EQ-6)** | Recorded that exact-grain authority does **not** include adapter-proposal permission (EQ-5) or implementation authorization (EQ-6); each remains a later separate request. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191` |
| **Phase 49C File 3 — adapter / implementation separation** | Recorded **`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`** — adapter proposal and implementation each remain separate later authorities. | `docs/ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md:129` |
| **Phase 49D File 6 — evidence-authorization request** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`** — framed EAQ-1 … EAQ-6, including EAQ-5 / EAQ-6 on adapter / implementation separation. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md:105` |
| **Phase 49E File 1 — EAQ-5 / EAQ-6 response** | Recorded that evidence authorization does not include adapter-proposal permission (EAQ-5) or implementation authorization (EAQ-6); each remains a later separate request. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:150-158` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. The EAQ-5 / EAQ-6 response (File 1) is the entry baseline; this gate records the
> separation ladder that response implies — and goes no further.

---

## 2. Separation ladder

Each rung below is a **distinct transition** requiring its own gate / authority. None implies the next; crossing
one does not cross the next:

1. **Evidence gathering** — a later docs-only PR gathers `P-1 … P-11` evidence within the File 3 grain (authorized
   by File 2). *This is the only transition Phase 49E authorizes (for a later PR).*
2. **Evidence result** — classifying the gathered evidence (the File 4 packet placeholders); a later lane's
   result, not a decision about candidates.
3. **Candidate ranking** — ordering candidates by their evidence; a separate **candidate decision gate**.
4. **Candidate acceptance** — accepting a candidate; a separate **candidate acceptance gate** (EQ-3,
   `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`).
5. **Host selection** — selecting a concrete canonical-store physical host; the host remains **UNSELECTED**
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
6. **Adapter proposal** — proposing a production adapter (the gate-#8 `M5` shape); a separate, later request
   (EQ-5, `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
7. **Implementation** — any source / test / runtime / config / package / CI / schema / migration / SQL change; a
   separate, later request (EQ-6, `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).
8. **Production wiring** — wiring a selected substrate into production; a separate, later request.

The separation, stated as implications that **do not hold without a separate gate**:

- **Evidence gathering is not ranking.**
- **Evidence gathering is not candidate acceptance.**
- **Candidate acceptance is not host selection** unless separately authorized.
- **Host selection is not adapter proposal.**
- **Adapter proposal is not implementation.**
- **Implementation is not production wiring.**
- **Each transition needs a separate gate / authority.**

---

## 3. What Phase 49E authorizes (and only that)

Phase 49E authorizes **only later evidence gathering** (rung 1), via File 2's
`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`, within File 3's grain. It authorizes **none** of rungs 2–8 as a
*decision*: the later evidence lane may *classify* its own evidence (rung 2 as a packet result), but ranking,
acceptance, host selection, adapter proposal, implementation, and production wiring (rungs 3–8) each remain behind
their own separate gates.

> Phase 49E does not climb the ladder. It opens the bottom rung for a later PR and records that every rung above it
> needs its own authority.

---

## 4. Explicitly forbidden direct routing

This gate forbids any later lane from routing **directly** from evidence gathering to:

- **ranking** — must pass through a separate candidate decision gate;
- **acceptance** — must pass through a separate candidate acceptance gate;
- **host selection** — must pass through a separate host-selection authority; the host remains **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **adapter proposal** — must pass through a separate adapter-proposal request (the gate-#8 `M5` shape,
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **implementation** — must pass through a separate implementation authorization
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **production wiring** — must pass through a separate production-wiring authorization.

> No shortcut is permitted. A later PR that routes evidence directly into any of the above has skipped a gate and
> must be refused at review.

---

## 5. Separation decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`EVIDENCE_TO_DECISION_SEPARATION_RECORDED`**:

1. **It is `EVIDENCE_TO_DECISION_SEPARATION_RECORDED`** — the separation ladder (§2), the scope of what Phase 49E
   authorizes (§3), and the forbidden direct routing (§4) are recorded coherently and within the EAQ-5 / EAQ-6
   response. The separation is formable and recorded, so the separation is recorded.
2. **It is *not* `EVIDENCE_TO_DECISION_SEPARATION_HELD`** — a held result would apply only if the separation could
   not be formed (for example, if the EAQ-5 / EAQ-6 response were missing or contradictory). The response is
   recorded and consistent, so the separation is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_EVIDENCE_TO_DECISION_SEPARATION_AMBIGUOUS`** — a patch result would apply if the
   separation were ambiguous, internally inconsistent, or impossible to record without amendment. The separation is
   unambiguous and bounded: an eight-rung ladder, each rung a separate gate, no direct routing. No patch is
   required.

> **Separation-recorded ≠ evidence gathered ≠ candidate ranked ≠ candidate accepted ≠ host selected ≠ adapter
> proposed ≠ implementation authorized ≠ production wiring ≠ gate #8 satisfaction.** Recording
> `EVIDENCE_TO_DECISION_SEPARATION_RECORDED` is the result of *this separation gate only*. **Gate #8 remains
> OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: a docs-only concrete-candidate evidence packet lane.** Because the separation ladder is
> recorded, the next docs-only step (beyond this PR) gathers `P-1 … P-11` evidence (rung 1) within the File 3 grain
> using the File 4 template — and must not route directly to ranking, acceptance, host selection, adapter proposal,
> implementation, or production wiring (rungs 3–8).

Any follow-on PR title must carry its phase label, e.g. `Phase 49F: concrete-candidate evidence packet` *(docs-only)*.

---

## 7. Preserved blocked state

This gate preserves every held/open state unchanged:

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

Each item below is preserved as a **negation**. This evidence-to-decision separation gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not gather** any `P-1 … P-11` evidence — it records the separation a later lane must respect;
- **does not rank** any candidate — ranking is a separate candidate decision gate;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later separate request (EQ-5);
- **authorizes no implementation** of any kind — implementation remains a later separate request (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Recording an evidence-to-decision separation
> ladder is not gathering any evidence, ranking any candidate, accepting any candidate, selecting any host,
> selecting any production database, proposing any adapter, satisfying any gate, authorizing any implementation, or
> authorizing any production wiring.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49E (File 6 of 6) — gate #8 concrete-candidate evidence-to-decision separation gate (docs-only) |
| **Predecessor** | Phase 49E File 1 — recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` (EAQ-5 / EAQ-6 separation answer) |
| **Decision result** | **`EVIDENCE_TO_DECISION_SEPARATION_RECORDED`** — the eight-rung ladder (evidence gathering → evidence result → ranking → acceptance → host selection → adapter proposal → implementation → production wiring), each a separate gate; not `EVIDENCE_TO_DECISION_SEPARATION_HELD` (the separation is formable and recorded), not `PATCH_REQUIRED_EVIDENCE_TO_DECISION_SEPARATION_AMBIGUOUS` (the separation is unambiguous and bounded) |
| **Authorized by Phase 49E** | only later evidence gathering (rung 1), within the File 3 grain |
| **Forbidden direct routing** | evidence → ranking; evidence → acceptance; evidence → host selection; evidence → adapter proposal; evidence → implementation; evidence → production wiring |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked or accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate evidence packet lane (rung 1) that must not route directly to ranking, acceptance, host selection, adapter proposal, implementation, or production wiring |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49E files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Separation recorded, none crossed.** §2 records the ladder; §3 records what Phase 49E authorizes; §4
      forbids direct routing; no rung above evidence gathering is crossed.
- [ ] **Result conservative and explained.** §5 records `EVIDENCE_TO_DECISION_SEPARATION_RECORDED`; not HELD, not
      PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 selects the docs-only evidence packet lane (rung 1) that must not route directly to
      ranking, acceptance, host selection, adapter proposal, implementation, or production wiring.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, a ranked / accepted
      candidate, host selection, gathered evidence, a proposed production adapter, implementation, or production
      wiring — each appears only inside a negation (§8).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      endpoint, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49E File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md) —
  recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` and the EAQ-5 / EAQ-6 separation answer (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:150-158`).
  **Entry baseline / predecessor.**
- [Phase 49E File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`; authorizes rung 1.
- [Phase 49E File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md) — the evidence packet
  template the rung-1 lane copies.
- [Phase 49D File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED` (`:105`).
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — EQ-3 compare but no
  acceptance (`:152`); EQ-5 adapter separate (`:183`); EQ-6 implementation separate (`:191`).
- [Phase 49C File 3](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md) — recorded
  `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` (`:129`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49E File 6. Docs-only gate #8 concrete-candidate evidence-to-decision separation gate. It records
`EVIDENCE_TO_DECISION_SEPARATION_RECORDED` (not `EVIDENCE_TO_DECISION_SEPARATION_HELD`, not
`PATCH_REQUIRED_EVIDENCE_TO_DECISION_SEPARATION_AMBIGUOUS`): evidence gathering is not ranking; evidence gathering
is not candidate acceptance; candidate acceptance is not host selection unless separately authorized; host
selection is not adapter proposal; adapter proposal is not implementation; implementation is not production wiring;
and each transition needs a separate gate / authority. Phase 49E authorizes only later evidence gathering (rung 1);
it forbids direct routing to ranking, acceptance, host selection, adapter proposal, implementation, or production
wiring. It gathers no evidence, ranks no candidate, accepts no candidate, selects no host, selects no production
database, proposes no production adapter, and authorizes no implementation. The selected next lane is a docs-only
concrete-candidate evidence packet lane. No commit, no push, no PR.*
