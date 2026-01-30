// ============================================
// Dexie Database Configuration
// Handles IndexedDB setup for offline storage with encryption
// ============================================
import { LINK_LOCK_INDEXED_DB_NAME } from "@/models/constants";
import Dexie, { type EntityTable } from "dexie";
import type { IEncryptedObservableDatabase } from ".";
import type { LinkRule, Profile } from "../../models/interfaces";
import type {
  DBChangeCallback,
  DBChangeEvent,
  EncryptedProfile,
  MasterPasswordData,
  StoredRule,
} from "../../models/types";
import { dbLogger } from "../../utils/logger";
import { EncryptionService } from "../encryption";
import { DatabaseListenerManager } from "../managers/listenerManager";

// Define the database schema
export class LinkLockDatabase
  extends Dexie
  implements
    IEncryptedObservableDatabase<
      Profile,
      EncryptedProfile,
      LinkRule,
      StoredRule,
      MasterPasswordData,
      DBChangeEvent<unknown>
    >
{
  profiles!: EntityTable<EncryptedProfile, "id">;
  rules!: EntityTable<StoredRule, "id">;
  masterPassword!: EntityTable<MasterPasswordData, "id">;

  private masterPasswordHash: string | null = null;

  // Services
  // Centralized listener management
  private encryptionService = new EncryptionService();
  private listenerManager = new DatabaseListenerManager();

  constructor() {
    super(LINK_LOCK_INDEXED_DB_NAME);

    this.version(1).stores({
      profiles: "id",
      rules: "id, *profileIds",
      masterPassword: "id",
    });

    // Set up change listeners for all tables
    this.listenerManager.setupDexieHooks(
      this.profiles,
      this.rules,
      this.masterPassword,
    );
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
      dbLogger.debug("masterPasswordData", masterPasswordData);
      if (masterPasswordData) {
        this.masterPasswordHash = masterPasswordData.encryptedPasswordHash;
      }
    } catch (error) {
      dbLogger.error("Error loading master password from IndexedDB:", error);
    }
  }

  /**
   * Set the master password hash for encryption/decryption
   */
  setMasterPassword(hash: string): void {
    this.masterPasswordHash = hash;
    // Notify listeners about the change
    this.listenerManager.notifyMasterPasswordHashChange(hash);
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

    dbLogger.debug(
      "Decrypting profile with hash:",
      this.masterPasswordHash.substring(0, 10) + "...",
    );
    dbLogger.debug("Profile ID:", encryptedProfile.id);

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
      if (!this.masterPasswordHash) throw new Error("Master password not set");

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
      if (!this.masterPasswordHash) throw new Error("Master password not set");

      if (!storedRule.iv) throw new Error("IV missing for encrypted rule");

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
    return this.listenerManager.onMasterPasswordHashChange(callback);
  }

  /**
   * Subscribe to profile table changes
   * @param callback - Function called when profiles change
   * @returns Unsubscribe function
   */
  onProfileChange(callback: DBChangeCallback<EncryptedProfile>): () => void {
    return this.listenerManager.onProfileChange(callback);
  }

  /**
   * Subscribe to rules table changes
   * @param callback - Function called when rules change
   * @returns Unsubscribe function
   */
  onRuleChange(callback: DBChangeCallback<StoredRule>): () => void {
    return this.listenerManager.onRuleChange(callback);
  }

  /**
   * Subscribe to master password table changes
   * @param callback - Function called when master password changes
   * @returns Unsubscribe function
   */
  onMasterPasswordChange(
    callback: DBChangeCallback<MasterPasswordData>,
  ): () => void {
    return this.listenerManager.onMasterPasswordChange(callback);
  }
}
