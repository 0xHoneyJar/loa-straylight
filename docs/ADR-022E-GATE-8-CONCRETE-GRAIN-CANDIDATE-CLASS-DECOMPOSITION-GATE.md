# Phase 49A — ADR-022E Gate #8 Concrete-Grain Candidate-Class Decomposition Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49A (File 2 of 3)** — docs-only **concrete-grain candidate-class decomposition** gate for
> the canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / decomposition only.** Phase 49A File 1 intook the architecture / product authority's
> response and recorded **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`**: bounded candidate-class evaluation authority was
> granted across four classes, while host selection and implementation authorization were withheld
> ([`./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md)).
> This file **decomposes those four authorized classes** (A–D), defines for each what may be evaluated later and
> what remains forbidden here, maps each to `P-1 … P-11`, defines the candidate-class evaluation outputs a
> still-later lane may record, routes a docs-only candidate-class *evaluation* gate, and records
> **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`**. It **decomposes classes; it does not evaluate them.** It
> selects **no** concrete physical host, selects **no** production database, names **no** product / vendor /
> engine / deployment provider, proposes **no** production adapter, and authorizes **no** implementation. The
> only change on this branch is **three** new Markdown files under `docs/`. No source, test, runtime, route,
> storage, DB, migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`,
> grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and
is **not** numbered `ADR-049A` — following the live convention for the Phase 48 / 49 family. It records a bounded
**candidate-class decomposition** at the concrete-grain *class* level the Phase 49A File 1 response authorized —
classes only, never a concrete member of any class. The immediate companion is **Phase 49A File 1**
([`./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md)),
which recorded `CONCRETE_GRAIN_AUTHORITY_PARTIAL` and selected this decomposition gate as the next step. The
template companion is **Phase 49A File 3**
([`./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md)).

