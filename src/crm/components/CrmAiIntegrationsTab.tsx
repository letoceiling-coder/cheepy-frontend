import { useCallback, useEffect, useMemo, useState } from "react";
import {
  crmAiProvidersApi,
  type AiActiveAgentOption,
  type AiProviderItem,
  type AiProviderModelOption,
  type AiTokenUsageRow,
  ApiError,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Draft = {
  default_model: string;
  api_key: string;
  base_url: string;
};

const OLLAMA_DEFAULT_BASE_URL = "https://ollama.siteaacess.store/v1";
const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(d);
  } catch {
    return iso;
  }
}

export default function CrmAiIntegrationsTab() {
  const [items, setItems] = useState<AiProviderItem[]>([]);
  const [catalogAt, setCatalogAt] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [clearing, setClearing] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string>("site_al");
  const [agentOptions, setAgentOptions] = useState<AiActiveAgentOption[]>([]);
  const [switchingAgent, setSwitchingAgent] = useState(false);

  const [usageRows, setUsageRows] = useState<AiTokenUsageRow[]>([]);
  const [usageMeta, setUsageMeta] = useState({ page: 1, lastPage: 1, total: 0 });
  const [usageLoading, setUsageLoading] = useState(false);

  const [ollamaRemoteModels, setOllamaRemoteModels] = useState<AiProviderModelOption[]>([]);
  const [ollamaModelsLoading, setOllamaModelsLoading] = useState(false);

  const [openrouterRemoteModels, setOpenrouterRemoteModels] = useState<AiProviderModelOption[]>([]);
  const [openrouterModelsLoading, setOpenrouterModelsLoading] = useState(false);

  const openrouterProvider = useMemo(() => items.find((i) => i.name === "openrouter"), [items]);
  const openrouterDraft = drafts["openrouter"];

  const openrouterSelectOptions = useMemo(() => {
    const fallback = openrouterProvider?.models ?? [];
    const opts = openrouterRemoteModels.length > 0 ? openrouterRemoteModels : fallback;
    const dm = openrouterDraft?.default_model?.trim();
    if (dm && !opts.some((o) => o.id === dm)) {
      return [...opts, { id: dm, label: `${dm} (текущая)` }];
    }
    return opts;
  }, [openrouterProvider, openrouterRemoteModels, openrouterDraft?.default_model]);

  const ollamaProvider = useMemo(() => items.find((i) => i.name === "ollama"), [items]);
  const ollamaDraft = drafts["ollama"];

  const ollamaSelectOptions = useMemo(() => {
    const fallback = ollamaProvider?.models ?? [];
    const opts = ollamaRemoteModels.length > 0 ? ollamaRemoteModels : fallback;
    const dm = ollamaDraft?.default_model?.trim();
    if (dm && !opts.some((o) => o.id === dm)) {
      return [...opts, { id: dm, label: `${dm} (текущая)` }];
    }
    return opts;
  }, [ollamaProvider, ollamaRemoteModels, ollamaDraft?.default_model]);

  const refreshOpenrouterModels = useCallback(async () => {
    setOpenrouterModelsLoading(true);
    try {
      const res = await crmAiProvidersApi.openrouterModels();
      setOpenrouterRemoteModels(res.data);
    } catch (e) {
      setOpenrouterRemoteModels([]);
      const msg = e instanceof ApiError ? e.message : "Не удалось загрузить список моделей OpenRouter";
      toast.error(msg);
    } finally {
      setOpenrouterModelsLoading(false);
    }
  }, []);

  const refreshOllamaModels = useCallback(async () => {
    setOllamaModelsLoading(true);
    try {
      const res = await crmAiProvidersApi.ollamaModels();
      setOllamaRemoteModels(res.data);
    } catch (e) {
      setOllamaRemoteModels([]);
      const msg = e instanceof ApiError ? e.message : "Не удалось загрузить список моделей Ollama";
      toast.error(msg);
    } finally {
      setOllamaModelsLoading(false);
    }
  }, []);

  const providerTitle = useMemo(() => {
    const m = new Map<string, string>();
    m.set("site_al", "Site-al");
    for (const p of items) {
      m.set(p.name, p.title);
    }
    return m;
  }, [items]);

  const loadProviders = useCallback(() => {
    return crmAiProvidersApi
      .list()
      .then((res) => {
        setItems(res.data);
        setCatalogAt(res.catalog_updated_at || "");
        setActiveAgent(res.active_agent_provider || "site_al");
        setAgentOptions(res.active_agent_options || []);
        const next: Record<string, Draft> = {};
        for (const p of res.data) {
          next[p.name] = {
            default_model: p.default_model,
            api_key: "",
            base_url: p.base_url || (p.name === "ollama" ? OLLAMA_DEFAULT_BASE_URL : p.name === "openrouter" ? OPENROUTER_DEFAULT_BASE_URL : ""),
          };
        }
        setDrafts(next);
      })
      .catch(() => {
        setItems([]);
        setDrafts({});
        setAgentOptions([]);
      });
  }, []);

  const loadUsage = useCallback((page: number) => {
    setUsageLoading(true);
    return crmAiProvidersApi
      .tokenUsage(page, 40)
      .then((res) => {
        setUsageRows(res.data);
        setUsageMeta({
          page: res.meta.current_page,
          lastPage: res.meta.last_page,
          total: res.meta.total,
        });
      })
      .catch(() => {
        setUsageRows([]);
      })
      .finally(() => setUsageLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadProviders().finally(() => setLoading(false));
  }, [loadProviders]);

  useEffect(() => {
    void loadUsage(1);
  }, [loadUsage]);

  useEffect(() => {
    if (ollamaProvider?.has_api_key) {
      void refreshOllamaModels();
    } else {
      setOllamaRemoteModels([]);
    }
  }, [ollamaProvider?.has_api_key, refreshOllamaModels]);

  useEffect(() => {
    if (openrouterProvider?.has_api_key) {
      void refreshOpenrouterModels();
    } else {
      setOpenrouterRemoteModels([]);
    }
  }, [openrouterProvider?.has_api_key, refreshOpenrouterModels]);

  const setDraft = (name: string, partial: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...partial },
    }));
  };

  const handleActiveChange = async (value: string) => {
    setSwitchingAgent(true);
    try {
      const res = await crmAiProvidersApi.setActiveAgent(value);
      setActiveAgent(res.active_agent_provider);
      setAgentOptions(res.active_agent_options);
      toast.success("Источник для агента обновлён");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось сменить источник агента");
    } finally {
      setSwitchingAgent(false);
    }
  };

  const handleSave = async (name: string) => {
    const d = drafts[name];
    if (!d) return;
    setSaving(name);
    try {
      const payload: {
        default_model: string;
        api_key?: string;
        base_url?: string;
      } = {
        default_model: d.default_model,
      };
      const trimmed = d.api_key.trim();
      if (trimmed !== "") {
        payload.api_key = trimmed;
      }
      if (name === "ollama" || name === "openai" || name === "xai" || name === "openrouter") {
        if (name === "ollama") {
          payload.base_url = d.base_url.trim() === "" ? OLLAMA_DEFAULT_BASE_URL : d.base_url.trim();
        } else {
          payload.base_url = d.base_url.trim();
        }
      }

      await crmAiProvidersApi.update(name, payload);
      await loadProviders();
      setDraft(name, { api_key: "" });
      toast.success("Сохранено");
    } catch (e) {
      console.error(e);
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(null);
    }
  };

  const handleClearKey = async (name: string) => {
    setClearing(name);
    try {
      await crmAiProvidersApi.clearKey(name);
      await loadProviders();
      setDraft(name, { api_key: "" });
      toast.success("Ключ удалён");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось удалить ключ");
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
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Источник для агента CRM</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Один вариант: кнопки «Агент» / «Запуск» на модерации и массовая генерация на главной CRM
              используют выбранный канал. Site-al поддерживает цепочку диалогов (conversationId); облачные
              модели и Ollama работают покадрово без сохранения истории на сервере.
            </p>
          </div>
          {switchingAgent ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        <RadioGroup
          value={activeAgent}
          onValueChange={(v) => void handleActiveChange(v)}
          disabled={switchingAgent}
          className="grid gap-3 sm:grid-cols-2"
        >
          {agentOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer gap-3 rounded-md border border-border bg-card p-3 shadow-sm hover:bg-accent/40"
            >
              <RadioGroupItem value={opt.value} id={`agent-opt-${opt.value}`} className="mt-1" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-sm font-medium leading-none">{opt.title}</span>
                <p className="text-[11px] text-muted-foreground leading-snug">{opt.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => {
          const d = drafts[p.name];
          if (!d) return null;
          const showBaseUrl =
            p.name === "ollama" || p.name === "openai" || p.name === "xai" || p.name === "openrouter";
          return (
            <div
              key={p.name}
              className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col shadow-sm"
            >
              <div>
                <h3 className="text-base font-semibold">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                {!p.agent_chat_capable ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2">
                    Не используется как текстовый источник для агента (другие сценарии, например медиа).
                  </p>
                ) : null}
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

              <div className="space-y-1.5">
                <Label className="text-xs">Модель по умолчанию</Label>
                {p.name === "ollama" || p.name === "openrouter" ? (
                  <>
                    <div className="flex gap-2 items-stretch sm:items-center">
                      <select
                        className="flex h-9 flex-1 min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={d.default_model}
                        onChange={(e) => setDraft(p.name, { default_model: e.target.value })}
                      >
                        {(p.name === "ollama" ? ollamaSelectOptions : openrouterSelectOptions).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0 px-3"
                        onClick={() =>
                          void (p.name === "ollama" ? refreshOllamaModels() : refreshOpenrouterModels())
                        }
                        disabled={
                          !p.has_api_key ||
                          (p.name === "ollama" ? ollamaModelsLoading : openrouterModelsLoading)
                        }
                        title={
                          !p.has_api_key
                            ? p.name === "ollama"
                              ? "Сначала сохраните Token для Ollama"
                              : "Сначала сохраните API-ключ OpenRouter"
                            : "Запросить список с GET …/v1/models"
                        }
                      >
                        {p.name === "ollama" ? (
                          ollamaModelsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Обновить"
                          )
                        ) : openrouterModelsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Обновить"
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {p.name === "ollama" ? (
                        <>
                          Выпадающий список строится по ответу Ollama (сохранённые Base URL и Token). Если список
                          пустой — проверьте токен и нажмите «Обновить».
                        </>
                      ) : (
                        <>
                          Список подгружается с OpenRouter (нужен сохранённый ключ). Модели с пометкой «— бесплатно»
                          — по суффиксу <code className="text-[10px]">:free</code> или нулевой цене prompt/completion в
                          каталоге провайдера.
                        </>
                      )}
                    </p>
                  </>
                ) : (
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
                )}
                {p.name === "ollama" || p.name === "openrouter" ? (
                  <p className="text-[11px] text-muted-foreground">
                    Имя модели — как <code className="text-[10px]">id</code> в ответе{" "}
                    <code className="text-[10px]">GET /v1/models</code>.
                  </p>
                ) : null}
              </div>

              {showBaseUrl ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {p.name === "ollama"
                      ? "Base URL"
                      : p.name === "openrouter"
                        ? "Base URL (необязательно)"
                        : "Свой base URL (необязательно)"}
                  </Label>
                  <Input
                    type="url"
                    placeholder={
                      p.name === "ollama"
                        ? OLLAMA_DEFAULT_BASE_URL
                        : p.name === "openrouter"
                          ? OPENROUTER_DEFAULT_BASE_URL
                          : "Пусто — дефолт провайдера"
                    }
                    className="font-mono text-xs h-8"
                    value={d.base_url}
                    onChange={(e) => setDraft(p.name, { base_url: e.target.value })}
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label className="text-xs">{p.name === "ollama" ? "Token" : "API ключ"}</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="font-mono text-sm"
                  placeholder={
                    p.has_api_key
                      ? p.name === "ollama"
                        ? "Оставьте пустым, чтобы не менять token"
                        : "Оставьте пустым, чтобы не менять ключ"
                      : p.name === "ollama"
                        ? "Вставьте Bearer token"
                        : "Вставьте ключ"
                  }
                  value={d.api_key}
                  onChange={(e) => setDraft(p.name, { api_key: e.target.value })}
                />
                {p.has_api_key && p.api_key_hint ? (
                  <p className="text-xs text-muted-foreground">
                    {p.name === "ollama" ? "Сохранённый token" : "Сохранённый ключ"}: {p.api_key_hint}
                  </p>
                ) : null}
                {p.name === "ollama" ? (
                  <p className="text-[11px] text-muted-foreground">
                    Токен отправляется как <code className="text-[10px]">Authorization: Bearer ...</code>.
                    Без токена публичный endpoint Ollama возвращает 401.
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

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">Расход токенов</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {usageLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Всего записей: {usageMeta.total}</span>
          </div>
        </div>
        <div className="rounded-md border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="p-2 font-medium">Интеграция</th>
                <th className="p-2 font-medium">Модель</th>
                <th className="p-2 font-medium text-right">Расход (USD)</th>
                <th className="p-2 font-medium">Дата и время</th>
                <th className="p-2 font-medium text-right">Токены (всего)</th>
              </tr>
            </thead>
            <tbody>
              {!usageRows.length ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-muted-foreground">
                    Пока нет записей с распознанным usage от провайдера.
                  </td>
                </tr>
              ) : (
                usageRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/80 last:border-0">
                    <td className="p-2">{providerTitle.get(row.provider) ?? row.provider}</td>
                    <td className="p-2 font-mono text-xs">{row.model}</td>
                    <td className="p-2 text-right tabular-nums">
                      {row.cost_usd != null && row.cost_usd !== "" ? row.cost_usd : "—"}
                    </td>
                    <td className="p-2 text-xs whitespace-nowrap">{formatTs(row.created_at)}</td>
                    <td className="p-2 text-right tabular-nums">
                      {row.total_tokens != null ? row.total_tokens : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {usageMeta.lastPage > 1 ? (
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={usageMeta.page <= 1 || usageLoading}
              onClick={() => void loadUsage(usageMeta.page - 1)}
            >
              Назад
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {usageMeta.page} / {usageMeta.lastPage}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={usageMeta.page >= usageMeta.lastPage || usageLoading}
              onClick={() => void loadUsage(usageMeta.page + 1)}
            >
              Вперёд
            </Button>
          </div>
        ) : null}
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
