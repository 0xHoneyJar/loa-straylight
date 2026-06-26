# Phase 48R — ADR-022E Canonical-Store Physical-Host Upstream Architecture-Question Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 48R** — docs-only **upstream architecture-question** gate for the canonical-store
> physical-host question (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / question-framing only.** This gate **frames** the two upstream architecture
> questions that Phase 48Q found genuinely unframed — **UQ-1** (the S2 ownership / placement model) and
> **UQ-2** (the candidate-naming grain under the no-leak rule) — and defines what an acceptable *answer*
> must establish before a host-candidate decision can be reopened. It **answers neither** question (no
> local doc supports an answer), selects **no** host, names **no** vendor / product / engine / substrate,
> proposes **no** production adapter, and authorizes **no** implementation. It opens no new live state,
> claims no gate is satisfied, discharges no gate, and reopens nothing earlier phases closed. The only
> change on this branch is this one Markdown file. No source, test, runtime, route, storage, DB,
> migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire,
> memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an
ADR, and is **not** numbered `ADR-048R` — following the live convention for the request / intake /
routing / decision-prep / decision gates across the Phase 48 family. It frames two questions; it decides
nothing about the corridor and selects no host. The immediate predecessor is **Phase 48Q**
([`./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md`](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md)),
which evaluated the candidate-decision question and recorded `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`,
routing exactly these two upstream questions
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112`). Neither top-level `docs/`
nor `docs/decisions/` carries an ADR/packet register that enumerates this family, so none is created or
modified (verified by inspection).

---

## 1. What this gate does (and does not)

Phase 48R **frames two upstream questions and routes the next lane.** It does exactly five things:

1. Restate the source context and the held/open state entering this phase (§2, §3).
2. State the two upstream architecture questions precisely (§4) and show why each blocks its P-rows
   (§5 for UQ-1 → `P-1`; §6 for UQ-2 → `P-10` / `P-11`).
3. Define what an acceptable *answer* to each question must establish — UQ-1 (§7) and UQ-2 (§8) — without
   producing that answer here.
4. Separate question-framing from the future architecture answer, the future host-candidate decision, the
   future evidence authorization, and the future implementation authorization (§9), and record the
   conservative decision result for this artifact (§10).
5. Select the next docs-only lane (§11), preserve every held/open state as a non-claim (§12), and hand it
   off (§13).

This gate is conservative by construction. **Framing** a question is **not answering** it; defining what
an acceptable answer must establish is **not** establishing it; routing to an answer lane is **not**
deciding a host. The owner-response routing Phase 48L closed is **not** reopened here; the sibling
evidence lanes that returned `PARTIAL` are **not** reopened here; the no-host decision ADR-048C recorded
is **not** revisited here; the Phase 48Q `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` result is **not**
contradicted here — it is the entry baseline.

---

## 2. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N** | **Merged** (`loa-straylight` PR #85). Recorded both sibling evidence results (`PARTIAL_RECORDED` ×2) and the evidence-return routing as `RECORDED`; selected the Phase 48P decomposition / decision-prep gate. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:202` |
| **Phase 48P** | **Merged** (`loa-straylight` PR #86). Decomposed D.1(ii) / gate #8 into `P-1 … P-11` and reserved the upstream-architecture-question contingency. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:257` |
| **Phase 48Q** | **Merged** (`loa-straylight` PR #87). Evaluated the candidate-decision question and recorded **`NO_DECISION_UPSTREAM_QUESTION_REQUIRED`**; routed **UQ-1** and **UQ-2**; recorded every `P-1 … P-11` row as not candidate-evaluable from local evidence. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112` |
| **Phase 48Q result** | **`NO_DECISION_UPSTREAM_QUESTION_REQUIRED`** — local evidence is insufficient to name a candidate; the blocker is two genuinely **unframed** upstream architecture questions. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112` |
| **Gate #9 evidence** (Finn runtime, `loa-finn` PR #196) | **`PARTIAL_RECORDED`** — partial; gate #9 remains HELD. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:86` |
| **Gate #10 evidence** (Dixie boundary, `loa-dixie` PR #204) | **`PARTIAL_RECORDED`** — partial; gate #10 remains HELD. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:87` |
| **Evidence-return routing** | **`RECORDED`** — the sibling-result-intake step is complete; not reopened here. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:88` |

> Nothing in §2 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table
> is a status restatement only. Phase 48Q's `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` is the recording of
> an *absence* (no nameable candidate) plus a *route* (frame the upstream question first)
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:219`); this gate executes that
> route's framing step and nothing more.

---

## 3. Current blocked state entering this phase (preserved)

| Item | State | Authority / evidence |
|------|-------|----------------------|
| **Gate #8** (production database / persistence substrate) | **OPEN / HELD** — not discharged; `ADR-022E:57` not satisfied. | `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` |
| **Gate #9** (Finn runtime evidence) | **HELD** — `PARTIAL_RECORDED`; the gate itself unsatisfied. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:160` |
| **Gate #10** (Dixie boundary evidence) | **HELD** — `PARTIAL_RECORDED`; the gate itself unsatisfied. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **D.1(ii)** — canonical-store physical-host dependency | **UNRESOLVED / HELD** (externally held under sibling gates #9 / #10). | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163` |
| **Full D.1** | **NOT SATISFIED** — conjunct (i) accepted + conjunct (ii) unresolved ⇒ the conjunction does not hold. D.1(i) is **not reopened**. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165` |
| **D.2** | **NOT STARTED** — downstream of full D.1. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167` |
| **MVP-2** | **OPEN.** | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168` |
| **Canonical-store physical host (S2)** | **NONE chosen; UNSELECTED, owner "none".** `InMemoryStorage` / `JsonlStorage` remain the only MVP adapters behind the `StorageAdapter` swap-in seam. | `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` |

> This gate preserves every row above unchanged. It frames questions about how S2 is owned and how a
> candidate may be named; it neither selects a host nor advances any gate.

---

## 4. The two upstream architecture questions

Phase 48Q found two architecture questions genuinely **unframed** at the grain of *naming a candidate*,
and routed them as the blocker behind `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:162`). This gate states them
precisely. Neither is answered here.

> **UQ-1 — What is the S2 ownership / placement model for the canonical Admission Wedge / Straylight
> estate record?**
> i.e. *what is the canonical-store physical host (S2) owned as* — a standalone durable substrate held
> under the `loa-straylight` decision frame, a portion realized inside an already-routed sibling surface
> (S3 / S4 / S5), or a separate substrate tier — and what does "owning S2" mean as a *decision frame* vs
> as *implementation*?

> **UQ-2 — What may be named as a host at candidate grain, short of a production adapter, while
> preserving the no-leak rule?**
> i.e. *what naming grain* may a canonical-store host candidate even be expressed in — at candidate grain,
> short of a *proposed production adapter* — without naming a product / vendor / engine and without
> conflating S2 with an excluded near-neighbour, and *what evidence shape* can carry that candidate for
> review without itself becoming a production-adapter proposal?

Both questions concern the **S2 surface** as the ADR-048B six-surface split defines it: the durable
persistence substrate for the canonical primitives, currently **UNSELECTED**, with gate #8 **HELD**
(`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`). What S2 **is** (the
durable substrate for the canonical `Assertion` / `EstateTransition` / `TransitionReceipt` / `AuditEvent`
bytes and the supersession relation) and what it is **not** (a route-local JSON snapshot, process-local
memory, a SQL-syntax proof, sibling runtime / boundary evidence, or a general host preference) were fixed
by Phase 48P §4 and are **not** re-defined here
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:91`).

---

## 5. Why UQ-1 blocks `P-1` (and through it `P-2 … P-9`)

`P-1` is the Phase 48P sub-question for **candidate host identity & ownership boundary** — *which
substrate is the candidate, in which repo, and what does owning it mean (decision-frame vs
implementation)?* (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`).

- **Without an S2 ownership / placement model, there is no candidate host identity or ownership
  boundary.** ADR-048B frames S2 as a *surface* and marks it **UNSELECTED**, owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`). The evidence lanes
  ADR-048B routes are S4 (Finn runtime) / S5 (Dixie route-side) / S3 (Hounfour schema)
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:158`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`), each of which is
  explicitly **not** S2. No local artifact records *what S2 is owned as*, so `P-1` cannot be answered from
  local evidence — it is the binding gap.
