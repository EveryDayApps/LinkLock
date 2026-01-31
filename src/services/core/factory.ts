// ============================================
// Service Factory
// Creates and wires all service dependencies
// ============================================

import { AuthManager } from "../authManager";
import { db } from "../database";
import { LinkLockLocalDb } from "../database/local_lb";
import { EncryptionService } from "../encryption";
import { PasswordService } from "../passwordService";
import { ProfileManager } from "../profileManager";
import { RuleManager } from "../ruleManager";
import type { ServiceOptions, Services } from "./types";

/**
 * Create all services with proper dependency injection
 * This is the single source of truth for service creation
 */
export function createServices(_options?: ServiceOptions): Services {
  const passwordService = new PasswordService();
  const encryptionService = new EncryptionService();
  const authManager = new AuthManager(db, passwordService, encryptionService);
  const profileManager = new ProfileManager(db);
  const ruleManager = new RuleManager(db);
  const localDb = new LinkLockLocalDb();

  // Return all services
  return {
    // Core services
    authManager,
    passwordService,
    encryptionService,
    // Data services
    profileManager,
    ruleManager,
    // Database
    db,
    localDb,
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
