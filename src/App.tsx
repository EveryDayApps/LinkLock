import { AnimatePresence, motion } from "framer-motion";
import { Database, FileText, Info, Lock, Settings, User } from "lucide-react";
import { useState } from "react";
import { MasterPasswordGuard } from "./components/MasterPasswordGuard";
import { AboutScreen } from "./screens/AboutScreen";
import { ImportExportScreen } from "./screens/ImportExportScreen";
import { ProfilesTab } from "./screens/ProfilesScreen";
import { RulesScreen } from "./screens/RulesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export type ScreenType =
  | "profiles"
  | "rules"
  | "import-export"
  | "settings"
  | "about";

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
  const [isSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const handleImportSuccess = () => {
    // Increment key to force all screens to remount and reload data
    setRefreshKey((prev) => prev + 1);
  };

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
      <div className="dark min-h-screen bg-background text-foreground">
        <div className="flex h-screen">
          {/* Sidebar */}
          {isSidebarOpen && (
            <div className="w-64 border-r border-border bg-card p-6">
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
            </div>
          )}

          {/* Main Content with AnimatePresence */}
          <div className="flex-1 overflow-auto bg-background">
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
        </div>
      </div>
    </MasterPasswordGuard>
  );
}

export default App;
