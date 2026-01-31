import { useAuthManager } from "@/services/core";
import { localDb } from "@/services/database/local_lb";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Monitor,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MasterPasswordSetup } from "../components/MasterPasswordSetup";
import { useTheme } from "../components/theme-provider";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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

const messageVariants = {
  hidden: { opacity: 0, y: -8, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    height: 0,
    transition: { duration: 0.15 },
  },
};

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const authManager = useAuthManager();
  const [hasMasterPassword, setHasMasterPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Change password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Status states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear cache states
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [cacheError, setCacheError] = useState("");

  useEffect(() => {
    const checkMasterPassword = async () => {
      const hasPassword = await authManager.hasMasterPassword();
      setHasMasterPassword(hasPassword);

      if (hasPassword) {
        const userIdValue = await authManager.getUserId();
        setUserId(userIdValue);
      }
    };

    checkMasterPassword();
  }, [authManager]);

  const handlePasswordSetupSuccess = async () => {
    const hasPassword = await authManager.hasMasterPassword();
    setHasMasterPassword(hasPassword);
    if (hasPassword) {
      const userIdValue = await authManager.getUserId();
      setUserId(userIdValue);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }

    setIsSubmitting(true);

    const result = await authManager.changeMasterPassword(
      oldPassword,
      newPassword,
    );

    if (result.success) {
      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(result.error || "Failed to change password");
    }

    setIsSubmitting(false);
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    setCacheCleared(false);
    setCacheError("");

    try {
      await localDb.clearAllSessions();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (err) {
      setCacheError("Failed to clear cache. Please try again.");
      setTimeout(() => setCacheError(""), 3000);
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <motion.div
      className="h-full flex flex-col p-8 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex justify-between items-center mb-8 flex-shrink-0"
        variants={itemVariants}
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Configure extension preferences and security options
          </p>
        </div>
      </motion.div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {/* User ID Display */}
        {/* <AnimatePresence>
          {hasMasterPassword && userId && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-2 transition-all duration-200 border-input hover:border-white hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">User Information</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">User ID:</span>
                        <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                          {userId}
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence> */}

        {/* Master Password Setup */}
        {!hasMasterPassword ? (
          <motion.div variants={itemVariants}>
            <MasterPasswordSetup onSuccess={handlePasswordSetupSuccess} />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card className="border-2 transition-all duration-200 border-input hover:border-white hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      Change Master Password
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update your master password. All your data will remain
                      encrypted.
                    </p>

                    <form
                      onSubmit={handleChangePassword}
                      className="mt-4 space-y-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-1">
                        <div className="space-y-2">
                          <Label htmlFor="oldPassword" className="text-sm">
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="oldPassword"
                              type={showOldPassword ? "text" : "password"}
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              placeholder="Enter current password"
                              disabled={isSubmitting}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowOldPassword(!showOldPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showOldPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-sm">
                            New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              disabled={isSubmitting}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Minimum 8 characters
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="confirmNewPassword"
                            className="text-sm"
                          >
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmNewPassword"
                              type={
                                showConfirmNewPassword ? "text" : "password"
                              }
                              value={confirmNewPassword}
                              onChange={(e) =>
                                setConfirmNewPassword(e.target.value)
                              }
                              placeholder="Confirm new password"
                              disabled={isSubmitting}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmNewPassword(
                                  !showConfirmNewPassword,
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {error && (
                          <motion.div
                            key="error"
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm"
                          >
                            {error}
                          </motion.div>
                        )}

                        {success && (
                          <motion.div
                            key="success"
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-green-500/10 text-green-500 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            {success}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        {isSubmitting
                          ? "Changing password..."
                          : "Change Password"}
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Appearance Section */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 transition-all duration-200 border-input hover:border-white hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <motion.div
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sun className="w-5 h-5 text-muted-foreground" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Appearance</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize how Link Lock looks on your device
                  </p>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { value: "light", icon: Sun, label: "Light" },
                      { value: "dark", icon: Moon, label: "Dark" },
                      { value: "system", icon: Monitor, label: "System" },
                    ].map(({ value, icon: Icon, label }) => (
                      <motion.button
                        key={value}
                        onClick={() =>
                          setTheme(value as "light" | "dark" | "system")
                        }
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                          theme === value
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-muted-foreground bg-background"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {theme === value && (
                          <motion.div
                            className="absolute top-2 right-2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          >
                            <Check className="w-4 h-4 text-primary" />
                          </motion.div>
                        )}
                        <Icon
                          className={`w-6 h-6 ${theme === value ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span
                          className={`text-sm font-medium ${theme === value ? "text-primary" : "text-foreground"}`}
                        >
                          {label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clear Cache Section */}
        <div>
          <Card className="border-2 transition-all duration-200 border-input hover:border-white hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Clear Cache
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clear all active sessions and cached data
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleClearCache}
                      disabled={isClearingCache}
                    >
                      {isClearingCache ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {isClearingCache ? "Clearing..." : "Clear Cache"}
                    </Button>
                  </div>

                  {cacheCleared && (
                    <div className="mt-3 bg-green-500/10 text-green-500 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Cache cleared successfully!
                    </div>
                  )}

                  {cacheError && (
                    <div className="mt-3 bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
                      {cacheError}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
