// Phase 16 — Hounfour rc shadow-integration readiness printer.
//
// Usage:
//   npm run hounfour:rc-readiness
//
// Prints the paths of the Phase 16 response-intake / readiness
// documents and the rc shadow-integration checklist. This is a
// readiness artifact only. The script does NOT:
//   * file any sibling-repo issue
//   * open any sibling-repo PR
//   * call any GitHub API
//   * import from loa-hounfour (or any sibling repo)
//   * import from .loa or .claude framework internals
//   * pin @0xhoneyjar/loa-hounfour
//   * change Phase 0–15 behavior
//
// Constraints:
//   * MUST NOT import from sibling repos
//   * MUST NOT import from .loa or .claude framework internals
//   * MUST NOT make network calls
//   * Local, read-only filesystem inspection only

import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

export const RESPONSE_INTAKE_DOC =
  'docs/handoffs/hounfour-response-intake.md';
export const ADAPTATION_DELTA_DOC =
  'docs/handoffs/hounfour-adaptation-delta.md';
export const RC_CHECKLIST_DOC =
  'docs/handoffs/hounfour-rc-shadow-integration-checklist.md';

export const HOUNFOUR_ISSUE_URL =
  'https://github.com/0xHoneyJar/loa-hounfour/issues/70';

export const READINESS_DOCS = [
  RESPONSE_INTAKE_DOC,
  ADAPTATION_DELTA_DOC,
  RC_CHECKLIST_DOC,
] as const;

export interface ReadinessDocStatus {
  path: string;
  exists: boolean;
  bytes: number;
}

export interface ReadinessSummary {
  docs: ReadinessDocStatus[];
  allDocsPresent: boolean;
  hounfourIssueUrl: string;
}

function statusFor(relPath: string): ReadinessDocStatus {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) {
    return { path: relPath, exists: false, bytes: 0 };
  }
  const s = statSync(abs);
  return { path: relPath, exists: true, bytes: s.size };
}

export function buildReadinessSummary(): ReadinessSummary {
  const docs = READINESS_DOCS.map(statusFor);
  return {
    docs,
    allDocsPresent: docs.every((d) => d.exists),
    hounfourIssueUrl: HOUNFOUR_ISSUE_URL,
  };
}

export function formatReadinessSummary(s: ReadinessSummary): string {
  const lines: string[] = [];
  lines.push(
    'Hounfour rc shadow-integration readiness packet (Phase 16)',
  );
  lines.push('');
  lines.push(`Hounfour-side filed issue: ${s.hounfourIssueUrl}`);
  lines.push('Response status: accepted-with-adaptation');
  lines.push('Pending: v8.5.0-rc.1 tag on @0xhoneyjar/loa-hounfour');
  lines.push('');
  lines.push('Readiness documents:');
  for (const d of s.docs) {
    if (d.exists) {
      lines.push(`  [present, ${d.bytes} bytes] ${d.path}`);
    } else {
      lines.push(`  [MISSING]              ${d.path}`);
    }
  }
  lines.push('');
  lines.push(
    'Reminder: this is a readiness artifact, not Hounfour integration.',
  );
  lines.push(
    'Straylight will not flip any import to @0xhoneyjar/loa-hounfour',
  );
  lines.push(
    'until v8.5.0-rc.1 ships and the rc shadow-integration checklist',
  );
  lines.push('passes on a test branch.');
  return lines.join('\n');
}

try {
  const summary = buildReadinessSummary();
  console.log(formatReadinessSummary(summary));
  if (!summary.allDocsPresent) {
    const missing = summary.docs
      .filter((d) => !d.exists)
      .map((d) => d.path);
    console.error(
      `\nERROR: ${missing.length} readiness document(s) missing: ${missing.join(', ')}`,
    );
    process.exitCode = 1;
  }
} catch (err) {
  console.error('hounfour:rc-readiness failed:', err);
  process.exitCode = 1;
}
