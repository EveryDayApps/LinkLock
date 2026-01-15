import { useAuthManager } from "@/services/core";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface MasterPasswordVerifyProps {
  onSuccess?: () => void;
}

export function MasterPasswordVerify({ onSuccess }: MasterPasswordVerifyProps) {
  const authManager = useAuthManager();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsSubmitting(true);

    const result = await authManager.verifyMasterPassword(password);

    if (result.success) {
      setPassword("");

      // Give a small delay to ensure database state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsSubmitting(false);
      onSuccess?.();
    } else {
      setError(result.error || "Incorrect password");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleVerifyPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verify-password">Master Password</Label>
        <div className="relative">
          <Input
            id="verify-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your master password"
            disabled={isSubmitting}
            className="pr-10"
            autoFocus
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
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Lock className="w-4 h-4 mr-2 animate-pulse" />
            Verifying...
          </>
        ) : (
          <>
            <Unlock className="w-4 h-4 mr-2" />
            Unlock
          </>
        )}
      </Button>
    </form>
  );
}
