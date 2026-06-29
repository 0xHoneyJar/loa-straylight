# Phase 49C — ADR-022E Gate #8 Concrete-Candidate Shortlist Packet Template / Checklist

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49C (File 5 of 5)** — companion **template / checklist**, not a decision artifact.
> **Scope**: This file is a **bounded concrete-candidate shortlist packet template** that a later PR copies and
> fills **only after** the concrete-candidate naming authorization (File 2,
> `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`) has been intaken. **It carries no result of its own.**
> Filling it in a later PR produces a concrete-candidate shortlist *there*; copying it here records **nothing**.
> Every classification token below is a **placeholder**, not this PR's result.

**Template, not decision.** This document is a template / checklist only. It contains **no** shortlist, makes
**no** classification, names **no** concrete candidate, selects **no** concrete host, selects **no** production
database, names **no** product / vendor / engine / deployment provider, proposes **no** production adapter, and
authorizes **no** implementation. The decision artifacts for Phase 49C are **File 1** (the exact-grain authority
response intake gate, `EXACT_GRAIN_AUTHORITY_PARTIAL`), **File 2** (the concrete-candidate naming authorization
gate, `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`), **File 3** (the adapter / implementation separation
gate, `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`), and **File 4** (the sibling-evidence request preparation
gate, `SIBLING_EVIDENCE_REQUEST_PREPARED`); this is their companion template.

This is **File 5 of 5** in Phase 49C.

---

## 1. Link back to Files 1 through 4

This shortlist packet template exists **only** because Phase 49C File 1 intook the exact-grain authority response,
File 2 recorded the concrete-candidate naming authorization, File 3 recorded the adapter / implementation
separation, and File 4 prepared the sibling-evidence request lanes the later shortlist lane must carry:

- **File 1 — exact-grain authority response intake gate** —
  [`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md):
  recorded `EXACT_GRAIN_AUTHORITY_PARTIAL` (`:208`) — EQ-1 yes (a later PR may name concrete candidates), EQ-2 six
  allowed categories with the forbidden-detail list, EQ-3 compare but no acceptance without a separate gate, EQ-5
  / EQ-6 adapter and implementation separate.
- **File 2 — concrete-candidate naming authorization gate** —
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md):
  recorded `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST` (`:112`) — a later docs-only shortlist lane may
  name and compare concrete candidates within the EQ-2 categories.
- **File 3 — adapter / implementation separation gate** —
  [`./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md):
  recorded `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` (`:129`) — the separation this packet's "candidate
  adapter / implementation separation" field inherits.
