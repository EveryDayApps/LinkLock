import { FileText, Info, Lock, Settings, Upload, User } from "lucide-react";
import { useState } from "react";
import { MasterPasswordGuard } from "./components/MasterPasswordGuard";
import { AboutScreen } from "./screens/AboutScreen";
import { ImportExportScreen } from "./screens/ImportExportScreen";
import { ProfilesScreen } from "./screens/ProfilesScreen";
import { RulesScreen } from "./screens/RulesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export type ScreenType =
  | "profiles"
  | "rules"
  | "import-export"
  | "settings"
  | "about";

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("rules");
  const [isSidebarOpen] = useState(true);

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
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
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  Link Lock
                </h2>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => handleNavigate("rules")}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md transition-all flex items-center gap-2 relative overflow-hidden ${
                    currentScreen === "rules"
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {currentScreen === "rules" && (
                    <div className="absolute inset-0 bg-primary/10 rounded-md" />
                  )}
                  <FileText className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Rules</span>
                </button>
                <button
                  onClick={() => handleNavigate("profiles")}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md transition-all flex items-center gap-2 relative overflow-hidden ${
                    currentScreen === "profiles"
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {currentScreen === "profiles" && (
                    <div className="absolute inset-0 bg-primary/10 rounded-md" />
                  )}
                  <User className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Profiles</span>
                </button>
                <button
                  onClick={() => handleNavigate("import-export")}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md transition-all flex items-center gap-2 relative overflow-hidden ${
                    currentScreen === "import-export"
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {currentScreen === "import-export" && (
                    <div className="absolute inset-0 bg-primary/10 rounded-md" />
                  )}
                  <Upload className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Import / Export</span>
                </button>
                <button
                  onClick={() => handleNavigate("settings")}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md transition-all flex items-center gap-2 relative overflow-hidden ${
                    currentScreen === "settings"
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {currentScreen === "settings" && (
                    <div className="absolute inset-0 bg-primary/10 rounded-md" />
                  )}
                  <Settings className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Settings</span>
                </button>
                <button
                  onClick={() => handleNavigate("about")}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md transition-all flex items-center gap-2 relative overflow-hidden ${
                    currentScreen === "about"
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {currentScreen === "about" && (
                    <div className="absolute inset-0 bg-primary/10 rounded-md" />
                  )}
                  <Info className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">About</span>
                </button>
              </nav>
            </div>
          )}

          {/* Main Content - All screens stay mounted to prevent flicker */}
          <div className="flex-1 overflow-auto bg-background">
            <div className={currentScreen === "rules" ? "" : "hidden"}>
              <RulesScreen />
            </div>
            <div className={currentScreen === "profiles" ? "" : "hidden"}>
              <ProfilesScreen />
            </div>
            <div className={currentScreen === "import-export" ? "" : "hidden"}>
              <ImportExportScreen />
            </div>
            <div className={currentScreen === "settings" ? "" : "hidden"}>
              <SettingsScreen />
            </div>
            <div className={currentScreen === "about" ? "" : "hidden"}>
              <AboutScreen />
            </div>
          </div>
        </div>
      </div>
    </MasterPasswordGuard>
  );
}

export default App;
