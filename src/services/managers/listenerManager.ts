// ============================================
// Listener Manager - Generic listener management class
// Provides a reusable pattern for managing event listeners
// ============================================

import { syncDbChangeToBackground } from "@/background/BrowserUtils";
import type {
  DBChangeCallback,
  EncryptedProfile,
  MasterPasswordData,
  StoredRule,
} from "@/models/types";
import { listenerLogger } from "@/utils/logger";
import type { EntityTable } from "dexie";

/**
 * Generic listener manager class for managing event subscriptions
 * Encapsulates the common pattern of add/remove/notify for listeners
 *
 * @template T - The type of the callback function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ListenerManager<T extends (...args: any[]) => void> {
  private listeners: Set<T> = new Set();
  private readonly name: string;
  private readonly debug: boolean;

  /**
   * Create a new ListenerManager
   * @param name - Name for debugging purposes
   * @param debug - Enable debug logging
   */
  constructor(name: string = "ListenerManager", debug: boolean = false) {
    this.name = name;
    this.debug = debug;
  }

  /**
   * Add a listener callback
   * @param callback - The callback function to add
   * @returns Unsubscribe function that removes the listener when called
   */
  subscribe(callback: T): () => void {
    this.listeners.add(callback);
    if (this.debug) {
      listenerLogger.debug(
        `[${this.name}] Listener added. Total: ${this.listeners.size}`,
      );
    }
    return () => this.unsubscribe(callback);
  }

  /**
   * Remove a listener callback
   * @param callback - The callback function to remove
   * @returns true if the callback was found and removed
   */
  unsubscribe(callback: T): boolean {
    const deleted = this.listeners.delete(callback);
    if (this.debug && deleted) {
      listenerLogger.debug(
        `[${this.name}] Listener removed. Total: ${this.listeners.size}`,
      );
    }
    return deleted;
  }

  /**
   * Notify all listeners with the provided arguments
   * Catches and logs errors to prevent one listener from breaking others
   * @param args - Arguments to pass to each listener callback
   */
  notify(...args: Parameters<T>): void {
    this.listeners.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        listenerLogger.error(`[${this.name}] Error in listener:`, error);
      }
    });
  }

  /**
   * Get the current number of listeners
   */
  get size(): number {
    return this.listeners.size;
  }

  /**
   * Check if there are any active listeners
   */
  get hasListeners(): boolean {
    return this.listeners.size > 0;
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
    if (this.debug) {
      listenerLogger.debug(`[${this.name}] All listeners cleared`);
    }
  }
}

/**
 * Specialized listener manager for database change events
 * Pre-configured with the DBChangeCallback type pattern
 *
 * @template T - The entity type for the change event
 */
export class DBChangeListenerManager<T> extends ListenerManager<
  (event: DBChangeEventParam<T>) => void
> {
  constructor(tableName: string, debug: boolean = false) {
    super(`DB:${tableName}`, debug);
  }
}

/**
 * Database change event parameter interface
 * Matches the DBChangeEvent type from types.ts
 */
export interface DBChangeEventParam<T> {
  type: "create" | "update" | "delete";
  table: string;
  key: string;
  newValue?: T;
  oldValue?: T;
}

// ============================================
// Database Listener Manager
// Centralized management of all database change listeners
// ============================================

/**
 * Manages all database change listeners for the LinkLock database
 * Provides subscription methods and sets up Dexie hooks for change notifications
 */
export class DatabaseListenerManager {
  // Listeners for each table (IndexedDB changes)
  private profileListeners = new DBChangeListenerManager<EncryptedProfile>(
    "profiles",
  );
  private ruleListeners = new DBChangeListenerManager<StoredRule>("rules");
  private masterPasswordListeners =
    new DBChangeListenerManager<MasterPasswordData>("masterPassword");

  // Listeners for in-memory master password hash changes
  private masterPasswordHashListeners = new ListenerManager<
    (hash: string | null) => void
  >("MasterPasswordHash");

