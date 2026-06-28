# Phase 49B — ADR-022E Gate #8 Exact-Grain Evidence Packet Template / Checklist

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49B (File 4 of 4)** — companion **template / checklist**, not a decision artifact.
> **Scope**: This file is a **bounded exact-grain evidence packet template** that a later PR copies and fills
> **only after** exact-grain authority is granted or partially granted. **It carries no result of its own.**
> Filling it in a later PR produces an exact-grain candidate classification *there*; copying it here records
> **nothing**. Every classification token below is a **placeholder**, not this PR's result.

**Template, not decision.** This document is a template / checklist only. It contains **no** evidence, makes
**no** classification, selects **no** concrete host, selects **no** production database, names **no** product /
vendor / engine / deployment provider, proposes **no** production adapter, and authorizes **no** implementation.
The decision artifacts for Phase 49B are **File 1** (the candidate-class evaluation gate,
`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`), **File 2** (the exact-grain authority request gate,
`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`), and **File 3** (the sibling-evidence routing gate,
`SIBLING_EVIDENCE_ROUTING_RECORDED`); this is their companion template.

This is **File 4 of 4** in Phase 49B.

---

## 1. Link back to Files 1, 2, and 3

This packet template exists **only** because Phase 49B File 1 evaluated the candidate classes and found exact-grain
authority required, File 2 recorded the request for that authority, and File 3 recorded the sibling-evidence
routing the later lane must carry:

- **File 1 — candidate-class evaluation gate** —
  [`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md):
  recorded `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` — the four classes are useful and evaluable but cannot
  discharge `P-2 … P-10` without exact-grain evidence.
- **File 2 — exact-grain authority request gate** —
  [`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md):
  recorded `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` — framed EQ-1 … EQ-6 and listed the response-shape
  placeholders a later authority response may take.
