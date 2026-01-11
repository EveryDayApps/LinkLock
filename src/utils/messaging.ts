// ============================================
// Messaging Utilities
// Helper functions for sending messages to background script
// ============================================
import type { UnlockDuration } from "@/models/enums";
import type { LinkRule } from "@/models/interfaces";

/**
 * Send a message to the background script
 */
async function sendMessage<T = any>(type: string, payload?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const message = { type, payload };

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } else if (typeof browser !== "undefined" && browser.runtime) {
      browser.runtime
        .sendMessage(message)
        .then(resolve)
        .catch(reject);
    } else {
      reject(new Error("No browser runtime available"));
    }
  });
}

// ============================================
// Unlock Operations
// ============================================

export async function unlockSite(
  domain: string,
  duration: UnlockDuration,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("UNLOCK_SITE", { domain, duration, profileId });
}

export async function lockSite(
  domain: string,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("LOCK_SITE", { domain, profileId });
}

export async function checkUnlockStatus(
  domain: string,
  profileId: string
): Promise<{
  success: boolean;
  isUnlocked: boolean;
  isSnoozed: boolean;
  error?: string;
}> {
  return sendMessage("CHECK_UNLOCK_STATUS", { domain, profileId });
}

export async function getRemainingTime(
  domain: string,
  profileId: string
): Promise<{ success: boolean; remainingTime: number; error?: string }> {
  return sendMessage("GET_REMAINING_TIME", { domain, profileId });
}

// ============================================
// Snooze Operations
// ============================================

export async function snoozeSite(
  domain: string,
  duration: 5 | 30 | "today",
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("SNOOZE_SITE", { domain, duration, profileId });
}

// ============================================
// Profile Operations
// ============================================

export async function getActiveProfile(): Promise<{
  success: boolean;
  profile: any;
  error?: string;
}> {
  return sendMessage("GET_ACTIVE_PROFILE");
}

export async function getAllProfiles(): Promise<{
  success: boolean;
  profiles: any[];
  error?: string;
}> {
  return sendMessage("GET_ALL_PROFILES");
}

export async function switchProfile(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("SWITCH_PROFILE", { profileId });
}

export async function createProfile(
  name: string,
  copyRulesFromProfileId?: string
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  return sendMessage("CREATE_PROFILE", { name, copyRulesFromProfileId });
}

export async function updateProfile(
  profileId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("UPDATE_PROFILE", { profileId, name });
}

export async function deleteProfile(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("DELETE_PROFILE", { profileId });
}

// ============================================
// Rule Operations
// ============================================

export async function getAllRules(): Promise<{
  success: boolean;
  rules: LinkRule[];
  error?: string;
}> {
  return sendMessage("GET_ALL_RULES");
}

export async function getRulesByProfile(
  profileId: string
): Promise<{
  success: boolean;
  rules: LinkRule[];
  error?: string;
}> {
  return sendMessage("GET_RULES_BY_PROFILE", { profileId });
}

export async function getRule(
  ruleId: string
): Promise<{
  success: boolean;
  rule: LinkRule | null;
  error?: string;
}> {
  return sendMessage("GET_RULE", { ruleId });
}

export async function createRule(
  ruleData: Omit<LinkRule, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; rule?: LinkRule; error?: string }> {
  return sendMessage("CREATE_RULE", { ruleData });
}

export async function updateRule(
  ruleId: string,
  updates: Partial<Omit<LinkRule, "id" | "createdAt" | "updatedAt" | "profileIds">>
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("UPDATE_RULE", { ruleId, updates });
}

export async function deleteRule(
  ruleId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("DELETE_RULE", { ruleId });
}

export async function toggleRule(
  ruleId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("TOGGLE_RULE", { ruleId });
}

export async function addProfileToRule(
  ruleId: string,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("ADD_PROFILE_TO_RULE", { ruleId, profileId });
}

export async function removeProfileFromRule(
  ruleId: string,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("REMOVE_PROFILE_FROM_RULE", { ruleId, profileId });
}

// ============================================
// Debug Operations
// ============================================

export async function getAllSessions(): Promise<{
  success: boolean;
  sessions: any[];
  snoozes: any[];
  error?: string;
}> {
  return sendMessage("GET_ALL_SESSIONS");
}

export async function clearAllSessions(
  profileId?: string
): Promise<{ success: boolean; error?: string }> {
  return sendMessage("CLEAR_ALL_SESSIONS", { profileId });
}
