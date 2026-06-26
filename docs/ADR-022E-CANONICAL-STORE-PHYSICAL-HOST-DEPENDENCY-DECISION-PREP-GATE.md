# Phase 48P — ADR-022E Canonical-Store Physical-Host Dependency Decomposition / Decision-Prep Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 48P** — docs-only **decomposition / decision-prep** gate for the canonical-store
> physical-host dependency (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / decision-prep only.** This gate decomposes the remaining **D.1(ii)
> canonical-store physical-host** dependency into its evidence sub-questions and names what is still
> missing **before the proof chain can advance** — *without* selecting a host, proposing a production
> adapter, or authorizing implementation. It **makes no decision**; it prepares a later decision lane.
> It opens no new live state, claims no gate is satisfied, discharges no gate, and reopens nothing that
> earlier phases closed. The only change on this branch is this one Markdown file. No source, test,
> runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI, generated,
> `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an
ADR, and is **not** numbered `ADR-048P` — following the live convention for the request / intake /
routing / decision-prep packets across the Phase 48 family. It records a decomposition / decision-prep
observation about a single held dependency; it decides nothing about the corridor and selects no host.
The immediate predecessor is **Phase 48N**
([`./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md`](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md)),
which recorded the two returned sibling evidence results as `PARTIAL_RECORDED`, recorded evidence-return
routing as `RECORDED`, and **selected this docs-only decomposition / decision-prep gate as the next
step** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:202`). No top-level
`docs/` or `docs/decisions/` register file enumerates this family, so none is created or modified.

---

## 1. Decision

Phase 48P **performs a decomposition, not a decision.** It does exactly four things:

1. Restate the current recorded state and the single binding blocker (§2, §3).
2. Define precisely what **"canonical-store physical host"** means for this gate, and — with equal care
   — what it does **not** mean (§4).
3. Decompose the **evidence still needed** to resolve **D.1(ii)** / gate #8 into named sub-questions,
   anchored to the enumerations that already exist (ADR-048B §8 `R1–R8`; ADR-048C §8 `M1–M8`;
   ADR-048B §4 surfaces `S1–S6`) so this gate **adds structure, not a new proof matrix** (§5).
4. Separate the decision-prep work done here from the **future host-selection decision**, the **future
   implementation authorization**, and the **future production adapter** work — none of which is done
   here (§6) — and explain why the two `PARTIAL` sibling results do **not** close the dependency (§7),
   what safe outputs may follow (§8), what is preserved as a non-claim (§9), and the selected next lane
   (§10).

This gate is conservative by construction. Identifying what evidence is missing is **not** producing
that evidence; naming sub-questions is **not** answering them; preparing a decision lane is **not**
making the decision. The owner-response routing that Phase 48L completed is **not** reopened here; the
sibling evidence lanes that returned `PARTIAL` are **not** reopened here; the no-host decision recorded
in ADR-048C is **not** revisited here.

---

## 2. Current recorded state (restated, not changed)

