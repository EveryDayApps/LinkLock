// ============================================
// Background Manager - Manages background script operations
// Orchestrates loading and initialization
// Uses BackgroundStateStore for state management and event handling
// ============================================

import { AuthManager } from "@/services/authManager";
import { db } from "@/services/database";
import { LinkLockLocalDb } from "@/services/database/local_lb";
import { backgroundLogger } from "@/utils/logger";
import { browser } from "webextension-polyfill-ts";
import type { NavigationDetails } from "./BackgroundModels";
import { BackgroundStateStore } from "./BackgroundStateStore";
import { extractDomainAndVerify } from "./BrowserUtils";


// Re-export BackgroundState for convenience
export type { BackgroundState } from "./BackgroundStateStore";

/**
 * BackgroundManager handles background script initialization and data loading.
 * All state management and event handling is delegated to BackgroundStateStore.
 */
export class BackgroundManager {
  private isInitialized = false;

  // Reference to the state store
  private readonly store = new BackgroundStateStore();
  private readonly localDb = new LinkLockLocalDb();
  private readonly authManager = new AuthManager(db)


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


  //onCommitted
  onCommitted = async (
    details: NavigationDetails,
  ) => {
    backgroundLogger.info("onCommitted", details);


    // Ignore prerender documents
    if (details.documentLifecycle === "prerender") return;

    backgroundLogger.info("url:", details.url);

    // extract domain from details.url
    const url = extractDomainAndVerify(details.url);

    backgroundLogger.info("extracted domain:", url);

    if (url == null) {
      backgroundLogger.warn(`[BackgroundManager] Unable to extract domain from URL: ${details.url}`);
      return;
    }

    const selectedProfile = this.store.selectedProfile;

    if (!selectedProfile) {
      backgroundLogger.warn(`[BackgroundManager] No selected profile for navigation to ${details.url}`);
      return;
    }

    backgroundLogger.info(`[BackgroundManager] Selected profile: ${selectedProfile.name}`);

    this.store.rules.forEach((rule) => {
      backgroundLogger.info(`[BackgroundManager] Rule: ${rule.id} - ${rule.urlPattern}`);
    });


    const rules = this.store.rules.filter((rule) =>
      rule.profileIds.includes(selectedProfile.id) && rule.enabled && rule.urlPattern === url
    );

    backgroundLogger.info(`[BackgroundManager] Processing navigation to ${details.url} with ${rules.length} active rules`);

    // Find a matching rule for this URL
    const matchingRule = rules.find((rule) => { return rule.urlPattern });

    if (!matchingRule) return;

    backgroundLogger.info(`[BackgroundManager] Matched rule for ${details.url}:`, matchingRule);

    const activeSession = await this.localDb.getSession(details.url);

    if (activeSession) {

      backgroundLogger.info(`[BackgroundManager] Active session found for ${details.url}:`, activeSession);

      // If there's an active session, we can skip handling the rule action
      const hashPassword = activeSession.password;

      const isPasswordValid = await this.authManager.verifyMasterPassword(atob(hashPassword || ""));
      if (isPasswordValid.success) {
        backgroundLogger.info(`[BackgroundManager] Active session password is valid for ${details.url}, allowing navigation.`);
        return;
      }
    }
    // Handle the rule action
    const activeTabSession = { tabId: details.tabId, ruleId: matchingRule.id, action: matchingRule.action, url: details.url }
    await this.localDb.setSession(activeTabSession);
    const urlBase64 = btoa(details.url);
    const unlockUrl = browser.runtime.getURL("unlock.html") + "?url=" + urlBase64;
    await browser.tabs.update(details.tabId, { url: `${unlockUrl}` });

  }

}
