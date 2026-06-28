# Phase 49B — ADR-022E Gate #8 Sibling-Evidence Routing Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49B (File 3 of 4)** — docs-only **sibling-evidence routing** gate for the canonical-store
> substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / routing-record only.** This file **records what sibling evidence (Finn / Dixie / Hounfour)
> may be needed later** before any later gate #8 acceptance, and records **`SIBLING_EVIDENCE_ROUTING_RECORDED`**.
> It **records a routing posture; it does not request sibling changes, does not authorize sibling PRs, does not
> modify sibling repos, does not block candidate-class evaluation, and does not satisfy gates #9 / #10 or #8.** It
> selects **no** concrete physical host, names **no** product / vendor / engine / deployment provider, proposes
> **no** production adapter, and authorizes **no** implementation. The only change on this branch is **four** new
> Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer,
> schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049B` — following the live convention for the Phase 48 / 49 family. It records a bounded
**sibling-evidence routing** posture: it states what sibling evidence may be needed in later lanes, and explicitly
authorizes none of it now. The immediate predecessor is **Phase 49B File 1**
([`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md)),
which recorded `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`.

This is **File 3 of 4** in Phase 49B.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N — sibling evidence intake** | Recorded gate #9 and gate #10 evidence results as **`PARTIAL_RECORDED`** (×2); both gates remain **HELD**. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **Phase 49A File 1 — CQ-4 response** | The authority recorded that **no sibling owner participation is required before candidate-class evaluation**, with the qualifier that `loa-finn` / `loa-dixie` may need later owner evidence before any runtime / boundary acceptance. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:146`; `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:150` |
| **Phase 49B File 1 — candidate-class evaluation** | Recorded **`CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`** — the four classes are useful and evaluable but cannot discharge `P-2 … P-10` without exact-grain evidence. | [`./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md) §6 |
| **Sibling lanes (ADR-048B)** | Gate #9 = `loa-finn` runtime-evidence lane (S4); gate #10 = `loa-dixie` boundary-evidence lane (S5); `loa-hounfour` = schema / substrate lane, out of scope here unless evidence implicates schema / protocol. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255` |
| **Cross-repo handoff rule** | No sibling-repo PR may merge without teammate review. | `docs/handoffs/cross-repo-handoff-index.md:28` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. This gate records a routing posture for sibling evidence; it changes no sibling state
> and authorizes no sibling work.

---

## 2. Sibling evidence posture

The three sibling surfaces remain **non-canonical participant surfaces** only; none owns the canonical estate
record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`; `docs/handoffs/finn-runtime-boundary.md:59`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). Their evidence posture is:

- **`loa-finn` (runtime / execution — gate #9).** Gate #9 remains **held with `PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`). It is **likely** that later
  **runtime-owner evidence** will be needed from the Finn owner before any *runtime acceptance* tied to a
  concrete host — through the gate #9 acceptance path, which requires the Finn owner to explicitly ACCEPT
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`). No such evidence is
  requested here.
- **`loa-dixie` (route-side ingress / control-plane — gate #10).** Gate #10 remains **held with
  `PARTIAL_RECORDED`** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`). It is
  **likely** that later **boundary-owner evidence** will be needed from the Dixie owner before any *boundary
  acceptance* tied to a concrete host — through the gate #10 acceptance path, which requires the Dixie owner to
  explicitly ACCEPT (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`). No such
  evidence is requested here.
