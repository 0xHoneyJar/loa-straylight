# Phase 49C — ADR-022E Gate #8 Exact-Grain Authority Response Intake Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49C (File 1 of 5)** — docs-only **exact-grain authority response intake** gate for the
> canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / response-intake only.** Phase 49B File 2 recorded
> **`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`**
> (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:164`) and framed six bounded questions
> (EQ-1 … EQ-6) for a separate architecture / product authority to decide whether a *later* PR may name concrete
> candidates and at which exact grain. This file **intakes the authority's response**: it restates EQ-1 … EQ-6,
> records the response exactly as received, and records **`EXACT_GRAIN_AUTHORITY_PARTIAL`**. It **records a
> response; it does not act on it.** It selects **no** concrete physical host, selects **no** production database,
> names **no** product / vendor / engine / deployment provider, proposes **no** production adapter, and authorizes
> **no** implementation. The only change on this branch is **five** new Markdown files under `docs/`. No source,
> test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`,
> `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049C` — following the live convention for the question / answer / request / intake /
acceptance / decision / authorization / evidence / routing gates across the Phase 48 / 49 family. It records a
bounded **authority response intake** at exact-grain / concrete-candidate-naming *authorization* level — it
intakes whether a *later* PR may name concrete product / vendor / engine / provider candidates; it does **not**
itself name any, select any host, or move the candidate beyond the grain the authority permits. The immediate
predecessor is **Phase 49B File 2**
([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md)),
which recorded `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`.

This is **File 1 of 5** in Phase 49C. The companions are:

2. **The concrete-candidate naming authorization gate**
   ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md))
   — which takes the response recorded here and records `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`,
   authorizing a *later* docs-only shortlist lane to name concrete candidates. It names **none** here.
