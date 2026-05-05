// Phase 15 — Cross-repo handoff index printer.
//
// Usage:
//   npm run handoffs:index
//
// Prints the four filed sibling-repo issue URLs, the local
// Straylight handoff packet that backs each one, and the local
// fixture directory each one points at. Mirrors
// docs/handoffs/cross-repo-handoff-index.md.
//
// This is a coordination artifact only. The script does NOT:
//   * file any sibling-repo issue
//   * open any sibling-repo PR
//   * call any GitHub API
//   * import from any sibling repo (loa-hounfour / loa-finn /
//     loa-dixie / loa-freeside)
//   * import from .loa or .claude framework internals
//   * edit any sibling repo
//   * change Phase 0–14 behavior
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

export interface SiblingHandoff {
  /** Short label for the sibling repo. */
  sibling: 'hounfour' | 'finn' | 'dixie' | 'freeside';
  /** Filed sibling-repo issue URL. */
  issueUrl: string;
  /** Local Straylight handoff doc paths (relative to repo root). */
  handoffDocs: string[];
  /** Local Straylight fixture directories (relative to repo root). */
  fixtureDirs: string[];
  /** Local validate command for the packet. */
  validateCommand: string;
}

export const CROSS_REPO_INDEX_DOC =
  'docs/handoffs/cross-repo-handoff-index.md';
export const CROSS_REPO_ORDER_DOC =
  'docs/handoffs/cross-repo-implementation-order.md';
export const CROSS_REPO_NO_GO_DOC =
  'docs/handoffs/cross-repo-no-go-sequence.md';

export const SIBLING_HANDOFFS: readonly SiblingHandoff[] = [
  {
    sibling: 'hounfour',
    issueUrl: 'https://github.com/0xHoneyJar/loa-hounfour/issues/70',
    handoffDocs: [
      'docs/handoffs/hounfour-schema-extraction-issue.md',
      'docs/handoffs/hounfour-schema-extraction-pr-checklist.md',
      'docs/handoffs/hounfour-extraction-mapping.md',
    ],
    fixtureDirs: [
      'fixtures/hounfour-conformance',
      'fixtures/schema-candidates',
    ],
    validateCommand: 'npm run hounfour:handoff',
  },
  {
    sibling: 'finn',
    issueUrl: 'https://github.com/0xHoneyJar/loa-finn/issues/159',
    handoffDocs: [
      'docs/handoffs/finn-runtime-enforcement-issue.md',
      'docs/handoffs/finn-runtime-boundary.md',
      'docs/handoffs/finn-enforcement-mapping.md',
    ],
    fixtureDirs: ['fixtures/finn-runtime-enforcement'],
    validateCommand: 'npm run finn:enforcement',
  },
  {
    sibling: 'dixie',
    issueUrl: 'https://github.com/0xHoneyJar/loa-dixie/issues/92',
    handoffDocs: [
      'docs/handoffs/dixie-governed-recall-issue.md',
      'docs/handoffs/dixie-governed-recall-boundary.md',
      'docs/handoffs/dixie-recall-mapping.md',
    ],
    fixtureDirs: ['fixtures/dixie-governed-recall'],
    validateCommand: 'npm run dixie:recall',
  },
  {
    sibling: 'freeside',
    issueUrl: 'https://github.com/0xHoneyJar/loa-freeside/issues/203',
    handoffDocs: [
      'docs/handoffs/freeside-community-surface-issue.md',
      'docs/handoffs/freeside-community-surface-boundary.md',
      'docs/handoffs/freeside-surface-mapping.md',
    ],
    fixtureDirs: ['fixtures/freeside-community-surface'],
    validateCommand: 'npm run freeside:surface',
  },
] as const;

export interface PathStatus {
  path: string;
  exists: boolean;
  bytes: number;
}

function statusFor(relPath: string): PathStatus {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) {
    return { path: relPath, exists: false, bytes: 0 };
  }
  const s = statSync(abs);
  return { path: relPath, exists: true, bytes: s.size };
}

