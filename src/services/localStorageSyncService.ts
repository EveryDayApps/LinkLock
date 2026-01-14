// ============================================
// Local Storage Sync Service
// Syncs essential data from IndexedDB to chrome.storage.local
// for fast access during extension runtime
// ============================================

import type {
  LinkRule,
  LocalStorageCore,
  LocalStorageData,
  LocalStorageRule,
} from "../models/interfaces";
import { toLocalStorageRule, toLocalStorageRules } from "../models/interfaces";
import { EncryptionService } from "./encryption";

// Storage keys for local storage
const STORAGE_KEYS = {
  CORE: "linklock_core",
  RULES: "linklock_rules",
} as const;

export class LocalStorageSyncService {
  private encryptionService: EncryptionService;

  constructor(encryptionService?: EncryptionService) {
    this.encryptionService = encryptionService || new EncryptionService();
  }

  // ============================================
  // Converter Functions
  // ============================================

  /**
   * Convert a full LinkRule to a minimal LocalStorageRule
   * Only keeps fields necessary for extension runtime
   * @deprecated Use toLocalStorageRule from interfaces.ts instead
   */
  convertToLocalStorageRule(rule: LinkRule): LocalStorageRule {
    return toLocalStorageRule(rule);
  }

  /**
   * Convert multiple LinkRules to LocalStorageRules
   * Only includes enabled rules for the specified profile
   * @deprecated Use toLocalStorageRules from interfaces.ts instead
   */
  convertRulesToLocalStorage(
    rules: LinkRule[],
    profileId: string
  ): LocalStorageRule[] {
    return toLocalStorageRules(rules, profileId);
  }

  // ============================================
  // Storage Operations
  // ============================================

  /**
   * Check if chrome.storage.local is available
   */
  private isChromeStorageAvailable(): boolean {
    return (
      typeof chrome !== "undefined" &&
      chrome.storage !== undefined &&
      chrome.storage.local !== undefined &&
      typeof chrome.storage.local.set === "function"
    );
  }

  /**
   * Save data to local storage with optional encryption
   */
  private async saveToLocalStorage<T>(
    key: string,
    data: T,
    encrypt: boolean,
    masterPasswordHash?: string
  ): Promise<void> {
    let storageValue: unknown;

    if (encrypt && masterPasswordHash) {
      const json = JSON.stringify(data);
      const { encrypted, iv } = await this.encryptionService.encrypt(
        json,
        masterPasswordHash
      );
      storageValue = { encrypted, iv, isEncrypted: true };
    } else {
      storageValue = { data, isEncrypted: false };
    }

    console.log(`[LocalStorage] Saving to key: ${key}`, storageValue);

    if (this.isChromeStorageAvailable()) {
      console.log("[LocalStorage] Using chrome.storage.local");
      await chrome.storage.local.set({ [key]: storageValue });
    } else {
      console.log("[LocalStorage] Using window.localStorage");
      localStorage.setItem(key, JSON.stringify(storageValue));
    }

    console.log(`[LocalStorage] Successfully saved ${key}`);
  }

  /**
   * Load data from local storage with optional decryption
   */
  private async loadFromLocalStorage<T>(
    key: string,
    masterPasswordHash?: string
  ): Promise<T | null> {
    try {
      interface StoredData {
        encrypted?: string;
        iv?: string;
        isEncrypted: boolean;
        data?: T;
      }

      let stored: StoredData | null = null;

      if (this.isChromeStorageAvailable()) {
        console.log(`[LocalStorage] Loading ${key} from chrome.storage.local`);
        const result = await chrome.storage.local.get(key);
        stored = (result[key] as StoredData | undefined) ?? null;
      } else {
        console.log(`[LocalStorage] Loading ${key} from window.localStorage`);
        const item = localStorage.getItem(key);
        stored = item ? (JSON.parse(item) as StoredData) : null;
      }

      console.log(`[LocalStorage] Loaded ${key}:`, stored);

      if (!stored) {
        return null;
      }

      if (stored.isEncrypted && masterPasswordHash) {
        if (!stored.encrypted || !stored.iv) {
          return null;
        }
        const decrypted = await this.encryptionService.decrypt(
          stored.encrypted,
          stored.iv,
          masterPasswordHash
        );
        return JSON.parse(decrypted) as T;
      } else {
        return (stored.data ?? null) as T | null;
      }
    } catch (error) {
      console.error(`Failed to load ${key} from local storage:`, error);
      return null;
    }
  }

