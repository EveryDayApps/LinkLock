// ============================================
// Sync Helper
// Handles local storage sync in both React dev mode and extension mode
// ============================================

import type { LinkLockDatabase } from "../services/db";
import type { LocalStorageSyncService } from "../services/localStorageSyncService";
import type { ProfileManager } from "../services/profileManager";
import type { RuleManager } from "../services/ruleManager";

/**
 * Sync Helper class for managing local storage synchronization
 */
export class SyncHelper {
  private profileManager: ProfileManager;
  private ruleManager: RuleManager;
  private localStorageSyncService: LocalStorageSyncService;
  private db: LinkLockDatabase;

  constructor(
    profileManager: ProfileManager,
    ruleManager: RuleManager,
    localStorageSyncService: LocalStorageSyncService,
    db: LinkLockDatabase
  ) {
    this.profileManager = profileManager;
    this.ruleManager = ruleManager;
    this.localStorageSyncService = localStorageSyncService;
    this.db = db;
  }

  /**
   * Check if running in extension context (background script available)
   */
  private isExtensionContext(): boolean {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      typeof chrome.runtime.sendMessage === "function"
    );
  }

  /**
   * Trigger local storage sync
   * Works in both React dev mode (direct call) and extension mode (via messaging)
   */
  async triggerLocalStorageSync(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (this.isExtensionContext()) {
        // In extension context, send message to background script
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: "SYNC_LOCAL_STORAGE" },
            (response) => {
              if (chrome.runtime.lastError) {
                // If messaging fails (e.g., background not ready), fall back to direct sync
                console.warn(
                  "Messaging failed, falling back to direct sync:",
                  chrome.runtime.lastError
                );
                this.performDirectSync().then(resolve);
              } else {
                resolve(response || { success: true });
              }
            }
          );
        });
      } else {
        console.log("dumpx 1");
        // In React dev mode, perform direct sync
        return await this.performDirectSync();
      }
    } catch (error) {
      console.error("Failed to trigger sync:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Perform direct sync without messaging
   * Used in React dev mode or as fallback
   */
  private async performDirectSync(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get master password hash first - it's required for initialization
      const masterPasswordHash = this.db.getMasterPasswordHash();

      console.log("dumpx 2", masterPasswordHash);

      if (!masterPasswordHash) {
        console.warn("Master password hash not available for sync");
        return { success: false, error: "Master password hash not available" };
      }

      console.log(
        "[Sync] Starting direct sync with master password hash:",
        masterPasswordHash.substring(0, 10) + "..."
      );

      // Ensure profile manager is initialized
      // This is important for React dev mode where initialization may not have happened
      try {
        await this.profileManager.initialize();
      } catch (error) {
        // May already be initialized, continue
        console.log(
          "Profile manager initialization:",
          error instanceof Error ? error.message : "unknown error"
        );
      }

      // Also initialize rule manager
      try {
        await this.ruleManager.initialize();
      } catch (error) {
        // May already be initialized, continue
        console.log(
          "Rule manager initialization:",
          error instanceof Error ? error.message : "unknown error"
        );
      }

      let activeProfile;
      try {
        activeProfile = await this.profileManager.getActiveProfile();
      } catch (profileError) {
        console.error("[Sync] Failed to get active profile:", profileError);
        return {
          success: false,
          error: `Failed to get active profile: ${
            profileError instanceof Error
              ? profileError.message
              : "Unknown error"
          }`,
        };
      }

      if (!activeProfile) {
        console.warn("No active profile found for sync");
        return { success: false, error: "No active profile found" };
      }

      const rules = await this.ruleManager.getAllRules();

      await this.localStorageSyncService.fullSync(
        masterPasswordHash,
        activeProfile.id,
        rules,
        false // Don't encrypt in local storage for faster access
      );

      console.log("Direct local storage sync completed");
      return { success: true };
    } catch (error) {
      console.error("Direct sync failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Clear local storage data
   * Works in both React dev mode and extension mode
   */
  async clearLocalStorageData(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (this.isExtensionContext()) {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: "CLEAR_LOCAL_STORAGE" },
            (response) => {
              if (chrome.runtime.lastError) {
                // Fall back to direct clear
                this.performDirectClear().then(resolve);
              } else {
                resolve(response || { success: true });
              }
            }
          );
        });
      } else {
        return await this.performDirectClear();
      }
    } catch (error) {
      console.error("Failed to clear local storage:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Perform direct clear without messaging
   */
  private async performDirectClear(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.localStorageSyncService.clearLocalStorage();
      console.log("Direct local storage clear completed");
      return { success: true };
    } catch (error) {
      console.error("Direct clear failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