- **File 3 — sibling-evidence routing gate** —
  [`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md):
  recorded `SIBLING_EVIDENCE_ROUTING_RECORDED` — the Finn / Dixie / Hounfour evidence posture this packet's
  "sibling evidence posture" field inherits.
- **The `P-1 … P-11` obligations** this packet collects against are defined in Phase 48P
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).

> Read Files 1, 2, and 3 first. This template is meaningless without the candidate-class evaluation, the
> exact-grain authority response (which does **not** yet exist), the sibling-evidence routing, and the candidate
> identity they fix.

---

## 2. Evidence packet purpose

A later PR can **copy this packet and fill it** for a concrete candidate — **but only after exact-grain authority
is granted or partially granted** by a separate authority response (the §4-of-File-2 response shapes). The
packet:

- gives the later lane a fixed, inspectable shape so its exact-grain reasoning is reviewable field-by-field
  against `P-1 … P-11`;
- keeps the later lane bounded — the concrete-name disclosure section, the forbidden-grain self-check, and the
  explicit prohibitions (§4, §7) travel with the packet so the later PR cannot drift beyond whatever bound the
  exact-grain authority response fixes;
- carries **no** result here — the placeholders are filled *there*, not here.

> Copying this file does not produce evidence, does not classify anything, and does not grant the exact-grain
> authority a later PR would need to fill it with concrete names. Only a later PR — *after* exact-grain authority
> is granted or partially granted — that *fills* the fields and *selects* a classification produces a result, and
> that result lives in that PR.

---

## 3. How to use this template (later exact-grain candidate PR, post-authority)

1. **Confirm exact-grain authority first.** Do not copy or fill this packet until a separate exact-grain authority
   response (File 2 §4 shape) grants or partially grants exact-grain authority. Without it, this packet must stay
   a blank template.
2. Copy this file to a new Phase 49C (or later) docs file under `docs/`.
3. Fill **Source lineage**, **Exact-grain authority response summary**, **Candidate identity**, the
   **Concrete-name disclosure section**, the **Forbidden-grain self-check**, and the **Sibling evidence posture**
   — one filled packet per concrete candidate (or as the authority response's EQ-3 answer permits).
4. Fill each **`P-x` field** with the exact-grain evidence for that obligation, cited to `file:line`. Reason in
   that PR; do not reason here.
5. Select exactly one **Exact-grain classification placeholder** (§5) as that candidate's result.
6. Complete the **Adapter / implementation separation confirmation** and the **Preserved blocked-state
   confirmation**.
7. Keep the **Explicit prohibitions** (§7) intact; a reviewer uses them to refuse scope creep.

---

## 4. Required packet sections (copy and fill)

> Everything below is a **blank template**. The `‹fill: …›` markers and the unchecked boxes are placeholders.
> Nothing here is filled, checked, or classified in this PR.

### 4.1 Source lineage

- Predecessor phases: ‹fill: Phase 48N → 48P → 48Q → 48R → 48S → 48T → 48U → 48V → 48W → 48X → 48Y → 48Z → 49A → 49B, each with `file:line`›
- File 1 (candidate-class evaluation): ‹fill: `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md` result `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`, with `file:line`›
- File 2 (exact-grain authority request): ‹fill: `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md` result `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`, with `file:line`›
- File 3 (sibling-evidence routing): ‹fill: `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md` result `SIBLING_EVIDENCE_ROUTING_RECORDED`, with `file:line`›

### 4.2 Exact-grain authority response summary

> This section **must** cite a recorded exact-grain authority response. If none exists, the packet stays blank.

- EQ-1 (may a later PR name concrete candidates?): ‹fill: the recorded answer, with `file:line`›
- EQ-2 (which exact-grain categories may be named?): ‹fill: the recorded bounded category list, with `file:line`›
- EQ-3 (compare multiple candidates, or one at a time?): ‹fill: the recorded answer, with `file:line`›
- EQ-4 (evidence required before a named candidate can be accepted?): ‹fill: the recorded evidence requirement, with `file:line`›
- EQ-5 (adapter-proposal permission?): ‹fill: the recorded answer — adapter proposal separate unless explicitly granted›
- EQ-6 (implementation authorization?): ‹fill: the recorded answer — implementation separate unless explicitly granted›

### 4.3 Candidate identity

- Concrete candidate under evaluation: ‹fill: the candidate, named **only** within the EQ-2 bound the authority response fixed›
- Exact-grain confirmation: ‹fill: this packet names the candidate only at the grain the authority response explicitly permits›
- Substrate-class label (unchanged): ‹fill: `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`›
- Ownership boundary: ‹fill: `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`›
- Semantic owner: ‹fill: `loa-straylight`›

### 4.4 Concrete-name disclosure section

> Used **only** when the exact-grain authority response permits naming (EQ-1 / EQ-2). Until then, leave blank.

- Concrete name(s) disclosed: ‹fill: the concrete name(s), each within the EQ-2 bound, with the authority `file:line` that permits it›
- Naming-grain authority citation: ‹fill: the recorded exact-grain authority response `file:line` that permits this exact grain›
- If no authority permits naming: ‹leave blank — no concrete name may appear in this packet›

### 4.5 Forbidden-grain self-check

Confirm the filled packet introduces **none** of the following unless the exact-grain authority response
**explicitly** permits it (each must remain absent otherwise):

- [ ] no concrete name beyond the EQ-2-permitted category bound
- [ ] no production database selection (unless explicitly authorized)
- [ ] no concrete physical host selection (unless explicitly authorized)
- [ ] no connection string, port, credential, account, region, topology, or orchestration detail
- [ ] no schema, migration, SQL, or adapter implementation
- [ ] no runtime wiring or production wiring
- [ ] no production-adapter proposal unless EQ-5 explicitly granted it (the gate-#8 `M5` shape)

### 4.6 Sibling evidence posture

Inherited from File 3 ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md)):

- `loa-finn` (gate #9): ‹fill: held `PARTIAL_RECORDED`; whether runtime-owner evidence is required for this candidate's runtime acceptance, with `file:line`›
- `loa-dixie` (gate #10): ‹fill: held `PARTIAL_RECORDED`; whether boundary-owner evidence is required for this candidate's boundary acceptance, with `file:line`›
- `loa-hounfour` (schema / substrate lane): ‹fill: non-canonical; schema / contract evidence only if this candidate implicates a schema / protocol change, with `file:line`›

### 4.7 `P-1` field — Candidate identity & ownership boundary

- Requirement: keep candidate identity Straylight-owned; name the candidate only at the EQ-2-permitted grain.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.8 `P-2` field — Persistence durability

- Requirement: show the named candidate's durable-persistence behaviour.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.9 `P-3` field — Tenant / actor / estate isolation

- Requirement: show the named candidate's isolation behaviour.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.10 `P-4` field — Migration / schema ownership

- Requirement: show schema / migration ownership preserved as Straylight-owned.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.11 `P-5` field — Runtime writer boundary

- Requirement: show the named candidate's governed writer-boundary behaviour.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.12 `P-6` field — Read / recall boundary

- Requirement: show the named candidate's recall-readable canonical estate boundary behaviour.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.13 `P-7` field — Audit / receipt persistence

- Requirement: show the named candidate's audit / receipt-persistence behaviour.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.14 `P-8` field — Failure / rollback / recovery

- Requirement: show the named candidate's recovery behaviour.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.15 `P-9` field — Permission / auth / signer authority

- Requirement: show the named candidate does **not** become the de-facto authority over canonical writes.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.16 `P-10` field — No-leak / public-private projection

- Requirement: show the named candidate preserves the forbidden-grain / no-leak boundary.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.17 `P-11` field — Test / evidence shape

- Requirement: define the inspectable evidence shape; if EQ-5 grants it, this is where a *proposed* production
  adapter + sibling-repo handoff citation would be carried (the gate-#8 `M5` shape) — otherwise leave the adapter
  out.
- Exact-grain evidence: ‹fill: the evidence, cited to `file:line`›

### 4.18 Exact-grain classification placeholder

- Selected classification (later PR only): ‹fill: exactly one token from §5›
- Reasoning: ‹fill: why that classification, cited to the filled `P-x` fields above›

### 4.19 Adapter / implementation separation confirmation

- [ ] this packet proposes no production adapter unless EQ-5 explicitly granted it
- [ ] this packet authorizes no implementation unless EQ-6 explicitly granted it
- [ ] this packet produces docs only — no source / test / runtime / config / package / CI / schema /
      migration / SQL / production-wiring change
- [ ] adapter proposal and implementation each remain separate, separately-authorized requests unless explicitly
      granted

### 4.20 Preserved blocked-state confirmation

- [ ] gate #8 remains **`OPEN / HELD`** (unless a separate gate #8 acceptance lane satisfies it)
- [ ] gate #9 remains held with **`PARTIAL_RECORDED`**
- [ ] gate #10 remains held with **`PARTIAL_RECORDED`**
- [ ] D.1(ii) remains **unresolved**
- [ ] D.1 is **not satisfied**
- [ ] D.2 is **not started**
- [ ] MVP-2 remains **open**
- [ ] the concrete canonical-store physical host remains **unselected** (unless a separate selection lane selects it)

---

## 5. Exact-grain classification placeholders

The later exact-grain candidate PR selects **exactly one** of the following as **its** result. **These are
placeholders only — none is selected, recorded, or implied by this PR:**

- `EXACT_GRAIN_CANDIDATE_ACCEPTED` — *placeholder.* The later lane would record this for a named candidate whose
  exact-grain evidence fully discharges its `P-1 … P-11` obligations under the authority response's bound.
- `EXACT_GRAIN_CANDIDATE_PARTIAL` — *placeholder.* The later lane would record this for a named candidate whose
  evidence is partly complete and partly open.
- `EXACT_GRAIN_CANDIDATE_REJECTED` — *placeholder.* The later lane would record this for a named candidate that
  cannot satisfy its `P-1 … P-11` obligations.
- `PATCH_REQUIRED_EXACT_GRAIN_CANDIDATE_AMBIGUOUS` — *placeholder.* The later lane would record this if a
  candidate evaluation could not be recorded without amendment.

> **These tokens are placeholders, not this PR's result.** This template selects none of them. Even a later
> `EXACT_GRAIN_CANDIDATE_ACCEPTED` would **not** by itself satisfy gate #8 — discharging gate #8 requires the
> gate-#8 trigger (a *proposed production adapter* + the sibling-repo handoff citation + preserved ADR-022D
> invariants), a separate, later, separately-reviewed lane
> (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
> `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

---

## 6. Placeholder status (explicit)

Stated plainly so no reviewer mistakes the template for a result:

1. This file is a **template / checklist**, not a decision artifact.
2. Every `‹fill: …›` marker and every unchecked box is a **placeholder**; none is filled or checked here.
3. Every classification token in §5 is a **placeholder**; none is selected here.
4. The packet may be filled **only after** exact-grain authority is granted or partially granted by a separate
   authority response; until then it stays blank.
5. **These placeholders are not this PR's result.** This PR's results are recorded in File 1
   (`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`), File 2 (`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`), and File 3
   (`SIBLING_EVIDENCE_ROUTING_RECORDED`); this file records nothing.

---

## 7. Explicit prohibitions in this template artifact

This template artifact itself, and any later PR that fills it, **must not** (unless the exact-grain authority
response explicitly allows that exact grain):

- select a concrete product / vendor / engine / deployment provider **now** — this template names none;
- select a production database **now** — this template selects none;
- select a concrete physical host **now** — this template selects none; the host stays **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- propose a production adapter — the gate-#8 `M5` shape, reserved for a separate, later lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- make any source / test / runtime / config / package / CI / schema / migration / SQL change;
- introduce production wiring;
- claim that gate #8 (or gate #9 / #10, D.1, D.2, or MVP-2) is closed, satisfied, or discharged.

> This template carries **no** result, produces **no** evidence, classifies **nothing**, names **no** concrete
> product / vendor / engine / deployment provider, selects **no** host, selects **no** production database,
> proposes **no** production adapter, and authorizes **no** implementation. The canonical-store physical host
> remains **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`), and
> gate #8 remains **OPEN / HELD** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

---

*End of Phase 49B File 4 exact-grain evidence packet template / checklist. Docs-only companion to File 1
([`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md)),
File 2
([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md)),
and File 3
([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md)).
It is a bounded template / checklist for a later exact-grain candidate PR to copy and fill **only after**
exact-grain authority is granted or partially granted. It carries no result, produces no evidence, classifies
nothing, selects no concrete host, selects no production database, names no product / vendor / engine / deployment
provider, proposes no production adapter, and authorizes no implementation. The classification tokens
`EXACT_GRAIN_CANDIDATE_ACCEPTED` / `EXACT_GRAIN_CANDIDATE_PARTIAL` / `EXACT_GRAIN_CANDIDATE_REJECTED` /
`PATCH_REQUIRED_EXACT_GRAIN_CANDIDATE_AMBIGUOUS` are placeholders only, not this PR's result. No commit, no push,
no PR.*
