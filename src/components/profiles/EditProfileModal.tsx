import { useEffect, useState } from "react";
import type { Profile } from "../../models/types";
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

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onUpdateProfile: (
    profileId: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onUpdateProfile,
}: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
    } else {
      setName("");
    }
    setError("");
  }, [profile, open]);

  const handleUpdate = async () => {
    if (!profile) return;

    if (!name.trim()) {
      setError("Profile name cannot be empty");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await onUpdateProfile(profile.id, name.trim());

    setIsLoading(false);

    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setError("");
    onOpenChange(false);
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update the profile name. This will not affect any associated rules.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Input
            label="Profile Name"
            placeholder="Work, Focus, Personal, etc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUpdate();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
