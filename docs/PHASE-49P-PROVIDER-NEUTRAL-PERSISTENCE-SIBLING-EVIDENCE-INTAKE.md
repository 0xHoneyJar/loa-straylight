# Phase 49P — Sibling evidence intake and provider-neutral canonical-estate persistence requirements

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive and
> canonical-store **semantic owner**.
> **Phase**: **Phase 49P** — the ADR-049 §10 step 3 **PR A: sibling evidence
> intake** (`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:478`).
> **Type**: docs-only intake and requirements record. This branch changes exactly
> one file — this one. No source, test, schema, migration, package, script,
> workflow, control-plane, decision-record, or sibling-repository path is touched.
> **Authority basis**: ADR-049 §9.1 portability clauses
> (`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:442`–`460`)
> and §10 step 3 (`:478`); ADR-050 authorized corridor `phase-49p`; operator
> authorization recorded by the lane-activation event on control-plane lane issue
> #118. `operator:eileen` is the sole Straylight decision authority (ADR-049 §6,
> `docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:312`).
> **Result token**: **`SIBLING_EVIDENCE_INTAKE_AND_PROVIDER_NEUTRAL_PERSISTENCE_REQUIREMENTS_RECORDED`**

---

## 1. What this document does, and what it must not do

It does four things, and only these:

1. **Binds** the two merged sibling evidence responses to their exact repository,
   pull request, and merge commit (§2).
2. **Intakes** each response as *bounded sibling evidence*, recording for each
   what it **proves**, what it **cannot prove**, and what it **defers** (§3, §4).
3. **Derives** the provider-neutral canonical-estate persistence requirements
   that any future authorized persistence work must satisfy — across conforming
   agents, controllers, tenants, runtimes, model providers, clouds, and storage
   hosts (§6).
4. **Routes** provider acceptance and implementation authorization to the
   separate Phase 49Q decision (§8), leaving every gate exactly as it stands (§9).

It does **not** accept, select, approve, provision, configure, or deploy Railway
PostgreSQL or any other provider; does not discharge ADR-022E gate #8, resolve
D.1(ii), satisfy D.1, start D.2, close gate #9 or gate #10, or close MVP-2; does
not design, propose, or authorize a `StorageAdapter`, canonical migrations,
production wiring, rollout, cutover, credentials, auth, consent, signer
behavior, or living-estate admission; and does not change estate semantics,
assertion classes or statuses, signer competence, identity, challenge,
revocation, forgetting, inheritance, commitment, or permanence. §10 records
these as explicit negations.

**Evidence intake is not acceptance.** Under ADR-049 §7
(`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:342`) sibling
repositories supply evidence; no participant converts evidence into acceptance,
and every cross-repo Straylight acceptance routes through the operator. This
document is the intake half of that distinction and carries none of the
acceptance half.

---

## 2. Evidence binding — exact merged artifacts

Both responses were verified as **merged** at the exact commits named below.
Every claim in §3 and §4 is bound to these commits; nothing is taken from an
unmerged branch, a draft, or a sibling working tree.

| Counterparty | Gate | Pull request | Merge commit (binding SHA) | Merged |
|---|---|---|---|---|
| `0xHoneyJar/loa-finn` | #9 (runtime evidence lane) | PR **#258** — *Phase 49M: record Finn gate 9 evidence response* | `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` | yes |
| `0xHoneyJar/loa-dixie` | #10 (boundary evidence lane) | PR **#255** — *Phase 49N: record Dixie gate 10 evidence response* | `d36c0846f03bfd097d35dd2c001de19eec817cf0` | yes |

Each response consists of exactly three Markdown documents added under the
sibling repo's `docs/` tree — no source, test, config, schema, migration, or
workflow change in either PR:

| Binding SHA | Artifact (path in the sibling repo) | Recorded result token |
|---|---|---|
| `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` | `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md` | `FINN_GATE_9_RAILWAY_POSTGRESQL_EVIDENCE_RESPONSE_RECORDED` |
| `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` | `docs/ADR-022E-GATE-9-FINN-RUNTIME-BOUNDARY-EVIDENCE.md` | `FINN_GATE_9_RUNTIME_BOUNDARY_EVIDENCE_RECORDED` |
| `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` | `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md` | `FINN_GATE_9_EVIDENCE_RESPONSE_ROLLUP_RECORDED` |
| `d36c0846f03bfd097d35dd2c001de19eec817cf0` | `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md` | `DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_RESPONSE_RECORDED` |
| `d36c0846f03bfd097d35dd2c001de19eec817cf0` | `docs/ADR-022E-GATE-10-DIXIE-BOUNDARY-EVIDENCE.md` | `DIXIE_GATE_10_BOUNDARY_EVIDENCE_RECORDED` |
| `d36c0846f03bfd097d35dd2c001de19eec817cf0` | `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md` | `DIXIE_GATE_10_EVIDENCE_RESPONSE_ROLLUP_RECORDED` |

**What binding means here.** A result token records that a sibling owner
*authored and returned* a response. It does not record that the response is
sufficient, that a gate moved, or that a candidate was accepted — each sibling
rollup says so itself, and Straylight, as intake owner, is the only party that
judges sufficiency. Sibling section references below are cited by document and
section against the binding SHA; the sibling evidence documents themselves state
that their internal line anchors are anchors rather than immutable coordinates
(Finn boundary evidence §2; Dixie boundary evidence §3), so sections — not line
numbers — carry the citation.

