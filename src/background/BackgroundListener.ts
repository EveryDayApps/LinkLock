// ============================================
// Background Listener - Handles messages from popup/content scripts
// Listens for database changes (profiles, rules, masterPassword)
// and responds to CRUD operations (create, update, delete)
// ============================================

import { DB_CHANGE_MESSAGE_TYPE } from "@/models/constants";
import { browser } from "@/utils/get-browser";
import { backgroundLogger } from "@/utils/logger";
import type {
  AnyChangeHandler,
  DBChangeMessage,
  MasterPasswordChangeHandler,
  MasterPasswordChangePayload,
  MasterPasswordTableHandlers,
  ProfileChangeHandler,
  ProfileChangePayload,
  ProfileTableHandlers,
  RuleChangeHandler,
  RuleChangePayload,
  RuleTableHandlers,
  TypedDBChangePayload,
} from "./BackgroundModels";

// Re-export types for convenience
export type {
  AnyChangeHandler,
  DBChangeHandler,
  DBChangeMessage,
  DBChangePayload,
  DecryptedEntityMap,
  EncryptedProfile,
  LinkRule,
  MasterPasswordChangeHandler,
  MasterPasswordChangePayload,
  MasterPasswordData,
  MasterPasswordTableHandlers,
  OperationType,
  Profile,
  ProfileChangeHandler,
  ProfileChangePayload,
  ProfileTableHandlers,
  RuleChangeHandler,
  RuleChangePayload,
  RuleTableHandlers,
  StoredEntityMap,
  StoredRule,
  TableHandlers,
  TableName,
  TypedDBChangeMessage,
  TypedDBChangePayload,
} from "./BackgroundModels";

// Re-export type guards
export {
  isMasterPasswordPayload,
  isProfilePayload,
  isRulePayload,
} from "./BackgroundModels";

// ============================================
// Background Listener Class
// ============================================

/**
 * BackgroundListener manages message listeners for the background script.
 * It listens for database change events from the popup and content scripts
 * and triggers appropriate handlers for each table and operation type.
 */
export class BackgroundListener {
  private isInitialized = false;
  private messageListener:
    | ((message: unknown, sender: browser.runtime.MessageSender) => void)
    | null = null;

  // Handlers for each table with proper types
  private profileHandlers: ProfileTableHandlers = {};
  private ruleHandlers: RuleTableHandlers = {};
  private masterPasswordHandlers: MasterPasswordTableHandlers = {};

  // General change handlers (called for any table change)
  private generalHandlers: AnyChangeHandler[] = [];

  /**
   * Initialize the background listener
   * Must be called to start listening for messages
   */
  initialize(): void {
    if (this.isInitialized) {
      backgroundLogger.warn("Already initialized");
      return;
    }

    this.messageListener = this.handleMessage.bind(this);
    browser.runtime.onMessage.addListener(this.messageListener);
    this.isInitialized = true;

    backgroundLogger.info("Initialized and listening for messages");
  }

  // ============================================
  // Message Handler
  // ============================================

  /**
   * Handle incoming messages from popup/content scripts
   */
  private handleMessage(
    message: unknown,
    _sender: browser.runtime.MessageSender,
  ): void {
    // Type guard for DB change messages
    if (!this.isDBChangeMessage(message)) {
      return;
    }

    const { payload } = message;
    backgroundLogger.debug("Received DB change:", payload);

    // Dispatch to table-specific handlers
    this.dispatchToTableHandlers(payload);

    // Call general handlers
    this.notifyGeneralHandlers(payload);
  }

  /**
   * Type guard to check if message is a DB change message
   */
  private isDBChangeMessage(message: unknown): message is DBChangeMessage {
    if (typeof message !== "object" || message === null) {
      return false;
    }

    const msg = message as Record<string, unknown>;
    return (
      msg.type === DB_CHANGE_MESSAGE_TYPE &&
      typeof msg.payload === "object" &&
      msg.payload !== null
    );
  }

  /**
   * Dispatch the payload to appropriate table handlers
   */
  private dispatchToTableHandlers(payload: TypedDBChangePayload): void {
    switch (payload.table) {
      case "profiles":
        this.dispatchProfileHandlers(payload);
        break;
      case "rules":
        this.dispatchRuleHandlers(payload);
        break;
      case "masterPassword":
        this.dispatchMasterPasswordHandlers(payload);
        break;
      default:
        backgroundLogger.warn(
          `Unknown table: ${(payload as TypedDBChangePayload).table}`,
        );
    }
  }

  /**
   * Dispatch to profile handlers with typed payload
   */
  private dispatchProfileHandlers(payload: ProfileChangePayload): void {
    switch (payload.type) {
      case "add":
        this.safeCallTyped(this.profileHandlers.onCreate, payload);
        break;
      case "update":
        this.safeCallTyped(this.profileHandlers.onUpdate, payload);
        break;
      case "delete":
        this.safeCallTyped(this.profileHandlers.onDelete, payload);
        break;
    }
  }

  /**
   * Dispatch to rule handlers with typed payload
   */
  private dispatchRuleHandlers(payload: RuleChangePayload): void {
    switch (payload.type) {
      case "add":
        this.safeCallTyped(this.ruleHandlers.onCreate, payload);
        break;
      case "update":
        this.safeCallTyped(this.ruleHandlers.onUpdate, payload);
        break;
      case "delete":
        this.safeCallTyped(this.ruleHandlers.onDelete, payload);
        break;
    }
  }

