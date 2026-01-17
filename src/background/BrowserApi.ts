import { getServices } from "../services/core/factory";
import { browser } from "../utils/get-browser";
import { BaseBrowserApi } from "./BaseBrowserApi";
export class BrowserApi extends BaseBrowserApi {
  async initialize(): Promise<void> {
    console.log("BrowserApi initialized");
    const _services = getServices();
    await _services.db.initialize();
    await _services.ruleManager.initialize();
    await _services.profileManager.initialize();
    super.init(_services);
    this.initializeServices();
    this.setupEventListeners();

    browser.runtime.onMessage.addListener((message) => {
      if (message?.type !== "DB_CHANGE") return;

      const { table, type, key } = message.payload;

      console.log(
        `DB Change detected: Table=${table}, Type=${type}, Key=${key}`,
      );
      return Promise.resolve();
    });
  }

  // private createBrowserApi(): BaseBrowserApi {
  //   const browserType = detectBrowser();
  //   switch (browserType) {
  //     case "chrome":
  //       return new ChromeBrowserApi();
  //     case "firefox":
  //       return new FireFoxBrowserApi();
  //     default:
  //       throw new Error(`Unsupported browser: ${browserType}`);
  //   }
  // }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    console.log("Services initialized successfully");
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

  setupNavigationListener(): void {}
}

// Runtime feature detection for browser
const browserApi: BaseBrowserApi = new BrowserApi();

// Initialize
browserApi.initialize();

// Export for use in other parts of the extension
export { browserApi };
