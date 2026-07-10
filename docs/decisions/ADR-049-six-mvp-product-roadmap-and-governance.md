# ADR-049 — Six-MVP product roadmap, risk-tiered gates, and Straylight decision authority

> **Status**: Accepted — operator decision, `operator:eileen`, 2026-07-10.
> **Provenance**: Direct operator directive issued 2026-07-10 after an audited
> reconstruction of the full cross-repo phase record (loa-straylight PRs #1–#114,
> loa-hounfour #70/#105/#116, loa-dixie #92→#255 lane, loa-finn #159/#171/#172/#194–#196/#258,
> loa-freeside #203, freeside-characters Phases 33–42). This ADR records operator
> decisions; it was drafted by Claude under the drafting role defined in §7.
> **Supersedes / narrows**: nothing in ADR-022E is discharged by this document.
> It gives the standing gates the canonical roadmap frame they previously cited
> only as Dixie-side Phase-47 evidence (ADR-048B §"six-MVP roadmap framing").

---

## 1. What this ADR does and does not do

This ADR:

1. declares the canonical six-MVP product roadmap (§3–§4);
2. distinguishes product MVPs from implementation phases (§2);
3. records the status of MVP-1 and MVP-2 (§3);
4. defines the scope and proof condition for MVPs 3–6 (§4);
5. establishes the risk-tiered gate model (§5);
6. records `operator:eileen` as the sole Straylight decision authority (§6);
7. records the evidence-versus-acceptance rule and participant roles (§7);
8. authorizes Satoshi as the first living pilot estate, separate from the
   `satoshi-demo` fixture (§8);
9. records Railway PostgreSQL as the selected MVP-2 canonical-store host
   **direction, pending completion of the evidence-intake sequence** (§9);
10. fixes the operational sequence that follows (§10).

This ADR does **not**:

- accept the Finn gate #9 or Dixie gate #10 evidence responses (that is the
  separate evidence-intake PR, §10 step 3);
- discharge ADR-022E gate #8, resolve D.1(ii), satisfy D.1, or start D.2
  (that is the separate Railway acceptance ADR, §10 step 4);
- close MVP-2;
- authorize a production adapter, production wiring, migrations, or rollout;
- create any new Straylight decision authority.

ADR-022E gate #8 remains **OPEN / HELD**. MVP-2 remains **OPEN**.

---

## 2. Product MVP versus implementation phase

A **product MVP** answers one product proof question about the estate and is
complete only when that question is answered durably, with receipts, at the
declared grade. An **implementation phase** (Phase 20A, 26B, 48X, 49L, …) is a
bounded unit of work or decision inside the corridor that serves an MVP.

Phases are numerous, disposable, and lettered. MVPs are six, stable, and named
here. No implementation phase may claim to complete an MVP; only an operator
decision may declare an MVP's proof condition met.

The `loa-straylight` README's standing note — it will not be updated "until the
6 mvps are done" — refers to the six product MVPs enumerated in §3–§4.

---

## 3. The six MVPs and their current status

| MVP | Layer | Product proof question | Status |
|---|---|---|---|
| MVP-1 | Recall Layer | What estate material is this actor allowed to remember and use for this task, environment, and risk profile? | **Proven end-to-end at controlled development/operator grade** |
| MVP-2 | Admissible Layer | What material is allowed to enter the estate, under whose authority, with what provenance, consent, status, and receipt? | **Open** — advanced; durable canonical admission remains open |
| MVP-3 | Correction, Forgetting and Revocation Layer | How can an estate correct or withdraw future use of its material without rewriting history? | Not started (primitive mechanics exist in the wedge) |
| MVP-4 | Challenge, Appeal and Adjudication Layer | How can an assertion or estate transition be disputed, reviewed, decided, and appealed without the dispute process rewriting evidence? | Not started (minimal challenge primitive exists in the wedge) |
| MVP-5 | Estate Inheritance and Controller Transfer Layer | How does continuity survive a change of controller, owner, runtime, version, environment, or actor boundary without transferring the wrong authority or leaking the hidden estate? | Not started |
| MVP-6 | Commitment and Public Anchor Layer | Can an external party verify an estate state, transition, revocation, or receipt without seeing the hidden estate? | Not started (local commitment roots exist as compatibility proof) |

