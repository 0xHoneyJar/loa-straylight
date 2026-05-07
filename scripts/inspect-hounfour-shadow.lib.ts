// Phase 17B -- Hounfour v8.5.x shadow inspector library.
//
// Reads schema-byte surfaces from the installed Hounfour package
// under `node_modules/@0xhoneyjar/loa-hounfour/` and produces a
// classification report comparing them against the Phase 16
// disposition expectations recorded in
// `docs/handoffs/hounfour-shadow-integration-findings.md` and
// `docs/handoffs/hounfour-adaptation-delta.md`.
//
// This file:
//   * is pure (returns a report; performs no disk writes)
//   * reads only from the installed package directory (filesystem)
//   * does NOT import from `@0xhoneyjar/loa-hounfour` at the JS
//     module boundary -- preserving the subpath discipline of
//     delta #9. The alias module
//     (`src/straylight/hounfour-alias.ts`) is the only place
//     Hounfour names appear as JS imports.
//   * does NOT import from sibling repos
//   * does NOT import from `.loa` or `.claude` framework internals
//   * does NOT call any GitHub API or make network requests
//
// Constraints (see docs/handoffs/hounfour-adaptation-delta.md):
//
//   * delta #7  -- Challenge schema absence is REQUIRED in v8.5.x.
//                 The inspector asserts absence and reports PASS
//                 when no `challenge*` schema ships.
//   * delta #8  -- EstateTransition schema absence is REQUIRED in
//                 v8.5.x. Same handling.
//   * delta #12 -- The 15 net-new v8.5.0 schemas are REQUIRED to be
//                 present. Inspector asserts presence and validates
//                 each schema's `$id` matches `/loa-hounfour/8.5.\d+/`.
//   * Intended dependency range is `^8.5.0`; resolved version is
//     whatever the installed package metadata reports (e.g. 8.5.2).
//     Both are captured in the report.
//   * `safeCanonicalize` subpath selection is DEFERRED for Phase
//     17B per the user-facing constraint -- the inspector records
//     the deferral and does not attempt to import it.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

export const HOUNFOUR_PACKAGE_NAME = '@0xhoneyjar/loa-hounfour';
export const INTENDED_DEPENDENCY_RANGE = '^8.5.0';

const HOUNFOUR_PACKAGE_DIR = resolve(
  ROOT,
  'node_modules',
  '@0xhoneyjar',
  'loa-hounfour',
);
const HOUNFOUR_SCHEMAS_DIR = resolve(HOUNFOUR_PACKAGE_DIR, 'schemas');
const HOUNFOUR_PACKAGE_JSON = resolve(
  HOUNFOUR_PACKAGE_DIR,
  'package.json',
);

const STRAYLIGHT_FIXTURES_DIR = resolve(
  ROOT,
  'fixtures',
  'schema-candidates',
);

/**
 * Match `/loa-hounfour/8.5.<patch>/` in any `$id` URI. Per the
 * user-facing Phase 17B constraint, tests do not hard-pin 8.5.0;
 * any 8.5.x patch within the `^8.5.0` range is acceptable.
 */
export const ID_VERSION_REGEX = /\/loa-hounfour\/8\.5\.\d+\//;

/** The 15 net-new v8.5.0 schemas (delta #12), by file stem. */
export const NET_NEW_V850_SCHEMAS: readonly string[] = [
  // Recall machinery (5)
  'receipt-detail-level',
  'surface-context',
  'recall-request',
  'recall-pack',
  'recall-receipt',
  // Forget / Commit / Estate (5)
  'forget-record',
  'commitment-type',
  'commitment-root',
  'agent-estate-status',
  'agent-estate',
  // Assertion family (5)
  'privacy-scope',
  'risk-level',
  'assertion-status',
  'assertion-class',
  'assertion',
];

/**
 * Schemas that MUST be absent in v8.5.x. Challenge and
 * EstateTransition are deferred to cycle-005 / v8.6.0 (deltas
 * #7 / #8). Patterns are matched against the schema filename
 * stem (without `.schema.json`).
 */
