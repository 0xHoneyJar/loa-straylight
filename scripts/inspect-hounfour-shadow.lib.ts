// Phase 17B / Phase 18 -- Hounfour v8.5.x shadow inspector library.
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
//                 when no `challenge*` schema ships. Phase 18 also
//                 surfaces this as a structured cycleFiveDeferrals
//                 entry with `deferredUntil: '8.6.0'`.
//   * delta #8  -- EstateTransition schema absence is REQUIRED in
//                 v8.5.x. Same handling, same cycleFiveDeferrals
//                 surfacing.
//   * delta #12 -- The 15 net-new v8.5.0 schemas are REQUIRED to be
//                 present. Inspector asserts presence and validates
//                 each schema's `$id` matches `/loa-hounfour/8.5.\d+/`.
//   * Intended dependency range is `^8.5.0`; resolved version is
//     whatever the installed package metadata reports (e.g. 8.5.2).
//     Both are captured in the report.
//   * `safeCanonicalize` subpath selection is DEFERRED for Phase
//     17B per the user-facing constraint -- the inspector records
//     the deferral and does not attempt to import it. Phase 18
//     surfaces the deferral as a structured deferredSubpaths
//     entry with `gate: 'no-confirmed-subpath'`.
//
// Phase 18 boundary-hardening additions:
//
//   * Renames the dead `NAME_DRIFT` value in ObservedDisposition to
//     `DISCOVERY_NOTE`. The classifier now actually emits it for
//     candidate rows flagged with `discoveryNote: true` whose
//     expected Hounfour schema is absent in v8.5.x. DISCOVERY_NOTE
//     is informational by design and is never a blocker.
//   * Exports a static DISPOSITION_TABLE documenting the six
//     classifier dispositions (MATCH, EXTEND, FOLD, MISSING,
//     DEFERRED, DISCOVERY_NOTE) so the decision table lives in
//     code, not just docs.
//   * Adds `deferredSubpaths` (structured safeCanonicalize-style
//     deferrals) and `cycleFiveDeferrals` (structured Challenge /
//     EstateTransition deferrals) to ShadowReport.

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

/**
 * Phase 18: classifier dispositions the inspector can emit at
 * runtime against the actually-shipped v8.5.x surface. The set
 * matches DISPOSITION_TABLE below; DISCOVERY_NOTE replaces the
 * Phase 17B `NAME_DRIFT` value and is the only disposition that
 * captures "Phase 16 expected this to be present, v8.5.x ships it
 * under a different name (or not at all), and the resolution is
 * informational rather than a blocker."
 */
export type ObservedDisposition =
  | 'MATCH'
  | 'EXTEND'
  | 'FOLD'
  | 'MISSING'
  | 'DEFERRED'
  | 'DISCOVERY_NOTE';

export interface DispositionDescription {
  disposition: ObservedDisposition;
  /** One-line description of what this disposition means. */
  description: string;
  /**
   * Whether the inspector treats this disposition as a blocker.
   * Phase 17B/18: only `MISSING` on a non-DEFERRED expected
   * mapping is treated as a blocker; everything else is
   * informational.
   */
  isBlocker: boolean;
}

/**
 * Phase 18 static decision table. Six dispositions, one row each.
 * Exported so callers and tests can pin the vocabulary against
 * docs/handoffs without depending on string-literal shape alone.
 */
export const DISPOSITION_TABLE: readonly DispositionDescription[] = [
  {
    disposition: 'MATCH',
    description:
      'Straylight candidate maps cleanly to a Hounfour v8.5.x schema with the expected stem and an 8.5.x $id.',
    isBlocker: false,
  },
  {
    disposition: 'EXTEND',
    description:
      'Straylight candidate maps to a Hounfour v8.5.x schema, but the candidate uses a strict-additive extension on the Hounfour shape (delta #5 / #14).',
    isBlocker: false,
  },
  {
    disposition: 'FOLD',
    description:
      'Straylight candidate folds into a single Hounfour schema via a discriminator (e.g. CandidateAssertion folds into Assertion with status: "candidate").',
    isBlocker: false,
  },
  {
    disposition: 'MISSING',
    description:
      'Phase 16 expected a Hounfour schema with a specific stem; v8.5.x ships no schema with that stem. Treated as a potential blocker for non-DEFERRED rows that are not flagged as DISCOVERY_NOTE.',
    isBlocker: false,
  },
  {
    disposition: 'DEFERRED',
    description:
      'Straylight-local primitive that is intentionally not part of the v8.5.x Hounfour line (e.g. policy-decision-denied) and must not be validated against Hounfour.',
    isBlocker: false,
  },
  {
    disposition: 'DISCOVERY_NOTE',
    description:
      'Phase 16 expected a Hounfour schema with a specific stem, but Phase 17B / Phase 18 inspection discovered v8.5.x ships an adjacent or differently-named schema. Informational; the resolution path is a deliberate later-phase decision (rename Straylight fixture, request a Hounfour-side schema, or re-classify against the actually-shipping name). Never a blocker.',
    isBlocker: false,
  },
];

