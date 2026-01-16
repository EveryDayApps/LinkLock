import type { ProfileManager } from "../services/profileManager";
import type { RuleEvaluator } from "../services/ruleEvaluator";
import type { RuleManager } from "../services/ruleManager";
import type { UnlockSessionManager } from "../services/unlockSessionManager";

export abstract class BaseBrowserApi {
  protected ruleEvaluator?: RuleEvaluator;
  protected sessionManager?: UnlockSessionManager;
  protected profileManager?: ProfileManager;
  protected ruleManager?: RuleManager;

  abstract initialize(): void;
  abstract openOptionsPageListener(): void;
  abstract setupNavigationListener(): void;
  // abstract blockNavigation(tabId: number): Promise<void>;
  // abstract redirectNavigation(tabId: number, url: string): Promise<void>;

  /**
   * Set the service dependencies
   */
  setServices(
    ruleEvaluator: RuleEvaluator,
    sessionManager: UnlockSessionManager,
    profileManager: ProfileManager,
    ruleManager: RuleManager
  ): void {
    this.ruleEvaluator = ruleEvaluator;
    this.sessionManager = sessionManager;
    this.profileManager = profileManager;
    this.ruleManager = ruleManager;
  }

  // /**
  //  * Get the unlock page URL with original URL and rule info
  //  */
  // protected getUnlockPageUrl(originalUrl: string, ruleId: string): string {
  //   const params = new URLSearchParams({
  //     url: originalUrl,
  //     ruleId: ruleId,
  //   });

  //   // Support both Chrome and Firefox
  //   if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
  //     return chrome.runtime.getURL(`unlock.html?${params}`);
  //   } else if (typeof browser !== "undefined" && browser.runtime?.getURL) {
  //     return browser.runtime.getURL(`unlock.html?${params}`);
  //   }

  //   return `unlock.html?${params}`;
  // }

  // /**
  //  * Get the block page URL
  //  */
  // protected getBlockPageUrl(): string {
  //   // Support both Chrome and Firefox
  //   if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
  //     return chrome.runtime.getURL("blocked.html");
  //   } else if (typeof browser !== "undefined" && browser.runtime?.getURL) {
  //     return browser.runtime.getURL("blocked.html");
  //   }

  //   return "blocked.html";
  // }
}
