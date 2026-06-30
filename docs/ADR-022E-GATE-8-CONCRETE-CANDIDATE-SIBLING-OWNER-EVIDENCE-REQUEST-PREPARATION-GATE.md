# Phase 49G — ADR-022E Gate #8 Concrete-Candidate Sibling-Owner Evidence Request Preparation Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49G (File 4 of 6)** — docs-only **sibling-owner evidence request preparation** gate for the
> canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / request-shape preparation only.** Phase 49G File 3 recorded
> **`CONCRETE_CANDIDATE_DECISION_NOT_READY`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md:110`), one reason being that sibling-owner
> evidence is not complete. This file **prepares the shape** of the sibling-owner evidence request a later acceptance
> would need, and records **`SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`**. It **prepares a request shape; it requests
> no sibling evidence, opens no sibling lane, authorizes no sibling PR, and modifies no sibling repo.** It ranks
> **no** candidate, accepts **no** candidate, selects **no** concrete physical host, selects **no** production
> database, proposes **no** production adapter, and authorizes **no** implementation. The only change on this branch
> is **six** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration,
> auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo
> path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049G` — following the live Phase 48 / 49 convention. It records a bounded **request-shape
preparation**: it states which sibling-owner evidence request topics a later PR may raise, per candidate class, and
authorizes none of them now. It builds on the Phase 49C sibling-evidence request preparation
([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md))
and the Phase 49E sibling-owner evidence timing rule
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md)).
The immediate predecessor is **Phase 49G File 3**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md)),
which recorded `CONCRETE_CANDIDATE_DECISION_NOT_READY`.

This is **File 4 of 6** in Phase 49G.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49G File 3 — decision-readiness** | Recorded **`CONCRETE_CANDIDATE_DECISION_NOT_READY`** — one structural reason is that sibling-owner evidence is not complete. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md:110` |
| **Phase 49E File 5 — sibling-owner evidence timing** | Recorded **`SIBLING_OWNER_EVIDENCE_TIMING_RECORDED`** — sibling-owner evidence not required before docs-only gathering; **required before acceptance / gate #8 satisfaction**. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md:89` |
| **Phase 49C File 4 — sibling-evidence request preparation** | Recorded **`SIBLING_EVIDENCE_REQUEST_PREPARED`** — prepared Finn / Dixie / Hounfour request lanes; authorized none. | `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md:113` |
| **Sibling lanes (ADR-048B)** | Gate #9 = `loa-finn` runtime-evidence lane (S4); gate #10 = `loa-dixie` boundary-evidence lane (S5); `loa-hounfour` = schema / substrate lane, out of scope unless evidence implicates schema / protocol. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255` |
| **Phase 48N — sibling evidence intake** | Recorded gate #9 and gate #10 evidence results as **`PARTIAL_RECORDED`** (×2); both gates remain **HELD**. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Cross-repo handoff rule** | No sibling-repo PR may merge without teammate review. | `docs/handoffs/cross-repo-handoff-index.md:28` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. This gate prepares a sibling-owner evidence request shape; it changes no sibling state and
> authorizes no sibling work.

---

## 2. The timing rule this preparation honors

Per Phase 49E File 5, Finn / Dixie owner evidence is **not** required before docs-only gathering but **is** required
**before candidate acceptance / gate #8 satisfaction**
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md:89`). Phase 49G File 3 found the
candidate set **not decision-ready** in part for exactly this reason
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md:110`). This gate therefore prepares the *shape*
of the sibling-owner evidence request that a later acceptance would need — so the dependency is never lost — while
authorizing nothing now.

> **Required-before-acceptance ≠ required-now.** Preparing the request shape records that sibling-owner evidence will
> be required before acceptance. It does not request that evidence, supply it, or claim it is supplied.

---

## 3. Prepared sibling-owner evidence request topics (shape only)

The three sibling surfaces remain **non-canonical participant surfaces** only; the lanes stay separable in code,
test, and fixture (`docs/handoffs/finn-runtime-boundary.md:18`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). The following request **topics**
are **prepared** — described so a later PR can raise them, per candidate class — but **not authorized, opened,
requested, or answered here**:

- **Topic T-1 — Finn gate #9 runtime / evidence posture, relative to each candidate class.** A later lane would ask
  the `loa-finn` owner, through the gate #9 acceptance path (which requires the Finn owner to explicitly ACCEPT,
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`), for runtime-owner evidence
  relative to each candidate class: the database-engine class (`PostgreSQL`), the managed-service-provider class
  (`Railway PostgreSQL` / `Supabase Postgres` / `Neon Postgres`), and the self-hosted class
  (`Self-hosted PostgreSQL on future Straylight-controlled infrastructure`). Gate #9 remains **held with
  `PARTIAL_RECORDED`** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`). **No such
  evidence is requested here.**
