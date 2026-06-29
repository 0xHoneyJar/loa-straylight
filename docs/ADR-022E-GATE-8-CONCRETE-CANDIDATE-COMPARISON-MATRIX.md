# Phase 49D — ADR-022E Gate #8 Concrete-Candidate Comparison Matrix

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49D (File 2 of 6)** — docs-only **candidate comparison matrix** for the canonical-store
> substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / comparison-record only.** Phase 49D File 1 recorded
> **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`) — five concrete candidates named within the
> EQ-2 categories. This file **compares those shortlisted candidates** across the `P-1 … P-11` expected-evidence
> areas and the EQ-2 operational axes the authority permits, and records **`CONCRETE_CANDIDATE_COMPARISON_RECORDED`**.
> EQ-3 permits comparison but withholds final-host acceptance
> (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`). It **compares; it accepts no
> candidate.** It selects **no** concrete physical host, selects **no** production database, accepts **no**
> candidate, proposes **no** production adapter, and authorizes **no** implementation. It introduces **none** of the
> EQ-2 forbidden details. The only change on this branch is **six** new Markdown files under `docs/`. No source,
> test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`,
> `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049D` — following the live convention for the Phase 48 / 49 family. It records a bounded
**comparison** at the EQ-2 grain: the cells describe *expected* evidence areas and operational characteristics, not
measured facts, not a ranking that selects a winner. The immediate predecessor is **Phase 49D File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md)),
which recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED`.

This is **File 2 of 6** in Phase 49D.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — C-1 PostgreSQL (database engine); C-2 Railway PostgreSQL, C-3 Supabase Postgres, C-4 Neon Postgres (deployment providers); C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure (self-hosted option). | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Phase 49C File 1 — EQ-3** | A later PR may compare multiple candidates but must not accept a final host without a separate acceptance gate. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152` |
| **Phase 48P — `P-1 … P-11`** | The evidence decomposition each candidate would later have to discharge; the comparison axes below are the *expected* areas, not produced evidence. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142` |
| **No-leak boundary** | The EQ-2 forbidden details stay absent; the comparison records role / engine / operational-option characteristics only. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**; semantic owner `loa-straylight`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 49D File 1's `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` is the entry baseline; this
> gate compares the shortlisted candidates within EQ-3 — and goes no further.

---

## 2. Comparison axes

The comparison is recorded across two axis groups, both at the EQ-2 grain only:

- **Operational axes** (EQ-2 categories): operational-ownership model; managed-vs-self-hosted; migration / schema
  ownership locus; backup / recovery ownership; credential-boundary role (described as a *role*, never a secret).
- **Expected-evidence axes** (`P-1 … P-11`,
  `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`): each cell names the *area* a
  candidate would later have to discharge, **not** a measured result. This file produces no evidence.

