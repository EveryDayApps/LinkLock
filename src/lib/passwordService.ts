// ============================================
// Password Service
// Handles password hashing and verification using PBKDF2
// ============================================

export class PasswordService {
  /**
   * Hash a password using PBKDF2 with SHA-256
   */
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Generate or use provided salt
    const saltValue = salt || this.generateSalt();
    const saltBuffer = encoder.encode(saltValue);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    // Convert to base64
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      hash: hashHex,
      salt: saltValue,
    };
  }

  /**
   * Verify a password against a stored hash
   */
  async verifyPassword(
    password: string,
    storedHash: string,
    salt: string
  ): Promise<boolean> {
    const { hash } = await this.hashPassword(password, salt);
    return hash === storedHash;
  }

  /**
   * Generate a random salt
   */
  private generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate a unique user ID
   */
  generateUserId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `user_${timestamp}_${randomPart}`;
  }
}
