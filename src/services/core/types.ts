// ============================================
// Service Types and Interfaces
// Defines all service interfaces and dependencies
// ============================================

import type { AuthManager } from "../authManager";
import type { LinkLockDatabase } from "../db";
import type { EncryptionService } from "../encryption";
import type { PasswordService } from "../passwordService";
import type { ProfileManager } from "../profileManager";
import type { RuleEvaluator } from "../ruleEvaluator";
import type { RuleManager } from "../ruleManager";
import type { StorageService } from "../storage";
import type { UnlockSessionManager } from "../unlockSessionManager";

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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ServiceOptions {
  // Add any initialization options here
  // For example: environment, debug mode, etc.
}
