import { Tag, Copy, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { storeAccountApi, type AccountCoupon } from "@/lib/api";
import { toast } from "sonner";

const CouponsPage = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<AccountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const activeCoupons = coupons.filter(c => c.user_used_count < c.max_uses_per_user);
  const usedCoupons = coupons.filter(c => c.user_used_count >= c.max_uses_per_user);

  useEffect(() => {
    storeAccountApi.coupons()
      .then((r) => setCoupons(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить купоны"))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Купоны и скидки</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Загрузка купонов…</p>
      ) : coupons.length === 0 ? (
        <div className="p-4 rounded-2xl border border-border text-sm text-muted-foreground">Купонов пока нет.</div>
      ) : activeCoupons.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-foreground mb-3">Активные</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {activeCoupons.map(c => (
              <div key={c.id} className="p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <Tag className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{c.discount_type === "percent" ? `-${c.discount_value}%` : `-${c.discount_value} ₽`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-foreground">{c.code}</span>
                  <button onClick={() => copyCode(c.id, c.code)} className="text-primary hover:underline text-xs flex items-center gap-1">
                    {copiedId === c.id ? <><Check className="w-3 h-3" />Скопировано</> : <><Copy className="w-3 h-3" />Копировать</>}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">До {c.expires_at ? new Date(c.expires_at).toLocaleDateString("ru-RU") : "без срока"}{c.min_order_amount ? ` · от ${c.min_order_amount.toLocaleString()} ₽` : ""}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {usedCoupons.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Использованные</h3>
          <div className="space-y-2">
            {usedCoupons.map(c => (
              <div key={c.id} className="p-3 rounded-xl border border-border opacity-50">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">{c.code}</span>
                  <span className="text-sm text-muted-foreground">{c.discount_type === "percent" ? `-${c.discount_value}%` : `-${c.discount_value} ₽`}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CouponsPage;
