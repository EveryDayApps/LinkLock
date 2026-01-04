import { useState } from "react";
import type { TabId } from "../components/drawer";
import {
  ActivityLogTab,
  ChangePasswordTab,
  Drawer,
  ImportExportTab,
  InfoTab,
  LinksTab,
  ProfilesTab,
  SettingsTab,
} from "../components/drawer";

export const OptionsPage = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("links");

  const renderTabContent = () => {
    switch (activeTab) {
      case "links":
        return <LinksTab />;
      case "profiles":
        return <ProfilesTab />;
      case "change-password":
        return <ChangePasswordTab />;
      case "settings":
        return <SettingsTab />;
      case "import-export":
        return <ImportExportTab />;
      case "activity":
        return <ActivityLogTab />;
      case "info":
        return <InfoTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
      </Drawer>

      {!isOpen && (
        <div className="flex items-center justify-center min-h-screen">
          <button
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 bg-accent-primary text-black rounded-btn hover:brightness-110 transition-smooth"
          >
            Open Options
          </button>
        </div>
      )}
    </div>
  );
};
