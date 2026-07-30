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
  replacementHost,
  sourceHost,
  type ProofHost,
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
 */
export async function openScratchDatabase(
  host: ProofHost,
  label: string,
): Promise<ScratchDatabase> {
  const name = scratchName(label);
  const admin = new PostgresEstateHost({ connectionString: host.connectionString });
  try {
    await admin.withClient(async (client) => {
      // The identifier comes from `scratchName` — a sanitized label plus pid
      // and counter, never caller-supplied free text — and PostgreSQL has no
      // parameter form for CREATE DATABASE. It is additionally quoted.
      await client.query(`CREATE DATABASE "${name}"`);
    });
  } finally {
    await admin.close();
  }

  const connectionString = replaceDatabase(host.connectionString, name);
  const scoped = new PostgresEstateHost({ connectionString });
  await scoped.migrate();

  return {
    host: scoped,
    connectionString,
    database: name,
    serverHost: host,
    dispose: async () => {
      await scoped.close();
      const cleanup = new PostgresEstateHost({ connectionString: host.connectionString });
      try {
        await cleanup.withClient(async (client) => {
          await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
        });
      } finally {
        await cleanup.close();
      }
    },
  };
}

export interface ScratchDatabase {
  host: PostgresEstateHost;
  connectionString: string;
  database: string;
  serverHost: ProofHost;
  dispose: () => Promise<void>;
}

/** Same as `openScratchDatabase` but WITHOUT applying migrations. */
export async function openUnmigratedDatabase(
  host: ProofHost,
  label: string,
): Promise<ScratchDatabase> {
  const name = scratchName(label);
  const admin = new PostgresEstateHost({ connectionString: host.connectionString });
  try {
    await admin.withClient(async (client) => {
      await client.query(`CREATE DATABASE "${name}"`);
    });
  } finally {
    await admin.close();
  }
  const connectionString = replaceDatabase(host.connectionString, name);
  const scoped = new PostgresEstateHost({ connectionString });
  return {
    host: scoped,
    connectionString,
    database: name,
    serverHost: host,
    dispose: async () => {
      await scoped.close();
      const cleanup = new PostgresEstateHost({ connectionString: host.connectionString });
      try {
        await cleanup.withClient(async (client) => {
          await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
        });
      } finally {
        await cleanup.close();
      }
    },
  };
}

let counter = 0;

function scratchName(label: string): string {
  counter += 1;
  const safe = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 32);
  return `p50a_${safe}_${process.pid}_${counter}`;
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
