// Phase 50A test support — opt-in gating and per-test isolation.
//
// The Phase 50A suites need the two-instance harness from
// `docker-compose.phase-50a.yml`. `vitest.config.ts` is outside this packet's
// allowed paths, so these files ARE matched by the default `npm test` run and
// the gate has to live here. It is deliberately two-sided:
//
//   opt-in ABSENT  (plain `npm test`, no Docker required)
//       the suites do not run, and `phase50aGateReport()` records exactly
//       that in an always-executed test — so the run never *claims* the
//       PostgreSQL proof happened.
//
//   opt-in PRESENT (`npm run phase-50a:test`, the Phase 50A workflow)
//       both hosts are REQUIRED. An unreachable host is a FAILURE with the
//       harness instructions, never a skip. Whenever the proof is asked for,
//       the absence of a real database fails the run.
//
// That is what keeps "the proof ran" and "the proof passed" the same
// statement.

import { expect, it } from 'vitest';

import { PostgresEstateHost } from '../../src/straylight/storage/postgres/index.js';
import {
  assertDistinctHosts,
  createScratchDatabase,
  replacementHost,
  sourceHost,
  type ProofHost,
  type ProofToolTarget,
  type ScratchGrant,
} from '../../scripts/phase-50a/hosts.js';

export { replacementHost, sourceHost, assertDistinctHosts };
export type { ProofHost };

/** The opt-in environment variable. Set by `npm run phase-50a:test`. */
export const OPT_IN_VAR = 'STRAYLIGHT_PHASE_50A_POSTGRES';

const HARNESS_HINT =
  'Start the Phase 50A harness first:\n' +
  '  docker compose -f docker-compose.phase-50a.yml up -d --wait\n' +
  'then run:  npm run phase-50a:test\n' +
  'See docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md.';

export function phase50aEnabled(): boolean {
  return process.env[OPT_IN_VAR] === '1';
}

/**
 * Register an always-executed test that states whether the PostgreSQL proof
 * ran. Every Phase 50A suite file calls this, so no suite can be silently
 * absent from a run's output.
 */
export function phase50aGateReport(suite: string): void {
  it(`[gate] ${suite}: PostgreSQL proof ${phase50aEnabled() ? 'ENABLED' : 'NOT REQUESTED'} via ${OPT_IN_VAR}`, () => {
    // When enabled, the two hosts must at least be configured distinctly —
    // the reachability requirement is asserted per-suite in beforeAll.
    if (phase50aEnabled()) {
      assertDistinctHosts(sourceHost(), replacementHost());
    }
    expect([true, false]).toContain(phase50aEnabled());
  });
}

/** Fail closed unless the named host answers a trivial query. */
export async function requireReachable(host: ProofHost): Promise<void> {
  const probe = new PostgresEstateHost({ connectionString: host.connectionString });
  try {
    await probe.withClient(async (client) => {
      await client.query('SELECT 1');
    });
  } catch (err) {
    throw new Error(
      `phase-50a: ${host.name} host at 127.0.0.1:${host.port} is unreachable ` +
        `(${err instanceof Error ? err.message : String(err)}).\n${HARNESS_HINT}`,
    );
  } finally {
    await probe.close();
  }
}

/**
 * Open a host on a FRESH, uniquely named database inside the same PostgreSQL
 * server instance, apply the canonical migrations, and return the host plus a
 * dispose function that drops the database.
 *
 * Per-test databases (rather than per-test truncation) keep every test's rows
 * genuinely isolated, so a test can assert absolute counts and a leaked row
 * from another test can never make an assertion pass. The SERVER instance is
 * still the harness instance — the two-host proof's "different host" claim
 * rests on `source` vs `replacement` being different servers, never on
 * database names.
 *
 * ── CREATION IS DELEGATED, NOT PERFORMED HERE (sequence-104 audit, F-10) ──
 *
 * This function used to mint the name and run `CREATE DATABASE` itself, and a
 * caller who wanted a tool target for the result asked
 * `hosts.declareScratchDatabase` to register the name — which it did for ANY
 * `p50a_`-shaped string, from anywhere. Creation and authorization were separate
 * acts, so authorization could happen without creation.
 *
 * They are now the same act, and it lives in `hosts.createScratchDatabase`: it
 * chooses the name, creates the database, and issues the `pg_dump`/`psql` target
 * for it. What this function does with the grant — migrate the fresh database
 * and hand back a disposable handle — carries no authority of its own, and
 * `toolTarget` below is the grant's, not something reconstructed from the name.
 */
export async function openScratchDatabase(
  host: ProofHost,
  label: string,
): Promise<ScratchDatabase> {
  const grant = await createScratchDatabase(host, label);
  const scoped = new PostgresEstateHost({ connectionString: grant.connectionString });
  await scoped.migrate();
  return scratchDatabaseOf(grant, scoped);
}

export interface ScratchDatabase {
  host: PostgresEstateHost;
  connectionString: string;
  database: string;
  serverHost: ProofHost;
  /**
   * The tool target ISSUED BY the creation of this database (F-10). A test that
   * needs `pg_dump`/`psql` against a scratch database uses this; there is no
   * other way to obtain one, because there is no longer an API that turns a
   * database NAME into authority.
   */
  toolTarget: ProofToolTarget;
  dispose: () => Promise<void>;
}

/** Same as `openScratchDatabase` but WITHOUT applying migrations. */
export async function openUnmigratedDatabase(
  host: ProofHost,
  label: string,
): Promise<ScratchDatabase> {
  const grant = await createScratchDatabase(host, label);
  return scratchDatabaseOf(
    grant,
    new PostgresEstateHost({ connectionString: grant.connectionString }),
  );
}

/**
 * Wrap a creation grant as a disposable per-test handle.
 *
 * `dispose` closes the scoped store and then hands the database back to the
 * grant, which drops it AND revokes the issued tool target — so the authority
 * ends when the database does.
 */
function scratchDatabaseOf(grant: ScratchGrant, scoped: PostgresEstateHost): ScratchDatabase {
  return {
    host: scoped,
    connectionString: grant.connectionString,
    database: grant.database,
    serverHost: grant.serverHost,
    toolTarget: grant.toolTarget,
    dispose: async () => {
      await scoped.close();
      await grant.drop();
    },
  };
}

/** Swap the database component of a standard PostgreSQL connection string. */
export function replaceDatabase(connectionString: string, database: string): string {
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  return url.toString();
}

export function databaseNameOf(connectionString: string): string {
  return new URL(connectionString).pathname.replace(/^\//, '');
}
