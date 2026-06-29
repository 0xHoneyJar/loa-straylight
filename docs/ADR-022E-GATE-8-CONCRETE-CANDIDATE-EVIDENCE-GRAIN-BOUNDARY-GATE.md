# Phase 49E — ADR-022E Gate #8 Concrete-Candidate Evidence-Grain & Forbidden-Detail Boundary Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49E (File 3 of 6)** — docs-only **evidence-grain / forbidden-detail boundary** gate for the
> canonical-store concrete-candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / boundary-record only.** Phase 49E File 1 recorded
> **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`** and answered EAQ-2: the evidence grain is
> public/provider-documentation plus repo-local architecture evidence only, and the EQ-2 forbidden-detail list still
> binds (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:123-128`). This file
> **records that grain boundary** as **`CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`** — it fixes the
> allowed evidence grain and the still-forbidden details so a later evidence packet PR cannot drift. It **records a
> boundary; it gathers no evidence.** It ranks **no** candidate, accepts **no** candidate, selects **no** host,
> selects **no** production database, proposes **no** production adapter, and authorizes **no** implementation. The
> only change on this branch is **six** new Markdown files under `docs/`. No source, test, runtime, route, storage,
> DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or
> sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049E` — following the live convention for the Phase 48 / 49 family. It records a bounded
**evidence-grain boundary**: it fixes *what grain of evidence* a later packet PR may record and *which details
remain forbidden*; it gathers no evidence itself. The immediate predecessor is **Phase 49E File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md)),
which recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`.

This is **File 3 of 6** in Phase 49E. It pairs with File 2 (which authorizes the lane) and File 4 (which carries
the boundary into a fillable packet): File 2 says *that* a later lane may gather evidence; this file says *at which
grain*; File 4 gives the *shape*.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49C File 1 — EQ-2 forbidden details** | The EQ-2 response fixed the still-forbidden detail list (account identifiers; project identifiers; credentials; connection strings; ports; regions; topology; production wiring; implementation details) and the allowed naming categories. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:132` |
| **Phase 49D File 1 — candidate shortlist** | Named the five candidates within EQ-2 categories, all "shortlisted (held)". | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Phase 49E File 1 — EAQ-2 response** | Recorded that the evidence grain is **public/provider-documentation plus repo-local architecture evidence only**, with the EQ-2 forbidden-detail list still binding (and extended to credential values, secrets, API keys, tokens, private keys, host URLs, endpoints, deployment steps). | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:123-128` |
| **No-leak forbidden surface** | The enumerated forbidden-surface list the boundary inherits. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. The EAQ-2 response (File 1) is the entry baseline; this gate records the grain boundary
> that response fixes — and goes no further.

---

## 2. Allowed evidence grain

A later evidence packet PR may record evidence at — and **only** at — the following grain:

- **public/provider-documentation** — descriptive capability statements drawn from publicly available provider
  documentation, recorded at *descriptive capability grain* (what role / capability a candidate plays), never as a
  leaked deployment fact;
- **repo-local architecture docs** — the canonical-store architecture, the `P-1 … P-11` decomposition
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`), the `StorageAdapter` seam
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`), and the ADR / handoff lineage, cited to
  `file:line`;
- **local code inspection, read-only** — if the later evidence lane needs repo evidence, read-only inspection of
  local code is permitted, cited to `file:line`; it must not modify any file;
- **public product docs at descriptive capability grain only** — provider-documented capabilities described at the
  capability / role grain, never reproduced as a leaked deployment fact, configuration value, or sensitive detail.

> **Boundary note (this PR).** This file *records* the allowed grain; it does **not** gather evidence at that grain,
> does **not** cite or summarize any current external product documentation as evidence, and introduces **no**
> provider-documented capability claims of its own. Those belong to the later packet PR.

---

## 3. Forbidden evidence grain (each must remain absent)

A later evidence packet PR — and this file — must introduce **none** of the following (the EQ-2 list, extended by
the EAQ-2 response, `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`):

- credentials;
- credential values;
- secrets;
- API keys;
- tokens;
- private keys;
- connection strings;
- host URLs;
- ports;
- account identifiers;
- project identifiers;
- regions;
- topology;
- endpoints;
- production wiring;
- deployment steps;
- implementation details.

> The forbidden list is a **hard boundary**, not a guideline. A later packet PR that introduces any item above has
> drifted outside the authorized grain and must be refused at review. None appears in this file.

---

## 4. Candidate-specific boundary notes

The boundary applies uniformly to all five Phase 49D candidates
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`); the per-candidate notes below record *how* the
grain applies, not any evidence. No candidate is ranked, selected, or accepted.

- **`PostgreSQL`** (database engine) — evidence may describe the engine's role as the future production substrate
  behind the `StorageAdapter` seam at capability grain
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:80`); it must introduce no connection string, port,
  credential, or deployment detail.
- **`Railway PostgreSQL`** (deployment provider / managed-service option) — evidence may describe the managed
  provider's role at capability grain only; it must introduce no account identifier, project identifier, region,
  endpoint, host URL, or production-wiring detail.
- **`Supabase Postgres`** (deployment provider / managed-service option) — evidence may describe the managed
  provider's role at capability grain only; the same forbidden-detail boundary binds.
- **`Neon Postgres`** (deployment provider / managed-service option) — evidence may describe the managed provider's
  role at capability grain only; the same forbidden-detail boundary binds.
