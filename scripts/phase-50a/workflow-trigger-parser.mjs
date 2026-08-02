// Phase 50A R3 — a BOUNDED SEMANTIC parser for the proof workflow's own trigger
// declaration.
//
// WHY THIS EXISTS. The coverage proof must compare the checked-in manifest
// (`tests/phase-50a/proof-input-manifest.json`) against what the workflow
// ACTUALLY declares as its triggers. The rejected suite read the workflow with a
// fixed-offset text slice (`indexOf('    paths:\n')`, then line-shape regexes)
// and — decisively — an independent mutation that removed a real trigger from the
// workflow while making the extractor SYNTHESIZE that path in its return value
// left every focused test green. The proof laundered a missing required trigger
// through extractor replacement.
//
// The correction is a parse of the workflow's RAW BYTES that:
//
//   * is STRUCTURAL, not offset-based: it tracks YAML block structure by
//     indentation and key nesting, so it recovers `on.pull_request.paths` and
//     `on.workflow_dispatch` by their POSITION IN THE DOCUMENT rather than by a
//     literal string offset;
//   * is BOUNDED: it accepts only the constructs a GitHub workflow trigger block
//     can contain (block mappings, block sequences, plain/single/double-quoted
//     scalars, comments, blank lines) and FAILS CLOSED on anything else. It is
//     not a general YAML implementation and does not try to be;
//   * NEVER SYNTHESIZES. Every returned path is a substring of the input bytes
//     at a recorded byte offset, and each is returned with that offset so a
//     consumer can verify the provenance itself. A parser that invented a path
//     could not produce a matching offset.
//
// FAIL CLOSED is the whole disposition: an absent block, an unterminated block, a
// nested key where a scalar was required, an unrecognized list-item shape, a
// tab-indented line, or a duplicate key all RETURN AN ERROR. Returning a narrower
// (or wider) set silently is precisely the failure mode the rejected approach had.
//
// Pure and dependency-free: no network, no filesystem, no YAML library. The
// caller supplies the bytes.

/** Indentation unit the workflow uses. Two spaces, and tabs are refused. */
const INDENT_UNIT = 2;
/** Upper bound on the document this parser will consider. */
const MAX_BYTES = 262144;

/**
 * Parse the trigger declaration of a GitHub workflow.
 *
 * @param {string} text the workflow's raw bytes, decoded as UTF-8.
 * @returns {{ok: true, pullRequestPaths: {value: string, offset: number}[], workflowDispatch: {present: true, inputs: string[]}}
 *          | {ok: false, reason: string, detail: string}}
 *
 * `pullRequestPaths` carries each declared path WITH the byte offset it was read
 * from, so the consumer can re-verify that the parser did not invent it.
 * `workflowDispatch` reports whether the trigger is present and which inputs it
 * declares (an empty `inputs` array for a bare `workflow_dispatch:`).
 */