  // ============================================
  // Subscription Methods
  // ============================================

  /**
   * Subscribe to in-memory master password hash changes
   * This fires when setMasterPassword() is called
   * @param callback - Function called with the new hash value
   * @returns Unsubscribe function
   */
  onMasterPasswordHashChange(
    callback: (hash: string | null) => void,
  ): () => void {
    listenerLogger.debug("Subscribing to master password hash changes");
    return this.masterPasswordHashListeners.subscribe(callback);
  }

  /**
   * Notify listeners of master password hash changes
   * @param hash - The new hash value
   */
  notifyMasterPasswordHashChange(hash: string | null): void {
    listenerLogger.info("Master password hash changed, notifying listeners");
    this.masterPasswordHashListeners.notify(hash);
  }

  /**
   * Subscribe to profile table changes
   * @param callback - Function called when profiles change
   * @returns Unsubscribe function
   */
  onProfileChange(callback: DBChangeCallback<EncryptedProfile>): () => void {
    listenerLogger.debug("Subscribing to profile changes");
    return this.profileListeners.subscribe(callback);
  }

  /**
   * Subscribe to rules table changes
   * @param callback - Function called when rules change
   * @returns Unsubscribe function
   */
  onRuleChange(callback: DBChangeCallback<StoredRule>): () => void {
    listenerLogger.debug("Subscribing to rule changes");
    return this.ruleListeners.subscribe(callback);
  }

  /**
   * Subscribe to master password table changes
   * @param callback - Function called when master password changes
   * @returns Unsubscribe function
   */
  onMasterPasswordChange(
    callback: DBChangeCallback<MasterPasswordData>,
  ): () => void {
    listenerLogger.debug("Subscribing to master password table changes");
    return this.masterPasswordListeners.subscribe(callback);
  }

  // ============================================
  // Dexie Hooks Setup
  // ============================================

  /**
   * Set up Dexie hooks for change notifications on all tables
   * @param profiles - The profiles table from Dexie
   * @param rules - The rules table from Dexie
   * @param masterPassword - The masterPassword table from Dexie
   */
  setupDexieHooks(
    profiles: EntityTable<EncryptedProfile, "id">,
    rules: EntityTable<StoredRule, "id">,
    masterPassword: EntityTable<MasterPasswordData, "id">,
  ): void {
    listenerLogger.info("Setting up Dexie hooks for all tables");
    this.setupProfileHooks(profiles);
    this.setupRuleHooks(rules);
    this.setupMasterPasswordHooks(masterPassword);
    listenerLogger.debug("Dexie hooks setup complete");
  }

  /**
   * Set up Dexie hooks for the profiles table
   */
  private setupProfileHooks(
    profiles: EntityTable<EncryptedProfile, "id">,
  ): void {
    listenerLogger.debug("Setting up profile table hooks");
    profiles.hook("creating", (primKey, obj) => {
      listenerLogger.info(`Profile CREATED: ${primKey}`);
      this.profileListeners.notify({
        type: "create",
        table: "profiles",
        key: primKey as string,
        newValue: obj,
      });
      syncDbChangeToBackground({
        table: "profiles",
        type: "add",
        key: primKey as string,
        newValue: obj,
      });
    });

    profiles.hook("updating", (modifications, primKey, obj) => {
      listenerLogger.info(`Profile UPDATED: ${primKey}`, modifications);
      this.profileListeners.notify({
        type: "update",
        table: "profiles",
        key: primKey as string,
        oldValue: obj,
        newValue: { ...obj, ...modifications } as EncryptedProfile,
      });
      syncDbChangeToBackground({
        table: "profiles",
        type: "update",
        key: primKey as string,
        newValue: { ...obj, ...modifications } as EncryptedProfile,
        oldValue: obj,
      });
    });

    profiles.hook("deleting", (primKey, obj) => {
      listenerLogger.info(`Profile DELETED: ${primKey}`);
      this.profileListeners.notify({
        type: "delete",
        table: "profiles",
        key: primKey as string,
        oldValue: obj,
      });
      syncDbChangeToBackground({
        table: "profiles",
        type: "delete",
        key: primKey as string,
        oldValue: obj,
      });
    });
  }

