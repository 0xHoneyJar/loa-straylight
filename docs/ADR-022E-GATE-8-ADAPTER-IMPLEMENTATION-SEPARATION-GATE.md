# Phase 49C — ADR-022E Gate #8 Adapter / Implementation Separation Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49C (File 3 of 5)** — docs-only **adapter / implementation separation** gate for the
> canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / separation-record only.** Phase 49C File 1 recorded **`EXACT_GRAIN_AUTHORITY_PARTIAL`**
> (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:208`) — its EQ-5 answer held adapter
> proposal separate, and its EQ-6 answer held implementation separate. This file **records that separation as a
> standing rule**: adapter proposal and implementation each remain a *later, separate* request, and concrete
> candidate naming — even later candidate acceptance, if a separate gate allows it — does **not** imply either.
> It records **`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`**. It **records a separation; it proposes no adapter
> and authorizes no implementation.** It selects **no** concrete physical host, selects **no** production database,
> names **no** product / vendor / engine / deployment provider, and authorizes **no** implementation. The only
> change on this branch is **five** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB,
> migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or
> sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049C` — following the live convention for the Phase 48 / 49 family. It records a bounded
**separation rule**: it states that adapter proposal and implementation remain separate later authorities and
authorizes neither. The immediate predecessor is **Phase 49C File 1**
([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md)),
which recorded `EXACT_GRAIN_AUTHORITY_PARTIAL`.

This is **File 3 of 5** in Phase 49C.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49B File 2 — EQ-5 / EQ-6 questions** | Framed EQ-5 (does exact-grain authority include adapter-proposal permission?) and EQ-6 (does exact-grain authority include implementation authorization?). | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:97`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:101` |
| **Phase 49C File 1 — EQ-5 response** | Recorded that exact-grain authority does **not** include adapter-proposal permission; adapter proposal remains a later, separate request. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183` |
| **Phase 49C File 1 — EQ-6 response** | Recorded that exact-grain authority does **not** include implementation authorization; implementation remains a later, separate request. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191` |
| **Gate-#8 closure shape** | The gate-#8 trigger is a *proposed production adapter* (`M5`) + the sibling-repo handoff citation + preserved ADR-022D invariants — a separate, later, separately-reviewed lane. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`; `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` |
| **`StorageAdapter` seam** | The `StorageAdapter` interface remains the swap-in seam; unchanged, with no production-adapter proposal made against it. | `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 49C File 1's `EXACT_GRAIN_AUTHORITY_PARTIAL` (EQ-5 / EQ-6) is the entry
> baseline; this gate records the separation those answers carry — and goes no further.

---

## 2. Separation rules — the authority ladder

Gate #8 progress moves through a ladder of *separate* authorities. Each rung is its own transition, granted (or
withheld) on its own, and no rung implies the next:

1. **Exact-grain naming authority** — permission for a *later* PR to name concrete candidates within bounded
   categories. **Recorded partial** in Phase 49C File 1 (EQ-1 … EQ-3,
   `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:124`).
2. **Concrete candidate evaluation authority** — permission to evaluate a named candidate against `P-1 … P-11`. A
   later transition; not granted here (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).
3. **Concrete candidate acceptance authority** — permission to accept a final host. A separate acceptance gate;
   not granted here; the host stays **UNSELECTED** (EQ-3,
   `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
4. **Adapter proposal authority** — permission to propose a production adapter (the gate-#8 `M5` shape). A
   separate, later request; **not** included in exact-grain authority (EQ-5,
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
5. **Implementation authority** — permission to make source / test / runtime / config / package / CI / schema /
   migration / SQL changes. A separate, later request; **not** included in exact-grain authority (EQ-6,
   `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).
6. **Production wiring authority** — permission to wire a host into production. A separate, later request; not
   granted here.

---

## 3. These remain separate transitions

The separation rule is stated plainly so no later step can collapse two rungs into one:

- **Concrete candidate naming does not imply adapter proposal.** Naming or comparing a candidate (rung 1) carries
  no permission to propose a production adapter (rung 4); adapter proposal is its own request (EQ-5,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183`).
- **Concrete candidate naming does not imply implementation authorization.** Naming or comparing a candidate
  (rung 1) carries no permission to implement (rung 5); implementation is its own request (EQ-6,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191`).
- **Concrete candidate acceptance, if later allowed, still does not imply implementation.** Even if a separate
  acceptance gate later accepts a final host (rung 3), that acceptance carries no implementation authority (rung
  5); implementation remains a still-later, separate request
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).
- **Adapter proposal does not imply implementation, and implementation does not imply production wiring.** Each
  rung is granted on its own; the gate-#8 `M5` shape is a *proposed* production adapter, reviewed separately, and
  proposing it is not building it (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

---

## 4. Only naming / shortlist prep is authorized later

Of the ladder in §2, **only rung 1** — exact-grain naming authority for a *later* shortlist PR — is recorded as
authorized (and only partially, per Phase 49C File 1). Rungs 2 through 6 remain **withheld** and each requires its
own later authority:

- the later concrete-candidate shortlist lane may **name and compare** candidates (rung 1);
- it may **not** evaluate-to-accept, accept a host, propose an adapter, implement, or wire production (rungs 2–6)
  unless each is separately authorized.

> This file authorizes nothing new. It records that the only later-authorized step is naming / shortlist
> preparation, and that every other rung remains a separate, withheld transition.

---

## 5. Explicitly forbidden in this PR

This separation gate, and the Phase 49C PR it belongs to, **must not** and **does not**:

- perform **adapter design** — none is designed;
- make an **adapter proposal** — none is proposed; the gate-#8 `M5` shape is reserved for a separate, later lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- make **source changes** — none;
- add or change **tests** — none;
- write **migrations** — none;
- write **SQL** — none;
- change **config** — none;
- change **CI** — none;
- add **runtime wiring** — none;
- add **deployment steps** — none;
- add **production wiring** — none.

> The `StorageAdapter` swap-in seam is unchanged, with no production-adapter proposal made against it
> (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

---

## 6. Separation decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`**:

1. **It is `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`** — the Phase 49C File 1 EQ-5 / EQ-6 answers hold adapter
   proposal and implementation separate; this gate records that as a standing separation rule (§2 ladder, §3
   non-implication rules, §4 only-naming-authorized, §5 explicit prohibitions). The separation is recorded above.
2. **It is *not* `ADAPTER_IMPLEMENTATION_SEPARATION_HELD`** — a held result would apply only if the separation
   could not be stated (for example, if the EQ-5 / EQ-6 responses were missing or contradictory). The responses
   are recorded and consistent, so the separation is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_ADAPTER_IMPLEMENTATION_SEPARATION_AMBIGUOUS`** — a patch result would apply if the
   separation were ambiguous, internally inconsistent, or impossible to record without amendment. The separation
   is unambiguous and bounded: adapter proposal and implementation each remain separate later authorities, and
   neither is granted here. No patch is required.

> **Separation-recorded ≠ adapter proposed ≠ implementation authorized ≠ host accepted ≠ gate #8 satisfaction.**
> Recording `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` is the result of *this separation gate only*. It proposes
> no adapter, authorizes no implementation, selects no host, selects no production database, and names no concrete
> product / vendor / engine / deployment provider. **Gate #8 remains OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: carry this separation forward.** The separation recorded here travels into the
> concrete-candidate shortlist lane (which must record an adapter / implementation separation posture per its File
> 5 template field) and into every later evidence / acceptance lane, so no later step collapses naming into
> adapter proposal or implementation.

- the **concrete-candidate shortlist** lane (File 5 template,
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md))
  inherits this separation as its "adapter / implementation separation" field;
- the later **concrete-candidate evidence** lane inherits the same separation in its adapter / implementation
  separation confirmation;
- adapter proposal and implementation each remain separate, separately-authorized requests
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`;
  `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

Any follow-on PR title must carry its phase label, e.g. `Phase 49D: concrete-candidate shortlist` *(docs-only)*.

---

## 8. Preserved blocked state

This gate preserves every held/open state unchanged:

- **Gate #8** remains **`OPEN / HELD`** — not discharged; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **Gate #9** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **Gate #10** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
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

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This adapter /
implementation separation gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not propose** a production adapter — adapter proposal remains a later, separate request (EQ-5);
- **does not authorize** implementation — implementation remains a later, separate request (EQ-6);
- **does not design** an adapter, write source, tests, migrations, SQL, config, or CI;
- **does not add** runtime wiring, deployment steps, or production wiring;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **names no product / vendor / engine / deployment provider** — none is named at any grain;
- **accepts no candidate** — acceptance requires a separate acceptance gate (EQ-3).

> Every notion above appears in this document only inside a negation. Recording an adapter / implementation
> separation is not proposing any adapter, authorizing any implementation, accepting any candidate, selecting any
> host, selecting any production database, naming any product / vendor / engine / deployment provider, or
> satisfying any gate.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49C (File 3 of 5) — gate #8 adapter / implementation separation gate (docs-only) |
| **Predecessor** | Phase 49C File 1 — recorded `EXACT_GRAIN_AUTHORITY_PARTIAL`; EQ-5 adapter separate, EQ-6 implementation separate |
| **Decision result** | **`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`** — adapter proposal and implementation each remain separate later authorities, and neither concrete candidate naming nor later acceptance implies either; not `ADAPTER_IMPLEMENTATION_SEPARATION_HELD` (the separation is statable and recorded), not `PATCH_REQUIRED_ADAPTER_IMPLEMENTATION_SEPARATION_AMBIGUOUS` (the separation is unambiguous and bounded) |
| **Authority ladder** | exact-grain naming authority (partial); concrete candidate evaluation authority (later); concrete candidate acceptance authority (separate gate); adapter proposal authority (separate); implementation authority (separate); production wiring authority (separate) |
| **Non-implication rules** | naming does not imply adapter proposal; naming does not imply implementation; acceptance (if later allowed) does not imply implementation |
| **Only authorized later** | naming / shortlist preparation (rung 1, partial); rungs 2–6 remain withheld |
| **Forbidden in this PR** | adapter design; adapter proposal; source; tests; migrations; SQL; config; CI; runtime wiring; deployment steps; production wiring |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | carry the separation into the concrete-candidate shortlist lane and later evidence / acceptance lanes |
| **Scope of this PR** | exactly five new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Five-file change.** The branch adds exactly the five Phase 49C files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Separation recorded, nothing exercised.** §2–§5 record the ladder, the non-implication rules, the
      only-naming-authorized scope, and the explicit prohibitions; no adapter is proposed and no implementation is
      authorized.
- [ ] **Result conservative and explained.** §6 records `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` and explains
      why it is not HELD and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §7 carries the separation forward into the shortlist and later evidence / acceptance
      lanes; authorizes nothing new.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, a named product / vendor / engine candidate, a proposed
      production adapter, an accepted candidate, or implementation — each appears only inside a negation (§8, §9).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `EXACT_GRAIN_AUTHORITY_PARTIAL` (`:208`); EQ-1 (`:124`), EQ-5 adapter separate (`:183`), EQ-6 implementation
  separate (`:191`). **Entry baseline / predecessor.**
- [Phase 49C File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md) — the shortlist packet
  template whose "adapter / implementation separation" field inherits this separation.
- [Phase 49B File 2](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md) — framed EQ-5 (`:97`) and EQ-6
  (`:101`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam
  (`:79`); the Phase-5 hardening invariants (`:111`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49C File 3. Docs-only gate #8 adapter / implementation separation gate. It takes the Phase 49C File
1 EQ-5 / EQ-6 answers and records, as a standing separation rule, that gate #8 progress moves through a ladder of
separate authorities (exact-grain naming; concrete candidate evaluation; concrete candidate acceptance; adapter
proposal; implementation; production wiring), that concrete candidate naming implies neither adapter proposal nor
implementation, and that concrete candidate acceptance — if a separate gate later allows it — still does not imply
implementation. Only naming / shortlist preparation is authorized later, and only partially; rungs 2–6 remain
withheld. It explicitly forbids adapter design, adapter proposal, source, tests, migrations, SQL, config, CI,
runtime wiring, deployment steps, and production wiring, and records
`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` (not `ADAPTER_IMPLEMENTATION_SEPARATION_HELD`, not
`PATCH_REQUIRED_ADAPTER_IMPLEMENTATION_SEPARATION_AMBIGUOUS`). It proposes no production adapter, authorizes no
implementation, accepts no candidate, selects no host, selects no production database, and names no product /
vendor / engine / deployment provider. The selected next lane carries the separation into the concrete-candidate
shortlist and later evidence / acceptance lanes. No commit, no push, no PR.*
