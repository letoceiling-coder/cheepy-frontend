import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pause, Play, Square, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  adminCatalogApi,
  adminSiteAlApi,
  adminSystemProductsApi,
  ApiError,
  type CatalogCategoryItem,
  type SystemProductItem,
} from "@/lib/api";

const DEFAULT_DESCRIPTION_AGENT_PROMPT = `Ты готовишь описание товара для витрины маркетплейса на русском языке.

ЯЗЫК (обязательно):
— Весь итоговый текст только на русском (кириллица). Пунктуация и числа — как принято в русской витрине.
— Латиница допустима только там, где она уже уместна в товарном контексте: маркировки размеров (S, M, L), известные бренды из исходника, международные единицы, если они уже в тексте. Не добавляй новые английские предложения и пояснения.
— Запрещено: китайский, японский, корейский и любой другой не-русский текст; фразы вроде «please rephrase», «cold water» вместо нормального русского ухода; обращения к пользователю сменить язык или «переформулируйте запрос».
— Если в исходнике фрагмент на другом языке — переведи смысл на русский или опусти, не цитируй иероглифы.

Содержание:
Сделай текст аккуратным и читаемым: убери мусор, дубли, служебные пометки и «воду»; если есть HTML — оставь смысл в виде обычного текста или коротких абзацев.
Удали лишние ссылки и URL (в том числе рекламные), не добавляй новых ссылок.
Сохрани смысл и важные характеристики (материал, состав, размер, уход — если они уже в тексте).
Допиши блок «Уход» по-русски, если в данных есть факты, но нет нормальной формулировки; не вставляй отказ и не проси переформулировать запрос.
Не выдумывай новые свойства товара. Можно только аккуратно переформулировать и чуть расширить по существу на основе исходных фактов.

Формат (строго):
— Убери из описания любую стоимость: цена, рубли, ₽, расчеты упаковки, «за штуку», «опт/розница», скидки.
— Убери служебные фразы: «Товар добавлен», «Источник», «поставщик продает», рекламные хвосты про ассортимент.
— Запрещен Markdown в результате: не используй **, __, #, *, -, обратные кавычки и т.п.
— Если нужно выделение, используй только HTML-тег <strong>…</strong>.
— Итог: 3–6 коротких предложений, по существу товара, без воды и без выдумки.

Ответь только готовым текстом описания, без вступлений вроде «Вот описание» или пояснений.`;

const SITE_AL_REPLY_FORBIDDEN_SCRIPTS = /[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/;

function siteAlDescriptionReplyViolatesRussianOnly(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (SITE_AL_REPLY_FORBIDDEN_SCRIPTS.test(t)) return true;
  if (/\bplease rephrase\b/i.test(t)) return true;
  if (/将需求|请您将|以便我能|冷水，请/.test(t)) return true;
  return false;
}

function normalizeAgentDescription(raw: string): string {
  let t = (raw || "").trim();
  if (!t) return t;

  t = t.replace(/\r\n?/g, "\n");
  t = t.replace(/https?:\/\/\S+/gi, "");
  t = t.replace(/vk\.com\/\S+/gi, "");
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/[`*_#]/g, "");
  t = t.replace(/^\s*[-+>]+\s*/gm, "");

  const dropLine = (line: string) =>
    /(товар добавлен|источник|страница поставщика|поставщик товара|весь ассортимент|купить можно|по самым низким ценам)/i.test(
      line
    ) || /(цена|стоимост|₽|руб(\.|лей)?|упаковк|опт|розниц|=\s*\d+)/i.test(line);

  t = t
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !dropLine(line))
    .join("\n");

  t = t.replace(/<(?!\/?strong\b)[^>]*>/gi, "");
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

async function fetchAllCatalogCategories(): Promise<CatalogCategoryItem[]> {
  const first = await adminCatalogApi.catalogCategoriesList({ per_page: 100, page: 1 });
  const total = first.meta?.total ?? first.data.length;
  const perPage = first.meta?.per_page ?? 100;
  if (total <= perPage) return first.data;
  const pages = Math.ceil(total / perPage);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => adminCatalogApi.catalogCategoriesList({ per_page: perPage, page: i + 2 }))
  );
  return [...first.data, ...rest.flatMap((r) => r.data)];
}

function fmtTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm}m ${r}s`;
  return `${h}h ${mm}m`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown = null;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      // fast stop for auth
      if (e instanceof ApiError && e.status === 401) throw e;
      const backoff = 400 * i + Math.round(Math.random() * 200);
      await sleep(backoff);
    }
  }
  throw last instanceof Error ? last : new Error("Не удалось выполнить запрос");
}

