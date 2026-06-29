# Phase 49C — ADR-022E Gate #8 Sibling-Evidence Request Preparation Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49C (File 4 of 5)** — docs-only **sibling-evidence request preparation** gate for the
> canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / preparation-record only.** Phase 49B File 3 recorded
> **`SIBLING_EVIDENCE_ROUTING_RECORDED`** (`docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192`), and Phase
> 49C File 1 recorded **`EXACT_GRAIN_AUTHORITY_PARTIAL`**
> (`docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:208`), whose EQ-4 names the sibling-evidence
> posture as a required evidence area. This file **prepares the sibling-evidence request lanes** that a later
> concrete-candidate acceptance would need, and records **`SIBLING_EVIDENCE_REQUEST_PREPARED`**. It **prepares
> lanes; it requests no sibling evidence, authorizes no sibling PR, and modifies no sibling repo.** It selects
> **no** concrete physical host, names **no** product / vendor / engine / deployment provider, proposes **no**
> production adapter, and authorizes **no** implementation. The only change on this branch is **five** new Markdown
> files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema,
> config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049C` — following the live convention for the Phase 48 / 49 family. It records a bounded
**request-preparation** posture: it states which sibling-evidence request lanes a later PR may open, and
authorizes none of them now. The immediate predecessor is **Phase 49C File 1**
([`./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md)),
which recorded `EXACT_GRAIN_AUTHORITY_PARTIAL`; it builds on the Phase 49B File 3 sibling-evidence routing
([`./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md`](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md)).

This is **File 4 of 5** in Phase 49C.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49B File 3 — sibling-evidence routing** | Recorded **`SIBLING_EVIDENCE_ROUTING_RECORDED`** — sibling evidence is not required before class-grain evaluation but is likely required before concrete host acceptance / gate #8 satisfaction; no sibling PR authorized. | `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192` |
| **Phase 49C File 1 — exact-grain authority response** | Recorded **`EXACT_GRAIN_AUTHORITY_PARTIAL`**; EQ-4 lists the sibling-evidence posture as a required evidence area before a named candidate can be accepted. | `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:208`; `docs/ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:161` |
| **Sibling lanes (ADR-048B)** | Gate #9 = `loa-finn` runtime-evidence lane (S4); gate #10 = `loa-dixie` boundary-evidence lane (S5); `loa-hounfour` = schema / substrate lane, out of scope unless evidence implicates schema / protocol. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255` |
| **Phase 48N — sibling evidence intake** | Recorded gate #9 and gate #10 evidence results as **`PARTIAL_RECORDED`** (×2); both gates remain **HELD**. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Cross-repo handoff rule** | No sibling-repo PR may merge without teammate review. | `docs/handoffs/cross-repo-handoff-index.md:28` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. This gate prepares sibling-evidence request lanes; it changes no sibling state and
> authorizes no sibling work.

---

## 2. Prepared sibling-evidence request lanes

The three sibling surfaces remain **non-canonical participant surfaces** only; none owns the canonical estate
record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`; `docs/handoffs/finn-runtime-boundary.md:59`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). The following request lanes are
**prepared** — described so a later PR can open them — but **not authorized, opened, or requested here**:

- **Finn runtime-owner exact-grain evidence request lane.** A later lane (after a concrete candidate is named and
  before any *runtime acceptance* tied to it) that would ask the `loa-finn` owner for runtime-owner exact-grain
  evidence, through the gate #9 acceptance path, which requires the Finn owner to explicitly ACCEPT. Gate #9
  remains **held with `PARTIAL_RECORDED`** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`). **No such evidence is
  requested here.**
- **Dixie boundary-owner exact-grain evidence request lane.** A later lane (after a concrete candidate is named
  and before any *boundary acceptance* tied to it) that would ask the `loa-dixie` owner for boundary-owner
  exact-grain evidence, through the gate #10 acceptance path, which requires the Dixie owner to explicitly ACCEPT.
  Gate #10 remains **held with `PARTIAL_RECORDED`** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`). **No such evidence is
  requested here.**
- **Hounfour schema / contract evidence request lane — only if later authority requires it.** `loa-hounfour`
  remains a **non-canonical participant**; a schema / contract evidence lane would open **only** if later evidence
  implicates a schema / protocol change, through a separate ADR
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255`). **No such evidence is
  requested here.**

> The preparation says which lanes *may* be opened *later* and through which gate. It opens none, requests none,
> and authorizes no sibling PR now.

---

## 3. Not authorized here

This preparation gate authorizes none of the following:

- **no sibling PR** — no sibling-repo pull request is requested, opened, or authorized;
- **no sibling repo edits** — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **no gate #9 satisfaction** — gate #9 remains held with `PARTIAL_RECORDED`
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **no gate #10 satisfaction** — gate #10 remains held with `PARTIAL_RECORDED`
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`);
- **no gate #8 satisfaction** — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

