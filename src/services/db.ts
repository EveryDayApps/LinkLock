// ============================================
// Dexie Database Configuration
// Handles IndexedDB setup for offline storage with encryption
// ============================================
import Dexie, { type EntityTable } from "dexie";
import type { LinkRule, Profile } from "../models/interfaces";
import { EncryptionService } from "./encryption";

// Types for encrypted storage
interface EncryptedProfile {
  id: string;
  encryptedData: string;
  iv: string;
}

interface EncryptedRule {
  id: string;
  encryptedData: string;
  iv: string;
  profileIds: string[]; // Keep for indexing
}

// Type for rule storage with optional encryption (for debugging)
export interface StoredRule {
  id: string;
  data: string; // JSON stringified rule data
  profileIds: string[]; // Keep for indexing
  encrypted: boolean; // Flag to indicate if data is encrypted
  iv?: string; // Only present if encrypted
}

interface MasterPasswordData {
  id: string; // Always "master" for singleton
  userId: string;
  encryptedPasswordHash: string;
  salt: string;
  iv: string;
  createdAt: number;
  updatedAt: number;
}

// Define the database schema
export class LinkLockDatabase extends Dexie {
  profiles!: EntityTable<EncryptedProfile, "id">;
  rules!: EntityTable<StoredRule, "id">;
  masterPassword!: EntityTable<MasterPasswordData, "id">;

  private encryptionService: EncryptionService;
  private masterPasswordHash: string | null = null;

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
      this.masterPasswordHash
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
      this.masterPasswordHash.substring(0, 10) + "..."
    );
    console.log("[DB] Profile ID:", encryptedProfile.id);

    const decrypted = await this.encryptionService.decrypt(
      encryptedProfile.encryptedData,
      encryptedProfile.iv,
      this.masterPasswordHash
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
    encrypt: boolean = true
  ): Promise<StoredRule> {
    if (encrypt) {
      if (!this.masterPasswordHash) {
        throw new Error("Master password not set");
      }

      const { encrypted, iv } = await this.encryptionService.encrypt(
        JSON.stringify(rule),
        this.masterPasswordHash
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
        this.masterPasswordHash
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
      this.masterPasswordHash
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
      this.masterPasswordHash
    );

    return JSON.parse(decrypted) as LinkRule;
  }
}

// Create and export the database instance
export const db = new LinkLockDatabase();
