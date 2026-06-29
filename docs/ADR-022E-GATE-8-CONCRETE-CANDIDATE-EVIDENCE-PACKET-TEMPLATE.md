# Phase 49E — ADR-022E Gate #8 Concrete-Candidate Evidence Packet Template / Checklist

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49E** — companion **template / checklist**, not a decision artifact.
> **Scope**: This file is a **bounded evidence packet template** the later concrete-candidate **evidence packet**
> lane copies and fills. **It carries no result of its own.** Filling it in a later PR produces an evidence
> classification *there*; copying it here records **nothing**. Every classification token below is a
> **placeholder**, not this PR's result.

**Template, not decision.** This document is a template / checklist only. It contains **no** evidence, makes **no**
classification, ranks **no** candidate, accepts **no** candidate, satisfies **no** gate, selects **no** host,
selects **no** production database, proposes **no** production adapter, and authorizes **no** implementation. The
decision artifacts for Phase 49E are **Files 1, 2, 3, 5, and 6**; this is their companion template.

---

## 1. Link back to Files 1–3 and Phase 49D

This packet template exists **only** because the Phase 49E gates authorized a *later* evidence lane and fixed its
grain. Read these first; this template is meaningless without them:

- **Phase 49E File 1 — evidence-authorization response** —
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md):
  recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` (`:171`); EAQ-1 … EAQ-6 answers.
- **Phase 49E File 2 — evidence-lane authorization** —
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md):
  recorded `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`; fixed the later lane's scope.
- **Phase 49E File 3 — evidence-grain boundary** —
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md):
  recorded `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`; fixed the allowed grain and forbidden details.
- **Phase 49D File 1 — shortlist** —
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md):
  recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`); named the five candidates.
- The **`P-1 … P-11`** decomposition this packet collects against is defined at
  `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`.

> Read Files 1–3 first. This template is meaningless without the authorization, the lane scope, the grain boundary,
> and the candidate shortlist those files fix.

---

## 2. Evidence packet purpose

A later evidence packet PR can **copy this packet, fill every field, and classify the evidence** for each of the
five Phase 49D candidates after Phase 49E's evidence-lane authorization. The packet:

- gives the later lane a fixed, inspectable shape so its evidence is reviewable field-by-field against
  `P-1 … P-11`;
- keeps the later lane bounded — the forbidden-detail self-check and the explicit prohibitions (§4, §5, §7) travel
  with the packet so the evidence packet PR cannot drift into ranking, acceptance, host selection, an adapter
  proposal, or implementation;
- carries **no** result here — the placeholders are filled *there*, not here.

> Copying this file does not produce evidence and does not classify anything. Only a later evidence packet PR that
> *fills* the fields and *selects* a classification produces a result, and that result lives in that PR.

---

## 3. How to use this template (later evidence packet PR)

1. Copy this file to a new Phase 49F (or later) docs file under `docs/`.
2. Use **one packet instance per candidate** (all five may be gathered in parallel, per EAQ-3).
3. Fill **Source lineage**, **Candidate identity**, **Evidence source inventory**, **Evidence freshness / citation
   posture**, and the **Forbidden-detail self-check**.
4. Fill each **`P-x` evidence field** with the evidence shape required, drawn only from the File 3 allowed grain
   (public/provider-documentation plus repo-local architecture evidence), cited to `file:line` for repo-local
   evidence. Produce the evidence in that PR; do not produce it here.
5. Fill the **Sibling-evidence posture** and **Adapter / implementation separation posture**.
6. Select exactly one **Candidate evidence classification placeholder** (§5) as that candidate's result.
7. Complete the **Preserved blocked-state confirmation**.
8. Keep the **Explicit prohibitions** (§7) intact; a reviewer uses them to refuse scope creep.

---

## 4. Required packet sections (copy and fill)

> Everything below is a **blank template**. The `‹fill: …›` markers and the unchecked boxes are placeholders.
> Nothing here is filled, checked, or classified in this PR.

### 4.1 Source lineage

- Predecessor phases: ‹fill: Phase 49C → 49D → 49E (Files 1–6), each with `file:line`›
- Authorizing gate (File 2): ‹fill: `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md:‹line›`›
- Grain boundary (File 3): ‹fill: `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md:‹line›`›
- Phase 49D shortlist result: ‹fill: `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` with `file:line`›

