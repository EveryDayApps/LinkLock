// ============================================
// Rule Manager Service
// Handles CRUD operations for link rules using encrypted IndexedDB
// ============================================
import type { LinkRule } from "../models/interfaces";
import { db } from "./db";

export class RuleManager {
  constructor() {}

  /**
   * Initialize the rule manager with master password
   */
  async initialize(masterPasswordHash: string): Promise<void> {
    db.setMasterPassword(masterPasswordHash);
  }

  /**
   * Get all rules
   */
  async getAllRules(): Promise<LinkRule[]> {
    try {
      return await db.getAllRules();
    } catch (error) {
      console.error("Failed to get all rules:", error);
      return [];
    }
  }

  /**
   * Get rules by profile ID
   */
  async getRulesByProfile(profileId: string): Promise<LinkRule[]> {
    try {
      return await db.getRulesByProfileId(profileId);
    } catch (error) {
      console.error("Failed to get rules by profile:", error);
      return [];
    }
  }

  /**
   * Get rule by ID
   */
  async getRuleById(ruleId: string): Promise<LinkRule | null> {
    try {
      return await db.getRuleById(ruleId);
    } catch (error) {
      console.error("Failed to get rule by ID:", error);
      return null;
    }
  }

  /**
   * Create a new rule
   */
  async createRule(
    ruleData: Omit<LinkRule, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; error?: string; rule?: LinkRule }> {
    try {
      // Check if URL pattern already exists
      const allRules = await this.getAllRules();
      const exists = allRules.some(
        (r: LinkRule) => r.urlPattern === ruleData.urlPattern
      );
      if (exists) {
        return {
          success: false,
          error: "A rule with this URL pattern already exists",
        };
      }

      const newRule: LinkRule = {
        ...ruleData,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const encrypted = await db.encryptRule(newRule);
      await db.t2.add(encrypted);

      return { success: true, rule: newRule };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update an existing rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<
      Omit<LinkRule, "id" | "createdAt" | "updatedAt" | "profileIds">
    >
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const rule = await db.getRuleById(ruleId);
      if (!rule) {
        return { success: false, error: "Rule not found" };
      }

      const updatedRule = {
        ...rule,
        ...updates,
        updatedAt: Date.now(),
      };

      const encrypted = await db.encryptRule(updatedRule);
      await db.t2.put(encrypted);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete a rule
   */
  async deleteRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const rule = await db.getRuleById(ruleId);
      if (!rule) {
        return { success: false, error: "Rule not found" };
      }

      await db.deleteRule(ruleId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Toggle rule enabled status
   */
  async toggleRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const rule = await db.getRuleById(ruleId);
      if (!rule) {
        return { success: false, error: "Rule not found" };
      }

      rule.enabled = !rule.enabled;
      rule.updatedAt = Date.now();

      const encrypted = await db.encryptRule(rule);
      await db.t2.put(encrypted);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Add profile to rule
   */
  async addProfileToRule(
    ruleId: string,
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const rule = await db.getRuleById(ruleId);
      if (!rule) {
        return { success: false, error: "Rule not found" };
      }

      if (!rule.profileIds.includes(profileId)) {
        rule.profileIds.push(profileId);
        rule.updatedAt = Date.now();

        const encrypted = await db.encryptRule(rule);
        await db.t2.put(encrypted);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Remove profile from rule
   */
  async removeProfileFromRule(
    ruleId: string,
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const rule = await db.getRuleById(ruleId);
      if (!rule) {
        return { success: false, error: "Rule not found" };
      }

      rule.profileIds = rule.profileIds.filter(
        (id: string) => id !== profileId
      );
      rule.updatedAt = Date.now();

      const encrypted = await db.encryptRule(rule);
      await db.t2.put(encrypted);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private generateId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
