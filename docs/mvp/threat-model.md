# Straylight Recall Wedge — threat model

> Status: Phase 5, with a Phase 26A-1 amendment. Threat model for
> the *current wedge*: a local, single-process, in-repo recall layer
> over a signed actor estate. Threats tied to integrations that do
> not yet exist (network ingress, multi-tenant isolation in a hosted
> DB, onchain anchoring, cross-repo consumers) are noted as
> out-of-scope but recorded here so the boundary stays explicit.
>
> Phase 26A-1 (docs-only; threat-model-only) records the
> threat-model prerequisites surfaced by Flatline SKP-002
> (resource exhaustion / DoS / unbounded `InMemoryStorage`),
> SKP-003 (replay semantics), and SKP-004 (concurrency posture)
> for the *future* Dixie recall-intake endpoint. The Phase 26A-1
> rows are T13 / T14 / T15 / T16 / T17 / T18, plus the persistence
> posture amendment to T9. Phase 26A-1 records prerequisites *for*
> a future authorizing ADR; it does **not** authorize ADR-026A,
> runtime widening, a Dixie endpoint, package-surface changes,
> Hounfour / Finn / Freeside wiring, Loa framework edits, storage /
> production persistence change, tags, releases, or sibling-repo
> edits. SKP-005 (future ADR-026A / runtime-subpath / experimental
> pre-Finn API surface design) remains open and is not closed by
> Phase 26A-1. See
> [`../handoffs/phase-26a1-threat-model-dixie-endpoint.md`](../handoffs/phase-26a1-threat-model-dixie-endpoint.md).

The threat model below is the contract `tests/phase-5-hardening.test.ts`
machine-checks. Every threat carries (a) what the attacker / fault tries
to achieve, (b) the wedge's defense, (c) what would break that defense,
and (d) a pointer to the test that proves the defense holds.

## In-scope adversaries

| Adversary | Capability |
|---|---|
| **Compromised tool output / LLM output** | Can return arbitrary strings into the runtime — including text that *looks like* an instruction, a memory, or an authoritative claim. No keys. |
| **Compromised public-chat input** | Can send arbitrary text into Discord / Telegram event ingestion. No keys. |
| **Compromised runtime signer** | Holds a `runtime` key. Can sign anything a `runtime` is competent to sign per the keyring. |
| **Stale operator** | Held an `operator` key that has since been revoked. May replay old messages or attempt new ones with the revoked key. |
| **Misconfigured policy** | Operator deployed an empty / partial keyring or a competence rule with no allowed roles. |
| **Tampered storage** | Process or operator with filesystem access to `JsonlStorage` rewrites a row or deletes an audit line. |
| **Buggy caller** | Constructs a `RecallRequest` missing fields, with the wrong `actor_id`, or against the wrong estate. |

## Out-of-scope (this phase)

- **Cryptographic forgery**. `dev_signature` is HMAC-SHA256 over `key_ref`,
  not real signature material. An attacker who learns `key_ref` *can* forge
  signatures. The wedge is explicit about this; production requires
  ed25519 / secp256k1 / real HMAC keys.
- **Network adversary**. There is no network surface in the current
  wedge. The *future* Dixie recall-intake endpoint will add one;
  Phase 26A-1 records its threat-model prerequisites in T13–T18 and
  the T9 persistence-posture amendment. Those rows describe future
  work that is **not** authorized by this phase or by Phase 26A-1;
  they are recorded so that any later authorizing ADR — notably
  ADR-026A — has a citable in-repo source for the threat-model leg
  it must satisfy. Transport-layer attacks against the live wedge
  remain out-of-scope today because today there is no live wedge
  endpoint.
- **Multi-tenant isolation in a shared DB**. There is no shared DB.
- **Side-channel / timing**. Out of scope for an MVP that runs locally.
- **Supply-chain attacks against vitest / node**. Out of scope; reproducible
  installs are a project-level concern.

## Threats and defenses

### T1 — Memory poisoning

**Goal.** Get untrusted text (chat message, scraped page, tool result)
admitted as an active assertion the recall layer will treat as truth.

**Defense.**
- Class validation rejects bodies that don't match the class's structural
  shape, but that's not the load-bearing layer here.
