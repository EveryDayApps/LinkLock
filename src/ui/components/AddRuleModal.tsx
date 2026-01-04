import { ArrowRight, Ban, Lock, X } from "lucide-react";
import React from "react";
import { sendMessage } from "../../core/messages";

interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRuleModal({
  isOpen,
  onClose,
  onSuccess,
}: AddRuleModalProps) {
  const [urlPattern, setUrlPattern] = React.useState("");
  const [action, setAction] = React.useState<"lock" | "block" | "redirect">(
    "lock"
  );
  const [useCustomPassword, setUseCustomPassword] = React.useState(false);
  const [customPassword, setCustomPassword] = React.useState("");
  const [redirectUrl, setRedirectUrl] = React.useState("");
  const [lockMode, setLockMode] = React.useState<
    "always" | "timed" | "session"
  >("timed");
  const [timedDuration, setTimedDuration] = React.useState(3600);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await sendMessage("CREATE_RULE", {
        urlPattern,
        action,
        options: {
          customPassword: useCustomPassword ? customPassword : undefined,
          redirectUrl: action === "redirect" ? redirectUrl : undefined,
          lockMode,
          timedDuration: lockMode === "timed" ? timedDuration : undefined,
        },
      });

      if (response.success) {
        onSuccess();
        onClose();
        // Reset form
        setUrlPattern("");
        setAction("lock");
        setUseCustomPassword(false);
        setCustomPassword("");
        setRedirectUrl("");
        setLockMode("timed");
        setTimedDuration(3600);
      } else {
        setError(response.error || "Failed to create rule");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-text-primary">Add New Rule</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* URL Pattern */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Website URL Pattern
            </label>
            <input
              type="text"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none text-text-primary placeholder-text-muted"
              placeholder="example.com or *.example.com"
              required
            />
            <p className="mt-1 text-sm text-text-muted">
              Examples: example.com, mail.example.com, *.example.com
            </p>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Action
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAction("lock")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  action === "lock"
                    ? "border-accent-primary bg-accent-primary bg-opacity-10"
                    : "border-border hover:border-border-focus bg-bg-tertiary"
                }`}
              >
                <Lock
                  className={`w-6 h-6 mx-auto mb-2 ${
                    action === "lock"
                      ? "text-accent-primary"
                      : "text-text-secondary"
                  }`}
                />
                <div
                  className={`font-medium ${
                    action === "lock"
                      ? "text-text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  Lock
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAction("block")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  action === "block"
                    ? "border-accent-danger bg-accent-danger bg-opacity-10"
                    : "border-border hover:border-border-focus bg-bg-tertiary"
                }`}
              >
                <Ban
                  className={`w-6 h-6 mx-auto mb-2 ${
                    action === "block"
                      ? "text-accent-danger"
                      : "text-text-secondary"
                  }`}
                />
                <div
                  className={`font-medium ${
                    action === "block"
                      ? "text-text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  Block
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAction("redirect")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  action === "redirect"
                    ? "border-accent-warning bg-accent-warning bg-opacity-10"
                    : "border-border hover:border-border-focus bg-bg-tertiary"
                }`}
              >
                <ArrowRight
                  className={`w-6 h-6 mx-auto mb-2 ${
                    action === "redirect"
                      ? "text-accent-warning"
                      : "text-text-secondary"
                  }`}
                />
                <div
                  className={`font-medium ${
                    action === "redirect"
                      ? "text-text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  Redirect
                </div>
              </button>
            </div>
          </div>

          {/* Lock Options */}
          {action === "lock" && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Lock Mode
                </label>
                <select
                  value={lockMode}
                  onChange={(e) => setLockMode(e.target.value as any)}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:ring-2 focus:ring-accent-primary outline-none text-text-primary"
                >
                  <option value="always">Always Ask</option>
                  <option value="timed">Timed Unlock</option>
                  <option value="session">Session Unlock</option>
                </select>
              </div>

              {lockMode === "timed" && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Unlock Duration
                  </label>
                  <select
                    value={timedDuration}
                    onChange={(e) => setTimedDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:ring-2 focus:ring-accent-primary outline-none text-text-primary"
                  >
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                    <option value={1800}>30 minutes</option>
                    <option value={3600}>1 hour</option>
                    <option value={7200}>2 hours</option>
                  </select>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useCustomPassword"
                  checked={useCustomPassword}
                  onChange={(e) => setUseCustomPassword(e.target.checked)}
                  className="w-4 h-4 text-accent-primary border-border rounded focus:ring-accent-primary bg-bg-tertiary"
                />
                <label
                  htmlFor="useCustomPassword"
                  className="ml-2 text-sm text-text-primary"
                >
                  Use custom password for this site
                </label>
              </div>

              {useCustomPassword && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Custom Password
                  </label>
                  <input
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:ring-2 focus:ring-accent-primary outline-none text-text-primary placeholder-text-muted"
                    placeholder="Enter custom password"
                    required
                  />
                </div>
              )}
            </>
          )}

          {/* Redirect Options */}
          {action === "redirect" && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Redirect URL
              </label>
              <input
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:ring-2 focus:ring-accent-primary outline-none text-text-primary placeholder-text-muted"
                placeholder="https://example.com"
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-accent-danger bg-opacity-10 border border-accent-danger rounded-lg text-accent-danger text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border-focus text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-accent-primary text-black rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
