import { BaseBrowserApi } from "./BaseBrowserApi";

export class ChromeBrowserApi extends BaseBrowserApi {
  // Track tabs being redirected to prevent infinite loops
  private redirectingTabs = new Set<number>();

  initialize(): void {
    console.log("ChromeBrowserApi initialized");
    // this.setupTabCleanup();

    const chromeApi = this.getNativeApi();

    chromeApi.storage.local.set({ token: "abc" });

    chromeApi.storage.local.get("token", (result) => {
      console.log(result.token);
    });
  }

  getNativeApi(): typeof chrome {
    if (typeof chrome === "undefined") {
      throw new Error("Chrome API not available");
    }

    if (!chrome) {
      throw new Error("Chrome API is undefined");
    }

    return chrome;
  }

  // /**
  //  * Clean up tracking when tabs are closed
  //  */
  // private setupTabCleanup(): void {
  //   if (typeof chrome !== "undefined" && chrome.tabs) {
  //     chrome.tabs.onRemoved.addListener((tabId) => {
  //       this.redirectingTabs.delete(tabId);
  //     });
  //   }
  // }

  openOptionsPageListener(): void {
    const chromeApi = this.getNativeApi();
    if (chromeApi.action && chromeApi.action.onClicked) {
      chromeApi.action.onClicked.addListener(() => {
        chromeApi.runtime.openOptionsPage();
      });
    } else {
      console.error("Chrome action API not available");
    }
  }

  setupNavigationListener(): void {
    const chromeApi = this.getNativeApi();

    chromeApi.webNavigation.onBeforeNavigate.addListener(async (details) => {
      // Only intercept main frame navigations (not iframes)
      if (details.frameId !== 0) return;

      const data = await super.getServices().ruleManager.getAllRules();
      console.log("Current rules in rule manager:", data);
    });

    // console.log("Setting up Chrome navigation listener");
    // if (typeof chrome === "undefined" || !chrome.webNavigation) {
    //   console.error("Chrome webNavigation API not available");
    //   return;
    // }
    // console.log("Chrome webNavigation API available");
    // // Listen for navigation events (fires before navigation completes)
    // chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    //   // Only intercept main frame navigations (not iframes)
    //   if (details.frameId !== 0) {
    //     return;
    //   }
    //   // Prevent redirect loops
    //   if (this.redirectingTabs.has(details.tabId)) {
    //     return;
    //   }
    //   // Skip chrome:// and extension URLs
    //   if (
    //     details.url.startsWith("chrome://") ||
    //     details.url.startsWith("chrome-extension://") ||
    //     details.url.includes(chrome.runtime.getURL(""))
    //   ) {
    //     return;
    //   }
    //   await this.handleNavigation(details.url, details.tabId);
    // });
    // Also listen for tab URL updates (catches cases missed by webNavigation)
    // if (chrome.tabs && chrome.tabs.onUpdated) {
    //   chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    //     // Only process URL changes
    //     if (!changeInfo.url) {
    //       return;
    //     }
    //     // Prevent redirect loops
    //     if (this.redirectingTabs.has(tabId)) {
    //       return;
    //     }
    //     // Skip chrome:// and extension URLs
    //     if (
    //       changeInfo.url.startsWith("chrome://") ||
    //       changeInfo.url.startsWith("chrome-extension://") ||
    //       changeInfo.url.includes(chrome.runtime.getURL(""))
    //     ) {
    //       return;
    //     }
    //     await this.handleNavigation(changeInfo.url, tabId);
    //   });
    // }
  }

  // /**
  //  * Handle navigation and apply rules
  //  */
  // private async handleNavigation(url: string, tabId: number): Promise<void> {
  //   console.log(`Handling navigation to ${url} in tab ${tabId}`);

  //   const domain = "www.google.com"; // Placeholder for domain extraction logic
  //   const redirectUrl = "https://www.bing.com"; // Placeholder for redirect target
  //   const parsedUrl = new URL(url);
  //   console.log(parsedUrl);
  //   //parsedUrl.hostname == domain
  //   if (parsedUrl.hostname === domain) {
  //     console.log(`🔀 Redirecting ${url} to ${redirectUrl}`);
  //     await this.redirectNavigation(tabId, redirectUrl);
  //     return;
  //   } else {
  //     console.log(`✅ Allowing navigation to ${url}`);
  //   }

  //   // if (!this.ruleEvaluator || !this.profileManager || !this.ruleManager) {
  //   //   console.error("Services not initialized");
  //   //   return;
  //   // }

  //   // try {
  //   //   // Get active profile
  //   //   const activeProfile = this.profileManager.getActiveProfile();
  //   //   if (!activeProfile) {
  //   //     console.log("No active profile, allowing navigation");
  //   //     return; // No active profile, allow navigation
  //   //   }

  //   //   // Get all rules
  //   //   const rules = this.ruleManager.getAllRules();

  //   //   console.log(`Evaluating URL: ${url} against ${rules.length} rules`);

  //   //   // Evaluate the URL against rules
  //   //   const result = await this.ruleEvaluator.evaluate(
  //   //     url,
  //   //     rules,
  //   //     activeProfile.id
  //   //   );

  //   //   console.log(`Evaluation result for ${url}:`, result.action);

  //   //   // Handle the evaluation result
  //   //   switch (result.action) {
  //   //     case "block":
  //   //       console.log(`🚫 Blocking navigation to ${url}`);
  //   //       await this.blockNavigation(tabId);
  //   //       break;

  //   //     case "redirect":
  //   //       console.log(`🔀 Redirecting ${url} to ${result.target}`);
  //   //       await this.redirectNavigation(tabId, result.target);
  //   //       break;

  //   //     case "require_unlock":
  //   //       const unlockUrl = this.getUnlockPageUrl(url, result.rule.id);
  //   //       console.log(
  //   //         `🔒 Unlock required for ${url}, redirecting to unlock page`
  //   //       );
  //   //       await this.redirectNavigation(tabId, unlockUrl);
  //   //       break;

  //   //     case "allow":
  //   //       console.log(`✅ Allowing navigation to ${url}`);
  //   //       // Allow navigation to proceed
  //   //       break;
  //   //   }
  //   // } catch (error) {
  //   //   console.error("Error handling navigation:", error);
  //   // }
  // }

  // async blockNavigation(tabId: number): Promise<void> {
  //   try {
  //     // Mark tab as redirecting
  //     this.redirectingTabs.add(tabId);

  //     const blockUrl = this.getBlockPageUrl();
  //     await chrome.tabs.update(tabId, { url: blockUrl });

  //     // Clear the redirecting flag after a delay
  //     setTimeout(() => {
  //       this.redirectingTabs.delete(tabId);
  //     }, 1000);
  //   } catch (error) {
  //     console.error("Failed to block navigation:", error);
  //     this.redirectingTabs.delete(tabId);
  //   }
  // }

  // async redirectNavigation(tabId: number, url: string): Promise<void> {
  //   try {
  //     // Mark tab as redirecting
  //     this.redirectingTabs.add(tabId);

  //     await chrome.tabs.update(tabId, { url });

  //     // Clear the redirecting flag after a delay
  //     setTimeout(() => {
  //       this.redirectingTabs.delete(tabId);
  //     }, 1000);
  //   } catch (error) {
  //     console.error("Failed to redirect navigation:", error);
  //     this.redirectingTabs.delete(tabId);
  //   }
  // }
}
