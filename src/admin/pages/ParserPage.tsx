import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Pause, Loader2, RotateCcw, Trash2, RefreshCw, RotateCw, Plus } from "lucide-react";
import { parserApi, categoriesApi, logsApi } from "@/lib/api";
import { summarizeParserActivity } from "@/admin/parserActivity";
import type { ParserJob, Category, ParserSettings } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

type LastRunCategoryReport = {
  slug: string;
  saved: number;
};

/** GET may return array or legacy JSON string from DB — always normalize to number[]. */
function parseDefaultCategoryIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n >= 1);
  }
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const p = JSON.parse(value) as unknown;
      if (Array.isArray(p)) {
        return p.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n >= 1);
      }
    } catch {
      return [];
    }
  }
  return [];
}

/** Load proxy list: prefer proxy_urls from API, else wrap legacy proxy_url */
function parseProxyUrlsFromApi(s: ParserSettings): string[] {
  const urls = s.proxy_urls;
  if (Array.isArray(urls) && urls.length > 0) {
    const out = urls.map((x) => String(x).trim()).filter((x) => x !== "");
    return out.length > 0 ? out : [""];
  }
  const one = (s.proxy_url ?? "").trim();
  return one ? [one] : [""];
}

export default function ParserPage() {
  /** Only single-run fields not stored in parser_settings (daemon uses DB defaults). */
  const [config, setConfig] = useState({
    saveToDB: true,
    category: "",
  });
  const [jobId, setJobId] = useState<number | null>(null);
  const [currentJob, setCurrentJob] = useState<ParserJob | null>(null);
  const [logs, setLogs] = useState<Array<{ level: string; message: string; logged_at: string }>>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ["parser-status"],
    queryFn: () => parserApi.status(),
    refetchInterval: 30000, // Fallback; WebSocket invalidates on events
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-list"],
    queryFn: () => categoriesApi.list({ tree: true }),
  });

  const { data: diagnostics } = useQuery({
    queryKey: ["parser-diagnostics"],
    queryFn: () => parserApi.diagnostics(),
    refetchInterval: 15000,
  });

  const { data: parserHealth } = useQuery({
    queryKey: ["parser-health"],
    queryFn: () => parserApi.health(),
    refetchInterval: 15000,
  });

  const { data: failedJobsData, refetch: refetchFailedJobs } = useQuery({
    queryKey: ["parser-failed-jobs"],
    queryFn: () => parserApi.failedJobs(),
    refetchInterval: 30000,
  });

  const { data: parserState, refetch: refetchState } = useQuery({
    queryKey: ["parser-state"],
    queryFn: () => parserApi.state(),
    refetchInterval: 15000,
  });

  const progressJobId = statusData?.current_job?.id ?? currentJob?.id;
  const { data: progressOverview } = useQuery({
    queryKey: ["parser-progress-overview", progressJobId ?? 0],
    queryFn: () => parserApi.progressOverview(progressJobId),
    refetchInterval: 5000,
  });

  const { data: parserSettings, refetch: refetchParserSettings } = useQuery({
    queryKey: ["parser-settings"],
    queryFn: () => parserApi.settings(),
  });

  const [settingsForm, setSettingsForm] = useState({
    download_photos: false,
    store_photo_links: true,
    max_workers: 3,
    request_delay_min: 1500,
    request_delay_max: 3000,
    timeout_seconds: 60,
    workers_parser: 2,
    workers_photos: 1,
    proxy_enabled: true,
    proxy_urls: ["http://89.169.39.244:3128"] as string[],
    queue_threshold: 150,
    default_linked_only: false,
    default_max_pages: 0,
    default_products_per_category: 0,
    default_category_ids: [] as number[],
    default_no_details: false,
  });

  /** Hydrate form once from GET /admin/parser/settings — no refetch-driven overwrites */
  const parserSettingsHydratedRef = useRef(false);
  useEffect(() => {
    if (!parserSettings || parserSettingsHydratedRef.current) return;
    setSettingsForm({
      download_photos: parserSettings.download_photos,
      store_photo_links: parserSettings.store_photo_links,
      max_workers: parserSettings.max_workers,
      request_delay_min: parserSettings.request_delay_min,
      request_delay_max: parserSettings.request_delay_max,
      timeout_seconds: parserSettings.timeout_seconds,
      workers_parser: parserSettings.workers_parser,
      workers_photos: parserSettings.workers_photos,
      proxy_enabled: parserSettings.proxy_enabled,
      proxy_urls: parseProxyUrlsFromApi(parserSettings),
      queue_threshold: parserSettings.queue_threshold,
      default_linked_only: parserSettings.default_linked_only ?? false,
      default_max_pages: parserSettings.default_max_pages ?? 0,
      default_products_per_category: parserSettings.default_products_per_category ?? 0,
      default_category_ids: parseDefaultCategoryIds(parserSettings.default_category_ids),
      default_no_details: parserSettings.default_no_details ?? false,
    });
    parserSettingsHydratedRef.current = true;
  }, [parserSettings]);

  const flattenCategories = (items: Category[]): Category[] => {
    const out: Category[] = [];
    const walk = (arr: Category[]) => {
      for (const c of arr) {
        out.push(c);
        if (c.children?.length) walk(c.children);
      }
    };
    walk(categoriesData?.data ?? []);
    return out;
  };
  const categories = flattenCategories(categoriesData?.data ?? []);
  const isRunning = statusData?.is_running ?? false;
  const daemonEnabled = statusData?.daemon_enabled ?? false;
  const activeJob = statusData?.current_job ?? currentJob;
  const [lastRunCategories, setLastRunCategories] = useState<LastRunCategoryReport[]>([]);

  const fetchLogs = useCallback((jid: number | null) => {
    if (!jid) return;
    logsApi.list({ job_id: jid, per_page: 50 }).then((res) => {
      setLogs((res.data ?? []).map((l) => ({ level: l.level, message: l.message, logged_at: l.logged_at })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeJob?.id) {
      setJobId(activeJob.id);
      fetchLogs(activeJob.id);
    }
  }, [activeJob?.id, fetchLogs]);

  useEffect(() => {
    const last = statusData?.last_completed;
    if (!last?.id) {
      setLastRunCategories([]);
      return;
    }

    parserApi.jobDetail(last.id)
      .then((job) => {
        const rows: LastRunCategoryReport[] = [];
        const re = /^Категория\s+([^:]+):\s+сохранено\s+(\d+)\s+товаров/i;
        for (const l of job.logs ?? []) {
          if (typeof l?.message !== "string") continue;
          const m = l.message.match(re);
          if (!m) continue;
          rows.push({
            slug: m[1].trim(),
            saved: Number(m[2]) || 0,
          });
        }
        // keep first occurrence per category (latest logs are already first)
        const seen = new Set<string>();
        const unique = rows.filter((r) => {
          if (seen.has(r.slug)) return false;
          seen.add(r.slug);
          return true;
        });
        setLastRunCategories(unique);
      })
      .catch(() => setLastRunCategories([]));
  }, [statusData?.last_completed?.id]);

  useEffect(() => {
    if (!isRunning || !jobId) return;
    const es = new EventSource(parserApi.progressUrl(jobId));
    eventSourceRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === "stream_ended") {
          es.close();
          refetchStatus();
          return;
        }
        if (data.id) setCurrentJob(data);
        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
          es.close();
          refetchStatus();
        }
      } catch { /* ignore */ }
    };
    es.onerror = () => {
      es.close();
      refetchStatus();
    };
    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isRunning, jobId, refetchStatus]);

  const handleStart = async () => {
    try {
      const opts: Parameters<typeof parserApi.start>[0] = {
        type: config.category ? "category" : "full",
        save_photos: settingsForm.download_photos,
        save_to_db: config.saveToDB,
        no_details: settingsForm.default_no_details,
        linked_only: settingsForm.default_linked_only,
        // Явно передаём 0: иначе `|| undefined` отбрасывал max_pages=0 и бралось устаревшее из БД при старте без сохранения.
        products_per_category: settingsForm.default_products_per_category,
        max_pages: settingsForm.default_max_pages,
      };
      if (config.category) opts.category_slug = config.category;
      if (opts.type === "full" && settingsForm.default_category_ids.length > 0) {
        opts.categories = settingsForm.default_category_ids;
      }
      const res = await parserApi.start(opts);
      setJobId(res.job_id);
      setCurrentJob(res.job);
      refetchStatus();
      toast.success("Парсинг запущен");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  const handleStop = async () => {
    try {
      await parserApi.stop();
      refetchStatus();
      toast.success("Парсинг остановлен");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  const handleStartDaemon = async () => {
    try {
      await parserApi.startDaemon();
      refetchStatus();
      refetchState();
      toast.success("Парсер запущен");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  const handleStopDaemon = async () => {
    try {
      await parserApi.stopDaemon();
      refetchStatus();
      refetchState();
      toast.success("Парсер остановлен");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  const handlePause = async () => {
    try {
      await parserApi.pause();
      refetchStatus();
      refetchState();
      toast.success("Парсер приостановлен");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  const [sysAction, setSysAction] = useState<string | null>(null);
  const handleQueueFlush = async () => {
    setSysAction("flush");
    try {
      await parserApi.queueFlush();
      refetchStatus();
      toast.success("Очереди сброшены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleLogsClear = async () => {
    setSysAction("logs");
    try {
      await logsApi.clear();
      toast.success("Логи и ошибки очищены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleQueueRestart = async () => {
    setSysAction("restart");
    try {
      await parserApi.queueRestart();
      refetchStatus();
      toast.success("Воркеры очередей перезапущены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleReleaseLock = async () => {
    setSysAction("lock");
    try {
      await parserApi.releaseLock();
      refetchStatus();
      toast.success("Блокировка снята");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleClearFailedJobs = async () => {
    setSysAction("clearFailed");
    try {
      await parserApi.clearFailedJobs();
      refetchFailedJobs();
      refetchStatus();
      toast.success("Неудачные задания очищены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleHardStopAndCleanup = async () => {
    const ok = window.confirm(
      "Выполнить ЖЕСТКИЙ СТОП?\n\nЭто остановит текущий парсинг, очистит очереди parser/photos/default, перезапустит воркеры и очистит failed jobs."
    );
    if (!ok) return;

    setSysAction("hardReset");
    try {
      await parserApi.reset();
      await parserApi.clearFailedJobs();
      refetchStatus();
      refetchState();
      refetchFailedJobs();
      toast.success("Жесткий стоп выполнен: очереди и failed jobs очищены, воркеры перезапущены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSysAction(null);
    }
  };
  const handleRetryJob = async (id: number) => {
    try {
      await parserApi.retryJob(id);
      refetchFailedJobs();
      refetchStatus();
      toast.success("Задание возвращено в очередь");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  const [savingSettings, setSavingSettings] = useState(false);

  const addProxyRow = () => {
    setSettingsForm((prev) => ({ ...prev, proxy_urls: [...prev.proxy_urls, ""] }));
  };

  const removeProxyRow = (index: number) => {
    setSettingsForm((prev) => {
      const next = prev.proxy_urls.filter((_, i) => i !== index);
      return { ...prev, proxy_urls: next.length > 0 ? next : [""] };
    });
  };

  const updateProxyRow = (index: number, value: string) => {
    setSettingsForm((prev) => {
      const next = [...prev.proxy_urls];
      next[index] = value;
      return { ...prev, proxy_urls: next };
    });
  };

  const handleSaveParserSettings = async () => {
    setSavingSettings(true);
    try {
      const { proxy_urls, ...restForm } = settingsForm;
      const cleanedProxyUrls = proxy_urls.map((u) => u.trim()).filter((u) => u !== "");
      const savePayload = {
        ...restForm,
        proxy_urls: cleanedProxyUrls,
        proxy_url: cleanedProxyUrls.length > 0 ? cleanedProxyUrls[0] : "",
        max_pages: settingsForm.default_max_pages,
        categories: settingsForm.default_category_ids,
        linked_only: settingsForm.default_linked_only,
        products_per_category: settingsForm.default_products_per_category,
        download_photos: settingsForm.download_photos,
        no_details: settingsForm.default_no_details,
      };
      console.log("SAVE SETTINGS PAYLOAD", savePayload);
      const res = await parserApi.updateSettings(savePayload);
      if (res?.data) {
        const d = res.data;
        setSettingsForm({
          download_photos: d.download_photos,
          store_photo_links: d.store_photo_links,
          max_workers: d.max_workers,
          request_delay_min: d.request_delay_min,
          request_delay_max: d.request_delay_max,
          timeout_seconds: d.timeout_seconds,
          workers_parser: d.workers_parser,
          workers_photos: d.workers_photos,
          proxy_enabled: d.proxy_enabled,
          proxy_urls: parseProxyUrlsFromApi(d),
          queue_threshold: d.queue_threshold,
          default_linked_only: d.default_linked_only ?? false,
          default_max_pages: d.default_max_pages ?? 0,
          default_products_per_category: d.default_products_per_category ?? 0,
          default_category_ids: parseDefaultCategoryIds(d.default_category_ids),
          default_no_details: d.default_no_details ?? false,
        });
      } else {
        parserSettingsHydratedRef.current = false;
        await refetchParserSettings();
      }
      toast.success("Настройки парсера сохранены");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    } finally {
      setSavingSettings(false);
    }
  };

  const progress = activeJob?.progress?.percent ?? 0;
  const totalProducts = activeJob?.progress?.products?.total ?? 0;
  const processedCount = activeJob?.progress?.products?.done ?? activeJob?.progress?.saved ?? 0;
  const lastFailed = statusData?.last_completed?.status === "failed";
  const parserActivity = summarizeParserActivity({
    parserState: parserState?.status,
    daemonEnabled,
    jobInDbActive: isRunning,
    queueParser: diagnostics?.parser_queue_size,
    queuePhotos: diagnostics?.photos_queue_size,
    queueWorkersStalled: diagnostics?.queue_workers_stalled,
    photoQueueWorkersStalled: diagnostics?.photo_queue_workers_stalled,
    lastJobFailed: lastFailed,
  });

  const parserStateStatusRu = (s: string | undefined) => {
    const m: Record<string, string> = {
      running: "работает",
      stopped: "остановлен",
      paused: "пауза",
      paused_network: "пауза (сеть)",
    };
    return s ? (m[s] ?? s) : "—";
  };

  const proxyBlocked =
    Boolean(diagnostics?.proxy_blocked) ||
    Boolean(parserHealth?.proxy_blocked) ||
    Boolean(parserState?.proxy_blocked) ||
    Boolean(statusData?.proxy_blocked);
  const proxyBlockedUntil =
    diagnostics?.proxy_blocked_until ??
    parserHealth?.proxy_blocked_until ??
    parserState?.proxy_blocked_until ??
    statusData?.proxy_blocked_until ??
    null;
  const proxyBlockReason =
    diagnostics?.proxy_block_reason ??
    parserHealth?.proxy_block_reason ??
    parserState?.proxy_block_reason ??
    statusData?.proxy_block_reason ??
    null;
  const proxyAction =
    diagnostics?.proxy_last_action ??
    parserHealth?.proxy_last_action ??
    parserState?.proxy_last_action ??
    statusData?.proxy_last_action ??
    null;

  const workerStatusRu = (v: string | undefined) => {
    if (v === "running") return "работают";
    if (v === "stopped") return "остановлены";
    return v ?? "—";
  };

  const statusBadge =
    parserState?.status === "paused_network" ? (
      <Badge variant="destructive">Сеть недоступна</Badge>
    ) : parserState?.status === "paused" ? (
      <Badge variant="secondary">На паузе</Badge>
    ) : parserActivity.tone === "active" ? (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse mr-1.5" />
        Парсер работает
      </Badge>
    ) : parserActivity.tone === "queue" ? (
      <Badge className="bg-amber-600 hover:bg-amber-600" title={parserActivity.detail}>
        Очередь Redis
      </Badge>
    ) : parserActivity.tone === "idle" ? (
      <Badge className="bg-sky-700 hover:bg-sky-700 text-white" title={parserActivity.detail}>
        Демон: ожидание
      </Badge>
    ) : parserActivity.tone === "error" ? (
      <Badge variant="destructive" title={parserActivity.detail}>
        Парсер: {parserActivity.shortLabel}
      </Badge>
    ) : (
      <Badge variant="secondary" title={parserActivity.detail}>
        Остановлен
      </Badge>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Управление парсером</h2>
        {statusBadge}
      </div>

      {proxyBlocked && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Прокси временно заблокирован донором</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="text-muted-foreground">
              Система остановила лишние запросы через прокси, чтобы не усугублять блокировку.
            </p>
            <p>
              До: <span className="font-medium">{proxyBlockedUntil ? new Date(proxyBlockedUntil).toLocaleString("ru") : "неизвестно"}</span>
            </p>
            <p className="text-muted-foreground">
              Причина: {proxyBlockReason ?? "не указана"}{proxyAction ? `, действие: ${proxyAction}` : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {diagnostics &&
        (diagnostics.queue_workers_stalled ||
          diagnostics.photo_queue_workers_stalled ||
          (diagnostics.warning && diagnostics.warning.trim() !== "")) && (
        <Card className="border-amber-600/45 bg-amber-950/25">
          <CardHeader>
            <CardTitle className="text-base text-amber-200">Диагностика: очередь и воркеры</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-amber-50/95">
            {diagnostics.warning && <p className="leading-relaxed">{diagnostics.warning}</p>}
            <p className="text-xs text-amber-200/80">
              Воркеры: parser — {diagnostics.workers_running ?? 0}, photos — {diagnostics.photo_workers_running ?? 0}
              {diagnostics.workers_detection ? (
                <>
                  {" "}
                  (supervisor/ps: {diagnostics.workers_detection.supervisor_parser}/
                  {diagnostics.workers_detection.ps_parser} · {diagnostics.workers_detection.supervisor_photo}/
                  {diagnostics.workers_detection.ps_photo})
                </>
              ) : null}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Parser Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Панель управления</CardTitle>
          {parserState && (
            <p className="text-sm text-muted-foreground">
              Состояние: {parserStateStatusRu(parserState.status)} | Последний старт:{" "}
              {parserState.last_start ? new Date(parserState.last_start).toLocaleString("ru") : "—"} | Последняя остановка:{" "}
              {parserState.last_stop ? new Date(parserState.last_stop).toLocaleString("ru") : "—"}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStartDaemon} disabled={daemonEnabled || isRunning} title="Непрерывный режим (демон)">
              <Play className="h-4 w-4 mr-1" />
              Запустить парсер
            </Button>
            <Button variant="destructive" disabled={!daemonEnabled && !isRunning} onClick={handleStop} title="Остановить парсинг">
              <Square className="h-4 w-4 mr-1" />
              Остановить
            </Button>
            <Button variant="outline" onClick={handlePause} disabled={!daemonEnabled && !isRunning} title="Приостановить демон">
              <Pause className="h-4 w-4 mr-1" />
              Пауза
            </Button>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Один прогон (без демона):</p>
            <Button variant="outline" size="sm" onClick={handleStart} disabled={isRunning}><Play className="h-4 w-4 mr-1" />Один прогон</Button>
          </div>
          {isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Прогресс: {processedCount}/{totalProducts || "—"}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              {activeJob?.progress?.current_action && (
                <p className="text-xs text-muted-foreground">{activeJob.progress.current_action}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parser Diagnostics */}
      {diagnostics && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Диагностика парсера</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Очередь парсера</p>
                <p className="font-medium">{diagnostics.parser_queue_size ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Очередь фото</p>
                <p className="font-medium">{diagnostics.photos_queue_size ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Неудачные задания</p>
                <p className={`font-medium ${(diagnostics.failed_jobs_count ?? 0) > 0 ? "text-destructive" : ""}`}>
                  {diagnostics.failed_jobs_count ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Блокировка</p>
                <Badge variant={diagnostics.parser_lock_status === "held" ? "destructive" : "secondary"}>
                  {diagnostics.parser_lock_status === "held" ? "Удерживается" : "Свободна"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Прокси</p>
                <Badge variant={proxyBlocked ? "destructive" : diagnostics.proxy_status === "ok" ? "secondary" : "destructive"}>
                  {proxyBlocked ? "Блок" : diagnostics.proxy_status === "ok" ? "ОК" : "Ошибка"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Донор (sadovodbaza)</p>
                <Badge variant={diagnostics.sadovodbaza_status === "ok" ? "secondary" : "destructive"}>
                  {diagnostics.sadovodbaza_status === "ok" ? "ОК" : "Ошибка"}
                </Badge>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded border p-3">
                <p className="text-muted-foreground">Воркеры очереди (parser / photos)</p>
                <p className="font-medium">
                  parser: {diagnostics.workers_running ?? 0} —{" "}
                  {workerStatusRu(
                    diagnostics.worker_status ?? (diagnostics.workers_running > 0 ? "running" : "stopped"),
                  )}
                </p>
                <p className="text-muted-foreground mt-1">
                  photos: {diagnostics.photo_workers_running ?? 0}
                </p>
                <p className="text-muted-foreground mt-1">
                  Прокси:{" "}
                  {proxyBlocked
                    ? "Заблокирован донором (кулдаун)"
                    : (parserHealth?.proxy_status ?? diagnostics.proxy_status ?? "failed") === "ok"
                      ? "ОК"
                      : "Ошибка"}
                </p>
                <p className="text-muted-foreground mt-1">
                  Донор:{" "}
                  {(parserHealth?.sadovodbaza_status ?? diagnostics.sadovodbaza_status ?? "failed") === "ok" ? "ОК" : "Ошибка"}
                </p>
                <p className="text-muted-foreground mt-1">Память: {String(diagnostics.memory_usage ?? "—")}</p>
                <p className="text-muted-foreground mt-1">Ошибок за час: {diagnostics.error_frequency?.last_hour ?? 0}</p>
                {proxyBlocked && (
                  <p className="text-destructive mt-1">
                    Кулдаун до {proxyBlockedUntil ? new Date(proxyBlockedUntil).toLocaleTimeString("ru") : "—"}, streak: {diagnostics.proxy_block_streak ?? 0}
                  </p>
                )}
              </div>
              <div className="rounded border p-3">
                <p className="text-muted-foreground">Обзор прогресса</p>
                <p className="font-medium">
                  {(progressOverview?.processed_items ?? diagnostics.progress?.processed_items ?? 0)}/
                  {(progressOverview?.total_items ?? diagnostics.progress?.total_items ?? 0)}
                </p>
                <p className="text-muted-foreground mt-1">
                  Ошибок: {progressOverview?.failed_items ?? diagnostics.progress?.failed_items ?? 0}
                </p>
                <p className="text-muted-foreground mt-1">
                  Скорость: {progressOverview?.speed_per_min ?? diagnostics.progress?.speed_per_min ?? 0} шт/мин
                </p>
                <p className="text-muted-foreground mt-1 truncate" title={progressOverview?.current_url ?? diagnostics.progress?.current_url ?? ""}>
                  URL: {progressOverview?.current_url ?? diagnostics.progress?.current_url ?? "—"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Последние ошибки</p>
              <div className="space-y-1 max-h-28 overflow-auto rounded border p-2">
                {(diagnostics.last_errors ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Нет ошибок</p>
                )}
                {(diagnostics.last_errors ?? []).map((e) => (
                  <p key={e.id} className="text-xs text-muted-foreground truncate" title={e.message}>
                    [{new Date(e.logged_at).toLocaleTimeString("ru")}] {e.message}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!!statusData?.last_completed && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Отчет последнего прогона</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Статус</p>
                <p className="font-medium">{statusData.last_completed.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Категории</p>
                <p className="font-medium">
                  {statusData.last_completed.progress?.categories?.done ?? 0}/{statusData.last_completed.progress?.categories?.total ?? 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Сохранено товаров</p>
                <p className="font-medium">{statusData.last_completed.progress?.saved ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Фото (скачано/ошибки)</p>
                <p className="font-medium">
                  {statusData.last_completed.progress?.photos?.downloaded ?? 0}/{statusData.last_completed.progress?.photos?.failed ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">По категориям</p>
              <div className="space-y-1 max-h-36 overflow-auto rounded border p-2">
                {lastRunCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">Детализация по категориям появится после завершения прогона.</p>
                )}
                {lastRunCategories.map((r) => (
                  <p key={r.slug} className="text-xs text-muted-foreground">
                    {r.slug}: сохранено {r.saved}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Tools */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Системные инструменты</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="destructive" onClick={handleHardStopAndCleanup} disabled={!!sysAction} title="Остановить парсер, очистить очереди/failed и перезапустить воркеры">
              <Square className="h-4 w-4 mr-1" />
              Жесткий стоп + очистка
            </Button>
            <Button variant="outline" onClick={handleQueueFlush} disabled={!!sysAction || isRunning} title="Сбросить очереди">
              <RotateCcw className="h-4 w-4 mr-1" />
              Сбросить очередь
            </Button>
            <Button variant="outline" onClick={handleClearFailedJobs} disabled={!!sysAction} title="Очистить неудачные задания">
              <Trash2 className="h-4 w-4 mr-1" />
              Очистить неудачные
            </Button>
            <Button variant="outline" onClick={handleQueueRestart} disabled={!!sysAction} title="Перезапустить воркеры очередей">
              <RefreshCw className="h-4 w-4 mr-1" />
              Перезапустить воркеры
            </Button>
            <Button variant="outline" onClick={handleReleaseLock} disabled={!!sysAction || isRunning} title="Снять блокировку парсера">
              Освободить блокировку
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogsClear} disabled={!!sysAction}>
              Очистка логов
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parser Settings */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Настройки парсера</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Настройки применяются только к новым запускам парсера.</p>
          <p className="text-xs text-muted-foreground">
            Фильтры ниже (категории, лимиты, только связанные категории, предпросмотр) сохраняются здесь и подхватываются демоном при следующих прогонах после сохранения.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Скачивать фото</Label>
              <Switch
                checked={settingsForm.download_photos}
                onCheckedChange={(v) => setSettingsForm({ ...settingsForm, download_photos: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Сохранять ссылки на фото</Label>
              <Switch
                checked={settingsForm.store_photo_links}
                onCheckedChange={(v) => setSettingsForm({ ...settingsForm, store_photo_links: v })}
              />
            </div>
            <div>
              <Label>Макс. воркеров</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={settingsForm.max_workers}
                onChange={(e) => setSettingsForm({ ...settingsForm, max_workers: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <div>
              <Label>Таймаут (сек)</Label>
              <Input
                type="number"
                min={5}
                max={300}
                value={settingsForm.timeout_seconds}
                onChange={(e) => setSettingsForm({ ...settingsForm, timeout_seconds: Math.max(5, Number(e.target.value) || 60) })}
              />
            </div>
            <div>
              <Label>Воркеры парсинга</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={settingsForm.workers_parser}
                onChange={(e) => setSettingsForm({ ...settingsForm, workers_parser: Math.max(1, Number(e.target.value) || 2) })}
              />
            </div>
            <div>
              <Label>Воркеры фото</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={settingsForm.workers_photos}
                onChange={(e) => setSettingsForm({ ...settingsForm, workers_photos: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <div>
              <Label>Мин. задержка (мс)</Label>
              <Input
                type="number"
                min={100}
                max={10000}
                value={settingsForm.request_delay_min}
                onChange={(e) => setSettingsForm({ ...settingsForm, request_delay_min: Math.max(100, Number(e.target.value) || 1500) })}
              />
            </div>
            <div>
              <Label>Макс. задержка (мс)</Label>
              <Input
                type="number"
                min={100}
                max={15000}
                value={settingsForm.request_delay_max}
                onChange={(e) => setSettingsForm({ ...settingsForm, request_delay_max: Math.max(100, Number(e.target.value) || 3000) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Использовать прокси</Label>
              <Switch
                checked={settingsForm.proxy_enabled}
                onCheckedChange={(v) => setSettingsForm({ ...settingsForm, proxy_enabled: v })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Прокси (URL)</Label>
              <p className="text-xs text-muted-foreground">
                Несколько адресов для ротации на бэкенде; пустые строки при сохранении отбрасываются.
              </p>
              {settingsForm.proxy_urls.map((url, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    className="flex-1"
                    value={url}
                    onChange={(e) => updateProxyRow(index, e.target.value)}
                    placeholder="http://host:port"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Удалить"
                    onClick={() => removeProxyRow(index)}
                    disabled={settingsForm.proxy_urls.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addProxyRow}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить прокси
              </Button>
            </div>
            <div>
              <Label>Порог очереди</Label>
              <Input
                type="number"
                min={10}
                max={1000000}
                value={settingsForm.queue_threshold}
                onChange={(e) => setSettingsForm({ ...settingsForm, queue_threshold: Math.max(10, Number(e.target.value) || 150) })}
              />
            </div>
            <div className="flex items-center justify-between md:col-span-2">
              <Label>Только связанные категории (демон и один прогон)</Label>
              <Switch
                checked={settingsForm.default_linked_only}
                onCheckedChange={(v) => setSettingsForm({ ...settingsForm, default_linked_only: v })}
              />
            </div>
            <div className="flex items-center justify-between md:col-span-2">
              <Label>Только предпросмотр (без деталей товара)</Label>
              <Switch
                checked={settingsForm.default_no_details}
                onCheckedChange={(v) => setSettingsForm({ ...settingsForm, default_no_details: v })}
              />
            </div>
            <div>
              <Label>Макс. страниц на категорию (0 = по полю категории)</Label>
              <Input
                type="number"
                min={0}
                value={settingsForm.default_max_pages || ""}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, default_max_pages: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div>
              <Label>Лимит товаров на категорию (0 = по полю категории)</Label>
              <Input
                type="number"
                min={0}
                value={settingsForm.default_products_per_category || ""}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    default_products_per_category: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>Категории для полного режима (пусто = все включённые)</Label>
              <p className="text-xs text-muted-foreground mb-2">Сохраняется в БД; демон использует тот же список.</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto rounded border p-2">
                {categories.map((c) => {
                  const checked = settingsForm.default_category_ids.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? settingsForm.default_category_ids.filter((id) => id !== c.id)
                            : [...settingsForm.default_category_ids, c.id];
                          setSettingsForm({ ...settingsForm, default_category_ids: next });
                        }}
                      />
                      <span className="truncate max-w-[140px]">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={savingSettings}
            onClick={() => void handleSaveParserSettings()}
          >
            {savingSettings ? "Сохранение…" : "Сохранить настройки"}
          </Button>
        </CardContent>
      </Card>

      {/* Parser Errors (Failed Jobs) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ошибки парсера</CardTitle>
          <p className="text-sm text-muted-foreground">Последние 20 неудачных заданий</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Время</th>
                  <th className="p-2 text-left">Очередь</th>
                  <th className="p-2 text-left">Задание</th>
                  <th className="p-2 text-left">Ошибка</th>
                  <th className="p-2 text-right">Повтор</th>
                </tr>
              </thead>
              <tbody>
                {(failedJobsData?.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Нет неудачных заданий
                    </td>
                  </tr>
                )}
                {(failedJobsData?.data ?? []).map((job) => (
                  <tr key={job.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 whitespace-nowrap">{job.failed_at ? new Date(job.failed_at).toLocaleString("ru") : "—"}</td>
                    <td className="p-2">{job.queue ?? "—"}</td>
                    <td className="p-2 truncate max-w-[150px]" title={job.display_name}>{job.display_name ?? "—"}</td>
                    <td className="p-2 text-destructive text-xs max-w-[250px] truncate" title={job.exception ?? ""}>{job.exception ?? "—"}</td>
                    <td className="p-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRetryJob(job.id)}>
                        <RotateCw className="h-4 w-4 mr-1" />
                        Повторить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Single-run only: category slug mode + save_to_db (not used by daemon) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Один прогон — дополнительно</CardTitle>
            <p className="text-sm text-muted-foreground">
              Не дублирует настройки выше: фото и фильтры берутся из блока «Настройки парсера» после нажатия «Сохранить настройки».
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Сохранять в БД (только API один прогон)</Label>
              <Switch checked={config.saveToDB} onCheckedChange={(v) => setConfig({ ...config, saveToDB: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Режим «одна категория»</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Код категории (slug): пусто — полный режим с фильтрами из настроек парсера</Label>
              <Select value={config.category || "all"} onValueChange={(v) => setConfig({ ...config, category: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Все категории" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все (полный режим)</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Логи выполнения</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1 max-h-48 overflow-auto">
            {logs.length === 0 && !isRunning && <div className="text-muted-foreground">Логи появятся при запуске парсинга</div>}
            {logs.map((l, i) => (
              <div key={i} className="text-muted-foreground">
                [{l.logged_at}] [{l.level}] {l.message}
              </div>
            ))}
            {isRunning && <div className="text-primary flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Обработка...</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
