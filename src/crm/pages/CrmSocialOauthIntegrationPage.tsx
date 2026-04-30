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
  crmSocialOauthIntegrationsApi,
  type SocialOauthIntegrationDetail,
  type ConfigSchemaField,
} from "@/lib/api";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";

const KNOWN_SLUGS = ["vk", "yandex", "ok"] as const;

function sensitiveKeys(name: string): string[] {
  if (name === "vk") return ["client_secret", "service_token"];
  if (name === "yandex") return ["client_secret"];
  return ["secret_key"];
}

export default function CrmSocialOauthIntegrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<SocialOauthIntegrationDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug || !KNOWN_SLUGS.includes(slug as (typeof KNOWN_SLUGS)[number])) {
      navigate("/crm/integrations");
      return;
    }
    crmSocialOauthIntegrationsApi
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

  const sens = slug ? sensitiveKeys(slug) : [];

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const editableKeys = (detail.config_schema ?? [])
        .filter((f) => !f.readonly)
        .map((f) => f.key);
      const payload: Record<string, string | null> = {};
      for (const k of editableKeys) {
        const v = form[k];
        const str = v != null ? String(v).trim() : "";
        if (sens.includes(k) && (str === "" || str === "***")) continue;
        payload[k] = str !== "" ? str : null;
      }
      const res = await crmSocialOauthIntegrationsApi.update(detail.name, payload);
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
      const res = await crmSocialOauthIntegrationsApi.update(detail.name, { is_active: checked });
      setDetail((prev) => (prev ? { ...prev, is_active: res.is_active, status: res.status } : null));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
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
  const doc = detail.documentation;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title={detail.title}
        description={`OAuth вход через ${detail.title}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/crm/integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
        }
      />

      <section className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <h2 className="text-sm font-semibold">Официальная документация провайдера</h2>
        <ul className="space-y-2 text-sm">
          {doc.official_documentation.map((l) => (
            <li key={l.url}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {l.title}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold">Пошаговая инструкция</h2>
        <ol className="list-decimal pl-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
          {doc.steps.map((s, i) => (
            <li key={i} className="space-y-1">
              <p className="font-medium text-foreground">{s.title}</p>
              <p className="whitespace-pre-wrap">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
          <p>
            <span className="font-medium text-foreground">Рекомендуемые scope: </span>
            {doc.recommended_scopes}
          </p>
          <p className="text-muted-foreground whitespace-pre-wrap">{doc.notes}</p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Статус и URL для консоли приложения</h2>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <StatusBadge status={detail.status} />
          <span className="text-sm text-muted-foreground">
            {detail.status === "connected"
              ? "Обязательные ключи заполнены"
              : "Заполните обязательные поля ниже"}
          </span>
          {detail.last_successful_oauth_at ? (
            <span className="text-xs text-muted-foreground font-mono">
              Последний успешный OAuth: {detail.last_successful_oauth_at}
            </span>
          ) : null}
        </div>
        <div className="space-y-2 text-xs font-mono break-all">
          <div>
            <span className="text-muted-foreground block mb-1">
              Callback URL (укажите в кабинете провайдера)
            </span>
            <span className="text-foreground">{detail.hints.oauth_redirect_uri_for_provider_console}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Базовый callback на API (без переопределения)</span>
            <span className="text-foreground">{detail.hints.oauth_callback_url}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Пример возврата на витрину после входа</span>
            <span className="text-foreground">{detail.hints.frontend_return_example}</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Включить вход через эту соцсеть</h2>
        <div className="flex items-center gap-3">
          <Switch checked={detail.is_active} onCheckedChange={handleToggleActive} disabled={saving} />
          <span className="text-sm text-muted-foreground">
            Только активные и заполненные провайдеры показываются на странице входа витрины
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-4">Параметры приложения</h2>
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
                {field.required ? <span className="text-destructive ml-1">*</span> : null}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  className="mt-1 font-mono text-sm min-h-[72px]"
                  value={form[field.key] ?? ""}
                  placeholder={
                    sens.includes(field.key) && (detail.config as Record<string, unknown>)[field.key] === "***"
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
                    sens.includes(field.key) &&
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
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Сохранить
          </Button>
        </form>
      </section>
    </div>
  );
}
