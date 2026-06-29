# Phase 49D — ADR-022E Gate #8 Concrete-Candidate Evidence-Authorization Request Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49D (File 6 of 6)** — docs-only **evidence-authorization request** gate for the canonical-store
> substrate-class candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / request-record only.** Phase 49D File 1 recorded
> **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`), and
> Files 2–5 recorded the comparison, dispositions, and postures. Phase 49C File 1's EQ-4 names `P-1 … P-11` evidence
> plus the sibling and no-leak posture as the prerequisite before any named candidate can be accepted
> (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:161`). This file **frames a bounded request**
> (EAQ-1 … EAQ-6) asking a separate authority whether a *later* PR may gather `P-1 … P-11` evidence against the
> shortlisted candidates, and records **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`**. It **records
> a request; it does not answer it and does not gather evidence.** It selects **no** concrete physical host, selects
> **no** production database, accepts **no** candidate, proposes **no** production adapter, and authorizes **no**
> implementation. The only change on this branch is **six** new Markdown files under `docs/`. No source, test,
> runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`,
> `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049D` — following the live convention for the question / answer / request / intake family.
It records a bounded **request** at evidence-gathering-authorization level: it asks whether a *later* PR may gather
`P-1 … P-11` evidence; it gathers none and answers nothing. The immediate predecessor is **Phase 49D File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md)),
which recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED`.

This is **File 6 of 6** in Phase 49D — the lane-selecting companion to Files 1–5.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — C-1 … C-5 held. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Phase 49D File 2 — comparison** | Recorded **`CONCRETE_CANDIDATE_COMPARISON_RECORDED`**. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md:125` |
| **Phase 49D File 3 — exclusion / hold** | Recorded **`CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`** — all five held. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md:94` |
| **Phase 49D File 4 — sibling-evidence posture** | Recorded **`CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`**. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md:103` |
| **Phase 49D File 5 — adapter / implementation posture** | Recorded **`CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED`**. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-ADAPTER-IMPLEMENTATION-POSTURE.md:106` |
| **Phase 49C File 1 — EQ-4** | Before any named candidate can be accepted, evidence must show across `P-1 … P-11` plus sibling posture and a no-leak self-check. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:161` |
| **Phase 48P — `P-1 … P-11`** | The evidence decomposition the request below references; the gate-#8-closure shape pinned at `P-11`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. The shortlist and postures are the entry baseline; this gate frames the
> evidence-authorization request they imply — and goes no further.

---

## 2. Why an evidence-authorization request is the right next step

EQ-4 makes `P-1 … P-11` evidence (plus sibling posture and no-leak self-check) the prerequisite before any named
candidate can be accepted (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:161`). But the
exact-grain authority response (Phase 49C File 1, `EXACT_GRAIN_AUTHORITY_PARTIAL`) authorized only naming /
comparison — it did **not** authorize gathering evidence or accepting a host. So gathering `P-1 … P-11` evidence
against the shortlisted candidates is itself a **separate authority** that must be requested, not assumed. This file
frames that request; it does not grant it.

---

## 3. Requested questions (EAQ-1 … EAQ-6)

The following six bounded questions are framed for a separate architecture / product authority. They are recorded
here exactly; none is answered:

- **EAQ-1 — may a later PR gather `P-1 … P-11` evidence against the shortlisted candidates?** May a later docs-only
  PR gather the `P-1 … P-11` evidence (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`)
  for C-1 … C-5, or must evidence-gathering itself await a further authority?
- **EAQ-2 — at which grain may evidence be recorded, and which details remain forbidden?** If EAQ-1 is yes, at which
  grain may evidence be recorded, and does the EQ-2 forbidden-detail list (account identifiers; project identifiers;
  credentials; connection strings; ports; regions; topology; production wiring; implementation details) still bind?
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
- **EAQ-3 — may evidence be gathered for all candidates, or must the shortlist narrow first?** May a later PR gather
  evidence across all five held candidates in parallel, or must the shortlist narrow to fewer candidates before
  evidence-gathering?
