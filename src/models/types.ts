export type BrowserType = "chrome" | "firefox" | "unknown";

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

// ============================================
// Link Rule Types
// ============================================

export type RuleAction = "lock" | "block" | "redirect";

export type UnlockDuration = "always_ask" | "session" | number;

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

// ============================================
// Storage Types
// ============================================

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
    cooldownDuration: number;
    requireMasterAfterCooldown: boolean;
  };
}