> The matrix compares *expected obligations*, not *measured facts*. No candidate is scored, ranked to a winner, or
> accepted. Each remains "shortlisted (held)" exactly as Phase 49D File 1 recorded
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`).

---

## 3. Operational-axis comparison

| Axis | C-1 PostgreSQL | C-2 Railway PostgreSQL | C-3 Supabase Postgres | C-4 Neon Postgres | C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure |
|------|----------------|------------------------|-----------------------|-------------------|----------------------------|
| EQ-2 category | database engine | deployment provider (managed) | deployment provider (managed) | deployment provider (managed) | managed-vs-self-hosted (self-hosted) |
| Operational-ownership model | engine kind only; provider-agnostic | provider-operated managed service | provider-operated managed service | provider-operated managed service | operator-owned (self-run) |
| Managed vs self-hosted | n/a (engine grain) | managed | managed | managed | self-hosted |
| Migration / schema ownership locus | `loa-straylight` (estate owner) | `loa-straylight` (estate owner) | `loa-straylight` (estate owner) | `loa-straylight` (estate owner) | `loa-straylight` (estate owner) |
| Backup / recovery ownership | engine-level expectation | provider-assisted (expected) | provider-assisted (expected) | provider-assisted (expected) | operator-owned (expected) |
| Credential-boundary role | role only; no secret recorded | role only; no secret recorded | role only; no secret recorded | role only; no secret recorded | role only; no secret recorded |
| Estate-owner boundary | `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` | same | same | same | same |

> Every cell is a role / option characteristic at the EQ-2 grain. No connection string, port, region, topology,
> account / project identifier, or production-wiring detail appears
> (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`). Migration / schema ownership
> stays with `loa-straylight` in every column — ownership does not follow the engine or provider choice
> (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`;
> `docs/decisions/ADR-020A-straylight-semantic-owner.md:45`).

---

## 4. Expected-evidence-axis comparison (`P-1 … P-11`)

Each cell names the *expected* evidence area the candidate would later have to discharge, not a measured result.
Because C-1 … C-5 are all PostgreSQL-engine candidates differing only by operational option, the expected-evidence
areas are largely shared; the *operational* differences (managed vs self-hosted) concentrate at `P-2`, `P-7`, and
`P-8`.

| `P-n` (Phase 48P) | Shared expectation across C-1 … C-5 | Where candidates differ |
|-------------------|-------------------------------------|-------------------------|
| `P-1` identity / ownership | candidate identity under `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` | none — ownership is shared |
| `P-2` durability | durable persistence of canonical primitives | managed providers vs self-hosted differ in *who operates* durability |
| `P-3` tenant / actor / estate isolation | estate isolation expectation | none at engine grain |
| `P-4` migration / schema ownership | `loa-straylight`-owned migrations | none — ownership is shared |
| `P-5` runtime writer boundary | writer boundary preserved (Finn lane held) | none at engine grain |
| `P-6` read / recall boundary | recall boundary preserved (Dixie lane held) | none at engine grain |
| `P-7` audit / receipt persistence | ADR-022D audit-chain invariants preserved (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:111`) | operator differs for managed vs self-hosted |
| `P-8` failure / rollback / recovery | recovery expectation | provider-assisted vs operator-owned recovery |
| `P-9` permission / auth / signer authority | signer authority unchanged | none at engine grain |
| `P-10` no-leak / public-private projection | forbidden-grain details absent (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`) | none |
| `P-11` test / evidence shape | proposed-adapter + handoff-citation evidence shape (a separate later lane) (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`) | none — shape is shared |

> These are *expected* areas, not produced evidence. The comparison narrows nothing to a decision: gathering the
> `P-1 … P-11` evidence is a separate, later, separately-authorized lane (Phase 49D File 6 frames the request).

---

## 5. What the comparison does not do

The comparison is bounded so no later step can read a selection out of it:

- it does **not** rank candidates to a single winner;
- it does **not** score candidates against measured facts (no facts are produced);
- it does **not** accept any candidate — acceptance requires a separate acceptance gate (EQ-3,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`);
- it does **not** select a production database, a provider, or a host;
- it does **not** propose an adapter or authorize implementation (EQ-5 / EQ-6).

---

## 6. Comparison decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_COMPARISON_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_COMPARISON_RECORDED`** — a coherent comparison of the five shortlisted candidates,
   across the operational axes (§3) and the `P-1 … P-11` expected-evidence axes (§4), is recorded within EQ-3's
   compare-but-do-not-accept bound. The comparison is recorded above.
2. **It is *not* `CONCRETE_CANDIDATE_COMPARISON_HELD`** — a held result would apply only if the comparison could not
   be formed (for example, if the shortlist were missing or the axes undefined). The shortlist is recorded and the
   axes are defined, so the comparison is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_COMPARISON_AMBIGUOUS`** — a patch result would apply if the
   comparison were ambiguous, internally inconsistent, or impossible to record without amendment. The comparison is
   unambiguous and bounded: expected obligations only, no scoring, no acceptance, no forbidden detail. No patch is
   required.

> **Comparison-recorded ≠ candidate ranked ≠ candidate selected ≠ candidate accepted ≠ host selected ≠ adapter
> proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_COMPARISON_RECORDED` is the result of *this comparison gate only*. **Gate #8 remains
> OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: carry the comparison into the exclusion / hold rationale and the evidence-authorization
> request.** The comparison feeds Phase 49D File 3 (which records why every candidate is held, none excluded) and
> Phase 49D File 6 (which frames the `P-1 … P-11` evidence-authorization request). No acceptance, adapter, or
> implementation follows from the comparison.

- **File 3 reference**:
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md)
  — records `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`.
