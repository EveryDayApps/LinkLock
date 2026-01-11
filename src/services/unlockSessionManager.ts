// ============================================
// Unlock Session Manager
// Manages unlock states, timers, and snooze functionality
// ============================================
import type { UnlockDuration } from "../models/enums";

export interface UnlockSession {
  domain: string;
  profileId: string;
  unlockedAt: number;
  expiresAt: number | null; // null = session unlock
}

export interface SnoozeState {
  domain: string;
  profileId: string;
  snoozedUntil: number;
}

export class UnlockSessionManager {
  private sessions: Map<string, UnlockSession> = new Map();
  private snoozes: Map<string, SnoozeState> = new Map();
  private timers: Map<string, number> = new Map();

  /**
   * Get session key for domain + profile
   */
  private getSessionKey(domain: string, profileId: string): string {
    return `${domain}:${profileId}`;
  }

  /**
   * Unlock a domain for a specific profile
   */
  async unlock(
    domain: string,
    duration: UnlockDuration,
    profileId: string
  ): Promise<void> {
    const now = Date.now();
    let expiresAt: number | null = null;

    if (duration === "session") {
      expiresAt = null; // No expiration (until browser restart)
    } else if (duration === "always_ask") {
      // Don't create a session - require password every time
      return;
    } else if (typeof duration === "number") {
      // Duration is in minutes
      expiresAt = now + duration * 60 * 1000;
    }

    const session: UnlockSession = {
      domain,
      profileId,
      unlockedAt: now,
      expiresAt,
    };

    const key = this.getSessionKey(domain, profileId);
    this.sessions.set(key, session);

    // Set timer if there's an expiration
    if (expiresAt) {
      this.setUnlockTimer(key, expiresAt - now);
    }

    // Persist to storage
    await this.saveToStorage();
  }

  /**
   * Check if domain is unlocked for a specific profile
   */
  async isUnlocked(domain: string, profileId: string): Promise<boolean> {
    const key = this.getSessionKey(domain, profileId);
    const session = this.sessions.get(key);

    if (!session) {
      return false;
    }

    // Session unlock (no expiration)
    if (session.expiresAt === null) {
      return true;
    }

    // Check if expired
    if (Date.now() > session.expiresAt) {
      await this.lock(domain, profileId);
      return false;
    }

    return true;
  }

  /**
   * Lock a domain (remove session)
   */
  async lock(domain: string, profileId: string): Promise<void> {
    const key = this.getSessionKey(domain, profileId);
    this.sessions.delete(key);
    this.clearTimer(key);
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
      profileId,
      snoozedUntil,
    };

    const key = this.getSessionKey(domain, profileId);
    this.snoozes.set(key, snooze);
    await this.saveToStorage();

    // Set timer to remove snooze
    this.setSnoozeTimer(key, snoozedUntil - now);
  }

  /**
   * Check if domain is snoozed for a specific profile
   */
  async isSnoozed(domain: string, profileId: string): Promise<boolean> {
    const key = this.getSessionKey(domain, profileId);
    const snooze = this.snoozes.get(key);

    if (!snooze) {
      return false;
    }

    // Check if expired
    if (Date.now() > snooze.snoozedUntil) {
      this.snoozes.delete(key);
      await this.saveToStorage();
      return false;
    }

    return true;
  }

  /**
   * Get remaining time for unlock in seconds
   */
  getRemainingUnlockTime(domain: string, profileId: string): number {
    const key = this.getSessionKey(domain, profileId);
    const session = this.sessions.get(key);

    if (!session || session.expiresAt === null) {
      return 0;
    }

    const remaining = Math.max(0, session.expiresAt - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * Set timer to auto-lock domain
   */
  private setUnlockTimer(key: string, duration: number): void {
    this.clearTimer(key);

    const timer = setTimeout(async () => {
      this.sessions.delete(key);
      await this.saveToStorage();
    }, duration);

    // Store timer ID (cast to number for browser compatibility)
    this.timers.set(key, timer as unknown as number);
  }

  /**
   * Set timer to remove snooze
   */
  private setSnoozeTimer(key: string, duration: number): void {
    const snoozeKey = `snooze-${key}`;
    const existingTimer = this.timers.get(snoozeKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      this.snoozes.delete(key);
      await this.saveToStorage();
    }, duration);

    this.timers.set(snoozeKey, timer as unknown as number);
  }

  /**
   * Clear timer for a key
   */
  private clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Clear all sessions (on browser restart or profile switch)
   */
  async clearAllSessions(profileId?: string): Promise<void> {
    if (profileId) {
      // Clear sessions for specific profile
      const keysToDelete: string[] = [];
      this.sessions.forEach((session, key) => {
        if (session.profileId === profileId) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach((key) => {
        this.sessions.delete(key);
        this.clearTimer(key);
      });
    } else {
      // Clear all sessions
      this.sessions.clear();
      this.timers.forEach((timer) => clearTimeout(timer));
      this.timers.clear();
    }

    await this.saveToStorage();
  }

  /**
   * Load sessions from storage (on extension start)
   */
  async loadFromStorage(): Promise<void> {
    try {
      // Load from browser storage
      let stored: any;

      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get("unlock_sessions");
        stored = result.unlock_sessions;
      } else if (typeof browser !== "undefined" && browser.storage) {
        const result = await browser.storage.local.get("unlock_sessions");
        stored = result.unlock_sessions;
      }

      if (stored) {
        // Restore sessions
        if (stored.sessions) {
          this.sessions.clear();
          Object.entries(stored.sessions).forEach(([key, session]: [string, any]) => {
            this.sessions.set(key, session);

            // Restore timers for unexpired sessions
            if (session.expiresAt && session.expiresAt > Date.now()) {
              this.setUnlockTimer(key, session.expiresAt - Date.now());
            }
          });
        }

        // Restore snoozes
        if (stored.snoozes) {
          this.snoozes.clear();
          Object.entries(stored.snoozes).forEach(([key, snooze]: [string, any]) => {
            if (snooze.snoozedUntil > Date.now()) {
              this.snoozes.set(key, snooze);
              this.setSnoozeTimer(key, snooze.snoozedUntil - Date.now());
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to load unlock sessions:", error);
    }
  }

  /**
   * Save sessions to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        sessions: Object.fromEntries(this.sessions),
        snoozes: Object.fromEntries(this.snoozes),
      };

      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.set({ unlock_sessions: data });
      } else if (typeof browser !== "undefined" && browser.storage) {
        await browser.storage.local.set({ unlock_sessions: data });
      }
    } catch (error) {
      console.error("Failed to save unlock sessions:", error);
    }
  }

  /**
   * Get all active sessions for debugging
   */
  getAllSessions(): UnlockSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get all active snoozes for debugging
   */
  getAllSnoozes(): SnoozeState[] {
    return Array.from(this.snoozes.values());
  }
}
