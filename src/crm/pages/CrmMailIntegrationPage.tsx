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

const KNOWN_SLUGS = ["smtp"] as const;

type MailDetail = DeliveryIntegrationDetail & { last_successful_send_at?: string | null };

const SMTP_GUIDE = `Подключение SMTP для рассылок и транзакционных писем:

1. Возьмите данные у почтового провайдера (Mail.ru, Yandex 360, Gmail через «Пароли приложений», корпоративный SMTP).

2. Порт обычно 587 с TLS или 465 с SSL. Укажите encryption: tls | ssl | none соответственно.

3. «От имени» (from_email/from_name): домен совпадайте с SPF/DKIM, иначе письма могут падать в спам.

4. После сохранения включите переключатель «Активен» и отправьте тест на свой ящик.

5. Автоматические письма (регистрация / заказ) используют тот же SMTP и шаблоны в разделе «Шаблоны».`;

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
        if (k === "password" && (str === "" || str === "***")) continue;
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
    if (!detail.is_active) {
      toast.error("Сначала активируйте SMTP");
      return;
    }
    setTesting(true);
    try {
      const res = await crmMailIntegrationsApi.test(detail.name, {
        to: testTo.trim(),
        subject: testSubject.trim(),
      });
      toast[res.success ? "success" : "error"](res.message);
      if (res.success) {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={detail.title}
        description="Исходящая почта (SMTP) для маркетинга и уведомлений"
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
            Справочник отправки Laravel <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <Textarea rows={11} readOnly value={SMTP_GUIDE} className="text-xs font-sans whitespace-pre-wrap bg-muted/40" />
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
        <h2 className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4" /> Тест SMTP</h2>
        <div className="grid gap-3 max-w-xl">
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
        </div>
      </section>
    </div>
  );
}
