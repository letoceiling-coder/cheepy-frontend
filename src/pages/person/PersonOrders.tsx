import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, Copy, Package, Truck, MapPin, Search, Filter, Download, RotateCcw, FileText } from "lucide-react";
import { mockOrders } from "@/data/mock-data";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

type StatusFilter = "all" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<string, { label: string; cls: string; icon: typeof Package }> = {
  shipped: { label: "В пути", cls: "bg-primary/10 text-primary", icon: Truck },
  delivered: { label: "Доставлен", cls: "bg-emerald-500/10 text-emerald-600", icon: Package },
  cancelled: { label: "Отменён", cls: "bg-muted text-muted-foreground", icon: Package },
};

const filterButtons: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "shipped", label: "В пути" },
  { key: "delivered", label: "Доставлены" },
  { key: "cancelled", label: "Отменены" },
];

const PersonOrders = () => {
  const { toast } = useToast();
  const { requireAuth } = useLoginPrompt();
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filteredOrders = mockOrders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.items.some(i => i.product.name.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "Скопировано", description: `Номер заказа ${id}` });
  };

  const handleAction = (action: string) => {
    if (!requireAuth(action)) return;
    toast({ title: action });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) return <OrdersSkeleton />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Мои заказы</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{mockOrders.length}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по номеру или товару..."
            className="pl-9 rounded-xl h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {filterButtons.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 ${
                statusFilter === f.key
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary hover:border-primary/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground animate-fade-in">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Заказов не найдено</p>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.map((order, idx) => {
          const st = statusConfig[order.status];
          const isExpanded = expandedId === order.id;
          const StatusIcon = st.icon;

          return (
            <div
              key={order.id}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/15 hover:shadow-md animate-fade-in"
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
            >
              {/* Order header */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full text-left p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors duration-200"
              >
                {/* Thumbnails */}
                <div className="flex items-center -space-x-2 shrink-0">
                  {order.items.slice(0, 3).map((item, i) => (
                    <img key={i} src={item.product.images[0]} alt="" className="w-11 h-11 rounded-xl object-cover border-2 border-background transition-transform duration-200 hover:scale-110 hover:z-10" />
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-11 h-11 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center text-xs font-bold text-primary bg-primary/5">+{order.items.length - 3}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-foreground">{order.id.replace("ORD-", "#")}</span>
                    <button onClick={(e) => { e.stopPropagation(); copyOrderId(order.id); }} className="text-muted-foreground hover:text-primary transition-colors p-0.5 active:scale-90">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>

                {/* Price & Status — responsive */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div className="hidden sm:block">
                    <p className="text-sm font-bold text-foreground">{(order.total - order.discount).toLocaleString()} ₽</p>
                    {order.discount > 0 && <p className="text-[10px] text-muted-foreground line-through">{order.total.toLocaleString()} ₽</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 ${st.cls}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{st.label}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expandable details */}
              <div
                className="transition-all duration-400 ease-out overflow-hidden"
                style={{ maxHeight: isExpanded ? "600px" : "0", opacity: isExpanded ? 1 : 0 }}
              >
                <div className="px-4 pb-4 pt-1 border-t border-border">
                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors duration-200 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                        <img src={item.product.images[0]} alt={item.product.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.color} • {item.size} • {item.quantity} шт.</p>
                        </div>
                        <p className="text-xs font-bold text-foreground shrink-0">{item.product.price.toLocaleString()} ₽</p>
                      </div>
                    ))}
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-secondary/30">
                      <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Адрес доставки</p>
                        <p className="text-xs font-medium text-foreground">{order.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-secondary/30">
                      <Package className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Оплата</p>
                        <p className="text-xs font-medium text-foreground">{order.payment}</p>
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="rounded-xl bg-secondary/30 p-3 mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Товары ({order.items.reduce((s, i) => s + i.quantity, 0)} шт.)</span>
                      <span className="text-foreground">{order.total.toLocaleString()} ₽</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-primary">Скидка</span>
                        <span className="text-primary">−{order.discount.toLocaleString()} ₽</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Доставка</span>
                      <span className="text-foreground">{order.delivery ? `${order.delivery} ₽` : "Бесплатно"}</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-foreground">Итого</span>
                      <span className="font-bold text-foreground">{(order.total - order.discount + order.delivery).toLocaleString()} ₽</span>
                    </div>
                  </div>

                  {/* Actions — enhanced */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === "shipped" && (
                      <Button onClick={() => handleAction("Отследить заказ")} size="sm" className="gradient-primary text-primary-foreground rounded-xl text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200">
                        <Truck className="w-3 h-3 mr-1.5" /> Отследить
                      </Button>
                    )}
                    {order.status === "delivered" && (
                      <Button onClick={() => handleAction("Оставить отзыв")} size="sm" className="gradient-primary text-primary-foreground rounded-xl text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200">
                        Оставить отзыв
                      </Button>
                    )}
                    <Button onClick={() => handleAction("Повторить заказ")} variant="outline" size="sm" className="rounded-xl text-xs active:scale-95 transition-all">
                      <RotateCcw className="w-3 h-3 mr-1" /> Повторить
                    </Button>
                    <Button onClick={() => handleAction("Скачать чек")} variant="outline" size="sm" className="rounded-xl text-xs active:scale-95 transition-all">
                      <Download className="w-3 h-3 mr-1" /> Чек
                    </Button>
                    {order.status === "delivered" && (
                      <Button onClick={() => handleAction("Оформить возврат")} variant="outline" size="sm" className="rounded-xl text-xs text-destructive border-destructive/20 hover:bg-destructive/5 active:scale-95 transition-all">
                        <RotateCcw className="w-3 h-3 mr-1" /> Возврат
                      </Button>
                    )}
                    <Link to={`/person/order/${order.id}`} className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto self-center group transition-colors">
                      Подробнее <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrdersSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 mb-2">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-6 w-8 rounded-full" />
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-9 flex-1 rounded-xl" />
      <div className="flex gap-1.5">
        {[0,1,2].map(i => <Skeleton key={i} className="h-9 w-20 rounded-lg" />)}
      </div>
    </div>
    {[0,1,2].map(i => (
      <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[0,1].map(j => <Skeleton key={j} className="w-11 h-11 rounded-xl" />)}
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export default PersonOrders;
