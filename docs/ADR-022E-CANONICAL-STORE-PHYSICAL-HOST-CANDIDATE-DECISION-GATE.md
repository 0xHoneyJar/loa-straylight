# Phase 48Q — ADR-022E Canonical-Store Physical-Host Candidate Decision Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 48Q** — docs-only **candidate decision** gate for the canonical-store
> physical-host question (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / decision-only.** This gate asks one bounded question — *can a canonical-store
> physical-host **candidate** be named for later review from existing local architecture evidence?* —
> and records the conservative answer. It selects **no** host, names **no** vendor / product / engine,
> proposes **no** production adapter, and authorizes **no** implementation. It opens no new live state,
> claims no gate is satisfied, discharges no gate, and reopens nothing earlier phases closed. The only
> change on this branch is this one Markdown file. No source, test, runtime, route, storage, DB,
> migration, auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire,
> memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an
ADR, and is **not** numbered `ADR-048Q` — following the live convention for the request / intake /
routing / decision-prep gates across the Phase 48 family. It records a single bounded decision about one
held dependency; it decides nothing about the corridor and selects no host. The immediate predecessor is
**Phase 48P**
([`./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md`](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md)),
which decomposed D.1(ii) / gate #8 into the §5 `P-1 … P-11` evidence sub-questions and **selected this
docs-only candidate decision gate as the next step**
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:248`). Neither top-level
`docs/` nor `docs/decisions/` carries an ADR/packet register that enumerates this family, so none is
created or modified (verified by inspection).

---

## 1. What this gate decides (and does not)

Phase 48Q **answers one question and records the result.** It does exactly four things:

1. Restate the source context and the held state entering this phase (§2, §3).
2. State the candidate-decision question precisely (§4).
3. Evaluate that question against the Phase 48P `P-1 … P-11` decomposition (§6) and record the
   conservative result (§5) — one of `CANDIDATE_SELECTED_FOR_REVIEW` or
   `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`.
4. Explain why the result does not close the proof chain (§7), preserve every held/open state as a
   non-claim (§8), and select the next docs-only lane (§9), then hand it off (§10).

This gate is conservative by construction. Deciding whether a candidate *can* be named is **not** naming
one; finding the local evidence insufficient is **not** producing it; routing to a later
question-framing lane is **not** answering it. The owner-response routing Phase 48L completed is **not**
reopened here; the sibling evidence lanes that returned `PARTIAL` are **not** reopened here; the no-host
decision ADR-048C recorded is **not** revisited here.

---

## 2. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N** | **Merged** (`loa-straylight` PR #85). Recorded both sibling evidence results and selected the Phase 48P decomposition / decision-prep gate. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:202` |
| **Phase 48P** | **Merged** (`loa-straylight` PR #86). Decomposed D.1(ii) / gate #8 into `P-1 … P-11` and selected **this** docs-only candidate decision gate. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:248` |
| **Gate #9 evidence** (Finn runtime, `loa-finn` PR #196) | **`PARTIAL_RECORDED`** — partial; gate #9 remains HELD. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:86` |
| **Gate #10 evidence** (Dixie boundary, `loa-dixie` PR #204) | **`PARTIAL_RECORDED`** — partial; gate #10 remains HELD. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:87` |
| **Evidence-return routing** | **`RECORDED`** — the sibling-result-intake step is complete; not reopened here. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:88` |
| **ADR-022E gate #8** | **OPEN / HELD** — not discharged; `ADR-022E:57` not satisfied. | `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` |

> Nothing in §2 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table
> is a status restatement only. The two recorded sibling results remain `PARTIAL_RECORDED`; recording a
> `PARTIAL` result is the recording of a partial result, not gate satisfaction
> (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:48`).

---

## 3. Held state entering this phase (preserved)

| Item | State | Authority / evidence |
|------|-------|----------------------|
| **D.1(ii)** — canonical-store physical-host dependency | **UNRESOLVED / HELD** (externally held under sibling gates #9 / #10). | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163` |
| **Gate #8** (production database / persistence substrate) | **OPEN / HELD** — `ADR-022E:57` not satisfied. | `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` |
| **Full D.1** | **NOT SATISFIED** — conjunct (i) accepted + conjunct (ii) unresolved ⇒ the conjunction does not hold. D.1(i) is **not reopened**. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165` |
| **D.2** | **NOT STARTED** — downstream of full D.1. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167` |
| **MVP-2** | **OPEN.** | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168` |
| **Canonical-store physical host (S2)** | **NONE chosen.** `InMemoryStorage` / `JsonlStorage` remain the only MVP adapters behind the `StorageAdapter` swap-in seam. | `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75` |
| **Most recent candidate evaluation** | **ADR-048C recorded no-host / no-selection** (Candidate E) — no candidate carried a proposed production adapter. | `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:304` |

---

## 4. The candidate-decision question

> **Can `loa-straylight` name a canonical-store physical-host *candidate* — for later review — based on
> existing local architecture evidence?**

This is a deliberately narrower question than gate-#8 closure and narrower than the ADR-048C host-selection
matrix. It does **not** ask whether a host can be *selected* (ADR-048B rejected "select a host now" —
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:178`), nor whether the gate
#8 trigger can be *satisfied* (it requires a proposed production adapter —
`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`). It asks only whether the **local repo
evidence is sufficient to name a candidate at all**, as a review candidate, for a *later, separately
reviewed* lane.