The state entering Phase 48P is exactly the state Phase 48N left. This table restates it; it advances
nothing.

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N** | **Merged** (`loa-straylight` PR #85). Recorded both sibling evidence results and selected this decomposition / decision-prep gate. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:202` |
| **Gate #9 evidence** (Finn runtime, `loa-finn` PR #196) | **`PARTIAL_RECORDED`** — partial; gate #9 remains HELD. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:86` |
| **Gate #10 evidence** (Dixie boundary, `loa-dixie` PR #204) | **`PARTIAL_RECORDED`** — partial; gate #10 remains HELD. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:87` |
| **Evidence-return routing** | **`RECORDED`** — the sibling-result-intake step is complete; not reopened here. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:88` |
| **Owner-response routing** | **Complete (`ACCEPT_RECORDED` ×2; routing `RECORDED`)** — closed at Phase 48L; **must not be reopened**. | `docs/ADR-022E-SIBLING-GATE-9-10-OWNER-RESPONSE-INTAKE-COMPLETION-GATE.md:94` |

> The owner-response routing question is **closed and must not be reopened** by this gate. Phase 48L
> recorded both sibling owner responses as `ACCEPT_RECORDED` and the routing completion as `RECORDED`;
> Phase 48P adds nothing to that question and does not revisit it. A recorded owner ACCEPT established
> only willingness to own the evidence-lane question — not evidence, not lane opening, not gate
> satisfaction (`docs/ADR-022E-SIBLING-GATE-9-10-OWNER-RESPONSE-INTAKE-COMPLETION-GATE.md:113`).

---

## 3. Dependency statement (the single binding blocker)

| Item | State | Authority / evidence |
|------|-------|----------------------|
| **D.1(ii)** — canonical-store physical-host dependency | **UNRESOLVED / HELD** (externally held under sibling gates #9 / #10). | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`; `docs/ADR-022E-SIBLING-GATE-9-10-CONTROLLED-HUMAN-ROUTING-POSTABILITY-GATE.md:228` |
| **ADR-022E gate #8** (production database / persistence substrate) | **OPEN / HELD** — not discharged; `ADR-022E:57` not satisfied. | `docs/decisions/ADR-022E-phase-22-deferred-features.md:57`; `docs/ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md:248` |
| **Full D.1** | **NOT SATISFIED** — conjunct (i) accepted + conjunct (ii) unresolved ⇒ the conjunction does not hold. D.1(i) is **not reopened**. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165`; `docs/ADR-022E-SIBLING-GATE-9-10-CONTROLLED-HUMAN-ROUTING-POSTABILITY-GATE.md:229` |
| **D.2** | **NOT STARTED** — downstream of full D.1; full D.1 is not gated on D.2. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167`; `docs/ADR-022E-SIBLING-GATE-9-10-CONTROLLED-HUMAN-ROUTING-POSTABILITY-GATE.md:232` |
| **MVP-2** | **OPEN.** | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168` |
| **Canonical-store physical host (S2)** | **NONE chosen.** `InMemoryStorage` / `JsonlStorage` remain the only MVP adapters behind the `StorageAdapter` swap-in seam. | `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75` |

**The binding blocker is narrow.** While **D.1(ii)** is unresolved and both evidence lanes are partial,
gate #8 cannot be discharged, full D.1 is not satisfied, D.2 is not started, and MVP-2 remains open
(`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:187`). This gate decomposes
that blocker; it does not relieve it.

---

## 4. What "canonical-store physical host" means for this gate

For this gate, the **canonical-store physical host** is the **durable physical persistence substrate**
for the canonical Admission Wedge / Straylight estate record — the place the canonical
`Assertion` / `EstateTransition` / `TransitionReceipt` / `AuditEvent` bytes and the supersession
relation **durably live** (the S2 surface in the ADR-048B six-surface split,
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:154`). It is governed by
ADR-022E gate #8, "production database / persistence substrate"
(`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).

To keep the gate from drifting, the canonical-store physical host is explicitly **not** any of the
following near-neighbours:

- **Not merely a route-local JSON snapshot.** A Dixie route-side ingress record, idempotency cache, or
  refusal log (S5) is route-side / control-plane state, **not** the canonical store
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`).
- **Not merely process-local memory.** `InMemoryStorage` is the MVP default adapter, not a durable
  physical persistence substrate (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`).
- **Not merely a SQL syntax proof.** Demonstrating that a query or DDL string parses is not evidence of
  a durable host, of preserved invariants, or of a selected substrate; gate #8 requires a *proposed
  production adapter*, not syntax (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).
- **Not merely sibling runtime / boundary evidence.** Finn runtime / enforcement surfaces (S4) and
  Dixie route-side / boundary surfaces (S5) are real, but neither is the canonical store (S2)
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:158`;
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`).
- **Not a general host preference.** This is a substrate-placement question bounded by gate #8 and the
  ADR-022D invariants, not an open-ended "which infrastructure do we like" question.

> **Semantic vs physical.** Naming where the bytes durably live (S2) **never** moves canonical
> Straylight semantic ownership (S1), which is permanently `loa-straylight`'s: "renaming the repo a
> primitive lives in does not transfer ownership"
> (`docs/decisions/ADR-020A-straylight-semantic-owner.md:100`); the MVP host "is a persistence /
> exposure surface … it is not their semantic owner"
> (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:106`). This decision-prep gate decomposes
> a substrate-placement question; it effects no semantic-ownership migration.

