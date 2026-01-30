/**
 * Mock browser API for development mode (non-extension environment)
 * This allows the app to run in regular browser context without extension APIs
 */

// Create a minimal mock of the browser API
const browserMock = {
  runtime: {
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
    sendMessage: async () => {
      console.warn("[Mock] browser.runtime.sendMessage called in dev mode");
      return Promise.resolve();
    },
    getURL: (path: string) => path,
    id: "mock-extension-id",
  },
  tabs: {
    query: async () => [],
    update: async () => ({}),
    create: async () => ({}),
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {},
      remove: async () => {},
      clear: async () => {},
    },
  },
  webNavigation: {
    onCommitted: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
};

// Export as default for compatibility with webextension-polyfill-ts structure
export const browser = browserMock;
export type BrowserMock = typeof browserMock;
