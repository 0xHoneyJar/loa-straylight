import type { AssertionClass, EnvironmentFrame, EstateTransition, Keyring, RiskLevel, SignatureEnvelope, SignerCompetenceResult, SignerEntry, SignerType } from './types.js';
export interface CompetenceQuery {
    transition_type: EstateTransition['transition_type'];
    signatures: SignatureEnvelope[];
    assertion_class?: AssertionClass;
    target_class?: AssertionClass;
    risk_level?: RiskLevel;
    environment_frame?: EnvironmentFrame;
    now: string;
}
export declare function resolveSigner(keyring: Keyring, signer_id: string): SignerEntry | undefined;
export declare function isSignerCurrentlyValid(keyring: Keyring, entry: SignerEntry, now: string): {
    ok: boolean;
    reason?: string;
};
export declare function evaluateCompetence(keyring: Keyring, query: CompetenceQuery): SignerCompetenceResult;
export declare function listActiveSignerRoles(keyring: Keyring, now: string): SignerType[];
