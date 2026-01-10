import { useState } from "react";
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
import { Button } from "../ui/button";

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

        <div className="mt-4 space-y-2">
          <Label htmlFor="profile-name">Profile Name</Label>
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
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
