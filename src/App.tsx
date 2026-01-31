import { AnimatePresence, motion } from "framer-motion";
import {
  Database,
  FileText,
  Info,
  Lock,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MasterPasswordGuard } from "./components/MasterPasswordGuard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "./components/ui/sheet";
import type { ScreenType } from "./models/types";
import { AboutScreen } from "./screens/AboutScreen";
import { ImportExportScreen } from "./screens/ImportExportScreen";
import { ProfilesTab } from "./screens/ProfilesScreen";
import { RulesScreen } from "./screens/RulesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

const navItems = [
  { id: "rules" as const, label: "Rules", icon: FileText },
  { id: "profiles" as const, label: "Profiles", icon: User },
  { id: "import-export" as const, label: "Backup", icon: Database },
  { id: "settings" as const, label: "Settings", icon: Settings },
  { id: "about" as const, label: "About", icon: Info },
];

const screenVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("rules");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const handleImportSuccess = () => {
    // Increment key to force all screens to remount and reload data
    setRefreshKey((prev) => prev + 1);
  };

  // Keyboard shortcuts: Shift+1 through Shift+5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key;
        const shortcuts: Record<string, ScreenType> = {
          "!": "rules", // Shift+1
          "@": "profiles", // Shift+2
          "#": "import-export", // Shift+3
          $: "settings", // Shift+4
          "%": "about", // Shift+5
        };

        if (shortcuts[key]) {
          e.preventDefault();
          setCurrentScreen(shortcuts[key]);
          setIsSidebarOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case "rules":
        return <RulesScreen key={`rules-${refreshKey}`} />;
      case "profiles":
        return <ProfilesTab key={`profiles-${refreshKey}`} />;
      case "import-export":
        return <ImportExportScreen onImportSuccess={handleImportSuccess} />;
      case "settings":
        return <SettingsScreen key={`settings-${refreshKey}`} />;
      case "about":
        return <AboutScreen />;
      default:
        return null;
    }
  };

  return (
    <MasterPasswordGuard>
      <div className="min-h-screen bg-background text-foreground">
        <div className="relative h-screen">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Access different sections of Link Lock including rules, profiles,
              settings, and more
            </SheetDescription>
            {/* Main Content */}
            <div className="h-screen overflow-auto bg-background">
              {/* Drawer Toggle Button */}
              <div className="fixed top-4 left-4 z-50">
                <motion.button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.button>
              </div>
              <AnimatePresence mode="sync">
                <motion.div
                  key={currentScreen}
                  variants={screenVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                  className="h-full"
                >
                  {renderScreen()}
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Sidebar */}
            <SheetContent side="left" className="w-64 p-6" hideCloseButton>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Lock className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                  Link Lock
                </h2>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors flex items-center gap-2 relative overflow-hidden ${
                        isActive
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-primary/10 rounded-md"
                            layoutId="activeNavIndicator"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                            }}
                          />
                        )}
                      </AnimatePresence>
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{item.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </MasterPasswordGuard>
  );
}

export default App;