- **Without `P-1`, `P-2 … P-9` cannot be candidate-evaluated.** Phase 48Q recorded every one of those
  rows as not candidate-evaluable precisely because each presupposes a `P-1` candidate that does not
  exist — durability (`P-2`), isolation (`P-3`), schema boundary (`P-4`), runtime writer boundary (`P-5`),
  read/recall boundary (`P-6`), audit/receipt persistence (`P-7`), failure/rollback (`P-8`), and
  signer/permission authority (`P-9`) are all *properties of a substrate*, and there is no named substrate
  to evaluate them against (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:211`).

> UQ-1 is therefore upstream of the entire P-row chain: until the S2 ownership / placement model is
> framed and answered, `P-1` has no candidate to identify, and `P-2 … P-9` have nothing to evaluate.

---

## 6. Why UQ-2 blocks `P-10` / `P-11`

`P-10` is the Phase 48P sub-question for the **no-leak / public-private projection boundary**, and `P-11`
is the **test / evidence shape needed** — the concrete, checkable evidence shape (including a *proposed
production adapter* and the sibling-repo handoff citation) a future host-selection proposal must carry
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:151`;
`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`).

- **The system needs a safe naming grain that does not leak private implementation or deployment
  details.** The no-leak discipline forbids surfacing a database-engine product name, connection string,
  port, credential, or container/orchestration detail — the enumerated forbidden-surface list ADR-048C
  pins as its no-leak check
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491-492`). A canonical-store
  host candidate must therefore be expressible at a grain that names the *architectural role* without
  naming the *product*. No local artifact frames what that allowed grain **is**, so naming a candidate
  conservatively is currently impossible — this is the `P-10` side of the gap.
- **The system also needs an evidence shape that can be reviewed without becoming an adapter proposal.**
  `P-11` names the *gate-#8-closure* evidence shape — a *proposed production adapter* plus the relevant
  handoff citation (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
  The lighter, prior question — *what evidence may carry a candidate for review, short of a production
  adapter* — is itself unframed. An evidence shape that drifts into proposing an adapter would cross into
  the gate-#8 trigger, which `ADR-022E:57` reserves for a separate, later lane
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

> UQ-2 is therefore upstream of `P-10` / `P-11`: until the allowed candidate-naming grain and the
> reviewable-but-not-adapter evidence shape are framed and answered, no candidate can be named without
> either leaking a product or accidentally proposing an adapter.

---

## 7. What an acceptable answer to UQ-1 must establish

These are **answer requirements**, not an answer. A later, separately-reviewed lane *may* satisfy them;
**this gate satisfies none of them.** An acceptable UQ-1 answer must establish:

1. **Ownership locus** — whether S2 is owned **inside `loa-straylight`** (a standalone durable substrate
   under the canonical owner's decision frame) or **delegated to a sibling boundary** (a portion realized
   inside an already-routed S3 / S4 / S5 surface, under explicit owner acceptance), and which of those the
   model selects (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`;
   `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:160`).
