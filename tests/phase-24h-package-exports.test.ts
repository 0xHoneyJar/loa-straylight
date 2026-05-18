// Phase 24H conformance — package.json exports shape + emit shape + pack shape.
//
// Pins:
//   * package.json has exactly two `exports` keys: "." and "./host"
//   * each `exports` entry has exactly one condition: "types"
//   * no "default", "import", "require", "node", "browser", or any other
//     runtime condition appears under any `exports` entry (SKP-001:
//     runtime/value imports are unsupported in Phase 24H by design)
//   * no TypeScript source fallback appears under any `exports` entry
//   * the declaration files that `exports[*].types` advertise actually
//     exist on disk after `npm run build` — this catches a wrong
//     `rootDir` setting in tsconfig.build.json that would emit under
//     `dist-types/straylight/...` instead of `dist-types/src/straylight/...`
//     (IMP-011)
//   * `files` includes "dist-types/"
//   * `prepare` equals "npm run build" and `build` cleans dist-types/
//     before invoking tsc (IMP-008)
//   * no `main` field exists
//   * tsconfig.build.json carries the load-bearing emit settings
//     (IMP-001 / IMP-002): rootDir=".", declaration=true,
//     emitDeclarationOnly=true, noEmit=false, declarationDir="dist-types",
//     include=["src/**/*.ts"]
//   * `npm pack --dry-run` includes dist-types/ and excludes src/, tests/,
//     scripts/, fixtures/, and other working-tree junk (IMP-009)
//   * the one-way wedge↔host dependency invariant is automated NOW
//     (delegated to tests/phase-24c-host-surface-shape.test.ts; this test
//     records the delegation so that wording in ADR-024G / the Phase 24H
//     handoff / docs/mvp/package-boundary.md stays honest) (SKP-006)
//
// These pins prove that Phase 24H's public-surface widening is type-only
// and declaration-only, as locked by ADR-024G. They are NOT a substitute
// for sibling-repo consumption validation; they only validate the in-repo
// package shape.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const PACKAGE_JSON = resolve(ROOT, 'package.json');
const TSCONFIG_BUILD = resolve(ROOT, 'tsconfig.build.json');
const WEDGE_DTS = resolve(ROOT, 'dist-types/src/straylight/index.d.ts');
const HOST_DTS = resolve(ROOT, 'dist-types/src/straylight/host/index.d.ts');
const RUNTIME_DTS = resolve(
  ROOT,
  'dist-types/src/straylight/runtime/recall-intake/index.d.ts',
);
const RUNTIME_JS = resolve(
  ROOT,
  'dist/src/straylight/runtime/recall-intake/index.js',
);
const HOST_GUARD_TEST = resolve(
  ROOT,
  'tests/phase-24c-host-surface-shape.test.ts',
);

interface PackageJson {
  name?: unknown;
  main?: unknown;
  types?: unknown;
  exports?: unknown;
  files?: unknown;
  scripts?: unknown;
  devDependencies?: unknown;
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as PackageJson;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildOnce(): void {
  if (
    existsSync(WEDGE_DTS) &&
    existsSync(HOST_DTS) &&
    existsSync(RUNTIME_DTS) &&
    existsSync(RUNTIME_JS)
  ) {
    return;
  }
  execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'pipe' });
}

// Use the pre-computed `npm pack --dry-run --json` output stashed by
// vitest globalSetup at `.vitest/pack-dry-run.json`. Running `npm pack`
// during the test run unconditionally fires the `prepare` script
// (npm@7+ behavior; `--ignore-scripts` does NOT suppress it), which
// wipes `dist/` and rebuilds it — racing with subprocess imports in
// the Phase 26B suite that resolve through the symlinked package's
// `dist/`. Pre-computing in globalSetup eliminates the race.
const PACK_CACHE_FILE = resolve(ROOT, '.vitest/pack-dry-run.json');

function runNpmPackDryRun(): string {
  if (!existsSync(PACK_CACHE_FILE)) {
    throw new Error(
      `phase-24h: ${PACK_CACHE_FILE} not found; vitest globalSetup ` +
        '(tests/_global-setup.ts) is responsible for pre-computing it.',
    );
  }
  return readFileSync(PACK_CACHE_FILE, 'utf8');
}

interface PackEntry {
  path: string;
}

interface PackResult {
  files?: PackEntry[];
}

