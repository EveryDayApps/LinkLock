# 🧠 Link Lock — Business Logic Implementation Plan

A comprehensive plan for all core business logic, state management, and background processing.

---

## 🎯 Business Logic Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         UI Layer (React)                │
│  - User interactions                    │
│  - Display state                        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Application Layer                  │
│  - Use cases / Commands                 │
│  - Validation                           │
│  - UI State management                  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Domain Layer                      │
│  - Rule evaluation                      │
│  - Password verification                │
│  - Timer management                     │
│  - Profile switching                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    Infrastructure Layer                 │
│  - Storage (encrypted)                  │
│  - Browser APIs (abstracted)            │
│  - Message passing                      │
└─────────────────────────────────────────┘
```

---

## 🗂 Domain Models & Types

### Core Domain Types

```typescript
// ============================================
// Link Rule Model
// ============================================

type RuleAction = "lock" | "block" | "redirect";

type UnlockDuration =
  | "always_ask" // Password required every time
  | "session" // Until browser restart
  | number; // Minutes (1, 5, 10, custom)

interface LinkRule {
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

// ============================================
// Profile Model
// ============================================

interface Profile {
  id: string; // UUID
  name: string; // "Work", "Focus", "Kids"
  isActive: boolean; // Only one profile active at a time
  createdAt: number;
  updatedAt: number;
}

// ============================================
// Security Configuration
// ============================================

interface SecurityConfig {
  masterPasswordHash: string; // SHA-256 hash
  failedAttemptLimit: number; // Default: 5
  cooldownDuration: number; // Minutes (default: 5)
  requireMasterAfterCooldown: boolean;
}

// ============================================
// Unlock Session State
// ============================================

interface UnlockSession {
  domain: string;
  unlockedAt: number; // Timestamp
  expiresAt: number | null; // null = session unlock
  profileId: string;
}

// ============================================
// Activity Log Entry
// ============================================

type ActivityEventType =
  | "unlock_success"
  | "unlock_failed"
  | "redirect"
  | "blocked";

interface ActivityLogEntry {
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

// ============================================
// Cooldown State
// ============================================

interface CooldownState {
  domain: string;
  failedAttempts: number;
  lockedUntil: number | null; // null = not in cooldown
}

// ============================================
// Snooze State
// ============================================

interface SnoozeState {
  domain: string;
  snoozedUntil: number; // Timestamp
  profileId: string;
}
```

---

## 🔧 Business Logic Modules

### 1. 🔐 Password Management Module

**Responsibilities:**

- Hash passwords using SHA-256
- Verify password hashes
- Change master password
- Validate password strength

```typescript
// ============================================
// Password Service
// ============================================

class PasswordService {
  /**
   * Hash a password using SHA-256
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  }

  /**
   * Validate password strength
   * Rules:
   * - Minimum 8 characters
   * - At least one letter
   * - At least one number
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push("Password must contain at least one letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Change master password
   * Re-encrypts all stored data with new password
   */
  async changeMasterPassword(
    currentPassword: string,
    newPassword: string,
    currentHash: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verify current password
    const isValid = await this.verifyPassword(currentPassword, currentHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Validate new password strength
    const validation = this.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    // Hash new password
    const newHash = await this.hashPassword(newPassword);

    // TODO: Re-encrypt all data with new password
    // (handled by encryption service)

    return { success: true };
  }
}
```

---

### 2. 🎯 Rule Evaluation Engine

**Responsibilities:**

- Match URLs against rules
- Determine which action to take
- Check if domain is unlocked
- Handle wildcard patterns

```typescript
// ============================================
// Rule Matcher
// ============================================

class RuleMatcher {
  /**
   * Match a URL against a pattern
   * Supports:
   * - Exact: example.com
   * - Subdomain: mail.example.com
   * - Wildcard: *.example.com
   */
  matchesPattern(url: string, pattern: string): boolean {
    const hostname = new URL(url).hostname;

    // Exact match
    if (pattern === hostname) {
      return true;
    }

    // Wildcard match
    if (pattern.startsWith("*.")) {
      const domain = pattern.substring(2);
      return hostname === domain || hostname.endsWith("." + domain);
    }

    return false;
  }