- **`Self-hosted PostgreSQL on future Straylight-controlled infrastructure`** (self-hosted option) — evidence may
  describe the self-hosted operational-ownership option at capability grain only; it must introduce no host,
  topology, port, region, endpoint, or wiring detail.

> All five are evaluated under `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; ownership does not follow
> location (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`;
> `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`).

---

## 5. No evidence gathering here

This file records the grain boundary only. It is not the evidence packet. Specifically, this file:

- gathers **no** `P-1 … P-11` evidence for any candidate;
- cites **no** current external product documentation as evidence;
- reproduces **no** provider-documented capability, configuration value, or deployment fact;
- introduces **none** of the §3 forbidden details.

> The later evidence packet PR — and only that PR — gathers evidence within this grain. This file fixes the fence;
> it does not cross it.

---

## 6. Boundary decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`** — the allowed grain (§2), the forbidden grain
   (§3), and the per-candidate notes (§4) are recorded coherently and within the EAQ-2 response. The boundary is
   formable and recorded, so the boundary is recorded.
2. **It is *not* `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_HELD`** — a held result would apply only if the
   boundary could not be formed (for example, if the EAQ-2 response were missing or contradictory). The EAQ-2
   response is recorded and consistent, so the boundary is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_AMBIGUOUS`** — a patch result would
   apply if the boundary were ambiguous, internally inconsistent, or impossible to record without amendment. The
   boundary is unambiguous and bounded: a finite allowed-grain list and a finite forbidden-detail list. No patch is
   required.

> **Boundary-recorded ≠ evidence gathered ≠ candidate ranked ≠ candidate accepted ≠ host selected ≠ adapter
> proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED` is the result of *this boundary gate only*. **Gate #8
> remains OPEN / HELD.**

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

Each item below is preserved as a **negation**. This evidence-grain boundary gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not gather** any `P-1 … P-11` evidence — it records the grain a later lane must gather within;
- **does not cite** current external product documentation as evidence;
- **does not rank** any candidate — ranking is a separate candidate decision gate;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later separate request (EQ-5);
- **authorizes no implementation** of any kind — implementation remains a later separate request (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Recording an evidence-grain boundary is not
> gathering any evidence, citing any external documentation as evidence, ranking any candidate, accepting any
> candidate, selecting any host, selecting any production database, proposing any adapter, satisfying any gate, or
> authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49E (File 3 of 6) — gate #8 concrete-candidate evidence-grain / forbidden-detail boundary gate (docs-only) |
| **Predecessor** | Phase 49E File 1 — recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` (EAQ-2 grain answer) |
| **Decision result** | **`CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`** — allowed grain and forbidden details fixed; not `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_HELD` (the boundary is formable and recorded), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_AMBIGUOUS` (the boundary is unambiguous and bounded) |
| **Allowed grain** | public/provider-documentation; repo-local architecture docs; local code inspection (read-only); public product docs at descriptive capability grain only |
| **Forbidden grain** | credentials; credential values; secrets; API keys; tokens; private keys; connection strings; host URLs; ports; account identifiers; project identifiers; regions; topology; endpoints; production wiring; deployment steps; implementation details |
| **Candidates** | `PostgreSQL`; `Railway PostgreSQL`; `Supabase Postgres`; `Neon Postgres`; `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked or accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate evidence packet lane (gathers `P-1 … P-11` evidence within this grain) that must not rank, accept, select a host, propose an adapter, or implement |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49E files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Boundary recorded, not crossed.** §2 fixes the allowed grain; §3 fixes the forbidden grain; §5 records the
      non-actions; no evidence is gathered and no external documentation is cited as evidence.
- [ ] **Result conservative and explained.** §6 records `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`; not
      HELD, not PATCH_REQUIRED.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, host selection, a ranked /
      accepted candidate, gathered evidence, a proposed production adapter, or implementation — each appears only
      inside a negation (§8).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      endpoint, host URL, or production wiring appears; the forbidden list (§3) is a restatement of the boundary,
      not an instance of any item.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49E File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md) —
  recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` and the EAQ-2 grain answer (`:123`). **Entry baseline
  / predecessor.**
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`); named the five candidates.
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the EQ-2 allowed categories
  and forbidden-detail list (`:132`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`).
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
  the future-Postgres substrate naming (`:80`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49E File 3. Docs-only gate #8 concrete-candidate evidence-grain / forbidden-detail boundary gate. It
records `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED` (not `_HELD`, not
`PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_AMBIGUOUS`), fixing the allowed evidence grain
(public/provider-documentation; repo-local architecture docs; read-only local code inspection; public product docs
at descriptive capability grain only) and the still-forbidden details (credentials; credential values; secrets; API
keys; tokens; private keys; connection strings; host URLs; ports; account identifiers; project identifiers;
regions; topology; endpoints; production wiring; deployment steps; implementation details), with per-candidate
boundary notes for PostgreSQL, Railway PostgreSQL, Supabase Postgres, Neon Postgres, and Self-hosted PostgreSQL on
future Straylight-controlled infrastructure. It gathers no evidence, cites no external documentation as evidence,
ranks no candidate, accepts no candidate, selects no host, selects no production database, proposes no production
adapter, and authorizes no implementation. No commit, no push, no PR.*
