import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

export default function UnlockScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Mock site data - in real implementation, this would come from the URL/rule
  const siteName = "example.com";
  const siteFavicon = "🔒";

  const handleUnlock = async () => {
    setIsUnlocking(true);
    // Unlock logic will be implemented here
    setTimeout(() => {
      setIsUnlocking(false);
    }, 1000);
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
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{siteFavicon}</span>
                  <h1 className="text-xl font-semibold text-foreground">
                    {siteName}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  This site is locked
                </p>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              <Button
                className="w-full"
                onClick={handleUnlock}
                disabled={!password.trim() || isUnlocking}
              >
                {isUnlocking ? "Unlocking..." : "Unlock"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    // Forgot password logic will be implemented here
                    console.log("Forgot password clicked");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