- **`loa-hounfour` (schema / validation / policy).** Remains a **non-canonical participant** unless a later
  authority changes this. **No immediate owner evidence is requested here.** Any schema / contract evidence lane
  would open only if later evidence implicates a schema / protocol change, through a separate ADR
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255`).

> The posture says what evidence *may* be needed *later* and through which gate. It requests none of it, opens no
> sibling lane, and authorizes no sibling PR now.

---

## 3. Routing decision

The routing decision records when sibling evidence is and is not on the critical path:

- **Sibling evidence is not required before class-grain evaluation.** Candidate-class evaluation (Phase 49B File
  1) is internal substrate-class reasoning and does not yet touch a sibling runtime / route boundary; the Phase
  49A CQ-4 response confirms no sibling owner participation is required before candidate-class evaluation
  (`docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md:146`). This file does **not** block that
  evaluation, which is already recorded.
- **Sibling evidence is likely required before concrete host acceptance or gate #8 satisfaction.** Once (and if)
  exact-grain authority is later granted and a concrete candidate is evaluated, Finn runtime-owner evidence and
  Dixie boundary-owner evidence are likely prerequisites for runtime / boundary acceptance, through gates #9 /
  #10 respectively (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`).
- **No sibling PR is authorized in this artifact.** This file authorizes no sibling-repo change and opens no
  sibling lane; any future sibling-repo PR remains subject to teammate review
  (`docs/handoffs/cross-repo-handoff-index.md:28`).

> **Routing-recorded ≠ evidence requested ≠ sibling lane opened.** Recording the routing posture is not asking a
> sibling owner for anything, not authorizing a sibling PR, and not satisfying gates #9 / #10 or #8.

---

## 4. Possible later sibling lanes

These are the lanes a *later* PR might open, recorded here only so the routing is legible. **None is opened,
requested, or authorized by this file:**

- **Finn runtime-owner exact-grain evidence request** — a later lane (after exact-grain authority) that would ask
  the `loa-finn` owner for runtime-owner evidence before runtime acceptance, through the gate #9 acceptance path
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:253`).
- **Dixie boundary-owner exact-grain evidence request** — a later lane (after exact-grain authority) that would
  ask the `loa-dixie` owner for boundary-owner evidence before boundary acceptance, through the gate #10
  acceptance path (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:254`).
- **Hounfour schema / contract evidence request — only if later authority requires it** — a later lane that would
  open *only* if later evidence implicates a schema / protocol change, through a separate ADR
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:255`).

---

## 5. Selected next lane

> **Selected next lane: no immediate sibling PR.** This file opens no sibling lane and authorizes no sibling-repo
> change. Instead, it **carries the sibling-evidence requirements forward** into the later lanes that will need
> them.

That carry-forward means:

- the **exact-grain authority response intake** lane (the next lane File 2 routes) inherits the requirement that,
  if exact-grain authority is granted, the later concrete-candidate evaluation must account for Finn / Dixie
  owner evidence before runtime / boundary acceptance;
- the later **concrete-candidate evidence** lane (which would copy the File 4 evidence packet template,
  [`./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-EXACT-GRAIN-EVIDENCE-PACKET-TEMPLATE.md))
  inherits the sibling-evidence posture recorded in §2 as part of its "sibling evidence posture" field;
- no sibling-repo PR may merge without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

Any follow-on PR title must carry its phase label, e.g. `Phase 49C: exact-grain authority response intake`
*(docs-only)*.

---

## 6. Preserved blocked state

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

## 7. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
sibling-evidence routing gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not request** any sibling owner evidence now — it records what may be needed later;
- **does not authorize** any sibling-repo PR — no sibling lane is opened;
- **does not modify** any sibling repo — `loa-finn` / `loa-dixie` / `loa-hounfour` are untouched;
- **does not block** candidate-class evaluation — that is already recorded (File 1);
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **names no product / vendor / engine / deployment provider** — none is named;
- **proposes no production adapter** — none is proposed here;
- **authorizes no implementation** of any kind;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Recording a sibling-evidence routing posture
> is not requesting sibling evidence, authorizing any sibling PR, modifying any sibling repo, blocking
> candidate-class evaluation, satisfying any gate, selecting any host, naming any product / vendor / engine /
> deployment provider, proposing any adapter, or authorizing any implementation.

---

