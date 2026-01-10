import { BaseBrowserApi } from "./BaseBrowserApi";

export class ChromeBrowserApi extends BaseBrowserApi {
  initialize(): void {
    console.log("ChromeBrowserApi initialized");
  }
  openOptionsPageListener(): void {
    // Chrome Manifest V3
    if (typeof chrome !== "undefined" && chrome.action) {
      chrome.action.onClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
      });
    }
  }
}
