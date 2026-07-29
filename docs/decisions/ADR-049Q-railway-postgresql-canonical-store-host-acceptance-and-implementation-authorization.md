# ADR-049Q — Phase 49Q: Railway PostgreSQL canonical-store host acceptance and bounded implementation authorization

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive and
> canonical-store **semantic owner**.
> **Phase**: **Phase 49Q** — the ADR-049 §10 step 4 **PR B: Railway acceptance
> and implementation-authorization ADR**
> (`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:484`).
> **Tier**: **Tier 1** — reversible infrastructure and implementation choice
> (`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:225`,
> `:235`).
> **Type**: docs-only decision ADR. This branch changes exactly four Markdown
> paths and adds exactly one new file — this one. No source, test, schema,
> migration, SQL, config, package, lockfile, script, workflow, control-plane,
> `.claude`, `.loa`, `.run`, grimoire, or sibling-repository path is touched.
> **Status**: **Proposed — pending operator signature.** Every decision in §6
> becomes effective **only if** `operator:eileen` authorizes the merge of this
> audited pull request. Until that merge, ADR-022E gate #8 remains
> **OPEN / HELD**, D.1(ii) remains **UNRESOLVED**, full D.1 remains **NOT
> SATISFIED**, D.2 remains **NOT STARTED**, and every state in §18 stands as
> recorded (`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:498`–`:506`).
> **Result token**:
> **`RAILWAY_POSTGRESQL_CANONICAL_STORE_HOST_ACCEPTANCE_AND_BOUNDED_PHASE_50A_AUTHORIZATION_PROPOSED_PENDING_OPERATOR_MERGE`**

---

## Naming note (preface)

The ADR number tracks the phase that produced it, and the slug is
lowercase-kebab — the live `docs/decisions/` convention (`ADR-048B` = Phase 48B,
`ADR-049` = the ADR-049 governance record). This document is therefore
`ADR-049Q-…` for Phase 49Q. `docs/decisions/` carries no index or register file,
so none is created or modified.

---

## 1. What becomes effective only on operator merge

This document is drafted by Claude under the ADR-049 §7 drafting role
(`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:342`) and
inside the ADR-050 shadow-mode control plane
(`docs/decisions/ADR-050-autonomous-execution-control-plane.md:158`). Neither the
drafting, nor the lane activation, nor the opening of this pull request, nor an
independent Codex `ACCEPT`, nor recorded merge *eligibility* is an operator
signature, and none of them makes any decision in §6 effective.

**`operator:eileen` is the sole Straylight product, roadmap, semantic,
architectural, acceptance, gate-disposition, and MVP-completion authority**
(`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:312`;
`docs/decisions/ADR-050-autonomous-execution-control-plane.md:143`). There is no
standing delegation
(`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:338`). Codex
is explicitly **not** an acceptance authority: an `ACCEPT` feeds merge
eligibility only, and only the operator merges
(`docs/decisions/ADR-050-autonomous-execution-control-plane.md:164`).

Two truths are recorded together, as ADR-049 itself records them for its own
status: the §6 decision content is what the operator is being asked to sign, and
the document becomes durable, citable repository governance **only** on
operator-authorized merge. Until then this ADR is a proposal, and every §18
state holds unchanged.

---

## 2. Authority basis and source hierarchy

In descending authority, as required by
[`../product-context/source-hierarchy.md`](../product-context/source-hierarchy.md):

1. **Operator decisions and doctrine.** ADR-049 §6 sole authority (`:312`);
   ADR-049 §9 Railway direction pending intake (`:425`–`:439`); ADR-049 §9.1
   required acceptance clauses (`:442`–`:459`); ADR-049 §9.2 corridor
   compression (`:461`–`:470`); ADR-049 §10 step 4 PR B (`:484`–`:492`);
   ADR-049 §5 Tier-1 process (`:225`–`:235`).
