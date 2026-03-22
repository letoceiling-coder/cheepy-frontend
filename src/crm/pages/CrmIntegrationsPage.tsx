import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { integrations, Integration } from "../mock/integrations";
import { Wifi, WifiOff, Settings } from "lucide-react";
import { crmPaymentProvidersApi, type PaymentProviderItem } from "@/lib/api";
import { PaymentAlertsBanner } from "../components/PaymentAlertsBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAYMENT_ICONS: Record<string, string> = {
  tinkoff: "💳",
  sber: "🟢",
  atol: "🧾",
};

export default function CrmIntegrationsPage() {
  const navigate = useNavigate();
  const [paymentProviders, setPaymentProviders] = useState<PaymentProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Integration | null>(null);

  const categories = ["payments", "delivery", "crm", "erp"] as const;
  const categoryLabels: Record<(typeof categories)[number], string> = {
    payments: "Платежи",
    delivery: "Доставка",
    crm: "CRM",
    erp: "ERP",
  };

  useEffect(() => {
    crmPaymentProvidersApi
      .list()
      .then(setPaymentProviders)
      .catch(() => setPaymentProviders([]))
      .finally(() => setLoading(false));
  }, []);

  // Tinkoff, Sber, ATOL — основные. Stripe в API, UI при необходимости.
  const paymentList = paymentProviders.filter((p) => ["tinkoff", "sber", "atol"].includes(p.name));

  return (
    <div className="space-y-4 animate-fade-in">
      <PaymentAlertsBanner />
      <PageHeader title="Интеграции" description="Подключения к внешним сервисам" />

      <Tabs defaultValue="payments">
        <TabsList>
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>
              {categoryLabels[c]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentList.map((p) => (
                <div
                  key={p.name}
                  className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => navigate(`/crm/integrations/${p.name}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{PAYMENT_ICONS[p.name] || "💳"}</span>
                      <span className="font-medium text-sm">{p.title}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {p.status === "connected" ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {p.status === "connected" ? "Подключен" : "Не настроен"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/crm/integrations/${p.name}`);
                    }}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Настроить
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {categories
          .filter((c) => c !== "payments")
          .map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations
                  .filter((i) => i.category === cat)
                  .map((integ) => (
                    <div
                      key={integ.id}
                      className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                      onClick={() => setSelected(integ)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{integ.icon}</span>
                          <span className="font-medium text-sm">{integ.name}</span>
                        </div>
                        <StatusBadge status={integ.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{integ.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {integ.status === "connected" ? (
                          <Wifi className="h-3 w-3" />
                        ) : (
                          <WifiOff className="h-3 w-3" />
                        )}
                        Синхр.: {integ.lastSync}
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
      </Tabs>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
              </div>
              <div>
                <Label className="text-xs">API Key</Label>
                <Input
                  className="h-8 text-sm mt-1 font-mono"
                  value={selected.apiKey || ""}
                  placeholder="Введите API ключ..."
                  readOnly
                />
              </div>
              <div>
                <Label className="text-xs">Webhook URL</Label>
                <Input
                  className="h-8 text-sm mt-1 font-mono"
                  value={selected.webhookUrl || ""}
                  placeholder="https://..."
                  readOnly
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  {selected.status === "connected" ? "Обновить" : "Подключить"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