### 4.2 Candidate identity

- Candidate display name: ‹fill: one of `PostgreSQL` / `Railway PostgreSQL` / `Supabase Postgres` / `Neon Postgres` / `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`›
- EQ-2 category membership: ‹fill: database engine / deployment provider / self-hosted option›
- Ownership boundary: ‹fill: `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`›
- Semantic owner: ‹fill: `loa-straylight`›
- Candidate grain confirmation: ‹fill: named only within an EQ-2 category — no leaked deployment fact›

### 4.3 Evidence source inventory

- Public/provider-documentation sources: ‹fill: descriptive capability sources, at capability grain only›
- Repo-local architecture sources: ‹fill: `file:line` references to local docs / code›
- Read-only local code inspection notes (if any): ‹fill: `file:line`, read-only›

### 4.4 Evidence freshness / citation posture

- Citation posture: ‹fill: how each claim is cited; repo-local evidence cited to `file:line`›
- Freshness posture: ‹fill: how public/provider-documentation currency is characterized at capability grain, without leaking a deployment fact›

### 4.5 Forbidden-detail self-check

Confirm the filled packet introduces **none** of the following (each must remain absent):

- [ ] no credentials, credential values, secrets, API keys, tokens, or private keys
- [ ] no connection strings, host URLs, ports, or endpoints
- [ ] no account identifiers, project identifiers, regions, or topology
- [ ] no production wiring, deployment steps, or implementation details
- [ ] no product / host selection and no production database selection
- [ ] no production-adapter proposal (the gate-#8 `M5` shape — reserved for a separate, later lane)

### 4.6 `P-1` evidence field — Candidate identity / ownership evidence

- Requirement: evidence must show the candidate remains substrate-class and Straylight-owned.
- Evidence: ‹fill: what the evidence shows, within the File 3 grain, cited where repo-local›

### 4.7 `P-2` evidence field — Durability evidence

- Requirement: evidence must show durable-persistence capability at the allowed grain.
- Evidence: ‹fill: …›

### 4.8 `P-3` evidence field — Tenant / actor / estate isolation evidence

- Requirement: evidence must show isolation capability.
- Evidence: ‹fill: …›

### 4.9 `P-4` evidence field — Migration / schema ownership evidence

- Requirement: evidence must show schema / migration ownership remains Straylight's.
- Evidence: ‹fill: …›

### 4.10 `P-5` evidence field — Runtime writer boundary evidence

- Requirement: evidence must show governed writer-boundary capability.
- Evidence: ‹fill: …›

### 4.11 `P-6` evidence field — Read / recall boundary evidence

- Requirement: evidence must show recall-readable canonical-estate boundary capability.
- Evidence: ‹fill: …›

### 4.12 `P-7` evidence field — Audit / receipt persistence evidence

- Requirement: evidence must show audit and receipt persistence capability.
- Evidence: ‹fill: …›

### 4.13 `P-8` evidence field — Failure / rollback / recovery evidence

- Requirement: evidence must show recovery capability.
- Evidence: ‹fill: …›

### 4.14 `P-9` evidence field — Permission / auth / signer authority evidence

- Requirement: evidence must show permission / auth / signer capability, described as a role, not a secret.
- Evidence: ‹fill: …›

### 4.15 `P-10` evidence field — No-leak / public-private projection evidence

- Requirement: evidence must show the forbidden-grain and no-leak boundaries are preserved.
- Evidence: ‹fill: …›

### 4.16 `P-11` evidence field — Test / evidence shape evidence

- Requirement: evidence must define an inspectable evidence shape without implementation.
- Evidence: ‹fill: …›

### 4.17 Sibling-evidence posture

- Finn (gate #9): ‹fill: posture, per File 5 timing — not required before gathering, required before acceptance›
- Dixie (gate #10): ‹fill: posture, per File 5 timing›
- Hounfour: ‹fill: only-if-required if schema / protocol responsibilities become implicated›

### 4.18 Adapter / implementation separation posture

- [ ] gathering this evidence proposes no production adapter
- [ ] gathering this evidence authorizes no implementation
- [ ] the gate-#8 `M5` adapter-proposal shape remains a separate, later lane

### 4.19 Candidate evidence classification placeholder

- Selected classification (later PR only): ‹fill: exactly one token from §5›
- Reasoning: ‹fill: why that classification, cited to the filled `P-x` fields above›

### 4.20 Preserved blocked-state confirmation

- [ ] gate #8 remains **`OPEN / HELD`**
- [ ] gate #9 remains held with **`PARTIAL_RECORDED`**
- [ ] gate #10 remains held with **`PARTIAL_RECORDED`**
- [ ] D.1(ii) remains **unresolved**
- [ ] D.1 is **not satisfied**
- [ ] D.2 is **not started**
- [ ] MVP-2 remains **open**
- [ ] the concrete canonical-store physical host remains **unselected**

---

## 5. Candidate evidence classification placeholders

The later evidence packet PR selects **exactly one** of the following per candidate as **its** result. **These are
placeholders only — none is selected, recorded, or implied by this PR:**

- `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PREPARED` — *placeholder.* The later lane would record this if the filled
  `P-1 … P-11` fields each show the required evidence within the allowed grain.
- `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL` — *placeholder.* The later lane would record this if some `P-x`
  fields show the required evidence and others do not.
- `CONCRETE_CANDIDATE_EVIDENCE_PACKET_REJECTED` — *placeholder.* The later lane would record this if the required
  evidence is absent or contradicted.
- `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_PACKET_AMBIGUOUS` — *placeholder.* The later lane would record this if
  the result cannot be recorded without amendment.

> **These tokens are placeholders, not this PR's result.** This template selects none of them. Even a later
> `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PREPARED` would **not** rank a candidate, accept a candidate, select a host,
> propose an adapter, authorize implementation, or satisfy gate #8 — discharging gate #8 requires the gate-#8
> trigger (a *proposed production adapter* + the sibling-repo handoff citation + preserved ADR-022D invariants),
> which is a separate, later, separately-reviewed lane
> (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

---

## 6. Placeholder status (explicit)

Stated plainly so no reviewer mistakes the template for a result:

1. This file is a **template / checklist**, not a decision artifact.
2. Every `‹fill: …›` marker and every unchecked box is a **placeholder**; none is filled or checked here.
3. Every classification token in §5 is a **placeholder**; none is selected here.
4. **These placeholders are not this PR's result.** Phase 49E's results live in Files 1, 2, 3, 5, and 6; this file
   records nothing.

---

## 7. Explicit prohibitions (carried into the later evidence packet PR)

The later evidence packet PR that fills this packet **must not**:

- accept any candidate;
- rank candidates;
- select a host;
- select a production database;
- propose a production adapter;
- make any source / test / runtime / config / package / CI / schema / migration / SQL change, or introduce
  production wiring;
- claim that gate #8 (or gate #9 / #10, D.1, D.2, or MVP-2) is closed, satisfied, or discharged.

> The later lane gathers evidence against the authorized `P-1 … P-11` requirements within the File 3 grain and
> **nothing more**. A classification — even a `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PREPARED` — ranks no candidate,
> accepts no candidate, selects no host, proposes no adapter, authorizes no implementation, and satisfies no gate.
> The canonical-store physical host remains **UNSELECTED**
> (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`), and gate #8 remains
> **OPEN / HELD** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

---

*End of Phase 49E evidence packet template / checklist. Docs-only companion to Files 1–3 and Phase 49D File 1. It
is a bounded template / checklist for the later concrete-candidate evidence packet lane to copy and fill, one
instance per candidate (`PostgreSQL`; `Railway PostgreSQL`; `Supabase Postgres`; `Neon Postgres`; `Self-hosted
PostgreSQL on future Straylight-controlled infrastructure`). It carries no result, produces no evidence, classifies
nothing, ranks no candidate, accepts no candidate, selects no host, selects no production database, proposes no
production adapter, and authorizes no implementation. The classification tokens
`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PREPARED` / `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL` /
`CONCRETE_CANDIDATE_EVIDENCE_PACKET_REJECTED` / `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_PACKET_AMBIGUOUS` are
placeholders only, not this PR's result. No commit, no push, no PR.*
