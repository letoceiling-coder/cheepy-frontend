import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Wifi, WifiOff, Settings } from "lucide-react";
import {
  crmPaymentProvidersApi,
  crmDeliveryIntegrationsApi,
  crmSmsIntegrationsApi,
  crmMailIntegrationsApi,
  crmSocialOauthIntegrationsApi,
  type PaymentProviderItem,
  type DeliveryIntegrationItem,
  type MailIntegrationListItem,
  type SocialOauthIntegrationItem,
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
  russian_post: { icon: "📬", description: "Тарифы и отправления (API «Отправка» Почты России)" },
};

const MAPS_UI: Record<string, { icon: string; description: string }> = {
  yandex_maps: {
    icon: "🗺️",
    description: "Geocoder и Suggest (часто нужен отдельный продукт «Геосаджест» в кабинете) — HTTP API Яндекс.Карт",
  },
};

const SMS_UI: Record<string, { icon: string; description: string }> = {
  iqsms: { icon: "📲", description: "SMS через REST API (SMS Дисконт / iqsms.ru)" },
};

const MAIL_UI: Record<string, { icon: string; description: string }> = {
  smtp: { icon: "✉️", description: "SMTP (маркетинг и транзакционные письма из CRM)" },
  telegram: { icon: "✈️", description: "Telegram Bot API (токен, тест getMe / sendMessage)" },
  whatsapp: { icon: "💬", description: "WhatsApp Cloud API Meta (phone_number_id, access_token)" },
  vk: { icon: "🔵", description: "VK API сообщества (group_access_token, group_id)" },
};

const SOCIAL_UI: Record<string, { icon: string; description: string }> = {
  vk: { icon: "🔵", description: "Вход через VK OAuth (официальный поток authorization code)" },
  yandex: { icon: "🔴", description: "Вход через Яндекс ID (OAuth)" },
  ok: { icon: "🟠", description: "Вход через Одноклассники (OAuth)" },
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
  const [smsRows, setSmsRows] = useState<DeliveryIntegrationItem[]>([]);
  const [mailRows, setMailRows] = useState<MailIntegrationListItem[]>([]);
  const [socialRows, setSocialRows] = useState<SocialOauthIntegrationItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [loadingSms, setLoadingSms] = useState(true);
  const [loadingMail, setLoadingMail] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(true);

  const categories = ["payments", "delivery", "maps", "sms", "mail", "social", "ai", "crm", "erp"] as const;
  const categoryLabels: Record<(typeof categories)[number], string> = {
    payments: "Платежи",
    delivery: "Доставка",
    maps: "Карты",
    sms: "SMS",
    mail: "Email",
    social: "Соцсети",
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

  useEffect(() => {
    crmSmsIntegrationsApi
      .list()
      .then(setSmsRows)
      .catch(() => setSmsRows([]))
      .finally(() => setLoadingSms(false));
  }, []);

  useEffect(() => {
    crmMailIntegrationsApi
      .list()
      .then(setMailRows)
      .catch(() => setMailRows([]))
      .finally(() => setLoadingMail(false));
  }, []);

  useEffect(() => {
    crmSocialOauthIntegrationsApi
      .list()
      .then(setSocialRows)
      .catch(() => setSocialRows([]))
      .finally(() => setLoadingSocial(false));
  }, []);

  const paymentList = paymentProviders.filter((p) => ["tinkoff", "sber", "atol"].includes(p.name));
  const deliveryOnlyRows = deliveryRows.filter((r) => r.name !== "yandex_maps");
  const mapsRows = deliveryRows.filter((r) => r.name === "yandex_maps");

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
              {deliveryOnlyRows.map((row) => {
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
                      {row.name === "cdek" ? `OAuth OK: ${fmtSync(row.last_successful_auth_at)}` : `Статус: ${row.status === "connected" ? "настроено" : "не настроено"}`}
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

        <TabsContent value="maps" className="mt-4">
          {loadingDelivery ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : mapsRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Карточек карт нет в ответе API.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapsRows.map((row) => {
                const ui = MAPS_UI[row.name] ?? { icon: "🗺️", description: "Карты и геокодирование" };
                return (
                  <div
                    key={row.name}
                    role="link"
                    tabIndex={0}
                    className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => navigate(`/crm/integrations/maps/${row.name}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/crm/integrations/maps/${row.name}`);
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
                      Ключ API: {row.status === "connected" ? "указан" : "не указан"}
                      {row.last_successful_auth_at ? ` · проверка ${fmtSync(row.last_successful_auth_at)}` : ""}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/crm/integrations/maps/${row.name}`}>
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

        <TabsContent value="sms" className="mt-4">
          {loadingSms ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {smsRows.map((row) => {
                const ui = SMS_UI[row.name] ?? { icon: "📲", description: "" };
                return (
                  <div
                    key={row.name}
                    role="link"
                    tabIndex={0}
                    className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => navigate(`/crm/integrations/sms/${row.name}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/crm/integrations/sms/${row.name}`);
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
                      Последний успех API: {fmtSync(row.last_successful_auth_at)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/crm/integrations/sms/${row.name}`}>
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

        <TabsContent value="mail" className="mt-4">
          {loadingMail ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : mailRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Интеграции почты не найдены. Убедитесь, что миграции и сид приложены на сервере API.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mailRows.map((row) => {
                const ui = MAIL_UI[row.name] ?? { icon: "✉️", description: "Отправка писем" };
                return (
                  <div
                    key={row.name}
                    role="link"
                    tabIndex={0}
                    className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => navigate(`/crm/integrations/mail/${row.name}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/crm/integrations/mail/${row.name}`);
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
                      {row.is_active ? "Активен" : "Выключен"}
                      {row.last_successful_send_at ? ` · тест OK: ${fmtSync(row.last_successful_send_at)}` : ""}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/crm/integrations/mail/${row.name}`}>
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

        <TabsContent value="social" className="mt-4">
          {loadingSocial ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialRows.map((row) => {
                const ui = SOCIAL_UI[row.name] ?? { icon: "🔗", description: "" };
                return (
                  <div
                    key={row.name}
                    role="link"
                    tabIndex={0}
                    className="p-4 rounded-lg border border-border bg-card space-y-3 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => navigate(`/crm/integrations/social/${row.name}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/crm/integrations/social/${row.name}`);
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
                      Успешный OAuth: {fmtSync(row.last_successful_oauth_at)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/crm/integrations/social/${row.name}`}>
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
