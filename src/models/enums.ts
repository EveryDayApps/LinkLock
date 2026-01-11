export type BrowserType = "chrome" | "firefox" | "unknown";

export type RuleAction = "lock" | "block" | "redirect";

export type UnlockDuration = "always_ask" | "session" | number;

export type LockMode = "always_ask" | "timed_unlock" | "session_unlock";
