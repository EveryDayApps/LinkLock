/**
 * Browser API export
 * In dev mode, vite will alias webextension-polyfill-ts to our mock
 * In production/extension builds, it will use the real polyfill
 */

export { browser } from "webextension-polyfill-ts";