- Policy validation requires a *signature from a competent signer* per
  `evaluateCompetence`. Public-chat text has no signer; admission fails
  closed (`no_signatures` or `unknown_signer`).
- Even when text is wrapped by a runtime signer (e.g. Finn signs an
  `observation` derived from a Discord message), the signed class is
  `observation` / `runtime_observation` provenance — never `claim` /
  `identity` / `permission` / `commitment`, which are reviewer-gated by
  the default keyring.

**Breaks if.** A keyring is misconfigured to allow `runtime` to admit
`identity` or `permission`, or a runtime key is compromised.

**Tested by.** `signer-fail-closed.test.ts` (unknown signer cannot admit;
runtime cannot admit identity), `phase-5-hardening.test.ts`
(unknown-class fails class validation, unknown-signer fails policy).

### T2 — Inference-as-fact

**Goal.** Have a model-output reflection ("I think the user is suspicious")
silently promoted into a claim or identity assertion that future recall
treats as truth.

**Defense.**
- `policy.ts.needsReviewForModelOutput` returns `needs_review` whenever
  a candidate's *only* provenance is `model_output` AND the class is
  `identity`, `permission`, or `commitment`.
- Reflections retain class `reflection` and never auto-promote. Promotion
  is a separate transition that requires a competent signer.
- The recall layer reports `use_instruction` per item — `reflection`
  carries the same disposition rules as any other class; it never gets
  a special "treat as fact" lane.

**Breaks if.** A keyring is changed to allow `runtime` to admit `claim`
without reviewer co-sign and the candidate carries non-model-output
provenance (e.g. a forged tool-result line).

**Tested by.** Existing class-vs-policy tests; policy denial path on
identity/permission/commitment with model-output-only provenance.

### T3 — Revoked-assertion recall

**Goal.** Get an assertion that was revoked by a competent signer back
into a public recall pack as if still active.

**Defense.**
- `dispositionFor` excludes `status: 'revoked'` from any frame other than
  `audit_review`.
- In `audit_review` it surfaces in `marked`, never `included`, with a
  non-`usable` `use_instruction`.
- Excluding revoked assertions does **not** delete the audit trail — the
  `assertion_admitted` and `assertion_revoked` events both remain.

**Breaks if.** A caller constructs a `RecallRequest` with
`include_statuses: ['revoked']` and `mark_statuses: ['revoked']` — that
still surfaces revoked items but only as `marked`, never `usable`. The
defense relies on `useInstructionForMark` returning `do_not_use_for_action`
for the `revoked` case.

**Tested by.** `recall-exclusion.test.ts`, `phase-5-hardening.test.ts`
(revoked cannot recall as usable).

### T4 — Forgotten-from-recall recall

**Goal.** Same as T3 but for `forgotten_from_recall` — surface a forgotten
assertion as if usable.

**Defense.** Same as T3. `dispositionFor` excludes `forgotten_from_recall`
outside `audit_review`; inside `audit_review` it surfaces only as
`marked`. The forget transition itself requires `operator` or `reviewer`
per the default keyring.

**Tested by.** `forget-flow.test.ts`, `phase-5-hardening.test.ts`
(forgotten cannot recall as usable).

### T5 — Private assertion leakage

**Goal.** Have a `privacy_scope: 'actor_private'` or `'sealed'` assertion
appear in a public recall pack.

**Defense.**
- `privacyDispositionForFrame` excludes `actor_private` from
  `public_discord` / `public_telegram` / `private_chat` frames.
- `sealed` is excluded from every frame except `audit_review`, where it
  is returned as `redact`, never `include`.
- `tenant` is `redact`-ed in public frames (counts in the redaction
  summary; does not leak into `included` / `marked`).

**Breaks if.** An operator deliberately sets `privacy_scope: 'public'` on
content that contains private material. The wedge cannot detect that;
it's a writer-side classification responsibility.

**Tested by.** `recall-exclusion.test.ts`, `phase-5-hardening.test.ts`
(private cannot enter public recall).

### T6 — Cross-tenant recall leakage

**Goal.** A recall request scoped to estate A returns assertions from
estate B.

