// ============================================
// Dexie Database Configuration
// Handles IndexedDB setup for offline storage with encryption
// ============================================
import Dexie, { type EntityTable } from "dexie";
import type { LinkRule, Profile } from "../models/interfaces";
import { EncryptionConfig, getFieldName, getTableName } from "./config";
import { EncryptionService } from "./encryption";

// Get dynamic field names based on configuration
const FIELD_KEY = getFieldName("key");
const FIELD_DATA = getFieldName("data");
const FIELD_VECTOR = getFieldName("vector");
const FIELD_PROFILES = getFieldName("profiles");
const FIELD_TYPE = getFieldName("type");

// Get dynamic table names based on configuration
const TABLE_PROFILES = getTableName("profiles");
const TABLE_RULES = getTableName("rules");
const TABLE_MASTER_PASSWORD = getTableName("masterPassword");

// Types for encrypted storage with dynamic field names
// In debug mode: descriptive names (id, encryptedData, iv, profileIds, type)
// In production: obfuscated names (k, d, v, p, t)
interface EncryptedRecord {
  [key: string]: any;
}

interface EncryptedRuleRecord {
  [key: string]: any;
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
// Table names are dynamic based on configuration:
// Debug mode: profiles, rules, masterPassword
// Production: t1, t2, t3
export class LinkLockDatabase extends Dexie {
  t1!: EntityTable<EncryptedRecord, string>; // profiles
  t2!: EntityTable<EncryptedRuleRecord, string>; // rules
  t3!: EntityTable<MasterPasswordData, "id">; // masterPassword

  private encryptionService: EncryptionService;
  private masterPasswordHash: string | null = null;

