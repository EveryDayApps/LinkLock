import { useAuthManager } from "@/services/core";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface MasterPasswordVerifyProps {
  onSuccess?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

const shakeVariants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut" as const,
    },
  },
};

export function MasterPasswordVerify({ onSuccess }: MasterPasswordVerifyProps) {
  const authManager = useAuthManager();
  const shakeControls = useAnimation();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      shakeControls.start("shake");
      return;
    }

    setIsSubmitting(true);

    const result = await authManager.verifyMasterPassword(password);

    if (result.success) {
      setPassword("");

      // Give a small delay to ensure database state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsSubmitting(false);
      onSuccess?.();
    } else {
      setError(result.error || "Incorrect password");
      setIsSubmitting(false);
      shakeControls.start("shake");
    }
  };

  return (
    <motion.form
      onSubmit={handleVerifyPassword}
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="space-y-2"
        variants={itemVariants}
        animate={shakeControls}
      >
        <Label htmlFor="verify-password">Master Password</Label>
        <motion.div className="relative" variants={shakeVariants}>
          <Input
            id="verify-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your master password"
            disabled={isSubmitting}
            className="pr-10"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm overflow-hidden"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <AnimatePresence mode="wait" initial={false}>
              {isSubmitting ? (
                <motion.span
                  key="verifying"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="mr-2"
                  >
                    <Lock className="w-4 h-4" />
                  </motion.div>
                  Verifying...
                </motion.span>
              ) : (
                <motion.span
                  key="unlock"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>
    </motion.form>
  );
}
