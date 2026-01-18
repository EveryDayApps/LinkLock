// ============================================
// Background State Store - Centralized state management
// Stores and provides access to: rules, profiles, selected profile, master password
// Includes BackgroundListener for handling database change events
// ============================================

import type { LinkRule, Profile } from "@/models/interfaces";
import type { MasterPasswordData, StoredRule } from "@/models/types";
import { db } from "@/services/database";
import { backgroundLogger } from "@/utils/logger";
import {
  BackgroundListener,
  type MasterPasswordChangePayload,
  type ProfileChangePayload,
  type RuleChangePayload,
} from "./BackgroundListener";

// ============================================
// State Interface
// ============================================

/**
 * Represents the complete state snapshot
 */
export interface BackgroundState {
  rules: LinkRule[];
  profiles: Profile[];
  selectedProfile: Profile | null;
  masterPassword: MasterPasswordData | null;
  isLoaded: boolean;
}

/**
 * Listener callback type for state changes
 */
export type StateChangeListener<K extends keyof BackgroundState> = (
  newValue: BackgroundState[K],
  oldValue: BackgroundState[K],
) => void;

// ============================================
// Background State Store Class
// ============================================

/**
 * BackgroundStateStore manages the in-memory state for the background script.
 * It provides a single source of truth for rules, profiles, selected profile,
 * and master password data.
 *
 * Features:
 * - Immutable getters (returns copies to prevent external mutation)
 * - State change listeners for reactive updates
 * - Integrated BackgroundListener for database change events
 * - Handler methods for CRUD operations
 */
export class BackgroundStateStore {
  // ============================================
  // Private State
  // ============================================

  private _rules: LinkRule[] = [];
  private _profiles: Profile[] = [];
  private _selectedProfile: Profile | null = null;
  private _masterPassword: MasterPasswordData | null = null;
  private _isLoaded = false;

  // Background Listener instance
  private readonly listener = new BackgroundListener();

  // Change listeners
  private listeners: Map<
    keyof BackgroundState,
    Set<StateChangeListener<keyof BackgroundState>>
  > = new Map();

  // ============================================
  // Getters (Immutable Access)
  // ============================================

  /**
   * Get all rules (returns a copy to prevent mutation)
   */
  get rules(): LinkRule[] {
    return [...this._rules];
  }

  /**
   * Get all profiles (returns a copy to prevent mutation)
   */
  get profiles(): Profile[] {
    return [...this._profiles];
  }

  /**
   * Get the currently selected profile (returns a copy to prevent mutation)
   */
  get selectedProfile(): Profile | null {
    return this._selectedProfile ? { ...this._selectedProfile } : null;
  }

  /**
   * Get the master password data (returns a copy to prevent mutation)
   */
  get masterPassword(): MasterPasswordData | null {
    return this._masterPassword ? { ...this._masterPassword } : null;
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the store, set up all handlers, and load initial data
   */
  async initialize(): Promise<void> {
    // Initialize the background listener
    this.listener.initialize();

    // Set up all handlers
    this.setupProfileHandlers();
    this.setupRuleHandlers();
    this.setupMasterPasswordHandlers();
    this.setupGeneralHandler();

    // Load initial data from database
    await this.loadInitialData();

    backgroundLogger.info("BackgroundStateStore initialized");
    backgroundLogger.info(
      `Loaded: ${this._profiles.length} profiles, ${this._rules.length} rules`,
    );
  }

  // ============================================
  // Data Loading Methods
  // ============================================

  /**
   * Load initial data from the database
   */
  async loadInitialData(): Promise<void> {
    try {
      // Ensure database is initialized
      await db.initialize();

      if (db.getMasterPasswordData() === null) return;

      // Load master password first (needed for decryption)
      await this.loadMasterPassword();

      // Load profiles
      await this.loadProfiles();

      // Load rules
      await this.loadRules();

      // Set selected profile (first active profile or first profile)
      this.selectInitialProfile();

      this.setLoaded(true);
      backgroundLogger.info("Initial data loaded successfully");
    } catch (error) {
      backgroundLogger.error("Failed to load initial data:", error);
      this.setLoaded(false);
    }
  }

  /**
   * Load master password from database
   */
  async loadMasterPassword(): Promise<void> {
    try {
      const masterPasswordData = await db.getMasterPasswordData();
      this.setMasterPassword(masterPasswordData ?? null);

      if (this._masterPassword) {
        backgroundLogger.debug("Master password loaded");
      }
    } catch (error) {
      backgroundLogger.error("Failed to load master password:", error);
      this.setMasterPassword(null);
    }
  }

  /**
   * Load all profiles from database and decrypt them
   */
  async loadProfiles(): Promise<void> {
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

      this.setProfiles(decryptedProfiles);
      backgroundLogger.debug(`Loaded ${this._profiles.length} profiles`);
    } catch (error) {
      backgroundLogger.error("Failed to load profiles:", error);
      this.setProfiles([]);
    }
  }

