#!/usr/bin/env node
// Capture a live cp-lane's DURABLE history as a hermetic replay fixture.
//
// The control-plane golden-history proof (tests/control-plane/lane-history-
// golden.test.ts) must be able to replay every real lane offline and assert
// that the disposition of every historical protocol event is unchanged. This
// tool produces those fixtures from the GitHub API.
//
// WHAT IS CAPTURED (and why it is sufficient)
//
//   Reconstruction (reconstruct.mjs) consumes exactly four things per comment:
//     id          - ordering, and earlier-than binding of referenced artifacts
//     user        - the AUTHENTICATED commenter login (identity binding)
//     created_at  - GitHub-recorded post time: the authoritative event time
//     updated_at  - GitHub-recorded edit time (edited protocol comment -> R5)
//   ...plus the protocol payloads embedded in the body. Bodies are therefore
//   stored at PAYLOAD level (parsed JSON per marker), not as raw text: prose
//   around a marker is inert to the reducer, and payload-level storage keeps
//   the fixtures reviewable. Digests survive because payloadDigest() hashes
//   the CANONICALIZED PARSED payload, and renderPayload() is the exact inverse
//   of extractPayload() for well-formed input.
//
//   Fidelity is not asserted, it is PROVEN: this tool replays the raw bodies
//   and the re-rendered bodies and refuses to write a fixture unless both
//   produce identical lane records, dispositions, labels, and frozen flags.
//
// A reducer-result / watchdog-result / prose comment carries no protocol
// marker and is inert to replay; it is captured as metadata only (its
// non-protocol markers recorded as documentation) and rebuilt as a
// marker-free placeholder. Prior reducer-result comments are NEVER authority:
// the fixture is reconstructed from genesis + protocol comments alone.
//
// EVIDENCE BINDING. Both files record `source_main_sha` — the commit whose
// working tree produced them. The golden suite pins the SHA-256 of every file
// this tool writes (tests/control-plane/lane-history-golden.test.ts,
// LANE_HISTORY_EVIDENCE_LOCKS) and verifies those digests BEFORE using the
// files as migration evidence, so regenerating a baseline is no longer an
// invisible data-only operation: it requires a reviewed code change too.
//
// VERSION-AGNOSTIC ADMISSION READ. The baseline must be capturable under the
// policy schema in force at capture time (v1, four top-level admission fields)
// AND re-capturable later (v2, admission epochs). `admissionOf` below resolves
// the CURRENT admission policy from whichever shape it is given, so the tool
// never depends on a top-level projection field existing.
//
// Usage:
//   node scripts/capture-cp-lane-history.mjs --issue 122 \
//     [--repo 0xHoneyJar/loa-straylight] \
//     [--policy .straylight/automation-policy.json] \
//     [--out tests/control-plane/fixtures/lane-history]
//
//   --baseline  additionally write <lane>.baseline.json: the disposition
//               vector produced by the CURRENT working tree. Generate this
//               BEFORE a replay-affecting change and never regenerate it to
//               "make the tests pass" — that would destroy the proof.
//
// Read-only: issues/comments are fetched with GET only. Nothing is posted,
// edited, labelled, or merged.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MARKERS, extractPayload, renderPayload } from "../.straylight/lib/markers.mjs";
import { reconstructLane } from "../.straylight/lib/reconstruct.mjs";
import { loadProtocolPolicy } from "../.straylight/lib/policy-source.mjs";

// The three markers that make a comment a PROTOCOL comment (reconstruct.mjs).
const PROTOCOL_MARKERS = Object.freeze({
  event: MARKERS.event,
  task_packet: MARKERS.taskPacket,
  audit: MARKERS.audit,
});
const MARKER_RE = /<!--\s*(straylight:[a-z-]+:v\d+)\s*-->/g;

// The four replay-sensitive admission fields, canonical order.
const ADMISSION_KEYS = Object.freeze([
  "actor_allowlist",
  "authorized_corridor",
  "lease_duration_minutes",
  "maximum_patch_cycles",
]);

// The wall clock that was pinned when this evidence was first captured,
// recorded in the baseline as provenance. It is NOT passed to reconstruction:
// reconstructLane takes no clock at all and reads every event's admission time
// from the authenticated comment created_at. The value is retained so a
// re-capture reproduces the committed baselines byte-identically, and so the
// record states plainly which instant the original capture ran at.
export const FIXTURE_REPLAY_NOW = "2026-08-14T12:00:00Z";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

// `gh api --paginate` (gh 2.45) emits ONE JSON document per page, concatenated
// with no separator, so `[a,b][c,d]` is a legal response for a 2-page list.
// Split on top-level document boundaries (string- and escape-aware) and
// concatenate array pages; object responses are single-document.
function splitJsonDocuments(text) {
  const docs = [];
  let depth = 0, start = -1, inString = false, escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "[" || ch === "{") { if (depth === 0) start = i; depth += 1; continue; }
    if (ch === "]" || ch === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) { docs.push(text.slice(start, i + 1)); start = -1; }
    }
  }
  if (depth !== 0) die("unbalanced JSON in gh api response");
  return docs.map((d) => JSON.parse(d));
}