Two bounding rules govern the answer. A candidate may be named **only** if it is supported by local repo
docs and citations; and no vendor / product / database-engine name may be introduced, because the
no-leak discipline forbids surfacing a "database-engine product name"
(`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`). Where the local
evidence does not support a candidate, the correct outcome is `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`,
not an invented candidate.

What the canonical-store physical host **is** (the durable persistence substrate for the canonical
`Assertion` / `EstateTransition` / `TransitionReceipt` / `AuditEvent` bytes and the supersession
relation — the S2 surface) and what it is **not** (a route-local JSON snapshot, process-local memory, a
SQL-syntax proof, sibling runtime/boundary evidence, or a general host preference) are fixed by Phase
48P §4 and are **not** re-defined here
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:91`).

---

## 5. Decision result

> **Result: `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`.**
>
> Existing local architecture evidence is **insufficient to name a canonical-store physical-host
> candidate**. No `loa-straylight` doc names a durable physical substrate that could serve as a review
> candidate. The conservative outcome is therefore to record **no candidate decision** and route to a
> docs-only **upstream architecture-question** gate that frames the question first — selecting no host
> and authorizing no implementation.

**Why not `CANDIDATE_SELECTED_FOR_REVIEW`.** Naming a candidate requires a candidate that local
evidence supports. There is none:

1. **The repo names no durable physical substrate as a candidate.** The only persistence adapters that
   exist are `InMemoryStorage` and `JsonlStorage`, which Phase 48P §4 explicitly excludes as the
   canonical-store physical host ("Not merely process-local memory"; "Not merely a route-local JSON
   snapshot") (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`;
   `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:101`). The
   `StorageAdapter` interface is described as "the swap-in seam for a future … substrate"
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`) — a seam description, **not** a
   named candidate.
2. **The most recent candidate evaluation already returned no-host.** ADR-048C scored five candidate
   shapes (A–E) against nine criteria and recorded **no-host / no-selection** as the safest outcome,
   precisely because **no candidate carried a proposed production adapter**
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:304`;
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:269`). Nothing in the
   local evidence base has changed since: Phase 48N recorded `PARTIAL` evidence and Phase 48P produced
   **no** new evidence (it decomposed, it did not evidence —
   `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:154`). The candidates
   ADR-048C evaluated are *surfaces / owning repos* — Finn runtime (S4), Dixie route-side records
   (S5), and Hounfour schema substrate (S3) — and none is the canonical store (S2): Finn's
   host-suitability is "Unproven locally" and whether any portion of the canonical-store enforcement
   boundary lands in a Finn lane is "exactly what gate #9 must resolve"
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:208`); Dixie
   route-side records (S5) are "explicitly **not** the canonical store (S2)"
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:222`); and Hounfour
   "ships schema, not a canonical-store byte substrate"
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:236`).
3. **Naming one anyway would violate the bounding rules.** It would require either inventing a substrate
   (forbidden), introducing a vendor / product / engine name (forbidden by the no-leak discipline —
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`), or treating an
   excluded near-neighbour (process-local memory / route-local JSON) as the host (forbidden by Phase
   48P §4).

**The genuinely unframed upstream architecture question(s).** This gate refines — it does not contradict
— Phase 48P §10. Phase 48P correctly observed that the six-surface frame (S1–S6) and the `R1–R8` /
`M1–M8` enumerations already exist
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:253`). At the finer grain
of *naming a candidate* (this gate's job, distinct from 48P's *decomposition* job), two architecture
questions are found to be genuinely **unframed** — they block `P-1` and, through it, every downstream
P-row:

