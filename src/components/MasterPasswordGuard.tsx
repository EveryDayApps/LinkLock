import { useAuthManager } from "@/services/core";
import { AlertCircle, Lock } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { MasterPasswordSetup } from "./MasterPasswordSetup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

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
    };

    checkMasterPassword();
  }, [authManager]);

  const handlePasswordSetupSuccess = async () => {
    // Recheck master password status after successful setup
    const hasPassword = await authManager.hasMasterPassword();
    setHasMasterPassword(hasPassword);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
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
