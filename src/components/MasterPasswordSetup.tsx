import { useAuthManager } from "@/services/core";
import { triggerLocalStorageSync } from "@/utils/syncHelper";
import { Check, Eye, EyeOff, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface MasterPasswordSetupProps {
  onSuccess?: () => void;
  showAsCard?: boolean;
}

export function MasterPasswordSetup({
  onSuccess,
  showAsCard = true,
}: MasterPasswordSetupProps) {
  const authManager = useAuthManager();

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    const result = await authManager.setupMasterPassword(password);

    if (result.success) {
      setPassword("");
      setConfirmPassword("");

      // Give a small delay to ensure database writes are complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Sync local storage with initial data
      // Note: We sync BEFORE calling onSuccess to ensure data is ready
      try {
        await triggerLocalStorageSync();
      } catch (syncError) {
        console.error("Sync failed after password setup:", syncError);
        // Continue anyway - sync can happen later
      }

      setIsSubmitting(false);

      // Call success callback after sync completes
      onSuccess?.();
    } else {
      setError(result.error || "Failed to set master password");
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSetupPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Master Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter master password"
            disabled={isSubmitting}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm master password"
            disabled={isSubmitting}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-500 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        <Lock className="w-4 h-4 mr-2" />
        {isSubmitting ? "Setting up..." : "Set Master Password"}
      </Button>
    </form>
  );

  if (!showAsCard) {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Set Master Password
        </CardTitle>
        <CardDescription>
          Create a secure master password to protect your data. This password
          will be used to encrypt all your profiles and rules.
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
