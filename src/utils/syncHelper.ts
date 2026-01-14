// ============================================
// Sync Helper
// Handles local storage sync in both React dev mode and extension mode
// ============================================

import { getServices } from "../services/core/factory";
import { db } from "../services/db";

/**
 * Check if running in extension context (background script available)
 */
function isExtensionContext(): boolean {
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
export async function triggerLocalStorageSync(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (isExtensionContext()) {
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
              performDirectSync().then(resolve);
            } else {
              resolve(response || { success: true });
            }
          }
        );
      });
    } else {
      // In React dev mode, perform direct sync
      return await performDirectSync();
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
async function performDirectSync(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const services = getServices();
    const { profileManager, ruleManager, localStorageSyncService } = services;

    // Get master password hash first - it's required for initialization
    const masterPasswordHash = db.getMasterPasswordHash();

    if (!masterPasswordHash) {
      console.warn("Master password hash not available for sync");
      return { success: false, error: "Master password hash not available" };
    }

    console.log(
      "[Sync] Starting direct sync with master password hash:",
      masterPasswordHash.substring(0, 10) + "..."
    );

    // Ensure profile manager is initialized with the password hash
    // This is important for React dev mode where initialization may not have happened
    try {
      await profileManager.initialize(masterPasswordHash);
    } catch (error) {
      // May already be initialized, continue
      console.log(
        "Profile manager initialization:",
        error instanceof Error ? error.message : "unknown error"
      );
    }

    // Also initialize rule manager
    try {
      await ruleManager.initialize(masterPasswordHash);
    } catch (error) {
      // May already be initialized, continue
      console.log(
        "Rule manager initialization:",
        error instanceof Error ? error.message : "unknown error"
      );
    }

    let activeProfile;
    try {
      activeProfile = await profileManager.getActiveProfile();
    } catch (profileError) {
      console.error("[Sync] Failed to get active profile:", profileError);
      return {
        success: false,
        error: `Failed to get active profile: ${
          profileError instanceof Error ? profileError.message : "Unknown error"
        }`,
      };
    }

    if (!activeProfile) {
      console.warn("No active profile found for sync");
      return { success: false, error: "No active profile found" };
    }

    const rules = await ruleManager.getAllRules();

    await localStorageSyncService.fullSync(
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
export async function clearLocalStorageData(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (isExtensionContext()) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: "CLEAR_LOCAL_STORAGE" },
          (response) => {
            if (chrome.runtime.lastError) {
              // Fall back to direct clear
              performDirectClear().then(resolve);
            } else {
              resolve(response || { success: true });
            }
          }
        );
      });
    } else {
      return await performDirectClear();
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
async function performDirectClear(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const services = getServices();
    await services.localStorageSyncService.clearLocalStorage();
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
