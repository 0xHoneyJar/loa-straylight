# Phase 49H — ADR-022E Gate #8 Concrete-Candidate Elimination / Hold Boundary Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49H (File 3 of 6)** — docs-only **candidate elimination / hold boundary** gate for the
> canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / boundary-record only.** Phase 49H File 1 recorded
> **`CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md:115`), whose DAQ-3 answer permits
> a **later** docs-only gate to classify candidates using a bounded, non-final status vocabulary — but forbids
> permanent elimination in Phase 49H. This file **records that elimination / hold boundary** and records
> **`CONCRETE_CANDIDATE_ELIMINATION_HOLD_BOUNDARY_RECORDED`**. It **records the boundary; it classifies no
> candidate.** It ranks **no** candidate, classifies **no** candidate, identifies **no** preferred candidate, accepts
> **no** candidate, eliminates **no** candidate, selects **no** concrete physical host, selects **no** production
> database, proposes **no** production adapter, and authorizes **no** implementation. The only change on this branch
> is **six** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration,
> auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo
> path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049H` — following the live Phase 48 / 49 convention. It records a bounded **elimination / hold
boundary**: the non-final status vocabulary a *later* docs-only gate may use, and the rule that no candidate may be
permanently eliminated without a separate authority. It does **not** itself classify, eliminate, hold, or prefer any
candidate. The immediate predecessor is **Phase 49H File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md)).

This is **File 3 of 6** in Phase 49H.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49H File 1 — decision-authority response intake** | Recorded **`CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL`** — DAQ-3 permits a later gate to classify candidates with a non-final status vocabulary; forbids permanent elimination in Phase 49H. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md:115` |
| **Phase 49G File 3 — decision-readiness** | Recorded **`CONCRETE_CANDIDATE_DECISION_NOT_READY`** — `NOT_READY` is not a final rejection; future decision possibility preserved. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md:110` |
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — all five candidates "shortlisted (held)". | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. All five candidates remain shortlisted (held); this gate eliminates none.

---

## 2. Classification is allowed only in a later docs-only gate

Per Phase 49H File 1 DAQ-3
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md:115`), a later docs-only gate may
classify the five candidates using a bounded, non-final status vocabulary (§3). This Phase 49H file records that
vocabulary as a *later-gate* vocabulary; it applies none of it to any candidate. All five candidates remain
"shortlisted (held)" exactly as recorded in Phase 49D File 1
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`).

> **Vocabulary recorded ≠ vocabulary applied.** Recording the status labels a later gate may use is not labelling any
> candidate. This file classifies no candidate.

---

## 3. Allowed later-gate status vocabulary (from DAQ-3)

A later docs-only gate may classify each candidate as **exactly one** of the following. **These are later-gate
statuses, not Phase 49H results, and not applied to any candidate here:**

- **`PREFERRED_FOR_RECOMMENDATION_REQUEST`** — *later-gate status.* A later gate would record this for a candidate it
  identifies as preferred for a recommendation request. It is **not** acceptance, and **not** host selection.
- **`HELD_FOR_RESIDUAL_GAP`** — *later-gate status.* A later gate would record this for a candidate it holds pending
  residual-gap resolution (e.g. sibling-owner evidence, adapter-proposal authority, implementation authority, or
  future-infrastructure authority, per the residual-gap matrix,
  `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md:165`).
- **`NOT_PREFERRED_AT_CURRENT_GRAIN`** — *later-gate status.* A later gate would record this for a candidate it does
  not prefer **at the current grain**. **This is not final rejection** (§4).

> Listing the vocabulary records what a *later* gate may say about a candidate. It says none of it here.

---

## 4. `NOT_PREFERRED_AT_CURRENT_GRAIN` is not final rejection; permanent elimination needs separate authority

Two boundaries are recorded:

1. **`NOT_PREFERRED_AT_CURRENT_GRAIN` is not final rejection.** A later gate recording this status for a candidate
   does **not** eliminate it. The candidate remains in consideration; "not preferred at the current grain" reflects
   the present evidence grain, not a permanent exclusion — consistent with the Phase 49G File 3 finding that
   `CONCRETE_CANDIDATE_DECISION_NOT_READY` is **not** a final rejection
   (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md:110`).
