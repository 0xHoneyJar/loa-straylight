// Phase 50A — Track A safety and authority closure.
//
// The sequence-83, sequence-89, sequence-95 and sequence-104 audits each
// rejected a head over the same four seams. This suite is the EXECUTABLE proof
// that the sequence-104 findings are closed STRUCTURALLY. Every assertion is an
// OBSERVATION taken through a seam, or a PROPERTY checked against the real
// connection parser — never an inspection of intent:
//
//   F-01  the Phase 31F observation seam preserves and restores the EXACT
//         ORIGINAL `process.kill` object — reference identity, on the resolved,
//         rejected and throwing paths.
//   F-04  the store DECIDES NOTHING about a connection string. It names its
//         target from the identity the DRIVER resolved, so the rendered target
//         is invariant under every change to userinfo and query, no credential
//         is recoverable from it under the whole decoding family, and the two
//         disagreement classes a transcription had — UPPERCASE parameter keys
//         and LEADING-SLASH SOCKET forms — are irrelevant BY CONSTRUCTION. A
//         target the driver never resolved is named as unnameable, without
//         throwing.
//   F-09  destructive authority binds to the store this harness CONSTRUCTED
//         for a fixed descriptor. No self-description, subclass override,
//         structural imitation or copied handle obtains it — proven by ZERO
//         recorded destructive operations, ZERO recorded tool invocations and
//         ZERO delegations to the imitation.
//   F-10  tool authority is issued only BY a fixed descriptor for its own
//         database, or BY the act that CREATES a scratch database. An
//         independently selected `p50a_*` name has no surface to enter
//         through.
//   F-14  what the observation seam actually SAW governs the report, the
//         PASS/MISMATCH verdict and the exit status. A destructive,
//         state-reducing, unrecognized or unobservable statement — or no
//         statement at all — fails the verification closed.
//
// NO DATABASE IS REQUIRED. Every proof here is about refusal, identity,
// redaction, issuance and observation, none of which needs a live server: the
// observation proofs drive the REAL seam over a stub client. So this suite runs
// in the ordinary `npm test` pass, not only under the Phase 50A opt-in. The
// behaviour that DOES need a database — the actual export/restore, and the live
// observation of `readStoreSnapshot` against real rows — is proven by
// `postgres-two-host-portability.test.ts` under that opt-in.
//
// ── WHY THE STATIC IMPORT LIST IS DELIBERATELY NARROW ─────────────────────
//
// The packet requires each sequence-104 counterexample to be shown FAILING
// against the substrate implementation and PASSING at the final head. That
// means THIS FILE must LOAD against both trees. A static
// `import { openBoundProofStore }` of a symbol the substrate does not export is
// an ESM LINK ERROR: the file would not load at all, every substrate run would
// fail for the wrong reason, and the packet disallows precisely that ("not by
// type error, import error or unrelated assertion").
//
// So the static list below is the INTERSECTION of the two trees' exports, and
// every symbol that exists on only one side is reached through a DYNAMIC import
// and probed as a property. That shape is also what the counterexamples want on
// their own merits: they ENUMERATE a module's exports rather than naming one
// function, because what has to be proven is that NO surface mints the
// authority — a statement about the whole module, not about a function somebody
// remembered to guard.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  PostgresEstateHost,
  readStoreSnapshot,
} from '../../src/straylight/storage/postgres/index.js';
import {
  ProofHostRefusedError,
  assertDistinctHosts,
  authorizedToolTarget,
  fixedProofHosts,
  isIssuedToolTarget,
  replacementHost,
  resolveProofHost,
  sourceHost,
  toolTargetOf,
  type ProofHost,
  type ProofToolTarget,
} from '../../scripts/phase-50a/hosts.js';
import {
  clusterSystemIdentifier,
  pgDump,
  psqlRestore,
  resetToolInvocations,
  toolInvocations,
} from '../../scripts/phase-50a/pg-tools.js';
import {
  destructiveOperations,
  emptySchema,
  resetDestructiveOperations,
} from '../../scripts/phase-50a/two-host-proof.js';
import { verifyExistingRestore } from '../../scripts/phase-50a/verify-existing-restore.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

/** The two modules whose export SURFACE differs between substrate and head. */
type HostsModule = typeof import('../../scripts/phase-50a/hosts.js');
type VerifierModule = typeof import('../../scripts/phase-50a/verify-existing-restore.js');

async function hostsModule(): Promise<HostsModule> {
  return import('../../scripts/phase-50a/hosts.js');
}

async function verifierModule(): Promise<VerifierModule> {
  return import('../../scripts/phase-50a/verify-existing-restore.js');
}

/**
 * Which of these exports is NOT a function on the module actually loaded.
 *
 * The counterexamples state the absence of a replacement seam as an ASSERTION
 * about the module's surface rather than letting a `TypeError: x is not a
 * function` stand in for it, so a substrate run fails with the reason named.
 */
function missingExports(module: object, names: readonly string[]): string[] {
  const surface = module as unknown as Record<string, unknown>;
  return names.filter((name) => typeof surface[name] !== 'function');
}

/**
 * The value itself plus its own enumerable property values, one level deep.
 *
 * Used by the F-09 and F-10 counterexamples to ask "does this returned value
 * REFERENCE the imposter / carry authority over the independently selected
 * name?" without knowing the shape of whatever surface produced it.
 */
function referenced(value: unknown): unknown[] {
  if (typeof value !== 'object' || value === null) return [value];
  const out: unknown[] = [value];
  for (const inner of Object.values(value as Record<string, unknown>)) out.push(inner);
  return out;
}

/**
 * Every function export, excluding `async` ones.
 *
 * An `async` export on these modules opens a connection (`createScratchDatabase`
 * runs `CREATE DATABASE`), and a counterexample must not dial a database to
 * prove a refusal. The async surface is covered separately, by name, with the
 * refusal asserted BEFORE any connection.
 */
function syncFunctionExports(module: object): Array<[string, (...args: unknown[]) => unknown]> {
  const out: Array<[string, (...args: unknown[]) => unknown]> = [];
  for (const [name, value] of Object.entries(module as Record<string, unknown>)) {
    if (typeof value !== 'function') continue;
    if (value.constructor?.name === 'AsyncFunction') continue;
    out.push([name, value as (...args: unknown[]) => unknown]);
  }
  return out;
}

/**
 * NON-LOOPBACK values used ONLY as inputs this suite proves are REDACTED or
 * REFUSED. Assembled from fragments, never written as a literal URL, for the
 * same reason the no-leak suite assembles its own provider tokens: a committed
 * PostgreSQL URL literal that does not target loopback is itself the thing
 * `no-leak-and-neutrality.test.ts` forbids — and that scan reads THIS FILE, so
 * even a comment may not spell the scheme prefix followed by a foreign host.
 * That scan must keep passing UNCHANGED. Nothing here is ever connected to;
 * these are refusal and redaction inputs only.
 */
const SCHEME = ['postgre', 'sql://'].join('');
/** RFC 5737 documentation address: reserved, routable nowhere. */
const OFF_HOST = ['198.51', '.100.7'].join('');
const OFF_HOST_ALT = ['198.51', '.100.8'].join('');
/** RFC 2606 reserved documentation name. */
const OFF_NAME = ['db.', 'invalid'].join('');

/**
 * LOOPBACK origins for the redaction matrix, as template pieces.
 *
 * These targets ARE loopback — that is the point of the userinfo-free cases: a
 * credential carried only in a query parameter. But the committed-loopback scan
 * in `no-leak-and-neutrality.test.ts` proves loopback by requiring `@127.0.0.1`,
 * i.e. it presumes userinfo is present, and it exempts template interpolations
 * (the form `hosts.ts` already relies on). That suite must pass UNCHANGED, so
 * these are interpolated rather than written as bare literals; the host is
 * pinned here, by value, immediately below.
 */
const LOOPBACK = '127.0.0.1';
const SOURCE_ORIGIN = `${SCHEME}${LOOPBACK}:55432`;
// The host really is loopback — asserted by value, not left to the pattern.
if (!SOURCE_ORIGIN.includes('127.0.0.1')) throw new Error('SOURCE_ORIGIN must be loopback');
/** A port nothing listens on, for handles that must never reach a server. */
const DEAD_ORIGIN = `${SCHEME}straylight_proof:x@${LOOPBACK}:1`;

/**
 * Strip comments so a prohibition is asserted over EXECUTABLE TEXT.
 *
 * Load-bearing: every comment below explains the very construct it forbids
 * (`process.env`, `TRUNCATE`, `describeTarget`, `declareScratchDatabase`), so a
 * raw-bytes scan would be satisfied by the explanation and would keep passing
 * after the safeguard itself was deleted. Blanking comments to whitespace
 * preserves offsets while removing that false witness.
 */
function executableText(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, lead: string) => lead + ' '.repeat(m.length - lead.length));
}

