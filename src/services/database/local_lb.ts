
import type { LockMode, RuleAction } from "@/models/enums";
import { browser, type Browser } from "webextension-polyfill-ts";

export interface ActiveTabSession {
  tabId: number;
  ruleId: string;
  action: RuleAction;
  lockMode?: LockMode
  url: string;
  password?: string;
  unlockedAt?: number;
}

export type SessionMap = Record<string, ActiveTabSession>;

const STORAGE_KEYS = {
  ACTIVE_SESSIONS: "activeSessions",
} as const;

export class LinkLockLocalDb {
  private browser: Browser = browser;

  async getSessionMap(): Promise<SessionMap> {
    const result = await this.browser.storage.local.get(STORAGE_KEYS.ACTIVE_SESSIONS);
    return result[STORAGE_KEYS.ACTIVE_SESSIONS] ?? {};
  }

  async setSessionMap(sessions: SessionMap): Promise<void> {
    await this.browser.storage.local.set({ [STORAGE_KEYS.ACTIVE_SESSIONS]: sessions });
  }

  async getSession(url: string): Promise<ActiveTabSession | undefined> {
    const sessions = await this.getSessionMap();
    return sessions[url];
  }

  async setSession(session: ActiveTabSession): Promise<void> {
    const sessions = await this.getSessionMap();
    sessions[session.url] = session;
    await this.setSessionMap(sessions);
  }

  async removeSession(url: string): Promise<void> {
    const sessions = await this.getSessionMap();
    delete sessions[url];
    await this.setSessionMap(sessions);
  }

  async hasSession(url: string): Promise<boolean> {
    const sessions = await this.getSessionMap();
    return url in sessions;
  }

  async clearAllSessions(): Promise<void> {
    await this.browser.storage.local.remove(STORAGE_KEYS.ACTIVE_SESSIONS);
  }


  //clear sessions which  have UnlockDuration as session
  async clearExpiredSessions(): Promise<void> {
    const sessions = await this.getSessionMap();

    const filteredSessions = Object.fromEntries(
      Object.entries(sessions).filter(([_, session]) => session.lockMode !== "session_unlock")
    );

    await this.setSessionMap(filteredSessions);
  }
}
export const localDb = new LinkLockLocalDb();