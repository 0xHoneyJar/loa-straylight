// Keyring + signer competence (§10).
//
// Keyring resolves a signer_id → SignerEntry and answers: "is this signer
// competent for this transition right now?" It does NOT verify signatures
// (that is signatures.ts) and does NOT decide whether a structurally valid
// move is allowed (that is policy.ts).
//
// Phase 3 additions to evaluateCompetence:
//   * quorum: rule.quorum N requires N distinct competent signers.
//   * timelock: rule.timelock_seconds requires `now - earliest signed_at`
//     of the matched signers to be ≥ timelock_seconds.
//   * requires_human_review: when set, an `allowed: true` result carries
//     `requires_review: true` unless a `reviewer` role co-signed; the
//     policy engine converts that to `needs_review`.
// All three default to "off" when the rule field is omitted, so existing
// keyrings continue to evaluate exactly as in Phase 1.
const RISK_ORDER = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
};
export function resolveSigner(keyring, signer_id) {
    return keyring.signer_entries.find((s) => s.signer_id === signer_id);
}
export function isSignerCurrentlyValid(keyring, entry, now) {
    if (entry.status !== 'active') {
        return { ok: false, reason: `signer_status_${entry.status}` };
    }
    if (keyring.revoked_key_refs.includes(entry.key_ref)) {
        return { ok: false, reason: 'key_revoked' };
    }
    if (entry.valid_from && now < entry.valid_from) {
        return { ok: false, reason: 'signer_not_yet_valid' };
    }
    if (entry.valid_until && now > entry.valid_until) {
        return { ok: false, reason: 'signer_expired' };
    }
    return { ok: true };
}
export function evaluateCompetence(keyring, query) {
    if (!query.signatures || query.signatures.length === 0) {
        return { allowed: false, reason: 'no_signatures' };
    }
    const matchedRule = findCompetenceRule(keyring.competence_rules, query);
    if (!matchedRule) {
        return { allowed: false, reason: 'no_competence_rule_for_transition' };
    }
    const matches = [];
    let lastReason = 'no_competent_signer';
    for (const sig of query.signatures) {
        const entry = resolveSigner(keyring, sig.signer_id);
        if (!entry) {
            lastReason = `unknown_signer:${sig.signer_id}`;
            continue;
        }
        const validity = isSignerCurrentlyValid(keyring, entry, query.now);
        if (!validity.ok) {
            lastReason = validity.reason ?? 'signer_invalid';
            continue;
        }
        if (entry.signer_type !== sig.signer_type) {
            lastReason = 'signer_type_mismatch';
            continue;
        }
        if (matchedRule.forbid_signer_roles?.includes(entry.signer_type)) {
            lastReason = `signer_role_forbidden:${entry.signer_type}`;
            continue;
        }
        if (!matchedRule.required_signer_roles.includes(entry.signer_type)) {
            lastReason = `signer_role_not_competent:${entry.signer_type}`;
            continue;
        }
        matches.push({ entry, sig });
    }
    if (matches.length === 0) {
        return { allowed: false, reason: lastReason, matched_rule_id: matchedRule.rule_id };
    }
    const competentSignerIds = uniqueIds(matches.map((m) => m.entry.signer_id));
    const headline = matches[0];
    // Quorum
    const quorum_required = matchedRule.quorum ?? 1;
    if (competentSignerIds.length < quorum_required) {
        return {
            allowed: false,
            reason: `quorum_not_met:${quorum_required}:${competentSignerIds.length}`,
            matched_rule_id: matchedRule.rule_id,
            signer_id: headline.entry.signer_id,
            signer_role: headline.entry.signer_type,
            signature_id: headline.sig.signature_id,
            competent_signer_ids: competentSignerIds,
            quorum_required,
            quorum_present: competentSignerIds.length,
        };
    }
    // Timelock — earliest competent signature must be ≥ timelock_seconds in the past.
    let timelock_elapsed;
    if (matchedRule.timelock_seconds && matchedRule.timelock_seconds > 0) {
        const earliest = matches
            .map((m) => Date.parse(m.sig.signed_at))
            .filter((n) => Number.isFinite(n))
            .reduce((acc, n) => (acc === undefined || n < acc ? n : acc), undefined);
        const nowMs = Date.parse(query.now);
        if (earliest === undefined || !Number.isFinite(nowMs)) {
            return {
                allowed: false,
                reason: 'timelock_check_invalid_timestamp',
                matched_rule_id: matchedRule.rule_id,
                timelock_seconds_required: matchedRule.timelock_seconds,
            };
        }
        timelock_elapsed = Math.max(0, Math.floor((nowMs - earliest) / 1000));
        if (timelock_elapsed < matchedRule.timelock_seconds) {
            return {
                allowed: false,
                reason: `timelock_pending:${matchedRule.timelock_seconds}:${timelock_elapsed}`,
                matched_rule_id: matchedRule.rule_id,
                signer_id: headline.entry.signer_id,
                signer_role: headline.entry.signer_type,
                signature_id: headline.sig.signature_id,
                competent_signer_ids: competentSignerIds,
                quorum_required,
                quorum_present: competentSignerIds.length,
                timelock_seconds_required: matchedRule.timelock_seconds,
                timelock_seconds_elapsed: timelock_elapsed,
            };
        }
    }
    // requires_human_review — competence passes structurally, but the
    // decision must be lifted to needs_review unless a reviewer co-signed.
    const hasReviewer = matches.some((m) => m.entry.signer_type === 'reviewer');
    const requires_review = matchedRule.requires_human_review === true && !hasReviewer;
    return {
        allowed: true,
        reason: requires_review ? 'competent_signer_present_pending_human_review' : 'competent_signer_present',
        matched_rule_id: matchedRule.rule_id,
        signer_id: headline.entry.signer_id,
        signer_role: headline.entry.signer_type,
        signature_id: headline.sig.signature_id,
        competent_signer_ids: competentSignerIds,
        quorum_required,
        quorum_present: competentSignerIds.length,
        timelock_seconds_required: matchedRule.timelock_seconds,
        timelock_seconds_elapsed: timelock_elapsed,
        requires_review,
    };
}
function uniqueIds(ids) {
    const seen = new Set();
    const out = [];
    for (const id of ids) {
        if (!seen.has(id)) {
            seen.add(id);
            out.push(id);
        }
    }
    return out;
}
function findCompetenceRule(rules, query) {
    // Prefer the most specific matching rule. Specificity heuristic: count how
    // many optional fields the rule constrains. Ties broken by declaration order.
    const candidates = rules.filter((r) => ruleMatches(r, query));
    if (candidates.length === 0)
        return undefined;
    candidates.sort((a, b) => specificity(b) - specificity(a));
    return candidates[0];
}
function ruleMatches(rule, q) {
    if (rule.transition_type !== q.transition_type)
        return false;
    if (rule.assertion_class && rule.assertion_class !== q.assertion_class)
        return false;
    if (rule.target_class && rule.target_class !== q.target_class)
        return false;
    if (rule.environment_frame && rule.environment_frame !== q.environment_frame)
        return false;
    if (rule.risk_level && q.risk_level && RISK_ORDER[q.risk_level] < RISK_ORDER[rule.risk_level]) {
        // Rule applies to risk >= rule.risk_level; lower-risk requests fall through.
        return false;
    }
    return true;
}
function specificity(r) {
    let n = 0;
    if (r.assertion_class)
        n += 1;
    if (r.target_class)
        n += 1;
    if (r.environment_frame)
        n += 1;
    if (r.risk_level)
        n += 1;
    return n;
}
// Convenience: list active signer types (used for diagnostics).
export function listActiveSignerRoles(keyring, now) {
    return keyring.signer_entries
        .filter((s) => isSignerCurrentlyValid(keyring, s, now).ok)
        .map((s) => s.signer_type);
}
