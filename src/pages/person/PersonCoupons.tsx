import { useState, useEffect } from "react";
import { Tag, Copy, Check, Gift } from "lucide-react";
import { mockCoupons } from "@/data/mock-data";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const PersonCoupons = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Скопировано", description: `Промокод ${code} скопирован` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <CouponsSkeleton />;

  const active = mockCoupons.filter(c => !c.used);
  const used = mockCoupons.filter(c => c.used);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-foreground">Купоны и бонусы</h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{active.length} активных</span>
      </div>

      {/* Bonus balance */}
      <div className="rounded-2xl gradient-primary p-5 mb-6 text-primary-foreground animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">Бонусный баланс</span>
        </div>
        <p className="text-3xl font-bold">2 500 ₽</p>
        <p className="text-xs opacity-70 mt-1">Используйте бонусы при оформлении заказа</p>
      </div>

      {/* Active coupons */}
      <h3 className="font-semibold text-foreground mb-3">Активные купоны</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {active.map((c, i) => (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold text-sm text-foreground">{c.code}</span>
              </div>
              <button
                onClick={() => handleCopy(c.code, c.id)}
                className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
              </button>
            </div>
            <p className="text-xl font-bold text-primary mb-1">
              {c.type === "percent" ? `−${c.discount}%` : `−${c.discount} ₽`}
            </p>
            {c.minOrder && <p className="text-[11px] text-muted-foreground">От {c.minOrder.toLocaleString()} ₽</p>}
            <p className="text-[11px] text-muted-foreground mt-1">
              До {new Date(c.expiresAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
        ))}
      </div>

      {/* Used */}
      {used.length > 0 && (
        <>
          <h3 className="font-semibold text-muted-foreground mb-3">Использованные</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {used.map(c => (
              <div key={c.id} className="rounded-2xl border border-border bg-card/50 p-4 opacity-50">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-bold text-sm text-muted-foreground line-through">{c.code}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.type === "percent" ? `−${c.discount}%` : `−${c.discount} ₽`}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const CouponsSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-7 w-48" />
    <Skeleton className="h-28 rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[0,1].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
  </div>
);

export default PersonCoupons;
