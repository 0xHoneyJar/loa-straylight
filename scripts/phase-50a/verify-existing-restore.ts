// Phase 50A — NON-DESTRUCTIVE verification of an existing source and its
// restored target.
//
// ── WHY THIS FILE EXISTS (sequence-83 audit, F-14/F-15) ───────────────────
//
// The runbook's §4.3 "Verify — this step is not optional" directed the operator
// to `npm run phase-50a:proof`. But that proof is DESTRUCTIVE: it drops the
// public schema on BOTH hosts, re-migrates the source, re-seeds it with its own
// synthetic flow, and restores over the replacement. An operator who had just
// restored real data and followed the runbook's verification step would have
// ERASED exactly the data they were verifying. Verification that destroys its
// subject is not verification.
//
// This module reads. It opens both estates, reads their canonical state through
// the same `readStoreSnapshot` the proof uses, compares digests, verifies every
// per-estate audit chain, and reports. It issues NO DDL, NO DROP, NO TRUNCATE,
// NO DELETE, no reseed, and no `emptySchema` — and it holds no code path that
// could: the only statements it can reach are the read queries inside
// `readStoreSnapshot`.
//
// ── HOW AN OPERATOR RUNS IT (no package.json change) ─────────────────────
//
// The packet forbids editing `package.json`, and the artifact/workflow contract
// pins the script surface, so this deliberately adds no npm script. The
// repository's existing TypeScript-script runner invokes it directly, exactly as
// `package.json` invokes every other `scripts/*.ts` entry:
//
//   npx vite-node scripts/phase-50a/verify-existing-restore.ts
//
// Both hosts default to the two fixed disposable harness instances. To verify a
// pair of estates that are NOT the harness — the real operator case — pass the
// two connection strings explicitly:
//
//   npx vite-node scripts/phase-50a/verify-existing-restore.ts \
//     --source postgresql://<user>:<password>@<host>:<port>/<database> \
//     --target postgresql://<user>:<password>@<host>:<port>/<database>
//
// THAT IS SAFE HERE, and it is worth being explicit about why, because
// `hosts.ts` refuses caller-supplied targets for the destructive proof: the
// refusal there exists because that path ERASES what it is pointed at. This
// path cannot erase anything, so accepting an arbitrary target costs nothing —
// and REQUIRING the harness here would leave the operator with no executable
// verification of the estate they actually restored, which is the finding.
//
// Exit status is the verdict: 0 = the estates agree and every chain verifies;
// 1 = a MISMATCH or a broken chain (a real defect, reported field by field);
// 2 = the verification could not be performed (unreachable host, bad argument).
// A mismatch is never reported as a pass, and an inability to check is never
// reported as a mismatch.

import {
  PostgresEstateHost,
  compareSnapshots,
  readStoreSnapshot,
  redactConnectionString,
  snapshotDigest,
  verifyChains,
  type StoreSnapshot,
} from '../../src/straylight/storage/postgres/index.js';
import { replacementHost, sourceHost } from './hosts.js';

/** What one estate's canonical content looks like to this verifier. */
export interface EstateReading {
  /** Redacted target description — safe to print. */
  readonly target: string;
  /** Whole-store content digest. */
  readonly digest: string;
  /** Per-estate chain verdicts, estate-ascending. */
  readonly chains: readonly { estate_id: string; ok: boolean; length: number; tail: string | null }[];
  /** Row counts by table, for the report. */
  readonly counts: Readonly<Record<string, number>>;
}

export interface VerificationReport {
  readonly ok: boolean;
  readonly source: EstateReading;
  readonly target: EstateReading;
  /** Field-level differences, empty when the estates agree. */
  readonly differences: readonly string[];
  /** Chains that failed verification on either side. */
  readonly brokenChains: readonly string[];
}

/**
 * Every SQL statement this module ACTUALLY ISSUED, in order.
 *
 * ── OBSERVED, NOT ANNOUNCED (sequence-89 audit, F-14) ─────────────────────
 *
 * This record used to be SYNTHETIC: each read path pushed a hand-written
 * description of what it was about to do
 * (`'SELECT (readStoreSnapshot: actors, estates, …)'`) and then ran. The record
 * therefore attested to this module's own narration — it could not have
 * detected a statement the narration failed to mention, which is exactly the
 * property it was supposed to prove. The audit called it vacuous, correctly.
 *
 * Entries now arrive from `observeQueries`, which wraps the client's own `query`
 * method, so every statement that reaches PostgreSQL is recorded BY
 * CONSTRUCTION, at the moment it is issued, whether or not anybody remembered
 * to mention it. A statement this module did not intend to run would appear
 * here; under the old scheme it would not have.
 */
const statements: string[] = [];

export function recordedStatements(): readonly string[] {
  return [...statements];
}

export function resetRecordedStatements(): void {
  statements.length = 0;
}

