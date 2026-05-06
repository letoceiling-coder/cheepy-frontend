import { useEffect, useState } from "react";
import {
  getPreferenceSummary,
  getTopPreferredCategories,
  getTopPreferredProductIds,
  type PreferenceSummary,
} from "@/lib/userPreferences";

const EVENT_NAME = "cheepy:user-preferences-changed";

export function useUserPreferenceSummary(): PreferenceSummary {
  const [snap, setSnap] = useState<PreferenceSummary>(() => getPreferenceSummary());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setSnap(getPreferenceSummary());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return snap;
}

export function useTopPreferredProductIds(limit = 20): number[] {
  const [ids, setIds] = useState<number[]>(() => getTopPreferredProductIds(limit));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setIds(getTopPreferredProductIds(limit));
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, [limit]);
  return ids;
}

export function useTopPreferredCategories(limit = 5) {
  const [rows, setRows] = useState(() => getTopPreferredCategories(limit));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setRows(getTopPreferredCategories(limit));
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, [limit]);
  return rows;
}
