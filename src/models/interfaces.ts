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

// ============================================
// Local Storage Types (for extension runtime)
// Optimized minimal data structure for chrome.storage.local
// ============================================

/**
 * Core data stored in local storage
 * Contains only essential info needed for extension runtime
 */
export interface LocalStorageCore {
  masterPasswordHash: string;
  currentProfileId: string;
}

/**
 * Minimal rule data for local storage
 * Strips unnecessary fields based on action type
 */
export interface LocalStorageRule {
  id: string;
  urlPattern: string;
  action: RuleAction;
  // Only present if action is "lock"
  lockOptions?: {
    lockMode: LockMode;
    timedDuration?: number;
    customPasswordHash?: string; // Don't store plain password in local storage
  };
  // Only present if action is "redirect"
  redirectUrl?: string;
  applyToAllSubdomains: boolean;
  enabled: boolean;
}

/**
 * Complete local storage data structure
 */
export interface LocalStorageData {
  core: LocalStorageCore;
  rules: LocalStorageRule[];
}
