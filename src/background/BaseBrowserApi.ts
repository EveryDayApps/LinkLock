import type { Services } from "@/services/core/types";
import type { LockMode } from "@/models/enums";

export abstract class BaseBrowserApi {
  protected services: Services | null | undefined;

  // ============================================
  // Abstract Methods - Must be implemented by subclasses
  // ============================================

  abstract initialize(): void | Promise<void>;
  abstract openOptionsPageListener(): void;
  abstract setupNavigationListener(): void;

  // ============================================
  // Rule Handler Methods - For URL lock/unlock management
  // ============================================

  abstract unlockUrl(urlPattern: string, lockMode: LockMode, timedDuration?: number): void;
  abstract lockUrl(urlPattern: string): void;
  abstract clearAllUnlocks(): void;

  // ============================================
  // Service Initialization
  // ============================================

  init(services: Services): void {
    this.services = services;
  }

  getServices(): Services {
    if (!this.services) {
      throw new Error("Services not initialized in BrowserApi");
    }
    return this.services;
  }
}
