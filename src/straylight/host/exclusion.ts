// Phase 24C — Surface 3: Excluded-assertion reason display.
//
// Per docs/specs/dixie-recall-host-mvp-contract.md §Surface 3. The host
// renders the wedge's `excluded_summary[]` (aggregate counts) and
// `redacted[]` walks, plus the per-assertion `marked[]` items. Reasons
// are CLASSIFIED into the six-receipt-category enum from ADR-020D §6
// (verbatim raw reason preserved as `raw_reason` for trace).
//
// The wedge's `excluded_summary[]` and `redacted[]` are aggregate
// `{ reason, count }` entries (see src/straylight/types.ts:449 and the
// recall pipeline in src/straylight/recall.ts:106-121). Per-assertion
// granularity is only available on `marked[]`. This shape mirrors
// reality; see docs/handoffs/phase-24c-dixie-recall-host-scaffold.md
// for the documented deviation from the spec's per-assertion shape on
// excluded/redacted aggregates.

import type {
  ExclusionAggregate,
  ExclusionDisplayRequest,
  ExclusionDisplayResponse,
  ExclusionReason,
  MarkedItemDisplay,
  RedactionAggregate,
} from './types.js';
import type { AssertionStatus } from '../types.js';

export function handleExclusionDisplay(
  req: ExclusionDisplayRequest,
): ExclusionDisplayResponse {
  const excluded_aggregates: ExclusionAggregate[] = req.pack.excluded_summary.map((e) => ({
    category: classifyExclusionReason(e.reason),
    raw_reason: e.reason,
    count: e.count,
  }));
  const redacted_aggregates: RedactionAggregate[] = req.pack.redacted.map((r) => ({
    category: 'redacted',
    raw_reason: r.reason,
    count: r.count,
  }));
  const marked: MarkedItemDisplay[] = req.pack.marked.map((m) => ({
    assertion_id: m.assertion_id,
    assertion_class: m.assertion_class,
    status: m.status,
    category: classifyMarkedStatus(m.status),
    raw_reason: `marked:${m.use_instruction}:status_${m.status}`,
  }));
  return { excluded_aggregates, redacted_aggregates, marked };
}

/**
 * Maps a wedge `excluded_summary[].reason` into the six-receipt-category
 * enum. Wedge reason strings are emitted by `dispositionFor` in
 * src/straylight/policy.ts:187 (status_*, class_*, privacy_*,
 * provenance_*) plus `max_items_truncation:*` from the recall pipeline.
 *
 * Order matters: more specific prefixes match first.
 */
function classifyExclusionReason(reason: string): ExclusionReason {
  // Status-derived exclusions.
  if (reason.startsWith('status_revoked')) return 'revoked';
  if (reason.startsWith('status_contested')) return 'challenged';
  if (
    reason.startsWith('status_forgotten_from_recall') ||
    reason.startsWith('status_sealed') ||
    reason.startsWith('status_demoted') ||
    reason.startsWith('status_superseded') ||
    reason.startsWith('status_unhandled') ||
    reason.startsWith('status_')
  ) {
    return 'excluded';
  }
  // Class-filter exclusions.
  if (reason.startsWith('class_not_requested:') || reason.startsWith('class_excluded:')) {
    return 'excluded';
  }
  // Privacy-derived exclusions. Note: wedge's privacy redactions appear in
  // pack.redacted (not pack.excluded_summary), but a few privacy exclusions
  // do land here (e.g. privacy_actor_private_in_public_frame).
  if (reason.startsWith('privacy_')) return 'excluded';
  // Risk / provenance exclusions.
  if (reason.startsWith('provenance_')) return 'excluded';
  // Truncation exclusions.
  if (reason.startsWith('max_items_truncation')) return 'excluded';
  // Unknown wedge reason — fall back to the safe default (still excluded
  // from the pack, even if the host can't name the category precisely).
  return 'excluded';
}

function classifyMarkedStatus(status: AssertionStatus): ExclusionReason {
  if (status === 'contested') return 'challenged';
  if (status === 'revoked') return 'revoked';
  if (status === 'forgotten_from_recall') return 'excluded';
  if (status === 'sealed') return 'excluded';
  if (status === 'demoted') return 'excluded';
  if (status === 'superseded') return 'excluded';
  return 'excluded';
}
