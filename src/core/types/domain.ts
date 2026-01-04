// ============================================
// Core Domain Types
// ============================================

export type RuleAction = "lock" | "block" | "redirect";

export type UnlockDuration =
  | "always_ask" // Password required every time
  | "session" // Until browser restart
  | number; // Minutes (1, 5, 10, custom)

export interface LinkRule {
  id: string; // UUID
  urlPattern: string; // example.com, *.example.com
  action: RuleAction;

  // === Lock-specific options (only if action === 'lock') ===
  lockOptions?: {
    unlockDuration: UnlockDuration;
    useCustomPassword: boolean;
    customPasswordHash?: string; // SHA-256 hash (only if useCustomPassword)
  };

  // === Redirect-specific options (only if action === 'redirect') ===
  redirectOptions?: {
    targetUrl: string; // URL or internal page
  };

  // === Metadata ===
  profileId: string; // Which profile this rule belongs to
  createdAt: number; // Timestamp
  updatedAt: number;
  enabled: boolean; // Can temporarily disable without deleting
}

export interface Profile {
  id: string; // UUID
  name: string; // "Work", "Focus", "Kids"
  isActive: boolean; // Only one profile active at a time
  createdAt: number;
  updatedAt: number;
}

export interface SecurityConfig {
  masterPasswordHash: string; // SHA-256 hash
  failedAttemptLimit: number; // Default: 5
  cooldownDuration: number; // Minutes (default: 5)
  requireMasterAfterCooldown: boolean;
}

export interface UnlockSession {
  domain: string;
  unlockedAt: number; // Timestamp
  expiresAt: number | null; // null = session unlock
  profileId: string;
}

export type ActivityEventType =
  | "unlock_success"
  | "unlock_failed"
  | "redirect"
  | "blocked";

export interface ActivityLogEntry {
  id: string;
  eventType: ActivityEventType;
  domain: string;
  timestamp: number;
  profileId: string;
  metadata?: {
    failedAttempts?: number;
    redirectTarget?: string;
  };
}

export interface CooldownState {
  domain: string;
  failedAttempts: number;
  lockedUntil: number | null; // null = not in cooldown
}

export interface SnoozeState {
  domain: string;
  snoozedUntil: number; // Timestamp
  profileId: string;
}

export interface ExportData {
  version: string;
  exportedAt: number;
  profiles: Profile[];
  rules: LinkRule[];
  activityLogs?: ActivityLogEntry[];
}

export type EvaluationResult =
  | { action: "allow" } // No rule matches
  | { action: "block" } // Block action
  | { action: "redirect"; target: string } // Redirect action
  | { action: "require_unlock"; rule: LinkRule }; // Lock action
