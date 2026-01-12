// ============================================
// Profile Manager
// Handles all profile-related operations using Dexie.js with encryption
// ============================================
import type { Profile, ProfileWithRuleCount } from "../models/interfaces";
import { EncryptionConfig } from "./config";
import { db } from "./db";

export class ProfileManager {
  private activeProfileId: string | null = null;

  constructor() {}

  /**
   * Initialize - load active profile and set master password
   */
  async initialize(masterPasswordHash: string): Promise<void> {
    db.setMasterPassword(masterPasswordHash);

    try {
      const profiles = await db.getAllProfiles();

      if (profiles.length === 0) {
        await this.createDefaultProfile();
      } else {
        const activeProfile = profiles.find((p) => p.isActive);
        this.activeProfileId = activeProfile?.id || null;
      }
    } catch (error) {
      if (EncryptionConfig.logEncryption) {
        console.error("Failed to load profiles:", error);
      }

      // Determine if we should clear the database
      const shouldClear = await this.shouldClearDatabase(error);

      if (shouldClear) {
        if (EncryptionConfig.logEncryption) {
          console.warn("Clearing database due to incompatible data format");
        }
        await db.clearAll();
        await this.createDefaultProfile();
      } else {
        // Re-throw the error for the caller to handle
        throw new Error(
          `Profile initialization failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }

  /**
   * Determine if database should be cleared based on error type
   */
  private async shouldClearDatabase(error: unknown): Promise<boolean> {
    // Only clear if it's a decryption error from schema migration
    // Don't clear for other errors (network, permissions, etc.)
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Clear for known migration/encryption issues
      if (
        errorMessage.includes("decrypt") ||
        errorMessage.includes("master password") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("malformed")
      ) {
        // Try to check if there's any data in the database
        try {
          const count = await db.t1.count();
          // Only clear if there's actually data that's corrupted
          return count > 0;
        } catch {
          // If we can't even count, it's likely corrupted
          return true;
        }
      }
    }

    // For other errors, don't clear - let the error propagate
    return false;
  }

  /**
   * Create default profile on first run
   */
  private async createDefaultProfile(): Promise<void> {
    const profile: Profile = {
      id: crypto.randomUUID(),
      name: "Default",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const encrypted = await db.encryptProfile(profile);
    await db.t1.add(encrypted);
    this.activeProfileId = profile.id;
  }

  /**
   * Get active profile
   */
  async getActiveProfile(): Promise<Profile | null> {
    if (!this.activeProfileId) {
      return null;
    }
    return await db.getProfileById(this.activeProfileId);
  }

  /**
   * Get all profiles
   */
  async getAllProfiles(): Promise<Profile[]> {
    return await db.getAllProfiles();
  }

  /**
   * Get all profiles with rule counts
   */
  async getAllProfilesWithCounts(
    ruleCountMap: Map<string, number>
  ): Promise<ProfileWithRuleCount[]> {
    const profiles = await this.getAllProfiles();
    return profiles.map((profile) => ({
      ...profile,
      ruleCount: ruleCountMap.get(profile.id) || 0,
    }));
  }

  /**
   * Get profile by ID
   */
  async getProfile(profileId: string): Promise<Profile | null> {
    return await db.getProfileById(profileId);
  }

  /**
   * Create a new profile
   */
  async createProfile(
    name: string,
    _copyRulesFromProfileId?: string
  ): Promise<{ success: boolean; profileId?: string; error?: string }> {
    if (!name.trim()) {
      return { success: false, error: "Profile name cannot be empty" };
    }

    // Decrypt all profiles to check for duplicates
    const allProfiles = await this.getAllProfiles();
    const existingProfile = allProfiles.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    if (existingProfile) {
      return { success: false, error: "Profile name already exists" };
    }

    const profileId = crypto.randomUUID();
    const profile: Profile = {
      id: profileId,
      name,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const encrypted = await db.encryptProfile(profile);
    await db.t1.add(encrypted);

    return { success: true, profileId };
  }

  /**
   * Update profile name
   */
  async updateProfile(
    profileId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!name.trim()) {
      return { success: false, error: "Profile name cannot be empty" };
    }

    // Decrypt all profiles to check for duplicates
    const allProfiles = await this.getAllProfiles();
    const existingProfile = allProfiles.find(
      (p) => p.id !== profileId && p.name.toLowerCase() === name.toLowerCase()
    );

    if (existingProfile) {
      return { success: false, error: "Profile name already exists" };
    }

    const profile = await this.getProfile(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Update profile data
    profile.name = name;
    profile.updatedAt = Date.now();

    // Re-encrypt and save
    const encrypted = await db.encryptProfile(profile);
    await db.t1.put(encrypted);

    return { success: true };
  }

  /**
   * Switch to a different profile
   */
  async switchProfile(
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Deactivate current profile
    if (this.activeProfileId) {
      const currentProfile = await this.getProfile(this.activeProfileId);
      if (currentProfile) {
        currentProfile.isActive = false;
        const encrypted = await db.encryptProfile(currentProfile);
        await db.t1.put(encrypted);
      }
    }

    // Activate new profile
    profile.isActive = true;
    const encrypted = await db.encryptProfile(profile);
    await db.t1.put(encrypted);
    this.activeProfileId = profileId;

    return { success: true };
  }

  /**
   * Delete a profile
   */
  async deleteProfile(
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (profileId === this.activeProfileId) {
      return {
        success: false,
        error: "Cannot delete active profile. Switch to another profile first.",
      };
    }

    const count = await db.t1.count();
    if (count <= 1) {
      return { success: false, error: "Cannot delete the only profile" };
    }

    const profile = await db.getProfileById(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    await db.deleteProfile(profileId);

    return { success: true };
  }
}
