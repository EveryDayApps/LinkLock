/**
 * Browser API Abstraction Layer Types
 * Provides a unified interface for Chrome and Firefox browser APIs
 */

export type BrowserType = 'chrome' | 'firefox';

export interface BrowserStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface BrowserRuntime {
  sendMessage<T = any, R = any>(message: T): Promise<R>;
  onMessage: {
    addListener(
      callback: (message: any, sender: any, sendResponse: (response: any) => void) => boolean | void
    ): void;
    removeListener(callback: Function): void;
  };
  getURL(path: string): string;
}

export interface BrowserTabs {
  query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<BrowserTab[]>;
  create(createProperties: { url: string; active?: boolean }): Promise<BrowserTab>;
  update(tabId: number, updateProperties: { url?: string }): Promise<BrowserTab>;
  remove(tabId: number): Promise<void>;
  reload(tabId?: number): Promise<void>;
  onUpdated: {
    addListener(
      callback: (tabId: number, changeInfo: any, tab: BrowserTab) => void
    ): void;
    removeListener(callback: Function): void;
  };
}

export interface BrowserTab {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
  windowId?: number;
}

export interface BrowserWebNavigation {
  onBeforeNavigate: {
    addListener(
      callback: (details: {
        tabId: number;
        url: string;
        frameId: number;
        timeStamp: number;
      }) => void,
      filter?: { url: Array<{ urlMatches?: string }> }
    ): void;
    removeListener(callback: Function): void;
  };
  onCommitted: {
    addListener(
      callback: (details: {
        tabId: number;
        url: string;
        frameId: number;
        transitionType?: string;
      }) => void
    ): void;
    removeListener(callback: Function): void;
  };
}

export interface BrowserDeclarativeNetRequest {
  updateDynamicRules(options: {
    removeRuleIds?: number[];
    addRules?: any[];
  }): Promise<void>;
  getDynamicRules(): Promise<any[]>;
}

export interface BrowserAPI {
  type: BrowserType;
  storage: BrowserStorage;
  runtime: BrowserRuntime;
  tabs: BrowserTabs;
  webNavigation: BrowserWebNavigation;
  declarativeNetRequest?: BrowserDeclarativeNetRequest;
}