3. **The adapter / implementation separation gate**
   ([`./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md))
   — which records `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`, holding adapter proposal and implementation as
   separate later authorities. It proposes **no** adapter and authorizes **no** implementation.
4. **The sibling-evidence request preparation gate**
   ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md))
   — which records `SIBLING_EVIDENCE_REQUEST_PREPARED`, preparing (but not authorizing) sibling-evidence request
   lanes. It requests **no** sibling evidence and opens **no** sibling PR.
5. **The concrete-candidate shortlist packet template**
   ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md))
   — a bounded template / checklist a later concrete-candidate shortlist PR copies and fills. It carries **no**
   result of its own.

---

## 1. Source context (Phase 48N → Phase 49B, restated, not changed)

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
| **Phase 48X** | **Merged** (`loa-straylight` PR #96). Recorded **`SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED`** and shipped the substrate-class evidence packet template. | `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-AUTHORIZATION-GATE.md:185` |
| **Phase 48Y** | **Merged** (`loa-straylight` PR #97). File 1 recorded **`SUBSTRATE_CLASS_EVIDENCE_PARTIAL`**; File 2 recorded **`GATE_8_RESIDUAL_GAP_ROUTED`**. | `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-RESULT-GATE.md:292`; `docs/ADR-022E-CANONICAL-STORE-GATE-8-RESIDUAL-GAP-ROUTING-GATE.md:190` |
| **Phase 48Z** | **Merged** (`loa-straylight` PR #100). File 1 recorded **`GATE_8_SATISFACTION_NOT_READY_AT_SUBSTRATE_CLASS_GRAIN`**; File 2 recorded **`CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED`** and selected a docs-only concrete-grain authority *response intake* lane. | `docs/ADR-022E-GATE-8-SATISFACTION-READINESS-REVIEW-GATE.md:288`; `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:13` |
| **Phase 49A** | **Merged** (`loa-straylight` PR #101). File 1 recorded **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`** (bounded candidate-class evaluation authority); File 2 recorded **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`**; File 3 shipped the concrete-host candidate evidence packet template. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:170`; `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-DECOMPOSITION-GATE.md:227` |
| **Phase 49B** | **Merged** (`loa-straylight` PR #102). File 1 recorded **`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`**; File 2 recorded **`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`** (framed EQ-1 … EQ-6); File 3 recorded **`SIBLING_EVIDENCE_ROUTING_RECORDED`**; File 4 shipped the exact-grain evidence packet template. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md:225`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:164`; `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192` |
| **Entry baseline** | **`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`** — the exact-grain authority request is recorded and its EQ-1 … EQ-6 are framed and bounded; gate #8 is **OPEN / HELD**; the authority grain remains substrate-class / candidate-class only until a response says otherwise. **Request recorded, response not yet intook.** | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:164`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:202` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 49B File 2's `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` is the entry baseline; this
> gate intakes the response that request called for — and goes no further.

---

## 2. Candidate identity (restated, not changed)

The response concerns the single candidate Phase 48W selected, Phase 48X authorized an evidence lane against,
Phase 48Y classified evidence for, Phase 48Z found not ready for gate #8 satisfaction at substrate-class grain,
and Phase 49A / 49B evaluated at candidate-class grain:

| Field | Value |
|-------|-------|
| **Candidate label** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`) |
| **Ownership boundary** | **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`** (the UQ-1 accepted placement model — `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`) |
| **Semantic owner** | `loa-straylight` — permanent; ownership does not follow location (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`) |
| **Candidate grain (entry)** | substrate-class / candidate-class only — role / responsibility / required capability, **not** product / vendor / engine / deployment provider / database implementation (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`) |

**Sibling surfaces (non-canonical, preserved).** `loa-finn` (runtime / execution), `loa-dixie` (route-side
ingress / control-plane), and `loa-hounfour` (schema / validation / policy) remain non-canonical participant
surfaces only; none owns the canonical estate record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`; `docs/handoffs/finn-runtime-boundary.md:59`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). No sibling-repo PR may merge
without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 3. Requested questions (Phase 49B File 2, restated, not changed)

Phase 49B File 2 framed six bounded questions for the architecture / product authority
(`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:84`). They are restated here exactly so the response
in §4 can be read against the question it answers; none is re-framed:

- **EQ-1 — may a later PR name concrete candidates?** May a later docs-only PR name concrete product / vendor /
  engine / deployment-provider candidates for gate #8 evaluation?
- **EQ-2 — if yes, which exact-grain categories may be named?** If EQ-1 is answered yes, which exact-grain
  categories may be named, and which details remain forbidden?
- **EQ-3 — compare multiple candidates, or one at a time?** May a later PR compare multiple concrete candidates,
  and what acceptance constraint binds it?
- **EQ-4 — what evidence is required before a named candidate can be accepted?** What evidence must a named
  concrete candidate carry, across `P-1 … P-11`, before it can be accepted?
- **EQ-5 — does exact-grain authority include adapter-proposal permission?** Does any granted exact-grain
  authority include permission to propose a production adapter, or must adapter proposal remain a later, separate
  request?
- **EQ-6 — does exact-grain authority include implementation authorization?** Does any granted exact-grain
  authority include implementation authorization, or must implementation remain a later, separate request?

---

## 4. Authority response (recorded exactly, not advanced)

The architecture / product authority returned a **partial** response. Each answer is recorded against the
question it answers; nothing is added, broadened, or acted upon here.

### 4.1 EQ-1 response — a later docs-only PR may name concrete candidates

- **Answer: yes — a later docs-only PR may name concrete product / vendor / engine / deployment-provider
  candidates for gate #8 evaluation.** The permission attaches to a *later* PR only; it does **not** name any
  candidate here and does **not** authorize host selection, adapter proposal, or implementation. The
  canonical-store physical host remains **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

### 4.2 EQ-2 response — allowed exact-grain categories and still-forbidden details

- **Answer: a later PR may name candidates within the following exact-grain categories**, each named only at the
  bounded grain the category fixes — never as a leaked deployment fact:
  - **database engine** — the durable-store engine kind;
  - **deployment provider** — where / how the substrate is operated;
  - **managed-service vs self-hosted option** — the operational-ownership axis;
  - **storage substrate role** — the substrate's role in the canonical estate;
  - **credential-boundary role** — the role the candidate plays at the credential boundary, described as a role,
    not a secret;
  - **evidence-shape role** — the shape of evidence a concrete candidate would carry.
- **Still forbidden** in any later PR (each remains absent unless a separate authority explicitly permits it):
  account identifiers; project identifiers; credentials; connection strings; ports; regions; topology; production
  wiring; implementation details. The no-leak / public-private boundary stays intact
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`;
  `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:111`).
- **Boundary recorded with the answer.** This authorizes naming *within these categories in a later PR*; it does
  **not** name a candidate here, and it does **not** narrow the accepted UQ-2 candidate-naming grain into a
  selected member (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`).

### 4.3 EQ-3 response — compare multiple candidates; no final acceptance without a separate gate

- **Answer: a later docs-only PR may compare multiple concrete candidates.** It is **not** restricted to one
  candidate at a time.
- **Acceptance constraint recorded:** that later PR **must not accept a final host** unless a *separate*
  acceptance gate authorizes that acceptance. Comparison and shortlisting are permitted; final-host acceptance is
  a separate, later, separately-reviewed transition
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

### 4.4 EQ-4 response — evidence required across `P-1 … P-11` plus sibling posture and no-leak

- **Answer: before any named concrete candidate can be accepted, evidence must show, across the existing
  `P-1 … P-11` decomposition** (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`):
  - **P-1** candidate identity / ownership;
  - **P-2** durability;
  - **P-3** tenant / actor / estate isolation;
  - **P-4** migration / schema ownership;
  - **P-5** runtime writer boundary;
  - **P-6** read / recall boundary;
  - **P-7** audit / receipt persistence;
  - **P-8** failure / rollback / recovery;
  - **P-9** permission / auth / signer authority;
  - **P-10** no-leak / public-private projection;
  - **P-11** test / evidence shape;
- and additionally must carry: the **sibling-evidence posture** (Finn / Dixie / Hounfour, per the Phase 49B File 3
  routing — `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192`); a **no-leak self-check** confirming the
  forbidden-grain details of EQ-2 stay absent
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`); and an
  **adapter / implementation separation confirmation** (per EQ-5 / EQ-6). The response **reuses** the Phase 48P
  decomposition; it invents no new evidence structure and produces no evidence here.

### 4.5 EQ-5 response — adapter proposal remains separate

- **Answer: exact-grain authority does *not* include adapter-proposal permission. Adapter proposal remains a
  later, separate request.** Naming a concrete candidate does not authorize proposing a production adapter; the
  gate-#8 `M5` production-adapter-proposal shape is reserved for a separate, later, separately-reviewed lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`). The `StorageAdapter`
  swap-in seam is unchanged (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

### 4.6 EQ-6 response — implementation remains separate

- **Answer: exact-grain authority does *not* include implementation authorization. Implementation remains a
  later, separate request.** No source / test / runtime / config / package / CI / schema / migration / SQL change
  and no production wiring is authorized by this response
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

> **Response recorded ≠ response acted upon.** §4 records what the authority returned. It names no concrete
> candidate, selects no host, selects no production database, proposes no adapter, and authorizes no
> implementation. The acting on this response — recording the concrete-candidate naming authorization, the
> adapter / implementation separation, the sibling-evidence request preparation, and shipping the shortlist
> template — is Files 2 through 5, and even those only *prepare* a later shortlist lane.

---

## 5. Why this is partial, not granted

The response result is **`EXACT_GRAIN_AUTHORITY_PARTIAL`** — a bounded grant of concrete-candidate *naming /
shortlist-preparation* authority for a later PR, not a full exact-grain authority. It is partial because:

1. **Concrete candidate naming is allowed later** (EQ-1, EQ-2, EQ-3) — a later docs-only PR may name and compare
   concrete candidates within the EQ-2 categories. That is real authority, so the result is not a rejection or a
   deferral.
2. **Adapter proposal is not allowed here** (EQ-5) — adapter proposal remains a separate, later request; this
   response does not grant it (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
3. **Implementation is not allowed here** (EQ-6) — implementation remains a separate, later request; no source /
   test / runtime / config / package / CI / schema / migration / SQL change and no production wiring is authorized
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).
4. **Host acceptance is not allowed here** (EQ-3) — a later PR may compare candidates but cannot accept a final
   host without a separate acceptance gate; the canonical-store physical host remains **UNSELECTED**
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
5. **Gate #8 satisfaction is not allowed here** — gate #8's trigger is a *proposed production adapter* + the
   sibling-repo handoff citation + preserved ADR-022D invariants, a separate, later, separately-reviewed lane
   (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`). Gate #8 remains
   **OPEN / HELD**.

The result is recorded against the permitted response results for this intake gate:

- **It is `EXACT_GRAIN_AUTHORITY_PARTIAL`** — the authority granted bounded concrete-candidate naming / shortlist
  authority for a later PR while withholding adapter proposal, implementation, host acceptance, and gate #8
  satisfaction; this is recorded above.
- **It is *not* `EXACT_GRAIN_AUTHORITY_GRANTED`** — a granted result would record an unbounded exact-grain
  authority (including, at minimum, host acceptance or adapter proposal). The response explicitly bounds the grant
  to later naming / comparison and withholds acceptance, adapter, and implementation, so a full grant is not
  supportable.
- **It is *not* `EXACT_GRAIN_AUTHORITY_DEFERRED`** — a deferred result would record that the authority declined to
  decide now. The authority decided: it permitted later concrete-candidate naming (EQ-1 yes). So it is not
  deferred.
- **It is *not* `EXACT_GRAIN_AUTHORITY_REJECTED`** — a rejected result would record that no exact-grain work was
  permitted. EQ-1 was answered yes (bounded), so it is not rejected.
- **It is *not* `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_RESPONSE_AMBIGUOUS`** — a patch result would apply if the
  response were ambiguous, internally inconsistent, or impossible to record without amendment. The response is
  unambiguous and bounded: EQ-1 yes (later PR), EQ-2 six categories with the forbidden-detail list, EQ-3 compare
  but no acceptance without a separate gate, EQ-4 `P-1 … P-11` plus sibling posture and no-leak, EQ-5 adapter
  separate, EQ-6 implementation separate. No patch is required.

> **Partial-recorded ≠ authority-to-name-now ≠ adapter proposal ≠ implementation ≠ host acceptance ≠ gate #8
> satisfaction.** Recording `EXACT_GRAIN_AUTHORITY_PARTIAL` is the result of *this response intake gate only*. It
> authorizes a *later* PR to name / compare concrete candidates and nothing more — it names no concrete candidate
> here, selects no host, selects no production database, proposes no adapter, and authorizes no implementation.
> **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

Because the authority granted bounded later-PR concrete-candidate naming / shortlist authority (EQ-1 … EQ-3) while
withholding adapter proposal, implementation, host acceptance, and gate #8 satisfaction (EQ-5 / EQ-6), the next
docs-only steps record those bounds and prepare the shortlist lane. They are the companion Files 2 through 5 of
this PR:

- **File 2 — concrete-candidate naming authorization gate**
  ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md))
  — records `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`; authorizes a later docs-only shortlist lane to
  name concrete candidates; names none itself.
- **File 3 — adapter / implementation separation gate**
  ([`./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md))
  — records `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`; holds adapter proposal and implementation as separate
  later authorities.
- **File 4 — sibling-evidence request preparation gate**
  ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md))
  — records `SIBLING_EVIDENCE_REQUEST_PREPARED`; prepares (does not authorize) Finn / Dixie / Hounfour evidence
  request lanes.
