# Phase 49B — ADR-022E Gate #8 Concrete-Grain Candidate-Class Evaluation Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49B (File 1 of 4)** — docs-only **concrete-grain candidate-class evaluation** gate for the
> canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / class-grain evaluation only.** Phase 49A File 1 recorded
> **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`** — bounded candidate-class evaluation authority across four classes, with
> host selection and implementation authorization withheld
> (`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:170`) — and Phase 49A File 2 recorded
> **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`**, decomposing those four classes (A–D), mapping each to
> `P-1 … P-11`, and routing this evaluation lane
> (`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md:227`). This file **evaluates those
> four authorized classes at class grain** against their mapped `P-row` obligations and records
> **`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`**. It **evaluates classes; it does not select a concrete member of
> any class.** It selects **no** concrete physical host, selects **no** production database, names **no** product /
> vendor / engine / deployment provider, proposes **no** production adapter, and authorizes **no** implementation.
> The only change on this branch is **four** new Markdown files under `docs/`. No source, test, runtime, route,
> storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire,
> memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049B` — following the live convention for the Phase 48 / 49 family. It records a bounded
**candidate-class evaluation** at the concrete-grain *class* level the Phase 49A authority response authorized —
classes only, never a concrete member of any class. The immediate predecessors are **Phase 49A File 1**
([`./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md))
and **Phase 49A File 2**
([`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md)).

This is **File 1 of 4** in Phase 49B. The companions are:

2. **The exact-grain authority request gate**
   ([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md))
   — records a request for exact-grain authority so a later PR may name concrete product / vendor / engine /
   provider candidates. It grants **nothing**.
3. **The sibling-evidence routing gate**
   ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md))
   — records what sibling evidence (Finn / Dixie / Hounfour) may be needed later before any gate #8 acceptance. It
   requests **no** sibling change and authorizes **no** sibling PR.
4. **The exact-grain evidence packet template**
   ([`./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md))
   — a bounded template / checklist a later PR copies and fills **after** exact-grain authority is granted or
   partially granted. It carries **no** result of its own.

---