export interface SiblingHandoffStatus {
  sibling: SiblingHandoff['sibling'];
  issueUrl: string;
  handoffDocs: PathStatus[];
  fixtureDirs: PathStatus[];
  validateCommand: string;
  allHandoffDocsPresent: boolean;
  allFixtureDirsPresent: boolean;
}

export interface CrossRepoIndexSummary {
  coordinationDocs: PathStatus[];
  siblings: SiblingHandoffStatus[];
  allCoordinationDocsPresent: boolean;
  allSiblingArtifactsPresent: boolean;
}

export function buildCrossRepoIndexSummary(): CrossRepoIndexSummary {
  const coordinationDocs = [
    CROSS_REPO_INDEX_DOC,
    CROSS_REPO_ORDER_DOC,
    CROSS_REPO_NO_GO_DOC,
  ].map(statusFor);

  const siblings = SIBLING_HANDOFFS.map((s): SiblingHandoffStatus => {
    const handoffDocs = s.handoffDocs.map(statusFor);
    const fixtureDirs = s.fixtureDirs.map(statusFor);
    return {
      sibling: s.sibling,
      issueUrl: s.issueUrl,
      handoffDocs,
      fixtureDirs,
      validateCommand: s.validateCommand,
      allHandoffDocsPresent: handoffDocs.every((d) => d.exists),
      allFixtureDirsPresent: fixtureDirs.every((d) => d.exists),
    };
  });

  return {
    coordinationDocs,
    siblings,
    allCoordinationDocsPresent: coordinationDocs.every((d) => d.exists),
    allSiblingArtifactsPresent: siblings.every(
      (s) => s.allHandoffDocsPresent && s.allFixtureDirsPresent,
    ),
  };
}

export function formatCrossRepoIndexSummary(
  summary: CrossRepoIndexSummary,
): string {
  const lines: string[] = [];
  lines.push('Cross-repo handoff index (Phase 15)');
  lines.push('');
  lines.push('Coordination docs (loa-straylight):');
  for (const d of summary.coordinationDocs) {
    if (d.exists) {
      lines.push(`  [present, ${d.bytes} bytes] ${d.path}`);
    } else {
      lines.push(`  [MISSING]              ${d.path}`);
    }
  }
  lines.push('');
  lines.push('Filed sibling-repo issues:');
  for (const s of summary.siblings) {
    lines.push('');
    lines.push(`  [${s.sibling}] ${s.issueUrl}`);
    lines.push(`    validate: ${s.validateCommand}`);
    lines.push('    handoff docs:');
    for (const d of s.handoffDocs) {
      const tag = d.exists ? `present, ${d.bytes} bytes` : 'MISSING';
      lines.push(`      [${tag}] ${d.path}`);
    }
    lines.push('    fixture dirs:');
    for (const d of s.fixtureDirs) {
      const tag = d.exists ? 'present' : 'MISSING';
      lines.push(`      [${tag}] ${d.path}`);
    }
  }
  lines.push('');
  lines.push(
    'Reminder: this is a coordination artifact, not cross-repo',
  );
  lines.push(
    'implementation. Filing or merging the sibling-repo PRs is out',
  );
  lines.push(
    'of scope for Phase 15. Sibling-repo PRs require teammate review',
  );
  lines.push('before merge.');
  return lines.join('\n');
}

try {
  const summary = buildCrossRepoIndexSummary();
  console.log(formatCrossRepoIndexSummary(summary));
  if (
    !summary.allCoordinationDocsPresent ||
    !summary.allSiblingArtifactsPresent
  ) {
    const missingCoord = summary.coordinationDocs
      .filter((d) => !d.exists)
      .map((d) => d.path);
    const missingSibling: string[] = [];
    for (const s of summary.siblings) {
      for (const d of [...s.handoffDocs, ...s.fixtureDirs]) {
        if (!d.exists) missingSibling.push(d.path);
      }
    }
    console.error(
      `\nERROR: missing artifacts — coordination: [${missingCoord.join(', ')}], sibling: [${missingSibling.join(', ')}]`,
    );
    process.exitCode = 1;
  }
} catch (err) {
  console.error('handoffs:index failed:', err);
  process.exitCode = 1;
}
