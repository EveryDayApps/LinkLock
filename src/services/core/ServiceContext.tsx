// ============================================
// Service Context
// React Context for dependency injection
// ============================================

import { createContext, useContext, type ReactNode } from "react";
import { getServices } from "./factory";
import type { Services } from "./types";

/**
 * Context for accessing services throughout the app
 */
const ServiceContext = createContext<Services | null>(null);

/**
 * Props for ServiceProvider
 */
interface ServiceProviderProps {
  children: ReactNode;
  services?: Services; // Optional: useful for testing
}

/**
 * Provider component that makes services available to all child components
 */
export function ServiceProvider({ children, services }: ServiceProviderProps) {
  // Use provided services or create default ones
  const serviceInstance = services || getServices();

  return (
    <ServiceContext.Provider value={serviceInstance}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access all services
 * @throws Error if used outside ServiceProvider
 */
export function useServices(): Services {
  const services = useContext(ServiceContext);

  if (!services) {
    throw new Error(
      "useServices must be used within a ServiceProvider. " +
        "Make sure your component is wrapped with <ServiceProvider>."
    );
  }

  return services;
}

/**
 * Hook to access AuthManager
 */
export function useAuthManager() {
  const { authManager } = useServices();
  return authManager;
}

/**
 * Hook to access ProfileManager
 */
export function useProfileManager() {
  const { profileManager } = useServices();
  return profileManager;
}

/**
 * Hook to access RuleManager
 */
export function useRuleManager() {
  const { ruleManager } = useServices();
  return ruleManager;
}

/**
 * Hook to access RuleEvaluator
 */
export function useRuleEvaluator() {
  const { ruleEvaluator } = useServices();
  return ruleEvaluator;
}

/**
 * Hook to access UnlockSessionManager
 */
export function useUnlockSessionManager() {
  const { unlockSessionManager } = useServices();
  return unlockSessionManager;
}

/**
 * Hook to access StorageService
 */
export function useStorageService() {
  const { storageService } = useServices();
  return storageService;
}

/**
 * Hook to access PasswordService
 */
export function usePasswordService() {
  const { passwordService } = useServices();
  return passwordService;
}

/**
 * Hook to access EncryptionService
 */
export function useEncryptionService() {
  const { encryptionService } = useServices();
  return encryptionService;
}

/**
 * Hook to access Database
 */
export function useDatabase() {
  const { db } = useServices();
  return db;
}

/**
 * Hook to access LocalStorageSyncService
 */
export function useLocalStorageSyncService() {
  const { localStorageSyncService } = useServices();
  return localStorageSyncService;
}