Any future sibling-repo PR remains subject to teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 4. Carry-forward rule

The prepared lanes travel forward into the later concrete-candidate lanes so the sibling-evidence dependency is
never lost:

- **The concrete-candidate shortlist should record sibling-evidence posture.** The Phase 49C File 5 template
  ([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md))
  carries a "sibling-evidence posture" field per candidate, populated from the lanes prepared in §2.
- **Concrete-candidate acceptance cannot ignore Finn / Dixie held partial evidence.** Because gate #9 and gate #10
  are held with `PARTIAL_RECORDED`, any later acceptance of a concrete host tied to a runtime / boundary surface
  must account for Finn / Dixie owner evidence through their respective acceptance gates
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`).

---

## 5. Preparation decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`SIBLING_EVIDENCE_REQUEST_PREPARED`**:

1. **It is `SIBLING_EVIDENCE_REQUEST_PREPARED`** — the Phase 49B File 3 routing and the Phase 49C File 1 EQ-4
   response identify sibling evidence as a later prerequisite; this gate prepares the Finn / Dixie / Hounfour
   request lanes (§2), states what is not authorized here (§3), and records the carry-forward rule (§4). The
   preparation is recorded above.
2. **It is *not* `SIBLING_EVIDENCE_REQUEST_HELD`** — a held result would apply only if the lanes could not be
   prepared (for example, if the routing or the EQ-4 posture were missing). The routing is recorded and the lanes
   are describable, so the preparation is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_SIBLING_EVIDENCE_REQUEST_AMBIGUOUS`** — a patch result would apply if the
   preparation were ambiguous, internally inconsistent, or impossible to record without amendment. The
   preparation is unambiguous and bounded: it prepares three lanes, authorizes none, opens none, and requests no
   sibling evidence. No patch is required.

> **Request-prepared ≠ evidence requested ≠ sibling lane opened ≠ sibling PR authorized ≠ gates #9 / #10 / #8
> satisfaction.** Recording `SIBLING_EVIDENCE_REQUEST_PREPARED` is the result of *this preparation gate only*. It
> requests no sibling evidence, opens no sibling lane, authorizes no sibling PR, modifies no sibling repo, selects
> no host, names no product / vendor / engine / deployment provider, proposes no adapter, and authorizes no
> implementation. **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: no immediate sibling PR.** This file opens no sibling lane and authorizes no sibling-repo
> change. Instead, it **carries the prepared sibling-evidence lanes forward** into the concrete-candidate
> shortlist and later exact-grain evidence lanes.

That carry-forward means:

- the **concrete-candidate shortlist** lane (File 5 template) records the sibling-evidence posture per candidate
  from the lanes prepared in §2;
