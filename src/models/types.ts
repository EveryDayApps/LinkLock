// ============================================
// Types Definition File
// Central repository for all TypeScript types used across the application
// ============================================

import type { LinkLockLocalDb } from "@/services/database/local_lb";
import type { AuthManager } from "../services/authManager";
import type { LinkLockDatabase } from "../services/database/db";
import type { EncryptionService } from "../services/encryption";
import type { PasswordService } from "../services/passwordService";
import type { ProfileManager } from "../services/profileManager";
import type { RuleManager } from "../services/ruleManager";
import type { LinkRule, Profile } from "./interfaces";

// ============================================
// Database Types
// ============================================

/**
 * Encrypted profile stored in IndexedDB
 */
export interface EncryptedProfile {
  id: string;
  encryptedData: string;
  iv: string;
}

/**
 * Encrypted rule stored in IndexedDB
 */
export interface EncryptedRule {
  id: string;
  encryptedData: string;
  iv: string;
  profileIds: string[]; // Keep for indexing
}

/**
 * Type for rule storage with optional encryption (for debugging)
 */
export interface StoredRule {
  id: string;
  data: string; // JSON stringified rule data
  profileIds: string[]; // Keep for indexing
  encrypted: boolean; // Flag to indicate if data is encrypted
  iv?: string; // Only present if encrypted
}

/**
 * Master password data stored in IndexedDB
 */
export interface MasterPasswordData {
  id: string; // Always "master" for singleton
  userId: string;
  encryptedPasswordHash: string;
  salt: string;
  iv: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Database change event types
 */
export type ChangeType = "create" | "update" | "delete";

/**
 * Database change event structure
 */
export interface DBChangeEvent<T> {
  type: ChangeType;
  table: string;
  key: string;
  newValue?: T;
  oldValue?: T;
}

/**
 * Callback for database change events
 */
export type DBChangeCallback<T> = (event: DBChangeEvent<T>) => void;

// ============================================
// Unlock Session Types
// ============================================

/**
 * Active unlock session for a domain and profile
 */
export interface UnlockSession {
  domain: string;
  profileId: string;
  unlockedAt: number;
  expiresAt: number | null; // null = session unlock
}

/**
 * Snooze state for temporarily skipping unlock prompts
 */
export interface SnoozeState {
  domain: string;
  profileId: string;
  snoozedUntil: number;
}

// ============================================
// Rule Evaluation Types
// ============================================

/**
 * Result of evaluating a URL against rules
 */
export type EvaluationResult =
  | { action: "allow" }
  | { action: "block"; rule: LinkRule }
  | { action: "redirect"; target: string; rule: LinkRule }
  | { action: "require_unlock"; rule: LinkRule; domain: string };

// ============================================
// Export/Import Types
// ============================================

/**
 * Options for what to include in export
 */
export interface ExportOptions {
  includeProfiles: boolean;
  includeRules: boolean;
}

/**
 * Options for what to import
 */
export interface ImportOptions {
  importProfiles: boolean;
  importRules: boolean;
  mergeStrategy: "replace" | "merge";
}

/**
 * Metadata visible without decryption
 * Safe for display in UI before password entry
 */
export interface ExportMetadata {
  profileCount: number;
  ruleCount: number;
  includesProfiles: boolean;
  includesRules: boolean;
}

/**
 * Encryption parameters stored in export
 */
export interface ExportEncryption {
  algorithm: "AES-GCM";
  keyDerivation: "PBKDF2";
  iterations: number;
  hash: "SHA-256";
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
}

/**
 * The complete export file format
 */
export interface ExportFile {
  formatVersion: string;
  appVersion: string;
  exportedAt: string;
  exportId: string;
  metadata: ExportMetadata;
  encryption: ExportEncryption;
  payload: string; // Base64 encoded encrypted data
  checksum: string; // SHA-256 hash of decrypted payload for integrity
}

/**
 * Decrypted payload structure
 */
export interface ExportPayload {
  profiles?: Profile[];
  rules?: LinkRule[];
}

/**
 * Result of parsing/validating an export file
 */
export interface ParseResult {
  valid: boolean;
  error?: string;
  metadata?: ExportMetadata;
  formatVersion?: string;
  exportedAt?: string;
  needsMigration?: boolean;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  error?: string;
  imported?: {
    profiles: number;
    rules: number;
  };
}

// ============================================
// Message Handler Types
// ============================================

/**
 * Dependencies required by the message handler
 */
export interface MessageHandler {
  profileManager: ProfileManager;
  ruleManager: RuleManager;
  db: LinkLockDatabase;
}

// ============================================
// Service Types
// ============================================

/**
 * All services available in the application
 */
export interface Services {
  // Core services
  authManager: AuthManager;
  passwordService: PasswordService;
  encryptionService: EncryptionService;

  // Data services
  profileManager: ProfileManager;
  ruleManager: RuleManager;

  // Database
  db: LinkLockDatabase;
  localDb: LinkLockLocalDb;
}

/**
 * Service initialization options
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ServiceOptions {
  // Add any initialization options here
  // For example: environment, debug mode, etc.
}

// ============================================
// UI Types
// ============================================

/**
 * Available screen types in the application
 */
export type ScreenType =
  | "profiles"
  | "rules"
  | "import-export"
  | "settings"
  | "about";