  /**
   * Find matching rule for a URL
   * Returns the first matching rule
   */
  findMatchingRule(url: string, rules: LinkRule[]): LinkRule | null {
    // Only consider enabled rules
    const enabledRules = rules.filter((r) => r.enabled);

    // Find first match
    for (const rule of enabledRules) {
      if (this.matchesPattern(url, rule.urlPattern)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Validate URL pattern
   */
  validatePattern(pattern: string): {
    isValid: boolean;
    error?: string;
  } {
    // Must not be empty
    if (!pattern.trim()) {
      return { isValid: false, error: "Pattern cannot be empty" };
    }

    // Check for invalid characters
    if (/[<>"|{}\\^`\s]/.test(pattern)) {
      return { isValid: false, error: "Pattern contains invalid characters" };
    }

    // Wildcard must be at the start
    if (pattern.includes("*") && !pattern.startsWith("*.")) {
      return {
        isValid: false,
        error: "Wildcard must be at the start (*.example.com)",
      };
    }

    // Must have at least one dot
    if (!pattern.includes(".")) {
      return { isValid: false, error: "Pattern must be a valid domain" };
    }

    return { isValid: true };
  }
}

// ============================================
// Rule Evaluator
// ============================================

type EvaluationResult =
  | { action: "allow" } // No rule matches
  | { action: "block" } // Block action
  | { action: "redirect"; target: string } // Redirect action
  | { action: "require_unlock"; rule: LinkRule }; // Lock action

class RuleEvaluator {
  constructor(
    private ruleMatcher: RuleMatcher,
    private sessionManager: UnlockSessionManager
  ) {}

  /**
   * Evaluate a URL and determine what action to take
   */
  async evaluate(
    url: string,
    rules: LinkRule[],
    activeProfileId: string
  ): Promise<EvaluationResult> {
    // Get rules for active profile only
    const profileRules = rules.filter((r) => r.profileId === activeProfileId);

    // Find matching rule
    const rule = this.ruleMatcher.findMatchingRule(url, profileRules);

    // No rule matches - allow access
    if (!rule) {
      return { action: "allow" };
    }

    // Handle different actions
    switch (rule.action) {
      case "block":
        return { action: "block" };

      case "redirect":
        return {
          action: "redirect",
          target: rule.redirectOptions!.targetUrl,
        };

      case "lock": {
        const domain = new URL(url).hostname;

        // Check if domain is currently unlocked
        const isUnlocked = await this.sessionManager.isUnlocked(domain);

        if (isUnlocked) {
          return { action: "allow" };
        }

        // Check if domain is snoozed
        const isSnoozed = await this.sessionManager.isSnoozed(domain);

        if (isSnoozed) {
          return { action: "allow" };
        }

        return { action: "require_unlock", rule };
      }
    }
  }
}
```

---

### 3. ⏱ Unlock Session Manager

**Responsibilities:**

- Track unlocked domains
- Handle unlock timers
- Manage session unlocks
- Handle snooze state

```typescript
// ============================================
// Unlock Session Manager
// ============================================

class UnlockSessionManager {
  private sessions: Map<string, UnlockSession> = new Map();
  private snoozes: Map<string, SnoozeState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Unlock a domain
   */
  async unlock(
    domain: string,
    duration: UnlockDuration,
    profileId: string
  ): Promise<void> {
    const now = Date.now();
    let expiresAt: number | null = null;

    if (duration === "session") {
      expiresAt = null; // No expiration
    } else if (duration === "always_ask") {
      // Don't create a session - require password every time
      return;
    } else {
      // Duration is in minutes
      expiresAt = now + duration * 60 * 1000;
    }

    const session: UnlockSession = {
      domain,
      unlockedAt: now,
      expiresAt,
      profileId,
    };

    this.sessions.set(domain, session);

    // Persist to storage
    await this.saveToStorage();

    // Set timer if there's an expiration
    if (expiresAt) {
      this.setUnlockTimer(domain, expiresAt - now);
    }
  }

  /**
   * Check if domain is unlocked
   */
  async isUnlocked(domain: string): Promise<boolean> {
    const session = this.sessions.get(domain);

    if (!session) {
      return false;
    }

    // Session unlock (no expiration)
    if (session.expiresAt === null) {
      return true;
    }

    // Check if expired
    if (Date.now() > session.expiresAt) {
      await this.lock(domain);
      return false;
    }

    return true;
  }

  /**
   * Lock a domain (remove session)
   */
  async lock(domain: string): Promise<void> {
    this.sessions.delete(domain);
    this.clearTimer(domain);
    await this.saveToStorage();
  }

  /**
   * Snooze a domain for a duration
   */
  async snooze(
    domain: string,
    duration: 5 | 30 | "today",
    profileId: string
  ): Promise<void> {
    const now = Date.now();
    let snoozedUntil: number;

    if (duration === "today") {
      // Snooze until end of day (11:59:59 PM)
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      snoozedUntil = endOfDay.getTime();
    } else {
      // Duration is in minutes
      snoozedUntil = now + duration * 60 * 1000;
    }

    const snooze: SnoozeState = {
      domain,
      snoozedUntil,
      profileId,
    };

    this.snoozes.set(domain, snooze);
    await this.saveToStorage();

    // Set timer to remove snooze
    this.setSnoozeTimer(domain, snoozedUntil - now);
  }

  /**
   * Check if domain is snoozed
   */
  async isSnoozed(domain: string): Promise<boolean> {
    const snooze = this.snoozes.get(domain);

    if (!snooze) {
      return false;
    }

    // Check if expired
    if (Date.now() > snooze.snoozedUntil) {
      this.snoozes.delete(domain);
      await this.saveToStorage();
      return false;
    }

    return true;
  }

  /**
   * Set timer to auto-lock domain
   */
  private setUnlockTimer(domain: string, duration: number): void {
    this.clearTimer(domain);

    const timer = setTimeout(async () => {
      await this.lock(domain);
    }, duration);

    this.timers.set(domain, timer);
  }

  /**
   * Set timer to remove snooze
   */
  private setSnoozeTimer(domain: string, duration: number): void {
    const timer = setTimeout(async () => {
      this.snoozes.delete(domain);
      await this.saveToStorage();
    }, duration);

    this.timers.set(`snooze-${domain}`, timer);
  }

  /**
   * Clear timer for domain
   */
  private clearTimer(domain: string): void {
    const timer = this.timers.get(domain);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(domain);
    }
  }

  /**
   * Clear all sessions (on browser restart or profile switch)
   */
  async clearAllSessions(): Promise<void> {
    this.sessions.clear();
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    await this.saveToStorage();
  }

  /**
   * Load sessions from storage (on extension start)
   */
  async loadFromStorage(): Promise<void> {
    // TODO: Load from encrypted storage
    // Restore timers for unexpired sessions
  }

  /**
   * Save sessions to storage
   */
  private async saveToStorage(): Promise<void> {
    // TODO: Save to encrypted storage
  }
}
```

---

### 4. 🔒 Cooldown & Failed Attempt Manager

**Responsibilities:**

- Track failed unlock attempts
- Enforce cooldown periods
- Reset counters on success

```typescript
// ============================================
// Cooldown Manager
// ============================================

class CooldownManager {
  private cooldowns: Map<string, CooldownState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private securityConfig: SecurityConfig) {}

  /**
   * Record a failed unlock attempt
   * Returns true if cooldown is triggered
   */
  async recordFailedAttempt(domain: string): Promise<boolean> {
    const state = this.cooldowns.get(domain) || {
      domain,
      failedAttempts: 0,
      lockedUntil: null,
    };

    state.failedAttempts++;

    // Check if limit reached
    if (state.failedAttempts >= this.securityConfig.failedAttemptLimit) {
      const cooldownMs = this.securityConfig.cooldownDuration * 60 * 1000;
      state.lockedUntil = Date.now() + cooldownMs;

      // Set timer to unlock after cooldown
      this.setCooldownTimer(domain, cooldownMs);
    }

    this.cooldowns.set(domain, state);
    await this.saveToStorage();

    return state.lockedUntil !== null;
  }

  /**
   * Check if domain is in cooldown
   */
  isInCooldown(domain: string): boolean {
    const state = this.cooldowns.get(domain);

    if (!state || !state.lockedUntil) {
      return false;
    }

    // Check if cooldown expired
    if (Date.now() > state.lockedUntil) {
      this.clearCooldown(domain);
      return false;
    }

    return true;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getRemainingCooldown(domain: string): number {
    const state = this.cooldowns.get(domain);

    if (!state || !state.lockedUntil) {
      return 0;
    }

    const remaining = Math.max(0, state.lockedUntil - Date.now());
    return Math.ceil(remaining / 1000); // Convert to seconds
  }

  /**
   * Get failed attempt count
   */
  getFailedAttempts(domain: string): number {
    return this.cooldowns.get(domain)?.failedAttempts || 0;
  }

  /**
   * Reset failed attempts for domain (on successful unlock)
   */
  async resetAttempts(domain: string): Promise<void> {
    this.clearCooldown(domain);
  }

  /**
   * Clear cooldown for domain
   */
  private clearCooldown(domain: string): void {
    this.cooldowns.delete(domain);

    const timer = this.timers.get(domain);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(domain);
    }
  }

  /**
   * Set timer to auto-clear cooldown
   */
  private setCooldownTimer(domain: string, duration: number): void {
    const timer = this.timers.get(domain);
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      this.clearCooldown(domain);
      this.saveToStorage();
    }, duration);

    this.timers.set(domain, newTimer);
  }

