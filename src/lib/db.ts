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

// Define the database schema
class LinkLockDatabase extends Dexie {
  profiles!: EntityTable<EncryptedProfile, "id">;
  rules!: EntityTable<EncryptedRule, "id">;

  private encryptionService: EncryptionService;
  private masterPasswordHash: string | null = null;

  constructor() {
    super("LinkLockDB");

    // Version 2: Added encryption support
    this.version(2).stores({
      profiles: "id",
      rules: "id, *profileIds",
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
   * Clear all data from the database
   */
  async clearAll(): Promise<void> {
    await this.profiles.clear();
    await this.rules.clear();
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

    const decrypted = await this.encryptionService.decrypt(
      encryptedProfile.encryptedData,
      encryptedProfile.iv,
      this.masterPasswordHash
    );

    return JSON.parse(decrypted) as Profile;
  }

  /**
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
      profileIds: rule.profileIds, // Keep for indexing
    };
  }

  /**
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
