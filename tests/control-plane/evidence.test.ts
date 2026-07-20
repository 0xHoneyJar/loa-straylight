// Control Plane v1 — shared raw-evidence parser (evidence.mjs).
//
// Executable coverage for the workflow-boundary evidence invariants:
//   N1 global uniqueness (issue numbers, comment IDs, check-run IDs,
//      combined-status IDs — duplicates refuse even with consistent totals);
//   N2 exact-equality target binding (repository / issue / PR / exact SHA,
//      never substring — evil-prefix/suffix URLs must fail);
//   N5 timestamp chronology (strict parsed instants, updated_at >=
//      created_at; malformed / missing-where-required / reversed refuse);
//   stream discipline (zero-byte stream invalid; one parsed [] page is
//      valid empty evidence; junk/truncation/duplicate keys refuse).

import { describe, it, expect } from "vitest";
import {
  parsePageStream,
  parseSingleDocument,
  parseIssuePages,
  parseIssue,
  parseCommentPages,
  parsePr,
  parseCheckRunPages,
  parseCombinedStatus,
} from "../../.straylight/lib/evidence.mjs";
import { REPO, HEAD_SHA, NOW } from "./_fixtures.js";

const API = "https://api.github.com";
const T0 = "2026-07-16T11:00:00Z";
const T1 = NOW; // 2026-07-16T12:00:00Z — after T0

function issueEntry(n: number, overrides: Record<string, any> = {}) {
  return {
    number: n,
    url: `${API}/repos/${REPO}/issues/${n}`,
    body: `issue ${n}`,
    created_at: T0,
    updated_at: T1,
    ...overrides,
  };
}

function commentEntry(id: number, issue: number, overrides: Record<string, any> = {}) {
  return {
    id,
    url: `${API}/repos/${REPO}/issues/comments/${id}`,
    issue_url: `${API}/repos/${REPO}/issues/${issue}`,
    user: { login: "github-actions[bot]" },
    body: `comment ${id}`,
    created_at: T0,
    updated_at: T0,
    ...overrides,
  };
}

function prDoc(n: number, overrides: Record<string, any> = {}) {
  return {
    number: n,
    url: `${API}/repos/${REPO}/pulls/${n}`,
    state: "open",
    draft: false,
    merged: false,
    base: { ref: "main", sha: "009c4afe34f3f7151db4239fe1c69898833440bb", repo: { full_name: REPO } },
    head: { ref: "phase-49p-sibling-evidence-intake", sha: HEAD_SHA },
    created_at: T0,
    updated_at: T1,
    ...overrides,
  };
}

function checkRun(id: number, overrides: Record<string, any> = {}) {
  return {
    id,
    url: `${API}/repos/${REPO}/check-runs/${id}`,
    head_sha: HEAD_SHA,
    conclusion: "success",
    ...overrides,
  };
}

function statusEntry(id: number, overrides: Record<string, any> = {}) {
  return { id, context: `ci/check-${id}`, state: "success", ...overrides };
}

function combinedDoc(overrides: Record<string, any> = {}) {
  const statuses = overrides.statuses ?? [statusEntry(1), statusEntry(2)];
  return {
    state: "success",
    sha: HEAD_SHA,
    total_count: statuses.length,
    statuses,
    repository: { full_name: REPO },
    ...overrides,
  };
}

const pages = (...arrs: unknown[]) => arrs.map((p) => JSON.stringify(p)).join("");

