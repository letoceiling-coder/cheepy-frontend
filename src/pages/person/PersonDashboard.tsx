import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LogOut, Star, Package, Heart, CreditCard, MapPin, TrendingUp, ShoppingCart,
  Clock, User as UserIcon, ChevronRight, Sparkles, Tag, MessageCircle, RotateCcw, Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { mockUser, mockOrders, mockProducts, mockCoupons } from "@/data/mock-data";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

/* ── Animated Counter Hook ── */
const useAnimatedCounter = (target: number, duration = 1200) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return { count, ref };
};

/* ── Activity Feed ── */
const activityItems = [
  { icon: Heart, text: "Добавлено в избранное «Куртка демисезонная»", time: "2 мин назад", color: "text-rose-500 bg-rose-500/10" },
  { icon: Package, text: "Заказ #2024-001 доставлен", time: "1 час назад", color: "text-emerald-500 bg-emerald-500/10" },
  { icon: UserIcon, text: "Профиль обновлён", time: "3 часа назад", color: "text-primary bg-primary/10" },
  { icon: ShoppingCart, text: "Добавлено в корзину «Кроссовки Air Max»", time: "5 часов назад", color: "text-amber-500 bg-amber-500/10" },
  { icon: Star, text: "Оценка оставлена для «Платье вечернее»", time: "вчера", color: "text-amber-500 bg-amber-500/10" },
];

const PersonDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { requireAuth } = useLoginPrompt();
  const { items: cartItems } = useCart();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const displayUser = user || mockUser;
  const reviewProducts = mockProducts.slice(0, 6);
  const [loading, setLoading] = useState(true);

  const activeCoupons = mockCoupons.filter(c => !c.used).length;

  // Animated counters
  const ordersCounter = useAnimatedCounter(mockOrders.length);
  const favoritesCounter = useAnimatedCounter(favorites.length || 12);
  const balanceCounter = useAnimatedCounter(mockUser.balance);
  const addressesCounter = useAnimatedCounter(mockUser.addresses.length);
  const couponsCounter = useAnimatedCounter(activeCoupons);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Stats row — 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: Package, label: "Заказов", counter: ordersCounter, suffix: "", to: "/person/orders", color: "text-primary bg-primary/10" },
          { icon: Heart, label: "Избранное", counter: favoritesCounter, suffix: "", to: "/person/favorites", color: "text-rose-500 bg-rose-500/10" },
          { icon: MapPin, label: "Адресов", counter: addressesCounter, suffix: "", to: "/person/addresses", color: "text-emerald-500 bg-emerald-500/10" },
          { icon: Tag, label: "Купонов", counter: couponsCounter, suffix: "", to: "/person/coupons", color: "text-amber-500 bg-amber-500/10" },
          { icon: TrendingUp, label: "Бонусы", counter: balanceCounter, suffix: " ₽", to: "/person/coupons", color: "text-violet-500 bg-violet-500/10" },
        ].map((stat, i) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/20 group animate-fade-in flex flex-col gap-2 active:scale-[0.97]"
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}
          >
            <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <span ref={stat.counter.ref} className="text-2xl font-bold text-foreground tabular-nums">
              {stat.counter.count.toLocaleString()}{stat.suffix}
            </span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </Link>
        ))}
      </div>

      {/* Profile + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StaggerCard i={0} className="md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:rounded-xl">
                {displayUser.name?.[0] || "U"}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground">{displayUser.name}</p>
              <p className="text-sm text-muted-foreground">{displayUser.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{displayUser.phone}</p>
            </div>
            {isAuthenticated ? (
              <button onClick={logout} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200 active:scale-90">
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => requireAuth("Войти в аккаунт")} className="h-9 px-4 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20 active:scale-95">
                Войти
              </button>
            )}
          </div>
          {/* Quick actions grid — 6 actions */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { icon: MapPin, label: "Добавить адрес", to: "/person/addresses" },
              { icon: CreditCard, label: "Добавить карту", to: "/person/payments" },
              { icon: RotateCcw, label: "Повторить заказ", action: true },
              { icon: MessageCircle, label: "Поддержка", to: "/person/support" },
              { icon: Package, label: "Заказы", to: "/person/orders" },
              { icon: UserIcon, label: "Профиль", to: "/person/profile" },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to || "#"}
                onClick={a.action ? (e: React.MouseEvent) => { e.preventDefault(); requireAuth("Повторить последний заказ"); } : undefined}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-secondary/50 transition-all duration-200 group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/10 group-hover:scale-110">
                  <a.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </StaggerCard>

        {/* Coupons */}
        <StaggerCard i={1}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="font-semibold text-foreground text-sm">Скидки и купоны</p>
          </div>
          <div className="space-y-2 flex-1">
            {mockCoupons.filter(c => !c.used).map(c => (
              <div key={c.id} className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer">
                <p className="text-xs font-mono font-bold text-primary">{c.code}</p>
                <p className="text-[11px] text-muted-foreground">
                  {c.type === "percent" ? `Скидка ${c.discount}%` : `${c.discount} ₽`}
                  {c.minOrder ? ` от ${c.minOrder.toLocaleString()} ₽` : " на первый заказ"}
                </p>
              </div>
            ))}
          </div>
          <Link to="/person/coupons" className="text-xs text-primary hover:underline flex items-center gap-1 mt-3 transition-colors">
            Все купоны <ChevronRight className="w-3 h-3" />
          </Link>
        </StaggerCard>
      </div>

      {/* Recent Orders Preview */}
      <div className="animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Последние заказы</h2>
          <Link to="/person/orders" className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors">
            Все заказы <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {mockOrders.slice(0, 2).map((order, idx) => (
            <Link
              key={order.id}
              to={`/person/order/${order.id}`}
              className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 group animate-fade-in active:scale-[0.99]"
              style={{ animationDelay: `${300 + idx * 100}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center -space-x-2">
                {order.items.slice(0, 2).map((item, i) => (
                  <img key={i} src={item.product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-background transition-transform duration-200 group-hover:scale-105" />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Заказ {order.id.replace("ORD-", "#")}</p>
                <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">{(order.total - order.discount).toLocaleString()} ₽</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  order.status === "delivered" ? "bg-emerald-500/10 text-emerald-600" :
                  order.status === "shipped" ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {order.status === "delivered" ? "Доставлен" : order.status === "shipped" ? "В пути" : "Отменён"}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Feed + Favorites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activity Feed */}
        <div className="animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Активность</h2>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {activityItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors duration-200 animate-fade-in"
                style={{ animationDelay: `${500 + i * 80}ms`, animationFillMode: "both" }}
              >
                <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Favorites preview */}
        <div className="animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <h2 className="text-base font-bold text-foreground">Избранное</h2>
            </div>
            <Link to="/person/favorites" className="text-xs text-primary hover:underline flex items-center gap-1">
              Все <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mockProducts.slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card overflow-hidden group cursor-pointer hover:border-primary/20 hover:shadow-md transition-all duration-250 animate-fade-in active:scale-[0.98]"
                style={{ animationDelay: `${600 + i * 60}ms`, animationFillMode: "both" }}
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="aspect-square overflow-hidden relative">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <button
                    onClick={(e) => { e.stopPropagation(); requireAuth("Удалить из избранного"); }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background"
                  >
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-foreground truncate">{p.name}</p>
                  <p className="text-xs font-bold text-foreground">{p.price.toLocaleString()} ₽</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products awaiting review */}
      <div className="animate-fade-in" style={{ animationDelay: "700ms", animationFillMode: "both" }}>
        <h2 className="text-base font-bold text-foreground mb-3">{reviewProducts.length} товаров ожидают оценки</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {reviewProducts.map((p, idx) => (
            <div
              key={p.id}
              className="min-w-[180px] rounded-xl border border-border bg-card p-2.5 shrink-0 transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 cursor-pointer group animate-fade-in active:scale-[0.97]"
              style={{ animationDelay: `${800 + idx * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Cheepy</p>
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-1.5">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5 text-border hover:text-amber-400 transition-all duration-150 cursor-pointer hover:scale-125"
                    onClick={() => requireAuth("Оценить товар")}
                  />
                ))}
              </div>
              <button onClick={() => requireAuth("Оценить товар")} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Пропустить</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Card wrappers ── */
const StaggerCard = ({ children, i, className }: { children: React.ReactNode; i: number; className?: string }) => (
  <div
    className={cn(
      "rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/10 animate-fade-in flex flex-col",
      className
    )}
    style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
  >
    {children}
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-52 rounded-2xl md:col-span-2" />
      <Skeleton className="h-52 rounded-2xl" />
    </div>
    <div className="space-y-2">
      {[0,1].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  </div>
);

export default PersonDashboard;