- **File 4 — sibling-evidence request preparation gate** —
  [`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md):
  recorded `SIBLING_EVIDENCE_REQUEST_PREPARED` (`:113`) — the Finn / Dixie / Hounfour posture this packet's
  "candidate sibling-evidence posture" field inherits.
- **The `P-1 … P-11` obligations** this packet's expected-evidence fields reference are defined in Phase 48P
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).

> Read Files 1 through 4 first. This template is meaningless without the naming authorization, the exact-grain
> authority response, the adapter / implementation separation, the sibling-evidence preparation, and the candidate
> identity they fix.

---

## 2. Shortlist packet purpose

A later PR can **copy this packet and fill it** to shortlist concrete candidates — **but only after** the
concrete-candidate naming authorization (File 2) has been intaken, within the EQ-2 categories the exact-grain
authority response fixed. The packet:

- gives the later shortlist lane a fixed, inspectable shape so its concrete-candidate reasoning is reviewable
  field-by-field;
- keeps the later lane bounded — the no-leak posture field, the adapter / implementation separation field, and
  the explicit prohibitions (§4.x, §7) travel with the packet so the later PR cannot drift into host acceptance,
  adapter proposal, or implementation;
- carries **no** result here — the placeholders are filled *there*, not here.

> Copying this file does not produce a shortlist, does not name any candidate, and does not grant the acceptance,
> adapter, or implementation authorities a later PR would need. Only a later PR — *after* the naming authorization
> is intaken — that *fills* the fields and *selects* a classification produces a result, and that result lives in
> that PR.

---

## 3. How to use this template (later concrete-candidate shortlist PR)

1. **Confirm the naming authorization first.** Do not copy or fill this packet until File 2's
   `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST` is in effect and the EQ-2 categories / forbidden-detail
   list are honoured. Without it, this packet must stay a blank template.
2. Copy this file to a new Phase 49D (or later) docs file under `docs/`.
3. Fill **Source lineage**, **Exact-grain authority response summary**, **Candidate naming authorization
   summary**, and the **Candidate shortlist table** — naming each candidate **only** within an EQ-2 category.
4. Fill each candidate's fields (display name, category membership, estate-owner boundary, no-leak posture,
   sibling-evidence posture, `P-1 … P-11` expected evidence, adapter / implementation separation, exclusion
   rationale). Reason in that PR; do not reason here.
5. Select exactly one **Candidate shortlist classification placeholder** (§5) as that shortlist's result.
6. Complete the **Preserved blocked-state confirmation**.
7. Keep the **Explicit prohibitions** (§7) intact; a reviewer uses them to refuse scope creep.

---

## 4. Required packet sections (copy and fill)

> Everything below is a **blank template**. The `‹fill: …›` markers and the unchecked boxes are placeholders.
> Nothing here is filled, checked, named, or classified in this PR.

### 4.1 Source lineage

- Predecessor phases: ‹fill: Phase 48N → 48P → 48Q → 48R → 48S → 48T → 48U → 48V → 48W → 48X → 48Y → 48Z → 49A → 49B → 49C, each with `file:line`›
- File 1 (exact-grain authority response): ‹fill: `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md` result `EXACT_GRAIN_AUTHORITY_PARTIAL`, with `file:line`›
- File 2 (naming authorization): ‹fill: `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md` result `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`, with `file:line`›
- File 3 (adapter / implementation separation): ‹fill: `docs/ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md` result `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`, with `file:line`›
- File 4 (sibling-evidence preparation): ‹fill: `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md` result `SIBLING_EVIDENCE_REQUEST_PREPARED`, with `file:line`›

### 4.2 Exact-grain authority response summary

> This section **must** cite the recorded exact-grain authority response (File 1). If it is not in effect, the
> packet stays blank.

- EQ-1 (may a later PR name concrete candidates?): ‹fill: the recorded answer — yes, with `file:line`›
- EQ-2 (allowed exact-grain categories / forbidden details?): ‹fill: the recorded bounded category list and the forbidden-detail list, with `file:line`›
- EQ-3 (compare multiple candidates, or one at a time? acceptance constraint?): ‹fill: the recorded answer — compare allowed, no acceptance without a separate gate, with `file:line`›
- EQ-4 (evidence required before a named candidate can be accepted?): ‹fill: the recorded `P-1 … P-11` + sibling + no-leak requirement, with `file:line`›
- EQ-5 (adapter-proposal permission?): ‹fill: the recorded answer — adapter proposal separate›
- EQ-6 (implementation authorization?): ‹fill: the recorded answer — implementation separate›

### 4.3 Candidate naming authorization summary

- Naming authorization in effect: ‹fill: File 2 `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`, with `file:line`›
- Naming-grain bound: ‹fill: candidates named only within the EQ-2 categories; no forbidden detail introduced›
- Comparison allowed: ‹fill: yes — multiple candidates may be compared (EQ-3); no final-host acceptance here›

### 4.4 Candidate shortlist table placeholder

> One row per concrete candidate, named **only** within an EQ-2 category. **Blank in this PR — no candidate is
> named here.**

| Candidate display name | Category membership | Estate-owner boundary | No-leak posture | Sibling-evidence posture | Adapter / implementation separation | Shortlist disposition |
|------------------------|---------------------|-----------------------|-----------------|--------------------------|-------------------------------------|-----------------------|
| ‹fill: name within EQ-2 category› | ‹fill: EQ-2 category› | ‹fill: `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`› | ‹fill: forbidden details absent› | ‹fill: Finn / Dixie / Hounfour posture› | ‹fill: proposes no adapter, authorizes no implementation› | ‹fill: shortlisted / excluded› |

### 4.5 Candidate display name field

- Candidate display name: ‹fill: the candidate, named **only** within the EQ-2 category bound the authority response fixed›
- Naming-grain authority citation: ‹fill: the File 1 / File 2 `file:line` that permits this exact grain›
- If no authority permits naming: ‹leave blank — no concrete name may appear in this packet›

### 4.6 Candidate category membership field

- Category membership: ‹fill: one of database engine; deployment provider; managed-service vs self-hosted option; storage substrate role; credential-boundary role; evidence-shape role›
- Category citation: ‹fill: the File 1 EQ-2 `file:line`›

### 4.7 Candidate estate-owner boundary field

- Estate-owner boundary: ‹fill: `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; ownership does not follow location›
- Boundary citation: ‹fill: `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`; `docs/decisions/ADR-020A-straylight-semantic-owner.md:45`›

### 4.8 Candidate no-leak posture field

Confirm the filled candidate row introduces **none** of the EQ-2 forbidden details (each must remain absent):

- [ ] no account identifier
- [ ] no project identifier
- [ ] no credential
- [ ] no connection string
- [ ] no port
- [ ] no region
- [ ] no topology
- [ ] no production wiring
- [ ] no implementation detail
- No-leak citation: ‹fill: `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`›

### 4.9 Candidate sibling-evidence posture field

Inherited from File 4 ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md)):