  /**
   * Load from storage
   */
  async loadFromStorage(): Promise<void> {
    // TODO: Load from storage
    // Restore timers for active cooldowns
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    // TODO: Save to storage
  }
}
```

---

### 5. 👤 Profile Manager

**Responsibilities:**

- Switch between profiles
- Create/delete profiles
- Manage profile-specific rules

```typescript
// ============================================
// Profile Manager
// ============================================

class ProfileManager {
  private profiles: Map<string, Profile> = new Map();
  private activeProfileId: string | null = null;

  /**
   * Get active profile
   */
  getActiveProfile(): Profile | null {
    if (!this.activeProfileId) {
      return null;
    }
    return this.profiles.get(this.activeProfileId) || null;
  }

  /**
   * Switch to a different profile
   * Requires master password verification
   */
  async switchProfile(
    profileId: string,
    masterPassword: string,
    masterPasswordHash: string,
    passwordService: PasswordService,
    sessionManager: UnlockSessionManager
  ): Promise<{ success: boolean; error?: string }> {
    // Verify master password
    const isValid = await passwordService.verifyPassword(
      masterPassword,
      masterPasswordHash
    );

    if (!isValid) {
      return { success: false, error: "Incorrect master password" };
    }

    // Check if profile exists
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Clear all unlock sessions when switching
    await sessionManager.clearAllSessions();

    // Update active profile
    if (this.activeProfileId) {
      const currentProfile = this.profiles.get(this.activeProfileId);
      if (currentProfile) {
        currentProfile.isActive = false;
      }
    }

    profile.isActive = true;
    this.activeProfileId = profileId;

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Create a new profile
   */
  async createProfile(
    name: string,
    copyRulesFromProfileId?: string
  ): Promise<{ success: boolean; profileId?: string; error?: string }> {
    // Validate name
    if (!name.trim()) {
      return { success: false, error: "Profile name cannot be empty" };
    }

    // Check for duplicate name
    const existingProfile = Array.from(this.profiles.values()).find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    if (existingProfile) {
      return { success: false, error: "Profile name already exists" };
    }

    // Create profile
    const profileId = crypto.randomUUID();
    const profile: Profile = {
      id: profileId,
      name,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.profiles.set(profileId, profile);

    // If copying rules, handle that separately in RuleManager

    await this.saveToStorage();

    return { success: true, profileId };
  }

  /**
   * Delete a profile
   */
  async deleteProfile(
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Cannot delete active profile
    if (profileId === this.activeProfileId) {
      return { success: false, error: "Cannot delete active profile" };
    }

    // Cannot delete if it's the only profile
    if (this.profiles.size <= 1) {
      return { success: false, error: "Cannot delete the only profile" };
    }

    this.profiles.delete(profileId);
    await this.saveToStorage();

    // Rules are deleted separately in RuleManager

    return { success: true };
  }

  /**
   * Rename a profile
   */
  async renameProfile(
    profileId: string,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!newName.trim()) {
      return { success: false, error: "Profile name cannot be empty" };
    }

    // Check for duplicate name
    const existingProfile = Array.from(this.profiles.values()).find(
      (p) =>
        p.id !== profileId && p.name.toLowerCase() === newName.toLowerCase()
    );

    if (existingProfile) {
      return { success: false, error: "Profile name already exists" };
    }

    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    profile.name = newName;
    profile.updatedAt = Date.now();

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Load from storage
   */
  async loadFromStorage(): Promise<void> {
    // TODO: Load from storage
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    // TODO: Save to storage
  }
}
```

---

### 6. 📜 Rule Manager (CRUD Operations)

**Responsibilities:**

- Create, read, update, delete rules
- Validate rule configuration
- Copy rules between profiles

```typescript
// ============================================
// Rule Manager
// ============================================

class RuleManager {
  private rules: Map<string, LinkRule> = new Map();

  /**
   * Create a new rule
   */
  async createRule(
    urlPattern: string,
    action: RuleAction,
    options: {
      profileId: string;
      lockOptions?: LinkRule["lockOptions"];
      redirectOptions?: LinkRule["redirectOptions"];
    }
  ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
    // Validate URL pattern
    const ruleMatcher = new RuleMatcher();
    const patternValidation = ruleMatcher.validatePattern(urlPattern);

    if (!patternValidation.isValid) {
      return { success: false, error: patternValidation.error };
    }

    // Validate action-specific options
    const validation = this.validateRuleOptions(action, options);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check for duplicate pattern in same profile
    const duplicate = Array.from(this.rules.values()).find(
      (r) => r.profileId === options.profileId && r.urlPattern === urlPattern
    );

    if (duplicate) {
      return {
        success: false,
        error: "A rule for this URL pattern already exists in this profile",
      };
    }

    // Create rule
    const ruleId = crypto.randomUUID();
    const rule: LinkRule = {
      id: ruleId,
      urlPattern,
      action,
      lockOptions: options.lockOptions,
      redirectOptions: options.redirectOptions,
      profileId: options.profileId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    };

    this.rules.set(ruleId, rule);
    await this.saveToStorage();

    return { success: true, ruleId };
  }

  /**
   * Update a rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Omit<LinkRule, "id" | "profileId" | "createdAt">>
  ): Promise<{ success: boolean; error?: string }> {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      return { success: false, error: "Rule not found" };
    }

    // If updating action, validate options
    if (updates.action) {
      const validation = this.validateRuleOptions(updates.action, {
        profileId: rule.profileId,
        lockOptions: updates.lockOptions,
        redirectOptions: updates.redirectOptions,
      });

      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
    }

    // Apply updates
    Object.assign(rule, {
      ...updates,
      updatedAt: Date.now(),
    });

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Delete a rule
   */
  async deleteRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    const deleted = this.rules.delete(ruleId);

    if (!deleted) {
      return { success: false, error: "Rule not found" };
    }

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): LinkRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get all rules for a profile
   */
  getRulesByProfile(profileId: string): LinkRule[] {
    return Array.from(this.rules.values()).filter(
      (r) => r.profileId === profileId
    );
  }

  /**
   * Toggle rule enabled state
   */
  async toggleRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      return { success: false, error: "Rule not found" };
    }

