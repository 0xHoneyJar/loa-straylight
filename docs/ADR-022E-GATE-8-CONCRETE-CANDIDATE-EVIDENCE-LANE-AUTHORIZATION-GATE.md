# Phase 49E — ADR-022E Gate #8 Concrete-Candidate Evidence-Lane Authorization Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49E (File 2 of 6)** — docs-only **evidence-lane authorization** gate for the canonical-store
> concrete-candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / lane-authorization only.** Phase 49E File 1 recorded
> **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:123-171`): a separate
> authority answered EAQ-1 … EAQ-6 and permitted a *later* docs-only PR to gather `P-1 … P-11` evidence for the five
> Phase 49D candidates. This file **records that bounded authorization** as
> **`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`** — it authorizes the *later* lane and fixes its scope. It
> **authorizes a later lane; it gathers no evidence.** It ranks **no** candidate, accepts **no** candidate, selects
> **no** concrete physical host, selects **no** production database, proposes **no** production adapter, and
> authorizes **no** implementation. The only change on this branch is **six** new Markdown files under `docs/`. No
> source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated,
> `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049E` — following the live convention for the Phase 48 / 49 family. It records a bounded
**evidence-lane authorization**: it authorizes a *later* docs-only evidence packet PR to gather `P-1 … P-11`
evidence within the EAQ-2 / File 3 grain; it gathers no evidence itself. The immediate predecessor is **Phase 49E
File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md)),
which recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`.

This is **File 2 of 6** in Phase 49E. Read alongside File 3 (evidence-grain boundary) and File 4 (evidence packet
template): together they fix the *scope*, the *grain*, and the *shape* of the later evidence lane this file
authorizes.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49D File 6 — evidence-authorization request** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED`** — framed EAQ-1 … EAQ-6 asking whether a later PR may gather `P-1 … P-11` evidence against the shortlist. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md:105` |
| **Phase 49E File 1 — evidence-authorization response** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`** — EAQ-1 yes (later PR may gather evidence); EAQ-2 public/provider-documentation plus repo-local architecture evidence with the forbidden-detail list binding; EAQ-3 all five in parallel, ranking and acceptance each separate; EAQ-4 sibling-owner evidence after gathering / before acceptance; EAQ-5 adapter separate; EAQ-6 implementation separate. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:123-171` |
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — the five candidates this lane will gather evidence for. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**; semantic owner `loa-straylight`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 49E File 1's `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` is the entry
> baseline; this gate records the evidence-lane authorization that response implies — and goes no further.

### 1.1 The five candidates this lane covers (restated, not changed)

The authorized later lane may gather evidence for exactly the five Phase 49D candidates
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`), all "shortlisted (held)":

1. **`PostgreSQL`** — database engine.
2. **`Railway PostgreSQL`** — deployment provider (managed-service option).
3. **`Supabase Postgres`** — deployment provider (managed-service option).
4. **`Neon Postgres`** — deployment provider (managed-service option).
5. **`Self-hosted PostgreSQL on future Straylight-controlled infrastructure`** — self-hosted option.

---

## 2. Authorized later evidence-lane scope

This file authorizes a *later* docs-only evidence packet PR with the following bounded scope. Each clause is a
*permission for that later PR*, not an action taken here:

- **All five candidates** — the later PR may gather evidence for all five Phase 49D candidates in parallel (EAQ-3);
  the shortlist need not narrow first.
- **Evidence sources** — evidence should use **public/provider-documentation plus repo-local architecture
  evidence** only (EAQ-2, `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:123`).
- **Mapped to `P-1 … P-11`** — every piece of evidence must be mapped to one of the `P-1 … P-11` areas
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`): P-1 candidate identity /
  ownership; P-2 durability; P-3 tenant / actor / estate isolation; P-4 migration / schema ownership; P-5 runtime
  writer boundary; P-6 read / recall boundary; P-7 audit / receipt persistence; P-8 failure / rollback / recovery;
  P-9 permission / auth / signer authority; P-10 no-leak / public-private projection; P-11 test / evidence shape.
- **Sibling posture recorded** — the later PR must record the per-candidate Finn / Dixie / Hounfour sibling-evidence
  posture it inherits (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md:103`), per the File 5
  timing rule.
- **Adapter / implementation separation posture recorded** — the later PR must record that gathering evidence
  proposes no adapter and authorizes no implementation
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-ADAPTER-IMPLEMENTATION-POSTURE.md:106`), per the File 6 separation
  ladder.
- **Forbidden details avoided** — the later PR must avoid the forbidden deployment / sensitive details fixed in
  File 3 (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).

> The scope above is the *charter* of a later lane. This file does not execute that charter: it gathers no
> evidence, fills no packet, and classifies nothing.

---

## 3. What this lane authorization does not do (forbidden here)

