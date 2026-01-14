// ============================================
// Profile Manager
// Handles all profile-related operations using Dexie.js with encryption
// ============================================
import type { Profile, ProfileWithRuleCount } from "../models/interfaces";
import { db } from "./db";

export class ProfileManager {
  private activeProfileId: string | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {}

  /**
   * Initialize - load active profile and set master password
   * Uses a promise-based lock to prevent duplicate initialization
   */
  async initialize(masterPasswordHash: string): Promise<void> {
    // If already initialized, just set the password and return
    if (this.isInitialized) {
      db.setMasterPassword(masterPasswordHash);
      return;
    }

    // If initialization is in progress, wait for it to complete
    if (this.initPromise) {
      await this.initPromise;
      db.setMasterPassword(masterPasswordHash);
      return;
    }

    // Start initialization
    this.initPromise = this.doInitialize(masterPasswordHash);
    await this.initPromise;
  }

  /**
   * Perform the actual initialization logic
   */
  private async doInitialize(masterPasswordHash: string): Promise<void> {
    db.setMasterPassword(masterPasswordHash);

    try {
      const encryptedProfiles = await db.profiles.toArray();

      if (encryptedProfiles.length === 0) {
        await this.createDefaultProfile();
      } else {
        // Decrypt profiles to find active one
        const profiles = await Promise.all(
          encryptedProfiles.map((ep) => db.decryptProfile(ep))
        );
        const activeProfile = profiles.find((p) => p.isActive);
        this.activeProfileId = activeProfile?.id || null;
      }
    } catch (error) {
      // If decryption fails, it means old unencrypted data exists
      console.error("Failed to decrypt profiles, clearing database:", error);
      await db.clearAll();
      await this.createDefaultProfile();
    } finally {
      this.isInitialized = true;
    }
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
    await db.profiles.add(encrypted);
    this.activeProfileId = profile.id;
  }

  /**
   * Get active profile
   */
  async getActiveProfile(): Promise<Profile | null> {
    if (!this.activeProfileId) {
      console.log("[ProfileManager] No active profile ID set");
      return null;
    }
    console.log(
      "[ProfileManager] Getting active profile:",
      this.activeProfileId
    );
    const encrypted = await db.profiles.get(this.activeProfileId);
    if (!encrypted) {
      console.log("[ProfileManager] Encrypted profile not found");
      return null;
    }
    console.log("[ProfileManager] Decrypting profile...");
    const decrypted = await db.decryptProfile(encrypted);
    console.log("[ProfileManager] Profile decrypted successfully");
    return decrypted;
  }

  /**
   * Get all profiles
   */
  async getAllProfiles(): Promise<Profile[]> {
    const encryptedProfiles = await db.profiles.toArray();
    return await Promise.all(
      encryptedProfiles.map((ep) => db.decryptProfile(ep))
    );
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
    const encrypted = await db.profiles.get(profileId);
    if (!encrypted) return null;
    return await db.decryptProfile(encrypted);
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
    await db.profiles.add(encrypted);

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
    await db.profiles.put(encrypted);

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
        await db.profiles.put(encrypted);
      }
    }

    // Activate new profile
    profile.isActive = true;
    const encrypted = await db.encryptProfile(profile);
    await db.profiles.put(encrypted);
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

    const count = await db.profiles.count();
    if (count <= 1) {
      return { success: false, error: "Cannot delete the only profile" };
    }

    const profile = await this.getProfile(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    await db.profiles.delete(profileId);

    return { success: true };
  }
}
