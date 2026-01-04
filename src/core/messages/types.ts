/**
 * Message Types for Background ↔ UI Communication
 */

export type MessageType =
  | 'EVALUATE_URL'
  | 'UNLOCK_ATTEMPT'
  | 'LOCK_DOMAIN'
  | 'SNOOZE_DOMAIN'
  | 'GET_UNLOCK_STATUS'
  | 'CREATE_RULE'
  | 'UPDATE_RULE'
  | 'DELETE_RULE'
  | 'GET_RULES'
  | 'GET_PROFILES'
  | 'SWITCH_PROFILE'
  | 'INIT_CHECK'
  | 'SET_MASTER_PASSWORD'
  | 'VERIFY_MASTER_PASSWORD';

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
}

export interface EvaluateUrlPayload {
  url: string;
}

export interface EvaluateUrlResponse {
  action: 'allow' | 'require_unlock' | 'block' | 'redirect';
  ruleId?: string;
  redirectUrl?: string;
  domain?: string;
}

export interface UnlockAttemptPayload {
  domain: string;
  password: string;
  ruleId?: string;
}

export interface UnlockAttemptResponse {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
  cooldownSeconds?: number;
}

export interface LockDomainPayload {
  domain: string;
}

export interface SnoozeDomainPayload {
  domain: string;
  durationMinutes: number;
}

export interface GetUnlockStatusPayload {
  domain: string;
}

export interface GetUnlockStatusResponse {
  isUnlocked: boolean;
  isSnoozed: boolean;
  snoozeEndsAt?: number;
  unlockEndsAt?: number;
}

export interface CreateRulePayload {
  urlPattern: string;
  action: 'lock' | 'block' | 'redirect';
  options?: {
    customPassword?: string;
    redirectUrl?: string;
    lockMode?: 'always' | 'timed' | 'session';
    timedDuration?: number;
    enabled?: boolean;
  };
}

export interface UpdateRulePayload {
  ruleId: string;
  updates: Partial<CreateRulePayload>;
}

export interface DeleteRulePayload {
  ruleId: string;
}

export interface SwitchProfilePayload {
  profileId: string;
  masterPassword: string;
}

export interface SetMasterPasswordPayload {
  password: string;
}

export interface VerifyMasterPasswordPayload {
  password: string;
}