  /**
   * Set up Dexie hooks for the rules table
   */
  private setupRuleHooks(rules: EntityTable<StoredRule, "id">): void {
    listenerLogger.debug("Setting up rules table hooks");
    rules.hook("creating", (primKey, obj) => {
      listenerLogger.info(`Rule CREATED: ${primKey}`);
      this.ruleListeners.notify({
        type: "create",
        table: "rules",
        key: primKey as string,
        newValue: obj,
      });
      syncDbChangeToBackground({
        table: "rules",
        type: "add",
        key: primKey as string,
        newValue: obj,
      });
    });

    rules.hook("updating", (modifications, primKey, obj) => {
      listenerLogger.info(`Rule UPDATED: ${primKey}`, modifications);
      this.ruleListeners.notify({
        type: "update",
        table: "rules",
        key: primKey as string,
        oldValue: obj,
        newValue: { ...obj, ...modifications } as StoredRule,
      });
      syncDbChangeToBackground({
        table: "rules",
        type: "update",
        key: primKey as string,
        newValue: { ...obj, ...modifications } as StoredRule,
        oldValue: obj,
      });
    });

    rules.hook("deleting", (primKey, obj) => {
      listenerLogger.info(`Rule DELETED: ${primKey}`);
      this.ruleListeners.notify({
        type: "delete",
        table: "rules",
        key: primKey as string,
        oldValue: obj,
      });
      syncDbChangeToBackground({
        table: "rules",
        type: "delete",
        key: primKey as string,
        oldValue: obj,
      });
    });
  }

  /**
   * Set up Dexie hooks for the masterPassword table
   */
  private setupMasterPasswordHooks(
    masterPassword: EntityTable<MasterPasswordData, "id">,
  ): void {
    listenerLogger.debug("Setting up masterPassword table hooks");
    masterPassword.hook("creating", (primKey, obj) => {
      listenerLogger.info(`MasterPassword CREATED: ${primKey}`);
      this.masterPasswordListeners.notify({
        type: "create",
        table: "masterPassword",
        key: primKey as string,
        newValue: obj,
      });
      syncDbChangeToBackground({
        table: "masterPassword",
        type: "add",
        key: primKey as string,
        newValue: obj,
      });
    });

    masterPassword.hook("updating", (modifications, primKey, obj) => {
      listenerLogger.info(`MasterPassword UPDATED: ${primKey}`);
      this.masterPasswordListeners.notify({
        type: "update",
        table: "masterPassword",
        key: primKey as string,
        oldValue: obj,
        newValue: { ...obj, ...modifications } as MasterPasswordData,
      });
      syncDbChangeToBackground({
        table: "masterPassword",
        type: "update",
        key: primKey as string,
        newValue: { ...obj, ...modifications } as MasterPasswordData,
        oldValue: obj,
      });
    });

    masterPassword.hook("deleting", (primKey, obj) => {
      listenerLogger.info(`MasterPassword DELETED: ${primKey}`);
      this.masterPasswordListeners.notify({
        type: "delete",
        table: "masterPassword",
        key: primKey as string,
        oldValue: obj,
      });
      syncDbChangeToBackground({
        table: "masterPassword",
        type: "delete",
        key: primKey as string,
        oldValue: obj,
      });
    });
  }

  /**
   * Clear all listeners (useful for cleanup/testing)
   */
  clearAll(): void {
    listenerLogger.info("Clearing all listeners");
    this.profileListeners.clear();
    this.ruleListeners.clear();
    this.masterPasswordListeners.clear();
    this.masterPasswordHashListeners.clear();
    listenerLogger.debug("All listeners cleared");
  }
}
