# ADR-048B — Phase 48B: canonical-store physical-host ownership / sibling-gate routing

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate
> semantic owner.
> **Phase**: **Phase 48B** — canonical-store **physical-host ownership** and
> **sibling-gate routing** decision frame.
> **Status**: **docs / decision-only.** This ADR owns the *decision frame* for the
> canonical-store physical-host ownership and the #9 / #10 sibling-gate routing question.
> It selects **no** canonical-store physical host, RESOLVES neither sibling gate #9 nor
> #10, does **not** SATISFY D.1, does **not** START D.2, does **not** DISCHARGE ADR-022E
> gate #8, and does **not** CLOSE MVP-2. No source, test, runtime, route, route handler,
> storage, store code, DB write, migration, auth/consent/signer, validator, schema,
> fixture/vector JSON, config, env, package, lockfile, CI, generated, dist/build, hidden
> workflow, memory, grimoire, `.claude`, or sibling-repo change is made or authorized.
> See §11 for the full non-authorization list.

---

## Naming note (preface)

The Phase 48A request packet (§10) suggested a placeholder filename `ADR-023-…`. That
placeholder does **not** match the live `docs/decisions/` convention, in which the ADR
number tracks the **phase** that produced it (e.g. `ADR-030` = Phase 30, `ADR-029B` =
Phase 29B) and the slug is lowercase-kebab. This ADR therefore lands as
`ADR-048B-canonical-store-physical-host-ownership-routing.md` (Phase 48B), preserving the
phase-tracking numbering. `docs/decisions/` has **no** index/register file, so no index
update is required or performed (verified by inspection).

---

## 1. Status and scope

- **In-`loa-straylight`, docs/decision-only.** The only change on this branch is this one
  new Markdown document under `docs/decisions/`. No file under `src/`, `tests/`,
  `scripts/`, `fixtures/`, `dist/`, `dist-types/`; no `package.json` /
  `package-lock.json` / `exports` / runtime allowlist; no schema / config / env / CI /
  generated / hidden / memory / `.claude` / `.loa` / grimoire / sibling-repo path is
  touched.
- **Decision frame, not resolution.** Phase 48A *requested and structured* the sibling-gate
  #9 / #10 resolution work and selected Phase 48B as the next lane (Option C: route the
  host-selection / sibling-gate-routing **decision frame** into a `loa-straylight` ADR).
  This is that ADR. It **owns the decision frame** — what the surfaces are, what evidence a
  closure attempt must carry, who must accept which lane, and what the safest next lane is —
  and stops there. It does **not** select a host and does **not** assign final
  implementation ownership of any sibling lane.
- **No production authorization of any kind** (§11).
- **Conservative by construction.** Where this ADR could either (a) decide something the
  semantic owner is entitled to decide on the doc side, or (b) reach into a selection /
  ownership / wiring decision that requires sibling-owner acceptance or a production gate,
  it does (a) and explicitly refuses (b).

---

## 2. Source hierarchy (authority vs evidence)

This ADR is bound by the repo's source hierarchy
([`../product-context/source-hierarchy.md`](../product-context/source-hierarchy.md):3-27)
and the architecture spec's own ranked hierarchy
([`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md):11-18,
§0.1). Applied here, in descending authority:

1. **Doctrine / architecture (authority for canonical semantics).** The doctrine layer
   (the `README.md` doctrine + the named `straylight-product-doctrine.md`) and the
   product+system architecture spec are source-of-truth for canonical Straylight primitive
   semantics. The spec is explicit that **doctrine is normative** while research handoffs
   and repo-verification evidence are **not authority**: handoffs "stress-test" Straylight
   but "do not define implementation by themselves," and repo verification "defines what
   exists today" but "does not automatically assign Straylight primitive ownership"
   (`source-hierarchy.md`:21-27;
   [`arch-spec`](../architecture/loa-straylight-product-system-architecture-spec.md):18).
   The canonical assertion-lifecycle / recall / signer / receipt-audit / storage-adapter
   vocabulary lives here, in `src/straylight/`, and in the `ADR-020*` / `ADR-022*`
   decision-locks.
2. **Local decision-locks (authority for the gate inventory).**
   [`ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md) is
   the binding gate inventory: gate **#8** (production database / persistence substrate) at
   `ADR-022E:57`; gate **#9** (Finn runtime wiring) at `ADR-022E:58`; gate **#10** (Dixie
   boundary wiring) at `ADR-022E:59`; gate **#11** (Freeside) at `:60`; gate **#12** (new
   network surface) at `:61`; gate **#20** (threat-model widening) at `:69`.
