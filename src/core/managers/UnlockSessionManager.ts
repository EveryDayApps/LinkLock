// ============================================
// Unlock Session Manager
// ============================================

import type { UnlockSession, SnoozeState, UnlockDuration } from "../types/domain";
import type { StorageService } from "../services/StorageService";

export class UnlockSessionManager {
  private sessions: Map<string, UnlockSession> = new Map();
  private snoozes: Map<string, SnoozeState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private storageService: StorageService | null = null;
  private masterPasswordHash: string | null = null;

  /**
   * Initialize with storage service
   */
  initialize(storageService: StorageService, masterPasswordHash: string): void {
    this.storageService = storageService;
    this.masterPasswordHash = masterPasswordHash;
  }

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
   * Get remaining snooze time in seconds
   */
  getRemainingSnoozeTime(domain: string): number {
    const snooze = this.snoozes.get(domain);
    if (!snooze) {
      return 0;
    }

    const remaining = Math.max(0, snooze.snoozedUntil - Date.now());
    return Math.ceil(remaining / 1000);
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
    if (!this.storageService || !this.masterPasswordHash) return;

    const sessions = await this.storageService.load<UnlockSession[]>(
      "unlock_sessions",
      this.masterPasswordHash
    );

    const snoozes = await this.storageService.load<SnoozeState[]>(
      "snooze_states",
      this.masterPasswordHash
    );

    if (sessions) {
      sessions.forEach((session) => {
        this.sessions.set(session.domain, session);

        // Restore timer if not expired
        if (session.expiresAt && session.expiresAt > Date.now()) {
          this.setUnlockTimer(session.domain, session.expiresAt - Date.now());
        }
      });
    }

    if (snoozes) {
      snoozes.forEach((snooze) => {
        if (snooze.snoozedUntil > Date.now()) {
          this.snoozes.set(snooze.domain, snooze);
          this.setSnoozeTimer(snooze.domain, snooze.snoozedUntil - Date.now());
        }
      });
    }
  }

  /**
   * Save sessions to storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.storageService || !this.masterPasswordHash) return;

    const sessionsArray = Array.from(this.sessions.values());
    const snoozesArray = Array.from(this.snoozes.values());

    await this.storageService.save(
      "unlock_sessions",
      sessionsArray,
      this.masterPasswordHash
    );

    await this.storageService.save(
      "snooze_states",
      snoozesArray,
      this.masterPasswordHash
    );
  }
}
