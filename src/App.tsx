import { useState } from "react";
import { AboutScreen } from "./components/screens/AboutScreen";
import { ImportExportScreen } from "./components/screens/ImportExportScreen";
import { ProfilesScreen } from "./components/screens/ProfilesScreen";
import { RulesScreen } from "./components/screens/RulesScreen";
import { SettingsScreen } from "./components/screens/SettingsScreen";

export type ScreenType =
  | "profiles"
  | "rules"
  | "import-export"
  | "settings"
  | "about";

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("rules");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "profiles":
        return <ProfilesScreen />;
      case "rules":
        return <RulesScreen />;
      case "import-export":
        return <ImportExportScreen />;
      case "settings":
        return <SettingsScreen />;
      case "about":
        return <AboutScreen />;
      default:
        return <RulesScreen />;
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-64 border-r border-border bg-card p-6">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                Link Lock
              </h2>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => handleNavigate("rules")}
                className={`w-full px-3 py-2 text-left text-sm rounded-md transition flex items-center gap-2 ${
                  currentScreen === "rules"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Rules
              </button>
              <button
                onClick={() => handleNavigate("profiles")}
                className={`w-full px-3 py-2 text-left text-sm rounded-md transition flex items-center gap-2 ${
                  currentScreen === "profiles"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profiles
              </button>
              <button
                onClick={() => handleNavigate("import-export")}
                className={`w-full px-3 py-2 text-left text-sm rounded-md transition flex items-center gap-2 ${
                  currentScreen === "import-export"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Import / Export
              </button>
              <button
                onClick={() => handleNavigate("settings")}
                className={`w-full px-3 py-2 text-left text-sm rounded-md transition flex items-center gap-2 ${
                  currentScreen === "settings"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>
              <button
                onClick={() => handleNavigate("about")}
                className={`w-full px-3 py-2 text-left text-sm rounded-md transition flex items-center gap-2 ${
                  currentScreen === "about"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                About
              </button>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-background">
          {/* Top Bar with Drawer Toggle */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-accent transition"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-6 h-6 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

export default App;
