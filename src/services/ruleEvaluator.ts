// ============================================
// Rule Evaluator Service
// Matches URLs against rules and determines actions
// ============================================
import type { UnlockSessionManager } from "../lib/unlockSessionManager";
import type { LinkRule } from "../models/interfaces";

export type EvaluationResult =
  | { action: "allow" }
  | { action: "block"; rule: LinkRule }
  | { action: "redirect"; target: string; rule: LinkRule }
  | { action: "require_unlock"; rule: LinkRule; domain: string };

export class RuleEvaluator {
  private sessionManager?: UnlockSessionManager;

  constructor(sessionManager?: UnlockSessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Set session manager after construction (for circular dependency)
   */
  setSessionManager(sessionManager: UnlockSessionManager): void {
    this.sessionManager = sessionManager;
  }

  /**
   * Match a URL against a pattern
   * Supports:
   * - Exact: example.com
   * - Subdomain: mail.example.com
   * - Wildcard: *.example.com
   */
  private matchesPattern(url: string, pattern: string): boolean {
    try {
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
    } catch (error) {
      console.error("Invalid URL:", url, error);
      return false;
    }
  }

  /**
   * Find matching rule for a URL
   * Returns the first matching enabled rule
   */
  private findMatchingRule(url: string, rules: LinkRule[]): LinkRule | null {
    const enabledRules = rules.filter((r) => r.enabled);

    for (const rule of enabledRules) {
      if (this.matchesPattern(url, rule.urlPattern)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  }

  /**
   * Evaluate a URL and determine what action to take
   */
  async evaluate(
    url: string,
    rules: LinkRule[],
    profileId: string
  ): Promise<EvaluationResult> {
    // Get rules for active profile only
    const profileRules = rules.filter((r) => r.profileIds.includes(profileId));

    // Find matching rule
    const rule = this.findMatchingRule(url, profileRules);

    // No rule matches - allow access
    if (!rule) {
      return { action: "allow" };
    }

    // Handle different actions
    switch (rule.action) {
      case "block":
        return { action: "block", rule };

      case "redirect":
        if (!rule.redirectOptions?.redirectUrl) {
          console.error("Redirect rule missing target URL:", rule);
          return { action: "allow" };
        }
        return {
          action: "redirect",
          target: rule.redirectOptions.redirectUrl,
          rule,
        };

      case "lock": {
        const domain = this.extractDomain(url);
        if (!domain) {
          return { action: "allow" };
        }

        // Check if domain is currently unlocked
        if (this.sessionManager) {
          const isUnlocked = await this.sessionManager.isUnlocked(
            domain,
            profileId
          );
          if (isUnlocked) {
            return { action: "allow" };
          }

          // Check if domain is snoozed
          const isSnoozed = await this.sessionManager.isSnoozed(
            domain,
            profileId
          );
          if (isSnoozed) {
            return { action: "allow" };
          }
        }

        return { action: "require_unlock", rule, domain };
      }

      default:
        return { action: "allow" };
    }
  }

  /**
   * Validate URL pattern
   */
  validatePattern(pattern: string): {
    isValid: boolean;
    error?: string;
  } {
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
