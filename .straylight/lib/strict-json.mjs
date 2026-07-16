// Straylight Control Plane v1 — strict JSON parser (pure, dependency-free).
//
// The built-in JSON.parse silently accepts duplicate object keys and keeps
// the LAST occurrence. That is a payload-smuggling surface: an attacker can
// author a block a human reads as { "verdict": "REJECT", ... } while the
// machine sees { ..., "verdict": "ACCEPT" } — the last duplicate wins and the
// human-visible key is a decoy. Any downstream validator then binds to a
// value the reviewer never saw.
//
// parseStrict is a spec-faithful recursive-descent JSON parser (RFC 8259)
// that ADDITIONALLY rejects duplicate keys anywhere in the document. A
// duplicate key makes the whole payload ambiguous, so it fails closed —
// there is no "which one wins" question to get wrong.
//
//   parseStrict(text) -> { ok: true, value } | { ok: false, reason }
//
// It accepts exactly the strings JSON.parse accepts, minus documents that
// contain any object with a repeated key. It never evaluates input and has
// no dependency on the host JSON implementation.

const WS = new Set([" ", "\t", "\n", "\r"]);

export function parseStrict(text) {
  if (typeof text !== "string") return { ok: false, reason: "not-a-string" };
  const s = text;
  const n = s.length;
  let i = 0;

  function fail(reason) {
    const err = new Error(reason);
    err.__strict = true;
    throw err;
  }

  function skipWs() {
    while (i < n && WS.has(s[i])) i++;
  }

  function parseValue() {
    skipWs();
    if (i >= n) fail("unexpected-end");
    const c = s[i];
    if (c === "{") return parseObject();
    if (c === "[") return parseArray();
    if (c === '"') return parseString();
    if (c === "-" || (c >= "0" && c <= "9")) return parseNumber();
    if (s.startsWith("true", i)) { i += 4; return true; }
    if (s.startsWith("false", i)) { i += 5; return false; }
    if (s.startsWith("null", i)) { i += 4; return null; }
    fail("unexpected-token");
  }

  function parseObject() {
    i++; // consume {
    const obj = {};
    const seen = new Set();
    skipWs();
    if (s[i] === "}") { i++; return obj; }
    for (;;) {
      skipWs();
      if (s[i] !== '"') fail("expected-object-key");
      const key = parseString();
      if (seen.has(key)) fail("duplicate-object-key");
      seen.add(key);
      skipWs();
      if (s[i] !== ":") fail("expected-colon");
      i++; // consume :
      const val = parseValue();
      // Guard against __proto__ / prototype pollution: define own property.
      Object.defineProperty(obj, key, {
        value: val, writable: true, enumerable: true, configurable: true,
      });
      skipWs();
      if (s[i] === ",") { i++; continue; }
      if (s[i] === "}") { i++; return obj; }
      fail("expected-comma-or-object-end");
    }
  }

  function parseArray() {
    i++; // consume [
    const arr = [];
    skipWs();
    if (s[i] === "]") { i++; return arr; }
    for (;;) {
      arr.push(parseValue());
      skipWs();
      if (s[i] === ",") { i++; continue; }
      if (s[i] === "]") { i++; return arr; }
      fail("expected-comma-or-array-end");
    }
  }

  function parseString() {
    i++; // consume opening quote
    let out = "";
    for (;;) {
      if (i >= n) fail("unterminated-string");
      const c = s[i++];
      if (c === '"') return out;
      if (c === "\\") {
        if (i >= n) fail("unterminated-escape");
        const e = s[i++];
        if (e === '"') out += '"';
        else if (e === "\\") out += "\\";
        else if (e === "/") out += "/";
        else if (e === "b") out += "\b";
        else if (e === "f") out += "\f";
        else if (e === "n") out += "\n";
        else if (e === "r") out += "\r";
        else if (e === "t") out += "\t";
        else if (e === "u") {
          const hex = s.slice(i, i + 4);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("bad-unicode-escape");
          out += String.fromCharCode(parseInt(hex, 16));
          i += 4;
        } else fail("bad-escape");
      } else if (c.charCodeAt(0) < 0x20) {
        fail("control-char-in-string");
      } else {
        out += c;
      }
    }
  }

  function parseNumber() {
    const start = i;
    if (s[i] === "-") i++;
    if (s[i] === "0") {
      i++;
    } else if (s[i] >= "1" && s[i] <= "9") {
      while (i < n && s[i] >= "0" && s[i] <= "9") i++;
    } else {
      fail("invalid-number");
    }
    if (s[i] === ".") {
      i++;
      if (!(s[i] >= "0" && s[i] <= "9")) fail("invalid-number-fraction");
      while (i < n && s[i] >= "0" && s[i] <= "9") i++;
    }
    if (s[i] === "e" || s[i] === "E") {
      i++;
      if (s[i] === "+" || s[i] === "-") i++;
      if (!(s[i] >= "0" && s[i] <= "9")) fail("invalid-number-exponent");
      while (i < n && s[i] >= "0" && s[i] <= "9") i++;
    }
    const num = Number(s.slice(start, i));
    if (!Number.isFinite(num)) fail("non-finite-number");
    return num;
  }

  try {
    const value = parseValue();
    skipWs();
    if (i !== n) return { ok: false, reason: "trailing-content" };
    return { ok: true, value };
  } catch (e) {
    if (e && e.__strict) return { ok: false, reason: e.message };
    return { ok: false, reason: "parse-error" };
  }
}
