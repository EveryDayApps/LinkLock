import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  Edit,
  FileText,
  Filter,
  Lock,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { LinkRule, Profile } from "@/models/interfaces";
import { useProfileManager, useRuleManager } from "@/services/core";
import { RuleModal } from "../components/rules/RuleModal";
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
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";

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
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    x: -20,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
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

export function RulesScreen() {
  const [rules, setRules] = useState<LinkRule[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const ruleManager = useRuleManager();
  const profileManager = useProfileManager();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<LinkRule | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<LinkRule | null>(null);
  const [filterProfileId, setFilterProfileId] = useState<string>("all");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    const allRules = await ruleManager.getAllRules();
    const allProfiles = await profileManager.getAllProfiles();
    const activeProfile = await profileManager.getActiveProfile();

    setRules(allRules);
    setProfiles(allProfiles);
    setActiveProfileId(activeProfile?.id || null);
  }, [ruleManager, profileManager]);

  useEffect(() => {
    const initializeManagers = async () => {
      try {
        // Managers should already be initialized from MasterPasswordGuard
        await loadData();
      } catch (error) {
        console.error("[RulesScreen] Failed to initialize:", error);
      }
    };

    initializeManagers();
  }, [loadData]);

  // Keyboard shortcut: Shift+R to open Add Rule modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Shift+R and ensure no input/textarea is focused
      if (
        event.shiftKey &&
        event.key === "R" &&
        !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)
      ) {
        event.preventDefault();
        setAddModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSaveRule = async (
    rule: Omit<LinkRule, "id" | "createdAt" | "updatedAt">,
    ruleId?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const result = ruleId
      ? await ruleManager.updateRule(ruleId, rule)
      : await ruleManager.createRule(rule);

    if (result.success) {
      loadData();
    }
    return result;
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;

    const result = await ruleManager.deleteRule(ruleToDelete.id);
    if (result.success) {
      loadData();
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } else {
      alert(result.error);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    const result = await ruleManager.toggleRule(ruleId);
    if (result.success) {
      loadData();
    } else {
      alert(result.error);
    }
  };

  const openEditModal = (rule: LinkRule) => {
    setSelectedRule(rule);
    setEditModalOpen(true);
  };

  const openDeleteDialog = (rule: LinkRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "lock":
        return <Lock className="w-5 h-5 text-blue-500" />;
      case "block":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "redirect":
        return <Shield className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getLockModeLabel = (rule: LinkRule): string => {
    if (rule.action !== "lock" || !rule.lockOptions) return "";

    const { lockMode, timedDuration } = rule.lockOptions;

    switch (lockMode) {
      case "always_ask":
        return "Always Ask";
      case "timed_unlock":
        return `Unlock for ${timedDuration || 0} min`;
      case "session_unlock":
        return "Session Unlock";
      default:
        return "";
    }
  };

  const getProfileNames = (rule: LinkRule): string => {
    const ruleProfiles = profiles.filter((p) => rule.profileIds.includes(p.id));
    return ruleProfiles.map((p) => p.name).join(", ") || "No profiles";
  };

  const effectiveFilterId = filterProfileId;

  const filteredRules = rules.filter((rule) => {
    const matchesProfile =
      effectiveFilterId === "all" ||
      rule.profileIds.includes(effectiveFilterId);
    const matchesSearch =
      !searchQuery ||
      rule.urlPattern.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProfile && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 flex-shrink-0 ">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rules</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Manage link lock, block, and redirect rules
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
          <kbd className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-foreground/20 rounded">
            Shift+R
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search URLs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Filter className="w-4 h-4 text-muted-foreground ml-auto" />
        <Select value={effectiveFilterId} onValueChange={setFilterProfileId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by profile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Profiles</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
                {profile.id === activeProfileId && " (Active)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(effectiveFilterId !== "all" || searchQuery) && (
          <span className="text-sm text-muted-foreground">
            {filteredRules.length} rule{filteredRules.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <motion.div
        className="space-y-3 flex-1 overflow-y-auto p-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {filteredRules.map((rule, index) => (
            <motion.div
              key={rule.id}
              layout
              variants={itemVariants}
              custom={index}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card
                className={`border-2 transition-all duration-200 border-input hover:border-white hover:shadow-md ${
                  openDropdownId === rule.id
                    ? "border-white shadow-md"
                    : ""
                } ${!rule.enabled ? "opacity-60" : ""}`}
              >
                <CardContent className="flex items-center justify-center">
                  <div className="flex items-center justify-between w-full p-2">
                    <div className="flex items-center gap-4 flex-1">
                      <motion.div
                        className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {getActionIcon(rule.action)}
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {rule.urlPattern}
                          </h3>
                          {!rule.enabled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                              Disabled
                            </span>
                          )}
                          {rule.applyToAllSubdomains && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              All Subdomains
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="capitalize">{rule.action}</span>
                          {rule.action === "lock" && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getLockModeLabel(rule)}
                              </span>
                            </>
                          )}
                          {rule.action === "redirect" &&
                            rule.redirectOptions && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-xs">
                                  → {rule.redirectOptions.redirectUrl}
                                </span>
                              </>
                            )}
                          <span>•</span>
                          <span>{getProfileNames(rule)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                      </motion.div>
                      <DropdownMenu
                        open={openDropdownId === rule.id}
                        onOpenChange={(open) =>
                          setOpenDropdownId(open ? rule.id : null)
                        }
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(rule)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(rule)}
                            className="text-destructive focus:text-destructive"
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
          ))}
        </AnimatePresence>

        {filteredRules.length === 0 && (
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
              <FileText className="w-8 h-8 text-muted-foreground" />
            </motion.div>
            {rules.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No rules yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your first rule to start managing website access
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button onClick={() => setAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Rule
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No matching rules
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  No rules found for the selected profile
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="secondary"
                    onClick={() => setFilterProfileId("all")}
                  >
                    Clear Filter
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      <RuleModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        mode="add"
        onSave={handleSaveRule}
        profiles={profiles}
        activeProfileId={activeProfileId}
      />

      <RuleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        mode="edit"
        rule={selectedRule}
        onSave={handleSaveRule}
        profiles={profiles}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule for "
              {ruleToDelete?.urlPattern}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteDialogOpen(false);
                setRuleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteRule}>
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
