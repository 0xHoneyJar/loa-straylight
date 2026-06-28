# Phase 49B — ADR-022E Gate #8 Exact-Grain Authority-Request Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49B (File 2 of 4)** — docs-only **exact-grain authority request** gate for the canonical-store
> substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / authority-request only.** Phase 49A File 1 granted bounded **candidate-class** evaluation
> authority (`CONCRETE_GRAIN_AUTHORITY_PARTIAL`) while withholding host selection, exact-grain naming, and
> implementation; Phase 49B File 1 evaluated the four authorized classes and recorded
> **`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`** — the classes are useful and evaluable but cannot discharge
> `P-2 … P-10` without **exact-grain evidence**, and exact-grain evidence requires **exact-grain authority** that
> the current partial authority does not grant
> ([`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md)).
> This file **records the request** for exact-grain authority: it explains why exact-grain authority is needed,
> frames the requested questions (EQ-1 … EQ-6), lists the response-shape placeholders, requests preservation
> constraints for any positive answer, and records **`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`**. It **records a
> request; it does not answer it, and it grants no authority.** It selects **no** concrete physical host, names
> **no** product / vendor / engine / deployment provider, proposes **no** production adapter, and authorizes
> **no** implementation. The only change on this branch is **four** new Markdown files under `docs/`. No source,
> test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`,
> `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049B` — following the live convention for the Phase 48 / 49 family. It records a bounded
**authority request** at exact-grain / concrete-candidate-naming level: it asks whether a *later* PR may name
concrete product / vendor / engine / provider candidates. It does **not** itself name any, and it does **not**
grant the authority it requests. The immediate predecessor is **Phase 49B File 1**
([`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md)),
which recorded `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`.

This is **File 2 of 4** in Phase 49B.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49A File 1 — partial authority** | Recorded **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`** — bounded **candidate-class** evaluation authority granted (CQ-1, CQ-2); host selection, exact-grain naming, and implementation withheld (CQ-5). | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:170` |
| **Phase 49A File 2 — candidate-class decomposition** | Recorded **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`** — decomposed Classes A–D, mapped each to `P-1 … P-11`, routed a candidate-class evaluation lane. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md:227` |
| **Phase 49B File 1 — candidate-class evaluation** | Recorded **`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`** — the four classes are useful and evaluable but cannot discharge `P-2 … P-10` at class grain (they need exact-grain evidence), and `P-11` is template / checklist only. | [`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md) §4–§6 |
| **`P-1 … P-11` decomposition** | Defined in Phase 48P; the gate-#8-closure shape pinned at `P-11`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**; semantic owner `loa-straylight`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. The Phase 49B File 1 `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` result is the entry
> baseline; this gate records the exact-grain authority request that result calls for — and goes no further.

---

## 2. Why exact-grain authority is needed

The Phase 49A authority response granted only **candidate-class** evaluation authority — reasoning *about* the
four classes, never naming a concrete member
(`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:170`). Phase 49B File 1 evaluated those
classes and found them useful but not sufficient. Exact-grain authority is needed for three concrete reasons:

1. **Class-grain evaluation cannot discharge `P-2 … P-10`.** Each of these obligations — durability (`P-2`),
   isolation (`P-3`), migration / schema ownership (`P-4`), runtime writer boundary (`P-5`), read / recall
   boundary (`P-6`), audit / receipt persistence (`P-7`), failure / rollback / recovery (`P-8`), permission /
   auth / signer authority (`P-9`), and no-leak / public-private projection (`P-10`) — can only be *proven* by
   evidence from a **named concrete candidate**. Class-grain reasoning scopes the requirement; it cannot satisfy
   it (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).
2. **Exact-grain evidence is required before concrete-host acceptance.** A concrete host cannot be accepted
   without evidence carried against `P-1 … P-11`, and that evidence is inherently exact-grain — it describes a
   *specific* candidate's behaviour, not a class's. The canonical-store physical host stays **UNSELECTED** until
   such evidence exists and is reviewed (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
3. **Exact-grain authority is required before naming specific candidates.** The accepted UQ-2 grain permits
   naming only at substrate-class / architecture-boundary level and **excludes** product / vendor / engine /
   deployment / credential grain (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`).
   Naming a specific product / vendor / engine / provider therefore requires a *new* authority decision beyond
   the current partial grant — the decision this request seeks.

> **Need ≠ grant.** Stating why exact-grain authority is needed is not granting it and not assuming it will be
> granted. This gate records the request; only a later authority response, intook by a separate gate, could grant
> (or partially grant, defer, or reject) it.

---

## 3. Requested exact-grain authority questions

The request frames six bounded questions for the architecture / product authority. Each is a question only; none
is answered here.

- **EQ-1 — may a later PR name concrete candidates?** May a later PR name concrete product / vendor / engine /
  deployment-provider candidates for gate #8 evaluation? (Today the accepted UQ-2 grain excludes all of these —
  `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`.)
- **EQ-2 — if yes, which exact-grain categories may be named?** If EQ-1 is answered yes, what exact-grain
  categories may be named: database engine, deployment provider, managed service, self-hosted option, storage
  substrate, account / project boundary, credential boundary, or another bounded category?
- **EQ-3 — compare multiple candidates, or one at a time?** May a later PR compare multiple concrete candidates,
  or must it select / evaluate one candidate at a time?
- **EQ-4 — what evidence is required before a named candidate can be accepted?** What evidence must a named
  concrete candidate carry, across `P-1 … P-11`, before it can be accepted? (Today the gate-#8-closure shape is
  pinned at Phase 48P `P-11` as a *proposed production adapter* + the sibling-repo handoff citation —
  `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`;
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`.)
- **EQ-5 — does exact-grain authority include adapter-proposal permission?** Does any granted exact-grain
  authority include permission to propose a production adapter, or must adapter proposal remain a later, separate
  request? (Today no adapter is proposed and the `StorageAdapter` swap-in seam is unchanged —
  `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`.)
- **EQ-6 — does exact-grain authority include implementation authorization?** Does any granted exact-grain
  authority include implementation authorization, or must implementation remain a later, separate request? (Today
  implementation is unauthorized — `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`.)

---

## 4. Permitted response shapes (placeholders — not this PR's result)

A later, separate exact-grain authority-response intake gate would record the authority's answer using exactly
one of the following tokens. **These tokens are placeholders for a later authority response; none is this PR's
result, and recording them here neither selects a token nor pre-commits the authority to one:**

- `EXACT_GRAIN_AUTHORITY_GRANTED` — *placeholder.* The later lane would record this if the authority permits
  concrete-candidate naming and exact-grain evaluation (within whatever bound EQ-2 fixes).
- `EXACT_GRAIN_AUTHORITY_PARTIAL` — *placeholder.* The later lane would record this if the authority permits only
  a bounded subset of exact-grain work.
- `EXACT_GRAIN_AUTHORITY_DEFERRED` — *placeholder.* The later lane would record this if the authority defers the
  decision.
- `EXACT_GRAIN_AUTHORITY_REJECTED` — *placeholder.* The later lane would record this if the authority declines to
  permit any exact-grain work.
- `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_RESPONSE_AMBIGUOUS` — *placeholder.* The later lane would record this if
  the response could not be recorded without amendment.

> **Placeholder ≠ result.** This PR's result is `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` (§6). The five tokens
> above are the *shapes a later authority response may take* — they are not selected, assumed, or recorded as an
> answer here. Listing a response shape is not receiving that response.

---

## 5. Requested constraints for any positive answer

If a later authority response is positive (in whole or in part), the request asks that the following constraints
be preserved. These are **requested constraints**, not grants:

- **Preserve `loa-straylight` semantic ownership** unless explicitly changed — ownership does not follow location
  (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`).
- **Preserve the no-leak / public-private boundary** — the forbidden-grain / no-leak boundary stays intact
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`;
  `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:111`).
- **Preserve sibling non-canonical status** unless separately authorized — `loa-finn` / `loa-dixie` /
  `loa-hounfour` remain non-canonical participant surfaces
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`;
  `docs/handoffs/finn-runtime-boundary.md:18`).
- **Avoid implementation until separately authorized** — no source / test / runtime / config / package / CI /
  schema / migration / SQL change and no production wiring until a separate implementation authorization
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).
- **Avoid adapter proposal until separately authorized** — proposing a production adapter is the ADR-048C `M5`
  gate-#8-closure shape, reserved for a separate, later, separately-reviewed lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
- **Require reviewed evidence before any gate #8 satisfaction** — gate #8's trigger is a *proposed production
  adapter* + the sibling-repo handoff citation + preserved ADR-022D invariants, a separate, reviewed lane
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
- **Require separate gate #8 acceptance before D.1(ii) is considered resolved** — D.1(ii) remains unresolved
  until gate #8 is separately satisfied and accepted
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`).

---

## 6. Request decision and rationale

The request result is recorded against the permitted results for this gate, and the conservative-but-accurate
result is **`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`**:

1. **It is `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`** — Phase 49B File 1 found the classes useful but not
   sufficient without exact-grain authority; this gate explains why exact-grain authority is needed (§2), frames
   that decision as a bounded request (EQ-1 … EQ-6, §3), lists the response shapes a later lane may record (§4),
   and requests preservation constraints (§5). The request is recorded above.
2. **It is *not* `EXACT_GRAIN_AUTHORITY_REQUEST_HELD`** — a held result would apply only if the request could not
   even be framed (for example, if the candidate-class evaluation input were missing or the questions were
   unformable). The evaluation result is recorded and the questions are formable and bounded, so the request is
   recorded, not held.
3. **It is *not* `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_REQUEST_AMBIGUOUS`** — a patch result would apply if the
   request were ambiguous, internally inconsistent, or impossible to record without amendment. The request and
   its grain are unambiguous and bounded: it asks whether a *later* PR may name concrete candidates and does not
   itself name any. No patch is required.

> **Request-recorded ≠ authority granted ≠ concrete naming ≠ gate #8 satisfaction ≠ host selection.** Recording
> `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` is the result of *this request gate only*. It answers no request,
> grants no authority, names no concrete product / vendor / engine / deployment provider, selects no host,
> proposes no adapter, satisfies no gate, and authorizes no implementation. **Gate #8 remains OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: a docs-only exact-grain authority *response intake* gate.** That later lane records the
> architecture / product authority response (one of the §4 placeholder tokens) once it is received.

That selected next lane:

- **records the authority response** — it intakes one of the §4 response-shape tokens and the authority's
  reasoning;
- **must not name a concrete candidate** unless the authority response **explicitly** permits that exact grain
  **and** the artifact is scoped to *accept* the response, not to act on it
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`);
- **must not propose a production adapter** — adapter proposal remains a separate request (EQ-5), reserved for a
  later separately-reviewed lane (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **must not implement** — implementation remains a separate request (EQ-6); it authorizes no source / test /
  runtime / config / package / CI / schema / migration / SQL change and no production wiring
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

If (and only if) the response grants or partially grants exact-grain authority, a still-later PR may copy the
File 4 evidence packet template
([`./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md))
and fill it under whatever bound the response fixes, carrying the File 3 sibling-evidence requirements
([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md)).
Any follow-on PR title must carry its phase label, e.g. `Phase 49C: exact-grain authority response intake`
*(docs-only)*.

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

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This exact-grain
authority-request gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not answer** the exact-grain authority request — it records the request only;
- **does not grant or assume** exact-grain authority;
- **names no concrete product / vendor / engine / deployment provider** — none is named at any grain;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a separate request (EQ-5);
- **authorizes no implementation** of any kind — implementation remains a separate request (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Recording an exact-grain authority request
> is not answering it, granting any authority, naming any concrete product / vendor / engine / deployment
> provider, selecting any host, selecting any production database, proposing any adapter, satisfying any gate, or
> authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49B (File 2 of 4) — gate #8 exact-grain authority-request gate (docs-only) |
| **Predecessor** | Phase 49B File 1 — recorded `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`; identified the need for exact-grain authority |
| **Decision result** | **`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`** — the need for exact-grain authority is framed as a bounded request (EQ-1 … EQ-6) and recorded; not `EXACT_GRAIN_AUTHORITY_REQUEST_HELD` (the request is formable and recorded); not `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_REQUEST_AMBIGUOUS` (the request is unambiguous and bounded) |
| **Requested questions** | EQ-1 (may a later PR name concrete candidates); EQ-2 (which exact-grain categories may be named); EQ-3 (compare multiple candidates or one at a time); EQ-4 (evidence required before a named candidate can be accepted); EQ-5 (does exact-grain authority include adapter-proposal permission); EQ-6 (does exact-grain authority include implementation authorization) |
| **Response shapes (placeholders)** | `EXACT_GRAIN_AUTHORITY_GRANTED` / `_PARTIAL` / `_DEFERRED` / `_REJECTED` / `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_RESPONSE_AMBIGUOUS` — placeholders for a later authority response, not this PR's result |
| **Requested constraints (positive answer)** | preserve `loa-straylight` semantic ownership; preserve no-leak / public-private boundary; preserve sibling non-canonical status; avoid implementation until separately authorized; avoid adapter proposal until separately authorized; require reviewed evidence before any gate #8 satisfaction; require separate gate #8 acceptance before D.1(ii) is considered resolved |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only exact-grain authority *response intake* gate; records the authority response; must not name a concrete candidate, propose an adapter, or implement unless the response explicitly permits and the artifact only accepts it |
| **Scope of this PR** | exactly four new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Four-file change.** The branch adds exactly the four Phase 49B files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Request framed, not answered.** §2 / §3 frame the request and EQ-1 … EQ-6; §4 lists response-shape
      placeholders without selecting one; the request is recorded, not answered.
- [ ] **Constraints requested, not granted.** §5 lists requested constraints for any later positive answer; no
      authority is granted here.
- [ ] **Result conservative and explained.** §6 records `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` and explains why
      it is not HELD and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §7 selects a docs-only authority *response intake* gate that must not name a
      concrete candidate, propose an adapter, or implement unless the response explicitly permits and the artifact
      only accepts it.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, a named product / vendor / engine candidate, a proposed
      production adapter, an answered request, granted authority, or implementation — each appears only inside a
      negation (§8, §9).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49B File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md) — recorded
  `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`; identified the need for exact-grain authority. **Entry baseline /
  predecessor.**
- [Phase 49A File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `CONCRETE_GRAIN_AUTHORITY_PARTIAL` (`:170`) — bounded candidate-class evaluation authority only.
- [Phase 49A File 2](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md) — recorded
  `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED` (`:227`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`); the accepted UQ-2 candidate-naming grain (substrate-class only, not
  product / vendor / engine / deployment) (`:139`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — named the candidate at
  substrate-class grain (`:108`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); the S5 route-side row (`:159`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam
  (`:79`); the Phase-5 hardening invariants (`:111`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — the surfaces stay separable in code, test,
  and fixture (`:18`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49B File 2. Docs-only gate #8 exact-grain authority-request gate. It takes the Phase 49B File 1
finding `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`, explains why exact-grain authority is needed (class-grain
evaluation cannot discharge `P-2 … P-10`; exact-grain evidence is required before concrete-host acceptance;
exact-grain authority is required before naming specific product / vendor / engine / provider candidates), frames
the request (EQ-1 … EQ-6), lists the response shapes a later lane may record as placeholders, requests
preservation constraints for any positive answer, and records `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` (not
`EXACT_GRAIN_AUTHORITY_REQUEST_HELD`, not `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_REQUEST_AMBIGUOUS`). It records a
request rather than answering it, grants no authority, names no concrete product / vendor / engine / deployment
provider, selects no concrete host, selects no production database, proposes no production adapter, and authorizes
no implementation. The selected next lane is a docs-only exact-grain authority response intake gate. No commit, no
push, no PR.*