export function parseWorkflowTriggers(text) {
  if (typeof text !== 'string') {
    return fail('input-not-text', 'the workflow bytes must be provided as a decoded string');
  }
  if (text.length === 0) {
    return fail('input-empty', 'an empty document declares no triggers');
  }
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
    return fail('input-too-large', `the document exceeds ${MAX_BYTES} bytes`);
  }
  if (text.includes('\t')) {
    // YAML forbids tabs as indentation, and accepting them would make every
    // depth computation below ambiguous.
    return fail('tab-indentation', 'the document contains a tab; indentation must be spaces');
  }

  const lines = splitLines(text);

  // ── locate the top-level `on:` block ─────────────────────────────────
  const onKey = findTopLevelKey(lines, 'on');
  if (!onKey.ok) return onKey;
  const onBlock = childLines(lines, onKey.index, 0);
  if (onBlock.length === 0) {
    return fail('on-block-empty', 'the `on:` key declares no triggers');
  }

  // ── the trigger keys directly under `on:` ────────────────────────────
  const triggers = directKeys(onBlock, INDENT_UNIT);
  if (!triggers.ok) return triggers;

  const pullRequest = triggers.keys.find((k) => k.name === 'pull_request');
  if (pullRequest === undefined) {
    return fail('pull-request-trigger-absent', 'on.pull_request is not declared');
  }

  // ── on.pull_request.paths ────────────────────────────────────────────
  const prBlock = childLines(onBlock, pullRequest.index, INDENT_UNIT);
  if (prBlock.length === 0) {
    return fail('pull-request-block-empty', 'on.pull_request declares no keys');
  }
  const prKeys = directKeys(prBlock, INDENT_UNIT * 2);
  if (!prKeys.ok) return prKeys;
  const paths = prKeys.keys.find((k) => k.name === 'paths');
  if (paths === undefined) {
    return fail('paths-block-absent', 'on.pull_request.paths is not declared');
  }
  if (paths.inlineValue !== null) {
    // A flow sequence (`paths: [a, b]`) is a shape this parser deliberately does
    // not interpret. Refuse rather than guess.
    return fail(
      'paths-not-a-block-sequence',
      'on.pull_request.paths must be a block sequence (one `- item` per line)',
    );
  }
  const pathsBlock = childLines(prBlock, paths.index, INDENT_UNIT * 2);
  if (pathsBlock.length === 0) {
    return fail('paths-block-empty', 'on.pull_request.paths declares no entries');
  }
  const items = sequenceItems(pathsBlock, INDENT_UNIT * 3);
  if (!items.ok) return items;
  if (items.values.length === 0) {
    return fail('paths-block-empty', 'on.pull_request.paths declares no entries');
  }

  // ── on.workflow_dispatch ─────────────────────────────────────────────
  const dispatch = triggers.keys.find((k) => k.name === 'workflow_dispatch');
  if (dispatch === undefined) {
    return fail('workflow-dispatch-absent', 'on.workflow_dispatch is not declared');
  }
  const dispatchInputs = [];
  if (dispatch.inlineValue === null) {
    const dispatchBlock = childLines(onBlock, dispatch.index, INDENT_UNIT);
    if (dispatchBlock.length > 0) {
      const dispatchKeys = directKeys(dispatchBlock, INDENT_UNIT * 2);
      if (!dispatchKeys.ok) return dispatchKeys;
      const inputs = dispatchKeys.keys.find((k) => k.name === 'inputs');
      if (inputs !== undefined) {
        const inputsBlock = childLines(dispatchBlock, inputs.index, INDENT_UNIT * 2);
        const inputKeys = directKeys(inputsBlock, INDENT_UNIT * 3);
        if (!inputKeys.ok) return inputKeys;
        for (const key of inputKeys.keys) dispatchInputs.push(key.name);
      }
    }
  }

  return {
    ok: true,
    pullRequestPaths: items.values,
    workflowDispatch: { present: true, inputs: dispatchInputs },
  };
}

// ── internals ───────────────────────────────────────────────────────────

/**
 * Split into lines, recording each line's byte offset so a recovered scalar can
 * be traced back to the bytes it came from.
 */
function splitLines(text) {
  const out = [];
  let offset = 0;
  for (const raw of text.split('\n')) {
    out.push({ raw, offset });
    offset += Buffer.byteLength(raw, 'utf8') + 1;
  }
  return out;
}

/** Is this line ignorable structure (blank or a whole-line comment)? */
function isSkippable(raw) {
  const trimmed = raw.trim();
  return trimmed === '' || trimmed.startsWith('#');
}

/** The number of leading spaces on a line. */
function indentOf(raw) {
  let n = 0;
  while (n < raw.length && raw[n] === ' ') n += 1;
  return n;
}

/**
 * Find a key at indentation 0, by exact name. Fails closed on absence and on a
 * DUPLICATE — two `on:` keys would make "which block is the trigger block"
 * ambiguous, and YAML's own last-wins rule is not something a security-relevant
 * comparison should inherit silently.
 */
function findTopLevelKey(lines, name) {
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const { raw } = lines[i];
    if (isSkippable(raw)) continue;
    if (indentOf(raw) !== 0) continue;
    const key = readKey(raw, 0);
    if (key !== null && key.name === name) found.push(i);
  }
  if (found.length === 0) {
    return fail('key-absent', `no top-level \`${name}:\` key`);
  }
  if (found.length > 1) {
    return fail('key-duplicated', `top-level \`${name}:\` is declared ${found.length} times`);
  }
  return { ok: true, index: found[0] };
}

/**
 * The contiguous lines that belong to the block opened at `index`, i.e. every
 * following line indented DEEPER than `parentIndent`, stopping at the first line
 * that is not.
 *
 * Comments and blank lines inside the block do NOT terminate it (the workflow
 * interleaves explanatory comments between trigger entries), but they also do not
 * extend it: a trailing run of comments after the block has ended is excluded, so
 * the block's extent is decided by real content only.
 */
function childLines(lines, index, parentIndent) {
  const out = [];
  let pending = [];
  for (let i = index + 1; i < lines.length; i++) {
    const line = lines[i];
    if (isSkippable(line.raw)) {
      pending.push(line);
      continue;
    }
    if (indentOf(line.raw) <= parentIndent) break;
    out.push(...pending, line);
    pending = [];
  }
  return out;
}

/**
 * Read a `key:` (optionally `key: value`) from a line at exactly `expectIndent`.
 * Returns `null` when the line is not a key at that indentation.
 */