**Both responses answer the eight-topic request shape** that Straylight prepared
in Phase 49J for each counterparty — the eight numbered request topics themselves,
not merely the section that heads them
(`docs/ADR-022E-GATE-8-FINN-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md:63`–`:84`;
`docs/ADR-022E-GATE-8-DIXIE-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md:63`–`:84`),
topic-for-topic, and both were opened under the Phase 49L dispatch authorization
recorded in the rollup's Finn and Dixie authorization summaries
(`docs/ADR-022E-GATE-8-FINN-DIXIE-EVIDENCE-DISPATCH-DECISION-ROLLUP-GATE.md:46`–`:67`,
with the underlying authorization results tabulated at `:29`–`:33`).
Responsiveness is recorded; sufficiency for *acceptance* is not — that judgment
belongs to Phase 49Q.

---

## 3. Finn (gate #9) — intake of PR #258 at `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3`

### 3.1 What the Finn response proves

Each item below is proven *locally, within `loa-finn`, at the binding SHA* — the
only grain a sibling repository can prove in.

- **A host-agnostic, feature-flagged, fail-closed PostgreSQL integration path
  exists.** Boot gates PostgreSQL behind a flag; enabling it without connection
  configuration throws rather than degrading silently; disabling it continues on
  Finn's default persistence path; a boot-time database validation step runs
  after connecting (Finn runtime boundary evidence §3.1). Finn's own recorded
  qualification: boot validation covers three base tables only, so the
  fail-closed property is proven **for the validated base tables**, and
  PostgreSQL-backed surfaces beyond them can pass boot validation and meet a
  missing table later at query time.
- **Nothing in Finn's runtime binds that path to a specific managed-PostgreSQL
  provider.** Connection values are read from the environment at boot, not baked
  into source (§3.1). Finn's posture toward the Railway PostgreSQL candidate
  class is stated as **"compatible in kind, uncommitted in fact"** (evidence
  response packet §3.1).
- **Schema-namespace isolation.** Finn's tables are declared inside a dedicated
  PostgreSQL schema namespace documented in-source as isolated from other
  services, and the tables there are Finn-local operational records that claim
  no canonical-store semantics for any external system (§3.2).
- **A WAL-first durability posture that does not root in PostgreSQL.** Finn's
  primary durability mechanism is a write-ahead log with typed, checksummed
  entries, with PostgreSQL an additional flag-gated store (§3.3). Finn's own
  qualification: this is a **storage-dependency** claim, not a boot-sequence
  claim — the flag-gated PostgreSQL block runs before WAL initialization, so an
  enabled flag with invalid configuration stops boot before the WAL initializes.
- **Zero Straylight/ADR-022E coupling in Finn's `src/` tree** (negative
  evidence, §3.5). This is a **literal-coupling** finding: no Finn `src/` file
  mentions Straylight or ADR-022E, so no existing Finn surface discharges the
  gate #9 responsibility by wiring. Straylight's intake does **not** extend it
  into a general non-drift conclusion: absence of literal coupling is evidence
  about identifiers, not about semantic behavior, and the two open
  locally-defined-classification findings in §3.4 sit on surfaces this search
  would not reach.
- **No Railway-specific configuration, dependency, or runtime binding in the
  `src/` runtime tree** (§3.6). Finn narrows this claim itself: two comment-only
  Railway mentions exist in one `src/` cost module, and Railway-aware
  *operator-side cost accounting* surfaces exist outside `src/` (a playtest cost
  readout input and observatory cost-ledger fields) which treat Railway usage as
  an externally supplied number. The supportable claim is therefore "no
  Railway-specific configuration or runtime binding in `src/`", not "zero Railway
  mentions".
- **A narrow, replaceable substrate seam** — connection factory, boot-time
  feature flag, boot-time schema validation, dedicated schema namespace
  (evidence response packet §3.5) — with Finn's own qualification that a
  standalone migration runner constructs its own client, so a host change would
  touch **two** client-construction points, not one (§3.1).
- **A recorded no-leak posture**: the response cites Finn configuration surfaces
  by path and describes their shape, never their values (packet §3.4).

### 3.2 What the Finn response cannot prove

- Any **operational property of any managed PostgreSQL provider** — durability,
  backup/restore, failover, version pinning, network isolation, tenancy. These
  are provider-side facts with no local artifact (§4).
- That Finn's existing schema or WAL surfaces are **suitable, sufficient, or
  relevant** for a Straylight canonical store; no such requirement exists
  locally to test against (§4).
- **Gate state** for Straylight gate #8, Finn gate #9, or Dixie gate #10 — gate
  state lives in `loa-straylight` (§4).
- **Anything about `loa-dixie`'s** boundary posture (§4).
- **End-to-end behavior of the flag-enabled PostgreSQL path against a live
  provider instance** — no such verification artifact exists in-repo, and
  producing one would have exceeded the docs-only authorization (§4).

### 3.3 What the Finn response defers

- To **Straylight**: definition of canonical-store semantics and the
  canonical-store boundary; evaluation and any acceptance of Railway PostgreSQL
  or any candidate; whether and when candidate acceptance authority is requested;
  the intake and disposition of the response itself (§5).
- To **Dixie**: all gate #10 boundary evidence (§6).
- To a **later production host/adapter decision**: host selection, production
  database selection, adapter design, migration and cutover approach, connection
  topology, credential handling, and production wiring (§7).

### 3.4 Two Finn-side findings this intake carries forward unresolved

Finn's own packet §3.2 records that the predecessor gate #9 evidence result
documents **two unresolved semantic-ownership-creep findings** on surfaces other
than the PostgreSQL storage surface: `TIER_TRUST_MAP`
(`src/hounfour/economic-boundary.ts`) and `CRITICAL_ACTIONS`
(`src/hounfour/audit/buffered-audit-chain.ts`) **locally define** classifications
rather than enforcing externally-supplied ones. Finn states that these are part
of why that result is `PARTIAL` and gate #9 remains held, does not claim them
resolved, and records "enforce/emit/persist under externally-defined semantics —
never canonical semantic ownership" as its **committed target posture** rather
than a proven present state.

