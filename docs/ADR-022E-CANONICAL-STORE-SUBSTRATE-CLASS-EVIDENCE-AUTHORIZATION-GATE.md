# Phase 48X — ADR-022E Canonical-Store Substrate-Class Evidence-Authorization / Decomposition Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 48X** — docs-only **evidence-authorization / decomposition** gate for the
> canonical-store substrate-class candidate (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / evidence-authorization only.** Phase 48W **selected** the single
> architecture-boundary / substrate-class candidate `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`
> for a later evidence lane, recording
> **`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`**
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:170`), and selected this
> docs-only substrate-class evidence-authorization / decomposition gate as the next step
> (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:219`). This gate **authorizes
> a later evidence-result lane** for that selected candidate — it states **what evidence is needed** against
> the Phase 48P `P-1 … P-11` decomposition and ships a bounded evidence packet template the later
> evidence-result PR can fill. It **produces no evidence**, **claims no evidence pass**, selects **no**
> concrete physical host, names **no** product / vendor / engine / deployment provider, proposes **no**
> production adapter, and authorizes **no** implementation. The only change on this branch is **two** new
> Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer,
> schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR,
and is **not** numbered `ADR-048X` — following the live convention for the question / answer / request /
intake / acceptance / decision gates across the Phase 48 family (the immediate predecessor Phase 48W sits at
top-level `docs/` for the same reason). It records a bounded *evidence authorization* at architecture-boundary
/ substrate-class grain; it authorizes a later evidence-result lane and produces no evidence. The immediate
predecessor is **Phase 48W**
([`./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md`](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md)),
which selected the substrate-class candidate and recorded
`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:170`), named the candidate at
substrate-class grain (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`),
and selected exactly this docs-only evidence-authorization / decomposition lane as the next step
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:219`). Neither top-level `docs/`
nor `docs/decisions/` carries an ADR/packet register that enumerates this family, so none is created or
modified (verified by inspection).

This gate ships two files:

