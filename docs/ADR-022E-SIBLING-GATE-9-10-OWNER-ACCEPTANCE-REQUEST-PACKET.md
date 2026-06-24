# Phase 48D — ADR-022E Sibling-Gate #9 / #10 Combined Owner-Acceptance Request Packet

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate
> semantic owner.
> **Phase**: **Phase 48D** — combined sibling-gate #9 / #10 **owner-acceptance request**
> packet (a *request*, not an acceptance, not a resolution).
> **Status**: **docs / decision-only combined #9 / #10 owner-acceptance request packet.**
> This packet *asks* the candidate sibling owners to **ACCEPT / REJECT / DEFER /
> NEEDS_SPLIT / NEEDS_MORE_EVIDENCE** candidate evidence-lane responsibility, **without
> treating silence as acceptance** and **without opening any sibling lane**. It SELECTS
> **no** canonical-store physical host, proposes **no** production adapter, OPENS neither
> sibling gate #9 nor #10, BINDS no sibling repo, does **not** prefetch or assume owner
> acceptance, does **not** SATISFY D.1, does **not** START D.2, does **not** DISCHARGE
> ADR-022E gate #8, does **not** satisfy the `ADR-022E:57` trigger, and does **not** CLOSE
> MVP-2. No source, test, runtime, route, route handler, storage, store code, DB write,
> migration, auth/consent/signer, validator, schema, fixture/vector JSON, config, env,
> package, lockfile, CI, generated, dist/build, hidden workflow, memory, grimoire,
> `.claude`, `.loa`, or sibling-repo change is made or authorized. See §9 for the full
> non-authorization list.

---

## Naming note (preface)

This packet lands as `docs/ADR-022E-SIBLING-GATE-9-10-OWNER-ACCEPTANCE-REQUEST-PACKET.md` —
at **top-level `docs/`**, not under `docs/decisions/`. The choice follows the live
convention demonstrated across Phases 48A–48C:

- **Request packets that *request and structure* work without deciding** live at top-level
  `docs/`. The Phase 48A predecessor
  ([`./ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](./ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md))
  is exactly this: a `docs/`-level **request** packet whose own preface states it "requests
  and structures … it does **not** perform it" (Phase 48A banner, §1).
- **ADRs that *record a decision*** live under `docs/decisions/` with the ADR number tracking
  the phase that produced it. Phase 48B
  ([`./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md`](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md))
  and Phase 48C
  ([`./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md`](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md))
  each *decided* something (the decision frame; the no-host decision), so each is an ADR
  under `docs/decisions/`. Phase 48C's own naming note makes the rule explicit: "Phase 48C
  decides, so it is an ADR … the Phase 48A *request packet* … *requested and structured* work
  without deciding, so it lived at top-level `docs/`" (ADR-048C naming note).

Phase 48D **requests** — it asks the sibling owners to respond; it **decides nothing**, opens
no lane, and binds nothing. It is therefore structurally a *request packet*, the direct
successor of Phase 48A, and it lands where Phase 48A lands: top-level `docs/`, with the
`ADR-022E-SIBLING-GATE-…` request-packet naming the brief prefers. This is **not** an ADR and
is **not** numbered `ADR-048D`, precisely because it records no decision.

**No index/register update is required or performed.** Verified by inspection: neither
top-level `docs/` nor `docs/decisions/` contains an index / register / README / TOC file that
enumerates ADRs or request packets (`ls docs/` and `ls docs/decisions/` show no such file).
There is therefore no register that this new file must be added to, and none is created or
modified.

---

## 1. Status and scope

- **In-`loa-straylight`, docs/decision-only.** The only change on this branch is this one new
  Markdown document under `docs/`. No file under `src/`, `tests/`, `scripts/`, `fixtures/`,
  `dist/`, `dist-types/`; no `package.json` / `package-lock.json` / `exports` / runtime
  allowlist; no schema / config / env / CI / generated / hidden / memory / `.claude` / `.loa` /
  grimoire / sibling-repo path is touched.
- **A request, not a resolution and not an acceptance.** Phase 48C (§9) selected this lane:
  a *combined* #9 / #10 owner-acceptance **request** packet that the human / code-owner can
  route to *both* candidate owners at once "without prejudging order or prefetching acceptance"
  (ADR-048C §9). This packet *is* that request. It frames *what* each candidate owner is being
  asked, *what their response would and would not mean*, and *what evidence a future opened
  lane would need* — and stops there. It does **not** open a lane, assign implementation
  ownership, select a host, or record any acceptance.
- **Silence is never acceptance.** The structural rule of this packet is that the absence of a
  recorded owner response is **not** consent. The canonical owner cannot unilaterally bind
  `loa-finn`, `loa-dixie`, or `loa-hounfour` (`docs/handoffs/cross-repo-handoff-index.md`:519-543),
  so routing on silence would re-create the "Dixie alone resolves it" fallacy the whole 48-corridor
  rejects (Phase 48A §1; ADR-048C §9 / M1).
- **No production authorization of any kind** (§9).
- **Conservative by construction.** Where this packet could either (a) record a *request* the
  semantic owner is entitled to author on the doc side, or (b) reach into an acceptance,
  selection, lane-open, or production gate that requires sibling-owner action or a production
  trigger, it does (a) and explicitly refuses (b).

---

## 2. Source hierarchy (authority vs evidence)

This packet is bound by the repo's source hierarchy
([`./product-context/source-hierarchy.md`](./product-context/source-hierarchy.md):3-27) and the
architecture spec's own ranked hierarchy
([`./architecture/loa-straylight-product-system-architecture-spec.md`](./architecture/loa-straylight-product-system-architecture-spec.md):11-18,
§0.1). Applied here, in descending authority:

1. **Doctrine / architecture (authority for canonical semantics).** The doctrine layer
   (`README.md` doctrine + `straylight-product-doctrine.md`) and the product+system architecture
   spec are source-of-truth for canonical Straylight primitive semantics. Research handoffs and
   packet synthesis "stress-test the doctrine. They do **not** redefine Straylight"; repo
   verification "defines what currently exists … [but] does **not** by itself assign Straylight
   primitive ownership" (`source-hierarchy.md`:21-27; arch-spec :18).
2. **Immediate predecessor — Phase 48C (controls the no-host / no-selection state).**
   [`./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md`](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md)
   is the immediate predecessor. It selected **Candidate E (no-host / no-selection)** as a
   *negative routing outcome*, established that **no host is selected, no proposed production
   adapter exists, `ADR-022E:57` is not satisfied, gate #8 stays OPEN / HELD, full D.1 stays
   NOT YET SATISFIED, D.2 stays not-started, and MVP-2 stays OPEN** (ADR-048C §7), and selected
   *this* combined-request lane as the safest next step (ADR-048C §9). Phase 48D inherits and
   restates that state (§3); it advances none of it.
3. **Phase 48B (controls the decision-frame boundary).**
   [`./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md`](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md)
   defined the boundary this packet works inside: `loa-straylight` owns the host-selection /
   sibling-gate-routing **decision frame only**; it does **not** own or assign runtime/storage
   *implementation* ownership; each evidence lane opens **only on recorded owner acceptance
   (E8)** under teammate review (ADR-048B §5, §7). Phase 48D stays strictly inside that frame —
   it *asks* for the acceptance ADR-048B requires, and does not manufacture it.
4. **Phase 48A (gate-request predecessor).**
   [`./ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](./ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md)
   is the gate-request predecessor that structured the #9 / #10 resolution work and produced the
   E1–E8 evidence list, including **E8: recorded owner acceptance / rejection** for #9 and #10
   (Phase 48A §5, §7). This packet operationalizes E8 as a *request* — without prefetching the
   answer.
5. **Local decision-locks (authority for the gate inventory).**
   [`./decisions/ADR-022E-phase-22-deferred-features.md`](./decisions/ADR-022E-phase-22-deferred-features.md)
   is the binding gate inventory: gate **#8** (production database / persistence substrate) at
   `ADR-022E:57`; gate **#9** (Finn runtime wiring) at `:58`; gate **#10** (Dixie boundary
   wiring) at `:59`; gate **#11** (Freeside) at `:60`; gate **#12** (new network surface) at
   `:61`; gate **#20** (threat-model widening) at `:69`.
