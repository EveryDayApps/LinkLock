// ============================================
// Logger Configuration
// Centralized logging using loglevel with enable/disable control
// ============================================

import log from "loglevel";

// Set default log level
const DEFAULT_LOG_LEVEL: log.LogLevelDesc = "debug";

// Control flag for enabling/disabling logs
let loggingEnabled = true;

/**
 * Initialize the logger with the current logging state
 */
function initializeLogger(): void {
  if (loggingEnabled) {
    log.setLevel(DEFAULT_LOG_LEVEL);
  } else {
    log.setLevel("silent");
  }
}

// Initialize on module load
initializeLogger();

/**
 * Enable or disable all logging
 * @param enabled - If true, logs will be shown; if false, all logs are silenced
 */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
  initializeLogger();
}

/**
 * Check if logging is currently enabled
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled;
}

/**
 * Create a prefixed logger for a specific module
 * @param prefix - The prefix to add to all log messages (e.g., "[DB]", "[Listener]")
 */
export function createLogger(prefix: string) {
  return {
    debug: (...args: unknown[]) => log.debug(prefix, ...args),
    info: (...args: unknown[]) => log.info(prefix, ...args),
    warn: (...args: unknown[]) => log.warn(prefix, ...args),
    error: (...args: unknown[]) => log.error(prefix, ...args),
    trace: (...args: unknown[]) => log.trace(prefix, ...args),
  };
}

// Export the base log instance for advanced usage
export { log };

// Pre-configured loggers for common modules
export const dbLogger = createLogger("[DB] 📦");
export const listenerLogger = createLogger("[Listener] 🎧");
export const backgroundLogger = createLogger("[Background] 🔧");
