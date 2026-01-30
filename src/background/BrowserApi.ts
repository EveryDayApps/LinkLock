import { browser } from "../utils/get-browser";
import { backgroundLogger } from "../utils/logger";
import { BackgroundManager } from "./BackgroundManger";
import { BaseBrowserApi } from "./BaseBrowserApi";

export class BrowserApi extends BaseBrowserApi {
  logger = backgroundLogger;

  manager = new BackgroundManager();

  async initialize(): Promise<void> {
    try {
      this.logger.info("BrowserApi initializing...");
      this.setupEventListeners();
      await this.manager.initialize();

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
    browser.webNavigation.onCommitted.addListener(
      this.manager.onCommitted,
    );
  }
}

// Runtime feature detection for browser
const browserApi: BaseBrowserApi = new BrowserApi();

// Initialize
browserApi.initialize();

// Export for use in other parts of the extension
export { browserApi };
