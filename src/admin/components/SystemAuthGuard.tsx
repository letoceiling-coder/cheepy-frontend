import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

export default function SystemAuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let alive = true;
    const returnTo = location.pathname + location.search;
    const token = localStorage.getItem("admin_token");

    if (!token) {
      sessionStorage.setItem("system_auth_next", returnTo);
      navigate(`/admin/login?next=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }

    authApi
      .me()
      .then((res) => {
        if (!alive) return;
        if (res.user.role !== "admin") {
          navigate("/admin/login", { replace: true });
          return;
        }
        setState("allowed");
      })
      .catch(() => {
        if (!alive) return;
        localStorage.removeItem("admin_token");
        sessionStorage.setItem("system_auth_next", returnTo);
        navigate(`/admin/login?next=${encodeURIComponent(returnTo)}`, { replace: true });
      });

    return () => {
      alive = false;
    };
  }, [location.pathname, location.search, navigate]);

  if (state !== "allowed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Проверка доступа" />
      </div>
    );
  }

  return <>{children}</>;
}
