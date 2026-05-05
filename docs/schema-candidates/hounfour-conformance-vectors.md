# Hounfour conformance vectors — local pre-extraction inputs

> Status: Phase 8. **Pre-extraction prep, in-repo only.** This document
> describes the local Hounfour conformance vectors that ship under
> [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/).
> They are written by [`scripts/export-hounfour-conformance.ts`](../../scripts/export-hounfour-conformance.ts)
> and validated by [`tests/hounfour-conformance.test.ts`](../../tests/hounfour-conformance.test.ts).
>
> These vectors are not canonical Hounfour schemas and they are not
> the official Hounfour conformance suite. They do not import from
> `loa-hounfour`, any sibling repo, `.loa/`, or `.claude/`, and they do
> not add `loa-hounfour` as a dependency. They exist so a later
> `loa-hounfour` PR can pick them up as test inputs without round-tripping
> through this repository.

## What this directory is

The Phase 7 extraction plan in
[`hounfour-extraction-plan.md`](./hounfour-extraction-plan.md) §5.3 H14
calls for a "conformance vector pack" that Hounfour ships once
extraction starts. Phase 8 stages those vectors **locally**, ahead of
extraction, so:

1. The wedge has a deterministic, in-repo description of every
   class / policy / audit / keyring case Hounfour will need.
2. A future `loa-hounfour` PR can adopt the JSON files directly, treat
   them as test inputs, and prove that its schemas / validators agree
   with the wedge's runtime semantics.
3. No cross-repo coupling lands until that PR.

Each vector is a small, self-describing JSON document with the
following shape:

```json
{
  "case_name": "<stable identifier>",
  "expected_valid": true | false,
  "validation_layer": "class_validation"
                    | "policy_validation"
                    | "audit_validation"
                    | "keyring_validation",
  "reason": "<why the layer accepts / rejects this payload>",
  "subject": "assertion" | "recall_request" | "recall_receipt"
           | "audit_event" | "policy_decision" | "signer_competence",
  "payload": <the example object itself>
}
```

`case_name` is unique across the pack. `expected_valid` is the answer
the **named** validation layer is supposed to give for the payload.
`reason` is a human-readable note about why; the test pins the reason
text on layer-specific phrases (e.g. the audit-tamper reason must
mention the audit chain or hash recomputation).

## What this directory is **not**

- **Not** canonical Hounfour schemas. The fixtures are written from
  current wedge output; their shape is the wedge's *current shape*,
  not Hounfour's published schema. The conformance bar is that
  Hounfour validates these payloads, not that Hounfour authored them.
- **Not** the official Hounfour conformance suite. Hounfour will own
  schema/class-validation vocabulary later. Until extraction lands,
  the wedge owns runtime semantics and these vectors are a *handoff
  artifact*, not an authoritative test pack.
- **Not** an integration. No sibling-repo dependency is added. No
  build step reaches across repos. The export script is local-only.
- **Not** a Phase 0–7 behavior change. The recall wedge runs exactly
  the same as before. Existing `npm run demo:recall`,
  `npm run demo:recall:json`, `npm test`, `npm run typecheck`, and
  `npm run schema:candidates` outputs are untouched. The only new
  surface is the export and its fixtures.

## The 12 vectors

The pack is a 6 × 4 / 2 × 2 / 2 × 2 matrix:

| File | `validation_layer` | `expected_valid` | What it pins |
|---|---|---|---|
| `valid-assertion.json` | `class_validation` | `true` | A structurally legible observation. |
| `invalid-assertion-unknown-class.json` | `class_validation` | `false` | `assertion_class` outside the `AssertionClass` enum. |
| `valid-recall-request.json` | `class_validation` | `true` | A structurally legible recall request (public_discord, medium risk). |
| `invalid-recall-request-missing-actor-id.json` | `class_validation` | `false` | A recall request without `actor_id` — the only structural fault. |
| `valid-recall-receipt.json` | `class_validation` | `true` | A receipt with `pack_hash`, `receipt_hash`, `detail_level`. |
| `invalid-recall-receipt-missing-receipt-hash.json` | `class_validation` | `false` | A receipt with `pack_hash` but no `receipt_hash`. |
| `valid-audit-event.json` | `audit_validation` | `true` | An audit event whose `audit_hash` reproduces under recomputation. |
| `invalid-audit-event-tampered-hash.json` | `audit_validation` | `false` | An audit event whose `audit_hash` has been zeroed out — only the chain check fails; class shape is intact. |
| `policy-decision-allowed.json` | `policy_validation` | `true` | A `PolicyDecision` of `allow` produced by `policyForAdmitAssertion` for a runtime-signed observation. |
| `policy-decision-denied.json` | `policy_validation` | `false` | A `PolicyDecision` of `deny` produced by `policyForAdmitAssertion` for an unknown signer. |
| `keyring-signer-competent.json` | `keyring_validation` | `true` | A self-consistent signature whose signer is on-keyring and role-competent for the matched rule. |
| `keyring-signer-incompetent.json` | `keyring_validation` | `false` | A self-consistent signature whose signer's role is **not** in the matched rule's `required_signer_roles`. |

