// PostgresEstateHost — the ASYNCHRONOUS boundary around the SYNCHRONOUS
// StorageAdapter seam.
//
// This is the only place in the canonical store that touches the network,
// and it is explicitly asynchronous. The public StorageAdapter, EstateStore,
// AuditLog, and recall contracts are untouched and remain synchronous
// (ADR-049Q §13.2 "Semantics unchanged"; the packet's non-goals).
//
// `withEstateSession` is the whole boundary, and its order is fixed:
//
//    1. acquire a pooled connection and BEGIN;
//    2. assert the schema version (fail closed if not current);
//    3. establish per-estate serialization (advisory xact lock, then the
//       estate row lock when the row exists);
//    4. load the transaction-scoped CanonicalState snapshot;
//    5. hand a synchronous PostgresAdapterSession over that snapshot to ONE
//       bounded callback, and REFUSE a Promise-like return value before
//       anything else happens (see `isThenable` / `absorbSettlement` below);
//    6. close the session, computing its deterministic delta;
//    7. re-verify the immutable append prefix is unchanged and the audit
//       chain still verifies with the delta applied;
//    8. persist the delta;
//    9. COMMIT;
//   10. return the callback's value — AFTER the commit succeeded.
//
// Any failure at any step ROLLBACKs and throws. There is no path that
// returns a value without a completed COMMIT, no write outside the
// transaction, and no fallback to another adapter after PostgreSQL
// uncertainty.

import { Pool } from 'pg';
import type { PoolClient } from 'pg';

import { AuditLog } from '../../audit.js';
import type { ID } from '../../types.js';
import type { StorageAdapter } from '../types.js';
import {
  PostgresIntegrityError,
  PostgresUnavailableError,
} from './errors.js';
import type { PostgresStoreConfig, ResolvedPostgresStoreConfig } from './config.js';
import { redactConnectionString, resolveConfig } from './config.js';
import type { CanonicalDelta, CanonicalState } from './canonical-state.js';
import { isDeltaEmpty } from './canonical-state.js';
import {
  assertChainIntact,
  assertPrefixUnchanged,
  fingerprintAppendPrefix,
  fingerprintOf,
  loadEstateState,
} from './load.js';
import { persistDelta } from './persist.js';
import type { PersistResult } from './persist.js';
import { assertSchemaVersion, migrate, rollback } from './migrate.js';
import { PostgresAdapterSession } from './session.js';
import * as Q from './queries.js';

export interface EstateSessionResult<T> {
  value: T;
  /** True when the transaction committed. Always true on a returned result. */
  committed: true;
  persisted: PersistResult;
}

export class PostgresEstateHost {
  private readonly pool: Pool;
  private readonly config: ResolvedPostgresStoreConfig;
  private closed = false;

  constructor(config: PostgresStoreConfig) {
    this.config = resolveConfig(config);
    this.pool = new Pool({
      connectionString: this.config.connectionString,
      max: this.config.maxConnections,
      connectionTimeoutMillis: this.config.connectionTimeoutMs,
    });
    // An IDLE pooled connection that the server drops (restart, admin
    // termination, network loss) emits an asynchronous `error` on the pool.
    // With no listener Node treats it as an unhandled exception and takes the
    // process down — a store whose backend blipped must fail the affected
    // operation, not kill its host. The broken connection is discarded by the
    // pool either way; every in-flight operation still fails closed through
    // its own rejection path, and the next acquisition gets a fresh
    // connection or a `connection_failed`.
    this.pool.on('error', () => {
      /* discarded: see above. Never a success signal, never a fallback. */
    });
  }

  /** Human-readable target, credential removed. Safe for logs and errors. */
  describeTarget(): string {
    return redactConnectionString(this.config.connectionString);
  }

  /** Apply every shipped canonical migration. Idempotent. */
  async migrate(): Promise<string[]> {
    return this.withClient((client) => migrate(client));
  }

  /** Roll one canonical migration back. Non-production use (ADR-049Q §13.2). */
  async rollback(version: string): Promise<boolean> {
    return this.withClient((client) => rollback(client, version));
  }

