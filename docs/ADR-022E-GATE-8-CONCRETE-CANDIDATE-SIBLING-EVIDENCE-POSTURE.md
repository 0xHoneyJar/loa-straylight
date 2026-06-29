# Phase 49D — ADR-022E Gate #8 Concrete-Candidate Sibling-Evidence Posture

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49D (File 4 of 6)** — docs-only **sibling-evidence posture** for the canonical-store
> substrate-class candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / posture-record only.** Phase 49C File 4 recorded
> **`SIBLING_EVIDENCE_REQUEST_PREPARED`** (`docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md:113`),
> and Phase 49D File 1 recorded the shortlist **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`). This file **records the per-candidate
> sibling-evidence posture** — the Finn / Dixie / Hounfour position each held candidate inherits — and records
> **`CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`**. It **records a posture; it requests no sibling
> evidence, opens no sibling lane, authorizes no sibling PR, and modifies no sibling repo.** It selects **no**
> concrete physical host, selects **no** production database, accepts **no** candidate, proposes **no** production
> adapter, and authorizes **no** implementation. The only change on this branch is **six** new Markdown files under
> `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI,
> generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049D` — following the live convention for the Phase 48 / 49 family. It records a bounded
**posture**: per candidate, which sibling-evidence lanes apply and in what held state, populated from the lanes
Phase 49C File 4 prepared. The immediate predecessor is **Phase 49D File 3**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md)),
which recorded `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`; it inherits the lanes prepared in Phase 49C File 4
([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md)).

This is **File 4 of 6** in Phase 49D.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49C File 4 — sibling-evidence request preparation** | Recorded **`SIBLING_EVIDENCE_REQUEST_PREPARED`** — Finn / Dixie / Hounfour request lanes prepared but not authorized. | `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md:113` |
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — C-1 … C-5 held. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Sibling lanes (ADR-048B)** | Gate #9 = `loa-finn` runtime-evidence lane; gate #10 = `loa-dixie` boundary-evidence lane; `loa-hounfour` = schema / substrate lane, out of scope unless schema / protocol implicated. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255` |
| **Phase 48N — sibling evidence intake** | Gate #9 / #10 evidence results **`PARTIAL_RECORDED`** (×2); both gates **HELD**. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Cross-repo handoff rule** | No sibling-repo PR may merge without teammate review. | `docs/handoffs/cross-repo-handoff-index.md:28` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only.

---

## 2. Posture rule

The sibling-evidence posture is **engine / provider–independent**: all five candidates are PostgreSQL-engine
options differing only by operational model, and the canonical estate record is owned by `loa-straylight` in every
case (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`;
`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`). The three sibling surfaces remain **non-canonical
participant surfaces** only; none owns the canonical estate record, and the lanes stay separable in code, test, and
fixture (`docs/handoffs/finn-runtime-boundary.md:18`; `docs/handoffs/finn-runtime-boundary.md:59`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). The posture per candidate is
therefore identical, and is recorded — not requested — here.

---

## 3. Per-candidate sibling-evidence posture

| Candidate | `loa-finn` (gate #9) | `loa-dixie` (gate #10) | `loa-hounfour` (schema lane) |
|-----------|----------------------|------------------------|------------------------------|
| C-1 PostgreSQL | held `PARTIAL_RECORDED`; runtime-owner evidence required before any *runtime acceptance* tied to it | held `PARTIAL_RECORDED`; boundary-owner evidence required before any *boundary acceptance* tied to it | out of scope unless evidence implicates a schema / protocol change |
| C-2 Railway PostgreSQL | held `PARTIAL_RECORDED`; same | held `PARTIAL_RECORDED`; same | out of scope unless schema / protocol implicated |
| C-3 Supabase Postgres | held `PARTIAL_RECORDED`; same | held `PARTIAL_RECORDED`; same | out of scope unless schema / protocol implicated |
| C-4 Neon Postgres | held `PARTIAL_RECORDED`; same | held `PARTIAL_RECORDED`; same | out of scope unless schema / protocol implicated |
| C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure | held `PARTIAL_RECORDED`; same | held `PARTIAL_RECORDED`; same | out of scope unless schema / protocol implicated |

- **Finn (gate #9):** runtime-owner exact-grain evidence would be needed, via the gate #9 acceptance path requiring
  the Finn owner to explicitly ACCEPT, before any runtime acceptance tied to a candidate; gate #9 remains held with
  `PARTIAL_RECORDED` (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`). **None requested here.**
