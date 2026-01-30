// ============================================
// Unlock Page Entry Point
// Renders the UnlockScreen for locked URLs
// ============================================

import { createRoot } from "react-dom/client";
import UnlockScreen from "./screens/Shield";
import "./index.css";

createRoot(document.getElementById("root")!).render(<UnlockScreen />);
