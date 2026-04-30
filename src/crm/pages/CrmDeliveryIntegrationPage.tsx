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
  crmDeliveryIntegrationsApi,
  type DeliveryIntegrationDetail,
  type ConfigSchemaField,
} from "@/lib/api";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Zap, ExternalLink } from "lucide-react";

const KNOWN_SLUGS = ["cdek", "nova_poshta", "dhl"] as const;

function cdekLiveEndpoints(environment: string): { oauth_token_url: string; api_base_url: string } {
  const base = environment === "integration" ? "https://api.edu.cdek.ru" : "https://api.cdek.ru";
  return { api_base_url: base, oauth_token_url: `${base}/v2/oauth/token` };
}

const CDEK_DOCS = `По документации СДЭК API v2:

1. Получите в личном кабинете СДЭК идентификатор аккаунта (Account) и секретный ключ (Secure password).

2. Выберите контур: боевой (api.cdek.ru) или интеграционный (api.edu.cdek.ru) для отладки.

3. Сохраните настройки и нажмите «Проверить OAuth» — выполняется запрос grant_type=client_credentials к /v2/oauth/token.

4. Поля отправителя и тарифа понадобятся при создании заказов через API (методы заказа и тарифов — в официальной документации).

5. URL вебхука статусов заказа при необходимости укажите в настройках интеграции в ЛК СДЭК.`;

export default function CrmDeliveryIntegrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<DeliveryIntegrationDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!slug || !KNOWN_SLUGS.includes(slug as (typeof KNOWN_SLUGS)[number])) {
      navigate("/crm/integrations");
      return;
    }
    crmDeliveryIntegrationsApi
      .get(slug)
      .then((d) => {
        setDetail(d);
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

  const SENSITIVE_KEYS = ["client_secret"];

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setTestResult(null);
    try {
      const editableKeys = (detail.config_schema ?? [])
        .filter((f) => !f.readonly)
        .map((f) => f.key);
      const payload: Record<string, string | null> = {};
      for (const k of editableKeys) {
        const v = form[k];
        const str = v != null ? String(v).trim() : "";
        if (SENSITIVE_KEYS.includes(k) && (str === "" || str === "***")) continue;
        payload[k] = str !== "" ? str : null;
      }
      const res = await crmDeliveryIntegrationsApi.update(detail.name, payload);
      setDetail(res);
      const cfg = (res.config ?? {}) as Record<string, unknown>;
      setForm((prev) => {
        const next = { ...prev };
        for (const f of res.config_schema ?? []) {
          if (!f.readonly) {
            next[f.key] = String(cfg[f.key] ?? "");
          }
        }
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await crmDeliveryIntegrationsApi.update(detail.name, { is_active: checked });
      setDetail((prev) => (prev ? { ...prev, is_active: res.is_active, status: res.status } : null));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!detail || detail.name !== "cdek") return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await crmDeliveryIntegrationsApi.test(detail.name);
      setTestResult(res);
      if (res.success) {
        const fresh = await crmDeliveryIntegrationsApi.get(detail.name);
        setDetail(fresh);
      }
    } catch (e) {
      setTestResult({ success: false, message: String((e as Error).message) });
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
  const docsBody = detail.name === "cdek" ? CDEK_DOCS : "Документация будет добавлена при подключении службы.";
  const envForHints = String(form.environment ?? "production");
  const liveCdek =
    detail.name === "cdek" ? cdekLiveEndpoints(envForHints) : null;
  const webhookHint = detail.hints?.webhook_order_status_url ?? "";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={detail.title}
        description={`Настройки доставки: ${detail.title}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/crm/integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
        }
      />

      {detail.docs_url && (
        <p className="text-sm">
          <a
            href={detail.docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Официальная документация API <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Статус</h2>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={detail.status} />
          <span className="text-sm text-muted-foreground">
            {detail.status === "connected" ? "Учётные данные заполнены" : "Заполните обязательные поля"}
          </span>
          {detail.last_successful_auth_at && (
            <span className="text-xs text-muted-foreground font-mono">
              Последний успешный OAuth: {detail.last_successful_auth_at}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Включить интеграцию</h2>
        <div className="flex items-center gap-3">
          <Switch checked={detail.is_active} onCheckedChange={handleToggleActive} disabled={saving} />
          <span className="text-sm text-muted-foreground">
            {detail.is_active ? "Включено для сценариев оформления (когда будут подключены)" : "Выключено"}
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-4">Параметры</h2>
        {schema.length === 0 ? (
          <p className="text-sm text-muted-foreground">Настройки для этой службы пока не описаны в API.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4 max-w-2xl"
          >
            {schema.map((field) => (
              <div key={field.key}>
                <Label className="text-xs" htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "select" ? (
                  <select
                    id={field.key}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={form[field.key] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    disabled={isReadonly(field)}
                  >
                    {(field.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    className="mt-1 font-mono text-sm min-h-[88px]"
                    value={form[field.key] ?? ""}
                    placeholder={
                      (detail.config as Record<string, unknown>)[field.key] === "***"
                        ? "Оставьте пустым, чтобы не менять"
                        : ""
                    }
                    readOnly={isReadonly(field)}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={field.key}
                    className="mt-1 font-mono text-sm"
                    type={field.type === "password" ? "password" : "text"}
                    value={
                      isReadonly(field) && liveCdek && field.key === "oauth_token_url"
                        ? liveCdek.oauth_token_url
                        : isReadonly(field) && liveCdek && field.key === "api_base_url"
                          ? liveCdek.api_base_url
                          : isReadonly(field) && field.key === "webhook_order_status_url"
                            ? webhookHint
                            : form[field.key] ?? ""
                    }
                    placeholder={
                      field.type === "password" && (detail.config as Record<string, unknown>)[field.key] === "***"
                        ? "Оставьте пустым, чтобы не менять"
                        : ""
                    }
                    readOnly={isReadonly(field)}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <Button type="submit" className="mt-4" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Сохранить
            </Button>
          </form>
        )}
      </section>

      {detail.name === "cdek" && schema.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium mb-3">Проверка подключения</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Запрос токена OAuth 2.0 (client_credentials) к точке из поля выше; ключи не отображаются в ответе.
          </p>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Проверить OAuth
          </Button>
          {testResult && (
            <div
              className={`mt-3 flex items-center gap-2 text-sm ${testResult.success ? "text-green-600" : "text-destructive"}`}
            >
              {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Как подключить</h2>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{docsBody}</pre>
      </section>
    </div>
  );
}