2. **Naming grain for the candidate host** — whether the candidate may be named by **class, interface,
   repository, physical substrate family, or some other bounded architecture term**, chosen so it states
   the role without naming a product / vendor / engine (the UQ-2 constraint, §8, governs this grain).
3. **Preservation of Straylight semantic authority** — how the ownership boundary keeps **S1** (canonical
   semantic ownership) permanently `loa-straylight`'s: naming where the bytes live (S2) never moves S1,
   because ownership does not follow location
   (`docs/decisions/ADR-020A-straylight-semantic-owner.md:100`;
   `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`), and the host is a
   persistence / exposure surface, **not** the semantic owner
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:106`).
4. **Non-canonical status of sibling surfaces** — how sibling runtime (S4) and boundary / route-side (S5)
   surfaces remain **non-canonical** unless and until a later artifact explicitly authorizes them: Finn
   EMITS what the wedge DEFINES and applies transitions through the wedge's `EstateStore`, never writing
   directly to storage (`docs/handoffs/finn-runtime-boundary.md:59-64`), and Dixie route-side records are
   not the canonical store; the six surfaces stay separable in code, test, and fixture
   (`docs/handoffs/finn-runtime-boundary.md:18`).
5. **Required citations / evidence** — what local doctrine / architecture authority the answer must cite
   to be admissible: doctrine / architecture defines implementation, while research handoffs do not by
   themselves (`docs/product-context/source-hierarchy.md:23`); an S2 ownership decision recorded in an
   owning repo is the ADR-048B `R1` shape, and no sibling lane opens without recorded owner acceptance
   under teammate review (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:274`;
   `docs/handoffs/cross-repo-handoff-index.md:28`).

