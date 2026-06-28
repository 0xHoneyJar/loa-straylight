# Phase 49A — ADR-022E Gate #8 Concrete-Grain Authority Response Intake Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49A (File 1 of 3)** — docs-only **concrete-grain authority response intake** gate for the
> canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / response-intake only.** Phase 48Z File 2 recorded
> **`CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:13`) and framed five bounded questions
> (CQ-1 … CQ-5) for a separate architecture / product authority to decide whether gate #8 work may move beyond
> substrate-class grain. This file **intakes the authority's response**: it restates CQ-1 … CQ-5, records the
> response exactly as received, and records **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`**. It **records a response; it
> does not act on it.** It selects **no** concrete physical host, selects **no** production database, names
> **no** product / vendor / engine / deployment provider, proposes **no** production adapter, and authorizes
> **no** implementation. The only change on this branch is **three** new Markdown files under `docs/`. No source,
> test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`,
> `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and
is **not** numbered `ADR-049A` — following the live convention for the question / answer / request / intake /
acceptance / decision / authorization / evidence / routing gates across the Phase 48 family (the immediate
predecessor Phase 48Z sits at top-level `docs/` for the same reason). It records a bounded **authority response
intake** at architecture-boundary / concrete-grain *authorization* level — it intakes whether candidate-class
evaluation may proceed; it does **not** itself evaluate any class, name any concrete host, or move the candidate
beyond substrate-class grain. Neither top-level `docs/` nor `docs/decisions/` carries an ADR/packet register that
enumerates this family, so none is created or modified (verified by inspection).

This is **File 1 of 3** in Phase 49A. The companions are:

2. **The concrete-grain candidate-class decomposition gate**
   ([`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md))
   — which takes the response recorded here and decomposes the authorized candidate classes (A–D), maps each to
   `P-1 … P-11`, and routes a later docs-only candidate-class *evaluation* lane. It evaluates **nothing** here.
