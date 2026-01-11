// ============================================
// Services Module
// Central export for all DI-related functionality
// ============================================

// Types
export type { Services, ServiceOptions } from "./types";

// Factory
export { createServices, getServices, resetServices } from "./factory";

// React Context & Hooks
export {
  ServiceProvider,
  useServices,
  useAuthManager,
  useProfileManager,
  useRuleManager,
  useRuleEvaluator,
  useUnlockSessionManager,
  useStorageService,
  usePasswordService,
  useEncryptionService,
  useDatabase,
} from "./ServiceContext";
