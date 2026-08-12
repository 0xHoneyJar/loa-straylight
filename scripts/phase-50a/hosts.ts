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
// The store class is imported because this module CONSTRUCTS the operational
// store for a descriptor rather than accepting one (F-09, below).
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
//
// ── WHY AUTHORITY IS NEVER TESTIMONY (sequence-104 audit, F-09/F-10) ──────
//
// Two earlier attempts made authority a JUDGEMENT ABOUT SOMETHING A CALLER
// HANDED IN, and both were rejected:
//
//   F-09  `bindStore(host, store, redact)` minted destructive authority when
//         `store.describeTarget()` returned the expected TEXT. That is the
//         store's own account of itself: an object with a two-line
//         `describeTarget()` could return the authorized string while every
//         real operation went to a different database. The self-description was
//         checked; the connection was not.
//
//   F-10  `declareScratchDatabase(host, name)` accepted ANY `p50a_`-shaped name
//         and added it to the issuable set, after which `toolTargetOf(host,
//         name)` produced a genuinely authorized destructive target. The name
//         had been REGISTERED, never CREATED, so "the harness issued it" was
//         true and empty.
//
// Both are replaced with the same move: THE AUTHORITY IS THE ACT, NOT A CLAIM
// ABOUT THE ACT.
//
//   * `openBoundProofStore(descriptor)` CONSTRUCTS the store here, from the
//     descriptor's own connection string. No caller-supplied store object
//     exists anywhere on the destructive path, so there is nothing to imitate,
//     subclass or describe. There is no parameter for one.
//
//   * `createScratchDatabase(descriptor, label)` MINTS the name itself, runs
//     the `CREATE DATABASE` that brings the database into existence, and only
//     then issues the tool target for it. Creation is the sole issuer, so an
//     independently chosen name has no surface to enter through — the
//     registration API is gone rather than guarded.
//
// Both capabilities are recorded in MODULE-PRIVATE WeakMaps and carry no own
// symbol or property a caller could copy, so possession cannot be forged from a
// genuine one; and both destructive consumers read what they act on OUT OF THAT
// REGISTRY rather than off the handle they were passed.

import { PostgresEstateHost } from '../../src/straylight/storage/postgres/index.js';

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
 * it.
 *
 * ── THERE IS NO `database` PARAMETER (sequence-104 audit, F-10) ────────────
 *
 * This function used to take an optional `database`, and honour it for any name
 * `declareScratchDatabase` had previously been TOLD about. Removing the
 * parameter is the fix: the descriptor's own database is the only thing a
 * descriptor can authorize, and the only other authorized database is one
 * `createScratchDatabase` actually brought into existence — which issues its
 * own target at the moment of creation and hands it back. A name that arrives
 * from anywhere else has nowhere to arrive.
 *
 * The issued object is RECORDED WITH ITS AUTHORIZING DESCRIPTOR AND FIELDS, so
 * the tool gate can verify that what it was handed still says what it said when
 * it was issued — issuance alone is not authority (see `authorizedToolTarget`).
 */
export function toolTargetOf(target: ProofHost | ProofHost['name']): ProofToolTarget {
  const host = resolveProofHost(target);
  return issueToolTarget(host, host.database);
}

/**
 * Record and hand out a tool target. The ONLY producer of an issued target, so
 * every authorized destructive/dump/restore target in the harness passes through
 * here, and there are exactly two callers: `toolTargetOf` (the descriptor's own
 * database) and `createScratchDatabase` (a database this module just created).
 */
function issueToolTarget(host: ProofHost, database: string): ProofToolTarget {
  const issued: ProofToolTarget = Object.freeze({
    container: host.container,
    user: host.user,
    database,
  });
  ISSUED_TOOL_TARGETS.set(issued, Object.freeze({ host, ...issued }));
  return issued;
}

