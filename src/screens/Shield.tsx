// ============================================
// UnlockScreen - Password verification for locked URLs
// Reads URL parameters, verifies password, and redirects to original URL
// ============================================

import { AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import type { LockMode } from "../models/enums";
import { browser } from "../utils/get-browser";
import { UNLOCK_MESSAGE_TYPE } from "../models/constants";

// ============================================
// Types
// ============================================

interface UnlockParams {
  url: string;
  urlPattern: string;
  mode: LockMode;
  duration?: number;
  hasCustomPassword: boolean;
}

interface UnlockResponse {
  success: boolean;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse URL parameters from the current page URL
 */
function parseUrlParams(): UnlockParams | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const urlPattern = params.get("pattern") || "";
    const mode = (params.get("mode") as LockMode) || "always_ask";
    const duration = params.get("duration")
      ? parseInt(params.get("duration")!, 10)
      : undefined;
    const hasCustomPassword = params.get("custom") === "true";

    if (!url) {
      return null;
    }

    return {
      url,
      urlPattern,
      mode,
      duration,
      hasCustomPassword,
    };
  } catch {
    return null;
  }
}

/**
 * Extract hostname from URL for display
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Get favicon URL for a site
 */
function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}

// ============================================
// UnlockScreen Component
// ============================================

export default function UnlockScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<UnlockParams | null>(null);

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = parseUrlParams();
    setParams(urlParams);

    if (!urlParams) {
      setError("Invalid unlock request. Missing URL parameter.");
    }
  }, []);

  /**
   * Handle unlock button click
   */
  const handleUnlock = async () => {
    if (!params || !password.trim()) return;

    setIsUnlocking(true);
    setError(null);

    try {
      // Send unlock request to background script
      const response = (await browser.runtime.sendMessage({
        type: UNLOCK_MESSAGE_TYPE,
        payload: {
          action: "verify",
          password,
          urlPattern: params.urlPattern,
          originalUrl: params.url,
          lockMode: params.mode,
          timedDuration: params.duration,
          hasCustomPassword: params.hasCustomPassword,
        },
      })) as UnlockResponse;

      if (response.success) {
        // Redirect to the original URL
        window.location.href = params.url;
      } else {
        setError(response.error || "Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setError("An error occurred while verifying the password.");
    } finally {
      setIsUnlocking(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password.trim()) {
      handleUnlock();
    }
  };

  /**
   * Handle go back button
   */
  const handleGoBack = () => {
    window.history.back();
  };

  // Show error state if params are invalid
  if (!params) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold text-foreground">
                    Invalid Request
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {error || "This unlock page was accessed incorrectly."}
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={handleGoBack}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const siteName = getHostname(params.url);
  const faviconUrl = getFaviconUrl(params.url);

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
                  {faviconUrl && (
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-5 h-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <h1 className="text-xl font-semibold text-foreground">
                    {siteName}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  This site is protected by LinkLock
                </p>
                {params.hasCustomPassword && (
                  <p className="text-xs text-muted-foreground">
                    Using custom password for this site
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    params.hasCustomPassword
                      ? "Enter site password"
                      : "Enter master password"
                  }
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
                {isUnlocking ? "Verifying..." : "Unlock"}
              </Button>

              {/* Lock Mode Info */}
              {params.mode !== "always_ask" && (
                <p className="text-xs text-center text-muted-foreground">
                  {params.mode === "session_unlock"
                    ? "Will stay unlocked for this session"
                    : params.mode === "timed_unlock" && params.duration
                      ? `Will stay unlocked for ${params.duration} minutes`
                      : ""}
                </p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Go back
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
