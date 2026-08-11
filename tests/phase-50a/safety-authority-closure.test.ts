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
//   F-04  `redactConnectionString` decides with the SAME effective parser
//         semantics that determine which credentials `pg` receives — on the
//         decision side AND on the output-containment side — so a
//         parser-derived credential is unrecoverable from a diagnostic under
//         the whole decoding family: raw, percent-decoded, form-decoded (`+`
//         to space), URLSearchParams-decoded, re-encoded, and for duplicate
//         parameters in the winning and the losing role alike. Malformed or
//         ambiguous credential-shaped query content fails closed WITHOUT
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
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  PostgresEstateHost,
  readStoreSnapshot,
  redactConnectionString,
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

// SUPERSEDED BY THE SEQUENCE-104 AUDIT. The two-line header immediately above
// belongs to the F-01 block this slice must preserve byte-for-byte, so it still
// says "raw and percent-decoded". That framing is the one the audit REJECTED:
// "raw and percent-decoded" is a DECODER LIST, and a list is a claim about the
// spellings somebody thought of. What follows states the property instead —
// absence under the whole decoding family the reader of a diagnostic can apply
// — and `expectUnrecoverable` below is where that is enforced.

describe('Phase 50A F-04 — redactConnectionString decides WITH the real connection parser', () => {
  /**
   * The option names `pg` treats as carrying a credential.
   *
   * Used ONLY as the test's oracle key set — to ask "did the parser put a value
   * under a name pg would use as a credential?" — never as a redaction rule.
   * The implementation derives its own names from the parser; if this list and
   * the implementation ever disagreed about a name the parser honours, the
   * seek-disagreement proof below would fail, which is the point.
   */
  const CREDENTIAL_KEYS: readonly string[] = [
    'password',
    'passwd',
    'pgpassword',
    'pgpassfile',
    'sslpassword',
    'sslkey',
  ];

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
   * ── WHY A DECODER LIST IS NOT THE SAME THING (sequence-104 audit, F-04) ──
   *
   * The audited helper asked three questions: is the secret present raw, is it
   * present percent-decoded, is it present percent-ENCODED. Each is a decoder
   * somebody remembered. The sequence-104 counterexample was the one nobody
   * remembered: `?password=hunter+2+secret` gives `pg` the credential
   * `hunter 2 secret`, and a diagnostic containing the LITERAL `hunter+2+secret`
   * passed all three checks while handing the credential to anyone who read it
   * the way the query itself is read — with `URLSearchParams`, where `+` is a
   * space.
   *
   * So the question here is not "which decoders did we list" but "what can be
   * recovered". The forms are generated by APPLYING the readings a consumer of a
   * connection-string diagnostic actually applies — the text itself, percent
   * decoding, form decoding (`+` to space), `URLSearchParams` over the whole
   * text AND over its query span, and WHATWG `URL` field extraction — and the
   * secret is compared against all of them, in its decoded, encoded and
   * form-encoded spellings alike. Adding a reading can only strengthen this;
   * REMOVING one is what the mutation proof detects.
   *
   * Deliberately independent of the implementation: `parserReadings` in
   * `config.ts` is module-private and the export surface is pinned below, so
   * this is a second, separately written witness rather than the same code
   * grading its own homework.
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
    // `URLSearchParams` NEVER throws, and it form-decodes: this is the reading
    // the sequence-104 counterexample used.
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
   * A credential is UNRECOVERABLE from a redaction: no spelling of it appears in
   * any form a reader can obtain from the text.
   *
   * The replacement for the audited `expectNoSecret`. Both sides are widened:
   * the TEXT is read every way (`recoverableForms`), and the SECRET is sought in
   * every spelling it could have been written as — decoded, percent-encoded and
   * form-encoded (space as `+`) — because the credential `pg` receives may have
   * been written into the URI in any of them.
   */
  const expectUnrecoverable = (redacted: string, secret: string, label: string): void => {
    const forms = recoverableForms(redacted);
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
            `appears in the reading ${JSON.stringify(form)} of ${JSON.stringify(redacted)}`,
        ).toBe(false);
      }
    }
  };

  const MATRIX: ReadonlyArray<{
    label: string;
    input: string;
    secrets: readonly string[];
    preserved: readonly string[];
  }> = [
    {
      label: 'password-only userinfo',
      input: 'postgresql://:hunter2secret@127.0.0.1:55432/straylight_source',
      secrets: ['hunter2secret'],
      preserved: ['postgresql://', '127.0.0.1', '55432', 'straylight_source'],
    },
    {
      label: 'mixed user and password userinfo',
      input: 'postgresql://appuser:hunter2secret@127.0.0.1:55432/straylight_source',
      secrets: ['hunter2secret', 'appuser'],
      preserved: ['postgresql://', '127.0.0.1', '55432', 'straylight_source'],
    },
    {
      label: 'credential ONLY in a query parameter',
      input: `${SOURCE_ORIGIN}/straylight_source?password=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', '55432', 'straylight_source', 'password='],
    },
    {
      label: 'percent-encoded credential value',
      input: `${SOURCE_ORIGIN}/straylight_source?password=p%40ss%3Aw%2Frd`,
      secrets: ['p%40ss%3Aw%2Frd', 'p@ss:w/rd'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'UPPERCASE parameter name',
      input: `${SOURCE_ORIGIN}/straylight_source?PASSWORD=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'Capitalised parameter name',
      input: `${SOURCE_ORIGIN}/straylight_source?Password=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'multiple credential parameters in one URI',
      input:
        `${SOURCE_ORIGIN}/straylight_source?password=firstsecret&passwd=secondsecret&pgpassword=thirdsecret`,
      secrets: ['firstsecret', 'secondsecret', 'thirdsecret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'credential parameter FIRST',
      input:
        `${SOURCE_ORIGIN}/straylight_source?password=hunter2secret&application_name=straylight&connect_timeout=5`,
      secrets: ['hunter2secret'],
      preserved: ['application_name=straylight', 'connect_timeout=5'],
    },
    {
      label: 'credential parameter MIDDLE',
      input:
        `${SOURCE_ORIGIN}/straylight_source?application_name=straylight&password=hunter2secret&connect_timeout=5`,
      secrets: ['hunter2secret'],
      preserved: ['application_name=straylight', 'connect_timeout=5'],
    },
    {
      label: 'credential parameter LAST',
      input:
        `${SOURCE_ORIGIN}/straylight_source?application_name=straylight&connect_timeout=5&password=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['application_name=straylight', 'connect_timeout=5'],
    },
    {
      label: 'SSL key material and its passphrase',
      input:
        `${SOURCE_ORIGIN}/straylight_source?sslkey=/keys/privatesecret.pem&sslpassword=hunter2secret&sslmode=require`,
      secrets: ['/keys/privatesecret.pem', 'hunter2secret'],
      preserved: ['sslmode=require', 'straylight_source'],
    },
    {
      label: 'userinfo AND query parameter together, with a fragment',
      input: 'postgresql://appuser:firstsecret@127.0.0.1:55432/straylight_source?password=secondsecret#note',
      secrets: ['firstsecret', 'secondsecret', 'appuser'],
      preserved: ['127.0.0.1', 'straylight_source', '#note'],
    },
    // ── ENCODED PARAMETER NAMES (sequence-89 F-04) ──────────────────────────
    //
    // The sequence-89 audit demonstrated that the credential decision was made
    // on the RAW parameter name while `pg` decides on the DECODED one, so
    // `pass%77ord` reached a diagnostic verbatim. Each case below is a name the
    // connection parser HONOURS as a credential; the parser-agreement test
    // further down proves that agreement mechanically rather than by assertion.
    {
      label: 'ENCODED parameter name (pass%77ord)',
      input: `${SOURCE_ORIGIN}/straylight_source?pass%77ord=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'ENCODED parameter name, first letter (p%61ssword)',
      input: `${SOURCE_ORIGIN}/straylight_source?p%61ssword=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'ENCODED parameter name, UPPERCASE escape (PASS%57ORD)',
      input: `${SOURCE_ORIGIN}/straylight_source?PASS%57ORD=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'ENCODED parameter name, mixed case + escape (PaSs%77oRd)',
      input: `${SOURCE_ORIGIN}/straylight_source?PaSs%77oRd=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'ENCODED sslpassword name (sslp%61ssword)',
      input: `${SOURCE_ORIGIN}/straylight_source?sslp%61ssword=hunter2secret&sslmode=require`,
      secrets: ['hunter2secret'],
      preserved: ['sslmode=require', 'straylight_source'],
    },
    {
      label: 'ENCODED name mid-query, non-credential parameters preserved',
      input: `${SOURCE_ORIGIN}/straylight_source?application_name=straylight&pass%77ord=hunter2secret&connect_timeout=5`,
      secrets: ['hunter2secret'],
      preserved: ['application_name=straylight', 'connect_timeout=5'],
    },
    {
      label: 'FULLY ENCODED credential name (%70%61%73%73%77%6Frd)',
      input: `${SOURCE_ORIGIN}/straylight_source?%70%61%73%73%77%6Frd=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    // ── NORMALIZED PARAMETER NAMES (sequence-95 F-04) ───────────────────────
    //
    // The sequence-95 audit demonstrated the NEXT divergence: the fix for the
    // cases above decided on `decodeURIComponent(rawName)`, but the parser
    // builds a WHATWG `URL` first, and URL parsing STRIPS tab, LF and CR BEFORE
    // anything is decoded. So a bare control character inside a credential name
    // normalizes AWAY at the parser and the value is honoured as the credential,
    // while a decode-only decision sees an unrecognised name and prints it.
    // These are Codex's three counterexamples, as cases.
    {
      label: 'NORMALIZED name, bare LF inside the credential name',
      input: `${SOURCE_ORIGIN}/straylight_source?pass\nword=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'NORMALIZED name, bare TAB inside the credential name',
      input: `${SOURCE_ORIGIN}/straylight_source?pass\tword=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'NORMALIZED name, bare CR inside the credential name',
      input: `${SOURCE_ORIGIN}/straylight_source?pass\rword=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'NORMALIZED name, control character AND an escape (P%61ss\nWORD)',
      input: `${SOURCE_ORIGIN}/straylight_source?P%61ss\nWORD=hunter2secret`,
      secrets: ['hunter2secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'NORMALIZED name mid-query, non-credential parameters preserved',
      input: `${SOURCE_ORIGIN}/straylight_source?application_name=straylight&pgpass\rword=hunter2secret&connect_timeout=5`,
      secrets: ['hunter2secret'],
      preserved: ['application_name=straylight', 'connect_timeout=5'],
    },
    // ── FORM-DECODED CREDENTIAL VALUES (sequence-104 F-04) ──────────────────
    //
    // The sequence-104 counterexample. `+` is a SPACE to `URLSearchParams`, so
    // the parser hands `pg` the credential `hunter 2 secret` — and a redaction
    // that removed only that decoded spelling left the literal
    // `hunter+2+secret` in the text, which is the same credential to anyone who
    // reads the query the way the query is read. The second case repeats it
    // where the credential ALSO appears under a non-credential parameter name,
    // which is what forces the whole query to be withheld rather than rewritten
    // parameter by parameter.
    {
      label: 'FORM-DECODED credential value (+ is a space)',
      input: `${SOURCE_ORIGIN}/straylight_source?password=hunter+2+secret`,
      secrets: ['hunter+2+secret', 'hunter 2 secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'FORM-DECODED value repeated under a NON-credential name',
      input: `${SOURCE_ORIGIN}/straylight_source?password=hunter+2+secret&application_name=hunter+2+secret`,
      secrets: ['hunter+2+secret', 'hunter 2 secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
    {
      label: 'FORM-DECODED value under a percent-encoded credential name',
      input: `${SOURCE_ORIGIN}/straylight_source?pass%77ord=hunter+2+secret`,
      secrets: ['hunter+2+secret', 'hunter 2 secret'],
      preserved: ['127.0.0.1', 'straylight_source'],
    },
  ];

  for (const entry of MATRIX) {
    it(`redacts every secret and preserves non-secret detail: ${entry.label}`, () => {
      const out = redactConnectionString(entry.input);
      for (const secret of entry.secrets) expectUnrecoverable(out, secret, entry.label);
      for (const keep of entry.preserved) {
        expect(out.includes(keep), `${entry.label}: lost non-secret detail ${keep} from ${out}`).toBe(
          true,
        );
      }
      // A diagnostic must still say something was hidden.
      expect(out).toContain('<redacted>');
    });
  }

  // ── THE SEQUENCE-104 COUNTEREXAMPLES, AS A SINGLE NAMED PROOF ────────────
  //
  // The packet requires each rejected abstraction to be shown FAILING against
  // the substrate and PASSING here. This is the F-04 one, and it is written so
  // that a substrate run fails on the DEFECT: it asks the real parser what
  // credential the input yields, then asserts that credential is unrecoverable
  // from the diagnostic under every reading. Against the substrate the first
  // case leaks `hunter+2+secret` verbatim (its decoder list had no form
  // decoding) and the second prints `leakedsecret` under an undecodable name
  // (its alignment check had no uncertainty rule), so both fail HERE, on the
  // recoverability assertion, and neither passes on the defect.
  it('COUNTEREXAMPLE (F-04): a form-decoded credential and an undecodable credential name cannot leak', async () => {
    const { parse } = await import('pg-connection-string');

    // (i) FORM DECODING. The parser derives `hunter 2 secret`; the text contains
    // `hunter+2+secret`. They are the SAME credential, read two ways.
    const formInput = `${SOURCE_ORIGIN}/straylight_source?password=hunter+2+secret&application_name=hunter+2+secret`;
    const formParsed = parse(formInput) as unknown as Record<string, unknown>;
    expect(
      formParsed['password'],
      'the parser must really form-decode the credential, or this proves nothing',
    ).toBe('hunter 2 secret');
    const formOut = redactConnectionString(formInput);
    expectUnrecoverable(formOut, 'hunter 2 secret', 'F-04 counterexample: parser-derived form');
    expectUnrecoverable(formOut, 'hunter+2+secret', 'F-04 counterexample: as-written form');
    // Stated once more the way the audit stated it, so the failure names the
    // reading rather than a generic containment check.
    expect(
      [...new URLSearchParams(querySpan(formOut)).values()].includes('hunter 2 secret'),
      `URLSearchParams recovers the credential from ${JSON.stringify(formOut)}`,
    ).toBe(false);
    // Fail closed is not fail silent: the target is still named.
    expect(formOut).toContain('<redacted>');
    expect(formOut).toContain('straylight_source');
    expect(formOut).toContain('127.0.0.1');

    // (ii) AN UNDECODABLE CREDENTIAL-SHAPED NAME. `%ZZ` is not an escape, so the
    // parser cannot fold the name to `password` and `pg` receives no credential
    // from it — but what a READER receives is not decidable here, so the value
    // must not be recoverable IN ANY FORM. Unproven must not mean printed.
    const malformedInput = `${SOURCE_ORIGIN}/straylight_source?pass%ZZword=leakedsecret`;
    const malformedOut = redactConnectionString(malformedInput);
    expectUnrecoverable(malformedOut, 'leakedsecret', 'F-04 counterexample: undecodable name');
    expect(malformedOut).toContain('<redacted>');
    expect(malformedOut).toContain('straylight_source');
    // …and the same input must not throw on a diagnostic path.
    expect(() => redactConnectionString(malformedInput)).not.toThrow();
  });

  // ── THE SEQUENCE-95 REPRODUCTION, STATED AGAINST THE REAL PARSER ─────────
  //
  // This is the NAMED proof the structural mutation must break. It does not
  // assert that a control character is handled; it asserts the PROPERTY: the
  // real parser is asked what credential it derives, and that exact value must
  // be absent from the redaction. Run against the substrate implementation —
  // or against any reintroduction of a decode-only decision — it FAILS here,
  // because `pg` receives the credential and the redactor prints it.
  it('SEQUENCE-95 REPRODUCTION: a bare LF, TAB or CR inside a credential name cannot leak', async () => {
    const { parse } = await import('pg-connection-string');
    const CRED_VALUE = 'hunter2secret';
    const controls: ReadonlyArray<{ label: string; ch: string }> = [
      { label: 'bare LF', ch: '\n' },
      { label: 'bare TAB', ch: '\t' },
      { label: 'bare CR', ch: '\r' },
    ];
    let honoured = 0;
    for (const { label, ch } of controls) {
      for (const name of ['password', 'passwd', 'pgpassword', 'sslpassword']) {
        // The control character goes INSIDE the name, at every interior split.
        for (let at = 1; at < name.length; at += 1) {
          const spelling = `${name.slice(0, at)}${ch}${name.slice(at)}`;
          const uri = `${SOURCE_ORIGIN}/straylight_source?${spelling}=${CRED_VALUE}`;
          // WHAT DOES THE REAL PARSER DO? The obligation exists only where the
          // parser actually derives the credential, so this is asked, never
          // assumed.
          const parsed = parse(uri) as unknown as Record<string, unknown>;
          const derives = Object.entries(parsed).some(
            ([key, value]) =>
              CREDENTIAL_KEYS.includes(key.toLowerCase()) && value === CRED_VALUE,
          );
          if (!derives) continue;
          honoured += 1;
          const out = redactConnectionString(uri);
          expectUnrecoverable(out, CRED_VALUE, `PARSER DISAGREEMENT (${label} in ${name})`);
        }
      }
    }
    // Non-vacuity: if the parser stopped normalizing these away, this test would
    // silently assert nothing. The counterexamples must really be honoured.
    expect(honoured, 'the parser must actually honour the control-character names').toBeGreaterThan(
      15,
    );
  });

  // ── THE GENERATED SEEK-DISAGREEMENT PROOF ────────────────────────────────
  //
  // The sequence-89, sequence-95 and sequence-104 audits each rejected a fix
  // that enumerates spellings, and each was vindicated by the NEXT spelling. So
  // this proof does not enumerate: it GENERATES inputs by composing the
  // transformations that have historically produced divergence, asks the REAL
  // parser what credential each one yields, and asserts that value is
  // unrecoverable from the redaction under the whole decoding family.
  //
  // The oracle is `pg-connection-string` itself — not a local helper sharing the
  // implementation's assumptions, which is exactly the mistake under audit. A
  // helper that agreed with the implementation would agree with its bugs too.
  //
  // Every transformation class is COUNTED, and each required one must be
  // honoured by the parser AS A QUERY CREDENTIAL at least once. Counting query
  // delivery rather than "the parser produced some credential" matters: two of
  // the three heads carry a userinfo password, which would otherwise let every
  // class claim coverage it never earned.
  //
  // ── WHAT THIS GENERATOR DOES NOT MODEL ───────────────────────────────────
  //
  // Stated so the coverage claim has a boundary. It composes case folding,
  // percent encoding (including escape-case and fully encoded names), CR/LF/TAB
  // normalization, `+` in names and values, malformed `%ZZ` escapes in names,
  // values and neighbouring parameters, duplicate credential parameters in both
  // roles, the credential value REPEATED UNDER A NON-CREDENTIAL NAME, three
  // authority shapes and a fragment. It does NOT model: non-ASCII
  // or IDNA host forms; overlong or surrogate UTF-8 percent sequences; `%00`;
  // credentials arriving through `PG*` environment variables or a service file;
  // libpq keyword/value (non-URI) connection strings; `pgpassfile` contents;
  // unix-socket paths; `postgres://` vs `postgresql://` scheme divergence; nor
  // any transformation applied by a LATER version of `pg-connection-string` than
  // the one this tree pins. Those are limits of the generator, not claims about
  // them; `NOT_MODELLED` below is printed in the non-vacuity failure messages so
  // the boundary travels with the evidence.
  it('SEEK-DISAGREEMENT: no generated input makes the parser derive a credential the redactor prints', async () => {
    const { parse } = await import('pg-connection-string');
    const CRED_VALUE = 'hunter2secret';
    const NOT_MODELLED =
      'non-ASCII/IDNA hosts, overlong or surrogate UTF-8 escapes, %00, PG* environment ' +
      'variables, service files, libpq keyword/value strings, pgpassfile contents, ' +
      'unix-socket paths, and any newer pg-connection-string';

    type Tagged = { readonly text: string; readonly classes: readonly string[] };
    const hex = (ch: string, upper: boolean): string => {
      const h = ch.charCodeAt(0).toString(16).padStart(2, '0');
      return `%${upper ? h.toUpperCase() : h}`;
    };

    // CASE — the query is case-preserving, so `PASSWORD` and `PaSsWoRd` reach
    // the parser unchanged and only the option lookup folds them.
    const caseOps: ReadonlyArray<(n: string) => Tagged> = [
      (n) => ({ text: n, classes: [] }),
      (n) => ({ text: n.toUpperCase(), classes: ['mixed-case'] }),
      (n) => ({ text: n[0]!.toUpperCase() + n.slice(1), classes: ['mixed-case'] }),
      (n) => ({
        text: [...n].map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c)).join(''),
        classes: ['mixed-case'],
      }),
    ];

    // PERCENT ENCODING — the sequence-89 class. First, middle and last letter
    // (the middle one with an UPPERCASE escape, since escape case is itself a
    // spelling), plus the fully encoded name.
    const encodeOps = (n: string): Tagged[] => {
      const mid = Math.floor(n.length / 2);
      const at = (i: number, upper: boolean): Tagged => ({
        text: n.slice(0, i) + hex(n[i]!, upper) + n.slice(i + 1),
        classes: ['percent-encoding'],
      });
      return [
        { text: n, classes: [] },
        at(0, false),
        at(mid, true),
        at(n.length - 1, false),
        { text: [...n].map((c) => hex(c, false)).join(''), classes: ['percent-encoding'] },
      ];
    };

    // NORMALIZATION AND SEPARATORS — inserted INSIDE the name. CR/LF/TAB are the
    // sequence-95 class; `+` and a malformed escape are the neighbouring
    // transformations a decode-only decision confuses with them, and the proof
    // must be told apart from them by the parser, not by us. Neither is honoured
    // as a credential name — `pass+word` is `pass word` to the parser and
    // `pass%ZZword` cannot be folded at all — so both are tracked as
    // FAIL-CLOSED classes below rather than as honoured ones.
    const insertOps: ReadonlyArray<{ ch: string; klass: string }> = [
      { ch: '', klass: '' },
      { ch: '\n', klass: 'lf-normalization' },
      { ch: '\r', klass: 'cr-normalization' },
      { ch: '\t', klass: 'tab-normalization' },
      { ch: '+', klass: 'plus-in-name' },
      { ch: '%ZZ', klass: 'malformed-name' },
    ];

    const spellings = (name: string): Tagged[] => {
      const seen = new Set<string>();
      const out: Tagged[] = [];
      for (const caseOp of caseOps) {
        const cased = caseOp(name);
        for (const encoded of encodeOps(cased.text)) {
          for (const insert of insertOps) {
            // Insert at an interior position so the name is still recognisably
            // the credential name the parser may normalize back to.
            const at = Math.max(1, Math.floor(encoded.text.length / 2));
            const text =
              insert.ch === ''
                ? encoded.text
                : encoded.text.slice(0, at) + insert.ch + encoded.text.slice(at);
            if (seen.has(text)) continue;
            seen.add(text);
            const classes = [
              ...cased.classes,
              ...encoded.classes,
              ...(insert.klass ? [insert.klass] : []),
            ];
            out.push({ text, classes });
          }
        }
      }
      return out;
    };

    // VALUE FORMS — the parser DECODES values, so the decoded form is what `pg`
    // receives and what must not survive. `+` becomes a space at the parser:
    // that is the sequence-104 class, and the value's AS-WRITTEN spelling is
    // sought too, because `expectUnrecoverable` looks for both.
    const valueForms: ReadonlyArray<Tagged> = [
      { text: CRED_VALUE, classes: [] },
      { text: CRED_VALUE.replace(/e/g, '%65'), classes: ['encoded-credential-value'] },
      { text: encodeURIComponent('p@ss:w/rd'), classes: ['encoded-credential-value'] },
      { text: 'hunter+2+secret', classes: ['plus-handling'] },
      { text: `${CRED_VALUE}%ZZ`, classes: ['malformed-value'] },
    ];

    // TAILS — what else is in the query. `&x=v%ZZ` puts a malformed escape in a
    // DIFFERENT parameter, which forces the parser to pre-encode the WHOLE
    // string and so rewrites every name; the duplicate tails exercise the
    // last-wins trap in both roles, with the earlier value in the LOSING role.
    //
    // The LAST tail is the sequence-104 leak shape itself, generated rather than
    // enumerated: the SAME value the credential parameter carries, repeated under
    // a name that is NOT a credential. Redacting by name cannot reach it — the
    // second parameter is `application_name`, which a diagnostic should print —
    // so it is reachable only by the value-level post-condition, and only if that
    // post-condition reads the candidate the way the parser does. Without this
    // shape the generator would exercise the whole decoding family and still
    // never observe the leak, because blanking the credential parameter's own
    // value hides a weak decoder's failure. With it, the generator fails on a
    // decoder list.
    const tails = (spelling: string, value: string): ReadonlyArray<Tagged> => [
      { text: '', classes: [] },
      { text: '&application_name=straylight', classes: [] },
      { text: '&x=v%ZZ', classes: ['foreign-malformed-escape'] },
      { text: '#note', classes: [] },
      { text: '&password=laterwins', classes: ['duplicate-parameters'] },
      { text: `&${spelling}=laterwins`, classes: ['duplicate-parameters'] },
      { text: `&application_name=${value}`, classes: ['value-echoed-under-noncredential-name'] },
    ];

    const heads: readonly string[] = [
      `${SOURCE_ORIGIN}/straylight_source?`,
      `${SCHEME}appuser:firstsecret@127.0.0.1:55432/straylight_source?`,
      `${SCHEME}127.0.0.1/straylight_source?`,
    ];

    // Classes that must be HONOURED — the parser must really deliver a query
    // credential under them at least once, or the coverage was not proven.
    const REQUIRED_HONOURED: readonly string[] = [
      'mixed-case',
      'percent-encoding',
      'lf-normalization',
      'cr-normalization',
      'tab-normalization',
      'plus-handling',
      'duplicate-parameters',
      'value-echoed-under-noncredential-name',
      'encoded-credential-value',
      'malformed-value',
      'foreign-malformed-escape',
      'interaction',
    ];
    // Classes the parser does NOT honour as credential names. The obligation for
    // them is the OTHER one the packet states: malformed or ambiguous
    // credential-shaped query input must fail closed. `plus-in-name` is excluded
    // deliberately — `pass+word` is `pass word` to the parser, unambiguously not
    // a credential, and inventing a rule for it is the spelling list the audit
    // rejected. It is generated, and the only obligation asserted for it is that
    // the redactor does not throw.
    const REQUIRED_FAIL_CLOSED: readonly string[] = ['malformed-name'];

    const honouredByClass = new Map<string, number>();
    const failedClosedByClass = new Map<string, number>();
    const bump = (map: Map<string, number>, klass: string): void =>
      void map.set(klass, (map.get(klass) ?? 0) + 1);

    let checked = 0;
    let honoured = 0;
    let refusedByParser = 0;
    let failedClosed = 0;

    for (const name of CREDENTIAL_KEYS) {
      for (const spelling of spellings(name)) {
        for (const value of valueForms) {
          for (const tail of tails(spelling.text, value.text)) {
            for (const head of heads) {
              const uri = `${head}${spelling.text}=${value.text}${tail.text}`;
              checked += 1;
              const classes = [...spelling.classes, ...value.classes, ...tail.classes];

              // ASK THE PARSER. When it refuses the input outright, `pg` never
              // receives a credential from it, so the decisive property imposes
              // no obligation — but the redactor must still not throw, which is
              // asserted here rather than deferred.
              let parsed: Record<string, unknown>;
              try {
                parsed = parse(uri) as unknown as Record<string, unknown>;
              } catch {
                refusedByParser += 1;
                expect(() => redactConnectionString(uri)).not.toThrow();
                continue;
              }

              // THE ORACLE: every value the parser placed under a name `pg`
              // treats as a credential. Derived from the parser's own output —
              // never recomputed here.
              const derived = Object.entries(parsed)
                .filter(
                  ([key, v]) =>
                    CREDENTIAL_KEYS.includes(key.toLowerCase()) &&
                    typeof v === 'string' &&
                    v.length > 0,
                )
                .map(([, v]) => v as string);

              // WHICH of those came from THIS QUERY rather than from the head's
              // userinfo. Only query delivery earns a class its coverage.
              const fromQuery = new Set<string>(['laterwins', value.text]);
              try {
                fromQuery.add(decodeURIComponent(value.text.replace(/\+/g, ' ')));
              } catch {
                fromQuery.add(value.text.replace(/\+/g, ' '));
              }
              const deliveredByQuery = derived.some((v) => fromQuery.has(v));

              if (derived.length === 0) {
                // NOT HONOURED. For a malformed credential-shaped name the
                // packet's other obligation applies: fail closed. The value must
                // still be unrecoverable, and the redactor must not throw.
                let out = '';
                expect(() => {
                  out = redactConnectionString(uri);
                }, `redaction threw on ${JSON.stringify(uri)}`).not.toThrow();
                if (spelling.classes.includes('malformed-name')) {
                  failedClosed += 1;
                  bump(failedClosedByClass, 'malformed-name');
                  expectUnrecoverable(
                    out,
                    value.text,
                    `FAIL-CLOSED VIOLATION: undecodable credential-shaped name in ` +
                      `${JSON.stringify(uri)}`,
                  );
                }
                continue;
              }

              honoured += 1;
              if (deliveredByQuery) {
                for (const klass of new Set(classes)) bump(honouredByClass, klass);
                // Two or more independent transformations at once — the
                // INTERACTION requirement, counted only when it really happened.
                if (new Set(classes).size > 1) bump(honouredByClass, 'interaction');
              }

              const out = redactConnectionString(uri);
              for (const credential of derived) {
                expectUnrecoverable(
                  out,
                  credential,
                  `PARSER DISAGREEMENT: pg derives a credential from ${JSON.stringify(uri)} ` +
                    `(classes: ${classes.join(', ') || 'none'})`,
                );
              }
            }
          }
        }
      }
    }

    // NON-VACUITY. A generator that produced nothing, or inputs the parser never
    // honours, would assert nothing at all and pass.
    expect(
      checked,
      `the generator must produce a substantial input set. NOT MODELLED: ${NOT_MODELLED}`,
    ).toBeGreaterThan(5_000);
    expect(
      honoured,
      `the parser must honour a substantial share of them. NOT MODELLED: ${NOT_MODELLED}`,
    ).toBeGreaterThan(1_000);
    expect(refusedByParser, 'parser-refused inputs must also have been exercised').toBeGreaterThan(
      0,
    );
    expect(
      failedClosed,
      'undecodable credential-shaped names must have been exercised on the fail-closed path',
    ).toBeGreaterThan(0);
    // And every required transformation class must have been HONOURED AS A QUERY
    // CREDENTIAL — not merely generated. This is what makes the coverage claim
    // checkable.
    for (const klass of REQUIRED_HONOURED) {
      expect(
        honouredByClass.get(klass) ?? 0,
        `transformation class ${klass} was never honoured by the parser as a query ` +
          `credential, so it was not proven. NOT MODELLED: ${NOT_MODELLED}`,
      ).toBeGreaterThan(0);
    }
    for (const klass of REQUIRED_FAIL_CLOSED) {
      expect(
        failedClosedByClass.get(klass) ?? 0,
        `transformation class ${klass} was never exercised on the fail-closed path`,
      ).toBeGreaterThan(0);
    }
  });

  // ── THE DUPLICATE TRAP ───────────────────────────────────────────────────
  //
  // `searchParams` is last-wins for the parser's `config[name] = value` loop, so
  // `?pass<LF>word=A&password=B` yields B — and it is tempting to conclude that
  // A, having lost, is therefore ordinary text. It is not: A is still a
  // credential someone wrote into the connection string, and it is still in the
  // raw text the diagnostic would print. Both values are asserted unrecoverable,
  // with both spelled out here by construction rather than read back from a
  // helper, and the form-decoded pair covers a LOSING value that is only the
  // same credential once `+` is read as a space.
  it('DUPLICATE TRAP: an EARLIER credential value does not leak because a later duplicate wins', async () => {
    const { parse } = await import('pg-connection-string');
    const EARLIER = 'earlierpassvalue';
    const LATER = 'laterpassvalue';
    const cases: readonly string[] = [
      `${SOURCE_ORIGIN}/straylight_source?password=${EARLIER}&password=${LATER}`,
      `${SOURCE_ORIGIN}/straylight_source?pass\nword=${EARLIER}&password=${LATER}`,
      `${SOURCE_ORIGIN}/straylight_source?pass%77ord=${EARLIER}&PASSWORD=${LATER}`,
      `${SOURCE_ORIGIN}/straylight_source?password=${EARLIER}&pass\tword=${LATER}`,
      `${SOURCE_ORIGIN}/straylight_source?pgpassword=${EARLIER}&pgpass\rword=${LATER}`,
    ];
    for (const uri of cases) {
      // The parser really is last-wins here, so the trap is real rather than
      // hypothetical.
      const parsed = parse(uri) as unknown as Record<string, unknown>;
      const derived = Object.entries(parsed)
        .filter(([key]) => CREDENTIAL_KEYS.includes(key.toLowerCase()))
        .map(([, v]) => v);
      expect(derived, `${uri}: the parser must derive the LATER value`).toContain(LATER);

      const out = redactConnectionString(uri);
      expectUnrecoverable(out, LATER, `duplicate winner in ${uri}`);
      expectUnrecoverable(out, EARLIER, `duplicate LOSER in ${uri}`);
    }

    // The same trap where the two spellings differ only by FORM ENCODING, so the
    // losing value is recoverable from the winning one's reading and vice versa.
    const formCases: ReadonlyArray<{ uri: string; winner: string; loser: string }> = [
      {
        uri: `${SOURCE_ORIGIN}/straylight_source?password=first+lost+secret&password=second+won+secret`,
        winner: 'second won secret',
        loser: 'first lost secret',
      },
      {
        uri: `${SOURCE_ORIGIN}/straylight_source?pass%77ord=first+lost+secret&password=second+won+secret`,
        winner: 'second won secret',
        loser: 'first lost secret',
      },
    ];
    for (const { uri, winner, loser } of formCases) {
      const parsed = parse(uri) as unknown as Record<string, unknown>;
      expect(parsed['password'], `${uri}: the parser must form-decode the winner`).toBe(winner);
      const out = redactConnectionString(uri);
      expectUnrecoverable(out, winner, `form-decoded duplicate WINNER in ${uri}`);
      expectUnrecoverable(out, loser, `form-decoded duplicate LOSER in ${uri}`);
    }
  });

  it('MALFORMED input FAILS CLOSED — it redacts rather than throwing or echoing', () => {
    const malformed: ReadonlyArray<{ input: string; secret?: string }> = [
      { input: '' },
      { input: 'not-a-uri-at-all' },
      { input: SCHEME },
      // EMPTY AUTHORITY: no host at all, credential in the query.
      { input: `${SCHEME}@/db?password=leakedsecret`, secret: 'leakedsecret' },
      // TRUNCATED: the `@` that would have delimited userinfo is gone, so the
      // userinfo rule alone would leave `user:password` in the clear.
      { input: `${SCHEME}appuser:hunter2secret`, secret: 'hunter2secret' },
      { input: `${SCHEME}appuser:hunter2secret@`, secret: 'hunter2secret' },
      { input: '://:@?password=leakedsecret', secret: 'leakedsecret' },
      { input: `${SOURCE_ORIGIN}/db?password`, secret: undefined },
      { input: `${SOURCE_ORIGIN}/db?password=`, secret: undefined },
      // UNDECODABLE NAME (%ZZ): the name cannot be interpreted, so it cannot be
      // cleared. Unproven must not mean printed.
      { input: `${SOURCE_ORIGIN}/db?pass%ZZword=leakedsecret`, secret: 'leakedsecret' },
      { input: `${SOURCE_ORIGIN}/db?password=leaked%ZZsecret`, secret: 'leaked%ZZsecret' },
      // UNALIGNABLE QUERY: a segment that normalizes away to nothing, and a
      // fragment inside the query, so the raw segments and the parser's entries
      // no longer correspond one-to-one.
      { input: `${SOURCE_ORIGIN}/db?\r=1&\n&=leakedsecret`, secret: undefined },
      { input: `${SOURCE_ORIGIN}/db?password=leakedsecret#a?b=c`, secret: 'leakedsecret' },
      // SPACE forces the parser to pre-encode the whole string.
      { input: `${SOURCE_ORIGIN}/db?pass word=leakedsecret`, secret: undefined },
      // FORM-DECODED credential in a malformed authority, and a credential whose
      // decoded form differs from its written form under an undecodable name.
      { input: `${SCHEME}@/db?password=leaked+secret`, secret: 'leaked secret' },
      { input: `${SOURCE_ORIGIN}/db?pass%ZZword=leaked+secret`, secret: 'leaked+secret' },
    ];
    for (const { input, secret } of malformed) {
      let out = '';
      expect(() => {
        out = redactConnectionString(input);
      }, `redaction threw on ${JSON.stringify(input)}`).not.toThrow();
      expect(typeof out).toBe('string');
      if (secret !== undefined) {
        expectUnrecoverable(out, secret, `malformed ${JSON.stringify(input)}`);
      }
    }
  });

  it('an UNALIGNABLE query WITHHOLDS the query rather than guessing which span is the credential', () => {
    // The fail-closed branch, observed rather than asserted about. When the
    // parser's entries cannot be paired with the raw segments, no rewrite can
    // know WHICH span carries the credential — so the whole query goes.
    const out = redactConnectionString(`${SOURCE_ORIGIN}/straylight_source?\r=1&\n&=hunter2secret`);
    expect(out.includes('hunter2secret'), `unalignable query leaked: ${out}`).toBe(false);
    expect(out).toContain('<redacted>');
    // It still names its target — withholding the query is not erasing the URI.
    expect(out).toContain('127.0.0.1');
    expect(out).toContain('straylight_source');
  });

  it('a NON-STRING target fails closed with a type report, not an interpolated value', () => {
    // Reachable from untyped JavaScript callers. It must not throw on the
    // diagnostic path and must not stringify an object that might carry a
    // credential.
    for (const value of [undefined, null, 42, { connectionString: 'hunter2secret' }]) {
      let out = '';
      expect(() => {
        out = redactConnectionString(value as never);
      }).not.toThrow();
      expect(out).toContain('<redacted>');
      expect(out.includes('hunter2secret')).toBe(false);
    }
  });

  it('a VALID loopback target with no credential is passed through unchanged', () => {
    // The redactor must not mangle what it has nothing to hide. Without this,
    // "redact everything" would satisfy every absence assertion above.
    for (const safe of [
      `${SOURCE_ORIGIN}/straylight_source`,
      `${SCHEME}localhost/db`,
      `${SCHEME}[::1]:55432/db`,
      `${SOURCE_ORIGIN}/db?application_name=straylight&connect_timeout=5`,
      `${SOURCE_ORIGIN}/db?sslmode=verify-full&connect_timeout=5`,
    ]) {
      expect(redactConnectionString(safe)).toBe(safe);
    }
  });

  it('DIAGNOSTIC REACHABILITY: the store’s own target description carries no query-parameter credential', async () => {
    // The finding is only closed if the redaction is what actually reaches an
    // operator-visible surface. `describeTarget()` is that surface — it is what
    // every PostgresUnavailableError message interpolates.
    const host = new PostgresEstateHost({
      connectionString:
        'postgresql://appuser:firstsecret@127.0.0.1:55432/straylight_source?password=secondsecret&application_name=straylight',
    });
    try {
      const described = host.describeTarget();
      expectUnrecoverable(described, 'firstsecret', 'describeTarget');
      expectUnrecoverable(described, 'secondsecret', 'describeTarget');
      expectUnrecoverable(described, 'appuser', 'describeTarget');
      expect(described).toContain('<redacted>');
      // Still names its target, which is the point of a diagnostic.
      expect(described).toContain('127.0.0.1');
      expect(described).toContain('straylight_source');
    } finally {
      await host.close();
    }
  });

  it('DIAGNOSTIC REACHABILITY: a NORMALIZED credential name is redacted at describeTarget() too', async () => {
    // The sequence-95 counterexample, carried all the way to the operator-facing
    // surface rather than stopping at the pure function.
    const host = new PostgresEstateHost({
      connectionString: `${SOURCE_ORIGIN}/straylight_source?pass\nword=secondsecret&application_name=straylight`,
    });
    try {
      const described = host.describeTarget();
      expectUnrecoverable(described, 'secondsecret', 'describeTarget normalized name');
      expect(described).toContain('<redacted>');
      expect(described).toContain('straylight_source');
    } finally {
      await host.close();
    }
  });

  it('DIAGNOSTIC REACHABILITY: a FORM-DECODED credential is redacted at describeTarget() too', async () => {
    // The sequence-104 counterexample at the operator-facing surface.
    const host = new PostgresEstateHost({
      connectionString: `${SOURCE_ORIGIN}/straylight_source?password=hunter+2+secret&application_name=straylight`,
    });
    try {
      const described = host.describeTarget();
      expectUnrecoverable(described, 'hunter 2 secret', 'describeTarget form-decoded');
      expectUnrecoverable(described, 'hunter+2+secret', 'describeTarget form-encoded');
      expect(described).toContain('<redacted>');
      expect(described).toContain('straylight_source');
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

    // THE F-01 BLOCK — 81 lines, wherever it now begins.
    const f01Start = lines.findIndex((line) => line.startsWith("describe('Phase 50A F-01"));
    expect(f01Start, 'the F-01 block must still be present').toBeGreaterThan(0);
    const f01 = lines.slice(f01Start, f01Start + 81).join('\n') + '\n';
    expect(Buffer.byteLength(f01, 'utf8'), 'F-01 block byte count').toBe(4308);
    expect(sha(f01), 'F-01 block digest').toBe(
      '43cfce3c3920d94bb4305780ef5f550d2d337865fdc7f303b3b5e3dba7f0bf70',
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

  it('PRESERVATION: config.ts exports exactly the audited surface, unchanged', async () => {
    // F-04 must be closed WITHOUT widening the module's contract. An added
    // export would be a new surface no audit has seen; a removed one would break
    // a call site outside this slice.
    const module = await import('../../src/straylight/storage/postgres/config.js');
    expect(Object.keys(module).sort()).toEqual([
      'SHIPPED_SCHEMA_VERSIONS',
      'redactConnectionString',
      'resolveConfig',
    ]);
    expect(typeof module.redactConnectionString).toBe('function');
    expect(module.redactConnectionString.length, 'signature arity is unchanged').toBe(1);
    expect(module.redactConnectionString.name).toBe('redactConnectionString');
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
  const touched: string[] = [];
  const hostile = {
    describeTarget: (): string => redactConnectionString(sourceHost().connectionString),
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
      return redactConnectionString(sourceHost().connectionString);
    }
  }

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
      [host, hostile, redactConnectionString],
      [host, subclass, redactConnectionString],
      [host, hostile, redactConnectionString, hostile],
      ['source', hostile],
      ['source', hostile, redactConnectionString],
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
      // Close whatever the enumeration legitimately opened. `openBoundProofStore`
      // constructs a real store; the pool is lazy, but the handle is ours.
      for (const value of produced) {
        const store = (value as { store?: unknown } | null)?.store;
        if (store instanceof PostgresEstateHost) await store.close();
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
      // is what a destructive consumer reads.
      expect(isBoundProofStore(genuine)).toBe(true);
      expect(authorizedBoundStore(genuine).store).toBe(genuine.store);
      expect(authorizedBoundStore(genuine).host).toBe(sourceHost());

      // Nothing else is. Each of these is a shape a caller can actually build.
      const rejected: ReadonlyArray<{ label: string; value: unknown }> = [
        { label: 'a self-describing imitation', value: { host: sourceHost(), store: hostile } },
        { label: 'a subclass with an overridden description', value: { host: sourceHost(), store: subclass } },
        { label: 'a bare store handle', value: genuine.store },
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
      await genuine.store.close();
      await subclass.close();
    }
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

  /**
   * Statement forms that MUST NOT be certified read-only.
   *
   * Deliberately mixed: named destructive DDL/DML, state-reducing statements that
   * no keyword list would have called destructive (`SET`, `LOCK`, `SELECT
   * pg_terminate_backend`), a data-modifying CTE whose text begins with `WITH`, a
   * second statement smuggled after a `;`, an anonymous code block, and a
   * `SELECT … INTO`. Under a denylist most of these pass by omission; under a
   * positive grammar they are refused without being enumerated as dangerous,
   * which is why they are listed HERE, in the test, and not in the module.
   */
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
    // as this proof: the SAME readings and the SAME seam, carrying only the real
    // read path, must PASS and exit 0.
    resetRecordedObservations();
    const control = inertClient();
    await observeQueries(control).query('SELECT actor_id FROM actors ORDER BY actor_id');
    const passing = decideVerification(reading, reading, observedQueryProof());
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

  it('the recognition grammar REFUSES BY DEFAULT rather than denying by keyword', async () => {
    const { classifyObservedSql } = await verifierModule();

    // Every hostile form is refused, and the refusal says it was UNRECOGNIZED —
    // not that it matched a list of dangerous words.
    for (const sql of HOSTILE_SQL) {
      const verdict = classifyObservedSql(sql);
      expect(verdict.recognized, `recognized as read-only: ${sql}`).toBe(false);
      if (verdict.recognized) continue;
      expect(verdict.reason).toContain('UNRECOGNIZED');
    }

    // And the module does not classify by denylist. The substrate's classifier was
    // `/\b(?:DROP|TRUNCATE|DELETE|…)\b/i`, whose DEFAULT IS PASS; the alternation
    // must not be back in the executable text. (Comments explain the rejected
    // approach at length, which is why they are blanked first.)
    const code = executableText(readFileSync(resolve(ROOT, VERIFIER), 'utf8'));
    expect(
      /DROP\s*\|\s*TRUNCATE/.test(code),
      'the rejected destructive-keyword denylist is back',
    ).toBe(false);

    // The permitted form is a GRAMMAR, and it admits the real read path's shape.
    expect(classifyObservedSql('SELECT actor_id, record FROM actors').recognized).toBe(true);
    expect(classifyObservedSql('SELECT actor_id FROM actors ORDER BY actor_id ASC').recognized).toBe(
      true,
    );
    // Whitespace and case are the only latitude; anything structural is refused.
    expect(classifyObservedSql('  select   actor_id   from   actors  ').recognized).toBe(true);
    expect(classifyObservedSql('SELECT * FROM actors').recognized).toBe(false);
    expect(classifyObservedSql('SELECT actor_id FROM public.actors').recognized).toBe(false);
    expect(classifyObservedSql('SELECT actor_id FROM actors WHERE actor_id = 1').recognized).toBe(
      false,
    );
    expect(classifyObservedSql('').recognized).toBe(false);
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
    expect(verificationExitCode(decideVerification(reading, reading, proved))).toBe(0);
    expect(verificationExitCode(decideVerification(reading, reading, unproved))).toBe(1);
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
    // The live read path must go THROUGH the seam, not beside it.
    expect(executable).toContain('readStoreSnapshot(observeQueries(client))');

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
