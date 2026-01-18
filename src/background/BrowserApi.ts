import { browser } from "../utils/get-browser";
import { backgroundLogger } from "../utils/logger";
import { BackgroundManager } from "./BackgroundManger";
import { BaseBrowserApi } from "./BaseBrowserApi";

export class BrowserApi extends BaseBrowserApi {
  manager = new BackgroundManager();
  logger = backgroundLogger;
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
    // this.manager.onMasterPasswordCreate = () => {
    //   this.logger.info("Master password created, re-initializing services...");
    //   this.initialize();
    // };
  }

  openOptionsPageListener(): void {
    browser.action.onClicked.addListener(() => {
      browser.runtime.openOptionsPage();
    });
  }

  setupNavigationListener(): void {
    browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
      const selectedProfile = this.manager.selectedProfile;
      this.logger.info(
        `[BrowserApi] selectedProfile for navigation to ${details.url}:`,
        selectedProfile,
      );
    });
  }
}

// Runtime feature detection for browser
const browserApi: BaseBrowserApi = new BrowserApi();

// Initialize
browserApi.initialize();

// Export for use in other parts of the extension
export { browserApi };
