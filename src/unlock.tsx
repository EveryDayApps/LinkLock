import { createRoot } from "react-dom/client";
import "./index.css";
import UnlockScreen from "./screens/Shield.tsx";
import { ServiceProvider } from "./services/core/index.ts";

createRoot(document.getElementById("root")!).render(
  <ServiceProvider>
    <UnlockScreen />
  </ServiceProvider>,
);