    rule.enabled = !rule.enabled;
    rule.updatedAt = Date.now();

    await this.saveToStorage();

    return { success: true };
  }

  /**
   * Copy rules from one profile to another
   */
  async copyRules(
    sourceProfileId: string,
    targetProfileId: string
  ): Promise<{ success: boolean; copiedCount: number }> {
    const sourceRules = this.getRulesByProfile(sourceProfileId);

    let copiedCount = 0;

    for (const sourceRule of sourceRules) {
      const newRule: LinkRule = {
        ...sourceRule,
        id: crypto.randomUUID(),
        profileId: targetProfileId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.rules.set(newRule.id, newRule);
      copiedCount++;
    }

    if (copiedCount > 0) {
      await this.saveToStorage();
    }

    return { success: true, copiedCount };
  }

  /**
   * Delete all rules for a profile
   */
  async deleteProfileRules(profileId: string): Promise<void> {
    const rulesToDelete = Array.from(this.rules.values())
      .filter((r) => r.profileId === profileId)
      .map((r) => r.id);

    rulesToDelete.forEach((id) => this.rules.delete(id));

    if (rulesToDelete.length > 0) {
      await this.saveToStorage();
    }
  }

  /**
   * Validate rule options based on action type
   */
  private validateRuleOptions(
    action: RuleAction,
    options: {
      lockOptions?: LinkRule["lockOptions"];
      redirectOptions?: LinkRule["redirectOptions"];
    }
  ): { isValid: boolean; error?: string } {
    if (action === "lock") {
      if (!options.lockOptions) {
        return {
          isValid: false,
          error: "Lock options are required for lock action",
        };
      }

      // Validate custom password if enabled
      if (
        options.lockOptions.useCustomPassword &&
        !options.lockOptions.customPasswordHash
      ) {
        return {
          isValid: false,
          error:
            "Custom password hash is required when useCustomPassword is true",
        };
      }
    }

    if (action === "redirect") {
      if (!options.redirectOptions || !options.redirectOptions.targetUrl) {
        return {
          isValid: false,
          error: "Target URL is required for redirect action",
        };
      }

      // Validate target URL
      try {
        new URL(options.redirectOptions.targetUrl);
      } catch {
        return { isValid: false, error: "Invalid target URL" };
      }
    }

    return { isValid: true };
  }

  /**
   * Load from storage
   */
  async loadFromStorage(): Promise<void> {
    // TODO: Load from storage
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    // TODO: Save to storage
  }
}
```

---

### 7. 📊 Activity Logger

**Responsibilities:**

- Log unlock events
- Log failed attempts
- Log redirect/block events
- Query and filter logs

```typescript
// ============================================
// Activity Logger
// ============================================

class ActivityLogger {
  private logs: ActivityLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 entries

