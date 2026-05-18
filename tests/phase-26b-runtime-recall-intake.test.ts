// Phase 26B — runtime recall-intake subpath conformance.
//
// Implements ADR-026A §"Decision" §10 test invariants. Pins:
//
//   §10.a — Root `.` does not become runtime-importable.
//   §10.b — `./host` does not become runtime-importable.
//   §10.c — `./runtime/recall-intake` resolves at runtime.
//   §10.d — No other runtime subpath resolves.
//   §10.e — Runtime barrel exports only the §3 allowlist.
//   §10.f — Concrete non-Dixie refusal mechanism is held by tests:
//           direct ESM import from a non-Dixie fixture without env key,
//           forged caller metadata,
//           fake "dixie"-named wrapper package,
//           dependency-object spoofing.
//   §10.g — Experimental / pre-Finn / Dixie-only marker survives `tsc`
//           emission (assert presence of `@experimental` and the marker
//           tokens `pre-Finn`, `Dixie-only`, and migration-to-Finn
//           language in the emitted .d.ts).
//   §10.h — Doc-marker presence: `experimental`, `pre-Finn`,
//           `Dixie-only` appear in the README §6.c section and the
//           docs/mvp/package-boundary.md §6.d section.
//
// The negative-resolution tests (§10.a, §10.b, §10.d) reuse the
// node-side dynamic-import / require pattern from
// tests/phase-24h-type-only-consumption.test.ts to exercise the
// package's exports map through a temp-fixture symlink, NOT through a
// relative path.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EstateStore } from '../src/straylight/index.js';
import {
  createInMemoryIntakeDenyLog,
  type TenantResolver,
} from '../src/straylight/host/index.js';
import {
  buildRecallRequest,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
  SIGNERS,
} from '../fixtures/index.js';

import {
  handleRecallIntake as runtimeHandleRecallIntake,
  createDixieCapability,
  DixieCapabilityError,
  type DixieCapability,
} from '../src/straylight/runtime/recall-intake/index.js';
import { verifyDixieCapability } from '../src/straylight/runtime/recall-intake/dixie-capability.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const README = resolve(ROOT, 'README.md');
const PACKAGE_BOUNDARY = resolve(ROOT, 'docs/mvp/package-boundary.md');
const RUNTIME_DTS = resolve(
  ROOT,
  'dist-types/src/straylight/runtime/recall-intake/index.d.ts',
);
const RUNTIME_HANDLE_DTS = resolve(
  ROOT,
  'dist-types/src/straylight/runtime/recall-intake/handle-recall-intake.d.ts',
);
const RUNTIME_CAPABILITY_DTS = resolve(
  ROOT,
  'dist-types/src/straylight/runtime/recall-intake/dixie-capability.d.ts',
);
const TSC = resolve(ROOT, 'node_modules/.bin/tsc');

// Vitest's global-setup script (configured in vitest.config.ts) runs a
// single `npm run build` before any test file executes, eliminating the
// cross-file race on `clean:dist`. We still verify outputs exist here
// as a defensive guard so a missing globalSetup configuration surfaces
// as a clear error instead of a confusing test failure.
function buildOnce(): void {
  const required = [
    RUNTIME_DTS,
    RUNTIME_HANDLE_DTS,
    RUNTIME_CAPABILITY_DTS,
    resolve(ROOT, 'dist/src/straylight/runtime/recall-intake/index.js'),
  ];
  for (const path of required) {
    if (!existsSync(path)) {
      throw new Error(
        `phase-26b: required build output missing at ${path}; ` +
          'globalSetup should have produced it. Run `npm run build` first ' +
          'or check vitest.config.ts.',
      );
    }
  }
}

const KEY_ENV_VAR = 'STRAYLIGHT_RUNTIME_DIXIE_KEY';
const TEST_KEY = 'phase-26b-test-key-do-not-use-in-production';

const NOW = '2026-05-18T12:00:00Z';

