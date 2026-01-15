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
  useLocalStorageSyncService,
  usePasswordService,
  useProfileManager,
  useReinitializeServices,
  useRuleEvaluator,
  useRuleManager,
  useServices,
  useStorageService,
  useSyncHelper,
  useUnlockSessionManager,
} from "./ServiceContext";