  constructor(private loggingEnabled: boolean) {}

  /**
   * Log an unlock success event
   */
  async logUnlockSuccess(domain: string, profileId: string): Promise<void> {
    if (!this.loggingEnabled) return;

    const entry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      eventType: "unlock_success",
      domain,
      timestamp: Date.now(),
      profileId,
    };

    this.addEntry(entry);
  }

  /**
   * Log a failed unlock attempt
   */
  async logUnlockFailed(
    domain: string,
    profileId: string,
    failedAttempts: number
  ): Promise<void> {
    if (!this.loggingEnabled) return;

    const entry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      eventType: "unlock_failed",
      domain,
      timestamp: Date.now(),
      profileId,
      metadata: { failedAttempts },
    };

    this.addEntry(entry);
  }

  /**
   * Log a redirect event
   */
  async logRedirect(
    domain: string,
    profileId: string,
    redirectTarget: string
  ): Promise<void> {
    if (!this.loggingEnabled) return;

    const entry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      eventType: "redirect",
      domain,
      timestamp: Date.now(),
      profileId,
      metadata: { redirectTarget },
    };

    this.addEntry(entry);
  }

  /**
   * Log a block event
   */
  async logBlocked(domain: string, profileId: string): Promise<void> {
    if (!this.loggingEnabled) return;

    const entry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      eventType: "blocked",
      domain,
      timestamp: Date.now(),
      profileId,
    };

