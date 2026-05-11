import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { ApiError, authApi, storefrontAuthApi, type StorefrontUser } from "@/lib/api";
import { clearReferralCode, peekReferralCode, tryAttachStoredReferral } from "@/lib/referralCapture";

export interface AuthUserProfile {
  id?: number;
  name: string;
  email: string;
  phone: string;
  account_role?: "customer" | "seller";
  system_role?: "admin";
  seller_status?: "pending" | "active" | "rejected" | null;
  linked_social_providers?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUserProfile | null;
  refreshProfile: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, accountType?: "customer" | "seller") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapStoreUserToProfile(u: StorefrontUser): AuthUserProfile {
  const providers = u.linked_social_providers ?? [];
  return {
    id: u.id,
    name: u.name,
    email: u.email ?? "",
    phone: u.phone ?? "",
    account_role: u.account_role,
    seller_status: u.seller_status,
    linked_social_providers: providers.length ? providers : undefined,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        try {
          const r = await authApi.me();
          setUser({
            id: r.user.id,
            name: r.user.name,
            email: r.user.email,
            phone: "",
            account_role: "customer",
            system_role: r.user.role === "admin" ? "admin" : undefined,
          });
          setIsAuthenticated(r.user.role === "admin");
          return;
        } catch {
          localStorage.removeItem("admin_token");
        }
      }
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
        void tryAttachStoredReferral();
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

  const register = async (name: string, email: string, phone: string, password: string, accountType: "customer" | "seller" = "customer") => {
    try {
      const ref = peekReferralCode();
      const payload: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        account_type?: "customer" | "seller";
        referral_code?: string;
      } = {
        name: name.trim(),
        email: email.trim(),
        password,
        account_type: accountType,
      };
      const ph = phone.trim();
      if (ph) payload.phone = ph;
      if (ref) payload.referral_code = ref;
      const r = await storefrontAuthApi.register(payload);
      localStorage.setItem("customer_token", r.token);
      clearReferralCode();
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
