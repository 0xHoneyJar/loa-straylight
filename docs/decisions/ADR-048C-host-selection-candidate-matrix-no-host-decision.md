# ADR-048C — Phase 48C: host-selection candidate matrix / no-host decision packet

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate
> semantic owner.
> **Phase**: **Phase 48C** — host-selection **candidate matrix** and **no-host / no-selection
> decision** packet.
> **Status**: **docs / decision-only.** This packet evaluates the candidate host/routing
> options against the gate #8 trigger and records the safest docs-only outcome: a
> **no-host / no-selection decision** as a *negative routing outcome*. It SELECTS **no**
> canonical-store physical host, proposes **no** production adapter, RESOLVES neither
> sibling gate #9 nor #10, does **not** SATISFY D.1, does **not** START D.2, does **not**
> DISCHARGE ADR-022E gate #8, does **not** satisfy the `ADR-022E:57` trigger, and does
> **not** CLOSE MVP-2. The no-host outcome keeps gate #8 **OPEN / HELD** and **blocks D.1
> closure** — it does **not** discharge or satisfy anything. No source, test, runtime,
> route, route handler, storage, store code, DB write, migration, auth/consent/signer,
> validator, schema, fixture/vector JSON, config, env, package, lockfile, CI, generated,
> dist/build, hidden workflow, memory, grimoire, `.claude`, `.loa`, or sibling-repo change
> is made or authorized. See §10 for the full non-authorization list.

---

## Naming note (preface)

This packet lands as `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md`,
following the live `docs/decisions/` convention in which the ADR number tracks the **phase**
that produced it (e.g. `ADR-030` = Phase 30, `ADR-029B` = Phase 29B, `ADR-048B` = Phase 48B)
and the slug is lowercase-kebab. It is the direct decision-making successor to
[`./ADR-048B-canonical-store-physical-host-ownership-routing.md`](./ADR-048B-canonical-store-physical-host-ownership-routing.md),
which Phase 48B (§10) explicitly recommended as the next lane.

It lives under `docs/decisions/` — not top-level `docs/` — because Phase 48C **records a
decision** (the no-host / no-selection decision), exactly as ADR-048B did. By contrast the
Phase 48A *request packet*
([`../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md))
*requested and structured* work without deciding, so it lived at top-level `docs/`. Phase 48C
decides, so it is an ADR. `docs/decisions/` has **no** index/register/README file (verified by
inspection: `ls docs/decisions/` shows only ADR files), so no index update is required or
performed; likewise `docs/` has no register requiring an entry.

---

## 1. Status and scope

- **In-`loa-straylight`, docs/decision-only.** The only change on this branch is this one new
  Markdown document under `docs/decisions/`. No file under `src/`, `tests/`, `scripts/`,
  `fixtures/`, `dist/`, `dist-types/`; no `package.json` / `package-lock.json` / `exports` /
  runtime allowlist; no schema / config / env / CI / generated / hidden / memory / `.claude` /
  `.loa` / grimoire / sibling-repo path is touched.
- **A matrix and a decision, not a resolution.** Phase 48B owns the host-selection /
  sibling-gate-routing *decision frame* and recommended this lane: enumerate the candidate-host
  shapes (and the *no-host* option) against R1–R8 and the gate #8 trigger, **without selecting
  one**, so the human / code-owner has a structured matrix to route from (ADR-048B §10). This
  packet builds that matrix, **evaluates** each candidate, and records the safest outcome on the
  evidence available now. It does **not** open a sibling lane, assign implementation ownership,
  or select a host.
- **Negative routing outcome by default.** The strong default — confirmed below — is
  **Candidate E (no-host / no-selection)**. Per ADR-048B §8 R1, a no-host decision is a
  *negative routing outcome*: it documents that no host is selected, preserves gate #8 **OPEN /
  HELD**, and **blocks D.1 closure**. It does **not** satisfy the gate #8 trigger
  ([`ADR-022E:57`](./ADR-022E-phase-22-deferred-features.md)) and does **not** discharge anything.
- **No production authorization of any kind** (§10).
- **Conservative by construction.** Where this packet could either (a) record an evaluation the
  semantic owner is entitled to on the doc side, or (b) reach into a selection / ownership /
  wiring decision that requires sibling-owner acceptance or a production gate, it does (a) and
  explicitly refuses (b).

---

## 2. Source hierarchy (authority vs evidence)

This packet is bound by the repo's source hierarchy
([`../product-context/source-hierarchy.md`](../product-context/source-hierarchy.md):3-27) and
the architecture spec's own ranked hierarchy
([`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md):11-18,
§0.1). Applied here, in descending authority:

1. **Doctrine / architecture (authority for canonical semantics).** The doctrine layer
   (`README.md` doctrine + `straylight-product-doctrine.md`) and the product+system architecture
   spec are source-of-truth for canonical Straylight primitive semantics. The spec is explicit
   that doctrine is normative while "research handoffs and packet synthesis stress-test the
   doctrine. They do **not** redefine Straylight. Repo verification evidence defines what
   currently exists. It does **not** by itself assign Straylight primitive ownership"
   (arch-spec :18; `source-hierarchy.md`:21-27).
2. **Immediate predecessor (controls the decision-frame boundary).**
   [`./ADR-048B-canonical-store-physical-host-ownership-routing.md`](./ADR-048B-canonical-store-physical-host-ownership-routing.md)
   (Phase 48B) is the immediate predecessor and **controls the decision-frame boundary** this
   packet works inside: `loa-straylight` owns the host-selection / sibling-gate-routing decision
   frame *only*; it does **not** own or assign runtime/storage *implementation* ownership; Option
   D (select a host now) was rejected; a no-host decision is a negative routing outcome that
   keeps gate #8 OPEN/HELD (ADR-048B §1, §5, §7, §8 R1, §11). Phase 48C stays strictly inside
   that frame.