---

## 5. Evidence still needed before gate #8 can advance (decomposition)

This decomposition **refines, it does not replace**, the enumerations that already exist: the `R1–R8`
evidence-required list (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:265`),
the `M1–M8` missing-evidence list
(`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:337`), and the `S1–S6`
surface split (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:143`). Each
row names a **sub-question that must be answerable with evidence** before a future host-selection
decision lane could even be *evaluated*. **None of this evidence is produced here**; the rows name what
is still missing.

| # | Sub-question (evidence still needed) | Maps to | Why load-bearing |
|---|--------------------------------------|---------|------------------|
| P-1 | **Candidate host identity & ownership boundary** — which substrate is the candidate, in which repo, and what does owning it mean (decision-frame vs implementation)? | `R1`; `S2`/`S6` | Conjunct (ii) *is* the physical-host dependency; a candidate must be named with its ownership boundary before it can be evaluated (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:274`). |
| P-2 | **Persistence durability expectations** — durability, append-only / supersession semantics, and what "durable" must guarantee for the canonical record. | `R6` | Any production adapter must preserve the ADR-022D persistence posture and the `StorageAdapter` seam (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:171`). |
| P-3 | **Tenant / actor / estate isolation expectations** — how the substrate isolates per-`tenant`, per-`actor`, per-`estate` records and binds the authoritative tenant. | `R4`; `S5` | Dixie resolves the authoritative `tenant_id`/`estate_id` from authenticated context at ingress (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:318-327`); the canonical store's isolation must survive any host selection. |
| P-4 | **Migration / schema-ownership boundary** — who owns schema/migration shape; what changes (if any) implicate the Hounfour schema/protocol substrate. | `R6`; `M4`; `S3` | Schema substrate is `loa-hounfour`'s and adoption is never automatic — it requires a separate ADR citing the upstream `$id` + alias path + boundary test (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:351`). |
| P-5 | **Runtime writer boundary** — who may write the canonical record at runtime, and how that stays subordinate to S1. | `R5`; `S4` | Finn runtime enforcement (S4) must not absorb or redefine canonical semantics (S1): Finn EMITS the receipt the wedge DEFINES (`docs/handoffs/finn-runtime-boundary.md:24`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:106`). |
| P-6 | **Read / recall boundary** — how recall reads the canonical record and where the route-side recall-intake slice stops. | `R4`; `S5` | The ADR-026D recall-intake slice is a narrow ingress endpoint, not a durable canonical-store host; gate #8 stays HELD even for it (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`). |
| P-7 | **Audit / receipt persistence boundary** — how the audit chain and the six receipt categories persist, and that no host re-mints receipts. | `R6` | Any implementation must preserve the six receipt categories and audit-chain integrity invariants and refuse to re-mint receipts (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:171`). |
| P-8 | **Failure / rollback / recovery expectations** — failure modes, rollback, and recovery the substrate must support without breaking the audit chain. | `R6` | The receipt + audit-chain invariants must hold under failure; this is implicit in the `StorageAdapter` seam-preservation requirement (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:171`). |
| P-9 | **Permission / auth / signer authority boundary** — who holds signer/keyring/permission authority over canonical writes. | `R3`; `S1` | Signer/keyring and receipt/audit *meaning* are part of permanent S1 ownership; a host must not become the de-facto authority (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`; `docs/decisions/ADR-022A-straylight-semantic-home.md:62`). |
| P-10 | **No-leak / public-private projection boundary** — how the substrate preserves privacy-scope + frame projection so challenged/revoked/private material is never surfaced as usable. | `R5`; `S1` | A host that surfaces challenged/revoked/private material as usable is rejected; the Phase-5 hardening invariants are inherited by any host (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:111`). |
| P-11 | **Test / evidence shape needed** — the concrete, checkable evidence shape (including a *proposed production adapter* and the sibling-repo handoff citation) a future host-selection proposal must carry. | `R7`; `M5`; `R2` | The gate #8 trigger cannot be *attempted* without a proposed production adapter and the relevant handoff citation; routing without recorded owner acceptance re-introduces the "Dixie alone resolves it" fallacy (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`; `docs/handoffs/cross-repo-handoff-index.md:28`). |