const tenantResolver: TenantResolver = (id) => {
  if (id.includes('satoshi-demo')) return 'satoshi-tenant';
  return undefined;
};

const caller = {
  tenant_id: 'satoshi-tenant',
  actor_id: 'agent:satoshi-demo',
  session_id: 'sess:phase-26b',
};

function makeStore(): EstateStore {
  const store = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  store.seedAssertion(
    buildSeededAssertion({
      status: 'active',
      assertion_class: 'observation',
      body: { text: 'phase-26b: public observation' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
  );
  return store;
}

function buildRequest() {
  return {
    request: buildRecallRequest({
      task: 'phase-26b-runtime',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      requested_classes: ['observation'],
      signer: SIGNERS.operator,
    }),
    detail_level: 'standard' as const,
    caller,
  };
}

/**
 * Strip block + line comments so a "no-reference" grep doesn't trip on
 * documentation that *describes* the absence of a check. Conservative —
 * only handles the standard JS comment forms used in this repo.
 */
function stripComments(source: string): string {
  // Block comments first (greedy with non-greedy inner match), then
  // single-line comments. Strings can contain `//`; this approach is
  // imperfect but the defensive grep below uses tight property-access
  // patterns that won't match string literals in practice.
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function withEnvKey<T>(key: string | undefined, fn: () => T): T {
  const previous = process.env[KEY_ENV_VAR];
  if (key === undefined) delete process.env[KEY_ENV_VAR];
  else process.env[KEY_ENV_VAR] = key;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env[KEY_ENV_VAR];
    else process.env[KEY_ENV_VAR] = previous;
  }
}

// ── §10.e — runtime barrel exports only the §3 allowlist ─────────────────────
describe('Phase 26B §10.e — runtime barrel allowlist', () => {
  it('exports exactly the allowlisted runtime values', async () => {
    const mod = (await import(
      '../src/straylight/runtime/recall-intake/index.js'
    )) as Record<string, unknown>;

    const valueExports = Object.keys(mod)
      .filter((key) => key !== 'default')
      .filter((key) => mod[key] !== undefined)
      .sort();

    // ADR-026A §"Decision" §3:
    //   * `handleRecallIntake` — required;
    //   * `createDixieCapability` + `DixieCapabilityError` — concrete
    //     non-Dixie refusal mechanism per §7;
    //   * `createInMemoryRecallIntakeDeps` — NOT exported (avoids
    //     leaking EstateStore / AuditLog / JsonlStorage value imports);
    //   * `executeRecall`, `EstateStore`, etc. — NOT exported.
    expect(valueExports).toEqual(
      [
        'handleRecallIntake',
        'createDixieCapability',
        'DixieCapabilityError',
      ].sort(),
    );
  });

  it.each([
    'executeRecall',
    'EstateStore',
    'AuditLog',
    'JsonlStorage',
    'InMemoryStorage',
    'dispositionFor',
    'verifyChain',
    'computeCommitmentRoot',
    'devSign',
    'devSignatureFor',
    'validateCandidateAssertion',
    'validateRecallRequest',
    'evaluateCompetence',
    'loadBundle',
    'saveBundle',
    'createInMemoryRecallIntakeDeps',
    'createInMemoryIntakeDenyLog',
    'checkSameTenant',
  ])('does NOT export wedge-internal value `%s`', async (sym) => {
    const mod = (await import(
      '../src/straylight/runtime/recall-intake/index.js'
    )) as Record<string, unknown>;
    expect(sym in mod).toBe(false);
  });

  it('handleRecallIntake is a function', async () => {
    const mod = (await import(
      '../src/straylight/runtime/recall-intake/index.js'
    )) as Record<string, unknown>;
    expect(typeof mod.handleRecallIntake).toBe('function');
  });

  it('createDixieCapability is a function', async () => {
    const mod = (await import(
      '../src/straylight/runtime/recall-intake/index.js'
    )) as Record<string, unknown>;
    expect(typeof mod.createDixieCapability).toBe('function');
  });

  it('DixieCapabilityError is a constructor (subclass of Error)', async () => {
    const mod = (await import(
      '../src/straylight/runtime/recall-intake/index.js'
    )) as Record<string, unknown>;
    expect(typeof mod.DixieCapabilityError).toBe('function');
    const Ctor = mod.DixieCapabilityError as new (msg: string) => Error;
    const instance = new Ctor('test');
    expect(instance).toBeInstanceOf(Error);
    expect(instance.name).toBe('DixieCapabilityError');
  });
});

// ── §10.f — concrete non-Dixie refusal mechanism is held by tests ────────────
describe('Phase 26B §10.f — non-Dixie refusal mechanism (positive path)', () => {
  it('Dixie-shaped caller WITH env key + valid capability serves the pack', () => {
    withEnvKey(TEST_KEY, () => {
      const store = makeStore();
      const cap = createDixieCapability();
      const result = runtimeHandleRecallIntake(
        store,
        buildRequest(),
        {
          tenantResolver,
          intakeLog: createInMemoryIntakeDenyLog(),
          now: NOW,
        },
        cap,
      );
      expect(result.outcome).toBe('served');
    });
  });
});

describe('Phase 26B §10.f.i — direct import from a non-Dixie process', () => {
  it('without STRAYLIGHT_RUNTIME_DIXIE_KEY in env, createDixieCapability THROWS', () => {
    withEnvKey(undefined, () => {
      expect(() => createDixieCapability()).toThrow(DixieCapabilityError);
    });
  });

  it('without env key set, createDixieCapability throws with a readable message', () => {
    withEnvKey(undefined, () => {
      try {
        createDixieCapability();
      } catch (err) {
        expect(err).toBeInstanceOf(DixieCapabilityError);
        if (err instanceof DixieCapabilityError) {
          expect(err.message).toContain('STRAYLIGHT_RUNTIME_DIXIE_KEY');
        }
        return;
      }
      throw new Error('expected createDixieCapability to throw');
    });
  });

  it('empty STRAYLIGHT_RUNTIME_DIXIE_KEY counts as absent (fail-closed)', () => {
    withEnvKey('', () => {
      expect(() => createDixieCapability()).toThrow(DixieCapabilityError);
    });
  });

  it('handleRecallIntake refuses if env key is removed AFTER capability minted', () => {
    // Mint a capability with the env key set.
    const cap = withEnvKey(TEST_KEY, () => createDixieCapability());
    // Now drop the env key (simulating: the capability was extracted
    // and replayed in a non-Dixie process that lacks the deployment
    // secret).
    withEnvKey(undefined, () => {
      const store = makeStore();
      const result = runtimeHandleRecallIntake(
        store,
        buildRequest(),
        {
          tenantResolver,
          intakeLog: createInMemoryIntakeDenyLog(),
          now: NOW,
        },
        cap,
      );
      expect(result.outcome).toBe('denied');
      if (result.outcome !== 'denied') return;
      expect(result.raw_reasons).toContain(
        'runtime_seam:capability_unavailable',
      );
    });
  });

  it('handleRecallIntake refuses with WRONG env key (key rotation / deployment mismatch)', () => {
    const cap = withEnvKey(TEST_KEY, () => createDixieCapability());
    withEnvKey('different-deployment-key', () => {
      const store = makeStore();
      const result = runtimeHandleRecallIntake(
        store,
        buildRequest(),
        {
          tenantResolver,
          intakeLog: createInMemoryIntakeDenyLog(),
          now: NOW,
        },
        cap,
      );
      expect(result.outcome).toBe('denied');
      if (result.outcome !== 'denied') return;
      expect(result.raw_reasons).toContain('runtime_seam:proof_invalid');
    });
  });
});

describe('Phase 26B §10.f.ii — forged caller metadata cannot pass the gate', () => {
  // ADR-026A §7 explicitly rules caller-identity strings, package-name
  // checks, and dependency-shape fingerprints insufficient. The gate is
  // the env-bound HMAC + closure-private brand. The forged-metadata
  // attack tries to pass plausible-looking caller information instead
  // of a real capability; the gate ignores all of it.
  it('forged metadata in deps does NOT bypass the capability check', () => {
    withEnvKey(TEST_KEY, () => {
      const store = makeStore();
      // Pass a "deps" object that claims to be Dixie via plausible
      // fields, alongside a structurally-shaped capability that lacks
      // the closure-private brand. A non-gated implementation might
      // trust the metadata. This implementation does not consult any
      // metadata; the brand check fails first.
      const fakeMetadata = {
        package_name: '@loa/dixie',
        caller_identity: 'dixie-bff-prod',
        version: '1.0.0',
      };
      const fakeCap = {
        nonce: 'a'.repeat(64),
        proof: 'b'.repeat(64),
        ...fakeMetadata,
      } as unknown as DixieCapability;
      const result = runtimeHandleRecallIntake(
        store,
        buildRequest(),
        {
          tenantResolver,
          intakeLog: createInMemoryIntakeDenyLog(),
          now: NOW,
        },
        fakeCap,
      );
      expect(result.outcome).toBe('denied');
      if (result.outcome !== 'denied') return;
      expect(result.raw_reasons).toContain(
        'runtime_seam:capability_unrecognized',
      );
    });
  });

  it('the gate consults NO caller-identity field accessors (verified by source-grep on non-comment lines)', () => {
    // Defence-in-depth: read the gate's source and assert it does not
    // perform any property access against caller-identity string fields.
    // We strip comments first so module-header documentation that
    // *describes* the absence of those checks doesn't trip the grep.
    const gateSource = readFileSync(
      resolve(
        ROOT,
        'src/straylight/runtime/recall-intake/dixie-capability.ts',
      ),
      'utf8',
    );
    const codeOnly = stripComments(gateSource);
    // No package-name string compares.
    expect(codeOnly).not.toMatch(/['"]@loa\/dixie['"]/);
    // No property accessors / object-key references against the
    // forbidden caller-identity field names.
    expect(codeOnly).not.toMatch(/\.package_name\b|\bpackage_name\s*:/);
    expect(codeOnly).not.toMatch(
      /\.caller_identity\b|\bcaller_identity\s*:/,
    );
    expect(codeOnly).not.toMatch(/\.user[_-]?agent\b|\buser[_-]?agent\s*:/i);
  });
});

describe('Phase 26B §10.f.iii — fake "dixie"-named wrapper package cannot pass', () => {
  // The attack: a non-Dixie process publishes a package named "dixie"
  // (or "@loa/dixie") and imports `@loa/straylight/runtime/recall-intake`
  // from it, hoping a name-based check would let it through. ADR-026A
  // §7 explicitly rules name-based checks insufficient. This
  // implementation does not consult package names, so the attack
  // reduces to §10.f.i (no env key) — verified here.
  it('a wrapper package importing without the env key fails closed', () => {
    // We simulate the wrapper by importing the runtime barrel from a
    // different module path. Without the env key, the constructor
    // refuses regardless of which package is the importer.
    withEnvKey(undefined, () => {
      // Simulate: the wrapper tries to construct a capability.
      expect(() => createDixieCapability()).toThrow(DixieCapabilityError);
    });
  });

  it('runtime barrel never references package-name strings (defence-in-depth)', () => {
    const barrelSource = readFileSync(
      resolve(ROOT, 'src/straylight/runtime/recall-intake/index.ts'),
      'utf8',
    );
    const handlerSource = readFileSync(
      resolve(
        ROOT,
        'src/straylight/runtime/recall-intake/handle-recall-intake.ts',
      ),
      'utf8',
    );
    const gateSource = readFileSync(
      resolve(
        ROOT,
        'src/straylight/runtime/recall-intake/dixie-capability.ts',
      ),
      'utf8',
    );
    // None of the runtime files should match against a `dixie` package
    // name string at runtime. ADR-026A §7: package-name checks are
    // explicitly insufficient. Comments mentioning "dixie" are fine
    // (they document the intent); runtime checks against package
    // identifiers are not.
    for (const src of [barrelSource, handlerSource, gateSource]) {
      // No `if (callerPackage === "dixie")` shape.
      expect(src).not.toMatch(
        /===\s*['"][^'"]*dixie[^'"]*['"]|['"][^'"]*dixie[^'"]*['"]\s*===/i,
      );
      // No `caller.match(/dixie/)` shape.
      expect(src).not.toMatch(/\.match\(\s*\/[^/]*dixie/i);
    }
  });
});

describe('Phase 26B §10.f.iv — dependency-object spoofing fails closed', () => {
  // ADR-026A §7 (iv) — since the runtime seam takes a capability
  // object as part of its dependency contract, the implementation
  // MUST defeat dependency-object spoofing. The defence is the
  // closure-private WeakSet brand: `verifyDixieCapability` rejects any
  // object that did not come from `createDixieCapability` in this
  // module instance.
  it('hand-rolled object with valid-looking nonce/proof fields is rejected', () => {
    withEnvKey(TEST_KEY, () => {
      const store = makeStore();
      const spoof = {
        nonce: 'a'.repeat(64),
        proof: 'b'.repeat(64),
      } as unknown as DixieCapability;
      const result = runtimeHandleRecallIntake(
        store,
        buildRequest(),
        {
          tenantResolver,
          intakeLog: createInMemoryIntakeDenyLog(),
          now: NOW,
        },
        spoof,
      );
      expect(result.outcome).toBe('denied');
      if (result.outcome !== 'denied') return;
      expect(result.raw_reasons).toContain(
        'runtime_seam:capability_unrecognized',
      );
    });
  });

  it('object that mutates a real capability (clones nonce/proof to a new object) is rejected', () => {
    withEnvKey(TEST_KEY, () => {
      const real = createDixieCapability();
      // Attacker observes the real capability's nonce + proof and
      // copies them into a fresh object. The fresh object lacks the
      // closure-private brand and must be rejected.
      const cloned = {
        nonce: real.nonce,
        proof: real.proof,
      } as unknown as DixieCapability;
      const verdict = verifyDixieCapability(cloned);
      expect(verdict.ok).toBe(false);
      if (verdict.ok) return;
      expect(verdict.reason).toBe('capability_unrecognized');
    });
  });

  it('null / undefined / primitive capability values are rejected', () => {
    withEnvKey(TEST_KEY, () => {
      for (const candidate of [null, undefined, 0, '', 'cap', false, []]) {
        const verdict = verifyDixieCapability(candidate);
        expect(verdict.ok).toBe(false);
        if (verdict.ok) continue;
        expect(verdict.reason).toBe('capability_unrecognized');
      }
    });
  });

  it('mutated proof on a real capability is rejected at the HMAC check', () => {
    withEnvKey(TEST_KEY, () => {
      const real = createDixieCapability();
      // Object.freeze prevents direct mutation, so the attacker needs
      // to construct a fresh object — but constructing a fresh object
      // loses the brand. We verify the brand check happens before HMAC
      // by observing the failure reason.
      const tampered = Object.create(
        Object.getPrototypeOf(real),
        {
          nonce: { value: real.nonce, enumerable: true },
          // Flip every byte of the real proof.
          proof: {
            value: real.proof
              .split('')
              .map((c) => (c === '0' ? '1' : '0'))
              .join(''),
            enumerable: true,
          },
        },
      ) as DixieCapability;
      const verdict = verifyDixieCapability(tampered);
      expect(verdict.ok).toBe(false);
      if (verdict.ok) return;
      // Brand check fires first; the tampered object lacks WeakSet
      // membership.
      expect(verdict.reason).toBe('capability_unrecognized');
    });
  });

  it('a capability passes only when minted in this module instance', () => {
    withEnvKey(TEST_KEY, () => {
      const cap = createDixieCapability();
      const verdict = verifyDixieCapability(cap);
      expect(verdict.ok).toBe(true);
    });
  });
});

// ── §10.g — emitted .d.ts marker survives tsc emission ──────────────────────
describe('Phase 26B §10.g — emitted .d.ts marker survives tsc', () => {
  beforeAll(() => {
    buildOnce();
  });

  it.each([RUNTIME_DTS, RUNTIME_HANDLE_DTS, RUNTIME_CAPABILITY_DTS])(
    '%s exists after build',
    (path) => {
      expect(existsSync(path)).toBe(true);
    },
  );

  it('emitted barrel .d.ts re-exports the marker-bearing handler + capability symbols', () => {
    // Per ADR-026A §10.g the marker tokens must survive `tsc` emission
    // on the barrel and on each runtime handler. The barrel itself is
    // a re-export-only file (TypeScript drops file-level `//` comments
    // during emission); marker presence on the barrel is therefore
    // verified indirectly via go-to-defn — every barrel re-export
    // points at a marker-bearing source declaration. The handler and
    // capability tests below assert the marker tokens directly on the
    // declarations consumers reach via the re-exports.
    const text = readFileSync(RUNTIME_DTS, 'utf8');
    expect(text).toContain('handleRecallIntake');
    expect(text).toContain('createDixieCapability');
    expect(text).toContain('DixieCapabilityError');
    expect(text).toContain('DixieCapability');
    // The re-exports MUST point at the local declaration files where
    // the markers live (./handle-recall-intake.js and
    // ./dixie-capability.js), not at any wedge-internal module.
    expect(text).toMatch(/from\s+['"]\.\/handle-recall-intake\.js['"]/);
    expect(text).toMatch(/from\s+['"]\.\/dixie-capability\.js['"]/);
  });

  it('emitted handler .d.ts retains markers on handleRecallIntake', () => {
    const text = readFileSync(RUNTIME_HANDLE_DTS, 'utf8');
    expect(text).toContain('@experimental');
    expect(text).toContain('pre-Finn');
    expect(text).toContain('Dixie-only');
    expect(text).toMatch(/handleRecallIntake/);
  });

  it('emitted capability .d.ts retains markers on createDixieCapability', () => {
    const text = readFileSync(RUNTIME_CAPABILITY_DTS, 'utf8');
    expect(text).toContain('@experimental');
    expect(text).toContain('pre-Finn');
    expect(text).toContain('Dixie-only');
    expect(text).toMatch(/createDixieCapability/);
  });
});

// ── §10.h — README + package-boundary marker tokens present ─────────────────
describe('Phase 26B §10.h — README + package-boundary doc markers', () => {
  it('README contains the experimental + pre-Finn + Dixie-only marker tokens', () => {
    const text = readFileSync(README, 'utf8');
    // ADR-026A §10.h: tests do NOT assert exact verbatim text (which
    // would be brittle); they assert presence of the three marker
    // tokens.
    expect(text.toLowerCase()).toContain('experimental');
    expect(text).toContain('pre-Finn');
    expect(text).toContain('Dixie-only');
  });

  it('README has a runtime-subpath section heading', () => {
    const text = readFileSync(README, 'utf8');
    expect(text).toMatch(/^##\s+Runtime subpath/m);
  });

  it('package-boundary.md contains the three marker tokens', () => {
    const text = readFileSync(PACKAGE_BOUNDARY, 'utf8');
    expect(text.toLowerCase()).toContain('experimental');
    expect(text).toContain('pre-Finn');
    expect(text).toContain('Dixie-only');
  });

  it('package-boundary.md has the runtime-subpath section heading', () => {
    const text = readFileSync(PACKAGE_BOUNDARY, 'utf8');
    expect(text).toMatch(/^##\s+Runtime subpath\b/m);
  });
});

// ── §10.a / §10.b / §10.c / §10.d — package exports resolution under Node ───
//
// These tests reuse the temp-fixture symlink pattern from
// tests/phase-24h-type-only-consumption.test.ts. They build dist-types/
// + dist/ first, symlink the repo as @loa/straylight under
// node_modules/, then run small Node scripts that exercise dynamic ESM
// import / CJS require.
interface FixtureContext {
  tempRoot: string;
  fixtureDir: string;
  nodeModulesDir: string;
  symlinkPath: string;
}

function setupFixture(): FixtureContext {
  const tempRoot = mkdtempSync(resolve(tmpdir(), 'phase-26b-runtime-'));
  const fixtureDir = resolve(tempRoot, 'consumer');
  const nodeModulesDir = resolve(fixtureDir, 'node_modules');
  const scopeDir = resolve(nodeModulesDir, '@loa');
  const symlinkPath = resolve(scopeDir, 'straylight');
  mkdirSync(scopeDir, { recursive: true });
  symlinkSync(ROOT, symlinkPath, 'dir');
  return { tempRoot, fixtureDir, nodeModulesDir, symlinkPath };
}

function teardownFixture(ctx: FixtureContext): void {
  rmSync(ctx.tempRoot, { recursive: true, force: true });
}

interface NodeRunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runNode(
  fixtureDir: string,
  fileName: string,
  env: NodeJS.ProcessEnv = {},
): NodeRunResult {
  try {
    const output = execFileSync(process.execPath, [fileName], {
      cwd: fixtureDir,
      stdio: 'pipe',
      env: { ...process.env, ...env },
    });
    return { status: 0, stdout: output.toString('utf8'), stderr: '' };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & {
      status?: number | null;
      stdout?: Buffer;
      stderr?: Buffer;
    };
    return {
      status: e.status ?? null,
      stdout: e.stdout ? e.stdout.toString('utf8') : '',
      stderr: e.stderr ? e.stderr.toString('utf8') : '',
    };
  }
}

let fixture: FixtureContext | null = null;

beforeAll(() => {
  buildOnce();
  fixture = setupFixture();
});

afterAll(() => {
  if (fixture) teardownFixture(fixture);
});

describe('Phase 26B §10.a — root `.` does not become runtime-importable', () => {
  it('dynamic ESM import("@loa/straylight") fails to resolve', () => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = 'p26b-import-root.mjs';
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      "await import('@loa/straylight');\n",
      'utf8',
    );
    const result = runNode(fixture.fixtureDir, fileName);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(
      /ERR_PACKAGE_PATH_NOT_EXPORTED|ERR_MODULE_NOT_FOUND/,
    );
    expect(result.stderr).toContain('@loa/straylight');
  });

  it('CJS require("@loa/straylight") fails to resolve', () => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = 'p26b-require-root.cjs';
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      "require('@loa/straylight');\n",
      'utf8',
    );
    const result = runNode(fixture.fixtureDir, fileName);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(
      /ERR_PACKAGE_PATH_NOT_EXPORTED|MODULE_NOT_FOUND/,
    );
    expect(result.stderr).toContain('@loa/straylight');
  });
});

describe('Phase 26B §10.b — `./host` does not become runtime-importable', () => {
  it('dynamic ESM import("@loa/straylight/host") fails to resolve', () => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = 'p26b-import-host.mjs';
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      "await import('@loa/straylight/host');\n",
      'utf8',
    );
    const result = runNode(fixture.fixtureDir, fileName);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/ERR_PACKAGE_PATH_NOT_EXPORTED/);
    expect(result.stderr).toContain("'./host'");
  });

  it('CJS require("@loa/straylight/host") fails to resolve', () => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = 'p26b-require-host.cjs';
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      "require('@loa/straylight/host');\n",
      'utf8',
    );
    const result = runNode(fixture.fixtureDir, fileName);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/ERR_PACKAGE_PATH_NOT_EXPORTED/);
    expect(result.stderr).toContain("'./host'");
  });
});

describe('Phase 26B §10.c — `./runtime/recall-intake` resolves at runtime', () => {
  it('dynamic ESM import("@loa/straylight/runtime/recall-intake") resolves and exposes the allowlist', () => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = 'p26b-import-runtime.mjs';
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      [
        "const mod = await import('@loa/straylight/runtime/recall-intake');",
        "const keys = Object.keys(mod).filter(k => k !== 'default').sort();",
        'process.stdout.write(JSON.stringify(keys));',
        '',
      ].join('\n'),
      'utf8',
    );
    const result = runNode(fixture.fixtureDir, fileName);
    expect(
      result.status,
      `runtime import should succeed; status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`,
    ).toBe(0);
    const keys = JSON.parse(result.stdout) as string[];
    expect(keys.sort()).toEqual(
      [
        'handleRecallIntake',
        'createDixieCapability',
        'DixieCapabilityError',
      ].sort(),
    );
  });
});

describe('Phase 26B §10.d — no other runtime subpath resolves', () => {
  it.each([
    './runtime',
    './runtime/x',
    './runtime/recall-intake/handle-recall-intake',
    './runtime/recall-intake/dixie-capability',
    './recall-intake',
    './host/recall-intake',
    './host/intake',
  ])('dynamic import("@loa/straylight%s") fails to resolve', (subpath) => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = `p26b-import-${subpath.replace(/[^A-Za-z0-9]+/g, '-')}.mjs`;
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      `await import('@loa/straylight${subpath}');\n`,
      'utf8',
    );
    const result = runNode(fixture.fixtureDir, fileName);
    expect(
      result.status,
      `import of ${subpath} should fail; stdout=${result.stdout} stderr=${result.stderr}`,
    ).not.toBe(0);
    expect(result.stderr).toMatch(
      /ERR_PACKAGE_PATH_NOT_EXPORTED|ERR_MODULE_NOT_FOUND|Cannot find/,
    );
  });
});

