import type { BrowserType } from "../models/types";

export function detectBrowser(): BrowserType {
  if (typeof chrome !== "undefined" && typeof browser === "undefined") {
    return "chrome";
  } else if (typeof browser !== "undefined") {
    return "firefox";
  }
  return "unknown";
}