> None of P-1 … P-11 is answered here. They name the evidence that is **still missing**; producing any
> of it is a later, separately-reviewed lane.

---

## 6. Explicit separation (decision-prep ≠ decision ≠ authorization ≠ adapter)

Four distinct, sequenced concerns are kept apart so that this gate cannot be mistaken for any later one:

1. **Decision-prep evidence requirements (this gate).** Naming the sub-questions and the missing
   evidence (§5). Produces structure only.
2. **Future host-selection decision (separate, later).** A later docs/decision lane *may* choose a host
   candidate — or record another negative (no-host) outcome, as ADR-048C already did
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:302`). **Not done
   here.**
3. **Future implementation authorization (separate, later).** A later artifact *may* authorize code in
   the owning repo under teammate review. **Not done here.**
4. **Future production adapter work (separate, later).** A later artifact *may* propose a production
   adapter and attempt the gate #8 trigger. **Not done here.**

> These are strictly ordered: decision-prep precedes a host-selection decision, which precedes
> implementation authorization, which precedes production adapter work. This gate occupies only the
> first box and crosses into none of the others.

---

## 7. Why the two `PARTIAL` sibling results do not close this dependency

Both sibling evidence lanes returned `PARTIAL` and were recorded as `PARTIAL_RECORDED` at Phase 48N.
Read narrowly, they show real surfaces — and nothing more:

- **Finn (gate #9).** Finn has **real runtime / enforcement surfaces** — the runtime-enforcement module
  that sits in front of governed contract execution; Finn EMITS what the wedge DEFINES
  (`docs/handoffs/finn-runtime-boundary.md:24`). The `PARTIAL` result records those surfaces as real
  and examined, **but it does not select or prove a canonical-store physical host**, and there is no
  full gate #9 pass (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:109`).
  Runtime enforcement (S4) is not the canonical store (S2), and is not semantic ownership (S1).