- **Dixie (gate #10):** boundary-owner exact-grain evidence would be needed, via the gate #10 acceptance path
  requiring the Dixie owner to explicitly ACCEPT, before any boundary acceptance tied to a candidate; gate #10
  remains held with `PARTIAL_RECORDED` (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`). **None requested here.**
- **Hounfour (schema lane):** remains a non-canonical participant; a schema / contract evidence lane would open
  **only** if later evidence implicates a schema / protocol change, through a separate ADR
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255`). **None requested here.**

> The posture says which lanes apply per candidate and in what held state. It opens none, requests none, and
> authorizes no sibling PR (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 4. Carry-forward rule

The posture travels forward so the sibling-evidence dependency is never lost:

- **Concrete-candidate acceptance cannot ignore Finn / Dixie held partial evidence.** Because gate #9 and gate #10
  are held with `PARTIAL_RECORDED`, any later acceptance of a candidate tied to a runtime / boundary surface must
  account for Finn / Dixie owner evidence through their respective acceptance gates
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`).
- **The later evidence lane inherits this posture.** Phase 49D File 6's evidence-authorization request carries the
  per-candidate sibling-evidence posture into the `P-1 … P-11` evidence questions
  ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md)).

---

## 5. Posture decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`** — the per-candidate Finn / Dixie / Hounfour
   posture is recorded (§3), populated from the lanes Phase 49C File 4 prepared, with the carry-forward rule (§4).
   The posture is recorded above.
2. **It is *not* `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_HELD`** — a held result would apply only if the
   posture could not be formed (for example, if the prepared lanes or the shortlist were missing). Both are
   recorded, so the posture is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_AMBIGUOUS`** — a patch result would
   apply if the posture were ambiguous, internally inconsistent, or impossible to record without amendment. The
   posture is unambiguous and bounded: Finn / Dixie held `PARTIAL_RECORDED`, Hounfour out of scope unless schema
   implicated, none requested here. No patch is required.

> **Posture-recorded ≠ sibling evidence requested ≠ sibling lane opened ≠ sibling PR authorized ≠ gates #9 / #10
> satisfaction ≠ candidate accepted ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED` is the result of *this posture gate only*. **Gate #8
> remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: no immediate sibling PR.** This file opens no sibling lane and authorizes no sibling-repo
> change. It **carries the per-candidate posture forward** into the evidence-authorization request (Phase 49D File
> 6) and any later acceptance lane.

- **File 6 reference**:
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md)
  — records `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`.
- No sibling-repo PR may merge without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

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

Each item below is preserved as a **negation**. This concrete-candidate sibling-evidence posture gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not request** any sibling owner evidence — it records the posture only;
- **does not authorize** any sibling-repo PR — no sibling lane is opened;
- **does not modify** any sibling repo — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **accepts no candidate** — acceptance requires a separate acceptance gate (EQ-3);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later, separate request (EQ-5);
- **authorizes no implementation** of any kind (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Recording a sibling-evidence posture is not
> requesting sibling evidence, opening any sibling lane, authorizing any sibling PR, modifying any sibling repo,
> accepting any candidate, selecting any host, proposing any adapter, satisfying any gate, or authorizing any
> implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49D (File 4 of 6) — gate #8 concrete-candidate sibling-evidence posture (docs-only) |
| **Predecessor** | Phase 49D File 3 — recorded `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED`; builds on Phase 49C File 4 `SIBLING_EVIDENCE_REQUEST_PREPARED` |
| **Decision result** | **`CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`** — per-candidate Finn / Dixie / Hounfour posture recorded; not `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_HELD` (the posture is formable), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_AMBIGUOUS` (the posture is unambiguous and bounded) |
| **Finn (gate #9)** | held `PARTIAL_RECORDED` for every candidate; runtime-owner evidence required before runtime acceptance; none requested here |
| **Dixie (gate #10)** | held `PARTIAL_RECORDED` for every candidate; boundary-owner evidence required before boundary acceptance; none requested here |
| **Hounfour (schema lane)** | out of scope for every candidate unless schema / protocol implicated; none requested here |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | no immediate sibling PR; carry the per-candidate posture into the evidence-authorization request (File 6) |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49D files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Posture recorded, not requested.** §2–§4 record the per-candidate posture and the carry-forward rule; no
      sibling evidence is requested, no sibling lane opened, no sibling repo modified.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`; not
      HELD, not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 carries the posture into the evidence-authorization request; opens no sibling lane.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, gate #9 / #10 satisfaction,
      host selection, production-database selection, an accepted candidate, a requested sibling evidence, an
      authorized sibling PR, a proposed production adapter, or implementation — each appears only inside a negation
      (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      container / orchestration detail, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49D File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EXCLUSION-HOLD-RATIONALE.md) — recorded
  `CONCRETE_CANDIDATE_EXCLUSION_HOLD_RECORDED` (`:94`). **Entry baseline / predecessor.**
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`).
- [Phase 49C File 4](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md) — recorded
  `SIBLING_EVIDENCE_REQUEST_PREPARED` (`:113`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — gate #9 / #10 evidence
  results `PARTIAL_RECORDED` (`:159`, `:161`); the held-state rows (`:163`, `:165`, `:167`, `:168`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); the S5 route-side row (`:159`); ownership does not follow location (`:221`); the gate #9
  Finn runtime-evidence lane (`:253`); the gate #10 Dixie boundary-evidence lane (`:254`); the Hounfour
  schema / substrate lane (`:255`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — the surfaces stay separable in code, test,
  and fixture (`:18`); Finn applies transitions through the wedge's `EstateStore` (`:59`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).

---

*End of Phase 49D File 4. Docs-only gate #8 concrete-candidate sibling-evidence posture. It records the
per-candidate Finn / Dixie / Hounfour posture for all five held candidates — Finn (gate #9) held
`PARTIAL_RECORDED`, Dixie (gate #10) held `PARTIAL_RECORDED`, Hounfour out of scope unless schema / protocol is
implicated — populated from the lanes Phase 49C File 4 prepared, and records the carry-forward rule that
concrete-candidate acceptance cannot ignore Finn / Dixie held partial evidence. It requests no sibling evidence,
opens no sibling lane, authorizes no sibling PR, modifies no sibling repo, accepts no candidate, selects no host,
selects no production database, proposes no production adapter, and authorizes no implementation, and records
`CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED` (not `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_HELD`, not
`PATCH_REQUIRED_CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_AMBIGUOUS`). The selected next lane is no immediate
sibling PR; the posture is carried into the evidence-authorization request. No commit, no push, no PR.*
