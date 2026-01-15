import {
  useAuthManager,
  useDatabase,
  useReinitializeServices,
  useSyncHelper,
} from "@/services/core";
import { AlertCircle, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MasterPasswordSetup } from "./MasterPasswordSetup";
import { MasterPasswordVerify } from "./MasterPasswordVerify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";

interface MasterPasswordGuardProps {
  children: ReactNode;
}

type AuthState = "loading" | "needs_setup" | "needs_verification" | "unlocked";

export function MasterPasswordGuard({ children }: MasterPasswordGuardProps) {
  const authManager = useAuthManager();
  const syncHelper = useSyncHelper();

  const db = useDatabase();
  const reinitializeServices = useReinitializeServices();
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    const checkAuthState = async () => {
      // Check if master password exists in IndexedDB
      const hasPassword = await authManager.hasMasterPassword();

      if (!hasPassword) {
        // No password set - needs initial setup
        setAuthState("needs_setup");
        return;
      }

      // Password exists - unlock the app
      setAuthState("unlocked");

      syncHelper.triggerLocalStorageSync();
    };

    checkAuthState();
  }, [authManager, db, syncHelper]);

  const handleSetupSuccess = async () => {
    // After successful setup, reinitialize all services with the new password context
    console.log(
      "[MasterPasswordGuard] Master password set, reinitializing services..."
    );
    await reinitializeServices();
    console.log("[MasterPasswordGuard] Services reinitialized, unlocking app");

    setAuthState("unlocked");
  };

  const handleVerifySuccess = () => {
    // After successful verification, user is unlocked
    setAuthState("unlocked");
  };

  // Show loading state with skeleton
  if (authState === "loading") {
    return (
      <div className="dark min-h-screen bg-background text-foreground p-8">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          {/* Content skeleton */}
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // User is unlocked - render children
  if (authState === "unlocked") return <>{children}</>;

  // Show overlay for setup or verification
  return (
    <>
      {/* Blurred background */}
      <div className="dark min-h-screen bg-background text-foreground blur-sm pointer-events-none">
        {children}
      </div>

      {/* Overlay Dialog */}
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
              {authState === "needs_setup"
                ? "Welcome to Link Lock"
                : "Unlock Link Lock"}
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              {authState === "needs_setup" ? (
                <div className="flex items-start gap-2 bg-amber-500/10 text-amber-500 px-4 py-3 rounded-md text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    To start using Link Lock, you need to create a master
                    password first. This password will encrypt and protect all
                    your data.
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Enter your master password to unlock and access your protected
                  links.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div>
            {authState === "needs_setup" ? (
              <MasterPasswordSetup
                onSuccess={handleSetupSuccess}
                showAsCard={false}
              />
            ) : (
              <MasterPasswordVerify onSuccess={handleVerifySuccess} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