    this.addEntry(entry);
  }

  /**
   * Get logs with filters
   */
  getLogs(filters?: {
    eventType?: ActivityEventType;
    domain?: string;
    profileId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): ActivityLogEntry[] {
    let filtered = [...this.logs];

    if (filters?.eventType) {
      filtered = filtered.filter((e) => e.eventType === filters.eventType);
    }

    if (filters?.domain) {
      filtered = filtered.filter((e) => e.domain.includes(filters.domain!));
    }

    if (filters?.profileId) {
      filtered = filtered.filter((e) => e.profileId === filters.profileId);
    }

    if (filters?.startDate) {
      filtered = filtered.filter((e) => e.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter((e) => e.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Clear all logs
   */
  async clearAllLogs(): Promise<void> {
    this.logs = [];
    await this.saveToStorage();
  }

  /**
   * Enable/disable logging
   */
  async setLoggingEnabled(enabled: boolean): Promise<void> {
    this.loggingEnabled = enabled;
    await this.saveToStorage();
  }

  /**
   * Add entry and enforce max limit
   */
  private async addEntry(entry: ActivityLogEntry): Promise<void> {
    this.logs.unshift(entry); // Add to beginning

    // Enforce max limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    await this.saveToStorage();
  }

  /**
   * Load from storage
   */
  async loadFromStorage(): Promise<void> {
    // TODO: Load from storage
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    // TODO: Save to storage
  }
}
```

---

## 🔐 Encryption & Storage Layer

```typescript
// ============================================
// Encryption Service
// ============================================

class EncryptionService {
  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(
    data: string,
    masterPasswordHash: string
  ): Promise<{
    encrypted: string;
    iv: string;
  }> {
    // Derive encryption key from master password hash
    const keyMaterial = await this.deriveKey(masterPasswordHash);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keyMaterial,
      encoder.encode(data)
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(
    encryptedData: string,
    iv: string,
    masterPasswordHash: string
  ): Promise<string> {
    // Derive encryption key
    const keyMaterial = await this.deriveKey(masterPasswordHash);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: this.base64ToArrayBuffer(iv) },
      keyMaterial,
      this.base64ToArrayBuffer(encryptedData)
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Derive encryption key from password hash
   */
  private async deriveKey(passwordHash: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passwordHash),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("linklock-salt"), // Static salt (or store per-user)
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// ============================================
// Storage Service
// ============================================

class StorageService {
  constructor(
    private browserStorage: any, // Browser abstraction
    private encryptionService: EncryptionService
  ) {}

  /**
   * Save encrypted data
   */
  async save<T>(
    key: string,
    data: T,
    masterPasswordHash: string
  ): Promise<void> {
    const json = JSON.stringify(data);
    const { encrypted, iv } = await this.encryptionService.encrypt(
      json,
      masterPasswordHash
    );

    await this.browserStorage.set({
      [key]: { encrypted, iv },
    });
  }

  /**
   * Load and decrypt data
   */
  async load<T>(key: string, masterPasswordHash: string): Promise<T | null> {
    const stored = await this.browserStorage.get(key);

    if (!stored || !stored[key]) {
      return null;
    }

    const { encrypted, iv } = stored[key];
    const decrypted = await this.encryptionService.decrypt(
      encrypted,
      iv,
      masterPasswordHash
    );

    return JSON.parse(decrypted) as T;
  }

  /**
   * Delete data
   */
  async delete(key: string): Promise<void> {
    await this.browserStorage.remove(key);
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    await this.browserStorage.clear();
  }
}
```

---

## 📦 Import / Export Service

```typescript
// ============================================
// Import/Export Service
// ============================================

interface ExportData {
  version: string;
  exportedAt: number;
  profiles: Profile[];
  rules: LinkRule[];
  activityLogs?: ActivityLogEntry[];
}

class ImportExportService {
  constructor(
    private encryptionService: EncryptionService,
    private profileManager: ProfileManager,
    private ruleManager: RuleManager,
    private activityLogger: ActivityLogger
  ) {}

  /**
   * Export all data as encrypted JSON
   */
  async exportData(
    includeActivityLogs: boolean,
    masterPasswordHash: string
  ): Promise<Blob> {
    const data: ExportData = {
      version: "1.0.0",
      exportedAt: Date.now(),
      profiles: this.profileManager.getAllProfiles(),
      rules: Array.from(this.ruleManager.getAllRules()),
      activityLogs: includeActivityLogs
        ? this.activityLogger.getLogs()
        : undefined,
    };

    const json = JSON.stringify(data);
    const { encrypted, iv } = await this.encryptionService.encrypt(
      json,
      masterPasswordHash
    );

    const exportPayload = { encrypted, iv };
    return new Blob([JSON.stringify(exportPayload)], {
      type: "application/json",
    });
  }

  /**
   * Import data from encrypted file
   */
  async importData(
    file: File,
    masterPasswordHash: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Read file
      const text = await file.text();
      const payload = JSON.parse(text);

      // Decrypt
      const decrypted = await this.encryptionService.decrypt(
        payload.encrypted,
        payload.iv,
        masterPasswordHash
      );

      const data: ExportData = JSON.parse(decrypted);

      // Validate version
      if (!this.isCompatibleVersion(data.version)) {
        return {
          success: false,
          error: "Incompatible export version",
        };
      }

      // Clear existing data
      await this.clearAllData();

      // Import profiles
      for (const profile of data.profiles) {
        await this.profileManager.importProfile(profile);
      }

      // Import rules
      for (const rule of data.rules) {
        await this.ruleManager.importRule(rule);
      }

      // Import activity logs (if present)
      if (data.activityLogs) {
        await this.activityLogger.importLogs(data.activityLogs);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to import data. File may be corrupted or invalid.",
      };
    }
  }

  private isCompatibleVersion(version: string): boolean {
    // Simple version check (can be more sophisticated)
    return version === "1.0.0";
  }

  private async clearAllData(): Promise<void> {
    // Clear all managers
    // Implementation depends on managers
  }
}
```

---

## 🎯 Background Script Orchestration

**The background script ties everything together:**

```typescript
// ============================================
// Background Script (Main Entry Point)
// ============================================

class BackgroundService {
  private passwordService: PasswordService;
  private ruleMatcher: RuleMatcher;
  private ruleEvaluator: RuleEvaluator;
  private sessionManager: UnlockSessionManager;
  private cooldownManager: CooldownManager;
  private profileManager: ProfileManager;
  private ruleManager: RuleManager;
  private activityLogger: ActivityLogger;
  private encryptionService: EncryptionService;
  private storageService: StorageService;

  async initialize() {
    // Initialize all services
    this.passwordService = new PasswordService();
    this.sessionManager = new UnlockSessionManager();
    this.ruleMatcher = new RuleMatcher();
    this.ruleEvaluator = new RuleEvaluator(
      this.ruleMatcher,
      this.sessionManager
    );
    // ... initialize other services

    // Load data from storage
    await this.loadFromStorage();

    // Set up navigation listener
    this.setupNavigationListener();

    // Set up message handlers
    this.setupMessageHandlers();
  }

  /**
   * Intercept navigation and evaluate rules
   */
  private setupNavigationListener() {
    // Browser abstraction handles this
    browserAPI.onBeforeNavigate(async (details) => {
      const url = details.url;
      const activeProfile = this.profileManager.getActiveProfile();

      if (!activeProfile) return;

      const rules = this.ruleManager.getRulesByProfile(activeProfile.id);
      const result = await this.ruleEvaluator.evaluate(
        url,
        rules,
        activeProfile.id
      );

      switch (result.action) {
        case "block":
          // Block navigation
          await this.activityLogger.logBlocked(
            new URL(url).hostname,
            activeProfile.id
          );
          browserAPI.cancelNavigation(details.tabId);
          break;

        case "redirect":
          // Redirect to target
          await this.activityLogger.logRedirect(
            new URL(url).hostname,
            activeProfile.id,
            result.target
          );
          browserAPI.redirect(details.tabId, result.target);
          break;

        case "require_unlock":
          // Show unlock page
          browserAPI.redirect(
            details.tabId,
            this.getUnlockPageUrl(url, result.rule)
          );
          break;

        case "allow":
          // Allow navigation
          break;
      }
    });
  }

  /**
   * Handle messages from UI
   */
  private setupMessageHandlers() {
    browserAPI.onMessage(async (message, sender, sendResponse) => {
      switch (message.type) {
        case "UNLOCK_SITE":
          await this.handleUnlockSite(message.payload);
          break;

        case "SNOOZE_SITE":
          await this.handleSnooze(message.payload);
          break;

        case "CREATE_RULE":
          await this.handleCreateRule(message.payload);
          break;

        case "UPDATE_RULE":
          await this.handleUpdateRule(message.payload);
          break;

        case "DELETE_RULE":
          await this.handleDeleteRule(message.payload);
          break;

        case "SWITCH_PROFILE":
          await this.handleSwitchProfile(message.payload);
          break;

        // ... more handlers
      }
    });
  }

  private getUnlockPageUrl(originalUrl: string, rule: LinkRule): string {
    const params = new URLSearchParams({
      url: originalUrl,
      ruleId: rule.id,
    });
    return `unlock.html?${params}`;
  }

  // ... handler implementations
}

// Start background service
const background = new BackgroundService();
background.initialize();
```

---

## 📋 Business Logic Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Password Service (hash, verify, validate strength)
- [ ] Encryption Service (AES-GCM encrypt/decrypt)
- [ ] Storage Service (save/load encrypted data)
- [ ] Browser abstraction layer

### Phase 2: Core Domain Logic (Week 2)

- [ ] Rule Matcher (pattern matching, validation)
- [ ] Rule Evaluator (evaluate URL against rules)
- [ ] Unlock Session Manager (track unlocks, timers)
- [ ] Cooldown Manager (failed attempts, lockout)

### Phase 3: Management Services (Week 3)

- [ ] Profile Manager (create, switch, delete)
- [ ] Rule Manager (CRUD operations)
- [ ] Activity Logger (log events, query)

### Phase 4: Integration (Week 4)

- [ ] Background Service orchestration
- [ ] Navigation interception
- [ ] Message passing between background ↔ UI
- [ ] Import/Export service

### Phase 5: Testing & Refinement (Week 5)

- [ ] Unit tests for all services
- [ ] Integration tests for workflows
- [ ] Edge case handling
- [ ] Performance optimization

---

## 🎯 Summary

This business logic plan provides:

✅ **Clear domain models** — TypeScript interfaces for all data  
✅ **Modular services** — Each service has single responsibility  
✅ **Complete workflows** — Lock, unlock, snooze, cooldown, profiles  
✅ **Encryption & security** — SHA-256 hashing, AES-GCM encryption  
✅ **Storage abstraction** — Encrypted persistence layer  
✅ **Background orchestration** — Navigation interception & message handling

Ready to build a **secure, robust, privacy-first** extension! 🔒
