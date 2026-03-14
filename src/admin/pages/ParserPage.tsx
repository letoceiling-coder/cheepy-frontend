import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Pause, Loader2, RotateCcw, Trash2, RefreshCw, RotateCw } from "lucide-react";
import { parserApi, categoriesApi, logsApi } from "@/lib/api";
import type { ParserJob, Category } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ParserPage() {
  const [config, setConfig] = useState({
    withPhotos: false,
    saveToDB: true,
    previewOnly: false,
    category: "",
    selectedCategoryIds: [] as number[],
    linkedOnly: false,
    productsPerCategory: 0,
    maxPages: 0,
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
        save_photos: config.withPhotos,
        save_to_db: config.saveToDB,
        no_details: config.previewOnly,
        linked_only: config.linkedOnly,
        products_per_category: config.productsPerCategory || undefined,
        max_pages: config.maxPages || undefined,
      };
      if (config.category) opts.category_slug = config.category;
      if (opts.type === "full" && config.selectedCategoryIds.length > 0) {
        opts.categories = config.selectedCategoryIds;
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
      toast.success("Failed jobs очищены");
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
      toast.success("Job возвращён в очередь");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  const progress = activeJob?.progress?.percent ?? 0;
  const totalProducts = activeJob?.progress?.products?.total ?? 0;
  const processedCount = activeJob?.progress?.products?.done ?? activeJob?.progress?.saved ?? 0;
  const lastFailed = statusData?.last_completed?.status === "failed";
  const statusBadge =
    isRunning ? (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse mr-1.5" />
        Парсер работает
      </Badge>
    ) : lastFailed ? (
      <Badge variant="destructive">Парсер: ошибка</Badge>
    ) : (
      <Badge variant="secondary">Парсер ожидает</Badge>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Управление парсером</h2>
        {statusBadge}
      </div>

      {/* Parser Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parser Control</CardTitle>
          {parserState && (
            <p className="text-sm text-muted-foreground">
              Статус: {parserState.status} | Последний старт: {parserState.last_start ? new Date(parserState.last_start).toLocaleString("ru") : "—"} | Последняя остановка: {parserState.last_stop ? new Date(parserState.last_stop).toLocaleString("ru") : "—"}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStartDaemon} disabled={daemonEnabled || isRunning} title="Start Parser (continuous)">
              <Play className="h-4 w-4 mr-1" />Start Parser
            </Button>
            <Button variant="destructive" disabled={!daemonEnabled && !isRunning} onClick={handleStop} title="Stop Parser">
              <Square className="h-4 w-4 mr-1" />Stop Parser
            </Button>
            <Button variant="outline" onClick={handlePause} disabled={!daemonEnabled && !isRunning} title="Pause Parser">
              <Pause className="h-4 w-4 mr-1" />Pause Parser
            </Button>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Один прогон (не daemon):</p>
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
          <CardHeader><CardTitle className="text-lg">Parser Diagnostics</CardTitle></CardHeader>
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
                <p className="text-muted-foreground">Failed jobs</p>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Tools */}
      <Card>
        <CardHeader><CardTitle className="text-lg">System Tools</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleQueueFlush} disabled={!!sysAction || isRunning} title="Reset Queue">
              <RotateCcw className="h-4 w-4 mr-1" />Reset Queue
            </Button>
            <Button variant="outline" onClick={handleClearFailedJobs} disabled={!!sysAction} title="Clear Failed Jobs">
              <Trash2 className="h-4 w-4 mr-1" />Clear Failed Jobs
            </Button>
            <Button variant="outline" onClick={handleQueueRestart} disabled={!!sysAction} title="Restart Workers">
              <RefreshCw className="h-4 w-4 mr-1" />Restart Workers
            </Button>
            <Button variant="outline" onClick={handleReleaseLock} disabled={!!sysAction || isRunning} title="Release lock">
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

      {/* Parser Errors (Failed Jobs) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parser Errors</CardTitle>
          <p className="text-sm text-muted-foreground">Последние 20 failed jobs</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">Queue</th>
                  <th className="p-2 text-left">Job</th>
                  <th className="p-2 text-left">Error</th>
                  <th className="p-2 text-right">Retry</th>
                </tr>
              </thead>
              <tbody>
                {(failedJobsData?.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Нет failed jobs</td></tr>
                )}
                {(failedJobsData?.data ?? []).map((job) => (
                  <tr key={job.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 whitespace-nowrap">{job.failed_at ? new Date(job.failed_at).toLocaleString("ru") : "—"}</td>
                    <td className="p-2">{job.queue ?? "—"}</td>
                    <td className="p-2 truncate max-w-[150px]" title={job.display_name}>{job.display_name ?? "—"}</td>
                    <td className="p-2 text-destructive text-xs max-w-[250px] truncate" title={job.exception ?? ""}>{job.exception ?? "—"}</td>
                    <td className="p-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRetryJob(job.id)}>
                        <RotateCw className="h-4 w-4 mr-1" />Retry
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Переключатели</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Парсить с фото</Label>
              <Switch checked={config.withPhotos} onCheckedChange={(v) => setConfig({ ...config, withPhotos: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Сохранять в БД</Label>
              <Switch checked={config.saveToDB} onCheckedChange={(v) => setConfig({ ...config, saveToDB: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Только предпросмотр</Label>
              <Switch checked={config.previewOnly} onCheckedChange={(v) => setConfig({ ...config, previewOnly: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Только связанные категории</Label>
              <Switch checked={config.linkedOnly} onCheckedChange={(v) => setConfig({ ...config, linkedOnly: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Фильтрация</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Одна категория (режим «категория»)</Label>
              <Select value={config.category || "all"} onValueChange={(v) => setConfig({ ...config, category: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Все категории" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Выбор категорий (полный режим)</Label>
              <p className="text-xs text-muted-foreground mb-2">Если выбраны — парсятся только они. Пусто = все включённые.</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto rounded border p-2">
                {categories.map((c) => {
                  const checked = config.selectedCategoryIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked ? config.selectedCategoryIds.filter((id) => id !== c.id) : [...config.selectedCategoryIds, c.id];
                          setConfig({ ...config, selectedCategoryIds: next });
                        }}
                      />
                      <span className="truncate max-w-[140px]">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Лимит товаров на категорию</Label>
              <Input type="number" min={0} value={config.productsPerCategory || ""} onChange={(e) => setConfig({ ...config, productsPerCategory: +e.target.value || 0 })} placeholder="0 = без лимита" />
            </div>
            <div>
              <Label>Макс. страниц на категорию</Label>
              <Input type="number" min={0} value={config.maxPages || ""} onChange={(e) => setConfig({ ...config, maxPages: +e.target.value || 0 })} placeholder="0 = без лимита" />
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
