

import type { LockMode, RuleAction } from "./enums";

// ============================================
// Profile Types
// ============================================

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


export interface BaseRule {
  id: string;
  urlPattern: string;
  action: RuleAction;
  applyToAllSubdomains: boolean;
  enabled: boolean;
}

/**
 * Metadata fields for IndexedDB storage
 * These are only needed for the full model, not runtime
 */
export interface RuleMetadata {
  profileIds: string[]; // Multiple profiles can use same rule
  createdAt: number;
  updatedAt: number;
}

export interface LinkRule extends BaseRule, RuleMetadata {
  lockOptions?: LockOptions;
  redirectOptions?: RedirectOptions;
}

export interface LockOptions extends BaseLockOptions {
  customPassword?: string;
  customPasswordHash?: string;
}


export interface BaseLockOptions {
  lockMode: LockMode;
  timedDuration?: number; // in minutes, only for timed_unlock
}


export interface RedirectOptions {
  redirectUrl: string;
}
