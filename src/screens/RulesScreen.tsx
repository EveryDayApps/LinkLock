import {
  Clock,
  Edit,
  FileText,
  Lock,
  MoreVertical,
  Plus,
  Shield,
  Trash,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { LinkRule, Profile } from "@/models/interfaces";
import { useProfileManager, useRuleManager } from "@/services/core";
import { AddRuleModal } from "../components/rules/AddRuleModal";
import { EditRuleModal } from "../components/rules/EditRuleModal";
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
import { Switch } from "../components/ui/switch";

export function RulesScreen() {
  const [rules, setRules] = useState<LinkRule[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const ruleManager = useRuleManager();
  const profileManager = useProfileManager();
  const [isInitialized, setIsInitialized] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<LinkRule | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<LinkRule | null>(null);

  useEffect(() => {
    initializeManagers();
  }, []);

  const initializeManagers = async () => {
    const tempPassword = "temp-password-hash";
    await ruleManager.initialize(tempPassword);
    await profileManager.initialize(tempPassword);
    loadData();
    setIsInitialized(true);
  };

  const loadData = async () => {
    const allRules = await ruleManager.getAllRules();
    const allProfiles = await profileManager.getAllProfiles();
    const activeProfile = await profileManager.getActiveProfile();

    setRules(allRules);
    setProfiles(allProfiles);
    setActiveProfileId(activeProfile?.id || null);
  };

  const handleAddRule = async (
    rule: Omit<LinkRule, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await ruleManager.createRule(rule);
    if (result.success) {
      loadData();
    }
    return result;
  };

  const handleUpdateRule = async (
    ruleId: string,
    updates: Partial<
      Omit<LinkRule, "id" | "createdAt" | "updatedAt" | "profileIds">
    >
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await ruleManager.updateRule(ruleId, updates);
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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading rules...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rules</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Manage link lock, block, and redirect rules
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.enabled ? "opacity-60" : ""}>
            <CardContent className="flex items-center justify-center">
              <div className="flex items-center justify-between w-full p-2">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {getActionIcon(rule.action)}
                  </div>
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
                      {rule.action === "redirect" && rule.redirectOptions && (
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
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                  />
                  <DropdownMenu>
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
        ))}

        {rules.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No rules yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first rule to start managing website access
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Rule
            </Button>
          </div>
        )}
      </div>

      <AddRuleModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAddRule={handleAddRule}
        profiles={profiles}
        activeProfileId={activeProfileId}
      />

      <EditRuleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        rule={selectedRule}
        onUpdateRule={handleUpdateRule}
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
