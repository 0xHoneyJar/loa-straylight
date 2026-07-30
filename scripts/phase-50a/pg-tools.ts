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

import { execFileSync } from 'node:child_process';

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
  const sql = execFileSync('docker', args, {
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
  execFileSync('docker', args, {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { command: `docker ${args.join(' ')}`, bytes: Buffer.byteLength(sql, 'utf8') };
}

/** Run one `psql -c <sql>` statement and return its unaligned output. */
export function psqlExec(target: PgToolTarget, sql: string): string {
  return execFileSync(
    'docker',
    [
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
    ],
    { encoding: 'utf8' },
  ).trim();
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