Straylight's intake position: both findings are carried forward **UNRESOLVED**,
exactly as Finn records them. They are locally-defined-classification findings on
non-storage surfaces, and this document neither resolves them, nor treats them as
resolved, nor treats the storage-surface and literal-coupling evidence in §3.1 as
answering them. Finn's own scoping is the boundary Straylight adopts: the
no-creep statement is supportable **for the PostgreSQL storage surface**, and
Finn's own packet §3.2 records that these two findings still require separate
treatment "before Finn could host the gate #9 responsibility cleanly." They bear
on gate #9's own disposition, not on the persistence requirements in §6. They are
a recorded input to Phase 49Q, not a blocker this document clears.

---

## 4. Dixie (gate #10) — intake of PR #255 at `d36c0846f03bfd097d35dd2c001de19eec817cf0`

### 4.1 What the Dixie response proves

- **The boundary surface is default-off and env-gated.** The admission-intake
  spike flag is derived from a strict env gate with a fail-closed default, and
  the route is mounted only inside a conditional on that flag — when off, the
  default, the route is not registered at all (Dixie boundary evidence §5.1).
- **Zero local definitions of the canonical Straylight primitives.** A fresh
  search for local `Assertion`, `TransitionReceipt`, `AuditEvent`,
  `RecallReceipt`, and `EstateTransition` declarations returned no matches;
  every appearance is a **type-only import** from the Straylight package
  (§5.2, §5.3). Dixie carries references; it does not own semantics.
- **The boundary spike tree is reference-carrying, not storage-owning**, and
  includes a forbidden-public-keys denylist on its no-leak module (§5.4).
- **Isolation of the spike from Dixie's own production DB paths is
  test-enforced**, by named scope-guard, durable-migration-isolation, and
  SQL-isolation test files (§5.5).
- **Dixie's own stack is PostgreSQL-conversant** — its own client, pool,
  transaction, and migration layer with Dixie-local migrations (§5.6). Dixie
  states the boundary relevance carefully and Straylight records it the same
  way: this proves the *class* of substrate is not foreign to that codebase; it
  does **not** make Dixie's DB layer a canonical-store candidate, an adapter, or
  a shared substrate, and none of it is reachable from the spike tree.
- **No Railway-specific coupling in the runtime source** — the only matches are
  comments describing the generic PaaS convention that a platform-injected port
  variable takes precedence for the HTTP listener; no provider SDK, no provider
  config file, no provider-conditional code path (§5.7).
- **Straylight preserved as semantic owner**: Straylight defines the canonical
  assertion, the first-class transition receipt, the append-only hash-chained
  audit event, governed recall and admission semantics, and estate-force
  transitions; Dixie carries boundary, ingress, reference, and control-plane
  records for what Straylight defines — and nothing more (evidence response
  packet §4.3).

### 4.2 What the Dixie response cannot prove

- **Anything Straylight-side**: the canonical primitive definitions, the
  ADR-022E gate anchors, and the Phase 49J/49K/49L artifacts live in this
  repository and are not citable from that checkout, so **end-to-end alignment
  of the references Dixie carries with Straylight's definitions cannot be
  demonstrated there** (boundary evidence §6.1).
- **Anything about Railway PostgreSQL as a platform** — durability, backup,
  availability, isolation, operational, or compliance properties (§6.2).
- **Anything about Finn** (§6.3).
- **Production boundary behavior** — the boundary exists only as a default-off
  spike; there is no production admission boundary whose behavior could be
  evidenced, by design, while gate #8 remains held (§6.4).

### 4.3 What the Dixie response defers

- To **Straylight**: semantic ownership of the canonical-store boundary;
  evaluation and any acceptance of a candidate; the substrate contract; the
  disposition of gate #8; sufficiency judgment on the response at intake (§7).
- To **Finn**: gate #9 runtime evidence and any Finn-side posture (§7).
- To a **later production host/adapter decision**: adapter design, host
  selection, connection and operational posture, migration and rollout shape,
  and any boundary-side requirement the eventual substrate contract may impose on
  the reference formats Dixie carries (§7).

Dixie additionally records two bounded caveats on its own "no further Dixie-side
artifact is needed" answer (evidence response packet §4.8): sufficiency is
Straylight's to decide at intake, and if the eventual substrate contract imposes
boundary-side requirements, a further bounded Dixie lane may be needed **after**
that contract exists — a deferral, not a present gap.

---

## 5. Intake findings

### 5.1 Neither sibling becomes the Straylight semantic owner

