// Phase 9 — Hounfour handoff packet summary printer.
//
// Usage:
//   npm run hounfour:handoff
//
// Prints the paths of the three Phase 9 handoff documents under
// docs/handoffs/, plus the Phase 6 schema-candidate fixture count
// and the Phase 8 Hounfour conformance vector count. The handoff
// packet is the input for a future loa-hounfour issue / PR; this
// script does NOT file the issue, open the PR, integrate Hounfour,
// or claim that integration is complete.
//
// Constraints:
//   * MUST NOT import from loa-hounfour or any sibling repo
//   * MUST NOT import from .loa or .claude framework internals
//   * MUST NOT edit sibling repos
//   * Local, read-only filesystem inspection only

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

export const HANDOFF_DOCS = [
  'docs/handoffs/hounfour-schema-extraction-issue.md',
  'docs/handoffs/hounfour-schema-extraction-pr-checklist.md',
  'docs/handoffs/hounfour-extraction-mapping.md',
] as const;

export const SCHEMA_CANDIDATE_DIR = 'fixtures/schema-candidates';
export const HOUNFOUR_CONFORMANCE_DIR = 'fixtures/hounfour-conformance';

export interface HandoffDocStatus {
  path: string;
  exists: boolean;
  bytes: number;
}

export interface HandoffSummary {
  docs: HandoffDocStatus[];
  schemaCandidateCount: number;
  hounfourConformanceCount: number;
  allDocsPresent: boolean;
}

function statusFor(relPath: string): HandoffDocStatus {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) {
    return { path: relPath, exists: false, bytes: 0 };
  }
  const s = statSync(abs);
  return { path: relPath, exists: true, bytes: s.size };
}

function jsonCountIn(relDir: string): number {
  const abs = resolve(ROOT, relDir);
  if (!existsSync(abs)) return 0;
  return readdirSync(abs).filter((f) => f.endsWith('.json')).length;
}

export function buildHandoffSummary(): HandoffSummary {
  const docs = HANDOFF_DOCS.map(statusFor);
  return {
    docs,
    schemaCandidateCount: jsonCountIn(SCHEMA_CANDIDATE_DIR),
    hounfourConformanceCount: jsonCountIn(HOUNFOUR_CONFORMANCE_DIR),
    allDocsPresent: docs.every((d) => d.exists),
  };
}

export function formatHandoffSummary(s: HandoffSummary): string {
  const lines: string[] = [];
  lines.push('Hounfour extraction handoff packet (Phase 9)');
  lines.push('');
  lines.push('Handoff documents:');
  for (const d of s.docs) {
    if (d.exists) {
      lines.push(`  [present, ${d.bytes} bytes] ${d.path}`);
    } else {
      lines.push(`  [MISSING]              ${d.path}`);
    }
  }
  lines.push('');
  lines.push('Vector counts (PR-A test inputs):');
  lines.push(`  schema-candidate fixtures (Phase 6): ${s.schemaCandidateCount} JSON files`);
  lines.push(`  hounfour conformance vectors (Phase 8): ${s.hounfourConformanceCount} JSON files`);
  lines.push('');
  lines.push(
    'Reminder: this is a handoff packet, not Hounfour integration. The packet is',
  );
  lines.push(
    'staged in loa-straylight; filing the issue and opening the PR against',
  );
  lines.push(
    'loa-hounfour are out of scope for Phase 9 and have not happened.',
  );
  return lines.join('\n');
}

try {
  const summary = buildHandoffSummary();
  console.log(formatHandoffSummary(summary));
  if (!summary.allDocsPresent) {
    const missing = summary.docs.filter((d) => !d.exists).map((d) => d.path);
    console.error(`\nERROR: ${missing.length} handoff document(s) missing: ${missing.join(', ')}`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error('hounfour:handoff failed:', err);
  process.exitCode = 1;
}