This is **File 2 of 3** in Phase 49A.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48Z File 2 — authority request** | Framed CQ-1 … CQ-5 for architecture / product authority and recorded **`CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED`**. | `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:13`; `docs/ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md:99` |
| **Phase 49A File 1 — authority response intake** | Recorded **`CONCRETE_GRAIN_AUTHORITY_PARTIAL`**: CQ-1 yes (bounded candidate-class evaluation only, not implementation); CQ-2 four authorized classes; CQ-3 evidence obligations across `P-1 … P-11`; CQ-4 no sibling participation required before candidate-class evaluation; CQ-5 implementation remains separate. | [`./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) §4–§5 |
| **Phase 48P — `P-1 … P-11`** | Decomposed D.1(ii) / gate #8 into `P-1 … P-11` and pinned the gate-#8-closure evidence shape at `P-11`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152` |
| **Candidate identity** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`**; ownership boundary **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`**; semantic owner `loa-straylight`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. The Phase 49A File 1 `CONCRETE_GRAIN_AUTHORITY_PARTIAL` response is the entry
> baseline; this gate decomposes the classes that response authorized — and goes no further.

---

## 2. Decomposition scope

This gate is a **candidate-class decomposition**, deliberately narrower than a candidate-class evaluation. Its
scope is fixed by the Phase 49A File 1 response (CQ-2):

- **Docs-only.** The only change on this branch is three new Markdown files under `docs/`.
- **Class grain only.** It decomposes the four authorized *classes*; it names **no** concrete member of any
  class — no product / vendor / engine / deployment provider
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`).
- **Decomposes, does not evaluate.** It defines what a later candidate-class evaluation lane *may* evaluate and
  what it *must not* do; it evaluates no class itself and records no candidate-class accepted / partial /
  rejected / ambiguous result.
- **Does not select a concrete host.** The canonical-store physical host stays **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
- **Does not authorize implementation.** It authorizes no source / test / runtime / config / package / CI /
  schema / migration / SQL change and no production wiring (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

> **Decomposition ≠ evaluation ≠ selection.** Naming the boundaries of the four classes is not evaluating them,
> not selecting a member of any of them, and not selecting a concrete host. This gate moves the corridor by
> exactly one box — from *candidate-class evaluation authorized (partial)* to *candidate classes decomposed* —
> and crosses into none of the later boxes.

---

## 3. Candidate-class decomposition (Classes A–D)

The Phase 49A File 1 response (CQ-2) authorized exactly four concrete-grain decision **classes**. Each is
decomposed below at *class* grain only. Throughout, "evaluate the class" means reason about the class as a
category of options; it **never** means name, select, or recommend a concrete member of that class.

### 3.1 Class A — database engine class

- **What this class is.** The class of durable-store **engine kinds** a canonical-store substrate could in
  principle rest on, considered as a category — relational vs document vs log-structured vs embedded-file, and
  the durability / consistency properties each *kind* offers, at class grain.
- **What may be evaluated later.** Which engine-kind *properties* a concrete host would need to satisfy
  `P-2 … P-9` (durability, isolation, schema ownership, writer boundary, recall boundary, audit / receipt
  persistence, recovery, auth / signer authority), reasoned as class-level capability requirements.
- **What remains forbidden here (and in the later evaluation lane unless separately authorized).** Naming a
  concrete engine, product, or vendor; choosing one engine kind over another as *the* selection; any connection
  string, port, credential, account, region, or topology detail.

### 3.2 Class B — deployment-provider class

- **What this class is.** The class of **where and how** the canonical-store substrate is operated, considered as
  a category — the operating-location / operating-environment axis, at class grain.
- **What may be evaluated later.** Which operating-environment *properties* bear on `P-5 … P-9` (runtime writer
  boundary, recall boundary, audit / receipt persistence, recovery, auth / signer authority) and on the no-leak
  projection (`P-10`), reasoned as class-level requirements.
- **What remains forbidden here.** Naming a concrete deployment provider, region, account, or topology;
  selecting one operating environment over another; any orchestration or wiring detail.

### 3.3 Class C — managed-service vs self-hosted class

- **What this class is.** The **operational-ownership axis** — whether the substrate is operated as a managed
  service or self-hosted — considered as a category, at class grain.
- **What may be evaluated later.** How the operational-ownership axis bears on `P-9` (who holds signer / keyring /
  permission authority over canonical writes — a host must never become the de-facto authority) and on the
  Straylight semantic-ownership invariant, reasoned as class-level requirements
  (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
  `docs/decisions/ADR-022A-straylight-semantic-home.md:62`).
- **What remains forbidden here.** Naming a concrete managed service or self-hosted product; selecting one side
  of the axis over the other; any account, credential, or operational-control detail.

### 3.4 Class D — evidence-shape class

- **What this class is.** The class of **what evidence a concrete host would have to carry** before it could be
  accepted — considered as a category of evidence requirements, at class grain. This is the meta-class: it
  decomposes the *shape* of evidence rather than any substrate kind.
- **What may be evaluated later.** Which inspectable evidence-shape a concrete-host candidate must carry against
  `P-1 … P-11` and, separately and later, the gate-#8-closure shape (a *proposed production adapter* + the
  sibling-repo handoff citation), which is pinned at Phase 48P `P-11` and reserved for a separate, later,
  separately-reviewed lane (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`;
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
- **What remains forbidden here.** Producing the evidence; proposing a production adapter; claiming any
  `P-row` is discharged; any implementation.

> Classes A–D are **categories of options**, not options. Decomposing them defines the boundary of a later
> candidate-class evaluation lane and nothing more. No class is evaluated, ranked, selected, or narrowed to a
> concrete member here.

---

## 4. Class → `P-1 … P-11` evidence mapping

Each authorized class is mapped to the `P-1 … P-11` rows it most bears on, reusing the Phase 48P decomposition
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`). This is a **mapping of which
obligations each class touches**, not a proof matrix and not a validator ledger — no evidence is produced, and no
`P-row` is proven, partial, or failed here.

| Class | Primary `P-row` obligations the class bears on |
|-------|------------------------------------------------|
| **A — database engine class** | `P-2` durability; `P-3` isolation; `P-4` migration / schema ownership; `P-7` audit / receipt persistence; `P-8` failure / rollback / recovery — under preserved `P-1` candidate identity / ownership. |
| **B — deployment-provider class** | `P-5` runtime writer boundary; `P-6` read / recall boundary; `P-8` failure / rollback / recovery; `P-9` permission / auth / signer authority; `P-10` no-leak / public-private projection. |
| **C — managed-service vs self-hosted class** | `P-9` permission / auth / signer authority (a host must not become the de-facto authority); `P-1` candidate identity / ownership (Straylight semantic ownership preserved); `P-5` runtime writer boundary. |
| **D — evidence-shape class** | `P-11` test / evidence shape (the inspectable shape itself); cross-cuts `P-1 … P-10` because it describes *what evidence each must carry*. |

> The mapping says which obligations each class **touches**, so a later evaluation lane knows where to look. It
> does not discharge, prove, or partially prove any `P-row`, and it does not produce evidence. The `P-1 … P-11`
> definitions are unchanged from Phase 48P (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).

---

## 5. Candidate-class evaluation outputs allowed later

A still-later docs-only candidate-class **evaluation** lane (routed in §7) may record, **per class**, exactly one
of the following outputs. **These are the outputs that lane may record — none is recorded, selected, or implied
here:**

- `CONCRETE_GRAIN_CANDIDATE_CLASS_ACCEPTED` — *allowed later output.* The evaluation lane would record this for a
  class whose class-level capability requirements are coherent and fully reasoned against its mapped `P-rows`,
  **without** naming or selecting a concrete member.
- `CONCRETE_GRAIN_CANDIDATE_CLASS_PARTIAL` — *allowed later output.* The evaluation lane would record this for a
  class whose requirements are partly reasoned and partly open.
- `CONCRETE_GRAIN_CANDIDATE_CLASS_REJECTED` — *allowed later output.* The evaluation lane would record this for a
  class that cannot satisfy its mapped `P-row` obligations even at class grain.
- `PATCH_REQUIRED_CANDIDATE_CLASS_EVALUATION_AMBIGUOUS` — *allowed later output.* The evaluation lane would record
  this if a class evaluation could not be recorded without amendment.

> **Allowed-later output ≠ this gate's result.** This gate's result is
> `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED` (§8). The four tokens above are the shapes a later evaluation lane
> may record *per class* — none is selected, assumed, or recorded here. Even a later
> `CONCRETE_GRAIN_CANDIDATE_CLASS_ACCEPTED` would **not** select a concrete host, name a product / vendor /
> engine / deployment provider, propose an adapter, authorize implementation, or satisfy gate #8.

---

## 6. What remains forbidden (carried into the later evaluation lane)

The later candidate-class evaluation lane that consumes this decomposition **must not**, unless a later authority
response explicitly allows that exact grain:

- name a **concrete product / vendor / engine / deployment provider** — none may be named at any class;
- **select a production database** — none may be selected;
- **select a concrete physical host** — the canonical-store physical host stays **UNSELECTED**
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **propose a production adapter** — proposing a production adapter is the ADR-048C `M5` gate-#8-closure shape,
  reserved for a still-later, separately-reviewed lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- make any **source / test / runtime / config / package / CI / schema / migration / SQL** change;
- introduce **production wiring**;
- **claim gate #8** (or gate #9 / #10, D.1, D.2, or MVP-2) is closed, satisfied, or discharged.

> The later lane evaluates the authorized **classes** against their mapped `P-rows` and **nothing more**. A
> class evaluation — even an accepted one — selects no host, selects no production database, names no concrete
> member, proposes no adapter, authorizes no implementation, and satisfies no gate. The no-leak / forbidden-grain
> boundary is preserved (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).

---

## 7. Selected next lane

> **Selected next lane: a docs-only concrete-grain candidate-class *evaluation* gate.** Because the Phase 49A
> File 1 response granted bounded candidate-class evaluation authority and this gate has decomposed the four
> authorized classes, the next docs-only step evaluates the allowed classes (A–D) against their mapped
> `P-1 … P-11` obligations and records, per class, one of the §5 outputs.

That selected next lane:

- **may evaluate the allowed classes** — A (database engine class), B (deployment-provider class),
  C (managed-service vs self-hosted class), and D (evidence-shape class), at class grain;
- **may use the Phase 49A File 3 evidence packet template** —
  [`./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md)
  — copying and filling it for the class under evaluation;