The keyring vectors are the load-bearing pin against the *"valid
signature is signer competence"* conflation called out in
[`class-vs-policy-boundary.md`](./class-vs-policy-boundary.md) §2. Both
keyring vectors carry `signature_self_consistent: true` in their
payload; the difference is the `signer_competence_result`. Hounfour
MUST treat these gates as independent — the conformance test refuses
any reading where signature validity alone implies competence.

## Why a separate `validation_layer` field

The four validation layers live in distinct code paths in the wedge:

- `class_validation` — [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts)
  (`validateCandidateAssertion`, `validateRecallRequest`).
- `policy_validation` — [`src/straylight/policy.ts`](../../src/straylight/policy.ts)
  (`policyForAdmitAssertion`, `policyForTransition`,
  `policyForRecallRequest`, `dispositionFor`).
- `audit_validation` — [`src/straylight/audit.ts`](../../src/straylight/audit.ts)
  (`AuditLog.append`, `AuditLog.verifyChain`).
- `keyring_validation` — [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts)
  (`evaluateCompetence`, `resolveSigner`, `isSignerCurrentlyValid`).

A vector that names a layer commits a Hounfour consumer to running
*that* layer's check — not a sibling layer. The conformance test
specifically refuses two collapses that worse memory systems make
silently:

1. **`policy_validation` vectors do not pretend to be structural
   schemas.** Their payload is a `PolicyDecision` shape (`decision`,
   `policy_id`, `signer_competence_result`, `reasons`, `decided_at`).
   They MUST NOT carry `assertion_id`, `body`, `body_hash`,
   `assertion_class`, `provenance`, `pack_hash`, `receipt_hash`, or
   `audit_hash` as top-level fields.
2. **`class_validation` vectors do not embed a top-level decision.**
   Their payload is the candidate object only. They MUST NOT carry
   `decision` or `policy_decision` on their face.

The audit-tamper vector is the third pin: it isolates the chain
failure from class shape. The payload remains structurally complete
(every required field present, hashes still `sha256:`-prefixed); only
the digest itself does not recompute. Hounfour MUST therefore reject
it on `audit_validation`, not on `class_validation`. A consumer that
flags it as a class-shape problem has flattened a layer.

## What stays in `loa-straylight`

Per [`hounfour-extraction-plan.md`](./hounfour-extraction-plan.md), the
**runtime authority** for every layer in this document stays in the
wedge permanently:

- `policy_validation` — the producers of `PolicyDecision`
  (`policyForAdmitAssertion`, `policyForTransition`,
  `policyForRecallRequest`) never leave `loa-straylight`. Hounfour
  will host the `PolicyDecision` *type* so cross-repo readers can
  deserialize one; it will never *make* one.
- `audit_validation` — `AuditLog.append`, `AuditLog.verifyChain`, and
  the `previous_audit_hash` → `audit_hash` chain construction stay
  wedge-owned.
- `keyring_validation` — `evaluateCompetence`, `resolveSigner`,
  `isSignerCurrentlyValid`, the rule-matching specificity heuristic,
  and quorum / timelock / human-review resolution all stay
  wedge-owned.

`class_validation` is the only layer Hounfour eventually owns. Even
there, the wedge keeps its own validators alongside Hounfour's; the
two MUST agree on result shape. These conformance vectors are how a
later `loa-hounfour` PR proves agreement.

## Re-running the export

```bash
npm run hounfour:conformance
```

The script is deterministic. The same inputs always produce the same
output. Running it twice produces byte-identical fixtures.

If you change a vector intentionally, update the export helper, run
the command, commit the regenerated JSON, and confirm that
`npm test` still passes. If the test fails, the change has crossed
one of the layer-separation pins documented above; revisit the
helper rather than relaxing the test.

## Cross-references

- [`README.md`](./README.md) — directory overview and Phase 8 entry.
- [`hounfour-extraction-plan.md`](./hounfour-extraction-plan.md) — Phase 7
  classification and the H14 conformance-vector requirement these
  fixtures stage.
- [`class-vs-policy-boundary.md`](./class-vs-policy-boundary.md) — the
  load-bearing class-vs-policy invariant the keyring vectors pin in
  fixture form.
- [`hounfour-schema-extraction-prep.md`](./hounfour-schema-extraction-prep.md) — Phase 6
  per-candidate inventory.
- [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) —
  the Phase 6 current-shape examples (different artifact, different
  scope).
- [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/) —
  the conformance vectors written by this Phase 8 helper.
