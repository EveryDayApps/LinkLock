import { detectBrowser } from "../utils/browser_utils";
import { BaseBrowserApi } from "./BaseBrowserApi";
import { ChromeBrowserApi } from "./ChromeBrowserApi";
import { FireFoxBrowserApi } from "./FireFoxBrowserApi";
import { RuleEvaluator } from "../lib/ruleEvaluator";
import { UnlockSessionManager } from "../lib/unlockSessionManager";
import { ProfileManager } from "../lib/profileManager";
import { RuleManager } from "../lib/ruleManager";
import { setupMessageHandler } from "./messageHandler";

export class BrowserApi extends BaseBrowserApi {
  private _browserApi: BaseBrowserApi | undefined;
  private _ruleEvaluator?: RuleEvaluator;
  private _sessionManager?: UnlockSessionManager;
  private _profileManager?: ProfileManager;
  private _ruleManager?: RuleManager;

  get api(): BaseBrowserApi {
    if (!this._browserApi) throw new Error("BrowserApi not initialized");
    return this._browserApi;
  }

  initialize(): void {
    console.log("BrowserApi initialized");
    this._browserApi = this.createBrowserApi();
    this.api.initialize();
    this.initializeServices();
    this.setupEventListeners();
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    // Create services
    this._sessionManager = new UnlockSessionManager();
    this._ruleEvaluator = new RuleEvaluator(this._sessionManager);
    this._profileManager = new ProfileManager();
    this._ruleManager = new RuleManager();

    // Set session manager reference in rule evaluator
    this._ruleEvaluator.setSessionManager(this._sessionManager);

    // Inject services into the browser API implementation
    this.api.setServices(
      this._ruleEvaluator,
      this._sessionManager,
      this._profileManager,
      this._ruleManager
    );

    // Setup message handler for communication with UI
    setupMessageHandler({
      ruleEvaluator: this._ruleEvaluator,
      sessionManager: this._sessionManager,
      profileManager: this._profileManager,
      ruleManager: this._ruleManager,
    });

    // Load sessions from storage
    this._sessionManager.loadFromStorage().catch((error) => {
      console.error("Failed to load unlock sessions:", error);
    });

    console.log("Services initialized successfully");
  }

  private setupEventListeners(): void {
    this.openOptionsPageListener();
    this.setupNavigationListener();
  }

  openOptionsPageListener(): void {
    this.api.openOptionsPageListener();
  }

  setupNavigationListener(): void {
    this.api.setupNavigationListener();
  }

  blockNavigation(tabId: number): Promise<void> {
    return this.api.blockNavigation(tabId);
  }

  redirectNavigation(tabId: number, url: string): Promise<void> {
    return this.api.redirectNavigation(tabId, url);
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

  /**
   * Get services for external access (e.g., from popup or options page)
   */
  getServices() {
    return {
      ruleEvaluator: this._ruleEvaluator,
      sessionManager: this._sessionManager,
      profileManager: this._profileManager,
      ruleManager: this._ruleManager,
    };
  }
}

// Runtime feature detection for browser
const browserApi: BaseBrowserApi = new BrowserApi();

// Initialize
browserApi.initialize();

// Export for use in other parts of the extension
export { browserApi };