/**
 * A scratch database this module CREATED, and the authority that came with it.
 *
 * The grant is the whole capability: the connection string to reach it, the tool
 * target authorized to dump/restore/destroy it, and the drop that ends both. It
 * is returned only from `createScratchDatabase`, so holding one is evidence that
 * the database exists because this module made it exist.
 */
export interface ScratchGrant {
  /** The fixed instance the scratch database lives inside. */
  readonly serverHost: ProofHost;
  /** The minted database name. Chosen here; never supplied by a caller. */
  readonly database: string;
  /** Connection string for the scratch database on that instance. */
  readonly connectionString: string;
  /** The `pg_dump`/`psql` target issued BY the creation of this database. */
  readonly toolTarget: ProofToolTarget;
  /** Drop the database and REVOKE the issued tool target. Idempotent. */
  readonly drop: () => Promise<void>;
}

let scratchCounter = 0;

/**
 * Mint a scratch database name. The label only *decorates* it.
 *
 * Uniqueness comes from the process id and a module-private counter, so two
 * vitest workers running the same test file cannot collide; the label is
 * sanitized to the harness's own character set and truncated, so it contributes
 * nothing but readability. A caller therefore cannot select the name — which is
 * what makes the name meaningless as a route to authority.
 */
function mintScratchName(label: string): string {
  scratchCounter += 1;
  const safe = String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 32);
  return `p50a_${safe}_${process.pid}_${scratchCounter}`;
}

/** Swap the database component of a connection string, keeping everything else. */
function withDatabase(connectionString: string, database: string): string {
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  return url.toString();
}

/**
 * CREATE a disposable scratch database inside a FIXED instance, and issue the
 * authority for it in the same act (F-10).
 *
 * This is the replacement for `declareScratchDatabase`, and the difference is
 * the whole point: that function was TOLD a name and believed it; this one
 * chooses the name, runs the `CREATE DATABASE` that makes it real, and issues
 * the tool target only after that statement succeeded. Creation and issuance are
 * one operation with one outcome, so:
 *
 *   * an independently selected name cannot be authorized, because no parameter
 *     accepts one — the `label` decorates a name minted here;
 *   * a name belonging to something that ALREADY EXISTS cannot be authorized,
 *     because `CREATE DATABASE` fails on it and this function throws before
 *     issuing anything;
 *   * the authority ends when the database does: `drop()` revokes the issued
 *     target, so a retained reference to it stops being authority.
 *
 * The identifier is interpolated into the DDL because PostgreSQL has no
 * parameter form for `CREATE DATABASE`. That is safe HERE and only here: the
 * name came from `mintScratchName`, it is quoted, and the shape is re-checked
 * below before it reaches the statement.
 */
export async function createScratchDatabase(
  target: ProofHost | ProofHost['name'],
  label: string,
): Promise<ScratchGrant> {
  const host = resolveProofHost(target);
  const database = mintScratchName(label);
  // A self-check on our OWN mint, not a judgement about caller input: if label
  // sanitization ever produced something outside the harness's scratch form, the
  // DDL below must not run at all.
  if (!/^p50a_[a-z0-9_]{1,54}$/.test(database)) {
    throw new ProofHostRefusedError(
      'phase-50a: refusing to create a scratch database whose MINTED name is not in the ' +
        `harness scratch form p50a_<lowercase/digits/underscore>. Minted: ${database}`,
    );
  }

  const admin = new PostgresEstateHost({ connectionString: host.connectionString });
  try {
    await admin.withClient(async (client) => {
      await client.query(`CREATE DATABASE "${database}"`);
    });
  } finally {
    await admin.close();
  }

  // ISSUANCE FOLLOWS CREATION, and only creation. Reaching this line means the
  // CREATE DATABASE above committed.
  const toolTarget = issueToolTarget(host, database);
  let revoked = false;

  return Object.freeze({
    serverHost: host,
    database,
    connectionString: withDatabase(host.connectionString, database),
    toolTarget,
    drop: async () => {
      if (!revoked) {
        revoked = true;
        ISSUED_TOOL_TARGETS.delete(toolTarget);
      }
      const cleanup = new PostgresEstateHost({ connectionString: host.connectionString });
      try {
        await cleanup.withClient(async (client) => {
          await client.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
        });
      } finally {
        await cleanup.close();
      }
    },
  });
}

