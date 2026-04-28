import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent browser from restoring scroll position on initial page load.
// This must run before React mounts to avoid the visible jump-to-bottom.
try {
  if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
} catch {
  // ignore
}
try {
  if (typeof window !== "undefined") {
    window.scrollTo(0, 0);
  }
} catch {
  // ignore
}

if (import.meta.env.DEV) {
  console.log("[App] API URL:", import.meta.env.VITE_API_URL || "(default)");
}

createRoot(document.getElementById("root")!).render(<App />);