  /**
   * Open a transaction-scoped synchronous adapter session over one estate,
   * run `body`, and commit before returning. See the module header for the
   * exact ordering guarantee.
   *
   * `body` MUST be synchronous. The session it receives performs no I/O and
   * lives only for the duration of the call, so there is nothing for a
   * callback to await — and code resuming after an `await` would run after
   * the transaction had already been decided. A callback that returns a
   * Promise or any other thenable is therefore REFUSED (see
   * `isThenable` / `absorbSettlement`), not awaited: this is not an
   * asynchronous-callback feature, and `Awaited<T>` never appears in this
   * signature.
   */
  async withEstateSession<T>(
    estate_id: ID,
    body: (storage: StorageAdapter) => T,
  ): Promise<EstateSessionResult<T>> {
    this.assertOpen();
    const checkout = await this.checkout();
    const client = checkout.client;
    let began = false;
    let session: PostgresAdapterSession | undefined;
    try {
      await client.query('BEGIN');
      began = true;
      if (this.config.statementTimeoutMs > 0) {
        await client.query(`SET LOCAL statement_timeout = ${this.config.statementTimeoutMs}`);
      }
      await assertSchemaVersion(client, this.config.requiredSchemaVersions);

      // Per-estate serialization. The advisory lock covers the bootstrap case
      // (no estate row exists yet); the row lock covers every later session.
      // Taking BOTH means two sessions on the same estate always serialize,
      // whether or not the estate row already exists, while sessions on
      // DIFFERENT estates never contend (different lock keys, different rows).
      await client.query(Q.LOCK_ESTATE_ADVISORY, [estate_id]);
      await client.query(Q.LOCK_ESTATE, [estate_id]);

      const state = await loadEstateState(client, estate_id);
      const loadedFingerprint = fingerprintOf(state, estate_id);

      session = new PostgresAdapterSession(state);
      const value = body(session);

      // FIRST thing after the callback returns, before `session.close()`,
      // before `persistDelta`, and before COMMIT: refuse a Promise-like
      // return value. The refusal invalidates the session (so any code
      // resuming after an `await` inside the callback finds it closed and
      // throws instead of mutating a decided transaction), absorbs the
      // thenable's eventual settlement (so a later rejection cannot surface
      // as an unhandled rejection), and throws — which routes into the
      // catch below, ROLLBACKs, and leaves nothing durable.
      if (isThenable(value)) {
        session.abandon();
        session = undefined;
        absorbSettlement(value);
        throw new PostgresUnavailableError(
          'async_callback_unsupported',
          'withEstateSession requires a SYNCHRONOUS callback; the callback returned a ' +
            'Promise-like value, so the session was invalidated and the transaction ' +
            'rolled back without persisting anything',
        );
      }

      const delta = session.close();
      session = undefined;

      if (!isDeltaEmpty(delta)) {
        // The prefix we appended onto must still be the live prefix.
        const liveFingerprint = await fingerprintAppendPrefix(client, estate_id);
        assertPrefixUnchanged(estate_id, loadedFingerprint, liveFingerprint);
        // The chain, with this session's appends included, must verify with
        // the existing verifier before anything is written.
        assertChainIntact(state, estate_id);
      }

      const persisted = await persistDelta(client, delta);

      // Post-write verification, still inside the transaction: re-read the
      // estate's durable audit chain and require the EXISTING verifier to
      // accept it. If this fails the COMMIT never happens.
      await assertDurableChainIntact(client, estate_id);

      await client.query('COMMIT');
      return { value, committed: true, persisted };
    } catch (err) {
      session?.abandon();
      if (began) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // The connection is unusable. `checkout.release(true)` below DESTROYS
          // it rather than recycling it, so a poisoned connection is never
          // handed to a later session. The transaction is aborted either way,
          // so nothing this session attempted is durable.
        }
      }
      checkout.release(true);
      throw this.classify(err);
    } finally {
      checkout.release(false);
    }
  }

  /** Read-only convenience: load one estate's canonical state. */
  async readEstateState(estate_id: ID): Promise<CanonicalState> {
    this.assertOpen();
    return this.withClient(async (client) => {
      await assertSchemaVersion(client, this.config.requiredSchemaVersions);
      return loadEstateState(client, estate_id);
    });
  }

  /** Every estate id present in the store, ascending. */
  async listEstateIds(): Promise<ID[]> {
    this.assertOpen();
    return this.withClient(async (client) => {
      await assertSchemaVersion(client, this.config.requiredSchemaVersions);
      const result = await client.query<{ estate_id: string }>(Q.SELECT_ALL_ESTATE_IDS);
      return result.rows.map((r) => r.estate_id);
    });
  }

  /** Run `body` with a raw pooled client. Used by the proof/ops helpers. */
  async withClient<T>(body: (client: PoolClient) => Promise<T>): Promise<T> {
    this.assertOpen();
    const checkout = await this.checkout();
    try {
      return await body(checkout.client);
    } catch (err) {
      // Destroy rather than recycle: `body` may have left the connection in an
      // aborted transaction or the server may have closed it outright.
      checkout.release(true);
      throw this.classify(err);
    } finally {
      checkout.release(false);
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.pool.end();
  }

  // ── internals ─────────────────────────────────────────────────────────

  private assertOpen(): void {
    if (this.closed) {
      throw new PostgresUnavailableError(
        'session_closed',
        `host for ${this.describeTarget()} is closed`,
      );
    }
  }

  /**
   * Check a connection out of the pool with its own `error` listener attached,
   * and return an idempotent release.
   *
   * The listener matters: a checked-out client whose backend the server
   * terminates emits `error` asynchronously, and `pg` clients are
   * EventEmitters — an unlistened `error` becomes an unhandled exception and
   * takes the process down. The operation itself still fails closed through its
   * own rejection; this only stops a server-side disconnect from being fatal to
   * the host process.
   *
   * `release(true)` DESTROYS the connection instead of returning it to the
   * pool, so a connection left in an aborted transaction — or already closed —
   * is never reused by a later session.
   */
  private async checkout(): Promise<{
    client: PoolClient;
    release: (destroy: boolean) => void;
  }> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch (err) {
      throw new PostgresUnavailableError(
        'connection_failed',
        `could not acquire a connection to ${this.describeTarget()}: ${describe(err)}`,
      );
    }
    const swallow = (): void => {
      /* see above: the operation's own rejection is the failure signal. */
    };
    client.on('error', swallow);
    let released = false;
    return {
      client,
      release: (destroy: boolean) => {
        if (released) return;
        released = true;
        client.removeListener('error', swallow);
        // `release(err)` with a truthy argument is node-postgres' documented
        // way to discard a connection rather than return it to the pool.
        client.release(destroy ? new Error('straylight: discarding connection') : undefined);
      },
    };
  }

  /**
   * Map a driver/database error onto the store's own error classes. Integrity
   * errors pass through unchanged; everything else becomes an availability
   * failure. Neither is ever converted into a successful result, and no
   * branch here falls back to another adapter.
   */
  private classify(err: unknown): unknown {
    if (err instanceof PostgresIntegrityError) return err;
    if (err instanceof PostgresUnavailableError) return err;
    return new PostgresUnavailableError('transaction_aborted', describe(err));
  }
}

