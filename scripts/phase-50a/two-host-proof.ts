// Phase 50A — standalone two-host export/restore/replacement proof.
//
// The vitest suite in `tests/phase-50a/postgres-two-host-portability.test.ts` is
// the ASSERTED proof. This script is the OPERATOR-RUNNABLE form of the same
// exercise: it prints every command it ran and every digest it compared, so the
// documented backup-and-restore exercise (ADR-049Q §13.1(e); P-7) can be
// reproduced and read by a human rather than inferred from a test log.
//
// Non-production only. It talks to the two local harness instances, uses the
// fixed local-only harness credentials, and touches no living estate.
//
//   npm run phase-50a:up
//   npm run phase-50a:proof

import {
  EstateStore,
  executeRecall,
  type StorageAdapter,
} from '../../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../../fixtures/index.js';
import {
  assertRestoreServiceable,
  compareSnapshots,
  readStoreSnapshot,
  snapshotDigest,
  verifyChains,
} from '../../src/straylight/storage/postgres/index.js';
import { clusterSystemIdentifier, pgDump, psqlRestore, type PgToolTarget } from './pg-tools.js';
import {
  type BoundProofStore,
  ProofHostRefusedError,
  assertDistinctHosts,
  authorizedBoundStore,
  isBoundProofStore,
  openBoundProofStore,
  type ProofHost,
  replacementHost,
  resolveProofHost,
  sourceHost,
  toolTargetOf,
} from './hosts.js';

const NOW = '2026-05-05T12:00:00Z';
const ESTATE_ID = loadEstate().estate_id;

function line(label: string, value: string): void {
  process.stdout.write(`${label.padEnd(34)} ${value}\n`);
}

function heading(text: string): void {
  process.stdout.write(`\n── ${text} ${'─'.repeat(Math.max(0, 60 - text.length))}\n`);
}

