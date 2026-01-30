// ============================================
// Services Module
// Central export for all DI-related functionality
// ============================================

// Types
export type { ServiceOptions, Services } from "./types";

// Factory
export { createServices, getServices, resetServices } from "./factory";

// React Context & Hooks
export {
  ServiceProvider,
  useAuthManager,
  useDatabase,
  useEncryptionService,
  usePasswordService,
  useProfileManager,
  useReinitializeServices,
  useRuleEvaluator,
  useRuleManager,
  useServices,
  useUnlockSessionManager
} from "./ServiceContext";

