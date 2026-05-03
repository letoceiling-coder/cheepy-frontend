import { useEffect, useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { storeAccountApi, type AccountReceipt } from "@/lib/api";
import { toast } from "sonner";

const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState<AccountReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeAccountApi.receipts()
      .then((r) => setReceipts(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить чеки"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Чеки</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Загрузка чеков…</p>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="w-16 h-16 text-border mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">Чеков пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{r.number}</p>
                  <p className="text-xs text-muted-foreground">Заказ {r.order_id ?? "—"} · {r.issued_at ? new Date(r.issued_at).toLocaleDateString("ru-RU") : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-foreground">{r.amount.toLocaleString()} ₽</span>
                {r.fiscal_url ? <a href={r.fiscal_url} target="_blank" rel="noreferrer" className="text-primary hover:underline"><Download className="w-4 h-4" /></a> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiptsPage;