**Defense.**
- `executeRecall` filters candidates with
  `a.estate_id === request.estate_id`.
- `RecallRequest` validation requires non-empty `actor_id` and `estate_id`
  fields (`requireString` in the class validator).
- The audit log is per-estate; an estate's chain cannot link to another
  estate's events.

**Breaks if.** A caller submits a request with the wrong `estate_id`
field — but in that case the wedge returns matching that wrong estate's
content, not leakage *across* the requested estate. The wedge does not
authenticate the caller; that's an integration-layer concern (Dixie /
Finn).

**Tested by.** `phase-5-hardening.test.ts` (recall cannot proceed without
actor_id and estate_id).

### T7 — Incompetent signer

**Goal.** A signer who is on the keyring but not competent for the
requested transition is allowed to perform it anyway.

**Defense.**
- `evaluateCompetence` requires `entry.signer_type` to be in
  `matchedRule.required_signer_roles` AND not in
  `forbid_signer_roles`. A runtime cannot admit `identity` even if the
  runtime is on-keyring with valid status.
- Quorum, timelock, and human-review rules layer on top — competent
  signer alone is not allow if the rule demands more.
- A revoked key (status `revoked` or in `revoked_key_refs`) fails
  `isSignerCurrentlyValid` regardless of any other state.

**Tested by.** `signer-fail-closed.test.ts`, `quorum-and-timelock.test.ts`,
`phase-5-hardening.test.ts` (unknown signer fails policy / signer
competence).

### T8 — Missing policy

**Goal.** A transition or recall is allowed because no rule was loaded for
it (silent fall-through to permissive default).

**Defense.**
- `evaluateCompetence` returns `no_competence_rule_for_transition` when
  no rule matches.
- `policy.ts.projectCompetence` translates that to a `deny` with
  `policy_unavailable_for_transition` — never `allow`.
- The `safeRun` wrapper turns any thrown error inside the engine into a
  `deny` with `policy_engine_error:<code>`.

**Tested by.** `policy-unavailable.test.ts`, `phase-5-hardening.test.ts`
(missing policy fails closed).

### T9 — Tampered audit chain

**Goal.** Rewrite a row in the audit log (or the underlying JSONL file)
to hide a denied transition or to fabricate an admission.

**Defense.**
- Each `AuditEvent.audit_hash` is computed over its content **and** the
  preceding event's `audit_hash` per estate. Mutating any row breaks the
  link from that row forward.
- `AuditLog.verifyChain(estate_id)` walks the chain and returns
  `{ ok: false, broken_at, reason: 'previous_audit_hash_mismatch' }`
  on the first broken link.
- The wedge does not *prevent* tampering on the filesystem — it makes
  tampering *visible*. Operators must run `verifyChain` after any
  recovery or migration.

**Breaks if.** An attacker rewrites every event from the tampered point
forward, recomputing each `audit_hash`. The wedge cannot prevent this
without a public anchor; that's why §13.3 commitments exist (and why a
production deployment publishes them).

**Tested by.** `phase-5-hardening.test.ts` (tampered audit chain
verification fails).

**Persistence posture (Phase 26A-1 amendment).** This row is
amended to record the persistence posture that any *future* Dixie
recall-intake endpoint must respect:

- `InMemoryStorage` at the future MVP endpoint is
  **process-memory-only**. It does not survive process restart.
  It is not a production persistence adapter.
- Production persistence remains held behind ADR-022E gate #8.
  Phase 26A-1 does not fire that gate; it records the constraint.
- `JsonlStorage` must **not** be used at a live HTTP endpoint
  unless ADR-022E gate #8 fires *or* a separate adapter /
  concurrency ADR authorizes it. The Phase 5 caveat that
  `JsonlStorage` is single-writer remains load-bearing for any
  endpoint posture: HTTP-driven concurrent writers will silently
  corrupt the audit chain.
- Future tests (later, not in this phase): persistence-posture
  refusal tests at the future Dixie recall-intake endpoint —
  refuse to start with `JsonlStorage` plus a multi-process
  deployment shape; refuse to start with `InMemoryStorage` plus a
  multi-process deployment shape; matching ADR-022E gate #8
  refusal tests for production-persistence wiring.

