import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, setOnUnauthorized, parserApi } from "@/lib/api";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    authApi.logout();
    setUser(null);
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, [navigate]);

  const refreshUser = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.user);
    } catch {
      setUser(null);
      authApi.logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("admin_token", res.token);
    setUser(res.user);
    const fromQuery =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
    const fromSession =
      typeof window !== "undefined" ? sessionStorage.getItem("crm_auth_next") : null;
    sessionStorage.removeItem("crm_auth_next");
    const raw = fromQuery || fromSession;
    const isSafe =
      raw &&
      raw.startsWith("/") &&
      !raw.startsWith("//") &&
      (raw.startsWith("/crm") || raw.startsWith("/admin"));
    navigate(isSafe ? raw : "/admin", { replace: true });

    // Auto sync categories if last sync > 24h
    try {
      const last = localStorage.getItem("categories_last_sync");
      const lastMs = last ? new Date(last).getTime() : 0;
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (!last || now - lastMs > dayMs) {
        parserApi.categoriesSync().then((data) => {
          if (data.last_synced_at) {
            localStorage.setItem("categories_last_sync", data.last_synced_at);
          }
        }).catch(() => {});
      }
    } catch { /* ignore */ }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