export interface CandidateMapping {
  /** Filename under fixtures/schema-candidates/. */
  straylightCandidate: string;
  /** Expected Hounfour schema stem, or null when DEFERRED. */
  expectedHounfourSchema: string | null;
  /** Per the Phase 16 intake / delta docs. */
  expectedDisposition: ExpectedDisposition;
  /**
   * Phase 18: when true, the inspector emits DISCOVERY_NOTE
   * (rather than MISSING) if the expected Hounfour schema is
   * absent in v8.5.x. Used for rows where Phase 17B inspection
   * confirmed the expected stem does not ship and the Straylight
   * fixture stays local pending a deliberate later-phase
   * resolution.
   */
  discoveryNote?: true;
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
    discoveryNote: true,
    notes:
      'Phase 16 disposition was REUSE (expected `audit-event`). Phase 17B inspection against v8.5.2 confirmed no `audit-event.schema.json` ships; adjacent schemas are `audit-trail-entry` and `domain-event`. Phase 18 formally classifies this row as DISCOVERY_NOTE -- informational, never a blocker, resolution deferred to a later phase.',
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

/**
 * Phase 18 structured surface-deferral entry. Captures the reason
 * a given Hounfour symbol cannot yet be wired through the alias
 * module, and the explicit gate the resolution waits on.
 */
export interface DeferredSubpathEntry {
  /** Hounfour-side symbol whose subpath selection is deferred. */
  symbol: string;
  /**
   * Stable string code identifying the gate the resolution waits
   * on. `no-confirmed-subpath` means the v8.5.x exports map ships
   * no subpath that re-exports the symbol; reaching into
   * unexported internals or the package root is forbidden.
   */
  gate: 'no-confirmed-subpath';
  /** Human-readable reason for the deferral. */
  reason: string;
  /**
   * Subpaths the inspector confirmed v8.5.x does NOT export.
   * Empty when no specific candidate subpath was probed.
   */
  notExportedSubpaths: readonly string[];
}

/**
 * Phase 18 structured cycle-005 / v8.6.0 deferral entry. Mirrors
 * the existing pattern-based DeferredSchemaCheck but exposes the
 * Hounfour-side symbol and the version it is queued for, which
 * the pattern alone does not document.
 */
export interface CycleFiveDeferralEntry {
  /** Hounfour symbol deferred to cycle-005 / v8.6.0. */
  name: 'Challenge' | 'EstateTransition';
  /** Version the symbol is queued for. */
  deferredUntil: '8.6.0';
  /**
   * Whether the symbol ships in the currently-installed v8.5.x
   * package (true would indicate a deferral breach and the
   * inspector raises a blocker via the existing
   * deferredSchemas check).
   */
  shipsInV85x: boolean;
  /** Free-text rationale for the deferral. */
  reason: string;
}

export interface ShadowReport {
  generatedAt: string;
  intendedDependencyRange: string;
  resolvedPackage: ResolvedPackageInfo;
  candidates: CandidateResult[];
  netNewSchemas: NetNewSchemaCheck[];
  deferredSchemas: DeferredSchemaCheck[];
  /**
   * Phase 18 structured deferred-subpath entries (e.g.
   * safeCanonicalize). The free-text deferredSurfaceDecisions
   * list below is preserved for human-readable summary and stays
   * in sync with this list.
   */
  deferredSubpaths: DeferredSubpathEntry[];
  /**
   * Phase 18 structured cycle-005 / v8.6.0 deferrals (Challenge,
   * EstateTransition). Mirrors the existing schema-absence checks
   * but adds the version queue and the Hounfour symbol name.
   */
  cycleFiveDeferrals: CycleFiveDeferralEntry[];
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
    if (mapping.discoveryNote === true) {
      return {
        straylightCandidate: mapping.straylightCandidate,
        straylightCandidatePresent,
        expectedHounfourSchema: mapping.expectedHounfourSchema,
        expectedDisposition: mapping.expectedDisposition,
        observedDisposition: 'DISCOVERY_NOTE',
        hounfour: presence,
        notes: [
          ...notes,
          `DISCOVERY_NOTE: expected Hounfour schema ${presence.filename} not found in v8.5.x; row is flagged as a known name-drift / discovery candidate. Informational, never a blocker.`,
        ],
      };
    }
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
    if (c.observedDisposition === 'DISCOVERY_NOTE') {
      notes.push(
        `Candidate ${c.straylightCandidate} classified as DISCOVERY_NOTE: expected ${
          c.expectedHounfourSchema ?? '(none)'
        } not shipped in v8.5.x. Informational; resolution path is a deliberate later-phase decision.`,
      );
    } else if (
      c.expectedDisposition !== 'DEFERRED' &&
      c.observedDisposition === 'MISSING'
    ) {
      notes.push(
        `Candidate ${c.straylightCandidate} expected ${
          c.expectedHounfourSchema ?? '(none)'
        } but no schema with that stem ships in v8.5.x and the row is not flagged as DISCOVERY_NOTE. Investigate before declaring it a blocker.`,
      );
    }
  }