describe('Phase 24H — package.json exports shape', () => {
  it('package name is @loa/straylight', () => {
    const pkg = readPackageJson();
    expect(pkg.name).toBe('@loa/straylight');
  });

  it('has no `main` field', () => {
    const pkg = readPackageJson();
    expect(Object.prototype.hasOwnProperty.call(pkg, 'main')).toBe(false);
  });

  it('declares a top-level `types` field pointing at the wedge .d.ts', () => {
    const pkg = readPackageJson();
    expect(pkg.types).toBe('./dist-types/src/straylight/index.d.ts');
  });

  it('declares an `exports` map with exactly three keys: ".", "./host", "./runtime/recall-intake" (Phase 26B)', () => {
    // Phase 24H pinned exactly two keys ("." and "./host"). Phase 26B
    // (ADR-026A §"Decision" §2) authorizes EXACTLY one additional runtime
    // subpath at "./runtime/recall-intake". Root "." and "./host" remain
    // type-only per ADR-026A §"Decision" §5; widening either of those is
    // out of scope for Phase 26B and requires its own future ADR.
    const pkg = readPackageJson();
    expect(isRecord(pkg.exports)).toBe(true);
    if (!isRecord(pkg.exports)) return;
    const keys = Object.keys(pkg.exports).sort();
    expect(keys).toEqual(['.', './host', './runtime/recall-intake']);
  });

  it('exports["."] has exactly one key: "types" (root remains type-only post-Phase-26B)', () => {
    const pkg = readPackageJson();
    if (!isRecord(pkg.exports)) throw new Error('exports must be a record');
    const root = pkg.exports['.'];
    expect(isRecord(root)).toBe(true);
    if (!isRecord(root)) return;
    expect(Object.keys(root)).toEqual(['types']);
    expect(root.types).toBe('./dist-types/src/straylight/index.d.ts');
  });

  it('exports["./host"] has exactly one key: "types" (host remains type-only post-Phase-26B)', () => {
    const pkg = readPackageJson();
    if (!isRecord(pkg.exports)) throw new Error('exports must be a record');
    const host = pkg.exports['./host'];
    expect(isRecord(host)).toBe(true);
    if (!isRecord(host)) return;
    expect(Object.keys(host)).toEqual(['types']);
    expect(host.types).toBe('./dist-types/src/straylight/host/index.d.ts');
  });

  it('exports["./runtime/recall-intake"] has exactly two keys: "types" and "import" (Phase 26B; ADR-026A §4)', () => {
    const pkg = readPackageJson();
    if (!isRecord(pkg.exports)) throw new Error('exports must be a record');
    const runtime = pkg.exports['./runtime/recall-intake'];
    expect(isRecord(runtime)).toBe(true);
    if (!isRecord(runtime)) return;
    // ADR-026A §"Decision" §4 pins "import" (ESM-only), NOT "default".
    // The package is `"type": "module"`; "import" is narrower than
    // "default" (no CJS fallback, no non-Node consumers). A successor
    // ADR or Flatline pass may reverse this, but absent that reversal
    // the test holds.
    expect(Object.keys(runtime).sort()).toEqual(['import', 'types']);
    expect(runtime.types).toBe(
      './dist-types/src/straylight/runtime/recall-intake/index.d.ts',
    );
    expect(runtime.import).toBe(
      './dist/src/straylight/runtime/recall-intake/index.js',
    );
  });

  it('root "." and "./host" entries do NOT include any runtime / value-import condition (Phase 24H + ADR-026A §5)', () => {
    const pkg = readPackageJson();
    if (!isRecord(pkg.exports)) throw new Error('exports must be a record');
    const forbidden = [
      'default',
      'import',
      'require',
      'node',
      'node-addons',
      'browser',
      'deno',
      'bun',
      'worker',
      'react-native',
      'electron',
      'production',
      'development',
      'module',
      'main',
    ];
    // Type-only subpaths preserved per ADR-026A §"Decision" §5: root "."
    // and "./host" MUST remain `{"types": "..."}`-only. Adding any runtime
    // condition under either is out of scope for Phase 26B and requires
    // its own future ADR.
    for (const key of ['.', './host']) {
      const entry = pkg.exports[key];
      expect(isRecord(entry)).toBe(true);
      if (!isRecord(entry)) continue;
      expect(Object.keys(entry)).toEqual(['types']);
      for (const condition of forbidden) {
        expect(
          Object.prototype.hasOwnProperty.call(entry, condition),
          `exports["${key}"] must not declare a "${condition}" condition`,
        ).toBe(false);
      }
      for (const value of Object.values(entry)) {
        if (typeof value !== 'string') continue;
        expect(value.startsWith('./src/')).toBe(false);
        expect(value).toMatch(/^\.\/dist-types\//);
        expect(value.endsWith('.d.ts')).toBe(true);
      }
    }
  });

  it('"./runtime/recall-intake" rejects forbidden non-import runtime conditions (ADR-026A §4)', () => {
    const pkg = readPackageJson();
    if (!isRecord(pkg.exports)) throw new Error('exports must be a record');
    const runtime = pkg.exports['./runtime/recall-intake'];
    expect(isRecord(runtime)).toBe(true);
    if (!isRecord(runtime)) return;
    // ADR-026A §"Decision" §4 chose "import" specifically to exclude
    // CJS fallback (`require`) and non-Node consumers (`browser`, etc.).
    // A successor ADR may widen this; absent that, every other runtime
    // condition is forbidden on the runtime subpath.
    const forbiddenOnRuntime = [
      'default',
      'require',
      'node',
      'node-addons',
      'browser',
      'deno',
      'bun',
      'worker',
      'react-native',
      'electron',
      'production',
      'development',
      'module',
      'main',
    ];
    for (const condition of forbiddenOnRuntime) {
      expect(
        Object.prototype.hasOwnProperty.call(runtime, condition),
        `exports["./runtime/recall-intake"] must not declare a "${condition}" condition under ADR-026A §4`,
      ).toBe(false);
    }
  });

  it('`files` includes "dist-types/" AND "dist/" (Phase 26B adds dist/ for the runtime subpath)', () => {
    const pkg = readPackageJson();
    expect(Array.isArray(pkg.files)).toBe(true);
    if (!Array.isArray(pkg.files)) return;
    expect(pkg.files).toContain('dist-types/');
    expect(pkg.files).toContain('dist/');
  });

  it('`prepare` script equals "npm run build"', () => {
    const pkg = readPackageJson();
    expect(isRecord(pkg.scripts)).toBe(true);
    if (!isRecord(pkg.scripts)) return;
    expect(pkg.scripts.prepare).toBe('npm run build');
  });

  it('`build` script cleans dist-types/ AND dist/ before invoking both tsc passes + prunes dist/ to runtime closure (Phase 26B)', () => {
    const pkg = readPackageJson();
    if (!isRecord(pkg.scripts)) throw new Error('scripts must be a record');
    expect(pkg.scripts.build).toBe(
      'npm run clean:types && npm run clean:dist && tsc -p tsconfig.build.json && tsc -p tsconfig.runtime.json && node scripts/prune-dist-runtime.mjs',
    );
  });

  it('`clean:types` uses a cross-platform Node rmSync command (IMP-008)', () => {
    const pkg = readPackageJson();
    if (!isRecord(pkg.scripts)) throw new Error('scripts must be a record');
    const cleanScript = pkg.scripts['clean:types'];
    expect(typeof cleanScript).toBe('string');
    if (typeof cleanScript !== 'string') return;
    expect(cleanScript.startsWith('node -e ')).toBe(true);
    expect(cleanScript).toContain('rmSync');
    expect(cleanScript).toContain('dist-types');
    expect(cleanScript).toContain('recursive: true');
    expect(cleanScript).toContain('force: true');
    // No shell-only commands.
    expect(cleanScript).not.toMatch(/\brm\s/);
    expect(cleanScript).not.toMatch(/\brmdir\b/);
  });
});

describe('Phase 24H — tsconfig.build.json carries load-bearing emit settings (IMP-001 / IMP-002)', () => {
  it('exists', () => {
    expect(existsSync(TSCONFIG_BUILD)).toBe(true);
  });

  it('extends ./tsconfig.json', () => {
    const cfg = readJson(TSCONFIG_BUILD);
    expect(isRecord(cfg)).toBe(true);
    if (!isRecord(cfg)) return;
    expect(cfg.extends).toBe('./tsconfig.json');
  });

  it('pins rootDir="." (load-bearing: pins dist-types/src/... emit path)', () => {
    const cfg = readJson(TSCONFIG_BUILD);
    if (!isRecord(cfg) || !isRecord(cfg.compilerOptions)) {
      throw new Error('tsconfig.build.json missing compilerOptions');
    }
    expect(cfg.compilerOptions.rootDir).toBe('.');
  });

  it('pins declaration=true, emitDeclarationOnly=true, noEmit=false, declarationDir="dist-types"', () => {
    const cfg = readJson(TSCONFIG_BUILD);
    if (!isRecord(cfg) || !isRecord(cfg.compilerOptions)) {
      throw new Error('tsconfig.build.json missing compilerOptions');
    }
    expect(cfg.compilerOptions.declaration).toBe(true);
    expect(cfg.compilerOptions.emitDeclarationOnly).toBe(true);
    expect(cfg.compilerOptions.noEmit).toBe(false);
    expect(cfg.compilerOptions.declarationDir).toBe('dist-types');
  });

  it('include is exactly ["src/**/*.ts"]', () => {
    const cfg = readJson(TSCONFIG_BUILD);
    if (!isRecord(cfg)) throw new Error('tsconfig.build.json not a record');
    expect(cfg.include).toEqual(['src/**/*.ts']);
  });

  it('excludes tests, scripts, fixtures, dist-types from emit', () => {
    const cfg = readJson(TSCONFIG_BUILD);
    if (!isRecord(cfg) || !Array.isArray(cfg.exclude)) {
      throw new Error('tsconfig.build.json missing exclude array');
    }
    for (const required of [
      'node_modules',
      'tests',
      'scripts',
      'fixtures',
      'dist-types',
    ]) {
      expect(cfg.exclude).toContain(required);
    }
  });
});

describe('Phase 24H — emitted declarations match exports map (IMP-011)', () => {
  it('every exports[*].types points at a real emitted file after build', () => {
    buildOnce();
    const pkg = readPackageJson();
    if (!isRecord(pkg.exports)) throw new Error('exports must be a record');
    for (const key of Object.keys(pkg.exports)) {
      const entry = pkg.exports[key];
      if (!isRecord(entry)) continue;
      const typesValue = entry.types;
      expect(typeof typesValue).toBe('string');
      if (typeof typesValue !== 'string') continue;
      // Mirrors how a real consumer resolves through `exports.types`.
      const absPath = resolve(ROOT, typesValue.replace(/^\.\//, ''));
      expect(
        existsSync(absPath),
        `exports["${key}"].types resolves to ${typesValue}, which must exist on disk after build`,
      ).toBe(true);
    }
  });

  it('top-level `types` also resolves to a real emitted file', () => {
    buildOnce();
    const pkg = readPackageJson();
    expect(typeof pkg.types).toBe('string');
    if (typeof pkg.types !== 'string') return;
    const absPath = resolve(ROOT, pkg.types.replace(/^\.\//, ''));
    expect(existsSync(absPath)).toBe(true);
  });

  it('declarations land under dist-types/src/straylight/ (NOT dist-types/straylight/)', () => {
    buildOnce();
    expect(existsSync(WEDGE_DTS)).toBe(true);
    expect(existsSync(HOST_DTS)).toBe(true);
    // If rootDir were inferred as src/, declarations would emit at the
    // shorter path below — that wrong shape MUST NOT be present.
    expect(existsSync(resolve(ROOT, 'dist-types/straylight/index.d.ts'))).toBe(
      false,
    );
    expect(
      existsSync(resolve(ROOT, 'dist-types/straylight/host/index.d.ts')),
    ).toBe(false);
  });
});

describe('Phase 24H + 26B — npm pack contents (IMP-004 / IMP-009 + ADR-026A)', () => {
  it('npm pack --dry-run includes README.md + package.json + dist-types/** + dist/** (Phase 26B widens to dist/)', () => {
    const output = runNpmPackDryRun();
    const parsed = JSON.parse(output) as PackResult[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    const firstResult = parsed[0];
    if (!firstResult || !Array.isArray(firstResult.files)) {
      throw new Error('npm pack --dry-run --json returned no files array');
    }
    const paths = firstResult.files.map((f) => f.path);
    // Required content (Phase 24H + 26B):
    //   - the wedge + host declaration files (Phase 24H);
    //   - the runtime/recall-intake declaration AND emitted JS (Phase 26B);
    //   - package.json + README (Phase 24H).
    expect(paths).toContain('dist-types/src/straylight/index.d.ts');
    expect(paths).toContain('dist-types/src/straylight/host/index.d.ts');
    expect(paths).toContain(
      'dist-types/src/straylight/runtime/recall-intake/index.d.ts',
    );
    expect(paths).toContain(
      'dist/src/straylight/runtime/recall-intake/index.js',
    );
    expect(paths).toContain('package.json');
    expect(paths).toContain('README.md');
    // Every shipped path MUST be one of: dist-types/**, dist/**, README.md,
    // package.json. No tsconfig, no vitest.config, no package-lock, no
    // `.npmignore` leakage.
    for (const path of paths) {
      const allowed =
        path === 'package.json' ||
        path === 'README.md' ||
        path.startsWith('dist-types/') ||
        path.startsWith('dist/');
      expect(allowed, `unexpected file in npm pack output: ${path}`).toBe(true);
    }
  });

  it('npm pack --dry-run excludes every forbidden prefix (IMP-004)', () => {
    const output = runNpmPackDryRun();
    const parsed = JSON.parse(output) as PackResult[];
    const firstResult = parsed[0];
    if (!firstResult || !Array.isArray(firstResult.files)) {
      throw new Error('npm pack --dry-run --json returned no files array');
    }
    const paths = firstResult.files.map((f) => f.path);
    // Forbidden working-tree content MUST NOT appear in the tarball.
    const forbiddenPrefixes = [
      'src/',
      'tests/',
      'scripts/',
      'fixtures/',
      'docs/',
      'node_modules/',
      '.run/',
      '.claude/',
      '.loa/',
      '.beads/',
      '.github/',
      'grimoires/',
    ];
    for (const path of paths) {
      for (const prefix of forbiddenPrefixes) {
        expect(
          path.startsWith(prefix),
          `npm pack output must not include ${path} (matches forbidden prefix ${prefix})`,
        ).toBe(false);
      }
    }
  });

  it('npm pack --dry-run excludes specific forbidden files (IMP-004)', () => {
    const output = runNpmPackDryRun();
    const parsed = JSON.parse(output) as PackResult[];
    const firstResult = parsed[0];
    if (!firstResult || !Array.isArray(firstResult.files)) {
      throw new Error('npm pack --dry-run --json returned no files array');
    }
    const paths = firstResult.files.map((f) => f.path);
    // Specific files that must never ship.
    const forbiddenExact = [
      'package-lock.json',
      'vitest.config.ts',
      '.npmrc',
      '.gitignore',
      'tsconfig.json',
      'tsconfig.build.json',
    ];
    for (const exact of forbiddenExact) {
      expect(
        paths.includes(exact),
        `npm pack output must not include ${exact}`,
      ).toBe(false);
    }
    // No tsconfig* of any name.
    for (const path of paths) {
      expect(
        /(?:^|\/)tsconfig[^/]*\.json$/.test(path),
        `npm pack output must not include any tsconfig*.json file: ${path}`,
      ).toBe(false);
    }
  });

  it('npm pack --dry-run dist-types/ entries are only .d.ts (or .d.ts.map) declaration files (IMP-004)', () => {
    const output = runNpmPackDryRun();
    const parsed = JSON.parse(output) as PackResult[];
    const firstResult = parsed[0];
    if (!firstResult || !Array.isArray(firstResult.files)) {
      throw new Error('npm pack --dry-run --json returned no files array');
    }
    const paths = firstResult.files.map((f) => f.path);
    // The committed dist-types/ artifact must only carry declaration-side
    // outputs. No .js, no .ts source, no .json, no map noise.
    for (const path of paths) {
      if (!path.startsWith('dist-types/')) continue;
      const allowed =
        path.endsWith('.d.ts') || path.endsWith('.d.ts.map');
      expect(
        allowed,
        `dist-types/ entry must be a declaration file, got ${path}`,
      ).toBe(true);
    }
  });

  it('npm pack --dry-run dist/ entries are only .js (or .js.map) emitted runtime files (Phase 26B)', () => {
    const output = runNpmPackDryRun();
    const parsed = JSON.parse(output) as PackResult[];
    const firstResult = parsed[0];
    if (!firstResult || !Array.isArray(firstResult.files)) {
      throw new Error('npm pack --dry-run --json returned no files array');
    }
    const paths = firstResult.files.map((f) => f.path);
    // The dist/ artifact carries emitted JS; no .ts source, no .d.ts
    // (that's dist-types/), no .json, no leaked tsconfig output.
    for (const path of paths) {
      if (!path.startsWith('dist/')) continue;
      const allowed = path.endsWith('.js') || path.endsWith('.js.map');
      expect(
        allowed,
        `dist/ entry must be an emitted JS file, got ${path}`,
      ).toBe(true);
    }
  });
});

describe('Phase 24H — one-way wedge↔host dependency invariant is automated NOW (SKP-006)', () => {
  // The invariant ("src/straylight/index.ts must not import from ./host/")
  // is enforced by tests/phase-24c-host-surface-shape.test.ts. This block
  // does NOT duplicate the assertion — it records the delegation so that
  // any future test-file move or rename is forced to update both this
  // pointer AND the wording in ADR-024G + the Phase 24H handoff that
  // claim the invariant is automated.
  it('phase-24c-host-surface-shape.test.ts exists and pins the invariant', () => {
    expect(existsSync(HOST_GUARD_TEST)).toBe(true);
    const text = readFileSync(HOST_GUARD_TEST, 'utf8');
    expect(text).toContain(
      "src/straylight/index.ts does not import from ./host/",
    );
    expect(text).toContain(
      'every existing wedge module source file does not import from ./host/',
    );
  });
});
