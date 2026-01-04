/**
 * Browser API Abstraction Layer
 * Automatically detects and provides the correct browser adapter
 */

import { chromeAdapter } from './chrome-adapter';
import { firefoxAdapter } from './firefox-adapter';
import type { BrowserAPI } from './types';

declare const chrome: any;
declare const browser: any;

/**
 * Detects the current browser environment and returns the appropriate adapter
 */
export function getBrowserAPI(): BrowserAPI {
  // Firefox uses the 'browser' namespace (WebExtension standard)
  if (typeof browser !== 'undefined' && browser.runtime) {
    return firefoxAdapter;
  }

  // Chrome/Edge/Brave use the 'chrome' namespace
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chromeAdapter;
  }

  throw new Error('Unsupported browser: No compatible browser API detected');
}

// Export a singleton instance
export const browserAPI = getBrowserAPI();

// Re-export types
export type * from './types';
