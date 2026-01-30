// ============================================
// Database Module Exports
// ============================================

export {
  BaseEncryptedDatabase,
  type IEncryptedObservableDatabase,
  type IObservableDatabase,
  type ISubscribable
} from "./base_db";

export { LinkLockDatabase } from "./db";

// ============================================
// Singleton Database Instance
// ============================================

import { LinkLockDatabase } from "./db";

/**
 * Singleton database instance
 * Use this for direct database access without going through the service factory
 */
export const db = new LinkLockDatabase();
