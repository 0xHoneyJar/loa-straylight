#!/usr/bin/env node
// Phase 50A — THE REAL PROCESS-TREE FIXTURE.
//
// A GENUINE process that spawns a GENUINE child which spawns a GENUINE
// grandchild. Three real operating-system processes, three real pids, all of
// them long-lived enough to still be running when the executor's bound lapses.
//
// WHY A REAL FIXTURE IS REQUIRED. The sequence-54 audit found that the previous
// suites synthesized timeout outcomes and asserted only on the successor-launch
// count. Those suites stayed green while the automatic run left six real
// descendants alive until the hosted runner's cleanup killed them, because a
// synthesized outcome cannot exhibit the defect: the defect was that a real
// grandchild outlived a terminated direct child. Only real processes can prove
// the remedy, so this fixture is load-bearing and a stubbed outcome may
// supplement it but never replace it.
//
// WHAT IT RECORDS. Each generation appends one line to the file named by
// PHASE_50A_FIXTURE_RECORD as soon as it starts:
//
//   {"generation":"root"|"child"|"grandchild","pid":<n>,"pgid":<n>}
//
// so the test can read back the actual identities and probe each pid's liveness
// itself. The pgid is recorded per generation, which is what proves descendants
// really inherited the leader's group rather than landing elsewhere.
//
// MODES, via PHASE_50A_FIXTURE_MODE:
//
//   "hang"        every generation ignores nothing and simply sleeps far past
//                 any bound. Proves ordinary whole-group termination.
//   "trap"        every generation INSTALLS A HANDLER for the polite signal
//                 and keeps running. Proves escalation is required and
//                 sufficient: a design that only sends the first signal leaves
//                 this tree alive and must fail the test.
//
// The fixture never touches the network, the repository tree, or any
// credential; it writes only to the record path the test hands it, inside a
// temporary directory the test owns. It reads no environment value other than
// its own two variables, and it echoes nothing.
//
// Node builtins only, so it runs under the same constraint as the executor.

import { spawn } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const RECORD = process.env.PHASE_50A_FIXTURE_RECORD;
const MODES = new Set(["hang", "trap", "orphan"]);
const REQUESTED_MODE = process.env.PHASE_50A_FIXTURE_MODE;
const MODE = MODES.has(REQUESTED_MODE) ? REQUESTED_MODE : "hang";
const GENERATION = process.env.PHASE_50A_FIXTURE_GENERATION ?? "root";

/**
 * How long the ROOT waits before exiting cleanly in "orphan" mode.
 *
 * Long enough that its descendants have certainly started and recorded
 * themselves, short enough that the direct child's own exit is what ends the
 * executor's wait — no bound has to lapse for this case to arise.
 */
const ORPHAN_ROOT_EXIT_MS = 250;

// A bound far beyond any test's own timeout: the fixture must be killed by the
// executor under test, never allowed to exit on its own and mask a failure to
// terminate it. Vitest's per-test timeout and the executor's bound are both far
// smaller, so an exit here is itself evidence of a bug in the fixture.
const SLEEP_MS = 600_000;

/**
 * This process's own process-group id.
 *
 * Node exposes no `getpgrp`, so the value is read from the Linux process table
 * (`/proc/self/stat` field 5, after the comm field — which may itself contain
 * spaces or parentheses, hence the split on the LAST closing parenthesis).
 * Returns null where the process table is unavailable, so the fixture still
 * records its pid rather than dying and starving the test of evidence.
 */
function ownProcessGroup() {
  try {
    const stat = readFileSync("/proc/self/stat", "utf8");
    const afterComm = stat.slice(stat.lastIndexOf(")") + 2);
    const fields = afterComm.split(" ");
    // fields[0] is state, [1] ppid, [2] pgrp.
    const pgrp = Number(fields[2]);
    return Number.isInteger(pgrp) && pgrp > 0 ? pgrp : null;
  } catch {
    return null;
  }
}

function record(generation) {
  if (typeof RECORD !== "string" || RECORD.length === 0) return;
  const line = JSON.stringify({
    generation,
    pid: process.pid,
    // Own process-group id. For the root this equals its own pid when the
    // launcher detached it; the child and grandchild must report the SAME
    // value, which is what proves group inheritance down the tree.
    pgid: ownProcessGroup(),
  });
  appendFileSync(RECORD, line + "\n");
}

record(GENERATION);

if (MODE === "trap") {
  // Deliberately survive the polite signal. Escalation with an uncatchable
  // signal is the only thing that may end this process.
  process.on("SIGTERM", () => {
    // Ignored on purpose. No exit, no re-raise.
  });
  process.on("SIGINT", () => {
    // Ignored on purpose.
  });
}

// Spawn the next generation, inheriting this process's group (NOT detached:
// inheritance is the point — the whole tree must share the root's group so one
// group id names all of it).
const NEXT = { root: "child", child: "grandchild" };
const next = NEXT[GENERATION];
if (next) {
  const child = spawn(process.execPath, [import.meta.filename], {
    shell: false,
    detached: false,
    stdio: ["ignore", "ignore", "ignore"],
    env: {
      PATH: process.env.PATH,
      PHASE_50A_FIXTURE_RECORD: RECORD,
      PHASE_50A_FIXTURE_MODE: MODE,
      PHASE_50A_FIXTURE_GENERATION: next,
    },
  });
  // Do not let this process exit merely because the next generation is still
  // running, and do not report the next generation's failure as our own.
  child.on("error", () => {});
}

// "orphan" MODE — THE NATURAL-EXIT / LIVE-DESCENDANT CASE.
//
// The ROOT (the executor's direct child) exits CLEANLY with status 0 shortly
// after its descendants are up, while those descendants keep running far past
// any bound. No timeout is involved: the executor stops waiting because its
// direct child genuinely finished. A design that treats "the direct child
// exited" as "the tree is gone" leaves the child and grandchild running here,
// which is exactly the defect this mode exists to exhibit. Only the root
// returns early; later generations fall through to the long sleep below.
if (MODE === "orphan" && GENERATION === "root") {
  setTimeout(() => {
    process.exit(0);
  }, ORPHAN_ROOT_EXIT_MS);
} else {
  // Sleep, holding the process alive. `unref` is deliberately NOT called: the
  // timer must keep the event loop alive so the process is genuinely present for
  // the executor to find, signal, and prove gone.
  setTimeout(() => {
    process.exit(0);
  }, SLEEP_MS);
}