- **EAQ-4 — does evidence-gathering require sibling-owner participation up front?** Do the Finn (gate #9) and Dixie
  (gate #10) held-partial lanes (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md:103`) have to be
  opened before, during, or only after `P-1 … P-11` evidence-gathering?
- **EAQ-5 — does evidence-gathering authority include adapter-proposal permission?** Does any granted
  evidence-gathering authority include permission to propose a production adapter, or must adapter proposal remain a
  later, separate request (preserving EQ-5,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183`)?
- **EAQ-6 — does evidence-gathering authority include implementation authorization?** Does any granted
  evidence-gathering authority include implementation authorization, or must implementation remain a later, separate
  request (preserving EQ-6, `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191`)?

> The questions are framed and bounded. None is answered here; answering them is a separate, later response-intake
> gate, and gathering the evidence is a still-later lane.

---

## 4. What this request does not do

- it does **not** answer EAQ-1 … EAQ-6 — answering is a separate, later response-intake gate;
- it does **not** gather any `P-1 … P-11` evidence — gathering is a still-later lane;
- it does **not** narrow the shortlist — all five candidates remain held
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md:94`);
- it does **not** open any sibling lane or authorize any sibling PR
  (`docs/handoffs/cross-repo-handoff-index.md:28`);
- it does **not** accept a candidate, select a host, propose an adapter, or authorize implementation.

---

## 5. Request decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`** — the EAQ-1 … EAQ-6 questions are framed
   and bounded (§3), with the rationale (§2) and the explicit non-actions (§4). The request is recorded above.
2. **It is *not* `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_HELD`** — a held result would apply only if the
   request could not be framed (for example, if the shortlist or the EQ-4 prerequisite were missing). Both are
   recorded, so the request is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_AMBIGUOUS`** — a patch result
   would apply if the request were ambiguous, internally inconsistent, or impossible to record without amendment.
   The request is unambiguous and bounded: six framed questions, no answer, no evidence, no acceptance. No patch is
   required.

> **Request-recorded ≠ request answered ≠ evidence gathered ≠ candidate accepted ≠ host selected ≠ adapter proposed
> ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED` is the result of *this request gate only*. **Gate #8
> remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: a docs-only concrete-candidate evidence-authorization response intake gate.** Because the
> request is recorded, the next docs-only step (beyond this PR) intakes a separate authority's answer to EAQ-1 …
> EAQ-6 and records whether a *later* PR may gather `P-1 … P-11` evidence. It must not accept a final host, propose
> an adapter, or implement.

- That later response-intake lane **records the answer**; a still-later lane **gathers `P-1 … P-11` evidence**; and
  acceptance, adapter proposal, and implementation each remain separate, separately-authorized transitions
  (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`;
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

Any follow-on PR title must carry its phase label, e.g. `Phase 49E: concrete-candidate evidence-authorization
response` *(docs-only)*.

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

Each item below is preserved as a **negation**. This concrete-candidate evidence-authorization request gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not answer** EAQ-1 … EAQ-6 — answering is a separate, later response-intake gate;
- **does not gather** any `P-1 … P-11` evidence — gathering is a still-later lane;
- **does not narrow** the shortlist — all five candidates remain held;
- **does not open** any sibling lane or **authorize** any sibling PR;
- **accepts no candidate** — acceptance requires a separate acceptance gate (EQ-3);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later, separate request (EQ-5);
- **authorizes no implementation** of any kind (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Recording an evidence-authorization request is
> not answering it, gathering any evidence, narrowing the shortlist, accepting any candidate, selecting any host,
> proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49D (File 6 of 6) — gate #8 concrete-candidate evidence-authorization request gate (docs-only) |
| **Predecessor** | Phase 49D File 1 — recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED`; builds on Files 2–5 (comparison, dispositions, postures) |
| **Decision result** | **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`** — EAQ-1 … EAQ-6 framed and bounded; not `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_HELD` (the request is framable), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_AMBIGUOUS` (the request is unambiguous and bounded) |
| **Framed questions** | EAQ-1 (may gather `P-1 … P-11`?); EAQ-2 (grain / forbidden details); EAQ-3 (all candidates or narrow first?); EAQ-4 (sibling participation timing); EAQ-5 (adapter-proposal permission?); EAQ-6 (implementation authorization?) |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate evidence-authorization response intake gate; then a still-later `P-1 … P-11` evidence-gathering lane that must not accept a host, propose an adapter, or implement |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49D files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Request framed, not answered.** §3 frames EAQ-1 … EAQ-6; §4 records the non-actions; no question is
      answered, no evidence gathered, no shortlist narrowed.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`;
      not HELD, not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 selects the docs-only response-intake gate that must not accept a host, propose an
      adapter, or implement.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, host selection,
      production-database selection, an accepted candidate, gathered evidence, an answered request, a proposed
      production adapter, or implementation — each appears only inside a negation (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      container / orchestration detail, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`). **Entry baseline / predecessor.**
- [Phase 49D File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md) — recorded
  `CONCRETE_CANDIDATE_COMPARISON_RECORDED` (`:125`).
- [Phase 49D File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md) — recorded
  `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED` (`:94`).
- [Phase 49D File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md) — recorded
  `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED` (`:103`).
- [Phase 49D File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-ADAPTER-IMPLEMENTATION-POSTURE.md) — recorded
  `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED` (`:106`).
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — EQ-4 evidence prerequisite
  (`:161`); EQ-3 compare but no acceptance (`:152`); EQ-5 adapter separate (`:183`); EQ-6 implementation separate
  (`:191`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`);
  the Phase-5 hardening invariants (`:111`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49D File 6. Docs-only gate #8 concrete-candidate evidence-authorization request gate. Because Phase
49C File 1's EQ-4 makes `P-1 … P-11` evidence (plus sibling posture and no-leak self-check) the prerequisite before
any named candidate can be accepted — while the exact-grain authority granted only naming / comparison — gathering
that evidence is itself a separate authority that must be requested. This file frames six bounded questions (EAQ-1
may a later PR gather `P-1 … P-11` evidence against the shortlisted candidates; EAQ-2 at which grain and which
details remain forbidden; EAQ-3 all candidates or narrow first; EAQ-4 sibling-owner participation timing; EAQ-5
adapter-proposal permission; EAQ-6 implementation authorization) and records
`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED` (not
`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_HELD`, not
`PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_AMBIGUOUS`). It answers no question, gathers no
evidence, narrows no shortlist, accepts no candidate, selects no host, selects no production database, proposes no
production adapter, and authorizes no implementation. The selected next lane is a docs-only evidence-authorization
response intake gate. No commit, no push, no PR.*