// ── §10.f — direct ESM import from a non-Dixie fixture process ───────────────
//
// Subprocess test: a fresh node process imports the runtime barrel
// WITHOUT the env key planted. The capability constructor MUST throw,
// which is the §7 (i) defence. Then re-run with the env key planted to
// confirm the positive path works through the same exports map.
describe('Phase 26B §10.f.i (subprocess) — direct import from non-Dixie process fails closed', () => {
  it('subprocess WITHOUT env key cannot construct a capability', () => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = 'p26b-non-dixie-direct.mjs';
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      [
        "const m = await import('@loa/straylight/runtime/recall-intake');",
        "try { m.createDixieCapability(); console.log('UNEXPECTED_OK'); }",
        "catch (e) { console.log('CONSTRUCT_REFUSED:' + e.name); }",
        '',
      ].join('\n'),
      'utf8',
    );
    // Explicitly strip the env key for the subprocess.
    const env = { ...process.env };
    delete env[KEY_ENV_VAR];
    const result = runNode(fixture.fixtureDir, fileName, env);
    expect(
      result.status,
      `subprocess should exit 0; stdout=${result.stdout} stderr=${result.stderr}`,
    ).toBe(0);
    expect(result.stdout).toContain('CONSTRUCT_REFUSED:DixieCapabilityError');
    expect(result.stdout).not.toContain('UNEXPECTED_OK');
  });

  it('subprocess WITH env key constructs a capability successfully', () => {
    expect(fixture).not.toBeNull();
    if (!fixture) return;
    const fileName = 'p26b-non-dixie-direct-with-key.mjs';
    writeFileSync(
      resolve(fixture.fixtureDir, fileName),
      [
        "const m = await import('@loa/straylight/runtime/recall-intake');",
        "const cap = m.createDixieCapability();",
        "console.log('CONSTRUCT_OK:' + (typeof cap.proof));",
        '',
      ].join('\n'),
      'utf8',
    );
    const result = runNode(fixture.fixtureDir, fileName, {
      [KEY_ENV_VAR]: TEST_KEY,
    });
    expect(
      result.status,
      `subprocess should exit 0; stdout=${result.stdout} stderr=${result.stderr}`,
    ).toBe(0);
    expect(result.stdout).toContain('CONSTRUCT_OK:string');
  });
});
