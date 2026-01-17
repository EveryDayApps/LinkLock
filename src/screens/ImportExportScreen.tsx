import { ExportModal, ImportModal } from "@/components/import-export";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LinkRule, Profile } from "@/models/interfaces";
import {
  useAuthManager,
  useDatabase,
  useProfileManager,
  useRuleManager,
} from "@/services/core";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Download,
  FileJson,
  HardDrive,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

const MAX_PROFILES = 7;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

const securityItemVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

interface ImportExportScreenProps {
  onImportSuccess?: () => void;
}

export function ImportExportScreen({
  onImportSuccess,
}: ImportExportScreenProps) {
  const authManager = useAuthManager();
  const profileManager = useProfileManager();
  const ruleManager = useRuleManager();
  const db = useDatabase();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rules, setRules] = useState<LinkRule[]>([]);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Managers should already be initialized from MasterPasswordGuard
      // Load data in parallel
      const [loadedProfiles, loadedRules, hasPassword] = await Promise.all([
        profileManager.getAllProfiles(),
        ruleManager.getAllRules(),
        authManager.hasMasterPassword(),
      ]);

      setProfiles(loadedProfiles);
      setRules(loadedRules);
      setHasMasterPassword(hasPassword);
    };

    initialize();
  }, [profileManager, ruleManager, authManager]);

  const handleVerifyPassword = async (password: string): Promise<boolean> => {
    const result = await authManager.verifyMasterPassword(password);
    return result.success;
  };

  const handleImport = async (data: {
    profiles?: Profile[];
    rules?: LinkRule[];
    options: {
      importProfiles: boolean;
      importRules: boolean;
      mergeStrategy: "replace" | "merge";
    };
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const {
        profiles: importedProfiles,
        rules: importedRules,
        options,
      } = data;

      // Handle profiles
      if (options.importProfiles && importedProfiles) {
        if (options.mergeStrategy === "replace") {
          // Check if imported profiles exceed limit
          if (importedProfiles.length > MAX_PROFILES) {
            return {
              success: false,
              error: `Cannot import ${importedProfiles.length} profiles. Maximum of ${MAX_PROFILES} profiles allowed.`,
            };
          }
          // Clear existing profiles
          await db.profiles.clear();
        } else {
          // Merge mode: check if combined count exceeds limit
          const existingCount = profiles.length;
          const newProfiles = importedProfiles.filter(
            (p) => !profiles.some((ep) => ep.id === p.id)
          );
          if (existingCount + newProfiles.length > MAX_PROFILES) {
            return {
              success: false,
              error: `Cannot import. Total profiles would be ${
                existingCount + newProfiles.length
              }, but maximum is ${MAX_PROFILES}.`,
            };
          }
        }

        // Import profiles
        for (const profile of importedProfiles) {
          const existing = await db.profiles.get(profile.id);
          if (options.mergeStrategy === "merge" && existing) {
            // Skip existing profiles in merge mode
            continue;
          }
          const encrypted = await db.encryptProfile(profile);
          await db.profiles.put(encrypted);
        }
      }

      // Handle rules
      if (options.importRules && importedRules) {
        if (options.mergeStrategy === "replace") {
          // Clear existing rules
          await db.rules.clear();
        }

        // Import rules
        for (const rule of importedRules) {
          const existing = await db.rules.get(rule.id);
          if (options.mergeStrategy === "merge" && existing) {
            // Skip existing rules in merge mode
            continue;
          }
          const stored = await db.storeRule(rule, true);
          await db.rules.put(stored);
        }
      }

      // Reload data for the screen
      const [loadedProfiles, loadedRules] = await Promise.all([
        profileManager.getAllProfiles(),
        ruleManager.getAllRules(),
      ]);

      setProfiles(loadedProfiles);
      setRules(loadedRules);

      // Notify parent to refresh all tabs
      onImportSuccess?.();

      return { success: true };
    } catch (error) {
      console.error("[ImportExport] Import failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
      };
    }
  };

  return (
    <motion.div
      className="p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground">Backup</h1>
        <p className="text-muted-foreground mt-2">
          Backup and restore your profiles and rules securely
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        {/* Export Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Backup
              </CardTitle>
              <CardDescription>
                Create an encrypted backup of your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current data summary */}
              <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                <motion.div
                  className="flex items-center gap-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {profiles.length} Profile
                      {profiles.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available to export
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-center gap-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                    <Shield className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {rules.length} Rule{rules.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available to export
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  className="w-full"
                  onClick={() => setExportModalOpen(true)}
                  disabled={!hasMasterPassword}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Backup
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Import Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Backup
              </CardTitle>
              <CardDescription>Restore data from a backup file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import info */}
              <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                <motion.div
                  className="flex items-center gap-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <FileJson className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">JSON Backup File</p>
                    <p className="text-sm text-muted-foreground">
                      Supports .json format
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-center gap-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Password Required</p>
                    <p className="text-sm text-muted-foreground">
                      Original backup password needed
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => setImportModalOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Backup
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Security Info */}
      <motion.div variants={itemVariants}>
        <Card className="mt-6 max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Backup Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid gap-4 md:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="p-4 rounded-lg bg-muted/50"
                variants={securityItemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <p className="font-medium mb-1">AES-256 Encryption</p>
                <p className="text-sm text-muted-foreground">
                  Your backup file is encrypted with industry-standard
                  AES-256-GCM encryption.
                </p>
              </motion.div>
              <motion.div
                className="p-4 rounded-lg bg-muted/50"
                variants={securityItemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <p className="font-medium mb-1">Password Protected</p>
                <p className="text-sm text-muted-foreground">
                  Only someone with your master password can decrypt and restore
                  the backup.
                </p>
              </motion.div>
              <motion.div
                className="p-4 rounded-lg bg-muted/50"
                variants={securityItemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <p className="font-medium mb-1">Integrity Verified</p>
                <p className="text-sm text-muted-foreground">
                  SHA-256 checksums ensure your backup hasn&apos;t been tampered
                  with.
                </p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        profiles={profiles}
        rules={rules}
        onVerifyPassword={handleVerifyPassword}
      />

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
        currentProfiles={profiles}
        currentRules={rules}
      />
    </motion.div>
  );
}
