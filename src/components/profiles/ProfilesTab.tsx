import { Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ProfileManager } from "../../lib/profileManager";
import type { Profile } from "../../models/types";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CreateProfileModal } from "./CreateProfileModal";
import { EditProfileModal } from "./EditProfileModal";

export function ProfilesTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileManager] = useState(() => new ProfileManager());
  const [isInitialized, setIsInitialized] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    initializeProfiles();
  }, []);

  const initializeProfiles = async () => {
    const tempPassword = "temp-password-hash";
    await profileManager.initialize(tempPassword);
    loadProfiles();
    setIsInitialized(true);
  };

  const loadProfiles = () => {
    const allProfiles = profileManager.getAllProfiles();
    setProfiles(allProfiles);

    const activeProfile = profileManager.getActiveProfile();
    setActiveProfileId(activeProfile?.id || null);
  };

  const handleCreateProfile = async (
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await profileManager.createProfile(name);
    if (result.success) {
      loadProfiles();
    }
    return result;
  };

  const handleUpdateProfile = async (
    profileId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await profileManager.updateProfile(profileId, name);
    if (result.success) {
      loadProfiles();
    }
    return result;
  };

  const handleSwitchProfile = async (profileId: string) => {
    const result = await profileManager.switchProfile(profileId);
    if (result.success) {
      loadProfiles();
    } else {
      alert(result.error);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;

    const result = await profileManager.deleteProfile(profileToDelete.id);
    if (result.success) {
      loadProfiles();
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    } else {
      alert(result.error);
    }
  };

  const openEditModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setEditModalOpen(true);
  };

  const openDeleteDialog = (profile: Profile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Profiles</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Manage and switch between different profiles for various contexts
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Profile
        </Button>
      </div>

      <div className="space-y-3">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;

          return (
            <Card
              key={profile.id}
              className={`transition-all ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "hover:border-accent-foreground/20"
              }    `}
            >
              <CardContent className="flex items-center justify-center">
                <div className="flex items-center justify-between w-full p-2">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <User
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {profile.name}
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        0 rules configured
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSwitchProfile(profile.id)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(profile)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(profile)}
                      disabled={isActive}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {profiles.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No profiles yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first profile to start managing different browsing
              contexts
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Profile
            </Button>
          </div>
        )}
      </div>

      <CreateProfileModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateProfile={handleCreateProfile}
      />

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={selectedProfile}
        onUpdateProfile={handleUpdateProfile}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the profile "
              {profileToDelete?.name}"? This action cannot be undone and will
              delete all associated rules.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteDialogOpen(false);
                setProfileToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProfile}>
              Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
