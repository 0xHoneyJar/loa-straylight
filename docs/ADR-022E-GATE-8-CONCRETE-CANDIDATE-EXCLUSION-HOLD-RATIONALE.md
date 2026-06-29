# Phase 49D — ADR-022E Gate #8 Concrete-Candidate Exclusion / Hold Rationale

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49D (File 3 of 6)** — docs-only **exclusion / hold rationale** for the canonical-store
> substrate-class candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / disposition-record only.** Phase 49D File 1 recorded
> **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`) and
> Phase 49D File 2 recorded **`CONCRETE_CANDIDATE_COMPARISON_RECORDED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md:125`). This file **records the disposition of each
> shortlisted candidate** — which are held, which (if any) are excluded, and why — and records
> **`CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`**. It **records dispositions; it accepts and rejects no candidate
> on the merits.** It selects **no** concrete physical host, selects **no** production database, accepts **no**
> candidate, proposes **no** production adapter, and authorizes **no** implementation. It introduces **none** of the
> EQ-2 forbidden details. The only change on this branch is **six** new Markdown files under `docs/`. No source,
> test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`,
> `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049D` — following the live convention for the Phase 48 / 49 family. It records bounded
**dispositions**: a *held* disposition keeps a candidate on the shortlist pending later evidence; an *excluded*
disposition removes one only on a bounded, non-merits ground (e.g. category mismatch). No candidate is rejected on
durability / fitness merits here — that requires the later `P-1 … P-11` evidence lane. The immediate predecessor is
**Phase 49D File 2**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md)),
which recorded `CONCRETE_CANDIDATE_COMPARISON_RECORDED`.

This is **File 3 of 6** in Phase 49D.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — C-1 … C-5 named within EQ-2 categories. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Phase 49D File 2 — comparison** | Recorded **`CONCRETE_CANDIDATE_COMPARISON_RECORDED`** — expected obligations compared, no ranking to a winner. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md:125` |
| **Phase 49C File 1 — EQ-3** | Compare allowed; final-host acceptance withheld pending a separate gate. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152` |
| **Phase 48P — `P-1 … P-11`** | Merits evaluation (durability / fitness) is the later evidence lane, not this disposition gate. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only.

---

## 2. Disposition rule

Each shortlisted candidate receives exactly one disposition, drawn from a bounded set:

- **held** — the candidate stays on the shortlist, its merits unevaluated, pending the later `P-1 … P-11` evidence
  lane. This is the default for a shortlisted candidate that names a valid EQ-2 category and introduces no
  forbidden detail.
- **excluded (bounded ground)** — the candidate is removed **only** on a non-merits ground that does not require
  evidence: a category mismatch, a duplicate, or a name that would force a forbidden-grain leak. Merits-based
  exclusion (durability / fitness) is **not** available here; it is the later evidence lane's outcome.

> Holding is not accepting; excluding on a bounded ground is not rejecting on the merits. No candidate's fitness is
> decided here (EQ-3, `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`).

---

## 3. Per-candidate disposition

| Candidate | EQ-2 category | Disposition | Ground |
|-----------|---------------|-------------|--------|
| C-1 PostgreSQL | database engine | **held** | valid engine-grain category; no forbidden detail; merits deferred to evidence lane |
| C-2 Railway PostgreSQL | deployment provider (managed) | **held** | valid provider-grain category; no forbidden detail; merits deferred |
| C-3 Supabase Postgres | deployment provider (managed) | **held** | valid provider-grain category; no forbidden detail; merits deferred |
| C-4 Neon Postgres | deployment provider (managed) | **held** | valid provider-grain category; no forbidden detail; merits deferred |
| C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure | managed-vs-self-hosted (self-hosted) | **held** | valid operational-option category; no forbidden detail; merits deferred |

> **No candidate is excluded.** All five remain held pending the later `P-1 … P-11` evidence lane. None is excluded
> because none triggers a bounded exclusion ground (no category mismatch, no duplicate, no forbidden-grain leak),
> and merits-based exclusion is unavailable at this gate.

---

## 4. Why no merits exclusion here

A merits-based exclusion (e.g. "candidate X cannot satisfy `P-2` durability") would require the `P-1 … P-11`
evidence that this PR does not gather and is not authorized to gather:

- the evidence lane is a **separate, later, separately-authorized** step (Phase 49D File 6 frames the request;
  `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`);
