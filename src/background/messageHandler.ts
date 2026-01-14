// ============================================
// Message Handler for Background Service
// Handles messages from UI (popup, options, unlock page)
// ============================================
import type { UnlockDuration } from "../models/enums";
import type { LocalStorageSyncService } from "../services/localStorageSyncService";
import type { ProfileManager } from "../services/profileManager";
import type { RuleEvaluator } from "../services/ruleEvaluator";
import type { RuleManager } from "../services/ruleManager";
import type { UnlockSessionManager } from "../services/unlockSessionManager";

export interface MessageHandler {
  ruleEvaluator: RuleEvaluator;
  sessionManager: UnlockSessionManager;
  profileManager: ProfileManager;
  ruleManager: RuleManager;
  localStorageSyncService: LocalStorageSyncService;
}

/**
 * Setup message listeners for communication with UI
 */
export function setupMessageHandler(services: MessageHandler): void {
  // Chrome
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      handleMessage(message, services)
        .then(sendResponse)
        .catch((error) => {
          console.error("Error handling message:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep channel open for async response
    });
  }

  // Firefox
  if (typeof browser !== "undefined" && browser.runtime) {
    browser.runtime.onMessage.addListener((message, _sender) => {
      return handleMessage(message, services);
    });
  }
}

/**
 * Helper function to trigger local storage sync after changes
 */
async function triggerSync(services: MessageHandler): Promise<void> {
  const { profileManager, ruleManager, localStorageSyncService } = services;

  try {
    const activeProfile = await profileManager.getActiveProfile();
    if (!activeProfile) {
      console.warn("No active profile found for sync");
      return;
    }

    const rules = await ruleManager.getAllRules();
    const masterPasswordHash =
      (await import("../services/db")).db.getMasterPasswordHash();

    if (!masterPasswordHash) {
      console.warn("Master password hash not available for sync");
      return;
    }

    await localStorageSyncService.fullSync(
      masterPasswordHash,
      activeProfile.id,
      rules,
      false // Don't encrypt in local storage for faster access
    );

    console.log("Local storage sync completed");
  } catch (error) {
    console.error("Failed to sync local storage:", error);
  }
}

/**
 * Handle incoming messages
 */
