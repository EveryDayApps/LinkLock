// ============================================
// Service Context
// React Context for dependency injection
// ============================================

import { InitializingScreen } from "@/components/InitializingScreen";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getServices, resetServices } from "./factory";
import type { Services } from "./types";

/**
 * Extended services with re-initialization capability
 */
interface ServicesWithReinitialize extends Services {
  reinitialize: () => Promise<void>;
}

/**
 * Context for accessing services throughout the app
 */
const ServiceContext = createContext<ServicesWithReinitialize | null>(null);

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
  const [serviceInstance, setServiceInstance] = useState<Services | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Reinitialize function that recreates all services
  const reinitialize = useCallback(async () => {
    console.log("[ServiceContext] Re-initializing services...");
    setIsInitialized(false);

    // Force recreation of services by resetting the singleton
    resetServices();

    const newServices = getServices();
    await newServices.db.initialize();

    setServiceInstance(newServices);
    setIsInitialized(true);

    console.log("[ServiceContext] Services re-initialized successfully");
  }, []);

  useEffect(() => {
    async function initializeServices() {
      // If services were provided (e.g., for testing), use them directly
      const servicesToUse = services ?? getServices();

      await servicesToUse.db.initialize();
      setServiceInstance(servicesToUse);
      setIsInitialized(true);
    }

    initializeServices();
  }, [services]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ServicesWithReinitialize | null>(() => {
    if (!serviceInstance) return null;
    return {
      ...serviceInstance,
      reinitialize,
    };
  }, [serviceInstance, reinitialize]);

  // Don't render children until database is initialized
  if (!isInitialized || !contextValue) return <InitializingScreen />;

  return (
    <ServiceContext.Provider value={contextValue}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access all services
 * @throws Error if used outside ServiceProvider
 */
export function useServices(): ServicesWithReinitialize {
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
 * Hook to access Database
 */
export function useDatabase() {
  const { db } = useServices();
  return db;
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
 * Hook to access service re-initialization function
 * Use this after critical changes like setting up master password
 */
export function useReinitializeServices() {
  const { reinitialize } = useServices();
  return reinitialize;
}
