import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { crmDeliveryIntegrationsApi, marketplaceSettingsApi, type DeliveryIntegrationItem } from "@/lib/api";
import { Truck, Wifi, WifiOff, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CrmDeliveryPage() {
  const [selectedProvider, setSelectedProvider] = useState<DeliveryIntegrationItem | null>(null);

  const integrationsQ = useQuery({
    queryKey: ["crm", "delivery-integrations"],
    queryFn: () => crmDeliveryIntegrationsApi.list(),
    staleTime: 60_000,
  });

  const settingsQ = useQuery({
    queryKey: ["crm", "marketplace-settings"],
    queryFn: () => marketplaceSettingsApi.get(),
    staleTime: 60_000,
  });

  const ms = settingsQ.data?.data;
  const rows = integrationsQ.data ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Доставка" description="Интеграции из delivery_integrations и порог бесплатной доставки из настроек маркетплейса" />

      <Tabs defaultValue="methods">
        <TabsList>
          <TabsTrigger value="methods">Политика маркетплейса</TabsTrigger>
          <TabsTrigger value="providers">Интеграции</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="mt-4 space-y-3">
          {settingsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка настроек…</p>
          ) : settingsQ.error ? (
            <p className="text-sm text-destructive">{(settingsQ.error as Error).message}</p>
          ) : (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Бесплатная доставка от суммы</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Включено: {ms?.free_delivery_threshold_enabled ? "да" : "нет"}
                    {ms?.free_delivery_threshold_rub != null
                      ? ` · порог ${ms.free_delivery_threshold_rub.toLocaleString("ru-RU")} ₽`
                      : ""}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/crm/settings">Открыть настройки маркетплейса</Link>
              </Button>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Списки тарифов из моков здесь не показываются: реальные котировки считаются через API доставки для корзины покупателя (
                <code className="text-[11px]">/store/cart-delivery-quote</code>).
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="providers" className="mt-4">
          {integrationsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка интеграций…</p>
          ) : integrationsQ.error ? (
            <p className="text-sm text-destructive">{(integrationsQ.error as Error).message}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((p) => (
                <div
                  key={p.name}
                  role="button"
                  tabIndex={0}
                  className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setSelectedProvider(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedProvider(p);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{p.title}</span>
                    <StatusBadge status={p.status === "connected" ? "connected" : "disconnected"} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {p.status === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    <span>Код: {p.name}</span>
                    {p.last_successful_auth_at ? (
                      <span>· OAuth: {new Date(p.last_successful_auth_at).toLocaleString("ru-RU")}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> {selectedProvider?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={selectedProvider.is_active ? "active" : "inactive"} />
                <StatusBadge status={selectedProvider.status === "connected" ? "connected" : "disconnected"} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ключи, токены и тест запроса находятся на экране интеграции — данные читаются только из БД, без фиктивных полей из макетов.
              </p>
              <Button size="sm" className="w-full" asChild>
                <Link to={`/crm/integrations/delivery/${selectedProvider.name}`} onClick={() => setSelectedProvider(null)}>
                  Настроить {selectedProvider.title}
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