async function main(): Promise<void> {
  // THE FIXED DESCRIPTORS, gated. `resolveProofHost` accepts only the two
  // frozen harness instances and refuses anything else BEFORE a connection is
  // opened — this proof is destructive, so the gate precedes every action.
  const source = resolveProofHost(sourceHost());
  const replacement = resolveProofHost(replacementHost());
  assertDistinctHosts(source, replacement);

  // The tool targets DERIVE FROM THE SAME DESCRIPTORS the stores connect
  // through, so `pg_dump`/`psql` can never address a database the store did
  // not populate (F-10). Nothing here restates a container, user or database.
  const sourceTarget: PgToolTarget = toolTargetOf(source);
  const replacementTarget: PgToolTarget = toolTargetOf(replacement);

  heading('two distinct PostgreSQL server instances');
  const sourceId = clusterSystemIdentifier(sourceTarget);
  const replacementId = clusterSystemIdentifier(replacementTarget);
  line('source cluster identifier', sourceId);
  line('replacement cluster identifier', replacementId);
  if (sourceId === replacementId) {
    throw new Error(
      'phase-50a: source and replacement report the same cluster system identifier; ' +
        'the replacement-host proof requires two separately initialized servers',
    );
  }
  line('distinct instances', 'YES');

  // OPEN each store THROUGH the descriptor that authorizes it (F-09). This
  // script never constructs a store itself and never hands one in: it asks
  // `openBoundProofStore` for the authority over a fixed descriptor, and the
  // store it works through is the one that call built from that descriptor's own
  // connection string. There is no parameter through which some other store
  // could arrive, so the destructive step below cannot be aimed elsewhere.
  const boundSource = openBoundProofStore(source);
  const boundReplacement = openBoundProofStore(replacement);
  const sourceStore = boundSource.store;
  const replacementStore = boundReplacement.store;

  try {
    heading('reset both hosts to a known starting state');
    // The proof must start from a known state. Safe here because these are
    // ephemeral tmpfs-backed harness instances holding no estate anyone relies
    // on — and the runbook forbids running this against any database holding
    // estate data.
    //
    // The two hosts start DIFFERENTLY, and that asymmetry is the point:
    //
    //   source      — canonical migrations applied, so it can be populated;
    //   replacement — COMPLETELY EMPTY, because the dump carries the schema.
    //                 Pre-migrating the restore target would make the restore
    //                 collide with the objects it is trying to create, and
    //                 would also hide whether the export is self-sufficient.
    //                 A real replacement host is a fresh database, so the proof
    //                 uses one.
    await emptySchema(boundSource);
    const applied = await sourceStore.migrate();
    line('source migrations applied', applied.join(', '));
    await emptySchema(boundReplacement);
    line('replacement starting state', 'empty (schema arrives with the dump)');

    heading('populate the source with a governed flow');
    const seeded = await sourceStore.withEstateSession(ESTATE_ID, (storage) => {
      const store = newStore(storage);
      const first = store.admit(observation('two-host proof one'), NOW);
      const second = store.admit(observation('two-host proof two'), NOW);
      const recall = executeRecall(store, publicRecallRequest(), NOW);
      if (!first.ok || !second.ok || !recall.ok) {
        throw new Error('phase-50a: seeding flow did not succeed');
      }
      return {
        assertions: storage.listAssertions(ESTATE_ID).length,
        transitions: storage.listTransitions(ESTATE_ID).length,
        auditLength: storage.listAuditEvents(ESTATE_ID).length,
        tail: storage.getAuditTail(ESTATE_ID),
        recallReceiptId: recall.receipt!.receipt_id,
      };
    });
    line('committed', String(seeded.committed));
    line('assertions', String(seeded.value.assertions));
    line('transitions', String(seeded.value.transitions));
    line('audit chain length', String(seeded.value.auditLength));
    line('audit tail', String(seeded.value.tail));

    heading('export from the source (ordinary pg_dump)');
    const dump = pgDump(sourceTarget);
    line('command', dump.record.command);
    line('dump size (bytes)', String(dump.record.bytes ?? 0));

    heading('restore into the replacement host (ordinary psql)');
    const restore = psqlRestore(replacementTarget, dump.sql);
    line('command', restore.command);

    heading('compare canonical state');
    const sourceSnapshot = await sourceStore.withClient(readStoreSnapshot);
    const targetSnapshot = await replacementStore.withClient(readStoreSnapshot);
    const comparison = compareSnapshots(sourceSnapshot, targetSnapshot);
    line('source digest', snapshotDigest(sourceSnapshot));
    line('replacement digest', snapshotDigest(targetSnapshot));
    line('canonically equal', String(comparison.equal));
    if (!comparison.equal) {
      for (const difference of comparison.differences) line('  difference', difference);
      throw new Error('phase-50a: restored canonical state differs from the source');
    }

    heading('verify the audit chains on the replacement');
    const sourceChains = verifyChains(sourceSnapshot);
    const targetChains = verifyChains(targetSnapshot);
    for (const chain of targetChains) {
      line(`chain ${chain.estate_id}`, `ok=${chain.ok} length=${chain.length} tail=${chain.tail}`);
    }
    if (JSON.stringify(sourceChains) !== JSON.stringify(targetChains)) {
      throw new Error('phase-50a: chain verification differs between hosts');
    }
    const verification = assertRestoreServiceable(sourceSnapshot, targetSnapshot);
    line('restore serviceable', String(verification.ok));
    line('quarantined estates', verification.quarantinedEstates.join(', ') || '(none)');

    heading('cold-load and govern a recall on the replacement');
    const restored = await replacementStore.withEstateSession(ESTATE_ID, (storage) => {
      const store = EstateStore.fromStorage(storage, ESTATE_ID);
      if (!store) throw new Error('phase-50a: cold load failed on the replacement host');
      const recall = executeRecall(store, publicRecallRequest(), NOW);
      return {
        recallOk: recall.ok,
        included: recall.pack?.included.length ?? 0,
        chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
        restoredReceipt: storage.getRecallReceipt(seeded.value.recallReceiptId) !== undefined,
        tail: storage.getAuditTail(ESTATE_ID),
      };
    });
    line('cold-load recall ok', String(restored.value.recallOk));
    line('recall items included', String(restored.value.included));
    line('restored receipt present', String(restored.value.restoredReceipt));
    line('chain verifies', String(restored.value.chainOk));
    line('replacement tail', String(restored.value.tail));
    if (!restored.value.recallOk || !restored.value.chainOk || !restored.value.restoredReceipt) {
      throw new Error('phase-50a: replacement host did not serve the restored estate');
    }

    heading('replacement stays live (write continues the chain)');
    const continued = await replacementStore.withEstateSession(ESTATE_ID, (storage) => {
      const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
      const out = store.admit(observation('written on the replacement host'), NOW);
      const audit = storage.listAuditEvents(ESTATE_ID);
      return {
        ok: out.ok,
        length: audit.length,
        newestParent: audit[audit.length - 1]?.previous_audit_hash,
        chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
      };
    });
    line('new admit ok', String(continued.value.ok));
    line('chain length', String(continued.value.length));
    line('new link parent', String(continued.value.newestParent));
    line('chain verifies', String(continued.value.chainOk));
    if (continued.value.newestParent !== restored.value.tail || !continued.value.chainOk) {
      throw new Error('phase-50a: chain continuity broke on the replacement host');
    }

    heading('result');
    line('PHASE 50A TWO-HOST PROOF', 'PASS');
    process.stdout.write(
      '\nProven: ordinary export, restore into a genuinely different conforming\n' +
        'PostgreSQL host, canonical state identical, per-estate chains verifying\n' +
        'identically, cold load, governed recall, and continued writing.\n' +
        '\nNOT proven here (ADR-049Q §12, mandatory pre-production obligations):\n' +
        'durability, failover, version pinning, network isolation, tenancy\n' +
        'boundary, availability, incident recovery, and backup/restore against\n' +
        'any actual deployment.\n',
    );
  } finally {
    await replacementStore.close();
    await sourceStore.close();
  }
}