- excluding a candidate on unmeasured merits would smuggle a selection decision into a disposition gate, which
  EQ-3 forbids (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`);
- holding all coherent candidates preserves the widest later choice and avoids premature narrowing.

---

## 5. Disposition decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`** — each shortlisted candidate's disposition is recorded
   (all five held, none excluded) with its bounded ground (§3), and the absence of merits-based exclusion is
   explained (§4). The dispositions are recorded above.
2. **It is *not* `CONCRETE_CANDIDATE_EXCLUSION_HOLD_HELD`** — a held result would apply only if no disposition
   could be recorded (for example, if the shortlist or the disposition rule were missing). The shortlist is
   recorded and the rule is defined, so the dispositions are recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_EXCLUSION_HOLD_AMBIGUOUS`** — a patch result would apply if a
   disposition were ambiguous, internally inconsistent, or impossible to record without amendment. Every candidate
   has exactly one bounded disposition; no merits exclusion is attempted. No patch is required.

> **Disposition-recorded ≠ candidate accepted ≠ candidate rejected on the merits ≠ candidate selected ≠ host
> selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED` is the result of *this disposition gate only*. **Gate #8 remains
> OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: carry the held dispositions into the sibling-evidence posture and the evidence-authorization
> request.** Because all five candidates are held, the next docs-only steps record their per-candidate
> sibling-evidence posture (Phase 49D File 4) and frame the `P-1 … P-11` evidence-authorization request (Phase 49D
> File 6). No acceptance, adapter, or implementation follows.

- **File 4 reference**:
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md)
  — records `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`.
- **File 6 reference**:
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md)
  — records `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`.

Any follow-on PR title must carry its phase label, e.g. `Phase 49E: concrete-candidate evidence` *(docs-only)*.

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

Each item below is preserved as a **negation**. This concrete-candidate exclusion / hold rationale:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not accept** any candidate — holding is not accepting;
- **does not reject** any candidate on the merits — merits evaluation is the later evidence lane;
- **selects no concrete candidate** — disposition is not selection;
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

> Every notion above appears in this document only inside a negation. Recording dispositions is not accepting any
> candidate, rejecting any candidate on the merits, selecting any host, proposing any adapter, satisfying any gate,
> or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49D (File 3 of 6) — gate #8 concrete-candidate exclusion / hold rationale (docs-only) |
| **Predecessor** | Phase 49D File 2 — recorded `CONCRETE_CANDIDATE_COMPARISON_RECORDED` |
| **Decision result** | **`CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`** — each candidate's disposition recorded (all five held, none excluded) with bounded grounds; not `CONCRETE_CANDIDATE_EXCLUSION_HOLD_HELD` (the dispositions are recordable), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_EXCLUSION_HOLD_AMBIGUOUS` (the dispositions are unambiguous and bounded) |
| **Dispositions** | C-1 PostgreSQL held; C-2 Railway PostgreSQL held; C-3 Supabase Postgres held; C-4 Neon Postgres held; C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure held; none excluded |
| **Merits exclusion** | not available at this gate; deferred to the later `P-1 … P-11` evidence lane |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | carry held dispositions into the sibling-evidence posture (File 4) and the evidence-authorization request (File 6) |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49D files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Dispositions bounded.** §2–§4 record one bounded disposition per candidate; no merits-based exclusion is
      attempted; no candidate is accepted.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED` and explains
      why it is not HELD and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 carries the held dispositions into the sibling-evidence posture and
      evidence-authorization lanes; authorizes nothing new.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, host selection,
      production-database selection, an accepted / merits-rejected / selected candidate, a proposed production
      adapter, or implementation — each appears only inside a negation (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      container / orchestration detail, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49D File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-COMPARISON-MATRIX.md) — recorded
  `CONCRETE_CANDIDATE_COMPARISON_RECORDED` (`:125`). **Entry baseline / predecessor.**
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`).
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — EQ-3 compare but no
  acceptance (`:152`); EQ-2 categories / forbidden details (`:132`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — named the candidate at
  substrate-class grain (`:108`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the no-leak enumerated
  forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`);
  the Phase-5 hardening invariants (`:111`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49D File 3. Docs-only gate #8 concrete-candidate exclusion / hold rationale. It records the
disposition of each shortlisted candidate — C-1 PostgreSQL, C-2 Railway PostgreSQL, C-3 Supabase Postgres, C-4 Neon
Postgres, and C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure are all **held**, none excluded — with bounded, non-merits grounds, and
explains that merits-based exclusion (durability / fitness) is unavailable here and deferred to the later
`P-1 … P-11` evidence lane. It accepts no candidate, rejects no candidate on the merits, selects no host, selects
no production database, proposes no production adapter, authorizes no implementation, and introduces no forbidden
detail, and records `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED` (not `CONCRETE_CANDIDATE_EXCLUSION_HOLD_HELD`, not
`PATCH_REQUIRED_CONCRETE_CANDIDATE_EXCLUSION_HOLD_AMBIGUOUS`). The selected next lane carries the held dispositions
into the sibling-evidence posture and the evidence-authorization request. No commit, no push, no PR.*
