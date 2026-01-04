import {
  Activity,
  Download,
  Info,
  Key,
  Link,
  Settings,
  User,
} from "lucide-react";

export type TabId =
  | "links"
  | "profiles"
  | "change-password"
  | "settings"
  | "import-export"
  | "activity"
  | "info";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "links", label: "Manage Links", icon: <Link className="w-5 h-5" /> },
  { id: "profiles", label: "Profiles", icon: <User className="w-5 h-5" /> },
  {
    id: "change-password",
    label: "Change Password",
    icon: <Key className="w-5 h-5" />,
  },
  { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  {
    id: "import-export",
    label: "Import/Export",
    icon: <Download className="w-5 h-5" />,
  },
  {
    id: "activity",
    label: "Activity Log",
    icon: <Activity className="w-5 h-5" />,
  },
  { id: "info", label: "Info", icon: <Info className="w-5 h-5" /> },
];

interface TabNavigationProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export const TabNavigation = ({ activeTab, onChange }: TabNavigationProps) => {
  return (
    <div className="flex flex-col gap-1 p-4 border-r border-border min-w-[200px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-btn text-left transition-smooth
            ${
              activeTab === tab.id
                ? "bg-accent-primary text-black"
                : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            }
          `}
        >
          {tab.icon}
          <span className="font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
