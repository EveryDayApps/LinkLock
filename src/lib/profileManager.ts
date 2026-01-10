// ============================================
// Profile Manager
// Handles all profile-related operations
// ============================================
import type { Profile, ProfileWithRuleCount } from "../models/types";
import { StorageService } from "./storage";

export class ProfileManager {
  private profiles: Map<string, Profile> = new Map();
  private activeProfileId: string | null = null;
  private storageService: StorageService;
  private masterPasswordHash: string = "";

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * Initialize with master password hash
   */
  async initialize(masterPasswordHash: string): Promise<void> {
    this.masterPasswordHash = masterPasswordHash;
    await this.loadFromStorage();

    if (this.profiles.size === 0) {
      await this.createDefaultProfile();
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

    this.profiles.set(profile.id, profile);
    this.activeProfileId = profile.id;
    await this.saveToStorage();
  }

  /**
   * Get active profile
   */
  getActiveProfile(): Profile | null {
    if (!this.activeProfileId) {
      return null;
    }
    return this.profiles.get(this.activeProfileId) || null;
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get all profiles with rule counts
   */
  getAllProfilesWithCounts(
    ruleCountMap: Map<string, number>
  ): ProfileWithRuleCount[] {
    return this.getAllProfiles().map((profile) => ({
      ...profile,
      ruleCount: ruleCountMap.get(profile.id) || 0,
    }));
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId: string): Profile | null {
    return this.profiles.get(profileId) || null;
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

    const existingProfile = Array.from(this.profiles.values()).find(
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

    this.profiles.set(profileId, profile);
    await this.saveToStorage();

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

    const existingProfile = Array.from(this.profiles.values()).find(
      (p) => p.id !== profileId && p.name.toLowerCase() === name.toLowerCase()
    );

    if (existingProfile) {
      return { success: false, error: "Profile name already exists" };
    }

    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    profile.name = name;
    profile.updatedAt = Date.now();

    await this.saveToStorage();
    return { success: true };
  }

  /**
   * Switch to a different profile
   */
  async switchProfile(
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    if (this.activeProfileId) {
      const currentProfile = this.profiles.get(this.activeProfileId);
      if (currentProfile) {
        currentProfile.isActive = false;
      }
    }

    profile.isActive = true;
    this.activeProfileId = profileId;

    await this.saveToStorage();
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

    if (this.profiles.size <= 1) {
      return { success: false, error: "Cannot delete the only profile" };
    }

    const deleted = this.profiles.delete(profileId);
    if (!deleted) {
      return { success: false, error: "Profile not found" };
    }

    await this.saveToStorage();
    return { success: true };
  }

  /**
   * Load profiles from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await this.storageService.loadStorageData(
        this.masterPasswordHash
      );

      if (data && data.profiles) {
        this.profiles.clear();
        data.profiles.forEach((profile) => {
          this.profiles.set(profile.id, profile);
          if (profile.isActive) {
            this.activeProfileId = profile.id;
          }
        });
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  }

  /**
   * Save profiles to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const existingData = await this.storageService.loadStorageData(
        this.masterPasswordHash
      );

      const data = {
        profiles: Array.from(this.profiles.values()),
        rules: existingData?.rules || [],
        securityConfig: existingData?.securityConfig,
      };

      await this.storageService.saveStorageData(data, this.masterPasswordHash);
    } catch (error) {
      console.error("Failed to save profiles:", error);
    }
  }
}