## 1. Source context (Phase 48N → Phase 49A, restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N** | **Merged** (PR #85). Recorded both sibling evidence results as `PARTIAL_RECORDED` and the evidence-return routing as `RECORDED`. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Phase 48P** | **Merged** (PR #86). Decomposed D.1(ii) / gate #8 into `P-1 … P-11` and pinned the gate-#8-closure evidence shape at `P-11`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152` |
| **Phase 48Q** | **Merged** (PR #87). Recorded `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` and routed UQ-1 / UQ-2. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112` |
| **Phase 48R** | **Merged** (PR #88). Framed UQ-1 (S2 ownership / placement) and UQ-2 (candidate-naming grain under no-leak). | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md:99` |
| **Phase 48S** | **Merged** (PR #89). Recorded `NO_LOCAL_UPSTREAM_ANSWER_SUPPORTED`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-ANSWER-CANDIDATE-GATE.md:227` |
| **Phase 48T** | **Merged** (PR #90). Recorded `ARCHITECTURE_AUTHORITY_REQUEST_RECORDED`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-REQUEST-GATE.md:287` |
| **Phase 48U** | **Merged** (PR #92). Recorded `AUTHORITY_ANSWER_PROVIDED_FOR_UQ_1_AND_UQ_2` (UQ-1 placement model; UQ-2 substrate-class-only naming grain). | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139` |
| **Phase 48V** | **Merged** (PR #94). Recorded `UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243` |
| **Phase 48W** | **Merged** (PR #95). Selected the substrate-class candidate and recorded `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:170` |
| **Phase 48X** | **Merged** (PR #96). Recorded `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED` and shipped the substrate-class evidence packet template. | `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-AUTHORIZATION-GATE.md:185`; `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-AUTHORIZATION-GATE.md:224` |
| **Phase 48Y** | **Merged** (PR #97). Recorded `SUBSTRATE_CLASS_EVIDENCE_PARTIAL` and `GATE_8_RESIDUAL_GAP_ROUTED`. | `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-RESULT-GATE.md:292`; `docs/ADR-022E-CANONICAL-STORE-GATE-8-RESIDUAL-GAP-ROUTING-GATE.md:190` |
| **Phase 48Z** | **Merged** (PR #100). Recorded `GATE_8_SATISFACTION_NOT_READY_AT_SUBSTRATE_CLASS_GRAIN` and `CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED`. | `docs/ADR-022E-GATE-8-SATISFACTION-READINESS-REVIEW-GATE.md:288`; `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:13` |
| **Phase 49A File 1** | **Merged** (PR #101). Recorded **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`** — bounded candidate-class evaluation authority granted (CQ-1, CQ-2), host selection and implementation withheld (CQ-5). | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:170` |
| **Phase 49A File 2** | **Merged** (PR #101). Recorded **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`** — decomposed Classes A–D, mapped each to `P-1 … P-11`, and selected this evaluation lane. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md:227` |
| **Entry baseline** | **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`** — the four classes are decomposed and bounded to class grain; evaluation authority is partial; exact-grain authority is **not** granted; gate #8 is **OPEN / HELD**. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md:227` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. The Phase 49A File 2 `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED` result is the entry
> baseline; this gate evaluates the classes that decomposition bounded — and goes no further.

---

## 2. Candidate identity (restated, not changed)

| Field | Value |
|-------|-------|
| **Candidate label** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`) |
| **Ownership boundary** | **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`** (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`) |
| **Semantic owner** | `loa-straylight` — permanent; ownership does not follow location (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`) |
| **Candidate grain (entry)** | architecture-boundary / substrate-class only — role / responsibility / required capability, **not** product / vendor / engine / deployment provider / database implementation (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`) |

**Sibling surfaces (non-canonical, preserved).** `loa-finn` (runtime / execution), `loa-dixie` (route-side
ingress / control-plane), and `loa-hounfour` (schema / validation / policy) remain non-canonical participant
surfaces only; none owns the canonical estate record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`; `docs/handoffs/finn-runtime-boundary.md:59`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). No sibling-repo PR may merge
without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`). Sibling evidence needs are routed in
File 3 ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md)).

---

## 3. Evaluation scope

This gate is a **candidate-class evaluation**, the lane Phase 49A File 2 §7 routed. Its scope is fixed by the
Phase 49A File 1 `CONCRETE_GRAIN_AUTHORITY_PARTIAL` response (CQ-1, CQ-2) and the File 2 decomposition:

- **Docs-only.** The only change on this branch is four new Markdown files under `docs/`.
- **Class grain only.** It evaluates the four authorized *classes* (A–D); it names **no** concrete member of any
  class — no product / vendor / engine / deployment provider
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`).
- **Evaluates Classes A–D.** §4 reasons about each class as a *category of options* against its File 2 §4
  `P-row` mapping; it ranks no class and narrows no class to a concrete member.
- **Does not name concrete members.** "Evaluate the class" means reason about the class as a category; it
  **never** means name, select, or recommend a concrete member of that class.
- **Does not select a concrete host.** The canonical-store physical host stays **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
- **Does not authorize implementation.** It authorizes no source / test / runtime / config / package / CI /
  schema / migration / SQL change and no production wiring
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

> **Evaluation ≠ selection ≠ exact-grain authority.** Reasoning about the four classes is not selecting a member
> of any of them, not selecting a concrete host, and not the exact-grain authority a later PR would need to name
> concrete candidates. This gate moves the corridor by exactly one box — from *candidate classes decomposed* to
> *candidate classes evaluated (partial)* — and crosses into none of the later boxes.

---

## 4. Candidate-class evaluation (Classes A–D)

Each authorized class is evaluated below at *class* grain only, against the `P-row` obligations Phase 49A File 2
§4 mapped to it (`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md:138`). Throughout,
"evaluate the class" means reason about the class as a category of options; it **never** means name, select, or
recommend a concrete member.

### 4.1 Class A — database engine class

- **Why this class is necessary to evaluate.** The database engine class is the category that determines whether
  a later concrete candidate could satisfy **durability** (`P-2`), **isolation** (`P-3`), **schema / migration
  ownership** (`P-4`), **audit / receipt persistence** (`P-7`), **failure / rollback / recovery** (`P-8`), and
  **recall / read suitability** (`P-6`). These are engine-kind capability properties; they cannot be reasoned
  about without considering the engine class.
- **What the class-grain evaluation shows.** The class is **evaluable and coherent**: each mapped obligation
  corresponds to a class-level capability property that a concrete member would have to demonstrate. The
  evaluation narrows the gate #8 path by fixing *which* engine-kind properties a later concrete candidate must
  evidence.
- **Result — useful but not sufficient without exact-grain authority.** Class-grain reasoning cannot discharge
  `P-2 … P-9`: discharging them requires evidence from a *named* concrete candidate, which requires exact-grain
  authority this gate does not hold. The class is useful (it scopes the requirement) but not sufficient (it
  proves nothing). **No concrete engine / product / vendor is named.**

### 4.2 Class B — deployment-provider class

- **Why this class is necessary to evaluate.** The deployment-provider class is the category that determines
  whether a later concrete candidate could satisfy **runtime writer-boundary placement** (`P-5`), **read / recall
  boundary placement** (`P-6`), **recovery posture** (`P-8`), **auth / signer boundary** (`P-9`), and the
  **no-leak / public-private projection** (`P-10`). Where and how the substrate is operated bears directly on
  each of these boundaries.
- **What the class-grain evaluation shows.** The class is **evaluable and coherent**: each mapped obligation
  corresponds to an operating-environment property a concrete member would have to demonstrate. The evaluation
  narrows the gate #8 path by fixing *which* operating-environment properties a later concrete candidate must
  evidence.
- **Result — useful but not sufficient without exact-grain authority.** Class-grain reasoning cannot place a
  concrete writer / read boundary, prove a concrete recovery posture, or fix a concrete auth boundary without a
  named candidate, which requires exact-grain authority this gate does not hold. The class is useful but not
  sufficient. **No concrete deployment provider / region / account is named.**

### 4.3 Class C — managed-service vs self-hosted class

- **Why this class is necessary to evaluate.** The managed-service vs self-hosted class is the operational-
  ownership axis that determines **operational responsibility**, the **signer / credential boundary** (`P-9` — a
  host must never become the de-facto authority over canonical writes), **recovery posture** (`P-8`), and
  whether **Straylight semantic ownership is preserved** (`P-1`; `docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
  `docs/decisions/ADR-022A-straylight-semantic-home.md:62`).
- **What the class-grain evaluation shows.** The class is **evaluable and coherent**: the operational-ownership
  axis maps cleanly onto who holds operational responsibility and signer / credential authority, and onto the
  semantic-ownership invariant a concrete member must not violate.
- **Result — useful but not sufficient without exact-grain authority.** Class-grain reasoning cannot resolve
  *which* side of the axis a concrete candidate sits on, or prove that a named candidate preserves the signer /
  credential boundary, without exact-grain authority this gate does not hold. The class is useful but not
  sufficient. **No concrete managed service or self-hosted product is named.**

### 4.4 Class D — evidence-shape class

- **Why this class is necessary to evaluate.** The evidence-shape class is the meta-class that determines whether
  a later concrete candidate would carry **enough evidence to be accepted** — the inspectable shape against which
  `P-1 … P-11` would be judged, including the gate-#8-closure shape pinned at Phase 48P `P-11` (a *proposed
  production adapter* + the sibling-repo handoff citation), reserved for a separate, later lane
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`;
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
- **What the class-grain evaluation shows.** The class is **evaluable**, and the evidence shape is **available as
  a template / checklist** — File 4 of this PR
  ([`./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md))
  provides the exact-grain packet a later PR copies and fills.
- **Result — useful, but template / checklist only.** The class produces a *shape*, not *evidence*. A template /
  checklist defines what a later concrete candidate must carry; it does not itself carry it, fill it, or
  discharge any `P-row`. The class is useful but, by construction, only a shape until a later authorized PR fills
  it.

> Classes A–D are **categories of options**, not options. Evaluating them fixes *what a later concrete candidate
> must demonstrate* and confirms each class is coherent and bounded — and nothing more. No class is selected,
> ranked, or narrowed to a concrete member here, and no `P-row` is discharged.

---

## 5. `P-1 … P-11` class-grain mapping (what each `P-row` still needs)

Reusing the Phase 48P decomposition (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`)
and the Phase 49A File 2 class mapping
(`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md:138`), this is a statement of **what
each `P-row` still needs after class-grain evaluation** — not a proof matrix and not a validator ledger. No
evidence is produced and no `P-row` is proven, partial, or failed here.

| `P-row` | What class-grain evaluation establishes | What it still needs |
|---------|------------------------------------------|---------------------|
| **P-1 — candidate identity / ownership** | Ownership boundary remains **Straylight-owned** (`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`); **no concrete host is selected**. | nothing further at class grain — preserved as-is; a concrete candidate, if later authorized, must keep this. |
| **P-2 — durability** | The durability obligation is scoped to Class A engine-kind properties. | **exact-grain evidence** from a named concrete candidate. |
| **P-3 — isolation** | The isolation obligation is scoped to Class A engine-kind properties. | **exact-grain evidence** from a named concrete candidate. |
| **P-4 — migration / schema ownership** | The schema / migration-ownership obligation is scoped (Class A), schema / migration deferred, Straylight ownership preserved. | **exact-grain evidence** from a named concrete candidate. |
| **P-5 — runtime writer boundary** | The writer-boundary obligation is scoped to Class B operating-environment placement. | **exact-grain evidence** from a named concrete candidate. |
| **P-6 — read / recall boundary** | The recall-boundary obligation is scoped to Class A / Class B properties. | **exact-grain evidence** from a named concrete candidate. |
| **P-7 — audit / receipt persistence** | The audit / receipt-persistence obligation is scoped to Class A engine-kind properties. | **exact-grain evidence** from a named concrete candidate. |
| **P-8 — failure / rollback / recovery** | The recovery obligation is scoped to Class A / B / C posture. | **exact-grain evidence** from a named concrete candidate. |
| **P-9 — permission / auth / signer authority** | The signer / credential-authority obligation is scoped to Class C (a host must not become the de-facto authority). | **exact-grain evidence** from a named concrete candidate. |
| **P-10 — no-leak / public-private projection** | The no-leak projection obligation is scoped to Class B; the forbidden-grain / no-leak boundary is preserved (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`). | **exact-grain evidence** from a named concrete candidate. |
| **P-11 — test / evidence shape** | The evidence shape is **available as a template / checklist** (Class D; File 4). | a later **filled** evidence packet — the template is not the evidence. |

> The mapping says what each `P-row` still needs so a later exact-grain lane knows where to look. It discharges,
> proves, or partially proves **no** `P-row`, and produces **no** evidence. The `P-1 … P-11` definitions are
> unchanged from Phase 48P (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).

---

## 6. Evaluation decision and rationale

The evaluation result is recorded against the permitted results for this gate, and the conservative-but-accurate
result is **`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`**:

1. **It is `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`** — the four classes are **useful and evaluable** (§4): they
   narrow the gate #8 path by fixing what a later concrete candidate must demonstrate, and each is coherent and
   bounded. But candidate-class evaluation **does not select a concrete host**, **does not name a product /
   vendor / engine / provider**, **does not satisfy gate #8**, and **does not authorize implementation**;
   exact-grain authority is still required (§5; File 2 request). It is partly established (classes useful and
   evaluable) and partly open (`P-2 … P-10` need exact-grain evidence; `P-11` needs a filled packet). This is
   recorded above.
2. **It is *not* `CONCRETE_GRAIN_CANDIDATE_CLASS_ACCEPTED`** — an accepted result would record that the classes'
   class-level requirements are *fully* reasoned against their mapped `P-rows`. They are not: `P-2 … P-10` cannot
   be discharged at class grain (they need exact-grain evidence from a named candidate), and `P-11` is a template
   only. So acceptance is not supportable.
3. **It is *not* `CONCRETE_GRAIN_CANDIDATE_CLASS_REJECTED`** — a rejected result would record that a class cannot
   satisfy its mapped `P-row` obligations even at class grain. Each class **is** evaluable and coherent at class
   grain (§4); none is incoherent or unformable. So rejection is not supportable.
4. **It is *not* `PATCH_REQUIRED_CANDIDATE_CLASS_EVALUATION_AMBIGUOUS`** — a patch result would apply if the
   evaluation were ambiguous, internally inconsistent, or impossible to record without amendment. The evaluation
   is unambiguous and bounded to class grain: the classes are useful, the open obligations are explicit, and the
   path to exact-grain authority is identified. No patch is required.

> **Partial ≠ accepted ≠ host selected ≠ gate #8 satisfaction.** Recording
> `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` is the result of *this evaluation gate only*. It selects no concrete
> host, selects no production database, names no product / vendor / engine / deployment provider, proposes no
> adapter, and authorizes no implementation. **Gate #8 remains OPEN / HELD.**

---

## 7. Selected next lanes

Because the four classes are useful and evaluable but not sufficient without exact-grain authority, the selected
next lanes are the three companion files of this PR — none of which selects a concrete host or implements:

- **File 2 — exact-grain authority request**
  ([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md)):
  records a request for exact-grain authority so a later PR may name concrete product / vendor / engine /
  provider candidates. It **grants nothing**.
- **File 3 — sibling-evidence routing**
  ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md)):
  records what Finn / Dixie / Hounfour evidence may be needed later before any gate #8 acceptance. It authorizes
  **no** sibling PR.
- **File 4 — exact-grain evidence packet template**
  ([`./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md)):
  a template / checklist a later PR copies and fills **after** exact-grain authority is granted or partially
  granted. It carries **no** result.

The chain after this PR is: record the exact-grain authority request (File 2) → intake the exact-grain authority
response in a later docs-only lane → if (and only if) that response grants or partially grants exact-grain
authority, a still-later PR copies File 4 and names concrete candidates under whatever bound that response fixes,
carrying the File 3 sibling-evidence requirements. **None of that happens here.** Any follow-on PR title must
carry its phase label, e.g. `Phase 49C: exact-grain authority response intake` *(docs-only)*.

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

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
concrete-grain candidate-class evaluation gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not grant exact-grain authority** — that is requested in File 2 and granted by no one here;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **selects no product / vendor / engine / deployment provider** — none is named;
- **discharges no** `P-row` — `P-2 … P-10` still need exact-grain evidence; `P-11` still needs a filled packet;
- **proposes no production adapter** — none is proposed here;
- **authorizes no implementation** of any kind;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Evaluating the authorized candidate classes
> is not selecting any class member, selecting any host, selecting any production database, naming any product /
> vendor / engine / deployment provider, granting exact-grain authority, proposing any adapter, satisfying any
> gate, or authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49B (File 1 of 4) — gate #8 concrete-grain candidate-class evaluation gate (docs-only) |
| **Predecessor** | Phase 49A File 2 (merged, PR #101) — recorded `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`; selected this evaluation lane |
| **Decision result** | **`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`** — the four classes are useful and evaluable and narrow the gate #8 path, but evaluation selects no concrete host, names no product / vendor / engine / provider, satisfies no gate, and still requires exact-grain authority; not `_ACCEPTED` (`P-2 … P-10` not dischargeable at class grain), not `_REJECTED` (each class is coherent at class grain), not `PATCH_REQUIRED_CANDIDATE_CLASS_EVALUATION_AMBIGUOUS` (evaluation unambiguous and bounded) |
| **Class A (database engine class)** | useful but not sufficient without exact-grain authority — scopes `P-2`/`P-3`/`P-4`/`P-6`/`P-7`/`P-8` engine-kind properties; names no concrete engine |
| **Class B (deployment-provider class)** | useful but not sufficient without exact-grain authority — scopes `P-5`/`P-6`/`P-8`/`P-9`/`P-10` operating-environment properties; names no concrete provider |
| **Class C (managed-service vs self-hosted class)** | useful but not sufficient without exact-grain authority — scopes `P-9`/`P-8`/`P-1` operational-ownership / signer-credential properties; names no concrete option |
| **Class D (evidence-shape class)** | useful but template / checklist only — produces a shape (File 4), not evidence; discharges no `P-row` |
| **`P-row` posture** | `P-1` preserved (Straylight-owned, no host selected); `P-2 … P-10` need exact-grain evidence; `P-11` needs a later filled packet — none discharged here |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lanes** | File 2 (exact-grain authority request), File 3 (sibling-evidence routing), File 4 (exact-grain evidence packet template) — all docs-only; none selects a host or implements |
| **Scope of this PR** | exactly four new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Four-file change.** The branch adds exactly the four Phase 49B files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Classes evaluated, not selected.** §4 evaluates Classes A–D at class grain; no class is selected, ranked,
      or narrowed to a concrete member; no concrete product / vendor / engine / provider is named.
- [ ] **No `P-row` discharged.** §5 records what each `P-row` still needs; none is proven, partial, or failed.
- [ ] **Result conservative and explained.** §6 records `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` and explains why
      it is not ACCEPTED, not REJECTED, and not PATCH_REQUIRED.
- [ ] **Next lanes bounded.** §7 routes Files 2–4; none selects a host or implements; exact-grain authority is
      requested, not granted.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, production-database selection, a named product / vendor /
      engine candidate, a proposed production adapter, granted exact-grain authority, or implementation — each
      appears only inside a negation (§8, §9).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the class-grain evaluation and the no-leak restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49A File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `CONCRETE_GRAIN_AUTHORITY_PARTIAL` (`:170`); the CQ-1 … CQ-5 response and the four authorized classes.
  **Entry baseline / predecessor.**
- [Phase 49A File 2](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md) — recorded
  `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED` (`:227`); the class → `P-row` mapping (`:138`); selected this
  evaluation lane. **Entry baseline / predecessor.**
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — named the candidate at
  substrate-class grain (`:108`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`); the accepted UQ-2 candidate-naming grain (substrate-class only, not
  product / vendor / engine / deployment) (`:139`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); the S5 route-side row (`:159`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam
  (`:79`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) /
  [ADR-022A](./decisions/ADR-022A-straylight-semantic-home.md) — Straylight is the canonical semantic owner
  (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
  `docs/decisions/ADR-022A-straylight-semantic-home.md:62`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — the surfaces stay separable in code, test,
  and fixture (`:18`); Finn applies transitions through the wedge's `EstateStore` (`:59`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49B File 1. Docs-only gate #8 concrete-grain candidate-class evaluation gate. It takes the Phase 49A
File 1 `CONCRETE_GRAIN_AUTHORITY_PARTIAL` response and the Phase 49A File 2 `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`
decomposition, evaluates the four authorized classes at class grain (Class A — database engine class; Class B —
deployment-provider class; Class C — managed-service vs self-hosted class; Class D — evidence-shape class),
records for each that it is useful but not sufficient without exact-grain authority (Class D template / checklist
only), maps `P-1 … P-11` to what each still needs, and records `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` (not
`_ACCEPTED`, not `_REJECTED`, not `PATCH_REQUIRED_CANDIDATE_CLASS_EVALUATION_AMBIGUOUS`). It selects no concrete
host, selects no production database, names no product / vendor / engine / deployment provider, proposes no
adapter, and authorizes no implementation. The selected next lanes are File 2 (exact-grain authority request),
File 3 (sibling-evidence routing), and File 4 (exact-grain evidence packet template). No commit, no push, no PR.*