1. **This file** — the evidence-authorization / decomposition gate (the decision artifact).
2. **The evidence packet template / checklist**
   ([`./ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-PACKET-TEMPLATE.md))
   — a bounded template / checklist the later evidence-result PR copies and fills. It is **not** a decision
   artifact and carries **no** result of its own.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 48N** | **Merged** (`loa-straylight` PR #85). Recorded both sibling evidence results (`PARTIAL_RECORDED` ×2) and the evidence-return routing as `RECORDED`. | `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:86`; `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:88` |
| **Phase 48P** | **Merged** (`loa-straylight` PR #86). Decomposed D.1(ii) / gate #8 into `P-1 … P-11` and pinned the gate-#8-closure evidence shape at `P-11`. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152` |
| **Phase 48Q** | **Merged** (`loa-straylight` PR #87). Recorded **`NO_DECISION_UPSTREAM_QUESTION_REQUIRED`** and routed **UQ-1** / **UQ-2**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:112`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-GATE.md:162` |
| **Phase 48R** | **Merged** (`loa-straylight` PR #88). Framed **UQ-1** (S2 ownership / placement model) and **UQ-2** (the candidate-naming grain under no-leak). | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md:99`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-QUESTION-GATE.md:106` |
| **Phase 48S** | **Merged** (`loa-straylight` PR #89). Recorded **`NO_LOCAL_UPSTREAM_ANSWER_SUPPORTED`** — local docs supply constraints, not answers. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-ANSWER-CANDIDATE-GATE.md:227`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ARCHITECTURE-ANSWER-CANDIDATE-GATE.md:229` |
| **Phase 48T** | **Merged** (`loa-straylight` PR #90). Issued the bounded architecture-authority request and recorded **`ARCHITECTURE_AUTHORITY_REQUEST_RECORDED`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-REQUEST-GATE.md:287` |
| **Phase 48U** | **Merged** (`loa-straylight` PR #92). Recorded the UQ-1 / UQ-2 answer tokens and recorded **`AUTHORITY_ANSWER_PROVIDED_FOR_UQ_1_AND_UQ_2`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:151` |
| **Phase 48V** | **Merged** (`loa-straylight` PR #94). Accepted the recorded answer pair as sufficient input for the host-candidate retry and recorded **`UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY`**. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:243`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md:313` |
| **Phase 48W** | **Merged** (`loa-straylight` PR #95). Retried the candidate decision against `P-1 … P-11` at substrate-class grain, **selected** the candidate, and recorded **`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`**; selected this evidence-authorization lane. | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:170`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:219` |
| **Phase 48W result** | **`SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`** — the substrate-class candidate `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` is carried forward **only** to a later evidence-authorization lane. **Selection, not evidence.** | `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:170`; `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:345` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. Phase 48W's `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`
> classification is the entry baseline; this gate executes the evidence-authorization step it selected.

---

## 2. Candidate identity

The single candidate this gate authorizes a later evidence lane for is the one Phase 48W selected:

| Field | Value |
|-------|-------|
| **Candidate label** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:108`) |
| **Ownership boundary** | **`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`** (the UQ-1 accepted placement model — `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:138`) |
| **Semantic owner** | `loa-straylight` — permanent; ownership does not follow location (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`; `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:221`) |
| **Candidate grain** | architecture-boundary / substrate-class only — role / responsibility / required capability (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-ARCHITECTURE-AUTHORITY-RESPONSE-INTAKE-GATE.md:139`) |

**Candidate meaning.** `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` is a Straylight-owned durable
canonical-store substrate class for admitted estate records, audit / receipt persistence, tenant / actor /
estate isolation, and recall-readable canonical estate material. It is an architecture-boundary /
substrate-class candidate only. It is **not** a product, **not** a vendor, **not** an engine, **not** a
deployment provider, and **not** a database implementation. It is **not** a schema, migration, SQL design,
adapter implementation, runtime wiring, connection string, port, credential, account, region, topology, or
orchestration detail — those grains are the forbidden grain Phase 48V / 48W preserved
(`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).

**Sibling surfaces (non-canonical, preserved).** The siblings remain non-canonical participant surfaces only;
none owns the canonical estate record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`):

- `loa-finn` remains a **non-canonical** participant surface (runtime / execution; applies transitions through
  the wedge's `EstateStore`, never writing directly to storage — `docs/handoffs/finn-runtime-boundary.md:59`);
- `loa-dixie` remains a **non-canonical** participant surface (route-side ingress / control-plane —
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`);
- `loa-hounfour` remains a **non-canonical** participant surface (schema / validation / policy);
- future sibling delegation requires an explicit authority decision, reviewed evidence in the owning repo, and
  a separate acceptance gate — no sibling-repo PR may merge without teammate review
  (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 3. Authorization scope

> **This artifact authorizes a later evidence-result lane for the selected substrate-class candidate — and
> nothing more.** It states what evidence is needed against `P-1 … P-11` and ships a bounded evidence packet
> template. It does not produce that evidence and does not classify it.

The scope is bounded as follows:

1. **It authorizes later evidence-result work only.** It defines the evidence the later lane must produce and
   the inspectable shape that evidence must take (§4, §5, and the packet template).
2. **It does not produce evidence.** No `P-1 … P-11` evidence is generated, gathered, or attached here; this
   gate names requirements, not findings.
3. **It does not claim an evidence pass.** No P-row is proven, partially proven, or failed here; classification
   is reserved for the later evidence-result lane (§5).
4. **It does not select product / vendor / engine / deployment provider.** None is named; the canonical-store
   physical host remains **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
5. **It does not propose a production adapter.** Proposing a production adapter is the ADR-048C `M5`
   gate-#8-closure shape reserved for a still-later, separately-reviewed lane
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
6. **It does not authorize implementation.** No implementation of any kind is authorized; the `StorageAdapter`
   swap-in seam and the `InMemoryStorage` / `JsonlStorage` MVP adapters are unchanged
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:75`;
   `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

> This gate moves the corridor by exactly one box — from *substrate-class candidate selected* to *evidence
> authorized for that candidate* — and crosses into none of the later boxes (evidence pass, gate #8
> satisfaction, D.1 satisfaction, D.2 start, MVP-2 closure).

---

## 4. `P-1 … P-11` evidence requirements

Each row from the Phase 48P decomposition
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`) is given a **bounded
evidence requirement**: what the later evidence-result lane must *show* for the selected substrate-class
candidate. This is **not** a proof matrix, **not** an implementation design, and **not** a validator ledger —
no evidence is produced here, and no P-row is proven, partial, or failed.

| # | P-row (Phase 48P) | Evidence the later lane must show (no evidence produced here) |
|---|-------------------|--------------------------------------------------------------|
| P-1 | Candidate identity & ownership boundary | Evidence must show the candidate **remains substrate-class and Straylight-owned** — named as `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` with ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` and `loa-straylight` as semantic owner, without sliding to product / vendor / engine grain (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`; `docs/decisions/ADR-020A-straylight-semantic-owner.md:45`). |
| P-2 | Persistence durability expectations | Evidence must show **durable persistence obligations are defined at substrate-class grain** — durability, append-only / supersession semantics, and what "durable" must guarantee for the canonical record, consistent with the ADR-022D persistence posture and the `StorageAdapter` seam (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:143`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`). |
| P-3 | Tenant / actor / estate isolation | Evidence must show **isolation obligations are defined** — how the substrate class isolates per-`tenant`, per-`actor`, per-`estate` records, given that authoritative tenant resolution sits at Dixie ingress (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:144`; `docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:318`). |
| P-4 | Migration / schema ownership | Evidence must show **schema / migration details remain deferred and Straylight ownership preserved** — schema substrate is `loa-hounfour`'s, adoption is never automatic, and no schema / migration / SQL detail is decided at this grain (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:145`). |
| P-5 | Runtime writer boundary | Evidence must show **governed writer-boundary expectations** — who may write the canonical record at runtime and how that stays subordinate to S1; Finn runtime enforcement must not absorb or redefine canonical semantics (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:146`; `docs/handoffs/finn-runtime-boundary.md:59`). |
| P-6 | Read / recall boundary | Evidence must show **recall-readable canonical estate boundary expectations** — how recall reads the canonical record and where the route-side recall-intake slice stops; that narrow ingress slice is not a durable canonical-store host (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:147`; `docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md:58`). |
| P-7 | Audit / receipt persistence | Evidence must show **audit and receipt persistence obligations** — how the audit chain and the six receipt categories persist, and that no host re-mints receipts (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:148`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:171`). |
| P-8 | Failure / rollback / recovery | Evidence must show **recovery obligations** — failure modes, rollback, and recovery the substrate class must support without breaking the audit chain, implicit in the `StorageAdapter` seam-preservation requirement (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:149`). |
| P-9 | Permission / auth / signer authority | Evidence must show **permission / auth / signer expectations** — who holds signer / keyring / permission authority over canonical writes, with the host never becoming the de-facto authority (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:150`; `docs/decisions/ADR-022A-straylight-semantic-home.md:62`). |
| P-10 | No-leak / public-private projection | Evidence must show the **forbidden-grain and no-leak boundaries are preserved** — challenged / revoked / private material is never surfaced as usable, and the Phase-5 hardening invariants are inherited (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:151`; `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:111`). |
| P-11 | Test / evidence shape | Evidence must **define an inspectable evidence shape without implementation** — the concrete, checkable shape a future host-selection proposal must carry (the gate-#8-closure shape — a *proposed production adapter* + the sibling-repo handoff citation — is pinned at Phase 48P `P-11` and is a separate, later lane, not produced here) (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:152`; `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`). |

> None of `P-1 … P-11` is produced, proven, partial, or failed here. Each row names the evidence the later
> evidence-result lane must show. Authorizing that lane is **not** producing any of the evidence and **not**
> classifying it.

---

## 5. Evidence-result boundary

The later evidence-result lane is the only place an evidence classification may be recorded. This gate fixes
its boundary so it cannot drift into a host selection, an adapter proposal, or implementation:

1. **The later evidence result may classify evidence** as pass / partial / fail (the placeholders defined in
   the packet template — `./ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-PACKET-TEMPLATE.md`), **but this
   artifact must not** — this gate authorizes; it does not classify.
2. **The later result must still not implement.** Classifying evidence is a docs-only act; it produces no
   source, test, runtime, config, schema, migration, SQL, or production wiring.
3. **The later result must not select product / vendor / engine / deployment provider** unless that selection
   is *separately authorized* in a still-later lane — the canonical-store physical host remains **UNSELECTED**
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
4. **A pass result is not gate #8 satisfaction.** Even a full evidence pass does not discharge gate #8;
   discharging gate #8 requires the gate-#8 trigger — a *proposed production adapter* + the sibling-repo
   handoff citation + preserved ADR-022D invariants — which is a separate, later, separately-reviewed lane
   (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
   `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

---

## 6. Decision rationale

The authorization is recorded against the three permitted decision results for this gate, and the
conservative-but-accurate result is **`SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED`**:

1. **A candidate has been selected at the accepted grain.** Phase 48W recorded
   `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION` for
   `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`
   (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:170`), so there is a named
   object for which evidence requirements can be authorized.
2. **The evidence requirements are nameable against an existing decomposition.** `P-1 … P-11` already exist
   from Phase 48P (`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`); §4
   attaches a bounded evidence requirement to each without inventing new structure.
3. **The authorization preserves every load-bearing constraint** — Straylight semantic authority
   (`docs/decisions/ADR-020A-straylight-semantic-owner.md:45`), sibling non-canonical status
   (`docs/handoffs/finn-runtime-boundary.md:18`), and the no-leak / forbidden-grain boundary
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`).
4. **The authorization selects no host, names no product / vendor / engine / deployment provider, proposes no
   adapter, and authorizes no implementation** — the host stays **UNSELECTED**
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

The result is recorded against the three permitted decision results:

- **It is `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED`** — a selected candidate exists, the evidence requirements are
  nameable against `P-1 … P-11`, every constraint is preserved, and a bounded packet template is shipped for
  the later evidence-result lane; this is recorded above.
- **It is *not* `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZATION_HELD`** — a held result would apply if no candidate had
  been selected, if the `P-1 … P-11` decomposition were missing, or if a load-bearing constraint blocked even
  naming evidence requirements. None of those holds: the candidate is selected and the decomposition exists.
- **It is *not* `PATCH_REQUIRED_EVIDENCE_AUTHORIZATION_AMBIGUOUS`** — a patch result would apply if the
  authorization were ambiguous, internally inconsistent, or impossible to record without amendment. The
  authorization and its boundary are unambiguous and bounded to substrate-class grain, so no patch is required.

> **Evidence-authorized ≠ evidence produced ≠ evidence pass ≠ gate #8 satisfaction.** Recording
> `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED` is the result of *this evidence-authorization gate only*. It produces
> no evidence, proves no `P-1 … P-11` row, classifies nothing, satisfies no gate, resolves no dependency,
> selects no host, and authorizes no implementation. **Gate #8 remains OPEN / HELD.**

---

## 7. Selected next lane

> **Selected next lane: a docs-only `loa-straylight` substrate-class *evidence-result* gate that uses the
> evidence packet template shipped in this PR.** It would copy
> [`./ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-PACKET-TEMPLATE.md`](./ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-PACKET-TEMPLATE.md),
> fill each `P-1 … P-11` evidence field for `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`, and record an
> evidence classification (pass / partial / fail) against the placeholders the template defines.

That next lane:

- **must not implement** — it classifies evidence against the authorized requirements; it does not produce
  code or wire anything;
- **must not select product / vendor / engine / deployment provider** — the canonical-store physical host
  stays **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **must not propose a production adapter** — proposing a production adapter is the ADR-048C `M5`
  gate-#8-closure shape, reserved for a still-later, separately-reviewed lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

**Not selected — and explicitly so:**

- A **direct route to implementation** is **not** selected — implementation authorization requires the gate-#8
  trigger and is a separate, later lane (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`).
- A **direct route to a production adapter** is **not** selected
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).
- A **direct route to database / host selection** is **not** selected — the canonical-store physical host
  remains **UNSELECTED** (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
- A **re-request of sibling evidence** is **not** selected — the sibling lanes have already returned, and
  duplicate evidence is not requested absent a later, separately-reviewed implementation lane creating new
  evidence (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:194`).

Any follow-on PR title must carry its phase label, e.g.
`Phase 48Y: canonical-store substrate-class evidence-result gate` *(docs-only)*.

---

## 8. Explicit separation (evidence authorization ≠ evidence pass ≠ gate #8 ≠ D.1 ≠ D.2 ≠ MVP-2)

Distinct, sequenced concerns are kept apart so this gate cannot be mistaken for any later one — the same
separation Phase 48W recorded
(`docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md:219`), advanced by one box:

1. **Evidence authorization (the object of *this* gate).** Stating what evidence the selected candidate must
   carry against `P-1 … P-11` and shipping a bounded packet template. Result:
   `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED`. **Evidence authorization is not evidence pass.**
2. **Evidence result (separate, later).** A later docs-only lane fills the packet and classifies the evidence
   as pass / partial / fail. **Not done here.**
3. **Evidence pass acceptance (separate, later).** Accepting a pass classification. **Not done here** — an
   accepted pass is not gate #8 satisfaction unless separately discharged via the trigger.
4. **Gate #8 satisfaction (separate, later).** Discharging gate #8 via the gate-#8 trigger
   (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`). **Not done here** — gate #8 satisfaction is
   not D.1 satisfaction.
5. **D.1 satisfaction (separate, later).** Full D.1 holds only when both conjunct (i) and conjunct (ii) hold.
   **Not done here** — D.1 satisfaction is not D.2 start.
6. **D.2 start (separate, later).** Downstream of full D.1. **Not done here.**
7. **MVP-2 closure (separate, later).** Downstream of all of the above. **Not done here** — none of these
   closes MVP-2 in this artifact.

> These are strictly ordered: evidence authorization precedes the evidence result, which precedes evidence
> pass acceptance, which precedes gate #8 satisfaction, which precedes D.1 satisfaction, which precedes D.2
> start, none of which closes MVP-2 here. This gate occupies only the evidence-authorization box and crosses
> into none of the others.

---

## 9. Preserved blocked state

This gate preserves every held/open state unchanged:

- **Gate #8** remains **`OPEN / HELD`** — not discharged; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **Gate #9** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`;
  `docs/decisions/ADR-022E-phase-22-deferred-features.md:58`);
- **Gate #10** remains held with **`PARTIAL_RECORDED`** — the gate itself unsatisfied
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`;
  `docs/decisions/ADR-022E-phase-22-deferred-features.md:59`);
- **D.1(ii)** remains **unresolved** until a later evidence pass / acceptance resolves it
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`);
- **D.1 is not satisfied** — conjunct (i) accepted + conjunct (ii) unresolved; D.1(i) is not reopened
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165`);
- **D.2 is not started** — downstream of full D.1
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167`);
- **MVP-2 remains open** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168`);
- **The concrete canonical-store physical host remains unselected** — owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

---

## 10. Preserved non-claims

Each item below is preserved as a **negation**, so a reviewer can refuse scope creep at the gate. This
evidence-authorization gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**;
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not produce** any `P-1 … P-11` evidence;
- **does not claim** an evidence pass — no P-row is proven, partial, or failed here;
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

> Every notion above appears in this document only inside a negation. Authorizing an evidence-result lane for
> a substrate-class candidate is not producing any evidence, passing any evidence, satisfying any gate,
> resolving any dependency, selecting any host, or authorizing any implementation.

---

## 11. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 48X — canonical-store substrate-class evidence-authorization / decomposition gate (docs-only) |
| **Predecessor** | Phase 48W (merged) — selected the substrate-class candidate; recorded `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`; selected this evidence-authorization lane |
| **Decision result** | **`SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED`** — a later evidence-result lane is authorized for the selected candidate; not `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZATION_HELD` (a candidate is selected and the `P-1 … P-11` decomposition exists); not `PATCH_REQUIRED_EVIDENCE_AUTHORIZATION_AMBIGUOUS` (the authorization is unambiguous and bounded) |
| **Candidate** | **`STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`** — a durable Straylight canonical-store substrate class; ownership boundary `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`; semantic owner `loa-straylight`; architecture-boundary / substrate-class grain only |
| **`P-1 … P-11` requirements** | §4 attaches a bounded evidence requirement to each P-row; no evidence is produced and no row is classified |
| **Evidence packet template** | shipped as the second file in this PR; the later evidence-result lane copies and fills it |
| **Sibling surfaces** | `loa-finn` / `loa-dixie` / `loa-hounfour` remain non-canonical participant surfaces only; future delegation needs explicit authority + reviewed evidence + a separate acceptance gate |
| **Gate #9 / #10 evidence** | both `PARTIAL_RECORDED`; both gates remain held |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no product / vendor / engine / deployment provider named; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only substrate-class **evidence-result** gate that copies and fills the evidence packet template; must not implement; must not select product / vendor / engine / deployment provider; must not propose a production adapter |
| **Not selected** | a direct route to implementation; a direct route to a production adapter; a direct route to database / host selection; reopening the sibling evidence lanes or the ADR-048C no-host decision; duplicate sibling-evidence requests (absent new evidence) |
| **Scope of this PR** | exactly two new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 12. Audit checklist

- [ ] **Two-file change.** The branch adds exactly two new files,
      `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-AUTHORIZATION-GATE.md` and
      `docs/ADR-022E-CANONICAL-STORE-SUBSTRATE-CLASS-EVIDENCE-PACKET-TEMPLATE.md`, and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §9 keep gate #8 OPEN / HELD; gates #9 / #10 held
      (`PARTIAL_RECORDED`); D.1(ii) unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Scope explicit.** §3 records this authorizes later evidence-result work only, produces no evidence,
      claims no pass, selects no product / vendor / engine / deployment provider, proposes no production
      adapter, and authorizes no implementation.
- [ ] **Candidate bounded.** §2 names `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS` at
      architecture-boundary / substrate-class grain only, with ownership boundary
      `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` and `loa-straylight` as semantic owner, and keeps
      siblings non-canonical.
- [ ] **`P-1 … P-11` bounded.** §4 attaches a bounded *evidence requirement* to each P-row; produces no proof
      matrix, no validator ledger, and no evidence.
- [ ] **Evidence-result boundary fixed.** §5 reserves classification for the later lane and forbids it here;
      bars host selection, adapter proposal, and implementation in the later lane.
- [ ] **Decision result conservative and explained.** §6 records `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED` and
      explains why it is not `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZATION_HELD` and not
      `PATCH_REQUIRED_EVIDENCE_AUTHORIZATION_AMBIGUOUS`.
- [ ] **Next lane bounded.** §7 selects a docs-only evidence-result gate that copies the packet template, must
      not implement, must not select product / vendor / engine / deployment provider, and must not propose a
      production adapter.
- [ ] **Separation explicit.** §8 keeps evidence authorization, evidence result, evidence pass, gate #8
      satisfaction, D.1 satisfaction, D.2 start, and MVP-2 closure distinct and ordered.
- [ ] **Gate citations real.** `ADR-022E:57` (#8), `:58` (#9), `:59` (#10) resolve to actual rows in
      `docs/decisions/ADR-022E-phase-22-deferred-features.md`.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, full-D.1 satisfaction,
      D.2 commencement, MVP-2 closure, host selection, a named product / vendor / engine candidate, a proposed
      production adapter, an evidence pass, or implementation authorization — each appears only inside a
      negation (§9, §10).
- [ ] **No product leak.** No connection string, port, credential, database-engine product name, or
      container / orchestration detail appears outside the no-leak / forbidden-grain restatement.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no
      sibling repo written to.

---

## 13. Source references

- [Phase 48W](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-CANDIDATE-DECISION-RETRY-GATE.md) — selected the
  substrate-class candidate, recorded `SUBSTRATE_CLASS_HOST_CANDIDATE_SELECTED_FOR_EVIDENCE_AUTHORIZATION`
  (`:170`), named the candidate at substrate-class grain (`:108`), recorded the `P-1 … P-11` retry posture
  (`:148`), and selected this evidence-authorization lane (`:219`, `:345`). **Entry baseline.**
- [Phase 48V](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-UPSTREAM-ANSWER-ACCEPTANCE-GATE.md) — accepted the
  recorded answer pair and recorded `UPSTREAM_ARCHITECTURE_ANSWER_ACCEPTED_FOR_HOST_CANDIDATE_RETRY` (`:243`);
  accepted UQ-1 (`:130`) and the naming grain (`:196`); selected the Phase 48W lane (`:313`).
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
  `NO_DECISION_UPSTREAM_QUESTION_REQUIRED` (`:112`) and routed UQ-1 / UQ-2 (`:162`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — decomposed D.1(ii)
  into `P-1 … P-11` (`:142`) and pinned the gate-#8-closure evidence shape at `P-11` (`:152`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — recorded the two
  sibling evidence results `PARTIAL_RECORDED` (`:86`) and the evidence-return routing `RECORDED` (`:88`);
  carries the held-state rows (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`) and the no-duplicate-evidence
  rule (`:194`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); ownership does not follow location (`:221`); the S5 route-side row (`:159`); the `R1`
  evidence-required / owning-repo row (`:274`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — recorded the no-host
  decision (`:304`); the `M5` production-adapter-proposal shape (`:352`); the no-leak enumerated
  forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD), #9
  (`:58`, HELD), #10 (`:59`, HELD). Read read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — `InMemoryStorage` as the MVP default
  (`:75`); the `StorageAdapter` swap-in seam (`:79`); the persistence/exposure-surface framing (`:106`); the
  Phase-5 hardening invariants (`:111`); the receipt + audit-chain invariants any future host must preserve
  (`:171`).
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

*End of Phase 48X gate. Docs-only canonical-store substrate-class evidence-authorization / decomposition gate.
It takes the Phase 48W-selected candidate `STRAYLIGHT_DURABLE_CANONICAL_STORE_SUBSTRATE_CLASS`, attaches a
bounded evidence requirement to each Phase 48P `P-1 … P-11` row, ships a bounded evidence packet template the
later evidence-result PR can fill, and records `SUBSTRATE_CLASS_EVIDENCE_AUTHORIZED` (not
`SUBSTRATE_CLASS_EVIDENCE_AUTHORIZATION_HELD`, not `PATCH_REQUIRED_EVIDENCE_AUTHORIZATION_AMBIGUOUS`). It
selects a docs-only substrate-class evidence-result gate as the next step. The evidence authorization is
bounded to substrate-class grain: it produces no evidence, claims no evidence pass, claims no gate is
satisfied, discharges no gate, does not resolve D.1(ii), does not satisfy D.1, does not start D.2, does not
close MVP-2, selects no concrete host, selects no production database, names no product / vendor / engine /
deployment provider, proposes no production adapter, and authorizes no implementation. No commit, no push, no
PR.*