  /**
   * Dispatch to master password handlers with typed payload
   */
  private dispatchMasterPasswordHandlers(
    payload: MasterPasswordChangePayload,
  ): void {
    switch (payload.type) {
      case "add":
        this.safeCallTyped(this.masterPasswordHandlers.onCreate, payload);
        break;
      case "update":
        this.safeCallTyped(this.masterPasswordHandlers.onUpdate, payload);
        break;
      case "delete":
        this.safeCallTyped(this.masterPasswordHandlers.onDelete, payload);
        break;
    }
  }

  /**
   * Safely call a typed handler, catching and logging any errors
   */
  private safeCallTyped<T extends TypedDBChangePayload>(
    handler: ((payload: T) => void | Promise<void>) | undefined,
    payload: T,
  ): void {
    if (!handler) {
      return;
    }

    try {
      const result = handler(payload);
      // Handle async handlers
      if (result instanceof Promise) {
        result.catch((error) => {
          backgroundLogger.error("Error in async handler:", error);
        });
      }
    } catch (error) {
      backgroundLogger.error("Error in handler:", error);
    }
  }

  /**
   * Notify all general handlers of the change
   */
  private notifyGeneralHandlers(payload: TypedDBChangePayload): void {
    for (const handler of this.generalHandlers) {
      this.safeCallTyped(handler, payload);
    }
  }

  // ============================================
  // Profile Handlers
  // ============================================

  /**
   * Register handler for profile creation
   */
  onProfileCreate(handler: ProfileChangeHandler): () => void {
    this.profileHandlers.onCreate = handler;
    return () => {
      this.profileHandlers.onCreate = undefined;
    };
  }

  /**
   * Register handler for profile updates
   */
  onProfileUpdate(handler: ProfileChangeHandler): () => void {
    this.profileHandlers.onUpdate = handler;
    return () => {
      this.profileHandlers.onUpdate = undefined;
    };
  }

  /**
   * Register handler for profile deletion
   */
  onProfileDelete(handler: ProfileChangeHandler): () => void {
    this.profileHandlers.onDelete = handler;
    return () => {
      this.profileHandlers.onDelete = undefined;
    };
  }

  /**
   * Register handlers for all profile operations at once
   */
  onProfileChange(handlers: ProfileTableHandlers): () => void {
    this.profileHandlers = { ...this.profileHandlers, ...handlers };
    return () => {
      if (handlers.onCreate) this.profileHandlers.onCreate = undefined;
      if (handlers.onUpdate) this.profileHandlers.onUpdate = undefined;
      if (handlers.onDelete) this.profileHandlers.onDelete = undefined;
    };
  }

  // ============================================
  // Rule Handlers
  // ============================================

  /**
   * Register handler for rule creation
   */
  onRuleCreate(handler: RuleChangeHandler): () => void {
    this.ruleHandlers.onCreate = handler;
    return () => {
      this.ruleHandlers.onCreate = undefined;
    };
  }

  /**
   * Register handler for rule updates
   */
  onRuleUpdate(handler: RuleChangeHandler): () => void {
    this.ruleHandlers.onUpdate = handler;
    return () => {
      this.ruleHandlers.onUpdate = undefined;
    };
  }

  /**
   * Register handler for rule deletion
   */
  onRuleDelete(handler: RuleChangeHandler): () => void {
    this.ruleHandlers.onDelete = handler;
    return () => {
      this.ruleHandlers.onDelete = undefined;
    };
  }

  /**
   * Register handlers for all rule operations at once
   */
  onRuleChange(handlers: RuleTableHandlers): () => void {
    this.ruleHandlers = { ...this.ruleHandlers, ...handlers };
    return () => {
      if (handlers.onCreate) this.ruleHandlers.onCreate = undefined;
      if (handlers.onUpdate) this.ruleHandlers.onUpdate = undefined;
      if (handlers.onDelete) this.ruleHandlers.onDelete = undefined;
    };
  }

  // ============================================
  // Master Password Handlers
  // ============================================

  /**
   * Register handler for master password creation
   */
  onMasterPasswordCreate(handler: MasterPasswordChangeHandler): () => void {
    this.masterPasswordHandlers.onCreate = handler;
    return () => {
      this.masterPasswordHandlers.onCreate = undefined;
    };
  }

  /**
   * Register handler for master password updates
   */
  onMasterPasswordUpdate(handler: MasterPasswordChangeHandler): () => void {
    this.masterPasswordHandlers.onUpdate = handler;
    return () => {
      this.masterPasswordHandlers.onUpdate = undefined;
    };
  }

  /**
   * Register handler for master password deletion
   */
  onMasterPasswordDelete(handler: MasterPasswordChangeHandler): () => void {
    this.masterPasswordHandlers.onDelete = handler;
    return () => {
      this.masterPasswordHandlers.onDelete = undefined;
    };
  }

  /**
   * Register handlers for all master password operations at once
   */
  onMasterPasswordChange(handlers: MasterPasswordTableHandlers): () => void {
    this.masterPasswordHandlers = {
      ...this.masterPasswordHandlers,
      ...handlers,
    };
    return () => {
      if (handlers.onCreate) this.masterPasswordHandlers.onCreate = undefined;
      if (handlers.onUpdate) this.masterPasswordHandlers.onUpdate = undefined;
      if (handlers.onDelete) this.masterPasswordHandlers.onDelete = undefined;
    };
  }

  // ============================================
  // General Handlers
  // ============================================

  /**
   * Register a handler that will be called for any database change
   * Useful for general logging, sync, or cache invalidation
   */
  onAnyChange(handler: AnyChangeHandler): () => void {
    this.generalHandlers.push(handler);
    return () => {
      const index = this.generalHandlers.indexOf(handler);
      if (index > -1) {
        this.generalHandlers.splice(index, 1);
      }
    };
  }
}
