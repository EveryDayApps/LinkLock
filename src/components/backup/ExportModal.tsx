import type { ExportOptions } from "@/models/types";
import { AnimatePresence, motion } from "framer-motion";
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
import { ExportImportManager } from "../../services/exportImportManager";
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

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const successIconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 15 },
  },
};

const errorVariants = {
  hidden: { opacity: 0, y: -8, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: -8,
    height: 0,
    transition: { duration: 0.15 },
  },
};

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

    // Filter out the default profile from export - it should never be exported
    const profilesToExport = profiles.filter((p) => p.id !== "default");

    const result = await exportManager.createExport(
      password,
      profilesToExport,
      rules,
      options,
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
    <motion.div
      key="select"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
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

      <motion.div
        className="py-4 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profiles */}
        <motion.label
          className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
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
        </motion.label>

        {/* Rules */}
        <motion.label
          className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
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
        </motion.label>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm overflow-hidden"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <DialogFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleProceedToPassword}>
            <FileJson className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </motion.div>
      </DialogFooter>
    </motion.div>
  );

  const renderPasswordStep = () => (
    <motion.div
      key="password"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
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
              className={`pr-10 ${
                error ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
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

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm overflow-hidden"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

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
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleExport} disabled={!password}>
            <Download className="w-4 h-4 mr-2" />
            Export Backup
          </Button>
        </motion.div>
      </DialogFooter>
    </motion.div>
  );

  const renderExportingStep = () => (
    <motion.div
      key="exporting"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
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
        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {progress < 50
            ? "Preparing data..."
            : progress < 80
              ? "Encrypting backup..."
              : "Finalizing..."}
        </motion.p>
      </div>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      key="success"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-green-500">
          <motion.div
            variants={successIconVariants}
            initial="hidden"
            animate="visible"
          >
            <Check className="w-5 h-5" />
          </motion.div>
          Export Complete
        </DialogTitle>
        <DialogDescription>
          Your backup has been downloaded successfully.
        </DialogDescription>
      </DialogHeader>

      <motion.div
        className="py-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4"
          variants={successIconVariants}
          initial="hidden"
          animate="visible"
        >
          <FileJson className="w-8 h-8 text-green-500" />
        </motion.div>
        <motion.p
          className="text-sm text-muted-foreground"
          variants={itemVariants}
        >
          Store your backup file in a safe location. You&apos;ll need your
          master password to import it.
        </motion.p>
      </motion.div>

      <DialogFooter>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleClose}>Done</Button>
        </motion.div>
      </DialogFooter>
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-3xl"
        showCloseButton={step !== "exporting"}
      >
        <AnimatePresence mode="wait">
          {step === "select" && renderSelectStep()}
          {step === "password" && renderPasswordStep()}
          {step === "exporting" && renderExportingStep()}
          {step === "success" && renderSuccessStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