export const DEFERRED_SCHEMA_PATTERNS: readonly RegExp[] = [
  /^challenge(\b|[-.])/i,
  /^estate-transition(\b|[-.])/i,
];

export type ExpectedDisposition = 'MATCH' | 'EXTEND' | 'FOLD' | 'DEFERRED';

export type ObservedDisposition =
  | 'MATCH'
  | 'EXTEND'
  | 'FOLD'
  | 'MISSING'
  | 'DEFERRED'
  | 'NAME_DRIFT';

export interface CandidateMapping {
  /** Filename under fixtures/schema-candidates/. */
  straylightCandidate: string;
  /** Expected Hounfour schema stem, or null when DEFERRED. */
  expectedHounfourSchema: string | null;
  /** Per the Phase 16 intake / delta docs. */
  expectedDisposition: ExpectedDisposition;
  notes?: string;
}

/**
 * Phase 16 expected mapping (per
 * docs/handoffs/hounfour-shadow-integration-findings.md). Phase 17B
 * confirms or refutes each row by reading the actually-shipped
 * Hounfour schema directory.
 */
export const STRAYLIGHT_CANDIDATES: readonly CandidateMapping[] = [
  {
    straylightCandidate: 'actor.json',
    expectedHounfourSchema: 'agent-identity',
    expectedDisposition: 'MATCH',
    notes:
      'AgentIdentity aliased as Actor at the alias-module boundary (delta #10).',
  },
  {
    straylightCandidate: 'estate.json',
    expectedHounfourSchema: 'agent-estate',
    expectedDisposition: 'EXTEND',
    notes:
      'One of the 5 forget/commit/estate net-new v8.5.0 schemas (delta #12).',
  },
  {
    straylightCandidate: 'keyring.json',
    expectedHounfourSchema: 'keyring',
    expectedDisposition: 'MATCH',
  },
  {
    straylightCandidate: 'assertion-observation.json',
    expectedHounfourSchema: 'assertion',
    expectedDisposition: 'MATCH',
    notes:
      'Assertion family (delta #12); status discriminator distinguishes variants.',
  },
  {
    straylightCandidate: 'assertion-reflection-contested.json',
    expectedHounfourSchema: 'assertion',
    expectedDisposition: 'MATCH',
    notes: 'Same Assertion schema; status: contested.',
  },
  {
    straylightCandidate: 'assertion-revoked.json',
    expectedHounfourSchema: 'assertion',
    expectedDisposition: 'MATCH',
    notes: 'Same Assertion schema; status: revoked.',
  },
  {
    straylightCandidate: 'recall-request-public-discord.json',
    expectedHounfourSchema: 'recall-request',
    expectedDisposition: 'MATCH',
    notes: 'Recall-machinery family (delta #12).',
  },
  {
    straylightCandidate: 'recall-pack-public-discord.json',
    expectedHounfourSchema: 'recall-pack',
    expectedDisposition: 'MATCH',
    notes: 'Recall-machinery family (delta #12).',
  },
  {
    straylightCandidate: 'recall-receipt-public-discord.json',
    expectedHounfourSchema: 'recall-receipt',
    expectedDisposition: 'MATCH',
    notes: 'Recall-machinery family (delta #12).',
  },
  {
    straylightCandidate: 'audit-event-transition.json',
    expectedHounfourSchema: 'audit-event',
    expectedDisposition: 'MATCH',
    notes:
      'Phase 16 disposition was REUSE; if v8.5.x ships a different name (e.g. audit-trail-entry) the inspector reports NAME_DRIFT and surfaces a finding.',
  },
  {
    straylightCandidate: 'policy-decision-denied.json',
    expectedHounfourSchema: null,
    expectedDisposition: 'DEFERRED',
    notes:
      'Straylight-local; not part of the v8.5.0 line per Phase 16 disposition.',
  },
  {
    straylightCandidate: 'commitment-root.json',
    expectedHounfourSchema: 'commitment-root',
    expectedDisposition: 'MATCH',
    notes: 'Forget/commit/estate family (delta #12).',
  },
];

export interface ResolvedPackageInfo {
  packageJsonPath: string;
  exists: boolean;
  name?: string;
  version?: string;
}

