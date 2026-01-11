import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Shield from "./components/screens/Shield.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Shield />
  </StrictMode>
);
