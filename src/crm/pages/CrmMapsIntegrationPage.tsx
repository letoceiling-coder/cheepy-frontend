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

/** Интеграции карт используют тот же CRM API delivery-integrations, что и перевозчики — отдельный UI‑раздел по смыслу. */
const MAPS_SLUGS = ["yandex_maps"] as const;

const YANDEX_MAPS_DOCS = `По официальной документации Яндекс Карт HTTP API:

1. Возьмите API‑ключ в [Кабинете разработчика Яндекс](https://developer.tech.yandex.ru/) — нужен ключ с доступом к продукту **JavaScript API и HTTP Геокодер** (для нашего сервера также используются **Suggest API** HTTPS и **Geocoder** HTTPS endpoints).

2. Вставьте ключ в поле ниже и включите интеграцию.

3. Сохраните настройки, затем «Проверить Suggest API» — выполняется реальный HTTPS‑запрос к \`suggest-maps.yandex.ru/v1/suggest\` (официально: [Suggest API](https://yandex.ru/maps-api/docs/suggest-api/)).

4. Тот же ключ использует бекенд для **геокодера** \`geocode-maps.yandex.ru/1.x\` ([Geocoder API](https://yandex.ru/maps-api/docs/geocoder-api/)) при автоматической подстановке почтовых индексов в адресе клиента — в кабинете должен быть разрешён Geocoder для этого ключа.

5. Поле только для чтения «Endpoint подсказок» — эталонный URL Suggest HTTPS; параметры запросов соответствуют документации.` as const;

export default function CrmMapsIntegrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DeliveryIntegrationDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !MAPS_SLUGS.includes(slug as (typeof MAPS_SLUGS)[number])) {
      navigate("/crm/integrations");
      return;
    }

    let cancelled = false;
    setLoading(true);
    crmDeliveryIntegrationsApi
      .get(slug)
      .then((d) => {
        if (cancelled) return;
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
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const SENSITIVE_KEYS = ["api_key"];

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
    if (!detail) return;
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
  const webhookHintKeys = detail.hints ?? {};

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={detail.title}
        description={`Карты и геокодирование для витрины: ${detail.title}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/crm/integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к интеграциям
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
            Документация Яндекс Suggest API <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <span className="text-muted-foreground mx-2">·</span>
          <a
            href="https://yandex.ru/maps-api/docs/geocoder-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Документация Geocoder API <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Статус</h2>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={detail.status} />
          <span className="text-sm text-muted-foreground">
            {detail.status === "connected" ? "API‑ключ задан и интеграция может работать на бекенде" : "Заполните ключ и включите использование"}
          </span>
          {detail.last_successful_auth_at && (
            <span className="text-xs text-muted-foreground font-mono">
              Последний успешный запрос проверки: {detail.last_successful_auth_at}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Использовать сервис</h2>
        <div className="flex items-center gap-3">
          <Switch checked={detail.is_active} onCheckedChange={handleToggleActive} disabled={saving} />
          <span className="text-sm text-muted-foreground">
            {detail.is_active
              ? "Включено: подсказки адресов в ЛК и геокодирование активны"
              : "Выключено: запросы к API Яндекс не отправляются"}
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-4">Параметры</h2>
        {schema.length === 0 ? (
          <p className="text-sm text-muted-foreground">Схема настроек не пришла с API.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
            className="space-y-4 max-w-2xl"
          >
            {schema.map((field) => (
              <div key={field.key}>
                <Label className="text-xs" htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    className="mt-1 font-mono text-sm min-h-[88px]"
                    value={form[field.key] ?? ""}
                    readOnly={isReadonly(field)}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={field.key}
                    className="mt-1 font-mono text-sm"
                    type={field.type === "password" ? "password" : "text"}
                    value={
                      isReadonly(field)
                        ? String(webhookHintKeys[field.key] ?? form[field.key] ?? "")
                        : form[field.key] ?? ""
                    }
                    placeholder={
                      field.type === "password" &&
                      String((detail.config as Record<string, unknown>)[field.key] ?? "") === "***"
                        ? "Оставьте пустым, чтобы не менять сохранённый ключ"
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

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Проверка ключа по документации Suggest</h2>
        <p className="text-xs text-muted-foreground mb-3">
          HTTP GET на официальный endpoint <code className="text-foreground">suggest-maps.yandex.ru/v1/suggest</code> с параметром{" "}
          <code className="text-foreground">apikey</code> — как в{" "}
          <a href="https://yandex.ru/maps-api/docs/suggest-api/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            руководстве Suggest API
          </a>
          .
        </p>
        <Button variant="outline" onClick={() => void handleTest()} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
          Проверить Suggest API
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

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Как подключить</h2>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{YANDEX_MAPS_DOCS}</pre>
      </section>
    </div>
  );
}