  constructor() {
    super("LinkLockDB");

    if (EncryptionConfig.logEncryption) {
      console.log("[DEBUG] Database initialized with:", {
        useEncryption: EncryptionConfig.useEncryption,
        useObfuscation: EncryptionConfig.useObfuscation,
        tableProfiles: TABLE_PROFILES,
        tableRules: TABLE_RULES,
        fieldKey: FIELD_KEY,
        fieldData: FIELD_DATA,
      });
    }

    // Version 2: Added encryption support (legacy)
    this.version(2).stores({
      profiles: "id",
      rules: "id, *profileIds",
    });

    // Version 3: Added master password storage (legacy)
    this.version(3).stores({
      profiles: "id",
      rules: "id, *profileIds",
      masterPassword: "id",
    });

    // Version 4: NEW - Obfuscated field names and table names with encrypted keys
    this.version(4)
      .stores({
        [TABLE_PROFILES]: FIELD_KEY, // profiles table with key field
        [TABLE_RULES]: `${FIELD_KEY}, *${FIELD_PROFILES}`, // rules table with key and profile IDs
        [TABLE_MASTER_PASSWORD]: "id", // masterPassword table
      })
      .upgrade(async (trans) => {
        // Migration from version 3 to 4
        await this.migrateToObfuscatedSchema(trans);
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
   * Migrate data from old schema (v2/v3) to new obfuscated schema (v4)
   */
  private async migrateToObfuscatedSchema(trans: any): Promise<void> {
    if (!this.masterPasswordHash) {
      if (EncryptionConfig.logEncryption) {
        console.warn("Cannot migrate: master password not set");
      }
      return;
    }

    try {
      // Check if old data exists in legacy tables
      const oldProfiles = await trans.table("profiles").toArray();
      const oldRules = await trans.table("rules").toArray();
      const oldMasterPassword = await trans.table("masterPassword").toArray();

      if (EncryptionConfig.logEncryption) {
        console.log(
          `[Migration] Found ${oldProfiles.length} profiles, ${oldRules.length} rules to migrate`
        );
      }

      // Migrate profiles to new table
      let migratedProfiles = 0;
      for (const oldProfile of oldProfiles) {
        if (oldProfile.id && oldProfile.encryptedData && oldProfile.iv) {
          try {
            // Old format - decrypt and re-encrypt with new schema
            const profile = await this.decryptLegacyProfile(oldProfile);
            const newRecord = await this.encryptProfile(profile);
            await trans.table(TABLE_PROFILES).put(newRecord);
            migratedProfiles++;
          } catch (error) {
            if (EncryptionConfig.logEncryption) {
              console.error(
                `Failed to migrate profile ${oldProfile.id}:`,
                error
              );
            }
            // Continue with other profiles
          }
        }
      }

      // Migrate rules to new table
      let migratedRules = 0;
      for (const oldRule of oldRules) {
        if (oldRule.id && oldRule.encryptedData && oldRule.iv) {
          try {
            // Old format - decrypt and re-encrypt with new schema
            const rule = await this.decryptLegacyRule(oldRule);
            const newRecord = await this.encryptRule(rule);
            await trans.table(TABLE_RULES).put(newRecord);
            migratedRules++;
          } catch (error) {
            if (EncryptionConfig.logEncryption) {
              console.error(`Failed to migrate rule ${oldRule.id}:`, error);
            }
            // Continue with other rules
          }
        }
      }

      // Migrate master password to new table (no encryption needed for this table)
      for (const mp of oldMasterPassword) {
        await trans.table(TABLE_MASTER_PASSWORD).put(mp);
      }

      if (EncryptionConfig.logEncryption) {
        console.log(
          `[Migration] Successfully migrated ${migratedProfiles}/${oldProfiles.length} profiles, ${migratedRules}/${oldRules.length} rules`
        );
      }
    } catch (error) {
      if (EncryptionConfig.logEncryption) {
        console.error("Migration failed:", error);
      }
      // Don't throw - allow the upgrade to complete
      // The initialize() method will handle cleanup if needed
    }
  }

  /**
   * Decrypt legacy profile format
   */
  private async decryptLegacyProfile(legacyRecord: any): Promise<Profile> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const decrypted = await this.encryptionService.decrypt(
      legacyRecord.encryptedData,
      legacyRecord.iv,
      this.masterPasswordHash
    );

    return JSON.parse(decrypted) as Profile;
  }

  /**
   * Decrypt legacy rule format
   */
  private async decryptLegacyRule(legacyRecord: any): Promise<LinkRule> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const decrypted = await this.encryptionService.decrypt(
      legacyRecord.encryptedData,
      legacyRecord.iv,
      this.masterPasswordHash
    );

    return JSON.parse(decrypted) as LinkRule;
  }

  /**
   * Clear all data from the database
   */
  async clearAll(): Promise<void> {
    await this.t1.clear(); // profiles
    await this.t2.clear(); // rules
    await this.t3.clear(); // masterPassword
  }

  /**
   * Encrypt a profile before storing with dynamic field names
   * In debug mode: uses descriptive names and plain text
   * In production: uses obfuscated names and encryption
   */
  async encryptProfile(profile: Profile): Promise<EncryptedRecord> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    // Encrypt the entire profile data
    const { encrypted, iv } = await this.encryptionService.encrypt(
      JSON.stringify(profile),
      this.masterPasswordHash
    );

    // Create encrypted key for lookup
    const encryptedKey = await this.encryptionService.encryptId(
      profile.id,
      this.masterPasswordHash
    );

    // Create record with dynamic field names
    const record: EncryptedRecord = {
      [FIELD_KEY]: encryptedKey,
      [FIELD_DATA]: encrypted,
      [FIELD_VECTOR]: iv,
      [FIELD_TYPE]: "profile",
    };

    return record;
  }