/**
 * Every tool target this module has ISSUED, mapped to the descriptor and the
 * exact field values it was issued WITH.
 *
 * `pg-tools` consults it before spawning anything, so a hand-built target that
 * never passed the descriptor gate cannot be handed to `pg_dump` or `psql` at
 * all — the refusal precedes the invocation instead of depending on every call
 * site remembering to ask. A `WeakMap` because membership is about identity and
 * the entries must not be kept alive by the registry.
 *
 * The RECORDED FIELDS are what closes the sequence-89 divergence case: an
 * object that carries a legitimate issuance but whose `database` (or container,
 * or user) has since drifted is not the target that was authorized, and
 * `authorizedToolTarget` refuses it.
 *
 * Entries are REVOCABLE, and `ScratchGrant#drop` revokes: authority over a
 * scratch database ends when the database does, so a retained reference to a
 * dropped database's target is refused rather than dialled.
 */
const ISSUED_TOOL_TARGETS = new WeakMap<
  object,
  Readonly<{ host: ProofHost; container: ProofContainer; user: string; database: string }>
>();

/**
 * Did this exact object come from `toolTargetOf` or from the creation of a
 * scratch database (and therefore from a fixed descriptor that passed
 * `resolveProofHost`), and has its authority not been revoked?
 */
export function isIssuedToolTarget(target: object): boolean {
  return ISSUED_TOOL_TARGETS.has(target);
}

/**
 * THE TOOL-TARGET AUTHORITY. Returns the fixed descriptor that authorized this
 * target, or throws.
 *
 * Two conditions, both structural:
 *
 *   1. the object was ISSUED — by `toolTargetOf` for a descriptor's own
 *      database, or by `createScratchDatabase` for a database it created — and
 *      not since revoked (identity: a hand-built object with matching fields is
 *      not the same thing as an authorized one);
 *   2. its CURRENT fields still equal the fields it was issued with, so a
 *      legitimately-issued target whose database was edited afterwards is
 *      refused rather than dialled.
 *
 * Frozen objects make (2) hard to violate through the target itself, but the
 * check is not about defeating a mutation: it is about a caller SPREADING an
 * issued target into a new object and editing a field, which is exactly what
 * the sequence-89 divergence case does.
 */
export function authorizedToolTarget(
  target: { readonly container: string; readonly user: string; readonly database: string },
): ProofHost {
  const record = ISSUED_TOOL_TARGETS.get(target);
  if (record === undefined) {
    throw new ProofHostRefusedError(
      'phase-50a: refusing a tool target that was never ISSUED by hosts.toolTargetOf() or ' +
        'by hosts.createScratchDatabase(), or whose issuance has been revoked. Build every ' +
        'target from a fixed descriptor, or from the grant that created the database; a ' +
        'hand-built, copied or independently named object is not an authorization. ' +
        `Refused: container=${String(target?.container)} ` +
        `database=${String(target?.database)}`,
    );
  }
  if (
    target.container !== record.container ||
    target.user !== record.user ||
    target.database !== record.database
  ) {
    throw new ProofHostRefusedError(
      'phase-50a: refusing a tool target whose fields DIVERGED from the descriptor that ' +
        'authorized it. The target was issued for ' +
        `container=${record.container} database=${record.database} but now says ` +
        `container=${String(target.container)} database=${String(target.database)}.`,
    );
  }
  return record.host;
}

