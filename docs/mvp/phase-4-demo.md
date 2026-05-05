# Phase 4 — Recall Wedge demo

> Status: Phase 4 implementation. Local-only. No DB, no onchain anchor, no
> Discord/Freeside/Finn/Dixie/Hounfour integration.

This document explains how to run the local Recall Wedge demo and what the
output proves. The demo is the human-readable counterpart of the Phase 4
acceptance test (`tests/phase-4-demo.test.ts`) and shares its core
implementation with that test through `scripts/demo-recall-wedge.lib.ts`.

## Run it

```bash
npm install
npm run typecheck
npm test
npm run demo:recall
```

`npm run demo:recall` invokes
[`scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts) via
`vite-node` (already a transitive dependency of `vitest`, so no extra install
is required).

## What the demo does

The demo walks the wedge end-to-end against the local
`EstateStore` + `InMemoryStorage` built in Phases 0–3:

| # | Step | Where it lives |
|---|------|----------------|
| 1 | Build a demo `EstateStore` from `fixtures/{actor,estate,keyring}.json` | `runDemo` §1 |
| 2 | Admit a `preference` and `observation` (operator + runtime, public) | §2-4 |
| 3 | Class-validate every candidate (`validators/class-validator.ts`) | §2-4 |
| 4 | Policy-validate every transition (`policy.ts` + `keyring.ts`) | §2-4 |
| 5 | Admit a `reflection` with `linked_assertion_refs` to step 2's items | §5 |
| 6 | Challenge the reflection with `requested_effect: mark_contested` | §6 |
| 7 | Revoke a separate, throwaway `preference` | §7 |
| 8 | Mark a separate, throwaway `observation` `forgotten_from_recall` | §8 |
| 9 | Submit a `RecallRequest` for `environment_frame: public_discord` | §9 |
| 10 | Print the resulting `RecallPack` (bodies redacted to summary form) | §10 |
| 11 | Print the resulting `RecallReceipt` | §11 |
| 12 | Print the `excluded_summary` — every reason a candidate was filtered | §12 |
| 13 | Run an `audit_review` recall to prove revoked + forgotten remain auditable | §13 |
| 14 | Verify the per-estate audit hash chain | §14 |

Where the section anchors point into `scripts/demo-recall-wedge.lib.ts`.

## Reading the output

A clean run prints fourteen `━━━` sections in order. The interesting moments:

- **Step 6 — challenge**: the target assertion's `status` flips to `contested`.
  In a public frame this assertion is **redacted** (its privacy is `tenant`),
  so it never appears as `usable`. In `audit_review` it appears in `marked`
  with `use_instruction: mark_as_contested`. Either way it is **never
  silently promoted to active truth**.
- **Step 7 — revoke**: status flips to `revoked`. Excluded from the public
  pack with reason `status_revoked`. Surfaced in `audit_review` as `marked`
  with `use_instruction: do_not_use_for_action`.
- **Step 8 — forget_from_recall**: status flips to `forgotten_from_recall`.
  Same treatment as revoked — excluded from public, marked in audit.
- **Step 10 — RecallPack**: includes only assertions whose policy disposition
  was `include`. Their `use_instruction` is `usable`. The pack also reports
  `marked`, `redacted`, and `excluded_summary` so a downstream consumer can
  always answer "what did you choose to leave out, and why?".
- **Step 11 — RecallReceipt**: derives its `pack_hash` from the pack and its
  own `receipt_hash` over a stable projection. The receipt is what gets
  persisted to `recall_receipts.jsonl` (or the equivalent table) and is what
  any future commitment layer signs over.
- **Step 12 — exclusion reasons**: the demo prints both `excluded_summary`
  (filtered out entirely) and the redaction summary. Together they account
  for every candidate that did not enter the included set.
- **Step 13 — audit visibility**: the demo prints the audit-event types that
  reference each of the revoked, forgotten, and contested assertions. Both
  the original `assertion_admitted` and the subsequent state-change event
  remain in the chain — proving deletion-by-policy never erases history.
- **Step 14 — audit chain**: walks the per-estate chain via
  `auditLog.verifyChain()` and reports `ok` plus the event count. A non-`ok`
  result would print the broken index and reason.

## What the demo proves vs. what is still missing

Proves (covered by acceptance criteria):

- A signed actor estate can be assembled from local fixtures alone.
- Multiple signed assertions are admitted under class + policy validation.
- One assertion is linked to others via `linked_assertion_refs`.
- A challenge marks a target without erasing it.
- A revoke and a `forget_from_recall` both transition status without
  removing the assertion from the audit log.
- A public-frame recall produces a pack whose `included` items are all
  `usable`, whose excluded items each carry a reason, and whose `marked`
  items never carry `usable`.
- The same estate viewed under `audit_review` surfaces revoked + forgotten +
  contested assertions so an auditor can reconstruct what was suppressed.
- The audit hash chain verifies clean across every transition above.

Deliberately not proved (Phase 4 hard constraints):

- No production DB integration. The demo runs entirely against
  `InMemoryStorage`. Persistence-friendly behavior is covered by the
  pre-existing `JsonlStorage` durability tests.
- No onchain publishing, no public anchor.
- No Discord, Telegram, Freeside, Finn, Dixie, or Hounfour integration —
  `public_discord` is an *environment frame label* that drives recall
  policy, not a chat connector.
- No vector retrieval / generic RAG. Recall does a full estate scan in the
  fixed §11.6 order; the wedge contract is the order, not the retriever.

## Where to go next

- The acceptance test `tests/phase-4-demo.test.ts` is the machine-checkable
  contract. Edit `runDemo()` in `scripts/demo-recall-wedge.lib.ts` and the
  test will fail loudly if the storyline drifts.
- For the full target architecture (which environment frames are recognized,
  how challenge/revoke/forget compose, how recall ordering is fixed), see
  [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §11 (Recall) and §14 (Audit).