  /**
   * Decrypt a profile after retrieving
   */
  async decryptProfile(encryptedRecord: EncryptedRecord): Promise<Profile> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    try {
      const decrypted = await this.encryptionService.decrypt(
        encryptedRecord[FIELD_DATA],
        encryptedRecord[FIELD_VECTOR],
        this.masterPasswordHash
      );

      return JSON.parse(decrypted) as Profile;
    } catch (error) {
      if (EncryptionConfig.logEncryption) {
        console.error("Failed to decrypt profile record:", {
          error,
          hasData: !!encryptedRecord[FIELD_DATA],
          hasVector: !!encryptedRecord[FIELD_VECTOR],
          recordKeys: Object.keys(encryptedRecord),
        });
      }
      throw new Error(
        `Profile decryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Encrypt a rule before storing with dynamic field names
   * In debug mode: uses descriptive names and plain text
   * In production: uses obfuscated names and encryption
   */
  async encryptRule(rule: LinkRule): Promise<EncryptedRuleRecord> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    // Encrypt the entire rule data
    const { encrypted, iv } = await this.encryptionService.encrypt(
      JSON.stringify(rule),
      this.masterPasswordHash
    );

    // Create encrypted key for lookup
    const encryptedKey = await this.encryptionService.encryptId(
      rule.id,
      this.masterPasswordHash
    );

    // Encrypt profile IDs for indexing
    const encryptedProfileIds = await Promise.all(
      rule.profileIds.map((pid) =>
        this.encryptionService.encryptId(pid, this.masterPasswordHash!)
      )
    );

    // Create record with dynamic field names
    const record: EncryptedRuleRecord = {
      [FIELD_KEY]: encryptedKey,
      [FIELD_DATA]: encrypted,
      [FIELD_VECTOR]: iv,
      [FIELD_PROFILES]: encryptedProfileIds,
      [FIELD_TYPE]: "rule",
    };

    return record;
  }

  /**
   * Decrypt a rule after retrieving
   */
  async decryptRule(encryptedRecord: EncryptedRuleRecord): Promise<LinkRule> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    try {
      const decrypted = await this.encryptionService.decrypt(
        encryptedRecord[FIELD_DATA],
        encryptedRecord[FIELD_VECTOR],
        this.masterPasswordHash
      );

      return JSON.parse(decrypted) as LinkRule;
    } catch (error) {
      if (EncryptionConfig.logEncryption) {
        console.error("Failed to decrypt rule record:", {
          error,
          hasData: !!encryptedRecord[FIELD_DATA],
          hasVector: !!encryptedRecord[FIELD_VECTOR],
          recordKeys: Object.keys(encryptedRecord),
        });
      }
      throw new Error(
        `Rule decryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get profile by ID (handles encrypted key lookup)
   */
  async getProfileById(profileId: string): Promise<Profile | null> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const encryptedKey = await this.encryptionService.encryptId(
      profileId,
      this.masterPasswordHash
    );

    const record = await this.t1.get(encryptedKey);
    if (!record) return null;

    return await this.decryptProfile(record);
  }

  /**
   * Get rule by ID (handles encrypted key lookup)
   */
  async getRuleById(ruleId: string): Promise<LinkRule | null> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const encryptedKey = await this.encryptionService.encryptId(
      ruleId,
      this.masterPasswordHash
    );

    const record = await this.t2.get(encryptedKey);
    if (!record) return null;

    return await this.decryptRule(record);
  }

  /**
   * Get all profiles
   */
  async getAllProfiles(): Promise<Profile[]> {
    try {
      const records = await this.t1.toArray();

      if (EncryptionConfig.logEncryption) {
        console.log(
          `[DEBUG] Retrieved ${records.length} profile records from database`
        );
      }

      return await Promise.all(records.map((r) => this.decryptProfile(r)));
    } catch (error) {
      if (EncryptionConfig.logEncryption) {
        console.error("Error retrieving profiles:", error);
      }
      throw error;
    }
  }

  /**
   * Get all rules
   */
  async getAllRules(): Promise<LinkRule[]> {
    try {
      const records = await this.t2.toArray();

      if (EncryptionConfig.logEncryption) {
        console.log(
          `[DEBUG] Retrieved ${records.length} rule records from database`
        );
      }

      return await Promise.all(records.map((r) => this.decryptRule(r)));
    } catch (error) {
      if (EncryptionConfig.logEncryption) {
        console.error("Error retrieving rules:", error);
      }
      throw error;
    }
  }

  /**
   * Get rules by profile ID
   */
  async getRulesByProfileId(profileId: string): Promise<LinkRule[]> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const encryptedProfileId = await this.encryptionService.encryptId(
      profileId,
      this.masterPasswordHash
    );

    const records = await this.t2
      .where(FIELD_PROFILES)
      .equals(encryptedProfileId)
      .toArray();

    return await Promise.all(records.map((r) => this.decryptRule(r)));
  }

  /**
   * Delete profile by ID
   */
  async deleteProfile(profileId: string): Promise<void> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const encryptedKey = await this.encryptionService.encryptId(
      profileId,
      this.masterPasswordHash
    );

    await this.t1.delete(encryptedKey);
  }

  /**
   * Delete rule by ID
   */
  async deleteRule(ruleId: string): Promise<void> {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }

    const encryptedKey = await this.encryptionService.encryptId(
      ruleId,
      this.masterPasswordHash
    );

    await this.t2.delete(encryptedKey);
  }
}

// Create and export the database instance
export const db = new LinkLockDatabase();
