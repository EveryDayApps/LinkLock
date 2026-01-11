// ============================================
// Rule Manager Service
// Handles CRUD operations for link rules
// ============================================
import type { LinkRule } from "../models/interfaces";

export class RuleManager {
  // Reserved for future encrypted storage implementation
  // private storageService: StorageService;
  // private masterPasswordHash: string = "";

  constructor() {
    // Storage service initialization reserved for future encrypted storage
  }

  /**
   * Initialize the rule manager with master password
   */
  async initialize(_masterPasswordHash: string): Promise<void> {
    // Master password reserved for future encrypted storage
  }

  /**
   * Get all rules
   */
  getAllRules(): LinkRule[] {
    const data = this.loadStorageData();
    return data?.rules || [];
  }

  /**
   * Get rules by profile ID
   */
  getRulesByProfile(profileId: string): LinkRule[] {
    const allRules = this.getAllRules();
    return allRules.filter((rule) => rule.profileIds.includes(profileId));
  }

  /**
   * Get rule by ID
   */
  getRuleById(ruleId: string): LinkRule | null {
    const allRules = this.getAllRules();
    return allRules.find((rule) => rule.id === ruleId) || null;
  }

  /**
   * Create a new rule
   */
  async createRule(
    ruleData: Omit<LinkRule, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; error?: string; rule?: LinkRule }> {
    try {
      const data = this.loadStorageData();
      if (!data) {
        return { success: false, error: "Failed to load storage data" };
      }

      // Check if URL pattern already exists
      const exists = data.rules.some(
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

      data.rules.push(newRule);
      await this.saveStorageData(data);

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
      const data = this.loadStorageData();
      if (!data) {
        return { success: false, error: "Failed to load storage data" };
      }

      const ruleIndex = data.rules.findIndex((r: LinkRule) => r.id === ruleId);
      if (ruleIndex === -1) {
        return { success: false, error: "Rule not found" };
      }

      data.rules[ruleIndex] = {
        ...data.rules[ruleIndex],
        ...updates,
        updatedAt: Date.now(),
      };

      await this.saveStorageData(data);
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
      const data = this.loadStorageData();
      if (!data) {
        return { success: false, error: "Failed to load storage data" };
      }

      const initialLength = data.rules.length;
      data.rules = data.rules.filter((r: LinkRule) => r.id !== ruleId);

      if (data.rules.length === initialLength) {
        return { success: false, error: "Rule not found" };
      }

      await this.saveStorageData(data);
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
      const data = this.loadStorageData();
      if (!data) {
        return { success: false, error: "Failed to load storage data" };
      }

      const ruleIndex = data.rules.findIndex((r: LinkRule) => r.id === ruleId);
      if (ruleIndex === -1) {
        return { success: false, error: "Rule not found" };
      }

      data.rules[ruleIndex].enabled = !data.rules[ruleIndex].enabled;
      data.rules[ruleIndex].updatedAt = Date.now();

      await this.saveStorageData(data);
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
      const data = this.loadStorageData();
      if (!data) {
        return { success: false, error: "Failed to load storage data" };
      }

      const ruleIndex = data.rules.findIndex((r: LinkRule) => r.id === ruleId);
      if (ruleIndex === -1) {
        return { success: false, error: "Rule not found" };
      }

      if (!data.rules[ruleIndex].profileIds.includes(profileId)) {
        data.rules[ruleIndex].profileIds.push(profileId);
        data.rules[ruleIndex].updatedAt = Date.now();
        await this.saveStorageData(data);
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
      const data = this.loadStorageData();
      if (!data) {
        return { success: false, error: "Failed to load storage data" };
      }

      const ruleIndex = data.rules.findIndex((r: LinkRule) => r.id === ruleId);
      if (ruleIndex === -1) {
        return { success: false, error: "Rule not found" };
      }

      data.rules[ruleIndex].profileIds = data.rules[ruleIndex].profileIds.filter(
        (id: string) => id !== profileId
      );
      data.rules[ruleIndex].updatedAt = Date.now();

      await this.saveStorageData(data);
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

  private loadStorageData() {
    // For now, using localStorage synchronously
    // In production, this would be async with proper encryption
    const stored = localStorage.getItem("linklock_data_v1");
    if (!stored) {
      return { profiles: [], rules: [] };
    }
    try {
      const data = JSON.parse(stored);
      // Ensure rules array exists
      if (!data.rules) {
        data.rules = [];
      }
      if (!data.profiles) {
        data.profiles = [];
      }
      return data;
    } catch {
      return { profiles: [], rules: [] };
    }
  }

  private async saveStorageData(data: any): Promise<void> {
    // For now, using localStorage synchronously
    // In production, this would use encrypted storage
    localStorage.setItem("linklock_data_v1", JSON.stringify(data));
  }

  private generateId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