> None of the five is established here. Listing what an acceptable answer must establish is not
> establishing it.

---

## 8. What an acceptable answer to UQ-2 must establish

Again, **answer requirements, not an answer.** An acceptable UQ-2 answer must establish:

1. **The allowed naming grain** — what grain is permitted *without* violating no-leak: a candidate named
   by **architectural role / class / interface / repository / physical-substrate family** states the role,
   not the product, and so does not leak any item on ADR-048C's enumerated forbidden-surface list — a
   database-engine product name, connection string, port, credential, or container/orchestration detail
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491-492`).
2. **The grain that is too concrete** — what naming grain is **reserved for later implementation
   authorization**: a named product / vendor / engine, or a concrete deployment topology, crosses out of
   candidate grain and toward the gate-#8 trigger, which requires a *proposed production adapter* and is a
   separate, later lane (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
3. **The acceptable evidence shape for candidate review** — what a reviewer may be shown that carries a
   candidate *without* proposing an adapter: a role-grained candidate plus the boundary citations that
   show S2 is kept distinct from S1 / S3 / S4 / S5, reviewable on the semantic-owner side, docs-only.
4. **The evidence shape that would accidentally become a production-adapter proposal** — an explicit
   proposed production adapter (the ADR-048C `M5` shape) *is* the gate-#8-trigger evidence; presenting one
   at candidate grain would conflate candidate review with the closure attempt that `ADR-022E:57` reserves
   for later (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`;
   `docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).
5. **Preservation of public/private projection and disposition-frame constraints** — how the answer keeps
   the disposition-frame invariants the host inherits: revoked / forgotten / private / contested material
   must never surface as `usable`, and these Phase-5 hardening invariants are "the contract the host
   inherits" (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:118-122`); any future host must
   also preserve the six receipt categories and audit-chain integrity invariants
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:170-172`).

> None of the five is established here. Defining the evidence shape a future lane must use is a future
> evidence requirement, **not** an adapter proposal and **not** an answer.

---

## 9. Explicit separation (framing ≠ answer ≠ decision ≠ evidence authorization ≠ implementation)

Five distinct, sequenced concerns are kept apart so that this gate cannot be mistaken for any later one:

1. **Question framing (this gate).** Stating UQ-1 / UQ-2 precisely (§4), showing why each blocks its
   P-rows (§5, §6), and defining what an acceptable answer must establish (§7, §8). Produces framing only.
2. **Future architecture answer (separate, later).** A later docs-only lane *may* answer UQ-1 / UQ-2 by
   establishing the §7 / §8 requirements from doctrine / architecture authority. **Not done here.**
3. **Future host-candidate decision (separate, later).** A later docs-only lane *may* — once UQ-1 / UQ-2
   are answered and a candidate becomes nameable from local evidence — name a candidate for review (or
   record another negative outcome, as ADR-048C did at
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:304`). **Not done here.**
4. **Future evidence authorization (separate, later).** A later artifact *may* authorize the production of
   evidence (runtime / boundary proof, recorded owner acceptance) in an owning repo under teammate review.
   **Not done here.**
