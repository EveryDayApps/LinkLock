/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================
// Abstract Base Database Class
// Provides a contract for encrypted database implementations
// ============================================

import type { EncryptionService } from "../encryption";

/**
 * Abstract base class defining the contract for database operations
 * Provides common functionality for master password and encryption management
 *
 * @template TProfile - Profile entity type (decrypted)
 * @template TEncryptedProfile - Encrypted profile entity type
 * @template TRule - Rule entity type (decrypted)
 * @template TStoredRule - Stored rule entity type
 * @template TMasterPassword - Master password data type
 */
export abstract class BaseEncryptedDatabase<
  TProfile,
  TEncryptedProfile,
  TRule,
  TStoredRule,
  TMasterPassword,
> {
  protected abstract encryptionService: EncryptionService;
  protected masterPasswordHash: string | null = null;

  // ============================================
  // Abstract Methods - Must be implemented by subclasses
  // ============================================

  /**
   * Initialize the database connection and load initial data
   */
  abstract initialize(): Promise<void>;

  /**
   * Clear all data from the database
   */
  abstract clearAll(): Promise<void>;

  /**
   * Get master password data from storage
   */
  abstract getMasterPasswordData(): Promise<TMasterPassword | undefined>;

  /**
   * Set/Update master password data in storage
   */
  abstract setMasterPasswordData(data: TMasterPassword): Promise<void>;

  /**
   * Encrypt a profile before storing
   * @param profile - The decrypted profile to encrypt
   */
  abstract encryptProfile(profile: TProfile): Promise<TEncryptedProfile>;

  /**
   * Decrypt a profile after retrieving
   * @param encryptedProfile - The encrypted profile to decrypt
   */
  abstract decryptProfile(
    encryptedProfile: TEncryptedProfile,
  ): Promise<TProfile>;

  /**
   * Store a rule with optional encryption
   * @param rule - The rule to store
   * @param encrypt - Whether to encrypt the rule
   */
  abstract storeRule(rule: TRule, encrypt?: boolean): Promise<TStoredRule>;

  /**
   * Retrieve and decrypt/parse a rule
   * @param storedRule - The stored rule to retrieve
   */
  abstract retrieveRule(storedRule: TStoredRule): Promise<TRule>;

  // ============================================
  // Concrete Methods - Shared implementations
  // ============================================

  /**
   * Set the master password hash for encryption/decryption
   * @param hash - The hashed master password
   */
  setMasterPassword(hash: string): void {
    this.masterPasswordHash = hash;
    this.onMasterPasswordSet(hash);
  }

  /**
   * Get the current master password hash
   * @returns The hash or null if not set
   */
  getMasterPasswordHash(): string | null {
    return this.masterPasswordHash;
  }

  /**
   * Check if master password is set
   * @returns True if master password hash exists
   */
  hasMasterPasswordSet(): boolean {
    return this.masterPasswordHash !== null;
  }

  /**
   * Validate that master password is set before encryption operations
   * @throws Error if master password is not set
   */
  protected validateMasterPassword(): void {
    if (!this.masterPasswordHash) {
      throw new Error("Master password not set");
    }
  }

  /**
   * Hook method called when master password is set
   * Can be overridden by subclasses for additional behavior
   * @param _hash - The new hash value
   */
  protected onMasterPasswordSet(_hash: string): void {
    // Default implementation does nothing
    // Subclasses can override to notify listeners, etc.
  }
}

/**
 * Interface for database change event subscriptions
 * Implement this interface to support database change listeners
 *
 * @template TCallback - The callback function type
 */
export interface ISubscribable<TCallback> {
  /**
   * Subscribe to changes
   * @param callback - Function called when changes occur
   * @returns Unsubscribe function
   */
  subscribe(callback: TCallback): () => void;
}

/**
 * Interface for databases that support change listeners
 *
 * @template TEncryptedProfile - Encrypted profile entity type
 * @template TStoredRule - Stored rule entity type
 * @template TMasterPassword - Master password data type
 * @template TChangeEvent - Database change event type
 */
export interface IObservableDatabase<
  TEncryptedProfile,
  TStoredRule,
  TMasterPassword,
  TChangeEvent,
> {
  /**
   * Subscribe to profile table changes
   */
  onProfileChange(callback: (event: TChangeEvent) => void): () => void;

  /**
   * Subscribe to rules table changes
   */
  onRuleChange(callback: (event: TChangeEvent) => void): () => void;

  /**
   * Subscribe to master password table changes
   */
  onMasterPasswordChange(callback: (event: TChangeEvent) => void): () => void;

  /**
   * Subscribe to in-memory master password hash changes
   */
  onMasterPasswordHashChange(
    callback: (hash: string | null) => void,
  ): () => void;
}

/**
 * Combined interface for a fully-featured encrypted database
 * with observable change events
 */
export interface IEncryptedObservableDatabase<
  TProfile,
  TEncryptedProfile,
  TRule,
  TStoredRule,
  TMasterPassword,
  TChangeEvent,
> extends IObservableDatabase<
  TEncryptedProfile,
  TStoredRule,
  TMasterPassword,
  TChangeEvent
> {
  // Lifecycle
  initialize(): Promise<void>;
  clearAll(): Promise<void>;

  // Master password
  getMasterPasswordData(): Promise<TMasterPassword | undefined>;
  setMasterPasswordData(data: TMasterPassword): Promise<void>;
  setMasterPassword(hash: string): void;
  getMasterPasswordHash(): string | null;
  hasMasterPasswordSet(): boolean;

  // Encryption operations
  encryptProfile(profile: TProfile): Promise<TEncryptedProfile>;
  decryptProfile(encryptedProfile: TEncryptedProfile): Promise<TProfile>;
  storeRule(rule: TRule, encrypt?: boolean): Promise<TStoredRule>;
  retrieveRule(storedRule: TStoredRule): Promise<TRule>;
}
