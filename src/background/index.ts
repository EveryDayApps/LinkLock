/**
 * Background Service Worker - Complete Implementation
 */

import { browserAPI } from '../core/browser';
import { onMessage } from '../core/messages';

// In-memory state
const masterPasswordHash = new Map<string, string>();
const unlockSessions = new Map<string, { expiresAt: number; mode: string }>(); // domain -> session info

console.log('[LinkLock] Background script loaded');

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Check if URL matches pattern
 */
function matchesPattern(url: string, pattern: string): boolean {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

    // Exact match
    if (pattern === hostname) {
      return true;
    }

    // Wildcard match (*.example.com)
    if (pattern.startsWith('*.')) {
      const domain = pattern.substring(2);
      return hostname === domain || hostname.endsWith('.' + domain);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Find matching rule for URL
 */
async function findMatchingRule(url: string): Promise<any | null> {
  const rules = (await browserAPI.storage.get<any[]>('rules')) || [];

  for (const rule of rules) {
    if (rule.enabled && matchesPattern(url, rule.urlPattern)) {
      return rule;
    }
  }

  return null;
}

/**
 * Check if domain is unlocked
 */
function isUnlocked(domain: string): boolean {
  const session = unlockSessions.get(domain);
  if (!session) return false;

  if (session.mode === 'session') {
    return true; // Session unlock never expires until browser restart
  }

  if (Date.now() > session.expiresAt) {
    unlockSessions.delete(domain);
    return false;
  }

  return true;
}

/**
 * Handle navigation events
 */
function handleNavigation(details: { tabId: number; url: string; frameId: number }) {
  // Only handle main frame navigations
  if (details.frameId !== 0) return;

  const domain = extractDomain(details.url);

  // Skip internal URLs
  if (!domain ||
      details.url.startsWith('chrome://') ||
      details.url.startsWith('about:') ||
      details.url.startsWith('moz-extension://') ||
      details.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip our own unlock page
  if (details.url.includes('unlock.html')) {
    return;
  }

  // Check if domain is unlocked
  if (isUnlocked(domain)) {
    console.log(`[LinkLock] ${domain} is unlocked, allowing navigation`);
    return;
  }

  // Find matching rule
  findMatchingRule(details.url).then(rule => {
    if (!rule) {
      console.log(`[LinkLock] No rule found for ${domain}, allowing navigation`);
      return;
    }

    console.log(`[LinkLock] Rule found for ${domain}:`, rule.action);

    if (rule.action === 'lock') {
      // Redirect to unlock page
      const unlockUrl = browserAPI.runtime.getURL(
        `unlock.html?url=${encodeURIComponent(details.url)}&domain=${encodeURIComponent(domain)}&ruleId=${rule.id}`
      );

      browserAPI.tabs.update(details.tabId, { url: unlockUrl }).catch(err => {
        console.error('[LinkLock] Failed to redirect to unlock page:', err);
      });
    } else if (rule.action === 'block') {
      // Show blocked page
      const blockUrl = browserAPI.runtime.getURL(
        `unlock.html?blocked=true&domain=${encodeURIComponent(domain)}`
      );

      browserAPI.tabs.update(details.tabId, { url: blockUrl }).catch(err => {
        console.error('[LinkLock] Failed to block page:', err);
      });
    } else if (rule.action === 'redirect' && rule.options?.redirectUrl) {
      // Redirect to custom URL
      browserAPI.tabs.update(details.tabId, { url: rule.options.redirectUrl }).catch(err => {
        console.error('[LinkLock] Failed to redirect:', err);
      });
    }
  }).catch(err => {
    console.error('[LinkLock] Error evaluating rule:', err);
  });
}

/**
 * Message handlers
 */
onMessage(async (message) => {
  console.log('[LinkLock Background] Received message:', message.type);

  try {
    switch (message.type) {
      case 'INIT_CHECK': {
        const hasMasterPassword = masterPasswordHash.size > 0;
        return { initialized: hasMasterPassword, hasMasterPassword };
      }

      case 'SET_MASTER_PASSWORD': {
        const encoder = new TextEncoder();
        const data = encoder.encode(message.payload.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        masterPasswordHash.set('master', hash);
        await browserAPI.storage.set('master_password_hash', { hash });

        return { success: true };
      }

      case 'VERIFY_MASTER_PASSWORD': {
        const storedHash = masterPasswordHash.get('master');
        if (!storedHash) return { success: false };

        const inputData = new TextEncoder().encode(message.payload.password);
        const inputHashBuffer = await crypto.subtle.digest('SHA-256', inputData);
        const inputHashArray = Array.from(new Uint8Array(inputHashBuffer));
        const inputHash = inputHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return { success: inputHash === storedHash };
      }

      case 'UNLOCK_ATTEMPT': {
        const { domain, password, ruleId } = message.payload;

        // Get the rule to check for custom password
        let targetHash = masterPasswordHash.get('master');
        let unlockDuration = 3600; // Default 1 hour in seconds
        let lockMode = 'timed';

        if (ruleId) {
          const rules = (await browserAPI.storage.get<any[]>('rules')) || [];
          const rule = rules.find(r => r.id === ruleId);

          if (rule && rule.action === 'lock') {
            // Check for custom password
            if (rule.options?.customPassword) {
              const encoder = new TextEncoder();
              const data = encoder.encode(rule.options.customPassword);
              const hashBuffer = await crypto.subtle.digest('SHA-256', data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              targetHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }

            // Get lock mode and duration
            lockMode = rule.options?.lockMode || 'timed';
            unlockDuration = rule.options?.timedDuration || 3600;
          }
        }

        // Verify password
        const pwdData = new TextEncoder().encode(password);
        const pwdHashBuffer = await crypto.subtle.digest('SHA-256', pwdData);
        const pwdHashArray = Array.from(new Uint8Array(pwdHashBuffer));
        const pwdHash = pwdHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (pwdHash === targetHash) {
          // Set unlock session based on mode
          if (lockMode === 'session') {
            unlockSessions.set(domain, {
              expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // Far future
              mode: 'session'
            });
          } else if (lockMode === 'always') {
            // Don't create a session for 'always ask'
            unlockSessions.delete(domain);
          } else {
            // Timed unlock
            unlockSessions.set(domain, {
              expiresAt: Date.now() + (unlockDuration * 1000),
              mode: 'timed'
            });
          }

          return { success: true };
        }

        return { success: false, error: 'Invalid password' };
      }

      case 'GET_UNLOCK_STATUS': {
        const { domain } = message.payload;
        const session = unlockSessions.get(domain);
        const unlocked = isUnlocked(domain);

        return {
          isUnlocked: unlocked,
          isSnoozed: false,
          unlockEndsAt: session?.expiresAt,
          mode: session?.mode
        };
      }

      case 'LOCK_DOMAIN': {
        unlockSessions.delete(message.payload.domain);
        return { success: true };
      }

      case 'SNOOZE_DOMAIN': {
        const { domain, durationMinutes } = message.payload;
        unlockSessions.set(domain, {
          expiresAt: Date.now() + (durationMinutes * 60 * 1000),
          mode: 'snooze'
        });
        return { success: true };
      }

      case 'CREATE_RULE': {
        const newRule = {
          id: Date.now().toString(),
          urlPattern: message.payload.urlPattern,
          action: message.payload.action,
          options: message.payload.options || {},
          createdAt: Date.now(),
          enabled: true
        };

        const existingRules = (await browserAPI.storage.get<any[]>('rules')) || [];
        existingRules.push(newRule);
        await browserAPI.storage.set('rules', existingRules);

        console.log('[LinkLock] Rule created:', newRule);

        return { success: true, ruleId: newRule.id };
      }

      case 'DELETE_RULE': {
        const rulesToKeep = ((await browserAPI.storage.get<any[]>('rules')) || [])
          .filter(r => r.id !== message.payload.ruleId);
        await browserAPI.storage.set('rules', rulesToKeep);

        return { success: true };
      }

      case 'GET_RULES': {
        const savedRules = (await browserAPI.storage.get<any[]>('rules')) || [];
        return { success: true, rules: savedRules };
      }

      case 'GET_PROFILES': {
        return { success: true, profiles: [], activeProfileId: null };
      }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('[LinkLock Background] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * Initialize navigation listeners
 */
function initializeNavigationListeners() {
  console.log('[LinkLock] Initializing navigation listeners...');
  browserAPI.webNavigation.onBeforeNavigate.addListener(handleNavigation);
  console.log('[LinkLock] Navigation listeners initialized');
}

/**
 * Initialize from storage
 */
async function initialize() {
  // Load master password hash
  const stored = await browserAPI.storage.get<{ hash: string }>('master_password_hash');
  if (stored) {
    masterPasswordHash.set('master', stored.hash);
    console.log('[LinkLock] Master password loaded from storage');
  }

  // Initialize navigation interception
  initializeNavigationListeners();
}

// Start initialization
initialize();

// Handle extension install/update
if (browserAPI.type === 'chrome') {
  (self as any).chrome?.runtime?.onInstalled?.addListener((details: any) => {
    console.log('[LinkLock] Extension installed/updated:', details.reason);
  });
} else {
  (self as any).browser?.runtime?.onInstalled?.addListener((details: any) => {
    console.log('[LinkLock] Extension installed/updated:', details.reason);
  });
}