/**
 * Re-read the durable chain and verify it with `AuditLog.verifyChain`. Runs
 * after the delta is written and before COMMIT, so a write that would have
 * left a broken chain aborts the transaction instead of committing it.
 */
async function assertDurableChainIntact(client: PoolClient, estate_id: ID): Promise<void> {
  const state = await loadEstateState(client, estate_id);
  const probe = new PostgresAdapterSession(state);
  const verdict = new AuditLog(probe).verifyChain(estate_id);
  probe.abandon();
  if (!verdict.ok) {
    throw new PostgresIntegrityError(
      'audit_chain_broken',
      `post-write chain verification failed for estate ${estate_id} at index ` +
        `${verdict.broken_at}: ${verdict.reason}`,
    );
  }
}

/**
 * Is this value Promise-like? True for a native Promise and for any thenable
 * (an object or function with a callable `then`), which is exactly the set of
 * values `await` would treat asynchronously.
 *
 * The `then` property is read ONCE here, and `absorbSettlement` reuses that
 * same read rather than touching the value again — a hostile thenable with a
 * getter that returns a different `then` on each access therefore cannot make
 * the two functions disagree about what it is.
 */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  if (value === null) return false;
  const t = typeof value;
  if (t !== 'object' && t !== 'function') return false;
  return typeof (value as { then?: unknown }).then === 'function';
}

/**
 * Settle a refused thenable safely: attach a handler so its eventual outcome
 * — resolution OR rejection, immediate or delayed — is consumed and can never
 * become an unhandled rejection that escapes into the process.
 *
 * The outcome is DISCARDED, not reported: the operation has already been
 * refused and rolled back, so neither a late value nor a late error can change
 * what happened. `then` is invoked defensively because a caller-supplied
 * thenable is untrusted input — a `then` that throws synchronously must not
 * displace the refusal error this function's caller is about to throw.
 */
function absorbSettlement(value: PromiseLike<unknown>): void {
  const swallow = (): void => {
    /* discarded: the operation was refused and rolled back before this
       settled; a late outcome is not a result and not a second failure. */
  };
  try {
    // Not `Promise.resolve(value)`: adopting the thenable would require
    // calling `then` anyway, and doing it directly keeps a hostile `then`'s
    // synchronous throw inside this try.
    const attached = value.then(swallow, swallow);
    // A well-behaved `then` returns another thenable; if that one can itself
    // reject (a subclass overriding `then`), absorb it too.
    if (isThenable(attached)) {
      try {
        attached.then(swallow, swallow);
      } catch {
        /* see below */
      }
    }
  } catch {
    // A thenable whose `then` throws synchronously never scheduled anything,
    // so there is nothing left to absorb. The refusal stands.
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export type { CanonicalDelta };
