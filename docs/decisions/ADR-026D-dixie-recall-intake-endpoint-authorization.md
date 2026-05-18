# ADR-026D — Dixie recall-intake endpoint authorization (Phase 26D)

## Status

Accepted-for-Phase-26D.

ADR-026D is a **Straylight-side authorization record** for
exactly **one** future sibling-repo PR in
[`loa-dixie`](https://github.com/0xHoneyJar/loa-dixie) that
adds a recall-intake endpoint/adapter consuming
`@loa/straylight/runtime/recall-intake` per ADR-026A and
ADR-026C. ADR-026D does **not** itself implement the endpoint,
edit `loa-dixie`, or open the sibling-repo PR.

ADR-026D authorizes:

- exactly **one** sibling-repo PR, in `loa-dixie` only;
- that PR may add **one** recall-intake endpoint/adapter that
  consumes `@loa/straylight/runtime/recall-intake` through the
  published Straylight package surface;
- the endpoint/adapter MUST use `createDixieCapability` and
  `handleRecallIntake` from the runtime barrel and MUST satisfy
  ADR-026C §3 consumer-contract obligations 3.1–3.8 in full;
- the endpoint/adapter MUST resolve or gate the Phase 26A-1
  endpoint prerequisites surfaced by Flatline SKP-002 / SKP-003 /
  SKP-004 (T13–T18 + the T9 persistence-posture amendment) per
  the §3 acceptance criteria below;
- the sibling-repo PR MUST pass a real 3-model Flatline pass
  AND a real Bridgebuilder review pre-merge per ADR-026A0
  §"Decision" §5 (sibling-repo implementation + endpoint
  authorization material).

ADR-026D does **not** authorize:

- a Dixie endpoint of any other shape or any other handler (no
  governance timeline, no provenance walk, no audit-chain
  lookup, no estate summary, no review-queue management
  endpoint, no excluded-aggregate display endpoint — the Phase
  24E S2–S6 surfaces remain unauthorized);
- broader Dixie integration beyond the single recall-intake
  endpoint/adapter (no BFF rebuild, no operator console, no
  Discord / Telegram / NATS surface);
- a sibling-repo edit anywhere other than `loa-dixie` (no
  `loa-finn`, no `loa-hounfour`, no `loa-freeside`, no other
  repo);
- a Straylight package-surface change (no `package.json` /
  `exports` map / runtime allowlist edit; no new subpath; no
  new exported runtime value);
- a Straylight runtime-source change (no edit under
  [`../../src/straylight/runtime/recall-intake/`](../../src/straylight/runtime/recall-intake/);
  no edit to the Phase 26B HMAC + closure-private brand
  mechanism; no edit to the env-key binding);
- Finn wiring (ADR-022E gate #9 remains held);
- Hounfour adoption (ADR-022E gates #1–#5, #17, #18 remain
  held; no `move_to_hounfour` flip; no schema publication; no
  class-validator swap);
- Freeside wiring (ADR-022E gate #11 remains held);
- production storage migration (ADR-022E gate #8 remains held)
  beyond what is explicitly required for endpoint guardrails
  in §3 (per-tenant memory cap and bounded estate-storage
  posture);
- Loa framework edits (no `.claude/`, no `.loa.config.yaml`,
  no hooks);
- a tag, a release, a package publish, or a Hounfour
  dependency bump;
- broad autonomy or action-execution surfaces of any kind.

ADR-026D edits no prior ADR. ADR-026D does **not** edit
[`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../tsconfig.runtime.json`](../../tsconfig.runtime.json),
[`../../vitest.config.ts`](../../vitest.config.ts),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore),
[`../../.loa.config.yaml`](../../.loa.config.yaml), any file
under [`../../src/`](../../src/), any file under
[`../../tests/`](../../tests/), any file under
[`../../scripts/`](../../scripts/), any file under
[`../../fixtures/`](../../fixtures/), any committed
declaration under [`../../dist-types/`](../../dist-types/),
any emitted JS under [`../../dist/`](../../dist/),
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), or
[`../mvp/threat-model.md`](../mvp/threat-model.md) (Phase
26A-1 already amended it). ADR-026D cuts no tag, pushes no
tag, publishes no package, creates no GitHub Release, files
no GitHub issue / comment / PR, bumps no Hounfour dependency,
and does not touch [`../../.loa`](../../.loa) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

ADR-026D sits on top of ADR-026C (consumer contract), ADR-026A
(runtime subpath authorization), the Phase 26B implementation
(PR #45) and Phase 26B-F runtime-packaging hardening (PR #46),
ADR-026A0 (operator-authority Flatline rule), the Phase 26A-1
threat-model amendment (T13–T18 + T9 persistence posture),
ADR-025A, ADR-025B, ADR-024A through ADR-024K, ADR-022A
through ADR-022E, and ADR-020A through ADR-020E, without
modifying any of them.

## Context

### Why ADR-026D exists

Phase 26A-1 recorded the threat-model prerequisites the future
Dixie recall-intake endpoint must satisfy (T13–T18 + the T9
persistence-posture amendment). It did **not** authorize the
endpoint.

ADR-026A authorized the Straylight-side runtime subpath at
`@loa/straylight/runtime/recall-intake`, narrowed to a Dixie-only
MVP slice for the single `handleRecallIntake` handler. It did
**not** authorize a Dixie endpoint, a sibling-repo edit, or a
broader reorder of Phase 15.

Phase 26B implemented `@loa/straylight/runtime/recall-intake`,
exposing exactly the
`{ handleRecallIntake, createDixieCapability, DixieCapabilityError }`
allowlist plus the `DixieCapability` type, gated by the HMAC +
closure-private brand mechanism, fail-closed against the
ADR-026A §7 attack shapes. Phase 26B-F hardened the runtime
packaging notes.

ADR-026C pinned the consumer contract a future Dixie endpoint
must honor — the eight obligations 3.1–3.8 — and added the
Phase 26C consumer-shaped test that proves Straylight upholds
its end. ADR-026C **explicitly did not authorize** a Dixie
endpoint or any sibling-repo edit.

That leaves an unauthorized step: deciding whether the next PR
may touch `loa-dixie`, and under what exact constraints.
ADR-026D answers that question. It authorizes **one** future
sibling-repo PR in `loa-dixie` to add a recall-intake
endpoint/adapter consuming the runtime subpath; it pins the
exact endpoint shape, the exact consumer obligations the
endpoint must honor, the exact endpoint-prerequisite
resolutions the endpoint must implement, and the exact tests
the endpoint must ship before merge. The future Dixie PR can
be executed against ADR-026D without another planning PR on
the Straylight side.

### Why a Straylight-side authorization record is the right shape

The endpoint ships in `loa-dixie`, not in `loa-straylight`. The
authorization can in principle live in either repo. ADR-026D
records it on the Straylight side, in-repo, because:

- ADR-026A, ADR-026C, and the Phase 26A-1 threat-model
  amendment all live on the Straylight side. The endpoint's
  consumer obligations and threat-model prerequisites are
  Straylight-owned. Recording the authorization on the same
  side keeps the trail unbroken.
- The future Dixie PR can cite ADR-026D as its authorization
  evidence under the operator-authority + threat-model +
  consumer-contract chain, without round-tripping through this
  repo for clarification.
- The Straylight side retains the right to refuse: ADR-026D
  binds `loa-dixie` only to the extent the Dixie PR cites it.
  If a Dixie PR exceeds the §2 scope below, reviewers may cite
  ADR-026D §"Decision" §7 to refuse without further
  cross-repo coordination.

## Decision

### 1. File set

ADR-026D establishes the following file set, and only this
file set:

- **New:** this ADR
  ([`./ADR-026D-dixie-recall-intake-endpoint-authorization.md`](./ADR-026D-dixie-recall-intake-endpoint-authorization.md)).
- **New:** the companion handoff
  ([`../handoffs/phase-26d-dixie-recall-intake-endpoint-authorization.md`](../handoffs/phase-26d-dixie-recall-intake-endpoint-authorization.md)).
- **Append-only:**
  [`../handoffs/README.md`](../handoffs/README.md) — a new
  Phase 26D section in chronological order, after the Phase 26C
  entry, before the Phase 15 cross-repo-coordination section,
  in the existing per-phase format.
- **Append-only:**
  [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — narrow Phase 26D cross-reference appended after the Phase
  26A-2 narrowing section. Records that the **single** future
  Dixie recall-intake endpoint PR is now authorized under
  ADR-026D. **No general reorder** of the
  Hounfour → Finn → Dixie → Freeside sequence; no other Dixie
  work is opened.

No prior ADR is edited. No prior handoff is edited other than
the two append-only updates above. No file under
[`../../src/`](../../src/),
[`../../tests/`](../../tests/),
[`../../fixtures/`](../../fixtures/),
[`../../scripts/`](../../scripts/),
[`../../dist/`](../../dist/), or
[`../../dist-types/`](../../dist-types/) is touched.
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
**not** edited (Phase 26B already added the runtime-subpath
section). [`../mvp/threat-model.md`](../mvp/threat-model.md)
is **not** edited (Phase 26A-1 already amended it).

### 2. Authorized sibling-repo PR — scope

ADR-026D authorizes exactly **one** future sibling-repo PR,
under teammate review, with the following bounded scope:

- **2.a — Repo.** The PR opens against
  [`loa-dixie`](https://github.com/0xHoneyJar/loa-dixie) and
  **only** `loa-dixie`. The PR does not edit `loa-straylight`,
  `loa-finn`, `loa-hounfour`, `loa-freeside`, or any other
  repo.
- **2.b — Endpoint shape.** The PR adds **one** recall-intake
  endpoint/adapter (the network-facing surface that accepts an
  authenticated HTTP recall-intake request and returns the
  `RecallIntakeResponse` produced by `handleRecallIntake`).
  The PR does not add the Phase 24E S2–S6 surfaces (receipt
  retrieval, exclusion display, provenance walk, audit-chain
  lookup, estate summary), the review-queue management surface,
  any governance timeline surface, or any other Dixie surface.
- **2.c — Package consumption.** The endpoint/adapter consumes
  `@loa/straylight/runtime/recall-intake` from the published
  Straylight package surface (subpath-only import per ADR-026C
  §3.1; no deep-import per ADR-026C §3.2). The PR does not
  consume any other Straylight subpath at runtime; root `.` and
  `./host` remain `"types"`-only by ADR-026A §"Decision" §5.
- **2.d — Required runtime symbols.** The endpoint/adapter
  MUST use `createDixieCapability` to mint capabilities, and
  MUST pass each capability through to `handleRecallIntake` as
  the fourth argument (per ADR-026C §3.3 and §3.5). The
  endpoint/adapter MUST NOT synthesise `{ nonce, proof }`
  objects (per ADR-026C §3.3); MUST NOT serialise capabilities
  across processes (per ADR-026C §3.7); MUST NOT cache
  capabilities across env-key rotations (per ADR-026C §3.5).
- **2.e — Required env binding.** The endpoint/adapter's
  deployment MUST plant `STRAYLIGHT_RUNTIME_DIXIE_KEY` in its
  own process environment before the first call to
  `createDixieCapability()` (per ADR-026C §3.4). The endpoint
  MUST treat the constructor's refusal on missing or empty key
  as a non-recoverable startup failure; absence MUST NOT be
  treated as a fall-back-to-allow path.
- **2.f — Consumer obligations.** The endpoint/adapter MUST
  honor ADR-026C §3 obligations 3.1 through 3.8 in full. The
  Dixie PR's tests MUST cite the obligation it exercises.

### 3. Endpoint prerequisites — required resolutions

The endpoint/adapter MUST resolve or gate the Phase 26A-1
threat-model prerequisites (T13–T18 + the T9
persistence-posture amendment) under the following acceptance
criteria. Each row's "Future tests" pointer in the Phase 26A-1
amendment is now replaced by the **concrete test classes**
listed below, which the Dixie PR MUST author.

- **3.a — T17 resource exhaustion (SKP-002 closure).** The
  endpoint MUST ship **all four** of:
  - **(i) Request body size limit.** Configured maximum on the
    inbound HTTP request body, enforced at ingress, refusing
    beyond the limit with a defined HTTP status and a defined
    audit/operator signal.
  - **(ii) Per-tenant rate limit.** Token-bucket / leaky-bucket /
    equivalent throttle keyed on the authoritative tenant id
    (per §3.d). Refusal under sustained load MUST NOT starve
    other tenants.
  - **(iii) Per-tenant memory cap / bounded estate-storage
    posture.** A configured upper bound on the in-memory estate
    footprint per tenant, enforced with a refusal or eviction
    policy beyond the bound. Unbounded `InMemoryStorage` per
    tenant is **not** acceptable. This is the **only**
    storage-posture change ADR-026D authorizes; it does **not**
    fire ADR-022E gate #8 and does **not** authorize a
    production persistence adapter.
  - **(iv) Refusal behavior.** Explicit, tested refusal path
    for each of (i)–(iii): defined HTTP status, defined audit
    emission, defined operator-visible signal. Silent drop is
    **not** acceptable.
- **3.b — T15 replay / idempotency (SKP-003 closure).** The
  endpoint MUST implement **one** of:
  - **(i) Idempotent replay handling (default).** For matching
    `(authoritative tenant id, authoritative caller, replay key
    or request identity)`, the endpoint returns the **prior
    receipt** rather than appending duplicate state. The replay
    key MUST be derived from caller-controlled identity that
    survives transport retries (an explicit
    `Idempotency-Key`-style header is recommended). The audit
    chain reflects one admitted-or-denied transition per
    request identity, not two.
  - **(ii) Explicit duplicate-audit-OK semantics.** If
    idempotency cannot be implemented in the MVP slice, the
    Dixie PR MUST document duplicate-audit-OK semantics in
    `loa-dixie`'s own ADR/handoff and ship tests proving
    **replay cannot alter authorization** — second outcome
    equals first; no privilege gained, no denial converted to
    admission, no receipt rewritten. The duplicate-audit-OK
    documentation MUST cite ADR-026D and the Phase 26A-1
    T15 row.
  ADR-026D's preference is (i). (ii) is acceptable only with
  the explicit documentation + tests above.
- **3.c — T16 + T18 concurrency / multi-instance posture
  (SKP-004 closure).** The endpoint MUST implement **one** of:
  - **(i) Per-estate serialization.** Concurrent requests
    against the same authoritative `estate_id` are serialized
    so `getAuditTail → append` is atomic per estate.
    Inter-estate parallelism remains permitted. Tests MUST
    prove concurrent same-estate writes produce a single
    intact chain.
  - **(ii) Enforced single-instance refusal.** The endpoint
    refuses to start, refuses to register a second instance,
    or emits an operator-visible refusal when configured with
    `InMemoryStorage` and observed in a multi-process /
    multi-instance / load-balanced shape. Enforcement MUST be
    in code/config, not prose. Tests MUST prove refusal under
    a simulated multi-instance shape.
  Vague "single-instance" prose alone is **not** acceptable.
- **3.d — T13 + T14 ingress validation and authoritative
  tenant.** The endpoint MUST validate the inbound HTTP
  request shape, authentication, body size, and rate at
  ingress before invoking the runtime seam. The endpoint MUST
  resolve the authoritative `tenant_id` / `estate_id` from the
  authenticated context — **not** from caller-supplied body
  fields — and pass only the authoritative tenant to
  `handleRecallIntake`. Caller-supplied tenant fields that
  disagree with the authenticated context MUST be rejected,
  ignored, or overwritten at ingress.

### 4. Required fail-closed behaviors

The endpoint/adapter MUST fail closed in each of the following
shapes. The Dixie PR's tests MUST exercise each shape and MUST
assert the documented refusal:

- **4.a — Missing or empty `STRAYLIGHT_RUNTIME_DIXIE_KEY`.**
  The endpoint MUST refuse to start, or refuse the first
  request, with a non-recoverable startup or first-request
  failure. The endpoint MUST NOT default-allow.
- **4.b — Env-key rotation mid-flight.** A capability minted
  under env key K1, used after the deployment-bound env key
  rotates to K2, returns
  `outcome: 'denied'` with `raw_reasons` including
  `runtime_seam:proof_invalid`. The endpoint MUST re-mint
  through `createDixieCapability()` rather than retry with the
  stale capability.
- **4.c — Spoofed capability (hand-rolled `{ nonce, proof }`).**
  Calls passing a hand-rolled `{ nonce, proof }` object,
  including objects decorated with `package_name`,
  `caller_identity`, or `user_agent` fields, return
  `outcome: 'denied'` with `raw_reasons` including
  `runtime_seam:capability_unrecognized`. The endpoint MUST
  surface the denial; it MUST NOT retry with a synthesised
  capability.
- **4.d — Serialized / cross-process capability.** A capability
  minted in process A, serialised (`JSON.stringify`,
  structured-clone, RPC marshal) and rehydrated in process B,
  is rejected by process B's seam as
  `runtime_seam:capability_unrecognized`. Each process MUST
  mint its own capability locally with its own env-key
  binding.
- **4.e — Metadata-only caller identity.** The endpoint MUST
  NOT rely on `package_name`, `caller_identity`, `user_agent`,
  version strings, or any other caller-metadata field to gate
  authorization. The runtime seam ignores all of them by
  design (per Phase 26B test §10.f and ADR-026A §7).
- **4.f — Unknown / spoofed environment frame.** Caller frame
  unknown or spoofed → endpoint denies intake with reason
  `unknown_environment_frame` (or equivalent typed refusal).
  Frame attempts to "see more" than the runtime seam allows
  → endpoint surfaces the seam's output unchanged; it MUST NOT
  override.
- **4.g — Cross-tenant intake.** Caller authenticated as
  tenant A submits a body claiming tenant B → endpoint denies
  with reason `cross_tenant_recall_refused` at ingress; the
  runtime seam MUST also refuse as a second line of defense.

### 5. Required tests in `loa-dixie` before merge

The Dixie PR MUST include the following test classes. ADR-026D
authorizes none of these to live in `loa-straylight`; they
live in `loa-dixie`'s test suite:

- **5.a — T17 (a)–(d) tests (rate-limit / body-size /
  memory-cap / refusal).** Body-size refusal at and beyond
  configured limit; per-tenant rate-limit refusal under
  sustained load; per-tenant memory-cap refusal at and beyond
  the cap; refusal-behavior tests asserting documented HTTP
  status and audit emission.
- **5.b — T15 replay tests.** Either idempotent-receipt-return
  on duplicate request identity (§3.b path (i)), **or**
  duplicate-audit-OK with replay-cannot-alter-authorization
  invariants (§3.b path (ii)).
- **5.c — T16 / T18 concurrency tests.** Either per-estate
  serialization tests (concurrent same-estate writes produce
  a single intact chain) **or** single-instance refusal tests
  (the endpoint refuses or loudly degrades when configured
  with `InMemoryStorage` in a multi-instance shape).
- **5.d — T13 + T14 ingress tests.** Tampered HTTP bodies
  refused; forged auth refused; replayed transport envelopes
  refused; cross-tenant ingress refused; authoritative tenant
  derived from authenticated context overrides any
  caller-supplied tenant.
- **5.e — Fail-closed catalogue tests.** §4.a through §4.g
  each exercised, asserting the documented refusal shape.
- **5.f — ADR-026C §3 obligation tests.** Subpath-only
  imports (3.1, 3.2); capability mint via the public
  constructor with env key planted (3.3, 3.4); capability
  passed as fourth argument (3.5); no metadata-trust (3.6);
  no cross-process replay (3.7); fail-closed handling of
  `runtime_seam:capability_*` denials (3.8).

The Dixie PR MUST cite the `loa-straylight` artifact each test
exercises (ADR-026C §3.x, ADR-026D §3.y / §4.z, threat-model
T-row).

### 6. Required pre-merge Flatline + Bridgebuilder

The Dixie PR is a sibling-repo implementation **and** an
endpoint authorization landing. Per ADR-026A0 §"Decision" §5,
the Dixie PR MUST pass:

- a real 3-model Flatline pass (PASS or REVISE-with-resolution);
  AND
- a real Bridgebuilder review.

A REVISE verdict from either MUST be resolved before merge. A
BLOCK verdict halts the PR. Mock-mode passes do **not**
satisfy this requirement; cycle-109 substrate hardening pinned
the cheval substrate as the unconditional dispatch path.

### 7. Refusal rules — what ADR-026D does NOT authorize

Reviewers may cite this section verbatim to refuse a
sibling-repo or in-repo PR that exceeds ADR-026D's scope:

- **7.a — No Dixie endpoint other than recall-intake.** The
  Phase 24E S2–S6 surfaces (receipt retrieval, exclusion
  display, provenance walk, audit-chain lookup, estate
  summary), the review-queue management surface, the
  governance timeline surface, and any other Dixie surface
  remain unauthorized.
- **7.b — No broader Dixie integration.** No BFF rebuild, no
  operator console, no Discord / Telegram / NATS / REST
  surface, no admin capability grants, no bot actions.
- **7.c — No Straylight package-surface change.** No edit to
  [`../../package.json`](../../package.json), the `exports`
  map, the runtime allowlist, or any subpath. No new exported
  runtime value. The runtime allowlist remains exactly
  `{ handleRecallIntake, createDixieCapability,
  DixieCapabilityError }` plus the `DixieCapability` type
  re-export.
- **7.d — No new Straylight runtime subpath.** ADR-026D does
  not authorize a second runtime subpath. The only authorized
  runtime subpath remains `@loa/straylight/runtime/recall-intake`
  per ADR-026A.
- **7.e — No edit to the Phase 26B HMAC + closure-private
  brand mechanism.** The capability gate is unchanged. No edit
  to the env-key binding. No edit to fail-closed defaults.
- **7.f — No Finn wiring.** ADR-022E gate #9 remains held.
- **7.g — No Hounfour adoption.** ADR-022E gates #1–#5, #17,
  #18 remain held. No `move_to_hounfour` flip; no schema
  publication; no class-validator swap; no Hounfour dependency
  bump in `loa-straylight`.
- **7.h — No Freeside wiring.** ADR-022E gate #11 remains
  held.
- **7.i — No production storage migration.** ADR-022E gate
  #8 remains held. The per-tenant memory cap and bounded
  estate-storage posture authorized under §3.a (iii) is the
  endpoint's own guardrail; it does **not** authorize a
  production database / WAL / persistence adapter, a Dixie-side
  swap of `InMemoryStorage` for `JsonlStorage`, or any
  adapter beyond what is required for the four T17 acceptance
  criteria.
- **7.j — No tag, no release, no package publish.**
  ADR-026D cuts no tag, pushes no tag, publishes no package,
  creates no GitHub Release.
- **7.k — No broad autonomy / action execution.** ADR-026D
  authorizes a request → response endpoint that consumes
  `handleRecallIntake`. It does **not** authorize agent
  autonomy, tool execution, action loops, or any
  automation surface that converts the endpoint into an
  unattended action lane.
- **7.l — No Loa framework edit.** Per Phase 26A-0 §7, no
  `.claude/`, `.loa.config.yaml`, `.beads/`, `.run/`, or
  `.github/` edit.
- **7.m — No general Phase 15 reorder.** The Hounfour →
  Finn → Dixie → Freeside sequence remains the recommended
  order for all sibling-repo work other than this single
  endpoint slice.
- **7.n — No successor-ADR pre-approval.** A future
  ADR-026E / successor that retires, deprecates, widens, or
  narrows the runtime subpath, or authorizes a second Dixie
  endpoint, or fires Finn wiring, is **not** pre-authorized
  by ADR-026D. Such a successor must follow its own
  trigger-evidence + operator-authority + Flatline path per
  ADR-026A0 §"Decision" §5.

### 8. Successor-ADR contract reminder

A future ADR that draws on ADR-026D must still cite **all** of:

- ADR-026A0 (operator-authority leg);
- Phase 26A-1 (threat-model prerequisites leg);
- ADR-026A (runtime subpath authorization);
- ADR-026C (consumer contract);
- ADR-026D (this ADR — endpoint authorization).

The successor must supply on its own, or it remains refusable:

1. exact trigger evidence beyond ADR-026D's scope;
2. scope — exactly what surfaces / files / behaviors the
   successor authorizes (additive, citable);
3. threat-model impact statement under T13–T18 + T9 amendment;
4. its own tests;
5. its own rollback;
6. its own pre-merge real 3-model Flatline + Bridgebuilder
   verdict.

ADR-026D is not sufficient authorization for any successor
beyond the single sibling-repo PR scoped in §2.

### 9. Rollback

If the future Dixie recall-intake endpoint PR is merged and
must be rolled back:

- the Dixie PR's revert lives in `loa-dixie`'s git history and
  is the load-bearing rollback path on the consumer side;
- `loa-straylight` requires no revert: ADR-026D is a docs-only
  authorization record; ADR-026A's runtime subpath, Phase
  26B's implementation, and ADR-026C's consumer contract
  remain in place and continue to behave per their existing
  invariants (Phase 26B test suite continues to pin the
  Straylight-side seam);
- if the runtime subpath itself must be retired (e.g. ADR-022E
  gate #9 fires and Finn takes over), the retirement path
  recorded by ADR-026A §"Decision" §8 fires through a
  successor ADR, not through ADR-026D.

ADR-026D's own rollback is a single-file revert of this ADR
plus the companion handoff and the two append-only updates;
the `loa-straylight` runtime surface is unchanged either way.

## Consequences

- The repo gains a stable, in-repo, citable authorization
  record that the future Dixie recall-intake endpoint PR can
  reference as its sibling-repo authorization without round-
  tripping through `loa-straylight` for clarification.
- The Dixie PR can be executed against ADR-026D, ADR-026C,
  ADR-026A, and the Phase 26A-1 threat-model amendment without
  another planning PR on the Straylight side.
- The Phase 26A-1 endpoint prerequisites (T13–T18 + the T9
  persistence-posture amendment) are now resolved or gated by
  the §3 acceptance criteria above; SKP-002 / SKP-003 / SKP-004
  closure becomes the Dixie PR's responsibility under those
  criteria.
- The repo's package surface, runtime-source files, fixtures,
  scripts, dist outputs, tests, and CI workflows are unchanged
  by ADR-026D itself.
- No sibling repo is edited by ADR-026D; no deployment is
  authorized; no release is cut.
- ADR-022E gates #1–#5, #7, #8, #9, #11, #12, #17, #18 remain
  held. Gate #10 (Dixie boundary wiring) is now narrowly
  unblocked for the **single** recall-intake endpoint slice
  scoped in §2; broader Dixie boundary wiring remains held.

## Source files inspected

- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
- [`./ADR-026C-dixie-recall-intake-consumer-contract.md`](./ADR-026C-dixie-recall-intake-consumer-contract.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`../handoffs/phase-26a1-threat-model-dixie-endpoint.md`](../handoffs/phase-26a1-threat-model-dixie-endpoint.md)
- [`../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md`](../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md)
- [`../handoffs/phase-26c-dixie-recall-intake-consumer-contract.md`](../handoffs/phase-26c-dixie-recall-intake-consumer-contract.md)
- [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18
  + T9 persistence-posture amendment; not edited)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  (runtime-subpath section; not edited)
