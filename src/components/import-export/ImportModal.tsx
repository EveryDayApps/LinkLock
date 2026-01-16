import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  FileJson,
  Lock,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import type { LinkRule, Profile } from "../../models/interfaces";
import {
  ExportImportManager,
  type ExportFile,
  type ExportMetadata,
  type ExportPayload,
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

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: {
    profiles?: Profile[];
    rules?: LinkRule[];
    options: {
      importProfiles: boolean;
      importRules: boolean;
      mergeStrategy: "replace" | "merge";
    };
  }) => Promise<{ success: boolean; error?: string }>;
  currentProfiles: Profile[];
  currentRules: LinkRule[];
}

type ImportStep =
  | "upload"
  | "preview"
  | "password"
  | "select"
  | "importing"
  | "success";

export function ImportModal({
  open,
  onOpenChange,
  onImport,
  currentProfiles,
  currentRules,
}: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [exportFile, setExportFile] = useState<ExportFile | null>(null);
  const [metadata, setMetadata] = useState<ExportMetadata | null>(null);
  const [exportedAt, setExportedAt] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPayload, setDecryptedPayload] =
    useState<ExportPayload | null>(null);
  const [importProfiles, setImportProfiles] = useState(true);
  const [importRules, setImportRules] = useState(true);
  const [mergeStrategy, setMergeStrategy] = useState<"replace" | "merge">(
    "replace"
  );
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    profiles: number;
    rules: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportManager = useRef(new ExportImportManager()).current;

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setExportFile(null);
    setMetadata(null);
    setExportedAt("");
    setPassword("");
    setShowPassword(false);
    setDecryptedPayload(null);
    setImportProfiles(true);
    setImportRules(true);
    setMergeStrategy("replace");
    setError("");
    setProgress(0);
    setImportResult(null);
    setIsDragOver(false);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const processFile = async (selectedFile: File) => {
    setError("");
    setFile(selectedFile);

    try {
      const content = await selectedFile.text();

      const parseResult = exportManager.parseExportFile(content);

      if (!parseResult.valid) {
        setError(parseResult.error || "Invalid backup file");
        return;
      }

      const parsed = JSON.parse(content) as ExportFile;
      setExportFile(parsed);
      setMetadata(parseResult.metadata || null);
      setExportedAt(parseResult.exportedAt || "");

      // Set default selections based on what's in the file
      if (parseResult.metadata) {
        setImportProfiles(parseResult.metadata.includesProfiles);
        setImportRules(parseResult.metadata.includesRules);
      }

      setStep("preview");
    } catch {
      setError("Failed to read file");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      if (
        droppedFile.type === "application/json" ||
        droppedFile.name.endsWith(".json")
      ) {
        processFile(droppedFile);
      } else {
        setError("Please select a JSON file");
      }
    }
  };

  const handleDecrypt = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    if (!exportFile) {
      setError("No file loaded");
      return;
    }

    setError("");

    const result = await exportManager.decryptExport(exportFile, password);

    if (!result.success || !result.data) {
      setError(result.error || "Decryption failed");
      return;
    }

    setDecryptedPayload(result.data);
    setStep("select");
  };

  const handleImport = async () => {
    if (!decryptedPayload) {
      setError("No decrypted data available");
      return;
    }

    // Must select at least one thing to import
    if (!importProfiles && !importRules) {
      setError("Please select at least one item to import");
      return;
    }

    setStep("importing");
    setProgress(20);

    const result = await onImport({
      profiles: importProfiles ? decryptedPayload.profiles : undefined,
      rules: importRules ? decryptedPayload.rules : undefined,
      options: {
        importProfiles,
        importRules,
        mergeStrategy,
      },
    });

    setProgress(100);

    if (!result.success) {
      setError(result.error || "Import failed");
      setStep("select");
      return;
    }

    setImportResult({
      profiles: importProfiles ? (decryptedPayload.profiles?.length || 0) : 0,
      rules: importRules ? (decryptedPayload.rules?.length || 0) : 0,
    });
    setStep("success");
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const renderUploadStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Backup
        </DialogTitle>
        <DialogDescription>
          Select a LinkLock backup file to restore your data.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <FileJson className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-2">
            Drag and drop your backup file here
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
            id="backup-file-input"
          />
          <Button variant="secondary" onClick={handleSelectFileClick}>
            Select File
          </Button>
        </div>

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
      </DialogFooter>
    </>
  );

  const renderPreviewStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          Backup Preview
        </DialogTitle>
        <DialogDescription>
          Review the backup contents before importing.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {/* File info */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm font-medium">{file?.name}</p>
          {exportedAt && (
            <p className="text-sm text-muted-foreground">
              Created: {formatDate(exportedAt)}
            </p>
          )}
        </div>

        {/* Contents summary */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Backup Contents</p>

          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Profiles</span>
              <p className="text-sm text-muted-foreground">
                {metadata?.includesProfiles
                  ? `${metadata.profileCount} profile${metadata.profileCount !== 1 ? "s" : ""}`
                  : "Not included"}
              </p>
            </div>
            {metadata?.includesProfiles && (
              <Check className="w-5 h-5 text-blue-500" />
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
              <Shield className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Rules</span>
              <p className="text-sm text-muted-foreground">
                {metadata?.includesRules
                  ? `${metadata.ruleCount} rule${metadata.ruleCount !== 1 ? "s" : ""}`
                  : "Not included"}
              </p>
            </div>
            {metadata?.includesRules && (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={() => setStep("upload")}>
          Back
        </Button>
        <Button onClick={() => setStep("password")}>
          <Lock className="w-4 h-4 mr-2" />
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
          Enter Password
        </DialogTitle>
        <DialogDescription>
          Enter the master password that was used when this backup was created.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="import-password">Master Password</Label>
          <div className="relative">
            <Input
              id="import-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter the backup password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pr-10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleDecrypt();
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
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={() => setStep("preview")}>
          Back
        </Button>
        <Button onClick={handleDecrypt} disabled={!password}>
          Decrypt
        </Button>
      </DialogFooter>
    </>
  );

  const renderSelectStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Select Data to Import
        </DialogTitle>
        <DialogDescription>
          Choose which items to restore and how to handle existing data.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {/* Warning about replacement */}
        {(currentProfiles.length > 0 || currentRules.length > 0) && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">Existing data found</p>
              <p className="text-muted-foreground">
                You have {currentProfiles.length} profile
                {currentProfiles.length !== 1 ? "s" : ""} and{" "}
                {currentRules.length} rule{currentRules.length !== 1 ? "s" : ""}{" "}
                that may be affected.
              </p>
            </div>
          </div>
        )}

        {/* Profiles */}
        {metadata?.includesProfiles && decryptedPayload?.profiles && (
          <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
            <Checkbox
              id="import-profiles"
              checked={importProfiles}
              onCheckedChange={(checked) =>
                setImportProfiles(checked as boolean)
              }
            />
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Profiles</span>
              <p className="text-sm text-muted-foreground">
                {decryptedPayload.profiles.length} profile
                {decryptedPayload.profiles.length !== 1 ? "s" : ""} in backup
              </p>
            </div>
          </label>
        )}

        {/* Rules */}
        {metadata?.includesRules && decryptedPayload?.rules && (
          <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
            <Checkbox
              id="import-rules"
              checked={importRules}
              onCheckedChange={(checked) => setImportRules(checked as boolean)}
            />
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
              <Shield className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Rules</span>
              <p className="text-sm text-muted-foreground">
                {decryptedPayload.rules.length} rule
                {decryptedPayload.rules.length !== 1 ? "s" : ""} in backup
              </p>
            </div>
          </label>
        )}

        {/* Merge strategy */}
        {(importProfiles || importRules) &&
          (currentProfiles.length > 0 || currentRules.length > 0) && (
            <div className="space-y-2">
              <Label>Import Strategy</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="radio"
                    name="merge-strategy"
                    value="replace"
                    checked={mergeStrategy === "replace"}
                    onChange={() => setMergeStrategy("replace")}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <span className="font-medium">Replace existing data</span>
                    <p className="text-sm text-muted-foreground">
                      Clear current data and import backup
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="radio"
                    name="merge-strategy"
                    value="merge"
                    checked={mergeStrategy === "merge"}
                    onChange={() => setMergeStrategy("merge")}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <span className="font-medium">Merge with existing</span>
                    <p className="text-sm text-muted-foreground">
                      Keep current data, add new items from backup
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={() => setStep("password")}>
          Back
        </Button>
        <Button onClick={handleImport}>
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogFooter>
    </>
  );

  const renderImportingStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 animate-pulse" />
          Importing...
        </DialogTitle>
        <DialogDescription>
          Please wait while your data is being restored.
        </DialogDescription>
      </DialogHeader>

      <div className="py-8 space-y-4">
        <Progress value={progress} className="w-full" />
        <p className="text-center text-sm text-muted-foreground">
          {progress < 50 ? "Preparing data..." : "Restoring backup..."}
        </p>
      </div>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-green-500">
          <Check className="w-5 h-5" />
          Import Complete
        </DialogTitle>
        <DialogDescription>
          Your data has been restored successfully.
        </DialogDescription>
      </DialogHeader>

      <div className="py-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        {importResult && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Successfully imported:</p>
            <ul className="space-y-1">
              {importResult.profiles > 0 && (
                <li>
                  {importResult.profiles} profile
                  {importResult.profiles !== 1 ? "s" : ""}
                </li>
              )}
              {importResult.rules > 0 && (
                <li>
                  {importResult.rules} rule{importResult.rules !== 1 ? "s" : ""}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleClose}>Done</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={step !== "importing"}>
        {step === "upload" && renderUploadStep()}
        {step === "preview" && renderPreviewStep()}
        {step === "password" && renderPasswordStep()}
        {step === "select" && renderSelectStep()}
        {step === "importing" && renderImportingStep()}
        {step === "success" && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
}
