import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { crmPaymentProvidersApi } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

export function PaymentAlertsBanner() {
  const [alerts, setAlerts] = useState<{
    has_alerts: boolean;
    webhook_failures_24h: number;
    atol_failures_24h: number;
  } | null>(null);

  useEffect(() => {
    crmPaymentProvidersApi
      .paymentAlerts()
      .then(setAlerts)
      .catch(() => setAlerts(null));
  }, []);

  if (!alerts?.has_alerts) return null;

  const total = alerts.webhook_failures_24h + alerts.atol_failures_24h;
  const parts: string[] = [];
  if (alerts.webhook_failures_24h > 0) parts.push(`Webhook: ${alerts.webhook_failures_24h}`);
  if (alerts.atol_failures_24h > 0) parts.push(`ATOL: ${alerts.atol_failures_24h}`);

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div>
          <p className="font-medium text-sm text-destructive">
            Ошибки платежей за 24ч: {total}
          </p>
          <p className="text-xs text-muted-foreground">{parts.join(" • ")}</p>
        </div>
      </div>
      <Link
        to="/crm/webhook-logs"
        className="text-sm font-medium text-primary hover:underline shrink-0"
      >
        Смотреть логи →
      </Link>
    </div>
  );
}
