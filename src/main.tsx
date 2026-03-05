import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.DEV) {
  console.log("[App] API URL:", import.meta.env.VITE_API_URL || "(default)");
}

createRoot(document.getElementById("root")!).render(<App />);
