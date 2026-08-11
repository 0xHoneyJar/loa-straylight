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
// Exit status is the verdict: 0 = the estates agree, every chain verifies, AND
// every statement this process actually issued was observed and recognized as
// read-only; 1 = a MISMATCH, a broken chain, or reads that do not prove
// themselves (a real defect, reported field by field); 2 = the verification could
// not be performed (unreachable host, bad argument). A mismatch is never reported
// as a pass, and an inability to check is never reported as a mismatch.
//
// That third clause of the PASS is not decoration. It is what the sequence-104
// audit found missing: the observation proof existed but governed nothing, so a
// destructive statement could not have changed the verdict. It governs now — see
// `decideVerification`.

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
  /**
   * What the observation seam actually saw. PART OF THE VERDICT, not commentary:
   * `ok` cannot be true unless `queryProof.proved` is.
   */
  readonly queryProof: QueryProof;
}

/** One statement as the observation seam received it. */
export interface QueryObservation {
  /** How the argument arrived at `client.query`. */
  readonly shape: 'text' | 'config' | 'unobservable';
  /** The SQL text, or `null` when the argument carried none to read. */
  readonly sql: string | null;
  /** The affirmative recognition verdict for this observation. */
  readonly verdict: ObservationVerdict;
}

export type ObservationVerdict =
  | { readonly recognized: true; readonly form: 'read-only-projection' }
  | { readonly recognized: false; readonly reason: string };

/** What the observations, taken together, do or do not prove. */
export interface QueryProof {
  /** How many statements the seam saw. */
  readonly observed: number;
  /** How many of them were affirmatively recognized as read-only. */
  readonly recognized: number;
  /** One entry per observation that was NOT recognized, in order. */
  readonly refusals: readonly string[];
  /** True only when the seam saw something AND recognized all of it. */
  readonly proved: boolean;
}

/**
 * Every statement this module ACTUALLY ISSUED, in order, with its verdict.
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
 * Entries arrive from `observeQueries`, which wraps the client's own `query`
 * method, so every statement that reaches PostgreSQL is recorded BY
 * CONSTRUCTION, at the moment it is issued, whether or not anybody remembered
 * to mention it. A statement this module did not intend to run appears here;
 * under the old scheme it would not have.
 *
 * The record is CUMULATIVE and is never cleared by the verification path, so a
 * statement observed before a verification still counts against it. Callers that
 * want a fresh record call `resetRecordedObservations()` explicitly.
 */
const observations: QueryObservation[] = [];

export function recordedObservations(): readonly QueryObservation[] {
  return [...observations];
}

export function resetRecordedObservations(): void {
  observations.length = 0;
}

/**
 * The ONE statement form this module's read path is allowed to issue, as a
 * grammar rather than a list of spellings: a `SELECT` of bare columns from one
 * bare relation, optionally ordered by bare columns.
 *
 * ── WHY A POSITIVE GRAMMAR AND NOT A DESTRUCTIVE-KEYWORD DENYLIST ─────────
 *
 * The substrate classified statements with
 * `/\b(?:DROP|TRUNCATE|DELETE|…)\b/i` and treated everything it did not match
 * as read-only. The sequence-104 audit rejected that, and the direction of the
 * error is the whole point: a denylist's DEFAULT IS PASS, so every statement
 * form nobody thought of — `SELECT pg_terminate_backend(…)`, `SELECT … INTO`,
 * `WITH x AS (DELETE …) SELECT`, `LOCK`, `SET`, `CALL`, a second statement after
 * a `;`, a `DO $$ … $$` block, anything a future PostgreSQL release adds — was
 * certified safe by omission.
 *
 * This grammar's DEFAULT IS REFUSE. Nothing needs to be enumerated as dangerous,
 * because nothing is permitted that is not recognized. That is also why
 * "destructive" and "state-reducing" are not separate verdicts below: telling
 * them apart would require exactly the denylist that was rejected, and it is
 * unnecessary — they are refused as UNRECOGNIZED, which is strictly stronger
 * than refusing them by name.
 *
 * The grammar is deliberately tight. It admits no parentheses (so no function
 * call, no subquery, no CTE), no `;` (so no second statement), no `--` or slash-
 * star comment, no `INTO`, no `JOIN`, no `WHERE`, no qualified or quoted
 * identifier, and no literal. `readStoreSnapshot`'s eight queries are all it
 * needs to admit, and a NEW read that this grammar does not recognize FAILS
 * CLOSED — which is the correct outcome, because a new read on the
 * "non-destructive verification" path is exactly the change that ought to be
 * looked at rather than assumed benign.
 */
