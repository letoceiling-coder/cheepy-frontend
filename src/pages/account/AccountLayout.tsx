import { NavLink, Outlet } from "react-router-dom";
import { User, Package, CreditCard, Wallet, Heart, Tag, FileText, Users, Lock, LogOut } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/account", icon: User, label: "Личные данные", end: true },
  { to: "/account/orders", icon: Package, label: "Мои заказы" },
  { to: "/account/payment", icon: CreditCard, label: "Способы оплаты" },
  { to: "/account/balance", icon: Wallet, label: "Баланс" },
  { to: "/account/favorites", icon: Heart, label: "Избранное" },
  { to: "/account/coupons", icon: Tag, label: "Купоны" },
  { to: "/account/receipts", icon: FileText, label: "Чеки" },
  { to: "/account/referral", icon: Users, label: "Реферальная программа" },
  { to: "/account/password", icon: Lock, label: "Смена пароля" },
];

const AccountLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Личный кабинет</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-[260px] shrink-0">
            <div className="sticky top-[180px]">
              {/* User card */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary mb-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {user?.name?.[0] || "Г"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{user?.name || "Гость"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "Войдите для полного доступа"}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"}`}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
                {isAuthenticated ? (
                  <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors w-full">
                    <LogOut className="w-4 h-4 shrink-0" />
                    Выход
                  </button>
                ) : (
                  <NavLink to="/auth" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors">
                    <LogOut className="w-4 h-4 shrink-0" />
                    Войти
                  </NavLink>
                )}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default AccountLayout;
