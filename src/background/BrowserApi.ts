import type { LockMode } from "@/models/enums";
import { browser } from "../utils/get-browser";
import { backgroundLogger } from "../utils/logger";
import { BackgroundManager } from "./BackgroundManger";
import { BaseBrowserApi } from "./BaseBrowserApi";

/**
 * Detect if we're running in Chrome (MV3) or Firefox (MV2)
 * Chrome MV3 doesn't support blocking webRequest
 */
function isChromeMV3(): boolean {
  try {
    // Check manifest version - MV3 is Chrome, MV2 is Firefox
    const manifest = browser.runtime.getManifest();
    return manifest.manifest_version === 3;
  } catch {
    return false;
  }
}

/**
 * BrowserApi - Cross-browser implementation using webextension-polyfill
 * Works with both Chrome and Firefox
 *
 * Chrome MV3: Uses webNavigation + tabs.update (non-blocking, slight flash)
 * Firefox MV2: Uses webRequest.onBeforeRequest with blocking (true interception)
 */
export class BrowserApi extends BaseBrowserApi {
  logger = backgroundLogger;

  manager = new BackgroundManager();

  async initialize(): Promise<void> {
    try {
      this.logger.info("BrowserApi initializing...");
      await this.manager.initialize();
      this.setupEventListeners();

      this.logger.info("BrowserApi initialized successfully");
    } catch (error) {
      this.logger.error("Error during BrowserApi initialization:", error);
    }
  }

  private setupEventListeners(): void {
    this.openOptionsPageListener();
    this.setupNavigationListener();
  }

  openOptionsPageListener(): void {
    browser.action.onClicked.addListener(() => {
      browser.runtime.openOptionsPage();
    });
  }

  setupNavigationListener(): void {
    if (isChromeMV3()) {
      this.setupChromeNavigationListener();
    } else {
      this.setupFirefoxNavigationListener();
    }
  }

  /**
   * Chrome MV3 navigation listener
   * Uses webNavigation.onBeforeNavigate + immediate tabs.update
   * Note: May have a brief flash of the original page before redirect
   */
  private setupChromeNavigationListener(): void {
    this.logger.info("Setting up Chrome MV3 navigation listener");

    browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
      // Only process main frame navigations
      if (details.frameId !== 0) return;

      const result = this.manager.onBeforeRequest({
        url: details.url,
        type: "main_frame",
        tabId: details.tabId,
        requestId: "",
        timeStamp: details.timeStamp,
        method: "GET",
      } as any);

      if (result?.redirectUrl) {
        // Immediately redirect the tab
        try {
          await browser.tabs.update(details.tabId, { url: result.redirectUrl });
          this.logger.debug(`Chrome: Redirected tab ${details.tabId} to ${result.redirectUrl}`);
        } catch (error) {
          this.logger.error("Failed to redirect tab:", error);
        }
      }
    });
  }

  /**
   * Firefox MV2 navigation listener
   * Uses webRequest.onBeforeRequest with blocking for true request interception
   */
  private setupFirefoxNavigationListener(): void {
    this.logger.info("Setting up Firefox MV2 navigation listener with blocking");

    browser.webRequest.onBeforeRequest.addListener(
      this.manager.onBeforeRequest,
      { urls: ["<all_urls>"], types: ["main_frame"] },
      ["blocking"]
    );
  }

  // ============================================
  // Rule Handler Methods Implementation
  // ============================================

  /**
   * Unlock a URL pattern after successful password verification
   */
  unlockUrl(urlPattern: string, lockMode: LockMode, timedDuration?: number): void {
    this.manager.unlockUrl(urlPattern, lockMode, timedDuration);
  }

  /**
   * Lock a URL pattern (remove from unlocked list)
   */
  lockUrl(urlPattern: string): void {
    this.manager.lockUrl(urlPattern);
  }

  /**
   * Clear all session unlocks
   */
  clearAllUnlocks(): void {
    this.manager.clearAllUnlocks();
  }
}

// Runtime feature detection for browser
const browserApi: BaseBrowserApi = new BrowserApi();

// Initialize
browserApi.initialize();

// Export for use in other parts of the extension
export { browserApi };
