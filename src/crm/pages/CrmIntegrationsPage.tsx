import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Wifi, WifiOff, Settings } from "lucide-react";
import {
  crmPaymentProvidersApi,
  crmDeliveryIntegrationsApi,
  type PaymentProviderItem,
  type DeliveryIntegrationItem,
} from "@/lib/api";
import { PaymentAlertsBanner } from "../components/PaymentAlertsBanner";
import CrmAiIntegrationsTab from "../components/CrmAiIntegrationsTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAYMENT_ICONS: Record<string, string> = {
  tinkoff: "💳",
  sber: "🟢",
  atol: "🧾",
};

const DELIVERY_UI: Record<
  string,
  { icon: string; description: string }
> = {
  cdek: { icon: "📦", description: "Доставка по России и СНГ (OAuth API v2)" },
  nova_poshta: { icon: "📨", description: "Украинская служба доставки" },
  dhl: { icon: "🚀", description: "Международная доставка" },
};

const CRM_CARDS = [
  {
    slug: "bitrix24",
    name: "Bitrix24",
    icon: "🔷",
    description: "CRM и управление продажами",
  },
  {
    slug: "hubspot",
    name: "HubSpot",
    icon: "🟠",
    description: "Marketing & Sales CRM",
  },
];

const ERP_CARDS = [
  {
    slug: "1c",
    name: "1С",
    icon: "🟡",
    description: "Учётная система и складской учёт",
  },
  {
    slug: "sap",
    name: "SAP",
    icon: "🔵",
    description: "Enterprise Resource Planning",
  },
];

function fmtSync(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ru-RU");
  } catch {
    return "—";
  }
}

export default function CrmIntegrationsPage() {
  const navigate = useNavigate();
  const [paymentProviders, setPaymentProviders] = useState<PaymentProviderItem[]>([]);
  const [deliveryRows, setDeliveryRows] = useState<DeliveryIntegrationItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingDelivery, setLoadingDelivery] = useState(true);

  const categories = ["payments", "delivery", "ai", "crm", "erp"] as const;
  const categoryLabels: Record<(typeof categories)[number], string> = {
    payments: "Платежи",
    delivery: "Доставка",
    ai: "ИИ",
    crm: "CRM",
    erp: "ERP",
  };

  useEffect(() => {
    crmPaymentProvidersApi
      .list()
      .then(setPaymentProviders)
      .catch(() => setPaymentProviders([]))
      .finally(() => setLoadingPayments(false));
  }, []);

  useEffect(() => {
    crmDeliveryIntegrationsApi
      .list()
      .then(setDeliveryRows)
      .catch(() => setDeliveryRows([]))
      .finally(() => setLoadingDelivery(false));
  }, []);

  const paymentList = paymentProviders.filter((p) => ["tinkoff", "sber", "atol"].includes(p.name));

  return (
    <div className="space-y-4 animate-fade-in">
      <PaymentAlertsBanner />
      <PageHeader title="Интеграции" description="Подключения к внешним сервисам — каждая настройка на отдельной странице" />

      <Tabs defaultValue="payments">
        <TabsList>
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>
              {categoryLabels[c]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          {loadingPayments ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentList.map((p) => (
                <div
                  key={p.name}
                  role="link"
                  tabIndex={0}
                  className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => navigate(`/crm/integrations/payments/${p.name}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate(`/crm/integrations/payments/${p.name}`);
                  }}
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
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to={`/crm/integrations/payments/${p.name}`}>
                      <Settings className="h-3.5 w-3.5" />
                      Настроить
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="mt-4">
          {loadingDelivery ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryRows.map((row) => {
                const ui = DELIVERY_UI[row.name] ?? { icon: "📮", description: "" };
                return (
                  <div
                    key={row.name}
                    role="link"
                    tabIndex={0}
                    className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => navigate(`/crm/integrations/delivery/${row.name}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/crm/integrations/delivery/${row.name}`);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{ui.icon}</span>
                        <span className="font-medium text-sm">{row.title}</span>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{ui.description}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {row.status === "connected" ? (
                        <Wifi className="h-3 w-3" />
                      ) : (
                        <WifiOff className="h-3 w-3" />
                      )}
                      OAuth OK: {fmtSync(row.last_successful_auth_at)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/crm/integrations/delivery/${row.name}`}>
                        <Settings className="h-3.5 w-3.5" />
                        Настроить
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <CrmAiIntegrationsTab />
        </TabsContent>

        <TabsContent value="crm" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CRM_CARDS.map((c) => (
              <div
                key={c.slug}
                role="link"
                tabIndex={0}
                className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/crm/integrations/crm/${c.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/crm/integrations/crm/${c.slug}`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.icon}</span>
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                  <StatusBadge status="disconnected" />
                </div>
                <p className="text-xs text-muted-foreground">{c.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to={`/crm/integrations/crm/${c.slug}`}>
                    <Settings className="h-3.5 w-3.5" />
                    Открыть
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="erp" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ERP_CARDS.map((c) => (
              <div
                key={c.slug}
                role="link"
                tabIndex={0}
                className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/crm/integrations/erp/${c.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/crm/integrations/erp/${c.slug}`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.icon}</span>
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                  <StatusBadge status="disconnected" />
                </div>
                <p className="text-xs text-muted-foreground">{c.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to={`/crm/integrations/erp/${c.slug}`}>
                    <Settings className="h-3.5 w-3.5" />
                    Открыть
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