Confirmed from both responses, on independent evidence of the same shape:
Finn holds zero literal Straylight/ADR-022E coupling in its `src/` tree (§3.1)
and Dixie declares zero canonical primitives locally, importing them type-only
(§4.1). Straylight remains the semantic owner of the canonical-store boundary —
ADR-048B records `loa-straylight` as the **permanent** owner of canonical
Straylight semantic ownership (row S1,
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:155`),
and separately records the canonical-store **physical host** as **UNSELECTED**
with gate #8 held (row S2, `:156`). Those are two different surfaces: the
semantic owner is settled and permanent; only the physical host is unselected.

**Scope of this finding.** It is a *becoming* finding, not a *non-drift* finding.
Both siblings state their non-ownership and Straylight records it; neither the
literal-coupling search nor the storage-surface evidence establishes that no
semantic drift could occur on unexamined surfaces, and Finn's two open
locally-defined-classification findings (§3.4) remain unresolved on exactly such
surfaces. Nothing here concludes that Finn cannot drift toward the gate #9
responsibility; that disposition belongs to gate #9 itself.

### 5.2 Both siblings converge on the same substrate posture — and on the same limit

Each sibling proves itself **host-agnostic and fail-closed at its own boundary**,
and each states that provider operational properties are **unverifiable from its
own repository** and belong to Straylight's evaluation (§3.2, §4.2). The
convergence is genuine but bounded: two independent repositories agreeing that
they cannot evaluate a provider is evidence about *the siblings*, never evidence
*about the provider*. No provider-level durability, restore, isolation, or
operational fact is established anywhere in this intake.

### 5.3 What this intake resolves, and what it explicitly does not

Phase 49I recorded eleven residual blockers on the preferred candidate
(`docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:58`–`68`).
This intake bears on exactly two of them, and only in their **evidence-supply**
sense:

| Blocker | Status after this intake |
|---|---|
| **B-1** Finn gate #9 owner evidence | **Evidence supplied, merged, and intaken** (§3). The eight requested topics are answered at the binding SHA. Gate #9 itself remains **HELD** at `PARTIAL_RECORDED`. |
| **B-2** Dixie gate #10 owner evidence | **Evidence supplied, merged, and intaken** (§4). The eight requested topics are answered at the binding SHA. Gate #10 itself remains **HELD** at `PARTIAL_RECORDED`. |
| **B-3** adapter proposal authority · **B-4** implementation authority · **B-5** production wiring authority · **B-6** candidate acceptance authority · **B-7** gate #8 satisfaction authority · **B-8** D.1(ii) resolution · **B-9** D.1 satisfaction · **B-10** D.2 start · **B-11** MVP-2 closure | **Open, untouched.** Each is a separate later authority; this document exercises none of them. |

The distinction in B-1 and B-2 is load-bearing and is stated once here: the
blocker was *the absence of sibling owner evidence*. That absence is now closed.
**Closing the evidence-supply blocker is not closing the gate** — gates #9 and
#10 remain held at `PARTIAL_RECORDED`
(`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`, `:161`),
and this document is not authorized to move either, nor does it.

---

## 6. Provider-neutral canonical-estate persistence requirements

These requirements are **derived**, not designed. Each restates an obligation
already binding in this repository — in the recorded `StorageAdapter` contract,
the audit-chain implementation, the Phase-5 hardening invariants, ADR-022D, or
the ADR-049 §9.1 clauses — and generalizes it to the neutrality dimensions the
lane requires. **No interface, adapter, migration, schema, wiring, or
implementation is proposed, sketched, or authorized by any requirement below.**

**Neutrality dimensions.** Every requirement holds independently of: the *agent*
whose estate is persisted; the *controller* bound to that estate; the *tenant*
boundary the deployment draws; the *runtime* enforcing at the edge; the *model
provider* generating candidate material; the *cloud* the substrate runs in; and
the *conforming storage host* holding the bytes. A requirement that held only for
one choice on any of these axes would not be a canonical-estate requirement — it
would be a deployment detail.

| # | Requirement | Derived from |
|---|---|---|
| **P-1** | **Semantic ownership is non-transferable.** Straylight defines estate semantics; a persistence substrate is a storage surface and never a semantic authority. No agent, controller, tenant, runtime, model provider, cloud, or storage host acquires definitional power over an estate by holding, enforcing at, or routing to its records. | ADR-048B `:155` (`loa-straylight` is the **permanent** owner of canonical Straylight semantic ownership) read with `:156` (the canonical-store **physical host** is UNSELECTED, gate #8 held) — the host surface is unselected, the semantic owner is not; ADR-022D `:106`–`:107` (the host is a persistence/exposure surface, not the semantic owner); both siblings' recorded non-ownership (§5.1) |
| **P-2** | **No provider-, deployment-, or host-specific product concept in the domain model.** No provider-, deployment-, or host-specific product concept, semantics, or configuration — a named vendor or managed offering, its proprietary features, its product-specific behavior, or its deployment/configuration particulars — may appear in the estate domain model or in canonical migration semantics; such configuration lives only at the adapter/deployment boundary. Provider-neutral concepts are **not** prohibited: the domain model may name storage hosts, clouds, runtimes, controllers, tenants, and model providers **generically**, as this document's own neutrality dimensions do, precisely because generic naming is what makes an obligation host-invariant. | ADR-049 §9.1 clauses 1, 2, 5 (`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:446`, `:447`, `:450`) — each clause is scoped to *Railway-specific* concepts, *Railway-specific* migration semantics, and configuration at the adapter/deployment boundary; none prohibits a provider-neutral concept |
| **P-3** | **A conforming host satisfies the recorded adapter semantics exactly.** Actors, estates, keyrings, assertions, and receipts use upsert semantics (latest write wins by primary id); transitions and audit events are **append-only** — once written they must be returned in append order and must not be mutated; audit events are hash-chained per estate with a retrievable per-estate tail; unknown ids return absent rather than throwing; integrity violations surface as exceptions and **never as silent drops**. | `src/straylight/storage/types.ts:4`–`:13`, `:33`–`:68`; `src/straylight/audit.ts:31` |
| **P-4** | **Chain of custody survives every move.** The per-estate audit hash chain must verify identically after export, restore, migration, or provider replacement. A broken chain means the store was tampered with or two writers raced, and the estate must be quarantined rather than served. Continuity is a property of the records, not of the host that happens to hold them. | `src/straylight/audit.ts:75`–`:88` (`verifyChain`); `tests/phase-5-hardening.test.ts:326`–`:327` (tampered chain is detectable); ADR-022D `:110`–`:120` (the invariants are the contract the host inherits) |
| **P-5** | **Receipts are never semantically redefined and never re-minted without authority.** A receipt's shape and meaning are Straylight's to define, and no persistence host, runtime, or boundary surface may redefine them, re-mint a receipt without authority, alter or reconstruct one, or surface a receipt it did not receive or was not authorized to emit. This constrains *definition and unauthorized minting*, not participation: an **authorized runtime** — Finn in its ADR-022D role — executes the request under policy, **emits the receipt Straylight defines**, **appends the audit event Straylight defines**, and **persists the resulting chain**. Emitting a Straylight-defined receipt under granted authority is the runtime doing its job; minting one Straylight did not define, or emitting without that authority, is the prohibited act. | ADR-022D `:97`–`:99` (Finn "must execute a `RecallRequest` under policy, emit the receipt the wedge defines, and append the audit-event the wedge defines"); `:106`–`:107` (the host is a persistence/exposure surface, not the semantic owner); `:110`–`:120`, `:170`–`:174` (preserve the receipt categories; refuse to re-mint) |
| **P-6** | **Portability is provider-neutral by construction.** Canonical estate state must be exportable in an ordinary, provider-neutral form and restorable into a **different** conforming host without altering assertion, transition, receipt, or audit semantics. Export and restore are capabilities of the canonical record, not features of a vendor. | ADR-049 §9.1 clauses 3, 6 (`:448`, `:452`) |
| **P-7** | **Restoration is proven before reliance, not assumed.** A documented backup-and-restore exercise against the actual deployment must exist and pass before any production admission relies on that deployment. Provider marketing, defaults, or documentation are not restoration evidence — and, per §5.2, neither sibling can supply it. | ADR-049 §9.1 clause 4 (`:449`); the provider-side gap both siblings record (§3.2, §4.2) |
| **P-8** | **Provider replacement stays live.** The ability to move to another conforming host without changing assertion or receipt semantics must be preserved for the life of the deployment, and no accepted provider may become a permanent architectural dependency. Replaceability that erodes as the deployment matures was never replaceability. | ADR-049 §9.1 clause 6 (`:452`); ADR-049 §10 step 4 (`:484`, "does not make Railway a permanent architectural dependency") |
| **P-9** | **Migration and rollback are provider-neutral and reversible.** Canonical migrations carry no provider-specific semantics, and a rollback procedure must exist for a failed migration or a failed admission deployment before either is attempted. | ADR-049 §9.1 clauses 2, 7 (`:447`, `:454`) |
| **P-10** | **Every authority is granted explicitly, never by implication.** Substrate acceptance, adapter authorization, implementation authorization, production wiring, auth/consent/signer validation, and living-estate admission are **distinct authorities**. Each requires its own **express** operator grant, and none is ever inferred from another: accepting a host never implies authorizing production wiring, and no grant may be read out of silence, adjacency, or the mere existence of a merged artifact. The requirement is **explicitness, not artificial separation**: ADR-049 §10 step 4 contemplates host selection, gate-#8 discharge for a bounded purpose, and `StorageAdapter`/implementation-lane authorization being **expressly co-recorded in one operator-signed Phase 49Q PR** (PR B), and §9.2 compresses the corridor to exactly two Straylight PRs for that reason. Co-recording several distinct grants in one operator-signed decision satisfies this requirement, provided each grant is stated in its own terms; what it forbids is an unstated grant riding along on a stated one. | ADR-049 §9.1 clauses 9, 10 (`:457`, `:458`); ADR-049 §10 step 4 (`:484`–`:492`, one operator-signed PR B carrying host selection, bounded gate-#8 discharge, and adapter/implementation authorization); ADR-049 §9.2 corridor compression (`:461`–`:470`); ADR-049 §6 (`:312`, sole authority); blockers B-3…B-7 (`docs/ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md:60`–`:64`) |
| **P-11** | **Fail-closed behavior is host-invariant.** Missing policy denies; an unknown assertion class fails class validation; an unknown signer fails competence; revoked, forgotten, private, and contested material never surfaces as usable. These must hold identically on every conforming host — persistence unavailability or uncertainty must **deny**, never degrade into a permissive path. | `tests/phase-5-hardening.test.ts:50`, `:93`, `:123`, `:159`; ADR-022D `:110`–`:120` |
| **P-12** | **Concurrency and isolation may not be inherited as assumptions.** The current MVP adapters are explicitly single-writer and single-host, and multi-process safety is recorded as **not guaranteed**. Any host serving concurrent writers must therefore establish isolation and single-writer-equivalent ordering for append-only records **without** altering the semantics in P-3 — the recorded guarantee does not extend to a concurrent deployment, so it must be re-established rather than assumed. | `src/straylight/storage/jsonl.ts:15`–`:20` (single-process, single-host only; multi-process safety NOT GUARANTEED; the MVP assumes a single writer); `src/straylight/storage/types.ts:7`–`:8` (transitions and audit events are append-only and must be returned in append order) |
| **P-13** | **No self-authorized admission.** Runtime or model output may propose candidate material; it may not **admit or activate** that material **by its own authority**, and identity-, relationship-, and permission-affecting assertions require explicit operator acceptance. No model provider's availability, identity, or behavior may condition canonical semantics. The prohibition is on **self-authorization**, not on authorized participation: an authorized runtime executing under granted authority does emit Straylight-defined receipts, append Straylight-defined audit events, and persist the resulting chain (P-5) — it acts as an **authorized canonical writer of Straylight-defined records** while remaining unable to authorize its own admission decisions or redefine what it writes. | ADR-049 §8 (`:404`–`:410`: runtime or model output "may propose candidate observations but may not activate them by itself"; identity-, relationship-, and permission-affecting assertions require explicit operator acceptance); ADR-022D `:97`–`:99` (the authorized runtime executes under policy, emits the defined receipt, appends the defined audit event) |
| **P-14** | **Operational failure reopens the infrastructure decision.** If durability, isolation, restore, or operational evidence fails for an accepted substrate, the infrastructure decision reopens. A reversible decision that is never actually revisited on failure is not reversible. | ADR-049 §9.1 clause 8 (`:455`); ADR-049 §9 (`:432`–`:439`: semantically non-authoritative but not inert — infrastructure still governs operational correctness) |

**Standing of this set.** These are the persistence obligations that any future
authorized work must satisfy, recorded now so that the Phase 49Q decision is
taken against a written standard rather than against an implicit one. They
authorize nothing, and they are not a substrate contract: a substrate contract
would bind a chosen provider, and no provider is chosen (§7). Where §9.1 clauses
supply a requirement, this document restates and generalizes them for intake
purposes; **the obligation to carry the §9.1 clauses remains on the Phase 49Q
acceptance ADR** (ADR-049 §10 step 4, `:484`), and nothing here discharges it.

---

## 7. Railway PostgreSQL — a bounded MVP-2 deployment candidate, not the Straylight product boundary

ADR-049 §9 records Railway PostgreSQL as the selected MVP-2 canonical-store
physical host **direction, pending completion of the evidence-intake sequence**
(`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:427`), and
classifies the decision as **Tier 1** — reversible infrastructure
(`:235`, `:439`). This intake changes none of that and adds nothing to it.

The scope of the candidate, stated once: Railway PostgreSQL is a **current,
bounded deployment candidate for MVP-2's canonical store**. It is not the
Straylight product boundary, not a Straylight architectural dependency, not the
semantic owner of any estate — `loa-straylight` holds that permanently (P-1) —
and, as a provider-specific product concept, not a term in the estate domain
model (P-2). The Straylight invariants live above the storage adapter, and changing
PostgreSQL hosts must not redefine any of them (ADR-049 §9, `:432`–`:436`). A
future accepted host, whichever it is, holds bytes under the §6 requirements and
holds nothing else.

**No provider fact is established by this intake.** Both siblings state that
provider operational properties are unverifiable from their repositories (§5.2),
and this document imports no provider-side claim to fill that gap. The candidate
therefore stands exactly where ADR-049 left it: a direction, evidenced only as to
the sibling boundaries, awaiting an operator acceptance decision that this
document does not make, prejudge, or recommend.

---

## 8. Routing — Phase 49Q owns provider acceptance and implementation authorization

Everything this intake leaves unresolved routes to **one separate later
decision**: the Phase 49Q operator acceptance and implementation-authorization
lane, which is ADR-049 §10 step 4's **PR B**
(`docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:484`–`:492`)
and which sits in the ADR-050 authorized corridor as `phase-49q`. That single
operator-signed PR is where host acceptance and implementation authorization may
be **expressly co-recorded** (P-10); routing them to one decision is the corridor
compression ADR-049 §9.2 chose (`:461`–`:470`), not a collapse of the grants
themselves.

Carried to Phase 49Q, unresolved and unprejudged:

1. Whether Railway PostgreSQL — or any candidate — is **accepted** (blocker B-6).
2. Whether ADR-022E **gate #8 is discharged** for a bounded purpose (B-7), and
   the consequent disposition of D.1(ii), D.1, D.2, and MVP-2 (B-8…B-11).
3. Whether a provider-neutral `StorageAdapter`, canonical migrations,
   implementation, or production wiring is **authorized** (B-3, B-4, B-5).
4. The **provider-side facts no repository can supply**: durability, backup and
   restore behavior, failover, version pinning, network isolation, tenancy
   (§5.2) — including the P-7 restoration proof.
5. The **dispositions of gates #9 and #10** themselves, which remain held (§5.3),
   including Finn's two open locally-defined-classification findings —
   `TIER_TRUST_MAP` and `CRITICAL_ACTIONS` — which this intake carries forward
   unresolved (§3.4).
6. Whether the eventual substrate contract imposes **boundary-side requirements**
   on the references Dixie carries, which would need a further bounded Dixie lane
   *after* that contract exists (§4.3).
7. **Auth, consent, and signer validation**, which ADR-049 §9.1 clause 10
   (`:458`) requires be validated separately after durable storage exists, and
   **living-estate admission** under ADR-049 §8.

Phase 49Q is a **separate lane with a separate operator decision**. This document
neither requests nor pre-approves its outcome, and per P-10 no part of this
intake may be read as partial satisfaction of it.

---

## 9. Preserved state

Every held or open state is preserved exactly as recorded, unchanged by this
document:

- **ADR-022E gate #8** remains **OPEN / HELD** — not discharged
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`;
  `docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:157`).