- **UQ-1 — the S2 ownership / placement model itself.** ADR-048B frames S2 as a *surface* and marks it
  **UNSELECTED**, with owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`). It routes the #9 /
  #10 / Hounfour *evidence lanes* to candidate repos, but those are S4 / S5 / S3 and are explicitly
  **not** S2. No local artifact records a decision on **what S2 is owned as** — a standalone durable
  substrate under the `loa-straylight` decision frame, a portion realized inside an already-routed
  sibling surface, or a separate substrate tier — nor on what "owning S2" means as *decision frame* vs
  *implementation*. `P-1` asks exactly this (`candidate host identity & ownership boundary`) and cannot
  be answered from local evidence.
- **UQ-2 — the candidate-naming evidence shape under the no-leak rule.** Phase 48P `P-11` names the
  evidence shape a *future gate-#8 closure* attempt must carry (a *proposed production adapter* + the
  sibling-repo handoff citation)
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`). No artifact
  frames the lighter, prior question this gate needs: **what may a canonical-store host even be *named*
  as — at candidate grain, short of a production adapter — without naming a product / vendor / engine
  and without conflating S2 with an excluded near-neighbour?** Until that shape is framed, a candidate
  cannot be named conservatively.

Because the blocker is these two **unframed architecture questions** (not merely absent produced
evidence), the safe routing per Phase 48P §10's contingency is a docs-only **upstream
architecture-question** gate
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:257`).

> **Gate #8 remains OPEN / HELD.** This `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` result records the
> absence of a nameable candidate and the upstream questions that must be framed first; it advances,
> satisfies, and discharges nothing.

---

## 6. Evaluation against Phase 48P `P-1 … P-11`

Each P-row is evaluated for one thing only: **could it yield, or be evaluated for, a candidate from
existing local evidence?** None can, and the table records why. Producing any of this evidence is a
later, separately reviewed lane; none is produced here.

| # | P-row (Phase 48P §5) | Candidate-evaluable from local evidence now? | Why |
|---|----------------------|----------------------------------------------|-----|
| **P-1** | **Candidate host identity & ownership boundary** | **No.** | No local doc names an S2 substrate candidate; S2 is UNSELECTED with owner "none" and its ownership/placement model is unframed (**UQ-1**) (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`). This is the binding gap. |
| **P-2** | **Persistence durability** (durability, append-only / supersession semantics) | **No.** | The ADR-022D persistence posture and the `StorageAdapter` seam exist as *requirements any future adapter must preserve*, not as a named durable host (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`). With no `P-1` candidate, there is nothing to evaluate durability *of*. |
| **P-3** | **Tenant / actor / estate isolation** | **No.** | Dixie resolves the authoritative `tenant_id` at ingress (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:318`), but that is route-side (S5), not an S2 host. Isolation cannot be evaluated against an unnamed substrate. |
| **P-4** | **Migration / schema-ownership boundary** | **No.** | Schema substrate is `loa-hounfour`'s and adoption is never automatic; no local evidence implicates a schema/protocol change for the host question (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:351`). |
| **P-5** | **Runtime writer boundary** | **No.** | Finn EMITS what the wedge DEFINES — it "applies transitions through the wedge's `EstateStore` … never by writing directly to storage," and bypassing `EstateStore` "skips the receipt and the audit chain — Finn must not"; runtime enforcement (S4) is therefore not the canonical store (S2) (`docs/handoffs/finn-runtime-boundary.md:59-64`). The gate #9 evidence is `PARTIAL_RECORDED` and selects no host. |
| **P-6** | **Read / recall boundary** | **No.** | The ADR-026D recall-intake slice is a narrow ingress endpoint, not a durable canonical-store host; gate #8 stays HELD even for it (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`). |
| **P-7** | **Audit / receipt persistence boundary** | **No.** | The six receipt categories and audit-chain integrity invariants are requirements any future adapter must preserve (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:170`) — they constrain a host, they do not name one. |
| **P-8** | **Failure / rollback / recovery** | **No.** | These expectations are implicit in the `StorageAdapter` seam-preservation requirement (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:170`); with no `P-1` candidate, no failure behaviour can be evaluated. |
| **P-9** | **Permission / auth / signer authority** | **No.** | Signer / keyring and receipt/audit *meaning* are permanent S1 ownership (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`); a host must not become the de-facto authority, but no candidate exists to test against this boundary. |
| **P-10** | **No-leak / public-private projection** | **No.** | The disposition-frame invariants — revoked / forgotten / private / contested do not surface as `usable` — are "the contract the host inherits" (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:118-122`); the same no-leak rule forbids naming a product to fill the gap (**UQ-2**) (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`). |
| **P-11** | **Test / evidence shape needed** | **No.** | `P-11` names the *gate-#8-closure* evidence shape (a proposed production adapter) (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`); the prior *candidate-naming* evidence shape is itself unframed (**UQ-2**). |

