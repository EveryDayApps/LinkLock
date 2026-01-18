// ============================================
// Background Manager - Manages background script operations
// Uses BackgroundListener for handling database change events
// ============================================

import { backgroundLogger } from "@/utils/logger";
import { backgroundListener, type DBChangePayload } from "./BackgroundListener";

/**
 * BackgroundManager handles all background script operations.
 * It sets up listeners for database changes and coordinates
 * responses to profile, rule, and master password events.
 */
export class BackgroundManager {
  private isInitialized = false;

  /**
   * Initialize the background manager
   * Sets up all listeners and handlers
   */
  initialize(): void {
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

    this.isInitialized = true;
    backgroundLogger.info("BackgroundManager initialized successfully");
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
   * Handle profile creation
   */
  private handleProfileCreate(payload: DBChangePayload): void {
    backgroundLogger.info(`Profile created: ${payload.key}`);
    // TODO: Add your profile creation logic here
    // Example: Sync to chrome.storage.local, update caches, etc.
  }

  /**
   * Handle profile update
   */
  private handleProfileUpdate(payload: DBChangePayload): void {
    backgroundLogger.info(`Profile updated: ${payload.key}`);
    // TODO: Add your profile update logic here
    // Example: Re-sync rules for the profile, update caches, etc.
  }

  /**
   * Handle profile deletion
   */
  private handleProfileDelete(payload: DBChangePayload): void {
    backgroundLogger.info(`Profile deleted: ${payload.key}`);
    // TODO: Add your profile deletion logic here
    // Example: Remove related rules from storage, clear caches, etc.
  }

  // ============================================
  // Rule Change Handlers
  // ============================================

  /**
   * Handle rule creation
   */
  private handleRuleCreate(payload: DBChangePayload): void {
    backgroundLogger.info(`Rule created: ${payload.key}`);
    backgroundLogger.info(payload.newValue);
    // TODO: Add your rule creation logic here
    // Example: Add to chrome.storage.local for fast runtime access
  }

  /**
   * Handle rule update
   */
  private handleRuleUpdate(payload: DBChangePayload<"rules">): void {
    backgroundLogger.info(`Rule updated: ${payload.key}`);
    // TODO: Add your rule update logic here
    // Example: Update rule in chrome.storage.local
  }

  /**
   * Handle rule deletion
   */
  private handleRuleDelete(payload: DBChangePayload): void {
    backgroundLogger.info(`Rule deleted: ${payload.key}`);
    // TODO: Add your rule deletion logic here
    // Example: Remove rule from chrome.storage.local
  }

  // ============================================
  // Master Password Change Handlers
  // ============================================

  /**
   * Handle master password creation
   */
  private handleMasterPasswordCreate(payload: DBChangePayload): void {
    backgroundLogger.info(`Master password created: ${payload.key}`);
    // TODO: Add your master password creation logic here
    // Example: Initialize encryption, set up security state
  }

  /**
   * Handle master password update
   */
  private handleMasterPasswordUpdate(payload: DBChangePayload): void {
    backgroundLogger.info(`Master password updated: ${payload.key}`);
    // TODO: Add your master password update logic here
    // Example: Re-encrypt data, update security state
  }

  /**
   * Handle master password deletion
   */
  private handleMasterPasswordDelete(payload: DBChangePayload): void {
    backgroundLogger.info(`Master password deleted: ${payload.key}`);
    // TODO: Add your master password deletion logic here
    // Example: Clear encrypted data, reset security state
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
   * Get a summary of the current listener state
   */
  getStatus(): {
    isRunning: boolean;
    registeredHandlers: Record<string, string[]>;
  } {
    return {
      isRunning: this.isInitialized,
      registeredHandlers: backgroundListener.getHandlerSummary(),
    };
  }
}