/**
 * Statements that would erase data or change state. Any of these appearing on
 * the record above is a defect in this module, not a finding about the database.
 */
const DESTRUCTIVE_SQL = /\b(?:DROP|TRUNCATE|DELETE|ALTER|CREATE|INSERT|UPDATE|MERGE|GRANT|REVOKE|VACUUM|REINDEX|COPY)\b/i;

/**
 * Is every OBSERVED statement non-destructive?
 *
 * True over an empty record — deliberately, because "no destructive statement
 * was observed" is a true and useful statement about a run that issued nothing.
 * It is NOT proof of a completed non-destructive verification; for that, use
 * `provedNoDestructiveSql` below, which requires the observation to exist.
 */
export function recordedStatementsAreReadOnly(): boolean {
  return statements.every((s) => !DESTRUCTIVE_SQL.test(s));
}

/**
 * Did this run PROVE that it verified without destroying anything?
 *
 * ── WHY AN EMPTY RECORD MUST FAIL (sequence-89 audit, F-14) ───────────────
 *
 * `recordedStatementsAreReadOnly()` answers `[].every(...)` — i.e. `true` — over
 * an empty record. Used on its own as the non-destruction proof, it therefore
 * passed VACUOUSLY: a verifier that observed nothing at all, or whose seam had
 * been removed entirely, "proved" that it destroyed nothing. The audit
 * demonstrated exactly that.
 *
 * A proof requires evidence. This predicate demands BOTH: at least one observed
 * statement (so the seam demonstrably ran) AND no destructive statement among
 * them. An empty record is now "unproven", not "proven safe".
 */
export function provedNoDestructiveSql(): boolean {
  return statements.length > 0 && recordedStatementsAreReadOnly();
}

/**
 * THE OBSERVATION SEAM. Wrap a client so every `query` it issues is recorded.
 *
 * The wrapper is a `Proxy` over the live client, so the recording is not
 * something a call site opts into: any statement issued through the object this
 * module holds passes through `query` and is recorded before the driver sees it.
 * That is what makes the record an OBSERVATION of execution rather than a
 * description of intent — and it is why a statement this module never meant to
 * issue could not hide from it.
 *
 * `pg` accepts `query(text)`, `query(text, values)` and `query(config)`; all
 * three are normalized to the SQL text here. Anything unrecognizable is recorded
 * as an explicit unknown-shape marker rather than dropped: an unrecorded
 * statement would be the one thing this seam exists to prevent.
 */
function observeQueries<TClient extends { query: (...args: never[]) => unknown }>(
  client: TClient,
): TClient {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property !== 'query') return Reflect.get(target, property, receiver);
      const original = Reflect.get(target, property, receiver) as TClient['query'];
      return function observedQuery(this: unknown, ...args: unknown[]) {
        statements.push(sqlTextOf(args[0]));
        return (original as (...a: unknown[]) => unknown).apply(target, args);
      };
    },
  });
}

/** The SQL text of a `pg` query argument, in any of its accepted shapes. */
function sqlTextOf(first: unknown): string {
  if (typeof first === 'string') return first;
  if (
    typeof first === 'object' &&
    first !== null &&
    typeof (first as { text?: unknown }).text === 'string'
  ) {
    return (first as { text: string }).text;
  }
  // Never dropped: an unattributable statement is still a statement.
  return `(UNRECOGNIZED QUERY SHAPE: ${typeof first})`;
}

/**
 * Read one estate's canonical content. READ-ONLY: `readStoreSnapshot` issues
 * only `SELECT`s — and that is now OBSERVED rather than asserted, because the
 * client it receives is wrapped by `observeQueries`.
 */
export async function readEstate(connectionString: string): Promise<EstateReading> {
  const host = new PostgresEstateHost({ connectionString });
  try {
    const snapshot: StoreSnapshot = await host.withClient(async (client) =>
      readStoreSnapshot(observeQueries(client)),
    );
    return {
      target: redactConnectionString(connectionString),
      digest: snapshotDigest(snapshot),
      chains: verifyChains(snapshot).map((c) => ({
        estate_id: c.estate_id,
        ok: c.ok,
        length: c.length,
        tail: c.tail ?? null,
      })),
      counts: Object.freeze({
        actors: snapshot.actors.length,
        estates: snapshot.estates.length,
        keyrings: snapshot.keyrings.length,
        assertions: snapshot.assertions.length,
        transitions: snapshot.transitions.length,
        transitionReceipts: snapshot.transitionReceipts.length,
        recallReceipts: snapshot.recallReceipts.length,
        auditEvents: snapshot.auditEvents.length,
      }),
    };
  } finally {
    await host.close();
  }
}

/**
 * Compare an EXISTING source estate with an EXISTING restored target estate,
 * non-destructively.
 *
 * Reads both, compares canonical content, and verifies every per-estate chain on
 * both sides. Reports a MISMATCH when they differ — this is not a vacuous
 * pass: a target missing rows, carrying extra rows, or holding different content
 * produces field-level differences, and a target whose chain does not verify is
 * reported broken even when the content digests agree.
 */
