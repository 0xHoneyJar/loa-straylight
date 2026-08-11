// Ordinary PostgreSQL export/restore, driven through the standard client tools.
//
// ADR-049Q §13.1(e), §11.4; P-6, P-7: the export must be "ordinary" and
// "provider-neutral", and the restore must be proven rather than assumed. So
// this module invokes `pg_dump` and `psql` — the tools any PostgreSQL operator
// already has — and adds no bespoke format. A custom serializer would prove
// only that the custom serializer round-trips.
//
// The tools run INSIDE the harness containers via `docker exec`, because the
// Phase 50A harness deliberately ships no client binaries on the host. Nothing
// about the DUMP is container-specific: it is a plain SQL file produced by
// stock `pg_dump`, and the runbook documents the identical commands for an
// operator running the tools directly.
//
// ── THE TOOL-INVOCATION SEAM (sequence-83 audit, F-09/F-10) ───────────────
//
// Every `docker` invocation in this module goes through `runDockerTool`, which
// GATES the target and then records the attempt (readable via
// `toolInvocations()`) BEFORE it spawns anything. A negative control can
// therefore prove that a refused target produced ZERO tool invocations by
// OBSERVING the record, rather than inferring it from an error having been
// thrown — an error alone cannot distinguish "refused before acting" from
// "acted, then failed".

import { execFileSync } from 'node:child_process';

import { ProofHostRefusedError, authorizedToolTarget } from './hosts.js';

export interface PgToolTarget {
  /** Container the PostgreSQL server runs in. */
  container: string;
  /** Database user. */
  user: string;
  /** Database name. */
  database: string;
}

export interface CommandRecord {
  command: string;
  bytes?: number;
}

/** One observed tool invocation: what was about to run, on which database. */
export interface ToolInvocation {
  /** The executable. Always `docker` here. */
  readonly file: string;
  /** The exact argv array handed to it. */
  readonly argv: readonly string[];
  /** The client tool inside the container — `pg_dump` or `psql`. */
  readonly tool: string;
  /** The database the invocation targets. */
  readonly database: string;
}

const invocations: ToolInvocation[] = [];

/**
 * Every tool invocation attempted in this process, in order.
 *
 * The record is APPEND-ONLY and populated before the spawn, so a caller that
 * refused a target leaves it untouched. Tests read it through
 * `toolInvocations()` and clear it with `resetToolInvocations()`.
 */
export function toolInvocations(): readonly ToolInvocation[] {
  return [...invocations];
}

/** Clear the observation record. For tests establishing a known baseline. */
export function resetToolInvocations(): void {
  invocations.length = 0;
}

/**
 * THE TOOL GATE. Every client-tool invocation in this module passes through
 * here, and every one must be aimed at a target the harness ISSUED — either
 * `hosts.toolTargetOf` for a fixed descriptor's own database, or
 * `hosts.createScratchDatabase` for a database it actually created — so every
 * target derives from a descriptor that already passed `resolveProofHost`
 * (F-09/F-10).
 *
 * SEQUENCE-104: a database NAME is no longer a route to issuance. The gate is
 * unchanged because it never trusted names in the first place; what changed is
 * that the only other issuer is now an act of creation, so "issued" implies
 * "created by us" rather than "declared to us".
 *
 * Checked BEFORE the invocation is recorded and before anything is spawned, so
 * a hand-built target — a foreign container, a non-harness database, a copy of
 * a real target with one field edited — produces ZERO tool invocations and ZERO
 * destructive work, observably, on the record below.
 *
 * SEQUENCE-89: the gate delegates to `hosts.authorizedToolTarget`, which checks
 * ISSUANCE **and** that the target's current fields still equal the ones it was
 * issued with. Issuance identity alone accepted a spread copy whose `database`
 * had drifted from the descriptor that authorized it; the field comparison is
 * what closes that. The returned descriptor is discarded here — the point is
 * the refusal, and the caller has already fixed its argv from the target.
 */
function requireIssuedTarget(target: PgToolTarget, tool: string): void {
  try {
    authorizedToolTarget(target);
  } catch (error) {
    // Re-thrown with the tool named, so the record shows WHICH invocation was
    // refused. The cause carries the structural reason unchanged.
    throw new ProofHostRefusedError(
      `phase-50a: refusing to run ${tool} against an unauthorized tool target. ` +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

/**
 * The ONE place this module spawns a process.
 *
 * Gates the target, records the attempt, then runs a FIXED executable with an
 * argv ARRAY and no shell — the same launch discipline the proof executor uses,
 * so no value here is ever interpreted by a shell.
 */
function runDockerTool(
  target: PgToolTarget,
  argv: readonly string[],
  tool: string,
  options: Parameters<typeof execFileSync>[2],
): string {
  requireIssuedTarget(target, tool);
  invocations.push(
    Object.freeze({
      file: 'docker',
      argv: Object.freeze([...argv]),
      tool,
      database: target.database,
    }),
  );
  return execFileSync('docker', [...argv], options) as unknown as string;
}

/**
 * Plain-SQL logical dump of one database. `--no-owner` / `--no-privileges` keep
 * the dump portable across hosts whose role names differ — which is exactly the
 * provider-replacement case (P-6, P-8).
 */
export function pgDump(target: PgToolTarget): { sql: string; record: CommandRecord } {
  const args = [
    'exec',
    target.container,
    'pg_dump',
    '--no-owner',
    '--no-privileges',
    '-U',
    target.user,
    '-d',
    target.database,
  ];
  const sql = runDockerTool(target, args, 'pg_dump', {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  return {
    sql,
    record: {
      command: `docker ${args.join(' ')}`,
      bytes: Buffer.byteLength(sql, 'utf8'),
    },
  };
}

/** Restore a plain-SQL dump into a database, failing on the first error. */
export function psqlRestore(target: PgToolTarget, sql: string): CommandRecord {
  const args = [
    'exec',
    '-i',
    target.container,
    'psql',
    '--set',
    'ON_ERROR_STOP=1',
    '-U',
    target.user,
    '-d',
    target.database,
  ];
  runDockerTool(target, args, 'psql', {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { command: `docker ${args.join(' ')}`, bytes: Buffer.byteLength(sql, 'utf8') };
}

/** Run one `psql -c <sql>` statement and return its unaligned output. */
export function psqlExec(target: PgToolTarget, sql: string): string {
  const args = [
    'exec',
    target.container,
    'psql',
    '--set',
    'ON_ERROR_STOP=1',
    '-tA',
    '-U',
    target.user,
    '-d',
    target.database,
    '-c',
    sql,
  ];
  return runDockerTool(target, args, 'psql', { encoding: 'utf8' }).trim();
}

/**
 * The cluster's system identifier. Two PostgreSQL servers initialized
 * separately have different identifiers, so comparing them is a MECHANICAL
 * proof that source and replacement are genuinely distinct instances — not one
 * server addressed twice, which the packet's stop conditions forbid.
 */
export function clusterSystemIdentifier(target: PgToolTarget): string {
  return psqlExec(target, 'SELECT system_identifier FROM pg_control_system()');
}
