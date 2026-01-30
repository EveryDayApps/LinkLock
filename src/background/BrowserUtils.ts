import type { ActiveTabSession } from "@/services/database/local_lb";
import { DB_CHANGE_MESSAGE_TYPE } from "../models/constants";
import type { LinkRule, TypedDBChangePayload } from "./BackgroundModels";






export class BrowserUtils {
  // filter domain from a given url
  extractDomainAndVerify(url: string): string | null {
    try {
      const parsed = new URL(url);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }

      return parsed.hostname;
    } catch {
      return null;
    }
  }



  // LinkRule -> ActiveTabSession
  getActiveTabSessionFromRule(rule: LinkRule, tabId: number, actualUrl: string): ActiveTabSession {
    return {
      tabId: tabId,
      ruleId: rule.id,
      action: rule.action,
      url: actualUrl,
    };
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