- **Gate #9** remains **HELD** at `PARTIAL_RECORDED` (`:159`).
- **Gate #10** remains **HELD** at `PARTIAL_RECORDED` (`:161`).
- **D.1(ii)** remains **UNRESOLVED** (`:163`).
- **D.1** remains **NOT SATISFIED** (`:165`).
- **D.2** remains **NOT STARTED** (`:167`).
- **MVP-2** remains **OPEN** (`:168`;
  `docs/decisions/ADR-049-six-mvp-product-roadmap-and-governance.md:498`).
- **The canonical-store physical host remains UNSELECTED** with gate #8 held
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`),
  while **`loa-straylight` remains the permanent semantic owner** of canonical
  Straylight semantic ownership (`:155`). The unselected surface is the physical
  host; semantic ownership is settled.
- **`InMemoryStorage` and `JsonlStorage` remain the only MVP adapters** behind the
  unchanged `StorageAdapter` swap-in seam
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`;
  `src/straylight/storage/types.ts:33`).
- **No production database execution, production write, production migration
  execution, production durable storage, or production auth/consent/signer
  implementation is authorized** (ADR-049 §11, `:501`–`:506`).

---

## 10. Preserved non-claims

Each notion below appears in this document **only inside a negation**. This
intake:

- **accepts, selects, approves, provisions, configures, or deploys no provider** —
  not Railway PostgreSQL, not any cloud, not any managed database, not any host;