async function handleMessage(
  message: any,
  services: MessageHandler
): Promise<any> {
  const { sessionManager, profileManager, ruleManager } = services;

  switch (message.type) {
    // ============================================
    // Unlock Operations
    // ============================================
    case "UNLOCK_SITE": {
      const { domain, duration, profileId } = message.payload;
      await sessionManager.unlock(
        domain,
        duration as UnlockDuration,
        profileId
      );
      return { success: true };
    }

    case "LOCK_SITE": {
      const { domain, profileId } = message.payload;
      await sessionManager.lock(domain, profileId);
      return { success: true };
    }

    case "CHECK_UNLOCK_STATUS": {
      const { domain, profileId } = message.payload;
      const isUnlocked = await sessionManager.isUnlocked(domain, profileId);
      const isSnoozed = await sessionManager.isSnoozed(domain, profileId);
      return {
        success: true,
        isUnlocked,
        isSnoozed,
      };
    }

    case "GET_REMAINING_TIME": {
      const { domain, profileId } = message.payload;
      const remainingTime = sessionManager.getRemainingUnlockTime(
        domain,
        profileId
      );
      return { success: true, remainingTime };
    }

    // ============================================
    // Snooze Operations
    // ============================================
    case "SNOOZE_SITE": {
      const { domain, duration, profileId } = message.payload;
      await sessionManager.snooze(
        domain,
        duration as 5 | 30 | "today",
        profileId
      );
      return { success: true };
    }

    // ============================================
    // Profile Operations
    // ============================================
    case "GET_ACTIVE_PROFILE": {
      const profile = await profileManager.getActiveProfile();
      return { success: true, profile };
    }

    case "GET_ALL_PROFILES": {
      const profiles = await profileManager.getAllProfiles();
      return { success: true, profiles };
    }

    case "SWITCH_PROFILE": {
      const { profileId } = message.payload;
      const result = await profileManager.switchProfile(profileId);

      // Clear unlock sessions when switching profiles
      if (result.success) {
        await sessionManager.clearAllSessions();
        // Sync local storage with new profile's rules
        await triggerSync(services);
      }

      return result;
    }

    case "CREATE_PROFILE": {
      const { name, copyRulesFromProfileId } = message.payload;
      return await profileManager.createProfile(name, copyRulesFromProfileId);
    }

    case "UPDATE_PROFILE": {
      const { profileId, name } = message.payload;
      return await profileManager.updateProfile(profileId, name);
    }

    case "DELETE_PROFILE": {
      const { profileId } = message.payload;
      return await profileManager.deleteProfile(profileId);
    }

    // ============================================
    // Rule Operations
    // ============================================
    case "GET_ALL_RULES": {
      const rules = await ruleManager.getAllRules();
      return { success: true, rules };
    }

    case "GET_RULES_BY_PROFILE": {
      const { profileId } = message.payload;
      const rules = await ruleManager.getRulesByProfile(profileId);
      return { success: true, rules };
    }

    case "GET_RULE": {
      const { ruleId } = message.payload;
      const rule = await ruleManager.getRuleById(ruleId);
      return { success: true, rule };
    }

    case "CREATE_RULE": {
      const { ruleData } = message.payload;
      const result = await ruleManager.createRule(ruleData);
      if (result.success) {
        // Sync local storage when rule is created
        await triggerSync(services);
      }
      return result;
    }

    case "UPDATE_RULE": {
      const { ruleId, updates } = message.payload;
      const result = await ruleManager.updateRule(ruleId, updates);
      if (result.success) {
        // Sync local storage when rule is updated
        await triggerSync(services);
      }
      return result;
    }

    case "DELETE_RULE": {
      const { ruleId } = message.payload;
      const result = await ruleManager.deleteRule(ruleId);
      if (result.success) {
        // Sync local storage when rule is deleted
        await triggerSync(services);
      }
      return result;
    }

    case "TOGGLE_RULE": {
      const { ruleId } = message.payload;
      const result = await ruleManager.toggleRule(ruleId);
      if (result.success) {
        // Sync local storage when rule is toggled
        await triggerSync(services);
      }
      return result;
    }

    case "ADD_PROFILE_TO_RULE": {
      const { ruleId, profileId } = message.payload;
      const result = await ruleManager.addProfileToRule(ruleId, profileId);
      if (result.success) {
        // Sync local storage when profile is added to rule
        await triggerSync(services);
      }
      return result;
    }

    case "REMOVE_PROFILE_FROM_RULE": {
      const { ruleId, profileId } = message.payload;
      const result = await ruleManager.removeProfileFromRule(ruleId, profileId);
      if (result.success) {
        // Sync local storage when profile is removed from rule
        await triggerSync(services);
      }
      return result;
    }

    // ============================================
    // Sync Operations
    // ============================================
    case "SYNC_LOCAL_STORAGE": {
      // Explicit sync request (e.g., after password change or on startup)
      await triggerSync(services);
      return { success: true };
    }

    case "CLEAR_LOCAL_STORAGE": {
      // Clear local storage data
      const { localStorageSyncService } = services;
      await localStorageSyncService.clearLocalStorage();
      return { success: true };
    }

    // ============================================
    // Debug Operations
    // ============================================
    case "GET_ALL_SESSIONS": {
      const sessions = sessionManager.getAllSessions();
      const snoozes = sessionManager.getAllSnoozes();
      return { success: true, sessions, snoozes };
    }

    case "CLEAR_ALL_SESSIONS": {
      const { profileId } = message.payload;
      await sessionManager.clearAllSessions(profileId);
      return { success: true };
    }

    default:
      console.warn("Unknown message type:", message.type);
      return { success: false, error: "Unknown message type" };
  }
}
