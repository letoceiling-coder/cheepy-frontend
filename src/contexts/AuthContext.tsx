import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { mockUser, type UserProfile } from "@/data/mock-data";
import { ApiError, storefrontAuthApi, type StorefrontUser } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  refreshProfile: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapStoreUserToProfile(u: StorefrontUser): UserProfile {
  const providers = u.linked_social_providers ?? [];
  return {
    ...mockUser,
    id: u.id,
    name: u.name,
    email: u.email ?? "",
    phone: u.phone ?? "",
    linked_social_providers: providers.length ? providers : undefined,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    try {
      const r = await storefrontAuthApi.me();
      setUser(mapStoreUserToProfile(r.user));
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem("customer_token");
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHash = window.location.hash.replace(/^#/, "");
    if (rawHash) {
      const hp = new URLSearchParams(rawHash);
      const t = hp.get("customer_token");
      if (t) {
        localStorage.setItem("customer_token", t);
        const linked = hp.get("social_linked");
        hp.delete("customer_token");
        hp.delete("social_linked");
        const rest = hp.toString();
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search + (rest ? `#${rest}` : "")
        );
        if (linked) {
          toast.success(`Аккаунт ${linked.toUpperCase()} привязан к профилю`);
        }
      }
    }

    void refreshProfile();
  }, [refreshProfile]);

  const login = async (loginVal: string, password: string) => {
    try {
      const r = await storefrontAuthApi.login(loginVal.trim(), password);
      localStorage.setItem("customer_token", r.token);
      setUser(mapStoreUserToProfile(r.user));
      setIsAuthenticated(true);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Не удалось выполнить вход";
      toast.error(msg);
      throw e;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      const payload: { name: string; email: string; password: string; phone?: string } = {
        name: name.trim(),
        email: email.trim(),
        password,
      };
      const ph = phone.trim();
      if (ph) payload.phone = ph;
      const r = await storefrontAuthApi.register(payload);
      localStorage.setItem("customer_token", r.token);
      setUser(mapStoreUserToProfile(r.user));
      setIsAuthenticated(true);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Не удалось зарегистрироваться";
      toast.error(msg);
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem("customer_token");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, refreshProfile, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
