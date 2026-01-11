// ============================================
// Service Types and Interfaces
// Defines all service interfaces and dependencies
// ============================================

import type { AuthManager } from "../lib/authManager";
import type { PasswordService } from "../lib/passwordService";
import type { EncryptionService } from "../lib/encryption";
import type { ProfileManager } from "../lib/profileManager";
import type { RuleManager } from "../lib/ruleManager";
import type { RuleEvaluator } from "../lib/ruleEvaluator";
import type { UnlockSessionManager } from "../lib/unlockSessionManager";
import type { StorageService } from "../lib/storage";
import type { LinkLockDatabase } from "../lib/db";

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
  storageService: StorageService;

  // Business logic services
  ruleEvaluator: RuleEvaluator;
  unlockSessionManager: UnlockSessionManager;

  // Database
  db: LinkLockDatabase;
}

/**
 * Service initialization options
 */
export interface ServiceOptions {
  // Add any initialization options here
  // For example: environment, debug mode, etc.
}