5. **Future implementation authorization (separate, later).** A later artifact *may* authorize code and a
   *proposed production adapter* and attempt the gate-#8 trigger. **Not done here.**

> These are strictly ordered: framing precedes the architecture answer, which precedes the host-candidate
> decision, which precedes evidence authorization, which precedes implementation authorization. This gate
> occupies only the first box and crosses into none of the others.

---

## 10. Decision result for this artifact

> **Result: `UPSTREAM_QUESTIONS_FRAMED`.**
>
> UQ-1 and UQ-2 are stated precisely (§4), each is shown to block its P-rows (§5 → `P-1` → `P-2 … P-9`;
> §6 → `P-10` / `P-11`), and the answer requirements for each are defined (§7, §8) — **without** answering
> either. No existing local repo doc directly supports an *answer* to either question, so none is given:
>
> - **UQ-1 is not answerable from local docs.** ADR-048B marks S2 **UNSELECTED**, owner "none"
>   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`); no local artifact
>   records *what S2 is owned as*. That absence is exactly why Phase 48Q routed UQ-1
>   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:162`).
> - **UQ-2 is not answerable from local docs.** The local evidence supplies *constraints* (ADR-048C's
>   enumerated forbidden-surface list rules out a product name — `:491-492`; the gate-#8 trigger requires
>   a proposed production adapter — `ADR-022E:57`) but **no positive definition** of the allowed
>   candidate-naming grain or the
>   reviewable-but-not-adapter evidence shape.
>
> Because the local docs supply only constraints — not answers — the conservative result is
> `UPSTREAM_QUESTIONS_FRAMED`, **not** `UPSTREAM_QUESTIONS_ANSWERED_FROM_LOCAL_DOCS`. The framing is
> complete (both questions stated, both blockages shown, both answer-requirement sets defined), so the
> result is **not** `PATCH_REQUIRED_INSUFFICIENT_FRAMING`.

> **Gate #8 remains OPEN / HELD.** This `UPSTREAM_QUESTIONS_FRAMED` result frames the questions that must
> be answered before a host-candidate decision can be reopened; it advances, satisfies, and discharges
> nothing.

---

## 11. Selected next lane

> **Selected next lane: a later docs-only `loa-straylight` upstream architecture-**answer** candidate
> gate** that *attempts to answer* UQ-1 (the S2 ownership / placement model) and UQ-2 (the candidate-naming
> grain + reviewable evidence shape under the no-leak rule) against the §7 / §8 answer requirements, from
> local doctrine / architecture authority — still selecting no host, naming no product, proposing no
> adapter, and authorizing no implementation.

A later docs-only **host-candidate decision retry** gate (re-attempting the Phase 48Q candidate-decision
question) becomes the correct lane only **after** UQ-1 / UQ-2 are answered and a candidate becomes
nameable from local evidence (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:280`);
it is **not** selected now.

A re-request of sibling evidence is **not** selected: the sibling lanes have already returned, and
duplicate evidence is not requested unless a later, separately-reviewed implementation lane creates new
evidence (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:195`).

Any follow-on PR title must carry its phase label, e.g.
`Phase 48S: canonical-store physical-host upstream architecture-answer candidate gate` *(docs-only)*.

---

