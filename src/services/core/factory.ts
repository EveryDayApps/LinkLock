// ============================================
// Service Factory
// Creates and wires all service dependencies
// ============================================

import { AuthManager } from "../authManager";
import { LinkLockDatabase } from "../db";
import { EncryptionService } from "../encryption";
import { PasswordService } from "../passwordService";
import { ProfileManager } from "../profileManager";
import { RuleEvaluator } from "../ruleEvaluator";
import { RuleManager } from "../ruleManager";
import { StorageService } from "../storage";
import { UnlockSessionManager } from "../unlockSessionManager";
import type { ServiceOptions, Services } from "./types";

/**
 * Create all services with proper dependency injection
 * This is the single source of truth for service creation
 */
export function createServices(_options?: ServiceOptions): Services {
  // Step 1: Create database instance
  const db = new LinkLockDatabase();

  // Step 2: Create services with no dependencies
  const passwordService = new PasswordService();
  const encryptionService = new EncryptionService();

  // Step 3: Create services that depend on step 1 & 2
  const authManager = new AuthManager(db, passwordService, encryptionService);
  const storageService = new StorageService(encryptionService);

  // Step 4: Create session and state management services
  const unlockSessionManager = new UnlockSessionManager();

  // Step 5: Create business logic services
  const ruleEvaluator = new RuleEvaluator(unlockSessionManager);

  // Step 6: Create data management services
  const profileManager = new ProfileManager(db);
  const ruleManager = new RuleManager(db);

  // Return all services
  return {
    // Core services
    authManager,
    passwordService,
    encryptionService,

    // Data services
    profileManager,
    ruleManager,
    storageService,

    // Business logic services
    ruleEvaluator,
    unlockSessionManager,

    // Database
    db,
  };
}

/**
 * Singleton instance of services
 * Created once and reused throughout the application
 */
let servicesInstance: Services | null = null;

/**
 * Get or create the singleton services instance
 */
export function getServices(options?: ServiceOptions): Services {
  if (!servicesInstance) {
    servicesInstance = createServices(options);
  }
  return servicesInstance;
}

/**
 * Reset services instance (useful for testing)
 */
export function resetServices(): void {
  servicesInstance = null;
}