// =============================================================================
// Stream discipline
// =============================================================================
describe("evidence stream discipline", () => {
  it("a zero-byte stream is INVALID — a failed fetch is never empty evidence", () => {
    for (const empty of ["", "   ", "\n\t "]) {
      const r = parsePageStream(empty);
      expect(r.ok).toBe(false);
      expect((r as any).reason).toBe("empty-stream");
    }
    const single = parseSingleDocument("");
    expect(single.ok).toBe(false);
    expect((single as any).reason).toBe("empty-stream");
  });

  it("one parsed [] page IS valid empty evidence", () => {
    const r = parsePageStream("[]");
    expect(r).toMatchObject({ ok: true, pages: [[]] });
    const issues = parseIssuePages("[]", { repository: REPO });
    expect(issues).toMatchObject({ ok: true, issues: [], excluded_prs: [] });
    const comments = parseCommentPages("[]", { repository: REPO, issue_number: 41 });
    expect(comments).toMatchObject({ ok: true, comments: [] });
  });

  it("truncation, junk between documents, and imbalance refuse the whole stream", () => {
    for (const badStream of ['[{"number": 1', "[]garbage[]", '"bare string"', "[[]", "[]}"]) {
      const r = parsePageStream(badStream);
      expect(r.ok, badStream).toBe(false);
    }
  });

  it("duplicate object keys anywhere refuse the document (strict parse, not JSON.parse)", () => {
    const r = parsePageStream('[{"number": 1, "number": 2}]');
    expect(r.ok).toBe(false);
    expect((r as any).reason).toBe("document-malformed");
    const s = parseSingleDocument('{"state": "success", "state": "failure"}');
    expect(s.ok).toBe(false);
  });

  it("multiple concatenated pages parse as separate documents (gh --paginate shape)", () => {
    const r = parsePageStream(pages([issueEntry(1)], [issueEntry(2)]));
    expect(r.ok).toBe(true);
    expect((r as any).pages).toHaveLength(2);
  });
});

// =============================================================================
// N1 — global uniqueness
// =============================================================================
describe("N1 — global uniqueness across the complete paginated response", () => {
  it("duplicate issue numbers refuse — same page and across pages", () => {
    const same = parseIssuePages(pages([issueEntry(5), issueEntry(5)]), { repository: REPO });
    expect(same).toMatchObject({ ok: false, reason: "duplicate-issue-number" });
    const cross = parseIssuePages(pages([issueEntry(5)], [issueEntry(5)]), { repository: REPO });
    expect(cross).toMatchObject({ ok: false, reason: "duplicate-issue-number" });
  });

  it("a PR and an issue sharing a number is a duplicate (they share the number space)", () => {
    const r = parseIssuePages(
      pages([issueEntry(7), issueEntry(7, { pull_request: { url: "x" } })]),
      { repository: REPO },
    );
    expect(r).toMatchObject({ ok: false, reason: "duplicate-issue-number" });
  });

  it("duplicate comment IDs refuse across pages", () => {
    const r = parseCommentPages(
      pages([commentEntry(100, 41)], [commentEntry(100, 41)]),
      { repository: REPO, issue_number: 41 },
    );
    expect(r).toMatchObject({ ok: false, reason: "duplicate-comment-id" });
  });

  it("a duplicated PASSING check run never compensates for an omitted failing one", () => {
    // total_count 2, but the same passing run appears twice — refused even
    // though the count is consistent.
    const page = { total_count: 2, check_runs: [checkRun(9), checkRun(9)] };
    const r = parseCheckRunPages(JSON.stringify(page), { repository: REPO, sha: HEAD_SHA });
    expect(r).toMatchObject({ ok: false, reason: "duplicate-check-run-id" });
  });

  it("duplicate combined-status IDs refuse even with a consistent total", () => {
    const doc = combinedDoc({ statuses: [statusEntry(3), statusEntry(3)], total_count: 2 });
    const r = parseCombinedStatus(JSON.stringify(doc), { repository: REPO, sha: HEAD_SHA });
    expect(r).toMatchObject({ ok: false, reason: "duplicate-status-id" });
  });
});

