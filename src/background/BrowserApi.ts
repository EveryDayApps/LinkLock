import { getServices } from "../services/core";
import type { LocalStorageSyncService } from "../services/localStorageSyncService";
import { ProfileManager } from "../services/profileManager";
import { RuleEvaluator } from "../services/ruleEvaluator";
import { RuleManager } from "../services/ruleManager";
import { UnlockSessionManager } from "../services/unlockSessionManager";
import { detectBrowser } from "../utils/browser_utils";
import { BaseBrowserApi } from "./BaseBrowserApi";
import { ChromeBrowserApi } from "./ChromeBrowserApi";
import { FireFoxBrowserApi } from "./FireFoxBrowserApi";
import { setupMessageHandler } from "./messageHandler";

export class BrowserApi extends BaseBrowserApi {
  private _browserApi: BaseBrowserApi | undefined;
  private _ruleEvaluator?: RuleEvaluator;
  private _sessionManager?: UnlockSessionManager;
  private _profileManager?: ProfileManager;
  private _ruleManager?: RuleManager;
  private _localStorageSyncService?: LocalStorageSyncService;

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
    // Get services from the factory (singleton)
    const services = getServices();

    this._sessionManager = services.unlockSessionManager;
    this._ruleEvaluator = services.ruleEvaluator;
    this._profileManager = services.profileManager;
    this._ruleManager = services.ruleManager;
    this._localStorageSyncService = services.localStorageSyncService;

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
      localStorageSyncService: this._localStorageSyncService,
    });

    // Load sessions from storage
    this._sessionManager.loadFromStorage().catch((error) => {
      console.error("Failed to load unlock sessions:", error);
    });

    // Trigger initial sync on startup
    this.performStartupSync().catch((error) => {
      console.error("Failed to perform startup sync:", error);
    });

    // Setup extension lifecycle listeners
    this.setupLifecycleListeners();

    console.log("Services initialized successfully");
  }

  private setupEventListeners(): void {
    this.openOptionsPageListener();
    this.setupNavigationListener();
  }

  /**
   * Setup extension lifecycle listeners (install, startup)
   */
  private setupLifecycleListeners(): void {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      // Listen for extension installation or update
      chrome.runtime.onInstalled.addListener((details) => {
        console.log("Extension installed/updated:", details.reason);
        // Trigger sync after install/update
        this.performStartupSync().catch((error) => {
          console.error("Failed to sync after install:", error);
        });
      });

      // Listen for browser/extension startup
      chrome.runtime.onStartup.addListener(() => {
        console.log("Extension startup");
        // Trigger sync on startup
        this.performStartupSync().catch((error) => {
          console.error("Failed to sync on startup:", error);
        });
      });
    }
  }

  /**
   * Perform startup sync if master password is set
   */
  private async performStartupSync(): Promise<void> {
    try {
      if (
        !this._profileManager ||
        !this._ruleManager ||
        !this._localStorageSyncService
      ) {
        console.warn("Services not yet initialized, skipping startup sync");
        return;
      }

      const { db } = await import("../services/db");
      const masterPasswordHash = db.getMasterPasswordHash();

      if (!masterPasswordHash) {
        console.log("Master password not set yet, skipping startup sync");
        return;
      }

      console.log("Performing startup sync...");

      // Initialize managers
      await this._profileManager.initialize();
      await this._ruleManager.initialize();

      const activeProfile = await this._profileManager.getActiveProfile();
      if (!activeProfile) {
        console.warn("No active profile found for startup sync");
        return;
      }

      const rules = await this._ruleManager.getAllRules();

      await this._localStorageSyncService.fullSync(
        masterPasswordHash,
        activeProfile.id,
        rules,
        false // Don't encrypt in local storage for faster access
      );

      console.log("Startup sync completed successfully");
    } catch (error) {
      console.error("Startup sync failed:", error);
      // Don't throw - allow extension to continue working
    }
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
      localStorageSyncService: this._localStorageSyncService,
    };
  }
}

// Runtime feature detection for browser
const browserApi: BaseBrowserApi = new BrowserApi();

// Initialize
browserApi.initialize();

// Export for use in other parts of the extension
export { browserApi };