- **File 6 reference**:
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md)
  — records `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`.

Any follow-on PR title must carry its phase label, e.g. `Phase 49E: concrete-candidate evidence` *(docs-only)*.

---

## 8. Preserved blocked state

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

## 9. Preserved non-claims

Each item below is preserved as a **negation**. This concrete-candidate comparison matrix:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not rank** candidates to a winner — it compares expected obligations only;
- **does not score** candidates against measured facts — none is produced;
- **selects no concrete candidate** — comparison is not selection;
- **accepts no candidate** — acceptance requires a separate acceptance gate (EQ-3);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later, separate request (EQ-5);
- **authorizes no implementation** of any kind (EQ-6);
- **introduces no forbidden detail**
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Recording a comparison is not ranking,
> scoring, selecting, accepting, proposing an adapter, satisfying any gate, or authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49D (File 2 of 6) — gate #8 concrete-candidate comparison matrix (docs-only) |
| **Predecessor** | Phase 49D File 1 — recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` |
| **Decision result** | **`CONCRETE_CANDIDATE_COMPARISON_RECORDED`** — a coherent comparison across operational and `P-1 … P-11` expected-evidence axes within EQ-3's compare-but-do-not-accept bound; not `CONCRETE_CANDIDATE_COMPARISON_HELD` (the comparison is formable), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_COMPARISON_AMBIGUOUS` (the comparison is unambiguous and bounded) |
| **Compared candidates** | C-1 PostgreSQL; C-2 Railway PostgreSQL; C-3 Supabase Postgres; C-4 Neon Postgres; C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure — all remain "shortlisted (held)" |
| **Comparison axes** | operational (ownership model, managed-vs-self-hosted, migration/schema ownership, backup/recovery, credential-boundary role); expected-evidence (`P-1 … P-11`) |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | carry the comparison into the exclusion / hold rationale (File 3) and the evidence-authorization request (File 6) |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49D files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Comparison bounded.** §2–§5 compare expected obligations only; no ranking to a winner, no scoring against
      measured facts, no acceptance.
- [ ] **Result conservative and explained.** §6 records `CONCRETE_CANDIDATE_COMPARISON_RECORDED` and explains why it
      is not HELD and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §7 carries the comparison into the exclusion / hold and evidence-authorization lanes;
      authorizes nothing new.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, host selection,
      production-database selection, a ranked / selected / accepted candidate, a proposed production adapter, or
      implementation — each appears only inside a negation (§8, §9).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      container / orchestration detail, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 12. Source references

- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`). **Entry baseline / predecessor.**
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — EQ-3 compare but no
  acceptance (`:152`); EQ-2 categories / forbidden details (`:132`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — named the candidate at
  substrate-class grain (`:108`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`);
  the future-Postgres substrate naming (`:80`); the Phase-5 hardening invariants (`:111`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49D File 2. Docs-only gate #8 concrete-candidate comparison matrix. It compares the five shortlisted
candidates (PostgreSQL; Railway PostgreSQL; Supabase Postgres; Neon Postgres; Self-hosted PostgreSQL on future Straylight-controlled infrastructure) across the
operational axes (ownership model, managed-vs-self-hosted, migration/schema ownership, backup/recovery,
credential-boundary role) and the `P-1 … P-11` expected-evidence axes, recording *expected obligations* only — not
measured facts, not a ranking to a winner. It introduces no forbidden detail, ranks no candidate to a winner,
scores nothing, selects no host, selects no production database, accepts no candidate, proposes no production
adapter, and authorizes no implementation, and records `CONCRETE_CANDIDATE_COMPARISON_RECORDED` (not
`CONCRETE_CANDIDATE_COMPARISON_HELD`, not `PATCH_REQUIRED_CONCRETE_CANDIDATE_COMPARISON_AMBIGUOUS`). The selected
next lane carries the comparison into the exclusion / hold rationale and the evidence-authorization request. No
commit, no push, no PR.*