function gh(path) {
  const out = execFileSync("gh", ["api", "--paginate", path], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  const docs = splitJsonDocuments(out);
  if (docs.length === 0) die(`empty response for ${path}`);
  if (docs.length === 1) return docs[0];
  if (!docs.every((d) => Array.isArray(d))) die(`cannot merge ${docs.length} non-array pages for ${path}`);
  return docs.flat();
}

function die(msg) {
  process.stderr.write(`capture-cp-lane-history: ${msg}\n`);
  process.exit(1);
}

// The commit whose working tree is producing this evidence. Recorded in both
// files so the proof names the exact substrate it was captured from.
function sourceMainSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// CURRENT admission policy, resolved from either policy shape: under v2 the
// final epoch of `admission_history` is current policy; under v1 the four
// top-level fields were. Recorded as evidence of what the capture ran under —
// never used to adjudicate anything.
function admissionOf(policy) {
  const history = policy?.admission_history;
  const source = Array.isArray(history) && history.length > 0
    ? history[history.length - 1]
    : policy;
  const out = {};
  for (const k of ADMISSION_KEYS) out[k] = source?.[k] ?? null;
  out.epoch_id = Array.isArray(history) && history.length > 0
    ? (history[history.length - 1]?.epoch_id ?? null)
    : null;
  return out;
}

// Every straylight marker occurring in a body, with its occurrence count.
function markerCounts(body) {
  const counts = new Map();
  for (const m of String(body ?? "").matchAll(MARKER_RE)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  return counts;
}

// Capture one body at payload level. Refuses shapes the fixture format cannot
// represent faithfully (a duplicated protocol marker is ambiguity that
// extractPayload rejects; encoding it would require encoding the ambiguity).
function captureBody(body, where) {
  const counts = markerCounts(body);
  const payloads = {};
  const unreadable = {};
  for (const [key, marker] of Object.entries(PROTOCOL_MARKERS)) {
    const n = counts.get(marker) ?? 0;
    if (n === 0) continue;
    if (n > 1) die(`${where}: ${marker} appears ${n} times; fixture format cannot represent marker ambiguity`);
    const p = extractPayload(body, marker);
    if (p.ok) payloads[key] = p.value;
    else unreadable[key] = p.reason;
  }
  if (Object.keys(unreadable).length > 0) {
    die(`${where}: protocol marker present but payload unreadable (${JSON.stringify(unreadable)}); fixture format cannot represent malformed payloads`);
  }
  const otherMarkers = [...counts.keys()]
    .filter((m) => !Object.values(PROTOCOL_MARKERS).includes(m))
    .sort();
  return { payloads, otherMarkers };
}

// Rebuild a comment/issue body from captured payloads. Marker order is fixed
// (event, task_packet, audit) so the fixture is stable across captures.
export function renderCapturedBody(payloads) {
  const parts = [];
  for (const [key, marker] of Object.entries(PROTOCOL_MARKERS)) {
    if (payloads[key] !== undefined) parts.push(renderPayload(marker, payloads[key]));
  }
  return parts.join("\n\n");
}

export function fixtureToInput(fixture) {
  return {
    issue_body: renderPayload(MARKERS.lane, fixture.genesis_lane),
    comments: fixture.comments.map((c) => ({
      id: c.id,
      user: c.user,
      created_at: c.created_at,
      updated_at: c.updated_at,
      body: renderCapturedBody(c.payloads ?? {}),
    })),
  };
}

function projection(result) {
  return {
    ok: result.ok,
    refusal: result.refusal ?? null,
    detail: result.detail ?? null,
    frozen: result.frozen ?? null,
    labels: result.labels ?? [],
    lane: result.lane ?? null,
    dispositions: result.dispositions ?? [],
  };
}

function main() {
  const issue = arg("--issue");
  if (!issue || !/^\d+$/.test(issue)) die("--issue <number> is required");
  const repo = arg("--repo", "0xHoneyJar/loa-straylight");
  const outDir = arg("--out", join("tests", "control-plane", "fixtures", "lane-history"));
  const policyPath = arg("--policy", join(".straylight", "automation-policy.json"));
  const writeBaseline = process.argv.includes("--baseline");

  const loadedPolicy = loadProtocolPolicy({
    committedPath: join(fileURLToPath(new URL("..", import.meta.url)), ".straylight", "automation-policy.json"),
    overridePath: policyPath,
  });
  if (!loadedPolicy.ok) die(`policy ${policyPath}: ${loadedPolicy.refusal} (${loadedPolicy.detail})`);
  const policy = loadedPolicy.value;

  const issueJson = gh(`repos/${repo}/issues/${issue}`);
  const rawComments = gh(`repos/${repo}/issues/${issue}/comments?per_page=100`);
  if (!Array.isArray(rawComments)) die("unexpected comments payload shape");

  const genesis = extractPayload(issueJson.body ?? "", MARKERS.lane);
  if (!genesis.ok) die(`issue #${issue} body has no readable lane payload (${genesis.reason})`);

  const comments = rawComments.map((c) => {
    const where = `comment ${c.id}`;
    const { payloads, otherMarkers } = captureBody(c.body ?? "", where);
    const login = c.user?.login;
    if (typeof login !== "string") die(`${where}: missing authenticated commenter login`);
    if (typeof c.created_at !== "string") die(`${where}: missing created_at`);
    const entry = {
      id: c.id,
      user: login,
      created_at: c.created_at,
      updated_at: typeof c.updated_at === "string" ? c.updated_at : c.created_at,
      payloads,
    };
    if (otherMarkers.length > 0) entry.non_protocol_markers = otherMarkers;
    return entry;
  });

  const fixture = {
    _comment: [
      "DURABLE cp-lane history captured from the GitHub API for offline replay.",
      "Bodies are stored at payload level; renderPayload() rebuilds them exactly.",
      "Regenerate with: node scripts/capture-cp-lane-history.mjs --issue " + issue,
      "NEVER hand-edit: this is evidence, not configuration.",
      "Its SHA-256 is pinned in tests/control-plane/lane-history-golden.test.ts.",
    ].join(" "),
    repository: repo,
    issue_number: Number(issue),
    source_main_sha: sourceMainSha(),
    lane_id: genesis.value.lane_id,
    genesis_lane: genesis.value,
    comment_count: comments.length,
    comments,
  };

  // PROOF OF FIDELITY: the payload-level fixture must replay identically to
  // the raw API bodies. Anything else means the capture lost authority-bearing
  // content, and the fixture is refused rather than written.
  const rawInput = {
    issue_body: issueJson.body ?? "",
    comments: rawComments.map((c) => ({
      id: c.id,
      user: c.user?.login,
      body: c.body ?? "",
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
  };
  // No clock is supplied to either replay: the fixture is faithful only if the
  // authenticated created_at values it carries reproduce the raw bodies' own
  // dispositions on their own.
  const fromRaw = projection(reconstructLane({ ...rawInput, policy }));
  const fromFixture = projection(reconstructLane({ ...fixtureToInput(fixture), policy }));
  if (JSON.stringify(fromRaw) !== JSON.stringify(fromFixture)) {
    die(
      `fixture is NOT faithful to the raw API bodies for issue #${issue}; refusing to write.\n` +
        `raw:     ${JSON.stringify(fromRaw.lane?.state)}@${fromRaw.lane?.event_sequence}\n` +
        `fixture: ${JSON.stringify(fromFixture.lane?.state)}@${fromFixture.lane?.event_sequence}`,
    );
  }

  mkdirSync(outDir, { recursive: true });
  const stem = `lane-${issue}`;
  writeFileSync(join(outDir, `${stem}.json`), JSON.stringify(fixture, null, 2) + "\n");
  process.stdout.write(
    `wrote ${join(outDir, `${stem}.json`)} (${comments.length} comments, fidelity proven)\n`,
  );

  if (writeBaseline) {
    const applied = fromRaw.dispositions.filter((d) => d.status === "applied").length;
    const refused = fromRaw.dispositions.filter((d) => d.status === "refused").length;
    const admission = admissionOf(policy);
    const baseline = {
      _comment: [
        "GOLDEN BASELINE: the disposition of every historical protocol event,",
        "captured from the code and policy in effect when this file was written.",
        "It is the pre-migration answer that any later replay architecture must",
        "reproduce byte-identically. Regenerating this file to make a test pass",
        "destroys the proof it exists to provide, and its SHA-256 is pinned in",
        "tests/control-plane/lane-history-golden.test.ts.",
      ].join(" "),
      repository: repo,
      issue_number: Number(issue),
      source_main_sha: sourceMainSha(),
      replay_now: FIXTURE_REPLAY_NOW,
      policy_schema: policy.schema,
      admission,
      summary: { state: fromRaw.lane?.state, event_sequence: fromRaw.lane?.event_sequence, applied, refused },
      ok: fromRaw.ok,
      frozen: fromRaw.frozen,
      labels: fromRaw.labels,
      lane: fromRaw.lane,
      dispositions: fromRaw.dispositions,
    };
    writeFileSync(join(outDir, `${stem}.baseline.json`), JSON.stringify(baseline, null, 2) + "\n");
    process.stdout.write(
      `wrote ${join(outDir, `${stem}.baseline.json`)} — ${baseline.summary.state}@${baseline.summary.event_sequence} ` +
        `(${applied} applied / ${refused} refused, policy ${policy.schema} lease ${admission.lease_duration_minutes}m)\n`,
    );
  }
}

// Run ONLY as a CLI. The golden-history test imports fixtureToInput from this
// module so the fixtures it replays are rebuilt by the very function whose
// fidelity was proven at capture time — importing must not fetch anything.
function invokedDirectly() {
  if (typeof process.argv[1] !== "string") return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) main();