// =============================================================================
// N2 — exact-equality target binding
// =============================================================================
describe("N2 — every object binds to the expected repository/issue/PR/SHA", () => {
  it("wrong-repository issue URL refuses (exact equality, never substring)", () => {
    for (const evil of [
      `${API}/repos/evil/loa-straylight/issues/5`,
      `${API}/repos/${REPO}-evil/issues/5`,
      `https://evil.example/${API.slice(8)}/repos/${REPO}/issues/5`,
      `${API}/repos/${REPO}/issues/5?x=1`,
    ]) {
      const r = parseIssuePages(pages([issueEntry(5, { url: evil })]), { repository: REPO });
      expect(r, evil).toMatchObject({ ok: false, reason: "binding-url-mismatch" });
    }
  });

  it("single-issue fetch binds number AND url; a swapped issue refuses", () => {
    const wrongNumber = parseIssue(JSON.stringify(issueEntry(42)), { repository: REPO, issue_number: 41 });
    expect(wrongNumber).toMatchObject({ ok: false, reason: "binding-issue-mismatch" });
    const wrongUrl = parseIssue(
      JSON.stringify(issueEntry(41, { url: `${API}/repos/other/repo/issues/41` })),
      { repository: REPO, issue_number: 41 },
    );
    expect(wrongUrl).toMatchObject({ ok: false, reason: "binding-url-mismatch" });
  });

  it("an issue that is a pull request refuses at the single-issue fetch", () => {
    const r = parseIssue(
      JSON.stringify(issueEntry(41, { pull_request: { url: "x" } })),
      { repository: REPO, issue_number: 41 },
    );
    expect(r).toMatchObject({ ok: false, reason: "issue-is-pull-request" });
  });

  it("comment bytes filed under another issue refuse via issue_url binding", () => {
    const r = parseCommentPages(
      pages([commentEntry(100, 99)]), // issue_url claims issue 99
      { repository: REPO, issue_number: 41 },
    );
    expect(r).toMatchObject({ ok: false, reason: "binding-issue-mismatch" });
  });

  it("comment url must bind to its own id exactly", () => {
    const r = parseCommentPages(
      pages([commentEntry(100, 41, { url: `${API}/repos/${REPO}/issues/comments/101` })]),
      { repository: REPO, issue_number: 41 },
    );
    expect(r).toMatchObject({ ok: false, reason: "binding-url-mismatch" });
  });

  it("PR fetch binds number, url, and base.repo.full_name", () => {
    const ok = parsePr(JSON.stringify(prDoc(117)), { repository: REPO, pr_number: 117 });
    expect(ok.ok).toBe(true);
    expect((ok as any).pr).toMatchObject({ fetch_ok: true, pr_number: 117, repository: REPO });

    const wrongNum = parsePr(JSON.stringify(prDoc(118)), { repository: REPO, pr_number: 117 });
    expect(wrongNum).toMatchObject({ ok: false, reason: "binding-pr-mismatch" });

    const wrongRepo = parsePr(
      JSON.stringify(prDoc(117, { base: { ...prDoc(117).base, repo: { full_name: "evil/repo" } } })),
      { repository: REPO, pr_number: 117 },
    );
    expect(wrongRepo).toMatchObject({ ok: false, reason: "binding-repository-mismatch" });
  });

  it("check runs bind to the exact expected head SHA and repository URL", () => {
    const wrongSha = parseCheckRunPages(
      JSON.stringify({ total_count: 1, check_runs: [checkRun(9, { head_sha: "1111111111111111111111111111111111111111" })] }),
      { repository: REPO, sha: HEAD_SHA },
    );
    expect(wrongSha).toMatchObject({ ok: false, reason: "binding-sha-mismatch" });
    const wrongRepo = parseCheckRunPages(
      JSON.stringify({ total_count: 1, check_runs: [checkRun(9, { url: `${API}/repos/evil/repo/check-runs/9` })] }),
      { repository: REPO, sha: HEAD_SHA },
    );
    expect(wrongRepo).toMatchObject({ ok: false, reason: "binding-url-mismatch" });
  });

  it("combined status binds response sha and repository exactly", () => {
    const wrongSha = parseCombinedStatus(
      JSON.stringify(combinedDoc({ sha: "1111111111111111111111111111111111111111" })),
      { repository: REPO, sha: HEAD_SHA },
    );
    expect(wrongSha).toMatchObject({ ok: false, reason: "binding-sha-mismatch" });
    const wrongRepo = parseCombinedStatus(
      JSON.stringify(combinedDoc({ repository: { full_name: "evil/repo" } })),
      { repository: REPO, sha: HEAD_SHA },
    );
    expect(wrongRepo).toMatchObject({ ok: false, reason: "binding-repository-mismatch" });
  });

  it("a malformed EXPECTATION refuses before any evidence is trusted", () => {
    expect(parseIssuePages("[]", { repository: "not a repo!" })).toMatchObject({ ok: false, reason: "expectation-invalid" });
    expect(parsePr(JSON.stringify(prDoc(1)), { repository: REPO, pr_number: 0 })).toMatchObject({ ok: false, reason: "expectation-invalid" });
    expect(parseCheckRunPages("{}", { repository: REPO, sha: "SHOUTING" })).toMatchObject({ ok: false, reason: "expectation-invalid" });
  });
});