- **selects no production database** and **proposes, designs, or authorizes no
  adapter**, migration, schema change, production wiring, rollout, cutover,
  credential handling, or connection topology;
- **discharges no gate**: gate #8 stays open and held; gates #9 and #10 stay
  held; supplying the evidence a blocker demanded is not closing the gate that
  blocker sat behind (§5.3);
- **resolves no dependency**: D.1(ii) unresolved, D.1 unsatisfied, D.2 not
  started, MVP-2 open;
- **transfers no semantic ownership** to Finn, Dixie, Railway, PostgreSQL, any
  cloud, any runtime, any model provider, any adapter, or any controller;
- **changes no estate semantics** — no assertion class or status, signer
  competence, identity, challenge, revocation, forgetting, inheritance,
  commitment, or permanence rule is altered, and no living-estate admission is
  authorized;
- **modifies no sibling repository** and no `loa-finn`, `loa-dixie`,
  `loa-hounfour`, or `loa-freeside` artifact; both sibling responses were read
  read-only at their binding SHAs;
- **touches no source, test, package, lockfile, script, workflow, control-plane,
  schema, migration, SQL, generated, or decision-record path** — this branch
  changes exactly one Markdown file;
- **creates no Straylight authority** and **makes no operator decision**;
  `operator:eileen` remains the sole Straylight decision authority, and Phase
  49Q's outcome is neither requested nor prejudged;