- **Topic T-2 — Dixie gate #10 boundary / evidence posture, relative to each candidate class.** A later lane would
  ask the `loa-dixie` owner, through the gate #10 acceptance path (which requires the Dixie owner to explicitly
  ACCEPT, `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`), for boundary-owner
  evidence relative to the same three candidate classes. Gate #10 remains **held with `PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`). **No such evidence is requested
  here.**
- **Topic T-3 — Hounfour implicated only if schema / protocol responsibilities become implicated.** `loa-hounfour`
  remains a **non-canonical participant**; a schema / contract evidence topic would be raised **only if** later
  evidence implicates a schema / protocol change, through a separate ADR
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255`). **No such evidence is requested
  here, and no schema / protocol responsibility is implicated by this gate.**

> The preparation says which topics *may* be raised *later*, per candidate class, and through which gate. It raises
> none, requests none, answers none, and authorizes no sibling PR now.

---

## 4. Not authorized here

This preparation gate authorizes none of the following:

- **no sibling PR** — no sibling-repo pull request is requested, opened, or authorized;
- **no sibling lane opened** — the Finn / Dixie / Hounfour evidence lanes are described, not opened;
- **no sibling repo edits** — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **no claim that sibling-owner evidence is supplied** — none is supplied, and none is claimed to be;
- **no gate #9 satisfaction** — gate #9 remains held with `PARTIAL_RECORDED`
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **no gate #10 satisfaction** — gate #10 remains held with `PARTIAL_RECORDED`
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`);
- **no gate #8 satisfaction** — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

