// JsonlStorage — append-only line-delimited JSON files, one per "table".
//
// File layout (under `root`):
//
//   actors.jsonl              upsert: latest line per actor_id wins
//   actor_estates.jsonl       upsert: latest line per estate_id wins
//   keyrings.jsonl            upsert: latest line per keyring_id wins
//   estate_assertions.jsonl   upsert: latest line per assertion_id wins
//   estate_transitions.jsonl  append-only
//   recall_receipts.jsonl     upsert: latest line per receipt_id wins
//   audit_events.jsonl        append-only, hash-chained per estate_id
//
// Each line is a single JSON object — exactly the corresponding primitive
// type. There is no schema header, so files can be concatenated, archived,
// or replayed without parsing rules. Production must replace this with a
// real WAL/DB; this adapter is single-process, single-host only.
//
// Multi-process safety: NOT GUARANTEED. The MVP assumes a single writer.
// fs.appendFileSync is atomic for small writes on POSIX, which is enough
// for tests and local demos.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  Actor,
  ActorEstate,
  Assertion,
  AuditEvent,
  EstateTransition,
  Hash,
  ID,
  Keyring,
  RecallReceipt,
  TransitionReceipt,
} from '../types.js';
import type { StorageAdapter } from './types.js';

const FILES = {
  actors: 'actors.jsonl',
  estates: 'actor_estates.jsonl',
  keyrings: 'keyrings.jsonl',
  assertions: 'estate_assertions.jsonl',
  transitions: 'estate_transitions.jsonl',
  receipts: 'recall_receipts.jsonl',
  transitionReceipts: 'transition_receipts.jsonl',
  audit: 'audit_events.jsonl',
} as const;

export interface JsonlStorageOptions {
  root: string;
  // When true, the adapter creates the directory if missing. Default: true.
  createDirIfMissing?: boolean;
}

export class JsonlStorage implements StorageAdapter {
  readonly root: string;

  constructor(opts: JsonlStorageOptions) {
    this.root = opts.root;
    if (opts.createDirIfMissing !== false && !existsSync(this.root)) {
      mkdirSync(this.root, { recursive: true });
    }
  }

  // ── actors ──────────────────────────────────────────────────────────────────
  upsertActor(a: Actor): void {
    this.append(FILES.actors, a);
  }
  getActor(id: ID): Actor | undefined {
    return this.lastBy<Actor>(FILES.actors, (row) => row.actor_id === id);
  }

  // ── estates ─────────────────────────────────────────────────────────────────
  upsertEstate(e: ActorEstate): void {
    this.append(FILES.estates, e);
  }
  getEstate(id: ID): ActorEstate | undefined {
    return this.lastBy<ActorEstate>(FILES.estates, (row) => row.estate_id === id);
  }

  // ── keyrings ────────────────────────────────────────────────────────────────
  upsertKeyring(k: Keyring): void {
    this.append(FILES.keyrings, k);
  }
  getKeyring(id: ID): Keyring | undefined {
    return this.lastBy<Keyring>(FILES.keyrings, (row) => row.keyring_id === id);
  }

  // ── assertions ──────────────────────────────────────────────────────────────
  upsertAssertion(a: Assertion): void {
    this.append(FILES.assertions, a);
  }
  getAssertion(id: ID): Assertion | undefined {
    return this.lastBy<Assertion>(FILES.assertions, (row) => row.assertion_id === id);
  }
  listAssertions(estate_id: ID): Assertion[] {
    const latest = new Map<ID, Assertion>();
    for (const row of this.readAll<Assertion>(FILES.assertions)) {
      if (row.estate_id === estate_id) latest.set(row.assertion_id, row);
    }
    return [...latest.values()];
  }

  // ── transitions ─────────────────────────────────────────────────────────────
  appendTransition(t: EstateTransition): void {
    this.append(FILES.transitions, t);
  }
  listTransitions(estate_id: ID): EstateTransition[] {
    return this.readAll<EstateTransition>(FILES.transitions).filter(
      (t) => t.estate_id === estate_id,
    );
  }

  // ── recall receipts ─────────────────────────────────────────────────────────
  upsertRecallReceipt(r: RecallReceipt): void {
    this.append(FILES.receipts, r);
  }
  getRecallReceipt(id: ID): RecallReceipt | undefined {
    return this.lastBy<RecallReceipt>(FILES.receipts, (row) => row.receipt_id === id);
  }

  // ── transition receipts ─────────────────────────────────────────────────────
  upsertTransitionReceipt(r: TransitionReceipt): void {
    this.append(FILES.transitionReceipts, r);
  }
  getTransitionReceipt(id: ID): TransitionReceipt | undefined {
    return this.lastBy<TransitionReceipt>(FILES.transitionReceipts, (row) => row.receipt_id === id);
  }
  listTransitionReceipts(estate_id: ID): TransitionReceipt[] {
    return this.readAll<TransitionReceipt>(FILES.transitionReceipts).filter(
      (r) => r.estate_id === estate_id,
    );
  }

  // ── audit events ────────────────────────────────────────────────────────────
  appendAuditEvent(e: AuditEvent): void {
    this.append(FILES.audit, e);
  }
  listAuditEvents(estate_id?: ID): AuditEvent[] {
    const all = this.readAll<AuditEvent>(FILES.audit);
    if (estate_id === undefined) return all;
    return all.filter((e) => e.estate_id === estate_id);
  }
  getAuditTail(estate_id: ID): Hash | undefined {
    let tail: Hash | undefined;
    for (const row of this.readAll<AuditEvent>(FILES.audit)) {
      if (row.estate_id === estate_id) tail = row.audit_hash;
    }
    return tail;
  }

  // ── internals ───────────────────────────────────────────────────────────────

  private path(file: string): string {
    return join(this.root, file);
  }

  private append(file: string, row: unknown): void {
    appendFileSync(this.path(file), JSON.stringify(row) + '\n', 'utf8');
  }

  private readAll<T>(file: string): T[] {
    const p = this.path(file);
    if (!existsSync(p)) return [];
    const text = readFileSync(p, 'utf8');
    if (text.length === 0) return [];
    const out: T[] = [];
    let lineNo = 0;
    for (const line of text.split('\n')) {
      lineNo += 1;
      if (line.length === 0) continue;
      try {
        out.push(JSON.parse(line) as T);
      } catch (err) {
        throw new Error(
          `JsonlStorage: malformed JSON at ${file}:${lineNo}: ${(err as Error).message}`,
        );
      }
    }
    return out;
  }

  private lastBy<T>(file: string, predicate: (row: T) => boolean): T | undefined {
    let last: T | undefined;
    for (const row of this.readAll<T>(file)) {
      if (predicate(row)) last = row;
    }
    return last;
  }
}