- **establishes no provider-side fact** — no durability, backup, restore,
  failover, isolation, availability, or compliance property of any provider is
  claimed, since no repository in this intake can evidence one;
- **leaks nothing** — no credential, token, key, connection string, database URL,
  endpoint, hostname, port, account or project identifier, region, topology
  detail, environment-variable value, API or command example, pricing figure, or
  deployment instruction appears anywhere in this document.

---

## 11. Result

**Result token**:
**`SIBLING_EVIDENCE_INTAKE_AND_PROVIDER_NEUTRAL_PERSISTENCE_REQUIREMENTS_RECORDED`**

The two merged sibling evidence responses are bound to their exact merge commits
and intaken as bounded sibling evidence, with what each proves, cannot prove, and
defers recorded (§3, §4); neither sibling becomes the Straylight semantic owner,
which `loa-straylight` holds permanently while the physical host remains
UNSELECTED (§5.1), with Finn's two locally-defined-classification findings carried
forward unresolved (§3.4); the sibling-evidence-supply blockers B-1 and B-2 are
closed while gates #9 and #10 remain held (§5.3); fourteen provider-neutral
canonical-estate persistence requirements are recorded as the standard any future
authorized work must satisfy (§6); Railway PostgreSQL remains a bounded MVP-2
deployment
candidate rather than the Straylight product boundary (§7); and provider
acceptance together with implementation authorization routes to the separate
Phase 49Q lane (§8). Gate #8 remains OPEN / HELD and MVP-2 remains OPEN (§9).

---

## 12. Audit checklist

- [ ] **One-file change.** The complete base-to-head diff adds exactly this file
      and changes no other path.
- [ ] **Evidence binding exact.** Finn PR #258 →
      `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3`; Dixie PR #255 →
      `d36c0846f03bfd097d35dd2c001de19eec817cf0`; both verified merged; every
      sibling claim in §3/§4 traceable to a named document and section at that SHA.
- [ ] **Proves / cannot prove / defers complete** for both siblings, including
      each sibling's own self-recorded qualifications and narrowings (§3.1, §3.4,
      §4.1, §4.3).
- [ ] **Negative conclusions bounded.** Finn's negative evidence is recorded only
      as literal Straylight/ADR-022E coupling absence in `src/` and as the
      PostgreSQL storage surface; no broad non-drift or no-creep conclusion is
      drawn, and `TIER_TRUST_MAP` / `CRITICAL_ACTIONS` stay unresolved (§3.1,
      §3.4, §5.1).
- [ ] **Requirements provider-neutral.** Every §6 requirement holds across
      agents, controllers, tenants, runtimes, model providers, clouds, and
      conforming storage hosts, and each cites an existing repository obligation.
      P-2 bans only provider-, deployment-, and host-*specific* product concepts;
      generic neutrality concepts remain permitted.
- [ ] **Authorized runtime behavior preserved.** No requirement prevents an
      authorized runtime from executing policy, emitting Straylight-defined
      receipts, appending Straylight-defined audit events, or persisting the
      chain; P-5 and P-13 constrain semantic redefinition, unauthorized
      re-minting, and self-authorized admission only.
- [ ] **Authority explicit, not fragmented.** P-10 requires express, non-implied
      grants while permitting host acceptance and implementation authorization to
      be co-recorded in one operator-signed Phase 49Q PR.
- [ ] **No design or authorization.** No interface, adapter, migration, schema,
      wiring, credential, consent, or signer behavior is designed, proposed, or
      authorized (§1, §6 standing note, §10).
- [ ] **Candidate bounded.** Railway PostgreSQL appears only as the current
      bounded MVP-2 deployment candidate, never as accepted, selected, deployed,
      or as the product boundary (§7).
- [ ] **Gates preserved.** Gate #8 OPEN / HELD; gates #9 / #10 held at
      `PARTIAL_RECORDED`; D.1(ii) unresolved; D.1 unsatisfied; D.2 not started;
      MVP-2 open; physical host UNSELECTED while `loa-straylight` remains the
      permanent semantic owner (§9).
