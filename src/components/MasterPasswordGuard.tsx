import { useAuthManager } from "@/services/core";
import { triggerLocalStorageSync } from "@/utils/syncHelper";
import { AlertCircle, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MasterPasswordSetup } from "./MasterPasswordSetup";
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

export function MasterPasswordGuard({ children }: MasterPasswordGuardProps) {
  const authManager = useAuthManager();
  const [hasMasterPassword, setHasMasterPassword] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMasterPassword = async () => {
      setIsLoading(true);
      const hasPassword = await authManager.hasMasterPassword();
      setHasMasterPassword(hasPassword);
      setIsLoading(false);

      // If master password exists, trigger initial sync
      // This ensures data is synced when the app loads
      if (hasPassword) {
        triggerLocalStorageSync().catch((error) => {
          console.error("Failed to perform initial sync:", error);
        });
      }
    };

    checkMasterPassword();
  }, [authManager]);

  const handlePasswordSetupSuccess = async () => {
    // Recheck master password status after successful setup
    const hasPassword = await authManager.hasMasterPassword();
    setHasMasterPassword(hasPassword);
  };

  // Show loading state with skeleton
  if (isLoading) {
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

  // If master password exists, render children
  if (hasMasterPassword) {
    return <>{children}</>;
  }

  // Show overlay with master password setup
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
              Welcome to Link Lock
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              <div className="flex items-start gap-2 bg-amber-500/10 text-amber-500 px-4 py-3 rounded-md text-sm ">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  To start using Link Lock, you need to create a master password
                  first. This password will encrypt and protect all your data.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="">
            <MasterPasswordSetup
              onSuccess={handlePasswordSetupSuccess}
              showAsCard={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