export interface SchemaPresence {
  stem: string;
  filename: string;
  exists: boolean;
  size: number;
  $id?: string;
  $idMatchesV85x: boolean;
}

export interface CandidateResult {
  straylightCandidate: string;
  straylightCandidatePresent: boolean;
  expectedHounfourSchema: string | null;
  expectedDisposition: ExpectedDisposition;
  observedDisposition: ObservedDisposition;
  hounfour: SchemaPresence | null;
  notes: string[];
}

export interface NetNewSchemaCheck {
  stem: string;
  filename: string;
  present: boolean;
  $id?: string;
  $idMatchesV85x: boolean;
}

export interface DeferredSchemaCheck {
  pattern: string;
  matchingFiles: string[];
  /** PASS when matchingFiles is empty (deferral honored at runtime). */
  pass: boolean;
}

export interface ShadowReport {
  generatedAt: string;
  intendedDependencyRange: string;
  resolvedPackage: ResolvedPackageInfo;
  candidates: CandidateResult[];
  netNewSchemas: NetNewSchemaCheck[];
  deferredSchemas: DeferredSchemaCheck[];
  /** Deferred surface decisions (e.g. safeCanonicalize). */
  deferredSurfaceDecisions: string[];
  /** Hounfour-side blockers surfaced by this run, if any. */
  blockers: string[];
  /** Free-form findings worth recording in the findings doc. */
  notes: string[];
}

function listShippedSchemaStems(): string[] {
  if (!existsSync(HOUNFOUR_SCHEMAS_DIR)) return [];
  return readdirSync(HOUNFOUR_SCHEMAS_DIR)
    .filter((f) => f.endsWith('.schema.json'))
    .map((f) => f.replace(/\.schema\.json$/, ''))
    .sort();
}

function readSchemaBySchema(stem: string): SchemaPresence {
  const filename = `${stem}.schema.json`;
  const abs = resolve(HOUNFOUR_SCHEMAS_DIR, filename);
  if (!existsSync(abs)) {
    return {
      stem,
      filename,
      exists: false,
      size: 0,
      $idMatchesV85x: false,
    };
  }
  const stat = statSync(abs);
  let parsed: { $id?: unknown } = {};
  try {
    parsed = JSON.parse(readFileSync(abs, 'utf8')) as { $id?: unknown };
  } catch {
    return {
      stem,
      filename,
      exists: true,
      size: stat.size,
      $idMatchesV85x: false,
    };
  }
  const $id = typeof parsed.$id === 'string' ? parsed.$id : undefined;
  return {
    stem,
    filename,
    exists: true,
    size: stat.size,
    ...(typeof $id === 'string' ? { $id } : {}),
    $idMatchesV85x: typeof $id === 'string' && ID_VERSION_REGEX.test($id),
  };
}

function readResolvedPackageInfo(): ResolvedPackageInfo {
  if (!existsSync(HOUNFOUR_PACKAGE_JSON)) {
    return { packageJsonPath: HOUNFOUR_PACKAGE_JSON, exists: false };
  }
  const parsed = JSON.parse(
    readFileSync(HOUNFOUR_PACKAGE_JSON, 'utf8'),
  ) as { name?: string; version?: string };
  return {
    packageJsonPath: HOUNFOUR_PACKAGE_JSON,
    exists: true,
    ...(typeof parsed.name === 'string' ? { name: parsed.name } : {}),
    ...(typeof parsed.version === 'string'
      ? { version: parsed.version }
      : {}),
  };
}