- [ ] **Routing correct.** Provider acceptance and implementation authorization
      route to Phase 49Q; nothing is requested or prejudged there (§8).
- [ ] **No leak.** No credential, connection string, endpoint, hostname, port,
      account or project identifier, region, topology, environment value, command
      example, pricing figure, or deployment step appears.
- [ ] **No sibling mutation and no merge.** No sibling repository is modified;
      nothing is merged; the audit is a separate actor's turn.

---

## 13. Source references

Straylight (this repository, at the lane base SHA
`a50a91ab633d296dda4848c37d7dda60a18127d8`):

- [ADR-049](./decisions/ADR-049-six-mvp-product-roadmap-and-governance.md) —
  MVP-2 status and remaining work (`:106`–`:133`); Tier-1 classification
  (`:235`); sole decision authority (`:312`); evidence-versus-acceptance roles
  (`:342`); living-pilot admission posture (`:404`–`:410`); Railway direction
  pending intake (`:427`–`:439`); §9.1 required clauses (`:442`–`:460`); corridor
  compression to two PRs (`:467`); operational sequence steps 3 and 4 (`:478`,
  `:484`); preserved state (`:498`–`:506`).
- [ADR-050](./decisions/ADR-050-autonomous-execution-control-plane.md) — the
  authorized corridor and shadow-mode control plane under which this lane runs.
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) —
  `loa-straylight` as the permanent owner of canonical Straylight semantic
  ownership (row S1, `:155`); canonical-store physical host UNSELECTED with gate
  #8 held (row S2, `:156`); gate #9 Finn lane (`:253`); gate #10 Dixie lane
  (`:254`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) —
  the `M5` production-adapter-proposal shape as a separate later authority
  (`:352`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) —
  gate #8 (`:57`), gate #9 (`:58`), gate #10 (`:59`). Read read-only; not
  modified.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the host
  as persistence/exposure surface rather than semantic owner (`:105`–`:107`); the
  hardening invariants as the contract a host inherits (`:110`–`:120`); the
  `StorageAdapter` swap-in seam (`:79`); no re-minting of receipts
  (`:170`–`:174`).
- [Phase 48N intake completion gate](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) —
  gate #8 held (`:157`); gates #9 / #10 `PARTIAL_RECORDED` (`:159`, `:161`);
  D.1(ii) unresolved (`:163`); D.1 unsatisfied (`:165`); D.2 not started (`:167`);
  MVP-2 open (`:168`).
- [Phase 49I residual blockers gate](./ADR-022E-GATE-8-PREFERRED-CANDIDATE-RESIDUAL-BLOCKERS-GATE.md) —
  blockers B-1…B-11 (`:58`–`:68`).
- [Phase 49J Finn request packet](./ADR-022E-GATE-8-FINN-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md) —
  the eight requested Finn evidence topics (`:63`–`:84`).
- [Phase 49J Dixie request packet](./ADR-022E-GATE-8-DIXIE-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-REQUEST-PACKET.md) —
  the eight requested Dixie evidence topics (`:63`–`:84`).
- [Phase 49L dispatch decision rollup](./ADR-022E-GATE-8-FINN-DIXIE-EVIDENCE-DISPATCH-DECISION-ROLLUP-GATE.md) —
  the authorization under which both sibling PRs were opened: the operator
  decision and the Finn / Dixie dispatch authorization summaries (`:40`–`:67`),
  and the authorization results they roll up (`:29`–`:33`).
- `src/straylight/storage/types.ts` — recorded adapter semantics (`:4`–`:13`) and
  the unchanged interface (`:33`–`:68`).
- `src/straylight/storage/jsonl.ts` — single-writer, single-host MVP adapter;
  multi-process safety not guaranteed (`:15`–`:20`).
- `src/straylight/audit.ts` — per-estate chaining from the stored tail (`:31`) and
  `verifyChain` with its quarantine rationale (`:75`–`:88`).
- `tests/phase-5-hardening.test.ts` — fail-closed invariants (`:50`, `:93`,
  `:123`, `:159`) and tampered-chain detection (`:326`–`:327`).

Sibling evidence, read read-only at the binding SHAs in §2 and not modified:

- `0xHoneyJar/loa-finn` PR #258 at `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3` —
  `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md` (§3.1–§3.8,
  §4); `docs/ADR-022E-GATE-9-FINN-RUNTIME-BOUNDARY-EVIDENCE.md` (§2–§8);
  `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md` (§1–§4).
- `0xHoneyJar/loa-dixie` PR #255 at `d36c0846f03bfd097d35dd2c001de19eec817cf0` —
  `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md` (§1–§5);
  `docs/ADR-022E-GATE-10-DIXIE-BOUNDARY-EVIDENCE.md` (§1–§8);
  `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md` (§1–§4).

---

*End of Phase 49P. Docs-only sibling evidence intake and provider-neutral
canonical-estate persistence requirements record. It binds and intakes the merged
Finn gate #9 and Dixie gate #10 evidence responses as bounded sibling evidence,
records what each proves, cannot prove, and defers, closes the
sibling-evidence-supply blockers while leaving gates #9 and #10 held, confirms
that neither sibling becomes the Straylight semantic owner — `loa-straylight`
holds that permanently, while the canonical-store physical host stays UNSELECTED —
carries Finn's two locally-defined-classification findings forward unresolved,
records fourteen provider-neutral persistence requirements, keeps Railway
PostgreSQL a bounded MVP-2 deployment candidate rather than the Straylight product
boundary, and routes provider acceptance and implementation authorization to the
separate Phase 49Q lane. It accepts no provider, discharges no gate, resolves no
dependency, authorizes no implementation, and changes no estate semantics. Gate #8
remains OPEN / HELD; MVP-2 remains OPEN.*
