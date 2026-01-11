import {
  FileText,
  Info,
  Lock,
  Settings as SettingsIcon,
  Upload,
  User,
} from "lucide-react";
import type { ScreenType } from "../../App";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";

interface AppDrawerContentProps {
  onNavigate: (screen: ScreenType) => void;
}

export default function AppDrawerContent({
  onNavigate,
}: AppDrawerContentProps) {
  const menuItems: {
    label: string;
    screen: ScreenType;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      label: "Rules",
      screen: "rules",
      Icon: FileText,
    },
    {
      label: "Profiles",
      screen: "profiles",
      Icon: User,
    },
    {
      label: "Import / Export",
      screen: "import-export",
      Icon: Upload,
    },
    {
      label: "Settings",
      screen: "settings",
      Icon: SettingsIcon,
    },
    {
      label: "About",
      screen: "about",
      Icon: Info,
    },
  ];

  return (
    <SheetContent side="left" className="w-[300px] overflow-y-auto">
      <SheetHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <SheetTitle>Link Lock</SheetTitle>
        </div>
        <SheetDescription>
          Manage your privacy and website controls
        </SheetDescription>
      </SheetHeader>

      <nav className="mt-8 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.Icon;
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition group"
            >
              <Icon className="w-5 h-5 group-hover:text-primary transition" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 pt-8 border-t border-border">
        <div className="text-xs text-muted-foreground px-3">
          <p className="font-medium">Version 1.0.0</p>
          <p className="mt-1">All data stored securely with encryption</p>
        </div>
      </div>
    </SheetContent>
  );
}
