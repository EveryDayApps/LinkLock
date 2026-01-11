import type { LockMode, RuleAction } from "./enums";

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
    lockMode: LockMode;
    timedDuration?: number; // in minutes
    customPassword?: string;
    customPasswordHash?: string;
  };
  redirectOptions?: {
    redirectUrl: string;
  };
  profileIds: string[]; // Multiple profiles can use same rule
  applyToAllSubdomains: boolean;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
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
