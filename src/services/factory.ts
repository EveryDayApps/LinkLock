// ============================================
// Service Factory
// Creates and wires all service dependencies
// ============================================

import { AuthManager } from "../lib/authManager";
import { PasswordService } from "../lib/passwordService";
import { EncryptionService } from "../lib/encryption";
import { ProfileManager } from "../lib/profileManager";
import { RuleManager } from "../lib/ruleManager";
import { RuleEvaluator } from "../lib/ruleEvaluator";
import { UnlockSessionManager } from "../lib/unlockSessionManager";
import { StorageService } from "../lib/storage";
import { db } from "../lib/db";
import type { Services, ServiceOptions } from "./types";

/**
 * Create all services with proper dependency injection
 * This is the single source of truth for service creation
 */
export function createServices(_options?: ServiceOptions): Services {
  // Step 1: Create services with no dependencies
  const passwordService = new PasswordService();
  const encryptionService = new EncryptionService();

  // Step 2: Create services that depend on step 1
  const authManager = new AuthManager(passwordService, encryptionService);
  const storageService = new StorageService(encryptionService);

  // Step 3: Create session and state management services
  const unlockSessionManager = new UnlockSessionManager();

  // Step 4: Create business logic services
  const ruleEvaluator = new RuleEvaluator(unlockSessionManager);

  // Step 5: Create data management services
  const profileManager = new ProfileManager();
  const ruleManager = new RuleManager();

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