3. **Phase 48A (immediate routing-request predecessor — authority for *this* lane's
   mandate).** [`../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md)
   selected Phase 48B (Option C) and recorded the mandate this ADR discharges: own the
   host-selection / sibling-gate-routing decision frame on the semantic-owner side, without
   resolving #9 / #10 (Phase 48A §7, §10).
4. **Dixie Phase 47Z and the Phase 47T–47Y chain (evidence of the blocked state, NOT
   authority).** The Dixie chain — Phase 47Z `NOT READY / HELD` (merged via `loa-dixie`
   PR #201), posture `BLOCKED_FOR_HUMAN_ROUTING`, the `D.1` conjunct decomposition, the
   `D.2–D.14` enumeration, the six-MVP roadmap framing, and `MVP-2` — is **Dixie-side
   evidence** carried here labeled as such. It is evidence of *why the corridor is blocked*;
   it is **not** authority for Dixie to resolve canonical-store host ownership alone. This
   ADR neither coins nor re-owns those constructs.

> **Evidence-bound rule.** Every repo fact in this ADR is either (a) cited to a
> `loa-straylight` `file:line`, or (b) explicitly labeled as Dixie-side Phase-47 evidence to
> be confirmed by the owning repo. Where local evidence does not prove a claim, this ADR
> says so and defers to human / code-owner routing.

---

## 3. Problem statement

ADR-022E gate **#8** (production database / persistence substrate, `ADR-022E:57`) remains
**HELD** — its trigger requires "A separate ADR [that] proposes the production adapter,
cites the relevant sibling-repo handoff packet, and preserves the ADR-022D receipt and
audit-chain invariants" (`ADR-022E:57`). The upstream Dixie Phase 47-chain reports that
gate #8's discharge depends on a two-part (conjunctive) closure condition it labels **D.1**:

- **D.1 conjunct (i)** — **ACCEPTED** in the Dixie chain and **MUST NOT be reopened** by
  this ADR (carried as Dixie-side evidence; not re-adjudicated here).
- **D.1 conjunct (ii)** — the **canonical-store physical-host dependency** — remains
  **UNRESOLVED**, externally held under the sibling gates the Dixie chain numbers **#9 /
  #10**, mapping to ADR-022E gate #9 (Finn runtime wiring, `:58`) and gate #10 (Dixie
  boundary wiring, `:59`) — the in-table siblings of gate #8
  (Phase 48A §3, `../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`:75-81).

Consequently:

- **No canonical-store physical host is SELECTED.** There is no `loa-straylight` decision
  record selecting a production durable-storage physical host. `InMemoryStorage` /
  `JsonlStorage` remain the only MVP adapters behind the `StorageAdapter` swap-in seam
  (ADR-022D:69-82; reaffirmed in
  [`../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md`](../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md):248-251).
- **The endpoint-host placement is a DIFFERENT surface and does not close conjunct (ii).**
  ADR-024B placed Dixie as the MVP recall-wedge **endpoint host** (recall-pack-inspection),
  but did so docs-only, wiring nothing, and that selection is the *endpoint* surface — not
  the canonical-store **physical host** (durable persistence substrate) governed by gate #8
  (ADR-024B:6-17; ADR-022B:190-191 "ADR-022B is the *criteria*, not the *placement*").
  Conflating the two would be an overclaim.
- **Full D.1 is NOT YET SATISFIED.** Conjunct (i) ACCEPTED + conjunct (ii) UNRESOLVED ⇒ the
  conjunction does not hold.
- **D.2 sequencing.** D.2 is downstream of full D.1; full D.1 is **not gated on** D.2. No
  start of D.2 is authorized until full D.1 is independently SATISFIED.
- **ADR-022E gate #8 remains OPEN (NOT DISCHARGED). MVP-2 remains OPEN.**

The blocker is therefore a **Straylight-semantics-owning question entangled with sibling-gate
placement** (#9 Finn-runtime, #10 Dixie-boundary): without a host-selection / ownership-
routing **decision** — explicitly including a *no-host* decision — D.1 conjunct (ii) cannot
close, so full D.1 cannot close, so D.2 cannot start. This ADR exists to own that decision
frame on the semantic-owner side.

---

## 4. The six surfaces (kept distinct, never collapsed)

The canonical-store physical-host question entangles six surfaces. The architecture spec's
own four-way ownership split (§6.2.1–§6.2.4) and the
[`../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md`](../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md)
row O storage/audit-primitive boundary require that these stay **separable in code, in test,
and in fixture** — "Collapsing any two of them re-creates a known failure mode"
([`finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md):18-20). Routing the
host-selection decision must preserve every one of these boundaries.

| # | Surface | Owner today | Citable anchor | Must not become |
|---|---------|-------------|----------------|-----------------|
| S1 | **Canonical Straylight semantic ownership** — assertion-lifecycle, recall, signer/keyring, receipt/audit *meaning*, supersession relation, privacy-scope+frame projection. | `loa-straylight` (permanent). | ADR-020A:45-54; ADR-022A:62-71; arch-spec §16.1 :1791-1797 ("Must not own" column); `finn-runtime-boundary.md`:14 ("loa-straylight permanently"). | A property of whichever repo hosts the bytes. |
| S2 | **Canonical-store physical host** — the durable persistence substrate for canonical primitives. | **UNSELECTED.** Gate #8 HELD. | `ADR-022E:57`; Phase 48A:85-89; Admission-Wedge:248-251. | Silently selected, or conflated with the endpoint host (S5). |
| S3 | **Schema / protocol substrate** — class validation, conformance vectors, schema `$id`s. | `loa-hounfour` (substrate only). | ADR-022C:54-63, :83-87; ADR-024A:50-56, :93-115; arch-spec §6.2.2 (Hounfour "should not own runtime policy enforcement by itself"). | Runtime, storage, or Straylight-semantic owner. |
| S4 | **Runtime enforcement / audit surface** — policy evaluation, competence, transition execution, receipt emission, audit-chain persistence. | `loa-finn` candidate (the wedge owns it in-process until Finn ships). | ADR-022D:97-127; `finn-runtime-boundary.md`:12-16; README:669-679 (Dixie runtime subpath is "a pre-Finn MVP exception, **not** a permanent lane transfer"). | The canonical *semantic* owner (S1). It EMITS the receipt the wedge DEFINES. |
| S5 | **Dixie route-side ingress / control-plane records** — candidate intake record, idempotency cache, refusal log, HTTP wire envelope, `tenant_id` binding. | `loa-dixie` (route-side / control-plane only). | Admission-Wedge row O :153, row G :145, row J :148; ADR-026D:318-327; ADR-026C:133-136. | The canonical store (S2), nor the semantic owner (S1). |
| S6 | **Future implementation lanes** — the actual wiring of any of S2–S5 in a sibling repo. | Unopened; each opens only on explicit owner acceptance under teammate review. | `cross-repo-handoff-index.md`:7-10, :518-543; `dixie-governed-recall-boundary.md`:388, :601-610. | Opened by this ADR, or by the canonical owner unilaterally binding a sibling. |

