import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { persistReferralFromUrl, trackReferralClickIfNeeded } from "@/lib/referralCapture";

/** Сохранение ?ref= в localStorage + учёт перехода (публичный API). */
export default function ReferralBootstrap() {
  const location = useLocation();

  useEffect(() => {
    persistReferralFromUrl();
    void trackReferralClickIfNeeded();
  }, [location.pathname, location.search]);

  return null;
}
