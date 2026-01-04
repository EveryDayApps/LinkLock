// ============================================
// Rule Manager
// ============================================

import type { LinkRule, RuleAction } from "../types/domain";
import type { StorageService } from "../services/StorageService";
import { RuleMatcher } from "../services/RuleService";

export class RuleManager {
  private rules: Map<string, LinkRule> = new Map();
  private storageService: StorageService | null = null;
  private masterPasswordHash: string | null = null;

  /**
   * Initialize with storage service
   */
  initialize(storageService: StorageService, masterPasswordHash: string): void {
    this.storageService = storageService;
    this.masterPasswordHash = masterPasswordHash;
  }

  /**
   * Create a new rule
   */
  async createRule(
    urlPattern: string,
    action: RuleAction,
    options: {
      profileId: string;
      lockOptions?: LinkRule["lockOptions"];
      redirectOptions?: LinkRule["redirectOptions"];
    }
  ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
    // Validate URL pattern
    const ruleMatcher = new RuleMatcher();
    const patternValidation = ruleMatcher.validatePattern(urlPattern);

    if (!patternValidation.isValid) {
      return { success: false, error: patternValidation.error };
    }

    // Validate action-specific options
    const validation = this.validateRuleOptions(action, options);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check for duplicate pattern in same profile
    const duplicate = Array.from(this.rules.values()).find(
      (r) => r.profileId === options.profileId && r.urlPattern === urlPattern
    );

    if (duplicate) {
      return {
        success: false,
        error: "A rule for this URL pattern already exists in this profile",
      };
    }

    // Create rule
    const ruleId = crypto.randomUUID();
    const rule: LinkRule = {
      id: ruleId,
      urlPattern,
      action,
      lockOptions: options.lockOptions,
      redirectOptions: options.redirectOptions,
      profileId: options.profileId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    };

    this.rules.set(ruleId, rule);
    await this.saveToStorage();

    return { success: true, ruleId };
  }

  /**
   * Update a rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Omit<LinkRule, "id" | "profileId" | "createdAt">>
  ): Promise<{ success: boolean; error?: string }> {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      return { success: false, error: "Rule not found" };
    }

    // If updating action, validate options
    if (updates.action) {
      const validation = this.validateRuleOptions(updates.action, {
        lockOptions: updates.lockOptions,
        redirectOptions: updates.redirectOptions,
      });

      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
    }

    // Apply updates
    Object.assign(rule, {
      ...updates,
      updatedAt: Date.now(),
    });

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Delete a rule
   */
  async deleteRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    const deleted = this.rules.delete(ruleId);

    if (!deleted) {
      return { success: false, error: "Rule not found" };
    }

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): LinkRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get all rules for a profile
   */
  getRulesByProfile(profileId: string): LinkRule[] {
    return Array.from(this.rules.values()).filter(
      (r) => r.profileId === profileId
    );
  }

  /**
   * Get all rules
   */
  getAllRules(): LinkRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Toggle rule enabled state
   */
  async toggleRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      return { success: false, error: "Rule not found" };
    }

    rule.enabled = !rule.enabled;
    rule.updatedAt = Date.now();

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Copy rules from one profile to another
   */
  async copyRules(
    sourceProfileId: string,
    targetProfileId: string
  ): Promise<{ success: boolean; copiedCount: number }> {
    const sourceRules = this.getRulesByProfile(sourceProfileId);

    let copiedCount = 0;

    for (const sourceRule of sourceRules) {
      const newRule: LinkRule = {
        ...sourceRule,
        id: crypto.randomUUID(),
        profileId: targetProfileId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.rules.set(newRule.id, newRule);
      copiedCount++;
    }

    if (copiedCount > 0) {
      await this.saveToStorage();
    }

    return { success: true, copiedCount };
  }

  /**
   * Delete all rules for a profile
   */
  async deleteProfileRules(profileId: string): Promise<void> {
    const rulesToDelete = Array.from(this.rules.values())
      .filter((r) => r.profileId === profileId)
      .map((r) => r.id);

    rulesToDelete.forEach((id) => this.rules.delete(id));

    if (rulesToDelete.length > 0) {
      await this.saveToStorage();
    }
  }

  /**
   * Validate rule options based on action type
   */
  private validateRuleOptions(
    action: RuleAction,
    options: {
      lockOptions?: LinkRule["lockOptions"];
      redirectOptions?: LinkRule["redirectOptions"];
    }
  ): { isValid: boolean; error?: string } {
    if (action === "lock") {
      if (!options.lockOptions) {
        return {
          isValid: false,
          error: "Lock options are required for lock action",
        };
      }

      // Validate custom password if enabled
      if (
        options.lockOptions.useCustomPassword &&
        !options.lockOptions.customPasswordHash
      ) {
        return {
          isValid: false,
          error:
            "Custom password hash is required when useCustomPassword is true",
        };
      }
    }

    if (action === "redirect") {
      if (!options.redirectOptions || !options.redirectOptions.targetUrl) {
        return {
          isValid: false,
          error: "Target URL is required for redirect action",
        };
      }

      // Validate target URL
      try {
        new URL(options.redirectOptions.targetUrl);
      } catch {
        return { isValid: false, error: "Invalid target URL" };
      }
    }

    return { isValid: true };
  }

  /**
   * Load from storage
   */
  async loadFromStorage(): Promise<void> {
    if (!this.storageService || !this.masterPasswordHash) return;

    const rules = await this.storageService.load<LinkRule[]>(
      "rules",
      this.masterPasswordHash
    );

    if (rules) {
      rules.forEach((rule) => {
        this.rules.set(rule.id, rule);
      });
    }
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.storageService || !this.masterPasswordHash) return;

    const rulesArray = Array.from(this.rules.values());
    await this.storageService.save("rules", rulesArray, this.masterPasswordHash);
  }
}
