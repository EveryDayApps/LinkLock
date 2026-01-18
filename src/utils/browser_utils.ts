import type { TypedDBChangePayload } from "@/background/BackgroundModels";
import { DB_CHANGE_MESSAGE_TYPE } from "@/models/constants";
import type { BrowserType } from "../models/enums";

import { browser } from "./get-browser";

export function detectBrowser(): BrowserType {
  if (typeof chrome !== "undefined" && typeof browser === "undefined") {
    return "chrome";
  } else if (typeof browser !== "undefined") {
    return "firefox";
  }
  return "unknown";
}

export function getBrowser(): typeof chrome | typeof browser | null {
  const browserType = detectBrowser();
  switch (browserType) {
    case "chrome":
      return chrome;
    case "firefox":
      return browser;
    default:
      return null;
  }
}

/**
 * Sync database changes to the background script
 * Sends the actual data along with the change notification
 * @param payload - The typed payload containing table, type, key, and entity data
 */
export async function syncDbChangeToBackground(payload: TypedDBChangePayload) {
  try {
    await browser.runtime.sendMessage({
      type: DB_CHANGE_MESSAGE_TYPE,
      payload,
    });
  } catch (err) {
    // Firefox: clearer errors
    // Chrome MV3: throws if SW is stopped
    if (import.meta.env.DEV) {
      console.warn("Background not reachable:", err);
    }
  }
}