/**
 * DESTRUCTIVE AUTHORITY over one fixed instance: the descriptor, and the store
 * this module CONSTRUCTED for it.
 *
 * ── WHY THE STORE IS BUILT, NOT ACCEPTED (sequence-104 audit, F-09) ───────
 *
 * `emptySchema(host, store)` once resolved `host` and then issued
 * `DROP SCHEMA public CASCADE` through the INDEPENDENTLY SUPPLIED `store`, so a
 * legitimate descriptor plus somebody else's store reached destructive SQL with
 * nothing checked about the database actually being erased. The first fix folded
 * the pair into one value obtained from `bindStore(host, store, redact)`, which
 * accepted the pair when `store.describeTarget()` returned the descriptor's
 * redacted connection string.
 *
 * That was still testimony. `describeTarget()` is a method the caller's object
 * implements; returning the right string proves the object can produce a string.
 * A hostile store — three lines: return the expected text, delegate every real
 * operation elsewhere — satisfied it exactly, and so did any subclass that
 * overrode the description while inheriting a different connection.
 *
 * SO THE PARAMETER IS GONE. `openBoundProofStore` takes a descriptor and NOTHING
 * ELSE, and constructs the `PostgresEstateHost` here from that descriptor's own
 * connection string. There is no caller-supplied store object anywhere on the
 * destructive path, so no imitation, subclass, proxy or self-description has a
 * surface to act through. The question "is this store really the authorized
 * one?" is not answered better — it is never asked, because the only store that
 * exists is the one this module just built.
 *
 * The handle is OPAQUE. It carries no brand property and no symbol: possession
 * is recorded in `BOUND_PROOF_STORES`, a module-private WeakMap, so a caller
 * holding a genuine handle cannot copy its keys onto an object of their own and
 * cannot construct one at all.
 *
 * ── AND THE STORE NEVER LEAVES THIS MODULE (sequence-110 audit, F-09) ─────
 *
 * The previous handle was `Object.freeze({ host, store })` and the registry held
 * THAT SAME `store` reference, so "the store from the registry" and `bound.store`
 * were the identical object. The registry lookup was therefore not a boundary at
 * all: a caller holding a genuine, registered, frozen handle could reach the real
 * `PostgresEstateHost` and — `Object.freeze` protects the handle's fields, not the
 * store's — assign `genuine.store.withClient = <hostile>` AFTER minting, at which
 * point the destructive path resolved the registry, got that same store, and
 * issued `DROP SCHEMA public CASCADE` through the replacement. Nothing about the
 * gate had been bypassed; the gate simply handed back a mutable alias. A
 * capability is only as bounded as its widest reachable alias, and the handle
 * published a fully mutable one.
 *
 * So the handle no longer carries the store IN ANY FORM: no `store` field, no
 * accessor, no method that returns it, no closure that hands it out. The real
 * `PostgresEstateHost` exists in exactly two places, both module-private — the
 * local inside `openBoundProofStore` and the WeakMap VALUE — and no exported
 * symbol of this module returns it.
 *
 * What a consumer gets instead is `authorizedBoundStore(bound)`: a FRESH frozen
 * capability, minted per call, whose operations are the store's own methods
 * ALREADY BOUND to the store. Nothing reachable from it can be made to point
 * elsewhere — a bound function does not expose its receiver, freezing refuses
 * field replacement, and a mutation, proxy, copy, spread or subclass of a handle
 * is not what a destructive consumer acts on, because that consumer mints its OWN
 * capability from the handle and an altered handle is not in the registry.
 *
 * Teardown is a module operation for the same reason: `closeBoundProofStore`.
 */
export interface BoundProofStore {
  readonly host: ProofHost;
  /**
   * TYPE-ONLY brand. `declare const` is erased at runtime, so this property
   * exists in the type system and NOWHERE on the object — there is nothing for
   * `Object.getOwnPropertySymbols` to copy.
   */
  readonly [BOUND_PROOF_STORE]: true;
}

declare const BOUND_PROOF_STORE: unique symbol;

/**
 * The operations a bound store authorizes, as functions ALREADY BOUND to the
 * store this module constructed. This is the whole of what a consumer may do; the
 * store object itself is not part of it and is not obtainable from it.
 */
