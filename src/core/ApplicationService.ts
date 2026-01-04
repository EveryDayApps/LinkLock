// ============================================
// Application Service (Main Orchestrator)
// ============================================

import { PasswordService } from "./services/PasswordService";
import { EncryptionService } from "./services/EncryptionService";
import { StorageService } from "./services/StorageService";
import { RuleMatcher, RuleEvaluator } from "./services/RuleService";
import { UnlockSessionManager } from "./managers/UnlockSessionManager";
import { CooldownManager } from "./managers/CooldownManager";
import { ProfileManager } from "./managers/ProfileManager";
import { RuleManager } from "./managers/RuleManager";
import { ActivityLogger } from "./managers/ActivityLogger";
import type { SecurityConfig } from "./types/domain";

export class ApplicationService {
  // Services
  public passwordService: PasswordService;
  public encryptionService: EncryptionService;
  public storageService: StorageService;
  public ruleMatcher: RuleMatcher;
  public ruleEvaluator: RuleEvaluator;

  // Managers
  public sessionManager: UnlockSessionManager;
  public cooldownManager: CooldownManager;
  public profileManager: ProfileManager;
  public ruleManager: RuleManager;
  public activityLogger: ActivityLogger;

  // State
  private masterPasswordHash: string | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize services
    this.passwordService = new PasswordService();
    this.encryptionService = new EncryptionService();
    this.storageService = new StorageService(this.encryptionService);
    this.ruleMatcher = new RuleMatcher();

    // Initialize managers
    this.sessionManager = new UnlockSessionManager();

    // Default security config
    const defaultSecurityConfig: SecurityConfig = {
      masterPasswordHash: "",
      failedAttemptLimit: 5,
      cooldownDuration: 5,
      requireMasterAfterCooldown: true,
    };

    this.cooldownManager = new CooldownManager(defaultSecurityConfig);
    this.profileManager = new ProfileManager();
    this.ruleManager = new RuleManager();
    this.activityLogger = new ActivityLogger(true); // Logging enabled by default

    // Initialize rule evaluator
    this.ruleEvaluator = new RuleEvaluator(
      this.ruleMatcher,
      this.sessionManager
    );
  }

  /**
   * Initialize application with master password
   * This should be called after user creates or enters master password
   */
  async initialize(masterPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Hash master password
      this.masterPasswordHash = await this.passwordService.hashPassword(masterPassword);

      // Initialize all managers with storage
      this.sessionManager.initialize(this.storageService, this.masterPasswordHash);
      this.cooldownManager.initialize(this.storageService, this.masterPasswordHash);
      this.profileManager.initialize(this.storageService, this.masterPasswordHash);
      this.ruleManager.initialize(this.storageService, this.masterPasswordHash);
      this.activityLogger.initialize(this.storageService, this.masterPasswordHash);

      // Load data from storage
      await this.loadFromStorage();

      this.isInitialized = true;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to initialize application",
      };
    }
  }

  /**
   * Check if application is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get master password hash
   */
  getMasterPasswordHash(): string | null {
    return this.masterPasswordHash;
  }

  /**
   * Verify master password
   */
  async verifyMasterPassword(password: string): Promise<boolean> {
    if (!this.masterPasswordHash) return false;
    return this.passwordService.verifyPassword(password, this.masterPasswordHash);
  }

  /**
   * Load all data from storage
   */
  private async loadFromStorage(): Promise<void> {
    await Promise.all([
      this.sessionManager.loadFromStorage(),
      this.cooldownManager.loadFromStorage(),
      this.profileManager.loadFromStorage(),
      this.ruleManager.loadFromStorage(),
      this.activityLogger.loadFromStorage(),
    ]);
  }

  /**
   * Handle unlock attempt
   */
  async handleUnlockAttempt(
    domain: string,
    password: string,
    ruleId: string
  ): Promise<{
    success: boolean;
    error?: string;
    inCooldown?: boolean;
    remainingCooldown?: number;
  }> {
    // Check if in cooldown
    if (this.cooldownManager.isInCooldown(domain)) {
      return {
        success: false,
        inCooldown: true,
        remainingCooldown: this.cooldownManager.getRemainingCooldown(domain),
      };
    }

    const rule = this.ruleManager.getRule(ruleId);
    if (!rule) {
      return { success: false, error: "Rule not found" };
    }

    // Determine which password to verify against
    const useCustomPassword = rule.lockOptions?.useCustomPassword;
    const passwordHash = useCustomPassword
      ? rule.lockOptions?.customPasswordHash!
      : this.masterPasswordHash!;

    // Verify password
    const isValid = await this.passwordService.verifyPassword(password, passwordHash);

    if (!isValid) {
      // Record failed attempt
      const triggeredCooldown = await this.cooldownManager.recordFailedAttempt(domain);

      // Log failed attempt
      const profileId = this.profileManager.getActiveProfileId();
      if (profileId) {
        await this.activityLogger.logUnlockFailed(
          domain,
          profileId,
          this.cooldownManager.getFailedAttempts(domain)
        );
      }

      return {
        success: false,
        error: "Incorrect password",
        inCooldown: triggeredCooldown,
        remainingCooldown: triggeredCooldown
          ? this.cooldownManager.getRemainingCooldown(domain)
          : undefined,
      };
    }

    // Password is correct - unlock the domain
    await this.cooldownManager.resetAttempts(domain);

    const duration = rule.lockOptions?.unlockDuration || 5;
    const profileId = rule.profileId;

    await this.sessionManager.unlock(domain, duration, profileId);

    // Log successful unlock
    await this.activityLogger.logUnlockSuccess(domain, profileId);

    return { success: true };
  }

  /**
   * Handle snooze
   */
  async handleSnooze(
    domain: string,
    duration: 5 | 30 | "today"
  ): Promise<{ success: boolean; error?: string }> {
    const profileId = this.profileManager.getActiveProfileId();
    if (!profileId) {
      return { success: false, error: "No active profile" };
    }

    await this.sessionManager.snooze(domain, duration, profileId);
    return { success: true };
  }

  /**
   * Evaluate URL against rules
   */
  async evaluateUrl(url: string) {
    const activeProfile = this.profileManager.getActiveProfile();
    if (!activeProfile) {
      return { action: "allow" as const };
    }

    const rules = this.ruleManager.getRulesByProfile(activeProfile.id);
    return this.ruleEvaluator.evaluate(url, rules, activeProfile.id);
  }

  /**
   * Clear all application data
   */
  async clearAllData(): Promise<void> {
    await this.storageService.clear();
    this.isInitialized = false;
    this.masterPasswordHash = null;
  }
}

// Export singleton instance
export const appService = new ApplicationService();
