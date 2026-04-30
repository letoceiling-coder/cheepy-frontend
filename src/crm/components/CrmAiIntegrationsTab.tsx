import { useCallback, useEffect, useState } from "react";
import { crmAiProvidersApi, type AiProviderItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink } from "lucide-react";

type Draft = {
  is_active: boolean;
  default_model: string;
  api_key: string;
};

export default function CrmAiIntegrationsTab() {
  const [items, setItems] = useState<AiProviderItem[]>([]);
  const [catalogAt, setCatalogAt] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [clearing, setClearing] = useState<string | null>(null);

  const load = useCallback(() => {
    return crmAiProvidersApi
      .list()
      .then((res) => {
        setItems(res.data);
        setCatalogAt(res.catalog_updated_at || "");
        const next: Record<string, Draft> = {};
        for (const p of res.data) {
          next[p.name] = {
            is_active: p.is_active,
            default_model: p.default_model,
            api_key: "",
          };
        }
        setDrafts(next);
      })
      .catch(() => {
        setItems([]);
        setDrafts({});
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const setDraft = (name: string, partial: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...partial },
    }));
  };

  const handleSave = async (name: string) => {
    const d = drafts[name];
    if (!d) return;
    setSaving(name);
    try {
      const payload: { is_active: boolean; default_model: string; api_key?: string } = {
        is_active: d.is_active,
        default_model: d.default_model,
      };
      const trimmed = d.api_key.trim();
      if (trimmed !== "") {
        payload.api_key = trimmed;
      }
      await crmAiProvidersApi.update(name, payload);
      await load();
      setDraft(name, { api_key: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const handleClearKey = async (name: string) => {
    setClearing(name);
    try {
      await crmAiProvidersApi.clearKey(name);
      await load();
      setDraft(name, { api_key: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => {
          const d = drafts[p.name];
          if (!d) return null;
          return (
            <div
              key={p.name}
              className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col shadow-sm"
            >
              <div>
                <h3 className="text-base font-semibold">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
              </div>
              {p.docs_url ? (
                <a
                  href={p.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline w-fit"
                >
                  Документация
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`ai-en-${p.name}`}
                  checked={d.is_active}
                  onCheckedChange={(v) => setDraft(p.name, { is_active: v === true })}
                />
                <Label htmlFor={`ai-en-${p.name}`} className="text-sm font-normal cursor-pointer">
                  Включить интеграцию
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Модель по умолчанию</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={d.default_model}
                  onChange={(e) => setDraft(p.name, { default_model: e.target.value })}
                >
                  {p.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">API ключ</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="font-mono text-sm"
                  placeholder={
                    p.has_api_key ? "Оставьте пустым, чтобы не менять ключ" : "Вставьте ключ"
                  }
                  value={d.api_key}
                  onChange={(e) => setDraft(p.name, { api_key: e.target.value })}
                />
                {p.has_api_key && p.api_key_hint ? (
                  <p className="text-xs text-muted-foreground">
                    Сохранённый ключ: {p.api_key_hint}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 mt-auto">
                <Button
                  size="sm"
                  className="flex-1 min-w-[120px]"
                  onClick={() => handleSave(p.name)}
                  disabled={saving === p.name}
                >
                  {saving === p.name ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Сохранить
                </Button>
                {p.has_api_key ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleClearKey(p.name)}
                    disabled={clearing === p.name}
                  >
                    {clearing === p.name ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить ключ"}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {catalogAt ? (
        <p className="text-xs text-muted-foreground">
          Каталог моделей на сервере обновлён: {catalogAt}. При выходе новых версий провайдеров список
          правится в каталоге API (см. документацию по ссылкам выше).
        </p>
      ) : null}
    </div>
  );
}
