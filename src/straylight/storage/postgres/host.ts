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
//       bounded callback, and REFUSE a Promise-like return value — or one whose
//       thenability cannot be determined at all — before anything else happens
//       (see `captureThen` / `absorbSettlement` below);
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
import { resolveConfig } from './config.js';
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

/**
 * A NON-SECRET target descriptor, DECLARED BY THE CALLER from its own trusted
 * knowledge of where this host connects — never parsed from the connection
 * string and never read back from `pg`.
 *
 * ── WHY IT IS DECLARED, NOT RESOLVED (sequence-116 audit, F-04) ───────────
 *
 * The rejected mechanism read the target's host, port and database off the
 * `pg` client `pg` built for this pool. Those values are `pg`'s interpretation
 * of the connection string, and that interpretation is attacker-reachable: a
 * `user` with no explicit database becomes the database fallback; a `host`
 * supplied in the query part reaches the resolved fields; and the LAST client
 * `pg` happened to build overwrote a single host-level record, so the identity
 * printed was whichever client connected most recently. A diagnostic built from
 * any of those prints connection-string-derived material it cannot bound.
 *
 * So identity is not resolved from the connection at all. A caller that KNOWS,
 * from its own fixed configuration, which non-secret target this host addresses
 * may declare it here, and `describeTarget()` renders THAT and only that. A
 * caller that declares none gets a constant unresolved identity — the store
 * SAYS LESS rather than reconstructing something from the connection string.
 * There is no `user`, no `password` and no query material, because this type
 * exists to be PRINTED and a credential is not a thing a diagnostic needs.
 */
export interface TrustedTargetDescriptor {
  /** Non-secret host label the caller declares for this target. */
  readonly host: string;
  /** Non-secret port the caller declares for this target. */
  readonly port: number;
  /** Non-secret database name the caller declares for this target. */
  readonly database: string;
}

/** Options a caller may supply alongside the opaque store config. */
export interface PostgresEstateHostOptions {
  /**
   * The non-secret identity of this host's target, declared by the caller. When
   * present, `describeTarget()` names it with the userinfo position redacted;
   * when absent, `describeTarget()` names the target as unresolved rather than
   * deriving anything from the connection string (F-04).
   */
  readonly target?: TrustedTargetDescriptor;
}

/**
 * The userinfo stand-in in a rendered target. The rendered form keeps the shape
 * of a connection URI so an operator reads it as one, but the credential
 * position is a CONSTANT: nothing from the connection string is ever put here,
 * so there is nothing to redact incorrectly.
 */
const REDACTED_USERINFO = '<redacted>';

/**
 * What a target is called when the caller declared no trusted descriptor. It
 * SAYS LESS rather than parsing something to say more (F-04): an identity the
 * store cannot establish from trusted data is named as unestablished, never
 * reconstructed from credential-bearing material.
 */
const UNRESOLVED_TARGET = '<target unresolved>';

/** Render a target for an operator. Total, allocation-only, cannot throw. */
function renderTarget(target: TrustedTargetDescriptor | undefined): string {
  if (target === undefined) return `postgresql://${REDACTED_USERINFO}@${UNRESOLVED_TARGET}`;
  return `postgresql://${REDACTED_USERINFO}@${target.host}:${String(target.port)}/${target.database}`;
}

/**
 * A private marker that carries a value THROWN by a caller's bounded callback
 * out to the shared catch — so the transaction is rolled back on the ONE path
 * that rolls back — and is then unwrapped by `classify`, which returns the
 * caller's OWN error UNCHANGED.
 *
 * A callback throw is the caller's authored exception, not a driver or database
 * failure this store composes a diagnostic for. Routing it through the
 * `transaction_aborted` path would do two wrong things: replace the caller's
 * error with a store error the caller never threw, and PUBLISH caller-supplied
 * `Error.message` text as the store's own diagnostic. Tagging it here keeps
 * both from happening — the value returns to the caller exactly as thrown,
 * while the driver/database refusal path (`databaseRefusalReason`) continues to
 * report only the database's own SQLSTATE-gated reason.
 *
 * Never exported and never escapes the module: created at the callback boundary
 * in `withEstateSession` (whose body is the caller's own storage callback), read
 * only in `classify`. `withClient` is deliberately NOT wrapped — its body runs
 * raw queries whose driver/database failure IS a `transaction_aborted` result.
 */
