# Phase 49I — ADR-022E Gate #8 Preferred-Candidate Sibling-Owner Evidence Request Gate (Railway PostgreSQL)

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49I (File 5 of 7)** — docs-only **preferred-candidate sibling-owner evidence request preparation**
> gate for the canonical-store concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / request-shape preparation only.** Phase 49I File 2 recorded
> **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`**
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137`) and File 4 recorded the residual blockers
> (`docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:89`). This file **prepares the request shape
> only** for the sibling-owner evidence the preferred candidate will need, and records
> **`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`**. **No sibling PR is authorized, opened, or required
> by Phase 49I itself.** This is **request preparation only**. The only change on this branch is **seven** new Markdown
> files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config,
> CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049I` — following the live Phase 48 / 49 convention. It prepares a **request shape** for
`Railway PostgreSQL` only. It opens no sibling lane, requests no sibling evidence, authorizes no sibling PR, modifies
no sibling repo, accepts no candidate, selects no host, proposes no adapter, and authorizes no implementation. The
immediate predecessor is **Phase 49I File 4**
([`./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md`](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md)).
It builds on the Phase 49H File 4 sibling-owner evidence requirement
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md))
and the Phase 49G File 4 request-preparation shape
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-PREPARATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-PREPARATION-GATE.md)).

This is **File 5 of 7** in Phase 49I.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49I File 2 — recommendation packet** | Recorded **`RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED`** — `Railway PostgreSQL` preferred for recommendation request. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137` |
| **Phase 49I File 4 — residual blockers** | Recorded **`PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`** — B-1 (Finn gate #9) and B-2 (Dixie gate #10) among the open blockers. | `docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:89` |
| **Phase 49H File 4 — sibling-owner evidence requirement** | Recorded **`SIBLING_OWNER_EVIDENCE_REQUIREMENT_RECORDED`** — Finn / Dixie evidence required before acceptance; Hounfour only if schema / protocol implicated. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md:134` |
| **Phase 49G File 4 — request preparation** | Recorded **`SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`** — Topics T-1 (Finn) / T-2 (Dixie) / T-3 (Hounfour only-if-implicated) per candidate class; none authorized. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-PREPARATION-GATE.md:122` |
| **Sibling lanes (ADR-048B)** | Gate #9 = `loa-finn` runtime-evidence lane (Finn owner ACCEPTS); gate #10 = `loa-dixie` boundary-evidence lane (Dixie owner ACCEPTS); `loa-hounfour` = schema / substrate lane, out of scope unless schema / protocol implicated. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`; `:254`; `:255` |
| **Cross-repo handoff rule** | No sibling-repo PR may merge without teammate review. | `docs/handoffs/cross-repo-handoff-index.md:28` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a status
> restatement only. This gate prepares a request shape; it opens no sibling lane and authorizes no sibling work.

---

## 2. Request preparation only — narrowed to the preferred candidate

The Phase 49G File 4 request shape was prepared **per candidate class**. This file **narrows** that shape to the
single preferred candidate, `Railway PostgreSQL`, per the Phase 49I File 2 recommendation packet
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:137`). It is **request preparation only**: it
records what a later, separately-authorized sibling-owner evidence request lane would ask, for `Railway PostgreSQL`
specifically. It asks nothing now.

> **Request shape prepared ≠ request issued ≠ evidence supplied ≠ sibling lane opened ≠ sibling PR authorized.**
> Preparing the request shape is not sending it. This file issues no request and opens no lane.

---

## 3. Finn — gate #9 evidence request shape
(`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`)

For `Railway PostgreSQL` as the recommended candidate class, a later sibling-owner evidence request to the `loa-finn`
owner — through the gate #9 acceptance path (which requires the Finn owner to explicitly ACCEPT) — would address:

- **runtime / evidence posture** relative to `Railway PostgreSQL` as the recommended candidate class;
- **no semantic ownership creep into Finn** — Finn remains a non-canonical participant surface; Straylight stays the
  semantic owner of the canonical-store boundary
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **no-leak posture**;
- **runtime interoperability**;
- **Railway-specific residual gaps** affecting the Finn boundary.

Gate #9 remains held with `PARTIAL_RECORDED`
(`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`). **No such evidence is requested or
supplied here.**

---

## 4. Dixie — gate #10 evidence request shape
(`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`)

For `Railway PostgreSQL` as the recommended candidate class, a later sibling-owner evidence request to the `loa-dixie`
owner — through the gate #10 acceptance path (which requires the Dixie owner to explicitly ACCEPT) — would address:

- **boundary / evidence posture** relative to `Railway PostgreSQL` as the recommended candidate class;
- **no semantic ownership creep into Dixie** — Dixie remains a route-side / control-plane participant surface;
  Straylight stays the semantic owner of the canonical-store boundary
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **no-leak posture**;
- **boundary interoperability**;
- **Railway-specific residual gaps** affecting the Dixie boundary.

Gate #10 remains held with `PARTIAL_RECORDED`
(`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`). **No such evidence is requested or
supplied here.**

---

## 5. Hounfour — only if schema / protocol responsibilities become implicated
(`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255`)

A `loa-hounfour` evidence request shape applies **only if** schema / protocol responsibilities become implicated,
through a separate ADR. **No schema / protocol responsibility is implicated by this gate**, so no Hounfour request
shape is prepared beyond this conditional note.

---

## 6. Not authorized, opened, or required by Phase 49I itself

This request-preparation gate authorizes, opens, and requires none of the following **by Phase 49I itself**:

- **no sibling PR** — no sibling-repo pull request is requested, opened, or authorized by Phase 49I;
- **no sibling lane opened** — the Finn / Dixie / Hounfour evidence lanes are described, not opened;
- **no sibling repo edits** — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **no claim that sibling-owner evidence is supplied** — none is supplied, and none is claimed to be;
- **sibling-owner evidence remains required before candidate acceptance / gate #8 satisfaction, not before this
  request preparation** — preparing the request shape now does not make the evidence due now.

Any future sibling-repo PR remains subject to teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 7. This file prepares the request shape; it requests nothing

To be unambiguous: this file **prepares** the sibling-owner evidence request shape for `Railway PostgreSQL` and
**requests nothing**. It records the Finn (§3), Dixie (§4), and Hounfour-only-if-implicated (§5) request shapes and
states what Phase 49I itself does not authorize or require now (§6). It requests no sibling evidence, opens no sibling
lane, authorizes no sibling PR, modifies no sibling repo, accepts no candidate, selects no host, proposes no adapter,
and authorizes no implementation.

---

## 8. Request decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`**:

1. **It is `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`** — Phase 49I File 2 identified the preferred
   candidate and File 4 recorded B-1 / B-2; this file narrows the Phase 49G File 4 request shape to `Railway
   PostgreSQL` (§3 / §4 / §5) and states what Phase 49I does not authorize (§6). The request shape is prepared above.
2. **It is *not* a held result** — a held result would apply only if the request shape could not be prepared. It is
   prepared, so the result is recorded.
3. **It is *not* a patch-required result** — the request shape is unambiguous and bounded: Finn (gate #9), Dixie
   (gate #10), Hounfour-only-if-implicated, with no sibling PR authorized.

> **Request-prepared ≠ request issued ≠ evidence supplied ≠ sibling lane opened ≠ sibling PR authorized ≠ candidate
> accepted ≠ host selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED` is the result of *this request-preparation gate only*.
> It issues no request, supplies no evidence, opens no sibling lane, authorizes no sibling PR, modifies no sibling
> repo, accepts no candidate, selects no host, proposes no adapter, and authorizes no implementation. **Gate #8
> remains OPEN / HELD.**

---

## 9. Selected next lane

> **Selected next lane: a docs-only preferred-candidate sibling-owner evidence request authorization / preparation
> gate** — a separately-authorized continuation of this request-preparation shape. It still **cannot open sibling PRs
> unless separately authorized** (`docs/handoffs/cross-repo-handoff-index.md:28`), and accepts / selects / proposes /
> implements / wires / closes nothing.

Any follow-on PR title must carry its phase label, e.g. `Phase 49J: preferred-candidate sibling-owner evidence
request authorization / preparation` *(docs-only)*.

---

## 10. Preserved blocked state

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
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **No production database is selected**; **no production adapter is proposed**; **no implementation is authorized**.

---

## 11. Preserved non-claims

Each item below is preserved as a **negation**. This sibling-owner evidence request-preparation gate:

- **prepares** the request shape for `Railway PostgreSQL` but **requests no sibling-owner evidence** now;
- **does not answer** any sibling-owner evidence request — none is raised to answer;
- **does not claim** any sibling-owner evidence is supplied — none is supplied;
- **does not authorize** any sibling-repo PR — no sibling lane is opened;
- **does not open** any sibling lane — Finn / Dixie / Hounfour lanes are described, not opened;
- **does not modify** any sibling repo — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **does not implicate** any schema / protocol responsibility — Hounfour stays out of scope (§5);
- **does not accept** any candidate — acceptance is a separate later authority;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, implementation plan, or deployment
  plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Preparing a sibling-owner evidence request shape
> is not requesting sibling evidence, answering any request, claiming any evidence is supplied, authorizing any
> sibling PR, opening any sibling lane, modifying any sibling repo, accepting any candidate, selecting any host,
> proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 12. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49I (File 5 of 7) — gate #8 preferred-candidate sibling-owner evidence request gate (Railway PostgreSQL) (docs-only) |
| **Predecessor** | Phase 49I File 4 — recorded `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED`; builds on Phase 49H File 4 and Phase 49G File 4 |
| **Decision result** | **`PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`** — request shape narrowed to `Railway PostgreSQL`; not held (the shape is preparable); not patch-required (the shape is unambiguous) |
| **Finn (gate #9) topics** | runtime / evidence posture vs Railway PostgreSQL as recommended candidate class; no semantic ownership creep into Finn; no-leak posture; runtime interoperability; Railway-specific residual gaps affecting the Finn boundary |
| **Dixie (gate #10) topics** | boundary / evidence posture vs Railway PostgreSQL as recommended candidate class; no semantic ownership creep into Dixie; no-leak posture; boundary interoperability; Railway-specific residual gaps affecting the Dixie boundary |
| **Hounfour** | only if schema / protocol responsibilities become implicated (separate ADR); none implicated here |
| **Not authorized by Phase 49I** | no sibling PR opened, authorized, or required by Phase 49I itself; no sibling lane opened; no sibling repo edited; no claim evidence is supplied; request preparation only |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no adapter proposed; no implementation authorized |
| **Selected next lane** | docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate; cannot open sibling PRs unless separately authorized |
| **Scope of this PR** | exactly seven new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 13. Audit checklist

- [ ] **Seven-file change.** The branch adds exactly the seven Phase 49I files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §10 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Request prepared, not issued.** §3 / §4 / §5 record the Finn / Dixie / Hounfour request shapes for `Railway
      PostgreSQL`; §6 states what Phase 49I does not authorize; §7 confirms this file requests nothing.
- [ ] **No sibling work.** No sibling PR is opened, authorized, or required by Phase 49I; no sibling lane opened; no
      sibling repo modified; no evidence claimed supplied.
- [ ] **Result conservative and explained.** §8 records `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`;
      not held, not patch-required.
- [ ] **No overclaim.** No candidate accepted; no host selected; no adapter proposed; no implementation authorized; no
      sibling evidence requested or supplied — each appears only inside a negation (§11).
- [ ] **No product leak.** No external URL, credential, connection string, port, account / project identifier, region,
      topology, endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 14. Source references

- [Phase 49I File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md) — recorded
  `RAILWAY_POSTGRESQL_RECOMMENDATION_PACKET_PREPARED` (`:137`); the preferred candidate.
- [Phase 49I File 4](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md) — recorded
  `PREFERRED_CANDIDATE_RESIDUAL_BLOCKERS_RECORDED` (`:89`); B-1 / B-2. **Entry baseline / predecessor.**
- [Phase 49H File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUIREMENT-GATE.md) — recorded
  `SIBLING_OWNER_EVIDENCE_REQUIREMENT_RECORDED` (`:134`); Finn / Dixie required before acceptance.
- [Phase 49G File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-REQUEST-PREPARATION-GATE.md) —
  recorded `SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED` (`:122`); Topics T-1 / T-2 / T-3.
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — gate #9 / #10 evidence
  `PARTIAL_RECORDED` (`:159`, `:161`); the held-state rows (`:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED, owner
  "none" (`:156`); the gate #9 Finn runtime-evidence lane (`:253`); the gate #10 Dixie boundary-evidence lane
  (`:254`); the Hounfour schema / substrate lane (`:255`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).

---

*End of Phase 49I File 5. Docs-only gate #8 preferred-candidate sibling-owner evidence request gate for `Railway
PostgreSQL`. It records `PREFERRED_CANDIDATE_SIBLING_OWNER_EVIDENCE_REQUEST_PREPARED`: a request shape narrowed to the
preferred candidate. The Finn (gate #9) request shape would address runtime / evidence posture relative to Railway
PostgreSQL as the recommended candidate class, no semantic ownership creep into Finn, no-leak posture, runtime
interoperability, and Railway-specific residual gaps affecting the Finn boundary. The Dixie (gate #10) request shape
would address boundary / evidence posture relative to Railway PostgreSQL as the recommended candidate class, no
semantic ownership creep into Dixie, no-leak posture, boundary interoperability, and Railway-specific residual gaps
affecting the Dixie boundary. Hounfour applies only if schema / protocol responsibilities become implicated; none is
implicated here. No sibling PR is authorized, opened, or required by Phase 49I itself; this is request preparation
only. This file requests no sibling evidence, answers none, claims none supplied, opens no sibling lane, modifies no
sibling repo, accepts no candidate, selects no host, proposes no adapter, and authorizes no implementation. The
selected next lane is a docs-only preferred-candidate sibling-owner evidence request authorization / preparation gate,
which cannot open sibling PRs unless separately authorized. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