export interface AuthorizedBoundStore {
  readonly host: ProofHost;
  readonly migrate: PostgresEstateHost['migrate'];
  readonly withClient: PostgresEstateHost['withClient'];
  readonly withEstateSession: PostgresEstateHost['withEstateSession'];
}

const BOUND_PROOF_STORES = new WeakMap<
  object,
  Readonly<{ host: ProofHost; store: PostgresEstateHost }>
>();

/**
 * Open the operational store for a fixed descriptor and return the destructive
 * authority over it.
 *
 * The descriptor is resolved first, so an unfixed one is refused before a store
 * is constructed and before any connection could be opened. The caller receives a
 * handle it cannot have made, cannot forge, and cannot read a store out of. What
 * it may DO is `authorizedBoundStore(handle)`; what ends the store's life is
 * `closeBoundProofStore(handle)`.
 */
export function openBoundProofStore(target: ProofHost | ProofHost['name']): BoundProofStore {
  const host = resolveProofHost(target);
  const store = new PostgresEstateHost({ connectionString: host.connectionString });
  // The handle carries the DESCRIPTOR ONLY. There is no store on it to replace,
  // proxy, patch or copy, so there is nothing execution could be made to follow.
  const bound = Object.freeze({ host }) as BoundProofStore;
  BOUND_PROOF_STORES.set(bound, Object.freeze({ host, store }));
  return bound;
}

/**
 * Is this exact object a handle `openBoundProofStore` produced?
 *
 * Membership of a module-private WeakMap, so no caller outside this module can
 * mint one and no copy of a genuine one qualifies. Exposed so a destructive
 * entry point can fail closed on an untyped JavaScript caller rather than
 * dereferencing whatever it was handed.
 */
export function isBoundProofStore(value: unknown): value is BoundProofStore {
  return typeof value === 'object' && value !== null && BOUND_PROOF_STORES.has(value);
}

/** The registry record for a handle, or a refusal. The ONE lookup. */
function boundRecord(
  bound: BoundProofStore,
): Readonly<{ host: ProofHost; store: PostgresEstateHost }> {
  const record = BOUND_PROOF_STORES.get(bound as object);
  if (record === undefined) {
    throw new ProofHostRefusedError(
      'phase-50a: refusing a destructive operation that was not handed a store this module ' +
        'OPENED for a fixed harness descriptor. Obtain one from hosts.openBoundProofStore(); ' +
        'a store handle, a self-describing imitation, a subclass, a proxy and a copied handle ' +
        'are none of them destructive authority.',
    );
  }
  return record;
}

/**
 * THE DESTRUCTIVE AUTHORITY ACCESSOR. Mints the operations THIS MODULE's store
 * will perform, or throws.
 *
 * A destructive consumer acts on what comes back from here rather than on
 * anything reachable from the handle it was given — which is no longer a
 * discipline it must observe but the only thing available, since the handle holds
 * no store. The returned object is FRESH and FROZEN on every call and its
 * operations are pre-bound, so a capability that has been minted cannot be
 * redirected afterwards by anyone, including the consumer itself.
 */
export function authorizedBoundStore(bound: BoundProofStore): AuthorizedBoundStore {
  const { host, store } = boundRecord(bound);
  return Object.freeze({
    host,
    migrate: store.migrate.bind(store),
    withClient: store.withClient.bind(store),
    withEstateSession: store.withEstateSession.bind(store),
  });
}

/**
 * Close the store this module opened for a handle. TEARDOWN IS A MODULE
 * OPERATION, not something reached through an alias: the same registry lookup
 * gates it, and the store it ends is the one the registry holds.
 *
 * Idempotent, because `PostgresEstateHost.close` is.
 */
export async function closeBoundProofStore(bound: BoundProofStore): Promise<void> {
  await boundRecord(bound).store.close();
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
