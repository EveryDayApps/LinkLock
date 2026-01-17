// ============================================
// Dexie Database Configuration
// Handles IndexedDB setup for offline storage with encryption
// ============================================
import Dexie, { type EntityTable } from "dexie";
import type { LinkRule, Profile } from "../models/interfaces";
import type {
  DBChangeCallback,
  DBChangeEvent,
  EncryptedProfile,
  EncryptedRule,
  MasterPasswordData,
  StoredRule,
} from "../models/types";
import { notifyDbChange } from "../utils/browser_utils";
import { EncryptionService } from "./encryption";

// Define the database schema
export class LinkLockDatabase extends Dexie {
  profiles!: EntityTable<EncryptedProfile, "id">;
  rules!: EntityTable<StoredRule, "id">;
  masterPassword!: EntityTable<MasterPasswordData, "id">;

  private encryptionService: EncryptionService;
  private masterPasswordHash: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  // Listeners for each table (IndexedDB changes)
  private profileListeners: Set<DBChangeCallback<EncryptedProfile>> = new Set();
  private ruleListeners: Set<DBChangeCallback<StoredRule>> = new Set();
  private masterPasswordListeners: Set<DBChangeCallback<MasterPasswordData>> =
    new Set();

  // Listeners for in-memory master password hash changes
  private masterPasswordHashListeners: Set<(hash: string | null) => void> =
    new Set();

  constructor() {
    super("LinkLockDB");

    // Version 2: Added encryption support
    this.version(2).stores({
      profiles: "id",
      rules: "id, *profileIds",
    });

    // Version 3: Added master password storage
    this.version(3).stores({
      profiles: "id",
      rules: "id, *profileIds",
      masterPassword: "id",
    });

    this.encryptionService = new EncryptionService();

    // Set up change listeners for all tables
    this.setupChangeListeners();
  }

  async initialize(): Promise<void> {
    // Load master password data on initialization
    await this.loadMasterPasswordFromDB();
  }

  /**
   * Load master password data from IndexedDB on initialization
   * This is called automatically in the constructor
   */
  private async loadMasterPasswordFromDB(): Promise<void> {
    try {
      const masterPasswordData = await this.masterPassword.get("master");
      console.log("masterPasswordData", masterPasswordData);
      if (masterPasswordData) {
        // Note: This loads the encrypted hash, not the actual master password
        // The actual master password hash for encryption needs to be set via setMasterPassword
        // after the user authenticates
        this.masterPasswordHash = masterPasswordData.encryptedPasswordHash;
      }
    } catch (error) {
      console.error(
        "[DB] Error loading master password from IndexedDB:",
        error,
      );
    }
  }

  /**
   * Ensure the database is fully initialized
   * Call this before performing operations if needed
   */
  async ensureInitialized(): Promise<void> {
    await this.initializationPromise;
  }

  /**
   * Set the master password hash for encryption/decryption
   */
  setMasterPassword(hash: string): void {
    this.masterPasswordHash = hash;
  }

  /**
   * Get the current master password hash
   * Returns null if not set
   */
  getMasterPasswordHash(): string | null {
    return this.masterPasswordHash;
  }

  /**
   * Check if master password is set
   */
  hasMasterPasswordSet(): boolean {
    return this.masterPasswordHash !== null;
  }

  /**
   * Get master password data from IndexedDB
   */
  async getMasterPasswordData(): Promise<MasterPasswordData | undefined> {
    return await this.masterPassword.get("master");
  }

  /**
   * Set/Update master password data in IndexedDB
   */
  async setMasterPasswordData(data: MasterPasswordData): Promise<void> {
    await this.masterPassword.put(data);
  }

  /**
   * Delete master password data from IndexedDB
   */
  async deleteMasterPasswordData(): Promise<void> {
    await this.masterPassword.delete("master");
  }

  /**
   * Clear all data from the database
   */
  async clearAll(): Promise<void> {
    await this.profiles.clear();
    await this.rules.clear();
    await this.masterPassword.clear();
  }

