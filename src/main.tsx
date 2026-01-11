import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ServiceProvider } from "./services";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServiceProvider>
      <App />
    </ServiceProvider>
  </StrictMode>
);
