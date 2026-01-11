import type { RuleAction, UnlockDuration } from "./enums";

export interface Profile {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileWithRuleCount extends Profile {
  ruleCount: number;
}

export interface LinkRule {
  id: string;
  urlPattern: string;
  action: RuleAction;
  lockOptions?: {
    unlockDuration: UnlockDuration;
    useCustomPassword: boolean;
    customPasswordHash?: string;
  };
  redirectOptions?: {
    targetUrl: string;
  };
  profileId: string;
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
}

export interface StorageData {
  profiles: Profile[];
  rules: LinkRule[];
  securityConfig?: {
    masterPasswordHash: string;
    failedAttemptLimit: number;
    coolDownDuration: number;
    requireMasterAfterCoolDown: boolean;
  };
}