// =============================================================================
// N5 — timestamp chronology
// =============================================================================
describe("N5 — required timestamp pairs are strict instants with updated_at >= created_at", () => {
  it("reversed chronology refuses (updated_at strictly before created_at)", () => {
    const r = parseCommentPages(
      pages([commentEntry(100, 41, { created_at: T1, updated_at: T0 })]),
      { repository: REPO, issue_number: 41 },
    );
    expect(r).toMatchObject({ ok: false, reason: "timestamp-chronology" });
  });

  it("updated_at == created_at and updated_at > created_at are both valid", () => {
    const equal = parseCommentPages(pages([commentEntry(1, 41)]), { repository: REPO, issue_number: 41 });
    expect(equal.ok).toBe(true);
    const edited = parseCommentPages(
      pages([commentEntry(2, 41, { created_at: T0, updated_at: T1 })]),
      { repository: REPO, issue_number: 41 },
    );
    expect(edited.ok).toBe(true);
  });

  it("malformed / missing / impossible-calendar timestamps refuse", () => {
    for (const badTs of [
      { created_at: "not-a-date", updated_at: T1 },
      { created_at: T0, updated_at: "2026-13-40T25:61:99Z" },
      { created_at: undefined, updated_at: T1 },
      { created_at: T0, updated_at: null },
      { created_at: "2026-07-16T12:00:00+02:00", updated_at: T1 }, // non-Z offset
    ]) {
      const r = parseIssue(
        JSON.stringify(issueEntry(41, badTs as any)),
        { repository: REPO, issue_number: 41 },
      );
      expect(r.ok, JSON.stringify(badTs)).toBe(false);
      expect((r as any).reason).toBe("timestamp-invalid");
    }
  });

  it("enumeration requires timestamps only under the requireTimestamps profile", () => {
    const noTs = pages([{ number: 5, url: `${API}/repos/${REPO}/issues/5`, body: "x" }]);
    expect(parseIssuePages(noTs, { repository: REPO }).ok).toBe(true);
    expect(parseIssuePages(noTs, { repository: REPO, requireTimestamps: true })).toMatchObject({
      ok: false,
      reason: "timestamp-invalid",
    });
    const withTs = pages([issueEntry(5)]);
    const r = parseIssuePages(withTs, { repository: REPO, requireTimestamps: true });
    expect(r.ok).toBe(true);
    expect((r as any).issues[0]).toMatchObject({ number: 5, created_at: T0, updated_at: T1 });
  });

  it("PR fetch requires the chronological pair", () => {
    const r = parsePr(
      JSON.stringify(prDoc(117, { created_at: T1, updated_at: T0 })),
      { repository: REPO, pr_number: 117 },
    );
    expect(r).toMatchObject({ ok: false, reason: "timestamp-chronology" });
  });
});

