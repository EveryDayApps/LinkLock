import type { Services } from "@/services/core/types";

export abstract class BaseBrowserApi {
  protected services: Services | null | undefined;

  abstract initialize(): void;
  abstract openOptionsPageListener(): void;
  abstract setupNavigationListener(): void;

  init(services: Services): void {
    this.services = services;
  }

  getServices(): Services {
    if (!this.services) {
      throw new Error("Services not initialized in BrowserApi");
    }
    return this.services;
  }

  // abstract blockNavigation(tabId: number): Promise<void>;
  // abstract redirectNavigation(tabId: number, url: string): Promise<void>;

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
