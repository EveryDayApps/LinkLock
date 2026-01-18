// ============================================
// Authentication Manager
// Handles master password setup and verification
// ============================================

import type { MasterPasswordData } from "@/models/types";
import type { LinkLockDatabase } from "./database/db";
import { EncryptionService } from "./encryption";
import { PasswordService } from "./passwordService";

export class AuthManager {
  private db: LinkLockDatabase;
  private passwordService: PasswordService;
  private encryptionService: EncryptionService;

  constructor(
    db: LinkLockDatabase,
    passwordService?: PasswordService,
    encryptionService?: EncryptionService,
  ) {
    this.db = db;
    this.passwordService = passwordService || new PasswordService();
    this.encryptionService = encryptionService || new EncryptionService();
  }

  /**
   * Check if master password is already set
   */
  async hasMasterPassword(): Promise<boolean> {
    const masterData = await this.db.getMasterPasswordData();
    return masterData !== undefined;
  }

  /**
   * Set up master password for the first time
   */
  async setupMasterPassword(password: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Check if password already exists
      const exists = await this.hasMasterPassword();
      if (exists) {
        return {
          success: false,
          error: "Master password is already set",
        };
      }

      // Generate user ID
      const userId = this.passwordService.generateUserId();

      // Hash the password with a unique salt
      const { hash: passwordHash, salt } =
        await this.passwordService.hashPassword(password);

      // Encrypt the password hash using itself as the key (for verification)
      const { encrypted: encryptedPasswordHash, iv } =
        await this.encryptionService.encrypt(passwordHash, passwordHash);

      // Store in database
      const masterData: MasterPasswordData = {
        id: "master",
        userId,
        encryptedPasswordHash,
        salt,
        iv,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.db.setMasterPasswordData(masterData);

      // Set the password hash in the db instance for encryption operations
      this.db.setMasterPassword(passwordHash);

      return {
        success: true,
        userId,
      };
    } catch (error) {
      console.error("Failed to setup master password:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to setup master password",
      };
    }
  }

  /**
   * Verify the master password
   */
  async verifyMasterPassword(password: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Get stored master password data
      const masterData = await this.db.getMasterPasswordData();
      if (!masterData) {
        return {
          success: false,
          error: "Master password is not set",
        };
      }

      // Hash the input password with the stored salt
      const { hash: passwordHash } = await this.passwordService.hashPassword(
        password,
        masterData.salt,
      );

      // Try to decrypt the stored hash using the computed hash
      try {
        const decryptedHash = await this.encryptionService.decrypt(
          masterData.encryptedPasswordHash,
          masterData.iv,
          passwordHash,
        );

        // If decryption succeeds and matches, password is correct
        if (decryptedHash === passwordHash) {
          // Set the password hash in the db instance for encryption operations
          this.db.setMasterPassword(passwordHash);

          return {
            success: true,
            userId: masterData.userId,
          };
        }
      } catch {
        // Decryption failed, wrong password
        return {
          success: false,
          error: "Incorrect password",
        };
      }

      return {
        success: false,
        error: "Incorrect password",
      };
    } catch (error) {
      console.error("Failed to verify master password:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to verify password",
      };
    }
  }

  /**
   * Change the master password
   */
  async changeMasterPassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verify old password first
      const verifyResult = await this.verifyMasterPassword(oldPassword);
      if (!verifyResult.success) {
        return {
          success: false,
          error: "Current password is incorrect",
        };
      }

      // Get existing master data
      const masterData = await this.db.getMasterPasswordData();
      if (!masterData) {
        return {
          success: false,
          error: "Master password data not found",
        };
      }

      // Hash the new password with a new salt
      const { hash: newPasswordHash, salt: newSalt } =
        await this.passwordService.hashPassword(newPassword);

      // Encrypt the new password hash
      const { encrypted: encryptedPasswordHash, iv } =
        await this.encryptionService.encrypt(newPasswordHash, newPasswordHash);

      // Update in database
      const updatedData: MasterPasswordData = {
        ...masterData,
        encryptedPasswordHash,
        salt: newSalt,
        iv,
        updatedAt: Date.now(),
      };

      await this.db.setMasterPasswordData(updatedData);

      // Update the password hash in the db instance
      this.db.setMasterPassword(newPasswordHash);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Failed to change master password:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to change password",
      };
    }
  }

  /**
   * Get the user ID
   */
  async getUserId(): Promise<string | null> {
    const masterData = await this.db.getMasterPasswordData();
    return masterData?.userId || null;
  }
}