- **must not implement** — it authorizes no source / test / runtime / config / package / CI / schema / migration
  / SQL change and no production wiring;
- **must not select a concrete product / vendor / engine / provider** unless a later authority response
  **explicitly** allows that exact grain
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

Any follow-on PR title must carry its phase label, e.g.
`Phase 49B: concrete-grain candidate-class evaluation` *(docs-only)*.

---

## 8. Decomposition decision and rationale

The decomposition result is recorded against the permitted results for this gate, and the
conservative-but-accurate result is **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`**:

1. **It is `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`** — the Phase 49A File 1 response authorized four classes
   (CQ-2); §3 decomposes each at class grain with allowed-later and forbidden-here boundaries, §4 maps each to
   `P-1 … P-11`, §5 defines the per-class evaluation outputs, and §7 routes the evaluation lane. The classes are
   decomposed and bounded. This is recorded above.
2. **It is *not* `CONCRETE_GRAIN_CANDIDATE_CLASS_HELD`** — a held result would apply only if the classes could
   not be decomposed (for example, if the authority response were missing or the authorized classes were
   unformable). The response is recorded (`CONCRETE_GRAIN_AUTHORITY_PARTIAL`) and the four classes are explicit
   and decomposable, so the decomposition is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_CANDIDATE_CLASS_DECOMPOSITION_AMBIGUOUS`** — a patch result would apply if the
   decomposition were ambiguous, internally inconsistent, or impossible to record without amendment. The four
   classes and their `P-row` mapping are unambiguous and bounded to class grain: the decomposition defines what a
   later lane may evaluate and does not itself evaluate, select, or implement. No patch is required.

