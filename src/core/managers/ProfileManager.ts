// ============================================
// Profile Manager
// ============================================

import type { Profile } from "../types/domain";
import type { StorageService } from "../services/StorageService";
import type { PasswordService } from "../services/PasswordService";
import type { UnlockSessionManager } from "./UnlockSessionManager";

export class ProfileManager {
  private profiles: Map<string, Profile> = new Map();
  private activeProfileId: string | null = null;
  private storageService: StorageService | null = null;
  private masterPasswordHash: string | null = null;

  /**
   * Initialize with storage service
   */
  initialize(storageService: StorageService, masterPasswordHash: string): void {
    this.storageService = storageService;
    this.masterPasswordHash = masterPasswordHash;
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
   * Get active profile ID
   */
  getActiveProfileId(): string | null {
    return this.activeProfileId;
  }

  /**
   * Switch to a different profile
   * Requires master password verification
   */
  async switchProfile(
    profileId: string,
    masterPassword: string,
    masterPasswordHash: string,
    passwordService: PasswordService,
    sessionManager: UnlockSessionManager
  ): Promise<{ success: boolean; error?: string }> {
    // Verify master password
    const isValid = await passwordService.verifyPassword(
      masterPassword,
      masterPasswordHash
    );

    if (!isValid) {
      return { success: false, error: "Incorrect master password" };
    }

    // Check if profile exists
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Clear all unlock sessions when switching
    await sessionManager.clearAllSessions();

    // Update active profile
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
   * Create a new profile
   */
  async createProfile(
    name: string
  ): Promise<{ success: boolean; profileId?: string; error?: string }> {
    // Validate name
    if (!name.trim()) {
      return { success: false, error: "Profile name cannot be empty" };
    }

    // Check for duplicate name
    const existingProfile = Array.from(this.profiles.values()).find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    if (existingProfile) {
      return { success: false, error: "Profile name already exists" };
    }

    // Create profile
    const profileId = crypto.randomUUID();
    const profile: Profile = {
      id: profileId,
      name,
      isActive: this.profiles.size === 0, // First profile is active by default
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.profiles.set(profileId, profile);

    if (profile.isActive) {
      this.activeProfileId = profileId;
    }

    await this.saveToStorage();

    return { success: true, profileId };
  }

  /**
   * Delete a profile
   */
  async deleteProfile(
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Cannot delete active profile
    if (profileId === this.activeProfileId) {
      return { success: false, error: "Cannot delete active profile" };
    }

    // Cannot delete if it's the only profile
    if (this.profiles.size <= 1) {
      return { success: false, error: "Cannot delete the only profile" };
    }

    this.profiles.delete(profileId);
    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Rename a profile
   */
  async renameProfile(
    profileId: string,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!newName.trim()) {
      return { success: false, error: "Profile name cannot be empty" };
    }

    // Check for duplicate name
    const existingProfile = Array.from(this.profiles.values()).find(
      (p) =>
        p.id !== profileId && p.name.toLowerCase() === newName.toLowerCase()
    );

    if (existingProfile) {
      return { success: false, error: "Profile name already exists" };
    }

    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    profile.name = newName;
    profile.updatedAt = Date.now();

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId: string): Profile | null {
    return this.profiles.get(profileId) || null;
  }

  /**
   * Load from storage
   */
  async loadFromStorage(): Promise<void> {
    if (!this.storageService || !this.masterPasswordHash) return;

    const profiles = await this.storageService.load<Profile[]>(
      "profiles",
      this.masterPasswordHash
    );

    if (profiles) {
      profiles.forEach((profile) => {
        this.profiles.set(profile.id, profile);
        if (profile.isActive) {
          this.activeProfileId = profile.id;
        }
      });
    }

    // If no profiles exist, create a default one
    if (this.profiles.size === 0) {
      await this.createProfile("Default");
    }
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.storageService || !this.masterPasswordHash) return;

    const profilesArray = Array.from(this.profiles.values());
    await this.storageService.save(
      "profiles",
      profilesArray,
      this.masterPasswordHash
    );
  }
}
