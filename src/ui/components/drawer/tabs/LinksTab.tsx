import { ArrowRight, Ban, Lock, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { sendMessage } from "../../../../core/messages";
import { AddRuleModal } from "../../AddRuleModal";
import { Button, Card, Input } from "../../common";

interface Link {
  id: string;
  urlPattern: string;
  action: "lock" | "block" | "redirect";
  options?: {
    lockMode?: string;
    timedDuration?: number;
    customPassword?: string;
    redirectUrl?: string;
  };
  enabled: boolean;
}

export const LinksTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadRules = async () => {
    try {
      const response = await sendMessage("GET_RULES");
      if (response.success) {
        setLinks(response.rules || []);
      }
    } catch (error) {
      console.error("Failed to load rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const response = await sendMessage("DELETE_RULE", { ruleId });
      if (response.success) {
        await loadRules();
      }
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "lock":
        return <Lock className="w-5 h-5 text-accent-primary" />;
      case "block":
        return <Ban className="w-5 h-5 text-accent-danger" />;
      case "redirect":
        return <ArrowRight className="w-5 h-5 text-accent-warning" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  const getDurationLabel = (link: Link): string => {
    if (link.action !== "lock") return "";

    const mode = link.options?.lockMode || "timed";
    if (mode === "always") return "Always ask";
    if (mode === "session") return "Until restart";

    const duration = link.options?.timedDuration || 3600;
    const minutes = Math.floor(duration / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  const filteredLinks = links.filter((link) =>
    link.urlPattern.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">
          Manage Links
        </h2>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Link
        </Button>
      </div>

      {/* Search */}
      <Input
        type="search"
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search links..."
      />

      {/* Links List */}
      {isLoading ? (
        <div className="text-center py-8 text-text-muted">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => (
            <Card key={link.id} padding="md" hoverable>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getActionIcon(link.action)}
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {link.urlPattern}
                    </h3>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-text-secondary">
                        {getActionLabel(link.action)}
                        {link.action === "lock" &&
                          ` • ${getDurationLabel(link)}`}
                        {link.action === "redirect" &&
                          link.options?.redirectUrl &&
                          ` → ${link.options.redirectUrl}`}
                      </p>
                      {link.options?.customPassword && (
                        <p className="text-xs text-text-muted">
                          Custom password: Yes
                        </p>
                      )}
                      {!link.enabled && (
                        <p className="text-xs text-accent-warning">Disabled</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(link.id)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredLinks.length === 0 && !isLoading && (
            <div className="text-center py-8 text-text-muted">
              <p>No links found</p>
              <p className="text-sm mt-2">
                Click "Add Link" to create your first rule
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Rule Modal */}
      <AddRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadRules();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