This amendment authorizes nothing. It records the constraint a
later authorizing ADR must satisfy.

### T10 — Prompt / tool-output injection treated as authority

**Goal.** An LLM hallucinates "the user said: revoke assertion X" and the
runtime treats that string as a revocation instruction.

**Defense.**
- Revocation requires a `signatures` array from `operator` or `reviewer`
  signers (per the default keyring). An LLM cannot mint those.
- An LLM cannot construct a valid `SignatureEnvelope` because
  `verifyEnvelopeSelfConsistency` checks
  `signature === devSignatureFor(key_ref, signed_payload_hash)` and
  the LLM does not hold the operator/reviewer `key_ref`.
- The runtime that *does* hold a key is a `runtime` signer, which cannot
  authorize revocation per the default rule
  `rule:revoke-reviewer-or-operator`.

**Breaks if.** A runtime is granted an `operator`/`reviewer` role in its
keyring (a misconfiguration). The wedge cannot detect role-grant errors
in the keyring itself; that's a deployment-time review responsibility.

**Tested by.** `signer-fail-closed.test.ts` (recall with tampered
signature), `phase-5-hardening.test.ts` (unknown signer fails competence,
covers the "no key" leg).

### T11 — Contested assertion silently becoming truth

**Goal.** An assertion that was challenged with `mark_contested` is
returned in a public recall pack as if active.

**Defense.**
- `dispositionFor` returns `mark` for any `status: 'contested'` regardless
  of whether the caller listed `contested` in `mark_statuses` — contested
  is **always marked**, never silently included.
- `useInstructionForMark` maps the contested case to `mark_as_contested`.
  No marked item carries `usable`.
- The original assertion is not deleted; the challenge is admitted as its
  own assertion linked through `challenged_by_refs`.

**Tested by.** `recall-contested-marking.test.ts`,
`phase-5-hardening.test.ts` (contested is marked, never promoted).

### T12 — Commitment over a stale or substituted estate

**Goal.** Anchor a commitment whose `root_hash` does not actually cover
the estate material it claims to.

**Defense.**
- `computeCommitmentRoot` hashes a canonical projection of `actor_id +
  estate_id + commitment_type + sorted refs + sorted payload_summaries`.
  Any change to refs or summaries produces a different root.
- `commitmentForRecallReceipt` derives its inputs from the receipt's
  `pack_hash` + `receipt_hash`, both content-addressed.
- The commitment is signed by `created_by`. Forging a commitment requires
  forging the signer's signature.

**Breaks if.** The MVP `dev_signature` HMAC key is leaked. Production
must use real signatures with hardware-backed keys before commitments
are anchored anywhere visible.

**Tested by.** `audit-and-receipt.test.ts`, `phase-5-hardening.test.ts`
(commitment root changes if estate material changes).

## Phase 26A-1 amendment — future Dixie recall-intake endpoint

The rows below (T13–T18) record threat-model prerequisites for a
*future* Dixie recall-intake endpoint, surfaced by Flatline
SKP-002 (resource exhaustion / DoS / unbounded `InMemoryStorage`),
SKP-003 (replay semantics), and SKP-004 (concurrency posture).

These rows describe **future work that this phase does not
authorize.** Phase 26A-1 is docs-only and threat-model-only; it
does not authorize ADR-026A, runtime widening, a Dixie endpoint,
package-surface changes, Hounfour / Finn / Freeside wiring, Loa
framework edits, storage / persistence change, tags, releases, or
sibling-repo edits. SKP-005 (future ADR-026A / runtime-subpath /
experimental pre-Finn API surface design) is **not** closed by
Phase 26A-1; it remains open for the later authorizing ADR.

Each row's "Future tests" pointer names the test class a *later*
PR is expected to add. No test is added by this phase.

### T13 — Network adversary at the future Dixie recall-intake endpoint

**Goal.** A network adversary tampers with, replays, or forges an
HTTP `RecallIntakeRequest` against the future Dixie recall-intake
endpoint to admit material the estate would otherwise refuse, to
re-admit material that was previously denied, or to coerce
Straylight into emitting a receipt that misrepresents what
actually happened.