  /**
   * Load all rules from database and decrypt them
   */
  async loadRules(): Promise<void> {
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

      this.setRules(decryptedRules);
      backgroundLogger.debug(`Loaded ${this._rules.length} rules`);
    } catch (error) {
      backgroundLogger.error("Failed to load rules:", error);
      this.setRules([]);
    }
  }

  // ============================================
  // Handler Setup Methods
  // ============================================

  /**
   * Set up handlers for profile changes
   */
  private setupProfileHandlers(): void {
    this.listener.onProfileChange({
      onCreate: (payload) => this.handleProfileCreate(payload),
      onUpdate: (payload) => this.handleProfileUpdate(payload),
      onDelete: (payload) => this.handleProfileDelete(payload),
    });
  }

  /**
   * Set up handlers for rule changes
   */
  private setupRuleHandlers(): void {
    this.listener.onRuleChange({
      onCreate: (payload) => this.handleRuleCreate(payload),
      onUpdate: (payload) => this.handleRuleUpdate(payload),
      onDelete: (payload) => this.handleRuleDelete(payload),
    });
  }

  /**
   * Set up handlers for master password changes
   */
  private setupMasterPasswordHandlers(): void {
    this.listener.onMasterPasswordChange({
      onCreate: (payload) => this.handleMasterPasswordCreate(payload),
      onUpdate: (payload) => this.handleMasterPasswordUpdate(payload),
      onDelete: (payload) => this.handleMasterPasswordDelete(payload),
    });
  }

  /**
   * Set up a general handler for logging all changes
   */
  private setupGeneralHandler(): void {
    this.listener.onAnyChange((payload) => {
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
        this.addProfile(profile);

        // If no profile is selected, select this one
        if (!this._selectedProfile) {
          this.setSelectedProfile(profile);
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
        this.updateProfile(payload.key, updatedProfile);

        // Update selected profile if the updated profile is now active
        if (updatedProfile.isActive) {
          this.setSelectedProfile(updatedProfile);
        }

        backgroundLogger.debug(
          `Updated profile in state: ${updatedProfile.name}`,
        );
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
      const removed = this.removeProfile(payload.key);

      if (removed) {
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
        this.addRule(rule);
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
        this.updateRule(payload.key, updatedRule);
        backgroundLogger.debug(`Updated rule in state: ${updatedRule.id}`);
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
      const removed = this.removeRule(payload.key);

      if (removed) {
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
      this.setMasterPassword(payload.newValue);
      backgroundLogger.debug("Master password set in state");

      // Reload data now that we have a master password
      this.loadInitialData();
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
      this.setMasterPassword(payload.newValue);
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
    this.setMasterPassword(null);
    backgroundLogger.debug("Master password cleared from state");
  }

  // ============================================
  // Setters (State Mutations)
  // ============================================

  /**
   * Set all rules
   */
  setRules(rules: LinkRule[]): void {
    const oldValue = this._rules;
    this._rules = [...rules];
    this.notifyListeners("rules", this._rules, oldValue);
  }

  /**
   * Set all profiles
   */
  setProfiles(profiles: Profile[]): void {
    const oldValue = this._profiles;
    this._profiles = [...profiles];
    this.notifyListeners("profiles", this._profiles, oldValue);
  }

  /**
   * Set the selected profile
   */
  setSelectedProfile(profile: Profile | null): void {
    const oldValue = this._selectedProfile;
    this._selectedProfile = profile ? { ...profile } : null;
    this.notifyListeners("selectedProfile", this._selectedProfile, oldValue);
  }

  /**
   * Set the master password data
   */
  setMasterPassword(masterPassword: MasterPasswordData | null): void {
    const oldValue = this._masterPassword;
    this._masterPassword = masterPassword ? { ...masterPassword } : null;
    this.notifyListeners("masterPassword", this._masterPassword, oldValue);
  }

  /**
   * Set the loaded state
   */
  setLoaded(isLoaded: boolean): void {
    const oldValue = this._isLoaded;
    this._isLoaded = isLoaded;
    this.notifyListeners("isLoaded", this._isLoaded, oldValue);
  }

  // ============================================
  // Rules Operations
  // ============================================

  /**
   * Add a single rule
   */
  addRule(rule: LinkRule): void {
    const oldValue = this._rules;
    this._rules = [...this._rules, rule];
    this.notifyListeners("rules", this._rules, oldValue);
  }

  /**
   * Update a rule by ID
   * Returns true if the rule was found and updated
   */
  updateRule(ruleId: string, updatedRule: LinkRule): boolean {
    const index = this._rules.findIndex((r) => r.id === ruleId);
    if (index === -1) return false;

    const oldValue = this._rules;
    this._rules = [
      ...this._rules.slice(0, index),
      updatedRule,
      ...this._rules.slice(index + 1),
    ];
    this.notifyListeners("rules", this._rules, oldValue);
    return true;
  }

  /**
   * Remove a rule by ID
   * Returns true if the rule was found and removed
   */
  removeRule(ruleId: string): boolean {
    const index = this._rules.findIndex((r) => r.id === ruleId);
    if (index === -1) return false;

    const oldValue = this._rules;
    this._rules = [
      ...this._rules.slice(0, index),
      ...this._rules.slice(index + 1),
    ];
    this.notifyListeners("rules", this._rules, oldValue);
    return true;
  }

  /**
   * Find a rule by ID
   */
  findRule(ruleId: string): LinkRule | undefined {
    return this._rules.find((r) => r.id === ruleId);
  }

  // ============================================
  // Profile Operations
  // ============================================

  /**
   * Add a single profile
   */
  addProfile(profile: Profile): void {
    const oldValue = this._profiles;
    this._profiles = [...this._profiles, profile];
    this.notifyListeners("profiles", this._profiles, oldValue);
  }

  /**
   * Update a profile by ID
   * Returns true if the profile was found and updated
   */
  updateProfile(profileId: string, updatedProfile: Profile): boolean {
    const index = this._profiles.findIndex((p) => p.id === profileId);
    if (index === -1) return false;

    const oldValue = this._profiles;
    this._profiles = [
      ...this._profiles.slice(0, index),
      updatedProfile,
      ...this._profiles.slice(index + 1),
    ];
    this.notifyListeners("profiles", this._profiles, oldValue);

    // Also update selected profile if it matches
    if (this._selectedProfile?.isActive) {
      this.setSelectedProfile(updatedProfile);
    }

    return true;
  }

  /**
   * Remove a profile by ID
   * Returns true if the profile was found and removed
   */
  removeProfile(profileId: string): boolean {
    const index = this._profiles.findIndex((p) => p.id === profileId);
    if (index === -1) return false;

    const oldValue = this._profiles;
    this._profiles = [
      ...this._profiles.slice(0, index),
      ...this._profiles.slice(index + 1),
    ];
    this.notifyListeners("profiles", this._profiles, oldValue);

    // Clear selected profile if it was removed
    if (this._selectedProfile?.id === profileId) {
      this.setSelectedProfile(null);
    }

    return true;
  }

  /**
   * Find a profile by ID
   */
  findProfile(profileId: string): Profile | undefined {
    return this._profiles.find((p) => p.id === profileId);
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get rules for a specific profile
   */
  getRulesForProfile(profileId: string): LinkRule[] {
    return this._rules.filter((rule) => rule.profileIds.includes(profileId));
  }

  /**
   * Get rules for the currently selected profile
   */
  getRulesForSelectedProfile(): LinkRule[] {
    if (!this._selectedProfile) return [];
    return this.getRulesForProfile(this._selectedProfile.id);
  }

  /**
   * Get the first active profile, or null if none
   */
  getActiveProfile(): Profile | null {
    return this._profiles.find((p) => p.isActive) ?? null;
  }

  /**
   * Select the initial profile (first active or first available)
   */
  selectInitialProfile(): void {
    if (this._profiles.length === 0) {
      this.setSelectedProfile(null);
      return;
    }

    // Try to find an active profile
    const activeProfile = this._profiles.find((p) => p.isActive);

    if (activeProfile) {
      this.setSelectedProfile(activeProfile);
    } else {
      // Fall back to first profile
      this.setSelectedProfile(this._profiles[0]);
    }

    if (this._selectedProfile) {
      backgroundLogger.debug(
        `Selected profile: ${this._selectedProfile.name} (${this._selectedProfile.id})`,
      );
    }
  }

  // ============================================
  // State Change Listeners
  // ============================================

  /**
   * Subscribe to changes for a specific state key
   * Returns an unsubscribe function
   */
  onChange<K extends keyof BackgroundState>(
    key: K,
    listener: StateChangeListener<K>,
  ): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    const keyListeners = this.listeners.get(key)!;
    keyListeners.add(listener as StateChangeListener<keyof BackgroundState>);

    return () => {
      keyListeners.delete(
        listener as StateChangeListener<keyof BackgroundState>,
      );
    };
  }

  /**
   * Notify listeners of a state change
   */
  private notifyListeners<K extends keyof BackgroundState>(
    key: K,
    newValue: BackgroundState[K],
    oldValue: BackgroundState[K],
  ): void {
    const keyListeners = this.listeners.get(key);
    if (!keyListeners) return;

    for (const listener of keyListeners) {
      try {
        (listener as StateChangeListener<K>)(newValue, oldValue);
      } catch (error) {
        console.error(`Error in state change listener for ${key}:`, error);
      }
    }
  }

  // ============================================
  // Reset / Clear
  // ============================================

  /**
   * Reset all state to initial values
   */
  reset(): void {
    this._rules = [];
    this._profiles = [];
    this._selectedProfile = null;
    this._masterPassword = null;
    this._isLoaded = false;
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }
}
