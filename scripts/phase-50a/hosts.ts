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
// this harness.
//
// ── WHY THERE IS NO HOST OVERRIDE (sequence-83 audit, F-09/F-10) ──────────
//
// This module previously honoured `STRAYLIGHT_PHASE_50A_SOURCE_URL` and
// `STRAYLIGHT_PHASE_50A_REPLACEMENT_URL`, so an environment variable could
// repoint either host at an arbitrary database. The Phase 50A proof is
// DESTRUCTIVE — it drops schemas, drops and recreates databases, and restores
// a dump over whatever is there — so that override was a path from one
// environment variable to erasing a database nobody meant to erase. The tool
// targets made it worse: `pg_dump`/`psql` ran inside FIXED container names
// while the store connected through the override, so the two could disagree
// about WHICH database was being destroyed.
//
// THE DESIGN CHOSEN, of the two the packet allowed: overrides are REMOVED
// OUTRIGHT from the destructive proof rather than validated-and-refused. A
// refusal path would have to decide, from a connection string alone, whether
// some host "is really a local disposable harness instance" — and a loopback
// address proves nothing about disposability (a developer's own PostgreSQL on
// 127.0.0.1:5432 holding real data satisfies every check such a validator
// could make). Removing the input removes the decision: there is no override
// to smuggle a target through, and `resolveProofHost` refuses any descriptor
// that is not one of the two fixed ones BEFORE a connection is opened.
//
// The descriptors are therefore the SINGLE SOURCE for both the store
// connection and the `pg_dump`/`psql` tool target (`toolTargetOf`), so those
// two can no longer name different databases.

/** The container each fixed harness instance runs in. */
export type ProofContainer =
  | 'straylight-phase-50a-source'
  | 'straylight-phase-50a-replacement';

export interface ProofHost {
  /** Stable name used in output and in the two-host proof report. */
  readonly name: 'source' | 'replacement';
  /** Standard PostgreSQL connection string for this instance. */
  readonly connectionString: string;
  /** Loopback port this instance listens on. */
  readonly port: number;
  /** Database name inside this instance. */
  readonly database: string;
  /** Container this instance runs in — the tool target's other half. */
  readonly container: ProofContainer;
  /** Database user. Fixed, local-only, and shared by store and tools. */
  readonly user: string;
}

/**
 * The tool half of a fixed descriptor: what `pg_dump`/`psql` are pointed at.
 *
 * Structurally compatible with `PgToolTarget` in `pg-tools.ts` and produced
 * ONLY by `toolTargetOf` from a fixed descriptor, so the tooling can never be
 * aimed at a database the store did not populate (F-10).
 */
export interface ProofToolTarget {
  readonly container: ProofContainer;
  readonly user: string;
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
  container: ProofContainer,
): ProofHost {
  return {
    name,
    connectionString: `postgresql://${DEFAULTS.user}:${DEFAULTS.password}@${DEFAULTS.host}:${port}/${database}`,
    port,
    database,
    container,
    user: DEFAULTS.user,
  };
}

/**
 * THE FIXED DESCRIPTORS. Literal data, not derived from the environment, the
 * argv, or any caller input — nothing in this module reads `process.env`.
 * Frozen so the identity check in `resolveProofHost` cannot be defeated by
 * mutating a field of the accepted object after it was handed out.
 */
const FIXED: Readonly<Record<ProofHost['name'], ProofHost>> = Object.freeze({
  source: Object.freeze(
    build('source', 55432, 'straylight_source', 'straylight-phase-50a-source'),
  ),
  replacement: Object.freeze(
    build('replacement', 55433, 'straylight_replacement', 'straylight-phase-50a-replacement'),
  ),
});

export function sourceHost(): ProofHost {
  return FIXED.source;
}

export function replacementHost(): ProofHost {
  return FIXED.replacement;
}

/** Both fixed descriptors, in proof order. */
export function fixedProofHosts(): readonly ProofHost[] {
  return Object.freeze([FIXED.source, FIXED.replacement]);
}

/**
 * Raised when something asks the destructive proof to operate on a target that
 * is not one of the two fixed disposable harness instances.
 *
 * A distinct class so a test can prove the refusal happened for THIS reason —
 * and prove it happened BEFORE any connection, destruction, dump or restore,
 * rather than as a late failure from a database that had already been touched.
 */
export class ProofHostRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProofHostRefusedError';
  }
}

