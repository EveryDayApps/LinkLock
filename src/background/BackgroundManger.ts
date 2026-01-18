// ============================================
// Background Manager - Manages background script operations
// Orchestrates loading and initialization
// Uses BackgroundStateStore for state management and event handling
// ============================================

import { backgroundLogger } from "@/utils/logger";
import type { WebNavigation } from "webextension-polyfill-ts/lib/webNavigation";
import { BackgroundStateStore } from "./BackgroundStateStore";

// Re-export BackgroundState for convenience
export type { BackgroundState } from "./BackgroundStateStore";

/**
 * BackgroundManager handles background script initialization and data loading.
 * All state management and event handling is delegated to BackgroundStateStore.
 */
export class BackgroundManager {
  private isInitialized = false;

  // Reference to the state store
  private readonly store = new BackgroundStateStore();

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the background manager
   * Sets up store and triggers initial load
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      backgroundLogger.warn("BackgroundManager already initialized");
      return;
    }

    // Initialize the state store (sets up listener, handlers, and loads data)
    await this.store.initialize();

    this.isInitialized = true;
    backgroundLogger.info("BackgroundManager initialized successfully");
  }

  // ============================================
  // Refresh Methods
  // ============================================

  /**
   * Force refresh all data from database
   * Useful after bulk operations or when data might be out of sync
   */
  async refreshAll(): Promise<void> {
    backgroundLogger.info("Refreshing all data from database...");
    await this.store.loadInitialData();
  }

  /**
   * Refresh only profiles from database
   */
  async refreshProfiles(): Promise<void> {
    backgroundLogger.info("Refreshing profiles...");
    await this.store.loadProfiles();
    this.store.selectInitialProfile();
  }

  /**
   * Refresh only rules from database
   */
  async refreshRules(): Promise<void> {
    backgroundLogger.info("Refreshing rules...");
    await this.store.loadRules();
  }

  onBeforeNavigate = async (
    details: WebNavigation.OnBeforeNavigateDetailsType,
  ) => {
    const selectedProfile = this.store.selectedProfile;
    backgroundLogger.info(
      `[BackgroundManager] selectedProfile for navigation to ${details.url}:`,
      selectedProfile,
    );
  };
}