### 3.1 MVP-1 — Recall Layer — status detail

Proven, within its deliberately bounded acceptance boundary:

- persistent actor estate; typed assertions;
- class validation separate from policy validation;
- signer competence; challenge, revocation, and forgetting effects;
- private/public environment frames;
- receipted inclusion and exclusion; hash-chained audit;
- controlled cross-repo consumption (local wedge 45 files / 1,075 tests;
  Dixie HTTP recall with pack + receipt; served Discord invocation through
  `/recall-wedge-live-demo`, Phase 42D, 2026-05-31).

Explicit caveats (all real, none discharged by MVP-1): no production
cryptography, no production admission, no production consent, no durable
canonical database, no public rollout, no living production estate. dNFT
transfer, public anchoring, and full cross-repo integration remain unproven.
`agent:satoshi-demo` is a fixture.

Primary capabilities: governed recall; environment frames; private/public
membrane; class/status/provenance filtering; signer and policy checks; recall
packs; exclusion reasons; receipts and audit reconstruction.

### 3.2 MVP-2 — Admissible Layer — status detail

Missing proof (verbatim standing definition): candidate material becomes an
admitted assertion with status, provenance, and a receipt, after which recall
can include it while pending, rejected, and malformed material remains
unavailable.

Route contracts, fixtures, spikes, guards, and storage evidence are advanced
(Dixie Phases 33A–47Z; Lane-1 `aw_*` non-production corridor closed at 47O).

