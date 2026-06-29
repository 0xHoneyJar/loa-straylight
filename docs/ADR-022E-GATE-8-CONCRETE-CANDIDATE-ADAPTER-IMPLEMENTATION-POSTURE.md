# Phase 49D — ADR-022E Gate #8 Concrete-Candidate Adapter / Implementation Posture

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49D (File 5 of 6)** — docs-only **adapter / implementation posture** for the canonical-store
> substrate-class candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / posture-record only.** Phase 49C File 3 recorded
> **`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`** (`docs/ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md:129`),
> and Phase 49D File 1 recorded the shortlist **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`). This file **records the per-candidate
> adapter / implementation posture** — that naming each shortlisted candidate proposes no production adapter and
> authorizes no implementation — and records **`CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED`**. It
> **records a posture; it proposes no adapter and authorizes no implementation.** It selects **no** concrete physical
> host, selects **no** production database, accepts **no** candidate, proposes **no** production adapter, and
> authorizes **no** implementation. The only change on this branch is **six** new Markdown files under `docs/`. No
> source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated,
> `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049D` — following the live convention for the Phase 48 / 49 family. It records a bounded
**posture**: per candidate, the standing separation rule that naming implies neither adapter proposal nor
implementation, inheriting Phase 49C File 3's authority ladder. The immediate predecessor is **Phase 49D File 4**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md)),
which recorded `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`; it inherits the separation recorded in Phase
49C File 3
([`./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md)).

This is **File 5 of 6** in Phase 49D.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49C File 3 — adapter / implementation separation** | Recorded **`ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED`** — adapter proposal and implementation each remain separate later authorities; naming implies neither. | `docs/ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md:129` |
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — C-1 … C-5 held. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Phase 49C File 1 — EQ-5 / EQ-6** | Exact-grain authority does not include adapter-proposal permission (EQ-5) or implementation authorization (EQ-6); each is a later, separate request. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191` |
| **Gate-#8 closure shape** | The gate-#8 trigger is a *proposed production adapter* (`M5`) + the sibling-repo handoff citation + preserved ADR-022D invariants — a separate, later, separately-reviewed lane. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`; `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` |
| **`StorageAdapter` seam** | The `StorageAdapter` interface remains the swap-in seam; unchanged, with no production-adapter proposal made against it. | `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only.

---

## 2. The authority ladder (restated from Phase 49C File 3)

Gate #8 progress moves through a ladder of *separate* authorities; no rung implies the next. Of these, only rung 1
(exact-grain naming / shortlist preparation) is authorized, and only partially — and this PR's shortlist (Phase 49D
File 1) exercises exactly that rung:

1. **Exact-grain naming authority** — recorded partial (Phase 49C File 1, EQ-1 … EQ-3); exercised by Phase 49D File
   1's shortlist;
2. **Concrete candidate evaluation authority** — a later transition; not granted here
   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`);
3. **Concrete candidate acceptance authority** — a separate acceptance gate; not granted here; host stays
   **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
4. **Adapter proposal authority** — the gate-#8 `M5` shape; a separate, later request (EQ-5,
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
5. **Implementation authority** — source / test / runtime / config / package / CI / schema / migration / SQL; a
   separate, later request (EQ-6, `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
6. **Production wiring authority** — a separate, later request; not granted here.

---

## 3. Per-candidate adapter / implementation posture

| Candidate | Naming proposes an adapter? | Naming authorizes implementation? | Shortlisting accepts a host? | Produces non-docs change? |
|-----------|------------------------------|-----------------------------------|------------------------------|---------------------------|
| C-1 PostgreSQL | **no** (EQ-5 separate) | **no** (EQ-6 separate) | **no** (EQ-3 separate gate) | **no** — docs only |
| C-2 Railway PostgreSQL | **no** | **no** | **no** | **no** |
| C-3 Supabase Postgres | **no** | **no** | **no** | **no** |
| C-4 Neon Postgres | **no** | **no** | **no** | **no** |
| C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure | **no** | **no** | **no** | **no** |

The non-implication rules apply identically to every candidate:

- **Naming a candidate does not imply adapter proposal.** Naming or comparing C-1 … C-5 (rung 1) carries no
  permission to propose a production adapter (rung 4); adapter proposal is its own request (EQ-5,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183`).
