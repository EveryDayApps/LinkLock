// ============================================
// Storage Service
// ============================================

import { EncryptionService } from "./EncryptionService";
import { browserAPI } from "../browser";

export class StorageService {
  constructor(private encryptionService: EncryptionService) {}

  /**
   * Save encrypted data to browser storage
   */
  async save<T>(
    key: string,
    data: T,
    masterPasswordHash: string
  ): Promise<void> {
    const json = JSON.stringify(data);
    const { encrypted, iv } = await this.encryptionService.encrypt(
      json,
      masterPasswordHash
    );

    await browserAPI.storage.set(key, { encrypted, iv });
  }

  /**
   * Load and decrypt data from browser storage
   */
  async load<T>(key: string, masterPasswordHash: string): Promise<T | null> {
    const stored = await browserAPI.storage.get<{ encrypted: string; iv: string }>(key);

    if (!stored) {
      return null;
    }

    try {
      const { encrypted, iv } = stored;
      const decrypted = await this.encryptionService.decrypt(
        encrypted,
        iv,
        masterPasswordHash
      );

      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data from browser storage
   */
  async delete(key: string): Promise<void> {
    await browserAPI.storage.remove(key);
  }

  /**
   * Clear all data from browser storage
   */
  async clear(): Promise<void> {
    await browserAPI.storage.clear();
  }

  /**
   * Save data without encryption (for non-sensitive data)
   */
  async saveUnencrypted<T>(key: string, data: T): Promise<void> {
    await browserAPI.storage.set(key, data);
  }

  /**
   * Load data without decryption
   */
  async loadUnencrypted<T>(key: string): Promise<T | null> {
    const stored = await browserAPI.storage.get<T>(key);
    return stored;
  }
}
