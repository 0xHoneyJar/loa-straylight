# Phase 48W — ADR-022E Canonical-Store Physical-Host Candidate Decision-Retry Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 48W** — docs-only **candidate decision-retry** gate for the canonical-store
> physical-host question (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / candidate-decision-retry only.** Phase 48V **accepted** the Phase 48U recorded
> architecture-authority answer pair — UQ-1 `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` and UQ-2
> `durable Straylight canonical-store substrate class` — as sufficient input for a later host-candidate
> decision retry at architecture-boundary / substrate-class grain, recording
> **`UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`**
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`), and selected
> this docs-only candidate decision-retry gate as the next step
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:313`). This gate
> **retries** the Phase 48Q candidate-decision question — which had recorded
> `NO_DECISION_UPSTREAM_QUESTION_REQUIRED`
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112`) — now that the upstream
> answers resolve the prior blocker to evaluation. It evaluates **one** architecture-boundary /
> substrate-class candidate against the Phase 48P `P-1 … P-11` decomposition and decides whether that
> candidate may be carried forward to a **later evidence-authorization lane**. It selects **no** concrete
> physical host, names **no** product / vendor / engine / deployment provider, proposes **no** production
> adapter, and authorizes **no** implementation. The only change on this branch is this one Markdown
> file. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI,
> generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an
ADR, and is **not** numbered `ADR-048W` — following the live convention for the question / answer /
request / intake / acceptance / decision gates across the Phase 48 family (the immediate predecessor
Phase 48V sits at top-level `docs/` for the same reason). It records a bounded *decision retry* at
architecture-boundary / substrate-class grain; it decides nothing about the corridor's concrete host and
selects no host. The immediate predecessor is **Phase 48V**
([`./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md`](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md)),
which accepted the recorded answer pair as sufficient input for this retry
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`), bounded the
host-candidate retry authorization to *evaluation against `P-1 … P-11` at substrate-class grain*
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:291`), and selected
exactly this docs-only candidate decision-retry lane as the next step
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:313`). Neither
top-level `docs/` nor `docs/decisions/` carries an ADR/packet register that enumerates this family, so
none is created or modified (verified by inspection).

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N** | **Merged** (`loa-straylight` PR #85). Recorded both sibling evidence results (`PARTIAL_RECORDED` ×2) and the evidence-return routing as `RECORDED`. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:86`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:88` |
| **Phase 48P** | **Merged** (`loa-straylight` PR #86). Decomposed D.1(ii) / gate #8 into `P-1 … P-11` and pinned the gate-#8-closure evidence shape at `P-11`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152` |
| **Phase 48Q** | **Merged** (`loa-straylight` PR #87). Recorded **`NO_DECISION_UPSTREAM_QUESTION_REQUIRED`** and routed **UQ-1** / **UQ-2** — the question this gate now retries. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:162` |
| **Phase 48R** | **Merged** (`loa-straylight` PR #88). Framed UQ-1 / UQ-2 and reserved host-candidate retry for after UQ-1 / UQ-2 are answered and accepted. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md:99`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md:106` |
| **Phase 48S** | **Merged** (`loa-straylight` PR #89). Recorded **`NO_LOCAL_UPSTREAM_ANSWER_SUPPORTED`** — local docs supply constraints, not answers. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-ANSWER-CANDIDATE-GATE.md:227`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-ANSWER-CANDIDATE-GATE.md:229` |
| **Phase 48T** | **Merged** (`loa-straylight` PR #90). Issued the bounded architecture-authority request and recorded **`ARCHITECTURE_AUTHORITY_REQUEST_RECORDED`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-REQUEST-GATE.md:287` |
| **Phase 48U** | **Merged** (`loa-straylight` PR #92). Received and classified the response, recorded the UQ-1 / UQ-2 answer tokens, and recorded **`AUTHORITY_ANSWER_PROVIDED_FOR_UQ_1_AND_UQ_2`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:151` |
| **Phase 48V** | **Merged** (`loa-straylight` PR #94). Accepted the recorded answer pair as sufficient input for this retry and recorded **`UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`**; selected this candidate decision-retry lane. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:313` |
| **Phase 48V result** | **`UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`** — accepted UQ-1 `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` and UQ-2 `durable Straylight canonical-store substrate class` at architecture-authority grain. **Acceptance, not retry.** | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:130` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table
> is a status restatement only. Phase 48V's `UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`
> classification is the entry baseline; this gate executes the candidate decision-retry step it selected.

---

## 2. Candidate-decision scope

> **This artifact retries the host-candidate decision at architecture-boundary / substrate-class grain —
> and nothing more.** Phase 48V accepted the answer pair and bounded the retry to *evaluation against
> `P-1 … P-11`* (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:291`).
> This gate performs that bounded retry.

The scope is bounded as follows:

1. **This is a retry after upstream answer acceptance.** The Phase 48Q candidate-decision question
   recorded `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` because the S2 placement model and the allowed
   candidate-naming grain were unframed
   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112`). Phase 48V removed that
   blocker by accepting UQ-1 / UQ-2
   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`). This gate
   re-attempts the question with those accepted answers as inputs.
2. **It evaluates only an architecture-boundary / substrate-class candidate.** Evaluation stays at the
   level of role, responsibility, and required capability — the allowed naming grain Phase 48V accepted
   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:196`).
3. **It does not select a concrete physical host.** The canonical-store physical host (S2) remains
   **UNSELECTED**, owner "none"
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
4. **It does not select product / vendor / engine / deployment provider.** None is named; the forbidden
   grain Phase 48V enumerated is preserved
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
5. **It does not propose a production adapter.** Proposing a production adapter is the ADR-048C `M5`
   shape reserved for the gate-#8-closure lane
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
6. **It does not authorize implementation.** No implementation of any kind is authorized; the
   `StorageAdapter` swap-in seam and `InMemoryStorage` / `JsonlStorage` MVP adapters are unchanged
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`;
   `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

> The retry moves the corridor by exactly one box — from *answer accepted as sufficient input* to
> *substrate-class candidate selected for a later evidence-authorization lane* — and crosses into none of
> the later boxes (gate #8 satisfaction, D.1 satisfaction, D.2 start, MVP-2 closure).

---

## 3. Candidate identity

The single candidate under evaluation in this retry is:

| Field | Value |
|-------|-------|
| **Candidate label** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** |
| **Candidate class** | durable Straylight canonical-store substrate class (the UQ-2 accepted naming grain — `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:196`) |
| **Ownership boundary** | **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`** (the UQ-1 accepted placement model — `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:130`) |
| **Semantic owner** | `loa-straylight` — permanent; ownership does not follow location (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`) |

**Candidate meaning.** `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` is a Straylight-owned durable
canonical-store substrate class for admitted estate records, audit / receipt persistence, tenant / actor
/ estate isolation, and recall-readable canonical estate material. It is an architecture-boundary /
substrate-class candidate only. It is **not** a product, **not** a vendor, **not** an engine, **not** a
deployment provider, and **not** a database implementation. It is **not** a schema, migration, SQL
design, adapter implementation, runtime wiring, connection string, port, credential, account, region,
topology, or orchestration detail — those grains are the forbidden grain Phase 48V preserved
(`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).

**Sibling surfaces (non-canonical, preserved).** The siblings remain non-canonical participant surfaces
only; none owns the canonical estate record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`):

- `loa-finn` remains a **non-canonical** participant surface (runtime / execution / intake-evidence;
  applies transitions through the wedge's `EstateStore`, never writing directly to storage —
  `docs/handoffs/finn-runtime-boundary.md:59`);
- `loa-dixie` remains a **non-canonical** participant surface (route-side ingress / boundary /
  control-plane — `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`);
- `loa-hounfour` remains a **non-canonical** participant surface (schema / validation / policy);
- future sibling delegation requires an explicit authority decision, reviewed evidence in the owning
  repo, and a separate acceptance gate — no sibling-repo PR may merge without teammate review
  (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 4. `P-1 … P-11` retry evaluation

Each row from the Phase 48P decomposition
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`) is given a **bounded**
posture for the retry: whether the substrate-class candidate can be **carried forward to a later
evidence-authorization lane**. This is not a proof matrix and not an implementation design — no evidence
is produced here, and no P-row is *proven*.

| # | P-row (Phase 48P) | Retry posture |
|---|-------------------|---------------|
| P-1 | Candidate host identity & ownership boundary | **Now evaluable at substrate-class grain** because UQ-1 / UQ-2 were accepted (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`). The candidate is named — `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` — with its ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` and `loa-straylight` as semantic owner (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`). |
| P-2 | Persistence durability expectations | Candidate **requires durable substrate-class evidence later; not proven here.** Any later host must preserve the ADR-022D persistence posture and the `StorageAdapter` seam (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:143`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`). |
| P-3 | Tenant / actor / estate isolation | Candidate **requires isolation evidence later; not proven here.** Authoritative tenant resolution sits at Dixie ingress, and the canonical store's isolation must survive any host selection (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:144`; `docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:318`). |
| P-4 | Migration / schema ownership | Candidate **must preserve Straylight ownership and defer schema / migration details; not authorized here.** Schema substrate is `loa-hounfour`'s and adoption is never automatic (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:145`). |
| P-5 | Runtime writer boundary | Candidate **requires later evidence of a governed writer boundary; not proven here.** Finn runtime enforcement (S4) must not absorb or redefine canonical semantics (S1) (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:146`; `docs/handoffs/finn-runtime-boundary.md:59`). |
| P-6 | Read / recall boundary | Candidate **requires later evidence of a recall-readable canonical estate boundary; not proven here.** The ADR-026D recall-intake slice is a narrow ingress endpoint, not a durable canonical-store host; gate #8 stays HELD even for it (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:147`; `docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`). |
| P-7 | Audit / receipt persistence | Candidate **requires later evidence of audit / receipt persistence; not proven here.** Any later implementation must preserve the six receipt categories and audit-chain integrity and refuse to re-mint receipts (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:148`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:171`). |
| P-8 | Failure / rollback / recovery | Candidate **requires later evidence; not proven here.** The receipt + audit-chain invariants must hold under failure, implicit in the `StorageAdapter` seam-preservation requirement (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:149`). |
| P-9 | Permission / auth / signer authority | Candidate **requires later evidence; not proven here.** Signer / keyring and receipt / audit *meaning* are part of permanent S1 ownership; a host must not become the de-facto authority (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:150`; `docs/decisions/ADR-022A-straylight-semantic-home.md:62`). |
| P-10 | No-leak / public-private projection | Candidate **must preserve the forbidden-grain boundary; not proven here.** A host that surfaces challenged / revoked / private material as usable is rejected; the Phase-5 hardening invariants are inherited by any host (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:151`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:111`). |
| P-11 | Test / evidence shape | Candidate **can route to a later evidence-authorization lane; no test implementation here.** The gate-#8-closure evidence shape (a *proposed production adapter* + the sibling-repo handoff citation) is pinned at Phase 48P `P-11` and is a separate, later lane (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`; `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`). |

> Of the eleven rows, only `P-1` (identity & ownership boundary at substrate-class grain) is *evaluable
> and satisfied at this grain* because the upstream answers were accepted. `P-2 … P-11` each remain
> **not proven here**: they name the evidence a later evidence-authorization lane must produce. Selecting
> the candidate for that lane is **not** proving any of `P-2 … P-11`.

---

## 5. Decision rationale

The retry is recorded against the three permitted decision results for this gate, and the
conservative-but-accurate result is **`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`**:

1. **The upstream answers resolved the prior blocker to candidate evaluation at substrate-class grain.**
   Phase 48Q could record only `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` because the placement model and
   naming grain were unframed (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112`);
   Phase 48V accepted UQ-1 / UQ-2 and removed that blocker
   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`).
2. **The candidate remains within the allowed naming grain from Phase 48V** — a durable Straylight
   canonical-store substrate class, named at role / responsibility / required-capability grain only
   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:196`).
3. **The candidate preserves Straylight semantic authority** — `loa-straylight` remains the canonical
   semantic owner; ownership does not follow location
   (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
   `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`).
4. **The candidate preserves sibling non-canonical status** — `loa-finn` / `loa-dixie` / `loa-hounfour`
   remain non-canonical participant surfaces only (`docs/handoffs/finn-runtime-boundary.md:18`).
5. **The candidate preserves the no-leak / forbidden-grain boundary** — no product / vendor / engine /
   deployment / credential / schema / migration / SQL / adapter / runtime grain is introduced
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
6. **The candidate does not select product / vendor / engine / deployment provider** — the canonical-store
   physical host remains **UNSELECTED**
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
7. **The candidate does not propose adapter / implementation / schema / migration / SQL / runtime
   wiring** — proposing a production adapter is the ADR-048C `M5` gate-#8-closure shape, reserved for a
   later lane (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

Therefore the candidate **may be selected only for a later evidence-authorization lane, not as gate #8
satisfaction.** The result is recorded against the three permitted decision results:

- **It is `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`** — the candidate is named
  at the accepted substrate-class grain, preserves every load-bearing constraint, and is carried forward
  **only** to a later evidence-authorization lane; this is recorded above.
- **It is *not* `SUBSTRATE_CLASS_HOST_CANDIDATE_NOT_SELECTED`** — a not-selected result would apply if the
  candidate contradicted Straylight semantic ownership, sibling non-canonical status, the no-leak /
  forbidden-grain boundary, or the accepted naming grain, or if no candidate could be named at
  substrate-class grain. None of those holds; the candidate is nameable and consistent.
- **It is *not* `PATCH_REQUIRED_CANDIDATE_RETRY_AMBIGUOUS`** — a patch result would apply if the retry
  were ambiguous, internally inconsistent, or impossible to record without amendment. The candidate and
  its boundary are unambiguous and bounded to substrate-class grain, so no patch is required.

> **Selection-for-evidence-authorization ≠ evidence pass ≠ gate #8 satisfaction.** Recording
> `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION` is the result of *this decision-retry
> gate only*. It selects no concrete host, proves no `P-2 … P-11` evidence, satisfies no gate, resolves
> no dependency, and authorizes no implementation. **Gate #8 remains OPEN / HELD.**

---

## 6. Selected next lane

> **Selected next lane: a docs-only `loa-straylight` canonical-store physical-host substrate-class
> *evidence-authorization / decomposition* gate.** It would define **what evidence is needed** for the
> selected substrate-class candidate `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` against
> `P-1 … P-11` (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`), taking
> this decision-retry artifact and the Phase 48V acceptance
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:291`) as inputs.

That next lane:

- **must not implement** — it defines required evidence; it does not produce it or wire anything;
- **must not select product / vendor / engine / deployment provider** — the canonical-store physical host
  stays **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **must not propose a production adapter** — proposing a production adapter is the ADR-048C `M5`
  gate-#8-closure shape, reserved for a still-later, separately-reviewed lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

**Not selected — and explicitly so:**

- A **direct route to implementation** is **not** selected — implementation authorization requires the
  gate-#8 trigger and is a separate, later lane
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).
- A **direct route to a production adapter** is **not** selected
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
- A **direct route to database / host selection** is **not** selected — the canonical-store physical host
  remains **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
- A **re-request of sibling evidence** is **not** selected — the sibling lanes have already returned, and
  duplicate evidence is not requested absent a later, separately-reviewed implementation lane creating new
  evidence (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:194`).

Any follow-on PR title must carry its phase label, e.g.
`Phase 48X: canonical-store physical-host substrate-class evidence-authorization gate` *(docs-only)*.

---

## 7. Explicit separation (candidate decision retry ≠ evidence authorization ≠ evidence pass ≠ gate #8 ≠ D.1 ≠ D.2 ≠ MVP-2)

Distinct, sequenced concerns are kept apart so this gate cannot be mistaken for any later one — the same
separation Phase 48V recorded
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:313`), advanced by one box:

1. **Candidate decision retry (the object of *this* gate).** Re-attempting the Phase 48Q candidate-decision
   question against `P-1 … P-11` at substrate-class grain and selecting the candidate for a later lane.
   Result: `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`. **Candidate decision retry
   is not evidence authorization.**
2. **Evidence authorization (separate, later).** A later docs-only lane that defines what evidence the
   selected candidate must carry against `P-1 … P-11`. **Not done here** — evidence authorization is not
   evidence pass.
3. **Evidence pass (separate, later).** Producing and accepting that evidence. **Not done here** — evidence
   pass is not gate #8 satisfaction unless separately accepted.
4. **Gate #8 satisfaction (separate, later).** Discharging gate #8 via the gate-#8 trigger (a *proposed
   production adapter* + the sibling-repo handoff citation + preserved ADR-022D invariants —
   `docs/decisions/ADR-022E-phase-22-deferred-features.md:57`). **Not done here** — gate #8 satisfaction is
   not D.1 satisfaction.
5. **D.1 satisfaction (separate, later).** Full D.1 holds only when both conjunct (i) and conjunct (ii)
   hold. **Not done here** — D.1 satisfaction is not D.2 start.
6. **D.2 start (separate, later).** Downstream of full D.1. **Not done here.**
7. **MVP-2 closure (separate, later).** Downstream of all of the above. **Not done here** — none of these
   closes MVP-2 in this artifact.

> These are strictly ordered: candidate decision retry precedes evidence authorization, which precedes
> evidence pass, which precedes gate #8 satisfaction, which precedes D.1 satisfaction, which precedes D.2
> start, none of which closes MVP-2 here. This gate occupies only the candidate-decision-retry box and
> crosses into none of the others.

---

## 8. Preserved blocked state

This gate preserves every held/open state unchanged:

- **Gate #8** remains **`OPEN / HELD`** — not discharged; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **Gate #9** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`;
  `docs/decisions/ADR-022E-phase-22-deferred-features.md:58`);
- **Gate #10** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`;
  `docs/decisions/ADR-022E-phase-22-deferred-features.md:59`);
- **D.1(ii)** remains **unresolved** until a later evidence-authorization / evidence pass / acceptance
  resolves it (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`);
- **D.1 is not satisfied** — conjunct (i) accepted + conjunct (ii) unresolved; D.1(i) is not reopened
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165`);
- **D.2 is not started** — downstream of full D.1
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167`);
- **MVP-2 remains open** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168`);
- **The concrete canonical-store physical host remains unselected** — owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

---

## 9. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
candidate decision-retry gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**;
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied (D.1(i) not reopened; D.1(ii) unresolved);
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **selects no concrete canonical-store physical host** — the host remains unselected;
- **selects no production database** — none is selected;
- **selects no product / vendor / engine / deployment provider** — none is selected;
- **names no product / vendor / engine host candidate** — none is named;
- **proposes no production adapter** — none is proposed here;
- **authorizes no implementation** of any kind;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring;
- introduces **no** vendor / product / database-engine / substrate name beyond the architecture-boundary /
  substrate-class grain the accepted answer itself supplies.

> Every notion above appears in this document only inside a negation. Selecting a substrate-class
> candidate for a later evidence-authorization lane is not passing any evidence, satisfying any gate,
> resolving any dependency, selecting any host, or authorizing any implementation.

---

## 10. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 48W — canonical-store physical-host candidate decision-retry gate (docs-only) |
| **Predecessor** | Phase 48V (merged) — accepted the recorded answer pair as sufficient input for this retry; recorded `UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`; selected this candidate decision-retry lane |
| **Decision result** | **`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`** — the substrate-class candidate is selected for a later evidence-authorization lane; not `SUBSTRATE_CLASS_HOST_CANDIDATE_NOT_SELECTED` (the candidate is nameable and consistent with every constraint); not `PATCH_REQUIRED_CANDIDATE_RETRY_AMBIGUOUS` (the retry is unambiguous and bounded to substrate-class grain) |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — a durable Straylight canonical-store substrate class; ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight`; architecture-boundary / substrate-class grain only |
| **`P-1 … P-11` posture** | `P-1` evaluable & satisfied at substrate-class grain (identity & ownership boundary); `P-2 … P-11` each **not proven here** — they name the evidence a later evidence-authorization lane must produce |
| **Sibling surfaces** | `loa-finn` / `loa-dixie` / `loa-hounfour` remain non-canonical participant surfaces only; future delegation needs explicit authority + reviewed evidence + a separate acceptance gate |
| **Gate #9 / #10 evidence** | both `PARTIAL_RECORDED`; both gates remain held |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only canonical-store physical-host substrate-class **evidence-authorization / decomposition** gate — defines what evidence the selected candidate must carry against `P-1 … P-11`; must not implement; must not select product / vendor / engine / deployment provider; must not propose a production adapter |
| **Not selected** | a direct route to implementation; a direct route to a production adapter; a direct route to database / host selection; reopening the sibling evidence lanes or the ADR-048C no-host decision; duplicate sibling-evidence requests (absent new evidence) |
| **Scope of this PR** | exactly one new docs file; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 11. Audit checklist

- [ ] **Single-file change.** The branch adds exactly one new file,
      `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md`, and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §8 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host
      chosen.
- [ ] **Scope explicit.** §2 records this is a retry after upstream answer acceptance, evaluates only a
      substrate-class candidate, selects no concrete host, selects no product / vendor / engine /
      deployment provider, proposes no production adapter, and authorizes no implementation.
- [ ] **Candidate bounded.** §3 names `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` at
      architecture-boundary / substrate-class grain only, with ownership boundary
      `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` and `loa-straylight` as semantic owner, and keeps
      siblings non-canonical.
- [ ] **`P-1 … P-11` bounded.** §4 records `P-1` evaluable at substrate-class grain and `P-2 … P-11` each
      "not proven here"; produces no proof matrix and no evidence.
- [ ] **Decision result conservative and explained.** §5 records
      `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION` and explains why it is not
      `SUBSTRATE_CLASS_HOST_CANDIDATE_NOT_SELECTED` and not `PATCH_REQUIRED_CANDIDATE_RETRY_AMBIGUOUS`.
- [ ] **Next lane bounded.** §6 selects a docs-only evidence-authorization / decomposition gate that must
      not implement, must not select product / vendor / engine / deployment provider, and must not propose
      a production adapter.
- [ ] **Separation explicit.** §7 keeps candidate decision retry, evidence authorization, evidence pass,
      gate #8 satisfaction, D.1 satisfaction, D.2 start, and MVP-2 closure distinct and ordered.
- [ ] **Gate citations real.** `ADR-022E:57` (#8), `:58` (#9), `:59` (#10) resolve to actual rows in
      `docs/decisions/ADR-022E-phase-22-deferred-features.md`.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, full-D.1
      satisfaction, D.2 commencement, MVP-2 closure, host selection, a named product / vendor / engine
      candidate, a proposed production adapter, or implementation authorization — each appears only inside
      a negation (§8, §9).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container/orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no
      sibling repo written to.

---

## 12. Source references

- [Phase 48V](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md) — accepted the
  recorded answer pair as sufficient input for this retry, recorded
  `UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY` (`:243`), recorded the accepted UQ-1
  (`:130`) and UQ-2 (`:196`) answers, bounded the host-candidate retry authorization against `P-1 … P-11`
  (`:291`), and selected this candidate decision-retry lane (`:313`). **Entry baseline.**
- [Phase 48U](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md) —
  recorded the UQ-1 answer (`:138`) and UQ-2 answer (`:139`) and classified the response as
  `AUTHORITY_ANSWER_PROVIDED_FOR_UQ_1_AND_UQ_2` (`:151`).
- [Phase 48T](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-REQUEST-GATE.md) — recorded
  `ARCHITECTURE_AUTHORITY_REQUEST_RECORDED` (`:287`).
- [Phase 48S](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-ANSWER-CANDIDATE-GATE.md) —
  recorded `NO_LOCAL_UPSTREAM_ANSWER_SUPPORTED` (`:227`) because local docs supply constraints, not answers
  (`:229`).
- [Phase 48R](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md) — framed UQ-1
  (`:99`) / UQ-2 (`:106`).
- [Phase 48Q](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md) — recorded
  `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` (`:112`) and routed UQ-1 / UQ-2 (`:162`) — the question this gate
  retries.
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed
  D.1(ii) into `P-1 … P-11` (`:142`) and pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — recorded the two
  sibling evidence results `PARTIAL_RECORDED` (`:86`) and the evidence-return routing `RECORDED` (`:88`);
  carries the held-state rows (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`) and the
  no-duplicate-evidence rule (`:194`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2
  UNSELECTED, owner "none" (`:156`); ownership does not follow location (`:221`); the S5 route-side row
  (`:159`); the `R1` evidence-required / owning-repo row (`:274`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — recorded the
  no-host decision (`:304`); the `M5` production-adapter-proposal shape (`:352`); the no-leak enumerated
  forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD),
  #9 (`:58`, HELD), #10 (`:59`, HELD). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — `InMemoryStorage` / `JsonlStorage`
  as the only MVP adapters (`:75`); the `StorageAdapter` swap-in seam (`:79`); the Phase-5 hardening
  invariants (`:111`); the receipt + audit-chain invariants any future host must preserve (`:171`).
- [ADR-026D](./decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md) — gate #8 remains held even
  for the narrow recall-intake slice (`:58`); authoritative tenant resolution at ingress (`:318`).
- [ADR-020A](./decisions/ADR-020A-straylight-semantic-owner.md) /
  [ADR-022A](./decisions/ADR-022A-straylight-semantic-home.md) — Straylight is the canonical semantic owner
  (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`;
  `docs/decisions/ADR-022A-straylight-semantic-home.md:62`).
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — the surfaces stay separable in code,
  test, and fixture (`:18`); Finn applies transitions through the wedge's `EstateStore`, never writing
  directly to storage (`:59`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge
  without teammate review (`:28`).
- **Cross-repo (read as evidence, NOT modified):** `loa-finn` PR #196 (result `PARTIAL`, gate #9 held);
  `loa-dixie` PR #204 (result `PARTIAL`, gate #10 held). Confirm in the owning repos.

---

*End of Phase 48W gate. Docs-only canonical-store physical-host candidate decision-retry gate. It retries
the Phase 48Q candidate-decision question using the Phase 48V-accepted upstream answers — UQ-1
`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` and UQ-2 `durable Straylight canonical-store substrate
class` — evaluating the candidate `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` against `P-1 … P-11`
at architecture-boundary / substrate-class grain, and records
`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION` (not
`SUBSTRATE_CLASS_HOST_CANDIDATE_NOT_SELECTED`, not `PATCH_REQUIRED_CANDIDATE_RETRY_AMBIGUOUS`). It selects a
docs-only canonical-store physical-host substrate-class evidence-authorization / decomposition gate as the
next step. The candidate decision retry is bounded to substrate-class grain: it claims no gate is
satisfied, discharges no gate, does not resolve D.1(ii), does not satisfy D.1, does not start D.2, does not
close MVP-2, selects no concrete host, selects no production database, names no product / vendor / engine /
deployment provider, proposes no production adapter, and authorizes no implementation. No commit, no push,
no PR.*