/**
 * THE GATE every destructive proof operation passes through.
 *
 * Accepts only a descriptor REFERENCE-IDENTICAL to one of the two frozen fixed
 * descriptors, or the exact name of one. Anything else — a hand-built object, a
 * copy with one field changed, a foreign host, a non-harness port, a
 * non-harness database, an unknown name — is refused, and the refusal happens
 * HERE: before any connection is opened, before any schema is emptied, and
 * before `pg_dump` or `psql` is invoked.
 *
 * Reference identity is deliberate. A structural check would accept a crafted
 * object whose fields happened to match, and then the CONNECTION STRING it
 * carried — not its fields — is what a client would actually dial.
 *
 * The refusal message names the constraint and the offending name/port/
 * database/container, and NEVER echoes a connection string: a rejected target
 * may carry a credential, and a refusal is a diagnostic like any other.
 */
export function resolveProofHost(target: ProofHost | ProofHost['name']): ProofHost {
  if (typeof target === 'string') {
    const found: ProofHost | undefined = Object.prototype.hasOwnProperty.call(FIXED, target)
      ? FIXED[target]
      : undefined;
    if (found === undefined) {
      throw new ProofHostRefusedError(
        `phase-50a: unknown proof host ${JSON.stringify(target)}; the destructive proof ` +
          'supports only the fixed disposable loopback harness instances ' +
          '"source" and "replacement"',
      );
    }
    return found;
  }
  for (const fixed of [FIXED.source, FIXED.replacement]) {
    if (target === fixed) return fixed;
  }
  throw new ProofHostRefusedError(
    'phase-50a: refusing a proof host that is not one of the two FIXED disposable ' +
      'loopback harness instances. The destructive Phase 50A proof drops schemas and ' +
      'databases, so it accepts no override, no environment variable and no ' +
      'caller-supplied target — name the harness instance ("source"/"replacement") ' +
      `instead. Refused: ${describeRefusedTarget(target)}`,
  );
}

/**
 * Describe a refused target for the operator WITHOUT echoing its connection
 * string. Name, port, database and container are useful and non-secret; the
 * connection string is where a credential would be, so it is never included —
 * not even redacted, because the refusal does not need it at all.
 */
function describeRefusedTarget(target: ProofHost): string {
  const named = (value: unknown): string =>
    typeof value === 'string' || typeof value === 'number' ? String(value) : '(absent)';
  const t = target as Partial<ProofHost>;
  return [
    `name=${named(t.name)}`,
    `port=${named(t.port)}`,
    `database=${named(t.database)}`,
    `container=${named(t.container)}`,
  ].join(' ');
}

/**
 * The `pg_dump`/`psql` target for a fixed descriptor — derived from the SAME
 * descriptor the store connects through (F-10).
 *
 * Goes through `resolveProofHost`, so an unfixed target cannot acquire a tool
 * target at all: the refusal precedes the tool invocation rather than following
 * it. `database` defaults to the descriptor's own database; a per-test scratch
 * database inside the SAME fixed instance may be named explicitly, which is
 * what the portability suite does — the container and the user still come from
 * the descriptor and can never be restated independently.
 */
export function toolTargetOf(
  target: ProofHost | ProofHost['name'],
  database?: string,
): ProofToolTarget {
  const host = resolveProofHost(target);
  const issued: ProofToolTarget = Object.freeze({
    container: host.container,
    user: host.user,
    database: database ?? host.database,
  });
  ISSUED_TOOL_TARGETS.add(issued);
  return issued;
}

/**
 * Every tool target this module has ISSUED, by object identity.
 *
 * `pg-tools` consults it before spawning anything, so a hand-built target that
 * never passed the descriptor gate cannot be handed to `pg_dump` or `psql` at
 * all — the refusal precedes the invocation instead of depending on every call
 * site remembering to ask. A `WeakSet` because membership is about identity and
 * the entries must not be kept alive by the registry.
 */
const ISSUED_TOOL_TARGETS = new WeakSet<object>();

/**
 * Did this exact object come from `toolTargetOf` (and therefore from a fixed
 * descriptor that passed `resolveProofHost`)?
 */
export function isIssuedToolTarget(target: object): boolean {
  return ISSUED_TOOL_TARGETS.has(target);
}

/**
 * The two hosts must be genuinely distinct servers. With overrides removed this
 * can no longer be misconfigured from outside, but the assertion stays: it is
 * the proof that the replacement-host exercise is a real restore into another
 * instance rather than a restore-into-itself, and an edit to the fixed
 * descriptors that collapsed them would be caught here.
 */
export function assertDistinctHosts(a: ProofHost, b: ProofHost): void {
  if (a.connectionString === b.connectionString) {
    throw new Error(
      'phase-50a: source and replacement resolve to the same connection target; ' +
        'the replacement-host proof requires two separate PostgreSQL server instances',
    );
  }
}
