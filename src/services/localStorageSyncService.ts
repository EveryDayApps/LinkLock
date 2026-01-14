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
   */
  convertToLocalStorageRule(rule: LinkRule): LocalStorageRule {
    const localRule: LocalStorageRule = {
      id: rule.id,
      urlPattern: rule.urlPattern,
      action: rule.action,
      applyToAllSubdomains: rule.applyToAllSubdomains,
      enabled: rule.enabled,
    };

    // Only include lockOptions if action is "lock"
    if (rule.action === "lock" && rule.lockOptions) {
      localRule.lockOptions = {
        lockMode: rule.lockOptions.lockMode,
      };
      // Only include timedDuration if lockMode is timed_unlock
      if (
        rule.lockOptions.lockMode === "timed_unlock" &&
        rule.lockOptions.timedDuration !== undefined
      ) {
        localRule.lockOptions.timedDuration = rule.lockOptions.timedDuration;
      }
      // Include customPasswordHash if present (never store plain password)
      if (rule.lockOptions.customPasswordHash) {
        localRule.lockOptions.customPasswordHash =
          rule.lockOptions.customPasswordHash;
      }
    }

    // Only include redirectUrl if action is "redirect"
    if (rule.action === "redirect" && rule.redirectOptions?.redirectUrl) {
      localRule.redirectUrl = rule.redirectOptions.redirectUrl;
    }

    return localRule;
  }

  /**
   * Convert multiple LinkRules to LocalStorageRules
   * Only includes enabled rules for the specified profile
   */
  convertRulesToLocalStorage(
    rules: LinkRule[],
    profileId: string
  ): LocalStorageRule[] {
    return rules
      .filter((rule) => rule.profileIds.includes(profileId) && rule.enabled)
      .map((rule) => this.convertToLocalStorageRule(rule));
  }

  // ============================================
  // Storage Operations
  // ============================================

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

    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.set({ [key]: storageValue });
    } else {
      localStorage.setItem(key, JSON.stringify(storageValue));
    }
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

      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(key);
        stored = (result[key] as StoredData | undefined) ?? null;
      } else {
        const item = localStorage.getItem(key);
        stored = item ? (JSON.parse(item) as StoredData) : null;
      }

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
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.remove([
        STORAGE_KEYS.CORE,
        STORAGE_KEYS.RULES,
      ]);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CORE);
      localStorage.removeItem(STORAGE_KEYS.RULES);
    }
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
    const localRules = this.convertRulesToLocalStorage(rules, currentProfileId);

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
    if (typeof chrome !== "undefined" && chrome.storage) {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CORE);
      return !!result[STORAGE_KEYS.CORE];
    } else {
      return localStorage.getItem(STORAGE_KEYS.CORE) !== null;
    }
  }
}