> Every row resolves to **No**. `P-1` is the binding gap (UQ-1); `P-10` / `P-11` surface the
> candidate-naming evidence-shape gap (UQ-2); `P-2 … P-9` each presuppose a `P-1` candidate that does
> not exist. None of `P-1 … P-11` is answered here — the table records what is still missing.

---

## 7. Why this result does not close the proof chain

A `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` result is the recording of an *absence* (no nameable
candidate) plus a *route* (frame the upstream question first). It advances nothing:

- **gate #8 remains held** — OPEN / HELD; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **gate #9 remains held** — `PARTIAL_RECORDED`; the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:160`);
- **gate #10 remains held** — `PARTIAL_RECORDED`; the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`);
- **D.1(ii) remains unresolved** unless and until later evidence frames the upstream question, names a
  candidate, and validates it — none of which happens here;
- **D.1 is not satisfied** (conjunct (i) accepted + conjunct (ii) unresolved);
- **D.2 is not started** (downstream of full D.1);
- **MVP-2 remains open.**

Recording "no candidate can be named yet" transfers no canonical semantic ownership to any sibling —
Straylight remains the semantic owner (S1); ownership does not follow location
(`docs/decisions/ADR-020A-straylight-semantic-owner.md:100`). Naming where the bytes would live (S2)
never moves S1 (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:106`).

---

## 8. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
candidate decision gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**;
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains HELD (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains HELD (`PARTIAL_RECORDED`);
- **does not satisfy** full **D.1** — D.1 is not satisfied (D.1(i) not reopened; D.1(ii) unresolved);
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **selects no canonical-store physical host** — the canonical-store physical host remains UNSELECTED;
- **names no host candidate** — the result is `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`; no vendor /
  product / database-engine name is introduced;
- **proposes no production adapter** — none is proposed here, and naming the candidate-evidence shape a
  future lane would need (UQ-2) is a *future evidence requirement*, not an adapter proposal here;
- **authorizes no implementation** of any kind;
- **authorizes no** source, test, runtime, config, package, CI, schema, migration, or SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Finding the evidence insufficient
> is not producing it; routing to a question-framing lane is not framing the question.

---

## 9. Selected next lane

> **Selected next lane: a docs-only `loa-straylight` upstream architecture-question gate** that frames
> **UQ-1** (the S2 ownership / placement model) and **UQ-2** (the candidate-naming evidence shape under
> the no-leak rule) **first** — still selecting no host, naming no product, and authorizing no
> implementation.

This is the contingency branch Phase 48P §10 reserved for exactly this finding: a P-row (`P-1`) cannot
be evaluated because an upstream architecture question is genuinely unframed, so the safe next lane is an
upstream-architecture-question gate rather than a host-candidate decision
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:257`).

A later docs-only **host-candidate evidence authorization / decomposition** gate (Phase 48P's *preferred*
branch — `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:248`) becomes the
correct lane only **after** UQ-1 / UQ-2 are framed and a candidate becomes nameable from local evidence;
it is **not** selected now.