**The physical canonical-store decision (ADR-022E gate #8) is the next
blocking decision. It is not the final remaining implementation task.** After
host acceptance, MVP-2 still requires:

- a provider-neutral storage adapter;
- durable implementation and migrations;
- backup/restore validation;
- live auth and identity binding;
- consent enforcement and consent receipts;
- production-grade signer handling;
- idempotency and concurrency behavior;
- end-to-end admission-to-recall acceptance;
- operational and rollback evidence.

Primary capabilities: candidate intake; assertion admission; classification;
provenance; links and dependencies; signer competence; auth and controller
binding; consent proof; durable canonical storage; admission receipts;
admission-to-recall continuity.

---

## 4. MVPs 3–6 — scope and proof conditions

### 4.1 MVP-3 — Correction, Forgetting and Revocation Layer

Not deletion UI wrapped around a database: the forward-authority lifecycle of
the estate. The Recall Wedge already proves the minimal status effects
(revoked and forgotten material stops being usable while remaining auditable);
MVP-3 turns those primitive mechanics into a complete durable product
workflow. Doctrine anchor: revocation withdraws future authority without
erasing the historical record.

Capabilities: correction; supersession; demotion; forgetting from ordinary
recall; revocation; sealed or audit-only retention; derivative invalidation;
non-use enforcement; re-evaluation of assertions derived from corrected or
revoked material; correction, forget, and revocation receipts.

### 4.2 MVP-4 — Challenge, Appeal and Adjudication Layer

MVP-3 provides the lifecycle **operations**; MVP-4 provides the contested
**procedure** that decides when those operations should occur. MVP-1 included
a minimal challenge primitive because recall safety could not be demonstrated
without contested state; it did not build a complete challenge-and-appeal
product. Doctrine anchor: challenge contests an assertion without deleting it
— the honesty mechanism of the estate.

Capabilities: challenge creation; target assertion becoming contested;
evidence submission; responses and counter-evidence; reviewer decision;
restore / demote / revoke / forget / keep-contested outcomes; appeal; final
disposition; reasoned decision receipts; challenge-aware recall throughout.

### 4.3 MVP-5 — Estate Inheritance and Controller Transfer Layer

The core primitive is **inheritance**, not NFT transfer specifically:
carrying identity, permission, memory, or commitment across actors, sessions,
versions, environments, or ownership structures. dNFT transfer is the first
major **integration profile** for this MVP because it creates a concrete
controller-transfer case — but Straylight must not define inheritance as
"whatever NFT ownership says." Token ownership must not automatically confer
competence for every estate transition. MVP-1 explicitly excluded full dNFT
transfer because those edge cases were too large for the first wedge.

Capabilities: estate inheritance; assertion inheritance; controller transfer;
key rotation; previous-controller revocation; transferable versus
non-transferable estate partitions; sealed private material; continuity
across runtime and version changes; transfer and inheritance receipts; fork
and replay prevention; post-transfer recall and permission changes.

### 4.4 MVP-6 — Commitment and Public Anchor Layer

The existing wedge computes local commitment roots — compatibility proof, not
the product. Doctrine anchor: hidden estate, public commitments — the estate
remains private and offchain while public infrastructure may anchor
identifiers, keys, roots, commitments, revocations, checkpoints, and proofs.

Capabilities: deterministic estate roots; transition and receipt commitments;
revocation checkpoints; schema and key-version commitments; selective
disclosure; public verification; anchor adapters; anchor receipts; recovery
and re-anchoring; chain-independent commitment semantics; optional onchain
publication.

### 4.5 Cross-cutting work not assigned an MVP number

Runtime action permissioning and feedback/evaluation remain legitimate
Straylight architecture surfaces (permission → action → commitment →
permanence transitions). They are **not** a replacement for any of MVPs 3–6.
They are introduced where required by the six estate proofs and may become a
later product track. Straylight governs the continuity and authority
supporting action; it is not the generic tool runtime or autonomous-agent
framework.

---

## 5. Risk-tiered gate model

**Principle: ceremony depth is determined by semantic authority,
reversibility, blast radius, and uncertainty — not merely by the fact that
more than one repo is involved.**

### Tier 0 — Evidence and mechanical verification

Examples: file/path verification; version confirmation; test results; package
availability; CI state; descriptive repo capability evidence; documentation
corrections that create no authority.

Process: one bounded evidence artifact or automated result; independent audit
where useful; **no separate authority-request corridor; no ADR unless an
actual decision is required.**

### Tier 1 — Reversible infrastructure and implementation choices

Examples: Railway versus another PostgreSQL host; development deployment
provider; provider-neutral storage adapter; logging or tracing backend;
non-semantic operational configuration.

Process: one operator ADR; evidence appendix; rollback and portability
clause; independent technical audit; implementation may proceed within the
ADR's exact bounds.

**The Railway canonical-store host decision belongs to Tier 1.**

### Tier 2 — Cross-repo contracts and durable production boundaries

Examples: package exports; stable API contracts; database migration
ownership; Dixie/Finn interfaces; authentication boundaries; audit event
contracts; schema publication or versioning.

Process: one operator ADR; bounded evidence from affected repos;
compatibility and conformance tests; migration or deprecation plan;
independent audit. Affected repo owners or maintainers may provide evidence
and technical objections; **they are not Straylight co-signers.**

### Tier 3 — Estate semantics and authority

Examples: assertion classes; status meaning; signer competence; keyring
rules; consent authority; identity mutation; challenge resolution;
revocation; forgetting semantics; inheritance and transfer; commitment and
permanence; public disclosure of estate-derived material.

Process: full evidence corridor; doctrine analysis; threat model; conformance
vectors; negative tests; migration and reversal analysis; explicit operator
decision; complete audit record. The full corridor remains appropriate here
because a bad semantic or authority decision can corrupt every estate using
it.

### One signer across all tiers

Tiering changes the amount of evidence and ceremony. It does not create new
Straylight authorities. "Full corridor" means fuller evidence, review, and
adversarial testing; it does not mean multiple humans acquire shared product
authority.

---

## 6. Straylight decision authority

The human Straylight authority keyring is:

```
operator:eileen
```

That is intentional and exclusive. Ownership or maintenance of other Loa
repositories does not confer Straylight product authority, semantic
authority, or acceptance authority. Repo ownership and Straylight authority
are different things.

The operator: defines the roadmap; interprets the doctrine; accepts or
rejects evidence; authorizes cross-repo Straylight changes; selects hosts and
adapters; decides whether a gate is discharged; authorizes living estates;
defines who is competent inside an estate keyring; signs final Straylight
decisions.

This composes with ADR-026A0 (operator-authority Flatline rule), which
already narrowed the old blanket teammate-review mechanism so the operator
may directly edit the Loa stack repos for the Straylight MVP, subject to
bounded changes, public-contract authorization, Flatline/Bridgebuilder
discipline, preserved repo responsibilities, and the substantive gates.

A future delegation is possible only if the operator explicitly creates it in
this repo, identifies the decision class, defines its boundaries, and makes
it revocable. **There is currently no standing delegation.**

---

## 7. Evidence versus acceptance — participant roles

Other participants have narrower roles, and none of them converts evidence
into acceptance:

- **Claude** drafts and implements bounded work.
- **Codex** independently audits.
- **Flatline and Bridgebuilder** provide adversarial review.
- **Repo maintainers** may provide technical evidence, warnings, or
  compatibility constraints.
- **CI and conformance tests** provide machine evidence.
- **GitHub PRs** preserve the accepted record.

Every cross-repo Straylight acceptance routes through the operator. That is
the authority model, not an accidental bottleneck. Throughput is improved by
risk-tiered gates (§5), larger coherent slices, fewer request-for-permission
documents, stronger reusable templates, automated evidence collection, and
direct operator ADRs for reversible decisions — **not** by inventing
additional Straylight authorities.

---

## 8. Satoshi — the first living pilot estate

Satoshi is authorized as the first living pilot estate. It must **not** be
the existing disposable fixture made permanent.

The current fixture remains, deterministic and resettable:

```
agent:satoshi-demo
estate:satoshi-demo
```

The living pilot receives a separate identity:

```
actor:agent:satoshi
estate:estate:satoshi
controller:operator:eileen
```

**"Living" means**: durable across sessions; used by actual agent behavior;
changed only through admitted transitions; subject to correction, revocation,
and audit; controlled by an explicit keyring; not silently reset; not
reconstructed from a prompt; not autonomous by definition. It does **not**
mean Satoshi independently acquires authority to mutate its own identity,
permissions, or commitments.

**Genesis rules.** The living estate begins with a signed genesis event
establishing: actor identifier; estate identifier; controller; initial
keyring; initial policy; initial allowed assertion classes; privacy defaults;
admission scope; initial state root; genesis receipt. The demo estate is not
copied wholesale: any useful material from the demo enters as new candidate
assertions with provenance and operator admission.

**Initial admission and consent posture:**

- `operator:eileen` is the sole actor controller and operator.
- Only operator-authorized admission is active initially.
- Runtime or model output may propose candidate observations but may not
  activate them by itself.
- User chat does not automatically become memory.
- A third party speaking about Satoshi may create an attributed observation
  candidate; it does not automatically authorize an identity, relationship,
  trust, or permission assertion.
- Identity-affecting, relationship-affecting, and permission-affecting
  assertions require explicit operator acceptance.
- Private information about another person must not enter ordinary recall
  merely because it appeared in a conversation.
- Every admission, rejection, correction, revocation, and recall produces a
  receipt.
- Public-channel recall remains more restrictive than operator/private
  recall.

The pilot is valuable precisely because it forces the Admission Wedge to
solve a real controller, genesis, provenance, and consent problem without
first accepting uncontrolled public memory admission.

---

## 9. Railway PostgreSQL — selected direction, pending intake

Railway PostgreSQL is selected as the MVP-2 canonical-store physical host
**direction**, pending completion of the evidence-intake sequence (§10). The
Phase 49I ranking placed it first and classified it as the sole preferred
candidate for a recommendation request.

The host choice is semantically **non-authoritative but not inert**. The
Straylight invariants live above the storage adapter (actor estate; assertion
class and status; provenance; signatures; policy; competent signers;
transition behavior; challenge and revocation; recall; receipts) and changing
PostgreSQL hosts must not redefine any of them. Infrastructure still affects
operational correctness: durability; restore capability; isolation;
credential handling; availability; migration safety; audit retention;
incident recovery. The decision is reversible, but not meaningless — it is a
**Tier 1** decision under §5.

### 9.1 Required clauses for the future acceptance ADR

The Railway acceptance ADR (§10 step 4) MUST require:

1. No Railway-specific concepts in the estate domain model.
2. No Railway-specific semantics in canonical migrations.
3. Ordinary PostgreSQL export and restore.
4. A documented database backup/restore test before production admission.
5. Configuration through the adapter/deployment boundary rather than domain
   code.
6. Ability to move to another conforming PostgreSQL host without changing
   assertion or receipt semantics.
7. A rollback procedure for failed migrations or failed admission deployment.
8. Reopening the infrastructure decision if durability, isolation, restore,
   or operational evidence fails.
9. No claim that accepting the host automatically accepts production wiring.
10. Separate validation of auth, consent, and signer behavior after durable
    storage exists.

### 9.2 Corridor compression

Phase 49I deliberately separated candidate acceptance, adapter authority,
implementation authority, and production wiring. That separation was useful
while evidence was incomplete; it does not require a separate long corridor
for each reversible step once the operator has the complete record. The
remaining process is compressed to **two Straylight PRs** after the two
sibling evidence PRs — evidence intake (PR A), then acceptance/authorization
(PR B) — preserving the evidence-versus-acceptance distinction without
another dozen request/authority/request-response gates.

---

## 10. Operational sequence

1. Audit and merge `loa-finn` PR #258 (gate #9 evidence response) if clean.
2. Audit and merge `loa-dixie` PR #255 (gate #10 evidence response) if clean.
3. **PR A — sibling evidence intake** (`loa-straylight`): cites both merged
   evidence responses; accepts them as evidence; records what each repo
   proves and cannot prove; resolves the former sibling-evidence blockers;
   confirms that neither sibling repo becomes the Straylight semantic owner;
   records remaining provider-level and implementation-level risks; routes
   directly to operator host acceptance.
4. **PR B — Railway acceptance and implementation-authorization ADR**
   (`loa-straylight`, Tier 1, operator-signed): selects Railway PostgreSQL as
   the MVP-2 canonical-store host; discharges ADR-022E gate #8 for this
   bounded purpose; authorizes a provider-neutral PostgreSQL
   `StorageAdapter`; opens the durable implementation and migration lane;
   preserves Straylight as semantic owner, Dixie as the current
   admission/BFF boundary, and Finn's runtime-enforcement role; does not make
   Railway a permanent architectural dependency; does not authorize unrelated
   production rollout; carries the §9.1 clauses.
5. Durable Admission Wedge implementation planning (the §3.2 remaining-work
   list becomes the plan's backbone).

---

## 11. Preserved state

Until PR B merges under operator signature: ADR-022E gate #8 remains
**OPEN / HELD**; D.1(ii) remains unresolved; full D.1 remains **NOT YET
SATISFIED**; D.2 remains **NOT STARTED**; gates #9 and #10 remain held at
`PARTIAL_RECORDED` pending intake; **MVP-2 remains OPEN**. No production
database execution, production writes, production migration execution,
production durable storage, or production auth/consent/signer implementation
is authorized by this ADR.