2. **No candidate may be permanently eliminated in Phase 49H, and permanent elimination requires a separate authority
   gate.** Final exclusion of any candidate, **if ever needed**, requires its own authority gate. Neither this Phase
   49H file nor the later ranking / recommendation-preparation gate may permanently eliminate any candidate. All five
   remain shortlisted (held) (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`).

> **Not-preferred ≠ rejected ≠ eliminated.** None of the three later-gate statuses removes a candidate from
> consideration. Permanent elimination is reserved for a separate authority gate that has not been requested,
> granted, or exercised.

---

## 5. This file records the boundary; it classifies no candidate

To be unambiguous: this file **records** the elimination / hold boundary and **classifies no candidate**. It records
the three later-gate statuses (§3), marks them as later-gate vocabulary, records that
`NOT_PREFERRED_AT_CURRENT_GRAIN` is not final rejection, and records that permanent elimination needs a separate
authority (§4). It applies no status to any candidate; it eliminates none; it holds none under a label; it prefers
none. Applying any status — whatever it turns out to be — belongs to a *later, separate* docs-only ranking /
recommendation-preparation gate.

---

## 6. Boundary decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_ELIMINATION_HOLD_BOUNDARY_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_ELIMINATION_HOLD_BOUNDARY_RECORDED`** — Phase 49H File 1 DAQ-3 permits a later gate to
   classify candidates with a non-final vocabulary and forbids permanent elimination in Phase 49H; this file records
   that vocabulary (§3) and the two non-elimination boundaries (§4). The boundary is recorded above.
2. **It is *not* a held result** — a held result would apply only if the vocabulary could not be stated. It is
   recorded and statable, so the boundary is recorded, not held.
3. **It is *not* a patch-required result** — the boundary is unambiguous and bounded: three later-gate statuses, none
   final, none applied here, with permanent elimination reserved for a separate authority.

> **Boundary-recorded ≠ candidate classified ≠ candidate eliminated ≠ candidate held under a label ≠ preferred
> candidate identified ≠ candidate accepted ≠ host selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8
> satisfaction.** Recording `CONCRETE_CANDIDATE_ELIMINATION_HOLD_BOUNDARY_RECORDED` is the result of *this boundary
> gate only*. It classifies no candidate, eliminates no candidate, prefers no candidate, accepts no candidate,
> selects no host, proposes no adapter, satisfies no gate, and authorizes no implementation. **Gate #8 remains
> OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: a docs-only concrete-candidate ranking / recommendation-preparation gate.** That later lane
> may classify candidates using **only** the §3 vocabulary, none of which is final rejection, and may **not**
> permanently eliminate any candidate.

That selected next lane:

- **may classify** candidates using only the §3 status vocabulary (`PREFERRED_FOR_RECOMMENDATION_REQUEST` /
  `HELD_FOR_RESIDUAL_GAP` / `NOT_PREFERRED_AT_CURRENT_GRAIN`);
- **must not** permanently eliminate any candidate — that requires a separate authority gate (§4);
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

Each item below is preserved as a **negation**. This elimination / hold boundary gate:

- **records** the elimination / hold boundary but **classifies no candidate**;
- **does not apply** any §3 status to any candidate — the vocabulary is later-gate only;
- **does not eliminate** any candidate — permanent elimination needs a separate authority (§4);
- **does not hold** any candidate under a label — all five remain shortlisted (held) without per-candidate labels
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`);
- **does not identify** a preferred candidate;
- **does not rank** any candidate — ranking is bounded by File 2;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **does not reject** any candidate as a final decision — no status here is final rejection;
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

> Every notion above appears in this document only inside a negation. Recording an elimination / hold boundary is not
> classifying any candidate, eliminating any candidate, holding any candidate under a label, identifying a preferred
> candidate, ranking any candidate, accepting any candidate, rejecting any candidate, selecting any host, proposing
> any adapter, satisfying any gate, or authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49H (File 3 of 6) — gate #8 concrete-candidate elimination / hold boundary gate (docs-only) |
| **Predecessor** | Phase 49H File 1 — recorded `CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL` (DAQ-3) |
| **Decision result** | **`CONCRETE_CANDIDATE_ELIMINATION_HOLD_BOUNDARY_RECORDED`** — the non-final later-gate status vocabulary and the no-permanent-elimination rule are recorded; not held (the vocabulary is statable); not patch-required (the boundary is unambiguous) |
| **Allowed later-gate statuses** | `PREFERRED_FOR_RECOMMENDATION_REQUEST` / `HELD_FOR_RESIDUAL_GAP` / `NOT_PREFERRED_AT_CURRENT_GRAIN` — later-gate statuses, not Phase 49H results |
| **`NOT_PREFERRED_AT_CURRENT_GRAIN`** | not final rejection — a candidate so classified remains in consideration |
| **Permanent elimination** | forbidden in Phase 49H; requires a separate authority gate if ever needed |
| **This file does not classify** | no status is applied to any candidate; all five remain shortlisted (held) |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate classified, eliminated, accepted, or preferred; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate ranking / recommendation-preparation gate; may classify with the §3 vocabulary; eliminates / accepts / selects / proposes / implements nothing |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49H files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Boundary recorded, not applied.** §3 records the three later-gate statuses as future vocabulary; §4 records
      that `NOT_PREFERRED_AT_CURRENT_GRAIN` is not final and permanent elimination needs separate authority; §5
      confirms this file classifies no candidate.
- [ ] **No permanent elimination.** §4 forbids permanent elimination in Phase 49H.
- [ ] **Result conservative and explained.** §6 records `CONCRETE_CANDIDATE_ELIMINATION_HOLD_BOUNDARY_RECORDED`; not
      held, not patch-required.
- [ ] **No overclaim.** No candidate classified, eliminated, or preferred; no host selected; no adapter proposed; no
      implementation authorized — each appears only inside a negation (§9).
- [ ] **No product leak.** No credential, connection string, port, account / project identifier, region, topology,
      endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49H File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `CONCRETE_CANDIDATE_DECISION_AUTHORITY_PARTIAL` (`:115`); DAQ-3. **Entry baseline / predecessor.**
- [Phase 49G File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md) — recorded
  `CONCRETE_CANDIDATE_DECISION_NOT_READY` (`:110`); `NOT_READY` is not a final rejection.
- [Phase 49G File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RESIDUAL-GAP-MATRIX.md) — recorded
  `CONCRETE_CANDIDATE_RESIDUAL_GAP_MATRIX_RECORDED` (`:165`); the residual gaps a `HELD_FOR_RESIDUAL_GAP` status would
  reference.
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

*End of Phase 49H File 3. Docs-only gate #8 concrete-candidate elimination / hold boundary gate. It records
`CONCRETE_CANDIDATE_ELIMINATION_HOLD_BOUNDARY_RECORDED`: a later docs-only gate may classify candidates using exactly
three non-final statuses — `PREFERRED_FOR_RECOMMENDATION_REQUEST`, `HELD_FOR_RESIDUAL_GAP`, and
`NOT_PREFERRED_AT_CURRENT_GRAIN` — which are later-gate statuses, not Phase 49H results.
`NOT_PREFERRED_AT_CURRENT_GRAIN` is not final rejection, no candidate may be permanently eliminated in Phase 49H, and
permanent elimination, if ever needed, requires a separate authority gate. This file classifies no candidate,
eliminates no candidate, holds no candidate under a label, identifies no preferred candidate, ranks no candidate,
accepts no candidate, selects no host, proposes no adapter, and authorizes no implementation; all five candidates
remain shortlisted (held). The selected next lane is a docs-only ranking / recommendation-preparation gate. Gate #8
remains OPEN / HELD. No commit, no push, no PR.*
