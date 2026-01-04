// ============================================
// Activity Logger
// ============================================

import type { ActivityLogEntry, ActivityEventType } from "../types/domain";
import type { StorageService } from "../services/StorageService";

export class ActivityLogger {
  private logs: ActivityLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 entries
  private storageService: StorageService | null = null;
  private masterPasswordHash: string | null = null;

  constructor(private loggingEnabled: boolean) {}

  /**
   * Initialize with storage service
   */
  initialize(storageService: StorageService, masterPasswordHash: string): void {
    this.storageService = storageService;
    this.masterPasswordHash = masterPasswordHash;
  }

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

    await this.addEntry(entry);
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

    await this.addEntry(entry);
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

    await this.addEntry(entry);
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

    await this.addEntry(entry);
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
  }

  /**
   * Import logs from export
   */
  async importLogs(logs: ActivityLogEntry[]): Promise<void> {
    this.logs = logs;
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
    if (!this.storageService || !this.masterPasswordHash) return;

    const logs = await this.storageService.load<ActivityLogEntry[]>(
      "activity_logs",
      this.masterPasswordHash
    );

    if (logs) {
      this.logs = logs;
    }
  }

  /**
   * Save to storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.storageService || !this.masterPasswordHash) return;

    await this.storageService.save(
      "activity_logs",
      this.logs,
      this.masterPasswordHash
    );
  }
}
