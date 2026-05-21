# ADR-027B-VectorAccess-release-unblocked — Hounfour v8.7.0 release / vector-access unblock evidence (Phase 28D)

## Status

Accepted-for-Phase-28D as a **second-class evidence record under
[ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md)**
(it does **not** create authorization).

ADR-027B-VectorAccess-release-unblocked records, as of Phase 28D,
that the Hounfour-side release / vector-access blocker pinned by
[ADR-027B-VectorAccess-release-gate](./ADR-027B-VectorAccess-release-gate.md)
§"Decision" §3 / §5 has been **resolved by a Hounfour-side
maintainer-driven release event**. Specifically:

1. `loa-hounfour` issue
   [#70 release comment](https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4507326260)
   announces the release.
2. `@0xhoneyjar/loa-hounfour@8.7.0` is published.
3. `loa-hounfour` git tag `v8.7.0` exists.
4. `npm view @0xhoneyjar/loa-hounfour versions
   --registry=https://npm.pkg.github.com` includes `8.7.0` in its
   returned version list.
5. `npm view @0xhoneyjar/loa-hounfour@8.7.0 dist.tarball
   --registry=https://npm.pkg.github.com` resolves to a
   **non-404** tarball URL.
6. The published tarball, when extracted under the standard npm
   install layout (`node_modules/@0xhoneyjar/loa-hounfour/`),
   contains each of the seven recall-wedge composition-substrate
   paths required by ADR-027B-VectorAccess-release-gate §"Decision"
   §5.c (see §2 below).
7. The published tarball SHA-256 is
   `8c116f205e1ae1771c89b5c455cd0dd3a5c62160962bb3c8e9a4ae6bb50d22f7`.

Per [ADR-027B-VectorAccess-release-gate §"Decision" §5](./ADR-027B-VectorAccess-release-gate.md),
this is the **release-evidence-met** disposition for the §"Decision"
§3 BLOCKED state: rows §5.a (tag), §5.b (registry publish), §5.c
(recall-wedge vector corpus inside the tarball), and §5.e
(composition-substrate-only — the release introduces no new
Hounfour-published canonical shape, no new domain `$id`, no new
JS subpath, no new TS public symbol that the ADR-022E gate
inventory would treat as a shape adoption trigger) are satisfied
by the v8.7.0 release. Row §5.d (Hounfour-side release-integrity
/ dist / stub-artifact convention) is **observable from the
tarball-contents probe** insofar as the Phase 28A in-repo audit
([`./ADR-027B-Fire-hounfour-composition-contracts.md`](./ADR-027B-Fire-hounfour-composition-contracts.md)
§"Decision" §5) recorded the Hounfour-side
`npm run check:release-integrity-parity` lane as available; the
Phase 28D evidence record does not redefine Hounfour's release
convention and treats §5.d as satisfied to the extent that
Hounfour applied its normal release convention to the v8.7.0 cut.

Phase 28D resolves **the release / vector-access blocker only**.
It does **not** resolve, waive, or pre-satisfy the §4.d pre-merge
real 3-model Flatline + Bridgebuilder gate that the future
Straylight Track 1 code PR (sketched in
[ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md)
and bounded by §"Decision" §8 of that ADR) inherits under
[ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md).
§4.d remains its own separate, **independently unsatisfied gate
until real 3-model Flatline + Bridgebuilder evidence is run
against the successor Straylight scope/PR**. The local review
substrate has since been smoke-tested as usable (3-model
Flatline live smoke passed; Bridgebuilder 3-provider dry-run
wiring passed); the smoke tests are not themselves §4.d
evidence for any future implementation PR — §4.d is satisfied
only by a real run against the successor's actual scope.

ADR-027B-VectorAccess-release-unblocked is **not authorization-
creating** in the §3 first-class sense:

- It does **not** unblock a downstream code-bearing event by
  itself; it records the **resolution of one of two preconditions**
  (release evidence) that the existing first-class plan
  ([ADR-027B-PrivateAlias-successor-plan](./ADR-027B-PrivateAlias-successor-plan.md))
  already requires. The other precondition — §4.d substrate
  restoration — remains independently unsatisfied.
- It does **not** widen any permitted surface, amend any refusal
  rule from "no" to "yes", or fire any ADR-022E gate.
- It does **not** authorize Straylight code, vendoring, a
  dependency bump, an allowlist change, a runtime subpath
  addition, a public type re-export, a tag, a release, or a
  package publish.

ADR-027B-VectorAccess-release-unblocked **explicitly does not
authorize**:

- any Straylight code change (test, fixture, source, package,
  script, generated tree, public surface, runtime allowlist);
- any vendoring of the five Hounfour `recall-wedge` vector JSON
  files, of `schemas/conformance-vector.schema.json`, or of
  `docs/architecture/recall-wedge-composition.md` into the
  Straylight tree (per ADR-027B-PrivateAlias-successor-plan
  §"Decision" §3 row "Likely files" and §8.b / §8.c, vendoring
  requires a **separate** first-class successor ADR with its
  own §4.d evidence; this proposal does **not** pre-approve
  such an ADR and explicitly does not propose one);
- any consumption of the v8.7.0 vectors / artifacts via a
  `loa-hounfour` `origin/main` working-tree path, a local
  filesystem tarball path, a `git+https://`-style
  `@0xhoneyjar/loa-hounfour` resolution, or any
  non-registry-resolution path. Future consumption is registry-
  resolution only, against `https://npm.pkg.github.com`, and
  only after a separate first-class authorizing event;
- any bump, range widening, range narrowing, or other change to
  the `@0xhoneyjar/loa-hounfour` dependency declared at
  `^8.6.0` and resolved at `8.6.0` in
  [`../../package.json`](../../package.json) and
  [`../../package-lock.json`](../../package-lock.json). The
  next code candidate **may** pin or update the existing
  dependency to `8.7.0` (or confirm a `^8.6.0`-resolves-to-`8.6.0`
  no-delta posture, depending on the actual package state at the
  time of that PR), but that is a **separate implementation PR**
  with its own first-class §4.d gate; Phase 28D does not perform
  it;
- the firing of any ADR-022E gate (#1, #2, #3, #4, #5, #17, #18
  all remain **HELD** — see §4 below);
- any Hounfour shape adoption beyond the composition / vector-
  access evidence recorded here. v8.7.0 ships the recall-wedge
  composition substrate; it does **not**, by being published,
  authorize Straylight to adopt any Hounfour-published canonical
  shape, domain `$id`, JS subpath, or TS public symbol;
- any sibling-repo edit (no `loa-hounfour`, `loa-finn`,
  `loa-dixie`, `loa-freeside`, `loa`, `freeside-characters`
  file is edited);
- any re-open of `loa-dixie` PR #102, any second Dixie endpoint,
  any second runtime subpath, any new public type re-export, or
  any change to [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  or [`../mvp/threat-model.md`](../mvp/threat-model.md);
- any Finn runtime work (gate #9 remains held; Finn is governed
  by [ADR-027C](./ADR-027C-finn-return-gate-readiness.md));
- any Freeside wiring (gate #11 remains held);
- production storage migration (gate #8 remains held);
- a tag, a release, a package publish on the Straylight side, a
  Loa-framework / control-plane / model-substrate edit, or any
  §4.d substitute route.

Per the Phase 28D hard constraints, ADR-027B-VectorAccess-
release-unblocked creates only the four Phase 28D files listed
in §"Decision" §1 and edits no other file. It does not commit,
does not push, does not stage, does not open a PR, does not file
an issue or comment, does not edit any sibling repo, does not
edit [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
or [`../mvp/threat-model.md`](../mvp/threat-model.md), does not
change [`../../package.json`](../../package.json) or
[`../../package-lock.json`](../../package-lock.json), does not
run `npm install`, and does not edit any prior ADR or prior
handoff except the two append-only navigation updates listed in
§"Decision" §1.

## Context

### Why Phase 28D exists

[ADR-027B-VectorAccess-release-gate §"Decision" §3](./ADR-027B-VectorAccess-release-gate.md)
recorded that the future Straylight Track 1 code PR was
**BLOCKED** under
[ADR-027B-PrivateAlias-successor-plan §"Decision" §8.b](./ADR-027B-PrivateAlias-successor-plan.md)
outcome (iii) ("vectors available only via an untagged Hounfour
commit"). Hounfour `origin/main` / `c06ef1ba`, Hounfour PR #116,
and any `package.json`-internal version field on an untagged
commit were not sufficient release evidence.

[ADR-027B-VectorAccess-release-gate §"Decision" §5](./ADR-027B-VectorAccess-release-gate.md)
specified the exact five-row release evidence (§5.a–§5.e) that,
if satisfied, would release the §3 block under
ADR-027B-PrivateAlias-successor-plan §"Decision" §8.b branch (i)
(a published, tagged, resolvable `@0xhoneyjar/loa-hounfour`
release that contains the vectors at a path the published
package's own `exports` map or shipped on-disk layout makes
available, after which the future PR may pin to that **exact
tag** — no range widening; exact tag only).

[`../handoffs/phase-28c-hounfour-release-request.md`](../handoffs/phase-28c-hounfour-release-request.md)
recorded the corresponding paste-ready Hounfour-side release-
request draft. The filing of that draft was a separate
operator-driven event under the operator's discretion posture,
not part of Phase 28C.

A Hounfour-side maintainer-driven release event has now occurred:
`@0xhoneyjar/loa-hounfour@8.7.0` is published, tagged, and
registry-resolvable, and its tarball contains the recall-wedge
composition-substrate corpus. Phase 28D is the **in-repo evidence
record** for that release event, narrowed to the four narrow
questions ADR-027B-VectorAccess-release-gate posed:

1. Does a published, tagged, resolvable
   `@0xhoneyjar/loa-hounfour` release exist that contains the
   five `recall-wedge` conformance-vector JSON files (and the
   associated composition-contract artifacts)? **Yes — v8.7.0.**
2. Is `@0xhoneyjar/loa-hounfour@8.7.0` (or any later version)
   currently resolvable on the GitHub Packages registry the
   Straylight working tree is configured against? **Yes —
   `8.7.0`.**
3. Is the future Track 1 code PR currently **blocked** or
   **unblocked**? **Release / vector-access precondition met;
   §4.d remains independently unsatisfied.**
4. What exact release evidence would unblock it? **Recorded by
   the gate ADR §5.a–§5.e; §5.a / §5.b / §5.c / §5.e are now
   satisfied by v8.7.0; §5.d is satisfied to the extent
   Hounfour applied its normal release convention.**

Phase 28D does not propose Track 1 code, does not perform a
dependency bump, and does not open the next implementation PR.
It records the **resolution of one precondition** and authorizes
the drafting (a future, separate, docs-only event) of the next
first-class code-candidate plan/PR scope, with the understanding
that the successor must still satisfy its own §4.d evidence
before any code is authorized.

### What is *not* authority

Pinned per
[ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md),
[ADR-027A §"Context" → "What is *not* authority"](./ADR-027A-post-dixie-return-gate.md),
[ADR-027B-Fire §"Context" → "What is *not* authority"](./ADR-027B-Fire-hounfour-composition-contracts.md),
[ADR-027B-PrivateAlias-successor-plan §"Context" → "What is *not* authority"](./ADR-027B-PrivateAlias-successor-plan.md),
and [ADR-027B-VectorAccess-release-gate §"Context" → "What is *not* authority"](./ADR-027B-VectorAccess-release-gate.md):

- The presence of `@0xhoneyjar/loa-hounfour@8.7.0` on the
  registry, the existence of the `loa-hounfour` `v8.7.0` git
  tag, the contents of the published tarball, the SHA-256 of
  the tarball, and the issue #70 release comment are **release
  evidence** that resolves the §3 BLOCKED disposition of
  ADR-027B-VectorAccess-release-gate. They are **not** authority
  for Straylight code, dependency bumps, vendoring, allowlist
  changes, runtime subpath additions, public-surface re-exports,
  or shape adoption. Authority for any of those requires a
  separate first-class successor ADR with its own §4.d evidence.
- The fact that the v8.7.0 tarball contains five recall-wedge
  conformance-vector JSON files, a recall-wedge `README.md`, and
  the `schemas/conformance-vector.schema.json` envelope **is
  composition-substrate evidence**. It is **not** evidence that
  the wedge has adopted, or is authorized to adopt, any
  Hounfour-published canonical shape (no new domain `$id`, no
  new JS subpath, no new TS public symbol). The class-vs-policy
  boundary recorded by Phase 28A
  ([ADR-027B-Fire §"Decision" §3](./ADR-027B-Fire-hounfour-composition-contracts.md))
  remains intact: **Hounfour provides class / schema /
  conformance-vector artifacts; Straylight still owns policy,
  signer competence, signature verification, audit-chain
  execution, estate transitions, recall runtime, and
  authorization.**
- Codex output, ChatGPT advisory output, headless generative
  review, prior Flatline multi-model verdicts on unrelated
  phases, prior Bridgebuilder reviews on unrelated phases,
  Cheval delegation outputs, persisted agent memory
  (`auto-memory`, `observations.jsonl`, framework `.run/` /
  `.claude/` / `.beads/` / `grimoires/`), vector-store retrieval,
  and long-context window dumps are **audit evidence**, not
  authority.
- The historical Loa-side substrate-degradation record (Phase
  26F §7.1) does not weaken or pre-satisfy §4.d for the future
  Track 1 code PR, and neither do the local review-substrate
  smoke-test results (3-model Flatline live smoke passed;
  Bridgebuilder 3-provider dry-run wiring passed). Phase 28D
  records its evidence-record nature explicitly so neither
  substrate-degradation history nor smoke-test usability can
  be invoked to convert this ADR into an authorization-creating
  doc; §4.d is satisfied only by a real run against the
  successor's actual scope.
- The published tarball SHA-256
  (`8c116f205e1ae1771c89b5c455cd0dd3a5c62160962bb3c8e9a4ae6bb50d22f7`)
  is recorded as evidence of the **observed tarball identity at
  the time of Phase 28D evidence collection**. Any future
  Straylight Track 1 implementation PR that pins
  `@0xhoneyjar/loa-hounfour@8.7.0` MUST verify the
  registry-resolved tarball hash at the time of that PR's
  install-and-pin step; if the hash diverges, the divergence is
  itself a §4.d audit input, not a Phase 28D authorization
  failure.

## Decision

### 1. File set

ADR-027B-VectorAccess-release-unblocked establishes only:

- **New:** this ADR.
- **New:** [`../handoffs/phase-28d-hounfour-v870-release-evidence.md`](../handoffs/phase-28d-hounfour-v870-release-evidence.md)
  — the operator-oriented Phase 28D evidence handoff (concise;
  no draft to file, no separate sibling-repo paste-ready text).
- **Append-only:** [`../handoffs/README.md`](../handoffs/README.md)
  — a Phase 28D index entry, in chronological order, after the
  Phase 28C entry.
- **Append-only:** [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — a narrow Phase 28D navigation pointer appended after the
  Phase 28C release/vector-access gate pointer.

ADR-027B-VectorAccess-release-unblocked touches no other file.
No prior ADR is edited. No prior handoff is edited except the
two append-only updates above. No
[`../../package.json`](../../package.json) or
[`../../package-lock.json`](../../package-lock.json) edit is
performed; no `npm install` is run; no source / runtime / test
/ fixture / script / config / generated / workflow / `.claude/`
/ `.loa/` / `.run/` / grimoire file is edited.

### 2. Release-evidence inventory (as of Phase 28D)

The following evidence was collected against the
ADR-027B-VectorAccess-release-gate §"Decision" §5.a–§5.e
release-evidence requirements. Each row records the source,
the result, and the disposition.

| # | Source / probe | Result | Disposition |
|---|---|---|---|
| 2.a | `loa-hounfour` issue #70 release comment | <https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4507326260> announces the v8.7.0 release. | The Hounfour-side maintainer-driven release event has occurred and is publicly recorded on issue #70. |
| 2.b | `loa-hounfour` git tag `v8.7.0` | The tag exists in the `loa-hounfour` repository. | **§5.a satisfied** (tag). |
| 2.c | `npm view @0xhoneyjar/loa-hounfour versions --registry=https://npm.pkg.github.com` | Returns a list that **includes `8.7.0`** (i.e., the prior list `8.4.0 / 8.5.0 / 8.5.1 / 8.5.2 / 8.6.0` plus the new `8.7.0` entry). | **§5.b satisfied (registry publish, versions probe).** `8.7.0` is registry-resolvable. |
| 2.d | `npm view @0xhoneyjar/loa-hounfour@8.7.0 dist.tarball --registry=https://npm.pkg.github.com` | Returns a **non-404 tarball URL**. | **§5.b satisfied (registry publish, tarball-URL probe).** An `npm install` against `@0xhoneyjar/loa-hounfour@8.7.0` would resolve. |
| 2.e | Published tarball contents (extracted under standard npm install layout `node_modules/@0xhoneyjar/loa-hounfour/`) | Contains all of: `package/vectors/conformance/recall-wedge/assertion-admitted.json`, `package/vectors/conformance/recall-wedge/commitment-root.json`, `package/vectors/conformance/recall-wedge/recall-pack.json`, `package/vectors/conformance/recall-wedge/recall-receipt.json`, `package/vectors/conformance/recall-wedge/recall-request.json`, `package/vectors/conformance/recall-wedge/README.md`, `package/schemas/conformance-vector.schema.json`. | **§5.c satisfied (recall-wedge vector corpus inside the tarball).** All seven required composition-substrate paths are present. The five `recall-wedge` conformance-vector JSON files, the `README.md`, and the `conformance-vector.schema.json` envelope are accessible from a tagged, registry-resolvable package. |
| 2.f | Published tarball SHA-256 | `8c116f205e1ae1771c89b5c455cd0dd3a5c62160962bb3c8e9a4ae6bb50d22f7`. | Recorded as the **observed tarball identity at Phase 28D evidence-collection time**. Any future Track 1 implementation PR that pins to v8.7.0 must verify the registry-resolved tarball hash at that PR's install-and-pin step (cf. §"Context" → "What is *not* authority" final bullet). |
| 2.g | Composition-substrate-only invariant (per ADR-027B-VectorAccess-release-gate §5.e) | The v8.7.0 release introduces no new Hounfour-published canonical shape, no new domain `$id`, no new JS subpath, and no new TS public symbol that the ADR-022E gate inventory would treat as a shape adoption trigger relative to the post-v8.6.0 baseline. | **§5.e satisfied.** The release is composition-substrate-only. ADR-022E gates #1, #2, #3, #4, #5, #17, #18 are not triggered by the release itself. |
| 2.h | Hounfour-side release-integrity / dist / stub artifact convention (per ADR-027B-VectorAccess-release-gate §5.d) | Hounfour's release convention (e.g., `npm run check:release-integrity-parity`, recorded by ADR-027B-Fire §"Decision" §5) was applied to the v8.7.0 cut to the extent the Hounfour-side maintainer's release process applied it. Phase 28D does not redefine Hounfour's release convention; it records that the published tarball is well-formed under the standard npm install layout and that the v8.7.0 release was filed on issue #70 in the normal Hounfour way. | **§5.d satisfied to the extent Hounfour applied its normal release convention.** Any future Track 1 implementation PR may further verify Hounfour-side release-integrity artifacts as a §4.d audit input; Phase 28D does not perform that audit. |

**Net evidence state**: the recall-wedge composition-substrate
corpus (the five conformance vectors, the recall-wedge `README.md`,
and the `conformance-vector.schema.json` envelope) is **available
from a published, tagged, registry-resolvable
`@0xhoneyjar/loa-hounfour@8.7.0` release**. The §3 BLOCKED
disposition of ADR-027B-VectorAccess-release-gate flips to
**release-evidence-met**.

### 3. Block / unblock disposition

Per [ADR-027B-VectorAccess-release-gate §"Decision" §3](./ADR-027B-VectorAccess-release-gate.md)
and [ADR-027B-PrivateAlias-successor-plan §"Decision" §8.b / §8.c / §10.a](./ADR-027B-PrivateAlias-successor-plan.md):

- The **release / vector-access precondition** for the future
  Straylight Track 1 code PR (ADR-027B-PrivateAlias-successor-plan
  §"Decision" §3) is now **MET** under §8.b branch (i). The
  vectors are no longer "available only via an untagged Hounfour
  commit"; they are accessible from a tagged, registry-resolvable
  package.
- The §3 BLOCKED disposition of
  [ADR-027B-VectorAccess-release-gate](./ADR-027B-VectorAccess-release-gate.md)
  flips to **release-evidence-met**. Reviewers of any future
  Track 1 implementation PR may cite §"Decision" §2 / §3 of this
  ADR as the in-repo evidence record that release branch (i)
  has been satisfied.
- Branch (ii) (vendoring) **remains a separate first-class event**
  with its own §4.d evidence and is **not** authorized by Phase
  28D. The next code candidate is **registry-resolution only**
  against `https://npm.pkg.github.com`, not vendoring, not
  Hounfour-`origin/main`-as-resolution-path, not local-tarball-
  as-resolution-path.
- The future Track 1 code PR's **§4.d pre-merge real 3-model
  Flatline + Bridgebuilder gate remains independently
  unsatisfied until real 3-model Flatline + Bridgebuilder
  evidence is run against the successor Straylight scope/PR**
  (per ADR-027A §"Decision" §4.d, ADR-027B §"Decision" §2 §4.d
  row, ADR-027B-Fire §"Decision" §3 §4.d row,
  ADR-027B-PrivateAlias-successor-plan §"Decision" §6, and
  ADR-027B-VectorAccess-release-gate §"Decision" §3 final
  bullet). The local review substrate has since been
  smoke-tested as usable — 3-model Flatline live smoke passed
  and Bridgebuilder 3-provider dry-run wiring passed — so the
  machinery itself is no longer the blocker; what remains
  unsatisfied is the **real run against the successor's actual
  scope**. The smoke tests do **not** satisfy §4.d for any
  future implementation PR. The release evidence likewise does
  **not** waive, weaken, or pre-satisfy §4.d.
- The future Track 1 code PR therefore remains **not yet
  authorized**. Two preconditions exist; one is now met; the
  other (§4.d) is independently unmet. Both must be true before
  any Straylight code change is authorized.
- Phase 28D **may** authorize the drafting of the next
  first-class code-candidate plan/PR scope (a separate, future,
  docs-only event), but only on the explicit understanding that
  the successor — like every prior first-class proposal in this
  series — must satisfy its own §4.d evidence before code is
  authorized. Phase 28D does **not** perform that drafting; it
  authorizes only the *option* of doing so as a separate future
  event.

### 4. ADR-022E gate impact

ADR-027B-VectorAccess-release-unblocked fires **no ADR-022E
gates**. Per-gate analysis:

| Gate | Trigger conjunction (verbatim spirit, per ADR-022E) | Phase 28D release evidence | Disposition |
|---|---|---|---|
| **#1** | Published canonical `estate-transition.schema.json` shape **and** a separate ADR adopting it. | The v8.7.0 tarball ships no `estate-transition.schema.json`; Phase 28D adopts no shape. | **HELD.** |
| **#2** | Local `EstateTransition` type / schema / fixture, gated on #1 or its own ADR. | None authorized; this ADR is docs-only. | **HELD.** |
| **#3** | Hounfour ships a declared `./canonicalize` (or `./utilities`) JS subpath. | The v8.7.0 release introduces no new JS subpath relative to the post-v8.6.0 baseline. | **HELD.** |
| **#4** | A separate ADR adopting `Challenge` into the wedge public surface. | Phase 28D authorizes no public re-export. | **HELD.** |
| **#5** | A separate ADR adopting `AuditEvent` from a Hounfour candidate. | None authorized. | **HELD.** |
| **#17** | Documented Straylight need + separate ADR + future implementation phase explicitly citing the authorization for any of the eleven Hounfour subpaths. | Phase 28D consumes nothing; the existing Phase 17B `@0xhoneyjar/loa-hounfour/core` consumption is unchanged. The next code candidate may pin / update the existing dependency declaration to `8.7.0` only as a separate implementation PR with its own first-class §4.d gate; Phase 28D does not perform it. | **HELD.** |
| **#18** | A separate ADR adopting any Hounfour-named symbol into the wedge public surface. | Phase 28D authorizes no public re-export. | **HELD.** |

The §4.a substrate disposition narrowed by ADR-027B-Fire
(`READY-AS-COMPOSITION-SUBSTRATE; PENDING-AS-SHAPE-ADOPTION`)
is **not further narrowed** by Phase 28D's shape-adoption half.
Phase 28D narrows only the **release-accessibility** dimension
of the composition-substrate half: the substrate is now
**resolvable from the registry** rather than from `origin/main`.
Track 1 specifically does not require the
`PENDING-AS-SHAPE-ADOPTION` half to flip; it requires only that
the composition substrate be resolvable, which is now the case.

### 5. Class-vs-policy boundary preservation

Phase 28D explicitly preserves the class-vs-policy boundary
recorded by Phase 28A
([ADR-027B-Fire §"Decision" §3](./ADR-027B-Fire-hounfour-composition-contracts.md))
and reaffirmed by every successor in the 27/28 series:

- **Hounfour provides** class / schema / conformance-vector
  artifacts. The v8.7.0 release ships the recall-wedge
  conformance-vector corpus, the recall-wedge `README.md`, and
  the `schemas/conformance-vector.schema.json` envelope. These
  are class artifacts: shapes for inputs, taxonomy slots inside
  Hounfour's existing conformance-vector machinery, and an
  envelope schema for the conformance vectors themselves.
- **Straylight still owns**: policy (which assertions are
  admitted, which keyrings are valid, which signers are
  competent for which estates), signer competence (which key
  bound to which actor under which transition), signature
  verification (the actual cryptographic check, not the *shape*
  of the signature envelope), audit-chain execution (the
  ordering and hashing of audit events into a chain, including
  the soft-audit-prefix policy on the `0xhoneyjar:straylight:`
  namespace), estate transitions (the runtime decision that an
  estate moves between states), recall runtime (the
  request-to-pack, pack-to-receipt, receipt-to-commitment
  pipeline as a runtime, not as a fixture), and authorization
  (every refusal rule, every gate disposition, every "no" in
  the policy plane).
- The v8.7.0 release **does not** transfer any policy /
  competence / verification / execution / authorization
  primitive across the Hounfour → Straylight boundary by being
  published. The recall-wedge conformance vectors are **test
  inputs**, not production fixtures, not signed artifacts, not
  hash-verified at install time, and not runtime authorities.
- A future Straylight Track 1 PR that consumes the v8.7.0
  vectors as Vitest test inputs would consume them as **test
  inputs only**, behind the wedge's existing public-surface
  import boundaries. That PR would not (and could not under
  Phase 28D evidence) transfer ownership of any policy plane
  primitive to Hounfour.

Reviewers may cite this section verbatim to refuse a future
Straylight Track 1 PR that treats the v8.7.0 release as a
license to migrate any policy / competence / verification /
execution / authorization primitive to Hounfour, or that treats
the v8.7.0 vectors as production fixtures rather than test
inputs.

### 6. Authorized-by-Phase-28D successor scope

Phase 28D **may** authorize, as a separate future event under
its own first-class §4.d gate, the **drafting of the next
first-class code-candidate plan/PR scope for Track 1**. The
authorized successor is bounded as follows:

- **6.a — Successor type.** A first-class plan/PR scope under
  [ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md).
  It must be authored as a docs-only successor (an ADR plus a
  handoff packet), not as a code PR. The actual implementation
  PR is the **second** future event after the successor plan
  itself merges under its own §4.d gate.
- **6.b — Track scope.** Track 1 only — i.e., conformance-vector
  consumption as Vitest test inputs and/or
  `0xhoneyjar:straylight:` soft-audit-prefix consumption as a
  string constant, per
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md).
  Track 2 (soft-audit-prefix-only) and Track 3 (private-alias
  *shape* adoption) are **not** authorized by Phase 28D's §6
  successor scope; they remain governed by their own future
  first-class proposals.
- **6.c — Dependency posture in the implementation PR.** The
  successor plan/PR scope **may** propose, for the eventual
  implementation PR, that the existing `@0xhoneyjar/loa-hounfour`
  dependency be pinned or updated to `8.7.0` (or whatever exact
  registry-resolvable version the implementation PR's
  installation step actually resolves at that time), or that
  the manifest delta / no-delta posture be confirmed against
  the actual package state at the time of the implementation
  PR. **No range widening is permitted** (per
  ADR-027B-PrivateAlias-successor-plan §"Decision" §8.d): if
  the implementation PR pins to a tag, it pins to **exactly
  that tag**, not to a range that includes future v8.7.x or
  v8.x patches. Phase 28D itself does **not** perform any
  manifest edit; the dependency-posture change, if any, is
  inside the **implementation PR**, which is itself a future
  separate event under its own §4.d gate.
- **6.d — Resolution path.** Registry-resolution only, against
  `https://npm.pkg.github.com`. The successor plan/PR scope
  **may not** propose a `loa-hounfour`-`origin/main` resolution
  path, a local-tarball / `file:` path, a `git+https://`-style
  Hounfour resolution, or any non-registry resolution. Vendoring
  is also **not** authorized by Phase 28D's §6 successor scope.
- **6.e — No new ADR-022E gate firings under cover of §6.** The
  successor plan/PR scope **may not** fire ADR-022E gates #1,
  #2, #3, #4, #5, #17, or #18 under cover of Phase 28D. Each
  remains governed by its own first-class proposal with its
  own §4.d evidence. (#17 is, in particular, **not** fired by
  pinning the existing `@0xhoneyjar/loa-hounfour/core`
  consumption to `8.7.0`; the existing Phase 17B subpath
  authorization is for the existing JS subpath posture, not
  for any new subpath.)
- **6.f — §4.d remains the successor's own gate.** The successor
  plan/PR scope **must satisfy its own §4.d pre-merge real
  3-model Flatline + Bridgebuilder review** before it is
  accepted as a first-class doc, exactly as
  ADR-027B-PrivateAlias-successor-plan §"Decision" §6 already
  requires for its own merger. Phase 28D's resolution of the
  release / vector-access precondition is **necessary, not
  sufficient**.
- **6.g — No second-class doc may substitute.** A second-class
  evidence record (this ADR's class) **cannot** substitute for
  the successor's first-class §4.d evidence. Reviewers may cite
  this row verbatim to refuse a successor that tries to claim
  Phase 28D's release evidence as standalone §4.d evidence.

If §6.a–§6.g are all satisfied by a future first-class successor
plan/PR scope under its own §4.d gate, the corresponding Track 1
**implementation PR** becomes the next first-class code-bearing
event (and inherits §4.d on its own under
[ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md)).

### 7. What is explicitly forbidden

Reviewers may cite this section verbatim to refuse an in-repo or
sibling-repo PR that exceeds Phase 28D's scope:

- **7.a** — No claim that ADR-027B-VectorAccess-release-unblocked
  authorizes Straylight code, vendoring, a dependency bump,
  any ADR-022E gate firing, an allowlist change, a runtime
  subpath addition, a public type re-export, or a tag /
  release / publish on the Straylight side.
- **7.b** — No claim that ADR-027B-VectorAccess-release-unblocked
  satisfies, waives, or pre-satisfies §4.d for the future
  Track 1 successor plan/PR or for the future Track 1
  implementation PR.
- **7.c** — No re-open of `loa-dixie` PR #102 and no Phase
  26E re-implementation in `loa-straylight` under cover of
  Phase 28D.
- **7.d** — No edit to [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  or [`../mvp/threat-model.md`](../mvp/threat-model.md) under
  cover of Phase 28D.
- **7.e** — No edit to [`../../package.json`](../../package.json)
  or [`../../package-lock.json`](../../package-lock.json) under
  cover of Phase 28D, and no `npm install` / `npm update` under
  cover of Phase 28D.
- **7.f** — No vendoring of the v8.7.0 `recall-wedge` vector
  JSON files, of `schemas/conformance-vector.schema.json`, or
  of `docs/architecture/recall-wedge-composition.md` (whether
  shipped in the v8.7.0 tarball or fetched separately) into
  the Straylight tree under cover of Phase 28D. Vendoring
  remains a separate first-class successor with its own §4.d
  evidence; Phase 28D does **not** pre-approve such an ADR.
- **7.g** — No `loa-hounfour`-`origin/main` resolution, no
  local-tarball / `file:` resolution, no `git+https://`-style
  Hounfour resolution under cover of Phase 28D. Future
  consumption is **registry-resolution only**, against
  `https://npm.pkg.github.com`.
- **7.h** — No claim that Codex audit output, ChatGPT output,
  or any model finding is authorization for any of the above.
  Per ADR-026A0 §"Decision" §6.Forbidden, model output is
  audit evidence, not authority.
- **7.i** — No claim that any historical Loa control-plane
  substrate-degradation record, or any local review-substrate
  smoke-test result (Flatline live smoke, Bridgebuilder
  dry-run wiring, or any later equivalent), waives, weakens,
  shortens, or pre-satisfies §4.d for the future Track 1
  successor plan/PR or implementation PR. §4.d is satisfied
  only by a real 3-model Flatline + Bridgebuilder run against
  the successor's actual scope.
- **7.j** — No Hounfour shape adoption beyond composition /
  vector-access evidence under cover of Phase 28D. The v8.7.0
  release is composition-substrate-only by §"Decision" §2 row
  2.g; ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  HELD.
- **7.k** — No Track 2 (soft-audit-prefix-only) consumption,
  no Track 3 (private-alias *shape* adoption), no Finn runtime
  adoption, no Freeside wiring, no production storage
  migration, no signature verification, no policy execution,
  no audit-chain enforcement, no storage adapter, and no
  recall execution change under cover of Phase 28D.
- **7.l** — No claim that the recorded tarball SHA-256
  (`8c116f205e1ae1771c89b5c455cd0dd3a5c62160962bb3c8e9a4ae6bb50d22f7`)
  is itself a hash-verification primitive that the wedge's
  signature-verification or audit-chain machinery may pin
  against. The hash is **evidence of observed tarball identity
  at Phase 28D evidence-collection time**; it is not a runtime
  authority and does not transfer hash-verification ownership
  to Hounfour.

### 8. Rollback

ADR-027B-VectorAccess-release-unblocked is docs-only and adds
no runtime / test / fixture / script / package change. Rollback
is the inverse-docs-only operation: delete this ADR; delete
[`../handoffs/phase-28d-hounfour-v870-release-evidence.md`](../handoffs/phase-28d-hounfour-v870-release-evidence.md);
revert the two Phase 28D append-only sections in
[`../handoffs/README.md`](../handoffs/README.md) and
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md).
Rollback restores the post-Phase-28C baseline. Rollback does
**not** re-impose the §3 BLOCKED disposition on the future
Track 1 code PR (the underlying release event on the Hounfour
side is independently observable on the registry and on issue
#70 regardless of whether the in-repo evidence record exists);
it only removes the in-repo evidence record. Rollback does
**not** re-open `loa-dixie` PR #102, does **not** re-fire any
ADR-022E gate (none were fired), does **not** alter the
ADR-027B-PrivateAlias-successor-plan §"Decision" §3 future-PR
shape, and does **not** authorize any sibling-repo edit.

If, after Phase 28D, a Hounfour-side re-publish or yank event
changes the v8.7.0 registry posture (e.g., a re-tag, a yank,
a re-publish under a different SHA-256), that is itself a
separate evidence event whose handling is governed by the
successor plan/PR scope authorized in §6, not by Phase 28D
rollback. Phase 28D rollback is the inverse of the in-repo
docs operation only; it is not a runtime undo of the Hounfour
release.

## Consequences

- The release / vector-access precondition recorded by
  [ADR-027B-VectorAccess-release-gate §"Decision" §3 / §5](./ADR-027B-VectorAccess-release-gate.md)
  is now **MET**. Reviewers may cite §"Decision" §2 / §3 of
  this ADR as the in-repo evidence record.
- The future Track 1 code PR's release-/tag-blocker disposition
  flips from **BLOCKED** under §8.b outcome (iii) to
  **release-evidence-met** under §8.b branch (i).
- The §4.d pre-merge real 3-model Flatline + Bridgebuilder gate
  for the future Track 1 successor plan/PR and for the future
  Track 1 implementation PR remains **independently
  unsatisfied**. Two preconditions exist; one is now met; the
  other (§4.d) is independently unmet. Both must be true before
  any Straylight code change is authorized.
- ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  **HELD**. Phase 28D fires none of them. The class-vs-policy
  boundary is preserved.
- No Straylight code is authorized. No Hounfour dependency
  change is authorized by Phase 28D itself; the successor
  plan/PR scope authorized by §6 may propose a dependency
  pin/update to `8.7.0` (or confirm a no-delta posture)
  inside a **separate implementation PR** with its own §4.d
  gate. No vendoring is authorized. No public surface, runtime
  allowlist, threat model, or package boundary edit is
  authorized. No `loa-hounfour`-`origin/main`, local-tarball,
  or `git+https://`-style resolution path is authorized.
- The Hounfour-side maintainer-driven release event recorded
  by [issue #70 release comment](https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4507326260)
  is the resolution of the
  [ADR-027B-VectorAccess-release-gate](./ADR-027B-VectorAccess-release-gate.md)
  release-request. The Phase 28C draft handoff
  ([`../handoffs/phase-28c-hounfour-release-request.md`](../handoffs/phase-28c-hounfour-release-request.md))
  is now historically anchored as the request whose answer is
  the v8.7.0 release.

## Validation

ADR-027B-VectorAccess-release-unblocked adds no source / test /
fixture / script / package change; the working-tree surface is
the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 28D working set
```

Expected:

- `git diff --name-only` lists exactly the two **modified**
  tracked files: `docs/handoffs/README.md` and
  `docs/handoffs/cross-repo-implementation-order.md`.
- `git ls-files --others --exclude-standard` lists exactly the
  two **untracked** new files: this ADR and
  `docs/handoffs/phase-28d-hounfour-v870-release-evidence.md`.
- `git status --short --untracked-files=all` lists all four
  Phase 28D files (two `M`, two `??`), plus any pre-existing
  local dirt outside the Phase 28D scope (which remains
  unstaged per the phase brief).

`npm run typecheck`, `npm test`, `npm run build`, and
`npm pack --dry-run` remain identical to the post-Phase-28C
baseline by construction. No `npm install` is run by Phase 28D;
the resolved `@0xhoneyjar/loa-hounfour@8.6.0` posture in
[`../../package-lock.json`](../../package-lock.json) is
unchanged.

## Source files inspected

- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
  (gate inventory; per-gate trigger columns).
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
  (operator authority + Flatline rule; first-class vs second-
  class doc classes; §3 / §5 pre-merge requirement; §6.Forbidden
  not-authority list).
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (runtime allowlist + subpath authorization; allowlist set
  pinned by §"Decision" §3).
- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
  (canonical return-gate criteria §4.a–§4.e; release-evidence
  posture; refusal rules).
- [`./ADR-027B-hounfour-return-gate-readiness.md`](./ADR-027B-hounfour-return-gate-readiness.md)
  (canonical readiness inventory; §2 §4.a–§4.e rows narrowed by
  Phase 28A).
- [`./ADR-027B-Fire-hounfour-composition-contracts.md`](./ADR-027B-Fire-hounfour-composition-contracts.md)
  (Phase 28A composition-contract evidence lock; §"Decision" §2
  artifact list; Hounfour PR #116 / origin/main `c06ef1ba` HEAD
  pin; §"Decision" §3 class-vs-policy boundary; §"Decision" §5
  read-only audit results).
- [`./ADR-027B-PrivateAlias-successor-plan.md`](./ADR-027B-PrivateAlias-successor-plan.md)
  (Phase 28B successor plan; §"Decision" §3 future-PR shape;
  §"Decision" §6 successor's own §4.d gate; §"Decision" §8
  dependency posture / release-/tag-blocker rules; §"Decision"
  §10.a vector-accessibility audit).
- [`./ADR-027B-VectorAccess-release-gate.md`](./ADR-027B-VectorAccess-release-gate.md)
  (Phase 28C release / vector-access gate; §"Decision" §3 BLOCKED
  disposition; §"Decision" §5.a–§5.e exact required release
  evidence; §"Decision" §6 forbidden list).
- [`./ADR-027C-finn-return-gate-readiness.md`](./ADR-027C-finn-return-gate-readiness.md)
  (Finn-side readiness; unaffected by Phase 28D).
- [`../handoffs/phase-28c-hounfour-release-request.md`](../handoffs/phase-28c-hounfour-release-request.md)
  (the Phase 28C draft release-request; the Hounfour-side answer
  is the v8.7.0 release).
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md),
  [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md),
  [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
  (sibling-repo coordination; long-term order unchanged by
  Phase 28D).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) — read-only
  at decision time; not edited.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) —
  read-only at decision time; not edited.
- [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json) —
  `@0xhoneyjar/loa-hounfour` declared `^8.6.0`, resolved
  `8.6.0`; **unchanged** by Phase 28D. Any change is the
  successor plan/PR scope's implementation PR, not Phase 28D.
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  (Phase 26F §7.1 substrate-degradation record; reason §4.d
  for the future Track 1 successor plan/PR and implementation
  PR remains independently unsatisfied).
- External: [`loa-hounfour` issue #70 release comment](https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4507326260)
  — Hounfour-side release announcement for v8.7.0; the
  maintainer-driven event that resolves the §3 BLOCKED
  disposition recorded by ADR-027B-VectorAccess-release-gate.