export async function verifyExistingRestore(
  sourceConnectionString: string,
  targetConnectionString: string,
): Promise<VerificationReport> {
  const source = await readEstate(sourceConnectionString);
  const target = await readEstate(targetConnectionString);

  const differences: string[] = [];
  if (source.digest !== target.digest) {
    differences.push(`whole-store digest: source ${source.digest} != target ${target.digest}`);
  }
  for (const table of Object.keys(source.counts)) {
    const a = source.counts[table] ?? 0;
    const b = target.counts[table] ?? 0;
    if (a !== b) differences.push(`${table}: source has ${a} row(s), target has ${b}`);
  }
  const sourceChainKey = JSON.stringify(source.chains);
  const targetChainKey = JSON.stringify(target.chains);
  if (sourceChainKey !== targetChainKey) {
    differences.push('per-estate audit chains differ between source and target');
  }

  const brokenChains = [
    ...source.chains.filter((c) => !c.ok).map((c) => `source:${c.estate_id}`),
    ...target.chains.filter((c) => !c.ok).map((c) => `target:${c.estate_id}`),
  ];

  return {
    ok: differences.length === 0 && brokenChains.length === 0,
    source,
    target,
    differences,
    brokenChains,
  };
}

/**
 * Compare two already-read snapshots. Exposed so a caller holding snapshots (the
 * portability suite, or a test) can reuse the same comparison the CLI reports,
 * and so `compareSnapshots`' field-level differences stay the single definition
 * of "canonically equal".
 */
export function describeSnapshotDifferences(
  source: StoreSnapshot,
  target: StoreSnapshot,
): readonly string[] {
  return compareSnapshots(source, target).differences;
}

function argValue(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index >= 0 && index + 1 < process.argv.length) return process.argv[index + 1];
  const inline = process.argv.find((a) => a.startsWith(`${flag}=`));
  return inline === undefined ? undefined : inline.slice(flag.length + 1);
}

function line(label: string, value: string): void {
  process.stdout.write(`${label.padEnd(34)} ${value}\n`);
}

function report(reading: EstateReading, which: string): void {
  line(`${which} target`, reading.target);
  line(`${which} digest`, reading.digest);
  for (const [table, count] of Object.entries(reading.counts)) {
    line(`  ${which} ${table}`, String(count));
  }
  for (const chain of reading.chains) {
    line(`  ${which} chain ${chain.estate_id}`, `ok=${chain.ok} length=${chain.length} tail=${chain.tail}`);
  }
}

async function main(): Promise<void> {
  // Defaults are the fixed harness instances; explicit connection strings are
  // accepted because NOTHING here can erase what it is pointed at.
  const sourceUrl = argValue('source') ?? sourceHost().connectionString;
  const targetUrl = argValue('target') ?? replacementHost().connectionString;

  process.stdout.write('\n── Phase 50A NON-DESTRUCTIVE restore verification ───────────\n');
  process.stdout.write(
    'Reads both estates and compares them. Issues no DROP, TRUNCATE, DELETE,\n' +
      'reseed or schema-emptying statement: nothing is erased to verify it.\n\n',
  );

  const result = await verifyExistingRestore(sourceUrl, targetUrl);
  report(result.source, 'source');
  report(result.target, 'target');

  process.stdout.write('\n');
  if (result.ok) {
    line('VERIFICATION', 'PASS — estates agree and every chain verifies');
    process.stdout.write(
      '\nThe restored target holds the same canonical content as the source and\n' +
        'every per-estate audit chain verifies identically. Nothing was modified.\n',
    );
    return;
  }

  line('VERIFICATION', 'MISMATCH — do NOT put the target into service');
  for (const difference of result.differences) line('  difference', difference);
  for (const broken of result.brokenChains) line('  broken chain', broken);
  process.stdout.write(
    '\nThe source remains authoritative and UNTOUCHED. Quarantine the target\n' +
      'rather than serving it (P-4), record the differences above verbatim, and\n' +
      'follow §4.4 of the runbook. Re-taking the dump and restoring again is the\n' +
      'next step; erasing either estate is never the next step.\n',
  );
  process.exitCode = 1;
}

// RUN ONLY AS A SCRIPT — importing this module must verify nothing by itself.
if (process.env['VITEST'] === undefined) {
  main().catch((err: unknown) => {
    process.stderr.write(
      '\nPHASE 50A NON-DESTRUCTIVE VERIFICATION: COULD NOT BE PERFORMED\n' +
        `${err instanceof Error ? err.stack : String(err)}\n` +
        '\nNothing was modified. This is NOT a mismatch verdict: the check could\n' +
        'not be carried out, so no conclusion about the estates is available.\n',
    );
    process.exit(2);
  });
}
