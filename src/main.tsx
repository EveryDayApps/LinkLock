import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ServiceProvider } from "./services/core/ServiceContext.tsx";

createRoot(document.getElementById("root")!).render(
  <ServiceProvider>
    <App />
  </ServiceProvider>
);
