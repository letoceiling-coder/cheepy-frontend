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
  crmSmsIntegrationsApi,
  type DeliveryIntegrationDetail,
  type ConfigSchemaField,
} from "@/lib/api";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Zap, ExternalLink } from "lucide-react";

const KNOWN_SLUGS = ["iqsms"] as const;

const IQSMS_GUIDE = `Подключение IQSMS (SMS Дисконт):

1. Зарегистрируйтесь на iqsms.ru и получите логин/пароль API в личном кабинете.

2. Укажите подпись отправителя (sender), если она согласована у оператора — см. список в ЛК.

3. REST API: GET на api.iqsms.ru — передача сообщения, баланс, статусы. Подробнее в официальной документации.

4. «Проверить баланс» выполняет запрос к /messages/v2/balance/ (Basic Auth).

5. «Тестовое SMS» отправляет короткое сообщение на указанный номер (формат РФ: +7… или 8…).`;

export default function CrmSmsIntegrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<DeliveryIntegrationDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    if (!slug || !KNOWN_SLUGS.includes(slug as (typeof KNOWN_SLUGS)[number])) {
      navigate("/crm/integrations");
      return;
    }
    crmSmsIntegrationsApi
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

  const SENSITIVE_KEYS = ["password"];

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
      const res = await crmSmsIntegrationsApi.update(detail.name, payload);
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
      const res = await crmSmsIntegrationsApi.update(detail.name, { is_active: checked });
      setDetail((prev) => (prev ? { ...prev, is_active: res.is_active, status: res.status } : null));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestBalance = async () => {
    if (!detail) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await crmSmsIntegrationsApi.test(detail.name, { mode: "balance" });
      setTestResult({ success: res.success, message: res.message });
      if (res.success) {
        const fresh = await crmSmsIntegrationsApi.get(detail.name);
        setDetail(fresh);
      }
    } catch (e) {
      setTestResult({ success: false, message: String((e as Error).message) });
    } finally {
      setTesting(false);
    }
  };

  const handleTestSend = async () => {
    if (!detail) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await crmSmsIntegrationsApi.test(detail.name, {
        mode: "send",
        test_phone: testPhone.trim(),
        test_message: testMessage.trim() || undefined,
      });
      setTestResult({ success: res.success, message: res.message });
      if (res.success) {
        const fresh = await crmSmsIntegrationsApi.get(detail.name);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={detail.title}
        description="SMS через IQSMS (REST)"
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
            Документация API <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {" · "}
          <a
            href="https://iqsms.ru/api/api_rest/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            REST интерфейс <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Статус</h2>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={detail.status} />
          <span className="text-sm text-muted-foreground">
            {detail.status === "connected"
              ? "Логин и пароль API сохранены"
              : "Заполните логин и пароль"}
          </span>
          {detail.last_successful_auth_at && (
            <span className="text-xs text-muted-foreground font-mono">
              Последний успешный запрос: {detail.last_successful_auth_at}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Включить интеграцию</h2>
        <div className="flex items-center gap-3">
          <Switch checked={detail.is_active} onCheckedChange={handleToggleActive} disabled={saving} />
          <span className="text-sm text-muted-foreground">
            {detail.is_active
              ? "Включено для сценариев отправки SMS из CRM (рассылки и др.)"
              : "Выключено"}
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-4">Параметры</h2>
        {schema.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет полей конфигурации.</p>
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
                {field.type === "textarea" ? (
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
                    value={form[field.key] ?? ""}
                    placeholder={
                      field.type === "password" &&
                      (detail.config as Record<string, unknown>)[field.key] === "***"
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

      <section className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h2 className="text-sm font-medium">Проверка</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleTestBalance} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Проверить баланс
          </Button>
        </div>
        <div className="border-t border-border pt-4 space-y-2 max-w-md">
          <Label className="text-xs">Тестовое SMS на номер (РФ)</Label>
          <Input
            className="font-mono text-sm"
            placeholder="+79161234567"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <Label className="text-xs">Текст (необязательно)</Label>
          <Input
            className="text-sm"
            placeholder="Cheepy CRM: тест SMS"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
          />
          <Button variant="outline" onClick={handleTestSend} disabled={testing}>
            Отправить тест
          </Button>
        </div>
        {testResult && (
          <div
            className={`flex items-center gap-2 text-sm ${testResult.success ? "text-green-600" : "text-destructive"}`}
          >
            {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {testResult.message}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Как подключить</h2>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{IQSMS_GUIDE}</pre>
      </section>
    </div>
  );
}