type RunState = "idle" | "running" | "paused" | "stopped" | "completed" | "error";

type LogRow = { at: string; level: "info" | "warn" | "error"; message: string };

export default function CrmDashboardPage() {
  const [categories, setCategories] = useState<CatalogCategoryItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [onlyEmptyDescription, setOnlyEmptyDescription] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [prompt, setPrompt] = useState(DEFAULT_DESCRIPTION_AGENT_PROMPT);

  const [state, setState] = useState<RunState>("idle");
  const [processed, setProcessed] = useState(0);
  const [success, setSuccess] = useState(0);
  const [failed, setFailed] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<{ id: number; name: string } | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);

  const elapsedMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
  const avgMs = processed > 0 ? elapsedMs / processed : 0;
  const etaMs = total !== null && processed > 0 ? Math.max(0, (total - processed) * avgMs) : 0;
  const progressPct = total ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  const pushLog = (level: LogRow["level"], message: string) => {
    setLogs((prev) => [{ at: new Date().toLocaleTimeString("ru-RU"), level, message }, ...prev].slice(0, 200));
  };

  useEffect(() => {
    let mounted = true;
    fetchAllCatalogCategories()
      .then((rows) => {
        if (!mounted) return;
        setCategories(rows);
      })
      .catch(() => setCategories([]));
    return () => {
      mounted = false;
    };
  }, []);

  const categoriesByParent = useMemo(() => {
    const m = new Map<number | null, CatalogCategoryItem[]>();
    for (const c of categories) {
      const pid = c.parent_id ?? null;
      if (!m.has(pid)) m.set(pid, []);
      m.get(pid)!.push(c);
    }
    for (const [k, arr] of m) {
      arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      m.set(k, arr);
    }
    return m;
  }, [categories]);

  const toggleCategory = (id: number, on: boolean) => {
    setSelectedCategoryIds((prev) => {
      if (on) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const renderCatTree = (pid: number | null, depth = 0): JSX.Element[] => {
    const arr = categoriesByParent.get(pid) ?? [];
    return arr.flatMap((c) => {
      const checked = selectedCategoryIds.includes(c.id);
      const row = (
        <label key={c.id} className="flex items-center gap-2 text-xs py-1">
          <input type="checkbox" checked={checked} onChange={(e) => toggleCategory(c.id, e.target.checked)} />
          <span className="truncate" style={{ paddingLeft: depth ? depth * 10 : 0 }}>
            {c.name}
          </span>
        </label>
      );
      return [row, ...renderCatTree(c.id, depth + 1)];
    });
  };

  const resetRun = () => {
    setState("idle");
    setProcessed(0);
    setSuccess(0);
    setFailed(0);
    setSkipped(0);
    setTotal(null);
    setCurrentItem(null);
    setLogs([]);
    startedAtRef.current = null;
    stopRef.current = false;
    pauseRef.current = false;
  };

  const pause = () => {
    if (state !== "running") return;
    pauseRef.current = true;
    setState("paused");
    pushLog("info", "Пауза");
  };

  const resume = () => {
    if (state !== "paused") return;
    pauseRef.current = false;
    setState("running");
    pushLog("info", "Продолжение");
  };

  const stop = () => {
    stopRef.current = true;
    pauseRef.current = false;
    setState("stopped");
    pushLog("warn", "Остановлено пользователем");
  };

  const start = async () => {
    if (state === "running") return;
    if (!selectedCategoryIds.length) {
      toast.error("Выберите хотя бы одну категорию");
      return;
    }
    stopRef.current = false;
    pauseRef.current = false;
    startedAtRef.current = Date.now();
    setProcessed(0);
    setSuccess(0);
    setFailed(0);
    setSkipped(0);
    setLogs([]);
    setCurrentItem(null);
    setState("running");
    pushLog("info", `Старт. Категорий: ${selectedCategoryIds.length}`);

    try {
      // Pre-calc total to show ETA
      let totalApprox = 0;
      for (const cid of selectedCategoryIds) {
        const res = await adminSystemProductsApi.list({ category_id: cid, page: 1, per_page: 1 });
        totalApprox += Number(res.meta?.total ?? 0);
      }
      setTotal(totalApprox);

      for (const cid of selectedCategoryIds) {
        if (stopRef.current) break;
        let page = 1;
        let lastPage = 1;
        do {
          if (stopRef.current) break;
          while (pauseRef.current) {
            await sleep(250);
            if (stopRef.current) break;
          }

          const list = await adminSystemProductsApi.list({ category_id: cid, page, per_page: perPage });
          lastPage = Number(list.meta?.last_page ?? 1);
          const items = Array.isArray(list.data) ? (list.data as SystemProductItem[]) : [];

          for (const row of items) {
            if (stopRef.current) break;
            while (pauseRef.current) {
              await sleep(250);
              if (stopRef.current) break;
            }

            const name = String(row.name || "").trim() || `ID ${row.id}`;
            setCurrentItem({ id: row.id, name });

            try {
              const full = await retry(() => adminSystemProductsApi.get(row.id), 3);
              const currentDesc = String(full.description ?? "").trim();

              // Skip logic:
              // - if overwriteExisting=true -> always process (even if description exists)
              // - else if onlyEmptyDescription=true -> process only when description is empty
              // - else -> process all items (even if description exists)
              const shouldSkip =
                !overwriteExisting && onlyEmptyDescription && !!currentDesc;
              if (shouldSkip) {
                setSkipped((x) => x + 1);
                pushLog("info", `SKIP #${row.id}: описание уже заполнено`);
                continue;
              }

              const message = `${prompt.trim()}\n\n---\n\nТекущее описание товара для правки:\n\n${currentDesc || "(пусто)"}\n\n---\nФинальное требование: выведи только русское описание для покупателя; без иероглифов и без просьб сменить язык.`;

              // Retry *generation quality* up to 3 times (not only network errors).
              let normalized = "";
              let lastGenErr: Error | null = null;
              for (let attempt = 1; attempt <= 3; attempt++) {
                const attemptMsg =
                  attempt === 1
                    ? message
                    : `${message}\n\n---\n\nПовторная попытка №${attempt}:\n— Ответ строго на русском.\n— Если предыдущая попытка дала не-русский текст или пустоту, переформулируй заново по фактам.\n— Не вставляй цену, ссылки, мусор, и не используй Markdown.\n`;
                try {
                  const chatRes = await retry(() => adminSiteAlApi.chat({ message: attemptMsg }), 3);
                  const reply = typeof chatRes.reply === "string" ? chatRes.reply.trim() : "";
                  if (!reply) throw new Error("Агент не вернул текст");
                  if (siteAlDescriptionReplyViolatesRussianOnly(reply)) {
                    throw new Error("Агент вернул недопустимый (не русский) текст");
                  }
                  const n = normalizeAgentDescription(reply);
                  if (!n) throw new Error("Нормализованный текст пустой");
                  normalized = n;
                  lastGenErr = null;
                  break;
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : "Ошибка генерации";
                  lastGenErr = new Error(msg);
                  pushLog("warn", `RETRY #${row.id}: попытка ${attempt}/3 неудачна — ${msg}`);
                  await sleep(250 + attempt * 250);
                }
              }
              if (!normalized) {
                throw lastGenErr ?? new Error("Не удалось сгенерировать описание");
              }

              await retry(() => adminSystemProductsApi.update(row.id, { description: normalized }), 3);
              await retry(() => adminSystemProductsApi.moderate(row.id, { status: "approved" }), 3);
              setSuccess((x) => x + 1);
              pushLog("info", `OK #${row.id}: описание обновлено и статус = approved`);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Ошибка";
              setFailed((x) => x + 1);
              pushLog("error", `FAIL #${row.id}: ${msg}`);
              if (e instanceof ApiError && e.status === 401) {
                pushLog("error", "Авторизация истекла (401). Прогон остановлен.");
                setState("error");
                return;
              }
            } finally {
              setProcessed((x) => x + 1);
            }
          }

          page += 1;
        } while (page <= lastPage);
      }

      setCurrentItem(null);
      if (stopRef.current) return;
      setState("completed");
      pushLog("info", "Готово");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      setState("error");
      pushLog("error", msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="CRM"
        description="Массовые операции и контроль"
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={resetRun} disabled={state === "running"}>
              <RotateCcw className="h-3.5 w-3.5" /> Сброс
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-medium">Генерация описаний (обход всех объявлений)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Выберите категории, запустите прогон. Статистика обновляется онлайн; ошибки ретраятся до 3 раз.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {state !== "running" && state !== "paused" ? (
              <Button type="button" onClick={() => void start()} className="gap-2">
                <Play className="h-4 w-4" /> Запуск
              </Button>
            ) : null}
            {state === "running" ? (
              <Button type="button" variant="outline" onClick={pause} className="gap-2">
                <Pause className="h-4 w-4" /> Пауза
              </Button>
            ) : null}
            {state === "paused" ? (
              <Button type="button" variant="outline" onClick={resume} className="gap-2">
                <Play className="h-4 w-4" /> Продолжить
              </Button>
            ) : null}
            {state === "running" || state === "paused" ? (
              <Button type="button" variant="destructive" onClick={stop} className="gap-2">
                <Square className="h-4 w-4" /> Стоп
              </Button>
            ) : null}
          </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-2">
            <Label className="text-xs text-muted-foreground">Категории</Label>
            <div className="rounded-md border border-border p-2 max-h-64 overflow-auto">
              {categories.length ? (
                renderCatTree(null, 0)
              ) : (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Загрузка категорий…
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Только пустые описания</span>
                <Switch checked={onlyEmptyDescription} onCheckedChange={setOnlyEmptyDescription} />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Перезаписывать</span>
                <Switch checked={overwriteExisting} onCheckedChange={setOverwriteExisting} />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Размер страницы (скорость)</span>
              <Input
                type="number"
                min={10}
                max={100}
                value={perPage}
                onChange={(e) => setPerPage(Math.max(10, Math.min(100, Number(e.target.value) || 50)))}
                className="h-8 text-xs"
              />
            </label>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Статус</p>
                <p className="text-sm font-medium">{state}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Пройдено</p>
                <p className="text-sm font-medium tabular-nums">
                  {processed}{total !== null ? ` / ${total}` : ""}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Успешно</p>
                <p className="text-sm font-medium tabular-nums">{success}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Ошибки</p>
                <p className="text-sm font-medium tabular-nums text-destructive">{failed}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Пропущено</p>
                <p className="text-sm font-medium tabular-nums">{skipped}</p>
              </div>
        </div>

            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  Текущее: {currentItem ? `#${currentItem.id} — ${currentItem.name}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Время: {fmtTime(elapsedMs)} · Ср/элемент: {avgMs ? fmtTime(avgMs) : "—"} · ETA:{" "}
                  {total !== null ? fmtTime(etaMs) : "—"}
                </p>
              </div>
              <div className="h-2 rounded bg-muted overflow-hidden">
                <div className="h-2 bg-primary" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

            <div className="rounded-md border border-border p-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Промпт генерации</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[140px] text-xs"
              />
            </div>

            <div className="rounded-md border border-border p-3 space-y-2">
              <p className="text-xs font-medium">Лог</p>
              <div className="max-h-56 overflow-auto space-y-1">
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Пока пусто.</p>
                ) : (
                  logs.map((l, i) => (
                    <div key={`${l.at}-${i}`} className="text-xs flex gap-2">
                      <span className="text-muted-foreground tabular-nums w-[70px]">{l.at}</span>
                      <span className={l.level === "error" ? "text-destructive" : l.level === "warn" ? "text-amber-600" : ""}>
                        {l.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
}