2. **Local decision-locks.** The ADR-022E gate inventory — gate #8
   (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`), gate #9
   (`:58`), gate #10 (`:59`); ADR-022D receipt and audit-chain invariants and
   the `StorageAdapter` swap-in seam
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`, `:106`–`:107`,
   `:115`–`:120`, `:170`–`:174`); ADR-048B surfaces S1/S2, the D.1 decomposition,
   and evidence requirement R1
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:155`,
   `:156`, `:108`–`:113`, `:129`–`:132`, `:274`), the R1–R8 evidence bar
   (`:274`–`:281`), the §9 closure-readiness criteria (`:293`–`:307`), and the
   §11 non-authorization list (`:362`–`:379`).
3. **Merged Phase 49P intake (immediate predecessor — authority for what the
   sibling evidence establishes and for the P-1…P-14 obligations).**
   [`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md`](../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md),
   merged as `loa-straylight` PR **#119** at
   `77030a93ec2dddef5a96a7a7e047a009043252d5` — this lane's exact base SHA.
4. **Control-plane mandate.** ADR-050 §2 authorized corridor names Phase 49Q as
   "Railway host acceptance, ADR-022E gate #8 disposition, and bounded D.2
   authorization" (`docs/decisions/ADR-050-autonomous-execution-control-plane.md:89`–`:90`),
   encoded machine-readably in
   [`../../.straylight/automation-policy.json`](../../.straylight/automation-policy.json).
5. **Bounded sibling evidence (evidence, NOT authority).** Finn PR #258 at
   `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` and Dixie PR #255 at
   `d36c0846f03bfd097d35dd2c001de19eec817cf0`, read read-only at those exact
   commits (§4). Sibling repositories supply evidence; no participant converts
   evidence into acceptance
   (`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:342`).

> **Evidence-bound rule.** Every repository fact in this ADR cites a
> `loa-straylight` `file:line`, or is explicitly labeled bounded sibling
> evidence at its binding SHA. **No provider-side operational fact is asserted
> anywhere in this document** (§12).

---

## 3. What this ADR does and does not do

On operator-authorized merge, this ADR:

1. accepts Railway PostgreSQL as the **bounded, reversible MVP-2
   canonical-store physical host** (§6.1);
2. reaffirms `loa-straylight` as the **permanent** canonical semantic owner
   (§6.2);
3. discharges ADR-022E gate #8 **only** for bounded host selection and for
   opening the provider-neutral durable-storage implementation lane (§6.3, §8);
4. keeps D.1(i) accepted, **resolves D.1(ii)**, records **full D.1 satisfied**,
   and authorizes **D.2 to start** in Phase 50A without claiming it complete
   (§6.4, §7);
5. keeps **MVP-2 OPEN** (§6.5);
6. keeps gates **#9 and #10 HELD at `PARTIAL_RECORDED`**, preserves Finn's
   `TIER_TRUST_MAP` and `CRITICAL_ACTIONS` findings **UNRESOLVED**, and defers
   any Dixie boundary requirement until a substrate contract exists (§6.6–§6.8);
7. authorizes a **bounded Phase 50A** capability scope under a later exact task
   packet (§13), and fixes the **Phase 50B** boundary (§14);
8. carries all ten ADR-049 §9.1 clauses (§9) and all fourteen Phase 49P
   P-1…P-14 obligations (§10) forward as enforceable conditions;
9. records the provider-portability contract (§11), the mandatory
   pre-production proof obligations (§12), and the rollback / reopening triggers
   (§15).

This ADR does **not**:

- implement, design, sketch, or specify any adapter interface, code, SQL,
  schema, migration, fixture, test, configuration, or deployment artifact;
- provision, configure, access, or mutate Railway or any external
  infrastructure, or use any credential, secret, connection string, endpoint,
  account or project identifier, region, port, or topology detail;
- authorize production admission, production estate writes, production migration
  execution, production rollout, cutover, or living-estate admission;
- authorize or implement auth, consent, signer, controller-binding,
  identity-mutation, challenge, revocation, forgetting, inheritance, commitment,
  or permanence semantics;
- close gate #9 or gate #10, resolve Finn's two locally-defined-classification
  findings, impose a new Dixie substrate contract, modify a sibling repository,
  or transfer any semantic authority;
- close MVP-2, claim D.2 complete, claim Phase 50A or Phase 50B complete, or
  progress beyond MVP-2;
- make Railway a permanent architectural dependency, embed any provider-specific
  concept in the estate domain model or in canonical migration semantics, or
  define a Railway-specific adapter contract;
- create a Tier-2 cross-repository contract or a Tier-3 estate-semantic
  decision;
- create any new Straylight authority, or treat Claude, Codex, Flatline,
  Bridgebuilder, ChatGPT, GitHub labels, an audit verdict, the control plane, or
  a sibling maintainer as an authority;
- merge itself.

---

## 4. Evidence appendix — exact bound artifacts

Every evidentiary claim in this ADR is bound to one of the commits below. All
were read read-only; none was modified.

### 4.1 Straylight (this repository, at this lane's exact base SHA)

| Artifact | Binding | What it supplies |
|---|---|---|
| `loa-straylight` PR **#119**, merge commit `77030a93ec2dddef5a96a7a7e047a009043252d5` | this lane's base SHA | The merged Phase 49P intake: the ADR-049 §10 step 3 **PR A** |
| [`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md`](../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md) | `:16`, `:62`–`:63`, `:196`, `:320`, `:324`, `:351`–`:364`, `:404`, `:416`, `:516` | Sibling evidence binding; the two carried-forward Finn findings; blockers B-1/B-2 closed with gates held; the fourteen P-1…P-14 obligations; routing of acceptance and implementation authorization to this lane |
| [`ADR-049`](./ADR-049-six-mvp-product-roadmap-and-governance.md) | `:225`, `:235`, `:312`, `:338`, `:342`, `:404`–`:410`, `:425`–`:439`, `:442`–`:459`, `:461`–`:470`, `:474`–`:494`, `:498`–`:506` | Tier-1 classification; sole authority; Railway direction pending intake; the ten §9.1 clauses; corridor compression; the operational sequence; preserved state |
| [`ADR-050`](./ADR-050-autonomous-execution-control-plane.md) | `:89`–`:90`, `:143`, `:158`, `:164`, `:446` | The Phase 49Q corridor mandate; sole authority preserved; the implementer and auditor boundaries; ADR-050's own no-gate-advance posture |
| [`ADR-048B`](./ADR-048B-canonical-store-physical-host-ownership-routing.md) | `:108`–`:113`, `:129`–`:132`, `:155`, `:156`, `:274`–`:281`, `:293`–`:307`, `:362`–`:379` | D.1 conjunct decomposition; the D.1 → D.2 sequencing rule; S1 permanent semantic ownership; S2 physical host unselected; the R1–R8 evidence bar; the §9 closure-readiness criteria; the §11 non-authorization list |
| [`ADR-022E`](./ADR-022E-phase-22-deferred-features.md) | `:57`, `:58`, `:59` | The gate #8 trigger; the gate #9 and gate #10 triggers |
| [`ADR-022D`](./ADR-022D-mvp-persistence-and-audit-owner.md) | `:79`, `:97`–`:99`, `:106`–`:107`, `:115`–`:120`, `:170`–`:174` | The `StorageAdapter` swap-in seam; the authorized-runtime role; host-is-not-semantic-owner; the invariants a host inherits; no re-minting |
| [`ADR-048C`](./ADR-048C-host-selection-candidate-matrix-no-host-decision.md) | `:352` | `M5`: the gate #8 trigger requires a proposed production adapter |
| [Phase 48N intake completion gate](../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) | `:157`, `:159`, `:161`, `:163`, `:165`, `:167`, `:168`, `:169` | The prior held/open corridor state this ADR transitions from |
| [Phase 48L owner-response intake completion gate](../ADR-022E-SIBLING-GATE-9-10-OWNER-RESPONSE-INTAKE-COMPLETION-GATE.md) | `:94`, `:113` | Both sibling owner responses recorded `ACCEPT_RECORDED` with routing `RECORDED`; and that a recorded ACCEPT is **not** gate satisfaction (ADR-048B R2) |
| [Phase 49I residual blockers gate](../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md) | `:58`–`:68` | Blockers B-1…B-11 |
| `src/straylight/storage/types.ts` | `:4`–`:13`, `:33` | The recorded adapter semantics and the unchanged `StorageAdapter` interface |
| `src/straylight/storage/jsonl.ts` | `:15`–`:20` | Single-writer, single-host MVP adapter; multi-process safety not guaranteed |
| `src/straylight/audit.ts` | `:31`, `:75`–`:88` | Per-estate chaining from the stored tail; `verifyChain` and its quarantine rationale |
| `tests/phase-5-hardening.test.ts` | `:50`, `:93`, `:123`, `:159`, `:326` | Fail-closed invariants and tampered-chain detection |

### 4.2 Bounded sibling evidence (read read-only at the binding SHAs; not modified)

| Counterparty | Gate | PR | Binding SHA | Artifacts (sibling-repo paths) |
|---|---|---|---|---|
| `0xHoneyJar/loa-finn` | #9 | [#258](https://github.com/0xHoneyJar/loa-finn/pull/258) | `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` | `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md` (§2, §3.1–§3.8, §4); `docs/ADR-022E-GATE-9-FINN-RUNTIME-BOUNDARY-EVIDENCE.md` (§3.1–§3.6, §4–§7); `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md` (§2–§4) |
| `0xHoneyJar/loa-dixie` | #10 | [#255](https://github.com/0xHoneyJar/loa-dixie/pull/255) | `d36c0846f03bfd097d35dd2c001de19eec817cf0` | `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md` (§3, §4.1–§4.8, §5); `docs/ADR-022E-GATE-10-DIXIE-BOUNDARY-EVIDENCE.md` (§5–§8); `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md` (§3, §4) |

Sibling citations are by document and section at the binding SHA, because both
sibling evidence documents state that their internal line numbers are anchors
rather than immutable coordinates (Finn boundary evidence §2; Dixie boundary
evidence §3).

**What the sibling evidence establishes, at its own grain.** Finn proves a
host-agnostic, feature-flagged, fail-closed PostgreSQL integration path with
schema-namespace isolation and a WAL-first durability posture, under its own
recorded qualifications — boot validation covers three base tables only; the
seam has two client-construction points; "independent of PostgreSQL" is a
storage-dependency claim, not a boot-sequence claim (Finn boundary evidence
§3.1–§3.3). Dixie proves a default-off, env-gated, reference-carrying boundary
with zero local canonical-primitive definitions, type-only canonical imports,
and test-enforced isolation from its own production DB paths (Dixie boundary
evidence §5). **Both state that provider operational properties are
unverifiable from their repositories** (Finn §4; Dixie §6.2), and both defer
candidate acceptance, host selection, the substrate contract, and gate #8
disposition to Straylight (Finn §5, §7; Dixie §7). Neither claims any gate is
satisfied; each explicitly disclaims host selection, adapter proposal, and
implementation authorization (Finn rollup §3; Dixie rollup §4).

---

## 5. Evidence versus operator acceptance

The distinction ADR-049 §7 draws, applied here without slippage:

| Step | Who | What it is | What it is not |
|---|---|---|---|
| Sibling evidence responses (Finn #258, Dixie #255) | sibling owners | bounded, merged evidence at exact SHAs | acceptance, gate satisfaction, host selection |
| Phase 49P intake (PR #119) | Straylight, drafted by Claude | intake of that evidence + the P-1…P-14 standard | acceptance of any provider; no gate moved |
| **This ADR as drafted and audited** | Claude drafts, Codex audits | a bounded proposal and an audit verdict | **not** an operator decision; **not** effective |
| **Operator-authorized merge of this ADR** | `operator:eileen` | the acceptance event; §6 becomes effective | not a production-admission authorization (§12, §13) |
| Phase 50A implementation | later, under an exact task packet | bounded capability work (§13) | not MVP-2 closure; not production admission |
| Phase 50B independent proof acceptance | later operator decision | MVP-2 acceptance preparation (§14) | not performed or prejudged here |

Phase 49P §5.3 recorded the load-bearing asymmetry once, and it holds in the
mirror direction too: **closing an evidence-supply blocker is not closing the
gate that blocker sat behind**
(`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:324`), and
resolving the host dependency is not closing the sibling gates that externally
held it (§7.2).

---

## 6. Decision — effective only on operator-authorized merge

### 6.1 Railway PostgreSQL is accepted as the bounded, reversible MVP-2 canonical-store physical host

Railway PostgreSQL is **accepted** as the physical host for the MVP-2
canonical store — the durable persistence substrate for the canonical
`Assertion` / `EstateTransition` / `TransitionReceipt` / `AuditEvent` records
and the supersession relation (ADR-048B surface S2,
`./ADR-048B-canonical-store-physical-host-ownership-routing.md:156`). This
completes the ADR-049 §9 "selected direction, pending intake" (`:427`) into an
accepted selection, on the strength of the merged Phase 49P intake.

The acceptance is **bounded and reversible** by construction:

- it is a **Tier 1** reversible-infrastructure decision, not a semantic one
  (`./ADR-049-six-mvp-product-roadmap-and-governance.md:225`, `:235`);
- Railway is **not** the Straylight product boundary, **not** a Straylight
  architectural dependency, **not** a term in the estate domain model, and
  **not** the semantic owner of any estate;
- the accepted host holds bytes under the §11 portability contract and the §10
  obligations, and holds nothing else;
- the decision **reopens** on the §15 triggers.

### 6.2 `loa-straylight` remains the permanent canonical semantic owner

`loa-straylight` is and remains the **permanent** owner of canonical Straylight
semantic ownership — assertion lifecycle, recall, signer and keyring semantics,
receipt and audit *meaning*, the supersession relation, and
privacy-scope/frame projection (ADR-048B surface S1,
`./ADR-048B-canonical-store-physical-host-ownership-routing.md:155`). Selecting
where the bytes live does not move that ownership: the host is a
persistence/exposure surface, not a semantic owner
(`./ADR-022D-mvp-persistence-and-audit-owner.md:106`–`:107`), and ownership does
not follow location.

No agent, controller, tenant, runtime, model provider, cloud, adapter, or
storage host — including Railway, PostgreSQL, Finn, or Dixie — acquires
definitional power over an estate by holding, enforcing at, or routing to its
records (Phase 49P **P-1**). Dixie remains the current route-side
ingress / admission boundary and Finn retains its authorized
runtime-enforcement role — enforce, emit, persist under externally defined
semantics (`./ADR-022D-mvp-persistence-and-audit-owner.md:97`–`:99`); neither
becomes the canonical owner.

### 6.3 ADR-022E gate #8 is discharged only for bounded host selection and for opening the provider-neutral durable-storage implementation lane

Gate #8 (production database / persistence substrate,
`./ADR-022E-phase-22-deferred-features.md:57`) is **DISCHARGED for exactly two
bounded purposes**: (i) the canonical-store physical-host selection in §6.1, and
(ii) opening the provider-neutral durable-storage implementation lane bounded by
§13. §8 records precisely how the gate's own three-conjunct trigger is met at
that grain, and precisely what the discharge does **not** reach.

### 6.4 D.1(i) stays accepted; D.1(ii) is resolved; full D.1 is satisfied; D.2 is authorized to start in Phase 50A, not to complete

- **D.1 conjunct (i)** remains **ACCEPTED** and is **not reopened**
  (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:108`–`:109`).