Any future sibling-repo PR remains subject to teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 5. Preparation decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`**:

1. **It is `SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`** — the Phase 49E timing rule and the Phase 49G File 3 not-ready
   finding identify sibling-owner evidence as a required-before-acceptance prerequisite; this gate prepares the
   request topics (T-1 / T-2 / T-3, §3), states what is not authorized (§4), and authorizes none of them. The
   request shape is prepared above.
2. **It is *not* a held result** — a held result would apply only if the topics could not be described (for example,
   if the timing rule or the candidate classes were missing). They are recorded and describable, so the preparation
   is recorded, not held.
3. **It is *not* a patch-required result** — a patch result would apply if the preparation were ambiguous, internally
   inconsistent, or impossible to record without amendment. The preparation is unambiguous and bounded: it prepares
   three topics, authorizes none, opens none, requests none, and answers none.

> **Request-prepared ≠ evidence requested ≠ evidence supplied ≠ sibling lane opened ≠ sibling PR authorized ≠
> gates #9 / #10 / #8 satisfaction.** Recording `SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED` is the result of *this
> preparation gate only*. It requests no sibling evidence, opens no sibling lane, authorizes no sibling PR, modifies
> no sibling repo, claims no sibling-owner evidence is supplied, selects no host, proposes no adapter, and authorizes
> no implementation. **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: the Phase 49G decision authority request gate (File 5).** That gate requests, from a later
> authority, the authority to make a decision at a later separate gate — including (DAQ-4) what sibling-owner evidence
> is required before acceptance, which carries these prepared topics forward. This file opens no sibling lane and
> authorizes no sibling-repo change.

Any follow-on PR title must carry its phase label, e.g. `Phase 49G: sibling-owner evidence request preparation`
*(docs-only)*.

---

## 7. Preserved blocked state

This gate preserves every held / open state unchanged:

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

Each item below is preserved as a **negation**. This sibling-owner evidence request preparation gate:

- **does not request** any sibling-owner evidence now — it prepares topics that may be raised later;
- **does not answer** any sibling-owner evidence request — none is raised to answer;
- **does not claim** any sibling-owner evidence is supplied — none is supplied;
- **does not authorize** any sibling-repo PR — no sibling lane is opened;
- **does not open** any sibling lane — Finn / Dixie / Hounfour lanes are described, not opened;
- **does not modify** any sibling repo — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **does not implicate** any schema / protocol responsibility — Hounfour stays out of scope (Topic T-3);
- **does not rank** any candidate — topics are prepared per candidate class, with no ordering;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **does not reject** any candidate as a final decision;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later separate request, the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` swap-in seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Preparing a sibling-owner evidence request
> shape is not requesting sibling evidence, answering any request, claiming any evidence is supplied, authorizing any
> sibling PR, opening any sibling lane, modifying any sibling repo, ranking any candidate, accepting any candidate,
> selecting any host, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49G (File 4 of 6) — gate #8 concrete-candidate sibling-owner evidence request preparation gate (docs-only) |
| **Predecessor** | Phase 49G File 3 — recorded `CONCRETE_CANDIDATE_DECISION_NOT_READY`; builds on Phase 49E File 5 timing rule and Phase 49C File 4 sibling-evidence request preparation |
| **Decision result** | **`SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`** — Finn / Dixie / Hounfour request topics prepared per candidate class but not authorized; not held (the topics are describable and recorded), not patch-required (the preparation is unambiguous and bounded) |
| **Topic T-1 (Finn / gate #9)** | runtime / evidence posture relative to each candidate class; gate #9 path requires Finn owner ACCEPT; gate #9 held `PARTIAL_RECORDED`; none requested here |
| **Topic T-2 (Dixie / gate #10)** | boundary / evidence posture relative to each candidate class; gate #10 path requires Dixie owner ACCEPT; gate #10 held `PARTIAL_RECORDED`; none requested here |
| **Topic T-3 (Hounfour)** | implicated only if schema / protocol responsibilities become implicated (separate ADR); none implicated; none requested here |
| **Timing rule** | sibling-owner evidence required before acceptance / gate #8 satisfaction, not before gathering (Phase 49E File 5) |
| **Not authorized here** | no sibling PR; no sibling lane opened; no sibling repo edits; no claim evidence is supplied; no gate #9 / #10 / #8 satisfaction |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked, accepted, or rejected; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | the Phase 49G decision authority request gate (File 5); carries these prepared topics forward via DAQ-4 |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49G files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Shape prepared, not authorized.** §3 / §4 prepare topics T-1 / T-2 / T-3 and state what is not authorized; no
      sibling evidence is requested, no sibling lane opened, no sibling repo modified, no evidence claimed supplied.
- [ ] **Hounfour conditional.** §3 keeps Hounfour out of scope unless schema / protocol is implicated; none is
      implicated here.
- [ ] **Result conservative and explained.** §5 records `SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`; not held, not
      patch-required.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, host selection, a ranked / accepted / rejected
      candidate, a proposed production adapter, a requested or supplied sibling evidence, an authorized sibling PR, or
      implementation — each appears only inside a negation (§8).
- [ ] **No product leak.** No credential, connection string, port, account / project identifier, region, topology,
      endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49G File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-DECISION-READINESS-GATE.md) — recorded
  `CONCRETE_CANDIDATE_DECISION_NOT_READY` (`:110`). **Entry baseline / predecessor.**
- [Phase 49E File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md) — recorded
  `SIBLING_OWNER_EVIDENCE_TIMING_RECORDED` (`:89`); sibling-owner evidence required before acceptance.
- [Phase 49C File 4](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md) — recorded
  `SIBLING_EVIDENCE_REQUEST_PREPARED` (`:113`); the Finn / Dixie / Hounfour request lanes.
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — gate #9 / #10 evidence
  results `PARTIAL_RECORDED` (`:159`, `:161`); the held-state rows (`:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`); sibling non-canonical status (`:159`); the gate #9 Finn runtime-evidence lane (`:253`); the gate
  #10 Dixie boundary-evidence lane (`:254`); the Hounfour schema / substrate lane (`:255`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — the surfaces stay separable in code, test, and
  fixture (`:18`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).

---

*End of Phase 49G File 4. Docs-only gate #8 concrete-candidate sibling-owner evidence request preparation gate. It
records `SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`: per the Phase 49E timing rule, Finn / Dixie owner evidence is
required before candidate acceptance / gate #8 satisfaction, so this gate prepares three request topics — T-1 (Finn
gate #9 runtime / evidence posture relative to each candidate class), T-2 (Dixie gate #10 boundary / evidence posture
relative to each candidate class), and T-3 (Hounfour implicated only if schema / protocol responsibilities become
implicated) — authorizing none of them now. It requests no sibling evidence, answers none, claims no sibling-owner
evidence is supplied, opens no sibling lane, authorizes no sibling PR, modifies no sibling repo, ranks no candidate,
accepts no candidate, selects no host, proposes no production adapter, and authorizes no implementation. The selected
next lane is the Phase 49G decision authority request gate. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
