import { useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const TOKEN_KEY = "admin_token";

/**
 * CRM uses the same Laravel JWT as admin (`admin_token`).
 * Without token, redirect to admin login with ?next= for return after login.
 */
export default function CrmAuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(false);
      const returnTo = location.pathname + location.search;
      sessionStorage.setItem("crm_auth_next", returnTo);
      navigate(`/admin/login?next=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }
    setReady(true);
  }, [location.pathname, location.search, navigate]);

  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  if (!token || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Проверка доступа" />
      </div>
    );
  }

  return <>{children}</>;
}
