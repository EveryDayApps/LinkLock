// ============================================
// Data Models and Interfaces
// Type hierarchy for LinkLock data models
// ============================================
//
// Data Flow:
// IndexedDB -> LinkRule (full model) -> LocalStorageRule (subset) -> chrome.storage.local
//
// This hierarchy enables:
// 1. Full data in IndexedDB for UI and management
// 2. Minimal data in local storage for fast runtime access
// 3. Type-safe transformations between layers
// ============================================

import type {
  LockOptions,
  LocalStorageLockOptions,
  RedirectOptions,
  RuleAction,
} from "./enums";

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
// Base Rule Types (shared fields)
// ============================================

/**
 * Core fields present in all rule types
 * This is the foundation for all rule-related interfaces
 */
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

// ============================================
// IndexedDB Rule Types (Full Model)
// ============================================

/**
 * Full LinkRule stored in IndexedDB
 * Contains all data including metadata and full options
 */
export interface LinkRule extends BaseRule, RuleMetadata {
  lockOptions?: LockOptions;
  redirectOptions?: RedirectOptions;
}

/**
 * LinkRule with action: "lock"
 * Type guard helper for lock rules
 */
export interface LinkRuleLock extends LinkRule {
  action: "lock";
  lockOptions: LockOptions;
}

/**
 * LinkRule with action: "redirect"
 * Type guard helper for redirect rules
 */
export interface LinkRuleRedirect extends LinkRule {
  action: "redirect";
  redirectOptions: RedirectOptions;
}

/**
 * LinkRule with action: "block"
 * Type guard helper for block rules
 */
export interface LinkRuleBlock extends LinkRule {
  action: "block";
}

// ============================================
// Type Guards for Rule Types
// ============================================

export function isLockRule(rule: LinkRule): rule is LinkRuleLock {
  return rule.action === "lock" && rule.lockOptions !== undefined;
}

export function isRedirectRule(rule: LinkRule): rule is LinkRuleRedirect {
  return rule.action === "redirect" && rule.redirectOptions !== undefined;
}

export function isBlockRule(rule: LinkRule): rule is LinkRuleBlock {
  return rule.action === "block";
}

// ============================================
// Local Storage Rule Types (Subset Model)
// Optimized for runtime performance in background.js
// ============================================

/**
 * Base local storage rule - minimal fields for runtime
 * Extends BaseRule without metadata (no profileIds, timestamps)
 */
export interface LocalStorageRule extends BaseRule {
  // Only present if action is "lock"
  lockOptions?: LocalStorageLockOptions;
  // Only present if action is "redirect" (flattened from redirectOptions)
  redirectUrl?: string;
}

/**
 * Local storage rule with action: "lock"
 */
export interface LocalStorageRuleLock extends LocalStorageRule {
  action: "lock";
  lockOptions: LocalStorageLockOptions;
}

/**
 * Local storage rule with action: "redirect"
 */
export interface LocalStorageRuleRedirect extends LocalStorageRule {
  action: "redirect";
  redirectUrl: string;
}

/**
 * Local storage rule with action: "block"
 */
export interface LocalStorageRuleBlock extends LocalStorageRule {
  action: "block";
}

// ============================================
// Type Guards for Local Storage Rules
// ============================================

export function isLocalStorageLockRule(
  rule: LocalStorageRule
): rule is LocalStorageRuleLock {
  return rule.action === "lock" && rule.lockOptions !== undefined;
}

export function isLocalStorageRedirectRule(
  rule: LocalStorageRule
): rule is LocalStorageRuleRedirect {
  return rule.action === "redirect" && rule.redirectUrl !== undefined;
}

export function isLocalStorageBlockRule(
  rule: LocalStorageRule
): rule is LocalStorageRuleBlock {
  return rule.action === "block";
}

// ============================================
// Local Storage Core Types
// For linklock_core storage key
// ============================================

/**
 * Core data stored in local storage under "linklock_core"
 * Contains essential runtime configuration
 */
export interface LocalStorageCore {
  masterPasswordHash: string;
  currentProfileId: string;
}

/**
 * Complete local storage data structure
 * Represents all LinkLock data in chrome.storage.local
 */
export interface LocalStorageData {
  core: LocalStorageCore;
  rules: LocalStorageRule[];
}

// ============================================
// Conversion Utilities
// Transform between IndexedDB and LocalStorage types
// ============================================

/**
 * Convert a full LinkRule to a LocalStorageRule
 * Strips metadata and converts nested options
 */
export function toLocalStorageRule(rule: LinkRule): LocalStorageRule {
  const localRule: LocalStorageRule = {
    id: rule.id,
    urlPattern: rule.urlPattern,
    action: rule.action,
    applyToAllSubdomains: rule.applyToAllSubdomains,
    enabled: rule.enabled,
  };

  // Convert lock options (strip plain password)
  if (rule.action === "lock" && rule.lockOptions) {
    localRule.lockOptions = {
      lockMode: rule.lockOptions.lockMode,
    };

    if (
      rule.lockOptions.lockMode === "timed_unlock" &&
      rule.lockOptions.timedDuration !== undefined
    ) {
      localRule.lockOptions.timedDuration = rule.lockOptions.timedDuration;
    }

    if (rule.lockOptions.customPasswordHash) {
      localRule.lockOptions.customPasswordHash =
        rule.lockOptions.customPasswordHash;
    }
  }

  // Flatten redirect options
  if (rule.action === "redirect" && rule.redirectOptions?.redirectUrl) {
    localRule.redirectUrl = rule.redirectOptions.redirectUrl;
  }

  return localRule;
}

/**
 * Convert multiple LinkRules to LocalStorageRules
 * Filters by profile and enabled status
 */
export function toLocalStorageRules(
  rules: LinkRule[],
  profileId: string
): LocalStorageRule[] {
  return rules
    .filter((rule) => rule.profileIds.includes(profileId) && rule.enabled)
    .map(toLocalStorageRule);
}

// ============================================
// Legacy Types (for backward compatibility)
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
    coolDownDuration: number;
    requireMasterAfterCoolDown: boolean;
  };
}

// ============================================
// Re-export enums for convenience
// ============================================

export type { LockMode, LockOptions, LocalStorageLockOptions, RedirectOptions, RuleAction } from "./enums";