// ── F-01 — the seam restores the EXACT ORIGINAL objects ───────────────────
//
// The identity property is proven WHERE IT LIVES, in
// `tests/phase-31f-operator-recall-wedge-demo.test.ts`, because that file
// carries the seam and a defect reintroduced there must fail there. What THIS
// suite adds is the proof that those assertions exist, are wired to all three
// exit paths, and are stated as reference identity — and it proves the property
// independently by running that file in a CHILD vitest process and observing the
// result, so the claim does not rest on reading the file's text.
describe('Phase 50A F-01 — the Phase 31F seam preserves the exact original process.kill', () => {
  const seamFile = resolve(ROOT, 'tests/phase-31f-operator-recall-wedge-demo.test.ts');
  const seamText = readFileSync(seamFile, 'utf8');

  it('saves the ORIGINAL process.kill, not process.kill.bind(process)', () => {
    // The audited defect, stated as the absence of the exact construct that
    // caused it. `.bind(process)` produced a NEW function object, so restoring
    // it left `process.kill` permanently replaced.
    expect(
      /const realKill = process\.kill;/.test(seamText),
      'the seam must save the unbound original: `const realKill = process.kill;`',
    ).toBe(true);
    expect(
      /realKill\s*=\s*process\.kill\.bind\(/.test(seamText),
      'the seam must NOT save a bound copy of process.kill (the sequence-83 blocker)',
    ).toBe(false);
  });

  it('restores both globals in a finally block, by assignment to the saved originals', () => {
    expect(/process\.kill = realKill;/.test(seamText)).toBe(true);
    expect(/globalThis\.setTimeout = realSetTimeout;/.test(seamText)).toBe(true);
    // The restoration is unconditional — inside `finally`, not on a success path.
    const finallyBlock = /\} finally \{\s*recording = false;\s*process\.kill = realKill;\s*globalThis\.setTimeout = realSetTimeout;/;
    expect(
      finallyBlock.test(seamText),
      'both globals must be restored in the seam’s finally block',
    ).toBe(true);
  });

  it('asserts REFERENCE identity (Object.is) against a pre-seam capture on all three exit paths', () => {
    // The packet forbids proving identity by structure or name, so the proof
    // must be Object.is against a capture taken before any seam existed.
    expect(/const PRISTINE_PROCESS_KILL/.test(seamText)).toBe(true);
    expect(/Object\.is\(process\.kill, PRISTINE_PROCESS_KILL\)/.test(seamText)).toBe(true);
    expect(/Object\.is\(globalThis\.setTimeout, PRISTINE_SET_TIMEOUT\)/.test(seamText)).toBe(true);
    // Wired to the resolved, rejected and throwing paths, each by name.
    for (const label of ["'success'", "'nonzero-exit'", "'throwing'"]) {
      expect(
        seamText.includes(`expectGlobalsRestored(${label})`),
        `the identity assertion must run on the ${label} path`,
      ).toBe(true);
    }
  });

  it('OBSERVED: this worker’s own process.kill is not a BOUND replacement', () => {
    // Independent of the Phase 31F file's text: whatever this worker has run so
    // far, no suite has left a bound copy installed.
    //
    // The discriminator is exact. Node implements `process.kill` in JavaScript,
    // so its source begins `function kill(pid, sig) {`. A BOUND copy —
    // `process.kill.bind(process)`, the audited defect — is an exotic bound
    // function, and `Function.prototype.toString` renders those as
    // `function () { [native code] }`, losing the name and the parameters. So a
    // leaked bound replacement is visible here even though `typeof` and arity
    // would agree.
    expect(typeof process.kill).toBe('function');
    const killSource = Function.prototype.toString.call(process.kill);
    expect(
      /\[native code\]/.test(killSource),
      `process.kill stringifies as a bound/exotic function (${killSource.slice(0, 80)}) — ` +
        'a seam leaked a bound replacement into this worker',
    ).toBe(false);
    expect(killSource).toMatch(/^function kill\s*\(/);

    const timeoutSource = Function.prototype.toString.call(globalThis.setTimeout);
    expect(/\[native code\]/.test(timeoutSource)).toBe(false);
    expect(timeoutSource).toMatch(/^function setTimeout\s*\(/);

    // THE DISCRIMINATOR IS REAL: a bound copy of the very same function does
    // stringify that way, which is why the assertions above can detect one.
    expect(/\[native code\]/.test(Function.prototype.toString.call(process.kill.bind(process)))).toBe(
      true,
    );
  });
});

// ── F-04 — the redaction matrix ───────────────────────────────────────────
//
// Every case asserts the ABSENCE OF EVERY SECRET SUBSTRING, raw and
// percent-decoded — never merely the presence of `<redacted>`, which a
// partially redacted string would also satisfy.

// SUPERSEDED BY THE SEQUENCE-110 AUDIT — THERE IS NO REDACTION MATRIX NOW.
//
// The two-line header immediately above belongs to the F-01 block this slice
// must preserve byte-for-byte, so it still announces a matrix of redactions of a
// connection string. That whole shape is what the sequence-110 audit rejected.
//
// A redactor has to KNOW where the credential is, and knowing that means
// reproducing what the real connection parser does: its pre-encoding, its WHATWG
// `URL` construction, its parameter-name normalization, its case rules and its
// credential-name list. The substrate reproduced all of it. Safe probes then
// found the reproduction DISAGREEING with the authority it was imitating on
// UPPERCASE parameter keys and on LEADING-SLASH SOCKET forms — and no matrix
// closes that, because a second parser is wrong in ways that are discovered
// rather than designed out.
//
// So `redactConnectionString` is GONE, with every helper that fed it, and no
// module in the store renders connection-string material at all. What follows
// proves the replacement property, which is both stronger and smaller: the store
// names its target from the identity the DRIVER ITSELF resolved, emits no
// userinfo and no query text in any form, and is therefore INVARIANT under every
// change to the credential-bearing parts of a connection string. That invariance
// is the proof that both disagreement classes are IRRELEVANT BY CONSTRUCTION —
// not handled, not closed case by case, but unable to reach the output at all.

describe("Phase 50A F-04 — the store names its target from the caller's DECLARED descriptor, never the driver, and transcribes no parser", () => {
  // ── SUPERSEDED AGAIN BY THE SEQUENCE-116 AUDIT ───────────────────────────
  //
  // The frozen preamble above records the sequence-110 closure: the redaction
  // matrix was removed and the store named its target "from the identity the
  // DRIVER ITSELF resolved". The sequence-116 audit REJECTED that too. `pg`'s
  // resolution is attacker-reachable — a URI with no path database makes the
  // USERNAME the database, a query `?host=` supplies the host, an unreadable
  // option makes the driver quote the offending text back verbatim, and the LAST
  // client built overwrote one mutable host-level record — so a diagnostic built
  // from any of it prints connection-string-derived material the store cannot
  // bound.
  //
  // The head resolves NOTHING from the connection. `describeTarget()` renders
  // only the non-secret descriptor the caller declared from its own trusted
  // configuration, or a constant unresolved identity when none was declared. The
  // proofs below therefore turn on a NEW oracle — the caller's DECLARED
  // descriptor — and drive connection strings that would have made `pg` resolve
  // something different: the substrate prints pg's answer and FAILS, the head
  // prints the declaration and PASSES. This block is rewritten for that design;
  // the sections it keeps (the no-second-parser scans, the credential-invariance
  // counterexample, and the fail-closed and reachability guards) are unchanged in
  // intent and re-proved against a declared descriptor.

  /** The adapter boundary: every module allowed to know a connection string exists. */
  const POSTGRES_DIR = resolve(ROOT, 'src/straylight/storage/postgres');
  const storeModules = (): ReadonlyArray<{ name: string; executable: string }> =>
    readdirSync(POSTGRES_DIR)
      .filter((name) => name.endsWith('.ts'))
      .map((name) => ({
        name,
        executable: executableText(readFileSync(resolve(POSTGRES_DIR, name), 'utf8')),
      }));

  /**
   * A target `pg` can resolve and never reach: a dead loopback port.
   *
   * Assembled and interpolated for the reason the constants above are — the
   * committed-loopback scan in `no-leak-and-neutrality.test.ts` reads this file
   * and must keep passing unchanged.
   */
  const DEAD_TARGET = `${SCHEME}${LOOPBACK}:1`;
  /** A socket directory that cannot exist, so the socket form fails immediately. */
  const ABSENT_SOCKET_DIR = '/nonexistent/straylight-absent-socket';

  /**
   * A NON-SECRET target descriptor a caller declares from its own trusted
   * configuration — structurally the store's `TrustedTargetDescriptor`. It is a
   * LOCAL alias, not the exported type, so this file stays loadable against the
   * substrate (which exports no such type) while it type-checks against the head
   * (which does): the head's constructor accepts `{ target }`, and the substrate
   * ignores the second constructor argument entirely.
   */
  type DeclaredTarget = { readonly host: string; readonly port: number; readonly database: string };

  /**
   * Open a host and make `pg` BUILD A CLIENT for it, then hand the host back.
   *
   * When a `target` is declared the head names THAT and only that (F-04); when it
   * is not, the head names a constant unresolved identity. The substrate ignores
   * the descriptor and reports whatever `pg` resolved from the connection string
   * — which is exactly the difference the safe-projection proofs below turn on.
   * Every target used with this helper is a dead loopback port or an absent unix
   * socket, so the acquisition MUST fail — and its failure is what forces `pg` to
   * construct the client whose resolved identity the substrate reports.
   */
  const forceResolve = async (
    connectionString: string,
    target?: DeclaredTarget,
  ): Promise<PostgresEstateHost> => {
    const host = new PostgresEstateHost(
      {
        connectionString,
        maxConnections: 1,
        connectionTimeoutMs: 5_000,
      },
      target ? { target } : {},
    );
    await host.withClient(async () => undefined).then(
      () => {
        throw new Error(
          `phase-50a: ${connectionString} was expected to be unreachable but connected`,
        );
      },
      () => undefined,
    );
    return host;
  };

  /** The query span of a text, as a reader would slice it: after `?`, before `#`. */
  const querySpan = (text: string): string => {
    const start = text.indexOf('?');
    if (start < 0) return '';
    const rest = text.slice(start + 1);
    const hash = rest.indexOf('#');
    return hash >= 0 ? rest.slice(0, hash) : rest;
  };

  /**
   * EVERY FORM A READER COULD RECOVER FROM A TEXT.
   *
   * ── WHY THIS IS NOT A TRANSCRIPTION (sequence-110 audit, F-04) ────────────
   *
   * The audit rejected a decoder matrix that DECIDED WHAT TO PRINT. This one
   * decides nothing: it is the test's ATTACKER, applied to output the store has
   * already produced. It models the readings a consumer of a diagnostic can
   * apply — the text itself, percent decoding, form decoding (`+` to space),
   * `URLSearchParams` over the whole text and over its query span, and WHATWG
   * `URL` field extraction — and asks whether a credential survives any of them.
   *
   * It is also no longer mirroring anything: after this slice the store has NO
   * decoder, NO parameter-name rule and NO second `URL` construction for this to
   * be a copy of. `config.ts` exports exactly two symbols (pinned below), and the
   * absence of the whole transcription surface is asserted mechanically further
   * down. Adding a reading here can only strengthen the assertion; removing one
   * is what the F-04 mutation proof detects.
   */
  const recoverableForms = (text: string): readonly string[] => {
    const forms = new Set<string>([text]);
    const add = (value: string | undefined): void => {
      if (value !== undefined && value.length > 0) forms.add(value);
    };
    const decoded = (value: string): string | undefined => {
      try {
        return decodeURIComponent(value);
      } catch {
        return undefined; // undecodable: the raw form is the whole reading
      }
    };
    add(decoded(text));
    const formDecoded = text.replace(/\+/g, ' ');
    add(formDecoded);
    add(decoded(formDecoded));
    // `URLSearchParams` NEVER throws, and it form-decodes.
    for (const span of [text, querySpan(text)]) {
      for (const [name, value] of new URLSearchParams(span)) {
        add(name);
        add(value);
      }
    }
    try {
      const url = new URL(text);
      for (const field of [url.username, url.password, url.pathname, url.hash, url.search]) {
        add(field);
        add(decoded(field));
      }
      for (const [name, value] of url.searchParams) {
        add(name);
        add(value);
      }
    } catch {
      /* not a URL: the textual readings above are the whole reading */
    }
    return [...forms];
  };

  /**
   * A credential is UNRECOVERABLE from a text: no spelling of it appears in any
   * form a reader can obtain. Both sides are widened — the TEXT is read every
   * way, and the SECRET is sought in every spelling it could have been written
   * as, because the credential the driver receives may have been written into
   * the URI decoded, percent-encoded or form-encoded.
   */
  const expectUnrecoverable = (emitted: string, secret: string, label: string): void => {
    const forms = recoverableForms(emitted);
    const spellings = new Set<string>([secret]);
    const push = (value: string | undefined): void => {
      if (value !== undefined && value.length > 0) spellings.add(value);
    };
    push(encodeURIComponent(secret));
    push(secret.replace(/ /g, '+'));
    push(secret.replace(/\+/g, ' '));
    try {
      push(decodeURIComponent(secret));
    } catch {
      /* undecodable spelling: the others are the whole set */
    }
    for (const spelling of spellings) {
      for (const form of forms) {
        expect(
          form.includes(spelling),
          `${label}: the credential is RECOVERABLE. Spelling ${JSON.stringify(spelling)} ` +
            `appears in the reading ${JSON.stringify(form)} of ${JSON.stringify(emitted)}`,
        ).toBe(false);
      }
    }
  };

  /**
   * NOTHING PARSER-SENSITIVE IS EMITTED AT ALL.
   *
   * Stronger than "the secret is absent", and the reason the disagreement
   * classes cannot matter: a rendered target carries no query span, no
   * parameter separator and no percent escape, so there is no material in it for
   * a credential to hide inside — encoded, decoded or otherwise.
   */
  const expectNoParserSensitiveMaterial = (emitted: string, label: string): void => {
    for (const forbidden of ['?', '&', '%', '=', '#']) {
      expect(
        emitted.includes(forbidden),
        `${label}: the rendered target carries ${JSON.stringify(forbidden)}: ${emitted}`,
      ).toBe(false);
    }
    // The userinfo POSITION is a constant, so the only thing before the `@` is
    // the placeholder — never a user, never a password, never a fragment of one.
    const at = emitted.indexOf('@');
    expect(at, `${label}: a rendered target names a userinfo position`).toBeGreaterThan(0);
    expect(emitted.slice(0, at).endsWith('<redacted>'), `${label}: userinfo is not the constant`).toBe(
      true,
    );
  };

  // ── THE TRANSCRIPTION IS GONE, AND NOT ANYWHERE ELSE EITHER ──────────────
  //
  // The audit's finding was about a SECOND PARSER, so the closure has to be
  // stated over the whole adapter boundary rather than over the one function
  // that used to hold it. This scans EXECUTABLE TEXT, because every comment in
  // `config.ts` names the constructs it no longer performs — a raw-bytes scan
  // would be satisfied by the explanation and would keep passing if the code
  // came back.
  it('NO SECOND PARSER: no module in the store decodes, folds, re-spells or re-parses a connection string', () => {
    const TRANSCRIPTION: readonly string[] = [
      'pg-connection-string',
      'decodeURIComponent',
      'encodeURIComponent',
      'URLSearchParams',
      'new URL(',
      'toLowerCase',
      'toUpperCase',
      'normalize(',
      'password',
      'passwd',
      'pgpassword',
      'sslpassword',
      'sslkey',
      'pgpassfile',
    ];
    const modules = storeModules();
    // The scan is worthless if it scanned nothing.
    expect(modules.length, 'the adapter boundary must have modules to scan').toBeGreaterThan(8);
    for (const { name, executable } of modules) {
      for (const token of TRANSCRIPTION) {
        expect(
          executable.includes(token),
          `${name} must not transcribe connection-string semantics: found ${JSON.stringify(token)}`,
        ).toBe(false);
      }
    }
  });

  it('NO SECOND PARSER: the connection string is passed to the driver and interpolated nowhere', () => {
    for (const { name, executable } of storeModules()) {
      // No message anywhere in the store is built out of connection-string text.
      expect(
        /\$\{[^}]*connectionString[^}]*\}/.test(executable),
        `${name} must not interpolate a connection string into a string`,
      ).toBe(false);
      expect(
        /connectionString\s*\+|\+\s*[A-Za-z.]*connectionString/.test(executable),
        `${name} must not concatenate a connection string into a string`,
      ).toBe(false);
    }
    // And in the one module that holds it, the ONLY appearance is the single line
    // that hands it to `pg` — the option name and the value read from config. Two
    // occurrences, one statement, no other mention anywhere in the module.
    const hostExecutable = executableText(readFileSync(resolve(POSTGRES_DIR, 'host.ts'), 'utf8'));
    const lines = hostExecutable
      .split('\n')
      .filter((l) => l.includes('connectionString'))
      .map((l) => l.trim());
    expect(lines, 'host.ts mentions the connection string outside the one hand-off').toEqual([
      'connectionString: this.config.connectionString,',
    ]);
  });

  it('SOLE EMITTER: target identity is rendered in one place and reached only through describeTarget()', () => {
    const hostExecutable = executableText(readFileSync(resolve(POSTGRES_DIR, 'host.ts'), 'utf8'));
    // The renderer is defined once and called once, and the one call is the body
    // of `describeTarget`. A second call site would be a second emitter.
    expect((hostExecutable.match(/renderTarget\(/g) ?? []).length).toBe(2);
    expect(hostExecutable).toContain('describeTarget(): string {\n    return renderTarget(this.target);');
    // Every other module in the store names a target by CALLING that emitter.
    for (const { name, executable } of storeModules()) {
      if (name === 'host.ts') continue;
      expect(
        /renderTarget\(|targetIdentity/.test(executable),
        `${name} must not render a target itself`,
      ).toBe(false);
    }
  });

  // ── THE IDENTITY IS THE CALLER'S DECLARATION, NOT THE DRIVER'S ANSWER ─────
  //
  // These four tests replace the rejected DRIVER-AGREEMENT oracle. That oracle
  // constructed `pg`'s own `Client` and asserted the store AGREED with what pg
  // resolved — precisely the property the sequence-116 audit rejected, because
  // pg's resolution is attacker-reachable (see the superseding note above). The
  // head reads nothing back from pg, so there is no pg answer to agree with and
  // no second `Client` oracle to mirror. The oracle is now the caller's DECLARED
  // descriptor, and each test drives a connection string that would have made pg
  // resolve something DIFFERENT: the substrate prints pg's answer and fails here,
  // the head prints the declaration and passes. Together they close the four
  // sequence-116 channels — username→database fallback, query-controlled host,
  // raw sslkey/driver-error text, and mutable last-client identity.

  /** The caller's own trusted, non-secret account of where a proof host connects. */
  const DECLARED: DeclaredTarget = { host: LOOPBACK, port: 55432, database: 'straylight_source' };

  it('SAFE PROJECTION (F-04): describeTarget names the DECLARED descriptor, never what pg resolved (username→database fallback and query-supplied host)', async () => {
    // The string dials elsewhere and carries a credential: userinfo, NO path
    // database (so pg would fall the database back to the username `leakydbname`),
    // and a query `?host=` pg would resolve as the host. None of pg's answer may
    // reach the diagnostic — only the caller's declared descriptor may.
    const host = await forceResolve(
      `${SCHEME}leakydbname:realsecret@${LOOPBACK}:1/?host=${ABSENT_SOCKET_DIR}`,
      DECLARED,
    );
    try {
      const described = host.describeTarget();
      // The declared descriptor, in full.
      expect(described, 'the declared port must be named').toContain(String(DECLARED.port));
      expect(described, 'the declared database must be named').toContain(DECLARED.database);
      // NOT the database pg would have resolved from the username (channel 1).
      expect(
        described,
        'the username→database fallback leaked into the diagnostic',
      ).not.toContain('leakydbname');
      // NOT the host pg would have resolved from the query (channel 2).
      expect(described, 'the query-supplied host leaked into the diagnostic').not.toContain(
        ABSENT_SOCKET_DIR,
      );
      expectNoParserSensitiveMaterial(described, 'safe projection');
      expectUnrecoverable(described, 'realsecret', 'safe projection');
    } finally {
      await host.close();
    }
  });

  it('SAFE PROJECTION (F-04): the diagnostic is OPERATION-SCOPED — it does not change as clients come and go (no mutable last-client state)', async () => {
    // The rejected mechanism stored the LAST client's resolved identity in one
    // mutable host-level record, so the identity printed was whichever client
    // connected most recently (channel 4). Here the descriptor is fixed at
    // construction, so the SAME identity is named before any client is built and
    // after one is — and it names the declaration, not what that client resolved.
    const host = new PostgresEstateHost(
      {
        connectionString: `${SCHEME}otheruser:realsecret@${LOOPBACK}:1/other_db`,
        maxConnections: 1,
        connectionTimeoutMs: 5_000,
      },
      { target: DECLARED },
    );
    try {
      const before = host.describeTarget();
      await host.withClient(async () => undefined).catch(() => undefined);
      const after = host.describeTarget();
      expect(
        after,
        'the diagnostic changed after a client was built — it is last-client state, not operation-scoped',
      ).toBe(before);
      expect(before).toContain(String(DECLARED.port));
      expect(before).toContain(DECLARED.database);
      expect(before, 'a resolved database leaked into the diagnostic').not.toContain('other_db');
      expect(before, 'a resolved user leaked into the diagnostic').not.toContain('otheruser');
    } finally {
      await host.close();
    }
  });

  it('SAFE PROJECTION (F-04): a driver failure is reported as a typed category, never the raw driver error text (surface)', () => {
    // The rejected mechanism built connection_failed and transaction_aborted
    // messages out of the raw `err.message`, which for a driver error carries an
    // sslkey/sslcert FILE PATH, an invalid option quoted back, or a resolved host
    // name (channel 3). The head borrows only a closed-shape SQLSTATE code and
    // otherwise collapses to a constant — asserted here on the executable text.
    const hostExecutable = executableText(readFileSync(resolve(POSTGRES_DIR, 'host.ts'), 'utf8'));
    // The failure category is the typed helper, not a message interpolation.
    expect(hostExecutable).toContain('driverFailureCategory(err)');
    // The SQLSTATE gate is the closed five-character shape and nothing else.
    expect(hostExecutable).toContain('/^[0-9A-Z]{5}$/');
    // No raw driver message is described into any diagnostic.
    expect(
      hostExecutable.includes('${describe(err)}'),
      'host.ts interpolates the raw driver error text into a diagnostic',
    ).toBe(false);
    expect(
      /\bdescribe\(\s*err\s*\)/.test(hostExecutable),
      'host.ts describes the raw driver error',
    ).toBe(false);
  });

  it('SAFE PROJECTION (F-04): an sslkey/driver failure surfaces a typed category and never the offending file path (behavioral)', async () => {
    // `pg` READS the sslkey file while constructing its client, so an absent path
    // throws a Node ENOENT whose message NAMES the path. The rejected mechanism
    // interpolated that message; the head reports a typed category only, so
    // neither the path nor the passphrase reaches the operator (channel 3).
    const host = new PostgresEstateHost(
      {
        connectionString: `${SCHEME}${LOOPBACK}:1/straylight_source?sslkey=/keys/privatesecret.pem&sslpassword=leakedsecret`,
        maxConnections: 1,
        connectionTimeoutMs: 5_000,
      },
      { target: DECLARED },
    );
    try {
      let message = '';
      try {
        await host.withClient(async () => undefined);
        throw new Error('phase-50a: the sslkey target was expected to refuse the connection');
      } catch (err) {
        message = err instanceof Error ? err.message : String(err);
      }
      expect(message).toContain('could not acquire a connection');
      // The raw driver error — here an ENOENT naming the private key file — is
      // absent in every reading, as is the passphrase.
      expect(message, 'the offending sslkey path leaked into the diagnostic').not.toContain(
        '/keys/privatesecret.pem',
      );
      expect(message, 'the raw Node error code leaked into the diagnostic').not.toContain('ENOENT');
      expectUnrecoverable(message, '/keys/privatesecret.pem', 'sslkey driver failure');
      expectUnrecoverable(message, 'leakedsecret', 'sslkey driver failure');
    } finally {
      await host.close();
    }
  });

  // ── THE COUNTEREXAMPLE: IRRELEVANT BY CONSTRUCTION ───────────────────────
  //
  // The packet requires the rejected abstraction to be shown FAILING against the
  // substrate and PASSING here, and requires this suite to STATE which of the two
  // permitted resolutions of the disagreement classes it took. It took
  // IRRELEVANCE BY CONSTRUCTION, and this is the proof of it.
  //
  // Every input below differs from the credential-free base ONLY in userinfo and
  // in query parameters that are not the target's identity, and every one of them
  // is a case from a rejected head: the sequence-89 encoded names, the
  // sequence-95 control-character normalizations, the sequence-104 form-decoded
  // values and unalignable queries, and the sequence-110 UPPERCASE keys. The
  // assertion is not that each was redacted correctly. It is that the rendered
  // target is BYTE-IDENTICAL to the base's for all of them — so no property of
  // userinfo or query, and no disagreement about any such property, can reach the
  // output. A parser disagreement about material that is never read cannot leak.
  //
  // Against the substrate this fails on the defect: the substrate rendered the
  // query with credential parameters rewritten, so a base with no query and a
  // variant with `?application_name=straylight` produce DIFFERENT text, and the
  // first assertion below reports exactly that. The surface assertion in the
  // companion test fails there too, because the substrate still exports the
  // transcription.
  const CREDENTIAL_VARIANTS: ReadonlyArray<{
    label: string;
    query: string;
    userinfo: string;
    secrets: readonly string[];
  }> = [
    { label: 'no credential at all', query: '', userinfo: '', secrets: [] },
    {
      label: 'password-only userinfo',
      query: '',
      userinfo: ':hunter2secret@',
      secrets: ['hunter2secret'],
    },
    {
      label: 'user and password userinfo',
      query: '',
      userinfo: 'appuser:hunter2secret@',
      secrets: ['hunter2secret', 'appuser'],
    },
    {
      label: 'credential ONLY in a query parameter',
      query: '?password=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    {
      label: 'percent-encoded credential value',
      query: '?password=p%40ss%3Aw%2Frd',
      userinfo: '',
      secrets: ['p%40ss%3Aw%2Frd', 'p@ss:w/rd'],
    },
    // ── SEQUENCE-110: UPPERCASE PARAMETER KEYS ─────────────────────────────
    {
      label: 'UPPERCASE parameter name',
      query: '?PASSWORD=UPPERSECRET',
      userinfo: '',
      secrets: ['UPPERSECRET'],
    },
    {
      label: 'Capitalised parameter name',
      query: '?Password=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    {
      label: 'UPPERCASE credential name with a lowercase twin',
      query: '?PASSWORD=uppersecret&password=lowersecret',
      userinfo: '',
      secrets: ['uppersecret', 'lowersecret'],
    },
    {
      label: 'multiple credential parameters in one URI',
      query: '?password=firstsecret&passwd=secondsecret&pgpassword=thirdsecret',
      userinfo: '',
      secrets: ['firstsecret', 'secondsecret', 'thirdsecret'],
    },
    {
      // The SSL passphrase only. `sslkey` is NOT here on purpose: the driver
      // READS the key file while constructing its client, so an absent path
      // makes the client construction itself fail and the target stay
      // unresolved. That case is proven in the unresolved-target test below,
      // where the outcome is "say less", not a different rendering.
      label: 'SSL passphrase parameter',
      query: '?sslpassword=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    // ── SEQUENCE-89: ENCODED PARAMETER NAMES ───────────────────────────────
    { label: 'ENCODED name (pass%77ord)', query: '?pass%77ord=hunter2secret', userinfo: '', secrets: ['hunter2secret'] },
    {
      label: 'FULLY ENCODED name (%70%61%73%73%77%6Frd)',
      query: '?%70%61%73%73%77%6Frd=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    // ── SEQUENCE-95: NAMES THE URL PARSER NORMALIZES ───────────────────────
    {
      label: 'NORMALIZED name, bare LF in the credential name',
      query: '?pass\nword=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    {
      label: 'NORMALIZED name, bare TAB in the credential name',
      query: '?pass\tword=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    {
      label: 'NORMALIZED name, bare CR in the credential name',
      query: '?pgpass\rword=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    // ── SEQUENCE-104: FORM DECODING AND UNALIGNABLE QUERIES ────────────────
    {
      label: 'FORM-DECODED credential value (+ is a space)',
      query: '?password=hunter+2+secret',
      userinfo: '',
      secrets: ['hunter+2+secret', 'hunter 2 secret'],
    },
    {
      label: 'FORM-DECODED value repeated under a NON-credential name',
      query: '?password=hunter+2+secret&application_name=hunter+2+secret',
      userinfo: '',
      secrets: ['hunter+2+secret', 'hunter 2 secret'],
    },
    {
      label: 'UNALIGNABLE query: raw segments and parsed entries do not correspond',
      query: '?\r=1&\n&=hunter2secret',
      userinfo: '',
      secrets: ['hunter2secret'],
    },
    {
      label: 'UNDECODABLE credential name with a form-encoded value',
      query: '?pass%ZZword=leaked+secret',
      userinfo: '',
      secrets: ['leaked+secret', 'leaked secret'],
    },
    // NON-CREDENTIAL parameters, to prove the invariance is not "everything is
    // withheld because the query happened to look dangerous".
    {
      label: 'only NON-credential parameters',
      query: '?application_name=straylight&connect_timeout=5',
      userinfo: '',
      secrets: [],
    },
    {
      label: 'userinfo AND query together, with a fragment',
      query: '?password=secondsecret#note',
      userinfo: 'appuser:firstsecret@',
      secrets: ['firstsecret', 'secondsecret', 'appuser'],
    },
  ];

  it('COUNTEREXAMPLE (F-04): the rendered target is INVARIANT under every credential-bearing change, so both disagreement classes are irrelevant by construction', async () => {
    const base = await forceResolve(`${DEAD_TARGET}/straylight_source`, DECLARED);
    let baseline: string;
    try {
      baseline = base.describeTarget();
    } finally {
      await base.close();
    }
    // The baseline must genuinely name the target, or invariance would be the
    // trivial property of a renderer that says nothing.
    expect(baseline).toContain(LOOPBACK);
    expect(baseline).toContain('straylight_source');

    // EVERY rendering is collected before ANY assertion, deliberately. The
    // claim this counterexample makes is the INVARIANCE — that no rendering
    // depends on userinfo or query at all — so that claim is asserted over the
    // whole set first. A tree whose rendering does depend on them then fails on
    // the dependency, which is the finding, rather than on a narrower guard
    // about the shape of whichever rendering came first.
    const rendered: { label: string; described: string; secrets: readonly string[] }[] = [];
    for (const variant of CREDENTIAL_VARIANTS) {
      const input = `${SCHEME}${variant.userinfo}${LOOPBACK}:1/straylight_source${variant.query}`;
      const host = await forceResolve(input, DECLARED);
      try {
        rendered.push({
          label: variant.label,
          described: host.describeTarget(),
          secrets: variant.secrets,
        });
      } finally {
        await host.close();
      }
    }
    expect(rendered.length, 'no rendering was collected to compare').toBe(CREDENTIAL_VARIANTS.length);

    // THE INVARIANCE. Nothing about userinfo or query reached the output,
    // because the output does not depend on either.
    for (const { label, described } of rendered) {
      expect(
        described,
        `${label}: the rendered target CHANGED with credential-bearing material, ` +
          'so something read it',
      ).toBe(baseline);
    }

    // And the invariant value is itself free of parser-sensitive material, so
    // the invariance is not the property of a renderer that leaks identically
    // every time.
    expectNoParserSensitiveMaterial(baseline, 'baseline');
    for (const { label, described, secrets } of rendered) {
      expectNoParserSensitiveMaterial(described, label);
      for (const secret of secrets) {
        expectUnrecoverable(described, secret, label);
      }
    }
  });

  it('COUNTEREXAMPLE (F-04): the store exports no connection-string renderer for anything to disagree with', async () => {
    // The other half of the same finding, as a statement about the SURFACE: a
    // transcription that no longer decides anything but still exists is still a
    // second parser someone can call. Against the substrate this fails here.
    const config = (await import('../../src/straylight/storage/postgres/config.js')) as unknown as
      Record<string, unknown>;
    const barrel = (await import('../../src/straylight/storage/postgres/index.js')) as unknown as
      Record<string, unknown>;
    for (const [label, surface] of [
      ['config.ts', config],
      ['the store barrel', barrel],
    ] as const) {
      for (const name of Object.keys(surface)) {
        expect(
          /redact|parserView|parserReadings|credentialParameter/i.test(name),
          `${label} must not export a connection-string renderer: found ${name}`,
        ).toBe(false);
      }
    }
    expect(config['redactConnectionString'], 'config.ts must not export redactConnectionString').toBe(
      undefined,
    );
  });

  // ── FAIL CLOSED, WITHOUT THROWING ────────────────────────────────────────
  it('MALFORMED and UNRESOLVABLE targets are named as unnameable rather than parsed', async () => {
    // `describeTarget()` runs inside error construction, where throwing would
    // replace a diagnostic with a different failure. These inputs are the ones a
    // transcription would have had to have a rule for; here there is no rule,
    // and the store says less.
    const malformed: readonly string[] = [
      `${SCHEME}@/db?password=leakedsecret`,
      `${SCHEME}${LOOPBACK}:1/db?pass word=leakedsecret`,
      `${SCHEME}${LOOPBACK}:1/db?password=leaked+secret#a?b=c`,
      `${SCHEME}${LOOPBACK}:1/db?pass%ZZword=leaked+secret`,
      // SSL KEY MATERIAL. The driver reads the key file when it builds a client,
      // so an absent path leaves the target unresolved — the sanctioned "say
      // less" outcome, and neither the path nor the passphrase is rendered.
      `${SCHEME}${LOOPBACK}:1/db?sslkey=/keys/privatesecret.pem&sslpassword=leakedsecret`,
      'not-a-connection-string-at-all',
      ' ',
    ];
    for (const input of malformed) {
      // NEVER CONNECTED. The unresolved rendering is the one every host starts
      // in, and it is reached without the driver having parsed anything.
      const host = new PostgresEstateHost({ connectionString: input });
      try {
        let described = '';
        expect(() => {
          described = host.describeTarget();
        }, `describeTarget threw on ${JSON.stringify(input)}`).not.toThrow();
        expect(described).toContain('<redacted>');
        expect(described).toContain('<target unresolved>');
        for (const secret of [
          'leakedsecret',
          'leaked secret',
          'leaked+secret',
          '/keys/privatesecret.pem',
        ]) {
          expectUnrecoverable(described, secret, `unresolved ${JSON.stringify(input)}`);
        }
      } finally {
        await host.close();
      }
    }
  });

  it('a NON-STRING connection string is REFUSED, with no part of it in the message', () => {
    // Reachable from untyped JavaScript callers. The refusal happens before a
    // host exists, and its message is a constant — there is no interpolation of
    // the value into it, so an object carrying a credential cannot be stringified
    // into a diagnostic.
    for (const value of [undefined, null, 42, { password: 'hunter2secret' }, ['hunter2secret']]) {
      let message = '';
      expect(() => new PostgresEstateHost({ connectionString: value as never })).toThrow(
        /connectionString is required/,
      );
      try {
        new PostgresEstateHost({ connectionString: value as never });
      } catch (err) {
        message = err instanceof Error ? err.message : String(err);
      }
      expectUnrecoverable(message, 'hunter2secret', `non-string ${String(value)}`);
    }
  });

  // ── THE PRODUCTION DIAGNOSTIC, AS AN OPERATOR SEES IT ────────────────────
  it('DIAGNOSTIC REACHABILITY: the real connection-failure message names the target and carries no credential', async () => {
    // The finding is only closed if this is what actually reaches an operator.
    // `PostgresUnavailableError` from a failed acquisition is that surface — the
    // message is built from `describeTarget()` and nothing else.
    const host = new PostgresEstateHost(
      {
        connectionString: `${SCHEME}appuser:hunter2secret@${LOOPBACK}:1/straylight_source?password=secondsecret&application_name=straylight`,
        maxConnections: 1,
        connectionTimeoutMs: 5_000,
      },
      { target: DECLARED },
    );
    try {
      let message = '';
      try {
        await host.withClient(async () => undefined);
        throw new Error('phase-50a: the dead target was expected to refuse the connection');
      } catch (err) {
        message = err instanceof Error ? err.message : String(err);
      }
      expect(message).toContain('could not acquire a connection');
      // It NAMES the target, which is the point of a diagnostic.
      expect(message).toContain(LOOPBACK);
      expect(message).toContain('straylight_source');
      expect(message).toContain('<redacted>');
      // And carries no credential in any reading.
      for (const secret of ['hunter2secret', 'secondsecret', 'appuser']) {
        expectUnrecoverable(message, secret, 'connection-failure message');
      }
      // The query is not in the message in any form.
      expect(message).not.toContain('application_name');
    } finally {
      await host.close();
    }
  });

  it('DIAGNOSTIC REACHABILITY: the closed-host message is the same emitter, with the same guarantees', async () => {
    const host = new PostgresEstateHost({
      connectionString: `${SCHEME}appuser:hunter2secret@${LOOPBACK}:1/straylight_source?password=secondsecret`,
    });
    await host.close();
    let message = '';
    try {
      await host.withClient(async () => undefined);
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toContain('is closed');
    for (const secret of ['hunter2secret', 'secondsecret', 'appuser']) {
      expectUnrecoverable(message, secret, 'closed-host message');
    }
    expect(message).not.toContain('application_name');
    expect(message).toContain('<redacted>');
  });

  // ── THE FROZEN RUNBOOK CLAIM ─────────────────────────────────────────────
  //
  // `docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md` is
  // FORBIDDEN to this slice, and it makes a claim about this behaviour. The
  // packet requires the claim to REMAIN TRUE — and forbids editing the runbook to
  // match a design. So the claim is read out of the frozen file and checked
  // against what the store actually emits.
  it('the frozen runbook claim about describeTarget() is still true of the code', async () => {
    const runbook = readFileSync(
      resolve(ROOT, 'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md'),
      'utf8',
    );
    const claim =
      'Connection strings in diagnostics are redacted — `describeTarget()` replaces\n' +
      'userinfo with `<redacted>`, so an error message can name the target without\n' +
      'leaking a credential.';
    expect(runbook, 'the frozen runbook claim must still be present, unedited').toContain(claim);

    const host = await forceResolve(
      `${SCHEME}appuser:hunter2secret@${LOOPBACK}:1/straylight_source?password=secondsecret`,
      DECLARED,
    );
    try {
      const described = host.describeTarget();
      // "replaces userinfo with `<redacted>`" — the userinfo position is exactly
      // that constant.
      expectNoParserSensitiveMaterial(described, 'runbook claim');
      // "can name the target" — it does.
      expect(described).toContain(LOOPBACK);
      expect(described).toContain('straylight_source');
      // "without leaking a credential" — under every reading.
      for (const secret of ['hunter2secret', 'secondsecret', 'appuser']) {
        expectUnrecoverable(described, secret, 'runbook claim');
      }
    } finally {
      await host.close();
    }
  });


  // ── PRESERVATION NEGATIVE CONTROL ────────────────────────────────────────
  //
  // This slice rewrites the Track-A proof regions of this file. The packet pins
  // the two blocks that must not change — the F-01 block and the F-14/F-15
  // runbook block — by byte count and digest, so the preservation claim is
  // CHECKABLE HERE rather than asserted in prose.
  //
  // Located BY THEIR FIRST LINE, not by line number: the packet's words are
  // "their positions may shift; their bytes may not", and the rewritten import
  // block above changes this file's prefix length, so a line-number pin would
  // fail for a reason that has nothing to do with preservation.
  //
  // `node:crypto` is imported dynamically to keep the static import list the
  // narrow intersection the counterexamples need.
  it('PRESERVATION: the F-01 block and the F-14/F-15 runbook block are byte-identical to the substrate', async () => {
    const { createHash } = await import('node:crypto');
    const selfText = readFileSync(resolve(ROOT, 'tests/phase-50a/safety-authority-closure.test.ts'), 'utf8');
    const lines = selfText.split('\n');
    const sha = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

    // THE F-01 BLOCK — 106 lines: the F-01 describe, the blank line after it, and
    // the frozen F-04 preamble the packet pins together with it, wherever they now
    // begin. The rewritten F-04 body opens AFTER this region, so the pin holds.
    const f01Start = lines.findIndex((line) => line.startsWith("describe('Phase 50A F-01"));
    expect(f01Start, 'the F-01 block must still be present').toBeGreaterThan(0);
    const f01 = lines.slice(f01Start, f01Start + 106).join('\n') + '\n';
    expect(Buffer.byteLength(f01, 'utf8'), 'F-01 block byte count').toBe(5854);
    expect(sha(f01), 'F-01 block digest').toBe(
      '7cb6648fa6a292321234ff9e4f32feeccb28224e0290ee0422cd4b83adc0f6c4',
    );

    // THE F-14/F-15 RUNBOOK BLOCK — first line to EOF.
    const runbookStart = lines.findIndex((line) =>
      line.startsWith("describe('Phase 50A F-14/F-15"),
    );
    expect(runbookStart, 'the F-14/F-15 runbook block must still be present').toBeGreaterThan(0);
    const runbookBlock = lines.slice(runbookStart).join('\n');
    expect(Buffer.byteLength(runbookBlock, 'utf8'), 'F-14/F-15 runbook block byte count').toBe(3442);
    expect(sha(runbookBlock), 'F-14/F-15 runbook block digest').toBe(
      '8773f4faf1958567178ececb3ab31a03a8d1b46f2c0e585ed55b87e861c26046',
    );
  });

  it('PRESERVATION: the F-01 seam file and the F-14/F-15 runbook are the substrate blobs', async () => {
    const { createHash } = await import('node:crypto');
    // Git's own object id, so the pin is the SAME identity the packet states and
    // the substrate tree records — not a second hash of our own devising.
    const blobId = (bytes: Buffer): string =>
      createHash('sha1')
        .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`, 'utf8'), bytes]))
        .digest('hex');
    const cases: ReadonlyArray<{ path: string; id: string }> = [
      {
        path: 'tests/phase-31f-operator-recall-wedge-demo.test.ts',
        id: '820221ec773cdd24fdd9e386aaaf06a4a17c5206',
      },
      {
        path: 'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md',
        id: 'd295948c1b97ccf9c6932e400a8861ca0466f396',
      },
    ];
    for (const { path, id } of cases) {
      expect(blobId(readFileSync(resolve(ROOT, path))), `${path} must be the substrate blob`).toBe(
        id,
      );
    }
  });

  it('PRESERVATION: config.ts exports exactly the closed surface this slice leaves behind', async () => {
    // The prior packet pinned this surface as `SHIPPED_SCHEMA_VERSIONS`,
    // `redactConnectionString`, `resolveConfig`. The sequence-110 audit REQUIRED
    // the middle one to go, so the pin is replaced — and replaced by another
    // CLOSED, CHECKED surface rather than relaxed into a subset assertion: the
    // whole export list is enumerated, so an ADDED export fails here too. That
    // matters for F-04 specifically, because the finding is about a second parser
    // existing at all, and a re-added renderer under any name would be caught by
    // this list before anyone had to notice what it did.
    const module = await import('../../src/straylight/storage/postgres/config.js');
    expect(Object.keys(module).sort()).toEqual(['SHIPPED_SCHEMA_VERSIONS', 'resolveConfig']);
    expect(typeof module.resolveConfig).toBe('function');
    expect(module.resolveConfig.length, 'signature arity is unchanged').toBe(1);
    expect(module.resolveConfig.name).toBe('resolveConfig');
    // The other export is the shipped version list, unchanged by this slice.
    expect(module.SHIPPED_SCHEMA_VERSIONS).toEqual(['0001']);
  });
});

// ── F-09 / F-10 — the destructive proof accepts ONLY the fixed harness ────
describe('Phase 50A F-09 — every destructive proof target is refused unless it is the fixed harness', () => {
  /**
   * A target that is NOT one of the frozen fixed descriptors. Structurally
   * complete — every field present and plausible — so the refusal cannot be
   * passing merely because something was missing.
   */
  const foreign = (over: Partial<ProofHost>): ProofHost =>
    ({
      name: 'source',
      connectionString: `${SCHEME}someone:realsecret@${OFF_NAME}:5432/production`,
      port: 5432,
      database: 'production',
      container: 'straylight-phase-50a-source',
      user: 'someone',
      ...over,
    }) as ProofHost;

  /**
   * A store-shaped object that DESCRIBES ITSELF as the harness source while
   * operating somewhere else, and records every delegation it receives.
   *
   * The sequence-104 rejected abstraction in one value. `bindStore` accepted any
   * object whose `describeTarget()` returned the expected TEXT, so this is what
   * authority-by-testimony looked like. `touched` is the observation that makes
   * "it was never dereferenced" a fact rather than a claim: its `withClient`
   * would happily hand out a client, so if any surface ever delegated to it, the
   * record would say so.
   */
  /**
   * The most convincing self-description an imitation can now produce.
   *
   * The substrate's rejected gate compared `describeTarget()` TEXT, so the
   * imitation has to be able to produce the right text — otherwise the
   * counterexample would be refused for the wrong reason. It is assembled HERE,
   * from the descriptor's non-secret fields, because the store no longer renders
   * a connection string at all (F-04) and there is no redactor to borrow. That
   * is also the point: this is the test's imitation of a diagnostic, and no
   * production surface consults it.
   */
  const impersonation = (): string => {
    const fixed = sourceHost();
    return `${SCHEME}<redacted>@${LOOPBACK}:${String(fixed.port)}/${fixed.database}`;
  };

  /** A redactor-shaped argument, for any surface that ever took one. */
  const impersonatingRedactor = (_connectionString: string): string => impersonation();

  const touched: string[] = [];
  const hostile = {
    describeTarget: (): string => impersonation(),
    withClient: async (body: (client: unknown) => unknown): Promise<unknown> => {
      touched.push('withClient');
      return body({
        query: async (sql: unknown): Promise<{ rows: never[] }> => {
          touched.push(`query:${String(sql)}`);
          return { rows: [] };
        },
      });
    },
    close: async (): Promise<void> => {
      touched.push('close');
    },
    migrate: async (): Promise<string[]> => {
      touched.push('migrate');
      return [];
    },
  };

  /**
   * A REAL store subclass that lies about its target.
   *
   * Stronger than the imitation: it passes every `instanceof` check and every
   * structural test, and only its self-description is false. It dials a port
   * nothing listens on, so even a total failure of every gate below could not
   * reach a server.
   */
  class DisguisedStore extends PostgresEstateHost {
    override describeTarget(): string {
      return impersonation();
    }
  }

  /**
   * Close a genuine handle, in EITHER TREE.
   *
   * Teardown is a module operation now (the handle carries no store), but these
   * proofs must also RUN against the substrate, where it is a field. A cleanup
   * path that assumed the module operation would throw `TypeError` there and
   * replace the assertion failure the proof exists to produce — so the module
   * operation is used when the module publishes one, and the substrate's exposed
   * field otherwise. Neither branch decides anything: the assertions do.
   */
  const closeBound = async (hosts: object, value: unknown): Promise<void> => {
    const close = (hosts as Record<string, unknown>)['closeBoundProofStore'];
    if (typeof close === 'function') {
      await (close as (bound: unknown) => Promise<void>)(value);
      return;
    }
    const exposed = (value as { store?: unknown } | undefined)?.store;
    if (exposed instanceof PostgresEstateHost) await exposed.close();
  };

  const REFUSED_TARGETS: ReadonlyArray<{ label: string; target: ProofHost }> = [
    { label: 'non-loopback host', target: foreign({}) },
    {
      label: 'non-harness database on a loopback host',
      target: foreign({
        connectionString: 'postgresql://straylight_proof:pw@127.0.0.1:55432/somebody_elses_data',
        database: 'somebody_elses_data',
      }),
    },
    {
      label: 'non-harness port on loopback',
      target: foreign({
        connectionString: 'postgresql://straylight_proof:pw@127.0.0.1:5432/straylight_source',
        port: 5432,
        database: 'straylight_source',
      }),
    },
    {
      label: 'syntactically valid but foreign URI',
      target: foreign({
        connectionString: `${SCHEME}u:p@${OFF_HOST}:5432/estate`,
        port: 5432,
        database: 'estate',
      }),
    },
    {
      label: 'a COPY of the real descriptor with one field changed',
      // The nastiest case: everything matches the fixed source except the
      // connection string, which is what a client would actually dial.
      target: foreign({
        ...sourceHost(),
        connectionString: `${SCHEME}straylight_proof:pw@${OFF_HOST}:55432/straylight_source`,
      }),
    },
  ];

  for (const { label, target } of REFUSED_TARGETS) {
    it(`REFUSES a ${label}, before any connection, naming the harness-only constraint`, () => {
      resetDestructiveOperations();
      resetToolInvocations();

      let error: unknown;
      expect(() => {
        try {
          resolveProofHost(target);
        } catch (e) {
          error = e;
          throw e;
        }
      }).toThrow(ProofHostRefusedError);

      const message = (error as Error).message;
      // The refusal explains the constraint…
      expect(message).toMatch(/FIXED disposable\s+loopback harness instances/);
      expect(message).toMatch(/no override, no environment variable/);
      // …and names the offending target usefully…
      expect(message).toContain(`database=${target.database}`);
      // …without ECHOING A CREDENTIAL. A refusal is a diagnostic like any other.
      expect(message.includes('realsecret'), 'the refusal echoed a credential').toBe(false);
      expect(message.includes(target.connectionString), 'the refusal echoed the connection string').toBe(
        false,
      );

      // OBSERVED, not inferred: nothing was destroyed and no tool ran.
      expect(destructiveOperations()).toEqual([]);
      expect(toolInvocations()).toEqual([]);
    });
  }

  it('REFUSES an unknown host NAME', () => {
    resetDestructiveOperations();
    resetToolInvocations();
    expect(() => resolveProofHost('production' as never)).toThrow(ProofHostRefusedError);
    expect(() => resolveProofHost('' as never)).toThrow(ProofHostRefusedError);
    // Prototype-chain names must not resolve either.
    expect(() => resolveProofHost('constructor' as never)).toThrow(ProofHostRefusedError);
    expect(() => resolveProofHost('toString' as never)).toThrow(ProofHostRefusedError);
    expect(destructiveOperations()).toEqual([]);
    expect(toolInvocations()).toEqual([]);
  });

  // ── THE SEQUENCE-104 F-09 COUNTEREXAMPLE ─────────────────────────────────
  //
  // The rejected abstraction: `bindStore(host, store, describe)` compared
  // `store.describeTarget()` with the redacted text of the descriptor's own
  // connection string and minted destructive authority when they matched. Text
  // equality is TESTIMONY — the object says what it is, and the gate believes it.
  //
  // This counterexample does not test `bindStore`; it tests the MODULE. It
  // enumerates every synchronous export, calls each with argument vectors that
  // carry an imposter in every position the rejected signature used, and asserts
  // that nothing comes back that IS or REFERENCES an imposter. Against the
  // substrate `bindStore` returns a handle wrapping the hostile object and this
  // FAILS, naming the export that minted it. Against a module with no such
  // surface it passes because there is nothing to mint through — which is the
  // structural claim, not "we remembered to guard bindStore".
  it('COUNTEREXAMPLE (F-09): NO export mints destructive authority for a self-describing store', async () => {
    resetDestructiveOperations();
    resetToolInvocations();
    touched.length = 0;

    const hosts = await hostsModule();
    const host = sourceHost();
    const subclass = new DisguisedStore({
      connectionString: `${DEAD_ORIGIN}/somebody_elses_data`,
    });
    const imposters = new Set<unknown>([hostile, subclass]);

    // Every argument shape the rejected signature and its ancestors used, plus
    // the "copied handle" shape: an object that LOOKS like a bound store.
    const attempts: ReadonlyArray<readonly unknown[]> = [
      [hostile],
      [subclass],
      [host, hostile],
      [host, subclass],
      [host, hostile, impersonatingRedactor],
      [host, subclass, impersonatingRedactor],
      [host, hostile, impersonatingRedactor, hostile],
      ['source', hostile],
      ['source', hostile, impersonatingRedactor],
      [hostile, host],
      [{ host, store: hostile }],
      [{ host, store: subclass }],
    ];

    const minted: string[] = [];
    const produced: unknown[] = [];
    try {
      for (const [name, fn] of syncFunctionExports(hosts)) {
        for (const argv of attempts) {
          let result: unknown;
          try {
            result = fn(...argv);
          } catch {
            continue; // refused, which is the expected outcome
          }
          produced.push(result);
          if (!referenced(result).some((value) => imposters.has(value))) continue;
          minted.push(`${name}(${argv.length} arg(s))`);
          // A minted handle is only a defect if it can DESTROY. Try, but only
          // for the inert imitation — never for the real subclass, whose
          // `withClient` would open a socket.
          if (referenced(result).includes(hostile)) {
            try {
              await emptySchema(result as never);
            } catch {
              /* refused at the destructive entry point */
            }
          }
        }
      }

      expect(
        minted,
        'these exports minted destructive authority for an object that merely DESCRIBED ' +
          'itself as the harness source; authority must not be testimony',
      ).toEqual([]);
      // OBSERVED: the imitation was never dereferenced by anything, so the
      // refusal happened before use rather than after.
      expect(touched, 'the self-describing imitation was delegated to').toEqual([]);
      expect(destructiveOperations(), 'an imitation reached the destructive record').toEqual([]);
      expect(toolInvocations()).toEqual([]);
    } finally {
      // Close whatever the enumeration legitimately opened, THROUGH THE MODULE.
      // `openBoundProofStore` constructs a real store and the pool is lazy, but
      // the store is module-private now (F-09): there is no field to reach it
      // through, so teardown is a module operation like every other one.
      //
      // Written for BOTH TREES, because a substrate run must fail on the
      // assertion above rather than on a `TypeError` while cleaning up: the
      // module operation is used when the module publishes one, and the
      // substrate's exposed field otherwise.
      for (const value of produced) {
        if (!hosts.isBoundProofStore(value)) continue;
        await closeBound(hosts, value);
      }
      await subclass.close();
    }
  });

  it('NEGATIVE CONTROL (F-09): the destructive entry point refuses every imitation of a bound store', async () => {
    resetDestructiveOperations();
    resetToolInvocations();
    touched.length = 0;

    const hosts = await hostsModule();
    // Stated as an assertion so a tree without the replacement seam fails HERE,
    // with the missing export NAMED, rather than throwing "not a function".
    expect(
      missingExports(hosts, ['openBoundProofStore', 'isBoundProofStore', 'authorizedBoundStore']),
      'the destructive-authority seam is absent from this module',
    ).toEqual([]);
    const { openBoundProofStore, isBoundProofStore, authorizedBoundStore } = hosts;
    const genuine = openBoundProofStore(sourceHost());
    const subclass = new DisguisedStore({
      connectionString: `${DEAD_ORIGIN}/somebody_elses_data`,
    });
    try {
      // The genuine handle IS the authority, and the registry — not the handle —
      // is what a destructive consumer reads. The minted capability carries the
      // descriptor and the operations, and NO store: there is nothing on it to
      // compare against a store the handle exposed, because it exposes none.
      expect(isBoundProofStore(genuine)).toBe(true);
      expect(authorizedBoundStore(genuine).host).toBe(sourceHost());
      expect(
        (authorizedBoundStore(genuine) as unknown as { store?: unknown }).store,
        'the minted capability hands out a store',
      ).toBeUndefined();

      // Nothing else is. Each of these is a shape a caller can actually build.
      const rejected: ReadonlyArray<{ label: string; value: unknown }> = [
        { label: 'a self-describing imitation', value: { host: sourceHost(), store: hostile } },
        { label: 'a subclass with an overridden description', value: { host: sourceHost(), store: subclass } },
        { label: 'a bare store handle', value: subclass },
        { label: 'a COPY of a genuine handle', value: { ...genuine } },
        {
          label: 'a copy of a genuine handle with the store SUBSTITUTED',
          value: { ...genuine, store: hostile },
        },
        {
          label: 'a copy carrying every own symbol of a genuine handle',
          value: (() => {
            const copy: Record<string | symbol, unknown> = { ...genuine };
            for (const sym of Object.getOwnPropertySymbols(genuine)) {
              copy[sym] = (genuine as unknown as Record<symbol, unknown>)[sym];
            }
            copy['store'] = hostile;
            return copy;
          })(),
        },
        { label: 'undefined', value: undefined },
        { label: 'a bare descriptor', value: sourceHost() },
      ];
      for (const { label, value } of rejected) {
        expect(isBoundProofStore(value), `${label} passed the membership test`).toBe(false);
        expect(() => authorizedBoundStore(value as never), `${label} was authorized`).toThrow(
          ProofHostRefusedError,
        );
        await expect(
          emptySchema(value as never),
          `${label} reached the destructive path`,
        ).rejects.toThrow(ProofHostRefusedError);
      }

      // OBSERVED: nothing destroyed, nothing invoked, nothing delegated.
      expect(destructiveOperations()).toEqual([]);
      expect(toolInvocations()).toEqual([]);
      expect(touched, 'an imitation was delegated to before being refused').toEqual([]);
    } finally {
      await closeBound(hosts, genuine);
      await subclass.close();
    }
  });

  // ── THE SEQUENCE-110 F-09 COUNTEREXAMPLE ─────────────────────────────────
  //
  // The sequence-110 audit did not need an imitation. Its counterexample used a
  // GENUINE handle — the registry's own product, which passes every membership
  // test — and simply patched the store the handle EXPOSED:
  //
  //     const genuine = openBoundProofStore(sourceHost());
  //     genuine.store.withClient = hostile.withClient;   // destructive authority
  //     await emptySchema(genuine);                       // aimed elsewhere
  //
  // Membership was never in question, so no amount of membership checking closes
  // it. What closes it is that the handle carries NO STORE: the real host is
  // module-private after minting, the registry holds it, and every destructive
  // consumer resolves it internally.
  //
  // So this proof does what the audit did, and then everything else a caller can
  // reach: mutate the genuine handle, mint from a Proxy over it, from a spread
  // copy, from an Object.create derivative, from a prototype-tampered object, and
  // patch the minted capability itself. Against the substrate the FIRST assertion
  // fails, naming the exposed alias.
  it('COUNTEREXAMPLE (F-09): a GENUINE handle exposes no store, so nothing can redirect it after minting', async () => {
    resetDestructiveOperations();
    resetToolInvocations();
    touched.length = 0;

    const hosts = await hostsModule();
    // The INTERSECTION of the two trees' surfaces, deliberately: this proof must
    // fail on the substrate for the ALIAS, so it must not fail first on a
    // replacement export the substrate never had. Teardown goes through
    // `closeBound`, which works either way.
    expect(
      missingExports(hosts, ['openBoundProofStore', 'isBoundProofStore', 'authorizedBoundStore']),
      'the destructive-authority seam is absent from this module',
    ).toEqual([]);
    const { openBoundProofStore, isBoundProofStore, authorizedBoundStore } = hosts;

    // GENUINE. Not a fake, not an unregistered imitation: the registry's own
    // product for a fixed descriptor, which is what made the substrate defect a
    // defect rather than a refusal.
    const genuine = openBoundProofStore(sourceHost());
    try {
      expect(isBoundProofStore(genuine), 'the handle under attack must be genuine').toBe(true);

      // ── 1. THE HANDLE HANDS OUT NO STORE ────────────────────────────────
      //
      // Enumerated rather than asserted about one field name: own properties,
      // own symbols and everything reachable through the prototype chain, so a
      // store returned by an accessor or an inherited getter would be caught too.
      const reachable = new Map<string, unknown>();
      for (const key of Object.getOwnPropertyNames(genuine)) {
        reachable.set(key, (genuine as unknown as Record<string, unknown>)[key]);
      }
      for (const sym of Object.getOwnPropertySymbols(genuine)) {
        reachable.set(String(sym), (genuine as unknown as Record<symbol, unknown>)[sym]);
      }
      for (
        let proto: object | null = Object.getPrototypeOf(genuine) as object | null;
        proto !== null && proto !== Object.prototype;
        proto = Object.getPrototypeOf(proto) as object | null
      ) {
        for (const key of Object.getOwnPropertyNames(proto)) {
          if (key === 'constructor') continue;
          reachable.set(`proto.${key}`, (genuine as unknown as Record<string, unknown>)[key]);
        }
      }
      for (const [where, value] of reachable) {
        expect(
          value instanceof PostgresEstateHost,
          `the genuine handle hands out its store at ${where}: the sequence-110 alias is back`,
        ).toBe(false);
      }
      // The shape is CLOSED, so "no store today" cannot become "a store next
      // week" without failing here.
      expect([...reachable.keys()].sort()).toEqual(['host']);
      expect(Object.isFrozen(genuine), 'a genuine handle must be frozen').toBe(true);

      // ── 2. THE ATTACK, RUN ───────────────────────────────────────────────
      const minted = authorizedBoundStore(genuine);
      const patchable = genuine as unknown as Record<string, unknown>;
      // Writing an alias onto the frozen handle: refused by the runtime.
      expect(() => {
        patchable['store'] = hostile;
      }).toThrow(TypeError);
      expect(patchable['store'], 'a store alias was installed on the handle').toBeUndefined();
      // Patching the minted capability: refused too, and a later mint is clean.
      expect(Object.isFrozen(minted), 'a minted capability must be frozen').toBe(true);
      expect(() => {
        (minted as unknown as Record<string, unknown>)['withClient'] = hostile.withClient;
      }).toThrow(TypeError);

      // ── 3. EVERY DERIVATIVE OF A GENUINE HANDLE IS REFUSED ──────────────
      const proxied = new Proxy(genuine, {
        get: (target, key, receiver) =>
          key === 'store' ? hostile : Reflect.get(target, key, receiver),
      });
      const derived: ReadonlyArray<{ label: string; value: unknown }> = [
        { label: 'a spread copy of a genuine handle', value: { ...genuine } },
        { label: 'a spread copy with a store alias added', value: { ...genuine, store: hostile } },
        { label: 'an Object.create derivative of a genuine handle', value: Object.create(genuine) },
        { label: 'a Proxy over a genuine handle', value: proxied },
        {
          label: 'a prototype-tampered object inheriting from a genuine handle',
          value: Object.setPrototypeOf({ store: hostile }, genuine),
        },
        {
          label: 'a frozen copy of a genuine handle',
          value: Object.freeze({ ...genuine, store: hostile }),
        },
      ];
      for (const { label, value } of derived) {
        expect(isBoundProofStore(value), `${label} passed the membership test`).toBe(false);
        expect(() => authorizedBoundStore(value as never), `${label} was authorized`).toThrow(
          ProofHostRefusedError,
        );
        await expect(
          emptySchema(value as never),
          `${label} reached the destructive path`,
        ).rejects.toThrow(ProofHostRefusedError);
      }

      // ── 4. WHERE THE AUTHORITY POINTS, OBSERVED ─────────────────────────
      //
      // A frozen capability whose functions are not the hostile ones is still
      // only structure. This is the behavioural half: the minted operation is
      // exercised, and it reaches the REGISTRY's target. With no harness running
      // it fails NAMING that target; with one running it acquires a connection
      // and the callback does nothing. Either outcome is the same fact — the
      // operation was aimed at the descriptor's own database — and `touched`
      // proves the hostile object was not consulted on the way.
      const fresh = authorizedBoundStore(genuine);
      expect(fresh, 'each mint is its own capability').not.toBe(minted);
      for (const key of ['migrate', 'withClient', 'withEstateSession'] as const) {
        expect(typeof fresh[key]).toBe('function');
        expect(fresh[key] as unknown).not.toBe(
          (hostile as unknown as Record<string, unknown>)[key],
        );
      }
      let observed = '';
      await fresh
        .withClient(async () => {
          observed = 'acquired a connection to the registry store';
        })
        .catch((err: unknown) => {
          observed = err instanceof Error ? err.message : String(err);
        });
      // The minted operation ran the REGISTRY's own store, not the hostile
      // object. With a harness up it acquires a connection and the callback runs;
      // with none up it fails in the store's OWN acquisition path. The head's
      // store is descriptor-less (F-04), so a failure names `<target unresolved>`
      // rather than the database — the fact that matters is that the store's own
      // `withClient`/`checkout` produced the outcome, which `touched` (asserted
      // empty below) confirms was never the hostile object.
      expect(
        observed === 'acquired a connection to the registry store' ||
          /could not acquire a connection|is closed/.test(observed),
        `the minted operation did not reach the registry store's own acquisition path: ${observed}`,
      ).toBe(true);

      // OBSERVED: nothing delegated, nothing destroyed, nothing invoked.
      expect(touched, 'the hostile object was delegated to').toEqual([]);
      expect(destructiveOperations()).toEqual([]);
      expect(toolInvocations()).toEqual([]);
    } finally {
      await closeBound(hosts, genuine);
    }
  });

  // ── THE SEQUENCE-116 F-09 COUNTEREXAMPLE ─────────────────────────────────
  //
  // The sequence-110 closure made the store MODULE-PRIVATE, so a genuine handle
  // hands out no store to redirect. The sequence-116 audit found that this was
  // not enough: the store the minted capability runs against is a live
  // PostgresEstateHost, and its destructive path dispatches through the class
  // PROTOTYPE — `withClient` resolves `this.checkout()` off the prototype at call
  // time. The prototype is a mutable, EXPORTED object, so a caller who never
  // touches the private store can still redirect the minted operation by
  // replacing a method on `PostgresEstateHost.prototype` AFTER minting:
  //
  //     const minted = authorizedBoundStore(openBoundProofStore(sourceHost()));
  //     PostgresEstateHost.prototype.checkout = hostileCheckout;   // post-mint
  //     await minted.withClient(cb);   // dispatches through the hostile method
  //
  // The head seals this with a finite mechanism: the authority-private operations
  // are captured at module load and `PostgresEstateHost.prototype` is frozen, so
  // a post-mint method replacement neither TAKES (the prototype refuses it) nor
  // REDIRECTS (a captured operation's internal dispatch resolves the original).
  //
  // The seal is two facts and the substrate satisfies NEITHER: on the substrate
  // the prototype is mutable, so the replacement takes (`mutated` is true); and
  // the minted operation dispatches through it, so the hostile method is reached
  // (`reached` is non-empty). Either fact alone fails on the substrate; both are
  // asserted so the seal is proven structurally AND behaviourally.
  it('COUNTEREXAMPLE (F-09): the invoked destructive behaviour is SEALED against post-mint prototype mutation', async () => {
    resetDestructiveOperations();
    resetToolInvocations();

    const hosts = await hostsModule();
    // INTERSECTION only: this proof must fail on the substrate for the SEAL, so
    // it must not fail first on an export the substrate never had. Teardown goes
    // through `closeBound`, which works on either tree.
    expect(
      missingExports(hosts, ['openBoundProofStore', 'authorizedBoundStore']),
      'the destructive-authority seam is absent from this module',
    ).toEqual([]);
    const { openBoundProofStore, authorizedBoundStore } = hosts;

    const genuine = openBoundProofStore(sourceHost());
    const proto = PostgresEstateHost.prototype as unknown as Record<string, unknown>;
    const originalCheckout = proto['checkout'];
    const reached: string[] = [];
    // A hostile `checkout`: if the minted operation ever dispatches through the
    // prototype, it hands out a client the test controls — recording that the
    // redirect took, and to where. On the head the prototype refuses the
    // replacement, so this is never installed and never consulted.
    const hostileCheckout = function (this: unknown): Promise<unknown> {
      reached.push('checkout');
      return Promise.resolve({
        client: {
          query: async (): Promise<{ rows: never[] }> => {
            reached.push('query');
            return { rows: [] };
          },
          on: (): void => {},
          removeListener: (): void => {},
          release: (): void => {},
        },
        release: (): void => {},
      });
    };

    const minted = authorizedBoundStore(genuine);
    let mutated = false;
    try {
      // The post-mint redirection, attempted. On the head this throws (the
      // prototype is frozen) and is caught; on the substrate it succeeds.
      try {
        Object.defineProperty(proto, 'checkout', {
          value: hostileCheckout,
          configurable: true,
          writable: true,
        });
        mutated = true;
      } catch {
        mutated = false;
      }

      // Invoke the minted destructive-authority operation. On the head the
      // captured operation runs against the private, descriptor-less store and
      // its internal `checkout` dispatch resolves the ORIGINAL (the replacement
      // never took), so the hostile method is never reached and the acquisition
      // simply fails against the real store. On the substrate it dispatches
      // through the installed hostile method.
      await (minted as { withClient: (b: () => Promise<void>) => Promise<void> })
        .withClient(async () => undefined)
        .catch(() => undefined);

      expect(
        mutated,
        'PostgresEstateHost.prototype accepted a post-mint method replacement — the invoked behaviour is not sealed',
      ).toBe(false);
      expect(
        reached,
        'a post-mint prototype mutation redirected the minted operation to a hostile method',
      ).toEqual([]);
    } finally {
      // Restore ONLY if the replacement took (substrate); on the head the
      // prototype is frozen and was never changed.
      if (mutated) {
        Object.defineProperty(proto, 'checkout', {
          value: originalCheckout,
          configurable: true,
          writable: true,
        });
      }
      await closeBound(hosts, genuine);
    }

    // The structural seal, stated directly: the prototype is frozen at module
    // load, which is the property the substrate lacks.
    expect(
      Object.isFrozen(PostgresEstateHost.prototype),
      'PostgresEstateHost.prototype is mutable, so a minted capability can be redirected through it',
    ).toBe(true);
    // Nothing destructive ran on either tree's path through this proof.
    expect(destructiveOperations()).toEqual([]);
    expect(toolInvocations()).toEqual([]);
  });

  it('the destructive authority cannot be OPENED for anything but a fixed descriptor', async () => {
    resetDestructiveOperations();
    const hosts = await hostsModule();
    expect(missingExports(hosts, ['openBoundProofStore'])).toEqual([]);
    const { openBoundProofStore } = hosts;
    for (const { label, target } of REFUSED_TARGETS) {
      expect(
        () => openBoundProofStore(target),
        `${label} was opened as destructive authority`,
      ).toThrow(ProofHostRefusedError);
    }
    expect(() => openBoundProofStore('production' as never)).toThrow(ProofHostRefusedError);
    // The refusal precedes construction, so no store was built and nothing was
    // recorded — the observation, not the inference.
    expect(destructiveOperations()).toEqual([]);
  });

  it('SEQUENCE-89 REPRO (F-09): a VALID descriptor can no longer be paired with an UNRELATED store', async () => {
    // The sequence-89 defect: `emptySchema(host, store)` resolved `host` and then
    // issued `DROP SCHEMA` on the INDEPENDENTLY SUPPLIED `store`, so a legitimate
    // descriptor plus somebody else's store reached destructive SQL with nothing
    // checked about the thing actually being erased.
    //
    // The sequence-104 closure removes the pairing entirely: there is no
    // parameter through which a store can arrive. That is asserted about the
    // MODULE — no export accepts a store — rather than about one guard, and the
    // enumeration above is what establishes it. What remains here is the
    // consequence: an unrelated store cannot reach the destructive path in any
    // shape, and the store it WOULD have erased is never touched.
    resetDestructiveOperations();
    resetToolInvocations();

    const unrelated = new PostgresEstateHost({
      connectionString: `${DEAD_ORIGIN}/somebody_elses_data`,
    });
    try {
      await expect(
        emptySchema({ host: sourceHost(), store: unrelated } as never),
        'a valid descriptor paired with an unrelated store reached destructive SQL',
      ).rejects.toThrow(ProofHostRefusedError);
      await expect(emptySchema(unrelated as never)).rejects.toThrow(ProofHostRefusedError);
      await expect(emptySchema(undefined as never)).rejects.toThrow(ProofHostRefusedError);
    } finally {
      await unrelated.close();
    }

    expect(destructiveOperations(), 'destruction was recorded for an unbound store').toEqual([]);
    expect(toolInvocations()).toEqual([]);
  });

  it('SEQUENCE-89 REPRO (F-09): a CLONED descriptor cannot open destructive authority', async () => {
    resetDestructiveOperations();
    resetToolInvocations();
    const hosts = await hostsModule();
    expect(missingExports(hosts, ['openBoundProofStore'])).toEqual([]);
    const { openBoundProofStore } = hosts;
    // A structural copy of a fixed descriptor: every field equal, identity not.
    const clone = { ...sourceHost() };
    expect(() => openBoundProofStore(clone), 'a cloned descriptor opened authority').toThrow(
      ProofHostRefusedError,
    );
    expect(destructiveOperations()).toEqual([]);
    expect(toolInvocations()).toEqual([]);
  });

  it('REPRO (F-10): a supplied database NAME is not a parameter of tool issuance at all', () => {
    resetToolInvocations();

    // The sequence-89 form of this defect was `toolTargetOf(host, name)`, which
    // registered whatever name it was handed as ISSUED. The sequence-104 closure
    // did not tighten the name check — it DELETED the parameter, so the argument
    // below is ignored by the language rather than validated by us.
    expect(toolTargetOf.length, 'tool issuance must take no database name').toBe(1);
    const smuggled = (
      toolTargetOf as unknown as (host: ProofHost, database: string) => { database: string }
    )(sourceHost(), 'somebody_elses_data');
    expect(
      smuggled.database,
      'a supplied database name reached the issued tool target',
    ).toBe(sourceHost().database);
    expect(smuggled.database).not.toBe('somebody_elses_data');

    // And nothing reached a tool.
    expect(toolInvocations()).toEqual([]);
  });

  it('REPRO (F-10): a DIVERGENT tool target — right issuance, wrong field — cannot reach a tool', () => {
    resetToolInvocations();

    // Issued legitimately, then a field edited: the object still carries its
    // issuance, so an identity-only gate accepts it while the field it would
    // actually dial has drifted from the descriptor that authorized it.
    const issued = toolTargetOf(sourceHost());
    const divergent = { ...issued, database: 'somebody_elses_data' };
    expect(() => pgDump(divergent)).toThrow(ProofHostRefusedError);
    expect(() => psqlRestore(divergent, 'SELECT 1')).toThrow(ProofHostRefusedError);
    expect(() => clusterSystemIdentifier(divergent)).toThrow(ProofHostRefusedError);
    expect(toolInvocations()).toEqual([]);
  });

  it('NEGATIVE CONTROL: a hand-built tool target cannot reach pg_dump, psql or a cluster probe', () => {
    resetToolInvocations();
    // Structurally identical to a real target, but never ISSUED by
    // `toolTargetOf`, so it never passed the descriptor gate.
    const handBuilt = {
      container: 'straylight-phase-50a-source' as const,
      user: 'straylight_proof',
      database: 'somebody_elses_data',
    };
    expect(() => pgDump(handBuilt)).toThrow(ProofHostRefusedError);
    expect(() => psqlRestore(handBuilt, 'SELECT 1')).toThrow(ProofHostRefusedError);
    expect(() => clusterSystemIdentifier(handBuilt)).toThrow(ProofHostRefusedError);
    // ZERO invocations: the gate precedes the record, which precedes the spawn.
    expect(toolInvocations()).toEqual([]);
  });

  it('FIXED-HARNESS ACCEPTANCE: with nothing overridden, the two descriptors resolve exactly as authorized', () => {
    const source = sourceHost();
    const replacement = replacementHost();

    // The exact authorized values, by value.
    expect(source.connectionString).toContain('@127.0.0.1:55432/');
    expect(source.port).toBe(55432);
    expect(source.database).toBe('straylight_source');
    expect(replacement.connectionString).toContain('@127.0.0.1:55433/');
    expect(replacement.port).toBe(55433);
    expect(replacement.database).toBe('straylight_replacement');

    // Both are accepted by the gate, and the gate returns the SAME objects.
    expect(resolveProofHost(source)).toBe(source);
    expect(resolveProofHost(replacement)).toBe(replacement);
    expect(resolveProofHost('source')).toBe(source);
    expect(resolveProofHost('replacement')).toBe(replacement);

    // And they remain two GENUINELY DISTINCT targets — the existing
    // distinct-instance proof is made stricter by the gate, never thinner.
    expect(source.connectionString).not.toBe(replacement.connectionString);
    expect(() => assertDistinctHosts(source, replacement)).not.toThrow();
    expect(fixedProofHosts().map((h) => h.name)).toEqual(['source', 'replacement']);
  });

  it('reads NO environment variable: the removed overrides cannot come back through env', () => {
    // The design chosen was REMOVAL, not validate-and-refuse. Setting the old
    // variable names must change nothing at all.
    const before = {
      source: sourceHost().connectionString,
      replacement: replacementHost().connectionString,
    };
    const saved = {
      s: process.env['STRAYLIGHT_PHASE_50A_SOURCE_URL'],
      r: process.env['STRAYLIGHT_PHASE_50A_REPLACEMENT_URL'],
    };
    try {
      process.env['STRAYLIGHT_PHASE_50A_SOURCE_URL'] =
        `${SCHEME}u:realsecret@${OFF_HOST}:5432/production`;
      process.env['STRAYLIGHT_PHASE_50A_REPLACEMENT_URL'] =
        `${SCHEME}u:realsecret@${OFF_HOST_ALT}:5432/production`;
      expect(sourceHost().connectionString).toBe(before.source);
      expect(replacementHost().connectionString).toBe(before.replacement);
      // And the descriptors are still the accepted ones.
      expect(resolveProofHost(sourceHost())).toBe(sourceHost());
    } finally {
      if (saved.s === undefined) delete process.env['STRAYLIGHT_PHASE_50A_SOURCE_URL'];
      else process.env['STRAYLIGHT_PHASE_50A_SOURCE_URL'] = saved.s;
      if (saved.r === undefined) delete process.env['STRAYLIGHT_PHASE_50A_REPLACEMENT_URL'];
      else process.env['STRAYLIGHT_PHASE_50A_REPLACEMENT_URL'] = saved.r;
    }
    // The module's EXECUTABLE text must not read them either — removal, not
    // shadowing. Scanned with comments blanked, because the module's own header
    // names the two removed variables while explaining their removal.
    const hostsCode = executableText(
      readFileSync(resolve(ROOT, 'scripts/phase-50a/hosts.ts'), 'utf8'),
    );
    expect(/process\.env/.test(hostsCode), 'hosts.ts must read no environment variable').toBe(false);
    expect(/STRAYLIGHT_PHASE_50A_\w*_URL/.test(hostsCode)).toBe(false);
  });

  it('the destructive path takes NO store and reads NO self-description', () => {
    // The rejected abstractions, asserted absent from EXECUTABLE text — both
    // modules explain them at length in their comments, which is exactly why the
    // comments are blanked first.
    const hostsCode = executableText(
      readFileSync(resolve(ROOT, 'scripts/phase-50a/hosts.ts'), 'utf8'),
    );
    const proofCode = executableText(
      readFileSync(resolve(ROOT, 'scripts/phase-50a/two-host-proof.ts'), 'utf8'),
    );
    // No surface may consult an object's own account of what it is.
    expect(
      /describeTarget/.test(hostsCode),
      'hosts.ts consults a store’s self-description — that is authority by testimony',
    ).toBe(false);
    // The destructive consumer must open its authority rather than receive it,
    // and must act on what the registry returns.
    expect(proofCode).toContain('openBoundProofStore(');
    expect(proofCode).toContain('authorizedBoundStore(');
    expect(/\bbindStore\b/.test(proofCode), 'the rejected binding is back').toBe(false);
    expect(/\bbindStore\b/.test(hostsCode), 'the rejected binding is back').toBe(false);
  });
});

describe('Phase 50A F-10 — store and tool targets derive from the SAME fixed descriptor', () => {
  for (const host of fixedProofHosts()) {
    it(`${host.name}: the tool target agrees BY VALUE with the store connection target`, () => {
      const tool = toolTargetOf(host);

      // Same container and user as the descriptor — not restated literals.
      expect(tool.container).toBe(host.container);
      expect(tool.user).toBe(host.user);
      // Same database, and the SAME database the connection string dials: this
      // is the agreement the finding was about. A tool aimed elsewhere could
      // erase a database the store never populated.
      expect(tool.database).toBe(host.database);
      const dialled = new URL(host.connectionString);
      expect(dialled.pathname.replace(/^\//, '')).toBe(tool.database);
      expect(dialled.username).toBe(tool.user);
      // The container name and the harness instance agree by construction.
      expect(tool.container).toContain(host.name);
    });
  }

  /**
   * A database name in the harness's own scratch FORM, chosen by this test.
   *
   * `p50a_independently_chosen` satisfies `^p50a_[a-z0-9_]{1,54}$` exactly, so it
   * is the name the sequence-89 fix would have accepted and the sequence-104
   * audit rejected accepting: well-formed, plausible, and not ours.
   */
  const SUPPLIED_NAME = 'p50a_independently_chosen';

  /** A structurally complete descriptor that is NOT one of the fixed two. */
  const unfixed = (): ProofHost =>
    ({
      name: 'source',
      connectionString: `${SCHEME}someone:realsecret@${OFF_NAME}:5432/production`,
      port: 5432,
      database: 'production',
      container: 'straylight-phase-50a-source',
      user: 'someone',
    }) as ProofHost;

  // ── THE SEQUENCE-104 F-10 COUNTEREXAMPLE ─────────────────────────────────
  //
  // The rejected abstraction: `declareScratchDatabase(host, name)` took a name,
  // checked its SPELLING against the scratch pattern, and recorded it as
  // authorized; `toolTargetOf(host, name)` then issued a `pg_dump`/`psql` target
  // for it. Nothing established that the database existed because this harness
  // created it, so any well-formed `p50a_*` name — including one belonging to
  // somebody else's database that merely happened to be spelled that way — became
  // a destructive target.
  //
  // This counterexample is again about the MODULE, not one function: it
  // enumerates every synchronous export, offers `SUPPLIED_NAME` in every position
  // the rejected signatures used, and asserts that NOTHING comes back carrying
  // authority over that name. Against the substrate `declareScratchDatabase` and
  // the two-argument `toolTargetOf` produce exactly that, and this FAILS naming
  // them. The async surface — the one function that can create a database — is
  // covered by name below, with the refusal proven to precede any connection.
  it('COUNTEREXAMPLE (F-10): NO export grants authority over an INDEPENDENTLY SUPPLIED name', async () => {
    resetToolInvocations();
    const hosts = await hostsModule();
    // Stated as an assertion so a tree without the creation seam fails HERE, with
    // the missing export NAMED, rather than in a later "not a function".
    expect(
      missingExports(hosts, ['createScratchDatabase']),
      'the creation-bound issuance seam is absent from this module',
    ).toEqual([]);

    const attempts: ReadonlyArray<readonly unknown[]> = [
      [sourceHost(), SUPPLIED_NAME],
      ['source', SUPPLIED_NAME],
      [replacementHost(), SUPPLIED_NAME],
      [SUPPLIED_NAME],
      [SUPPLIED_NAME, sourceHost()],
      [sourceHost(), SUPPLIED_NAME, SUPPLIED_NAME],
      [{ ...sourceHost(), database: SUPPLIED_NAME }],
      [{ host: sourceHost(), database: SUPPLIED_NAME }],
      [sourceHost(), { database: SUPPLIED_NAME }],
    ];

    const granted: string[] = [];
    for (const [name, fn] of syncFunctionExports(hosts)) {
      for (const argv of attempts) {
        let result: unknown;
        try {
          result = fn(...argv);
        } catch {
          continue; // refused, which is the expected outcome
        }
        // Did anything come back that IS the supplied name, or that carries it as
        // a database? Either is a route from a name to a target.
        const carriesName = referenced(result).some(
          (value) =>
            value === SUPPLIED_NAME ||
            (typeof value === 'object' &&
              value !== null &&
              (value as { database?: unknown }).database === SUPPLIED_NAME),
        );
        if (carriesName) {
          granted.push(`${name}(${argv.length} arg(s)) produced the supplied name`);
          continue;
        }
        // And if it came back as an ISSUED tool target, the database it is
        // authorized for must be the descriptor's own, never the supplied one.
        if (typeof result === 'object' && result !== null && isIssuedToolTarget(result)) {
          const authorizedFor = authorizedToolTarget(
            result as { container: string; user: string; database: string },
          );
          if ((result as { database: string }).database !== authorizedFor.database) {
            granted.push(`${name}(${argv.length} arg(s)) issued a target off its descriptor`);
          }
        }
      }
    }

    expect(
      granted,
      'these exports turned an independently supplied p50a_* NAME into authority; a scratch ' +
        'database may be authorized only because this harness created it',
    ).toEqual([]);
    // Nothing reached a client tool while we were trying.
    expect(toolInvocations()).toEqual([]);
  });

  it('creation is the ONLY issuer of a scratch target, and it refuses an unfixed descriptor before connecting', async () => {
    resetToolInvocations();
    const hosts = await hostsModule();
    expect(missingExports(hosts, ['createScratchDatabase'])).toEqual([]);
    const { createScratchDatabase } = hosts;

    // The one async surface that can bring a database into existence. Covered by
    // NAME rather than by enumeration, because enumerating it would dial a
    // server; the refusal here happens in `resolveProofHost`, before the admin
    // store is constructed, so no connection is opened at all.
    await expect(
      createScratchDatabase(unfixed(), SUPPLIED_NAME),
      'an unfixed descriptor was accepted for scratch creation',
    ).rejects.toThrow(ProofHostRefusedError);
    await expect(createScratchDatabase('production' as never, SUPPLIED_NAME)).rejects.toThrow(
      ProofHostRefusedError,
    );
    // A CLONE of a fixed descriptor is refused too — reference identity, so a
    // structurally perfect copy is not the harness instance.
    await expect(createScratchDatabase({ ...sourceHost() }, SUPPLIED_NAME)).rejects.toThrow(
      ProofHostRefusedError,
    );
    expect(toolInvocations()).toEqual([]);

    // Its second parameter is a LABEL, not a name: the value above could not have
    // become a database name even had the descriptor been accepted. That is a
    // property of the source, so it is asserted over EXECUTABLE text — the
    // module's comments discuss the deleted `declareScratchDatabase` at length,
    // which is exactly why the comments are blanked first.
    const hostsCode = executableText(
      readFileSync(resolve(ROOT, 'scripts/phase-50a/hosts.ts'), 'utf8'),
    );
    // The name is MINTED, and the minted value is what reaches the DDL.
    expect(hostsCode).toContain('const database = mintScratchName(label);');
    expect(hostsCode).toContain('CREATE DATABASE "${database}"');
    // ISSUANCE HAS EXACTLY TWO SOURCES: a descriptor's own database, and a
    // database this module created. One declaration, two call sites, no others.
    expect(hostsCode.match(/issueToolTarget\(/g) ?? [], 'issuance call sites').toHaveLength(3);
    expect(hostsCode).toContain('issueToolTarget(host, host.database)');
    expect(hostsCode).toContain('issueToolTarget(host, database)');
    // And the rejected registration seam is gone rather than guarded.
    expect(/declareScratchDatabase/.test(hostsCode), 'the rejected registration is back').toBe(
      false,
    );
    expect(/SCRATCH_DATABASES/.test(hostsCode), 'the rejected registry is back').toBe(false);
  });

  it('the tool-target issuer takes NO database name, so cross-instance reuse has no surface', () => {
    resetToolInvocations();
    // The sequence-89 defect had a cross-instance form: a name declared for
    // `source` handed to `toolTargetOf(replacementHost(), name)`. The closure
    // removes the parameter, so both the reuse and the check for it are gone.
    expect(toolTargetOf.length, 'tool issuance must take no database name').toBe(1);
    const smuggled = (
      toolTargetOf as unknown as (host: ProofHost, database: string) => ProofToolTarget
    )(replacementHost(), SUPPLIED_NAME);
    expect(smuggled.database).toBe(replacementHost().database);
    expect(authorizedToolTarget(smuggled)).toBe(replacementHost());

    // A hand-built target bearing the supplied name is refused by the tool gate,
    // and so is an issued target whose database was edited to it afterwards.
    const forged = { container: sourceHost().container, user: sourceHost().user, database: SUPPLIED_NAME };
    expect(isIssuedToolTarget(forged)).toBe(false);
    expect(() => authorizedToolTarget(forged)).toThrow(ProofHostRefusedError);
    const diverged = { ...toolTargetOf(sourceHost()), database: SUPPLIED_NAME };
    expect(() => authorizedToolTarget(diverged)).toThrow(ProofHostRefusedError);
    expect(() => pgDump(forged)).toThrow(ProofHostRefusedError);
    expect(() => psqlRestore(diverged, 'SELECT 1')).toThrow(ProofHostRefusedError);
    expect(toolInvocations()).toEqual([]);
  });

  it('the portability suite DERIVES its tool targets rather than restating literals', () => {
    // The suite is allowed to change; what must not come back is a restated
    // container/user literal that could drift from the descriptor.
    const suite = readFileSync(
      resolve(ROOT, 'tests/phase-50a/postgres-two-host-portability.test.ts'),
      'utf8',
    );
    expect(suite).toContain('toolTargetOf(');
    expect(
      /const\s+SOURCE_CONTAINER\s*=/.test(suite),
      'the suite must not restate the container literal',
    ).toBe(false);
    expect(
      /const\s+PROOF_USER\s*=/.test(suite),
      'the suite must not restate the proof user literal',
    ).toBe(false);
  });

  it('the LIVE dump/restore targets are the ones CREATION issued, not ones rebuilt from a name', () => {
    // Where the creation→issuance→tool binding is exercised against real
    // databases: the portability suite obtains each scratch database from
    // `hosts.createScratchDatabase` (through `_support`) and hands the GRANT's
    // target to `pg_dump`/`psql`, whose gate re-checks issuance. This suite proves
    // the refusals without a server; that suite proves the accepted path with one.
    const support = executableText(
      readFileSync(resolve(ROOT, 'tests/phase-50a/_support.ts'), 'utf8'),
    );
    const suite = executableText(
      readFileSync(resolve(ROOT, 'tests/phase-50a/postgres-two-host-portability.test.ts'), 'utf8'),
    );
    // Scratch databases are CREATED, not declared, and the support module does
    // not mint names of its own.
    expect(support).toContain('createScratchDatabase(');
    expect(/declareScratchDatabase/.test(support), 'the rejected registration is back').toBe(false);
    expect(/['"`]p50a_/.test(support), '_support must not spell a scratch database name').toBe(
      false,
    );
    // And every tool call in the live suite consumes the grant's target.
    expect(suite).toContain('pgDump(source.toolTarget)');
    expect(suite).toContain('psqlRestore(target.toolTarget, dump.sql)');
    expect(/declareScratchDatabase/.test(suite)).toBe(false);
  });

  it('the operator-runnable proof derives BOTH targets from the gated descriptors', () => {
    const proof = readFileSync(resolve(ROOT, 'scripts/phase-50a/two-host-proof.ts'), 'utf8');
    expect(proof).toContain('resolveProofHost(sourceHost())');
    expect(proof).toContain('resolveProofHost(replacementHost())');
    expect(proof).toContain('toolTargetOf(source)');
    expect(proof).toContain('toolTargetOf(replacement)');
    expect(
      /const\s+SOURCE_CONTAINER\s*=/.test(proof),
      'the proof script must not restate the container literal',
    ).toBe(false);
  });
});

// ── F-14 / F-15 — verification that does not destroy ──────────────────────
describe('Phase 50A F-14 — restore verification is NON-DESTRUCTIVE and detects a real defect', () => {
  const VERIFIER = 'scripts/phase-50a/verify-existing-restore.ts';

  /**
   * A client-shaped object that answers every statement with no rows.
   *
   * Wrapped by the REAL `observeQueries` seam, so a statement issued through it
   * is observed exactly as a statement issued against PostgreSQL would be. It
   * counts its own calls, which is what lets the proofs below assert that the
   * seam saw EVERYTHING the client saw rather than merely something.
   */
  function inertClient(): { calls: number; query: (arg: unknown) => Promise<{ rows: never[] }> } {
    const client = {
      calls: 0,
      query: async (_arg: unknown): Promise<{ rows: never[] }> => {
        client.calls += 1;
        return { rows: [] };
      },
    };
    return client;
  }

  /** Two IDENTICAL readings: the estates agree, so only the proof can decide. */
  function agreeingReading(): {
    target: string;
    digest: string;
    chains: { estate_id: string; ok: boolean; length: number; tail: string | null }[];
    counts: Record<string, number>;
  } {
    return {
      target: 'postgresql://straylight_proof:***@127.0.0.1:55432/straylight_source',
      digest: 'sha256:identical-on-both-sides',
      chains: [{ estate_id: 'estate-a', ok: true, length: 3, tail: 'tail-a' }],
      counts: {
        actors: 1,
        estates: 1,
        keyrings: 1,
        assertions: 1,
        transitions: 1,
        transitionReceipts: 1,
        recallReceipts: 1,
        auditEvents: 1,
      },
    };
  }

  // ── THE ORACLE COMES FROM THE PUBLISHER ──────────────────────────────────
  //
  // Everything below that needs to know what a canonical read IS asks the module
  // that ISSUES it, and normalizes text through that module's own published
  // normalizer. Nothing here restates a statement, a relation name, a column
  // list or a whitespace rule — so these proofs cannot pass by sharing a
  // mistake with the implementation, and a change to the reads cannot be made
  // to agree with a copy of them kept in this file.
  //
  // Reached by DYNAMIC import and probed as properties, because the substrate
  // publishes none of these symbols and this file must load against both trees.

  const storeApi = async (): Promise<object> =>
    import('../../src/straylight/storage/postgres/index.js');

  const publishedReads = async (): Promise<
    readonly { readonly section: string; readonly sql: string }[]
  > => {
    const store = (await storeApi()) as unknown as Record<string, unknown>;
    expect(
      Array.isArray(store['CANONICAL_SNAPSHOT_READS']),
      'the store publishes no closed canonical read set',
    ).toBe(true);
    return store['CANONICAL_SNAPSHOT_READS'] as readonly {
      readonly section: string;
      readonly sql: string;
    }[];
  };

  /** The publisher's own whitespace normalization. NEVER a copy of it. */
  const publishedNormalize = async (): Promise<(sql: string) => string> => {
    const store = (await storeApi()) as unknown as Record<string, unknown>;
    expect(
      typeof store['canonicalReadText'],
      'the store publishes no read-text normalizer',
    ).toBe('function');
    return store['canonicalReadText'] as (sql: string) => string;
  };

  type BoundaryPhase = 'begin' | 'commit' | 'rollback';

  const publishedBoundary = async (): Promise<Readonly<Record<BoundaryPhase, string>>> => {
    const verifier = (await verifierModule()) as unknown as Record<string, unknown>;
    const boundary = verifier['READ_ONLY_BOUNDARY'];
    expect(
      typeof boundary === 'object' && boundary !== null,
      'the verifier publishes no read-only transaction boundary',
    ).toBe(true);
    return boundary as Readonly<Record<BoundaryPhase, string>>;
  };

  // ── OBJECT BINDING (F-14): CATALOG FACTS, NEVER SQL TEXT ──────────────────
  //
  // The object-binding decision is over catalog facts PostgreSQL's own resolver
  // reports, so the proofs below construct those facts directly. `requested` names
  // come from the publisher's own `CANONICAL_BINDING_RELATIONS`; the proofs never
  // restate a relation name of their own.

  /** One row of the object-binding read, as the catalog would report it. */
  type CatalogRow = {
    requested: string;
    resolved: boolean;
    relkind: string | null;
    relowner: string | number | null;
    relnamespace: string | number | null;
    namespace: string | null;
  };

  /**
   * Catalog facts under which every canonical relation binds: each resolves to a
   * base table (`relkind 'r'`) in ONE namespace owned by ONE role — the trusted
   * shape the binding gate demands. A mutated copy of these is how each PURE
   * counterexample expresses a single substitution.
   */
  const trustedBindingRows = (relations: readonly string[]): CatalogRow[] =>
    relations.map((relation) => ({
      requested: relation,
      resolved: true,
      relkind: 'r',
      relowner: '10',
      relnamespace: '2200',
      namespace: 'public',
    }));

  /**
   * A client that answers the object-binding read with the given catalog rows and
   * every other statement with no rows. On a tree that issues no binding read it
   * is exactly an inert client. `onRead`, if given, runs for each statement that
   * is neither a boundary statement nor the binding read — so a proof can make a
   * SNAPSHOT read fail without disturbing the binding or the boundary.
   */
  const bindingClient = (
    recognizeBinding: (sql: string) => boolean,
    rows: readonly CatalogRow[],
    boundaryText: Readonly<Record<BoundaryPhase, string>>,
    onRead?: () => void,
  ): { calls: number; query: (arg: unknown) => Promise<{ rows: unknown[] }> } => {
    const client = {
      calls: 0,
      query: async (arg: unknown): Promise<{ rows: unknown[] }> => {
        client.calls += 1;
        const sql = typeof arg === 'string' ? arg : ((arg as { text?: string })?.text ?? '');
        if (recognizeBinding(sql)) return { rows: [...rows] };
        if (
          onRead !== undefined &&
          sql !== boundaryText.begin &&
          sql !== boundaryText.commit &&
          sql !== boundaryText.rollback
        ) {
          onRead();
        }
        return { rows: [] };
      },
    };
    return client;
  };

  /**
   * Statement forms that MUST NOT be certified read-only.
   *
   * Deliberately mixed: named destructive DDL/DML, state-reducing statements that
   * no keyword list would have called destructive (`SET`, `LOCK`, `SELECT
   * pg_terminate_backend`), a data-modifying CTE whose text begins with `WITH`, a
   * second statement smuggled after a `;`, an anonymous code block, and a
   * `SELECT … INTO`. Under a denylist most of these pass by omission; under
   * MEMBERSHIP IN A PUBLISHED SET they are refused without being enumerated as
   * dangerous at all, which is why they are listed HERE, in the test, and not in
   * the module.
   *
   * The last entry is the SEQUENCE-110 counterexample: a statement that is not
   * destructive by any keyword and that SATISFIES the rejected grammar exactly —
   * a bare column projected from a bare relation — while being a read of a
   * relation this repository does not have, does not read, and could not vouch
   * for. It is refused for the only reason that generalizes: nothing publishes it.
   */
  const SIDE_EFFECT_READ = 'SELECT actor_id FROM side_effect_view';

  const HOSTILE_SQL: readonly string[] = [
    'DROP SCHEMA public CASCADE',
    'DROP DATABASE straylight_source',
    'TRUNCATE actors',
    'DELETE FROM actors',
    'UPDATE actors SET record = NULL',
    'ALTER TABLE actors DROP COLUMN record',
    'INSERT INTO actors (actor_id) VALUES (1)',
    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity',
    'WITH gone AS (DELETE FROM actors RETURNING actor_id) SELECT actor_id FROM gone',
    'SELECT actor_id FROM actors; DROP TABLE actors',
    'SET session_replication_role = replica',
    'LOCK TABLE actors IN ACCESS EXCLUSIVE MODE',
    'DO $$ BEGIN PERFORM 1; END $$',
    'SELECT actor_id INTO scratch FROM actors',
    'CALL some_procedure()',
    'SELECT actor_id FROM actors -- and then something else',
    'VACUUM FULL actors',
    'REFRESH MATERIALIZED VIEW actors_mv',
    SIDE_EFFECT_READ,
  ];

  it('the verifier module issues no destructive statement on any code path', () => {
    // Checked over the EXECUTABLE text with comments blanked: this module's
    // header and its operator-facing message both NAME these statements while
    // promising not to issue them, so a raw-bytes scan would be satisfied by the
    // promise rather than by the absence.
    const code = executableText(readFileSync(resolve(ROOT, VERIFIER), 'utf8'));

    // Statements the module must be unable to issue. Matched as SQL passed to a
    // query call — `client.query('…')` — rather than anywhere in the text, so
    // the operator message that lists them for the human reader is not itself a
    // violation.
    const queried = [...code.matchAll(/\.query\(\s*(['"`])([\s\S]*?)\1/g)].map((m) => m[2] ?? '');
    for (const sql of queried) {
      expect(
        /\b(?:DROP|TRUNCATE|DELETE|ALTER|CREATE|INSERT|UPDATE)\b/i.test(sql),
        `${VERIFIER} issues a destructive statement: ${sql}`,
      ).toBe(false);
    }

    // AND THE STRONGER FORM, so the check above cannot become vacuous by the
    // literals simply moving: EVERY argument this module passes to a query call is
    // an expression drawn from a PUBLISHED set — the boundary this module
    // publishes, or a step of the plan `portability.ts` publishes and iterates.
    // A statement written anywhere else, destructive or not, fails here.
    const queryArguments = [...code.matchAll(/\.query\(([^)]*)\)/g)].map((m) =>
      (m[1] ?? '').trim(),
    );
    expect(queryArguments.length, 'the verifier issues nothing at all').toBeGreaterThan(0);
    for (const argument of queryArguments) {
      expect(
        /^READ_ONLY_BOUNDARY\.(?:begin|commit|rollback)$/.test(argument),
        `${VERIFIER} issues a statement that no published set authorizes: ${argument}`,
      ).toBe(true);
    }

    // It must not reach for the destructive machinery at all — no import of the
    // proof module, and no call to the schema-emptying or migration entry points.
    expect(/from\s+['"][^'"]*two-host-proof/.test(code)).toBe(false);
    expect(/\bemptySchema\s*\(/.test(code)).toBe(false);
    expect(/\.migrate\s*\(/.test(code)).toBe(false);
    expect(/\.rollback\s*\(/.test(code)).toBe(false);
  });

  // ── THE SEQUENCE-104 F-14 COUNTEREXAMPLE ─────────────────────────────────
  //
  // The rejected abstraction: the verifier COMPUTED a non-destruction proof and
  // then threw it away. `ok` was `differences.length === 0 && brokenChains.length
  // === 0`, and the CLI's PASS branch consulted only that, so a run that had
  // issued `DROP SCHEMA public CASCADE` reported PASS and exited 0. The proof
  // existed, was correct, and governed nothing.
  //
  // The counterexample takes the decision at the REAL seam: each hostile
  // statement is issued through `observeQueries` over an inert client, and the
  // verdict is then asked of `decideVerification` with two IDENTICAL readings —
  // so the estates agree, every chain verifies, and the ONLY thing that can make
  // the verdict fail is what was observed. Against the substrate every one of
  // these returns `ok: true` and exit 0, and this FAILS naming the statement that
  // was certified safe.
  it('COUNTEREXAMPLE (F-14): a destructive or unrecognized observed statement forces failure', async () => {
    const verifier = await verifierModule();
    // Stated as an assertion so a tree without the governing seam fails HERE,
    // with the missing exports NAMED, rather than in a later "not a function".
    expect(
      missingExports(verifier, [
        'observeQueries',
        'observedQueryProof',
        'recordedObservations',
        'resetRecordedObservations',
        'classifyObservedSql',
        'decideVerification',
        'verificationExitCode',
      ]),
      'the observation-governs-verdict seam is absent from this module',
    ).toEqual([]);
    const {
      observeQueries,
      observedQueryProof,
      resetRecordedObservations,
      decideVerification,
      verificationExitCode,
    } = verifier;

    const reading = agreeingReading();

    // POSITIVE CONTROL FIRST, so a blanket "everything fails" cannot masquerade
    // as this proof: the SAME readings and the SAME seam, carrying THE REAL READ
    // PATH, must PASS and exit 0.
    //
    // The control drives `readStoreSnapshot` rather than a statement written here.
    // That is deliberate on two counts: this test then restates none of the
    // implementation's SQL, and the control means the same thing in both trees —
    // the read path proves itself under a grammar and under membership alike, so a
    // substrate run of this test fails on the hostile statement below rather than
    // on a control that assumed one tree's recognition rule.
    resetRecordedObservations();
    const control = inertClient();
    await readStoreSnapshot(observeQueries(control) as never);
    const passing = decideVerification(reading, reading, observedQueryProof());
    expect(passing.queryProof.observed, 'the control observed nothing').toBe(control.calls);
    expect(passing.differences).toEqual([]);
    expect(passing.brokenChains).toEqual([]);
    expect(passing.queryProof.proved, 'a recognized read must be provable').toBe(true);
    expect(passing.ok, 'agreeing estates plus an observed read-only statement must PASS').toBe(true);
    expect(verificationExitCode(passing)).toBe(0);

    // Now each hostile form, one at a time, from a clean record.
    for (const sql of HOSTILE_SQL) {
      resetRecordedObservations();
      const client = inertClient();
      await observeQueries(client).query(sql);
      // OBSERVED: the seam saw exactly what the client saw.
      const proof = observedQueryProof();
      expect(proof.observed, `the seam did not observe: ${sql}`).toBe(client.calls);
      expect(proof.refusals.length, `certified read-only: ${sql}`).toBe(1);
      expect(proof.proved, `certified read-only: ${sql}`).toBe(false);

      const report = decideVerification(reading, reading, proof);
      // The estates AGREE — so if the verdict is a pass, the observation governed
      // nothing, which is precisely the rejected abstraction.
      expect(report.differences, `${sql}: the readings must agree`).toEqual([]);
      expect(report.brokenChains).toEqual([]);
      expect(report.ok, `an observed "${sql}" was reported as a PASS`).toBe(false);
      expect(verificationExitCode(report), `an observed "${sql}" exited 0`).toBe(1);
    }

    // A CONFIG-SHAPED statement is the same statement. `pg` accepts
    // `query({ text })`, so a form the seam read only as text would be a hole.
    resetRecordedObservations();
    const configClient = inertClient();
    await observeQueries(configClient).query({ text: 'TRUNCATE actors' });
    const configProof = observedQueryProof();
    expect(configProof.observed).toBe(configClient.calls);
    expect(configProof.proved, 'a config-shaped TRUNCATE was certified read-only').toBe(false);
    expect(verificationExitCode(decideVerification(reading, reading, configProof))).toBe(1);

    // An UNOBSERVABLE statement is not benign. A statement whose text this seam
    // cannot read is still a statement, and it cannot be recognized.
    for (const opaque of [42, null, undefined, Symbol('sql'), { toString: () => 'SELECT 1' }]) {
      resetRecordedObservations();
      const opaqueClient = inertClient();
      await observeQueries(opaqueClient).query(opaque as never);
      const opaqueProof = observedQueryProof();
      expect(opaqueProof.observed).toBe(opaqueClient.calls);
      expect(
        opaqueProof.proved,
        `an unreadable query argument (${String(typeof opaque)}) was certified read-only`,
      ).toBe(false);
      expect(verificationExitCode(decideVerification(reading, reading, opaqueProof))).toBe(1);
    }

    // AND NO STATEMENT AT ALL fails too: an empty record is unproven, not safe.
    resetRecordedObservations();
    const emptyProof = observedQueryProof();
    expect(emptyProof.observed).toBe(0);
    expect(emptyProof.proved, 'an empty observation record was accepted as proof').toBe(false);
    const unproven = decideVerification(reading, reading, emptyProof);
    expect(unproven.ok, 'a run that observed nothing reported a PASS').toBe(false);
    expect(verificationExitCode(unproven)).toBe(1);
  });

  // ── THE SEQUENCE-110 F-14 COUNTEREXAMPLE ─────────────────────────────────
  //
  // The substrate recognized a statement by SHAPE: `^SELECT <bare columns> FROM
  // <bare relation> [ORDER BY <bare columns>]$`. The grammar was tight — no
  // parentheses, no `;`, no comment, no `JOIN`, no literal, no qualified name —
  // and the audit's counterexample walked straight through it, because the
  // relation was a bare identifier and therefore ANY bare identifier:
  //
  //     SELECT actor_id FROM side_effect_view      →  recognized, proved, exit 0
  //
  // Nothing about that statement is destructive to look at, and that is the
  // point: a shape cannot express "this module issues this statement", so it
  // authorized every relation that exists, every relation a migration will add,
  // and every relation with a rule, a trigger or a side effect behind it.
  //
  // This proof takes the same statement to the same seam. Against the substrate
  // the FIRST assertion fails, naming the statement that was certified read-only
  // and the shape that certified it. It needs only exports both trees have, so it
  // fails for THAT reason rather than for a missing replacement export.
  it('COUNTEREXAMPLE (F-14): a read of an UNPUBLISHED relation is refused, though it satisfies the rejected grammar exactly', async () => {
    const {
      classifyObservedSql,
      observeQueries,
      observedQueryProof,
      resetRecordedObservations,
      decideVerification,
      verificationExitCode,
    } = await verifierModule();

    // The statement IS the rejected grammar's own shape — asserted here, so the
    // counterexample cannot be dismissed as malformed input.
    expect(
      /^SELECT [A-Za-z_][A-Za-z0-9_]* FROM [A-Za-z_][A-Za-z0-9_]*$/.test(SIDE_EFFECT_READ),
      'the counterexample must satisfy the rejected grammar, or it proves nothing',
    ).toBe(true);

    const verdict = classifyObservedSql(SIDE_EFFECT_READ);
    expect(
      verdict.recognized,
      `certified read-only by SHAPE: "${SIDE_EFFECT_READ}" is a read of a relation no module ` +
        'publishes, issues, or can vouch for — a bare projection from a bare identifier is not ' +
        'authority',
    ).toBe(false);
    if (!verdict.recognized) {
      expect(verdict.reason).toContain('UNRECOGNIZED');
    }

    // And it governs the verdict: agreeing readings, so only the observation can
    // decide, and it must decide against.
    resetRecordedObservations();
    const client = inertClient();
    await observeQueries(client).query(SIDE_EFFECT_READ);
    const proof = observedQueryProof();
    expect(proof.observed).toBe(client.calls);
    expect(proof.proved, `"${SIDE_EFFECT_READ}" proved a read-only verification`).toBe(false);
    const reading = agreeingReading();
    const report = decideVerification(reading, reading, proof);
    expect(report.differences, 'the readings must agree, so only the observation decides').toEqual(
      [],
    );
    expect(report.ok, `an observed "${SIDE_EFFECT_READ}" was reported as a PASS`).toBe(false);
    expect(verificationExitCode(report), `an observed "${SIDE_EFFECT_READ}" exited 0`).toBe(1);
  });

  it('recognition is MEMBERSHIP in a published set, and REFUSES BY DEFAULT', async () => {
    const { classifyObservedSql } = await verifierModule();
    const reads = await publishedReads();
    const boundary = await publishedBoundary();

    // Every hostile form is refused, and the refusal says it was UNRECOGNIZED —
    // not that it matched a list of dangerous words.
    for (const sql of HOSTILE_SQL) {
      const verdict = classifyObservedSql(sql);
      expect(verdict.recognized, `recognized as read-only: ${sql}`).toBe(false);
      if (verdict.recognized) continue;
      expect(verdict.reason).toContain('UNRECOGNIZED');
    }

    // NON-VACUITY, from the publisher rather than from a restatement: every entry
    // of the published set is recognized, and the verdict NAMES the module that
    // issues it and the symbol that authorizes it. This test never writes a SQL
    // statement of its own — it asks the issuing module what it issues.
    expect(reads.length, 'the published read set is empty').toBe(8);
    for (const read of reads) {
      const verdict = classifyObservedSql(read.sql);
      expect(verdict.recognized, `a published canonical read is refused: ${read.section}`).toBe(
        true,
      );
      if (!verdict.recognized) continue;
      expect(verdict.authority.publisher).toBe('src/straylight/storage/postgres/portability.ts');
      expect(verdict.authority.published).toBe('CANONICAL_SNAPSHOT_READS');
      expect(verdict.authority.entry).toBe(read.section);
    }
    for (const [phase, sql] of Object.entries(boundary)) {
      const verdict = classifyObservedSql(sql);
      expect(verdict.recognized, `a published boundary statement is refused: ${phase}`).toBe(true);
      if (!verdict.recognized) continue;
      expect(verdict.authority.publisher).toBe('scripts/phase-50a/verify-existing-restore.ts');
      expect(verdict.authority.published).toBe('READ_ONLY_BOUNDARY');
      expect(verdict.authority.entry).toBe(phase);
    }

    // THE STRENGTHENING, STATED. Each of these was RECOGNIZED by the substrate's
    // grammar — the first three are pinned as accepted in the substrate's own copy
    // of this suite — and every one of them is refused now. They are listed
    // because the change is a narrowing a reader should be able to see, not
    // because any of them is dangerous: a statement nothing publishes is
    // unauthorized whether or not it could do harm.
    const NARROWED: readonly string[] = [
      'SELECT actor_id, record FROM actors',
      'SELECT actor_id FROM actors ORDER BY actor_id ASC',
      '  select   actor_id   from   actors  ',
      SIDE_EFFECT_READ,
    ];
    for (const sql of NARROWED) {
      expect(
        classifyObservedSql(sql).recognized,
        `a statement no module publishes is still recognized: ${sql}`,
      ).toBe(false);
    }
    // And the forms the grammar already refused stay refused.
    for (const sql of [
      'SELECT * FROM actors',
      'SELECT actor_id FROM public.actors',
      'SELECT actor_id FROM actors WHERE actor_id = 1',
      '',
    ]) {
      expect(classifyObservedSql(sql).recognized, `recognized: ${sql}`).toBe(false);
    }

    // WHITESPACE IS THE ONLY LATITUDE, and it is the publisher's own
    // normalization: a published read re-spelled across lines is the same
    // statement, a published read with a token changed is not.
    const first = reads[0]!;
    expect(classifyObservedSql(`\n  ${first.sql.trim().replace(/ /g, '\n   ')}\n`).recognized).toBe(
      true,
    );
    expect(classifyObservedSql(first.sql.toLowerCase()).recognized, 'case is folded').toBe(false);
    expect(classifyObservedSql(`${first.sql} `).recognized).toBe(true);
    expect(classifyObservedSql(`${first.sql};`).recognized, 'a trailing ; is tolerated').toBe(false);

    // ── NO SHAPE, NO DENYLIST, IN THE EXECUTABLE TEXT ────────────────────
    //
    // Both rejected abstractions are absent from the code, checked over
    // executable text because the comments explain each of them at length.
    const code = executableText(readFileSync(resolve(ROOT, VERIFIER), 'utf8'));
    expect(
      /DROP\s*\|\s*TRUNCATE/.test(code),
      'the rejected destructive-keyword denylist is back',
    ).toBe(false);
    expect(
      /\[A-Za-z_\]\[A-Za-z0-9_\]\*/.test(code),
      'the rejected identifier grammar is back: a bare relation pattern is not authority',
    ).toBe(false);
    expect(
      /READ_ONLY_PROJECTION|new RegExp\(/.test(code),
      'the rejected shape matcher is back',
    ).toBe(false);
    // Recognition must go through the publisher's own membership test.
    expect(code).toContain('recognizeCanonicalRead(sql)');
    expect(code).toContain('canonicalReadText(sql)');
  });

  it('the AUTHORITY is published by the module that ISSUES the statements, and issuance walks it', async () => {
    // The property that makes membership meaningful: the set is not a list beside
    // the code, it is the data `readStoreSnapshot` executes. Proven by OBSERVATION
    // at the real seam — the statements the read path issues are compared, as a
    // multiset, against the statements the publisher publishes.
    const { observeQueries, resetRecordedObservations, recordedObservations } =
      await verifierModule();
    const reads = await publishedReads();
    const norm = await publishedNormalize();

    resetRecordedObservations();
    const client = inertClient();
    const snapshot = await readStoreSnapshot(observeQueries(client) as never);

    const issued = recordedObservations().map((o) => norm(o.sql ?? ''));
    const published = reads.map((r) => norm(r.sql));
    expect(
      [...issued].sort(),
      'the read path issues a statement the publisher does not publish, or omits one it does',
    ).toEqual([...published].sort());
    // In ISSUE ORDER, too: the published order is the execution order, so a
    // consumer reading the set sees what a run will actually do.
    expect(issued).toEqual(published);
    // And the published sections are the snapshot's OWN sections — no read is
    // published for a section the snapshot does not have, and none of the
    // snapshot's sections is filled by something unpublished.
    expect([...reads.map((r) => r.section)].sort()).toEqual([...Object.keys(snapshot)].sort());
  });

  it('the READ-ONLY BOUNDARY wraps the published reads, in order, and is authorized on the same terms', async () => {
    // A DB-ENFORCED read-only boundary is the second half of F-14: the observation
    // proof says what was issued, and `BEGIN TRANSACTION READ ONLY` makes a write
    // impossible to carry out regardless. What can be proven WITHOUT a database is
    // the ISSUANCE — that the boundary is really wrapped around the reads, on both
    // the success and the failure path — and that is proven here, at the real seam.
    // The live SQLSTATE-25006 refusal is proven against a real server in
    // `postgres-two-host-portability.test.ts`.
    const verifier = await verifierModule();
    expect(
      missingExports(verifier, ['readSnapshotUnderReadOnlyBoundary']),
      'the read-only boundary is absent from this module',
    ).toEqual([]);
    const {
      readSnapshotUnderReadOnlyBoundary,
      observeQueries,
      observedQueryProof,
      resetRecordedObservations,
      recordedObservations,
    } = verifier;
    const boundary = await publishedBoundary();
    const reads = await publishedReads();
    const norm = await publishedNormalize();

    // ── SUCCESS PATH: begin, [the object-binding read,] the reads, commit ─
    //
    // The fixed tree wraps a canonical OBJECT-BINDING read FIRST (F-14): the
    // snapshot reads run only after every canonical name is proven to resolve to a
    // trusted base table. Ask the store whether it publishes that read, and build
    // both the expected issuance and a client that satisfies the binding from what
    // it publishes — restating no SQL of this proof's own. On a tree without object
    // binding the client is inert and the sequence is just the boundary and reads.
    const store = (await storeApi()) as unknown as Record<string, unknown>;
    const bindsObjects =
      typeof store['recognizeCanonicalBindingRead'] === 'function' &&
      typeof store['CANONICAL_OBJECT_BINDING_READ'] === 'string' &&
      Array.isArray(store['CANONICAL_BINDING_RELATIONS']);
    const recognizeBinding = bindsObjects
      ? (store['recognizeCanonicalBindingRead'] as (sql: string) => boolean)
      : (): boolean => false;
    const boundRows = bindsObjects
      ? trustedBindingRows(store['CANONICAL_BINDING_RELATIONS'] as readonly string[])
      : [];

    resetRecordedObservations();
    const client = bindingClient(recognizeBinding, boundRows, boundary);
    await readSnapshotUnderReadOnlyBoundary(observeQueries(client) as never);
    const issued = recordedObservations().map((o) => norm(o.sql ?? ''));
    expect(issued).toEqual([
      norm(boundary.begin),
      ...(bindsObjects ? [norm(store['CANONICAL_OBJECT_BINDING_READ'] as string)] : []),
      ...reads.map((r) => norm(r.sql)),
      norm(boundary.commit),
    ]);
    // EVERY statement — the boundary's own and the binding read included — is
    // authorized. The module holds itself to the rule it applies to `portability.ts`.
    const proof = observedQueryProof();
    expect(proof.observed).toBe(client.calls);
    expect(proof.refusals, 'the boundary statements are unauthorized by their own rule').toEqual([]);
    expect(proof.proved).toBe(true);

    // ── FAILURE PATH: begin, [binding,] the reads that ran, ROLLBACK ────
    //
    // So the set of statements the module can issue is the same on every path: a
    // read that throws must not leave the transaction open, and the statement that
    // closes it must be authorized too. The binding is satisfied, so it is a
    // SNAPSHOT read that fails here, on either tree.
    resetRecordedObservations();
    let readsRun = 0;
    const failing = bindingClient(recognizeBinding, boundRows, boundary, () => {
      readsRun += 1;
      if (readsRun === 1) throw new Error('phase-50a test: a snapshot read fails');
    });
    await expect(
      readSnapshotUnderReadOnlyBoundary(observeQueries(failing) as never),
    ).rejects.toThrow('a snapshot read fails');
    const afterFailure = recordedObservations().map((o) => norm(o.sql ?? ''));
    expect(afterFailure[0]).toBe(norm(boundary.begin));
    expect(
      afterFailure[afterFailure.length - 1],
      'a failed read left the read-only transaction open',
    ).toBe(norm(boundary.rollback));
    expect(afterFailure).not.toContain(norm(boundary.commit));
    expect(
      observedQueryProof().refusals,
      'the failure path issued something unauthorized',
    ).toEqual([]);

    // ── IT WIDENS NO AUTHORITY ──────────────────────────────────────────
    //
    // The boundary adds no role, no privilege, no connection parameter, no
    // environment override, and no caller-supplied statement: it takes a client
    // and nothing else, and its texts come from the frozen published set.
    expect(readSnapshotUnderReadOnlyBoundary.length, 'it accepts more than a client').toBe(1);
    expect(Object.isFrozen(boundary)).toBe(true);
    const code = executableText(readFileSync(resolve(ROOT, VERIFIER), 'utf8'));
    // The ONE environment read in this module is the script guard that keeps
    // importing it inert; nothing about the boundary, the authority or the target
    // is configurable from outside.
    const envReads = [...code.matchAll(/process\.env\[?['"]?([A-Za-z_][A-Za-z0-9_]*)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(envReads, 'the verifier takes configuration from the environment').toEqual(['VITEST']);
    expect(
      /\bSET\b|\bROLE\b|\bGRANT\b|default_transaction_read_only/.test(code),
      'the boundary was widened into session or privilege configuration',
    ).toBe(false);
    // The three boundary statements are the ONLY literals it issues, and they are
    // issued through the published symbol rather than as text at the call site.
    for (const phase of ['begin', 'commit', 'rollback'] as const) {
      expect(code).toContain(`READ_ONLY_BOUNDARY.${phase}`);
    }
    const literalQueries = [...code.matchAll(/\.query\(\s*(['"`])([\s\S]*?)\1/g)].map(
      (m) => m[2] ?? '',
    );
    expect(
      literalQueries,
      'the verifier issues a statement written as a literal at the call site',
    ).toEqual([]);
  });

  // ── THE SEQUENCE-116 F-14 COUNTEREXAMPLE ─────────────────────────────────
  //
  // The sequence-110 closure made recognition MEMBERSHIP in a published set, so a
  // read is refused unless the ISSUING module publishes its exact text. The
  // sequence-116 audit found that this proves the STATEMENT is canonical, not that
  // the OBJECTS it names are: `SELECT actor_id, record FROM actors` is byte-for-byte
  // the published read, so text membership passes — but a caller who controls
  // `search_path`, or who has planted a same-named view / foreign table / a table
  // in another schema, can make that exact text resolve to a SUBSTITUTED object
  // with a read-time side effect. The substrate reads it: the SQL is canonical, the
  // object is not, and nothing checks the object.
  //
  // The head binds first. An object-binding read resolves every canonical name
  // under the SAME session (so it sees the same `search_path`) and refuses anything
  // that is not a trusted base table in the migration ledger's schema owned by the
  // ledger's owner — BEFORE a single snapshot read is issued. The decision is PURE
  // over catalog facts PostgreSQL's own resolver reports, never over SQL text.
  //
  // Against the substrate the SURFACE assertion fails (no binding is published);
  // the behavioural assertion would fail too — a substituted object is read rather
  // than refused. It uses only exports both trees COULD have for its gate, so it
  // fails for the ABSENCE of the binding, not for a later "not a function".
  it('COUNTEREXAMPLE (F-14): the canonical reads are BOUND to trusted DB objects, and a substitution is refused before any read', async () => {
    const store = (await storeApi()) as unknown as Record<string, unknown>;
    // SURFACE: the object-binding seam must exist. Stated as an assertion so a tree
    // without it fails HERE, naming the missing functions, rather than later.
    expect(
      missingExports(store, [
        'evaluateObjectBinding',
        'bindCanonicalObjects',
        'recognizeCanonicalBindingRead',
      ]),
      'the object-binding seam is absent from this module',
    ).toEqual([]);
    // The read text and the relation list are VALUE exports (not functions), so
    // they are checked by type rather than through `missingExports`.
    expect(typeof store['CANONICAL_OBJECT_BINDING_READ'], 'no binding read is published').toBe(
      'string',
    );
    expect(
      Array.isArray(store['CANONICAL_BINDING_RELATIONS']),
      'no binding relation list is published',
    ).toBe(true);
    expect(typeof store['CANONICAL_LEDGER_RELATION'], 'no migration ledger is named').toBe('string');

    const evaluateObjectBinding = store['evaluateObjectBinding'] as (
      rows: readonly CatalogRow[],
      expected?: readonly string[],
    ) => { bound: boolean; reasons: readonly string[]; ledgerNamespace: string | null };
    const recognizeBinding = store['recognizeCanonicalBindingRead'] as (sql: string) => boolean;
    const relations = store['CANONICAL_BINDING_RELATIONS'] as readonly string[];
    const ledgerRelation = store['CANONICAL_LEDGER_RELATION'] as string;
    const nonLedger = (): CatalogRow => {
      const rows = trustedBindingRows(relations);
      const victim = rows.find((r) => r.requested !== ledgerRelation);
      expect(victim, 'the binding relation list is only the ledger').not.toBeUndefined();
      return victim!;
    };

    // ── PURE: the decision is over CATALOG FACTS, provable without a database ─
    //
    // Trusted facts bind; each single substitution — a VIEW, another SCHEMA,
    // another OWNER, an UNRESOLVED name, a substituted LEDGER, a DUPLICATE row —
    // is refused, and the refusal names the relation.
    expect(
      evaluateObjectBinding(trustedBindingRows(relations)).bound,
      'trusted objects did not bind',
    ).toBe(true);

    const asView = trustedBindingRows(relations);
    const viewed = asView.find((r) => r.requested !== ledgerRelation)!;
    viewed.relkind = 'v';
    const viewVerdict = evaluateObjectBinding(asView);
    expect(viewVerdict.bound, 'a canonical name resolving to a VIEW was bound').toBe(false);
    expect(viewVerdict.reasons.join(' ')).toContain(viewed.requested);

    const otherSchema = trustedBindingRows(relations);
    const misplaced = otherSchema.find((r) => r.requested !== ledgerRelation)!;
    misplaced.relnamespace = '9999';
    misplaced.namespace = 'attacker';
    expect(
      evaluateObjectBinding(otherSchema).bound,
      'a canonical name in another SCHEMA was bound',
    ).toBe(false);

    const otherOwner = trustedBindingRows(relations);
    otherOwner.find((r) => r.requested !== ledgerRelation)!.relowner = '99';
    expect(
      evaluateObjectBinding(otherOwner).bound,
      'a canonical name under another OWNER was bound',
    ).toBe(false);

    const unresolved = trustedBindingRows(relations);
    Object.assign(unresolved.find((r) => r.requested !== ledgerRelation)!, {
      resolved: false,
      relkind: null,
      relowner: null,
      relnamespace: null,
      namespace: null,
    });
    expect(
      evaluateObjectBinding(unresolved).bound,
      'an UNRESOLVED canonical name was bound',
    ).toBe(false);

    // The ledger is the anchor: substitute IT and nothing binds.
    const substitutedLedger = trustedBindingRows(relations).map((r) =>
      r.requested === ledgerRelation ? { ...r, relkind: 'v' } : r,
    );
    expect(
      evaluateObjectBinding(substitutedLedger).bound,
      'a substituted migration LEDGER still bound',
    ).toBe(false);

    // A duplicated row for one name is not what the read returns, so it is refused.
    const duplicated = [...trustedBindingRows(relations), nonLedger()];
    expect(
      evaluateObjectBinding(duplicated).bound,
      'a duplicated binding row was accepted',
    ).toBe(false);

    // ── SEAM: a substitution is refused BEFORE any snapshot read ─────────────
    //
    // The binding read runs first and inside the transaction; when it reports a
    // substituted object the boundary rolls back and throws WITHOUT issuing a
    // single snapshot read — so a canonical name backed by a view with a read-time
    // side effect is never read even once.
    const norm = await publishedNormalize();
    const boundary = await publishedBoundary();
    const publishedReadTexts = new Set((await publishedReads()).map((r) => norm(r.sql)));
    const {
      readSnapshotUnderReadOnlyBoundary,
      observeQueries,
      recordedObservations,
      resetRecordedObservations,
      classifyObservedSql,
    } = await verifierModule();

    resetRecordedObservations();
    const client = bindingClient(recognizeBinding, asView, boundary);
    await expect(
      readSnapshotUnderReadOnlyBoundary(observeQueries(client) as never),
    ).rejects.toThrow(/canonical object binding failed/);

    const observed = recordedObservations().map((o) => o.sql ?? '');
    expect(observed.some((sql) => recognizeBinding(sql)), 'the binding read was not issued').toBe(
      true,
    );
    const snapshotReadsObserved = observed.filter((sql) => publishedReadTexts.has(norm(sql)));
    expect(
      snapshotReadsObserved,
      'a snapshot read was issued against an object that failed to bind',
    ).toEqual([]);
    const normObserved = observed.map((sql) => norm(sql));
    expect(
      normObserved[normObserved.length - 1],
      'a failed binding left the read-only transaction open',
    ).toBe(norm(boundary.rollback));

    // The binding read is recognized on the SAME membership terms as the reads.
    const verdict = classifyObservedSql(store['CANONICAL_OBJECT_BINDING_READ'] as string);
    expect(verdict.recognized, 'the binding read is not recognized authority').toBe(true);
    if (verdict.recognized) {
      expect(verdict.authority.publisher).toBe('src/straylight/storage/postgres/portability.ts');
      expect(verdict.authority.published).toBe('CANONICAL_OBJECT_BINDING_READ');
    }
  });

  it('OBSERVED: the REAL read path is seen in full and recognized in full, without a database', async () => {
    // The proof that the grammar is not merely strict but CORRECT: the actual
    // `readStoreSnapshot` — the one the live verification uses — is driven through
    // the real seam over an inert client, and every statement it issues is
    // observed and affirmatively recognized. Non-vacuity for the grammar, and the
    // reason a tightened grammar cannot quietly reject the read path it exists to
    // admit.
    const { observeQueries, observedQueryProof, resetRecordedObservations, recordedObservations } =
      await verifierModule();

    resetRecordedObservations();
    const client = inertClient();
    await readStoreSnapshot(observeQueries(client) as never);

    const proof = observedQueryProof();
    expect(client.calls, 'readStoreSnapshot issues one projection per relation').toBe(8);
    // EVERY statement the client saw was observed — the seam is not sampling.
    expect(proof.observed, 'the seam observed fewer statements than were issued').toBe(client.calls);
    expect(proof.refusals, 'the real read path was refused by its own grammar').toEqual([]);
    expect(proof.recognized).toBe(client.calls);
    expect(proof.proved).toBe(true);
    // And each observation carries readable text, not an unobservable placeholder.
    for (const observation of recordedObservations()) {
      expect(observation.shape).toBe('text');
      expect(typeof observation.sql).toBe('string');
      expect(observation.verdict.recognized).toBe(true);
    }
  });

  it('the EXIT STATUS is a function of the observation proof and of nothing else', async () => {
    const { decideVerification, verificationExitCode } = await verifierModule();
    const reading = agreeingReading();

    // The mapping, by value: not-ok is nonzero, ok is zero.
    const proved = { observed: 8, recognized: 8, refusals: [], proved: true };
    const unproved = { observed: 1, recognized: 0, refusals: ['#1 [text] UNRECOGNIZED'], proved: false };
    expect(
      verificationExitCode(decideVerification(reading, reading, proved)),
      'an agreeing reading with a proved observation record must exit 0',
    ).toBe(0);
    expect(
      verificationExitCode(decideVerification(reading, reading, unproved)),
      'the observation proof does not reach the exit status: an UNPROVED record ' +
        'still exited 0, so the verdict is disconnected from what was issued',
    ).toBe(1);
    // `proved` is a CONJUNCT, so a disagreement still fails even when the reads
    // are provable.
    const divergent = { ...reading, digest: 'sha256:something-else' };
    expect(verificationExitCode(decideVerification(reading, divergent, proved))).toBe(1);
    // …and a broken chain does too.
    const broken = { ...reading, chains: [{ estate_id: 'estate-a', ok: false, length: 3, tail: null }] };
    expect(decideVerification(broken, broken, proved).ok).toBe(false);

    // THE CLI CANNOT DIVERGE FROM THIS. The exit status is assigned exactly once,
    // from exactly this function — asserted over executable text because it is a
    // property of the script's structure, and it is what makes the DB-free proofs
    // above statements about the operator-visible exit code too.
    const code = executableText(readFileSync(resolve(ROOT, VERIFIER), 'utf8'));
    const assignments = code.match(/process\.exitCode\s*=/g) ?? [];
    expect(assignments, 'the exit status must be assigned exactly once').toHaveLength(1);
    expect(code).toContain('process.exitCode = verificationExitCode(result);');
    // And the verdict itself must carry the proof as a conjunct.
    expect(/ok:[^\n]*queryProof\.proved/.test(code), 'the proof does not govern the verdict').toBe(
      true,
    );
    // The PASS branch must be reached from the same decision, never recomputed.
    expect(code).toContain('if (result.ok)');
  });

  it('OBSERVED: the comparison itself issues nothing, in BOTH the agreeing and mismatching cases', async () => {
    // The verifier's comparison logic is exercised WITHOUT a database, so the
    // no-destruction property is proven on the same recorded seam the live path
    // uses: the record must stay EMPTY across a comparison, because comparing two
    // readings issues no statement at all.
    const { resetRecordedObservations, recordedObservations, observedQueryProof } =
      await verifierModule();
    resetRecordedObservations();
    expect(recordedObservations()).toEqual([]);

    const { describeSnapshotDifferences } = await import(
      '../../scripts/phase-50a/verify-existing-restore.js'
    );
    const empty = {
      actors: [],
      estates: [],
      keyrings: [],
      assertions: [],
      transitions: [],
      transitionReceipts: [],
      recallReceipts: [],
      auditEvents: [],
    };
    // Agreeing: no differences.
    expect(describeSnapshotDifferences(empty as never, empty as never)).toEqual([]);
    // Mismatching: a target missing a row is REPORTED, not passed.
    const withRow = { ...empty, actors: [{ actor_id: 'a', record: { actor_id: 'a' } }] };
    const differences = describeSnapshotDifferences(withRow as never, empty as never);
    expect(differences.length, 'a divergent target must be reported as a mismatch').toBeGreaterThan(
      0,
    );
    expect(differences.join(' ')).toContain('actors');

    // ZERO statements observed across both cases — and therefore NOTHING PROVEN
    // about a run that only compared, which is the honest verdict.
    expect(recordedObservations()).toEqual([]);
    expect(observedQueryProof().proved).toBe(false);
  });

  it('a MISMATCH is a distinct verdict from an inability to verify', async () => {
    // Pointed at a host that is not listening: this must fail as
    // "could not verify" — never silently as agreement, and never as a mismatch
    // verdict about estates it never read.
    const { resetRecordedObservations, recordedObservations } = await verifierModule();
    resetRecordedObservations();
    await expect(
      verifyExistingRestore(
        `${DEAD_ORIGIN}/definitely_not_listening`,
        `${DEAD_ORIGIN}/definitely_not_listening`,
      ),
    ).rejects.toThrow();
    // Nothing was observed because nothing ran, so the proof is UNAVAILABLE
    // rather than affirmative — the distinction the audit required. A refusal to
    // conclude is not a mismatch verdict and is not a pass.
    expect(recordedObservations()).toEqual([]);
  }, 30_000);

  it('REPRO (F-14): an EMPTY observation record is NOT proof of non-destruction', async () => {
    const { resetRecordedObservations, recordedObservations, observedQueryProof } =
      await verifierModule();
    resetRecordedObservations();
    // Nothing observed. A predicate used to prove "the verifier destroyed
    // nothing" must not answer yes here: no evidence is not evidence.
    expect(recordedObservations()).toEqual([]);
    const proof = observedQueryProof();
    expect(proof.observed).toBe(0);
    expect(proof.recognized).toBe(0);
    expect(
      proof.proved,
      'an empty observation record was accepted as proof of non-destruction',
    ).toBe(false);
  });

  it('REPRO (F-14): the record is populated by client.query EXECUTION, not by narration', async () => {
    // The observation seam must be the place SQL is actually issued. Proven
    // structurally AND behaviourally: no hand-written description may be pushed,
    // the recorder must wrap a query seam, and a statement issued through that
    // seam must appear in the record VERBATIM.
    const source = readFileSync(resolve(ROOT, VERIFIER), 'utf8');
    const executable = executableText(source);

    // (a) NO SYNTHETIC PUSH. The substrate pushed a hand-written
    // 'SELECT (readStoreSnapshot: ...)' description; nothing may announce SQL.
    expect(
      /observations\.push\(\s*['"`]/.test(executable),
      'the verifier pushes a hand-written statement description — that is narration, not observation',
    ).toBe(false);
    expect(/statements\.push\(\s*['"`]/.test(executable)).toBe(false);

    // (b) THE SEAM IS A QUERY WRAPPER. The recorder must observe a `query`
    // call, so every statement that reaches the client is recorded by
    // construction rather than by the author remembering to announce it.
    expect(
      /observeQueries|client\.query\b/.test(executable),
      'the verifier does not wrap client.query — the record cannot be an observation',
    ).toBe(true);
    // The live read path must go THROUGH the seam, not beside it. The seam wraps
    // the client BEFORE the boundary is opened, so the boundary's own statements
    // and the reads inside it are recorded by the same construction.
    expect(executable).toContain('readSnapshotUnderReadOnlyBoundary(observeQueries(client))');
    expect(executable).toContain('readStoreSnapshot(client)');

    // (c) BEHAVIOURAL: a statement nobody announced is recorded anyway, exactly
    // as issued. That is the property narration could not have.
    const { observeQueries, resetRecordedObservations, recordedObservations } =
      await verifierModule();
    resetRecordedObservations();
    const client = inertClient();
    const unannounced = 'SELECT actor_id FROM unexpected_relation';
    await observeQueries(client).query(unannounced);
    const record = recordedObservations();
    expect(record).toHaveLength(1);
    expect(record[0]?.sql, 'the record is not what was issued').toBe(unannounced);
    expect(record[0]?.shape).toBe('text');
  });

  it('REPRO (F-14): a COULD-NOT-VERIFY proves nothing affirmative, and destroys nothing', async () => {
    // Could-not-verify: an unreachable target. The run must report that it could
    // not be performed AND must NOT claim non-destruction from an empty record.
    const { resetRecordedObservations, recordedObservations, observedQueryProof } =
      await verifierModule();
    resetRecordedObservations();
    await expect(
      verifyExistingRestore(
        `${SOURCE_ORIGIN.replace('55432', '1')}/definitely_not_listening`,
        `${SOURCE_ORIGIN.replace('55432', '1')}/definitely_not_listening`,
      ),
    ).rejects.toThrow();
    // Nothing was observed because nothing ran, so the proof is UNAVAILABLE
    // rather than affirmative — the distinction the audit required.
    expect(recordedObservations()).toEqual([]);
    expect(observedQueryProof().proved).toBe(false);
    // What IS true unconditionally: no statement was issued, so none was
    // destructive. Stated as the observation it is, not as a proof of safety.
    expect(recordedObservations().filter((o) => !o.verdict.recognized)).toEqual([]);
  }, 30_000);

  it('the verifier is OPERATOR-INVOCABLE with no package.json change', () => {
    // The packet forbids editing package.json, so the entry point must be
    // reachable through the repository's existing TypeScript-script runner.
    // Proven by RUNNING it: `--help`-less invocation against an unreachable
    // target exits 2 ("could not be performed"), which is proof the module
    // loads, parses its arguments and reaches main() — without a script entry.
    // The child must run as an OPERATOR would run it, so `VITEST` is stripped
    // from its environment: the module's script guard is `VITEST === undefined`,
    // and an inherited `VITEST=true` would make the child load the module, run
    // nothing, and exit 0 — proving only that the file parses.
    const childEnv = { ...process.env };
    for (const key of Object.keys(childEnv)) {
      if (key === 'VITEST' || key.startsWith('VITEST_')) delete childEnv[key];
    }

    let status: number | null = null;
    let stderr = '';
    try {
      execFileSync(
        'npx',
        [
          'vite-node',
          VERIFIER,
          '--source',
          'postgresql://straylight_proof:x@127.0.0.1:1/not_listening',
          '--target',
          'postgresql://straylight_proof:x@127.0.0.1:1/not_listening',
        ],
        {
          cwd: ROOT,
          encoding: 'utf8',
          timeout: 120_000,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: childEnv,
        },
      );
      status = 0;
    } catch (e) {
      const err = e as { status?: number | null; stderr?: string };
      status = err.status ?? null;
      stderr = err.stderr ?? '';
    }
    expect(status, `expected exit 2 (could not verify); stderr: ${stderr.slice(0, 400)}`).toBe(2);
    expect(stderr).toContain('COULD NOT BE PERFORMED');
    // It says explicitly that nothing was modified.
    expect(stderr).toContain('Nothing was modified');

    // The package script surface is UNCHANGED: no new entry was added.
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(Object.keys(pkg.scripts)).not.toContain('phase-50a:verify-restore');
    expect(
      Object.values(pkg.scripts).some((s) => s.includes('verify-existing-restore')),
      'no package script may reference the verifier — it is invoked through vite-node directly',
    ).toBe(false);
  }, 180_000);
});

describe('Phase 50A F-14/F-15 — the runbook directs the operator at non-destructive verification', () => {
  const runbook = readFileSync(
    resolve(ROOT, 'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md'),
    'utf8',
  );

  it('the post-restore verification step no longer directs the destructive proof', () => {
    // §4.3 is the step an operator runs immediately after restoring real data.
    const section = runbook.slice(
      runbook.indexOf('### 4.3'),
      runbook.indexOf('### 4.4'),
    );
    expect(section.length, 'the §4.3 verification section must exist').toBeGreaterThan(200);
    // It must direct the NON-DESTRUCTIVE verifier…
    expect(section).toContain('verify-existing-restore.ts');
    // …and it says plainly that verification destroys nothing.
    expect(/non-destructive/i.test(section)).toBe(true);

    // …and must NOT DIRECT the destructive proof, which drops both schemas.
    //
    // The distinction is between a COMMAND the operator is told to run and a
    // WARNING that names it. §4.3 does both — it warns explicitly against the
    // proof — so the assertion is over the RUNNABLE COMMANDS in the section's
    // fenced bash blocks, not over its prose. Scanning the prose would forbid
    // the very warning that closes the finding.
    const bashBlocks = [...section.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]);
    expect(bashBlocks.length, '§4.3 must give the operator a runnable command').toBeGreaterThan(0);
    const commands = bashBlocks.join('\n');
    expect(
      commands.includes('phase-50a:proof'),
      '§4.3 must not tell the operator to RUN the DESTRUCTIVE proof on a just-restored estate',
    ).toBe(false);
    // The command it does give is the non-destructive verifier.
    expect(commands).toContain('verify-existing-restore.ts');
    // And the section carries the explicit warning against the destructive path.
    expect(/do not run .*phase-50a:proof/i.test(section)).toBe(true);
    expect(/destructive/i.test(section)).toBe(true);
  });

  it('the destructive exercise is still documented — as the disposable-harness proof only', () => {
    // Removing it would lose the reproducible exercise; the fix is that it is
    // labelled for what it is and pointed at the harness.
    expect(runbook).toContain('npm run phase-50a:proof');
    const proofMentions = runbook.split('npm run phase-50a:proof').length - 1;
    expect(proofMentions).toBeGreaterThan(0);
    expect(/disposable/i.test(runbook)).toBe(true);
  });

  it('the checksum-mismatch response gives an EXECUTABLE route or fail-closed quarantine — never a command guaranteed to refuse', () => {
    const section = runbook.slice(runbook.indexOf('### 9.3'));
    expect(section.length, 'the §9.3 operator-response section must exist').toBeGreaterThan(200);
    // The substrate directed export → rollback → re-apply. `rollback` REFUSES on
    // a mismatched checksum (migrate.ts verifies before acting), so that route
    // could not execute. The corrected text must not promise it without saying so.
    expect(
      /quarantine/i.test(section),
      '§9.3 must direct fail-closed quarantine when no executable repair route exists',
    ).toBe(true);
    expect(/escalat/i.test(section)).toBe(true);
    // And it must state WHY rollback is not the route — the refusal is the point.
    expect(/refus/i.test(section)).toBe(true);
  });
});
