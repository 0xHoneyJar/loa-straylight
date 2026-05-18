// Class validation (§9.1).
//
// Answers: "Is this object structurally legible for its claimed class?"
// Strictly forbidden from making policy decisions: signer competence, status
// transitions, environment-frame rules, and revocation effects all live in
// policy.ts and keyring.ts.
const ASSERTION_CLASSES = new Set([
    'observation',
    'event',
    'claim',
    'assumption',
    'preference',
    'reflection',
    'identity',
    'relationship',
    'permission',
    'plan',
    'action_trace',
    'feedback_signal',
    'evaluation_result',
    'challenge',
    'revocation',
    'commitment',
]);
const ASSERTION_STATUSES = new Set([
    'proposed',
    'active',
    'contested',
    'demoted',
    'revoked',
    'forgotten_from_recall',
    'superseded',
    'sealed',
]);
const PROVENANCE_SOURCE_TYPES = new Set([
    'operator_input',
    'runtime_observation',
    'tool_result',
    'model_output',
    'discord_event',
    'telegram_event',
    'repo_artifact',
    'onchain_event',
    'feedback_signal',
    'evaluation_result',
    'manual_review',
]);
const SIGNATURE_TYPES = new Set([
    'ed25519',
    'secp256k1',
    'hmac',
    'dev_signature',
]);
const ASSERTION_SCHEMA_ID = 'straylight.assertion.v0';
const ASSERTION_SCHEMA_VERSION = '0.1.0';
const RECALL_REQUEST_SCHEMA_ID = 'straylight.recall_request.v0';
const RECALL_REQUEST_SCHEMA_VERSION = '0.1.0';
// ─── Candidate assertion ──────────────────────────────────────────────────────
export function validateCandidateAssertion(c) {
    const errors = [];
    requireString(c, 'estate_id', errors);
    requireString(c, 'actor_id', errors);
    if (!c.assertion_class) {
        errors.push({ path: 'assertion_class', code: 'missing_field', message: 'assertion_class is required' });
    }
    else if (!ASSERTION_CLASSES.has(c.assertion_class)) {
        errors.push({
            path: 'assertion_class',
            code: 'invalid_enum',
            message: `unknown assertion class: ${c.assertion_class}`,
        });
    }
    if (c.body === undefined || c.body === null || typeof c.body !== 'object' || Array.isArray(c.body)) {
        errors.push({ path: 'body', code: 'invalid_type', message: 'body must be an object' });
    }
    if (!Array.isArray(c.provenance) || c.provenance.length === 0) {
        errors.push({
            path: 'provenance',
            code: 'missing_field',
            message: 'at least one provenance entry is required',
        });
    }
    else {
        c.provenance.forEach((p, i) => validateProvenance(p, `provenance[${i}]`, errors));
    }
    if (!Array.isArray(c.signatures) || c.signatures.length === 0) {
        errors.push({
            path: 'signatures',
            code: 'missing_field',
            message: 'at least one signature envelope is required',
        });
    }
    else {
        c.signatures.forEach((s, i) => validateSignatureEnvelope(s, `signatures[${i}]`, errors));
    }
    if (c.privacy_scope !== undefined) {
        if (!['public', 'tenant', 'actor_private', 'sealed'].includes(c.privacy_scope)) {
            errors.push({
                path: 'privacy_scope',
                code: 'invalid_enum',
                message: `unknown privacy_scope: ${c.privacy_scope}`,
            });
        }
    }
    if (c.risk_level !== undefined && !['low', 'medium', 'high', 'critical'].includes(c.risk_level)) {
        errors.push({
            path: 'risk_level',
            code: 'invalid_enum',
            message: `unknown risk_level: ${c.risk_level}`,
        });
    }
    if (c.confidence !== undefined) {
        if (typeof c.confidence !== 'number' || c.confidence < 0 || c.confidence > 1) {
            errors.push({
                path: 'confidence',
                code: 'invalid_format',
                message: 'confidence must be a number in [0, 1]',
            });
        }
    }
    // Class-specific structural checks. These are NOT policy: they only check the
    // shape required for a class to be legible. Authority-level rules (e.g.
    // identity requires reviewer signer) live in policy.ts.
    classSpecificChecks(c, errors);
    return {
        valid: errors.length === 0,
        schema_id: ASSERTION_SCHEMA_ID,
        schema_version: ASSERTION_SCHEMA_VERSION,
        errors,
    };
}
// ─── Recall request ───────────────────────────────────────────────────────────
export function validateRecallRequest(r) {
    const errors = [];
    requireString(r, 'recall_request_id', errors);
    requireString(r, 'actor_id', errors);
    requireString(r, 'estate_id', errors);
    requireString(r, 'requested_by', errors);
    requireString(r, 'task', errors);
    const allowedFrames = [
        'private_operator',
        'private_chat',
        'public_discord',
        'public_telegram',
        'repo_workflow',
        'tool_action_precheck',
        'audit_review',
    ];
    if (!allowedFrames.includes(r.environment_frame)) {
        errors.push({
            path: 'environment_frame',
            code: 'invalid_enum',
            message: `unknown environment_frame: ${r.environment_frame}`,
        });
    }
    if (!['low', 'medium', 'high', 'critical'].includes(r.risk_profile)) {
        errors.push({
            path: 'risk_profile',
            code: 'invalid_enum',
            message: `unknown risk_profile: ${r.risk_profile}`,
        });
    }
    if (!['minimal', 'standard', 'debug'].includes(r.include_receipt_detail)) {
        errors.push({
            path: 'include_receipt_detail',
            code: 'invalid_enum',
            message: `unknown include_receipt_detail: ${r.include_receipt_detail}`,
        });
    }
    validateAssertionEnumArray(r.requested_classes, 'requested_classes', ASSERTION_CLASSES, errors);
    validateAssertionEnumArray(r.excluded_classes, 'excluded_classes', ASSERTION_CLASSES, errors);
    validateAssertionEnumArray(r.include_statuses, 'include_statuses', ASSERTION_STATUSES, errors);
    validateAssertionEnumArray(r.mark_statuses, 'mark_statuses', ASSERTION_STATUSES, errors);
    validateAssertionEnumArray(r.exclude_statuses, 'exclude_statuses', ASSERTION_STATUSES, errors);
    if (!r.signature) {
        errors.push({
            path: 'signature',
            code: 'missing_field',
            message: 'signature envelope is required on recall requests',
        });
    }
    else {
        validateSignatureEnvelope(r.signature, 'signature', errors);
    }
    return {
        valid: errors.length === 0,
        schema_id: RECALL_REQUEST_SCHEMA_ID,
        schema_version: RECALL_REQUEST_SCHEMA_VERSION,
        errors,
    };
}
// ─── helpers ──────────────────────────────────────────────────────────────────
function requireString(obj, field, errors) {
    const v = obj[field];
    if (typeof v !== 'string' || v.length === 0) {
        errors.push({
            path: field,
            code: 'missing_field',
            message: `${field} must be a non-empty string`,
        });
    }
}
function validateProvenance(p, path, errors) {
    if (!p || typeof p !== 'object') {
        errors.push({ path, code: 'invalid_type', message: 'provenance entry must be an object' });
        return;
    }
    if (!p.source_type || !PROVENANCE_SOURCE_TYPES.has(p.source_type)) {
        errors.push({
            path: `${path}.source_type`,
            code: 'invalid_enum',
            message: `unknown source_type: ${String(p.source_type)}`,
        });
    }
    if (typeof p.observed_at !== 'string' || p.observed_at.length === 0) {
        errors.push({
            path: `${path}.observed_at`,
            code: 'missing_field',
            message: 'observed_at must be a non-empty ISO8601 string',
        });
    }
    if (typeof p.captured_by !== 'string' || p.captured_by.length === 0) {
        errors.push({
            path: `${path}.captured_by`,
            code: 'missing_field',
            message: 'captured_by must be a non-empty string',
        });
    }
}
function validateSignatureEnvelope(s, path, errors) {
    if (!s || typeof s !== 'object') {
        errors.push({ path, code: 'invalid_type', message: 'signature envelope must be an object' });
        return;
    }
    for (const f of ['signer_id', 'signer_type', 'signed_payload_hash', 'signature', 'signed_at', 'key_ref']) {
        if (typeof s[f] !== 'string' || s[f].length === 0) {
            errors.push({
                path: `${path}.${f}`,
                code: 'missing_field',
                message: `${f} must be a non-empty string`,
            });
        }
    }
    if (!s.signature_type || !SIGNATURE_TYPES.has(s.signature_type)) {
        errors.push({
            path: `${path}.signature_type`,
            code: 'invalid_enum',
            message: `unknown signature_type: ${String(s.signature_type)}`,
        });
    }
    if (typeof s.signed_payload_hash === 'string' && !s.signed_payload_hash.startsWith('sha256:')) {
        errors.push({
            path: `${path}.signed_payload_hash`,
            code: 'invalid_format',
            message: 'signed_payload_hash must be sha256:<hex>',
        });
    }
}
function validateAssertionEnumArray(arr, path, allowed, errors) {
    if (arr === undefined)
        return;
    if (!Array.isArray(arr)) {
        errors.push({ path, code: 'invalid_type', message: `${path} must be an array` });
        return;
    }
    arr.forEach((v, i) => {
        if (!allowed.has(v)) {
            errors.push({
                path: `${path}[${i}]`,
                code: 'invalid_enum',
                message: `unknown value: ${String(v)}`,
            });
        }
    });
}
// Class-specific shape: keep narrow. These do not encode policy. Examples:
//   * `observation` requires a `text` body so the recall layer has something
//     legible to summarize.
//   * `permission` requires a `capability` body so policy can later enforce
//     scope. Whether the *signer* is allowed to admit a permission is policy.
function classSpecificChecks(c, errors) {
    const body = (c.body ?? {});
    switch (c.assertion_class) {
        case 'observation':
        case 'event':
        case 'claim':
        case 'assumption':
        case 'preference':
        case 'reflection':
            if (typeof body.text !== 'string' || body.text.length === 0) {
                errors.push({
                    path: 'body.text',
                    code: 'class_specific',
                    message: `${c.assertion_class} requires body.text`,
                });
            }
            break;
        case 'identity':
            if (typeof body.attribute !== 'string' || typeof body.value !== 'string') {
                errors.push({
                    path: 'body',
                    code: 'class_specific',
                    message: 'identity requires body.attribute and body.value',
                });
            }
            break;
        case 'relationship':
            if (typeof body.subject !== 'string' || typeof body.relation !== 'string') {
                errors.push({
                    path: 'body',
                    code: 'class_specific',
                    message: 'relationship requires body.subject and body.relation',
                });
            }
            break;
        case 'permission':
            if (typeof body.capability !== 'string' || body.capability.length === 0) {
                errors.push({
                    path: 'body.capability',
                    code: 'class_specific',
                    message: 'permission requires body.capability',
                });
            }
            break;
        case 'action_trace':
            if (typeof body.action !== 'string') {
                errors.push({
                    path: 'body.action',
                    code: 'class_specific',
                    message: 'action_trace requires body.action',
                });
            }
            break;
        case 'plan':
        case 'feedback_signal':
        case 'evaluation_result':
        case 'challenge':
        case 'revocation':
        case 'commitment':
            // Minimal MVP shape: body must be an object (already checked).
            break;
        default:
            // unknown class already flagged above
            break;
    }
}
