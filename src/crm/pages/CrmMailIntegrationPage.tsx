import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  crmMailIntegrationsApi,
  type DeliveryIntegrationDetail,
  type ConfigSchemaField,
} from "@/lib/api";
import { ArrowLeft, Loader2, Zap, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const KNOWN_SLUGS = ["smtp", "telegram", "whatsapp", "vk"] as const;

type MailDetail = DeliveryIntegrationDetail & { last_successful_send_at?: string | null };

const MAIL_GUIDES: Record<(typeof KNOWN_SLUGS)[number], string> = {
  smtp: `Подключение SMTP для рассылок и транзакционных писем:

1. Возьмите данные у почтового провайдера (Mail.ru, Yandex 360, Gmail через «Пароли приложений», корпоративный SMTP).

2. Порт обычно 587 с TLS или 465 с SSL. Укажите encryption: tls | ssl | none соответственно.

3. «От имени» (from_email/from_name): домен совпадайте с SPF/DKIM, иначе письма могут падать в спам.

4. После сохранения включите переключатель «Активен» и отправьте тест на свой ящик.

5. Автоматические письма (регистрация / заказ) используют тот же SMTP и шаблоны в разделе «Шаблоны».`,

  telegram: `Telegram Bot API (маркетинговый канал в CRM):

1. Создайте бота через @BotFather, получите токен и вставьте его в поле ниже (хранится маскированно после сохранения).

2. Поле default_chat_id — для проверки отправки на конкретный чат (можно узнать через @userinfobot или ответ боту в личке после /start).

3. Кнопка «Проверить» вызывает getMe; если указан Chat ID или default_chat_id в конфиге — пробует sendMessage.

4. Массовые рассылки в Telegram в CRM требуют отдельного учёта chat_id пользователей (в разработке).`,

  whatsapp: `WhatsApp Cloud API (Meta):

1. В Meta for Developers создайте приложение, подключите продукт WhatsApp, получите Phone number ID и постоянный access token.

2. Заполните phone_number_id и access_token ниже (токен — секретный, после сохранения отображается как ***).

3. Отправку шаблонных сообщений и вебхуки подключайте по документации Meta — интеграция в этом экране хранит только ключи.

4. Автоматическая проверка из CRM может быть недоступна до полной привязки номера у Meta — используйте Graph API напрямую для отладки.`,

  vk: `VK: сообщества (API ключ):

1. В настройках сообщества откройте «Работа с API», создайте ключ с нужными правами (сообщения сообщества при необходимости).

2. Укажите group_access_token и числовой group_id сообщества.

3. Массовые рассылки VK в CRM дополняются отдельными сценариями (виджеты, видеообъявления) — здесь сохраняются ключи для будущих сценариев.

4. Автотест отправки сообщения может быть недоступен — проверяйте токен вручную в API Explorer.`,
};

function pageDescription(slug: (typeof KNOWN_SLUGS)[number]): string {
  switch (slug) {
    case "smtp":
      return "Исходящая почта (SMTP) для маркетинга и уведомлений";
    case "telegram":
      return "Токен бота Telegram для маркетингового канала и тестов API";
    case "whatsapp":
      return "WhatsApp Cloud API — реквизиты для отправки сообщений";
    case "vk":
      return "Ключ доступа сообщества VK";
    default:
      return "Интеграция";
  }
}

export default function CrmMailIntegrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MailDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testSubject, setTestSubject] = useState("");

  useEffect(() => {
    if (!slug || !KNOWN_SLUGS.includes(slug as (typeof KNOWN_SLUGS)[number])) {
      navigate("/crm/integrations");
      return;
    }
    crmMailIntegrationsApi
      .get(slug)
      .then((d) => {
        setDetail(d as MailDetail);
        const cfg = (d.config ?? {}) as Record<string, unknown>;
        const hints = d.hints ?? {};
        const init: Record<string, string> = {};
        for (const f of d.config_schema ?? []) {
          if (f.readonly && hints[f.key] != null) {
            init[f.key] = String(hints[f.key]);
          } else {
            init[f.key] = String(cfg[f.key] ?? "");
          }
        }
        setForm(init);
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const editableKeys = (detail.config_schema ?? []).filter((f) => !f.readonly).map((f) => f.key);
      const payload: Record<string, string | null> = {};
      for (const k of editableKeys) {
        const v = form[k];
        const str = v != null ? String(v).trim() : "";
        const maskedSecrets = ["password", "bot_token", "access_token", "group_access_token"];
        if (maskedSecrets.includes(k) && (str === "" || str === "***")) continue;
        payload[k] = str !== "" ? str : null;
      }
      const res = await crmMailIntegrationsApi.update(detail.name, payload);
      setDetail(res as MailDetail);
      toast.success("Сохранено");
      const cfg = (res.config ?? {}) as Record<string, unknown>;
      setForm((prev) => {
        const next = { ...prev };
        for (const f of res.config_schema ?? []) {
          if (!f.readonly) next[f.key] = String(cfg[f.key] ?? "");
        }
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await crmMailIntegrationsApi.update(detail.name, { is_active: checked });
      setDetail((prev) => (prev ? { ...prev, is_active: res.is_active, status: res.status } : null));
    } catch {
      toast.error("Не удалось переключить статус");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!detail) return;
    const name = detail.name;

    if (name === "smtp") {
      if (!detail.is_active) {
        toast.error("Сначала активируйте SMTP");
        return;
      }
      if (!testTo.trim()) {
        toast.error("Укажите email для теста");
        return;
      }
    }

    setTesting(true);
    try {
      let body: Record<string, string> = {};
      if (name === "smtp") {
        body = { to: testTo.trim(), subject: testSubject.trim() };
      } else if (name === "telegram") {
        body = { chat_id: testTo.trim(), subject: testSubject.trim() };
      } else {
        body = {};
      }

      const res = await crmMailIntegrationsApi.test(name, body);
      toast[res.success ? "success" : "error"](res.message);
      if (res.success && (name === "smtp" || name === "telegram")) {
        const fresh = await crmMailIntegrationsApi.get(detail.name);
        setDetail(fresh as MailDetail);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Тест не удался");
    } finally {
      setTesting(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const schema = detail.config_schema ?? [];
  const isReadonly = (f: ConfigSchemaField) => !!f.readonly;

  const lastSent = detail.last_successful_send_at ?? (detail as { last_successful_auth_at?: string }).last_successful_auth_at;
  const slugKey = (KNOWN_SLUGS.includes(detail.name as (typeof KNOWN_SLUGS)[number]) ? detail.name : "smtp") as (typeof KNOWN_SLUGS)[number];
  const guideText = MAIL_GUIDES[slugKey];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={detail.title}
        description={pageDescription(slugKey)}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/crm/integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
        }
      />

      {detail.docs_url ? (
        <p className="text-sm">
          <a href={detail.docs_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            Документация провайдера / API <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <Textarea rows={11} readOnly value={guideText} className="text-xs font-sans whitespace-pre-wrap bg-muted/40" />
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">Статус</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={detail.status} />
              {lastSent ? <span className="text-xs text-muted-foreground font-mono">Последняя отправка: {lastSent}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={detail.is_active} onCheckedChange={(v) => void handleToggleActive(v)} disabled={saving} />
            <Label className="text-sm whitespace-nowrap">Активен</Label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h2 className="text-sm font-medium">Реквизиты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schema.map((f) => (
            <div key={f.key} className={f.type === "password" ? "md:col-span-2" : ""}>
              <Label className="text-xs">{f.label}</Label>
              <Input
                className="h-9 text-sm mt-1"
                type={f.type === "password" ? "password" : "text"}
                value={form[f.key] ?? ""}
                disabled={isReadonly(f)}
                placeholder={f.required ? "обязательно" : undefined}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>Сохранить</Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          {detail.name === "smtp" ? "Тест SMTP" : detail.name === "telegram" ? "Проверка Telegram" : "Проверка интеграции"}
        </h2>
        <div className="grid gap-3 max-w-xl">
          {detail.name === "smtp" ? (
            <>
              <div>
                <Label className="text-xs">На адрес</Label>
                <Input className="h-9 mt-1" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label className="text-xs">Тема (необязательно)</Label>
                <Input className="h-9 mt-1" value={testSubject} onChange={(e) => setTestSubject(e.target.value)} placeholder={`[${detail.title}] тест`} />
              </div>
              <Button size="sm" className="w-fit" variant="outline" disabled={testing || testTo.trim() === ""} onClick={() => void handleTest()}>
                {testing ? "Отправка…" : "Отправить тест"}
              </Button>
            </>
          ) : detail.name === "telegram" ? (
            <>
              <div>
                <Label className="text-xs">Chat ID для sendMessage (необязательно)</Label>
                <Input className="h-9 mt-1 font-mono" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Из default_chat_id или свой" />
              </div>
              <Button size="sm" className="w-fit" variant="outline" disabled={testing} onClick={() => void handleTest()}>
                {testing ? "Запрос…" : "Проверить токен (getMe)"}
              </Button>
              <p className="text-[11px] text-muted-foreground">Без поля выполняется только getMe. С Chat ID — дополнительно тестовое сообщение.</p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Для этого канала полноценный тест из CRM пока возвращает подсказку с бэкенда — сохраните ключи и проверьте отправку через API провайдера.
              </p>
              <Button size="sm" className="w-fit" variant="outline" disabled={testing} onClick={() => void handleTest()}>
                {testing ? "Запрос…" : "Запрос проверки"}
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
