// ============================================
// Background Manager - Manages background script operations
// Stores and manages all core data: rules, profiles, selected profile, master password
// Uses BackgroundListener for handling database change events
// ============================================

import type { LinkRule, Profile } from "@/models/interfaces";
import type { MasterPasswordData, StoredRule } from "@/models/types";
import { db } from "@/services/database";
import { backgroundLogger } from "@/utils/logger";
import {
  backgroundListener,
  type MasterPasswordChangePayload,
  type ProfileChangePayload,
  type RuleChangePayload,
} from "./BackgroundListener";

// ============================================
// State Interface
// ============================================

/**
 * Represents the current state of the BackgroundManager
 */
export interface BackgroundState {
  rules: LinkRule[];
  profiles: Profile[];
  selectedProfile: Profile | null;
  masterPassword: MasterPasswordData | null;
  isLoaded: boolean;
}

/**
 * BackgroundManager handles all background script operations.
 * It maintains in-memory state for rules, profiles, selected profile, and master password.
 * State is loaded from IndexedDB on initialization and kept in sync via change handlers.
 */
export class BackgroundManager {
  private isInitialized = false;

  // ============================================
  // State Storage
  // ============================================

  private _rules: LinkRule[] = [];
  private _profiles: Profile[] = [];
  private _selectedProfile: Profile | null = null;
  private _masterPassword: MasterPasswordData | null = null;
  private _isLoaded = false;

  // ============================================
  // External Callbacks
  // ============================================

  private _onMasterPasswordCreate:
    | ((masterPassword: MasterPasswordData) => void)
    | null = null;

  /**
   * Set a callback to be invoked when a master password is created
   * @param callback The callback function or null to clear
   */
  set onMasterPasswordCreate(
    callback: (masterPassword: MasterPasswordData) => void,
  ) {
    this._onMasterPasswordCreate = callback;
  }

  // ============================================
  // Getters for State Access
  // ============================================

  /**
   * Get all rules
   */
  get rules(): LinkRule[] {
    return [...this._rules]; // Return a copy to prevent external mutation
  }

  /**
   * Get all profiles
   */
  get profiles(): Profile[] {
    return [...this._profiles]; // Return a copy to prevent external mutation
  }

  /**
   * Get the currently selected profile
   */
  get selectedProfile(): Profile | null {
    return this._selectedProfile ? { ...this._selectedProfile } : null;
  }

  /**
   * Get the master password data
   */
  get masterPassword(): MasterPasswordData | null {
    return this._masterPassword ? { ...this._masterPassword } : null;
  }

  /**
   * Check if initial data has been loaded
   */
  get isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * Get the complete current state
   */
  getState(): BackgroundState {
    return {
      rules: this.rules,
      profiles: this.profiles,
      selectedProfile: this.selectedProfile,
      masterPassword: this.masterPassword,
      isLoaded: this._isLoaded,
    };
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the background manager
   * Sets up all listeners, handlers, and loads initial data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      backgroundLogger.warn("BackgroundManager already initialized");
      return;
    }

    // Initialize the background listener
    backgroundListener.initialize();

    // Set up all handlers
    this.setupProfileHandlers();
    this.setupRuleHandlers();
    this.setupMasterPasswordHandlers();
    this.setupGeneralHandler();

    // Load initial data from database
    await this.loadInitialData();

