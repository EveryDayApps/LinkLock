// import { BaseBrowserApi } from "./BaseBrowserApi";

// export class FireFoxBrowserApi extends BaseBrowserApi {
//   // Track tabs being redirected to prevent infinite loops
//   private redirectingTabs = new Set<number>();

//   initialize(): void {
//     console.log("FireFoxBrowserApi initialized");
//     // this.setupTabCleanup();
//   }

//   // /**
//   //  * Clean up tracking when tabs are closed
//   //  */
//   // private setupTabCleanup(): void {
//   //   if (typeof browser !== "undefined" && browser.tabs) {
//   //     browser.tabs.onRemoved.addListener((tabId) => {
//   //       this.redirectingTabs.delete(tabId);
//   //     });
//   //   }
//   // }

//   openOptionsPageListener(): void {
//     // Firefox Manifest V2
//     if (typeof browser !== "undefined" && browser.browserAction) {
//       browser.browserAction.onClicked.addListener(() => {
//         browser.runtime.openOptionsPage();
//       });
//     }
//   }

//   setupNavigationListener(): void {
//     // if (typeof browser === "undefined") {
//     //   console.error("Firefox browser API not available");
//     //   return;
//     // }
//     // // Firefox supports webRequest blocking in Manifest V2
//     // if (browser.webRequest && browser.webRequest.onBeforeRequest) {
//     //   browser.webRequest.onBeforeRequest.addListener(
//     //     async (details) => {
//     //       // Only intercept main frame navigations (not iframes, images, etc.)
//     //       if (details.type !== "main_frame") {
//     //         return {};
//     //       }
//     //       // Prevent redirect loops
//     //       if (this.redirectingTabs.has(details.tabId)) {
//     //         return {};
//     //       }
//     //       // Skip about: and extension URLs
//     //       if (
//     //         details.url.startsWith("about:") ||
//     //         details.url.startsWith("moz-extension://")
//     //       ) {
//     //         return {};
//     //       }
//     //       const result = await this.handleNavigationFirefox(
//     //         details.url,
//     //         details.tabId
//     //       );
//     //       // Mark as redirecting if we're redirecting
//     //       if (result && "redirectUrl" in result) {
//     //         this.redirectingTabs.add(details.tabId);
//     //         setTimeout(() => {
//     //           this.redirectingTabs.delete(details.tabId);
//     //         }, 1000);
//     //       }
//     //       return result;
//     //     },
//     //     { urls: ["<all_urls>"], types: ["main_frame"] },
//     //     ["blocking"]
//     //   );
//     // } else {
//     //   console.error("Firefox webRequest API not available");
//     // }
//   }

//   // /**
//   //  * Handle navigation for Firefox using webRequest blocking API
//   //  * Returns redirect or cancel action
//   //  */
//   // private async handleNavigationFirefox(
//   //   url: string,
//   //   tabId: number
//   // ): Promise<{ redirectUrl?: string; cancel?: boolean } | {}> {
//   //   if (!this.ruleEvaluator || !this.profileManager || !this.ruleManager) {
//   //     console.error("Services not initialized");
//   //     return {};
//   //   }

//   //   try {
//   //     // Get active profile
//   //     const activeProfile = await this.profileManager.getActiveProfile();
//   //     if (!activeProfile) {
//   //       console.log("No active profile, allowing navigation");
//   //       return {}; // No active profile, allow navigation
//   //     }

//   //     // Get all rules
//   //     const rules = await this.ruleManager.getAllRules();

//   //     console.log(`Evaluating URL: ${url} against ${rules.length} rules`);

//   //     // Evaluate the URL against rules
//   //     const result = await this.ruleEvaluator.evaluate(
//   //       url,
//   //       rules,
//   //       activeProfile.id
//   //     );

//   //     console.log(`Evaluation result for ${url}:`, result.action);

//   //     // Handle the evaluation result
//   //     switch (result.action) {
//   //       case "block":
//   //         console.log(`🚫 Blocking navigation to ${url}`);
//   //         return { redirectUrl: this.getBlockPageUrl() };

//   //       case "redirect":
//   //         console.log(`🔀 Redirecting ${url} to ${result.target}`);
//   //         return { redirectUrl: result.target };

//   //       case "require_unlock":
//   //         const unlockUrl = this.getUnlockPageUrl(url, result.rule.id);
//   //         console.log(
//   //           `🔒 Unlock required for ${url}, redirecting to unlock page`
//   //         );
//   //         return { redirectUrl: unlockUrl };

//   //       case "allow":
//   //         console.log(`✅ Allowing navigation to ${url}`);
//   //         // Allow navigation to proceed
//   //         return {};
//   //     }
//   //   } catch (error) {
//   //     console.error("Error handling navigation:", error);
//   //     return {};
//   //   }
//   // }

//   // async blockNavigation(tabId: number): Promise<void> {
//   //   try {
//   //     const blockUrl = this.getBlockPageUrl();
//   //     await browser.tabs.update(tabId, { url: blockUrl });
//   //   } catch (error) {
//   //     console.error("Failed to block navigation:", error);
//   //   }
//   // }

//   // async redirectNavigation(tabId: number, url: string): Promise<void> {
//   //   try {
//   //     await browser.tabs.update(tabId, { url });
//   //   } catch (error) {
//   //     console.error("Failed to redirect navigation:", error);
//   //   }
//   // }
// }