6. **Dixie Phase 47Z and the Phase 47T–47Y chain (blocked-state evidence ONLY, NOT authority).**
   The Dixie chain — Phase 47Z `NOT READY / HELD` (merged via `loa-dixie` PR #201), posture
   `BLOCKED_FOR_HUMAN_ROUTING`, the `D.1` conjunct decomposition, the `D.2–D.14` enumeration,
   the six-MVP roadmap framing, and `MVP-2` — is **Dixie-side evidence of the blocked state**
   carried here labeled as such. It is evidence of *why the corridor is blocked*; it is **not**
   authority for Dixie (or any sibling) to resolve canonical-store host ownership alone, and it
   is **not** authority that any owner has accepted anything. This packet neither coins nor
   re-owns those constructs.

> **Evidence-bound rule.** Every repo fact in this packet is either (a) cited to a
> `loa-straylight` `file:line`, or (b) explicitly labeled as Dixie-side Phase-47 evidence to be
> confirmed by the owning repo. Where local evidence does not prove a claim, this packet says so
> and defers to human / code-owner routing. **No owner response is asserted to exist; this
> packet requests responses that do not yet exist.**

---

## 3. Live state (restated, not changed)

This packet **restates** the live state carried forward from Phases 48A / 48B / 48C and the
Dixie-side evidence; it changes, advances, satisfies, discharges, resolves, opens, starts, or
closes **none** of it.

| Item | Live state entering Phase 48D | Authority / evidence |
|------|-------------------------------|----------------------|
| **Canonical-store physical host (S2)** | **NONE SELECTED.** `InMemoryStorage` / `JsonlStorage` remain the only MVP adapters behind the `StorageAdapter` swap-in seam. | ADR-048C §7 item 1; ADR-022D:69-82, :106-107; Admission-Wedge:248-251. |
| **Proposed production adapter** | **NONE EXISTS.** No candidate evaluated in Phase 48C carried a proposed production adapter; this packet proposes none. | ADR-048C §7 item 2, §5.2. |
| **`ADR-022E:57` (gate #8 trigger)** | **NOT SATISFIED.** Requires a separate ADR proposing the production adapter, citing the sibling-repo handoff, preserving the ADR-022D invariants — none present. | `ADR-022E:57`; ADR-048C §7 item 3. |
| **D.1 conjunct (i)** | **ACCEPTED — not reopened.** Carried as Dixie-side evidence; not re-adjudicated here. | Dixie Phase-47 evidence; ADR-048C §3; Phase 48A §3. |
| **D.1 conjunct (ii)** — canonical-store physical-host dependency | **UNRESOLVED / HELD**, externally held under sibling gates #9 (`:58`) / #10 (`:59`). | ADR-048C §3; ADR-048B §3; Phase 48A §3. |
| **Full D.1** | **NOT YET SATISFIED.** Conjunct (i) ACCEPTED + conjunct (ii) UNRESOLVED ⇒ the conjunction does not hold. | ADR-048C §7 item 5; ADR-048B §3. |
| **ADR-022E gate #8** | **OPEN / HELD** (NOT DISCHARGED). The no-host decision keeps it OPEN / HELD and blocks D.1 closure. | `ADR-022E:57`; ADR-048C §7 item 4. |
| **Sibling gates #9 / #10** | **HELD.** (#10's *narrow* recall-intake slice was unblocked by ADR-026D for that single endpoint only; the **broad** boundary stays held, gate #8 still HELD.) | `ADR-022E:58`, `:59`; ADR-026D:563-566. |
| **D.2** | **NOT STARTED.** D.2 is downstream of full D.1; full D.1 is **not gated on** D.2. | ADR-048C §7 item 6; ADR-048B §3. |
| **MVP-2** | **OPEN.** | Dixie Phase-47 evidence; ADR-048C §7 item 7; ADR-048B §3. |

> Nothing in §3 is advanced, satisfied, discharged, resolved, opened, started, or closed by this
> packet. The table is a status restatement only. **No row records an owner acceptance, because
> none exists.**

---

## 4. Combined owner-acceptance request table

This is a **request**. Naming a candidate owner and a request is **not** an acceptance, **not**
a lane-open, and **not** a host selection. Each row records *whom this packet asks*, *what is
being asked*, and *the response options* the owner may choose (defined in §6). The per-lane
detail — what acceptance would and would not mean, what evidence comes next, what stays blocked,
and why silence is not acceptance — is in §5.

| Lane | Candidate owner asked | Surface | What is requested | Response options | Status |
|------|-----------------------|---------|-------------------|------------------|--------|
| **Gate #9 — runtime evidence lane** | `loa-finn` (candidate) | S4 — runtime / enforcement / audit | Asked whether the Finn owner will ACCEPT responsibility to *host a future* gate-#9 runtime evidence lane in `loa-finn` under teammate review. | ACCEPT / REJECT / DEFER / NEEDS_SPLIT / NEEDS_MORE_EVIDENCE | **HELD; not opened.** Opens only on recorded Finn-owner ACCEPT (E8). |
| **Gate #10 — Dixie-boundary evidence lane** | `loa-dixie` (candidate) | S5 — route-side ingress / control-plane boundary | Asked whether the Dixie owner will ACCEPT responsibility to *host a future* gate-#10 **broad-boundary** evidence lane in `loa-dixie` under teammate review. The narrow recall-intake slice (ADR-026D) is **not** widened by this request. | ACCEPT / REJECT / DEFER / NEEDS_SPLIT / NEEDS_MORE_EVIDENCE | **HELD (broad); not opened.** Opens only on recorded Dixie-owner ACCEPT (E8). |
| **Schema / substrate lane (conditional)** | `loa-hounfour` (candidate) | S3 — schema / protocol substrate only | Asked — **only if** evidence implicates a schema/protocol substrate change — whether the Hounfour owner will ACCEPT a schema/substrate dependency lane. **No such implication is present today**, so the request is conditional and does not fire now. | ACCEPT / REJECT / DEFER / NEEDS_SPLIT / NEEDS_MORE_EVIDENCE | **Out of scope unless implicated; not opened.** |
| **Straylight decision-frame continuation** | `loa-straylight` (owned here) | S1 + host-selection decision frame | Not a sibling-acceptance request (this lane is already owned here). The request to the human / code-owner is whether to *continue* the docs-only decision frame and proceed to the Phase 48E owner-response intake gate (§8). | ACCEPT / REJECT / DEFER / NEEDS_SPLIT / NEEDS_MORE_EVIDENCE | **Owned here; the only lane this packet itself occupies (docs-only).** |

> Naming `loa-finn`, `loa-dixie`, and `loa-hounfour` as candidate owners **binds none of them**.
> `loa-straylight` retains canonical semantic (S1) and host-selection decision-frame ownership
> unless and until a later accepted ADR — with its own evidence and a sibling-repo PR under
> teammate review — changes it (ADR-048B §7).

---

## 5. Per-lane request detail

For each lane the packet specifies the six fields the brief requires: requested response
options, what acceptance **would** mean, what acceptance would **not** mean, what evidence would
be required next, what remains blocked, and why silence is not acceptance.

### 5.1 Gate #9 — `loa-finn` runtime evidence lane (S4)

- **Requested owner response options.** ACCEPT / REJECT / DEFER / NEEDS_SPLIT /
  NEEDS_MORE_EVIDENCE (defined in §6).
- **What acceptance WOULD mean.** That the Finn owner agrees to *host a future* gate-#9 runtime
  evidence lane in `loa-finn`, under teammate review — i.e. agrees to *receive and own the
  question*. Acceptance is a willingness to host the lane; it is **not** evidence and it does
  not open the lane here (the lane, if accepted, opens as a separate PR in `loa-finn` under
  teammate review per `cross-repo-handoff-index.md`:519-543).
- **What acceptance would NOT mean.** It would **not** mean a canonical-store physical host is
  selected; **not** that the gate #8 trigger (`ADR-022E:57`) is met; **not** that a proposed
  production adapter exists; **not** that Finn becomes the canonical semantic owner (S1 — Finn
  EMITS the receipt the wedge DEFINES, ADR-022D:106-107, :122-127); **not** that gate #9's three
  conjuncts (`ADR-022E:58`) are satisfied; and **not** that D.1 closes.
- **What evidence would be required next** (only if accepted; none performed here). Gate #9's own
  three conjuncts — (a) issue-#70 feedback or a teammate-review approval, (b) an
  ADR-022B-criteria placement ADR selecting Finn, (c) the `loa-finn` PR under teammate review
  (`ADR-022E:58`) — **plus** the runtime/audit proof that the host EMITS-not-redefines, preserves
  class-before-policy, and never surfaces challenged/revoked material as usable (ADR-048C M2;
  ADR-022D:106-107, :122-127).
- **What remains blocked.** Gate #8 stays OPEN / HELD; gate #9 stays HELD until separately
  resolved; full D.1 stays NOT YET SATISFIED; D.2 stays not-started; MVP-2 stays OPEN.
- **Why silence is NOT acceptance.** The canonical owner cannot unilaterally bind `loa-finn`
  (`cross-repo-handoff-index.md`:519-543). An unanswered request is **not** consent; reading
  silence as acceptance would re-create the "Dixie alone resolves it" fallacy the corridor
  rejects (Phase 48A §1). Acceptance must be **recorded** in `loa-finn` (or in an accepted
  cross-repo decision) before the lane may open.

### 5.2 Gate #10 — `loa-dixie` boundary evidence lane (S5)

- **Requested owner response options.** ACCEPT / REJECT / DEFER / NEEDS_SPLIT /
  NEEDS_MORE_EVIDENCE.
- **What acceptance WOULD mean.** That the Dixie owner agrees to *host a future* gate-#10
  **broad** route-side ingress / control-plane boundary evidence lane in `loa-dixie`, under
  teammate review — i.e. agrees to *receive and own the question* of whether broad Dixie boundary
  wiring is authorized beyond the narrow recall-intake slice. Acceptance is willingness to host;
  it is **not** evidence.
- **What acceptance would NOT mean.** It would **not** widen the narrow recall-intake slice
  already authorized by ADR-026D (ADR-026D:563-566); **not** make Dixie route-side records (S5)
  the canonical store (S2 — they are explicitly distinct, Admission-Wedge:145, :148, :153);
  **not** select a host; **not** satisfy the gate #8 trigger; **not** make Dixie the canonical
  semantic owner; and **not** close D.1.
- **What evidence would be required next** (only if accepted; none performed here). Gate #10's
  conjuncts symmetric to #9 (`ADR-022E:59`) — placement ADR selecting Dixie for the broad
  boundary, the `loa-dixie` PR under teammate review — **plus** a clear canonical-store (S2) vs
  route-side-records (S5) boundary that survives any host selection (ADR-048C M3;
  Admission-Wedge:145, :148, :153; ADR-026D:318-327).
- **What remains blocked.** Gate #8 stays OPEN / HELD; gate #10's **broad** boundary stays HELD
  (the narrow recall-intake slice is unchanged, not widened); full D.1 stays NOT YET SATISFIED;
  D.2 stays not-started; MVP-2 stays OPEN.
- **Why silence is NOT acceptance.** As with #9, the canonical owner cannot unilaterally bind
  `loa-dixie`; silence is not consent. Additionally, silence must **not** be read as
  authorization to widen ADR-026D's narrow slice — non-response leaves the broad boundary HELD.
  Acceptance must be **recorded** in `loa-dixie` (or an accepted cross-repo decision) first.

### 5.3 Schema / substrate lane — `loa-hounfour` (S3, conditional)

- **Requested owner response options.** ACCEPT / REJECT / DEFER / NEEDS_SPLIT /
  NEEDS_MORE_EVIDENCE — **but the request is conditional**: it fires only if evidence implicates
  a schema/protocol substrate change. **No such implication is present today** (ADR-048C §5.1
  Candidate D; M4), so the request does not fire now and is recorded for completeness.
- **What acceptance WOULD mean** (only if first implicated). That the Hounfour owner agrees to
  *host a future* schema/substrate dependency lane (S3) — **schema/protocol substrate only**,
  never Straylight semantics (S1), never runtime (S4), never storage (S2). Even then, adoption
  is never automatic: it requires a separate adoption ADR citing the upstream `$id` + alias path
  + boundary-preservation test (ADR-022C:64-71; ADR-024A:181-184).
- **What acceptance would NOT mean.** It would **not** make Hounfour the owner of S1 / S4 / S2;
  **not** authorize automatic adoption of any schema into the wedge's public surface; **not**
  select a host; and **not** satisfy any gate #8 / #9 / #10 trigger. A schema-shipping event is
  "a substrate event, not a transfer of ownership" (ADR-022A:49-53; ADR-024A:50-56).
- **What evidence would be required next** (only if implicated and accepted; none performed
  here). First, evidence that the canonical-store host question genuinely implicates a
  schema/protocol substrate change (ADR-048C M4); then, separately, the adoption ADR above.
- **What remains blocked.** All gates (#8 / #9 / #10) stay as in §3; and this lane stays **out
  of scope** unless and until evidence implicates schema/protocol.
- **Why silence is NOT acceptance.** Silence is not consent, and — because the request is
  conditional and the condition is not met — silence also does not implicate schema either way:
  the conditional simply does not fire. Any future acceptance must be **recorded** in
  `loa-hounfour` (or an accepted cross-repo decision).

### 5.4 Straylight decision-frame continuation — `loa-straylight` (S1 + frame)

- **Requested owner response options.** ACCEPT / REJECT / DEFER / NEEDS_SPLIT /
  NEEDS_MORE_EVIDENCE. This lane is **already owned here**, so these options describe how the
  human / code-owner may respond to *this packet's routing* (continue / stop / hold / decompose /
  ask-for-more-docs), **not** a sibling acceptance.
- **What acceptance WOULD mean.** That the human / code-owner agrees to *continue* the docs-only
  decision frame in `loa-straylight` and proceed to the Phase 48E owner-response intake gate
  (§8). `loa-straylight` retains S1 + host-selection decision-frame ownership.
- **What acceptance would NOT mean.** It would **not** select a host; **not** assign
  runtime/storage *implementation* ownership to `loa-straylight` or anyone else (ADR-048B §5
  item 1); **not** open #9 or #10; and **not** advance any §3 item.
- **What evidence would be required next.** Nothing is required to *continue the frame* (it is
  owned here and is docs-only). To *advance* the corridor toward a lane-open requires the single
  missing input — **recorded sibling-owner acceptance (E8 / M1)** — which this packet requests
  but does not manufacture.
- **What remains blocked.** Everything in §3 stays exactly as stated; continuing the frame
  advances none of it.
- **Why silence is NOT acceptance.** Even the owned-here lane does not advance on silence:
  opening the Phase 48E intake gate, or any sibling lane, requires explicit routing /
  acceptance — not the mere absence of objection. A docs-only request packet that no one answers
  leaves every gate where §3 leaves it.

> **General principle (all lanes).** Across §5.1–§5.4, *silence is structurally non-binding in
> both directions*: it neither opens a lane nor closes one, neither accepts nor rejects. Only a
> **recorded** ACCEPT (in the owner's repo or an accepted cross-repo decision) can open a lane;
> only a **recorded** REJECT returns routing to `loa-straylight`. Absent a recorded response,
> the §3 state stands unchanged.

---

## 6. Acceptance semantics (definitions of the five response options)

Each requested response option has a precise, bounded meaning. None of these outcomes is
*recorded* by this packet; this section defines what each would mean **if** an owner records it.

| Option | Definition | Effect on gate state |
|--------|------------|----------------------|
| **ACCEPT** | The owner agrees to **host a future evidence lane** — **not** that evidence exists or passes. Acceptance is a willingness to receive and own the question in the owner's repo under teammate review. | The candidate lane *may* open as a separate PR **in the owner's repo**. Gate #8 stays OPEN / HELD until separately discharged; full D.1 stays NOT YET SATISFIED; D.2 stays not-started. |
| **REJECT** | The owner declines the candidate responsibility. | The candidate lane **remains closed** and routing **returns to `loa-straylight`** (the semantic owner / decision-frame owner re-routes). No gate moves. |
| **DEFER** | The owner neither accepts nor rejects now. | **No lane opens** and **gate #8 remains HELD.** The corridor waits; no §3 item advances. |
| **NEEDS_SPLIT** | The owner judges the combined request too broad. | A **future packet must split #9 / #10** (or split the schema / runtime / boundary questions) before the request can be answered. No lane opens; no gate moves. |
| **NEEDS_MORE_EVIDENCE** | The owner judges the request under-evidenced to answer. | **`loa-straylight` must produce more documentation** (toward ADR-048C M1–M8 / Phase 48A E1–E8) **before asking again.** No lane opens; no gate moves. |

> These five options are the *only* recognized responses. **Silence is not one of them** — a
> non-response is not DEFER-by-default, not ACCEPT-by-default, and not REJECT-by-default; it
> simply leaves the request unanswered and the §3 state unchanged (§5 general principle).

---

## 7. What this packet explicitly does and does not do (request boundaries)

Stated explicitly, as the brief requires:

1. **This packet does NOT open #9 or #10.** Neither sibling gate is opened, unblocked, or
   resolved. Both stay HELD per §3.
2. **This packet does NOT bind `loa-finn`, `loa-dixie`, or `loa-hounfour`.** Naming them as
   candidate owners and asking them a question binds none of them; the canonical owner cannot
   unilaterally bind a sibling (`cross-repo-handoff-index.md`:519-543).
3. **This packet does NOT prefetch or assume owner acceptance.** No owner response is asserted to
   exist. The packet requests responses that do not yet exist (§2 evidence-bound rule).
4. **Any future owner acceptance must be recorded in that owner's lane or in an accepted
   cross-repo decision.** Acceptance is real only when recorded in the owning repo under teammate
   review (or in an accepted cross-repo decision record) — never inferred from this packet, and
   never inferred from silence (§5 general principle; ADR-048B §7).

These boundaries are in addition to — not a substitute for — the full non-authorization list in
§9.

---

## 8. Next-lane recommendation

> **Recommended next lane: `Phase 48E — owner-response intake gate` (in `loa-straylight`,
> docs/decision-only).**

Four candidate next lanes were considered:

| Candidate next lane | Selected? | Reason |
|---------------------|-----------|--------|
| **Phase 48E: owner-response intake gate in `loa-straylight`, docs/decision-only.** | **Yes (strong default).** | No owner acceptance is recorded yet (§3). The safe, in-repo, docs-only step is a gate that *intakes and classifies* whatever responses the owners eventually record (ACCEPT / REJECT / DEFER / NEEDS_SPLIT / NEEDS_MORE_EVIDENCE), without itself opening any lane or assuming any response. It stays on the semantic-owner side, binds nothing, and keeps the no-host default intact. |
| Phase 48E: **#9 owner-acceptance request *in* `loa-finn`** — only if owner acceptance is actually obtained. | **No (precondition unmet).** | Opening or escalating *inside* the Finn repo is sibling-repo work the canonical owner cannot initiate unilaterally, and it presupposes a recorded Finn-owner ACCEPT that **does not exist** (§3). Not selected. |
| Phase 48E: **#10 owner-acceptance request *in* `loa-dixie`** — only if owner acceptance is actually obtained. | **No (precondition unmet).** | Symmetric to the above; also risks being mistaken for widening the narrow recall-intake slice ADR-026D authorized (ADR-026D:563-566), which §9 forbids. Presupposes a recorded Dixie-owner ACCEPT that does not exist. Not selected. |
| Phase 48E: **split-request decomposition** if the combined packet is too broad. | **Held in reserve.** | Appropriate only if an owner records **NEEDS_SPLIT** (§6). No such response exists yet, so decomposition is premature; it is recorded so a human can choose it if a NEEDS_SPLIT response arrives. |

**Why the owner-response intake gate is safest.** It does exactly what the corridor needs after a
*request*: prepare to **receive** responses (which must be recorded by the owners in their own
repos under teammate review, E8) without prejudging, prefetching, or fabricating them. It is
docs-only, binds nothing, opens no lane, and — critically — does not presuppose any owner
acceptance. The two *in-sibling* request lanes are explicitly **conditioned on actual recorded
owner acceptance**, which does not yet exist; the split lane is conditioned on a NEEDS_SPLIT
response, which does not yet exist. The intake gate is therefore the only option whose
precondition is already met.

**Repository routing (pending human / code-owner confirmation):**

| Lane | Likely repo | Owns | Status |
|------|-------------|------|--------|
| Phase 48E owner-response intake gate | `loa-straylight` | Intake + classification of recorded owner responses; the no-host default; the decision frame | Recommended; not yet opened |
| Gate #9 runtime evidence lane | `loa-finn` (candidate) | Runtime / enforcement placement (#9) | HELD; opens only on recorded owner ACCEPT (E8) |
| Gate #10 boundary evidence lane | `loa-dixie` (candidate) | Route-side ingress / control-plane boundary (#10) | HELD (broad); opens only on recorded owner ACCEPT (E8) |
| Substrate-schema dependency (if implicated) | `loa-hounfour` (candidate) | Substrate schema only — never Straylight semantics | Out of scope here; route only if evidence implicates it |

**PR title format (future).** Any follow-on PR title **must include the phase label**, e.g.:

- `Phase 48E: owner-response intake gate`
- `Phase 48E (loa-finn): gate #9 runtime placement evidence lane` *(only if the Finn owner records ACCEPT)*
- `Phase 48E (loa-dixie): gate #10 boundary evidence lane` *(only if the Dixie owner records ACCEPT)*

Prefer **medium bounded slices** for Phase 48E where safe — **but** Phase 48E remains
docs/decision-only and authorizes none of §9.

---

## 9. What this packet does NOT authorize

This Phase 48D packet **does not authorize** any of the following. Each remains blocked and is
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

- **open the #9 or #10 evidence lanes** — both stay HELD (§3, §7 item 1);
- **bind `loa-finn`, `loa-dixie`, or `loa-hounfour`** — they are named as candidate owners and
  asked a question, nothing more (§7 item 2);
- **prefetch, assume, or claim that any owner acceptance exists** — none is recorded, and this
  packet asserts none (§7 item 3);
- **treat silence as acceptance** (or as rejection, or as deferral) — a non-response leaves the
  §3 state unchanged (§5 general principle, §6);
- **imply that the no-host decision satisfies or discharges gate #8** — the no-host outcome keeps
  gate #8 OPEN / HELD and blocks D.1 closure (ADR-048C §7);
- treat Dixie as the canonical semantic owner (Dixie owns route-side / control-plane records only
  — Admission-Wedge:153);
- treat Finn runtime / audit ownership as canonical semantic ownership (Finn EMITS what the wedge
  DEFINES — ADR-022D:106-107);
- treat Hounfour schema substrate as runtime / storage ownership (Hounfour is schema/protocol
  only — ADR-022C:83-87; ADR-024A:50-56);
- assign runtime / storage *implementation* ownership to any repo (it asks a question and records
  no acceptance — §4, §5);
- widen the narrow recall-intake gate #10 slice already authorized by ADR-026D, nor open the
  broad Dixie boundary (ADR-026D:563-566).

> **No production-readiness claim.** Authoring a combined owner-acceptance *request* clarifies
> *whom to ask, what their answer would and would not mean, and what evidence a later lane would
> need*; it does **not** clear the independent production gates and it records **no** acceptance.
> Gate #8 stays OPEN, gates #9 / #10 stay HELD, gate #11 (Freeside, `ADR-022E:60`) and gate #12
> (new network surface, `ADR-022E:61`) stay HELD, and the threat-model-widening discipline
> (gate #20, `ADR-022E:69`) is untouched.

---

## 10. Independent-auditor checklist (for Codex)

An independent auditor should be able to confirm **every** line below by inspection of this
packet and the cited `loa-straylight` files. Each is a verifiable claim:

- [ ] **Single-file change.** The branch adds exactly one new file,
      `docs/ADR-022E-SIBLING-GATE-9-10-OWNER-ACCEPTANCE-REQUEST-PACKET.md`, and changes nothing
      else (verify via `git status --porcelain=v1 --untracked-files=all`).
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `fixtures/`, `dist/`,
      `dist-types/`, `package.json`, `package-lock.json`, `.github/`, `.claude/`, `.loa/`,
      `grimoires/`, or any sibling repo.
- [ ] **Title carries the phase label.** The H1 contains `Phase 48D`.
- [ ] **Request packet at top-level `docs/`, not an ADR.** The file lives at top-level `docs/`
      (like Phase 48A), is not numbered `ADR-048D`, and records no decision — it requests
      (Naming note, §1).
- [ ] **Gate citations are real.** ADR-022E gate #8 = `ADR-022E:57`, gate #9 = `:58`, gate #10 =
      `:59`, gate #11 = `:60`, gate #12 = `:61`, gate #20 = `:69` resolve to the actual rows in
      [`./decisions/ADR-022E-phase-22-deferred-features.md`](./decisions/ADR-022E-phase-22-deferred-features.md);
      gate #8 / #9 / #10 are HELD.
- [ ] **Source hierarchy is correct.** §2 ranks 48C as the immediate predecessor controlling the
      no-host state, 48B as controlling the decision-frame boundary, 48A as the gate-request
      predecessor, and Dixie 47Z as blocked-state evidence only (not authority).
- [ ] **Live state restated, not changed.** §3 restates no host selected; no proposed adapter;
      `ADR-022E:57` not satisfied; D.1 (i) accepted/not-reopened; D.1 (ii) unresolved/held; full
      D.1 NOT YET SATISFIED; gate #8 OPEN/HELD; #9/#10 HELD; D.2 not started; MVP-2 OPEN.
- [ ] **No overclaim.** No affirmative claim that D.1 is SATISFIED, gate #8 is DISCHARGED,
      `ADR-022E:57` is SATISFIED, MVP-2 is CLOSED, a host is SELECTED, #9 / #10 are RESOLVED or
      OPENED, D.2 is STARTED, owner acceptance EXISTS, silence IS acceptance, or anything is
      production-ready. Every such phrase appears only inside a negation / non-authorization.
- [ ] **Four lanes asked + five response options each.** §4 / §5 cover #9 (`loa-finn`), #10
      (`loa-dixie`), schema/substrate (`loa-hounfour`, conditional), and Straylight
      decision-frame continuation, each with ACCEPT / REJECT / DEFER / NEEDS_SPLIT /
      NEEDS_MORE_EVIDENCE.
- [ ] **Per-lane six fields present.** Each lane in §5 specifies response options, what
      acceptance would mean, what it would not mean, evidence required next, what stays blocked,
      and why silence is not acceptance.
- [ ] **Acceptance semantics defined.** §6 defines ACCEPT (host a lane, not that evidence
      exists/passes), REJECT (lane closed, routing returns to `loa-straylight`), DEFER (no lane
      opens, gate #8 held), NEEDS_SPLIT (future split), NEEDS_MORE_EVIDENCE (more docs first).
- [ ] **Silence is never acceptance.** §1, §5 general principle, §6, and §9 all state that a
      non-response is not consent and leaves the §3 state unchanged.
- [ ] **Explicit request boundaries.** §7 states the packet does not open #9/#10, does not bind
      the siblings, does not prefetch/assume acceptance, and that future acceptance must be
      recorded in the owner's lane or an accepted cross-repo decision.
- [ ] **Next lane named with phase label + repo routing.** Phase 48E owner-response intake gate
      (`loa-straylight`, docs/decision-only) is the strong default, with the in-sibling and split
      alternatives explicitly conditioned on responses that do not yet exist (§8).
- [ ] **Non-authorization list is complete.** §9 enumerates all 18 numbered non-authorization
      items plus the additional "does not" clauses.
- [ ] **No secret / connection / host leak.** No connection string, port, credential,
      database-engine product name, or container/orchestration detail appears.
- [ ] **No index edit.** Top-level `docs/` and `docs/decisions/` have no index/register file;
      none is created or modified.
- [ ] **No commit / push / PR** was performed by the authoring step.

---

## 11. Coverage ledger (verified)

Each required content item maps to a section; counts were verified against this document before
publication.

| Req. item | Requirement | Where | Verified |
|-----------|-------------|-------|----------|
| 1 | Title includes `Phase 48D` | H1 | ✅ |
| 2 | Status: docs/decision-only combined #9/#10 owner-acceptance request packet | banner, §1 | ✅ |
| 3 | Source hierarchy (48C immediate predecessor / no-host; 48B decision-frame boundary; 48A gate-request predecessor; Dixie 47Z evidence-only) | §2 | ✅ (6 ranks) |
| 4 | Live state restated (no host; no adapter; `ADR-022E:57` not satisfied; D.1 (i) accepted; (ii) held; full D.1 not satisfied; gate #8 OPEN/HELD; #9/#10 HELD; D.2 not started; MVP-2 OPEN) | §3 | ✅ (10 rows) |
| 5 | Owner-acceptance request table (#9→finn, #10→dixie, schema→hounfour conditional, straylight continuation) | §4 | ✅ (4 lanes) |
| 6 | Per-lane six fields (options; acceptance means; acceptance does not mean; evidence next; remains blocked; why silence ≠ acceptance) | §5 | ✅ (6 fields × 4 lanes) |
| 7 | Explicit request boundaries (no open; no bind; no prefetch; future acceptance recorded in owner lane / cross-repo decision) | §7 | ✅ (4 statements) |
| 8 | Acceptance semantics (ACCEPT / REJECT / DEFER / NEEDS_SPLIT / NEEDS_MORE_EVIDENCE) | §6 | ✅ (5 options) |
| 9 | Next lane (Phase 48E owner-response intake gate in `loa-straylight`, docs-only) with routing + alternatives | §8 | ✅ (4 considered) |
| 10 | Explicit non-authorizations | §9 | ✅ (18 numbered items) |
| 11 | Independent-auditor checklist | §10 | ✅ (18 lines) |
| 12 | Coverage ledger (only if counts match) | §11 (this table) | ✅ |

**Count verification (exact):**

- Source-hierarchy ranks in §2: **6** (doctrine/architecture; Phase 48C; Phase 48B; Phase 48A;
  ADR-022E gate inventory; Dixie 47Z evidence).
- Live-state rows in §3: **10**.
- Request lanes in §4: **4** (#9 Finn; #10 Dixie; Hounfour-conditional; Straylight continuation).
- Per-lane fields in §5: **6** (requested response options; acceptance-would-mean;
  acceptance-would-not-mean; evidence-required-next; remains-blocked; why-silence-is-not-acceptance).
- Response options in §6: **5** (ACCEPT, REJECT, DEFER, NEEDS_SPLIT, NEEDS_MORE_EVIDENCE).
- Explicit request-boundary statements in §7: **4**.
- Candidate next lanes considered in §8: **4** (48E intake gate [default]; 48E #9 in `loa-finn`;
  48E #10 in `loa-dixie`; 48E split-request decomposition).
- Non-authorization numbered items in §9: **18**.
- Auditor checklist lines in §10: **18**.

> The ledger is included **because** these counts were verified to match exactly. If any count
> had differed, this ledger would have been omitted rather than published with a mismatch.

---

## 12. Cross-references

- [`./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md`](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md)
  — Phase 48C; the immediate predecessor that selected Candidate E (no-host / no-selection),
  established the live state restated in §3, and selected this combined-request lane (§9 / M1).
  **Controls the no-host / no-selection state.**
- [`./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md`](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md)
  — Phase 48B; owns the host-selection / sibling-gate-routing **decision frame** and the
  acceptance-required (E8) discipline. **Controls the decision-frame boundary.**
- [`./ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md`](./ADR-022E-SIBLING-GATE-9-10-RESOLUTION-REQUEST-PACKET.md)
  — Phase 48A; the gate-request predecessor (E1–E8; E8 = recorded owner acceptance / rejection),
  and the top-level-`docs/` request-packet precedent this packet follows.
- [`./decisions/ADR-022E-phase-22-deferred-features.md`](./decisions/ADR-022E-phase-22-deferred-features.md)
  — gate inventory: gate #8 (`:57`, HELD), #9 (`:58`, HELD), #10 (`:59`, HELD), #11 (`:60`), #12
  (`:61`), #20 (`:69`). Read read-only; **not modified**.
- [`./decisions/ADR-020A-straylight-semantic-owner.md`](./decisions/ADR-020A-straylight-semantic-owner.md)
  / [`./decisions/ADR-022A-straylight-semantic-home.md`](./decisions/ADR-022A-straylight-semantic-home.md)
  — Straylight is the semantic owner (S1); ownership does not follow location.
- [`./decisions/ADR-022C-schema-dependency-direction.md`](./decisions/ADR-022C-schema-dependency-direction.md)
  / [`./decisions/ADR-024A-hounfour-116-substrate-intake.md`](./decisions/ADR-024A-hounfour-116-substrate-intake.md)
  — Hounfour as schema/protocol substrate only (S3); adopt-by-alias, never rename (basis for
  §5.3).
- [`./decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md)
  — receipt / audit-chain invariants any production adapter must preserve (S4); `StorageAdapter`
  seam; `InMemoryStorage` / `JsonlStorage` (basis for §5.1 evidence-next).
- [`./decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md`](./decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md)
  — gate #10 narrowly unblocked for recall-intake only, gate #8 still HELD; the
  canonical-store-vs-Dixie-ingress boundary (S5, basis for §5.2).
- [`./ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md`](./ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md)
  — gate #8 reaffirmed HELD; substrate-vs-ingress storage boundary (basis for §5.2 / §9).
- [`./product-context/source-hierarchy.md`](./product-context/source-hierarchy.md) — doctrine /
  architecture-as-authority, handoffs/evidence-as-non-authority rule (basis for §2).
- [`./handoffs/cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) /
  [`./handoffs/finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — sibling-repo PRs
  require teammate review; the owner cannot unilaterally bind a sibling (basis for §1, §5, §7).
- **Dixie-side (read as evidence, NOT modified):** `loa-dixie` Phase 47T–47Z chain; Phase 47Z
  conclusion `NOT READY / HELD` (PR #201); posture `BLOCKED_FOR_HUMAN_ROUTING`; the `D.1`
  conjunct decomposition, `D.2–D.14` enumeration, six-MVP roadmap, and `MVP-2`. Confirm in the
  owning repo.

---

*End of Phase 48D packet. Docs/decision-only combined #9 / #10 owner-acceptance request packet.
This packet REQUESTS owner responses (ACCEPT / REJECT / DEFER / NEEDS_SPLIT / NEEDS_MORE_EVIDENCE)
and structures what each would and would not mean; it RECORDS no acceptance, treats no silence as
acceptance, OPENS no sibling lane, BINDS no sibling repo, SELECTS no host, proposes no production
adapter, RESOLVES no gate, SATISFIES no `ADR-022E:57`, SATISFIES no D.1, STARTS no D.2, DISCHARGES
no gate #8, CLOSES no MVP-2, and authorizes none of the §9 items. No commit, no push, no PR.*