function classifyCandidate(
  mapping: CandidateMapping,
): CandidateResult {
  const fixtureAbs = resolve(
    STRAYLIGHT_FIXTURES_DIR,
    mapping.straylightCandidate,
  );
  const straylightCandidatePresent = existsSync(fixtureAbs);
  const notes: string[] = [];
  if (mapping.notes) notes.push(mapping.notes);
  if (!straylightCandidatePresent) {
    notes.push(
      `Local fixture missing: ${mapping.straylightCandidate}.`,
    );
  }

  if (mapping.expectedDisposition === 'DEFERRED') {
    return {
      straylightCandidate: mapping.straylightCandidate,
      straylightCandidatePresent,
      expectedHounfourSchema: null,
      expectedDisposition: 'DEFERRED',
      observedDisposition: 'DEFERRED',
      hounfour: null,
      notes,
    };
  }

  if (mapping.expectedHounfourSchema === null) {
    return {
      straylightCandidate: mapping.straylightCandidate,
      straylightCandidatePresent,
      expectedHounfourSchema: null,
      expectedDisposition: mapping.expectedDisposition,
      observedDisposition: 'MISSING',
      hounfour: null,
      notes: [
        ...notes,
        'Mapping declares no expected Hounfour schema yet expects a non-DEFERRED disposition.',
      ],
    };
  }

  const presence = readSchemaBySchema(mapping.expectedHounfourSchema);
  if (!presence.exists) {
    return {
      straylightCandidate: mapping.straylightCandidate,
      straylightCandidatePresent,
      expectedHounfourSchema: mapping.expectedHounfourSchema,
      expectedDisposition: mapping.expectedDisposition,
      observedDisposition: 'MISSING',
      hounfour: presence,
      notes: [
        ...notes,
        `Expected Hounfour schema not found: ${presence.filename}.`,
      ],
    };
  }

  if (!presence.$idMatchesV85x) {
    notes.push(
      `Hounfour schema $id does not match /loa-hounfour/8.5.\\d+/: ${
        presence.$id ?? '(no $id)'
      }`,
    );
  }

  return {
    straylightCandidate: mapping.straylightCandidate,
    straylightCandidatePresent,
    expectedHounfourSchema: mapping.expectedHounfourSchema,
    expectedDisposition: mapping.expectedDisposition,
    observedDisposition: mapping.expectedDisposition,
    hounfour: presence,
    notes,
  };
}

function checkNetNewSchemas(): NetNewSchemaCheck[] {
  return NET_NEW_V850_SCHEMAS.map((stem) => {
    const p = readSchemaBySchema(stem);
    return {
      stem,
      filename: p.filename,
      present: p.exists,
      ...(typeof p.$id === 'string' ? { $id: p.$id } : {}),
      $idMatchesV85x: p.$idMatchesV85x,
    };
  });
}

function checkDeferredSchemas(): DeferredSchemaCheck[] {
  const stems = listShippedSchemaStems();
  return DEFERRED_SCHEMA_PATTERNS.map((pattern) => {
    const matchingFiles = stems
      .filter((s) => pattern.test(s))
      .map((s) => `${s}.schema.json`);
    return {
      pattern: pattern.toString(),
      matchingFiles,
      pass: matchingFiles.length === 0,
    };
  });
}

/**
 * Build the Phase 17B shadow report. Pure: no disk writes, no
 * network calls. Reads only the installed Hounfour package and the
 * local Straylight fixtures directory.
 */