## 8. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49B (File 3 of 4) — gate #8 sibling-evidence routing gate (docs-only) |
| **Predecessor** | Phase 49B File 1 — recorded `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` |
| **Decision result** | **`SIBLING_EVIDENCE_ROUTING_RECORDED`** — what sibling evidence may be needed later is recorded with its routing; not `SIBLING_EVIDENCE_ROUTING_HELD` (the posture is formable and recorded); not `PATCH_REQUIRED_SIBLING_EVIDENCE_ROUTING_AMBIGUOUS` (the posture is unambiguous and bounded) |
| **`loa-finn` (gate #9)** | held with `PARTIAL_RECORDED`; likely later runtime-owner evidence needed before runtime acceptance (gate #9 path); none requested here |
| **`loa-dixie` (gate #10)** | held with `PARTIAL_RECORDED`; likely later boundary-owner evidence needed before boundary acceptance (gate #10 path); none requested here |
| **`loa-hounfour` (schema / substrate lane)** | non-canonical participant unless later authority changes this; schema / contract evidence only if later authority requires it; none requested here |
| **Routing** | sibling evidence not required before class-grain evaluation; likely required before concrete host acceptance / gate #8 satisfaction; no sibling PR authorized |
| **Possible later lanes** | Finn runtime-owner evidence request; Dixie boundary-owner evidence request; Hounfour schema / contract evidence request (only if later authority requires) — none opened here |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | no immediate sibling PR; carry sibling-evidence requirements into the exact-grain authority response intake / later concrete-candidate evidence lanes |
| **Scope of this PR** | exactly four new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 9. Audit checklist

- [ ] **Four-file change.** The branch adds exactly the four Phase 49B files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §6 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Routing recorded, not acted upon.** §2 / §3 / §4 record the sibling-evidence posture and possible later
      lanes; no sibling owner evidence is requested, no sibling lane opened, no sibling repo modified.
- [ ] **Does not block evaluation.** §3 confirms sibling evidence is not required before class-grain evaluation.
- [ ] **Result conservative and explained.** §8 records `SIBLING_EVIDENCE_ROUTING_RECORDED`; not HELD, not
      PATCH_REQUIRED.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, gate #9 / #10 satisfaction,
      D.1 satisfaction, D.2 commencement, MVP-2 closure, host selection, a named product / vendor / engine
      candidate, a proposed production adapter, a requested sibling evidence, an authorized sibling PR, or
      implementation — each appears only inside a negation (§6, §7).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 10. Source references

- [Phase 49B File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-CANDIDATE-CLASS-EVALUATION-GATE.md) — recorded
  `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL`. **Predecessor.**
- [Phase 49A File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the CQ-4 response: no
  sibling participation required before candidate-class evaluation (`:146`); Finn / Dixie may need later owner
  evidence before runtime / boundary acceptance (`:150`).
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

*End of Phase 49B File 3. Docs-only gate #8 sibling-evidence routing gate. It records that `loa-finn` (gate #9,
`PARTIAL_RECORDED`) likely needs later runtime-owner evidence before runtime acceptance, that `loa-dixie` (gate
#10, `PARTIAL_RECORDED`) likely needs later boundary-owner evidence before boundary acceptance, and that
`loa-hounfour` remains a non-canonical participant with schema / contract evidence requested only if later
authority requires it; it records the routing decision (sibling evidence not required before class-grain
evaluation, likely required before concrete host acceptance or gate #8 satisfaction, no sibling PR authorized),
and records `SIBLING_EVIDENCE_ROUTING_RECORDED` (not `SIBLING_EVIDENCE_ROUTING_HELD`, not
`PATCH_REQUIRED_SIBLING_EVIDENCE_ROUTING_AMBIGUOUS`). It requests no sibling evidence, authorizes no sibling PR,
modifies no sibling repo, blocks no candidate-class evaluation, satisfies no gate, selects no concrete host, names
no product / vendor / engine / deployment provider, proposes no production adapter, and authorizes no
implementation. The selected next lane is no immediate sibling PR; the requirements are carried into the
exact-grain authority response intake and later concrete-candidate evidence lanes. No commit, no push, no PR.*