**Status.** The endpoint described here does not exist yet. Phase
26A-1 does not authorize it. The row is recorded so that any
later authorizing ADR — notably ADR-026A — has a citable
threat-model entry it must satisfy.

**Defense (when the endpoint is later authorized).**
- **First line: Dixie ingress validation.** Dixie is the host;
  it owns transport, authentication, request-shape validation,
  body-size enforcement, rate limiting, and tenant resolution
  before any Straylight runtime seam is invoked. The Dixie
  ingress validates that the inbound HTTP `RecallIntakeRequest`
  is well-formed, authenticated, within size / rate limits, and
  bound to an authoritative tenant from the authenticated
  context — never from caller-supplied fields.
- **Second line (only if separately authorized later): future
  Straylight recall-intake runtime seam.** If — and only if —
  a later ADR authorizes a Straylight runtime seam at which
  Dixie hands off a validated `RecallIntakeRequest`, that seam
  re-checks invariants the wedge can re-check (estate-id
  scoping, class validation, signer competence, status
  filtering, audit-chain append) and remains fail-closed on any
  precondition mismatch. The seam never trusts the network for
  authority.

**Breaks if.** The endpoint is wired without these layers. Phase
26A-1 records the prerequisite; it does not implement the
defense.

**Future tests (later Dixie ingress tests).** The later Dixie PR
must include ingress tests covering tampered HTTP request bodies,
forged authentication, and replayed transport envelopes. Phase
26A-1 adds none of these.

### T14 — Cross-tenant authorization at network ingress

**Goal.** A caller authenticated as tenant A submits a
`RecallIntakeRequest` whose body claims tenant B, and the
endpoint admits or returns material as if the caller were
authoritative for tenant B.

**Status.** Future-work row recorded by Phase 26A-1; the
endpoint described here does not exist yet and is not authorized
by this phase.

**Defense (when the endpoint is later authorized).**
- **Dixie resolves the authoritative tenant from the
  authenticated context** before invoking any Straylight runtime
  seam. The authenticated context — not the request body — is
  the source of truth for `tenant_id` / `estate_id`.
- **Caller-supplied tenant cannot be trusted.** The Dixie
  ingress explicitly rejects, ignores, or overwrites any
  caller-supplied tenant field that disagrees with the
  authenticated context; the Straylight runtime seam (if and
  when authorized) receives only the authoritative tenant.
- This complements T6 (cross-tenant recall leakage in the local
  wedge): T6 covers the wedge's per-estate filter; T14 covers
  the network ingress that *feeds* that filter.

**Breaks if.** Dixie passes through a caller-supplied tenant
field, or invokes a Straylight runtime seam before resolving
authoritative tenant. Phase 26A-1 records the prerequisite; it
does not implement the defense.

**Future tests (later Dixie cross-tenant ingress tests + later
runtime-subpath tests).** The later Dixie PR must include
cross-tenant ingress tests proving the authenticated context
overrides any caller-supplied tenant, and the later
runtime-subpath PR must include tests proving the runtime seam
refuses to act on a tenant value not derived from the
authenticated context.

### T15 — Replay against the Dixie recall-intake endpoint

**Goal.** An attacker (or a buggy retry path) re-submits an
authenticated `RecallIntakeRequest` with the same request
identity and either (a) causes duplicate state to be appended
(double-admit, double-revoke, duplicate receipt), or (b)
manipulates the second response into authorizing something the
first did not.

**Status.** Future-work row recorded by Phase 26A-1; the
endpoint described here does not exist yet and is not authorized
by this phase.

**Defense (when the endpoint is later authorized) — required
default.**
- **Idempotent replay handling.** For matching
  `(authenticated caller, replay key / request identity)`, the
  endpoint MUST return the **prior receipt** rather than append
  duplicate state. The receipt is content-addressed; returning
  the prior receipt is the safe equivalent of a no-op against
  the audit chain.
- **Replay must not alter authorization.** A duplicate request
  cannot widen, narrow, or otherwise mutate the authorization
  outcome of the original request. The audit chain must reflect
  one admitted (or denied) transition for one request identity,
  not two.

