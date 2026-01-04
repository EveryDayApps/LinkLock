// ============================================
// Cooldown Manager
// ============================================

import type { CooldownState, SecurityConfig } from "../types/domain";
import type { StorageService } from "../services/StorageService";

export class CooldownManager {
  private cooldowns: Map<string, CooldownState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private storageService: StorageService | null = null;
  private masterPasswordHash: string | null = null;

  constructor(private securityConfig: SecurityConfig) {}

  /**
   * Initialize with storage service
   */
  initialize(storageService: StorageService, masterPasswordHash: string): void {
    this.storageService = storageService;
    this.masterPasswordHash = masterPasswordHash;
  }

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
    await this.saveToStorage();
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
    if (!this.storageService || !this.masterPasswordHash) return;

    const cooldowns = await this.storageService.load<CooldownState[]>(
      "cooldown_states",
      this.masterPasswordHash
    );

    if (cooldowns) {
      cooldowns.forEach((cooldown) => {
        this.cooldowns.set(cooldown.domain, cooldown);

        // Restore timer if still in cooldown
        if (cooldown.lockedUntil && cooldown.lockedUntil > Date.now()) {
          this.setCooldownTimer(
            cooldown.domain,
            cooldown.lockedUntil - Date.now()
          );
        }
      });
    }
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.storageService || !this.masterPasswordHash) return;

    const cooldownsArray = Array.from(this.cooldowns.values());
    await this.storageService.save(
      "cooldown_states",
      cooldownsArray,
      this.masterPasswordHash
    );
  }
}