- **D.1 conjunct (ii)** — the canonical-store physical-host dependency
  (`:110`–`:113`) — is **RESOLVED** by the §6.1 host acceptance. That is the
  dependency's own subject matter, and ADR-048B evidence requirement **R1**
  contemplates exactly this resolution path: an explicit host-routing decision,
  separately accepted under the gate #8 trigger (`:274`).
- **Full D.1** is therefore **SATISFIED**: conjunct (i) ACCEPTED ∧ conjunct (ii)
  RESOLVED ⇒ the conjunction holds (`:129`–`:130`).
- **D.2** — the item the Dixie Phase-47 chain enumerates as downstream of full
  D.1, carried here as Dixie-side evidence and neither re-owned nor redefined by
  Straylight (ADR-048B §2 rank 4) — is **AUTHORIZED TO START** in Phase 50A
  within the §13 bounds, consistent with ADR-050 §2's "bounded D.2
  authorization" for Phase 49Q
  (`./ADR-050-autonomous-execution-control-plane.md:89`–`:90`). **D.2 is not
  claimed started by this ADR, not claimed complete, and its authorization to
  start does not invert the sequencing rule** that D.2 is downstream of full D.1
  while full D.1 is not gated on D.2 (`:131`–`:132`).

### 6.5 MVP-2 remains OPEN

MVP-2 (the Admissible Layer) remains **OPEN**. Host acceptance clears the
next blocking decision, not the MVP: ADR-049 §3.2 records that after host
acceptance MVP-2 still requires a provider-neutral storage adapter, durable
implementation and migrations, backup/restore validation, live auth and identity
binding, consent enforcement and consent receipts, production-grade signer
handling, idempotency and concurrency behavior, end-to-end admission-to-recall
acceptance, and operational and rollback evidence
(`./ADR-049-six-mvp-product-roadmap-and-governance.md:116`–`:128`). Only an
operator decision may declare an MVP's proof condition met (`:65`).

### 6.6 Gates #9 and #10 remain HELD at `PARTIAL_RECORDED`

Gate #9 (Finn runtime wiring, `./ADR-022E-phase-22-deferred-features.md:58`) and
gate #10 (broad Dixie boundary wiring, `:59`) remain **HELD** at
`PARTIAL_RECORDED`
(`../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`,
`:161`). Their triggers name sibling-specific wiring conjuncts that this ADR
neither satisfies nor attempts (§7.2). The narrow Dixie recall-intake slice
already authorized by ADR-026D is **not widened**.

### 6.7 Finn's `TIER_TRUST_MAP` and `CRITICAL_ACTIONS` findings remain UNRESOLVED

Finn's two locally-defined-classification findings — `TIER_TRUST_MAP` and
`CRITICAL_ACTIONS`, on non-storage surfaces — are carried forward **UNRESOLVED**,
exactly as Finn records them and exactly as Phase 49P carried them
(`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:196`;
Finn evidence packet §3.2). This ADR does not resolve them, does not treat them
as resolved, and does not treat the §4.2 storage-surface or literal-coupling
evidence as answering them. They bear on gate #9's own disposition (§6.6), not on
the host acceptance in §6.1 and not on the §13 scope. Finn's
enforce/emit/persist posture remains its **committed target posture**, not a
proven present state.

### 6.8 Any Dixie boundary requirement is deferred until a substrate contract exists

Dixie recorded that whether the eventual Straylight substrate decision imposes a
boundary-side requirement on the references it carries cannot be known until
Straylight defines the substrate contract, and that a further bounded Dixie lane
may be needed **after** that contract exists — a deferral, not a present gap
(Dixie evidence packet §4.6, §4.8; Phase 49P §4.3). **No substrate contract
exists, and none is created here.** Any Dixie boundary requirement is therefore
**DEFERRED** until a substrate contract exists, at which point it would need its
own separately authorized, separately reviewed lane in `loa-dixie`. No
requirement is imposed on Dixie by this ADR.

---

## 7. Gate and dependency matrix — before and after

### 7.1 Before / after

State "after" means **after an operator-authorized merge of this ADR**; until
that merge every "before" value holds.