- the later **exact-grain evidence** lane (which copies the Phase 49B File 4 exact-grain evidence packet template,
  [`./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md))
  inherits the prepared lanes as part of its "sibling evidence posture" field;
- no sibling-repo PR may merge without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

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
sibling-evidence request preparation gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not request** any sibling owner evidence now — it prepares lanes that may be opened later;
- **does not authorize** any sibling-repo PR — no sibling lane is opened;
- **does not modify** any sibling repo — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **does not block** candidate-class evaluation — that is already recorded (Phase 49B File 1);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **names no product / vendor / engine / deployment provider** — none is named at any grain;
- **proposes no production adapter** — none is proposed here;
- **authorizes no implementation** of any kind;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Preparing sibling-evidence request lanes is
> not requesting sibling evidence, authorizing any sibling PR, modifying any sibling repo, blocking
> candidate-class evaluation, satisfying any gate, selecting any host, naming any product / vendor / engine /
> deployment provider, proposing any adapter, or authorizing any implementation.

---

## 9. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49C (File 4 of 5) — gate #8 sibling-evidence request preparation gate (docs-only) |
| **Predecessor** | Phase 49C File 1 — recorded `EXACT_GRAIN_AUTHORITY_PARTIAL`; EQ-4 names the sibling-evidence posture as a required evidence area; builds on Phase 49B File 3 `SIBLING_EVIDENCE_ROUTING_RECORDED` |
| **Decision result** | **`SIBLING_EVIDENCE_REQUEST_PREPARED`** — Finn / Dixie / Hounfour request lanes are prepared but not authorized; not `SIBLING_EVIDENCE_REQUEST_HELD` (the lanes are describable and recorded), not `PATCH_REQUIRED_SIBLING_EVIDENCE_REQUEST_AMBIGUOUS` (the preparation is unambiguous and bounded) |
| **Finn runtime-owner lane** | prepared (after a concrete candidate is named, before runtime acceptance, via gate #9 path); gate #9 held with `PARTIAL_RECORDED`; none requested here |
| **Dixie boundary-owner lane** | prepared (after a concrete candidate is named, before boundary acceptance, via gate #10 path); gate #10 held with `PARTIAL_RECORDED`; none requested here |
| **Hounfour schema / contract lane** | prepared only if later authority requires it (schema / protocol change, separate ADR); none requested here |
| **Not authorized here** | no sibling PR; no sibling repo edits; no gate #9 satisfaction; no gate #10 satisfaction; no gate #8 satisfaction |
| **Carry-forward** | concrete-candidate shortlist records sibling-evidence posture; acceptance cannot ignore Finn / Dixie held partial evidence |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | no immediate sibling PR; carry prepared lanes into the concrete-candidate shortlist and later exact-grain evidence lanes |
| **Scope of this PR** | exactly five new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 10. Audit checklist

- [ ] **Five-file change.** The branch adds exactly the five Phase 49C files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §7 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Lanes prepared, not opened.** §2 / §3 / §4 prepare the Finn / Dixie / Hounfour lanes, state what is not
      authorized, and record the carry-forward rule; no sibling evidence is requested, no sibling lane opened, no
      sibling repo modified.
- [ ] **Does not block evaluation.** §8 confirms candidate-class evaluation is not blocked.
- [ ] **Result conservative and explained.** §5 records `SIBLING_EVIDENCE_REQUEST_PREPARED`; not HELD, not
      PATCH_REQUIRED.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, gate #9 / #10 satisfaction,
      D.1 satisfaction, D.2 commencement, MVP-2 closure, host selection, a named product / vendor / engine
      candidate, a proposed production adapter, a requested sibling evidence, an authorized sibling PR, or
      implementation — each appears only inside a negation (§7, §8).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 11. Source references

- [Phase 49C File 1](./ADR-022E-GATE-8-EXACT-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `EXACT_GRAIN_AUTHORITY_PARTIAL` (`:208`); EQ-4 names the sibling-evidence posture as a required evidence area
  (`:161`). **Entry baseline / predecessor.**
- [Phase 49B File 3](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md) — recorded
  `SIBLING_EVIDENCE_ROUTING_RECORDED` (`:192`).
- [Phase 49B File 4](./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md) — the exact-grain evidence packet
  template whose "sibling evidence posture" field inherits these prepared lanes.
- [Phase 49C File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-PACKET-TEMPLATE.md) — the shortlist packet
  template whose "sibling-evidence posture" field inherits these prepared lanes.
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — gate #9 / #10 evidence
  results `PARTIAL_RECORDED` (`:159`, `:161`); the held-state rows (`:163`, `:165`, `:167`, `:168`).
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

---

*End of Phase 49C File 4. Docs-only gate #8 sibling-evidence request preparation gate. It builds on the Phase 49B
File 3 routing and the Phase 49C File 1 EQ-4 response to prepare three sibling-evidence request lanes — a Finn
runtime-owner exact-grain evidence request lane (gate #9 path, held `PARTIAL_RECORDED`), a Dixie boundary-owner
exact-grain evidence request lane (gate #10 path, held `PARTIAL_RECORDED`), and a Hounfour schema / contract
evidence request lane only if later authority requires it — authorizing none of them now. It states what is not
authorized here (no sibling PR, no sibling repo edits, no gate #9 / #10 / #8 satisfaction) and records the
carry-forward rule (the concrete-candidate shortlist records sibling-evidence posture; acceptance cannot ignore
Finn / Dixie held partial evidence). It records `SIBLING_EVIDENCE_REQUEST_PREPARED` (not
`SIBLING_EVIDENCE_REQUEST_HELD`, not `PATCH_REQUIRED_SIBLING_EVIDENCE_REQUEST_AMBIGUOUS`). It requests no sibling
evidence, opens no sibling lane, authorizes no sibling PR, modifies no sibling repo, blocks no candidate-class
evaluation, satisfies no gate, selects no host, names no product / vendor / engine / deployment provider, proposes
no production adapter, and authorizes no implementation. The selected next lane is no immediate sibling PR; the
prepared lanes are carried into the concrete-candidate shortlist and later exact-grain evidence lanes. No commit,
no push, no PR.*
