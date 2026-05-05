// CLI entrypoint for the Straylight Recall Wedge demo.
//
// Usage:
//   npm run demo:recall                     human-readable transcript
//   npm run demo:recall:json                JSON to .run/recall-demo.json
//   npm run demo:recall -- --json           JSON to stdout
//   npm run demo:recall -- --json --out=.run/recall-demo.json
//
// All demo logic lives in ./demo-recall-wedge.lib.ts so tests can import
// `runDemo` without triggering CLI side effects.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { runDemo, toDemoJson } from './demo-recall-wedge.lib.js';

interface CliFlags {
  json: boolean;
  outPath?: string;
}

function parseFlags(argv: readonly string[]): CliFlags {
  const flags: CliFlags = { json: false };
  for (const arg of argv) {
    if (arg === '--json') flags.json = true;
    else if (arg.startsWith('--out=')) flags.outPath = arg.slice('--out='.length);
    else if (arg === '--help' || arg === '-h') {
      printHelpAndExit();
    } else {
      console.error(`unknown flag: ${arg}`);
      process.exitCode = 2;
      printHelpAndExit();
    }
  }
  return flags;
}

function printHelpAndExit(): never {
  console.error(
    [
      'Usage: demo-recall-wedge [--json] [--out=<path>]',
      '',
      '  (no flags)              human-readable transcript',
      '  --json                  emit JSON instead (suppresses transcript)',
      '  --out=<path>            write JSON to <path> instead of stdout',
      '',
      'Outputs are local-only. The .run/ directory is gitignored.',
    ].join('\n'),
  );
  process.exit(process.exitCode ?? 0);
}

function writeJson(out: unknown, pathArg: string): string {
  const target = resolve(process.cwd(), pathArg);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  return target;
}

try {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.json) {
    const result = runDemo({ silent: true });
    const json = toDemoJson(result);
    if (flags.outPath) {
      const target = writeJson(json, flags.outPath);
      console.log(`wrote ${target}`);
    } else {
      process.stdout.write(`${JSON.stringify(json, null, 2)}\n`);
    }
  } else {
    runDemo();
    if (flags.outPath) {
      console.error('--out only takes effect with --json; ignoring');
    }
  }
} catch (err) {
  console.error('demo failed:', err);
  process.exitCode = 1;
}