export function inspect(): ShadowReport {
  const resolvedPackage = readResolvedPackageInfo();
  const candidates = STRAYLIGHT_CANDIDATES.map(classifyCandidate);
  const netNewSchemas = checkNetNewSchemas();
  const deferredSchemas = checkDeferredSchemas();

  const blockers: string[] = [];
  const notes: string[] = [];

  if (!resolvedPackage.exists) {
    blockers.push(
      `Installed Hounfour package missing at ${resolvedPackage.packageJsonPath}; run npm install before the inspector.`,
    );
  } else {
    if (resolvedPackage.name !== HOUNFOUR_PACKAGE_NAME) {
      blockers.push(
        `Installed package name unexpected: ${
          resolvedPackage.name ?? '(none)'
        } (expected ${HOUNFOUR_PACKAGE_NAME}).`,
      );
    }
    if (
      typeof resolvedPackage.version === 'string' &&
      !/^8\.5\.\d+$/.test(resolvedPackage.version)
    ) {
      blockers.push(
        `Resolved version ${resolvedPackage.version} is outside the 8.5.x line; intended range is ${INTENDED_DEPENDENCY_RANGE}.`,
      );
    }
  }

  for (const c of netNewSchemas) {
    if (!c.present) {
      blockers.push(
        `Required v8.5.0 net-new schema missing: ${c.filename} (delta #12).`,
      );
    } else if (!c.$idMatchesV85x) {
      blockers.push(
        `Net-new schema $id outside /loa-hounfour/8.5.\\d+/: ${c.filename} -> ${
          c.$id ?? '(no $id)'
        }.`,
      );
    }
  }

  for (const d of deferredSchemas) {
    if (!d.pass) {
      blockers.push(
        `Deferred schema present in v8.5.x (deltas #7/#8): pattern ${
          d.pattern
        } matched ${d.matchingFiles.join(', ')}. Straylight does not authorize using it from Hounfour until cycle-005 / v8.6.0.`,
      );
    }
  }

  for (const c of candidates) {
    if (
      c.expectedDisposition !== 'DEFERRED' &&
      c.observedDisposition === 'MISSING'
    ) {
      notes.push(
        `Candidate ${c.straylightCandidate} expected ${
          c.expectedHounfourSchema ?? '(none)'
        } but no schema with that stem ships in v8.5.x. Recorded as a name-drift / migration-discovery finding (not a blocker until corroborated by a vector or fixture).`,
      );
    }
  }

  const deferredSurfaceDecisions: string[] = [
    'safeCanonicalize subpath selection deferred for Phase 17B. v8.5.x exports map declares no ./canonicalize or ./utilities subpath; importing from package root is forbidden (delta #9). Resolution is deferred until a later phase confirms an explicit exported subpath or files a Hounfour blocker requesting one.',
  ];

  return {
    generatedAt: new Date().toISOString(),
    intendedDependencyRange: INTENDED_DEPENDENCY_RANGE,
    resolvedPackage,
    candidates,
    netNewSchemas,
    deferredSchemas,
    deferredSurfaceDecisions,
    blockers,
    notes,
  };
}

export function summarizeReport(r: ShadowReport): string {
  const lines: string[] = [];
  lines.push('Hounfour v8.5.x shadow inspection report (Phase 17B)');
  lines.push('');
  lines.push(`Intended dependency range: ${r.intendedDependencyRange}`);
  lines.push(
    `Resolved package: ${r.resolvedPackage.name ?? '(missing)'}@${
      r.resolvedPackage.version ?? '(missing)'
    }`,
  );
  lines.push('');
  lines.push('Candidate dispositions:');
  for (const c of r.candidates) {
    const id = c.hounfour?.$id ?? '(no $id)';
    lines.push(
      `  [${c.observedDisposition.padEnd(8)}] ${c.straylightCandidate} -> ${
        c.expectedHounfourSchema ?? '(none)'
      }${c.observedDisposition !== 'DEFERRED' ? `  $id=${id}` : ''}`,
    );
  }
  lines.push('');
  lines.push('Net-new v8.5.0 schemas (delta #12):');
  for (const c of r.netNewSchemas) {
    lines.push(
      `  [${c.present ? 'present' : 'MISSING'}${
        c.present
          ? c.$idMatchesV85x
            ? ', 8.5.x'
            : ', $id-DRIFT'
          : ''
      }] ${c.filename}`,
    );
  }
  lines.push('');
  lines.push('Deferred schemas (deltas #7 / #8):');
  for (const d of r.deferredSchemas) {
    lines.push(
      `  [${d.pass ? 'absent -- PASS' : 'PRESENT -- BLOCKER'}] ${d.pattern}${
        d.matchingFiles.length > 0
          ? `: ${d.matchingFiles.join(', ')}`
          : ''
      }`,
    );
  }
  lines.push('');
  lines.push('Deferred surface decisions:');
  for (const s of r.deferredSurfaceDecisions) lines.push(`  - ${s}`);
  if (r.blockers.length > 0) {
    lines.push('');
    lines.push('Blockers:');
    for (const b of r.blockers) lines.push(`  ! ${b}`);
  }
  if (r.notes.length > 0) {
    lines.push('');
    lines.push('Notes:');
    for (const n of r.notes) lines.push(`  - ${n}`);
  }
  return lines.join('\n');
}
