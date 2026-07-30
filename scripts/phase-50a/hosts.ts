// Phase 50A proof-harness host descriptors.
//
// The two hosts named here are the two SEPARATE local PostgreSQL server
// instances defined by `docker-compose.phase-50a.yml`. Everything in the
// Phase 50A proof — the conformance suite, the negative suite, the
// concurrency suite, and the export/restore harness — resolves its targets
// through this module, so there is exactly one place that knows the harness
// topology and no test hard-codes a connection string.
//
// Non-production only (ADR-049Q §13.2). These are fixed local values bound to
// loopback; they are not credentials for anything and grant nothing outside
// this harness. Environment overrides exist so the same suites can run against
// an operator's own local instances without editing the tree — they are NEVER
// a path to a provider, a production database, or a living estate.

export interface ProofHost {
  /** Stable name used in output and in the two-host proof report. */
  readonly name: 'source' | 'replacement';
  /** Standard PostgreSQL connection string for this instance. */
  readonly connectionString: string;
  /** Loopback port this instance listens on. */
  readonly port: number;
  /** Database name inside this instance. */
  readonly database: string;
}

const DEFAULTS = {
  user: 'straylight_proof',
  password: 'straylight_local_proof_only',
  host: '127.0.0.1',
} as const;

function build(
  name: ProofHost['name'],
  port: number,
  database: string,
  override: string | undefined,
): ProofHost {
  const connectionString =
    override && override.length > 0
      ? override
      : `postgresql://${DEFAULTS.user}:${DEFAULTS.password}@${DEFAULTS.host}:${port}/${database}`;
  return { name, connectionString, port, database };
}

export function sourceHost(): ProofHost {
  return build('source', 55432, 'straylight_source', process.env['STRAYLIGHT_PHASE_50A_SOURCE_URL']);
}

export function replacementHost(): ProofHost {
  return build(
    'replacement',
    55433,
    'straylight_replacement',
    process.env['STRAYLIGHT_PHASE_50A_REPLACEMENT_URL'],
  );
}

/**
 * The two hosts must be genuinely distinct servers. A misconfigured override
 * that pointed both names at the same instance would silently reduce the
 * replacement-host proof to a restore-into-itself, which proves nothing about
 * portability — so it is refused here rather than reported as a pass.
 */
export function assertDistinctHosts(a: ProofHost, b: ProofHost): void {
  if (a.connectionString === b.connectionString) {
    throw new Error(
      'phase-50a: source and replacement resolve to the same connection target; ' +
        'the replacement-host proof requires two separate PostgreSQL server instances',
    );
  }
}
