# Phase 49C — ADR-022E Gate #8 Concrete-Candidate Naming Authorization Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49C (File 2 of 5)** — docs-only **concrete-candidate naming authorization** gate for the
> canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / authorization-record only.** Phase 49C File 1 intook the exact-grain authority response and
> recorded **`EXACT_GRAIN_AUTHORITY_PARTIAL`**
> (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:208`) — a later docs-only PR may name and
> compare concrete candidates within bounded categories (EQ-1 … EQ-3), while adapter proposal, implementation,
> host acceptance, and gate #8 satisfaction remain withheld (EQ-5 / EQ-6). This file **records the naming
> authorization that response carries**: it authorizes a *later* docs-only shortlist lane to name concrete
> candidates, and records **`CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`**. It **records an authorization;
> it does not exercise it.** It names **no** concrete candidate, selects **no** concrete physical host, selects
> **no** production database, names **no** product / vendor / engine / deployment provider, proposes **no**
> production adapter, and authorizes **no** implementation. The only change on this branch is **five** new Markdown
> files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema,
> config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049C` — following the live convention for the Phase 48 / 49 family. It records a bounded
**naming authorization** at concrete-candidate / shortlist-preparation level: it states that a *later* PR may name
concrete candidates, and itself names none. The immediate predecessor is **Phase 49C File 1**
([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md)),
which recorded `EXACT_GRAIN_AUTHORITY_PARTIAL`.

This is **File 2 of 5** in Phase 49C.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49B File 2 — exact-grain authority request** | Recorded **`EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED`** — framed EQ-1 … EQ-6, asking whether a *later* PR may name concrete product / vendor / engine / provider candidates and at which exact grain. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:164`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md:84` |
| **Phase 49C File 1 — exact-grain authority partial response** | Recorded **`EXACT_GRAIN_AUTHORITY_PARTIAL`** — EQ-1 yes (a later docs-only PR may name concrete candidates); EQ-2 six allowed categories with a forbidden-detail list; EQ-3 a later PR may compare multiple candidates but cannot accept a final host without a separate acceptance gate; EQ-5 / EQ-6 adapter proposal and implementation remain separate. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:208`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:124`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:132` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**; semantic owner `loa-straylight`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138` |
| **No-leak boundary** | The forbidden-grain / no-leak boundary stays intact — secrets and sensitive deployment details are excluded. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:111` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 49C File 1's `EXACT_GRAIN_AUTHORITY_PARTIAL` is the entry baseline; this gate
> records the naming authorization that response carries — and goes no further.

---

## 2. Naming authorization scope

The exact-grain authority response (File 1, EQ-1 … EQ-3) carries a bounded naming authorization for a *later*
docs-only lane. This file records that scope:

- **A later docs-only shortlist lane may name concrete candidates.** Naming is authorized for a *later* PR only,
  within the EQ-2 categories; it is **not** exercised here
  (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:124`).
- **The later lane may compare multiple candidates.** It is not restricted to one candidate at a time (EQ-3);
  comparison and shortlisting are permitted, final-host acceptance is not
  (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`).
- **The later lane must use the File 5 template or equivalent.** It copies the concrete-candidate shortlist packet
  template ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md))
  so its reasoning is reviewable field-by-field.
- **The later lane must keep secrets / sensitive deployment details out.** The EQ-2 forbidden list — account
  identifiers, project identifiers, credentials, connection strings, ports, regions, topology, production wiring,
  implementation details — stays absent (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`;
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:132`).

> The scope says what a *later* PR may do. It names no candidate here, opens no shortlist, and accepts no host.

---

## 3. Allowed later shortlist fields

A later shortlist PR may, within the authorization above, record the following fields for each named candidate.
These are the fields the File 5 template fixes; recording them here describes the *later* lane, it does not fill
any:

- **candidate display name** — named only within an EQ-2 category, never as a leaked deployment fact;
- **category membership** — which EQ-2 category the candidate belongs to (database engine; deployment provider;
  managed-service vs self-hosted option; storage substrate role; credential-boundary role; evidence-shape role);
- **estate-owner boundary** — the candidate evaluated under the preserved `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`);
- **expected evidence areas** — which `P-1 … P-11` obligations the candidate would have to discharge
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`);
- **sibling-evidence posture** — the Finn / Dixie / Hounfour posture inherited from the Phase 49C File 4
  preparation ([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md));
