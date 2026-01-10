import { detectBrowser } from "@/utils/browser_utils";
import { BaseBrowserApi } from "./BaseBrowserApi";
import { ChromeBrowserApi } from "./ChromeBrowserApi";
import { FireFoxBrowserApi } from "./FireFoxBrowserApi";

export class BrowserApi extends BaseBrowserApi {
  private _browserApi: BaseBrowserApi | undefined;

  get api(): BaseBrowserApi {
    if (!this._browserApi) throw new Error("BrowserApi not initialized");
    return this._browserApi;
  }

  initialize(): void {
    console.log("BrowserApi initialized");
    this._browserApi = this.createBrowserApi();
    this.api.initialize();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.openOptionsPageListener();
  }

  openOptionsPageListener(): void {
    this.api.openOptionsPageListener();
  }

  private createBrowserApi(): BaseBrowserApi {
    const browserType = detectBrowser();
    switch (browserType) {
      case "chrome":
        return new ChromeBrowserApi();
      case "firefox":
        return new FireFoxBrowserApi();
      default:
        throw new Error(`Unsupported browser: ${browserType}`);
    }
  }
}

// Runtime feature detection for browser
const browserApi: BaseBrowserApi = new BrowserApi();

// Initialize
browserApi.initialize();
