# Admission Wedge — Straylight Primitive-Review Response (to Dixie Phase 33T / PR #138)

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate owner.
> **Responds to**: Dixie Phase 33T — Admission Wedge Straylight primitive-review
> follow-up / consolidated cross-repo review handoff
> (`loa-dixie:docs/ADMISSION-WEDGE-STRAYLIGHT-PRIMITIVE-REVIEW-FOLLOWUP.md`, PR #138,
> merged), which re-issued the Phase 33J §5 fifteen-item register (A–O) grounded in the
> concrete Phase 33N route spike and Phase 33Q bounded synthetic ledger.
> **Status**: **docs / decision-only.** No source, test, runtime, route, route handler,
> storage, store code, DB write, migration, auth, consent, validator, schema, fixture/vector
> JSON, config, env, package, lockfile, CI, generated, or live-integration change. This is a
> **Straylight-side answer to a vocabulary review**, not an authorization of any
> implementation lane.
> **This response does not authorize production admission, durable Admission Wedge storage,
> a Dixie endpoint, Freeside runtime/client integration, or a final route contract.**
> Resolving this primitive review **alone does not make production admission ready**, and
> this response **does not claim Straylight owns the endpoint idempotency semantics**.

---

## 1. Status and scope

- **Straylight-side docs/decision-only response.** This document answers the Dixie Phase
  33T A–O review request from the side that owns the assertion-lifecycle / recall /
  signer / receipt-audit / storage-adapter vocabulary. It is the artifact a future Dixie
  Phase 33U review-response intake gate would consume (§9).
- **No executable change.** No file under `src/`, `tests/`, `scripts/`, `fixtures/`,
  `dist/`, or `dist-types/`; no `package.json` / `exports` / runtime allowlist edit; no
  schema, config, env, CI, or generated file. The only change in this branch is this new
  Markdown document under `docs/`.
- **No production authorization.** Confirming canonical vocabulary clarifies the *design*;
  it does **not** clear the independent production gates. ADR-022E gate #8 (production
  persistence), gate #10 (broad Dixie boundary wiring), and gate #12 (new network surface)
  remain **held** (§7).
- **No Dixie endpoint authorization.** Straylight does not own and does not authorize the
  Dixie HTTP/BFF route, the route handler, the route contract, or its deployment. No
  Straylight ADR here authorizes an *admission* endpoint. (ADR-026C / ADR-026D authorize a
  single *recall*-intake endpoint only — a different seam; see §6, §7.)
- **No Freeside runtime/client authorization.** Nothing here hands a client contract to
  freeside-characters or authorizes any runtime/client wiring.

This document **does not** mutate any Dixie artifact, read or write any Dixie file beyond
the read-only inspection used to ground the citations, or claim the Straylight primitive
review is "complete" in any sense that unblocks production. It answers the vocabulary
questions Straylight owns, delegates the questions it does not own, and explicitly records
what remains unresolved.

---

## 2. What Straylight can and cannot answer

Straylight **owns and can answer**:

- the primitive / substrate vocabulary: `AssertionStatus`, `AssertionClass`,
  `admit_assertion` / `link_assertions` transitions, the `(superseded, active)` supersession
  relation, `RecallUseInstruction` + the emergent `dispositionFor` recall disposition,
  `SignerType` / `SignerCompetenceRule` / `Keyring`, `TransitionReceipt` / `RecallReceipt` /
  `AuditEvent`, `CandidateAssertion`, and the `privacy_scope` + environment-frame projection
  rule;
- the relationship between the Dixie synthetic shapes and those primitives (accept / reject /
  rename / re-relate);
- the substrate-vs-ingress storage/audit boundary and the held durable-store gate (ADR-022E).

Straylight **does not own and cannot authorize** (it can only confirm compatibility /
delegation boundary):

- the Dixie endpoint route contract, wire behaviour, HTTP status mapping, or **endpoint
  idempotency semantics** (Dixie / endpoint-route-contract-owned — §5 row J, §6);
- the freeside-characters client / Discord integration (Freeside-owned — §6);
- any production lane: durable storage, DB writes, migrations, auth/consent, public
  remember-this, Discord ingestion, chat-to-memory, package exports, route deployment (§7).

> **No repo can authorize another repo's final contract or runtime lane.** This response
> binds only Straylight-owned vocabulary. It is evidence a future Dixie phase may cite; it
> is not permission for any Dixie or Freeside implementation.

---

## 3. Straylight grounding sources (current HEAD)

The Dixie Phase 33T register carried its Straylight citations forward "against a
possibly-stale local checkout" and flagged them as evidence to confirm. This section
**confirms** them against the current `loa-straylight` working tree. The canonical
type file is `src/straylight/types.ts`; the lifecycle prose is
`docs/architecture/loa-straylight-product-system-architecture-spec.md` (arch spec).