3. **Gate-request predecessor.**
   [`../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md)
   (Phase 48A) is the gate-request predecessor that structured the #9 / #10 resolution work and
   selected Phase 48B (Option C). Its E1–E8 evidence list and its conditional-acceptance
   discipline (E8) flow forward into this matrix.
4. **Local decision-locks (authority for the gate inventory).**
   [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md) is the
   binding gate inventory: gate **#8** (production database / persistence substrate) at
   `ADR-022E:57`; gate **#9** (Finn runtime wiring) at `:58`; gate **#10** (Dixie boundary
   wiring) at `:59`; gate **#11** (Freeside) at `:60`; gate **#12** (new network surface) at
   `:61`; gate **#20** (threat-model widening) at `:69`.
5. **Dixie Phase 47Z and the Phase 47T–47Y chain (evidence of the blocked state, NOT
   authority).** The Dixie chain — Phase 47Z `NOT READY / HELD` (merged via `loa-dixie` PR
   #201), posture `BLOCKED_FOR_HUMAN_ROUTING`, the `D.1` conjunct decomposition, the `D.2–D.14`
   enumeration, the six-MVP roadmap framing, and `MVP-2` — is **Dixie-side evidence** carried
   here labeled as such. It is evidence of *why the corridor is blocked*; it is **not** authority
   for Dixie to resolve canonical-store host ownership alone. This packet neither coins nor
   re-owns those constructs.

> **Evidence-bound rule.** Every repo fact in this packet is either (a) cited to a
> `loa-straylight` `file:line`, or (b) explicitly labeled as Dixie-side Phase-47 evidence to be
> confirmed by the owning repo. Where local evidence does not prove a claim, this packet says so
> and defers to human / code-owner routing.

---

## 3. Live gate state (restated, not changed)

This packet **restates** the live state carried forward from Phase 48A / 48B and the Dixie-side
evidence; it changes none of it.

| Item | State entering Phase 48C | Authority / evidence |
|------|--------------------------|----------------------|
| **D.1 conjunct (i)** | **ACCEPTED — not reopened.** Carried as Dixie-side evidence; not re-adjudicated here. | Dixie Phase-47 evidence (ADR-048B §3; Phase 48A §3). |
| **D.1 conjunct (ii)** — canonical-store physical-host dependency | **UNRESOLVED / HELD**, externally held under sibling gates #9 (`ADR-022E:58`) / #10 (`ADR-022E:59`). | ADR-048B §3; Phase 48A §3. |
| **Canonical-store physical host (S2)** | **NONE SELECTED.** `InMemoryStorage` / `JsonlStorage` remain the only MVP adapters behind the `StorageAdapter` swap-in seam. | ADR-022D:69-82, :106-107; Admission-Wedge:248-251. |
| **Full D.1** | **NOT YET SATISFIED.** Conjunct (i) ACCEPTED + conjunct (ii) UNRESOLVED ⇒ the conjunction does not hold. | ADR-048B §3; Phase 48A §3. |
| **ADR-022E gate #8** | **OPEN / HELD** (NOT DISCHARGED). | `ADR-022E:57`; Admission-Wedge:248-251. |
| **Sibling gates #9 / #10** | **HELD.** (#10's *narrow* recall-intake slice was unblocked by ADR-026D for that single endpoint only; the **broad** boundary stays held, gate #8 still HELD.) | `ADR-022E:58`, `:59`; ADR-026D:563-566. |
| **D.2** | **NOT STARTED.** D.2 is downstream of full D.1; full D.1 is **not gated on** D.2. | ADR-048B §3; Phase 48A §3. |
| **MVP-2** | **OPEN.** | Dixie Phase-47 evidence; ADR-048B §3. |

> Nothing in §3 is advanced, satisfied, discharged, resolved, started, or closed by this packet.
> The table is a status restatement only.

---

## 4. The endpoint host is a different surface (anti-conflation)

The single most dangerous error this matrix could make is conflating the **endpoint host** with
the **canonical-store physical host**. They are different surfaces and this packet keeps them
apart:

- **Endpoint host (S5-adjacent placement).** ADR-024B tightened ADR-022B from *criteria* into a
  *placement*: the next MVP recall-wedge **endpoint host** is Dixie (recall-pack inspection),
  but did so **docs-only**, wiring nothing, adding no dependency, opening no Dixie PR
  (ADR-024B:6-17, :90-93). ADR-022B is "the *criteria*, not the *placement*" (ADR-022B:190-191).
- **Canonical-store physical host (S2).** The durable persistence substrate for canonical
  primitives governed by gate #8. **UNSELECTED.** Gate #8 HELD (`ADR-022E:57`;
  Admission-Wedge:248-251).

> **Selecting (or having selected) the endpoint host does NOT close D.1 conjunct (ii) and does
> NOT select the canonical-store physical host.** Conflating the two would be an overclaim. This
> matrix evaluates S2 candidates only; the endpoint-host placement is settled elsewhere and is
> out of scope here.

The six surfaces (S1 semantic ownership; S2 canonical-store physical host; S3 schema/protocol
substrate; S4 runtime enforcement/audit; S5 Dixie route-side ingress/control-plane; S6 future
implementation lanes) are kept distinct exactly as ADR-048B §4 defines them; this packet does
not collapse any two of them. "The lanes are separable in code, in test, and in test fixture …
Collapsing any two of them re-creates a known failure mode" (`finn-runtime-boundary.md`:18-20).

---

## 5. Candidate matrix

Five candidate outcomes are evaluated. Naming a candidate is **routing**, not selection: it
names *where work would land if accepted*; it does not open a lane, bind a sibling, or select a
host (ADR-048B §5 Option C, §7).

| Candidate | Outcome shape | Routing posture |
|-----------|---------------|-----------------|
| **A** | `loa-straylight` canonical semantic package/repo as **decision-frame owner only** — **not** a runtime host. | Owned here; this is the S1 + decision-frame seat, already held (ADR-048B §7). |
| **B** | `loa-finn` runtime evidence lane as a possible **runtime / audit host** candidate (S4), **only if the Finn owner accepts** (E8). | Candidate; gate #9 HELD. |
| **C** | `loa-dixie` boundary/ingress evidence lane as a possible **route-side / control-plane host** candidate (S5), **only if the Dixie owner accepts** (E8). | Candidate; gate #10 broad boundary HELD. |
| **D** | `loa-hounfour` schema/substrate dependency lane (S3), **only if evidence implicates a schema/protocol substrate change**. | Candidate; out of scope unless implicated. |
| **E** | **No-host / no-selection decision at this phase** — a *negative routing outcome*. | The default; selected (§7). |

### 5.1 Evaluation against criteria

Each candidate is evaluated against nine criteria. **"Can satisfy `ADR-022E:57`?"** asks only
whether *this candidate, at this phase, on present evidence* could satisfy the gate #8 trigger —
the answer is **No** for every candidate, because the trigger requires *a separate ADR proposing
a production adapter, citing the relevant sibling-repo handoff, and preserving the ADR-022D
receipt + audit-chain invariants* (`ADR-022E:57`; ADR-022D:111-120, :170-174), and **no proposed
production adapter exists** in any candidate here.

#### Candidate A — `loa-straylight` decision-frame owner (not runtime host)

| Criterion | Evaluation |
|-----------|------------|
| Semantic ownership correctness | **Correct.** S1 (canonical semantics) is `loa-straylight`'s permanently; host-selection authority belongs with the semantic owner (ADR-020A:45-54; ADR-022A:62-71; arch-spec §6.2.1 :452-454). |
| Physical-host suitability | **N/A — not a physical host.** A is the decision-frame seat, not an S2 durable-storage placement. Treating the semantic package as the byte-store would conflate S1 with S2. |
| Implementation-ownership risk | **Low**, *provided* A is not mis-read as assigning runtime/storage implementation ownership. ADR-048B §5 item 1 is explicit: owning the decision frame does **not** assign implementation ownership. |
| Sibling-owner acceptance status | **N/A** — owned here; binds no sibling. |
| Evidence available now | **Present** — the decision frame already exists (ADR-048B). |
| Can satisfy `ADR-022E:57`? | **No.** A proposes no production adapter; it is a decision-frame seat, not a host selection. |
| Keeps D.2 blocked or opens it? | **Keeps D.2 blocked** — A advances no conjunct of D.1. |
| No-leak / no-production-safety | **Safe** — docs-only; no store, no adapter, no production posture. |
| Cross-repo routing impact | **None binding** — A names no sibling lane; it retains the S1 + decision-frame seat (ADR-048B §7). |

#### Candidate B — `loa-finn` runtime/audit host candidate (S4)

| Criterion | Evaluation |
|-----------|------------|
| Semantic ownership correctness | **Must not absorb S1.** Finn EMITS the receipt the wedge DEFINES; a host that re-mints receipts, skips class-before-policy, surfaces challenged/revoked material as usable, or serves an unverified chain "is rejected" (ADR-022D:106-107, :122-127). Finn runtime ≠ semantic owner. |
| Physical-host suitability | **Unproven locally.** Local evidence shows Finn as a runtime *candidate* only; no placement ADR selects Finn, and whether any portion of the canonical-store enforcement boundary lands in a Finn-runtime lane is exactly what gate #9 must resolve (`ADR-022E:58`; Phase 48A §4.1). |
| Implementation-ownership risk | **High if opened without acceptance** — the canonical owner cannot unilaterally bind `loa-finn` (cross-repo-handoff-index.md:7-10, :520-525). |
| Sibling-owner acceptance status | **Not recorded.** Gate #9 HELD; opens only on explicit Finn-owner acceptance (E8). |
| Evidence available now | **Insufficient** — no placement ADR, no recorded Finn-owner acceptance, no runtime/audit proof. |
| Can satisfy `ADR-022E:57`? | **No.** No proposed production adapter; gate #9's own three conjuncts (feedback/approval; placement ADR selecting Finn; `loa-finn` PR under teammate review) are unmet (`ADR-022E:58`). |
| Keeps D.2 blocked or opens it? | **Keeps D.2 blocked.** |
| No-leak / no-production-safety | **Safe only while unopened** — opening a runtime lane absent acceptance would risk a production/runtime posture this lane forbids. |
| Cross-repo routing impact | **Candidate routing only** (S4 → `loa-finn`); binds nothing (ADR-048B §7). |

#### Candidate C — `loa-dixie` route-side / control-plane host candidate (S5)

| Criterion | Evaluation |
|-----------|------------|
| Semantic ownership correctness | **Must not absorb S1 or become S2.** Dixie owns route-side ingress / control-plane records (candidate intake record, idempotency cache, refusal log, HTTP wire envelope, `tenant_id`) — **not** the canonical store (Admission-Wedge:145, :148, :153; ADR-026D:318-327). |
| Physical-host suitability | **Wrong surface for S2.** Dixie route-side records (S5) are explicitly **not** the canonical store (S2). The narrow recall-intake slice ADR-026D unblocked is an ingress endpoint, not a durable canonical-store host (ADR-026D:563-566). |
| Implementation-ownership risk | **High if widened without acceptance** — the broad Dixie boundary stays HELD; the canonical owner cannot unilaterally bind `loa-dixie` (cross-repo-handoff-index.md:7-10, :520-525). |
| Sibling-owner acceptance status | **Not recorded** for the broad boundary. Gate #10 broad boundary HELD; opens only on explicit Dixie-owner acceptance (E8). (Narrow recall-intake slice already authorized by ADR-026D; **not widened here**.) |
| Evidence available now | **Insufficient** — no Dixie-boundary proof for a canonical-store host; only the narrow recall-intake slice exists. |
| Can satisfy `ADR-022E:57`? | **No.** No proposed production adapter; route-side records are not the canonical store; gate #8 stays HELD even for the unblocked recall-intake slice (ADR-026D:563-566). |
| Keeps D.2 blocked or opens it? | **Keeps D.2 blocked.** |
| No-leak / no-production-safety | **Safe only while the broad boundary stays unopened.** |
| Cross-repo routing impact | **Candidate routing only** (S5 → `loa-dixie`); binds nothing; does not widen ADR-026D (ADR-048B §7, §11). |

#### Candidate D — `loa-hounfour` schema/substrate dependency lane (S3)

| Criterion | Evaluation |
|-----------|------------|
| Semantic ownership correctness | **Schema substrate only — never S1.** Hounfour is the schema/protocol substrate; it must never own Straylight semantics, runtime, or storage (ADR-022C:54-63, :83-87). A schema-shipping event is "a substrate event, not a transfer of ownership" (ADR-022A:49-53; ADR-024A:50-56). |
| Physical-host suitability | **N/A — not a physical host.** Hounfour ships schema, not a canonical-store byte substrate. |
| Implementation-ownership risk | **Low but conditional** — only relevant *if* evidence implicates a schema/protocol change; adoption requires a separate ADR citing the upstream `$id` + alias path + boundary-preservation test (ADR-022C:64-71; ADR-024A:181-184). |
| Sibling-owner acceptance status | **N/A unless implicated** — and then only on Hounfour-owner acceptance plus a separate adoption ADR. |
| Evidence available now | **No implication present.** No local evidence shows the canonical-store host question implicates a schema/protocol substrate change. |
| Can satisfy `ADR-022E:57`? | **No.** Schema substrate is not a production storage adapter; out of scope unless implicated. |
| Keeps D.2 blocked or opens it? | **Keeps D.2 blocked.** |
| No-leak / no-production-safety | **Safe** — out of scope here; no schema/config/fixture change is made. |
| Cross-repo routing impact | **Conditional candidate only** (S3 → `loa-hounfour`); route only if evidence implicates schema/protocol (ADR-048B §7). |

#### Candidate E — no-host / no-selection decision (negative routing outcome)

| Criterion | Evaluation |
|-----------|------------|
| Semantic ownership correctness | **Correct and protective.** Selecting no host moves nothing: ownership does not follow location (ADR-020A:100-102); S1 stays with `loa-straylight`. |
| Physical-host suitability | **No host selected — by design.** This is the negative outcome: no S2 durable-storage placement is chosen. |
| Implementation-ownership risk | **Lowest.** Assigns no implementation ownership; opens no lane; binds no sibling. |
| Sibling-owner acceptance status | **No acceptance required** — no lane is opened. |
| Evidence available now | **Sufficient for *this* (negative) decision.** The evidence that is *missing* (a proposed production adapter, recorded sibling acceptance, runtime/boundary proof — §8) is precisely why no host can safely be proposed, which is what makes E the correct outcome now. |
| Can satisfy `ADR-022E:57`? | **No — and does not claim to.** A no-host decision is a *negative routing outcome*: it keeps gate #8 **OPEN / HELD** and **blocks D.1 closure**; it does **not** satisfy the `ADR-022E:57` trigger (ADR-048B §8 R1, §9 item 1). |
| Keeps D.2 blocked or opens it? | **Keeps D.2 blocked** — full D.1 stays NOT YET SATISFIED, so D.2 cannot start. |
| No-leak / no-production-safety | **Safest** — no store, no adapter, no production posture, no network surface, no threat-model widening. |
| Cross-repo routing impact | **None binding** — produces a structured matrix for human / code-owner routing while keeping the no-host default intact. |

### 5.2 Cross-candidate summary

| Candidate | Semantic-ownership correct? | Suitable S2 host? | Impl-ownership risk | Owner acceptance | Evidence now | Satisfies `ADR-022E:57`? | D.2 | Production-safe posture |
|-----------|---|---|---|---|---|---|---|---|
| A (`loa-straylight` frame) | ✅ | N/A (not a host) | Low | N/A | Present | ❌ No | Blocked | Safe (docs-only) |
| B (`loa-finn` runtime) | Must not absorb S1 | Unproven | High if unopened-without-acceptance | Not recorded | Insufficient | ❌ No | Blocked | Safe only while unopened |
| C (`loa-dixie` boundary) | Must not absorb S1/S2 | Wrong surface for S2 | High if widened | Not recorded (broad) | Insufficient | ❌ No | Blocked | Safe only while unopened |
| D (`loa-hounfour` schema) | Schema only | N/A (not a host) | Low, conditional | N/A unless implicated | No implication | ❌ No | Blocked | Safe (out of scope) |
| **E (no-host)** | ✅ protective | No host (by design) | **Lowest** | None required | **Sufficient for the negative decision** | ❌ No (and does not claim to) | Blocked | **Safest** |

> No candidate can satisfy `ADR-022E:57` at this phase, because none carries a *proposed
> production adapter* with the required handoff citation and ADR-022D invariant preservation.
> That is the structural reason the safe outcome is **E**.

---

## 6. The no-silent-delegation guarantee (E2) under a no-host decision

The rule that keeps every candidate safe is **E2: canonical Straylight semantics (S1) are NOT
silently delegated to Dixie / Finn / Hounfour by selecting — or by *declining* to select —
where the bytes live.** A no-host decision is the strongest form of this guarantee, because it
moves nothing:

- **Ownership does not follow location.** "Renaming the repo a primitive lives in does not
  transfer ownership" (ADR-020A:100-102); the MVP host "is a **persistence / exposure surface**
  … it is **not** their semantic owner" (ADR-022D:106-107).
- **Substrate events are not ownership events.** A schema-shipping event is "a substrate event,
  not a transfer of ownership" (ADR-022A:49-53; ADR-024A:50-56). A host-selection decision is
  even weaker evidence; declining to select one is weaker still.
- **Runtime/audit enforcement (S4) is not semantic ownership (S1).** A host that re-mints
  receipts, skips class-before-policy, surfaces challenged/revoked material as usable, or serves
  an unverified chain "is rejected" (ADR-022D:122-127).
- **Dixie route-side records (S5) are not the canonical store (S2).** Dixie owns "candidate
  intake record, idempotency cache, refusal log, the HTTP wire envelope" and `tenant_id`; the
  canonical store holds `Assertion`/`EstateTransition`/`TransitionReceipt`/`AuditEvent` and the
  supersession relation (Admission-Wedge:145, :148, :153).
- **Migration of S1 ownership requires its own ADR.** Any future semantic-ownership migration
  "is a **separate** ADR that must cite the upstream evidence and the local boundary
  preservation test(s)" (ADR-020A:92-95; ADR-024A:181-184). This packet effects no such
  migration.

---

## 7. Decision

> **Selected outcome: Candidate E — no-host / no-selection decision at this phase (a negative
> routing outcome).** Candidates A–D are *not* selected as host selections; A remains the
> already-held decision-frame seat, and B / C / D remain *candidate* routings that open only on
> recorded owner acceptance (E8) and, for D, only if evidence implicates a schema/protocol
> change. Option D from ADR-048B (select a host now) was already rejected and is **not** revived.

**Why E is the safest outcome on present evidence.** The gate #8 trigger requires a *proposed
production adapter*, a relevant sibling-repo handoff citation, and preservation of the ADR-022D
receipt + audit-chain invariants (`ADR-022E:57`; ADR-022D:111-120, :170-174). **No candidate
here carries a proposed production adapter**, no sibling-owner acceptance for #9 / #10 is
recorded, and no runtime/boundary/schema proof exists locally (§5, §8). Selecting any host would
either be unsupported by evidence or would require crossing out of docs-only into a production
posture this lane forbids (§10). The default of no host selection therefore stands.

**Because Candidate E is selected, this packet states clearly:**

1. **No host is selected.** No canonical-store physical host (S2) is chosen.
2. **No proposed production adapter exists.** This packet proposes none, and none exists in any
   candidate evaluated here.
3. **`ADR-022E:57` is not satisfied.** The gate #8 trigger is not met; this no-host decision is
   a *negative routing outcome* and does **not** satisfy it.
4. **Gate #8 remains OPEN / HELD.** Not discharged.
5. **D.1 remains NOT YET SATISFIED.** Conjunct (i) ACCEPTED + conjunct (ii) UNRESOLVED; the no-
   host decision **blocks D.1 closure** rather than advancing it.
6. **D.2 remains blocked / not started.** Full D.1 is not satisfied, so D.2 cannot start; full
   D.1 is **not** gated on D.2.
7. **MVP-2 remains OPEN.**

> This decision **records a negative outcome and produces a matrix to route from**; it RESOLVES
> nothing, DISCHARGES nothing, and SATISFIES nothing. Every §10 non-authorization holds.

---

## 8. Evidence missing before a future host-selection proposal could be made

A future attempt to *propose* a canonical-store physical host (and only then, separately, to
attempt gate #8 closure) — in whatever repo it lands — must carry **all** of the following.
This is the *input* bar; **none of it is performed here**, and even a fully-populated packet
leaves gate #8 OPEN until a separate, owner-accepted, production-gated ADR discharges it
(ADR-048B §8, §9). This list refines ADR-048B's R1–R8 toward the specific question "what is
missing before a host could be *proposed*?".

| # | Missing evidence | Why load-bearing |
|---|------------------|------------------|
| M1 | **Owner acceptance for the candidate sibling evidence lanes** (#9 runtime → Finn; #10 boundary → Dixie), recorded in their own repos under teammate review (E8). | Routing without recorded owner acceptance re-introduces the "Dixie alone resolves it" fallacy; the canonical owner cannot unilaterally bind a sibling (cross-repo-handoff-index.md:7-10, :520-525). Maps to ADR-048B R2. |
| M2 | **Runtime / audit proof** where the candidate implicates Finn runtime (S4): proof the runtime host EMITS-not-redefines, preserves class-before-policy, and never surfaces challenged/revoked material as usable. | Gate #9; ADR-022D:106-107, :122-127. Maps to ADR-048B R5. |
| M3 | **Dixie boundary proof** where the candidate implicates the Dixie boundary (S5): a clear canonical-store (S2) vs route-side-records (S5) boundary that survives any host selection. | Gate #10 broad boundary; Admission-Wedge:145, :148, :153; ADR-026D:318-327. Maps to ADR-048B R4. |
| M4 | **Schema / substrate proof — only if implicated** (S3): evidence that the host question implicates a schema/protocol change, plus a separate adoption ADR citing the upstream `$id` + alias path + boundary-preservation test. | Hounfour is schema-only; adoption is never automatic (ADR-022C:64-71; ADR-024A:181-184). |
| M5 | **A production-adapter proposal shape** — an explicit proposed production adapter, since the gate #8 trigger requires one. | `ADR-022E:57` cannot even be *attempted* without a proposed adapter. Maps to ADR-048B R1. |
| M6 | **A no-silent-delegation (E2) proof** that S1 is not delegated to Dixie / Finn / Hounfour by the proposed host. | ADR-020A:45-54; ADR-022A:62-71; arch-spec §6.2.1 :452-454. Maps to ADR-048B R3. |
| M7 | **Migration / storage / adapter implications** against the ADR-022D receipt + audit-chain invariants and the `StorageAdapter` seam (pinned at `tests/phase-5-hardening.test.ts`). | Any production adapter must preserve these (ADR-022D:111-120, :170-174; `ADR-022E:57`). Maps to ADR-048B R6. |
| M8 | **Independent audit acceptance** plus an explicit non-production-posture statement (evidence of a viable host does not, by itself, authorize production; the production lane stays independently gated) and a D.1 → D.2 dependency note that downstream phases cannot silently invert. | A host proposal must not be mistaken for production authorization, and the D.1 → D.2 ordering must not invert (ADR-048B R7, R8; §10). |

> None of M1–M8 is performed here. They are the evidentiary bar a *future* host-selection
> *proposal* must clear before a separate gate-#8 closure attempt could even be evaluated.

---

## 9. Next-lane recommendation

> **Recommended next lane: `Phase 48D — combined #9 / #10 owner-acceptance request packet`, in
> `loa-straylight`, docs/decision-only.**

Four candidate next lanes were considered:

| Candidate next lane | Selected? | Reason |
|---------------------|-----------|--------|
| Phase 48D: **sibling-owner acceptance request for #9** runtime evidence lane in `loa-finn`. | **No** | Opening or even soliciting acceptance *inside the Finn repo* is sibling-repo work the canonical owner cannot initiate unilaterally; and singling out #9 first imposes an ordering the evidence does not justify (cross-repo-handoff-index.md:7-10, :520-525). |
| Phase 48D: **sibling-owner acceptance request for #10** Dixie-boundary evidence lane in `loa-dixie`. | **No** | Symmetric to the above; also risks being mistaken for widening the narrow recall-intake slice ADR-026D already authorized (ADR-026D:563-566) — which §10 forbids. |
| Phase 48D: **combined #9 / #10 owner-acceptance request packet** in `loa-straylight`. | **Yes** | Stays on the semantic-owner side (binds no sibling), stays docs-only (no production posture), and produces a single structured request the human / code-owner can route to *both* candidate owners at once — without prejudging order or prefetching acceptance. It is the natural successor to this matrix: the matrix shows the missing evidence is **owner acceptance** (M1), and a combined request packet is the safest docs-only way to surface that need. |
| Phase 48D: **stop / human routing** if owner acceptance cannot be represented docs-only. | **Held in reserve** | If the human / code-owner judges that owner acceptance for #9 / #10 cannot be represented docs-only (it must be recorded in the sibling repos under teammate review), the safe fallback is to **stop and route to human / code-owner**. This packet does not select stop, because a docs-only *request* packet (the combined option) is still a safe, useful step that does not itself require acceptance to exist. |

**Why the combined request lane is safest.** It does exactly what this matrix shows is needed —
surface the single missing input (recorded owner acceptance, M1) — while binding nothing, opening
no lane, and keeping the no-host default intact. It defers the *acceptance itself* (which must be
recorded by the #9 / #10 owners in their own repos under teammate review, E8) to where it
properly belongs, and it keeps the stop/human-routing option available if even a docs-only
request is judged premature.

**Repository routing (pending human / code-owner confirmation):**

| Lane | Likely repo | Owns | Status |
|------|-------------|------|--------|
| Phase 48D combined #9 / #10 owner-acceptance request packet | `loa-straylight` | The combined, docs-only owner-acceptance *request* (not the acceptance itself) | Recommended; not yet opened |
| Gate #9 runtime evidence lane | `loa-finn` (candidate) | Runtime / enforcement placement (#9) | HELD; opens only on recorded owner acceptance (E8) |
| Gate #10 boundary evidence lane | `loa-dixie` (candidate) | Route-side ingress / control-plane boundary (#10) | HELD (broad); opens only on recorded owner acceptance (E8) |
| Substrate-schema dependency (if implicated) | `loa-hounfour` (candidate) | Substrate schema only — never Straylight semantics | Out of scope here; route only if evidence implicates it |

**PR title format (future).** Any follow-on PR title **must include the phase label**, e.g.:

- `Phase 48D: combined #9 / #10 owner-acceptance request packet`
- `Phase 48D (loa-finn): gate #9 runtime placement evidence lane` *(only if the Finn owner accepts)*
- `Phase 48D (loa-dixie): gate #10 boundary evidence lane` *(only if the Dixie owner accepts)*

Prefer **medium bounded slices** for Phase 48D where safe — **but** Phase 48D remains
docs/decision-only and authorizes none of §10.

---

## 10. What this packet does NOT authorize

This Phase 48C packet **does not authorize** any of the following. Each remains blocked and is
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

Additionally, this packet does **not**:

- treat the **no-host decision as satisfying or discharging gate #8** — it keeps gate #8 OPEN /
  HELD and blocks D.1 closure (§7);
- claim `ADR-022E:57` is satisfied — there is **no** proposed production adapter and no
  separately-accepted evidence (§5.1, §7);
- treat Dixie as the canonical semantic owner (Dixie owns route-side / control-plane records
  only — Admission-Wedge:153);
- treat Finn runtime / audit ownership as canonical semantic ownership (Finn EMITS what the
  wedge DEFINES — ADR-022D:106-107);
- treat Hounfour schema substrate as runtime / storage ownership (Hounfour is schema/protocol
  only — ADR-022C:83-87; ADR-024A:50-56);
- assign runtime / storage *implementation* ownership to any repo (it evaluates a matrix and
  records a negative outcome — §5, §7);
- widen the narrow recall-intake gate #10 slice already authorized by ADR-026D, nor open the
  broad Dixie boundary (ADR-026D:563-566);
- open any sibling lane (#9 / #10) absent recorded owner acceptance (E8).

> **No production-readiness claim.** Building a candidate matrix and recording a no-host decision
> clarifies *which outcome is safest on present evidence and what evidence is still missing*; it
> does **not** clear the independent production gates. Gate #8 stays OPEN, gates #9 / #10 stay
> HELD, gate #11 (Freeside, `ADR-022E:60`) and gate #12 (new network surface, `ADR-022E:61`)
> stay HELD, and the threat-model-widening discipline (gate #20, `ADR-022E:69`) is untouched.

---

## 11. Independent-auditor checklist (for Codex)

An independent auditor should be able to confirm **every** line below by inspection of this
packet and the cited `loa-straylight` files. Each is a verifiable claim:

- [ ] **Single-file change.** The branch adds exactly one new file,
      `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md`, and changes
      nothing else (verify via `git status --porcelain=v1 --untracked-files=all`).
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `fixtures/`,
      `dist/`, `dist-types/`, `package.json`, `package-lock.json`, `.github/`, `.claude/`,
      `.loa/`, `grimoires/`, or any sibling repo.
- [ ] **Title carries the phase label.** The H1 contains `Phase 48C`.
- [ ] **Gate citations are real.** ADR-022E gate #8 = `ADR-022E:57`, gate #9 = `:58`, gate #10 =
      `:59`, gate #11 = `:60`, gate #12 = `:61`, gate #20 = `:69` resolve to the actual rows in
      [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md);
      gate #8 / #9 / #10 are HELD.
- [ ] **No overclaim.** No affirmative claim that D.1 is SATISFIED, gate #8 is DISCHARGED,
      `ADR-022E:57` is SATISFIED, MVP-2 is CLOSED, a host is SELECTED, #9 / #10 are RESOLVED,
      D.2 is STARTED, or anything is production-ready. Every such phrase appears only inside a
      negation / non-authorization. **The no-host decision is never said to satisfy gate #8.**
- [ ] **Endpoint vs canonical-store host kept distinct.** §4 distinguishes the ADR-024B
      endpoint-host placement (Dixie, docs-only) from the canonical-store physical host (S2,
      UNSELECTED, gate #8 HELD) and never conflates them.
- [ ] **Five candidates present + evaluated against nine criteria.** Candidates A–E appear, each
      scored on all nine criteria, with a cross-candidate summary (§5).
- [ ] **No candidate can satisfy `ADR-022E:57`.** Every candidate's "Can satisfy `ADR-022E:57`?"
      cell is **No**, because none carries a proposed production adapter (§5.1, §5.2).
- [ ] **Decision is Candidate E (no-host) with the seven explicit statements.** §7 selects E and
      states: no host; no proposed adapter; `ADR-022E:57` not satisfied; gate #8 OPEN/HELD; D.1
      NOT YET SATISFIED; D.2 blocked/not started; MVP-2 OPEN.
- [ ] **Missing-evidence list enumerated, not performed** (M1–M8, §8), mapped to ADR-048B R1–R8.
- [ ] **Next lane named with phase label + repo routing.** Phase 48D combined #9 / #10
      owner-acceptance request packet (`loa-straylight`) is recommended over the #9-first,
      #10-first, and stop alternatives, with justification (§9).
- [ ] **No silent delegation.** The packet does not treat Dixie/Finn/Hounfour as canonical
      semantic owners and does not assign implementation ownership (§6, §10).
- [ ] **Non-authorization list is complete.** §10 enumerates all 18 numbered non-authorization
      items plus the additional "does not" clauses.
- [ ] **No secret / connection / host leak.** No connection string, port, credential,
      database-engine product name, or container/orchestration detail appears.
- [ ] **No index edit.** `docs/decisions/` and `docs/` have no index/register file; none is
      created or modified.
- [ ] **No commit / push / PR** was performed by the authoring step.

---

## 12. Coverage ledger (verified)

Each required content item maps to a section; counts were verified against this document before
publication.

| Req. item | Requirement | Where | Verified |
|-----------|-------------|-------|----------|
| 1 | Title includes `Phase 48C` | H1 | ✅ |
| 2 | Status: docs/decision-only host-selection candidate matrix / no-host decision packet | banner, §1 | ✅ |
| 3 | Source hierarchy (48B = decision-frame boundary; 48A = gate-request predecessor; Dixie 47Z = evidence not authority) | §2 | ✅ (5 ranks) |
| 4 | Live gate state restated (D.1 (i) accepted; (ii) held; no host; full D.1 not satisfied; gate #8 OPEN/HELD; #9/#10 HELD; D.2 not started; MVP-2 OPEN) | §3 | ✅ (8 rows) |
| 5 | Candidate matrix A–E | §5 | ✅ (5 candidates) |
| 6 | Each candidate evaluated against the nine criteria | §5.1, §5.2 | ✅ (9 criteria) |
| 7 | Decision = Candidate E (no-host) with the seven explicit statements | §7 | ✅ |
| 8 | Evidence missing before a future host-selection proposal (M1–M8) | §8 | ✅ (8 items) |
| 9 | Next lane (Phase 48D combined #9/#10 owner-acceptance request packet) with routing + alternatives | §9 | ✅ (4 considered) |
| 10 | Explicit non-authorizations | §10 | ✅ (18 numbered items) |
| 11 | Independent-auditor checklist | §11 | ✅ (16 lines) |
| 12 | Coverage ledger (only if counts match) | §12 (this table) | ✅ |

**Count verification (exact):**

- Source-hierarchy ranks in §2: **5** (doctrine; 48B; 48A; ADR-022E gate inventory; Dixie 47Z).
- Live-gate-state rows in §3: **8**.
- Candidates in §5: **A, B, C, D, E = 5**.
- Evaluation criteria per candidate in §5.1: **9** (semantic-ownership correctness;
  physical-host suitability; implementation-ownership risk; sibling-owner acceptance status;
  evidence available now; can satisfy `ADR-022E:57`; D.2 blocked-or-opens; no-leak /
  no-production-safety; cross-repo routing impact).
- Missing-evidence items in §8: **M1–M8 = 8**.
- Candidate next lanes considered in §9: **4** (#9-first; #10-first; combined; stop/human).
- Non-authorization numbered items in §10: **18**.
- Auditor checklist lines in §11: **16**.

> The ledger is included **because** these counts were verified to match exactly. If any count
> had differed, this ledger would have been omitted rather than published with a mismatch.

---

## 13. Cross-references

- [`./ADR-048B-canonical-store-physical-host-ownership-routing.md`](./ADR-048B-canonical-store-physical-host-ownership-routing.md)
  — Phase 48B; the immediate predecessor that owns the decision frame, rejected Option D
  (select a host now), defined R1–R8, and recommended this Phase 48C lane. **Controls the
  decision-frame boundary.**
- [`../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](../ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md)
  — Phase 48A; the gate-request predecessor (E1–E8; conditional E8 acceptance discipline).
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md) — gate
  inventory: gate #8 (`:57`, HELD), #9 (`:58`, HELD), #10 (`:59`, HELD), #11 (`:60`), #12
  (`:61`), #20 (`:69`). Read read-only; **not modified**.
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md) (:45-54,
  :92-95, :100-102) / [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
  (:49-53, :62-71) — Straylight is the semantic owner (S1); ownership does not follow location
  (basis for E2 / Candidate A / E).
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md) (:190-191) /
  [`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md) (:6-17, :90-93) — the
  **endpoint-host** surface (criteria, then Dixie placement, docs-only); distinct from the
  canonical-store physical host (S2) — basis for §4.
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
  (:54-63, :64-71, :83-87) /
  [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
  (:50-56, :181-184) — Hounfour as schema/protocol substrate only (S3); adopt-by-alias, never
  rename (basis for Candidate D).
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md)
  (:69-82, :106-107, :111-120, :122-127, :170-174) — receipt / audit-chain invariants any
  production adapter must preserve (S4); `StorageAdapter` seam; `InMemoryStorage` /
  `JsonlStorage` (basis for M2, M5, M7).
- [`./ADR-026D-dixie-recall-intake-endpoint-authorization.md`](./ADR-026D-dixie-recall-intake-endpoint-authorization.md)
  (:318-327, :563-566) — gate #10 narrowly unblocked for recall-intake only, gate #8 still HELD;
  the canonical-store-vs-Dixie-ingress boundary (S5, basis for Candidate C / M3).
- [`../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md`](../ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md)
  (:145, :148, :153, :248-251) — gate #8 reaffirmed HELD; substrate-vs-ingress storage boundary
  (basis for §4 / E2 / M3).
- [`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  (:11-18 §0.1, :452-454 §6.2.1, :1791-1797 §16.1) — doctrine-as-authority; "substrate vs
  doctrine" failure mode; "Must not own" boundaries.
- [`../product-context/source-hierarchy.md`](../product-context/source-hierarchy.md) (:3-27) —
  doctrine/architecture-as-authority, handoffs/evidence-as-non-authority rule (basis for §2).
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md) (:7-10,
  :520-525) / [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
  (:14-16, :18-20) — sibling-repo PRs require teammate review; the owner cannot unilaterally
  bind a sibling (basis for §9 / M1 / Candidate B / C).
- **Dixie-side (read as evidence, NOT modified):** `loa-dixie` Phase 47T–47Z chain; Phase 47Z
  conclusion `NOT READY / HELD` (PR #201); posture `BLOCKED_FOR_HUMAN_ROUTING`; the `D.1`
  conjunct decomposition, `D.2–D.14` enumeration, six-MVP roadmap, and `MVP-2`. Confirm in the
  owning repo.

---

*End of Phase 48C packet. Docs/decision-only. This packet builds the host-selection candidate
matrix and records a **no-host / no-selection decision** as a negative routing outcome; it
SELECTS no host, proposes no production adapter, RESOLVES no gate, SATISFIES no `ADR-022E:57`,
SATISFIES no D.1, STARTS no D.2, DISCHARGES no gate #8, CLOSES no MVP-2, and authorizes none of
the §10 items. The no-host outcome keeps gate #8 OPEN/HELD and blocks D.1 closure. No commit,
no push, no PR.*
