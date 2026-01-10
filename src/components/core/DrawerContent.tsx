import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import type { ScreenType } from "../../App";

interface AppDrawerContentProps {
  onNavigate: (screen: ScreenType) => void;
}

export default function AppDrawerContent({ onNavigate }: AppDrawerContentProps) {
  const menuItems: { label: string; screen: ScreenType; icon: string }[] = [
    {
      label: "Rules",
      screen: "rules",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      label: "Profiles",
      screen: "profiles",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      label: "Import / Export",
      screen: "import-export",
      icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
    },
    {
      label: "Settings",
      screen: "settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      label: "About",
      screen: "about",
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  return (
    <SheetContent side="left" className="w-[300px] overflow-y-auto">
      <SheetHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <SheetTitle>Link Lock</SheetTitle>
        </div>
        <SheetDescription>
          Manage your privacy and website controls
        </SheetDescription>
      </SheetHeader>

      <nav className="mt-8 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition group"
          >
            <svg
              className="w-5 h-5 group-hover:text-primary transition"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={item.icon}
              />
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
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