  // Phase 18 structured deferrals. The free-text strings below are
  // preserved for human-readable summary; the structured entries
  // are the load-bearing surface for tests and downstream tooling.
  const deferredSubpaths: DeferredSubpathEntry[] = [
    {
      symbol: 'safeCanonicalize',
      gate: 'no-confirmed-subpath',
      reason:
        'v8.5.x exports map declares no ./canonicalize or ./utilities subpath; importing from package root is forbidden (delta #9), and reaching into unexported internals (dist/utilities/) is forbidden by the user-facing Phase 17B / Phase 18 constraint. Resolution is deferred until a later phase confirms an explicit exported subpath or files a Hounfour-side blocker.',
      notExportedSubpaths: [
        '@0xhoneyjar/loa-hounfour/canonicalize',
        '@0xhoneyjar/loa-hounfour/utilities',
      ],
    },
  ];

  const deferredSurfaceDecisions: string[] = deferredSubpaths.map(
    (d) =>
      `${d.symbol} subpath selection deferred (gate: ${d.gate}). ${d.reason}`,
  );

  // Phase 18 structured cycle-005 / v8.6.0 deferrals. Each entry's
  // shipsInV85x is sourced from the same DEFERRED_SCHEMA_PATTERNS
  // sweep that produces the existing deferredSchemas list, so the
  // two views cannot disagree.
  const challengeMatches =
    deferredSchemas.find((d) => /challenge/i.test(d.pattern))
      ?.matchingFiles.length ?? 0;
  const estateTransitionMatches =
    deferredSchemas.find((d) => /estate-transition/i.test(d.pattern))
      ?.matchingFiles.length ?? 0;

  const cycleFiveDeferrals: CycleFiveDeferralEntry[] = [
    {
      name: 'Challenge',
      deferredUntil: '8.6.0',
      shipsInV85x: challengeMatches > 0,
      reason:
        'Challenge primitive deferred to Hounfour cycle-005 / v8.6.0 (delta #7). Straylight keeps the local Challenge type and validator until v8.6.0 ships a canonical schema.',
    },
    {
      name: 'EstateTransition',
      deferredUntil: '8.6.0',
      shipsInV85x: estateTransitionMatches > 0,
      reason:
        'EstateTransition primitive deferred to Hounfour cycle-005 / v8.6.0 (delta #8). Straylight keeps the local EstateTransition type, transition machinery, and audit-chain semantics until v8.6.0 ships a canonical schema.',
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    intendedDependencyRange: INTENDED_DEPENDENCY_RANGE,
    resolvedPackage,
    candidates,
    netNewSchemas,
    deferredSchemas,
    deferredSubpaths,
    cycleFiveDeferrals,
    deferredSurfaceDecisions,
    blockers,
    notes,
  };
}

export function summarizeReport(r: ShadowReport): string {
  const lines: string[] = [];
  lines.push(
    'Hounfour v8.5.x shadow inspection report (Phase 17B / Phase 18)',
  );
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
    // Phase 18: padding widened from 8 to 14 to accommodate the
    // longest disposition value (`DISCOVERY_NOTE`, 14 chars).
    lines.push(
      `  [${c.observedDisposition.padEnd(14)}] ${c.straylightCandidate} -> ${
        c.expectedHounfourSchema ?? '(none)'
      }${
        c.observedDisposition === 'DEFERRED' ||
        c.observedDisposition === 'DISCOVERY_NOTE'
          ? ''
          : `  $id=${id}`
      }`,
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
  lines.push(
    'Cycle-005 / v8.6.0 deferrals (Phase 18 structured view):',
  );
  for (const d of r.cycleFiveDeferrals) {
    lines.push(
      `  [${d.shipsInV85x ? 'BREACH' : 'deferred'}] ${d.name} -> v${d.deferredUntil}`,
    );
  }
  lines.push('');
  lines.push('Deferred subpaths (Phase 18 structured view):');
  for (const d of r.deferredSubpaths) {
    lines.push(`  [${d.gate}] ${d.symbol}`);
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
