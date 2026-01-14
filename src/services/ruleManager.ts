// ============================================
// Rule Manager Service
// Handles CRUD operations for link rules using IndexedDB
// ============================================
import type { LinkRule } from "../models/interfaces";
import { db } from "./db";

export class RuleManager {
  private encryptData: boolean = true; // Flag to control encryption

  constructor() {}

  /**
   * Initialize the rule manager with master password
   * @param masterPasswordHash - The master password hash for encryption
   * @param encryptData - If true, encrypts rules; if false, stores as plain JSON (for debugging)
   */
  async initialize(
    masterPasswordHash: string,
    encryptData: boolean = true
  ): Promise<void> {
    this.encryptData = false;
    db.setMasterPassword(masterPasswordHash);
  }

  /**
   * Set the encryption flag
   * @param encrypt - If true, new rules will be encrypted; if false, stored as plain JSON
   */
  setEncryptionEnabled(encrypt: boolean): void {
    this.encryptData = encrypt;
  }

  /**
   * Get whether encryption is enabled
   */
  isEncryptionEnabled(): boolean {
    return this.encryptData;
  }

  /**
   * Get all rules
   */
  async getAllRules(): Promise<LinkRule[]> {
    const storedRules = await db.rules.toArray();
    const rules: LinkRule[] = [];

    for (const storedRule of storedRules) {
      try {
        const rule = await db.retrieveRule(storedRule);
        rules.push(rule);
      } catch (error) {
        console.error(`Failed to retrieve rule ${storedRule.id}:`, error);
      }
    }

    return rules;
  }

  /**
   * Get rules by profile ID
   */
  async getRulesByProfile(profileId: string): Promise<LinkRule[]> {
    const storedRules = await db.rules
      .where("profileIds")
      .equals(profileId)
      .toArray();

    const rules: LinkRule[] = [];
    for (const storedRule of storedRules) {
      try {
        const rule = await db.retrieveRule(storedRule);
        rules.push(rule);
      } catch (error) {
        console.error(`Failed to retrieve rule ${storedRule.id}:`, error);
      }
    }

    return rules;
  }

  /**
   * Get rule by ID
   */
  async getRuleById(ruleId: string): Promise<LinkRule | null> {
    const storedRule = await db.rules.get(ruleId);
    if (!storedRule) {
      return null;
    }

    try {
      return await db.retrieveRule(storedRule);
    } catch (error) {
      console.error(`Failed to retrieve rule ${ruleId}:`, error);
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
      const exists = allRules.some((r) => r.urlPattern === ruleData.urlPattern);
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

      const storedRule = await db.storeRule(newRule, this.encryptData);
      await db.rules.add(storedRule);

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
      const existingRule = await this.getRuleById(ruleId);
      if (!existingRule) {
        return { success: false, error: "Rule not found" };
      }

      const updatedRule: LinkRule = {
        ...existingRule,
        ...updates,
        updatedAt: Date.now(),
      };

      const storedRule = await db.storeRule(updatedRule, this.encryptData);
      await db.rules.put(storedRule);

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
      const existingRule = await db.rules.get(ruleId);
      if (!existingRule) {
        return { success: false, error: "Rule not found" };
      }

      await db.rules.delete(ruleId);
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
      const existingRule = await this.getRuleById(ruleId);
      if (!existingRule) {
        return { success: false, error: "Rule not found" };
      }

      const updatedRule: LinkRule = {
        ...existingRule,
        enabled: !existingRule.enabled,
        updatedAt: Date.now(),
      };

      const storedRule = await db.storeRule(updatedRule, this.encryptData);
      await db.rules.put(storedRule);

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
      const existingRule = await this.getRuleById(ruleId);
      if (!existingRule) {
        return { success: false, error: "Rule not found" };
      }

      if (!existingRule.profileIds.includes(profileId)) {
        const updatedRule: LinkRule = {
          ...existingRule,
          profileIds: [...existingRule.profileIds, profileId],
          updatedAt: Date.now(),
        };

        const storedRule = await db.storeRule(updatedRule, this.encryptData);
        await db.rules.put(storedRule);
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
      const existingRule = await this.getRuleById(ruleId);
      if (!existingRule) {
        return { success: false, error: "Rule not found" };
      }

      const updatedRule: LinkRule = {
        ...existingRule,
        profileIds: existingRule.profileIds.filter((id) => id !== profileId),
        updatedAt: Date.now(),
      };

      const storedRule = await db.storeRule(updatedRule, this.encryptData);
      await db.rules.put(storedRule);

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
