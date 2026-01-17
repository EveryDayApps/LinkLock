// import { BaseBrowserApi } from "./BaseBrowserApi";

// export class ChromeBrowserApi extends BaseBrowserApi {
//   // Track tabs being redirected to prevent infinite loops
//   private redirectingTabs = new Set<number>();

//   initialize(): void {
//     console.log("ChromeBrowserApi initialized");
//     // this.setupTabCleanup();

//     const chromeApi = this.getNativeApi();

//     chromeApi.storage.local.set({ token: "abc" });

//     chromeApi.storage.local.get("token", (result) => {
//       console.log(result.token);
//     });
//   }

//   getNativeApi(): typeof chrome {
//     if (typeof chrome === "undefined") {
//       throw new Error("Chrome API not available");
//     }

//     if (!chrome) {
//       throw new Error("Chrome API is undefined");
//     }

//     return chrome;
//   }

//   // /**
//   //  * Clean up tracking when tabs are closed
//   //  */
//   // private setupTabCleanup(): void {
//   //   if (typeof chrome !== "undefined" && chrome.tabs) {
//   //     chrome.tabs.onRemoved.addListener((tabId) => {
//   //       this.redirectingTabs.delete(tabId);
//   //     });
//   //   }
//   // }

//   openOptionsPageListener(): void {
//     const chromeApi = this.getNativeApi();
//     if (chromeApi.action && chromeApi.action.onClicked) {
//       chromeApi.action.onClicked.addListener(() => {
//         chromeApi.runtime.openOptionsPage();
//       });
//     } else {
//       console.error("Chrome action API not available");
//     }
//   }

//   setupNavigationListener(): void {
//     const chromeApi = this.getNativeApi();

//     const services = super.getServices();

//     chromeApi.webNavigation.onBeforeNavigate.addListener(async (details) => {
//       // Only intercept main frame navigations (not iframes)
//       if (details.frameId !== 0) return;

//       const allRules = await services.ruleManager.getAllRules();
//       const selectedProfile = await services.profileManager.getActiveProfile();
//       console.log("Selected profile:", selectedProfile);
//       const filteredRules = allRules.filter((rule) =>
//         rule.profileIds.includes(selectedProfile?.id || ""),
//       );

//       //print all links
//       // console.log("All rules:", filteredRules);
//       filteredRules.forEach((rule) => {
//         console.log(`Rule: ${rule.id}, URL Pattern: ${rule.urlPattern}`);
//       });

//       // console.log("Current rules in rule manager:", data);
//     });
//   }
// }
