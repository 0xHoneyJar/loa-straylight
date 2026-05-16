import type { Assertion, CandidateAssertion, ClassValidationResult, EnvironmentFrame, EstateTransition, Keyring, PolicyDecision, RecallRequest, RiskLevel, SignatureEnvelope } from './types.js';
export declare const DEFAULT_POLICY_ID = "straylight.default-agent-estate.v0";
export declare const DEFAULT_POLICY_VERSION = "0.1.0";
export declare class PolicyEngineError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export interface AdmitPolicyInput {
    candidate: CandidateAssertion;
    class_validation: ClassValidationResult;
    keyring: Keyring;
    now: string;
}
export declare function policyForAdmitAssertion(input: AdmitPolicyInput): PolicyDecision;
export interface TransitionPolicyInput {
    transition_type: EstateTransition['transition_type'];
    signatures: SignatureEnvelope[];
    keyring: Keyring;
    target_class?: Assertion['assertion_class'];
    risk_level?: RiskLevel;
    environment_frame?: EnvironmentFrame;
    now: string;
}
export declare function policyForTransition(input: TransitionPolicyInput): PolicyDecision;
export interface RecallPolicyInput {
    request: RecallRequest;
    keyring: Keyring;
    now: string;
}
export declare function policyForRecallRequest(input: RecallPolicyInput): PolicyDecision;
export type RecallDisposition = {
    kind: 'include';
} | {
    kind: 'mark';
    reason: string;
} | {
    kind: 'redact';
    reason: string;
} | {
    kind: 'exclude';
    reason: string;
};
export declare function dispositionFor(assertion: Assertion, request: RecallRequest): RecallDisposition;
