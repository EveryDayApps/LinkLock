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

export async function notifyDbChange(payload: {
  table: string;
  type: "add" | "update" | "delete";
  key?: string;
}) {
  try {
    await browser.runtime.sendMessage({
      type: "DB_CHANGE",
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
