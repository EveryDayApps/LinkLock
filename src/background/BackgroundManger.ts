// ============================================
// Background Manager - Manages background script operations
// Orchestrates loading and initialization
// Uses BackgroundStateStore for state management and event handling
// Uses LinkRuleHandler for URL matching and rule execution
// ============================================

import { backgroundLogger } from "@/utils/logger";
import { browser } from "@/utils/get-browser";
import type { WebRequest } from "webextension-polyfill-ts/lib/webRequest";
import { BackgroundStateStore } from "./BackgroundStateStore";
import { LinkRuleHandler } from "./LinkRuleHandler";
import { UnlockMessageHandler } from "./UnlockMessageHandler";

// Re-export BackgroundState for convenience
export type { BackgroundState } from "./BackgroundStateStore";

// Re-export LinkRuleHandler types
export type { ActionResult, MatchResult } from "./LinkRuleHandler";

/**
 * BackgroundManager handles background script initialization and data loading.
 * All state management and event handling is delegated to BackgroundStateStore.
 * URL matching and rule execution is handled by LinkRuleHandler.
 * Unlock message handling is managed by UnlockMessageHandler.
 */
export class BackgroundManager {
  private isInitialized = false;

  // Reference to the state store
  private readonly store = new BackgroundStateStore();

  // Link rule handler for URL matching and action execution
  private readonly ruleHandler = new LinkRuleHandler();

  // Unlock message handler for password verification
  private readonly unlockHandler: UnlockMessageHandler;

  constructor() {
    this.unlockHandler = new UnlockMessageHandler(this.store, this.ruleHandler);
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the background manager
   * Sets up store and triggers initial load
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      backgroundLogger.warn("BackgroundManager already initialized");
      return;
    }

    // Initialize the state store (sets up listener, handlers, and loads data)
    await this.store.initialize();

    // Initialize the unlock message handler
    this.unlockHandler.initialize();

    this.isInitialized = true;
    backgroundLogger.info("BackgroundManager initialized successfully");
  }

  // ============================================
  // Refresh Methods
  // ============================================

  /**
   * Force refresh all data from database
   * Useful after bulk operations or when data might be out of sync
   */
  async refreshAll(): Promise<void> {
    backgroundLogger.info("Refreshing all data from database...");
    await this.store.loadInitialData();
  }

  /**
   * Refresh only profiles from database
   */
  async refreshProfiles(): Promise<void> {
    backgroundLogger.info("Refreshing profiles...");
    await this.store.loadProfiles();
    this.store.selectInitialProfile();
  }

  /**
   * Refresh only rules from database
   */
  async refreshRules(): Promise<void> {
    backgroundLogger.info("Refreshing rules...");
    await this.store.loadRules();
  }

  /**
   * Handle web request - this is called BEFORE the request is made
   * and can return a redirect to block the original request
   *
   * This is the blocking handler that actually prevents navigation
   */
  onBeforeRequest = (
    details: WebRequest.OnBeforeRequestDetailsType,
  ): WebRequest.BlockingResponse | undefined => {
    // Only process main frame requests
    if (details.type !== "main_frame") return undefined;

    // Skip extension pages and browser internal URLs
    if (this.shouldSkipUrl(details.url)) return undefined;

    const selectedProfile = this.store.selectedProfile;
    if (!selectedProfile) {
      backgroundLogger.debug("No profile selected, skipping rule check");
      return undefined;
    }

    // Get rules for the selected profile
    const rules = this.store.getRulesForSelectedProfile();
    if (rules.length === 0) {
      backgroundLogger.debug("No rules for selected profile");
      return undefined;
    }

    // Convert to local storage format for matching
    const localRules = LinkRuleHandler.toLocalStorageRules(rules);

    // Match URL against rules
    const matchResult = this.ruleHandler.matchUrl(details.url, localRules);
    if (!matchResult.matched || !matchResult.rule) {
      backgroundLogger.debug(`No matching rule for URL: ${details.url}`);
      return undefined;
    }

    backgroundLogger.info(
      `[BackgroundManager] Matched rule ${matchResult.rule.id} for ${details.url}`,
    );

    // Process the matched rule
    const actionResult = this.ruleHandler.processRule(
      matchResult.rule,
      details.url,
    );

    // If action is allow, don't block
    if (actionResult.action === "allow") {
      return undefined;
    }

    // Get the redirect URL synchronously
    const redirectUrl = this.getRedirectUrl(actionResult, details.url);

    if (redirectUrl) {
      backgroundLogger.info(`Blocking and redirecting ${details.url} to ${redirectUrl}`);
      return { redirectUrl };
    }

    return undefined;
  };

  /**
   * Get the redirect URL for an action result (synchronous version)
   */
  private getRedirectUrl(actionResult: ReturnType<LinkRuleHandler["processRule"]>, originalUrl: string): string | undefined {
    switch (actionResult.action) {
      case "block":
        return this.getBlockedPageUrl(originalUrl);

      case "redirect":
        return actionResult.redirectUrl;

      case "lock":
        return this.getLockPageUrl(originalUrl, actionResult);

      default:
        return undefined;
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
  private getLockPageUrl(
    originalUrl: string,
    result: ReturnType<LinkRuleHandler["processRule"]>
  ): string {
    const unlockPage = browser.runtime.getURL("unlock.html");
    const params = new URLSearchParams({
      url: originalUrl,
      mode: result.lockMode || "always_ask",
    });

    // Add URL pattern for unlock tracking
    if (result.urlPattern) {
      params.set("pattern", result.urlPattern);
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
  // Navigation Helpers
  // ============================================

  /**
   * Check if URL should be skipped (extension pages, browser internal URLs)
   */
  private shouldSkipUrl(url: string): boolean {
    const skipPrefixes = [
      "chrome://",
      "chrome-extension://",
      "moz-extension://",
      "about:",
      "edge://",
      "brave://",
      browser.runtime.getURL(""), // Skip our own extension pages
    ];

    return skipPrefixes.some((prefix) => url.startsWith(prefix));
  }

  // ============================================
  // Rule Handler Access
  // ============================================

  /**
   * Get the rule handler instance for external access
   * Useful for unlock operations from lock page
   */
  getRuleHandler(): LinkRuleHandler {
    return this.ruleHandler;
  }

  /**
   * Unlock a URL pattern after successful password verification
   */
  unlockUrl(urlPattern: string, lockMode: "always_ask" | "timed_unlock" | "session_unlock", timedDuration?: number): void {
    this.ruleHandler.unlock(urlPattern, lockMode, timedDuration);
  }

  /**
   * Lock a URL pattern
   */
  lockUrl(urlPattern: string): void {
    this.ruleHandler.lock(urlPattern);
  }

  /**
   * Clear all session unlocks
   */
  clearAllUnlocks(): void {
    this.ruleHandler.clearAllUnlocks();
  }
}
