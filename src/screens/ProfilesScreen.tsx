import { useProfileManager } from "@/services/core";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Edit,
  MoreVertical,
  Plus,
  Trash,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CreateProfileModal } from "../components/profiles/CreateProfileModal";
import { EditProfileModal } from "../components/profiles/EditProfileModal";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import type { Profile } from "../models/interfaces";

const MAX_PROFILES = 7;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      opacity: { duration: 0.3 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.93,
    y: 10,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.6, 1] as const,
    },
  },
};

const emptyStateVariants = {
  hidden: {
    opacity: 0,
    y: -15,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      delay: 0.1,
    },
  },
};

export function ProfilesTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const profileManager = useProfileManager();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  const loadProfiles = useCallback(async () => {
    const allProfiles = await profileManager.getAllProfiles();
    setProfiles(allProfiles);

    const activeProfile = await profileManager.getActiveProfile();
    setActiveProfileId(activeProfile?.id || null);
  }, [profileManager]);

  useEffect(() => {
    const initializeProfiles = async () => {
      try {
        // Manager should already be initialized from MasterPasswordGuard
        await loadProfiles();
      } catch (error) {
        console.error("[ProfilesTab] Failed to initialize:", error);
      }
    };

    initializeProfiles();
  }, [loadProfiles]);

  // Keyboard shortcut: Shift+P to open Create Profile modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Shift+P and ensure no input/textarea is focused
      if (
        event.shiftKey &&
        event.key === "P" &&
        !["INPUT", "TEXTAREA"].includes(
          (event.target as HTMLElement).tagName
        ) &&
        profiles.length < MAX_PROFILES
      ) {
        event.preventDefault();
        setCreateModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [profiles.length]);

  const handleCreateProfile = async (
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (profiles.length >= MAX_PROFILES) {
      return {
        success: false,
        error: `Maximum of ${MAX_PROFILES} profiles allowed`,
      };
    }
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Profiles</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Manage and switch between different profiles for various contexts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profiles.length >= MAX_PROFILES && (
            <span className="text-sm text-muted-foreground">
              {profiles.length}/{MAX_PROFILES} profiles
            </span>
          )}
          <Button
            onClick={() => setCreateModalOpen(true)}
            disabled={profiles.length >= MAX_PROFILES}
            title={
              profiles.length >= MAX_PROFILES
                ? `Maximum of ${MAX_PROFILES} profiles allowed`
                : undefined
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            New Profile
            <kbd className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-foreground/20 rounded">
              Shift+P
            </kbd>
          </Button>
        </div>
      </div>

      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {profiles.map((profile, index) => {
            const isActive = profile.id === activeProfileId;

            return (
              <motion.div
                key={profile.id}
                variants={itemVariants}
                custom={index}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-center">
                      <div className="flex items-center justify-between w-full p-2">
                        <div
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() =>
                            !isActive && handleSwitchProfile(profile.id)
                          }
                        >
                          <motion.div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? "bg-primary" : "bg-muted"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <User
                              className={`w-5 h-5 ${
                                isActive
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </motion.div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">
                                {profile.name}
                              </h3>
                              {isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>0 rules configured</span>
                              {!isActive && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary hover:underline">
                                    Click to activate
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!isActive && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSwitchProfile(profile.id)
                                    }
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Set as Active
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => openEditModal(profile)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(profile)}
                                disabled={isActive}
                                className={
                                  isActive
                                    ? ""
                                    : "text-destructive focus:text-destructive"
                                }
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {profiles.length === 0 && (
          <motion.div
            className="text-center py-16"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <User className="w-8 h-8 text-muted-foreground" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No profiles yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first profile to start managing different browsing
              contexts
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Profile
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

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