// =============================================================================
// Profile completeness / incomplete entries fail closed
// =============================================================================
describe("incomplete or mismatched entries fail closed", () => {
  it("comment without an authenticated author login refuses", () => {
    const r = parseCommentPages(
      pages([commentEntry(100, 41, { user: {} })]),
      { repository: REPO, issue_number: 41 },
    );
    expect(r).toMatchObject({ ok: false, reason: "comment-user-invalid" });
  });

  it("comment with a non-string body refuses", () => {
    const r = parseCommentPages(
      pages([commentEntry(100, 41, { body: null })]),
      { repository: REPO, issue_number: 41 },
    );
    expect(r).toMatchObject({ ok: false, reason: "comment-body-invalid" });
  });

  it("PR with non-boolean draft/merged refuses — observed booleans, never defaulted", () => {
    for (const field of ["draft", "merged"]) {
      const r = parsePr(
        JSON.stringify(prDoc(117, { [field]: "false" })),
        { repository: REPO, pr_number: 117 },
      );
      expect(r, field).toMatchObject({ ok: false, reason: "pr-invalid" });
    }
  });

  it("check-run aggregation count must equal total_count exactly (dropped page fails closed)", () => {
    const dropped = pages({ total_count: 3, check_runs: [checkRun(1), checkRun(2)] });
    expect(parseCheckRunPages(dropped, { repository: REPO, sha: HEAD_SHA })).toMatchObject({
      ok: false,
      reason: "check-run-count-mismatch",
    });
    const disagreeing = pages(
      { total_count: 2, check_runs: [checkRun(1)] },
      { total_count: 3, check_runs: [checkRun(2)] },
    );
    expect(parseCheckRunPages(disagreeing, { repository: REPO, sha: HEAD_SHA })).toMatchObject({
      ok: false,
      reason: "check-run-total-mismatch",
    });
  });

  it("in-progress check runs record conclusion 'null' (non-passing), never a pass", () => {
    const r = parseCheckRunPages(
      pages({ total_count: 2, check_runs: [checkRun(1), checkRun(2, { conclusion: null })] }),
      { repository: REPO, sha: HEAD_SHA },
    );
    expect(r).toMatchObject({ ok: true, check_runs_total: 2, check_run_conclusions: ["success", "null"] });
  });

  it("combined-status entries with missing id/context/state refuse", () => {
    for (const entry of [
      statusEntry(1, { id: undefined }),
      statusEntry(1, { context: "" }),
      statusEntry(1, { state: "amazing" }),
    ]) {
      const doc = combinedDoc({ statuses: [entry], total_count: 1 });
      const r = parseCombinedStatus(JSON.stringify(doc), { repository: REPO, sha: HEAD_SHA });
      expect(r.ok, JSON.stringify(entry)).toBe(false);
    }
  });

  it("combined-status statuses.length must equal total_count", () => {
    const doc = combinedDoc({ statuses: [statusEntry(1)], total_count: 2 });
    const r = parseCombinedStatus(JSON.stringify(doc), { repository: REPO, sha: HEAD_SHA });
    expect(r).toMatchObject({ ok: false, reason: "combined-status-count-mismatch" });
  });

  it("a zero-status combined response with total_count 0 is valid (legacy statuses absent)", () => {
    const doc = combinedDoc({ statuses: [], total_count: 0, state: "pending" });
    const r = parseCombinedStatus(JSON.stringify(doc), { repository: REPO, sha: HEAD_SHA });
    expect(r).toMatchObject({ ok: true, commit_statuses_total: 0, commit_status_state: "pending" });
  });

  it("issue enumeration excludes PRs but still accepts them as valid entries", () => {
    const r = parseIssuePages(
      pages([issueEntry(7, { pull_request: { url: "x" } }), issueEntry(8)]),
      { repository: REPO },
    );
    expect(r).toMatchObject({ ok: true, excluded_prs: [7] });
    expect((r as any).issues.map((i: any) => i.number)).toEqual([8]);
  });
});
