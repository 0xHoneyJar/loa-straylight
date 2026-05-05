# Straylight Recall Wedge — threat model

> Status: Phase 5. Threat model for the *current wedge*: a local,
> single-process, in-repo recall layer over a signed actor estate. Threats
> tied to integrations that do not yet exist (network ingress, multi-tenant
> isolation in a hosted DB, onchain anchoring, cross-repo consumers) are
> noted as out-of-scope but recorded here so the boundary stays explicit.

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
- **Network adversary**. There is no network surface. When a Dixie / Finn
  integration adds one, transport-layer threats become in-scope there.
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
  corrupt the audit chain. Production uses a real WAL/DB.
- `canonicalize` is JCS-shaped, not RFC 8785 conformant. Cross-language
  determinism requires replacing it.
- The keyring is a static fixture in the wedge. Rotation, delegation, and
  recovery flows are reserved future work.

When any of those limitations changes (e.g. a real signer is wired in),
the corresponding row in this threat model — and the test that pins it —
must be updated in the same change.