- **no-leak posture** — confirmation the EQ-2 forbidden details stay absent
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`);
- **adapter / implementation separation posture** — confirmation that naming a candidate proposes no adapter and
  authorizes no implementation, per the Phase 49C File 3 separation
  ([`./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md`](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md)).

---

## 4. Forbidden here

This authorization records what a *later* PR may do; it exercises none of it. The following are **forbidden in
this PR**:

- **no candidate names in this PR** — this file names none;
- **no product / vendor / engine / provider names in this PR** — none is copied or introduced at any grain;
- **no host selected** — the canonical-store physical host remains **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **no candidate accepted** — acceptance requires a separate acceptance gate (EQ-3,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:152`);
- **no adapter proposed** — adapter proposal remains a separate request (EQ-5,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:183`);
- **no implementation authorized** — implementation remains a separate request (EQ-6,
  `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:191`).

---

## 5. Authorization decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`**:

1. **It is `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`** — the File 1 exact-grain authority response
   (EQ-1 yes, EQ-2 bounded categories, EQ-3 comparison allowed) carries a real authorization for a *later*
   docs-only shortlist lane to name and compare concrete candidates. This file records that authorization and the
   scope (§2), the allowed later fields (§3), and the prohibitions on *this* PR (§4).
2. **It is *not* `CONCRETE_CANDIDATE_NAMING_HELD`** — a held result would apply only if the response did not permit
   later naming (for example, if EQ-1 were answered no or the response were deferred / rejected). EQ-1 was
   answered yes within a bounded grain, so the naming authorization is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CONCRETE_CANDIDATE_NAMING_AMBIGUOUS`** — a patch result would apply if the
   authorization were ambiguous, internally inconsistent, or impossible to record without amendment. The
   authorization is unambiguous and bounded: a *later* PR may name within the EQ-2 categories, must keep the
   forbidden details absent, may compare but not accept, and proposes no adapter and authorizes no implementation.
   No patch is required.

> **Naming-authorized ≠ candidate named ≠ candidate selected ≠ candidate accepted ≠ host selected ≠ adapter
> proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST` is the result of *this authorization gate only*. It permits
> a *later* PR to name / compare candidates and nothing more — this file names no candidate, selects no host,
> selects no production database, accepts no candidate, proposes no adapter, and authorizes no implementation.
> **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: a docs-only concrete-candidate shortlist / exact-grain candidate naming gate.** Because
> the naming authorization is recorded, the next docs-only step (beyond this PR) copies the File 5 template, names
> concrete candidates within the EQ-2 categories, compares them, records the sibling-evidence posture and the
> adapter / implementation separation posture, and must not accept a final host, propose an adapter, or implement.

- **File 5 reference** (the companion template):
  [`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md)
  — a template / checklist the later shortlist PR copies and fills. It carries no result.
- That later shortlist lane **names concrete candidates**; it does **not** select a concrete host, does **not**
  select a production database, does **not** accept a candidate, does **not** propose a production adapter, and
  does **not** authorize implementation.

Any follow-on PR title must carry its phase label, e.g. `Phase 49D: concrete-candidate shortlist` *(docs-only)*.

---

## 7. Preserved blocked state

This gate preserves every held/open state unchanged:

- **Gate #8** remains **`OPEN / HELD`** — not discharged; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **Gate #9** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **Gate #10** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
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

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
concrete-candidate naming authorization gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **names no concrete candidate** — it records the authority that *permits a later PR* to name; the naming itself
  is a later lane;
- **names no product / vendor / engine / deployment provider** — none is named at any grain;
- **selects no concrete candidate** — selection is a later, separately-authorized transition;
- **accepts no candidate** — acceptance requires a separate acceptance gate (EQ-3);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later, separate request (EQ-5);
- **authorizes no implementation** of any kind — implementation remains a later, separate request (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- **authorizes no** sibling-repo PR.

> Every notion above appears in this document only inside a negation. Recording a concrete-candidate naming
> authorization is not naming any candidate, selecting any candidate, accepting any candidate, selecting any host,
> selecting any production database, proposing any adapter, satisfying any gate, or authorizing any
> implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49C (File 2 of 5) — gate #8 concrete-candidate naming authorization gate (docs-only) |
| **Predecessor** | Phase 49C File 1 — recorded `EXACT_GRAIN_AUTHORITY_PARTIAL`; EQ-1 yes, EQ-2 bounded categories, EQ-3 comparison allowed |
| **Decision result** | **`CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST`** — a later docs-only shortlist lane may name and compare concrete candidates within the EQ-2 categories; not `CONCRETE_CANDIDATE_NAMING_HELD` (EQ-1 answered yes), not `PATCH_REQUIRED_CONCRETE_CANDIDATE_NAMING_AMBIGUOUS` (authorization unambiguous and bounded) |
| **Naming authorization scope** | later docs-only shortlist lane may name concrete candidates; may compare multiple candidates; must use the File 5 template or equivalent; must keep secrets / sensitive deployment details out |
| **Allowed later shortlist fields** | candidate display name; category membership; estate-owner boundary; expected evidence areas; sibling-evidence posture; no-leak posture; adapter / implementation separation posture |
| **Forbidden here** | no candidate names in this PR; no product / vendor / engine / provider names; no host selected; no candidate accepted; no adapter proposed; no implementation authorized |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate shortlist / exact-grain candidate naming gate; copies the File 5 template; names and compares candidates; must not accept a host, propose an adapter, or implement |
| **Scope of this PR** | exactly five new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Five-file change.** The branch adds exactly the five Phase 49C files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Authorization recorded, not exercised.** §2 / §3 record the naming scope and allowed later fields; §4
      forbids naming in this PR; this file names no candidate.
- [ ] **Result conservative and explained.** §5 records `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST` and
      explains why it is not HELD and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §6 selects the docs-only shortlist gate that must not accept a host, propose an
      adapter, or implement.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, a named product / vendor / engine candidate, a selected /
      accepted candidate, a proposed production adapter, or implementation — each appears only inside a negation
      (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `EXACT_GRAIN_AUTHORITY_PARTIAL` (`:208`); EQ-1 (`:124`), EQ-2 (`:132`), EQ-3 (`:152`), EQ-5 (`:183`),
  EQ-6 (`:191`). **Entry baseline / predecessor.**
- [Phase 49C File 3](./ADR-022E-GATE-8-ADAPTER-IMPLEMENTATION-SEPARATION-GATE.md) — the adapter / implementation
  separation this file's "adapter / implementation separation posture" field inherits.
- [Phase 49C File 4](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md) — the sibling-evidence
  posture this file's "sibling-evidence posture" field inherits.
- [Phase 49C File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md) — the shortlist packet
  template the later shortlist lane copies and fills.
- [Phase 49B File 2](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-REQUEST-GATE.md) — recorded
  `EXACT_GRAIN_AUTHORITY_REQUEST_RECORDED` (`:164`); framed EQ-1 … EQ-6 (`:84`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`); the accepted UQ-2 candidate-naming grain (`:139`).
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
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam
  (`:79`); the Phase-5 hardening invariants (`:111`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic owner
  (`:45`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49C File 2. Docs-only gate #8 concrete-candidate naming authorization gate. It takes the Phase 49C
File 1 exact-grain authority partial response and records that a *later* docs-only shortlist lane may name and
compare concrete candidates within the EQ-2 categories (database engine; deployment provider; managed-service vs
self-hosted option; storage substrate role; credential-boundary role; evidence-shape role), keeping account
identifiers, project identifiers, credentials, connection strings, ports, regions, topology, production wiring,
and implementation details out, and recording the allowed later shortlist fields (candidate display name;
category membership; estate-owner boundary; expected evidence areas; sibling-evidence posture; no-leak posture;
adapter / implementation separation posture). It records `CONCRETE_CANDIDATE_NAMING_AUTHORIZED_FOR_SHORTLIST` (not
`CONCRETE_CANDIDATE_NAMING_HELD`, not `PATCH_REQUIRED_CONCRETE_CANDIDATE_NAMING_AMBIGUOUS`). It names no concrete
candidate, names no product / vendor / engine / deployment provider, selects no host, selects no production
database, accepts no candidate, proposes no production adapter, and authorizes no implementation. The selected
next lane is a docs-only concrete-candidate shortlist gate. No commit, no push, no PR.*
