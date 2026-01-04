/**
 * Chrome Browser Adapter (Manifest V3)
 * Implements the BrowserAPI interface for Chrome/Edge/Brave
 */

import type { BrowserAPI, BrowserStorage, BrowserRuntime, BrowserTabs, BrowserWebNavigation, BrowserDeclarativeNetRequest } from './types';

declare const chrome: any;

class ChromeStorage implements BrowserStorage {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }
}

class ChromeRuntime implements BrowserRuntime {
  onMessage = {
    addListener(callback: (message: any, sender: any, sendResponse: (response: any) => void) => boolean | void): void {
      chrome.runtime.onMessage.addListener(callback);
    },
    removeListener(callback: Function): void {
      chrome.runtime.onMessage.removeListener(callback);
    }
  };

  async sendMessage<T = any, R = any>(message: T): Promise<R> {
    return chrome.runtime.sendMessage(message);
  }

  getURL(path: string): string {
    return chrome.runtime.getURL(path);
  }
}

class ChromeTabs implements BrowserTabs {
  async query(queryInfo: { active?: boolean; currentWindow?: boolean }) {
    return chrome.tabs.query(queryInfo);
  }

  async create(createProperties: { url: string; active?: boolean }) {
    return chrome.tabs.create(createProperties);
  }

  async update(tabId: number, updateProperties: { url?: string }) {
    return chrome.tabs.update(tabId, updateProperties);
  }

  async remove(tabId: number): Promise<void> {
    await chrome.tabs.remove(tabId);
  }

  async reload(tabId?: number): Promise<void> {
    await chrome.tabs.reload(tabId);
  }

  onUpdated = {
    addListener(callback: (tabId: number, changeInfo: any, tab: any) => void): void {
      chrome.tabs.onUpdated.addListener(callback);
    },
    removeListener(callback: Function): void {
      chrome.tabs.onUpdated.removeListener(callback);
    }
  };
}

class ChromeWebNavigation implements BrowserWebNavigation {
  onBeforeNavigate = {
    addListener: (
      callback: (details: { tabId: number; url: string; frameId: number; timeStamp: number }) => void,
      filter?: { url: Array<{ urlMatches?: string }> }
    ): void => {
      if (filter) {
        chrome.webNavigation.onBeforeNavigate.addListener(callback, filter);
      } else {
        chrome.webNavigation.onBeforeNavigate.addListener(callback);
      }
    },
    removeListener: (callback: Function): void => {
      chrome.webNavigation.onBeforeNavigate.removeListener(callback);
    }
  };

  onCommitted = {
    addListener: (
      callback: (details: { tabId: number; url: string; frameId: number; transitionType?: string }) => void
    ): void => {
      chrome.webNavigation.onCommitted.addListener(callback);
    },
    removeListener: (callback: Function): void => {
      chrome.webNavigation.onCommitted.removeListener(callback);
    }
  };
}

class ChromeDeclarativeNetRequest implements BrowserDeclarativeNetRequest {
  async updateDynamicRules(options: { removeRuleIds?: number[]; addRules?: any[] }): Promise<void> {
    await chrome.declarativeNetRequest.updateDynamicRules(options);
  }

  async getDynamicRules(): Promise<any[]> {
    return chrome.declarativeNetRequest.getDynamicRules();
  }
}

export const chromeAdapter: BrowserAPI = {
  type: 'chrome',
  storage: new ChromeStorage(),
  runtime: new ChromeRuntime(),
  tabs: new ChromeTabs(),
  webNavigation: new ChromeWebNavigation(),
  declarativeNetRequest: new ChromeDeclarativeNetRequest()
};