A re-request of sibling evidence is **not** selected: the sibling lanes have already returned, and
duplicate evidence is not requested unless a later, separately reviewed implementation lane creates new
evidence (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:195`).

Any follow-on PR title must carry its phase label, e.g.
`Phase 48R: canonical-store physical-host upstream architecture-question gate` *(docs-only)*.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 48Q — canonical-store physical-host candidate decision (docs-only) |
| **Predecessor** | Phase 48P (merged) — D.1(ii) / gate #8 decomposition / decision-prep |
| **Candidate-decision question** | Can a canonical-store physical-host *candidate* be named from existing local architecture evidence? |
| **Decision result** | **`NO_DECISION_UPSTREAM_QUESTION_REQUIRED`** — local evidence is insufficient to name a candidate |
| **Upstream question(s)** | **UQ-1** S2 ownership / placement model (blocks `P-1`); **UQ-2** candidate-naming evidence shape under the no-leak rule (blocks `P-10` / `P-11`) |
| **`P-1 … P-11`** | every row **not candidate-evaluable** from local evidence (§6) |
| **Gate #9 / #10 evidence** | both `PARTIAL_RECORDED`; both gates remain HELD |
| **Gate #8** | remains **OPEN / HELD**; `ADR-022E:57` not satisfied |
| **D.1(ii)** | UNRESOLVED (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no host selected; no candidate named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only canonical-store physical-host **upstream architecture-question** gate (frames UQ-1 / UQ-2; selects no host; authorizes no implementation) |
| **Not selected** | naming a host candidate; host selection; production-adapter proposal; implementation authorization; reopening owner-response routing or the sibling evidence lanes; duplicate sibling-evidence requests (absent new evidence) |
| **Scope of this PR** | exactly one new docs file; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Single-file change.** The branch adds exactly one new file,
      `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md`, and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §2 / §3 keep gate #8 OPEN / HELD; gates #9 / #10 HELD
      (`PARTIAL_RECORDED`); evidence-return routing `RECORDED`; D.1(ii) unresolved; D.1 not satisfied;
      D.2 not started; MVP-2 open; no host chosen.
- [ ] **Question bounded.** §4 states the candidate-decision question and its two bounding rules
      (local-evidence-only; no product / vendor / engine name).
- [ ] **Decision conservative.** §5 records `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` because local
      evidence names no S2 candidate, identifies the genuinely unframed UQ-1 / UQ-2, and routes to an
      upstream architecture-question gate.
- [ ] **P-1 … P-11 evaluated.** §6 evaluates every P-row as not candidate-evaluable, citing the binding
      gap at `P-1` and the evidence-shape gap at `P-10` / `P-11`.
- [ ] **Gate citations real.** `ADR-022E:57` (#8), `:58` (#9), `:59` (#10) resolve to actual rows in
      `docs/decisions/ADR-022E-phase-22-deferred-features.md`.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, full-D.1
      satisfaction, D.2 commencement, MVP-2 closure, host selection, a named candidate, a proposed
      production adapter, or implementation authorization — each appears only inside a negation (§8).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container/orchestration detail appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no
      sibling repo written to.

---

## 12. Source references

- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed
  D.1(ii) / gate #8 into `P-1 … P-11` and **selected this candidate decision gate**
  (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:248`); reserved the
  upstream-architecture-question contingency (`:257`). **Entry baseline.**
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — recorded the two
  sibling evidence results (`PARTIAL_RECORDED` ×2) and the evidence-return routing as `RECORDED`
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:86`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — owns the
  host-selection / sibling-gate-routing decision frame; defines the six surfaces and marks S2 UNSELECTED
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`); rejected "select a
  host now" (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:178`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — recorded the
  **no-host** decision (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:304`)
  because no candidate carried a proposed production adapter
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:269`); the no-leak rule
  forbids a database-engine product name
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD),
  #9 (`:58`, HELD), #10 (`:59`, HELD). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`); `InMemoryStorage` / `JsonlStorage`
  as the only MVP adapters (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`); the receipt
  + audit-chain invariants any future host must preserve
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:170`); host is a persistence/exposure
  surface, not the semantic owner (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:106`).
- [ADR-026D](./decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md) — gate #10 narrowly
  unblocked for recall-intake only; gate #8 still held
  (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`); authoritative tenant
  resolution at ingress (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:318`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) — Straylight is the canonical semantic
  owner (S1); signer / keyring is S1 (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`);
  naming where bytes live does not move S1
  (`docs/decisions/ADR-020A-straylight-semantic-owner.md:100`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — Finn EMITS what the wedge DEFINES,
  applying transitions through the wedge's `EstateStore` and never writing directly to storage
  (`docs/handoffs/finn-runtime-boundary.md:59-64`); the surfaces stay separable
  (`docs/handoffs/finn-runtime-boundary.md:18`).
- [`source-hierarchy.md`](./product-context/source-hierarchy.md) — doctrine / architecture as authority;
  research handoffs do not define implementation by themselves
  (`docs/product-context/source-hierarchy.md:23`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge
  without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).
- **Cross-repo (read as evidence, NOT modified):** `loa-finn` PR #196
  (`https://github.com/0xHoneyJar/loa-finn/pull/196`; result `PARTIAL`, gate #9 held); `loa-dixie`
  PR #204 (`https://github.com/0xHoneyJar/loa-dixie/pull/204`; result `PARTIAL`, gate #10 held). Confirm
  in the owning repos.

---

*End of Phase 48Q gate. Docs-only canonical-store physical-host candidate decision gate. It records
`NO_DECISION_UPSTREAM_QUESTION_REQUIRED` — existing local architecture evidence is insufficient to name a
canonical-store physical-host candidate — identifies the genuinely unframed upstream questions (UQ-1 the
S2 ownership / placement model; UQ-2 the candidate-naming evidence shape under the no-leak rule), and
selects a docs-only upstream architecture-question gate as the next step. It claims no gate is satisfied,
discharges no gate, selects no host, names no candidate, proposes no production adapter, and authorizes
no implementation. No commit, no push, no PR.*
