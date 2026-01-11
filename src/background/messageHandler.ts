// ============================================
// Message Handler for Background Service
// Handles messages from UI (popup, options, unlock page)
// ============================================
import type { RuleEvaluator } from "../lib/ruleEvaluator";
import type { UnlockSessionManager } from "../lib/unlockSessionManager";
import type { ProfileManager } from "../lib/profileManager";
import type { RuleManager } from "../lib/ruleManager";
import type { UnlockDuration } from "../models/enums";

export interface MessageHandler {
  ruleEvaluator: RuleEvaluator;
  sessionManager: UnlockSessionManager;
  profileManager: ProfileManager;
  ruleManager: RuleManager;
}

/**
 * Setup message listeners for communication with UI
 */
export function setupMessageHandler(services: MessageHandler): void {
  const { sessionManager, profileManager, ruleManager } = services;

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
      await sessionManager.unlock(domain, duration as UnlockDuration, profileId);
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
      const profile = profileManager.getActiveProfile();
      return { success: true, profile };
    }

    case "GET_ALL_PROFILES": {
      const profiles = profileManager.getAllProfiles();
      return { success: true, profiles };
    }

    case "SWITCH_PROFILE": {
      const { profileId } = message.payload;
      const result = await profileManager.switchProfile(profileId);

      // Clear unlock sessions when switching profiles
      if (result.success) {
        await sessionManager.clearAllSessions();
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
      const rules = ruleManager.getAllRules();
      return { success: true, rules };
    }

    case "GET_RULES_BY_PROFILE": {
      const { profileId } = message.payload;
      const rules = ruleManager.getRulesByProfile(profileId);
      return { success: true, rules };
    }

    case "GET_RULE": {
      const { ruleId } = message.payload;
      const rule = ruleManager.getRuleById(ruleId);
      return { success: true, rule };
    }

    case "CREATE_RULE": {
      const { ruleData } = message.payload;
      return await ruleManager.createRule(ruleData);
    }

    case "UPDATE_RULE": {
      const { ruleId, updates } = message.payload;
      return await ruleManager.updateRule(ruleId, updates);
    }

    case "DELETE_RULE": {
      const { ruleId } = message.payload;
      return await ruleManager.deleteRule(ruleId);
    }

    case "TOGGLE_RULE": {
      const { ruleId } = message.payload;
      return await ruleManager.toggleRule(ruleId);
    }

    case "ADD_PROFILE_TO_RULE": {
      const { ruleId, profileId } = message.payload;
      return await ruleManager.addProfileToRule(ruleId, profileId);
    }

    case "REMOVE_PROFILE_FROM_RULE": {
      const { ruleId, profileId } = message.payload;
      return await ruleManager.removeProfileFromRule(ruleId, profileId);
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
