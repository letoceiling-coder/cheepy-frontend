import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { crmPaymentProvidersApi, type WebhookLogItem } from "@/lib/api";
import { PaymentAlertsBanner } from "../components/PaymentAlertsBanner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CrmWebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    crmPaymentProvidersApi
      .allLogs(100)
      .then((r) => setLogs(r.data ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PaymentAlertsBanner />
      <PageHeader
        title="Webhook Logs"
        description="События платежных провайдеров (Tinkoff, Sber, ATOL)"
        actions={
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Обновить
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Событий пока нет
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Провайдер</th>
                  <th className="text-left px-4 py-3 font-medium">Event ID</th>
                  <th className="text-left px-4 py-3 font-medium">Статус</th>
                  <th className="text-left px-4 py-3 font-medium">Ошибка</th>
                  <th className="text-left px-4 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">{l.id}</td>
                    <td className="px-4 py-2">{l.provider ?? "-"}</td>
                    <td className="px-4 py-2 font-mono text-xs max-w-[200px] truncate" title={l.event_id ?? undefined}>
                      {l.event_id ?? "-"}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-2 text-destructive max-w-[250px] truncate" title={l.error ?? undefined}>
                      {l.error ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {l.created_at ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
