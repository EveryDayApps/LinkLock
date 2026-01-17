import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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

const errorVariants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: -4,
    height: 0,
    transition: { duration: 0.15 },
  },
};

const formVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.05,
    },
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

interface CreateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProfile: (name: string) => Promise<{ success: boolean; error?: string }>;
}

export function CreateProfileModal({
  open,
  onOpenChange,
  onCreateProfile,
}: CreateProfileModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Profile name cannot be empty");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await onCreateProfile(name.trim());

    setIsLoading(false);

    if (result.success) {
      setName("");
      setError("");
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to create profile");
    }
  };

  const handleCancel = () => {
    setName("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
          <DialogDescription>
            Create a new profile to organize your link rules. Each profile can
            have its own set of rules.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="mt-4 space-y-2"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Label htmlFor="profile-name">Profile Name</Label>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Input
              id="profile-name"
              placeholder="Work, Focus, Personal, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={error ? "border-destructive focus-visible:ring-destructive" : ""}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                className="text-sm text-destructive overflow-hidden"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <DialogFooter>
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Profile"}
              </Button>
            </motion.div>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