## 12. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
upstream architecture-question gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**;
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains HELD (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains HELD (`PARTIAL_RECORDED`);
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains UNRESOLVED;
- **does not satisfy** full **D.1** — D.1 is not satisfied (D.1(i) not reopened; D.1(ii) unresolved);
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **selects no canonical-store physical host** — the canonical-store physical host remains UNSELECTED;
- **proposes no production adapter** — none is proposed here; defining the evidence shape a future lane
  must use (UQ-2 / §8) is a *future evidence requirement*, not an adapter proposal here;
- **authorizes no implementation** of any kind;
- **authorizes no** source, test, runtime, config, package, CI, schema, migration, or SQL change;
- **authorizes no** production wiring;
- **answers neither UQ-1 nor UQ-2** — no local doc directly supports an answer, so none is given; the
  result is `UPSTREAM_QUESTIONS_FRAMED`, and no vendor / product / database-engine / substrate name is
  introduced.

> Every notion above appears in this document only inside a negation. Framing a question is not answering
> it; defining what an acceptable answer must establish is not establishing it; routing to an answer lane
> is not deciding a host.

---

## 13. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 48R — canonical-store physical-host upstream architecture-question gate (docs-only) |
| **Predecessor** | Phase 48Q (merged) — candidate decision; recorded `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`; routed UQ-1 / UQ-2 |
| **Upstream questions framed** | **UQ-1** the S2 ownership / placement model (blocks `P-1`, and through it `P-2 … P-9`); **UQ-2** the candidate-naming grain + reviewable evidence shape under the no-leak rule (blocks `P-10` / `P-11`) |
| **Decision result** | **`UPSTREAM_QUESTIONS_FRAMED`** — both questions framed and answer requirements defined; neither answered (no local doc supports an answer) |
| **Answer requirements** | UQ-1 (§7): ownership locus; naming grain; S1 preservation; sibling-surface non-canonical status; required citations. UQ-2 (§8): allowed grain; too-concrete grain; acceptable evidence shape; adapter-proposal boundary; disposition-frame preservation |
| **Gate #9 / #10 evidence** | both `PARTIAL_RECORDED`; both gates remain HELD |
| **Gate #8** | remains **OPEN / HELD**; `ADR-022E:57` not satisfied |
| **D.1(ii)** | UNRESOLVED (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no host selected; no candidate named; proposes no production adapter; authorizes no implementation; introduces no vendor / product / engine / substrate name |
| **Selected next lane** | docs-only canonical-store physical-host **upstream architecture-answer candidate** gate (attempts to answer UQ-1 / UQ-2 against §7 / §8; selects no host; authorizes no implementation) |
| **Not selected** | answering UQ-1 / UQ-2; naming a host candidate; host selection; production-adapter proposal; evidence authorization; implementation authorization; reopening owner-response routing or the sibling evidence lanes; duplicate sibling-evidence requests (absent new evidence) |
| **Scope of this PR** | exactly one new docs file; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 14. Audit checklist

- [ ] **Single-file change.** The branch adds exactly one new file,
      `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md`, and nothing
      else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §2 / §3 keep gate #8 OPEN / HELD; gates #9 / #10 HELD
      (`PARTIAL_RECORDED`); evidence-return routing `RECORDED`; D.1(ii) unresolved; D.1 not satisfied; D.2
      not started; MVP-2 open; no host chosen.
- [ ] **Questions framed.** §4 states UQ-1 / UQ-2 precisely; §5 / §6 show why each blocks its P-rows.
- [ ] **Answer requirements defined, not answered.** §7 / §8 define what an acceptable answer must
      establish, each requirement inside a "must establish" frame; no answer is given.
- [ ] **Separation explicit.** §9 keeps framing, architecture answer, host-candidate decision, evidence
      authorization, and implementation authorization distinct and ordered.
- [ ] **Decision conservative.** §10 records `UPSTREAM_QUESTIONS_FRAMED` because local docs supply
      constraints, not answers; it is neither `UPSTREAM_QUESTIONS_ANSWERED_FROM_LOCAL_DOCS` nor
      `PATCH_REQUIRED_INSUFFICIENT_FRAMING`.
- [ ] **Gate citations real.** `ADR-022E:57` (#8), `:58` (#9), `:59` (#10) resolve to actual rows in
      `docs/decisions/ADR-022E-phase-22-deferred-features.md`.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, full-D.1
      satisfaction, D.2 commencement, MVP-2 closure, host selection, a named candidate, a proposed
      production adapter, an answer to UQ-1 / UQ-2, or implementation authorization — each appears only
      inside a negation (§12).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container/orchestration detail appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no
      sibling repo written to.

---

## 15. Source references

- [Phase 48Q](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md) — evaluated the
  candidate-decision question, recorded `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112`), routed **UQ-1** / **UQ-2**
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:162`), and reserved the host-
  candidate retry lane for after they are answered
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:280`). **Entry baseline.**
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed
  D.1(ii) / gate #8 into `P-1 … P-11`
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`;
  `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:151`;
  `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`), fixed the S2
  definition (`:91`), and reserved the upstream-architecture-question contingency (`:257`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — recorded the two
  sibling evidence results (`PARTIAL_RECORDED` ×2) and the evidence-return routing as `RECORDED`
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:86`); carries the held-state
  rows for gates #9 / #10, D.1(ii), D.1, D.2, MVP-2 (`:160`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — owns the
  host-selection / sibling-gate-routing decision frame; defines the six surfaces and marks S2 UNSELECTED,
  owner "none" (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`); S4 / S5
  / S6 rows (`:158`, `:159`, `:160`); ownership does not follow location (`:221`); the `R1` evidence-
  required row (`:274`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — recorded the
  **no-host** decision (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:304`);
  the no-leak check's enumerated forbidden-surface list (database-engine product name, connection string,
  port, credential, container/orchestration detail) (`:491-492`); the `M5` production-adapter-proposal
  shape (`:352`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD),
  #9 (`:58`, HELD), #10 (`:59`, HELD). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — `InMemoryStorage` / `JsonlStorage`
  as the only MVP adapters (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`); the
  `StorageAdapter` swap-in seam (`:79`); host is a persistence / exposure surface, not the semantic owner
  (`:106`); disposition-frame invariants the host inherits (`:118-122`); the six receipt categories and
  audit-chain integrity invariants any future host must preserve (`:170-172`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic
  owner (S1); signer / keyring is S1 (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`); naming
  where bytes live does not move S1 (`:100`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — Finn EMITS what the wedge DEFINES,
  applying transitions through the wedge's `EstateStore` and never writing directly to storage
  (`docs/handoffs/finn-runtime-boundary.md:59-64`); the surfaces stay separable in code, test, and fixture
  (`docs/handoffs/finn-runtime-boundary.md:18`).
- [ADR-026D](./decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md) — production storage
  migration: ADR-022E gate #8 remains held
  (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`); authoritative tenant
  resolution at ingress (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:318`).
- [`source-hierarchy.md`](./product-context/source-hierarchy.md) — doctrine / architecture defines
  implementation; research handoffs do not by themselves
  (`docs/product-context/source-hierarchy.md:23`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge
  without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).
- **Cross-repo (read as evidence, NOT modified):** `loa-finn` PR #196
  (`https://github.com/0xHoneyJar/loa-finn/pull/196`; result `PARTIAL`, gate #9 held); `loa-dixie`
  PR #204 (`https://github.com/0xHoneyJar/loa-dixie/pull/204`; result `PARTIAL`, gate #10 held). Confirm
  in the owning repos.

---

*End of Phase 48R gate. Docs-only canonical-store physical-host upstream architecture-question gate. It
frames the two genuinely unframed upstream architecture questions Phase 48Q routed — UQ-1 (the S2
ownership / placement model) and UQ-2 (the candidate-naming grain + reviewable evidence shape under the
no-leak rule) — defines what an acceptable answer to each must establish, and records
`UPSTREAM_QUESTIONS_FRAMED` because existing local docs supply constraints, not answers. It selects a
docs-only upstream architecture-answer candidate gate as the next step. It answers neither question,
claims no gate is satisfied, discharges no gate, selects no host, names no candidate, proposes no
production adapter, and authorizes no implementation. No commit, no push, no PR.*
