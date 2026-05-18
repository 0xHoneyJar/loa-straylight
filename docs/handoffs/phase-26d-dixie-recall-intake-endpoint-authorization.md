# Phase 26D — Dixie recall-intake endpoint authorization (in-repo only)

> Status: Phase 26D is a **Straylight-side authorization
> record** for exactly **one** future sibling-repo PR in
> [`loa-dixie`](https://github.com/0xHoneyJar/loa-dixie) that
> adds a recall-intake endpoint/adapter consuming
> `@loa/straylight/runtime/recall-intake` per ADR-026A and
> ADR-026C. Companion ADR:
> [`../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md`](../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md).
>
> Phase 26D does **not** itself implement the endpoint, edit
> `loa-dixie`, or open the sibling-repo PR. Phase 26D
> authorizes the sibling-repo PR; the PR opens, lands, and
> merges in `loa-dixie` under its own teammate review.
>
> Phase 26D edits only:
>
> - this handoff (new),
> - the companion ADR-026D (new),
> - [`./README.md`](./README.md) (append-only Phase 26D entry,
>   in chronological order, after the Phase 26C entry, before
>   the Phase 15 cross-repo-coordination section, in the
>   existing per-phase format),
> - [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
>   (narrow append-only Phase 26D cross-reference recording
>   that the **single** future Dixie recall-intake endpoint PR
>   is now authorized; **no** general reorder of the
>   Hounfour → Finn → Dixie → Freeside sequence).
>
> No prior ADR is edited. No prior handoff is edited other
> than the two append-only updates above. No file under
> [`../../src/`](../../src/),
> [`../../tests/`](../../tests/),
> [`../../fixtures/`](../../fixtures/),
> [`../../scripts/`](../../scripts/),
> [`../../dist/`](../../dist/), or
> [`../../dist-types/`](../../dist-types/) is touched. No
> `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`,
> `tsconfig*`, or `vitest.config.ts` is touched.
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
> is **not** edited (Phase 26B already added the
> runtime-subpath section).
> [`../mvp/threat-model.md`](../mvp/threat-model.md) is **not**
> edited (Phase 26A-1 already amended it). No
> `.loa.config.yaml`, [`../../.loa`](../../.loa),
> [`../../.claude/`](../../.claude/),
> [`../../.beads/`](../../.beads/),
> [`../../.run/`](../../.run/),
> [`../../.github/`](../../.github/),
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
> `node_modules/` is touched. No sibling repo is edited. No
> tag is cut, no Release is created, no PR or comment is
> filed, no package is published.

## Why Phase 26D exists

Phase 26A-1 recorded the threat-model prerequisites the future
Dixie recall-intake endpoint must satisfy (T13–T18 + the T9
persistence-posture amendment). It did not authorize the
endpoint.

ADR-026A authorized the Straylight-side runtime subpath at
`@loa/straylight/runtime/recall-intake`, narrowed to a
Dixie-only MVP slice for the single `handleRecallIntake`
handler. It did not authorize a Dixie endpoint, a sibling-repo
edit, or a broader reorder of Phase 15.

Phase 26B implemented the runtime subpath; Phase 26B-F
hardened the runtime packaging notes; ADR-026C pinned the
consumer contract a future Dixie endpoint must honor.
ADR-026C explicitly did not authorize a Dixie endpoint or any
sibling-repo edit.

That left an unauthorized step: deciding whether the next PR
may touch `loa-dixie`, and under what exact constraints.
Phase 26D answers that question. The companion ADR-026D
authorizes exactly one future sibling-repo PR in `loa-dixie`
to add a recall-intake endpoint/adapter consuming the runtime
subpath, and pins the exact endpoint shape, the exact
consumer obligations the endpoint must honor, the exact
endpoint-prerequisite resolutions the endpoint must
implement, and the exact tests the endpoint must ship before
merge.

## Authorized next PR

| Field | Value |
|---|---|
| Repo | `loa-dixie` only. No edit to any other repo. |
| Surfaces added | Exactly one — a recall-intake endpoint/adapter (network-facing surface that accepts an authenticated HTTP recall-intake request and returns the `RecallIntakeResponse` produced by `handleRecallIntake`). |
| Phase 24E surfaces in scope | S1 (recall intake / response) only. **Out of scope:** S2 (receipt retrieval), S3 (exclusion display), S4 (provenance walk), S5 (audit-chain lookup), S6 (estate summary), review-queue management, governance timeline, any other Dixie surface. |
| Required runtime symbols | `createDixieCapability` (mint), `handleRecallIntake` (call), `DixieCapabilityError` (catch). |
| Required env binding | `STRAYLIGHT_RUNTIME_DIXIE_KEY` planted in the deployment's process environment before the first `createDixieCapability()` call. |
| Required consumer obligations | ADR-026C §3 obligations 3.1–3.8 in full. |
| Required pre-merge gates | Real 3-model Flatline pass (PASS or REVISE-with-resolution) **and** real Bridgebuilder review. Mock-mode does not satisfy this. |
| Authorization scope | One sibling-repo PR only. ADR-026D §"Decision" §7.a–§7.n list refusal rules verbatim. |

## Endpoint prerequisites — required resolutions

The Phase 26A-1 threat-model amendment recorded T13–T18 + the
T9 persistence-posture addition as prerequisites for a future
endpoint. ADR-026D §"Decision" §3 resolves or gates each one
with concrete acceptance criteria. The Dixie PR replaces the
Phase 26A-1 "Future tests" pointers with the test classes
recorded in §"Required tests" below.

| Prerequisite | Resolution path (ADR-026D §3) | Closure |
|---|---|---|
| **T17 — Resource exhaustion / DoS** (SKP-002) | All four of: (i) request body size limit; (ii) per-tenant rate limit / equivalent throttle; (iii) per-tenant memory cap / bounded estate-storage posture (ADR-022E gate #8 **not** fired — endpoint guardrail only); (iv) explicit refusal behavior (defined HTTP status, audit emission, operator-visible signal). Silent drop is not acceptable. | SKP-002 closure becomes the Dixie PR's responsibility under §3.a. |
| **T15 — Replay / idempotency** (SKP-003) | Exactly one of: (i) idempotent replay handling (default — return prior receipt for matching authoritative tenant + caller + replay key); or (ii) explicit duplicate-audit-OK with replay-cannot-alter-authorization invariants documented in `loa-dixie`'s own ADR/handoff. (i) is preferred. | SKP-003 closure becomes the Dixie PR's responsibility under §3.b. |
| **T16 + T18 — Concurrency / multi-instance** (SKP-004) | Exactly one of: (i) per-estate serialization (concurrent same-estate writes produce a single intact chain); or (ii) enforced single-instance refusal (refuse to start / refuse to register a second instance / emit operator-visible refusal under multi-process shapes — in code/config, not prose). | SKP-004 closure becomes the Dixie PR's responsibility under §3.c. |
| **T13 + T14 — Ingress validation + authoritative tenant** | Validate request shape, authentication, body size, and rate at ingress before the runtime seam. Resolve authoritative `tenant_id` / `estate_id` from the authenticated context — never from caller-supplied body fields. Caller-supplied tenant fields disagreeing with the authenticated context are rejected, ignored, or overwritten at ingress. | Closure under §3.d. |
| **T9 amendment — persistence posture** | The endpoint MAY use `InMemoryStorage` only with the per-tenant memory cap from §3.a (iii). `JsonlStorage` at a live HTTP endpoint remains held behind ADR-022E gate #8 (not fired). | Closure under §3.a (iii) for the endpoint guardrail; gate #8 remains held. |

## Dixie implementation requirements

The Dixie PR's endpoint/adapter MUST satisfy each of the
following, observably, with tests that cite the obligation:

### Capability and env binding (ADR-026C §3.3, §3.4, §3.5, §3.7)

- mint capabilities through `createDixieCapability()` only;
  do not synthesise `{ nonce, proof }` objects;
- plant `STRAYLIGHT_RUNTIME_DIXIE_KEY` in the deployment's
  process environment before the first call;
- treat constructor refusal on missing or empty key as a
  non-recoverable startup or first-request failure (no
  fall-back-to-allow);
- pass each capability to `handleRecallIntake` as the fourth
  argument on every call;
- do not cache capabilities across env-key rotations — re-mint
  through `createDixieCapability()`;
- do not serialise capabilities across processes — each
  process mints its own capability locally with its own
  env-key binding.

### Subpath discipline (ADR-026C §3.1, §3.2)

- import only from `'@loa/straylight/runtime/recall-intake'`;
- do not import from `'@loa/straylight'` or
  `'@loa/straylight/host'` at runtime (both remain
  `"types"`-only by ADR-026A §"Decision" §5);
- do not deep-import any internal path under
  `'@loa/straylight/...'`.

### Tenant resolution (ADR-026D §3.d)

- resolve `tenant_id` / `estate_id` from authenticated
  context;
- reject, ignore, or overwrite caller-supplied tenant fields
  that disagree;
- pass only the authoritative tenant to `handleRecallIntake`.

### Request controls (ADR-026D §3.a)

- request body size limit (configured maximum, refusal
  beyond);
- per-tenant rate limit (token-bucket / leaky-bucket /
  equivalent);
- per-tenant memory cap / bounded estate-storage posture
  (refusal or eviction policy);
- explicit refusal behavior for each control (HTTP status,
  audit emission, operator signal).

### Idempotency / replay (ADR-026D §3.b)

- idempotent replay handling (preferred) keyed on
  `(authoritative tenant, authoritative caller, replay key)`,
  returning the prior receipt for matches; OR
- explicit duplicate-audit-OK semantics documented in
  `loa-dixie`'s own ADR/handoff with replay-cannot-alter-
  authorization tests.

### Concurrency posture (ADR-026D §3.c)

- per-estate serialization (preferred); OR
- enforced single-instance refusal (in code/config, not
  prose).

### Fail-closed catalogue (ADR-026D §4.a–§4.g)

| # | Refusal shape |
|---|---|
| 4.a | Missing or empty `STRAYLIGHT_RUNTIME_DIXIE_KEY` → refuse to start or refuse first request; never default-allow. |
| 4.b | Env-key rotation mid-flight → `outcome: 'denied'` with `runtime_seam:proof_invalid`; re-mint required. |
| 4.c | Spoofed capability (hand-rolled `{ nonce, proof, package_name?, caller_identity? }`) → `outcome: 'denied'` with `runtime_seam:capability_unrecognized`. |
| 4.d | Serialised / cross-process capability → `runtime_seam:capability_unrecognized` in the receiving process. |
| 4.e | Metadata-only caller identity → ignored; refusal does not change verdict. |
| 4.f | Unknown / spoofed environment frame → typed refusal; seam output not overridden. |
| 4.g | Cross-tenant intake (caller A submits body claiming tenant B) → ingress refuses with `cross_tenant_recall_refused`; runtime seam refuses as second line of defense. |

## Required tests in `loa-dixie` before merge (ADR-026D §5)

The Dixie PR MUST include each of the following test classes.
None of these tests live in `loa-straylight`; they live in
`loa-dixie`'s test suite. Each test MUST cite the
`loa-straylight` artifact it exercises (ADR-026C §3.x, ADR-026D
§3.y / §4.z, threat-model T-row).

| # | Test class | Citation anchor |
|---|---|---|
| 5.a | T17 (a)–(d): body-size refusal at and beyond limit; per-tenant rate-limit refusal under sustained load; per-tenant memory-cap refusal at and beyond cap; refusal-behavior tests asserting documented HTTP status + audit emission. | ADR-026D §3.a; threat-model T17. |
| 5.b | T15 replay: either idempotent-receipt-return on duplicate request identity, or duplicate-audit-OK with replay-cannot-alter-authorization invariants. | ADR-026D §3.b; threat-model T15. |
| 5.c | T16 / T18 concurrency: either per-estate serialization (concurrent same-estate writes produce single intact chain) or single-instance refusal (refuses or loudly degrades under multi-instance shape with `InMemoryStorage`). | ADR-026D §3.c; threat-model T16, T18. |
| 5.d | T13 + T14 ingress: tampered HTTP body refused; forged auth refused; replayed transport envelope refused; cross-tenant ingress refused; authoritative tenant overrides caller-supplied tenant. | ADR-026D §3.d; threat-model T13, T14. |
| 5.e | Fail-closed catalogue (§4.a–§4.g) each exercised, asserting documented refusal shape. | ADR-026D §4.a–§4.g. |
| 5.f | ADR-026C §3 obligations 3.1–3.8 each exercised: subpath-only imports; capability mint via public constructor with env key planted; capability passed as fourth argument; no metadata-trust; no cross-process replay; fail-closed handling of `runtime_seam:capability_*`. | ADR-026C §3.1–§3.8. |

## Required pre-merge Flatline + Bridgebuilder

The Dixie PR is a sibling-repo implementation **and** an
endpoint authorization landing. Per ADR-026A0 §"Decision" §5,
the Dixie PR MUST pass:

- a real 3-model Flatline pass (PASS or
  REVISE-with-resolution); AND
- a real Bridgebuilder review.

A REVISE verdict from either MUST be resolved before merge. A
BLOCK verdict halts the PR. Mock-mode passes do **not**
satisfy this requirement; cycle-109 substrate hardening
pinned the cheval substrate as the unconditional dispatch
path.

## What Phase 26D explicitly does NOT do

ADR-026D §"Decision" §7.a–§7.n is the canonical list. Summary:

- No Dixie endpoint other than the one recall-intake
  endpoint/adapter scoped in §2 (Phase 24E S2–S6 + review
  queue + governance timeline + any other Dixie surface
  remain unauthorized).
- No broader Dixie integration (no BFF rebuild, no operator
  console, no Discord / Telegram / NATS / REST surface).
- No Straylight package-surface change (no `package.json` /
  `exports` map / runtime allowlist / subpath edit).
- No new Straylight runtime subpath.
- No edit to the Phase 26B HMAC + closure-private brand
  mechanism, env-key binding, or fail-closed defaults.
- No Finn wiring (ADR-022E gate #9 held).
- No Hounfour adoption (ADR-022E gates #1–#5, #17, #18 held).
- No Freeside wiring (ADR-022E gate #11 held).
- No production storage migration (ADR-022E gate #8 held)
  beyond the per-tenant memory cap and bounded estate-storage
  posture authorized as endpoint guardrail under §3.a (iii).
- No tag, release, package publish, or Hounfour dependency
  bump.
- No broad autonomy / action execution / tool-use surface.
- No Loa framework edit.
- No general Phase 15 reorder. Hounfour → Finn → Dixie →
  Freeside remains the recommended order for all sibling-repo
  work other than this single endpoint slice.
- No successor-ADR pre-approval.

## Validate locally

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
git status --short -- dist dist-types
git diff --stat
git diff --name-only
git status --short
```

Expected:

- `npm run typecheck`: clean.
- `npm test`: passes identically to the post-Phase-26C
  baseline. Phase 26D adds no test, edits no test, and changes
  no source file under [`../../src/`](../../src/); the
  existing Phase 26B and Phase 26C suites continue to pin the
  Straylight-side seam.
- `npm run build`: clean; `dist/` and `dist-types/` are
  byte-identical to the post-Phase-26C baseline.
- `npm pack --dry-run`: shape unchanged from the
  post-Phase-26C tarball; no new file under `dist/` or
  `dist-types/`.
- `git status --short -- dist dist-types`: empty (no committed
  artifact in either tree changes).
- `git diff --stat` shows only the **four** Phase 26D files:
  this handoff (new), ADR-026D (new), the README append, and
  the `cross-repo-implementation-order.md` append.
- `git diff --name-only` matches that four-file set; pre-
  existing local dirt outside the Phase 26D scope remains
  unstaged per the phase brief.

## Cross-references

- ADR-026A — runtime recall-intake subpath authorization
  ([`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)).
- ADR-026A0 — operator-authority Flatline rule
  ([`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)).
- ADR-026C — Dixie recall-intake consumer contract
  ([`../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md`](../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md)).
- ADR-026D — Dixie recall-intake endpoint authorization
  ([`../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md`](../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md))
  (this packet's companion).
- ADR-022E — Phase 22 deferred features (gate #8, #9, #10,
  #11 referenced)
  ([`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)).
- Phase 26A-1 — threat-model amendment for the future Dixie
  recall-intake endpoint
  ([`./phase-26a1-threat-model-dixie-endpoint.md`](./phase-26a1-threat-model-dixie-endpoint.md)).
- Phase 26A-2 — runtime recall-intake subpath authorization
  handoff
  ([`./phase-26a2-runtime-recall-intake-subpath-authorization.md`](./phase-26a2-runtime-recall-intake-subpath-authorization.md)).
- Phase 26B — runtime recall-intake subpath implementation
  (PR #45) and Phase 26B-F runtime packaging hardening
  (PR #46) on `main`.
- Phase 26C — Dixie recall-intake consumer contract handoff
  ([`./phase-26c-dixie-recall-intake-consumer-contract.md`](./phase-26c-dixie-recall-intake-consumer-contract.md)).
- [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md) —
  Phase 12 Dixie BFF / API mapping (consumed as background;
  not edited).
- [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — Phase 15 sibling-repo implementation order (Phase 26D
  appends a narrow cross-reference; no general reorder).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) — Phase
  26A-1 amendment (T13–T18 + T9 persistence-posture
  addition); not edited.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  — runtime-subpath section pinned by Phase 26B; not edited.