3. **The concrete-host candidate evidence packet template**
   ([`./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md))
   — a bounded template / checklist a later candidate-class evaluation PR copies and fills. It carries **no**
   result of its own.

---

## 1. Source context (Phase 48N → Phase 48Z, restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N** | **Merged** (`loa-straylight` PR #85). Recorded both sibling evidence results (`PARTIAL_RECORDED` ×2) and the evidence-return routing as `RECORDED`. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Phase 48P** | **Merged** (`loa-straylight` PR #86). Decomposed D.1(ii) / gate #8 into `P-1 … P-11` and pinned the gate-#8-closure evidence shape at `P-11`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152` |
| **Phase 48Q** | **Merged** (`loa-straylight` PR #87). Recorded **`NO_DECISION_UPSTREAM_QUESTION_REQUIRED`** and routed **UQ-1** / **UQ-2**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112` |
| **Phase 48R** | **Merged** (`loa-straylight` PR #88). Framed **UQ-1** (S2 ownership / placement model) and **UQ-2** (the candidate-naming grain under no-leak). | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md:99` |
| **Phase 48S** | **Merged** (`loa-straylight` PR #89). Recorded **`NO_LOCAL_UPSTREAM_ANSWER_SUPPORTED`** — local docs supply constraints, not answers. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-ANSWER-CANDIDATE-GATE.md:227` |
| **Phase 48T** | **Merged** (`loa-straylight` PR #90). Issued the bounded architecture-authority request and recorded **`ARCHITECTURE_AUTHORITY_REQUEST_RECORDED`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-REQUEST-GATE.md:287` |
| **Phase 48U** | **Merged** (`loa-straylight` PR #92). Recorded the UQ-1 / UQ-2 answer tokens and recorded **`AUTHORITY_ANSWER_PROVIDED_FOR_UQ_1_AND_UQ_2`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:151` |
| **Phase 48V** | **Merged** (`loa-straylight` PR #94). Accepted the recorded answer pair as sufficient input for the host-candidate retry and recorded **`UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243` |
| **Phase 48W** | **Merged** (`loa-straylight` PR #95). Retried the candidate decision against `P-1 … P-11` at substrate-class grain, **selected** the candidate, and recorded **`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:170` |
| **Phase 48X** | **Merged** (`loa-straylight` PR #96). Recorded **`SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED`**, attached a bounded evidence requirement to each `P-1 … P-11` row, shipped the evidence packet template, and selected the docs-only evidence-result lane. | `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-AUTHORIZATION-GATE.md:185`; `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-AUTHORIZATION-GATE.md:224` |
| **Phase 48Y** | **Merged** (`loa-straylight` PR #97). File 1 recorded **`SUBSTRATE_CLASS_EVIDENCE_PARTIAL`** (`P-1` PASS at substrate-class grain, `P-10` PASS at wording-boundary grain, `P-11` PASS at template/checklist grain, `P-2 … P-9` NOT_DISCHARGED); File 2 recorded **`GATE_8_RESIDUAL_GAP_ROUTED`**. | `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-RESULT-GATE.md:292`; `docs/ADR-022E-CANONICAL-STORE-GATE-8-RESIDUAL-GAP-ROUTING-GATE.md:190` |
| **Phase 48Z (File 1)** | **Merged** (`loa-straylight` PR #100). Reviewed gate #8 satisfaction-readiness at substrate-class grain and recorded **`GATE_8_SATISFACTION_NOT_READY_AT_SUBSTRATE_CLASS_GRAIN`** — a further authority decision is needed before concrete physical-host selection / evidence can be pursued. | `docs/ADR-022E-GATE-8-SATISFACTION-READINESS-REVIEW-GATE.md:288`; `docs/ADR-022E-GATE-8-SATISFACTION-READINESS-REVIEW-GATE.md:317` |
| **Phase 48Z (File 2)** | **Merged** (`loa-straylight` PR #100). Framed CQ-1 … CQ-5 for architecture / product authority, listed the response-shape placeholders, and recorded **`CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED`**; selected a docs-only concrete-grain authority *response intake* gate as the next lane. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:13`; `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:202` |
| **Entry baseline** | **`CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED`** — the concrete-grain authority request is recorded and its CQ-1 … CQ-5 are framed and bounded; gate #8 is **OPEN / HELD**; the authority grain remains substrate-class / architecture-boundary only until a response says otherwise. **Request recorded, response not yet intook.** | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:13`; `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:99` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 48Z File 2's `CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED` is the entry baseline;
> this gate intakes the response that request called for — and goes no further.

---

## 2. Candidate identity (restated, not changed)

The response concerns the single candidate Phase 48W selected, Phase 48X authorized an evidence lane against,
Phase 48Y classified evidence for, and Phase 48Z found not ready for gate #8 satisfaction at substrate-class
grain:

| Field | Value |
|-------|-------|
| **Candidate label** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`) |
| **Ownership boundary** | **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`** (the UQ-1 accepted placement model — `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`) |
| **Semantic owner** | `loa-straylight` — permanent; ownership does not follow location (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`) |
| **Candidate grain (entry)** | architecture-boundary / substrate-class only — role / responsibility / required capability, **not** product / vendor / engine / deployment provider / database implementation (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`) |

**Sibling surfaces (non-canonical, preserved).** `loa-finn` (runtime / execution), `loa-dixie` (route-side
ingress / control-plane), and `loa-hounfour` (schema / validation / policy) remain non-canonical participant
surfaces only; none owns the canonical estate record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`; `docs/handoffs/finn-runtime-boundary.md:59`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). No sibling-repo PR may merge
without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 3. Requested questions (Phase 48Z File 2, restated, not changed)

Phase 48Z File 2 framed five bounded questions for the architecture / product authority
(`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:99`). They are restated here exactly so the
response in §4 can be read against the question it answers; none is re-framed:

- **CQ-1 — may work proceed beyond substrate-class grain?** May gate #8 work proceed beyond substrate-class grain
  to concrete physical-host candidate work?
- **CQ-2 — if yes, what concrete-grain decision class is allowed?** Which concrete-grain decision class is
  permitted: product class, engine class, vendor class, deployment-provider class, managed-service class,
  self-hosted class, or another bounded class?
- **CQ-3 — what evidence shape is required before a concrete host can be accepted?** What evidence shape must a
  concrete host carry before it can be accepted?
- **CQ-4 — must sibling owners or external repos participate?** Must sibling owners or external repos participate
  before concrete host selection, and if so, through which acceptance gate?
- **CQ-5 — does concrete-grain authority include implementation authorization?** Does any granted concrete-grain
  authority include implementation authorization, or must implementation remain a later, separate request?

---

## 4. Authority response (recorded exactly, not advanced)

The architecture / product authority returned a **partial** response. Each answer is recorded against the
question it answers; nothing is added, broadened, or acted upon here.

### 4.1 CQ-1 response — proceed only into bounded candidate-class evaluation

- **Answer: yes — gate #8 work may proceed beyond substrate-class grain, but only into bounded concrete-grain
  *candidate-class evaluation*, not implementation.** The corridor opens by exactly one box: from
  *substrate-class candidate selected / not-ready-at-substrate-class-grain* to *candidate-class evaluation
  authorized*. It does **not** open onto concrete host selection, a production-database selection, an adapter
  proposal, or implementation. The canonical-store physical host remains **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

### 4.2 CQ-2 response — four authorized concrete-grain decision classes

- **Answer: the authorized concrete-grain decision classes are exactly four —** evaluation may consider these
  *classes*, never a concrete member of any of them, until a later authority response explicitly allows that
  exact grain:
  - **database engine class** — the class of durable-store engine *kinds*, evaluated as a class only;
  - **deployment-provider class** — the class of where/how the substrate is *operated*, evaluated as a class
    only;
  - **managed-service vs self-hosted class** — the operational-ownership axis, evaluated as a class only;
  - **evidence-shape class** — the class of *what evidence a concrete host would have to carry*, evaluated as a
    class only.
- **Boundary recorded with the answer.** This authorizes reasoning *about* these classes; it does **not** name a
  product / vendor / engine / deployment provider, and it does **not** narrow the accepted UQ-2 candidate-naming
  grain into a concrete member (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`).

### 4.3 CQ-3 response — evidence obligations across `P-1 … P-11`

- **Answer: evidence for any later concrete-host candidate must show, across the existing `P-1 … P-11`
  decomposition** (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`): durability
  (`P-2`), isolation (`P-3`), migration / schema ownership (`P-4`), runtime writer boundary (`P-5`),
  recall / read boundary (`P-6`), audit / receipt persistence (`P-7`), recovery (`P-8`), auth / signer authority
  (`P-9`), no-leak projection (`P-10`), and test / evidence shape (`P-11`), all under preserved candidate
  identity / ownership (`P-1`). The response **reuses** the Phase 48P decomposition; it invents no new
  evidence structure and produces no evidence here.

### 4.4 CQ-4 response — no sibling participation before candidate-class evaluation

- **Answer: sibling owners do not need to participate before candidate-class evaluation.** Candidate-class
  evaluation is internal substrate-class reasoning and does not yet touch a sibling runtime / route boundary.
- **Later qualifier recorded:** `loa-finn` / `loa-dixie` may need later owner evidence before any runtime /
  boundary acceptance, through a separate acceptance gate; no sibling-repo PR may merge without teammate review
  (`docs/handoffs/cross-repo-handoff-index.md:28`; `docs/handoffs/finn-runtime-boundary.md:59`).

### 4.5 CQ-5 response — implementation remains separate

- **Answer: concrete-grain authority does *not* include implementation authorization. Implementation remains a
  later, separate request.** No source / test / runtime / config / package / CI / schema / migration / SQL change
  and no production wiring is authorized by this response; the `StorageAdapter` swap-in seam and the MVP adapters
  are unchanged (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

> **Response recorded ≠ response acted upon.** §4 records what the authority returned. It evaluates no class,
> names no concrete host, proposes no adapter, and authorizes no implementation. The acting on this response —
> the decomposition of the authorized classes — is the companion File 2, and even that only *routes* a later
> evaluation lane.

---

## 5. Why this is partial, not full

The response result is **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`** — a bounded grant of candidate-class evaluation
authority, not a full concrete-grain authority. It is partial because:

1. **It grants candidate-class evaluation authority** (CQ-1, CQ-2) — gate #8 work may proceed from
   substrate-class grain into bounded evaluation of the four authorized classes (database engine class,
   deployment-provider class, managed-service vs self-hosted class, evidence-shape class).
2. **It does not grant implementation authority** (CQ-5) — implementation remains separate; no source / test /
   runtime / config / package / CI / schema / migration / SQL change and no production wiring is authorized
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).
3. **It does not select a concrete host / product / vendor / engine / deployment provider** — evaluation is at
   *class* grain only; the canonical-store physical host remains **UNSELECTED**
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
4. **It does not satisfy gate #8** — gate #8's trigger is a *proposed production adapter* + the sibling-repo
   handoff citation + preserved ADR-022D invariants, a separate, later, separately-reviewed lane
   (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`). Gate #8 remains
   **OPEN / HELD**.

The result is recorded against the permitted response results for this intake gate:

- **It is `CONCRETE_GRAIN_AUTHORITY_PARTIAL`** — the authority granted bounded candidate-class evaluation
  authority while withholding host selection and implementation authorization; this is recorded above.
- **It is *not* `CONCRETE_GRAIN_AUTHORITY_GRANTED`** — a granted result would record an unbounded concrete-grain
  authority (including, at minimum, the authority to select a concrete host). The response explicitly bounds the
  grant to candidate-class evaluation and withholds host selection and implementation, so a full grant is not
  supportable.
- **It is *not* `CONCRETE_GRAIN_AUTHORITY_DEFERRED`** — a deferred result would record that the authority
  declined to decide now. The authority decided: it granted bounded evaluation authority. So it is not deferred.
- **It is *not* `CONCRETE_GRAIN_AUTHORITY_REJECTED`** — a rejected result would record that no concrete-grain
  work was permitted. CQ-1 was answered yes (bounded), so it is not rejected.
- **It is *not* `PATCH_REQUIRED_AUTHORITY_RESPONSE_AMBIGUOUS`** — a patch result would apply if the response were
  ambiguous, internally inconsistent, or impossible to record without amendment. The response is unambiguous and
  bounded: CQ-1 yes (evaluation only), CQ-2 four named classes, CQ-3 `P-1 … P-11` obligations, CQ-4 no sibling
  participation before evaluation, CQ-5 implementation separate. No patch is required.

> **Partial-recorded ≠ authority-to-implement ≠ host selection ≠ gate #8 satisfaction.** Recording
> `CONCRETE_GRAIN_AUTHORITY_PARTIAL` is the result of *this response intake gate only*. It authorizes
> candidate-class *evaluation* and nothing more — it selects no host, selects no production database, names no
> product / vendor / engine / deployment provider, proposes no adapter, and authorizes no implementation.
> **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: the Phase 49A concrete-grain candidate-class decomposition gate (File 2 of this PR).**
> Because the authority granted bounded candidate-class evaluation authority (CQ-1, CQ-2), the next docs-only step
> decomposes the four authorized classes (A–D), maps each to `P-1 … P-11`, defines the candidate-class evaluation
> outputs a still-later lane may record, and routes a docs-only candidate-class *evaluation* gate.

- **File 2 reference**:
  [`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md).
- File 2 **decomposes the authorized classes**; it does **not** select a concrete host, does **not** select a
  production database, does **not** name a product / vendor / engine / deployment provider, does **not** propose
  a production adapter, and does **not** authorize implementation.
- **File 3 reference** (the companion template):
  [`./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md)
  — a template / checklist a later candidate-class evaluation PR copies and fills. It carries no result.

Any follow-on PR title must carry its phase label, e.g.
`Phase 49B: concrete-grain candidate-class evaluation` *(docs-only)*.

---

## 7. Preserved blocked state

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

## 8. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
concrete-grain authority response intake gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not grant implementation authority** — implementation remains a later, separate request (CQ-5);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **selects no product / vendor / engine / deployment provider** — none is named;
- **evaluates no candidate class** — it records the authority that *permits* later evaluation; the evaluation
  itself is a later lane;
- **proposes no production adapter** — none is proposed here;
- **authorizes no implementation** of any kind;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Recording a concrete-grain authority
> response is not acting on it, granting implementation authority, satisfying any gate, resolving any dependency,
> selecting any host, selecting any production database, naming any product / vendor / engine / deployment
> provider, proposing any adapter, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49A (File 1 of 3) — gate #8 concrete-grain authority response intake gate (docs-only) |
| **Predecessor** | Phase 48Z File 2 (merged, PR #100) — recorded `CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED`; selected this response intake gate |
| **Decision result** | **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`** — the authority granted bounded candidate-class evaluation authority (CQ-1, CQ-2) while withholding host selection and implementation authorization (CQ-5); not `CONCRETE_GRAIN_AUTHORITY_GRANTED` (host selection withheld), not `_DEFERRED` (a decision was made), not `_REJECTED` (CQ-1 answered yes), not `PATCH_REQUIRED_AUTHORITY_RESPONSE_AMBIGUOUS` (response unambiguous and bounded) |
| **CQ-1 response** | yes — proceed beyond substrate-class grain only into bounded concrete-grain candidate-class evaluation, not implementation |
| **CQ-2 response** | authorized classes: database engine class; deployment-provider class; managed-service vs self-hosted class; evidence-shape class (classes only, no concrete member named) |
| **CQ-3 response** | evidence must show durability, isolation, migration / schema ownership, writer boundary, recall / read boundary, audit / receipt persistence, recovery, auth / signer authority, no-leak projection, and test / evidence shape — across `P-1 … P-11` |
| **CQ-4 response** | no sibling owner participation required before candidate-class evaluation; Finn / Dixie may need later owner evidence before runtime / boundary acceptance |
| **CQ-5 response** | implementation remains separate — concrete-grain authority does not include implementation authorization |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight`; architecture-boundary / substrate-class grain (entry) |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | Phase 49A File 2 — the concrete-grain candidate-class decomposition gate; decomposes the authorized classes and routes a later candidate-class evaluation lane; does not select a host or implement |
| **Scope of this PR** | exactly three new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Three-file change.** The branch adds exactly three new files,
      `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`,
      `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md`, and
      `docs/ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md`, and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Response intook, not acted upon.** §3 restates CQ-1 … CQ-5; §4 records the response exactly; the
      evaluation itself is routed to File 2 and a still-later lane.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_GRAIN_AUTHORITY_PARTIAL` and explains why it is
      not GRANTED, not DEFERRED, not REJECTED, and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 selects the docs-only candidate-class decomposition gate that decomposes the
      authorized classes and must not select a host or implement.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, production-database selection, a named product / vendor /
      engine candidate, a proposed production adapter, granted implementation authority, or implementation — each
      appears only inside a negation (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no
      sibling repo written to.

---

## 11. Source references

- [Phase 48Z File 2](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md) — recorded
  `CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED` (`:13`); framed CQ-1 … CQ-5 (`:99`); selected this response intake
  gate (`:202`). **Entry baseline / predecessor.**
- [Phase 48Z File 1](./ADR-022E-GATE-8-SATISFACTION-READINESS-REVIEW-GATE.md) — recorded
  `GATE_8_SATISFACTION_NOT_READY_AT_SUBSTRATE_CLASS_GRAIN` (`:288`); stated a further authority decision is needed
  (`:317`).
- [Phase 48Y File 1](./ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-RESULT-GATE.md) — recorded
  `SUBSTRATE_CLASS_EVIDENCE_PARTIAL` (`:292`).
- [Phase 48Y File 2](./ADR-022E-CANONICAL-STORE-GATE-8-RESIDUAL-GAP-ROUTING-GATE.md) — recorded
  `GATE_8_RESIDUAL_GAP_ROUTED` (`:190`).
- [Phase 48X gate](./ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-AUTHORIZATION-GATE.md) — recorded
  `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED` (`:185`); selected the evidence-result lane (`:224`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — selected the
  substrate-class candidate (`:170`); named it at substrate-class grain (`:108`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`) and the accepted UQ-2 candidate-naming grain (substrate-class only, not
  product / vendor / engine / deployment) (`:139`); `AUTHORITY_ANSWER_PROVIDED_FOR_UQ_1_AND_UQ_2` (`:151`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); the S5 route-side row (`:159`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam
  (`:79`); the Phase-5 hardening invariants (`:111`); the receipt + audit-chain invariants any future host must
  preserve (`:171`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — the surfaces stay separable in code, test,
  and fixture (`:18`); Finn applies transitions through the wedge's `EstateStore` (`:59`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49A File 1. Docs-only gate #8 concrete-grain authority response intake gate. It restates the Phase
48Z File 2 questions CQ-1 … CQ-5, records the authority's response exactly (CQ-1 yes / bounded candidate-class
evaluation only, not implementation; CQ-2 four authorized classes — database engine class, deployment-provider
class, managed-service vs self-hosted class, evidence-shape class; CQ-3 evidence obligations across `P-1 … P-11`;
CQ-4 no sibling participation required before candidate-class evaluation, with Finn / Dixie owner evidence
possibly needed later before runtime / boundary acceptance; CQ-5 implementation remains separate), and records
`CONCRETE_GRAIN_AUTHORITY_PARTIAL` (not `_GRANTED`, not `_DEFERRED`, not `_REJECTED`, not
`PATCH_REQUIRED_AUTHORITY_RESPONSE_AMBIGUOUS`). The response is partial: it grants candidate-class evaluation
authority only — it does not grant implementation authority, does not select a concrete host / product / vendor /
engine / deployment provider, does not select a production database, proposes no adapter, and does not satisfy
gate #8. The selected next lane is the Phase 49A File 2 concrete-grain candidate-class decomposition gate. No
commit, no push, no PR.*