| Primitive | Current Straylight source | Confirmed |
|-----------|---------------------------|-----------|
| `AssertionStatus` (`proposed`/`active`/`contested`/`demoted`/`revoked`/`forgotten_from_recall`/`superseded`/`sealed`) | `src/straylight/types.ts:86-94` | ✅ as cited |
| `CandidateAssertion` (pre-admission object) | `src/straylight/types.ts:551-565` | ✅ as cited |
| `admit_assertion` transition; `EstateStore.admit()` sets status `active` | `src/straylight/types.ts:278`; `src/straylight/estate.ts:140-265` (status `active` at `:203`) | ✅ as cited |
| `link_assertions` transition | `src/straylight/types.ts:280` | ✅ |
| Supersession relation: `superseded` status, `supersedes_refs`, `AssertionLinkType: 'supersedes'` | `src/straylight/types.ts:93,157`; arch spec `:910-921` (`supersedes` at `:914`) | ✅ as cited |
| `RecallUseInstruction` (`usable`/`mark_as_contested`/`use_as_background_only`/`do_not_use_for_action`); recall eligibility = emergent `dispositionFor`, **not** a stored flag | `src/straylight/types.ts:427-431`; `src/straylight/policy.ts:187-241` | ✅ as cited |
| `SignerType` (incl. `policy_service`) + `SignerCompetenceRule` / `Keyring` | `src/straylight/types.ts:122-130` (`policy_service` at `:127`), `:185-209` | ✅ as cited |
| `estate_id` / `actor_id` are wedge primitives; `tenant_id` is **host-layer, NOT a wedge primitive**; no `subject_actor_id` (only `Assertion.subject_refs`) | `src/straylight/types.ts:145-167` (`subject_refs` at `:155`); `src/straylight/host/tenancy.ts:1-25` | ✅ as cited |
| Receipts/audit: `TransitionReceipt` (kinds incl. `admission`/`denied`), `RecallReceipt`, `AuditEvent` | `src/straylight/types.ts:364-388,469-489,495-529` | ✅ as cited |
| `AuditEventType` members — `assertion_admitted` and `transition_denied` **present**; **`assertion_superseded` absent** | `src/straylight/types.ts:495-512` (and arch spec `:1551-1568`) | ✅ **confirmed: no `assertion_superseded`** |
| Durable estate store gated by **ADR-022E** (held); recall-intake route guardrails by **ADR-026C / ADR-026D** | `docs/decisions/ADR-022E-phase-22-deferred-features.md:57` (gate #8); `docs/decisions/ADR-026C-…md`, `docs/decisions/ADR-026D-…md` | ✅ IDs real; gates held |

> **Grounding correction to the Dixie caveat.** The Dixie register noted the Straylight
> checkout "may be stale" (its HEAD ~Phase 31F, latest ADR ADR-030). For the primitives the
> A–O register depends on, the current `loa-straylight` HEAD **matches** the carried-forward
> citations; no Admission-Wedge-specific Straylight primitive has shipped since, and **no
> pre-existing Straylight artifact (before this response)** names an "admission wedge",
> "assertion intake", or admission route/endpoint. This response is the first Straylight
> document to name the Admission Wedge, and it coins **no** new canonical primitive in doing
> so. The general assertion lifecycle (built for the Recall Wedge) is the substrate the
> Admission Wedge must reuse without coining new canonical terms.

---

## 4. Disposition vocabulary

Each A–O row below carries a **disposition** drawn from the four-member set Dixie's review
register uses. A row with more than one sub-area carries **one disposition per sub-area**
(e.g. a Straylight-owned vocabulary half marked *accepted* alongside a host-owned projection
half marked *delegated*) — there is no composite or invented status value.

- **accepted** — the Dixie draft term/shape conforms to a canonical Straylight primitive;
  keep it (subject to the noted non-final caveats).
- **rejected** — the term must change or be re-related to an existing primitive; the
  canonical term/relation is stated (also written *rejected / re-related*).
- **delegated** — the concern is host/endpoint-owned; Straylight confirms only the
  delegation / primitive-compatibility boundary (also written *delegated-to-Dixie*).
- **unresolved** — explicitly out of scope, held behind a gate, or pending a separate
  decision, with a reason.

An *accepted* disposition is **vocabulary alignment only**. It is **never** a
production-readiness claim and does not by itself clear ADR-022E, auth/consent, or the
route contract.

---

## 5. Row-by-row response (A–O)

| Row | Dixie question / term | Straylight response | Ownership | Status | Downstream implication for Dixie |
|-----|-----------------------|---------------------|-----------|--------|----------------------------------|
| **A** | Candidate / `proposed` pre-admission vocabulary — is `proposed` the canonical pre-admission **status** and `CandidateAssertion` the pre-admission **object** (no bare `candidate` status)? | **Confirmed.** `CandidateAssertion` is the pre-admission object (`types.ts:551-565`); `proposed` is a canonical `AssertionStatus` member (`types.ts:87`); there is **no bare `candidate` status**. The ledger's `pending ⇒ accepted_as_proposed` (no transition, nothing minted) faithfully mirrors the pre-admission shape. | Straylight | **accepted** (alignment, not production-final) | Keep `CandidateAssertion` (object) + `proposed` (status). `candidate` may remain a Dixie ingress *object* label, never a status value. |
| **B** | Admitted lifecycle — is the admitted status canonically `active`, with no bare `admitted` status? | **Confirmed.** `admit()` sets status `active` (`estate.ts:203`); the lifecycle treats `admitted/active` as one node (arch spec `:874`). `admitted` is a **public outcome label only**, not a status. | Straylight | **accepted** | Mint `active`; expose `admitted` only as a public `outcome_class`. Do not coin an `admitted` status. |
| **C** | Transition vocab — `admit_assertion` / `assertion_admitted` / `transition_denied` canonical? And the synthetic `assertion_superseded` audit-event term. | `admit_assertion` (transition, `types.ts:278`), `assertion_admitted` (audit event, `types.ts:501`), and `transition_denied` (audit event, `types.ts:500`) **confirmed canonical.** **`assertion_superseded` is REJECTED as an audit-event type and RE-RELATED** — it is **absent** from `AuditEventType` (`types.ts:495-512`; arch spec `:1551-1568`). See §5.1. | Straylight | **accepted** (`admit_assertion` / `assertion_admitted` / `transition_denied`) + **rejected** (`assertion_superseded`) | Dixie must not treat `assertion_superseded` as a canonical Straylight audit event. Re-relate it to the response's normative vocabulary: `assertion_linked` (`types.ts:503`) + a `link_assertions` transition (`types.ts:280`) + the `superseded` status move. Straylight does **not** yet implement a link/supersession executor (§5.1). |
| **D** | Supersession relation — is `(superseded, active)` a relation/direction (not a coined status)? | **Confirmed.** Supersession = `superseded` status (`types.ts:93`) + the canonical forward field `supersedes_refs` (`types.ts:157`) + `AssertionLinkType: 'supersedes'` (arch spec `:914`). It is a **relation/direction**, not a coined status. | Straylight | **accepted** | Model the relation on the **canonical forward field `supersedes_refs`** (`types.ts:157`). The inverse `superseded_by_assertion_id` is a **Dixie-local** convenience projection — there is **no `superseded_by` field** in Straylight (§5.1). Do not coin `corrected_active` (see N). |
| **E** | Recall eligibility — is the Dixie `recall_eligible` **boolean** an acceptable public-safe **projection** of emergent recall eligibility? | **The canonical primitive is `RecallDisposition`** — the four-member union `include` / `mark` / `redact` / `exclude` returned by `dispositionFor(assertion, request)` (`policy.ts:181-241`), computed **per request** from status, request filters, `privacy_scope`, and risk profile. A `RecallUseInstruction` (`types.ts:427-431`) is attached **only to included (`usable`) and marked items** (`recall.ts:91,93-101`); **redacted and excluded items receive no `RecallUseInstruction`** (`recall.ts:102-107`). Eligibility is therefore **emergent and request-dependent**, not a stored flag — and not a fixed status→boolean function. The Dixie `recall_eligible` boolean is acceptable **only as a constrained, lossy Dixie projection** of `dispositionFor` for one request frame (`include`/`mark`→`true`-ish vs `redact`/`exclude`→`false`), never a coined stored primitive or a canonical status mapping. There is **no universal `active ⇒ recallable` rule**: an `active` assertion is included only absent request filters, privacy frame, or risk-profile exclusion (`policy.ts:191-218`); a `superseded` assertion is *marked* (background) when `include_statuses` opts in, otherwise excluded (`policy.ts:234-239`). The ledger's `active ⇒ true` / `superseded ⇒ false` mapping is a **specific Dixie projection under default request conditions**, not the canonical disposition. | Straylight (`RecallDisposition` semantics) + Dixie (boolean projection) | Straylight half **accepted**; boolean projection **delegated** | Treat `recall_eligible` as a derived per-request Dixie projection of `RecallDisposition`, recomputed at recall time — never persisted as authority and never stated as a status→boolean rule. The boolean collapses the mark/redact band; that loss must stay a public-surface concern only. |
| **F** | Signer / authority — is `policy_service` a canonical `SignerType`, and which signer roles may authorize `admit_assertion`? | **Confirmed (vocab).** `policy_service` is a canonical `SignerType` member (`types.ts:127`). Which roles may authorize `admit_assertion` is **not a fixed list** — it is decided by `SignerCompetenceRule` / `Keyring` (`types.ts:185-209`) and policy; the arch spec illustrates `operator` may admit and `runtime` may admit observations/action-traces but not identity (arch spec `:1113-1114,:1160-1163`). | Straylight (vocabulary) + Dixie (`authority_*_draft` field names) | vocab **accepted**; production authority semantics **unresolved** | `policy_service` is safe to mirror. The `authority_*_draft` field names stay Dixie draft. **Production signer/authority semantics remain an independent unresolved gate** — vocab confirmation does not authorize an auth model. |
| **G** | Tenant / estate / actor identity-binding vocabulary. | `estate_id` and `actor_id` are wedge primitives (`types.ts:147-148`). **`tenant_id` is host-layer, NOT a wedge primitive** — the wedge explicitly does not model it on Actor/Estate (`host/tenancy.ts:1-25`), and cross-tenant ambiguity fails closed (`host/tenancy.ts:41-56`). There is **no `subject_actor_id` primitive** — only `Assertion.subject_refs` (`types.ts:155`). | Straylight (`estate_id`/`actor_id`) + Dixie host (`tenant_id` / caller-envelope) | Straylight ids **accepted**; `tenant_id` binding **delegated**; production binding **unresolved** | The ledger's `(tenant_id, estate_id)` scope is a **spike isolation mechanism**, not final wedge semantics: `estate_id` mirrors the primitive; `tenant_id` is Dixie host-layer. Caller identity is a Dixie caller-envelope concern; "subject" maps to `subject_refs`, not a dedicated id. Production identity binding stays Dixie-host + undefined. |
| **H** | Receipt / audit vocabulary and public/private boundary; two-spelling debt (`public_receipt_ref` vs `receipt_public_ref`) and `audit_receipt`. | The synthetic `SyntheticAuditRecord` corresponds to **two distinct** Straylight primitives, not one: the audit half → `AuditEvent` (`types.ts:495-529`); the receipt half → `TransitionReceipt` (`types.ts:364-388`). Receipts are first-class artifacts **distinct** from the chained audit log (`types.ts:358-362`). Straylight has **no public receipt-field primitive** today; the nearest public anchor is the deferred `public_anchor_ref` (`types.ts:546`, gated by ADR-020E / ADR-022E gate #7). The public/private split is **confirmed**: `AuditEvent`, transition ids, and private `receipt_id` / `receipt_ref` stay private; only a public-safe synthetic reference may surface. | Straylight (receipt/audit primitives) + Dixie (public projection field name) | Straylight half **accepted**; public field name **delegated** | Map the audit half to `AuditEvent` and the receipt half to `TransitionReceipt` (do not conflate). Pick **one** public field name — recommend `public_receipt_ref` (consistent with Straylight's `*_ref` convention and `public_anchor_ref`); retire `receipt_public_ref`. `audit_receipt` is not a Straylight term; keep private audit detail unexposed. |
| **I** | Fail-closed semantics vs Dixie ingress refusal behaviour. | **Confirmed.** Canonical fail-closed: class-validation failure ⇒ `rejected_candidate` (not estate state) (arch spec `:866`); policy denial ⇒ `denied_transition` receipt + `transition_denied` audit event (arch spec `:871`; `estate.ts:154-193`). The Dixie ingress behaviour — a malformed/unsafe/unsupported shape collapsing to a single stable, public-safe `ingress.invalid_request` refusal that never reveals the hidden reason — is a **faithful ingress projection** of that canonical meaning. | Straylight (primitive) + Dixie (ingress code) | **accepted** (alignment, not production-final) | Keep `ingress.invalid_request` as a Dixie-local ingress refusal-family draft. The substrate distinction (`rejected_candidate` ≠ `denied_transition`) must survive into any future non-ingress mapping. |
| **J** | Idempotency delegation boundary. | **Delegated-to-Dixie.** There is **no `idempotency_key` primitive** anywhere in Straylight; idempotency is delegated to the host/Dixie (recall-wedge precedent ADR-026D §3.b, `ADR-026D:280-301`). **Endpoint idempotency is Dixie / endpoint-route-contract-owned.** Straylight's distinct, narrower primitive-level concept is **content-addressed id derivation**: `transition_id` and `assertion_id` are derived via `contentId(...)` over the full input **including `now`** (`estate.ts:149-152,197`), so they are deterministic **only for identical complete inputs (the same candidate *and* the same `now`)**. This is **not** endpoint request idempotency, **not** substrate de-duplication (transitions are append-only — `appendTransition` is an unconditional `push`, with no replay guard), and not proof of replay compatibility. See §5.2. | **Dixie / endpoint route contract** (owns semantics); Straylight (confirms delegation / compatibility only) | **delegated** | Dixie owns the final endpoint keying (candidate-id vs header vs both) and all endpoint replay/idempotency; it remains undecided (`idempotency_final: false`). Do not record Straylight as the idempotency owner. Content-addressed id derivation is a *distinct, complementary* substrate property — not a substitute for, and not evidence of, endpoint idempotency. |
| **K** | Public / private projection rule for admission outcomes. | The canonical projection rule is `privacy_scope` (`public`/`tenant`/`actor_private`/`sealed`, `types.ts:96`) combined with environment-frame disposition (`privacyDispositionForFrame`, `policy.ts:243+`, invoked from `dispositionFor`). Never-public categories: raw candidate body/provenance source material, signature/authority material, operational ids (`transition_id`, `audit_event_id`, private `receipt_id`), `tenant_id`/`estate_id`/`actor_id`, idempotency keys, and private audit detail. The minimal public surface (outcome class, public-safe scenario id, recall-eligibility projection, public-safe receipt reference, draft markers) is acceptable. | Straylight (canonical rule) + Dixie (runtime serializer) | Straylight rule **accepted**; serializer **delegated** | Design the Dixie no-leak serializer against `privacy_scope` + frame disposition, not against a mirrored denylist alone. The denylist is a Dixie defense-in-depth implementation detail, not the canonical rule. |
| **L** | Candidate → assertion linkage semantics. | **Confirmed.** Linkage chain: `CandidateAssertion` → `admit_assertion` transition → `Assertion` (`estate.ts:140-265`). The `EstateTransition.target_refs` carries the minted `assertion_id` (`estate.ts:236`; `types.ts:291`); receipts carry `transition_id` + `target_refs` (`types.ts:374,378`). | Straylight (semantics) + Dixie (ref field names) | **accepted** | Keep the candidate→transition→assertion linkage. Ref field names (`source_candidate_id` / `admission_transition_id` / `admitted_assertion_id`) stay Dixie draft, mapped onto the canonical chain. |
| **M** | Denial taxonomy — explicit denied transition vs coined `rejected` status. | **Confirmed.** Denial is an **explicit denied transition**: `transition_denied` audit event + kind `denied` `TransitionReceipt` (`estate.ts:154-193`; `TransitionReceiptKind` incl. `denied` at `types.ts:364-369`). There is **no coined `rejected` status**. Note: `rejected_candidate` (class-validation failure, *not estate state*, arch spec `:866`) is distinct from policy `denied_transition`. | Straylight (semantics) + Dixie (refusal code) | **accepted** | Bind denial to an explicit `transition_denied` + `denied` receipt. The `*_draft_non_final` reason code stays Dixie draft. Keep `rejected_candidate` and `denied_transition` distinct. |
| **N** | Corrected-active status vs relationship. | **Confirmed.** "Corrected active" is the **`active` member of a `(superseded, active)` relation** — there is no `corrected_active` member in `AssertionStatus` (`types.ts:86-94`). The corrected assertion is `active`; the prior moves to `superseded` via `supersedes_refs` (`types.ts:93,157`) + link type `supersedes` (arch spec `:914`). | Straylight | **accepted** | Never coin `corrected_active` as a status. Model it as the `active` side of the supersession relation (paired with C re-relation and D). |
| **O** | Storage / audit primitive boundary and ADR-022E relationship. | Straylight-substrate semantics: `Assertion`, `EstateTransition`, `TransitionReceipt`, `AuditEvent`, and the supersession relation. Dixie ingress/storage concerns: candidate intake record, idempotency cache, refusal log, the HTTP wire envelope. Mapping: the synthetic `SyntheticAdmittedAssertion` ↔ substrate `Assertion` semantics; `SyntheticAuditRecord` ↔ `AuditEvent` (+ `TransitionReceipt`); replay/de-dup metadata ↔ Dixie ingress (idempotency cache). **Any *durable* admission store is governed by ADR-022E gate #8 (held, `ADR-022E:57`) and is NOT authorized by this review.** See §5.3. | Straylight (substrate semantics + ADR-022E) + Dixie (ingress storage) | substrate semantics **accepted**; durable store **unresolved** (ADR-022E held) | Dixie may reference substrate semantics in a future storage design without baking draft vocabulary as final. Durable storage requires a separate ADR satisfying the ADR-022E gate #8 trigger; the synthetic ledger proof does not satisfy it. |

> **None of §5 is a production-readiness claim.** Each *accepted* disposition aligns
> vocabulary only. The production lanes (durable storage, auth/consent, route contract,
> Freeside integration) remain independently gated regardless of this response (§7).

---

### 5.1 `assertion_superseded` — explicit handling (Dixie row C)

The Dixie synthetic ledger emits an `assertion_superseded` audit-event label on
supersession (`loa-dixie:.../admitted-assertion-ledger.ts:890`). **Straylight does not
silently accept this as canonical**, because current Straylight source does not support it:

- `AuditEventType` (`src/straylight/types.ts:495-512`) enumerates `transition_denied`,
  `assertion_admitted`, `assertion_classified`, `assertion_linked`, `assertion_challenged`,
  `assertion_demoted`, `assertion_revoked`, `assertion_forgotten_from_recall`,
  `recall_requested`, `recall_pack_emitted`, `commitment_created`, `feedback_recorded`,
  `evaluation_recorded`. The arch-spec `AuditEvent.event_type` list
  (`docs/architecture/loa-straylight-product-system-architecture-spec.md:1551-1568`) matches.
  **Neither contains `assertion_superseded`.**

**Decision: REJECT as an audit-event type; RE-RELATE to existing vocabulary.** This response's
**normative re-relation** models a supersession as:

1. a **`link_assertions` transition** (`types.ts:280`) carrying `AssertionLinkType:
   'supersedes'` (arch spec `:914`), corresponding to the canonical **`assertion_linked`**
   audit-event member (`types.ts:503`); plus
2. a **status transition** moving the prior assertion to `superseded` (`types.ts:93`) and
   recording the relation via the canonical forward field **`supersedes_refs`**
   (`types.ts:157`), with the corrected assertion remaining `active` (row N).

> **This is the response's normative vocabulary re-relation, not a description of existing
> runtime behavior.** Current Straylight implements **no link / supersession executor**: the
> only transition executors in `src/straylight/estate.ts` are `admit()` and the
> fixture-only `seedAssertion()`. `link_assertions`, `assertion_linked`, and the
> `supersedes` link type are **defined vocabulary members** (`types.ts:280,503`, arch spec
> `:914`) with **no runtime emitter today** — no existing code path emits `assertion_linked`.
> The canonical relational field is **`supersedes_refs`** (`types.ts:157`, forward direction);
> there is **no `superseded_by` field** in any Straylight primitive (any
> `superseded_by_assertion_id` is a Dixie-local inverse projection — row D).

So the canonical audit-and-relation footprint that a *future* supersession executor would
produce is `assertion_linked` (+ the `superseded` status move), **not** a standalone
`assertion_superseded` event. Dixie's `assertion_superseded` is a **Dixie synthetic-ledger
label that must be re-related to the `assertion_linked` + `superseded`-status vocabulary
above**, not mirrored into Straylight's `AuditEventType`.

> **Open sub-question (deferred, not blocking).** Whether Straylight should later *coin* a
> dedicated `assertion_superseded` audit-event type for ergonomics is a **separate Straylight
> ADR decision**, governed by the same `AuditEvent`-adoption discipline as ADR-022E gate #5
> (`ADR-022E:54`). This response does **not** coin it and does **not** pre-authorize it; the
> re-relation above is sufficient and is the canonical answer for now.

---

### 5.2 Idempotency — explicit handling (Dixie row J)

- **Straylight does not claim ownership of endpoint idempotency.** There is no
  `idempotency_key` field on any Straylight primitive (`src/straylight/types.ts` —
  `RecallRequest`, `EstateTransition`, `Assertion`, `CandidateAssertion` all lack it).
- **Endpoint idempotency remains Dixie-owned.** The established cross-repo precedent is
  ADR-026D §3.b (`docs/decisions/ADR-026D-…md:280-301`), which delegates replay/idempotency
  for the *recall*-intake endpoint to the host/Dixie (idempotent replay returns the prior
  receipt; the audit chain reflects one transition per request identity). The same
  delegation posture applies to a future admission endpoint: the **endpoint keying and
  replay semantics are Dixie / endpoint-route-contract-owned.**
- **Straylight's distinct primitive-level concept** is **content-addressed id derivation**,
  not endpoint request idempotency. `transition_id` and `assertion_id` are derived via
  `contentId(...)` (`src/straylight/estate.ts:149-152,197`), but the hashed payload
  **includes `now`** (`{ kind, candidate, now }` for the transition id; `{ body_hash,
  candidate, now }` for the assertion id). The ids are therefore deterministic **only for
  identical *complete* inputs — the same candidate *and* the same `now`**; the same candidate
  admitted at a different `now` yields different ids.
- **No substrate de-duplication and no replay guard.** Admission does **not** dedupe: the
  storage adapters append unconditionally (`appendTransition` is a plain `push`, e.g.
  `src/straylight/storage/in-memory.ts:65-66`; `upsertAssertion` is a keyed set), and the
  `admit()` executor performs no prior-id lookup before minting. Transitions and audit events
  are append-only with no replay-detection step. Content-addressed id derivation is therefore
  **not** proof of replay compatibility and must **not** be cited as substrate-level
  de-duplication: it does not protect against duplicate HTTP requests, transport retries, or
  endpoint replay — that is the host's job.
- **Compatibility boundary only.** The ledger's spike-scoped behaviour — identical replay
  mints nothing; a conflicting replay (same key, different content) fails closed without
  overwrite — is enforced by the **Dixie ledger spike**, not by the Straylight substrate, and
  is **compatible** with content-addressed id derivation and the ADR-026D delegation pattern.
  Straylight confirms the **delegation / primitive-compatibility boundary only**; it does not
  finalize the endpoint keying, which remains undecided (`idempotency_final: false`). Endpoint
  idempotency stays Dixie-owned.

---

### 5.3 ADR-022E / durable storage — explicit handling (Dixie rows O, K)

- **This response does not authorize durable Admission Wedge storage.**
- **ADR-022E gate #8 (production database / persistence substrate) remains HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`). `InMemoryStorage` and
  `JsonlStorage` are the only MVP adapters; a production adapter requires a **separate ADR**
  that satisfies the gate #8 trigger and preserves the ADR-022D receipt and audit-chain
  invariants. ADR-026D §7.i reaffirms gate #8 is held and that the only storage-posture
  change it authorized was a recall-endpoint per-tenant memory cap — explicitly **not** a
  production persistence adapter (`ADR-026D:466-473`).
- **Related held gates:** ADR-022E gate #10 (Dixie boundary wiring) is unblocked **only**
  for the single recall-intake endpoint slice (ADR-026D §"Consequences", `ADR-026D:565-566`)
  — **not** for an admission endpoint; gate #12 (new HTTP/network surface) remains held
  (`ADR-022E:61`), with the threat model required to be updated *before* any such wiring
  lands (gate #20, `ADR-022E:69`).
- **The Dixie synthetic ledger proof does NOT satisfy durable storage readiness.** The
  Phase 33Q ledger is process-local, Map-backed, non-durable, capacity-bounded,
  fail-closed, and test-seam-only (not wired into `server.ts`). It proves *vocabulary
  alignment and synthetic transition behaviour*, not durable persistence. Durable
  Admission Wedge storage stays gated behind ADR-022E gate #8.

---

## 6. Ownership boundaries (preserved)

- **Straylight (`@loa/straylight`) — primitive / substrate vocabulary only.** Owns the
  assertion lifecycle, recall-eligibility semantics, signer/keyring, receipt/audit
  primitives, the supersession relation, the `privacy_scope` + frame projection rule, and
  the substrate-vs-ingress storage boundary + ADR-022E. Owns the §5 answers above. Does
  **not** own or authorize the Dixie route, wire behaviour, endpoint idempotency, or any
  Freeside lane.
- **Dixie (`loa-dixie`) — endpoint route contract / wire behaviour / endpoint idempotency.**
  Owns the HTTP/BFF ingress seam, the route contract draft, tenant/estate binding *as a
  spike isolation mechanism*, the **endpoint idempotency semantics** (row J), refusal
  mapping, and the no-leak serializer implementation. Must not coin or freeze canonical
  assertion-lifecycle vocabulary.
- **Freeside Characters (freeside-characters) — client / Discord integration.** Owns whether
  and how a client binds to an *accepted* Dixie contract. This response authorizes **no**
  Freeside runtime/client change and hands no client contract to Freeside.

> No repo can authorize another repo's final contract or runtime lane. This response is a
> Straylight-owned answer Dixie may cite; it is not Dixie or Freeside authorization.

---

## 7. What this response does NOT authorize (blocked lanes preserved)

This Straylight primitive-review response **does not authorize**, and each remains blocked:

- production admission;
- durable Admission Wedge storage (ADR-022E gate #8 held);
- DB writes;
- production database migrations;
- production auth / consent;
- public `remember-this`;
- Discord command / history ingestion;
- user chat becoming memory;
- Freeside Characters runtime / client integration;
- Dixie package exports;
- a final / production schema freeze;
- the final Dixie route contract;
- production route deployment;
- a Dixie *admission* endpoint of any shape (ADR-026C / ADR-026D authorize only a single
  *recall*-intake endpoint — a different seam);
- final idempotency semantics (Dixie / endpoint-owned; undecided);
- production signer / authority semantics;
- production tenant / estate / actor identity binding;
- production readiness of any kind.

> **No production-readiness claim.** Resolving this Straylight primitive review clarifies
> the *design*; it does **not** by itself clear the independent ADR-022E durable-store gate,
> the production auth/consent gate, the final route-contract gate, or any Freeside gate. The
> Straylight review is a **high-leverage vocabulary prerequisite, not the only production
> gate.** Straylight decisions govern only Straylight-owned substrate concerns; they cannot
> authorize Dixie endpoint/auth/consent decisions or Freeside runtime integration.

---

## 8. Summary of dispositions

| Row | Term / question | Status |
|-----|-----------------|--------|
| A | candidate / `proposed` pre-admission | accepted |
| B | admitted lifecycle (`active`) | accepted |
| C | `admit_assertion` / `assertion_admitted` / `transition_denied` / **`assertion_superseded`** | accepted (`admit_assertion` / `assertion_admitted` / `transition_denied`) + **rejected** (`assertion_superseded` → normative re-relation: `assertion_linked` + `superseded`) |
| D | supersession relation | accepted |
| E | recall eligibility projection | Straylight `RecallDisposition` accepted; boolean projection delegated |
| F | signer / authority (`policy_service`) | vocab accepted; production authority unresolved |
| G | tenant / estate / actor binding | Straylight ids accepted; `tenant_id` binding delegated; production binding unresolved |
| H | receipt / audit vocab + public/private | Straylight half accepted; public field name delegated |
| I | fail-closed semantics | accepted |
| J | idempotency delegation | **delegated** (endpoint-owned; content-addressed id derivation is the distinct, complementary primitive) |
| K | public/private projection rule | Straylight rule accepted; serializer delegated |
| L | candidate → assertion linkage | accepted |
| M | denial taxonomy | accepted |
| N | corrected-active vs relation | accepted |
| O | storage/audit boundary + ADR-022E | substrate semantics accepted; durable store unresolved (ADR-022E held) |

---

## 9. Expected / recommended Dixie follow-up

> **Recommended next Dixie lane: Phase 33U — Admission Wedge Straylight primitive-review
> response intake / lane-decision gate (docs / decision-only).**

This matches the lane Dixie Phase 33T itself selected (`...FOLLOWUP.md` §10). The
recommendation:

- **Phase 33U intakes this response** and reconciles each A–O disposition into the Dixie
  review register. It should **not invent answers beyond this response**; where this
  response says *Delegated-to-Dixie* or *Unresolved*, Phase 33U records the Dixie-owned
  decision (or its continued deferral), not a Straylight claim.
- **Phase 33U is docs/decision-only.** It must keep `straylight_primitive_review_complete`
  honest: this response resolves the **Straylight-owned vocabulary** part of the review, but
  it does **not** clear the independent production gates. Phase 33U must not treat vocabulary
  alignment as production authorization.
- After 33U, the documented **D→E follow-on** (finalize the Phase 33K storage/auth/consent
  *design* against the now-confirmed vocabulary) may proceed **as a docs/design lane only**,
  while ADR-022E gate #8 (durable store), the production auth/consent gate, and the final
  route-contract gate each remain to be cleared on their own.
- **Production implementation remains out of scope** under every option.

Concrete inputs Phase 33U should carry forward from this response:

1. **C / N**: drop `assertion_superseded` as a canonical audit event; adopt the response's
   normative re-relation — `assertion_linked` (`link_assertions`, link type `supersedes`) +
   `superseded` status (canonical forward field `supersedes_refs`), corrected assertion
   `active` — noting Straylight implements no link/supersession executor today.
2. **H**: split the synthetic audit record into `AuditEvent` + `TransitionReceipt`
   mappings; standardize on a single public field name (recommend `public_receipt_ref`).
3. **J**: record Dixie as the endpoint-idempotency owner; keep content-addressed id
   derivation (deterministic only for identical complete inputs, including `now`; no
   substrate de-duplication) as a complementary substrate property only.
4. **E / K / G**: treat `recall_eligible`, the no-leak serializer, and `tenant_id` binding
   as Dixie projections/host-layer concerns over the confirmed substrate primitives.
5. **O**: any durable-storage design must cite ADR-022E gate #8 as held and propose its own
   gate-clearing ADR.

---

## 10. Validation

This document is docs/decision-only. Validation is that it changed nothing executable. The
artifact is a **new, untracked** file (`docs/ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md`),
so the validation must account for that. A plain `git diff --check` inspects unstaged
changes to tracked files, while `git diff --cached --check` inspects staged changes; neither
inspects an untracked file. The applicable commands are:

```bash
# 1. Confirm the working tree: the ONLY entry is the new untracked doc.
git status --short --branch --untracked-files=all

# 2. Confirm nothing is staged (no index changes).
git diff --cached --name-status

# 3. Whitespace/conflict check of the staged set — empty (nothing staged).
git diff --cached --check

# 4. Whitespace/conflict check of the untracked file itself, against /dev/null.
#    This exits 1 because the file has content (it differs from the empty
#    /dev/null), NOT because of any whitespace defect. `test "$?" = "1"`
#    absorbs that expected exit code so the line succeeds.
git diff --no-index --check /dev/null docs/ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md || test "$?" = "1"
```

Expected results: `git status` shows the branch header plus exactly one change entry — `?? docs/ADMISSION-WEDGE-PRIMITIVE-REVIEW-RESPONSE.md`;
`git diff --cached --name-status` is empty; `git diff --cached --check` is empty (clean);
the `--no-index` check against `/dev/null` exits 1 (the file has content / differs from the
empty file) and **prints no whitespace diagnostics** — meaning the content is clean. No
`src/`, `tests/`, `scripts/`, `fixtures/`, `dist/`, `dist-types/`, `package.json`, `exports`,
schema, config, env, CI, or generated path is touched; nothing is staged or committed by the
authoring step. No build/test validation is invoked — only diff/whitespace validation is
applicable to a docs-only decision artifact, and the repo defines **no markdown/docs lint
command** (its `package.json` scripts are typecheck / build / test / demo / export only).

---

## 11. Cross-references

- `loa-dixie:docs/ADMISSION-WEDGE-STRAYLIGHT-PRIMITIVE-REVIEW-FOLLOWUP.md` (Phase 33T / PR
  #138) — the review request this document answers. Read read-only; **not modified**.
- `loa-dixie:docs/ADMISSION-WEDGE-STRAYLIGHT-PRIMITIVE-REVIEW-GATE.md` (Phase 33J) — the
  original §5 A–O register. Read read-only; **not modified**.
- `src/straylight/types.ts` — canonical primitive types: `AssertionStatus` (`:86-94`),
  `SignerType` (`:122-130`), `Assertion` (`:145-167`), `EstateTransition` (`:272-300`),
  `TransitionReceipt` (`:364-388`), `RecallUseInstruction` (`:427-431`), `RecallReceipt`
  (`:469-489`), `AuditEventType` (`:495-512`, **no `assertion_superseded`**), `AuditEvent`
  (`:514-529`), `CommitmentRoot` (`:531-547`), `CandidateAssertion` (`:551-565`).
- `src/straylight/estate.ts:140-265` — `admit()` executor: status `active` (`:203`),
  `assertion_admitted` audit (`:221`), `transition_denied` audit (`:156`), `denied` /
  `admission` receipts; content-addressed `transition_id` / `assertion_id` (`:149,197`).
- `src/straylight/policy.ts:181-241` — `RecallDisposition` + `dispositionFor` (emergent
  recall eligibility); `privacyDispositionForFrame` (`:243+`).
- `src/straylight/host/tenancy.ts:1-57` — `tenant_id` is host-layer, not a wedge primitive;
  cross-tenant ambiguity fails closed.
- `docs/architecture/loa-straylight-product-system-architecture-spec.md` — lifecycle state
  machine (`:856-884`), admission definition (`:886-897`), `AssertionLinkType` incl.
  `supersedes` (`:910-921`), signer roles (`:1113-1114,:1160-1163`), `AuditEvent.event_type`
  list (`:1551-1568`).
- `docs/decisions/ADR-022E-phase-22-deferred-features.md` — durable persistence gate #8
  (`:57`, held), Dixie boundary wiring gate #10 (`:59`), network-surface gate #12 (`:61`),
  threat-model-widening gate #20 (`:69`).
- `docs/decisions/ADR-026C-dixie-recall-intake-consumer-contract.md` /
  `docs/decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md` — the
  **recall**-intake consumer contract and endpoint authorization (a different seam from
  admission); idempotency delegation (ADR-026D §3.b, `:280-301`); no production storage
  migration (§7.i, `:466-473`); gate #10 narrowly unblocked for recall-intake only
  (`:565-566`). This response authorizes **no** admission-endpoint analogue.
