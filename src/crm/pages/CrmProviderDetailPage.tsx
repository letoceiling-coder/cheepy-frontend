import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  crmPaymentProvidersApi,
  type PaymentProviderDetail,
  type ConfigSchemaField,
  type WebhookLogItem,
} from "@/lib/api";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Zap, FileText } from "lucide-react";

const PROVIDER_DOCS: Record<string, string> = {
  tinkoff: `1. Войдите в личный кабинет Т-Банк
2. Получите Terminal Key и Password
3. Вставьте ключи ниже
4. Укажите Success URL и Fail URL
5. Нажмите «Проверить подключение»`,
  sber: `1. Зарегистрируйтесь в СберБанк Эквайринг
2. Получите userName и password
3. Вставьте данные ниже
4. Укажите Return URL и Fail URL
5. Нажмите «Проверить подключение»`,
  atol: `1. Подключите АТОЛ Онлайн
2. Получите login, password и group_code
3. Вставьте данные ниже
4. Настройте фискализацию (tax)
5. Нажмите «Проверить подключение»`,
};

export default function CrmProviderDetailPage() {
  const { provider: providerName } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PaymentProviderDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testPaymentLoading, setTestPaymentLoading] = useState(false);
  const [logs, setLogs] = useState<WebhookLogItem[]>([]);

  useEffect(() => {
    if (!providerName || !["tinkoff", "sber", "atol"].includes(providerName)) {
      navigate("/crm/integrations");
      return;
    }
    Promise.all([
      crmPaymentProvidersApi.get(providerName),
      crmPaymentProvidersApi.logs(providerName),
    ])
      .then(([d, l]) => {
        setDetail(d);
        const cfg = (d.config ?? {}) as Record<string, unknown>;
        const init: Record<string, string> = {};
        for (const f of d.config_schema ?? []) {
          if (f.key === "notification_url") {
            init[f.key] = d.notification_url ?? "";
          } else {
            init[f.key] = String(cfg[f.key] ?? "");
          }
        }
        setForm(init);
        setLogs(l.data ?? []);
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [providerName, navigate]);

  const SENSITIVE_KEYS = ["password", "pass", "secret_key"];

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setTestResult(null);
    try {
      const editableKeys = (detail.config_schema ?? [])
        .filter((f) => !f.readonly && f.key !== "notification_url")
        .map((f) => f.key);
      const payload: Record<string, string | null> = {};
      for (const k of editableKeys) {
        const v = form[k];
        const str = v != null ? String(v).trim() : "";
        if (SENSITIVE_KEYS.includes(k) && (str === "" || str === "***")) continue;
        payload[k] = str !== "" ? str : null;
      }
      const res = await crmPaymentProvidersApi.update(detail.name, payload);
      setDetail((prev) => (prev ? { ...prev, ...res } : null));
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
      const res = await crmPaymentProvidersApi.update(detail.name, { is_active: checked });
      setDetail((prev) => (prev ? { ...prev, is_active: res.is_active } : null));
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
      const res = await crmPaymentProvidersApi.test(detail.name);
      setTestResult(res);
    } catch (e) {
      setTestResult({ success: false, message: String((e as Error).message) });
    } finally {
      setTesting(false);
    }
  };

  const handleCreateTestPayment = async () => {
    if (!detail) return;
    setTestPaymentLoading(true);
    setTestResult(null);
    try {
      const res = await crmPaymentProvidersApi.createTestPayment(detail.name);
      setTestResult({ success: true, message: `${res.message} #${res.payment_id} (+${res.amount}₽), баланс: ${res.new_balance}₽` });
      const l = await crmPaymentProvidersApi.logs(detail.name);
      setLogs(l.data ?? []);
    } catch (e) {
      setTestResult({ success: false, message: String((e as Error).message) });
    } finally {
      setTestPaymentLoading(false);
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
  const isReadonly = (f: ConfigSchemaField) => f.readonly || f.key === "notification_url";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={detail.title}
        description={`Управление провайдером ${detail.title}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/crm/integrations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        }
      />

      {/* Section 1 — Status */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Статус</h2>
        <div className="flex items-center gap-3">
          <StatusBadge status={detail.status} />
          <span className="text-sm text-muted-foreground">
            {detail.status === "connected" ? "Провайдер настроен" : "Требуется настройка"}
          </span>
        </div>
      </section>

      {/* Section 2 — Toggle */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Включить / Отключить</h2>
        <div className="flex items-center gap-3">
          <Switch
            checked={detail.is_active}
            onCheckedChange={handleToggleActive}
            disabled={saving}
          />
          <span className="text-sm text-muted-foreground">
            {detail.is_active ? "Провайдер активен" : "Провайдер отключён"}
          </span>
        </div>
      </section>

      {/* Section 3 — Config form */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-4">Настройки</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4 max-w-xl">
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
              ) : (
                <Input
                  id={field.key}
                  className="mt-1 font-mono text-sm"
                  type={field.type === "password" ? "password" : "text"}
                  value={form[field.key] ?? ""}
                  placeholder={
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
      </section>

      {/* Section 4 — Test */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Проверка подключения</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Проверить подключение
          </Button>
          <Button variant="secondary" onClick={handleCreateTestPayment} disabled={testPaymentLoading}>
            {testPaymentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Создать тестовый платёж
          </Button>
        </div>
        {testResult && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${testResult.success ? "text-green-600" : "text-destructive"}`}>
            {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {testResult.message}
          </div>
        )}
      </section>

      {/* Section 5 — Logs */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Последние события</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Событий пока нет</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground">{l.created_at}</span>
                <span>{l.event_id ?? "-"}</span>
                <StatusBadge status={l.status} />
                {l.error && <span className="text-destructive">{l.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Section 6 — Docs */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Как подключить
        </h2>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
          {PROVIDER_DOCS[detail.name] ?? "Инструкция отсутствует."}
        </pre>
      </section>
    </div>
  );
}