class CallbackThrew {
  constructor(readonly thrown: unknown) {}
}

export class PostgresEstateHost {
  private readonly pool: Pool;
  private readonly config: ResolvedPostgresStoreConfig;
  private closed = false;
  /**
   * The caller-declared non-secret target, or `undefined` when none was
   * declared. FIXED at construction and frozen — it is the caller's own account
   * of where this host connects, not a value `pg` resolved and not one that
   * changes as clients come and go.
   *
   * ── WHY IT IS DECLARED AND NOT RESOLVED (sequence-116 audit, F-04) ──────
   *
   * The rejected mechanism captured this off `pg`'s client, so the identity the
   * store printed was `pg`'s interpretation of the connection string: the
   * username could stand in for the database, a query-supplied host reached the
   * field, and the LAST client `pg` built overwrote the record. Diagnostics
   * built from that print connection-string-derived material the store cannot
   * bound. So nothing is captured off `pg` any more. Identity is either the
   * caller's own trusted descriptor (declared here) or the `UNRESOLVED_TARGET`
   * constant — never a value read back from the driver. See
   * `TrustedTargetDescriptor` for the full rationale.
   */
  private readonly target: TrustedTargetDescriptor | undefined;

  constructor(config: PostgresStoreConfig, options: PostgresEstateHostOptions = {}) {
    this.config = resolveConfig(config);
    // Frozen COPY of the caller's declared descriptor (or `undefined`). A copy,
    // not the caller's object: the identity this host prints is fixed at
    // construction and cannot be mutated afterward through a retained reference.
    this.target =
      options.target === undefined
        ? undefined
        : Object.freeze({
            host: options.target.host,
            port: options.target.port,
            database: options.target.database,
          });
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

  /**
   * Human-readable target, credential removed. Safe for logs and errors.
   *
   * THE SOLE PRODUCTION EMITTER of target identity, and it emits only
   * `postgresql://<redacted>@<host>:<port>/<database>` — the userinfo position
   * is the constant `<redacted>` and there is NO query string, so no part of
   * the connection string's credential-bearing material is rendered in any
   * form, decoded or otherwise. Nothing here inspects the connection string:
   * the components come from the caller's own trusted descriptor (`this.target`)
   * when one was declared, and NOTHING is read back from `pg` (F-04). A host
   * whose caller declared no descriptor renders `<target unresolved>` — it SAYS
   * LESS rather than reconstructing an identity from connection material it
   * cannot bound.
   *
   * TOTAL. It runs inside error construction (`assertOpen`, `checkout`), where
   * throwing would replace a diagnostic with a different failure, so there is
   * no input it can reject.
   */
  describeTarget(): string {
    return renderTarget(this.target);
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
   * `captureThen` / `absorbSettlement`), not awaited: this is not an
   * asynchronous-callback feature, and `Awaited<T>` never appears in this
   * signature. The detection reads `then` exactly once (`captureThen`), so a
   * hostile getter cannot be observed twice — and a `then` getter that THROWS
   * on that one access is refused too, because a value whose thenability the
   * store failed to inspect cannot be shown to be a synchronous result.
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

      // The session is BOUND to the estate this transaction locked and loaded
      // (R2). That binding is the store's estate authority: every append-only
      // write must declare exactly this estate, and a record naming any other is
      // refused as an integrity violation that rolls the transaction back. A
      // record cannot vouch for its own estate; the locked estate can.
      session = new PostgresAdapterSession(state, estate_id);
      let value: T;
      try {
        value = body(session);
      } catch (callbackErr) {
        // The caller's OWN callback threw. Re-raise through the shared catch so
        // the transaction rolls back on the single path that does so, tagged as
        // a callback throw — `classify` returns it to the caller unchanged
        // rather than composing a store diagnostic from it.
        throw new CallbackThrew(callbackErr);
      }

      // FIRST thing after the callback returns, before `session.close()`,
      // before `persistDelta`, and before COMMIT: refuse a return value that
      // is Promise-like — or whose thenability cannot be determined at all.
      // The `then` property is read EXACTLY ONCE, here, and the captured
      // function is what gets invoked — see `captureThen`. Both refusals
      // invalidate the session (so any code resuming after an `await` inside
      // the callback finds it closed and throws instead of mutating a decided
      // transaction) and throw — which routes into the catch below, ROLLBACKs,
      // and leaves nothing durable. Only the `thenable` case has a settlement
      // to absorb, through that same captured function, so that a later
      // rejection cannot surface as an unhandled rejection.
      //
      // ONLY a value proven NON-thenable reaches the commit path below. There
      // is deliberately no third disposition: an inspection that fails is a
      // refusal, never a synchronous success.
      const outcome = captureThen(value);
      // TOTAL dispatch over `ThenReadOutcome`. A `switch` with an
      // `assertNever` default rather than a sequence of `if`s: the default
      // arm's parameter is `never`, so a FOURTH variant added to the union
      // stops compiling here (`npm run typecheck` fails) instead of silently
      // falling through to `session.close()`, `persistDelta`, and COMMIT the
      // way an unmatched `if` chain would. Only `not-thenable` — a value
      // PROVEN non-thenable — leaves this switch and reaches the commit path;
      // every other arm throws.
      switch (outcome.kind) {
        case 'thenable': {
          session.abandon();
          session = undefined;
          absorbSettlement(outcome.captured);
          throw new PostgresUnavailableError(
            'async_callback_unsupported',
            'withEstateSession requires a SYNCHRONOUS callback; the callback returned a ' +
              'Promise-like value, so the session was invalidated and the transaction ' +
              'rolled back without persisting anything',
          );
        }
        case 'unreadable': {
          // The `then` getter threw on its only access, so whether this value
          // is Promise-like is UNDECIDABLE. Refuse on the same path and at the
          // same point as a thenable: invalidate the session first, then throw
          // into the catch below, which ROLLBACKs. Nothing is absorbed because
          // nothing was captured or scheduled.
          //
          // NOTHING of the getter's own exception crosses this boundary. The
          // refusal message is a FIXED string: no message, no stack, no cause,
          // no identity, and no stringification of the caller's value appears
          // in it — `captureThen` does not even carry the exception out of its
          // catch, so there is nothing here to leak. The previous shape
          // interpolated `describe(outcome.error)`, which (a) published an
          // adversarial getter's message through the store's public error and
          // (b) let a value whose own conversion-to-string throws escape this
          // frame entirely, so the ORIGINAL object reached the caller in place
          // of the bounded refusal. A single bounded reason is the whole
          // contract callers match on.
          session.abandon();
          session = undefined;
          throw new PostgresUnavailableError(
            'async_callback_unsupported',
            'withEstateSession could not determine whether the callback\'s return value ' +
              'was Promise-like: reading its `then` property threw, so the value was ' +
              'refused as undecidable. The session was invalidated and the transaction ' +
              'rolled back without persisting anything. The inspection error is ' +
              'deliberately not reported: it originates in caller-supplied code and is ' +
              'not part of this store\'s error surface.',
          );
        }
        case 'not-thenable':
          break;
        default:
          // Unreachable today; a compile-time barrier tomorrow.
          return assertNever(outcome);
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
        `could not acquire a connection to ${this.describeTarget()}: ${driverFailureCategory(err)}`,
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
    // The caller's own bounded callback threw: return its authored error
    // UNCHANGED (see `CallbackThrew`), never a store diagnostic built from it.
    if (err instanceof CallbackThrew) return err.thrown;
    if (err instanceof PostgresIntegrityError) return err;
    if (err instanceof PostgresUnavailableError) return err;
    return new PostgresUnavailableError('transaction_aborted', databaseRefusalReason(err));
  }
}

/**
 * Re-read the durable chain and verify it with `AuditLog.verifyChain`. Runs
 * after the delta is written and before COMMIT, so a write that would have
 * left a broken chain aborts the transaction instead of committing it.
 */
async function assertDurableChainIntact(client: PoolClient, estate_id: ID): Promise<void> {
  const state = await loadEstateState(client, estate_id);
  // Read-only post-write verification for ONE estate: bound to that estate (R2).
  const probe = new PostgresAdapterSession(state, estate_id);
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

/** A refused thenable, reduced to the one `then` read that identified it. */
interface CapturedThenable {
  /** The ORIGINAL value, kept solely to be the receiver of the call below. */
  receiver: object | ((...args: never[]) => unknown);
  /** The callable read from `receiver.then` — read exactly once. */
  then: (
    onFulfilled: (value: unknown) => void,
    onRejected: (reason: unknown) => void,
  ) => unknown;
}

/**
 * The outcome of the single `then` read. Exactly three cases, because the read
 * has exactly three outcomes and each demands a different disposition:
 *
 *   `not-thenable`  the value has no callable `then`. The ordinary synchronous
 *                   path applies: close, persist, commit.
 *   `thenable`      a callable `then` was captured. REFUSE and absorb the
 *                   eventual settlement through the captured function.
 *   `unreadable`    the `then` GETTER THREW on its first (and only) access.
 *                   REFUSE — see `captureThen` for why this cannot be treated
 *                   as `not-thenable`. There is nothing to absorb: nothing was
 *                   captured, so nothing was ever scheduled.
 *
 * A discriminated union rather than `CapturedThenable | null`: the previous
 * two-valued shape had no way to express "unreadable", which is precisely how
 * the getter-throws case came to be silently folded into success.
 *
 * `unreadable` deliberately carries NO payload. It used to carry the getter's
 * exception so the refusal could quote it, which put caller-supplied error
 * content — message, and potentially stack and cause — inside the store's
 * public error, and made the refusal path depend on stringifying a hostile
 * value (an operation that can itself throw and escape). The FACT that the
 * single read failed is the entire decision-relevant content; there is no
 * legitimate consumer of the exception itself, so it is not propagated out of
 * `captureThen` at all. What is not carried cannot leak.
 *
 * Every arm is dispatched through a `switch` with an `assertNever` default
 * (see `withEstateSession`), so adding a variant here is a TYPECHECK FAILURE
 * at that dispatch rather than a silent fall-through toward COMMIT.
 */
type ThenReadOutcome =
  | { kind: 'not-thenable' }
  | { kind: 'thenable'; captured: CapturedThenable }
  | { kind: 'unreadable' };

/**
 * Is this value Promise-like, and if so, what is its `then`? Returns
 * `not-thenable` for an ordinary value, `thenable` with the capture for a
 * native Promise and for any thenable (an object or function with a callable
 * `then`) — exactly the set of values `await` would treat asynchronously — and
 * `unreadable` when the `then` property access itself throws.
 *
 * The `then` property is read EXACTLY ONCE, here, and the captured function is
 * what the caller invokes. A hostile thenable whose `then` is a getter cannot
 * therefore be observed twice, cannot return one function to the check and a
 * different one to the absorber, and cannot throw on a second access that
 * never happens.
 *
 * A getter that THROWS on its first access yields `unreadable`, which the
 * caller turns into a bounded refusal — it is NOT treated as an ordinary
 * non-thenable return. The distinction is load-bearing: the value's thenability
 * is UNDECIDABLE (the only channel for deciding it threw), and an undecidable
 * return value cannot be shown to be a synchronous result. Treating it as one
 * committed the transaction on the strength of a value the store had failed to
 * inspect, so a callback could reach COMMIT precisely by making inspection
 * fail. Refusing is the fail-closed reading of the same ambiguity the
 * `thenable` branch already refuses, and it costs nothing legitimate: a
 * synchronous callback returning an ordinary value has no throwing `then`
 * getter.
 *
 * The getter's exception is DISCARDED, not returned: `unreadable` carries no
 * payload, so no part of a caller-supplied error (message, stack, cause,
 * identity) can reach the store's public error, and the refusal path never
 * stringifies a hostile value — an operation that can itself throw and escape.
 *
 * Note that `receiver` is retained separately: `then` must be invoked with the
 * original value as its `this`, because a native Promise's `then` is a
 * prototype method that reads internal slots from its receiver. Calling a
 * detached `then` would throw instead of absorbing the settlement.
 */
function captureThen(value: unknown): ThenReadOutcome {
  if (value === null) return { kind: 'not-thenable' };
  const t = typeof value;
  if (t !== 'object' && t !== 'function') return { kind: 'not-thenable' };
  const receiver = value as object;
  let then: unknown;
  try {
    then = (receiver as { then?: unknown }).then;
  } catch {
    // The `then` GETTER threw on its FIRST and ONLY access. Nothing was
    // captured and nothing was scheduled, so there is no settlement to absorb
    // — but thenability is now UNDECIDABLE and the value must be refused, not
    // committed.
    //
    // The exception is DISCARDED here, not returned. Binding it would carry
    // caller-supplied content (message, stack, cause, identity) to the refusal
    // site, where quoting it published that content through the store's public
    // error — and where merely converting it to a string could throw again and
    // escape the frame, delivering the ORIGINAL object to the caller instead of
    // the bounded refusal. Not capturing it removes both possibilities
    // structurally: the caller learns that the single read failed, which is the
    // whole decision, and learns nothing else.
    return { kind: 'unreadable' };
  }
  if (typeof then !== 'function') return { kind: 'not-thenable' };
  return { kind: 'thenable', captured: { receiver, then: then as CapturedThenable['then'] } };
}

/**
 * Settle a refused thenable safely: invoke the ALREADY-CAPTURED `then` with the
 * original receiver so the value's eventual outcome — resolution OR rejection,
 * immediate or delayed — is consumed and can never become an unhandled
 * rejection that escapes into the process.
 *
 * The outcome is DISCARDED, not reported: the operation has already been
 * refused and rolled back, so neither a late value nor a late error can change
 * what happened. The call is defensive because a caller-supplied thenable is
 * untrusted input — a `then` that throws synchronously must not displace the
 * refusal error this function's caller is about to throw.
 *
 * No property of the refused value is read here. The `then` used is the one
 * `captureThen` already read, and `Reflect.apply` supplies the original
 * receiver without touching the value again.
 */
function absorbSettlement(captured: CapturedThenable): void {
  const swallow = (): void => {
    /* discarded: the operation was refused and rolled back before this
       settled; a late outcome is not a result and not a second failure. */
  };
  try {
    // Not `Promise.resolve(value)`: adopting the thenable would read and call
    // `then` again. Applying the captured function directly keeps the read
    // count at one and keeps a hostile `then`'s synchronous throw inside this
    // try.
    const attached: unknown = Reflect.apply(captured.then, captured.receiver, [swallow, swallow]);
    // A well-behaved `then` returns another thenable; if that one can itself
    // reject (a subclass overriding `then`), absorb it too. Capturing it goes
    // through the same single-read path. An `unreadable` chained value has
    // nothing to absorb — its getter threw, so it never scheduled anything —
    // and the refusal has already been decided either way.
    const chained = captureThen(attached);
    if (chained.kind === 'thenable') {
      try {
        Reflect.apply(chained.captured.then, chained.captured.receiver, [swallow, swallow]);
      } catch {
        /* see below */
      }
    }
  } catch {
    // A thenable whose `then` throws synchronously never scheduled anything,
    // so there is nothing left to absorb. The refusal stands.
  }
}

/**
 * Compile-time totality barrier.
 *
 * Its parameter is `never`, so it type-checks ONLY where the compiler has
 * proven no case remains. Adding a variant to a union dispatched through a
 * `switch` whose `default` calls this function makes that call a type error
 * (`Argument of type '{ kind: "..." }' is not assignable to parameter of type
 * 'never'`), which fails `npm run typecheck`.
 *
 * This is a REAL barrier rather than a documented intention. The previous
 * shape — two independent `if` statements, with every unmatched variant
 * implicitly treated as "not thenable" — compiled cleanly with a fourth
 * variant present and let it fall through to `session.close()`,
 * `persistDelta`, and COMMIT. A callback-inspection union must never have a
 * silent arm on the path to a durable write.
 *
 * The runtime `throw` is unreachable while the switch is exhaustive; it exists
 * so a value arriving from untyped JavaScript still fails closed rather than
 * returning `undefined` into a control-flow decision.
 */
function assertNever(value: never): never {
  throw new PostgresUnavailableError(
    'async_callback_unsupported',
    'withEstateSession reached an unhandled callback-inspection outcome; refusing ' +
      `rather than continuing toward COMMIT (kind: ${describeKind(value)})`,
  );
}

/**
 * The `kind` discriminant of an unhandled outcome, for the unreachable arm's
 * message. Reads exactly one own property and never stringifies the value
 * itself, so this diagnostic cannot become the leak the refusal above closes.
 */
function describeKind(value: unknown): string {
  try {
    if (typeof value === 'object' && value !== null && 'kind' in value) {
      const kind = (value as { kind?: unknown }).kind;
      if (typeof kind === 'string') return kind;
    }
  } catch {
    // Even the discriminant read is guarded: a diagnostic must never be the
    // reason a refusal fails to be thrown.
  }
  return '<unknown>';
}

/**
 * A TYPED, non-secret category for a driver/connection failure — NEVER the
 * driver's `Error.message` (sequence-116 audit, F-04).
 *
 * A `pg`/driver error message can carry connection-string-derived material: an
 * `sslkey`/`sslcert`/`sslrootcert` FILE PATH, an INVALID OPTION VALUE quoted
 * back verbatim, the resolved host name, and more. Interpolating it into a
 * diagnostic republishes that material through the store's public error. So the
 * message is never read. The ONLY thing borrowed from the error is its SQLSTATE
 * `code` — and only when the driver set one AND it has the closed five-character
 * SQLSTATE shape (`^[0-9A-Z]{5}$`), which is a documented, non-secret failure
 * classification and cannot carry a path, a value or free text. Everything else
 * — a Node system-error code like `ECONNREFUSED`, an absent code, a code of the
 * wrong shape — collapses to a single constant. The `code` read is itself
 * guarded, because building a diagnostic must never be the reason a diagnostic
 * throws.
 */
function driverFailureCategory(err: unknown): string {
  try {
    const code = (err as { code?: unknown } | null)?.code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) {
      return `driver error (SQLSTATE ${code})`;
    }
  } catch {
    // Reading `.code` must never be the reason a diagnostic throws; fall
    // through to the constant category.
  }
  return 'driver error (no SQLSTATE)';
}

/**
 * The DATABASE's OWN reason for refusing an EXECUTED statement — the diagnostic
 * for `transaction_aborted`, and DISTINCT from a connection failure.
 *
 * `classify` is reached only from `withClient`/`withEstateSession` AFTER a
 * connection was already checked out (see `checkout`, whose own failure is the
 * `connection_failed` path). So a driver/database error arriving here is the
 * server's response to a statement it ran: an append-only trigger, a unique or
 * check constraint, a genesis-shape rule, a statement-timeout cancellation.
 * That message NAMES the trigger, constraint or relation that refused —
 * canonical schema material an operator needs to act, and a credential is not —
 * so when the DATABASE spoke (the error carries a closed-shape SQLSTATE `code`,
 * the same non-secret classification `driverFailureCategory` gates on) its
 * reason is reported as given.
 *
 * A failure with NO such `code` is not the database refusing a statement but
 * the driver or socket failing mid-transaction, whose text CAN carry
 * connection-derived material (F-04) — it collapses to the same typed category
 * a connection failure does, never the raw message. The reads are guarded
 * because building a diagnostic must never be the reason a diagnostic throws.
 *
 * (A value THROWN by the caller's own bounded callback never reaches here: it
 * is tagged `CallbackThrew` at the callback boundary and returned to the caller
 * unchanged by `classify`, because it is the caller's authored exception, not a
 * driver diagnostic this store composes.)
 */
function databaseRefusalReason(err: unknown): string {
  try {
    const code = (err as { code?: unknown } | null)?.code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === 'string' && message.length > 0) return message;
    }
  } catch {
    // Reading `.code`/`.message` must never be the reason a diagnostic throws;
    // fall through to the typed category below.
  }
  return driverFailureCategory(err);
}

export type { CanonicalDelta };