> **Decomposed ≠ evaluated ≠ host selected ≠ gate #8 satisfaction.** Recording
> `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED` is the result of *this decomposition gate only*. It evaluates no
> class, selects no host, selects no production database, names no product / vendor / engine / deployment
> provider, proposes no adapter, and authorizes no implementation. **Gate #8 remains OPEN / HELD.**

---

## 9. Preserved blocked state

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

## 10. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
concrete-grain candidate-class decomposition gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not evaluate** any candidate class — it decomposes the classes; the evaluation is a later lane;
- **records no** candidate-class accepted / partial / rejected / ambiguous result — those are later-lane outputs;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **selects no product / vendor / engine / deployment provider** — none is named;
- **proposes no production adapter** — none is proposed here;
- **authorizes no implementation** of any kind;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Decomposing the authorized candidate
> classes is not evaluating them, selecting any class member, selecting any host, selecting any production
> database, naming any product / vendor / engine / deployment provider, proposing any adapter, satisfying any
> gate, or authorizing any implementation.

---

## 11. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49A (File 2 of 3) — gate #8 concrete-grain candidate-class decomposition gate (docs-only) |
| **Predecessor** | Phase 49A File 1 — recorded `CONCRETE_GRAIN_AUTHORITY_PARTIAL`; selected this decomposition gate |
| **Decision result** | **`CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED`** — the four authorized classes are decomposed at class grain, mapped to `P-1 … P-11`, given per-class evaluation outputs, and routed to an evaluation lane; not `CONCRETE_GRAIN_CANDIDATE_CLASS_HELD` (the classes are decomposable and decomposed); not `PATCH_REQUIRED_CANDIDATE_CLASS_DECOMPOSITION_AMBIGUOUS` (the decomposition is unambiguous and bounded) |
| **Classes decomposed** | Class A — database engine class; Class B — deployment-provider class; Class C — managed-service vs self-hosted class; Class D — evidence-shape class (all at class grain only, no concrete member named) |
| **Class → `P-row` mapping** | A → `P-2`/`P-3`/`P-4`/`P-7`/`P-8`; B → `P-5`/`P-6`/`P-8`/`P-9`/`P-10`; C → `P-9`/`P-1`/`P-5`; D → `P-11` (cross-cuts `P-1 … P-10`) |
| **Allowed-later outputs (per class)** | `CONCRETE_GRAIN_CANDIDATE_CLASS_ACCEPTED` / `_PARTIAL` / `_REJECTED` / `PATCH_REQUIRED_CANDIDATE_CLASS_EVALUATION_AMBIGUOUS` — later-lane outputs, not this PR's result |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight` |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-grain candidate-class evaluation gate; may evaluate Classes A–D at class grain using the File 3 template; must not select a concrete member or implement |
| **Scope of this PR** | exactly three new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 12. Audit checklist

