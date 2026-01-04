/**
 * Firefox Browser Adapter (Manifest V2)
 * Implements the BrowserAPI interface for Firefox
 */

import type { BrowserAPI, BrowserStorage, BrowserRuntime, BrowserTabs, BrowserWebNavigation } from './types';

declare const browser: any;

class FirefoxStorage implements BrowserStorage {
  async get<T>(key: string): Promise<T | null> {
    const result = await browser.storage.local.get(key);
    return result[key] ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }

  async clear(): Promise<void> {
    await browser.storage.local.clear();
  }
}

class FirefoxRuntime implements BrowserRuntime {
  onMessage = {
    addListener(callback: (message: any, sender: any, sendResponse: (response: any) => void) => boolean | void): void {
      browser.runtime.onMessage.addListener(callback);
    },
    removeListener(callback: Function): void {
      browser.runtime.onMessage.removeListener(callback);
    }
  };

  async sendMessage<T = any, R = any>(message: T): Promise<R> {
    return browser.runtime.sendMessage(message);
  }

  getURL(path: string): string {
    return browser.runtime.getURL(path);
  }
}

class FirefoxTabs implements BrowserTabs {
  async query(queryInfo: { active?: boolean; currentWindow?: boolean }) {
    return browser.tabs.query(queryInfo);
  }

  async create(createProperties: { url: string; active?: boolean }) {
    return browser.tabs.create(createProperties);
  }

  async update(tabId: number, updateProperties: { url?: string }) {
    return browser.tabs.update(tabId, updateProperties);
  }

  async remove(tabId: number): Promise<void> {
    await browser.tabs.remove(tabId);
  }

  async reload(tabId?: number): Promise<void> {
    await browser.tabs.reload(tabId);
  }

  onUpdated = {
    addListener(callback: (tabId: number, changeInfo: any, tab: any) => void): void {
      browser.tabs.onUpdated.addListener(callback);
    },
    removeListener(callback: Function): void {
      browser.tabs.onUpdated.removeListener(callback);
    }
  };
}

class FirefoxWebNavigation implements BrowserWebNavigation {
  onBeforeNavigate = {
    addListener: (
      callback: (details: { tabId: number; url: string; frameId: number; timeStamp: number }) => void,
      filter?: { url: Array<{ urlMatches?: string }> }
    ): void => {
      if (filter) {
        browser.webNavigation.onBeforeNavigate.addListener(callback, filter);
      } else {
        browser.webNavigation.onBeforeNavigate.addListener(callback);
      }
    },
    removeListener: (callback: Function): void => {
      browser.webNavigation.onBeforeNavigate.removeListener(callback);
    }
  };

  onCommitted = {
    addListener: (
      callback: (details: { tabId: number; url: string; frameId: number; transitionType?: string }) => void
    ): void => {
      browser.webNavigation.onCommitted.addListener(callback);
    },
    removeListener: (callback: Function): void => {
      browser.webNavigation.onCommitted.removeListener(callback);
    }
  };
}

export const firefoxAdapter: BrowserAPI = {
  type: 'firefox',
  storage: new FirefoxStorage(),
  runtime: new FirefoxRuntime(),
  tabs: new FirefoxTabs(),
  webNavigation: new FirefoxWebNavigation()
};
