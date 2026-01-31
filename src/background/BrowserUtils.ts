import { DB_CHANGE_MESSAGE_TYPE } from "../models/constants";
import type { TypedDBChangePayload } from "./BackgroundModels";







// filter domain from a given url
export function extractDomainAndVerify(url: string): string | null {
  try {
    const parsed = new URL(url);

    // allow only real web protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    let host = parsed.hostname.toLowerCase();

    // remove www.
    if (host.startsWith("www.")) host = host.slice(4);

    return host;
  } catch {
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