- [ ] **Three-file change.** The branch adds exactly the three Phase 49A files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §9 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Classes decomposed, not evaluated.** §3 decomposes Classes A–D at class grain with allowed-later and
      forbidden-here boundaries; §4 maps each to `P-1 … P-11`; no class is evaluated, ranked, or narrowed to a
      concrete member.
- [ ] **Outputs are later-lane, not this gate's result.** §5 lists the per-class evaluation outputs as
      allowed-later only; none is recorded here.
- [ ] **Result conservative and explained.** §8 records `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED` and explains
      why it is not HELD and not PATCH_REQUIRED.
- [ ] **Next lane bounded.** §7 selects a docs-only candidate-class evaluation gate that may evaluate the classes
      but must not select a concrete member or implement unless a later authority response explicitly allows it.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, D.1 satisfaction, D.2
      commencement, MVP-2 closure, host selection, production-database selection, a named product / vendor /
      engine candidate, a proposed production adapter, a recorded candidate-class evaluation result, or
      implementation — each appears only inside a negation (§9, §10).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the class-grain decomposition and the no-leak restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no
      sibling repo written to.

---

## 13. Source references

- [Phase 49A File 1](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-RESPONSE-INTAKE-GATE.md) — recorded
  `CONCRETE_GRAIN_AUTHORITY_PARTIAL`; the CQ-1 … CQ-5 response (§4) and the four authorized classes (CQ-2).
  **Entry baseline / companion.**
- [Phase 49A File 3](./ADR-022E-GATE-8-CONCRETE-HOST-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md) — the evidence packet
  template / checklist a later candidate-class evaluation PR copies and fills. **Companion template.**
- [Phase 48Z File 2](./ADR-022E-GATE-8-CONCRETE-GRAIN-AUTHORITY-REQUEST-GATE.md) — recorded
  `CONCRETE_GRAIN_AUTHORITY_REQUEST_RECORDED` (`:13`); framed CQ-1 … CQ-5 (`:99`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`); pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — named the candidate at
  substrate-class grain (`:108`).
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) — the
  accepted UQ-1 placement model (`:138`); the accepted UQ-2 candidate-naming grain (substrate-class only, not
  product / vendor / engine / deployment) (`:139`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak enumerated forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam
  (`:79`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) /
  [ADR-022A](./decisions/ADR-022A-straylight-semantic-home.md) — Straylight is the canonical semantic owner
  (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
  `docs/decisions/ADR-022A-straylight-semantic-home.md:62`).

---

*End of Phase 49A File 2. Docs-only gate #8 concrete-grain candidate-class decomposition gate. It takes the Phase
49A File 1 `CONCRETE_GRAIN_AUTHORITY_PARTIAL` response, decomposes the four authorized classes at class grain
(Class A — database engine class; Class B — deployment-provider class; Class C — managed-service vs self-hosted
class; Class D — evidence-shape class), defines for each what may be evaluated later and what remains forbidden
here, maps each to `P-1 … P-11`, defines the per-class evaluation outputs a later lane may record
(`CONCRETE_GRAIN_CANDIDATE_CLASS_ACCEPTED` / `_PARTIAL` / `_REJECTED` /
`PATCH_REQUIRED_CANDIDATE_CLASS_EVALUATION_AMBIGUOUS`), routes a docs-only candidate-class evaluation gate, and
records `CONCRETE_GRAIN_CANDIDATE_CLASS_DECOMPOSED` (not `_HELD`, not
`PATCH_REQUIRED_CANDIDATE_CLASS_DECOMPOSITION_AMBIGUOUS`). It evaluates no class, selects no concrete host,
selects no production database, names no product / vendor / engine / deployment provider, proposes no adapter,
and authorizes no implementation. The selected next lane is a docs-only concrete-grain candidate-class evaluation
gate. No commit, no push, no PR.*