  /**
   * Clear all LinkLock data from local storage
   */
  async clearLocalStorage(): Promise<void> {
    console.log("[LocalStorage] Clearing all LinkLock data");
    if (this.isChromeStorageAvailable()) {
      await chrome.storage.local.remove([
        STORAGE_KEYS.CORE,
        STORAGE_KEYS.RULES,
      ]);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CORE);
      localStorage.removeItem(STORAGE_KEYS.RULES);
    }
    console.log("[LocalStorage] Cleared all LinkLock data");
  }

  // ============================================
  // Sync Operations
  // ============================================

  /**
   * Sync core data (master password hash and current profile ID)
   * @param masterPasswordHash - The master password hash
   * @param currentProfileId - The current active profile ID
   * @param encrypt - Whether to encrypt the data in local storage
   */
  async syncCore(
    masterPasswordHash: string,
    currentProfileId: string,
    encrypt: boolean = false
  ): Promise<void> {
    const coreData: LocalStorageCore = {
      masterPasswordHash,
      currentProfileId,
    };

    await this.saveToLocalStorage(
      STORAGE_KEYS.CORE,
      coreData,
      encrypt,
      encrypt ? masterPasswordHash : undefined
    );
  }

  /**
   * Sync rules for the current profile from IndexedDB to local storage
   * @param rules - All rules from IndexedDB (already decrypted)
   * @param currentProfileId - The current active profile ID
   * @param encrypt - Whether to encrypt the data in local storage
   * @param masterPasswordHash - Required if encrypt is true
   */
  async syncRules(
    rules: LinkRule[],
    currentProfileId: string,
    encrypt: boolean = false,
    masterPasswordHash?: string
  ): Promise<void> {
    const localRules = toLocalStorageRules(rules, currentProfileId);

    await this.saveToLocalStorage(
      STORAGE_KEYS.RULES,
      localRules,
      encrypt,
      masterPasswordHash
    );
  }

  /**
   * Full sync - clears local storage and syncs all data from IndexedDB
   * Call this on browser startup, password change, profile change, or rule updates
   * @param masterPasswordHash - The master password hash
   * @param currentProfileId - The current active profile ID
   * @param rules - All rules from IndexedDB (already decrypted)
   * @param encrypt - Whether to encrypt the data in local storage
   */
  async fullSync(
    masterPasswordHash: string,
    currentProfileId: string,
    rules: LinkRule[],
    encrypt: boolean = false
  ): Promise<void> {
    // Clear existing data first
    await this.clearLocalStorage();

    // Sync core data
    await this.syncCore(masterPasswordHash, currentProfileId, encrypt);

    console.log("Local storage core synced");
    console.log(masterPasswordHash, currentProfileId, rules, encrypt);

    // Sync rules for current profile
    await this.syncRules(
      rules,
      currentProfileId,
      encrypt,
      encrypt ? masterPasswordHash : undefined
    );
  }

  // ============================================
  // Load Operations (for extension runtime)
  // ============================================

  /**
   * Load core data from local storage
   */
  async loadCore(
    masterPasswordHash?: string
  ): Promise<LocalStorageCore | null> {
    return this.loadFromLocalStorage<LocalStorageCore>(
      STORAGE_KEYS.CORE,
      masterPasswordHash
    );
  }

  /**
   * Load rules from local storage
   */
  async loadRules(
    masterPasswordHash?: string
  ): Promise<LocalStorageRule[] | null> {
    return this.loadFromLocalStorage<LocalStorageRule[]>(
      STORAGE_KEYS.RULES,
      masterPasswordHash
    );
  }

  /**
   * Load all data from local storage
   */
  async loadAll(masterPasswordHash?: string): Promise<LocalStorageData | null> {
    const core = await this.loadCore(masterPasswordHash);
    const rules = await this.loadRules(masterPasswordHash);

    if (!core) {
      return null;
    }

    return {
      core,
      rules: rules || [],
    };
  }

  /**
   * Check if local storage has been initialized with data
   */
  async hasData(): Promise<boolean> {
    if (this.isChromeStorageAvailable()) {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CORE);
      return !!result[STORAGE_KEYS.CORE];
    } else {
      return localStorage.getItem(STORAGE_KEYS.CORE) !== null;
    }
  }
}
