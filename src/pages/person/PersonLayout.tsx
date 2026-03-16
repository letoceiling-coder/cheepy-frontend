import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  User, Package, CreditCard, KeyRound, LogOut, RotateCcw, Menu, X,
  LayoutDashboard, LogIn, Heart, Clock, MapPin, Crown, Tag, Bell,
  MessageCircle, Shield, Settings,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptProvider } from "@/contexts/LoginPromptContext";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Основное",
    items: [
      { to: "/person/dashboard", icon: LayoutDashboard, label: "Обзор" },
      { to: "/person/profile", icon: User, label: "Профиль" },
      { to: "/person/orders", icon: Package, label: "Заказы" },
      { to: "/person/returns", icon: RotateCcw, label: "Возвраты" },
      { to: "/person/favorites", icon: Heart, label: "Избранное" },
      { to: "/person/viewed", icon: Clock, label: "Просмотренные" },
    ],
  },
  {
    label: "Управление",
    items: [
      { to: "/person/addresses", icon: MapPin, label: "Адреса" },
      { to: "/person/payments", icon: CreditCard, label: "Оплата" },
      { to: "/person/subscriptions", icon: Crown, label: "Подписки" },
      { to: "/person/coupons", icon: Tag, label: "Купоны" },
    ],
  },
  {
    label: "Настройки",
    items: [
      { to: "/person/notifications", icon: Bell, label: "Уведомления" },
      { to: "/person/support", icon: MessageCircle, label: "Поддержка" },
      { to: "/person/security", icon: Shield, label: "Безопасность" },
      { to: "/person/settings", icon: Settings, label: "Настройки" },
    ],
  },
];

const PersonLayout = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = "translateY(8px)";
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = "opacity 0.35s ease-out, transform 0.35s ease-out";
          contentRef.current.style.opacity = "1";
          contentRef.current.style.transform = "translateY(0)";
        }
      });
    }
  }, [location.pathname]);

  const navContent = (
    <nav className="space-y-4">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-1">{section.label}</p>
          <div className="space-y-0.5">
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/person/dashboard"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
                    )}
                    <item.icon className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary")} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}

      <div className="h-px bg-border my-2" />

      {isAuthenticated ? (
        <button
          onClick={() => { logout(); setMobileOpen(false); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-all duration-200 w-full group"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
          Выйти
        </button>
      ) : (
        <button
          onClick={() => { setMobileOpen(false); navigate("/auth"); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-primary hover:text-primary/80 hover:bg-primary/5 transition-all duration-200 w-full group"
        >
          <LogIn className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
          Войти
        </button>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/30">
                {(user?.name || "А")[0]}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {user?.name || "Личный кабинет"}
              </h1>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Демо-режим •{" "}
                  <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">Войти</button>
                </p>
              )}
              {isAuthenticated && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Онлайн
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-border hover:bg-secondary hover:border-primary/20 transition-all duration-200"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-[220px] shrink-0">
            <div className="sticky top-24 rounded-2xl border border-border bg-card/50 p-3 backdrop-blur-sm max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
              {navContent}
            </div>
          </aside>

          {/* Mobile drawer */}
          {mobileOpen && (
            <>
              <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 lg:hidden animate-fade-in" onClick={() => setMobileOpen(false)} />
              <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-background z-50 p-6 shadow-2xl lg:hidden animate-slide-in-right overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md shadow-primary/20">
                      {(user?.name || "А")[0]}
                    </div>
                    <p className="font-semibold text-foreground text-sm">{user?.name || "Гость"}</p>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {navContent}
              </div>
            </>
          )}

          {/* Main content */}
          <div ref={contentRef} className="flex-1 min-w-0">
            <LoginPromptProvider isAuthenticated={isAuthenticated}>
              <Outlet />
            </LoginPromptProvider>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default PersonLayout;
