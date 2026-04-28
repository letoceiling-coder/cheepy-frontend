import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    // Disable browser scroll restoration and always start at top on initial load.
    if (isFirst.current) {
      isFirst.current = false;
      try {
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration = "manual";
        }
      } catch {
        // ignore
      }
      // If browser/restoration scrolled us somewhere (even to bottom), force top after paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (window.scrollY > 0) window.scrollTo(0, 0);
        });
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