**Defense (fallback, only if the MVP cannot implement
idempotency).** If a later MVP iteration cannot implement
idempotency, the later authorizing ADR MUST explicitly document
**duplicate-audit-OK semantics** — i.e., a model in which two
audit entries for the same request identity is acceptable — AND
include tests proving that **replay cannot alter authorization**
(the second outcome equals the first; no privilege is gained, no
denial is converted to admission, no receipt is rewritten).

**Phase 26A-1 implements neither.** This row records the
threat-model requirement; the choice between idempotent-default
and explicit duplicate-audit-OK is the later authorizing ADR's
responsibility.

**Future tests (later replay / idempotency tests).** The later
Dixie PR must include replay tests covering the chosen path —
either idempotent-receipt-return on duplicate request identity,
or explicit duplicate-audit-OK with replay-cannot-alter-
authorization invariants. Phase 26A-1 adds none of these.

### T16 — HTTP-driven concurrency against `InMemoryStorage`

**Goal.** Concurrent HTTP requests racing through the future
Dixie recall-intake endpoint observe interleaved reads / writes
against `InMemoryStorage`, producing a divergent audit tail (one
request reads `getAuditTail` before another's write lands), a
broken hash chain, or a lost transition.

**Status.** Future-work row recorded by Phase 26A-1; the
endpoint described here does not exist yet and is not authorized
by this phase.

**Defense (when the endpoint is later authorized) — required
choice.** The later Dixie endpoint MUST choose **one** of:

1. **Per-estate serialization.** Concurrent requests against the
   same `estate_id` are serialized at the runtime seam, so
   `getAuditTail` → `append` is atomic per estate. Inter-estate
   parallelism remains permitted.
2. **Explicit single-process / single-instance / non-horizontal
   deployment constraint.** The endpoint refuses to start, or
   loudly degrades, when deployed in a multi-process /
   multi-instance / load-balanced configuration. The constraint
   must be enforced **in code / config / docs**, with tests —
   not merely asserted in prose.

**Vague "single-instance" prose alone is insufficient.** A
deployment that says "we expect this to run on one instance" but
does not refuse to start when it sees multiple instances is not
a defense; it is a hope. The later ADR must pick (1) or (2) and
back the chosen option with tests.

**Future tests (later per-estate serialization or single-instance
refusal tests).** The later Dixie PR must include either
per-estate serialization tests (concurrent same-estate writes
produce a single intact chain) or single-instance refusal tests
(the endpoint refuses or loudly degrades when it observes a
multi-instance deployment). Phase 26A-1 adds none of these.

### T17 — Resource exhaustion / DoS at the Dixie endpoint

**Goal.** An adversary submits oversized request bodies, a high
volume of authenticated requests, or a sequence of requests
designed to grow per-tenant in-memory estate storage without
bound, exhausting host memory or CPU and degrading or downing the
endpoint for all tenants.

**Status.** Future-work row recorded by Phase 26A-1. **This row
must not remain merely informational.** Flatline SKP-002 refused
the partial / informational treatment; Phase 26A-1 records the
explicit prerequisite below. The endpoint is **not mergeable**
without all four acceptance criteria.

**Defense (when the endpoint is later authorized) — required
acceptance criteria.** The later Dixie recall-intake endpoint is
not mergeable unless it has **all four** of the following:

a. **Request body size limit.** A configured maximum on the
   inbound HTTP request body, enforced at ingress, with refusal
   beyond the limit.
b. **Per-tenant rate limit or equivalent throttle.** Per-tenant
   throttling (token bucket, leaky bucket, or equivalent) so a
   single tenant cannot starve the endpoint for other tenants.
c. **Per-tenant memory cap / bounded estate storage posture.**
   A configured upper bound on the in-memory estate footprint
   per tenant, with refusal or eviction policy beyond the bound.
   Unbounded `InMemoryStorage` per tenant is not acceptable.
d. **Refusal behavior when limits are exceeded.** The endpoint
   must have an explicit, tested refusal path when any of the
   above limits is exceeded — a defined HTTP status, a defined
   audit emission, a defined operator-visible signal. Silent
   drop is not acceptable.

**Future tests (later rate-limit / body-size / memory-cap
tests).** The later Dixie PR must include tests covering each of
(a)–(d): body-size refusal at and beyond the limit, per-tenant
rate-limit refusal under sustained load, per-tenant memory-cap
refusal at and beyond the cap, and refusal-behavior tests
asserting the documented HTTP status and audit emission. Phase
26A-1 adds none of these.

### T18 — Cross-instance state divergence under `InMemoryStorage`

**Goal.** The future Dixie recall-intake endpoint is deployed in
a horizontal / multi-process / load-balanced configuration over
`InMemoryStorage`; tenant A's request hits instance 1, the next
request hits instance 2, and the two instances hold divergent
estate state — a transition admitted on instance 1 is invisible
to instance 2, and the audit chains diverge.

**Status.** Future-work row recorded by Phase 26A-1; the
endpoint described here does not exist yet and is not authorized
by this phase.

**Defense (when the endpoint is later authorized).**
- **Horizontal / multi-process / load-balanced deployment is out
  of scope** unless ADR-022E gate #8 (production persistence)
  fires, or a separate storage / concurrency ADR explicitly
  authorizes it. Phase 26A-1 does not fire either.
- **Code / config / docs must prevent or loudly refuse**
  multi-process deployment if `InMemoryStorage` is used. The
  enforcement must be observable: the endpoint refuses to start,
  refuses to register a second instance, or emits an
  operator-visible refusal — not merely a prose warning.
- This row is the inter-instance complement to T16. T16 covers
  intra-instance HTTP concurrency against `InMemoryStorage`;
  T18 covers the multi-instance shape that `InMemoryStorage`
  cannot honor at all without a coordinating storage layer that
  ADR-022E gate #8 has not yet authorized.

**Future tests (later single-instance / multi-instance refusal
tests).** The later Dixie PR must include tests proving that the
endpoint, when configured with `InMemoryStorage`, refuses or
loudly degrades when it detects a multi-instance deployment
shape. Phase 26A-1 adds none of these.

## Defense-in-depth properties the wedge maintains

These properties hold across the threats above; they're the "spirit" of
the design.

| Property | Where it shows up |
|---|---|
| **Class validation never makes policy decisions.** | `validators/class-validator.ts` reads only the candidate, never the keyring or estate. |
| **A signature is never authority by itself.** | Every transition runs through `evaluateCompetence` against the keyring's competence rules. |
| **Status filtering is always applied.** | `dispositionFor` runs unconditionally; callers cannot disable it. |
| **The audit log is append-only and chained.** | `AuditLog.append` reads `getAuditTail` and writes a hash that depends on it; mutation is visible via `verifyChain`. |
| **Receipts cover what was returned, not what was asked.** | `RecallReceipt.pack_hash` = the actual delivered pack, computed deterministically. Detail-level redaction is applied *after* the pack is built so the caller cannot probe via detail differences. |
| **Default deny on engine error.** | `policy.ts.safeRun` turns any throw into a deny + `policy_engine_error` reason. |
| **No silent successes.** | Every denied transition emits a `transition_denied` audit event and a `denied`-kind transition receipt; no failure mode is invisible to the operator. |

## Limitations the wedge does *not* hide

- `dev_signature` is HMAC and is **not** a production crypto primitive.
- `JsonlStorage` is single-writer; concurrent writers will silently
  corrupt the audit chain. Production uses a real WAL/DB. This caveat
  is now load-bearing for the *future* Dixie recall-intake endpoint
  posture: see T9's Phase 26A-1 amendment, T16, and T18.
- `canonicalize` is JCS-shaped, not RFC 8785 conformant. Cross-language
  determinism requires replacing it.
- The keyring is a static fixture in the wedge. Rotation, delegation, and
  recovery flows are reserved future work.

When any of those limitations changes (e.g. a real signer is wired in),
the corresponding row in this threat model — and the test that pins it —
must be updated in the same change.

The Phase 26A-1 amendment (T13–T18 + the T9 persistence-posture
addition) records prerequisites for future work that this phase
does not authorize. When a later authorizing ADR — notably
ADR-026A — fires, the corresponding rows must be re-checked
against the ADR's actual scope, and any tests the ADR adds must
update or replace the "Future tests" pointers above.
