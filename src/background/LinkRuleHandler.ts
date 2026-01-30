// ============================================
// LinkRuleHandler - Handles URL matching and rule execution
// Supports lock, block, and redirect actions
// Works with both Chrome and Firefox via webextension-polyfill
// ============================================

import type { LinkRule, LocalStorageRule } from "@/models/interfaces";
import {
  isLocalStorageBlockRule,
  isLocalStorageLockRule,
  isLocalStorageRedirectRule,
} from "@/models/interfaces";
import type { LockMode } from "@/models/enums";
import { browser } from "@/utils/get-browser";
import { backgroundLogger } from "@/utils/logger";

// ============================================
// Types
// ============================================

/**
 * Result of matching a URL against rules
 */
export interface MatchResult {
  matched: boolean;
  rule: LocalStorageRule | null;
}

/**
 * Action result returned after processing a rule
 */
export interface ActionResult {
  action: "lock" | "block" | "redirect" | "allow";
  redirectUrl?: string;
  lockMode?: LockMode;
  timedDuration?: number;
  requiresPassword?: boolean;
  customPasswordHash?: string;
  urlPattern?: string; // The pattern that matched, used for unlock tracking
}

/**
 * Session unlock entry for tracking unlocked URLs
 */
interface SessionUnlock {
  urlPattern: string;
  unlockedAt: number;
  expiresAt?: number; // For timed_unlock
}

// ============================================
// LinkRuleHandler Class
// ============================================

/**
 * Handles URL matching against rules and executes appropriate actions.
 * Supports:
 * - Lock: Password protection with always_ask, timed_unlock, or session_unlock modes
 * - Block: Completely blocks access to the URL
 * - Redirect: Redirects to a different URL
 */
export class LinkRuleHandler {
  // Session-based unlocks (cleared when browser closes)
  private sessionUnlocks: Map<string, SessionUnlock> = new Map();

  // ============================================
  // URL Matching
  // ============================================

  /**
   * Match a URL against a list of rules
   * Returns the first matching enabled rule
   */
  matchUrl(url: string, rules: LocalStorageRule[]): MatchResult {
    try {
      const parsedUrl = new URL(url);

      for (const rule of rules) {
        if (!rule.enabled) continue;

        if (this.urlMatchesPattern(parsedUrl, rule.urlPattern, rule.applyToAllSubdomains)) {
          backgroundLogger.debug(`URL matched rule: ${rule.id} for ${url}`);
          return { matched: true, rule };
        }
      }

      return { matched: false, rule: null };
    } catch (error) {
      backgroundLogger.error(`Error matching URL: ${url}`, error);
      return { matched: false, rule: null };
    }
  }

  /**
   * Check if a URL matches a pattern
   * Supports subdomain matching when applyToAllSubdomains is true
   */
  private urlMatchesPattern(
    url: URL,
    pattern: string,
    applyToAllSubdomains: boolean
  ): boolean {
    try {
      // Normalize the pattern - ensure it has a protocol
      const normalizedPattern = pattern.includes("://")
        ? pattern
        : `https://${pattern}`;

      const patternUrl = new URL(normalizedPattern);

      // Check hostname match
      const hostnameMatches = applyToAllSubdomains
        ? this.matchesWithSubdomains(url.hostname, patternUrl.hostname)
        : url.hostname.toLowerCase() === patternUrl.hostname.toLowerCase();

      if (!hostnameMatches) return false;

      // Check path match (pattern path should be prefix of URL path)
      const patternPath = patternUrl.pathname.replace(/\/$/, "") || "/";
      const urlPath = url.pathname.replace(/\/$/, "") || "/";

      // If pattern has a specific path, URL must start with it
      if (patternPath !== "/" && patternPath !== "") {
        return urlPath.startsWith(patternPath);
      }

      return true;
    } catch (error) {
      backgroundLogger.error(`Error parsing pattern: ${pattern}`, error);
      return false;
    }
  }

  /**
   * Check if a hostname matches the pattern hostname including subdomains
   * e.g., "sub.example.com" matches pattern "example.com" when subdomains enabled
   */
  private matchesWithSubdomains(hostname: string, patternHostname: string): boolean {
    const normalizedHostname = hostname.toLowerCase();
    const normalizedPattern = patternHostname.toLowerCase();

    // Exact match
    if (normalizedHostname === normalizedPattern) {
      return true;
    }

    // Subdomain match: hostname ends with .pattern
    return normalizedHostname.endsWith(`.${normalizedPattern}`);
  }

  // ============================================
  // Rule Processing
  // ============================================

  /**
   * Process a matched rule and determine the action to take
   */
  processRule(rule: LocalStorageRule, url: string): ActionResult {
    // Check if URL is already unlocked for this session
    if (this.isUnlocked(rule.urlPattern)) {
      backgroundLogger.debug(`URL ${url} is unlocked, allowing access`);
      return { action: "allow" };
    }

    if (isLocalStorageLockRule(rule)) {
      return this.processLockRule(rule, rule.urlPattern);
    }

    if (isLocalStorageBlockRule(rule)) {
      return this.processBlockRule();
    }

    if (isLocalStorageRedirectRule(rule)) {
      return this.processRedirectRule(rule);
    }

    // Default: allow
    return { action: "allow" };
  }

  /**
   * Process a lock rule
   */
  private processLockRule(rule: LocalStorageRule, urlPattern: string): ActionResult {
    const lockOptions = rule.lockOptions!;

    return {
      action: "lock",
      lockMode: lockOptions.lockMode,
      timedDuration: lockOptions.timedDuration,
      requiresPassword: true,
      customPasswordHash: lockOptions.customPasswordHash,
      urlPattern,
    };
  }