- **Naming a candidate does not imply implementation.** Naming or comparing C-1 … C-5 (rung 1) carries no
  permission to implement (rung 5); implementation is its own request (EQ-6,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191`).
- **Acceptance, if later allowed, still does not imply implementation.** Even if a separate acceptance gate later
  accepts a host (rung 3), that acceptance carries no implementation authority (rung 5)
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

> The `StorageAdapter` swap-in seam is unchanged, with no production-adapter proposal made against it for any
> candidate (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

---

## 4. Explicitly forbidden in this PR

This posture gate, and the Phase 49D PR it belongs to, **must not** and **does not**: perform adapter design; make
an adapter proposal (the gate-#8 `M5` shape is reserved for a separate, later lane,
`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`); make source changes; add or
change tests; write migrations; write SQL; change config; change CI; add runtime wiring; add deployment steps; add
production wiring.

---

## 5. Posture decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED`** — the per-candidate posture is recorded
   (§3), inheriting Phase 49C File 3's separation: naming proposes no adapter, authorizes no implementation, and
   shortlisting accepts no host, for every candidate. The posture is recorded above.
2. **It is *not* `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_HELD`** — a held result would apply only if the
   posture could not be stated (for example, if the separation or the shortlist were missing). Both are recorded, so
   the posture is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_AMBIGUOUS`** — a patch result
   would apply if the posture were ambiguous, internally inconsistent, or impossible to record without amendment.
   The posture is unambiguous and bounded: no candidate naming implies adapter proposal or implementation. No patch
   is required.

> **Posture-recorded ≠ adapter proposed ≠ implementation authorized ≠ host accepted ≠ candidate selected ≠ gate #8
> satisfaction.** Recording `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED` is the result of *this
> posture gate only*. **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: carry the separation posture forward.** The posture travels into the
> evidence-authorization request (Phase 49D File 6) and every later evidence / acceptance lane, so no later step
> collapses naming into adapter proposal or implementation.

- **File 6 reference**:
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md)
  — records `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`; its EAQ-5 / EAQ-6 inherit this posture.
- Adapter proposal and implementation each remain separate, separately-authorized requests
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`;
  `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

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

Each item below is preserved as a **negation**. This concrete-candidate adapter / implementation posture gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not propose** a production adapter for any candidate — adapter proposal remains a later, separate request
  (EQ-5);
- **does not authorize** implementation — implementation remains a later, separate request (EQ-6);
- **does not design** an adapter, write source, tests, migrations, SQL, config, or CI;
- **does not add** runtime wiring, deployment steps, or production wiring;
- **accepts no candidate** — acceptance requires a separate acceptance gate (EQ-3);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **selects no concrete candidate** — shortlisting is not selection.

> Every notion above appears in this document only inside a negation. Recording an adapter / implementation posture
> is not proposing any adapter, authorizing any implementation, accepting any candidate, selecting any host,
> selecting any production database, or satisfying any gate.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49D (File 5 of 6) — gate #8 concrete-candidate adapter / implementation posture (docs-only) |
| **Predecessor** | Phase 49D File 4 — recorded `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`; inherits Phase 49C File 3 `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` |
| **Decision result** | **`CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED`** — per-candidate posture: naming proposes no adapter, authorizes no implementation, shortlisting accepts no host; not `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_HELD` (the posture is statable), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_AMBIGUOUS` (the posture is unambiguous and bounded) |
| **Authority ladder** | exact-grain naming (partial, exercised by File 1); evaluation (later); acceptance (separate gate); adapter proposal (separate); implementation (separate); production wiring (separate) |
| **Non-implication rules** | naming does not imply adapter proposal; naming does not imply implementation; acceptance (if later allowed) does not imply implementation |
| **Forbidden in this PR** | adapter design; adapter proposal; source; tests; migrations; SQL; config; CI; runtime wiring; deployment steps; production wiring |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | carry the separation posture into the evidence-authorization request (File 6) and later evidence / acceptance lanes |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49D files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Posture recorded, nothing exercised.** §2–§4 record the ladder, the per-candidate posture, and the explicit
      prohibitions; no adapter is proposed and no implementation is authorized.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED`;
      not HELD, not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 carries the posture into the evidence-authorization request; authorizes nothing new.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, host selection,
      production-database selection, an accepted / selected candidate, a proposed production adapter, or
      implementation — each appears only inside a negation (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      container / orchestration detail, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49D File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md) — recorded
  `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED` (`:103`). **Entry baseline / predecessor.**
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`).
- [Phase 49C File 3](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md) — recorded
  `ADAPTER_IMPLEMENTATION_SEPARATION_RECORDED` (`:129`).
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — EQ-5 adapter separate
  (`:183`); EQ-6 implementation separate (`:191`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`).
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

*End of Phase 49D File 5. Docs-only gate #8 concrete-candidate adapter / implementation posture. It records, per
candidate (C-1 PostgreSQL; C-2 Railway PostgreSQL; C-3 Supabase Postgres; C-4 Neon Postgres; C-5 Self-hosted PostgreSQL on future Straylight-controlled infrastructure), the standing separation inherited from Phase 49C File 3: naming a candidate proposes no production
adapter (EQ-5 separate), authorizes no implementation (EQ-6 separate), and shortlisting accepts no host (EQ-3
separate gate). It restates the authority ladder, the non-implication rules, and the explicit prohibitions (adapter
design, adapter proposal, source, tests, migrations, SQL, config, CI, runtime wiring, deployment steps, production
wiring), and records `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED` (not
`CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_HELD`, not
`PATCH_REQUIRED_CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_AMBIGUOUS`). It proposes no production adapter,
authorizes no implementation, accepts no candidate, selects no host, and selects no production database. The
selected next lane carries the separation posture into the evidence-authorization request. No commit, no push, no
PR.*