- **Dixie (gate #10).** Dixie has **real boundary / route-side ingress / control-plane surfaces** — the
  narrow recall-intake slice authorized under ADR-026D
  (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`). The `PARTIAL` result
  records those surfaces as real and examined, **but it does not select or prove a canonical-store
  physical host**, and there is no full gate #10 pass
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:114`). Route-side records
  (S5) are explicitly not the canonical store (S2).

In both cases the evidence is **partial**: a real surface was identified and partially evidenced; the
canonical-store physical-host question (S2 / D.1(ii)) was not answered. Recording two `PARTIAL` results
transfers no canonical semantic ownership to Finn or Dixie — Straylight remains the semantic owner
(`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:143`). Neither result fully
passes its gate, and neither closes D.1(ii).

---

## 8. Safe next possible outputs

This section names what a **later, separately-reviewed** artifact *may* do — explicitly so a reviewer
can see that **this** artifact does none of them:

- A later **decision artifact** *may* choose a host candidate (or record another no-host outcome).
- A later **implementation-authorization artifact** *may* authorize code in the owning repo under
  teammate review.
- A later **evidence artifact** *may* close, or keep held, gate #8.
- **This artifact does none of those.** It produces a decomposition and a decision-prep structure only.

Any follow-on PR title must carry its phase label, e.g.
`Phase 48Q: canonical-store physical-host candidate decision gate` *(docs-only)* — or, if §10's
upstream-question contingency fires, a docs-only upstream-architecture-question gate.

---

## 9. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
decision-prep gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**;
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains HELD;
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains HELD;
- **does not satisfy** full **D.1** — D.1 is not satisfied (D.1(i) is not reopened; D.1(ii) remains
  unresolved);
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **selects no canonical-store physical host** — the canonical-store physical host remains UNSELECTED;
- **proposes no production adapter** — this gate proposes none, and none exists here;
- **authorizes no implementation** of any kind;
- **authorizes no** source, test, runtime, config, package, CI, schema, migration, or SQL change.

> Every notion above appears in this document only inside a negation. Identifying missing evidence is
> not producing it; decomposing a dependency is not resolving it.

---

## 10. Selected next lane

> **Preferred next lane: a later docs-only `loa-straylight` canonical-store physical-host *candidate
> decision* gate** — which would *evaluate* (not pre-decide) a host candidate against the §5 P-1 … P-11
> sub-questions, on the semantic-owner side, docs-only, selecting no host unless and until the evidence
> and recorded sibling-owner acceptance support it.

**Contingency.** This decomposition does **not** reveal a missing upstream architecture question that
must be answered first: the six-surface split (S1–S6), the R1–R8 / M1–M8 enumerations, and the
ADR-022D invariants are already established, and the binding blocker is the *absence of produced
evidence* (a proposed production adapter, runtime/boundary proof, recorded owner acceptance) rather than
an unframed architecture question. **Should** a future reviewer find that a P-row cannot be evaluated
because an upstream architecture question is genuinely unframed, the safe next lane instead becomes a
docs-only **upstream-architecture-question** gate that frames that question first — still selecting no
host and authorizing no implementation.

A re-request of sibling evidence is **not** selected: the sibling lanes have already returned, and
duplicate evidence is not requested unless a later, separately-reviewed implementation lane creates new
evidence (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:195`).

---

## 11. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 48P — canonical-store physical-host dependency decomposition / decision-prep (docs-only) |
| **Predecessor** | Phase 48N (merged) — evidence-result intake completion |
| **Gate #9 / #10 evidence** | both `PARTIAL_RECORDED`; both gates remain HELD |
| **Evidence-return routing** | `RECORDED` (not reopened) |
| **Owner-response routing** | complete (`ACCEPT_RECORDED` ×2; `RECORDED`); **not reopened** |
| **Gate #8** | remains **OPEN / HELD**; `ADR-022E:57` not satisfied |
| **D.1(ii)** | UNRESOLVED (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Decomposition** | §5 P-1 … P-11 — evidence still needed, mapped to R1–R8 / M1–M8 / S1–S6 |
| **Host / adapter / implementation** | no host selected; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only canonical-store physical-host **candidate decision** gate (evaluates, does not pre-decide); upstream-architecture-question gate only if a P-row proves unframeable |
| **Not selected** | host selection; production-adapter proposal; implementation authorization; reopening owner-response routing or the sibling evidence lanes; duplicate sibling-evidence requests (absent new evidence) |
| **Scope of this PR** | exactly one new docs file; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 12. Audit checklist

- [ ] **Single-file change.** The branch adds exactly one new file,
      `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md`, and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling
      repo.
- [ ] **State restated, not changed.** §2 / §3 keep gate #8 OPEN / HELD; gates #9 / #10 HELD; evidence
      `PARTIAL_RECORDED`; evidence-return routing `RECORDED`; owner-response routing complete and not
      reopened; D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Definition bounded.** §4 defines the canonical-store physical host as the durable physical
      persistence substrate (S2) and excludes route-local JSON, process-local memory, SQL syntax proof,
      sibling runtime/boundary evidence, and general host preference.
- [ ] **Decomposition refines, not replaces.** §5 maps P-1 … P-11 to the existing R1–R8 / M1–M8 / S1–S6
      enumerations and produces no new proof matrix; no evidence is produced.
- [ ] **Separation explicit.** §6 keeps decision-prep, host-selection decision, implementation
      authorization, and production-adapter work distinct and ordered.
- [ ] **Partial-result reasoning correct.** §7 explains that Finn (runtime/enforcement) and Dixie
      (boundary/route-side) surfaces are real but neither selects nor proves a canonical-store physical
      host.
- [ ] **Gate citations real.** `ADR-022E:57` (#8), `:58` (#9), `:59` (#10) resolve to actual rows in
      `docs/decisions/ADR-022E-phase-22-deferred-features.md`.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, full-D.1
      satisfaction, D.2 commencement, MVP-2 closure, host selection, a proposed production adapter, or
      implementation authorization — each appears only inside a negation (§9).
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no
      sibling repo written to.

---

## 13. Source references

- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — recorded the two
  sibling evidence results (`PARTIAL_RECORDED` ×2), recorded evidence-return routing as `RECORDED`, and
  **selected this decomposition / decision-prep gate**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:202`). **Entry baseline.**
- [Phase 48L](./ADR-022E-SIBLING-GATE-9-10-OWNER-RESPONSE-INTAKE-COMPLETION-GATE.md) — completed the
  owner-response intake (`ACCEPT_RECORDED` ×2; routing `RECORDED`); owner-response routing is closed and
  **must not be reopened** (`docs/ADR-022E-SIBLING-GATE-9-10-OWNER-RESPONSE-INTAKE-COMPLETION-GATE.md:94`).
- [Phase 48H postability gate](./ADR-022E-SIBLING-GATE-9-10-CONTROLLED-HUMAN-ROUTING-POSTABILITY-GATE.md)
  — carries the D.1 conjunct (i)/(ii) decomposition and the held-state table
  (`docs/ADR-022E-SIBLING-GATE-9-10-CONTROLLED-HUMAN-ROUTING-POSTABILITY-GATE.md:228`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — owns the
  host-selection / sibling-gate-routing **decision frame**; defines the six surfaces S1–S6
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:143`) and the `R1–R8`
  evidence-required list (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:265`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — recorded the
  **no-host** decision (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:302`)
  and the `M1–M8` missing-evidence list
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:337`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD),
  #9 (`:58`, HELD), #10 (`:59`, HELD). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in
  seam (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`); `InMemoryStorage` /
  `JsonlStorage` as the only MVP adapters
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`); the receipt + audit-chain
  invariants any future host must preserve
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:171`).
- [ADR-026D](./decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md) — gate #10 narrowly
  unblocked for recall-intake only; gate #8 still held
  (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`); authoritative tenant
  resolution at ingress (`docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:318-327`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) /
  [ADR-022A](./decisions/ADR-022A-straylight-semantic-home.md) — Straylight is the canonical semantic
  owner (S1); naming where bytes live does not move S1
  (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
  `docs/decisions/ADR-020A-straylight-semantic-owner.md:100`;
  `docs/decisions/ADR-022A-straylight-semantic-home.md:62`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — Finn EMITS what the wedge DEFINES;
  the surfaces stay separable (`docs/handoffs/finn-runtime-boundary.md:24`;
  `docs/handoffs/finn-runtime-boundary.md:18`).
- [`source-hierarchy.md`](./product-context/source-hierarchy.md) — doctrine / architecture as authority;
  research handoffs do not define implementation by themselves
  (`docs/product-context/source-hierarchy.md:23`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge
  without teammate review; the owner cannot unilaterally bind a sibling
  (`docs/handoffs/cross-repo-handoff-index.md:28`).
- **Cross-repo (read as evidence, NOT modified):** `loa-finn` PR #196
  (`https://github.com/0xHoneyJar/loa-finn/pull/196`; result `PARTIAL`, gate #9 held); `loa-dixie`
  PR #204 (`https://github.com/0xHoneyJar/loa-dixie/pull/204`; result `PARTIAL`, gate #10 held). Confirm
  in the owning repos.

---

*End of Phase 48P gate. Docs-only canonical-store physical-host dependency decomposition / decision-prep
gate. It decomposes D.1(ii) / gate #8 into the evidence still needed (§5 P-1 … P-11), preserves the held
corridor state, and selects a docs-only canonical-store physical-host candidate decision gate as the
next step. It makes no decision: it claims no gate is satisfied, discharges no gate, selects no host,
proposes no production adapter, and authorizes no implementation. No commit, no push, no PR.*
