// ============================================
// Rule Matcher & Evaluator
// ============================================

import type { LinkRule, EvaluationResult } from "../types/domain";
import type { UnlockSessionManager } from "../managers/UnlockSessionManager";

export class RuleMatcher {
  /**
   * Match a URL against a pattern
   * Supports:
   * - Exact: example.com
   * - Subdomain: mail.example.com
   * - Wildcard: *.example.com
   */
  matchesPattern(url: string, pattern: string): boolean {
    try {
      const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

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
      return false;
    }
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

export class RuleEvaluator {
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
        const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

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
