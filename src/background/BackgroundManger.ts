// ============================================
// Background Manager - Manages background script operations
// Orchestrates loading and initialization
// Uses BackgroundStateStore for state management and event handling
// ============================================

import { LinkLockLocalDb } from "@/services/database/local_lb";
import { backgroundLogger } from "@/utils/logger";
import { browser } from "webextension-polyfill-ts";
import type { WebNavigation } from "webextension-polyfill-ts/lib/webNavigation";
import type { LinkRule, NavigationDetails } from "./BackgroundModels";
import { BackgroundStateStore } from "./BackgroundStateStore";
import { BrowserUtils } from "./BrowserUtils";

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
  private readonly utils = new BrowserUtils();

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


  onBeforeRequest = async (
    details: WebNavigation.OnBeforeNavigateDetailsType,
  ) => {
    // // Placeholder for onBeforeRequest logic

    // backgroundLogger.info("onBeforeRequest", details);



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
    const url = this.utils.extractDomainAndVerify(details.url);

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
      const hashPassword = activeSession.passwordHash;

      backgroundLogger.info(`[BackgroundManager] Active session password hash:`, hashPassword);

      if (hashPassword) {
        const rulePasswordHash = this.getPasswordHashForRule(matchingRule);

        backgroundLogger.info(`[BackgroundManager] Rule password hash:`, rulePasswordHash);
        if (rulePasswordHash && hashPassword === rulePasswordHash) {
          // open the url in the tab
          backgroundLogger.info(`[BackgroundManager] Active session found for ${details.url}, allowing navigation.`);
          return;
        }
      }
    } else {
      // Handle the rule action
      const activeTabSession = this.utils.getActiveTabSessionFromRule(matchingRule, details.tabId, details.url);
      await this.localDb.setSession(activeTabSession);

      const session = await this.localDb.getSession(details.url);

      backgroundLogger.info(`[BackgroundManager] Created new session for ${details.url}:`, session);

      const urlBase64 = btoa(details.url);
      backgroundLogger.info("Encoded URL:", urlBase64);

      const unlockUrl = browser.runtime.getURL("unlock.html") + "?url=" + urlBase64;
      backgroundLogger.info("Unlock URL:", unlockUrl);
      await browser.tabs.update(details.tabId, { url: `${unlockUrl}` });
    }

    return;

  }



  private getPasswordHashForRule(rule: LinkRule): string | null {
    if (rule.lockOptions?.customPasswordHash) {
      return rule.lockOptions.customPasswordHash;
    }

    const masterPasswordHash = this.store.masterPassword?.encryptedPasswordHash;
    if (masterPasswordHash) return masterPasswordHash;

    return null;
  }




  // ============================================
  // Navigation Handler
  // ============================================



  onBeforeNavigate = async (
    details: WebNavigation.OnBeforeNavigateDetailsType,
  ) => {
    // backgroundLogger.info("onBeforeNavigate", details);


    // const url = details.url;

    // if (url.includes("google.com")) {
    //   backgroundLogger.info("Blocking navigation to Google:", url);
    //   // await browser.tabs.update(details.tabId, { url: "https://www.bing.com" });
    // }


    // const url = details.url;

    //     if (url.includes("x.com")) {
    //       browser.storage.local.set({ "url_visited": url });
    //       const unlockUrl = browser.runtime.getURL("unlock.html");
    //       backgroundLogger.info("Unlock URL:", unlockUrl);
    //       await browser.tabs.update(details.tabId, { url: `${unlockUrl}` });
    //     }




    // // Only process main frame navigations
    // if (details.frameId !== 0) {
    //   return;
    // }

    // const selectedProfile = this.store.selectedProfile;

    // if (!selectedProfile) {
    //   backgroundLogger.warn(`[BackgroundManager] No selected profile for navigation to ${details.url}`);
    //   return;
    // }

    // // Get rules for the selected profile
    // const rules = this.store.rules.filter((rule) =>
    //   rule.profileIds.includes(selectedProfile.id) && rule.enabled
    // );

    // backgroundLogger.info(`[BackgroundManager] Processing navigation to ${details.url} with ${rules.length} active rules`);

    // // Find a matching rule for this URL
    // const matchingRule = this.findMatchingRule(details.url, rules);

    // if (!matchingRule) return;

    // backgroundLogger.info(`[BackgroundManager] Matched rule for ${details.url}:`, matchingRule);

    // // Handle the rule action
    // await this.handleRuleAction(details.tabId, details.url, matchingRule);
  };


}
