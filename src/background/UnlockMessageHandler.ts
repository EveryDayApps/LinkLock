// ============================================
// UnlockMessageHandler - Handles unlock requests from the unlock page
// Verifies passwords and manages session unlocks
// ============================================

import { UNLOCK_MESSAGE_TYPE } from "@/models/constants";
import type { LockMode } from "@/models/enums";
import { PasswordService } from "@/services/passwordService";
import { browser } from "@/utils/get-browser";
import { backgroundLogger } from "@/utils/logger";
import type { BackgroundStateStore } from "./BackgroundStateStore";
import type { LinkRuleHandler } from "./LinkRuleHandler";

// ============================================
// Types
// ============================================

interface UnlockPayload {
  action: "verify";
  password: string;
  urlPattern: string;
  originalUrl: string;
  lockMode: LockMode;
  timedDuration?: number;
  hasCustomPassword: boolean;
}

interface UnlockMessage {
  type: typeof UNLOCK_MESSAGE_TYPE;
  payload: UnlockPayload;
}

interface UnlockResponse {
  success: boolean;
  error?: string;
}

// ============================================
// UnlockMessageHandler Class
// ============================================

export class UnlockMessageHandler {
  private readonly passwordService = new PasswordService();
  private store: BackgroundStateStore;
  private ruleHandler: LinkRuleHandler;

  constructor(store: BackgroundStateStore, ruleHandler: LinkRuleHandler) {
    this.store = store;
    this.ruleHandler = ruleHandler;
  }

  /**
   * Initialize the message handler
   */
  initialize(): void {
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    backgroundLogger.info("UnlockMessageHandler initialized");
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(
    message: unknown,
    _sender: browser.runtime.MessageSender,
    sendResponse: (response: UnlockResponse) => void
  ): boolean {
    if (!this.isUnlockMessage(message)) {
      return false;
    }

    // Handle async response
    this.processUnlockRequest(message.payload)
      .then(sendResponse)
      .catch((error) => {
        backgroundLogger.error("Error processing unlock request:", error);
        sendResponse({ success: false, error: "Internal error" });
      });

    // Return true to indicate we'll send response asynchronously
    return true;
  }

  /**
   * Type guard for unlock messages
   */
  private isUnlockMessage(message: unknown): message is UnlockMessage {
    if (typeof message !== "object" || message === null) {
      return false;
    }

    const msg = message as Record<string, unknown>;
    return (
      msg.type === UNLOCK_MESSAGE_TYPE &&
      typeof msg.payload === "object" &&
      msg.payload !== null
    );
  }

  /**
   * Process an unlock request
   */
  private async processUnlockRequest(
    payload: UnlockPayload
  ): Promise<UnlockResponse> {
    backgroundLogger.debug("Processing unlock request for:", payload.originalUrl);

    try {
      // Verify password
      const isValid = await this.verifyPassword(
        payload.password,
        payload.hasCustomPassword,
        payload.urlPattern
      );

      if (!isValid) {
        return { success: false, error: "Incorrect password" };
      }

      // Register the unlock in the rule handler
      this.ruleHandler.unlock(
        payload.urlPattern,
        payload.lockMode,
        payload.timedDuration
      );

      backgroundLogger.info(`URL unlocked: ${payload.urlPattern}`);
      return { success: true };
    } catch (error) {
      backgroundLogger.error("Error verifying password:", error);
      return { success: false, error: "Failed to verify password" };
    }
  }

  /**
   * Verify password against master password or custom password
   */
  private async verifyPassword(
    password: string,
    hasCustomPassword: boolean,
    urlPattern: string
  ): Promise<boolean> {
    if (hasCustomPassword) {
      // Find the rule and verify against custom password hash
      return this.verifyCustomPassword(password, urlPattern);
    }

    // Verify against master password
    return this.verifyMasterPassword(password);
  }

  /**
   * Verify against master password
   */
  private async verifyMasterPassword(password: string): Promise<boolean> {
    const masterPasswordData = this.store.masterPassword;

    if (!masterPasswordData) {
      backgroundLogger.error("No master password data found");
      return false;
    }

    try {
      const isValid = await this.passwordService.verifyPassword(
        password,
        masterPasswordData.encryptedPasswordHash,
        masterPasswordData.salt
      );

      return isValid;
    } catch (error) {
      backgroundLogger.error("Error verifying master password:", error);
      return false;
    }
  }

  /**
   * Verify against custom password for a specific rule
   */
  private async verifyCustomPassword(
    password: string,
    urlPattern: string
  ): Promise<boolean> {
    // Find the rule with the matching URL pattern
    const rules = this.store.rules;
    const rule = rules.find((r) => r.urlPattern === urlPattern);

    if (!rule || !rule.lockOptions?.customPasswordHash) {
      backgroundLogger.error("No custom password found for rule:", urlPattern);
      // Fall back to master password
      return this.verifyMasterPassword(password);
    }

    try {
      // For custom passwords, we need to hash the input and compare
      // The custom password hash should include the salt
      const { hash } = await this.passwordService.hashPassword(
        password,
        urlPattern // Use URL pattern as salt for custom passwords
      );

      return hash === rule.lockOptions.customPasswordHash;
    } catch (error) {
      backgroundLogger.error("Error verifying custom password:", error);
      return false;
    }
  }
}
