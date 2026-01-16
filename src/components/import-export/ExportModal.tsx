import {
  Check,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Lock,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import type { LinkRule, Profile } from "../../models/interfaces";
import {
  ExportImportManager,
  type ExportOptions,
} from "../../services/exportImportManager";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
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
import { Progress } from "../ui/progress";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: Profile[];
  rules: LinkRule[];
  onVerifyPassword: (password: string) => Promise<boolean>;
}

type ExportStep = "select" | "password" | "exporting" | "success";

export function ExportModal({
  open,
  onOpenChange,
  profiles,
  rules,
  onVerifyPassword,
}: ExportModalProps) {
  const [step, setStep] = useState<ExportStep>("select");
  const [includeProfiles, setIncludeProfiles] = useState(true);
  const [includeRules, setIncludeRules] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const exportManager = new ExportImportManager();

  const resetState = () => {
    setStep("select");
    setIncludeProfiles(true);
    setIncludeRules(true);
    setPassword("");
    setShowPassword(false);
    setError("");
    setProgress(0);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleProceedToPassword = () => {
    // Must select at least one thing to export
    if (!includeProfiles && !includeRules) {
      setError("Please select at least one item to export");
      return;
    }
    setError("");
    setStep("password");
  };

  const handleExport = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");

    // Verify password first
    const isValid = await onVerifyPassword(password);
    if (!isValid) {
      setError("Invalid master password");
      return;
    }

    setStep("exporting");
    setProgress(20);

    const options: ExportOptions = {
      includeProfiles,
      includeRules,
    };

    setProgress(40);

    const result = await exportManager.createExport(
      password,
      profiles,
      rules,
      options
    );

    setProgress(80);

    if (!result.success || !result.data) {
      setError(result.error || "Export failed");
      setStep("password");
      return;
    }

    // Download the file
    exportManager.downloadExport(result.data);

    setProgress(100);
    setStep("success");
  };

  const renderSelectStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Backup
        </DialogTitle>
        <DialogDescription>
          Select what data to include in your backup file. Your master password
          will be used to encrypt the backup.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {/* Profiles */}
        <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
          <Checkbox
            id="include-profiles"
            checked={includeProfiles}
            onCheckedChange={(checked) =>
              setIncludeProfiles(checked as boolean)
            }
          />
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <span className="font-medium">Profiles</span>
            <p className="text-sm text-muted-foreground">
              {profiles.length} profile{profiles.length !== 1 ? "s" : ""}{" "}
              available
            </p>
          </div>
        </label>

        {/* Rules */}
        <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
          <Checkbox
            id="include-rules"
            checked={includeRules}
            onCheckedChange={(checked) => setIncludeRules(checked as boolean)}
          />
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
            <Shield className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex-1">
            <span className="font-medium">Rules</span>
            <p className="text-sm text-muted-foreground">
              {rules.length} rule{rules.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </label>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleProceedToPassword}>
          <FileJson className="w-4 h-4 mr-2" />
          Continue
        </Button>
      </DialogFooter>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Verify Password
        </DialogTitle>
        <DialogDescription>
          Enter your master password to encrypt the backup file. You will need
          this same password to import the backup later.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="export-password">Master Password</Label>
          <div className="relative">
            <Input
              id="export-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pr-10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleExport();
                }
              }}
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

        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm font-medium mb-2">Export Summary</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {includeProfiles && (
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-primary" />
                {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
              </li>
            )}
            {includeRules && (
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-primary" />
                {rules.length} rule{rules.length !== 1 ? "s" : ""}
              </li>
            )}
          </ul>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={() => setStep("select")}>
          Back
        </Button>
        <Button onClick={handleExport} disabled={!password}>
          <Download className="w-4 h-4 mr-2" />
          Export Backup
        </Button>
      </DialogFooter>
    </>
  );

  const renderExportingStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 animate-pulse" />
          Exporting...
        </DialogTitle>
        <DialogDescription>
          Please wait while your backup is being created.
        </DialogDescription>
      </DialogHeader>

      <div className="py-8 space-y-4">
        <Progress value={progress} className="w-full" />
        <p className="text-center text-sm text-muted-foreground">
          {progress < 50
            ? "Preparing data..."
            : progress < 80
              ? "Encrypting backup..."
              : "Finalizing..."}
        </p>
      </div>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-green-500">
          <Check className="w-5 h-5" />
          Export Complete
        </DialogTitle>
        <DialogDescription>
          Your backup has been downloaded successfully.
        </DialogDescription>
      </DialogHeader>

      <div className="py-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <FileJson className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Store your backup file in a safe location. You&apos;ll need your
          master password to import it.
        </p>
      </div>

      <DialogFooter>
        <Button onClick={handleClose}>Done</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={step !== "exporting"}>
        {step === "select" && renderSelectStep()}
        {step === "password" && renderPasswordStep()}
        {step === "exporting" && renderExportingStep()}
        {step === "success" && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
}
