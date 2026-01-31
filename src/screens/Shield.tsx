import { useAuthManager, useLocalDb } from "@/services/core/ServiceContext";
import type { ActiveTabSession } from "@/services/database/local_lb";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

export default function UnlockScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [session, setSession] = useState<ActiveTabSession | null>(null);
  const localDb = useLocalDb();
  const authManager = useAuthManager();

  useEffect(() => {
    const fetchSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlParam = urlParams.get("url");
      if (urlParam) {
        const decodedUrl = atob(urlParam);
        setUrl(decodedUrl);
        const fetchedSession = await localDb.getSession(decodedUrl);
        if (fetchedSession) setSession(fetchedSession);
      }
    };
    fetchSession();
  }, [localDb]);

  const handleUnlock = async () => {
    if (!url || !session || !password.trim()) return;
    setIsUnlocking(true);
    setError("");
    try {
      const result = await authManager.verifyMasterPassword(password);
      if (!result.success) {
        setError("Invalid password. Please try again.");
        return;
      }
      session.password = btoa(password);
      session.unlockedAt = Date.now();
      await localDb.setSession(session);
      window.open(url, "_self");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password.trim()) {
      handleUnlock();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-1">
                <h1
                  className="text-xl font-semibold text-foreground truncate max-w-full"
                  title={session?.url || "Site"}
                >
                  {session?.url || "Site"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  This site is locked
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleUnlock}
                disabled={!password.trim() || isUnlocking}
              >
                {isUnlocking ? "Unlocking..." : "Unlock"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