  /**
   * Process a block rule
   */
  private processBlockRule(): ActionResult {
    return { action: "block" };
  }

  /**
   * Process a redirect rule
   */
  private processRedirectRule(rule: LocalStorageRule): ActionResult {
    return {
      action: "redirect",
      redirectUrl: rule.redirectUrl,
    };
  }

  // ============================================
  // Session Unlock Management
  // ============================================

  /**
   * Check if a URL pattern is currently unlocked
   */
  isUnlocked(urlPattern: string): boolean {
    const unlock = this.sessionUnlocks.get(urlPattern);

    if (!unlock) return false;

    // Check if timed unlock has expired
    if (unlock.expiresAt && Date.now() > unlock.expiresAt) {
      this.sessionUnlocks.delete(urlPattern);
      return false;
    }

    return true;
  }

  /**
   * Unlock a URL pattern for the session or a specific duration
   */
  unlock(urlPattern: string, lockMode: LockMode, timedDuration?: number): void {
    const unlock: SessionUnlock = {
      urlPattern,
      unlockedAt: Date.now(),
    };

    if (lockMode === "timed_unlock" && timedDuration) {
      // Convert minutes to milliseconds
      unlock.expiresAt = Date.now() + timedDuration * 60 * 1000;
      backgroundLogger.debug(
        `URL pattern ${urlPattern} unlocked for ${timedDuration} minutes`
      );
    } else if (lockMode === "session_unlock") {
      // No expiry - lasts until browser closes
      backgroundLogger.debug(`URL pattern ${urlPattern} unlocked for session`);
    }
    // For always_ask, we don't store an unlock - password is always required

    if (lockMode !== "always_ask") {
      this.sessionUnlocks.set(urlPattern, unlock);
    }
  }

  /**
   * Lock a URL pattern (remove from unlocked list)
   */
  lock(urlPattern: string): void {
    this.sessionUnlocks.delete(urlPattern);
    backgroundLogger.debug(`URL pattern ${urlPattern} locked`);
  }

  /**
   * Clear all session unlocks
   */
  clearAllUnlocks(): void {
    this.sessionUnlocks.clear();
    backgroundLogger.debug("All session unlocks cleared");
  }

  // ============================================
  // Action Execution
  // ============================================

  /**
   * Execute the action for a navigation event
   * Returns the URL to redirect to, or null to allow/block
   */
  async executeAction(
    result: ActionResult,
    tabId: number,
    originalUrl: string
  ): Promise<{ shouldBlock: boolean; redirectUrl?: string }> {
    switch (result.action) {
      case "allow":
        return { shouldBlock: false };

      case "block":
        backgroundLogger.info(`Blocking URL: ${originalUrl}`);
        return {
          shouldBlock: true,
          redirectUrl: this.getBlockedPageUrl(originalUrl),
        };

      case "redirect":
        if (result.redirectUrl) {
          backgroundLogger.info(`Redirecting ${originalUrl} to ${result.redirectUrl}`);
          return {
            shouldBlock: true,
            redirectUrl: result.redirectUrl,
          };
        }
        return { shouldBlock: false };

      case "lock":
        backgroundLogger.info(`Locking URL: ${originalUrl}`);
        return {
          shouldBlock: true,
          redirectUrl: this.getLockPageUrl(originalUrl, result, result.urlPattern),
        };

      default:
        return { shouldBlock: false };
    }
  }

  /**
   * Get the URL for the blocked page
   */
  private getBlockedPageUrl(originalUrl: string): string {
    const blockedPage = browser.runtime.getURL("blocked.html");
    const params = new URLSearchParams({ url: originalUrl });
    return `${blockedPage}?${params.toString()}`;
  }

  /**
   * Get the URL for the lock/unlock page
   */
  private getLockPageUrl(originalUrl: string, result: ActionResult, urlPattern?: string): string {
    const unlockPage = browser.runtime.getURL("unlock.html");
    const params = new URLSearchParams({
      url: originalUrl,
      mode: result.lockMode || "always_ask",
    });

    // Add URL pattern for unlock tracking
    if (urlPattern) {
      params.set("pattern", urlPattern);
    }

    if (result.timedDuration) {
      params.set("duration", result.timedDuration.toString());
    }

    if (result.customPasswordHash) {
      params.set("custom", "true");
    }

    return `${unlockPage}?${params.toString()}`;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Convert LinkRule to LocalStorageRule format for matching
   * This is useful when working with in-memory rules from BackgroundStateStore
   */
  static toLocalStorageRule(rule: LinkRule): LocalStorageRule {
    const localRule: LocalStorageRule = {
      id: rule.id,
      urlPattern: rule.urlPattern,
      action: rule.action,
      applyToAllSubdomains: rule.applyToAllSubdomains,
      enabled: rule.enabled,
    };

    if (rule.action === "lock" && rule.lockOptions) {
      localRule.lockOptions = {
        lockMode: rule.lockOptions.lockMode,
        timedDuration: rule.lockOptions.timedDuration,
        customPasswordHash: rule.lockOptions.customPasswordHash,
      };
    }

    if (rule.action === "redirect" && rule.redirectOptions?.redirectUrl) {
      localRule.redirectUrl = rule.redirectOptions.redirectUrl;
    }

    return localRule;
  }

  /**
   * Convert multiple LinkRules to LocalStorageRules
   */
  static toLocalStorageRules(rules: LinkRule[]): LocalStorageRule[] {
    return rules.map((rule) => LinkRuleHandler.toLocalStorageRule(rule));
  }
}
