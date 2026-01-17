import { useAuthManager } from "@/services/core";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, EyeOff, Key, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MasterPasswordSetup } from "../components/MasterPasswordSetup";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
      newPassword
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

  return (
    <motion.div
      className="p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure extension preferences and security options
        </p>
      </motion.div>

      <div className="max-w-3xl space-y-6">
        {/* User ID Display */}
        <AnimatePresence>
          {hasMasterPassword && userId && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    User Information
                  </CardTitle>
                  <CardDescription>Your unique user identifier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      User ID:
                    </Label>
                    <motion.code
                      className="text-sm bg-muted px-2 py-1 rounded"
                      whileHover={{ scale: 1.02 }}
                    >
                      {userId}
                    </motion.code>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Password Setup */}
        {!hasMasterPassword ? (
          <motion.div variants={itemVariants}>
            <MasterPasswordSetup onSuccess={handlePasswordSetupSuccess} />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Master Password
                </CardTitle>
                <CardDescription>
                  Update your master password. All your data will remain
                  encrypted with the new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                  >
                    <Label htmlFor="oldPassword">Current Password</Label>
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
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showOldPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                  >
                    <Label htmlFor="newPassword">New Password</Label>
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
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.15,
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                  >
                    <Label htmlFor="confirmNewPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmNewPassword(!showConfirmNewPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        key="error"
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm"
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
                        className="bg-green-500/10 text-green-500 px-4 py-3 rounded-md text-sm flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
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
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