- `loa-finn` (gate #9): ‹fill: held `PARTIAL_RECORDED`; whether runtime-owner evidence is required for this candidate's runtime acceptance, with `file:line`›
- `loa-dixie` (gate #10): ‹fill: held `PARTIAL_RECORDED`; whether boundary-owner evidence is required for this candidate's boundary acceptance, with `file:line`›
- `loa-hounfour` (schema / substrate lane): ‹fill: non-canonical; schema / contract evidence only if this candidate implicates a schema / protocol change, with `file:line`›

### 4.10 Candidate P-1 through P-11 expected evidence fields

> The *expected* evidence areas only — what this candidate would later have to discharge. This shortlist does not
> produce the evidence; that is the later exact-grain evidence lane.

- `P-1` candidate identity / ownership: ‹fill: expected evidence area, with `file:line`›
- `P-2` durability: ‹fill: expected evidence area›
- `P-3` tenant / actor / estate isolation: ‹fill: expected evidence area›
- `P-4` migration / schema ownership: ‹fill: expected evidence area›
- `P-5` runtime writer boundary: ‹fill: expected evidence area›
- `P-6` read / recall boundary: ‹fill: expected evidence area›
- `P-7` audit / receipt persistence: ‹fill: expected evidence area›
- `P-8` failure / rollback / recovery: ‹fill: expected evidence area›
- `P-9` permission / auth / signer authority: ‹fill: expected evidence area›
- `P-10` no-leak / public-private projection: ‹fill: expected evidence area›
- `P-11` test / evidence shape: ‹fill: expected evidence area›

### 4.11 Candidate adapter/implementation separation field

Inherited from File 3 ([`./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md)):

- [ ] naming this candidate proposes no production adapter (EQ-5 separate)
- [ ] naming this candidate authorizes no implementation (EQ-6 separate)
- [ ] shortlisting this candidate accepts no final host (EQ-3 separate acceptance gate)
- [ ] the shortlist produces docs only — no source / test / runtime / config / package / CI / schema /
      migration / SQL / production-wiring change

### 4.12 Candidate exclusion rationale field

- Excluded candidates: ‹fill: candidates considered but not shortlisted, each within an EQ-2 category›
- Exclusion rationale: ‹fill: why excluded, cited to the expected-evidence fields above›

### 4.13 Candidate shortlist classification placeholder

- Selected classification (later PR only): ‹fill: exactly one token from §5›
- Reasoning: ‹fill: why that classification, cited to the filled candidate fields above›

### 4.14 Preserved blocked-state confirmation

- [ ] gate #8 remains **`OPEN / HELD`** (unless a separate gate #8 acceptance lane satisfies it)
- [ ] gate #9 remains held with **`PARTIAL_RECORDED`**
- [ ] gate #10 remains held with **`PARTIAL_RECORDED`**
- [ ] D.1(ii) remains **unresolved**
- [ ] D.1 is **not satisfied**
- [ ] D.2 is **not started**
- [ ] MVP-2 remains **open**
- [ ] the concrete canonical-store physical host remains **unselected** (unless a separate selection lane selects it)

---

## 5. Candidate shortlist classification placeholders

The later concrete-candidate shortlist PR selects **exactly one** of the following as **its** result. **These are
placeholders only — none is selected, recorded, or implied by this PR:**

- `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` — *placeholder.* The later lane would record this when a coherent
  shortlist of named candidates (within the EQ-2 categories) is prepared for later evidence / acceptance lanes.
- `CONCRETE_CANDIDATE_SHORTLIST_PARTIAL` — *placeholder.* The later lane would record this when the shortlist is
  partly formed and partly open.
- `CONCRETE_CANDIDATE_SHORTLIST_REJECTED` — *placeholder.* The later lane would record this when no candidate
  could be coherently shortlisted within the bound.
- `PATCH_REQUIRED_CONCRETE_CANDIDATE_SHORTLIST_AMBIGUOUS` — *placeholder.* The later lane would record this if a
  shortlist could not be recorded without amendment.

> **These tokens are placeholders, not this PR's result.** This template selects none of them. Even a later
> `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` would **not** by itself accept a host or satisfy gate #8 — host
> acceptance requires a separate acceptance gate (EQ-3), and discharging gate #8 requires the gate-#8 trigger (a
> *proposed production adapter* + the sibling-repo handoff citation + preserved ADR-022D invariants), a separate,
> later, separately-reviewed lane (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
> `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

---

## 6. Placeholder status (explicit)

Stated plainly so no reviewer mistakes the template for a result:

1. This file is a **template / checklist**, not a decision artifact.
2. Every `‹fill: …›` marker and every unchecked box is a **placeholder**; none is filled or checked here.
3. Every classification token in §5 is a **placeholder**; none is selected here.
4. The packet may be filled **only after** the concrete-candidate naming authorization (File 2) is intaken; until
   then it stays blank, and it names no candidate now.
5. **These placeholders are not this PR's result.** This PR's results are recorded in File 1
   (`EXACT_GRAIN_AUTHORITY_PARTIAL`), File 2 (`CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`), File 3
   (`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`), and File 4 (`SIBLING_EVIDENCE_REQUEST_PREPARED`); this file
   records nothing.

---

## 7. Explicit prohibitions in this template artifact

This template artifact itself, and any later PR that fills it, **must not**:

- name a concrete candidate **now** — this template names none; only a later PR (after the naming authorization is
  intaken) may name, and only within the EQ-2 categories;
- select a concrete product / vendor / engine / deployment provider **now** — this template selects none;
- select a production database **now** — this template selects none;
- select a concrete physical host **now** — this template selects none; the host stays **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- propose a production adapter — the gate-#8 `M5` shape, reserved for a separate, later lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- make any source / test / runtime / config / package / CI / schema / migration / SQL change;
- introduce production wiring;
- claim that gate #8 (or gate #9 / #10, D.1, D.2, or MVP-2) is closed, satisfied, or discharged.

> This template carries **no** result, prepares **no** shortlist, names **no** concrete candidate, names **no**
> product / vendor / engine / deployment provider, selects **no** host, selects **no** production database,
> proposes **no** production adapter, and authorizes **no** implementation. The canonical-store physical host
> remains **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`), and
> gate #8 remains **OPEN / HELD** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

---

*End of Phase 49C File 5 concrete-candidate shortlist packet template / checklist. Docs-only companion to File 1
([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md)),
File 2
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NAMING-AUTHORIZATION-GATE.md)),
File 3
([`./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md)),
and File 4
([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md)).
It is a bounded template / checklist for a later concrete-candidate shortlist PR to copy and fill **only after**
the concrete-candidate naming authorization is intaken. It carries no result, prepares no shortlist, names no
concrete candidate, selects no concrete host, selects no production database, names no product / vendor / engine /
deployment provider, proposes no production adapter, and authorizes no implementation. The classification tokens
`CONCRETE_CANDIDATE_SHORTLIST_PREPARED` / `CONCRETE_CANDIDATE_SHORTLIST_PARTIAL` /
`CONCRETE_CANDIDATE_SHORTLIST_REJECTED` / `PATCH_REQUIRED_CONCRETE_CANDIDATE_SHORTLIST_AMBIGUOUS` are placeholders
only, not this PR's result. No commit, no push, no PR.*
