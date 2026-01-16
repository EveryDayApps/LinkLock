// ============================================
// Enums and Base Types
// Core type definitions used across the application
// ============================================

export type BrowserType = "chrome" | "firefox" | "unknown";

export type RuleAction = "lock" | "block" | "redirect";

export type UnlockDuration = "always_ask" | "session" | number;

export type LockMode = "always_ask" | "timed_unlock" | "session_unlock";

// ============================================
// Lock Options Types
// ============================================

/**
 * Base lock options shared across all contexts
 */
export interface BaseLockOptions {
  lockMode: LockMode;
  timedDuration?: number; // in minutes, only for timed_unlock
}

/**
 * Full lock options stored in IndexedDB
 * Contains both plain password and hash for user editing
 */
export interface LockOptions extends BaseLockOptions {
  customPassword?: string;
  customPasswordHash?: string;
}

/**
 * Lock options for local storage (runtime)
 * Only contains hash, never plain password
 */
export interface LocalStorageLockOptions extends BaseLockOptions {
  customPasswordHash?: string;
}

// ============================================
// Redirect Options Types
// ============================================

/**
 * Redirect options stored in IndexedDB
 */
export interface RedirectOptions {
  redirectUrl: string;
}