  /**
   * Encrypt a profile before storing
   */
  async encryptProfile(profile: Profile): Promise<EncryptedProfile> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const { encrypted, iv } = await this.encryptionService.encrypt(
      JSON.stringify(profile),
      this.masterPasswordHash,
    );

    return {
      id: profile.id,
      encryptedData: encrypted,
      iv: iv,
    };
  }

  /**
   * Decrypt a profile after retrieving
   */
  async decryptProfile(encryptedProfile: EncryptedProfile): Promise<Profile> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    console.log(
      "[DB] Decrypting profile with hash:",
      this.masterPasswordHash.substring(0, 10) + "...",
    );
    console.log("[DB] Profile ID:", encryptedProfile.id);

    const decrypted = await this.encryptionService.decrypt(
      encryptedProfile.encryptedData,
      encryptedProfile.iv,
      this.masterPasswordHash,
    );

    return JSON.parse(decrypted) as Profile;
  }

  /**
   * Store a rule with optional encryption
   * @param rule - The rule to store
   * @param encrypt - If true, encrypts the data; if false, stores as plain JSON
   */
  async storeRule(
    rule: LinkRule,
    encrypt: boolean = true,
  ): Promise<StoredRule> {
    if (encrypt) {
      if (!this.masterPasswordHash) {
        throw new Error("Master password not set");
      }

      const { encrypted, iv } = await this.encryptionService.encrypt(
        JSON.stringify(rule),
        this.masterPasswordHash,
      );

      return {
        id: rule.id,
        data: encrypted,
        iv: iv,
        profileIds: rule.profileIds,
        encrypted: true,
      };
    } else {
      // Store as plain JSON (for debugging)
      return {
        id: rule.id,
        data: JSON.stringify(rule),
        profileIds: rule.profileIds,
        encrypted: false,
      };
    }
  }

  /**
   * Retrieve and decrypt/parse a rule
   * @param storedRule - The stored rule from IndexedDB
   */
  async retrieveRule(storedRule: StoredRule): Promise<LinkRule> {
    if (storedRule.encrypted) {
      if (!this.masterPasswordHash) {
        throw new Error("Master password not set");
      }

      if (!storedRule.iv) {
        throw new Error("IV missing for encrypted rule");
      }

      const decrypted = await this.encryptionService.decrypt(
        storedRule.data,
        storedRule.iv,
        this.masterPasswordHash,
      );

      return JSON.parse(decrypted) as LinkRule;
    } else {
      // Parse plain JSON
      return JSON.parse(storedRule.data) as LinkRule;
    }
  }

  /**
   * @deprecated Use storeRule instead
   * Encrypt a rule before storing
   */
  async encryptRule(rule: LinkRule): Promise<EncryptedRule> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const { encrypted, iv } = await this.encryptionService.encrypt(
      JSON.stringify(rule),
      this.masterPasswordHash,
    );

    return {
      id: rule.id,
      encryptedData: encrypted,
      iv: iv,
      profileIds: rule.profileIds,
    };
  }

  /**
   * @deprecated Use retrieveRule instead
   * Decrypt a rule after retrieving
   */
  async decryptRule(encryptedRule: EncryptedRule): Promise<LinkRule> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const decrypted = await this.encryptionService.decrypt(
      encryptedRule.encryptedData,
      encryptedRule.iv,
      this.masterPasswordHash,
    );

    return JSON.parse(decrypted) as LinkRule;
  }

  // ============================================
  // Database Change Listeners
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
    this.masterPasswordHashListeners.add(callback);
    return () => this.masterPasswordHashListeners.delete(callback);
  }

  /**
   * Subscribe to profile table changes
   * @param callback - Function called when profiles change
   * @returns Unsubscribe function
   */
  onProfileChange(callback: DBChangeCallback<EncryptedProfile>): () => void {
    this.profileListeners.add(callback);
    return () => this.profileListeners.delete(callback);
  }

  /**
   * Subscribe to rules table changes
   * @param callback - Function called when rules change
   * @returns Unsubscribe function
   */
  onRuleChange(callback: DBChangeCallback<StoredRule>): () => void {
    this.ruleListeners.add(callback);
    return () => this.ruleListeners.delete(callback);
  }

  /**
   * Subscribe to master password table changes
   * @param callback - Function called when master password changes
   * @returns Unsubscribe function
   */
  onMasterPasswordChange(
    callback: DBChangeCallback<MasterPasswordData>,
  ): () => void {
    this.masterPasswordListeners.add(callback);
    return () => this.masterPasswordListeners.delete(callback);
  }

  /**
   * Notify all listeners for a specific table
   */
  private notifyListeners<T>(
    listeners: Set<DBChangeCallback<T>>,
    event: DBChangeEvent<T>,
  ): void {
    listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("[DB] Error in change listener:", error);
      }
    });
  }

  /**
   * Set up Dexie hooks for change notifications
   */
  private setupChangeListeners(): void {
    // Profile hooks
    this.profiles.hook("creating", (primKey, obj) => {
      this.notifyListeners(this.profileListeners, {
        type: "create",
        table: "profiles",
        key: primKey as string,
        newValue: obj,
      });
      notifyDbChange({
        table: "profiles",
        type: "add",
        key: primKey as string,
      });
    });

    this.profiles.hook("updating", (modifications, primKey, obj) => {
      this.notifyListeners(this.profileListeners, {
        type: "update",
        table: "profiles",
        key: primKey as string,
        oldValue: obj,
        newValue: { ...obj, ...modifications } as EncryptedProfile,
      });
      notifyDbChange({
        table: "profiles",
        type: "update",
        key: primKey as string,
      });
    });

    this.profiles.hook("deleting", (primKey, obj) => {
      this.notifyListeners(this.profileListeners, {
        type: "delete",
        table: "profiles",
        key: primKey as string,
        oldValue: obj,
      });
      notifyDbChange({
        table: "profiles",
        type: "delete",
        key: primKey as string,
      });
    });

    // Rules hooks
    this.rules.hook("creating", (primKey, obj) => {
      this.notifyListeners(this.ruleListeners, {
        type: "create",
        table: "rules",
        key: primKey as string,
        newValue: obj,
      });
      notifyDbChange({ table: "rules", type: "add", key: primKey as string });
    });

    this.rules.hook("updating", (modifications, primKey, obj) => {
      this.notifyListeners(this.ruleListeners, {
        type: "update",
        table: "rules",
        key: primKey as string,
        oldValue: obj,
        newValue: { ...obj, ...modifications } as StoredRule,
      });
      notifyDbChange({
        table: "rules",
        type: "update",
        key: primKey as string,
      });
    });

    this.rules.hook("deleting", (primKey, obj) => {
      this.notifyListeners(this.ruleListeners, {
        type: "delete",
        table: "rules",
        key: primKey as string,
        oldValue: obj,
      });
      notifyDbChange({
        table: "rules",
        type: "delete",
        key: primKey as string,
      });
    });

    // Master password hooks
    this.masterPassword.hook("creating", (primKey, obj) => {
      this.notifyListeners(this.masterPasswordListeners, {
        type: "create",
        table: "masterPassword",
        key: primKey as string,
        newValue: obj,
      });
      notifyDbChange({
        table: "masterPassword",
        type: "add",
        key: primKey as string,
      });
    });

    this.masterPassword.hook("updating", (modifications, primKey, obj) => {
      this.notifyListeners(this.masterPasswordListeners, {
        type: "update",
        table: "masterPassword",
        key: primKey as string,
        oldValue: obj,
        newValue: { ...obj, ...modifications } as MasterPasswordData,
      });
      notifyDbChange({
        table: "masterPassword",
        type: "update",
        key: primKey as string,
      });
    });

    this.masterPassword.hook("deleting", (primKey, obj) => {
      this.notifyListeners(this.masterPasswordListeners, {
        type: "delete",
        table: "masterPassword",
        key: primKey as string,
        oldValue: obj,
      });
      notifyDbChange({
        table: "masterPassword",
        type: "delete",
        key: primKey as string,
      });
    });
  }
}
