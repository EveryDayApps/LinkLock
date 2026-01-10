import { BaseBrowserApi } from "./BaseBrowserApi";

export class FireFoxBrowserApi extends BaseBrowserApi {
  initialize(): void {
    console.log("FireFoxBrowserApi initialized");
  }
  openOptionsPageListener(): void {
    // Firefox Manifest V2
    if (typeof browser !== "undefined" && browser.browserAction) {
      browser.browserAction.onClicked.addListener(() => {
        browser.runtime.openOptionsPage();
      });
    }
  }
}