> **Anti-collapse spine.** S1 (semantics) is the load-bearing invariant: per arch-spec
> §6.2.1 :452-454, if Hounfour/Finn/Dixie/Freeside "silently becomes semantic owner, the
> architecture will confuse substrate with doctrine." Renaming the repo a primitive lives in
> "does not transfer ownership" (ADR-020A:100-102). **A canonical-store physical host (S2) is
> a substrate placement; it never moves S1.** This is the structural guarantee E2 (§6)
> enforces.

---

## 5. Decision options

| Option | Description | Posture |
|--------|-------------|---------|
| **A** | **`loa-straylight` owns the canonical-store host-selection ADR**, and routes implementation evidence lanes (S6) only **after** the relevant sibling owners ACCEPT. The host-selection *decision frame* stays with the semantic owner. | Conservative; keeps S1 structurally protected (Phase 48A Option C). |
| **B** | **Defer host selection** until the Finn (#9), Dixie (#10), and — if schema-implicated — Hounfour owners explicitly ACCEPT or REFUSE candidate evidence lanes. | Conditional; no lane opens without recorded owner acceptance (Phase 48A E8 / Option B). |
| **C** | **Select candidate downstream repos** (name the candidate repos for each lane) **without** selecting a physical host. | Bounded; names routing candidates, selects no S2 host. |
| **D** | **Select a canonical host now.** | **Rejected** on current evidence (no proof a host can be selected safely / non-implementation; would risk discharging gate #8). |
| **E** | **Stop and re-plan the six-MVP sequencing** before further ADR-022E gate #8 work (Dixie-side six-MVP roadmap evidence). | Strongest stop; halts the corridor pending a roadmap re-plan. |

### Recommended decision (conservative): **A + C, with B governing every lane-open; D and E NOT selected**

This ADR **decides**, as the semantic owner is entitled to on the doc side:

1. **(Option A)** `loa-straylight` **owns the canonical-store host-selection / sibling-gate-
   routing decision frame.** Host-selection authority belongs with the semantic owner
   (ADR-020A:45-54; ADR-022A:62-71; arch-spec §6.2.1 :452-454). This ADR is the home of that
   frame. **It does not thereby assign runtime/storage *implementation* ownership** to
   `loa-straylight` or anyone else — implementation ownership of S2/S4/S5 remains a separate,
   sibling-accepted, separately-gated decision (S6).
2. **(Option C)** It **names candidate repos** for each evidence lane (§7) **without
   selecting a physical host (S2).** Naming a candidate is routing, not selection: gate #8
   stays HELD and no durable host is chosen.
3. **(Option B)** **No evidence lane opens without recorded owner acceptance (E8).** The
   canonical owner cannot unilaterally bind `loa-finn`, `loa-dixie`, or `loa-hounfour`
   (`cross-repo-handoff-index.md`:518-543; `dixie-governed-recall-boundary.md`:388,601-610).
   Each accepted lane proceeds in its own repo under teammate review.

**Option D is NOT selected.** No local evidence proves a canonical-store physical host can be
selected *safely and fully non-implementation* today. Selecting one would (a) require
satisfying the gate #8 trigger (production adapter proposal + handoff citation + ADR-022D
invariant preservation, `ADR-022E:57`) and (b) cross out of docs-only into a production
posture this lane forbids (§11). The **default is no host selection.**

**Option E is NOT selected.** There is no local signal that the host-selection *framing* is
premature or that the corridor must stop pending a six-MVP re-plan. E is recorded so a human
can choose it if Dixie-side roadmap evidence warrants — but this ADR does not select it.

> This decision **owns a frame and routes**; it RESOLVES nothing. Gate #8 stays OPEN, #9 / #10
> stay HELD until separately RESOLVED, D.1 stays NOT YET SATISFIED, D.2 stays not-started, and
> every §11 non-authorization holds.

---

## 6. The no-silent-delegation guarantee (E2), made structural

The single rule that makes Option A safe is **E2: canonical Straylight semantics (S1) are
NOT silently delegated to Dixie / Finn / Hounfour by selecting where the bytes live.** This
ADR records *why* selecting (or routing toward) a canonical-store host cannot move S1:

- **Ownership does not follow location.** "Renaming the repo a primitive lives in does not
  transfer ownership" (ADR-020A:100-102); the MVP host "is a **persistence / exposure
  surface** ... it is **not** their semantic owner" (ADR-022D:106-107).
- **Substrate events are not ownership events.** A schema-shipping event (Hounfour v8.6.0
  `Challenge`; PR #116 prefix/conformance registration) is "a substrate event, not a transfer
  of ownership" (ADR-022A:49-53; ADR-024A:50-56, :93-115). A host-selection decision is even
  weaker evidence and likewise cannot move S1.
- **Runtime/audit enforcement (S4) is not semantic ownership (S1).** Finn "EMITS the receipt
  the wedge DEFINES"; a host that re-mints receipts, skips class-before-policy, surfaces
  challenged/revoked material as usable, or serves an unverified chain "is rejected"
  (ADR-022D:122-127).
- **Dixie route-side records (S5) are not the canonical store (S2).** The substrate-vs-ingress
  boundary is explicit: Dixie owns "candidate intake record, idempotency cache, refusal log,
  the HTTP wire envelope" and `tenant_id` (host-layer, not a wedge primitive); the canonical
  store holds `Assertion`/`EstateTransition`/`TransitionReceipt`/`AuditEvent` and the
  supersession relation (Admission-Wedge row O :153, row G :145, row J :148).
- **Migration of S1 ownership requires its own ADR.** Any future semantic-ownership migration
  "is a SEPARATE ADR that must cite the upstream evidence and the local boundary preservation
  test(s)" (ADR-020A:92-95; ADR-024A:179-184). This routing ADR effects no such migration.

---

## 7. Sibling-gate routing (candidate lanes; open only on explicit acceptance)

This ADR routes the #9 / #10 (and conditional Hounfour) **evidence lanes to candidate repos**.
Routing names *where the work would land if accepted*; it does **not** open the lane, assign
final ownership, or bind any sibling. Each lane opens only on **recorded owner acceptance
(E8)** under teammate review, and proceeds as a separate PR in the owning repo
(`cross-repo-handoff-index.md`:7-10, :518-543).

| Lane | Candidate repo | Owns (if accepted) | Opens only when | Status |
|------|----------------|--------------------|-----------------|--------|
| **Gate #9 — runtime evidence lane** | `loa-finn` (candidate) | Runtime / enforcement placement (S4): whether and under what trigger Finn becomes the runtime-enforcement host, and whether any portion of the canonical-store enforcement boundary is realized in a Finn-runtime lane. Gate #9's own trigger (`ADR-022E:58`) names three conjuncts: (a) issue-#70 feedback or teammate approval, (b) an ADR-022B-criteria placement ADR selecting Finn, (c) the `loa-finn` PR under teammate review. | The Finn owner explicitly ACCEPTS (E8). | **HELD.** |
| **Gate #10 — Dixie-boundary evidence lane** | `loa-dixie` (candidate) | Route-side ingress / control-plane boundary (S5): the boundary between Dixie route-side records and the canonical store, and whether **broad** Dixie boundary wiring is authorized **beyond** the narrow recall-intake slice. (ADR-026D narrowly unblocked gate #10 **for the single recall-intake endpoint only**, gate #8 still HELD; broad boundary remains held — ADR-026D:563-566.) | The Dixie owner explicitly ACCEPTS (E8). | **HELD** (broad); narrow recall-intake slice already authorized by ADR-026D and NOT widened here. |
| **Schema/substrate lane** | `loa-hounfour` (candidate) | Schema/protocol substrate only (S3) — never Straylight semantics, never runtime/storage. | Evidence **implicates** a schema/protocol change **and** the Hounfour owner accepts; adoption requires a separate ADR citing the upstream `$id` + alias path + boundary-preservation test (ADR-022C:64-71; ADR-024A:179-184). | **Out of scope here.** Route only if evidence implicates schema/protocol. |
| **Host-selection decision frame** | `loa-straylight` | The host-selection / sibling-gate-routing **decision frame** and the E2 (no-silent-delegation) guarantee. | — (owned here). | **This ADR.** Retains S1 + decision-frame ownership unless a later accepted ADR changes it. |

> **`loa-straylight` retains canonical semantic (S1) and host-selection decision-frame
> ownership** unless and until a later accepted ADR (with its own evidence + sibling-repo PR
> under teammate review) changes it. Naming Finn / Dixie / Hounfour as *candidates* does not
> bind them and does not move S1.

---

## 8. Evidence required before full D.1 can close

A future attempt to close gate #8 / SATISFY D.1 conjunct (ii) — in whatever repo it lands —
must carry **all** of the following. This is the *input* checklist for a later
**D.1 closure-readiness gate** (§9 defines its acceptance criteria); it is **not** a closure
and nothing below is performed here.

| # | Required evidence | Why load-bearing |
|---|-------------------|------------------|
| R1 | An explicit **host-routing decision** for the canonical-store physical host, recorded in the owning repo. A **host-selection / production-adapter proposal** may become closure-relevant evidence toward the gate #8 trigger (`ADR-022E:57`) **only if separately accepted** under that trigger (which requires a *proposed production adapter*). A **no-host decision** is a *negative routing outcome*: it documents that no host is selected, preserves gate #8 **OPEN / HELD**, and **blocks D.1 closure** — it does **not** satisfy the gate #8 trigger. | Conjunct (ii) *is* the physical-host dependency. Only a separately-accepted production-adapter proposal can satisfy the gate #8 trigger; a no-host decision records a negative outcome and keeps gate #8 OPEN / HELD, blocking D.1 closure. |
| R2 | **Sibling-gate owner ACCEPTANCE or REJECTION** for #9 (runtime) and #10 (boundary), recorded in their own repos under teammate review (E8). | Routing without recorded owner acceptance re-introduces the "Dixie alone resolves it" fallacy this corridor rejects (`cross-repo-handoff-index.md`:518-543). |
| R3 | **Proof that canonical Straylight semantics (S1) are NOT silently delegated** to Dixie / Finn / Hounfour (E2). | ADR-020A:45-54 / ADR-022A:62-71 keep Straylight the semantic owner; a storage host must not become the de-facto semantic owner. |
| R4 | A clear **boundary between the canonical store (S2) and Dixie route-side ingress / control-plane records (S5)**. | Admission-Wedge row O :153 + ADR-026C/026D distinguish substrate semantics from Dixie ingress; the boundary must survive any host selection. |
| R5 | A clear **boundary between runtime/audit enforcement (S4) and semantic ownership (S1)**. | Finn-runtime enforcement (#9) and the audit chain must not absorb or redefine canonical semantics (ADR-022D:106-107, :122-127). |
| R6 | The **migration / storage / adapter implications** against the ADR-022D receipt and audit-chain invariants and the `StorageAdapter` seam. | Any production adapter must preserve the receipt + audit-chain invariants pinned at `tests/phase-5-hardening.test.ts` (ADR-022D:111-120, :170-174; gate #8 trigger `ADR-022E:57`). |
| R7 | An explicit **non-production-posture** statement: evidence of a viable host does not, by itself, authorize production; the production lane stays independently gated (§11). | Host-selection evidence must not be mistaken for production authorization. |
| R8 | An explicit statement that **no start of D.2** follows until full D.1 is independently SATISFIED, plus a D.1 → D.2 dependency note that downstream phases cannot silently invert. | D.2 is downstream of full D.1; full D.1 is not gated on D.2 (§3). |

> None of R1–R8 is performed here. They are the evidentiary bar a *future* closure-readiness
> gate must clear; this ADR only enumerates them and routes who must produce each.

---

## 9. Acceptance criteria for a later D.1 closure-readiness gate

The future work that any opened lane (§7) triggers must, before a gate-#8 closure attempt may
be *evaluated*, produce **all** of:

1. **A host-routing decision** for the canonical-store physical host (R1) — recorded in the
   owning repo. A **host-selection / production-adapter proposal** becomes closure-relevant
   evidence toward the `ADR-022E:57` trigger **only if separately accepted** under that trigger
   (which requires a *proposed production adapter*); an explicit **no-host decision** is a
   *negative routing outcome* that keeps gate #8 **OPEN / HELD** and **blocks D.1 closure**, and
   does **not** satisfy the `ADR-022E:57` trigger.
2. **Owner acceptance or rejection** from the #9 (runtime) and #10 (boundary) lane owners
   (R2), recorded in their own repos under teammate review.
3. **A D.1 → D.2 dependency matrix** making the sequencing explicit (D.2 downstream of full
   D.1; full D.1 not gated on D.2) so no downstream phase silently inverts it (R8).
4. **A forward-copied non-authorization list** (§11) the future work re-affirms, so
   host-selection evidence cannot be mistaken for production authorization (R7).
5. **The pass/fail bar itself** — the precise, checkable criteria (built on R1–R8) a future
   gate-#8 closure attempt must clear. This ADR defines the *inputs*; the future closure-
   readiness gate defines the *verdict*.

> A "closure-readiness" gate is **not** a closure. Even a fully-populated R1–R8 packet leaves
> gate #8 OPEN until a separate, owner-accepted, production-gated ADR DISCHARGES it.

---

## 10. Next-lane recommendation

> **Recommended next lane: `Phase 48C — host-selection candidate matrix / no-host decision
> packet` (in `loa-straylight`, docs/decision-only).**

Two candidate next lanes were considered:

- **Phase 48C (alt-1): sibling-gate #9 runtime-evidence owner-acceptance request**, likely
  `loa-finn` — open the #9 lane first. **Not selected** as the immediate next step: this ADR
  does **not** decide to route #9 first, because opening a sibling lane requires recorded
  owner acceptance (E8 / Option B) that does not yet exist, and the canonical owner cannot
  prefetch it (`dixie-governed-recall-boundary.md`:601-610).
- **Phase 48C (recommended): host-selection candidate matrix / no-host decision packet** in
  `loa-straylight`, docs/decision-only — enumerate the candidate-host shapes (and the
  *no-host* option) against R1–R8 and the gate #8 trigger, **without selecting one**, so the
  human / code-owner has a structured matrix to route from.

**Why the matrix lane is safest.** It stays on the semantic-owner side (no sibling binding),
stays docs-only (no production posture), and produces exactly the structured input a later
owner-accepted lane or human routing decision needs — while keeping the **default of no host
selection** intact. It defers the owner-acceptance-dependent #9 / #10 lane-opens (Option B)
to the point where acceptance is actually recorded.

**Repository routing (pending human / code-owner confirmation):**

| Lane | Likely repo | Owns | Status |
|------|-------------|------|--------|
| Phase 48C host-selection candidate matrix / no-host decision packet | `loa-straylight` | The candidate matrix; the no-host default; R1–R8 structuring | Recommended; not yet opened |
| Gate #9 runtime evidence lane | `loa-finn` (candidate) | Runtime / enforcement placement (#9) | HELD; opens only on owner acceptance (E8) |
| Gate #10 boundary evidence lane | `loa-dixie` (candidate) | Route-side ingress / control-plane boundary (#10) | HELD (broad); opens only on owner acceptance (E8) |
| Substrate-schema dependency (if implicated) | `loa-hounfour` (candidate) | Substrate schema only — never Straylight semantics | Out of scope here; route only if evidence implicates it |

**PR title format (future).** Any follow-on PR title **must include the phase label**, e.g.:

- `Phase 48C: host-selection candidate matrix / no-host decision packet`
- `Phase 48C (loa-finn): gate #9 runtime placement evidence lane` *(only if the Finn owner accepts)*
- `Phase 48C (loa-dixie): gate #10 boundary evidence lane` *(only if the Dixie owner accepts)*

Prefer **medium bounded slices** for Phase 48C where safe — the corridor is moving through a
multi-MVP roadmap — **but** Phase 48C remains docs/decision-only and authorizes none of §11.

---

## 11. What this ADR does NOT authorize

This Phase 48B ADR **does not authorize** any of the following. Each remains blocked and is
listed so a reviewer can refuse scope creep at the gate:

1. canonical-store physical-host selection;
2. sibling gate #9 / #10 resolution;
3. D.1 satisfaction;
4. the start of D.2 work;
5. ADR-022E gate #8 discharge;
6. MVP-2 closure;
7. production DB execution;
8. production DB writes;
9. production migration execution;
10. production durable storage;
11. production auth / consent / signer implementation;
12. route / API behavior changes;
13. Freeside runtime / client integration;
14. Lane-2 canonical Straylight-store migrations;
15. route-contract freeze;
16. final-schema freeze;
17. production-readiness of any kind;
18. any `aw_*` SQL production-safe claim.

Additionally, this ADR does **not**:

- treat Dixie as the canonical semantic owner (Dixie owns route-side / control-plane records
  only — Admission-Wedge row O :153);
- treat Finn runtime / audit ownership as canonical semantic ownership (Finn EMITS what the
  wedge DEFINES — ADR-022D:106-107);
- treat Hounfour schema substrate as runtime / storage ownership (Hounfour is schema/protocol
  only — ADR-022C:83-87; ADR-024A:50-56);
- assign runtime / storage *implementation* ownership to any repo (it owns only the
  *decision frame* — §5, recommended-decision item 1);
- widen the narrow recall-intake gate #10 slice already authorized by ADR-026D, nor open the
  broad Dixie boundary (ADR-026D:563-566);
- open any sibling lane absent recorded owner acceptance (E8).

> **No production-readiness claim.** Owning the host-selection / sibling-gate-routing decision
> frame clarifies *who decides what, on what evidence, and which lane is safest next*; it does
> **not** clear the independent production gates. Gate #8 stays OPEN, gates #9 / #10 stay HELD,
> gate #11 (Freeside, `ADR-022E:60`) and gate #12 (new network surface, `ADR-022E:61`) stay
> HELD, and the threat-model-widening discipline (gate #20, `ADR-022E:69`) is untouched.

---

## 12. Independent-auditor checklist (for Codex)

An independent auditor should be able to confirm **every** line below by inspection of this
ADR and the cited `loa-straylight` files. Each is a verifiable claim:

- [ ] **Single-file change.** The branch adds exactly one new file,
      `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md`, and
      changes nothing else (verify via `git status --porcelain=v1 --untracked-files=all`).
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `fixtures/`,
      `dist/`, `dist-types/`, `package.json`, `package-lock.json`, `.github/`, `.claude/`,
      `.loa/`, `grimoires/`, or any sibling repo.
- [ ] **Title carries the phase label.** The H1 contains `Phase 48B`.
- [ ] **Gate citations are real.** ADR-022E gate #8 = `ADR-022E:57`, gate #9 = `:58`, gate
      #10 = `:59`, gate #11 = `:60`, gate #12 = `:61`, gate #20 = `:69` resolve to the actual
      rows in [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md);
      gate #8 / #9 / #10 are HELD.
- [ ] **No overclaim.** No affirmative claim that D.1 is SATISFIED, gate #8 is DISCHARGED,
      MVP-2 is CLOSED, a host is SELECTED, #9 / #10 are RESOLVED, D.2 is STARTED, or anything
      is production-ready. Every such phrase appears only inside a negation / non-authorization.
- [ ] **Two host surfaces kept distinct.** The ADR distinguishes the ADR-024B *endpoint-host*
      placement (Dixie, selected, docs-only) from the canonical-store *physical host* (S2,
      UNSELECTED, gate #8 HELD), and never conflates them (§3, §4 row S2).
- [ ] **Six surfaces stay separable.** S1–S6 are listed distinctly with their owners and
      "must not become" boundaries; the anti-collapse spine is stated (§4).
- [ ] **Five options present + conservative recommendation.** Options A–E appear; the
      recommendation is A + C with B governing lane-opens, and D and E are explicitly NOT
      selected (§5).
- [ ] **Decision-frame vs implementation-ownership split.** §5 (recommended-decision item 1)
      states `loa-straylight` owns the *decision frame* and does **not** thereby assign
      runtime/storage *implementation* ownership.
- [ ] **Routing is candidate-only.** §7 routes #9 → `loa-finn`, #10 → `loa-dixie`, schema →
      `loa-hounfour` as *candidates* that open only on owner acceptance (E8); none is bound.
- [ ] **Evidence (R1–R8) and acceptance criteria are enumerated, not performed** (§8, §9).
- [ ] **Next lane is named with phase label + repo routing.** Phase 48C (host-selection
      candidate matrix / no-host decision packet, `loa-straylight`) is recommended over the
      #9-first alternative, with justification (§10).
- [ ] **No silent delegation.** The ADR does not treat Dixie/Finn/Hounfour as canonical
      semantic owners and does not assign implementation ownership (§6, §11).
- [ ] **Non-authorization list is complete.** §11 enumerates all 18 numbered non-authorization
      items plus the additional "does not" clauses.
- [ ] **No secret / connection / host leak.** No connection string, port, credential,
      database-engine product name, or container/orchestration detail appears.
- [ ] **No index edit.** `docs/decisions/` has no index/register file; none is created or
      modified.
- [ ] **No commit / push / PR** was performed by the authoring step.

---

## 13. Coverage ledger (verified)

Each required content item maps to a section; counts were verified against this document
before publication.

| Req. item | Requirement | Where | Verified |
|-----------|-------------|-------|----------|
| 1 | Title includes `Phase 48B` | H1 | ✅ |
| 2 | Status: docs/decision-only / canonical-store physical-host ownership + sibling-gate routing ADR | banner, §1 | ✅ |
| 3 | Source hierarchy (doctrine authority; Phase 48A predecessor; Dixie 47Z / 47T–47Y = evidence) | §2 | ✅ (4 ranks) |
| 4 | Problem statement (gate #8 / D.1 / conjunct (i) accepted, (ii) unresolved; no host SELECTED; D.2 downstream) | §3 | ✅ |
| 5 | Six distinguished surfaces (S1–S6) | §4 | ✅ (6 surfaces) |
| 6 | Decision options A–E | §5 | ✅ (5 options) |
| 7 | Conservative recommendation (A + C, B governs lane-opens; not D) | §5 | ✅ |
| 8 | Sibling-gate routing (#9 → loa-finn, #10 → loa-dixie, Hounfour conditional, Straylight retains S1) | §7 | ✅ (4 lanes) |
| 9 | Required evidence before D.1 closes (R1–R8) | §8 | ✅ (8 items) |
| 10 | Acceptance criteria for a later D.1 closure-readiness gate | §9 | ✅ (5 items) |
| 11 | Next lane with phase label + repo routing (Phase 48C) | §10 | ✅ |
| 12 | Non-authorizations | §11 | ✅ (18 numbered items) |
| 13 | Independent-auditor checklist | §12 | ✅ (17 lines) |
| 14 | Coverage ledger (only if counts match) | §13 (this table) | ✅ |

**Count verification (exact):**

- Distinguished surfaces in §4: **S1, S2, S3, S4, S5, S6 = 6**.
- Decision options in §5: **A, B, C, D, E = 5**.
- Required-evidence items in §8: **R1–R8 = 8**.
- Acceptance-criteria items in §9: **5**.
- Sibling-gate routing lanes in §7: **4** (#9 Finn, #10 Dixie, Hounfour-conditional,
  Straylight decision-frame).
- Non-authorization numbered items in §11: **18**.
- Auditor checklist lines in §12: **17**.

> The ledger is included **because** these counts were verified to match exactly. If any
> count had differed, this ledger would have been omitted rather than published with a
> mismatch.

---

## 14. Cross-references

- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md) —
  gate inventory: gate #8 (`:57`, HELD), gate #9 (`:58`, HELD), gate #10 (`:59`, HELD), gate
  #11 (`:60`), gate #12 (`:61`), gate #20 (`:69`). Read read-only; **not modified**.
- [`../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md)
  — Phase 48A; the immediate routing-request predecessor that selected this lane (Option C).
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md) /
  [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md) —
  Straylight is the semantic owner (S1); ownership does not follow location (basis for E2 /
  Option A).
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md) /
  [`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md) — the **endpoint-host**
  surface (criteria, then Dixie placement, docs-only); distinct from the canonical-store
  physical host (S2).
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md) /
  [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
  — Hounfour as schema/protocol substrate only (S3); adopt-by-alias, never rename.
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md) /
  [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md) /
  [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md) — receipt
  / audit-chain invariants any production adapter must preserve (S4); persistence + commitment
  root deferred (basis for R5 / R6).
- [`./ADR-026C-dixie-recall-intake-consumer-contract.md`](./ADR-026C-dixie-recall-intake-consumer-contract.md) /
  [`./ADR-026D-dixie-recall-intake-endpoint-authorization.md`](./ADR-026D-dixie-recall-intake-endpoint-authorization.md)
  — the **recall**-intake seam; gate #10 narrowly unblocked for recall-intake only (ADR-026D
  :563-566), gate #8 still HELD; the canonical-store-vs-Dixie-ingress boundary (S5, basis for
  R4).
- [`../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md`](../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md)
  §5.3, §6 (row O), §7 — gate #8 reaffirmed HELD; substrate-vs-ingress storage boundary
  (basis for R4 / E2).
- [`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §0.1, §6.2.1–§6.2.4, §16.1 — doctrine-as-authority; four-surface ownership split;
  "substrate vs doctrine" failure mode; "Must not own" boundaries.
- [`../product-context/source-hierarchy.md`](../product-context/source-hierarchy.md) —
  doctrine/architecture-as-authority, handoffs/evidence-as-non-authority rule (basis for §2).
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md) /
  [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md) /
  [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
  — sibling-repo PRs require teammate review; candidate-lane routing; the owner cannot
  unilaterally bind a sibling (basis for §7 / Option B / R2).
- **Dixie-side (read as evidence, NOT modified):** `loa-dixie` Phase 47T–47Z chain; Phase 47Z
  conclusion `NOT READY / HELD` (PR #201); posture `BLOCKED_FOR_HUMAN_ROUTING`; the `D.1`
  conjunct decomposition, `D.2–D.14` enumeration, six-MVP roadmap, and `MVP-2`. Confirm in the
  owning repo.

---

*End of Phase 48B ADR. Docs/decision-only. This ADR owns the canonical-store physical-host
ownership / sibling-gate-routing decision frame and routes candidate evidence lanes; it
SELECTS no host, RESOLVES no gate, SATISFIES no D.1, STARTS no D.2, DISCHARGES no gate #8,
CLOSES no MVP-2, and authorizes none of the §11 items. No commit, no push, no PR.*

---

## 15. Later status — Phase 49Q (annotation; §1–§14 unchanged)

Everything above is preserved as originally written and **was true when written**.
Phase 48B correctly recorded that it selected no host and authorized none of §11.
This annotation records only which of those bounded items a **later** decision
supersedes, and takes effect **only if** `operator:eileen` authorizes the merge of
[`ADR-049Q`](./ADR-049Q-railway-postgresql-canonical-store-host-acceptance-and-implementation-authorization.md)
(Phase 49Q, Tier 1). Nothing here re-adjudicates Phase 48B or reopens D.1(i).

**Superseded on that merge, for these bounded items only:**

- **§4 row S2** (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:156`) — the canonical-store physical host is no longer
  UNSELECTED: Railway PostgreSQL is accepted as the **bounded, reversible** MVP-2
  canonical-store physical host (ADR-049Q §6.1). The row's own boundary holds
  unchanged: the physical host is a substrate placement, never the semantic owner
  and never conflated with the ADR-024B endpoint host.
- **§11 items 1–5** — canonical-store physical-host selection (1); D.1
  satisfaction (3); the start of D.2 (4); and ADR-022E gate #8 discharge (5) are
  superseded to the exact extent ADR-049Q states: item 3 satisfied via D.1(ii)
  resolution, item 4 **authorized to start** in Phase 50A but not started or
  completed, and item 5 discharged **only** for bounded host selection and for
  opening the provider-neutral durable-storage implementation lane. **Item 2
  (sibling gate #9 / #10 resolution) is NOT superseded** — both gates remain
  HELD at `PARTIAL_RECORDED`.
- **§8 row R1** (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:274`) — the "explicit host-routing decision" it required is
  the decision ADR-049Q records; R1's requirement that a host-selection /
  production-adapter proposal be **separately accepted** under the `ADR-022E:57`
  trigger is what the operator merge supplies (ADR-049Q §8.1).

**Unchanged by that merge:**

- **§4 row S1** (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:155`) — `loa-straylight` remains the **permanent** owner of
  canonical Straylight semantic ownership. A host acceptance does not move it
  (§6, E2).
- **§11 items 6–18** and every additional "does not" clause — including MVP-2
  closure (6), production DB execution (7), production writes (8), production
  migration execution (9), production durable storage (10), and production
  auth/consent/signer implementation (11) — remain **unauthorized**.
- **§3 D.1 conjunct (i)**
  (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:108`–`:109`) — remains ACCEPTED and is **not
  reopened**. **§3's D.2 sequencing rule**
  (`./ADR-048B-canonical-store-physical-host-ownership-routing.md:131`–`:132`) — D.2 downstream of
  full D.1, full D.1 not gated on D.2 — is preserved, not inverted.
- **§4 surfaces S1, S3–S6, §5–§7, §8 rows R2–R8, §9, §12, §13** — unchanged; this
  ADR remains the authority for the decision frame, the six surfaces, the
  candidate-lane routing, and the evidence checklist.

Until that merge, every statement in §1–§14 stands exactly as written: no host is
selected, gate #8 is not discharged, D.1 is not satisfied, and D.2 is not started.