const IDENTIFIER = '[A-Za-z_][A-Za-z0-9_]*';
const ORDER_TERM = `${IDENTIFIER}(?: ASC| DESC)?`;
const READ_ONLY_PROJECTION = new RegExp(
  `^SELECT ${IDENTIFIER}(?:, ${IDENTIFIER})*` +
    ` FROM ${IDENTIFIER}` +
    `(?: ORDER BY ${ORDER_TERM}(?:, ${ORDER_TERM})*)?$`,
  'i',
);

/**
 * Recognize one observed statement, affirmatively. Whitespace is collapsed first
 * because the queries are written as indented template literals; nothing else
 * about the text is rewritten, so what is recognized is what was issued.
 */
export function classifyObservedSql(sql: string): ObservationVerdict {
  const collapsed = sql.replace(/\s+/g, ' ').trim();
  if (READ_ONLY_PROJECTION.test(collapsed)) {
    return { recognized: true, form: 'read-only-projection' };
  }
  return {
    recognized: false,
    reason: `UNRECOGNIZED statement form (not a read-only projection): ${collapsed}`,
  };
}

/** The observation for a `pg` query argument, in any of its accepted shapes. */
function observationOf(first: unknown): QueryObservation {
  if (typeof first === 'string') {
    return { shape: 'text', sql: first, verdict: classifyObservedSql(first) };
  }
  if (
    typeof first === 'object' &&
    first !== null &&
    typeof (first as { text?: unknown }).text === 'string'
  ) {
    const text = (first as { text: string }).text;
    return { shape: 'config', sql: text, verdict: classifyObservedSql(text) };
  }
  // UNOBSERVABLE: a statement was issued whose text this seam cannot read. It is
  // never dropped and never assumed benign — an unattributable statement is
  // still a statement, and one whose text is unavailable cannot be recognized.
  return {
    shape: 'unobservable',
    sql: null,
    verdict: {
      recognized: false,
      reason: `UNOBSERVABLE query argument of type ${typeof first}: its SQL text cannot be read`,
    },
  };
}

/**
 * What the observations prove.
 *
 * ── WHY AN EMPTY RECORD MUST FAIL (sequence-89 audit, F-14) ───────────────
 *
 * "No destructive statement was observed" answers `[].every(…)` — i.e. `true` —
 * over an empty record, so used alone it passed VACUOUSLY: a verifier that
 * observed nothing at all, or whose seam had been removed entirely, "proved"
 * that it destroyed nothing.
 *
 * A proof requires evidence. `proved` therefore demands BOTH: at least one
 * observation (so the seam demonstrably ran) AND affirmative recognition of
 * every one of them. An empty record is "unproven", not "proven safe"; a record
 * with one unrecognized entry is unproven too, however many recognized entries
 * sit beside it.
 */
export function observedQueryProof(): QueryProof {
  const refusals: string[] = [];
  observations.forEach((observation, index) => {
    if (observation.verdict.recognized) return;
    refusals.push(`#${index + 1} [${observation.shape}] ${observation.verdict.reason}`);
  });
  return {
    observed: observations.length,
    recognized: observations.length - refusals.length,
    refusals,
    proved: observations.length > 0 && refusals.length === 0,
  };
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
 * EXPORTED on purpose. The proof of F-14 has to be taken at THIS seam and not at
 * a replica of it: a test that recorded through its own imitation would prove a
 * property of the imitation. Any client-shaped object may be wrapped, which is
 * what lets a test issue a statement through the real seam without a database
 * and without any injection surface existing in the verification path.
 *
 * `pg` accepts `query(text)`, `query(text, values)` and `query(config)`; the
 * first two carry text and the third may. Anything else is recorded as
 * UNOBSERVABLE rather than dropped or assumed benign.
 */
export function observeQueries<TClient extends { query: (...args: never[]) => unknown }>(
  client: TClient,
): TClient {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property !== 'query') return Reflect.get(target, property, receiver);
      const original = Reflect.get(target, property, receiver) as TClient['query'];
      return function observedQuery(this: unknown, ...args: unknown[]) {
        observations.push(observationOf(args[0]));
        return (original as (...a: unknown[]) => unknown).apply(target, args);
      };
    },
  });
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
 * Assemble the verdict from two readings AND the observation proof.
 *
 * ── THE OBSERVATION GOVERNS THE VERDICT (sequence-104 audit, F-14) ────────
 *
 * The substrate computed its non-destruction proof and then THREW IT AWAY:
 * `result.ok` was `differences.length === 0 && brokenChains.length === 0`, and
 * the CLI's PASS branch consulted only that. The proof existed, was correct, and
 * decided nothing — so a run that had issued a `DROP` would still have reported
 * PASS and exited 0. A proof that governs nothing is not a proof.
 *
 * Here `queryProof.proved` is a CONJUNCT of `ok`, on the same footing as the
 * digest comparison. A PASS therefore asserts three things at once: the estates
 * agree, every chain verifies, and the statements this process actually issued
 * were observed and every one of them was affirmatively recognized as read-only.
 * Any destructive, state-reducing, unrecognized or unobservable statement — or no
 * statement at all — makes `ok` false, and `verificationExitCode` turns that into
 * a nonzero exit.
 *
 * Exposed separately from `verifyExistingRestore` so the decision can be
 * exercised over readings and a proof that a test obtained from the REAL seam,
 * without a database and without the verification path holding any injection
 * surface of its own.
 */
