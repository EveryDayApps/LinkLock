// ============================================
// Storage Service
// Handles encrypted local storage for extension data
// ============================================
import type { StorageData } from "../models/interfaces";
import { EncryptionService } from "./encryption";

export class StorageService {
  private encryptionService: EncryptionService;
  private storageKey = "linklock_data_v1";

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * Save encrypted data to browser local storage
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

    const storageData = { [key]: { encrypted, iv } };

    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.set(storageData);
    } else {
      localStorage.setItem(key, JSON.stringify({ encrypted, iv }));
    }
  }

  /**
   * Load and decrypt data from browser local storage
   */
  async load<T>(key: string, masterPasswordHash: string): Promise<T | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let stored: any;

      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(key);
        stored = result[key];
      } else {
        const item = localStorage.getItem(key);
        stored = item ? JSON.parse(item) : null;
      }

      if (!stored || !stored.encrypted || !stored.iv) {
        return null;
      }

      const { encrypted, iv } = stored;
      const decrypted = await this.encryptionService.decrypt(
        encrypted,
        iv,
        masterPasswordHash
      );

      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error("Failed to load data:", error);
      return null;
    }
  }

  /**
   * Save all storage data (profiles, rules, etc.)
   */
  async saveStorageData(
    data: StorageData,
    masterPasswordHash: string
  ): Promise<void> {
    await this.save(this.storageKey, data, masterPasswordHash);
  }

  /**
   * Load all storage data
   */
  async loadStorageData(
    masterPasswordHash: string
  ): Promise<StorageData | null> {
    return await this.load<StorageData>(this.storageKey, masterPasswordHash);
  }

  /**
   * Delete data by key
   */
  async delete(key: string): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.clear();
    } else {
      localStorage.clear();
    }
  }

  /**
   * Check if data exists
   */
  async exists(key: string): Promise<boolean> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      const result = await chrome.storage.local.get(key);
      return !!result[key];
    } else {
      return localStorage.getItem(key) !== null;
    }
  }
}