/**
 * Drop everything in the public schema, leaving a genuinely empty database.
 *
 * `DROP SCHEMA public CASCADE` is used rather than the migration's own down
 * path because the target may be in ANY state — mid-restore, partially
 * migrated, or carrying a previous proof run — and the proof needs a clean
 * start regardless. This is a HARNESS operation on an ephemeral instance, not a
 * canonical rollback: the canonical, reversible rollback path is
 * `migrations/postgres/0001_canonical_estate.down.sql`, exercised by
 * `tests/phase-50a/postgres-migrations.test.ts`.
 *
 * GATED AND OBSERVED (F-09). The host descriptor is resolved FIRST, so a target
 * that is not one of the two fixed disposable harness instances is refused
 * before a connection is opened and before any DDL is issued; the attempt is
 * then recorded on `destructiveOperations`, so a negative control can prove by
 * OBSERVATION that a refusal destroyed nothing.
 *
 * ── ONE BOUND VALUE, AND THE STORE COMES FROM THE REGISTRY (F-09) ─────────
 *
 * This function used to take `(host, store)` and destroy through the store
 * after validating the host. Passing a legitimate descriptor with an unrelated
 * store therefore reached `DROP SCHEMA` with nothing checked about the database
 * actually being erased — the gate proved something about one object while the
 * destruction ran through another. The sequence-89 fix folded the two into one
 * `bindStore` product; the sequence-104 audit then rejected that too, because
 * `bindStore` accepted any caller object whose `describeTarget()` returned the
 * expected TEXT.
 *
 * It now takes a `BoundProofStore` obtainable ONLY from
 * `hosts.openBoundProofStore`, which constructs the store itself from the
 * descriptor — and it destroys through the store `authorizedBoundStore` returns
 * out of the module-private registry, not through a field of the value it was
 * handed. A self-describing imitation, a subclass with an overridden
 * description, and a copy of a genuine handle with a substituted `store` are all
 * refused HERE, and none of them is ever dereferenced.
 */
export async function emptySchema(bound: BoundProofStore): Promise<void> {
  // The binding IS the gate, and it happened in `openBoundProofStore` — before
  // this function was reachable, before a connection, before any DDL.
  // Re-resolving here would be theatre: the descriptor in a bound store already
  // passed `resolveProofHost`.
  const fixed = requireBoundStore(bound);
  destructive.push(
    Object.freeze({
      operation: 'DROP SCHEMA public CASCADE',
      host: fixed.host.name,
      database: fixed.host.database,
    }),
  );
  await fixed.store.withClient(async (client) => {
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
  });
}

/**
 * Refuse anything that is not a genuine `openBoundProofStore` product, and
 * return the descriptor and store THE REGISTRY holds for it.
 *
 * The membership test and the lookup are the same act deliberately: a
 * destructive operation must not be able to check one object and then act on
 * another, which is the shape of every defect this seam has had. An untyped
 * JavaScript caller can still pass anything, and the path fails closed rather
 * than reading `undefined.withClient`.
 */
function requireBoundStore(bound: BoundProofStore): ReturnType<typeof authorizedBoundStore> {
  if (!isBoundProofStore(bound)) {
    throw new ProofHostRefusedError(
      'phase-50a: refusing a destructive operation that was not handed a store this harness ' +
        'OPENED for a fixed descriptor. Obtain one from hosts.openBoundProofStore(); a bare ' +
        'store handle, a self-describing imitation and a copied handle are none of them ' +
        'destructive authority.',
    );
  }
  return authorizedBoundStore(bound);
}

/** One recorded destructive operation: what was erased, and where. */
export interface DestructiveOperation {
  readonly operation: string;
  readonly host: ProofHost['name'];
  readonly database: string;
}

const destructive: DestructiveOperation[] = [];

/**
 * Every destructive operation this process attempted, in order.
 *
 * Populated AFTER the host gate and BEFORE the DDL, so a refused target leaves
 * it untouched — which is what makes "zero destructive operations on refusal" an
 * observation rather than an inference.
 */
export function destructiveOperations(): readonly DestructiveOperation[] {
  return [...destructive];
}

/** Clear the destructive-operation record. For tests establishing a baseline. */
export function resetDestructiveOperations(): void {
  destructive.length = 0;
}

function newStore(storage: StorageAdapter): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    storage,
  });
}

function observation(text: string) {
  return buildCandidate({
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}

function publicRecallRequest() {
  return buildRecallRequest({
    task: 'public discord',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    signer: SIGNERS.operator,
  });
}

// RUN ONLY AS A SCRIPT. `emptySchema` and the observation records above are
// exported so the closure suite can prove the destructive path refuses an
// unfixed host WITHOUT destroying anything — and importing this module must not
// start a destructive proof as a side effect. Under vitest the whole exercise
// stays inert; `npm run phase-50a:proof` (vite-node, no VITEST in the
// environment) runs it exactly as before.
if (process.env['VITEST'] === undefined) {
  main().catch((err: unknown) => {
    process.stderr.write(`\nPHASE 50A TWO-HOST PROOF: FAIL\n${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  });
}