    this.isInitialized = true;
    backgroundLogger.info("BackgroundManager initialized successfully");
    backgroundLogger.info(
      `Loaded: ${this._profiles.length} profiles, ${this._rules.length} rules`,
    );
  }

  /**
   * Load initial data from the database
   */
  private async loadInitialData(): Promise<void> {
    try {
      // Ensure database is initialized
      await db.initialize();

      // Load master password first (needed for decryption)
      await this.loadMasterPassword();

      // Load profiles
      await this.loadProfiles();

      // Load rules
      await this.loadRules();

      // Set selected profile (first active profile or first profile)
      this.selectInitialProfile();

      this._isLoaded = true;
      backgroundLogger.info("Initial data loaded successfully");
    } catch (error) {
      backgroundLogger.error("Failed to load initial data:", error);
      this._isLoaded = false;
    }
  }

  /**
   * Load master password from database
   */
  private async loadMasterPassword(): Promise<void> {
    try {
      const masterPasswordData = await db.getMasterPasswordData();
      this._masterPassword = masterPasswordData ?? null;

      if (this._masterPassword) {
        backgroundLogger.debug("Master password loaded");
      }
    } catch (error) {
      backgroundLogger.error("Failed to load master password:", error);
      this._masterPassword = null;
    }
  }

  /**
   * Load all profiles from database and decrypt them
   */
  private async loadProfiles(): Promise<void> {
    try {
      const encryptedProfiles = await db.profiles.toArray();
      const decryptedProfiles: Profile[] = [];

      for (const encryptedProfile of encryptedProfiles) {
        try {
          const profile = await db.decryptProfile(encryptedProfile);
          decryptedProfiles.push(profile);
        } catch (error) {
          backgroundLogger.error(
            `Failed to decrypt profile ${encryptedProfile.id}:`,
            error,
          );
        }
      }

      this._profiles = decryptedProfiles;
      backgroundLogger.debug(`Loaded ${this._profiles.length} profiles`);
    } catch (error) {
      backgroundLogger.error("Failed to load profiles:", error);
      this._profiles = [];
    }
  }

  /**
   * Load all rules from database and decrypt them
   */
  private async loadRules(): Promise<void> {
    try {
      const storedRules = await db.rules.toArray();
      const decryptedRules: LinkRule[] = [];

      for (const storedRule of storedRules) {
        try {
          const rule = await db.retrieveRule(storedRule);
          decryptedRules.push(rule);
        } catch (error) {
          backgroundLogger.error(
            `Failed to decrypt rule ${storedRule.id}:`,
            error,
          );
        }
      }

      this._rules = decryptedRules;
      backgroundLogger.debug(`Loaded ${this._rules.length} rules`);
    } catch (error) {
      backgroundLogger.error("Failed to load rules:", error);
      this._rules = [];
    }
  }

  /**
   * Select the initial profile (first active or first available)
   */
  private selectInitialProfile(): void {
    if (this._profiles.length === 0) {
      this._selectedProfile = null;
      return;
    }

    // Try to find an active profile
    const activeProfile = this._profiles.find((p) => p.isActive);

    if (activeProfile) {
      this._selectedProfile = activeProfile;
    } else {
      // Fall back to first profile
      this._selectedProfile = this._profiles[0];
    }

    if (this._selectedProfile) {
      backgroundLogger.debug(
        `Selected profile: ${this._selectedProfile.name} (${this._selectedProfile.id})`,
      );
    }
  }

  // ============================================
  // Profile Methods
  // ============================================

  /**
   * Set the selected profile by ID
   */
  setSelectedProfile(profileId: string): boolean {
    const profile = this._profiles.find((p) => p.id === profileId);

    if (profile) {
      this._selectedProfile = profile;
      backgroundLogger.info(`Selected profile changed to: ${profile.name}`);
      return true;
    }

    backgroundLogger.warn(`Profile not found: ${profileId}`);
    return false;
  }

  /**
   * Get rules for the currently selected profile
   */
  getRulesForSelectedProfile(): LinkRule[] {
    if (!this._selectedProfile) {
      return [];
    }

    return this._rules.filter((rule) =>
      rule.profileIds.includes(this._selectedProfile!.id),
    );
  }

  /**
   * Get rules for a specific profile
   */
  getRulesForProfile(profileId: string): LinkRule[] {
    return this._rules.filter((rule) => rule.profileIds.includes(profileId));
  }

  // ============================================
  // Handler Setup Methods
  // ============================================

  /**
   * Set up handlers for profile changes
   */
  private setupProfileHandlers(): void {
    backgroundListener.onProfileChange({
      onCreate: (payload) => this.handleProfileCreate(payload),
      onUpdate: (payload) => this.handleProfileUpdate(payload),
      onDelete: (payload) => this.handleProfileDelete(payload),
    });
  }

  /**
   * Set up handlers for rule changes
   */
  private setupRuleHandlers(): void {
    backgroundListener.onRuleChange({
      onCreate: (payload) => this.handleRuleCreate(payload),
      onUpdate: (payload) => this.handleRuleUpdate(payload),
      onDelete: (payload) => this.handleRuleDelete(payload),
    });
  }

  /**
   * Set up handlers for master password changes
   */
  private setupMasterPasswordHandlers(): void {
    backgroundListener.onMasterPasswordChange({
      onCreate: (payload) => this.handleMasterPasswordCreate(payload),
      onUpdate: (payload) => this.handleMasterPasswordUpdate(payload),
      onDelete: (payload) => this.handleMasterPasswordDelete(payload),
    });
  }

  /**
   * Set up a general handler for logging all changes
   */
  private setupGeneralHandler(): void {
    backgroundListener.onAnyChange((payload) => {
      backgroundLogger.debug(
        `DB Change: Table=${payload.table}, Type=${payload.type}, Key=${payload.key}`,
      );
    });
  }

  // ============================================
  // Profile Change Handlers
  // ============================================

  /**
   * Handle profile creation - adds new profile to state
   */
  private async handleProfileCreate(
    payload: ProfileChangePayload,
  ): Promise<void> {
    backgroundLogger.info(`Profile created: ${payload.key}`);

    if (payload.newValue) {
      try {
        const profile = await db.decryptProfile(payload.newValue);
        this._profiles.push(profile);

        // If no profile is selected, select this one
        if (!this._selectedProfile) {
          this._selectedProfile = profile;
        }

        backgroundLogger.debug(`Added profile to state: ${profile.name}`);
      } catch (error) {
        backgroundLogger.error("Failed to decrypt new profile:", error);
      }
    }
  }

  /**
   * Handle profile update - updates profile in state
   */
  private async handleProfileUpdate(
    payload: ProfileChangePayload,
  ): Promise<void> {
    backgroundLogger.info(`Profile updated: ${payload.key}`);

    if (payload.newValue && payload.key) {
      try {
        const updatedProfile = await db.decryptProfile(payload.newValue);
        const index = this._profiles.findIndex((p) => p.id === payload.key);

        if (index !== -1) {
          this._profiles[index] = updatedProfile;

          // Update selected profile if the updated profile is now active
          if (updatedProfile.isActive) {
            this._selectedProfile = updatedProfile;
          }

          backgroundLogger.debug(
            `Updated profile in state: ${updatedProfile.name}`,
          );
        }
      } catch (error) {
        backgroundLogger.error("Failed to decrypt updated profile:", error);
      }
    }
  }

  /**
   * Handle profile deletion - removes profile from state
   */
  private handleProfileDelete(payload: ProfileChangePayload): void {
    backgroundLogger.info(`Profile deleted: ${payload.key}`);

    if (payload.key) {
      const index = this._profiles.findIndex((p) => p.id === payload.key);

      if (index !== -1) {
        this._profiles.splice(index, 1);

        // If the deleted profile was selected, select another
        if (this._selectedProfile?.id === payload.key) {
          this.selectInitialProfile();
        }

        backgroundLogger.debug(`Removed profile from state: ${payload.key}`);
      }
    }
  }

  // ============================================
  // Rule Change Handlers
  // ============================================

  /**
   * Handle rule creation - adds new rule to state
   */
  private async handleRuleCreate(payload: RuleChangePayload): Promise<void> {
    backgroundLogger.info(`Rule created: ${payload.key}`);

    if (payload.newValue) {
      try {
        const rule = await db.retrieveRule(payload.newValue as StoredRule);
        this._rules.push(rule);
        backgroundLogger.debug(`Added rule to state: ${rule.id}`);
      } catch (error) {
        backgroundLogger.error("Failed to decrypt new rule:", error);
      }
    }
  }

  /**
   * Handle rule update - updates rule in state
   */
  private async handleRuleUpdate(payload: RuleChangePayload): Promise<void> {
    backgroundLogger.info(`Rule updated: ${payload.key}`);

    if (payload.newValue && payload.key) {
      try {
        const updatedRule = await db.retrieveRule(
          payload.newValue as StoredRule,
        );
        const index = this._rules.findIndex((r) => r.id === payload.key);

        if (index !== -1) {
          this._rules[index] = updatedRule;
          backgroundLogger.debug(`Updated rule in state: ${updatedRule.id}`);
        }
      } catch (error) {
        backgroundLogger.error("Failed to decrypt updated rule:", error);
      }
    }
  }

  /**
   * Handle rule deletion - removes rule from state
   */
  private handleRuleDelete(payload: RuleChangePayload): void {
    backgroundLogger.info(`Rule deleted: ${payload.key}`);

    if (payload.key) {
      const index = this._rules.findIndex((r) => r.id === payload.key);

      if (index !== -1) {
        this._rules.splice(index, 1);
        backgroundLogger.debug(`Removed rule from state: ${payload.key}`);
      }
    }
  }

  // ============================================
  // Master Password Change Handlers
  // ============================================

  /**
   * Handle master password creation - sets master password in state
   */
  private handleMasterPasswordCreate(
    payload: MasterPasswordChangePayload,
  ): void {
    backgroundLogger.info(`Master password created: ${payload.key}`);

    if (payload.newValue) {
      this._masterPassword = payload.newValue;
      backgroundLogger.debug("Master password set in state");

      // Invoke external callback if registered
      if (this._onMasterPasswordCreate) {
        try {
          this._onMasterPasswordCreate(payload.newValue);
        } catch (error) {
          backgroundLogger.error("Error in onMasterPasswordCreate:", error);
        }
      }
    }
  }

  /**
   * Handle master password update - updates master password in state
   */
  private handleMasterPasswordUpdate(
    payload: MasterPasswordChangePayload,
  ): void {
    backgroundLogger.info(`Master password updated: ${payload.key}`);

    if (payload.newValue) {
      this._masterPassword = payload.newValue;
      backgroundLogger.debug("Master password updated in state");
    }
  }

  /**
   * Handle master password deletion - clears master password from state
   */
  private handleMasterPasswordDelete(
    payload: MasterPasswordChangePayload,
  ): void {
    backgroundLogger.info(`Master password deleted: ${payload.key}`);
    this._masterPassword = null;
    backgroundLogger.debug("Master password cleared from state");
  }

  // ============================================
  // Refresh Methods
  // ============================================

  /**
   * Force refresh all data from database
   * Useful after bulk operations or when data might be out of sync
   */
  async refreshAll(): Promise<void> {
    backgroundLogger.info("Refreshing all data from database...");
    await this.loadInitialData();
  }

  /**
   * Refresh only profiles from database
   */
  async refreshProfiles(): Promise<void> {
    backgroundLogger.info("Refreshing profiles...");
    await this.loadProfiles();
    this.selectInitialProfile();
  }

  /**
   * Refresh only rules from database
   */
  async refreshRules(): Promise<void> {
    backgroundLogger.info("Refreshing rules...");
    await this.loadRules();
  }

  // ============================================
  // Status Methods
  // ============================================

  /**
   * Check if the manager is initialized
   */
  get isRunning(): boolean {
    return this.isInitialized;
  }

  /**
   * Get a summary of the current state
   */
  getStatus(): {
    isRunning: boolean;
    isLoaded: boolean;
    profileCount: number;
    ruleCount: number;
    selectedProfileId: string | null;
    hasMasterPassword: boolean;
    registeredHandlers: Record<string, string[]>;
  } {
    return {
      isRunning: this.isInitialized,
      isLoaded: this._isLoaded,
      profileCount: this._profiles.length,
      ruleCount: this._rules.length,
      selectedProfileId: this._selectedProfile?.id ?? null,
      hasMasterPassword: this._masterPassword !== null,
      registeredHandlers: backgroundListener.getHandlerSummary(),
    };
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    this._rules = [];
    this._profiles = [];
    this._selectedProfile = null;
    this._masterPassword = null;
    this._isLoaded = false;
    this.isInitialized = false;
    backgroundLogger.info("BackgroundManager destroyed");
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * Default background manager instance
 * Use this for the main background script
 */
export const backgroundManager = new BackgroundManager();