- **no evidence gathering in this PR** — gathering is the later lane's job, not this file's;
- **no ranking** — ranking waits for a separate candidate decision gate
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:133`);
- **no acceptance** — acceptance waits for a separate candidate acceptance gate (EQ-3,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`);
- **no host / database selection** — the canonical-store physical host remains **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **no adapter proposal** — adapter proposal remains a later separate request (EQ-5,
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **no implementation** — implementation remains a later separate request (EQ-6,
  `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

---

## 4. Lane-authorization decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`**:

1. **It is `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`** — Phase 49E File 1 recorded the authority's EAQ-1 "yes"
   for a later evidence-gathering lane; this file records that bounded authorization and fixes the lane's scope
   (§2). The authorization is real, so the lane is authorized.
2. **It is *not* `CONCRETE_CANDIDATE_EVIDENCE_LANE_HELD`** — a held result would apply only if the lane could not be
   authorized (for example, if File 1 had recorded a deferral or rejection). File 1 recorded a partial *with* EAQ-1
   answered yes, so the lane is authorized, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_LANE_AMBIGUOUS`** — a patch result would apply if the
   authorization were ambiguous, internally inconsistent, or impossible to record without amendment. The scope is
   unambiguous and bounded: all five candidates, public/provider-documentation plus repo-local architecture
   evidence, mapped to `P-1 … P-11`, with sibling and adapter/implementation posture recorded and forbidden details
   avoided. No patch is required.

> **Lane-authorized ≠ evidence gathered ≠ candidate ranked ≠ candidate accepted ≠ host selected ≠ adapter
> proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED` is the result of *this authorization gate only*. **Gate #8 remains
> OPEN / HELD.**

---

## 5. Selected next lane

> **Selected next lane: a docs-only concrete-candidate evidence packet lane.** Because the evidence lane is
> authorized, the next docs-only step (beyond this PR) copies the File 4 evidence packet template, gathers
> `P-1 … P-11` evidence within the File 3 grain for the five candidates, and records the per-candidate sibling and
> adapter/implementation posture. It must not rank, accept, select a host, propose an adapter, or implement.

- **File 4 reference** (the evidence packet template):
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md).
- **File 3 reference** (the evidence-grain boundary):
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md).

Any follow-on PR title must carry its phase label, e.g. `Phase 49F: concrete-candidate evidence packet` *(docs-only)*.

---

## 6. Preserved blocked state

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

## 7. Preserved non-claims

Each item below is preserved as a **negation**. This evidence-lane authorization gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not gather** any `P-1 … P-11` evidence — it authorizes a later lane to gather it;
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

> Every notion above appears in this document only inside a negation. Authorizing a later evidence lane is not
> gathering any evidence, ranking any candidate, accepting any candidate, selecting any host, selecting any
> production database, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 8. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49E (File 2 of 6) — gate #8 concrete-candidate evidence-lane authorization gate (docs-only) |
| **Predecessor** | Phase 49E File 1 — recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` |
| **Decision result** | **`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`** — a later docs-only PR may gather `P-1 … P-11` evidence for the five candidates within the File 3 grain; not `CONCRETE_CANDIDATE_EVIDENCE_LANE_HELD` (EAQ-1 was answered yes), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_LANE_AMBIGUOUS` (scope unambiguous and bounded) |
| **Authorized scope** | all five candidates in parallel; public/provider-documentation plus repo-local architecture evidence; mapped to `P-1 … P-11`; sibling posture recorded; adapter/implementation separation posture recorded; forbidden details avoided |
| **Candidates** | `PostgreSQL`; `Railway PostgreSQL`; `Supabase Postgres`; `Neon Postgres`; `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked or accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate evidence packet lane (copies File 4, gathers `P-1 … P-11` evidence within File 3 grain) that must not rank, accept, select a host, propose an adapter, or implement |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 9. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49E files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §6 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Lane authorized, not executed.** §2 fixes the later lane's scope; §3 records the non-actions; no evidence
      is gathered here.
- [ ] **Result conservative and explained.** §4 records `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`; not HELD,
      not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §5 selects the docs-only evidence packet lane that must not rank, accept, select a
      host, propose an adapter, or implement.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, host selection, a ranked /
      accepted candidate, gathered evidence, a proposed production adapter, or implementation — each appears only
      inside a negation (§7).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      endpoint, or production wiring appears; no external product documentation is cited as evidence.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 10. Source references

- [Phase 49E File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md) —
  recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` (`:171`). **Entry baseline / predecessor.**
- [Phase 49D File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-REQUEST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_REQUEST_RECORDED` (`:105`).
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`); named the five candidates.
- [Phase 49D File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md) — recorded
  `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED` (`:103`).
- [Phase 49D File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-ADAPTER-IMPLEMENTATION-POSTURE.md) — recorded
  `CONCRETE_CANDIDATE_ADAPTER_IMPLEMENTATION_POSTURE_RECORDED` (`:106`).
- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — EQ-3 compare but no
  acceptance (`:152`); EQ-5 adapter separate (`:183`); EQ-6 implementation separate (`:191`).
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
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49E File 2. Docs-only gate #8 concrete-candidate evidence-lane authorization gate. Because Phase 49E
File 1 recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` with EAQ-1 answered yes, this file records
`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED` (not `CONCRETE_CANDIDATE_EVIDENCE_LANE_HELD`, not
`PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_LANE_AMBIGUOUS`) and fixes the scope of a later docs-only evidence
packet PR: all five candidates in parallel; public/provider-documentation plus repo-local architecture evidence;
mapped to `P-1 … P-11`; sibling posture recorded; adapter/implementation separation posture recorded; forbidden
deployment / sensitive details avoided. It gathers no evidence, ranks no candidate, accepts no candidate, selects no
host, selects no production database, proposes no production adapter, and authorizes no implementation. The selected
next lane is a docs-only concrete-candidate evidence packet lane. No commit, no push, no PR.*
