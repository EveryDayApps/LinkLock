import { getServices } from "../services/core/factory";
import { browser } from "../utils/get-browser";
import { backgroundLogger } from "../utils/logger";
import { BackgroundManager } from "./BackgroundManger";
import { BaseBrowserApi } from "./BaseBrowserApi";

export class BrowserApi extends BaseBrowserApi {
  backgroundManager = new BackgroundManager();
  async initialize(): Promise<void> {
    backgroundLogger.info("BrowserApi initializing...");

    const _services = getServices();
    await _services.db.initialize();
    await _services.ruleManager.initialize();
    await _services.profileManager.initialize();

    super.init(_services);
    this.initializeServices();
    this.setupEventListeners();

    this.backgroundManager.initialize();

    backgroundLogger.info("BrowserApi initialized successfully");
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    backgroundLogger.debug("Services initialized successfully");
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
