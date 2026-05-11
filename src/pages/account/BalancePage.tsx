import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { storeAccountApi, type AccountWalletLedger } from "@/lib/api";
import { toast } from "sonner";

const BalancePage = () => {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<AccountWalletLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeAccountApi.wallet()
      .then((r) => {
        setBalance(r.balance);
        setLedger(r.ledger);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить баланс"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Бонусный счёт</h2>

      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground mb-6">
        <p className="text-sm opacity-80 mb-1">Бонусные рубли</p>
        <p className="text-3xl font-bold mb-4">{balance.toLocaleString()} ₽</p>
        <p className="text-sm opacity-80">Бонусные рубли (1 ₽ = 1 бонус) можно использовать только при оплате заказов на сайте по правилам магазина.</p>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3">История операций</h3>
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Загрузка операций…</p>
        ) : ledger.length === 0 ? (
          <div className="p-4 rounded-xl border border-border text-sm text-muted-foreground">Операций пока нет.</div>
        ) : ledger.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.amount >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {item.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm text-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("ru-RU")}</p>
              </div>
            </div>
            <span className={`text-sm font-bold ${item.amount >= 0 ? "text-green-600" : "text-foreground"}`}>
              {item.amount >= 0 ? "+" : ""}{item.amount.toLocaleString()} ₽
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BalancePage;