export function decideVerification(
  source: EstateReading,
  target: EstateReading,
  queryProof: QueryProof,
): VerificationReport {
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
    ok: differences.length === 0 && brokenChains.length === 0 && queryProof.proved,
    source,
    target,
    differences,
    brokenChains,
    queryProof,
  };
}

/**
 * The process exit status for a report. THE ONLY THING THAT DECIDES IT.
 *
 * `main` assigns `process.exitCode` from this and from nothing else, so the exit
 * status is a function of `report.ok` — and therefore of the observation proof,
 * which is one of its conjuncts. 0 = verified; 1 = not verified, whether because
 * the estates disagree, a chain is broken, or the statements actually issued do
 * not prove a read-only verification.
 */
export function verificationExitCode(report: VerificationReport): number {
  return report.ok ? 0 : 1;
}

/**
 * Compare an EXISTING source estate with an EXISTING restored target estate,
 * non-destructively.
 *
 * Reads both, compares canonical content, verifies every per-estate chain on
 * both sides, and folds in what the observation seam saw. Reports a MISMATCH when
 * they differ — this is not a vacuous pass: a target missing rows, carrying extra
 * rows, or holding different content produces field-level differences, and a
 * target whose chain does not verify is reported broken even when the content
 * digests agree.
 *
 * The observation record is NOT cleared here: a statement observed at any point
 * in this process counts against this verification. That is deliberate — clearing
 * it would let the very statement the proof exists to catch be forgotten before
 * the verdict was taken.
 */
export async function verifyExistingRestore(
  sourceConnectionString: string,
  targetConnectionString: string,
): Promise<VerificationReport> {
  const source = await readEstate(sourceConnectionString);
  const target = await readEstate(targetConnectionString);
  return decideVerification(source, target, observedQueryProof());
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

  // The observations are reported BEFORE the verdict, because they are part of
  // it: a reader can see what was actually issued and why it was accepted.
  line('observed statements', String(result.queryProof.observed));
  line('recognized read-only', String(result.queryProof.recognized));
  for (const refusal of result.queryProof.refusals) line('  REFUSED', refusal);

  process.stdout.write('\n');
  // ONE exit assignment, from ONE decision function, on every path.
  process.exitCode = verificationExitCode(result);
  if (result.ok) {
    line('VERIFICATION', 'PASS — estates agree, every chain verifies, reads observed');
    process.stdout.write(
      '\nThe restored target holds the same canonical content as the source and\n' +
        'every per-estate audit chain verifies identically. Every statement this\n' +
        'process issued was observed and recognized as read-only. Nothing was\n' +
        'modified.\n',
    );
    return;
  }

  line('VERIFICATION', 'MISMATCH — do NOT put the target into service');
  for (const difference of result.differences) line('  difference', difference);
  for (const broken of result.brokenChains) line('  broken chain', broken);
  if (!result.queryProof.proved) {
    line(
      '  unproven reads',
      result.queryProof.observed === 0
        ? 'NO statement was observed: this run proves nothing about what it issued'
        : `${result.queryProof.refusals.length} observed statement(s) were not recognized as read-only`,
    );
  }
  process.stdout.write(
    '\nThe source remains authoritative and UNTOUCHED. Quarantine the target\n' +
      'rather than serving it (P-4), record the differences above verbatim, and\n' +
      'follow §4.4 of the runbook. Re-taking the dump and restoring again is the\n' +
      'next step; erasing either estate is never the next step.\n',
  );
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