function readKey(raw, expectIndent) {
  if (indentOf(raw) !== expectIndent) return null;
  const body = raw.slice(expectIndent);
  const match = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:(.*)$/.exec(body);
  if (match === null) return null;
  const rest = stripComment(match[2]).trim();
  return { name: match[1], inlineValue: rest === '' ? null : rest };
}

/**
 * Every key declared DIRECTLY at `expectIndent` within `block`.
 *
 * A line at that indentation which is not a well-formed key is a FAILURE, not
 * something to skip: an unrecognized construct where a key was required means the
 * parser's model of the document is wrong, and continuing would return a set that
 * silently omits it. Duplicates fail closed for the same reason as above.
 */
function directKeys(block, expectIndent) {
  const keys = [];
  const seen = new Set();
  for (let i = 0; i < block.length; i++) {
    const { raw } = block[i];
    if (isSkippable(raw)) continue;
    const indent = indentOf(raw);
    if (indent > expectIndent) continue; // belongs to a nested block
    if (indent < expectIndent) {
      return fail(
        'unexpected-dedent',
        `line "${raw.trim()}" is indented ${indent}, shallower than the expected ${expectIndent}`,
      );
    }
    const key = readKey(raw, expectIndent);
    if (key === null) {
      return fail(
        'unparseable-key',
        `line "${raw.trim()}" at indent ${expectIndent} is not a well-formed \`key:\``,
      );
    }
    if (seen.has(key.name)) {
      return fail('key-duplicated', `key \`${key.name}\` is declared more than once`);
    }
    seen.add(key.name);
    keys.push({ ...key, index: i });
  }
  return { ok: true, keys };
}

/**
 * Every scalar item of a block sequence at exactly `expectIndent`.
 *
 * Accepts single-quoted, double-quoted, and plain scalars — the three shapes a
 * workflow path filter is written in. Anything else (a nested mapping under a
 * `-`, an empty item, an unterminated quote) FAILS CLOSED. Each value is returned
 * with the byte offset of the line it came from, so it is verifiably a substring
 * of the input rather than something the parser produced.
 */
function sequenceItems(block, expectIndent) {
  const values = [];
  for (const { raw, offset } of block) {
    if (isSkippable(raw)) continue;
    const indent = indentOf(raw);
    if (indent !== expectIndent) {
      return fail(
        'unexpected-sequence-indent',
        `sequence item "${raw.trim()}" is indented ${indent}, expected ${expectIndent}`,
      );
    }
    const body = raw.slice(expectIndent);
    if (!body.startsWith('- ') && body !== '-') {
      return fail(
        'not-a-sequence-item',
        `line "${raw.trim()}" inside a block sequence is not a \`- item\``,
      );
    }
    const scalar = readScalar(body.slice(1).trim());
    if (!scalar.ok) return scalar;
    values.push({ value: scalar.value, offset });
  }
  return { ok: true, values };
}

/**
 * One scalar in single-quoted, double-quoted, or plain form.
 *
 * Quoted forms must be TERMINATED; an unterminated quote is a failure rather than
 * a value read to end-of-line. A plain scalar is taken up to a trailing comment
 * and must be non-empty and free of the structural characters that would mean the
 * item is not a plain scalar at all.
 */
function readScalar(raw) {
  if (raw.length === 0) {
    return fail('empty-scalar', 'a sequence item must carry a value');
  }
  const quote = raw[0];
  if (quote === "'" || quote === '"') {
    const end = raw.indexOf(quote, 1);
    if (end === -1) {
      return fail('unterminated-quote', `scalar ${raw} is not terminated by a matching ${quote}`);
    }
    const after = stripComment(raw.slice(end + 1)).trim();
    if (after !== '') {
      return fail('trailing-content-after-scalar', `unexpected content after scalar: ${after}`);
    }
    const value = raw.slice(1, end);
    if (value === '') {
      return fail('empty-scalar', 'a quoted sequence item must carry a non-empty value');
    }
    return { ok: true, value };
  }
  const plain = stripComment(raw).trim();
  if (plain === '') {
    return fail('empty-scalar', 'a sequence item must carry a value');
  }
  if (/[:{}[\]]/.test(plain)) {
    return fail(
      'not-a-plain-scalar',
      `item "${plain}" contains YAML structure and is not a plain scalar`,
    );
  }
  return { ok: true, value: plain };
}

/**
 * Remove a trailing `#` comment.
 *
 * Only a `#` preceded by whitespace (or at the start) opens a comment, so a `#`
 * inside a path is preserved. Text inside a quoted region is not scanned — the
 * quoted branch above strips the comment AFTER the closing quote instead.
 */
function stripComment(text) {
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '#') continue;
    if (i === 0 || /\s/.test(text[i - 1])) return text.slice(0, i);
  }
  return text;
}

function fail(reason, detail) {
  return { ok: false, reason, detail };
}