| Item | Before (entering Phase 49Q) | After (on operator merge) | Authority |
|---|---|---|---|
| **ADR-022E gate #8** — production database / persistence substrate | **OPEN / HELD** | **DISCHARGED — bounded only** to (i) host selection and (ii) opening the §13 implementation lane; **held for everything else** (§8.3) | `./ADR-022E-phase-22-deferred-features.md:57`; `../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:157` |
| **Gate #9** — Finn runtime wiring | **HELD**, `PARTIAL_RECORDED` | **HELD**, `PARTIAL_RECORDED` — unchanged | `./ADR-022E-phase-22-deferred-features.md:58`; `../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159` |
| **Gate #10** — broad Dixie boundary wiring | **HELD**, `PARTIAL_RECORDED` | **HELD**, `PARTIAL_RECORDED` — unchanged; ADR-026D slice not widened | `./ADR-022E-phase-22-deferred-features.md:59`; `../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161` |
| **D.1 conjunct (i)** | **ACCEPTED** (not reopened) | **ACCEPTED** — unchanged, not reopened | `./ADR-048B-canonical-store-physical-host-ownership-routing.md:108`–`:109` |
| **D.1 conjunct (ii)** — canonical-store physical-host dependency | **UNRESOLVED** (externally held under #9 / #10) | **RESOLVED** by the §6.1 host acceptance | `./ADR-048B-canonical-store-physical-host-ownership-routing.md:110`–`:113`, `:274`; `../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163` |
| **Full D.1** | **NOT SATISFIED** | **SATISFIED** — (i) ACCEPTED ∧ (ii) RESOLVED | `./ADR-048B-canonical-store-physical-host-ownership-routing.md:129`–`:130`; `../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165` |
| **D.2** | **NOT STARTED** | **AUTHORIZED TO START** in Phase 50A within §13; **not started, not complete** | `./ADR-048B-canonical-store-physical-host-ownership-routing.md:131`–`:132`; `./ADR-050-autonomous-execution-control-plane.md:89`–`:90` |
| **MVP-2** | **OPEN** | **OPEN** — unchanged | `./ADR-049-six-mvp-product-roadmap-and-governance.md:116`–`:128`; `../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168` |
| **Canonical semantic owner (S1)** | `loa-straylight`, **permanent** | `loa-straylight`, **permanent** — unchanged | `./ADR-048B-canonical-store-physical-host-ownership-routing.md:155` |
| **Canonical-store physical host (S2)** | **UNSELECTED** | **Railway PostgreSQL — bounded, reversible** (§6.1) | `./ADR-048B-canonical-store-physical-host-ownership-routing.md:156`; `./ADR-049-six-mvp-product-roadmap-and-governance.md:427` |
| **Authorized implementation scope** | **NONE** — `InMemoryStorage` / `JsonlStorage` the only MVP adapters behind an unchanged `StorageAdapter` seam | **The §13 Phase 50A envelope only**, under a later exact task packet; the seam itself stays unchanged until that packet | `./ADR-022D-mvp-persistence-and-audit-owner.md:79`; `src/straylight/storage/types.ts:33` |
| **Production admission / wiring / writes** | **NOT AUTHORIZED** | **NOT AUTHORIZED** — unchanged (§12) | `./ADR-049-six-mvp-product-roadmap-and-governance.md:457`, `:501`–`:506` |
| **Blockers B-1, B-2** (sibling evidence) | closed at Phase 49P, gates still held | closed — unchanged | `../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:320`, `:324` |
| **Blockers B-3, B-4** (adapter proposal, implementation authority) | **OPEN** | **DISCHARGED for the §13 envelope only** | `../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:60`–`:61`; `./ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352` |
| **Blocker B-5** (production wiring authority) | **OPEN** | **OPEN** — unchanged | `../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:62` |
| **Blocker B-6** (candidate acceptance authority) | **OPEN** | **EXERCISED** by the operator in §6.1 | `../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:63` |
| **Blocker B-7** (gate #8 satisfaction authority) | **OPEN** | **EXERCISED — bounded** (§6.3, §8) | `../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:64` |
| **Blockers B-8, B-9** (D.1(ii), D.1) | **OPEN** | **RESOLVED / SATISFIED** (§6.4) | `../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:65`–`:66` |
| **Blocker B-10** (D.2 start) | **OPEN** | **AUTHORIZED to start** in Phase 50A; not started | `../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:67` |
| **Blocker B-11** (MVP-2 closure) | **OPEN** | **OPEN** — unchanged | `../ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:68` |

### 7.2 Why D.1(ii) can resolve while gates #9 and #10 stay held

This is the load-bearing legal step, so it is stated explicitly rather than
assumed.

**D.1(ii) and gates #9 / #10 are different surfaces.** D.1(ii) *is* the
canonical-store physical-host dependency
(`./ADR-048B-canonical-store-physical-host-ownership-routing.md:110`–`:111`). It
was **externally held** under gates #9 / #10 because the host decision could not
responsibly be made without the siblings' runtime and boundary evidence. That
evidence has now been supplied, merged, and intaken, and blockers B-1 and B-2 are
closed (`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:320`).
The dependency is resolved by the operator taking the host decision that is its
subject matter — the resolution path ADR-048B **R1** names (`:274`).

**Gates #9 and #10 hold their own wiring conjuncts, which this ADR does not
touch.** Gate #9's trigger requires issue-#70 feedback or teammate approval, a
placement ADR selecting Finn, and a `loa-finn` PR under teammate review
(`./ADR-022E-phase-22-deferred-features.md:58`). Gate #10's is symmetric for
broad Dixie boundary wiring (`:59`). This ADR satisfies **none** of those
conjuncts, selects no runtime-enforcement host, opens no sibling lane, widens no
Dixie slice, and resolves neither of Finn's two open findings (§6.7). Both gates
therefore stay exactly where Phase 48N left them.

**The asymmetry is symmetric to the one Phase 49P recorded.** Closing an
evidence-supply blocker did not close the gate behind it
(`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:324`);
resolving the
host dependency does not close the sibling gates that externally held it. Nothing
about the external-holding relationship converts a resolved dependency into a
satisfied sibling gate.

---

## 8. The bounded gate #8 discharge, stated exactly

### 8.1 The trigger, and how it is met at the bounded grain

Gate #8's trigger is a three-part conjunction: "A separate ADR proposes the
production adapter, cites the relevant sibling-repo handoff packet, and preserves
the ADR-022D receipt and audit-chain invariants"
(`./ADR-022E-phase-22-deferred-features.md:57`).

| Conjunct | How it is met | Grain limit |
|---|---|---|
| **proposes the production adapter** | This ADR proposes, **in kind**, a **provider-neutral PostgreSQL `StorageAdapter`** implementing the existing swap-in seam (`src/straylight/storage/types.ts:33`; `./ADR-022D-mvp-persistence-and-audit-owner.md:79`) — the `M5` proposal shape the trigger requires (`./ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`) | **Proposal in kind only.** No interface, method set, type, SQL, schema, migration, table, index, connection shape, or configuration is designed, sketched, or specified. The seam is unchanged; §13 bounds the later work |
| **cites the relevant sibling-repo handoff packet** | Finn PR #258 at `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` and Dixie PR #255 at `d36c0846f03bfd097d35dd2c001de19eec817cf0`, via the merged Phase 49P intake (§4) | Cited as **bounded evidence**, never as acceptance or as authority (§5) |
| **preserves the ADR-022D receipt and audit-chain invariants** | The invariants are carried as **binding conditions** on all §13 work: P-3 adapter semantics, P-4 chain-of-custody across every move, P-5 no semantic redefinition and no unauthorized re-minting, P-11 host-invariant fail-closed behavior (§10), anchored at `./ADR-022D-mvp-persistence-and-audit-owner.md:115`–`:120`, `:170`–`:174`; `src/straylight/audit.ts:75`–`:88`; `tests/phase-5-hardening.test.ts:50`, `:93`, `:123`, `:159`, `:326` | Preservation is stated as an **obligation on Phase 50A**, not as a completed verification. Nothing in this ADR changes or re-verifies any invariant |

### 8.2 What the discharge reaches

1. The canonical-store physical-host **selection** in §6.1.
2. **Opening** the provider-neutral durable-storage implementation lane bounded
   by §13 — the authority for that lane to exist and to be packeted, nothing
   more.

### 8.3 What the discharge does not reach — gate #8 stays held for all of it

Production admission; production estate writes; production migration execution;
production rollout or cutover; production durable storage in the living estate;
production credentials or provider access; production auth, consent, or signer
implementation; living-estate admission; gate #9 or gate #10 closure; MVP-2
closure; D.2 completion; Phase 50A or Phase 50B completion; any Tier-2
cross-repository contract; any Tier-3 estate-semantic change; and any provider
operational claim (§12). A **bounded** discharge is not a general one, and the
gate's own residual force over every item in this paragraph is preserved.

---

## 8A. ADR-048B evidence bar (R1–R8) and §9 closure-readiness criteria

ADR-048B §8 enumerates the evidence a gate-#8 closure attempt must carry (R1–R8)
and §9 the criteria it must produce before it may be *evaluated*. Because §6.3
discharges gate #8 at a bounded grain, that bar must be met — not just its R1
row. Each item below is either satisfied at the stated grain or explicitly
carried forward.

| Item | Requirement (`./ADR-048B-canonical-store-physical-host-ownership-routing.md`) | Disposition |
|---|---|---|
| **R1** | An explicit host-routing decision, recorded in the owning repo; a host-selection / production-adapter proposal counts toward the `./ADR-022E-phase-22-deferred-features.md:57` trigger **only if separately accepted** (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:274`) | **SATISFIED at the bounded grain.** §6.1 is the host-routing decision, recorded in `loa-straylight` (the owning repo for the decision frame per ADR-048B §7); §8.1 records the production-adapter proposal in kind; the "separately accepted" condition is the operator merge (§1). This is an affirmative host decision, **not** the no-host negative outcome R1 warns of |
| **R2** | Sibling-gate owner ACCEPTANCE or REJECTION for #9 and #10, recorded in their own repos under teammate review (`:275`) | **SATISFIED as to the recorded acceptances.** Both owners returned `OWNER_RESPONSE: ACCEPT`, recorded at Phase 48L as `ACCEPT_RECORDED` ×2 with routing `RECORDED` (`../ADR-022E-SIBLING-GATE-9-10-OWNER-RESPONSE-INTAKE-COMPLETION-GATE.md:94`), and both then supplied merged evidence (§4.2). **A recorded owner ACCEPT is willingness to own the evidence-lane question — never gate satisfaction** (`../ADR-022E-SIBLING-GATE-9-10-OWNER-RESPONSE-INTAKE-COMPLETION-GATE.md:113`); gates #9 / #10 accordingly stay HELD (§6.6) |
| **R3** | Proof that canonical Straylight semantics (S1) are NOT silently delegated (`:276`) | **SATISFIED as a *becoming* finding, bounded exactly as Phase 49P bounded it.** §6.2 keeps S1 permanent; Finn holds zero literal Straylight/ADR-022E coupling in `src/` and Dixie declares zero canonical primitives locally, importing them type-only (§4.2). **Not a non-drift finding**: Finn's two open findings sit on surfaces the literal-coupling search would not reach (§6.7; `../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:292`–`:298`) |
| **R4** | A clear boundary between the canonical store (S2) and Dixie route-side ingress / control-plane records (S5) (`:277`) | **SATISFIED and preserved.** Dixie carries boundary / ingress / reference / control-plane records for what Straylight defines, and nothing more (§4.2, §6.2); its spike tree is reference-carrying with test-enforced isolation from its own DB paths. The boundary survives the §6.1 host selection unchanged, and no Dixie requirement is imposed (§6.8) |
| **R5** | A clear boundary between runtime/audit enforcement (S4) and semantic ownership (S1) (`:278`) | **SATISFIED and preserved.** Finn enforces, emits, and persists under externally defined semantics; it EMITS the receipt the wedge DEFINES (`./ADR-022D-mvp-persistence-and-audit-owner.md:97`–`:99`). P-5 and P-13 keep authorized-runtime participation lawful while forbidding semantic redefinition, unauthorized re-minting, and self-authorized admission (§10) |
| **R6** | The migration / storage / adapter implications against the ADR-022D receipt and audit-chain invariants and the `StorageAdapter` seam (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:279`) | **CARRIED as binding Phase 50A conditions, not as completed work.** §8.1 conjunct 3, §10 (P-3, P-4, P-5, P-11, P-12), and §13.1(a), (b), (d), (h) bind them. The seam is unchanged and the invariants are unre-verified by this ADR (§18) |
| **R7** | An explicit non-production-posture statement: a viable host does not by itself authorize production; the production lane stays independently gated (`:280`) | **SATISFIED.** §8.3, §12, §13.3, §16, and §19 state it repeatedly, and §9 clause 9 carries ADR-049's own version of the rule |
| **R8** | An explicit statement that no start of D.2 follows until full D.1 is independently SATISFIED, plus a D.1 → D.2 dependency note downstream phases cannot silently invert (`:281`) | **SATISFIED.** Full D.1 is satisfied **first**, by §6.4, and only then is D.2 authorized to start; §6.4 and §7.1 state the sequencing (D.2 downstream of full D.1; full D.1 not gated on D.2) explicitly so no later phase can invert it |

**ADR-048B §9 criteria** (`:293`–`:307`): (1) the host-routing decision is §6.1;
(2) owner acceptance is the Phase 48L record above; (3) the D.1 → D.2 dependency
matrix is §7.1 read with §6.4; (4) the forward-copied non-authorization list is
§8.3 read with §16 and the ADR-048B §11 carriage below; (5) the pass/fail bar is
§8.1's conjunct-by-conjunct mapping plus the §9 and §10 condition tables.

**ADR-048B §11 carriage.** ADR-048B's eighteen non-authorizations
(`:362`–`:379`) are carried forward as follows. Superseded on operator merge, and
only to the extent §6 states: item 1 (host selection), item 3 (D.1
satisfaction), item 4 (start of D.2 — **authorized to start**, not started), and
item 5 (gate #8 discharge — **bounded only**). **Every other item remains
unauthorized**: item 2 (sibling gate #9 / #10 resolution), 6 (MVP-2 closure),
7 (production DB execution), 8 (production DB writes), 9 (production migration
execution), 10 (production durable storage), 11 (production auth / consent /
signer implementation), 12 (route / API behavior changes), 13 (Freeside runtime /
client integration), **14 (Lane-2 canonical Straylight-store migrations)**,
15 (route-contract freeze), 16 (final-schema freeze), 17 (production-readiness of
any kind), and 18 (any `aw_*` SQL production-safe claim).

On item 14 specifically: the §13.1(b) canonical-migration authorization is
**authoring provider-neutral canonical migrations plus proving them in a
non-production environment**. It is **not** authorization to execute a Lane-2
canonical Straylight-store migration against any production or living estate,
which remains unauthorized here and requires its own later operator decision
(§13.3).

---

## 9. ADR-049 §9.1 clause carriage — all ten, as enforceable conditions

Each clause below is required by ADR-049 §9.1 of "the future acceptance ADR"
(`./ADR-049-six-mvp-product-roadmap-and-governance.md:442`–`:459`). Each is
carried here as an **enforceable condition** on the §13 Phase 50A work and on any
later production-admission decision — never weakened, and never restated as an
already-satisfied fact.

Bare `:NNN` anchors in the "Clause" column below are lines of
[`./ADR-049-six-mvp-product-roadmap-and-governance.md`](./ADR-049-six-mvp-product-roadmap-and-governance.md).

| §9.1 | Clause (line in `./ADR-049-six-mvp-product-roadmap-and-governance.md`) | Carried as | Where enforced |
|---|---|---|---|
| **1** | No Railway-specific concepts in the estate domain model (`:446`) | Binding prohibition; provider-neutral naming remains permitted, as P-2 records | §6.1, §10 (P-2), §11, §13.2 |
| **2** | No Railway-specific semantics in canonical migrations (`:447`) | Binding prohibition on all §13 migration work | §10 (P-2, P-9), §11, §13.1(b) |
| **3** | Ordinary PostgreSQL export and restore (`:448`) | Required capability of the canonical record, not a vendor feature | §10 (P-6), §11, §13.1(e) |
| **4** | A documented database backup/restore test before production admission (`:449`) | **Mandatory pre-production proof obligation**; unproven today | §10 (P-7), §12, §13.1(e) |
| **5** | Configuration through the adapter/deployment boundary rather than domain code (`:450`) | Binding boundary rule | §10 (P-2), §11, §13.2 |
| **6** | Ability to move to another conforming PostgreSQL host without changing assertion or receipt semantics (`:452`) | Live, non-eroding requirement for the deployment's life | §10 (P-6, P-8), §11, §13.1(i) |
| **7** | A rollback procedure for failed migrations or failed admission deployment (`:454`) | Required **before** either is attempted | §10 (P-9), §13.1(f), §15 |
| **8** | Reopening the infrastructure decision if durability, isolation, restore, or operational evidence fails (`:455`) | Standing reopening trigger | §10 (P-14), §15 |
| **9** | No claim that accepting the host automatically accepts production wiring (`:457`) | Explicit non-authorization; restated throughout | §3, §8.3, §12, §16, §19 |
| **10** | Separate validation of auth, consent, and signer behavior after durable storage exists (`:458`) | Deferred to its own later decision; **not** authorized here | §3, §13.3, §16 |

---

## 10. Phase 49P P-1…P-14 obligation carriage

The fourteen provider-neutral canonical-estate persistence requirements recorded
at `../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:351`–`:364`
are the written standard against which this decision is taken, exactly as Phase
49P intended (`:366`). Each is carried forward **unweakened** as a binding
condition on the §13 work and on any later production-admission decision. Each
holds independently of the agent, controller, tenant, runtime, model provider,
cloud, and conforming storage host.

Bare `:NNN` anchors in the "Obligation" column below are lines of
[`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md`](../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md).

| P | Obligation (line in `../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md`) | Carried as |
|---|---|---|
| **P-1** | Semantic ownership is non-transferable (`:351`) | §6.2; no §13 work may move S1 |
| **P-2** | No provider-, deployment-, or host-specific product concept in the domain model or canonical migration semantics (`:352`) | §9 clauses 1, 2, 5; §11; §13.2 |
| **P-3** | A conforming host satisfies the recorded adapter semantics exactly — upsert for actors/estates/keyrings/assertions/receipts; append-only, append-ordered, immutable transitions and audit events; per-estate hash chain with retrievable tail; unknown ids absent not throwing; integrity violations as exceptions, never silent drops (`:353`) | Binding acceptance criterion for §13.1(a), (d), (h) |
| **P-4** | Chain of custody survives every move — the chain verifies identically after export, restore, migration, or provider replacement; a broken chain quarantines rather than serves (`:354`) | Binding acceptance criterion for §13.1(d), (e), (i) |
| **P-5** | Receipts are never semantically redefined and never re-minted without authority; authorized-runtime participation is preserved (`:355`) | Binding prohibition across §13; §6.2 |
| **P-6** | Portability is provider-neutral by construction — ordinary export, restore into a **different** conforming host, semantics unchanged (`:356`) | §9 clauses 3, 6; §11; §13.1(e), (i) |
| **P-7** | Restoration is proven before reliance, not assumed; provider marketing and defaults are not evidence (`:357`) | §9 clause 4; §12 **mandatory pre-production proof**; §13.1(e) |
| **P-8** | Provider replacement stays live; no accepted provider becomes a permanent architectural dependency (`:358`) | §6.1; §9 clause 6; §11; §15 |
| **P-9** | Migration and rollback are provider-neutral and reversible; rollback exists **before** either is attempted (`:359`) | §9 clauses 2, 7; §13.1(b), (f) |
| **P-10** | Every authority is granted explicitly, never by implication; co-recording distinct grants in one operator-signed PR is permitted provided each is stated in its own terms (`:360`) | §6 states each grant separately; §16 tabulates granted vs withheld; §8.3 and §12 name every withheld authority |
| **P-11** | Fail-closed behavior is host-invariant; persistence uncertainty must deny, never degrade permissively (`:361`) | Binding acceptance criterion for §13.1(c), (g) |
| **P-12** | Concurrency and isolation may not be inherited as assumptions — the recorded single-writer guarantee does not extend to a concurrent deployment and must be re-established (`:362`) | Binding acceptance criterion for §13.1(h); `src/straylight/storage/jsonl.ts:15`–`:20` |
| **P-13** | No self-authorized admission; authorized-runtime participation preserved; no model provider conditions canonical semantics (`:363`) | §3 non-goals; §13.3; ADR-049 `:404`–`:410` |
| **P-14** | Operational failure reopens the infrastructure decision (`:364`) | §9 clause 8; §15 |

Phase 49P recorded that "the obligation to carry the §9.1 clauses remains on the
Phase 49Q acceptance ADR" and that nothing there discharged it
(`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:373`). §9
discharges that carriage obligation; the clauses themselves remain conditions,
not accomplishments.

---

## 11. Provider-portability contract

The accepted host holds bytes under this contract. It binds every §13
deliverable and survives for the life of the deployment.

1. **Semantics live above the substrate.** The canonical assertion, transition,
   receipt, audit, recall, and supersession semantics are defined in
   `loa-straylight` and are unchanged by any host choice
   (`./ADR-049-six-mvp-product-roadmap-and-governance.md:432`–`:436`). Changing
   PostgreSQL hosts must redefine none of them.
2. **Provider-neutral surface only.** The adapter presents the recorded
   `StorageAdapter` semantics (P-3). No provider-specific extension, proprietary
   feature, product-specific behavior, or deployment particular may appear in the
   estate domain model or in canonical migration semantics (§9 clauses 1, 2, 5;
   P-2). Provider-neutral naming — "storage host", "cloud", "runtime",
   "controller", "tenant", "model provider" — remains permitted, because generic
   naming is what makes an obligation host-invariant.
3. **Configuration at the boundary.** All connection, pooling, and deployment
   configuration lives at the adapter/deployment boundary, never in domain code
   (§9 clause 5).
4. **Ordinary export and restore.** Canonical estate state is exportable in an
   ordinary, provider-neutral PostgreSQL form and restorable into a **different**
   conforming host with assertion, transition, receipt, and audit semantics
   unchanged, and with the per-estate audit chain verifying identically
   afterwards (§9 clauses 3, 6; P-4, P-6).
5. **Replacement stays live.** Provider replaceability is preserved for the
   deployment's life and may not erode as the deployment matures. No accepted
   provider becomes a permanent architectural dependency (§9 clause 6; P-8;
   `./ADR-049-six-mvp-product-roadmap-and-governance.md:490`).
6. **No Railway-specific adapter contract.** No adapter contract, seam, or
   abstraction may be defined *for Railway*. The seam is provider-neutral or it
   violates this contract.
7. **Replacement is proven, not asserted.** §13.1(i) requires a demonstrated
   provider-replacement proof in a non-production environment before any
   production-admission decision may be evaluated.

---

## 12. No provider facts; mandatory pre-production proof obligations

**This ADR establishes no provider-side operational fact.** Both siblings state
that provider operational properties are unverifiable from their repositories
(Finn evidence §4; Dixie evidence §6.2), Phase 49P imported no provider claim to
fill that gap (`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:396`–`:400`),
and this document imports none either. Accepting a host on a Tier-1, reversible
basis is a product decision under uncertainty, made with the gap recorded rather
than papered over.

Every property below is therefore **absent as evidence and mandatory as
pre-production proof**. Each must be demonstrated, documented, and separately
accepted **before** any production-admission decision may be evaluated. None is
proven today, and none is claimed proven anywhere in this document.

| Obligation | Status today | Anchor |
|---|---|---|
| Durability | **unproven — mandatory pre-production proof** | §9 clause 8; P-7, P-14 |
| Backup and restore success (documented exercise against the actual deployment) | **unproven — mandatory pre-production proof** | §9 clause 4; P-7 |
| Failover | **unproven — mandatory pre-production proof** | §9 clause 8; P-14 |
| Version pinning | **unproven — mandatory pre-production proof** | §9 clause 8; P-14 |
| Network isolation | **unproven — mandatory pre-production proof** | §9 clause 8; P-14 |
| Tenancy boundary | **unproven — mandatory pre-production proof** | §9 clause 8; P-12, P-14 |
| Availability | **unproven — mandatory pre-production proof** | `./ADR-049-six-mvp-product-roadmap-and-governance.md:436`–`:439` |
| Incident recovery | **unproven — mandatory pre-production proof** | `./ADR-049-six-mvp-product-roadmap-and-governance.md:436`–`:439` |
| Export/restore success into a different conforming host | **unproven — mandatory pre-production proof** | §9 clauses 3, 6; P-4, P-6 |
| Rollback of a failed migration or failed admission deployment | **unproven — mandatory pre-production proof** | §9 clause 7; P-9 |

The host choice is **semantically non-authoritative but not inert**:
infrastructure still governs operational correctness
(`./ADR-049-six-mvp-product-roadmap-and-governance.md:432`–`:439`). That is
precisely why the table above is an obligation list and not a findings list.

---

## 13. Phase 50A authorization envelope

Phase 50A is authorized to **start** under a later, exact task packet in the
ADR-050 corridor. This ADR authorizes the lane's existence and bounds its scope;
it schedules nothing, packets nothing, and implements nothing.

### 13.1 Authorized capability scope — this list is exhaustive

| # | Authorized capability | Bound by |
|---|---|---|
| **a** | A **provider-neutral PostgreSQL `StorageAdapter`** implementing the existing, unchanged swap-in seam | P-3, P-5, P-11; `src/straylight/storage/types.ts:33`; `./ADR-022D-mvp-persistence-and-audit-owner.md:79` |
| **b** | **Canonical migrations** carrying no provider-specific semantics | §9 clauses 1, 2; P-2, P-9 |
| **c** | **Non-production integration proof** — local / development / operator-grade only | §9 clause 9; P-11; §13.3 |
| **d** | **Append-only audit persistence** with per-estate hash chaining and a retrievable tail, verifying identically after every move | P-3, P-4; `src/straylight/audit.ts:31`, `:75`–`:88`; `tests/phase-5-hardening.test.ts:326` |
| **e** | **Export and restore** in ordinary provider-neutral form, with a documented backup-and-restore exercise | §9 clauses 3, 4; P-6, P-7 |
| **f** | **Rollback** procedure for a failed migration or failed admission deployment, existing before either is attempted | §9 clause 7; P-9 |
| **g** | **Idempotency** behavior | P-3, P-11 |
| **h** | **Concurrency** behavior — isolation and single-writer-equivalent ordering for append-only records, re-established rather than inherited, without altering P-3 semantics | P-3, P-12; `src/straylight/storage/jsonl.ts:15`–`:20` |
| **i** | **Provider-replacement proof** — restore into a **different** conforming host with semantics and chain intact, demonstrated in a non-production environment | §9 clause 6; P-4, P-6, P-8; §11.7 |

Every deliverable must satisfy the §10 P-1…P-14 obligations and the §11
portability contract. Failure of any one is a Phase 50A defect, not a
renegotiation of this ADR.

### 13.2 Bounding rules for Phase 50A

- **Provider-neutral or refused.** No Railway-specific concept, behavior, or
  configuration may enter the estate domain model or canonical migration
  semantics; no Railway-specific adapter contract may be defined (§9 clauses 1,
  2, 5; P-2; §11.6).
- **Non-production only.** All Phase 50A proof is local / development /
  operator-grade. Phase 50A touches no production estate, executes no production
  migration, performs no production write, and uses no production credential.
- **Semantics unchanged.** Phase 50A implements persistence for semantics
  Straylight already defines. It changes no assertion class or status, signer
  competence, identity, challenge, revocation, forgetting, inheritance,
  commitment, or permanence rule. Any need to change one is a **Tier-3**
  question requiring its own operator decision, and Phase 50A must stop and
  escalate rather than proceed.
- **No sibling binding.** Phase 50A modifies no sibling repository and creates no
  cross-repository contract. Any apparent need for either is a **Tier-2**
  question requiring its own operator decision (§6.8).
- **Bounded packet discipline.** Phase 50A proceeds only under an exact task
  packet bound to an exact base SHA in the ADR-050 corridor, with its own
  independent audit and its own operator merge
  (`./ADR-050-autonomous-execution-control-plane.md:89`–`:94`).

### 13.3 Not authorized by Phase 50A — each requires its own later operator decision

Production admission; production estate writes; production migration execution;
production rollout or cutover; provider provisioning, configuration, access, or
credentials; production wiring; living-estate admission (including the ADR-049 §8
Satoshi living pilot); auth, consent, signer, or controller-binding semantics and
their validation (§9 clause 10); Dixie or Finn wiring; gate #9 or gate #10
closure; any Tier-2 contract; any Tier-3 estate-semantic change; MVP-2 closure;
and any work beyond MVP-2.

---

## 14. Phase 50B boundary

Phase 50B is **MVP-2 controlled development/operator-grade acceptance
preparation** (`./ADR-050-autonomous-execution-control-plane.md:93`–`:94`). It is
**not authorized, not scheduled, not scoped, and not prejudged** by this ADR.

The boundary is fixed here so it cannot drift:

- Phase 50A **delivers bounded capability and non-production proof**; Phase 50B
  **prepares independent acceptance** of that capability. Delivery is not
  acceptance.
- **Neither phase closes MVP-2.** Only an operator decision may declare an MVP's
  proof condition met
  (`./ADR-049-six-mvp-product-roadmap-and-governance.md:65`), and MVP-2's
  remaining work extends well beyond durable storage (`:116`–`:128`).
- **Phase 50B is not production admission.** The §12 obligations must be
  discharged and separately accepted before any production-admission decision may
  be evaluated, and no part of Phase 50A or 50B substitutes for that.
- Phase 50B requires its own lane, its own bounded packet, its own independent
  audit, and its own operator decision.

---

## 15. Rollback and reopening triggers

The acceptance in §6.1 is reversible, and reversibility that is never exercised on
failure is not reversibility (P-8, P-14). **Any one** of the following reopens
the infrastructure decision, at which point the host selection returns to an
operator decision and the §13 lane pauses pending it:

1. Durability evidence fails or cannot be produced (§9 clause 8; P-14).
2. A documented backup-and-restore exercise fails or cannot be produced (§9
   clause 4; P-7).
3. Restore into a **different** conforming host fails, or the per-estate audit
   chain does not verify identically afterwards (§9 clauses 3, 6; P-4, P-6).
4. Isolation, tenancy, or network-isolation evidence fails (§9 clause 8; P-12,
   P-14).
5. Failover, availability, version-pinning, or incident-recovery evidence fails
   (§9 clause 8; `./ADR-049-six-mvp-product-roadmap-and-governance.md:436`–`:439`).
6. Concurrency or isolation behavior cannot be established without altering the
   P-3 semantics (P-12).
7. Provider replaceability erodes, or the provider becomes a de-facto permanent
   architectural dependency (§9 clause 6; P-8).
8. A required rollback procedure does not exist before a migration or admission
   deployment is attempted (§9 clause 7; P-9).
9. Delivering the §13 scope would require a provider-specific concept in the
   estate domain model or in canonical migration semantics (§9 clauses 1, 2;
   P-2).
10. Delivering the §13 scope would require a Tier-2 cross-repository contract, a
    Tier-3 estate-semantic change, a sibling-repository edit, external
    infrastructure access, or secrets (§13.2).
11. Any operational failure of the accepted substrate (P-14).

**Rollback of this ADR itself.** Because the decision is Tier 1 and docs-only,
reversal is a later operator-signed ADR that supersedes §6 and restores the §7.1
"before" column. No code, migration, or production state depends on this document
at merge time, so nothing must be unwound to reverse it.

---

## 16. Authorization and non-authorization matrix

Each grant is stated in its own terms, and nothing is granted by implication
(P-10).

| Authority | Disposition on operator merge | Where |
|---|---|---|
| Canonical-store physical-host acceptance (Railway PostgreSQL, bounded, reversible) | **GRANTED** | §6.1 |
| ADR-022E gate #8 discharge — bounded to host selection and lane opening | **GRANTED, bounded** | §6.3, §8 |
| D.1(ii) resolution; full D.1 satisfaction | **GRANTED** | §6.4 |
| D.2 authorization to **start** in Phase 50A | **GRANTED, bounded** | §6.4, §13 |
| Provider-neutral PostgreSQL `StorageAdapter` proposal (in kind) and implementation-lane opening | **GRANTED, bounded to §13.1** | §8.1, §13.1 |
| Canonical migrations, non-production integration proof, append-only audit persistence, export/restore, rollback, idempotency, concurrency, provider-replacement proof | **GRANTED, bounded to §13.1 under a later exact packet** | §13.1 |
| Adapter interface design, SQL, schema, code, fixtures, tests, configuration, deployment artifacts | **NOT GRANTED by this ADR** (a §13 packet governs them) | §3, §8.1 |
| Provider provisioning, configuration, access, credentials, secrets | **NOT GRANTED** | §3, §13.3 |
| Production admission, production writes, production migration execution, rollout, cutover, production durable storage | **NOT GRANTED** | §8.3, §12, §13.3 |
| Executing a Lane-2 canonical Straylight-store migration against a production or living estate (ADR-048B §11 item 14) | **NOT GRANTED** — §13.1(b) authorizes authoring provider-neutral canonical migrations and proving them non-production only | §8A, §13.1(b), §13.3 |
| Auth, consent, signer, controller-binding, identity-mutation, challenge, revocation, forgetting, inheritance, commitment, permanence semantics or their validation | **NOT GRANTED** — separate later decision | §9 clause 10, §13.3 |
| Living-estate admission (including the ADR-049 §8 Satoshi pilot) | **NOT GRANTED** | §13.3 |
| Gate #9 closure; gate #10 closure; widening the ADR-026D slice | **NOT GRANTED** | §6.6, §7.2 |
| Resolution of Finn's `TIER_TRUST_MAP` / `CRITICAL_ACTIONS` findings | **NOT GRANTED** — carried UNRESOLVED | §6.7 |
| Any Dixie substrate/boundary requirement | **NOT GRANTED** — deferred until a substrate contract exists | §6.8 |
| Sibling-repository edits; Tier-2 cross-repository contracts | **NOT GRANTED** | §3, §13.2 |
| Tier-3 estate-semantic changes | **NOT GRANTED** | §3, §13.2 |
| MVP-2 closure; D.2 completion; Phase 50A or 50B completion; work beyond MVP-2 | **NOT GRANTED** | §6.5, §13.3, §14 |
| Merge of this pull request | **RESERVED to `operator:eileen`** | §1, §17 |

---

## 17. Authority boundaries

- **`operator:eileen` alone** decides §6. The keyring is exclusive and there is
  no standing delegation
  (`./ADR-049-six-mvp-product-roadmap-and-governance.md:312`, `:338`;
  `./ADR-050-autonomous-execution-control-plane.md:143`).
- **Claude** drafted this ADR under the ADR-049 §7 drafting role and the ADR-050
  implementer role. Claude did not sign, accept, audit, or merge it, and may not
  audit itself (`./ADR-050-autonomous-execution-control-plane.md:158`–`:161`).
- **Codex** audits an exact base→head diff and returns one verdict. `ACCEPT`
  feeds merge **eligibility** only; Codex is not an acceptance authority
  (`:162`–`:165`).
- **Flatline and Bridgebuilder** provide adversarial review; **repo maintainers**
  may supply technical evidence, warnings, or compatibility constraints; **CI and
  conformance tests** provide machine evidence; **GitHub PRs** preserve the record
  (`./ADR-049-six-mvp-product-roadmap-and-governance.md:342`–`:355`). None is a
  Straylight authority.
- **Sibling owners** supplied bounded evidence. They are not Straylight
  co-signers (`:246`), and neither Finn nor Dixie acquires canonical semantic
  ownership by having supplied it (§6.2).
- **GitHub labels, the reducer, the watchdog, the merge guard, and recorded merge
  eligibility** are mechanical projections and confer no authority
  (`./ADR-050-autonomous-execution-control-plane.md:166`–`:168`).
- **No new Straylight authority is created by this ADR.**

---

## 18. Preserved state

Preserved exactly as recorded, and unchanged by this document **until an
operator-authorized merge**; after such a merge, the §7.1 "after" column governs
and every item below that the "after" column does not change continues to hold:

- **Gates #9 and #10** remain **HELD** at `PARTIAL_RECORDED`
  (`../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`,
  `:161`).
- **Finn's `TIER_TRUST_MAP` and `CRITICAL_ACTIONS` findings** remain
  **UNRESOLVED**
  (`../PHASE-49P-PROVIDER-NEUTRAL-PERSISTENCE-SIBLING-EVIDENCE-INTAKE.md:196`).
- **MVP-2** remains **OPEN**
  (`./ADR-049-six-mvp-product-roadmap-and-governance.md:116`–`:128`;
  `../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168`).
- **`loa-straylight`** remains the **permanent** canonical semantic owner
  (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:155`).
- **Dixie** remains the current route-side ingress / admission boundary; the
  narrow ADR-026D recall-intake slice is **not widened**.
- **Finn** retains its authorized runtime-enforcement role — enforce, emit,
  persist under externally defined semantics
  (`./ADR-022D-mvp-persistence-and-audit-owner.md:97`–`:99`).
- **`InMemoryStorage` and `JsonlStorage`** remain the only MVP adapters behind an
  **unchanged** `StorageAdapter` swap-in seam
  (`./ADR-022D-mvp-persistence-and-audit-owner.md:79`;
  `src/straylight/storage/types.ts:33`).
- **The ADR-022D receipt and audit-chain invariants** are unchanged and
  unre-verified by this ADR
  (`:115`–`:120`, `:170`–`:174`; `tests/phase-5-hardening.test.ts:50`, `:93`,
  `:123`, `:159`, `:326`).
- **No production database execution, production write, production migration
  execution, production durable storage, or production auth/consent/signer
  implementation is authorized**
  (`./ADR-049-six-mvp-product-roadmap-and-governance.md:501`–`:506`).
- **Gate #11** (Freeside), **gate #12** (new network surface), and the **gate
  #20** threat-model-widening discipline are untouched.
- **Every §12 provider obligation** remains unproven and mandatory.

---

## 19. Preserved non-claims

Each notion below appears in this document **only inside a negation or as an
unproven obligation**. This ADR:

- **claims no provider operational fact** — no durability, backup, restore,
  failover, version pinning, isolation, tenancy, availability, compliance,
  incident-recovery, or production-readiness property of Railway or any provider
  is claimed proven; each is recorded as a mandatory pre-production proof
  obligation (§12);
- **authorizes no production anything** — no production database writes,
  production credentials, production migration execution, production rollout,
  cutover, living-estate admission, production auth/consent/signer behavior, or
  unrelated rollout (§8.3, §13.3);
- **closes no gate #9 or #10**, **resolves neither** `TIER_TRUST_MAP` nor
  `CRITICAL_ACTIONS`, **closes no MVP-2**, **completes no D.2**, and **claims no
  MVP-2 product acceptance** (§6.5–§6.7, §14);
- **transfers no semantic ownership** from `loa-straylight`, and lets no
  Railway, PostgreSQL, Finn, Dixie, cloud, runtime, adapter, controller, tenant,
  or model provider define estate semantics (§6.2);
- **admits no Railway-, deployment-, or host-specific product concept, behavior,
  or configuration** into the estate domain model or canonical migration
  semantics, and **defines no Railway-specific adapter contract** (§9 clauses 1,
  2, 5; §11);
- **represents provider acceptance as acceptance of nothing else** — not of a
  `StorageAdapter` implementation, not of production wiring, not of provider
  operations, not of Phase 50B proof (§9 clause 9; §16);
- **attributes no operator authority** to Claude, Codex, sibling maintainers,
  GitHub labels, an audit verdict, merge eligibility, or the control plane
  (§1, §17);
- **rewrites no historical document** — the three annotated files keep their
  original assertions verbatim and receive only explicit, appended later-status
  annotations pointing here (§20);
- **creates no Tier-2 cross-repository contract and no Tier-3 estate-semantic
  decision**, and imposes no requirement on any sibling repository (§6.8,
  §13.2);
- **changes no path outside the four allowed Markdown files**, opens no second
  pull request, and **merges nothing**;
- **leaks nothing** — no credential, token, key, connection string, database URL,
  endpoint, hostname, port, account or project identifier, region, topology
  detail, environment-variable value, command or API example, pricing figure, or
  deployment instruction appears anywhere in this document.

---

## 20. Historical annotations — what was added to the three existing documents

The three existing documents were **not rewritten**. Each keeps every original
assertion verbatim and receives one concise, clearly marked later-status
annotation appended at the end of the file, pointing here. Appending at
end-of-file also preserves every existing `file:line` cross-reference into those
documents, of which the repository contains many.

| Document | Annotation records | Original claims |
|---|---|---|
| [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md) | Gate #8's later bounded-discharge status; gates #9 / #10 unchanged and HELD | Preserved verbatim, including the gate table rows at `:57`–`:59` |
| [`./ADR-048B-canonical-store-physical-host-ownership-routing.md`](./ADR-048B-canonical-store-physical-host-ownership-routing.md) | That surface S2's "UNSELECTED" and the §11 non-authorizations 1–5 were **true when written** and are later superseded, for those bounded items only, by this ADR on operator merge; S1 unchanged | Preserved verbatim; the ADR remains the authority for the D.1 decomposition, the six surfaces, and R1–R8 |
| [`../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md`](../ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) | Which §6 preserved-state lines are later superseded (gate #8, D.1(ii), D.1, D.2) and which stand unchanged (gates #9 / #10, MVP-2, D.1(i)) | Preserved verbatim; the Phase 48N intake record and its `PARTIAL_RECORDED` classifications are unchanged |

No annotation edits historical decision text to suggest an earlier document made
the Phase 49Q decision, and each annotation states plainly that it takes effect
only on the operator-authorized merge of this ADR.

---

## 21. Result

**Result token**:
**`RAILWAY_POSTGRESQL_CANONICAL_STORE_HOST_ACCEPTANCE_AND_BOUNDED_PHASE_50A_AUTHORIZATION_PROPOSED_PENDING_OPERATOR_MERGE`**

On operator-authorized merge: Railway PostgreSQL is accepted as the bounded,
reversible MVP-2 canonical-store physical host, never the Straylight product
boundary or semantic owner (§6.1); `loa-straylight` remains the permanent
canonical semantic owner (§6.2); ADR-022E gate #8 is discharged only for bounded
host selection and for opening the provider-neutral durable-storage
implementation lane, and stays held for everything else (§6.3, §8); D.1(i) stays
accepted, D.1(ii) resolves, full D.1 is satisfied, and D.2 is authorized to start
in Phase 50A without being started or completed (§6.4); MVP-2 stays OPEN (§6.5);
gates #9 and #10 stay HELD at `PARTIAL_RECORDED` (§6.6); Finn's `TIER_TRUST_MAP`
and `CRITICAL_ACTIONS` findings stay UNRESOLVED (§6.7); any Dixie boundary
requirement is deferred until a substrate contract exists (§6.8); Phase 50A is
authorized only for the nine bounded capabilities in §13.1 under a later exact
packet; Phase 50B stays unauthorized and unprejudged (§14); all ten ADR-049 §9.1
clauses (§9) and all fourteen Phase 49P P-1…P-14 obligations (§10) are carried
forward as enforceable conditions; and every provider operational property
remains an unproven, mandatory pre-production proof obligation (§12).

Until that merge, gate #8 remains OPEN / HELD, D.1(ii) unresolved, full D.1 not
satisfied, D.2 not started, and MVP-2 open.

---

## 22. Audit checklist

- [ ] **Four-file scope, one new file.** The complete base-to-head diff changes
      exactly `docs/decisions/ADR-049Q-railway-postgresql-canonical-store-host-acceptance-and-implementation-authorization.md`
      (new), `docs/decisions/ADR-022E-phase-22-deferred-features.md`,
      `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md`,
      and `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md`;
      this ADR is the only newly created file.
- [ ] **Base and ancestry exact.** The lane base is
      `77030a93ec2dddef5a96a7a7e047a009043252d5` — the merge commit of PR #119 —
      and the head descends from it with no other parent.
- [ ] **Title carries the phase label.** The H1 contains `Phase 49Q`.
- [ ] **Pending-signature status unambiguous.** The status banner and §1 state
      that every §6 decision is effective only on operator-authorized merge, and
      that neither Claude, the PR, a Codex `ACCEPT`, nor merge eligibility is an
      operator signature.
- [ ] **Evidence bound exactly.** Phase 49P PR #119 at
      `77030a93ec2dddef5a96a7a7e047a009043252d5`; Finn PR #258 at
      `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3`; Dixie PR #255 at
      `d36c0846f03bfd097d35dd2c001de19eec817cf0`; sibling claims cited by
      document and section at those SHAs (§4).
- [ ] **Evidence versus acceptance preserved.** §5 keeps sibling evidence, intake,
      drafting, audit, operator merge, implementation, and MVP acceptance as
      distinct steps.
- [ ] **Four transitions kept separate.** Host acceptance, implementation
      authorization, production admission, and product/MVP acceptance are
      distinguished in §3, §5, §6, §8.3, §13, §14, and §16.
- [ ] **Gate #8 discharge bounded and derived.** §8.1 maps each of the trigger's
      three conjuncts at a stated grain limit; §8.2 lists what the discharge
      reaches; §8.3 lists what it does not.
- [ ] **D.1 / D.2 relations proven from merged authority.** D.1(i) ACCEPTED
      (`ADR-048B:108`–`:109`); D.1(ii) is the host dependency (`:110`–`:113`);
      the conjunction rule (`:129`–`:130`); D.2 downstream and D.1 not gated on
      D.2 (`:131`–`:132`); R1 as the resolution path (`:274`).
- [ ] **D.1(ii)-resolved-while-#9/#10-held argued, not assumed.** §7.2 states the
      different-surfaces argument and shows none of gate #9's or #10's trigger
      conjuncts is satisfied.
- [ ] **ADR-048B evidence bar met, not skipped.** §8A dispositions all of R1–R8
      (`ADR-048B:274`–`:281`) and all five §9 closure-readiness criteria
      (`:293`–`:307`), marking R6 as carried rather than completed, and bounding
      R2 and R3 to what the record actually supports.
- [ ] **ADR-048B §11 carriage explicit.** §8A names which of the eighteen
      non-authorizations (`ADR-048B:362`–`:379`) are superseded (items 1, 3, 4, 5,
      bounded) and which remain — including item 14, Lane-2 canonical
      Straylight-store migrations, which stays unauthorized.
- [ ] **Before/after matrix complete.** §7.1 covers gate #8, gates #9 / #10,
      D.1(i), D.1(ii), full D.1, D.2, MVP-2, semantic owner, physical host,
      authorized implementation scope, production authorization, and blockers
      B-1…B-11.
- [ ] **All ten §9.1 clauses carried.** §9 locates each clause by its ADR-049
      line and names where it is enforced; none is weakened.
- [ ] **All fourteen P-1…P-14 obligations carried.** §10 locates each by its
      Phase 49P line and names where it binds; none is weakened.
- [ ] **Phase 50A scope exhaustive and bounded.** §13.1 lists exactly the nine
      authorized capabilities; §13.2 bounds them; §13.3 lists what Phase 50A does
      not authorize.
- [ ] **Phase 50B boundary fixed.** §14 keeps Phase 50B unauthorized,
      unscheduled, unscoped, and unprejudged, and separates delivery from
      acceptance.
- [ ] **No provider overclaim.** §12 records every provider property as unproven
      and mandatory; no sentence anywhere asserts a proven provider operational
      fact.
- [ ] **No production authorization.** §8.3, §12, §13.3, §16, and §19 refuse
      production admission, writes, migration execution, rollout, credentials,
      and living-estate admission.
- [ ] **Authority boundaries correct.** §17 records the sole operator authority
      and denies authority to Claude, Codex, Flatline, Bridgebuilder, maintainers,
      sibling owners, labels, and the control plane; no new authority is created.
- [ ] **Historical annotations non-destructive.** §20 and the three annotated
      files show original text preserved verbatim, annotations appended at
      end-of-file, existing `file:line` cross-references unshifted, and each
      annotation conditioned on operator merge.
- [ ] **Citations resolve.** Every `file:line`, relative link, section reference,
      result token, PR number, and exact SHA resolves against the bound commits.
- [ ] **No leak.** No credential, token, key, connection string, database URL,
      endpoint, hostname, port, account or project identifier, region, topology
      detail, environment value, command or API example, pricing figure, or
      deployment step appears.
- [ ] **No sibling mutation, no self-audit, no merge.** No sibling repository is
      modified; the drafter did not audit its own work; nothing is merged.

---

*End of Phase 49Q ADR. Docs-only Tier-1 decision record, **pending operator
signature**. On operator-authorized merge it accepts Railway PostgreSQL as the
bounded, reversible MVP-2 canonical-store physical host, preserves
`loa-straylight` as the permanent canonical semantic owner, discharges ADR-022E
gate #8 only for bounded host selection and for opening the provider-neutral
durable-storage implementation lane, resolves D.1(ii) and satisfies full D.1 while
keeping D.1(i) accepted, authorizes D.2 to start in Phase 50A without starting or
completing it, keeps MVP-2 OPEN, keeps gates #9 and #10 HELD at
`PARTIAL_RECORDED`, keeps Finn's `TIER_TRUST_MAP` and `CRITICAL_ACTIONS` findings
UNRESOLVED, defers any Dixie boundary requirement until a substrate contract
exists, bounds Phase 50A to the nine capabilities in §13.1, and leaves Phase 50B
unauthorized. It establishes no provider fact, authorizes no production admission,
transfers no semantic ownership, edits no sibling repository, creates no new
Straylight authority, and merges nothing.*