- **File 5 — concrete-candidate shortlist packet template**
  ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md))
  — a template / checklist a later concrete-candidate shortlist PR copies and fills. It carries no result.

> **Selected next lane (beyond this PR): a docs-only concrete-candidate shortlist / exact-grain candidate naming
> gate.** That later lane copies the File 5 template, names concrete candidates within the EQ-2 categories,
> compares them, records the sibling-evidence posture, and must not accept a final host, propose an adapter, or
> implement.

Any follow-on PR title must carry its phase label, e.g. `Phase 49D: concrete-candidate shortlist` *(docs-only)*.

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
exact-grain authority response intake gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not name** any concrete product / vendor / engine / deployment provider — it records the authority that
  *permits a later PR* to name; the naming itself is a later lane;
- **does not select** any concrete candidate — selection is a later, separately-authorized transition;
- **does not accept** any final host — host acceptance requires a separate acceptance gate (EQ-3);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later, separate request (EQ-5);
- **authorizes no implementation** of any kind — implementation remains a later, separate request (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Recording an exact-grain authority response
> is not acting on it, naming any concrete product / vendor / engine / deployment provider, selecting any
> candidate, accepting any host, selecting any production database, proposing any adapter, satisfying any gate,
> resolving any dependency, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49C (File 1 of 5) — gate #8 exact-grain authority response intake gate (docs-only) |
| **Predecessor** | Phase 49B File 2 (merged, PR #102) — recorded `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`; framed EQ-1 … EQ-6; selected this response intake gate |
| **Decision result** | **`EXACT_GRAIN_AUTHORITY_PARTIAL`** — the authority granted bounded later-PR concrete-candidate naming / shortlist authority (EQ-1 … EQ-3) while withholding adapter proposal, implementation, host acceptance, and gate #8 satisfaction (EQ-5 / EQ-6); not `EXACT_GRAIN_AUTHORITY_GRANTED` (acceptance / adapter / implementation withheld), not `_DEFERRED` (a decision was made), not `_REJECTED` (EQ-1 answered yes), not `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_RESPONSE_AMBIGUOUS` (response unambiguous and bounded) |
| **EQ-1 response** | yes — a later docs-only PR may name concrete product / vendor / engine / deployment-provider candidates |
| **EQ-2 response** | allowed categories: database engine; deployment provider; managed-service vs self-hosted option; storage substrate role; credential-boundary role; evidence-shape role — still forbidden: account identifiers; project identifiers; credentials; connection strings; ports; regions; topology; production wiring; implementation details |
| **EQ-3 response** | a later PR may compare multiple concrete candidates; it must not accept a final host without a separate acceptance gate |
| **EQ-4 response** | evidence required across `P-1 … P-11` plus sibling-evidence posture, no-leak self-check, and adapter / implementation separation confirmation |
| **EQ-5 response** | adapter proposal remains a later, separate request |
| **EQ-6 response** | implementation remains a later, separate request |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | Files 2–5 of this PR record the naming authorization, the adapter / implementation separation, the sibling-evidence request preparation, and the shortlist template; the lane beyond this PR is a docs-only concrete-candidate shortlist gate that must not accept a host, propose an adapter, or implement |
| **Scope of this PR** | exactly five new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Five-file change.** The branch adds exactly the five Phase 49C files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Response intook, not acted upon.** §3 restates EQ-1 … EQ-6; §4 records the response exactly; the naming /
      shortlist preparation is routed to Files 2–5 and a still-later lane.
- [ ] **Result conservative and explained.** §5 records `EXACT_GRAIN_AUTHORITY_PARTIAL` and explains why it is
      not GRANTED, not DEFERRED, not REJECTED, and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 selects the docs-only naming-authorization / shortlist-preparation companions and
      a later shortlist gate that must not accept a host, propose an adapter, or implement.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, production-database selection, a named product / vendor /
      engine candidate, a proposed production adapter, granted implementation authority, or implementation — each
      appears only inside a negation (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49B File 2](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md) — recorded
  `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` (`:164`); framed EQ-1 … EQ-6 (`:84`); selected this response intake
  gate (`:202`). **Entry baseline / predecessor.**
- [Phase 49B File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md) — recorded
  `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` (`:225`).
- [Phase 49B File 3](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md) — recorded
  `SIBLING_EVIDENCE_ROUTING_RECORDED` (`:192`).
- [Phase 49A File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `CONCRETE_GRAIN_AUTHORITY_PARTIAL` (`:170`); the CQ-4 sibling qualifier (`:146`, `:150`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`); the accepted UQ-2 candidate-naming grain (substrate-class only, not
  product / vendor / engine / deployment) (`:139`); `AUTHORITY_ANSWER_PROVIDED_FOR_UQ_1_AND_UQ_2` (`:151`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — named the candidate at
  substrate-class grain (`:108`); selected it (`:170`).
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
  and fixture (`:18`); Finn applies transitions through the wedge's `EstateStore` (`:59`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49C File 1. Docs-only gate #8 exact-grain authority response intake gate. It restates the Phase 49B
File 2 questions EQ-1 … EQ-6, records the authority's response exactly (EQ-1 yes / a later docs-only PR may name
concrete candidates; EQ-2 allowed categories — database engine, deployment provider, managed-service vs
self-hosted option, storage substrate role, credential-boundary role, evidence-shape role — with account
identifiers, project identifiers, credentials, connection strings, ports, regions, topology, production wiring,
and implementation details still forbidden; EQ-3 a later PR may compare multiple candidates but cannot accept a
final host without a separate acceptance gate; EQ-4 evidence across `P-1 … P-11` plus sibling-evidence posture,
no-leak self-check, and adapter / implementation separation confirmation; EQ-5 adapter proposal remains separate;
EQ-6 implementation remains separate), and records `EXACT_GRAIN_AUTHORITY_PARTIAL` (not `_GRANTED`, not
`_DEFERRED`, not `_REJECTED`, not `PATCH_REQUIRED_EXACT_GRAIN_AUTHORITY_RESPONSE_AMBIGUOUS`). The response is
partial: it permits a later PR to name / compare concrete candidates only — it does not propose an adapter, does
not authorize implementation, does not accept a host, names no concrete product / vendor / engine / deployment
provider here, selects no production database, and does not satisfy gate #8. The selected next lanes are the Phase
49C companion Files 2–5 and a still-later docs-only concrete-candidate shortlist gate. No commit, no push, no PR.*
