import { AnimatePresence, motion } from "framer-motion";
import { Clock, Lock, Shield, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { LockMode, RuleAction } from "../../models/enums";
import type { LinkRule, Profile } from "../../models/interfaces";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { MultiSelect, type MultiSelectOption } from "../ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

const actionCardVariants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
  tap: { scale: 0.98 },
  selected: {
    scale: 1,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
};

const optionsPanelVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    marginTop: 16,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn" as const,
    },
  },
};

const errorVariants = {
  hidden: { opacity: 0, y: -8, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    height: 0,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

interface AddRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRule: (
    rule: Omit<LinkRule, "id" | "createdAt" | "updatedAt">
  ) => Promise<{ success: boolean; error?: string }>;
  profiles: Profile[];
  activeProfileId: string | null;
}

export function AddRuleModal({
  open,
  onOpenChange,
  onAddRule,
  profiles,
  activeProfileId,
}: AddRuleModalProps) {
  const [urlPattern, setUrlPattern] = useState("");
  const [action, setAction] = useState<RuleAction>("lock");
  const [applyToAllSubdomains, setApplyToAllSubdomains] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  // Lock options
  const [lockMode, setLockMode] = useState<LockMode>("always_ask");
  const [timedDuration, setTimedDuration] = useState<number>(5);
  const [customPassword, setCustomPassword] = useState("");

  // Redirect options
  const [redirectUrl, setRedirectUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && activeProfileId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProfiles([activeProfileId]);
    }
  }, [open, activeProfileId]);

  const resetForm = () => {
    setUrlPattern("");
    setAction("lock");
    setApplyToAllSubdomains(false);
    setSelectedProfiles(activeProfileId ? [activeProfileId] : []);
    setLockMode("always_ask");
    setTimedDuration(5);
    setCustomPassword("");
    setRedirectUrl("");
    setError("");
    setLoading(false);
  };

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!urlPattern.trim()) {
      setError("URL pattern is required");
      return;
    }

    if (selectedProfiles.length === 0) {
      setError("At least one profile must be selected");
      return;
    }

    if (action === "redirect" && !redirectUrl.trim()) {
      setError("Redirect URL is required for redirect action");
      return;
    }

    if (
      action === "lock" &&
      lockMode === "timed_unlock" &&
      timedDuration <= 0
    ) {
      setError("Timed duration must be greater than 0");
      return;
    }

    setLoading(true);

    const newRule: Omit<LinkRule, "id" | "createdAt" | "updatedAt"> = {
      urlPattern: urlPattern.trim(),
      action,
      applyToAllSubdomains,
      profileIds: selectedProfiles,
      enabled: true, // Always enabled by default, user can toggle from list
      lockOptions:
        action === "lock"
          ? {
              lockMode,
              timedDuration:
                lockMode === "timed_unlock" ? timedDuration : undefined,
              customPassword: customPassword.trim() || undefined,
            }
          : undefined,
      redirectOptions:
        action === "redirect"
          ? {
              redirectUrl: redirectUrl.trim(),
            }
          : undefined,
    };

    const result = await onAddRule(newRule);

    if (result.success) {
      resetForm();
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to create rule");
    }

    setLoading(false);
  };

  const profileOptions: MultiSelectOption[] = profiles.map((profile) => ({
    label: profile.name,
    value: profile.id,
  }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>Add New Rule</DialogTitle>
          <DialogDescription>
            Create a new rule to lock, block, or redirect a website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL Pattern */}
          <div className="space-y-2">
            <Label htmlFor="urlPattern">
              URL Pattern <span className="text-destructive">*</span>
            </Label>
            <Input
              id="urlPattern"
              placeholder="example.com or *.example.com"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter a domain (e.g., example.com) or use wildcards
              (*.example.com)
            </p>
          </div>

          {/* Apply to All Subdomains */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="subdomains">Apply to All Subdomains</Label>
              <p className="text-xs text-muted-foreground">
                Match all subdomains (e.g., mail.google.com, drive.google.com
                for google.com)
              </p>
            </div>
            <Switch
              id="subdomains"
              checked={applyToAllSubdomains}
              onCheckedChange={setApplyToAllSubdomains}
            />
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <Label>
              Action Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                type="button"
                onClick={() => setAction("lock")}
                className={`relative p-4 rounded-lg border-2 transition-colors ${
                  action === "lock"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                variants={actionCardVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                animate={action === "lock" ? "selected" : "idle"}
              >
                <Lock className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Lock</p>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setAction("block")}
                className={`relative p-4 rounded-lg border-2 transition-colors ${
                  action === "block"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                variants={actionCardVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                animate={action === "block" ? "selected" : "idle"}
              >
                <XCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Block</p>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setAction("redirect")}
                className={`relative p-4 rounded-lg border-2 transition-colors ${
                  action === "redirect"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                variants={actionCardVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                animate={action === "redirect" ? "selected" : "idle"}
              >
                <Shield className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Redirect</p>
              </motion.button>
            </div>
          </div>

          {/* Lock Options */}
          <AnimatePresence>
            {action === "lock" && (
              <motion.div
                key="lock-options"
                className="space-y-4 p-4 rounded-lg border border-border bg-muted/50 overflow-hidden"
                variants={optionsPanelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h4 className="font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Lock Options
                </h4>

                {/* Lock Mode */}
                <div className="space-y-2">
                  <Label htmlFor="lockMode">Lock Mode</Label>
                  <Select
                    value={lockMode}
                    onValueChange={(v) => setLockMode(v as LockMode)}
                  >
                    <SelectTrigger id="lockMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always_ask">Always Ask</SelectItem>
                      <SelectItem value="timed_unlock">Timed Unlock</SelectItem>
                      <SelectItem value="session_unlock">
                        Session Unlock
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {lockMode === "always_ask" &&
                      "Require password on every visit"}
                    {lockMode === "timed_unlock" &&
                      "Unlock for a specific duration"}
                    {lockMode === "session_unlock" &&
                      "Unlock until browser restart"}
                  </p>
                </div>

                {/* Timed Duration */}
                <AnimatePresence>
                  {lockMode === "timed_unlock" && (
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="timedDuration">
                        Duration (minutes){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Input
                          id="timedDuration"
                          type="number"
                          min="1"
                          value={timedDuration}
                          onChange={(e) =>
                            setTimedDuration(Number(e.target.value))
                          }
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Custom Password */}
                <div className="space-y-2">
                  <Label htmlFor="customPassword">
                    Custom Password (Optional)
                  </Label>
                  <Input
                    id="customPassword"
                    type="password"
                    placeholder="Leave empty to use master password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a unique password for this rule, or use master password
                  </p>
                </div>
              </motion.div>
            )}

            {/* Redirect Options */}
            {action === "redirect" && (
              <motion.div
                key="redirect-options"
                className="space-y-4 p-4 rounded-lg border border-border bg-muted/50 overflow-hidden"
                variants={optionsPanelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Redirect Options
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="redirectUrl">
                    Redirect URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="redirectUrl"
                    placeholder="https://example.com or about:blank"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Selection */}
          <div className="space-y-2">
            <Label>
              Apply to Profiles <span className="text-destructive">*</span>
            </Label>
            <MultiSelect
              options={profileOptions}
              selected={selectedProfiles}
              onChange={setSelectedProfiles}
              placeholder="Select profiles..."
            />
            <p className="text-xs text-muted-foreground">
              Select one or more profiles where this rule should be active
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="p-3 rounded-lg bg-destructive/10 border border-destructive text-sm text-destructive overflow-hidden"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
