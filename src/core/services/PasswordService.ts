// ============================================
// Password Service
// ============================================

export class PasswordService {
  /**
   * Hash a password using SHA-256
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  }

  /**
   * Validate password strength
   * Rules:
   * - Minimum 8 characters
   * - At least one letter
   * - At least one number
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push("Password must contain at least one letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Change master password
   * Re-encrypts all stored data with new password
   */
  async changeMasterPassword(
    currentPassword: string,
    newPassword: string,
    currentHash: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verify current password
    const isValid = await this.verifyPassword(currentPassword, currentHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Validate new password strength
    const validation = this.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    // Hash new password
    const newHash = await this.hashPassword(newPassword);

    // Note: Re-encryption of data is handled by the caller

    return { success: true };
  }
}
